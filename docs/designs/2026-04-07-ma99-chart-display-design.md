# MA99 Chart Display Design Doc

**Date:** 2026-04-07
**Feature:** Display MA99 line on MainChart and MatchList charts; show warning when historical data is insufficient

---

## Background and Goal

Users input the latest 48h OHLC data on the web; the system computes MA99 from historical data as a matching condition (currently weighted 40% in prediction). However, the MA99 line is not yet shown on any chart.

This feature's goal: let users see the MA99 line (purple) on the following charts to more intuitively understand the current trend versus historical match segments' MA trend:
1. **MainChart** — chart of the user's 48h input data
2. **PredictorChart inside MatchList** — small chart for each historical match segment (48h history + 72h future)

When historical data is insufficient to compute MA99 for some K-line bars, the backend reports the gap date range and the frontend shows a warning on MainChart.

---

## Design Decision

**Backend computes MA99 in one place; frontend only renders**

- Backend has full historical database, can correctly backfill prefix data to compute MA99
- Frontend receives MA99 numeric arrays (with `null`) and gap info via API response, draws line directly
- Ensures MainChart and MatchList chart MA99 logic is consistent

---

## Data Model Changes

### Backend (`backend/models.py`)

```python
class Ma99Gap(BaseModel):
    """Represents a date range where MA99 cannot be computed (historical prefix < 99 bars)"""
    from_date: str   # First bar without MA99 (ISO string)
    to_date: str     # Last bar without MA99 (ISO string)

class MatchCase(BaseModel):
    id: str
    correlation: float
    historical_ohlc: List[OHLCBar]
    future_ohlc: List[OHLCBar]
    start_date: str
    end_date: str
    historical_ma99: List[Optional[float]]  # New: len = len(historical_ohlc); None when insufficient
    future_ma99: List[Optional[float]]      # New: len = len(future_ohlc); None when insufficient

class PredictResponse(BaseModel):
    matches: List[MatchCase]
    stats: PredictStats
    query_ma99: List[Optional[float]]       # New: len = len(ohlc_data); None when insufficient
    query_ma99_gap: Optional[Ma99Gap]       # New: gap range when present, otherwise null
```

### Frontend (`frontend/src/types.ts`)

```typescript
interface Ma99Gap {
  fromDate: string
  toDate: string
}

interface MatchCase {
  // ...existing fields
  historicalMa99: (number | null)[]   // New
  futureMa99: (number | null)[]       // New
}

interface PredictResponse {
  // ...existing fields
  queryMa99: (number | null)[]        // New
  queryMa99Gap: Ma99Gap | null        // New
}
```

---

## Backend Computation (`backend/predictor.py`)

### New Helper Function

```python
def _compute_ma99_for_window(
    window_bars: List[OHLCBar],
    prefix_bars: List[OHLCBar],
) -> List[Optional[float]]:
    """
    Compute MA99 using prefix_bars + window_bars.
    Returns len(window_bars) values; positions where computation is impossible are None.

    Method:
      combined = prefix + window (no truncation)
      ma_full = rolling_mean(combined_closes, 99)
      ma_full[i] corresponds to combined[i + 98]
      For window_bars[j]: ma_idx = len(prefix) + j - 98
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

### Gap Extraction

```python
def _extract_ma99_gap(
    window_bars: List[OHLCBar],
    ma99_values: List[Optional[float]],
) -> Optional[Ma99Gap]:
    """
    Find the leading consecutive None range in ma99_values.
    Gap only appears at the start (insufficient prefix); never in the middle.
    """
    gap_start = None
    gap_end = None
    for bar, val in zip(window_bars, ma99_values):
        if val is None:
            if gap_start is None:
                gap_start = bar.time
            gap_end = bar.time
        else:
            break  # Stop at first valid value
    if gap_start:
        return Ma99Gap(from_date=gap_start, to_date=gap_end)
    return None
```

### Assembly in `main.py` `/api/predict` Endpoint

```python
# 1. query_ma99: take all prefix bars before query's earliest timestamp
query_prefix = _get_prefix_bars(history, query_bars[0].time, n=None)  # take all prefix
query_ma99 = _compute_ma99_for_window(query_bars, query_prefix)
query_ma99_gap = _extract_ma99_gap(query_bars, query_ma99)

# 2. Per-match historical_ma99 + future_ma99
for match in matches:
    match_prefix = history[:match.start_idx]  # all history before this match
    combined_window = match.historical_ohlc + match.future_ohlc
    combined_ma99 = _compute_ma99_for_window(combined_window, match_prefix)
    split = len(match.historical_ohlc)
    match.historical_ma99 = combined_ma99[:split]
    match.future_ma99 = combined_ma99[split:]
    # Match gaps usually do not exist (history sufficient); not separately returned
```

---

## Frontend Render Logic

### MA99 Line Style

| Property | Value |
|------|----|
| Color | `rgba(160, 32, 240, 0.85)` (purple) |
| Line width | `1` |
| Title | `'MA99'` |
| priceLineVisible | `false` |
| lastValueVisible | `false` |

When drawing, filter out `null`; only pass valid points to `lineSeries.setData()`.

### `MainChart.tsx`

- New prop: `ma99Values?: (number | null)[]`
- After K-line series, add purple `addLineSeries()`
- Filter `null`; render continuous valid segments
- MA99 source: `App.tsx` stores from `PredictResponse.queryMa99` and passes in

### MA99 Gap Warning (`MainChart.tsx` or standalone `Ma99Warning` component)

When `queryMa99Gap` is not `null`, show yellow warning bar above MainChart:

```
⚠ MA99 data missing: {fromDate} ~ {toDate} (historical prefix < 99 bars)
```

- Style: yellow background, dark text, slim bar (`bg-yellow-100 text-yellow-800 text-xs px-3 py-1`)
- Does not block user actions; informational only

### `PredictorChart` inside `MatchList.tsx` (embedded component)

- New props: `historicalMa99: (number | null)[]`, `futureMa99: (number | null)[]`
- Concatenate the two MA series, align timeline, draw a single MA99 line (purple)
- Orange divider (existing logic) unchanged
- Match-level MA99 gap (rare; only early-2017 data) is not warned; silently skipped

### `App.tsx` State

```typescript
const [queryMa99, setQueryMa99] = useState<(number | null)[]>([])
const [queryMa99Gap, setQueryMa99Gap] = useState<Ma99Gap | null>(null)

// On handlePredict success
setQueryMa99(response.queryMa99 ?? [])
setQueryMa99Gap(response.queryMa99Gap ?? null)
```

---

## Data Flow Diagram

```
User input 48h → POST /api/predict
  ↓
find_top_matches()   ← Existing logic unchanged (MA99 still 40% match weight)
  ↓
New: compute MA99 arrays
  query_prefix = all bars before query's earliest timestamp
  query_ma99 = _compute_ma99_for_window(query, query_prefix)
               → List[Optional[float]]; leading positions where prefix < 99 are None
  query_ma99_gap = _extract_ma99_gap(query_bars, query_ma99)
                 → None or {from_date, to_date}
  for each match:
    match_ma99 = _compute_ma99_for_window(hist+fut, history[:start_idx])
    split → historical_ma99, future_ma99
  ↓
PredictResponse (with query_ma99, query_ma99_gap, per-match ma99 arrays)
  ↓
MainChart draws query_ma99 line (purple, null skipped)
  + if query_ma99_gap != null, show yellow gap warning bar
MatchList PredictorChart draws historical_ma99 + future_ma99 line (purple)
```

---

## Verification

1. Start backend `uvicorn main:app --reload --port 8000`
2. Start frontend `npm run dev`
3. **Normal case (sufficient history):**
   - Input 48 lines of OHLC with timestamps → click predict
   - Confirm MainChart shows full purple MA99 line; no warning
   - Expand any match in MatchList → historical + future segments show purple MA99 line continuation
4. **Insufficient history case (boundary test):**
   - Input timestamps near August 2017 (near history start)
   - Confirm MainChart shows yellow warning bar with correct gap dates
   - Confirm MA99 line starts only after gap end date
5. **No-timestamp case:**
   - Input data without timestamps → confirm query_ma99 is all null; warning shown
6. Run backend tests `pytest`; all pass

---

## Impact Scope

| File | Change type |
|------|----------|
| `backend/models.py` | Add `Ma99Gap`; update `MatchCase` and `PredictResponse` fields |
| `backend/predictor.py` | Add `_compute_ma99_for_window`, `_extract_ma99_gap` |
| `backend/main.py` | Call new functions when assembling response |
| `frontend/src/types.ts` | Add `Ma99Gap`; update `MatchCase` and `PredictResponse` |
| `frontend/src/App.tsx` | Add `queryMa99`, `queryMa99Gap` state |
| `frontend/src/components/MainChart.tsx` | Add MA99 line series + gap warning bar |
| `frontend/src/components/MatchList.tsx` | Add MA99 line series (PredictorChart) |
| `backend/tests/test_predictor.py` | Add tests for `_compute_ma99_for_window` and `_extract_ma99_gap` |
