# CLAUDE.md — K-Line Prediction

ETH/USDT K 線型態相似度預測系統。

**系統架構、API endpoints、資料流、欄位 mapping：** [agent-context/architecture.md](./agent-context/architecture.md)
**K-Line 專屬規範（命名、pre-commit、時間格式、history database）：** [agent-context/conventions.md](./agent-context/conventions.md)

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
