---
ticket: K-090
title: Decouple ma_trend_window_days — fix to 180, MA99 cache, 2D optimizer
status: closed
phase: 1
opened: 2026-05-03
closed-commit: 11b3b8f
depends-on: [K-088]
qa-early-consultation: ✓
sacred-clauses: []
---

# K-090 — Decouple ma_trend_window_days — fix to 180, MA99 cache, 2D optimizer

## Problem

Three separate issues, resolved together:

1. **`window_days` field conflation**: Firestore `predictor_params/active` document had a single
   `window_days` field used as both `ma_trend_window_days` (MA slope window for trend detection)
   and a tunable optimizer parameter. The two roles are independent: trend detection benefits from
   a long (~180-day) macro window, while the optimizer should only tune `pearson` and `top_k`.

2. **MA99 recomputation cost**: `_fetch_30d_ma_series` recomputes MA99 from the full 1D history
   on every call — O(N) per candidate × N candidates × M backtest iterations. No cache existed.

3. **`_eval_pair_worker` stats field mismatch**: After K-088 changed `projected_high` to
   `second_highest.price`, the optimizer worker (`backtest_optimize.py`) was still using
   `stats.highest.price`, meaning it optimized for a different metric than what the predictor outputs.

## Goal

- Rename `window_days` → `ma_trend_window_days` in all Firestore contracts, default params, and
  document builders.
- Fix `ma_trend_window_days` at 180 in `DEFAULT_PARAMS`; remove it from the Bayesian search space
  (search space shrinks from 3D to 2D: `[pearson, top_k]`).
- Add `build_ma99_cache(history_1d, csv_path)` to `predictor.py`: precomputes `date → MA99` for
  all 1D bars, persists to `history_database/ma99_1d_cache.json`, invalidates on CSV mtime change.
  `_fetch_30d_ma_series` uses cache as fast path.
- Fix `_eval_pair_worker` in `backtest_optimize.py` to use `stats.second_highest.price` /
  `stats.second_lowest.price`, consistent with `daily_predict.py`.

## Acceptance Criteria

### §1 Firestore contract rename

- `FIRESTORE_PREDICTOR_PARAMS_FIELDS` frozenset: `"window_days"` → `"ma_trend_window_days"`
- `DEFAULT_PARAMS.ma_trend_window_days == 180` (was 30)
- `load_active_params()` reads `data["ma_trend_window_days"]` from Firestore doc
- `build_predictor_params_doc()` and `build_predictor_params_history_doc()` take
  `ma_trend_window_days` kwarg (was `window_days`)

### §2 Optimizer 2D search space

- `weekly_optimize.py` space: `[Real(0.2, 0.7), Integer(5, 30)]` (no window dimension)
- `make_objective` accepts `ma_trend_window_days: int`; uses it as fixed param in snapshot
- Winner extraction: `winner_pearson = float(winner_params[0])`, `winner_top_k = int(winner_params[1])`
- `backtest_optimize.py` space: `[Real(0.2, 0.7), Integer(5, 30)]`; `_eval_pair_worker` uses
  `_WORKER_MA_TREND_WINDOW` as fixed

### §3 MA99 cache

- `predictor.build_ma99_cache(history_1d, csv_path)` populates `_MA99_CACHE: dict`
- Cache persisted to `history_database/ma99_1d_cache.json` (added to `.gitignore`)
- `_fetch_30d_ma_series` uses cache as fast path when `_MA99_CACHE` is non-empty
- `weekly_optimize.py` and `backtest_optimize.py` call `build_ma99_cache` after loading 1D history

### §4 Worker stats field fix

- `_eval_pair_worker` uses `stats.second_highest.price` / `stats.second_lowest.price`
  (matches `daily_predict.py` — consistent metric between optimizer and predictor)

### §5 Tests green

- `python3 -m py_compile` exits 0 for all modified files
- `pytest backend/tests/test_firestore_config.py backend/tests/test_weekly_optimize.py` 21/21 pass
