---
ticket: K-093
title: Copy Prediction — include input OHLC time range in banner
status: closed
phase: 2
closed-commit: 6642c20
opened: 2026-05-04
depends-on: [K-091]
qa-early-consultation: "N/A — retroactive ticket"
sacred-clauses: []
---

# K-093 — Copy Prediction input range

## Problem

The Copy Prediction banner showed only the 72H forecast stats. Users copying results had no
record of which OHLC input window the prediction was based on, making it unclear which query
period produced the output.

## Goal

Prepend an **"Input: start ~ end"** line (UTC+8) to the Copy Prediction banner, derived from
the current OHLC editor rows.

## Acceptance Criteria

- **AC-093-RANGE**: Copied text includes `Input: <start> ~ <end>` (UTC+8 format) prepended
  before the 72H forecast stats.
- **AC-093-UTC8**: All time displays in the banner use UTC+8 (not UTC+0).
- **AC-093-HOUR-STEP**: The range picker uses hour-only steps (no minute granularity).

## Implementation Notes

- Phase A (PR #145): Input range prepended to copy banner.
- Phase B (PR #147): Copy banner uses current session stats; UTC+8 conversion applied throughout;
  range picker converts UTC+8 ↔ UTC+0 internally.
- Originally tracked as sub-ticket K-091c; reassigned standalone number K-093 so the diary
  entry can carry a valid `ticketId` (DiaryEntrySchema regex `^K-\d{3}$`).
