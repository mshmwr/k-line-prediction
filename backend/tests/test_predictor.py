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
