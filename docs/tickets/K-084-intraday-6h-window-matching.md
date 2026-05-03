---
id: K-084
title: Intraday 6H window random sampling for similarity matching
status: open
created: 2026-05-03
type: feat
priority: medium
size: medium
owner: engineer
dependencies: [K-080, K-083]
epic: backtest-self-tuning
qa-early-consultation: "complete — 5 challenges raised, 4 supplemented to AC, 1 declared Known Gap"
---

# K-084 — Intraday 6H window random sampling for similarity matching

## Summary

Extends the similarity matching strategy to operate on random intraday 6-hour windows instead of the full previous day. On each daily prediction run, a 6H window is randomly sampled (`hour_start ∈ [0, 17]`); the query is the 6 × 1H bars from that window, and only historical windows at the **same time-of-day slot** are eligible candidates. The 72H future projection is unchanged — it starts from the end of the 6H window. The goal is a strategy that is robust across any intraday time slot, not optimized for a specific one.

## Problem statement

The current daily predictor uses all 24 bars of the previous day as the query, searching unrestricted history. This treats all hours of the day identically and may dilute signal from intraday structure. By restricting both the query and the candidate pool to the same 6H time slot, the system can surface finer-grained intraday pattern similarity. Random sampling across all valid windows validates that the strategy generalises — if a 6H slot consistently yields no matches, that is itself a useful signal.

## Scope

**Modified files:**
- `backend/predictor.py` — add `hour_start: Optional[int] = None` to `find_top_matches()`; add `_get_bar_hour()` helper; in the sliding-window loop, skip positions where `history[i]` hour ≠ `hour_start` when the param is set
- `scripts/daily_predict.py` — pick `hour_start = random.randint(0, 17)` before building query; build 6-bar query from that window; pass `hour_start` to `find_top_matches`; write `hour_start` field to `predictions/{ts}` Firestore doc
- `backend/optimizer.py` — `evaluate_corpus()` picks `hour_start = random.randint(0, 17)` per completed pair evaluation
- `backend/firestore_config.py` — add `"hour_start"` to `FIRESTORE_PREDICTION_FIELDS` frozenset

**New test coverage:**
- `backend/tests/test_daily_predict.py` — verify `hour_start` written to prediction doc
- `backend/tests/test_weekly_optimize.py` — verify `evaluate_corpus()` passes `hour_start` to `find_top_matches`
- Unit tests for `_get_bar_hour()` and hour-filter path in `find_top_matches`

**Read-only (must not change):**
- `find_top_matches` return type and all existing callers — backward compatible via `hour_start=None` default
- 72H `future_n` lookahead — unchanged

**Out of scope:**
- Adding `hour_start` to Bayesian optimizer search space — Phase 2 candidate
- Changing the projection window duration (still 72H)
- Any frontend display of `hour_start`

## Acceptance Criteria

### AC-084-HOUR-PICK
- **Given** `daily_predict.py` runs
- **When** it builds the prediction query
- **Then** `hour_start = random.randint(0, 17)` is sampled before `build_query_window()`; the query passed to `find_top_matches` contains exactly 6 × 1H bars starting at `hour_start`

### AC-084-HISTORY-FILTER
- **Given** `find_top_matches(input_bars, ..., hour_start=10)`
- **When** the sliding window loop iterates over history
- **Then** only positions `i` where `_get_bar_hour(history[i]) == 10` are evaluated; positions at other hours are skipped

### AC-084-FALLBACK-NONE
- **Given** `find_top_matches(input_bars, ...)` called without `hour_start` (default `None`)
- **When** the function runs
- **Then** behaviour is identical to pre-K-084 — no positions are skipped based on hour

### AC-084-FUTURE-UNCHANGED
- **Given** a 6-bar query window ending at `hour_start + 5`
- **When** matches are found
- **Then** `future = history[i + 6 : i + 6 + future_n]` — 72H lookahead from the end of the 6H window; `future_n` is not modified

### AC-084-FIRESTORE-FIELD
- **Given** a prediction run completes with `hour_start=14`
- **When** `write_prediction()` is called
- **Then** the Firestore doc `predictions/{ts}` contains `"hour_start": 14`; `FIRESTORE_PREDICTION_FIELDS` frozenset includes `"hour_start"`

### AC-084-OPTIMIZER-RANDOM
- **Given** `evaluate_corpus(completed_pairs, snapshot, history_1h, history_1d)` is called
- **When** it evaluates each completed pair
- **Then** each pair independently samples `hour_start = random.randint(0, 17)` and passes it to `find_top_matches`

### AC-084-NO-MATCH-GRACEFUL
- **Given** `daily_predict.py` samples `hour_start` and calls `find_top_matches`
- **When** `find_top_matches` raises `ValueError` because no historical windows exist at that hour slot
- **Then** `daily_predict.py` catches the `ValueError`, logs a warning with the hour range, and exits 0 (graceful skip — same contract as stale-CSV skip); the `ValueError` from `find_top_matches` itself is unchanged

### AC-084-BAR-HOUR-FORMAT
- **Given** `_get_bar_hour(bar)` is called on a history bar
- **When** the bar's time field is a string `"YYYY-MM-DD HH:MM"` or a datetime object
- **Then** returns the correct integer hour in both cases; raises `ValueError` for unrecognised formats

### AC-084-FROZENSET-ATOMIC
- **Given** `FIRESTORE_PREDICTION_FIELDS` frozenset and `write_prediction()` dict
- **When** K-084 changes are committed
- **Then** both `"hour_start"` additions land in the **same commit**; no intermediate state where frozenset and writer are out of sync

### AC-084-CORPUS-TEST-DETERMINISM
- **Given** `test_weekly_optimize.py` tests that call `evaluate_corpus()`
- **When** tests assert on `hour_start` passed to `find_top_matches`
- **Then** tests patch `random.randint` (via `unittest.mock.patch`) with a fixed return value; no test relies on live random output

### AC-084-SACRED-FLOOR
- **Given** all existing sacred ACs (129-bar minimum, all K-0xx ACs)
- **When** K-084 changes are applied
- **Then** all sacred tests pass without modification

## Known Gaps

**KG-084-1: Sparse-hour degradation** — For `hour_start` values with few historical occurrences (e.g., hour_start=3 in low-liquidity periods), top-K candidates may be fewer than `params.top_k_matches`. The existing `results[:params.top_k_matches]` slice already handles this gracefully (returns fewer matches). No guard added — acceptable per Phase 1 scope.

**KG-084-2: Optimizer noise from per-pair randomness** — `evaluate_corpus()` using a different `hour_start` per pair adds stochastic noise to the Bayesian objective function. This is acceptable because the goal is to prove robustness across all windows, not to find the best window. If optimizer convergence degrades in practice, promoting `hour_start` to a search-space parameter is the Phase 2 fix.

**KG-084-3: CSV gap contamination in 6H window** — If the 1H CSV has missing bars (exchange downtime), `history[i:i+6]` may not be a clean contiguous 6H block even though `history[i]` passes the hour check. Existing code has no window-contiguity validation; K-084 does not add one. Acceptable for Phase 1.

## QA Early Consultation

5 challenges raised, 4 supplemented to AC, 1 declared Known Gap.

| # | Challenge | Resolution |
|---|---|---|
| QC-1 | `_get_bar_hour()` must handle string `"YYYY-MM-DD HH:MM"` and datetime; silent wrong extraction if not handled | → AC-084-BAR-HOUR-FORMAT |
| QC-2 | Sparse hours (e.g., 00:00–06:00 UTC) may yield 0 historical matches → `ValueError` propagates and crashes `daily_predict.py` run | → AC-084-NO-MATCH-GRACEFUL (catch + graceful exit 0) |
| QC-3 | `evaluate_corpus()` random per pair → non-deterministic → flaky tests without mock | → AC-084-CORPUS-TEST-DETERMINISM |
| QC-4 | `FIRESTORE_PREDICTION_FIELDS` frozenset and `write_prediction()` must both add `hour_start` atomically | → AC-084-FROZENSET-ATOMIC |
| QC-5 | CSV gap → `history[i:i+6]` may span a gap even when `history[i]` hour matches | → KG-084-3 |
