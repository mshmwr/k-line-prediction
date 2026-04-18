import sys
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
    client = make_client()
    monkeypatch.setattr("main.HISTORY_1H_PATH", tmp_path / "Binance_ETHUSDT_1h.csv")

    response = client.post(
        "/api/upload-history",
        files={"file": ("Binance_ETHUSDT_1h.csv", STANDARD_1H_CSV.encode(), "text/csv")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["timeframe"] == "1H"
    assert body["added_count"] > 0
    assert body["bar_count"] >= 2


# ---------------------------------------------------------------------------
# AC-TEST-UPLOAD-2: POST /api/upload-history — 1D 檔名偵測
# ---------------------------------------------------------------------------

STANDARD_1D_CSV = (
    "date,open,high,low,close\n"
    "2030-01-01,2000.0,2100.0,1950.0,2050.0\n"
    "2030-01-02,2050.0,2150.0,2000.0,2100.0\n"
)


def test_upload_1d_filename_detection(make_client, monkeypatch, tmp_path):
    client = make_client()
    monkeypatch.setattr("main.HISTORY_1D_PATH", tmp_path / "Binance_ETHUSDT_d.csv")

    response = client.post(
        "/api/upload-history",
        files={"file": ("Binance_ETHUSDT_d.csv", STANDARD_1D_CSV.encode(), "text/csv")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["timeframe"] == "1D"


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
    client = make_client()
    monkeypatch.setattr("main.HISTORY_1H_PATH", tmp_path / "Binance_ETHUSDT_1h.csv")

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
