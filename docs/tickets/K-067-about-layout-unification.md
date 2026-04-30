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
design-locked: true
qa-early-consultation: ✓ docs/retrospectives/qa.md 2026-04-29 K-067
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
- **AC-067-E2E:** Playwright passes; `AC-022-SECTION-LABEL` in `about-v2.spec.ts` (lines ~19–20) and `AC-045-SECTION-LABEL-X` in `about-layout.spec.ts` (lines ~165–166) both updated to new label text for Nº 03 / Nº 04.

## PRD

### Scope

| File | Change |
|------|--------|
| `frontend/src/pages/AboutPage.tsx` | Lines with `"Nº 03 — THE ROLES"` → `"Nº 03 — THE PIPELINE"` and `"Nº 04 — THE ROLES"` → `"Nº 04 — THE PERSONNEL"` |
| `frontend/src/components/about/WhereISteppedInSection.tsx` | Remove `hidden md:block` table section (lines 45–69); remove `md:hidden` from card container (line 72) |
| `frontend/e2e/about-v2.spec.ts` | Update `AC-022-SECTION-LABEL` expected text for Nº 03 / Nº 04 |
| `frontend/e2e/about-layout.spec.ts` | Update `AC-045-SECTION-LABEL-X` lines ~165–166 hardcoded label strings for Nº 03 / Nº 04 |
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

**PM Note (design spec update):** `.pen` card visual style must match the existing role cards in `Nº 04 — THE PERSONNEL` (`8mqwX` / `S3_RoleCardsSection`): `cornerRadius: 6`, `stroke: { align: "inside", fill: "#1A1814", thickness: 1 }`, body `padding: 12`. Do NOT use the Designer-added style (`cornerRadius: 12`, `stroke fill: "#1A181433"`). Designer must delete nodes H7fyn / Nv9Xw / HTyi6 / IW5ws and re-create cards matching role card pattern.

## Out of Scope

- No changes to card content / copy (handled in K-066)
- No changes to other sections on the about page

## PM Notes

### Requirement 7 — Homepage design frame 4CsvQ: 3 missing / stale items (added 2026-04-29)

Designer must fix the following in `homepage-v2.pen` frame `4CsvQ` (`hpHero` section):

| # | Item | Source (truth) | Design (current) | Action |
|---|------|---------------|-----------------|--------|
| 7a | Hero product screenshot | `<img src="/hero-shot.png">` between body text and CTA button (HeroSection.tsx line 18–28) | Missing — no image node in `heroCol` | Add image node after body text, before `heroBtns` |
| 7b | Hero body copy | "Search past ETH/USDT formations that resemble any candlestick window. Inspect what came after — for learning, not for trading signals." | "Pattern-matching engine for K-line candlestick charts. Upload historical data, find similar formations, and see what happened next." (stale) | Update `PrI8l` text content |
| 7c | Hero accent color (2nd heading line) | `text-brick` = `#B43A2C` | `fill: "#9C4A3B"` (brick-dark, wrong) | Update `2bQtY` fill to `#B43A2C` |

### Requirement 8 — About page design frame 35VCj: DELIVERY METRICS cards excess height (added 2026-04-29)

All 4 MetricCards in `BF4Xe` (`S2_MetricsStripSection`) have hardcoded `height: 280`, causing excess whitespace. K-064 already removed the min-height constraint in source code; design was not synced.

Designer must update all 4 cards: remove `height: 280`, set to `fit_content`. Also update body frames (`yPEl5`, `seD31`, `k89s2`, `XSj54`) from `height: "fill_container"` to remove height (let content define height).

| Node | Name | Fix |
|------|------|-----|
| `2k5ED` | m1_FeaturesShipped | `height` → remove (fit_content) |
| `55Zha` | m2_FirstPassReview | `height` → remove (fit_content) |
| `i7d8Y` | m3_PostMortems | `height` → remove (fit_content) |
| `jG43T` | m4_Guardrails | `height` → remove (fit_content) |

### Requirement 9 — About page design frame 35VCj: Nº 03 THE PIPELINE — remove pills row (added 2026-04-29)

`omyb7` (`SY_RolePipelineSection`) contains `xu3l7` (`rpPillsRow`) — a row of pill buttons showing PM → Architect → Engineer → Reviewer → QA → Designer. The actual SVG pipeline diagram (`data-testid="role-pipeline-svg"`) already illustrates the full flow with boxes, arrows, QA→PM loop-back arc, and dotted Designer→Architect line. The pills row is redundant.

Designer action: delete node `xu3l7` (`rpPillsRow`) from `omyb7`. No replacement needed — SVG covers the flow.

## Tech Debt

None anticipated.
