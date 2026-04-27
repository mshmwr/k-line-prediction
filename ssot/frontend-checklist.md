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
{ "milestone": "Phase X — Feature Name", "items": [{ "date": "YYYY-MM-DD", "text": "One sentence in English." }] }
```

**Language rule: `milestone` name and every `text` entry must be in English.**

Update steps:

1. Append a new item to the corresponding milestone's `items` array, or add a new milestone object
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
