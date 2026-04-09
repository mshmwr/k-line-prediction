# Early MA99 + Match Trend Label Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 上傳 CSV 後立即計算並顯示 MA99（不需等待預測），同時在 MatchList 每個 card 上顯示 MA99 走勢標籤。

**Architecture:** 後端新增 `/api/merge-and-compute-ma99` endpoint，複用現有函式合併資料並回傳 MA99；前端在上傳後立即觸發此 endpoint，用 `maLoading` 狀態控制按鈕 disabled 與 MainChart loading 顯示；MatchList 純前端計算線性迴歸走勢標籤。

**Tech Stack:** Python FastAPI (Pydantic), React + TypeScript, lightweight-charts, axios, pytest + TestClient

---

## File Map

| 動作 | 檔案 |
|------|------|
| 修改 | `backend/models.py` — 新增 `Ma99Request`, `Ma99Response` |
| 修改 | `backend/main.py` — 新增 endpoint `/api/merge-and-compute-ma99` |
| 修改 | `backend/tests/test_predictor.py` — 新增 endpoint 測試 |
| 修改 | `frontend/src/hooks/usePrediction.ts` — 新增 `computeMa99` function |
| 修改 | `frontend/src/App.tsx` — 新增 `maLoading` state、upload 觸發邏輯、擴充 `disabledReason` |
| 修改 | `frontend/src/components/PredictButton.tsx` — 新增 `'maLoading'` disabled case |
| 修改 | `frontend/src/components/MainChart.tsx` — 新增 `maLoading` prop 與 loading 文字 |
| 修改 | `frontend/src/components/MatchList.tsx` — 新增 `computeMaTrend` 與趨勢標籤 |

---

### Task 1: 後端 Models（Ma99Request + Ma99Response）

**Files:**
- Modify: `backend/models.py`

- [ ] **Step 1: 在 `backend/models.py` 末尾新增兩個 model**

```python
class Ma99Request(BaseModel):
    ohlc_data: List[OHLCBar]
    timeframe: str = "1H"

class Ma99Response(BaseModel):
    query_ma99: List[Optional[float]] = []
    query_ma99_gap: Optional[Ma99Gap] = None
```

- [ ] **Step 2: 驗證語法**

```bash
cd backend && python -m py_compile models.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/models.py
git commit -m "feat: add Ma99Request and Ma99Response models"
```

---

### Task 2: 後端 Endpoint + 測試

**Files:**
- Modify: `backend/main.py`
- Test: `backend/tests/test_predictor.py`

- [ ] **Step 1: 先寫兩個 failing tests**

在 `backend/tests/test_predictor.py` 末尾新增：

```python
def _make_bars(count: int, start_date: str = "2022-01-01") -> list[dict]:
    """Generate `count` simple ascending bars from start_date (hourly)."""
    from datetime import datetime, timedelta
    bars = []
    base = datetime.fromisoformat(start_date)
    price = 1000.0
    for i in range(count):
        dt = base + timedelta(hours=i)
        close = price + i * 0.5
        bars.append({
            'date': dt.strftime('%Y-%m-%d %H:%M'),
            'open': price + i * 0.5,
            'high': price + i * 0.5 + 2,
            'low': price + i * 0.5 - 2,
            'close': close,
        })
    return bars


def test_merge_and_compute_ma99_returns_query_ma99():
    """Endpoint returns query_ma99 array with same length as input."""
    bars = _make_bars(24, "2024-03-01")
    payload = {
        "ohlc_data": [
            {"open": b["open"], "high": b["high"], "low": b["low"],
             "close": b["close"], "time": b["date"]}
            for b in bars
        ],
        "timeframe": "1H",
    }
    res = client.post("/api/merge-and-compute-ma99", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "query_ma99" in data
    assert len(data["query_ma99"]) == 24


def test_merge_and_compute_ma99_gap_when_no_prefix():
    """When no prefix history exists, query_ma99_gap is not None."""
    # Use far-future dates that won't be in history
    bars = _make_bars(10, "2099-01-01")
    payload = {
        "ohlc_data": [
            {"open": b["open"], "high": b["high"], "low": b["low"],
             "close": b["close"], "time": b["date"]}
            for b in bars
        ],
        "timeframe": "1H",
    }
    res = client.post("/api/merge-and-compute-ma99", json=payload)
    assert res.status_code == 200
    data = res.json()
    # With only 10 bars and no prefix, MA99 gap should exist (< 99 bars available)
    assert data["query_ma99_gap"] is not None
```

- [ ] **Step 2: 執行測試確認 fail（endpoint 不存在）**

```bash
cd backend && python -m pytest tests/test_predictor.py::test_merge_and_compute_ma99_returns_query_ma99 tests/test_predictor.py::test_merge_and_compute_ma99_gap_when_no_prefix -v
```

Expected: 兩個測試都 FAIL（404 或類似錯誤）

- [ ] **Step 3: 在 `backend/main.py` 新增 endpoint**

在 `main.py` 的 import 行加入 `Ma99Request, Ma99Response`：
```python
from models import PredictRequest, PredictResponse, Ma99Request, Ma99Response
```

在 `main.py` 末端（`/api/predict` endpoint 之後）新增：

```python
@app.post("/api/merge-and-compute-ma99", response_model=Ma99Response)
def merge_and_compute_ma99(req: Ma99Request) -> Ma99Response:
    global _history_1h, _history_1d
    is_1d = req.timeframe == "1D"
    history = _history_1d if is_1d else _history_1h
    target_path = HISTORY_1D_PATH if is_1d else HISTORY_1H_PATH

    input_bars_with_time = [
        {
            'date': bar.time,
            'open': bar.open,
            'high': bar.high,
            'low': bar.low,
            'close': bar.close,
        }
        for bar in req.ohlc_data
        if bar.time
    ]
    if input_bars_with_time:
        merged = _merge_bars(history, input_bars_with_time)
        _save_history_csv(merged, target_path)
        if is_1d:
            _history_1d = merged
        else:
            _history_1h = merged
        history = merged

    first_input_time = req.ohlc_data[0].time if req.ohlc_data else ''
    query_prefix = get_prefix_bars(history, first_input_time, req.timeframe)
    query_ma99 = _compute_ma99_for_window(req.ohlc_data, query_prefix)
    query_ma99_gap = _extract_ma99_gap(req.ohlc_data, query_ma99)

    return Ma99Response(query_ma99=query_ma99, query_ma99_gap=query_ma99_gap)
```

- [ ] **Step 4: 語法驗證**

```bash
cd backend && python -m py_compile main.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 5: 執行測試確認 pass**

```bash
cd backend && python -m pytest tests/test_predictor.py::test_merge_and_compute_ma99_returns_query_ma99 tests/test_predictor.py::test_merge_and_compute_ma99_gap_when_no_prefix -v
```

Expected: 兩個測試都 PASS

- [ ] **Step 6: 跑完整測試套件確認沒有迴歸**

```bash
cd backend && python -m pytest tests/test_predictor.py -v
```

Expected: 全部 PASS

- [ ] **Step 7: Commit**

```bash
git add backend/main.py backend/tests/test_predictor.py
git commit -m "feat: add /api/merge-and-compute-ma99 endpoint with tests"
```

---

### Task 3: 前端 Hook — computeMa99 function

**Files:**
- Modify: `frontend/src/hooks/usePrediction.ts`

- [ ] **Step 1: 在 `usePrediction.ts` 的 `usePrediction` function 內、`predict` function 之後，新增 `computeMa99`**

```typescript
async function computeMa99(
  ohlcRows: OHLCRow[],
  timeframe: string = '1H',
): Promise<{ queryMa99: (number | null)[]; queryMa99Gap: Ma99Gap | null }> {
  const res = await axios.post<any>('/api/merge-and-compute-ma99', {
    ohlc_data: ohlcRows.map(r => ({
      open: Number(r.open),
      high: Number(r.high),
      low: Number(r.low),
      close: Number(r.close),
      time: r.time ?? '',
    })),
    timeframe,
  })
  const raw = res.data
  return {
    queryMa99: raw.query_ma99 ?? [],
    queryMa99Gap: raw.query_ma99_gap
      ? { fromDate: raw.query_ma99_gap.from_date, toDate: raw.query_ma99_gap.to_date }
      : null,
  }
}
```

- [ ] **Step 2: 更新 return 值，加入 `computeMa99`**

```typescript
return { predict, computeMa99, loading, error }
```

- [ ] **Step 3: 驗證型別**

```bash
cd frontend && npx tsc --noEmit
```

Expected: 無錯誤

- [ ] **Step 4: Commit**

```bash
git add frontend/src/hooks/usePrediction.ts
git commit -m "feat: add computeMa99 function to usePrediction hook"
```

---

### Task 4: App.tsx — maLoading state + upload 觸發邏輯

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: 新增 `maLoading` state（在現有 state 宣告區塊）**

在 `const { predict, loading, error: predictionError } = usePrediction()` 這行，改為：

```typescript
const { predict, computeMa99, loading, error: predictionError } = usePrediction()
```

在 `const [loadError, setLoadError] = useState<string | null>(null)` 之後新增：

```typescript
const [maLoading, setMaLoading] = useState(false)
```

- [ ] **Step 2: 更新 `disabledReason` useMemo，maLoading 優先**

將現有的：
```typescript
const disabledReason = useMemo(() => {
  if (!ohlcComplete) return 'ohlcIncomplete' as const
  if (matches.length > 0 && !hasSelection) return 'noSelection' as const
  return null
}, [ohlcComplete, hasSelection, matches.length])
```

改為：
```typescript
const disabledReason = useMemo(() => {
  if (maLoading) return 'maLoading' as const
  if (!ohlcComplete) return 'ohlcIncomplete' as const
  if (matches.length > 0 && !hasSelection) return 'noSelection' as const
  return null
}, [maLoading, ohlcComplete, hasSelection, matches.length])
```

- [ ] **Step 3: 在 `handleOfficialFilesUpload` 的 `.then(results => {` block 末尾，`resetPredictionState()` 之後新增 early MA99 觸發邏輯**

將現有的：
```typescript
    }).then(results => {
      const combined = results.flat().sort((a, b) => a.time.localeCompare(b.time))
      setOhlcData(combined)
      setSourcePath(fileList.map(f => f.name).join(' + '))
      resetPredictionState()
    }).catch(err => setLoadError((err as Error).message))
```

改為：
```typescript
    }).then(results => {
      const combined = results.flat().sort((a, b) => a.time.localeCompare(b.time))
      setOhlcData(combined)
      setSourcePath(fileList.map(f => f.name).join(' + '))
      resetPredictionState()
      setMaLoading(true)
      computeMa99(combined, TIMEFRAME)
        .then(result => {
          setQueryMa99(result.queryMa99)
          setQueryMa99Gap(result.queryMa99Gap)
        })
        .catch(err => setLoadError((err as Error).message))
        .finally(() => setMaLoading(false))
    }).catch(err => setLoadError((err as Error).message))
```

- [ ] **Step 4: 將 `maLoading` 傳入 MainChart prop**

找到現有的 `<MainChart` 使用處（App.tsx 第 429 行附近），新增 `maLoading` prop：

```tsx
<MainChart
  key={TIMEFRAME}
  userOhlc={ohlcData}
  timeframe={TIMEFRAME}
  ma99Values={queryMa99}
  ma99Gap={queryMa99Gap}
  maLoading={maLoading}
/>
```

- [ ] **Step 5: 驗證型別（會 fail，因為 PredictButton 和 MainChart 還沒更新，但可先確認 App.tsx 自身沒其他問題）**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -30
```

Expected: 只有 `'maLoading'` 型別不符的錯誤（後面 Task 5/6 會修掉）

- [ ] **Step 6: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: add maLoading state and early MA99 trigger on file upload"
```

---

### Task 5: PredictButton — 新增 maLoading disabled case

**Files:**
- Modify: `frontend/src/components/PredictButton.tsx`

- [ ] **Step 1: 更新 `DisabledReason` type，加入 `'maLoading'`**

將：
```typescript
type DisabledReason = 'ohlcIncomplete' | 'noSelection' | null
```

改為：
```typescript
type DisabledReason = 'maLoading' | 'ohlcIncomplete' | 'noSelection' | null
```

- [ ] **Step 2: 更新 `TOOLTIP`，加入 `maLoading` 項目**

將：
```typescript
const TOOLTIP: Record<NonNullable<DisabledReason>, string> = {
  ohlcIncomplete: 'Complete all rows',
  noSelection: 'Select at least 1 case',
}
```

改為：
```typescript
const TOOLTIP: Record<NonNullable<DisabledReason>, string> = {
  maLoading: 'MA99 計算中，請稍候…',
  ohlcIncomplete: 'Complete all rows',
  noSelection: 'Select at least 1 case',
}
```

- [ ] **Step 3: 驗證型別**

```bash
cd frontend && npx tsc --noEmit
```

Expected: PredictButton 相關錯誤消失（只剩 MainChart 的 maLoading prop 錯誤，若有的話）

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/PredictButton.tsx
git commit -m "feat: add maLoading disabled case to PredictButton"
```

---

### Task 6: MainChart — maLoading prop 與 loading 顯示

**Files:**
- Modify: `frontend/src/components/MainChart.tsx`

- [ ] **Step 1: 在 `Props` interface 新增 `maLoading` 欄位**

找到現有的 `interface Props {`，新增 `maLoading` 欄位：

```typescript
interface Props {
  userOhlc: OHLCRow[]
  timeframe: '1H' | '1D'
  ma99Values?: (number | null)[]
  ma99Gap?: { fromDate: string; toDate: string } | null
  maLoading?: boolean
}
```

- [ ] **Step 2: 在 function 簽名解構 `maLoading`**

找到 `export function MainChart({` 這行，新增 `maLoading = false`：

```typescript
export function MainChart({ userOhlc, timeframe, ma99Values = [], ma99Gap, maLoading = false }: Props) {
```

- [ ] **Step 3: 在 MA99 legend/label 顯示處加入 loading 狀態文字**

在 MainChart 的 JSX 中，找到顯示 MA99 標籤的地方（搜尋 `MA(99)` 或 `ma99` 文字），在顯示 MA99 值的 span 裡，根據 `maLoading` 切換顯示：

```tsx
{maLoading ? (
  <span className="text-purple-400 text-xs">MA(99) 計算中…</span>
) : (
  <span className="text-purple-400 text-xs">
    MA(99) {latestMa99 != null ? latestMa99.toFixed(2) : '—'}
  </span>
)}
```

> **注意：** 請先閱讀 MainChart.tsx 中 MA99 標籤的實際渲染方式，再依照原有的 JSX 結構插入這段邏輯，不要破壞現有的佈局。實際變數名稱（如 `latestMa99`）以檔案內實際使用的為準。

- [ ] **Step 4: 驗證型別**

```bash
cd frontend && npx tsc --noEmit
```

Expected: 無錯誤

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/MainChart.tsx
git commit -m "feat: add maLoading prop to MainChart with loading indicator"
```

---

### Task 7: MatchList — computeMaTrend + 趨勢標籤

**Files:**
- Modify: `frontend/src/components/MatchList.tsx`

- [ ] **Step 1: 在 `MatchList.tsx` 的 import 區塊後、`PredictorChart` component 前，新增 `computeMaTrend` function**

```typescript
function computeMaTrend(futureMa99: (number | null)[]): { direction: 'up' | 'down'; pct: number } | null {
  const valid = futureMa99.filter((v): v is number => v !== null)
  if (valid.length < 2) return null

  const n = valid.length
  const meanX = (n - 1) / 2
  const meanY = valid.reduce((a, b) => a + b, 0) / n
  const numerator = valid.reduce((sum, y, i) => sum + (i - meanX) * (y - meanY), 0)
  const denominator = valid.reduce((sum, _, i) => sum + (i - meanX) ** 2, 0)
  const slope = denominator === 0 ? 0 : numerator / denominator
  const pct = ((valid[valid.length - 1] - valid[0]) / valid[0]) * 100

  return {
    direction: slope >= 0 ? 'up' : 'down',
    pct: Math.round(pct * 100) / 100,
  }
}
```

- [ ] **Step 2: 在 MatchList card header 的日期後方插入趨勢標籤**

找到 card header 中顯示日期區間的 span（目前是 `formatInterval(m.startDate, m.endDate, timeframe)`），在那個 span 的後方、`▼` 箭頭前方，新增趨勢標籤：

```tsx
{/* 在 formatInterval span 之後新增 */}
{(() => {
  const trend = computeMaTrend(m.futureMa99 ?? [])
  if (!trend) return null
  return (
    <span className={`text-xs font-mono flex-shrink-0 ${trend.direction === 'up' ? 'text-green-400' : 'text-red-400'}`}>
      {trend.direction === 'up' ? '↑' : '↓'} {trend.direction === 'up' ? '+' : ''}{trend.pct.toFixed(2)}%
    </span>
  )
})()}
```

具體插入位置：在現有的這段 JSX 中：
```tsx
<span className="text-xs text-gray-400 flex-1 truncate">
  {formatInterval(m.startDate, m.endDate, timeframe)}
</span>
<span className="text-gray-500 text-xs flex-shrink-0">{isOpen ? '▲' : '▼'}</span>
```

在這兩個 span 之間插入趨勢標籤。

- [ ] **Step 3: 驗證型別**

```bash
cd frontend && npx tsc --noEmit
```

Expected: 無錯誤

- [ ] **Step 4: 跑完整 Playwright E2E 測試（若存在）**

```bash
cd frontend && npx playwright test 2>&1 | tail -20
```

Expected: 現有測試全部 PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/MatchList.tsx
git commit -m "feat: add computeMaTrend and trend label to MatchList cards"
```

---

## 完成後的快速驗收清單

1. 上傳 2 個 CSV → MainChart 顯示「MA(99) 計算中…」、按鈕 disabled + tooltip「MA99 計算中，請稍候…」
2. MA99 計算完成 → MainChart 顯示實際 MA99 值、按鈕恢復可點擊
3. 按「開始預測」後 → MatchList 每個 card 顯示 `↑ +X.XX%`（綠）或 `↓ -X.XX%`（紅）
4. 歷史資料不足時 → MA99 gap warning 仍顯示（現有邏輯），預測仍可進行
