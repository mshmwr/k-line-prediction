---
id: K-020
title: GA4 SPA Pageview E2E — Link click → route change → pageview + HTTP beacon verification
status: closed
type: test
priority: medium
size: M
created: 2026-04-19
updated: 2026-04-22
closed: 2026-04-22
qa-early-consultation: docs/retrospectives/qa.md 2026-04-22 K-020
architect-design: docs/designs/K-020-ga-spa-pageview-e2e.md
known-failing-test: frontend/e2e/ga-spa-pageview.spec.ts T4 AC-020-BEACON-SPA → tracked by K-033
follow-up: docs/tickets/K-033-ga-spa-beacon-emission-fix.md
deploy: N/A — test-only ticket, no frontend/src or backend runtime code change
---

## Background

The K-018 GA4 Tracking E2E only verifies the pageview event triggered by an initial `goto(url)` page load. But the SPA route change (user clicks a NavBar Link → React Router navigate → the `useEffect` of the `useGAPageview` hook reacts to `location.pathname` → `trackPageview` is called) is a completely different code path that is not currently covered by Playwright.

K-018 Code Reviewer S1 raised this gap; PM ruled it as a follow-up ticket.

**2026-04-21 scope expansion — structural gap exposed by a K-018 production bug:**
After K-018 went live, GA4 Realtime showed 0 users. Root cause: `window.gtag = function (...args) { dataLayer.push(args) }` (which spreads into an Array) was actually ignored by gtag.js — gtag.js distinguishes gtag commands from GTM events by the difference between an Arguments object and an Array. The whole E2E suite passed yet did not catch this bug, because when the mock used `addInitScript` to override `window.gtag`, production `initGA()` immediately overwrote it again during `main.tsx` initialization; the existing `entry[0]`/`entry[1]` assertions happened to hold for both Array and Arguments shapes, so the shape mismatch was completely missed. This ticket expands the scope to add HTTP beacon assertions, ensuring future helper-internal changes cannot silently break the suite against the real GA4 pipeline.

**2026-04-22 PM re-plan + BQ resolution:**
- Fix the wording error in AC-020-SPA-NAV: the original draft "dataLayer contains `{ event: 'page_view', page_location }`" is the **GTM dataLayer format**, not the gtag.js Arguments format; production code's `window.dataLayer.push(arguments)` pushes an Arguments object (index 0 = `'event'`, index 1 = `'page_view'`, index 2 = `{page_location, page_title}`).
- Split into 2 phases: P1 = SPA-NAV dataLayer assertion; P2 = BEACON real HTTP verification (intercept-based; see §BQ Resolution).
- The original AC-020-SPY-PATTERN is an implementation detail not suitable as an AC; converted to an Architect BQ.
- Path correction: the ticket background mentions `frontend/src/ga/*` — the actual helper is at `frontend/src/utils/analytics.ts` and the hook is at `frontend/src/hooks/useGAPageview.ts`.
- BQ-1 / QA #5 / QA #6 / QA #7 / QA #15 are all ruled (see §BQ Resolution); ACs rewritten per ruling.

## Goals

- Verify that after an SPA Link click (NavBar or BuiltByAIBanner CTA), `useGAPageview` triggers a pageview event when the new route renders
- Cover the full timing chain "click → React Router navigate → `useEffect` on `location.pathname` → `trackPageview` → `window.gtag('event', 'page_view', ...)`"
- Give the ga-tracking test suite end-to-end verification capability against the production GA4 pipeline (gtag.js → `/g/collect` endpoint), not just helper-layer shape assertions
- Use the `page.route()` intercept pattern so CI can fully verify beacon emission even without outbound network access

## Scope

**Includes:**
- Playwright E2E: at least one SPA navigate scenario (`/` → NavBar About → `/about`), verifying that after navigate `window.dataLayer` contains a pageview entry corresponding to the new route (Arguments-object shape)
- Use `waitForURL` / `waitForFunction` instead of `waitForTimeout`
- HTTP beacon assertion: use `page.route('**/g/collect*', ...)` to intercept beacon requests sent to `google-analytics.com`; assert URL + query string contain the required fields of the GA4 Measurement Protocol (see AC-020-BEACON-PAYLOAD)
- Negative tests: query-only / hash-only / same-route navigation must not trigger an extra beacon
- The existing `ga-tracking.spec.ts` mock strategy is refactored by the Engineer per the Architect's design

**Excludes:**
- GA4 Admin Console verification
- Stress testing of multi-step SPA navigate chains (e.g. `/` → `/about` → `/diary` → `/`)
- Full offline GA4 endpoint response stubbing (the intercept only needs `route.fulfill({status: 204})` to terminate the request)
- CI/CD pipeline build-out (K-019 scope)
- Fixing the pre-existing bug where `page_location` sends pathname instead of the full URL (split out as [K-032](K-032-ga-page-location-full-url.md))

## Phases

**Phase 1 — SPA-NAV (dataLayer assertion)**
- Covers AC-020-SPA-NAV
- Asserts the dataLayer entry (does not assert the beacon) but still registers a context-level `context.route('**/g/collect*', route => route.fulfill({status: 204}))` interceptor; this prevents real beacon emission by gtag.js from failing with a network error and polluting the test report when CI has no egress. Industry convention (see `FE/playwright-block-analytics.md` if the KB has been compiled) intercepts at the context level, leaving per-test specs to assert (or not assert) only
- Failure mode: if `useGAPageview` is removed or its `useEffect` dependency array is wrong, this phase should fail

**Phase 2 — BEACON (Playwright route intercept assertions)**
- Covers AC-020-BEACON-INITIAL, AC-020-BEACON-SPA, AC-020-BEACON-PAYLOAD, AC-020-BEACON-COUNT
- Uses `page.route('**/g/collect*', route => { record(route.request()); route.fulfill({status: 204}); })`
- **Does not require** outbound network; CI-agnostic
- Failure mode: if the gtag call format is wrong and the beacon is not emitted (K-018 class bug), the interceptor receives no request → the test fails

**Phase 3 — Negative tests (lock the behavior)**
- Covers AC-020-NEG-QUERY, AC-020-NEG-HASH, AC-020-NEG-SAMEROUTE
- The interceptor records all `/g/collect` requests and asserts the beacon count **does not change** after the specified action
- Locks the current `[location.pathname]` deps behavior; if query/hash sensitivity is required in the future, open a separate ticket + change the AC

## AC

**AC-020-SPA-NAV:** SPA Link click triggers a dataLayer pageview entry (Phase 1)
- **Given**: the user is on the `/` page, `VITE_GA_MEASUREMENT_ID='G-TESTID0000'` (configured in playwright.config.ts), and `window.dataLayer` has been initialized by production `initGA()`
- **When**: the user clicks the NavBar `About` Link (not `page.goto('/about')`), triggering a React Router SPA navigate
- **Then**: Playwright uses `page.waitForURL(/\/about$/)` to confirm the URL switch is complete, and uses `waitForFunction` to confirm an Arguments-object entry exists in `window.dataLayer` satisfying: entry[0] === 'event' AND entry[1] === 'page_view' AND entry[2].page_location === '/about'
- **And**: this entry must be produced after the click action and must not be confused with the pageview from the initial `/` load (the test must record `dataLayer.length` before the click and assert that the length strictly increased after the click and that the new entry points to `/about`)
- **And**: the test contains no `waitForTimeout`, instead synchronizing via `waitForURL` + `waitForFunction`
- **And**: at least 2 independent Playwright test cases — one covering the NavBar Link (`/` → `/about`) and one covering the BuiltByAIBanner CTA (`/` → `/about`, a different DOM entry point); each case is its own spec (must not be merged)

**AC-020-BEACON-INITIAL:** Initial page load emits a pageview beacon (Phase 2)
- **Given**: `VITE_GA_MEASUREMENT_ID='G-TESTID0000'`, `page.route('**/g/collect*', ...)` is registered before the test starts, and the interceptor uses `route.fulfill({status: 204})` to terminate the request and collects `route.request()` into a per-test array
- **When**: the user runs `page.goto('/about')`, triggering the initial pageview
- **Then**: the interceptor receives at least 1 `/g/collect` request within a 5-second timeout
- **And**: the request host must be `www.google-analytics.com` (or `google-analytics.com`)
- **And**: when the test fails it must throw (no `test.skip()` or try-catch swallowing) so beacon-not-emitted issues are immediately visible

**AC-020-BEACON-SPA:** SPA navigate emits a new pageview beacon (Phase 2 — primary guard for the K-018 class bug)
- **Given**: the interceptor is registered and has recorded the beacon list received from the initial `/` load as `initialBeacons`
- **When**: the user clicks the NavBar `About` Link, triggering an SPA navigate to `/about`
- **Then**: after `page.waitForURL(/\/about$/)`, the interceptor receives at least 1 **new** `/g/collect` request within a 5-second timeout (`beacons.length > initialBeacons.length`)
- **And**: the new request's path key (`dl` or `dp` — confirmed by Architect dry-run as the actual key name used by GA4 Measurement Protocol v2) must contain `/about` after urlDecode
- **And**: at least 1 independent Playwright test case

**AC-020-BEACON-PAYLOAD:** Beacon query string pins required fields (Phase 2)
- **Given**: the interceptor has captured a pageview beacon request (provided by AC-020-BEACON-INITIAL or AC-020-BEACON-SPA)
- **When**: the test reads `request.url()` and parses the query string
- **Then**: the query string must contain `v=2` AND `tid=G-TESTID0000` AND `en=page_view`
- **And**: the path key (`dl` or `dp`, decided by Architect dry-run) must exist and, when urlDecoded, correspond to the current route
- **And**: in the design doc §Dry-run, the Architect records the actual key name (`dl` vs `dp`) of the GA4 Measurement Protocol v2 payload from local testing, and freezes it when the AC is implemented

**AC-020-BEACON-COUNT:** Exactly 1 beacon per pageview (Phase 2)
- **Given**: the interceptor is registered and the beacon array is empty
- **When**: the user completes 1 pageview action (initial load or SPA navigate)
- **Then**: within 1 second after the action completes, the count of `/g/collect` requests received by the interceptor is exactly 1 (not 0 and not ≥2)
- **And**: this AC guards against beacon duplication caused by StrictMode double-invoke or future duplicate call sites

**AC-020-NEG-QUERY:** Query-only changes do not trigger a pageview (Phase 3)
- **Given**: the user is on `/?x=1` and the interceptor records the beacon count at this point as N
- **When**: the URL changes to `/?x=2` (query changes, pathname unchanged; triggered via `page.goto` or router `navigate`)
- **Then**: after waiting 500ms, the interceptor's beacon count must still be N (no increase)
- **And**: this AC locks the current `[location.pathname]` deps behavior of `useGAPageview`; if a query change is later required to trigger a pageview, the AC + code + a new ticket are needed

**AC-020-NEG-HASH:** Hash-only changes do not trigger a pageview (Phase 3)
- **Given**: the user is on `/about` and the interceptor records the beacon count at this point as N
- **When**: the URL changes to `/about#team` (hash changes, pathname unchanged)
- **Then**: after waiting 500ms, the interceptor's beacon count must still be N

**AC-020-NEG-SAMEROUTE:** Clicking the current route's Link does not trigger a pageview (Phase 3)
- **Given**: the user is already on `/about` and the interceptor records the beacon count at this point as N
- **When**: the user clicks the NavBar `About` Link again
- **Then**: after waiting 500ms, the interceptor's beacon count must still be N

## BQ Resolution (2026-04-22 PM ruling)

**BQ-1 — CI network egress policy:** Option B (Playwright route intercept)
- Decision: the entire AC-020-BEACON series uses the `page.route('**/g/collect*', ...)` intercept pattern with `route.fulfill({status: 204})` to terminate the request
- Rationale: catches the K-018 class bug (wrong call format → request not emitted → interceptor receives nothing → test fails); CI-agnostic (no egress required); stable (does not depend on Google server availability)
- Side effect: the test does not verify whether the GA server actually receives the event; that responsibility is not the frontend test's

**BQ-2 — Mock strategy (spy vs replace):** Option A (remove the addInitScript mock and directly observe the production dataLayer)
- Rationale: the real production execution path = Arguments-object push; asserting this shape directly is closest to the K-018 retro lesson (the order between mock and production override is unreliable)

**BQ-3 — beacon SPA race condition:** delta comparison (the interceptor array records before/after snapshots)
- Confirmed jointly by AC-020-BEACON-SPA's `beacons.length > initialBeacons.length` assertion + path key contains `/about`
- Does not depend on `waitForRequest` timing

**QA Challenge #5 — payload keys unpinned:** added to AC-020-BEACON-PAYLOAD
- Must verify `v=2` + `tid=G-TESTID0000` + `en=page_view` + path key (dry-run confirms `dl` vs `dp`)

**QA Challenge #6 — SPA → beacon cross-verify:** added to AC-020-BEACON-SPA
- No longer deferred; this is the core guard AC for the K-018 class bug

**QA Challenge #7 — same-route / query-only / hash-only navigation:** Option A (preserve current behavior + lock it via negative tests)
- Added to AC-020-NEG-QUERY / NEG-HASH / NEG-SAMEROUTE
- Rationale: the project currently has no query-driven pages; lock behavior with negative tests, and if a real change is needed in the future open a ticket + change the AC

**QA Challenge #15 — `page_location` sends pathname instead of full URL is a pre-existing bug:** Option Y (track in a separate ticket [K-032](K-032-ga-page-location-full-url.md))
- This ticket's scope is test hardening; do not mix in fixing a production bug
- The AC text keeps `page_location === '/about'` to reflect the **current behavior**; the AC is updated in lockstep when K-032 ships

## Architect Non-Blocking Considerations (design doc must address)

These are non-blocking suggestions raised in the QA Early Consultation; in the design doc the Architect must explicitly state how each is handled (implement / defer / reject + rationale):

- **QA #10 — `page.route()` cleanup on failure:** the route interceptor should be registered inside the test body (not `beforeAll`) so it is cleaned up automatically by the Playwright page fixture teardown; if shared across tests, `page.unroute()` must be called explicitly in `afterEach`. Architect to finalize in design doc §Test Scaffold
- **QA #8 — back/forward browser navigation:** the current `useGAPageview` `[location.pathname]` deps theoretically should fire on popstate; Architect to evaluate whether to add a positive test covering this path
- **QA #9 — rapid navigation race:** whether the beacon count is stable across <100ms A→B→C switches; Architect to decide whether to add a stress test or defer
- **QA #13 — programmatic navigate:** besides Link clicks, whether route changes triggered by `useNavigate()` need an independent AC; the current AC-020-SPA-NAV only covers Link click
- **QA #14 — test matrix dedup:** Rejected. NavBar Link + BuiltByAIBanner CTA having the same target (`/about`) is an **intentionally controlled variable** — fixing the target verifies only the event-propagation paths of different entry points (NavBar `<a>` in header vs BuiltByAIBanner `<a>` in homepage banner). Changing one to `/diary` would conflate "entry point difference" with "target difference" — when a test fails we wouldn't know which variable broke. If different-target behavior is needed, write separate tests; do not replace these two

## Dependencies

- K-018 closed (fix commit `6a9d6cd`)
- K-019 (Release Versioning & CI/CD) — after BQ-1 chose Option B (route intercept), this ticket **no longer depends on** the K-019 policy decision
- K-032 (page_location full URL bug) — runs in parallel with this ticket; does not block this ticket

## Known Gap forwarded to this ticket

The follow-up listed in K-018 `## Final Close Record`: "E2E only verifies `window.gtag` call parameters, does not verify `/g/collect` HTTP beacon" → covered by the AC-020-BEACON-* series.

## Release Status

**2026-04-22 PM Phase Gate:**

- [x] All ACs follow the four-section Given/When/Then/And format
- [x] Parallel Given quantification: each AC explicitly states the number of test cases
- [x] Route/file path verification:
  - `frontend/src/utils/analytics.ts` ✓ (`initGA` + `trackPageview` + `trackCtaClick`)
  - `frontend/src/hooks/useGAPageview.ts` ✓ (`useEffect` on `location.pathname`)
  - `frontend/e2e/ga-tracking.spec.ts` ✓ (existing K-018 spec)
  - `frontend/playwright.config.ts` ✓ (`VITE_GA_MEASUREMENT_ID='G-TESTID0000'`)
- [x] Testid/selector: NavBar `About` Link text selector + `a[aria-label="About the AI collaboration behind this project"]` (BuiltByAIBanner, verified at `ga-tracking.spec.ts:166`)
- [x] AC CSS wording check: N/A (no visual AC)
- [x] QA Early Consultation — Agent(qa) ran for real 2026-04-22 (see `docs/retrospectives/qa.md`), raised 15 challenges; 3 blocking ruled by PM and written back into the AC, 11 non-blocking forwarded to the Architect
- [x] BQ-1 / QA #5 / QA #6 / QA #7 / QA #15 — user rulings complete (see §BQ Resolution)
- [x] **PM session capability**: Agent tool available, Agent(qa) ran for real; Architect summon awaiting user release

**Ready for Architect handoff (awaiting user release).**

## Retrospective

<!-- Each role appends their retrospective when finishing -->

### Engineer (2026-04-22 — C-1 fix pass, fix-only)

**Fix:** Inserted K-033 TRACKER JSDoc block at `frontend/e2e/ga-spa-pageview.spec.ts:142–161` directly above the `test('AC-020-BEACON-SPA ...)` declaration (now line 162), per PM ruling C-1 exact text.

**Gate results:**
- `grep -n "K-033 TRACKER" frontend/e2e/ga-spa-pageview.spec.ts` → 1 match at line 143 ✓
- `npx tsc --noEmit` → exit 0 ✓
- Playwright full suite → 198 passed / 1 skipped / 1 failed; only `ga-spa-pageview.spec.ts:142:3 AC-020-BEACON-SPA` red, identical to pre-fix baseline ✓
- T4 assertion unchanged (not loosened, not skipped) ✓

**No major lesson:** PM provided exact insertion text + line anchor; edit was mechanical. Doc-block does not alter runtime behavior.

### Engineer (2026-04-22 — PARTIAL, blocked on T4 BEACON-SPA)

**Deliverable status:**
- New spec `frontend/e2e/ga-spa-pageview.spec.ts` implemented per design §3.1 / §4 (9 tests: SPA-NAV × 2, BEACON × 4, NEG × 3).
- `npx tsc --noEmit` exit 0 on the new spec.
- Spec run result: **8 pass / 1 fail** (only T4 `AC-020-BEACON-SPA`).
- Full suite regression: **198 pass / 1 skip / 1 fail** — only the new T4, no pre-existing suite broken.
- Architect design doc Dry-Run Records DR-1/2/3/4 populated in this retrospective (design doc §10 stub remains empty — captured here because the dry-run surfaced a scope-blocker; re-adding to design doc is Architect's call on next round).

**Dry-Run Record (Engineer):**

| Step | Observation |
|------|-------------|
| DR-1 | Initial `page.goto('/')` emits 1 `/g/collect` beacon with `v=2&tid=G-TESTID0000&en=page_view&dl=%2F&dt=K-Line%20Prediction%20%E2%80%94%20Home&_ss=1`. Confirmed MP v2. |
| DR-2 | Path key is `dl=%2F` (URL-encoded `/`), NOT `dp=`. GA4 gtag.js in dev env emits MP v2 canonical `dl` (full URL). On `/about` initial load, `dl=%2Fabout`. |
| DR-3 | Tolerant regex `[?&](?:dl|dp)=[^&]*%2Fabout` matches both; pinned-in-spec. |
| DR-4 | Initial-load beacon count under StrictMode = 1 (not 2). gtag.js internally dedupes the two StrictMode-produced dataLayer `['event','page_view',...]` entries into a single `/g/collect` request. AC-020-BEACON-COUNT `.toBe(1)` passes as designed — StrictMode guard NOT needed for this AC. |
| DR-5 | AC-020-NEG-QUERY: `pushState('/?x=2') + dispatchEvent(new PopStateEvent('popstate'))` does trigger BrowserRouter state update, but `location.pathname` does not change → `useGAPageview` effect does not re-fire → beacon count unchanged. Test passes, behavior correctly locked. |

**T4 AC-020-BEACON-SPA failure — root-cause analysis (production bug, not test bug):**

After the SPA navigate `/` → `/about`, `useGAPageview` correctly pushes the Arguments-object `['event','page_view',{page_location:'/about', page_title:'…About'}]` entry onto `window.dataLayer` — verified via `page.evaluate()` in canary diagnostic. But gtag.js **never emits a follow-up `/g/collect` beacon** for this entry:

1. `initGA()` calls `gtag('config', id, { send_page_view: false })` (correct, prevents dup at initial load since `useGAPageview` handles the initial pageview too).
2. On route change, `useGAPageview` calls `gtag('event', 'page_view', {page_location, page_title})` directly.
3. In GA4 gtag.js modern behavior, a manual `event page_view` while `send_page_view: false` is in effect on the config-scope is NOT enough to trigger a new `/g/collect` request — gtag.js needs either:
   - `gtag('config', id, { page_path, page_title })` (re-emits `send_page_view` with the new context), OR
   - `gtag('set', 'page_location', fullUrl); gtag('set', 'page_title', title); gtag('event', 'page_view')` (updates session context first).

Canary attempts (see Engineer retrospective log 2026-04-22):
- Full-URL `page_location` in the event call → still no new beacon (rules out K-032 as the cause — K-032 is about what value to pass, not whether beacon is emitted).
- `gtag('config', id, {page_path, page_title})` → triggers a follow-up beacon, but it's `_eu=AAAAAAQ` (user_engagement update) with no `en=page_view`, so AC-020-BEACON-SPA's "new beacon referencing /about" assertion would still need adjustment.

**Conclusion:** **AC-020-BEACON-SPA correctly caught a K-018-class production bug that the existing `ga-tracking.spec.ts` shape-only mock missed — this is the test succeeding at its stated purpose (per ticket §Background, §Goals, §Known Gap)**. Fixing it requires changing `frontend/src/hooks/useGAPageview.ts` to use the canonical GA4 SPA pattern (`gtag('config', ...)` or `gtag('set',...)+gtag('event',...)`), which is a **production code change** that the design doc explicitly placed out of scope ("`useGAPageview.ts` UNCHANGED — behavior locked by AC-020-NEG-*", design §4 file change list).

**Escalating to PM — options:**

- **Option A (split):** merge the 8 green tests as-is (useful regression guard even without T4), open a new ticket K-033 (or expand K-032 scope) to fix the production hook + turn T4 green. K-020 closes at 8/9 with T4 marked `test.fixme()` + tracking comment.
- **Option B (expand K-020 scope):** keep T4 failing, add a Phase 4 to K-020 to rewrite `useGAPageview` with the canonical GA4 SPA pattern, then rerun T4. Requires Architect round 2 (design doc §4 file change list must change `useGAPageview.ts UNCHANGED` → modify).
- **Option C (loosen AC-020-BEACON-SPA):** weaken to "dataLayer has a `page_view` entry referencing `/about` after SPA nav" (dataLayer shape, not beacon emission). This **reintroduces** exactly the K-018 gap the ticket was written to close — Engineer recommends against.

**Engineer recommendation:** Option A (split). Keeps 8 green guards landed, preserves T4's scope boundary (test-only ticket stays test-only), and assigns the production fix to a focused follow-up where Architect can design the gtag pattern migration cleanly (potentially merged with K-032 since both touch `useGAPageview.ts`). T4 stays as `.fixme()` or similar until the follow-up lands.

**Status:** `blocked-pm-decision`. Not marking `ready-for-review` — PM ruling required first.

### PM Ruling (2026-04-22)

**Decision: Option A — split.** K-020 closes at 8 pass / 1 red / no-regression; K-033 created to fix `useGAPageview` gtag call pattern.

**Pre-Verdict Checklist:**

| Option | Preserve K-018 class guard | Impl cost | Fix clarity | Test debt risk | Scope boundary | Reversibility | Total |
|--------|---------------------------|-----------|-------------|----------------|----------------|---------------|-------|
| A: Split | 2 | 2 | 2 | 1 | 2 | 2 | **11/12** |
| B: Expand K-020 to Phase 4 (hook rewrite) | 2 | 0 | 1 | 2 | 0 (violates §Scope exclusion) | 1 | 6/12 |
| C: Loosen AC-020-BEACON-SPA to dataLayer only | 0 (reintroduces K-018 gap) | 2 | 0 | 2 | 0 | 2 | 6/12 |

**Red Team self-check (all counterable):**
1. Future PM: "why a permanently red test?" → T4 is NOT `.fixme()` / `.skip()`; K-033 priority medium + dashboard row + test-file pointer = self-documenting. Red vs hidden: red wins.
2. Future Engineer debugging GA4 in prod: T4's failure message + retro line is the exact diagnostic they need — a passing-but-silent test would be worse.
3. Devil's advocate (6-month stagnation): mitigated by K-033 medium priority + dashboard Active row + test-file comment pointing to K-033.

**K-032 merge question answered: NO.** K-032 scope (page_location pathname → full URL) is a **value** change; K-033 scope (gtag call pattern for SPA beacon emission) is a **call pattern** change. Engineer DR proved "passing full URL does not fix beacon emission" — K-032 alone cannot unblock T4. K-033 soft-depends on K-032 (land K-032 first so call-pattern fix uses correct value), but they do NOT merge.

**Biggest unresolved risk:** K-033 slips indefinitely → T4 becomes desensitized → eventually disabled. Mitigations: K-033 `priority: medium` (not low), K-033 on PM-dashboard Active row, T4 file comment pointing to K-033 (Engineer to add on next K-020 delivery pass).

**Bug Found Protocol (4-step):**

1. **Responsible role retrospective:**
   - Primary: **K-018 Engineer** — shipped `gtag('event','page_view',{…})` pattern inside `useGAPageview` without end-to-end verification that gtag.js actually emits `/g/collect` for SPA navigations. K-018 E2E `addInitScript`-based mock hid this because it replaced `window.gtag` and never exercised real gtag.js.
   - Secondary: **K-020 Architect** — design doc §2.5 correctly named "beacon count ≥ 1 after SPA navigate" as the primary K-018 guard but could not runtime-dry-run production SPA path (persona tool limitation). Already noted in K-020 Architect retrospective §11 "Dry-Run Deferral".
   - NOT responsible: K-020 Engineer — T4 assertion is correct; red state IS the designed behavior. K-020 Architect for the static design — the test correctly catches the real bug.

2. **PM Quality Check:** Accepted. T4's red state is a well-designed regression test catching a pre-existing production bug exactly as ticket §Background / §Goals stated. Engineer Option A recommendation is sound.

3. **Memory + persona:** Engineer persona already has "Regression-Guard Test Failing on First Run (K-020 2026-04-22)" rule at `~/.claude/agents/engineer.md` L252-270 (added this round by Engineer retro). No new persona edit needed — rule is codified. PM retrospective log (below) captures the BQ ruling pattern.

4. **Release for fix:** K-033 created (`docs/tickets/K-033-ga-spa-beacon-emission-fix.md`); K-020 status `ready-for-review` for the 8 green tests + T4 tracked as known-failing pointer to K-033.

**K-033 Priority justification (medium, not low):**
- T4 is a visible, permanently red assertion in CI output — every Playwright run surfaces it
- GA4 Realtime in production currently shows SPA navigates as missing pageviews (K-033 fixes visible product metric)
- Architect for K-033 needs dry-run gate (table in K-033 ticket §Dry-Run Gate) which is independent design work

**Next step for K-020:** spawn Reviewer for the 8 green tests. If Reviewer accepts, K-020 moves to QA. T4 stays red through review and QA — it is documented as the K-033 tracker.

**Next step for K-033:** backlog → PM Phase Gate → Architect design with dry-run table.

### PM Ruling — Review Findings (2026-04-22)

Reviewer Step 2 returned 1 Critical + 3 Warning. All 4 ruled **fix-now**. Status flips `ready-for-review` → `fix-in-progress` for C-1 Engineer pass; W-1/W-2/W-3 executed by PM as docs-only this ruling.

**C-1 — T4 file comment pointing to K-033 (Critical, Engineer pick-up):**
- **Ruling:** fix-now. PM's own 2026-04-22 retro listed it as "biggest unresolved risk item 3" explicitly deferred to "next K-020 delivery pass" — this IS the next delivery pass.
- **Engineer action:** insert a doc-block in `frontend/e2e/ga-spa-pageview.spec.ts` directly **above line 142** (the `test('AC-020-BEACON-SPA — SPA navigate fires a NEW beacon referencing /about', ...)` line, inside the `test.describe('AC-020-BEACON — …')` block). Comment must name K-033 by ID, cite the root-cause combo, and carry the anti-loosening guard verbatim.
- **Exact insertion (copy-paste as-is, positioned between the closing `})` of the previous `test(...)` at line 140 and the `test('AC-020-BEACON-SPA — …'` on line 142):**
  ```ts
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
  ```
- **Verification after Engineer edit:** `grep -n "K-033 TRACKER" frontend/e2e/ga-spa-pageview.spec.ts` returns exactly one line immediately above the BEACON-SPA test; `npx tsc --noEmit` exit 0; no test behavior change (spec still reports 8 pass / 1 red).
- **Ownership:** Engineer (this ticket, fix-in-progress).

**W-1 — K-033 `qa-early-consultation: N/A` (Warning, PM fix-now):**
- **Ruling:** fix-now. PM's own 2026-04-22 retro marked it "soft compromise" and scheduled "re-verify at K-033 Phase Gate". pm.md §Session Handoff Verification lists `N/A` with "no edge case / layout fix / no error state" as an **AUTOMATIC violation marker**; K-033's reason ("regression spec already covers edge cases") is structurally identical to "no edge case" and must not be carried forward.
- **Action executed this ruling:** PM edited K-033 frontmatter `qa-early-consultation` from `N/A — reason: ...` to `deferred-to-phase-gate — K-033 Phase Gate MUST invoke QA Early Consultation (Agent(qa) real run) before releasing Architect`. K-033 §Release Status checklist item updated to match.
- **Ownership:** PM (done).

**W-2 — Bug Found Protocol step 1 back-fill (Warning, PM fix-now):**
- **Ruling:** fix-now. Bug Found Protocol explicitly requires "Responsible role's retrospective identifies root cause." Saying "K-020 Engineer retro added the rule, so bookkeeping redundant" skips the attribution loop — future readers auditing `docs/retrospectives/engineer.md` by date would find no K-018-attributed entry for the bug K-018 shipped.
- **Action executed this ruling:** PM prepended a K-018 attribution entry to `docs/retrospectives/engineer.md` dated 2026-04-22 with explicit `back-fill note` framing (event originated 2026-04-19, entry added 2026-04-22 via K-020 Protocol). Entry covers root cause, structural safeguard gap, and cross-references the codified `engineer.md` rule.
- **Ownership:** PM (done).

**W-3 — `architecture.md` missing "BEACON-SPA currently red" disclaimer (Warning, PM fix-now):**
- **Ruling:** fix-now. A reader landing on `agent-context/architecture.md` §GA4 E2E Test Matrix today sees "enforced by BEACON-INITIAL + BEACON-SPA tests" and reasonably assumes BEACON-SPA is an active guard. It is currently a diagnostic-only signal.
- **Action executed this ruling:** PM appended a `> **Known Gap (2026-04-22):**` blockquote immediately below the "K-018 regression guard" paragraph, naming K-033, citing root cause, listing green-vs-red test counts (8 / 9), and carrying the DO-NOT-loosen anti-guard verbatim (mirrors C-1 spec comment so both surfaces say the same thing).
- **Ownership:** PM (done).

**Status transition:**
- K-020 ticket status: `ready-for-review` → `fix-in-progress` (C-1 pending Engineer pass).
- K-020 will return to `ready-for-review` once Engineer inserts the C-1 doc-block and verifies (grep match + tsc + no test regression).

### Final Close Summary (2026-04-22)

**Status transition:** `ready-for-review` → `closed`.

**Outcome — 8 green tests landed as K-018-class regression guard:**
- New spec `frontend/e2e/ga-spa-pageview.spec.ts` delivered 9 tests covering SPA-NAV (×2), BEACON-INITIAL / BEACON-PAYLOAD / BEACON-COUNT (×4 via combined assertions), and NEG-QUERY / NEG-HASH / NEG-SAMEROUTE (×3).
- 8 pass / 1 intentionally red (T4 `AC-020-BEACON-SPA`).
- Full suite regression: 198 passed / 1 skipped / 1 failed — no pre-existing test broken; only the designed-to-fail T4 is red.
- `npx tsc --noEmit` exit 0.

**Chain of custody (chronological):**
1. PM re-plan 2026-04-22 — scope expansion, BQ resolution, QA consultation (Agent(qa) real run, 15 challenges, 3 blocking ruled, 11 non-blocking forwarded to Architect).
2. Architect design (`docs/designs/K-020-ga-spa-pageview-e2e.md`) — spec structure, page.route intercept pattern, dry-run deferral disclosed.
3. Engineer implementation — 9 tests, 8 pass, T4 red; escalated to PM with 3 options (A/B/C).
4. PM Option A ruling — split into K-033 follow-up. Pre-Verdict matrix 11/12 vs 6/12 / 6/12. Bug Found Protocol 4 steps executed.
5. Reviewer Step 1 (superpowers breadth) — pass.
6. Reviewer Step 2 (reviewer.md depth) — C-1 Critical + W-1/W-2/W-3 Warning.
7. PM ruling — C-1 fix-now (Engineer pick-up), W-1/W-2/W-3 PM self-handled as docs-only.
8. Engineer C-1 fix — K-033 TRACKER doc-block inserted at spec L142 above AC-020-BEACON-SPA test.
9. Reviewer re-review — pass.
10. QA regression — 198 pass / 1 skip / 1 red (T4 intentional); approved to close.

**Follow-up tickets (both live on PM-dashboard Active):**
- **[K-032](K-032-ga-page-location-full-url.md)** `bug / low` — pre-existing bug: `page_location` sends pathname instead of full URL. Value-change scope. Soft-prerequisite for K-033 (lands first so K-033's call-pattern fix uses correct value).
- **[K-033](K-033-ga-spa-beacon-emission-fix.md)** `bug / medium` — K-018-class production bug surfaced by T4: `useGAPageview` `gtag('event','page_view',…)` under `send_page_view: false` is silently dropped by gtag.js on SPA navigate. Call-pattern change (canonical GA4 SPA pattern). When K-033 lands, T4 turns green with original assertion preserved (AC-033-BEACON-SPA-GREEN).

**Anti-decay guards (three layers, codified):**
1. Spec doc-block at `frontend/e2e/ga-spa-pageview.spec.ts:142` — names K-033, explains root cause, forbids loosening the assertion.
2. `agent-context/architecture.md` §GA4 E2E Test Matrix — `> **Known Gap (2026-04-22):**` blockquote mirrors the spec anti-loosening language cross-surface.
3. `PM-dashboard.md` Active row — K-033 priority medium (not low) so it surfaces in every Phase Gate sweep.

**Deploy:** N/A — test-only ticket, no `frontend/src/**` or `backend/**` runtime code change. Confirmed via `git diff main...HEAD --stat frontend/src/ backend/` returning empty. No Firebase / Cloud Run redeploy required. Rule added to pm.md Deploy Record table: test-only tickets with no runtime-layer change = `deploy: N/A — test-only` frontmatter marker + no Deploy Record block.

**Files changed in this ticket:**
- `frontend/e2e/ga-spa-pageview.spec.ts` (new, 9 tests)
- `docs/designs/K-020-ga-spa-pageview-e2e.md` (new)
- `docs/tickets/K-020-ga-spa-pageview-e2e.md` (this file)
- `docs/tickets/K-033-ga-spa-beacon-emission-fix.md` (new follow-up)
- `docs/retrospectives/{pm,architect,engineer,qa}.md` (prepended entries)
- `agent-context/architecture.md` (§GA4 E2E Test Matrix Known Gap block)
- `PRD.md` (AC-020 Given/When/Then/And + Closed section on close)
- `PM-dashboard.md` (outer Diary: K-020 moved Active → Closed, count sync)

**No production runtime code was modified in this ticket** — scope held as test-only per §Scope.
