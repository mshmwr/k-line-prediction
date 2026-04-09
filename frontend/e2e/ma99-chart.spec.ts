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

const MOCK_MA99_RESPONSE = {
  query_ma99: QUERY_MA99,
  query_ma99_gap: null,
}

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

/** Match with uptrend future_ma99 (10 values, 1900→1990, slope > 0, pct ≈ +4.74%) */
const MOCK_PREDICT_WITH_UPTREND = {
  ...MOCK_PREDICT_BASE,
  matches: [
    {
      ...MOCK_PREDICT_BASE.matches[0],
      future_ma99: Array.from({ length: 10 }, (_, i) => 1900 + i * 10),
    },
  ],
  query_ma99_gap: null,
}

/** Match with downtrend future_ma99 (10 values, 1990→1900, slope < 0, pct ≈ -4.52%) */
const MOCK_PREDICT_WITH_DOWNTREND = {
  ...MOCK_PREDICT_BASE,
  matches: [
    {
      ...MOCK_PREDICT_BASE.matches[0],
      future_ma99: Array.from({ length: 10 }, (_, i) => 1990 - i * 10),
    },
  ],
  query_ma99_gap: null,
}

const MOCK_PREDICT_NO_GAP = { ...MOCK_PREDICT_BASE, query_ma99_gap: null }
const MOCK_PREDICT_NATIVE_1D = {
  matches: [
    {
      id: 'match-1d',
      correlation: 0.93,
      historical_ohlc: [
        { time: '2023-06-13', open: 2000, high: 2100, low: 1950, close: 2050 },
        { time: '2023-06-14', open: 2050, high: 2150, low: 2000, close: 2100 },
      ],
      future_ohlc: [
        { time: '2023-06-15', open: 2100, high: 2200, low: 2050, close: 2150 },
      ],
      start_date: '2023-06-13',
      end_date: '2023-06-15',
      historical_ma99: [1900, 1910],
      future_ma99: [1920],
    },
  ],
  stats: MOCK_STATS,
  query_ma99: [1880, 1890],
  query_ma99_gap: null,
}
const MOCK_PREDICT_WITH_GAP = {
  ...MOCK_PREDICT_BASE,
  query_ma99_gap: { from_date: '2024-01-01', to_date: '2024-01-10' },
}

// ── Shared helper ────────────────────────────────────────────────────────────

async function setupAndPredict(
  page: Page,
  predictResponse: object,
  ma99Response: object = MOCK_MA99_RESPONSE,
) {
  await page.route('/api/history-info', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_HISTORY_INFO) })
  )
  await page.route('/api/merge-and-compute-ma99', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ma99Response) })
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

  // Wait for the predict button to become enabled (maLoading resolves + ohlcComplete = true)
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

// ── Early MA99 flow ──────────────────────────────────────────────────────────

test('predict button is disabled with maLoading tooltip while MA99 is computing', async ({ page }) => {
  let resolveMA99: ((value: unknown) => void) | null = null
  const ma99Pending = new Promise(resolve => { resolveMA99 = resolve })

  await page.route('/api/history-info', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_HISTORY_INFO) })
  )
  await page.route('/api/merge-and-compute-ma99', async route => {
    await ma99Pending
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_MA99_RESPONSE) })
  })

  await page.goto('/')

  const fileInput = page.locator('input[type="file"][multiple]')
  await fileInput.setInputFiles([
    { name: 'day1.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV_DAY1) },
    { name: 'day2.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV_DAY2) },
  ])

  // Button should be disabled while MA99 is loading
  const predictBtn = page.getByRole('button', { name: /Start Prediction/ })
  await expect(predictBtn).toBeDisabled({ timeout: 3000 })
  await expect(predictBtn).toHaveAttribute('title', 'MA99 計算中，請稍候…')

  // Unblock the MA99 response
  resolveMA99!(undefined)

  // Button should become enabled after MA99 resolves
  await expect(predictBtn).toBeEnabled({ timeout: 5000 })
})

test('MainChart shows MA99 計算中 label while loading, then value after load', async ({ page }) => {
  let resolveMA99: ((value: unknown) => void) | null = null
  const ma99Pending = new Promise(resolve => { resolveMA99 = resolve })

  await page.route('/api/history-info', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_HISTORY_INFO) })
  )
  await page.route('/api/merge-and-compute-ma99', async route => {
    await ma99Pending
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_MA99_RESPONSE) })
  })

  await page.goto('/')

  const fileInput = page.locator('input[type="file"][multiple]')
  await fileInput.setInputFiles([
    { name: 'day1.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV_DAY1) },
    { name: 'day2.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV_DAY2) },
  ])

  // Loading label should appear
  await expect(page.getByText('MA(99) 計算中…')).toBeVisible({ timeout: 3000 })

  // Unblock
  resolveMA99!(undefined)

  // Loading label disappears, value appears
  await expect(page.getByText('MA(99) 計算中…')).not.toBeVisible({ timeout: 5000 })
  await expect(page.getByText(/MA\(99\)\s+1,897/)).toBeVisible({ timeout: 3000 })
})

// ── MatchList Trend Labels ───────────────────────────────────────────────────

test('MatchList card shows uptrend label after prediction with rising future MA99', async ({ page }) => {
  await setupAndPredict(page, MOCK_PREDICT_WITH_UPTREND)

  // Trend label should show ↑ with positive percentage
  // valid[0]=1900, valid[9]=1990 → pct = (1990-1900)/1900*100 ≈ 4.74%
  await expect(page.getByText(/↑\s+\+4\.74%/)).toBeVisible({ timeout: 5000 })
})

test('MatchList card shows downtrend label after prediction with falling future MA99', async ({ page }) => {
  await setupAndPredict(page, MOCK_PREDICT_WITH_DOWNTREND)

  // valid[0]=1990, valid[9]=1900 → pct = (1900-1990)/1990*100 ≈ -4.52%
  await expect(page.getByText(/↓\s+-4\.52%/)).toBeVisible({ timeout: 5000 })
})

test('MatchList card shows no trend label when future_ma99 has fewer than 2 values', async ({ page }) => {
  // MOCK_PREDICT_NO_GAP has future_ma99: [1920] → only 1 value, no trend
  await setupAndPredict(page, MOCK_PREDICT_NO_GAP)

  await expect(page.getByText(/↑|↓/)).not.toBeVisible()
})

test('shared 1D toggle sends native 1D timeframe to MA99 and predict APIs', async ({ page }) => {
  let ma99Timeframe = ''
  let predictTimeframe = ''

  await page.route('/api/history-info', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_HISTORY_INFO) })
  )
  await page.route('/api/merge-and-compute-ma99', async route => {
    const body = route.request().postDataJSON() as { timeframe?: string }
    ma99Timeframe = body.timeframe ?? ''
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_MA99_RESPONSE) })
  })
  await page.route('/api/predict', async route => {
    const body = route.request().postDataJSON() as { timeframe?: string }
    predictTimeframe = body.timeframe ?? ''
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PREDICT_NO_GAP) })
  })

  await page.goto('/')

  const fileInput = page.locator('input[type="file"][multiple]')
  await fileInput.setInputFiles([
    { name: 'day1.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV_DAY1) },
    { name: 'day2.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV_DAY2) },
  ])

  await page.getByRole('button', { name: '1D' }).click()
  await expect.poll(() => ma99Timeframe).toBe('1D')

  await page.getByRole('button', { name: /Start Prediction/ }).click()
  await expect.poll(() => predictTimeframe).toBe('1D')
})

test('Statistics shows both Consensus Forecast (1H) and Consensus Forecast (1D)', async ({ page }) => {
  await setupAndPredict(page, MOCK_PREDICT_NO_GAP)

  await expect(page.getByText('Consensus Forecast (1H)')).toBeVisible()
  await expect(page.getByText('Consensus Forecast (1D)')).toBeVisible()
})

test('shared 1D toggle updates match list header to date-only display', async ({ page }) => {
  await page.route('/api/history-info', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_HISTORY_INFO) })
  )
  await page.route('/api/merge-and-compute-ma99', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ query_ma99: [1880, 1890], query_ma99_gap: null }) })
  )
  await page.route('/api/predict', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PREDICT_NATIVE_1D) })
  )

  await page.goto('/')

  const fileInput = page.locator('input[type="file"][multiple]')
  await fileInput.setInputFiles([
    { name: 'day1.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV_DAY1) },
    { name: 'day2.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV_DAY2) },
  ])

  await page.getByRole('button', { name: '1D' }).click()
  await page.getByRole('button', { name: /Start Prediction/ }).click()

  await expect(page.getByRole('button', { name: '1D' })).toHaveClass(/bg-orange-500\/15/)
  await expect(page.getByText('2023-06-13 ~ 2023-06-15')).toBeVisible()
})
