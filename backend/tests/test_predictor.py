# backend/tests/test_predictor.py
import os
import sys

from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from mock_data import generate_mock_history
from models import MatchCase, OHLCBar
from predictor import MA_WINDOW, compute_stats, find_top_matches, pearson_correlation, z_score_normalize
from predictor import _classify_trend_by_pearson, _fetch_30d_ma_series


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


def _make_real_date_1d_bars(n: int, start: str = "2020-01-01", step: float = 1.0) -> list:
    from datetime import datetime, timedelta
    base = datetime.fromisoformat(start)
    bars, price = [], 1000.0
    for i in range(n):
        d = (base + timedelta(days=i)).strftime('%Y-%m-%d')
        bars.append({'date': d, 'open': price, 'high': price+1, 'low': price-1, 'close': price + step*i})
    return bars


def test_find_top_matches_filters_opposite_ma99_direction():
    up_bars = _make_real_date_1d_bars(200, "2020-01-01", step=1.0)
    down_bars = _make_real_date_1d_bars(200, "2020-07-19", step=-1.0)
    ma_history = up_bars + down_bars
    input_slice = up_bars[180:190]
    input_bars = [OHLCBar(open=b['open'], high=b['high'], low=b['low'],
                          close=b['close'], time=b['date']) for b in input_slice]
    matches = find_top_matches(input_bars, future_n=5, history=ma_history,
                               timeframe='1D', ma_history=ma_history)
    assert matches
    assert all(m.start_date < "2020-07-19" for m in matches)



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
    # Use bars from MOCK_HISTORY (seed=99, 500 daily bars from 2022-01-01) so
    # _fetch_30d_ma_series can find a valid 30-day MA99 anchor in _history_1d.
    history = generate_mock_history(seed=99)
    sample = history[250:256]  # 6 bars, anchor has 250 prior bars → ample for 30d MA99
    payload = {
        "ohlc_data": [
            {"open": b["open"], "high": b["high"], "low": b["low"],
             "close": b["close"], "time": b["date"]}
            for b in sample
        ],
        "selected_ids": [],
        "timeframe": "1D",
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["matches"]) == 10
    assert "stats" in data
    assert "highest" in data["stats"]



def test_predict_endpoint_requires_valid_date_for_ma99_trend():
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
    """predict endpoint 應回傳 query_ma99 陣列，長度等於輸入的 bar 數。"""
    history = generate_mock_history(seed=99)
    sample = history[250:256]
    payload = {
        "ohlc_data": [
            {"open": b["open"], "high": b["high"], "low": b["low"],
             "close": b["close"], "time": b["date"]}
            for b in sample
        ],
        "selected_ids": [],
        "timeframe": "1D",
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "query_ma99_1d" in data
    assert len(data["query_ma99_1d"]) == len(sample)
    assert data["query_ma99_gap_1d"] is None


def test_predict_endpoint_matches_include_ma99():
    """每個 match 應包含 historical_ma99 和 future_ma99。"""
    history = generate_mock_history(seed=99)
    sample = history[250:256]
    payload = {
        "ohlc_data": [
            {"open": b["open"], "high": b["high"], "low": b["low"],
             "close": b["close"], "time": b["date"]}
            for b in sample
        ],
        "selected_ids": [],
        "timeframe": "1D",
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    for match in data["matches"]:
        assert "historical_ma99" in match
        assert "future_ma99" in match
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


def test_merge_and_compute_ma99_gap_when_no_prefix():
    """When bars use very early dates (no prefix in history), query_ma99_gap is not None."""
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


# ──────────────────────────────────────────────
# Phase 1 新增：_classify_trend_by_pearson 單元測試
# ──────────────────────────────────────────────

def test_classify_trend_strongly_up_returns_1():
    series = [100.0 + i for i in range(30)]
    assert _classify_trend_by_pearson(series) == 1


def test_classify_trend_strongly_down_returns_neg1():
    series = [100.0 - i for i in range(30)]
    assert _classify_trend_by_pearson(series) == -1


def test_classify_trend_flat_oscillating_returns_0():
    import math
    series = [100.0 + math.sin(i) for i in range(30)]
    assert _classify_trend_by_pearson(series) == 0


def test_classify_trend_empty_returns_0():
    assert _classify_trend_by_pearson([]) == 0


# ──────────────────────────────────────────────
# AC-1D-2: _aggregate_bars_to_1d 單元測試
# ──────────────────────────────────────────────

from predictor import _aggregate_bars_to_1d


def _make_1h_bars(day: str, hours: int, base_price: float = 1000.0) -> list:
    """Generate `hours` 1H bars for a single calendar day starting at 00:00."""
    from datetime import datetime, timedelta
    bars = []
    base = datetime.fromisoformat(f"{day} 00:00")
    for i in range(hours):
        dt = base + timedelta(hours=i)
        open_ = base_price + i
        bars.append({
            'date': dt.strftime('%Y-%m-%d %H:%M'),
            'open': open_,
            'high': open_ + 5,
            'low': open_ - 5,
            'close': open_ + 1,
        })
    return bars


def test_aggregate_bars_to_1d_empty_input():
    """AC-1D-2: empty input → empty output."""
    assert _aggregate_bars_to_1d([]) == []


def test_aggregate_bars_to_1d_single_day_open_high_low_close():
    """AC-1D-2: 24 1H bars on one day aggregate correctly."""
    bars = _make_1h_bars('2024-01-01', 24)
    result = _aggregate_bars_to_1d(bars)
    assert len(result) == 1
    day = result[0]
    assert day['date'] == '2024-01-01'
    assert day['open'] == bars[0]['open']          # first bar open
    assert day['high'] == max(b['high'] for b in bars)
    assert day['low'] == min(b['low'] for b in bars)
    assert day['close'] == bars[-1]['close']        # last bar close


def test_aggregate_bars_to_1d_multi_day():
    """AC-1D-2: bars spanning 3 days produce 3 daily bars in order."""
    day1 = _make_1h_bars('2024-01-01', 24, base_price=1000.0)
    day2 = _make_1h_bars('2024-01-02', 24, base_price=2000.0)
    day3 = _make_1h_bars('2024-01-03', 24, base_price=3000.0)
    result = _aggregate_bars_to_1d(day1 + day2 + day3)
    assert len(result) == 3
    assert result[0]['date'] == '2024-01-01'
    assert result[1]['date'] == '2024-01-02'
    assert result[2]['date'] == '2024-01-03'
    assert result[0]['open'] == 1000.0
    assert result[1]['open'] == 2000.0
    assert result[2]['open'] == 3000.0


def test_aggregate_bars_to_1d_skips_missing_date():
    """AC-1D-2: bars with empty date are skipped, valid bars still aggregate."""
    bars = _make_1h_bars('2024-01-01', 3)
    bars.insert(1, {'date': '', 'open': 9999, 'high': 9999, 'low': 9999, 'close': 9999})
    result = _aggregate_bars_to_1d(bars)
    assert len(result) == 1
    assert result[0]['high'] != 9999  # the bad bar must not affect high


# ──────────────────────────────────────────────
# AC-1D-3: predict endpoint populates _1d fields
# ──────────────────────────────────────────────

def test_predict_endpoint_matches_include_1d_fields():
    """AC-1D-3: each match must have non-empty historical_ohlc_1d and future_ohlc_1d."""
    history = generate_mock_history(seed=99)
    sample = history[250:256]
    payload = {
        "ohlc_data": [
            {"open": b["open"], "high": b["high"], "low": b["low"],
             "close": b["close"], "time": b["date"]}
            for b in sample
        ],
        "selected_ids": [],
        "timeframe": "1H",
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    for match in data["matches"]:
        assert "historical_ohlc_1d" in match
        assert "future_ohlc_1d" in match
        assert len(match["historical_ohlc_1d"]) > 0, "historical_ohlc_1d must not be empty"
        assert len(match["future_ohlc_1d"]) > 0, "future_ohlc_1d must not be empty"


def test_classify_trend_single_value_returns_0():
    assert _classify_trend_by_pearson([100.0]) == 0


# ──────────────────────────────────────────────
# Phase 1 新增：_fetch_30d_ma_series 單元測試
# ──────────────────────────────────────────────

def test_fetch_30d_ma_series_sufficient_returns_30_points():
    history = _make_real_date_1d_bars(200)
    anchor = history[150]['date']
    result = _fetch_30d_ma_series(anchor, history)
    assert len(result) == 30
    assert all(isinstance(v, float) for v in result)


def test_fetch_30d_ma_series_insufficient_prefix_returns_empty():
    history = _make_real_date_1d_bars(50)
    result = _fetch_30d_ma_series(history[-1]['date'], history)
    assert result == []


def test_fetch_30d_ma_series_anchor_not_in_history_returns_empty():
    history = _make_real_date_1d_bars(200)
    assert _fetch_30d_ma_series("1900-01-01", history) == []


def test_fetch_30d_ma_series_empty_inputs_return_empty():
    assert _fetch_30d_ma_series("", []) == []
    assert _fetch_30d_ma_series("2024-01-01", []) == []


def test_fetch_30d_ma_series_below_floor_returns_empty():
    """
    AC-051-10 B1 boundary unit test: at exactly DEFAULT_PARAMS.ma_trend_window_days
    + MA_WINDOW - 1 = 128 bars (one short of the post-Phase-4 floor),
    `_fetch_30d_ma_series` must return []. Pins the gate at predictor.py:156
    at the closest layer.
    """
    from firestore_config import DEFAULT_PARAMS
    floor = DEFAULT_PARAMS.ma_trend_window_days + MA_WINDOW
    history = _make_real_date_1d_bars(floor - 1)  # 128 bars
    result = _fetch_30d_ma_series(history[-1]['date'], history)
    assert result == [], (
        f"expected [] at {floor - 1} bars (one short of floor {floor}); got "
        f"{len(result)} floats. Gate at predictor.py:156 likely regressed to "
        "the pre-Phase-4 `< MA_WINDOW` form."
    )


def test_fetch_30d_ma_series_at_floor_returns_30_points():
    """
    AC-051-10 B1 boundary unit test: at exactly DEFAULT_PARAMS.ma_trend_window_days
    + MA_WINDOW = 129 bars, `_fetch_30d_ma_series` must return 30 floats. Pairs
    with test_fetch_30d_ma_series_below_floor_returns_empty to lock both sides
    of the threshold.
    """
    from firestore_config import DEFAULT_PARAMS
    floor = DEFAULT_PARAMS.ma_trend_window_days + MA_WINDOW
    history = _make_real_date_1d_bars(floor)  # 129 bars
    result = _fetch_30d_ma_series(history[-1]['date'], history)
    assert len(result) == 30, (
        f"expected 30 MA points at floor ({floor} bars); got {len(result)}. "
        "Gate at predictor.py:156 may be over-tight (using > instead of <) or "
        "DEFAULT_PARAMS.ma_trend_window_days may have drifted."
    )
    assert all(isinstance(v, float) for v in result)


def test_fetch_30d_ma_series_above_floor_returns_30_points():
    """
    AC-051-10 B1 boundary unit test: at floor + 1 = 130 bars, returns 30
    floats (a sanity check that going past the floor doesn't change shape).
    """
    from firestore_config import DEFAULT_PARAMS
    floor = DEFAULT_PARAMS.ma_trend_window_days + MA_WINDOW
    history = _make_real_date_1d_bars(floor + 1)  # 130 bars
    result = _fetch_30d_ma_series(history[-1]['date'], history)
    assert len(result) == 30
    assert all(isinstance(v, float) for v in result)


# -----------------------------------------------------------------------------
# K-013 Contract tests — shared fixture between backend compute_stats and
# frontend computeStatsFromMatches. See:
#   - docs/designs/K-013-consensus-stats-ssot.md §3 and §7
#   - frontend/src/__tests__/statsComputation.test.ts (mirror)
#   - backend/tests/fixtures/generate_stats_contract_cases.py (generator)
#
# When compute_stats or _projected_future_bars changes, rerun the generator:
#   cd backend && python3 tests/fixtures/generate_stats_contract_cases.py
# Then verify both this file and the frontend test pass.
# -----------------------------------------------------------------------------

import json
import math
from pathlib import Path

import pytest

_FIXTURE_PATH = Path(__file__).parent / "fixtures" / "stats_contract_cases.json"


def _load_contract_cases():
    with _FIXTURE_PATH.open() as fh:
        return json.load(fh)


def _build_match_from_snake(raw: dict) -> MatchCase:
    return MatchCase(
        id=raw["id"],
        correlation=raw["correlation"],
        historical_ohlc=[OHLCBar(**bar) for bar in raw["historical_ohlc"]],
        future_ohlc=[OHLCBar(**bar) for bar in raw["future_ohlc"]],
        historical_ohlc_1d=[OHLCBar(**bar) for bar in raw.get("historical_ohlc_1d", [])],
        future_ohlc_1d=[OHLCBar(**bar) for bar in raw.get("future_ohlc_1d", [])],
        start_date=raw["start_date"],
        end_date=raw["end_date"],
        historical_ma99=raw.get("historical_ma99", []),
        future_ma99=raw.get("future_ma99", []),
        historical_ma99_1d=raw.get("historical_ma99_1d", []),
        future_ma99_1d=raw.get("future_ma99_1d", []),
    )


_CONTRACT_CASES = _load_contract_cases()


@pytest.mark.parametrize(
    "case",
    _CONTRACT_CASES,
    ids=[c["name"] for c in _CONTRACT_CASES],
)
def test_contract_compute_stats_matches_fixture(case):
    matches = [_build_match_from_snake(m) for m in case["input"]["matches"]]
    current_close = case["input"]["current_close"]
    timeframe = case["input"]["timeframe"]

    actual = compute_stats(matches, current_close, timeframe)
    expected = case["expected"]

    # Each OrderSuggestion compared field-by-field so failure output points
    # at the exact bucket that drifted.
    for bucket in ("highest", "second_highest", "second_lowest", "lowest"):
        exp = expected[bucket]
        act = getattr(actual, bucket)
        assert act.label == exp["label"], f"[{case['name']}] {bucket}.label"
        assert math.isclose(act.price, exp["price"], rel_tol=1e-6, abs_tol=1e-6), (
            f"[{case['name']}] {bucket}.price: actual={act.price} expected={exp['price']}"
        )
        assert math.isclose(act.pct, exp["pct"], rel_tol=1e-6, abs_tol=1e-6), (
            f"[{case['name']}] {bucket}.pct: actual={act.pct} expected={exp['pct']}"
        )
        assert act.occurrence_bar == exp["occurrence_bar"], (
            f"[{case['name']}] {bucket}.occurrence_bar"
        )
        assert act.occurrence_window == exp["occurrence_window"], (
            f"[{case['name']}] {bucket}.occurrence_window"
        )
        assert act.historical_time == exp["historical_time"], (
            f"[{case['name']}] {bucket}.historical_time"
        )

    assert math.isclose(actual.win_rate, expected["win_rate"], rel_tol=1e-6, abs_tol=1e-6), (
        f"[{case['name']}] win_rate"
    )
    assert math.isclose(
        actual.mean_correlation, expected["mean_correlation"], rel_tol=1e-6, abs_tol=1e-6
    ), f"[{case['name']}] mean_correlation"

    # consensus_forecast_1h/1d are pre-existing always-[] output; the fixture
    # locks this invariant alongside the main stats. See SQ-013-01 / KG-013-01.
    assert actual.consensus_forecast_1h == expected["consensus_forecast_1h"], (
        f"[{case['name']}] consensus_forecast_1h: expected {expected['consensus_forecast_1h']}"
    )
    assert actual.consensus_forecast_1d == expected["consensus_forecast_1d"], (
        f"[{case['name']}] consensus_forecast_1d: expected {expected['consensus_forecast_1d']}"
    )


def test_contract_fixture_has_minimum_case_coverage():
    """Lock AC-013-FIXTURE: fixture must cover 3 scenarios by design."""
    names = {c["name"] for c in _CONTRACT_CASES}
    assert {
        "all_matches_full_set",
        "subset_deselect_one",
        "single_match_two_bars",
    } <= names, f"missing required contract cases; got {names}"


def test_contract_fixture_future_ohlc_respects_realism_rule():
    """Each case's matches must have future_ohlc with >= 2 bars (CLAUDE.md
    Test Data Realism); mirrors the Playwright mock realism rule."""
    for case in _CONTRACT_CASES:
        for match in case["input"]["matches"]:
            assert len(match["future_ohlc"]) >= 2, (
                f"[{case['name']}] match {match['id']} has fewer than 2 future bars"
            )
