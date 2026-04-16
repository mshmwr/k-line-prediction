---
id: K-001
title: 後端測試補強 — main.py route handler coverage 提升
status: open
type: test
priority: medium
created: 2026-04-16
---

## 背景

目前後端整體 coverage 71%，其中 `main.py` 僅 45%。所有 FastAPI route handler 缺乏直接整合測試，現有覆蓋主要來自 `predictor.py` unit test 間接執行的邏輯。

`GET /api/business-logic` 有效 token → 200 的測試缺口已在 Phase 3 review 時記錄（PRD line 239），但至今未補。

**目標：** `main.py` coverage ≥ 80%。

## 驗收條件

對應 PRD AC（見 `PRD.md`）：

| AC | 說明 |
|----|------|
| AC-TEST-AUTH-3 | 有效 token → GET /api/business-logic → 200 + content |
| AC-TEST-AUTH-5 | business_logic.md 不存在 → 404 |
| AC-TEST-HISTORY-INFO-1 | GET /api/history-info 回傳 1H/1D 資訊 |
| AC-TEST-UPLOAD-1 | POST /api/upload-history — 1H CSV happy path |
| AC-TEST-UPLOAD-2 | POST /api/upload-history — 1D 檔名偵測 |
| AC-TEST-UPLOAD-3 | POST /api/upload-history — 空檔案 → 422 |
| AC-TEST-UPLOAD-4 | POST /api/upload-history — 重複上傳 added_count = 0 |
| AC-TEST-EXAMPLE-1 | GET /api/example — 檔案不存在 → 404 |
| AC-TEST-PARSE-1 | _parse_csv_history_from_text — CryptoDataDownload 格式 |
| AC-TEST-PARSE-2 | _parse_csv_history_from_text — Binance raw API 格式 |
| AC-TEST-PARSE-3 | _parse_csv_history_from_text — 空字串 |
| AC-TEST-MERGE-1 | _merge_bars — 去重並排序 |

## 範圍

**含：**
- 新增 `backend/tests/test_main.py`
- 補充 `backend/tests/test_auth.py`（AC-TEST-AUTH-3、AC-TEST-AUTH-5）
- 使用 `tmp_path` fixture，不依賴磁碟上的真實 history 資料庫

**不含：**
- `GET /api/official-input`（需 `OFFICIAL_INPUT_CSV_PATH` env var，視為 optional 功能，暫不覆蓋）
- `GET /{full_path:path}` SPA fallback（需要 `dist/` 存在，屬於 deploy-time 路徑）
- `time_utils.py`、`mock_data.py` 的 coverage 提升（另開單處理）

## 測試策略

- `TestClient(app)` from `fastapi.testclient`
- `monkeypatch` 設定 `JWT_SECRET`、`BUSINESS_LOGIC_PASSWORD` env vars
- `tmp_path` 建立臨時 CSV 與 `business_logic.md`，透過 monkeypatch 覆寫路徑常數

## 相關連結

- [PRD.md — Backlog 後端測試補強](../../PRD.md#backlog--後端測試補強backend-test-coverage)
- [backend/tests/test_auth.py](../../backend/tests/test_auth.py)
- [backend/main.py](../../backend/main.py)
