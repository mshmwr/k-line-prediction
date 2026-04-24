---
id: K-041
title: /diary mobile rail/marker restore via shared-component mobileVisible prop
status: in-progress
type: bug-fix + refactor
priority: medium
size: S
created: 2026-04-24
qa-early-consultation: docs/retrospectives/qa.md 2026-04-24 K-041 (PM proxy tier — scope narrow: 4 files + 1 spec flip, Sacred table pre-locked)
triggered-by: K-040 post-close BQ-040-03 user override (2026-04-23)
related:
  - K-023  # Sacred: Homepage marker borderRadius=0
  - K-024  # §6.8 extrapolated mobile-hide rule (to be superseded)
  - K-028  # Sacred: Homepage mobile rail always-visible
  - K-040  # BFP-triage that surfaced PRD-vs-Pencil conflict → user override
worktree: .claude/worktrees/K-041-diary-rail-shared-prop
visual-delta: none
design-locked: N/A (no Pencil frame change — restoring Homepage-style rail/marker, already in /app design system)
---

## Summary

K-040 BFP triage surfaced `/diary` mobile rendering missing rail + marker. Designer verdict (b) `design-removed` was consistent with PRD.md L786 AC-024-CONTENT-WIDTH literal text `mobile rail/marker display: none`. User overrode post-close → PRD itself is the root cause. K-041 rewrites AC-024-CONTENT-WIDTH (Option 3 wording), refactors `DiaryRail` + `DiaryMarker` to accept `mobileVisible` + `borderRadius` props, migrates Homepage inline render to shared components, flips `/diary` spec assertions, preserves K-023 + K-028 Sacred invariants.

## Background

**Root cause chain:**
1. K-024 Phase 3 wrote AC-024-CONTENT-WIDTH literal `mobile rail/marker display: none` into PRD.md L786.
2. K-024 §6.8 extrapolated `hidden sm:block` class on `DiaryRail.tsx` + `DiaryMarker.tsx`.
3. Homepage kept inline render (DevDiarySection.tsx L83-119) to preserve K-023 (marker borderRadius=0) + K-028 (mobile always-visible) Sacred invariants → resulting dual render-path split.
4. K-040 Item 6 user reported `/diary` mobile missing rail/marker. Designer verdict (b) per 4 converging sources. User overrode = overriding PRD.

**Why K-041 refactors rather than just flipping 2 classes:** dual render-path split is itself a code smell (K-024 Phase 3 retro acknowledged). Single fix (props-unified shared components) eliminates duplication + makes future Sacred invariants expressible in component API rather than component copies.

## Scope

**Includes:**
- Edit `PRD.md` L786 AC-024-CONTENT-WIDTH (Option 3 wording)
- Refactor `DiaryRail.tsx` + `DiaryMarker.tsx` to accept `mobileVisible` + `borderRadius` props
- Migrate `DevDiarySection.tsx` from inline render → shared components with props
- Update `DiaryEntryV2.tsx` mobile padding: `pl-0` → `pl-[92px]`
- Flip `frontend/e2e/diary-page.spec.ts` T-C6 mobile assertions

**Excludes:**
- Deploy this session (user confirmed skip)
- Pencil frame changes (no visual delta — restored behavior already in Homepage design system)
- K-024 §6.8 document rewrite (annotate only — document is historical record)

## Sacred Invariant Cross-Check (hard gate — all must remain green)

| Sacred | Source | K-041 Preservation Mechanism |
|--------|--------|------------------------------|
| Homepage marker `borderRadius: 0` | K-023 | `<DiaryMarker borderRadius={0} />` in DevDiarySection; default `borderRadius=4` for /diary (existing behavior) |
| Homepage marker `top: 8px` | K-023 | `HOMEPAGE_MARKER_TOP_INSET` constant preserved; passed to DiaryMarker `topInset` prop (or kept via existing `top` prop structure) |
| Homepage mobile rail always-visible | K-028 | `<DiaryRail mobileVisible />` in DevDiarySection (prop=true always) |
| DevDiary heading + 3-marker + 0-entry wrapper | K-028 | No change — orthogonal to rail/marker props |
| `/diary` 5-entry initial pagination | K-024 | No change — unrelated to rendering |
| body paper palette + 3 fonts | K-021 | No change — no palette/font touch |

## File Change List

| # | File | Change | Class | Gate |
|---|------|--------|-------|------|
| 1 | `PRD.md` (L786) | AC-024-CONTENT-WIDTH rewrite (Option 3) | docs | no gate |
| 2 | `frontend/src/components/diary/DiaryRail.tsx` | Add `mobileVisible?: boolean` prop; conditional class | frontend/src | full gate |
| 3 | `frontend/src/components/diary/DiaryMarker.tsx` | Add `mobileVisible?: boolean` + `borderRadius?: number` props | frontend/src | full gate |
| 4 | `frontend/src/components/home/DevDiarySection.tsx` | Replace inline rail/marker with `<DiaryRail mobileVisible /> <DiaryMarker mobileVisible borderRadius={0} />` | frontend/src | full gate |
| 5 | `frontend/src/components/diary/DiaryEntryV2.tsx` | Mobile padding `pl-0` → `pl-[92px]` | frontend/src | full gate |
| 6 | `frontend/e2e/diary-page.spec.ts` (T-C6) | Flip mobile assertions: `display:none` → visible | frontend/e2e | full gate |

Mixed commit class → strictest gate (full: tsc + Vitest + Playwright subset).

## Acceptance Criteria

### AC-041-DIARY-MOBILE-RAIL (supersedes K-040 ticket-local AC-040-DIARY-MOBILE-RAIL)

**Given** `/diary` rendered at mobile viewport (<640px)
**When** entries render
**Then** vertical rail visible along left edge
**And** each entry's marker visible at left-side anchor position
**And** entry wrapper `paddingLeft: 92px` (matches Homepage spacing)
**And** marker `borderRadius: 4px` (default `/diary` style, unchanged from desktop)

### AC-041-HOMEPAGE-INVARIANT-PRESERVED

**Given** Homepage DevDiarySection renders ≥1 entry at any viewport
**When** marker inspected via DOM / computed style
**Then** marker `borderRadius: 0` (K-023 Sacred)
**And** marker `top: 8px` offset (K-023 Sacred, `HOMEPAGE_MARKER_TOP_INSET`)
**And** mobile rail visible at <640px (K-028 Sacred)

### AC-041-SHARED-COMPONENT-UNIFIED

**Given** Homepage DevDiarySection source code
**When** grep for inline `<div ... bg-diary-rail`
**Then** no match (inline render replaced by `<DiaryRail />`)
**And** no match for inline `<div ... diary-marker` equivalents in DevDiarySection (`<DiaryMarker />` used instead)

### AC-041-SPEC-FLIPPED

**Given** `frontend/e2e/diary-page.spec.ts` T-C6
**When** run against `/diary` at 390×844 viewport
**Then** rail element `display !== 'none'`
**And** marker element `display !== 'none'`

## Behavior-Diff Truth Table (OLD vs NEW, all viewports)

| Viewport | Route | Element | OLD | NEW | Change? |
|----------|-------|---------|-----|-----|---------|
| <640px | `/diary` | DiaryRail | `display: none` | visible | **FLIP** (desired) |
| <640px | `/diary` | DiaryMarker | `display: none` | visible, `borderRadius: 4` | **FLIP** (desired) |
| <640px | `/diary` | DiaryEntryV2 `paddingLeft` | `0` | `92px` | **CHANGE** (desired — align with marker/rail) |
| ≥640px | `/diary` | DiaryRail | visible | visible | same |
| ≥640px | `/diary` | DiaryMarker | visible, `borderRadius: 4` | visible, `borderRadius: 4` | same |
| ≥640px | `/diary` | DiaryEntryV2 `paddingLeft` | `92px` | `92px` | same |
| <640px | `/` (Homepage) | inline rail | visible (K-028 Sacred) | `<DiaryRail mobileVisible />` visible | equivalent — source changed, DOM visible |
| <640px | `/` (Homepage) | inline marker | visible, `borderRadius: 0` (K-023 Sacred) | `<DiaryMarker mobileVisible borderRadius={0} />` visible, `borderRadius: 0` | equivalent — source changed, DOM equivalent |
| ≥640px | `/` (Homepage) | inline rail | visible | `<DiaryRail mobileVisible />` visible | equivalent |
| ≥640px | `/` (Homepage) | inline marker | visible, `borderRadius: 0`, `top: 8px` | `<DiaryMarker mobileVisible borderRadius={0} />` visible, `borderRadius: 0`, `top: 8px` | equivalent |

**Pure-refactor gate for Homepage rows:** NEW must render equivalent DOM (visible + same borderRadius + same top) — Reviewer depth pass must verify via Playwright screenshot diff or computed-style assertion.

## Execution Plan

- **Phase 0 (docs)** — this file + PRD.md L786 edit → docs commit #1
- **Phase 1 (QA Early Consultation PM proxy)** — ≥3 adversarial questions + pass/fail-once criteria → prepend to `docs/retrospectives/qa.md`
- **Phase 2 (Engineer)** — 5 source edits + truth-table verification + tsc + Vitest + Playwright subset → code commit #2
- **Phase 3 (Reviewer)** — Agent(reviewer) breadth + depth (pure-refactor behavior-diff gate)
- **Phase 4 (QA)** — full Playwright regression → sign-off
- **Phase 5 (PM close)** — update `tech-debt.md` (rename 2026-04-23 TD-001/TD-002 → TD-K040-01/TD-K040-02; close TD-K040-02 via K-041) + `PM-dashboard.md` + commit-diary wrap-up + worktree auto-merge

## Retrospective

_(to fill after close)_
