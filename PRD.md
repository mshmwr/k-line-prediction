# Product Requirements Document

## Product
K-Line historical pattern matching and scenario forecasting

## Goal
Find historical segments that are similar to the user's current K-line structure while keeping the MA99 trend aligned. The system should avoid cases where the current setup is under a falling MA99 but the returned matches come from rising-MA99 environments, or vice versa.

## Core Matching Logic

### Input sources
- OHLC input remains the primary data source.
- Users can provide OHLC through CSV upload, JSON import, manual editing, or example data.
- Users may additionally upload a chart screenshot that shows the MA99 line and choose the MA99 trend direction from the screenshot.

### Similarity model
- Do not match on `close` only.
- For each bar, derive candle-shape features:
  - body percent
  - full range percent
  - upper wick percent
  - lower wick percent
  - close-to-close return percent
- Compare historical windows using normalized similarity over the derived candle feature vector.

### MA99 trend requirement
- Historical candidates must have an MA99 trend direction that matches the query trend direction.
- MA99 direction should be treated as a gate before final ranking.
- When MA99 direction differs, the candidate must be excluded.

### MA99 source priority
1. Direct OHLC calculation
   - If the input segment contains enough data to compute MA99 directly, use the query OHLC itself.
2. Historical backfill
   - If the input segment is shorter than 99 bars but each row includes time values that can be aligned to the project history database, the system should fetch the bars immediately before the input segment and use them to compute MA99.
3. Screenshot-assisted override
   - If direct calculation and historical backfill are both unavailable, the user may upload a screenshot and manually specify whether MA99 is `up`, `down`, or `flat`.
   - In this mode, MA99 is used as a trend-direction filter only.
   - In this mode, no precise MA99 similarity score is computed for the query segment.

### Final ranking
- If query MA99 is available as a numeric series:
  - `final_score = 0.6 * candle_score + 0.4 * ma_score`
- If query MA99 comes from screenshot override only:
  - `final_score = candle_score`
  - MA99 direction is still used as a hard gate

## Statistics Logic
- Stats are computed from the selected match set.
- Match List:
  - each match includes the matched historical segment plus the actual next 72 x 1H bars from history
  - the expanded match chart must show these raw future bars, not a projected or aggregated chart
- Statistics:
  - build a projected 72 x 1H candle path from the selected match set
  - for each future hour bucket, rebase every selected match's future OHLC by its historical base close and project it onto the current input close
  - aggregate each hour bucket with median open, median close, median high, and median low to form one projected candle
  - the Statistics chart must visualize this aggregated projected 72-hour path
- Overall stats (across all 72 projected bars):
  - highest = highest `high` found on the projected 72-hour chart
  - second highest = second-highest `high` found on the projected 72-hour chart
  - lowest = lowest `low` found on the projected 72-hour chart
  - second lowest = second-lowest `low` found on the projected 72-hour chart
  - occurrence window = the actual UTC+8 datetime where that projected extreme appears
  - win rate = share of projected candles whose close is above the current close
  - mean correlation = average match score
- Per-day stats (Day 1 / Day 2 / Day 3, each covering 24 projected bars):
  - highest = highest `high` within that day's 24 projected bars
  - lowest = lowest `low` within that day's 24 projected bars
  - occurrence window = actual UTC+8 datetime of the extreme within that day
- Time display:
  - all occurrence windows must show actual UTC+8 datetimes (format: MM/DD HH:mm) derived from the last bar of the user's input
  - the Statistics chart x-axis must show actual UTC+8 datetimes at day boundaries (Hour +1, Hour +25, Hour +49, Hour +72)

## Input Validation
- The predict button is enabled only when all visible OHLC rows are numerically complete.
- If all matches are unchecked, prediction must be disabled until at least one case is selected.
- If the query is shorter than 99 bars and cannot be aligned to history by time, the backend must require either:
  - aligned timestamps that allow historical backfill, or
  - an MA99 screenshot override direction

## API

### POST `/api/merge-and-compute-ma99`
Payload
- `ohlc_data`: array of OHLC rows (merged from the two uploaded CSV files)
- `timeframe`: `1H` or `1D`

Response
- `query_ma99`: MA99 series for the uploaded query segment (`(number | null)[]`)
- `query_ma99_gap`: `null` if fully populated; otherwise `{ from_date, to_date }` indicating the date range where data was missing

Purpose: Called immediately after the official CSV files are uploaded (before prediction) so that the MA99 line and header value can be rendered on the main chart without waiting for the user to click the predict button.

Note: This endpoint does NOT persist uploaded OHLC data to the history database. The merge is performed in memory only to provide the historical prefix needed for MA99 computation. History database updates must go through `/api/upload-history`.

### POST `/api/predict`
Payload
- `ohlc_data`: array of OHLC rows with optional `time`
- `selected_ids`: array of selected match ids
- `timeframe`: `1H` or `1D`
- `ma99_trend_override`: optional `up`, `down`, or `flat`

Response
- `matches`: array of match cases; each case includes:
  - `historical_ohlc`: matched historical segment (1H bars)
  - `future_ohlc`: actual future 1H bars following the matched segment
  - `historical_ma99`: MA99 values aligned to the matched historical segment (`(number | null)[]`)
  - `future_ma99`: MA99 values aligned to the future 1H bars (`(number | null)[]`)
  - `historical_ohlc_1d`: matched historical segment aggregated into daily bars (aggregated from `historical_ohlc`)
  - `future_ohlc_1d`: future bars aggregated into daily bars (aggregated from `future_ohlc` 1H data)
  - `historical_ma99_1d`: MA99 values aligned to `historical_ohlc_1d` (computed against `history_1d` prefix)
  - `future_ma99_1d`: MA99 values aligned to `future_ohlc_1d`
  - `start_date`, `end_date`: time range of the matched historical segment
  - `correlation`: similarity score
- `stats`: aggregated statistics across all selected matches
- `query_ma99`: MA99 series for the current query segment (`(number | null)[]`); used to render the MA99 line on the main chart and display the latest value in the chart header
- `query_ma99_gap`: `null` if the MA99 series is fully populated; otherwise `{ from_date, to_date }` indicating the date range where data was missing and MA99 could not be computed

Note: This endpoint does NOT persist uploaded OHLC data to the history database. The merge is in-memory only.

### POST `/api/upload-history`
Payload: multipart/form-data with a single `file` field (CSV).

Response
- `filename`: the canonical filename saved to disk (e.g. `Binance_ETHUSDT_1h.csv`)
- `latest`: the most recent bar's date string in UTC+0 `YYYY-MM-DD HH:MM` format, or `null` if the database is empty
- `bar_count`: total number of bars currently in the database after the merge
- `added_count`: number of net-new bars added in this upload (0 means all bars already existed)
- `timeframe`: `"1H"` or `"1D"` as detected from the uploaded file

Purpose: Appends new bars to the persistent history database on disk. The endpoint deduplicates by normalized UTC timestamp so re-uploading overlapping data is safe.

Supported CSV formats:
- **CryptoDataDownload**: first line is a URL comment; header on second line; rows ordered newest-first (auto-reversed)
- **Standard CSV**: header on first line with `date`/`unix`/`open`/`high`/`low`/`close` columns; chronological order
- **Binance raw API**: no header; positional columns `open_time, open, high, low, close, …`; `open_time` is a Unix timestamp in milliseconds

Note: All timestamp formats are normalized to UTC `YYYY-MM-DD HH:MM` by `time_utils.normalize_bar_time` before storage. The file is only written to disk when `added_count > 0`.

## Timezone Convention

All timestamps are stored and transmitted as **UTC+0** in `YYYY-MM-DD HH:MM` format (16 characters). The display layer is responsible for converting to **UTC+8** for user-facing text.

- Backend (`time_utils.normalize_bar_time`): accepts any input format (Unix timestamps in any unit, ISO strings, `HH:MM:SS`) and outputs UTC+0 `YYYY-MM-DD HH:MM`.
- Frontend storage / API payloads: UTC+0.
- Frontend display (`utils/time.toUTC8Display`): converts UTC+0 → UTC+8 at render time only.
- Chart rendering (lightweight-charts): timestamps are shifted by +8 h before passing to the library so that the chart's UTC-based x-axis shows UTC+8 labels.

## UX Notes
- Keep OHLC input and MA99 assistance as separate UI concepts.
- Screenshot upload is optional and should be described as an MA99 assist path, not as the main data input.
- When screenshot-assisted override is active, users should understand that MA99 is being used as a directional filter rather than a fully reconstructed MA99 series.
- Match List and Statistics must be labeled clearly so users can distinguish between:
  - actual future historical bars in each matched case
  - the aggregated projected chart used for statistics and order suggestions
- After prediction, the main chart header must display the latest non-null value from `query_ma99` formatted as `MA(99) x,xxx.xx`.
- If `query_ma99_gap` is non-null, a warning banner must appear below the main chart indicating the affected date range (e.g., `MA99 資料缺失：2024-01-01 ~ 2024-01-10`).
- Each expanded match card must display a mini chart that overlays the `historical_ma99` and `future_ma99` as a purple MA99 line alongside the candlestick data; a vertical orange line separates the historical from the future segment.
- In 1D mode, the match card mini chart must display `historical_ohlc_1d` / `future_ohlc_1d` bars and `historical_ma99_1d` / `future_ma99_1d` instead of the 1H counterparts. The right badge must show the count of 1D future bars (e.g., "Actual future 3D bars") rather than "No future bars".
- Early MA99 loading state: immediately after the official CSV files are uploaded, the system calls `/api/merge-and-compute-ma99` to pre-compute MA99. During this call, the main chart header shows `MA(99) 計算中…` and the predict button is disabled with tooltip `MA99 計算中，請稍候…`. Once resolved, the header shows the latest MA99 value and the predict button becomes enabled.
- Each match card header must display a MA99 trend label derived from the match's `future_ma99` series using linear regression slope: `↑ +X.XX%` (green) if slope ≥ 0, `↓ -X.XX%` (red) if slope < 0. The percentage is `(last − first) / first × 100`. The label is omitted when `future_ma99` has fewer than 2 non-null values.
- History upload feedback: after uploading a history CSV, a status badge must appear below the upload button showing either (a) new bars added with `added_count`, total `bar_count`, and latest timestamp in UTC+0, or (b) "資料已是最新，無需更新" when `added_count === 0`. Upload errors must be shown in a red error badge. While uploading, the button must be disabled with "上傳中…" label.
- All match interval timestamps and occurrence windows must display UTC+8 datetimes. A "All times UTC+8" label must appear in the match list header.

## Acceptance Criteria

### AC-1D-1: 1D mode match card badge shows daily bar count

**Given** the user has uploaded 1H OHLC data and run prediction
**When** the user switches to 1D timeframe mode and expands a match card
**Then** the right badge displays "Actual future Nd bars" (N = number of aggregated daily future bars)
**And** the badge "No future bars" is NOT visible

### AC-1D-2: _aggregate_bars_to_1d correctly aggregates 1H bars into daily OHLC

**Given** a list of 1H bars spanning one or more calendar days
**When** `_aggregate_bars_to_1d` is called
**Then** each output daily bar's `open` = first 1H bar's open of that day
**And** `high` = max of all 1H highs for that day
**And** `low` = min of all 1H lows for that day
**And** `close` = last 1H bar's close of that day
**And** bars with missing/empty date are skipped

### AC-1D-3: predict endpoint populates _1d fields when history_1d is provided

**Given** the backend has a non-empty `_history_1d`
**When** `/api/predict` is called with 1H OHLC data
**Then** each match in the response has non-empty `future_ohlc_1d`
**And** `historical_ohlc_1d` contains the aggregated daily bars for the matched window

---

---

## Homepage & Routing Acceptance Criteria

### AC-ROUTE-1: SPA 路由直接訪問不 404

**Given** 使用者在瀏覽器直接輸入 `/app`、`/about`、`/diary`、`/business-logic`
**When** 頁面載入
**Then** 畫面顯示對應頁面，不出現 404 或空白頁

### AC-ROUTE-2: 現有 /app 功能不 regression

**Given** 路由重構後（App.tsx → AppPage.tsx，掛於 `/app`）
**When** 使用者訪問 `/app` 並執行 CSV 上傳、pattern match、chart 渲染
**Then** 所有原有功能正常運作，Playwright E2E 全通過

### AC-HOME-1: Homepage 各 Section 正確渲染

**Given** 使用者訪問 `/`
**When** 頁面載入
**Then** 頁面顯示 Hero、專案邏輯、技術棧、開發日記四個 Section
**And** Hero 主標題為 "Predict the Next Move Before It Happens"
**And** Hero 副標題含 pattern-matching 說明（"Pattern-matching engine for K-line candlestick charts..."）
**And** 開發日記從 `diary.json` 渲染，`milestone` 為可展開收起的大標題，`items` 為展開後細節，最新在前
**And** "Open App →" 按鈕導向 `/app`

### AC-AUTH-1: 正確密碼取得 token 並顯示內容

**Given** 使用者訪問 `/business-logic`
**When** 輸入正確密碼並 Submit
**Then** `POST /api/auth` 回傳 JWT → 存入 localStorage（key: `bl_token`）
**And** 自動呼叫 `GET /api/business-logic` → 渲染 markdown 內容

### AC-AUTH-2: 錯誤密碼顯示錯誤訊息

**Given** 使用者訪問 `/business-logic`
**When** 輸入錯誤密碼並 Submit
**Then** 後端回 401 → 畫面顯示錯誤訊息
**And** localStorage 不存入任何 token

### AC-AUTH-3: 無 token 直接訪問顯示密碼輸入框

**Given** localStorage 中無 `bl_token`
**When** 使用者直接訪問 `/business-logic`
**Then** 頁面顯示密碼輸入框，不 crash，不顯示內容

> **後端測試缺口（2026-04-15 review）：** GET /api/business-logic 有效 token → 200 的後端單元測試尚未補上。Phase 3 Playwright E2E（AC-AUTH-1 flow）將覆蓋此路徑；若需獨立後端測試，補 `test_auth.py` 並用 `tmp_path` fixture 建立臨時 `business_logic.md`。

### AC-AUTH-4: Token 過期自動回到密碼輸入

**Given** localStorage 中有過期 `bl_token`
**When** 使用者訪問 `/business-logic` 並觸發 `GET /api/business-logic`
**Then** 後端回 401 → localStorage 清除 `bl_token` → 頁面回到密碼輸入框

### AC-ABOUT-1: About 頁面各 Section 正確渲染

**Given** 使用者訪問 `/about`
**When** 頁面載入
**Then** 頁面顯示以下 Section：Overview、AI 協作開發流程、人的貢獻 vs AI 的貢獻、技術選型決策、Screenshots（佔位圖）、Features
**And** AI 協作開發流程 Section 說明角色分工（PM / Senior Architect / Designer / Engineer / QA）與 Phase Gate 模型
**And** "← Home" 按鈕導向 `/`

### AC-DIARY-1: Diary 頁面從 diary.json 正確渲染

**Given** 使用者訪問 `/diary`
**When** 頁面載入
**Then** 所有 diary 條目依日期倒序顯示，最新在前

---

## Acceptance Criteria — K-005 統一 NavBar `[K-005]`

設計稿參考：homepage.pen `NavBar — Revised` 系列 frame（x=7600）

### AC-NAV-1: 所有頁面顯示統一 NavBar `[K-005]`

**Given** 使用者訪問任一頁面（`/`、`/app`、`/about`、`/diary`、`/business-logic`）
**When** 頁面載入
**Then** NavBar 顯示：左側 ⌂ icon，右側連結 App / About / Diary / Logic 🔒
**And** 不發生 layout shift 或 NavBar 缺失

### AC-NAV-2: ⌂ 導向首頁 `[K-005]`

**Given** 使用者在任何頁面
**When** 點擊左側 ⌂ icon
**Then** 頁面導向 `/`，不發生全頁 reload（SPA 路由）

### AC-NAV-3: 各連結導向正確頁面 `[K-005]`

**Given** 使用者在任何頁面
**When** 點擊 NavBar 連結
**Then** App → `/app`、About → `/about`、Diary → `/diary`、Logic 🔒 → `/business-logic`
**And** 不發生全頁 reload

### AC-NAV-4: 當前頁面連結高亮 `[K-005]`

**Given** 使用者在某頁面
**When** 頁面載入
**Then** 對應該頁的 NavBar 連結顯示為白色（active），其他連結為灰色

### AC-NAV-5: Business Logic 連結 auth 狀態 `[K-005]`

**Given** 使用者未登入
**When** 查看 NavBar
**Then** Logic 🔒 連結顯示鎖頭樣式
**And** 點擊後導向 `/business-logic` auth gate 頁

---

## Non-functional Requirements
- Prediction refresh after clicking the button should remain responsive.
- The matching logic should not return opposite-MA99-trend cases.
- The interface should remain usable on desktop widths without collapsing the editor and chart into an unreadable layout.

---

## 技術債

完整登記簿：[docs/tech-debt.md](docs/tech-debt.md)

| ID | 項目 | 說明 | 優先級 | 決策時間 |
|----|------|------|--------|---------|
| TD-001 | 前端 bundle 過大 `[K-003]` | Vite build chunk > 500 kB，dynamic import / manualChunks 拆分 | 低 | 2026-04-16 |
| TD-002 | 後端測試覆蓋率不足 `[K-001]` | 整體 71%，`main.py` 僅 45% | 中 | 2026-04-16 |
| TD-003 | Upload history 併發 race | module globals read-merge-write 無同步 | 中 | 2026-04-18 |
| TD-004 | PredictorChart effect deps 不全 | 相同長度但不同內容會顯示舊 chart | 中 | 2026-04-18 |
| TD-005 | `AppPage.tsx` 責任過多 | 需抽 `useOfficialInput` / `useHistoryUpload` / `usePredictionWorkspace` | 中 | 2026-04-18 |
| TD-006 | `backend/main.py` 責任過多 | 需拆 `history_repository` / `history_service` / `prediction_service` | 中 | 2026-04-18 |
| TD-007 | `backend/predictor.py` 模組過廣 | 建議拆 `predictor_ma` / `predictor_similarity` / `predictor_stats` | 中 | 2026-04-18 |
| TD-008 | Cross-layer 重複計算 | consensus/stats 前後端各算一次，漂移風險 | 高 | PM 已裁決 → K-013 實作中（2026-04-18） |

---

## Backlog — 後端測試補強（Backend Test Coverage）

**Ticket：** [K-001](docs/tickets/K-001-backend-test-coverage.md)

**背景：** 目前後端 coverage 71%，`main.py` 45%。所有 FastAPI route handler 均缺乏直接整合測試，僅靠 `predictor.py` unit test 間接覆蓋部分邏輯。

**目標：** `main.py` coverage ≥ 80%，補齊所有 route 的 happy path 與主要錯誤路徑。

**測試策略：** 使用 `httpx.AsyncClient` 或 `TestClient`（FastAPI），搭配 `tmp_path` fixture 建立臨時 history CSV，不依賴磁碟上的真實資料庫。

---

### AC-TEST-AUTH-3 `[K-001]`: 有效 token → GET /api/business-logic 回傳 200 與內容

**Given** `business_logic.md` 存在（用 `tmp_path` 建立臨時檔）
**When** 以有效 JWT token 呼叫 `GET /api/business-logic`
**Then** 回傳 200，body 包含 `content` 欄位，值為 markdown 文字

### AC-TEST-AUTH-5 `[K-001]`: business_logic.md 不存在 → 404

**Given** `business_logic.md` 不存在
**When** 以有效 JWT token 呼叫 `GET /api/business-logic`
**Then** 回傳 404

---

### AC-TEST-HISTORY-INFO-1 `[K-001]`: GET /api/history-info 回傳兩個 timeframe 的資訊

**Given** backend 已載入 mock history（`_history_1h`、`_history_1d`）
**When** `GET /api/history-info`
**Then** 回傳 200，body 包含 `1H` 與 `1D` 兩個 key，各含 `bar_count`、`latest`、`filename`

---

### AC-TEST-UPLOAD-1 `[K-001]`: POST /api/upload-history — 1H CSV happy path

**Given** 上傳一份包含有效 OHLC 資料的 standard CSV（檔名不含 `1d`）
**When** `POST /api/upload-history`
**Then** 回傳 200，`timeframe` 為 `1H`，`added_count > 0`，`bar_count` 正確

### AC-TEST-UPLOAD-2 `[K-001]`: POST /api/upload-history — 1D CSV 檔名偵測

**Given** 上傳一份檔名含 `_d.csv` 的 CSV
**When** `POST /api/upload-history`
**Then** 回傳 200，`timeframe` 為 `1D`

### AC-TEST-UPLOAD-3 `[K-001]`: POST /api/upload-history — 空檔案 → 422

**Given** 上傳空內容的檔案
**When** `POST /api/upload-history`
**Then** 回傳 422

### AC-TEST-UPLOAD-4 `[K-001]`: POST /api/upload-history — 重複上傳不新增

**Given** 上傳與已有 history 完全重疊的 CSV
**When** `POST /api/upload-history`
**Then** 回傳 200，`added_count` 為 0

---

### AC-TEST-EXAMPLE-1 `[K-001]`: GET /api/example — 檔案不存在 → 404

**Given** history CSV 不存在
**When** `GET /api/example`
**Then** 回傳 404

---

### AC-TEST-PARSE-1 `[K-001]`: _parse_csv_history_from_text — CryptoDataDownload 格式

**Given** CSV 文字第一行為 `http://...` URL，資料為 newest-first
**When** 呼叫 `_parse_csv_history_from_text`
**Then** 回傳 bars 為 chronological 順序（最舊在前）

### AC-TEST-PARSE-2 `[K-001]`: _parse_csv_history_from_text — Binance raw API 格式

**Given** CSV 無 header，第一欄為 Unix ms timestamp
**When** 呼叫 `_parse_csv_history_from_text`
**Then** 回傳 bars 含正確的 `date`（UTC `YYYY-MM-DD HH:MM`）、`open`、`high`、`low`、`close`

### AC-TEST-PARSE-3 `[K-001]`: _parse_csv_history_from_text — 空字串

**Given** 空字串輸入
**When** 呼叫 `_parse_csv_history_from_text`
**Then** 回傳空 list

---

### AC-TEST-MERGE-1 `[K-001]`: _merge_bars — 去重並排序

**Given** 兩份含部分重疊時間戳的 bars list
**When** 呼叫 `_merge_bars`
**Then** 結果無重複時間戳，且依 `date` 升冪排序

## UI 優化 Backlog

---

### AC-002-ICON：Icon Library 導入 `[K-002]`

**Given** 前端已安裝 icon library（具體選型由 Designer 決定，例如 Heroicons / Lucide）
**When** 使用者載入任一頁面
**Then** UnifiedNavBar 的 home icon 使用 icon library 的 home icon（取代現有 ⌂ Unicode 符號）
**And** PredictButton 的 icon 使用 icon library 的 play/start icon（取代現有 ▶ Unicode 符號）
**And** SectionHeader 各 section 標題使用語意相符的 icon library icon
**And** 所有 icon 在 Retina / 高 DPI 螢幕下清晰，無鋸齒

**Given** icon library 已導入
**When** 工程師新增 icon
**Then** 可透過 import 單一套件使用，不需手動管理 SVG 檔案

> **Note：** AC-NAV-1（K-005）描述 NavBar 顯示「⌂ icon」，K-002 完成後該 icon 將替換為 icon library 版本；語意不變，K-005 AC 不需重開。

---

### AC-002-LAYOUT：排版優化 `[K-002]`

**Given** 使用者訪問 `/`（首頁）或 `/app`（預測頁）
**When** 頁面載入
**Then** 頁面各區塊間距（section padding / gap）一致，符合設計稿規範
**And** 主要文字層次清晰：heading / subheading / body / caption 四級 typography 可視覺區分
**And** 互動元素（按鈕、輸入框）具備足夠的 touch target（最小 44×44px）

**Given** 使用者在行動裝置（viewport ≤ 768px）上訪問
**When** 頁面載入
**Then** 內容不溢出螢幕寬度
**And** 視覺層次與桌面版一致（無元素重疊或文字截斷）

---

### AC-002-LOADING：Loading 動畫改版 `[K-002]`

**Given** 使用者點擊 PredictButton 觸發預測請求
**When** API 請求進行中（loading 狀態）
**Then** LoadingSpinner 顯示比 border-spin 更有視覺質感的動畫（具體設計由 Designer 決定，例如 pulse、skeleton、multi-ring 等）
**And** 動畫流暢，不發生卡頓或閃爍

**Given** 預測請求完成或失敗
**When** loading 狀態結束
**Then** LoadingSpinner 立即消失，不殘留
**And** 頁面平滑過渡到結果或錯誤狀態（無明顯跳動）

---

## Acceptance Criteria — 2026-04-18 Codex Review 衍生

### AC-009-FIX `[K-009]`：predict() 1H 路徑傳遞正確的 ma_history

**Given** backend 同時載入 `_history_1h` 與 `_history_1d`
**When** `/api/predict` 以 `timeframe="1H"` 被呼叫
**Then** `find_top_matches()` 收到 `ma_history=_history_1d`（而非 fallback 為 `history`）
**And** 1H 預測結果的 MA99 filter 與 correlation 基於 daily history 計算

### AC-009-TEST `[K-009]`：1H regression test 鎖住行為

**Given** 後端 test suite
**When** 執行 `python3 -m pytest backend/tests/`
**Then** 存在一個 test case 明確驗證 1H 路徑下 `ma_history` 為 `_history_1d`
**And** 若回退至舊行為（不傳 `ma_history`），該 test 必須失敗

### AC-009-REGRESSION `[K-009]`：1D 與其他 API 行為不變

**Given** 現有 backend test suite（18 + 44 tests）
**When** 執行全部 backend tests
**Then** 全部通過，無新增 failure

---

### AC-010-GREEN `[K-010]`：Vitest suite 全綠

**Given** `frontend/` 目錄
**When** 執行 `npm test`
**Then** 全部 tests 通過，退出碼 0

### AC-010-ROBUST `[K-010]`：timeframe 斷言不依賴 index

**Given** 修復後的 `AppPage.test.tsx`
**When** 未來 UI 新增或刪除其他 button
**Then** timeframe 切換相關斷言仍能正確定位目標控制項
**And** 不使用 `getAllByRole(...)[N]` 這類 index-based 寫法

### AC-010-REGRESSION `[K-010]`：tsc / E2E 不回歸

**Given** 前端完整檢查
**When** 依序執行 `npx tsc --noEmit` 與 `/playwright`
**Then** tsc exit 0，Playwright E2E 全通過

### AC-010-R1 `[K-010]`：`/api/predict` 送出 current view timeframe

**Given** 使用者已將 timeframe toggle 切到 1D（或 1H）
**When** 使用者點擊 Start Prediction
**Then** `/api/predict` payload 的 `timeframe` 欄位等於目前 `viewTimeframe`（1D 或 1H）
**And** 不存在「永遠送 1H」的硬編碼行為

> **脈絡：** 此行為由 2026-04-09 commit fb20f21「switch 1D flow to native timeframe contract」刻意設計，配合 AC-1D-3 / AC-1D-1 的 1D 預測與 match card 1D 顯示流程。K-010 原 test 斷言「永遠送 1H」反映的是 pre-fb20f21 的 dual-toggle（MainChart timeframe + 右側 display mode）舊架構殘骸，該架構已移除。Engineer 改 test 與生產碼一致為正確做法。

### AC-010-R2 `[K-010]`：timeframe toggle 觸發 MA99 recompute（不觸發 predict）

**Given** 已上傳 official CSV 的使用者
**When** 使用者切換 timeframe toggle（1H ↔ 1D）
**Then** 前端呼叫 `POST /api/merge-and-compute-ma99` 並帶入目標 timeframe
**And** 前端**不**呼叫 `POST /api/predict`
**And** MA99 header 與 MainChart 依新 timeframe 重新渲染

> **脈絡：** Early MA99 loading state（PRD UX Notes line 160）規定上傳後立即 pre-compute MA99 以去除預測按下後的等待；timeframe 切換等同「換 timeframe 下的 MA99 視圖」，沿用同一條 pre-compute 路徑以維持一致體感，預測結果保留不重算。原 test 斷言「toggle 不觸發任何 API」遺漏了此 pre-compute 路徑。

---

### AC-011-PROP `[K-011]`：LoadingSpinner 支援 label prop

**Given** `LoadingSpinner` 組件
**When** 呼叫方傳入 `<LoadingSpinner label="載入中…" />`
**Then** 畫面顯示該 label 文字
**And** 未傳 label 時，不顯示 `Running prediction...` 這組 prediction-specific 文字

### AC-011-CALLSITES `[K-011]`：各呼叫處情境正確

**Given** 4 個使用 LoadingSpinner 的位置（`BusinessLogicPage` / `DiaryPage` / `DevDiarySection` / `PredictButton`）
**When** 各自觸發 loading 狀態
**Then** 顯示的 label 與該頁面任務情境一致

### AC-011-REGRESSION `[K-011]`：無既有功能回歸

**Given** 前端完整檢查
**When** 依序執行 `npx tsc --noEmit` / `npm test` / `/playwright`
**Then** 全部通過

---

### AC-012-ALIGN `[K-012]`：business-logic.spec.ts 測試名與斷言語意一致

**Given** `frontend/e2e/business-logic.spec.ts` 的 Logic 鎖頭相關 test
**When** 讀 test name 與 body
**Then** name 描述的行為與實際斷言完全對應
**And** 無「name 宣稱 A，實際只測 B」的 mismatch

### AC-012-PASS `[K-012]`：Playwright E2E 全綠

**Given** 前端
**When** 執行 `/playwright`
**Then** 全部 tests 通過（含本 ticket 新增或更新的斷言）

---

### AC-013-UTIL `[K-013]`：前端抽出共用純函式 `statsComputation.ts`

**Given** `frontend/src/utils/statsComputation.ts` 已建立
**When** 外部呼叫 `computeStatsFromMatches(matches, currentClose, timeframe)`
**Then** 回傳型別等同後端 `PredictStats` 的 camelCase 映射（`consensusForecast1h` / `consensusForecast1d` / `highestOrder` / `secondHighest` / `secondLowest` / `lowestOrder` / `winRate` / `meanCorrelation`）
**And** 函式為純函式，無 React 依賴、無 side effect

### AC-013-APPPAGE `[K-013]`：AppPage.tsx displayStats 邏輯簡化

**Given** `frontend/src/AppPage.tsx`
**When** 讀取 `displayStats` useMemo
**Then** 全集（appliedSelection == all matches）直接使用 `appliedData.stats`
**And** Subset（appliedSelection ⊂ all matches）呼叫 `computeStatsFromMatches(...)`
**And** 原 inline `computeDisplayStats` 與獨立 `projectedFutureBars` useMemo 已刪除或合併

### AC-013-FIXTURE `[K-013]`：Contract fixture 建立

**Given** `backend/tests/fixtures/stats_contract_cases.json` 已建立
**When** 檔案被讀取
**Then** 內容為 array，每筆含 `name` / `input` / `expected`
**And** 至少涵蓋 3 種 case：全集、subset、single match 邊界（`future_ohlc` == 2 筆）

### AC-013-BACKEND-CONTRACT `[K-013]`：後端 contract test 通過

**Given** `backend/tests/test_predictor.py` 新增 parametrize test
**When** 執行 `python3 -m pytest backend/tests/`
**Then** 每筆 fixture case 的 `compute_stats(**input)` 輸出與 `expected` bit-exact 或誤差 ≤ 1e-6
**And** 若後端算法改動但 fixture 未同步，該 test 失敗

### AC-013-FRONTEND-CONTRACT `[K-013]`：前端 contract test 通過

**Given** `frontend/src/__tests__/statsComputation.test.ts` 新增
**When** 執行 `npm test`
**Then** 讀取 `../../../backend/tests/fixtures/stats_contract_cases.json`
**And** 對每筆 case 的 `computeStatsFromMatches(...)` 輸出經 camelCase 對映後與 `expected` bit-exact 或誤差 ≤ 1e-6

### AC-013-REGRESSION `[K-013]`：無既有功能回歸

**Given** 前後端完整檢查
**When** 依序執行 `npx tsc --noEmit` / `python3 -m pytest backend/tests/` / `npm test` / `/playwright`
**Then** 全部 exit 0、全部 pass
**And** Playwright mock 的 `future_ohlc` 仍 ≥ 2 筆

### AC-013-API-COMPAT `[K-013]`：API payload 向後相容

**Given** `/api/predict` endpoint
**When** 本票完成後呼叫
**Then** response JSON 形狀與本票開始前完全一致（`stats.consensus_forecast_1h` / `_1d` 等欄位不變）
**And** 現有 E2E mock 不需改動即可通過

---

## K-017 /about Portfolio Enhancement

**Ticket：** [K-017](docs/tickets/K-017-about-portfolio-enhancement.md)

**背景：** `/about` 改寫為 portfolio-oriented recruiter page，主軸「一個人透過 6 個 AI agent 端到端交付功能，每個 feature 都有 doc trail」；homepage 加 thin banner 導入 `/about`；補 2 個支援 artifact（`scripts/audit-ticket.sh` + `docs/ai-collab-protocols.md`）讓陳述可被 recruiter 自行驗證。

**範圍：** 8 sections（Header / Metrics / Roles / Pillars / Tickets / Architecture / Banner / Footer）+ 2 scope +1 artifacts（audit script + protocols doc）。

---

### AC-017-HEADER `[K-017]`：PageHeaderSection 呈現 One operator 聲明

**Given** 使用者訪問 `/about`
**When** 頁面載入完成
**Then** 頁面最上方顯示 PageHeaderSection，文字內容為 "One operator, orchestrating AI agents end-to-end — PM, architect, engineer, reviewer, QA, designer. Every feature ships with a doc trail."
**And** 文字呈現為視覺上的 hero heading（`h1` 或同級視覺層次），字級大於 body 文字
**And** 六個角色名（PM / architect / engineer / reviewer / QA / designer）以逗號分隔正確列出，拼寫與大小寫與上述一致
**And** 結尾句 "Every feature ships with a doc trail." 獨立視覺段落（換行或獨立 `<p>` / `<span>`），不被擠進同一行
**And** Header 區塊 Playwright 斷言使用 `{ exact: true }` 比對文字，避免 description 誤命中

---

### AC-017-METRICS `[K-017]`：Metrics strip 四條 narrative metric + subtext

**Given** 使用者訪問 `/about`
**When** 頁面滾動至 Metrics 區塊
**Then** 顯示 4 個 metric card，依序為：Features Shipped / First-pass Review Rate / Post-mortems Written / Guardrails in Place
**And** Features Shipped 的 subtext 為 "17 tickets, K-001 → K-017"
**And** First-pass Review Rate 的 subtext 為 "Reviewer catches issues before QA on most tickets"
**And** Post-mortems Written 的 subtext 為 "Every ticket has cross-role retrospective"
**And** Guardrails in Place 的 subtext 為 "Bug Found Protocol, per-role retro logs, audit script"
**And** 所有 metric 以 narrative 敘述呈現，**不得出現 "exactly N%"** 這類精確數值宣告（未提供 CI 驗證資料）
**And** Playwright 斷言逐條驗證 4 個 metric title 與其對應 subtext，不依 index 定位

---

### AC-017-ROLES `[K-017]`：6 Role Cards 呈現 Owns X + Artefact

**Given** 使用者訪問 `/about`
**When** 頁面滾動至 "Role Cards" 區塊
**Then** 顯示 6 張 role card，依序為 PM / Architect / Engineer / Reviewer / QA / Designer
**And** 每張卡片含兩個欄位：`Owns`（責任） 與 `Artefact`（交付物路徑）
**And** PM 卡片 Owns = "Requirements, AC, Phase Gates"、Artefact = "PRD.md, docs/tickets/K-XXX.md"
**And** Architect 卡片 Owns = "System design, cross-layer contracts"、Artefact = "docs/designs/K-XXX-*.md"
**And** Engineer 卡片 Owns = "Implementation, stable checkpoints"、Artefact = "commits + ticket retrospective"
**And** Reviewer 卡片 Owns = "Code review, Bug Found Protocol"、Artefact = "Review report + Reviewer 反省"
**And** QA 卡片 Owns = "Regression, E2E, visual report"、Artefact = "Playwright results + docs/reports/*.html"
**And** Designer 卡片 Owns = "Pencil MCP, flow diagrams"、Artefact = ".pen file + get_screenshot output"
**And** Playwright 斷言逐卡片驗證 Role name + Owns + Artefact 三欄位，共 18 條斷言（6 × 3）

---

### AC-017-PILLARS `[K-017]`：How AI Stays Reliable 三支柱 + mechanism + anchor

**Given** 使用者訪問 `/about`
**When** 頁面滾動至 "How AI Stays Reliable" 區塊
**Then** 顯示 3 個 pillar，依序為 Persistent Memory / Structured Reflection / Role Agents
**And** Persistent Memory pillar 描述含 "`MEMORY.md`" 與 "cross-conversation" 關鍵詞
**And** Persistent Memory 底部 anchor 引用為 italic blockquote：`> *Every "stop doing X" becomes a memory entry — corrections outlive the session.*`
**And** Structured Reflection pillar 描述含 "`docs/retrospectives/<role>.md`" 與 "Bug Found Protocol" 關鍵詞
**And** Structured Reflection 底部 anchor 引用為：`> *No memory write = the bug is not closed.*`
**And** Role Agents pillar 描述含 "PM / Architect / Engineer / Reviewer / QA / Designer" 與 "`./scripts/audit-ticket.sh K-XXX`" 關鍵詞
**And** Role Agents 底部 anchor 引用為：`> *No artifact = no handoff.*`
**And** 每個 pillar 底部有 inline link 導向 `/docs/ai-collab-protocols.md`（同網站內相對 path）
**And** Playwright 斷言驗證 3 個 pillar title + 3 個 anchor blockquote + 3 個 inline link 目標 URL

---

### AC-017-TICKETS `[K-017]`：Anatomy of a Ticket 呈現 K-002 / K-008 / K-009 trio

**Given** 使用者訪問 `/about`
**When** 頁面滾動至 "Anatomy of a Ticket" 區塊
**Then** 顯示 3 張 ticket 卡片，依序為 K-002 / K-008 / K-009
**And** 每張卡片含：Ticket ID / 標題 / 一句 outcome / 一句 learning / 外部連結
**And** K-002 卡片標題為 "UI optimization"（或中英對照版）；outcome 描述大重構並展示 And-clause 系統性遺漏被三角色反省攔截；learning 指向「per-role retro log 機制因此建立」
**And** K-008 卡片標題為 "Visual report script"；outcome 描述自動化視覺報告 script 完整流程；learning 指向「Bug Found Protocol 四步示範」
**And** K-009 卡片標題為 "1H MA history fix"；outcome 描述 1H 預測 MA history 來源錯誤的 TDD bug fix；learning 指向「test-driven discipline 示範」
**And** 每張卡片的外部連結導向該 ticket 的 GitHub 檔案（e.g. `https://github.com/mshmwr/k-line-prediction/blob/main/docs/tickets/K-002-ui-optimization.md`）
**And** Playwright 斷言驗證 3 張卡片的 ID / 標題 / 連結 href

---

### AC-017-ARCH `[K-017]`：Project Architecture snapshot 三個點

**Given** 使用者訪問 `/about`
**When** 頁面滾動至 "Project Architecture" 區塊
**Then** 顯示 intro 句 "How the codebase stays legible for a solo operator + AI agents."
**And** 顯示三個子區塊：`Monorepo, contract-first` / `Docs-driven tickets` / `Three-layer testing pyramid`
**And** Monorepo 區塊描述含 "React/TypeScript" / "FastAPI/Python" / "`snake_case` (backend) ↔ `camelCase` (frontend)" 關鍵詞
**And** Docs-driven tickets 區塊描述含 "Given/When/Then/And" / "Playwright test mirrors the spec 1:1" / "PRD → `docs/tickets/K-XXX.md` → role retrospectives" 關鍵詞
**And** Three-layer testing pyramid 區塊列三層：`Unit — Vitest (frontend), pytest (backend)` / `Integration — FastAPI test client` / `E2E — Playwright, including a visual-report pipeline that renders every page to HTML for human review`
**And** Playwright 斷言驗證 3 個子區塊 title + 各自關鍵詞存在

---

### AC-017-BANNER `[K-017]`：Homepage BuiltByAIBanner

**Given** 使用者訪問 `/`（homepage）
**When** 頁面載入完成
**Then** homepage 最上方（NavBar 下方、Hero 上方）顯示 thin banner
**And** banner 文字為 "One operator. Six AI agents. Every ticket leaves a doc trail. *See how →*"
**And** "See how →" 為視覺強調（italic 或 link underline），整條 banner clickable
**And** click banner 導向 `/about`（SPA 路由，不發生全頁 reload）
**And** banner 樣式為「thin」（視覺上不得搶走 Hero 的主視覺位置，高度明顯小於 Hero）
**And** banner 存在不破壞 AC-HOME-1 既有斷言（Hero / 專案邏輯 / 技術棧 / 開發日記四個 Section 仍顯示）
**And** Playwright 斷言：banner 文字存在（`{ exact: true }`）+ click 後 URL 為 `/about`

---

### AC-017-FOOTER `[K-017]`：Footer 各頁面差異化實作

**Given** 使用者訪問 `/about`
**When** 頁面滾動至底部
**Then** 顯示 `FooterCtaSection`（Let's talk CTA 版）
**And** 顯示 "Let's talk →" 文字開頭
**And** 顯示 email：`yichen.lee.20@gmail.com`（`mailto:` 連結）
**And** 顯示 "Or see the source:" 引導句後接 GitHub 與 LinkedIn 兩個連結
**And** GitHub 連結 href = `https://github.com/mshmwr/k-line-prediction`，顯示文字為 "GitHub"
**And** LinkedIn 連結 href = `https://linkedin.com/in/yichenlee-career`，顯示文字為 "LinkedIn"
**And** 三個連結在新分頁開啟（`target="_blank"` + `rel="noopener noreferrer"`）
**And** Playwright 斷言驗證三個 href 完整匹配 + `mailto:` prefix 正確

**Given** 使用者訪問 `/`（首頁）
**When** 頁面滾動至底部
**Then** 顯示 `HomeFooterBar`（純文字資訊列）
**And** 內容為純文字：`yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn`（無可點擊連結）
**And** 字型為 Geist Mono，字級 11px
**And** 頂部有 border 線作為視覺分隔
**And** Playwright 斷言確認 `HomeFooterBar` 存在且包含上述三段文字

**Given** 使用者訪問 `/diary`
**When** 頁面滾動至底部
**Then** 頁面底部**不顯示** Footer 組件（設計稿無此 section）
**And** Playwright 斷言確認頁面底部無 FooterCtaSection 也無 HomeFooterBar

---

### AC-017-AUDIT `[K-017]`：audit-ticket.sh 可執行並輸出 A–G checklist

**Given** 專案根目錄已有 `scripts/audit-ticket.sh`
**When** 執行 `./scripts/audit-ticket.sh K-002`（closed ticket，created=2026-04-16 < 2026-04-18 → skip F/G）
**Then** script exit code 為 0（全 pass）
**And** stdout 含 A / B / C / D / E 五組 check 結果（彩色 checklist 格式）
**And** F / G 兩組標記為 SKIP（reason: `created < 2026-04-18`）

**Given** 同上 script
**When** 執行 `./scripts/audit-ticket.sh K-008`（closed ticket，created=2026-04-18 → 含 F/G）
**Then** exit code 為 0
**And** stdout 含 A–G 全部 7 組 check 結果
**And** F 組確認 ticket `## Retrospective` 有 5 個角色反省段 + per-role log 有對應 `## YYYY-MM-DD — K-008` entry
**And** G 組確認 Playwright spec 有 grep 到 K-008 + `docs/reports/K-008-*.html` 存在

**Given** 同上 script
**When** 執行 `./scripts/audit-ticket.sh K-999`（不存在的 ticket）
**Then** exit code 為 2（critical missing）
**And** stdout 明確報告 A 組 fail（ticket file 不存在）

**Given** 同上 script
**When** 執行一個 closed ticket 的 commit trail 僅為 vague msg（e.g. 所有 commit msg 均為 "wip" / "fix"）
**Then** D 組標記為 warning（exit code ≥ 1），明確提示 vague msg 被排除

**And** script 不提供 `--json` flag（YAGNI）
**And** script 用 bash，不依賴 node / python runtime
**And** 輸出為人類可讀 coloured checklist，不為 machine-readable JSON

---

### AC-017-PROTOCOLS `[K-017]`：docs/ai-collab-protocols.md 公開版文件

**Given** 專案根目錄已有 `docs/ai-collab-protocols.md`
**When** 任何人（含 recruiter）開啟該檔
**Then** 文件含三個主要 section：`Role Flow` / `Bug Found Protocol` / `Per-role Retrospective Log`
**And** Role Flow section 定義 6 角色名稱與職責（對應 `/about` Section 3 的 Owns X）
**And** Bug Found Protocol section 列出四步（反省 → PM 確認反省品質 → 寫 memory → 放行修復），並引用 K-008 / K-009 為示範
**And** Per-role Retrospective Log section 說明 `docs/retrospectives/<role>.md` 機制 + K-008 起啟用 + 條目格式（YYYY-MM-DD / 做得好 / 沒做好 / 下次改善）
**And** 文件含 2–3 條 **curated 英文 retrospective 節選**（非全翻譯所有 retro），每條明確標註 ticket ID + role + 原文出處連結
**And** `/about` Section 4 的三個 pillar 底部 inline link 均導向此檔的對應 anchor（Persistent Memory → Per-role Retrospective Log / Structured Reflection → Bug Found Protocol / Role Agents → Role Flow）
**And** 文件以英文撰寫（對齊 `/about` 的英文文案基調），不為全翻譯的中文版

---

### AC-017-HOME-V2 `[K-017]`：Homepage v2 完整版面改版

**Given** 使用者造訪 `/`
**When** 頁面載入完成
**Then** 頁面呈現 Pencil 設計稿 `Homepage v2 Dossier`（frame `4CsvQ`）的完整版面：
  - hpHero section 符合 v2 設計（更新後的 hero 版面與視覺規格）
  - hpLogic section 符合 v2 設計（更新後的 Logic/Flow 版面與視覺規格）
  - hpDiary section 使用 `<DiaryTimelineEntry>` 組件（`layout:none` 絕對定位，已於 Pass 3 設計完成）並符合 v2 版面
**And** `<BuiltByAIBanner />` 存在（NavBar 下方、Hero 上方，已由 AC-017-BANNER 定義）
**And** `<FooterCtaSection />` 存在（頁面底部，已由 AC-017-FOOTER 定義）
**And** Playwright E2E 斷言涵蓋 hpHero / hpLogic / hpDiary 三個 section 的 key visual 元素（heading text、section label 或 data-testid）
**And** 新版面不破壞 AC-HOME-1 現有斷言中「頁面包含 Hero / 專案邏輯 / 開發日記 section」的基本渲染要求

**注意：** hpHero / hpLogic v2 版面細節由 Architect 補充設計規格後由 Engineer 實作，Architect 須在設計文件 §2.3 補上 v2 版面的 key visual 元素清單與 props interface。

---

## K-018 GA4 Tracking — 訪客追蹤 + 點擊事件

**Ticket：** [K-018](docs/tickets/K-018-ga-tracking.md)

**背景：** K-017 強化 `/about` portfolio 後，需要可觀測 recruiter 造訪行為。GA4 提供 pageview 與 click event 追蹤，測量 ID 從環境變數注入，不 hardcode。

---

### AC-018-INSTALL `[K-018]`：GA4 snippet 正確安裝且測量 ID 從 env var 讀取

**Given** 前端已設定環境變數 `VITE_GA_MEASUREMENT_ID`（值為有效 GA4 測量 ID，格式 `G-XXXXXXXXXX`）
**When** 使用者訪問任一頁面
**Then** `<head>` 內存在 Google Tag Manager / gtag.js 的 script 標籤，src 包含 `googletagmanager.com/gtag/js`
**And** gtag 初始化時使用的測量 ID 等於 `VITE_GA_MEASUREMENT_ID` 的值，**不得** hardcode 任何 `G-` 開頭字串於原始碼中
**And** 若 `VITE_GA_MEASUREMENT_ID` 未設定，snippet **不被注入**（build 時靜默跳過，不 crash）
**And** Playwright 斷言：document head 含 `googletagmanager.com` 的 script src（E2E 環境可用 mock 或 stub，不驗 network call）

---

### AC-018-PAGEVIEW `[K-018]`：每個頁面進入時觸發 pageview event

**Given** GA4 已正確安裝，使用者在 SPA 內透過 React Router 導航
**When** 使用者進入 `/`（首頁）
**Then** GA4 記錄一次 `page_view` event，`page_location` 為 `/`
**And** `page_title` 為對應頁面標題

**Given** 相同條件
**When** 使用者進入 `/about`
**Then** GA4 記錄一次 `page_view` event，`page_location` 為 `/about`

**Given** 相同條件
**When** 使用者進入 `/app`
**Then** GA4 記錄一次 `page_view` event，`page_location` 為 `/app`

**Given** 相同條件
**When** 使用者進入 `/diary`
**Then** GA4 記錄一次 `page_view` event，`page_location` 為 `/diary`

**And** SPA 內部路由切換（React Router `<Link>` 導航）也會各自觸發 pageview，**不** 只在首次載入時觸發一次
**And** Playwright 斷言：透過 route intercept 或 window.dataLayer spy 確認 pageview event payload 含 `page_location`

---

### AC-018-CLICK `[K-018]`：關鍵 CTA 點擊觸發 custom event 含 label

**Given** 使用者訪問 `/about` 且 GA4 已載入
**When** 使用者點擊 Footer CTA 的 email 連結（`mailto:yichen.lee.20@gmail.com`）
**Then** GA4 記錄 custom event，event name 為 `cta_click`，參數 `label` = `"contact_email"`

**Given** 相同條件
**When** 使用者點擊 Footer CTA 的 GitHub 連結（`https://github.com/mshmwr/k-line-prediction`）
**Then** GA4 記錄 custom event，event name 為 `cta_click`，參數 `label` = `"github_link"`

**Given** 相同條件
**When** 使用者點擊 Footer CTA 的 LinkedIn 連結（`https://linkedin.com/in/yichenlee-career`）
**Then** GA4 記錄 custom event，event name 為 `cta_click`，參數 `label` = `"linkedin_link"`

**Given** 使用者訪問 `/`（首頁）且 GA4 已載入
**When** 使用者點擊 BuiltByAIBanner（"One operator. Six AI agents…" banner）
**Then** GA4 記錄 custom event，event name 為 `cta_click`，參數 `label` = `"banner_about"`

**And** 每個 custom event 額外含參數 `page_location`（當前路由）
**And** Playwright 斷言：透過 `window.gtag` spy 或 `window.dataLayer` 驗證 event name + label 參數，不驗 GA4 server 回應

---

### AC-018-PRIVACY `[K-018]`：不蒐集個人識別資訊（PII）

**Given** GA4 snippet 已安裝
**When** 任何 GA4 event 被觸發
**Then** event payload 不含使用者 email、IP 地址、姓名、手機號等 PII 欄位
**And** `gtag('config', ...)` 呼叫**不** 設定 `user_id` 或 `client_id` 為任何使用者識別值
**And** GA4 設定中 `anonymize_ip` 視 GA4 預設行為（GA4 預設匿名化 IP，無需額外設定；若使用 Universal Analytics 相容模式則需明確設定）
**And** Playwright 斷言：gtag config call 不含 `user_id` 參數

---

### AC-018-PRIVACY-POLICY `[K-018]`：Footer 揭露 GA4 使用聲明

**Given** 使用者訪問任一頁面
**When** 頁面底部 Footer 可見
**Then** Footer 含一行文字說明網站使用 GA4 收集匿名流量數據（例：「This site uses Google Analytics to collect anonymous usage data.」）
**And** 不需實作 Cookie Consent Banner 或攔截式 modal
**And** Playwright 斷言：Footer 區塊內含 "Google Analytics" 字串
