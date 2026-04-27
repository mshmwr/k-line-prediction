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
| Ticket-derived SSOT (site-content.json + sacred-registry.md) | `content/site-content.json` (hand-edit SSOT), `docs/sacred-registry.md` (generated), `scripts/build-ticket-derived-ssot.mjs` (generator) |

## Ticket-Derived SSOT Pattern (K-052 2026-04-27)

`content/site-content.json` is the single hand-edit source for portfolio metrics, stack[], processRules[], and renderSlots. The generator `scripts/build-ticket-derived-ssot.mjs` reads ticket corpus + README markers and emits:

1. `content/site-content.json` — auto-fills `metrics.*`, `lastUpdated`, `ticketRange`; preserves hand-edited `stack[]`, `processRules[]`, `renderSlots`
2. `docs/sacred-registry.md` — Sacred clause lifecycle registry (active/retired, bodyHash)
3. `README.md` — STACK and NAMED-ARTEFACTS marker blocks (JSON → README direction)

Run after ticket changes: `node scripts/build-ticket-derived-ssot.mjs`. Pre-commit hook auto-checks on staged SSOT files.

## Sacred Reconcile Workflow (K-052 2026-04-27)

Sacred clauses are regression-invariant ACs declared in ticket frontmatter. Three frontmatter fields:

- `sacred-clauses: [AC-ID-1, AC-ID-2]` — lists clause IDs authored in THIS ticket (§8)
- `modifies-sacred: [AC-ID]` — THIS ticket edits an existing clause body (§9 Pass 2)
- `retires-sacred: [AC-ID]` — THIS ticket retires a clause (§9 Pass 4)

**Modify sequence (PM action):**
1. Open new ticket K-NNN with `modifies-sacred: [<clause-id>]` in frontmatter
2. Edit the source ticket's clause body markdown in the same PM session
3. Close K-NNN with `closed-commit: <SHA>`
4. Run `node scripts/build-ticket-derived-ssot.mjs` → registry updates `bodyHash` + `lastModifiedBy`

**Retire sequence (PM action):**
1. Open new ticket K-MMM with `retires-sacred: [<clause-id>]` in frontmatter
2. In the source ticket's clause heading, append `[RETIRED by K-MMM YYYY-MM-DD]` suffix (exact format)
3. Close K-MMM with `closed-commit: <SHA>`
4. Run generator → registry flips entry status to `retired-by: K-MMM`

**Generator exit codes:** 0=ok, 1=drift (regen-fixable), 2=parse error, 3=Sacred lifecycle violation (PM-action-required).

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
