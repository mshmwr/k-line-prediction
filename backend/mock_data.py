# backend/mock_data.py
import numpy as np
from datetime import date, timedelta
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
