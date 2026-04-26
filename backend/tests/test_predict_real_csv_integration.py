"""
AC-051-08 — Real-DB + real-1H-CSV integration regression coverage.

Positive case: K-051 user-visible bug shape (uploading 2026-04-07 1H CSV against
post-K-051 daily DB -> find_top_matches succeeds with >=1 match).

Negative case (K-015 sacred regression anchor): DB truncated to SACRED_FLOOR - 1
= 128 bars ending at 2026-04-07 -> ValueError with the exact substring K-051
user-retest SOP greps. After K-051 Phase 4 the gate aligns: SACRED_FLOOR = 129
matches the user-facing message integer.

Drift guard: MIN_DAILY_BARS = MA_TREND_WINDOW_DAYS + MA_WINDOW imported at runtime,
not hard-coded as 129; future refactor breaking the sum reveals here first.
"""
import csv
import re
from pathlib import Path

import pytest

# Backend imports — fixtures dir is package-importable, predictor is importable
from predictor import find_top_matches, MA_TREND_WINDOW_DAYS, MA_WINDOW
from mock_data import load_csv_history, load_official_day_csv

REPO_ROOT = Path(__file__).resolve().parents[2]
LIVE_DAILY_DB_PATH = REPO_ROOT / "history_database" / "Binance_ETHUSDT_d.csv"
REAL_1H_CSV_FIXTURE = Path(__file__).parent / "fixtures" / "ETHUSDT-1h-2026-04-07-original.csv"

# Constants from production code — imported, NOT hard-coded.
# After K-051 Phase 4 (AC-051-10), the gate at predictor.py:156 fires at
# `len(combined_closes) < MA_TREND_WINDOW_DAYS + MA_WINDOW = 129`, matching
# the user-facing Sacred ValueError text byte-for-byte. SACRED_FLOOR and
# MIN_DAILY_BARS are now the same number; both names retained for callsite
# readability (truncation arithmetic uses SACRED_FLOOR; drift-guard uses
# MIN_DAILY_BARS to assert the imported sum).
MIN_DAILY_BARS = MA_TREND_WINDOW_DAYS + MA_WINDOW  # 30 + 99 = 129
SACRED_FLOOR = MIN_DAILY_BARS  # 129

# Exact substring from predictor.py:335 (K-015 sacred + K-051 user-message stability)
SACRED_VALUE_ERROR_SUBSTRING = (
    "ma_history requires at least 129 daily bars ending at that date"
)


def _load_real_1h_input_bars() -> list[dict]:
    """
    Load the committed 24-bar 1H CSV fixture as backend OHLCBar-shaped dicts.

    Reuses backend/mock_data.py::load_official_day_csv since that is the
    function backend uses for 1H official-input parsing — symmetry with
    the production path.
    """
    assert REAL_1H_CSV_FIXTURE.exists(), (
        f"fixture missing at {REAL_1H_CSV_FIXTURE}; "
        "regenerate via fixtures/ETHUSDT-1h-2026-04-07-original.README.md"
    )
    bars = load_official_day_csv(REAL_1H_CSV_FIXTURE)
    assert len(bars) == 24, f"fixture must have 24 bars, got {len(bars)}"
    return bars


def _write_truncated_daily_db(dst: Path, bars_to_keep: int, end_date: str) -> Path:
    """
    Write a truncated daily DB with exactly ``bars_to_keep`` rows ending at
    ``end_date`` (YYYY-MM-DD). Preserves the CryptoDataDownload header shape
    so ``load_csv_history`` parses it identically to the live DB.

    Returns the path to the truncated CSV.
    """
    with open(LIVE_DAILY_DB_PATH, encoding="utf-8") as f:
        all_lines = f.read().splitlines()
    # Line 0 = URL, Line 1 = header; data starts at line 2 (newest-first descending)
    url_line = all_lines[0]
    header_line = all_lines[1]
    data_rows = [r for r in all_lines[2:] if r.strip()]

    # Find the row whose Date column equals end_date
    end_idx = None
    for idx, row in enumerate(data_rows):
        cols = row.split(",")
        if len(cols) > 1 and cols[1] == end_date:
            end_idx = idx
            break
    assert end_idx is not None, (
        f"end_date {end_date} not found in daily DB; cannot construct "
        "truncated fixture for negative test"
    )

    # data_rows is descending: end_idx is the newest row to keep; we keep
    # bars_to_keep rows starting at end_idx going DOWN (older).
    truncated_data = data_rows[end_idx : end_idx + bars_to_keep]
    assert len(truncated_data) == bars_to_keep, (
        f"could not extract {bars_to_keep} bars ending at {end_date}; "
        f"only {len(truncated_data)} available"
    )

    dst.write_text(
        "\n".join([url_line, header_line, *truncated_data]) + "\n",
        encoding="utf-8",
    )
    return dst


def test_real_db_real_csv_returns_matches() -> None:
    """
    B2 positive: live DB (>=129 daily bars ending 2026-04-08) + real 24-bar 1H CSV
    ending 2026-04-07 -> find_top_matches returns >=1 match without raising.

    Pins the exact failure mode of K-051 in CI permanently. If the DB shrinks
    below the 129-bar floor ending at the input date, this test fails with the
    Sacred ValueError — ratifying both the regression and the user-message.
    """
    input_bars = _load_real_1h_input_bars()
    daily_history = load_csv_history(LIVE_DAILY_DB_PATH)

    matches = find_top_matches(
        input_bars,
        history=daily_history,
        timeframe="1D",
        ma_history=daily_history,
        history_1d=daily_history,
    )

    assert len(matches) >= 1, (
        "expected >=1 match from real DB + real 1H CSV; got 0. "
        "Possible causes: DB shrunk below MIN_DAILY_BARS floor, "
        "trend-direction mismatch, or matching threshold drift."
    )


def test_truncated_db_raises_sacred_value_error(tmp_path: Path) -> None:
    """
    B3 negative (K-015 sacred regression): copy live DB to tmp_path, truncate to
    SACRED_FLOOR - 1 = 128 bars ending 2026-04-07, call find_top_matches -> must
    raise ValueError whose message contains SACRED_VALUE_ERROR_SUBSTRING
    (verbatim).

    Uses ``re.escape()`` in ``pytest.raises(match=...)`` since the substring
    contains no regex metacharacters but defensive escape avoids future drift.

    After K-051 Phase 4 the gate aligns with the message: SACRED_FLOOR = 129,
    bars_to_keep = 128 = SACRED_FLOOR - 1, exactly one short of the floor.
    """
    input_bars = _load_real_1h_input_bars()
    truncated_db = _write_truncated_daily_db(
        tmp_path / "Binance_ETHUSDT_d_truncated.csv",
        bars_to_keep=SACRED_FLOOR - 1,  # 128 = one short of the post-Phase-4 floor
        end_date="2026-04-07",
    )
    daily_history = load_csv_history(truncated_db)
    assert len(daily_history) == SACRED_FLOOR - 1, (
        f"truncation arithmetic error: expected {SACRED_FLOOR - 1} bars, "
        f"got {len(daily_history)}"
    )

    with pytest.raises(ValueError, match=re.escape(SACRED_VALUE_ERROR_SUBSTRING)):
        find_top_matches(
            input_bars,
            history=daily_history,
            timeframe="1D",
            ma_history=daily_history,
            history_1d=daily_history,
        )


def test_min_daily_bars_constant_is_imported_not_magic() -> None:
    """
    Drift guard: assert MIN_DAILY_BARS == 129 by reading the runtime sum of
    imported constants (not a hard-coded 129). If a future refactor changes
    MA_WINDOW or MA_TREND_WINDOW_DAYS, this test reveals the drift; tests above
    that depend on '128 bars' as 'one short of 129' must be updated together.
    """
    assert MA_WINDOW == 99, (
        f"MA_WINDOW changed from 99 to {MA_WINDOW}; update integration "
        "tests' truncation arithmetic and Sacred message text together."
    )
    assert MA_TREND_WINDOW_DAYS == 30, (
        f"MA_TREND_WINDOW_DAYS changed from 30 to {MA_TREND_WINDOW_DAYS}; "
        "update integration tests' truncation arithmetic and Sacred message "
        "text together."
    )
    assert MIN_DAILY_BARS == 129, (
        f"MIN_DAILY_BARS sum drifted to {MIN_DAILY_BARS} (expected 129); "
        "Sacred ValueError text in predictor.py:335 still says '129'; "
        "either revert the constant or update both message text and tests."
    )
    assert SACRED_FLOOR == MA_TREND_WINDOW_DAYS + MA_WINDOW == 129, (
        f"SACRED_FLOOR ({SACRED_FLOOR}) decoupled from "
        f"MA_TREND_WINDOW_DAYS + MA_WINDOW ({MA_TREND_WINDOW_DAYS + MA_WINDOW}); "
        "post-K-051-Phase-4 the gate at predictor.py:156 fires at "
        "`combined_closes < MA_TREND_WINDOW_DAYS + MA_WINDOW = 129`, so "
        "SACRED_FLOOR must equal that sum. If either constant changed, update "
        "test_truncated_db_raises_sacred_value_error truncation arithmetic AND "
        "Sacred message in predictor.py:335 together."
    )
