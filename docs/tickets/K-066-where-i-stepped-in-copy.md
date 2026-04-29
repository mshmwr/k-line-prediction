---
id: K-066
title: WhereISteppedIn narrative + bottom bar SSOT
status: open
phase-1-status: open
created: 2026-04-29
type: content
priority: medium
size: small
visual-delta: yes
content-delta: yes
design-locked: false
qa-early-consultation: N/A — copy-only change, no new UI path; text content change on existing elements
dependencies: []
worktree: .claude/worktrees/K-066-where-i-stepped-in-copy
branch: K-066-where-i-stepped-in-copy
base-commit: c73cc2d
closed-commit:
---

## Summary

Revise the WhereISteppedIn section narrative (line 31) to accurately reflect the operator's role: requirements provider + end-of-pipeline reviewer + merge gate. Make bottom bar stat text SSOT-driven from `content/site-content.json` and update copy per interviewer-reviewer recommendation.

## Motivation

- Current narrative ("The agents execute; I decide") overstates mid-pipeline decision authority. Actual role: define requirements, let agents run, review at pipeline boundary.
- Bottom bar "60 tickets" is misleading (60 = AC count, not ticket count). "Every decision logged" is factually wrong — agents make most execution decisions.
- Interviewer-reviewer (2026-04-29) recommended: encode arc (requirements → agent execution → boundary correction), surface pipeline depth as the third stat.

## Acceptance Criteria

- **AC-066-NARRATIVE:** `data-testid="where-i-narrative"` renders revised text encoding: (1) requirements originate from operator, (2) agents handle design through QA, (3) corrections happen at pipeline boundary.
- **AC-066-BOTTOM-BAR:** Bottom bar text reads `{N} features shipped. 100% AC coverage. 6-agent pipeline.` where N = `metrics.featuresShipped.value` from `site-content.json`.
- **AC-066-SSOT:** `featuresShipped` and `acCoverage` values in bottom bar sourced from `site-content.json`. `pipelineDepth` is a module-level constant (`PIPELINE_DEPTH = 6`) — not in `site-content.json` because the build script auto-overwrites the `metrics` block; as an architectural constant (not a dynamic metric) a local constant is appropriate.
- **AC-066-TSC:** `npx tsc --noEmit` passes in worktree.
- **AC-066-E2E:** Playwright E2E passes (no regression on `data-testid="where-i-narrative"` and `data-testid="where-i-outcome"`).

## Phase 1 — Engineer

Files changed:
1. `frontend/src/components/about/WhereISteppedInSection.tsx` — add site-content.json import, update narrative, update bottom bar with SSOT-driven values + `PIPELINE_DEPTH` constant

## Tech Debt

None anticipated.
