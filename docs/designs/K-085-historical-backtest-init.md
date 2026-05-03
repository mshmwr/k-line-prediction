---
ticket: K-085
title: Historical Backtest Initialization — Design
status: design-locked
architect: claude
date: 2026-05-03
visual-delta: no
---

# K-085 Design — Historical Backtest Initialization

## Goal

Bootstrap Firestore with historical prediction + actual pairs so the weekly Bayesian optimizer can run on day 0 instead of waiting 30 days.

## Key Finding

`find_top_matches()` already accepts `history=` and `ma_history=` as explicit list parameters (K-078 addition). When `history=None`, it falls back to `MOCK_HISTORY`. Passing a lookahead-safe slice is a one-liner — **no predictor changes required**.

## Architecture

```
scripts/historical_backtest.py
  │
  ├─ load_full_df()          ← reads Binance_ETHUSDT_1h.csv once
  │
  ├─ for each day D in range [today-N, today-4]:
  │    ├─ history_df  = full_df[full_df.time < D]         ← lookahead-safe slice
  │    ├─ query_df    = last 6H window from history_df
  │    ├─ hour_start  = query_df.iloc[-1].time.hour
  │    │
  │    ├─ run_prediction(query_df, params, history_df)    ← same call as daily_predict
  │    │    └─ find_top_matches(history=history_bars, ...)
  │    │
  │    ├─ actuals_df  = full_df rows in [D, D+72H]
  │    ├─ actual_high = actuals_df.high.max()
  │    ├─ actual_low  = actuals_df.low.min()
  │    ├─ high_hit    = actual_high >= projected_high
  │    ├─ low_hit     = actual_low  <= projected_low
  │    │
  │    └─ write_to_firestore(prediction_doc, actual_doc)  ← skip if already exists
  │
  └─ recompute_backtest_summary(today)   ← rolling 30-day, same logic as daily_predict
```

## Firestore Schema (reuses K-083 collections)

| Collection | Doc key | Added fields |
|---|---|---|
| `predictions` | `{D-ISO}` | + `source: "historical"` |
| `actuals` | `{D-ISO}` | + `source: "historical"` |
| `backtest_summaries` | `{today-ISO}` | no change |

`source: "historical"` tag lets the optimizer and frontend distinguish live vs bootstrapped docs (phase 2 use, not required by K-085 ACs).

## Lookahead Safety

```
full timeline:  ──────────────────[D]──72H──────────────
history_slice:  ──────────────────[D)   (exclusive end)
query_window:   last 6H bars from history_slice
actuals_window: full_df rows in [D, D+72H]            ← sourced from full_df, not history_slice
```

The lookahead guarantee: `history_slice` used by the matcher never sees any bar at or after D. Actuals are sourced separately from the full dataset, which is safe because actuals are outputs (ground truth), not inputs to the predictor.

## Files Changed

| File | Change |
|---|---|
| `scripts/historical_backtest.py` | **new** — main entry script |
| `scripts/daily_predict.py` | no change — `run_prediction()` reused as-is |
| `backend/firestore_config.py` | no change — existing write helpers reused |
| `backend/predictor.py` | **no change** — `find_top_matches(history=...)` already supported |

## CLI Interface

```bash
python scripts/historical_backtest.py [--days 365] [--dry-run]
```

- `--days N`: how many calendar days to walk back (default 365)
- `--dry-run`: print prediction + actual per day, skip Firestore writes

## Idempotency

Before each Firestore write, check `predictions/{D-ISO}` exists:
- Exists → skip (print `SKIP {D} — already present`)
- Not exists → write prediction doc, write actual doc

## Params

At script start, read `predictor_params/active` from Firestore (same as `daily_predict.py`). Apply to all historical predictions. This means all historical docs use the current active params — acceptable for phase 1 (optimizer trains on consistent param generation).

## Error Handling

| Condition | Action |
|---|---|
| `find_top_matches` raises `ValueError` (no matches) | Log `SKIP {D} — no matches`, continue |
| `actuals_df` has < 72 rows | Log `SKIP {D} — insufficient actuals`, continue |
| Firestore write fails | Log error, continue (script is resumable via idempotency) |

## Verification Plan

1. `python -m py_compile scripts/historical_backtest.py` → exit 0
2. `python scripts/historical_backtest.py --dry-run --days 7` → prints 7 days of predictions without Firestore writes
3. `pytest backend/tests/ -x` → no regressions
4. Run with `--days 30`; verify Firestore has `predictions/`, `actuals/`, `backtest_summaries/` docs

## Architect Notes

- `run_prediction()` in `daily_predict.py` already handles the `find_top_matches → compute_stats → dict` pipeline. The historical script imports and calls it with a sliced `full_df`. This avoids code duplication.
- `build_6h_query_window()` lives in `daily_predict.py` (K-084 addition). Import from there.
- The 4-day buffer (`today - 4 days`) instead of 3 gives one extra day of margin for timezone edge cases in the CSV timestamps.
