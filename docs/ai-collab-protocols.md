---
title: AI Collaboration Protocols — K-Line Prediction
type: reference
tags: [AI-Collab, Protocols, Public]
updated: 2026-04-19
---

# AI Collaboration Protocols {#top}

One operator. Six AI agents. Every feature leaves a doc trail.

This document describes the structured protocols used to build the K-Line Prediction project — a system where PM, Architect, Engineer, Reviewer, QA, and Designer agents collaborate to ship production features end-to-end. Each protocol is designed to make AI behavior verifiable: every handoff produces an artifact, every mistake produces a memory entry, and every ticket is auditable by running `./scripts/audit-ticket.sh K-XXX`.

---

## Role Flow {#role-flow}

### The 6 Roles

| Role | Owns | Artefact |
|------|------|----------|
| PM | Requirements, AC, Phase Gates | PRD.md, docs/tickets/K-XXX.md |
| Architect | System design, cross-layer contracts | docs/designs/K-XXX-*.md |
| Engineer | Implementation, stable checkpoints | commits + ticket retrospective |
| Reviewer | Code review, Bug Found Protocol | Review report + Reviewer retrospective |
| QA | Regression, E2E, visual report | Playwright results + docs/reports/*.html |
| Designer | Pencil MCP, flow diagrams | .pen file + get_screenshot output |

### Handoff Sequence

```
PM → Architect → Engineer → Reviewer → QA → PM (next phase)
```

PM writes the PRD and Acceptance Criteria (AC) in Given/When/Then/And BDD format, then gates release to Architect. Architect designs system architecture, component trees, and API contracts across all phases before releasing to Engineer. Engineer implements one stable unit at a time, verifying each step before proceeding. Reviewer audits code quality and triggers Bug Found Protocol when issues are found. QA runs the full regression suite (Vitest + Playwright E2E) and produces a visual HTML report. PM closes the loop: aggregates retrospectives and opens the next phase.

### What "No artifact = no handoff" means

Every role produces a verifiable artifact before the next role begins. You can verify artifact completeness for any ticket by running:

```bash
./scripts/audit-ticket.sh K-XXX
```

The script checks A–G: ticket frontmatter, AC coverage, architecture design, commit trail, code review, per-role retrospectives, and Playwright + visual report output.

---

## Bug Found Protocol {#bug-found-protocol}

When a bug is found — by Reviewer, QA, or any role — the responsible role must complete four steps before the fix is released. Skipping any step means the protocol is not closed.

### The Four Steps

1. **Reflect** — The responsible role diagnoses the root cause and explains why their process failed to catch it. Generic answers ("communicate better") are rejected; root cause must be specific and structural.

2. **PM confirms reflection quality** — PM reviews the reflection for: concrete root cause, structural explanation of why the existing process failed, and a verifiable improvement action. If the responsible role is PM, the user confirms in their place.

3. **Write memory entry** — The reflection conclusion is written into the project memory system (`MEMORY.md` index + a dedicated feedback file). This is the only mechanism that makes corrections persist across sessions. Without a memory write, the fix is not closed — the same mistake will recur in a future session.

4. **Fix released** — Only after steps 1–3 are confirmed does the fix proceed. The fix is then committed and the ticket retrospective is updated.

### Example — K-009: TDD bug fix (1H MA history)

A bug caused 1H predictions to use incorrect MA history data. The Engineer wrote a failing test first (monkeypatching `find_top_matches` to assert `ma_history` identity), confirmed the test failed, then fixed the implementation. All 45 regression tests passed. The discipline: test before code, not after.

### Example — K-008 W4: env var as tainted source

During visual report script development, `process.env.TICKET_ID` was passed directly into a `path.join(OUTPUT_DIR, 'K-${TICKET_ID}-visual-report.html')` call without validation. Reviewer flagged it as a path traversal sink. The root cause: the Engineer treated env vars as "trusted developer input" rather than applying the correct rule — *sanitize by sink, not by source*. After Bug Found Protocol, the rule was written into memory and codified into Engineer persona behavior.

---

## Per-role Retrospective Log {#per-role-retrospective-log}

### Mechanism

Each role appends to its own log file after every ticket. The logs are cumulative — newest entries at the top — and survive across sessions as part of the repository.

| Role | Log file |
|------|----------|
| PM | `docs/retrospectives/pm.md` |
| Architect | `docs/retrospectives/architect.md` |
| Engineer | `docs/retrospectives/engineer.md` |
| Reviewer | `docs/retrospectives/reviewer.md` |
| QA | `docs/retrospectives/qa.md` |
| Designer | `docs/retrospectives/designer.md` |

This mechanism was activated starting from **K-008** (2026-04-18). Tickets K-001–K-007 pre-date the mechanism and are not back-filled.

### Entry format

```
## YYYY-MM-DD — K-XXX <ticket title or phase name>

**What went well:** (specific event; omit if none — no fabrication)
**What went wrong:** (root cause + why process didn't catch it)
**Next improvement:** (specific, executable action)
```

### Why per-role logs exist

Single-ticket retrospectives (`docs/tickets/K-XXX.md ## Retrospective`) capture the event. Per-role logs capture the *pattern* — a mistake that recurs across tickets is visible only in the cross-ticket log, not in individual tickets. Both coexist: single-ticket for event record, per-role for cumulative learning.

PM aggregates cross-role patterns at the end of each ticket by reading all five per-role entries and identifying structural issues (same mistake, different roles; process gaps; unverified assumptions).

### Curated Retrospective Excerpts {#curated-excerpts}

The following three excerpts are selected for their concrete root cause, structural lesson, and cross-ticket coverage. They are the best examples of how the retrospective mechanism produces verifiable behavior change.

---

#### [Engineer] 2026-04-18 — K-008 W4: env var as tainted source

> **Source:** [docs/retrospectives/engineer.md](./retrospectives/engineer.md) — "K-008 W1/W3/W4 Bug Found Protocol 反省"
>
> *"W4 根因（`TICKET_ID` env var 無 whitelist，path traversal）：我把 `process.env.TICKET_ID` 視為「開發者自己打指令傳進來的 trusted 字串」，完全沒把它當作「外部輸入 → filesystem sink（`path.join` → `fs.writeFileSync`）」的 tainted source 對待。思維定勢：env var 是 dev 手打，不是網路來的 request → 不需要 validate。但 input sanitization 的判準不該是「誰打的」，而是「這個值流到哪」。"*
>
> **Lesson codified:** Sanitize by sink, not by source. Any value — regardless of origin — that flows into `fs.*` / `path.*` / `shell.*` / `URL.*` requires allow-list validation at the point of use. This rule is now in MEMORY.md and Engineer persona.

*Pillar: Persistent Memory — this correction outlives the session that produced it.*

---

#### [Engineer] 2026-04-18 — K-002: And-clause systematic omission

> **Source:** [docs/retrospectives/engineer.md](./retrospectives/engineer.md) — "K-002 And-clause 系統性遺漏"
>
> *"The And-clause for SectionHeader icons (AC-002-ICON And 3) was silently skipped during implementation because I habitually parse AC as Given/When/Then and treat And-clauses as secondary. The bug passed Engineer, Architect-review, and QA gates before Code Review caught it. From this ticket onward, every implementation starts by enumerating all Then/And clauses as a flat checklist, and every And gets a Playwright assertion."*
>
> **Lesson codified:** AC parsing must be exhaustive: enumerate every Then and And clause as a flat checklist before writing any code. This event directly caused the per-role retrospective log mechanism to be created — one mistake catalyzing a structural process change.

*Pillar: Structured Reflection — the reflection mechanism exists because this bug exposed a process gap that no single role caught alone.*

---

#### [Architect] 2026-04-18 — K-008 W2/S3: truth table discipline for config × execution timing

> **Source:** [docs/retrospectives/architect.md](./retrospectives/architect.md) — "K-008 W2/S3 Bug Found Protocol 反省"
>
> *"設計階段只列出「default glob 吃 → 加 `testIgnore`」「default glob 不吃 → 沿用」兩種分支（ticket §6.2），漏掉第三分支「default 不吃但 CLI 指檔也被擋」。根因：我把 Playwright `testMatch` 當成「只影響 default discover」的過濾器，沒去查 CLI file argument 是否也會套同一 glob；這屬於 Architect 沒把「配置行為邊界」查完整就假設分支窮舉，本質上是「沒實測就下窮舉結論」的錯誤。"*
>
> **Lesson codified:** Design-phase branch enumeration must use a truth table (`config × run mode = all combinations`), not imagination. "I think these are all the cases" is not sufficient. For K-008 W2, `testMatch × run mode {default, --list, file-arg, --project}` had a third branch the Architect did not enumerate. The truth table approach is now required in Architect persona.

*Pillar: Role Agents — an independent Architect role, forced through Bug Found Protocol, produced a structural discipline that a solo operator would have rationalized away.*

---

## Verification {#verification}

Any recruiter or reader can verify these protocols by running the audit script on any ticket from K-008 onward:

```bash
# Clone the repo and navigate to the project
git clone https://github.com/mshmwr/k-line-prediction.git
cd k-line-prediction

# Audit a ticket that pre-dates the per-role retro mechanism (F/G skipped)
./scripts/audit-ticket.sh K-002

# Audit a ticket with full per-role retrospective coverage
./scripts/audit-ticket.sh K-008

# Audit the current ticket
./scripts/audit-ticket.sh K-017
```

Exit code 0 means all checks pass. The script requires only bash — no Node.js or Python runtime.
