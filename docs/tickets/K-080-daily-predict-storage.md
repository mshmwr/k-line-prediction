---
id: K-080
title: Daily predict + storage workflow
status: open
created: 2026-05-02
type: feat
priority: high
size: medium
owner: engineer
dependencies: [K-078]
epic: backtest-self-tuning
epic-tickets: [K-078, K-080, K-081, K-082]
spec: ~/.claude/plans/pm-app-jaunty-wren.md
base-commit: dac3457
visual-delta: none
content-delta: none
qa-early-consultation: "complete — 8 challenges raised, 6 supplemented to AC, 2 declared Known Gap — see ## QA Early Consultation"
---

# K-080 — Daily predict + storage workflow

## Summary

GitHub Actions cron workflow + Python entry script that runs daily at 04:00 UTC. Reads the latest committed CSV, loads active Firestore params, calls the predictor, writes `predictions/{ts}` docs, backfills `actuals/{ts}` for predictions older than 72h, and recomputes `backtest_summaries/{today}` over the last 30 days. Also exports 3 new frozenset schema-contract constants from `backend/firestore_config.py` for downstream K-081 / K-082 consumption.

## Scope

**New files:**
- `scripts/daily_predict.py` — entry script (~200 lines)
- `.github/workflows/daily-predict.yml` — cron 04:00 UTC, secret `GCP_SA_KEY`
- `backend/tests/test_daily_predict.py` — unit tests for storage helpers + outcome computation

**Modified files:**
- `backend/firestore_config.py` — add prediction/actual/summary writer helpers; export 3 new frozenset schema-contract constants

**Read-only (must not change):**
- `backend/predictor.py` — K-080 is a caller, not a modifier

**Docs updates:**
- `ssot/system-overview.md` — add daily flow box to architecture
- `ssot/deploy.md` — add `workflow_dispatch` verification step for daily-predict.yml

**Out of scope:**
- Weekly optimizer (`weekly-optimize.yml`) — K-081
- Frontend `/backtest` route — K-081
- Any change to `backend/predictor.py` logic

## Acceptance Criteria

### AC-080-DAILY-WORKFLOW-CRON
- Given: `.github/workflows/daily-predict.yml` exists on branch `K-080-daily-predict`
- When: the file is read
- Then: it declares `cron: "0 4 * * *"` trigger
- And: it runs `python scripts/daily_predict.py` as its primary step
- And: it uses GitHub secret `GCP_SA_KEY` for Firestore authentication
- And: `scripts/daily_predict.py` contains a CSV freshness gate that checks whether the latest committed CSV is no older than 90 minutes before the script runs; if stale (older than 90 min), the script logs a warning and exits 0 (graceful skip — cron drift expected, not an error)

### AC-080-PARAM-LOADING
- Given: `scripts/daily_predict.py` is executed in an environment where Firestore is reachable
- When: the script starts up
- Then: it calls `load_active_params()` from `backend.firestore_config`
- And: it sets `predictor.params = <ParamSnapshot returned by load_active_params()>` (module-level assignment)
- And: it logs the active `params_hash` (12-char prefix) to stdout before calling any predictor function

### AC-080-PREDICTION-WRITE
- Given: param loading completes and yesterday's 23:00 UTC 1H bar is available in the CSV
- When: `find_top_matches()` and `compute_stats()` return results
- Then: a Firestore document is written to `predictions/{YYYY-MM-DD-HH}` (where the timestamp is yesterday's 23:00 UTC bar's datetime in `YYYY-MM-DD-23` format)
- And: the document's field set is an exact match of `FIRESTORE_PREDICTION_FIELDS` frozenset exported from `backend/firestore_config.py`
- And: the document includes a `params_hash` field equal to the `params_hash` from the active `ParamSnapshot`
- And: the document includes `projected_high`, `projected_low`, `projected_median` (floats), `top_k_count` (int), `trend` (str: "up" | "down" | "flat"), `query_ts` (ISO8601 str), `created_at` (ISO8601 str)

### AC-080-ACTUAL-BACKFILL
- Given: one or more `predictions/{ts}` documents exist in Firestore where `query_ts` is more than 72 hours before the script's current execution time
- When: the backfill loop runs
- Then: for each such prediction, an `actuals/{ts}` document is written (or overwritten) containing:
  - `high_hit` (bool): True if the CSV shows any 1H bar's `high` ≥ `projected_high` within the 72-bar window following `query_ts`
  - `low_hit` (bool): True if the CSV shows any 1H bar's `low` ≤ `projected_low` within the 72-bar window following `query_ts`
  - `mae` (float): mean absolute error across the 72 projected median values vs CSV close values
  - `rmse` (float): root mean squared error across the same 72 values
  - `actual_high` (float): maximum `high` in the 72-bar window
  - `actual_low` (float): minimum `low` in the 72-bar window
  - `computed_at` (ISO8601 str)
- And: the document's field set is an exact match of `FIRESTORE_ACTUAL_FIELDS` frozenset
- And: if the 72-bar window is not fully available in the CSV (fewer than 72 bars between `query_ts` and now), the prediction is skipped for backfill (not counted as an error)

### AC-080-BACKTEST-SUMMARY
- Given: at least 1 completed (prediction + actual) pair exists in the last 30 calendar days
- When: `backtest_summaries/{today}` is written
- Then: the document contains:
  - `hit_rate_high` (float 0–1): fraction of predictions where `high_hit == True`
  - `hit_rate_low` (float 0–1): fraction of predictions where `low_hit == True`
  - `avg_mae` (float): average MAE across the window
  - `avg_rmse` (float): average RMSE across the window
  - `sample_size` (int): number of completed pairs in the 30-day window
  - `per_trend` (map): keys "up", "down", "flat"; each value is `{hit_rate_high, hit_rate_low, avg_mae, sample_size}`
  - `window_days` (int): 30
  - `computed_at` (ISO8601 str)
- And: the document's field set is an exact match of `FIRESTORE_BACKTEST_SUMMARY_FIELDS` frozenset
- And: if zero completed pairs exist in the window, the script logs "no completed pairs for summary window" and skips writing the summary doc (does not write empty/null doc)

### AC-080-IDEMPOTENT
- Given: `predictions/{ts}` document already exists for today's `query_ts` with identical `params_hash`
- When: the script is run a second time for the same date
- Then: the script overwrites the existing document with the same data (set / set_with_merge semantics)
- And: the Firestore document count for `predictions` does NOT increase (same doc key, overwrite)
- And: no exception is raised

### AC-080-FIRESTORE-FAILURE
- Given: Firestore is unavailable (network timeout or service error) when the script tries to write
- When: the first write attempt fails
- Then: the script retries exactly once after a 5-second wait
- And: if the retry also fails, the script logs the error and exits with non-zero exit code
- And: the CSV file on disk is never modified by the script under any failure scenario
- And: if Firestore is unavailable for reading `predictor_params/active`, the script falls back to `DEFAULT_PARAMS` (delegated to `load_active_params()` which already handles this) and continues execution

### AC-080-NO-PREDICTOR-MUTATION
- Given: the K-080 branch changes are applied
- When: `git diff origin/main backend/predictor.py` is run
- Then: the output is empty (zero lines changed)

### AC-080-SACRED-FLOOR-INTACT
- Given: the test fixture CSV (`backend/tests/fixtures/` or `frontend/public/examples/ETHUSDT_1h_test.csv`) is present in the test environment
- When: `pytest backend/tests/test_predict_real_csv_integration.py -v` is run
- Then: all tests pass (including `test_truncated_db_raises_sacred_value_error` and any Layer 1 / Layer 2 invariant tests added by K-078)
- And: `SACRED_FLOOR = 129` assertion is not weakened or bypassed

### AC-080-SCHEMA-CONTRACT-EXPORTED
- Given: K-080 changes are applied to `backend/firestore_config.py`
- When: `from backend.firestore_config import FIRESTORE_PREDICTION_FIELDS, FIRESTORE_ACTUAL_FIELDS, FIRESTORE_BACKTEST_SUMMARY_FIELDS` is executed
- Then: all three imports succeed without error
- And: `FIRESTORE_PREDICTION_FIELDS` contains at minimum: `{"params_hash", "projected_high", "projected_low", "projected_median", "top_k_count", "trend", "query_ts", "created_at"}`
- And: `FIRESTORE_ACTUAL_FIELDS` contains at minimum: `{"high_hit", "low_hit", "mae", "rmse", "actual_high", "actual_low", "computed_at"}`
- And: `FIRESTORE_BACKTEST_SUMMARY_FIELDS` contains at minimum: `{"hit_rate_high", "hit_rate_low", "avg_mae", "avg_rmse", "sample_size", "per_trend", "window_days", "computed_at"}`
- And: each frozenset is listed in `__all__` of `backend/firestore_config.py`
- And: a `## Exported contract` section in `docs/designs/K-080-design.md` enumerates all three frozensets with their field lists

### AC-080-TESTS
- Given: K-080 implementation is complete
- When: `pytest backend/tests/test_daily_predict.py -v` is run
- Then: all tests pass
- And: the test count reported by pytest for this file is ≥ 6, covering at minimum one test each for:
  1. prediction document write (correct field set + params_hash present)
  2. actual backfill computation (high_hit / low_hit / MAE / RMSE correctness)
  3. backtest summary aggregation (per-trend breakdown, sample_size count)
  4. idempotency (second run on same date does not raise, overwrite produces identical doc)
  5. Firestore transient failure → retry once → succeed (mock first call raises, second call succeeds)
  6. Firestore permanent failure (both attempts fail) → exits non-zero, CSV not modified
- And: all tests use a mock / fake Firestore client (no live Firestore calls in unit tests)
- And: tests import fixture data from the existing CSV fixture rather than constructing synthetic OHLC from scratch

### AC-080-DOCS-UPDATE
- Given: K-080 changes are applied
- When: `ssot/system-overview.md` is read
- Then: it contains a description or diagram box showing the `daily-predict.yml` workflow in the operational architecture (04:00 UTC, reads CSV, writes Firestore)
- And: `ssot/deploy.md` contains a step for verifying `daily-predict.yml` via `workflow_dispatch` after initial deploy

## Blocking Questions

_(none at ticket open — all QA challenges resolved)_

## QA Early Consultation

**Mode:** PM proxy (disclosed)
**Date:** 2026-05-02
**Ticket:** K-080

### Challenges raised and rulings

**QA Challenge #1 — AC-080-DAILY-WORKFLOW-CRON: `workflow_run` vs cron ambiguity**
Issue: Two trigger options with different failure modes and testability; AC must specify one.
Ruling: cron 04:00 UTC + script-internal CSV freshness gate (90-minute threshold). `workflow_run` dependency on external workflow state excluded as too hard to test reliably. Known Gap: freshness threshold is a design constant that may be tuned post-deploy.

**QA Challenge #2 — AC-080-PARAM-LOADING: module-level variable name**
Issue: AC referenced `predictor.params = …`; needed confirmation that `predictor.py` has a module-level `params: ParamSnapshot` variable.
Ruling: Confirmed via `grep -n "^params"` — line 17 of `predictor.py` declares `params: ParamSnapshot = DEFAULT_PARAMS`. AC is correct as written.

**QA Challenge #3 — AC-080-ACTUAL-BACKFILL: 72h definition and partial CSV**
Issue: What happens when the 72-bar window is not fully available in the CSV near the current time?
Ruling: If fewer than 72 bars exist between `query_ts` and now, prediction is skipped for this backfill run. Not an error — logged as "window not complete yet". Codified into AC-080-ACTUAL-BACKFILL "And" clause.

**QA Challenge #4 — AC-080-IDEMPOTENT: overwrite vs skip**
Issue: "either skips or overwrites" — two different semantics, each requires different test.
Ruling: overwrite (set / set_with_merge semantics). Simpler to test, allows CSV-correction replay, idempotent under same params_hash. AC updated to specify overwrite explicitly.

**QA Challenge #5 — AC-080-FIRESTORE-FAILURE: "retry once" testability**
Issue: Retry logic needs explicit test coverage in `test_daily_predict.py`.
Ruling: Added to AC-080-TESTS mandatory coverage list (item 5: transient failure → retry once → succeed; item 6: permanent failure → exit non-zero). AC-080-FIRESTORE-FAILURE also clarifies retry semantics (once, 5s wait).

**QA Challenge #6 — AC-080-TESTS: test distribution not specific enough**
Issue: "≥6 tests" without distribution spec allows trivial padding.
Ruling: AC-080-TESTS now enumerates 6 mandatory test scenarios with explicit coverage targets.

**QA Challenge #7 — AC-080-SCHEMA-CONTRACT-EXPORTED: frozenset fields not defined**
Issue: 3 empty frozensets would satisfy original AC.
Ruling: AC-080-SCHEMA-CONTRACT-EXPORTED now lists required minimum field sets per frozenset.

**QA Challenge #8 — AC-080-SACRED-FLOOR-INTACT: fixture dependency in CI**
Issue: Integration test requires CSV fixture; hydration drift in new GHA job could cause false failure.
Ruling: AC clarifies "Given: fixture CSV present in test environment". Known Gap: if daily-predict.yml CI job runs `pytest` without the fixture, this test would fail with hydration drift (not regression). Resolution: fixture must be committed (it currently is, confirmed by `backend/tests/test_predict_real_csv_integration.py` imports).

### QA Consultation summary
8 challenges raised — 6 supplemented to AC, 2 declared Known Gap:
- Known Gap 1: CSV freshness threshold (90 min) is a design constant subject to post-deploy tuning.
- Known Gap 2: GHA CI hydration — `test_predict_real_csv_integration.py` requires committed fixture CSV; any future GHA job that omits fixture checkout would produce a false hydration failure, not a regression.

## Release Status

_(to be filled at close)_

## Retrospective

_(to be filled at close)_
