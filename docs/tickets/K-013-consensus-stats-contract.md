---
id: K-013
title: Consensus / Stats Single Source of Truth（TD-008 Option C 實作）
status: open
type: refactor
priority: high
size: M
created: 2026-04-18
source: docs/designs/TD-008-rfc-consensus-source-of-truth.md
implements:
  - TD-008
related:
  - docs/tech-debt.md#td-008
  - docs/reviews/2026-04-18-code-review.md
coordinates_with:
  - TD-005  # AppPage.tsx 拆分時，usePredictionWorkspace() 邊界以本票 statsComputation.ts 為基礎
---

## 背景

Codex 2026-04-18 review 指出 projected future bar aggregation / stats derivation / time aggregation 前後端各有一份實作，長期有漂移風險。TD-008 RFC ([`docs/designs/TD-008-rfc-consensus-source-of-truth.md`](../designs/TD-008-rfc-consensus-source-of-truth.md)) 已於 2026-04-18 被 PM 核准採用 **Option C**：

- 後端保留 `compute_stats` 作為「全集 baseline」oracle
- 前端抽出純函式 `computeStatsFromMatches(matches, currentClose, timeframe)`，處理 subset 情境
- 兩端共吃同一份 JSON fixture，用 contract test 鎖定 bit-exact（容忍 1e-6 浮點誤差）
- `/api/predict` payload schema 不變，向後相容

## 範圍

**含：**

1. 前端抽共用純函式 `frontend/src/utils/statsComputation.ts`
2. `frontend/src/AppPage.tsx` 移除 inline `computeDisplayStats`，改呼叫 `statsComputation.ts`
3. `AppPage.tsx` 的 `displayStats` useMemo 分支簡化：全集 → 直接用 `appliedData.stats`；subset → 呼叫 util
4. 新增 contract fixture JSON（路徑：`backend/tests/fixtures/stats_contract_cases.json`）
5. 後端新增 parametrize test 讀 fixture、assert `compute_stats` 輸出符合 `expected`
6. 前端新增 Vitest 讀同一份 fixture（relative path）、assert `computeStatsFromMatches` 輸出符合 `expected`
7. `backend/predictor.py` `compute_stats` / `_projected_future_bars` 補註解「全集 baseline」

**不含：**

- API schema 變更（Option C 的核心 pro 就是 payload 不動）
- CI contract drift job（PM 裁決暫緩，下個 phase 再加）
- TD-005 AppPage 拆分（本票做完後另開 RFC）
- `shared/` 目錄層級（PM 裁決選 A：fixture 放 `backend/tests/fixtures/`）

## 預期異動檔案

### 後端
- `backend/predictor.py` — `compute_stats` / `_projected_future_bars` 語意註解補「全集 baseline」
- `backend/tests/test_predictor.py` — 新增 contract parametrize test（讀 fixture）
- `backend/tests/fixtures/stats_contract_cases.json`（新增）

### 前端
- `frontend/src/utils/statsComputation.ts`（新增，從 `AppPage.tsx` 抽出）
- `frontend/src/AppPage.tsx` — 移除 inline `computeDisplayStats` + 邊界邏輯簡化
- `frontend/src/__tests__/statsComputation.test.ts`（新增）

### 不動
- `backend/main.py` `/api/predict` route（payload schema 不變）
- Playwright E2E specs（mock payload 不變；但 mock `future_ohlc` 仍需 ≥2 筆符合 CLAUDE.md 規範）

## 驗收條件

### AC-013-UTIL：前端抽出共用純函式

**Given** `frontend/src/utils/statsComputation.ts` 已建立
**When** 外部呼叫 `computeStatsFromMatches(matches, currentClose, timeframe)`
**Then** 回傳型別等同後端 `PredictStats`（camelCase 映射：`consensusForecast1h` / `consensusForecast1d` / `highestOrder` / `secondHighest` / `secondLowest` / `lowestOrder` / `winRate` / `meanCorrelation`）
**And** 函式為純函式，無 React 依賴、無 side effect、無隱式 `Date.now()`

### AC-013-APPPAGE：AppPage.tsx displayStats 邏輯簡化

**Given** `frontend/src/AppPage.tsx`
**When** 讀取 `displayStats` useMemo
**Then** 邏輯為：
  - `appliedSelection` == all matches → 直接使用 `appliedData.stats`（不呼叫 util）
  - `appliedSelection` ⊂ all matches 且長度 ≥ 1 → 呼叫 `computeStatsFromMatches(filteredMatches, currentClose, timeframe)`
**And** 原 inline `computeDisplayStats`（約 30 行）已刪除
**And** 原 `projectedFutureBars` useMemo 邏輯已合併進 `statsComputation.ts` 或 `displayStats` 分支，不留重複計算

### AC-013-FIXTURE：Contract fixture 建立

**Given** `backend/tests/fixtures/stats_contract_cases.json` 已建立
**When** 檔案被讀取
**Then** 內容為 array，每筆 case 含：
  - `name`: 描述字串
  - `input`: `{ matches: Match[], current_close: number, timeframe: "1H" | "1D" }`
  - `expected`: `PredictStats`（snake_case，與後端輸出一致）
**And** 至少涵蓋 3 種 case：
  - 全集 matches（subset == all）
  - Subset matches（deselect 1 個）
  - Edge case（single match 且 `future_ohlc` 正好 2 筆，符合 `projectedFutureBars.length >= 2` 邊界）

### AC-013-BACKEND-CONTRACT：後端 contract test 通過

**Given** 新增的 pytest parametrize test
**When** 執行 `python3 -m pytest backend/tests/test_predictor.py -k contract`
**Then** 每筆 fixture case 執行 `compute_stats(**case.input)`
**And** 輸出與 `case.expected` bit-exact 或浮點誤差 ≤ 1e-6
**And** 若後端 `compute_stats` 算法改變但 fixture 未同步，該 test 失敗

### AC-013-FRONTEND-CONTRACT：前端 contract test 通過

**Given** 新增的 `frontend/src/__tests__/statsComputation.test.ts`
**When** 執行 `npm test`
**Then** 讀取 `../../../backend/tests/fixtures/stats_contract_cases.json`（relative path）
**And** 對每筆 fixture case 呼叫 `computeStatsFromMatches(...)`
**And** 輸出經 snake_case → camelCase 對映後，欄位值與 `case.expected` bit-exact 或浮點誤差 ≤ 1e-6

### AC-013-REGRESSION：無既有功能回歸

**Given** 前後端完整檢查
**When** 依序執行：
  1. `npx tsc --noEmit`（frontend）
  2. `python3 -m pytest backend/tests/`（全部 backend tests，含 K-009 regression）
  3. `npm test`（前端 Vitest 全部，含 K-010 修復後的 AppPage.test.tsx）
  4. `/playwright`（E2E 45+ tests）
**Then** 全部 exit 0、全部 pass
**And** Playwright mock payload 的 `future_ohlc` 仍 ≥ 2 筆（符合 CLAUDE.md Test Data Realism）
**And** `/api/predict` response shape 無變更

### AC-013-API-COMPAT：API payload 向後相容

**Given** `/api/predict` endpoint
**When** 本票完成後呼叫
**Then** response JSON 的 `stats.consensus_forecast_1h` / `consensus_forecast_1d` 欄位形狀與本票開始前完全一致
**And** 現有 E2E mock 不需改動即可通過

### AC-013-COMMENT：語意註解明確

**Given** `backend/predictor.py` 的 `compute_stats` 與 `_projected_future_bars`
**When** 閱讀 docstring / inline comment
**Then** 明確標示「回傳為 all top-N matches 全集 baseline；subset stats 由前端 `statsComputation.ts` 計算；兩者由 `backend/tests/fixtures/stats_contract_cases.json` 鎖定對等」

## 相依 / 協同

- **不 block 其他票。** K-009 / K-010 / K-011 / K-012 可先完成
- **與 TD-005 協同：** TD-005 啟動時，`usePredictionWorkspace()` hook 會以本票的 `statsComputation.ts` 為基礎再拆；若順序顛倒，TD-005 的 hook 邊界會需要重劃，效率較差
- **無 CI drift job：** PM 裁決暫緩，本 cycle 靠 PR reviewer + 兩端共吃 fixture 的 test failure 作為安全網

## 預估大小

**M（中）** — 估計工時 3~5 hours
- 前端抽 util + 簡化 displayStats：~1.5h
- Contract fixture + 前後端 test：~1.5h
- Regression / E2E 驗證：~1h

## 下一棒

直接交 Engineer（RFC 已核准，範圍明確，無額外架構決策）。

**實作順序建議（Engineer 可自行調整）：**
1. 先抽 `statsComputation.ts`（從 `AppPage.tsx` 複製 `computeDisplayStats` 邏輯，確保 tsc 綠）
2. 產 fixture JSON（以當前後端 `compute_stats` 輸出作為 ground truth，`python3 -c "..."` 匯出）
3. 前端 Vitest 讀 fixture 通過
4. 後端 parametrize test 讀 fixture 通過（確認兩端輸出對等）
5. `AppPage.tsx` displayStats 分支改寫 + 刪 inline 實作
6. `npx tsc --noEmit` + `npm test` + `pytest` + `/playwright` 全綠

**實作守則：**
- 本票涉及 `frontend/src/` 修改，完成後必須跑 `/playwright`（K-Line-Prediction CLAUDE.md Frontend Changes 規範）
- Playwright mock 的 `future_ohlc` ≥ 2 筆硬規範不得破壞
- 若 fixture 產生過程發現後端 `compute_stats` 有 bug 或邊界未處理，暫停回報 PM，視為 scope creep

## 相關連結

- [TD-008 RFC](../designs/TD-008-rfc-consensus-source-of-truth.md)
- [Tech debt registry TD-008](../tech-debt.md#td-008--cross-layer-重複計算)
- [Code Review 2026-04-18](../reviews/2026-04-18-code-review.md)

---

## Architecture Review

**裁決：無需額外 Architecture** — 由 senior-architect 於 2026-04-18 審視。

**理由：**
- 設計已在 TD-008 RFC 中完整列出（實作影響範圍章節逐條對應本票 AC）
- 無跨層 API schema 變更
- 前端 util 抽出 + 後端註解調整 + fixture 建立，皆在 RFC 涵蓋範圍內
- Engineer 照 RFC「實作影響範圍」章節執行即可

**放行 Engineer。**

— senior-architect（via PM 轉述 RFC 既有裁決）, 2026-04-18
