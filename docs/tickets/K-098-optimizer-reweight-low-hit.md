---
ticket: K-098
title: optimizer — reweight objective to 0.3 high + 0.7 low hit rate
status: open
phase: 1
opened: 2026-05-06
depends-on: [K-097]
qa-early-consultation: "✗"
sacred-clauses: []
---

# K-098 — optimizer objective reweight to favour low_hit_rate

## Problem

Current optimizer objective in `evaluate_corpus()`:

```python
score = 0.5 * high_hit_rate + 0.5 * low_hit_rate
```

Quant analysis (2026-05-06) found `projected_high` is on average only +2.0% above current price,
making `high_hit_rate` largely driven by normal ETH volatility rather than model skill.
Equal weighting gives the optimizer a noisy signal: it optimises half its objective against a
metric that correlates with market vol, not pattern match quality.

`low_hit_rate` (target ~−5.6% from close) requires a genuine directional move and is a better
proxy for model edge.

## Goal

Reweight `evaluate_corpus()` objective to `0.3 * high_hit_rate + 0.7 * low_hit_rate`,
shifting Bayesian search to favour param sets with real downside prediction skill.

## Acceptance Criteria

- **AC-098-WEIGHT**: `evaluate_corpus()` in `backend/optimizer.py` returns
  `0.3 * high_hit_rate + 0.7 * low_hit_rate` (not 0.5/0.5). Verifiable via unit test with
  known hit counts.

- **AC-098-DOCSTRING**: Docstring for `evaluate_corpus()` updated to state new weights and rationale
  (`high_hit inflated by normal ETH volatility; low_hit is the stronger edge signal`).

- **AC-098-REGRESSION**: All existing `test_weekly_optimize.py` tests pass without modification
  (or with minimal numerical updates to expected scores).

## File Change List

| File | Change |
|---|---|
| `backend/optimizer.py` | Change weight constants in `evaluate_corpus()`: `0.5 / 0.5` → `0.3 / 0.7`; update docstring |
| `backend/tests/test_weekly_optimize.py` | Update expected score values if hardcoded to old 0.5/0.5 weights |

## Notes

- Weight constants should be named `HIGH_HIT_WEIGHT = 0.3` and `LOW_HIT_WEIGHT = 0.7` at
  module level for future tuning.
- This change affects the next weekly optimize run's param search only. Existing `predictor_params/active`
  in Firestore is unaffected until Monday's cron.
- Depends on K-097 being merged first so the optimizer runs on a corpus that has already
  been filtered by the circuit breaker.
