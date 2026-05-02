"""
backend/tests/test_health_endpoint.py — K-078

Tests for GET /api/health endpoint:
- Exact top-level key set
- Exact active_params key set
- Default source path
- Firestore source path (param swap)
- Response time < 100ms (no Firestore call per request)
- No raw SDK objects in response JSON
"""
import os
import sys
import time

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient

import predictor
from firestore_config import ParamSnapshot, DEFAULT_PARAMS


# Build TestClient AFTER module import so boot hook has run with DEFAULT_PARAMS.
from main import app
client = TestClient(app)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_health_exact_key_set():
    """HEALTH-EXPOSES-PARAMS: top-level keys exactly match allow-list."""
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    expected_keys = {"status", "params_source", "params_hash", "optimized_at", "active_params"}
    assert set(data.keys()) == expected_keys, (
        f"Key mismatch. Got {set(data.keys())}, expected {expected_keys}"
    )


def test_health_active_params_key_set():
    """HEALTH-EXPOSES-PARAMS: active_params keys exactly match allow-list."""
    resp = client.get("/api/health")
    assert resp.status_code == 200
    active = resp.json()["active_params"]
    expected_keys = {"ma_trend_window_days", "ma_trend_pearson_threshold", "top_k_matches"}
    assert set(active.keys()) == expected_keys, (
        f"active_params key mismatch. Got {set(active.keys())}, expected {expected_keys}"
    )


def test_health_default_source():
    """HEALTH-EXPOSES-PARAMS: with default params, params_source='default' and optimized_at=null."""
    original = predictor.params
    try:
        predictor.params = DEFAULT_PARAMS
        resp = client.get("/api/health")
        data = resp.json()
    finally:
        predictor.params = original

    assert data["params_source"] == "default"
    assert data["optimized_at"] is None
    assert data["status"] == "ok"


def test_health_firestore_source():
    """HEALTH-EXPOSES-PARAMS: swapping predictor.params to firestore snapshot reflects correctly."""
    firestore_snap = ParamSnapshot(
        ma_trend_window_days=14,
        ma_trend_pearson_threshold=0.5,
        top_k_matches=5,
        params_hash="a" * 64,
        optimized_at="2026-05-01T00:00:00Z",
        source="firestore",
    )
    original = predictor.params
    try:
        predictor.params = firestore_snap
        resp = client.get("/api/health")
        data = resp.json()
    finally:
        predictor.params = original

    assert data["params_source"] == "firestore"
    assert data["active_params"]["ma_trend_window_days"] == 14
    assert data["active_params"]["top_k_matches"] == 5


def test_health_under_100ms():
    """HEALTH-EXPOSES-PARAMS: endpoint serves < 100ms (no Firestore call per request)."""
    start = time.perf_counter()
    resp = client.get("/api/health")
    elapsed_ms = (time.perf_counter() - start) * 1000

    assert resp.status_code == 200
    assert elapsed_ms < 100, (
        f"Health endpoint took {elapsed_ms:.1f}ms, expected < 100ms. "
        "Check for accidental Firestore calls on each request."
    )


def test_health_no_raw_sdk_objects():
    """HEALTH-EXPOSES-PARAMS: response JSON is fully primitive — no nested non-JSON-native objects."""
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()

    def _assert_primitives(obj, path=""):
        if isinstance(obj, dict):
            for k, v in obj.items():
                _assert_primitives(v, f"{path}.{k}")
        elif isinstance(obj, list):
            for i, v in enumerate(obj):
                _assert_primitives(v, f"{path}[{i}]")
        else:
            assert obj is None or isinstance(obj, (str, int, float, bool)), (
                f"Non-primitive value at {path}: {type(obj).__name__} = {obj!r}"
            )

    _assert_primitives(data)
