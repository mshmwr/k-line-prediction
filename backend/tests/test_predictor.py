# backend/tests/test_predictor.py
import os
import sys

from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from mock_data import generate_mock_history
from models import MatchCase, OHLCBar
from predictor import MA_WINDOW, compute_stats, find_top_matches, pearson_correlation, z_score_normalize


client = TestClient(app)


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


def _build_segment(start_price: float, count: int, step: float, start_index: int) -> list[dict]:
    bars = []
    price = start_price
    for i in range(count):
        open_ = price
        close = open_ + step + (0.2 if i % 2 == 0 else -0.1)
        high = max(open_, close) + 1.5
        low = min(open_, close) - 1.5
        bars.append({
            'open': round(open_, 2),
            'high': round(high, 2),
            'low': round(low, 2),
            'close': round(close, 2),
            'date': f'2024-01-{start_index + i:03d}',
        })
        price = close
    return bars


def test_find_top_matches_uses_history_backfill_for_short_queries():
    history = _build_segment(100.0, 220, 1.0, 1)
    input_slice = history[120:150]
    input_bars = [OHLCBar(open=b['open'], high=b['high'], low=b['low'], close=b['close'], time=b['date']) for b in input_slice]
    matches = find_top_matches(input_bars, future_n=5, history=history, timeframe='1H')
    assert matches


def test_find_top_matches_filters_opposite_ma99_direction():
    up_history = _build_segment(100.0, 160, 0.9, 1)
    down_history = _build_segment(500.0, 160, -1.0, 161)
    history = up_history + down_history
    input_slice = up_history[110:140]
    input_bars = [OHLCBar(open=b['open'], high=b['high'], low=b['low'], close=b['close'], time=b['date']) for b in input_slice]
    matches = find_top_matches(input_bars, future_n=5, history=history, timeframe='1H')
    assert matches
    assert all(match.start_date < '2024-01-161' for match in matches)


def test_find_top_matches_allows_override_without_time_alignment():
    history = _build_segment(100.0, 220, 0.8, 1)
    input_bars = [
        OHLCBar(open=200 + i, high=202 + i, low=198 + i, close=201 + i, time='')
        for i in range(20)
    ]
    matches = find_top_matches(input_bars, future_n=5, history=history, timeframe='1H', ma99_trend_override='up')
    assert matches


def test_compute_stats_returns_extreme_order_suggestions():
    matches = []
    futures = [
        [
            OHLCBar(open=2050, high=2150, low=2020, close=2100, time='2024-02-01 01:00'),
            OHLCBar(open=2100, high=2175, low=2010, close=2125, time='2024-02-01 02:00'),
        ],
        [
            OHLCBar(open=1980, high=2090, low=1900, close=1950, time='2024-02-02 01:00'),
            OHLCBar(open=1950, high=2080, low=1890, close=1960, time='2024-02-02 02:00'),
        ],
    ]
    for i, future_bars in enumerate(futures):
        matches.append(MatchCase(
            id=str(i),
            correlation=0.9,
            historical_ohlc=[OHLCBar(open=2000, high=2010, low=1990, close=2000, time='')],
            future_ohlc=future_bars,
            start_date='2022-01-01',
            end_date='2022-01-02',
        ))
    stats = compute_stats(matches, current_close=2000.0)
    assert stats.highest.price == 2127.5
    assert stats.second_highest.price == 2120.0
    assert stats.lowest.price == 1950.0
    assert stats.second_lowest.price == 1960.0
    assert stats.highest.occurrence_window == 'Hour +2'
    assert stats.lowest.historical_time == 'Consensus'


def test_predict_endpoint_happy_path():
    payload = {
        "ohlc_data": [
            {"open": 2000 + i, "high": 2010 + i, "low": 1990 + i, "close": 2005 + i}
            for i in range(MA_WINDOW + 1)
        ],
        "selected_ids": [],
        "timeframe": "1H",
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["matches"]) == 10
    assert "stats" in data
    assert "highest" in data["stats"]


def test_predict_endpoint_accepts_short_input_with_override():
    payload = {
        "ohlc_data": [
            {"open": 2000 + i, "high": 2010 + i, "low": 1990 + i, "close": 2005 + i, "time": ""}
            for i in range(20)
        ],
        "selected_ids": [],
        "timeframe": "1H",
        "ma99_trend_override": "up",
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200


def test_predict_endpoint_requires_alignment_or_override_for_short_input():
    payload = {
        "ohlc_data": [
            {"open": 2000 + i, "high": 2010 + i, "low": 1990 + i, "close": 2005 + i, "time": ""}
            for i in range(20)
        ],
        "selected_ids": [],
        "timeframe": "1H",
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 422
    assert "MA99" in res.text
