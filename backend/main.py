import os
import csv
import io
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from models import PredictRequest, PredictResponse, Ma99Request, Ma99Response
from predictor import (
    find_top_matches,
    compute_stats,
    get_prefix_bars,
    _compute_ma99_for_window,
    _extract_ma99_gap,
    aggregate_ohlc_bars,
)
from mock_data import MOCK_HISTORY, load_csv_history, load_official_day_csv
from time_utils import normalize_bar_time

HISTORY_DB = Path(__file__).parent.parent / "history_database"
HISTORY_1H_PATH = HISTORY_DB / "Binance_ETHUSDT_1h.csv"
HISTORY_1D_PATH = HISTORY_DB / "Binance_ETHUSDT_d.csv"
OFFICIAL_INPUT_PATH = Path(
    os.environ.get("OFFICIAL_INPUT_CSV_PATH", "/Users/yclee/Desktop/ETHUSDT-1h-2026-04-02.csv")
)

def _load_or_mock(path: Path) -> list:
    if path.exists():
        bars = load_csv_history(path)
        return bars if bars else list(MOCK_HISTORY)
    return list(MOCK_HISTORY)

# Mutable in-memory history (updated by upload and predict endpoints)
_history_1h: list = _load_or_mock(HISTORY_1H_PATH)
_history_1d: list = _load_or_mock(HISTORY_1D_PATH)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _merge_bars(existing: list, new_bars: list) -> list:
    """Merge new_bars into existing, dedup by normalized 'date', sort chronologically."""
    combined = {normalize_bar_time(bar['date']): {**bar, 'date': normalize_bar_time(bar['date'])} for bar in existing}
    combined.update({normalize_bar_time(bar['date']): {**bar, 'date': normalize_bar_time(bar['date'])} for bar in new_bars})
    return sorted(combined.values(), key=lambda b: b['date'])


def _bars_to_dicts(ohlc_bars) -> list:
    return [
        {
            'date': bar.time,
            'open': bar.open,
            'high': bar.high,
            'low': bar.low,
            'close': bar.close,
        }
        for bar in ohlc_bars
        if bar.time
    ]


def _compute_query_ma_payload(ohlc_data, history_1h: list, history_1d: list):
    input_bars_with_time = _bars_to_dicts(ohlc_data)
    history_1h_merged = _merge_bars(history_1h, input_bars_with_time) if input_bars_with_time else history_1h
    aggregated_input_1d = aggregate_ohlc_bars(input_bars_with_time, '1D')
    history_1d_merged = _merge_bars(history_1d, aggregated_input_1d) if aggregated_input_1d else history_1d

    first_input_time_1h = ohlc_data[0].time if ohlc_data else ''
    query_prefix_1h = get_prefix_bars(history_1h_merged, first_input_time_1h, '1H')
    query_ma99_1h = _compute_ma99_for_window(ohlc_data, query_prefix_1h)
    query_ma99_gap_1h = _extract_ma99_gap(ohlc_data, query_ma99_1h)

    input_bars_1d = aggregate_ohlc_bars(ohlc_data, '1D')
    first_input_time_1d = input_bars_1d[0]['date'] if input_bars_1d else ''
    query_prefix_1d = get_prefix_bars(history_1d_merged, first_input_time_1d, '1D')
    query_ma99_1d = _compute_ma99_for_window(input_bars_1d, query_prefix_1d) if input_bars_1d else []
    query_ma99_gap_1d = _extract_ma99_gap(input_bars_1d, query_ma99_1d) if input_bars_1d else None

    return {
        'history_1h': history_1h_merged,
        'history_1d': history_1d_merged,
        'query_ma99_1h': query_ma99_1h,
        'query_ma99_gap_1h': query_ma99_gap_1h,
        'query_ma99_1d': query_ma99_1d,
        'query_ma99_gap_1d': query_ma99_gap_1d,
    }


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


def _parse_csv_history_from_text(text: str) -> list:
    """Parse CSV history from text content. Supports:
    - CryptoDataDownload (newest-first, starts with http URL)
    - Standard CSV with date/unix/open/high/low/close header
    - Binance raw API (no header, positional: open_time,open,high,low,close,...)
    """
    lines = [l for l in text.splitlines() if l.strip()]
    if not lines:
        return []

    # Detect Binance raw API format: first field of first line is a pure integer timestamp
    first_field = lines[0].strip().split(',')[0].strip()
    if first_field.lstrip('-').isdigit():
        bars = []
        for line in lines:
            cols = [c.strip() for c in line.split(',')]
            if len(cols) < 5:
                continue
            try:
                bars.append({
                    'date': normalize_bar_time(cols[0]),
                    'open': float(cols[1]),
                    'high': float(cols[2]),
                    'low': float(cols[3]),
                    'close': float(cols[4]),
                })
            except (ValueError, OSError):
                continue
        return bars

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


@app.get("/api/history-info")
def get_history_info():
    def info(history: list, path: Path) -> dict:
        return {
            'filename': path.name if path.exists() else 'mock data (no file)',
            'latest': history[-1]['date'] if history else None,
            'bar_count': len(history),
        }
    return {
        '1H': info(_history_1h, HISTORY_1H_PATH),
        '1D': info(_history_1d, HISTORY_1D_PATH),
    }


@app.post("/api/upload-history")
async def upload_history_file(file: UploadFile = File(...)):
    global _history_1h, _history_1d
    content = await file.read()
    try:
        text = content.decode('utf-8')
    except UnicodeDecodeError:
        text = content.decode('latin-1')

    new_bars = _parse_csv_history_from_text(text)
    if not new_bars:
        raise HTTPException(status_code=422, detail='Could not parse any bars from the uploaded file.')

    filename = file.filename or ''
    name_lower = filename.lower()
    is_1d = ('1d' in name_lower or name_lower.endswith('_d.csv') or '_d_' in name_lower)
    target_path = HISTORY_1D_PATH if is_1d else HISTORY_1H_PATH
    existing = _history_1d if is_1d else _history_1h

    original_count = len(existing)
    merged = _merge_bars(existing, new_bars)
    added_count = len(merged) - original_count

    if added_count > 0:
        _save_history_csv(merged, target_path)
        if is_1d:
            _history_1d = merged
        else:
            _history_1h = merged

    latest = merged[-1]['date'] if merged else None
    return {
        'filename': target_path.name,
        'latest': latest,
        'bar_count': len(merged),
        'added_count': added_count,
        'timeframe': '1D' if is_1d else '1H',
    }


@app.get("/api/example")
def get_example(n: int = Query(default=5, ge=1, le=300), timeframe: str = Query(default='1H')):
    path = HISTORY_1D_PATH if timeframe == '1D' else HISTORY_1H_PATH
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Example file not found: {path}")
    rows = []
    with open(path, newline='', encoding='utf-8') as f:
        lines = [l for l in f if l.strip()]
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


@app.get("/api/official-input")
def get_official_input():
    if not OFFICIAL_INPUT_PATH.exists():
        raise HTTPException(status_code=404, detail=f"Official input file not found: {OFFICIAL_INPUT_PATH}")
    try:
        rows = load_official_day_csv(OFFICIAL_INPUT_PATH)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    if not rows:
        raise HTTPException(status_code=422, detail="Official input file is empty.")
    return {
        "rows": [
            {
                "open": row["open"],
                "high": row["high"],
                "low": row["low"],
                "close": row["close"],
                "time": row["date"],
            }
            for row in rows
        ],
        "source_path": str(OFFICIAL_INPUT_PATH),
        "timeframe": "1H",
    }


@app.post("/api/merge-and-compute-ma99", response_model=Ma99Response)
def merge_and_compute_ma99(req: Ma99Request) -> Ma99Response:
    payload = _compute_query_ma_payload(req.ohlc_data, _history_1h, _history_1d)
    return Ma99Response(
        query_ma99_1h=payload['query_ma99_1h'],
        query_ma99_1d=payload['query_ma99_1d'],
        query_ma99_gap_1h=payload['query_ma99_gap_1h'],
        query_ma99_gap_1d=payload['query_ma99_gap_1d'],
    )


@app.post("/api/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> PredictResponse:
    query_payload = _compute_query_ma_payload(req.ohlc_data, _history_1h, _history_1d)
    history = query_payload['history_1d'] if req.timeframe == "1D" else query_payload['history_1h']
    ma_history = query_payload['history_1d']

    try:
        all_matches = find_top_matches(
            req.ohlc_data,
            history=history,
            timeframe=req.timeframe,
            ma99_trend_override=req.ma99_trend_override,
            ma_history=ma_history,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    if not all_matches:
        raise HTTPException(status_code=422, detail="No historical matches were found with the same MA99 trend direction.")
    if req.selected_ids:
        active = [m for m in all_matches if m.id in req.selected_ids]
        if not active:
            active = all_matches
    else:
        active = all_matches
    current_close = req.ohlc_data[-1].close
    stats = compute_stats(active, current_close, req.timeframe, req.ohlc_data[-1].time if req.ohlc_data else '')

    return PredictResponse(
        matches=all_matches,
        stats=stats,
        query_ma99_1h=query_payload['query_ma99_1h'],
        query_ma99_1d=query_payload['query_ma99_1d'],
        query_ma99_gap_1h=query_payload['query_ma99_gap_1h'],
        query_ma99_gap_1d=query_payload['query_ma99_gap_1d'],
    )
