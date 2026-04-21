import { test, expect, Page } from '@playwright/test'

/**
 * AC-013-APPPAGE-E2E — Consensus Stats SSOT chart visibility across selection states.
 *
 * Round 1 regression (Critical C-1): full-set displayStats branch dropped the
 * unconditional `consensusForecast1h/1d` injection, causing
 * `stats.consensusForecast1h.length === 0` → StatsProjectionChart rendered its
 * "Forecast unavailable" fallback instead of the chart.
 *
 * This spec locks the *observable behavior* (not the implementation path) per
 * §Pure-Refactor Behavior Diff Gate 3 — shared-title dual-side assertion:
 * both the chart branch and the fallback branch render the same title text
 * "Consensus Forecast (1H)", so a title-only assertion cannot tell the two
 * branches apart. Every case below asserts positive + negative.
 *
 *   - Case A (full-set, bars>=2)     → chart visible,   fallback NOT visible
 *   - Case B (subset, bars>=2)       → chart visible,   fallback NOT visible
 *   - Case C (empty matches backend) → fallback visible, chart NOT visible
 *   - Case D (1-bar future_ohlc fallback path / util throw)
 *                                    → fallback visible, chart NOT visible
 *
 * Case D note: the literal "UI deselect-all → fallback" scenario is unreachable
 * through the current production UI (PredictButton disables when
 * tempSelection.size === 0; the only path that commits empty-selection to
 * `appliedSelection` is re-clicking PredictButton with an unchanged-inputs
 * shortcut, which the disabled button blocks). Case D therefore exercises the
 * *same displayStats "empty result" branch* via the util-throw path: a backend
 * response where `future_ohlc` has only 1 bar → `projectedFutureBars.length < 2`
 * → `computeStatsFromMatches` throws → catch block returns `emptyResult` →
 * StatsProjectionChart fallback. Both deselect-all and 1-bar-future collapse
 * into the same emptyResult branch, so asserting the observable fallback here
 * covers the spec's intent.
 */

// ── Fixture helpers (mirrors ma99-chart.spec.ts mock realism) ────────────────

function generateCsv(startUnixSec: number): string {
  const rows: string[] = []
  for (let i = 0; i < 24; i++) {
    const ts = startUnixSec + i * 3600
    const base = 2000 + i * 10
    rows.push(`${ts},${base},${base + 50},${base - 30},${base + 20}`)
  }
  return rows.join('\n')
}

const CSV_DAY1 = generateCsv(1_704_067_200)
const CSV_DAY2 = generateCsv(1_704_153_600)

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
  // Intentionally empty — production backend also returns []. The frontend
  // projectedFutureBars useMemo is the SSOT that fills the consensus chart.
  consensus_forecast_1h: [],
  consensus_forecast_1d: [],
}

const QUERY_MA99 = Array.from({ length: 48 }, (_, i) => 1850 + i)

const MOCK_MA99_RESPONSE = {
  query_ma99_1h: QUERY_MA99,
  query_ma99_gap_1h: null,
}

/** Two matches so Case B (deselect one) still leaves >=1 active match. */
const MOCK_PREDICT_TWO_MATCHES = {
  matches: [
    {
      id: 'match-1',
      correlation: 0.95,
      historical_ohlc: [
        { open: 2000, high: 2100, low: 1950, close: 2050 },
        { open: 2050, high: 2150, low: 2000, close: 2100 },
      ],
      // >=2 future bars → projectedFutureBars.length >= 2 → hits computeStatsFromMatches
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
      ],
      start_date: '2023-06-15 00:00',
      end_date: '2023-06-15 01:00',
      historical_ma99: [1900, 1910],
      future_ma99: [1920, 1930],
      historical_ma99_1d: [1900],
      future_ma99_1d: [1910, 1920],
    },
    {
      id: 'match-2',
      correlation: 0.9,
      historical_ohlc: [
        { open: 2010, high: 2110, low: 1960, close: 2060 },
        { open: 2060, high: 2160, low: 2010, close: 2110 },
      ],
      future_ohlc: [
        { open: 2110, high: 2210, low: 2060, close: 2160 },
        { open: 2160, high: 2260, low: 2110, close: 2210 },
      ],
      historical_ohlc_1d: [
        { time: '2023-07-15', open: 2010, high: 2160, low: 1960, close: 2110 },
      ],
      future_ohlc_1d: [
        { time: '2023-07-16', open: 2110, high: 2260, low: 2060, close: 2210 },
        { time: '2023-07-17', open: 2210, high: 2310, low: 2160, close: 2260 },
      ],
      start_date: '2023-07-15 00:00',
      end_date: '2023-07-15 01:00',
      historical_ma99: [1905, 1915],
      future_ma99: [1925, 1935],
      historical_ma99_1d: [1905],
      future_ma99_1d: [1915, 1925],
    },
  ],
  stats: MOCK_STATS,
  query_ma99_1h: QUERY_MA99,
  query_ma99_gap_1h: null,
}

const MOCK_PREDICT_EMPTY_MATCHES = {
  matches: [],
  stats: MOCK_STATS,
  query_ma99_1h: QUERY_MA99,
  query_ma99_gap_1h: null,
}

/** Single match with only 1 future_ohlc bar → projectedFutureBars.length < 2 → util throws. */
const MOCK_PREDICT_ONE_FUTURE_BAR = {
  matches: [
    {
      id: 'match-short',
      correlation: 0.95,
      historical_ohlc: [
        { open: 2000, high: 2100, low: 1950, close: 2050 },
        { open: 2050, high: 2150, low: 2000, close: 2100 },
      ],
      future_ohlc: [
        { open: 2100, high: 2200, low: 2050, close: 2150 },
      ],
      historical_ohlc_1d: [
        { time: '2023-06-15', open: 2000, high: 2150, low: 1950, close: 2100 },
      ],
      future_ohlc_1d: [
        { time: '2023-06-16', open: 2100, high: 2250, low: 2050, close: 2200 },
      ],
      start_date: '2023-06-15 00:00',
      end_date: '2023-06-15 01:00',
      historical_ma99: [1900, 1910],
      future_ma99: [1920],
      historical_ma99_1d: [1900],
      future_ma99_1d: [1910],
    },
  ],
  stats: MOCK_STATS,
  query_ma99_1h: QUERY_MA99,
  query_ma99_gap_1h: null,
}

// ── Shared setup helper ──────────────────────────────────────────────────────

async function setupAndPredict(page: Page, predictResponse: object) {
  await page.route('/api/history-info', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_HISTORY_INFO) })
  )
  await page.route('/api/merge-and-compute-ma99', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_MA99_RESPONSE) })
  )
  await page.route('/api/predict', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(predictResponse) })
  )

  await page.goto('/app')

  const fileInput = page.locator('input[type="file"][multiple]')
  await fileInput.setInputFiles([
    { name: 'day1.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV_DAY1) },
    { name: 'day2.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV_DAY2) },
  ])

  await expect(page.getByRole('button', { name: /Start Prediction/ })).toBeEnabled({ timeout: 5000 })
  await page.getByRole('button', { name: /Start Prediction/ }).click()
}

// ── Tests ────────────────────────────────────────────────────────────────────

test('Case A — full-set: Consensus Forecast (1H) chart visible, fallback not visible', async ({ page }) => {
  await setupAndPredict(page, MOCK_PREDICT_TWO_MATCHES)

  // After prediction, appliedSelection = all match ids (full-set). Consensus
  // chart must render with the dedicated data-testid container from
  // StatsProjectionChart.
  await expect(page.getByText('Consensus Forecast (1H)')).toBeVisible({ timeout: 5000 })
  await expect(page.getByTestId('stats-projection-chart-1h')).toBeVisible()

  // Negative assertion — fallback branch must NOT render (shares the same title,
  // a title-only check would pass even when the chart is silently gone).
  await expect(page.getByText(/Forecast unavailable until prediction results are ready\./))
    .not.toBeVisible()
})

test('Case B — subset (deselect one of two matches then re-apply): chart visible, fallback not visible', async ({ page }) => {
  await setupAndPredict(page, MOCK_PREDICT_TWO_MATCHES)

  // Wait for both match cards, then uncheck the second (tempSelection subset).
  await expect(page.getByText('r = 0.9500')).toBeVisible({ timeout: 5000 })
  await expect(page.getByText('r = 0.9000')).toBeVisible()

  const matchCheckboxes = page.locator('input[type="checkbox"]')
  await matchCheckboxes.nth(1).uncheck()

  // Re-click Start Prediction — inputs unchanged, stats exist → handlePredict
  // short-circuits to `setAppliedSelection(new Set(tempSelection))` (no API
  // call). appliedSelection is now a subset of appliedData.matches.
  await page.getByRole('button', { name: /Start Prediction/ }).click()

  await expect(page.getByText('Consensus Forecast (1H)')).toBeVisible({ timeout: 5000 })
  await expect(page.getByTestId('stats-projection-chart-1h')).toBeVisible()
  await expect(page.getByText(/Forecast unavailable until prediction results are ready\./))
    .not.toBeVisible()
})

test('Case C — empty matches response: fallback visible, chart not visible', async ({ page }) => {
  await setupAndPredict(page, MOCK_PREDICT_EMPTY_MATCHES)

  // No matches → displayStats workspace emits emptyResult.projectedFutureBars=[]
  // → StatsProjectionChart renders "Forecast unavailable" fallback for both 1H
  // and 1D (use .first() to pick the 1H one deterministically).
  await expect(page.getByText(/Forecast unavailable until prediction results are ready\./)
    .first()).toBeVisible({ timeout: 5000 })

  // Negative assertion — the 1H chart container (data-testid) must NOT render.
  await expect(page.getByTestId('stats-projection-chart-1h')).not.toBeVisible()
})

test('Case D — projectedFutureBars.length < 2 (util throw) fallback: fallback visible, chart not visible', async ({ page }) => {
  // Backend returns a match with only 1 future_ohlc bar. In workspace useMemo,
  // computeStatsFromMatches throws (need >=2 bars for median computation) →
  // catch block triggers the dev-mode console.warn (Fix 2) and returns
  // emptyResult → StatsProjectionChart renders the fallback. This is the same
  // "empty-result" branch as the literal UI deselect-all scenario (which is
  // unreachable through current UI because PredictButton disables when
  // tempSelection is empty, blocking the appliedSelection-empty commit path).
  await setupAndPredict(page, MOCK_PREDICT_ONE_FUTURE_BAR)

  // Wait for match list to confirm prediction completed, then assert fallback.
  await expect(page.getByText('r = 0.9500')).toBeVisible({ timeout: 5000 })

  await expect(page.getByText(/Forecast unavailable until prediction results are ready\./)
    .first()).toBeVisible({ timeout: 5000 })

  await expect(page.getByTestId('stats-projection-chart-1h')).not.toBeVisible()
})
