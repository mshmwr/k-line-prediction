# backend/mock_data.py
import csv
import numpy as np
from datetime import date, timedelta
from pathlib import Path
from typing import List, Dict

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
    header_idx = 1 if lines[0].strip().startswith('http') else 0
    reader = csv.DictReader(lines[header_idx:])
    headers = {k.strip().lower(): k for k in (reader.fieldnames or [])}
    bars = []
    for row in reader:
        try:
            date_key = headers.get('date') or headers.get('unix') or next(iter(headers.values()))
            raw_date = row[date_key].strip().split()[0] if date_key else ''
            bars.append({
                'open': float(row[headers['open']]),
                'high': float(row[headers['high']]),
                'low': float(row[headers['low']]),
                'close': float(row[headers['close']]),
                'date': raw_date,
            })
        except (KeyError, ValueError):
            continue
    bars.reverse()  # CryptoDataDownload is newest-first → reverse to chronological
    return bars
