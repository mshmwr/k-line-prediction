---
id: K-001
title: Backend test reinforcement — main.py route handler coverage uplift
status: closed
type: test
priority: medium
created: 2026-04-16
---

## Background

Current backend overall coverage is 71%, with `main.py` at only 45%. All FastAPI route handlers lack direct integration tests — existing coverage comes mainly from logic indirectly executed by `predictor.py` unit tests.

The gap "valid token → GET /api/business-logic → 200" was logged during Phase 3 review (PRD line 239) but has not been backfilled.

**Goal:** `main.py` coverage ≥ 80%.

## Acceptance Criteria

Maps to PRD ACs (see `PRD.md`):

| AC | Description |
|----|------|
| AC-TEST-AUTH-3 | Valid token → GET /api/business-logic → 200 + content |
| AC-TEST-AUTH-5 | business_logic.md missing → 404 |
| AC-TEST-HISTORY-INFO-1 | GET /api/history-info returns 1H/1D info |
| AC-TEST-UPLOAD-1 | POST /api/upload-history — 1H CSV happy path |
| AC-TEST-UPLOAD-2 | POST /api/upload-history — 1D filename detection |
| AC-TEST-UPLOAD-3 | POST /api/upload-history — empty file → 422 |
| AC-TEST-UPLOAD-4 | POST /api/upload-history — duplicate upload added_count = 0 |
| AC-TEST-EXAMPLE-1 | GET /api/example — file missing → 404 |
| AC-TEST-PARSE-1 | _parse_csv_history_from_text — CryptoDataDownload format |
| AC-TEST-PARSE-2 | _parse_csv_history_from_text — Binance raw API format |
| AC-TEST-PARSE-3 | _parse_csv_history_from_text — empty string |
| AC-TEST-MERGE-1 | _merge_bars — dedupe and sort |

## Scope

**In:**
- Add `backend/tests/test_main.py`
- Extend `backend/tests/test_auth.py` (AC-TEST-AUTH-3, AC-TEST-AUTH-5)
- Use the `tmp_path` fixture; do not depend on the real on-disk history database

**Out:**
- `GET /api/official-input` (requires `OFFICIAL_INPUT_CSV_PATH` env var; treated as optional, not covered for now)
- `GET /{full_path:path}` SPA fallback (requires `dist/` to exist; deploy-time path)
- Coverage uplift for `time_utils.py` and `mock_data.py` (handled in a separate ticket)

## Test strategy

- `TestClient(app)` from `fastapi.testclient`
- `monkeypatch` to set `JWT_SECRET` and `BUSINESS_LOGIC_PASSWORD` env vars
- `tmp_path` to create temporary CSVs and `business_logic.md`, with monkeypatch overriding the path constants

## Related links

- [PRD.md — Backlog backend test reinforcement](../../PRD.md#backlog--後端測試補強backend-test-coverage)
- [backend/tests/test_auth.py](../../backend/tests/test_auth.py)
- [backend/main.py](../../backend/main.py)

## Tech debt log

Items found during Code Review and deferred by PM ruling.

| # | Issue | Severity | Ruling date | Handle when |
|---|------|--------|----------|----------|
| TD-K001-1 | `test_history_info_returns_1h_and_1d` has no monkeypatch isolation; relies on MOCK_HISTORY fallback or real files — environment-dependent fragile test | Suggestion | 2026-04-17 | Next test-hardening cycle, alongside the tmp_path fixture refactor |
| TD-K001-2 | Float comparisons use `==` (e.g. `2000.0`); current data happens to be integer values so it is safe, but adding decimal test data later risks comparison drift | Suggestion | 2026-04-17 | Once decimal test data appears, swap to `pytest.approx` |

**Decision rationale:**
- TD-K001-1: MOCK_HISTORY fallback behavior is currently stable; switching to tmp_path requires a fixture-structure refactor whose risk outweighs the current benefit.
- TD-K001-2: The integer data path is safe; pulling in `pytest.approx` early adds complexity without real protection. Backfill when the need surfaces.

## Acceptance result (2026-04-17)

- QA: GO — 12/12 ACs PASS, 62 tests passed, main.py 86% coverage
- Closed: 2026-04-17
