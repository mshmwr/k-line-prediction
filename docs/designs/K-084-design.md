# K-084 Design — Intraday 6H Window Random Sampling

**Ticket:** K-084  
**Phase:** Single  
**Status:** Design — pending Engineer implementation  
**Dependencies:** K-080 (daily_predict.py, write_prediction), K-083 (evaluate_corpus, optimizer.py)

---

## 0 Scope Questions

None. All AC constraints are unambiguous. No Pencil artifacts — backend-only ticket.

---

## 1 Options Analysis

### Option A (Conservative) — Add `hour_start` parameter only to `find_top_matches`; slice query externally

`daily_predict.py` slices the query window before calling `find_top_matches`; the hour filter in the loop is the only change to `predictor.py`. `build_query_window` is replaced by a new `build_6h_query_window` helper.

- **Applicable when:** risk of touching `build_query_window` is high (e.g., many callers).
- **Trade-off:** `build_query_window` stays 24-bar; a second function must be maintained in parallel. Callers must know which function to use.

### Option B (Middle ground — Recommended) — Add `build_6h_query_window` helper; modify `find_top_matches` and `evaluate_corpus`

`daily_predict.py` gains a new function `build_6h_query_window(df, anchor_ts, hour_start)` that returns exactly 6 bars. `find_top_matches` gains `hour_start: Optional[int] = None`. `evaluate_corpus` samples `hour_start` per pair and passes it through. `FIRESTORE_PREDICTION_FIELDS` and `write_prediction` dict both add `"hour_start"` in the same commit.

- **Applicable when:** the 24-bar `build_query_window` must remain untouched for backward compatibility (optimizer `_build_query_bars_from_prediction` relies on 24-bar reconstruction from predictions that pre-date K-084).
- **Trade-off:** Two `build_*_window` functions exist; clearly named so there is no ambiguity.

**Rationale:** Option B isolates the 6-bar slicing into its own named function, preserves the existing 24-bar path for optimizer replay of pre-K-084 predictions, and adds exactly one parameter to `find_top_matches` with a safe `None` default. This satisfies AC-084-FALLBACK-NONE without any conditional branching outside the loop.

### Option C (Progressive) — Generalize `build_query_window` to accept `n_bars` and `hour_start`

Replace `build_query_window` with a fully parameterized version; `n=24` is the default.

- **Applicable when:** the 24-bar path is already deprecated or you want a single function.
- **Trade-off:** changes a function used by the existing optimizer replay path (`_build_query_bars_from_prediction` looks up anchor by timestamp and slices 24 bars directly, so this function is not called there); but `main()` in `daily_predict.py` calls it directly — touching it risks breaking the pre-K-084 call path. Higher blast radius for a marginal DRY benefit.

**Recommendation:** Option B.

---

## 2 New / Changed Function Signatures

### 2.1 `_get_bar_hour(bar) -> int` — NEW in `backend/predictor.py`

```
_get_bar_hour(bar: dict | OHLCBar) -> int
```

**Logic:**
1. Extract time string via `_bar_time(bar)` (reuses existing helper — returns `str`).
2. If result is empty → raise `ValueError("bar has no time field")`.
3. Attempt parse as `datetime` if the value is already a `datetime` object (guard for callers that may pass typed bars).
4. If string: take `raw[11:13]` (characters at index 11–12 after the date prefix `YYYY-MM-DD `) and `int()` it.
5. Validate: `0 <= hour <= 23`; outside range → raise `ValueError(f"unrecognised time format: {raw!r}")`.
6. `datetime` object path: return `.hour` directly.

**Error contract:**
- Empty time field → `ValueError("bar has no time field")`
- Unrecognised format (cannot extract integer hour) → `ValueError(f"unrecognised time format: {raw!r}")`

**Format coverage (AC-084-BAR-HOUR-FORMAT):**
- `"2026-04-07 14:00"` → `14`
- `"2026-04-07 14:00:00"` → `14` (index 11:13 is `"14"`)
- `datetime(2026, 4, 7, 14, 0)` → `14`
- `""` / `None` propagated as empty string via `_bar_time` → `ValueError`

**Note on `_bar_time` return:** `_bar_time` always returns `str` (line 40–43 of predictor.py), so the datetime branch above is only reachable if someone passes a bar whose `time` attribute IS already a datetime (the `str()` call in `_bar_time` would convert it). The Engineer should handle both branches defensively:
- If `isinstance(bar, dict)` and `bar.get('date') or bar.get('time')` is a `datetime`, `_bar_time` wraps it in `str()`, giving e.g. `"2026-04-07 14:00:00"`.
- If the bar is an `OHLCBar` and `.time` is a `datetime`, same `str()` path applies.
- In both cases the string slice path handles it. The `isinstance(v, datetime)` shortcut is an optimization, not required for correctness.

### 2.2 `find_top_matches` — MODIFIED in `backend/predictor.py`

```
def find_top_matches(
    input_bars: List[OHLCBar],
    future_n: int = FUTURE_LOOKAHEAD_BARS,
    history=None,
    timeframe: str = '1H',
    ma_history=None,
    history_1d=None,
    hour_start: Optional[int] = None,         # NEW — K-084
) -> List[MatchCase]:
```

**Return type:** unchanged — `List[MatchCase]`.

**Filter insertion point:** immediately after `window = history[i:i + n]` and before any existing `continue` guard. The hour filter is the first `continue` in the loop body:

```
# existing loop head
for i in range(0, len(history) - n - future_n):
    window = history[i:i + n]
    # --- NEW K-084 hour filter ---
    if hour_start is not None and _get_bar_hour(history[i]) != hour_start:
        continue
    # --- existing guards follow unchanged ---
    candidate_end_time = ...
```

**Why `history[i]` not `window[0]`:** `window = history[i:i+n]` is a slice; `history[i]` and `window[0]` are the same element, but using `history[i]` avoids materialising the slice before the skip decision. Both are equivalent — Engineer may use either.

**Fallback (AC-084-FALLBACK-NONE):** when `hour_start is None`, the `if` body is never entered; zero behavioral difference from pre-K-084.

**ValueError message (zero-match path):** existing message is unchanged — the hour filter simply causes fewer positions to pass, producing the same `ValueError` raised when `not results`. The Engineer must NOT change the error message wording.

**`n` is now 6, not 24:** The function does not hard-code `n`; it reads `n = len(input_bars)`. Passing a 6-bar input automatically uses `n=6`; the future slice `history[i + n:i + n + future_n]` = `history[i+6:i+6+72]` — satisfying AC-084-FUTURE-UNCHANGED.

### 2.3 `build_6h_query_window` — NEW in `scripts/daily_predict.py`

```
def build_6h_query_window(df: pd.DataFrame, hour_start: int) -> pd.DataFrame:
```

**Logic:**
1. Filter `df` to rows where `df["time"].str[11:13].astype(int) == hour_start`.
2. Take the most recent bar from that filtered set as the anchor: `anchor = filtered.iloc[-1]`.
3. Identify anchor row index in `df`; take `df.iloc[anchor_idx - 5 : anchor_idx + 1]` — exactly 6 bars.
4. Validate: `len(result) == 6`; if not → raise `ValueError(f"Fewer than 6 bars available at hour_start={hour_start}; found {len(result)}.")`.
5. Return `result.reset_index(drop=True)`.

**Anchor time string:** The time column holds `"YYYY-MM-DD HH:MM"` strings (established by `load_csv_history_as_df`). Slice `[11:13]` yields the two-character hour.

**Edge case — bar not found:** If no row in `df` has hour == `hour_start`, `filtered` is empty → `anchor_idx` lookup fails → raise `ValueError`. This is the stale-CSV equivalent for this function.

**Important:** `build_query_window` (24-bar) is NOT modified. It remains the function used by `_build_query_bars_from_prediction` in optimizer.py (which reconstructs pre-K-084 24-bar windows from stored prediction docs). These two code paths are independent.

### 2.4 `evaluate_corpus` — MODIFIED in `backend/optimizer.py`

```
def evaluate_corpus(
    completed_pairs: list,
    snapshot,
    history_1h: list,
    history_1d: Optional[list] = None,
) -> float:
```

Signature is unchanged. Internal change only: per-pair `random.randint(0, 17)` call added inside the `for pair in completed_pairs:` loop, before the `find_top_matches` call.

**Exact placement:**

```
import random  # add at top of optimizer.py (module-level import)

# inside the for-loop, after query_bars is validated non-None:
hour_start = random.randint(0, 17)   # AC-084-OPTIMIZER-RANDOM
matches = _pred_mod.find_top_matches(
    input_bars=query_bars,
    history=history_1h,
    ma_history=history_1h,
    history_1d=history_1d,
    hour_start=hour_start,            # NEW
)
```

**Why inside the loop (not outside):** AC-084-OPTIMIZER-RANDOM requires each pair to independently sample. A single pre-loop sample would violate this.

**`_build_query_bars_from_prediction` window size:** This function still reconstructs 24-bar windows (line 141: `history[anchor_idx - 23 : anchor_idx + 1]`). K-084 does NOT change this — optimizer evaluates the same 24-bar query window it originally used, but now passes `hour_start` so the candidate pool is filtered. This is intentional: we are re-evaluating robustness across time slots, not re-building the query.

**Note:** The `random` module is already available in the Python standard library; no new dependency.

### 2.5 `FIRESTORE_PREDICTION_FIELDS` — MODIFIED in `backend/firestore_config.py`

Add `"hour_start"` to the frozenset:

```python
FIRESTORE_PREDICTION_FIELDS: frozenset = frozenset({
    "params_hash",
    "projected_high",
    "projected_low",
    "projected_median",
    "top_k_count",
    "trend",
    "query_ts",
    "created_at",
    "hour_start",    # K-084 — int: 0–17, the sampled window start hour
})
```

### 2.6 `run_prediction` and `main()` — MODIFIED in `scripts/daily_predict.py`

**`main()` changes:**

```
# After anchor_ts is set:
import random
hour_start = random.randint(0, 17)   # AC-084-HOUR-PICK
logger.info("hour_start: %d", hour_start)

# Replace:
#   query_df = build_query_window(df, anchor_ts)
# With:
try:
    query_df = build_6h_query_window(df, hour_start)
except ValueError as exc:
    logger.warning("build_6h_query_window failed for hour_start=%d: %s", hour_start, exc)
    sys.exit(0)  # graceful skip — same contract as stale CSV
```

**`run_prediction` signature change:**

```
def run_prediction(
    query_df: pd.DataFrame,
    params: ParamSnapshot,
    full_df: pd.DataFrame,
    hour_start: int,        # NEW — K-084
) -> dict:
```

**Inside `run_prediction`:**

1. Pass `hour_start=hour_start` to `find_top_matches`.
2. Add `"hour_start": hour_start` to BOTH the success-path return dict AND the zero-match (ValueError) return dict.

**AC-084-NO-MATCH-GRACEFUL:** The `ValueError` from `find_top_matches` when the hour filter leaves zero candidates is caught by the existing `except ValueError` block in `run_prediction`. The zero-match return dict includes `"hour_start": hour_start`. The prediction is written to Firestore with `top_k_count=0` — same as the pre-K-084 zero-match path.

**However:** If `build_6h_query_window` itself raises `ValueError` (no bars at `hour_start` in CSV), this is caught in `main()` before `run_prediction` is called. Exit 0, log warning with hour range. No Firestore write occurs.

**The two ValueError catch sites are distinct:**
- Site 1 (main): `build_6h_query_window` failure → exit 0, no write
- Site 2 (run_prediction): `find_top_matches` failure → write zero-match prediction including `hour_start`

---

## 3 Firestore Write Contract (AC-084-FIRESTORE-FIELD + AC-084-FROZENSET-ATOMIC)

The prediction dict written to Firestore gains exactly one new field:

| Field | Type | Nullability | Value range |
|---|---|---|---|
| `hour_start` | `int` | non-null in success path; non-null in zero-match path | 0–17 |

Both the frozenset (`FIRESTORE_PREDICTION_FIELDS`) and the `write_prediction` call-site dict must be updated in the same commit. The Engineer cannot split them across two commits — the test `test_prediction_write_field_set` asserts `set(written_data.keys()) == FIRESTORE_PREDICTION_FIELDS`; a mid-commit state would break this test.

**Zero-match dict also includes `hour_start`:** The zero-match return in `run_prediction` must include `"hour_start": hour_start`. Without it, the frozenset assertion test would fail on the zero-match path.

---

## 4 Boundary Pre-emption Table

| Boundary scenario | Behavior defined? | Contract |
|---|---|---|
| `hour_start=None` in `find_top_matches` | Yes | hour filter `if` never entered; pre-K-084 behavior preserved |
| `hour_start` value 0 (midnight) | Yes | valid; `_get_bar_hour` returns 0; filter applies normally |
| `hour_start` value 17 (last valid) | Yes | valid; 6H window = bars 17–22 |
| `hour_start` 18–23 (out of range for 6H) | Yes (via `random.randint(0, 17)`) | never sampled; `_get_bar_hour` does NOT enforce range; `random.randint` boundary is at call site |
| `_get_bar_hour` on bar with no time field | Yes | raises `ValueError("bar has no time field")` |
| `_get_bar_hour` on unrecognised format | Yes | raises `ValueError(f"unrecognised time format: {raw!r}")` |
| `build_6h_query_window` — no bars at `hour_start` | Yes | raises `ValueError`; caught in `main()` → exit 0 |
| `find_top_matches` — no candidates survive hour filter | Yes | existing `not results` path raises `ValueError`; caught in `run_prediction` → zero-match doc |
| Fewer than 6 consecutive bars at `hour_start` in CSV | Yes (KG-084-3) | `build_6h_query_window` will find 6 bars by anchor-minus-5 slicing regardless of contiguity gap — this is the Known Gap; no validation added in Phase 1 |
| `evaluate_corpus` corpus with 0 scoreable pairs after hour filter | Yes | existing `if total == 0: return 0.0` path; unchanged |
| `evaluate_corpus` — `random.randint` mock in tests | Yes (AC-084-CORPUS-TEST-DETERMINISM) | `patch("random.randint")` at the optimizer module namespace |

---

## 5 File Change List

| File | Change type | Description |
|---|---|---|
| `backend/predictor.py` | Modify | Add `_get_bar_hour()` helper; add `hour_start: Optional[int] = None` param to `find_top_matches`; add hour filter as first `continue` in sliding-window loop |
| `scripts/daily_predict.py` | Modify | Add `build_6h_query_window()`; add `hour_start = random.randint(0, 17)` in `main()`; thread `hour_start` through `run_prediction` call and prediction dict (both success and zero-match paths) |
| `backend/optimizer.py` | Modify | Add `import random`; add per-pair `hour_start = random.randint(0, 17)` and pass to `find_top_matches` inside `evaluate_corpus` loop |
| `backend/firestore_config.py` | Modify | Add `"hour_start"` to `FIRESTORE_PREDICTION_FIELDS` frozenset — MUST be same commit as `run_prediction` dict change |
| `backend/tests/test_daily_predict.py` | Modify | Update `test_prediction_write_field_set` to include `"hour_start"` in test prediction dict; add `test_hour_start_written_to_prediction` (AC-084-FIRESTORE-FIELD); add `test_build_6h_query_window_*` unit tests |
| `backend/tests/test_weekly_optimize.py` | Modify | Add `test_evaluate_corpus_passes_hour_start` (AC-084-OPTIMIZER-RANDOM + AC-084-CORPUS-TEST-DETERMINISM); patch `random.randint` to deterministic value |
| `backend/tests/test_predictor.py` | Modify | Add `test_get_bar_hour_string_format`, `test_get_bar_hour_datetime_format`, `test_get_bar_hour_invalid_format`; add `test_find_top_matches_hour_filter_skips_non_matching` and `test_find_top_matches_hour_start_none_unchanged` |

---

## 6 Implementation Order

**Step 1 — `backend/predictor.py`** (no external dependencies)
- Add `_get_bar_hour()` immediately below `_bar_time()` (logical grouping)
- Add `hour_start: Optional[int] = None` to `find_top_matches` signature
- Add filter in loop

**Step 2 — `backend/firestore_config.py`** (no external dependencies)
- Add `"hour_start"` to `FIRESTORE_PREDICTION_FIELDS`

**Step 3 — `scripts/daily_predict.py`** (depends on Steps 1 and 2)
- Add `build_6h_query_window()` function
- Update `run_prediction()` signature and dict construction (both paths)
- Update `main()` to sample `hour_start` and call `build_6h_query_window`
- Steps 2 and 3 MUST land in the same commit (AC-084-FROZENSET-ATOMIC)

**Step 4 — `backend/optimizer.py`** (depends on Step 1)
- Add `import random`
- Add per-pair `hour_start` sampling in `evaluate_corpus`

**Step 5 — Tests** (depends on Steps 1–4)
- Update existing `test_prediction_write_field_set` to include `"hour_start"`
- Add new test cases per §7

Steps 1–4 can be verified with `python -m py_compile` after each file edit. Full test suite runs after Step 5.

---

## 7 Test Strategy

### Tests in `backend/tests/test_predictor.py` (new — unit tests for `_get_bar_hour`)

| Test ID | Assertion |
|---|---|
| `test_get_bar_hour_string_yyyy_mm_dd_hhmm` | `_get_bar_hour({"date": "2026-04-07 14:00"})` returns `14` |
| `test_get_bar_hour_string_hhmm_zero` | `_get_bar_hour({"date": "2026-04-07 00:00"})` returns `0` |
| `test_get_bar_hour_empty_time_raises` | `_get_bar_hour({"date": ""})` raises `ValueError` |
| `test_get_bar_hour_no_time_field_raises` | `_get_bar_hour({})` raises `ValueError` |
| `test_find_top_matches_hour_filter_skips` | With `hour_start=10`, mock history contains bars only at hour 10 and hour 5; only hour-10 positions scored |
| `test_find_top_matches_hour_start_none_unchanged` | Calling `find_top_matches` without `hour_start` does not skip any position; same behavior as pre-K-084 |

### Tests in `backend/tests/test_daily_predict.py` (new + updated)

| Test ID | Assertion |
|---|---|
| `test_prediction_write_field_set` (UPDATED) | Prediction dict now includes `"hour_start": <int>`; `set(written_data.keys()) == FIRESTORE_PREDICTION_FIELDS` still passes |
| `test_hour_start_written_to_prediction` | `run_prediction` with `hour_start=14` produces a dict containing `"hour_start": 14` |
| `test_zero_match_prediction_includes_hour_start` | `run_prediction` zero-match case includes `"hour_start"` in returned dict |
| `test_build_6h_query_window_returns_6_bars` | Given a DataFrame with bars at hour 14, `build_6h_query_window(df, 14)` returns a 6-row DataFrame |
| `test_build_6h_query_window_missing_hour_raises` | No bars at `hour_start=3` → raises `ValueError` |

### Tests in `backend/tests/test_weekly_optimize.py` (new)

| Test ID | Assertion |
|---|---|
| `test_evaluate_corpus_passes_hour_start` | With `patch("random.randint", return_value=10)`, `find_top_matches` is called with `hour_start=10` for each pair |
| `test_evaluate_corpus_hour_start_per_pair_independent` | `patch("random.randint", side_effect=[5, 12, 3])` (3 pairs); `find_top_matches` calls receive `hour_start=5`, `hour_start=12`, `hour_start=3` in that order |

**Mock placement for `random.randint`:** patch at `"random.randint"` globally; `optimizer.py` calls `random.randint` directly after `import random` at module level. Patch target is `"random.randint"`.

---

## 8 Refactorability Checklist

- [x] **Single responsibility:** `_get_bar_hour` does one thing — extracts integer hour from a bar. `build_6h_query_window` does one thing — returns a 6-bar slice for a given hour. Each change is isolated.
- [x] **Interface minimization:** `hour_start: Optional[int] = None` is the only added parameter to `find_top_matches`; default preserves all existing callers without modification.
- [x] **Unidirectional dependency:** `optimizer.py → predictor.py`, `daily_predict.py → predictor.py`, `daily_predict.py → firestore_config.py`. No new circular edges introduced.
- [x] **Replacement cost:** `random.randint` is used in two call sites (`daily_predict.py` and `optimizer.py`). Swapping to a different sampling strategy requires editing those two files only.
- [x] **Clear test entry point:** `_get_bar_hour(bar) -> int` — input is a bar dict or OHLCBar, output is an integer hour. `build_6h_query_window(df, hour_start) -> pd.DataFrame` — input is full DataFrame and hour int, output is 6-row DataFrame.
- [x] **Change isolation:** `find_top_matches` return type unchanged; no change to any other function signature or Firestore collection structure beyond adding one field.

---

## 9 All-Phase Coverage Gate

| Phase | Backend API | Frontend Routes | Component Tree | Props Interface |
|---|---|---|---|---|
| Single (K-084) | `find_top_matches` + `evaluate_corpus` + `run_prediction` + `build_6h_query_window` — all defined | N/A — backend only | N/A | N/A |

Frontend is explicitly out of scope (ticket §Scope "Out of scope: Any frontend display of hour_start"). Route impact table: N/A — no frontend file changes.

---

## 10 Sacred AC Cross-Check

No JSX nodes are restructured. No `data-testid`, `trackCtaClick`, `target="_blank"`, or DOM adjacency patterns are touched. No frontend files are modified.

Sacred ACs (from `AC-084-SACRED-FLOOR`): all pre-K-084 tests — including 129-bar minimum, K-080 field set contract, K-083 objective function — must pass without modification after K-084 changes. The `hour_start=None` default ensures pre-K-084 callers (`main.py` FastAPI endpoint, etc.) are unaffected.

---

## 11 Architecture Doc Sync

`ssot/system-overview.md` requires one update:

- **Daily Workflow section:** replace "24 × 1H bars ending yesterday 23:00 UTC" with "6 × 1H bars at randomly sampled `hour_start ∈ [0, 17]`"
- **Firestore Config Layer table:** add `hour_start` field annotation to predictions row
- **Changelog:** add K-084 entry

This sync is the Architect's responsibility in this session (executed after design doc commit).

---

## Retrospective

**Where most time was spent:** Verifying the two distinct ValueError catch sites — `build_6h_query_window` failure vs `find_top_matches` zero-match — and ensuring AC-084-NO-MATCH-GRACEFUL is satisfied at the correct layer (main vs run_prediction).

**Which decisions needed revision:** Initial read of `_build_query_bars_from_prediction` suggested it should be updated to use 6-bar windows; on closer inspection, it reconstructs pre-K-084 predictions for optimizer replay — changing it to 6 bars would silently corrupt historical evaluation. Kept at 24 bars.

**Next time improvement:** When two functions have similar names and related purposes (`build_query_window` vs `_build_query_bars_from_prediction`), explicitly list both and confirm their independent roles before deciding which to modify.
