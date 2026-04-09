# backend/tests/test_predictor.py
import os
import sys

from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import main
from main import app
from mock_data import MOCK_HISTORY, generate_mock_history
from models import MatchCase, OHLCBar
from predictor import MA_WINDOW, compute_stats, find_top_matches, pearson_correlation, z_score_normalize


client = TestClient(app)


def _use_mock_histories():
    main._history_1h = list(MOCK_HISTORY)
    main._history_1d = list(MOCK_HISTORY)


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
    _use_mock_histories()
    payload = {
        "ohlc_data": [
            {
                "open": 2000 + i,
                "high": 2010 + i,
                "low": 1990 + i,
                "close": 2005 + i,
                "time": MOCK_HISTORY[120 + i]["date"],
            }
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
    assert "consensus_forecast_1h" in data["stats"]
    assert "consensus_forecast_1d" in data["stats"]
    assert "query_ma99_1d" in data


def test_predict_endpoint_accepts_short_input_with_override():
    _use_mock_histories()
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
    _use_mock_histories()
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


# ──────────────────────────────────────────────
# Task 2: _compute_ma99_for_window, _extract_ma99_gap, get_prefix_bars
# ──────────────────────────────────────────────

from predictor import _compute_ma99_for_window, _extract_ma99_gap, get_prefix_bars
from models import Ma99Gap


def _make_bars(closes: list, with_time: bool = False) -> list:
    """Build minimal OHLCBar list from close prices."""
    return [
        OHLCBar(
            open=c, high=c + 1, low=c - 1, close=c,
            time=f"2024-01-{i+1:02d} 00:00" if with_time else "",
        )
        for i, c in enumerate(closes)
    ]


def _make_dict_bars(closes: list) -> list:
    """Build history-style dict bars."""
    return [
        {"open": c, "high": c + 1, "low": c - 1, "close": c, "date": f"2024-01-{i+1:04d} 00:00"}
        for i, c in enumerate(closes)
    ]


# --- _compute_ma99_for_window ---

def test_compute_ma99_full_prefix_returns_all_values():
    """98 prefix bars + 5 window bars → 5 valid float values."""
    prefix = _make_dict_bars([100.0] * 98)
    window = _make_bars([101.0, 102.0, 103.0, 104.0, 105.0])
    result = _compute_ma99_for_window(window, prefix)
    assert len(result) == 5
    assert all(v is not None for v in result)
    assert all(isinstance(v, float) for v in result)


def test_compute_ma99_empty_prefix_short_window_returns_all_none():
    """0 prefix + 5 window bars (< 99 total) → all None."""
    result = _compute_ma99_for_window(_make_bars([100.0] * 5), [])
    assert result == [None] * 5


def test_compute_ma99_partial_prefix_partial_nones():
    """60 prefix + 48 window: first 38 bars → None, bars 38~47 → float."""
    prefix = _make_dict_bars([100.0] * 60)
    window = _make_bars([101.0] * 48)
    result = _compute_ma99_for_window(window, prefix)
    assert len(result) == 48
    # 60 + j - 98 >= 0 → j >= 38; so result[37] is None, result[38] is not None
    assert result[37] is None
    assert result[38] is not None


def test_compute_ma99_99_total_gives_one_valid():
    """98 prefix + 1 window = exactly 99 → 1 valid value."""
    prefix = _make_dict_bars([100.0] * 98)
    window = _make_bars([101.0])
    result = _compute_ma99_for_window(window, prefix)
    assert len(result) == 1
    assert result[0] is not None


# --- _extract_ma99_gap ---

def test_extract_ma99_gap_no_nones_returns_none():
    bars = _make_bars([100.0] * 5, with_time=True)
    ma99 = [100.0] * 5
    assert _extract_ma99_gap(bars, ma99) is None


def test_extract_ma99_gap_all_nones_with_time_returns_gap():
    bars = _make_bars([100.0] * 5, with_time=True)
    ma99 = [None] * 5
    gap = _extract_ma99_gap(bars, ma99)
    assert gap is not None
    assert gap.from_date == "2024-01-01 00:00"
    assert gap.to_date == "2024-01-05 00:00"


def test_extract_ma99_gap_partial_nones_gap_matches_none_range():
    bars = _make_bars([100.0] * 5, with_time=True)
    ma99 = [None, None, None, 100.5, 100.6]
    gap = _extract_ma99_gap(bars, ma99)
    assert gap is not None
    assert gap.from_date == "2024-01-01 00:00"
    assert gap.to_date == "2024-01-03 00:00"


def test_extract_ma99_gap_no_time_returns_none():
    """Bars without timestamps → no gap (can't report date range)."""
    bars = _make_bars([100.0] * 5, with_time=False)
    ma99 = [None] * 5
    assert _extract_ma99_gap(bars, ma99) is None


# --- get_prefix_bars ---

def test_get_prefix_bars_returns_bars_before_time():
    history = _make_dict_bars([100.0] * 10)
    # history[5]["date"] = "2024-01-0006 00:00" → expect 5 bars before it
    prefix = get_prefix_bars(history, history[5]["date"], "1H")
    assert len(prefix) == 5


def test_get_prefix_bars_time_not_in_history_returns_empty():
    history = _make_dict_bars([100.0] * 5)
    prefix = get_prefix_bars(history, "2099-01-01 00:00", "1H")
    assert prefix == []


def test_get_prefix_bars_empty_time_returns_empty():
    history = _make_dict_bars([100.0] * 5)
    assert get_prefix_bars(history, "", "1H") == []


# ──────────────────────────────────────────────
# Task 3: find_top_matches includes historical_ma99 / future_ma99
# ──────────────────────────────────────────────

def test_find_top_matches_includes_historical_ma99():
    """Matches 應包含 historical_ma99，長度等於 historical_ohlc 長度。"""
    history = _build_segment(100.0, 300, 0.8, 1)
    input_slice = history[150:180]
    input_bars = [OHLCBar(open=b['open'], high=b['high'], low=b['low'], close=b['close'], time=b['date']) for b in input_slice]
    matches = find_top_matches(input_bars, future_n=10, history=history, timeframe='1H')
    assert matches
    for match in matches:
        assert len(match.historical_ma99) == len(match.historical_ohlc)
        assert len(match.future_ma99) == len(match.future_ohlc)


def test_find_top_matches_ma99_values_are_float_or_none():
    """MA99 值應為 float 或 None，不得為其他型別。"""
    history = _build_segment(100.0, 300, 0.8, 1)
    input_slice = history[150:165]
    input_bars = [OHLCBar(open=b['open'], high=b['high'], low=b['low'], close=b['close'], time=b['date']) for b in input_slice]
    matches = find_top_matches(input_bars, future_n=5, history=history, timeframe='1H')
    for match in matches:
        for v in match.historical_ma99 + match.future_ma99:
            assert v is None or isinstance(v, float)


# ──────────────────────────────────────────────
# Task 4: predict endpoint returns query_ma99 / query_ma99_gap
# ──────────────────────────────────────────────

def test_predict_endpoint_returns_query_ma99():
    """predict endpoint 應回傳 1H/1D query_ma99 陣列。"""
    _use_mock_histories()
    payload = {
        "ohlc_data": [
            {
                "open": 2000 + i,
                "high": 2010 + i,
                "low": 1990 + i,
                "close": 2005 + i,
                "time": MOCK_HISTORY[120 + i]["date"],
            }
            for i in range(MA_WINDOW + 1)
        ],
        "selected_ids": [],
        "timeframe": "1H",
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "query_ma99_1h" in data
    assert "query_ma99_1d" in data
    assert len(data["query_ma99_1h"]) == MA_WINDOW + 1
    assert "query_ma99_gap_1h" in data
    assert isinstance(data["query_ma99_1d"], list)


def test_predict_endpoint_matches_include_ma99():
    """每個 match 應包含 historical_ma99 和 future_ma99。"""
    _use_mock_histories()
    payload = {
        "ohlc_data": [
            {
                "open": 2000 + i,
                "high": 2010 + i,
                "low": 1990 + i,
                "close": 2005 + i,
                "time": MOCK_HISTORY[120 + i]["date"],
            }
            for i in range(MA_WINDOW + 1)
        ],
        "selected_ids": [],
        "timeframe": "1H",
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    for match in data["matches"]:
        assert "historical_ma99" in match
        assert "future_ma99" in match
        assert "historical_ma99_1d" in match
        assert "future_ma99_1d" in match
        assert len(match["historical_ma99"]) == len(match["historical_ohlc"])
        assert len(match["future_ma99"]) == len(match["future_ohlc"])


# ──────────────────────────────────────────────
# Task 2: /api/merge-and-compute-ma99 endpoint
# ──────────────────────────────────────────────

def _make_endpoint_bars(count: int, start_date: str = "2022-01-01") -> list[dict]:
    """Generate `count` simple ascending bars from start_date (hourly)."""
    from datetime import datetime, timedelta
    bars = []
    base = datetime.fromisoformat(start_date)
    price = 1000.0
    for i in range(count):
        dt = base + timedelta(hours=i)
        close = price + i * 0.5
        bars.append({
            'date': dt.strftime('%Y-%m-%d %H:%M'),
            'open': price + i * 0.5,
            'high': price + i * 0.5 + 2,
            'low': price + i * 0.5 - 2,
            'close': close,
        })
    return bars


def test_merge_and_compute_ma99_returns_query_ma99():
    """Endpoint returns query_ma99 array with same length as input."""
    _use_mock_histories()
    bars = _make_endpoint_bars(24, "2024-03-01")
    payload = {
        "ohlc_data": [
            {"open": b["open"], "high": b["high"], "low": b["low"],
             "close": b["close"], "time": b["date"]}
            for b in bars
        ],
        "timeframe": "1H",
    }
    res = client.post("/api/merge-and-compute-ma99", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "query_ma99_1h" in data
    assert len(data["query_ma99_1h"]) == 24
    assert "query_ma99_1d" in data


def test_merge_and_compute_ma99_gap_when_no_prefix():
    """When bars use very early dates (no prefix in history), query_ma99_gap is not None."""
    _use_mock_histories()
    # Use very early dates (1900s) → no prefix bars exist → MA99 cannot be calculated
    # bar count (10) < MA_WINDOW (99) → all MA99 values are None → gap is reported
    bars = _make_endpoint_bars(10, "1900-01-01")
    payload = {
        "ohlc_data": [
            {"open": b["open"], "high": b["high"], "low": b["low"],
             "close": b["close"], "time": b["date"]}
            for b in bars
        ],
        "timeframe": "1H",
    }
    res = client.post("/api/merge-and-compute-ma99", json=payload)
    assert res.status_code == 200
    data = res.json()
    # With only 10 bars and no prefix, MA99 gap should exist (< 99 bars available)
    assert data["query_ma99_gap_1h"] is not None


def test_merge_and_compute_ma99_empty_input():
    """Endpoint handles ohlc_data=[] gracefully: returns 200 with empty query_ma99."""
    _use_mock_histories()
    res = client.post("/api/merge-and-compute-ma99", json={"ohlc_data": [], "timeframe": "1H"})
    assert res.status_code == 200
    data = res.json()
    assert data["query_ma99_1h"] == []
    assert data["query_ma99_gap_1h"] is None


def test_make_endpoint_bars_count_over_99_produces_valid_dates():
    """_make_endpoint_bars with count > 99 generates dates spanning multiple days correctly."""
    bars = _make_endpoint_bars(110, "2022-01-01")
    assert len(bars) == 110
    # Bar at index 99 should be 2022-01-05 03:00 (99 hours after 2022-01-01 00:00)
    from datetime import datetime
    first_dt = datetime.fromisoformat(bars[0]['date'])
    last_dt = datetime.fromisoformat(bars[-1]['date'])
    assert last_dt > first_dt
    # All dates should parse without error and be unique
    dates = [b['date'] for b in bars]
    assert len(set(dates)) == 110


def test_extract_ma99_gap_ignores_isolated_none_in_middle():
    """_extract_ma99_gap only reports prefix Nones; isolated Nones in the middle are ignored."""
    from predictor import _extract_ma99_gap
    # Simulate: first bar has MA (not None), middle has isolated None, rest have values
    bars = [{'date': f'2024-01-0{i+1} 00:00'} for i in range(5)]
    ma99 = [1800.0, None, 1802.0, 1803.0, 1804.0]  # isolated None at index 1
    gap = _extract_ma99_gap(bars, ma99)
    assert gap is None  # no prefix gap → should return None
