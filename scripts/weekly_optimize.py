"""
scripts/weekly_optimize.py — K-083

Weekly Bayesian optimizer entry script.

Schedule: GitHub Actions cron Mon 05:00 UTC (weekly-optimize.yml).
Reads last 90 days of predictions + actuals from Firestore, runs Bayesian
search over (window, pearson, top_k), writes winner to Firestore, triggers
Cloud Run redeploy.

Exit codes:
  0 — success, graceful skip (insufficient data), or params unchanged
  1 — hard fail (corpus fetch error, write permanent failure, gcloud non-zero)
"""
import logging
import os
import subprocess
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd

# ---------------------------------------------------------------------------
# sys.path setup — must precede all local imports
# ---------------------------------------------------------------------------
_REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_REPO_ROOT / "backend"))

from skopt import gp_minimize  # noqa: E402
from skopt.space import Integer, Real  # noqa: E402

import predictor as _predictor  # noqa: E402
from firestore_config import (  # noqa: E402
    FIRESTORE_PREDICTOR_PARAMS_FIELDS,
    FIRESTORE_PREDICTOR_PARAMS_HISTORY_FIELDS,
    FIRESTORE_OPTIMIZE_RUN_FIELDS,
    ParamSnapshot,
    _compute_params_hash,
    load_active_params,
    read_actuals_corpus,
    read_predictions_corpus,
    write_optimize_run,
    write_predictor_params_active,
    write_predictor_params_history,
)
from mock_data import load_csv_history  # noqa: E402
from optimizer import (  # noqa: E402
    RANDOM_STATE,
    build_optimize_run_doc,
    build_predictor_params_doc,
    build_predictor_params_history_doc,
    evaluate_corpus,
)

# ---------------------------------------------------------------------------
# Module constants (AC-083-SEARCH-SPACE, AC-083-DATA-SUFFICIENCY-GUARD)
# ---------------------------------------------------------------------------
MIN_SAMPLES: int = 30          # corpus gate — exit 0 if fewer completed pairs
MAX_ITERATIONS: int = 50       # skopt n_calls
IMPROVEMENT_EPSILON: float = 1e-4  # cost-guard sensitivity (strictly >)
NO_IMPROVE_WINDOW: int = 20    # consecutive no-improvement iterations before early exit
CORPUS_WINDOW_DAYS: int = 90   # lookback window for predictions + actuals fetch
WRITE_RETRY_WAIT: int = 5      # seconds; matches K-080 _WRITE_RETRY_DELAY_SECONDS

HISTORY_1H_PATH = _REPO_ROOT / "history_database" / "Binance_ETHUSDT_1h.csv"
HISTORY_1D_PATH = _REPO_ROOT / "history_database" / "Binance_ETHUSDT_d.csv"

# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger("weekly_optimize")


# ---------------------------------------------------------------------------
# EarlyExitSignal — raised by cost guard callback to terminate skopt loop
# ---------------------------------------------------------------------------
class EarlyExitSignal(Exception):
    """Raised inside cost_guard_callback to terminate gp_minimize early.

    skopt does not have a native early-stop API; the callback mechanism is
    the only hook. The exception propagates out of gp_minimize; the caller
    catches it and uses the best result accumulated so far.
    """


# ---------------------------------------------------------------------------
# Corpus helpers
# ---------------------------------------------------------------------------

def build_completed_pairs(predictions: list, actuals: list) -> list:
    """Join predictions + actuals by _doc_id. Returns list of {prediction, actual} dicts.

    Only pairs where BOTH prediction and actual docs exist are included.
    Predictions with null projected_high (0-match case) are excluded
    because they cannot contribute to hit-rate scoring.
    """
    actuals_by_id = {a["_doc_id"]: a for a in actuals if "_doc_id" in a}
    pairs = []
    for pred in predictions:
        doc_id = pred.get("_doc_id")
        if doc_id is None:
            continue
        if pred.get("projected_high") is None:
            continue  # 0-match prediction — cannot score
        actual = actuals_by_id.get(doc_id)
        if actual is None:
            continue
        pairs.append({"prediction": pred, "actual": actual})
    return pairs


# ---------------------------------------------------------------------------
# Objective closure factory
# ---------------------------------------------------------------------------

def make_objective(completed_pairs: list, history_1h: list, history_1d: list):
    """Return a closure over completed_pairs for skopt.gp_minimize.

    The closure receives a params_list [window, pearson, top_k] from skopt
    and returns the negated objective score (gp_minimize minimizes).
    """
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
        score = evaluate_corpus(completed_pairs, snapshot, history_1h, history_1d)
        return -score  # gp_minimize minimizes; we maximize objective

    return objective


# ---------------------------------------------------------------------------
# Main orchestrator
# ---------------------------------------------------------------------------

def main() -> None:  # noqa: C901 — orchestrator; complexity is necessary
    """Orchestrator: corpus fetch → sufficiency guard → Bayesian search →
    idempotency check → Firestore writes → Cloud Run redeploy.

    Exit 0: success, graceful skip, or params unchanged.
    Exit 1: hard fail.
    """
    # ------------------------------------------------------------------
    # [1] Corpus fetch
    # ------------------------------------------------------------------
    logger.info("weekly_optimize: starting corpus fetch (last %d days)", CORPUS_WINDOW_DAYS)
    cutoff_dt = datetime.utcnow() - timedelta(days=CORPUS_WINDOW_DAYS)

    try:
        import google.cloud.firestore
        client = google.cloud.firestore.Client()
        predictions_raw = read_predictions_corpus(client, cutoff_dt)
        actuals_raw = read_actuals_corpus(client, cutoff_dt)
    except Exception as exc:
        logger.error("weekly_optimize: Firestore corpus fetch failed (%s: %s)", type(exc).__name__, exc)
        sys.exit(1)

    completed_pairs = build_completed_pairs(predictions_raw, actuals_raw)
    logger.info(
        "weekly_optimize: corpus = %d predictions, %d actuals, %d completed pairs",
        len(predictions_raw),
        len(actuals_raw),
        len(completed_pairs),
    )

    # ------------------------------------------------------------------
    # [2] Data-sufficiency guard (AC-083-DATA-SUFFICIENCY-GUARD)
    # ------------------------------------------------------------------
    if len(completed_pairs) < MIN_SAMPLES:
        logger.info(
            "weekly_optimize: insufficient data: %d completed pairs found, "
            "minimum %d required — exiting without optimization",
            len(completed_pairs),
            MIN_SAMPLES,
        )
        sys.exit(0)

    # ------------------------------------------------------------------
    # [3] Current params fetch (for idempotency check)
    # ------------------------------------------------------------------
    current_params = load_active_params()
    current_hash = current_params.params_hash if current_params.source != "default" else None
    logger.info(
        "weekly_optimize: current params hash=%s source=%s",
        current_hash[:8] if current_hash else "N/A",
        current_params.source,
    )

    # ------------------------------------------------------------------
    # [4] Load history CSVs (loaded ONCE — passed as closure to objective)
    # ------------------------------------------------------------------
    logger.info("weekly_optimize: loading history CSVs")
    try:
        history_1h = load_csv_history(HISTORY_1H_PATH)
    except Exception as exc:
        logger.error("weekly_optimize: failed to load 1H history CSV: %s", exc)
        sys.exit(1)

    try:
        history_1d = load_csv_history(HISTORY_1D_PATH)
    except Exception as exc:
        logger.warning("weekly_optimize: 1D history CSV unavailable (%s); continuing without 1D MA", exc)
        history_1d = []

    logger.info(
        "weekly_optimize: loaded %d 1H bars, %d 1D bars",
        len(history_1h),
        len(history_1d),
    )

    # ------------------------------------------------------------------
    # [5] Bayesian optimization (AC-083-SEARCH-SPACE, AC-083-COST-GUARD)
    # ------------------------------------------------------------------
    space = [Integer(14, 60), Real(0.2, 0.7), Integer(5, 30)]

    # Cost guard state (closure over mutable lists for Python 2-compat pattern)
    no_improve_streak = [0]
    best_seen = [-float("inf")]
    # Capture result across iterations even on early exit
    last_result_holder = [None]

    def cost_guard_callback(res):
        """Called by skopt after each iteration with cumulative OptimizeResult."""
        last_result_holder[0] = res
        current_best = -min(res.func_vals)  # negate back to positive objective
        if (current_best - best_seen[0]) > IMPROVEMENT_EPSILON:
            best_seen[0] = current_best
            no_improve_streak[0] = 0
        else:
            no_improve_streak[0] += 1

        if no_improve_streak[0] >= NO_IMPROVE_WINDOW:
            raise EarlyExitSignal(
                f"early exit after {len(res.func_vals)} iterations — "
                f"no improvement > {IMPROVEMENT_EPSILON} over last {NO_IMPROVE_WINDOW} iterations"
            )

    started_at = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    logger.info("weekly_optimize: starting Bayesian search (max_iterations=%d)", MAX_ITERATIONS)

    early_exit = False
    result = None

    try:
        result = gp_minimize(
            func=make_objective(completed_pairs, history_1h, history_1d),
            dimensions=space,
            n_calls=MAX_ITERATIONS,
            random_state=RANDOM_STATE,
            callback=[cost_guard_callback],
        )
    except EarlyExitSignal as sig:
        logger.info("weekly_optimize: %s", sig)
        early_exit = True
        result = last_result_holder[0]

    if result is None:
        logger.error("weekly_optimize: optimization produced no result — aborting")
        sys.exit(1)

    iterations_run = len(result.func_vals)

    # ------------------------------------------------------------------
    # [5] Winner selection
    # ------------------------------------------------------------------
    best_idx = int(result.func_vals.index(min(result.func_vals)))
    winner_params = result.x_iters[best_idx]
    winner_score = -result.func_vals[best_idx]  # negate back to positive

    winner_window = int(winner_params[0])
    winner_pearson = float(winner_params[1])
    winner_top_k = int(winner_params[2])
    winner_hash = _compute_params_hash(winner_window, winner_pearson, winner_top_k)

    completed_at = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    # Log winning params BEFORE any write (AC-083-FIRESTORE-FAILURE-MID-RUN stdout requirement)
    logger.info(
        "weekly_optimize: winner params: window=%d pearson=%.4f top_k=%d "
        "score=%.4f hash=%s iterations=%d early_exit=%s",
        winner_window, winner_pearson, winner_top_k,
        winner_score, winner_hash[:8], iterations_run, early_exit,
    )

    # ------------------------------------------------------------------
    # [6] Idempotency check (AC-083-WINNER-WRITE idempotency clause)
    # ------------------------------------------------------------------
    if current_hash is not None and winner_hash == current_hash:
        logger.info(
            "weekly_optimize: params unchanged (hash=%s) — skipping write and redeploy",
            winner_hash[:8],
        )
        sys.exit(0)

    # ------------------------------------------------------------------
    # [7] Firestore writes (sequential, retry-once each)
    # ------------------------------------------------------------------
    run_id = f"optimize-{datetime.utcnow().strftime('%Y-%m-%d')}"
    optimized_at = completed_at

    # Resolve HEAD git SHA for history doc
    try:
        git_sha = subprocess.check_output(
            ["git", "rev-parse", "--short=8", "HEAD"],
            cwd=str(_REPO_ROOT),
            stderr=subprocess.DEVNULL,
        ).decode().strip()
    except Exception:
        git_sha = "unknown"

    active_doc = build_predictor_params_doc(
        window_days=winner_window,
        pearson_threshold=winner_pearson,
        top_k=winner_top_k,
        optimized_at=optimized_at,
    )
    history_doc = build_predictor_params_history_doc(
        window_days=winner_window,
        pearson_threshold=winner_pearson,
        top_k=winner_top_k,
        optimized_at=optimized_at,
        best_score=winner_score,
        run_id=run_id,
        git_sha=git_sha,
        corpus_size=len(completed_pairs),
    )
    run_doc = build_optimize_run_doc(
        run_id=run_id,
        best_score=winner_score,
        best_params={
            "window_days": winner_window,
            "pearson_threshold": winner_pearson,
            "top_k": winner_top_k,
        },
        iterations_run=iterations_run,
        early_exit=early_exit,
        data_window_days=CORPUS_WINDOW_DAYS,
        sample_size=len(completed_pairs),
        started_at=started_at,
        completed_at=completed_at,
    )

    # Validate frozenset contracts before attempting any write
    assert set(active_doc.keys()) == FIRESTORE_PREDICTOR_PARAMS_FIELDS, "active_doc field mismatch"
    assert set(history_doc.keys()) == FIRESTORE_PREDICTOR_PARAMS_HISTORY_FIELDS, "history_doc field mismatch"
    assert set(run_doc.keys()) == FIRESTORE_OPTIMIZE_RUN_FIELDS, "run_doc field mismatch"

    # Write 1: predictor_params/active
    try:
        write_predictor_params_active(client, active_doc)
        logger.info("weekly_optimize: wrote predictor_params/active")
    except Exception as exc:
        logger.error(
            "weekly_optimize: permanent Firestore failure writing predictor_params/active: %s",
            exc,
        )
        sys.exit(1)

    # Write 2: predictor_params/history/{run_id}
    try:
        write_predictor_params_history(client, run_id, history_doc)
        logger.info("weekly_optimize: wrote predictor_params/history/%s", run_id)
    except Exception as exc:
        logger.error(
            "weekly_optimize: permanent Firestore failure writing predictor_params/history/%s: %s",
            run_id,
            exc,
        )
        sys.exit(1)

    # Write 3: optimize_runs/{run_id}
    try:
        write_optimize_run(client, run_id, run_doc)
        logger.info("weekly_optimize: wrote optimize_runs/%s", run_id)
    except Exception as exc:
        logger.error(
            "weekly_optimize: permanent Firestore failure writing optimize_runs/%s: %s",
            run_id,
            exc,
        )
        sys.exit(1)

    # ------------------------------------------------------------------
    # [8] Cloud Run redeploy (AC-083-REDEPLOY-TRIGGER)
    # ------------------------------------------------------------------
    logger.info("weekly_optimize: triggering Cloud Run redeploy")
    redeploy_result = subprocess.run(
        [
            "gcloud", "run", "services", "update", "k-line-backend",
            "--region=asia-east1", "--no-traffic",
        ],
        check=False,
    )

    if redeploy_result.returncode != 0:
        logger.error(
            "weekly_optimize: gcloud redeploy failed (returncode=%d); "
            "Firestore writes are committed — operator must manually trigger a new Cloud Run revision",
            redeploy_result.returncode,
        )
        sys.exit(1)

    logger.info(
        "weekly_optimize: Cloud Run redeploy triggered successfully — "
        "new revision will boot with updated params"
    )
    sys.exit(0)


if __name__ == "__main__":
    main()
