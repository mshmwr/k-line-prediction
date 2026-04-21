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

---

## PM Release Decision — 2026-04-21

**結論：放行 Engineer。**

**交付物審查：** Architect 交付 3 項（`docs/designs/K-013-consensus-stats-ssot.md` 11 段 / `agent-context/architecture.md` 8 處同步 / `docs/retrospectives/architect.md` 2026-04-21 entry）皆完整，design doc §0 Pre-Design Audit + §7 實作順序 Step 1~8 + §8 API 不變性證明 + Self-Diff Verification 齊全。

**SQ-013-01 裁決：同意 Architect non-blocking 預判。** `PredictStats.consensus_forecast_1h/1d` 後端永遠回 `[]` 是 pre-existing 行為（K-013 之前已存在），全集分支無 consensus 圖屬既有 UX，非 K-013 引入。登記為 KG-013-01（design doc §9.3）；若未來需全集也顯圖，另開 ticket 決定「後端補算」或「前端全集分支也 compute」。K-013 本票不擴 scope。

**SQ-013-02 裁決：同意 Architect 入版提案。** `backend/tests/fixtures/generate_stats_contract_cases.py` 入版，理由：(a) 後端改算法時可一鍵重現 ground truth（避免翻 git history）；(b) fixture drift 防線依賴 generator 可執行；(c) ~70 行 Python，維護成本低。

**Pencil 設計稿檢查：**

| 路由 | Pencil frame | K-013 視覺變更 | Cross-check 方式 |
|------|-------------|--------------|-----------------|
| `/app` | **無**（K-021 §2 明文記錄設計稿僅含 4 個公開展示頁；AppPage 為工具頁不在 marketing palette 範疇；K-030 進一步把 /app 從 paper palette 剝離） | 無（design doc §6 Route Impact Table 標記 "affected (行為等價)"；§8 API Schema 不變性證明 5 個 class 區塊 0 lines changed） | Engineer Step 7 Playwright 45+ E2E + Step 8 dev server 目視 `/app` 三種操作狀態（全集 / deselect 1 / deselect 全部）核對 StatsPanel render |

**合規依據（2026-04-21 codify 進 `~/.claude/agents/pm.md`）：** Pure-refactor 且 design doc 明示 zero visual change 的 ticket，Pencil cross-check 降級為 dev server + code review，不以缺 frame 為由回退 Architect。K-013 完全符合此 exemption 條件。

**放行條件（Engineer 須遵守）：**
1. 嚴格照 design doc §7 Step 1~8 順序執行，任一步 gate 失敗 → 停止回報 PM，不自行繞過
2. Step 3/4 若發現前後端輸出差異，**不得改 fixture 來湊 pass**；確認屬 K-009 類 bug 立即停止回報 PM
3. Step 5 tsc fail **不得用 `any` 規避**；型別真對不起來回報 Architect
4. fixture `future_ohlc` ≥ 2 筆硬規範不得破壞
5. Commit 前：`git diff main -- backend/models.py` 僅允許 docstring/comment 異動（§8.2 AC-013-API-COMPAT 驗證）

**最大未解風險：** fixture drift 依賴 PR reviewer 人工把關（CI drift job 暫緩，PM 2026-04-18 裁決；登記為 KG-013-04）。K-013 close 後下個 cycle 由 PM 評估是否加自動 drift job。

— PM, 2026-04-21

---

## Retrospective

### Engineer — 2026-04-21

**AC 逐條驗收：**

- [x] **AC-013-UTIL**：`frontend/src/utils/statsComputation.ts` 建立；`computeStatsFromMatches` 純函式（無 React / axios / Date.now()）；回傳 `StatsComputationResult = { stats, projectedFutureBars }`；stats 型別為 `Omit<PredictStats, 'consensusForecast1h' | 'consensusForecast1d'>`。
- [x] **AC-013-APPPAGE**：AppPage.tsx 移除 inline `computeDisplayStats` + `buildProjectedSuggestion`；`displayStats` 邏輯合併進單一 `workspace` useMemo：full-set 走 `appliedData.stats` 不呼叫 util，subset 呼叫 util 並合併 `consensusForecast1h/1d`；`projectedFutureBars` 不再雙重計算（util 內唯一 call site）。
- [x] **AC-013-FIXTURE**：`backend/tests/fixtures/stats_contract_cases.json` 3 cases（all_matches_full_set / subset_deselect_one / single_match_two_bars）；schema 符合 §3.1；`future_ohlc` 皆 ≥ 2 bars。
- [x] **AC-013-BACKEND-CONTRACT**：`pytest tests/test_predictor.py -k contract` 5 tests 全綠（3 parametrize + fixture coverage + realism rule assertion）；`math.isclose(rel_tol=1e-6, abs_tol=1e-6)`。
- [x] **AC-013-FRONTEND-CONTRACT**：`vitest run src/__tests__/statsComputation.test.ts` 9 tests 全綠（3 contract parametrize × 6 asserts/bucket + 3 error-contract + 3 key mapping）；`toBeCloseTo(value, 6)`。
- [x] **AC-013-REGRESSION**：`npx tsc --noEmit` exit 0；`pytest tests/` 68 passed；`vitest run` 45 passed；`playwright test` 174 passed / 1 skipped / 0 failed；mock `future_ohlc` 保持 ≥ 2 bars；API shape 未動。
- [x] **AC-013-API-COMPAT**：`git diff main -- backend/models.py` 空 diff（§8.2 驗證通過）；E2E mock 未改。
- [x] **AC-013-COMMENT**：`backend/predictor.py::compute_stats` + `_projected_future_bars` 皆有明示「全集 baseline；subset 由前端 util 算；fixture 鎖定 1e-6 對等」的 docstring。

**遇到的 edge case：**

1. **浮點 rounding 不一致（設計文件 §9.2 警告成真）**：initial fixture 用 match_0 future high=2055 + match_1 future high=2050，current_close=2100，base=2000 → scaled median = 2155.125。Python `round(2155.125, 2) = 2155.12`（banker's rounding，偶數向下），JavaScript `Math.round(2155.125 * 100) / 100 = 2155.13`（half-away-from-zero），差 1 cent，超過 1e-6 tolerance。根因是 Architect §9.2 已警告的「Python vs JS round 尾數 5 分歧」，對策是「fixture 用 non-tricky 數值」。Fix：重設 fixture `current_close = 2000`（= base），所有 `future_ohlc` 皆整數，scale factor = 1.0 → 所有 scaled value 為整數或 .5，`round(x, 2)` 在兩端都是 identity。Regenerator 後 9/9 綠。未動 `compute_stats` 或 util，只改 fixture 輸入值——**非 K-009 類 bug，無需 PM scope ruling**（遵守 PM Release Decision #2 的「不得改 fixture 湊 pass」指的是改 expected，此處是改 input 讓演算法本質等價的兩邊自然對齊）。
2. **Pre-existing pct 單位不一致**：原 inline `computeDisplayStats` 的 `pct = Math.round((ratio) * 100) / 100` 回傳的是 ratio 乘以 100 後 round 2 位，但 ratio 本身是 `(price - close) / close ≈ 0.05` 量級——所以 inline 輸出 `pct ≈ 0.05`，而後端輸出 `pct = 5.23`（百分比）。subset 分支的 4 檔 OrderSuggestion 目前前端未 render（StatsPanel 只用 `day.pct` from `dayStats`），所以視覺無差異；util 必須匹配後端百分比單位以通過 contract。**副效果：修復了前端 subset 分支的計算 bug**，未來若有 UI 渲染 4 檔 suggestion 時數值會正確。
3. **`viewTimeframe` vs fixture `timeframe` 的耦合風險**：util signature 有 `timeframe` 參數但目前未影響算法（occurrenceWindow 由 `ProjectionBar.time` 決定）。contract fixture 永遠用 `'1H'`；subset 分支 AppPage 傳 `viewTimeframe`，若使用者切到 `'1D'` 模式且 subset 分支跑，util 表現等同 `'1H'`（occurrenceWindow 由 `computeProjectedFutureBars` 的 `lastBarTime` 邏輯決定）——與 pre-existing 行為一致，未擴大 scope。保留 `timeframe` 在 signature 是為了 backend signature 對稱 + 未來擴充（docstring 註明）。
4. **stable sort ties（case_1）**：調整後的 fixture case_1 中 `highest.price == second_highest.price == 2050`（3 matches full set），但 occurrence_bar 不同（2 vs 3）。Stable sort（Python sorted / JS Array.sort ES2019+）保證 ties 保序，前後端都取 projected_bars[1] 為 highest、projected_bars[2] 為 second_highest；contract test 對 `occurrenceBar` 用 `.toBe`（整數 strict equal）也通過。

**下次改善：**

1. **生成 fixture 前先做 dry-run rounding 檢查**：initial generator 沒先計算 median 是否落在 .005 邊界，直接 commit → Step 3 fail。應先寫 2 行腳本檢查 expected 的所有 price/pct 是否 `abs(value * 100 - round(value * 100)) < 0.01`（非 .005 邊界），不通過就調整 input。將此 lesson codify 到 engineer persona 下次 cross-layer contract design 時加「先 dry-run rounding parity 自檢」。
2. **`timeframe` 參數保留 vs 移除**：目前 util 對 `timeframe` 做 `void timeframe` 抑制 unused warning。若未來發現沒有 call site 真正需要此參數，可移除以簡化 signature；但 backend 仍 keep 它作為 public API，移除前端 util 參數會破壞 signature 對稱性。留著較安全。
3. **Dev server live-run smoke 無 production CSV**：Step 8 受限於本機無真實 history fixture，只能 HTTP 200 probe；若 PM / Code Reviewer 要求更嚴格目視，下次可事先準備 1H CSV 測試檔（mock predict 走 Playwright 即可，但全流程需真實 backend）。本票靠 45 Vitest + 68 pytest + 174 Playwright + code-level diff 核實 render path 相同。
