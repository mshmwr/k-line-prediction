"""
Unit tests for scripts/scrape_history.py

AC-048-P2-03: closed-only filter — mock one closed + one open bar, assert one output row
AC-048-P2-04: pagination — mock two pages of 1000 bars each, assert 2000 output rows
AC-048-P2-05: idempotent — mock 0 new bars, assert no output rows
"""
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
import scrape_history

NOW_MS = 1_746_000_000_000  # fixed "now" — ~2025-04-30 UTC
HOUR_MS = scrape_history.INTERVAL_MS["1h"]
LIMIT = scrape_history.LIMIT


def _kline(open_offset_ms: int, close_offset_ms: int) -> list:
    return [NOW_MS + open_offset_ms, "1.0", "1.0", "1.0", "1.0", "0", NOW_MS + close_offset_ms]


def _make_page(count: int, base_offset_ms: int = -2000 * HOUR_MS) -> list:
    return [_kline(base_offset_ms - i * HOUR_MS, base_offset_ms - i * HOUR_MS + HOUR_MS - 1)
            for i in range(count)]


def _mock_resp(klines: list) -> MagicMock:
    m = MagicMock()
    m.json.return_value = klines
    m.raise_for_status.return_value = None
    return m


def test_closed_only_filter(tmp_path):
    """AC-048-P2-03: open bar (close_time >= now_ms) excluded from output."""
    closed = _kline(-2 * HOUR_MS, -HOUR_MS)
    open_bar = _kline(-HOUR_MS, HOUR_MS)

    with patch("scrape_history.requests.get", return_value=_mock_resp([closed, open_bar])):
        bars = scrape_history.fetch_new_bars("1h", tmp_path / "x.csv", _now_ms=NOW_MS)

    assert len(bars) == 1


def test_pagination(tmp_path):
    """AC-048-P2-04: two full pages of 1000 bars each yields 2000 total output rows."""
    responses = [
        _mock_resp(_make_page(LIMIT)),   # page 1: full — loop continues
        _mock_resp(_make_page(LIMIT)),   # page 2: full — loop continues
        _mock_resp([]),                  # page 3: empty — loop terminates
    ]

    with patch("scrape_history.requests.get", side_effect=responses):
        bars = scrape_history.fetch_new_bars("1h", tmp_path / "x.csv", _now_ms=NOW_MS)

    assert len(bars) == 2000


def test_idempotent(tmp_path):
    """AC-048-P2-05: zero new bars returned — no file written, return count = 0."""
    csv_path = tmp_path / "x.csv"

    with patch("scrape_history.requests.get", return_value=_mock_resp([])):
        count = scrape_history.scrape("1h", csv_path)

    assert count == 0
    assert not csv_path.exists()
