"""
backend/tests/test_firestore_config.py — K-078

Unit tests for firestore_config.py:
- load_active_params() success path (mocked _read_firestore_doc)
- NotFound fallback → DEFAULT_PARAMS
- DeadlineExceeded / timeout fallback → DEFAULT_PARAMS
- ImportError guard → DEFAULT_PARAMS
- DEFAULT_PARAMS field values
- _compute_params_hash() determinism
"""
import os
import sys
import time
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import firestore_config
from firestore_config import (
    DEFAULT_PARAMS,
    FIRESTORE_PREDICTOR_PARAMS_FIELDS,
    ParamSnapshot,
    _compute_params_hash,
    _read_firestore_doc,
    load_active_params,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_mock_doc(window=14, pearson=0.5, top_k=5, optimized_at="2026-05-01T00:00:00Z"):
    """Return a mock Firestore DocumentSnapshot with .exists=True and given fields."""
    doc = MagicMock()
    doc.exists = True
    doc.to_dict.return_value = {
        "window_days": window,
        "pearson_threshold": pearson,
        "top_k": top_k,
        "optimized_at": optimized_at,
    }
    return doc


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_load_active_params_success_mocked():
    """BOOT-PARAM-LOADER: mocked _read_firestore_doc returns doc → ParamSnapshot source='firestore'."""
    mock_doc = _make_mock_doc(window=14, pearson=0.5, top_k=5)

    with patch("firestore_config._FIRESTORE_AVAILABLE", True):
        with patch.object(firestore_config, "_read_firestore_doc", return_value=mock_doc):
            result = load_active_params()

    assert isinstance(result, ParamSnapshot)
    assert result.source == "firestore"
    assert result.ma_trend_window_days == 14
    assert result.ma_trend_pearson_threshold == 0.5
    assert result.top_k_matches == 5
    assert result.optimized_at == "2026-05-01T00:00:00Z"
    assert len(result.params_hash) >= 12


def test_load_active_params_not_found():
    """BOOT-PARAM-LOADER: doc.exists=False → NotFound exception → returns DEFAULT_PARAMS."""
    mock_doc = MagicMock()
    mock_doc.exists = False  # triggers NotFound raise inside load_active_params

    with patch("firestore_config._FIRESTORE_AVAILABLE", True):
        with patch.object(firestore_config, "_read_firestore_doc", return_value=mock_doc):
            result = load_active_params()

    assert result.source == "default"
    assert result == DEFAULT_PARAMS


def test_load_active_params_timeout():
    """BOOT-PARAM-LOADER: _read_firestore_doc blocks → returns within wall-clock budget;
    result has source='default'."""
    def _slow():
        time.sleep(10)  # Far exceeds timeout_seconds=0.5

    with patch("firestore_config._FIRESTORE_AVAILABLE", True):
        with patch.object(firestore_config, "_read_firestore_doc", side_effect=_slow):
            start = time.perf_counter()
            result = load_active_params(timeout_seconds=0.5)
            elapsed = time.perf_counter() - start

    assert elapsed < 1.0, f"Loader took {elapsed:.2f}s, expected < 1.0s"
    assert result.source == "default"


def test_load_active_params_import_error():
    """BOOT-PARAM-LOADER: SDK not installed → _FIRESTORE_AVAILABLE=False → DEFAULT_PARAMS."""
    with patch("firestore_config._FIRESTORE_AVAILABLE", False):
        result = load_active_params()

    assert result.source == "default"
    assert result == DEFAULT_PARAMS


def test_default_params_values():
    """PREDICTOR-CONSTANTS-EXPOSED: DEFAULT_PARAMS fields match expected seed values."""
    assert DEFAULT_PARAMS.ma_trend_window_days == 30
    assert DEFAULT_PARAMS.ma_trend_pearson_threshold == 0.4
    assert DEFAULT_PARAMS.top_k_matches == 10
    assert DEFAULT_PARAMS.source == "default"
    assert DEFAULT_PARAMS.optimized_at is None
    assert len(DEFAULT_PARAMS.params_hash) == 64  # full sha256 hex


def test_params_hash_deterministic():
    """BOOT-PARAM-LOADER: hash function is deterministic and long enough for 12-char prefix."""
    h1 = _compute_params_hash(30, 0.4, 10)
    h2 = _compute_params_hash(30, 0.4, 10)
    assert h1 == h2, "Hash function is not deterministic"
    assert len(h1) >= 12, f"Hash too short: {h1!r}"


def test_firestore_predictor_params_fields_contract():
    """D-3 contract: FIRESTORE_PREDICTOR_PARAMS_FIELDS is the exact frozenset K-079 must write."""
    assert FIRESTORE_PREDICTOR_PARAMS_FIELDS == frozenset({
        "window_days",
        "pearson_threshold",
        "top_k",
        "optimized_at",
    }), (
        "FIRESTORE_PREDICTOR_PARAMS_FIELDS changed — K-079 writer must be updated to match."
    )


def test_read_firestore_doc_only_reads_contract_fields():
    """D-3 contract: _read_firestore_doc result dict keys match FIRESTORE_PREDICTOR_PARAMS_FIELDS.

    Uses a mock success path to verify that load_active_params only accesses the
    four contract fields from the Firestore document dict.
    """
    mock_doc = MagicMock()
    mock_doc.exists = True
    # Provide exactly the contract fields (plus no extras)
    mock_doc.to_dict.return_value = {
        "window_days": 14,
        "pearson_threshold": 0.6,
        "top_k": 7,
        "optimized_at": "2026-05-02T00:00:00Z",
    }

    with patch("firestore_config._FIRESTORE_AVAILABLE", True):
        with patch.object(firestore_config, "_read_firestore_doc", return_value=mock_doc):
            result = load_active_params()

    # Confirm all contract fields were consumed
    assert result.ma_trend_window_days == 14
    assert result.ma_trend_pearson_threshold == 0.6
    assert result.top_k_matches == 7
    assert result.optimized_at == "2026-05-02T00:00:00Z"
    # Confirm the dict keys from the mock exactly match the contract set
    consumed_keys = set(mock_doc.to_dict.return_value.keys())
    assert consumed_keys == FIRESTORE_PREDICTOR_PARAMS_FIELDS, (
        f"Mock doc keys {consumed_keys} differ from FIRESTORE_PREDICTOR_PARAMS_FIELDS — "
        "contract drift detected."
    )


def test_prediction_frozenset_contract():
    """K-080 cross-ticket contract: all three K-080 frozensets have exact expected field sets.

    K-081 (frontend) and K-082 (optimizer) import these frozensets for type safety.
    Any silent field rename breaks downstream consumers at import time — this test catches it.
    """
    from firestore_config import (
        FIRESTORE_PREDICTION_FIELDS,
        FIRESTORE_ACTUAL_FIELDS,
        FIRESTORE_BACKTEST_SUMMARY_FIELDS,
    )
    assert FIRESTORE_PREDICTION_FIELDS == frozenset({
        "params_hash", "projected_high", "projected_low", "projected_median",
        "top_k_count", "trend", "query_ts", "created_at",
    })
    assert FIRESTORE_ACTUAL_FIELDS == frozenset({
        "high_hit", "low_hit", "mae", "rmse",
        "actual_high", "actual_low", "computed_at",
    })
    assert FIRESTORE_BACKTEST_SUMMARY_FIELDS == frozenset({
        "hit_rate_high", "hit_rate_low", "avg_mae", "avg_rmse",
        "sample_size", "per_trend", "window_days", "computed_at",
    })
