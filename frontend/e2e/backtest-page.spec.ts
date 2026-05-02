import { test, expect } from '@playwright/test'

// K-081 — /backtest route E2E spec
// All Firestore REST calls are intercepted by page.route() + route.fulfill()
// No live network calls in tests (AC-081-PLAYWRIGHT-SPEC)

// ─── Mock payloads ─────────────────────────────────────────────────────────────

const mockSummaryResponse = {
  documents: [
    {
      name: 'projects/k-line-prediction/databases/(default)/documents/backtest_summaries/2026-05-02',
      fields: {
        hit_rate_high: { doubleValue: 0.75 },
        hit_rate_low: { doubleValue: 0.68 },
        avg_mae: { doubleValue: 12.3456 },
        avg_rmse: { doubleValue: 15.6789 },
        sample_size: { integerValue: '28' },
        window_days: { integerValue: '30' },
        computed_at: { stringValue: '2026-05-02T04:00:00Z' },
        per_trend: {
          mapValue: {
            fields: {
              up: {
                mapValue: {
                  fields: {
                    hit_rate_high: { doubleValue: 0.80 },
                    hit_rate_low: { doubleValue: 0.72 },
                    avg_mae: { doubleValue: 11.1111 },
                    sample_size: { integerValue: '14' },
                  },
                },
              },
              down: {
                mapValue: {
                  fields: {
                    hit_rate_high: { doubleValue: 0.65 },
                    hit_rate_low: { doubleValue: 0.60 },
                    avg_mae: { doubleValue: 14.2222 },
                    sample_size: { integerValue: '10' },
                  },
                },
              },
              flat: {
                mapValue: {
                  fields: {
                    hit_rate_high: { doubleValue: 0.50 },
                    hit_rate_low: { doubleValue: 0.50 },
                    avg_mae: { doubleValue: 13.3333 },
                    sample_size: { integerValue: '4' },
                  },
                },
              },
            },
          },
        },
      },
    },
  ],
}

const mockParamsResponse = {
  name: 'projects/k-line-prediction/databases/(default)/documents/predictor_params/active',
  fields: {
    window_days: { integerValue: '30' },
    pearson_threshold: { doubleValue: 0.4 },
    top_k: { integerValue: '10' },
    optimized_at: { nullValue: null },
  },
}

// Two predictions + matching actuals for chart
const mockRunQueryPredictions = [
  {
    document: {
      name: 'projects/k-line-prediction/databases/(default)/documents/predictions/2026-05-01-04',
      fields: {
        params_hash: { stringValue: 'abc123' },
        projected_high: { doubleValue: 3200 },
        projected_low: { doubleValue: 3100 },
        projected_median: { doubleValue: 3150 },
        top_k_count: { integerValue: '10' },
        trend: { stringValue: 'up' },
        query_ts: { stringValue: '2026-05-01T04:00:00Z' },
        created_at: { stringValue: '2026-05-01T04:01:00Z' },
      },
    },
  },
  {
    document: {
      name: 'projects/k-line-prediction/databases/(default)/documents/predictions/2026-05-02-04',
      fields: {
        params_hash: { stringValue: 'abc123' },
        projected_high: { doubleValue: 3300 },
        projected_low: { doubleValue: 3200 },
        projected_median: { doubleValue: 3250 },
        top_k_count: { integerValue: '10' },
        trend: { stringValue: 'up' },
        query_ts: { stringValue: '2026-05-02T04:00:00Z' },
        created_at: { stringValue: '2026-05-02T04:01:00Z' },
      },
    },
  },
]

const mockRunQueryActuals = [
  {
    document: {
      name: 'projects/k-line-prediction/databases/(default)/documents/actuals/2026-05-01-04',
      fields: {
        high_hit: { booleanValue: true },
        low_hit: { booleanValue: false },
        mae: { doubleValue: 11.1 },
        rmse: { doubleValue: 14.2 },
        actual_high: { doubleValue: 3210 },
        actual_low: { doubleValue: 3090 },
        computed_at: { stringValue: '2026-05-04T04:00:00Z' },
      },
    },
  },
  {
    document: {
      name: 'projects/k-line-prediction/databases/(default)/documents/actuals/2026-05-02-04',
      fields: {
        high_hit: { booleanValue: true },
        low_hit: { booleanValue: true },
        mae: { doubleValue: 10.5 },
        rmse: { doubleValue: 13.8 },
        actual_high: { doubleValue: 3320 },
        actual_low: { doubleValue: 3180 },
        computed_at: { stringValue: '2026-05-05T04:00:00Z' },
      },
    },
  },
]

// ─── Route mock helper ─────────────────────────────────────────────────────────

async function mockFirestore(page: import('@playwright/test').Page) {
  await page.route('**/firestore.googleapis.com/**', async (route) => {
    const url = route.request().url()
    const method = route.request().method()

    if (method === 'POST' && url.includes('runQuery')) {
      // Determine collection from the request body
      const body = route.request().postData() ?? ''
      if (body.includes('"predictions"')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockRunQueryPredictions),
        })
      } else if (body.includes('"actuals"')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockRunQueryActuals),
        })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      }
    } else if (url.includes('/backtest_summaries')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSummaryResponse),
      })
    } else if (url.includes('/predictor_params/active')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockParamsResponse),
      })
    } else {
      await route.continue()
    }
  })
}

// ─── Test cases ────────────────────────────────────────────────────────────────

test.describe('AC-081-PLAYWRIGHT-SPEC — /backtest route', () => {
  // Case 1: route renders without console error; all 4 testids present + chart dimensions
  test('case 1: all 4 section testids present and chart has non-zero dimensions', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await mockFirestore(page)
    await page.goto('/backtest')

    await expect(page.getByTestId('backtest-summary-card')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('per-trend-table')).toBeVisible()
    await expect(page.getByTestId('time-series-chart')).toBeVisible()
    await expect(page.getByTestId('active-params-card')).toBeVisible()

    // Chart container must have non-zero dimensions (AC-081-TIME-SERIES-CHART)
    const chartBox = await page.getByTestId('time-series-chart').boundingBox()
    expect(chartBox).not.toBeNull()
    expect(chartBox!.width).toBeGreaterThanOrEqual(600)
    expect(chartBox!.height).toBeGreaterThanOrEqual(240)

    // No console errors
    expect(consoleErrors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0)
  })

  // Case 2: per-trend table has exactly 3 data rows in order up → down → flat
  test('case 2: per-trend table has 3 rows in order up → down → flat', async ({ page }) => {
    await mockFirestore(page)
    await page.goto('/backtest')
    await expect(page.getByTestId('per-trend-table')).toBeVisible({ timeout: 10000 })

    const rows = page.getByTestId('per-trend-table').locator('tbody tr')
    await expect(rows).toHaveCount(3)

    const firstCell = rows.nth(0).locator('td').first()
    const secondCell = rows.nth(1).locator('td').first()
    const thirdCell = rows.nth(2).locator('td').first()
    await expect(firstCell).toHaveText('up', { exact: true })
    await expect(secondCell).toHaveText('down', { exact: true })
    await expect(thirdCell).toHaveText('flat', { exact: true })
  })

  // Case 3: loading state — summary-card-loading visible during Firestore delay
  test('case 3: loading state shows summary-card-loading while fetch is pending', async ({ page }) => {
    // Mock with 600ms delay so we can catch the loading state
    await page.route('**/firestore.googleapis.com/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 600))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSummaryResponse),
      })
    })

    await page.goto('/backtest')
    // Loading skeleton should be immediately visible before fetch resolves
    await expect(page.getByTestId('summary-card-loading')).toBeVisible({ timeout: 2000 })
  })

  // Case 4: error state — summary-card-error visible when fetch fails twice
  test('case 4: error state shows summary-card-error when Firestore fetch fails', async ({ page }) => {
    // Mock all Firestore requests to fail with 500
    await page.route('**/firestore.googleapis.com/**', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"Internal"}' })
    })

    await page.goto('/backtest')
    // After retry (5s delay in hook), error state should appear — use extended timeout
    await expect(page.getByTestId('summary-card-error')).toBeVisible({ timeout: 15000 })
    // Error message should contain some text (the hook sets error = HTTP 500 message)
    const errorEl = page.getByTestId('summary-card-error')
    const errorText = await errorEl.textContent()
    expect(errorText).toBeTruthy()
    expect(errorText!.length).toBeGreaterThan(0)
  })
})
