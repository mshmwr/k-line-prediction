# Product Requirements Document — K-Line Prediction

ETH/USDT K-line pattern similarity prediction system。本文件為 PM 的產品規格 + AC 主目錄。
完整 ticket 詳文請點各 `[K-XXX]` 連結至 `docs/tickets/K-XXX-*.md`。

## 目錄

- [§1 Product Spec](#1-product-spec)
- [§2 Sitewide AC](#2-sitewide-ac)
- [§3 Active Tickets](#3-active-tickets)
- [§4 Closed Tickets](#4-closed-tickets)
- [§5 Tech Debt](#5-tech-debt)

---

## §1 Product Spec

### Product

K-Line historical pattern matching and scenario forecasting。

### Goal

Find historical segments that are similar to the user's current K-line structure while keeping the MA99 trend aligned. The system should avoid cases where the current setup is under a falling MA99 but the returned matches come from rising-MA99 environments, or vice versa.

### Core Matching Logic

#### Input sources

- OHLC input remains the primary data source.
- Users can provide OHLC through CSV upload, JSON import, manual editing, or example data.
- Users may additionally upload a chart screenshot that shows the MA99 line and choose the MA99 trend direction from the screenshot.

#### Similarity model

- Do not match on `close` only.
- For each bar, derive candle-shape features:
  - body percent
  - full range percent
  - upper wick percent
  - lower wick percent
  - close-to-close return percent
- Compare historical windows using normalized similarity over the derived candle feature vector.

#### MA99 trend requirement

- Historical candidates must have an MA99 trend direction that matches the query trend direction.
- MA99 direction should be treated as a gate before final ranking.
- When MA99 direction differs, the candidate must be excluded.

#### MA99 source priority

1. Direct OHLC calculation — if the input segment contains enough data to compute MA99 directly, use the query OHLC itself.
2. Historical backfill — if the input segment is shorter than 99 bars but each row includes time values that can be aligned to the project history database, the system should fetch the bars immediately before the input segment and use them to compute MA99.
3. Screenshot-assisted override — if direct calculation and historical backfill are both unavailable, the user may upload a screenshot and manually specify whether MA99 is `up`, `down`, or `flat`. In this mode, MA99 is used as a trend-direction filter only; no precise MA99 similarity score is computed for the query segment.

#### Final ranking

- If query MA99 is available as a numeric series: `final_score = 0.6 * candle_score + 0.4 * ma_score`
- If query MA99 comes from screenshot override only: `final_score = candle_score`；MA99 direction is still used as a hard gate。

### Statistics Logic

- Stats are computed from the selected match set.
- Match List — each match includes the matched historical segment plus the actual next 72 x 1H bars from history；the expanded match chart must show these raw future bars, not a projected or aggregated chart.
- Statistics — build a projected 72 x 1H candle path from the selected match set；for each future hour bucket, rebase every selected match's future OHLC by its historical base close and project it onto the current input close；aggregate each hour bucket with median open, median close, median high, and median low to form one projected candle；the Statistics chart must visualize this aggregated projected 72-hour path.
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

### Input Validation

- The predict button is enabled only when all visible OHLC rows are numerically complete.
- If all matches are unchecked, prediction must be disabled until at least one case is selected.
- If the query is shorter than 99 bars and cannot be aligned to history by time, the backend must require either aligned timestamps that allow historical backfill, or an MA99 screenshot override direction.

### API

#### POST `/api/merge-and-compute-ma99`

**Payload**
- `ohlc_data`: array of OHLC rows (merged from the two uploaded CSV files)
- `timeframe`: `1H` or `1D`

**Response**
- `query_ma99`: MA99 series for the uploaded query segment (`(number | null)[]`)
- `query_ma99_gap`: `null` if fully populated; otherwise `{ from_date, to_date }` indicating the date range where data was missing

**Purpose:** called immediately after the official CSV files are uploaded (before prediction) so that the MA99 line and header value can be rendered on the main chart without waiting for the user to click the predict button。

**Note:** this endpoint does NOT persist uploaded OHLC data to the history database. The merge is performed in memory only to provide the historical prefix needed for MA99 computation. History database updates must go through `/api/upload-history`。

#### POST `/api/predict`

**Payload**
- `ohlc_data`: array of OHLC rows with optional `time`
- `selected_ids`: array of selected match ids
- `timeframe`: `1H` or `1D`
- `ma99_trend_override`: optional `up`, `down`, or `flat`

**Response**
- `matches`: array of match cases; each case includes `historical_ohlc` / `future_ohlc` / `historical_ma99` / `future_ma99` / `historical_ohlc_1d` / `future_ohlc_1d` / `historical_ma99_1d` / `future_ma99_1d` / `start_date` / `end_date` / `correlation`
- `stats`: aggregated statistics across all selected matches
- `query_ma99`: MA99 series for the current query segment (`(number | null)[]`)
- `query_ma99_gap`: `null` if fully populated; otherwise `{ from_date, to_date }`

**Note:** this endpoint does NOT persist uploaded OHLC data to the history database. The merge is in-memory only。

#### POST `/api/upload-history`

**Payload:** multipart/form-data with a single `file` field (CSV)。

**Response**
- `filename`: the canonical filename saved to disk (e.g. `Binance_ETHUSDT_1h.csv`)
- `latest`: the most recent bar's date string in UTC+0 `YYYY-MM-DD HH:MM` format, or `null` if the database is empty
- `bar_count`: total number of bars currently in the database after the merge
- `added_count`: number of net-new bars added in this upload (0 means all bars already existed)
- `timeframe`: `"1H"` or `"1D"` as detected from the uploaded file

**Purpose:** appends new bars to the persistent history database on disk. The endpoint deduplicates by normalized UTC timestamp so re-uploading overlapping data is safe。

**Supported CSV formats:**
- **CryptoDataDownload**: first line is a URL comment; header on second line; rows ordered newest-first (auto-reversed)
- **Standard CSV**: header on first line with `date`/`unix`/`open`/`high`/`low`/`close` columns; chronological order
- **Binance raw API**: no header; positional columns `open_time, open, high, low, close, …`; `open_time` is a Unix timestamp in milliseconds

**Note:** all timestamp formats are normalized to UTC `YYYY-MM-DD HH:MM` by `time_utils.normalize_bar_time` before storage. The file is only written to disk when `added_count > 0`。

### Timezone Convention

All timestamps are stored and transmitted as **UTC+0** in `YYYY-MM-DD HH:MM` format (16 characters). The display layer is responsible for converting to **UTC+8** for user-facing text。

- Backend (`time_utils.normalize_bar_time`): accepts any input format and outputs UTC+0 `YYYY-MM-DD HH:MM`
- Frontend storage / API payloads: UTC+0
- Frontend display (`utils/time.toUTC8Display`): converts UTC+0 → UTC+8 at render time only
- Chart rendering (lightweight-charts): timestamps are shifted by +8 h before passing to the library so that the chart's UTC-based x-axis shows UTC+8 labels

### UX Notes

- Keep OHLC input and MA99 assistance as separate UI concepts。
- Screenshot upload is optional and should be described as an MA99 assist path, not as the main data input。
- When screenshot-assisted override is active, users should understand that MA99 is being used as a directional filter rather than a fully reconstructed MA99 series。
- Match List and Statistics must be labeled clearly so users can distinguish between actual future historical bars in each matched case and the aggregated projected chart used for statistics and order suggestions。
- After prediction, the main chart header must display the latest non-null value from `query_ma99` formatted as `MA(99) x,xxx.xx`。
- If `query_ma99_gap` is non-null, a warning banner must appear below the main chart indicating the affected date range (e.g., `MA99 資料缺失：2024-01-01 ~ 2024-01-10`)。
- Each expanded match card must display a mini chart that overlays the `historical_ma99` and `future_ma99` as a purple MA99 line alongside the candlestick data; a vertical orange line separates the historical from the future segment。
- In 1D mode, the match card mini chart must display `historical_ohlc_1d` / `future_ohlc_1d` bars and `historical_ma99_1d` / `future_ma99_1d`。Right badge must show the count of 1D future bars (e.g., "Actual future 3D bars") rather than "No future bars"。
- Early MA99 loading state: immediately after the official CSV files are uploaded, the system calls `/api/merge-and-compute-ma99` to pre-compute MA99. During this call, the main chart header shows `MA(99) 計算中…` and the predict button is disabled with tooltip `MA99 計算中，請稍候…`。
- Each match card header must display a MA99 trend label derived from `future_ma99` using linear regression slope。
- History upload feedback: status badge below upload button shows either new-bar count + latest timestamp or "資料已是最新，無需更新"；upload errors in red badge；"上傳中…" while uploading。
- All match interval timestamps and occurrence windows must display UTC+8 datetimes。A "All times UTC+8" label must appear in the match list header。

### Non-functional Requirements

- Prediction refresh after clicking the button should remain responsive。
- The matching logic should not return opposite-MA99-trend cases。
- The interface should remain usable on desktop widths without collapsing the editor and chart into an unreadable layout。

### Product-level ACs (1D bar aggregation 規則)

以下三條為 backend predictor 對 1H → 1D aggregation 行為的契約，與任一 ticket 解耦、屬 Product Spec 層。

#### AC-1D-1：1D mode match card badge shows daily bar count

- **Given** the user has uploaded 1H OHLC data and run prediction
- **When** the user switches to 1D timeframe mode and expands a match card
- **Then** the right badge displays "Actual future Nd bars" (N = number of aggregated daily future bars)
- **And** the badge "No future bars" is NOT visible

#### AC-1D-2：`_aggregate_bars_to_1d` correctly aggregates 1H bars into daily OHLC

- **Given** a list of 1H bars spanning one or more calendar days
- **When** `_aggregate_bars_to_1d` is called
- **Then** each output daily bar's `open` = first 1H bar's open of that day；`high` = max of all 1H highs for that day；`low` = min of all 1H lows for that day；`close` = last 1H bar's close of that day
- **And** bars with missing/empty date are skipped

#### AC-1D-3：predict endpoint populates `_1d` fields when `history_1d` is provided

- **Given** the backend has a non-empty `_history_1d`
- **When** `/api/predict` is called with 1H OHLC data
- **Then** each match in the response has non-empty `future_ohlc_1d`
- **And** `historical_ohlc_1d` contains the aggregated daily bars for the matched window

---

## §2 Sitewide AC

站級 AC 跨多個 ticket / 頁面，列出視 source of truth ticket。完整 Given/When/Then/And 請至對應 ticket md。

- **AC-ROUTE-1 — SPA 路由直接訪問不 404**（`/app`、`/about`、`/diary`、`/business-logic`）— 由初期 Homepage & Routing phase 建立，詳見 [K-005](docs/tickets/K-005-unified-navbar.md) 與既有 `frontend/e2e/pages.spec.ts`。
- **AC-ROUTE-2 — 現有 /app 功能不 regression**（路由重構後 CSV 上傳 / pattern match / chart 渲染不破）— Homepage & Routing phase 核心 regression，見 `pages.spec.ts`、`app.spec.ts`。
- **AC-HOME-1 — Homepage 各 Section 正確渲染**（Hero / ProjectLogic / TechStack / DevDiary 四個 section + "Open App" 導向 `/app`）— 持續由 [K-017](docs/tickets/K-017-about-portfolio-enhancement.md)（AC-017-HOME-V2）、[K-023](docs/tickets/K-023-homepage-structure-v2.md)、[K-028](docs/tickets/K-028-homepage-visual-fix.md)、[K-024](docs/tickets/K-024-diary-structure-and-schema.md)（AC-024-HOMEPAGE-CURATION）串接。
- **AC-ABOUT-1 — /about Section 正確渲染** — 持續由 [K-017](docs/tickets/K-017-about-portfolio-enhancement.md) / [K-022](docs/tickets/K-022-about-structure-v2.md) / [K-029](docs/tickets/K-029-about-card-body-text-palette.md) / [K-031](docs/tickets/K-031-remove-built-by-ai-showcase-section.md) 定義。
- **AC-DIARY-1 — Diary 頁從 diary.json 正確渲染** — schema 由 [K-024](docs/tickets/K-024-diary-structure-and-schema.md) 扁平化；手機版無重疊由 [K-027](docs/tickets/K-027-mobile-diary-layout-fix.md) 確保。
- **AC-AUTH-1~4 — /business-logic 密碼閘** — 正確密碼取得 JWT 並顯示 markdown；錯誤密碼顯示錯誤訊息；無 token 顯示輸入框；過期 token 自動清除。詳見 Homepage & Routing phase 初始化，無獨立 ticket。
- **AC-NAV-1~5 — 統一 NavBar**（所有頁面顯示 / ⌂ 導首頁 / 各連結導向正確頁 / active 高亮 / Logic 鎖頭 auth 狀態）— 由 [K-005](docs/tickets/K-005-unified-navbar.md) 建立，由 [K-025](docs/tickets/K-025-navbar-hex-to-token.md) 遷移 hex→token。
- **AC-021-TOKEN — Tailwind theme 6 個 paper palette token 註冊**（paper / ink / brick / brick-dark / charcoal / muted）— 由 [K-021](docs/tickets/K-021-sitewide-design-system.md) 建立。
- **AC-021-FONTS — 三字型系統（Bodoni Moda / Newsreader / Geist Mono）載入 + Tailwind `display` / `italic` / `mono` family 註冊**（詳見 [K-021](docs/tickets/K-021-sitewide-design-system.md)）。
- **AC-021-BODY-PAPER — 全站 body 統一米色 `#F4EFE5` / `text-ink`**（`/`、`/about`、`/diary`、`/app`、`/business-logic` 全覆蓋，`/business-logic` 額外涵蓋 PasswordForm 未登入 + 登入後兩狀態）— 由 [K-021](docs/tickets/K-021-sitewide-design-system.md) 建立；後續 [K-030](docs/tickets/K-030-app-page-isolation.md) 決議 `/app` 排除。
- **AC-021-NAVBAR — NavBar 米白化 + 項目順序對齊 Pencil v2 設計稿**（⌂ / App / Diary / Prediction[hidden] / About）— [K-021](docs/tickets/K-021-sitewide-design-system.md)；NavBar 項 hex→token 後續由 [K-025](docs/tickets/K-025-navbar-hex-to-token.md) 處理。
- **AC-021-FOOTER — 全站 `<HomeFooterBar />` 單行資訊列**（`/` / `/app` / `/business-logic`；`/about` 維持 FooterCtaSection；`/diary` 由 K-024 決定）— 由 [K-021](docs/tickets/K-021-sitewide-design-system.md)、後續 [K-030](docs/tickets/K-030-app-page-isolation.md) `/app` 排除。
- **AC-018-INSTALL / PAGEVIEW / CLICK / PRIVACY / PRIVACY-POLICY — GA4 Measurement 全站植入 + SPA pageview + CTA click + PII guard + Footer 揭露** — 由 [K-018](docs/tickets/K-018-ga-tracking.md) 建立、[K-020](docs/tickets/K-020-ga-spa-pageview-e2e.md) 補 SPA pageview E2E。

> 站級 AC 規則：任何 PR 改動共用組件（NavBar / Footer / body token / 字型 / GA）均需檢查此清單下所有條目是否仍 PASS，並對應更新「全站 Playwright 量化斷言」（見各 ticket「N 路由需 N 個獨立 test case」規則）。

---

## §3 Active Tickets

以下 14 張 ticket 處於 `open` 或 `backlog` 狀態（依 `docs/tickets/*.md` frontmatter `status` 欄位）。狀態含義：
- **open** — 已有 PM 放行前置工作（AC / QA early consultation），等待或正在 Architect / Engineer 處理
- **backlog** — 已 triaged 有 AC 草案，排序後等待啟動

### K-012 — business-logic.spec.ts 測試名與斷言對齊

- **Status:** open / type: test
- **Ticket:** [docs/tickets/K-012-business-logic-spec-rename.md](docs/tickets/K-012-business-logic-spec-rename.md)
- **摘要：** Logic 鎖頭相關 E2E test 的 name 宣稱 A 但實際測 B，需修正 name 或斷言以對齊。

**AC：**

#### AC-012-ALIGN：測試名與斷言語意一致

- **Given** `frontend/e2e/business-logic.spec.ts` 的 Logic 鎖頭相關 test
- **When** 讀 test name 與 body
- **Then** name 描述的行為與實際斷言完全對應
- **And** 無「name 宣稱 A，實際只測 B」的 mismatch

#### AC-012-PASS：Playwright E2E 全綠

- **Given** 前端
- **When** 執行 `/playwright`
- **Then** 全部 tests 通過（含本 ticket 新增或更新的斷言）

---

### K-014 — Vitest index-based selector 殘留清理（AppPage + OHLCEditor）

- **Status:** backlog / type: test
- **Ticket:** [docs/tickets/K-014-vitest-index-selector-cleanup.md](docs/tickets/K-014-vitest-index-selector-cleanup.md)
- **摘要：** AppPage.test.tsx + OHLCEditor.test.tsx 仍用 `getAllBy...()[N]` index 定位；改 `getByLabelText` / `getByRole({ name, exact })` / `data-testid`。

**AC：**

#### AC-014-SELECTOR：無 index-based selector

- **Given** `frontend/src/__tests__/`
- **When** 執行 `grep -rn "getAllBy.*\[\d\]" frontend/src/__tests__/`
- **Then** 無結果
- **And** 若必須用 `getAllBy`，使用 filter/find 搭配語意斷言，不用 `[N]`

#### AC-014-GREEN / AC-014-REGRESSION

見 [K-014](docs/tickets/K-014-vitest-index-selector-cleanup.md)：Vitest suite 全綠 + tsc / E2E 不回歸。

---

### K-015 — `find_top_matches()` `ma_history` required

- **Status:** backlog / type: refactor
- **Ticket:** [docs/tickets/K-015-find-top-matches-ma-history-required.md](docs/tickets/K-015-find-top-matches-ma-history-required.md)
- **摘要：** 移除 `backend/predictor.py` `find_top_matches()` silent fallback；改 required kw 或加 assert/warning。K-009 bug 根因。

**AC：**

#### AC-015-NO-FALLBACK：無 silent fallback

- **Given** `backend/predictor.py` `find_top_matches()` 實作
- **When** caller 未傳 `ma_history`
- **Then** 行為為以下之一：Option A = `TypeError` raised（required keyword）；Option B = 測試 raise / 生產 log warning
- **And** 任一情況下皆無 `if ma_history is None: ma_history = history` 靜默回退

#### AC-015-CALLERS：所有現有 caller 顯式傳遞

- **Given** `backend/main.py` 全部 `find_top_matches()` 呼叫
- **When** grep `find_top_matches(` 該檔
- **Then** 每次呼叫都顯式傳 `ma_history=<value>`

#### AC-015-TEST-GUARD：caller 漏傳在 test 階段被攔截

- **Given** backend test suite
- **When** 故意拿掉某 caller 的 `ma_history` 參數
- **Then** 至少一個 test 必須失敗
- **And** 失敗原因可直接指出「`ma_history` 遺漏」

#### AC-015-REGRESSION

見 [K-015](docs/tickets/K-015-find-top-matches-ma-history-required.md)：63 個現有 test + K-009 regression test 全通過。

---

### K-016 — K-002 spec 加 superseded 頭註

- **Status:** backlog / type: docs
- **Ticket:** [docs/tickets/K-016-k002-spec-superseded-header.md](docs/tickets/K-016-k002-spec-superseded-header.md)
- **摘要：** `docs/superpowers/specs/k002-component-spec.md` frontmatter 後加 superseded 頭註，指向 K-011（LoadingSpinner 文案變更）。

**AC：**

#### AC-016-HEADER：superseded 頭註存在且連結正確

- **Given** `docs/superpowers/specs/k002-component-spec.md`
- **When** 讀取檔案
- **Then** frontmatter 之後出現 superseded 頭註
- **And** 頭註內 K-011 相對路徑可被 Markdown viewer 解析（`../../tickets/K-011-loading-spinner-label.md`）
- **And** lines 99, 111 的原始內容保留未改

---

### K-018 — GA4 Tracking（訪客追蹤 + 點擊事件）

- **Status:** open / type: feat
- **Ticket:** [docs/tickets/K-018-ga-tracking.md](docs/tickets/K-018-ga-tracking.md)
- **摘要：** GA4 snippet 植入；env var 注入測量 ID；SPA 全頁 pageview；Footer CTA 三鏈結 cta_click；PII guard；Footer 揭露聲明。

**AC 一覽：**

- **AC-018-INSTALL** — `<head>` 含 gtag.js；measurement ID 從 `VITE_GA_MEASUREMENT_ID` 讀；未設則靜默跳過 build。
- **AC-018-PAGEVIEW** — `/` / `/about` / `/app` / `/diary` SPA 進入時各觸發一次 `page_view` event，含 `page_location`。
- **AC-018-CLICK** — Footer email / GitHub / LinkedIn + Homepage BuiltByAIBanner click 各觸發 `cta_click` 含 `label`。
- **AC-018-PRIVACY** — event 不含 PII；`gtag('config')` 不設 `user_id`/`client_id`。
- **AC-018-PRIVACY-POLICY** — Footer 含 "Google Analytics" 匿名流量聲明文字。

完整 Given/When/Then/And 見 [K-018](docs/tickets/K-018-ga-tracking.md)。

---

### K-019 — Release Versioning & CI/CD

- **Status:** backlog / type: feat
- **Ticket:** [docs/tickets/K-019-release-versioning-ci.md](docs/tickets/K-019-release-versioning-ci.md)
- **Spec:** `docs/superpowers/specs/2026-04-19-release-versioning-design.md`
- **Plan:** `docs/superpowers/plans/2026-04-19-release-versioning-ci.md`
- **摘要：** Release version 與 CI/CD 流程設計，AC 於 spec AC-K019-1 ~ AC-K019-5。

**AC：** 見 ticket 引用 spec。

**Future Enhancement：** `/business-logic` 頁面完成後，需更新 `frontend/e2e/screenshot.spec.ts`，加入 post-auth `/business-logic` 截圖。

---

### K-033 — GA4 SPA route-change beacon emission fix（useGAPageview gtag pattern）

- **Status:** backlog / type: bug / priority: medium
- **Ticket:** [docs/tickets/K-033-ga-spa-beacon-emission-fix.md](docs/tickets/K-033-ga-spa-beacon-emission-fix.md)
- **摘要：** 修 `useGAPageview` SPA route 切換時 `/g/collect` beacon 未送出的 pre-existing bug；採 canonical GA4 gtag SPA pattern（Architect dry-run 決定 Pattern A `gtag('config', ...)` vs Pattern B `gtag('set',...) + gtag('event',...)`）；landed 後 K-020 T4 AC-020-BEACON-SPA 由 red 翻 green，不得 loosen assertion。Soft depends on K-032（page_location 值先改 full URL）。

**AC 一覽：**

- **AC-033-BEACON-SPA-GREEN** — K-020 T4 turns green with original assertion preserved
- **AC-033-BEACON-COUNT-GREEN** — T6 initial-load exactly 1 beacon unchanged
- **AC-033-NEG-UNCHANGED** — T7/T8/T9 NEG-* remain green (hook deps `[location.pathname]` unchanged)
- **AC-033-PAYLOAD-PINNED** — T5 beacon carries `v=2` + `tid` + `en=page_view` + path-key
- **AC-033-NO-REGRESSION** — K-018 ga-tracking.spec.ts 12 tests unaffected

完整 Given/When/Then/And 見 [K-033](docs/tickets/K-033-ga-spa-beacon-emission-fix.md)。

---

### K-024 — /diary 結構重做 + diary.json schema 扁平化

- **Status:** backlog / type: feat
- **Ticket:** [docs/tickets/K-024-diary-structure-and-schema.md](docs/tickets/K-024-diary-structure-and-schema.md)
- **摘要：** `/diary` 改設計稿 v2（`wiDSi`）扁平 timeline；diary.json 扁平 schema；英文化；Homepage 3 條 / Diary 頁 5 條 + Load more；PM persona 日更流程文字同步。

**AC 一覽：**

- **AC-024-SCHEMA** — flat array `{ ticketId?, title, date, text }`。
- **AC-024-ENGLISH** — 全條目無 CJK。
- **AC-024-LEGACY-MERGE** — 無 ticketId 舊條目最多 1 筆。
- **AC-024-HOMEPAGE-CURATION** — Homepage 顯示最新 3 條。
- **AC-024-DIARY-PAGE-CURATION** — Diary 頁初始 5 條 + 滾動/按鈕載入更多。
- **AC-024-TIMELINE-STRUCTURE** — 無 accordion；左側 1px rail；磚紅矩形 marker。
- **AC-024-ENTRY-LAYOUT** — Title Bodoni italic 18px bold / Date Geist Mono 12px / Text Newsreader italic 18px；`ticketId` 存在時 title 前綴 `K-XXX · `。
- **AC-024-PAGE-HERO** — `Dev Diary` Bodoni italic 64px + 分隔線 + Newsreader italic 副標。
- **AC-024-CONTENT-WIDTH** — desktop maxWidth 1248px。
- **AC-024-LOADING-ERROR-PRESERVED** — Loading / Error UX 沿用既有機制。
- **AC-024-PM-PERSONA-SYNC** — PM persona 「K-023 上線後生效」字串於本票關閉時改為「K-024 上線後生效」，且實際有 Edit tool call。
- **AC-024-REGRESSION** — K-017 + AC-DIARY-1 + `<DevDiarySection>` 3 條斷言不破。

完整 Given/When/Then/And 見 [K-024](docs/tickets/K-024-diary-structure-and-schema.md)。

---

### K-025 — NavBar hex → token 遷移 + navbar.spec.ts 更新

- **Status:** backlog / type: refactor
- **Ticket:** [docs/tickets/K-025-navbar-hex-to-token.md](docs/tickets/K-025-navbar-hex-to-token.md)
- **摘要：** UnifiedNavBar 6 處 `text-[#9C4A3B]` hex → `text-brick-dark` token；navbar.spec.ts 8 處 regex 改 `[aria-current="page"]`；補 `/` inactive color 4 斷言（TD-K021-09）。

**AC：**

#### AC-025-NAVBAR-TOKEN：NavBar 零 hex

- **Given** 開發者 grep `UnifiedNavBar.tsx`
- **When** 搜尋 `#[0-9A-Fa-f]{6}` pattern
- **Then** 返回結果數 = 0
- **And** 所有顏色 / 邊框 / 背景 class 均為 K-021 token

#### AC-025-NAVBAR-SPEC：既有斷言語意不降級

- **Given** `navbar.spec.ts` 8 處既有 regex 改為 token / aria-current selector
- **When** 執行 `npx playwright test navbar.spec.ts`
- **Then** 所有既有 test case 通過（K-005 AC-NAV-1~5 + K-021 AC-021-NAVBAR）
- **And** active state 斷言改用 `[aria-current="page"]` selector
- **And** 新增 `/` route inactive color 4 斷言（App / Diary / About / Prediction-hidden），補 TD-K021-09

#### AC-025-REGRESSION

見 [K-025](docs/tickets/K-025-navbar-hex-to-token.md)：K-021 + K-005 + 其他頁面 E2E 不回歸。

---

<!-- K-029 closed 2026-04-22 → see §4 Closed Tickets -->
<!-- K-030 closed 2026-04-21 → see §4 Closed Tickets -->
<!-- K-031 closed 2026-04-21 → see §4 Closed Tickets -->

---

## §4 Closed Tickets

以下 16 張 closed + 2 張 superseded ticket，AC 詳文從對應 `docs/tickets/*.md` 引用。`closed` 日期以 ticket frontmatter 為準；前期未登記 date 者以 `[Closed 2026-04, date TBD]` 占位。

### K-001 — 後端測試補強（main.py route handler coverage 提升）

- **Status:** closed / type: test / **Closed: [Closed 2026-04, date TBD]**
- **Ticket:** [docs/tickets/K-001-backend-test-coverage.md](docs/tickets/K-001-backend-test-coverage.md)
- **摘要：** main.py coverage 45% → ≥ 80%；補齊 auth / history-info / upload-history / example / parse / merge 等路由 happy path + 錯誤路徑 test。

**AC：**

- **AC-TEST-AUTH-3** — 有效 token `GET /api/business-logic` 回傳 200 + markdown content（以 `tmp_path` 建立臨時 md）
- **AC-TEST-AUTH-5** — `business_logic.md` 不存在 → 404
- **AC-TEST-HISTORY-INFO-1** — `GET /api/history-info` 回 `1H`/`1D` 各含 `bar_count`/`latest`/`filename`
- **AC-TEST-UPLOAD-1** — `POST /api/upload-history` 1H CSV happy path → `timeframe=1H`、`added_count>0`
- **AC-TEST-UPLOAD-2** — 檔名含 `_d.csv` → `timeframe=1D`
- **AC-TEST-UPLOAD-3** — 空檔 → 422
- **AC-TEST-UPLOAD-4** — 重複上傳 → `added_count=0`
- **AC-TEST-EXAMPLE-1** — history CSV 不存在 → 404
- **AC-TEST-PARSE-1~3** — CryptoDataDownload / Binance raw API / 空字串 parse 行為正確
- **AC-TEST-MERGE-1** — `_merge_bars` 去重並排序

---

### K-002 — UI 優化（icon、排版、loading 動畫）

- **Status:** closed / type: feat / **Closed: 2026-04-18**
- **Ticket:** [docs/tickets/K-002-ui-optimization.md](docs/tickets/K-002-ui-optimization.md)
- **摘要：** UI 大重構 — NavBar 連結完整性、Icon Library 導入、排版、LoadingSpinner 改版。

**AC：**

- **AC-002-NAV** — NavBar 連結完整性
- **AC-002-ICON** — Icon Library 導入：NavBar ⌂ / PredictButton ▶ / SectionHeader 改 icon library 版本；無鋸齒
- **AC-002-LAYOUT** — section padding/gap 一致、typography 四級可辨；mobile viewport 不溢出
- **AC-002-LOADING** — LoadingSpinner 改 pulse/skeleton/multi-ring 等質感動畫；loading 結束立即消失

> 由 K-011 superseded LoadingSpinner 文案部分（見 K-002 spec 頭註待 K-016 補）。

---

### K-003 — 前端 bundle 分割（chunk > 500kB 警告修復）

- **Status:** closed / type: chore / **Closed: 2026-04-17**
- **Ticket:** [docs/tickets/K-003-bundle-split.md](docs/tickets/K-003-bundle-split.md)
- **摘要：** Vite build chunk > 500 kB，dynamic import / manualChunks 拆分。

**AC：**

- **AC-BUNDLE-1** — build 無 chunk > 500kB 警告
- **AC-BUNDLE-2** — 現有 E2E 測試全數通過

---

### K-004 — /app TopBar Logo 點擊回 Home（superseded by K-030）

- **Status:** superseded / type: feat
- **Ticket:** [docs/tickets/K-004-app-topbar-logo-home-link.md](docs/tickets/K-004-app-topbar-logo-home-link.md)
- **Superseded by:** [K-030](docs/tickets/K-030-app-page-isolation.md)（`/app` 獨立為 tool 頁後不再需要頁面內 Home link）

---

### K-005 — 統一 NavBar — 所有頁面

- **Status:** closed / type: feat / **Closed: [Closed 2026-04, date TBD]**
- **Ticket:** [docs/tickets/K-005-unified-navbar.md](docs/tickets/K-005-unified-navbar.md)
- **摘要：** 所有頁面顯示 `<UnifiedNavBar />`：左側 ⌂、右側 App / About / Diary / Logic 🔒；SPA 路由；active 高亮；Business Logic auth 狀態。

**AC（AC-NAV-1~5）：**

- **AC-NAV-1** — 所有頁面顯示統一 NavBar，無 layout shift / 缺失
- **AC-NAV-2** — ⌂ 導首頁（SPA，不全頁 reload）
- **AC-NAV-3** — App / About / Diary / Logic 導向各自路由
- **AC-NAV-4** — 當前頁 active 磚紅色 `#9C4A3B`；其他深棕黑 60%
- **AC-NAV-5** — 未登入時 Logic 🔒 顯示鎖頭；點擊導 `/business-logic` auth gate

設計稿參考：`homepage.pen` NavBar — Revised 系列 frame (x=7600)。

---

### K-006 — Homepage diary.json 補填 4/1–4/16 缺漏里程碑

- **Status:** closed / type: content / **Closed: [Closed 2026-04, date TBD]**
- **Ticket:** [docs/tickets/K-006-homepage-diary-backfill.md](docs/tickets/K-006-homepage-diary-backfill.md)
- **摘要：** 補填 4/1–4/16 缺漏里程碑至 diary.json；Homepage Dev Diary 顯示完整。

**AC：**

- **AC-K006-1** — 補填缺漏里程碑至 diary.json（4/1~4/16 每日或每新 feature 條目）
- **AC-K006-2** — E2E 不回歸（Homepage / Diary 相關 spec 皆 PASS）

---

### K-007 — About 頁面描述更新

- **Status:** closed / type: content / **Closed: [Closed 2026-04, date TBD]**
- **Ticket:** [docs/tickets/K-007-about-page-description-update.md](docs/tickets/K-007-about-page-description-update.md)
- **摘要：** About 頁面文字描述草稿更新；後續由 K-017 portfolio 改版整合。

**AC：**

- **AC-K007-1** — About 頁面描述對齊當時專案現況（草稿狀態）

> 此票 AC 為當期草稿版本，完整 portfolio v2 重寫由 [K-017](docs/tickets/K-017-about-portfolio-enhancement.md) 覆蓋。

---

### K-008 — 自動化視覺報告 script（Playwright 截圖 → HTML）

- **Status:** closed / type: feat / **Closed: 2026-04-18**
- **Ticket:** [docs/tickets/K-008-visual-report.md](docs/tickets/K-008-visual-report.md)
- **摘要：** `frontend/e2e/visual-report.ts` 跑 Playwright 把 4 條公開路由（`/` / `/app` / `/about` / `/diary`）截圖後輸出 `docs/reports/K-XXX-visual-report.html`；ticket ID 從 `TICKET_ID` env var 讀。MVP 範圍縮減為全頁截圖 + 已知路由；不做 ticket→頁面 mapping。

**AC：**

#### AC-008-SCRIPT：Script 可執行

- **Given** QA 完成，所有 Playwright E2E 已通過
- **When** 在 `frontend/` 目錄執行 `npx playwright test visual-report.ts`（含傳入 ticket ID 的方式，由 Architect 決定 CLI arg / env var）
- **Then** script 成功執行，退出碼 0
- **And** 在 `docs/reports/` 下產出 `K-XXX-visual-report.html`

#### AC-008-CONTENT：報告包含所有已知頁面全頁截圖

- **Given** `K-XXX-visual-report.html` 已產出
- **When** 在瀏覽器開啟
- **Then** 報告包含「已知頁面路由全集」每條路由一張 full page 截圖
- **And** 每張截圖有對應的 route path 標記（例如 `/`、`/app`、`/about`、`/diary`）
- **And** 若某條路由需登入，報告標記「需登入」或使用 auth fixture 後截圖（由 Architect 定案）

**Blocking Question 裁決（2026-04-18）：**
- 執行環境 — 本地 dev server `http://localhost:5173`（Vite 預設），沿用既有 Playwright E2E 設定
- 頁面範圍 — 4 條公開頁：`/` / `/app` / `/about` / `/diary`；`/business-logic`（JWT）標「需登入，下期補」不做 auth fixture
- Ticket ID 傳入 — env var `TICKET_ID=K-008 npx playwright test visual-report.ts`；未設則預設 `UNKNOWN` 或退出碼 1

---

### K-009 — 1H 預測路徑使用錯誤的 MA history 來源

- **Status:** closed / type: bug / **Closed: 2026-04-18**
- **Ticket:** [docs/tickets/K-009-1h-ma-history-fix.md](docs/tickets/K-009-1h-ma-history-fix.md)
- **摘要：** `backend/main.py` 1H 預測路徑呼叫 `find_top_matches()` 未傳 `ma_history`，靜默 fallback 為 1H history 當 30-day MA 資料；修為顯式傳 `ma_history=_history_1d`。

**AC：**

- **AC-009-FIX** — `/api/predict` timeframe=1H 時，`find_top_matches()` 收到 `ma_history=_history_1d`；1H 預測 MA99 filter / correlation 基於 daily history
- **AC-009-TEST** — 存在 test case 明確驗證 1H 路徑下 `ma_history` 為 `_history_1d`；若回退舊行為 test 失敗
- **AC-009-REGRESSION** — 既有 18 + 44 backend tests 全過、無新 failure

---

### K-010 — 前端 Vitest 修復（AppPage.test.tsx）

- **Status:** closed / type: bug / **Closed: 2026-04-18**
- **Ticket:** [docs/tickets/K-010-vitest-apppage-fix.md](docs/tickets/K-010-vitest-apppage-fix.md)
- **摘要：** `AppPage.test.tsx` 假設兩個 1D button 與 payload 永遠送 1H 的舊 dual-toggle 架構殘骸；改為與 fb20f21 後 native timeframe contract 一致。

**AC：**

- **AC-010-GREEN** — Vitest suite 全綠、exit 0
- **AC-010-ROBUST** — timeframe 斷言不依賴 index；未來新增/刪除 button 仍可定位
- **AC-010-REGRESSION** — tsc + Playwright 不回歸
- **AC-010-R1** — `/api/predict` 送出 current view timeframe（=`viewTimeframe`，無「永遠送 1H」硬編碼）
- **AC-010-R2** — timeframe toggle 觸發 `POST /api/merge-and-compute-ma99`（不觸發 predict）；MA99 header + MainChart 依新 timeframe 重渲染

---

### K-011 — LoadingSpinner 文案中性化（加 label prop）

- **Status:** closed / type: enhancement / **Closed: 2026-04-18**
- **Ticket:** [docs/tickets/K-011-loading-spinner-label.md](docs/tickets/K-011-loading-spinner-label.md)
- **摘要：** `LoadingSpinner` 加 `label?: string` prop；4 個 callsite（BusinessLogicPage / DiaryPage / DevDiarySection / PredictButton）情境化文案；移除 hard-coded `Running prediction…`。

**AC：**

- **AC-011-PROP** — `LoadingSpinner` 支援 `label` prop，未傳時不顯示 `Running prediction...` 這組 prediction-specific 文字
- **AC-011-CALLSITES** — 4 個 callsite 各自 label 與頁面情境一致
- **AC-011-REGRESSION** — tsc / Vitest / Playwright 全綠

---

### K-013 — Consensus / Stats Single Source of Truth（TD-008 Option C 實作）

- **Status:** closed / type: refactor / **Closed: 2026-04-21**
- **Ticket:** [docs/tickets/K-013-consensus-stats-contract.md](docs/tickets/K-013-consensus-stats-contract.md)
- **摘要：** 前端抽出 `statsComputation.ts` 純函式 + 後端 contract fixture 鎖 compute_stats 行為；TD-008 Option C 實作。R2 remediation 新增 AC-013-APPPAGE-E2E 4 chart-visibility state spec 作為 bug-found protocol 的回歸保護。

**AC（原文保留）：**

#### AC-013-UTIL：前端抽出共用純函式

- **Given** `frontend/src/utils/statsComputation.ts` 已建立
- **When** 外部呼叫 `computeStatsFromMatches(matches, currentClose, timeframe)`
- **Then** 回傳型別等同後端 `PredictStats` 的 camelCase 映射
- **And** 函式為純函式，無 React 依賴、無 side effect、無隱式 `Date.now()`

#### AC-013-APPPAGE：AppPage.tsx displayStats 邏輯簡化

- **Given** `frontend/src/AppPage.tsx`
- **When** 讀取 `displayStats` useMemo
- **Then** `appliedSelection == all matches` → 直接使用 `appliedData.stats`；subset → 呼叫 `computeStatsFromMatches(...)`
- **And** 原 inline `computeDisplayStats` 與獨立 `projectedFutureBars` useMemo 已刪除或合併

#### AC-013-FIXTURE：Contract fixture 建立

- **Given** `backend/tests/fixtures/stats_contract_cases.json` 已建立
- **When** 檔案被讀取
- **Then** 內容為 array，每筆含 `name` / `input` / `expected`
- **And** 至少涵蓋 3 種 case：全集、subset、single match 邊界（`future_ohlc` == 2 筆）

#### AC-013-BACKEND-CONTRACT：後端 contract test 通過

- **Given** `backend/tests/test_predictor.py` 新增 parametrize test
- **When** 執行 `python3 -m pytest backend/tests/`
- **Then** 每筆 fixture case 的 `compute_stats(**input)` 輸出與 `expected` bit-exact 或誤差 ≤ 1e-6

#### AC-013-FRONTEND-CONTRACT：前端 contract test 通過

- **Given** `frontend/src/__tests__/statsComputation.test.ts` 新增
- **When** 執行 `npm test`
- **Then** 對每筆 fixture case 的 `computeStatsFromMatches(...)` 輸出經 camelCase 對映後與 `expected` bit-exact 或誤差 ≤ 1e-6

#### AC-013-APPPAGE-E2E：AppPage chart 4 state 可見性 Playwright 覆蓋（R2 remediation）

- **Given** AppPage 三路徑分支（full-set / subset / empty）
- **When** 執行 `playwright test k-013-consensus.spec.ts`
- **Then** 4 cases 全綠：(1) full-set chart 顯示；(2) subset chart 顯示；(3) empty matches chart fallback；(4) `<2 bars` fallback 不壞
- **And** consensusForecast 在 full-set 路徑維持 unconditional injection（R2 fix `853a8aa` 鎖定）

#### AC-013-REGRESSION / AC-013-API-COMPAT / AC-013-COMMENT

見 [K-013](docs/tickets/K-013-consensus-stats-contract.md) 完整 ticket。

**Deploy:** 2026-04-21 — details in ticket Deploy Record block（`frontend/public/docs/` 無異動；本票為純 refactor + contract test 新增）

---

### K-017 — /about portfolio-oriented recruiter enhancement

- **Status:** closed / type: feat / **Closed: 2026-04-20**
- **Ticket:** [docs/tickets/K-017-about-portfolio-enhancement.md](docs/tickets/K-017-about-portfolio-enhancement.md)
- **摘要：** `/about` 改 portfolio 8 sections（Header / Metrics / Roles / Pillars / Tickets / Architecture / Banner / Footer）+ 2 artifacts（`scripts/audit-ticket.sh` + `docs/ai-collab-protocols.md`）；Homepage `<BuiltByAIBanner />` 導入；Homepage v2 Dossier 版面（frame `4CsvQ`）完整版面。

**AC 一覽（完整 Given/When/Then/And 見 ticket）：**

- **AC-017-NAVBAR** — `/about` 頂部顯示 NavBar
- **AC-017-HEADER** — PageHeaderSection 的 "One operator, orchestrating AI agents end-to-end — PM, architect, engineer, reviewer, QA, designer. Every feature ships with a doc trail."
- **AC-017-METRICS** — 4 個 narrative metric：Features Shipped / First-pass Review Rate / Post-mortems Written / Guardrails in Place，各含對應 subtext；禁絕對 `N%` 數字
- **AC-017-ROLES** — 6 role cards（PM / Architect / Engineer / Reviewer / QA / Designer）各含 `Owns` + `Artefact`（18 條斷言）
- **AC-017-PILLARS** — How AI Stays Reliable 三支柱 Persistent Memory / Structured Reflection / Role Agents + 三段 italic anchor 引用 + 三 inline link 至 `/docs/ai-collab-protocols.md`
- **AC-017-TICKETS** — Anatomy of a Ticket 三張卡 K-002 / K-008 / K-009（ID / 標題 / outcome / learning / 外部 GitHub link）
- **AC-017-ARCH** — Project Architecture snapshot 三子區塊：`Monorepo, contract-first` / `Docs-driven tickets` / `Three-layer testing pyramid`
- **AC-017-BANNER** — Homepage `<BuiltByAIBanner />` "One operator. Six AI agents. Every ticket leaves a doc trail. *See how →*"（thin banner，NavBar 下 / Hero 上；clickable 導 `/about`）
- **AC-017-FOOTER** — `/about` `<FooterCtaSection />`（Let's talk + email / GitHub / LinkedIn 三 target=_blank）；`/` `<HomeFooterBar />` 純文字；`/diary` 無 Footer
- **AC-017-AUDIT** — `scripts/audit-ticket.sh` 可執行並輸出 A–G checklist（K-002 skip F/G；K-008 含 F/G；K-999 → exit 2）
- **AC-017-PROTOCOLS** — `docs/ai-collab-protocols.md` 三 section：Role Flow / Bug Found Protocol / Per-role Retrospective Log，英文撰寫，含 2–3 條 curated retrospective 節選
- **AC-017-HOME-V2** — Homepage `4CsvQ` v2 版面：hpHero / hpLogic / hpDiary 三 section + BuiltByAIBanner + FooterCtaSection；不破 AC-HOME-1
- **AC-017-BUILD** — `docs/ai-collab-protocols.md` build-time 同步至 `frontend/public/docs/`

---

### K-021 — 全站設計系統基建（配色 + 字型 + NavBar + Footer）

- **Status:** closed / type: feat / **Closed: 2026-04-20**
- **Ticket:** [docs/tickets/K-021-sitewide-design-system.md](docs/tickets/K-021-sitewide-design-system.md)
- **摘要：** K-017 後比對設計稿 v2 發現全站 3 頁面配色顛倒（米白 vs dark-mode）+ 字型系統缺失；交付 Tailwind token（paper palette 6 色）+ 三字型系統 + NavBar + Footer 共用組件，作為 K-022 / K-023 / K-024 前置依賴。

**AC：**

- **AC-021-TOKEN** — Tailwind theme.extend.colors 註冊 paper `#F4EFE5` / ink `#1A1814` / brick `#B43A2C` / brick-dark `#9C4A3B` / charcoal `#2A2520` / muted `#6B5F4E`；tsc exit 0、build 成功
- **AC-021-FONTS** — 載入 Bodoni Moda / Newsreader / Geist Mono；theme.extend.fontFamily 註冊 `display` / `italic` / `mono`；載入失敗 fallback 系統字
- **AC-021-BODY-PAPER** — 全站 5 頁（`/` / `/about` / `/diary` / `/app` / `/business-logic`）body computed `backgroundColor` `rgb(244, 239, 229)` + `color` `rgb(26, 24, 20)`；`/business-logic` 額外涵蓋 PasswordForm 未登入 + 登入後兩 UI 狀態（共 6 tests，5 路由獨立斷言不得合併）
- **AC-021-NAVBAR** — NavBar `bg-paper` + `text-ink`；項目順序 ⌂ / App / Diary / Prediction(hidden) / About；active = `text-brick-dark`（brick 保留給 K-023 Hero magenta）；4 路由獨立 test case；Prediction `toHaveCount(0)`
- **AC-021-FOOTER** — `/` / `/app` / `/business-logic` 顯示 `<HomeFooterBar />` 單行 `email · github · LinkedIn`；Geist Mono 11px、`#6B5F4E`、頂部 border；3 路由獨立 test case；`/about` 維持 `<FooterCtaSection />`；`/diary` 由 K-024 決定
- **AC-021-REGRESSION** — K-017 + K-005 所有 Playwright 斷言仍 PASS；tsc exit 0

> K-030 後續排除 `/app` 不再遵循 AC-021-BODY-PAPER + AC-021-FOOTER；sitewide-body-paper.spec.ts 對應 `/app` case 需於 K-030 更新或刪除。

---

### K-022 — /about 結構細節對齊設計稿 v2（12 項）

- **Status:** closed / type: feat / **Closed: [Closed 2026-04, date TBD]**
- **Ticket:** [docs/tickets/K-022-about-structure-v2.md](docs/tickets/K-022-about-structure-v2.md)
- **摘要：** K-017 文案定稿後 `/about` 結構細節（section label / dossier header / redaction bar / annotation / LAYER label 等）12 項對齊 Pencil frame `35VCj`；文案不動。依賴 K-021 token + 三字型。

**AC：**

- **AC-022-SECTION-LABEL** — 每 section 上方 Geist Mono small-caps label + 1px hairline（6 section）
- **AC-022-DOSSIER-HEADER** — 頁面頂部 dossier header bar `bg-charcoal` + 白字 + `FILE Nº` 編號
- **AC-022-HERO-TWO-LINE** — 主句 Bodoni Moda display；結尾 `Every feature ships with a doc trail.` Newsreader italic 獨立行
- **AC-022-SUBTITLE** — Metrics / Roles / Pillars / Tickets / Architecture 5 section 各含 Newsreader italic 副標
- **AC-022-REDACTION-BAR** — Metrics 或 Roles 至少一黑色矩形 redaction bar 視覺遮蔽欄位
- **AC-022-OWNS-ARTEFACT-LABEL** — Role Cards `OWNS` / `ARTEFACT` label Geist Mono small-caps 10-11px `text-muted`（6×2=12 條斷言）
- **AC-022-LINK-STYLE** — 頁內 link Newsreader italic + underline
- **AC-022-CASE-FILE-HEADER** — Anatomy of a Ticket section label 為 `CASE FILE`（Geist Mono small-caps）
- **AC-022-LAYER-LABEL** — How AI Stays Reliable 三 pillar 各含 `LAYER 1` / `LAYER 2` / `LAYER 3` 前綴
- **AC-022-FOOTER-REGRESSION** — `/about` `<FooterCtaSection />` 在米白 body 下視覺不破、AC-017-FOOTER 斷言仍 PASS
- **AC-022-ANNOTATION** — Role Cards 至少一卡含 `BEHAVIOUR` / `POSITION` Geist Mono annotation（9-10px `text-muted`）
- **AC-022-ROLE-GRID-HEIGHT** — Role Cards 3×2 grid 高度誤差 ≤ 2px
- **AC-022-REGRESSION** — K-017 所有 Playwright 斷言仍 PASS；tsc exit 0

---

### K-023 — Homepage 結構細節對齊設計稿 v2（5 項）

- **Status:** closed / type: feat / **Closed: 2026-04-21**
- **Ticket:** [docs/tickets/K-023-homepage-structure-v2.md](docs/tickets/K-023-homepage-structure-v2.md)
- **摘要：** Homepage v2（frame `4CsvQ`）5 項結構差異：Diary bullet marker / hpLogic Step header bar / Hero 分隔線 / Body padding。B-2 左箭頭撤回（實作已正確）；A-4 Hero 副標兩行於 SQ-023-02 移除 scope。依賴 K-021 token + 三字型。

**AC：**

- **AC-023-DIARY-BULLET** — Homepage Diary 每條 `<DiaryTimelineEntry>` 左側矩形 marker 20×14px `#9C4A3B`
- **AC-023-STEP-HEADER-BAR** — hpLogic 每張 Step 卡片頂部 `#2A2520` bar + 白字 `STEP 0X · <LABEL>` Geist Mono 10px
- **AC-023-HERO-HAIRLINE** — Hero 副標下方全寬 1px `#2A2520` 水平分隔線
- **AC-023-BODY-PADDING** — main content container desktop padding `72px 96px`；mobile responsive（由 Architect 定義）
- **AC-023-REGRESSION** — K-017 所有 AC（特別 AC-017-HOME-V2 / AC-017-BANNER / AC-HOME-1）仍 PASS；`<DiaryTimelineEntry>` 絕對定位機制不破；tsc exit 0

> AC-023-HERO-SUBTITLE-TWO-LINE 原為 A-4 項，經 PM 裁決 SQ-023-02 從 scope 移除（KG-023-01 正式 closed）。

---

### K-026 — AppPage 子元件 paper palette 遷移（superseded by K-030）

- **Status:** superseded / type: refactor
- **Ticket:** [docs/tickets/K-026-apppage-subcomponents-paper-palette.md](docs/tickets/K-026-apppage-subcomponents-paper-palette.md)
- **Superseded by:** [K-030](docs/tickets/K-030-app-page-isolation.md)（K-030 重新定位 `/app` 為獨立 tool 頁，會重做 AppPage 配色與結構；K-026「對齊 paper palette」前提不再成立）

**Context：** K-026 2026-04-20 開立時前提為「`/app` 屬 marketing site」，2026-04-21 使用者回饋打破該前提。原 AC-026-APPPAGE-PAPER / AC-026-APPPAGE-VISUAL / AC-026-REGRESSION 不再適用。

---

### K-027 — DiaryPage 手機版 milestone timeline 視覺重疊修復

- **Status:** closed / type: bug / **Closed: 2026-04-21**
- **Ticket:** [docs/tickets/K-027-mobile-diary-layout-fix.md](docs/tickets/K-027-mobile-diary-layout-fix.md)
- **摘要：** `/diary` 手機版（375 / 390 / 414）相鄰 milestone card 視覺重疊修復；容器 `overflow-hidden` 防長字串橫溢 + 文字藉 `break-words` / `flex-col` 完整折行。

**AC：**

- **AC-027-NO-OVERLAP** — 手機 3 viewport 下，折疊與全部展開狀態各一輪，相鄰 milestone bounding box y 區間完全不重疊；最後一個 card 完整可見；3 個獨立 test case
- **AC-027-TEXT-READABLE** — title / date / text 完整顯示，無 `text-overflow: ellipsis` 截斷、文字可讀對比 + 375px 下 font-size ≥ 12px；3 個獨立 test case
- **AC-027-DESKTOP-NO-REGRESSION** — 桌面 1024 / 1280 / 1440 viewport 與 K-021 closed 時 visual-report 視覺一致；既有 diary spec 全量 regression 通過（桌面 baseline 1 case + 既有 diary-related 全量 regression）

**Test case 總計下限：7 個新增 + 既有 regression。**

---

### K-029 — /about Architecture + Ticket Anatomy cards 文字配色遷移

- **Status:** closed / type: fix / **Closed: 2026-04-22**
- **Ticket:** [docs/tickets/K-029-about-card-body-text-palette.md](docs/tickets/K-029-about-card-body-text-palette.md)
- **摘要：** `/about` Architecture + Ticket Anatomy 兩 section 的 `ArchPillarBlock` / `TicketAnatomyCard` 內 K-022 A-12 遷移遺漏的 dark-theme `text-gray-300/400/500` + `text-purple-400` → 遷 K-021 paper palette（body = `text-muted`；testing pyramid layer span = `text-ink`；ticket ID badge = `text-charcoal`；pyramid `<li>` detail pin `text-muted` 防 hierarchy inversion）。PM 於 Architect Pre-check BQ 依 architecture.md Design System tokens + WCAG AA 對比計算直接裁決三項 token 選擇。

**AC（原文保留）：**

#### AC-029-ARCH-BODY-TEXT：Architecture section card body 文字採用 paper palette token

- **Given** 使用者訪問 `/about`
- **When** 頁面滾動至 Project Architecture section（Nº 05）
- **Then** 三個 ArchPillarBlock body text computed `color` ∈ {`rgb(26, 24, 20)`, `rgb(42, 37, 32)`, `rgb(107, 95, 78)`}（三個皆須命中）
- **And** body text 不得為 `rgb(209, 213, 219)` / `rgb(156, 163, 175)` / `rgb(107, 114, 128)`
- **And** testing pyramid `<li>` detail 固定 = `rgb(107, 95, 78)`（text-muted；不採 allow-list，防階層崩塌）
- **And** testing pyramid layer label span（Unit / Integration / E2E）= `rgb(26, 24, 20)`（text-ink）
- **And** Playwright 斷言：3 pillar + 3 pyramid li + 3 layer span = **9 個獨立斷言**

#### AC-029-TICKET-BODY-TEXT：Ticket Anatomy section card body 文字採用 paper palette token

- **Given** 使用者訪問 `/about`
- **When** 頁面滾動至 Anatomy of a Ticket section（Nº 04）
- **Then** 三個 TicketAnatomyCard Outcome / Learning 內容 computed `color` ∈ allow-list（三個皆須命中）+ 不得為 gray-400/500
- **And** Outcome / Learning label（mono span）computed `color` ∈ allow-list，三個 card 皆逐一命中，不得為 gray-500
- **And** ticket ID badge（`K-002` / `K-008` / `K-009`）= `rgb(42, 37, 32)`（text-charcoal），不得為 `rgb(196, 181, 253)`（purple-400）
- **And** Playwright 斷言：3 body + 3 badge + 6 label = **12 個獨立斷言**

#### AC-029-REGRESSION：K-022 既有斷言不回歸

見 [K-029](docs/tickets/K-029-about-card-body-text-palette.md)：K-022 + K-017 全斷言仍 PASS + tsc exit 0。

**Known Gap：** KG-029-01（Playwright selector path 由 Architect design doc prescribe 4 data-testid，Engineer 照辦；QA 驗 compliance）。

**Tech Debt：** TD-K029-01（`about-v2.spec.ts` L474 / L487 Outcome / Learning label selector 用 `hasText`，label copy 當下鎖定安全，未來 data 彈性可能誤命中 sibling `<p>`；低優先，下一張觸及 TicketAnatomyCard 或 label 改 data-driven schema 的 ticket 一併遷移為 testid）。

**Test case 總計：21 個新 Playwright 斷言（9 + 12）+ 既有 about-v2.spec.ts / about.spec.ts regression；full suite 197 pass / 1 skip / 0 fail。**

---

### K-028 — Homepage 視覺修復（section spacing + DevDiarySection entry 高度自適應）

- **Status:** closed / type: fix / **Closed: 2026-04-21**
- **Ticket:** [docs/tickets/K-028-homepage-visual-fix.md](docs/tickets/K-028-homepage-visual-fix.md)
- **摘要：** Homepage section 間距補足（desktop gap 72 / mobile gap 24）；DevDiarySection 從 absolute `ENTRY_HEIGHT=140` 改 flex-col flow layout，entry 高度自適應。

**AC（原文保留）：**

#### AC-028-SECTION-SPACING：Homepage section 之間有適當 vertical spacing

- **Given** 使用者訪問 `/`
- **When** 頁面載入完成（desktop 1280 / mobile 375 / tablet 640 / tablet 639）
- **Then** HeroSection / ProjectLogicSection / DevDiarySection 三者相鄰 gap ≥ 設計值（desktop 72px、mobile 24px）
- **And** Playwright bounding box gap 斷言對齊 frame `4CsvQ` 提取值

#### AC-028-DIARY-ENTRY-NO-OVERLAP：DevDiarySection 各 entry 渲染不重疊

- **Given** diary.json ≥ 3 milestone 且含長文字 entry
- **When** 頁面滾動至 Diary section
- **Then** 相鄰 entry bounding box 不重疊（`bottom[N] <= top[N+1]` ±2px）
- **And** vertical rail 視覺貫穿（rail 位於 diary-entries 容器內 + width=1 + height>0）
- **And** 375px mobile viewport 同樣不重疊

#### AC-028-DIARY-EMPTY-BOUNDARY：0-entry / 1-entry 邊界不破

- **Given** diary.json milestone 為 0 或 1 條 entry
- **When** 頁面載入
- **Then** 0-entry：rail 不存在或 height=0；1-entry：entry 渲染且 marker 存在

#### AC-028-DIARY-RAIL-VISIBLE：rail 可見且對齊容器

- **Given** ≥ 2 entries
- **When** 頁面載入
- **Then** `data-testid="diary-rail"` 位於 `data-testid="diary-entries"` bbox 內 + width=1 + height>0

#### AC-028-REGRESSION：K-023 斷言不回歸 + marker coord / count integrity

- marker / STEP header / body padding / tsc 全通過
- MARKER-COORD-INTEGRITY：marker width=20 height=14 bg=#9C4A3B
- MARKER-COUNT-INTEGRITY：marker 數量 = diary.json 攤平後 milestone 數

**Known Gap：** KG-028-01（40+ 字 long-word 溢出，已 `break-words` 緩解）/ KG-028-02（HomeFooterBar scrollHeight 未獨立斷言，工程判斷 + QA 手測覆蓋）。

**Tech Debt：** TD-028-A（marker x-center 對齊斷言，P3）/ TD-028-B（1-entry rail collapse height 斷言，P3）/ TD-028-C（KG-028-02 措辭精確化，P2 — 本票 close 前已修正）。

**Deploy:** 2026-04-21 20:28 UTC+8 — commits `2d30672` (src) + `e162bb5` (docs) → `https://k-line-prediction-app.web.app`

---

### K-030 — /app page isolation（new tab + no NavBar/Footer + background restore）

- **Status:** closed / type: fix / **Closed: 2026-04-21**
- **Ticket:** [docs/tickets/K-030-app-page-isolation.md](docs/tickets/K-030-app-page-isolation.md)
- **摘要：** `/app` 視為獨立 tool 頁；NavBar 的 App link + Homepage Hero CTA 雙入口均改 new tab；`/app` 頁面移除 NavBar + Footer；背景改 `bg-gray-950`（`rgb(3, 7, 18) = #030712`，對齊 Pencil v1 `ap001.fill`）。superseded K-026 + K-004（scope 已併入本票）。

**AC：**

#### AC-030-NEW-TAB: "App" link opens /app in a new tab

- **Given** 使用者在任一含 UnifiedNavBar 的頁面（`/`、`/about`、`/diary`、`/business-logic`）
- **When** 點擊 NavBar 的 App link
- **Then** 瀏覽器在新分頁開啟 `/app`（原分頁保持不變）
- **And** 新分頁成功載入 `/app`（無 404 / redirect）
- **And** `<a>` 元素含 `target="_blank"` 與 `rel="noopener noreferrer"`

#### AC-030-NO-NAVBAR: /app page has no UnifiedNavBar

- **Given** 使用者訪問 `/app`
- **When** 頁面載入完成
- **Then** `[data-testid="navbar-desktop"]` + `[data-testid="navbar-mobile"]` 皆 `toHaveCount(0)`
- **And** Home / Diary / About / App 四個 link role 皆不存在
- **And** `/app` tool 內容（OHLC input / Predict button）可見

#### AC-030-NO-FOOTER: /app page has no HomeFooterBar

- **Given** 使用者訪問 `/app`
- **When** 頁面載入完成
- **Then** `getByRole('contentinfo')` `toHaveCount(0)`
- **And** 既有 HomeFooterBar 簽名文字（`yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn` 與 GA 揭露文）皆不出現
- **And** viewport 底部為 tool UI，不是 marketing footer

#### AC-030-BG-COLOR: /app wrapper bg = gray-950 + body 仍為 paper

- **Given** 使用者訪問 `/app`
- **When** 頁面載入完成
- **Then** `<div id="root">` 下層 wrapper `<div>` computed `background-color === 'rgb(3, 7, 18)'`
- **And** `<body>` computed `background-color === 'rgb(244, 239, 229)'`（證明 wrapper override 策略未動 body 規則）
- **And** viewport 上下無 paper bleed-through

#### AC-030-FUNC-REGRESSION: 現有 /app 功能不破

- **Given** K-030 layout 改動完成
- **When** 使用者操作 OHLC input + Predict button
- **Then** Vitest 既有 36/36 pass（AppPage / OHLCEditor / PredictButton / StatsPanel / MatchList）
- **And** Playwright 既有 172 passed / 1 skipped / 0 failed
- **And** chart / match list / stats panel 無視覺遮擋

#### AC-030-PENCIL-ALIGN: /app 實作對齊 Pencil v1 `ap001` frame

- **Given** Pencil v1 `frontend/design/homepage-v1.pen` 含 `/app` 正式 frame `ap001`（fill `#030712`，child `ap002` TopBar fill `#111827`，無 NavBar / Footer 子節點）
- **When** K-030 implementation 完成
- **Then** wrapper bg = `#030712`（`bg-gray-950`）+ TopBar bg = `#111827`（`bg-gray-900`）+ NavBar / Footer 結構性不存在
- **And** QA `mcp__pencil__get_screenshot(ap001)` 視覺比對 PASS

**Test case 總計下限：6 個新 AC + 既有 Vitest / Playwright regression。6 個新 Playwright cases 位於 `frontend/e2e/app-bg-isolation.spec.ts`。**

---

### K-031 — /about 移除 "Built by AI" showcase section (S7)

- **Status:** closed / type: fix / **Closed: 2026-04-21**
- **Ticket:** [docs/tickets/K-031-remove-built-by-ai-showcase-section.md](docs/tickets/K-031-remove-built-by-ai-showcase-section.md)
- **摘要：** `/about` S7 `BuiltByAIShowcaseSection` 整段移除；homepage `BuiltByAIBanner` 不動。Architecture.md 3 項 pre-existing drift（L13/L140/L410）同 commit 修復。

**AC：**

#### AC-031-SECTION-ABSENT: "Built by AI" section is not present on /about

- **Given** 使用者訪問 `/about`
- **When** 頁面載入完成
- **Then** DOM 無 `id="banner-showcase"` 元素；無 "Built by AI" heading；無 "The real banner is clickable and navigates to /about" 文字
- **And** `BuiltByAIShowcaseSection.tsx` 檔案已從 codebase 刪除

#### AC-031-LAYOUT-CONTINUITY: No layout gap between S6 and footer

- **Given** 使用者在 `/about` 移除 S7 後
- **When** 滾動過 Project Architecture section (Nº 05)
- **Then** `FooterCtaSection` 緊接 architecture section，無可見空白 gap
- **And** `SectionContainer id="banner-showcase"` 不存在於 DOM
- **And** 整頁 scroll height 縮短（section 是被刪除，不是隱藏）

#### AC-031-K022-REGRESSION

見 [K-031](docs/tickets/K-031-remove-built-by-ai-showcase-section.md)：about-v2.spec.ts AC-022-* + about.spec.ts AC-017-BANNER 全綠；tsc exit 0。

---

### K-020 — GA4 SPA Pageview E2E + HTTP Beacon Verification

- **Status:** closed / type: test / **Closed: 2026-04-22**
- **Ticket:** [docs/tickets/K-020-ga-spa-pageview-e2e.md](docs/tickets/K-020-ga-spa-pageview-e2e.md)
- **Follow-ups:** [K-032](docs/tickets/K-032-ga-page-location-full-url.md) (page_location value), [K-033](docs/tickets/K-033-ga-spa-beacon-emission-fix.md) (useGAPageview call pattern — T4 tracker)
- **摘要：** Delivered 9 Playwright tests (SPA-NAV × 2, BEACON × 4, NEG × 3); 8 green merged as regression guard, 1 intentionally red (T4 AC-020-BEACON-SPA) kept as K-033 tracker per PM Option A ruling. T4 correctly caught a K-018-class production bug: `useGAPageview` `gtag('event','page_view',…)` under `send_page_view:false` is silently dropped by gtag.js on SPA navigate. Three anti-decay guards landed (spec doc-block, architecture.md Known Gap blockquote, dashboard Active row for K-033). No production runtime code modified. Deploy: N/A (test-only).

**AC（原文保留）：**

#### AC-020-SPA-NAV：SPA Link click 觸發 dataLayer pageview entry（Phase 1 — PASS）

- **Given** 用戶在 `/` 頁面，`VITE_GA_MEASUREMENT_ID='G-TESTID0000'`（playwright.config.ts 已設定），`window.dataLayer` 已由 production `initGA()` 初始化
- **When** 用戶點擊 NavBar 的 `About` Link（不是 `page.goto('/about')`），觸發 React Router SPA navigate
- **Then** Playwright 透過 `page.waitForURL(/\/about$/)` 確認 URL 切換完成，並透過 `waitForFunction` 確認 `window.dataLayer` 中存在 Arguments-object entry 滿足：entry[0] === 'event' AND entry[1] === 'page_view' AND entry[2].page_location === '/about'
- **And** 該 entry 必須在點擊動作之後產生，不得混淆初始 `/` load 時的 pageview（測試必須記錄 click 前 `dataLayer.length`，斷言 click 後 length 嚴格增加且新 entry 指向 `/about`）
- **And** 測試無 `waitForTimeout`，改以 `waitForURL` + `waitForFunction` 同步
- **And** 至少 2 個獨立 Playwright test case — 一個覆蓋 NavBar Link（`/` → `/about`），另一個覆蓋 BuiltByAIBanner CTA（`/` → `/about`，不同 DOM 進入點）；每個 case 獨立 spec（不可合併）

#### AC-020-BEACON-INITIAL：初始 page load 發出 pageview beacon（Phase 2 — PASS）

- **Given** `VITE_GA_MEASUREMENT_ID='G-TESTID0000'`，`page.route('**/g/collect*', ...)` 已在 test 開始前註冊攔截器，攔截器 `route.fulfill({status: 204})` 終止 request 且將 `route.request()` 收集至 per-test array
- **When** 用戶 `page.goto('/about')` 觸發初始 pageview
- **Then** 攔截器在 5 秒 timeout 內收到至少 1 個 `/g/collect` request
- **And** 該 request host 必須是 `www.google-analytics.com`（或 `google-analytics.com`）
- **And** 測試失敗時必須 throw（不得 `test.skip()` 或 try-catch 吞掉），使 beacon 未送出問題立即可見

#### AC-020-BEACON-SPA：SPA navigate 發出新的 pageview beacon（Phase 2 — INTENTIONALLY RED, K-033 TRACKER）

- **Given** 攔截器已註冊並記錄初始 `/` load 收到的 beacon 清單為 `initialBeacons`
- **When** 用戶點擊 NavBar `About` Link 觸發 SPA navigate 到 `/about`
- **Then** `page.waitForURL(/\/about$/)` 後，攔截器在 5 秒 timeout 內收到至少 1 個**新**的 `/g/collect` request（`beacons.length > initialBeacons.length`）
- **And** 新 request 的 path key（`dl` 或 `dp`）必須 urlDecode 後包含 `/about`
- **And** 至少 1 個獨立 Playwright test case

**Red status rationale:** T4 currently fails because `useGAPageview` dispatches `gtag('event', 'page_view', {…})` while `initGA()` has set `send_page_view: false`; modern GA4 gtag.js silently drops this combo — no `/g/collect` emitted on SPA route change. K-020 Engineer Dry-Run (DR 2026-04-22) confirmed full-URL `page_location` does NOT fix beacon emission; the call pattern itself must change. **Do NOT loosen this assertion to turn it green** — loosening reintroduces the exact K-018-class gap K-020 was designed to close. K-033 will fix by migrating to canonical GA4 SPA pattern; AC-033-BEACON-SPA-GREEN defines green state preserving this assertion verbatim.

#### AC-020-BEACON-PAYLOAD：beacon query string pin 必備欄位（Phase 2 — PASS）

- **Given** 攔截器已捕捉到一個 pageview beacon request
- **When** 測試讀取 `request.url()` 並 parse query string
- **Then** query string 必須包含：`v=2` AND `tid=G-TESTID0000` AND `en=page_view`
- **And** path key (`dl` per Engineer dry-run DR-2) urlDecode 後對應當前路由

#### AC-020-BEACON-COUNT：每次 pageview 恰好 1 個 beacon（Phase 2 — PASS）

- **Given** 攔截器已註冊並清空 beacon array
- **When** 用戶完成 1 次 pageview 動作（初始 load 或 SPA navigate）
- **Then** 該次動作完成後 1 秒內，攔截器收到的 `/g/collect` request count 恰為 1
- **And** 防 StrictMode 雙重 invoke 或未來 duplicate call site 造成的 beacon 重複送出（DR-4 確認 gtag.js 內部 dedupe StrictMode 雙 push）

#### AC-020-NEG-QUERY / NEG-HASH / NEG-SAMEROUTE：行為鎖死（Phase 3 — PASS）

- **AC-020-NEG-QUERY:** query-only 變化（`/?x=1` → `/?x=2`）500ms 後攔截器 beacon count 不變
- **AC-020-NEG-HASH:** hash-only 變化（`/about` → `/about#team`）500ms 後 beacon count 不變
- **AC-020-NEG-SAMEROUTE:** 用戶在 `/about` 再次點擊 NavBar `About` Link，500ms 後 beacon count 不變
- 鎖死目前 `[location.pathname]` deps 行為；未來改成 query/hash 敏感需另開 ticket + 改 AC

**PM ruling 2026-04-22（Option A — split）：** Engineer delivered 8/9 pass. T4 root cause is pre-existing `useGAPageview` gtag call pattern (K-018 Engineer responsibility per Bug Found Protocol step 1). T4 retained as red, tracked to K-033. K-020 8 green 併入作 K-018-class regression guard. Pre-Verdict matrix: A=11/12, B=6/12, C=6/12 (red team 3 challenges all counterable; biggest unresolved risk = K-033 slippage, mitigated by medium priority + dashboard + in-file tracker). Bug Found Protocol 4 steps executed. Reviewer C-1/W-1/W-2/W-3 all fix-now. See ticket for full chain of custody.

---

## §5 Tech Debt

完整登記簿：[docs/tech-debt.md](docs/tech-debt.md)。以下為索引摘要（依來源 + 狀態排序）。

| ID | 項目 | 來源 | 優先級 | 狀態 / 對應 ticket |
|----|------|------|--------|----|
| TD-001 | 前端 bundle 過大（K-003 已完成主體，餘量監控）| K-003 retrospective | 低 | 持續監控 |
| TD-002 | 後端測試覆蓋率不足（K-001 餘項）| K-001 retrospective | 中 | 持續補強 |
| TD-003 | Upload history 併發 race | 2026-04-18 Codex review P2-A | 中 | open — 多 worker 時升 P1 |
| TD-004 | MatchList PredictorChart effect deps 不含實際 candle values | 2026-04-18 Codex review P2-B | 中 | open — 併 TD-005 |
| TD-005 | `frontend/src/AppPage.tsx` 責任過多（拆 hook + sub-sections）| 2026-04-18 Codex review Modularity | 中 | open — 等 TD-008 落地後排 RFC |
| TD-006 | `backend/main.py` 混雜 wiring / CSV / 狀態 / 持久化 / 預測 | 2026-04-18 Codex review Modularity | 中 | open — 併 TD-003 同 RFC |
| TD-007 | `backend/predictor.py` 模組過廣（拆 ma / similarity / stats） | 2026-04-18 Codex review Modularity | 中 | open — 排 TD-008 之後 |
| TD-008 | Cross-layer 重複計算（consensus/stats 前後端漂移）| 2026-04-18 Codex review | 高 | **→ [K-013](docs/tickets/K-013-consensus-stats-contract.md)** 實作中 |
| TD-009 | Vitest index-based selector 殘留 | 2026-04-18 K-010 review W1/W2 | 低 | **→ [K-014](docs/tickets/K-014-vitest-index-selector-cleanup.md)** |
| TD-010 | `predictor.find_top_matches()` `ma_history` silent fallback | 2026-04-18 K-009 review S1 | 中 | **→ [K-015](docs/tickets/K-015-find-top-matches-ma-history-required.md)** |
| TD-011 | `homepage.pen` 含舊 `Running prediction...` 文字節點 | 2026-04-18 K-011 review Drift C | 低 | open — 下次 Designer 進場順帶同步 |
| TD-012 | visual-report `/app` 空狀態截圖價值低 | 2026-04-18 K-008 review S1 | 低 | open — 下次 visual-report 改版併處理 |
| TD-013 | GA4 initGA() 無冪等保護 + dataLayer 型別 + 未知路由無 warn | 2026-04-19 K-018 review S2–S4 | 低 | open — 下次 GA ticket 清理 |
| TD-K021-01 | 部分頁面 `font-mono` 仍用 Tailwind 預設未遷 Geist Mono token | K-021 Engineer retro | 低 | open — K-022/023/024 漸進遷 |
| TD-K021-02 | UnifiedNavBar 6 處 hardcode hex | K-021 Reviewer W-3 | 中 | **→ [K-025](docs/tickets/K-025-navbar-hex-to-token.md)** |
| TD-K021-07 | AppPage `h-screen overflow-hidden` + HomeFooterBar <900px viewport 擠壓 | K-021 Reviewer W-1 | 低 | open — AppPage redesign 時併 |
| TD-K021-08 | HomeFooterBar email/github/LinkedIn 無 `<a>` 錨點 | K-021 Reviewer S-1 | 低 | open — 下次 UI polish |
| TD-K021-09 | `/` route NavBar inactive color 未於 navbar.spec.ts 斷言 | K-021 Reviewer S-2 | 低 | **→ K-025 AC-025-NAVBAR-SPEC** |
| TD-K021-10 | DiaryPage `font-mono` 未遷 Geist Mono token | K-021 Reviewer S-5 | 低 | open — K-024 時評估 |
| TD-K021-11 | PasswordForm button 保留 `bg-purple-600`，未遷 `bg-brick` | K-021 Reviewer Round 3 S-R3-02 | 低 | open — PasswordForm 重構時一併 |
| TD-K021-13 | PasswordForm `expiredMessage` `text-yellow-400` 對比 ~2.4:1，WCAG AA 不達 | K-021 Reviewer Round 3 S-NEW-1 | 中 | open — K-022 /about 改版順手掃 |
| TD-K027-01 | diary-mobile.spec.ts TC-007 僅 1280px；AC-027-DESKTOP-NO-REGRESSION 要求 1024/1280/1440px 三 viewport | K-027 Reviewer I-002 | 低 | open — K-024 啟動時補齊 |
| TD-K027-02 | diary-mobile.spec.ts `.px-4.pb-4` 定位器脆弱（K-024 重寫後失效）| K-027 Reviewer N-001 | 低 | open — K-024 Reviewer checklist 稽核 |
| TD-K027-03 | milestone title overflow 屬性未驗（AC-027-TEXT-READABLE 有但 spec 缺斷言）| K-027 Reviewer N-003 | 低 | open — K-024 結構改動時補驗 |
| TD-K027-04 | `assertLastCardVisible` 的 `waitForTimeout(200)` hardcoded sleep | K-027 Reviewer R2 I-R2-01b | 低 | open — K-024 diary spec 重寫時清理 |
| TD-K022-01 | `fontFamily.italic` 命名與 `italic` font-style class 混淆 | K-022 Breadth Review I-2 | 低 | open — 下次 tailwind.config.ts 結構修改時 rename |
| TD-K022-02 | `SectionLabel` 殭屍 colorMap（purple/cyan/pink/white）保留向後相容 | K-022 Breadth Review I-3 | 低 | open — K-030 closed 後 grep 確認清除（K-030 已 closed 2026-04-21，待 follow-up） |
| TD-K030-01 | AppPage interaction regression E2E coverage 缺（PredictButton sticky / OHLC edit 互動無 Playwright 斷言）| K-030 Code Review I-1 | 低 | open — TD-005 AppPage 拆分 ticket 啟動時補齊 |
| TD-K030-02 | UnifiedNavBar `renderLink` 本地 type alias 未改 `typeof TEXT_LINKS[number]` 派生 | K-030 Code Review M-3 | 低 | open — 下次 NavBar 結構改動 ticket 順手處理 |
| TD-K030-03 | `visual-report.ts` 未帶 TICKET_ID 時 fallback `K-UNKNOWN` 汙染 `docs/reports/` | K-030 QA retro | 中 | open — 下次 visual-report tooling 改動時 throw + 移除 fallback |
| TD-K030-04 | `frontend/public/diary.json` K-021/K-022/K-023 遺留繁中條目違反英文硬規則 | K-030 QA retro | 中 | open — 下次 diary 類 ticket（K-024 等）英譯 |

**更新規則：** 新增技術債由 Code Reviewer 列單 → PM 逐條裁決 → 寫入 tech-debt.md；升級為 ticket 時在本表標 `→ K-XXX`；ticket closed 後保留紀錄。
