# backend/predictor.py
from __future__ import annotations

from datetime import datetime, timedelta
import numpy as np
import statistics
from typing import List, Optional, Tuple

from models import ForecastBar, MatchCase, OHLCBar, OrderSuggestion, PredictStats
from mock_data import MOCK_HISTORY

MA_WINDOW = 99
MIN_BARS_FOR_MA_TREND = 2
FUTURE_LOOKAHEAD_BARS = 72


def z_score_normalize(series: List[float]) -> List[float]:
    arr = np.array(series, dtype=float)
    std = arr.std()
    if std == 0:
        return [0.0] * len(series)
    return ((arr - arr.mean()) / std).tolist()


def pearson_correlation(a: List[float], b: List[float]) -> float:
    if len(a) < 2 or len(b) < 2:
        return 0.0
    corr = float(np.corrcoef(a, b)[0, 1])
    if np.isnan(corr):
        return 0.0
    return corr


def _extract_closes(bars) -> List[float]:
    return [b['close'] if isinstance(b, dict) else b.close for b in bars]


def _bar_value(bar, key: str) -> float:
    return float(bar[key] if isinstance(bar, dict) else getattr(bar, key))


def _bar_time(bar) -> str:
    if isinstance(bar, dict):
        return str(bar.get('date') or bar.get('time') or '')
    return str(getattr(bar, 'time', '') or '')


def _safe_pct(numerator: float, denominator: float) -> float:
    if denominator == 0:
        return 0.0
    return numerator / denominator


def _rolling_mean(values: List[float], window: int) -> List[float]:
    if len(values) < window:
        return []
    arr = np.array(values, dtype=float)
    kernel = np.ones(window, dtype=float) / window
    return np.convolve(arr, kernel, mode='valid').tolist()


def _ma_trend_series(bars, window: int = MA_WINDOW) -> List[float]:
    closes = _extract_closes(bars)
    return _rolling_mean(closes, window)


def _normalize_time(raw: str, timeframe: str) -> str:
    raw = (raw or '').strip()
    if timeframe == '1D':
        return raw[:10]
    return raw[:16]


def _history_time_index(history, timeframe: str):
    return {
        _normalize_time(bar.get('date', ''), timeframe): idx
        for idx, bar in enumerate(history)
    }


def _aligned_ma_series(window_bars, preceding_bars) -> List[float]:
    combined = list(preceding_bars) + list(window_bars)
    ma = _ma_trend_series(combined)
    if len(ma) < len(window_bars):
        return []
    return ma[-len(window_bars):]


def _aligned_ma_series_for_trend(window_bars, preceding_bars, minimum_points: int = 2) -> List[float]:
    aligned = _aligned_ma_series(window_bars, preceding_bars)
    if len(aligned) >= minimum_points:
        return aligned
    if not preceding_bars:
        return aligned

    extend_count = minimum_points - len(aligned)
    if extend_count <= 0 or len(preceding_bars) < extend_count:
        return aligned

    extended_window = list(preceding_bars[-extend_count:]) + list(window_bars)
    extended_prefix = list(preceding_bars[:-extend_count])
    extended = _aligned_ma_series(extended_window, extended_prefix)
    if len(extended) >= minimum_points:
        return extended[-minimum_points:]
    return aligned


def _compute_ma99_for_window(window_bars, prefix_bars) -> List[Optional[float]]:
    combined = list(prefix_bars) + list(window_bars)
    closes = _extract_closes(combined)
    n_prefix = len(prefix_bars)

    if len(closes) < MA_WINDOW:
        return [None] * len(window_bars)

    ma_full = _rolling_mean(closes, MA_WINDOW)

    result: List[Optional[float]] = []
    for j in range(len(window_bars)):
        ma_idx = n_prefix + j - (MA_WINDOW - 1)
        result.append(float(ma_full[ma_idx]) if ma_idx >= 0 else None)
    return result


def _extract_ma99_gap(window_bars, ma99_values: List[Optional[float]]):
    from models import Ma99Gap

    gap_start: Optional[str] = None
    gap_end: Optional[str] = None
    for bar, val in zip(window_bars, ma99_values):
        if val is None:
            t = _bar_time(bar)
            if t and gap_start is None:
                gap_start = t
            if t:
                gap_end = t
        else:
            break
    if gap_start:
        return Ma99Gap(from_date=gap_start, to_date=gap_end or gap_start)
    return None


def get_prefix_bars(history: list, first_time: str, timeframe: str) -> list:
    if not first_time:
        return []
    norm = _normalize_time(first_time, timeframe)
    idx = _history_time_index(history, timeframe).get(norm)
    return history[:idx] if idx is not None else []


def aggregate_ohlc_bars(bars, timeframe: str = '1D') -> List[dict]:
    if timeframe != '1D':
        raise ValueError(f"Unsupported aggregation timeframe: {timeframe}")

    aggregated: List[dict] = []
    current: Optional[dict] = None

    for bar in bars:
        raw_time = _bar_time(bar)
        if not raw_time:
            continue
        day_key = raw_time[:10]
        open_ = _bar_value(bar, 'open')
        high = _bar_value(bar, 'high')
        low = _bar_value(bar, 'low')
        close = _bar_value(bar, 'close')

        if current is None or current['date'] != day_key:
            if current is not None:
                aggregated.append(current)
            current = {
                'date': day_key,
                'open': open_,
                'high': high,
                'low': low,
                'close': close,
            }
            continue

        current['high'] = max(current['high'], high)
        current['low'] = min(current['low'], low)
        current['close'] = close

    if current is not None:
        aggregated.append(current)
    return aggregated


def _query_ma_series(input_bars, history, timeframe: str) -> Tuple[List[float], str]:
    input_times = [_normalize_time(_bar_time(bar), timeframe) for bar in input_bars]
    first_time = input_times[0] if input_times else ''
    history_index = _history_time_index(history, timeframe) if history is not None else {}

    if first_time and first_time in history_index:
        start_idx = history_index[first_time]
        prefix_start = max(0, start_idx - MA_WINDOW)
        preceding = history[prefix_start:start_idx]
        ma = _aligned_ma_series_for_trend(input_bars, preceding, minimum_points=MIN_BARS_FOR_MA_TREND)
        if len(ma) >= MIN_BARS_FOR_MA_TREND:
            return ma, 'aligned'
        if len(input_bars) < MA_WINDOW:
            raise ValueError("Need at least 98 prior historical bars before the input segment to compute MA99 trend.")

    if len(input_bars) < MA_WINDOW:
        raise ValueError("Input shorter than 99 bars must include time values that map to historical data for MA99 trend comparison.")

    ma = _ma_trend_series(input_bars)
    if len(ma) < MIN_BARS_FOR_MA_TREND:
        raise ValueError("At least 100 bars are required when no prior historical context is available for MA99 trend comparison.")
    return ma, 'internal'


def _trend_direction(series: List[float], epsilon: float = 1e-9) -> int:
    if len(series) < 2:
        return 0
    delta = series[-1] - series[0]
    if delta > epsilon:
        return 1
    if delta < -epsilon:
        return -1
    return 0


def _candle_feature_vector(bars) -> List[float]:
    features = []
    prev_close = None
    for bar in bars:
        open_ = _bar_value(bar, 'open')
        high = _bar_value(bar, 'high')
        low = _bar_value(bar, 'low')
        close = _bar_value(bar, 'close')
        body_pct = _safe_pct(close - open_, open_)
        range_pct = _safe_pct(high - low, open_)
        upper_wick_pct = _safe_pct(high - max(open_, close), open_)
        lower_wick_pct = _safe_pct(min(open_, close) - low, open_)
        close_return_pct = 0.0 if prev_close in (None, 0) else (close - prev_close) / prev_close
        features.extend([body_pct, range_pct, upper_wick_pct, lower_wick_pct, close_return_pct])
        prev_close = close
    return features


def _normalized_similarity(a: List[float], b: List[float]) -> float:
    return pearson_correlation(z_score_normalize(a), z_score_normalize(b))


def _override_direction(label: Optional[str]) -> Optional[int]:
    if label == 'up':
        return 1
    if label == 'down':
        return -1
    if label == 'flat':
        return 0
    return None


def _future_window_label(bar_index: int, timeframe: str) -> str:
    if timeframe == '1D':
        return f'Day +{bar_index}'
    return f'Hour +{bar_index}'


def _median(values: List[float]) -> float:
    if not values:
        return 0.0
    return float(statistics.median(values))


def _parse_utc_time(value: str) -> Optional[datetime]:
    raw = (value or '').strip()
    if not raw:
        return None
    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%d"):
        try:
            return datetime.strptime(raw[:16] if fmt == "%Y-%m-%d %H:%M" else raw[:10], fmt)
        except ValueError:
            continue
    return None


def _format_time(dt: Optional[datetime], timeframe: str) -> str:
    if dt is None:
        return ''
    return dt.strftime('%Y-%m-%d') if timeframe == '1D' else dt.strftime('%Y-%m-%d %H:%M')


def _projected_future_bars(matches: List[MatchCase], current_close: float, last_input_time: str = '') -> List[dict]:
    base_dt = _parse_utc_time(last_input_time)
    projected_bars = []
    for index in range(FUTURE_LOOKAHEAD_BARS):
        projected = []
        for match in matches:
            base_price = match.historical_ohlc[-1].close if match.historical_ohlc else 0.0
            if not base_price or len(match.future_ohlc) <= index:
                continue
            bar = match.future_ohlc[index]
            projected.append({
                "open": current_close * (bar.open / base_price),
                "high": current_close * (bar.high / base_price),
                "low": current_close * (bar.low / base_price),
                "close": current_close * (bar.close / base_price),
            })
        if not projected:
            continue

        open_price = _median([bar["open"] for bar in projected])
        close_price = _median([bar["close"] for bar in projected])
        high_price = max(_median([bar["high"] for bar in projected]), open_price, close_price)
        low_price = min(_median([bar["low"] for bar in projected]), open_price, close_price)
        bar_time = _format_time(base_dt + timedelta(hours=index + 1), '1H') if base_dt else ''

        projected_bars.append({
            "time_index": index + 1,
            "time": bar_time,
            "open": round(open_price, 2),
            "high": round(high_price, 2),
            "low": round(low_price, 2),
            "close": round(close_price, 2),
        })
    return projected_bars


def _to_forecast_bars(bars: List[dict], timeframe: str) -> List[ForecastBar]:
    forecast = []
    for bar in bars:
        forecast.append(ForecastBar(
            time=_normalize_time(bar.get('time') or bar.get('date') or '', timeframe),
            open=round(float(bar['open']), 2),
            high=round(float(bar['high']), 2),
            low=round(float(bar['low']), 2),
            close=round(float(bar['close']), 2),
        ))
    return forecast


def _to_ohlc_bars(bars: List[dict], timeframe: str) -> List[OHLCBar]:
    return [
        OHLCBar(
            open=float(bar['open']),
            high=float(bar['high']),
            low=float(bar['low']),
            close=float(bar['close']),
            time=_normalize_time(bar.get('time') or bar.get('date') or '', timeframe),
        )
        for bar in bars
    ]


def find_top_matches(
    input_bars: List[OHLCBar],
    future_n: int = FUTURE_LOOKAHEAD_BARS,
    history=None,
    timeframe: str = '1H',
    ma99_trend_override: Optional[str] = None,
    ma_history=None,
) -> List[MatchCase]:
    if history is None:
        history = MOCK_HISTORY
    if ma_history is None:
        ma_history = history

    n = len(input_bars)
    if n < MIN_BARS_FOR_MA_TREND:
        raise ValueError(f"At least {MIN_BARS_FOR_MA_TREND} bars are required to compare trends.")

    query_candle_features = _candle_feature_vector(input_bars)
    query_ma: List[float] = []
    ma_mode = 'override'
    override_direction = _override_direction(ma99_trend_override)
    ma_timeframe = '1D' if timeframe == '1H' else timeframe
    query_ma_input = aggregate_ohlc_bars(input_bars, '1D') if timeframe == '1H' else input_bars

    if override_direction is None:
        query_ma, ma_mode = _query_ma_series(query_ma_input, ma_history, ma_timeframe)
        query_direction = _trend_direction(query_ma)
    else:
        query_direction = override_direction

    results = []
    for i in range(0, len(history) - n - future_n):
        window = history[i:i + n]
        window_for_ma = aggregate_ohlc_bars(window, '1D') if timeframe == '1H' else window
        if not window_for_ma:
            continue

        candidate_prefix = get_prefix_bars(ma_history, _bar_time(window_for_ma[0]), ma_timeframe)[-MA_WINDOW:]
        min_points = MIN_BARS_FOR_MA_TREND if ma_mode == 'override' else len(query_ma)
        window_ma = _aligned_ma_series_for_trend(window_for_ma, candidate_prefix, minimum_points=min_points)
        if len(window_ma) < min_points:
            continue
        if _trend_direction(window_ma) != query_direction:
            continue
        if ma_mode != 'override' and len(window_ma) != len(query_ma):
            continue

        candle_score = _normalized_similarity(query_candle_features, _candle_feature_vector(window))
        if ma_mode == 'override':
            score = round(candle_score, 4)
        else:
            ma_score = _normalized_similarity(query_ma, window_ma)
            score = round(0.6 * candle_score + 0.4 * ma_score, 4)

        future = history[i + n:i + n + future_n]
        results.append((score, i, window, future))

    results.sort(key=lambda item: item[0], reverse=True)
    top = results[:10]
    matches = []

    for score, i, window, future in top:
        prefix_1h = history[:i]
        combined_ma99_1h = _compute_ma99_for_window(list(window) + list(future), prefix_1h)
        window_1d = aggregate_ohlc_bars(window, '1D')
        future_1d = aggregate_ohlc_bars(future, '1D')
        prefix_1d = get_prefix_bars(ma_history, _bar_time(window_1d[0]) if window_1d else '', '1D')
        combined_ma99_1d = _compute_ma99_for_window(list(window_1d) + list(future_1d), prefix_1d) if window_1d else []

        hist_len_1h = len(window)
        hist_len_1d = len(window_1d)
        matches.append(MatchCase(
            id=f"match_{i}",
            correlation=round(score, 4),
            historical_ohlc=_to_ohlc_bars(window, '1H'),
            future_ohlc=_to_ohlc_bars(future, '1H'),
            historical_ohlc_1d=_to_ohlc_bars(window_1d, '1D'),
            future_ohlc_1d=_to_ohlc_bars(future_1d, '1D'),
            start_date=window[0]['date'],
            end_date=future[-1]['date'],
            historical_ma99=combined_ma99_1h[:hist_len_1h],
            future_ma99=combined_ma99_1h[hist_len_1h:],
            historical_ma99_1d=combined_ma99_1d[:hist_len_1d],
            future_ma99_1d=combined_ma99_1d[hist_len_1d:],
        ))
    return matches


def compute_stats(matches: List[MatchCase], current_close: float, timeframe: str = '1H', last_input_time: str = '') -> PredictStats:
    if not matches:
        raise ValueError("At least one match is required to compute statistics.")

    projected_bars_1h = _projected_future_bars(matches, current_close, last_input_time)
    if len(projected_bars_1h) < 2:
        raise ValueError("At least two future bars are required to build order suggestions.")

    projected_bars_1d = aggregate_ohlc_bars(projected_bars_1h, '1D')
    corrs = [m.correlation for m in matches]
    sorted_highs = sorted(projected_bars_1h, key=lambda item: item["high"], reverse=True)
    sorted_lows = sorted(projected_bars_1h, key=lambda item: item["low"])
    wins = [bar for bar in projected_bars_1h if bar["close"] > current_close]

    def build_high_suggestion(label: str, candidate: dict) -> OrderSuggestion:
        return OrderSuggestion(
            label=label,
            price=candidate["high"],
            pct=round(((candidate["high"] - current_close) / current_close) * 100, 2),
            occurrence_bar=candidate["time_index"],
            occurrence_window=candidate.get("time") or _future_window_label(candidate["time_index"], timeframe),
            historical_time="Consensus",
        )

    def build_low_suggestion(label: str, candidate: dict) -> OrderSuggestion:
        return OrderSuggestion(
            label=label,
            price=candidate["low"],
            pct=round(((candidate["low"] - current_close) / current_close) * 100, 2),
            occurrence_bar=candidate["time_index"],
            occurrence_window=candidate.get("time") or _future_window_label(candidate["time_index"], timeframe),
            historical_time="Consensus",
        )

    return PredictStats(
        highest=build_high_suggestion('Highest', sorted_highs[0]),
        second_highest=build_high_suggestion('Second Highest', sorted_highs[1]),
        second_lowest=build_low_suggestion('Second Lowest', sorted_lows[1]),
        lowest=build_low_suggestion('Lowest', sorted_lows[0]),
        win_rate=round(len(wins) / len(projected_bars_1h), 4),
        mean_correlation=round(statistics.mean(corrs), 4),
        consensus_forecast_1h=_to_forecast_bars(projected_bars_1h, '1H'),
        consensus_forecast_1d=_to_forecast_bars(projected_bars_1d, '1D'),
    )
