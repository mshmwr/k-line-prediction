import { test, expect, Page } from '@playwright/test'

// ── Fixture helpers ──────────────────────────────────────────────────────────

/** Generate 24 hourly OHLC rows as a CSV string (unix seconds timestamp). */
function generateCsv(startUnixSec: number): string {
  const rows: string[] = []
  for (let i = 0; i < 24; i++) {
    const ts = startUnixSec + i * 3600
    const base = 2000 + i * 10
    rows.push(`${ts},${base},${base + 50},${base - 30},${base + 20}`)
  }
  return rows.join('\n')
}

// Two days of 24 × 1H bars (UTC seconds)
const CSV_DAY1 = generateCsv(1_704_067_200) // 2024-01-01 00:00 UTC
const CSV_DAY2 = generateCsv(1_704_153_600) // 2024-01-02 00:00 UTC

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
}

/** 48 non-null MA99 values; last value = 1897, formatted as "1,897.00". */
const QUERY_MA99 = Array.from({ length: 48 }, (_, i) => 1850 + i)

const MOCK_PREDICT_BASE = {
  matches: [
    {
      id: 'match-1',
      correlation: 0.95,
      historical_ohlc: [
        { open: 2000, high: 2100, low: 1950, close: 2050 },
        { open: 2050, high: 2150, low: 2000, close: 2100 },
      ],
      future_ohlc: [{ open: 2100, high: 2200, low: 2050, close: 2150 }],
      start_date: '2023-06-15 00:00',
      end_date: '2023-06-15 01:00',
      historical_ma99: [1900, 1910],
      future_ma99: [1920],
    },
  ],
  stats: MOCK_STATS,
  query_ma99: QUERY_MA99,
}

const MOCK_PREDICT_NO_GAP = { ...MOCK_PREDICT_BASE, query_ma99_gap: null }
const MOCK_PREDICT_WITH_GAP = {
  ...MOCK_PREDICT_BASE,
  query_ma99_gap: { from_date: '2024-01-01', to_date: '2024-01-10' },
}

// ── Shared helper ────────────────────────────────────────────────────────────

async function setupAndPredict(page: Page, predictResponse: object) {
  await page.route('/api/history-info', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_HISTORY_INFO) })
  )
  await page.route('/api/predict', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(predictResponse) })
  )

  await page.goto('/')

  // Upload two 24-row CSV files so ohlcComplete = true
  // The app has two file inputs; use [multiple] to target the official 2-day CSV input
  const fileInput = page.locator('input[type="file"][multiple]')
  await fileInput.setInputFiles([
    { name: 'day1.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV_DAY1) },
    { name: 'day2.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV_DAY2) },
  ])

  // Wait for the predict button to become enabled (ohlcComplete flips to true)
  await expect(page.getByRole('button', { name: /Start Prediction/ })).toBeEnabled({ timeout: 5000 })

  await page.getByRole('button', { name: /Start Prediction/ }).click()
}

// ── Tests ────────────────────────────────────────────────────────────────────

test('MainChart header shows MA99 value after prediction', async ({ page }) => {
  await setupAndPredict(page, MOCK_PREDICT_NO_GAP)

  // Last value of QUERY_MA99 is 1897 → formatted as "1,897.00"
  await expect(page.getByText(/MA\(99\)\s+1,897/)).toBeVisible({ timeout: 5000 })
})

test('MA99 gap warning banner is absent when query_ma99_gap is null', async ({ page }) => {
  await setupAndPredict(page, MOCK_PREDICT_NO_GAP)

  await expect(page.getByText(/MA99 資料缺失/)).not.toBeVisible()
})

test('MA99 gap warning banner appears when query_ma99_gap is present', async ({ page }) => {
  await setupAndPredict(page, MOCK_PREDICT_WITH_GAP)

  await expect(page.getByText(/MA99 資料缺失/)).toBeVisible({ timeout: 5000 })
  await expect(page.getByText(/2024-01-01 ~ 2024-01-10/)).toBeVisible()
})

test('expanding a match card renders the PredictorChart container', async ({ page }) => {
  await setupAndPredict(page, MOCK_PREDICT_NO_GAP)

  // Match list renders; click the accordion header to expand
  const matchHeader = page.getByText('r = 0.9500')
  await expect(matchHeader).toBeVisible({ timeout: 5000 })
  await matchHeader.click()

  // Chart container must be visible
  await expect(page.getByTestId('match-chart')).toBeVisible({ timeout: 5000 })
  // Split line is absolutely-positioned and may be clipped in headless viewport;
  // checking it is attached to the DOM confirms splitX was computed successfully.
  await expect(page.getByTestId('match-chart-split-line')).toHaveCount(1)
})
