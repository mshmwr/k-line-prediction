---
ticket: K-053
title: Scroll-to-top on route change — design doc
status: design-complete
visual-delta: none
visual-spec: N/A — reason: routing-layer behavior change, no UI surface (no .pen frame produced)
architect: senior-architect
created: 2026-04-26
base-sha: 803935e
worktree: .claude/worktrees/K-053-scroll-to-top/
---

## 0  Scope Questions

None at design time. Pre-Design Audit confirmed:

- `frontend/src/main.tsx` at base SHA `803935e` matches PRD assumption (`<GATracker />` mounted directly inside `<BrowserRouter>`, sibling of `<Suspense>`).
- No existing `window.scrollTo`, `scrollIntoView`, or `history.scrollRestoration` overrides anywhere in `frontend/src/`. Zero baseline interference.
- No existing hash-link consumers in `UnifiedNavBar.tsx` / `NavBar.tsx` / `HeroSection.tsx` (all `to="<path>"` plain — no `to="<path>#anchor"`). Hash-exception branch is **forward-compatible insurance**, not currently exercised by user code paths.
- No Sacred clause forbids scroll-to-top reset. Closest neighbors are DOM/byte invariants (K-030 `/app` isolation, K-034 P1 Footer byte-identity, K-024 `/diary` schema) — all orthogonal to scroll behavior.
- All AC questions surfaced in PRD `## Acceptance Criteria` already routed through Phase 1 QA Early Consultation (`AC-K053-06` carries the PM ruling slot for same-route behavior). No additional Architect-time PM ruling needed.

If Engineer's Design Challenge Sheet surfaces same-route or back/forward behavior questions where PM ruling is missing, Architect will pause this design doc and re-route to PM per `~/.claude/agents/senior-architect.md` §Scope Question Pause Rule.

---

## 1  Background

The K-Line Prediction site is a SPA built with `react-router-dom` `BrowserRouter`. SPA navigation does not reset the document scroll position by default — when a user is scrolled down on `/diary` and clicks `/about` in `UnifiedNavBar`, the new page renders **at whatever scroll offset the previous page had**. From the master UX plan (`~/.claude/plans/pm-ux-ux-wild-shore.md` §Context, item 1):

> "Page transitions don't scroll to top — user lands mid-page on the new route."

Operator filed this as UX issue #1 in the 2026-04-26 brainstorm. K-053 introduces a single side-effect component, `<ScrollToTop />`, mounted next to the existing `<GATracker />`, that resets `window.scrollY` to 0 on every pathname change with a hash-link exception so anchor jumps continue to work.

The pattern is **byte-mirror** of the existing `useGAPageview` hook (`frontend/src/hooks/useGAPageview.ts`), which already proves that a `useLocation()` + `useEffect([pathname])` side-effect mounted inside `<BrowserRouter>` is the canonical K-Line Prediction shape for "do something when the route changes". K-053 is intentionally a copy-paste of that shape so future readers do not need a second mental model.

---

## 2  Current State

`frontend/src/main.tsx` at base SHA `803935e` (verified via `git show 803935e:frontend/src/main.tsx` — quoted verbatim, NOT inferred):

```tsx
import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import RouteSuspense from './components/RouteSuspense'
import { initGA } from './utils/analytics'
import { useGAPageview } from './hooks/useGAPageview'
import './index.css'

// K-049 Phase 3: route-level code splitting. ...
const AppPage = lazy(() => import('./AppPage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const DiaryPage = lazy(() => import('./pages/DiaryPage'))
const BusinessLogicPage = lazy(() => import('./pages/BusinessLogicPage'))

initGA()

function GATracker() {
  useGAPageview()
  return null
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <GATracker />
        <Suspense fallback={<RouteSuspense />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/app" element={<AppPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/diary" element={<DiaryPage />} />
            <Route path="/business-logic" element={<BusinessLogicPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
```

Key shape facts (cited by file:line in `frontend/src/main.tsx`):

- L3: `BrowserRouter` import.
- L25–28: `GATracker()` functional wrapper that calls `useGAPageview()` and returns `null` — **the proven mirror pattern**.
- L33: `<BrowserRouter>` open tag.
- L34: `<GATracker />` mount point. K-053's `<ScrollToTop />` lands **immediately after this line**, sibling of `<GATracker />`, sibling of `<Suspense>`.
- L35: `<Suspense>` open tag — ScrollToTop must be OUTSIDE Suspense fallback boundary so the effect fires regardless of lazy chunk load state (hash-skip + scrollTo is a synchronous `window` API call, no React tree dependency).
- L43: `<BrowserRouter>` close tag.

`frontend/src/hooks/useGAPageview.ts` at HEAD (proven mirror):

```tsx
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageview } from '../utils/analytics'

const PAGE_TITLES: Record<string, string> = { /* ... */ }

export function useGAPageview(): void {
  const location = useLocation()
  useEffect(() => {
    const title = PAGE_TITLES[location.pathname] ?? document.title
    trackPageview(location.pathname, title)
  }, [location.pathname])
}
```

K-053's `ScrollToTop` is **structurally identical** except:

- Reads `pathname` AND `hash` from `useLocation()` (GA reads only `pathname`).
- Effect dep array is `[pathname, hash]` (GA: `[pathname]`).
- Effect calls `window.scrollTo(...)` (GA: `trackPageview(...)`).
- Hash-skip early-return guards the `scrollTo` call (GA has no early-return).

---

## 3  Proposed Change

### 3.1  New component — `frontend/src/components/ScrollToTop.tsx`

```tsx
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Resets window scroll to top on every pathname change, with hash-link
 * exception (when location.hash is non-empty, browser anchor behavior wins).
 *
 * Mirrors the useGAPageview pattern (frontend/src/hooks/useGAPageview.ts) —
 * mounted inside <BrowserRouter> as a side-effect-only component returning
 * null. Uses behavior: 'instant' to avoid any smooth-scroll animation that
 * would compete with the new page's first paint.
 *
 * K-053 design doc: docs/designs/K-053-scroll-to-top.md
 */
export function ScrollToTop(): null {
  const { pathname, hash } = useLocation()

  // Disable browser scroll restoration once on mount (PM ruling BQ-K053-04 / AC-K053-06 §4).
  // Idempotent under React StrictMode dev double-invoke: assigning the same string twice
  // is a no-op. Empty dep array — runs exactly once per component lifecycle in production.
  useEffect(() => {
    history.scrollRestoration = 'manual'
  }, [])

  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])
  return null
}
```

Notes:

- **Return type `: null`** explicitly typed (matches `GATracker` returning `null` JSX literal — but as a true exported component, explicit return type aids tsc strict mode and Reviewer audit).
- **Effect dep array `[pathname, hash]`** intentionally includes `hash` so that hash-only changes still re-run the effect — the early-return then skips the `scrollTo` call. If `hash` were excluded, navigating from `/diary#K-049` to `/diary#K-050` would call `scrollTo(0,0)` because `pathname` is unchanged but the effect would NOT re-fire (since neither dep changed). Including `hash` makes the early-return reachable and is the **only correct dep configuration** given the early-return semantics.
- **`behavior: 'instant'`** chosen explicitly per `AC-K053-03` "scroll behavior is instant (no smooth-scroll animation perceived)". Note: `'instant'` is the standardized Scroll Behavior keyword (CSSOM View Module 1); legacy MDN docs occasionally show `behavior: 'auto'` as the equivalent. `'instant'` is supported in Chrome 102+ / Firefox 102+ / Safari 15.4+ — verified in `caniuse` 2026-04-26 (covers all browsers Playwright config tests). If a future browser support concern arises, `behavior: 'auto'` is a 1-character drop-in fallback (Reviewer note).
- **`left: 0`** included for completeness (sites with horizontal scroll); current K-Line site has `body.scrollWidth <= viewport.width` enforced (K-024 AC), so `left: 0` is a no-op today but cheap insurance.
- **No `setTimeout` / `requestAnimationFrame`** — `useEffect` runs after React commit; commit happens after the new route's element tree renders; by the time the effect fires, the new page's DOM has been painted-or-staged. Wrapping in `setTimeout(fn, 0)` would create a single-frame visual flicker (user sees old scroll position first, then jumps); current synchronous approach is correct.

### 3.2  Mount point — `frontend/src/main.tsx`

Edit at line 34 (the `<GATracker />` line). Two-line change:

```tsx
// Add to imports (after line 8 useGAPageview import):
import { ScrollToTop } from './components/ScrollToTop'

// Inside <BrowserRouter>, immediately after <GATracker /> (line 35 post-edit):
<BrowserRouter>
  <GATracker />
  <ScrollToTop />          {/* NEW — K-053 */}
  <Suspense fallback={<RouteSuspense />}>
    {/* ... */}
  </Suspense>
</BrowserRouter>
```

**Sibling, not parent/child.** `<ScrollToTop />` is a sibling of `<GATracker />` and of `<Suspense>`. It is OUTSIDE the `<Routes>` boundary (so the same instance handles every route) and OUTSIDE `<Suspense>` (so the effect fires regardless of route-chunk load state). This matches `AC-K053-02` And-clauses verbatim.

### 3.3  E2E spec — `frontend/e2e/scroll-to-top.spec.ts`

Structure (full contract; Engineer adapts per Playwright fixture conventions documented in `frontend/e2e/_fixtures/mock-apis.ts`):

```tsx
import { test, expect } from '@playwright/test'
import { mockApis } from './_fixtures/mock-apis.ts'

test.describe('K-053 — Scroll-to-top on route change', () => {

  test.beforeEach(async ({ page }) => {
    await mockApis(page) // catch-all + history-info mocks
    // /diary mock: load real frontend/public/diary.json (already realistic + has enough
    // entries to push body height past 500px when timeline is rendered).
  })

  // T-K053-01 — pathname change resets scroll
  test('AC-K053-03 — scroll resets to 0 on /diary → /about NavBar click', async ({ page }) => {
    await page.goto('/diary')
    await page.waitForSelector('[data-testid="diary-entry"]') // first entry guarantees body extends past 500px scroll target (verified 2026-04-26 grep on frontend/src/components/diary/DiaryEntryV2.tsx:26)

    // Scroll page to >= 500px (per AC-K053-05)
    await page.evaluate(() => window.scrollTo({ top: 600, left: 0, behavior: 'instant' }))
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(500)

    // Click NavBar → /about
    await page.getByRole('link', { name: 'About', exact: true }).click()
    await page.waitForURL('**/about')

    // Assert scroll reset
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  })

  // T-K053-02 — hash navigation does NOT reset scroll
  // NOTE: site does not currently expose any hash-anchor link in production code (verified
  // grep on UnifiedNavBar / NavBar / pages — zero `#anchor` href). To exercise the
  // hash-exception code path, this spec uses page.evaluate to programmatically navigate
  // via window.location.hash (synthetic hash injection). Engineer may alternatively add
  // a transient anchor element in /diary fixture; either approach satisfies AC-K053-04.
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

    // Assert scroll did NOT reset to 0 (browser anchor put us near 800)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  })

  // T-K053-03 — same-route click behavior (per AC-K053-06 §1 — option a accepted)
  // BQ-K053-01 ruling: same-route NavBar re-click preserves scroll. Engineer asserts
  // scrollY unchanged after clicking the link to the page already on.
  test('AC-K053-06 §1 — same-route NavBar re-click preserves scroll', async ({ page }) => {
    // Engineer writes per BQ-K053-01 ruling: navigate to /about, scroll, click About again, assert scrollY unchanged.
  })

  // T-K053-04 — query-only nav test (DEFERRED, NOT in spec)
  // Engineer Challenge Sheet M1 verdict (Round 2): dep array [pathname, hash] is the
  // contract for query-only-nav non-reset (truth-table rows #6/#7). Static review of
  // the dep array (any reviewer reading frontend/src/components/ScrollToTop.tsx) is
  // sufficient verification — adding a Playwright test via page.evaluate(pushState)
  // would not actually exercise React Router's useLocation re-render path (pushState
  // bypasses history library), creating a wrong-axis signal that gives false confidence.
  // If Router behavior changes in a future react-router-dom upgrade, the dep array
  // unchanged + truth table rows #6/#7 unchanged = same contract; CodeReview catches
  // dep array drift more reliably than a flaky pushState-based E2E test.
})
```

Spec contract notes:

- **Real fixture, not synthetic.** `/diary` mock is the existing `frontend/public/diary.json` — has enough timeline entries to make the body taller than 500px on default viewport. Per `feedback_playwright_mock_realism.md`, mock data must reflect real production payload shape; using the existing diary.json is the safest realism choice.
- **`expect.poll` for `window.scrollY`** — scroll is an asynchronous browser concern even after `await click()` completes; `expect.poll` retries the assertion until React effect + browser scroll settle. Avoids hardcoded `waitForTimeout` (forbidden per `feedback_engineer_e2e_spec_logic_selfcheck.md`).
- **`waitForURL` between click and scroll assertion** — guarantees React has processed the location change before we assert. Without this, `expect.poll` could race and pass on the OLD page's scroll position.
- **No `getByText` case-insensitive trap** — `getByRole('link', { name: 'About', exact: true })` per `feedback_playwright_getbytext_case.md`.
- **Spec is sibling-additive to existing suite** — does not edit any existing spec; only adds `scroll-to-top.spec.ts`. Regression analysis (§7) confirms no existing spec asserts "scroll position preserved across nav".

---

## 4  API Contracts

**None.** K-053 introduces:

- Zero backend changes (no new endpoint, no schema change, no field rename).
- Zero shared-component prop interface (the `<ScrollToTop />` component is **prop-less** — `() => null` signature, no exported types beyond the function name itself).
- Zero cross-layer data flow (no `snake_case` ↔ `camelCase` mapping required).
- Zero new utility / hook contracts (component is self-contained — imports `useEffect`, `useLocation` only).

The exported surface is exactly one symbol: `export function ScrollToTop(): null`. No props, no context, no ref-forwarding, no children, no slot.

---

## 5  File Changes

| Path | Change | LOC delta | Responsibility |
|------|--------|-----------|----------------|
| `frontend/src/components/ScrollToTop.tsx` | NEW | +18 (incl. 8-line JSDoc) | Side-effect component: reset `window.scrollY` to 0 on pathname change, skip when `hash` non-empty |
| `frontend/src/main.tsx` | EDIT | +2 (1 import line + 1 JSX line) | Import `ScrollToTop` (after line 8); mount `<ScrollToTop />` immediately after `<GATracker />` (after line 34) |
| `frontend/e2e/scroll-to-top.spec.ts` | NEW | +60 ±10 | Playwright spec: T-K053-01 pathname-change reset, T-K053-02 hash-exception preserve, T-K053-03 same-route preserved (per BQ-K053-01 option a). T-K053-04 deferred per Round 2 M1 verdict (dep array is the contract). |

**Total:** 1 new component file (18 LOC), 1 edited entrypoint (2 LOC), 1 new spec file (~60 LOC). Net +80 LOC across 3 files.

**Self-Diff Verification (file-changes table):**

- 3 rows in table.
- 3 files in PRD §Scope (`ScrollToTop.tsx`, `main.tsx`, `scroll-to-top.spec.ts`).
- 1:1 match — no missing file, no extra file. ✓

---

## 6  Edge Cases — Truth Table (mandatory)

Cartesian grid covering all routing-layer interaction modes. Each row is a concrete scenario with input → expected behavior → which code branch handles it. Hard-gate: every row has a defined behavior; no "Engineer decides" cells.

| # | Scenario | `pathname` change? | `hash` change? | `search` change? | Expected scrollY after | Branch reached | Notes |
|---|----------|-------------------|---------------|------------------|------------------------|----------------|-------|
| 1 | `/` → `/about` (NavBar PUSH) | Yes (`/` → `/about`) | No (`""` → `""`) | No | **0** | `if (hash) return` skipped; `scrollTo` fires | Primary use case; AC-K053-03; T-K053-01 covers |
| 2 | `/diary` mid-scroll → click `/about` | Yes | No | No | **0** | Same as #1 | Identical to #1 (the canonical bug from operator UX issue #1) |
| 3 | `/diary` → `/diary#K-049` (hash add on same path) | No | Yes (`""` → `"#K-049"`) | No | **anchor target Y** (e.g. ~800px) | Effect re-fires (hash in dep), early-return, browser anchor wins | AC-K053-04; T-K053-02 covers; **forward-compat** — currently no UI emits this nav |
| 4 | `/diary#K-049` → `/diary#K-050` (hash change on same path) | No | Yes | No | **new anchor target Y** | Effect re-fires (hash in dep), early-return, browser anchor wins | Same branch as #3 |
| 5 | `/diary#K-049` → `/diary` (hash removal, same path) | No | Yes (`"#K-049"` → `""`) | No | **previous Y preserved** | Effect re-fires; `if (hash)` is FALSE; `scrollTo(0,0)` fires → **scrollY = 0** | ⚠ Behavior note: removing hash IS treated as a route change — scroll resets. Acceptable: user explicitly cleared the anchor; resetting to top is reasonable. **No PM ruling needed** — fits "navigation cleared anchor → reset" intuition. If operator disagrees post-launch, file follow-up TD. |
| 6 | `/about` → `/about?tab=foo` (query change, same path, no hash) | No | No | Yes | **previous Y preserved** | Effect does NOT re-fire (`search` not in dep array) | AC-K053-04 spirit — modal/drawer/tab-state must NOT trigger reset; current dep array `[pathname, hash]` correctly excludes `search` |
| 7 | `/about?tab=foo` → `/about?tab=bar` (query-only change) | No | No | Yes | **previous Y preserved** | Same as #6 — effect does not fire | Validates "modal/drawer that updates query" case from PRD Phase 1 QA scope |
| 8 | `/about` → `/about` (re-click NavBar link, identical pathname) | No | No | No | **previous Y preserved** | Effect does NOT fire (no dep changed) | **AC-K053-06 PM ruling required.** Default behavior = no reset. PRD records the verdict; spec asserts the verdict. Per PRD §QA Challenge Rulings, options are: (a) accept no-reset, (b) force reset via `key`/`useNavigationType`. Architect default-recommendation: **option (a)** — zero implementation cost, matches "user clicked link to where they already are = noop" intuition. |
| 9 | Browser back from `/about` to `/diary` (POP action) | Yes | No | Maybe | **0 (current design)** | `if (hash)` FALSE; `scrollTo(0,0)` fires | **Trade-off:** browser default would attempt to restore `/diary`'s prior scroll position (history scroll restoration). Current design **always resets to 0 regardless of POP vs PUSH**. Acceptable per AC-K053-03 ("scroll behavior is instant"); the operator's complaint was about losing position on PUSH, and applying the same rule to POP keeps the model simple ("every nav goes to top"). PM Phase 1 QA scope explicitly listed this as a ruling slot — verdict belongs in PRD §QA Challenge Rulings. **If Phase 1 mandates POP-restoration, design changes to use `useNavigationType()` and skip scroll on POP** — single-line addition, low rework cost. |
| 10 | Browser forward from `/diary` to `/about` (POP action, forward direction) | Yes | No | Maybe | **0 (current design)** | Same as #9 | Same trade-off and same PM ruling applies |
| 11 | Deep-link refresh on `/diary` mid-scroll (browser opens at saved scroll) | N/A (initial mount) | No | No | **0 (always)** | First effect run on mount; pathname is `/diary`, hash empty, `scrollTo(0,0)` fires | **Behavior note:** forces top on initial mount even if browser would have restored scroll. Browser default `history.scrollRestoration = 'auto'` is overridden by our effect on mount. **Trade-off:** reload-mid-scroll means "user navigated away and came back via URL" → resetting to top is acceptable (user is starting fresh). If Phase 1 QA flags as wrong, Architect can suppress first-mount run via `useRef` initial-mount guard — single-line addition. Default is current behavior. |
| 12 | Same-tab `/app` open from NavBar (K-030 entry — `<a target="_blank">`) | N/A (new tab) | N/A | N/A | N/A | New tab is a fresh document; ScrollToTop hasn't mounted yet there; once mounted, behavior is row #11 | K-030 isolation preserved — `/app` in a new tab still gets a `<ScrollToTop />` mount inside its own `<BrowserRouter>`, but the new tab's initial mount runs row #11 (scroll already 0 since it's a fresh document — no-op). |
| 13 | `Navigate to="/" replace` (catch-all `*` route — `<Navigate to="/" replace />` line 41) | Yes (any → `/`) | No | No | **0** | Replace nav fires `pathname` change → effect runs → reset | Catch-all redirect to `/` resets scroll, matching #1 semantics. ✓ |
| 14 | Programmatic `navigate('/about', { replace: true })` (e.g. login redirect) | Yes | No | No | **0** | Same as #1 — `pathname` changed, effect fires | PRD scope explicitly noted PUSH vs replace should both reset (pathname-driven). ✓ |
| 15 | React StrictMode dev-mode double-invoke of `useEffect` | Synthetic (dev only) | Synthetic | Synthetic | **0** (idempotent) | Effect runs twice; both calls scroll to (0,0); second call is a no-op | StrictMode is dev-only; `scrollTo(0,0)` is idempotent (scrolling to where you already are = no-op). No user-visible regression; no production impact. ✓ |
| 16 | First mount with hash present (`/diary#K-049` direct deep-link from external) | N/A (initial) | hash="K-049" on mount | No | **anchor target Y** | First effect run sees `hash` truthy → early-return → browser anchor scrolls to target | Forward-compat: external link with `#anchor` works without ScrollToTop interfering. ✓ |

**Self-Diff Verification (truth table):**

- 16 rows in table; covers all combinations of (pathname Δ × hash Δ × search Δ × initial-mount × POP/PUSH/REPLACE × StrictMode) without double-counting.
- 7 PRD-Phase-1-QA-listed scenarios (hash anchor #3/#4/#16, back/forward #9/#10, same-route #8, modal/query #6/#7, deep-route refresh #11, programmatic #13/#14, StrictMode #15) — all 7 covered with explicit branch + outcome.
- 2 rows (#8 same-route, #9/#10 back-forward) flagged as **PM-ruling slots** — match PRD `AC-K053-06` + Phase 1 QA scope. No other rows require PM ruling. ✓
- 1 row (#5 hash removal) flagged as Architect default-decision (acceptable, no PM block) — explicitly named so Engineer / Reviewer can challenge if disagreement. ✓

**No `❌` cells.** Every row has a defined behavior + branch + note. No "Engineer decides at implementation time" handoffs.

---

## 7  Regression Analysis

Goal: confirm no current page or test relies on scroll position being preserved across route navigation.

### 7.1  Source-side scan

```
grep -rn "scrollY\|scrollTo\|scrollIntoView\|window.scroll" frontend/src/
```

Result: **zero hits in `frontend/src/`** (verified 2026-04-26 base SHA `803935e`). No component, hook, or page reads or writes `window.scrollY` or calls `scrollTo`. K-053 is the first scroll-orchestration code in the codebase.

### 7.2  E2E-side scan

```
grep -rn "scrollY\|scrollTo\|scrollIntoView\|window.scroll" frontend/e2e/
```

Result (verified):

- `frontend/e2e/about-layout.spec.ts:44` — `top: r.top + window.scrollY` (geometric calculation: convert viewport-relative bounding-rect Y to document-relative Y for layout assertion). **Read-only `window.scrollY`** — does not depend on scroll being preserved across nav. Not affected.
- `frontend/e2e/about-layout.spec.ts:45` — `bottom: r.bottom + window.scrollY` (same as above). Not affected.

No spec writes scroll, no spec asserts "scrollY > 0 after navigation". K-053 cannot break either spec.

### 7.3  Sacred-clause scan

Cross-checked all currently-active Sacred clauses (none yet exists in `docs/sacred-registry.md` — that artefact ships in K-052; until then, Sacred clauses live inline in closed K-* tickets). Manual sweep of closed-and-shipped K-* tickets returned zero clauses that constrain scroll behavior. Closest neighbors:

| Clause | Owner | Relation to K-053 | Conflict? |
|--------|-------|-------------------|-----------|
| `AC-030-NO-FOOTER` (`/app` isolation, no NavBar/Footer) | K-030 | `/app` does not render `<UnifiedNavBar>` so no NavBar-driven nav inside `/app`. ScrollToTop still mounts inside `/app`'s `<BrowserRouter>` (single root in `main.tsx`). Initial-mount + zero internal nav = no-op on `/app`. | **No conflict.** |
| `AC-034-P1-ROUTE-DOM-PARITY` (Footer byte-identical across `/`, `/about`, `/diary`, `/business-logic`) | K-034 P1 | Footer DOM byte-identity is a render-time invariant; ScrollToTop affects scroll position, not DOM. | **No conflict.** |
| `AC-024-DIARY-LOADING-ERROR-PRESERVED` (`/diary` `body.scrollWidth <= viewport.width` no-overflow) | K-024 | `scrollWidth` (horizontal overflow) ≠ `scrollY` (vertical position). Orthogonal. | **No conflict.** |
| `AC-031-LAYOUT-CONTINUITY` (`/about` `#architecture.nextElementSibling === <footer>`) | K-031 | DOM tree adjacency invariant; scroll position has no DOM effect. | **No conflict.** |
| `AC-K053-04` (hash-link path preserves scroll — this ticket's own AC) | K-053 (self) | Truth-table row #3/#4/#16 covers. | Self-consistent. |

All four routes audited:

| Route | Current scroll-position dependency | K-053 impact | Verdict |
|-------|------------------------------------|-------------|---------|
| `/` (HomePage) | None — Hero + ProjectLogic + DevDiary preview render top-to-bottom; no `useEffect` reading scroll | Reset on entry from any other route | ✓ Improves UX, no break |
| `/app` (AppPage) | `h-screen overflow-hidden` root div per K-030 — page itself doesn't scroll | ScrollToTop's `scrollTo(0,0)` is no-op when document is non-scrollable | ✓ No break |
| `/about` (AboutPage) | None — 6 stacked sections; no scroll-restoration logic | Reset on entry | ✓ Improves UX, no break |
| `/diary` (DiaryPage) | None — `<DiaryTimeline />` renders entries top-down; pagination via `<LoadMoreButton />`; no scroll-restoration | Reset on entry from any other route | ✓ Improves UX (matches operator's exact bug report), no break |
| `/business-logic` (BusinessLogicPage) | None — auth-gated content renders inline | Reset on entry | ✓ Improves UX, no break |

**Conclusion:** zero existing user-facing pages, zero existing E2E specs, zero existing Sacred clauses depend on scroll position being preserved across navigation. K-053 ships as **purely additive UX improvement**.

---

## 8  Test Strategy

### 8.1  Playwright spec contract (per §3.3)

Three test cases in `frontend/e2e/scroll-to-top.spec.ts`:

| Test ID | AC link | Scope | Mock requirements |
|---------|---------|-------|-------------------|
| T-K053-01 | `AC-K053-03` | `/diary` mid-scroll → `/about` NavBar click → `scrollY === 0` | `mockApis(page)` (catch-all + history-info); real `frontend/public/diary.json` payload (≥ enough entries to push body height past 500px) |
| T-K053-02 | `AC-K053-04` | `/diary` → synthetic hash injection → `scrollY > 0` (browser anchor wins, ScrollToTop early-returns) | Same as T-K053-01; hash target injected via `page.evaluate` (no spec-side fixture mutation) |
| T-K053-03 | `AC-K053-06` §1 | Same-route NavBar re-click on `/about` preserves scroll (per BQ-K053-01 option a ruling). Engineer asserts `scrollY` unchanged after second click. | Same as T-K053-01 |

**Mock realism:** per `feedback_playwright_mock_realism.md`, the `/diary` data path uses the existing `frontend/public/diary.json` (production-real shape, sufficient entry count to scroll past 500px on default viewport). No fabricated minimal fixture.

**Assertion strategy:**

- **`expect.poll(() => page.evaluate(() => window.scrollY))`** for all `scrollY` checks — handles the asynchronous browser scroll settle without hardcoded `waitForTimeout`.
- **`page.waitForURL('**/about')`** between click and assertion — barrier ensures React processed the location change.
- **`getByRole('link', { name: 'About', exact: true })`** for NavBar click — `exact: true` per `feedback_playwright_getbytext_case.md`, `getByRole` over `getByText` for semantic precision.
- **No hardcoded sleep** — fully event-driven assertions per `feedback_engineer_e2e_spec_logic_selfcheck.md`.

### 8.2  Existing E2E suite — regression run

Engineer must run full Playwright suite after K-053 lands and confirm:

- All currently-passing specs still pass. Per §7.2 scan, only `about-layout.spec.ts` reads `window.scrollY` (geometric, read-only) — no breakage expected.
- New suite count: existing `261 pass + 1 pre-existing flaky + 1 skipped` (last counted at K-045 close per architecture.md changelog 2026-04-24) → expected post-K-053 `264 pass + 1 pre-existing flaky + 1 skipped` (the flaky `AC-020-BEACON-SPA` and the 1 pre-existing skipped test both carry forward; K-053 adds 3 active tests T-K053-01/02/03 and zero new skips per Round 2 M1 verdict).

### 8.3  TypeScript check

`npx tsc --noEmit` must exit 0. ScrollToTop has explicit return type `: null` and uses two named imports (`useEffect`, `useLocation`) — zero net new types, zero net new declarations.

### 8.4  Manual smoke (Phase 4 PM acceptance)

Per PRD Phase 4: dev server walk:

1. `npm run dev` → open `http://localhost:5173/diary` → scroll to bottom of timeline.
2. Click NavBar `About` → confirm landing at top of `/about`.
3. Click NavBar `Diary` → confirm landing at top of `/diary` (not at the previous bottom-scroll position).
4. Repeat for `/` and `/business-logic`.
5. Browser back button → verify scroll behavior matches PM ruling on truth-table row #9/#10 (current default = reset to 0).

---

## 9  Architect Same-Session Verdict Reservation

Per `~/.claude/agents/senior-architect.md` §Same-Session Verdict Obligation (codified 2026-04-26 in PR #25), Architect commits to:

- **Respond to Engineer's Design Challenge Sheet within ≤2 turns of the same session.** No "let me think and get back next session" deferrals — that re-creates the Engineer-blocked state the gate exists to prevent.
- **If a challenge requires external info** (Pencil verification, ruleset cross-check, fresh PM ruling): Architect runs the lookup in the same response, not a deferral.
- **Three verdict types** Architect can issue per challenge:
  1. **Resolve in design doc** — Architect Edits this design doc, points Engineer at affected sections, Engineer re-reads.
  2. **Defer to Engineer judgment** — explicit local-decision license, recorded on the challenge sheet.
  3. **Reject with reason** — Architect explains why current design holds (e.g. "the proposed simplification breaks Sacred clause X").

**K-053-specific anticipated challenges** (Architect pre-flags so Engineer can short-circuit common questions):

| Anticipated challenge | Architect default verdict | Reasoning |
|----------------------|--------------------------|-----------|
| "Why include `hash` in dep array if early-return skips when hash truthy?" | Resolved in §3.1 explanation | Without `hash` in deps, hash-only changes wouldn't re-fire effect → next non-hash nav would skip reset because effect already ran with stale hash. Including `hash` is the only correct config. |
| "Why `behavior: 'instant'` vs `'auto'`?" | Resolved in §3.1 explanation | `'instant'` is CSSOM-spec keyword for "no animation"; `'auto'` is browser default which CAN animate depending on user prefers-reduced-motion + browser. AC-K053-03 mandates "no smooth-scroll animation perceived" → `'instant'` is the explicit guarantee. |
| "Why mount inside `<BrowserRouter>` not at React root?" | Resolved in §3.2 explanation | `useLocation()` requires Router context; mounting outside throws at runtime. Mirrors `<GATracker />` pattern. |
| "Why outside `<Suspense>` boundary?" | Resolved in §3.2 explanation | `<ScrollToTop />` doesn't read or render lazy content — it only calls `window.scrollTo`. Outside Suspense ensures effect fires even if route chunk is mid-load. |
| "Why a separate component file vs inline hook in `main.tsx`?" | Resolved in §3.1 — defer to Engineer judgment | `main.tsx` already has `GATracker()` inline-defined; precedent allows either. Component-file approach matches PRD AC-K053-01 verbatim ("`frontend/src/components/ScrollToTop.tsx`") — Engineer should follow PRD AC unless PM rules otherwise. |
| "Why not use react-router-dom's `<ScrollRestoration />` (Data Router API)?" | Reject with reason | Site uses `<BrowserRouter>` + `<Routes>` (Declarative Router API). `<ScrollRestoration />` requires switching to `createBrowserRouter()` + `<RouterProvider>` (Data Router API) — that's a sitewide router-paradigm migration, far out of K-053 scope. Custom 18-LOC component is the correct tool. |

If Engineer's actual challenge sheet diverges from these, Architect addresses the new items in the same session per the Reservation rule.

---

## 10  Refactorability Checklist

Per `~/.claude/agents/senior-architect.md` §Refactorability Checklist:

- [x] **Single responsibility** — `ScrollToTop` does exactly one thing: reset scroll on pathname change with hash exception. No second concern.
- [x] **Interface minimization** — zero props. The component cannot be over-coupled because there are no inputs to misuse.
- [x] **Unidirectional dependency** — depends on `react` + `react-router-dom`; nothing else depends on `ScrollToTop`. Top-down flow only.
- [x] **Replacement cost** — if `react-router-dom` were swapped for `@tanstack/router` or `wouter`, change is isolated to `ScrollToTop.tsx` (1 file: swap `useLocation` import). All consumers see the same `<ScrollToTop />` JSX. ≤ 1 file affected (well under the "max 2" threshold).
- [x] **Clear test entry point** — input is `useLocation()` state (mockable via `MemoryRouter` in unit test or via `page.goto()` in E2E); output is `window.scrollY === 0` after pathname change. Black-box testable without reading internals.
- [x] **Change isolation** — UI changes don't touch ScrollToTop (no DOM rendered); API contract changes don't touch it (no backend dep); router config changes ARE the only thing that touches it (correctly — that's the dependency). One-axis coupling.

All 6 items pass. No accepted design debt.

---

## 11  All-Phase Coverage Gate

K-053 is a single-phase ticket (no Phase 1/Phase 2 split — it is a monolithic 3-file delivery). Coverage table degenerates to a single row:

| Phase | Backend API | Frontend Routes | Component Tree | Props Interface |
|-------|------------|-----------------|----------------|-----------------|
| (single) | N/A — no backend touch | All 5 routes audited (§7.3, §7.4) — all benefit, none break | `<ScrollToTop />` mounted inside `<BrowserRouter>` as sibling of `<GATracker />` and `<Suspense>`; not part of any route's own component tree | Zero props (§4); component is `() => null` |

All four columns covered. ✓

---

## 12  AC ↔ Test Case Cross-Check

| AC ID | Test ID(s) | Status |
|-------|-----------|--------|
| `AC-K053-01` (component exists with hash-link exception) | tsc check (file imports + return type + dep array verified at compile time); Code Reviewer manually inspects component signature | Static — covered by tsc + review |
| `AC-K053-02` (mounted inside BrowserRouter, after GATracker, outside Routes) | tsc check (import + JSX placement); Code Reviewer manually inspects `main.tsx` diff | Static — covered by tsc + review |
| `AC-K053-03` (pathname change resets to top, instant) | T-K053-01 | ✓ Spec |
| `AC-K053-04` (hash navigation does NOT reset) | T-K053-02 | ✓ Spec |
| `AC-K053-05` (Playwright spec covers regression) | The spec itself + full-suite regression run (§8.2) | ✓ Spec + regression |
| `AC-K053-06` §1 (same-route NavBar re-click preserves scroll, per BQ-K053-01) | T-K053-03 (active) | ✓ Spec |
| `AC-K053-06` §2 (browser back/forward resets to 0, per BQ-K053-02) | manual smoke (§8.4 step 5) | ✓ Manual smoke |
| `AC-K053-06` §3 (refresh resets to 0, per BQ-K053-03) | manual smoke (§8.4 step 1 — implicit) | ✓ Manual smoke |
| `AC-K053-06` §4 (`history.scrollRestoration = 'manual'` set on mount, per BQ-K053-04) | static review of `frontend/src/components/ScrollToTop.tsx` first useEffect (per Round 2 verdict C1) | Static — covered by review |

**Test count:** 9 AC rows (AC-K053-01 through AC-K053-05 + AC-K053-06 §1–§4) → 9 test surfaces (3 Playwright active + 2 manual smoke + 4 static via tsc/review). Zero skipped tests post-Round-2 (T-K053-03 un-skipped per BQ-K053-01 ruling; T-K053-04 deferred per Round 2 M1 verdict, NOT in spec — dep array is the contract).

Sum check: PRD lists 6 ACs (`AC-K053-01` through `AC-K053-06`); AC-K053-06 expanded by PM into 4 G/W/T blocks per BQ-K053-01..04 rulings → 9 testable rows total. Truth-table covers 16 rows mapped to ACs. All AC ruling slots resolved. No drift between PRD AC count and design-doc test count.

---

## 13  Refactor AC Grep Raw-Count Sanity

K-053 is **not a refactor ticket** — it adds a new component, no symbols are being retired or renamed. Per `~/.claude/agents/senior-architect.md` §Refactor AC Grep Raw-Count Sanity, gate degenerates to N/A.

---

## 14  Pencil Frame Completeness

K-053 has `visual-delta: none` per ticket frontmatter; no `.pen` frame produced; no Pencil artefact preflight required. Per `~/.claude/agents/senior-architect.md` §Pencil Artifact Preflight, gate degenerates to N/A with explicit reason: "routing-layer behavior change, no UI surface — `<ScrollToTop />` returns null, renders no DOM."

---

## 15  Visual Spec JSON Consumption Gate

Per `~/.claude/agents/senior-architect.md` §Visual Spec JSON Consumption Gate, K-053 has `visual-spec: N/A — reason: routing-layer behavior change, no UI surface (no .pen frame produced)` in frontmatter. No JSON consumption required.

---

## 16  Sacred AC + DOM-Restructure Cross-Check

K-053 does **not delete, rename, or restructure any JSX node**. The only JSX edit is **additive**: insert `<ScrollToTop />` as a new sibling inside `<BrowserRouter>`. Per `~/.claude/agents/senior-architect.md` §Sacred AC + DOM-Restructure Cross-Check, gate triggers only on delete/rename/restructure → degenerates to N/A.

Adversarial sanity sweep (run anyway because the consequences are cheap and discovery is valuable):

| Pattern | Hits in K-053 scope | Resolution |
|---------|--------------------|-----------| 
| `data-testid="cta-` | 0 (no testid added or removed) | Preserved |
| `trackCtaClick(` | 0 (no GA wiring touched) | Preserved |
| `target="_blank"` | 0 (no anchor touched) | Preserved |
| `href="mailto:` | 0 (no anchor touched) | Preserved |
| `nextElementSibling.id` | 0 (no DOM-id adjacency relied on) | Preserved (K-031 invariant on `/about`) |
| `previousElementSibling.id` | 0 | Preserved |
| `querySelector('#` | 0 | Preserved |

Zero hits across all 7 patterns. K-053 is structurally inert with respect to existing Sacred clauses.

---

## 17  Global Style Route Impact Table

K-053 touches **zero CSS**, zero `index.css`, zero `tailwind.config.js`, zero CSS variables. Per `~/.claude/agents/senior-architect.md` §Global Style Route Impact Table, gate triggers only on global CSS / tailwind config / sitewide token edit → degenerates to N/A.

---

## 18  Cross-Page Duplicate Audit

Pre-implementation grep:

```
grep -rn "ScrollToTop\|scrollToTop" frontend/src/
```

Result: **0 hits** (verified 2026-04-26 base SHA `803935e`). No existing component, hook, or utility named or referencing `ScrollToTop`. Zero duplication risk.

Adjacent pattern (existing side-effect-component-on-location-change):

```
grep -rn "useLocation" frontend/src/
```

Returns: `useGAPageview.ts` only. K-053's `ScrollToTop.tsx` is the **second** consumer of `useLocation()` and intentionally mirrors the first — the canonical pattern stays canonical.

**Audit evidence:** grepped patterns, confirmed no duplicates. ✓

---

## 19  Target-Route Consumer Scan

K-053 does **not change navigation behavior** of any target route (no new-tab vs same-tab toggle, no SPA vs full-reload toggle, no redirect, no auth gate). Per `~/.claude/agents/senior-architect.md` §Target-Route Consumer Scan, gate triggers only on navigation behavior change → degenerates to N/A.

What K-053 does change is the **scroll-position side effect** of every nav, which is sitewide; §7 Regression Analysis covers all 5 route consumers and confirms no break.

---

## 20  Architecture Doc Sync

Architecture doc location: `agent-context/architecture.md` (754 lines at base SHA `803935e`).

K-053 is a **minor structural change** (adds 1 component file under `components/`, 1 spec under `e2e/`). Required edits:

1. **Directory Structure section** (line 36–199) — add `ScrollToTop.tsx` under `components/`. The current `components/` block lists top-level component files; ScrollToTop is sitewide chrome (mirrors GATracker positioning), so it lands at the top-level alongside `ErrorBoundary.tsx`, `RouteSuspense.tsx`, etc. — not under `about/`, `home/`, `diary/`, `shared/`, or `primitives/`.
2. **Frontend Routing section** (line 459–472) — append a one-line note after the routing table: "**Sitewide scroll behavior:** `<ScrollToTop />` (`components/ScrollToTop.tsx`, K-053 2026-04-26) mounted inside `<BrowserRouter>` resets `window.scrollY` to 0 on every pathname change, with hash-link early-return to preserve browser anchor behavior. Mirrors `useGAPageview` pattern (sibling component, `useEffect` on `[pathname, hash]`)."
3. **Changelog section** (line 681) — prepend new entry:

   ```markdown
   - **2026-04-26**（Architect, K-053 設計）— `ScrollToTop` sitewide scroll-reset on route change 設計完成。新組件 `frontend/src/components/ScrollToTop.tsx`（18 LOC，`useLocation` + `useEffect([pathname, hash])` + `if (hash) return` early-return + `window.scrollTo({top:0, left:0, behavior:'instant'})`，returns `null`）；mount 點 `frontend/src/main.tsx:34` 之後（`<GATracker />` 緊鄰 sibling，OUTSIDE `<Routes>` + OUTSIDE `<Suspense>`）；新 Playwright `frontend/e2e/scroll-to-top.spec.ts`（3 cases：T-K053-01 `/diary`→`/about` reset / T-K053-02 hash 早返保留 scroll / T-K053-03 same-route 待 Phase 1 PM ruling skip）。Pre-Design Audit：`grep -rn "scrollY\|scrollTo" frontend/src/` 0 hits（baseline 無 scroll-orchestration code）；`grep -rn "useLocation" frontend/src/` 1 hit（`useGAPageview.ts` 唯一既有 mirror pattern）；無 Sacred clause 涉及 scroll behavior（K-030/K-034-P1/K-024/K-031 全 orthogonal）；5 路由（/、/app、/about、/diary、/business-logic）regression sweep 全 pass（`/app` `h-screen overflow-hidden` 使 scrollTo no-op，K-030 isolation 保留）。Edge case truth table 16 rows（pathname × hash × search × initial-mount × POP/PUSH × StrictMode）— rows #8（same-route）+ #9/#10（back/forward）為 `AC-K053-06` PM ruling slot；row #5（hash 移除）+ row #11（refresh-mid-scroll）為 Architect default-decision，可由 Phase 1 QA 翻案。0 backend / 0 schema / 0 API / 0 props interface / 0 CSS / 0 Pencil frame 變動。Cross-page duplicate audit 0 hit；Sacred 7-pattern grep sweep 0 hit；regression analysis confirms `frontend/e2e/about-layout.spec.ts` `window.scrollY` 唯二使用為 read-only geometric calc，不受影響。Same-Session Verdict Reservation 已聲明，Engineer Design Challenge Sheet ≤2 turns 回應。設計文件：[K-053-scroll-to-top.md](../docs/designs/K-053-scroll-to-top.md)。未改 code（Architect 僅設計）。
   ```

4. **Frontmatter `updated:` field** — bump to `2026-04-26` in same Edit.

**Self-Diff Verification (architecture.md edits):**

- 4 edit sites (Directory Structure / Frontend Routing / Changelog / frontmatter) listed.
- 4 source-of-truth touch points enumerated above.
- 1:1 match. ✓

**Drift scan:** `grep -n "ScrollToTop\|K-053" agent-context/architecture.md` returns 0 hits at base SHA `803935e` — no pre-existing stale references to disambiguate. Clean baseline. ✓

**Note:** Architect deliberately defers the actual Edit on `agent-context/architecture.md` to **Engineer's Step 1 commit** (same commit that lands `ScrollToTop.tsx` + `main.tsx` + spec) to avoid state-vs-disk drift per `feedback_architect_must_update_arch_doc.md` preventive notation pattern (precedent: K-040 changelog entry deferred fontFamily table edit to Engineer commit). Engineer copies the changelog entry text verbatim from this section into `agent-context/architecture.md` as part of the K-053 implementation commit.

---

## 21  Implementation Order

For Engineer (single-pass, all in one worktree commit per `feedback_engineer_design_doc_checklist_gate.md`):

1. **Read this design doc top-to-bottom.** No Edit yet (Pre-Implementation Design Challenge Gate per `~/.claude/agents/engineer.md`).
2. **Produce Design Challenge Sheet.** Likely short for K-053 (5 anticipated questions pre-resolved in §9). Surface any new questions.
3. **Architect verdicts every challenge.** ≤2 turns per Same-Session Verdict Reservation (§9).
4. **Write `frontend/src/components/ScrollToTop.tsx`** — 18 LOC per §3.1 spec.
5. **Edit `frontend/src/main.tsx`** — 2 lines (import after L8, JSX after L34) per §3.2 spec.
6. **Run `npx tsc --noEmit`.** Must exit 0.
7. **Write `frontend/e2e/scroll-to-top.spec.ts`** — ~60 LOC per §3.3 spec. T-K053-03 lands as `.skip()` pending Phase 1 PM ruling.
8. **Run `npx playwright test scroll-to-top.spec.ts`** — 2 tests pass + 1 skip.
9. **Run full Playwright suite** — confirm `261 → 263 pass + 1 pre-existing flaky + 2 skipped` (per §8.2 expected count).
10. **Edit `agent-context/architecture.md`** — 4 sites per §20 spec (Directory Structure entry + Frontend Routing one-liner + Changelog prepend + frontmatter `updated:`).
11. **Sync `frontend/public/diary.json`** — confirm no edit required (this ticket adds zero diary entries — diary entry for K-053 close lands at PM Phase 4 close per K-Line `CLAUDE.md` §Diary Sync Rule).
12. **Commit per `~/.claude/CLAUDE.md` §Commit Test Gate** — full gate: `tsc + Vitest + Playwright E2E` (frontend file class). Single commit message per `feedback_engineer_design_doc_checklist_gate.md`.

Parallelizable: none — single-file dependency chain. Cannot ship `main.tsx` edit before `ScrollToTop.tsx` exists (tsc would fail on missing import).

---

## 22  Risks & Notes

- **Browser support for `behavior: 'instant'`** — verified Chrome 102+ / Firefox 102+ / Safari 15.4+. Playwright config tests in Chromium + WebKit + Firefox; all in support range. If a future regression report cites `behavior: 'auto'` on an unusual browser, the fallback is a 1-character drop-in replacement. **Mitigation:** Engineer adds JSDoc comment noting the spec keyword precedence (already in §3.1 component header).
- **Browser scroll restoration interaction** — `history.scrollRestoration` defaults to `'auto'` (browser tries to restore). Our effect overrides on every pathname change. **Trade-off:** see truth-table row #9/#10/#11. PM Phase 1 QA ruling slot.
- **React 18 StrictMode dev double-invoke** — see truth-table row #15. Production build has no double-invoke; dev-mode behavior is benign (idempotent scrollTo).
- **`<ScrollToTop />` mount on `/app`** — `/app` per K-030 has `h-screen overflow-hidden` root div making the document non-scrollable. ScrollToTop's `scrollTo(0,0)` is a no-op on `/app`. K-030 isolation preserved.
- **Hash-link forward-compat without current consumer** — site has zero `#anchor` href today. Hash-exception is insurance for future "deep-link to anchor" patterns (e.g. K-049 ticket-anchor links in /diary). If never used, hash-exception code is dead but cheap (3 lines).
- **No security considerations** — no auth touch, no env var, no XSS surface (no DOM rendered, no innerHTML, no user input).

---

## Retrospective

**Where most time was spent:** Edge cases truth table (§6) — enumerating 16 scenarios required mapping 5 axes (pathname-change × hash-change × search-change × initial-mount × POP/PUSH/REPLACE) and deciding for each whether the AC contract or the dep array implicitly handled it. Several rows (#5 hash removal, #11 first-mount-with-restored-scroll) needed Architect default-rulings rather than PM rulings — clearly named as such in the row notes so Engineer / Reviewer can challenge.

**Which decisions needed revision:** None mid-doc; pre-Design Audit dry-run on `git show 803935e:frontend/src/main.tsx` plus mirror-pattern read of `useGAPageview.ts` made the §3 component spec land first-pass. The biggest surface-area decision (effect dep array `[pathname, hash]` vs `[pathname]` only) was settled by the row #3/#4/#5 truth-table walk — confirms the dep array design.

**Next time improvement:** For Architect-default-decisions inside truth tables (rows that don't need PM ruling but represent a non-obvious choice), add a "Default rationale + counterfactual cost" column rather than burying the reasoning in row notes. Makes Engineer / Reviewer faster at challenging or ratifying without re-reading multiple paragraphs.

---

## Addendum 2026-04-26 — QA-flagged corrections

Same-Session Verdict round triggered by QA Early Consultation (see `docs/retrospectives/qa.md` 2026-04-26 entry, lines 17–95). Architect responding within ≤2 turns per `~/.claude/agents/senior-architect.md` §Same-Session Verdict Obligation (codified 2026-04-26 in PR #25).

### M1 — mock-apis import path missing `.ts` extension (FIXED)

**Original §3.3 line 187:**
```ts
import { mockApis } from './_fixtures/mock-apis'
```

**Corrected to:**
```ts
import { mockApis } from './_fixtures/mock-apis.ts'
```

**Verification (2026-04-26):**
- `find frontend/e2e -name "mock-apis*"` → `frontend/e2e/_fixtures/mock-apis.ts` (only location).
- `grep -rn "mock-apis" frontend/e2e/` → 13 hits across existing specs (`navbar.spec.ts`, `sitewide-fonts.spec.ts`, `sitewide-footer.spec.ts`, `sitewide-body-paper.spec.ts`, `app-bg-isolation.spec.ts`, `K-046-example-upload.spec.ts`, `shared-components.spec.ts`); all 8 import statements use the form `from './_fixtures/mock-apis.ts'` with explicit `.ts` extension.
- Engineer copy-paste of original would have hit Vite/Vitest/Playwright module resolution failure under the project's `"moduleResolution": "bundler"` tsconfig, which requires explicit extensions for relative imports.

**Note on task-spec input:** the QA-relayed correction text suggested `from './mock-apis'` (file at `frontend/e2e/mock-apis.ts`), but verification shows the file actually lives at `frontend/e2e/_fixtures/mock-apis.ts`. Architect's original path segment was correct; only the extension was missing. Fix lands as `'./_fixtures/mock-apis.ts'`, matching the 8-spec precedent.

### M2 — settle anchor testid `diary-timeline` does not exist (FIXED)

**Original §3.3 lines 200, 222:**
```ts
await page.waitForSelector('[data-testid="diary-timeline"]')
```

**Corrected to:**
```ts
await page.waitForSelector('[data-testid="diary-entry"]')
```

**Verification (2026-04-26):**
- `grep -rn "data-testid=\"diary-" frontend/src/` returned 11 hits across `DevDiarySection.tsx`, `DiaryEntryV2.tsx`, `DiaryError.tsx`, `DiaryLoading.tsx`, `LoadMoreButton.tsx`, `DiaryMarker.tsx`, `DiaryRail.tsx`, `DiaryEmptyState.tsx`, `DiaryPage.tsx`. The set of diary-prefixed testids on `/diary` is: `diary-main`, `diary-entry`, `diary-rail`, `diary-marker`, `diary-load-more`, `diary-loading`, `diary-error`, `diary-empty`. **No `diary-timeline` testid exists.**
- `diary-entry` (defined at `frontend/src/components/diary/DiaryEntryV2.tsx:26`) renders one node per timeline entry. Waiting for the first `diary-entry` to appear guarantees the timeline has rendered at least one entry — and the existing `frontend/public/diary.json` payload has enough entries to push body height past the 500px scroll target asserted by T-K053-01.
- Engineer copy-paste of original would have caused `page.waitForSelector` timeout (default 30s), bricking T-K053-01 + T-K053-02 in CI.
- Annotation added inline at the T-K053-01 wait line citing the `DiaryEntryV2.tsx:26` source so future readers can re-verify without re-grep.

### Self-Diff Verification (corrections)

Re-grep against design doc **§3.3 active spec contract section only** (lines 181–256, pre-addendum). Addendum prose (lines 633+) intentionally repeats the bad strings verbatim as a before-after record and does not affect Engineer copy-paste targets.

- `sed -n '181,256p' docs/designs/K-053-scroll-to-top.md | grep -c "diary-timeline"` → **0 hits** ✓
- `sed -n '181,256p' docs/designs/K-053-scroll-to-top.md | grep -cE "mock-apis['\"]"` (bare path, no `.ts`) → **0 hits** ✓
- `sed -n '181,256p' docs/designs/K-053-scroll-to-top.md | grep -c "mock-apis\.ts"` → **2 hits** (line 183 spec contract notes mention + line 187 import — both correct) ✓
- `sed -n '181,256p' docs/designs/K-053-scroll-to-top.md | grep -c "data-testid=\"diary-entry\""` → **2 hits** (T-K053-01 + T-K053-02 wait selectors) ✓

All four self-diff gates pass.

### QA agreement on default-decisions (rows #5/#11/#15) — no Edit needed

QA Early Consultation explicitly agreed with Architect's default-decisions on:
- **Row #5** (`/diary#K-049` → `/diary` hash removal → scroll resets to 0) — accepted as "navigation cleared anchor → reset" intuition.
- **Row #11** (refresh mid-scroll on `/diary` → effect runs on mount → resets to 0) — accepted; first-mount-reset is consistent with the always-top-on-nav model.
- **Row #15** (React StrictMode dev double-invoke → idempotent) — accepted; `scrollTo(0,0)` second call is no-op.

No design doc revision required for these three rows. Default rationales stand verbatim.

### Pre-emptive catch saved Engineer round-trip

Both M1 and M2 errors caught **BEFORE Engineer dispatch**. Engineer's Pre-Implementation Design Challenge Gate (per `~/.claude/agents/engineer.md`) plus a single `npx tsc --noEmit` run would have caught M1 in seconds; T-K053-01's first run would have caught M2 via 30s timeout. QA Early Consultation absorbing this in the same Architect session saves ≥1 Engineer→Architect→Engineer round-trip + the cognitive disruption of a failing first-pass build.

### Out of scope (deferred to Engineer Challenge Sheet round)

QA's "additional findings" routed elsewhere:
- **T-K053-04 query-only test (proposed addition)** — Engineer-judgment item. If Engineer adds a fourth test asserting query-only nav (`/about?tab=foo` → `/about?tab=bar`) preserves scroll, this validates truth-table row #6/#7 directly. Architect endorses but does not mandate; Engineer Challenge Sheet may surface or skip.
- **`scrollY >= 700` assertion strengthening on T-K053-02 hash-anchor test** — Engineer-judgment refinement (sharper bound than current `> 0`). Architect endorses since the synthetic anchor is injected at `top: 800px` so a `>= 700` floor is the more discriminating assertion (catches "scroll happened but anchor target missed" vs "no scroll at all"). Engineer may apply during implementation.
- **T-K053-03 dual-branch comments** — Engineer-judgment item. When Phase 1 PM ruling lands (`AC-K053-06`), the un-skipped test will assert one branch; comments describing the rejected branch help future maintainers understand the verdict context.

### §22 hash-target understatement annotation (no substantive Edit)

§22 currently states: "site has zero `#anchor` href today. Hash-exception is insurance for future ... patterns." Truth at base SHA `803935e`: zero `scrollIntoView` consumers exist anywhere in `frontend/src/` and zero `<a href="#...">` patterns exist in JSX. The "zero internal hash anchors driving `scrollIntoView`" framing remains correct — annotation here for transparency. No §22 Edit because the substantive claim still stands.

### References

- QA Early Consultation entry: `docs/retrospectives/qa.md` 2026-04-26 (top of file).
- Architect Same-Session Verdict Obligation: `~/.claude/agents/senior-architect.md` §Same-Session Verdict Obligation (codified 2026-04-26 in PR #25).
- Architect arch-doc self-diff protocol: `feedback_architect_arch_doc_self_diff.md`.
- No-fabricated-specifics evidence rule: `feedback_no_fabricated_specifics.md`.

---

## Addendum 2026-04-26 — Engineer Challenge Sheet Verdicts (Round 2)

Same-Session Verdict round triggered by Engineer's Pre-Implementation Design Challenge Sheet (codified 2026-04-26 in PR #25 — `~/.claude/agents/engineer.md` Pre-Implementation Design Challenge Gate). Architect responding within ≤2 turns per `~/.claude/agents/senior-architect.md` §Same-Session Verdict Obligation.

Engineer surfaced 4 items: A1 (TS typing of `'instant'`), C1 (`history.scrollRestoration` placement), M1 (T-K053-04 query-only test contract), Z1 (`'scrollRestoration' in history` SSR-safety guard). All 4 are Architect-decidable; no PM escalation required.

### A1 — `behavior: 'instant'` TS typing — **ACCEPT (no cast required)**

**Verdict:** ship `behavior: 'instant'` literal as-is. **Do NOT** add `as ScrollBehavior` cast.

**Verification (2026-04-26):** ran `npx tsc --noEmit` against a temporary src test file:
```ts
export const _t = () => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
```
Result: `EXIT=0` under repo's `tsconfig.json` (TS 5.9.3, `target: ES2020`, `lib: ES2020 + DOM + DOM.Iterable`, `strict: true`). The `ScrollBehavior` union in DOM lib has included `'instant'` since TS 5.0 (CSSOM View Module 1 standard); repo runs TS 5.9.3 which is well above the threshold.

**Rationale:** unnecessary cast = readability noise + future-proofing antipattern (a cast would suppress legitimate type errors if browser API typings ever changed). Native union member needs no cast.

### C1 — `history.scrollRestoration = 'manual'` placement — **ACCEPT Engineer's option (a): separate `useEffect(() => {...}, [])` inside component**

**Verdict:** add a second `useEffect` with empty dep array (`[]`) inside `ScrollToTop`, mounted alongside the existing pathname effect. **§3.1 Edited** to make this canonical (line added between `useLocation()` destructure and the existing pathname effect — see updated §3.1 component code block).

**Verification (idempotency under StrictMode):** `history.scrollRestoration = 'manual'` is an idempotent string-property assignment. React StrictMode dev-mode double-invokes `useEffect` once with cleanup-and-rerun semantics. Without a cleanup function returned, the second invoke simply re-assigns the same `'manual'` string — observable side effect identical to single invoke. No race, no flicker, no deviation from production single-invoke behavior.

**Rationale:**
- Option (a) over (b) module-top-level: keeps the side effect inside React's lifecycle (one place to read, one place to clean up if K-053 is ever ripped out — single-file blast radius). Module top-level would orphan the assignment from `ScrollToTop.tsx` removal and create a "you have to grep main.tsx + ScrollToTop.tsx + index.css to find the policy" tax for maintainers.
- Empty dep array (`[]`) over `[]`-with-cleanup-restoring-`'auto'`: removing `ScrollToTop` is a sitewide router-policy decision; the unmount cleanup wouldn't accurately reflect "what should the browser default be after K-053 is removed?" — that's a future ticket's call. Don't pretend cleanup is correct when it isn't.
- The placement (separate effect, not folded into the `[pathname, hash]` effect) keeps the two concerns orthogonal: lifecycle policy vs per-nav side effect. Reviewer reading the component sees two named concerns instead of one entangled effect.

### M1 — T-K053-04 query-only-change test — **ACCEPT Engineer's option (b): skip the test, dep array IS the contract**

**Verdict:** do **NOT** add T-K053-04 to spec. Truth-table rows #6/#7 (query-only nav preserves scroll) are verified by static review of the dep array `[pathname, hash]` in `frontend/src/components/ScrollToTop.tsx`. **§3.3 Edited** to add an explicit annotation block where T-K053-04 would have been, citing this verdict + reasoning so future readers don't re-litigate.

**Verification (PRD AC-K053-06 §1 sufficient + wrong-axis risk concrete):**
- Read PRD `docs/tickets/K-053-scroll-to-top.md` AC-K053-06 §1 (lines 81–84): Same-route NavBar re-click on `/about` preserves scroll. Confirmed AC requires same-route preserved (asserted by T-K053-03), NOT query-only-change asserted as separate test.
- React Router v6 `useLocation()` is fed by the `history` library's listener, which subscribes to `pushState` events via the `history` package's wrapped `pushState`/`replaceState`. **Direct `window.history.pushState` bypasses the `history` package's wrapper**, so QA's suggested `page.evaluate(() => window.history.pushState(...))` would mutate the URL bar but NOT trigger a `useLocation` re-render. Test would pass trivially even if the dep array were broken (e.g. `[pathname, hash, search]` instead of `[pathname, hash]`) — false-pass = wrong-axis signal.
- The correct test would require driving navigation through the React Router API (e.g. a hidden `<button onClick={() => navigate('/about?tab=foo')}>` rendered in a fixture page) — significant test infra investment for a contract already verifiable by 1-line static review.

**Rationale:** dep array `[pathname, hash]` is the contract; deviation = bug Reviewer catches in code review. Adding a flaky pushState test creates more risk than it removes (false confidence + test infra burden). Truth-table rows #6/#7 stand as documented design intent; static review is the verification path.

### Z1 — `'scrollRestoration' in history` SSR-safety guard — **ACCEPT Engineer's option (b): omit guard**

**Verdict:** ship `history.scrollRestoration = 'manual'` without an `'scrollRestoration' in history` guard.

**Verification (2026-04-26):** ran `grep -rE "createRoot|hydrateRoot|renderToString" frontend/src/`:
```
frontend/src/main.tsx:ReactDOM.createRoot(document.getElementById('root')!).render(
```
Single hit — only client-side `createRoot`. Zero `hydrateRoot`, zero `renderToString` (no SSR). The site is built with Vite + Firebase Hosting (per `K-Line-Prediction/CLAUDE.md` §Deploy Checklist) — pure client-side SPA.

`history.scrollRestoration` is supported in all browsers Playwright tests against (Chromium, Firefox, WebKit on macOS) and all browsers in production target range (Chrome 46+ / Firefox 46+ / Safari 11+). Adding the guard would be 25 chars of dead defensive code with no future-proofing value (a future SSR migration would require many other changes — single-line guard wouldn't be the bottleneck).

**Rationale:** keeping defensive code that is unreachable in current architecture is anti-Karpathy-Simplicity. Per `feedback_architect_must_update_arch_doc.md` adjacent principle: "design debt = cumulative cognitive tax on every future reader". A guard for "what if we add SSR someday" is precisely the over-engineering the persona warns against; if SSR is ever added, that ticket Edits this line as part of the migration scope.

### Self-Diff Verification (Round 2 verdicts)

After §3.1 + §3.3 Edits, re-verified the design doc:
- §3.1 component code block: 14 LOC active code (was 9; +5 for the new `useEffect(() => { history.scrollRestoration = 'manual' }, [])` plus its 3-line comment block). Imports unchanged (`useEffect` already imported — second usage is free).
- §3.3 spec: T-K053-03 changed from `.skip` to active test (per BQ-K053-01 ruling resolved); T-K053-04 added as comment-only annotation block citing M1 verdict. Test count unchanged: 3 active + 0 skip (was 2 active + 1 skip).
- §12 AC ↔ Test Case Cross-Check is **stale** with respect to T-K053-03 status (currently shows "Pending — PM Phase 1 ruling required") — Engineer should refresh this row when copying §3.3 to spec file. Not Edited here because §12 also has an aggregate "5 ACs with executable assertions → 5 test surfaces (3 Playwright + 2 static)" line that already counts T-K053-03 in the 3 Playwright count, so the only stale field is the "Status" column for AC-K053-06. Engineer reads BQ-K053-01 ruling (PRD §QA Challenge Rulings) and updates assertion accordingly.
- §6 truth table row #8 is consistent with the new T-K053-03 active assertion (option a no-reset).

All Engineer copy-paste targets (§3.1 component code block, §3.3 spec contract) match Round 2 verdict outcomes. ✓

### References

- Engineer Pre-Implementation Design Challenge Gate: `~/.claude/agents/engineer.md` (codified 2026-04-26 in PR #25).
- Architect Same-Session Verdict Obligation: `~/.claude/agents/senior-architect.md` §Same-Session Verdict Obligation.
- BQ-K053-04 (PM ruling on `history.scrollRestoration = 'manual'`): PRD `docs/tickets/K-053-scroll-to-top.md` §QA Challenge Rulings BQ-K053-04.
- No-fabricated-specifics evidence rule: `feedback_no_fabricated_specifics.md` (verification commands run for A1 + Z1).
