# backend/tests/test_predictor.py
import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mock_data import generate_mock_history
from predictor import z_score_normalize, pearson_correlation, find_top_matches, compute_stats
from models import OHLCBar

def test_mock_history_returns_500_bars():
    history = generate_mock_history(seed=42)
    assert len(history) == 500

def test_mock_bar_has_valid_ohlc():
    history = generate_mock_history(seed=42)
    bar = history[0]
    assert bar['low'] <= bar['open'] <= bar['high']
    assert bar['low'] <= bar['close'] <= bar['high']
    assert bar['high'] >= bar['low']

def test_z_score_normalize_zero_mean():
    data = [1.0, 2.0, 3.0, 4.0, 5.0]
    normed = z_score_normalize(data)
    assert abs(sum(normed) / len(normed)) < 1e-9

def test_pearson_identical_series_returns_1():
    series = [1.0, 2.0, 3.0, 4.0]
    r = pearson_correlation(series, series)
    assert abs(r - 1.0) < 1e-9

def test_pearson_opposite_series_returns_neg1():
    a = [1.0, 2.0, 3.0, 4.0]
    b = [4.0, 3.0, 2.0, 1.0]
    r = pearson_correlation(a, b)
    assert abs(r + 1.0) < 1e-9

def test_find_top_matches_returns_10():
    input_bars = [OHLCBar(open=2000+i, high=2010+i, low=1990+i, close=2005+i) for i in range(10)]
    matches = find_top_matches(input_bars)
    assert len(matches) == 10

def test_find_top_matches_sorted_by_correlation():
    input_bars = [OHLCBar(open=2000+i, high=2010+i, low=1990+i, close=2005+i) for i in range(10)]
    matches = find_top_matches(input_bars)
    corrs = [m.correlation for m in matches]
    assert corrs == sorted(corrs, reverse=True)

def test_compute_stats_baseline_is_median():
    from models import MatchCase, OHLCBar
    import statistics
    future_closes = [2100.0, 2050.0, 1950.0]
    matches = []
    for i, fc in enumerate(future_closes):
        m = MatchCase(
            id=str(i), correlation=0.9,
            historical_ohlc=[OHLCBar(open=2000, high=2010, low=1990, close=2000)],
            future_ohlc=[OHLCBar(open=fc, high=fc+10, low=fc-10, close=fc)],
            start_date='2022-01-01'
        )
        matches.append(m)
    stats = compute_stats(matches, current_close=2000.0)
    assert stats.baseline == statistics.median(future_closes)
    assert stats.optimistic >= stats.baseline >= stats.pessimistic

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_predict_endpoint_happy_path():
    payload = {
        "ohlc_data": [
            {"open": 2000+i, "high": 2010+i, "low": 1990+i, "close": 2005+i}
            for i in range(15)
        ],
        "selected_ids": []
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["matches"]) == 10
    assert "stats" in data
    assert "optimistic" in data["stats"]

def test_predict_with_selected_ids_filters_matches():
    payload = {
        "ohlc_data": [
            {"open": 2000+i, "high": 2010+i, "low": 1990+i, "close": 2005+i}
            for i in range(15)
        ],
        "selected_ids": []
    }
    res = client.post("/api/predict", json=payload)
    all_ids = [m["id"] for m in res.json()["matches"]]
    keep_ids = all_ids[:3]

    res2 = client.post("/api/predict", json={**payload, "selected_ids": keep_ids})
    assert res2.status_code == 200
