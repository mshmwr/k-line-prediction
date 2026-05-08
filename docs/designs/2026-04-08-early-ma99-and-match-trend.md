# Early MA99 + Match Trend Label Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compute and display MA99 immediately after CSV upload (no need to wait for prediction); also show MA99 trend label on each MatchList card.

**Architecture:** Backend adds `/api/merge-and-compute-ma99` endpoint, reusing existing functions to merge data and return MA99; frontend triggers this endpoint immediately after upload, uses `maLoading` state to control button disabled and MainChart loading display; MatchList computes linear-regression trend label purely on the frontend.

**Tech Stack:** Python FastAPI (Pydantic), React + TypeScript, lightweight-charts, axios, pytest + TestClient

---

## File Map

| Action | File |
|------|------|
| Modify | `backend/models.py` — add `Ma99Request`, `Ma99Response` |
| Modify | `backend/main.py` — add endpoint `/api/merge-and-compute-ma99` |
| Modify | `backend/tests/test_predictor.py` — add endpoint tests |
| Modify | `frontend/src/hooks/usePrediction.ts` — add `computeMa99` function |
| Modify | `frontend/src/App.tsx` — add `maLoading` state, upload trigger logic, extend `disabledReason` |
| Modify | `frontend/src/components/PredictButton.tsx` — add `'maLoading'` disabled case |
| Modify | `frontend/src/components/MainChart.tsx` — add `maLoading` prop and loading text |
| Modify | `frontend/src/components/MatchList.tsx` — add `computeMaTrend` and trend label |

---

### Task 1: Backend Models (Ma99Request + Ma99Response)

**Files:**
- Modify: `backend/models.py`

- [ ] **Step 1: Append two models at end of `backend/models.py`**

```python
class Ma99Request(BaseModel):
    ohlc_data: List[OHLCBar]
    timeframe: str = "1H"

class Ma99Response(BaseModel):
    query_ma99: List[Optional[float]] = []
    query_ma99_gap: Optional[Ma99Gap] = None
```

- [ ] **Step 2: Verify syntax**

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

### Task 2: Backend Endpoint + Tests

**Files:**
- Modify: `backend/main.py`
- Test: `backend/tests/test_predictor.py`

- [ ] **Step 1: Write two failing tests first**

Append to `backend/tests/test_predictor.py`:

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

- [ ] **Step 2: Run tests to confirm fail (endpoint does not exist)**

```bash
cd backend && python -m pytest tests/test_predictor.py::test_merge_and_compute_ma99_returns_query_ma99 tests/test_predictor.py::test_merge_and_compute_ma99_gap_when_no_prefix -v
```

Expected: both tests FAIL (404 or similar error)

- [ ] **Step 3: Add endpoint to `backend/main.py`**

Add `Ma99Request, Ma99Response` to `main.py` imports:
```python
from models import PredictRequest, PredictResponse, Ma99Request, Ma99Response
```

Append at end of `main.py` (after the `/api/predict` endpoint):

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

- [ ] **Step 4: Syntax verify**

```bash
cd backend && python -m py_compile main.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 5: Run tests to confirm pass**

```bash
cd backend && python -m pytest tests/test_predictor.py::test_merge_and_compute_ma99_returns_query_ma99 tests/test_predictor.py::test_merge_and_compute_ma99_gap_when_no_prefix -v
```

Expected: both tests PASS

- [ ] **Step 6: Run full test suite to confirm no regression**

```bash
cd backend && python -m pytest tests/test_predictor.py -v
```

Expected: all PASS

- [ ] **Step 7: Commit**

```bash
git add backend/main.py backend/tests/test_predictor.py
git commit -m "feat: add /api/merge-and-compute-ma99 endpoint with tests"
```

---

### Task 3: Frontend Hook — computeMa99 function

**Files:**
- Modify: `frontend/src/hooks/usePrediction.ts`

- [ ] **Step 1: Inside `usePrediction.ts`'s `usePrediction` function, after `predict`, add `computeMa99`**

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

- [ ] **Step 2: Update return value to include `computeMa99`**

```typescript
return { predict, computeMa99, loading, error }
```

- [ ] **Step 3: Verify types**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/hooks/usePrediction.ts
git commit -m "feat: add computeMa99 function to usePrediction hook"
```

---

### Task 4: App.tsx — maLoading state + upload trigger logic

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Add `maLoading` state (in existing state declaration block)**

Change `const { predict, loading, error: predictionError } = usePrediction()` to:

```typescript
const { predict, computeMa99, loading, error: predictionError } = usePrediction()
```

After `const [loadError, setLoadError] = useState<string | null>(null)` add:

```typescript
const [maLoading, setMaLoading] = useState(false)
```

- [ ] **Step 2: Update `disabledReason` useMemo so maLoading takes priority**

Change existing:
```typescript
const disabledReason = useMemo(() => {
  if (!ohlcComplete) return 'ohlcIncomplete' as const
  if (matches.length > 0 && !hasSelection) return 'noSelection' as const
  return null
}, [ohlcComplete, hasSelection, matches.length])
```

To:
```typescript
const disabledReason = useMemo(() => {
  if (maLoading) return 'maLoading' as const
  if (!ohlcComplete) return 'ohlcIncomplete' as const
  if (matches.length > 0 && !hasSelection) return 'noSelection' as const
  return null
}, [maLoading, ohlcComplete, hasSelection, matches.length])
```

- [ ] **Step 3: At the end of `handleOfficialFilesUpload`'s `.then(results => {` block, after `resetPredictionState()`, add the early MA99 trigger**

Change existing:
```typescript
    }).then(results => {
      const combined = results.flat().sort((a, b) => a.time.localeCompare(b.time))
      setOhlcData(combined)
      setSourcePath(fileList.map(f => f.name).join(' + '))
      resetPredictionState()
    }).catch(err => setLoadError((err as Error).message))
```

To:
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

- [ ] **Step 4: Pass `maLoading` to MainChart**

Find existing `<MainChart` usage (around App.tsx line 429) and add `maLoading` prop:

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

- [ ] **Step 5: Verify types (will fail because PredictButton and MainChart not updated yet, but confirm App.tsx itself has no other issues)**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -30
```

Expected: only `'maLoading'` type-mismatch errors (Tasks 5/6 will fix)

- [ ] **Step 6: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: add maLoading state and early MA99 trigger on file upload"
```

---

### Task 5: PredictButton — add maLoading disabled case

**Files:**
- Modify: `frontend/src/components/PredictButton.tsx`

- [ ] **Step 1: Update `DisabledReason` type to include `'maLoading'`**

Change:
```typescript
type DisabledReason = 'ohlcIncomplete' | 'noSelection' | null
```

To:
```typescript
type DisabledReason = 'maLoading' | 'ohlcIncomplete' | 'noSelection' | null
```

- [ ] **Step 2: Update `TOOLTIP` to include `maLoading` entry**

Change:
```typescript
const TOOLTIP: Record<NonNullable<DisabledReason>, string> = {
  ohlcIncomplete: 'Complete all rows',
  noSelection: 'Select at least 1 case',
}
```

To:
```typescript
const TOOLTIP: Record<NonNullable<DisabledReason>, string> = {
  maLoading: 'MA99 computing, please wait…',
  ohlcIncomplete: 'Complete all rows',
  noSelection: 'Select at least 1 case',
}
```

- [ ] **Step 3: Verify types**

```bash
cd frontend && npx tsc --noEmit
```

Expected: PredictButton-related errors gone (only MainChart maLoading prop error remains, if any)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/PredictButton.tsx
git commit -m "feat: add maLoading disabled case to PredictButton"
```

---

### Task 6: MainChart — maLoading prop and loading display

**Files:**
- Modify: `frontend/src/components/MainChart.tsx`

- [ ] **Step 1: Add `maLoading` field to `Props` interface**

Find existing `interface Props {` and add `maLoading`:

```typescript
interface Props {
  userOhlc: OHLCRow[]
  timeframe: '1H' | '1D'
  ma99Values?: (number | null)[]
  ma99Gap?: { fromDate: string; toDate: string } | null
  maLoading?: boolean
}
```

- [ ] **Step 2: Destructure `maLoading` in function signature**

Find `export function MainChart({` and add `maLoading = false`:

```typescript
export function MainChart({ userOhlc, timeframe, ma99Values = [], ma99Gap, maLoading = false }: Props) {
```

- [ ] **Step 3: Add loading state text where MA99 legend/label is shown**

In MainChart's JSX, find the place that shows the MA99 label (search `MA(99)` or `ma99` text); inside the span showing MA99 value, switch display based on `maLoading`:

```tsx
{maLoading ? (
  <span className="text-purple-400 text-xs">MA(99) computing…</span>
) : (
  <span className="text-purple-400 text-xs">
    MA(99) {latestMa99 != null ? latestMa99.toFixed(2) : '—'}
  </span>
)}
```

> **Note:** Read MainChart.tsx's actual MA99 label rendering first, then insert this logic following the existing JSX structure without breaking the layout. Use the actual variable names (e.g. `latestMa99`) as in the file.

- [ ] **Step 4: Verify types**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/MainChart.tsx
git commit -m "feat: add maLoading prop to MainChart with loading indicator"
```

---

### Task 7: MatchList — computeMaTrend + trend label

**Files:**
- Modify: `frontend/src/components/MatchList.tsx`

- [ ] **Step 1: After import block, before `PredictorChart` component, add `computeMaTrend` function**

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

- [ ] **Step 2: Insert trend label in MatchList card header after the date range**

Find the card header span showing date range (currently `formatInterval(m.startDate, m.endDate, timeframe)`); after that span and before the `▼` arrow, add the trend label:

```tsx
{/* New, after formatInterval span */}
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

Concrete insertion location, in this existing JSX:
```tsx
<span className="text-xs text-gray-400 flex-1 truncate">
  {formatInterval(m.startDate, m.endDate, timeframe)}
</span>
<span className="text-gray-500 text-xs flex-shrink-0">{isOpen ? '▲' : '▼'}</span>
```

Insert the trend label between these two spans.

- [ ] **Step 3: Verify types**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Run full Playwright E2E (if exists)**

```bash
cd frontend && npx playwright test 2>&1 | tail -20
```

Expected: all existing tests PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/MatchList.tsx
git commit -m "feat: add computeMaTrend and trend label to MatchList cards"
```

---

## Quick Acceptance Checklist after Completion

1. Upload 2 CSVs → MainChart shows "MA(99) computing…", button disabled + tooltip "MA99 computing, please wait…"
2. MA99 done → MainChart shows actual MA99 value; button re-enabled
3. After clicking "Start Prediction" → each MatchList card shows `↑ +X.XX%` (green) or `↓ -X.XX%` (red)
4. When historical data is insufficient → MA99 gap warning still shown (existing logic); prediction still proceeds
