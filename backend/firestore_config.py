"""
backend/firestore_config.py — K-078

ParamSnapshot dataclass + DEFAULT_PARAMS constant + load_active_params() loader.
Single responsibility: Firestore param reads only. Does NOT import from predictor.py.
"""
import hashlib
import logging
import concurrent.futures
from dataclasses import dataclass
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

__all__ = [
    "FIRESTORE_COLLECTION",
    "FIRESTORE_DOCUMENT",
    "FIRESTORE_PREDICTOR_PARAMS_FIELDS",
    "ParamSnapshot",
    "DEFAULT_PARAMS",
    "load_active_params",
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
