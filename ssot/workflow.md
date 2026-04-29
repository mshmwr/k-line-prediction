---
title: K-Line Prediction — Development Workflow
type: ruleset
tags: [K-Line-Prediction, Workflow, Worktree, Roles]
updated: 2026-04-27
---

## Summary

Roles, role flow, worktree isolation, hydration drift policy, per-role retrospective logs.

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

---

## Worktree Isolation (mandatory for every ticket, 2026-04-23)

Every ticket (K-XXX) must be worked in its own worktree under `.claude/worktrees/K-XXX-<slug>/` — main branch never receives WIP commits (code or docs).

- **Creation gate:** PM creates worktree at ticket open, before first Architect release. See `~/.claude/agents/pm.md` §Session Handoff Verification §Worktree isolation pre-flight for the full checklist.
- **Naming:** `.claude/worktrees/K-XXX-<kebab-slug>` + branch `K-XXX-<kebab-slug>` (slug = ticket title, lowercase kebab-case, ≤4 words).
- **Scope:** all roles (Architect / Engineer / Designer / Reviewer / QA) operate inside the worktree absolute path; ticket docs, PRD edits, retrospectives, diary.json updates — all through worktree.
- **Docs-only tickets:** still require worktree. PRD / dashboard / retro edits are WIP until the ticket closes.
- **Merge-back:** `/commit-diary` Step 8 auto-rebases onto latest main + FF-merges after ticket close. Do not manually commit to main during ticket work.
- **Violation marker:** `git status` on main repo root showing ticket-scoped modified files = worktree gate bypass; PM must halt, migrate changes into worktree, reset main before continuing.
- **Main direct-commit exception (meta edits only):** retrospective-driven rule / memory / persona edits to `CLAUDE.md`, `~/.claude/agents/*.md`, or `~/.claude/projects/*/memory/*.md` may commit directly to main without a ticket worktree. Pre-flight gate: run `git worktree list` before the edit — if any active K-XXX worktree exists, check whether the edit could affect that ticket's in-flight work; affected → defer until ticket closes or route through a separate worktree; not affected → direct commit OK. Applies to meta edits only; ticket code/docs still follow the rule above.

---

## Pre-Worktree Sync Gate (mandatory for every new worktree)

Before `git worktree add` for any new ticket:

1. `git fetch origin main`
2. `git push origin main` — probe for divergence / protection issues
3. If push fails → `git branch backup/main-before-<ticket>-<timestamp> main && git pull --rebase origin main && git push origin main` (resolve simple conflicts in place; halt for complex)
4. Only after local main == remote main: `git worktree add .claude/worktrees/K-XXX-<slug> -b K-XXX-<slug> main`

---

## Worktree Hydration Drift Policy (mandatory for QA / Engineer, added K-051 2026-04-26)

Fresh worktree checkouts can be missing native binaries (`node_modules/@rollup/<platform>`) or untracked runtime fixtures that exist in canonical. **Re-run in canonical before classifying any test failure as regression** — hydration drift is not a bug.

**Hydration drift symptoms (NOT regressions):**

- Playwright webServer crash citing `Cannot find module '@rollup/rollup-<darwin-arm64|linux-x64-gnu|linux-x64-musl>'`
- Backend pytest fail with `FileNotFoundError` on a fixture path that exists in canonical (e.g. `frontend/public/examples/ETHUSDT_1h_test.csv`)
- TypeScript can't resolve `@types/*` for an installed package
- Native binary mismatch across `darwin-arm64` vs `linux-x64-musl` checkouts

**Protocol when worktree shows env-class failure:**

1. `cd ClaudeCodeProject/K-Line-Prediction/` (canonical, not worktree)
2. Run the same failing command
3. **Canonical FAIL** → genuine regression, file to PM
4. **Canonical PASS** → worktree hydration drift; hydrate worktree (`npm install` for native binaries, `git checkout origin/main -- <fixture>` for untracked files) and retry — do NOT file as bug

**Why:** K-051 worktree QA burned ~2 turns on `rollup-linux-x64-gnu` missing + `ETHUSDT_1h_test.csv` missing — both canonical-clean. Hydration drift ≠ regression; classifying it as one wastes triage cycles. See `docs/retrospectives/qa.md` 2026-04-26 K-051 entry. Persona detail: `~/.claude/agents/qa.md` §Worktree Hydration Drift Handling.

---

## Per-Role Retrospective Logs (enabled from K-008)

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
**Slowest step:** (one sentence: which step took longest + how to avoid next time)
```

- Rule: coexists with per-ticket `docs/tickets/K-XXX.md` `## Retrospective` section — not a replacement (per-ticket = current event; per-role log = cross-ticket cumulative learning)
- K-001~007 not backfilled (mechanism didn't exist yet)

### Retrospective Entry Brevity (hard cap, 2026-04-27)

Per-role retrospective logs were drifting to 1000+ lines (QA 1721, PM 1447 as of 2026-04-27) because entries were dumping full episodic context — truth-tables, grep output, multi-paragraph reasoning — instead of extracting durable lessons. Apply the following hard caps:

**Per-entry caps:**
- **≤ 30 lines per entry** (including title + blank lines). Long episodic context goes into the PR conversation or commit SHA reference, not the retro log.
- **One sentence per field.** `What went well` / `What went wrong` / `Next time improvement` / `Slowest step` each take one sentence stating event + decision/result.
- **No verbatim dumps:** truth-tables, grep / ls / Read output, design-doc excerpts, multi-paragraph BQ reasoning are forbidden in retro entries. Reference by PR number, commit SHA, or design-doc anchor instead.
- **Empty `What went well` is acceptable** when no specific event supports it — omit the line entirely; do not fabricate to fill format (per `feedback_retrospective_honesty.md`).

**Codify-and-retire (same-commit gate):**
- When a `Next time improvement` is codified into persona / `~/.claude/CLAUDE.md` / memory file, the retro entry must be rewritten in the same commit as a one-line stub:
  `## YYYY-MM-DD — <ticket> — <one-line root cause> — codified into <persona.md#anchor>`
- Stub-rewrite is mandatory; leaving the verbose entry alongside the codified rule is a recurring violation pattern (per Promote-and-retire rule in `~/.claude/CLAUDE.md` §Memory Maintenance).

**Reviewer enforcement:**
- Reviewer rejects any retro entry exceeding 30 lines or containing forbidden dumps. Author must restructure before merge.
- Reviewer also rejects entries that codified a rule into persona/memory without stub-rewriting the corresponding retro entry in the same PR.

**Rationale:** extraction-style entries match industry best practice (mem0 ~14x token reduction; JetBrains 2025-12 observation-masking research showing summaries cause +15% trajectory elongation). Verbose retro entries hide the actionable signal and inflate context-load cost on every `/retrospect` run.
