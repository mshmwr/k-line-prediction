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

### POST `/api/predict`
Payload
- `ohlc_data`: array of OHLC rows with optional `time`
- `selected_ids`: array of selected match ids
- `timeframe`: `1H` or `1D`
- `ma99_trend_override`: optional `up`, `down`, or `flat`

Response
- `matches`: array of match cases; each case includes:
  - `historical_ohlc`: matched historical segment
  - `future_ohlc`: actual future bars following the matched segment
  - `historical_ma99`: MA99 values aligned to the matched historical segment (`(number | null)[]`)
  - `future_ma99`: MA99 values aligned to the future bars (`(number | null)[]`)
  - `start_date`, `end_date`: time range of the matched historical segment
  - `correlation`: similarity score
- `stats`: aggregated statistics across all selected matches
- `query_ma99`: MA99 series for the current query segment (`(number | null)[]`); used to render the MA99 line on the main chart and display the latest value in the chart header
- `query_ma99_gap`: `null` if the MA99 series is fully populated; otherwise `{ from_date, to_date }` indicating the date range where data was missing and MA99 could not be computed

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

## Non-functional Requirements
- Prediction refresh after clicking the button should remain responsive.
- The matching logic should not return opposite-MA99-trend cases.
- The interface should remain usable on desktop widths without collapsing the editor and chart into an unreadable layout.
