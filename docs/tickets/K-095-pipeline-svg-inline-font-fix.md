---
ticket: K-095
title: Fix pipeline diagram font truncation — inline SVG via SVGR + CAG label reposition
status: closed
phase: 1
opened: 2026-05-05
closed-commit: 7517fdf
depends-on: []
qa-early-consultation: "✓ — 2026-05-05 K-095; AC-095-INLINE-SVG automatable via Playwright SVG text selector; AC-095-CAG-VISIBLE screenshot-only, demoted to Manual Verification"
sacred-clauses: []
---

# K-095 — Fix pipeline diagram font truncation — inline SVG via SVGR + CAG label reposition

## Problem

The /about page pipeline diagram (`RolePipelineSection`) embeds `pipeline.svg` via `<img src="/pipeline.svg">`.
When loaded this way the browser renders SVG in an isolated context — web fonts declared via `@font-face`
in the main document are not available, causing fallback to system monospace (wider character metrics
than Geist Mono). Box labels "Architect", "Engineer", "Reviewer" overflow their containing `<rect>`
and become partially invisible against the page background, appearing truncated in the screenshot.

Secondary issue: the CAG (Content-Alignment Gate) dashed-line marker and label are positioned at x=312,
y=50 — inside the vertical range of the row boxes (y=43–77) and overlapping the arrow line — with no
background rect. The label appears to float ambiguously in the gap between Architect and Engineer boxes.

Root cause: `<img>` embedding is font-isolated; CAG label lacks visual anchoring.

## Goal

1. Convert `RolePipelineSection` to render `pipeline.svg` as an inline React component via SVGR,
   so Geist Mono loads correctly and all box labels fit their rects.
2. Reposition the CAG label in `pipeline.svg` to sit clearly above the pipeline row (y < 43),
   making its role as a gate marker unambiguous.

## Acceptance Criteria

- **AC-095-INLINE-SVG**: `RolePipelineSection` renders `pipeline.svg` as an inline SVG component
  (not `<img>`). At 1280×800 viewport the SVG text elements for "Architect", "Engineer", and
  "Reviewer" are accessible as DOM text nodes (confirming inline, not image embed).
- **AC-095-CAG-VISIBLE**: CAG label `y` coordinate is < 43 (above the box row), so the label does
  not overlap box content or the horizontal arrow line. (Manual Verification — screenshot required.)

## Manual Verification

**MV-095-01 — Visual spot-check at 1280px**
- Navigate to /about
- Pipeline diagram must show full untruncated labels: "PM", "(arbitrates)", "Architect", "Engineer",
  "Reviewer", "QA", "Designer"
- CAG dashed marker must appear above (not inside) the box row, clearly positioned between Architect
  and Engineer

## File Change List

| File | Change |
|---|---|
| `frontend/src/assets/pipeline.svg` | **new** — move from `public/`; reposition CAG label `y` to ≤ 35 |
| `frontend/public/pipeline.svg` | **delete** — moved to assets |
| `frontend/src/components/about/RolePipelineSection.tsx` | Replace `<img>` with SVGR import + `<PipelineSVG>` component |
| `frontend/src/vite-env.d.ts` | Verify (or add) `*.svg?react` type declaration if missing |
