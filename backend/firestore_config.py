"""
backend/firestore_config.py — K-078/K-080

ParamSnapshot dataclass + DEFAULT_PARAMS constant + load_active_params() loader.
K-080 additions: prediction/actual/summary frozenset schema contracts + writer helpers.
Single responsibility: Firestore I/O config. Does NOT import from predictor.py.
"""
import hashlib
import logging
import time
import concurrent.futures
from dataclasses import dataclass
from datetime import datetime
from typing import Literal, Optional

# Top-level ImportError guard: module remains importable even without the wheel.
try:
    import google.cloud.firestore  # noqa: F401 — presence check only
    _FIRESTORE_AVAILABLE = True
except ImportError:
    _FIRESTORE_AVAILABLE = False

logger = logging.getLogger(__name__)

FIRESTORE_COLLECTION = "predictor_params"
FIRESTORE_DOCUMENT = "active"

# K-079 contract: the four expected keys in the predictor_params/active document.
# K-079 writer must use this set so field names stay in sync with the reader above.
FIRESTORE_PREDICTOR_PARAMS_FIELDS: frozenset = frozenset({
    "window_days",
    "pearson_threshold",
    "top_k",
    "optimized_at",
})

# K-080 cross-ticket schema contracts — downstream K-081 (frontend) and K-082 (optimizer)
# import these frozensets for type-safety checks. Field names only; nullability in design §3.
FIRESTORE_PREDICTION_FIELDS: frozenset = frozenset({
    "params_hash",        # str  — sha256 hex (full 64 chars)
    "projected_high",     # float|None — highest projected price across top-K future paths
    "projected_low",      # float|None — lowest projected price across top-K future paths
    "projected_median",   # float|None — median of projected close at bar 72
    "top_k_count",        # int  — actual number of matches returned by find_top_matches()
    "trend",              # str  — "up" | "down" | "flat" | "unknown" (0-match case)
    "query_ts",           # str  — ISO8601 UTC datetime of the anchor bar
    "created_at",         # str  — ISO8601 UTC datetime when this doc was written
})

FIRESTORE_ACTUAL_FIELDS: frozenset = frozenset({
    "high_hit",      # bool  — True if any 1H bar's high >= projected_high in 72-bar window
    "low_hit",       # bool  — True if any 1H bar's low  <= projected_low  in 72-bar window
    "mae",           # float — mean absolute error: mean(|projected_median_path[i] - actual_close[i]|)
    "rmse",          # float — root mean square error of same path
    "actual_high",   # float — max(high) across the 72-bar window in CSV
    "actual_low",    # float — min(low)  across the 72-bar window in CSV
    "computed_at",   # str   — ISO8601 UTC datetime when this doc was written
})

FIRESTORE_BACKTEST_SUMMARY_FIELDS: frozenset = frozenset({
    "hit_rate_high",   # float 0-1 — fraction of predictions where high_hit == True
    "hit_rate_low",    # float 0-1 — fraction of predictions where low_hit == True
    "avg_mae",         # float — arithmetic mean of mae across all completed pairs in window
    "avg_rmse",        # float — arithmetic mean of rmse across all completed pairs in window
    "sample_size",     # int   — count of (prediction, actual) completed pairs in 30-day window
    "per_trend",       # dict  — keys "up", "down", "flat"; each: {hit_rate_high, hit_rate_low, avg_mae, sample_size}
    "window_days",     # int   — always 30 (K-080 constant; optimizer may vary)
    "computed_at",     # str   — ISO8601 UTC datetime when this doc was written
})

__all__ = [
    "FIRESTORE_COLLECTION",
    "FIRESTORE_DOCUMENT",
    "FIRESTORE_PREDICTOR_PARAMS_FIELDS",
    "FIRESTORE_PREDICTION_FIELDS",
    "FIRESTORE_ACTUAL_FIELDS",
    "FIRESTORE_BACKTEST_SUMMARY_FIELDS",
    "ParamSnapshot",
    "DEFAULT_PARAMS",
    "load_active_params",
    "write_prediction",
    "write_actual",
    "write_summary",
    "list_predictions_older_than",
    "_read_firestore_doc",
    "_compute_params_hash",
]


@dataclass
class ParamSnapshot:
    ma_trend_window_days: int
    ma_trend_pearson_threshold: float
    top_k_matches: int
    params_hash: str              # sha256 hex of canonical tuple; 12-char prefix in /health
    optimized_at: Optional[str]   # ISO8601 or None
    source: Literal["firestore", "default"]


def _compute_params_hash(window: int, pearson: float, top_k: int) -> str:
    """Deterministic sha256 of canonical tuple. Pearson formatted to 6dp to avoid
    float repr instability across platforms."""
    raw = f"{window}:{pearson:.6f}:{top_k}"
    return hashlib.sha256(raw.encode()).hexdigest()


# Module-level constant — computed once at import time.
DEFAULT_PARAMS = ParamSnapshot(
    ma_trend_window_days=30,
    ma_trend_pearson_threshold=0.4,
    top_k_matches=10,
    params_hash=_compute_params_hash(30, 0.4, 10),
    optimized_at=None,
    source="default",
)


def _read_firestore_doc():
    """Synchronous Firestore read. Called inside ThreadPoolExecutor by load_active_params().
    Extracted at module level to allow patching in tests."""
    import google.cloud.firestore as fs
    db = fs.Client()
    doc_ref = db.collection(FIRESTORE_COLLECTION).document(FIRESTORE_DOCUMENT)
    return doc_ref.get()


def load_active_params(timeout_seconds: float = 5.0) -> ParamSnapshot:
    """Load predictor params from Firestore collection predictor_params/active.

    Wraps the synchronous SDK call in a ThreadPoolExecutor so gRPC internal
    retries cannot exceed the wall-clock budget (QA Challenge #2 resolution).

    Returns DEFAULT_PARAMS (with warning) on any failure:
    - ImportError: SDK wheel not installed
    - google.cloud.exceptions.NotFound: document does not exist
    - TimeoutError: future.result timeout exceeded
    - Any other SDK / network exception
    Never returns None.
    """
    if not _FIRESTORE_AVAILABLE:
        logger.warning(
            "firestore_config: google.cloud.firestore not available (ImportError); "
            "using DEFAULT_PARAMS"
        )
        return DEFAULT_PARAMS

    try:
        executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
        try:
            future = executor.submit(_read_firestore_doc)
            doc = future.result(timeout=timeout_seconds)
        finally:
            # shutdown(wait=False) so a stuck gRPC call doesn't block the boot sequence
            # beyond the timeout. The worker thread is abandoned — acceptable for
            # boot-time single call (see §16 design note on executor lifecycle).
            executor.shutdown(wait=False)

        if not doc.exists:
            import google.cloud.exceptions
            raise google.cloud.exceptions.NotFound(
                f"{FIRESTORE_COLLECTION}/{FIRESTORE_DOCUMENT}"
            )

        data = doc.to_dict()
        loaded_window = int(data["window_days"])
        loaded_pearson = float(data["pearson_threshold"])
        loaded_top_k = int(data["top_k"])
        loaded_optimized_at = data.get("optimized_at")

        # Guard: top_k=0 would silently return empty match list (§16 known gap fix).
        if loaded_top_k < 1:
            logger.warning(
                "firestore_config: top_k=%d loaded from Firestore is invalid (<1); "
                "using DEFAULT_PARAMS",
                loaded_top_k,
            )
            return DEFAULT_PARAMS

        return ParamSnapshot(
            ma_trend_window_days=loaded_window,
            ma_trend_pearson_threshold=loaded_pearson,
            top_k_matches=loaded_top_k,
            params_hash=_compute_params_hash(loaded_window, loaded_pearson, loaded_top_k),
            optimized_at=str(loaded_optimized_at) if loaded_optimized_at is not None else None,
            source="firestore",
        )

    except concurrent.futures.TimeoutError:
        logger.warning(
            "firestore_config: Firestore read timed out after %.1fs; using DEFAULT_PARAMS",
            timeout_seconds,
        )
        return DEFAULT_PARAMS
    except Exception as exc:
        logger.warning(
            "firestore_config: Firestore read failed (%s: %s); using DEFAULT_PARAMS",
            type(exc).__name__,
            exc,
        )
        return DEFAULT_PARAMS


# ---------------------------------------------------------------------------
# K-080 writer helpers — retry-once semantics for all write operations
# ---------------------------------------------------------------------------

_WRITE_RETRY_DELAY_SECONDS = 5


def _write_with_retry(doc_ref, data: dict) -> None:
    """Call doc_ref.set(data) with one retry after _WRITE_RETRY_DELAY_SECONDS on failure.

    Raises the last exception if both attempts fail. Why: Firestore transient errors
    (gRPC deadline exceeded, temporary unavailability) are common; a single retry
    covers the vast majority of transient failures without masking permanent ones.
    """
    try:
        doc_ref.set(data)
    except Exception as first_exc:
        logger.warning(
            "firestore_config: write failed (%s: %s); retrying in %ds",
            type(first_exc).__name__,
            first_exc,
            _WRITE_RETRY_DELAY_SECONDS,
        )
        time.sleep(_WRITE_RETRY_DELAY_SECONDS)
        doc_ref.set(data)  # raises on second failure — caller handles SystemExit


def write_prediction(client, ts: str, data: dict) -> None:
    """Write prediction dict to predictions/{ts} with overwrite semantics.

    ts: YYYY-MM-DD-HH string (e.g. "2026-05-01-23"). Retries once after 5s on failure.
    """
    doc_ref = client.collection("predictions").document(ts)
    _write_with_retry(doc_ref, data)


def write_actual(client, ts: str, data: dict) -> None:
    """Write actual outcome dict to actuals/{ts} with overwrite semantics.

    ts: YYYY-MM-DD-HH string matching the parent predictions doc. Retries once after 5s.
    """
    doc_ref = client.collection("actuals").document(ts)
    _write_with_retry(doc_ref, data)


def write_summary(client, date_str: str, data: dict) -> None:
    """Write backtest summary dict to backtest_summaries/{date_str} with overwrite semantics.

    date_str: ISO date string e.g. "2026-05-02". Retries once after 5s on failure.
    """
    doc_ref = client.collection("backtest_summaries").document(date_str)
    _write_with_retry(doc_ref, data)


def list_predictions_older_than(client, cutoff_ts: datetime) -> list:
    """Query predictions collection for docs where query_ts < cutoff_ts (ISO string compare).

    Returns list of dicts. Used by backfill_actuals to find predictions eligible for outcome
    computation (at least 72h have elapsed since the prediction anchor time).
    """
    cutoff_str = cutoff_ts.strftime("%Y-%m-%dT%H:%M:%SZ")
    docs = (
        client.collection("predictions")
        .where("query_ts", "<", cutoff_str)
        .stream()
    )
    results = []
    for doc in docs:
        data = doc.to_dict()
        if data:
            data["_doc_id"] = doc.id
            results.append(data)
    return results
