---
ticket: K-078
title: Firestore Plumbing + Backend Predictor-Param Loader
phase: 1
status: ready-for-engineer
visual-spec: N/A — reason: backend-only + infra; no UI change
created: 2026-05-02
author: senior-architect
---

## 0 Scope Clarifications

No open scope questions. All QA blockers resolved in ticket §QA Early Consultation.
PM-authorized sacred-test mutation documented in §7.

---

## 1 Option Analysis

Three implementation approaches evaluated before settling on design.

### Option A — Conservative: module-level mutable vars (no dataclass)

Swap each constant individually at boot:
`predictor.MA_TREND_WINDOW_DAYS = loaded_val` etc.

- **Applicable when:** minimal diff, no dataclass ceremony wanted.
- **Trade-off:** three separate assignments = not GIL-atomic as a group. Race window between assignment 1 and 3 if a concurrent `/predict` request reads half-updated state. Fails QA Challenge #3 ruling.

### Option B — Progressive: inject `ParamSnapshot` as function argument

Pass `params: ParamSnapshot` as explicit arg to every call site in `find_top_matches`, `_classify_trend_by_pearson`, `_fetch_30d_ma_series`.

- **Applicable when:** purely functional style, no module-level state.
- **Trade-off:** changes public signatures of `_classify_trend_by_pearson`, `find_top_matches` — violates the constraint that public signatures must not change. Also requires modifying `main.py` every callsite.

### Option C — Middle ground: single-namespace module attribute (SELECTED)

One module-level `predictor.params: ParamSnapshot` attribute. Boot does one atomic reassignment: `predictor.params = load_active_params()`. All internal reads use `predictor.params.*`. Public signatures of `find_top_matches`, `compute_stats`, `_classify_trend_by_pearson` unchanged.

- **Applicable when:** GIL-atomic swap needed; public API stability required; minimal callsite churn.
- **Trade-off:** module-level mutable state (acceptable: single write at boot, then read-only during request lifetime). Chosen per QA Challenge #3 ruling.

**Recommendation: Option C.** Satisfies GIL-atomic constraint, preserves all public signatures, and keeps `firestore_config.py` cleanly isolated.

---

## 2 Component Decomposition

### 2.1 New file: `backend/firestore_config.py`

Single responsibility: define `ParamSnapshot` dataclass + `load_active_params()` loader.

**Does NOT import from `predictor.py`** — no circular dependency.

`ParamSnapshot` dataclass (exact shape):

```
@dataclass
class ParamSnapshot:
    ma_trend_window_days: int
    ma_trend_pearson_threshold: float
    top_k_matches: int
    params_hash: str          # sha256 hex of canonical tuple, 12-char prefix used in /health
    optimized_at: str | None  # ISO8601 or None
    source: Literal["firestore", "default"]
```

Canonical hash function (must be deterministic across Python restarts):

```
def _compute_params_hash(window: int, pearson: float, top_k: int) -> str:
    raw = f"{window}:{pearson:.6f}:{top_k}"
    return hashlib.sha256(raw.encode()).hexdigest()
```

Note: `pearson` formatted to 6 decimal places to avoid float repr instability across platforms.

Default snapshot constant (module-level, computed once):

```
DEFAULT_PARAMS = ParamSnapshot(
    ma_trend_window_days=30,
    ma_trend_pearson_threshold=0.4,
    top_k_matches=10,
    params_hash=_compute_params_hash(30, 0.4, 10),
    optimized_at=None,
    source="default",
)
```

`load_active_params(timeout_seconds: float = 5.0) -> ParamSnapshot` contract:

- Wraps synchronous Firestore SDK call in `concurrent.futures.ThreadPoolExecutor(max_workers=1)`; calls `future.result(timeout=timeout_seconds)`.
- On success: builds `ParamSnapshot` from Firestore doc fields `window_days`, `pearson_threshold`, `top_k`, `optimized_at`; sets `source="firestore"`; computes hash from loaded values.
- On `TimeoutError`, `google.cloud.exceptions.NotFound`, any SDK exception, or `ImportError` on `google.cloud.firestore`: returns `DEFAULT_PARAMS` with a single `logger.warning(...)` carrying the failure cause.
- Top-level `import google.cloud.firestore` wrapped in `try/except ImportError` so the module is always importable even without the wheel.
- The function never returns `None`.

Firestore document path: `predictor_params/active`.

Expected Firestore document fields:

| Firestore field | Type | Maps to ParamSnapshot field |
|---|---|---|
| `window_days` | integer | `ma_trend_window_days` |
| `pearson_threshold` | float | `ma_trend_pearson_threshold` |
| `top_k` | integer | `top_k_matches` |
| `optimized_at` | string (ISO8601) or null | `optimized_at` |

### 2.2 Modified file: `backend/predictor.py`

Three targeted edits; no signature changes on public functions.

**Edit 1 — Add module-level `params` attribute (after existing constants, ~line 13):**

```
# K-078: single-namespace param object; default preserves byte-identical behavior.
# Replaced atomically at boot via main.py startup hook.
from firestore_config import DEFAULT_PARAMS, ParamSnapshot  # noqa: E402
params: ParamSnapshot = DEFAULT_PARAMS
```

**Edit 2 — `_classify_trend_by_pearson` (~line 210): replace inline constant reads:**

Replace:
- `if r >= MA_TREND_PEARSON_THRESHOLD:` → `if r >= params.ma_trend_pearson_threshold:`
- `if r <= -MA_TREND_PEARSON_THRESHOLD:` → `if r <= -params.ma_trend_pearson_threshold:`

**Edit 3 — `_fetch_30d_ma_series` (~lines 147, 156, 335): replace inline constant reads:**

- Line 147: `window_start = max(0, window_end - MA_TREND_WINDOW_DAYS)` → `window_start = max(0, window_end - params.ma_trend_window_days)`
- Line 156: `if len(combined_closes) < MA_TREND_WINDOW_DAYS + MA_WINDOW:` → `if len(combined_closes) < params.ma_trend_window_days + MA_WINDOW:`
- Line 335: `f"ma_history requires at least {MA_TREND_WINDOW_DAYS + MA_WINDOW} daily bars ending at that date."` → `f"ma_history requires at least {params.ma_trend_window_days + MA_WINDOW} daily bars ending at that date."`

**Edit 4 — `find_top_matches` line 363:**

`top = results[:10]` → `top = results[:params.top_k_matches]`

**Keep untouched:** `MA_TREND_WINDOW_DAYS`, `MA_TREND_PEARSON_THRESHOLD` module-level constants remain as declarations (they become the seed values used by `DEFAULT_PARAMS` in `firestore_config.py`). They are no longer read by runtime logic but must remain importable because `test_predict_real_csv_integration.py` imports them directly (until sacred-test rewrite lands in step 5 below). After the sacred-test rewrite those imports are removed.

**Boundary check — byte-identical behavior gate:** When `predictor.params` is `DEFAULT_PARAMS` (the module-load default), every constant value is identical to the prior hard-coded value: window=30, pearson=0.4, top_k=10. The 129-bar floor remains `30 + 99 = 129`. The `SACRED_VALUE_ERROR_SUBSTRING` in `test_predict_real_csv_integration.py` reads `"ma_history requires at least 129 daily bars"` — after Edit 3 line 335, the formatted string with default params still produces that exact substring. No behavioral change when Firestore is absent.

### 2.3 Modified file: `backend/main.py`

Add one startup hook after app initialization and before route definitions. FastAPI does not have a mandatory `on_startup` callback requirement — a module-level import-time side effect is acceptable here because `predictor.params` is being set before the first request. The hook placement must be after `app = FastAPI()` and before any route that calls `predictor.*`.

Add the following block (after `app.include_router(...)`, before first route):

```
# K-078: load active predictor params from Firestore at boot.
# Single atomic swap; fallback to DEFAULT_PARAMS on any error (warning emitted by loader).
import predictor as _predictor
from firestore_config import load_active_params as _load_active_params
_predictor.params = _load_active_params()
```

Add `/health` endpoint (before SPA fallback route at the bottom, since SPA fallback must remain last):

```
@app.get("/api/health")
def health():
    snap = predictor.params
    return JSONResponse({
        "status": "ok",
        "params_source": snap.source,
        "params_hash": snap.params_hash[:12],
        "optimized_at": snap.optimized_at,
        "active_params": {
            "ma_trend_window_days": snap.ma_trend_window_days,
            "ma_trend_pearson_threshold": snap.ma_trend_pearson_threshold,
            "top_k_matches": snap.top_k_matches,
        },
    })
```

Response is built from `ParamSnapshot` fields only (allow-list). `JSONResponse` from `fastapi.responses` is already imported; verify import exists, add if missing.

**Endpoint registration:** `/api/health` (note `/api/` prefix consistent with K-Line convention — all backend routes under `/api/`). This is distinct from a bare `/health`; the Firebase Hosting rewrite forwards `/api/**` to Cloud Run, so the health check is accessible externally as `/api/health`.

**No-op on success path:** no log statement on successful Firestore load (per K-Line "no log noise" convention). Warning already emitted by loader on fallback.

### 2.4 New file: `firestore.rules`

Checked into repo root. Content:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read for all collections used by the self-tuning epic.
    match /predictions/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    match /actuals/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    match /backtest_summaries/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    match /predictor_params/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    match /optimize_runs/{document=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

Write is denied for all clients. Only the Admin SDK (used from Cloud Run runtime SA and GHA service account) bypasses client-facing rules — this is standard Firestore Admin SDK behavior; no separate rule needed.

### 2.5 Modified file: `firebase.json`

Add `firestore` key alongside the existing `hosting` key:

```json
"firestore": {
  "rules": "firestore.rules"
}
```

---

## 3 Boot Sequence Diagram

```
Cloud Run container start
  │
  ├─ Python module imports (synchronous)
  │   ├─ import predictor          → params = DEFAULT_PARAMS (window=30, pearson=0.4, top_k=10)
  │   └─ import firestore_config   → try/except ImportError on google.cloud.firestore
  │
  ├─ app = FastAPI()
  ├─ app.include_router(auth_router)
  │
  ├─ _predictor.params = _load_active_params()     ← atomic swap
  │   │
  │   ├─ ThreadPoolExecutor(max_workers=1)
  │   │   └─ future = executor.submit(_read_firestore_doc)
  │   │       └─ db.collection("predictor_params").document("active").get()
  │   │
  │   ├─ future.result(timeout=5.0)
  │   │
  │   ├─ [SUCCESS path]
  │   │   └─ returns ParamSnapshot(source="firestore", ...)
  │   │
  │   └─ [FAILURE paths — any of:]
  │       ├─ TimeoutError (gRPC > 5s)     → logger.warning(...); return DEFAULT_PARAMS
  │       ├─ google.cloud.exceptions.*    → logger.warning(...); return DEFAULT_PARAMS
  │       ├─ google.api_core.exceptions.* → logger.warning(...); return DEFAULT_PARAMS
  │       └─ ImportError on SDK           → logger.warning(...); return DEFAULT_PARAMS
  │
  ├─ Route registrations (@app.get, @app.post, ...)
  │   └─ /api/health reads predictor.params (cached; no Firestore call per request)
  │
  └─ uvicorn begins serving requests
     └─ /predict, /health all read predictor.params (read-only after boot)
```

**Timing budget:** ThreadPoolExecutor overhead ~1ms. gRPC connect timeout 5.0s wall-clock. Cloud Run cold-start P50 ≈ 1-2s; 5s Firestore budget fits within the 10s Cloud Run startup probe window.

**Concurrency safety:** After the atomic `_predictor.params = <new snapshot>` assignment, the Python GIL guarantees all subsequent reads see either the old or new object atomically — never a torn value. No intermediate state is observable.

---

## 4 File Change List

| File | Action | Responsibility |
|---|---|---|
| `backend/firestore_config.py` | CREATE | `ParamSnapshot` dataclass + `DEFAULT_PARAMS` constant + `load_active_params()` loader |
| `backend/predictor.py` | MODIFY (4 hunks) | Add `params` module attr; replace 5 inline constant reads (lines 147, 156, 210, 212, 335, 363) |
| `backend/main.py` | MODIFY (2 insertions) | Boot param swap + `/api/health` endpoint |
| `backend/requirements.txt` | MODIFY (1 line) | Add `google-cloud-firestore>=2.16,<3.0` |
| `backend/tests/test_predict_real_csv_integration.py` | MODIFY | Replace `test_min_daily_bars_constant_is_imported_not_magic` with two-layer sacred pair |
| `backend/tests/test_firestore_config.py` | CREATE | Unit + integration tests for `firestore_config.py` |
| `backend/tests/test_health_endpoint.py` | CREATE | `/api/health` exact-key-set tests |
| `firestore.rules` | CREATE | Security rules (read-public, write-deny) |
| `firebase.json` | MODIFY | Add `"firestore": {"rules": "firestore.rules"}` key |
| `ssot/system-overview.md` | MODIFY | New "Firestore config layer" section |
| `ssot/deploy.md` | MODIFY | IAM grant + `firebase deploy --only firestore:rules` step |

---

## 5 Sacred Test Rewrite Plan (AC-078-SACRED-TEST-2-LAYER-REWRITE)

### 5.1 What is being replaced

File: `backend/tests/test_predict_real_csv_integration.py`
Function: `test_min_daily_bars_constant_is_imported_not_magic` (lines 166–195)

This test hard-asserts `MA_TREND_WINDOW_DAYS == 30`. After K-078, `_classify_trend_by_pearson` and `_fetch_30d_ma_series` read `predictor.params.ma_trend_window_days` at runtime — the module-level constant is no longer the operative value. The hard-assert becomes a test of the wrong thing.

PM has authorized this replacement (ticket §QA Early Consultation, QA Challenge #1 resolution).

### 5.2 Layer 1 — Structure invariant (replace removed test with this)

Function name: `test_params_namespace_structure_invariant`

Assertions:
1. `predictor.params` is an instance of `ParamSnapshot`.
2. `predictor.params.ma_trend_window_days` is an `int`.
3. `predictor.params.ma_trend_pearson_threshold` is a `float`.
4. `predictor.params.top_k_matches` is an `int`.
5. AST walk of `backend/predictor.py` source: assert no numeric literal `30` appears as a bare expression in the bodies of `_classify_trend_by_pearson` or `_fetch_30d_ma_series`. Use `ast.parse` + `ast.walk` on the source text; filter `ast.Constant` nodes whose value is `30` or `0.4` or `10` inside those function bodies.

AST walk scope: only function bodies of `_classify_trend_by_pearson` and `_fetch_30d_ma_series` and `find_top_matches` — not the entire module (to avoid false positives on e.g. default arg `top_k: int = 10` in a different function).

Implementation note: `ast.parse(Path("backend/predictor.py").read_text())` returns a module AST; iterate `module.body` for `ast.FunctionDef` nodes with matching names; walk those subtrees.

### 5.3 Layer 2 — Behavior invariant (add alongside Layer 1)

Function name: `test_params_floor_recomputes_from_runtime_values`

Step A — default params path:
1. Save original: `original = predictor.params`
2. Set default: `predictor.params = DEFAULT_PARAMS`
3. Compute expected floor: `expected_floor = predictor.params.ma_trend_window_days + predictor.MA_WINDOW`
4. Assert `expected_floor == 129`.

Step B — custom params path:
1. Set: `predictor.params = ParamSnapshot(ma_trend_window_days=14, ma_trend_pearson_threshold=0.5, top_k_matches=5, params_hash="test", optimized_at=None, source="default")`
2. Compute: `custom_floor = predictor.params.ma_trend_window_days + predictor.MA_WINDOW`
3. Assert `custom_floor == 113` (14 + 99).
4. Assert `custom_floor != 129` (floor is not stuck at old default).

Step C — restore: `predictor.params = original` (use `try/finally` to guarantee restore even on assertion failure).

### 5.4 Import changes in test file

Remove: `from predictor import find_top_matches, MA_TREND_WINDOW_DAYS, MA_WINDOW`
Add: `from predictor import find_top_matches, MA_WINDOW`
Add: `import predictor`
Add: `from firestore_config import ParamSnapshot, DEFAULT_PARAMS`

The `MA_TREND_WINDOW_DAYS` import is removed because it is no longer the operative parameter post-K-078. `MA_WINDOW` (99) remains importable and unchanged — it is a structural constant, not a tunable.

**Existing tests that use `MIN_DAILY_BARS` and `SACRED_FLOOR`:** these are computed as `MA_TREND_WINDOW_DAYS + MA_WINDOW` at test module load time. After K-078, they must be computed as `DEFAULT_PARAMS.ma_trend_window_days + MA_WINDOW`. Update the two constant assignments at lines 36–37:

```
MIN_DAILY_BARS = DEFAULT_PARAMS.ma_trend_window_days + MA_WINDOW  # 30 + 99 = 129
SACRED_FLOOR = MIN_DAILY_BARS  # 129
```

This preserves the 129-bar truncation arithmetic in `test_truncated_db_raises_sacred_value_error` with no numeric change.

---

## 6 Test File Inventory

### 6.1 New file: `backend/tests/test_firestore_config.py`

Tests to implement:

| Test function | AC | Assertion |
|---|---|---|
| `test_load_active_params_success_mocked` | BOOT-PARAM-LOADER | Mock Firestore returns doc with window=14, pearson=0.5, top_k=5; assert result is `ParamSnapshot` with `source="firestore"` and correct values |
| `test_load_active_params_not_found` | BOOT-PARAM-LOADER | Mock raises `google.cloud.exceptions.NotFound`; assert returns `DEFAULT_PARAMS` with `source="default"` |
| `test_load_active_params_timeout` | BOOT-PARAM-LOADER | Patch SDK call with `time.sleep(10)`; set `timeout_seconds=0.5`; assert returns within 1.0s wall-clock; assert `source="default"` |
| `test_load_active_params_import_error` | BOOT-PARAM-LOADER | Patch `google.cloud.firestore` as unimportable (mock `ImportError` path); assert returns `DEFAULT_PARAMS` |
| `test_default_params_values` | PREDICTOR-CONSTANTS-EXPOSED | Assert `DEFAULT_PARAMS.ma_trend_window_days==30`, `pearson==0.4`, `top_k==10`, `source=="default"`, `optimized_at is None` |
| `test_params_hash_deterministic` | BOOT-PARAM-LOADER | Call `_compute_params_hash(30, 0.4, 10)` twice; assert identical; assert length >= 12 |

### 6.2 New file: `backend/tests/test_health_endpoint.py`

Tests to implement:

| Test function | AC | Assertion |
|---|---|---|
| `test_health_exact_key_set` | HEALTH-EXPOSES-PARAMS | TestClient GET `/api/health`; assert top-level keys exactly `{"status","params_source","params_hash","optimized_at","active_params"}` |
| `test_health_active_params_key_set` | HEALTH-EXPOSES-PARAMS | Assert `active_params` keys exactly `{"ma_trend_window_days","ma_trend_pearson_threshold","top_k_matches"}` |
| `test_health_default_source` | HEALTH-EXPOSES-PARAMS | With default params: `params_source == "default"`, `optimized_at is null` |
| `test_health_firestore_source` | HEALTH-EXPOSES-PARAMS | Swap `predictor.params` to a firestore snapshot; assert `params_source == "firestore"` |
| `test_health_under_100ms` | HEALTH-EXPOSES-PARAMS | Assert response time < 100ms (use `time.perf_counter` around TestClient call; no Firestore call on each request) |
| `test_health_no_raw_sdk_objects` | HEALTH-EXPOSES-PARAMS | Assert response JSON is fully serializable to `dict`; no nested non-primitive objects |

### 6.3 Modified file: `backend/tests/test_predict_real_csv_integration.py`

Changes documented in §5.

### 6.4 Existing file: `backend/tests/test_predictor.py`

No structural changes required. The existing parametrized tests call `find_top_matches` and `compute_stats` — these functions' behavior is byte-identical when `predictor.params == DEFAULT_PARAMS`. However, Engineer must verify no test in this file directly reads `MA_TREND_WINDOW_DAYS` or `MA_TREND_PEARSON_THRESHOLD` as a numeric assertion. If found, update to read from `DEFAULT_PARAMS` instead.

---

## 7 Boundary Pre-emption Table

| Boundary scenario | Defined? | Contract |
|---|---|---|
| Firestore doc missing (`predictor_params/active` does not exist) | YES | `NotFound` caught; returns `DEFAULT_PARAMS` with warning |
| Firestore unreachable / gRPC timeout > 5s | YES | `TimeoutError` from `future.result`; returns `DEFAULT_PARAMS` with warning |
| `google-cloud-firestore` wheel missing (bad deploy) | YES | `ImportError` caught at module level; returns `DEFAULT_PARAMS` with warning |
| Firestore doc has unexpected field types (e.g. `window_days` is a string) | PARTIAL | SDK returns raw value; `int(doc["window_days"])` cast in loader handles string integers; non-castable values fall through to the outer exception handler and return `DEFAULT_PARAMS` |
| Concurrent `/predict` requests during boot param swap | YES | GIL-atomic single-assignment; no torn state observable |
| `/health` called before boot hook completes | YES | Module-level `params = DEFAULT_PARAMS` is set at import time; `/health` always has a valid `ParamSnapshot` |
| `top_k_matches` loaded as 0 from Firestore | DEFINED as Known Gap | Loader should validate `top_k_matches >= 1`; if 0, fall back to `DEFAULT_PARAMS` and emit warning. Engineer must add this guard |
| `params_hash` 12-char truncation in `/health` | YES | `snap.params_hash[:12]` — full SHA256 stored in `ParamSnapshot`, truncated only in HTTP response |

---

## 8 Refactorability Checklist

- [x] **Single responsibility:** `firestore_config.py` owns only dataclass + loader. `predictor.py` owns only prediction logic. `main.py` owns only boot orchestration and HTTP routes.
- [x] **Interface minimization:** `ParamSnapshot` has exactly 6 fields; all required by downstream consumers (loader, health, sacred test, optimizer in K-081). No extra fields.
- [x] **Unidirectional dependency:** `main.py` → `firestore_config.py`; `predictor.py` → `firestore_config.py` (for `DEFAULT_PARAMS` import). `firestore_config.py` imports nothing from `predictor.py`. No circular dependency.
- [x] **Replacement cost:** if Firestore SDK is swapped for a different document store, only `firestore_config.py` changes. `predictor.py` and `main.py` are unaffected.
- [x] **Clear test entry point:** `load_active_params()` has single `ParamSnapshot` return; `DEFAULT_PARAMS` is a testable constant; `/api/health` has exact key-set contract.
- [x] **Change isolation:** UI changes do not affect this ticket (visual-delta: no). API contract for `/api/predict` and `/api/merge-and-compute-ma99` is unchanged. Only `/api/health` is new.

---

## 9 Implementation Order

**Step 1 — Create `backend/firestore_config.py`**
Define `ParamSnapshot` dataclass, `_compute_params_hash`, `DEFAULT_PARAMS`, and `load_active_params`. Run `python -m py_compile backend/firestore_config.py`. This file has no dependency on predictor.py; can be written first.

**Step 2 — Modify `backend/predictor.py`**
Add `from firestore_config import DEFAULT_PARAMS, ParamSnapshot` import and `params: ParamSnapshot = DEFAULT_PARAMS` attribute. Apply Edits 2–4 (replace 5 inline constant reads). Run `python -m py_compile backend/predictor.py`. Verify default behavior by running existing `pytest backend/tests/test_predictor.py` — must be fully green before proceeding.

**Step 3 — Modify `backend/main.py`**
Add boot hook (import predictor + atomic swap). Add `/api/health` endpoint. Run `python -m py_compile backend/main.py`. Note: the boot hook will call `load_active_params()` at import time in test environments — ensure test suite mocks Firestore before importing `main` in TestClient tests, or accept that `DEFAULT_PARAMS` is returned (correct fallback behavior).

**Step 4 — Add `backend/requirements.txt` pin**
Add `google-cloud-firestore>=2.16,<3.0`.

**Step 5 — Rewrite sacred test in `test_predict_real_csv_integration.py`**
Remove `test_min_daily_bars_constant_is_imported_not_magic`. Add Layer 1 (`test_params_namespace_structure_invariant`) and Layer 2 (`test_params_floor_recomputes_from_runtime_values`). Update `MIN_DAILY_BARS` and `SACRED_FLOOR` constant assignments per §5.4. Run full `pytest -q`; all must pass including `test_truncated_db_raises_sacred_value_error`.

**Step 6 — Create new test files**
Create `backend/tests/test_firestore_config.py` and `backend/tests/test_health_endpoint.py` per §6.1–6.2. Run `pytest -q`; full suite green.

**Step 7 — Infra files**
Create `firestore.rules`. Modify `firebase.json` to add `firestore` key. Update `backend/requirements.txt` if not done in step 4. Update `ssot/system-overview.md` and `ssot/deploy.md` per AC-078-DOCS-UPDATE.

---

## 10 All-Phase Coverage Gate

| Phase | Backend API | File Change List | Test File Inventory | Props/Dataclass Interface |
|---|---|---|---|---|
| 1 (K-078) | YES — `/api/health` defined in §2.3 | YES — §4 | YES — §6 | YES — `ParamSnapshot` in §2.1 |

---

## 11 Firestore Security Rules Content

Full content specified in §2.4. Summary:
- 5 collections: `predictions/**`, `actuals/**`, `backtest_summaries/**`, `predictor_params/**`, `optimize_runs/**`
- All: `allow read: if true; allow write: if false`
- Admin SDK calls from Cloud Run runtime SA and GHA service account bypass client rules entirely

Lint command: `firebase firestore:rules:validate`
Deploy command: `firebase deploy --only firestore:rules`

---

## 12 Cloud Run IAM Grant

Command to document in `ssot/deploy.md`:

```bash
gcloud projects add-iam-policy-binding <PROJECT_ID> \
  --member="serviceAccount:<CLOUD_RUN_SA>@<PROJECT_ID>.iam.gserviceaccount.com" \
  --role="roles/datastore.user"
```

The Cloud Run runtime service account email can be found via:
```bash
gcloud run services describe k-line-backend --region=asia-east1 --format="value(spec.template.spec.serviceAccountName)"
```

`roles/datastore.user` grants read/write access to Firestore in native mode via the Datastore API. K-078 only needs read; write is included in this role but will be used by K-079/K-081 GHA workflows.

---

## 13 Deploy Doc Additions (`ssot/deploy.md`)

Append after existing Step 4 (firebase deploy hosting):

```
5. **Firestore IAM (one-time per project)** — grant Cloud Run runtime SA Datastore user role:
   gcloud projects add-iam-policy-binding <PROJECT_ID> \
     --member="serviceAccount:<CLOUD_RUN_SA>@<PROJECT_ID>.iam.gserviceaccount.com" \
     --role="roles/datastore.user"
   Verify: GET /api/health returns params_source != error.

6. **Firestore security rules deploy** — run from K-Line-Prediction repo root:
   firebase deploy --only firestore:rules
   Lint before deploy: firebase firestore:rules:validate
```

---

## 14 `requirements.txt` Pin

Add one line to `backend/requirements.txt`:

```
google-cloud-firestore>=2.16,<3.0
```

Rationale for version range: `2.16.x` is the latest stable `2.x` series as of August 2025 (PyPI). Upper-bound `<3.0` prevents automatic upgrade to the `3.x` series which may introduce breaking changes to the synchronous `DocumentReference.get()` API. This range is intentionally permissive within the major version — `>=2.16` picks up security patches without requiring an explicit Engineer action on each patch release.

---

## 15 `ssot/system-overview.md` Addition

Add new section "Firestore Config Layer" after the Tech Stack table:

```markdown
## Firestore Config Layer (K-078)

| Collection | Doc | Purpose |
|---|---|---|
| `predictor_params` | `active` | Current predictor params (window, pearson, top_k, optimized_at, params_hash) |
| `predictor_params` | `history/{run_id}` | K-081: Bayesian run winners |
| `predictions` | `{YYYY-MM-DD-HH}` | K-079: daily prediction records |
| `actuals` | `{YYYY-MM-DD-HH}` | K-079: realized 72h windows |
| `backtest_summaries` | `{YYYY-MM-DD}` | K-079: rolling 30-day accuracy summaries |
| `optimize_runs` | `{run_id}` | K-081: Bayesian optimizer run metadata |

Backend reads `predictor_params/active` once at boot via `backend/firestore_config.py::load_active_params()`.
`predictor.params` is the single `ParamSnapshot` namespace object; atomically replaced at startup.
Firestore calls are NOT made per-request — `/api/health` reads the cached `predictor.params`.
Security: client-facing writes denied; Admin SDK (Cloud Run runtime SA) bypasses client rules.
```

---

## 16 Risks and Notes

- **`top_k_matches=0` from Firestore:** Firestore does not enforce schema constraints. If a future optimizer writes `top_k=0`, `results[:0]` returns an empty list and `/api/predict` raises a 422 with "No historical matches found". This is a silent degradation. Engineer must add `if loaded_top_k < 1: raise ValueError(...)` guard in `load_active_params` before constructing the `ParamSnapshot`, so the loader falls back to `DEFAULT_PARAMS` instead.

- **ThreadPoolExecutor not shut down:** `ThreadPoolExecutor(max_workers=1)` created per `load_active_params()` call. This is called once at boot; the executor is used and abandoned. Python GC handles cleanup. For K-079+ multi-call contexts, extract executor as module-level singleton — out of scope for K-078 (boot-time single call only).

- **Sacred test import chain:** After K-078, `test_predict_real_csv_integration.py` imports `predictor` (which imports `firestore_config`). If the `google-cloud-firestore` wheel is not installed in the test environment, the `try/except ImportError` guard ensures `firestore_config` is still importable. No test environment breakage.

- **`/api/health` vs `/health`:** The ticket AC shows bare `/health` in the JSON response discussion. Per K-Line convention, all backend routes are under `/api/` (Firebase Hosting rewrite forwards `/api/**` to Cloud Run). The endpoint is registered as `/api/health`. Engineer must verify this is consistent with the pass condition in AC-078-HEALTH-EXPOSES-PARAMS; the test uses TestClient which bypasses the Firebase proxy, so `client.get("/api/health")` is correct.

- **Python `Literal` type import:** `from typing import Literal` required in `firestore_config.py`. Available in Python 3.8+; Cloud Run uses Python 3.11 per `Dockerfile` (verify before use).

- **`dataclasses` import:** Standard library; no pin needed.

- **`hashlib` import:** Standard library; no pin needed.

---

## Retrospective

**Where most time was spent:** Tracing all 6 inline constant read sites in `predictor.py` and verifying the sacred test import chain after the `MA_TREND_WINDOW_DAYS` import removal.

**Which decisions needed revision:** Initial boot hook placement was considered as a FastAPI `@app.on_event("startup")` callback, but module-level assignment is simpler and executes before any request — no revision needed, confirmed during design.

**Next time improvement:** When a sacred test imports module constants directly (`from predictor import MA_TREND_WINDOW_DAYS`), flag this import as a design constraint in the ticket before QA consultation — it surfaces the sacred-test rewrite scope earlier.
