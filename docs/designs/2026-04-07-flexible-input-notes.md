# Flexible Input Feature Requirement Notes

**Date:** 2026-04-07
**Status:** In requirement discussion; not yet entered design stage

---

## Background

Currently, users must input exactly 48 K-line bars (1H timeframe) to run prediction. The historical DB auto-merges and updates after each user upload of timestamped data, meaning the DB may already contain some recent bars.

## Core Goal

Allow users to input **fewer than 48** K-line bars; the system auto-backfills the missing portion from the historical DB to reach the standard window size, then runs matching.

## Behavior Design (draft)

**Case A: DB has sufficient backfill data**
- User inputs N bars (N < 48); system finds prefix (48 - N) bars from DB
- After merge, feed `find_top_matches()`; user is unaware; prediction runs normally

**Case B: DB backfill insufficient**
- After merge, still less than 48 bars
- Backend returns error indicating the missing date range (from-to)
- Frontend shows: "Insufficient data; please provide K-lines from {fromDate} to {toDate}"

**Case C: User inputs >= 48 bars**
- Existing behavior unchanged

## Frontend Behavior Changes (draft)

- Input table changes from "fixed 48 rows" to "variable row count"
- On predict click, if backend reports a date gap, show a clear message (not a generic error)

## Open Questions (for design discussion)

1. **Is the standard window size fixed at 48?**
   If user inputs 30 bars and DB has 50 backfill bars, is matching with an 80-bar window allowed? Or must we fill exactly to 48?

2. **Minimum row count limit in frontend input UI?**
   Backend minimum is 2 bars to run; should UI surface a lower-bound hint?

3. **Should backfill data be shown on the chart?**
   User provides 24 bars but chart shows 48 (including DB backfill); how do we handle UX?

## Relevant Code Status

- Backend has no hard 48-bar requirement; `find_top_matches()` accepts a minimum of 2 bars
- MA99 calc already supports "aligned" mode (when timestamps present, prefix bars are pulled from historical DB)
- Historical DB path: `backend/data/Binance_ETHUSDT_1h.csv` (1H), `Binance_ETHUSDT_d.csv` (1D)
- Related functions: `get_prefix_bars()` (added in MA99 plan), `_history_time_index()`, `_normalize_time()`
