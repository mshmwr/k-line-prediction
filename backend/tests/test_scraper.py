"""
Unit tests for scripts/scrape_history.py (data.binance.vision zip-based scraper)

AC-048-P2-03: correct date range — only dates after last CSV bar are fetched
AC-048-P2-04: 404 tolerance — missing daily zip skipped, remaining dates still fetched
AC-048-P2-05: idempotent — when already up-to-date, no requests made and no file written
"""
import csv
import io
import sys
import zipfile
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch, MagicMock

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
import scrape_history


def _make_zip_bytes(rows: list[list]) -> bytes:
    """Build a minimal in-memory zip containing a single CSV with given rows."""
    buf = io.BytesIO()
    csv_buf = io.StringIO()
    writer = csv.writer(csv_buf)
    for row in rows:
        writer.writerow(row)
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("data.csv", csv_buf.getvalue())
    return buf.getvalue()


def _kline_row(open_time_us: int) -> list:
    # Binance Vision CSVs use microsecond timestamps (16 digits)
    return [open_time_us, "1800.0", "1900.0", "1700.0", "1850.0", "100.0",
            open_time_us + 3_599_999_999, "0", "0", "0", "0", "0"]


def _mock_zip_resp(rows: list[list]) -> MagicMock:
    m = MagicMock()
    m.status_code = 200
    m.content = _make_zip_bytes(rows)
    m.raise_for_status.return_value = None
    return m


def _mock_404() -> MagicMock:
    m = MagicMock()
    m.status_code = 404
    m.raise_for_status.return_value = None
    return m


def test_correct_date_range_fetched(tmp_path):
    """AC-048-P2-03: dates fetched = (last_csv_date+1) … yesterday; no more, no less."""
    yesterday = date.today() - timedelta(days=1)
    # CSV has data up to 3 days ago → expect exactly 3 fetch calls (day-2, day-1, yesterday)
    last_date = date.today() - timedelta(days=3)
    fetched_dates: list[date] = []

    def fake_get(url, timeout):
        # extract date from URL: .../ETHUSDT-1d-YYYY-MM-DD.zip
        date_str = url.split("ETHUSDT-1d-")[1].replace(".zip", "")
        fetched_dates.append(date.fromisoformat(date_str))
        open_us = int(datetime(*map(int, date_str.split("-")), tzinfo=timezone.utc).timestamp() * 1_000_000)
        return _mock_zip_resp([_kline_row(open_us)])

    with patch.object(scrape_history, "_last_date", return_value=last_date), \
         patch("scrape_history.requests.get", side_effect=fake_get):
        scrape_history.fetch_new_bars("1d", tmp_path / "x.csv")

    expected = [last_date + timedelta(days=i) for i in range(1, (yesterday - last_date).days + 1)]
    assert fetched_dates == expected


def test_404_date_skipped_others_fetched(tmp_path):
    """AC-048-P2-04: a 404 for one date returns [] for that date; other dates still fetched."""
    yesterday = date.today() - timedelta(days=1)
    two_days_ago = yesterday - timedelta(days=1)

    responses = {
        two_days_ago: _mock_404(),
        yesterday: _mock_zip_resp([_kline_row(1_745_884_800_000_000)]),
    }

    def fake_get(url, timeout):
        for d, resp in responses.items():
            if d.strftime("%Y-%m-%d") in url:
                return resp
        return _mock_404()

    last_date = two_days_ago - timedelta(days=1)
    with patch.object(scrape_history, "_last_date", return_value=last_date), \
         patch("scrape_history.requests.get", side_effect=fake_get):
        bars = scrape_history.fetch_new_bars("1d", tmp_path / "x.csv")

    assert len(bars) == 1  # only yesterday's bar; two_days_ago was 404


def test_idempotent_no_requests_when_up_to_date(tmp_path):
    """AC-048-P2-05: if last CSV date == yesterday, _dates_to_fetch returns [] → no HTTP calls."""
    yesterday = date.today() - timedelta(days=1)
    csv_path = tmp_path / "x.csv"

    with patch.object(scrape_history, "_last_date", return_value=yesterday), \
         patch("scrape_history.requests.get") as mock_get:
        count = scrape_history.scrape("1d", csv_path)

    mock_get.assert_not_called()
    assert count == 0
    assert not csv_path.exists()
