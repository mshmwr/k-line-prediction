---
ticket: K-080
title: Daily Predict + Storage Workflow
phase: 1
status: ready-for-engineer
visual-spec: N/A — reason: backend-only + GHA workflow; no UI change
created: 2026-05-02
author: senior-architect
---

## 0 Scope Clarifications

No open scope questions. All QA challenges resolved in ticket §QA Early Consultation (8 raised, 6 supplemented to AC, 2 declared Known Gap).

AC-080-NO-PREDICTOR-MUTATION is an immovable constraint: `backend/predictor.py` receives zero diffs.

---

## 1 Option Analysis

### Option A — Conservative: single monolithic entry script, no helpers extracted

All logic (CSV load, prediction, Firestore writes, backfill, summary) in a single flat `main()` body (~400 lines).

- **Applicable when:** one-off script, no unit testing needed, lifecycle is disposable.
- **Trade-off:** untestable — mock insertion requires monkeypatching at global scope; retry logic and outcome computation cannot be tested in isolation. Fails AC-080-TESTS requirement for ≥6 unit tests.

### Option B — Progressive: separate modules (`predict_storage.py`, `backfill.py`, `summarize.py`)

Split into three Python modules with a thin orchestrator.

- **Applicable when:** each concern will grow substantially over time and needs its own test suite.
- **Trade-off:** cross-module import graph increases complexity; K-080 is a ~200-line script, not a package. Three files for a single workflow is over-engineering per Simplicity First principle.

### Option C — Middle ground: single `scripts/daily_predict.py` with extracted helper functions (SELECTED)

One file, ~200 lines, decomposed into named functions with clean signatures. All Firestore I/O concentrated in `firestore_config.py` writer helpers.

- **Applicable when:** script is testable at function level; single-file constraint required; Simplicity First.
- **Trade-off:** as the workflow grows, refactoring to Option B will need careful import surgery — acceptable as a future concern.

**Recommendation: Option C.** Matches AC scope (~200 lines), passes testability requirements, and keeps all Firestore writer logic in the established `firestore_config.py` home.

---

## 2 Architecture

### 2.1 Daily Flow Data Path

```
GitHub Actions cron timeline
─────────────────────────────────────────────────────────────────────────

  03:00 UTC   scrape-history.yml  [existing]
              │  python scripts/scrape_history.py
              │  git add history_database/
              │  git commit "ops(scraper): append K-line bars YYYY-MM-DD [skip ci]"
              │  git push
              ▼
         history_database/Binance_ETHUSDT_1h.csv  (updated on main)

  04:00 UTC   daily-predict.yml   [new — K-080]
              │  git checkout → csv freshness gate (90-min threshold)
              │  if stale → log warning, exit 0  (graceful skip)
              │
              │  load_active_params() from Firestore predictor_params/active
              │    └─ fallback to DEFAULT_PARAMS on any error
              │
              │  load_csv_history(HISTORY_1H_PATH)
              │  build_query_window(df, anchor_ts)
              │    └─ last 24 × 1H bars ending at yesterday's 23:00 UTC
              │
              │  run_prediction(query_df, params)
              │    ├─ find_top_matches(input_bars, ...)
              │    └─ compute_stats(matches, current_close)
              │
              │  write_prediction(client, ts, prediction)
              │    └─ Firestore: predictions/{YYYY-MM-DD-HH}
              │
              │  backfill_actuals(client, df, cutoff_ts)
              │    ├─ list_predictions_older_than(client, 72h)
              │    └─ for each: compute_outcome() → write_actual()
              │
              │  compute_backtest_summary(client, today)
              │    └─ 30-day rolling pairs (predictions + actuals)
              │
              │  write_summary(client, date, summary)
              │    └─ Firestore: backtest_summaries/{YYYY-MM-DD}
              │
              └─ print summary to GHA log, exit 0
                    (non-zero exit on unretriable Firestore failure)

─────────────────────────────────────────────────────────────────────────
Firestore collections touched (write):
  predictions/{YYYY-MM-DD-HH}
  actuals/{YYYY-MM-DD-HH}
  backtest_summaries/{YYYY-MM-DD}

Firestore collections touched (read):
  predictor_params/active
  predictions/* (for backfill scan)
  actuals/* (for summary computation)
```

### 2.2 Module Dependency Graph

```
scripts/daily_predict.py
  ├─ backend.firestore_config   (ParamSnapshot, DEFAULT_PARAMS, load_active_params,
  │                              write_prediction, write_actual, write_summary,
  │                              list_predictions_older_than)
  ├─ backend.predictor          (find_top_matches, compute_stats) — READ ONLY
  └─ stdlib: pathlib, datetime, math, sys, os, logging
```

No circular imports. `firestore_config.py` does NOT import from `predictor.py` (established by K-078).

---

## 3 Exported Contract (firestore_config.py additions)

These three frozensets are K-080's primary cross-ticket contract surface. K-081 (frontend) uses them for type safety; K-082 (optimizer) uses them as read-schema reference.

All three must be added to `__all__` in `backend/firestore_config.py`.

### 3.1 FIRESTORE_PREDICTION_FIELDS

```python
FIRESTORE_PREDICTION_FIELDS: frozenset = frozenset({
    "params_hash",        # str  — sha256 hex (full 64 chars); 12-char prefix exposed on /health
    "projected_high",     # float — highest projected price across top-K future paths
    "projected_low",      # float — lowest projected price across top-K future paths
    "projected_median",   # float — median of projected close at bar 72 (horizon anchor)
    "top_k_count",        # int  — actual number of matches returned by find_top_matches()
    "trend",              # str  — "up" | "down" | "flat" (from _classify_trend_by_pearson)
    "query_ts",           # str  — ISO8601 UTC datetime of the anchor bar (yesterday 23:00 UTC)
    "created_at",         # str  — ISO8601 UTC datetime when this doc was written
})
```

Document path: `predictions/{YYYY-MM-DD-HH}` where `YYYY-MM-DD-HH` is the `query_ts` formatted as `%Y-%m-%d-%H` (e.g. `2026-05-01-23`).

Field semantics:
- `projected_high` = `PredictStats.highest.price` (top-1 high suggestion from `compute_stats`)
- `projected_low` = `PredictStats.lowest.price` (bottom-1 low suggestion from `compute_stats`)
- `projected_median` = mean of `[m.future_ohlc[71].close for m in matches]` (bar 72 close, 0-indexed)
- `top_k_count` = `len(matches)` (may be < `params.top_k_matches` if history is sparse)
- `trend` extracted from `_classify_trend_by_pearson` result via the direction label map used in `find_top_matches` error path

**Known Gap (trend proxy):** `_classify_trend_by_pearson` is predictor-internal; K-080 uses win_rate thresholds (>0.55 = up, <0.45 = down, else flat) as observable proxy. The trend label is used only for `per_trend` breakdown in `backtest_summaries`, not for backtest correctness. K-082 may revisit when scikit-optimize search space evaluation needs the canonical trend label.

### 3.2 FIRESTORE_ACTUAL_FIELDS

```python
FIRESTORE_ACTUAL_FIELDS: frozenset = frozenset({
    "high_hit",      # bool  — True if any 1H bar's `high` >= `projected_high` in 72-bar window
    "low_hit",       # bool  — True if any 1H bar's `low`  <= `projected_low`  in 72-bar window
    "mae",           # float — mean absolute error: mean(|projected_median_path[i] - actual_close[i]|)
    "rmse",          # float — root mean square error of same path
    "actual_high",   # float — max(`high`) across the 72-bar window in CSV
    "actual_low",    # float — min(`low`)  across the 72-bar window in CSV
    "computed_at",   # str   — ISO8601 UTC datetime when this doc was written
})
```

Document path: `actuals/{YYYY-MM-DD-HH}` — same key as the parent `predictions` doc.

Notes on `mae` / `rmse` path:
- The "projected median path" for MAE/RMSE is a 72-bar series derived at prediction time from the ensemble of top-K future paths. Architect's ruling: `scripts/daily_predict.py` must re-derive this 72-bar path from the prediction doc's stored `projected_median` scalar only if no per-bar path is stored. Because storing 72 floats per prediction doc is future work (K-082 scope), the MAE/RMSE for K-080 uses a **simplified single-point** computation:

  - `projected_path` = `[projected_median] * 72` (flat projection at the stored scalar — conservative approximation)
  - `actual_path` = 72 bar close values from CSV starting at `query_ts + 1H`
  - `mae` = mean(|projected_path[i] - actual_path[i]|)
  - `rmse` = sqrt(mean((projected_path[i] - actual_path[i])^2))

  This simplification is intentional and documented. K-082 (optimizer) may extend the prediction doc with a per-bar path field; at that point the MAE/RMSE computation should be updated. Known Gap: single-scalar projection underestimates MAE when the actual path drifts significantly from the initial price.

### 3.3 FIRESTORE_BACKTEST_SUMMARY_FIELDS

```python
FIRESTORE_BACKTEST_SUMMARY_FIELDS: frozenset = frozenset({
    "hit_rate_high",   # float 0–1 — fraction of predictions where high_hit == True
    "hit_rate_low",    # float 0–1 — fraction of predictions where low_hit == True
    "avg_mae",         # float — arithmetic mean of mae across all completed pairs in window
    "avg_rmse",        # float — arithmetic mean of rmse across all completed pairs in window
    "sample_size",     # int   — count of (prediction, actual) completed pairs in 30-day window
    "per_trend",       # dict  — keys "up", "down", "flat"; each: {hit_rate_high, hit_rate_low, avg_mae, sample_size}
    "window_days",     # int   — always 30 (constant for K-080; optimizer may vary later)
    "computed_at",     # str   — ISO8601 UTC datetime when this doc was written
})
```

Document path: `backtest_summaries/{YYYY-MM-DD}` (one per calendar day, UTC).

`per_trend` sub-map shape (each key is optional — only written if `sample_size > 0` for that trend):
```
per_trend = {
    "up":   {"hit_rate_high": float, "hit_rate_low": float, "avg_mae": float, "sample_size": int},
    "down": {"hit_rate_high": float, "hit_rate_low": float, "avg_mae": float, "sample_size": int},
    "flat": {"hit_rate_high": float, "hit_rate_low": float, "avg_mae": float, "sample_size": int},
}
```

---

## 4 Module Layout — scripts/daily_predict.py

All function signatures are fixed. Engineer must not alter signatures without reopening design.

| Function | Signature | 1-line spec |
|---|---|---|
| `main()` | `() -> None` | Orchestrator: freshness gate → param load → prediction → write → backfill → summary; exits non-zero on unretriable error |
| `load_csv_history` | `(path: Path) -> pd.DataFrame` | Read `Binance_ETHUSDT_1h.csv` into DataFrame with columns `[open, high, low, close, time]`; `time` as UTC datetime index |
| `build_query_window` | `(df: pd.DataFrame, anchor_ts: datetime) -> pd.DataFrame` | Return the 24 × 1H bars ending at `anchor_ts` (inclusive); raises `ValueError` if fewer than 24 bars available |
| `run_prediction` | `(query_df: pd.DataFrame, params: ParamSnapshot, full_df: pd.DataFrame) -> dict` | Convert `query_df` to `List[OHLCBar]`, call `find_top_matches()` + `compute_stats()`; return assembled prediction dict matching `FIRESTORE_PREDICTION_FIELDS` shape |
| `write_prediction` | `(client, ts: str, data: dict) -> None` | Write prediction dict to `predictions/{ts}` using Firestore `set()` (overwrite semantics); retry once after 5s on failure. `params_hash` is pre-embedded in `data` by the caller (see `daily_predict.py:458`); separate param removed for caller-side simplicity. |
| `backfill_actuals` | `(client, df: pd.DataFrame, cutoff_ts: datetime) -> int` | Scan `predictions` docs with `query_ts` < `cutoff_ts`; for each without a corresponding `actuals` doc (or to overwrite): check 72-bar window completeness; skip if incomplete; else compute and write; return count written |
| `compute_outcome` | `(prediction: dict, df: pd.DataFrame) -> dict` | Given a prediction dict and the full CSV DataFrame, extract 72-bar window from `query_ts`; compute high_hit, low_hit, MAE, RMSE, actual_high, actual_low; return dict matching `FIRESTORE_ACTUAL_FIELDS` shape |
| `compute_backtest_summary` | `(client, today: date) -> dict | None` | Read all `actuals` docs in last 30 calendar days from Firestore; join with `predictions` for trend field; return dict matching `FIRESTORE_BACKTEST_SUMMARY_FIELDS`; return `None` if zero completed pairs |
| `write_summary` | `(client, date_str: str, summary: dict) -> None` | Write summary dict to `backtest_summaries/{date_str}` using Firestore `set()`; retry once after 5s on failure |

### 4.1 Detailed notes per function

**`main()` flow:**
1. Parse `--csv-path` env var (default: `history_database/Binance_ETHUSDT_1h.csv` relative to repo root).
2. CSV freshness gate: `mtime` of CSV file must be ≤ 90 minutes ago. If stale → `logger.warning("CSV stale: ..."); sys.exit(0)`.
3. `params = load_active_params()` (already handles fallback internally).
4. `predictor.params = params` — module-level assignment per AC-080-PARAM-LOADING.
5. Log `params_hash[:12]` to stdout.
6. `df = load_csv_history(path)`.
7. Compute `anchor_ts` = yesterday's 23:00 UTC (i.e., `datetime.utcnow().replace(hour=23, minute=0, second=0, microsecond=0) - timedelta(days=1)`).
8. `query_df = build_query_window(df, anchor_ts)`.
9. `prediction = run_prediction(query_df, params, df)`.
10. `ts = anchor_ts.strftime("%Y-%m-%d-%H")` → e.g. `"2026-05-01-23"`.
11. `write_prediction(client, ts, prediction)` — `params_hash` is already embedded in `prediction` dict by `run_prediction()`.
12. `cutoff_ts = datetime.utcnow() - timedelta(hours=72)`.
13. `backfill_actuals(client, df, cutoff_ts)`.
14. `summary = compute_backtest_summary(client, date.today())`.
15. If `summary is not None`: `write_summary(client, date.today().isoformat(), summary)`.
16. Else: log "no completed pairs for summary window".
17. Print summary to stdout.

**`run_prediction()` — `full_df` parameter:**
The function needs the full 1H history (not just the 24-bar window) to pass as `history` and `ma_history` to `find_top_matches()`. `query_df` provides the `input_bars` argument; `full_df` provides the history context. The function converts `full_df` rows to `List[OHLCBar]` for the `history` arg, and derives a 1D DataFrame for `ma_history` by resampling.

**`backfill_actuals()` — idempotency:**
This function always overwrites existing `actuals` docs (consistent with AC-080-IDEMPOTENT overwrite-semantics ruling). It does not check whether an `actuals` doc already exists — re-running produces the same result (CSV-deterministic computation).

**`compute_outcome()` — 72-bar window completeness:**
A prediction at `query_ts` needs bars `query_ts + 1H` through `query_ts + 72H` inclusive. If `df` does not contain all 72 bars (i.e., the window extends beyond the last CSV row), the function returns `None`. The caller (`backfill_actuals`) skips `None` results with a log message — not an error.

**Firestore client initialization:**
`main()` creates the Admin SDK client once: `import google.cloud.firestore; client = google.cloud.firestore.Client()`. The service account is resolved from the `GOOGLE_APPLICATION_CREDENTIALS` env var (set in the GHA workflow from `GCP_SA_KEY` secret).

---

## 5 GHA Workflow — .github/workflows/daily-predict.yml

Skeleton (pseudo-YAML; Engineer writes actual YAML from this spec):

```
name: Daily Predict

on:
  schedule:
    - cron: "0 4 * * *"      # 04:00 UTC daily (after scrape-history.yml at 03:00)
  workflow_dispatch:           # manual trigger for testing / backfill

jobs:
  predict:
    runs-on: ubuntu-latest
    permissions:
      contents: read           # checkout only; no push
      id-token: write          # optional: OIDC if switching from SA key to workload identity

    env:
      GOOGLE_APPLICATION_CREDENTIALS: /tmp/gcp-sa.json
      CSV_PATH: history_database/Binance_ETHUSDT_1h.csv

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install dependencies
        run: pip install -r backend/requirements.txt

      - name: Write GCP service account key
        run: echo '${{ secrets.GCP_SA_KEY }}' > /tmp/gcp-sa.json

      - name: Run daily predict
        run: python scripts/daily_predict.py

      - name: Cleanup SA key
        if: always()
        run: rm -f /tmp/gcp-sa.json
```

**Failure handling contract:**
- Script exits 0 on CSV freshness skip — GHA job shows green (expected cron drift, not a regression).
- Script exits non-zero on Firestore permanent failure (both retry attempts exhausted) — GHA job shows red; GitHub sends failure email to repo owners.
- No retry loop inside the workflow. Retry is inside the script (once, 5s wait per AC-080-FIRESTORE-FAILURE).
- The `Cleanup SA key` step runs on `if: always()` to prevent key leakage on script failure.

**Secret requirement:** `GCP_SA_KEY` must be a JSON string of a GCP service account key with `roles/datastore.user` (established in `ssot/deploy.md` by K-078). This secret is NOT set yet — first run will fail at the "Write GCP service account key" step until deploy is complete. This is a Known Gap (not a release blocker).

**Python version:** `3.12` (one minor ahead of Cloud Run `3.11` — use `3.11` if compatibility issues arise; `3.12` is preferred to match latest security patches). If either fails: downgrade to `3.11` matching `scrape-history.yml`.

---

## 6 Idempotency Strategy

### Decision: doc ID = `predictions/{YYYY-MM-DD-HH}` with overwrite semantics

Re-run behavior by scenario:

| Scenario | Behavior |
|---|---|
| Same hour, same params | `set()` overwrites with identical data — doc count unchanged |
| Same hour, different params (re-optimize mid-day) | `set()` overwrites with new `params_hash` — last writer wins |
| Different hour (rare: cron drift to 05:00 UTC) | `build_query_window` still anchors to yesterday 23:00 UTC — same `ts`, same doc — overwrite |
| Manual `workflow_dispatch` on a different day | `ts` = yesterday's 23:00 UTC of dispatch day — creates new doc for that day |

**Trade-off vs versioned-doc approach:**
- Versioned approach: `predictions/{ts}/{run_id}` — preserves all runs, allows audit.
- Selected approach: single doc per hour — simpler; K-082 optimizer reads one doc per hour, not N.
- K-082 (weekly optimizer) reads `predictions/*` as a flat collection. Multiple docs per hour would require deduplication logic in K-082. Overwrite eliminates that complexity.

**Ruling:** overwrite (last-writer-wins) is the correct semantic for K-080. The optimizer wants the most recent prediction per time slot, not a history of attempts.

---

## 7 Outcome Computation

### 7.1 high_hit

```
high_hit: bool
  = any(bar.high >= prediction.projected_high
        for bar in csv_bars[query_ts + 1H : query_ts + 72H inclusive])
```

Uses the stored `projected_high` float from the prediction doc.

### 7.2 low_hit

```
low_hit: bool
  = any(bar.low <= prediction.projected_low
        for bar in csv_bars[query_ts + 1H : query_ts + 72H inclusive])
```

Uses the stored `projected_low` float from the prediction doc.

### 7.3 MAE and RMSE

As established in §3.2: simplified single-scalar projection.

```
projected_path = [projected_median] * 72          # flat baseline
actual_path    = [bar.close for bar in 72_bars]    # 72 × 1H close values

mae  = mean(|projected_path[i] - actual_path[i]| for i in 0..71)
rmse = sqrt(mean((projected_path[i] - actual_path[i])^2 for i in 0..71))
```

Engineer must use `math.sqrt` and `statistics.mean` (stdlib only — no numpy dependency in `daily_predict.py`).

### 7.4 72-bar window completeness edge case

- **Condition:** `len(actual_path) < 72` — CSV does not yet have all 72 bars after `query_ts`.
- **Action:** `compute_outcome()` returns `None`.
- **Caller (`backfill_actuals`):** logs `"window not complete yet for {ts} — skipping"` and increments a skip counter; does NOT write an `actuals` doc; does NOT count as an error.
- **This is the only skip condition.** There is no "partial write" path (no `complete: false` field). A doc is either written fully or not written at all. This prevents K-082 from reading partial metrics as complete.

### 7.5 Zero-match edge case

`find_top_matches()` raises `ValueError("No historical matches found...")` when 0 matches exist.

- `run_prediction()` catches this exception.
- Writes prediction doc with `top_k_count: 0`, `projected_high: null`, `projected_low: null`, `projected_median: null`, `trend: "unknown"`.
- `backfill_actuals()` skips any prediction with `projected_high is None` (cannot compute high_hit without a projection).
- Log line: `"zero matches for {ts} — prediction written with top_k_count=0"`.

Boundary pre-emption: `projected_high`, `projected_low`, `projected_median` fields must be declared as `Optional[float]` (nullable) in `FIRESTORE_PREDICTION_FIELDS` semantics. The frozenset carries field names only; nullability is documented here.

---

## 8 Test Plan — backend/tests/test_daily_predict.py

### 8.1 Test list (mandatory — covers AC-080-TESTS items 1–6)

| Test ID | AC coverage | Description |
|---|---|---|
| `test_prediction_write_field_set` | AC-080-TESTS item 1 | Mock Firestore client; call `write_prediction(client, ts, prediction)` (`params_hash` pre-embedded in `prediction` dict); assert `client.set()` was called with a dict whose keys == `FIRESTORE_PREDICTION_FIELDS`; assert `params_hash` value present |
| `test_compute_outcome_high_hit_true` | AC-080-TESTS item 2 | Fixture: prediction with `projected_high=2000.0`; actual CSV window has bar with `high=2001.0`; assert `high_hit == True` |
| `test_compute_outcome_low_hit_false` | AC-080-TESTS item 2 | Fixture: prediction with `projected_low=1800.0`; actual CSV window has all bars with `low >= 1900.0`; assert `low_hit == False` |
| `test_compute_outcome_mae_rmse` | AC-080-TESTS item 2 | Fixture: `projected_median=2000.0`, 72-bar close all at 2100.0; assert `mae == 100.0`, `rmse == 100.0` (exact, no float tolerance needed for uniform deviation) |
| `test_backtest_summary_aggregation` | AC-080-TESTS item 3 | 3 completed pairs: 2 high_hit=True, 1 high_hit=False; assert `hit_rate_high == pytest.approx(2/3)`, `sample_size == 3`, `per_trend` keys present |
| `test_idempotent_overwrite_same_hour` | AC-080-TESTS item 4 | Call `write_prediction` twice with same `ts`; mock `set()` call count == 2 (no guard skips second write); assert no exception raised |
| `test_firestore_transient_failure_retry_succeed` | AC-080-TESTS item 5 | Mock `set()` raises on first call, succeeds on second; assert `set()` called twice; assert no exception propagates |
| `test_firestore_permanent_failure_exits_nonzero` | AC-080-TESTS item 6 | Mock `set()` raises on both calls; assert `SystemExit` raised with non-zero code (or `sys.exit` called with non-zero) |

**Minimum count:** 8 tests listed above satisfies `≥ 6` requirement with 2 additional high-value tests.

### 8.2 Mock pattern

```python
# Canonical mock setup (one client fixture reused across all tests)
from unittest.mock import MagicMock, patch, call

@pytest.fixture
def mock_client():
    client = MagicMock()
    doc_ref = MagicMock()
    client.collection.return_value.document.return_value = doc_ref
    return client, doc_ref
```

All tests use `mock_client` fixture. No live Firestore calls in unit tests.

### 8.3 Canonical test fixture

Use existing `backend/tests/fixtures/ETHUSDT-1h-2026-04-07-original.csv` as the source CSV. Tests that need 30+ days of bars should load this fixture and slice programmatically:

```python
import pandas as pd
from pathlib import Path

FIXTURE_CSV = Path(__file__).parent / "fixtures" / "ETHUSDT-1h-2026-04-07-original.csv"

@pytest.fixture
def sample_df():
    df = pd.read_csv(FIXTURE_CSV)
    # normalize columns to [open, high, low, close, time]
    return df
```

Tests constructing prediction/actual dicts must derive anchor timestamps and price values from this fixture rather than synthetic constants, per AC-080-TESTS requirement.

### 8.4 Cross-ticket contract test — backend/tests/test_firestore_config.py addition

Add ONE test to the existing `test_firestore_config.py` (do not create a new file):

```python
def test_prediction_frozenset_contract():
    from firestore_config import (
        FIRESTORE_PREDICTION_FIELDS,
        FIRESTORE_ACTUAL_FIELDS,
        FIRESTORE_BACKTEST_SUMMARY_FIELDS,
    )
    assert FIRESTORE_PREDICTION_FIELDS == frozenset({
        "params_hash", "projected_high", "projected_low", "projected_median",
        "top_k_count", "trend", "query_ts", "created_at",
    })
    assert FIRESTORE_ACTUAL_FIELDS == frozenset({
        "high_hit", "low_hit", "mae", "rmse",
        "actual_high", "actual_low", "computed_at",
    })
    assert FIRESTORE_BACKTEST_SUMMARY_FIELDS == frozenset({
        "hit_rate_high", "hit_rate_low", "avg_mae", "avg_rmse",
        "sample_size", "per_trend", "window_days", "computed_at",
    })
```

This test catches any silent field rename in future refactors.

---

## 9 File Change List

| File | Action | Responsibility |
|---|---|---|
| `backend/firestore_config.py` | MODIFY | Add `FIRESTORE_PREDICTION_FIELDS`, `FIRESTORE_ACTUAL_FIELDS`, `FIRESTORE_BACKTEST_SUMMARY_FIELDS` frozensets; add `write_prediction`, `write_actual`, `write_summary`, `list_predictions_older_than` writer helpers; add all 7 new names to `__all__` |
| `scripts/daily_predict.py` | CREATE | Entry script (~200 lines): orchestrator + 8 helper functions per §4 |
| `backend/tests/test_daily_predict.py` | CREATE | 8 unit tests per §8.1; mock Firestore client; uses fixture CSV |
| `backend/tests/test_firestore_config.py` | MODIFY | Add `test_prediction_frozenset_contract` per §8.4 |
| `.github/workflows/daily-predict.yml` | CREATE | Cron 04:00 UTC; `workflow_dispatch`; GCP auth; runs `daily_predict.py` |
| `ssot/system-overview.md` | MODIFY | Add daily workflow box to architecture section per AC-080-DOCS-UPDATE |
| `ssot/deploy.md` | MODIFY | Add `workflow_dispatch` verification step for daily-predict.yml per AC-080-DOCS-UPDATE |

**Read-only (zero diffs):**
- `backend/predictor.py` — verified by AC-080-NO-PREDICTOR-MUTATION (`git diff origin/main backend/predictor.py` must be empty)

---

## 10 Implementation Order

**Step 1 — Extend `backend/firestore_config.py`**

Add 3 frozensets + 4 writer helpers. The writer helpers are:
- `write_prediction(client, ts: str, data: dict) -> None` — `set()` with retry-once
- `write_actual(client, ts: str, data: dict) -> None` — `set()` with retry-once
- `write_summary(client, date_str: str, data: dict) -> None` — `set()` with retry-once
- `list_predictions_older_than(client, cutoff_ts: datetime) -> list[dict]` — query `predictions` collection where `query_ts < cutoff_ts`

Add all 7 new symbols to `__all__`. Run `python -m py_compile backend/firestore_config.py`. Run `pytest backend/tests/test_firestore_config.py` (existing tests must still pass).

**Step 2 — Write `scripts/daily_predict.py`**

Implement all 8 helper functions + `main()` per §4. Run `python3 -m py_compile scripts/daily_predict.py`. At this point the script is not runnable (no live Firestore), but must compile cleanly.

**Step 3 — Write `backend/tests/test_daily_predict.py`**

All 8 tests per §8.1. Run `pytest backend/tests/test_daily_predict.py -v`. Must show ≥ 8 PASSED, 0 FAILED. All tests use mock client.

**Step 4 — Add contract test to `backend/tests/test_firestore_config.py`**

Add `test_prediction_frozenset_contract` per §8.4. Run `pytest backend/tests/test_firestore_config.py -v` — must pass including new test.

**Step 5 — Write `.github/workflows/daily-predict.yml`**

Per §5 skeleton. Verify YAML syntax: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/daily-predict.yml'))"`.

**Step 6 — Full test suite**

Run `pytest backend/tests/ -v`. All tests must pass including AC-080-SACRED-FLOOR-INTACT (`test_predict_real_csv_integration.py`). Record canonical pass count (must be ≥ 6 for `test_daily_predict.py` alone).

**Step 7 — py_compile gate**

`python3 -m py_compile scripts/daily_predict.py` — must produce zero output (no SyntaxError).

**Step 8 — Update docs**

Edit `ssot/system-overview.md` + `ssot/deploy.md` per AC-080-DOCS-UPDATE.

**Step 9 — Verify AC-080-NO-PREDICTOR-MUTATION**

`git diff origin/main backend/predictor.py` must print zero lines.

**Step 10 — `workflow_dispatch` dry-run**

Deferred to post-merge deploy step. This is a Known Gap (secret not yet set). Document in `ssot/deploy.md` as a verification step, not a pre-merge gate.

---

## 11 Boundary Pre-emption Table

| Boundary scenario | Defined? | Contract |
|---|---|---|
| CSV stale (>90 min mtime) | YES | Log warning, `sys.exit(0)` — graceful skip |
| Firestore `predictor_params/active` unavailable | YES | `load_active_params()` fallback to `DEFAULT_PARAMS` (K-078 contract) |
| `find_top_matches` returns 0 matches | YES | Write prediction with `top_k_count=0`, nulls for price fields; skip backfill for this doc |
| 72-bar window incomplete in CSV | YES | Skip backfill for that prediction; log "window not complete yet"; not an error |
| Firestore write transient failure | YES | Retry once after 5s; succeed on second → no error propagated |
| Firestore write permanent failure (both attempts fail) | YES | Log error, `sys.exit(1)` — GHA job fails red |
| Same-hour re-run (idempotency) | YES | `set()` overwrite — doc count unchanged, no exception |
| `query_ts` day boundary ambiguity (UTC) | YES | Anchor always `yesterday's 23:00 UTC` computed from `datetime.utcnow()` at script start; not from clock at Firestore write time |
| `GCP_SA_KEY` secret not set | KNOWN GAP | Workflow fails at auth step; first successful run is post-deploy gate (not pre-merge blocker) |
| Clock skew between GHA runner and Binance | YES | Anchor on yesterday's last bar by date arithmetic, not `now()` |
| `projected_high / low / median` null (0-match case) | YES | Backfill skips docs with null price fields; summary excludes them from hit_rate computation |

---

## 12 Refactorability Checklist

- [x] **Single responsibility:** `firestore_config.py` owns Firestore I/O; `daily_predict.py` owns orchestration; `predictor.py` owns prediction logic (untouched).
- [x] **Interface minimization:** each helper function takes only the parameters it uses; `run_prediction()` receives `params` explicitly (not reads from module state mid-function).
- [x] **Unidirectional dependency:** `daily_predict.py` → `firestore_config.py` → Firestore SDK. `daily_predict.py` → `predictor` (read-only). No circular deps.
- [x] **Replacement cost:** if Firestore is swapped for a different store, only `firestore_config.py` writer helpers change. `daily_predict.py` is unaffected (calls writer helpers by name).
- [x] **Clear test entry point:** each helper function has explicit input/output; `mock_client` fixture replaces all I/O at the boundary.
- [x] **Change isolation:** GHA workflow YAML change does not affect `daily_predict.py` logic; schema frozenset changes are caught by `test_prediction_frozenset_contract` before downstream K-081/K-082 breakage.

---

## 13 All-Phase Coverage Gate

| Phase | Backend API | File Change List | Component Tree / Function Layout | Props / Frozenset Interface |
|---|---|---|---|---|
| 1 (K-080) | N/A — no new HTTP endpoints; Firestore doc paths defined in §3 | YES — §9 | YES — §4 (8 functions + signatures) | YES — §3 (3 frozensets with field types + semantics) |

N/A for Backend API: K-080 is a batch script, not an HTTP service. Firestore doc paths serve as the API surface.

---

## 14 Risks and Mitigations

**Risk 1: `GCP_SA_KEY` secret not configured at merge time.**
Mitigation: workflow fails at the auth step with a clear error. First successful run is the post-deploy verification gate documented in `ssot/deploy.md`. This is expected behavior, not a regression. No code change needed.

**Risk 2: `find_top_matches()` returns 0 matches on days with unusual market conditions.**
Mitigation: zero-match case is handled per §7.5 — prediction doc written with `top_k_count=0` and null price fields; backfill skips it; summary excludes it. GHA job exits 0 (not a failure). Log line makes the condition visible.

**Risk 3: Clock skew between GHA runner and CSV content.**
Mitigation: anchor is computed by date arithmetic (`datetime.utcnow() - timedelta(days=1)` at 23:00 UTC), not by reading `now()` and looking for the most recent bar. If the CSV is fresh (within 90-min freshness gate), the 23:00 bar for yesterday must exist.

**Risk 4: `backfill_actuals` scans the full `predictions` collection on every run.**
Mitigation: K-080 scope is limited to 30-day summary window; the predictions collection will grow at 1 doc/day. After 1 year = 365 docs. Firestore query `where("query_ts", "<", cutoff_ts)` with a server-side filter is efficient at this scale. If collection exceeds 10,000 docs (>27 years), add pagination — out of K-080 scope.

**Risk 5: `per_trend` sub-keys missing from summary doc when a trend has zero samples.**
Mitigation: specified in §3.3 — sub-keys are only written when `sample_size > 0`. K-081 (frontend) must handle missing trend keys gracefully (do not assume all three keys are always present). Document this as a contract note in `ssot/system-overview.md`.

---

## 15 Consolidated Delivery Gate

```
Architect delivery gate (K-080):
  all-phase-coverage=✓,
  pencil-frame-completeness=N/A (no .pen file; backend-only + GHA workflow),
  visual-spec-json-consumption=N/A (visual-delta: none per ticket frontmatter),
  sacred-ac-cross-check=N/A (no JSX restructure; AC-080-SACRED-FLOOR-INTACT preserves existing test),
  route-impact-table=N/A (no global CSS / sitewide token change),
  cross-page-duplicate-audit=✓ (grepped "write_prediction\|backfill_actuals" in frontend/src — 0 hits; backend-only script),
  target-route-consumer-scan=N/A (no route navigation behavior changed),
  architecture-doc-sync=✓ (ssot/system-overview.md update listed in §9 File Change List),
  self-diff=✓ (frozenset field table §3 matches AC-080-SCHEMA-CONTRACT-EXPORTED minimum sets; §4 function layout has 8 rows),
  output-language=✓
  → OK
```

---

## Retrospective

**Where most time was spent:** Determining the MAE/RMSE computation strategy — specifically whether to store a per-bar projected path in the prediction doc (K-082 concern) vs use a simplified single-scalar baseline for K-080. Ruling: single-scalar is correct for K-080 scope; per-bar path is K-082 territory.

**Which decisions needed revision:** Initial plan did not specify that `run_prediction()` needs the `full_df` parameter (not just `query_df`) to pass history context to `find_top_matches()`. Caught during function signature design — fixed before delivery.

**Next time improvement:** When designing a script that calls an existing function with multiple history arguments (`history`, `ma_history`, `history_1d`), read the full function signature at design time (not just the name) before specifying wrapper signatures. This prevents the signature mismatch from being discovered by Engineer.
