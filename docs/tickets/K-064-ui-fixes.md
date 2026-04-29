---
id: K-064
title: UI polish — hero brick-dark → brick + MetricCard min-h removal
status: closed
phase-1-status: closed
created: 2026-04-29
type: fix
priority: low
size: xs
visual-delta: yes
content-delta: no
design-locked: true
qa-early-consultation: N/A — color token swap + layout constraint removal, no edge-case logic
dependencies: []
worktree: .claude/worktrees/K-064-ui-fixes
branch: K-064-ui-fixes
base-commit: 6230f19
closed-commit: ef019bb
---

## Summary

Two small UI fixes shipped together:
1. `HeroSection.tsx` hero second line color: `brick-dark` → `brick` (aligns with K-023 intent: `brick` reserved for home hero accent)
2. `MetricCard.tsx` remove `min-h-[280px]` — eliminates excess whitespace on MetricCard when content is short

## Acceptance Criteria

- **AC-064-HERO:** `HeroSection.tsx` line 2 uses `brick` color token (not `brick-dark`)
- **AC-064-METRIC:** `MetricCard.tsx` `CardShell` className no longer contains `min-h-[280px]`
- **AC-064-REGRESSION:** All pre-existing Playwright green tests remain green
