---
title: K-083 Design — Weekly Bayesian Optimizer + Cloud Run Redeploy + Frozenset Contracts
ticket: K-083
status: draft
visual-spec: N/A — reason: backend-only workflow; no UI component changes
created: 2026-05-02
updated: 2026-05-02
---

# K-083 Design — Weekly Bayesian Optimizer

## §0 Scope Questions (SQ Block)

No blocking questions remain. All QA challenges resolved or declared Known Gap in ticket. Three inline rulings recorded here for reference:

**SQ-1 — `requirements.txt` split vs shared:** Ticket AC-083-WORKFLOW-CRON specifies `requirements.txt` is pip-installed inside the GHA workflow step, NOT in the Cloud Run Dockerfile. This means `scikit-optimize` must be added to `backend/requirements.txt` (same file used by the GHA install step), but the Cloud Run Dockerfile either installs everything or uses a filter. The Dockerfile currently installs `backend/requirements.txt`. **Ruling (inline):** Add `scikit-optimize>=0.9` to `backend/requirements.txt` with a comment marking it optimizer-only. If Cloud Run image size becomes a concern, that is a Phase 2 split (separate `requirements-optimize.txt`). No AC mandates a split; this is the minimal-change path.

**SQ-2 — `backend/optimizer.py` role boundary:** The ticket scope lists `backend/optimizer.py` as a helper module. Its single responsibility is: pure functions used by `scripts/weekly_optimize.py` that have no Firestore I/O and no GHA subprocess concerns. Entry-point orchestration stays in `scripts/weekly_optimize.py`. This mirrors the `daily_predict.py` / `firestore_config.py` split from K-080.

**SQ-3 — `predictor.params` mutation in optimizer tests:** AC-083-SACRED-FLOOR-INTACT requires that `predictor.params` is restored to `DEFAULT_PARAMS` after any test that mutates it. Tests in `test_weekly_optimize.py` that call the objective function must use a fixture that patches `predictor.params` via `unittest.mock.patch` (or a context manager from `optimizer.py`) — not direct assignment — so teardown is guaranteed even on test failure.

---

## §1 Goal and Non-Goals

**Goal:** Deliver the final ticket of the backtest-self-tuning epic. A GitHub Actions cron workflow fires every Monday at 05:00 UTC and runs a Python entry script that: (a) reads the last 90 days of predictions + actuals from Firestore; (b) guards on a minimum 30-sample corpus; (c) runs up to 50 iterations of Bayesian optimization (`scikit-optimize gp_minimize`) over the search space `(window ∈ [14,60], pearson ∈ [0.2,0.7], top_k ∈ [5,30])`, using the objective `0.5·high_hit_rate + 0.5·low_hit_rate`; (d) short-circuits if no improvement exceeds `IMPROVEMENT_EPSILON = 1e-4` over 20 consecutive iterations; (e) writes the winning params to `predictor_params/active`, `predictor_params/history/{run_id}`, and `optimize_runs/{run_id}`; and (f) triggers a Cloud Run no-op redeploy so the backend boots with the new params. A hash-equality pre-check prevents unnecessary writes and redeploys when the winner is identical to the current active params.

**Non-Goals:** Frontend display of `optimize_runs` history (Phase 2). Feature-weight tuning of `_candle_feature_vector` (requires predictor similarity refactor — Phase 2). Batch-write atomicity across three Firestore collections (Phase 2 per QA Known Gap ruling). Rollback mechanism if new params degrade live hit-rate (Phase 2). Any modification to `backend/predictor.py` signatures (`find_top_matches`, `compute_stats`, etc.).

---

## §2 Architecture Diagram

```
GHA cron: Mondays 05:00 UTC
.github/workflows/weekly-optimize.yml
  │
  ├─ pip install -r backend/requirements.txt
  │
  ├─ GOOGLE_APPLICATION_CREDENTIALS ← ${{ secrets.GCP_SA_KEY }}
  │
  └─ python scripts/weekly_optimize.py
       │
       ├─ [1] Corpus fetch: Firestore read
       │      predictions/ (last 90 days, query_ts >= cutoff)
       │      actuals/     (last 90 days, computed_at >= cutoff)
       │      → join by doc_id → completed_pairs[]
       │
       ├─ [2] Data-sufficiency guard
       │      len(completed_pairs) < MIN_SAMPLES=30 ?
       │        YES → log "insufficient data: N pairs found, min 30 required"
       │               exit 0  (graceful skip — no writes, no redeploy)
       │        NO  → continue
       │
       ├─ [3] Current params fetch
       │      Firestore: predictor_params/active → current_params_hash, current_score
       │      (current_score computed from same corpus; see §4)
       │
       ├─ [4] Bayesian optimization loop (backend/optimizer.py helpers)
       │      skopt.gp_minimize(
       │        func    = objective_fn (closure over completed_pairs),
       │        space   = [Integer(14,60), Real(0.2,0.7), Integer(5,30)],
       │        n_calls = MAX_ITERATIONS=50,
       │        random_state = RANDOM_STATE=42,
       │      )
       │
       │      Per iteration:
       │        params_snapshot = ParamSnapshot(window, pearson, top_k)
       │        with optimizer.param_override(params_snapshot):
       │          score = evaluate_corpus(completed_pairs, params_snapshot)
       │                 = 0.5·high_hit_rate + 0.5·low_hit_rate
       │        return -score  (gp_minimize minimizes)
       │
       │      Cost guard (checked per iteration in callback):
       │        no_improve_count >= 20 AND
       │        best_new - best_prev <= IMPROVEMENT_EPSILON ?
       │          → raise EarlyExitSignal (caught outside skopt)
       │          → log "early exit after N iterations — no improvement > 1e-4 over last 20"
       │
       ├─ [5] Winner selection
       │      winner = arg-max objective over all evaluated candidates
       │      winner_hash = _compute_params_hash(window, pearson, top_k)
       │      Log winning params to stdout BEFORE any Firestore write
       │
       ├─ [6] Idempotency check
       │      winner_hash == current_params_hash ?
       │        YES → log "params unchanged — skipping write and redeploy"
       │               exit 0
       │        NO  → continue to writes
       │
       ├─ [7] Firestore writes (sequential, retry-once each)
       │      write_optimizer_params(client, {window_days, pearson_threshold, top_k, optimized_at})
       │        → predictor_params/active
       │      write_optimizer_params_history(client, run_id, {same fields})
       │        → predictor_params/history/{run_id}
       │      write_optimize_run(client, run_id, {all FIRESTORE_OPTIMIZE_RUN_FIELDS})
       │        → optimize_runs/{run_id}
       │      Any write failure after 1 retry → log + exit non-zero
       │
       └─ [8] Cloud Run redeploy
              subprocess.run(
                ["gcloud", "run", "services", "update", "k-line-backend",
                 "--region=asia-east1", "--no-traffic"],
                check=False,
              )
              returncode != 0 → log ERROR + exit non-zero
                                (Firestore writes NOT rolled back — params ARE updated)
              returncode == 0 → log "Cloud Run redeploy triggered successfully"
                                exit 0
```

---

## §3 New File Inventory

| File | Status | Responsibility |
|---|---|---|
| `.github/workflows/weekly-optimize.yml` | NEW | GHA cron (Mon 05:00 UTC) + `workflow_dispatch`; installs `requirements.txt`; sets `GOOGLE_APPLICATION_CREDENTIALS`; runs `scripts/weekly_optimize.py` |
| `scripts/weekly_optimize.py` | NEW | Entry-point orchestrator: corpus fetch, data-sufficiency guard, Bayesian loop invocation, winner write, Cloud Run redeploy; all module-level constants declared here |
| `backend/optimizer.py` | NEW | Pure helper functions: `param_override()` context manager, `evaluate_corpus()`, `build_optimize_run_doc()`, `build_predictor_params_doc()`; no Firestore I/O, no subprocess |
| `backend/tests/test_weekly_optimize.py` | NEW | Unit tests for optimizer helpers + `scripts/weekly_optimize.py`; all Firestore + subprocess calls mocked; ≥ 7 test cases (see §10) |
| `backend/firestore_config.py` | MODIFIED | Add `FIRESTORE_OPTIMIZE_RUN_FIELDS`, `FIRESTORE_PREDICTOR_PARAMS_HISTORY_FIELDS` frozensets; add `write_optimizer_params()`, `write_optimize_run()` writer helpers; add both to `__all__` |
| `backend/requirements.txt` | MODIFIED | Add `scikit-optimize>=0.9` (optimizer-only; comment-tagged; Cloud Run Dockerfile installs same file — acceptable for Phase 1; split to `requirements-optimize.txt` is Phase 2 if image size matters) |
| `ssot/system-overview.md` | MODIFIED | Add weekly optimizer flow diagram + `optimize_runs` collection row to Firestore Config table |
| `ssot/deploy.md` | MODIFIED | Add `workflow_dispatch` verification step for `weekly-optimize.yml` |

**Read-only (must not change):**
- `backend/predictor.py` — optimizer calls `find_top_matches()` and `compute_stats()` as pure functions; no signature or body modification
- `scripts/daily_predict.py` — upstream writer; K-083 is a downstream reader

---

## §4 Bayesian Search Algorithm (pseudocode)

### Module constants (scripts/weekly_optimize.py)

```
MIN_SAMPLES      = 30      # corpus gate — exit 0 if below
MAX_ITERATIONS   = 50      # skopt n_calls
RANDOM_STATE     = 42      # fixed seed for deterministic candidate sequence
IMPROVEMENT_EPSILON = 1e-4 # cost-guard sensitivity
NO_IMPROVE_WINDOW   = 20   # cost-guard window (consecutive no-improvement count)
CORPUS_WINDOW_DAYS  = 90   # lookback window for predictions + actuals fetch
WRITE_RETRY_WAIT    = 5    # seconds; matches K-080 _WRITE_RETRY_DELAY_SECONDS
```

### param_override context manager (backend/optimizer.py)

```
context_manager param_override(snapshot: ParamSnapshot):
    """Temporarily replaces predictor.params for one objective evaluation."""
    import predictor
    original = predictor.params        # save reference
    predictor.params = snapshot        # swap in candidate
    try:
        yield
    finally:
        predictor.params = original    # restore unconditionally
```

This satisfies AC-083-OBJECTIVE-FUNCTION "predictor.params is restored after each evaluation" without monkey-patching module constants. The `ParamSnapshot` fields `ma_trend_window_days`, `ma_trend_pearson_threshold`, and `top_k_matches` are the three dimensions that `find_top_matches()` reads through `params.*`.

### evaluate_corpus (backend/optimizer.py)

```
function evaluate_corpus(
    completed_pairs: list[dict],     # [{prediction_doc, actual_doc}, ...]
    snapshot: ParamSnapshot,
    history_1h: list,                # full in-memory 1H CSV history (loaded once at startup)
    history_1d: list,                # full in-memory 1D CSV history (loaded once at startup)
) -> float:
    """
    Re-runs find_top_matches() + compute_stats() for each completed pair
    using snapshot params; returns objective score.
    """
    high_hits = 0
    low_hits  = 0
    total     = 0

    with param_override(snapshot):
        for pair in completed_pairs:
            pred_doc   = pair["prediction"]
            actual_doc = pair["actual"]

            # Build query input from prediction document
            query_bars = build_query_bars_from_prediction(pred_doc, history_1h)
            if query_bars is None:
                continue   # skip pairs where query bars cannot be reconstructed

            try:
                matches = find_top_matches(
                    input_bars  = query_bars,
                    history     = history_1h,
                    history_1d  = history_1d,
                )
                stats = compute_stats(matches, current_close=query_bars[-1].close)
            except ValueError:
                continue   # no matches found for this candidate — skip, do not abort

            projected_high = stats.projected_high
            projected_low  = stats.projected_low

            if projected_high is not None and actual_doc["actual_high"] >= projected_high:
                high_hits += 1
            if projected_low is not None and actual_doc["actual_low"] <= projected_low:
                low_hits += 1
            total += 1

    if total == 0:
        return 0.0   # degenerate corpus — no scoreable pairs

    return 0.5 * (high_hits / total) + 0.5 * (low_hits / total)
```

**Key design notes:**
- `history_1h` and `history_1d` are loaded ONCE at script startup from the same CSV paths used by `daily_predict.py`. They are passed as closure variables into the objective function — NOT re-read per Bayesian iteration. This satisfies AC-083-OBJECTIVE-FUNCTION "corpus passed in as closure, not re-fetched per call."
- `build_query_bars_from_prediction()` is a helper in `backend/optimizer.py` that reconstructs a 24-bar `OHLCBar` window from the CSV using `pred_doc["query_ts"]`. If the timestamp is not found in the CSV (e.g. scraper missed that day), the pair is silently skipped.
- `find_top_matches()` and `compute_stats()` are called without any argument changes — their signatures remain untouched (K-080 immutability constraint).

### Objective closure + skopt invocation (scripts/weekly_optimize.py)

```
function make_objective(completed_pairs, history_1h, history_1d):
    def objective(params_list):
        # skopt passes a list [window, pearson, top_k]
        window, pearson, top_k = params_list
        snapshot = ParamSnapshot(
            ma_trend_window_days         = int(window),
            ma_trend_pearson_threshold   = float(pearson),
            top_k_matches                = int(top_k),
            params_hash                  = _compute_params_hash(int(window), float(pearson), int(top_k)),
            optimized_at                 = None,
            source                       = "optimizer",
        )
        score = evaluate_corpus(completed_pairs, snapshot, history_1h, history_1d)
        return -score   # gp_minimize minimizes; we maximize objective
    return objective


space = [Integer(14, 60), Real(0.2, 0.7), Integer(5, 30)]

# Cost guard implemented via callback
no_improve_streak = [0]
best_seen         = [-float("inf")]

def cost_guard_callback(result):
    current_best = -min(result.func_vals)
    if current_best - best_seen[0] > IMPROVEMENT_EPSILON:
        best_seen[0]          = current_best
        no_improve_streak[0]  = 0
    else:
        no_improve_streak[0] += 1
    if no_improve_streak[0] >= NO_IMPROVE_WINDOW:
        raise EarlyExitSignal(
            f"early exit after {len(result.func_vals)} iterations — "
            f"no improvement > {IMPROVEMENT_EPSILON} over last {NO_IMPROVE_WINDOW} iterations"
        )

try:
    result = gp_minimize(
        func         = make_objective(completed_pairs, history_1h, history_1d),
        dimensions   = space,
        n_calls      = MAX_ITERATIONS,
        random_state = RANDOM_STATE,
        callback     = [cost_guard_callback],
    )
    early_exit = False
except EarlyExitSignal as e:
    log INFO str(e)
    result = <best result accumulated so far from callback's result object>
    early_exit = True
```

**EarlyExitSignal note:** `skopt.gp_minimize` does not have a native early-stop API. The callback mechanism raises a custom exception class `EarlyExitSignal(Exception)` defined in `scripts/weekly_optimize.py`. The callback receives the cumulative `OptimizeResult` object after each iteration — `result.func_vals` contains all evaluated objective values, so best-so-far can be extracted even after early exit.

---

## §5 Schema Additions

### FIRESTORE_OPTIMIZE_RUN_FIELDS (new, backend/firestore_config.py)

```python
FIRESTORE_OPTIMIZE_RUN_FIELDS: frozenset = frozenset({
    "run_id",            # str  — "optimize-{YYYY-MM-DD}" (ISO date of run)
    "best_score",        # float — max objective (0.5·high_hit + 0.5·low_hit)
    "best_params",       # dict — {"window_days": int, "pearson_threshold": float, "top_k": int}
    "iterations_run",    # int  — actual count of Bayesian evaluations (≤ MAX_ITERATIONS=50)
    "early_exit",        # bool — True if cost guard fired before MAX_ITERATIONS
    "data_window_days",  # int  — always 90 (CORPUS_WINDOW_DAYS constant)
    "sample_size",       # int  — len(completed_pairs) used in this run
    "started_at",        # str  — ISO8601 UTC when optimizer loop began
    "completed_at",      # str  — ISO8601 UTC when winner was selected
})
```

### FIRESTORE_PREDICTOR_PARAMS_HISTORY_FIELDS (new, backend/firestore_config.py)

```python
FIRESTORE_PREDICTOR_PARAMS_HISTORY_FIELDS: frozenset = frozenset({
    "window_days",        # int   — winning window value
    "pearson_threshold",  # float — winning pearson value
    "top_k",              # int   — winning top_k value
    "optimized_at",       # str   — ISO8601 UTC (same as completed_at)
    "best_score",         # float — winning objective score
    "run_id",             # str   — "optimize-{YYYY-MM-DD}"
    "git_sha",            # str   — first 8 chars of HEAD SHA at optimizer run time
    "corpus_size",        # int   — sample_size alias (number of scored pairs)
})
```

**Note on `FIRESTORE_PREDICTOR_PARAMS_FIELDS` (existing, K-078):** The `predictor_params/active` document uses the existing `FIRESTORE_PREDICTOR_PARAMS_FIELDS` frozenset: `{window_days, pearson_threshold, top_k, optimized_at}`. K-083 does NOT extend this frozenset — the active doc shape is unchanged. The history doc uses its own frozenset above (richer, audit-oriented).

### Exported contract (§AC-083-SCHEMA-CONTRACT-EXPORTED requirement)

`FIRESTORE_OPTIMIZE_RUN_FIELDS` fields with types:

| Field | Python type | Wire format | Notes |
|---|---|---|---|
| `run_id` | str | `"optimize-2026-05-05"` | Deterministic; overwrites on same-day re-run |
| `best_score` | float | 0.0–1.0 | Objective = 0.5·high_hit_rate + 0.5·low_hit_rate |
| `best_params` | dict | `{"window_days": int, "pearson_threshold": float, "top_k": int}` | Inline dict, not a subcollection |
| `iterations_run` | int | 1–50 | Actual evaluations; ≤ MAX_ITERATIONS |
| `early_exit` | bool | true/false | True when cost guard fired |
| `data_window_days` | int | always 90 | CORPUS_WINDOW_DAYS constant |
| `sample_size` | int | ≥ 30 | Only written when guard passes |
| `started_at` | str | ISO8601 UTC | e.g. "2026-05-05T05:00:12Z" |
| `completed_at` | str | ISO8601 UTC | e.g. "2026-05-05T05:07:43Z" |

---

## §6 Cost Guard Logic

```
# State: maintained across Bayesian iterations via callback closure
no_improve_streak  = 0
best_seen_score    = -inf

# Per-iteration check (inside cost_guard_callback):
current_best = -min(result.func_vals)   # negate back to positive objective
if (current_best - best_seen_score) > IMPROVEMENT_EPSILON:   # strict >
    best_seen_score   = current_best
    no_improve_streak = 0
else:
    no_improve_streak += 1

if no_improve_streak >= NO_IMPROVE_WINDOW:   # 20 consecutive no-improve
    raise EarlyExitSignal(
        f"early exit after {len(result.func_vals)} iterations — "
        f"no improvement > {IMPROVEMENT_EPSILON} over last {NO_IMPROVE_WINDOW} iterations"
    )
```

**Boundary definitions:**
- "improvement" = strictly `new - prev > IMPROVEMENT_EPSILON` (not `>=`), per AC-083-COST-GUARD.
- The streak counter resets to 0 on any improvement, regardless of magnitude.
- If first iteration is the only improvement ever, no_improve_streak will reach 20 by iteration 21.
- If every iteration improves (unlikely), early exit never fires; full 50 iterations run.

---

## §7 Redeploy Idempotency

```
# After winner selection, before Firestore writes:
winner_hash = _compute_params_hash(
    winner_window, winner_pearson, winner_top_k
)

# Fetch current active hash (already loaded at script startup)
current_hash = current_active_params.params_hash

if winner_hash == current_hash:
    log INFO "params unchanged (hash={winner_hash[:8]}) — skipping write and redeploy"
    sys.exit(0)

# Only reaches here if winner is genuinely different
log INFO f"winner params: window={w} pearson={p} top_k={k} score={score:.4f} hash={winner_hash[:8]}"
# ^ logged BEFORE writes, satisfying AC-083-FIRESTORE-FAILURE-MID-RUN stdout requirement

# Proceed with sequential writes + redeploy
```

**_compute_params_hash:** Reuses the existing function from `backend/firestore_config.py` (K-078). Formula: `sha256(f"{window}:{pearson:.6f}:{top_k}")`. No new hash logic introduced.

---

## §8 Failure Semantics Matrix

| Failure mode | When | Action | Exit code | Notes |
|---|---|---|---|---|
| Corpus fetch — Firestore unavailable | [1] Initial read | Log exception, `sys.exit(1)` | 1 (hard fail) | Distinct from data-sufficiency guard (N < 30 is exit 0) |
| Corpus fetch — N < 30 completed pairs | [2] Sufficiency check | Log "insufficient data", `sys.exit(0)` | 0 (graceful skip) | Expected for first 30 weeks of accumulation |
| Current params fetch fails | [3] Active doc read | Log warning; set `current_hash = None`; idempotency check skipped (safe-default: proceed with writes) | Continues | Missing active doc = first-ever optimizer run |
| Bayesian iteration raises ValueError (no matches) | [4] Objective fn | Skip pair, continue | Continues | Not all pairs scoreable under all param combos |
| Bayesian iteration — all pairs unevaluable | [4] Evaluate corpus | `evaluate_corpus` returns 0.0; optimizer explores further | Continues | Degenerates corpus; winner will be low-score |
| Winner write fails (1st attempt) | [7] Firestore write | Retry once after 5s | Continues to retry | Same `_write_with_retry` logic as K-080 |
| Winner write fails (2nd attempt, any of 3 docs) | [7] Firestore write | Log collection+path+exception, `sys.exit(1)` | 1 (hard fail) | Winning params already logged to stdout (manual recovery) |
| Cloud Run `gcloud` auth/API error | [8] Redeploy | Log error, `sys.exit(1)` | 1 (hard fail) | Firestore writes committed; operator must manually redeploy |
| Cloud Run `gcloud` exits 0 | [8] Redeploy | Log success, `sys.exit(0)` | 0 (success) | — |
| `workflow_dispatch` duplicate same Monday | Any | Second run overwrites `optimize_runs/{run_id}` silently | — | Known Gap (QA Challenge #7 ruling) |

**Exit code summary:**
- `0` — success, graceful skip (insufficient data), or params-unchanged
- `1` — hard fail (corpus fetch error, write permanent failure, gcloud non-zero)

---

## §9 Determinism

`RANDOM_STATE = 42` declared as module-level constant in `scripts/weekly_optimize.py`. Passed as `random_state=42` to `skopt.gp_minimize`. This ensures:
- Given identical `completed_pairs` corpus, the candidate sequence is reproducible.
- Test suites that pass a fixed mock corpus will produce deterministic objective scores.

**Known Gap (from QA Challenge #7 ruling):** Week-to-week determinism is NOT guaranteed because the 90-day Firestore corpus changes every week (new samples added). This is correct model behavior: the optimizer should explore different candidates as data evolves. Fixed seed only guarantees within-session reproducibility for the same corpus, which is sufficient for test determinism.

**Known Gap (from QA Challenge #8 ruling):** Parallel run collision — if two `workflow_dispatch` triggers fire on the same Monday, both will compute `run_id = "optimize-{YYYY-MM-DD}"` and the second Firestore write will silently overwrite the first. Phase 1 mitigation: GHA scheduled cron guarantees single-execution per Monday; `workflow_dispatch` is for operator verification only.

---

## §10 Test Plan

File: `backend/tests/test_weekly_optimize.py`

Target: ≥ 7 pytest cases. All use `MagicMock` Firestore client + `unittest.mock.patch` for `subprocess.run`. No live Firestore or Cloud Run calls.

| # | Test ID | AC mapped | Description |
|---|---|---|---|
| 1 | `test_data_sufficiency_guard_fires_at_29` | AC-083-DATA-SUFFICIENCY-GUARD | Mock corpus = 29 pairs; assert `sys.exit(0)` raised; assert no Firestore write called; assert no subprocess called |
| 2 | `test_objective_function_known_corpus` | AC-083-OBJECTIVE-FUNCTION | 3-pair corpus; mock `find_top_matches` returns known match list; compute expected `0.5·high_hit + 0.5·low_hit`; assert `evaluate_corpus` returns that exact float |
| 3 | `test_cost_guard_fires_after_20_no_improve` | AC-083-COST-GUARD | Inject objective that returns constant 0.5 for all iterations; assert `early_exit=True` in winner doc after 20+1 calls; assert log message contains "early exit" |
| 4 | `test_winner_write_order_and_field_sets` | AC-083-WINNER-WRITE | Mock Firestore client; assert three writes in order (active → history/{run_id} → optimize_runs/{run_id}); assert written dict key sets exactly match `FIRESTORE_PREDICTOR_PARAMS_FIELDS`, `FIRESTORE_PREDICTOR_PARAMS_HISTORY_FIELDS`, `FIRESTORE_OPTIMIZE_RUN_FIELDS` respectively |
| 5 | `test_firestore_transient_failure_retry_succeeds` | AC-083-FIRESTORE-FAILURE-MID-RUN | Mock write to raise on first call, succeed on second; assert no exception propagates; assert final doc written |
| 6 | `test_firestore_permanent_failure_exit_nonzero` | AC-083-FIRESTORE-FAILURE-MID-RUN | Mock write to raise on both attempts; assert `sys.exit(1)` raised; assert capsys stdout contains winning params (logged before write) |
| 7 | `test_predictor_params_restored_after_objective_eval` | AC-083-OBJECTIVE-FUNCTION + AC-083-SACRED-FLOOR-INTACT | Import `predictor`; record `predictor.params` identity before evaluation; call `evaluate_corpus` with a candidate snapshot; assert `predictor.params is original` after call (isolation regression) |
| 8 | `test_hash_equal_early_exit` | AC-083-WINNER-WRITE (idempotency clause) | Mock corpus ≥ 30; mock current active params hash = same as what optimizer would select; assert no Firestore write; assert `sys.exit(0)` |
| 9 | `test_gcloud_failure_exits_nonzero` | AC-083-REDEPLOY-TRIGGER | Mock `subprocess.run` to return `returncode=1`; assert `sys.exit(1)` raised after all three Firestore writes succeed |
| 10 | `test_frozenset_contract_no_extra_fields` | AC-083-SCHEMA-CONTRACT-EXPORTED | Build `optimize_runs` doc via `build_optimize_run_doc()`; assert `set(doc.keys()) == FIRESTORE_OPTIMIZE_RUN_FIELDS` (exactly equal, no extras, no missing) |

**Regression:** `pytest backend/tests/test_predict_real_csv_integration.py -v` — sacred floor 129 bars must remain green. No K-083 changes touch `predictor.py`.

---

## §11 Implementation Order

1. **Read existing test patterns** — read `backend/tests/test_daily_predict.py` and `backend/tests/test_firestore_config.py` to confirm import patterns, conftest usage, and path setup before writing any new file.
2. **Extend `backend/firestore_config.py`** — add `FIRESTORE_OPTIMIZE_RUN_FIELDS`, `FIRESTORE_PREDICTOR_PARAMS_HISTORY_FIELDS` frozensets; add `write_optimizer_params()`, `write_optimize_run()` writer helpers; update `__all__`; run `python -m py_compile backend/firestore_config.py`.
3. **Add `scikit-optimize>=0.9` to `backend/requirements.txt`** — with comment `# optimizer-only; not used by Cloud Run at runtime`.
4. **Write `backend/optimizer.py`** — `param_override()` context manager, `evaluate_corpus()`, `build_query_bars_from_prediction()`, `build_optimize_run_doc()`, `build_predictor_params_doc()`, `build_predictor_params_history_doc()`; run `python -m py_compile backend/optimizer.py`.
5. **Write `scripts/weekly_optimize.py`** — module constants, `EarlyExitSignal`, corpus fetch, data-sufficiency guard, current-params fetch, objective closure, skopt invocation, cost guard callback, winner selection, idempotency check, sequential writes, Cloud Run subprocess; run `python -m py_compile scripts/weekly_optimize.py`.
6. **Write `backend/tests/test_weekly_optimize.py`** — all 10 test cases; run `pytest backend/tests/test_weekly_optimize.py -v`; confirm ≥ 7 pass.
7. **Run sacred-floor regression** — `pytest backend/tests/test_predict_real_csv_integration.py -v`; confirm all pass and `SACRED_FLOOR=129` intact.
8. **Run full backend test suite** — `pytest backend/tests/ -v`; confirm no regressions.
9. **Write `.github/workflows/weekly-optimize.yml`** — cron `"0 5 * * 1"`, `workflow_dispatch`, pip install step, `GOOGLE_APPLICATION_CREDENTIALS` env, `python scripts/weekly_optimize.py`.
10. **Update `ssot/system-overview.md`** — add `optimize_runs/{run_id}` row to Firestore table; add weekly optimizer flow diagram.
11. **Update `ssot/deploy.md`** — add `workflow_dispatch` verification step for `weekly-optimize.yml`.
12. **Commit** with message `docs(arch): K-083 design — weekly Bayesian optimizer + Cloud Run redeploy + frozenset contracts`.

---

## §12 Dependencies / Package Additions

| Package | Version constraint | File | Notes |
|---|---|---|---|
| `scikit-optimize` | `>=0.9` | `backend/requirements.txt` | Optimizer-only; not called by Cloud Run request handlers; Cloud Run Dockerfile installs `backend/requirements.txt` — `scikit-optimize` will be present in the image but idle. Phase 2: if image size becomes a concern, split to `requirements-optimize.txt` installed only in GHA optimizer step. |

**Verdict on split (SQ-1 ruling):** Do NOT create `requirements-optimize.txt` now. The AC-083-WORKFLOW-CRON language says "requirements.txt is pip-installed inside the workflow step" — no mention of a separate file. Adding a new requirements file without AC backing violates Simplicity First. Tag the line with a comment; split is Phase 2.

---

## §13 Refactorability Checklist

- [x] **Single responsibility:** `backend/optimizer.py` = pure evaluation helpers only; `scripts/weekly_optimize.py` = orchestration only; `backend/firestore_config.py` = schema + I/O only. No cross-concern mixing.
- [x] **Interface minimization:** `evaluate_corpus()` takes exactly the inputs it needs (pairs, snapshot, two history lists); no God-object passed through.
- [x] **Unidirectional dependency:** `weekly_optimize.py` → `optimizer.py` → `predictor.py`; no reverse imports. `firestore_config.py` has no import from `predictor.py` (existing constraint, preserved).
- [x] **Replacement cost:** If `scikit-optimize` were replaced (e.g. with `optuna`), only `scripts/weekly_optimize.py` needs changes; `backend/optimizer.py` pure functions remain unchanged. ≤2 files.
- [x] **Clear test entry point:** `evaluate_corpus()` takes concrete inputs and returns a float — QA can test it in isolation without reading `weekly_optimize.py`.
- [x] **Change isolation:** Firestore schema changes (new frozensets) do not affect `predictor.py` or `optimizer.py` pure functions.

---

## §14 Boundary Pre-emption Table

| Boundary scenario | Behavior defined? | Where |
|---|---|---|
| Corpus fetch returns 0 pairs | Yes — exit 0 (< 30 gate) | §2 step [2], §8 row 2 |
| Corpus fetch N = 29 (boundary) | Yes — exit 0 | §6, AC-083-DATA-SUFFICIENCY-GUARD |
| Corpus fetch N = 30 (boundary) | Yes — proceed to optimization | AC-083-DATA-SUFFICIENCY-GUARD (inclusive ≥ 30) |
| Firestore unavailable at corpus fetch | Yes — log + exit 1 | §8 row 1 |
| `evaluate_corpus` — all pairs unevaluable | Yes — returns 0.0; optimizer continues | §4, §8 row 5 |
| Bayesian winner = current active params | Yes — idempotency check, exit 0 | §7 |
| Firestore write transient failure (1st) | Yes — retry once after 5s | §8 row 7, AC-083-FIRESTORE-FAILURE-MID-RUN |
| Firestore write permanent failure (2nd) | Yes — log + exit 1 | §8 row 8 |
| `gcloud` non-zero exit | Yes — log + exit 1; writes NOT rolled back | §8 row 9, AC-083-REDEPLOY-TRIGGER |
| Concurrent same-day `workflow_dispatch` runs | Yes — Known Gap; second run overwrites first silently | §9 Known Gap, QA Challenge #7 |
| Write 1 succeeds, write 2 fails | Yes — Known Gap; active updated, history missing | QA Challenge #9 Known Gap |
| `top_k_matches` candidate = 0 | Inherits K-078 guard in `load_active_params`; optimizer search space lower bound = 5, so impossible | AC-083-SEARCH-SPACE (`Integer(5,30)`) |

---

## All-Phase Coverage Gate

| Phase | Backend API | Scripts | Schema Contract | Test Cases |
|---|---|---|---|---|
| K-083 (single phase) | ✓ writer helpers + gcloud | ✓ weekly_optimize.py entry | ✓ FIRESTORE_OPTIMIZE_RUN_FIELDS + FIRESTORE_PREDICTOR_PARAMS_HISTORY_FIELDS | ✓ ≥ 10 pytest cases §10 |

---

## AC ↔ Test Case Cross-Check

| AC ID | Test case(s) in §10 |
|---|---|
| AC-083-WORKFLOW-CRON | Verified by workflow YAML structure (no pytest case needed — file content check) |
| AC-083-DATA-SUFFICIENCY-GUARD | #1 |
| AC-083-SEARCH-SPACE | Implicitly verified by #2 (objective called with valid-space params) |
| AC-083-OBJECTIVE-FUNCTION | #2, #7 |
| AC-083-COST-GUARD | #3 |
| AC-083-WINNER-WRITE | #4, #8 |
| AC-083-REDEPLOY-TRIGGER | #9 |
| AC-083-FIRESTORE-FAILURE-MID-RUN | #5, #6 |
| AC-083-SCHEMA-CONTRACT-EXPORTED | #4, #10 |
| AC-083-SACRED-FLOOR-INTACT | #7 + regression pytest run |
| AC-083-TESTS | §10 (10 cases, all listed) |
| AC-083-DOCS-UPDATE | ssot/system-overview.md + ssot/deploy.md edits (not a pytest case) |

Total test cases: 10 (≥ 7 AC-083-TESTS minimum satisfied).

---

## Consolidated Delivery Gate Summary

```
Architect delivery gate:
  all-phase-coverage=✓,
  pencil-frame-completeness=N/A — no .pen file; backend-only workflow ticket,
  visual-spec-json-consumption=N/A — visual-spec: N/A in frontmatter,
  sacred-ac-cross-check=N/A — no JSX node deletion or DOM restructure,
  route-impact-table=N/A — ticket scope has no global CSS or sitewide token change,
  cross-page-duplicate-audit=N/A — no new React component; backend scripts only,
  target-route-consumer-scan=N/A — no route navigation behavior change,
  architecture-doc-sync=✓ — ssot/system-overview.md update specified in §3 and §11,
  self-diff=✓ — no existing architecture table rows modified; additive only,
  output-language=✓ — no CJK characters in this file
  → OK
```

---

## Retrospective

**Where most time was spent:** §4 Bayesian algorithm pseudocode — specifically designing the `param_override` context manager that swaps `predictor.params` without monkey-patching module constants, and resolving how `EarlyExitSignal` interacts with `skopt.gp_minimize` callback API.

**Which decisions needed revision:** None required mid-session. SQ-1 (requirements.txt split) was resolved inline by applying the Simplicity First rule — no split now, Phase 2 if needed.

**Next time improvement:** When the objective function interacts with a module-global (`predictor.params`), explicitly draft the context manager interface in §4 before writing the test plan in §10 — test cases #7 and #3 depend on this contract, and drafting them in the wrong order risks spec drift.
