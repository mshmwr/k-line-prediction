---
ticket: K-089
title: Use second_lowest as projected_low
status: closed
phase: 1
opened: 2026-05-04
closed-commit: pending
depends-on: [K-088]
qa-early-consultation: "N/A — symmetric follow-up to K-088"
sacred-clauses: []
---

# K-089 — Use second_lowest as projected_low

## Problem

`run_prediction()` sets `projected_low = stats.lowest.price`, which is the absolute minimum of
bar-by-bar median lows across 72 projected bars. This under-estimates the downside in the same
way that K-088 found `highest` over-estimated the upside: the absolute extreme is rarely hit.

## Goal

Symmetric follow-up to K-088: switch `projected_low` to `stats.second_lowest.price`, matching
the pattern that improved `high_hit` rate in K-088.

## Acceptance Criteria

### §1 Prediction output

- `projected_low` in prediction dict = `stats.second_lowest.price` (not `stats.lowest.price`)
- All existing keys/types in prediction dict unchanged

### §2 Regression

- `python3 -m py_compile scripts/daily_predict.py` exits 0
- `pytest backend/tests/ -x` passes (excluding pre-existing known-reds:
  `test_history_db_contiguity.py` and `test_truncated_db_raises_sacred_value_error`)
