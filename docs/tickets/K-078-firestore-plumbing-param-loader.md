---
id: K-078
title: Firestore plumbing + backend predictor-param loader for self-tuning epic
status: closed
closed: 2026-05-02
closed-commit: cf902ad
created: 2026-05-02
type: feat
priority: high
size: medium
visual-delta: no
content-delta: no
design-locked: n/a
qa-early-consultation: ✓ — see ## QA Early Consultation section
dependencies: []
base-commit: be349d4
epic: backtest-self-tuning
epic-tickets: [K-078, K-079, K-080, K-081]
spec: ~/.claude/plans/pm-app-jaunty-wren.md
modifies-sacred: [K-015-sacred-floor]
---

## Summary

Foundation ticket of the backtest-self-tuning epic. Stands up Firestore as the
shared config + telemetry store and refactors backend boot so predictor module
constants (`MA_TREND_WINDOW_DAYS`, `MA_TREND_PEARSON_THRESHOLD`, `top_k`) become
overridable from a Firestore config doc. No daily flow, no optimizer, no UI in
this ticket — those land in K-079 / K-080 / K-081 once K-078 is green.

The epic delivers four user-requested capabilities (daily auto-backtest,
backtest reports, parameter self-tuning, prediction-result storage). Spec lives
at `~/.claude/plans/pm-app-jaunty-wren.md`. K-078 carries the unglamorous
plumbing: SDK, security rules, boot hook, health exposure, fallback safety.

## Acceptance Criteria

### AC-078-FIRESTORE-PROJECT
Firestore enabled on the existing GCP project hosting Cloud Run service
`k-line-backend` (region `asia-east1`). Default native-mode database created.
**Pass condition:** `gcloud firestore databases describe --database='(default)'`
returns active state.

### AC-078-SECURITY-RULES
`firestore.rules` (new) checked into repo root with:
- `predictions/**`, `actuals/**`, `backtest_summaries/**`, `predictor_params/**`,
  `optimize_runs/**` — public read (frontend reads without auth)
- All collections — write denied for all clients (only service-account writes
  via Admin SDK from GHA / Cloud Run boot)

`firebase.json` adds Firestore deploy target. `firebase deploy --only
firestore:rules` runs cleanly from local.
**Pass condition:** rules file lints with `firebase firestore:rules:validate`;
deploy succeeds.

### AC-078-PREDICTOR-CONSTANTS-EXPOSED
`backend/predictor.py` refactored so all three tunables live on a single
namespace object `predictor.params: ParamSnapshot`:
- `find_top_matches` line 363 `top = results[:10]` → `top = results[:predictor.params.top_k_matches]`
- `MA_TREND_WINDOW_DAYS` / `MA_TREND_PEARSON_THRESHOLD` constants kept as
  defaults; all internal reads switch to `predictor.params.ma_trend_window_days`
  / `predictor.params.ma_trend_pearson_threshold`
- Default `predictor.params = ParamSnapshot(window=30, pearson=0.4, top_k=10,
  params_hash="<sha256-of-defaults>", optimized_at=None, source="default")`
  initialized at module load — this preserves byte-identical behavior when
  Firestore is unavailable
- Single-assignment swap is atomic per Python GIL: boot replaces
  `predictor.params` once with a fully-populated `ParamSnapshot`; no
  intermediate state observable to concurrent `/predict` requests (resolves
  QA Challenge #3)

**Pass condition:** unit test sets `predictor.params = ParamSnapshot(window=14,
pearson=0.5, top_k=5, ...)`; calls `find_top_matches` against fixture; asserts
`len(matches) <= 5` AND `_classify_trend_by_pearson` threshold uses 0.5.

### AC-078-SACRED-TEST-2-LAYER-REWRITE
The existing sacred test `test_min_daily_bars_constant_is_imported_not_magic`
hard-asserts `MA_TREND_WINDOW_DAYS == 30`. With boot-time param mutation that
assertion is brittle. Replace with a two-layer pair:
1. **Structure invariant** — assert `predictor.params` is a `ParamSnapshot`
   instance and that `find_top_matches` / `compute_stats` reference
   `predictor.params.*` (no inline magic numbers via `ast` walk of the source
   file)
2. **Behavior invariant** — set `predictor.params` to defaults; recompute the
   minimum daily-bar floor (`predictor.params.ma_trend_window_days +
   MA_WINDOW`); assert it equals the live value used by the predict path.
   Re-run with `predictor.params.ma_trend_window_days = 14`; assert the floor
   recalculates to 113 (not stuck at 129)

This is intentionally a sacred-test mutation. PM has authorized; flag in PR
description for Reviewer.

**Pass condition:** old test removed; both new layers green; whole-suite
`pytest -q` clean.

### AC-078-BOOT-PARAM-LOADER
`backend/firestore_config.py` (new):
- `ParamSnapshot` dataclass: `ma_trend_window_days: int`,
  `ma_trend_pearson_threshold: float`, `top_k_matches: int`,
  `params_hash: str` (sha256 of canonicalized tuple), `optimized_at: str |
  None` (ISO8601), `source: Literal["firestore","default"]`
- `load_active_params(timeout_seconds: float = 5.0) -> ParamSnapshot` — never
  returns `None`; on Firestore success returns `source="firestore"`
  snapshot; on timeout / not-found / SDK error / `ImportError` returns the
  baked-in default snapshot (`source="default"`) with a single
  `logger.warning(...)` line including the failure cause
- Wraps the synchronous Firestore SDK call in
  `concurrent.futures.ThreadPoolExecutor(max_workers=1)` and uses
  `future.result(timeout=timeout_seconds)` so gRPC internal retries cannot
  exceed the wall-clock budget (resolves QA Challenge #2)
- Top-level `import google.cloud.firestore` MUST be wrapped in `try/except
  ImportError` — if SDK import fails the module still defines `ParamSnapshot`
  and returns the default snapshot, so backend boot is never blocked by a
  bad wheel (resolves QA risk R3)

`backend/main.py` startup:
- Single-statement atomic swap: `predictor.params = load_active_params()`
- No log on success path (avoid log noise per K-Line conventions); warning
  already emitted by loader on fallback

**Pass condition:** integration test boots backend with mock Firestore that
returns custom params; `/health` reflects `source="firestore"` + new values.
Boot with unreachable Firestore: backend still serves traffic; `/health`
shows `"params_source": "default"`. Boot with `ImportError` patched on
`google.cloud.firestore`: backend still serves traffic; `/health` shows
`"params_source": "default"`. Timeout regression test: patch SDK call with
`time.sleep(10)`; assert loader returns within 5.5s wall-clock with
`source="default"`.

### AC-078-HEALTH-EXPOSES-PARAMS
`/health` endpoint serializes ONLY the `ParamSnapshot` dataclass fields
(allow-list, not deny-list — resolves QA Challenge #4). Raw Firestore SDK
response objects MUST NOT be passed to `JSONResponse`.

Response shape (exact):
```json
{
  "status": "ok",
  "params_source": "firestore",
  "params_hash": "<sha256-12char>",
  "optimized_at": "2026-05-02T14:00:00Z",
  "active_params": {
    "ma_trend_window_days": 30,
    "ma_trend_pearson_threshold": 0.4,
    "top_k_matches": 10
  }
}
```
On default fallback: `"params_source": "default"`, `"optimized_at": null`,
hash is the precomputed default hash.

**Pass condition:**
1. `GET /health` returns the exact JSON shape above (no extra keys, no nested
   raw SDK objects, no project_id, no service-account email)
2. Negative test: introspect serialized JSON, assert keys exactly equal
   `{"status","params_source","params_hash","optimized_at","active_params"}`
   and `active_params` keys exactly equal
   `{"ma_trend_window_days","ma_trend_pearson_threshold","top_k_matches"}`
3. Endpoint serves under 100ms (no Firestore call on every request — uses
   cached `predictor.params` snapshot from boot)

### AC-078-SACRED-FLOOR-INTACT
Backend pytest suite passes including the K-013 sacred-floor 129-bar contract
fixture. Param-loading change must not perturb prediction outputs when
Firestore returns code defaults.
**Pass condition:** `cd backend && pytest -q` clean; integration test
`test_predict_real_csv_integration.py` green.

### AC-078-CLOUD-RUN-IAM
Cloud Run service `k-line-backend` runtime service account granted
`roles/datastore.user` (read access to Firestore in native mode is via
Datastore API). Document the grant command in `ssot/deploy.md`.
**Pass condition:** Deployed Cloud Run can read `predictor_params/active`
without 403; verified via `/health` against staging Firestore.

### AC-078-DOCS-UPDATE
- `ssot/system-overview.md` — new "Firestore config layer" section
- `ssot/deploy.md` — IAM grant + `firebase deploy --only firestore:rules`
  step appended to deploy checklist
- `backend/requirements.txt` — `google-cloud-firestore>=2.16` added (pinned
  next-minor)

## Out of scope (explicit)

- Daily prediction write flow → K-079
- `/backtest` frontend route → K-080
- Bayesian optimizer → K-081
- Feature-weight tuning → Phase 2

## QA Early Consultation

**QA Lead — 2026-05-02**
**Scope:** AC testability review (Early Consultation tier). Implementation not
started; Mandatory Task Completion Steps suspended per K-045.

### Test approach summary

| AC | Type | Smallest passing assertion |
|---|---|---|
| FIRESTORE-PROJECT | Manual smoke | `gcloud firestore databases describe` returns `state: ACTIVE` |
| SECURITY-RULES | CLI smoke | `firebase firestore:rules:validate` exits 0; staging deploy succeeds |
| PREDICTOR-CONSTANTS-EXPOSED | pytest unit | swap `predictor.params` → assert `find_top_matches` length and trend threshold honor new values |
| SACRED-TEST-2-LAYER-REWRITE | pytest unit | structure layer (ast walk, no inline magic numbers); behavior layer (floor recomputes from runtime values) |
| BOOT-PARAM-LOADER | pytest integration + mock | normal / NotFound / DeadlineExceeded / ImportError paths all yield `ParamSnapshot`; timeout enforced via `concurrent.futures` |
| HEALTH-EXPOSES-PARAMS | pytest TestClient | exact key set match; under 100ms |
| SACRED-FLOOR-INTACT | regression | `pytest -q test_predict_real_csv_integration.py` clean with default Firestore fallback |
| CLOUD-RUN-IAM | manual / staging | `/health` returns `params_source=firestore` against staging |
| DOCS-UPDATE | grep | requirements pinned, deploy doc updated |

### PM-resolved blockers (snapshot)

| QA challenge | PM decision | AC carrying the resolution |
|---|---|---|
| #1 sacred test conflict | Option B — rewrite sacred test as 2-layer | AC-078-SACRED-TEST-2-LAYER-REWRITE |
| #2 timeout mechanism unspecified | `concurrent.futures.ThreadPoolExecutor` + `future.result(timeout=5)` | AC-078-BOOT-PARAM-LOADER |
| #3 three-assignment race | Single-namespace `predictor.params` swap (GIL-atomic) | AC-078-PREDICTOR-CONSTANTS-EXPOSED |
| #4 sensitive deny-list | Allow-list serialization of `ParamSnapshot` fields only | AC-078-HEALTH-EXPOSES-PARAMS |

### Known Gaps (accepted, not blockers)

- Infra-state ACs (FIRESTORE-PROJECT, CLOUD-RUN-IAM) are not pytest-verifiable;
  manual screenshot evidence accepted at sign-off
- Hydration drift risk on sacred CSV fixtures — re-run failures in canonical
  before flagging as regression (per Hydration Drift Policy)

## Notes

- Service-account key delivery: K-Line backend already runs under default
  Cloud Run runtime SA; no new secret needed for backend boot reads. GHA
  workflows in K-079 / K-081 will need a separate `GCP_SA_KEY` secret with
  `roles/datastore.user` + write perms on the four collections.
- Local dev: emulator support (`firebase emulators:start --only firestore`)
  optional; document in `ssot/conventions.md` if added.
- The five-second boot timeout is intentional: longer waits would degrade
  Cloud Run cold-start; the fallback path keeps the app serving even with
  Firestore down.

## Retrospective

### Engineer

**AC judgments that were wrong:** None.

**Edge cases not anticipated:**
1. Python 3.9 does not support `str | None` syntax — used `Optional[str]` instead.
2. `ThreadPoolExecutor` context manager blocks `__exit__` until workers complete — `with executor:` defeats the timeout. Fixed with explicit `executor.shutdown(wait=False)`.
3. AST forbidden-literal set needed per-function scoping: `0.4` in `find_top_matches` is the MA blend weight, not the pearson threshold.

**Next time improvement:** Before writing Python type annotations, run `python3 --version` in the target environment and use `Optional[T]` if < 3.10. When ThreadPoolExecutor is used for timeout, verify `shutdown(wait=False)` is in place.
