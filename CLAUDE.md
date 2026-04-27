# CLAUDE.md — K-Line Prediction

ETH/USDT K-line pattern similarity prediction system.

## Tech Stack

- **Frontend:** TypeScript / React — after any edit, run `npx tsc --noEmit` to verify no type errors.
- **Backend:** Python (FastAPI) — check indentation carefully; run `python -m py_compile <file>` after edits.
- **Naming convention:** Backend uses `snake_case`, frontend uses `camelCase`. Always verify field name mapping when changes cross the API boundary.

## SSOT Routing (read on demand)

| When you need… | Read |
|---|---|
| System architecture, API endpoints, data flow, field mapping | [ssot/system-overview.md](./ssot/system-overview.md) |
| K-Line conventions (naming, time format, history database, env vars, pre-commit) | [ssot/conventions.md](./ssot/conventions.md) |
| Roles, role flow, worktree isolation, hydration drift, per-role retros | [ssot/workflow.md](./ssot/workflow.md) |
| Deploy steps (Firebase Hosting + Cloud Run, docker dry-run gate) | [ssot/deploy.md](./ssot/deploy.md) |
| Frontend post-edit gate, diary.json sync, new-page checklist | [ssot/frontend-checklist.md](./ssot/frontend-checklist.md) |
| Product requirements, acceptance criteria | [ssot/PRD.md](./ssot/PRD.md) |

## Behavior Triggers (auto-load events)

| Event | Action | Detail |
|---|---|---|
| Open ticket K-XXX | Create worktree `.claude/worktrees/K-XXX-<slug>/` before any Edit on tracked files | [ssot/workflow.md §Worktree Isolation](./ssot/workflow.md#worktree-isolation-mandatory-for-every-ticket-2026-04-23) |
| New worktree about to be added | Run Pre-Worktree Sync Gate (fetch + push probe) | [ssot/workflow.md §Pre-Worktree Sync Gate](./ssot/workflow.md#pre-worktree-sync-gate-mandatory-for-every-new-worktree) |
| Test failure in fresh worktree | Re-run in canonical first; canonical PASS = hydration drift, not regression | [ssot/workflow.md §Hydration Drift Policy](./ssot/workflow.md#worktree-hydration-drift-policy-mandatory-for-qa--engineer-added-k-051-2026-04-26) |
| Edit under `frontend/src/` or `frontend/e2e/` | Run `/playwright` before commit | [ssot/frontend-checklist.md §Frontend Changes](./ssot/frontend-checklist.md#frontend-changes) |
| Commit in K-Line-Prediction session | Sync `frontend/public/diary.json` first | [ssot/frontend-checklist.md §Diary Sync Rule](./ssot/frontend-checklist.md#diary-sync-rule) |
| Implementing new frontend page | Run new-page checklist (PRD AC + Tailwind plugins + Playwright `{ exact: true }`) | [ssot/frontend-checklist.md §Frontend Page Implementation Checklist](./ssot/frontend-checklist.md#frontend-page-implementation-checklist) |
| PR touches `Dockerfile` / `package*.json` / `.gcloudignore` / `.dockerignore` / `frontend/scripts/*.mjs` | Run `docker build -f Dockerfile .` locally before `gh pr create` | [ssot/deploy.md §Step 0](./ssot/deploy.md#deploy-checklist-firebase-hosting--cloud-run) |
| Role finishes task | Prepend entry to `docs/retrospectives/<role>.md` | [ssot/workflow.md §Per-Role Retrospective Logs](./ssot/workflow.md#per-role-retrospective-logs-enabled-from-k-008) |

## Persona Overrides

K-Line-specific persona overrides: [persona-overrides/](./persona-overrides/) (PM project rules in `pm-project.md`).
