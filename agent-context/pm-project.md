---
title: PM Persona — K-Line Prediction Project-Specific Config
type: reference
tags: [PM, Agent, Persona, K-Line, project-config]
updated: 2026-04-25
last-verified: 2026-04-25
---

## Summary

Project-specific paths, deploy targets, and hard-coded tables referenced from `~/.claude/agents/pm.md`. The generic PM persona carries rules + pointer here; this file carries the K-Line-specific concrete values. Other projects MUST fork this file into their own `agent-context/pm-project.md` and override values below.

**Scope:** K-Line Prediction project only. Running the PM agent outside this project → read target project's own `agent-context/pm-project.md`; if absent, escalate to user for project-config creation.

---

## outer-repo-mirror-paths

Anchor referenced from `pm.md §Phase end` Outer-repo mirror commit pre-flight. Defines which paths are in-scope when the inner K-Line session commits mirrored changes to the outer Diary repo.

| Ticket type | In-scope paths (outer Diary repo) |
|-------------|-----------------------------------|
| **K-Line inner mirror** | `ClaudeCodeProject/K-Line-Prediction/docs/tickets/K-<this-ticket>*` · `ClaudeCodeProject/K-Line-Prediction/docs/designs/K-<this-ticket>*` · `ClaudeCodeProject/K-Line-Prediction/docs/retrospectives/*.md` (only entries added this session) · `ClaudeCodeProject/K-Line-Prediction/frontend/public/diary.json` · `ClaudeCodeProject/K-Line-Prediction/PRD.md` · `ClaudeCodeProject/K-Line-Prediction/agent-context/architecture.md` |
| **Dashboard / diary** | `ClaudeCodeProject/PM-dashboard.md` · `daily-diary.md` |
| **Out of scope** | Other tickets' files; unrelated agent/config/memory edits from prior sessions — `git restore --staged` before commit |

**Ticket-ID prefix:** `K-` (e.g. `K-042`). Branch + worktree naming: `K-<NNN>-<slug>`.

---

## deploy-record-template

Anchor referenced from `pm.md §Phase end` Ticket closure bookkeeping step 4 (Deploy Record). K-Line deploys to Firebase Hosting. Other hosting → override fields below.

```
**Deploy date:** YYYY-MM-DD HH:MM:SS (Asia/Taipei)
**Git SHA at deploy:** `<full 40-char SHA>`
**Hosting URL:** https://<site>.web.app
**Bundle hash:** `assets/index-<hash>.js` (live etag `<hash>` matches `<cwd>/.firebase/hosting.*.cache`)
**Verification probe (executed, not just recorded):** `<curl ... | grep <ticket-identifier>>` → `<actual output captured at close time>`
**Status:** Live
```

**Deploy host:** Firebase Hosting (`firebase deploy --only hosting`). Cache cwd: `frontend/.firebase/hosting.*.cache` (worktree-local when deploying from worktree).

**Verification probe layer table** — pick row matching ticket's change layer; all touched layers must probe:

| Change layer | Probe form | ticket-specific identifier |
|---|---|---|
| `frontend/src/**` add | `curl <live>/assets/index-<hash>.js \| grep <new-testid\|new-string>` → ≥1 | new testid / new rendered string / new component name added in this ticket |
| `frontend/src/**` remove | `curl ... \| grep <removed-symbol>` → 0 | the testid / string this ticket removed |
| `backend/**` API | `curl <api>/<new-endpoint>` → HTTP 200 + expected schema field | new endpoint path / new response field |
| DB / infra | query migration status / version endpoint / config endpoint | schema version / new row / new config key |

Generic `curl <home-URL>` returning 200 is **not** valid — grep/match target must be something this ticket introduced or removed.

---

## project-specific-automation

Anchor referenced from `pm.md §Auto-trigger Timing`. K-Line-only proactive actions.

- **Diary update automation:** After K-024 goes live, update `frontend/public/diary.json` following the flow in `docs/tickets/K-024-diary-structure-and-schema.md` at end of each K-Line work session — do not wait for user reminder.

---

## Maintenance

- New K-Line-specific path / deploy field / automation → add here; `pm.md` stays project-agnostic
- `last-verified` refreshed on every re-read
- Other projects onboarding the PM persona → copy this file's structure, override values, commit as `<project>/agent-context/pm-project.md`
