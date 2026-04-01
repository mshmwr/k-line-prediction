# backend/predictor.py
import numpy as np
import statistics
from typing import List
from models import OHLCBar, MatchCase, PredictStats
from mock_data import MOCK_HISTORY

def z_score_normalize(series: List[float]) -> List[float]:
    arr = np.array(series, dtype=float)
    std = arr.std()
    if std == 0:
        return [0.0] * len(series)
    return ((arr - arr.mean()) / std).tolist()

def pearson_correlation(a: List[float], b: List[float]) -> float:
    return float(np.corrcoef(a, b)[0, 1])

def _extract_closes(bars) -> List[float]:
    return [b['close'] if isinstance(b, dict) else b.close for b in bars]

def find_top_matches(input_bars: List[OHLCBar], future_n: int = 10, history=None) -> List[MatchCase]:
    if history is None:
        history = MOCK_HISTORY
    n = len(input_bars)
    query_closes = z_score_normalize(_extract_closes(input_bars))
    results = []
    for i in range(len(history) - n - future_n):
        window = history[i:i + n]
        window_closes = z_score_normalize(_extract_closes(window))
        r = pearson_correlation(query_closes, window_closes)
        future = history[i + n:i + n + future_n]
        results.append((r, i, window, future))
    results.sort(key=lambda x: x[0], reverse=True)
    top = results[:10]
    matches = []
    for r, i, window, future in top:
        matches.append(MatchCase(
            id=f"match_{i}",
            correlation=round(r, 4),
            historical_ohlc=[OHLCBar(**b) for b in window],
            future_ohlc=[OHLCBar(**b) for b in future],
            start_date=window[0]['date'],
            end_date=future[-1]['date']
        ))
    return matches

def compute_stats(matches: List[MatchCase], current_close: float) -> PredictStats:
    pct_changes = []
    for m in matches:
        base_price = m.historical_ohlc[-1].close
        future_close = m.future_ohlc[-1].close
        pct_changes.append((future_close - base_price) / base_price)
    corrs = [m.correlation for m in matches]
    opt_pct = max(pct_changes)
    pes_pct = min(pct_changes)
    base_pct = statistics.median(pct_changes)
    projected = [current_close * (1 + p) for p in pct_changes]
    wins = [p for p in projected if p > current_close]
    return PredictStats(
        optimistic=round(current_close * (1 + opt_pct), 2),
        baseline=round(current_close * (1 + base_pct), 2),
        pessimistic=round(current_close * (1 + pes_pct), 2),
        optimistic_pct=round(opt_pct * 100, 2),
        baseline_pct=round(base_pct * 100, 2),
        pessimistic_pct=round(pes_pct * 100, 2),
        win_rate=round(len(wins) / len(projected), 4),
        mean_correlation=round(statistics.mean(corrs), 4)
    )
