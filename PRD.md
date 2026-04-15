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

## Non-functional Requirements
- Prediction refresh after clicking the button should remain responsive.
- The matching logic should not return opposite-MA99-trend cases.
- The interface should remain usable on desktop widths without collapsing the editor and chart into an unreadable layout.
