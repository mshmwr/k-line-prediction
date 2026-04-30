"""
AC-051-07 — Daily history DB contiguity + freshness regression coverage.

Loads the on-disk canonical history_database/Binance_ETHUSDT_d.csv and asserts:
  (i)   strictly-monotonic ascending date sequence (no duplicates, no zigzag)
  (ii)  every consecutive pair gap == 1 calendar day (no missing day)
  (iii) freshness floor: last_row.date >= TODAY - 7 days (K-048 SLA)

The 2026-03-20 -> 2026-04-08 K-051 gap class would have failed (ii); a future
DB-shrink that drops only the head still fails (iii).

Loads via raw csv.reader (not load_csv_history) so the test exercises the
on-disk bytes directly, not the post-processed loader output.
"""
from datetime import date, datetime, timedelta
from pathlib import Path
import csv

# Path resolution: walk up from backend/tests/<file> -> backend/tests -> backend -> K-Line-Prediction
HISTORY_DB_PATH = Path(__file__).resolve().parents[2] / "history_database" / "Binance_ETHUSDT_d.csv"

# Module constants (N1 — explicit floor names, never magic numbers)
MAX_GAP_DAYS = 1
FRESHNESS_FLOOR_DAYS = 7  # matches K-048 auto-scraper SLA


def _load_dates_ascending() -> list[date]:
    """
    Read on-disk CSV, detect format, parse the date column.

    Two formats supported (AC-048-P2-08):
    - CryptoDataDownload: rows[0] starts with 'http'; data starts at rows[2]; date in col 1
    - Simple (written by _save_history_csv): rows[0] is header 'date,...'; data at rows[1]; date in col 0

    Return a list sorted ascending (input file may be descending; sort here, do not reverse,
    so a future re-ordering of the file is detected by the strict-monotonic assertion).
    """
    assert HISTORY_DB_PATH.exists(), (
        f"history database missing at {HISTORY_DB_PATH}; "
        "if running in a worktree, hydrate per CLAUDE.md §Worktree Hydration Drift Policy"
    )
    dates: list[date] = []
    with open(HISTORY_DB_PATH, newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        rows = list(reader)
    if rows and rows[0] and rows[0][0].strip().startswith("http"):
        data_rows = rows[2:]   # CryptoDataDownload: skip URL line + header
        date_col = 1
    else:
        data_rows = rows[1:]   # Simple format: skip header only
        date_col = 0
    for row in data_rows:
        if not row:
            continue
        dates.append(datetime.strptime(row[date_col], "%Y-%m-%d").date())
    return sorted(dates)


def test_history_db_dates_strictly_monotonic_ascending() -> None:
    """B1 assertion: no duplicates, no descending pair after the sort.

    A naive ``(d2 - d1).days <= 1`` check would silently pass on duplicates
    (delta=0) and on zigzag (delta=-1). This test checks delta > 0 strictly.
    """
    dates = _load_dates_ascending()
    assert len(dates) > 0, (
        "no data rows parsed from history DB — empty or schema drift "
        f"(path: {HISTORY_DB_PATH})"
    )
    for i in range(1, len(dates)):
        prev_date, curr_date = dates[i - 1], dates[i]
        delta = (curr_date - prev_date).days
        assert delta > 0, (
            f"non-strictly-monotonic date sequence at index {i - 1}->{i}: "
            f"prev={prev_date.isoformat()} curr={curr_date.isoformat()} "
            f"delta_days={delta} (expected delta > 0; duplicate or descending row)"
        )


def test_history_db_dates_no_gap_greater_than_one_day() -> None:
    """B1 assertion: every consecutive pair gap == MAX_GAP_DAYS (=1) calendar day.

    K-051's 16-bar gap (2026-03-20 -> 2026-04-08) would fail here. Failure
    message includes the offending date pair so triage points at the exact
    missing window without re-running.
    """
    dates = _load_dates_ascending()
    assert len(dates) > 1, (
        "fewer than 2 rows in history DB — cannot verify gap; "
        f"path: {HISTORY_DB_PATH}"
    )
    for i in range(1, len(dates)):
        prev_date, curr_date = dates[i - 1], dates[i]
        gap = (curr_date - prev_date).days
        assert gap == MAX_GAP_DAYS, (
            f"gap of {gap} days between {prev_date.isoformat()} and "
            f"{curr_date.isoformat()} (expected {MAX_GAP_DAYS}); "
            "this is the K-051 gap class — backfill missing daily bars"
        )


def test_history_db_freshness_floor_within_seven_days() -> None:
    """B1 assertion: last_row.date >= TODAY - 7 days.

    Without this, a future shrink that drops only the head still passes
    (i)+(ii) but loses 1H upload window space — and freshness was the K-051
    root cause. Uses ``date.today()`` (local clock, UTC-anchored interpretation
    matches Binance daily ISO dates per QA retro 2026-04-26 K-051 line 27).
    """
    dates = _load_dates_ascending()
    assert len(dates) > 0, (
        "no data rows in history DB; cannot verify freshness floor "
        f"(path: {HISTORY_DB_PATH})"
    )
    last_row_date = dates[-1]
    today = date.today()
    floor = today - timedelta(days=FRESHNESS_FLOOR_DAYS)
    days_behind = (today - last_row_date).days
    assert last_row_date >= floor, (
        f"last_row.date {last_row_date.isoformat()} is {days_behind} days behind "
        f"TODAY {today.isoformat()}; freshness floor breach (>{FRESHNESS_FLOOR_DAYS} days). "
        "Backfill recent daily bars per K-048 SLA."
    )
