# backend/main.py
import csv
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from models import PredictRequest, PredictResponse
from predictor import find_top_matches, compute_stats
from mock_data import MOCK_HISTORY, load_csv_history

HISTORY_DB = Path(__file__).parent.parent / "history_database"
HISTORY_1H_PATH = HISTORY_DB / "Binance_ETHUSDT_1h.csv"
HISTORY_1D_PATH = HISTORY_DB / "Binance_ETHUSDT_d.csv"
EXAMPLE_1H_PATH = HISTORY_DB / "Binance_ETHUSDT_1h_test.csv"
EXAMPLE_1D_PATH = HISTORY_DB / "Binance_ETHUSDT_1d_test.csv"

HISTORY_1H = load_csv_history(HISTORY_1H_PATH) if HISTORY_1H_PATH.exists() else MOCK_HISTORY
HISTORY_1D = load_csv_history(HISTORY_1D_PATH) if HISTORY_1D_PATH.exists() else MOCK_HISTORY

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/example")
def get_example(n: int = Query(default=5, ge=1, le=50), timeframe: str = Query(default='1H')):
    path = EXAMPLE_1D_PATH if timeframe == '1D' else EXAMPLE_1H_PATH
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Example file not found: {path}")
    rows = []
    with open(path, newline='', encoding='utf-8') as f:
        lines = [l for l in f if l.strip()]
    # Skip URL header line if present
    header_idx = 1 if lines[0].strip().startswith('http') else 0
    reader = csv.DictReader(lines[header_idx:])
    headers = {k.strip().lower(): k for k in (reader.fieldnames or [])}
    for row in reader:
        if len(rows) >= n:
            break
        try:
            raw_date = row.get(headers.get('date', ''), '').strip()
            time_val = raw_date[:16] if timeframe == '1H' else raw_date[:10]
            rows.append({
                "open": float(row[headers["open"]]),
                "high": float(row[headers["high"]]),
                "low": float(row[headers["low"]]),
                "close": float(row[headers["close"]]),
                "time": time_val,
            })
        except (KeyError, ValueError):
            continue
    if not rows:
        raise HTTPException(status_code=422, detail="Could not parse OHLC columns from example file.")
    return {"rows": rows}


@app.post("/api/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> PredictResponse:
    history = HISTORY_1D if req.timeframe == "1D" else HISTORY_1H
    all_matches = find_top_matches(req.ohlc_data, history=history)
    if req.selected_ids:
        active = [m for m in all_matches if m.id in req.selected_ids]
        if not active:
            active = all_matches
    else:
        active = all_matches
    current_close = req.ohlc_data[-1].close
    stats = compute_stats(active, current_close)
    return PredictResponse(matches=all_matches, stats=stats)
