# MA99 圖表顯示設計文件

**日期：** 2026-04-07  
**功能：** 在 MainChart 與 MatchList 圖表上顯示 MA99 線，並在歷史資料不足時顯示警告

---

## 背景與目的

使用者在網頁上輸入最新 48h OHLC 資料，系統透過歷史資料計算 MA99 作為匹配條件（目前已佔預測權重 40%），但 MA99 線尚未顯示在任何圖表上。

本功能目標：讓使用者能在以下圖表看到 MA99 線（紫色），以更直觀理解目前走勢與歷史匹配段的 MA 趨勢：
1. **MainChart** — 使用者輸入的 48h 資料圖表
2. **MatchList 的 PredictorChart** — 每個歷史匹配段（48h 歷史 + 72h 未來）的小圖

當歷史資料不足以計算某些 K 線的 MA99 時，後端回報缺口日期範圍，前端在 MainChart 上顯示警告訊息。

---

## 設計決策

**後端統一計算 MA99，前端只負責渲染**

- 後端有完整歷史資料庫，可正確回填前置資料來計算 MA99
- 前端透過 API response 拿到 MA99 數值陣列（含 `null`）和缺口資訊，直接畫線
- 確保 MainChart 和 MatchList 圖表的 MA99 計算邏輯一致

---

## 資料模型變更

### 後端（`backend/models.py`）

```python
class Ma99Gap(BaseModel):
    """表示某段日期範圍內 MA99 無法計算（歷史前綴不足 99 根）"""
    from_date: str   # 第一根無 MA99 的 bar 時間（ISO 字串）
    to_date: str     # 最後一根無 MA99 的 bar 時間（ISO 字串）

class MatchCase(BaseModel):
    id: str
    correlation: float
    historical_ohlc: List[OHLCBar]
    future_ohlc: List[OHLCBar]
    start_date: str
    end_date: str
    historical_ma99: List[Optional[float]]  # 新增：len = len(historical_ohlc)，不足時為 None
    future_ma99: List[Optional[float]]      # 新增：len = len(future_ohlc)，不足時為 None

class PredictResponse(BaseModel):
    matches: List[MatchCase]
    stats: PredictStats
    query_ma99: List[Optional[float]]       # 新增：len = len(ohlc_data)，不足時為 None
    query_ma99_gap: Optional[Ma99Gap]       # 新增：有缺口時帶日期範圍，否則 null
```

### 前端（`frontend/src/types.ts`）

```typescript
interface Ma99Gap {
  fromDate: string
  toDate: string
}

interface MatchCase {
  // ...現有欄位
  historicalMa99: (number | null)[]   // 新增
  futureMa99: (number | null)[]       // 新增
}

interface PredictResponse {
  // ...現有欄位
  queryMa99: (number | null)[]        // 新增
  queryMa99Gap: Ma99Gap | null        // 新增
}
```

---

## 後端計算邏輯（`backend/predictor.py`）

### 新增輔助函式

```python
def _compute_ma99_for_window(
    window_bars: List[OHLCBar],
    prefix_bars: List[OHLCBar],
) -> List[Optional[float]]:
    """
    利用 prefix_bars + window_bars 計算 MA99。
    回傳 len(window_bars) 個值，不足以計算的位置填 None。
    
    計算方式：
      combined = prefix + window（全部不截斷）
      ma_full = rolling_mean(combined_closes, 99)
      ma_full[i] 對應 combined[i + 98]
      對於 window_bars[j]：ma_idx = len(prefix) + j - 98
        if ma_idx >= 0 → ma_full[ma_idx]
        else          → None
    """
    combined = list(prefix_bars) + list(window_bars)
    closes = _extract_closes(combined)
    n_prefix = len(prefix_bars)

    if len(closes) < MA_WINDOW:
        return [None] * len(window_bars)

    ma_full = _rolling_mean(closes, MA_WINDOW)

    result: List[Optional[float]] = []
    for j in range(len(window_bars)):
        ma_idx = n_prefix + j - (MA_WINDOW - 1)
        result.append(ma_full[ma_idx] if ma_idx >= 0 else None)
    return result
```

### 缺口資訊計算

```python
def _extract_ma99_gap(
    window_bars: List[OHLCBar],
    ma99_values: List[Optional[float]],
) -> Optional[Ma99Gap]:
    """
    找出 ma99_values 開頭連續為 None 的日期範圍。
    缺口只會出現在開頭（prefix 不夠），不會在中間出現。
    """
    gap_start = None
    gap_end = None
    for bar, val in zip(window_bars, ma99_values):
        if val is None:
            if gap_start is None:
                gap_start = bar.time
            gap_end = bar.time
        else:
            break  # 遇到第一個有效值即停止
    if gap_start:
        return Ma99Gap(from_date=gap_start, to_date=gap_end)
    return None
```

### 在 `main.py` `/api/predict` 端點組裝 response

```python
# 1. query_ma99：從歷史找 query 最早時間戳前的所有前置 bars
query_prefix = _get_prefix_bars(history, query_bars[0].time, n=None)  # 取全部前置
query_ma99 = _compute_ma99_for_window(query_bars, query_prefix)
query_ma99_gap = _extract_ma99_gap(query_bars, query_ma99)

# 2. 每個 match 的 historical_ma99 + future_ma99
for match in matches:
    match_prefix = history[:match.start_idx]  # 取該 match 前所有歷史
    combined_window = match.historical_ohlc + match.future_ohlc
    combined_ma99 = _compute_ma99_for_window(combined_window, match_prefix)
    split = len(match.historical_ohlc)
    match.historical_ma99 = combined_ma99[:split]
    match.future_ma99 = combined_ma99[split:]
    # match 的缺口通常不存在（歷史資料充足），不另外回傳
```

---

## 前端顯示邏輯

### MA99 線樣式

| 屬性 | 值 |
|------|----|
| 顏色 | `rgba(160, 32, 240, 0.85)`（紫色） |
| 線寬 | `1` |
| 標題 | `'MA99'` |
| priceLineVisible | `false` |
| lastValueVisible | `false` |

繪製時過濾掉 `null` 值，只傳有效資料點給 `lineSeries.setData()`。

### `MainChart.tsx`

- 新增 props：`ma99Values?: (number | null)[]`
- 在 K 線 series 後加入紫色 `addLineSeries()`
- 過濾 `null`，繪製連續有效線段
- MA99 來源：`App.tsx` 從 `PredictResponse.queryMa99` 儲存並傳入

### MA99 缺口警告（`MainChart.tsx` 或獨立 `Ma99Warning` 元件）

當 `queryMa99Gap` 不為 `null` 時，在 MainChart 上方顯示黃色警告列：

```
⚠ MA99 資料缺失：{fromDate} ~ {toDate}（歷史前置資料不足 99 根）
```

- 樣式：黃色底、深色文字、細長條（`bg-yellow-100 text-yellow-800 text-xs px-3 py-1`）
- 不阻擋使用者操作，純資訊提示

### `MatchList.tsx` 的 `PredictorChart`（內嵌元件）

- 新增 props：`historicalMa99: (number | null)[]`, `futureMa99: (number | null)[]`
- 合併兩段 MA 值，對齊時間軸繪製同一條 MA99 線（紫色）
- 橙色分隔線（現有邏輯）保持不變
- match 的 MA99 缺口（罕見，僅限 2017 年初資料）不另外警告，靜默跳過

### `App.tsx` 狀態管理

```typescript
const [queryMa99, setQueryMa99] = useState<(number | null)[]>([])
const [queryMa99Gap, setQueryMa99Gap] = useState<Ma99Gap | null>(null)

// 在 handlePredict 成功後
setQueryMa99(response.queryMa99 ?? [])
setQueryMa99Gap(response.queryMa99Gap ?? null)
```

---

## 資料流程圖

```
使用者輸入 48h → POST /api/predict
  ↓
find_top_matches()   ← 現有邏輯不變（MA99 仍佔 40% 匹配權重）
  ↓
新增：計算 MA99 陣列
  query_prefix = 歷史中 query 最早時間戳之前的所有 bars
  query_ma99 = _compute_ma99_for_window(query, query_prefix)
               → List[Optional[float]]，開頭不足 99 根的位置為 None
  query_ma99_gap = _extract_ma99_gap(query_bars, query_ma99)
                 → None 或 {from_date, to_date}
  for each match:
    match_ma99 = _compute_ma99_for_window(hist+fut, history[:start_idx])
    split → historical_ma99, future_ma99
  ↓
PredictResponse（含 query_ma99、query_ma99_gap、每個 match 的 ma99 陣列）
  ↓
MainChart 畫 query_ma99 線（紫色，null 值跳過）
  + 若 query_ma99_gap != null，顯示黃色缺口警告列
MatchList PredictorChart 畫 historical_ma99 + future_ma99 線（紫色）
```

---

## 驗證方式

1. 啟動後端 `uvicorn main:app --reload --port 8000`
2. 啟動前端 `npm run dev`
3. **正常情況（歷史充足）：**
   - 輸入 48 行含時間戳的 OHLC → 點擊預測
   - 確認 MainChart 上出現完整紫色 MA99 線，無警告
   - 展開 MatchList 任一 match → 歷史段 + 未來段有紫色 MA99 線延伸
4. **歷史不足情況（邊界測試）：**
   - 輸入時間戳設為 2017 年 8 月（歷史資料起點附近）
   - 確認 MainChart 出現黃色警告列，顯示正確缺口日期
   - 確認 MA99 線從缺口結束日期後才開始繪製
5. **無時間戳情況：**
   - 輸入無時間戳的資料 → 確認 query_ma99 為全 null，顯示警告
6. 執行後端測試 `pytest` 全部通過

---

## 影響範圍

| 檔案 | 變更類型 |
|------|----------|
| `backend/models.py` | 新增 `Ma99Gap`、更新 `MatchCase` 和 `PredictResponse` 欄位 |
| `backend/predictor.py` | 新增 `_compute_ma99_for_window`、`_extract_ma99_gap` |
| `backend/main.py` | 組裝 response 時呼叫新函式 |
| `frontend/src/types.ts` | 新增 `Ma99Gap`、更新 `MatchCase` 和 `PredictResponse` |
| `frontend/src/App.tsx` | 新增 `queryMa99`、`queryMa99Gap` state |
| `frontend/src/components/MainChart.tsx` | 新增 MA99 line series + 缺口警告列 |
| `frontend/src/components/MatchList.tsx` | 新增 MA99 line series（PredictorChart） |
| `backend/tests/test_predictor.py` | 新增 `_compute_ma99_for_window` 和 `_extract_ma99_gap` 測試 |
