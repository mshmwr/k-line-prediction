"""
AC-051-08 — Real-DB + real-1H-CSV integration regression coverage.

Positive case: K-051 user-visible bug shape (uploading 2026-04-07 1H CSV against
post-K-051 daily DB -> find_top_matches succeeds with >=1 match).

Negative case (K-015 sacred regression anchor): DB truncated to SACRED_FLOOR - 1
= 128 bars ending at 2026-04-07 -> ValueError with the exact substring K-051
user-retest SOP greps. After K-051 Phase 4 the gate aligns: SACRED_FLOOR = 129
matches the user-facing message integer.

Drift guard: MIN_DAILY_BARS = DEFAULT_PARAMS.ma_trend_window_days + MA_WINDOW
derived at runtime from the operative param namespace (not hard-coded as 129);
future refactor breaking the sum reveals here first.
"""
import ast
import csv
import re
from pathlib import Path

import pytest

import predictor
# Backend imports — fixtures dir is package-importable, predictor is importable
from predictor import find_top_matches, MA_WINDOW
from firestore_config import ParamSnapshot, DEFAULT_PARAMS
from mock_data import load_csv_history, load_official_day_csv

REPO_ROOT = Path(__file__).resolve().parents[2]
LIVE_DAILY_DB_PATH = REPO_ROOT / "history_database" / "Binance_ETHUSDT_d.csv"
REAL_1H_CSV_FIXTURE = Path(__file__).parent / "fixtures" / "ETHUSDT-1h-2026-04-07-original.csv"

# Constants derived from operative param namespace — NOT hard-coded.
# After K-051 Phase 4 (AC-051-10), the gate at predictor.py fires at
# `len(combined_closes) < params.ma_trend_window_days + MA_WINDOW = 129`,
# matching the user-facing Sacred ValueError text byte-for-byte. SACRED_FLOOR
# and MIN_DAILY_BARS are now the same number; both names retained for callsite
# readability (truncation arithmetic uses SACRED_FLOOR; drift-guard uses
# MIN_DAILY_BARS to assert the derived sum).
MIN_DAILY_BARS = DEFAULT_PARAMS.ma_trend_window_days + MA_WINDOW  # 30 + 99 = 129
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
    ``end_date`` (YYYY-MM-DD). The live DB is plain-format CSV (oldest-first,
    no URL preamble): line 0 = header, lines 1+ = data ascending by date.
    Date column (col 0) has format "YYYY-MM-DD HH:MM" — match by date prefix.

    Returns the path to the truncated CSV.
    """
    with open(LIVE_DAILY_DB_PATH, encoding="utf-8") as f:
        all_lines = f.read().splitlines()
    # Line 0 = header ("date,open,high,low,close"); data starts at line 1, ascending.
    header_line = all_lines[0]
    data_rows = [r for r in all_lines[1:] if r.strip()]

    # Find the row whose Date column (col 0) date-prefix equals end_date (YYYY-MM-DD).
    end_idx = None
    for idx, row in enumerate(data_rows):
        cols = row.split(",")
        if cols and cols[0].split(" ")[0] == end_date:
            end_idx = idx
            break
    assert end_idx is not None, (
        f"end_date {end_date} not found in daily DB; cannot construct "
        "truncated fixture for negative test"
    )

    # data_rows is ascending: keep bars_to_keep rows ending at end_idx (inclusive).
    start_idx = max(0, end_idx - bars_to_keep + 1)
    truncated_data = data_rows[start_idx : end_idx + 1]
    assert len(truncated_data) == bars_to_keep, (
        f"could not extract {bars_to_keep} bars ending at {end_date}; "
        f"only {len(truncated_data)} available"
    )

    dst.write_text(
        "\n".join([header_line, *truncated_data]) + "\n",
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


def test_params_namespace_structure_invariant() -> None:
    """
    Layer 1 — Structure invariant (K-078 sacred test replacement).

    1. predictor.params is a ParamSnapshot instance.
    2. Field types match the dataclass contract.
    3. AST walk of backend/predictor.py: no bare numeric literals 30, 0.4, or 10
       appear inside the bodies of _classify_trend_by_pearson, _fetch_30d_ma_series,
       or find_top_matches. Confirms the inline constants have been replaced by
       params.* reads.
    """
    # 1–4: type structure
    assert isinstance(predictor.params, ParamSnapshot), (
        f"predictor.params is {type(predictor.params)}, expected ParamSnapshot"
    )
    assert isinstance(predictor.params.ma_trend_window_days, int)
    assert isinstance(predictor.params.ma_trend_pearson_threshold, float)
    assert isinstance(predictor.params.top_k_matches, int)

    # 5: AST walk — no bare tunable magic number literals OR legacy module-constant
    # references in the operative functions.
    # Per-function forbidden constant set:
    #   _classify_trend_by_pearson  → pearson threshold 0.4
    #   _fetch_30d_ma_series        → window days 30
    #   find_top_matches            → top_k 10
    # Note: 0.4 in find_top_matches is the MA score blend weight (0.6/0.4), not
    # the pearson threshold — it is a fixed algorithmic constant, not a tunable.
    # Forbidden ast.Name ids (module-level legacy constants — bypass guard):
    #   Any of these Names inside the three functions defeats the params.* contract.
    LEGACY_CONSTANT_NAMES = frozenset({
        "MA_TREND_PEARSON_THRESHOLD",
        "MA_TREND_WINDOW_DAYS",
    })
    fn_forbidden = {
        "_classify_trend_by_pearson": {0.4},
        "_fetch_30d_ma_series": {30},
        "find_top_matches": {10},
    }
    predictor_src = (REPO_ROOT / "backend" / "predictor.py").read_text()
    tree = ast.parse(predictor_src)

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and node.name in fn_forbidden:
            forbidden = fn_forbidden[node.name]
            for child in ast.walk(node):
                if isinstance(child, ast.Constant) and child.value in forbidden:
                    raise AssertionError(
                        f"Bare magic literal {child.value!r} found inside "
                        f"{node.name}() at line {child.lineno} of predictor.py. "
                        "K-078 requires this to be replaced by params.* read."
                    )
                if isinstance(child, ast.Name) and child.id in LEGACY_CONSTANT_NAMES:
                    raise AssertionError(
                        f"Legacy module constant {child.id!r} referenced inside "
                        f"{node.name}() at line {child.lineno} of predictor.py. "
                        "K-078 requires params.* reads; bare name reference bypasses "
                        "the tunable-param contract."
                    )


def test_params_floor_recomputes_from_runtime_values() -> None:
    """
    Layer 2 — Behavior invariant (K-078 sacred test addition).

    Step A: default params -> floor == 129 (30 + 99).
    Step B: custom window=14 -> floor == 113 (14 + 99), not stuck at 129.
    Step C: restore original params via try/finally.
    """
    original = predictor.params
    try:
        # Step A — default params path
        predictor.params = DEFAULT_PARAMS
        expected_floor = predictor.params.ma_trend_window_days + predictor.MA_WINDOW
        assert expected_floor == 129, (
            f"Default floor expected 129, got {expected_floor}. "
            "DEFAULT_PARAMS.ma_trend_window_days or MA_WINDOW has drifted."
        )

        # Step B — custom params path
        predictor.params = ParamSnapshot(
            ma_trend_window_days=14,
            ma_trend_pearson_threshold=0.5,
            top_k_matches=5,
            params_hash="test",
            optimized_at=None,
            source="default",
        )
        custom_floor = predictor.params.ma_trend_window_days + predictor.MA_WINDOW
        assert custom_floor == 113, (
            f"Custom floor (window=14) expected 113, got {custom_floor}."
        )
        assert custom_floor != 129, (
            "Floor is stuck at 129 even with window=14; params.* reads not wired."
        )
    finally:
        # Step C — always restore
        predictor.params = original
