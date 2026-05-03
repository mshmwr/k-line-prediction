"""
scripts/historical_backtest.py — K-085

One-time (re-runnable) script: bootstrap Firestore with historical prediction + actual pairs.
Walks back N calendar days, simulates what the predictor would have output for each day.

Lookahead safety: only bars where time < D are passed to find_top_matches() for day D.
Actuals are sourced from the full CSV (ground truth, not inputs to the predictor).

Usage:
    python scripts/historical_backtest.py [--days 365] [--dry-run]
"""
import argparse
import logging
import random
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

import pandas as pd

_REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_REPO_ROOT / "backend"))
sys.path.insert(0, str(_REPO_ROOT / "scripts"))

import predictor  # noqa: E402
from firestore_config import (  # noqa: E402
    load_active_params,
    write_actual,
    write_prediction,
    write_summary,
)
from daily_predict import (  # noqa: E402
    HISTORY_1H_PATH,
    build_6h_query_window,
    compute_backtest_summary,
    compute_outcome,
    load_csv_history_as_df,
    run_prediction,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger("historical_backtest")


def _date_to_ts(d: date) -> str:
    """Firestore doc key for a calendar day: YYYY-MM-DD-23 (matches daily_predict anchor format)."""
    return f"{d.isoformat()}-23"


def _prediction_exists(client, ts: str) -> bool:
    return client.collection("predictions").document(ts).get().exists


def _process_day(
    d: date,
    full_df: pd.DataFrame,
    params,
    client,
    dry_run: bool,
) -> str:
    """Simulate prediction for day D and write to Firestore.

    Returns one of: 'wrote' | 'skip-exists' | 'skip-no-data' | 'skip-no-actuals' | 'error'.
    """
    ts = _date_to_ts(d)

    if not dry_run and _prediction_exists(client, ts):
        logger.info("SKIP %s — already present", d.isoformat())
        return "skip-exists"

    # Lookahead-safe: only bars strictly before D midnight
    cutoff_str = f"{d.isoformat()} 00:00"
    history_slice = full_df[full_df["time"] < cutoff_str].copy()

    if len(history_slice) < 200:
        logger.warning("SKIP %s — insufficient history (%d bars)", d.isoformat(), len(history_slice))
        return "skip-no-data"

    # Deterministic hour_start per date so re-runs produce the same prediction doc
    rng = random.Random(d.toordinal())
    hour_start = rng.randint(0, 17)

    try:
        query_df = build_6h_query_window(history_slice, hour_start)
    except ValueError as exc:
        logger.info("SKIP %s — no 6H window at hour %d: %s", d.isoformat(), hour_start, exc)
        return "skip-no-data"

    try:
        prediction = run_prediction(query_df, params, history_slice, hour_start)
    except Exception as exc:
        logger.warning("SKIP %s — run_prediction error: %s", d.isoformat(), exc)
        return "error"

    if prediction.get("top_k_count", 0) == 0:
        logger.info("SKIP %s — 0 matches", d.isoformat())
        return "skip-no-data"

    prediction["source"] = "historical"

    outcome = compute_outcome(prediction, full_df)
    if outcome is None:
        logger.info("SKIP %s — 72H actual window incomplete", d.isoformat())
        return "skip-no-actuals"

    outcome["source"] = "historical"

    logger.info(
        "Day %s: high_hit=%s low_hit=%s proj_high=%.2f proj_low=%.2f",
        d.isoformat(),
        outcome.get("high_hit", False),
        outcome.get("low_hit", False),
        prediction.get("projected_high") or 0.0,
        prediction.get("projected_low") or 0.0,
    )

    if not dry_run:
        try:
            write_prediction(client, ts, prediction)
            write_actual(client, ts, outcome)
            logger.info("wrote predictions/%s + actuals/%s", ts, ts)
        except Exception as exc:
            logger.error("SKIP %s — Firestore write failed: %s", d.isoformat(), exc)
            return "error"

    return "wrote"


def main() -> None:
    parser = argparse.ArgumentParser(description="Bootstrap Firestore with historical backtest data.")
    parser.add_argument("--days", type=int, default=365, help="Calendar days to walk back (default: 365)")
    parser.add_argument("--dry-run", action="store_true", help="Print only — skip Firestore writes")
    args = parser.parse_args()
    if args.days < 5:
        parser.error("--days must be >= 5 (4-day buffer requires at least 1 processable day)")

    csv_path = HISTORY_1H_PATH
    if not csv_path.exists():
        logger.error("CSV not found: %s", csv_path)
        sys.exit(1)

    params = load_active_params()
    logger.info("params_hash: %s (source: %s)", params.params_hash[:12], params.source)
    predictor.params = params

    full_df = load_csv_history_as_df(csv_path)
    logger.info("loaded %d bars from %s", len(full_df), csv_path)

    today = date.today()
    start_date = today - timedelta(days=args.days)
    end_date = today - timedelta(days=4)  # 4-day buffer: ensures 72H actuals are complete

    logger.info(
        "range: %s to %s (%d days)",
        start_date.isoformat(), end_date.isoformat(), (end_date - start_date).days + 1,
    )

    if args.dry_run:
        logger.info("DRY RUN — Firestore writes disabled")
        client = None
    else:
        import google.cloud.firestore
        client = google.cloud.firestore.Client()

    counts: dict[str, int] = {
        "wrote": 0, "skip-exists": 0, "skip-no-data": 0, "skip-no-actuals": 0, "error": 0,
    }

    d = start_date
    while d <= end_date:
        result = _process_day(d, full_df, params, client, dry_run=args.dry_run)
        counts[result] = counts.get(result, 0) + 1
        d += timedelta(days=1)

    logger.info(
        "summary: wrote=%d skip-exists=%d skip-no-data=%d skip-no-actuals=%d error=%d",
        counts["wrote"], counts["skip-exists"], counts["skip-no-data"],
        counts["skip-no-actuals"], counts["error"],
    )

    # Recompute rolling 30-day summary — runs on every non-dry-run invocation so re-runs keep summary current
    if not args.dry_run and client is not None:
        summary = compute_backtest_summary(client, today)
        if summary is not None:
            write_summary(client, today.isoformat(), summary)
            logger.info("recomputed backtest_summaries/%s", today.isoformat())


if __name__ == "__main__":
    main()
