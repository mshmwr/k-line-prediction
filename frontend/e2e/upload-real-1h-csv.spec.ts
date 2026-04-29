import { test, expect, Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * AC-051-09 (K-051 Phase 3c) — Real 24-bar 1H CSV upload regression coverage.
 *
 * Drives the OFFICIAL INPUT section's hidden multi-select <input type="file"> via
 * Playwright `setInputFiles` (the proven pattern from `ma99-chart.spec.ts:163-168`,
 * NOT the K-046 history-reference upload pattern).
 *
 * Fixture is byte-identical to `backend/tests/fixtures/ETHUSDT-1h-2026-04-07-original.csv`
 * — same on-disk shape that the backend integration test parses, so this spec proves the
 * frontend parser tolerates the canonical Binance kline 12-column shape end-to-end.
 *
 * Mock constants below mirror frontend/e2e/ma99-chart.spec.ts:20-89 (canonical source).
 * Duplicated rather than cross-spec-imported per K-051 design doc §0 SQ-051-PHASE3-02
 * (Architect ruling: rule-of-three triggers extraction; two specs is verbatim copy).
 */

// ── Fixture bytes ────────────────────────────────────────────────────────────

// ESM scope — `__dirname` is not synthesized; resolve from import.meta.url per
// the project convention (`diary-homepage.spec.ts:9`, `diary-page.spec.ts:10`).
const __here = dirname(fileURLToPath(import.meta.url))
const REAL_1H_CSV_PATH = join(__here, 'fixtures', 'ETHUSDT-1h-2026-04-07.csv')
// KG-061-01: top-level readFileSync — fixture absence causes module parse failure (not per-test FAIL).
// If the fixture file is missing the entire spec fails to load, not at individual test runtime.
const REAL_1H_CSV_BYTES = readFileSync(REAL_1H_CSV_PATH)

// ── Mock payloads (mirrored verbatim from ma99-chart.spec.ts:20-89) ──────────

const MOCK_HISTORY_INFO = {
  '1H': { filename: 'test.csv', latest: '2024-01-01 00:00', bar_count: 1000 },
  '1D': { filename: 'test.csv', latest: '2024-01-01', bar_count: 500 },
}

const MOCK_STATS = {
  highest: {
    label: 'Highest', price: 2200, pct: 5, occurrence_bar: 3,
    occurrence_window: 1, historical_time: '2023-06-17 00:00',
  },
  second_highest: {
    label: '2nd High', price: 2150, pct: 3, occurrence_bar: 2,
    occurrence_window: 1, historical_time: '2023-06-16 00:00',
  },
  second_lowest: {
    label: '2nd Low', price: 1980, pct: -1, occurrence_bar: 1,
    occurrence_window: 1, historical_time: '2023-06-15 00:00',
  },
  lowest: {
    label: 'Lowest', price: 1950, pct: -3, occurrence_bar: 1,
    occurrence_window: 1, historical_time: '2023-06-15 00:00',
  },
  win_rate: 0.7,
  mean_correlation: 0.85,
  consensus_forecast_1h: [],
  consensus_forecast_1d: [],
}

/** 48 non-null MA99 values; last value = 1897, formatted as "1,897.00". */
const QUERY_MA99 = Array.from({ length: 48 }, (_, i) => 1850 + i)

const MOCK_MA99_RESPONSE = {
  query_ma99_1h: QUERY_MA99,
  query_ma99_gap_1h: null,
}

/**
 * `future_ohlc.length === 2` (B5 realism contract — `feedback_playwright_mock_realism.md`):
 * the `computeDisplayStats` code path requires `projectedFutureBars.length >= 2`; a 1-bar
 * mock silently falls back to `appliedData.stats`, bypassing the logic under test.
 *
 * Full PredictStats fields populated (no undefined-field crash on render).
 */
const MOCK_PREDICT_BASE = {
  matches: [
    {
      id: 'match-1',
      correlation: 0.95,
      historical_ohlc: [
        { open: 2000, high: 2100, low: 1950, close: 2050 },
        { open: 2050, high: 2150, low: 2000, close: 2100 },
      ],
      future_ohlc: [
        { open: 2100, high: 2200, low: 2050, close: 2150 },
        { open: 2150, high: 2250, low: 2100, close: 2200 },
      ],
      historical_ohlc_1d: [
        { time: '2023-06-15', open: 2000, high: 2150, low: 1950, close: 2100 },
      ],
      future_ohlc_1d: [
        { time: '2023-06-16', open: 2100, high: 2250, low: 2050, close: 2200 },
        { time: '2023-06-17', open: 2200, high: 2300, low: 2150, close: 2250 },
        { time: '2023-06-18', open: 2250, high: 2350, low: 2200, close: 2300 },
      ],
      start_date: '2023-06-15 00:00',
      end_date: '2023-06-15 01:00',
      historical_ma99: [1900, 1910],
      future_ma99: [1920],
      historical_ma99_1d: [1900],
      future_ma99_1d: [1910, 1920, 1930],
    },
  ],
  stats: MOCK_STATS,
  query_ma99_1h: QUERY_MA99,
}

// ── Shared helper ────────────────────────────────────────────────────────────

/**
 * Register all three predict-flow mocks (history-info, merge-and-compute-ma99, predict),
 * navigate to /app, upload the real fixture, and click Start Prediction.
 *
 * Single-file `setInputFiles` array — the fixture is one 24-row file ending at
 * 2026-04-07 (differs from `ma99-chart.spec.ts::setupAndPredict` which uploads two
 * 24-row files for a 48-bar 2-day input).
 */
async function uploadRealCsvAndPredict(page: Page) {
  await page.route('/api/history-info', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_HISTORY_INFO) })
  )
  await page.route('/api/merge-and-compute-ma99', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_MA99_RESPONSE) })
  )
  await page.route('/api/predict', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PREDICT_BASE) })
  )

  // Dismiss cookie consent banner before page load so it does not intercept pointer events.
  await page.addInitScript(() => { localStorage.setItem('kline-consent', 'granted') })
  await page.goto('/app')

  const fileInput = page.locator('input[type="file"][multiple]')
  await fileInput.setInputFiles([
    { name: 'ETHUSDT-1h-2026-04-07.csv', mimeType: 'text/csv', buffer: REAL_1H_CSV_BYTES },
  ])

  // Wait for the predict button to become enabled (maLoading resolves + ohlcComplete = true)
  await expect(page.getByRole('button', { name: /Start Prediction/ })).toBeEnabled({ timeout: 5000 })

  await page.getByRole('button', { name: /Start Prediction/ }).click()
}

// ── Tests ────────────────────────────────────────────────────────────────────

test('AC-051-09-UPLOAD-SUCCESS: real 24-bar 1H CSV uploads, predict succeeds, MainChart + MatchList render', async ({ page }) => {
  await uploadRealCsvAndPredict(page)

  // MatchList card visible — confirms /api/predict response was rendered.
  // r = 0.9500 mirrors MOCK_PREDICT_BASE.matches[0].correlation (0.95).
  await expect(page.getByText('r = 0.9500')).toBeVisible({ timeout: 5000 })

  // MainChart MA99 header value visible — confirms QUERY_MA99 fed through to render.
  // Last value of QUERY_MA99 is 1897 → formatted as "1,897.00".
  await expect(page.getByText(/MA\(99\)\s+1,897/)).toBeVisible({ timeout: 5000 })
})

test('AC-051-09-NO-ERROR-TOAST: post-upload error-toast bar must NOT be visible', async ({ page }) => {
  await uploadRealCsvAndPredict(page)

  // Wait for prediction to complete (chart rendered) so any parser/upload error would
  // already have surfaced. AppPage.tsx:349-353 renders the toast when errorMessage is set.
  await expect(page.getByText('r = 0.9500')).toBeVisible({ timeout: 5000 })

  // Negative assertion via stable data-testid (AC-051-11): toast must not render on a clean fixture.
  await expect(page.getByTestId('error-toast')).toHaveCount(0)
})

test('AC-051-09-NO-MA-HISTORY-MESSAGE: Sacred ma_history error message must not leak into DOM', async ({ page }) => {
  await uploadRealCsvAndPredict(page)

  // Wait for the predict round-trip to complete.
  await expect(page.getByText('r = 0.9500')).toBeVisible({ timeout: 5000 })

  // K-015 sacred / K-051 user-bug-class anchor: backend's "ma_history requires at least
  // 129 daily bars ending at that date" must not surface when DB is healthy. With mocked
  // /api/predict returning matches, this string should be absent from the DOM.
  // Case-insensitive flag /i is intentional — guards against any future i18n casing drift
  // while still flagging the substring stability that the K-051 user-retest SOP greps.
  await expect(page.getByText(/ma_history requires/i)).toHaveCount(0)
})
