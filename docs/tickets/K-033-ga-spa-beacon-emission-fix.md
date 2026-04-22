---
id: K-033
title: GA4 SPA route-change beacon emission fix — useGAPageview canonical gtag pattern
status: backlog
type: bug
priority: medium
size: S
created: 2026-04-22
qa-early-consultation: deferred-to-phase-gate — K-033 Phase Gate MUST invoke QA Early Consultation (Agent(qa) real run) before releasing Architect; K-020 existing regression spec ≠ QA consultation substitute. Preliminary reason (bug-fix with K-020 regression coverage) noted as soft hypothesis, not final gate. See K-020 PM retro 2026-04-22 "soft compromise" flag + reviewer.md W-1 upgrade 2026-04-22.
blocks: K-020 AC-020-BEACON-SPA (currently red)
depends-on-soft: K-032 (page_location full URL — lands first so K-033 call-pattern change uses correct value)
---

## 背景

K-020 (landed 2026-04-22, Option A split per PM ruling) delivered 9 new Playwright tests; 8 pass, 1 red:

- **T4 AC-020-BEACON-SPA** — expects a new `/g/collect` beacon after SPA navigate `/` → `/about`. Fails because `useGAPageview` dispatches `gtag('event', 'page_view', {page_location, page_title})` which gtag.js silently ignores (does not emit a `/g/collect` request) while `send_page_view: false` is in effect on the `config` call.

K-020 Engineer Dry-Run (2026-04-22) proved:
1. Initial page load emits 1 `/g/collect` beacon correctly (`en=page_view&dl=%2F&dt=...Home`).
2. On SPA navigate, the Arguments-object `['event', 'page_view', {page_location:'/about', page_title:'…About'}]` IS pushed to `window.dataLayer` (hook wiring correct).
3. gtag.js does NOT follow up with a `/g/collect` beacon. Even a 10-second wait only produces a `user_engagement` (`_eu=AAAAAAQ`) beacon, no `en=page_view`.
4. Replacing `page_location` value with full URL (K-032 preview) makes zero difference — K-032 alone does not fix this.
5. Calling `gtag('config', id, {page_path, page_title})` DOES emit a follow-up beacon, but without `en=page_view` (it's a session context update, not a pageview event).

**This is a K-018-class production bug** — K-018 Engineer shipped `useGAPageview` that produced the correct dataLayer shape but never reached the GA4 server for SPA navigations. K-018 E2E `addInitScript` mock hid it because the mock replaced `window.gtag` and never exercised the real gtag.js path. K-020's BEACON-SPA test caught it exactly as the ticket §背景 / §目標 specified.

## 目標

- Rewrite `useGAPageview` to use the canonical GA4 gtag.js SPA route-change pattern so SPA navigates emit `/g/collect` beacons with `en=page_view` and path-key (`dl`) referencing the new route.
- Turn K-020 T4 (AC-020-BEACON-SPA) from red to green without loosening the assertion.
- Keep K-020 T7/T8/T9 (NEG-*) still green — query-only / hash-only / same-route navigation must remain non-triggering.
- Keep K-020 T3 (BEACON-INITIAL) + T6 (BEACON-COUNT) still green — initial load still emits exactly 1 beacon.

## 範圍

**含：**
- `frontend/src/hooks/useGAPageview.ts` — change call pattern from `gtag('event','page_view',{page_location,page_title})` to either:
  - **Pattern A:** `gtag('config', MEASUREMENT_ID, { page_path, page_title, send_page_view: true })` on each route change (requires making measurement ID available in the hook — currently only `utils/analytics.ts` reads `import.meta.env`).
  - **Pattern B:** `gtag('set', 'page_location', fullUrl); gtag('set', 'page_title', title); gtag('event', 'page_view')` — updates session context then fires pageview event.
  - **Architect picks** after dry-run comparing both in dev env; Pattern B is simpler but Pattern A is the pattern Google's official docs recommend for SPAs.
- `frontend/src/utils/analytics.ts` — likely change `trackPageview` signature to accept full URL (or expose measurement ID if Pattern A chosen). Keep `send_page_view: false` on the `initGA` config call (initial pageview still fired manually by the hook to avoid double-fire on mount).
- `frontend/public/diary.json` — append one item documenting the fix.

**不含：**
- `frontend/e2e/ga-spa-pageview.spec.ts` — no test change required; K-020's T4 will turn green when the production fix lands. T7/T8/T9 must remain green.
- Redesigning the pageview tracking architecture (e.g., moving to GTM, switching to `@vercel/analytics`).
- Documentation rewrite of GA4 conventions in `agent-context/architecture.md` (a small §GA4 E2E Test Matrix changelog update is in scope).

## AC

**AC-033-BEACON-SPA-GREEN：** AC-020-BEACON-SPA turns green without assertion change
- **Given**: K-020 spec `frontend/e2e/ga-spa-pageview.spec.ts` T4 (AC-020-BEACON-SPA) exists and currently fails
- **When**: K-033 production fix lands and Playwright suite runs
- **Then**: T4 passes with the original `beacons.length > initialCount` + `PATH_KEY_RE` assertions (no loosening)
- **And**: full Playwright suite reports 9 / 9 new K-020 tests passing

**AC-033-BEACON-COUNT-GREEN：** initial-load pageview remains exactly 1 beacon
- **Given**: K-020 T6 (AC-020-BEACON-COUNT) asserts initial `page.goto('/about')` emits exactly 1 pageview beacon within 1s settle
- **When**: K-033 production fix lands
- **Then**: T6 still passes (no duplicate pageview on initial mount due to the new call pattern)
- **And**: StrictMode dev mode does not cause double emission (if Pattern B's `gtag('set',...) + gtag('event','page_view')` would double-fire in StrictMode, the hook must guard via `useRef`)

**AC-033-NEG-UNCHANGED：** query-only / hash-only / same-route navigation remain non-triggering
- **Given**: K-020 T7 (NEG-QUERY) / T8 (NEG-HASH) / T9 (NEG-SAMEROUTE) are currently green
- **When**: K-033 production fix lands
- **Then**: all three still pass — the new call pattern must still be gated on `location.pathname` change only
- **And**: the hook's `useEffect` dependency array stays `[location.pathname]` (no widening to include `search` or `hash`)

**AC-033-PAYLOAD-PINNED：** beacon query carries required GA4 MP v2 keys
- **Given**: K-020 T5 (AC-020-BEACON-PAYLOAD) asserts `v=2` + `tid=G-TESTID0000` + `en=page_view` + path-key
- **When**: K-033 production fix lands
- **Then**: T5 still passes — the new call pattern must emit a beacon with `en=page_view` (not `_eu=` housekeeping); the path-key (`dl`) must reference the current route

**AC-033-NO-REGRESSION：** K-018 ga-tracking spec unaffected
- **Given**: `frontend/e2e/ga-tracking.spec.ts` has 12 passing tests (INSTALL / PAGEVIEW / CLICK / PRIVACY / PRIVACY-POLICY)
- **When**: K-033 production fix lands
- **Then**: all 12 tests still pass — the `trackPageview` function signature change (if any) must preserve the dataLayer push shape that K-018 asserts (`entry[0]==='event'`, `entry[1]==='page_view'`, `entry[2]` object with `page_location` / `page_title`)

## Dry-Run Gate (Architect mandate before design doc)

Architect MUST run a local canary test in dev env exercising Pattern A and Pattern B side-by-side, recording:

| Pattern | Initial-load beacons | SPA-nav beacons | `en=` value on SPA-nav beacon | `dl=` / `dp=` presence | StrictMode double-fire? | Recommendation |
|---------|----------------------|-----------------|------------------------------|------------------------|-----------------------|----------------|
| A: `gtag('config', ...)` | ? | ? | ? | ? | ? | ? |
| B: `gtag('set',...) + gtag('event','page_view')` | ? | ? | ? | ? | ? | ? |

Without this table, design doc is incomplete. Architect's K-020 retrospective already flagged "Dry-Run Deferral" as a known gap — K-033 design doc **cannot defer** because the entire purpose of K-033 is to fix the very behavior K-020 could only specify tolerant assertions for.

## 相依

- **K-020**: T4/T5/T6/T7/T8/T9 regression tests already in place; K-033 design is validated end-to-end by turning T4 green
- **K-032** (soft): lands first so `page_location` value is already full URL when K-033 rewrites call pattern; K-033 can land independently if K-032 slips, but then K-033 will need to coordinate the same value-fix inside Pattern A or B
- **K-018**: the pre-existing bug K-033 fixes was introduced by K-018 Engineer's choice of call pattern; K-018 already closed

## Known Gap 轉入本 ticket

- K-020 §Retrospective: Engineer reports "`gtag('event','page_view',{page_location,page_title})` while `send_page_view: false` does NOT emit `/g/collect` beacon in GA4 gtag.js modern API" → fixed here
- K-020 AC-020-BEACON-SPA red status → turns green here

## Release Status

- [ ] PM Phase Gate (pending — ticket in backlog)
- [ ] AC all Given/When/Then/And format
- [ ] QA Early Consultation — frontmatter now `deferred-to-phase-gate` (upgraded from `N/A` per K-020 reviewer W-1, 2026-04-22). PM Phase Gate MUST invoke Agent(qa) real run before releasing Architect; soft hypothesis "K-020 regression spec covers edge cases" is NOT a substitute — QA must independently assess Pattern A vs B boundaries (SSR / popstate / measurement-ID plumbing / StrictMode double-fire under `useRef` guard). No auto-approval path.
- [ ] Architect design doc with dry-run table filled
- [ ] Engineer implementation per chosen Pattern A / B
- [ ] Full Playwright suite 199 / 199 (current 198 pass + T4 flip to green)
- [ ] Deploy + Deploy Record

**Not yet released.** Created 2026-04-22 by PM as Option A follow-up from K-020 BQ ruling. Priority: medium — T4 red is a visible regression indicator that needs clearance before further GA-related work.
