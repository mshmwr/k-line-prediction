# backend/main.py
import csv
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from models import PredictRequest, PredictResponse
from predictor import find_top_matches, compute_stats

EXAMPLE_CSV_PATH = Path("/Users/yclee/Desktop/Binance_ETHUSDT_1h_test.csv")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/example")
def get_example(n: int = Query(default=5, ge=1, le=50)):
    if not EXAMPLE_CSV_PATH.exists():
        raise HTTPException(status_code=404, detail=f"Example file not found: {EXAMPLE_CSV_PATH}")
    rows = []
    with open(EXAMPLE_CSV_PATH, newline='', encoding='utf-8') as f:
        lines = [l for l in f if l.strip()]
    # Skip URL header line if present
    header_idx = 1 if lines[0].strip().startswith('http') else 0
    reader = csv.DictReader(lines[header_idx:])
    headers = {k.strip().lower(): k for k in (reader.fieldnames or [])}
    for row in reader:
        if len(rows) >= n:
            break
        try:
            rows.append({
                "open": float(row[headers["open"]]),
                "high": float(row[headers["high"]]),
                "low": float(row[headers["low"]]),
                "close": float(row[headers["close"]]),
            })
        except (KeyError, ValueError):
            continue
    if not rows:
        raise HTTPException(status_code=422, detail="Could not parse OHLC columns from example file.")
    return {"rows": rows}


@app.post("/api/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> PredictResponse:
    all_matches = find_top_matches(req.ohlc_data)
    if req.selected_ids:
        active = [m for m in all_matches if m.id in req.selected_ids]
        if not active:
            active = all_matches
    else:
        active = all_matches
    current_close = req.ohlc_data[-1].close
    stats = compute_stats(active, current_close)
    return PredictResponse(matches=all_matches, stats=stats)
