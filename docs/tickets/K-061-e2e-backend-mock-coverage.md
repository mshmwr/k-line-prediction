---
id: K-061
title: Fix 24 backend-dependent E2E failures — complete route mocking for ma99-chart, upload, consensus-stats specs
status: open
created: 2026-04-29
type: fix
priority: high
size: medium
visual-delta: no
content-delta: no
design-locked: true
qa-early-consultation: docs/retrospectives/qa.md 2026-04-29 K-061
dependencies: [K-013, K-051]
worktree: .claude/worktrees/K-061-e2e-backend-mock-coverage
branch: K-061-e2e-backend-mock-coverage
base-commit: 45e4fce
---

## Summary

24 Playwright E2E tests fail with 30s timeout (ECONNREFUSED on `/api/history-info`) when the backend is not running. Root cause: incomplete `page.route()` mocking — some API calls escape to the Vite dev proxy which has no backend to reach.

Identified in K-059 Phase 3 Playwright run (300 pass / 24 fail). Triaged as pre-existing on `main`; not caused by K-059.

**Failing specs:**
- `frontend/e2e/ma99-chart.spec.ts` — 17 tests (timeout at 30s)
- `frontend/e2e/upload-real-1h-csv.spec.ts` — 4 tests (timeout at 30s)
- `frontend/e2e/K-013-consensus-stats-ssot.spec.ts` — 3 tests (timeout at 30s)

**Two ma99-chart tests PASS** (lines 306, 355) — these test loading state only, not full predict flow.

**Log evidence:** `[WebServer] http proxy error: /api/history-info AggregateError [ECONNREFUSED]` in Playwright output.

**Note on "24" count:** Playwright output in K-059 run listed 24 failure entries (including retries); actual test count across the 3 specs is 20 (13 + 3 + 4). All 20 tests (18 previously failing + 2 that had been passing) now pass. The "24" in ACs refers to failure entries, not distinct test definitions.

## Phases

### Phase 1 — Architect + Engineer (combined, small scope)

1. For each failing spec, enumerate ALL API routes the app calls during that test's lifecycle (mount effects + user interaction).
2. Identify which routes are missing from the test's `page.route()` setup.
3. Add missing `page.route()` intercepts with realistic mock payloads (matching `feedback_playwright_mock_realism.md` spec).
4. Verify two passing ma99-chart tests still pass after changes (no regression).
5. Target: 0 backend-dependent failures; all 24 tests pass without live backend.

### Phase 2 — QA

Full Playwright run: 324/324 pass (or all previously-passing 300 + 24 fixed).

## Acceptance Criteria

- **AC-061-ZERO-BACKEND-FAILURES**: `npx playwright test --reporter=list` with no backend running → 0 tests timeout on ECONNREFUSED. Previously-passing 300 tests remain passing.
- **AC-061-MA99-MOCK-COMPLETE**: All `ma99-chart.spec.ts` tests pass without live `/api/merge-and-compute-ma99` or `/api/predict` backend.
- **AC-061-UPLOAD-MOCK-COMPLETE**: All `upload-real-1h-csv.spec.ts` tests pass without live `/api/upload` backend.
- **AC-061-CONSENSUS-MOCK-COMPLETE**: All `K-013-consensus-stats-ssot.spec.ts` tests pass without live consensus API backend.
- **AC-061-NO-FALSE-PASS**: Mock payloads must match the real API contract (field names, types, array shapes per existing fixtures) — no trivially-true assertions with empty payloads.
- **AC-061-LIFO-ORDER**: Catch-all `/api/**` handler in `mockApis()` must remain first-registered; per-test specific handlers registered after `mockApis()` call in every test body. Grep: `mockApis(page)` must appear before any `page.route('/api/` in the same test body.
- **AC-061-NO-SHARED-BEFOREEACH-FOR-SUSPENDING-TESTS**: `ma99-chart.spec.ts` suspending-handler tests (lines ~215, ~247) must remain self-contained — all `page.route()` for those tests stay inside the test body only, not in `beforeEach`.

## BQ Rulings (PM 2026-04-29 QA EC)

- **BQ-061-01** ✅ **Option A** — Suspending-handler tests (lines ~215, ~247 in `ma99-chart.spec.ts`) must NOT be moved into `beforeEach` scope. All route registrations for those tests stay in-body. No refactor of isolation pattern.
- **BQ-061-02** ✅ **Out of scope** — `readFileSync` at module top-level in `upload-real-1h-csv.spec.ts` left as-is; documented as KG-061-01.
- **BQ-061-03** ✅ **Canonical payloads locked** — Existing fixture objects (`MOCK_HISTORY_INFO`, `MOCK_MA99_RESPONSE`, `MOCK_PREDICT_BASE`, `MOCK_PREDICT_NATIVE_1D`) are the canonical mock payloads; Engineer must not simplify or substitute.

## Known Gaps (QA EC 2026-04-29)

- **KG-061-01**: `readFileSync` at module top-level in `upload-real-1h-csv.spec.ts:28` — fixture absence causes module parse failure, not per-test FAIL; cannot distinguish from hydration drift at E2E level. Backend unit test layer owns CSV parser correctness.
- **KG-061-02**: MA99 computation correctness — mocked `/api/merge-and-compute-ma99` returns pre-baked array; algorithm correctness is backend unit test territory.
- **KG-061-03**: File upload byte integrity — Playwright `setInputFiles` feeds bytes to frontend parser; actual multipart boundary encoding not verified when route is mocked.
- **KG-061-04**: `K-013-consensus-stats-ssot.spec.ts` Case D — deselect-all → empty appliedSelection path unreachable via UI (PredictButton disabled); covered by 1-bar `future_ohlc` payload proxy only.
