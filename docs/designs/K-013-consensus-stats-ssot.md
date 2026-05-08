---
id: K-013-DESIGN
title: Consensus / Stats Single Source of Truth — Architecture Design
type: design
author: senior-architect
created: 2026-04-21
status: ready-for-engineer
implements_ticket: K-013
supersedes: TD-008 RFC §Implementation Impact Scope (K-013 ticket Architecture Review section)
related:
  - docs/designs/TD-008-rfc-consensus-source-of-truth.md
  - docs/tickets/K-013-consensus-stats-contract.md
  - docs/reviews/2026-04-18-code-review.md
  - agent-context/architecture.md
---

## 0 Pre-Design Audit / Confirmed Scope

### 0.1 Files inspected (source of truth)

| Source | Read at | Key finding |
|--------|---------|-------------|
| `docs/tickets/K-013-consensus-stats-contract.md` | 2026-04-21 | AC + expected file change list is the contract |
| `docs/designs/TD-008-rfc-consensus-source-of-truth.md` | 2026-04-21 | Option C accepted by PM; fixture location A; CI drift job deferred |
| `backend/predictor.py` L271–437 | 2026-04-21 | `_projected_future_bars` + `compute_stats` real logic |
| `backend/main.py` L280–311 | 2026-04-21 | `/api/predict` calls `compute_stats(active, current_close, timeframe)` |
| `backend/models.py` | 2026-04-21 | `PredictStats.consensus_forecast_1h/1d: List[ForecastBar] = []` |
| `frontend/src/AppPage.tsx` L110–236 | 2026-04-21 | `computeDisplayStats` + `projectedFutureBars` + `displayStats` useMemo |
| `frontend/src/utils/aggregation.ts` | 2026-04-21 | `computeProjectedFutureBars` / `aggregateProjectedBarsTo1D` |
| `frontend/src/hooks/usePrediction.ts` L91–92 | 2026-04-21 | `consensusForecast1h/1d` mapped from backend `consensus_forecast_1h/1d` |
| `frontend/src/types.ts` | 2026-04-21 | `PredictStats` camelCase contract |

### 0.2 Ticket typos / path errata

| Ticket wording | Codebase reality | This doc adopts |
|------------|--------------|-----------|
| (no path errata) | — | — |

### 0.3 Scope Questions — pre-existing gap requires PM awareness

**SQ-013-01 (RETRACTED 2026-04-21 by Round 2 Fix 1 `853a8aa`; this paragraph kept solely as historical evidence):**

~~Backend `PredictStats.consensus_forecast_1h/1d` is currently always `[]` → consensus chart not displayed in full-set scenario (pre-existing).~~

**Correction (fact established by Round 2 Fix 1):**

- OLD base `b0212bb` `AppPage.tsx` L224-226 `displayStats` useMemo actually **unconditionally injects** `consensusForecast1h = projectedFutureBars` + `consensusForecast1d = projectedFutureBars1D` for **both full-set and subset branches**; backend `consensus_forecast_1h/1d` always being `[]` is a wire-level fact, but has no impact on user-observable chart render — frontend unconditionally overrides these two fields.
- The original design doc inferred "full-set branch goes through `appliedData.stats` → chart receives `[]` → not displayed", but this was a misjudgment based on reading only backend schema + `usePrediction.ts` fallback without cross-verifying OLD AppPage observable behavior; Round 1 `8442966` bound the injection only to the subset branch → full-set branch chart actually disappeared → triggering C-1 Critical.
- Round 2 Fix 1 `853a8aa` restored unconditional injection in `AppPage.tsx` (spread base stats + override the two fields); observable behavior now matches OLD base.
- **Correct pre-existing description:** `consensus_forecast_1h/1d` is **always `[]` at wire level** (backend doesn't populate), but **observable chart render is guaranteed by frontend `AppPage.tsx` injecting `projectedFutureBars` / `projectedFutureBars1D`**; both full-set and subset branches inject; subset branch additionally merges subset stats returned by `computeStatsFromMatches`. There is no "consensus chart not displayed in full-set" pre-existing bug.
- **Fixture impact (preserved):** `expected.consensus_forecast_1h/1d` is locked as `[]` uniformly in fixtures (snake_case, consistent with backend wire-level output); contract test only locks 4-bucket OrderSuggestion + `win_rate` + `mean_correlation`. Observable-render-layer `consensusForecast1h/1d` injection is `AppPage` responsibility; contract fixture does not cover.

**SQ-013-02 (informational, non-blocking): Should the fixture generator script be versioned?**

- Observation: ticket §Next-Step 2 instructs "use current backend `compute_stats` output as ground truth, export via `python3 -c "..."`".
- Issue: if the script is not versioned, when backend changes the algorithm → fixture drifts → tests fail → downstream cannot reproduce the ground truth.
- **This doc rules:** add `backend/tests/fixtures/generate_stats_contract_cases.py` (lightweight script, versioned), repeatable to regenerate JSON. See §3.3 and §4. If PM objects to versioning, downgrade to design-doc inline pseudo-code; not blocking Engineer.

---

## 1 Solution selection

### 1.1 Available options

TD-008 RFC compared Options A / B / C; PM 2026-04-18 ruled Option C. This design doesn't reopen options; it only further breaks down three sub-decisions within Option C:

| Sub-decision | Options | Choice |
|--------|------|-----|
| D1 Whether `statsComputation.ts` is a pure util (no React) | A. Pure util / B. Custom hook | **A pure util** (see §1.2 D1) |
| D2 Fixture generation method | A. One-time manual commit / B. Versioned generator script | **B generator script** (see §1.2 D2) |
| D3 How frontend reads fixture | A. `import` JSON (build-time) / B. `fs.readFileSync` (runtime) / C. `fetch` (network) | **A import JSON** (see §1.2 D3) |

### 1.2 Sub-decision Pre-Verdict and rationale

**D1: statsComputation.ts position — pure TypeScript util, no React dependency**

| Aspect | A. Pure util | B. Custom hook |
|------|-----------|---------------|
| Testability | Vitest unit test calls directly | Needs renderHook |
| TD-005 reusability | `usePredictionWorkspace()` can later call this util from inside hook | Hook nesting, unclear boundary |
| SSR compatibility | Yes | No |
| **Score (testability 0.4 + TD-005 reuse 0.4 + SSR 0.2)** | **9.0** | **5.0** |

Gap ≥ 1, choose A.

**D2: Fixture generation — versioned generator script**

| Aspect | A. Manual one-time commit | B. Versioned generator script |
|------|----------------------|---------------------|
| Initial generation cost | Low | Slightly higher (~20 lines Python) |
| Reproducibility when backend changes algorithm | Need to dig git history | One-shot rerun |
| Drift-prevention sync cost | High (manual calc) | Low |
| **Score (reproducibility cost 0.5 + sync cost 0.3 + initial cost 0.2)** | **5.5** | **8.5** |

Gap ≥ 1, choose B.

**D3: Frontend fixture read — `import` JSON (build-time)**

| Aspect | A. import JSON | B. fs.readFileSync | C. fetch |
|------|---------------|-------------------|---------|
| Path stability | Vite/Vitest support relative import | Needs Node API; OK in Vitest jsdom but indirect | Needs dev server |
| Speed when changing fixture | HMR | Needs rerun | Needs server |
| TypeScript types | Needs `resolveJsonModule: true` or `as const` | any | any |
| **Score (path stability 0.5 + speed 0.3 + types 0.2)** | **9.0** | **6.0** | **4.5** |

Gap ≥ 1, choose A. Need to confirm `tsconfig.json` has `"resolveJsonModule": true` (if not, Engineer adds; see §3.4).

---

## 2 Contract definition

### 2.1 Function signature (TypeScript)

```ts
// frontend/src/utils/statsComputation.ts
import { MatchCase, PredictStats } from '../types'
import { ProjectionBar } from './aggregation'

export interface StatsComputationResult {
  // 4-bucket + winRate + meanCorrelation (matches backend PredictStats, camelCase)
  stats: Omit<PredictStats, 'consensusForecast1h' | 'consensusForecast1d'>
  // Frontend-only: AppPage uses for StatsPanel ConsensusForecastChart and StatsByDay
  projectedFutureBars: ProjectionBar[]
}

/**
 * Subset stats computation. Pure function — no React, no I/O, no Date.now().
 *
 * Mirrors backend `compute_stats(matches, current_close, timeframe)` for the
 * 4-bucket OrderSuggestion + win_rate + mean_correlation outputs. Contract
 * fixture `backend/tests/fixtures/stats_contract_cases.json` locks bit-exact
 * parity (1e-6 tolerance) between backend `compute_stats` and this function.
 *
 * Additionally returns `projectedFutureBars` (frontend-only extension) that
 * AppPage merges into `displayStats.consensusForecast1h/1d` for chart render;
 * this extension is NOT part of the contract fixture.
 *
 * @param matches subset of MatchCase (>= 1)
 * @param currentClose last bar close price of user input
 * @param timeframe '1H' | '1D' — passed to occurrenceWindow label
 * @param lastBarTime optional; user input last bar time, used for UTC+8 label
 * @returns stats + projectedFutureBars; throws if matches empty OR bars < 2
 */
export function computeStatsFromMatches(
  matches: MatchCase[],
  currentClose: number,
  timeframe: '1H' | '1D',
  lastBarTime?: string,
): StatsComputationResult
```

### 2.2 Boundary behavior contract

Each must be explicitly handled in implementation; **no "TBD"**:

| Boundary | Contract behavior |
|------|---------|
| `matches.length === 0` | `throw new Error('At least one match is required to compute statistics.')` — matches backend `compute_stats` message |
| `matches.length === 1` (single-match) | If its `futureOhlc.length < 2` → `throw new Error('At least two future bars are required to build order suggestions.')` — matches backend |
| `matches.length >= 1` but `projectedFutureBars.length < 2` | Same throw |
| `currentClose === 0` or NaN | `throw new Error('currentClose must be a positive finite number.')` |
| `matches[i].historicalOhlc` empty | The match is filtered inside `computeProjectedFutureBars` (base=undefined); if all are filtered, `projectedFutureBars.length === 0`, falls through to previous row |
| `correlation` is `null` / undefined | Filtered out; still computes `meanCorrelation`; all null → `meanCorrelation = 0` (equivalent to backend `statistics.mean(corrs)` logic; backend would raise StatisticsError on empty corrs; this doc agrees the frontend returns 0 and notes in fixture Edge case #4 for PM future ruling on convergence) |
| `lastBarTime` not provided | `occurrenceWindow` falls back to `Hour +N` / `Day +N` (matches backend `_future_window_label`) |

**AppPage call-site responsibilities:**
- AppPage `displayStats` useMemo: subset branch calls util; if it throws, fallback to `appliedData.stats` (consistent with current `if (!computed) return appliedData.stats` behavior)
- `consensusForecast1h = projectedFutureBars` (ProjectionBar's `time` is UTC+8 "MM/DD HH:MM" display format, conforms to `ForecastBar.time: string` loose type; StatsPanel only renders, doesn't parse)
- `consensusForecast1d = aggregateProjectedBarsTo1D(projectedFutureBars)` (additionally called by AppPage outside util; util doesn't embed this step to preserve purity)

### 2.3 Field mapping table (snake_case ↔ camelCase)

**ContractInputCase (fixture `input` field)**

| Fixture JSON (snake_case) | Frontend converts to (camelCase) | Note |
|-------------------------|--------------------------|------|
| `matches` | `matches` | array, each item with the following MatchCase fields |
| `matches[i].id` | `matches[i].id` | same name |
| `matches[i].correlation` | `matches[i].correlation` | same name |
| `matches[i].historical_ohlc` | `matches[i].historicalOhlc` | `OhlcBar[]` |
| `matches[i].future_ohlc` | `matches[i].futureOhlc` | `OhlcBar[]` |
| `matches[i].historical_ohlc_1d` | `matches[i].historicalOhlc1d` | `OhlcBar[]` (may be empty) |
| `matches[i].future_ohlc_1d` | `matches[i].futureOhlc1d` | `OhlcBar[]` (may be empty) |
| `matches[i].start_date` | `matches[i].startDate` | string |
| `matches[i].end_date` | `matches[i].endDate` | string |
| `matches[i].historical_ma99` | `matches[i].historicalMa99` | `(number \| null)[]` (fixture may omit; default []) |
| `matches[i].future_ma99` | `matches[i].futureMa99` | same |
| `matches[i].historical_ma99_1d` | `matches[i].historicalMa991d` | same |
| `matches[i].future_ma99_1d` | `matches[i].futureMa991d` | same |
| `current_close` | `currentClose` | float |
| `timeframe` | `timeframe` | `"1H"` \| `"1D"` |

**ContractExpectedCase (fixture `expected` field, = backend `PredictStats` output)**

| Fixture JSON (snake_case) | Frontend converted (camelCase) | Note |
|-------------------------|--------------------|------|
| `highest.label` | `highest.label` | string |
| `highest.price` | `highest.price` | float |
| `highest.pct` | `highest.pct` | float (backend `round(..., 2)`) |
| `highest.occurrence_bar` | `highest.occurrenceBar` | int |
| `highest.occurrence_window` | `highest.occurrenceWindow` | string (e.g. `"Hour +3"` / `"Day +5"`) |
| `highest.historical_time` | `highest.historicalTime` | string `"Consensus"` |
| `second_highest` / `second_lowest` / `lowest` | `secondHighest` / `secondLowest` / `lowest` | same structure as highest |
| `win_rate` | `winRate` | float (backend `round(..., 4)`) |
| `mean_correlation` | `meanCorrelation` | float (backend `round(..., 4)`) |
| `consensus_forecast_1h` | `consensusForecast1h` | wire-level fixed `[]` (see §0.3 SQ-013-01 RETRACTED correction); **not part of contract test compare**; observable render guaranteed by `AppPage` injecting `projectedFutureBars` |
| `consensus_forecast_1d` | `consensusForecast1d` | same; observable injected by `AppPage` from `projectedFutureBars1D` |

**Key conversion utility:** Frontend contract test uses inline helper `snakeToCamelStats()` for 6 keys (highest / second_highest / second_lowest / lowest + win_rate + mean_correlation + each OrderSuggestion's occurrence_bar/occurrence_window/historical_time). **No lodash/camelcase-keys** (bundle cost > 30 lines of self-written). Conversion logic includes regression case: number-suffix keys like `consensus_forecast_1h` → `consensusForecast1h` (whitelist mapping, not generic algo).

---

## 3 Fixture JSON Schema

### 3.1 JSON schema (fixture file format)

**File:** `backend/tests/fixtures/stats_contract_cases.json`

```jsonc
[
  {
    "name": "all_matches_full_set",
    "description": "Full-set baseline — 3 matches, each future_ohlc has 3 bars (≥2 enforced)",
    "input": {
      "matches": [
        {
          "id": "match_0",
          "correlation": 0.9523,
          "historical_ohlc": [
            {"open": 2000, "high": 2010, "low": 1990, "close": 2005, "time": "2024-01-01 00:00"},
            {"open": 2005, "high": 2015, "low": 1995, "close": 2010, "time": "2024-01-01 01:00"}
          ],
          "future_ohlc": [
            {"open": 2010, "high": 2030, "low": 2005, "close": 2025, "time": "2024-01-01 02:00"},
            {"open": 2025, "high": 2040, "low": 2020, "close": 2035, "time": "2024-01-01 03:00"},
            {"open": 2035, "high": 2045, "low": 2025, "close": 2028, "time": "2024-01-01 04:00"}
          ],
          "historical_ohlc_1d": [],
          "future_ohlc_1d": [],
          "start_date": "2024-01-01 00:00",
          "end_date": "2024-01-01 04:00"
        }
        /* ...match_1, match_2 omitted; actual must contain 3 concrete matches */
      ],
      "current_close": 2100,
      "timeframe": "1H"
    },
    "expected": {
      "highest": {
        "label": "Highest",
        "price": /* generator-computed */,
        "pct": /* generator-computed */,
        "occurrence_bar": /* generator */,
        "occurrence_window": "Hour +N",
        "historical_time": "Consensus"
      },
      "second_highest": { /* ... */ },
      "second_lowest": { /* ... */ },
      "lowest": { /* ... */ },
      "win_rate": /* generator */,
      "mean_correlation": /* generator */,
      "consensus_forecast_1h": [],
      "consensus_forecast_1d": []
    }
  },
  /* ...Case 2 (subset_deselect_one), Case 3 (single_match_two_bars) */
]
```

### 3.2 Three cases that must be covered (per AC-013-FIXTURE)

| # | name | Coverage intent | input.matches composition | Purpose |
|---|------|---------|-------------------|------|
| 1 | `all_matches_full_set` | Full-set baseline | 3 matches × 3 future bars each, correlation distributed [0.95, 0.87, 0.72] | Verifies "deselect empty" both ends equal; when `appliedSelection == all matches` AppPage uses `appliedData.stats` without calling util, but contract test still verifies "if util is called with full set, result = backend full-set output" — i.e. oracle equivalence |
| 2 | `subset_deselect_one` | Subset matches | 2 matches (first 2 from Case 1), others same | Verifies "deselect 3rd" both ends equal — actual K-013 runtime scenario |
| 3 | `single_match_two_bars` | Single match + future_ohlc exactly 2 bars boundary | 1 match × 2 future bars (≥2 minimum boundary) | Locks "≥2 bars to build suggestion" critical; confirms sorted_highs[1] / sorted_lows[1] each picks single bar's high/low when len==2 |

Edge Case #4 (non-mandatory, if generator time permits):
| # | name | Coverage intent |
|---|------|---------|
| 4 | `all_correlations_null_fallback` | All matches `correlation = null` — verifies §2.2 "all null → meanCorrelation = 0" frontend contract; **but backend `statistics.mean([])` would raise StatisticsError**, so adding this case requires `expected.expected_error` structure rather than `expected` result. **This ticket does not implement Case 4**, only notes as future work in doc. |

### 3.3 Generator script (versioned)

**File:** `backend/tests/fixtures/generate_stats_contract_cases.py`

```python
# Pseudo-code — Engineer implements per this structure
# Responsibility: feed hardcoded matches into compute_stats, serialize output to JSON
#                 not dependent on MOCK_HISTORY / find_top_matches, fully deterministic
from predictor import compute_stats
from models import MatchCase, OHLCBar
import json

def build_case_1():
    matches = [MatchCase(...), MatchCase(...), MatchCase(...)]  # hardcoded 3 matches
    stats = compute_stats(matches, current_close=2100, timeframe='1H')
    return {
        'name': 'all_matches_full_set',
        'description': '...',
        'input': {
            'matches': [m.model_dump() for m in matches],
            'current_close': 2100,
            'timeframe': '1H',
        },
        'expected': stats.model_dump(),  # includes consensus_forecast_1h/1d = []
    }

def build_case_2():  # subset (first two matches from Case 1)
    ...

def build_case_3():  # single match × 2 future bars
    ...

if __name__ == '__main__':
    cases = [build_case_1(), build_case_2(), build_case_3()]
    with open('backend/tests/fixtures/stats_contract_cases.json', 'w') as f:
        json.dump(cases, f, indent=2)
```

**Run:** `cd backend && python3 tests/fixtures/generate_stats_contract_cases.py`

**Gate:** the generator script itself is not covered by contract test (it's test setup, not test target); after backend modifies `compute_stats`, Engineer reruns generator → `git diff fixtures/*.json` to check semantic plausibility → commit in same batch; if frontend tests fail due to new expected, also update camelCase mapping (if new fields).

### 3.4 Frontend fixture read

**Path:** `frontend/src/__tests__/statsComputation.test.ts`

```ts
// pseudo-code
import fixtures from '../../../backend/tests/fixtures/stats_contract_cases.json'
// Above needs tsconfig.json with "resolveJsonModule": true; Engineer checks; enable if absent
// Vite / Vitest both support import JSON, no special loader needed
```

**Engineer must verify:** `frontend/tsconfig.json` → `compilerOptions.resolveJsonModule: true`. If currently disabled, enabling is within K-013 scope (non-destructive).

---

## 4 File Change List — Before / After

### 4.1 New files

| Path | Responsibility | Estimated size |
|------|------|-------|
| `frontend/src/utils/statsComputation.ts` | Export `computeStatsFromMatches()` pure util; type `StatsComputationResult`; no React / axios / Date.now() | ~90 lines |
| `frontend/src/__tests__/statsComputation.test.ts` | Vitest parametrize: read fixture JSON, run `computeStatsFromMatches` for 3 cases and assert bit-exact (1e-6 tolerance) + camelCase converter helper + helper unit test (`consensus_forecast_1h` → `consensusForecast1h`) | ~80 lines |
| `backend/tests/fixtures/stats_contract_cases.json` | 3-case fixture (produced by generator script); snake_case | ~200 lines (JSON) |
| `backend/tests/fixtures/generate_stats_contract_cases.py` | Deterministic script; calls `compute_stats` to produce `expected` | ~70 lines |
| `backend/tests/fixtures/__init__.py` | Empty file; makes `tests/fixtures/` an importable package (pytest doesn't need it but editor-friendly) | 0 lines |

### 4.2 Modified files

| Path | Before | After |
|------|--------|-------|
| `frontend/src/AppPage.tsx` | L110–125 inline `computeDisplayStats`; L211–222 `projectedFutureBars` useMemo; L224–236 `displayStats` useMemo subset branch inline recompute | Remove L110–125 inline function; L211–222 `projectedFutureBars` useMemo changes to: in subset branch, call util and take `result.projectedFutureBars`; `displayStats` useMemo subset branch calls `computeStatsFromMatches`, takes `result.stats` + merges `consensusForecast1h/1d` (from util-returned projectedFutureBars + `aggregateProjectedBarsTo1D`). **Full-set branch unchanged** (still uses `appliedData.stats`) |
| `backend/predictor.py` | `compute_stats` / `_projected_future_bars` no semantic comments | Add docstrings: `compute_stats` head notes "returns full-set baseline; subset computed by frontend `frontend/src/utils/statsComputation.ts::computeStatsFromMatches`; both locked to parity by `backend/tests/fixtures/stats_contract_cases.json`"; same for `_projected_future_bars` |
| `backend/tests/test_predictor.py` | 44 tests, no contract fixture | Add a `@pytest.mark.parametrize` test `test_compute_stats_contract_fixture(case)`: reads same JSON, calls `compute_stats(**input)` for each case, asserts field values bit-exact (math.isclose rel_tol=1e-6) |
| `frontend/tsconfig.json` | May lack `resolveJsonModule` | If absent, add `"resolveJsonModule": true` (if present, leave alone) |

### 4.3 Files not touched (explicit boundary)

| Path | Why not |
|------|---------|
| `backend/main.py` `/api/predict` route | API schema unchanged (AC-013-API-COMPAT) |
| `backend/models.py` `PredictStats` / `ForecastBar` | Type unchanged |
| `frontend/src/types.ts` | `PredictStats` type unchanged |
| `frontend/src/hooks/usePrediction.ts` | snake→camel mapping unchanged (`consensusForecast1h/1d` still falls back to `[]`) |
| `frontend/src/components/StatsPanel.tsx` | Render contract unchanged (subset branch gets `consensusForecast1h/1d` from util; full-set branch still empty array — pre-existing behavior) |
| `frontend/src/utils/aggregation.ts` `computeProjectedFutureBars` / `aggregateProjectedBarsTo1D` | Util internal call; no relocation to avoid affecting other tests |
| `frontend/e2e/*.spec.ts` | mock payload shape unchanged; `future_ohlc` ≥ 2 convention preserved (existing mocks already comply) |
| `frontend/src/__tests__/AppPage.test.tsx` | Behavior tests unchanged — relocating `computeDisplayStats` has no externally-observable difference |

---

## 5 Shared Component boundary

### 5.1 `statsComputation.ts` placement

| Aspect | Placement |
|------|------|
| Category | **Pure utility module** (not React component, not custom hook) |
| Dependencies | `../types` (MatchCase / PredictStats / OrderSuggestion), `./aggregation` (ProjectionBar + `computeProjectedFutureBars`) |
| Forbidden | React / useState / useMemo / axios / fetch / localStorage / Date.now() / Math.random() / console.log |
| Called by | (a) `AppPage.tsx::displayStats` useMemo subset branch; (b) `__tests__/statsComputation.test.ts` contract test; (c) **future** TD-005 `usePredictionWorkspace()` hook (see §5.2) |
| Who can call | Any pure synchronous context; **must not** replace axios within useEffect / callback |
| Can it throw | Yes (contract in §2.2); caller must try-catch |

### 5.2 Boundary with TD-005 `usePredictionWorkspace()`

K-013 only extracts util; TD-005 not started. But the util prepares for TD-005's hook split. Boundary:

| Responsibility | Owner | Note |
|------|------|------|
| Input OHLC management / MA99 loading / API call | Future `useOfficialInput()` + `useHistoryUpload()` hooks | K-013 doesn't touch; currently in AppPage.tsx |
| `appliedData` / `appliedSelection` state | Future `usePredictionWorkspace()` hook | K-013 doesn't touch |
| `displayStats` / `projectedFutureBars` / `projectedFutureBars1D` derivation | Future `usePredictionWorkspace()` hook | K-013 keeps useMemo in AppPage; TD-005 will move into hook |
| **subset stats math core** | **K-013 `statsComputation.ts` util** | **Extracted now; future hook calls this util** |
| `StatsPanel` render | `StatsPanel` component | K-013 doesn't touch |

**TD-005 Architect (future) must comply:** `statsComputation.ts` should not be merged into the hook; preserve as util — so a future second use case (e.g. CLI tool / SSR / other page) can directly import.

### 5.3 Call tree (Before → After)

**Before (pre-K-013):**
```
AppPage.tsx
  ├─ computeDisplayStats (inline function) — recomputes 4 suggestions
  ├─ projectedFutureBars useMemo — calls computeProjectedFutureBars(aggregation.ts)
  └─ displayStats useMemo
      ├─ subset: uses computeDisplayStats(matches, projectedFutureBars, currentClose)
      └─ full: uses appliedData.stats (backend)
```

**After (post-K-013):**
```
AppPage.tsx
  ├─ projectedFutureBars useMemo ─┐
  └─ displayStats useMemo         │
      ├─ subset branch ───────────┼──→ statsComputation.ts::computeStatsFromMatches
      │                           │       └─ internally calls aggregation.ts::computeProjectedFutureBars
      │                           │       └─ returns { stats, projectedFutureBars }
      └─ full branch → appliedData.stats (unchanged)

Unified projectedFutureBars: AppPage useMemo changes to "call util, take result.projectedFutureBars",
avoiding double call to computeProjectedFutureBars.
```

---

## 6 Route Impact Table

This ticket does not touch `index.css` / `tailwind.config.js` / sitewide CSS variable; no visual change expected. Still confirm per persona-rule:

| Route | Status | Rationale |
|-------|--------|----------|
| `/` | **unaffected** | HomePage doesn't read `statsComputation.ts`; doesn't reference `displayStats` |
| `/about` | **unaffected** | AboutPage pure static content |
| `/diary` | **unaffected** | DiaryPage reads `public/diary.json`; no stats |
| `/app` | **affected (behavior-equivalent)** | AppPage now computes subset stats via util; output values bit-exact identical to existing inline `computeDisplayStats` (locked by contract fixture); visual, UX, API contract entirely unchanged |
| `/business-logic` | **unaffected** | BusinessLogicPage pure content |
| `/*` fallback | **unaffected** | Navigate to `/` |

**must-be-isolated:** None.
**Visual verification strategy:** After running full 45+ Playwright E2E on `/app`, Engineer manually opens dev server `/app`, screenshots stats panel, compares against K-012 QA-stored baseline (no baseline → confirm via code review that StatsPanel render path is identical).

---

## 7 Implementation order and verification gates

Echoing ticket §Next-Step's 6 steps, each step marks a gate. Engineer follows step numbering.

| Step | Action | Verification gate | Pass condition |
|------|------|----------|---------|
| 1 | Add `frontend/src/utils/statsComputation.ts` (full implementation of `computeStatsFromMatches`); AppPage.tsx **not yet modified** | `npx tsc --noEmit` | exit 0; new file imports clean |
| 2 | Add `backend/tests/fixtures/__init__.py` (empty) + `generate_stats_contract_cases.py` + run generator to produce `stats_contract_cases.json` | `python3 -m py_compile backend/tests/fixtures/generate_stats_contract_cases.py` → `python3 backend/tests/fixtures/generate_stats_contract_cases.py` | both exit 0; JSON output contains 3 cases |
| 3 | Add `frontend/src/__tests__/statsComputation.test.ts` (read fixture, run 3 cases) | `cd frontend && npm test -- statsComputation` | Vitest pass; each of 3 cases passes 6 assertions |
| 4 | Add `backend/tests/test_predictor.py` contract parametrize test | `cd backend && python3 -m pytest tests/test_predictor.py -k contract` | 3 cases all pass |
| 5 | Rewrite `AppPage.tsx`: remove inline `computeDisplayStats`; `projectedFutureBars` + `displayStats` useMemo call util | `npx tsc --noEmit` + `cd frontend && npm test` (all Vitest) | tsc exit 0; AppPage.test.tsx + all other Vitest pass |
| 6 | `backend/predictor.py` adds docstrings (`compute_stats` / `_projected_future_bars`) | `python3 -m py_compile backend/predictor.py` + `cd backend && python3 -m pytest` | all pytest (44 + 3 contract + others) pass |
| 7 | Regression: frontend runs `/playwright` | `cd frontend && npx playwright test` | all 45+ E2E pass |
| 8 | Final smoke: open dev server, eyeball `/app` prediction flow → full-set → deselect 1 → deselect all 3 operations | Manual visual: StatsPanel 4 order cards numbers reactively change | No runtime error; numbers change reasonably |

**Failure handling:**
- Step 3 / 4 fail → diff frontend/backend implementation first; do NOT modify fixture to fudge pass; if confirmed algorithmic difference falls under K-009-class bug (subset scenario both ends actually differ), halt immediately and report PM (ticket §Next-Step "Implementation Rules" item 3)
- Step 5 `tsc` fail → typically a type-mapping oversight; do NOT use `any` to bypass; if type really doesn't match (e.g. `OhlcBar.time` is optional in MatchCase but util needs it), report Architect

---

## 8 API schema invariance proof

### 8.1 Before / After diff

| Aspect | Before | After | Diff |
|------|--------|-------|------|
| `POST /api/predict` request body schema | `PredictRequest` (`ohlc_data` / `selected_ids` / `timeframe` / `ma99_trend_override?`) | same | **empty** |
| `POST /api/predict` response body schema | `PredictResponse` (`matches` / `stats` / `query_ma99_*` / `query_ma99_gap_*`) | same | **empty** |
| `PredictStats` fields | 4 × OrderSuggestion + `win_rate` + `mean_correlation` + `consensus_forecast_1h` + `consensus_forecast_1d` | same (wire-level `consensus_forecast_*` stays `[]`; observable render injected by AppPage — see §0.3 RETRACTED correction) | **empty** |
| `compute_stats()` signature | `(matches: List[MatchCase], current_close: float, timeframe: str = '1H') -> PredictStats` | same | **empty** |
| Return-value range | 4-bucket OrderSuggestion values determined by algorithm | same (fixture locks bit-exact) | **empty** |
| usePrediction.ts camelCase mapping | L91–92 `consensus_forecast_*` falls back to `[]` | same | **empty** |

### 8.2 Verification methods

- **AC-013-API-COMPAT proof:** `grep -n "class PredictRequest\|class PredictResponse\|class PredictStats\|class ForecastBar" backend/models.py` → diff between HEAD and K-013 Engineer final commit; **these 5 class blocks must have 0 lines changed** (only acceptable change is comment / docstring)
- **E2E mock unchanged:** `frontend/e2e/*.spec.ts` currently mock `consensus_forecast_1h/1d` not provided (or provided as `[]`); after K-013 backend still returns `[]` for this field → mock unchanged
- **Pre-commit Engineer check command:** `git diff main -- backend/models.py` — if output contains only docstring / comment, API schema invariance holds

---

## 9 Risks and notes

### 9.1 Security considerations

| Item | Assessment |
|------|------|
| Auth / JWT impact | **None** — `/api/predict` route auth requirement unchanged (public endpoint) |
| env var / secret exposure | **None** — no new env vars |
| Injection (JSON path, SQL, XSS) | **None** — fixture path is build-time import, not user input |
| DoS (huge fixture) | **Low** — 3 cases, file <5 KB |

### 9.2 Common mistakes

| Aspect | Reminder |
|------|------|
| snake→camel key conversion | **Pay special attention to number-suffix keys**: `consensus_forecast_1h` → `consensusForecast1h`, `historical_ma99_1d` → `historicalMa991d` (TD-008 RFC Retrospective flagged). Do NOT use generic `replace(/_[a-z]/g, m => m[1].toUpperCase())` (it would convert `_1h` to `1h`, but you have to verify the post-digit `h` isn't dropped). Whitelist mapping is safest |
| Float rounding | Backend `round(price * 100) / 100` (Python `round` banker's rounding) vs frontend `Math.round(x * 100) / 100` (half-to-even but JS actually uses half-away-from-zero). Critical values (last digit .005) may differ by 1 cent. **Mitigation:** fixture uses non-tricky values; contract test tolerance 1e-6; if .005-boundary difference actually surfaces, replace strict compare with `toBeCloseTo(expected, 6)` |
| `correlation === null` path | Backend `statistics.mean([])` raises; frontend filters then falls back to 0 on empty array. **This ticket doesn't test Edge Case #4** (see §3.2); but Engineer must confirm util **does NOT throw** in empty-correlations scenario (returns 0), otherwise full-set branch fallback would permanently activate |
| JSON import TypeScript type | Vitest + `resolveJsonModule: true` infers JSON as its structural literal type; if needed, cast `as unknown as ContractCase[]` |
| Playwright mock `future_ohlc` ≥ 2 | Existing mocks comply; if Engineer adds new mocks, do NOT regress to 1 bar (would silently bypass) |
| Dead code after removing inline `computeDisplayStats` | After removal, `buildProjectedSuggestion` is still needed by `computeStatsFromMatches` → **move into util file**; `computeStatsByDay` logic **unchanged** (bound to displayStatsByDay; out of this ticket's scope) |

### 9.3 Known Gap (PM aware, not blocking Engineer)

| # | Gap | Source | Disposition this ticket |
|---|-----|------|---------|
| ~~KG-013-01~~ | ~~Full-set branch `consensusForecast1h/1d` is `[]`, StatsPanel `ConsensusForecastChart` empty~~ | **Superseded by Round 2 Fix 1 `853a8aa` (2026-04-21)** — OLD base `b0212bb` L224-226 actually injects unconditionally; this ticket's Round 1 mistakenly bound to subset-only injection causing C-1; Fix 1 restores OLD behavior, observable chart visible in both branches. Premise retracted; not a pre-existing gap | Closed — observable no longer has this gap; wire-level `consensus_forecast_*` still returns `[]` by design (AppPage layer injects observable); not considered debt |
| KG-013-02 | Float rounding theoretical difference at .005 boundary | JS vs Python round semantics | tolerance 1e-6 absorbs; rarely encountered in production data (correlation / price multi-decimal) |
| KG-013-03 | Edge Case #4 (all-null correlations) not in fixture | §3.2 | design note; future work |
| KG-013-04 | CI contract drift job deferred | PM 2026-04-18 ruling | This cycle relies on PR reviewer + both ends running fixture auto-fail |

---

## 10 Refactorability Checklist

- [x] **Single responsibility** — `statsComputation.ts` only handles subset stats computation; AppPage only orchestrates
- [x] **Interface minimization** — `computeStatsFromMatches` takes only 4 params (matches/currentClose/timeframe/lastBarTime?); `StatsComputationResult` two fields
- [x] **Unidirectional dependency** — AppPage → statsComputation → aggregation → types; no cycle
- [x] **Replacement cost** — If backend reverts to backend-only stats algorithm (Option A), replacing util only touches AppPage.tsx's one import + subset branch logic; fixture can be discarded directly (separate file)
- [x] **Clear test entry point** — `computeStatsFromMatches(matches, currentClose, timeframe, lastBarTime)` pure function; contract fixture is the spec
- [x] **Change isolation** — UI unchanged (StatsPanel unchanged); API unchanged (/api/predict unchanged); only internal implementation moved

## 11 All-Phase Coverage Gate

This ticket is a single refactor ticket (no multi-phase).

| Phase | Backend API | Frontend Routes | Component Tree | Props Interface |
|-------|------------|----------------|----------------|----------------|
| N/A (single-phase) | ✅ (§8, invariance proof) | ✅ (§6 Route Impact Table) | ✅ (§5 call tree Before/After) | ✅ (§2 Contract definition) |

---

## Self-Diff Verification

- Section edited: `agent-context/architecture.md` — (a) `Data Flow` second projected bars block (+ fixture-source note); (b) `Consensus Stats Source of Truth` section fixture bullets enriched (added generator script); (c) Directory Structure adds `utils/statsComputation.ts`, `__tests__/statsComputation.test.ts`, `backend/tests/fixtures/*`; (d) Changelog prepend one entry
- Source of truth:
  - §4 File Change List (this design doc)
  - ticket K-013 §Expected file changes
  - `ls backend/tests/` / `ls frontend/src/utils/` / `ls frontend/src/__tests__/` (executed; current state confirmed)
- Row count comparison:
  - Directory Structure `frontend/src/utils/`: Before 4 files (aggregation/analytics/api/auth/time) vs After 5 files (+ statsComputation) — 5 vs 5 ✓ (after correcting time.ts undercount)
  - Directory Structure `frontend/src/__tests__/`: Before 6 files vs After 7 files (+ statsComputation.test) — 7 vs 7 ✓
  - Directory Structure `backend/tests/`: Before 4 files + no fixtures dir vs After 4 files + `fixtures/` subdir (with `__init__.py` / `generate_stats_contract_cases.py` / `stats_contract_cases.json`) — added 1 dir + 3 files ✓
  - Changelog adds one "2026-04-21 (Architect, K-013 design)" entry — 1 row ✓
- Same-file cross-table sweep: `grep 'statsComputation\|stats_contract_cases\|computeStatsFromMatches' agent-context/architecture.md` — expected hits in 4 sections (Summary / Directory Structure utils / Directory Structure backend tests / Consensus Stats Source of Truth / Changelog); actual hits per architecture.md edit diff; cell-by-cell match ✓
- Discrepancy: if `tests/fixtures/` directory didn't pre-exist in Directory Structure block, this is an additive entry, an extension not a change — not counted as discrepancy

---

## Retrospective

**Where most time was spent:** §0 Pre-Design Audit — read `compute_stats` / `_projected_future_bars` / `computeDisplayStats` / `computeProjectedFutureBars` / `PredictStats` real implementations file by file, confirming a **pre-existing gap (SQ-013-01: consensus_forecast_1h/1d currently always `[]`)**. If this gap weren't explicitly flagged in design doc, Engineer might "fix it casually" during implementation and expand scope; or Reviewer might mistake it for a regression introduced by K-013. Time spent writing it as SQ and pinning in §0 to avoid three-party consensus drift.

**Which decisions needed revision:**
- Initial draft considered placing fixture in `frontend/src/__tests__/fixtures/` (frontend-local), then retracted to follow PM 2026-04-18 ruling A (place under `backend/tests/fixtures/`). Ruling is authoritative, not Architect recommendation; cannot override.
- Initial draft considered writing `statsComputation.ts` as a "second-layer util" receiving `projectedFutureBars` (continuing AppPage's current 2-step structure), finally changed to util internally calling `computeProjectedFutureBars` and returning in `StatsComputationResult` once, avoiding AppPage's double call. Trade-off: util adds one layer of coupling to `aggregation.ts`, in exchange for AppPage's single call site.

**Next-time improvement:** When reading "backend type field has default value `[]`", immediately `grep` all producers of that field — this time it took ~5 min to discover that backend never populates `consensus_forecast_1h/1d`; if I had grepped `consensus_forecast_1h =` or `consensus_forecast_1h:` across all backend/ producer locations from the start, I'd have confirmed within 3 seconds. Next time when designing cross-layer contract, list "who fills, when fills, when empty" check for model fields as §0 hard step.

**2026-04-21 Post-Round 2 addendum (added after Architect's SQ premise was overturned):** Backend producer `grep` is not enough — must also `git show <base-commit>:<frontend-file>` to read the observable consumer's actual injection logic. This ticket's §0 SQ-013-01 only ran backend producer grep + frontend fallback mapping check, never reading OLD AppPage.tsx L224-226 actual useMemo body, leading the premise "consensus chart not displayed in full-set" to be wrongly written as a pre-existing gap in the design doc. Round 2 Code Review backfilled "RETRACTED" sections + "Observable override guaranteed by AppPage" text in `docs/designs/K-013-consensus-stats-ssot.md` and `agent-context/architecture.md` to prevent the next reader from inheriting the wrong premise. Next time when designing cross-layer contract, hard step is upgraded to three: (1) backend producer grep, (2) frontend consumer grep, (3) observable override useMemo body line-by-line dry-run (`git show`) — missing any one, the SQ premise must not be written into design doc.
