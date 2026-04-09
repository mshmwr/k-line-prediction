# AGENTS.md — K-Line Prediction

ETH/USDT K 線型態相似度預測系統。

**系統架構、API endpoints、資料流、欄位 mapping：** [agent-context/architecture.md](./agent-context/architecture.md)
**K-Line 專屬規範（命名、pre-commit、時間格式、history database）：** [agent-context/conventions.md](./agent-context/conventions.md)

---

## Tech Stack

- **Frontend:** TypeScript + React (Vite) — after any edit, run `npx tsc --noEmit`
- **Backend:** Python + FastAPI — run `python -m py_compile <file>` after edits
- **Naming:** backend uses `snake_case`, frontend uses `camelCase`

---

## Critical Rules

### API Boundary
Always check [agent-context/architecture.md — Field Mapping](./agent-context/architecture.md#frontend--backend-field-mapping) when changes cross the backend → frontend boundary. `snake_case` ↔ `camelCase` mismatches are the most common source of bugs.

### Time Format
All timestamps must be **UTC+0 ISO 8601**. Use `time_utils.normalize_bar_time()` in the backend for any date parsing. Do not introduce UTC+8 values anywhere.

### History Database
`/api/predict` and `/api/merge-and-compute-ma99` merge input bars **in memory only** for context computation. Only `/api/upload-history` writes to `history_database/`. Do not change this behavior.

---

## Pre-Commit Checks

```bash
# Backend
python -m py_compile backend/<changed_file>.py
cd K-Line-Prediction/backend && pytest

# Frontend
cd K-Line-Prediction/frontend && npx tsc --noEmit
```

After any change to `frontend/src/` or `frontend/e2e/`, run Playwright E2E tests before committing.
