# Agents — Abridged Public Personas

Abridged public excerpts of the six agent personas used in the Claude Code harness that produced the K-Line Prediction site.

**Full personas live in `~/.claude/agents/*.md`** (private Claude Code config) — these are the operator's ongoing work product and not fully published. Each file here is a curated subset of the rules that governed real tickets in this repo, with the originating ticket / incident cited.

| Agent | Role | Full-persona size | Rules shown here |
|---|---|---|---|
| [PM](./pm.md) | Requirements, AC, Phase Gates, cross-role arbitration | ~64 KB | 6 |
| [Senior Architect](./senior-architect.md) | Design, API contract, component tree, file change list | ~34 KB | 6 |
| [Engineer](./engineer.md) | Implementation against design doc + AC | ~21 KB | 6 |
| [Reviewer](./reviewer.md) | Project-depth code review (Step 2 after breadth) | ~16 KB | 5 |
| [QA](./qa.md) | Testability review, regression, E2E, edge case coverage | ~19 KB | 5 |
| [Designer](./designer.md) | Pencil design source of truth, visual acceptance | ~21 KB | 5 |

## How to read these files

Each file shows three things:

1. **What the agent does** — the one-paragraph job description.
2. **Core beliefs** and **Never Do** — the persona's operating principles and hard boundaries, verbatim from the production persona.
3. **Selected rules** — 5–7 representative rules, each with the originating ticket ID so you can trace the incident that produced the rule in this repo's `docs/retrospectives/` log.

## Why only excerpts

The full personas accumulate rules across every project the operator runs. Publishing them whole (a) exposes IP and cross-project context, (b) produces a wall of text that doesn't signal harness-design judgment, (c) incentivizes copy-paste instead of understanding the *mechanism* by which each rule was written. A curated subset shows the same system with proof-of-work per rule — which is the signal.

**Last synced:** 2026-04-24.
