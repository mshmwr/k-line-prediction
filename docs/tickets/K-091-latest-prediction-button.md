---
ticket: K-091
title: Latest Prediction button — one-click display of saved Firestore prediction stats
status: closed
phase: 2
closed-commit: 8ea7a6f
opened: 2026-05-04
depends-on: [K-080]
qa-early-consultation: "N/A — retroactive ticket"
sacred-clauses: []
---

# K-091 — Latest Prediction button

## Problem

After daily predictions are stored to Firestore, there was no quick way to view the latest saved
prediction stats from within the app UI. Users had to open /backtest or query Firestore directly.

## Goal

Add a **Latest Prediction** button to the Statistics panel. Clicking it fetches the most recent
saved prediction document from Firestore (via a new backend endpoint) and displays it inline:
`query_ts`, projected high / low / median, trend, and match count.

## Acceptance Criteria

- **AC-091-BUTTON**: A "Latest Prediction" button appears in the Statistics panel.
- **AC-091-FETCH**: Clicking the button calls the new `/latest-prediction` backend endpoint and
  renders `query_ts`, `projected_high`, `projected_low`, `projected_median`, `trend`, and
  `match_count` from the Firestore response.
- **AC-091-COPY**: Copied prediction text uses the current session stats (from the live
  statistics panel), not stale Firestore values.

## Implementation Notes

- Phase A (PR #143): Latest Prediction button + `/latest-prediction` backend endpoint.
- Phase B (PR #144): Switched copy-to-clipboard (was display only); fixed Cloud Run JSON parse
  error in the new endpoint.
