---
id: TD-008-RFC
title: Consensus Forecast / Stats Single Source of Truth
status: accepted
type: rfc
author: senior-architect
created: 2026-04-18
accepted: 2026-04-18
accepted_by: PM
implements_ticket: K-013
related:
  - docs/tech-debt.md#td-008
  - docs/reviews/2026-04-18-code-review.md
  - docs/tickets/K-013-consensus-stats-contract.md
---

## 背景

Codex 2026-04-18 review 指出 projected future bar aggregation / stats derivation / time aggregation 前後端各有一份實作，長期有漂移風險。實際盤點：

**後端（backend/predictor.py）**
- `_projected_future_bars(matches, current_close)` — 將 matches 的 `future_ohlc` 對齊 current close，逐 bar 取 mean 得 consensus bars
- `compute_stats(matches, current_close, timeframe)` — 基於 projected bars 產 `OrderSuggestion` 4 檔（highest/second_highest/second_lowest/lowest）+ `win_rate` + `mean_correlation`
- 輸出寫入 `PredictStats.consensus_forecast_1h` / `consensus_forecast_1d` 回前端
- 計算**只發生一次**：`POST /api/predict` 時，針對**全部** top-N matches

**前端（frontend/src/AppPage.tsx`）**
- `projectedFutureBars` useMemo — 讀 `appliedSelection`（使用者勾選子集），重算一份 consensus bars
- `computeDisplayStats(matches, projectedBars, currentClose)` — 重算 highest/second_highest/second_lowest/lowest 四檔 + 將 `projectedFutureBars` 塞回 `consensusForecast1h`
- `displayStats` 在 `projectedFutureBars.length >= 2` 時用重算結果，否則 fallback 到後端 `appliedData.stats`

**根本觸發點：使用者在 MatchList 取消勾選部分 matches 時，stats 必須依 subset 重算。後端只接受 `selected_ids` 做 filter，但目前 `/api/predict` 未被再次呼叫，前端自己算。**

這不是單純 DRY 問題，而是「subset stats 誰來算」的架構決策。

---

## 選項

### Option A — Backend only，每次 selection change 觸發 API re-compute

**做法：**
- 新增 `POST /api/compute-stats`（輕量 endpoint）：input = `selected_match_ids` + `current_close` + `timeframe` + cached matches（或 session key），output = `PredictStats`
- 或直接讓現有 `/api/predict` 支援「skip similarity search，只重算 stats」的 mode（input 帶 existing matches + selected subset）
- 前端刪除 `computeDisplayStats` 與前端 aggregation 邏輯
- `displayStats` 直接 = 後端回傳

**Pros：**
- Single source of truth 真正統一
- `ForecastBar` 時間欄位由 backend 產出，徹底避免前後端時區轉換漂移（目前前端 `aggregation.ts` 有 UTC+8 格式化邏輯）
- 未來若 stats 算法變複雜（e.g. 加 confidence interval），改一處

**Cons：**
- **每次 click 產生 network round-trip**（目前前端即時回饋）— UX 體感下降約 100~300ms
- Backend 需要保存 match state（stateful）或要求前端 round-trip 傳回 matches payload（增加 request size）
- 新 endpoint 增加 surface area，需測試、rate limit、錯誤處理

### Option B — Frontend only，backend 不回傳 consensus_forecast / stats

**做法：**
- `/api/predict` 回傳改為純 matches（刪 `PredictStats.consensus_forecast_1h/1d` 與 OrderSuggestion）
- 前端 `computeDisplayStats` 成為唯一實作
- 後端 `compute_stats` 與 `_projected_future_bars` 刪除

**Pros：**
- 選單互動零 latency
- 減少 backend payload
- TypeScript 型別本來就完整，前端擁有所有資料

**Cons：**
- **後端測試 `test_predictor.py` 44 passed 中相當比例測 stats 邏輯，全部作廢需補前端等價測試**
- 若未來有「無頭 API 使用者」（script / 其他前端），他們需自行算 stats
- 前端 bundle 變重（目前 `aggregation.ts` 已有時間格式化、MA99 utils 等）
- 後端 reviewer / 維運者看不到「模型產出是什麼」只看到 raw matches

### Option C — Shared schema + 前端算 subset、後端只算全集（推薦）

**做法：**
1. `PredictStats` 保留 `consensus_forecast_1h/1d`，但語意明確標為「**全集**（all top-N matches）stats baseline」
2. Subset stats（使用者 deselect 時）由前端計算，但**抽出共用 schema 與純函式**：
   - 新增 `shared/stats-contract.ts`（或直接在 `frontend/src/utils/statsComputation.ts`）定義 `computeStatsFromMatches(matches, currentClose, timeframe) → PredictStats`
   - Backend `compute_stats` 作為**驗證 oracle**：新增 pytest parametrize 測試，把前端測試 fixture 餵進 backend，assert 兩邊輸出 bit-exact（或容忍 1e-6 浮點誤差）
3. 後端回傳 `consensus_forecast_1h/1d` 時間欄位改為 ISO UTC+0（已是）；前端統一一個 time formatter，backend 與 frontend 共用 fixture 驗證
4. 前端 `AppPage.tsx` 的 `displayStats` 邏輯簡化：
   - `appliedSelection == all matches` → 直接用 `appliedData.stats`（不重算）
   - `appliedSelection ⊂ all matches` → 呼叫 `computeStatsFromMatches(filteredMatches, ...)`

**Pros：**
- UX 零 latency（subset 計算在前端）
- 雙端實作由 contract test 鎖定，CI 自動抓漂移
- `/api/predict` 現有 payload 不變，向後相容
- 不刪 backend stats（保留對「無頭 user」的支援）

**Cons：**
- 維護兩份實作（用 contract test 緩解但非消除）
- Contract test fixture 需手動維護；如果 backend 改算法，fixture 漂移時 CI 會抓到但需人工 sync

---

## 推薦：Option C

**理由：** Option A 的 UX 退步（每次 click 100~300ms round-trip）不值得為了架構純粹性付出，且使用者場景是頻繁切 selection 做 what-if 分析。Option B 丟掉後端已寫好且測試覆蓋完整的 `compute_stats`（44 tests 相當比例靠它）是負投資。Option C 用 contract test 把「雙實作」這個技術債的風險降到 CI 層級，既保現有 UX 又鎖住漂移，是對當下 backlog 與使用者情境最平衡的方案。

---

## 實作影響範圍（Option C）

### 後端
- `backend/predictor.py` `compute_stats` / `_projected_future_bars` — **語意註記變更**（註解標為「全集 baseline」），邏輯不動
- `backend/tests/test_predictor.py` — 新增 contract fixture parametrize test：讀共用 JSON fixture → assert backend `compute_stats(...)` 輸出對等前端預期
- 新增 `backend/tests/fixtures/stats_contract_cases.json`（或放 `ClaudeCodeProject/shared/fixtures/`）

### 前端
- 新增 `frontend/src/utils/statsComputation.ts`（從 `AppPage.tsx` 抽出 `computeDisplayStats`，改名 `computeStatsFromMatches`，輸出型別 = backend `PredictStats` 的 camelCase 映射）
- `frontend/src/AppPage.tsx`：
  - `projectedFutureBars` useMemo 邏輯合併進 `computeStatsFromMatches`
  - `displayStats` useMemo 條件分支改為「全集 = appliedData.stats；subset = computeStatsFromMatches(...)」
  - 刪除 inline `computeDisplayStats`（~30 行）
- `frontend/src/__tests__/statsComputation.test.ts`（新增）— 讀同一份 JSON fixture，assert 輸出等於 fixture.expected

### API 欄位
- **無變更。** `PredictResponse` schema 與 `/api/predict` contract 完全不動。
- 欄位 mapping 表（architecture.md `Frontend ↔ Backend Field Mapping`）無需更新。

### Playwright 測試
- `frontend/e2e/*` — 現有 mock payload 不變；若 mock 中 `consensus_forecast_1h` 不符合新註解語意（「全集」）不影響測試通過
- 新增 E2E case 建議（非 blocking）：取消勾選一個 match 後，斷言 `StatsPanel` 的 `highest.price` 改變為 subset 結果

### 技術債相依
- TD-005 (AppPage.tsx 拆分) — 實作 Option C 時順手把 `statsComputation.ts` 抽乾淨後，`usePredictionWorkspace()` hook 拆分更清晰
- TD-006/007 (backend 拆分) — `compute_stats` 可直接搬到 `predictor_stats.py`，無 cross-layer 衝擊
- TD-004 (PredictorChart effect deps) — 無相依
- TD-003 (併發 race) — 無相依

---

## 排程建議

1. **先通過本 RFC**（PM 核准方案）→ 2026-04-18 或下個 cycle 開頭
2. 開 K-XXX ticket：實作 Option C（前端抽 util + backend contract test + fixture）
3. Ticket 驗收後，再啟動 TD-005 / TD-006 / TD-007 的拆分 RFC（各自獨立 RFC，由 Architect 接手）

---

## Open Questions（需 PM 裁決）

1. Contract fixture 放哪？
   - A. `backend/tests/fixtures/` — backend 優先
   - B. `ClaudeCodeProject/shared/fixtures/` — 明示共用（但專案目前無 `shared/` 目錄）
   - **推薦 A**：不新增目錄層級，frontend test 用 relative path 讀即可。
2. 是否要在 CI 加 contract drift job（backend 改 `compute_stats` 算法時強制同步 fixture）？
   - 推薦「下個 phase 再加」，先靠 PR reviewer 人工把關。

---

## Retrospective（待實作後補）

_本 RFC 被採用並實作後，由 Architect 回填以下欄位：_
- 哪個判斷後來需要修正
- 下次改善

### RFC 撰寫反省（2026-04-18）

**卡最久的環節：Option A vs C 的 UX/正確性取捨判定。**
最初直覺是 A（backend-only）最「乾淨」，但寫 Cons 時才想起使用者真實互動是頻繁 deselect 做 what-if 分析，每次 100~300ms round-trip 在這情境下會被感知為頓挫。實際上列三個 Option 有必要 — B（frontend-only）雖然最後被否決，但逼我具體量化「backend 44 tests 中相當比例靠 compute_stats」這件事，成為否決 B 的具體理由，也順帶加強 C 的論證。若一開始直接收斂到 C，Cons 清單可能不夠尖銳。

**現在回看最需要調整的決策：contract test fixture 放 `backend/tests/fixtures/` 的理由。**
當下選 A 是為了「不新增目錄層級」，但這假設了 fixture 的「擁有者」是 backend。實際上 fixture 是**雙端共同契約**，放在 backend 目錄語意上偏向「backend test 的輔助資料」，frontend 用 relative path `../../../backend/tests/fixtures/...` 讀會讓前端工程師困惑 fixture 歸屬。此外當 TD-007 把 `compute_stats` 搬到 `predictor_stats.py` 時，fixture 跟著搬還是留原地？當下未明講。

另一個未充分討論的邊界是 **camelCase ↔ snake_case 的覆蓋**：fixture expected 若用 snake_case（backend 原生），前端測試需先做 key 轉換再 assert，等於在測試層又引入一層「轉換邏輯」，若轉換本身有 bug（例如 `historical_ma99_1d` → `historicalMa991d` 這種數字結尾的 corner case），fixture 鎖不住。RFC 未明示 fixture 的 key 語言歸屬。

**下次寫 cross-layer RFC 的改善：**
1. Fixture 位置選項應多一個「新增 `shared/fixtures/`」並明確比較三者 ownership 語意，而非只列「不新增目錄層級」vs「新增 `shared/`」二選一。
2. 任何跨語言 contract test 必須在 RFC 明示「fixture 的 canonical key 是 snake 還是 camel」，並列一個具體的數字後綴欄位（`historical_ma99_1d` / `futureOhlc1d`）作為 key 轉換 regression case。
3. Option 比較表建議先列「使用者互動頻率」作為第一個評估軸 — 本次若一開始就寫出「使用者每個 session 預期 deselect N 次」的量化估計，Option A 的 UX 退步就不必走到 Cons 才被發現。

---

## PM 裁決（2026-04-18）

**裁決結果：接受 Option C（shared schema + 前端算 subset + 後端算全集 + contract test）**

### 核心方案

| 面向 | 裁決 |
|------|------|
| 方案選擇 | **Option C**（Architect 推薦、使用者已同意排入本 cycle） |
| 裁決理由 | UX 零 latency（subset 計算留前端）+ CI 可鎖漂移 + `/api/predict` payload 向後相容；Option A 的 100–300ms round-trip 在 what-if 分析情境下體感退步過明顯，Option B 丟棄後端 44 tests 是負投資 |

### Open Questions 拍板

| # | 問題 | Architect 推薦 | PM 裁決 |
|---|------|---------------|---------|
| 1 | Contract fixture 放哪？ | A. `backend/tests/fixtures/` | **接受 A**。不新增 `shared/` 目錄層級，前端 test 以 relative path 讀同一份 JSON；需求明確時再抽 `shared/` |
| 2 | 是否在 CI 加 contract drift job？ | 下個 phase 再加 | **接受暫緩**。本 cycle 靠 PR reviewer 人工把關 + 兩端測試同吃 fixture 時自動失敗作為安全網；K-013 實作完成後若仍覺需要，下個 cycle 起 RFC 加 CI job |

### 實作授權

- 對應 ticket：[K-013](../tickets/K-013-consensus-stats-contract.md)
- 負責人：Engineer（實作）、senior-engineer agent（code review）
- 預估大小：M（中）
- 相依：不 block 其他票；與 TD-005 有協同（TD-005 啟動時，`usePredictionWorkspace()` 邊界會以 K-013 的 `statsComputation.ts` 為基礎再拆分）
- 排程：K-013 放在 K-010 → K-009 → K-011 → K-012 之後（改動最大，放最後）

### 後續 RFC 順序

K-013 驗收後依序啟動：
1. TD-005（AppPage.tsx 拆分 RFC，Architect）
2. TD-006 + TD-003（backend/main.py 拆分 + 併發 race，合併同 RFC）
3. TD-007（predictor.py 拆分；contract fixture 需同步遷移）

— PM, 2026-04-18
