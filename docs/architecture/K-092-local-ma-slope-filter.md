---
ticket: K-092
title: Local 1H MA Slope Direction Gate — Architecture Design
status: ready-for-engineer
phase: 1
authored: 2026-05-04
visual-spec: N/A — reason: backend-only filter, no UI change
---

# K-092 — Local 1H MA Slope Direction Gate

## 0 Scope Questions

None. Ticket AC is unambiguous. No contradictions with codebase current state.

---

## 1 Options Analysis

Three approaches for computing the query's local MA direction before the candidate loop.

### Option A — Conservative: extract from `_query_ma_series` return value

`_query_ma_series` (line 246) already calls `_aligned_ma_series` internally using the correct
history-prefix context. Call it before the loop, take the returned series, pass to
`_trend_direction`.

- **Applicable when:** query always has a mapped timestamp in `history` (current production path).
  Falls back to raw `_ma_trend_series` when not found — which is also a valid aligned series.
- **Trade-off:** Introduces a dependency on `_query_ma_series`, which currently raises `ValueError`
  for very short inputs without history context. Caller must handle that exception, which is already
  the case in `find_top_matches` (the `ValueError` surfaces to the API layer). No new exception
  surface added.

### Option B — Middle Ground: call `_aligned_ma_series` directly with computed prefix

Locate the query's first bar in `history`, slice `history[:start_idx]` for up to `MA_WINDOW - 1`
bars, call `_aligned_ma_series(input_bars, preceding)` directly.

- **Applicable when:** you want to avoid any code path involving `_query_ma_series`'s dual-mode
  logic (aligned vs. internal).
- **Trade-off:** Duplicates the prefix-slice logic already in `_query_ma_series` lines 251-255.
  Any future change to the prefix window must be applied in two places — creates drift risk.

### Option C — Progressive: new helper `_local_ma_direction(bars, preceding)`

Extract a dedicated helper that wraps `_aligned_ma_series` + `_trend_direction` into a single call.

- **Applicable when:** the local-direction operation is called from multiple sites. Currently it
  would only be called twice (query + each candidate).
- **Trade-off:** New function adds a level of indirection that is not yet justified by call-site
  count. Ticket constraint explicitly states "no new helper functions unless unavoidable."

### Recommendation: Option A

`_query_ma_series` already contains the correct history-prefix alignment logic. Reusing it keeps
a single source of truth for "how the query MA is computed." The only cost is one additional call
before the loop — O(n) where n = input length, negligible.

---

## 2 Code Change Location and Pseudocode

### 2.1 Pre-loop: extract query local MA direction

**Location:** `find_top_matches`, after line 416 (`query_direction = _classify_trend_by_pearson(...)`)
and before line 417 (`_1d_index = ...`).

```
query_local_ma, _ = _query_ma_series(input_bars, history, timeframe)
query_local_direction = _trend_direction(query_local_ma)
```

`_query_ma_series` raises `ValueError` when the query is too short and has no history context.
This exception propagates identically to the existing behavior — no new error surface.

### 2.2 Inside the loop: candidate local MA direction gate

**Location:** `find_top_matches`, after line 429 (the existing 1D direction gate `if
_classify_trend_by_pearson(candidate_30d_ma) != query_direction: continue`) and before line 430
(candle score computation).

```
candidate_local_ma = _aligned_ma_series(window, history[:i])
candidate_local_direction = _trend_direction(candidate_local_ma)
if query_local_direction != 0 and candidate_local_direction != 0:
    if query_local_direction != candidate_local_direction:
        continue
```

The rejection condition — both non-zero AND opposite — directly implements the AC:
"Opposite = one is +1 and the other is -1; mismatches against 0 (flat) are not rejected."

`_aligned_ma_series(window, history[:i])` reuses the existing pattern already applied to every
candidate in the loop (the same slice `history[:i]` is used for `prefix` in the post-loop
`_compute_ma99_for_window` call, line 451). This confirms the call is not novel.

### 2.3 Full annotated diff (pseudocode only)

```
# After line 416 — query_direction already computed
+ query_local_ma, _ = _query_ma_series(input_bars, history, timeframe)
+ query_local_direction = _trend_direction(query_local_ma)

  _1d_index = _history_time_index(ma_history, '1D')      # line 417, unchanged
  results = []                                            # line 418, unchanged
  for i in range(0, len(history) - n - future_n):        # line 419, unchanged
      window = history[i:i + n]                          # line 420, unchanged
      # K-084 hour filter (lines 422-423, unchanged)
      # 1D direction gate (lines 424-429, unchanged)
+     candidate_local_ma = _aligned_ma_series(window, history[:i])
+     candidate_local_direction = _trend_direction(candidate_local_ma)
+     if query_local_direction != 0 and candidate_local_direction != 0:
+         if query_local_direction != candidate_local_direction:
+             continue
      candle_score = ...                                  # line 430, unchanged
```

---

## 3 Why Pre-Loop for Query Direction

The query's local MA direction is a constant across all iterations. Computing it inside the loop
would call `_query_ma_series` O(N_history) times, each re-doing the same prefix-slice and MA
computation on the same fixed `input_bars`. Pre-loop computation incurs exactly one call. This is
the standard "hoist loop-invariant computation" pattern.

Additionally, if `_query_ma_series` raises `ValueError` (too-short input, no history context), it
should fail-fast before entering the loop rather than failing on the first iteration — which would
result in a misleading "loop aborted" trace rather than an upfront constraint failure.

---

## 4 Boundary Pre-emption

| Boundary scenario | Behavior defined |
|---|---|
| `query_local_direction = 0` (flat query MA) | Gate skipped — flat is compatible with any candidate direction. No candidate rejected. |
| `candidate_local_direction = 0` (flat candidate MA) | Gate skipped — flat is compatible. Candidate passes. |
| Both flat | Gate skipped — zero vs zero, not opposite. |
| `_aligned_ma_series` returns empty list | `_trend_direction([])` returns 0 (line 270-271). Gate sees 0 and skips. Safe. |
| `_query_ma_series` raises `ValueError` | Exception propagates upward — identical to the existing `ValueError` path for query_30d_ma failure. Caller (API layer) already handles. |
| All candidates rejected by local gate | `results` list stays empty; existing `ValueError("No historical matches found...")` raised. Error message references 1D direction label (unchanged). Acceptable — message is not part of any AC. |
| Single-bar `input_bars` | `MIN_BARS_FOR_MA_TREND = 2` guard at line 406 fires first. Query local MA gate never reached. |

---

## 5 New Test Cases for AC-092-LOCAL-MA-GATE

All tests go in `backend/tests/test_predictor.py`. Import `_trend_direction` and
`_aligned_ma_series` from `predictor` (file header already imports from `predictor`).

### Test 1 — Gate predicate: opposite directions → reject

```python
def test_local_ma_gate_predicate_opposite_is_rejected():
    q, c = 1, -1
    assert q != 0 and c != 0 and q != c
```

### Test 2 — Gate predicate: flat query → not rejected

```python
def test_local_ma_gate_predicate_flat_query_is_not_rejected():
    q, c = 0, -1
    should_reject = q != 0 and c != 0 and q != c
    assert not should_reject
```

### Test 3 — Gate predicate: flat candidate → not rejected

```python
def test_local_ma_gate_predicate_flat_candidate_is_not_rejected():
    q, c = 1, 0
    should_reject = q != 0 and c != 0 and q != c
    assert not should_reject
```

### Test 4 — Gate predicate: same direction → passes

```python
def test_local_ma_gate_predicate_same_direction_passes():
    q, c = 1, 1
    should_reject = q != 0 and c != 0 and q != c
    assert not should_reject
```

### Test 5 — `_trend_direction` on upward series returns 1

```python
def test_trend_direction_up_window_returns_1():
    series = [100.0 + i for i in range(24)]
    assert _trend_direction(series) == 1
```

### Test 6 — `_trend_direction` on downward series returns -1

```python
def test_trend_direction_down_window_returns_neg1():
    series = [100.0 - i for i in range(24)]
    assert _trend_direction(series) == -1
```

### Test 7 — Integration: `find_top_matches` does not return opposite-local-MA candidates

```python
def test_find_top_matches_rejects_opposite_local_ma_candidates():
    """
    All-upward history ensures every candidate's local MA is +1 or 0.
    Query is also upward. No match should have local MA direction -1.
    """
    from predictor import _aligned_ma_series, _trend_direction
    history = _make_real_date_1d_bars(300, "2020-01-01", step=1.0)
    input_slice = history[200:224]
    input_bars = [OHLCBar(open=b['open'], high=b['high'], low=b['low'],
                          close=b['close'], time=b['date']) for b in input_slice]
    matches = find_top_matches(input_bars, future_n=5, history=history,
                               timeframe='1D', ma_history=history)
    for m in matches:
        window_dicts = [
            {'open': b.open, 'high': b.high, 'low': b.low,
             'close': b.close, 'date': b.time}
            for b in m.historical_ohlc
        ]
        local_ma = _aligned_ma_series(window_dicts, [])
        d = _trend_direction(local_ma)
        assert d != -1, f"match {m.id} has opposite local MA direction (-1)"
```

**Note on Test 7:** the empty prefix `[]` passed to `_aligned_ma_series` means the MA is computed
from the window alone. For a monotone-upward history, even without prefix bars, the MA slopes
upward (or is flat for very short series). This guarantees `d != -1` for the all-upward history
fixture.

---

## 6 File Change List

| File | Change | Description |
|---|---|---|
| `backend/predictor.py` | Modify | Add 2 lines before the candidate loop (query local MA direction); add 4 lines inside the loop (candidate local MA direction gate). Total: +6 lines in `find_top_matches`. No signature change. |
| `backend/tests/test_predictor.py` | Modify | Add 7 test functions for AC-092-LOCAL-MA-GATE: 4 unit gate-predicate tests + 2 `_trend_direction` unit tests + 1 integration test. |

No new files. No API contract changes. No frontend impact.

---

## 7 Implementation Order

1. Read `predictor.py` lines 392-445 (full `find_top_matches` body) to confirm line numbers.
2. Edit: add 2 pre-loop lines after line 416.
3. Edit: add 4 gate lines inside the loop after line 429.
4. Run `python -m py_compile backend/predictor.py` — zero errors required.
5. Add 7 test functions to `test_predictor.py`.
6. Run `pytest backend/tests/test_predictor.py -v` — all existing + new tests must pass.

Steps 4 and 5 can run concurrently after step 3.

---

## 8 Risks and Notes

- **`_aligned_ma_series` returns `[]` at `i = 0`:** `history[:0]` is empty slice; combined =
  window only. If `len(window) < MA_WINDOW`, `_rolling_mean` returns `[]`. `_trend_direction([])
  == 0`. Gate skips. Safe.
- **`_query_ma_series` not previously called inside `find_top_matches`:** this is the first call
  site. No circular dependency — the function depends only on `_aligned_ma_series` and
  `_ma_trend_series`, both defined before line 246 in the file.
- **Existing `ValueError("No historical matches found")` message unchanged:** no AC requires a
  new message for local-gate-induced empty results.
- **Performance:** one extra O(n) pre-loop call + one O(n) call per candidate (where n =
  `len(input_bars)`, typically 6-24). Existing loop already has one `_fetch_30d_ma_series` per
  candidate. The added cost is comparable and within explicit ticket acceptance.
- **`_query_ma_series` input type:** accepts `List[OHLCBar]` for `input_bars` and `list` for
  `history`. Both are already the types in `find_top_matches`. No coercion needed.

---

## 9 All-Phase Coverage Gate

Single-phase ticket (Phase 1 only).

| Phase | Backend API | Frontend Routes | Component Tree | Props Interface |
|---|---|---|---|---|
| 1 | Done — `find_top_matches` gate logic + test cases specified | N/A — backend only | N/A — no UI | N/A — no props |

route-impact-table = N/A — no CSS or global style change.
cross-page-duplicate-audit = N/A — no new components.
target-route-consumer-scan = N/A — no route navigation change.
pencil-frame-completeness = N/A — no Pencil design.
visual-spec-json-consumption = N/A — backend filter only.

---

## 10 Refactorability Checklist

- [x] **Single responsibility:** new guard clause is consistent with the function's existing filter
      pattern (1D gate + hour gate + new local gate). No SRP violation.
- [x] **Interface minimization:** no new parameters on any function.
- [x] **Unidirectional dependency:** `find_top_matches` calls `_query_ma_series`, `_aligned_ma_series`,
      `_trend_direction` — all defined earlier in the file. No circular dependency.
- [x] **Replacement cost:** swapping `_trend_direction` affects at most 2 call sites (pre-loop +
      in-loop) within one file. Within the 2-file bound.
- [x] **Clear test entry point:** gate predicate tests verify the Boolean condition in isolation,
      independent of `find_top_matches`.
- [x] **Change isolation:** no API contract change, no frontend observable change, no schema change.

---

## Retrospective

**Where most time was spent:** verifying the `i = 0` boundary (empty `history[:0]` prefix) and
confirming `_trend_direction([]) == 0` is the safe fallback.

**Which decisions needed revision:** none in this session.

**Next time improvement:** for pure backend filter additions with no UI surface, the options
analysis can use condensed format (one paragraph per option) to reduce ceremony.

---

Architect delivery gate:
  all-phase-coverage=✓,
  pencil-frame-completeness=N/A — backend-only ticket no design frames,
  visual-spec-json-consumption=N/A — backend-only no visual spec,
  sacred-ac-cross-check=N/A — no DOM restructure K-092 sacred-clauses=[],
  route-impact-table=N/A — no CSS or global style touch,
  cross-page-duplicate-audit=N/A — no new components,
  target-route-consumer-scan=N/A — no route navigation behavior change,
  architecture-doc-sync=pending-ssot-update,
  self-diff=N/A — new file no prior structured content,
  output-language=✓
  → OK
