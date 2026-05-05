---
ticket: K-096
title: PM Arbitration Detail Diagram — SVG coordinate plan
phase: 1
architect: senior-architect
date: 2026-05-05
visual-spec: N/A — reason: SVG-only change; no Pencil frame for pipeline section; design spec fully contained in this document
---

# K-096 — PM Arbitration Detail Diagram: Design Doc

## 0 Scope Questions

None. Ticket ACs are unambiguous; pipeline.svg coordinates are readable from source; pm.md §Content-Alignment Gate + §Arbitration Rules + §When Code Review finds Critical/Warning are the three flows to diagram.

---

## 1 Technical Solution Selection

Three approaches for delivering both SVGs:

### Option A — Conservative: patch pipeline.svg in-place + new standalone SVG file

- Add a minimal annotation group to `pipeline.svg` (a short dashed vertical line + small text label above the PM→Architect arrow segment).
- Create `pm-arbitration-detail.svg` as a fully independent SVG file imported via `?react` SVGR in a new thin wrapper component.
- **Applicable when:** minimal risk tolerance; existing test `data-testid="role-pipeline-svg"` must not break; overview diagram must remain readable at narrow viewports.
- **Trade-off:** two separate SVG files to maintain; visual style must be manually kept in sync.

### Option B — Progressive: merge both diagrams into a single tall SVG

- Extend `pipeline.svg` viewBox height to accommodate a second diagram section below.
- Single file, single `data-testid`.
- **Applicable when:** long-term consistency between sections is the top priority.
- **Trade-off:** overview section is no longer independently embeddable (README embed of `pipeline.svg` would include the detail section); `data-testid="role-pipeline-svg"` AC would now span both diagrams making it ambiguous; violates AC-096-DETAIL-SECTION which requires a separate heading.

### Option C — Middle ground: patch pipeline.svg + new SVG imported via dedicated component (selected)

Same as A, but the new SVG is rendered by a dedicated `PmArbitrationDetailSvg` component (thin SVGR wrapper, page-specific, not shared), rendered by `RolePipelineSection` below a `<h3>` heading element.

**Recommendation: Option C.** Keeps Overview and Detail independently addressable (README embed stays clean), satisfies the DOM-separate-heading AC (`AC-096-DETAIL-SECTION`), and mirrors the existing pattern where `PipelineSvg` is an SVGR import in `RolePipelineSection`.

---

## 2 Visual Style Reference (extracted from pipeline.svg)

| Token | Value |
|---|---|
| Background (implicit) | `#F4EFE5` (paper) |
| Box fill | `#2A2520` |
| Box text fill | `#F4EFE5` |
| Line/label/annotation color | `#8B7A6B` |
| Font family | `Geist Mono, monospace` |
| Primary label font-size | `12px`, `fontWeight="700"` |
| Secondary/annotation font-size | `9px` |
| Box dimensions | `width="100" height="34" rx="5"` |
| Arrow marker | `id="arrowhead"`, polygon `fill="#8B7A6B"` |
| Arrow stroke | `strokeWidth="1.5"` |
| Dashed stroke | `strokeDasharray="4 3"` (border), `"3 2"` (gate marker), `"3 3"` (dotted relation) |
| viewBox | `0 0 900 200` (Overview); propose `0 0 900 320` (Detail) |

---

## 3 SVG 1 — Pipeline Overview Patch

### 3.1 What to add

A single annotation group placed above the PM→Architect arrow segment (x range: 130–185, y=60). The annotation consists of:

1. A short vertical dashed line rising from midpoint of the arrow (x=157, y=43) upward to y=20.
2. A small text label `QA Early` at x=157, y=14 (above the line, centered).
3. No new boxes; no geometry changes to existing elements.

### 3.2 Exact coordinates

```
<!-- QA Early Consultation annotation — K-096 addition -->
<line
  x1="157" y1="20"
  x2="157" y2="43"
  stroke="#8B7A6B"
  strokeWidth="1"
  strokeDasharray="3 2"
/>
<text
  x="157" y="13"
  fontFamily="Geist Mono, monospace"
  fontSize="9"
  fill="#8B7A6B"
  textAnchor="middle"
>QA Early</text>
```

### 3.3 Justification of placement

- PM box occupies x=30–130, y=43–77. Architect box occupies x=185–285, y=43–77.
- The forward arrow runs from x1=130 to x2=185 at y=60.
- The midpoint of that segment is x=157.5 ≈ 157.
- The existing CAG marker is at x=312 (between Architect and Engineer). The QA Early marker at x=157 is entirely in the PM→Architect gap with no overlap.
- y=43 is the top edge of the pill row. y=20 gives 23px of vertical line above the pills — visible but not crowding the `viewBox` top boundary at y=0.
- The text at y=13 remains inside the `viewBox="0 0 900 200"` box (no viewBox resize required).

### 3.4 Existing elements unchanged

All existing `<rect>`, `<text>`, `<line>`, `<path>`, `<marker>` elements in `pipeline.svg` remain at their exact coordinates. The patch is additive only.

### 3.5 Copy for pipeline.svg public/ mirror

`frontend/public/pipeline.svg` is a README embed copy. Apply the identical two-element group to that file as well (same coordinates).

---

## 4 SVG 2 — PM Arbitration Detail: Full Layout Plan

### 4.1 viewBox and canvas

```
viewBox="0 0 900 320"
width="900"
height="320"
```

The canvas is divided into three horizontal flow lanes, each approximately 85px tall, separated by 15px gaps. A title row occupies y=0–25.

### 4.2 Shared defs

Reuse the same `<defs>` block from `pipeline.svg`:

```
<defs>
  <marker id="arrowhead2" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
    <polygon points="0 0, 8 3, 0 6" fill="#8B7A6B" />
  </marker>
</defs>
```

Use `id="arrowhead2"` to avoid collision when both SVGs are inlined in the same DOM.

### 4.3 Lane layout table

| Lane | y-start (box top) | Height | Flow |
|------|-------------------|--------|------|
| Title strip | 0 | 25 | Left-aligned heading text |
| Lane 1 — CAG flow | 30 | 75 | Left-to-right, with branch |
| Lane 2 — Reviewer escalation | 120 | 75 | Left-to-right loop |
| Lane 3 — QA Interception | 210 | 75 | Left-to-right with midpoint interrupt |
| Bottom margin | 285 | 35 | Empty (padding) |

### 4.4 Title strip

```
<text x="30" y="18"
  fontFamily="Geist Mono, monospace"
  fontSize="11" fontWeight="700"
  fill="#2A2520" textAnchor="start">
  PM ARBITRATION DETAIL
</text>
```

### 4.5 Lane 1 — CAG Flow (y-center: 67)

**Narrative:** `content-delta: yes + user-voice` ticket triggers Content-Alignment Gate. Architect returns design → PM presents verbatim to User → User approves → Engineer dispatched; if vetoed → loops back to Architect.

**Boxes (all `width="100" height="34" rx="5" fill="#2A2520"`):**

| Box | Label | cx | x | y |
|-----|-------|----|---|---|
| Architect | `Architect` | 80 | 30 | 50 |
| PM | `PM` | 235 | 185 | 50 |
| User | `User` | 390 | 340 | 50 |
| Engineer | `Engineer` | 545 | 495 | 50 |

**Secondary labels (y=79, `fontSize="9" fill="#8B7A6B"`):**

| Box cx | Text |
|--------|------|
| 80 | `(design)` |
| 235 | `(presents verbatim)` |
| 390 | `(approves / vetoes)` |
| 545 | `(dispatched)` |

**Arrows (forward, `stroke="#8B7A6B" strokeWidth="1.5" markerEnd="url(#arrowhead2)"`):**

| Line | x1 | y1 | x2 | y2 |
|------|----|----|----|----|
| Architect → PM | 130 | 67 | 185 | 67 |
| PM → User | 285 | 67 | 340 | 67 |
| User → Engineer | 440 | 67 | 495 | 67 |

**Veto loop-back arrow (User → Architect):**

```
<path d="M 390,84 C 390,110 80,110 80,84"
  stroke="#8B7A6B" strokeWidth="1.5" fill="none"
  strokeDasharray="4 3"
  markerEnd="url(#arrowhead2)" />
<text x="235" y="116"
  fontFamily="Geist Mono, monospace" fontSize="9"
  fill="#8B7A6B" textAnchor="middle">vetoed → back to Architect</text>
```

**Trigger label (left margin, above the lane):**

```
<text x="30" y="44"
  fontFamily="Geist Mono, monospace" fontSize="9"
  fill="#8B7A6B" textAnchor="start">CAG: content-delta yes + user-voice</text>
```

---

### 4.6 Lane 2 — Reviewer Escalation (y-center: 157)

**Narrative:** Reviewer finds Critical/Warning → escalates to PM → PM rules → Engineer fixes → back to Reviewer.

**Boxes:**

| Box | Label | cx | x | y |
|-----|-------|----|---|---|
| Reviewer | `Reviewer` | 80 | 30 | 140 |
| PM | `PM` | 235 | 185 | 140 |
| Engineer | `Engineer` | 390 | 340 | 140 |
| Reviewer (2) | `Reviewer` | 545 | 495 | 140 |

**Secondary labels (y=169):**

| cx | Text |
|----|------|
| 80 | `(Critical/Warning)` |
| 235 | `(rules)` |
| 390 | `(fixes)` |
| 545 | `(re-reviews)` |

**Arrows:**

| Line | x1 | y1 | x2 | y2 |
|------|----|----|----|----|
| Reviewer → PM | 130 | 157 | 185 | 157 |
| PM → Engineer | 285 | 157 | 340 | 157 |
| Engineer → Reviewer(2) | 440 | 157 | 495 | 157 |

**Trigger label:**

```
<text x="30" y="134"
  fontFamily="Geist Mono, monospace" fontSize="9"
  fill="#8B7A6B" textAnchor="start">Reviewer escalation</text>
```

---

### 4.7 Lane 3 — QA Interception (y-center: 247)

**Narrative:** QA can interrupt Engineer mid-implementation (not only at end). QA files interception → PM rules (supplement AC or Known Gap) → if supplement: Engineer resumes with updated AC.

**Boxes:**

| Box | Label | cx | x | y |
|-----|-------|----|---|---|
| Engineer | `Engineer` | 80 | 30 | 230 |
| QA | `QA` | 235 | 185 | 230 |
| PM | `PM` | 390 | 340 | 230 |
| Engineer (2) | `Engineer` | 545 | 495 | 230 |

**Secondary labels (y=259):**

| cx | Text |
|----|------|
| 80 | `(mid-impl)` |
| 235 | `(intercepts)` |
| 390 | `(rules: AC+/KG)` |
| 545 | `(resumes)` |

**Arrows:**

| Line | x1 | y1 | x2 | y2 |
|------|----|----|----|----|
| Engineer → QA | 130 | 247 | 185 | 247 |
| QA → PM | 285 | 247 | 340 | 247 |
| PM → Engineer(2) | 440 | 247 | 495 | 247 |

**Interrupt marker** (dashed vertical line at Engineer cx=80, indicating mid-impl breakpoint):

```
<line x1="80" y1="230" x2="80" y2="264"
  stroke="#8B7A6B" strokeWidth="1" strokeDasharray="3 2" />
```

**Trigger label:**

```
<text x="30" y="224"
  fontFamily="Geist Mono, monospace" fontSize="9"
  fill="#8B7A6B" textAnchor="start">QA Interception (mid-Engineer)</text>
```

---

### 4.8 Lane separator lines

Thin horizontal rules between lanes aid readability without adding new design tokens:

```
<!-- separator between Lane 1 and Lane 2 -->
<line x1="0" y1="120" x2="900" y2="120"
  stroke="#8B7A6B" strokeWidth="0.5" strokeOpacity="0.4" />
<!-- separator between Lane 2 and Lane 3 -->
<line x1="0" y1="210" x2="900" y2="210"
  stroke="#8B7A6B" strokeWidth="0.5" strokeOpacity="0.4" />
```

---

### 4.9 aria-label

```
aria-label="PM arbitration detail: three flows — Content-Alignment Gate, Reviewer escalation, QA Interception"
```

---

## 5 Component Tree

### 5.1 New components

| Component | File | Type | Notes |
|---|---|---|---|
| `PmArbitrationDetailSvg` | `frontend/src/assets/pm-arbitration-detail.svg` imported as `?react` | page-specific | Thin SVGR wrapper; no props needed |

### 5.2 Modified components

| Component | File | Change |
|---|---|---|
| `RolePipelineSection` | `frontend/src/components/about/RolePipelineSection.tsx` | Add `<h3>` heading "PM Arbitration Detail" + render `<PmArbitrationDetailSvg>` below existing `<PipelineSvg>` |

### 5.3 Props interface for RolePipelineSection

`RolePipelineSection` is a zero-prop component (no interface change). The new heading and SVG are unconditionally rendered.

### 5.4 Heading element spec

```
<h3
  className="text-[13px] font-mono font-700 text-ink mt-8 mb-4 tracking-[0.06em] uppercase"
>
  PM Arbitration Detail
</h3>
```

- Must be an `<h3>` (semantic sectioning under the existing section heading hierarchy on `/about`).
- Text exactly `"PM Arbitration Detail"` (AC-096-DETAIL-SECTION verifiable via `getByRole('heading', { name: 'PM Arbitration Detail' })`).

### 5.5 PmArbitrationDetailSvg render call

```
<PmArbitrationDetailSvg
  width="100%"
  data-testid="pm-arbitration-detail-svg"
  aria-label="PM arbitration detail: three flows — Content-Alignment Gate, Reviewer escalation, QA Interception"
  className="block h-auto"
/>
```

---

## 6 File Change List

| File | Action | Description |
|---|---|---|
| `frontend/src/assets/pipeline.svg` | Modify | Add QA Early annotation group (2 elements: `<line>` + `<text>`) at x=157, y=13–43 |
| `frontend/public/pipeline.svg` | Modify | Identical patch to README embed copy |
| `frontend/src/assets/pm-arbitration-detail.svg` | Create | New PM Arbitration Detail SVG per §4 coordinate plan |
| `frontend/src/components/about/RolePipelineSection.tsx` | Modify | Import `PmArbitrationDetailSvg`; add `<h3>` + SVG render below existing pipeline |

No backend changes. No new npm dependencies (SVGR `?react` import already used for `pipeline.svg`).

---

## 7 Implementation Order

1. **pipeline.svg patch** (both copies) — self-contained additive edit; no component change needed; verify `data-testid="role-pipeline-svg"` DOM text contains `QA Early` after inline import.
2. **pm-arbitration-detail.svg creation** — new file, no dependencies; can be created independently.
3. **RolePipelineSection.tsx update** — depends on step 2 (SVGR import path must exist); add heading + render component.
4. **TypeScript check** — `npx tsc --noEmit` after step 3.
5. **Playwright E2E** — verify AC-096-OVERVIEW-QA-EC (DOM text search on `role-pipeline-svg`) and AC-096-DETAIL-SECTION (`getByRole('heading', { name: 'PM Arbitration Detail' })`).
6. **Manual visual review** — MV-096-01 at 1280px per ticket.

Steps 1 and 2 are parallelizable.

---

## 8 Risks and Notes

- **`arrowhead` marker ID collision**: if both SVGs are ever inlined in the same DOM, `id="arrowhead"` will collide. The detail SVG must use `id="arrowhead2"` as specified in §4.2. Engineer must NOT reuse the name `arrowhead`.
- **SVGR `?react` import**: confirms existing usage in `RolePipelineSection.tsx` line 1 (`import PipelineSvg from '../../assets/pipeline.svg?react'`). Same pattern applies for `pm-arbitration-detail.svg`.
- **viewBox resize not required for Overview**: y=13 is inside `viewBox="0 0 900 200"` (top boundary y=0). Engineer must verify no clipping at the top by doing a visual check.
- **public/ mirror**: `frontend/public/pipeline.svg` is a static copy used for README embed. It must receive the identical patch. It is NOT an SVGR import — it is a raw file read by `<img>` in README. The `<text>` and `<line>` elements are still valid SVG and will render in browsers/GitHub.
- **Boundary: empty/null input**: SVG files have no runtime data binding; all content is static. No empty-state contract needed.
- **Boundary: max viewport**: SVG uses `width="100%"` + `className="block h-auto"` pattern from existing pipeline. At very narrow viewports (<375px), both SVGs will scale down proportionally. No text wrapping occurs in SVG — at extreme narrowness labels may become illegible. This is an existing Known Gap in the current pipeline.svg (not introduced by K-096).
- **Boundary: API errors**: no API calls involved.
- **Concurrency**: static SVG files; no concurrency concern.

---

## 9 Boundary Pre-emption Table

| Boundary scenario | Defined? | Action |
|---|---|---|
| Empty / null input | N/A — static SVG, no data binding | N/A |
| Max / min viewport | Known Gap — same as pipeline.svg | Registered Known Gap, not introduced by K-096 |
| API error (400/403/500/timeout) | N/A — no API calls | N/A |
| Concurrency / race condition | N/A — static asset | N/A |
| Empty list / large data | N/A — static content | N/A |

---

## 10 Refactorability Checklist

- [x] **Single responsibility**: `PmArbitrationDetailSvg` renders one diagram; `RolePipelineSection` composes pipeline + detail + heading — no bleed.
- [x] **Interface minimization**: zero-prop SVG component; no over-coupling.
- [x] **Unidirectional dependency**: `RolePipelineSection` → asset imports; no circular dependency.
- [x] **Replacement cost**: swapping the SVG file affects only the one `?react` import in `RolePipelineSection.tsx` — 1 file.
- [x] **Clear test entry point**: AC-096-OVERVIEW-QA-EC uses `data-testid="role-pipeline-svg"` DOM text search; AC-096-DETAIL-SECTION uses `getByRole('heading')` — both have unambiguous selectors.
- [x] **Change isolation**: SVG visual changes do not affect React props interface; heading text is isolated to `RolePipelineSection.tsx`.

---

## 11 All-Phase Coverage Gate

| Phase | Backend API | Frontend Routes | Component Tree | Props Interface |
|---|---|---|---|---|
| 1 | N/A | N/A (no route change; `/about` route unchanged) | ✓ §5 | ✓ §5.3 |

---

## 12 Sacred AC Cross-Check

Ticket `sacred-clauses: []` — no new Sacred clauses declared. Dependency K-095 has no Sacred clauses per ticket frontmatter. No existing Sacred clauses reference `RolePipelineSection` or `pipeline.svg` content. No conflict.

`AC vs Sacred cross-check: ✓ no conflict`

---

## 13 Cross-Page Duplicate Audit

Grepped `RolePipelineSvg|pm-arbitration-detail|PmArbitration` across `frontend/src/components` and `frontend/src/pages` — no other consumer. This SVG and heading are page-specific to `/about` via `RolePipelineSection`. No shared primitive extraction needed.

---

## 14 Architecture Doc Sync

`ssot/system-overview.md` line 272 already records:

```
├── RolePipelineSection.tsx  ← K-058; Nº 03 inline SVG pipeline diagram; viewBox 0 0 900 200; data-testid="role-pipeline-svg"
```

After K-096 lands, this entry must be updated to note:
- `pm-arbitration-detail.svg` added under `frontend/src/assets/`
- `RolePipelineSection.tsx` now renders heading `"PM Arbitration Detail"` + second SVG below pipeline

Architect will Edit `ssot/system-overview.md` when declaring this design doc complete (see §Mandatory Architecture Sync Gate).

---

## Consolidated Delivery Gate Summary

```
Architect delivery gate:
  all-phase-coverage=✓,
  pencil-frame-completeness=N/A — no .pen file for pipeline section; SVG is hand-authored,
  visual-spec-json-consumption=N/A — visual-spec: N/A per frontmatter,
  sacred-ac-cross-check=✓,
  route-impact-table=N/A — ticket scoped to /about RolePipelineSection; no global CSS or shared primitive token change,
  cross-page-duplicate-audit=✓,
  target-route-consumer-scan=N/A — no route navigation behavior changed,
  architecture-doc-sync=✓ (§14 specifies the update; will Edit system-overview.md),
  self-diff=✓,
  output-language=✓
  → OK
```

---

## Retrospective

**Where most time was spent:** Deriving exact x/y coordinates for the three-lane detail SVG from scratch (no Pencil frame source).
**Which decisions needed revision:** None in this session.
**Next time improvement:** For future pure-SVG diagrams with no Pencil backing, a coordinate scratch-pad section (like §3.2 and §4.5–4.7) should be the first artifact produced — it forces layout decisions before prose narration.
