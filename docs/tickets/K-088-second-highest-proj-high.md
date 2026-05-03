---
ticket: K-088
title: Use second_highest as projected_high
status: open
phase: 1
opened: 2026-05-04
closed-commit: ~
depends-on: []
qa-early-consultation: ✓
sacred-clauses: []
---

# K-088 — Use second_highest as projected_high

## Problem

`run_prediction()` sets `projected_high = stats.highest.price`, which is the absolute maximum of
bar-by-bar median highs across 72 projected bars. This over-estimates the upside: backtest over
2026-04-19 ~ 04-29 shows high_hit = 36.4%, low_hit = 72.7%, score = 0.5455.

## Goal

Switch `projected_high` to `stats.second_highest.price`. Backtest A/B shows this raises
high_hit to 54.5% and overall score to 0.5909 (+0.045) at the cost of low_hit dropping to 63.6%.

## Acceptance Criteria

### §1 Prediction output

- `projected_high` in prediction dict = `stats.second_highest.price` (not `stats.highest.price`)
- All existing keys/types in prediction dict unchanged

### §2 Backtest regression

- `python -m py_compile scripts/daily_predict.py` exits 0
- `pytest backend/tests/ -x` passes
