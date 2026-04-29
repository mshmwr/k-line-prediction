---
id: K-063
title: Retro format — add mandatory Slowest step field to all role retrospective entries
status: closed
phase-1-status: closed
created: 2026-04-29
type: ops
priority: low
size: small
visual-delta: no
content-delta: no
design-locked: N/A
qa-early-consultation: N/A — docs/config-only, no runtime UI path
dependencies: [K-062]
worktree: .claude/worktrees/K-063-retro-slowest-step
branch: K-063-retro-slowest-step
base-commit: 0bca714
---

## Summary

Codify the **Slowest step** field (first used in K-062 engineer retro) as a mandatory 4th field in all per-role retrospective entries. Update `ssot/workflow.md` canonical format and `~/.claude/agents/*.md` persona retro sections.

## Acceptance Criteria

- **AC-063-WORKFLOW:** `ssot/workflow.md` entry format includes `**Slowest step:**` as 4th mandatory field with one-sentence cap
- **AC-063-ENGINEER:** `~/.claude/agents/engineer.md` retro format block updated to include Slowest step
- **AC-063-OTHER-ROLES:** All other role persona files that define retro entry format updated (pm, senior-architect, reviewer, qa, designer)

## Phases

### Phase 1 — Implementation (docs-only)
Files: `ssot/workflow.md`, `~/.claude/agents/engineer.md` (and other role files)
