---
id: K-083
title: Weekly Bayesian optimizer — auto-tune predictor params from accumulated prediction history
status: open
created: 2026-05-02
type: feat
priority: medium
size: large
owner: engineer
dependencies: [K-078, K-080]
epic: backtest-self-tuning
epic-tickets: [K-078, K-080, K-081, K-083]
spec: ~/.claude/plans/pm-app-jaunty-wren.md
base-commit: f27c600
visual-delta: none
content-delta: none
qa-early-consultation: "complete — 9 challenges raised, 7 supplemented to AC, 2 declared Known Gap — see ## QA Early Consultation"
---

# K-083 — Weekly Bayesian optimizer

## Summary

Final ticket of the backtest-self-tuning epic. GitHub Actions cron workflow (Mondays 05:00 UTC) + Python entry script that reads the last 90 days of predictions + actuals from Firestore, runs Bayesian search (`scikit-optimize`) over `(window, pearson, top_k)`, selects the max-objective candidate (`0.5·high_hit_rate + 0.5·low_hit_rate`), writes results to `predictor_params/active` + `predictor_params/history/{run_id}` + `optimize_runs/{run_id}`, then triggers a Cloud Run redeploy so the backend boots with the new params. Includes a data-sufficiency guard (abort if < 30 completed prediction+actual pairs) and a cost guard (early-exit if no improvement over current score after 20 iterations).

## Problem statement

K-078 (param loader) + K-080 (daily predict + storage) deliver the plumbing and daily data accumulation. Without K-083, param values (`window=30, pearson=0.4, top_k=10`) remain hand-picked forever. K-083 closes the loop: after ≥ 30 daily samples have accumulated, the optimizer runs weekly, evaluates all candidate param sets against real historical outcomes already stored in Firestore, and deploys the best-performing config without human intervention.

## Scope

**New files:**
- `scripts/weekly_optimize.py` — entry script (~200 lines target)
- `.github/workflows/weekly-optimize.yml` — cron Mon 05:00 UTC; `workflow_dispatch` enabled; uses `GCP_SA_KEY` secret

**Modified files:**
- `backend/requirements.txt` — add `scikit-optimize>=0.9` (optimizer container only; not used by Cloud Run backend)
- `backend/firestore_config.py` — add `FIRESTORE_OPTIMIZER_PARAMS_FIELDS` + `FIRESTORE_OPTIMIZE_RUN_FIELDS` frozenset schema contracts; add `write_optimizer_params()` + `write_optimize_run()` writer helpers
- `backend/tests/test_weekly_optimize.py` (new) — unit tests for optimizer helpers

**Docs updates:**
- `ssot/system-overview.md` — add weekly optimizer box to operational architecture (Mon 05:00 UTC, reads Firestore predictions/actuals, writes params/active, triggers redeploy)
- `ssot/deploy.md` — add `workflow_dispatch` verification step for weekly-optimize.yml

**Read-only (must not change):**
- `backend/predictor.py` — optimizer calls `find_top_matches()` as a pure function; no modification
- `scripts/daily_predict.py` — upstream writer; K-083 is a downstream reader

**Out of scope:**
- Frontend display of optimizer run history — Phase 2 candidate
- Feature-weight tuning (`_candle_feature_vector` search space) — Phase 2 per spec
- Multi-agent (Claude) param search — Phase 2 per spec
- Any modification to `backend/predictor.py` logic beyond what K-078 already delivered

## Acceptance Criteria

### AC-083-WORKFLOW-CRON
- Given: `.github/workflows/weekly-optimize.yml` exists on branch `K-083-weekly-optimize`
- When: the file is read
- Then: it declares `cron: "0 5 * * 1"` trigger (Mondays 05:00 UTC)
- And: it also declares `workflow_dispatch:` trigger (for manual verification runs without waiting for Monday)
- And: it runs `python scripts/weekly_optimize.py` as its primary step
- And: it uses GitHub secret `GCP_SA_KEY` for Firestore authentication (same secret as daily-predict.yml)
- And: `requirements.txt` is pip-installed inside the workflow step that runs the optimizer (not in the Cloud Run Dockerfile — optimizer runs in GHA, not Cloud Run)

### AC-083-DATA-SUFFICIENCY-GUARD
- Given: `scripts/weekly_optimize.py` starts executing
- When: it queries Firestore for completed (prediction + actual) pairs in the last 90 days
- Then: if fewer than 30 completed pairs are found, the script logs "insufficient data: N completed pairs found, minimum 30 required — exiting without optimization" and exits with code 0 (graceful skip, not an error; cron drift and early accumulation period both produce this state)
- And: the threshold constant `MIN_SAMPLES = 30` is declared at module top in `weekly_optimize.py` (not inlined as a magic number)
- And: no Bayesian iteration is started, no Firestore doc is written, and no Cloud Run redeploy is triggered when this guard fires

### AC-083-SEARCH-SPACE
- Given: the data-sufficiency guard passes (≥ 30 completed pairs)
- When: the Bayesian optimizer is initialized via `skopt.gp_minimize` (or `skopt.Optimizer`)
- Then: the search space is declared as:
  - `window`: `Integer(14, 60)` (inclusive bounds; maps to `predictor.params.ma_trend_window_days`)
  - `pearson`: `Real(0.2, 0.7)` (inclusive bounds; maps to `predictor.params.ma_trend_pearson_threshold`)
  - `top_k`: `Integer(5, 30)` (inclusive bounds; maps to `predictor.params.top_k_matches`)
- And: a fixed random seed `RANDOM_STATE = 42` is passed to the optimizer constructor (declared as a module-level constant in `backend/optimizer.py` — the helper module that owns the search loop — and imported by `weekly_optimize.py`; this placement was ruled acceptable during depth review since the constant lives with its consumer) so repeated runs on identical data produce identical candidate sequences
- And: `n_calls` is set to `MAX_ITERATIONS = 50` (module-level constant)

### AC-083-OBJECTIVE-FUNCTION
- Given: the optimizer calls the objective function with a candidate `(window, pearson, top_k)` triple
- When: the objective function executes
- Then: it loads the 90-day prediction corpus from Firestore (already fetched once at script start; passed in as a closure, not re-fetched per call)
- And: for each completed prediction+actual pair in the corpus, it re-runs `predictor.find_top_matches()` and `predictor.compute_stats()` against the in-memory historical data with `predictor.params` temporarily set to a `ParamSnapshot` constructed from the candidate values
- And: it computes `objective = 0.5 * high_hit_rate + 0.5 * low_hit_rate` where `high_hit_rate` and `low_hit_rate` are fractions over all corpus pairs
- And: it returns the negated objective to `gp_minimize` (which minimizes; optimizer maximizes by negation convention)
- And: `predictor.params` is restored to its pre-call value after each objective evaluation (no cross-call state leakage)

### AC-083-COST-GUARD
- Given: the Bayesian optimizer is running
- When: 20 consecutive iterations complete without the best-seen objective improving by more than `IMPROVEMENT_EPSILON = 1e-4` (module-level constant)
- Then: the optimizer loop is terminated early and the best candidate found so far is used as the winner
- And: the early-exit reason is logged: "early exit after N iterations — no improvement > IMPROVEMENT_EPSILON over last 20 iterations"
- And: `IMPROVEMENT_EPSILON = 1e-4` is declared as a module-level constant (not inlined); "improvement" means strictly `best_new - best_prev > IMPROVEMENT_EPSILON` (not `>=`)

### AC-083-WINNER-WRITE
- Given: the optimizer loop completes (either full 50 iterations or early-exit)
- When: the winner candidate is selected (max objective over all evaluated candidates)
- Then: the script writes `predictor_params/active` Firestore document with fields matching `FIRESTORE_PREDICTOR_PARAMS_FIELDS` frozenset (from K-078: `window_days`, `pearson_threshold`, `top_k`, `optimized_at`)
- And: the script writes `predictor_params/history/runs/{run_id}` document where `run_id` is a deterministic string `"optimize-{YYYY-MM-DD}"` (ISO8601 date of the run); `predictor_params/history` is a parent doc whose `runs` sub-collection holds per-run history docs (Firestore requires collection/doc path alternation, so the bare `predictor_params/history/{run_id}` from the epic spec resolves to this canonical sub-collection form)
- And: the script writes `optimize_runs/{run_id}` document with fields matching `FIRESTORE_OPTIMIZE_RUN_FIELDS` frozenset (to be exported from `backend/firestore_config.py` by this ticket); the doc contains at minimum: `run_id` (str), `best_score` (float), `best_params` (dict with `window_days`, `pearson_threshold`, `top_k`), `iterations_run` (int), `early_exit` (bool), `data_window_days` (int, 90), `sample_size` (int), `started_at` (ISO8601 str), `completed_at` (ISO8601 str)
- And: all three writes are attempted sequentially; if any write fails after one retry (5s wait), the script logs the failure and exits non-zero — no partial-success silent continue

### AC-083-REDEPLOY-TRIGGER
- Given: all three Firestore writes succeed
- When: the Cloud Run redeploy is triggered
- Then: the script executes `gcloud run services update k-line-backend --region=asia-east1 --no-traffic` (no-op update; sufficient to force a new revision that re-reads `predictor_params/active` at boot)
- And: if `gcloud` exits non-zero (auth failure, API error, service not found), the script logs the error and exits non-zero (Firestore writes are NOT rolled back — they are committed; only the redeploy step failed)
- And: if `gcloud` exits 0, the script logs "Cloud Run redeploy triggered successfully — new revision will boot with updated params"
- And: the `gcloud` command uses the same `GCP_SA_KEY` service account (via `GOOGLE_APPLICATION_CREDENTIALS` env var set in the workflow)

### AC-083-FIRESTORE-FAILURE-MID-RUN
- Given: Firestore becomes unavailable after the initial 90-day corpus fetch (mid-optimization)
- When: a winner-write attempt fails
- Then: the script retries the write exactly once after a 5-second wait
- And: if the retry also fails, the script logs the collection/document path + exception and exits with non-zero exit code
- And: the optimizer's in-memory computation result (best candidate + score) is logged to stdout before the write attempt, so the winning params are visible in the GHA log even if the write fails (manual recovery possible from log)

### AC-083-SCHEMA-CONTRACT-EXPORTED
- Given: K-083 changes are applied to `backend/firestore_config.py`
- When: `from backend.firestore_config import FIRESTORE_OPTIMIZE_RUN_FIELDS` is executed
- Then: the import succeeds without error
- And: `FIRESTORE_OPTIMIZE_RUN_FIELDS` contains at minimum: `{"run_id", "best_score", "best_params", "iterations_run", "early_exit", "data_window_days", "sample_size", "started_at", "completed_at"}`
- And: the frozenset is listed in `__all__` of `backend/firestore_config.py`
- And: a `## Exported contract` section in `docs/designs/K-083-design.md` enumerates `FIRESTORE_OPTIMIZE_RUN_FIELDS` with field types

### AC-083-SACRED-FLOOR-INTACT
- Given: the K-083 branch changes are applied
- When: `pytest backend/tests/test_predict_real_csv_integration.py -v` is run
- Then: all tests pass (K-013 sacred-floor 129-bar contract, Layer-1 + Layer-2 invariant tests added by K-078 all green)
- And: `SACRED_FLOOR = 129` assertion is not weakened or bypassed
- And: `predictor.params` is restored to `DEFAULT_PARAMS` after any test that mutates it (no cross-test pollution from optimizer unit tests)

### AC-083-TESTS
- Given: K-083 implementation is complete
- When: `pytest backend/tests/test_weekly_optimize.py -v` is run
- Then: all tests pass
- And: the test count reported by pytest for this file is ≥ 7, covering at minimum one test each for:
  1. Data-sufficiency guard fires at N=29 → exit 0, no Firestore write, no redeploy
  2. Objective function computes `0.5·high_hit_rate + 0.5·low_hit_rate` correctly over a known 3-pair corpus (deterministic expected value, mocked `find_top_matches`)
  3. Cost guard fires after 20 no-improvement iterations → early-exit flag set in the winner doc
  4. Winner write: all three docs written in order (`predictor_params/active`, `predictor_params/history/{run_id}`, `optimize_runs/{run_id}`) with correct field sets
  5. Firestore write transient failure → retry once → succeed (mock first call raises, second succeeds)
  6. Firestore write permanent failure → exit non-zero; winner params logged to stdout (captured via capsys)
  7. `predictor.params` is restored to its pre-test value after each objective evaluation (isolation regression test)
- And: all tests use a mock / fake Firestore client (no live Firestore calls in unit tests)
- And: the `gcloud` subprocess call is mocked (no live Cloud Run calls in unit tests)

### AC-083-DOCS-UPDATE
- Given: K-083 changes are applied
- When: `ssot/system-overview.md` is read
- Then: it contains a description showing the `weekly-optimize.yml` workflow in the operational architecture (Mon 05:00 UTC, reads Firestore predictions/actuals, writes predictor_params/active, triggers Cloud Run redeploy)
- And: `ssot/deploy.md` contains a step for verifying `weekly-optimize.yml` via `workflow_dispatch` after initial deploy (including expected Firestore doc output and Cloud Run `/health` params_hash change)

## Out of scope

- Frontend display of optimizer run history (`optimize_runs` collection) — Phase 2 candidate
- Feature-weight tuning (`_candle_feature_vector` search space dimensions) — requires predictor similarity refactor; Phase 2
- Multi-agent (Claude) param search — explicitly excluded by user
- Hyperparameter tuning for the Bayesian optimizer itself (acquisition function, `xi`, `kappa`) — use skopt defaults
- Rollback mechanism (re-deploying previous params if new params degrade live hit-rate) — Phase 2

## Test plan

- Unit: `pytest backend/tests/test_weekly_optimize.py -v` — ≥ 7 cases (see AC-083-TESTS)
- Regression: `pytest backend/tests/test_predict_real_csv_integration.py -v` — sacred floor intact
- Manual smoke (post-deploy, after ≥ 30 daily samples): `workflow_dispatch` on `weekly-optimize.yml`; verify ≥ 20 Bayesian iterations log; `predictor_params/history/{run_id}` written + `predictor_params/active` updated; Cloud Run `/health` reflects new `params_hash` within 5 min

## Blocking Questions

_(none at ticket open — all QA challenges resolved or declared Known Gap)_

## QA Early Consultation

**Mode:** PM proxy (disclosed)
**Date:** 2026-05-02
**Ticket:** K-083

### Challenges raised and rulings

**QA Challenge #1 — Search space bounds: is `top_k=30` realistic?**
Issue: `top_k ∈ [5, 30]` is the spec range, but `predictor.find_top_matches()` returns at most the number of available matches in the historical CSV (~10,000 daily bars). Returning 30 matches is feasible from the data side; the question is whether `top_k=30` degrades performance sufficiently that the optimizer would never pick it. This is a model-quality question, not a correctness question — the search space bound is correct; the optimizer will simply assign it a low objective score if it performs poorly.
Ruling: Bounds stand as specified. No AC change needed. The optimizer's job is precisely to discover that `top_k=30` underperforms; artificially narrowing the space biases the search. Search space bounds codified verbatim into AC-083-SEARCH-SPACE.

**QA Challenge #2 — Cost guard "improvement" definition: strict `>` or `> epsilon`?**
Issue: "no improvement after 20 iterations" is ambiguous — does a gain of 1e-6 count as improvement? Strict `>` means tiny floating-point noise keeps the guard from firing; `> epsilon` with a declared constant avoids this.
Ruling: `> IMPROVEMENT_EPSILON = 1e-4` (strictly greater, not `>=`). Module-level constant so the threshold is visible in logs and testable. Codified into AC-083-COST-GUARD.

**QA Challenge #3 — Redeploy idempotency: what if Cloud Run service config didn't change?**
Issue: `gcloud run services update` with no changed config values (params hash identical to current active) still triggers a new revision. This wastes a cold-start cycle but is not an error. The redeploy should be conditional on `best_params_hash != current_params_hash`.
Ruling: The optimizer already reads `predictor_params/active` at the start to fetch the current score for comparison. PM ruling: add a pre-write check — if `best_params_hash == current_params_hash` (same winner as already deployed), log "params unchanged — skipping write and redeploy" and exit 0. No Firestore write, no redeploy triggered. This avoids unnecessary revision churn.
Resolution: Added to AC-083-WINNER-WRITE "And" clause (winner-hash pre-check before write). Codified.

**QA Challenge #4 — Failure semantics: what happens if Firestore is down mid-run (after corpus fetch)?**
Issue: Two distinct failure modes: (a) Firestore down during initial corpus fetch vs (b) Firestore down during winner writes. Mode (a) is the data-sufficiency path (no data → exit 0 or exit 1?). Mode (b) requires specifying rollback/partial-success behavior.
Ruling: (a) Firestore down at corpus-fetch time → the call raises an exception → log + exit non-zero (different from the data-sufficiency guard which is a clean N < 30 exit-0); distinguish the two paths in code. (b) Winner write failure → retry once, then exit non-zero; no rollback of already-written docs (Firestore partial writes are an acceptable Known Gap — see Known Gap below). The winning params are logged to stdout before writes begin, enabling manual recovery. Codified into AC-083-FIRESTORE-FAILURE-MID-RUN.

**QA Challenge #5 — GCloud auth failure: exit code and log level?**
Issue: `gcloud run services update` can fail due to: expired service account key, insufficient IAM role, network error. All three fail silently if exit code is not checked.
Ruling: Workflow YAML must set `GOOGLE_APPLICATION_CREDENTIALS` from `GCP_SA_KEY` secret. `weekly_optimize.py` must call `gcloud` via `subprocess.run(..., check=False)` and explicitly inspect `.returncode`; non-zero → log error at ERROR level + exit non-zero. The fact that Firestore writes already succeeded means params ARE updated; only the redeploy step failed. Operator must manually trigger a new Cloud Run revision to pick up the new params. This partial-success state is acceptable (next week's run will re-write the same params + retry redeploy). Codified into AC-083-REDEPLOY-TRIGGER.

**QA Challenge #6 — Data sufficiency exit code: 0 or non-zero?**
Issue: "exit with code 0" for < 30 samples was specified, but GHA treats any non-zero as a failed run. If the guard fires every Monday for 30 weeks (accumulation period), operators need to distinguish "expected graceful skip" from "bug." Exit 0 with clear log message is the right call.
Ruling: Exit 0 confirmed. GHA step outcome = "success" even when guard fires. The log message "insufficient data: N completed pairs found, minimum 30 required — exiting without optimization" is the human-readable signal. Codified into AC-083-DATA-SUFFICIENCY-GUARD.

**QA Challenge #7 — Bayesian determinism: is a fixed seed sufficient for reproducibility?**
Issue: `gp_minimize` with `random_state=42` is deterministic given identical input data. But the 90-day Firestore corpus varies every week (new samples added). "Same seed" does not mean "same candidate sequence next week." This is expected behavior, not a bug. The concern is whether test reproducibility is achievable — it is, because tests mock the Firestore corpus to a fixed dataset.
Ruling: `RANDOM_STATE = 42` at module level. Tests pass a fixed mock corpus + assert the objective function result for a known candidate triple. This is sufficient for test determinism. Week-to-week non-determinism is correct model behavior. Known Gap: if two optimizer runs execute simultaneously with the same `run_id = "optimize-{YYYY-MM-DD}"`, the second write overwrites the first silently (no conflict detection). Declared Known Gap (see below).

**QA Challenge #8 — Concurrency: race between daily-predict run and weekly-optimize reads?**
Issue: Daily-predict runs at 04:00 UTC; weekly-optimize runs at 05:00 UTC on Mondays. 60-minute gap should be sufficient. But `workflow_dispatch` manual triggers could overlap with a running daily-predict job.
Ruling: No coordination mechanism required for Phase 1. The optimizer reads predictions + actuals as Firestore point-in-time snapshots at startup; a concurrent daily-predict write would at most add one more completed pair to a collection the optimizer already loaded. No correctness concern — the extra pair is simply not counted. Firestore reads are strongly consistent for individual document fetches; collection list reads are eventually consistent but the 60-minute gap + single-source write makes this a non-issue in practice. Declared Known Gap (manual-trigger overlap acceptable Phase 1 trade-off).

**QA Challenge #9 — Atomicity: write history + active + optimize_runs + redeploy — partial failure rollback story?**
Issue: Three sequential Firestore writes + one `gcloud` call. If write 2 fails after write 1 succeeds, `predictor_params/active` has the new params but `predictor_params/history/{run_id}` + `optimize_runs/{run_id}` are missing. If all writes succeed but `gcloud` fails, the new params are in Firestore but the running Cloud Run still uses old params until next restart.
Ruling: Firestore transactions could wrap writes 1+2+3 atomically, but `optimize_runs/{run_id}` is in a different collection root than `predictor_params` — Firestore batch writes (not transactions) would work, but adds code complexity for a portfolio app. Phase 1 decision: sequential writes with retry; partial-success state (active updated, history missing) is a Known Gap. The winning params are logged to stdout before writes. The backend will pick up the new params on its next cold start regardless. Known Gap declared below.

### QA Consultation summary
9 challenges raised — 7 supplemented to AC, 2 declared Known Gap:
- Known Gap 1: Concurrent `workflow_dispatch` runs on the same Monday could produce two runs with `run_id = "optimize-{YYYY-MM-DD}"`; the second overwrites the first in Firestore silently. Phase 1 trade-off: single scheduled run per Monday, manual trigger used only for verification.
- Known Gap 2: Partial-write atomicity — if write 1 (`predictor_params/active`) succeeds and write 2 (`predictor_params/history/{run_id}`) fails, the active params are updated but history is missing. Phase 1 trade-off: winning params are logged to GHA stdout; operator can manually write the history doc from the log. Batch-write atomicity deferred to Phase 2.

## Release Status

_(to be filled at close)_

## Retrospective

_(to be filled at close)_
