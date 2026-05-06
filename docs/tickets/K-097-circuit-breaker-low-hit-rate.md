---
ticket: K-097
title: daily_predict — circuit breaker on low_hit_rate edge threshold
status: closed
phase: 1
opened: 2026-05-06
closed-commit: b783985
depends-on: []
qa-early-consultation: "docs/retrospectives/pm.md 2026-05-06 K-097 (QA proxy by PM, 6 challenges)"
sacred-clauses: []
---

# K-097 — daily_predict circuit breaker on low_hit_rate

## Problem

The daily prediction pipeline runs unconditionally regardless of whether the model has any edge.
Quant analysis (2026-05-06) found:

- `projected_high` is on average only **+2.0% above current close** — within normal 72-hour ETH volatility.
  `high_hit_rate` is systematically inflated by market noise, not model signal.
- `projected_low` is on average **−5.6% below current close** — a meaningful target that requires
  a genuine downside move. `low_hit_rate` is the more reliable edge indicator.
- No circuit breaker exists. When the model loses edge, the system continues producing predictions,
  polluting `actuals/` and misleading the weekly optimizer.

## Goal

Add a circuit breaker in `daily_predict.py`: before running prediction, read the latest
`backtest_summaries` doc; if `low_hit_rate < 0.40 AND sample_size >= 20`, skip the prediction
and exit 0 with a WARNING log. Fail-open if Firestore read fails.

## Acceptance Criteria

- **AC-097-TRIGGER**: When the latest `backtest_summaries` doc has `hit_rate_low < 0.40`
  AND `sample_size >= 20`, `main()` logs a WARNING containing `"circuit breaker triggered"` and
  exits 0 (SystemExit code 0) without calling `write_prediction`. Verifiable via pytest mock of
  Firestore + `pytest.raises(SystemExit)` with `exc_info.value.code == 0`.

- **AC-097-PASS**: When `hit_rate_low >= 0.40` OR `sample_size < 20`, prediction proceeds normally —
  no change to existing flow. Verifiable via existing `test_daily_predict.py` regression.

- **AC-097-FAILOPEN**: When Firestore read for `backtest_summaries` raises any exception
  (including `google.cloud.exceptions.FailedPrecondition` for missing index), `main()` logs a
  WARNING containing `"circuit breaker skipped"` and proceeds with prediction. Verifiable via
  pytest mock raising Exception on the Firestore query.

- **AC-097-LOG**: Every run logs circuit breaker outcome at INFO level:
  `"circuit breaker: hit_rate_low={x:.3f} sample_size={n} → triggered/passed/skipped"`.

## File Change List

| File | Change |
|---|---|
| `scripts/daily_predict.py` | Add `check_circuit_breaker(client)` helper + call in `main()` after Firestore client init |
| `backend/tests/test_daily_predict.py` | Add 3 test cases: trigger / pass / fail-open |

## Notes

- Read `backtest_summaries` using existing `client` (already initialised in `main()` at this point).
- Query: `client.collection("backtest_summaries").order_by("computed_at", direction="DESCENDING").limit(1)`.
- Threshold `0.40` is the initial value; the constant should be named `CIRCUIT_BREAKER_LOW_HIT_THRESHOLD`
  for future tuning.
- `sample_size >= 20` guard prevents false triggering during cold-start (< 20 completed pairs).
- The Firestore field written by `compute_backtest_summary()` is `hit_rate_low` (not `low_hit_rate`);
  `check_circuit_breaker` must read `doc.get("hit_rate_low")`.
- Empty `backtest_summaries` collection (0 docs returned, no exception) → treat as no-data → proceed
  normally; this is the same code path as `sample_size < 20`. Only a raised exception triggers fail-open.
- `check_circuit_breaker` runs after `client = google.cloud.firestore.Client()` (currently line ~498
  in `main()`) and before `write_prediction`. Prediction computation (`run_prediction`) may have already
  run at that point; the gate controls only whether the result is written.
