---
id: K-053
title: Scroll-to-top on route change
status: open
type: feat
priority: medium
created: 2026-04-26
visual-delta: none
content-delta: none
qa-early-consultation: docs/retrospectives/qa.md 2026-04-26 K-053
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

### AC-K053-06 — Same-route navigation, browser back/forward, and refresh behavior

**Given:** user is on `/about` (any scroll position)
**When:** user clicks the NavBar `About` link again (re-click of the link to the current route)
**Then:** the page does NOT scroll — the user remains at the same scroll position (re-clicking a link to the page you are already on is treated as a noop, matching browser address-bar behavior)
**And:** `scroll-to-top.spec.ts` has a test asserting `window.scrollY` is preserved after a same-route NavBar click (un-skips T-K053-03 with the option-a assertion: scroll preserved)

**Given:** user is on `/about` after navigating from `/diary`
**When:** user clicks the browser back button (returning to `/diary`)
**Then:** the page scrolls to top — `/diary` re-renders with `window.scrollY === 0` (every navigation, including browser back/forward, lands at the top of the new page)
**And:** browser-saved scroll position is NOT restored on POP navigation
**And:** the same behavior applies to browser forward navigation (`/diary` → `/about` via forward button → `window.scrollY === 0` on `/about`)

**Given:** user is on `/diary` with `window.scrollY > 500`
**When:** user refreshes the page (F5 / Cmd+R)
**Then:** the page reloads and `window.scrollY === 0` after the initial mount (refresh is treated as "user re-entered the URL fresh"; cross-refresh scroll preservation is out of scope and belongs to app-level state if ever desired)

**Given:** the page initially loads or the user navigates via browser back/forward (POP action)
**When:** the `<ScrollToTop />` component first mounts
**Then:** the component sets `history.scrollRestoration = 'manual'` so the browser does NOT attempt to restore a previously-saved scroll position
**And:** this eliminates the single-frame visual flicker that would otherwise occur on POP navigation (browser restores → useEffect overrides to 0 → user perceives a snap)
**And:** the manual setting is established once on mount (idempotent under React StrictMode dev double-invoke)

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

## QA Challenge Rulings (Phase 1)

QA Early Consultation surfaced 4 BQs requiring PM ruling. Source: `docs/retrospectives/qa.md` 2026-04-26 K-053 entry.

### BQ-K053-01 — Same-route navigation (truth-table row #8)

- **Question:** when user clicks `/about` link in NavBar while already on `/about`, should scroll reset?
- **Ruling:** **Option (a) ACCEPT no-reset** — concur with QA recommendation.
- **Rationale (priority chain):**
  1. *Pencil source-of-truth:* N/A — `visual-delta: none`, no `.pen` frame.
  2. *Ticket text:* PRD `## Background` cites operator complaint as cross-route loss (`/diary` → `/about`); same-route was never named as a defect.
  3. *Memory rules:* `feedback_pm_ac_visual_intent.md` — AC must express user-observable intent; "click link to where you already are" mental model = noop.
  4. *Codebase evidence:* zero existing `useNavigationType` consumers; no precedent for force-reset on noop nav.
- **Reflected in AC-K053-06 first Given/When/Then block** (scroll preserved on same-route NavBar click; T-K053-03 un-skipped with option-a assertion).

### BQ-K053-02 — POP back/forward (truth-table rows #9/#10)

- **Question:** browser back/forward should reset scroll, or restore browser-saved position?
- **Ruling:** **Option (a) ACCEPT always-reset** — concur with QA recommendation.
- **Rationale (priority chain):**
  1. *Pencil source-of-truth:* N/A.
  2. *Ticket text:* PRD `## Goal` says "every nav lands at top" — symmetric model is the operator's stated mental shape.
  3. *Memory rules:* `feedback_pm_ac_visual_intent.md` — visual intent of AC-K053-03 ("scroll behavior is instant") consistent across all nav types.
  4. *Codebase evidence:* no current `useNavigationType` exception path; introducing PUSH/POP asymmetry would create a behavioral split readers must memorize.
- **Reflected in AC-K053-06 second Given/When/Then block** (back AND forward reset to 0; browser-saved position NOT restored).

### BQ-K053-03 — Refresh mid-scroll (truth-table row #11)

- **Question:** on F5 refresh of `/diary` mid-scroll, reset to 0 or preserve via `history.scrollRestoration = 'auto'`?
- **Ruling:** **Option (a) ACCEPT reset-on-refresh** — concur with QA recommendation.
- **Rationale (priority chain):**
  1. *Pencil source-of-truth:* N/A.
  2. *Ticket text:* PRD `## Scope` "Out-of-scope: Scroll behavior in modals / drawers" — scroll-state-preservation is explicitly outside ticket scope.
  3. *Memory rules:* `feedback_pm_ac_visual_intent.md` — refresh = "user re-entered URL", consistent with always-go-to-top user model.
  4. *Codebase evidence:* zero app-level scroll-position state; cross-refresh persistence belongs to a future state-persistence feature, not this ticket.
- **Counter-argument acknowledged:** `/diary` long-timeline refresh-loss is annoying. **Decision:** if operator surfaces this post-launch as a separate UX defect, file a follow-up TD (e.g. `<DiaryPage>`-scoped scroll-restore using `sessionStorage`); not part of K-053.
- **Reflected in AC-K053-06 third Given/When/Then block** (F5 → `window.scrollY === 0` after initial mount).

### BQ-K053-04 — POP single-frame flicker mitigation (dependent on BQ-K053-02)

- **Question:** given BQ-K053-02 = (a) always-reset, accept the single-frame "browser restores → useEffect overrides → snap" flicker, or set `history.scrollRestoration = 'manual'`?
- **Ruling:** **Option (b) ADOPT `history.scrollRestoration = 'manual'`** — concur with QA recommendation.
- **Rationale (priority chain):**
  1. *Pencil source-of-truth:* N/A.
  2. *Ticket text:* AC-K053-03 mandates "no smooth-scroll animation perceived" — a visual flicker is a perceived animation; eliminating it satisfies the AC's spirit at zero cost.
  3. *Memory rules:* `feedback_pm_ac_visual_intent.md` — visual outcome ("no flicker") wins over implementation defaults; one-line code addition is appropriate when downside is zero.
  4. *Codebase evidence:* zero existing `history.scrollRestoration` overrides (verified §7.1 grep returned 0 hits); manual setting introduces no conflict.
- **Reflected in AC-K053-06 fourth Given/When/Then block** (component sets `history.scrollRestoration = 'manual'` once on mount; idempotent under StrictMode).

## Open BQs

(All Phase 1 BQs ruled above. Engineer Design Challenge Sheet may surface additional BQs in Phase 2.)

## Status

**Phase Gate verdict (2026-04-26):** PASS — MERGE-READY.

| Gate | Result | Source |
|---|---|---|
| AC coverage | 9/9 ✓ | Reviewer one-to-one alignment statement |
| Sacred conflict | zero | Reviewer cross-check (K-030 / K-031 / K-034 P1 / K-024 / K-040 all preserved; structural orthogonality) |
| QA Early Consultation | ✓ | `docs/retrospectives/qa.md` 2026-04-26 K-053 entry; 4 BQs all RESOLVED |
| Adversarial coverage | 5/5 | hash anchor / POP back-forward / same-route / modal-query / refresh-restore |
| Pre-existing fails orthogonal | ✓ | `ga-spa-pageview.spec.ts:164` (deferred to K-033) + `shared-components.spec.ts:275` (Footer 4105px snapshot drift from K-040 baseline); QA `git log main..HEAD -- <test-file>` returned empty for both |
| BQ closure iteration | 4 RESOLVED / 0 DEFERRED / 0 OPEN | BQ-01 → AC-K053-06 §1; BQ-02 → §2; BQ-03 → §3; BQ-04 → §4 |
| Engineer-made visual change scan | no literals found | routing-layer only; zero Tailwind/px additions |
| Worktree | `.claude/worktrees/K-053-scroll-to-top` @ `05e56fd` | per `git worktree list` |

**Open ACs:** none.

**Reviewer Info findings:** I-1 (`.first()` on About-link OK) + I-2 (Engineer-adapted Suspense anchor + tighter T-K053-02 floor — improvements). Neither blocks merge.

**Reviewer process improvement → TD-K053-01:** §12 AC ↔ Test Cross-Check Status column staleness scan rule. Out-of-scope for K-053 close (Info-tier, persona/process). See §Reviewer Process Improvement Disposition.

**Pre-existing fails disposition:**
- `ga-spa-pageview.spec.ts:164` AC-020-BEACON-SPA — already documented self-deferral to K-033 in test source (lines 184-189); existing tracking, accept-as-baseline.
- `shared-components.spec.ts:275` Footer `/` snapshot 4105px drift — baseline regenerated by K-040 commit `338e670` after Item 3 full-bleed refactor; drift is a known visual baseline shift not yet re-snapshotted. Open TD-K053-02 (lightweight: snapshot regen on next K-040-touching PR or standalone `chore` PR), accept-as-baseline for K-053 merge.

**Pending (post-merge, separate PM turn):**
- Deploy Record block (§Pre-close deploy evidence gate): runtime-scope YES, requires Phase A merge SHA + live probe.
- Frontmatter `closed: 2026-04-??` + `closed-commit: <post-merge-squash-SHA>` + `status: closed`.
- `## CLOSED` line in §Status with squash SHA.

Phase A merge unblocks deploy gate; Phase A close-time PM turn writes Deploy Record + flips `status: closed`.

## Reviewer Process Improvement Disposition

**Finding (Reviewer 2026-04-26 retro):** Architect Round 2 addendum left §12 AC ↔ Test Cross-Check Status column stale (cells reading "Pending — PM Phase 1 ruling required" despite reality being T-K053-03 active + BQ-K053-01 ruled). Reviewer's existing §Design Doc Checklist re-tick verifies row count but not Status-column accuracy.

**Ruling: TD-XXX deferral (NOT fix-now).**

- **Rationale:** Persona-text rule addition affecting `~/.claude/agents/reviewer.md` (global config under `~/Diary/claude-config/`) is meta-edit scope, NOT K-053 ticket scope. Per `~/Diary/ClaudeCodeProject/K-Line-Prediction/CLAUDE.md` §Worktree Isolation §Main direct-commit exception, persona meta-edits route through their own worktree (`config-reviewer-status-staleness` slug), not bundled into K-053 PR. Bundling would violate PR-split rule (a) cross K-XXX scope.
- **TD ticket draft:** `TD-K053-01 — Reviewer §Design Doc Checklist: status-column staleness scan on addendum-edit`. Two-line rationale: when Architect addendum Edits §3 spec contract, Reviewer must same-pass Read §12 cross-check Status column and flag stale "Pending..." / "TBD" cells as Warning to PM; codification target `~/.claude/agents/reviewer.md` §Design Doc Checklist re-tick adds bullet (c) per Reviewer retro proposal; memory file proposed `feedback_reviewer_design_doc_status_column_drift.md`.
- **TD ticket file path (to be created in main flow):** `docs/tickets/TD-K053-01-reviewer-status-column-staleness.md`.

**TD-K053-02 — Footer snapshot regen for `/` baseline drift.** One-line rationale: K-040 Item 3 full-bleed refactor regenerated Footer snapshots on most routes but `/` baseline drifted 4105px (0.04 ratio) without same-PR regen; standalone `chore(K-053-followup)` PR or fold into next K-040-touching ticket. **TD ticket file path:** `docs/tickets/TD-K053-02-footer-home-snapshot-regen.md`.

## Retrospective

### Engineer (2026-04-26)

**AC judgments that were wrong:** None — all 6 AC-K053-01 through AC-K053-06 (incl. 4 AC-K053-06 sub-blocks for same-route / back-forward / refresh / scrollRestoration mount) implemented per text. T-K053-04 query-only nav explicitly deferred per Architect Round 2 M1 verdict (dep array `[pathname, hash]` is the static-review contract; pushState bypasses `history` package wrapper = wrong-axis false-pass risk).

**Edge cases not anticipated:** `file-no-bar` testid resolves to 19 elements on `/about` (one per FileNoBar consumer card across 5 sections). Original spec draft used `page.getByTestId('file-no-bar')` as Suspense-settle anchor — failed at first Playwright run with strict-mode 19-element error. Fix: switched to `page.locator('section#header')` (single-instance `id` attribute on `AboutPage.tsx:30`). Caught at first Engineer-side Playwright run, not at Reviewer.

**Next time improvement:** Add to Engineer pre-impl grep sweep: when picking a Suspense-settle anchor for a Playwright assertion, run `grep -c 'data-testid="<candidate>"' frontend/src/` first. Single-instance (=1) → use as-is. Multi-instance → fall back to section `id` selector or a more specific scoped testid. Codified into the engineer.md retrospective newest entry for cross-ticket accumulation.
