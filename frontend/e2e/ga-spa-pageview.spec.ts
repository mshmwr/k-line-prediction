import { test, expect, type Request } from '@playwright/test'

/**
 * K-020 GA4 SPA Pageview E2E (9 new tests).
 *
 * Complements K-018 (ga-tracking.spec.ts) by validating:
 *  - SPA navigate triggers new pageview dataLayer entry (Phase 1 — 2 tests)
 *  - Initial page load + SPA navigate each emit /g/collect beacons carrying
 *    the required GA4 MP v2 keys (Phase 2 — 4 tests)
 *  - Query-only / hash-only / same-route navigation does NOT emit a new
 *    beacon (Phase 3 — 3 tests)
 *
 * BQ-2 (PM 2026-04-22): no `addInitScript` mock — tests observe production
 * `window.dataLayer` after `initGA()` runs. Shape assertions use index access
 * which works on both Arguments object (production) and Array (if ever
 * regressed).
 *
 * Context-level route intercept per KB FE/playwright-network-interception.md:
 *  - Each test registers `context.route('**\/g\/collect*')` inside its body
 *    through `installBeaconCollector` (QA #10: handler scoped to page
 *    fixture, no afterAll bleed).
 *  - `route.fulfill({ status: 204 })` keeps gtag.js happy (no retry) while
 *    capturing the request object for assertion.
 *
 * Test count: 9 (SPA-NAV × 2 + BEACON × 4 + NEG × 3). Design doc §4
 * AC ↔ Test Case Count cross-check: 9 = 9 = 9 (AC mapping sum / §3.1 rows /
 * declared total).
 */

const ABOUT_PATH_RE = /\/about$/
// Matches `dl=...<pathname>...` or `dp=...<pathname>...` anywhere in the
// query string. Tolerant to both GA4 MP v2 (`dl` = full document URL) and
// legacy UA `dp`. Engineer Dry-Run DR-1..3 (see design §10) confirms actual
// key in dev env.
const PATH_KEY_RE = /[?&](?:dl|dp)=[^&]*%2Fabout/i

/**
 * Install a context-level interceptor for GA4 `/g/collect` beacons.
 *
 * Returns a mutable `beacons` array that collects `Request` objects as they
 * arrive. Each intercepted request is fulfilled with HTTP 204 so gtag.js
 * treats the beacon as delivered and does not retry.
 *
 * Registered inside the test body (not `beforeAll`) so Playwright's page
 * fixture teardown releases the route handler at end-of-test (QA #10).
 */
async function installBeaconCollector(context: import('@playwright/test').BrowserContext): Promise<Request[]> {
  const beacons: Request[] = []
  await context.route('**/g/collect*', async (route) => {
    beacons.push(route.request())
    await route.fulfill({ status: 204, body: '' })
  })
  return beacons
}

// ── PHASE 1 ── AC-020-SPA-NAV — dataLayer entry on SPA navigate ──────────────

test.describe('AC-020-SPA-NAV — SPA Link click pushes pageview dataLayer entry', () => {
  test('NavBar About Link: / → /about pushes page_view entry referencing /about', async ({ page, context }) => {
    await installBeaconCollector(context) // attach to suppress network-error noise; do not assert beacons
    await page.goto('/')
    await page.waitForFunction(() =>
      (window.dataLayer as unknown[][]).some(
        (entry) => (entry as IArguments)[0] === 'event' && (entry as IArguments)[1] === 'page_view',
      ),
    )
    const dataLayerBefore = await page.evaluate(() => (window.dataLayer as unknown[][]).length)

    // Scope click to the NavBar to avoid matching any other "About" link on the page.
    await page
      .locator('[data-testid="navbar-desktop"]')
      .getByRole('link', { name: 'About', exact: true })
      .click()
    await page.waitForURL(ABOUT_PATH_RE)

    // Wait for a NEW dataLayer entry (length strictly increases).
    await page.waitForFunction(
      (prevLen) => (window.dataLayer as unknown[][]).length > prevLen,
      dataLayerBefore,
    )

    const dataLayer = await page.evaluate(() => window.dataLayer as unknown[][])
    const newEntries = dataLayer.slice(dataLayerBefore)
    const aboutPageview = newEntries.find(
      (entry) =>
        (entry as IArguments)[0] === 'event' &&
        (entry as IArguments)[1] === 'page_view' &&
        ((entry as IArguments)[2] as { page_location?: string }).page_location === '/about',
    )
    expect(aboutPageview, 'SPA navigate must push a new page_view entry for /about').toBeDefined()
  })

  test('BuiltByAIBanner CTA: / → /about pushes page_view entry referencing /about', async ({ page, context }) => {
    await installBeaconCollector(context)
    await page.goto('/')
    await page.waitForFunction(() =>
      (window.dataLayer as unknown[][]).some(
        (entry) => (entry as IArguments)[0] === 'event' && (entry as IArguments)[1] === 'page_view',
      ),
    )
    const dataLayerBefore = await page.evaluate(() => (window.dataLayer as unknown[][]).length)

    await page.locator('[data-testid="built-by-ai-banner"]').click()
    await page.waitForURL(ABOUT_PATH_RE)

    await page.waitForFunction(
      (prevLen) => (window.dataLayer as unknown[][]).length > prevLen,
      dataLayerBefore,
    )

    const dataLayer = await page.evaluate(() => window.dataLayer as unknown[][])
    const newEntries = dataLayer.slice(dataLayerBefore)
    const aboutPageview = newEntries.find(
      (entry) =>
        (entry as IArguments)[0] === 'event' &&
        (entry as IArguments)[1] === 'page_view' &&
        ((entry as IArguments)[2] as { page_location?: string }).page_location === '/about',
    )
    expect(aboutPageview, 'BuiltByAIBanner banner CTA must push a new page_view entry for /about').toBeDefined()
  })
})

// ── PHASE 2 ── AC-020-BEACON-* — HTTP beacon on /g/collect ───────────────────

test.describe('AC-020-BEACON — GA4 /g/collect beacon HTTP assertion', () => {
  test('AC-020-BEACON-INITIAL — page.goto fires at least one beacon in 5s', async ({ page, context }) => {
    const beacons = await installBeaconCollector(context)

    await page.goto('/about')
    await expect
      .poll(() => beacons.length, {
        timeout: 5000,
        message: 'expected >=1 /g/collect beacon after initial load',
      })
      .toBeGreaterThan(0)

    // Host check — beacon must hit google-analytics.com (not a mistyped endpoint).
    const firstBeacon = beacons[0]
    expect(firstBeacon.url()).toMatch(/google-analytics\.com\/g\/collect/)
  })

  /**
   * K-033 TRACKER — currently RED on purpose.
   *
   * Root cause: production `useGAPageview` calls
   *   gtag('event', 'page_view', { page_location, page_title })
   * while `initGA()` has established
   *   gtag('config', MEASUREMENT_ID, { send_page_view: false })
   * Modern GA4 gtag.js silently drops this combo — no /g/collect
   * emitted on SPA route change. (K-020 Engineer Dry-Run DR 2026-04-22
   * confirmed. Even full-URL page_location does not help; session
   * context update via gtag('config', ...) or gtag('set', ...)+event
   * is required. See docs/tickets/K-033-ga-spa-beacon-emission-fix.md
   * for the canonical SPA pattern fix.)
   *
   * DO NOT loosen this assertion to turn it green. This test WILL
   * turn green when K-033 lands — that is the definition of K-033
   * AC-033-BEACON-SPA-GREEN. Loosening here reintroduces the exact
   * K-018-class gap K-020 was designed to close (shape-only mock
   * hiding wire-level breakage).
   */
  test('AC-020-BEACON-SPA — SPA navigate fires a NEW beacon referencing /about', async ({ page, context }) => {
    const beacons = await installBeaconCollector(context)

    await page.goto('/')
    // Wait for initial-load beacon(s) so delta snapshot is stable.
    await expect.poll(() => beacons.length, { timeout: 5000 }).toBeGreaterThan(0)
    const initialCount = beacons.length

    await page
      .locator('[data-testid="navbar-desktop"]')
      .getByRole('link', { name: 'About', exact: true })
      .click()
    await page.waitForURL(ABOUT_PATH_RE)

    await expect
      .poll(() => beacons.length, {
        timeout: 5000,
        message: 'expected a NEW /g/collect beacon after SPA navigate',
      })
      .toBeGreaterThan(initialCount)

    const newBeacons = beacons.slice(initialCount)
    const aboutRefBeacon = newBeacons.find((req) => PATH_KEY_RE.test(req.url()))
    expect(
      aboutRefBeacon,
      'new beacon query must contain dl= or dp= referencing /about',
    ).toBeDefined()
  })

  test('AC-020-BEACON-PAYLOAD — beacon query contains v=2, tid, en=page_view, path-key', async ({ page, context }) => {
    const beacons = await installBeaconCollector(context)

    await page.goto('/about')
    await expect.poll(() => beacons.length, { timeout: 5000 }).toBeGreaterThan(0)

    // Find a page_view beacon specifically (initial load may emit non-event
    // housekeeping requests depending on gtag.js version). Fall back to
    // beacons[0] if only one beacon was seen, to catch unexpected shape.
    const pageviewBeacon =
      beacons.find((req) => /[?&]en=page_view(&|$)/.test(req.url())) ?? beacons[0]
    const url = pageviewBeacon.url()

    expect(url, 'beacon must pin GA4 MP v2 version').toMatch(/[?&]v=2(&|$)/)
    expect(url, 'beacon must carry measurement ID G-TESTID0000').toMatch(
      /[?&]tid=G-TESTID0000(&|$)/,
    )
    expect(url, 'beacon must declare page_view event').toMatch(/[?&]en=page_view(&|$)/)
    expect(
      url,
      'beacon must carry path-key (dl or dp) referencing current route /about',
    ).toMatch(PATH_KEY_RE)
  })

  test('AC-020-BEACON-COUNT — initial load fires exactly 1 beacon within 1s settle window', async ({ page, context }) => {
    const beacons = await installBeaconCollector(context)

    await page.goto('/about')
    await expect.poll(() => beacons.length, { timeout: 5000 }).toBeGreaterThan(0)

    // Settle window: wait 1s for any late duplicate beacon.
    // Count only page_view beacons so any non-pageview housekeeping request
    // does not inflate the denominator — AC-020-BEACON-COUNT is about
    // pageview duplication (StrictMode / double-call), not total traffic.
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(1000)
    const pageviewBeacons = beacons.filter((req) => /[?&]en=page_view(&|$)/.test(req.url()))
    expect(
      pageviewBeacons.length,
      'expected exactly 1 pageview beacon per pageview (StrictMode / double-call guard)',
    ).toBe(1)
  })
})

// ── PHASE 3 ── AC-020-NEG-* — non-triggers ──────────────────────────────────

test.describe('AC-020-NEG — navigation types that must NOT fire pageview beacon', () => {
  test('AC-020-NEG-QUERY — query-only change does not fire new beacon', async ({ page, context }) => {
    const beacons = await installBeaconCollector(context)

    await page.goto('/?x=1')
    await expect.poll(() => beacons.length, { timeout: 5000 }).toBeGreaterThan(0)
    const countBefore = beacons.length

    // Change query without changing pathname. pushState + popstate forces
    // BrowserRouter to sync React state to the new URL. Per design §1 truth
    // table row 3, `useGAPageview` deps = [location.pathname] → pathname
    // unchanged ⇒ effect must NOT re-fire ⇒ no new beacon.
    await page.evaluate(() => {
      window.history.pushState({}, '', '/?x=2')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    // Bounded 500ms per §2.6 — negative assertions cannot poll for absence.
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500)
    expect(beacons.length, 'query-only change must not trigger new pageview beacon').toBe(
      countBefore,
    )
  })

  test('AC-020-NEG-HASH — hash-only change does not fire new beacon', async ({ page, context }) => {
    const beacons = await installBeaconCollector(context)

    await page.goto('/about')
    await expect.poll(() => beacons.length, { timeout: 5000 }).toBeGreaterThan(0)
    const countBefore = beacons.length

    await page.evaluate(() => {
      window.location.hash = '#team'
    })

    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500)
    expect(beacons.length, 'hash-only change must not trigger new pageview beacon').toBe(
      countBefore,
    )
  })

  test('AC-020-NEG-SAMEROUTE — clicking About Link while on /about does not fire new beacon', async ({ page, context }) => {
    const beacons = await installBeaconCollector(context)

    await page.goto('/about')
    await expect.poll(() => beacons.length, { timeout: 5000 }).toBeGreaterThan(0)
    const countBefore = beacons.length

    await page
      .locator('[data-testid="navbar-desktop"]')
      .getByRole('link', { name: 'About', exact: true })
      .click()

    // URL unchanged — cannot waitForURL. Bounded 500ms per §2.6.
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500)
    expect(beacons.length, 'same-route Link click must not trigger new pageview beacon').toBe(
      countBefore,
    )
  })
})
