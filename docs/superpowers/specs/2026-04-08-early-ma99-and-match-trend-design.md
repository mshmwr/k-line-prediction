# Design Spec: Early MA99 + Match Trend Display

**Date:** 2026-04-08
**Branch:** K-Line-Predition

---

## Overview

兩個獨立但相關的功能：

1. **Early MA99**：用戶上傳 24h 資料後，立即（不等按預測按鈕）計算 MA99 並顯示在 MainChart，期間預測按鈕 disabled
2. **Match Trend Label**：MatchList 每個 card 的日期後方顯示該次歷史 match 的未來 MA99 走勢（漲/跌 + 百分比）

---

## 1. 後端：新 Endpoint

### `POST /api/merge-and-compute-ma99`

**Request（新 `Ma99Request` model）：**
```json
{
  "ohlc_data": [{ "open": 1, "high": 2, "low": 0.9, "close": 1.1, "time": "2024-01-01 08:00" }],
  "timeframe": "1H"
}
```

新增獨立的 `Ma99Request` model（只含 `ohlc_data` + `timeframe`），不混用 `PredictRequest`。

**Response（新 model `Ma99Response`）：**
```json
{
  "query_ma99": [null, null, 1850.23, 1851.10],
  "query_ma99_gap": { "from_date": "2024-01-01 08:00", "to_date": "2024-01-05 12:00" } | null
}
```

**邏輯（全部複用 predictor.py 現有函式）：**
1. `_merge_bars` 把 input bars 合進 `_history_1h`，存檔
2. `get_prefix_bars` 取得 input 之前的歷史前置資料
3. `_compute_ma99_for_window(input_bars, prefix_bars)` 計算 MA99
4. `_extract_ma99_gap` 找出 null 缺口範圍
5. 回傳結果（不做任何 K 線相似度搜尋）

**Warning 行為：** 即使 `query_ma99_gap != null`（歷史前置資料不足），仍正常回傳，不拋 error。前端顯示 warning banner。

---

## 2. 前端：Early MA99 Flow

### App.tsx

新增狀態：
- `maLoading: boolean`（初始 `false`）

`handleOfficialFilesUpload` 成功設完 `ohlcData` 後，立即：
1. 設 `maLoading = true`
2. 清空 `queryMa99`、`queryMa99Gap`
3. 呼叫 `POST /api/merge-and-compute-ma99`
4. 回傳後：設 `queryMa99`、`queryMa99Gap`，設 `maLoading = false`
5. 失敗後：設 `maLoading = false`，顯示錯誤訊息

**`disabledReason` 擴充順序（優先序由高到低）：**
```ts
if (maLoading) return 'maLoading'
if (!ohlcComplete) return 'ohlcIncomplete'
if (matches.length > 0 && !hasSelection) return 'noSelection'
return null
```

### PredictButton.tsx

新增 `'maLoading'` case，顯示文字：「MA99 計算中，請稍候…」

### MainChart.tsx

新增 `maLoading?: boolean` prop。當 `maLoading = true` 時，在 MA99 標籤旁顯示 loading 狀態文字（例如 `MA(99) 計算中…`），蓋住原本的數值顯示。

---

## 3. 前端：MatchList Match Trend Label

### 計算邏輯（純前端，不動後端）

每個 `MatchCase` 已有 `futureMa99: (number | null)[]`。

```ts
function computeMaTrend(futureMa99: (number | null)[]): { direction: 'up' | 'down'; pct: number } | null {
  const valid = futureMa99.filter((v): v is number => v !== null)
  if (valid.length < 2) return null

  // 線性迴歸取斜率
  const n = valid.length
  const xs = valid.map((_, i) => i)
  const meanX = (n - 1) / 2
  const meanY = valid.reduce((a, b) => a + b, 0) / n
  const slope = xs.reduce((sum, x, i) => sum + (x - meanX) * (valid[i] - meanY), 0) /
                xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0)

  // 百分比 = 首尾變化
  const pct = ((valid[valid.length - 1] - valid[0]) / valid[0]) * 100

  return { direction: slope >= 0 ? 'up' : 'down', pct }
}
```

### 顯示位置

MatchList 每個 card header，日期後方插入趨勢標籤：

```
r = 0.9123  |  2024-01-15 08:00 ~ 02-20 08:00  ↑ +2.34%  ▼
```

樣式：
- `↑ +X.XX%`：綠色（`text-green-400`）
- `↓ -X.XX%`：紅色（`text-red-400`）
- 資料不足（`valid.length < 2`）：不顯示標籤

---

## 4. API Contract（snake_case ↔ camelCase 對照）

| Backend (snake_case) | Frontend (camelCase) |
|---|---|
| `query_ma99` | `queryMa99` |
| `query_ma99_gap.from_date` | `queryMa99Gap.fromDate` |
| `query_ma99_gap.to_date` | `queryMa99Gap.toDate` |

`/api/merge-and-compute-ma99` 的 response mapping 與現有 `/api/predict` 的 `queryMa99` / `queryMa99Gap` 欄位完全一致，可共用 `usePrediction.ts` 中的 mapping 邏輯。

---

## 5. 不在此次範圍內

- MatchList 中 `historicalMa99` 不完整時的特殊處理（已有 MA incomplete 顯示）
- 1D timeframe 的 Early MA99（架構相同，此次先做 1H）
- `/api/predict` 不做任何改動

---

## 6. 受影響檔案清單

| 檔案 | 改動 |
|---|---|
| `backend/models.py` | 新增 `Ma99Request` + `Ma99Response` model |
| `backend/main.py` | 新增 `/api/merge-and-compute-ma99` endpoint |
| `frontend/src/hooks/usePrediction.ts` | 新增 `computeMa99` function |
| `frontend/src/App.tsx` | 新增 `maLoading` state、觸發 early MA99、擴充 `disabledReason` |
| `frontend/src/components/PredictButton.tsx` | 新增 `maLoading` disabled case |
| `frontend/src/components/MainChart.tsx` | 新增 `maLoading` prop 與 loading 顯示 |
| `frontend/src/components/MatchList.tsx` | 新增 `computeMaTrend` 與趨勢標籤顯示 |
