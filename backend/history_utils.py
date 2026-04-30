import csv
from pathlib import Path
from time_utils import normalize_bar_time


def _merge_bars(existing: list, new_bars: list) -> list:
    """Merge new_bars into existing, dedup by normalized 'date', sort chronologically."""
    combined = {normalize_bar_time(bar['date']): {**bar, 'date': normalize_bar_time(bar['date'])} for bar in existing}
    combined.update({normalize_bar_time(bar['date']): {**bar, 'date': normalize_bar_time(bar['date'])} for bar in new_bars})
    return sorted(combined.values(), key=lambda b: b['date'])


def _save_history_csv(bars: list, path: Path) -> None:
    """Save bars to CSV in minimal date,open,high,low,close format."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['date', 'open', 'high', 'low', 'close'])
        writer.writeheader()
        for bar in bars:
            writer.writerow({
                'date': bar['date'],
                'open': bar['open'],
                'high': bar['high'],
                'low': bar['low'],
                'close': bar['close'],
            })
