# backend/mock_data.py
import csv
import numpy as np
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import List, Dict
from time_utils import normalize_bar_time

def generate_mock_history(seed: int = 0) -> List[Dict]:
    rng = np.random.default_rng(seed)
    price = 2000.0
    start = date(2022, 1, 1)
    bars = []
    for i in range(500):
        change = rng.normal(0, 30)
        open_ = round(price + rng.uniform(-10, 10), 2)
        close = round(open_ + change, 2)
        high = round(max(open_, close) + rng.uniform(5, 25), 2)
        low = round(min(open_, close) - rng.uniform(5, 25), 2)
        bars.append({
            'open': open_, 'high': high, 'low': low, 'close': close,
            'date': (start + timedelta(days=i)).isoformat()
        })
        price = close
    return bars

MOCK_HISTORY = generate_mock_history(seed=99)


def load_csv_history(path: Path) -> List[Dict]:
    with open(path, newline='', encoding='utf-8') as f:
        lines = [l for l in f if l.strip()]
    is_cryptodatadownload = lines[0].strip().startswith('http')
    header_idx = 1 if is_cryptodatadownload else 0
    reader = csv.DictReader(lines[header_idx:])
    headers = {k.strip().lower(): k for k in (reader.fieldnames or [])}
    bars = []
    for row in reader:
        try:
            date_key = headers.get('date') or headers.get('unix') or next(iter(headers.values()))
            raw_date = row[date_key].strip() if date_key else ''
            bars.append({
                'open': float(row[headers['open']]),
                'high': float(row[headers['high']]),
                'low': float(row[headers['low']]),
                'close': float(row[headers['close']]),
                'date': normalize_bar_time(raw_date),
            })
        except (KeyError, ValueError):
            continue
    if is_cryptodatadownload:
        bars.reverse()  # CryptoDataDownload is newest-first → reverse to chronological
    return bars


def _parse_exchange_timestamp(raw_value: str) -> str:
    raw = (raw_value or '').strip()
    if not raw:
        raise ValueError("Missing timestamp.")

    numeric = int(raw)
    abs_numeric = abs(numeric)
    if abs_numeric >= 10**18:
        seconds = numeric / 1_000_000_000
    elif abs_numeric >= 10**15:
        seconds = numeric / 1_000_000
    elif abs_numeric >= 10**12:
        seconds = numeric / 1_000
    else:
        seconds = numeric

    dt = datetime.fromtimestamp(seconds, tz=timezone.utc)
    return dt.strftime('%Y-%m-%d %H:%M')


def load_official_day_csv(path: Path) -> List[Dict]:
    bars = []
    with open(path, newline='', encoding='utf-8') as f:
        for line_number, raw_line in enumerate(f, start=1):
            line = raw_line.strip()
            if not line:
                continue
            cols = [col.strip() for col in line.split(',')]
            if len(cols) < 5:
                raise ValueError(f"Line {line_number} does not contain OHLC columns.")
            try:
                bars.append({
                    'open': float(cols[1]),
                    'high': float(cols[2]),
                    'low': float(cols[3]),
                    'close': float(cols[4]),
                    'date': normalize_bar_time(_parse_exchange_timestamp(cols[0])),
                })
            except ValueError as exc:
                raise ValueError(f"Line {line_number} could not be parsed as official 1H OHLC data.") from exc
    return bars
