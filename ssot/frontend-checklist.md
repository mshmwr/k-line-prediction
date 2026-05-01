---
title: K-Line Prediction — Frontend Checklist
type: ruleset
tags: [K-Line-Prediction, Frontend, Playwright, Diary]
updated: 2026-04-27
---

## Summary

Frontend post-edit gate, diary.json sync rule, new-page implementation checklist.

---

## Frontend Changes

After **any** edit to files under `frontend/src/` or `frontend/e2e/`:

1. Run `/playwright` to execute E2E tests and verify no UI regression
2. Only proceed to commit after Playwright passes

---

## Diary Sync Rule

`frontend/public/diary.json` is the data source for the frontend Dev Diary page.
**Before every commit in a K-Line-Prediction work session, diary.json must be synced.**

Format:
```json
{ "ticketId": "K-XXX", "title": "Short ticket title", "date": "YYYY-MM-DD", "text": "One sentence, ≤25 words." }
```

(`ticketId` is optional — omit for non-ticket entries)

**Entry style (hard cap):**
- `text`: one sentence, **≤25 words** — no multi-clause text, no implementation details
- `title` and `text` must be in English

Update steps:

1. Prepend a new item at the top of the array (newest-first order)
2. After update, run `/playwright` to confirm DiaryPage E2E passes

---

## Frontend Page Implementation Checklist

Before implementing a new page, must:

1. **Read PRD AC** — `grep "AC-PAGENAME" ssot/PRD.md`, list all Then/And clauses
2. **Verify Tailwind plugins** — if planning to use `prose-*` or other plugin classes, verify installation first:
   ```bash
   npm ls @tailwindcss/typography
   grep -n "typography" tailwind.config.js
   ```
   Not installed → install before continuing
3. **Playwright assertions** — section label and short-text assertions must use `{ exact: true }` to prevent description text false matches
4. **After implementation** — E2E assertions must cover all And conditions

---

## QA Visual Report

**Purpose:** After QA regression testing, produce a visual report for PM / user to review current UI state.

**Output location:** `docs/reports/K-XXX-visual-report.html` (one file per ticket; filename determined by env var `TICKET_ID`)

**Generation:**

```bash
cd frontend
TICKET_ID=K-008 npx playwright test visual-report.ts
```

- Runner: Playwright test runner (reuses `playwright.config.ts` `webServer` + `baseURL`)
- Coverage (MVP): `/` / `/app` / `/about` / `/diary` full-page screenshots; `/business-logic` placeholder ("auth-required, not captured")
- Output format: single HTML file, PNG screenshots inline base64-embedded (offline-viewable, committable)
- Summary header template: `Pages: {successes} captured, {failures} failed, {authRequired} auth-required (not captured)`
- Failure strategy: single-page failure does not abort; continues other pages; failed section gets red border + error message; script exits 1
- Missing `TICKET_ID` → default filename `K-UNKNOWN-visual-report.html` + stdout warning

**Script location:** `frontend/e2e/visual-report.ts`

**Spec separation (per-project testMatch):** `playwright.config.ts` splits E2E suite into 2 projects:
- `chromium` — `testMatch: /.*\.spec\.ts$/` — only `*.spec.ts`, excludes `visual-report.ts`
- `visual-report` — `testMatch: /visual-report\.ts$/` — only `visual-report.ts`

**Rationale:** `testIgnore` cannot solve CLI file-targeting when default `testMatch` would block `npx playwright test visual-report.ts`. Dedicated project is the only way to achieve "default run skips it" + "explicit `--project=visual-report` runs it".

**Side effects (Engineer / Reviewer note):**
- New E2E spec: keep `*.spec.ts` naming → automatically assigned to `chromium` project, no extra config needed
- New visual-report-style scripts: if filename is not `visual-report.ts`, create new project or extend `visual-report` project `testMatch` regex (e.g. `/(visual-report|a11y-report)\.ts$/`)
- Running `npx playwright test` without `--project` runs all projects including `visual-report`; use `--project=chromium` to exclude it

**Post-K-008 extension directions (out of K-008 scope):**
- Ticket → page mapping (add as needed)
- Per-section screenshots (instead of full-page)
- Auth fixture to capture `/business-logic`
- Split to multi-file directory mode when single file exceeds size limit
