---
ticket: K-092
title: Add local 1H MA slope direction gate to match filter
status: open
phase: 1
opened: 2026-05-04
depends-on: [K-090]
qa-early-consultation: ✗
sacred-clauses: []
---

# K-092 — Add local 1H MA slope direction gate to match filter

## Problem

The current predictor filters candidates by **1D MA99 direction** (180-day Pearson slope classified
into up / flat / down buckets, threshold ±0.4). This gate is too coarse: both the query and a
candidate can be classified `flat` while their actual 1H MA99 slopes point in opposite directions
within the local window. The result is matches where the query MA is rising and the matched segment
MA is clearly declining (confirmed by visual inspection — match #1 r=0.7978, 2018-12-08 window,
opposite local 1H MA slope to the 2026-05-04 query).

Root cause: the 1D gate measures macro direction over ~half a year; the local 1H MA reflects the
short-term momentum visible in the chart. These two metrics are independent and can diverge.

## Goal

Add a **local 1H MA slope direction consistency gate** inside `find_top_matches`, applied after the
existing 1D direction gate. A candidate whose local 1H MA slope direction is opposite to the
query's local 1H MA slope direction is rejected.

## Acceptance Criteria

- **AC-092-LOCAL-MA-GATE**: `find_top_matches` rejects any candidate whose local 1H MA slope
  direction (`_trend_direction`) is opposite to the query's local 1H MA slope direction.
  - "Opposite" = one is `+1` and the other is `-1`; mismatches against `0` (flat) are **not**
    rejected (flat is compatible with either direction).
- **AC-092-QUERY-EXTEND**: The query's local MA is computed via `_aligned_ma_series` using
  available history prefix bars (same approach as candidates), not just the raw 24-bar input.
  This ensures both sides have equivalent MA context depth.
- **AC-092-NO-REGRESSION**: All existing backend unit tests pass. The new gate does not break
  any currently-passing prediction flows.
- **AC-092-MATCH-COUNT**: A smoke run on the 2026-05-04 query (2026-05-03 08:00 ~ 2026-05-04
  07:00 UTC+8, 24 bars) must still return at least 1 match (the filter narrows but must not
  empty the result set for real inputs).

## Design Notes

`_trend_direction` (predictor.py line 269) already computes direction from a series (last − first,
epsilon guard). Reuse directly.

For the query's local MA: `_query_ma_series` (line 246) already returns the aligned 1H MA using
history prefix context. Extract its direction with `_trend_direction`.

For candidates: in the search loop, `_aligned_ma_series(window, history[:i])` gives the local
1H MA. Extract its direction. One extra O(n) call per candidate — acceptable cost relative to
the existing `_fetch_30d_ma_series` call already in the loop.

## File Change List

| File | Change |
|---|---|
| `backend/predictor.py` | Add local MA gate in `find_top_matches` search loop; extract query local MA direction before loop |
| `backend/tests/test_predictor.py` | Add test: candidate with opposite local 1H MA slope is rejected; candidate with same slope passes |
