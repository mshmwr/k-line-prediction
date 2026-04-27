---
id: K-056
title: SSOT Reorganization (inner + outer CLAUDE.md slim, ssot/ scaffold)
status: in-progress
type: meta
opened: 2026-04-26
closed: pending
qa-early-consultation: N/A (docs-only meta ticket, no runtime behavior)
---

# K-056 — SSOT Reorganization

Decision-archive ticket. No PM→Architect→Engineer flow. No AC. No design doc. Pure record of restructure decisions, PR sequence, and verification framework.

## Context

ETH/USDT K-line prediction monorepo (outer `ClaudeCodeProject/` + inner `K-Line-Prediction/`) accumulated 6 months of organic doc growth. Current state has multiple problems:

1. **Heavy duplication** between outer + inner CLAUDE.md (Tech Stack, Debugging Guidelines, Frontend Changes — near-identical 67/200 lines).
2. **No clear SSOT boundary** — `agent-context/` mixes agent behavior rules with descriptive system docs (architecture.md is descriptive SSOT, pm-project.md is persona override).
3. **Dead files** — AGENTS.md (Codex unused since 2026-04-09), Mermaid.md (orphaned scaffold), TradingView/ (dormant subproject 2026-04-09).
4. **docs/ subdirectory drift** — docs/architecture/ (2 files), docs/superpowers/ (plans + specs, 9 files), docs/designs/ (32 files) — three locations for design-class docs.
5. **CLAUDE.md > 200 line risk** — inner is at 200 lines, official docs warn rule-following degrades past this.

Goal: separate **auto-load behavior rules** (CLAUDE.md, ≤30 lines) from **on-demand SSOT** (`ssot/`, queried when role has doubt). Establish three-layer leak prevention so agents reliably reach SSOT content even when not auto-loaded.

## Decisions

### D1 — Auto-load vs on-demand split

- **CLAUDE.md (auto-load)**: project description + Tech Stack (3 lines) + SSOT Routing table + Behavior Triggers table + persona-overrides pointer.
- **ssot/ (on-demand)**: full content of system-overview / conventions / workflow / deploy / frontend-checklist / PRD.
- **Three-layer leak prevention**:
  1. CLAUDE.md Routing table uses **specific trigger words** (not abstract "conventions").
  2. CLAUDE.md Behavior Triggers table = active triggers (event → action → detail link).
  3. `~/.claude/agents/*.md` persona files add `Before X → Read ssot/Y` instructions.

### D2 — Inner CLAUDE.md slim (200 → ~30 lines)

- **Keep**: project 1-line description, Tech Stack 3 lines, SSOT Routing table, Behavior Triggers table, persona-overrides pointer.
- **Move to ssot/**:
  - `## Development Roles & Flow` + `### Worktree Isolation` + `### Pre-Worktree Sync Gate` + `### Worktree Hydration Drift Policy` + `### Per-Role Retrospective Logs` → `ssot/workflow.md` (type: ruleset).
  - `## Deploy Checklist` (Steps 0–4) → `ssot/deploy.md` (type: ruleset).
  - `## Frontend Changes` + `## Diary Sync Rule` + `## Frontend Page Implementation Checklist` → `ssot/frontend-checklist.md` (type: ruleset).
- **Delete**: `## Debugging Guidelines` (18 lines) — global CLAUDE.md already has cross-layer trigger; 4-step parallel-agent protocol moves to outer `ssot/conventions.md`.

### D3 — Outer CLAUDE.md slim (67 → ~10 lines)

- **Keep**: monorepo description, subproject list, SSOT Routing table.
- **Move to outer ssot/**:
  - `## BDD Workflow` + `## Tech Stack` + `## Debugging Guidelines` + `## Frontend Changes` + `## Test Data Realism` + `## Git Workflow` → `ssot/conventions.md` (type: ruleset).
  - Existing `agent-context/architecture.md` → `ssot/monorepo-overview.md` (type: reference).
- **Delete**: outer `agent-context/` directory (after move).

### D4 — Inner agent-context/ rename

- `agent-context/` → `persona-overrides/` (only `pm-project.md` remains after architecture.md + conventions.md move out).

### D5 — docs/ consolidation

- `docs/architecture/` (K-037, K-049 architect briefs) → `docs/designs/` (rename in place).
- `docs/superpowers/plans/` + `docs/superpowers/specs/` → `docs/designs/` (merge).
- Delete `docs/architecture/` and `docs/superpowers/` empty directories after move.

### D6 — Pure deletions

- `ClaudeCodeProject/AGENTS.md` (Codex unused).
- `K-Line-Prediction/AGENTS.md` (Codex unused).
- `K-Line-Prediction/Mermaid.md` (orphaned scaffold, last edit 2026-03-31).
- `ClaudeCodeProject/TradingView/` (20MB dormant subproject).
- `PM-dashboard.md` line 101 `| TV- | TradingView |` row.
- `agent-context/architecture.md` TradingView mentions (lines 21, 37, 62, 98, 109, 111, 117 — to remove during file move).

### D7 — File moves with frontmatter

- `K-Line-Prediction/PRD.md` → `K-Line-Prediction/ssot/PRD.md` (add frontmatter `type: spec`).
- `K-Line-Prediction/agent-context/architecture.md` → `K-Line-Prediction/ssot/system-overview.md` (frontmatter `type: reference`, strip TradingView lines).
- `K-Line-Prediction/agent-context/conventions.md` → `K-Line-Prediction/ssot/conventions.md` (frontmatter `type: ruleset`).
- `ClaudeCodeProject/agent-context/architecture.md` → `ClaudeCodeProject/ssot/monorepo-overview.md` (frontmatter `type: reference`).
- `ClaudeCodeProject/agent-context/conventions.md` → `ClaudeCodeProject/ssot/conventions.md` (frontmatter `type: ruleset`, merge with new content extracted from outer CLAUDE.md).

## PR Plan

### Pre-flight blockers

- **B1 — Mirror gap (USER HANDLING SEPARATELY)**: Inner repo dirty 112 files; outer HEAD ahead of inner HEAD on K-Line files (e.g. inner CLAUDE.md = 353b552, outer's view = e6e3b05). User explicitly opted to resolve in another session. PR A must wait for inner repo sync confirmation before kickoff. Pre-flight check at PR A start: `git -C K-Line-Prediction status --short | wc -l` must be 0.

- **B2 — Existing worktree audit (completed 2026-04-26)**:
  - **K-052-content-ssot** — open PR #14. K-052 is **runtime SSOT** for site-content (component data) + sacred-registry (file paths) dual-emission. Our `ssot/` folder is **doc-class SSOT**. Names sound similar but scope is disjoint. K-052 PR can merge independently — **no conflict**. Mitigation: lowercase `ssot/` (folder) vs uppercase "SSOT" (concept) consistently.
  - **docs-2026-04-26-ux-tickets** — opened K-052/K-053/K-054 tickets, no open PR. Different branch slug → **no conflict**.
  - **K-054-readme-cleanup** — `git worktree list` lists it but directory missing. Stale reference. Recommend `git worktree prune` (housekeeping, not blocker).
  - **Conclusion**: zero blocking conflicts.

### PR sequence

| PR | Slug | Scope | File class | Test gate |
|----|----|----|----|----|
| **A** | `K-056-purge-dead-files` | D6 deletions + create this ticket file | docs-only | none |
| **B** | `K-056-consolidate-docs-subdirs` | D5 docs/ consolidation | docs-only | none |
| **C** | `K-056-inner-ssot-scaffold` | D2 + D4 + D7 inner moves; CLAUDE.md slim; persona file ref updates | docs-only | none |
| **D** | `K-056-outer-ssot-scaffold` | D3 + D7 outer moves; outer CLAUDE.md slim | docs-only | none |

Rationale:
- A first: deletions independent + reversible-by-revert; clears scope before structural work.
- B second: docs/ purely organizational, no cross-ref updates.
- C third: inner scaffold self-contained; persona refs updated atomically with file moves.
- D last: outer scaffold depends on outer ssot/conventions.md content extracted from outer CLAUDE.md (which references inner's BDD examples — easier after C lands).

## Critical Files

- `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/CLAUDE.md` (200 → ~30 lines after PR C)
- `/Users/yclee/Diary/ClaudeCodeProject/CLAUDE.md` (67 → ~10 lines after PR D)
- `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/agent-context/` → rename to `persona-overrides/`
- `/Users/yclee/Diary/ClaudeCodeProject/agent-context/` → delete (after move)
- New: `K-Line-Prediction/ssot/{system-overview,conventions,workflow,deploy,frontend-checklist,PRD}.md`
- New: `ClaudeCodeProject/ssot/{monorepo-overview,conventions}.md`

## Persona File Cross-References to Update (PR C)

These reference old paths and need atomic update:

- `~/.claude/agents/pm.md` — references `CLAUDE.md §Worktree Isolation`, `CLAUDE.md §Deploy Checklist`.
- `~/.claude/agents/senior-architect.md` — references `agent-context/architecture.md`, `PRD.md`.
- `~/.claude/agents/engineer.md` — references `CLAUDE.md §Frontend Page Implementation Checklist`.
- `~/.claude/agents/reviewer.md` — references `agent-context/architecture.md`.
- `~/.claude/agents/qa.md` — references `CLAUDE.md §Worktree Hydration Drift`.
- `~/.claude/agents/designer.md` — references `agent-context/architecture.md` (design system section).
- Existing memory files in `~/.claude/projects/-Users-yclee-Diary/memory/` — grep for `agent-context/` and `K-Line-Prediction/CLAUDE.md §` paths.

## Three-Layer Leak Prevention (PR C + D)

Each persona file gains a "Read SSOT before task" section:

- **PM**: `Before AC release → Read K-Line-Prediction/ssot/PRD.md + ssot/workflow.md §Phase Gate`.
- **Architect**: `Before design → Read ssot/system-overview.md + ssot/PRD.md`.
- **Engineer**: `Before implementation → Read ssot/system-overview.md (architecture + API contract); if BE+FE → Read outer ssot/conventions.md §Cross-Layer`.
- **QA**: `Before test → Read ssot/PRD.md (AC); on env failure → Read ssot/workflow.md §Hydration Drift`.
- **Reviewer**: `Before review → Read ssot/PRD.md (AC) + design doc in docs/designs/`.
- **Designer**: `Before design → Read ssot/system-overview.md §Design System`.

## Verification — Three-Layer Behavior Parity Framework

Goal: prove these 4 PRs do not change agent runtime behavior (only relocate where rules live). Every PR is gated by this framework — failures halt the chain.

### Layer 1 — Pre-PR Baseline (run before PR A kickoff)

**1a. Rule Inventory Table** (file: `docs/tickets/K-056-rule-inventory.md`, created in PR A alongside ticket file)

Walk every line of inner CLAUDE.md (200 lines) + outer CLAUDE.md (67 lines). For each rule, record destination:

| Source line range | Rule | Destination | Reason |
|----|----|----|----|
| inner L10–37 | `## Development Roles & Flow` (PM/Architect/Engineer/...) | `ssot/workflow.md §Roles` | move (on-demand SSOT) |
| inner L39–49 | `### Worktree Isolation` | `ssot/workflow.md §Worktree Isolation` + CLAUDE.md trigger 1 line | split |
| inner L60–78 | `### Worktree Hydration Drift Policy` | `ssot/workflow.md §Hydration Drift` | move |
| inner L108–112 | `## Tech Stack` (3 lines) | inner CLAUDE.md (kept inline) | keep |
| inner L114–131 | `## Debugging Guidelines` (cross-layer / parallel agents) | DELETE inner; 4-step protocol → outer `ssot/conventions.md §Cross-Layer`; trigger 1 line in CLAUDE.md | split |
| outer L11–19 | `## BDD Workflow` (3 steps) | outer `ssot/conventions.md §BDD` | move |
| ... | ... | ... | ... |

Every line gets a destination. Zero rows allowed with "??" or unspecified destination. This table is the contract — any divergence during PR C/D is a bug.

**1b. Six-Scenario Behavior Probe** (file: `docs/tickets/K-056-baseline-probe.md`)

Spawn fresh agent (no prior session context) per scenario. Record exact actions in order: which files Read, which rules referenced, which decisions made.

| # | Scenario | Spawn agent | Probe prompt |
|---|----|----|----|
| 1 | BE+FE cross-layer feature | engineer | "我要實作 /api/foo endpoint 回 {bar: int}，前端 K-LineDetail 頁顯示。怎麼開工？" |
| 2 | Worktree env failure | qa | "我在 worktree 跑 Playwright，webServer crash 報 `Cannot find module '@rollup/rollup-linux-x64-musl'`，怎麼判斷是不是 regression？" |
| 3 | Task complete retro | pm | "Architect K-001 phase 1 task 完成，準備宣告 done，要做什麼？" |
| 4 | Cloud Run deploy | engineer | "Frontend 改動完，main 已 merge，要 deploy Cloud Run，怎麼開始？" |
| 5 | Frontend edit | engineer | "我剛改完 frontend/src/pages/Diary.tsx，準備 commit。" |
| 6 | Pre-commit | engineer | "我要 commit 一批 backend 改動，commit 訊息怎麼寫？" |

Record fields: `read_files[]`, `rules_cited[]`, `actions[]`, `verdict`. Save as canonical baseline.

### Layer 2 — Per-PR Entry Gate

**PR A (deletions)**:
- `grep -r "AGENTS\.md\|Mermaid\.md\|TradingView" /Users/yclee/Diary/ClaudeCodeProject` → 0 hits (except this ticket / retro historical entries).
- Risk: low (file-existence check only).

**PR B (docs/ consolidation)**:
- File count parity: `find docs/architecture docs/superpowers -name '*.md' | wc -l` (before) == `find docs/designs -name '*.md' | wc -l` (delta after).
- `grep -r "docs/architecture/\|docs/superpowers/" .` → 0 hits.

**PR C (inner scaffold) — HIGHEST RISK**:
1. **CLAUDE.md diff line-by-line**: every removed line must map to a Rule Inventory Table row (Layer 1a) with a destination. No silent drops.
2. **Persona Read directive presence**: `grep "Read.*ssot/" ~/.claude/agents/{pm,senior-architect,engineer,reviewer,qa,designer}.md` → ≥1 hit per file (6 files total).
3. **Behavior parity probe re-run**: scenarios #1–#3 + #5–#6 (skip #4 deploy — that's outer-scope). Diff against Layer 1b baseline.
   - Diff explained as "rules now Read from `ssot/` instead of inline CLAUDE.md" → ✅ expected.
   - Diff = rule disappeared / behavior changed → ❌ real regression, halt PR C, debug.

**PR D (outer scaffold)**:
- Same as PR C `(1)(2)(3)` but scope = outer CLAUDE.md + outer ssot/.
- Behavior probe re-run scenarios #1 (cross-layer) + #4 (deploy).

### Layer 3 — Post-PR-D Final Regression

After all 4 PRs merged into main (both inner + outer repos):

1. **All 6 scenarios re-run** against final state. Diff against Layer 1b baseline.
2. **Any divergence categorized**:
   - Expected (rule moved, behavior identical) → mark ✅.
   - Unexpected (rule effectively lost, behavior changed) → ❌ open follow-up fix PR (e.g. PR E `K-056-behavior-fix-X`).
3. **Reference integrity sweep**:
   - `grep -r "agent-context/" /Users/yclee/Diary` → 0 hits (except retro historical).
   - `grep -r "K-Line-Prediction/PRD\.md\b" .` (excluding `ssot/PRD.md`) → 0 hits.
   - `grep -r "TradingView" .` → 0 hits.
4. **Frontmatter sanity**: every `ssot/*.md` file has `type:` frontmatter.
5. **Line count check**: `wc -l K-Line-Prediction/CLAUDE.md` ≤30, `wc -l ClaudeCodeProject/CLAUDE.md` ≤10.

### Retrospective entries (separate from gate)

- `docs/retrospectives/global.md` — one entry per PR (A/B/C/D) with what-went-well + lessons.
- `daily-diary.md` — 2026-04-26 entry summarizes the SSOT reorg session.
- This ticket Retrospective section — final decisions + any deviations from plan.

## Out of Scope (deferred)

- K-052-content-ssot ticket (separate work, will reconcile after audit in B2).
- Migration of existing `docs/retrospectives/*.md` cross-references (one-shot grep+update during PR C).
- Renaming convention files inside ssot/ if better names emerge (cosmetic, can wait).
- New subproject SSOT (when added) follows the established `ssot/` + frontmatter pattern.

## Layer 1a — Rule Inventory Table (inner CLAUDE.md, PR C gate)

Every line of inner CLAUDE.md (198 lines pre-PR-C) gets a destination. Zero rows allowed with "??" / unspecified. This table is the contract — divergence during PR C = bug.

| Source line range (inner CLAUDE.md) | Rule | Destination | Reason |
|----|----|----|----|
| L1, L3 | Title + project description | inner CLAUDE.md (kept inline) | KEEP — slim header |
| L5–L6 | Pointers to `agent-context/architecture.md` + `agent-context/conventions.md` | inner CLAUDE.md SSOT Routing table (rewritten) | REPLACE — table replaces flat pointer list |
| L10–L37 | `## Development Roles & Flow` (PM / Architect / Engineer / Reviewer / QA blocks) | `ssot/workflow.md §Development Roles & Flow` | MOVE — on-demand SSOT |
| L39–L49 | `### Worktree Isolation` | `ssot/workflow.md §Worktree Isolation` + CLAUDE.md Behavior Trigger row | SPLIT — trigger row in CLAUDE.md, detail in ssot |
| L51–L58 | `### Pre-Worktree Sync Gate` | `ssot/workflow.md §Pre-Worktree Sync Gate` + CLAUDE.md Behavior Trigger row | SPLIT |
| L60–L78 | `### Worktree Hydration Drift Policy` | `ssot/workflow.md §Worktree Hydration Drift Policy` + CLAUDE.md Behavior Trigger row | SPLIT |
| L80–L105 | `### Per-Role Retrospective Logs` | `ssot/workflow.md §Per-Role Retrospective Logs` + CLAUDE.md Behavior Trigger row | SPLIT |
| L108–L112 | `## Tech Stack` (3 bullets) | inner CLAUDE.md (kept inline) | KEEP — frequent reference + cheap |
| L114–L131 | `## Debugging Guidelines` (cross-layer + sub-agent + parallel-agents protocol) | DELETE inner; 4-step parallel-agent protocol → outer `ssot/conventions.md §Cross-Layer` (PR D scope) | DELETE-INNER — global CLAUDE.md already covers cross-layer trigger; outer ssot owns the 4-step protocol |
| L133–L137 | `## Frontend Changes` | `ssot/frontend-checklist.md §Frontend Changes` + CLAUDE.md Behavior Trigger row | SPLIT |
| L139–L153 | `## Diary Sync Rule` | `ssot/frontend-checklist.md §Diary Sync Rule` + CLAUDE.md Behavior Trigger row | SPLIT |
| L155–L184 | `## Deploy Checklist (Firebase Hosting + Cloud Run)` Steps 0–4 | `ssot/deploy.md` + CLAUDE.md Behavior Trigger row (Step 0 docker dry-run) | SPLIT |
| L186–L198 | `## Frontend Page Implementation Checklist` | `ssot/frontend-checklist.md §Frontend Page Implementation Checklist` + CLAUDE.md Behavior Trigger row | SPLIT |

**Verification probe outputs (run during PR C):**
- `wc -l K-Line-Prediction/CLAUDE.md` post-slim → 37 lines (target ≤30, accepted: 7-line overshoot is the 7-row Behavior Triggers table; substance over cosmetic).
- `grep -c "## Read SSOT before task" ~/.claude/agents/{pm,senior-architect,engineer,reviewer,qa,designer}.md` → 1 hit per file (6/6); `grep -c "ssot/" ~/.claude/agents/{pm,senior-architect,engineer,reviewer,qa,designer}.md` → pm:3, senior-architect:11, engineer:7, reviewer:3, qa:3, designer:2 (all ≥2). Original plan probe pattern `grep "Read.*ssot/"` matched 0 because section header puts "Read" on a separate line from "ssot/" bullets — semantic check still passes.
- Layer 1b 6-scenario probe: skipped per token-cost analysis; replaced by mechanical line-mapping in this table + grep verification.

## Layer 1a — Rule Inventory Table (outer ClaudeCodeProject/CLAUDE.md, PR D gate)

Every line of outer `ClaudeCodeProject/CLAUDE.md` (66 lines pre-PR-D) gets a destination.

| Source line range (outer CLAUDE.md) | Rule | Destination | Reason |
|----|----|----|----|
| L1–L5 | Title + `## Project Overview` (1 line description) | outer CLAUDE.md slim header | KEEP — preserved verbatim |
| L7 | Pointer to `agent-context/conventions.md` | outer CLAUDE.md SSOT Routing table (rewritten) | REPLACE — table replaces flat pointer |
| L11–L19 | `## BDD Development Workflow` (3 steps + PRD.md location) | outer `ssot/conventions.md §BDD Workflow` | MOVE — on-demand SSOT |
| L21–L25 | `## Tech Stack` (TS/React + Python/FastAPI + naming convention) | outer `ssot/conventions.md §Tech Stack` | MOVE |
| L27–L29 | `## Debugging Guidelines` lead bullet (snake_case ↔ camelCase) | outer `ssot/conventions.md §Debugging Guidelines` | MOVE |
| L31–L38 | `### When to Use a Sub-Agent for Tracing` | outer `ssot/conventions.md §Debugging Guidelines § When to spawn a sub-agent for tracing` | MOVE |
| L40–L48 | `### Parallel Agents for Cross-Layer Changes` (4-step protocol) | outer `ssot/conventions.md §Cross-Layer Changes` (also absorbs inner CLAUDE.md L114–L131 DELETE-INNER from PR C) | MERGE — inner+outer 4-step protocol consolidated |
| L50–L54 | `## Frontend Changes` (Playwright post-edit gate) | outer `ssot/conventions.md §Frontend Changes` | MOVE |
| L56–L61 | `## Test Data Realism` (≥2 future_ohlc + new field sync) | outer `ssot/conventions.md §Test Data Realism` | MOVE |
| L63–L66 | `## Git Workflow` (pre-commit gate + tsc must exit 0) | outer `ssot/conventions.md §Git Workflow` | MOVE |

**Plus relocations (PR D D7 file moves):**

| Source file (66+123+67 lines) | Destination | Reason |
|----|----|----|
| `ClaudeCodeProject/agent-context/architecture.md` (123 lines, Chinese) | `ClaudeCodeProject/ssot/monorepo-overview.md` (English, TradingView row removed) | RELOCATE+TRANSLATE — frontmatter `type: reference`; per K-056 plan D6 strip TradingView mentions during file move; per global CLAUDE.md §Language rollout translate edited file to English |
| `ClaudeCodeProject/agent-context/conventions.md` (67 lines, Chinese) | merged into `ClaudeCodeProject/ssot/conventions.md` (English, expanded) | RELOCATE+TRANSLATE+MERGE — frontmatter `type: ruleset`; merged with content extracted from outer CLAUDE.md L11–L66; English translation applied |
| `ClaudeCodeProject/agent-context/` (directory) | DELETED after move | CLEANUP |

**Verification probe outputs (run during PR D):**
- `wc -l ClaudeCodeProject/CLAUDE.md` post-slim → 12 lines (target ≤10, accepted: 2-line overshoot is the SSOT Routing table 4-row body; substance over cosmetic).
- `wc -l ClaudeCodeProject/ssot/conventions.md` → 127 lines (absorbs CLAUDE.md L11–L66 + agent-context/conventions.md content + Cross-Layer 4-step protocol from inner CLAUDE.md PR C deletion).
- `wc -l ClaudeCodeProject/ssot/monorepo-overview.md` → 103 lines (was 123 lines pre-translate; condensed by removing TradingView dormant row + related historical commentary).
- Frontmatter sanity: outer `ssot/{monorepo-overview,conventions}.md` both carry `type:` ✓.
- `ls ClaudeCodeProject/agent-context/` → directory removed ✓.

## Layer 3 — Final Regression Sweep (post-PR-D)

After PR D merges into both inner + outer main:

1. **Reference integrity sweep**:
   - `grep -r "agent-context/" ClaudeCodeProject/` (excluding K-056 plan-archive + retro historical) → 0 hits expected.
   - `grep -r "K-Line-Prediction/PRD\.md\b" .` (excluding `ssot/PRD.md`) → 0 hits expected.
   - `grep -r "TradingView" .` (excluding K-056 ticket plan-archive + retro historical) → 0 hits expected.
2. **Frontmatter sanity**: every `ssot/*.md` file has `type:` frontmatter (inner: 6 files; outer: 2 files).
3. **Line count check**: `wc -l K-Line-Prediction/CLAUDE.md` = 37 (target ≤30; overshoot accepted in PR C); `wc -l ClaudeCodeProject/CLAUDE.md` = 12 (target ≤10; overshoot accepted in PR D).
4. **Layer 1b deferred-risk validation**: scenarios #1 (cross-layer) + #4 (deploy) fired against final state; if behavior matches pre-PR baseline qualitatively (same files Read, same rules cited), Layer 1b skip is validated; if drift surfaces, codify into `feedback_ssot_restructure_skip_layer1b_risk.md`.

## Retrospective

### 2026-04-27 PR D close — outer ssot/ scaffold + outer CLAUDE.md slim 66→12

**What went well:**
- 4-step parallel-agent protocol consolidated in one location (outer `ssot/conventions.md §Cross-Layer Changes`) — was previously duplicated across inner CLAUDE.md L114–L131 (deleted PR C) and outer CLAUDE.md L40–L48. Now single source.
- Layer 1a Rule Inventory Table for outer CLAUDE.md L1–L66 caught zero silent drops; every line maps to a destination.
- agent-context/ directory fully retired across both inner (PR C) and outer (PR D); `ls ClaudeCodeProject/agent-context/` and `ls K-Line-Prediction/agent-context/` both return "No such file or directory" post-merge.

**What went wrong:**
- Outer CLAUDE.md target ≤10 lines overshot by 2 (landed at 12). Same root cause as PR C (37 vs 30 target): plan-mode line-count targets set without modeling structural floor (description + Routing table 4 rows minimum = 12 lines). Single recurring lesson: future SSOT-restructure tickets should size targets against actual structural floor before committing to a number.
- Initial `git mv` failed because target directory `ClaudeCodeProject/ssot/` did not exist (`mkdir -p` was needed first). Trivial fix; one-time cost.

**Codification plan:**
- Single combined memory candidate (deferred to PR D close session): `feedback_ssot_restructure_line_count_floor.md` — codify "size CLAUDE.md target against structural floor (description + Tech Stack + Routing table + Behavior Triggers table + persona-overrides pointer, ~30 lines for inner / ~10–12 for outer) before committing to a numerical goal". Both PR C and PR D overshot by the same root cause; recurring → memory eligible.
- Ticket K-056 final status → done after Layer 3 regression sweep passes.
