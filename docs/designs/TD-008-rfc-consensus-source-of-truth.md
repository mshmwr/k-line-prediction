---
id: TD-008-RFC
title: Consensus Forecast / Stats Single Source of Truth
status: accepted
type: rfc
author: senior-architect
created: 2026-04-18
accepted: 2026-04-18
accepted_by: PM
implements_ticket: K-013
related:
  - docs/tech-debt.md#td-008
  - docs/reviews/2026-04-18-code-review.md
  - docs/tickets/K-013-consensus-stats-contract.md
---

## Background

Codex's 2026-04-18 review pointed out that projected future bar aggregation / stats derivation / time aggregation each have separate frontend and backend implementations, with long-term drift risk. Actual inventory:

**Backend (backend/predictor.py)**
- `_projected_future_bars(matches, current_close)` — aligns matches' `future_ohlc` to current close, takes mean per bar to produce consensus bars
- `compute_stats(matches, current_close, timeframe)` — derives 4 `OrderSuggestion` slots (highest/second_highest/second_lowest/lowest) + `win_rate` + `mean_correlation` from projected bars
- Output written to `PredictStats.consensus_forecast_1h` / `consensus_forecast_1d` returned to frontend
- Computation **happens once**: at `POST /api/predict`, on **all** top-N matches

**Frontend (frontend/src/AppPage.tsx)**
- `projectedFutureBars` useMemo — reads `appliedSelection` (user-checked subset), recomputes consensus bars
- `computeDisplayStats(matches, projectedBars, currentClose)` — recomputes highest/second_highest/second_lowest/lowest 4 slots + slots `projectedFutureBars` back into `consensusForecast1h`
- `displayStats` uses recomputed result when `projectedFutureBars.length >= 2`, else falls back to backend `appliedData.stats`

**Root trigger: when user unchecks a subset of matches in MatchList, stats must be recomputed per subset. Backend only accepts `selected_ids` for filter, but `/api/predict` is not currently re-called; frontend computes itself.**

This is not a pure DRY problem; it is an architectural decision about "who computes subset stats."

---

## Options

### Option A — Backend only, every selection change triggers API re-compute

**Approach:**
- Add `POST /api/compute-stats` (lightweight endpoint): input = `selected_match_ids` + `current_close` + `timeframe` + cached matches (or session key), output = `PredictStats`
- Or extend existing `/api/predict` with a "skip similarity search, just recompute stats" mode (input carries existing matches + selected subset)
- Frontend deletes `computeDisplayStats` and frontend aggregation logic
- `displayStats` directly = backend response

**Pros:**
- Single source of truth truly unified
- `ForecastBar` time fields produced by backend, fully avoiding frontend/backend timezone-conversion drift (current frontend `aggregation.ts` has UTC+8 formatting logic)
- If stats algorithm gets complex later (e.g. confidence interval), change one place

**Cons:**
- **Each click incurs a network round-trip** (currently frontend gives instant feedback) — UX feel drops by ~100–300ms
- Backend must hold match state (stateful) or require frontend to round-trip the matches payload (increases request size)
- New endpoint adds surface area; needs tests, rate limiting, error handling

### Option B — Frontend only, backend does not return consensus_forecast / stats

**Approach:**
- `/api/predict` response changed to plain matches (drop `PredictStats.consensus_forecast_1h/1d` and OrderSuggestion)
- Frontend `computeDisplayStats` becomes the only implementation
- Backend `compute_stats` and `_projected_future_bars` deleted

**Pros:**
- Zero latency on menu interaction
- Reduced backend payload
- TypeScript types are already complete; frontend has all data

**Cons:**
- **Backend test `test_predictor.py` 44 passed include a substantial portion testing stats logic; all become void and need equivalent frontend tests**
- If future "headless API consumers" exist (scripts / other frontends), they must compute stats themselves
- Frontend bundle gets heavier (current `aggregation.ts` already has time formatting, MA99 utils, etc.)
- Backend reviewer / operator cannot see "what the model produces", only raw matches

### Option C — Shared schema + frontend computes subset, backend computes full set (recommended)

**Approach:**
1. `PredictStats` retains `consensus_forecast_1h/1d`, but semantically marked as "**full-set** (all top-N matches) stats baseline"
2. Subset stats (when user deselects) computed by frontend, but **shared schema and pure function extracted**:
   - Add `shared/stats-contract.ts` (or directly `frontend/src/utils/statsComputation.ts`) defining `computeStatsFromMatches(matches, currentClose, timeframe) → PredictStats`
   - Backend `compute_stats` serves as **verification oracle**: add pytest parametrize tests that feed frontend test fixtures into backend, asserting both sides bit-exact (or tolerating 1e-6 float error)
3. Backend `consensus_forecast_1h/1d` time field changed to ISO UTC+0 (already is); frontend unifies one time formatter; backend and frontend share fixture verification
4. Frontend `AppPage.tsx`'s `displayStats` logic simplified:
   - `appliedSelection == all matches` → use `appliedData.stats` directly (no recompute)
   - `appliedSelection ⊂ all matches` → call `computeStatsFromMatches(filteredMatches, ...)`

**Pros:**
- Zero UX latency (subset computation in frontend)
- Both implementations locked by contract test; CI auto-detects drift
- `/api/predict` payload unchanged; backward-compatible
- Backend stats not deleted (retains support for "headless users")

**Cons:**
- Maintain two implementations (mitigated by contract test, not eliminated)
- Contract test fixtures need manual maintenance; if backend changes algorithm, fixture drift caught by CI but needs human sync

---

## Recommendation: Option C

**Reason:** Option A's UX regression (100–300ms round-trip per click) is not worth paying for architectural purity, especially when user scenario is frequent selection-change for what-if analysis. Option B abandons backend's already-written, well-tested `compute_stats` (significant share of 44 tests rely on it), which is a negative investment. Option C uses contract test to push the "dual implementation" tech-debt risk down to CI level — preserves UX and locks drift, the most balanced approach for current backlog and user scenario.

---

## Implementation Impact (Option C)

### Backend
- `backend/predictor.py` `compute_stats` / `_projected_future_bars` — **semantic note change** (comment marked "full-set baseline"); logic unchanged
- `backend/tests/test_predictor.py` — add contract fixture parametrize tests: read shared JSON fixture → assert backend `compute_stats(...)` output matches frontend expectations
- Add `backend/tests/fixtures/stats_contract_cases.json` (or place under `ClaudeCodeProject/shared/fixtures/`)

### Frontend
- Add `frontend/src/utils/statsComputation.ts` (extract `computeDisplayStats` from `AppPage.tsx`, rename to `computeStatsFromMatches`; output type = camelCase mapping of backend `PredictStats`)
- `frontend/src/AppPage.tsx`:
  - `projectedFutureBars` useMemo logic merged into `computeStatsFromMatches`
  - `displayStats` useMemo branch: "full-set = appliedData.stats; subset = computeStatsFromMatches(...)"
  - Delete inline `computeDisplayStats` (~30 lines)
- `frontend/src/__tests__/statsComputation.test.ts` (new) — read same JSON fixture, assert output equals fixture.expected

### API Fields
- **No change.** `PredictResponse` schema and `/api/predict` contract unchanged.
- Field mapping table (architecture.md `Frontend ↔ Backend Field Mapping`) needs no update.

### Playwright Tests
- `frontend/e2e/*` — existing mock payload unchanged; if mock's `consensus_forecast_1h` does not match new "full-set" semantic note, no impact on test pass
- Suggested new E2E case (non-blocking): after unchecking one match, assert `StatsPanel`'s `highest.price` changed to subset result

### Tech Debt Dependencies
- TD-005 (AppPage.tsx split) — when implementing Option C, extracting `statsComputation.ts` cleanly makes `usePredictionWorkspace()` hook split clearer
- TD-006/007 (backend split) — `compute_stats` can move directly into `predictor_stats.py`, no cross-layer impact
- TD-004 (PredictorChart effect deps) — no dependency
- TD-003 (concurrency race) — no dependency

---

## Schedule Suggestion

1. **Approve this RFC first** (PM approves option) → 2026-04-18 or start of next cycle
2. Open K-XXX ticket: implement Option C (frontend extract util + backend contract test + fixture)
3. After ticket acceptance, kick off TD-005 / TD-006 / TD-007 split RFCs (each independent, taken by Architect)

---

## Open Questions (need PM ruling)

1. Where to place contract fixtures?
   - A. `backend/tests/fixtures/` — backend-first
   - B. `ClaudeCodeProject/shared/fixtures/` — explicitly shared (but project currently has no `shared/` dir)
   - **Recommend A**: avoid adding directory layer; frontend test reads via relative path.
2. Add CI contract-drift job (force fixture sync when backend changes `compute_stats` algorithm)?
   - Recommend "add next phase"; rely on PR reviewer manually for now.

---

## Retrospective (to backfill after implementation)

_Once this RFC is adopted and implemented, Architect backfills the following:_
- Which judgment needed revision later
- Next-time improvement

### RFC Drafting Reflection (2026-04-18)

**Where the most time was spent: Option A vs C UX/correctness tradeoff judgment.**
Initial instinct was A (backend-only) "cleanest", but writing the Cons made me recall users' real interaction pattern is frequent deselect for what-if analysis; the 100–300ms round-trip per click would feel laggy in this scenario. Listing all three Options was necessary — B (frontend-only), though ultimately rejected, forced concrete quantification of "backend 44 tests significantly rely on compute_stats", becoming a concrete reason to reject B and reinforcing the case for C. Had we converged to C immediately, the Cons list might not have been sharp enough.

**The decision needing the most revision in retrospect: reasoning for placing contract test fixtures in `backend/tests/fixtures/`.**
Choosing A was for "no new directory layer", but assumed fixture's "owner" is backend. In fact, the fixture is a **dual-side shared contract**; placing it in backend dir semantically biases toward "auxiliary data for backend tests"; frontend reading via relative path `../../../backend/tests/fixtures/...` would confuse frontend engineers about fixture ownership. Furthermore, when TD-007 moves `compute_stats` to `predictor_stats.py`, does the fixture move along or stay put? Not addressed.

Another insufficiently discussed edge case is **camelCase ↔ snake_case coverage**: if fixture expected uses snake_case (backend native), frontend test must do key conversion before assert, introducing another "conversion logic" layer in tests; if conversion itself has a bug (e.g. trailing-number corner cases like `historical_ma99_1d` → `historicalMa991d`), fixture cannot lock it. RFC did not specify fixture's canonical key language ownership.

**Next-time improvements for cross-layer RFCs:**
1. Fixture location options should add "new `shared/fixtures/`" and explicitly compare ownership semantics across all three, not just "no new dir layer" vs "new `shared/`" binary.
2. Any cross-language contract test must explicitly state in the RFC "fixture canonical key is snake or camel", and list a concrete trailing-number suffix field (`historical_ma99_1d` / `futureOhlc1d`) as key-conversion regression case.
3. Option comparison table should list "user interaction frequency" as the first evaluation axis — had we written "expected N deselects per user session" upfront this time, Option A's UX regression would have been visible without waiting for Cons.

---

## PM Ruling (2026-04-18)

**Result: Accept Option C (shared schema + frontend computes subset + backend computes full set + contract test)**

### Core Decision

| Aspect | Ruling |
|------|------|
| Option choice | **Option C** (Architect recommended; user agreed to schedule into this cycle) |
| Reason | Zero UX latency (subset computation in frontend) + CI lockable drift + `/api/predict` payload backward-compatible; Option A's 100–300ms round-trip too noticeable in what-if analysis; Option B abandoning 44 backend tests is a negative investment |

### Open Questions Resolved

| # | Question | Architect recommendation | PM ruling |
|---|------|---------------|---------|
| 1 | Where to place contract fixture? | A. `backend/tests/fixtures/` | **Accept A**. No new `shared/` directory layer; frontend test reads same JSON via relative path; extract `shared/` later when need is clear |
| 2 | Add CI contract-drift job? | Add next phase | **Accept defer**. This cycle relies on PR reviewer + both sides eating same fixture and auto-failing as safety net; if still felt necessary after K-013 acceptance, RFC adds CI job in next cycle |

### Implementation Authorization

- Corresponding ticket: [K-013](../tickets/K-013-consensus-stats-contract.md)
- Owner: Engineer (implementation), senior-engineer agent (code review)
- Estimated size: M (medium)
- Dependencies: does not block other tickets; coordinates with TD-005 (when TD-005 starts, `usePredictionWorkspace()` boundary will be re-split based on K-013's `statsComputation.ts`)
- Schedule: K-013 placed after K-010 → K-009 → K-011 → K-012 (largest change, placed last)

### Subsequent RFC Order

After K-013 acceptance, kick off in order:
1. TD-005 (AppPage.tsx split RFC, Architect)
2. TD-006 + TD-003 (backend/main.py split + concurrency race, merged into same RFC)
3. TD-007 (predictor.py split; contract fixture needs synchronized migration)

— PM, 2026-04-18
