import csv
import io
import sys
import zipfile
import requests
from pathlib import Path
from datetime import datetime, date, timedelta
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
from history_utils import _merge_bars, _save_history_csv
from time_utils import normalize_bar_time

HISTORY_DB = Path(__file__).resolve().parents[1] / "history_database"
HISTORY_1H_PATH = HISTORY_DB / "Binance_ETHUSDT_1h.csv"
HISTORY_1D_PATH = HISTORY_DB / "Binance_ETHUSDT_d.csv"

# Public S3 bucket — no geo-restriction, available globally
BINANCE_VISION_BASE = "https://data.binance.vision/data/spot/daily/klines/ETHUSDT"
EPOCH_DATE = date(2017, 8, 17)  # Binance ETHUSDT listing date


def _read_csv(path: Path) -> list:
    """Read history CSV using stdlib only — no numpy dependency."""
    with open(path, newline="", encoding="utf-8") as f:
        lines = [l for l in f if l.strip()]
    if not lines:
        return []
    is_cdd = lines[0].strip().startswith("http")
    header_idx = 1 if is_cdd else 0
    reader = csv.DictReader(lines[header_idx:])
    headers = {k.strip().lower(): k for k in (reader.fieldnames or [])}
    bars = []
    for row in reader:
        try:
            date_key = headers.get("date") or headers.get("unix") or next(iter(headers.values()))
            raw_date = row[date_key].strip() if date_key else ""
            bars.append({
                "date": normalize_bar_time(raw_date),
                "open": float(row[headers["open"]]),
                "high": float(row[headers["high"]]),
                "low": float(row[headers["low"]]),
                "close": float(row[headers["close"]]),
            })
        except (KeyError, ValueError):
            continue
    return bars


def _bar_from_row(row: list) -> dict:
    # Binance Vision CSVs use microsecond timestamps; normalize_bar_time handles µs/ms/s
    return {
        "date": normalize_bar_time(str(row[0])),
        "open": float(row[1]),
        "high": float(row[2]),
        "low": float(row[3]),
        "close": float(row[4]),
    }


def _last_date(path: Path) -> Optional[date]:
    if not path.exists():
        return None
    bars = _read_csv(path)
    if not bars:
        return None
    return datetime.strptime(bars[-1]["date"][:10], "%Y-%m-%d").date()


def _dates_to_fetch(last: Optional[date]) -> list:
    """Return list of dates from (last+1) to yesterday UTC. Empty if already up-to-date."""
    yesterday = date.today() - timedelta(days=1)
    start = (last + timedelta(days=1)) if last else EPOCH_DATE
    if start > yesterday:
        return []
    return [start + timedelta(days=i) for i in range((yesterday - start).days + 1)]


def fetch_bars_for_date(interval: str, target_date: date) -> list:
    """Download one daily zip and return all bars inside. Returns [] on 404 (date not yet available)."""
    date_str = target_date.strftime("%Y-%m-%d")
    url = f"{BINANCE_VISION_BASE}/{interval}/ETHUSDT-{interval}-{date_str}.zip"
    resp = requests.get(url, timeout=30)
    if resp.status_code == 404:
        return []
    resp.raise_for_status()
    with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
        with zf.open(zf.namelist()[0]) as f:
            reader = csv.reader(io.TextIOWrapper(f, encoding="utf-8"))
            return [_bar_from_row(row) for row in reader if len(row) >= 5]


def fetch_new_bars(interval: str, path: Path) -> list:
    all_bars: list = []
    for d in _dates_to_fetch(_last_date(path)):
        all_bars.extend(fetch_bars_for_date(interval, d))
    return all_bars


def scrape(interval: str, path: Path) -> int:
    existing = _read_csv(path) if path.exists() else []
    new_bars = fetch_new_bars(interval, path)
    if not new_bars:
        return 0
    merged = _merge_bars(existing, new_bars)
    _save_history_csv(merged, path)
    return len(new_bars)


if __name__ == "__main__":
    added_1h = scrape("1h", HISTORY_1H_PATH)
    added_1d = scrape("1d", HISTORY_1D_PATH)
    if added_1h + added_1d == 0:
        print("No new bars")
        sys.exit(0)
    print(f"Added {added_1h} 1H bars, {added_1d} 1D bars")
