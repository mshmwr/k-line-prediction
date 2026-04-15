---
title: K-Line Prediction — System Architecture
type: reference
tags: [K-Line-Prediction, Architecture, API]
updated: 2026-04-15
---

## Summary

ETH/USDT K 線型態相似度預測系統。使用者輸入近期 OHLC 數據，後端在歷史資料庫中找出最相似的歷史片段，計算 MA99 並提供後續走勢統計。新增 Homepage、多頁路由（BrowserRouter）、Business Logic 密碼保護頁（JWT 驗證）。

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | TypeScript + React + Recharts + Vite + react-router-dom |
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
│   │   ├── main.py               ← FastAPI app + endpoints + SPA fallback（最後一個 route）
│   │   ├── models.py             ← Pydantic request/response models
│   │   ├── predictor.py          ← 相似度搜尋 + MA99 計算核心
│   │   ├── time_utils.py         ← 時間格式正規化（統一 UTC+0）
│   │   ├── mock_data.py          ← 測試用假資料 + CSV loader
│   │   ├── auth.py               ← APIRouter + require_jwt dependency
│   │   ├── business_logic.md     ← 交易邏輯（密碼保護內容）
│   │   └── tests/
│   │       └── test_auth.py      ← AC-AUTH-1/2/4 測試
│   ├── frontend/
│   │   ├── public/
│   │   │   └── diary.json        ← DiaryMilestone[] 靜態資料
│   │   ├── e2e/
│   │   │   ├── business-logic.spec.ts
│   │   │   ├── pages.spec.ts
│   │   │   └── fixtures/
│   │   │       └── expired-token.ts
│   │   └── src/
│   │       ├── main.tsx          ← BrowserRouter + Routes 入口
│   │       ├── AppPage.tsx       ← 原 App.tsx（K-Line 預測主頁）
│   │       ├── types/
│   │       │   └── diary.ts      ← DiaryItem / DiaryMilestone
│   │       ├── hooks/
│   │       │   └── useAsyncState.ts ← async state hook
│   │       ├── pages/
│   │       │   ├── HomePage.tsx
│   │       │   ├── AboutPage.tsx
│   │       │   ├── DiaryPage.tsx
│   │       │   └── BusinessLogicPage.tsx
│   │       └── components/
│   │           ├── NavBar.tsx
│   │           ├── MainChart.tsx       ← 主圖表（歷史 + 預測走勢）
│   │           ├── MatchList.tsx       ← 相似案例列表
│   │           ├── OHLCEditor.tsx      ← OHLC 輸入表格
│   │           ├── StatsPanel.tsx      ← 統計面板
│   │           ├── PredictButton.tsx
│   │           ├── TopBar.tsx
│   │           ├── home/
│   │           │   ├── HeroSection.tsx
│   │           │   ├── ProjectsSection.tsx
│   │           │   ├── ProjectCard.tsx
│   │           │   ├── SkillsSection.tsx
│   │           │   ├── SkillTag.tsx
│   │           │   └── ContactSection.tsx
│   │           ├── about/
│   │           │   ├── AboutHeroSection.tsx
│   │           │   ├── ExperienceSection.tsx
│   │           │   ├── ExperienceItem.tsx
│   │           │   ├── EducationSection.tsx
│   │           │   ├── EducationItem.tsx
│   │           │   ├── OpenSourceSection.tsx
│   │           │   ├── RepoCard.tsx
│   │           │   └── ValuesSection.tsx
│   │           ├── diary/
│   │           │   ├── DiaryTimeline.tsx
│   │           │   ├── MilestoneSection.tsx
│   │           │   └── DiaryEntry.tsx
│   │           ├── business-logic/
│   │           │   ├── PasswordForm.tsx
│   │           │   └── BusinessLogicContent.tsx
│   │           └── common/
│   │               ├── LoadingSpinner.tsx
│   │               └── ErrorMessage.tsx
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

### `POST /api/auth`

密碼驗證，回傳 JWT token。

**Request** (`AuthRequest`):
```json
{ "password": "<string>" }
```

**Response** (`AuthResponse`):
```json
{ "token": "<JWT>" }
```
或 401（密碼錯誤）

**規格：**
- 密碼從 env var `BUSINESS_LOGIC_PASSWORD` 讀取
- JWT secret 從 env var `JWT_SECRET` 讀取
- JWT payload: `{ "sub": "business-logic-access", "iat": <unix>, "exp": iat + 86400 }`
- 密碼比對用 `hmac.compare_digest`（防 timing attack）
- `jwt.decode` 必須 pin `algorithms=["HS256"]`

---

### `GET /api/business-logic`

回傳密碼保護的交易邏輯內容。

**Header:** `Authorization: Bearer <token>`

**Response:**
```json
{ "content": "<markdown string>" }
```
或 401（token 無效或過期）

**規格：**
- 內容從 `backend/business_logic.md` 讀取
- 驗證用 `HTTPBearer` + `Depends(require_jwt)`（定義於 `auth.py`）

---

### SPA Fallback

`GET /{full_path:path}` → `FileResponse("dist/index.html")`

**必須是 main.py 最後一個 route**，在所有 `include_router()` 之後，讓前端 BrowserRouter 的路由由客戶端接管。

---

## Key Data Models

**後端 Pydantic Models:**
```python
OHLCBar:       open, high, low, close: float; time: str (ISO UTC)
MatchCase:     id, correlation, historical_ohlc, future_ohlc,
               start_date, end_date, historical_ma99, future_ma99
PredictStats:  highest/second_highest/second_lowest/lowest (OrderSuggestion),
               win_rate, mean_correlation
Ma99Gap:       from_date, to_date  # MA99 無法計算的缺口區間
AuthRequest:   password: str
AuthResponse:  token: str
```

**前端 TypeScript Types:**
```typescript
interface DiaryItem      { date: string; text: string }
interface DiaryMilestone { milestone: string; items: DiaryItem[] }
type AuthState = 'IDLE' | 'SHOW_PASSWORD_FORM' | 'LOADING_CONTENT' | 'SHOW_CONTENT' | 'SHOW_ERROR'
type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'
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

---

## Frontend Routing

使用 `react-router-dom` BrowserRouter，路由定義於 `main.tsx`。

| Path | Component | 說明 |
|------|-----------|------|
| `/` | `HomePage` | 個人首頁（Hero、Projects、Skills、Contact） |
| `/app` | `AppPage` | 原 K-Line 預測功能（原 App.tsx） |
| `/about` | `AboutPage` | 個人介紹（Experience、Education、OpenSource、Values） |
| `/diary` | `DiaryPage` | 工作日誌 Timeline（讀取 `public/diary.json`） |
| `/business-logic` | `BusinessLogicPage` | 交易邏輯（密碼保護，JWT 驗證後顯示） |
| `*` | `Navigate to /` | 未匹配路徑一律導回首頁 |

**注意：** `App.tsx` 已改名為 `AppPage.tsx`，原有的 K-Line 功能維持不變。

---

## Auth Flow（Business Logic）

`BusinessLogicPage` 掛載時的 token 狀態機：

```
mount → 讀 localStorage('bl_token')
  ├─ 無 token
  │   └─ → SHOW_PASSWORD_FORM
  ├─ 有 token，exp ≤ now（已過期）
  │   └─ 清除 localStorage → SHOW_PASSWORD_FORM + 過期提示
  └─ 有 token，exp > now（有效）
      └─ → LOADING_CONTENT → GET /api/business-logic
            ├─ 200 → SHOW_CONTENT（渲染 Markdown）
            └─ 401 → 清除 localStorage → SHOW_ERROR

SHOW_PASSWORD_FORM → 使用者輸入密碼 → POST /api/auth
  ├─ 200 → 存 token 至 localStorage → LOADING_CONTENT（接上面流程）
  └─ 401 → SHOW_ERROR（密碼錯誤提示）
```

**環境變數：**
- `BUSINESS_LOGIC_PASSWORD` — 驗證密碼
- `JWT_SECRET` — JWT 簽名 secret

**Token 規格：**
- Algorithm: HS256
- 有效期：24 小時（`exp = iat + 86400`）
- Subject: `"business-logic-access"`
