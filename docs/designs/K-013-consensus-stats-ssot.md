---
id: K-013-DESIGN
title: Consensus / Stats Single Source of Truth — Architecture Design
type: design
author: senior-architect
created: 2026-04-21
status: ready-for-engineer
implements_ticket: K-013
supersedes: TD-008 RFC §實作影響範圍 (K-013 ticket Architecture Review section)
related:
  - docs/designs/TD-008-rfc-consensus-source-of-truth.md
  - docs/tickets/K-013-consensus-stats-contract.md
  - docs/reviews/2026-04-18-code-review.md
  - agent-context/architecture.md
---

## 0 Pre-Design Audit / Confirmed Scope

### 0.1 Files inspected (source of truth)

| Source | Read at | Key finding |
|--------|---------|-------------|
| `docs/tickets/K-013-consensus-stats-contract.md` | 2026-04-21 | AC + 預期異動檔案清單為契約 |
| `docs/designs/TD-008-rfc-consensus-source-of-truth.md` | 2026-04-21 | Option C 已由 PM accepted；fixture 位置 A；CI drift job 暫緩 |
| `backend/predictor.py` L271–437 | 2026-04-21 | `_projected_future_bars` + `compute_stats` 真實邏輯 |
| `backend/main.py` L280–311 | 2026-04-21 | `/api/predict` 呼叫 `compute_stats(active, current_close, timeframe)` |
| `backend/models.py` | 2026-04-21 | `PredictStats.consensus_forecast_1h/1d: List[ForecastBar] = []` |
| `frontend/src/AppPage.tsx` L110–236 | 2026-04-21 | `computeDisplayStats` + `projectedFutureBars` + `displayStats` useMemo |
| `frontend/src/utils/aggregation.ts` | 2026-04-21 | `computeProjectedFutureBars` / `aggregateProjectedBarsTo1D` |
| `frontend/src/hooks/usePrediction.ts` L91–92 | 2026-04-21 | `consensusForecast1h/1d` 從後端 `consensus_forecast_1h/1d` 映射 |
| `frontend/src/types.ts` | 2026-04-21 | `PredictStats` camelCase 契約 |

### 0.2 Ticket 筆誤 / 路徑勘誤

| Ticket 字樣 | Codebase 實況 | 本文件採用 |
|------------|--------------|-----------|
| （無路徑筆誤） | — | — |

### 0.3 Scope Questions — pre-existing gap 需 PM 知情

**SQ-013-01（RETRACTED 2026-04-21 by Round 2 Fix 1 `853a8aa`；此段留底僅作歷史證據）：**

~~後端 `PredictStats.consensus_forecast_1h/1d` 目前永遠是 `[]` → 全集下不顯示 consensus 圖（pre-existing）。~~

**更正（Round 2 Fix 1 建立的事實）：**

- OLD base `b0212bb` `AppPage.tsx` L224-226 `displayStats` useMemo 實際對 **full-set 與 subset 兩條分支皆 unconditional 注入** `consensusForecast1h = projectedFutureBars` + `consensusForecast1d = projectedFutureBars1D`；後端 `consensus_forecast_1h/1d` 始終為 `[]` 是 wire-level 事實，但對使用者可觀測的 chart render 並無影響 — frontend 無條件覆寫此兩欄位。
- 原設計文件推論「全集分支走 `appliedData.stats` → chart 收到 `[]` → 不顯示」是僅讀後端 schema + `usePrediction.ts` fallback 未 cross-verify OLD AppPage observable 行為的誤判；Round 1 `8442966` 把注入綁死 subset 分支 → 全集分支 chart 確實消失 → 觸發 C-1 Critical。
- Round 2 Fix 1 `853a8aa` 於 `AppPage.tsx` 恢復無條件注入（spread base stats + 兩欄位覆寫），觀察行為已對齊 OLD base。
- **正確 pre-existing 描述：** `consensus_forecast_1h/1d` **wire-level 永遠是 `[]`**（後端未填），但 **observable chart render 由前端 `AppPage.tsx` 注入 `projectedFutureBars` / `projectedFutureBars1D` 保證**；full-set 與 subset 兩分支皆注入；subset 分支另加 `computeStatsFromMatches` 回傳的 subset stats 合併。無「全集下不顯示 consensus 圖」的 pre-existing bug。
- **對 fixture 影響（保留）：** `expected.consensus_forecast_1h/1d` 在 fixture 中統一以 `[]` 鎖定（snake_case，與後端 wire-level 輸出一致），contract test 只鎖 4 檔 OrderSuggestion + `win_rate` + `mean_correlation`。observable render 層的 `consensusForecast1h/1d` 注入屬 `AppPage` 職責，contract fixture 不涵蓋。

**SQ-013-02（資訊性，non-blocking）：fixture 產生腳本是否入版？**

- 觀察：ticket §下一棒 2 指示「以當前後端 `compute_stats` 輸出作為 ground truth，`python3 -c "..."` 匯出」。
- 問題：該腳本若不入版，後端改算法 → fixture 漂移 → 測試失敗時，下游無法重現 ground truth。
- **本文件裁決：** 新增 `backend/tests/fixtures/generate_stats_contract_cases.py`（輕量 script，入版），可重複執行重新產生 JSON。見 §3.3 與 §4。若 PM 反對入版，降級為 design doc inline pseudo-code；不 block Engineer。

---

## 1 解決方案選型

### 1.1 可行選項

TD-008 RFC 已比較 Option A / B / C，PM 2026-04-18 已裁決採 Option C。本設計不再重開選項，僅在 Option C 框架內進一步拆解三個子決策：

| 子決策 | 選項 | 選擇 |
|--------|------|-----|
| D1 `statsComputation.ts` 是否為純 util（無 React） | A. 純 util / B. custom hook | **A 純 util**（見 §1.2 D1） |
| D2 fixture 產生方式 | A. 一次性 manual commit / B. 入版 generator script | **B generator script**（見 §1.2 D2） |
| D3 前端讀 fixture 的 import 方式 | A. `import` JSON（build-time） / B. `fs.readFileSync`（runtime） / C. `fetch`（網路） | **A import JSON**（見 §1.2 D3） |

### 1.2 子決策 Pre-Verdict 與理由

**D1：statsComputation.ts 定位 — 純 TypeScript util 無 React 依賴**

| 面向 | A. 純 util | B. custom hook |
|------|-----------|---------------|
| 測試性 | Vitest 單元測試可直呼 | 需 renderHook |
| TD-005 共用性 | `usePredictionWorkspace()` 之後可從 hook 內呼叫此 util | hook 巢狀，邊界不清 |
| SSR 相容 | 可 | 不可 |
| **Score（測試性 0.4 + TD-005 共用性 0.4 + SSR 0.2）** | **9.0** | **5.0** |

差距 ≥ 1，直接採 A。

**D2：fixture 產生 — generator script 入版**

| 面向 | A. manual 一次性 commit | B. generator script 入版 |
|------|----------------------|---------------------|
| 初次產生成本 | 低 | 略高（~20 行 Python） |
| 後端改算法時重現 ground truth | 需翻 git history | 一鍵重跑 |
| 防漂移同步成本 | 高（人工算） | 低 |
| **Score（重現成本 0.5 + 同步成本 0.3 + 初次成本 0.2）** | **5.5** | **8.5** |

差距 ≥ 1，直接採 B。

**D3：前端讀 fixture — `import` JSON（build-time）**

| 面向 | A. import JSON | B. fs.readFileSync | C. fetch |
|------|---------------|-------------------|---------|
| 路徑穩定性 | Vite/Vitest 支援相對 import | 需 Node API，Vitest jsdom 環境 OK 但較繞 | 需 dev server |
| 改 fixture 重跑速度 | HMR | 需 rerun | 需 server |
| TypeScript 型別 | 需 `resolveJsonModule: true` 或 `as const` | any | any |
| **Score（路徑穩定性 0.5 + 速度 0.3 + 型別 0.2）** | **9.0** | **6.0** | **4.5** |

差距 ≥ 1，直接採 A。需確認 `tsconfig.json` 有 `"resolveJsonModule": true`（若無則 Engineer 補；見 §3.4）。

---

## 2 Contract 契約定義

### 2.1 函式簽名（TypeScript）

```ts
// frontend/src/utils/statsComputation.ts
import { MatchCase, PredictStats } from '../types'
import { ProjectionBar } from './aggregation'

export interface StatsComputationResult {
  // 4 檔 + winRate + meanCorrelation（與 backend PredictStats 對應，camelCase）
  stats: Omit<PredictStats, 'consensusForecast1h' | 'consensusForecast1d'>
  // 前端獨有：AppPage 需要用於 StatsPanel ConsensusForecastChart 與 StatsByDay
  projectedFutureBars: ProjectionBar[]
}

/**
 * Subset stats computation. Pure function — no React, no I/O, no Date.now().
 *
 * Mirrors backend `compute_stats(matches, current_close, timeframe)` for the
 * 4-bucket OrderSuggestion + win_rate + mean_correlation outputs. Contract
 * fixture `backend/tests/fixtures/stats_contract_cases.json` locks bit-exact
 * parity (1e-6 tolerance) between backend `compute_stats` and this function.
 *
 * Additionally returns `projectedFutureBars` (frontend-only extension) that
 * AppPage merges into `displayStats.consensusForecast1h/1d` for chart render;
 * this extension is NOT part of the contract fixture.
 *
 * @param matches subset of MatchCase (>= 1)
 * @param currentClose last bar close price of user input
 * @param timeframe '1H' | '1D' — passed to occurrenceWindow label
 * @param lastBarTime optional; user input last bar time, used for UTC+8 label
 * @returns stats + projectedFutureBars; throws if matches empty OR bars < 2
 */
export function computeStatsFromMatches(
  matches: MatchCase[],
  currentClose: number,
  timeframe: '1H' | '1D',
  lastBarTime?: string,
): StatsComputationResult
```

### 2.2 邊界行為契約

每條皆須由 Engineer 於實作時顯式處理；**不得 "TBD"**：

| 邊界 | 契約行為 |
|------|---------|
| `matches.length === 0` | `throw new Error('At least one match is required to compute statistics.')` — 與後端 `compute_stats` 訊息一致 |
| `matches.length === 1`（single-match） | 若其 `futureOhlc.length < 2` → `throw new Error('At least two future bars are required to build order suggestions.')` — 與後端一致 |
| `matches.length >= 1` 但 `projectedFutureBars.length < 2` | 同上 throw |
| `currentClose === 0` 或 NaN | `throw new Error('currentClose must be a positive finite number.')` |
| `matches[i].historicalOhlc` 空 | 該 match 在 `computeProjectedFutureBars` 內已被 filter（base=undefined）；若全部被 filter 則 `projectedFutureBars.length === 0`，轉上一行處理 |
| `correlation` 為 `null` / 未定義 | filter 掉後仍算 `meanCorrelation`；全部為 null → `meanCorrelation = 0`（與後端 `statistics.mean(corrs)` 邏輯對等；後端若 corrs 空會 raise StatisticsError，本文件約定前端改為 0 並記於 fixture Edge case #4 供 PM 日後裁決是否收斂） |
| `lastBarTime` 未提供 | `occurrenceWindow` 降級為 `Hour +N` / `Day +N`（與後端 `_future_window_label` 相同） |

**AppPage 呼叫點職責：**
- AppPage `displayStats` useMemo：subset 分支呼叫 util，捕獲 throw 時 fallback 到 `appliedData.stats`（與目前 `if (!computed) return appliedData.stats` 行為一致）
- `consensusForecast1h = projectedFutureBars`（ProjectionBar 上 `time` 為 UTC+8 "MM/DD HH:MM" display 格式，符合 `ForecastBar.time: string` 寬鬆型別；StatsPanel 僅用於 render，不再解析）
- `consensusForecast1d = aggregateProjectedBarsTo1D(projectedFutureBars)`（由 AppPage 於 util 外額外呼叫，util 不內嵌此步驟以保純粹性）

### 2.3 欄位映射表（snake_case ↔ camelCase）

**ContractInputCase（fixture `input` 欄位）**

| Fixture JSON (snake_case) | 前端讀取後轉換為 (camelCase) | 備註 |
|-------------------------|--------------------------|------|
| `matches` | `matches` | 陣列，每項含下列 MatchCase 欄位 |
| `matches[i].id` | `matches[i].id` | 同名 |
| `matches[i].correlation` | `matches[i].correlation` | 同名 |
| `matches[i].historical_ohlc` | `matches[i].historicalOhlc` | `OhlcBar[]` |
| `matches[i].future_ohlc` | `matches[i].futureOhlc` | `OhlcBar[]` |
| `matches[i].historical_ohlc_1d` | `matches[i].historicalOhlc1d` | `OhlcBar[]`（可空陣列） |
| `matches[i].future_ohlc_1d` | `matches[i].futureOhlc1d` | `OhlcBar[]`（可空陣列） |
| `matches[i].start_date` | `matches[i].startDate` | string |
| `matches[i].end_date` | `matches[i].endDate` | string |
| `matches[i].historical_ma99` | `matches[i].historicalMa99` | `(number \| null)[]`（fixture 可省略；預設 []） |
| `matches[i].future_ma99` | `matches[i].futureMa99` | 同上 |
| `matches[i].historical_ma99_1d` | `matches[i].historicalMa991d` | 同上 |
| `matches[i].future_ma99_1d` | `matches[i].futureMa991d` | 同上 |
| `current_close` | `currentClose` | float |
| `timeframe` | `timeframe` | `"1H"` \| `"1D"` |

**ContractExpectedCase（fixture `expected` 欄位，= 後端 `PredictStats` 輸出）**

| Fixture JSON (snake_case) | 前端轉換後 (camelCase) | 備註 |
|-------------------------|--------------------|------|
| `highest.label` | `highest.label` | string |
| `highest.price` | `highest.price` | float |
| `highest.pct` | `highest.pct` | float（後端 `round(..., 2)`） |
| `highest.occurrence_bar` | `highest.occurrenceBar` | int |
| `highest.occurrence_window` | `highest.occurrenceWindow` | string（e.g. `"Hour +3"` / `"Day +5"`） |
| `highest.historical_time` | `highest.historicalTime` | string `"Consensus"` |
| `second_highest` / `second_lowest` / `lowest` | `secondHighest` / `secondLowest` / `lowest` | 同 highest 結構 |
| `win_rate` | `winRate` | float（後端 `round(..., 4)`） |
| `mean_correlation` | `meanCorrelation` | float（後端 `round(..., 4)`） |
| `consensus_forecast_1h` | `consensusForecast1h` | wire-level 固定 `[]`（見 §0.3 SQ-013-01 RETRACTED 更正段），**不進 contract test 比對**；observable render 由 `AppPage` 注入 `projectedFutureBars` 保證 |
| `consensus_forecast_1d` | `consensusForecast1d` | 同上；observable 由 `AppPage` 注入 `projectedFutureBars1D` |

**Key 轉換工具：** 前端 contract test 使用 inline helper `snakeToCamelStats()` 針對 6 個 key（highest / second_highest / second_lowest / lowest + win_rate + mean_correlation + 每個 OrderSuggestion 內 occurrence_bar/occurrence_window/historical_time）做轉換。**不引入 lodash/camelcase-keys**（bundle 成本 > 自寫 30 行）。轉換邏輯附 regression case：數字結尾 key 如 `consensus_forecast_1h` → `consensusForecast1h`（whitelist 式 mapping，不用通用 algo）。

---

## 3 Fixture JSON Schema

### 3.1 JSON schema（fixture 檔格式）

**檔案：** `backend/tests/fixtures/stats_contract_cases.json`

```jsonc
[
  {
    "name": "all_matches_full_set",
    "description": "全集 baseline — 3 matches，每個 future_ohlc 有 3 bars（≥2 強制要求）",
    "input": {
      "matches": [
        {
          "id": "match_0",
          "correlation": 0.9523,
          "historical_ohlc": [
            {"open": 2000, "high": 2010, "low": 1990, "close": 2005, "time": "2024-01-01 00:00"},
            {"open": 2005, "high": 2015, "low": 1995, "close": 2010, "time": "2024-01-01 01:00"}
          ],
          "future_ohlc": [
            {"open": 2010, "high": 2030, "low": 2005, "close": 2025, "time": "2024-01-01 02:00"},
            {"open": 2025, "high": 2040, "low": 2020, "close": 2035, "time": "2024-01-01 03:00"},
            {"open": 2035, "high": 2045, "low": 2025, "close": 2028, "time": "2024-01-01 04:00"}
          ],
          "historical_ohlc_1d": [],
          "future_ohlc_1d": [],
          "start_date": "2024-01-01 00:00",
          "end_date": "2024-01-01 04:00"
        }
        /* ...match_1, match_2 省略，實際須 3 個具體 match */
      ],
      "current_close": 2100,
      "timeframe": "1H"
    },
    "expected": {
      "highest": {
        "label": "Highest",
        "price": /* generator 計算 */,
        "pct": /* generator 計算 */,
        "occurrence_bar": /* generator */,
        "occurrence_window": "Hour +N",
        "historical_time": "Consensus"
      },
      "second_highest": { /* ... */ },
      "second_lowest": { /* ... */ },
      "lowest": { /* ... */ },
      "win_rate": /* generator */,
      "mean_correlation": /* generator */,
      "consensus_forecast_1h": [],
      "consensus_forecast_1d": []
    }
  },
  /* ...Case 2 (subset_deselect_one), Case 3 (single_match_two_bars) */
]
```

### 3.2 必涵蓋的 3 個 case（符合 AC-013-FIXTURE）

| # | name | 覆蓋意圖 | input.matches 組成 | 目的 |
|---|------|---------|-------------------|------|
| 1 | `all_matches_full_set` | 全集 baseline | 3 matches × 各 3 future bars，correlation 分散 [0.95, 0.87, 0.72] | 驗證「deselect 為空」時兩端相等；當 `appliedSelection == all matches` 時 AppPage 走 `appliedData.stats` 而不呼叫 util，但 contract test 仍驗證「若呼叫 util 傳全集，結果 = 後端全集輸出」——即 oracle equivalence |
| 2 | `subset_deselect_one` | subset matches | 2 matches（從 Case 1 取前 2 個），其他同 | 驗證「deselect 第 3 個」時兩端相等 — K-013 的實際運行情境 |
| 3 | `single_match_two_bars` | single match + future_ohlc 正好 2 bars 邊界 | 1 match × 2 future bars（≥2 最小邊界） | 鎖住「≥2 bars 才 build suggestion」臨界；確認 sorted_highs[1] / sorted_lows[1] 在 len==2 時各取唯一 bar 的 high/low |

Edge Case #4（non-mandatory，若 generator 時間允許）：
| # | name | 覆蓋意圖 |
|---|------|---------|
| 4 | `all_correlations_null_fallback` | 所有 match `correlation = null` — 驗證 §2.2 「全部 null → meanCorrelation = 0」前端契約；**但後端 `statistics.mean([])` 會 raise StatisticsError**，故此 case 若加入須以 `expected.expected_error` 結構表達而非 `expected` 結果。**本票不實作 Case 4**，僅在文件層級備註為 future work。

### 3.3 Generator script（新增入版）

**檔案：** `backend/tests/fixtures/generate_stats_contract_cases.py`

```python
# 偽代碼 — Engineer 照此結構實作
# 職責：用硬編的 matches 原料餵給 compute_stats，把輸出序列化為 JSON
#       不依賴 MOCK_HISTORY / find_top_matches，完全 deterministic
from predictor import compute_stats
from models import MatchCase, OHLCBar
import json

def build_case_1():
    matches = [MatchCase(...), MatchCase(...), MatchCase(...)]  # 硬編 3 matches
    stats = compute_stats(matches, current_close=2100, timeframe='1H')
    return {
        'name': 'all_matches_full_set',
        'description': '...',
        'input': {
            'matches': [m.model_dump() for m in matches],
            'current_close': 2100,
            'timeframe': '1H',
        },
        'expected': stats.model_dump(),  # 含 consensus_forecast_1h/1d = []
    }

def build_case_2():  # subset（取 Case 1 前兩個 match）
    ...

def build_case_3():  # single match × 2 future bars
    ...

if __name__ == '__main__':
    cases = [build_case_1(), build_case_2(), build_case_3()]
    with open('backend/tests/fixtures/stats_contract_cases.json', 'w') as f:
        json.dump(cases, f, indent=2)
```

**執行：** `cd backend && python3 tests/fixtures/generate_stats_contract_cases.py`

**Gate：** generator script 自身不受 contract test 覆蓋（它是 test setup，不是 test target）；後端修改 `compute_stats` 後，Engineer 重跑 generator → `git diff fixtures/*.json` 檢查語意合理 → commit 同批；前端測試若因新 expected 而 fail，順便更新 camelCase 映射（若有欄位新增）。

### 3.4 前端讀 fixture

**Path：** `frontend/src/__tests__/statsComputation.test.ts`

```ts
// 偽代碼
import fixtures from '../../../backend/tests/fixtures/stats_contract_cases.json'
// 上式需 tsconfig.json 有 "resolveJsonModule": true；Engineer 檢查，若無則啟用
// Vite / Vitest 皆支援 import JSON，無需特殊 loader
```

**Engineer 須驗證：** `frontend/tsconfig.json` → `compilerOptions.resolveJsonModule: true`。若目前未啟用，在 K-013 範圍內啟用即可（無破壞性）。

---

## 4 File Change List — Before / After

### 4.1 新增檔案

| Path | 責任 | 大小估 |
|------|------|-------|
| `frontend/src/utils/statsComputation.ts` | Export `computeStatsFromMatches()` 純 util；型別 `StatsComputationResult`；無 React / axios / Date.now() | ~90 行 |
| `frontend/src/__tests__/statsComputation.test.ts` | Vitest parametrize：讀 fixture JSON，對 3 cases 跑 `computeStatsFromMatches` 並 assert bit-exact（1e-6 tolerance） + camelCase 轉換 helper + helper unit test（`consensus_forecast_1h` → `consensusForecast1h`） | ~80 行 |
| `backend/tests/fixtures/stats_contract_cases.json` | 3 case fixture（由 generator script 產出）；snake_case | ~200 行（JSON） |
| `backend/tests/fixtures/generate_stats_contract_cases.py` | Deterministic script；呼叫 `compute_stats` 產生 `expected` | ~70 行 |
| `backend/tests/fixtures/__init__.py` | 空檔；讓 `tests/fixtures/` 成為 importable package（pytest 不強制需要但對 editor 友好） | 0 行 |

### 4.2 修改檔案

| Path | Before | After |
|------|--------|-------|
| `frontend/src/AppPage.tsx` | L110–125 inline `computeDisplayStats`；L211–222 `projectedFutureBars` useMemo；L224–236 `displayStats` useMemo 中 subset 分支 inline 重算 | 移除 L110–125 inline function；L211–222 `projectedFutureBars` useMemo 改為：若 subset 分支，呼叫 util 並取 `result.projectedFutureBars`；`displayStats` useMemo subset 分支改呼叫 `computeStatsFromMatches` 取 `result.stats` + 合併 `consensusForecast1h/1d`（由 util 回傳的 projectedFutureBars + `aggregateProjectedBarsTo1D` 算）。**全集分支不變**（直接用 `appliedData.stats`） |
| `backend/predictor.py` | `compute_stats` / `_projected_future_bars` 無語意註解 | 補 docstring：`compute_stats` 頭標示「回傳為全集 baseline；subset 由前端 `frontend/src/utils/statsComputation.ts::computeStatsFromMatches` 計算；兩者由 `backend/tests/fixtures/stats_contract_cases.json` 鎖定對等」；`_projected_future_bars` 同類註解 |
| `backend/tests/test_predictor.py` | 44 個測試，無 contract fixture | 新增一個 `@pytest.mark.parametrize` 測試 `test_compute_stats_contract_fixture(case)`：讀同一份 JSON，對每個 case 呼叫 `compute_stats(**input)`，assert 欄位值 bit-exact（math.isclose rel_tol=1e-6） |
| `frontend/tsconfig.json` | 可能缺 `resolveJsonModule` | 若缺則加 `"resolveJsonModule": true`（若已在則不動） |

### 4.3 不動檔案（明示邊界）

| Path | 為何不動 |
|------|---------|
| `backend/main.py` `/api/predict` 路由 | API schema 不變（AC-013-API-COMPAT） |
| `backend/models.py` `PredictStats` / `ForecastBar` | 型別不變 |
| `frontend/src/types.ts` | `PredictStats` 型別不變 |
| `frontend/src/hooks/usePrediction.ts` | snake→camel 映射不變（`consensusForecast1h/1d` 依然 fallback 為 `[]`） |
| `frontend/src/components/StatsPanel.tsx` | render 契約不變（subset 分支從 util 拿到 `consensusForecast1h/1d`，全集分支依然空陣列 — pre-existing 行為） |
| `frontend/src/utils/aggregation.ts` `computeProjectedFutureBars` / `aggregateProjectedBarsTo1D` | util 內部呼叫，不搬家避免牽動其他測試 |
| `frontend/e2e/*.spec.ts` | mock payload shape 不變；`future_ohlc` ≥ 2 規範繼續遵守（既有 mock 已符合） |
| `frontend/src/__tests__/AppPage.test.tsx` | 行為測試不變 — `computeDisplayStats` 搬家對外部觀察無差 |

---

## 5 Shared Component 邊界

### 5.1 `statsComputation.ts` 定位表

| 面向 | 定位 |
|------|------|
| 類別 | **Pure utility module**（非 React component，非 custom hook） |
| 依賴 | `../types`（MatchCase / PredictStats / OrderSuggestion）、`./aggregation`（ProjectionBar + `computeProjectedFutureBars`） |
| 禁用 | React / useState / useMemo / axios / fetch / localStorage / Date.now() / Math.random() / console.log |
| 被誰呼叫 | (a) `AppPage.tsx::displayStats` useMemo 的 subset 分支；(b) `__tests__/statsComputation.test.ts` contract test；(c) **未來** TD-005 `usePredictionWorkspace()` hook（見 §5.2） |
| 誰可以呼叫 | 任何純同步 context；**不得**從 useEffect / callback 內替代 axios |
| 可否拋錯 | 可（契約在 §2.2），呼叫方必須 try-catch |

### 5.2 與 TD-005 `usePredictionWorkspace()` 的邊界

K-013 只抽 util，不開始 TD-005。但 util 需為 TD-005 hook 拆分鋪墊。分界如下：

| 職責 | 歸屬 | 說明 |
|------|------|------|
| 輸入 OHLC 管理 / MA99 loading / API call | 未來 `useOfficialInput()` + `useHistoryUpload()` hooks | K-013 不動；目前在 AppPage.tsx |
| `appliedData` / `appliedSelection` state | 未來 `usePredictionWorkspace()` hook | K-013 不動 |
| `displayStats` / `projectedFutureBars` / `projectedFutureBars1D` derivation | 未來 `usePredictionWorkspace()` hook | K-013 保留 useMemo 在 AppPage，TD-005 時搬進 hook |
| **subset stats 的數學核心** | **K-013 `statsComputation.ts` util** | **現在抽出，未來 hook 從此 util 呼叫** |
| `StatsPanel` render | `StatsPanel` component | K-013 不動 |

**TD-005 Architect（未來）須遵守：** `statsComputation.ts` 不併入 hook，保持 util 身份 — 讓將來若出現第二個使用情境（例如 CLI tool / SSR / 其他頁面）可直接 import。

### 5.3 呼叫樹（Before → After）

**Before（K-013 前）：**
```
AppPage.tsx
  ├─ computeDisplayStats (inline function) — 重算 4 suggestions
  ├─ projectedFutureBars useMemo — 呼叫 computeProjectedFutureBars(aggregation.ts)
  └─ displayStats useMemo
      ├─ subset: 使用 computeDisplayStats(matches, projectedFutureBars, currentClose)
      └─ full: 使用 appliedData.stats（後端）
```

**After（K-013 後）：**
```
AppPage.tsx
  ├─ projectedFutureBars useMemo ─┐
  └─ displayStats useMemo         │
      ├─ subset branch ───────────┼──→ statsComputation.ts::computeStatsFromMatches
      │                           │       └─ 內部呼叫 aggregation.ts::computeProjectedFutureBars
      │                           │       └─ 回傳 { stats, projectedFutureBars }
      └─ full branch → appliedData.stats (unchanged)

統一 projectedFutureBars：AppPage useMemo 改為「呼叫 util 取其 result.projectedFutureBars」，
避免雙重呼叫 computeProjectedFutureBars。
```

---

## 6 Route Impact Table

本票不涉及 `index.css` / `tailwind.config.js` / 全站 CSS variable；無視覺變更預期。但仍依 persona 規則列表確認：

| Route | Status | Rationale |
|-------|--------|----------|
| `/` | **unaffected** | HomePage 不讀 `statsComputation.ts`；不引用 `displayStats` |
| `/about` | **unaffected** | AboutPage 純靜態內容 |
| `/diary` | **unaffected** | DiaryPage 讀 `public/diary.json`；無 stats |
| `/app` | **affected（行為等價）** | AppPage 改由 util 計算 subset stats，輸出值與既有 inline `computeDisplayStats` bit-exact 相同（contract fixture 鎖定）；視覺、UX、API 契約完全不變 |
| `/business-logic` | **unaffected** | BusinessLogicPage 純內容頁 |
| `/*` fallback | **unaffected** | Navigate to `/` |

**must-be-isolated：** 無。
**視覺驗證策略：** `/app` 執行 Playwright 全 45+ E2E 後，Engineer 手動進 dev server `/app` 截一張 stats panel 截圖對照 K-012 QA 留存的 baseline（無 baseline 則以 code review 確認 StatsPanel render path 相同為準）。

---

## 7 實作順序與驗證 Gate

呼應 ticket §下一棒 6 步，每步標註 gate。Engineer 照 Step 編號執行。

| Step | 動作 | 驗證 gate | 通過條件 |
|------|------|----------|---------|
| 1 | 新增 `frontend/src/utils/statsComputation.ts`（完整實作 `computeStatsFromMatches`），AppPage.tsx **尚未改動** | `npx tsc --noEmit` | exit 0；新檔 import 無錯 |
| 2 | 新增 `backend/tests/fixtures/__init__.py`（空檔） + `generate_stats_contract_cases.py` + 執行 generator 產出 `stats_contract_cases.json` | `python3 -m py_compile backend/tests/fixtures/generate_stats_contract_cases.py` → `python3 backend/tests/fixtures/generate_stats_contract_cases.py` | 兩者 exit 0；JSON 產出且含 3 case |
| 3 | 新增 `frontend/src/__tests__/statsComputation.test.ts`（讀 fixture，跑 3 case） | `cd frontend && npm test -- statsComputation` | Vitest pass；3 cases 每個 6 assertion 通過 |
| 4 | 新增 `backend/tests/test_predictor.py` contract parametrize test | `cd backend && python3 -m pytest tests/test_predictor.py -k contract` | 3 case 全 pass |
| 5 | 改寫 `AppPage.tsx`：刪 inline `computeDisplayStats`；`projectedFutureBars` + `displayStats` useMemo 改呼叫 util | `npx tsc --noEmit` + `cd frontend && npm test`（全部 Vitest） | tsc exit 0；AppPage.test.tsx + 其他所有 Vitest 全 pass |
| 6 | `backend/predictor.py` 補 docstring（`compute_stats` / `_projected_future_bars`） | `python3 -m py_compile backend/predictor.py` + `cd backend && python3 -m pytest` | 全 pytest（44 + 3 contract + 其他）pass |
| 7 | Regression：frontend 跑 `/playwright` | `cd frontend && npx playwright test` | 全 45+ E2E pass |
| 8 | 最終 smoke：開 dev server 目視 `/app` 預測流程 → 全集 → deselect 1 → deselect 全部 3 種操作 | 人工目視 StatsPanel 4 order cards 數字連動 | 無 runtime error；number 有合理變化 |

**失敗處置：**
- Step 3 / 4 任一 fail → 先 diff 前後端實作，不可改 fixture 來湊 pass；若確認演算法差異屬 K-009 類 bug 範疇（subset 情境下兩端算法實際不同），立刻停止並回報 PM（ticket §下一棒「實作守則」第 3 條）
- Step 5 `tsc` fail → 通常為型別對映疏漏，不得用 `any` 規避；若 type 真的對不起來（例如 `OhlcBar.time` 在 MatchCase 為 optional 但 util 需要），回報 Architect

---

## 8 API Schema 不變性證明

### 8.1 Before / After diff

| 面向 | Before | After | Diff |
|------|--------|-------|------|
| `POST /api/predict` request body schema | `PredictRequest`（`ohlc_data` / `selected_ids` / `timeframe` / `ma99_trend_override?`） | 同左 | **空** |
| `POST /api/predict` response body schema | `PredictResponse`（`matches` / `stats` / `query_ma99_*` / `query_ma99_gap_*`） | 同左 | **空** |
| `PredictStats` 欄位 | 4 × OrderSuggestion + `win_rate` + `mean_correlation` + `consensus_forecast_1h` + `consensus_forecast_1d` | 同左（wire-level `consensus_forecast_*` 維持 `[]`；observable render 由 AppPage 注入 — 見 §0.3 RETRACTED 更正段） | **空** |
| `compute_stats()` signature | `(matches: List[MatchCase], current_close: float, timeframe: str = '1H') -> PredictStats` | 同左 | **空** |
| 回傳值範圍 | 4 檔 OrderSuggestion 數值由演算法決定 | 同左（fixture 鎖定 bit-exact） | **空** |
| usePrediction.ts camelCase 映射 | L91–92 `consensus_forecast_*` fallback 為 `[]` | 同左 | **空** |

### 8.2 驗證方法

- **AC-013-API-COMPAT 證明：** `grep -n "class PredictRequest\|class PredictResponse\|class PredictStats\|class ForecastBar" backend/models.py` → 比對 HEAD 與 K-013 Engineer 最終 commit 的 diff，**此 5 個 class 區塊必須為 0 lines changed**（唯一可接受的變動是 comment / docstring）
- **E2E mock 不需動：** `frontend/e2e/*.spec.ts` 目前 mock `consensus_forecast_1h/1d` 未提供（或提供 `[]`），K-013 後此欄位後端仍回 `[]` → mock 不需改
- **Engineer commit 前檢查指令：** `git diff main -- backend/models.py` — 若輸出只含 docstring / comment，API schema 不變性成立

---

## 9 風險與注意事項

### 9.1 安全考量

| 項目 | 評估 |
|------|------|
| Auth / JWT 影響 | **無** — `/api/predict` 路由 auth requirement 不變（公開 endpoint） |
| env var / secret 暴露 | **無** — 不引入新 env var |
| Injection（JSON path、SQL、XSS） | **無** — fixture 路徑是 build-time import，非 user input |
| DoS（fixture 巨大） | **低** — 3 case，檔案 <5 KB |

### 9.2 常見錯誤面

| 面向 | 提醒 |
|------|------|
| snake→camel key 轉換 | **特別注意數字結尾 key**：`consensus_forecast_1h` → `consensusForecast1h`、`historical_ma99_1d` → `historicalMa991d`（TD-008 RFC Retrospective 已點名）。不可用通用 `replace(/_[a-z]/g, m => m[1].toUpperCase())`（它會把 `_1h` 轉成 `1h`，but 要先確認數字後的 `h` 不被移除）。採 whitelist mapping 最安全 |
| Float rounding | 後端 `round(price * 100) / 100`（Python `round` banker's rounding）vs 前端 `Math.round(x * 100) / 100`（half-to-even 但 JS 實際為 half-away-from-zero）。臨界值（尾數 .005）可能差 1 cent。**對策：** fixture 用 non-tricky 數值；contract test tolerance 1e-6；若真遇 .005 邊界差異，改以 `toBeCloseTo(expected, 6)` 取代嚴格比對 |
| `correlation === null` 路徑 | 後端 `statistics.mean([])` raise；前端 filter 後空陣列 fallback 0。**本票不測 Edge Case #4**（見 §3.2）；但 Engineer 實作時須確認 util 在空 correlations 情境下**不 throw**（回 0），否則全集分支 fallback 會永久生效 |
| JSON import TypeScript 型別 | Vitest + `resolveJsonModule: true` 會推斷 JSON 為其結構字面類；必要時用 `as unknown as ContractCase[]` 轉型 |
| Playwright mock `future_ohlc` ≥ 2 | 既有 mock 已符合；Engineer 若新增 mock 千萬不要退回 1 bar（會 silent bypass） |
| Inline `computeDisplayStats` 刪除後的 dead code | 刪除後 `buildProjectedSuggestion` 函式仍被 `computeStatsFromMatches` 需要 → **搬進 util 檔**；`computeStatsByDay` 邏輯**不動**（與 displayStatsByDay 綁定，本票範圍外） |

### 9.3 Known Gap（記錄 PM 知情，不 block Engineer）

| # | Gap | 來源 | 本票處置 |
|---|-----|------|---------|
| ~~KG-013-01~~ | ~~全集分支 `consensusForecast1h/1d` 為 `[]`，StatsPanel `ConsensusForecastChart` 無圖~~ | **Superseded by Round 2 Fix 1 `853a8aa` (2026-04-21)** — OLD base `b0212bb` L224-226 實為無條件注入，本票 Round 1 誤為 subset-only 注入造成 C-1；Fix 1 恢復 OLD 行為，observable chart 兩分支皆可見。premise 撤回，非 pre-existing gap | Closed — observable 已無此 gap；wire-level `consensus_forecast_*` 仍回 `[]` 為設計保留（AppPage 層注入 observable），不視為 debt |
| KG-013-02 | Float rounding 在 .005 邊界理論差異 | JS vs Python round 語意 | tolerance 1e-6 吸收；生產數據極少遇到（correlation / price 多位小數） |
| KG-013-03 | Edge Case #4（全 null correlations）未加 fixture | §3.2 | design note；future work |
| KG-013-04 | CI contract drift job 暫緩 | PM 2026-04-18 裁決 | 本 cycle 靠 PR reviewer + 雙端跑 fixture 自動失敗 |

---

## 10 Refactorability Checklist

- [x] **Single responsibility** — `statsComputation.ts` 僅職責：subset stats 計算；AppPage 僅職責：orchestrate
- [x] **Interface minimization** — `computeStatsFromMatches` 只要 4 參數（matches/currentClose/timeframe/lastBarTime?）；`StatsComputationResult` 兩欄位
- [x] **Unidirectional dependency** — AppPage → statsComputation → aggregation → types；無 cycle
- [x] **Replacement cost** — 後端若未來改回 backend-only stats 演算（Option A），換掉 util 只動 AppPage.tsx 一個 import + subset 分支邏輯；fixture 可直接捨棄（獨立檔）
- [x] **Clear test entry point** — `computeStatsFromMatches(matches, currentClose, timeframe, lastBarTime)` 純函式；contract fixture 即 spec
- [x] **Change isolation** — UI 不動（StatsPanel 不變）；API 不動（/api/predict 不變）；僅內部實作搬家

## 11 All-Phase Coverage Gate

本票為單一 refactor ticket（無多 Phase）。

| Phase | Backend API | Frontend Routes | Component Tree | Props Interface |
|-------|------------|----------------|----------------|----------------|
| N/A（單 Phase） | ✅（§8，不變性證明） | ✅（§6 Route Impact Table） | ✅（§5 呼叫樹 Before/After） | ✅（§2 Contract 契約） |

---

## Self-Diff Verification

- Section edited: `agent-context/architecture.md` — (a) `Data Flow` 段第二個 projected bars 區塊（+ fixture 來源註記）；(b) `Consensus Stats Source of Truth` 段 fixture 子彈點完善（加 generator script）；(c) Directory Structure 新增 `utils/statsComputation.ts`、`__tests__/statsComputation.test.ts`、`backend/tests/fixtures/*`；(d) Changelog prepend 一條
- Source of truth:
  - §4 File Change List（本設計文件）
  - ticket K-013 §預期異動檔案
  - `ls backend/tests/` / `ls frontend/src/utils/` / `ls frontend/src/__tests__/`（已執行，確認目前狀態）
- Row count comparison:
  - Directory Structure `frontend/src/utils/`：Before 4 檔（aggregation/analytics/api/auth/time）vs After 5 檔（+ statsComputation）— 5 vs 5 ✓（扣除 time.ts 漏算校正）
  - Directory Structure `frontend/src/__tests__/`：Before 6 檔 vs After 7 檔（+ statsComputation.test）— 7 vs 7 ✓
  - Directory Structure `backend/tests/`：Before 4 檔 + tests/ 下無 fixtures 目錄 vs After 4 檔 + `fixtures/` 子目錄（含 `__init__.py` / `generate_stats_contract_cases.py` / `stats_contract_cases.json`）— 新增 1 目錄 + 3 檔 ✓
  - Changelog 新增一條 "2026-04-21 (Architect, K-013 design)" — 1 列 ✓
- Same-file cross-table sweep: `grep 'statsComputation\|stats_contract_cases\|computeStatsFromMatches' agent-context/architecture.md` — 預期 hits 4 區塊（Summary / Directory Structure utils / Directory Structure backend tests / Consensus Stats Source of Truth / Changelog），實際 hits 見 architecture.md 編輯 diff；cell-by-cell match ✓
- Discrepancy: 若 `tests/fixtures/` 目錄未預先存在於 Directory Structure block，本次為新增條目，屬擴充而非改動 — 不算差異

---

## Retrospective

**Where most time was spent:** §0 Pre-Design Audit — 逐檔讀 `compute_stats` / `_projected_future_bars` / `computeDisplayStats` / `computeProjectedFutureBars` / `PredictStats` 五處真實實作，確認一個 **pre-existing gap（SQ-013-01：consensus_forecast_1h/1d 目前永遠是 `[]`）**。此 gap 若未在 design doc 顯式標注，Engineer 實作時可能自行「順手修一下」擴大 scope；或 Reviewer 會誤判為 K-013 引入的 regression。花時間寫成 SQ 並釘在 §0，避免三方共識不一致。

**Which decisions needed revision:**
- 初稿曾考慮把 fixture 放進 `frontend/src/__tests__/fixtures/`（前端 local），後撤回遵守 PM 2026-04-18 裁決 A（放 `backend/tests/fixtures/`）。裁決是 authoritative 不是 Architect 推薦，不得覆寫。
- 初稿曾考慮把 `statsComputation.ts` 寫成接收 `projectedFutureBars` 的「第二層 util」（沿用目前 AppPage 先算 projectedFutureBars 再算 stats 的雙 step 結構），最終改為 util 內部自行呼叫 `computeProjectedFutureBars` 並在 `StatsComputationResult` 一次回傳，避免 AppPage 的雙重呼叫。trade-off：util 對 `aggregation.ts` 多一層耦合，但換來 AppPage 單一 call site。

**Next time improvement:** 讀到「後端型別欄位有預設值 `[]`」時立即 `grep` 該欄位所有 producer — 這次花 ~5 min 才發現 backend 從不填 `consensus_forecast_1h/1d`；若一開始 grep `consensus_forecast_1h =` 或 `consensus_forecast_1h:` 在 backend/ 的所有 producer 位置，3 秒內就能確認。下次寫 cross-layer contract design 時，模型欄位「誰填、何時填、何時空」的檢查列為 §0 硬步驟。

**2026-04-21 Post-Round 2 addendum（Architect SQ premise 被推翻後補記）：** 僅 `grep` 後端 producer 不夠 — 必須同時 `git show <base-commit>:<frontend-file>` 讀 observable consumer 的實際注入邏輯。本票 §0 SQ-013-01 僅跑了 backend producer grep + frontend fallback 映射檢查，未讀 OLD AppPage.tsx L224-226 實際 useMemo body，導致 premise「全集下不顯示 consensus 圖」錯誤地被當 pre-existing gap 寫入設計文件。Round 2 Code Review 在 `docs/designs/K-013-consensus-stats-ssot.md` 與 `agent-context/architecture.md` 回填「RETRACTED」段 + 「Observable override 由 AppPage 保證」文字以免下一位 reader 再次沿用錯誤 premise。下次 cross-layer contract design 硬步驟升級為三項：(1) backend producer grep、(2) frontend consumer grep、(3) observable override useMemo body 逐行 dry-run（`git show`）— 缺任一項 SQ premise 不得寫入設計文件。
