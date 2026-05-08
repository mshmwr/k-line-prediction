# Design Spec: Early MA99 + Match Trend Display

**Date:** 2026-04-08
**Branch:** K-Line-Predition

---

## Overview

Two independent but related features:

1. **Early MA99**: After the user uploads 24h data, immediately (without waiting for the predict button) compute MA99 and show on MainChart; predict button disabled during computation.
2. **Match Trend Label**: Each card in MatchList shows the future MA99 trend (up/down + percentage) of that historical match after the date.

---

## 1. Backend: New Endpoint

### `POST /api/merge-and-compute-ma99`

**Request (new `Ma99Request` model):**
```json
{
  "ohlc_data": [{ "open": 1, "high": 2, "low": 0.9, "close": 1.1, "time": "2024-01-01 08:00" }],
  "timeframe": "1H"
}
```

Add a standalone `Ma99Request` model (only `ohlc_data` + `timeframe`); do not reuse `PredictRequest`.

**Response (new `Ma99Response` model):**
```json
{
  "query_ma99": [null, null, 1850.23, 1851.10],
  "query_ma99_gap": { "from_date": "2024-01-01 08:00", "to_date": "2024-01-05 12:00" } | null
}
```

**Logic (all reuse predictor.py existing functions):**
1. `_merge_bars` merges input bars into `_history_1h`, persists
2. `get_prefix_bars` retrieves prefix history before input
3. `_compute_ma99_for_window(input_bars, prefix_bars)` computes MA99
4. `_extract_ma99_gap` finds null-gap range
5. Return result (no K-line similarity search)

**Warning behavior:** Even if `query_ma99_gap != null` (insufficient prefix history), return normally without throwing error. Frontend shows warning banner.

---

## 2. Frontend: Early MA99 Flow

### App.tsx

New state:
- `maLoading: boolean` (initial `false`)

After `handleOfficialFilesUpload` successfully sets `ohlcData`, immediately:
1. Set `maLoading = true`
2. Clear `queryMa99`, `queryMa99Gap`
3. Call `POST /api/merge-and-compute-ma99`
4. On response: set `queryMa99`, `queryMa99Gap`; set `maLoading = false`
5. On failure: set `maLoading = false`; show error message

**`disabledReason` extension order (priority high to low):**
```ts
if (maLoading) return 'maLoading'
if (!ohlcComplete) return 'ohlcIncomplete'
if (matches.length > 0 && !hasSelection) return 'noSelection'
return null
```

### PredictButton.tsx

Add `'maLoading'` case with text: "MA99 computing, please wait…"

### MainChart.tsx

Add `maLoading?: boolean` prop. When `maLoading = true`, show loading status text next to the MA99 label (e.g. `MA(99) computing…`), overriding the original numeric display.

---

## 3. Frontend: MatchList Match Trend Label

### Computation Logic (pure frontend, no backend change)

Each `MatchCase` already has `futureMa99: (number | null)[]`.

```ts
function computeMaTrend(futureMa99: (number | null)[]): { direction: 'up' | 'down'; pct: number } | null {
  const valid = futureMa99.filter((v): v is number => v !== null)
  if (valid.length < 2) return null

  // Linear regression slope
  const n = valid.length
  const xs = valid.map((_, i) => i)
  const meanX = (n - 1) / 2
  const meanY = valid.reduce((a, b) => a + b, 0) / n
  const slope = xs.reduce((sum, x, i) => sum + (x - meanX) * (valid[i] - meanY), 0) /
                xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0)

  // Percentage = first-to-last change
  const pct = ((valid[valid.length - 1] - valid[0]) / valid[0]) * 100

  return { direction: slope >= 0 ? 'up' : 'down', pct }
}
```

### Display Location

In each MatchList card header, insert trend label after the date:

```
r = 0.9123  |  2024-01-15 08:00 ~ 02-20 08:00  ↑ +2.34%  ▼
```

Style:
- `↑ +X.XX%`: green (`text-green-400`)
- `↓ -X.XX%`: red (`text-red-400`)
- Insufficient data (`valid.length < 2`): hide label

---

## 4. API Contract (snake_case ↔ camelCase mapping)

| Backend (snake_case) | Frontend (camelCase) |
|---|---|
| `query_ma99` | `queryMa99` |
| `query_ma99_gap.from_date` | `queryMa99Gap.fromDate` |
| `query_ma99_gap.to_date` | `queryMa99Gap.toDate` |

`/api/merge-and-compute-ma99`'s response mapping is identical to existing `/api/predict`'s `queryMa99` / `queryMa99Gap` fields; can share mapping logic in `usePrediction.ts`.

---

## 5. Out of Scope

- Special handling when `historicalMa99` in MatchList is incomplete (existing MA incomplete display already in place)
- Early MA99 for 1D timeframe (architecture identical; this round does 1H first)
- `/api/predict` is not modified

---

## 6. Affected Files

| File | Change |
|---|---|
| `backend/models.py` | Add `Ma99Request` + `Ma99Response` models |
| `backend/main.py` | Add `/api/merge-and-compute-ma99` endpoint |
| `frontend/src/hooks/usePrediction.ts` | Add `computeMa99` function |
| `frontend/src/App.tsx` | Add `maLoading` state, trigger early MA99, extend `disabledReason` |
| `frontend/src/components/PredictButton.tsx` | Add `maLoading` disabled case |
| `frontend/src/components/MainChart.tsx` | Add `maLoading` prop and loading display |
| `frontend/src/components/MatchList.tsx` | Add `computeMaTrend` and trend label display |
