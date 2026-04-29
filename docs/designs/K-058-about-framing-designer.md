---
title: K-058 Phase 1 — /about "One operator, six AI agents" framing (Designer)
ticket: docs/tickets/K-058-about-agent-framing-batch.md
phase: 1
author: Designer
updated: 2026-04-28
status: ready-for-architect
visual-spec-root: frontend/design/specs/about-v2*.json
screenshots-root: frontend/design/screenshots/about-v2-*.png
scope: /about (desktop 1440px)
design-locked: false
---

## Frame Inventory (K-058 Phase 1)

| Frame ID | Section Name | Type | Spec File | Screenshot |
|----------|-------------|------|-----------|------------|
| `GMEdT` | SX_WhereISteppedIn (NEW) | new section | `about-v2.frame-GMEdT.json` | `about-v2-GMEdT.png` |
| `omyb7` | SY_RolePipelineSection (NEW) | new section | `about-v2.frame-omyb7.json` | `about-v2-omyb7.png` |
| `8mqwX` | S3_RoleCardsSection (UPDATED compact) | updated | `about-v2.frame-8mqwX.json` | `about-v2-8mqwX.png` |
| `EBC1e` | S5_TicketAnatomySection (ANNOTATED) | annotated | `about-v2.frame-EBC1e.json` | `about-v2-EBC1e.png` |
| `35VCj` | About /about full page | full page | — | `about-v2-35VCj-full.png` |

## Section Order — /about after K-058 Phase 1

```
35VCj (About /about)
└── qnQHQ   DisclaimerBanner
└── voSTK   abNav (NavBar)
└── Y80Iv   abBody
    ├── wwa0m   S1_PageHeaderSection
    ├── BF4Xe   S2_MetricsStripSection
    ├── GMEdT   SX_WhereISteppedIn          [NEW K-058]
    ├── omyb7   SY_RolePipelineSection       [NEW K-058]
    ├── 8mqwX   S3_RoleCardsSection          [COMPACT K-058]
    ├── UXy2o   S4_ReliabilityPillarsSection
    ├── EBC1e   S5_TicketAnatomySection      [ANNOTATED K-058]
    └── JFizO   S6_ProjectArchitectureSection
└── 86psQ   abFooterBar
└── QwyrN   DisclaimerSection
```

> **Status: RESOLVED** — render order confirmed correct via snapshot_layout (BF4Xe y=376 → GMEdT y=773 → omyb7 y=1214 → 8mqwX y=1694). No Y80Iv rebuild needed.

## "Where I Stepped In" — Spec (frame `GMEdT`)

### Layout
- `SX_WhereISteppedIn` — vertical layout, gap: 28, width: fill_container
- No background (inherits parent `#F4EFE5`)

### A Block — Section Header
- Label: `Nº 02.5 — WHERE I STEPPED IN`
- Style: Geist Mono 13px, weight 700, letter-spacing 2, fill `#1A1814`
- Divider line: rectangle, fill `#8B7A6B`, height 1, width fill_container

### A Block — Narrative
- Content: `I am the single operator. Every ticket is filed by me, reviewed by me, and merged by me. The agents execute; I decide.`
- Style: Geist Mono 14px, weight normal, lineHeight 1.6, fill `#1A1814`

### C Block — Comparison Table (node `UFPld`)
- Container: cornerRadius 6, stroke `#1A1814` 1px inside, layout vertical, width fill_container
- Header row (node `OYRHr`): fill `#2A2520`, 3 equal columns — "AI DID" / "I DECIDED" / "OUTCOME"
- Header text: Geist Mono 10px, weight 700, letter-spacing 2, fill `#F4EFE5`
- 3 data rows, each horizontal, stroke top `#8B7A6B` 1px
- Column dividers: stroke left `#8B7A6B` 1px on col 2 + col 3
- Cell padding: 12px all sides
- Body text: Geist Mono 12px, lineHeight 1.55, col1+col2 fill `#1A1814`, col3 fill `#B43A2C`

| Row | AI DID | I DECIDED | OUTCOME |
|-----|--------|-----------|---------|
| 1 | Architect proposed component tree + API contract | Approved scope, rejected over-abstraction, set sacred constraints | Each ticket ships with a verifiable artefact trail |
| 2 | Engineer implemented + Reviewer flagged bugs | Confirmed root cause, approved fix strategy | Zero regressions across 60+ merged PRs |
| 3 | Designer produced Pencil spec per each visual ticket | Selected visual direction (A/B/C options), approved design-locked gate | SSOT maintained across 3-page redesign |

### B Block — Outcome Row (node `eIxup`)
- Content: `60 tickets. 100% AC coverage. Every decision logged.`
- Container: fill `#2A2520`, cornerRadius 6, padding `[16, 20]`
- Text: Geist Mono 14px, weight 700, letter-spacing 1, fill `#F4EFE5`

---

## "Role Pipeline" — Spec (frame `omyb7`)

### Layout
- `SY_RolePipelineSection` — vertical layout, gap: 28, width: fill_container

### Section Header
- Label: `Nº 03 — THE ROLES`
- Style: Geist Mono 13px, weight 700, letter-spacing 2, fill `#1A1814`

### Description
- Content: `Automatic handoffs between six AI agents. Each role owns a single responsibility and produces a verifiable artefact.`
- Style: Geist Mono 14px, lineHeight 1.6, fill `#1A1814`

### Role Pills Row (node `xu3l7`)
- Layout: horizontal, alignItems center, gap 8
- Sequence: `PM → Architect → Engineer → Reviewer → QA → Designer`
- Pill style: fill `#2A2520`, stroke `#1A1814` 1px inside, cornerRadius 4, padding `[6, 14]`, text Geist Mono 12px weight 700 fill `#F4EFE5`
- Arrow style: `→`, Geist Mono 14px, fill `#8B7A6B`

### Roles Table (node `qRYhe`)
- Container: cornerRadius 6, stroke `#1A1814` 1px inside, layout vertical
- Header: fill `#2A2520`, columns ROLE (width 200px) / OWNS / ARTEFACT
- 6 rows sourced verbatim from `content/roles.json`
- Role name: Geist Mono 13px weight 700 fill `#B43A2C`
- Body text: Geist Mono 12px lineHeight 1.5 fill `#1A1814`

---

## Role Cards Compact Format α — Spec (frame `8mqwX`)

### Changes from previous design
| Property | Before | After |
|----------|--------|-------|
| Section label | `Nº 02 — THE ROLES` | `Nº 04 — THE ROLES (compact)` |
| Section intro | `Each role a separate agent...` | `Role cards. Each agent with its ownership and verifiable artefact.` |
| Card height | Fixed 320px | `fit_content` |
| Card body padding | 20px | 12px |
| Card body gap | 14px | 8px |

### Card structure (unchanged)
- Top bar: FILE Nº · PERSONNEL, fill `#2A2520`, text `#F4EFE5`
- Body: role name (prominent, `#B43A2C`) + divider + OWNS label + owns text + ARTEFACT label + artefact text

---

## Dynamic Placeholder Annotations — EBC1e

Nodes marked `metadata: { type: "dynamic", dynamic: true }` signal Engineer that text content comes from `content/ticket-cases.json` at runtime, not hardcoded TSX.

| Case | Title Node | Outcome Node | Learning Node |
|------|-----------|--------------|---------------|
| K-002 | `GtO0Z` | `lwBEi` | `wWdZj` |
| K-008 | `FIemh` | `dAprq` | `fA0eV` |
| K-009 | `CMDTi` | `UsPNK` | `RbIL9` |

Static fields (not dynamic): ticket ID, case number label, section headers, link text pattern.

---

## Mobile Constraints (PM-approved 2026-04-28)

| Component | Mobile layout | Note |
|-----------|--------------|------|
| "Where I Stepped In" comparison table | `grid-cols-1 md:grid-cols-3` | Each row → CardShell card; columns → label+text pairs |
| Role Pipeline pills row | `flex flex-wrap justify-center` | `→` inline with pill |
| Role Pipeline roles view | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` | Reuse compact RoleCard |

## Shared Component Constraint (Engineer)

New cards in RolePipelineSection and WhereISteppedInSection MUST use `CardShell` (`primitives/CardShell.tsx`) + `FileNoBar` (`about/FileNoBar.tsx`). No inline card JSX.

## SVG Flow Diagram Spec (Role Pipeline)

**Pencil frame:** `omyb7` → child `ZIExb` (rpSvgPlaceholder, 200px tall)
**Engineer implementation:** inline SVG in `RolePipelineSection.tsx`
**Table node removed:** `qRYhe` (rpRolesTable) deleted — PM decision (K-058 Phase 1.5)

### Viewport

```
viewBox="0 0 900 200"
width="100%"
height="auto"  (CSS: aspect-ratio drives height from viewBox)
background: none (transparent — sits on #F4EFE5 paper)
```

### Coordinate Grid

The diagram has two rows:
- **Main row** (y center = 60): PM → Architect → Engineer → Reviewer → QA, 5 pills
- **Designer row** (y center = 150): Designer pill, on-demand branch

Pill dimensions: `width=100, height=34, rx=5`

### Main Row Pills — exact x, y coordinates

| Role | Pill x (left edge) | Pill y (top edge) | Center x | Center y |
|------|--------------------|-------------------|----------|----------|
| PM | 30 | 43 | 80 | 60 |
| Architect | 185 | 43 | 235 | 60 |
| Engineer | 340 | 43 | 390 | 60 |
| Reviewer | 495 | 43 | 545 | 60 |
| QA | 650 | 43 | 700 | 60 |

### Designer Pill (on-demand branch)

- **x:** 107 (centered between PM right-edge=130 and Architect left-edge=185, nudged left)
- **y:** 133 (top edge)
- **width:** 100, **height:** 34, **rx:** 5
- **center x:** 157, **center y:** 150
- **fill:** none (transparent)
- **stroke:** `#8B7A6B`, `stroke-width: 1.5`, `stroke-dasharray="4 3"`

### Label "ON DEMAND" above Designer pill

```
x=157 y=126
text-anchor="middle"
font-family="Geist Mono" font-size="9" font-weight="700"
fill="#8B7A6B" letter-spacing="2"
content: "ON DEMAND"
```

### Arrowhead Marker (reuse for all arrows)

```xml
<defs>
  <marker id="arrowhead" markerWidth="8" markerHeight="6"
          refX="8" refY="3" orient="auto">
    <polygon points="0 0, 8 3, 0 6" fill="#8B7A6B"/>
  </marker>
</defs>
```

### Forward Arrows (main loop, 4 lines)

Each arrow: `x1 = pill_right + 2`, `x2 = next_pill_left - 2`, `y1 = y2 = 60`

| Arrow | x1 | x2 | y1/y2 |
|-------|----|----|-------|
| PM → Architect | 130 | 185 | 60 |
| Architect → Engineer | 285 | 340 | 60 |
| Engineer → Reviewer | 440 | 495 | 60 |
| Reviewer → QA | 595 | 650 | 60 |

All: `stroke="#8B7A6B" stroke-width="1.5" fill="none" marker-end="url(#arrowhead)"`

### Loop-back Arrow (QA → PM)

Curved path going below the main row, back to PM:

```
M 750,77    (QA pill bottom-center: x=700+50=750, y=77)
C 750,115 30,115 30,77   (cubic bezier, dips to y=115)
```

`stroke="#8B7A6B" stroke-width="1.5" fill="none" stroke-dasharray="none" marker-end="url(#arrowhead)"`

### On-demand Branch Lines

**PM → Designer** (dotted, going down-right):
```
M 80,77     (PM bottom-center)
L 157,133   (Designer top-center)
```
`stroke="#8B7A6B" stroke-width="1.5" fill="none" stroke-dasharray="3 3"`

**Designer → Architect** (dotted, going up-right):
```
M 207,150   (Designer right-center: x=107+100=207, y=150)
L 235,77    (Architect bottom-center)
```
`stroke="#8B7A6B" stroke-width="1.5" fill="none" stroke-dasharray="3 3" marker-end="url(#arrowhead)"`

### Text Labels (inside pills)

All pills: `font-family="Geist Mono" font-size="12" font-weight="700" fill="#F4EFE5" text-anchor="middle" dominant-baseline="middle"`

| Role | text x | text y | content |
|------|--------|--------|---------|
| PM | 80 | 60 | PM |
| Architect | 235 | 60 | Architect |
| Engineer | 390 | 60 | Engineer |
| Reviewer | 545 | 60 | Reviewer |
| QA | 700 | 60 | QA |
| Designer | 157 | 150 | Designer |

Designer pill text: `fill="#1A1814"` (ink, not paper — pill is transparent)

### Main pill `<rect>` style (PM / Architect / Engineer / Reviewer / QA)

```
fill="#2A2520"  rx="5"  width="100"  height="34"
stroke: none (fill is sufficient contrast)
```

### Complete SVG element order

1. `<defs>` with arrowhead marker
2. Main row pills × 5 (`<rect>`) + labels × 5 (`<text>`)
3. Forward arrows × 4 (`<line>`)
4. Loop-back arrow (`<path>`)
5. Designer pill (`<rect>` dashed)
6. "ON DEMAND" label (`<text>`)
7. PM→Designer line (`<line>` dashed)
8. Designer→Architect line (`<line>` dashed + arrowhead)
9. Designer label text (`<text>`)

---

## BQs Raised

### BQ-058-D1 — Pencil M() render-order limitation

**Status: RESOLVED** — render order confirmed correct via snapshot_layout (BF4Xe y=376 → GMEdT y=773 → omyb7 y=1214 → 8mqwX y=1694). No Y80Iv rebuild needed.
