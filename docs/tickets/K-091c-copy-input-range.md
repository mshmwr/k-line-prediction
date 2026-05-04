---
ticket: K-091c
title: Copy Prediction — include input OHLC time range in banner
status: closed
phase: 2
closed-commit: 6642c20
opened: 2026-05-04
depends-on: [K-091]
qa-early-consultation: "N/A — retroactive ticket"
sacred-clauses: []
note: Sub-ticket of K-091. ticketId K-091c cannot be stored in diary.json (DiaryEntrySchema regex ^K-\d{3}$ rejects letter suffix) — diary entry has no ticketId field.
---

# K-091c — Copy Prediction input range

## Problem

The Copy Prediction banner showed only the 72H forecast stats. Users copying results had no
record of which OHLC input window the prediction was based on, making it unclear which query
period produced the output.

## Goal

Prepend an **"Input: start ~ end"** line (UTC+8) to the Copy Prediction banner, derived from
the current OHLC editor rows.

## Acceptance Criteria

- **AC-091c-RANGE**: Copied text includes `Input: <start> ~ <end>` (UTC+8 format) prepended
  before the 72H forecast stats.
- **AC-091c-UTC8**: All time displays in the banner use UTC+8 (not UTC+0).
- **AC-091c-HOUR-STEP**: The range picker uses hour-only steps (no minute granularity).

## Implementation Notes

- Phase A (PR #145): Input range prepended to copy banner.
- Phase B (PR #147): Copy banner uses current session stats; UTC+8 conversion applied throughout;
  range picker converts UTC+8 ↔ UTC+0 internally.
- diary.json entry has no `ticketId` — K-091c fails `^K-\d{3}$` regex in DiaryEntrySchema.
  Hotfix PR #152 removed the invalid ticketId (2026-05-04).
