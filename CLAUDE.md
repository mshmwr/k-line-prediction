# CLAUDE.md — K-Line Prediction

ETH/USDT K-line pattern similarity prediction system.

**System architecture, API endpoints, data flow, field mapping:** [agent-context/architecture.md](./agent-context/architecture.md)
**K-Line conventions (naming, pre-commit, time format, history database):** [agent-context/conventions.md](./agent-context/conventions.md)

---

## Development Roles & Flow

**Flow order:**
```
PM (define req) → Architect (design) → Engineer (implement) → Code Reviewer (review) → QA (regression) → PM (next Phase)
```

### PM
- Write PRD, define AC (Given/When/Then/And)
- Release condition: all Phase ACs + blocking questions cleared before releasing Engineer

### Architect
- Design system architecture for all Phases
- Must cover: backend + frontend routes + component tree + props interface
- Cannot plan only the next Phase

### Engineer
- Confirm on latest main before implementation
- Implement one stable unit at a time, verify each step before continuing

### Code Reviewer
- Invoke after each major milestone
- Review findings must be written back to plan doc / PRD

### QA
- Execute after Code Review passes
- Regression: run full Playwright E2E suite, confirm new features didn't break existing
- All tests pass before releasing to PM

### Worktree Isolation (mandatory for every ticket, 2026-04-23)

Every ticket (K-XXX) must be worked in its own worktree under `.claude/worktrees/K-XXX-<slug>/` — main branch never receives WIP commits (code or docs).

- **Creation gate:** PM creates worktree at ticket open, before first Architect release. See `~/.claude/agents/pm.md` §Session Handoff Verification §Worktree isolation pre-flight for the full checklist.
- **Naming:** `.claude/worktrees/K-XXX-<kebab-slug>` + branch `K-XXX-<kebab-slug>` (slug = ticket title, lowercase kebab-case, ≤4 words).
- **Scope:** all roles (Architect / Engineer / Designer / Reviewer / QA) operate inside the worktree absolute path; ticket docs, PRD edits, retrospectives, diary.json updates — all through worktree.
- **Docs-only tickets:** still require worktree. PRD / dashboard / retro edits are WIP until the ticket closes.
- **Merge-back:** `/commit-diary` Step 8 auto-rebases onto latest main + FF-merges after ticket close. Do not manually commit to main during ticket work.
- **Violation marker:** `git status` on main repo root showing ticket-scoped modified files = worktree gate bypass; PM must halt, migrate changes into worktree, reset main before continuing.
- **Main direct-commit exception (meta edits only):** retrospective-driven rule / memory / persona edits to `CLAUDE.md`, `~/.claude/agents/*.md`, or `~/.claude/projects/*/memory/*.md` may commit directly to main without a ticket worktree. Pre-flight gate: run `git worktree list` before the edit — if any active K-XXX worktree exists, check whether the edit could affect that ticket's in-flight work; affected → defer until ticket closes or route through a separate worktree; not affected → direct commit OK. Applies to meta edits only; ticket code/docs still follow the rule above.

### Pre-Worktree Sync Gate (mandatory for every new worktree)

Before `git worktree add` for any new ticket:

1. `git fetch origin main`
2. `git push origin main` — probe for divergence / protection issues
3. If push fails → `git branch backup/main-before-<ticket>-<timestamp> main && git pull --rebase origin main && git push origin main` (resolve simple conflicts in place; halt for complex)
4. Only after local main == remote main: `git worktree add .claude/worktrees/K-XXX-<slug> -b K-XXX-<slug> main`

### Per-Role Retrospective Logs (enabled from K-008)

Each role agent must **prepend** one entry (newest first) to `docs/retrospectives/<role>.md` before declaring task complete:

| Role | Log file |
|------|----------|
| PM | `docs/retrospectives/pm.md` |
| Architect | `docs/retrospectives/architect.md` |
| Engineer | `docs/retrospectives/engineer.md` |
| Reviewer | `docs/retrospectives/reviewer.md` |
| QA | `docs/retrospectives/qa.md` |
| Designer | `docs/retrospectives/designer.md` |

Entry format:

```
## YYYY-MM-DD — <Ticket ID or Phase name>

**What went well:** (specific event; omit if none — do not fabricate)
**What went wrong:** (root cause)
**Next time improvement:** (specific action)
```

- Rule: coexists with per-ticket `docs/tickets/K-XXX.md` `## Retrospective` section — not a replacement (per-ticket = current event; per-role log = cross-ticket cumulative learning)
- K-001~007 not backfilled (mechanism didn't exist yet)

---

## Tech Stack

- **Frontend:** TypeScript / React — after any edit, run `npx tsc --noEmit` to verify no type errors.
- **Backend:** Python (FastAPI) — check indentation carefully; run `python -m py_compile <file>` after edits.
- **Naming convention:** Backend uses `snake_case`, frontend uses `camelCase`. Always verify field name mapping when changes cross the API boundary.

## Debugging Guidelines

- Pay special attention to `snake_case` ↔ `camelCase` mismatches between backend and frontend.

### When to Use a Sub-Agent for Tracing

Also spawn a sub-agent when:

- The bug involves data passing through the Python backend → API → TypeScript frontend chain
- The symptom is visible in the UI but the cause could be in backend logic, API serialization, frontend parsing, or rendering

### Parallel Agents for Cross-Layer Changes

When a change spans both the Python backend and TypeScript frontend:
1. First define the exact API contract (field names, types) in writing
2. Spawn one sub-agent for backend changes, one for frontend changes — both implement against the contract
3. After both complete, run the full integration test suite
4. If any test fails, identify which side broke the contract and fix it

## Frontend Changes

After **any** edit to files under `frontend/src/` or `frontend/e2e/`:
1. Run `/playwright` to execute E2E tests and verify no UI regression
2. Only proceed to commit after Playwright passes

## Diary Sync Rule

`frontend/public/diary.json` is the data source for the frontend Dev Diary page.
**Before every commit in a K-Line-Prediction work session, diary.json must be synced.**

Format:
```json
{ "milestone": "Phase X — Feature Name", "items": [{ "date": "YYYY-MM-DD", "text": "One sentence in English." }] }
```

**Language rule: `milestone` name and every `text` entry must be in English.**

Update steps:
1. Append a new item to the corresponding milestone's `items` array, or add a new milestone object
2. After update, run `/playwright` to confirm DiaryPage E2E passes

## Deploy Checklist (Firebase Hosting + Cloud Run)

Must run before deploy:

1. **Verify main is synced with all ticket branches** — main must contain every deployed-but-unmerged ticket before any new deploy:
   ```bash
   git branch --no-merged main | grep -E "^\s*K-[0-9]+" || echo "OK: all ticket branches merged"
   ```
   Any K-XXX branch listed → rebase onto main then FF-merge into main first:
   ```bash
   git checkout <K-XXX-branch> && git rebase main
   git checkout main && git merge --ff-only <K-XXX-branch>
   ```
   Plain `git merge --ff-only` without the rebase step fails when main has advanced since the branch point (multi-ticket interleave is the common case). Deploy from main without this gate can overwrite a previously-deployed ticket's bundle (incident: K-041 self-overwrite 2026-04-24).
2. **Scan all relative API paths** — confirm all HTTP clients (`fetch`, `axios`, etc.) use `API_BASE` prefix:
   ```bash
   grep -r "'/api/" src/
   grep -r '"/api/' src/
   ```
   Any bare relative path → fix before build
3. **build** — `npm run build` (in `frontend/` directory)
4. **deploy** — `firebase deploy --only hosting` (in project root)

## Frontend Page Implementation Checklist

Before implementing a new page, must:

1. **Read PRD AC** — `grep "AC-PAGENAME" PRD.md`, list all Then/And clauses
2. **Verify Tailwind plugins** — if planning to use `prose-*` or other plugin classes, verify installation first:
   ```bash
   npm ls @tailwindcss/typography
   grep -n "typography" tailwind.config.js
   ```
   Not installed → install before continuing
3. **Playwright assertions** — section label and short-text assertions must use `{ exact: true }` to prevent description text false matches
4. **After implementation** — E2E assertions must cover all And conditions
