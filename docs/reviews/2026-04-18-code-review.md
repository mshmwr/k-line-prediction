# K-Line Prediction Code Review

Date: 2026-04-18
Reviewer: Codex
Scope: Whole-project review with emphasis on current uncommitted changes, runtime behavior, test health, and modularity.

## Overall Assessment

The project is in workable shape and most integration paths are still functioning, but there are a few issues that should be addressed before treating the current state as stable:

- There is one backend logic issue that can affect live prediction quality on the `1H` path.
- The frontend unit test suite is currently broken, even though Playwright and backend tests are green.
- Several core files are carrying too many responsibilities, which increases regression risk and slows future changes.

## Findings

### P1: `1H` prediction path uses the wrong MA history source

In `backend/main.py`, the `predict()` route calls `find_top_matches()` with:

- `history=history`
- `timeframe=req.timeframe`
- `history_1d=_history_1d`

but it does not pass `ma_history`.

Inside `backend/predictor.py`, `find_top_matches()` falls back to:

```python
if ma_history is None:
    ma_history = history
```

That means the `1H` flow uses `_history_1h` as the source for the "30-day MA99" filter and MA correlation input, even though the helper `_fetch_30d_ma_series()` is explicitly built around daily-history semantics.

Impact:

- candidate filtering can be wrong
- ranking can be wrong
- `1H` predictions may differ materially from intended strategy behavior

Recommendation:

- pass `ma_history=_history_1d` from `backend/main.py` when calling `find_top_matches()`
- add a dedicated backend test for the `1H` route to lock this behavior down

### P1: Frontend unit suite is red

`npm test` is currently failing in `frontend/src/__tests__/AppPage.test.tsx`.

Root cause:

- the tests still assume there are two `1D` buttons
- they click `screen.getAllByRole('button', { name: '1D' })[1]`
- in the current UI there is only one matching control

Observed result:

- 2 failing Vitest tests
- branch is effectively broken anywhere unit tests are part of the merge gate

Recommendation:

- update the test to target the current timeframe switch control
- avoid index-based button assumptions when the DOM is expected to evolve

### P2: Upload history flow is not safe under concurrent requests

`backend/main.py` stores mutable in-memory history in module globals:

- `_history_1h`
- `_history_1d`

`upload_history_file()` reads, merges, writes, and swaps those globals without synchronization.

Impact:

- concurrent uploads can lose bars
- the last writer can overwrite another request's merged result
- risk increases in multi-user or multi-worker deployment

Recommendation:

- add a synchronization mechanism around update/write flow, or
- move history persistence into a proper repository/service abstraction with atomic writes

### P2: Expanded match charts can render stale data

In `frontend/src/components/MatchList.tsx`, `PredictorChart` rebuilds its chart in an effect that depends mostly on:

- `startDate`
- `timeframe`
- array lengths

but not the actual candle values.

If a rerun prediction returns different bar values with the same lengths, an already-open card may keep showing the old chart.

Recommendation:

- make the chart effect depend on actual data identity or memoized chart input
- remove the need for the current exhaustive-deps suppression

### P3: Shared loading spinner copy is now misleading

`frontend/src/components/common/LoadingSpinner.tsx` always renders:

`Running prediction...`

That component is now reused in:

- `BusinessLogicPage`
- `DiaryPage`
- `DevDiarySection`
- `PredictButton`

Impact:

- diary/business-logic loading states show prediction-specific wording
- shared UI component is no longer semantically neutral

Recommendation:

- make the spinner accept a `label` prop, or
- provide separate task-specific wrappers

### P3: One Playwright test passes but does not verify what it claims

`frontend/e2e/business-logic.spec.ts` contains a test named as if it verifies the Logic lock icon disappears after login, but the assertions only confirm:

- the Logic link is visible
- secret content renders

Impact:

- false confidence
- behavior described by the test name is not actually protected

Recommendation:

- rename the test to match actual assertions, or
- add the assertion that reflects the intended nav behavior

## Modularity Review

### `frontend/src/AppPage.tsx`

This file is too responsibility-heavy.

It currently owns:

- official CSV parsing
- upload workflows
- MA99 loading
- prediction orchestration
- derived statistics
- selection state
- layout composition

Recommended split:

- `useOfficialInput()`
- `useHistoryUpload()`
- `usePredictionWorkspace()`
- presentational sub-sections for left rail / results rail

### `backend/main.py`

This file currently mixes:

- FastAPI wiring
- CSV parsing
- mutable state management
- persistence
- prediction orchestration
- fallback routing

Recommended split:

- `history_repository.py`
- `history_service.py`
- `prediction_service.py`
- thinner route layer in `main.py`

### `backend/predictor.py`

This module has strong domain value, but it is becoming too broad.

It currently contains:

- time normalization helpers
- MA99 helpers
- similarity scoring
- trend classification
- 1D aggregation
- stats generation

Recommended split:

- `predictor_ma.py`
- `predictor_similarity.py`
- `predictor_stats.py`
- keep `predictor.py` as orchestration entrypoint if desired

### Cross-layer duplication

Some business logic now exists in both backend and frontend:

- projected future bar aggregation
- stats derivation
- time aggregation behavior

Risk:

- frontend and backend can drift over time
- tests may pass locally while user-visible numbers disagree

Recommendation:

- choose one source of truth for consensus/stat computation
- preferably compute once on backend and render on frontend

## Validation Performed

The following checks were run during review:

- `python3 -m pytest backend/tests/test_auth.py backend/tests/test_main.py` -> 18 passed
- `python3 -m pytest backend/tests/test_predictor.py` -> 44 passed
- `frontend: npx playwright test` -> 45 passed
- `frontend: npm test` -> failed with 2 errors in `AppPage.test.tsx`

## Suggested Next Steps

1. Fix the `Vitest` failures so the frontend unit suite is green again.
2. Correct the `1H` backend MA history wiring and add a regression test.
3. Decide whether to refactor `AppPage.tsx` or `backend/main.py` first; both are now large enough to justify structural cleanup.
