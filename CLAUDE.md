# CLAUDE.md — K-Line Prediction

ETH/USDT K-line pattern similarity prediction system.

**System architecture, API endpoints, data flow, field mapping:** [agent-context/architecture.md](./agent-context/architecture.md)
**K-Line conventions (naming, pre-commit, time format, history database):** [agent-context/conventions.md](./agent-context/conventions.md)

---

## 開發角色與流程

**流程順序：**
```
PM (定需求) → Architect (設計) → Engineer (實作) → Code Reviewer (審查) → QA (回歸測試) → PM (下一 Phase)
```

### PM
- 寫 PRD、定 AC（Given/When/Then/And）
- 放行條件：所有 Phase 的 AC + blocking questions 全清才放行 Engineer

### Architect
- 設計所有 Phase 的系統架構
- 必須涵蓋：後端 + 前端路由 + 前端組件樹 + props interface
- 不能只規劃下一個 Phase

### Engineer
- 實作前確認在最新 main 基礎上
- 一次實作一個穩定單元，每步驗證後再繼續

### Code Reviewer
- 每個重要里程碑完成後召喚
- Review 結果必須寫回計畫文件 / PRD

### QA
- Code Review 通過後執行
- 負責回歸測試：跑完整 Playwright E2E suite，確認新功能未破壞既有功能
- 所有測試 pass 才放行給 PM

### Per-Role Retrospective Logs（K-008 起啟用）

每個角色 agent 任務結束前必須在 `docs/retrospectives/<role>.md` **最上方** append 一筆反省（倒序，最新在上）：

| Role | Log 檔 |
|------|--------|
| PM | `docs/retrospectives/pm.md` |
| Architect | `docs/retrospectives/architect.md` |
| Engineer | `docs/retrospectives/engineer.md` |
| Reviewer | `docs/retrospectives/reviewer.md` |
| QA | `docs/retrospectives/qa.md` |
| Designer | `docs/retrospectives/designer.md` |

條目格式：

```
## YYYY-MM-DD — <Ticket ID 或 Phase 名稱>

**做得好：**（具體事件；無則省略本行，勿捏造）
**沒做好：**（根因）
**下次改善：**（具體行動）
```

- 規則：與單票 `docs/tickets/K-XXX.md` 的 `## Retrospective` 段落**並存**，不互相取代（單票 = 當次事件記錄；per-role log = 跨 ticket 累積學習）
- K-001~007 不回填（機制啟用前無此義務）

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

`frontend/public/diary.json` 是前端 Dev Diary 頁面的資料來源。
**每次 session 有 K-Line-Prediction 相關工作時，commit 前必須同步更新 diary.json。**

格式：
```json
{ "milestone": "Phase X — Feature Name", "items": [{ "date": "YYYY-MM-DD", "text": "One sentence in English." }] }
```

**語言規範：`milestone` 名稱與每筆 `text` 均須使用英文。**

更新步驟：
1. 在對應 milestone 的 `items` 陣列新增一筆，或新增 milestone 物件
2. 更新後執行 `/playwright` 確認 DiaryPage E2E 通過

## Deploy Checklist（Firebase Hosting + Cloud Run）

部署前必須執行：

1. **掃描所有相對 API 路徑** — 確認 `fetch`、`axios` 等所有 HTTP client 均使用 `API_BASE` 前綴：
   ```bash
   grep -r "'/api/" src/
   grep -r '"/api/' src/
   ```
   有任何裸相對路徑 → 先修再 build
2. **build** — `npm run build`（在 `frontend/` 目錄）
3. **deploy** — `firebase deploy --only hosting`（在專案根目錄）

## Frontend Page Implementation Checklist

實作新頁面前，必須：

1. **讀 PRD AC** — `grep "AC-PAGENAME" PRD.md`，逐條列出所有 Then/And 子句
2. **確認 Tailwind 插件** — 若計畫使用 `prose-*` 等插件類別，先驗證安裝：
   ```bash
   npm ls @tailwindcss/typography
   grep -n "typography" tailwind.config.js
   ```
   未安裝則先安裝再繼續
3. **Playwright 斷言** — section label 等短文字斷言一律加 `{ exact: true }`，防止 description 文字誤命中
4. **實作後** — E2E 斷言必須覆蓋所有 And 條件
