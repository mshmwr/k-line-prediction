import csv
import sys
import requests
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
from history_utils import _merge_bars, _save_history_csv
from time_utils import normalize_bar_time

HISTORY_DB = Path(__file__).resolve().parents[1] / "history_database"
HISTORY_1H_PATH = HISTORY_DB / "Binance_ETHUSDT_1h.csv"
HISTORY_1D_PATH = HISTORY_DB / "Binance_ETHUSDT_d.csv"

BINANCE_KLINES_URL = "https://api.binance.com/api/v3/klines"
SYMBOL = "ETHUSDT"
LIMIT = 1000
INTERVAL_MS = {"1h": 3_600_000, "1d": 86_400_000}
BACKFILL_EPOCH_MS = int(datetime(2020, 1, 1, tzinfo=timezone.utc).timestamp() * 1000)


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


def _bar_from_kline(kline: list) -> dict:
    # open_time_ms is a millisecond Unix timestamp; normalize_bar_time accepts it as string
    return {
        "date": normalize_bar_time(str(kline[0])),
        "open": float(kline[1]),
        "high": float(kline[2]),
        "low": float(kline[3]),
        "close": float(kline[4]),
    }


def _start_time_ms(path: Path, interval: str) -> int:
    if not path.exists():
        return BACKFILL_EPOCH_MS
    bars = _read_csv(path)
    if not bars:
        return BACKFILL_EPOCH_MS
    try:
        last_dt = datetime.strptime(bars[-1]["date"][:16], "%Y-%m-%d %H:%M")
        return int(last_dt.replace(tzinfo=timezone.utc).timestamp() * 1000) + INTERVAL_MS[interval]
    except ValueError:
        return BACKFILL_EPOCH_MS


def fetch_new_bars(interval: str, path: Path, _now_ms: Optional[int] = None) -> list:
    now_ms = _now_ms if _now_ms is not None else int(datetime.now(tz=timezone.utc).timestamp() * 1000)
    cursor = _start_time_ms(path, interval)
    all_bars: list = []
    while True:
        resp = requests.get(
            BINANCE_KLINES_URL,
            params={"symbol": SYMBOL, "interval": interval, "startTime": cursor, "limit": LIMIT},
            timeout=30,
        )
        resp.raise_for_status()
        klines = resp.json()
        closed = [k for k in klines if int(k[6]) < now_ms]
        all_bars.extend(_bar_from_kline(k) for k in closed)
        if len(closed) < LIMIT:
            break
        cursor += LIMIT * INTERVAL_MS[interval]
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
