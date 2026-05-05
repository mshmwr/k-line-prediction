---
ticket: K-096
title: /about pipeline section — add QA Early Consultation to Overview + new PM Arbitration Detail diagram
status: open
phase: 1
opened: 2026-05-05
depends-on: [K-095]
qa-early-consultation: "✓ — 2026-05-05 K-096; AC-096-OVERVIEW-QA-EC and AC-096-DETAIL-SECTION automatable via DOM; AC-096-DETAIL-CAG / AC-096-DETAIL-REVIEWER-LOOP / AC-096-DETAIL-QA-INTERCEPT demoted to Manual Verification (SVG content, screenshot only)"
sacred-clauses: []
---

# K-096 — /about pipeline section — QA Early Consultation + PM Arbitration Detail diagram

## Problem

The current Pipeline Overview SVG (`pipeline.svg`) omits three documented PM intervention points:

1. **QA Early Consultation** — QA is consulted before Architect starts (not after QA's position at the end); the current linear flow implies QA only appears post-Reviewer.
2. **Reviewer → PM → Engineer escalation loop** — when Reviewer finds Critical/Warning, it escalates to PM for ruling before returning to Engineer; the current diagram shows no path back from Reviewer.
3. **QA Interception** — QA can interrupt Engineer mid-implementation; the current diagram places QA strictly after Reviewer.

These gaps make the /about diagram misleading about PM's actual arbitration role.

## Goal

1. Add a **QA Early Consultation** marker to the existing Pipeline Overview SVG (minimal change — small annotation on the PM→Architect segment).
2. Add a new **"PM Arbitration Detail"** section below the Pipeline Overview in `RolePipelineSection`, with its own SVG showing all three PM intervention flows.

## Acceptance Criteria

- **AC-096-OVERVIEW-QA-EC**: Pipeline Overview SVG contains a visible element (text or marker) indicating QA Early Consultation occurs before Architect. Verifiable via DOM text search on `[data-testid="role-pipeline-svg"]`.
- **AC-096-DETAIL-SECTION**: `RolePipelineSection` renders a heading with text "PM Arbitration Detail" below the existing pipeline SVG. Verifiable via `getByRole('heading')` or `getByText`.
- **AC-096-DETAIL-CAG**: PM Arbitration Detail SVG shows the CAG flow — `content-delta: yes + user-voice → PM presents to user → user approves → Engineer`. (Manual Verification)
- **AC-096-DETAIL-REVIEWER-LOOP**: PM Arbitration Detail SVG shows Reviewer → PM → Engineer escalation path. (Manual Verification)
- **AC-096-DETAIL-QA-INTERCEPT**: PM Arbitration Detail SVG shows QA Interception mid-Engineer. (Manual Verification)

## Manual Verification

**MV-096-01 — Visual review of both SVGs at 1280px**
- Pipeline Overview: QA Early Consultation marker readable, does not clutter the existing flow
- PM Arbitration Detail: all three flows legible; consistent visual style (same colors/fonts as Overview)

## File Change List

| File | Change |
|---|---|
| `frontend/src/assets/pipeline.svg` | Add QA Early Consultation annotation on PM→Architect segment |
| `frontend/public/pipeline.svg` | Same patch (README embed copy) |
| `frontend/src/assets/pm-arbitration-detail.svg` | **new** — PM Arbitration Detail diagram |
| `frontend/src/components/about/RolePipelineSection.tsx` | Add "PM Arbitration Detail" heading + `<PmArbitrationSvg>` component below existing pipeline |
