---
id: K-078
title: Firestore plumbing + backend predictor-param loader for self-tuning epic
status: open
created: 2026-05-02
type: feat
priority: high
size: medium
visual-delta: no
content-delta: no
design-locked: n/a
qa-early-consultation: pending — adds new external dependency (Firestore SDK) to backend boot path
dependencies: []
base-commit: be349d4
epic: backtest-self-tuning
epic-tickets: [K-078, K-079, K-080, K-081]
spec: ~/.claude/plans/pm-app-jaunty-wren.md
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
`backend/predictor.py`:
- `find_top_matches` line 363 `top = results[:10]` → use module constant
  `TOP_K_MATCHES = 10` (new)
- `MA_TREND_WINDOW_DAYS`, `MA_TREND_PEARSON_THRESHOLD` already module-level
  (lines 11–12); confirm no inline override anywhere

**Pass condition:** unit test verifies setting these three constants at runtime
changes `find_top_matches` / `_classify_trend_by_pearson` behavior accordingly.

### AC-078-BOOT-PARAM-LOADER
`backend/firestore_config.py` (new):
- `load_active_params() -> ParamSnapshot | None` — reads
  `predictor_params/active` doc; returns dataclass with three fields plus
  `params_hash` (sha256 of param tuple) and `optimized_at` (ISO8601)
- Uses `google-cloud-firestore` Admin SDK with default service-account
  credentials (Cloud Run env)
- Five-second timeout; on timeout / not-found / SDK error → return `None`
  with `logger.warning(...)`

`backend/main.py` startup:
- Call `load_active_params()` once at module init
- If returned non-None: assign to `predictor.MA_TREND_WINDOW_DAYS`,
  `predictor.MA_TREND_PEARSON_THRESHOLD`, `predictor.TOP_K_MATCHES`
- If None: keep code defaults; log `"Firestore params unavailable, using
  defaults"`

**Pass condition:** integration test boots backend with mock Firestore that
returns custom params; `/health` (next AC) reflects them. Boot with
unreachable Firestore: backend still serves traffic; `/health` shows
`"params_source": "default"`.

### AC-078-HEALTH-EXPOSES-PARAMS
`/health` endpoint response includes:
```json
{
  "status": "ok",
  "params_source": "firestore" | "default",
  "params_hash": "<sha256-12char>",
  "optimized_at": "2026-05-02T14:00:00Z" | null,
  "active_params": {
    "ma_trend_window_days": 30,
    "ma_trend_pearson_threshold": 0.4,
    "top_k_matches": 10
  }
}
```
**Pass condition:** Curl `/health` after boot returns shape above with no
sensitive values leaked (no service-account email, no project id).

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
