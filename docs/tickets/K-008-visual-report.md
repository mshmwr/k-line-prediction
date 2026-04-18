---
id: K-008
title: 自動化視覺報告 script（Playwright 截圖 → HTML）
status: open (cycle #4)
type: feat
priority: high
created: 2026-04-18
updated: 2026-04-18
---

## 背景

目前 QA 完成後沒有視覺化的驗收報告；Retrospective 流程要求 QA 執行截圖 script 並通知 PM「報告在 `docs/reports/K-XXX-visual-report.html`」，但此 script 尚未存在 — QA agent 定義的結尾動作目前懸空。

## 範圍（MVP）

**含：**
- 建立 `frontend/e2e/visual-report.ts` Playwright script
- 對「已知頁面路由全集」各截一張全頁截圖（full page screenshot）— 不做 ticket → 頁面 mapping
- 產出 `docs/reports/K-XXX-visual-report.html`（內嵌截圖的 HTML 報告，XXX 由 CLI 傳入）

**不含（MVP 不做）：**
- Ticket → 頁面 mapping（跑幾次後再依實際需求補，避免過早優化）
- 分 section 截圖（先整頁，之後再切）
- 截圖比對（pixel diff）
- CI 自動觸發（維持手動 `npx playwright test visual-report.ts`）

## 驗收條件

### AC-008-SCRIPT：Script 可執行

**Given** QA 完成，所有 Playwright E2E 已通過
**When** 在 `frontend/` 目錄執行 `npx playwright test visual-report.ts`（含傳入 ticket ID 的方式，由 Architect 決定 CLI arg / env var）
**Then** script 成功執行，退出碼 0
**And** 在 `docs/reports/` 下產出 `K-XXX-visual-report.html`

### AC-008-CONTENT：報告包含所有已知頁面全頁截圖

**Given** `K-XXX-visual-report.html` 已產出
**When** 在瀏覽器開啟
**Then** 報告包含「已知頁面路由全集」每條路由一張 full page 截圖
**And** 每張截圖有對應的 route path 標記（例如 `/`、`/app`、`/about`、`/diary`）
**And** 若某條路由需登入，報告標記「需登入」或使用 auth fixture 後截圖（由 Architect 定案）

## 裁決（PM triage 2026-04-18）

- **priority：low → medium → high**（2026-04-18 K-011 PM 彙整後再上調）
- **獨立 ticket，不併入 K-011** — script 跨頁執行，不綁任何單一 UI ticket；不降級為 K-011 的子任務
- **MVP 範圍縮減** — 全頁截圖 + 所有已知路由，不做 ticket→頁面 mapping（跑幾輪後再視需要補）
- **cycle 位置（2026-04-18 更新）：cycle #6 → cycle #4** — K-009/010/011 連續三張 ticket 無視覺驗證層（Engineer/Reviewer/QA/PM 皆無法確認 UI），為系統性缺口，不得再拖
- **連動：** K-012 → cycle #6、K-013 → cycle #7（各順延一個 cycle）
- **狀態：open (cycle #6) → open (cycle #4)**

## Blocking Questions（已釐清 2026-04-18）

| # | 問題 | 裁決 |
|---|------|------|
| 1 | 執行環境 | **本地 dev server** — script 假設 `http://localhost:5173`（Vite 預設）已起；與既有 Playwright E2E 一致，離線可跑 |
| 2 | 頁面範圍 | **4 條公開頁：`/` `/app` `/about` `/diary`**（`/app` 是預測主頁不需登入，PM 原推薦誤判已修正）；`/business-logic`（JWT）標「需登入，下期補」不做 auth fixture |
| 3 | Ticket ID 傳入 | **env var：`TICKET_ID=K-008 npx playwright test visual-report.ts`** — script 讀 `process.env.TICKET_ID`；若未設則預設字串 `UNKNOWN` 或退出碼 1（由 Architect 決定） |

## 相關連結

- [PM-dashboard.md](../../../PM-dashboard.md)
- [K-002 Retrospective — QA 反省段](K-002-ui-optimization.md#retrospective)
- QA agent 結尾動作定義：`~/.claude/agents/qa.md`
- Per-Role Retrospective Log 機制：`CLAUDE.md` 第 39~64 行
