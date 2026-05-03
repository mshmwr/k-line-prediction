---
ticket: K-086
title: CSV-Only Backtest + Bayesian Optimize Pipeline
status: closed
phase: 1
opened: 2026-05-03
closed-commit: 4984851
depends-on: K-083, K-085
qa-early-consultation: ✓
sacred-clauses: []
---

# K-086 — CSV-Only Backtest + Bayesian Optimize Pipeline

## Problem

The Bayesian optimizer (K-083) reads Firestore for its corpus and writes results back to Firestore.
Running this locally requires GCP credentials (`gcloud auth application-default login`).
Additionally, `compute_outcome()` used a hard-coded 72-bar threshold, but the history CSV has a systematic 1-bar-per-day gap (missing 00:00 bars, 2025-03-12 → 2026-04-01), leaving only 69 bars per 72H window and causing 334 of 362 days to be skipped.

## Goal

A single `python scripts/backtest_optimize.py` entry point that runs the full feedback loop
(backtest → collect pairs → Bayesian optimize → print best params) from local CSV only —
zero Firestore, zero GCP credentials required.

## Acceptance Criteria

### §1 Threshold Fix

**AC-086-THRESHOLD**
- Given `compute_outcome()` in `scripts/daily_predict.py`,
- When a 72H window has ≥ 65 bars (was 72),
- Then the window is accepted and outcome is computed.
  (Rationale: 69/72 = 96% coverage is sufficient; missing bars are all 00:00 low-volatility.)

**AC-086-MAE-RMSE-SAFE**
- Given a window with fewer than 72 bars,
- When MAE/RMSE are computed,
- Then `n = len(actual_closes)` is used (not hardcoded 72), preventing IndexError.

### §2 Collect Mode in `_process_day()`

**AC-086-PAIRS-OUT**
- Given `_process_day(..., pairs_out=some_list)`,
- When prediction + actual are computed successfully,
- Then `{"prediction": ..., "actual": ...}` is appended to `pairs_out`.
- And no Firestore write is attempted.

**AC-086-FIRESTORE-DEFAULT**
- Given `_process_day(..., pairs_out=None)` (default),
- When prediction + actual are computed,
- Then existing Firestore write behavior is preserved unchanged.

### §3 `backtest_optimize.py` Pipeline

**AC-086-SCRIPT-EXISTS**
- `python -m py_compile scripts/backtest_optimize.py` → exit 0.

**AC-086-COLLECT**
- Given `--days N` (default 365),
- When script runs,
- Then it walks `[today-N, today-4]`, collects completed pairs, and prints `Collected N pairs from M days`.

**AC-086-OPTIMIZE**
- Given collected pairs,
- When Bayesian optimization runs with `--n-calls K` (default 50, minimum 10),
- Then `gp_minimize` over `(window ∈ [14,60], pearson ∈ [0.2,0.7], top_k ∈ [5,30])` completes and prints best params + score.

**AC-086-PARALLEL**
- Given `--workers W` (0 = all CPUs),
- When corpus evaluation runs,
- Then `multiprocessing.Pool` distributes pairs across W workers; pre-computed query bar dicts eliminate O(N) timestamp scan per worker call.

**AC-086-NO-FIRESTORE**
- Given no GCP credentials on the machine,
- When the script runs,
- Then it completes without error (Firestore write is not attempted; `load_active_params()` falls back to defaults).

### §4 Regression Gate

**AC-086-REGRESSION**
- `pytest backend/tests/ -x` passes without modification.

## Out of Scope

- Writing optimized params to Firestore (requires `gcloud auth application-default login`).
- Modifying the weekly Cloud Run optimizer workflow.
- Frontend changes.
