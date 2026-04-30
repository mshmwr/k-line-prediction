import { test, expect } from '@playwright/test'
import { mockApis } from './_fixtures/mock-apis.ts'

/**
 * K-046 Phase 2 — Example CSV Download + `/app` UI Restructure.
 *
 * Superseded Phase 1 T3 (mocked upload round-trip) is REMOVED — the upload
 * `<label>` + `<input>` no longer render post-Phase-2 (see design doc §2.3 /
 * §10.5). AC-046-PHASE2-UI-UPLOAD-HIDDEN now covers that surface negatively.
 *
 * 8 cases total (2 updated + 6 new):
 *   T1  AC-046-EXAMPLE-1/-2 (updated)           link attrs under new scope
 *   T2  AC-046-EXAMPLE-2   (updated)            /examples/* bytes == new fixture size
 *   T3  AC-046-PHASE2-UI-LINK-MOVED (case A)    link INSIDE official-input-expected-format
 *   T4  AC-046-PHASE2-UI-LINK-MOVED (case B)    link NOT INSIDE history-reference-section
 *   T5  AC-046-PHASE2-UI-UPLOAD-HIDDEN          no Upload History CSV label / input
 *   T6  AC-046-PHASE2-HISTORY-LABEL-KEPT        "History Reference" label visible + scoped
 *   T7  AC-046-PHASE2-HISTORY-INFO-RENDERS      mocked /api/history-info → filename renders
 *   T8  AC-046-PHASE2-UI-LINK-MOVED (computed)  font-size ≥ 12px + color ≥ gray-400
 *
 * LIFO mock ordering: `mockApis(page)` first (catch-all + default history-info),
 * then specific overrides if any.
 */

const EXAMPLE_CSV_PATH = '/examples/ETHUSDT_1h_test.csv'
const EXAMPLE_CSV_NAME = 'ETHUSDT_1h_test.csv'
// Phase 2 fixture refresh (24-row 12-col Binance raw klines, headerless).
// Probed via `stat -f%z frontend/public/examples/ETHUSDT_1h_test.csv`.
const EXPECTED_BYTES = 3926

function parseRgbTriplet(color: string): [number, number, number] | null {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return null
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

test.describe('K-046 Phase 2 — example download + UI restructure', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('T1 AC-046-EXAMPLE-1/-2 — Download example link rendered with correct attrs', async ({ page }) => {
    await mockApis(page)
    await page.goto('/app')

    const link = page.getByRole('link', { name: /Download example/i })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', EXAMPLE_CSV_PATH)
    await expect(link).toHaveAttribute('download', EXAMPLE_CSV_NAME)
  })

  test(`T2 AC-046-EXAMPLE-2 — /examples asset fetch returns 200 with ${EXPECTED_BYTES}B`, async ({ page }) => {
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

  test('T3 AC-046-PHASE2-UI-LINK-MOVED (case A) — link lives inside official-input-expected-format scope', async ({ page }) => {
    await mockApis(page)
    await page.goto('/app')

    const scopedLink = page
      .locator('[data-testid="official-input-expected-format"]')
      .locator('a[download]')
    await expect(scopedLink).toHaveCount(1)
    await expect(scopedLink).toHaveAttribute('href', EXAMPLE_CSV_PATH)
    await expect(scopedLink).toHaveAttribute('download', EXAMPLE_CSV_NAME)
  })

  test('T4 AC-046-PHASE2-UI-LINK-MOVED (case B) — link is NOT inside history-reference-section scope', async ({ page }) => {
    await mockApis(page)
    await page.goto('/app')

    const strayLink = page
      .locator('[data-testid="history-reference-section"]')
      .locator('a[download]')
    await expect(strayLink).toHaveCount(0)

    const strayByText = page
      .locator('[data-testid="history-reference-section"]')
      .getByText(/Download example/i)
    await expect(strayByText).toHaveCount(0)
  })

  test('T5 AC-046-PHASE2-UI-UPLOAD-HIDDEN — Upload History CSV input + label removed', async ({ page }) => {
    await mockApis(page)
    await page.goto('/app')

    const historyFileInput = page.locator(
      '[data-testid="history-reference-section"] input[type="file"][accept*=".csv"]',
    )
    await expect(historyFileInput).toHaveCount(0)

    const uploadLabel = page.getByText(/Upload History CSV/i)
    await expect(uploadLabel).toHaveCount(0)

    const uploadingState = page.getByText(/上傳中/)
    await expect(uploadingState).toHaveCount(0)
  })

  test('T6 AC-046-PHASE2-HISTORY-LABEL-KEPT — "History Reference" label preserved inside section scope', async ({ page }) => {
    await mockApis(page)
    await page.goto('/app')

    const label = page.getByText('History Reference', { exact: true })
    await expect(label).toHaveCount(1)
    await expect(label).toBeVisible()

    const scopedLabel = page
      .locator('[data-testid="history-reference-section"]')
      .getByText('History Reference', { exact: true })
    await expect(scopedLabel).toHaveCount(1)
  })

  test('T7 AC-046-PHASE2-HISTORY-INFO-RENDERS — historyInfo filename renders after mocked /api/history-info', async ({ page }) => {
    // Explicit mock override so the filename assertion is not dependent on the
    // default `test.csv` shape from `mockApis`.
    await mockApis(page)
    await page.route('/api/history-info', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          '1H': { filename: 'Binance_ETHUSDT_1h.csv', latest: '2026-04-08 23:00', bar_count: 73990 },
          '1D': { filename: 'Binance_ETHUSDT_1d.csv', latest: '2026-04-08', bar_count: 3080 },
        }),
      }),
    )
    await page.goto('/app')

    const filenameText = page
      .locator('[data-testid="history-reference-section"]')
      .getByText(/Binance_ETHUSDT_1h\.csv/)
    await expect(filenameText).toBeVisible()

    const loadingText = page
      .locator('[data-testid="history-reference-section"]')
      .getByText('Loading...', { exact: true })
    await expect(loadingText).toHaveCount(0)
  })

  test('T8 AC-046-PHASE2-UI-LINK-MOVED (computed) — link font-size ≥ 12px + color ≥ gray-400', async ({ page }) => {
    await mockApis(page)
    await page.goto('/app')

    const link = page
      .locator('[data-testid="official-input-expected-format"]')
      .locator('a[download]')
    await expect(link).toHaveCount(1)

    const fontSizePx = await link.evaluate(el => parseFloat(window.getComputedStyle(el).fontSize))
    expect(fontSizePx).toBeGreaterThanOrEqual(12)

    const colorString = await link.evaluate(el => window.getComputedStyle(el).color)
    const rgb = parseRgbTriplet(colorString)
    expect(rgb).not.toBeNull()
    // text-gray-400 = rgb(156, 163, 175). Per-channel floor (lighter = larger
    // r/g/b); assert every channel is ≥ 156 / 163 / 175 respectively so
    // regressions to text-gray-500 (rgb(107, 114, 128)) are caught.
    const [r, g, b] = rgb!
    expect(r).toBeGreaterThanOrEqual(156)
    expect(g).toBeGreaterThanOrEqual(163)
    expect(b).toBeGreaterThanOrEqual(175)
  })

  test('T9 AC-048-P1-02 freshness_hours 528 renders "· 22d 0h ago"', async ({ page }) => {
    await mockApis(page)
    await page.route('/api/history-info', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          '1H': { filename: 'Binance_ETHUSDT_1h.csv', latest: '2026-04-08 23:00', bar_count: 73990, freshness_hours: 528 },
          '1D': { filename: 'Binance_ETHUSDT_1d.csv', latest: '2026-04-08', bar_count: 3080, freshness_hours: 5 },
        }),
      }),
    )
    await page.goto('/app')

    const section = page.locator('[data-testid="history-reference-section"]')
    await expect(section.getByText(/22d 0h ago/)).toBeVisible()
  })

  test('T10 AC-048-P1-02 freshness_hours 72 renders stale indicator', async ({ page }) => {
    await mockApis(page)
    await page.route('/api/history-info', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          '1H': { filename: 'Binance_ETHUSDT_1h.csv', latest: '2026-04-27 03:00', bar_count: 73990, freshness_hours: 72 },
          '1D': { filename: 'Binance_ETHUSDT_1d.csv', latest: '2026-04-27', bar_count: 3080, freshness_hours: 3 },
        }),
      }),
    )
    await page.goto('/app')

    const staleDiv = page.locator('[data-testid="history-freshness-stale"]')
    await expect(staleDiv).toHaveCount(1)
    await expect(staleDiv).toBeVisible()
  })
})
