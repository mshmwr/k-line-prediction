---
ticket: K-087
title: History Range Picker
status: closed
phase: 1
opened: 2026-05-03
closed-commit: cca1d42
depends-on: []
qa-early-consultation: ✓
sacred-clauses: []
---

# K-087 — History Range Picker

## Problem

To run a prediction, the user must export a CSV from TradingView, upload it, and wait for MA99 to compute.
The app already holds the full history CSV in memory (`_history_1h`). There is no way to select a
time window directly from that data without going through the file upload flow.

## Goal

Two `datetime-local` pickers in the left sidebar that allow the user to select a UTC+0 start/end window
from the in-memory 1H history. Confirming the selection loads those bars straight into the OHLC editor
and triggers MA99 computation — identical behaviour to a CSV upload.

## Acceptance Criteria

### §1 Backend Endpoints

**AC-087-RANGE-INFO**
- Given `GET /api/history/range-info`,
- When `_history_1h` is loaded,
- Then response is `{earliest: "YYYY-MM-DD HH:MM", latest: "YYYY-MM-DD HH:MM", count: N}`.
- And status 404 if no history loaded.

**AC-087-BARS**
- Given `GET /api/history/bars?start=...&end=...`,
- When bars exist in the requested window,
- Then response is `{bars: OHLCRow[], count: N}` filtered to `[start, end]` inclusive.
- And status 422 with detail message if fewer than 2 bars found.

**AC-087-BARS-FORMAT**
- Given the `start`/`end` query params,
- When either `YYYY-MM-DDTHH:MM` (datetime-local) or `YYYY-MM-DD HH:MM` format is used,
- Then both are accepted (normalized via `[:16].replace("T", " ")`).

### §2 Frontend Component

**AC-087-PICKER-MOUNT**
- Given `HistoryRangePicker` mounts,
- When `/api/history/range-info` responds,
- Then two `datetime-local` inputs appear, defaulting to `[latest - 23H, latest]`.

**AC-087-PICKER-CONSTRAINTS**
- Given the range-info is loaded,
- When the user interacts with the inputs,
- Then `min`/`max` attributes constrain both pickers to available data; end picker `min` tracks start value.

**AC-087-LOAD**
- Given start ≤ end and at least 2 bars exist,
- When the user clicks "載入並分析",
- Then `onLoad(bars, label)` is called where `label` is `DB <start> → <end> (<count> bars, UTC+0)`.

**AC-087-ERROR-DISPLAY**
- Given the API returns a 422,
- When "載入並分析" is clicked,
- Then the error detail message is shown below the button.

### §3 Hook Integration

**AC-087-LOAD-FROM-HISTORY**
- Given `useOfficialInput.loadFromHistory(rows, label)` is called,
- When rows are provided,
- Then `ohlcData`, `sourcePath` are updated; `resetPredictionState`, `setQueryMa99([])`, `setQueryMa99Gap(null)` are called; MA99 is recomputed via `computeMa99`.

**AC-087-MIRROR-CSV-FLOW**
- Given a history load completes,
- When `viewTimeframe === '1D'`,
- Then rows are aggregated via `aggregateRowsTo1D` before MA99 computation — same as the CSV upload path.

### §4 Regression Gate

**AC-087-TSC**
- `npx tsc --noEmit` → 0 errors.

**AC-087-BACKEND-COMPILE**
- `python -m py_compile backend/main.py` → exit 0.

**AC-087-DIARY-PLAYWRIGHT**
- Playwright diary-page tests pass (exit 0) with the new diary.json entry.

## Out of Scope

- Pagination or chunking of large bar ranges.
- 1D history picker (1H only for now).
- Persisting the selected range across page reloads.
