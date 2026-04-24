import os
import sys
from pathlib import Path
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# AC-TEST-HISTORY-INFO-1: GET /api/history-info 回傳 1H/1D 資訊
# ---------------------------------------------------------------------------

def test_history_info_returns_1h_and_1d(make_client):
    client = make_client()
    response = client.get("/api/history-info")
    assert response.status_code == 200
    body = response.json()
    assert "1H" in body
    assert "1D" in body
    assert "bar_count" in body["1H"]
    assert "bar_count" in body["1D"]
    assert body["1H"]["bar_count"] > 0
    assert body["1D"]["bar_count"] > 0


# ---------------------------------------------------------------------------
# AC-TEST-UPLOAD-1: POST /api/upload-history — 1H CSV happy path
# ---------------------------------------------------------------------------

STANDARD_1H_CSV = (
    "date,open,high,low,close\n"
    "2030-01-01 00:00,2000.0,2100.0,1950.0,2050.0\n"
    "2030-01-01 01:00,2050.0,2150.0,2000.0,2100.0\n"
)


def test_upload_1h_csv_happy_path(make_client, monkeypatch, tmp_path):
    """AC-TEST-UPLOAD-1 / AC-046-COMMENT-1/-2/-3: 1H happy path with K-046 invariants.

    Post-K-046: write block commented, so on-disk file + in-memory state must be
    byte-identical pre/post request. Response reads `existing` not `merged`.
    """
    client = make_client()
    import main

    history_file = tmp_path / "Binance_ETHUSDT_1h.csv"
    # Seed a known on-disk file so mtime_ns is meaningful
    history_file.write_text(
        "date,open,high,low,close\n"
        "2020-01-01 00:00,1000.0,1100.0,950.0,1050.0\n"
    )
    monkeypatch.setattr("main.HISTORY_1H_PATH", history_file)

    pre_mtime_ns = history_file.stat().st_mtime_ns
    pre_size = history_file.stat().st_size
    pre_bytes = history_file.read_bytes()
    pre_len = len(main._history_1h)
    pre_id = id(main._history_1h)

    response = client.post(
        "/api/upload-history",
        files={"file": ("Binance_ETHUSDT_1h.csv", STANDARD_1H_CSV.encode(), "text/csv")},
    )
    assert response.status_code == 200
    body = response.json()
    # Schema preserved
    assert set(body.keys()) == {"filename", "latest", "bar_count", "added_count", "timeframe"}
    assert body["timeframe"] == "1H"
    # K-046 honest semantics
    assert body["added_count"] == 0
    assert body["bar_count"] == pre_len
    # AC-046-COMMENT-1 file invariant
    assert history_file.stat().st_mtime_ns == pre_mtime_ns
    assert history_file.stat().st_size == pre_size
    assert history_file.read_bytes() == pre_bytes
    # AC-046-COMMENT-2 in-memory state invariant
    assert len(main._history_1h) == pre_len
    assert id(main._history_1h) == pre_id


# ---------------------------------------------------------------------------
# AC-TEST-UPLOAD-2: POST /api/upload-history — 1D 檔名偵測
# ---------------------------------------------------------------------------

STANDARD_1D_CSV = (
    "date,open,high,low,close\n"
    "2030-01-01,2000.0,2100.0,1950.0,2050.0\n"
    "2030-01-02,2050.0,2150.0,2000.0,2100.0\n"
)


def test_upload_1d_filename_detection(make_client, monkeypatch, tmp_path):
    """AC-TEST-UPLOAD-2 / AC-046-COMMENT-1/-2: 1D filename routing with K-046 invariants."""
    client = make_client()
    import main

    history_file = tmp_path / "Binance_ETHUSDT_d.csv"
    history_file.write_text(
        "date,open,high,low,close\n"
        "2020-01-01,1000.0,1100.0,950.0,1050.0\n"
    )
    monkeypatch.setattr("main.HISTORY_1D_PATH", history_file)

    pre_mtime_ns = history_file.stat().st_mtime_ns
    pre_size = history_file.stat().st_size
    pre_bytes = history_file.read_bytes()
    pre_len_1d = len(main._history_1d)
    pre_id_1d = id(main._history_1d)

    response = client.post(
        "/api/upload-history",
        files={"file": ("Binance_ETHUSDT_d.csv", STANDARD_1D_CSV.encode(), "text/csv")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["timeframe"] == "1D"
    # K-046 invariants on 1D branch
    assert body["added_count"] == 0
    assert body["bar_count"] == pre_len_1d
    assert history_file.stat().st_mtime_ns == pre_mtime_ns
    assert history_file.stat().st_size == pre_size
    assert history_file.read_bytes() == pre_bytes
    assert len(main._history_1d) == pre_len_1d
    assert id(main._history_1d) == pre_id_1d


# ---------------------------------------------------------------------------
# AC-TEST-UPLOAD-3: POST /api/upload-history — 空檔案 → 422
# ---------------------------------------------------------------------------

def test_upload_empty_file_returns_422(make_client):
    client = make_client()
    response = client.post(
        "/api/upload-history",
        files={"file": ("empty.csv", b"", "text/csv")},
    )
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# AC-TEST-UPLOAD-4: POST /api/upload-history — 重複上傳 added_count = 0
# ---------------------------------------------------------------------------

def test_upload_duplicate_bars_added_count_zero(make_client, monkeypatch, tmp_path):
    """AC-TEST-UPLOAD-4 / AC-046-COMMENT-1/-2: duplicate upload K-046 invariants.

    Note: before K-046, added_count was 0 because _merge_bars dedup kept the same
    bars. Post-K-046 it is 0 unconditionally. Augment with mtime + len + id.
    """
    client = make_client()
    import main

    history_file = tmp_path / "Binance_ETHUSDT_1h.csv"
    history_file.write_text(
        "date,open,high,low,close\n"
        "2020-01-01 00:00,1000.0,1100.0,950.0,1050.0\n"
    )
    monkeypatch.setattr("main.HISTORY_1H_PATH", history_file)

    pre_mtime_ns = history_file.stat().st_mtime_ns
    pre_bytes = history_file.read_bytes()
    pre_len = len(main._history_1h)
    pre_id = id(main._history_1h)

    client.post(
        "/api/upload-history",
        files={"file": ("Binance_ETHUSDT_1h.csv", STANDARD_1H_CSV.encode(), "text/csv")},
    )
    response = client.post(
        "/api/upload-history",
        files={"file": ("Binance_ETHUSDT_1h.csv", STANDARD_1H_CSV.encode(), "text/csv")},
    )
    assert response.status_code == 200
    assert response.json()["added_count"] == 0
    # K-046 invariants
    assert history_file.stat().st_mtime_ns == pre_mtime_ns
    assert history_file.read_bytes() == pre_bytes
    assert len(main._history_1h) == pre_len
    assert id(main._history_1h) == pre_id


# ---------------------------------------------------------------------------
# AC-046-QA-2: reversibility guard — strictly-later bars must NOT mutate state
# (This test FAILS if the K-046 write block is ever accidentally uncommented)
# ---------------------------------------------------------------------------

STRICTLY_LATER_1H_CSV = (
    "date,open,high,low,close\n"
    "2099-12-30 22:00,9000.0,9100.0,8950.0,9050.0\n"
    "2099-12-30 23:00,9050.0,9150.0,9000.0,9100.0\n"
    "2099-12-31 00:00,9100.0,9200.0,9050.0,9150.0\n"
)


def test_upload_strictly_later_bars_no_mutation(make_client, monkeypatch, tmp_path):
    """AC-046-QA-2 reversibility guard.

    Given N existing bars + CSV with M strictly-later bars (timestamps > all
    existing). If the write block were active, merged would have N+M entries
    and disk would be rewritten. Post-K-046: added_count == 0, state + disk
    byte-identical.
    """
    client = make_client()
    import main

    history_file = tmp_path / "Binance_ETHUSDT_1h.csv"
    history_file.write_text(
        "date,open,high,low,close\n"
        "2020-01-01 00:00,1000.0,1100.0,950.0,1050.0\n"
    )
    monkeypatch.setattr("main.HISTORY_1H_PATH", history_file)

    pre_mtime_ns = history_file.stat().st_mtime_ns
    pre_bytes = history_file.read_bytes()
    pre_len = len(main._history_1h)
    pre_id = id(main._history_1h)
    # Sanity: every uploaded timestamp must be strictly later than max existing
    max_existing = max(b["date"] for b in main._history_1h)
    assert max_existing < "2099-12-30"

    response = client.post(
        "/api/upload-history",
        files={
            "file": (
                "Binance_ETHUSDT_1h.csv",
                STRICTLY_LATER_1H_CSV.encode(),
                "text/csv",
            )
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["added_count"] == 0  # honest reporting — NOT 3
    assert body["bar_count"] == pre_len  # reads existing, NOT merged (which would be pre_len+3)
    # File + module state untouched
    assert history_file.stat().st_mtime_ns == pre_mtime_ns
    assert history_file.read_bytes() == pre_bytes
    assert len(main._history_1h) == pre_len
    assert id(main._history_1h) == pre_id


# ---------------------------------------------------------------------------
# AC-046-QA-4: example CSV fixture round-trip
# ---------------------------------------------------------------------------

def test_upload_example_csv_fixture_round_trip(make_client, monkeypatch, tmp_path):
    """AC-046-QA-4: the example CSV shipped at frontend/public/examples/
    must parse successfully through /api/upload-history (catches BOM/CRLF/
    column-reorder drift on the static asset).
    """
    client = make_client()
    import main

    # Resolve relative to this test file: backend/tests/test_main.py → repo root
    example_path = (
        Path(__file__).resolve().parent.parent.parent
        / "frontend"
        / "public"
        / "examples"
        / "ETHUSDT_1h_test.csv"
    )
    assert example_path.exists(), f"example fixture missing: {example_path}"
    example_bytes = example_path.read_bytes()
    # K-046 Phase 2: fixture refreshed to 24-row 12-col Binance raw klines
    # (headerless, microseconds Unix timestamps). Old 7-line / 646B fixture
    # failed parseOfficialCsvFile with OFFICIAL_ROW_COUNT=24 (see ticket B2).
    # Cross-reference monitor (K-046 Phase 2e Reviewer I-1): this byte-count
    # invariant pairs with frontend/src/__tests__/parseOfficialCsvFile.test.ts
    # (row-count=24 invariant). Both must stay green; either flipping red
    # signals fixture drift that needs coordinated update on both sides.
    assert len(example_bytes) == 3926, f"expected 3926B fixture, got {len(example_bytes)}B"

    history_file = tmp_path / "Binance_ETHUSDT_1h.csv"
    history_file.write_text(
        "date,open,high,low,close\n"
        "2020-01-01 00:00,1000.0,1100.0,950.0,1050.0\n"
    )
    monkeypatch.setattr("main.HISTORY_1H_PATH", history_file)
    pre_mtime_ns = history_file.stat().st_mtime_ns

    response = client.post(
        "/api/upload-history",
        files={"file": ("ETHUSDT_1h_test.csv", example_bytes, "text/csv")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["timeframe"] == "1H"  # not 1D — `1h` substring wins
    assert body["added_count"] == 0
    # Parse succeeded with ≥5 OHLCV bars (verify directly via helper)
    parsed = main._parse_csv_history_from_text(example_bytes.decode("utf-8"))
    assert len(parsed) >= 5
    # File untouched (K-046 invariant)
    assert history_file.stat().st_mtime_ns == pre_mtime_ns


# ---------------------------------------------------------------------------
# AC-TEST-EXAMPLE-1: GET /api/example — 檔案不存在 → 404
# ---------------------------------------------------------------------------

def test_example_file_not_found_returns_404(make_client, monkeypatch, tmp_path):
    client = make_client()
    monkeypatch.setattr("main.HISTORY_1H_PATH", tmp_path / "nonexistent.csv")

    response = client.get("/api/example?timeframe=1H")
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# AC-TEST-PARSE-1: _parse_csv_history_from_text — CryptoDataDownload 格式
# ---------------------------------------------------------------------------

CRYPTODATADOWNLOAD_CSV = (
    "https://www.CryptoDataDownload.com\n"
    "date,open,high,low,close\n"
    "2024-01-02 00:00,2100.0,2200.0,2050.0,2150.0\n"
    "2024-01-01 00:00,2000.0,2100.0,1950.0,2050.0\n"
)


def test_parse_csv_cryptodatadownload_format():
    for mod_name in ["auth", "main"]:
        if mod_name in sys.modules:
            del sys.modules[mod_name]
    import main

    bars = main._parse_csv_history_from_text(CRYPTODATADOWNLOAD_CSV)
    assert len(bars) == 2
    assert bars[0]["date"] < bars[1]["date"]
    assert bars[0]["open"] == 2000.0


# ---------------------------------------------------------------------------
# AC-TEST-PARSE-2: _parse_csv_history_from_text — Binance raw API 格式
# ---------------------------------------------------------------------------

BINANCE_RAW_CSV = (
    "1704067200000,2000.0,2100.0,1950.0,2050.0,100,1704070800000,204000,500,50,100000,0\n"
    "1704070800000,2050.0,2150.0,2000.0,2100.0,120,1704074400000,246000,600,60,126000,0\n"
)


def test_parse_csv_binance_raw_format():
    for mod_name in ["auth", "main"]:
        if mod_name in sys.modules:
            del sys.modules[mod_name]
    import main

    bars = main._parse_csv_history_from_text(BINANCE_RAW_CSV)
    assert len(bars) == 2
    assert bars[0]["open"] == 2000.0
    assert bars[1]["open"] == 2050.0


# ---------------------------------------------------------------------------
# AC-TEST-PARSE-3: _parse_csv_history_from_text — 空字串
# ---------------------------------------------------------------------------

def test_parse_csv_empty_string_returns_empty():
    for mod_name in ["auth", "main"]:
        if mod_name in sys.modules:
            del sys.modules[mod_name]
    import main

    bars = main._parse_csv_history_from_text("")
    assert bars == []


# ---------------------------------------------------------------------------
# AC-TEST-MERGE-1: _merge_bars — 去重並排序
# ---------------------------------------------------------------------------

def test_merge_bars_dedup_and_sort():
    for mod_name in ["auth", "main"]:
        if mod_name in sys.modules:
            del sys.modules[mod_name]
    import main

    existing = [
        {"date": "2024-01-01 00:00", "open": 1.0, "high": 2.0, "low": 0.5, "close": 1.5},
        {"date": "2024-01-02 00:00", "open": 1.5, "high": 2.5, "low": 1.0, "close": 2.0},
    ]
    new_bars = [
        {"date": "2024-01-02 00:00", "open": 9.9, "high": 9.9, "low": 9.9, "close": 9.9},
        {"date": "2024-01-03 00:00", "open": 2.0, "high": 3.0, "low": 1.5, "close": 2.5},
    ]
    merged = main._merge_bars(existing, new_bars)

    assert len(merged) == 3
    dates = [b["date"] for b in merged]
    assert dates == sorted(dates)
    jan2 = next(b for b in merged if "2024-01-02" in b["date"])
    assert jan2["open"] == 9.9


# ---------------------------------------------------------------------------
# GET /api/example 成功路徑（檔案存在）
# ---------------------------------------------------------------------------

def test_example_endpoint_returns_rows(make_client, monkeypatch, tmp_path):
    client = make_client()
    csv_file = tmp_path / "Binance_ETHUSDT_1h.csv"
    csv_file.write_text(
        "date,open,high,low,close\n"
        "2030-01-01 00:00,2000.0,2100.0,1950.0,2050.0\n"
        "2030-01-01 01:00,2050.0,2150.0,2000.0,2100.0\n"
    )
    monkeypatch.setattr("main.HISTORY_1H_PATH", csv_file)

    response = client.get("/api/example?timeframe=1H&n=2")
    assert response.status_code == 200
    body = response.json()
    assert "rows" in body
    assert len(body["rows"]) == 2


# ---------------------------------------------------------------------------
# _parse_csv_history_from_text — bad row skipped in Binance format
# ---------------------------------------------------------------------------

def test_parse_csv_binance_skips_short_row():
    for mod_name in ["auth", "main"]:
        if mod_name in sys.modules:
            del sys.modules[mod_name]
    import main

    text = (
        "1704067200000,2000.0,2100.0,1950.0,2050.0\n"
        "bad,only,two\n"
        "1704070800000,2050.0,2150.0,2000.0,2100.0\n"
    )
    bars = main._parse_csv_history_from_text(text)
    assert len(bars) == 2


# ---------------------------------------------------------------------------
# merge_and_compute_ma99 — 1D 分支 (L262)
# ---------------------------------------------------------------------------

def test_merge_and_compute_ma99_1d_branch(make_client):
    client = make_client()
    bars = [
        {"open": 2000.0, "high": 2100.0, "low": 1950.0, "close": 2050.0, "time": "2022-01-01 00:00"},
        {"open": 2050.0, "high": 2150.0, "low": 2000.0, "close": 2100.0, "time": "2022-01-02 00:00"},
    ]
    response = client.post("/api/merge-and-compute-ma99", json={"ohlc_data": bars, "timeframe": "1D"})
    assert response.status_code == 200
    body = response.json()
    assert "query_ma99_1d" in body


# ---------------------------------------------------------------------------
# AC-009-TEST: 1H predict path must pass ma_history=_history_1d to
# find_top_matches. Test is pure parameter-identity — does not assert on
# PRD business rules (MA99 thresholds, correlation scores).
# ---------------------------------------------------------------------------

def test_predict_1h_passes_history_1d_as_ma_history(make_client, monkeypatch):
    client = make_client()
    import main
    from models import MatchCase, OHLCBar, PredictStats, OrderSuggestion

    captured = {}

    def _fake_find_top_matches(input_bars, future_n=72, history=None,
                               timeframe='1H', ma_history=None, history_1d=None):
        captured['ma_history'] = ma_history
        captured['history'] = history
        captured['timeframe'] = timeframe
        captured['history_1d'] = history_1d
        # Return one minimal match so endpoint can proceed to compute_stats.
        future_bars = [
            OHLCBar(open=2000, high=2010, low=1990, close=2005, time='2024-02-01 01:00'),
            OHLCBar(open=2005, high=2015, low=1995, close=2010, time='2024-02-01 02:00'),
        ]
        return [MatchCase(
            id='match_0',
            correlation=0.9,
            historical_ohlc=[OHLCBar(open=2000, high=2010, low=1990, close=2000, time='')],
            future_ohlc=future_bars,
            start_date='2022-01-01',
            end_date='2022-01-02',
        )]

    monkeypatch.setattr(main, 'find_top_matches', _fake_find_top_matches)

    payload = {
        "ohlc_data": [
            {"open": 2000 + i, "high": 2010 + i, "low": 1990 + i,
             "close": 2005 + i, "time": f"2024-01-01 {i:02d}:00"}
            for i in range(4)
        ],
        "selected_ids": [],
        "timeframe": "1H",
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200, res.text
    # Identity check: ma_history must be the module's _history_1d object itself,
    # NOT the 1H history that was passed as `history`.
    assert captured['timeframe'] == '1H'
    assert captured['ma_history'] is main._history_1d
    assert captured['ma_history'] is not captured['history']
