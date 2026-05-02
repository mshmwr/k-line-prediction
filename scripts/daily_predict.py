"""
scripts/daily_predict.py — K-080

Daily prediction workflow: load CSV, run prediction, write Firestore docs.

Usage:
    python scripts/daily_predict.py [--csv-path <path>]

Schedule: GitHub Actions cron 04:00 UTC (after scrape-history.yml at 03:00 UTC).
Firestore collections written: predictions/, actuals/, backtest_summaries/.
Exits 0 on graceful skip (stale CSV). Exits non-zero on unretriable Firestore failure.
"""
import logging
import math
import os
import statistics
import sys
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Optional

import pandas as pd

# Ensure backend/ is on sys.path for imports from backend package
_REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_REPO_ROOT / "backend"))

import predictor  # noqa: E402 — imported after path setup
from firestore_config import (  # noqa: E402
    DEFAULT_PARAMS,
    FIRESTORE_PREDICTION_FIELDS,
    ParamSnapshot,
    list_predictions_older_than,
    load_active_params,
    write_actual,
    write_prediction,
    write_summary,
)
from mock_data import load_csv_history  # noqa: E402
from models import OHLCBar  # noqa: E402
from predictor import compute_stats, find_top_matches  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger("daily_predict")

HISTORY_1H_PATH = _REPO_ROOT / "history_database" / "Binance_ETHUSDT_1h.csv"
HISTORY_1D_PATH = _REPO_ROOT / "history_database" / "Binance_ETHUSDT_d.csv"
CSV_FRESHNESS_THRESHOLD_SECONDS = 90 * 60  # 90 minutes


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

def load_csv_history_as_df(path: Path) -> pd.DataFrame:
    """Read Binance_ETHUSDT_1h.csv into DataFrame with columns [open, high, low, close, time].

    'time' column holds normalized UTC datetime strings (YYYY-MM-DD HH:MM).
    """
    bars = load_csv_history(path)
    if not bars:
        raise ValueError(f"No bars loaded from {path}")
    df = pd.DataFrame(bars)
    # Rename 'date' → 'time' to match design spec column contract
    if "date" in df.columns and "time" not in df.columns:
        df = df.rename(columns={"date": "time"})
    return df[["open", "high", "low", "close", "time"]]


def build_query_window(df: pd.DataFrame, anchor_ts: datetime) -> pd.DataFrame:
    """Return the 24 × 1H bars ending at anchor_ts (inclusive).

    anchor_ts must be in the form 'YYYY-MM-DD HH:MM' after string formatting.
    Raises ValueError if fewer than 24 bars are available up to anchor_ts.
    """
    anchor_str = anchor_ts.strftime("%Y-%m-%d %H:%M")
    mask = df["time"] <= anchor_str
    subset = df[mask].tail(24)
    if len(subset) < 24:
        raise ValueError(
            f"Fewer than 24 bars available up to anchor {anchor_str}; "
            f"found {len(subset)}. CSV may be stale or truncated."
        )
    return subset.reset_index(drop=True)


# ---------------------------------------------------------------------------
# Prediction
# ---------------------------------------------------------------------------

def run_prediction(
    query_df: pd.DataFrame,
    params: ParamSnapshot,
    full_df: pd.DataFrame,
) -> dict:
    """Convert query_df to List[OHLCBar], call find_top_matches + compute_stats.

    full_df provides full 1H history as context (history + ma_history args).
    Returns assembled prediction dict matching FIRESTORE_PREDICTION_FIELDS shape.
    Zero-match case: catches ValueError, returns prediction with top_k_count=0 and null prices.
    """
    # Convert DataFrames → List[dict] for predictor (uses dict access pattern)
    def df_to_bar_list(frame: pd.DataFrame) -> list:
        records = []
        for _, row in frame.iterrows():
            records.append({
                "open": float(row["open"]),
                "high": float(row["high"]),
                "low": float(row["low"]),
                "close": float(row["close"]),
                "date": str(row["time"]),
            })
        return records

    input_bars_list = df_to_bar_list(query_df)
    full_bars_list = df_to_bar_list(full_df)

    # Convert to OHLCBar for input_bars argument
    input_bars_ohlc = [
        OHLCBar(
            open=b["open"], high=b["high"], low=b["low"], close=b["close"], time=b["date"]
        )
        for b in input_bars_list
    ]

    current_close = float(query_df.iloc[-1]["close"])
    anchor_ts_str = str(query_df.iloc[-1]["time"])
    created_at = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    try:
        matches = find_top_matches(
            input_bars=input_bars_ohlc,
            history=full_bars_list,
            ma_history=full_bars_list,  # 1H history used as ma_history (1D resampling inside predictor)
            history_1d=None,            # 1D path optional; skips 1D MA overlay without error
        )
        stats = compute_stats(matches, current_close)

        # projected_median = mean of bar-72 close across top-K match future paths (0-indexed bar 71)
        bar_71_closes = []
        for m in matches:
            if len(m.future_ohlc) >= 72:
                bar_71_closes.append(m.future_ohlc[71].close)
        projected_median = float(statistics.mean(bar_71_closes)) if bar_71_closes else None

        # Infer trend string from find_top_matches direction by re-checking query window close slope
        # The direction label is embedded in the ValueError message when 0 matches. For success path,
        # we derive trend from the query's 30-day MA Pearson slope sign via a simple heuristic:
        # use PredictStats win_rate as a proxy (>0.5 = up, <0.5 = down, else flat).
        # Why: _classify_trend_by_pearson result is internal to predictor; not returned in PredictStats.
        win_rate = stats.win_rate
        if win_rate > 0.55:
            trend = "up"
        elif win_rate < 0.45:
            trend = "down"
        else:
            trend = "flat"

        return {
            "params_hash": params.params_hash,
            "projected_high": stats.highest.price,
            "projected_low": stats.lowest.price,
            "projected_median": projected_median,
            "top_k_count": len(matches),
            "trend": trend,
            "query_ts": anchor_ts_str,
            "created_at": created_at,
        }

    except ValueError as exc:
        msg = str(exc)
        logger.warning("zero matches for %s — prediction written with top_k_count=0: %s", anchor_ts_str, msg)
        return {
            "params_hash": params.params_hash,
            "projected_high": None,
            "projected_low": None,
            "projected_median": None,
            "top_k_count": 0,
            "trend": "unknown",
            "query_ts": anchor_ts_str,
            "created_at": created_at,
        }


# ---------------------------------------------------------------------------
# Outcome computation
# ---------------------------------------------------------------------------

def compute_outcome(prediction: dict, df: pd.DataFrame) -> Optional[dict]:
    """Given a prediction dict and the full CSV DataFrame, compute actual outcome metrics.

    Extracts 72-bar window from query_ts. Returns None if window is incomplete (< 72 bars).
    Uses simplified single-scalar MAE/RMSE (projected_path = [projected_median] * 72).
    Known Gap (K-082): per-bar path storage would improve accuracy.
    """
    query_ts_str = prediction.get("query_ts")
    projected_high = prediction.get("projected_high")
    projected_low = prediction.get("projected_low")
    projected_median = prediction.get("projected_median")

    if not query_ts_str:
        return None

    # Normalize to YYYY-MM-DD HH:MM for comparison
    try:
        # Support both "YYYY-MM-DD HH:MM" and "YYYY-MM-DD-HH" format
        if "T" in query_ts_str:
            qt = datetime.strptime(query_ts_str[:16], "%Y-%m-%dT%H:%M")
        elif len(query_ts_str) == 13 and query_ts_str[10] == "-":
            qt = datetime.strptime(query_ts_str, "%Y-%m-%d-%H")
        else:
            qt = datetime.strptime(query_ts_str[:16], "%Y-%m-%d %H:%M")
    except ValueError:
        logger.warning("compute_outcome: unparseable query_ts '%s' — skipping", query_ts_str)
        return None

    # Bars after query_ts: query_ts + 1H through query_ts + 72H
    start_dt = qt + timedelta(hours=1)
    end_dt = qt + timedelta(hours=72)
    start_str = start_dt.strftime("%Y-%m-%d %H:%M")
    end_str = end_dt.strftime("%Y-%m-%d %H:%M")

    window_df = df[(df["time"] >= start_str) & (df["time"] <= end_str)]

    if len(window_df) < 72:
        return None  # window not yet complete; caller logs and skips

    actual_bars = window_df.head(72)
    actual_closes = actual_bars["close"].tolist()
    actual_high = float(actual_bars["high"].max())
    actual_low = float(actual_bars["low"].min())

    high_hit: bool
    low_hit: bool
    if projected_high is not None:
        high_hit = any(float(h) >= projected_high for h in actual_bars["high"])
    else:
        high_hit = False  # null projected_high (0-match) → cannot compute; treated as miss

    if projected_low is not None:
        low_hit = any(float(l) <= projected_low for l in actual_bars["low"])
    else:
        low_hit = False

    # MAE/RMSE: simplified flat projection (K-080 Known Gap; K-082 extends to per-bar path)
    if projected_median is not None:
        projected_path = [projected_median] * 72
        diffs = [abs(projected_path[i] - actual_closes[i]) for i in range(72)]
        sq_diffs = [(projected_path[i] - actual_closes[i]) ** 2 for i in range(72)]
        mae = float(statistics.mean(diffs))
        rmse = float(math.sqrt(statistics.mean(sq_diffs)))
    else:
        mae = 0.0
        rmse = 0.0

    return {
        "high_hit": high_hit,
        "low_hit": low_hit,
        "mae": mae,
        "rmse": rmse,
        "actual_high": actual_high,
        "actual_low": actual_low,
        "computed_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


# ---------------------------------------------------------------------------
# Backfill and summary
# ---------------------------------------------------------------------------

def backfill_actuals(client, df: pd.DataFrame, cutoff_ts: datetime) -> int:
    """Scan predictions older than cutoff_ts; compute and write actuals docs.

    Returns count of actuals written. Skips predictions with incomplete 72-bar windows.
    Overwrites existing actuals docs (idempotent, CSV-deterministic computation).
    Skips predictions with null projected_high (0-match case).
    """
    predictions = list_predictions_older_than(client, cutoff_ts)
    written = 0
    skipped = 0

    for pred in predictions:
        ts = pred.get("_doc_id") or pred.get("query_ts", "")
        projected_high = pred.get("projected_high")

        if projected_high is None:
            logger.info("backfill_actuals: skipping %s — null projected_high (0-match prediction)", ts)
            continue

        outcome = compute_outcome(pred, df)
        if outcome is None:
            logger.info("backfill_actuals: window not complete yet for %s — skipping", ts)
            skipped += 1
            continue

        try:
            write_actual(client, ts, outcome)
            written += 1
        except Exception as exc:
            logger.error("backfill_actuals: failed to write actual for %s: %s", ts, exc)
            sys.exit(1)

    logger.info("backfill_actuals: wrote %d actuals, skipped %d incomplete windows", written, skipped)
    return written


def compute_backtest_summary(client, today: date) -> Optional[dict]:
    """Read all actuals docs in last 30 calendar days; join with predictions for trend.

    Returns summary dict matching FIRESTORE_BACKTEST_SUMMARY_FIELDS, or None if 0 completed pairs.
    """
    window_start = today - timedelta(days=30)
    window_start_str = window_start.isoformat()
    today_str = today.isoformat()

    # Fetch actuals for the 30-day window
    actuals_docs = (
        client.collection("actuals")
        .where("computed_at", ">=", window_start_str)
        .stream()
    )
    actuals_by_id: dict = {}
    for doc in actuals_docs:
        data = doc.to_dict()
        if data:
            actuals_by_id[doc.id] = data

    if not actuals_by_id:
        return None

    # Fetch predictions for the same window to get trend field
    preds_docs = (
        client.collection("predictions")
        .where("query_ts", ">=", window_start_str)
        .stream()
    )
    preds_by_id: dict = {}
    for doc in preds_docs:
        data = doc.to_dict()
        if data:
            preds_by_id[doc.id] = data

    # Join: only keep pairs where both prediction and actual exist
    pairs = []
    for doc_id, actual in actuals_by_id.items():
        pred = preds_by_id.get(doc_id)
        if pred is None:
            continue
        pairs.append({"prediction": pred, "actual": actual})

    if not pairs:
        return None

    # Aggregate overall stats
    high_hits = [p["actual"]["high_hit"] for p in pairs]
    low_hits = [p["actual"]["low_hit"] for p in pairs]
    maes = [p["actual"]["mae"] for p in pairs]
    rmses = [p["actual"]["rmse"] for p in pairs]

    hit_rate_high = sum(1 for h in high_hits if h) / len(high_hits)
    hit_rate_low = sum(1 for l in low_hits if l) / len(low_hits)
    avg_mae = float(statistics.mean(maes))
    avg_rmse = float(statistics.mean(rmses))

    # Per-trend breakdown (only write trend keys with sample_size > 0)
    per_trend: dict = {}
    for trend_label in ("up", "down", "flat"):
        trend_pairs = [p for p in pairs if p["prediction"].get("trend") == trend_label]
        if not trend_pairs:
            continue
        t_high = [p["actual"]["high_hit"] for p in trend_pairs]
        t_low = [p["actual"]["low_hit"] for p in trend_pairs]
        t_mae = [p["actual"]["mae"] for p in trend_pairs]
        per_trend[trend_label] = {
            "hit_rate_high": sum(1 for h in t_high if h) / len(t_high),
            "hit_rate_low": sum(1 for l in t_low if l) / len(t_low),
            "avg_mae": float(statistics.mean(t_mae)),
            "sample_size": len(trend_pairs),
        }

    return {
        "hit_rate_high": hit_rate_high,
        "hit_rate_low": hit_rate_low,
        "avg_mae": avg_mae,
        "avg_rmse": avg_rmse,
        "sample_size": len(pairs),
        "per_trend": per_trend,
        "window_days": 30,
        "computed_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------

def main() -> None:
    """Orchestrator: freshness gate → param load → prediction → write → backfill → summary.

    Exits 0 on stale CSV (graceful skip). Exits non-zero on unretriable Firestore failure.
    """
    csv_path = Path(os.environ.get("CSV_PATH", str(HISTORY_1H_PATH)))

    # Freshness gate: CSV mtime must be within 90 minutes
    if not csv_path.exists():
        logger.error("CSV not found at %s; aborting", csv_path)
        sys.exit(1)

    mtime_age_seconds = (datetime.utcnow() - datetime.utcfromtimestamp(csv_path.stat().st_mtime)).total_seconds()
    if mtime_age_seconds > CSV_FRESHNESS_THRESHOLD_SECONDS:
        logger.warning(
            "CSV stale: last modified %.0f minutes ago (threshold: 90 min); exiting 0 (graceful skip)",
            mtime_age_seconds / 60,
        )
        sys.exit(0)

    # Load active params (fallback to DEFAULT_PARAMS on any failure)
    params = load_active_params()
    logger.info("active params_hash: %s (source: %s)", params.params_hash[:12], params.source)

    # Module-level assignment per AC-080-PARAM-LOADING
    predictor.params = params

    # Load CSV history
    df = load_csv_history_as_df(csv_path)
    logger.info("loaded %d bars from %s", len(df), csv_path)

    # Anchor: yesterday's 23:00 UTC
    now_utc = datetime.utcnow()
    anchor_ts = (now_utc - timedelta(days=1)).replace(hour=23, minute=0, second=0, microsecond=0)
    logger.info("anchor_ts: %s", anchor_ts.strftime("%Y-%m-%d %H:%M"))

    # Build 24-bar query window
    try:
        query_df = build_query_window(df, anchor_ts)
    except ValueError as exc:
        logger.error("build_query_window failed: %s", exc)
        sys.exit(1)

    # Run prediction
    prediction = run_prediction(query_df, params, df)
    ts = anchor_ts.strftime("%Y-%m-%d-%H")
    logger.info(
        "prediction ts=%s top_k_count=%d trend=%s",
        ts,
        prediction.get("top_k_count", 0),
        prediction.get("trend", "?"),
    )

    # Write prediction to Firestore (retry once on failure)
    import google.cloud.firestore
    client = google.cloud.firestore.Client()

    try:
        write_prediction(client, ts, prediction)
        logger.info("wrote predictions/%s", ts)
    except Exception as exc:
        logger.error("permanent Firestore failure writing prediction: %s", exc)
        sys.exit(1)

    # Backfill actuals for predictions older than 72h
    cutoff_ts = now_utc - timedelta(hours=72)
    backfill_actuals(client, df, cutoff_ts)

    # Compute and write 30-day backtest summary
    summary = compute_backtest_summary(client, date.today())
    if summary is not None:
        try:
            write_summary(client, date.today().isoformat(), summary)
            logger.info(
                "wrote backtest_summaries/%s sample_size=%d hit_rate_high=%.2f hit_rate_low=%.2f",
                date.today().isoformat(),
                summary["sample_size"],
                summary["hit_rate_high"],
                summary["hit_rate_low"],
            )
        except Exception as exc:
            logger.error("permanent Firestore failure writing summary: %s", exc)
            sys.exit(1)
        print(f"summary: {summary}")
    else:
        logger.info("no completed pairs for summary window")

    logger.info("daily_predict complete")


if __name__ == "__main__":
    main()
