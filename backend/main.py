import os
import csv
import io
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from models import PredictRequest, PredictResponse, Ma99Request, Ma99Response
from predictor import find_top_matches, compute_stats, get_prefix_bars, _compute_ma99_for_window, _extract_ma99_gap
from mock_data import MOCK_HISTORY, load_csv_history, load_official_day_csv
from time_utils import normalize_bar_time

HISTORY_DB = Path(__file__).parent.parent / "history_database"
HISTORY_1H_PATH = HISTORY_DB / "Binance_ETHUSDT_1h.csv"
HISTORY_1D_PATH = HISTORY_DB / "Binance_ETHUSDT_d.csv"
OFFICIAL_INPUT_PATH = Path(
    os.environ.get("OFFICIAL_INPUT_CSV_PATH", "")
) if os.environ.get("OFFICIAL_INPUT_CSV_PATH") else None

def _load_or_mock(path: Path) -> list:
    if path.exists():
        bars = load_csv_history(path)
        return bars if bars else list(MOCK_HISTORY)
    return list(MOCK_HISTORY)

# Mutable in-memory history (updated by upload and predict endpoints)
_history_1h: list = _load_or_mock(HISTORY_1H_PATH)
_history_1d: list = _load_or_mock(HISTORY_1D_PATH)

app = FastAPI()
_cors_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    if not OFFICIAL_INPUT_PATH or not OFFICIAL_INPUT_PATH.exists():
        raise HTTPException(status_code=404, detail="Official input file not configured or not found.")
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
    is_1d = req.timeframe == "1D"
    history = _history_1d if is_1d else _history_1h

    input_bars_with_time = [
        {
            'date': bar.time,
            'open': bar.open,
            'high': bar.high,
            'low': bar.low,
            'close': bar.close,
        }
        for bar in req.ohlc_data
        if bar.time
    ]
    # Merge in memory only for prefix context computation — do NOT persist to disk
    if input_bars_with_time:
        history = _merge_bars(history, input_bars_with_time)

    first_input_time = req.ohlc_data[0].time if req.ohlc_data else ''
    query_prefix = get_prefix_bars(history, first_input_time, req.timeframe)
    query_ma99 = _compute_ma99_for_window(req.ohlc_data, query_prefix)
    query_ma99_gap = _extract_ma99_gap(req.ohlc_data, query_ma99)

    if is_1d:
        return Ma99Response(query_ma99_1d=query_ma99, query_ma99_gap_1d=query_ma99_gap)
    else:
        return Ma99Response(query_ma99_1h=query_ma99, query_ma99_gap_1h=query_ma99_gap)


@app.post("/api/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> PredictResponse:
    is_1d = req.timeframe == "1D"
    history = _history_1d if is_1d else _history_1h

    # Merge input bars in memory only for pattern matching context — do NOT persist to disk
    input_bars_with_time = [
        {'date': bar.time, 'open': bar.open, 'high': bar.high, 'low': bar.low, 'close': bar.close}
        for bar in req.ohlc_data if bar.time
    ]
    if input_bars_with_time:
        history = _merge_bars(history, input_bars_with_time)

    try:
        all_matches = find_top_matches(
            req.ohlc_data,
            history=history,
            timeframe=req.timeframe,
            history_1d=_history_1d,
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
    stats = compute_stats(active, current_close, req.timeframe)

    # 計算 query MA99
    first_input_time = req.ohlc_data[0].time if req.ohlc_data else ''
    query_prefix = get_prefix_bars(history, first_input_time, req.timeframe)
    query_ma99 = _compute_ma99_for_window(req.ohlc_data, query_prefix)
    query_ma99_gap = _extract_ma99_gap(req.ohlc_data, query_ma99)

    if is_1d:
        return PredictResponse(
            matches=all_matches,
            stats=stats,
            query_ma99_1d=query_ma99,
            query_ma99_gap_1d=query_ma99_gap,
        )
    else:
        return PredictResponse(
            matches=all_matches,
            stats=stats,
            query_ma99_1h=query_ma99,
            query_ma99_gap_1h=query_ma99_gap,
        )
