"""
Generator for backend/tests/fixtures/stats_contract_cases.json.

Each case hard-codes a small, deterministic set of `MatchCase` objects, calls
the real backend `compute_stats(matches, current_close, timeframe)` to produce
ground-truth `expected` output, and serialises both `input` and `expected` as
snake_case JSON.

The generator is intentionally self-contained:
- No dependency on MOCK_HISTORY or find_top_matches (those are non-deterministic
  wrt future changes in mock_data.py).
- Hard-coded OHLC values chosen so sorted_highs / sorted_lows orderings are
  unambiguous (no tie-breaking).
- `future_ohlc` has >= 2 bars (required by compute_stats and by the K-Line
  Test Data Realism rule in CLAUDE.md).

Why input-output are captured together:
- The frontend contract test (statsComputation.test.ts) reads the same JSON
  via relative import and asserts bit-exact parity. If the backend algorithm
  changes, we rerun this generator; the diff in stats_contract_cases.json
  makes the algorithm change visible in code review, and both sides' tests
  fail loudly until the frontend mirror is updated.

Usage:
    cd backend && python3 tests/fixtures/generate_stats_contract_cases.py

Output: tests/fixtures/stats_contract_cases.json (overwritten).
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import List


# Allow running the script from either backend/ or repo root.
HERE = Path(__file__).resolve().parent
BACKEND_DIR = HERE.parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from models import MatchCase, OHLCBar  # noqa: E402
from predictor import compute_stats  # noqa: E402


OUTPUT_PATH = HERE / 'stats_contract_cases.json'


def _bar(open_: float, high: float, low: float, close: float, time: str = '') -> OHLCBar:
    return OHLCBar(open=open_, high=high, low=low, close=close, time=time)


def _make_match(
    match_id: str,
    correlation: float,
    historical_closes: List[float],
    future_ohlc: List[OHLCBar],
    start_date: str,
    end_date: str,
) -> MatchCase:
    # Minimal historical_ohlc: only the last bar's close is used by
    # _projected_future_bars as the normalisation base. We synthesise a
    # trivial series so the model accepts the input.
    historical_ohlc = [
        OHLCBar(open=c, high=c, low=c, close=c, time=f'hist_{i}')
        for i, c in enumerate(historical_closes)
    ]
    return MatchCase(
        id=match_id,
        correlation=correlation,
        historical_ohlc=historical_ohlc,
        future_ohlc=future_ohlc,
        historical_ohlc_1d=[],
        future_ohlc_1d=[],
        start_date=start_date,
        end_date=end_date,
        historical_ma99=[],
        future_ma99=[],
        historical_ma99_1d=[],
        future_ma99_1d=[],
    )


def _build_case_matches_full() -> List[MatchCase]:
    """3 matches x 3 future bars each. Correlations [0.95, 0.87, 0.72].

    Historical last close = 2000 for every match so base_price is unambiguous;
    current_close is also 2000 -> scale factor 1.0. This keeps all scaled
    projected values as integers (or .5), which is critical for contract
    parity: Python `round(x, 2)` uses banker's rounding (half-to-even) while
    JavaScript `Math.round(x * 100) / 100` uses half-away-from-zero — the two
    agree ONLY when the rounding input is already clean at the 2-decimal
    boundary (no .005 remainder at the 3rd decimal). See K-013 design doc
    §9.2 for the root-cause discussion.

    Every `future_ohlc` value below is an integer multiple of 1, so after a
    `1.0` scale factor + median across an odd count (case 1: 3 matches;
    case 2 subset: 2 matches with even-integer pairs) all projected
    highs/lows/opens/closes remain integer-valued, and `round(x, 2)` is an
    identity on both sides.
    """
    return [
        _make_match(
            match_id='match_0',
            correlation=0.9523,
            historical_closes=[1990.0, 2000.0],
            future_ohlc=[
                _bar(2010.0, 2040.0, 2000.0, 2030.0, '2024-01-01 02:00'),
                _bar(2030.0, 2060.0, 2020.0, 2050.0, '2024-01-01 03:00'),
                _bar(2050.0, 2060.0, 2020.0, 2030.0, '2024-01-01 04:00'),
            ],
            start_date='2024-01-01 00:00',
            end_date='2024-01-01 04:00',
        ),
        _make_match(
            match_id='match_1',
            correlation=0.8712,
            historical_closes=[1990.0, 2000.0],
            future_ohlc=[
                _bar(2000.0, 2030.0, 1990.0, 2020.0, '2024-02-01 02:00'),
                _bar(2020.0, 2050.0, 2010.0, 2040.0, '2024-02-01 03:00'),
                _bar(2040.0, 2050.0, 2010.0, 2020.0, '2024-02-01 04:00'),
            ],
            start_date='2024-02-01 00:00',
            end_date='2024-02-01 04:00',
        ),
        _make_match(
            match_id='match_2',
            correlation=0.7245,
            historical_closes=[1990.0, 2000.0],
            future_ohlc=[
                _bar(2000.0, 2020.0, 1990.0, 2010.0, '2024-03-01 02:00'),
                _bar(2010.0, 2040.0, 2000.0, 2030.0, '2024-03-01 03:00'),
                _bar(2030.0, 2040.0, 2000.0, 2010.0, '2024-03-01 04:00'),
            ],
            start_date='2024-03-01 00:00',
            end_date='2024-03-01 04:00',
        ),
    ]


def _match_to_dict(match: MatchCase) -> dict:
    return {
        'id': match.id,
        'correlation': match.correlation,
        'historical_ohlc': [bar.model_dump() for bar in match.historical_ohlc],
        'future_ohlc': [bar.model_dump() for bar in match.future_ohlc],
        'historical_ohlc_1d': [bar.model_dump() for bar in match.historical_ohlc_1d],
        'future_ohlc_1d': [bar.model_dump() for bar in match.future_ohlc_1d],
        'start_date': match.start_date,
        'end_date': match.end_date,
        'historical_ma99': list(match.historical_ma99),
        'future_ma99': list(match.future_ma99),
        'historical_ma99_1d': list(match.historical_ma99_1d),
        'future_ma99_1d': list(match.future_ma99_1d),
    }


def _build_case(
    name: str,
    description: str,
    matches: List[MatchCase],
    current_close: float,
    timeframe: str,
) -> dict:
    stats = compute_stats(matches, current_close, timeframe)
    return {
        'name': name,
        'description': description,
        'input': {
            'matches': [_match_to_dict(m) for m in matches],
            'current_close': current_close,
            'timeframe': timeframe,
        },
        'expected': stats.model_dump(),
    }


def build_all_cases() -> List[dict]:
    all_matches = _build_case_matches_full()
    # current_close == historical base close -> scale factor 1.0; see docstring
    # of _build_case_matches_full for why that matters for rounding parity.
    case_1 = _build_case(
        name='all_matches_full_set',
        description='Full set — 3 matches x 3 future bars, correlations [0.9523, 0.8712, 0.7245]; locks the "deselect none" path against backend full-set baseline.',
        matches=all_matches,
        current_close=2000.0,
        timeframe='1H',
    )

    subset_matches = all_matches[:2]  # Drop match_2 -> 2 matches remain.
    case_2 = _build_case(
        name='subset_deselect_one',
        description='Subset — first 2 of the 3 matches (user deselects match_2); reflects the real K-013 runtime path where frontend computes stats locally.',
        matches=subset_matches,
        current_close=2000.0,
        timeframe='1H',
    )

    single_match = [
        _make_match(
            match_id='match_only',
            correlation=0.9100,
            historical_closes=[1990.0, 2000.0],
            future_ohlc=[
                _bar(2010.0, 2030.0, 2000.0, 2020.0, '2024-04-01 02:00'),
                _bar(2020.0, 2040.0, 2010.0, 2030.0, '2024-04-01 03:00'),
            ],
            start_date='2024-04-01 00:00',
            end_date='2024-04-01 03:00',
        ),
    ]
    case_3 = _build_case(
        name='single_match_two_bars',
        description='Single match with exactly 2 future bars — the minimum valid input (projected_bars.length >= 2 boundary); ensures sorted_highs[1] / sorted_lows[1] pick the other bar deterministically.',
        matches=single_match,
        current_close=2000.0,
        timeframe='1H',
    )

    return [case_1, case_2, case_3]


def main() -> None:
    cases = build_all_cases()
    OUTPUT_PATH.write_text(json.dumps(cases, indent=2) + '\n')
    print(f'Wrote {len(cases)} case(s) to {OUTPUT_PATH.relative_to(BACKEND_DIR.parent)}')


if __name__ == '__main__':
    main()
