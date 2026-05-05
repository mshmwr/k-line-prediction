---
ticket: K-094
title: Add volatility amplitude gate to match filter
status: open
phase: 1
opened: 2026-05-05
depends-on: [K-092]
qa-early-consultation: "✗"
sacred-clauses: []
---

# K-094 — Add volatility amplitude gate to match filter

## Problem

Pearson correlation normalises each window by its own mean and standard deviation before comparing
shapes. A 24-bar segment with near-zero volatility (e.g., ETH ±0.1% per bar in 2022) and one with
high volatility (ETH ±1% per bar in 2026) can yield r = 0.77 if their relative direction patterns
agree. The result is a "matched" segment whose K-bar amplitude is visually incomparable to the
query — confirmed by screenshot inspection on 2026-05-05: query bars 2280–2360, matched segment
bars 1301–1319 with near-flat candlesticks.

Root cause: Pearson is amplitude-agnostic by design. No existing gate checks whether the
matched segment has comparable price-range magnitude to the query.

## Goal

Add a **volatility ratio gate** inside `find_top_matches` that rejects candidates whose
standard deviation of close prices is too far from the query's standard deviation. The ratio
is computed on the normalised (percent-change) series so it is price-level independent.

## Acceptance Criteria

- **AC-094-VOL-GATE**: `find_top_matches` rejects any candidate where
  `std(candidate_pct) / std(query_pct)` falls outside `[VOL_RATIO_MIN, VOL_RATIO_MAX]`.
  - Default thresholds: `VOL_RATIO_MIN = 0.25`, `VOL_RATIO_MAX = 4.0`
    (i.e., candidate volatility must be within 4× of query volatility in either direction).
  - Percent-change series: `pct = close.pct_change().dropna()`.
  - If `std(query_pct) == 0`, skip gate (degenerate query — no pct change).
- **AC-094-NO-REGRESSION**: All existing backend unit tests pass.

## Design Notes

Compute `query_vol` once before the candidate loop (same pattern as query MA direction in K-092).
Inside the loop, compute `candidate_vol` per candidate window's close series.

Thresholds `VOL_RATIO_MIN` / `VOL_RATIO_MAX` as module-level constants in `predictor.py` so
they are easy to tune without touching the algorithm.

No config / API surface change required for Phase 1. Thresholds can be exposed as parameters
in a later ticket if user-tunable control is needed.

## Manual Verification

**MV-094-01 — Reproduce the failing case**
- Given: query = ETH 2026-05-04 24-bar window (std_pct ≈ high volatility)
- When: prediction run executed; the 2022-11-06 segment (r = 0.7749) is a candidate
- Before fix: segment appears in Match List
- After fix: segment is rejected by volatility gate (its std_pct is far below query's)

**MV-094-02 — Match List non-empty**
- When: prediction run executed with same query
- Then: at least 1 match remains in the result set

## File Change List

| File | Change |
|---|---|
| `backend/predictor.py` | Add `VOL_RATIO_MIN`, `VOL_RATIO_MAX` constants; compute `query_vol` before candidate loop; reject candidate if ratio out of range |
| `backend/tests/test_predictor.py` | Add test: candidate with std_pct ratio outside bounds is rejected; candidate within bounds passes |
