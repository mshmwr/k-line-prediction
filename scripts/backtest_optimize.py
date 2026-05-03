"""
scripts/backtest_optimize.py — K-086

CSV-only full pipeline: backtest → Bayesian optimize → compare.
No Firestore, no GCP credentials required.

Usage:
    python scripts/backtest_optimize.py [--days 365] [--n-calls 50]

Steps:
    1. Load current params (defaults if Firestore unavailable)
    2. Run backtest over [today-N, today-4], collect (prediction, actual) pairs
    3. Print baseline hit rates
    4. Bayesian search over (window, pearson, top_k)
    5. Print winner params + score delta vs baseline
"""
import argparse
import logging
import sys
from datetime import date, timedelta
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_REPO_ROOT / "backend"))
sys.path.insert(0, str(_REPO_ROOT / "scripts"))

import predictor  # noqa: E402
from firestore_config import (  # noqa: E402
    ParamSnapshot,
    _compute_params_hash,
    load_active_params,
)
from mock_data import load_csv_history  # noqa: E402
from optimizer import RANDOM_STATE, evaluate_corpus  # noqa: E402
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


def _make_objective(completed_pairs: list, history_1h: list, history_1d: list):
    """Return skopt-compatible objective closure (minimizes negative score)."""
    def objective(params_list):
        window, pearson, top_k = params_list
        snapshot = ParamSnapshot(
            ma_trend_window_days=int(window),
            ma_trend_pearson_threshold=float(pearson),
            top_k_matches=int(top_k),
            params_hash=_compute_params_hash(int(window), float(pearson), int(top_k)),
            optimized_at=None,
            source="optimizer",
        )
        return -evaluate_corpus(completed_pairs, snapshot, history_1h, history_1d or None)
    return objective


def main() -> None:
    parser = argparse.ArgumentParser(description="CSV-only backtest + Bayesian optimize pipeline.")
    parser.add_argument("--days", type=int, default=365, help="Calendar days to walk back (default: 365)")
    parser.add_argument("--n-calls", type=int, default=50, help="Bayesian iterations (default: 50)")
    args = parser.parse_args()
    if args.days < 5:
        parser.error("--days must be >= 5")
    if args.n_calls < 10:
        parser.error("--n-calls must be >= 10 (skopt minimum)")

    if not HISTORY_1H_PATH.exists():
        logger.error("CSV not found: %s", HISTORY_1H_PATH)
        sys.exit(1)

    # ------------------------------------------------------------------
    # [1] Load params — falls back to defaults if Firestore unavailable
    # ------------------------------------------------------------------
    params = load_active_params()
    logger.info(
        "params: window=%d  pearson=%.4f  top_k=%d  (source: %s)",
        params.ma_trend_window_days,
        params.ma_trend_pearson_threshold,
        params.top_k_matches,
        params.source,
    )
    predictor.params = params

    # ------------------------------------------------------------------
    # [2] Backtest with current params
    # ------------------------------------------------------------------
    full_df = load_csv_history_as_df(HISTORY_1H_PATH)
    logger.info("loaded %d bars from CSV", len(full_df))

    today = date.today()
    start_date = today - timedelta(days=args.days)
    end_date = today - timedelta(days=4)
    logger.info("range: %s → %s", start_date.isoformat(), end_date.isoformat())

    pairs: list = []
    d = start_date
    while d <= end_date:
        _process_day(d, full_df, params, client=None, dry_run=True, pairs_out=pairs)
        d += timedelta(days=1)

    if not pairs:
        logger.error("0 pairs collected — check CSV coverage and threshold")
        sys.exit(1)

    base_high = sum(1 for p in pairs if p["actual"].get("high_hit")) / len(pairs)
    base_low = sum(1 for p in pairs if p["actual"].get("low_hit")) / len(pairs)
    base_score = 0.5 * base_high + 0.5 * base_low

    print(f"\n=== Baseline ({len(pairs)} pairs, params: window={params.ma_trend_window_days} pearson={params.ma_trend_pearson_threshold:.4f} top_k={params.top_k_matches}) ===")
    print(f"  high_hit={base_high:.1%}  low_hit={base_low:.1%}  score={base_score:.4f}")

    # ------------------------------------------------------------------
    # [3] Load history as bar lists for optimizer corpus re-eval
    # ------------------------------------------------------------------
    logger.info("loading history bar lists for optimizer")
    history_1h = load_csv_history(HISTORY_1H_PATH)
    history_1d = load_csv_history(_HISTORY_1D_PATH) if _HISTORY_1D_PATH.exists() else []
    logger.info("optimizer bars: %d 1H, %d 1D", len(history_1h), len(history_1d))

    # ------------------------------------------------------------------
    # [4] Bayesian optimization
    # ------------------------------------------------------------------
    space = [Integer(14, 60), Real(0.2, 0.7), Integer(5, 30)]
    logger.info("starting Bayesian search: n_calls=%d, corpus=%d pairs", args.n_calls, len(pairs))

    result = gp_minimize(
        func=_make_objective(pairs, history_1h, history_1d),
        dimensions=space,
        n_calls=args.n_calls,
        random_state=RANDOM_STATE,
    )

    best_idx = int(result.func_vals.argmin())
    winner = result.x_iters[best_idx]
    winner_score = -result.func_vals[best_idx]
    winner_window = int(winner[0])
    winner_pearson = float(winner[1])
    winner_top_k = int(winner[2])
    winner_hash = _compute_params_hash(winner_window, winner_pearson, winner_top_k)

    print(f"\n=== Optimizer result ({args.n_calls} iterations) ===")
    print(f"  window={winner_window}  pearson={winner_pearson:.4f}  top_k={winner_top_k}")
    print(f"  score={winner_score:.4f}  (baseline {base_score:.4f}  Δ{winner_score - base_score:+.4f})")
    print(f"  hash={winner_hash[:12]}")


if __name__ == "__main__":
    main()
