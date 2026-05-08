---
id: K-026
title: AppPage subcomponents paper palette migration (K-021 W-R3-02 follow-up)
status: superseded
superseded-by: K-030
superseded-date: 2026-04-21
type: refactor
priority: medium
created: 2026-04-20
source: K-021 Reviewer Round 3 W-R3-02
---

## ⚠️ SUPERSEDED BY K-030 (2026-04-21)

**Supersede reason:** K-030 redefines `/app` as a standalone tool page isolated from the marketing site (new tab, no NavBar/Footer, non-paper background). This makes K-026's premise — migrating `/app` subcomponents to paper palette — obsolete. Subcomponent color treatment for `/app` will be redefined by K-030 Architect design.

**Action:** No work required on this ticket. Close as superseded. Related subcomponent color work (if any) will be tracked under K-030 implementation scope.

## Background

K-021 already migrated the outer `/app` body to the paper palette (`bg-paper` + `text-ink`) and passed the AC-021-BODY-PAPER Playwright assertion. However, K-021 Reviewer Round 3 found 7 AppPage subcomponents still carrying dark-classes:

- `frontend/src/components/MainChart.tsx`
- `frontend/src/components/TopBar.tsx`
- `frontend/src/components/OHLCEditor.tsx`
- `frontend/src/components/StatsPanel.tsx`
- `frontend/src/components/MatchList.tsx`
- `frontend/src/components/PredictButton.tsx`
- `frontend/src/components/ErrorBoundary.tsx`

These 7 files contain dark-classes such as `text-white` / `bg-gray-900` / `border-white/10`. The visual seam between an off-white outer and dark inner contradicts K-021 design doc §6.6 "AppPage entirely off-white".

**K-025 scope is limited to UnifiedNavBar hex → token and does not include AppPage subcomponents**; K-026 is opened separately to track this.

## Dependencies

- K-021 already closed (AC-021-BODY-PAPER outer is green)
- Can run in parallel with K-025 (no scope overlap)
- Can be done before or after K-022 / K-023 / K-024

## Scope

**In:**

1. **File-by-file dark-class inventory:** grep the 7 files above for `text-white` / `bg-gray-` / `bg-\[#0` / `border-white` / other dark-hex; produce a complete mapping table.
2. **Map to K-021 token migration:**
   - `text-white` on the AppPage workspace bg → `text-ink` or `text-paper` (decided by the actual color of the outer container)
   - `bg-gray-900` / `bg-[#0D0D0D]` → `bg-paper` or an AppPage workspace mid-tone color (if the design doc specifies one)
   - `border-white/10` → `border-ink/10` or `border-muted`
3. **Visual sanity check:** on the dev server, log into `/app` and upload a CSV, then take a full-page screenshot. Cross-check against K-021 design doc §6.6 AppPage mockup (if present) or the K-017 visual report `/app` section. Require the MainChart background, OHLCEditor input, StatsPanel card, MatchList row, and PredictButton to all conform to the off-white scheme.
4. **Playwright assertions:** extend `frontend/e2e/sitewide-body-paper.spec.ts` or add a new spec asserting that the AppPage main subcomponents' computed bg/text match the paper/ink tokens.

**Out:**
- AppPage structural redesign (TD-K021-04 redesign scope; future standalone ticket)
- AppPage <900px viewport responsiveness (TD-K021-07)
- AppPage functional behavior changes

## Acceptance Criteria

### AC-026-APPPAGE-PAPER: AppPage 7 subcomponents have no dark-class `[K-026]`

**Given** the developer greps the 7 subcomponent files above
**When** searching for dark patterns such as `text-white` / `bg-gray-9` / `border-white` / hex `#0[0-9A-F]{5}` / hex `#1[0-9A-F]{5}`
**Then** the result count = 0 (or only explicitly retained edge cases remain, listed and explained inside the ticket)
**And** `npx tsc --noEmit` exits 0
**And** `npm run build` succeeds

### AC-026-APPPAGE-VISUAL: dual visual + Playwright verification `[K-026]`

**Given** QA visits `/app` on the dev server, logs in, and uploads a test CSV
**When** prediction is triggered and any MatchList card is expanded
**Then** the full-page color scheme matches the K-021 paper palette (no leftover dark blocks unless the design doc explicitly lists a workspace dim zone)
**And** Playwright asserts: AppPage main subcomponents (MainChart container / OHLCEditor input / StatsPanel / MatchList card) have a computed backgroundColor that is not `rgb(0, 0, 0)` or any dark color; text color is `rgb(26, 24, 20)` (ink) or the design-doc workspace mid-tone

### AC-026-REGRESSION: existing AppPage features have no regression `[K-026]`

**Given** all K-021 AC-021-* were PASS at K-021 close
**When** this ticket's implementation is done
**Then** the K-021 Playwright suite is fully green (especially AC-021-BODY-PAPER `/app` case and AC-021-FOOTER `/app` case)
**And** the `/app` flow upload CSV → prediction → MatchList expand → stats panel display works end-to-end without regression

## Related links

- [K-021 ticket](./K-021-sitewide-design-system.md)
- [K-025 ticket](./K-025-navbar-hex-to-token.md) (parallel, non-overlapping scope)
- [K-021 design doc §6.6](../designs/K-021-sitewide-design-system.md)
- tech-debt TD-K021-04 (AppPage redesign, future scope)

---

## Retrospective

### PM — 2026-04-21

**Supersede decision:** K-030 (high priority, user-reported 2026-04-21) redefines `/app` as an isolated tool page. K-026's paper palette migration premise no longer holds. Superseded without any implementation work; saves Architect/Engineer effort.

**Lesson:** Scope assumptions from past tickets (K-021 sitewide off-white) must be re-validated when user feedback changes a page-level role. K-026 was created on 2026-04-20; K-030 reversed the premise 1 day later. Future: when tickets touch cross-page palette decisions, explicitly flag the "page role assumption" in the ticket background for future re-evaluation.
