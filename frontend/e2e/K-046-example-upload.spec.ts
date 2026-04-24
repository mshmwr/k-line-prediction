import { test, expect } from '@playwright/test'
import { mockApis } from './_fixtures/mock-apis.ts'

/**
 * K-046 Example CSV Download + Upload Round-Trip (AC-046-QA-3).
 *
 * 3 independent cases:
 *   T1  AC-046-EXAMPLE-1/-2  anchor rendered with correct href + download attrs
 *   T2  AC-046-EXAMPLE-2     GET /examples/ETHUSDT_1h_test.csv → 200, content-length 646
 *   T3  AC-046-EXAMPLE-3     mocked upload round-trip → toast renders /資料已是最新/
 *
 * LIFO mock ordering: `mockApis(page)` first (catch-all + history-info),
 * then register specific `/api/upload-history` route for T3.
 *
 * No hardcoded sleep. No Playwright projects beyond Chromium (per AC-046-QA-3
 * Known Gap GAP-3 — attribute-level assertion is decoupled from OS filename).
 */

const EXAMPLE_CSV_PATH = '/examples/ETHUSDT_1h_test.csv'
const EXAMPLE_CSV_NAME = 'ETHUSDT_1h_test.csv'
const EXPECTED_BYTES = 646

test.describe('K-046 example CSV download + upload round-trip', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('T1 AC-046-EXAMPLE-1/-2 — Download example link rendered with correct attrs', async ({ page }) => {
    await mockApis(page)
    await page.goto('/app')

    const link = page.getByRole('link', { name: /Download example/i })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', EXAMPLE_CSV_PATH)
    await expect(link).toHaveAttribute('download', EXAMPLE_CSV_NAME)
  })

  test('T2 AC-046-EXAMPLE-2 — /examples asset fetch returns 200 with 646B', async ({ page }) => {
    await mockApis(page)
    await page.goto('/app')

    const response = await page.request.get(EXAMPLE_CSV_PATH)
    expect(response.status()).toBe(200)
    const lengthHeader = response.headers()['content-length']
    // Vite dev server reliably sets content-length for static files in public/;
    // assert via header when present, body length as fallback.
    if (lengthHeader) {
      expect(parseInt(lengthHeader, 10)).toBe(EXPECTED_BYTES)
    }
    const body = await response.body()
    expect(body.length).toBe(EXPECTED_BYTES)
  })

  test('T3 AC-046-EXAMPLE-3 / AC-046-COMMENT-4 — mocked upload → toast /資料已是最新/', async ({ page }) => {
    await mockApis(page)

    // Register /api/upload-history mock AFTER mockApis so LIFO gives it priority
    await page.route('**/api/upload-history', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          filename: EXAMPLE_CSV_NAME,
          latest: null,
          bar_count: 1000,
          added_count: 0,
          timeframe: '1H',
        }),
      }),
    )

    await page.goto('/app')

    // Fetch the example CSV bytes via the Playwright page context, then upload
    // them back through the hidden <input type="file"> to exercise the round-trip.
    const assetResponse = await page.request.get(EXAMPLE_CSV_PATH)
    expect(assetResponse.status()).toBe(200)
    const csvBytes = await assetResponse.body()

    // /app has two file inputs (multi-select OHLC + History CSV). Target the
    // History CSV one via its label container (it is the singleton input
    // child of the `Upload History CSV` label).
    const historyLabel = page.locator('label', { hasText: 'Upload History CSV' })
    const fileInput = historyLabel.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: EXAMPLE_CSV_NAME,
      mimeType: 'text/csv',
      buffer: csvBytes,
    })

    // The toast component renders `addedCount === 0` informational branch:
    //   "資料已是最新，無需更新（共 1000 bars）"
    await expect(page.getByText(/資料已是最新/)).toBeVisible()
  })
})
