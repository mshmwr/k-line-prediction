---
id: K-053
title: Scroll-to-top on route change
status: open
type: feat
priority: medium
created: 2026-04-26
visual-delta: none
content-delta: none
qa-early-consultation: pending — real qa required pre-Architect (routing-layer change fires sitewide on every nav; PM proxy not authorized for routing/runtime layer per `feedback_qa_early_proxy_tier.md`)
parent-plan: ~/.claude/plans/pm-ux-ux-wild-shore.md
prerequisite: meta-engineer-challenge-gate PR merged to main (inherits Pre-Implementation Design Challenge Gate from K-052; K-053 may proceed to Architect dispatch even if codification slightly slips, per plan §Phase Gate Notes — but real qa Phase 1 still mandatory)
---

## Goal

Eliminate the "land mid-page on route change" UX defect: when user is scrolled down on `/diary` and clicks `/about` in NavBar, the new page currently retains scroll position from the previous page. Implement a `<ScrollToTop>` component mounted inside `<BrowserRouter>` that resets scroll on `pathname` change, with a hash-link exception so anchor navigation still works.

## Background

Operator raised UX issue #1 (UX brainstorm 2026-04-26): SPA route changes don't reset scroll. Pattern mirrors existing `<GATracker>` component already mounted in `frontend/src/main.tsx` inside `<BrowserRouter>`. Renumbered from original K-052 to K-053 because K-051 occupied (PR #13).

## Scope

**In-scope:**
- New: `K-Line-Prediction/frontend/src/components/ScrollToTop.tsx` (functional component, returns null, side-effect via `useEffect` on `pathname` change)
- Edit: `K-Line-Prediction/frontend/src/main.tsx` — import `ScrollToTop`, mount immediately after `<GATracker />` inside `<BrowserRouter>`
- New: `K-Line-Prediction/frontend/e2e/scroll-to-top.spec.ts` — Playwright assertion: scroll page on `/diary`, click `/about` link, assert `window.scrollY === 0`

**Out-of-scope:**
- `<GATracker>` refactor (untouched)
- Scroll restoration on browser back/forward (qa Phase 1 will rule whether intent matches the chosen `behavior: "instant"` blanket-reset; PRD does NOT pre-decide)
- Scroll behavior in modals / drawers (not pathname changes)
- Mobile scroll position (no platform-specific override expected)

## Acceptance Criteria

### AC-K053-01 — ScrollToTop component exists with hash-link exception
**Given:** `frontend/src/components/ScrollToTop.tsx` lands in worktree  
**When:** Engineer reads the file  
**Then:** component imports `useEffect` from `react` and `useLocation` from `react-router-dom`  
**And:** component returns `null` (no DOM)  
**And:** `useEffect` depends on `[pathname, hash]` from `useLocation()`  
**And:** when `hash` is non-empty, effect early-returns WITHOUT scrolling (browser anchor behavior wins)  
**And:** when `hash` is empty, effect calls `window.scrollTo({ top: 0, left: 0, behavior: "instant" })`

### AC-K053-02 — ScrollToTop mounted inside BrowserRouter, after GATracker
**Given:** `frontend/src/main.tsx` updated  
**When:** Engineer reads the JSX tree  
**Then:** `<ScrollToTop />` is rendered inside `<BrowserRouter>` (as sibling to `<GATracker />`)  
**And:** `<ScrollToTop />` appears immediately after `<GATracker />` in the JSX  
**And:** `<ScrollToTop />` is OUTSIDE `<Routes>` (sibling of, not child of)  
**And:** `npx tsc --noEmit` exits 0

### AC-K053-03 — Pathname-change resets scroll to top
**Given:** user on `/diary` with `window.scrollY > 500`  
**When:** user clicks NavBar link to `/about`  
**Then:** after navigation completes, `window.scrollY === 0`  
**And:** scroll behavior is instant (no smooth-scroll animation perceived)  
**And:** `/about` page renders normally (no layout shift caused by the scroll reset)

### AC-K053-04 — Hash-link navigation does NOT reset scroll
**Given:** user on `/diary` (any scroll position)  
**When:** user navigates to `/diary#K-049` (or any in-page anchor link)  
**Then:** browser anchor behavior runs uninterrupted  
**And:** `window.scrollY` reflects the anchor target position (not 0)  
**And:** `ScrollToTop` effect early-returns without calling `window.scrollTo`

### AC-K053-05 — Playwright spec covers regression
**Given:** `frontend/e2e/scroll-to-top.spec.ts` lands  
**When:** `npx playwright test scroll-to-top.spec.ts` runs  
**Then:** spec navigates to `/diary`, scrolls page to `>= 500px`  
**And:** spec clicks NavBar link to `/about`  
**And:** spec asserts `await page.evaluate(() => window.scrollY) === 0` after navigation settles  
**And:** spec includes a second test: navigate to `/diary#<existing-anchor>` and assert `window.scrollY > 0` (anchor wins)  
**And:** spec passes  
**And:** existing Playwright suites (`about-v2.spec.ts`, `pages.spec.ts`, `ga-tracking.spec.ts`, etc.) all still pass — no regression

### AC-K053-06 — Same-route navigation behavior documented
**Given:** Phase 1 QA consultation rules on the same-route case (user clicks `/about` while already on `/about`)  
**When:** PM records the verdict in this PRD §QA Challenge Rulings block  
**Then:** behavior is one of:
- (a) ACCEPTED: no scroll reset (pathname unchanged, useEffect won't fire) — documented as intentional in code comment
- (b) FORCED: spec adds `key`-based or `useNavigationType`-based force trigger; AC-K053-06 amended to assert reset on same-route click  
**And:** chosen option is implemented in code  
**And:** chosen option is asserted in `scroll-to-top.spec.ts`

## Phase plan

### Phase 0 — Prerequisite gate (BLOCKED state)

K-053 inherits Pre-Implementation Design Challenge Gate from K-052 prerequisite (`meta-engineer-challenge-gate` PR). Per plan §Phase Gate Notes, K-053 is small enough that it MAY proceed to Architect dispatch if codification slightly slips, but real qa Phase 1 is still mandatory regardless.

### Phase 1 — QA Early Consultation (real qa, pre-Architect)

**Dispatch:** real `qa` agent via Agent tool inside K-053 worktree.

**QA scope (adversarial cases):**
- Hash anchor (`/diary#K-049`) — scroll reset must NOT fire (browser anchor wins). qa confirms hash-skip implementation handles all hash patterns (encoded chars, query+hash combo).
- Browser back/forward — current spec forces top on every pathname change. qa decides if that matches user intent or needs `useNavigationType()` exception (POP action might want scroll restoration to match user's prior position, since browser would normally restore).
- Same-route navigation (`/about` → `/about` via NavBar click) — pathname unchanged, useEffect dep array `[pathname, hash]` won't fire. qa confirms acceptable OR mandates force-trigger via `key` prop on a wrapper / `useNavigationType` / `Date.now()`-based effect dep.
- Modal / drawer that updates `?query` but NOT pathname — must NOT scroll (qa confirms `useLocation` `search` is NOT in dep array).
- Deep-route refresh (SPA reload at `/diary` mid-scroll) — verify no double-scroll between browser scroll-restore + initial mount of `<ScrollToTop>`.
- Programmatic `navigate('/about', { replace: true })` vs PUSH — both should reset (pathname-driven).
- React StrictMode double-invoke — useEffect runs twice in dev; assert idempotent (scrollTo to 0 twice is harmless but qa confirms).

**Deliverable:** QA returns Challenge list; PM rules per Challenge → either supplement AC OR mark Known Gap with reason. Phase 1 closes when every QA Challenge has a recorded ruling in this PRD §QA Challenge Rulings block.

**Gate:** PM does NOT dispatch Architect/Engineer until QA Challenge ruling block is added.

### Phase 2 — Architect + Engineer (bundled, per plan §Phase Gate Notes)

**Dispatch:** `senior-architect` agent inside K-053 worktree (likely produces 1-page design doc), then `engineer` agent.

**Engineer flow (per Pre-Implementation Design Challenge Gate):**
1. **Read-only pass** over Architect doc — NO Edit yet
2. Produce **Design Challenge Sheet** — likely short for K-053 (covers hash exception edge cases, back-button, same-route, useEffect dep array completeness)
3. Each challenge → Architect (or PM proxy) verdict
4. Edit unlocks ONLY after every challenge verdict'd
5. Implement: `ScrollToTop.tsx` → `main.tsx` mount → `scroll-to-top.spec.ts`
6. `npx tsc --noEmit` clean; `npx playwright test` clean

### Phase 3 — Code Review + QA regression

**Dispatch:** Code Reviewer (breadth + depth) → QA (`Agent(qa)` regression).

### Phase 4 — Deploy + close

**PM acceptance:** `visual-delta: none` (no Pencil frame required); Deploy Record block; live hosting probe = manual scroll-on-`/diary` + click-`/about` smoke test (capture in Deploy Record); BQ closure iteration; ticket closure bookkeeping (4 steps).

## Phase Gate Checklist

| Gate | Required at | Evidence |
|---|---|---|
| Engineer challenge sheet resolved? ✓/N/A | Phase 2 close | Sheet appended to §BQs with each item verdict'd; ✓ if items raised, N/A if zero |
| QA Early Consultation | Phase 1 close | Real qa retro entry at `docs/retrospectives/qa.md`; PRD §QA Challenge Rulings populated |
| AC ↔ Sacred cross-check | Phase 2 dispatch | PM evidence line `AC vs Sacred cross-check: ✓ no conflict` (no current Sacred forbids scroll reset on route change; Architect re-confirms) |
| Visual Spec JSON gate | N/A | `visual-delta: none`; no `.pen` frame; frontmatter `visual-spec: N/A — reason: routing-layer behavior change, no UI surface` |
| Shared-component inventory per route | N/A | No new route created; component mounts at app root; not a route-AC ticket |
| Worktree isolation pre-flight | Architect dispatch | `git worktree list` shows `.claude/worktrees/K-053-scroll-to-top` |
| ID reservation pre-flight | Worktree create | `git show HEAD:docs/tickets/K-053-*.md` returns this file content |
| Pre-merge close-sync scan | Each PM session Turn 1 | No drift between merged K-* commits and dashboard |
| Refactor AC grep raw-count sanity | N/A | Not a refactor ticket |
| Engineer-made visual change scan | Pre-CLOSED | Expected: `no literals found` (this is routing-layer, no Tailwind / px additions expected) |
| Deploy evidence gate | Pre-CLOSED | `Runtime-scope triggered: YES (files: frontend/src/main.tsx, frontend/src/components/ScrollToTop.tsx)` + Deploy Record + manual probe noted |
| BQ closure iteration | Pre-CLOSED | `BQ closure: [N resolved] [M deferred→TD] [K=0 open]` |

## Open BQs

(Populated as Phases progress. Phase 1 QA consultation typically generates the first batch — same-route behavior, back-button intent, hash-pattern coverage are likely candidates.)

## Retrospective

(Populated at ticket close.)
