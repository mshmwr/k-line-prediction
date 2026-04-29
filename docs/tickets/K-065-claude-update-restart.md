---
id: K-065
title: Claude Code update to v2.1.121 + session restart
status: closed
phase-1-status: closed
created: 2026-04-29
closed: 2026-04-29
type: ops
priority: medium
size: small
visual-delta: no
content-delta: no
design-locked: N/A
qa-early-consultation: N/A — ops/infra only, no runtime UI path
dependencies: []
worktree: .claude/worktrees/K-065-claude-update-restart
branch: K-065-claude-update-restart
base-commit: ecec2b7
closed-commit: ac53a65
---

## Summary

Update Claude Code CLI to v2.1.121 to pick up critical bug fixes (Bash CWD crash, memory leaks, worktree isolation fix) and restart the Claude Code session so the new binary takes effect.

## Motivation

v2.1.121 fixes three issues that directly affect our workflow:
1. **Bash tool permanent failure** when the directory Claude was started in is deleted mid-session (triggered by `git worktree remove`)
2. **Multi-GB memory growth** when processing many images (Playwright screenshots, Pencil screenshots)
3. **Agent `isolation: "worktree"` reusing stale worktrees** from prior sessions

Additionally, default effort level for Sonnet 4.6 / Opus 4.6 upgraded from `medium` to `high` (v2.1.117) — applied automatically post-update.

## Acceptance Criteria

- **AC-065-VERSION:** `claude --version` outputs `2.1.121` or higher
- **AC-065-SESSION:** Claude Code session restarted after update (new binary loaded)
- **AC-065-VERIFY:** First Bash tool call in new session succeeds in a worktree-based CWD

## Phase 1 — Execution (ops)

Steps (run by user or Engineer):

```bash
# 1. Update
claude update

# 2. Verify version
claude --version

# 3. Restart: exit current session, reopen Claude Code
```

No file changes expected. Ticket closes when AC-065-VERSION passes.

## Deploy Record

| Field | Value |
|-------|-------|
| Updated at | 2026-04-29 |
| New version | 2.1.123 (exceeds 2.1.121 target) |
| Verified by | `claude --version` → `2.1.123 (Claude Code)` |

## Follow-up Tasks (post-close handoff)

Identified during K-065 session. Ordered by priority.

### Task 1 — Run `/terminal-setup` (low, ~30s, no ticket needed)

One-shot command, no commit required. Run at start of next session.

### Task 2 — Canonical dirty K-Line files cleanup (medium, needs investigation → K-066)

`git -C /Users/yclee/Diary status --short` shows tracked files long-dirty in canonical checkout:

- `ClaudeCodeProject/K-Line-Prediction/README.md`
- `ClaudeCodeProject/K-Line-Prediction/content/site-content.json`
- `ClaudeCodeProject/K-Line-Prediction/docs/retrospectives/engineer.md`
- `ClaudeCodeProject/K-Line-Prediction/frontend/public/diary.json`
- `ClaudeCodeProject/K-Line-Prediction/scripts/build-ticket-derived-ssot.mjs`
- `ClaudeCodeProject/K-Line-Prediction/ssot/system-overview.md`
- `ClaudeCodeProject/K-Line-Prediction/ssot/workflow.md`
- `claude-config/agents/designer.md` (and other agent files)

**Investigation steps:**
1. Confirm inner K-Line canonical state: `git -C /Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction status --short`
2. For each dirty file run `git -C /Users/yclee/Diary diff <file>` and classify as:
   - **(a)** Already merged in inner K-Line PR but not mirrored to outer → open outer mirror PR
   - **(b)** Uncommitted legitimate local change → open docs-only PR and commit
   - **(c)** Accidental edit → `git restore`
3. After triage, `git status` should show no ` M` lines

**Note:** All file edits must be in a worktree, not directly on `main`.

### Task 3 — PostToolUse hook `duration_ms` logging (optional, no ticket yet)

v2.1.119+ exposes `duration_ms` in PostToolUse hook input. If desired: modify `~/.claude/settings.json` PostToolUse command hook to append `duration_ms` to a log after each `tsc`/`py_compile` run. Nice-to-have, not urgent.
