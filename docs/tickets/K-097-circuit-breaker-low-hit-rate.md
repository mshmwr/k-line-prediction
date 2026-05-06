---
ticket: K-097
title: daily_predict — circuit breaker on low_hit_rate edge threshold
status: open
phase: 1
opened: 2026-05-06
depends-on: []
qa-early-consultation: "✗"
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

- **AC-097-TRIGGER**: When the latest `backtest_summaries` doc has `low_hit_rate < 0.40`
  AND `sample_size >= 20`, `main()` logs a WARNING containing `"circuit breaker triggered"` and
  exits 0 without calling `write_prediction`. Verifiable via pytest mock of Firestore + exit code check.

- **AC-097-PASS**: When `low_hit_rate >= 0.40` OR `sample_size < 20`, prediction proceeds normally —
  no change to existing flow. Verifiable via existing `test_daily_predict.py` regression.

- **AC-097-FAILOPEN**: When Firestore read for `backtest_summaries` raises any exception,
  `main()` logs a WARNING containing `"circuit breaker skipped"` and proceeds with prediction.
  Verifiable via pytest mock of Firestore exception.

- **AC-097-LOG**: Every run logs circuit breaker outcome at INFO level:
  `"circuit breaker: low_hit_rate={x:.3f} sample_size={n} → triggered/passed/skipped"`.

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
