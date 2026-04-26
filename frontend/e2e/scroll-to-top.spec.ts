import { test, expect } from '@playwright/test'
import { mockApis } from './_fixtures/mock-apis.ts'

/**
 * K-053 — Scroll-to-top on route change
 *
 * Active tests (per design doc §3.3 + Round 2 verdicts):
 * - T-K053-01 (AC-K053-03): /diary mid-scroll → /about NavBar click → scrollY === 0
 * - T-K053-02 (AC-K053-04): hash navigation preserves scroll (browser anchor wins)
 * - T-K053-03 (AC-K053-06 §1): same-route NavBar re-click preserves scroll
 *
 * Deferred (per Round 2 M1 verdict):
 * - T-K053-04 (truth-table rows #6/#7 — query-only nav preserves scroll):
 *   The dep array `[pathname, hash]` in `frontend/src/components/ScrollToTop.tsx`
 *   IS the contract. Static review of the dep array (any reviewer reading the
 *   component) is sufficient verification. Adding a Playwright test via
 *   `page.evaluate(() => window.history.pushState(...))` would NOT exercise
 *   React Router's `useLocation` re-render path (pushState bypasses the
 *   history library wrapper) — false-pass = wrong-axis signal that gives
 *   misplaced confidence. Reviewer catches dep-array drift more reliably
 *   than a flaky pushState-based E2E test would. See design doc §3.3 +
 *   Addendum 2026-04-26 — Engineer Challenge Sheet Verdicts (Round 2) §M1.
 */

test.describe('K-053 — Scroll-to-top on route change', () => {

  test.beforeEach(async ({ page }) => {
    await mockApis(page) // catch-all + history-info mocks
    // /diary mock: load real frontend/public/diary.json (already realistic + has enough
    // entries to push body height past 500px when timeline is rendered).
  })

  // T-K053-01 — pathname change resets scroll
  test('AC-K053-03 — scroll resets to 0 on /diary → /about NavBar click', async ({ page }) => {
    await page.goto('/diary')
    await page.waitForSelector('[data-testid="diary-entry"]') // first entry guarantees body extends past 500px scroll target

    // Scroll page to >= 500px (per AC-K053-05)
    await page.evaluate(() => window.scrollTo({ top: 600, left: 0, behavior: 'instant' }))
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(500)

    // Click NavBar → /about
    await page.getByRole('link', { name: 'About', exact: true }).first().click()
    await page.waitForURL('**/about')

    // Wait for /about chrome to mount (Suspense boundary settles before scroll assertion)
    await expect(page.locator('section#header')).toBeVisible()

    // Assert scroll reset
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  })

  // T-K053-02 — hash navigation does NOT reset scroll
  // NOTE: site does not currently expose any hash-anchor link in production code (verified
  // grep on UnifiedNavBar / NavBar / pages — zero `#anchor` href). To exercise the
  // hash-exception code path, this spec uses page.evaluate to programmatically navigate
  // via window.location.hash (synthetic hash injection).
  test('AC-K053-04 — hash navigation preserves scroll (browser anchor wins)', async ({ page }) => {
    await page.goto('/diary')
    await page.waitForSelector('[data-testid="diary-entry"]')

    // Inject a known anchor target mid-page (programmatic — keeps fixture clean)
    await page.evaluate(() => {
      const target = document.createElement('div')
      target.id = 'test-hash-target'
      target.style.cssText = 'height: 1px; position: absolute; top: 800px;'
      document.body.appendChild(target)
    })

    // Navigate to hash — browser scrolls to anchor (~800px); ScrollToTop early-returns
    await page.evaluate(() => { window.location.hash = 'test-hash-target' })

    // Assert scroll did NOT reset to 0 (browser anchor put us near 800).
    // Lower bound 700 leaves 100px headroom for browser anchor settle while
    // proving the early-return fired (a reset would land at exactly 0).
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(700)
  })

  // T-K053-03 — same-route click behavior (per AC-K053-06 §1 — option a accepted)
  // BQ-K053-01 ruling: same-route NavBar re-click preserves scroll.
  test('AC-K053-06 §1 — same-route NavBar re-click preserves scroll', async ({ page }) => {
    await page.goto('/about')

    // Wait for /about chrome to mount (Suspense settles before we scroll)
    await expect(page.locator('section#header')).toBeVisible()

    // Scroll page down so we have a non-zero baseline to preserve
    await page.evaluate(() => window.scrollTo({ top: 400, left: 0, behavior: 'instant' }))
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(300)

    // Capture baseline scroll position right before re-click
    const beforeY = await page.evaluate(() => window.scrollY)

    // Click the About link again — pathname unchanged → useEffect dep array
    // [pathname, hash] does not fire → no scrollTo(0,0) — scroll preserved.
    await page.getByRole('link', { name: 'About', exact: true }).first().click()

    // Assert scrollY is unchanged (poll briefly to allow any spurious effect to settle).
    // Using toBe(beforeY) — strict equality verifies "no reset" rather than just "non-zero".
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(beforeY)
  })
})
