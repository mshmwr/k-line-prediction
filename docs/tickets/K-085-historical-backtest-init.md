---
ticket: K-085
title: Historical Backtest Initialization
status: closed
phase: 1
opened: 2026-05-03
closed-commit: 5ed3880
depends-on: K-083, K-084
qa-early-consultation: ✓
sacred-clauses: []
---

# K-085 — Historical Backtest Initialization

## Problem

The Bayesian optimizer (K-083/K-084) needs 30+ days of live prediction samples before it can run its first meaningful optimization. We already have years of historical OHLC CSV data, so we can bootstrap Firestore with historical backtest samples immediately — cutting the wait to zero.

## Goal

A one-time (re-runnable) script that walks back 365 calendar days, simulates what the predictor would have output for each day, and writes prediction + actual docs to Firestore. After running, the weekly optimizer can fire on day 0.

## Acceptance Criteria

### §1 Script

**AC-085-SCRIPT-EXISTS**
- Given `scripts/historical_backtest.py` exists,
- When `python -m py_compile scripts/historical_backtest.py` runs,
- Then exit code 0 (no syntax errors).

**AC-085-DATE-RANGE**
- Given `--days N` CLI arg (default 365),
- When script runs,
- Then it processes every calendar day D in `[today - N days, today - 4 days]` (4-day buffer ensures 72H actuals are complete with margin).

### §2 Lookahead Safety

**AC-085-NO-LOOKAHEAD**
- Given day D is being processed,
- When `find_top_matches()` is called,
- Then the `history_df` passed in contains ONLY rows where `open_time < D`; no future data visible to the matcher.

**AC-085-ACTUAL-WINDOW**
- Given day D is being processed,
- When computing actuals,
- Then actual high/low are derived from CSV rows in `[D, D + 72H]` only.

### §3 Firestore Writes

**AC-085-PREDICTION-DOC**
- Given a successful prediction for day D,
- When written to Firestore,
- Then doc at `predictions/{D-ISO}` contains: `query_bar`, `proj_high`, `proj_low`, `proj_median`, `params_hash`, `source: "historical"`, `created_at`.

**AC-085-ACTUAL-DOC**
- Given a successful actual computation for day D,
- When written to Firestore,
- Then doc at `actuals/{D-ISO}` contains: `actual_high`, `actual_low`, `high_hit`, `low_hit`, `source: "historical"`, `created_at`.

**AC-085-IDEMPOTENT**
- Given `predictions/{D-ISO}` already exists in Firestore,
- When the script re-runs over the same date range,
- Then that day is skipped (no duplicate write, no error).

### §4 Summary Recomputation

**AC-085-SUMMARY-RECOMPUTE**
- Given all historical pairs written,
- When script finishes,
- Then `backtest_summaries/{today}` is recomputed using the rolling 30-day window of completed pairs (same logic as `daily_predict.py`).

### §5 Regression Gate

**AC-085-COMPILE**
- `python -m py_compile scripts/historical_backtest.py` → exit 0.
- Existing backend tests pass (`pytest backend/tests/ -x`).

**AC-085-FIND-TOP-MATCHES-CONTRACT**
- Given `find_top_matches(query_window, history_df)` is called with a sliced `history_df`,
- Then the function accepts the sliced df without error (no hard-coded full-CSV load inside).

## Out of Scope

- Running as a GitHub Actions cron — one-time manual trigger via `workflow_dispatch` or local run.
- Modifying existing `predictions/` docs created by `daily_predict.py`.
- Backfilling beyond 365 days.
- Frontend changes.

## Implementation Notes

- `predictor.find_top_matches()` currently loads history internally (K-084 state). To support lookahead-safe slicing, the Architect must decide: (a) add `history_df` param to `find_top_matches`, or (b) pass `cutoff_date` and slice inside. Option (a) preferred — more testable.
- Script should print progress (`Day D: hit H/L, wrote prediction + actual`) for manual inspection.
- Dry-run flag `--dry-run` (print only, no Firestore writes) for local testing.
