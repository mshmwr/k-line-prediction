---
title: K-020 — GA4 SPA Pageview E2E (Test Hardening)
type: design
ticket: K-020
author: senior-architect
status: ready-for-engineer
created: 2026-04-22
updated: 2026-04-22
base-commit: 316cc04 (branch tip; worktree ahead of main by 1 re-plan commit)
---

## 0 Scope Questions (K-020 起 — 裁決結果)

All Scope Questions answered by PM 2026-04-22 (see ticket §BQ Resolution). No open SQ from Architect this round.

---

## 1 Files Inspected (Pre-Design Audit — Truth Table 形式)

**Base commit for pre-existing claims: `316cc04` (current HEAD; ahead of main by 1 docs-only re-plan commit; no source code diff vs main).**

`git log main..test/K-020-ga-spa-pageview-e2e --stat` → docs-only; `frontend/src/**` identical to main.

| File | Role | Command run | Key observations |
|------|------|-------------|------------------|
| `frontend/src/utils/analytics.ts` | SOR for gtag.js init + trackPageview + trackCtaClick | `Read` @ HEAD | L27–30 `window.gtag = function () { window.dataLayer.push(arguments) }` — **Arguments object**, not spread Array (K-018 post-fix shape). L50–53 `trackPageview` sends `{ page_location: path, page_title: title }`; `path` is `location.pathname` (per useGAPageview call site). |
| `frontend/src/hooks/useGAPageview.ts` | SOR for SPA route-change pageview trigger | `Read` @ HEAD | L15–18 `useEffect(..., [location.pathname])` — reactive ONLY to pathname. Query-only / hash-only change ⇒ no re-fire. PAGE_TITLES lookup per pathname (L5–11). |
| `frontend/e2e/ga-tracking.spec.ts` | Existing K-018 E2E suite to coexist with new K-020 cases | `Read` @ HEAD | 5 describe blocks: INSTALL / PAGEVIEW / CLICK / PRIVACY / PRIVACY-POLICY. PAGEVIEW + CLICK use `addInitScript` to pre-inject `window.gtag` spy — this is what BQ-2 deprecates for K-020 (new tests observe **production** dataLayer, not mock). |
| `frontend/playwright.config.ts` | Playwright env + webServer config | `Read` @ HEAD | L31–33 `webServer.env: { VITE_GA_MEASUREMENT_ID: 'G-TESTID0000' }`. `fullyParallel: false` ⇒ tests run sequentially; `timeout: 30_000`. No `workers` override. |
| `frontend/src/main.tsx` | App bootstrap (BrowserRouter + initGA call + GATracker) | `Read` @ HEAD | L14 `initGA()` runs **before** ReactDOM.render. `GATracker` component at L16–19 mounts useGAPageview once inside router context. `React.StrictMode` wraps everything (⇒ dev effect double-invoke risk, relevant to AC-020-BEACON-COUNT). |
| `frontend/src/components/UnifiedNavBar.tsx` | NavBar renders About link | `Read` @ HEAD (L22–26) | `TEXT_LINKS[2] = { label: 'About', path: '/about' }` — `<Link to="/about">`. App link is `external: true` (new-tab), About link is SPA `<Link>` (same-tab). |
| `frontend/src/components/home/BuiltByAIBanner.tsx` | Homepage banner → /about (2nd entry point) | `Read` @ HEAD | `<Link to="/about" aria-label="About the AI collaboration behind this project" data-testid="built-by-ai-banner" onClick={() => trackCtaClick('banner_about')}>` — note: fires BOTH cta_click and downstream pageview; test must assert pageview beacon not the cta_click beacon. |
| `agent-context/architecture.md` §Consensus SSOT / §Design System | Cross-reference for arch conventions | `Read` @ HEAD | No new testing contract section yet. K-020 needs §Testing / §GA4 E2E Test Matrix append. |

### Truth Table — Hook Behavior (driving AC-020-NEG-* contract)

| URL transition | `location.pathname` | `useEffect [pathname]` fires | `trackPageview` called | Beacon sent |
|----------------|---------------------|------------------------------|------------------------|-------------|
| Initial load `/` | `/` | yes (mount) | yes | 1 |
| `/` → `/about` (SPA nav, Link click) | changes `/` → `/about` | yes | yes | 1 new |
| `/?x=1` → `/?x=2` (query only) | `/` (unchanged) | no | no | 0 |
| `/about` → `/about#team` (hash only) | `/about` (unchanged) | no | no | 0 |
| `/about` → `/about` (re-click same Link) | `/about` (unchanged) | no | no | 0 |
| `/about` → `/` via browser back | `/about` → `/` | yes | yes | 1 new |

**This truth table is the contract for AC-020-SPA-NAV (row 2) + AC-020-NEG-QUERY (row 3) + AC-020-NEG-HASH (row 4) + AC-020-NEG-SAMEROUTE (row 5).** Row 6 (back/forward) is QA #8 non-blocking — see §5.3.

### GA4 Measurement Protocol v2 Payload Shape (pre-implementation dry-run plan)

**Decision:** Design writes assertions that tolerate **either `dl` OR `dp`** for path-key presence, so the test is robust whether gtag.js emits MP v2 (`dl` = document location full URL) or MP legacy (`dp` = document path). Rationale:

- GA4 MP v2 canonical spec (Jan 2026 knowledge): `/g/collect` beacon carries `v=2`, `tid=<G-XXX>`, `en=<event_name>`, `dl=<document.location.href>` (always the full browser URL), and per-event parameters encoded as `ep.<name>=<value>`. `dp` is a legacy UA parameter, rarely emitted by GA4 gtag.js.
- Helper passes `page_location: '/about'` in gtag `event` config — this value goes into `ep.page_location` (custom parameter), NOT `dl`. The `dl` key is ALWAYS populated from `document.location.href` by gtag.js, regardless of helper args.
- Therefore **the reliable assertion** is: `dl` (full URL) contains the pathname substring `/about`. Asserting raw string contains is path-safe for both `dl=http://localhost:5173/about` and (legacy) `dp=/about`.

**Engineer dry-run step at implementation time (§3.2 P2-Step-1):** before freezing the assertion, Engineer runs a single canary test to print `route.request().url()` and paste the query string into design doc §Dry-Run Record. Architect pre-writes the assertion as "contains `/about`" to tolerate key variance; if dry-run shows neither `dl` nor `dp` carries path (extremely unlikely), Engineer returns to Architect with BQ.

**Per K-018 retro lesson:** the **primary** K-018-class bug guard is "beacon arrived / beacon count ≥ 1 after SPA navigate" — payload key identity is a secondary pin. Engineer must not defer the primary assertion while chasing key identity.

---

## 2 Technical Solution Selection

### 2.1 Test file strategy — new spec vs extend existing `ga-tracking.spec.ts`

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| A. Extend existing `ga-tracking.spec.ts` | Single file for all GA4 tracking; minimal file churn | K-018 tests use `addInitScript` mock (BQ-2 deprecated); K-020 observes production dataLayer — mixing strategies in one file is a trap for future maintainers | ✗ |
| B. New file `ga-spa-pageview.spec.ts` | Clear separation: K-018 helper-layer shape + K-020 SPA + HTTP beacon layer. Different fixtures (context.route at file top vs per-test addInitScript). Failures localize to one concern. | Extra file | ✓ **Recommend** |
| C. New file + migrate K-018 PAGEVIEW tests into it | Single source of truth for pageview | Scope creep; K-018 tests passing today, no reason to touch | ✗ |

**Decision:** B. Keep `ga-tracking.spec.ts` untouched; new file `frontend/e2e/ga-spa-pageview.spec.ts` owns K-020's 3 Phases.

### 2.2 Network interception level — `context.route` vs `page.route`

Per KB `FE/playwright-network-interception.md` §Core APIs §選擇原則: context-level is the default for cross-test shared interception (GA, auth mock). Per QA Challenge #10 + ticket §Non-Blocking: handler must be **registered inside `test` body** (not `beforeAll`) to ensure page-fixture teardown, avoiding state leak across tests.

| Option | Scope | Pros | Cons | Recommendation |
|--------|-------|------|------|----------------|
| A. `context.route('**/g/collect*', fulfill 204)` at file top (`test.beforeEach`) | All tests | One-liner registration; consistent across tests | Shared callback + per-test per-test array init needs care; if callback closure captures mutable shared array, tests pollute each other | ✓ with **per-test fresh array + registration inside `test.beforeEach({ context })`** |
| B. `page.route('**/g/collect*', ...)` per-test | One test | Stateless | Boilerplate; repeated registration | ✗ |
| C. Global fixture file (Playwright `test.extend`) | Suite-wide | DRY | Overkill for one spec; adds indirection | ✗ (future if more GA tests appear) |

**Decision:** A — `test.beforeEach({ context })` registers `context.route` AND resets per-test `beacons: Request[]` array. Handler closure captures the fresh array reference each test.

### 2.3 Beacon collector pattern

Shared helper in-file (not exported — avoid over-engineering for single-spec use):

```
function createBeaconCollector(context) {
  const beacons = []
  context.route('**/g/collect*', async (route) => {
    beacons.push(route.request())
    await route.fulfill({ status: 204, body: '' })
  })
  return { beacons, snapshot: () => beacons.length }
}
```

- `beacons` array holds `Request` objects (Playwright Request, has `.url()`, `.method()`, `.postData()`).
- `snapshot()` returns count at a point in time — used for delta assertions.
- Pattern per ticket §Phase 1 (also attaches empty 204 fulfill during Phase 1 so gtag.js receives "success" and doesn't retry).

### 2.4 Waiting strategy — no `waitForTimeout`

Per ticket AC-020-SPA-NAV: use `waitForURL` + `waitForFunction` / `expect.poll` — no `waitForTimeout`.

| Purpose | API |
|---------|-----|
| URL changed after click | `await page.waitForURL(/\/about$/)` |
| Beacon arrived (Phase 2 positive) | `await expect.poll(() => beacons.length, { timeout: 5000 }).toBeGreaterThan(initial)` |
| Beacon did NOT arrive (Phase 3 negative, bounded wait) | `await page.waitForTimeout(500)` — **exception:** negative tests cannot poll for absence; 500ms is the ceiling per AC-020-NEG-*. **This is the only `waitForTimeout` allowed in this spec** and only in negative tests. |
| dataLayer entry present (Phase 1) | `await page.waitForFunction(...) ` reading `window.dataLayer` |

### 2.5 K-018 regression guard — which assertion catches Arguments-vs-Array shape mismatch?

K-018 bug class: `window.gtag = function (...args) { dataLayer.push(args) }` (spread Array) silently accepted by E2E mock but rejected by real gtag.js (which expects Arguments object) — beacon **never leaves**.

**Primary guard (AC-020-BEACON-INITIAL + AC-020-BEACON-SPA):** if gtag shape is wrong, gtag.js internal parser rejects the config/event → no `/g/collect` request → `beacons.length === 0` after 5s timeout → test fails.

**Secondary guard (AC-020-SPA-NAV dataLayer shape assertion):** assertion explicitly reads `entry[0]`/`entry[1]`/`entry[2]` (index access), which works on both Arguments object AND Array. The test is shape-tolerant but pairs with primary guard: if shape is wrong, PRIMARY fails first.

**Why not assert `entry instanceof Arguments`?** Arguments object has no constructor reference; cross-realm checks (Node vs browser) break. Index access is the canonical way and it's what gtag.js itself uses internally.

### 2.6 Negative test wait budget

500ms (per ticket AC) after the "stimulus" (query nav / hash nav / same-route click) before asserting count unchanged. Chosen because:
- gtag.js + network round-trip budget under normal conditions: <300ms
- Playwright `context.route` callback runs synchronously when request intercepted — no network delay contribution
- 500ms gives 1.6× safety margin; shorter would flake, longer bloats suite runtime
- Negative assertion is `toBe(initialCount)`, not `toBeLessThanOrEqual` (exact equality catches accidental over-firing)

### 2.7 StrictMode double-invoke risk (AC-020-BEACON-COUNT)

`main.tsx` L22 uses `<React.StrictMode>`. In **dev**, StrictMode double-invokes effects; in **production build**, it does not. Playwright runs `npm run dev` (per playwright.config.ts webServer), so StrictMode effects DO double-invoke.

**Current `useGAPageview` effect has no StrictMode guard** — this is a potential finding.

| Observation | Action |
|-------------|--------|
| If double-invoke ⇒ 2 `trackPageview` ⇒ 2 beacons per pageview | AC-020-BEACON-COUNT = 1 will FAIL as a real bug |
| If gtag.js dedupes or if useEffect cleanup cancels the first invoke | Count = 1 and test passes |

**Architect stance:** do NOT pre-emptively fix `useGAPageview` to guard StrictMode in this ticket — this ticket is test hardening scope. If AC-020-BEACON-COUNT fails at Engineer implementation time, Engineer returns with finding: "Either loosen AC to `.toBeGreaterThanOrEqual(1)` + Known Gap, OR patch hook with `useRef(false)` one-shot guard and re-assert exactly 1." Blocker routed to PM at that time.

This is flagged here so Engineer is not surprised. Known Gap is **not** pre-ruled — PM decides if/when count=1 fails dev StrictMode.

---

## 3 Test File Scaffold (Pseudo-code, Engineer Implements)

### 3.1 New file: `frontend/e2e/ga-spa-pageview.spec.ts`

```
import { test, expect, type Request } from '@playwright/test'

/**
 * K-020 GA4 SPA Pageview E2E.
 *
 * Complements K-018 (ga-tracking.spec.ts) by validating:
 *  - SPA navigate triggers new pageview dataLayer entry (Phase 1)
 *  - Initial page load + SPA navigate each emit exactly one /g/collect beacon with required GA4 MP v2 keys (Phase 2)
 *  - Query-only / hash-only / same-route navigation does NOT emit beacon (Phase 3)
 *
 * BQ-2 (PM 2026-04-22): no addInitScript mock — tests observe production
 * dataLayer after initGA() runs. Shape assertions use index access which
 * works on both Arguments object (production) and Array (if ever regressed).
 *
 * Context-level route intercept per KB FE/playwright-network-interception.md:
 *  - All tests register context.route('**\/g\/collect*') in test.beforeEach
 *    (QA #10: handler scoped to page fixture, no afterAll bleed)
 *  - route.fulfill({status:204}) keeps gtag.js happy (no retry) while
 *    capturing request for assertion
 */

const ABOUT_PATH_RE = /\/about$/
const PATH_KEY_RE = /[?&](dl|dp)=[^&]*\/about[^&]*/  // tolerates dl or dp (GA4 MP v2 spec + legacy)

// Helper shared across tests. Registered in test.beforeEach so closure
// captures a fresh array per test. Returns direct ref for snapshot() + assertions.
async function installBeaconCollector(context) {
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
    await installBeaconCollector(context)  // Phase 1: attach to prevent network errors on CI; don't assert beacons
    await page.goto('/')
    await page.waitForFunction(() => (window.dataLayer as unknown[][])
      .some((e) => (e as IArguments)[0] === 'event' && (e as IArguments)[1] === 'page_view'))
    const dataLayerBefore = await page.evaluate(() => (window.dataLayer as unknown[][]).length)

    await page.getByRole('link', { name: 'About', exact: true }).click()
    await page.waitForURL(ABOUT_PATH_RE)

    // Wait for NEW entry — length strictly increases
    await page.waitForFunction((prevLen) => (window.dataLayer as unknown[][]).length > prevLen, dataLayerBefore)

    const dataLayer = await page.evaluate(() => window.dataLayer)
    const newEntries = (dataLayer as unknown[][]).slice(dataLayerBefore)
    const aboutPageview = newEntries.find(
      (entry) => (entry as IArguments)[0] === 'event'
              && (entry as IArguments)[1] === 'page_view'
              && ((entry as IArguments)[2] as {page_location: string}).page_location === '/about'
    )
    expect(aboutPageview, 'SPA navigate must push a new page_view entry for /about').toBeDefined()
  })

  test('BuiltByAIBanner CTA: / → /about pushes page_view entry referencing /about', async ({ page, context }) => {
    await installBeaconCollector(context)
    await page.goto('/')
    await page.waitForFunction(() => (window.dataLayer as unknown[][])
      .some((e) => (e as IArguments)[0] === 'event' && (e as IArguments)[1] === 'page_view'))
    const dataLayerBefore = await page.evaluate(() => (window.dataLayer as unknown[][]).length)

    await page.locator('[data-testid="built-by-ai-banner"]').click()
    await page.waitForURL(ABOUT_PATH_RE)

    await page.waitForFunction((prevLen) => (window.dataLayer as unknown[][]).length > prevLen, dataLayerBefore)

    const dataLayer = await page.evaluate(() => window.dataLayer)
    const newEntries = (dataLayer as unknown[][]).slice(dataLayerBefore)
    const aboutPageview = newEntries.find(
      (entry) => (entry as IArguments)[0] === 'event'
              && (entry as IArguments)[1] === 'page_view'
              && ((entry as IArguments)[2] as {page_location: string}).page_location === '/about'
    )
    expect(aboutPageview, 'BuiltByAIBanner banner CTA must push a new page_view entry for /about').toBeDefined()
  })
})

// ── PHASE 2 ── AC-020-BEACON-* — HTTP beacon on /g/collect ───────────────────
test.describe('AC-020-BEACON — GA4 /g/collect beacon HTTP assertion', () => {

  test('AC-020-BEACON-INITIAL — page.goto fires at least one beacon in 5s', async ({ page, context }) => {
    const beacons = await installBeaconCollector(context)

    await page.goto('/about')
    await expect.poll(() => beacons.length, { timeout: 5000, message: 'expected ≥1 /g/collect beacon after initial load' })
      .toBeGreaterThan(0)

    // Host check
    const firstBeacon = beacons[0]
    expect(firstBeacon.url()).toMatch(/google-analytics\.com\/g\/collect/)
  })

  test('AC-020-BEACON-SPA — SPA navigate fires a NEW beacon referencing /about', async ({ page, context }) => {
    const beacons = await installBeaconCollector(context)

    await page.goto('/')
    // Wait for initial beacon(s) so snapshot is stable
    await expect.poll(() => beacons.length, { timeout: 5000 }).toBeGreaterThan(0)
    const initialCount = beacons.length

    await page.getByRole('link', { name: 'About', exact: true }).click()
    await page.waitForURL(ABOUT_PATH_RE)

    await expect.poll(() => beacons.length, { timeout: 5000, message: 'expected NEW /g/collect beacon after SPA navigate' })
      .toBeGreaterThan(initialCount)

    const newBeacons = beacons.slice(initialCount)
    // At least one new beacon's query string must contain path-key referencing /about
    const aboutRefBeacon = newBeacons.find((req) => PATH_KEY_RE.test(req.url()))
    expect(aboutRefBeacon, 'new beacon query must contain dl= or dp= referencing /about').toBeDefined()
  })

  test('AC-020-BEACON-PAYLOAD — beacon query contains v=2, tid, en=page_view, path-key', async ({ page, context }) => {
    const beacons = await installBeaconCollector(context)

    await page.goto('/about')
    await expect.poll(() => beacons.length, { timeout: 5000 }).toBeGreaterThan(0)

    const url = beacons[0].url()
    expect(url, 'beacon must pin GA4 MP v2 version').toMatch(/[?&]v=2(&|$)/)
    expect(url, 'beacon must carry measurement ID').toMatch(/[?&]tid=G-TESTID0000(&|$)/)
    expect(url, 'beacon must declare page_view event').toMatch(/[?&]en=page_view(&|$)/)
    expect(url, 'beacon must carry path-key (dl or dp) referencing current route /about').toMatch(PATH_KEY_RE)
  })

  test('AC-020-BEACON-COUNT — initial load fires exactly 1 beacon within 1s window', async ({ page, context }) => {
    const beacons = await installBeaconCollector(context)

    await page.goto('/about')
    await expect.poll(() => beacons.length, { timeout: 5000 }).toBeGreaterThan(0)

    // Settle window: wait 1s for any duplicate
    await page.waitForTimeout(1000)
    expect(beacons.length, 'expected exactly 1 beacon per pageview (StrictMode / double-call guard)').toBe(1)
  })
})

// ── PHASE 3 ── AC-020-NEG-* — non-triggers ───────────────────────────────────
test.describe('AC-020-NEG — navigation types that must NOT fire pageview beacon', () => {

  test('AC-020-NEG-QUERY — query-only change does not fire new beacon', async ({ page, context }) => {
    const beacons = await installBeaconCollector(context)

    await page.goto('/?x=1')
    await expect.poll(() => beacons.length, { timeout: 5000 }).toBeGreaterThan(0)
    const countBefore = beacons.length

    // Trigger query-only change — browser-level, no Link click (would reload whole page)
    await page.evaluate(() => { window.history.pushState({}, '', '/?x=2') })
    // For React Router BrowserRouter to see pushState, we need to dispatch popstate
    // BUT AC says "query change" so this is an SPA-level state change; use goto('/?x=2') is a fresh load which would fire. 
    // Use router-internal: replace URL without navigating. Simplest: page.evaluate pushState — useGAPageview won't notice until React re-renders. 
    // For this AC scope (behavior lock on [location.pathname] deps), what we really need to test is:
    // "even IF router re-renders with new search, as long as pathname unchanged, no new beacon."
    // React Router v6 useLocation() does track search; but hook deps are [location.pathname] only.
    // Engineer dry-run: if pushState alone doesn't cause re-render, navigate to same pathname via client-side Link with search:
    //   await page.evaluate(() => {
    //     window.history.pushState({}, '', '/?x=2')
    //     window.dispatchEvent(new PopStateEvent('popstate'))  // forces BrowserRouter to sync
    //   })
    // (See §4 Implementation Order P3-Step-1 for Engineer-side concrete code.)

    await page.waitForTimeout(500)
    expect(beacons.length, 'query-only change must not trigger new pageview beacon').toBe(countBefore)
  })

  test('AC-020-NEG-HASH — hash-only change does not fire new beacon', async ({ page, context }) => {
    const beacons = await installBeaconCollector(context)

    await page.goto('/about')
    await expect.poll(() => beacons.length, { timeout: 5000 }).toBeGreaterThan(0)
    const countBefore = beacons.length

    await page.evaluate(() => { window.location.hash = '#team' })
    await page.waitForTimeout(500)
    expect(beacons.length, 'hash-only change must not trigger new pageview beacon').toBe(countBefore)
  })

  test('AC-020-NEG-SAMEROUTE — clicking About Link while on /about does not fire new beacon', async ({ page, context }) => {
    const beacons = await installBeaconCollector(context)

    await page.goto('/about')
    await expect.poll(() => beacons.length, { timeout: 5000 }).toBeGreaterThan(0)
    const countBefore = beacons.length

    await page.getByRole('link', { name: 'About', exact: true }).click()
    // URL unchanged — can't use waitForURL. Bounded wait per §2.6
    await page.waitForTimeout(500)
    expect(beacons.length, 'same-route Link click must not trigger new pageview beacon').toBe(countBefore)
  })
})
```

### 3.2 Dry-Run Records (Engineer populates during implementation)

Engineer appends to this design doc §Dry-Run Record:

| Step | Command | Expected | Engineer observation |
|------|---------|----------|----------------------|
| DR-1 | Run AC-020-BEACON-PAYLOAD, `console.log(beacons[0].url())` | Paste full URL | (fill at implementation) |
| DR-2 | Confirm `dl=` present and contains `/about` | `dl=http://localhost:5173/about[...]` | (fill) |
| DR-3 | If `dl=` absent, check `dp=` | Either `dl` or `dp` carries path | (fill) |
| DR-4 | AC-020-BEACON-COUNT initial: observe count over 2s | If =1 ⇒ passes; if =2 ⇒ dev StrictMode double-invoke, escalate to PM | (fill) |
| DR-5 | AC-020-NEG-QUERY: confirm `pushState` + `popstate` dispatch does NOT cause BrowserRouter to re-emit location with new pathname | beacon count unchanged | (fill) |

**Engineer MUST NOT skip DR-4** — it determines whether AC-020-BEACON-COUNT is achievable as-is. If DR-4 = 2, stop and return to PM with finding.

---

## 4 File Change List

| File | Change | Purpose |
|------|--------|---------|
| `frontend/e2e/ga-spa-pageview.spec.ts` | **NEW** | K-020 Phase 1/2/3 test spec (9 tests total: 2 SPA-NAV + 4 BEACON + 3 NEG — see §4 AC↔Test Count matrix) |
| `frontend/e2e/ga-tracking.spec.ts` | **UNCHANGED** | K-018 suite retained as-is (shape assertion layer); do not modify |
| `frontend/src/utils/analytics.ts` | **UNCHANGED** | Production helper — no change in this ticket |
| `frontend/src/hooks/useGAPageview.ts` | **UNCHANGED** | Hook — behavior locked by AC-020-NEG-*; any change needs separate ticket |
| `frontend/playwright.config.ts` | **UNCHANGED** | `VITE_GA_MEASUREMENT_ID='G-TESTID0000'` already set |
| `agent-context/architecture.md` | **MODIFIED** | §Testing → append GA4 E2E test matrix sub-section; Changelog entry (no structural code change) |
| `docs/designs/K-020-ga-spa-pageview-e2e.md` | **NEW (this file)** | Design doc |
| `docs/retrospectives/architect.md` | **MODIFIED (prepend entry)** | Per-role retro log |

### AC ↔ Test Case Count Cross-Check (mandatory self-check per persona)

**Ticket §AC total derived from Phases 1/2/3:** 8 AC. Minimum test case mapping:

| AC ID | Phase | Min test cases | §3.1 test IDs |
|-------|-------|----------------|---------------|
| AC-020-SPA-NAV | 1 | 2 (NavBar + Banner, per AC "至少 2 個獨立 Playwright test case") | T1, T2 |
| AC-020-BEACON-INITIAL | 2 | 1 | T3 |
| AC-020-BEACON-SPA | 2 | 1 (per AC "至少 1 個獨立 Playwright test case") | T4 |
| AC-020-BEACON-PAYLOAD | 2 | 1 | T5 |
| AC-020-BEACON-COUNT | 2 | 1 | T6 |
| AC-020-NEG-QUERY | 3 | 1 | T7 |
| AC-020-NEG-HASH | 3 | 1 | T8 |
| AC-020-NEG-SAMEROUTE | 3 | 1 | T9 |
| **Total** |  | **9** | **9** |

**§3.1 test count (rows in 3 `test.describe` blocks): 2 + 4 + 3 = 9 ✓ matches mapping sum = 9.**

Declared "測試總數" top of spec file header comment: **9 new tests**.

**Hard gate pass: 9 = 9 = 9 (AC mapping sum / §3.1 rows / declared total).**

---

## 5 Implementation Order (for Engineer)

### Phase 1 first (low-risk: dataLayer shape assertion already proven by K-018):

1. **P1-Step-1:** Create `ga-spa-pageview.spec.ts` with file header comment + `PATH_KEY_RE` const + `installBeaconCollector` helper function.
2. **P1-Step-2:** Write T1 (NavBar About). Run it. Verify: (a) URL changes to `/about`; (b) dataLayer grows; (c) new page_view entry with page_location `/about`. Commit.
3. **P1-Step-3:** Write T2 (BuiltByAIBanner). Same verification. Commit.

### Phase 2 second (beacon layer — dry-run required before freezing payload assertion):

4. **P2-Step-1 (Dry-Run DR-1/DR-2/DR-3 from §3.2):** Write a scratch test that prints `beacons[0].url()` and `beacons[0].method()`. Record full URL into design doc §Dry-Run Record. Confirm `dl=` carries pathname. Delete scratch test before commit.
5. **P2-Step-2:** Write T3 (BEACON-INITIAL). Commit.
6. **P2-Step-3:** Write T4 (BEACON-SPA). Commit.
7. **P2-Step-4:** Write T5 (BEACON-PAYLOAD) using pinned regexes. Commit.
8. **P2-Step-5 (Dry-Run DR-4):** Write T6 (BEACON-COUNT). Run it 3× and record observed count. If count=2, STOP — escalate to PM (see §2.7). If count=1, commit.

### Phase 3 last (negative tests — behavior lock):

9. **P3-Step-1 (Dry-Run DR-5):** Implement T7 (NEG-QUERY). The `pushState` approach may or may not be enough to make BrowserRouter re-read location without pathname change. Engineer tries:
   - Attempt A: `window.history.pushState({}, '', '/?x=2'); window.dispatchEvent(new PopStateEvent('popstate'))`
   - Attempt B: if Attempt A doesn't cause React re-render, use a tiny test-only button that calls `useNavigate()('?x=2')` — NO, that requires prod code change, which is out of scope.
   - Attempt C: fall back to `await page.goto('/?x=2')` — WRONG, this is a full reload which WILL fire a beacon.
   - Correct approach: `await page.evaluate(() => window.history.pushState({}, '', '/?x=2'))` — BrowserRouter listens to `popstate` only, so `pushState` alone doesn't re-render. But that means `useGAPageview` effect doesn't fire, which is what we're asserting. **The test passes trivially.**
   - Engineer: implement Attempt A (pushState + dispatchEvent popstate). Confirm via dev server that React re-renders with new search. Verify count unchanged. Commit.
10. **P3-Step-2:** Write T8 (NEG-HASH) — `window.location.hash = '#team'` fires `hashchange` but not `popstate` or pathname change. Commit.
11. **P3-Step-3:** Write T9 (NEG-SAMEROUTE). Commit.

### After all 9 tests pass:

12. **P4-Step-1:** Run full Playwright suite (`npx playwright test`) to confirm no regression of existing K-018 `ga-tracking.spec.ts` or other specs.
13. **P4-Step-2:** Update `agent-context/architecture.md` §Testing sub-section (see §7 below).
14. **P4-Step-3:** Engineer prepends retro to `docs/retrospectives/engineer.md`.

### Can parallelize?

- **P1 ↔ P2 ↔ P3 test implementations** within a Phase are independent, but sequential implementation is recommended so Dry-Run records are captured in order (DR-1→5 depend on prior setup).
- **No cross-layer work** — single spec file + docs only. No backend / frontend source code change.

---

## 5.2 Shared Component Blast Radius

(N/A — this ticket touches only test files and docs. No production component props / API endpoint changes.)

**Target-Route Consumer Scan (K-030 persona rule):** `/about` is the target route for SPA-NAV tests. Entry points:

```bash
grep -rn 'to="/about"\|href="/about"' frontend/src/
```

| File | Component | Link element | Behavior status |
|------|-----------|--------------|-----------------|
| `frontend/src/components/UnifiedNavBar.tsx` | `UnifiedNavBar` | `<Link to="/about">` (SPA, same-tab) | `aligned` — covered by T1 |
| `frontend/src/components/home/BuiltByAIBanner.tsx` | `BuiltByAIBanner` | `<Link to="/about">` (SPA, same-tab) | `aligned` — covered by T2 |

Any `/about` entry points beyond these 2 in production code? Engineer grep at P1-Step-2 before implementing T1 to confirm no drift (expected: 2 — same as this table).

---

## 5.3 QA Non-Blocking Considerations — Disposition

Per ticket §Architect Non-Blocking Considerations:

| QA # | Issue | Architect disposition |
|------|-------|----------------------|
| QA #8 — back/forward pageview | Covered by truth table row 6 (§1). **Defer**: not in AC, Known Gap for future K-XXX. Reason: expand-scope risk; React Router popstate path is identical code path to Link click, low incremental coverage. |
| QA #9 — rapid navigation race | **Defer to Tech Debt (TD-K020-01)**: stress test A→B→C <100ms. Not in AC. Reason: real-user frequency low; `fullyParallel:false` makes rapid sequence a simulation artifact. Mark as TD after K-020 close. |
| QA #10 — `page.route()` cleanup | **Implemented**: `installBeaconCollector` registers inside `test.beforeEach` so page fixture teardown handles it. No explicit `afterEach page.unroute()` needed. Addressed in §2.2. |
| QA #13 — programmatic `useNavigate()` | **Defer**: same hook path, equivalent coverage by T1/T2. Documented in §2 note. No separate AC. |
| QA #14 — test matrix dedup (NavBar + Banner both → `/about`) | **REJECTED** per ticket §Architect Non-Blocking Considerations (already locked by PM). Entry-point-diff is intentional control variable. No action. |

---

## 6 Boundary Pre-Emption Table

For each test/AC, enumerate boundaries:

| AC | Empty/null input | Boundary value | Error response | Concurrency | Empty/single/large |
|----|-----------------|----------------|----------------|-------------|---------------------|
| SPA-NAV (T1/T2) | dataLayer empty at test start (if GATracker hasn't mounted) → `waitForFunction` blocks until page_view present; T1 guards by pre-waiting for ANY page_view before snapshot | N/A | Missing About link → `getByRole` throws (fail fast); expected behavior | Double-click NavBar? → second click is same-route NEG (covered by T9); if user clicks during first nav, React Router dedupes or queues. Not covered here. Defer TD-K020-02. | dataLayer with 100 entries (if session long) — slice(before) ensures only new entries checked ✓ |
| BEACON-INITIAL (T3) | No beacon arrives in 5s → `expect.poll` fails with clear message ✓ | Initial load retry (gtag.js may retry) — fulfill(204) prevents retry | GA4 server unreachable → irrelevant, we fulfill locally ✓ | Test sequencing: `fullyParallel:false` guards against cross-test beacon bleed; per-test `beacons` array is closure-scoped | ✓ |
| BEACON-SPA (T4) | Initial snapshot = 0 → unexpected (initial load should fire). If 0, test fails at `expect.poll toBeGreaterThan(0)` first; test doesn't proceed to SPA assertion | 5s timeout — gtag.js debounce delay; if beacon arrives at 5.01s test fails. If flaky, bump to 10s and log. | N/A (we fulfill 204 always) | StrictMode double-invoke on initial render → initial count could be 2, not 1. T4 uses `toBeGreaterThan(initial)` (delta), so works for any initial. | ✓ |
| BEACON-PAYLOAD (T5) | beacons[0] undefined → `expect.poll` catches. | URL regex edge cases: `&` delimiter at end of string vs mid-string — regex uses `(&|$)` ✓ | Unexpected key name (MP v3 future) — test breaks, that's correct (forces re-pin) | N/A | Only asserts beacons[0] — beacons[1..N] unchecked. Multiple initial-load beacons would silently pass. Acceptable. |
| BEACON-COUNT (T6) | beacons empty after 1s settle → 0 ≠ 1, fails correctly | 1s settle window — if gtag.js debounces longer, count = 0. If DR-4 shows count = 0 at 1s, bump window to 2s. | N/A | **StrictMode double-invoke** — see §2.7, flagged for PM decision if it fails | ✓ |
| NEG-QUERY (T7) | If pushState doesn't trigger React re-render, test passes trivially (vacuous). DR-5 must confirm re-render occurs via dispatching popstate. | Bounded 500ms — see §2.6 | N/A | If backgrounded tab throttles, browser API may delay beacon. Dev server tests are foregrounded. | ✓ |
| NEG-HASH (T8) | hashchange fires but doesn't touch pathname → expected no beacon ✓ | Same 500ms | N/A | N/A | ✓ |
| NEG-SAMEROUTE (T9) | If About Link has `<Link reloadDocument>` attribute, would full-reload → beacon fires. UnifiedNavBar does NOT use reloadDocument. Confirmed @ L22–26. | 500ms | N/A | If click triggers programmatic `navigate('/about', { replace: true })` hypothetical — same hook path, no beacon. | ✓ |

**No ❌ cells** — all boundaries either defined in AC or deferred as Known Gap / TD.

---

## 7 Architecture Doc Sync (`agent-context/architecture.md`)

Append new sub-section under existing `## QA Artifacts` section OR create new `## Testing` heading. **Decision:** append new section `## GA4 E2E Test Matrix` since QA Artifacts is about visual-report specifically.

### Proposed edit

New section inserted after `## QA Artifacts`:

```markdown
---

## GA4 E2E Test Matrix (K-018 + K-020)

**Test files (all in `frontend/e2e/`):**

| File | Layer | Created | Owns |
|------|-------|---------|------|
| `ga-tracking.spec.ts` | Helper / shape layer | K-018 | `addInitScript` dataLayer spy — asserts `trackPageview` / `trackCtaClick` push correct Arguments-object shape. INSTALL + PAGEVIEW + CLICK + PRIVACY + PRIVACY-POLICY cases. |
| `ga-spa-pageview.spec.ts` | HTTP beacon + SPA nav layer | K-020 | No mock; observes production `window.dataLayer` + intercepts real `/g/collect` via `context.route('**/g/collect*', fulfill 204)`. Phase 1 SPA-NAV (2 tests) + Phase 2 BEACON-INITIAL/SPA/PAYLOAD/COUNT (4 tests) + Phase 3 NEG-QUERY/HASH/SAMEROUTE (3 tests). 9 tests total. |

**Intercept contract:** per KB `FE/playwright-network-interception.md`, context-level `context.route('**/g/collect*', fulfill({status:204}))` is canonical. Handler registered inside `test.beforeEach` to ensure page-fixture teardown (no cross-test bleed).

**GA4 MP v2 payload pins (K-020 BEACON-PAYLOAD):** `v=2`, `tid=G-TESTID0000` (test env only), `en=page_view`, path-key (`dl` or `dp`) containing current pathname.

**Hook behavior lock (K-020 NEG-*):** `useGAPageview` depends on `[location.pathname]` only. Query-only / hash-only / same-route navigation MUST NOT fire pageview. To change this, new ticket required (update AC + hook + tests simultaneously).

**K-018 regression guard:** `gtag = function () { dataLayer.push(arguments) }` (Arguments-object) is enforced by the BEACON-INITIAL + BEACON-SPA tests — if shape drifts to spread-Array, gtag.js rejects the event internally and no `/g/collect` beacon is sent, which these tests catch as `beacons.length === 0` after 5s timeout. (K-018 bug was invisible to `ga-tracking.spec.ts` because its `addInitScript` mock replaced the production shape; K-020 observes production dataLayer post-`initGA()` specifically to close this gap.)
```

**Changelog entry (prepend to existing Changelog list):**

```
- **2026-04-22**（Architect, K-020 設計）— GA4 SPA Pageview E2E 測試硬化設計：新增 `frontend/e2e/ga-spa-pageview.spec.ts`（9 tests：SPA-NAV × 2 + BEACON × 4 + NEG × 3）；`ga-tracking.spec.ts`（K-018）保留不動；新增 §GA4 E2E Test Matrix 段落（layer / owns / intercept contract / payload pins / hook behavior lock / K-018 regression guard）。No production code change. 設計文件：[K-020-ga-spa-pageview-e2e.md](../docs/designs/K-020-ga-spa-pageview-e2e.md)。
```

---

## 8 All-Phase Coverage Gate (Persona Check)

| Phase | Backend API | Frontend Routes | Component Tree | Props Interface |
|-------|------------|----------------|----------------|-----------------|
| 1 (SPA-NAV) | N/A (no backend) | `/` → `/about` covered (T1/T2) | NavBar + Banner entry points verified | N/A (no new component) |
| 2 (BEACON) | N/A | `/about` direct + `/` → `/about` | N/A | N/A |
| 3 (NEG) | N/A | `/` → `/` with search, `/about` with hash, `/about` re-click | N/A | N/A |

All "N/A" cells are legitimate: pure test ticket with no production code change. Gate passes.

---

## 9 Refactorability Checklist

- [x] **Single responsibility:** new spec file owns one concern (K-020 SPA pageview + beacon E2E).
- [x] **Interface minimization:** `installBeaconCollector` takes only `context`, returns `beacons` array — minimal surface.
- [x] **Unidirectional dependency:** test file depends on Playwright + production code only; no circular.
- [x] **Replacement cost:** if Playwright is ever swapped (unlikely), the route interception helper is the only thing to rewrite — 1 file.
- [x] **Clear test entry point:** each `test()` has clear input (page goto / click) and output (beacon array + dataLayer). QA can read AC+spec without source-diving.
- [x] **Change isolation:** test file change doesn't affect production; production change (to analytics.ts / useGAPageview) will break these tests explicitly (that's the point — they're regression guards).

---

## 10 Dry-Run Record (Engineer fills during implementation)

_(Empty — Engineer to populate per §3.2 DR-1..DR-5 during P2-Step-1 / P2-Step-5 / P3-Step-1.)_

---

## 11 Retrospective

**Where most time was spent:** §1 Files Inspected truth table — building the 6-row navigation behavior matrix required cross-referencing `useGAPageview.ts` (dep array `[location.pathname]`) against the truth table for NEG-* AC. Without this table, NEG-QUERY rationale would have been fuzzy ("Engineer decides" — exactly the anti-pattern).

**Which decisions needed revision:** GA4 MP v2 `dl` vs `dp` payload key — initially tempted to pin `dl` decisively in design (knowledge: GA4 gtag.js emits `dl` always), but per Pre-Design Dry-Run Proof gate I could not claim "pre-existing / legacy" behavior without a `git show <base>:<file>` style source citation. Compromise: write tolerant regex `[?&](dl|dp)=` + mandate Engineer Dry-Run DR-1..3 at implementation time. This is the correct handling — primary K-018 guard (beacon count ≥ 1) is assertion-complete; secondary key pin is dry-run-deferred.

**Next time improvement:** When the ticket explicitly asks Architect to dry-run a value (AC-020-BEACON-PAYLOAD: "Architect dry-run 確認 GA4 MP v2 使用 `dl` vs `dp`"), the Architect persona has no "run browser / curl" capability. Either (a) mandate persona can spawn a playwright dry-run sub-task, or (b) redefine such AC as "Engineer dry-run at implementation, fill design §Dry-Run Record". I've chosen (b) here by writing tolerant regex and explicit DR-1..3 requirement. Propose codifying into senior-architect.md as a named pattern: "Dry-Run Deferral — when AC asks Architect to fix a value that requires browser/network execution, design must include a test-tolerant assertion + Engineer Dry-Run Record requirement."
