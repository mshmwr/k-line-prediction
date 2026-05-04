"""
scripts/backtest_optimize.py — K-086

CSV-only full pipeline: backtest → Bayesian optimize → compare.
No Firestore, no GCP credentials required.

Usage:
    python scripts/backtest_optimize.py [--days 365] [--n-calls 50] [--workers N]

Optimizations vs naïve version:
  - Pre-compute query bars once (eliminates O(N) scan per iteration per pair)
  - Parallel corpus evaluation via multiprocessing.Pool (default: all CPUs)
"""
import argparse
import logging
import multiprocessing
import random
import sys
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Optional

_REPO_ROOT = Path(__file__).resolve().parents[1]
_SYS_PATH = [str(_REPO_ROOT / "backend"), str(_REPO_ROOT / "scripts")]
for _p in reversed(_SYS_PATH):
    if _p not in sys.path:
        sys.path.insert(0, _p)

import predictor  # noqa: E402
from firestore_config import (  # noqa: E402
    ParamSnapshot,
    _compute_params_hash,
    load_active_params,
)
from mock_data import load_csv_history  # noqa: E402
from optimizer import RANDOM_STATE  # noqa: E402
from skopt import gp_minimize  # noqa: E402
from skopt.space import Integer, Real  # noqa: E402

from daily_predict import HISTORY_1H_PATH, load_csv_history_as_df  # noqa: E402
from historical_backtest import _process_day  # noqa: E402

_HISTORY_1D_PATH = _REPO_ROOT / "history_database" / "Binance_ETHUSDT_d.csv"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger("backtest_optimize")

# ---------------------------------------------------------------------------
# Worker globals (set by _worker_init in each child process)
# ---------------------------------------------------------------------------
_WORKER_H1H: list = []
_WORKER_H1D: list = []
_WORKER_MA_TREND_WINDOW: int = 180
_WORKER_MA99_CACHE: dict = {}


def _worker_init(sys_path: list, h1h: list, h1d: list, ma_trend_window: int, ma99_cache: dict) -> None:
    """Called once per worker process — loads sys.path + history bar lists."""
    global _WORKER_H1H, _WORKER_H1D, _WORKER_MA_TREND_WINDOW, _WORKER_MA99_CACHE
    import sys as _sys
    for p in reversed(sys_path):
        if p not in _sys.path:
            _sys.path.insert(0, p)
    _WORKER_H1H = h1h
    _WORKER_H1D = h1d
    _WORKER_MA_TREND_WINDOW = ma_trend_window
    _WORKER_MA99_CACHE = ma99_cache


def _eval_pair_worker(args: tuple):
    """Evaluate one pair under candidate params.

    args: (bar_dicts_or_None, actual_doc, (pearson, top_k))
    Uses _WORKER_MA_TREND_WINDOW (fixed) and _WORKER_MA99_CACHE (pre-computed).
    Returns (high_hit: 0|1, low_hit: 0|1, scored: 0|1).
    """
    bar_dicts, actual_doc, snapshot_tuple = args
    if bar_dicts is None:
        return (0, 0, 0)

    import predictor as _pred
    from firestore_config import ParamSnapshot, _compute_params_hash
    from models import OHLCBar

    pearson, top_k = snapshot_tuple
    ma_window = _WORKER_MA_TREND_WINDOW
    snapshot = ParamSnapshot(
        ma_trend_window_days=ma_window,
        ma_trend_pearson_threshold=float(pearson),
        top_k_matches=int(top_k),
        params_hash=_compute_params_hash(ma_window, float(pearson), int(top_k)),
        optimized_at=None,
        source="optimizer",
    )
    original = _pred.params
    original_cache = _pred._MA99_CACHE
    _pred.params = snapshot
    _pred._MA99_CACHE = _WORKER_MA99_CACHE
    try:
        query_bars = [
            OHLCBar(
                open=b["open"], high=b["high"], low=b["low"],
                close=b["close"], time=b["time"],
            )
            for b in bar_dicts
        ]
        hour_start = random.randint(0, 17)
        matches = _pred.find_top_matches(
            input_bars=query_bars,
            history=_WORKER_H1H,
            ma_history=_WORKER_H1H,
            history_1d=_WORKER_H1D or None,
            hour_start=hour_start,
        )
        stats = _pred.compute_stats(matches, current_close=query_bars[-1].close)
        projected_high = stats.second_highest.price if stats.second_highest else None
        projected_low = stats.second_lowest.price if stats.second_lowest else None

        high_hit = (
            projected_high is not None
            and actual_doc.get("actual_high") is not None
            and actual_doc["actual_high"] >= projected_high
        )
        low_hit = (
            projected_low is not None
            and actual_doc.get("actual_low") is not None
            and actual_doc["actual_low"] <= projected_low
        )
        return (1 if high_hit else 0, 1 if low_hit else 0, 1)
    except Exception:
        return (0, 0, 0)
    finally:
        _pred.params = original
        _pred._MA99_CACHE = original_cache


# ---------------------------------------------------------------------------
# Pre-compute query bars (one-time before optimizer loop)
# ---------------------------------------------------------------------------

def _normalize_ts(ts_str: str) -> Optional[str]:
    if not ts_str:
        return None
    ts_str = ts_str.strip()
    try:
        if "T" in ts_str:
            return ts_str[:16].replace("T", " ")
        if len(ts_str) == 13 and ts_str[10] == "-":
            return datetime.strptime(ts_str, "%Y-%m-%d-%H").strftime("%Y-%m-%d %H:%M")
        return ts_str[:16]
    except ValueError:
        return None


def _precompute_bars(pairs: list, history_1h: list) -> list:
    """Build ts→idx index once; return pre-computed 24-bar windows as plain dicts."""
    ts_index: dict = {}
    for i, bar in enumerate(history_1h):
        key = str(bar.get("date", bar.get("time", "")))[:16]
        ts_index[key] = i

    result = []
    for pair in pairs:
        norm = _normalize_ts(pair["prediction"].get("query_ts", ""))
        anchor_idx = ts_index.get(norm) if norm else None
        if anchor_idx is None or anchor_idx < 23:
            result.append(None)
            continue
        window = history_1h[anchor_idx - 23: anchor_idx + 1]
        if len(window) < 24:
            result.append(None)
            continue
        result.append([
            {
                "open": float(b["open"]), "high": float(b["high"]),
                "low": float(b["low"]),  "close": float(b["close"]),
                "time": str(b.get("date", b.get("time", ""))),
            }
            for b in window
        ])

    found = sum(1 for x in result if x is not None)
    logger.info("pre-computed query bars: %d / %d", found, len(pairs))
    return result


# ---------------------------------------------------------------------------
# Parallel objective
# ---------------------------------------------------------------------------

def _make_parallel_objective(pairs: list, precomputed_bars: list, pool: multiprocessing.pool.Pool):
    """Return skopt-compatible objective; uses pool for parallel pair evaluation."""
    actuals = [p["actual"] for p in pairs]

    def objective(params_list):
        pearson, top_k = params_list
        snapshot_tuple = (float(pearson), int(top_k))
        task_args = [
            (bar_dicts, actual, snapshot_tuple)
            for bar_dicts, actual in zip(precomputed_bars, actuals)
        ]
        results = pool.map(_eval_pair_worker, task_args)
        high_hits = sum(r[0] for r in results)
        low_hits  = sum(r[1] for r in results)
        total     = sum(r[2] for r in results)
        if total == 0:
            return 0.0
        return -(0.5 * (high_hits / total) + 0.5 * (low_hits / total))

    return objective


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="CSV-only backtest + Bayesian optimize pipeline.")
    parser.add_argument("--days", type=int, default=365)
    parser.add_argument("--n-calls", type=int, default=50)
    parser.add_argument("--workers", type=int, default=0,
                        help="Worker processes (0 = all CPUs)")
    args = parser.parse_args()
    if args.days < 5:
        parser.error("--days must be >= 5")
    if args.n_calls < 10:
        parser.error("--n-calls must be >= 10")

    if not HISTORY_1H_PATH.exists():
        logger.error("CSV not found: %s", HISTORY_1H_PATH)
        sys.exit(1)

    n_workers = args.workers if args.workers > 0 else multiprocessing.cpu_count()
    logger.info("workers: %d", n_workers)

    # [1] Params
    params = load_active_params()
    logger.info("params: window=%d  pearson=%.4f  top_k=%d  (source: %s)",
                params.ma_trend_window_days, params.ma_trend_pearson_threshold,
                params.top_k_matches, params.source)
    predictor.params = params

    # [2] Backtest — collect pairs
    full_df = load_csv_history_as_df(HISTORY_1H_PATH)
    logger.info("loaded %d bars", len(full_df))

    today = date.today()
    start_date = today - timedelta(days=args.days)
    end_date   = today - timedelta(days=4)
    logger.info("range: %s → %s", start_date.isoformat(), end_date.isoformat())

    pairs: list = []
    d = start_date
    while d <= end_date:
        _process_day(d, full_df, params, client=None, dry_run=True, pairs_out=pairs)
        d += timedelta(days=1)

    if not pairs:
        logger.error("0 pairs collected")
        sys.exit(1)

    base_high  = sum(1 for p in pairs if p["actual"].get("high_hit")) / len(pairs)
    base_low   = sum(1 for p in pairs if p["actual"].get("low_hit"))  / len(pairs)
    base_score = 0.5 * base_high + 0.5 * base_low
    print(f"\n=== Baseline ({len(pairs)} pairs  "
          f"window={params.ma_trend_window_days} pearson={params.ma_trend_pearson_threshold:.4f} "
          f"top_k={params.top_k_matches}) ===")
    print(f"  high_hit={base_high:.1%}  low_hit={base_low:.1%}  score={base_score:.4f}")

    # [3] Load history bar lists + pre-compute query bars + MA99 cache
    logger.info("loading history bar lists")
    history_1h = load_csv_history(HISTORY_1H_PATH)
    history_1d = load_csv_history(_HISTORY_1D_PATH) if _HISTORY_1D_PATH.exists() else []
    logger.info("bars: %d 1H  %d 1D", len(history_1h), len(history_1d))

    predictor.build_ma99_cache(history_1d, _HISTORY_1D_PATH)
    logger.info("MA99 cache: %d entries", len(predictor._MA99_CACHE))

    precomputed_bars = _precompute_bars(pairs, history_1h)

    # [4] Bayesian optimization — parallel (pearson + top_k only; ma_trend_window_days is fixed)
    space = [Real(0.2, 0.7), Integer(5, 30)]
    logger.info("Bayesian search: n_calls=%d  pairs=%d  workers=%d",
                args.n_calls, len(pairs), n_workers)

    with multiprocessing.Pool(
        processes=n_workers,
        initializer=_worker_init,
        initargs=(_SYS_PATH, history_1h, history_1d, params.ma_trend_window_days, predictor._MA99_CACHE),
    ) as pool:
        result = gp_minimize(
            func=_make_parallel_objective(pairs, precomputed_bars, pool),
            dimensions=space,
            n_calls=args.n_calls,
            random_state=RANDOM_STATE,
        )

    best_idx     = int(result.func_vals.argmin())
    winner       = result.x_iters[best_idx]
    winner_score = -result.func_vals[best_idx]
    winner_pearson = float(winner[0])
    winner_top_k   = int(winner[1])
    winner_hash = _compute_params_hash(params.ma_trend_window_days, winner_pearson, winner_top_k)

    print(f"\n=== Optimizer result ({args.n_calls} iterations  {n_workers} workers) ===")
    print(f"  ma_trend_window={params.ma_trend_window_days}  pearson={winner_pearson:.4f}  top_k={winner_top_k}")
    print(f"  score={winner_score:.4f}  (baseline {base_score:.4f}  Δ{winner_score - base_score:+.4f})")
    print(f"  hash={winner_hash[:12]}")


if __name__ == "__main__":
    main()
