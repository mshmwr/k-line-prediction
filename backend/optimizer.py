"""
backend/optimizer.py — K-083

Pure helper functions for the weekly Bayesian optimizer.
Single responsibility: evaluation helpers, document builders, param_override context manager.
No Firestore I/O, no subprocess calls, no module-level side effects.

Dependency graph (unidirectional):
    weekly_optimize.py → optimizer.py → predictor.py (find_top_matches, compute_stats)
"""
import hashlib
from contextlib import contextmanager
from datetime import datetime
from typing import List, Optional

# ---------------------------------------------------------------------------
# Module constants
# ---------------------------------------------------------------------------

RANDOM_STATE: int = 42  # fixed seed for deterministic candidate sequence per session


# ---------------------------------------------------------------------------
# param_override context manager
# ---------------------------------------------------------------------------

@contextmanager
def param_override(snapshot):
    """Temporarily replace predictor.params for one objective evaluation.

    Used on: backend/optimizer.py (evaluate_corpus), backend/tests/test_weekly_optimize.py
    Restores predictor.params unconditionally on __exit__ (even on exception).
    snapshot: ParamSnapshot — must have ma_trend_window_days, ma_trend_pearson_threshold,
              top_k_matches fields matching predictor.params attribute names.
    """
    import predictor as _predictor  # late import keeps this module importable without backend/ on sys.path
    original = _predictor.params
    _predictor.params = snapshot
    try:
        yield
    finally:
        _predictor.params = original  # unconditional restore — AC-083-OBJECTIVE-FUNCTION


# ---------------------------------------------------------------------------
# Corpus evaluation
# ---------------------------------------------------------------------------

def evaluate_corpus(
    completed_pairs: list,
    snapshot,
    history_1h: list,
    history_1d: Optional[list] = None,
) -> float:
    """Re-run find_top_matches + compute_stats for each completed pair under snapshot params.

    Returns objective score = 0.5 * high_hit_rate + 0.5 * low_hit_rate over all scoreable pairs.
    Returns 0.0 when no pairs are scoreable (degenerate corpus — optimizer explores further).

    completed_pairs: list of {"prediction": dict, "actual": dict}
    snapshot: ParamSnapshot with candidate param values
    history_1h: full in-memory 1H bar list (loaded once at script startup)
    history_1d: full in-memory 1D bar list (loaded once at script startup; optional)
    """
    from predictor import compute_stats, find_top_matches  # noqa: E402

    high_hits = 0
    low_hits = 0
    total = 0

    import predictor as _pred_mod  # module-level reference enables patch("predictor.find_top_matches") in tests

    with param_override(snapshot):
        for pair in completed_pairs:
            pred_doc = pair["prediction"]
            actual_doc = pair["actual"]

            query_bars = _build_query_bars_from_prediction(pred_doc, history_1h)
            if query_bars is None:
                continue  # timestamp not found in CSV — skip pair silently

            try:
                matches = _pred_mod.find_top_matches(
                    input_bars=query_bars,
                    history=history_1h,
                    ma_history=history_1h,  # 1H used as ma_history; 1D overlay optional
                    history_1d=history_1d,
                )
                stats = _pred_mod.compute_stats(matches, current_close=query_bars[-1].close)
            except (ValueError, Exception):
                continue  # no matches or unexpected error — skip pair, do not abort

            projected_high = stats.highest.price if stats.highest else None
            projected_low = stats.lowest.price if stats.lowest else None

            if projected_high is not None and actual_doc.get("actual_high") is not None:
                if actual_doc["actual_high"] >= projected_high:
                    high_hits += 1
            if projected_low is not None and actual_doc.get("actual_low") is not None:
                if actual_doc["actual_low"] <= projected_low:
                    low_hits += 1
            total += 1

    if total == 0:
        return 0.0

    return 0.5 * (high_hits / total) + 0.5 * (low_hits / total)


def _build_query_bars_from_prediction(pred_doc: dict, history_1h: list):
    """Reconstruct the 24-bar OHLCBar window for a prediction document.

    Looks up pred_doc["query_ts"] in the 1H history list; returns the 24 bars
    ending at that timestamp. Returns None if the timestamp is not found or
    fewer than 24 bars are available (e.g. scraper missed that day).

    history_1h: list of bar dicts with 'date' key (Binance CSV format).
    """
    from models import OHLCBar  # noqa: E402

    query_ts = pred_doc.get("query_ts")
    if not query_ts:
        return None

    # Normalize to "YYYY-MM-DD HH:MM" prefix for matching
    norm_ts = _normalize_ts(query_ts)
    if norm_ts is None:
        return None

    # Find index of the anchor bar
    anchor_idx = None
    for idx, bar in enumerate(history_1h):
        bar_time = str(bar.get("date", bar.get("time", "")))
        if bar_time[:16] == norm_ts:
            anchor_idx = idx
            break

    if anchor_idx is None or anchor_idx < 23:
        return None  # not found, or fewer than 24 bars available before it

    window = history_1h[anchor_idx - 23 : anchor_idx + 1]
    if len(window) < 24:
        return None

    try:
        return [
            OHLCBar(
                open=float(b["open"]),
                high=float(b["high"]),
                low=float(b["low"]),
                close=float(b["close"]),
                time=str(b.get("date", b.get("time", ""))),
            )
            for b in window
        ]
    except (KeyError, TypeError, ValueError):
        return None


def _normalize_ts(ts_str: str) -> Optional[str]:
    """Normalize a query_ts string to 'YYYY-MM-DD HH:MM' for history lookup.

    Handles ISO8601 'T', space-delimited, and 'YYYY-MM-DD-HH' formats.
    Returns None on unparseable input.
    """
    if not ts_str:
        return None
    ts_str = ts_str.strip()
    try:
        if "T" in ts_str:
            return ts_str[:16].replace("T", " ")
        if len(ts_str) == 13 and ts_str[10] == "-":
            # "YYYY-MM-DD-HH" → "YYYY-MM-DD HH:00"
            dt = datetime.strptime(ts_str, "%Y-%m-%d-%H")
            return dt.strftime("%Y-%m-%d %H:%M")
        return ts_str[:16]
    except ValueError:
        return None


# ---------------------------------------------------------------------------
# Document builders — no Firestore I/O; pure dict construction
# ---------------------------------------------------------------------------

def build_predictor_params_doc(
    window_days: int,
    pearson_threshold: float,
    top_k: int,
    optimized_at: str,
) -> dict:
    """Build the predictor_params/active document payload.

    Keys match FIRESTORE_PREDICTOR_PARAMS_FIELDS exactly.
    """
    return {
        "window_days": window_days,
        "pearson_threshold": pearson_threshold,
        "top_k": top_k,
        "optimized_at": optimized_at,
    }


def build_predictor_params_history_doc(
    window_days: int,
    pearson_threshold: float,
    top_k: int,
    optimized_at: str,
    best_score: float,
    run_id: str,
    git_sha: str,
    corpus_size: int,
) -> dict:
    """Build the predictor_params/history/{run_id} document payload.

    Keys match FIRESTORE_PREDICTOR_PARAMS_HISTORY_FIELDS exactly.
    """
    return {
        "window_days": window_days,
        "pearson_threshold": pearson_threshold,
        "top_k": top_k,
        "optimized_at": optimized_at,
        "best_score": best_score,
        "run_id": run_id,
        "git_sha": git_sha,
        "corpus_size": corpus_size,
    }


def build_optimize_run_doc(
    run_id: str,
    best_score: float,
    best_params: dict,
    iterations_run: int,
    early_exit: bool,
    data_window_days: int,
    sample_size: int,
    started_at: str,
    completed_at: str,
) -> dict:
    """Build the optimize_runs/{run_id} document payload.

    Keys match FIRESTORE_OPTIMIZE_RUN_FIELDS exactly.
    best_params: {"window_days": int, "pearson_threshold": float, "top_k": int}
    """
    return {
        "run_id": run_id,
        "best_score": best_score,
        "best_params": best_params,
        "iterations_run": iterations_run,
        "early_exit": early_exit,
        "data_window_days": data_window_days,
        "sample_size": sample_size,
        "started_at": started_at,
        "completed_at": completed_at,
    }
