"""
backend/tests/test_daily_predict.py — K-080

Unit tests for scripts/daily_predict.py helper functions.
All tests use MagicMock Firestore client — no live Firestore calls.
Fixture CSV: backend/tests/fixtures/ETHUSDT-1h-2026-04-07-original.csv (24-bar slice).
"""
import math
import os
import statistics
import sys
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import MagicMock, call, patch

import pandas as pd
import pytest

# Ensure scripts/ and backend/ are importable
# File path: backend/tests/test_daily_predict.py → parents[2] = worktree root
_REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(_REPO_ROOT / "scripts"))
sys.path.insert(0, str(_REPO_ROOT / "backend"))

from daily_predict import (  # noqa: E402
    backfill_actuals,
    build_query_window,
    compute_backtest_summary,
    compute_outcome,
    load_csv_history_as_df,
    run_prediction,
)
from firestore_config import (  # noqa: E402
    FIRESTORE_ACTUAL_FIELDS,
    FIRESTORE_PREDICTION_FIELDS,
    write_actual,
    write_prediction,
    write_summary,
)
from mock_data import load_official_day_csv  # noqa: E402

FIXTURE_CSV = Path(__file__).parent / "fixtures" / "ETHUSDT-1h-2026-04-07-original.csv"


def _load_fixture_df() -> pd.DataFrame:
    """Load the Binance-format fixture CSV (headerless, microsecond timestamps) into a DataFrame.

    Returns DataFrame with columns [open, high, low, close, time].
    load_official_day_csv handles microsecond timestamp normalization.
    """
    bars = load_official_day_csv(FIXTURE_CSV)
    df = pd.DataFrame(bars)
    if "date" in df.columns and "time" not in df.columns:
        df = df.rename(columns={"date": "time"})
    return df[["open", "high", "low", "close", "time"]]


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_client():
    """Canonical MagicMock Firestore client fixture used by all write tests."""
    client = MagicMock()
    doc_ref = MagicMock()
    client.collection.return_value.document.return_value = doc_ref
    return client, doc_ref


@pytest.fixture
def sample_df():
    """Load the real fixture CSV into a DataFrame; normalize to 72+ bars for outcome tests.

    The 24-bar fixture is replicated to provide enough rows for the 72-bar window requirement.
    """
    df = _load_fixture_df()
    # Replicate to 200+ rows so window tests have sufficient data
    copies = []
    base_time = datetime(2026, 1, 1, 0, 0)
    for rep in range(10):
        chunk = df.copy()
        for i, row in chunk.iterrows():
            offset_hours = rep * 24 + i
            chunk.at[i, "time"] = (base_time + timedelta(hours=offset_hours)).strftime("%Y-%m-%d %H:%M")
        copies.append(chunk)
    combined = pd.concat(copies, ignore_index=True)
    return combined


@pytest.fixture
def minimal_prediction():
    """A minimal prediction dict derived from fixture CSV price range."""
    df = _load_fixture_df()
    midprice = float(df["close"].mean())
    return {
        "params_hash": "a" * 64,
        "projected_high": midprice * 1.02,
        "projected_low": midprice * 0.98,
        "projected_median": midprice,
        "top_k_count": 5,
        "trend": "flat",
        "query_ts": "2026-01-01 00:00",
        "created_at": "2026-01-01T00:00:00Z",
    }


# ---------------------------------------------------------------------------
# Test 1 — prediction document field set
# ---------------------------------------------------------------------------

def test_prediction_write_field_set(mock_client):
    """write_prediction calls set() with dict whose keys == FIRESTORE_PREDICTION_FIELDS."""
    client, doc_ref = mock_client
    df = _load_fixture_df()
    midprice = float(df["close"].mean())
    prediction = {
        "params_hash": "b" * 64,
        "projected_high": midprice * 1.02,
        "projected_low": midprice * 0.98,
        "projected_median": midprice,
        "top_k_count": 3,
        "trend": "up",
        "query_ts": "2026-04-07 23:00",
        "created_at": "2026-04-08T04:00:00Z",
    }

    write_prediction(client, "2026-04-07-23", prediction)

    assert doc_ref.set.call_count == 1
    written_data = doc_ref.set.call_args[0][0]
    assert set(written_data.keys()) == FIRESTORE_PREDICTION_FIELDS
    assert written_data["params_hash"] == "b" * 64
    assert "projected_high" in written_data
    assert "created_at" in written_data


# ---------------------------------------------------------------------------
# Test 2a — high_hit True
# ---------------------------------------------------------------------------

def test_compute_outcome_high_hit_true():
    """high_hit == True when any bar's high >= projected_high in 72-bar window."""
    # Build a 73-bar DataFrame: bar at index 0 is the anchor, bars 1-72 are the window
    base = datetime(2025, 1, 1, 0, 0)
    rows = []
    for i in range(73):
        t = (base + timedelta(hours=i)).strftime("%Y-%m-%d %H:%M")
        rows.append({"time": t, "open": 2000.0, "high": 2001.0, "low": 1999.0, "close": 2000.0})
    # Set one bar's high to 2100 (above projected_high=2050)
    rows[36]["high"] = 2100.0
    df = pd.DataFrame(rows)

    prediction = {
        "projected_high": 2050.0,
        "projected_low": 1800.0,
        "projected_median": 2000.0,
        "query_ts": base.strftime("%Y-%m-%d %H:%M"),
    }
    outcome = compute_outcome(prediction, df)
    assert outcome is not None
    assert outcome["high_hit"] is True


# ---------------------------------------------------------------------------
# Test 2b — low_hit False
# ---------------------------------------------------------------------------

def test_compute_outcome_low_hit_false():
    """low_hit == False when all bars' low >= projected_low."""
    base = datetime(2025, 2, 1, 0, 0)
    rows = []
    for i in range(73):
        t = (base + timedelta(hours=i)).strftime("%Y-%m-%d %H:%M")
        rows.append({"time": t, "open": 1900.0, "high": 1950.0, "low": 1900.0, "close": 1920.0})
    df = pd.DataFrame(rows)

    prediction = {
        "projected_high": 2000.0,
        "projected_low": 1800.0,   # all lows are >= 1900, so low_hit must be False
        "projected_median": 1920.0,
        "query_ts": base.strftime("%Y-%m-%d %H:%M"),
    }
    outcome = compute_outcome(prediction, df)
    assert outcome is not None
    assert outcome["low_hit"] is False


# ---------------------------------------------------------------------------
# Test 2c — MAE and RMSE correctness (uniform deviation)
# ---------------------------------------------------------------------------

def test_compute_outcome_mae_rmse():
    """With projected_median=2000.0 and all 72 closes at 2100.0, mae==100.0 and rmse==100.0."""
    base = datetime(2025, 3, 1, 0, 0)
    rows = []
    for i in range(73):
        t = (base + timedelta(hours=i)).strftime("%Y-%m-%d %H:%M")
        rows.append({"time": t, "open": 2100.0, "high": 2110.0, "low": 2090.0, "close": 2100.0})
    df = pd.DataFrame(rows)

    prediction = {
        "projected_high": 2150.0,
        "projected_low": 2000.0,
        "projected_median": 2000.0,
        "query_ts": base.strftime("%Y-%m-%d %H:%M"),
    }
    outcome = compute_outcome(prediction, df)
    assert outcome is not None
    assert outcome["mae"] == pytest.approx(100.0, abs=1e-6)
    assert outcome["rmse"] == pytest.approx(100.0, abs=1e-6)


# ---------------------------------------------------------------------------
# Test 3 — backtest summary aggregation
# ---------------------------------------------------------------------------

def test_backtest_summary_aggregation():
    """3 completed pairs: 2 high_hit=True, 1 high_hit=False → hit_rate_high ≈ 2/3, sample_size=3."""
    client = MagicMock()

    # Mock actuals collection stream
    def make_actual_doc(doc_id, high_hit, low_hit, mae=50.0, rmse=60.0):
        doc = MagicMock()
        doc.id = doc_id
        doc.to_dict.return_value = {
            "high_hit": high_hit,
            "low_hit": low_hit,
            "mae": mae,
            "rmse": rmse,
            "actual_high": 2200.0,
            "actual_low": 1900.0,
            "computed_at": "2026-05-01T04:00:00Z",
        }
        return doc

    def make_pred_doc(doc_id, trend="flat"):
        doc = MagicMock()
        doc.id = doc_id
        doc.to_dict.return_value = {
            "params_hash": "a" * 64,
            "projected_high": 2100.0,
            "projected_low": 1950.0,
            "projected_median": 2000.0,
            "top_k_count": 5,
            "trend": trend,
            "query_ts": "2026-04-29 23:00",
            "created_at": "2026-04-30T04:00:00Z",
        }
        return doc

    actual_docs = [
        make_actual_doc("2026-04-29-23", high_hit=True, low_hit=True),
        make_actual_doc("2026-04-30-23", high_hit=True, low_hit=False),
        make_actual_doc("2026-05-01-23", high_hit=False, low_hit=True),
    ]
    pred_docs = [
        make_pred_doc("2026-04-29-23", trend="up"),
        make_pred_doc("2026-04-30-23", trend="up"),
        make_pred_doc("2026-05-01-23", trend="down"),
    ]

    # Wire mock client collections
    def collection_side_effect(name):
        coll = MagicMock()
        if name == "actuals":
            where_chain = MagicMock()
            where_chain.stream.return_value = iter(actual_docs)
            coll.where.return_value = where_chain
        elif name == "predictions":
            where_chain = MagicMock()
            where_chain.stream.return_value = iter(pred_docs)
            coll.where.return_value = where_chain
        return coll

    client.collection.side_effect = collection_side_effect

    from datetime import date
    summary = compute_backtest_summary(client, date(2026, 5, 2))

    assert summary is not None
    assert summary["sample_size"] == 3
    assert summary["hit_rate_high"] == pytest.approx(2 / 3, abs=1e-6)
    assert "per_trend" in summary
    assert summary["window_days"] == 30


# ---------------------------------------------------------------------------
# Test 4 — idempotent overwrite (same hour, same params)
# ---------------------------------------------------------------------------

def test_idempotent_overwrite_same_hour(mock_client):
    """write_prediction called twice with same ts: set() called twice, no exception."""
    client, doc_ref = mock_client
    df = _load_fixture_df()
    midprice = float(df["close"].mean())
    prediction = {
        "params_hash": "c" * 64,
        "projected_high": midprice * 1.01,
        "projected_low": midprice * 0.99,
        "projected_median": midprice,
        "top_k_count": 5,
        "trend": "flat",
        "query_ts": "2026-04-07 23:00",
        "created_at": "2026-04-08T04:00:00Z",
    }

    write_prediction(client, "2026-04-07-23", prediction)
    write_prediction(client, "2026-04-07-23", prediction)

    assert doc_ref.set.call_count == 2  # both writes go through; no guard skips second


# ---------------------------------------------------------------------------
# Test 5 — Firestore transient failure → retry → succeed
# ---------------------------------------------------------------------------

def test_firestore_transient_failure_retry_succeed(mock_client):
    """set() raises on first call, succeeds on second; no exception propagated."""
    client, doc_ref = mock_client
    call_count = {"n": 0}

    def set_side_effect(data):
        call_count["n"] += 1
        if call_count["n"] == 1:
            raise Exception("transient gRPC error")
        # second call succeeds (no-op return)

    doc_ref.set.side_effect = set_side_effect

    df = _load_fixture_df()
    midprice = float(df["close"].mean())
    prediction = {
        "params_hash": "d" * 64,
        "projected_high": midprice * 1.01,
        "projected_low": midprice * 0.99,
        "projected_median": midprice,
        "top_k_count": 5,
        "trend": "flat",
        "query_ts": "2026-04-07 23:00",
        "created_at": "2026-04-08T04:00:00Z",
    }

    # Patch sleep to avoid actual 5s delay in CI
    with patch("firestore_config.time.sleep"):
        write_prediction(client, "2026-04-07-23", prediction)

    assert doc_ref.set.call_count == 2


# ---------------------------------------------------------------------------
# Test 6 — Firestore permanent failure (both attempts fail) → exits non-zero
# ---------------------------------------------------------------------------

def test_firestore_permanent_failure_exits_nonzero(mock_client):
    """set() raises on both calls → write_prediction propagates exception."""
    client, doc_ref = mock_client
    doc_ref.set.side_effect = Exception("permanent failure")

    df = _load_fixture_df()
    midprice = float(df["close"].mean())
    prediction = {
        "params_hash": "e" * 64,
        "projected_high": midprice * 1.01,
        "projected_low": midprice * 0.99,
        "projected_median": midprice,
        "top_k_count": 5,
        "trend": "flat",
        "query_ts": "2026-04-07 23:00",
        "created_at": "2026-04-08T04:00:00Z",
    }

    with patch("firestore_config.time.sleep"):
        with pytest.raises(Exception, match="permanent failure"):
            write_prediction(client, "2026-04-07-23", prediction)

    assert doc_ref.set.call_count == 2


# ---------------------------------------------------------------------------
# Test 7 — incomplete 72-bar window → compute_outcome returns None
# ---------------------------------------------------------------------------

def test_compute_outcome_incomplete_window_returns_none():
    """compute_outcome returns None if only 50 bars available (< 72)."""
    base = datetime(2025, 4, 1, 0, 0)
    rows = []
    for i in range(51):  # anchor + 50 window bars (< 72)
        t = (base + timedelta(hours=i)).strftime("%Y-%m-%d %H:%M")
        rows.append({"time": t, "open": 2000.0, "high": 2010.0, "low": 1990.0, "close": 2000.0})
    df = pd.DataFrame(rows)

    prediction = {
        "projected_high": 2050.0,
        "projected_low": 1900.0,
        "projected_median": 2000.0,
        "query_ts": base.strftime("%Y-%m-%d %H:%M"),
    }
    outcome = compute_outcome(prediction, df)
    assert outcome is None


# ---------------------------------------------------------------------------
# Test 8 — zero-match prediction field set has correct shape
# ---------------------------------------------------------------------------

def test_zero_match_prediction_fields():
    """run_prediction zero-match case: top_k_count=0, null prices, trend='unknown'."""
    base = datetime(2025, 5, 1, 0, 0)
    rows = []
    for i in range(24):
        t = (base + timedelta(hours=i)).strftime("%Y-%m-%d %H:%M")
        rows.append({"time": t, "open": 2000.0, "high": 2010.0, "low": 1990.0, "close": 2000.0})
    df = pd.DataFrame(rows)
    query_df = df.copy()

    from firestore_config import DEFAULT_PARAMS

    with patch("daily_predict.find_top_matches", side_effect=ValueError("No historical matches found...")):
        prediction = run_prediction(query_df, DEFAULT_PARAMS, df)

    assert prediction["top_k_count"] == 0
    assert prediction["projected_high"] is None
    assert prediction["projected_low"] is None
    assert prediction["projected_median"] is None
    assert prediction["trend"] == "unknown"
    # Field set must still exactly match contract (minus nullability)
    assert set(prediction.keys()) == FIRESTORE_PREDICTION_FIELDS
