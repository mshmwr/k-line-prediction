---
title: K-Line Prediction — System Architecture
type: reference
tags: [K-Line-Prediction, Architecture, API]
updated: 2026-04-09
---

## Summary

ETH/USDT K 線型態相似度預測系統。使用者輸入近期 OHLC 數據，後端在歷史資料庫中找出最相似的歷史片段，計算 MA99 並提供後續走勢統計。

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | TypeScript + React + Recharts + Vite |
| Backend | Python + FastAPI |
| Tests (FE) | Vitest + Playwright |
| Tests (BE) | pytest |

---

## Directory Structure

```
ClaudeCodeProject/
├── docs/                    ← 共享架構文件（本目錄）
├── CLAUDE.md                ← Claude Code 專案指令
├── AGENTS.md                ← Codex 專案指令
├── K-Line-Prediction/
│   ├── backend/
│   │   ├── main.py          ← FastAPI app + endpoints
│   │   ├── models.py        ← Pydantic request/response models
│   │   ├── predictor.py     ← 相似度搜尋 + MA99 計算核心
│   │   ├── time_utils.py    ← 時間格式正規化（統一 UTC+0）
│   │   ├── mock_data.py     ← 測試用假資料 + CSV loader
│   │   └── tests/
│   ├── frontend/
│   │   └── src/
│   │       ├── App.tsx
│   │       └── components/
│   │           ├── MainChart.tsx   ← 主圖表（歷史 + 預測走勢）
│   │           ├── MatchList.tsx   ← 相似案例列表
│   │           ├── OHLCEditor.tsx  ← OHLC 輸入表格
│   │           ├── StatsPanel.tsx  ← 統計面板
│   │           ├── PredictButton.tsx
│   │           └── TopBar.tsx
│   └── history_database/
│       ├── Binance_ETHUSDT_1h.csv
│       └── Binance_ETHUSDT_d.csv
```

---

## API Endpoints

### `POST /api/predict`

主預測端點。

**Request** (`PredictRequest`):
```json
{
  "ohlc_data": [{"open": 0, "high": 0, "low": 0, "close": 0, "time": "2026-01-01T00:00:00"}],
  "selected_ids": [],
  "timeframe": "1H",
  "ma99_trend_override": null
}
```

**Response** (`PredictResponse`):
```json
{
  "matches": [MatchCase],
  "stats": PredictStats,
  "query_ma99": [float | null],
  "query_ma99_gap": {"from_date": "...", "to_date": "..."} | null
}
```

---

### `POST /api/merge-and-compute-ma99`

僅計算 MA99，不做預測（前端早期載入 MA99 用）。

**Request** (`Ma99Request`): `{ ohlc_data, timeframe }`
**Response** (`Ma99Response`): `{ query_ma99, query_ma99_gap }`

---

### `POST /api/upload-history`

上傳 CSV 歷史資料，自動合併去重後寫入 `history_database/`。
支援三種 CSV 格式：CryptoDataDownload、標準 header、Binance raw API。

---

### `GET /api/history-info`

回傳 1H / 1D 歷史資料的最新日期與筆數。

---

### `GET /api/example?n=5&timeframe=1H`

從歷史資料庫讀取前 N 筆作為範例輸入。

---

### `GET /api/official-input`

從環境變數 `OFFICIAL_INPUT_CSV_PATH` 指定的路徑載入官方輸入 CSV。

---

## Key Data Models

```python
OHLCBar:       open, high, low, close: float; time: str (ISO UTC)
MatchCase:     id, correlation, historical_ohlc, future_ohlc,
               start_date, end_date, historical_ma99, future_ma99
PredictStats:  highest/second_highest/second_lowest/lowest (OrderSuggestion),
               win_rate, mean_correlation
Ma99Gap:       from_date, to_date  # MA99 無法計算的缺口區間
```

---

## Data Flow

```
使用者輸入 OHLC
  → OHLCEditor (前端)
  → POST /api/predict (FastAPI)
  → find_top_matches() [predictor.py]
      ├─ 從 history_database 讀取歷史 CSV
      ├─ 計算每段歷史的 Pearson correlation
      ├─ 篩選 MA99 方向一致的片段
      └─ 回傳 top N matches + stats
  → PredictResponse
  → MainChart + MatchList + StatsPanel (前端渲染)
```

---

## Time Format Convention

**所有時間統一使用 UTC+0 的 ISO 8601 格式。**

- 後端：`time_utils.normalize_bar_time()` 負責統一轉換
- 前端：`time` 欄位直接傳遞，不做時區轉換
- 歷史 CSV：`date` 欄位應為 UTC+0

> 此規範源自 2026-04 的 bug fix：UTC vs UTC+8 混用導致 MA99 方向判斷錯誤。

---

## Frontend ↔ Backend Field Mapping

| Backend (snake_case) | Frontend (camelCase) |
|---------------------|---------------------|
| `ohlc_data` | `ohlcData` |
| `selected_ids` | `selectedIds` |
| `ma99_trend_override` | `ma99TrendOverride` |
| `start_date` | `startDate` |
| `end_date` | `endDate` |
| `historical_ohlc` | `historicalOhlc` |
| `future_ohlc` | `futureOhlc` |
| `historical_ma99` | `historicalMa99` |
| `future_ma99` | `futureMa99` |
| `win_rate` | `winRate` |
| `mean_correlation` | `meanCorrelation` |
| `query_ma99` | `queryMa99` |
| `query_ma99_gap` | `queryMa99Gap` |
