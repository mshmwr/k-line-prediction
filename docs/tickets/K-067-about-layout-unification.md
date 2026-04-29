---
id: K-067
title: About page layout — WHERE I STEPPED IN card unification + section label rename
status: open
phase-1-status: open
created: 2026-04-29
type: frontend
priority: medium
size: small
visual-delta: yes
content-delta: no
design-locked: false
qa-early-consultation:
dependencies: [K-066]
worktree:
branch:
base-commit:
closed-commit:
---

## Summary

Two related about-page improvements decided in K-066 design review:

1. **WHERE I STEPPED IN layout unification** — remove the desktop 3-column table; use the mobile CardShell card layout at all breakpoints.
2. **Section label rename** — Nº 03 and Nº 04 both currently read "THE ROLES", which is ambiguous. Rename to reflect their distinct content.

## Motivation

- The desktop table and mobile cards render the same data in two different layouts, creating maintenance duplication and visual inconsistency across breakpoints. Unifying to cards removes the table branch entirely.
- Nº 03 contains `RolePipelineSection` (the SVG handoff chain PM → Architect → … → Designer); Nº 04 contains `RoleCardsSection` (individual role cards with OWNS / ARTEFACT descriptions). Two sections with identical labels give readers no signal about which section to navigate to.
- "THE PERSONNEL" matches the existing `FILE Nº N · PERSONNEL` label inside each role card, creating internal consistency.

## Acceptance Criteria

### Layout

- **AC-067-NO-TABLE:** The `hidden md:block` table grid inside `WhereISteppedInSection` is removed; no 3-column bordered table renders at any viewport width.
- **AC-067-CARD-ALL:** The WHERE I STEPPED IN section renders exactly 3 `CardShell` cards at all viewport widths (320px, 768px, 1280px).
- **AC-067-CARD-STRUCTURE:** Each card contains: `FileNoBar` (FILE Nº {1/2/3} · COMPARISON) + 3 label-value pairs (AI DID / I DECIDED / OUTCOME); OUTCOME value in `text-brick`.

### Section labels

- **AC-067-LABEL-03:** `SectionLabelRow` for the role pipeline section reads exactly `"Nº 03 — THE PIPELINE"`.
- **AC-067-LABEL-04:** `SectionLabelRow` for the role cards section reads exactly `"Nº 04 — THE PERSONNEL"`.

### Gates

- **AC-067-TSC:** `npx tsc --noEmit` passes.
- **AC-067-E2E:** Playwright passes; existing `AC-022-SECTION-LABEL` spec updated to reflect new label text for Nº 03 and Nº 04.

## PRD

### Scope

| File | Change |
|------|--------|
| `frontend/src/pages/AboutPage.tsx` | Lines with `"Nº 03 — THE ROLES"` → `"Nº 03 — THE PIPELINE"` and `"Nº 04 — THE ROLES"` → `"Nº 04 — THE PERSONNEL"` |
| `frontend/src/components/about/WhereISteppedInSection.tsx` | Remove `hidden md:block` table section (lines 45–69); remove `md:hidden` from card container (line 72) |
| `frontend/e2e/about-v2.spec.ts` | Update `AC-022-SECTION-LABEL` expected text for Nº 03 / Nº 04 |
| `frontend/design/homepage-v2.pen` | Update frame 35VCj: section labels + WHERE I STEPPED IN cards (desktop) |
| `frontend/design/specs/homepage-v2.frame-35VCj.json` | Re-export after .pen changes |

### Card layout spec (all breakpoints)

```
┌──────────────────────────────┐
│ FILE Nº 1 · COMPARISON       │  ← FileNoBar
│                              │
│ AI DID                       │  ← label: font-mono 10px text-muted uppercase
│   Architect proposed...      │  ← value: font-mono 12px text-ink
│                              │
│ I DECIDED                    │
│   Approved scope...          │
│                              │
│ OUTCOME                      │
│   Each ticket ships...       │  ← value: text-brick
└──────────────────────────────┘
(gap-3 between cards)
```

CardShell: `padding="md"`, `border border-muted/40`, `rounded-md`, `bg-paper`

## Out of Scope

- No changes to card content / copy (handled in K-066)
- No changes to other sections on the about page

## Tech Debt

None anticipated.
