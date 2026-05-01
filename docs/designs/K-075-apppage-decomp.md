---
title: K-075 — AppPage.tsx Decomposition RFC
ticket: K-075
phase: 1 (Architect RFC)
status: approved
created: 2026-05-02
visual-spec: N/A — reason: visual-delta = no (pure refactor, no UI change)
---

## 0 Scope & Decision Log

This RFC covers TD-005 (AppPage.tsx 517-line over-responsibility) and TD-004
(MatchList PredictorChart stale chart bug) in a single delivery per SSOT RFC
ordering. No UI surface changes; all Playwright specs must pass unmodified.

**Boundary pre-emption decisions logged here:**
- BQ-075-01: `parseOfficialCsvFile` is currently exported from `AppPage.tsx` and
  imported by `frontend/src/__tests__/parseOfficialCsvFile.test.ts` as
  `import { parseOfficialCsvFile } from '../AppPage'`. After the move to
  `utils/officialCsvParsing.ts`, the test import path must be updated to
  `from '../utils/officialCsvParsing'`. This is an Engineer-handled same-ticket
  update; no PM ruling needed.

---

## §1 Hook Boundaries

### State and handler assignment table

| Symbol | Current location in AppPage.tsx | Assigned hook |
|--------|--------------------------------|---------------|
| `ohlcData` / `setOhlcData` | `useState<OHLCRow[]>` | `useOfficialInput` |
| `viewTimeframe` / `setViewTimeframe` | `useState<'1H' \| '1D'>` | `useOfficialInput` |
| `loadError` / `setLoadError` | `useState<string \| null>` | `useOfficialInput` |
| `sourcePath` / `setSourcePath` | `useState<string>` | `useOfficialInput` |
| `maLoading` / `setMaLoading` | `useState<boolean>` | `useOfficialInput` |
| `queryMa99` / `setQueryMa99` | `useState<(number \| null)[]>` | `useOfficialInput` |
| `queryMa99Gap` / `setQueryMa99Gap` | `useState<Ma99Gap \| null>` | `useOfficialInput` |
| `handleOfficialFilesUpload` | function, calls computeMa99 | `useOfficialInput` |
| `handleCellChange` | function, mutates ohlcData | `useOfficialInput` |
| `handleTimeframeChange` | async, calls computeMa99 | `useOfficialInput` |
| `historyInfo` / `setHistoryInfo` | `useState<HistoryInfo \| null>` | `useHistoryUpload` |
| fetch `useEffect` for `/api/history-info` | side effect, no deps | `useHistoryUpload` |
| `matches` / `setMatches` | `useState<MatchCase[]>` | `usePredictionWorkspace` |
| `tempSelection` / `setTempSelection` | `useState<Set<string>>` | `usePredictionWorkspace` |
| `appliedSelection` / `setAppliedSelection` | `useState<Set<string>>` | `usePredictionWorkspace` |
| `appliedData` / `setAppliedData` | `useState<{matches, stats, inputs}>` | `usePredictionWorkspace` |
| `resetPredictionState` | function, resets 6 pieces of state | `usePredictionWorkspace` |
| `handleToggle` | function, toggles tempSelection | `usePredictionWorkspace` |
| `handlePredict` | async, calls predict + sets all result state | `usePredictionWorkspace` |

### useMemo and derived state assignment

| Derived value | Consuming hook or residual AppPage |
|--------------|-----------------------------------|
| `ohlcComplete` | `useOfficialInput` (exposed in return) |
| `completedRows` | `useOfficialInput` (internal) |
| `apiRows` | `useOfficialInput` (exposed in return) |
| `displayMatches` | `usePredictionWorkspace` (exposed) |
| `disabledReason` | AppPage residual (depends on maLoading from useOfficialInput + ohlcComplete + matches/hasSelection from usePredictionWorkspace) |
| `workspace` (projectedFutureBars, displayStats) | AppPage residual — depends on appliedData/appliedSelection/viewTimeframe across two hooks; extracted only when cross-hook deps are resolved |
| `displayStatsByDay` | AppPage residual |
| `isDirty` | AppPage residual |

**Design rationale for residual useMemos:** `workspace`, `displayStatsByDay`, and `isDirty`
depend on state from both `useOfficialInput` (viewTimeframe, appliedData.inputs close price)
and `usePredictionWorkspace` (appliedData, appliedSelection, tempSelection). Extracting them
into a fourth hook creates a circular import or requires passing too many arguments. Keeping
them in AppPage residual is correct per Refactorability Checklist item "unidirectional
dependency" — AppPage composes all three hooks, cross-hook computation lives at composition root.

### usePrediction.ts boundary preserved

`usePrediction.ts` exports `predict` and `computeMa99`. These are passed as arguments into
`useOfficialInput` and `usePredictionWorkspace` (constructor injection pattern) — the hooks do
not call `usePrediction` internally to avoid double-instantiation. AppPage calls `usePrediction()`
once, then passes `{ predict, computeMa99 }` to the relevant hooks. This preserves the
single-instance guarantee and the K-013 contract boundary.

### Cross-hook dependency management

`handleOfficialFilesUpload` and `handleTimeframeChange` (in `useOfficialInput`) need to call
`resetPredictionState` (owned by `usePredictionWorkspace`). Solution: `useOfficialInput` accepts
`resetPredictionState` as a parameter (function injection). This avoids circular hook dependency
and keeps each hook's responsibility single.

**Interface for useOfficialInput:**
```
useOfficialInput(params: {
  computeMa99: (rows: OHLCRow[], timeframe: string) => Promise<Ma99Result>
  resetPredictionState: () => void
}): {
  ohlcData: OHLCRow[]
  viewTimeframe: '1H' | '1D'
  loadError: string | null
  sourcePath: string
  maLoading: boolean
  queryMa99: (number | null)[]
  queryMa99Gap: Ma99Gap | null
  ohlcComplete: boolean
  completedRows: OHLCRow[]
  apiRows: OHLCRow[]
  handleOfficialFilesUpload: (files: FileList) => void
  handleCellChange: (rowIdx: number, field: keyof OHLCRow, value: string) => void
  handleTimeframeChange: (nextTimeframe: '1H' | '1D') => Promise<void>
}
```

**Interface for useHistoryUpload:**
```
useHistoryUpload(): {
  historyInfo: HistoryInfo | null
}
```

**Interface for usePredictionWorkspace:**
```
usePredictionWorkspace(params: {
  predict: (rows: OHLCRow[], ids: string[], timeframe: string) => Promise<PredictResponse | null>
  apiRows: OHLCRow[]
  viewTimeframe: '1H' | '1D'
}): {
  matches: MatchCase[]
  tempSelection: Set<string>
  appliedSelection: Set<string>
  appliedData: { matches: MatchCase[]; stats: PredictStats | null; inputs: OHLCRow[] }
  displayMatches: DisplayMatch[]
  resetPredictionState: () => void
  handleToggle: (id: string) => void
  handlePredict: () => Promise<void>
}
```

**Note on queryMa99 in handlePredict:** `handlePredict` in the current AppPage also calls
`setQueryMa99` and `setQueryMa99Gap` (lines 389-391 after predict returns). Because these
state pieces are owned by `useOfficialInput`, the hook must expose setter functions or
`handlePredict` must be lifted. Preferred solution: `usePredictionWorkspace` receives
`setQueryMa99` and `setQueryMa99Gap` as additional parameters, so the prediction result
can update the MA99 display without crossing ownership boundaries.

**Revised interface for usePredictionWorkspace:**
```
usePredictionWorkspace(params: {
  predict: (rows: OHLCRow[], ids: string[], timeframe: string) => Promise<PredictResponse | null>
  apiRows: OHLCRow[]
  viewTimeframe: '1H' | '1D'
  setQueryMa99: (vals: (number | null)[]) => void
  setQueryMa99Gap: (gap: Ma99Gap | null) => void
}): { ... same as above ... }
```

---

## §2 File Plan

### New files

| File path | Responsibility |
|-----------|---------------|
| `frontend/src/hooks/useOfficialInput.ts` | Owns ohlcData, viewTimeframe, loadError, sourcePath, maLoading, queryMa99, queryMa99Gap; all CSV parse and MA99 flows; exposes apiRows, ohlcComplete |
| `frontend/src/hooks/useHistoryUpload.ts` | Single useEffect fetching /api/history-info; exposes historyInfo |
| `frontend/src/hooks/usePredictionWorkspace.ts` | Owns matches, tempSelection, appliedSelection, appliedData; exposes displayMatches, handleToggle, handlePredict, resetPredictionState |
| `frontend/src/utils/officialCsvParsing.ts` | Pure functions: `parseOfficialCsvFile` (re-exported for test compat), `parseExchangeTimestamp`, `isRowComplete`, `emptyRows` |
| `frontend/src/utils/statsByDay.ts` | Pure function: `computeStatsByDay` |

### Modified files

| File path | Change |
|-----------|--------|
| `frontend/src/AppPage.tsx` | Strip all state/handlers into hooks; retain only hook composition + layout JSX; ≤ 100 lines |
| `frontend/src/__tests__/parseOfficialCsvFile.test.ts` | Update import from `'../AppPage'` to `'../utils/officialCsvParsing'` |

### Deleted inline functions (moved)

`emptyRows`, `parseExchangeTimestamp`, `parseOfficialCsvFile`, `isRowComplete` → `utils/officialCsvParsing.ts`
`computeStatsByDay` → `utils/statsByDay.ts`

---

## §3 AppPage Residual

### Estimated line count

| Block | Estimated lines |
|-------|----------------|
| Imports (hooks + components + utils) | ~15 |
| `export default function AppPage()` opener + hook calls (4) | ~8 |
| Residual useMemos: workspace, displayStatsByDay, disabledReason, isDirty | ~25 |
| Destructure workspace output (3 vars) | ~3 |
| Return JSX (root div + two-column layout scaffold) | ~40 |
| Closing brace | 1 |
| **Total** | **~92 lines** |

### What remains in AppPage

- Call `usePrediction()` → get `{ predict, computeMa99, loading, error: predictionError }`
- Call `useOfficialInput({ computeMa99, resetPredictionState })` → destructure
- Call `useHistoryUpload()` → get `historyInfo`
- Call `usePredictionWorkspace({ predict, apiRows, viewTimeframe, setQueryMa99, setQueryMa99Gap })` → destructure
- `disabledReason` useMemo (depends on maLoading, ohlcComplete, matches.length, hasSelection)
- `workspace` useMemo (depends on appliedData, appliedSelection, viewTimeframe — imports `computeStatsFromMatches`, `aggregateProjectedBarsTo1D`)
- `displayStatsByDay` useMemo (depends on projectedFutureBars, appliedData.inputs, viewTimeframe)
- `isDirty` useMemo (depends on tempSelection, appliedSelection, appliedData.stats)
- `errorMessage` derivation (`loadError ?? predictionError`)
- Full return JSX with all child components

### K-013 import confirmation

`computeStatsFromMatches` from `'./utils/statsComputation'` remains in AppPage residual
(used in the `workspace` useMemo). Import path is unchanged. The import source does not move.

---

## §4 TD-004 Fix Approach

### Problem statement (verified from source)

`PredictorChart` effect dependency array at `MatchList.tsx:256`:
```
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [base, startDate, timeframe, historical.length, future.length, historicalMa99.length, futureMa99.length])
```

`historical.length` and `future.length` are used instead of actual candle values.
When two matches share the same `historical.length` and `future.length` but differ in
OHLC prices, switching from match A to match B does not retrigger the effect — the chart
renders match A's data for match B's position.

### Option analysis

**Option 1 — Memoized input object (conservative)**
AppPage/MatchList passes `historical` and `future` as stable array references by memoizing
at the call site; the effect dep is the object reference. Requires memo at every call
site in MatchList, and still doesn't solve the core issue if `historicalOhlc` arrays are
reconstructed on each render (they are, because `matches.map(m => ...)` in AppPage is
fresh on every render).

*Trade-off:* shifts burden upstream; fragile if memoization is missed anywhere.

**Option 2 — Data identity hash (progressive)**
Compute a hash (e.g., JSON.stringify or lightweight numeric fingerprint) of
`historical` + `future` arrays inside PredictorChart; add the hash to the dep array.
This is direct — the effect fires whenever actual candle values differ, regardless of
array length.

*Trade-off:* introduces a stringify/hash on every render of PredictorChart; acceptable
because MatchList items render only when visible in the accordion and the arrays are
bounded (≤ 100 bars).

**Option 3 — Stable key-based remount (middle ground)**
Add a `key` prop to `<PredictorChart>` derived from a content fingerprint of the
specific match (e.g., `m.id + '_' + m.historicalOhlc.length + '_' + m.startDate`).
This forces a full remount when key changes, which is guaranteed to re-run the effect
and reinitialize the chart.

*Trade-off:* remount is heavier than a dep update; acceptable given the accordion
pattern (chart only mounts when card is open); key is naturally derived from match
metadata already available in MatchList.

### Recommendation: Option 3 (stable key-based remount)

**Rationale:** The stale chart bug is fundamentally a "same component, different data
identity" problem. Remounting via `key` is the idiomatic React solution for this class
of bug. It requires zero changes to PredictorChart's internal effect — just add one
`key` attribute in MatchList's render loop. Option 2 requires adding dep tracking
inside PredictorChart which is a more invasive change. Option 1 does not fix the root
cause.

### Exact code change in MatchList

In `MatchList.tsx`, inside the `matches.map(m => ...)` block, the `<PredictorChart>`
call at line 410 currently has no `key` prop (the `key` on the enclosing `<div>` is
`m.id` but `PredictorChart` does not see it). Change:

```
// BEFORE (line 410-418)
<PredictorChart
  historical={hist}
  future={fut}
  startDate={m.startDate}
  timeframe={timeframe}
  historicalMa99={...}
  futureMa99={...}
/>
```

```
// AFTER
<PredictorChart
  key={`${m.id}_${m.startDate}_${hist.length}_${fut.length}_${String(hist[0]?.close ?? '')}_${String(fut[0]?.close ?? '')}`}
  historical={hist}
  future={fut}
  startDate={m.startDate}
  timeframe={timeframe}
  historicalMa99={...}
  futureMa99={...}
/>
```

The key includes `m.id` (match identity), `m.startDate` (date identity), `hist.length`
and `fut.length` (length), and `hist[0].close` + `fut[0].close` (content fingerprint
at boundary). This distinguishes matches that share length but differ in values without
requiring a full stringify. `// eslint-disable-next-line react-hooks/exhaustive-deps`
at line 255-256 is **removed** after this fix because the dep array reverts to the
canonical full-content form:

```
// AFTER (effect deps — remove eslint-disable, restore full deps)
}, [base, startDate, timeframe, histData, futData, historicalMa99, futureMa99])
```

**Note:** with the key-based remount approach, the internal effect dep array is no
longer the mechanism that triggers re-render — the key change causes a full remount.
The `eslint-disable` suppression comment is removed because the dep array can now be
honest (even if redundant with the key). Engineer must verify that `histData` and
`futData` are stable references inside the component body; if they are recomputed
on every render (they are, inline at lines 122-123), the full-deps approach still
works because the key change already forces remount, making the effect dep list a
secondary verification layer. The suppression comment is the AC target that must
disappear.

**Boundary contract:**
- `hist.length === 0` and `fut.length === 0`: key still valid (`_0_0__`); chart renders empty state as before.
- Two consecutive matches with identical length but different values: first close value differs → key changes → remount fires → chart reinitializes.
- Same match re-expanding after collapse: key is identical → no remount; chart state reconstructed by mount lifecycle (existing behavior).

---

## §5 Sacred Preservation Plan

### K-030 isolation invariants

The three K-030 invariants are enforced purely in `AppPage.tsx`'s JSX, not in any hook:

| Invariant | Current location | Post-refactor location | Preserved? |
|-----------|-----------------|----------------------|-----------|
| No `UnifiedNavBar` render | AppPage JSX return (absent) | AppPage residual JSX (still absent) | Yes — residual JSX retains the same root structure |
| No `Footer` render | AppPage JSX return (absent) | AppPage residual JSX (still absent) | Yes |
| Root div `bg-gray-950 text-gray-100` | AppPage.tsx:397 `<div className="h-screen flex flex-col overflow-hidden bg-gray-950 text-gray-100">` | Preserved in residual JSX verbatim | Yes |

The `app-bg-isolation.spec.ts` Playwright spec queries `document.querySelector('#root div.bg-gray-950')`. This DOM structure depends only on the root JSX in AppPage residual, which is not altered by the hook extraction. All 6 K-030 test cases pass without modification.

The `data-testid="official-input-section"` and `data-testid="history-reference-section"` attributes
(queried in `K-046-example-upload.spec.ts`) live in AppPage's JSX template, not in hooks.
They remain in the residual JSX unchanged.

### K-013 computeStatsFromMatches contract

The `computeStatsFromMatches` import at `AppPage.tsx:17` remains in AppPage residual
because the `workspace` useMemo (which calls it) stays in AppPage. Import:

```
import { computeStatsFromMatches } from './utils/statsComputation'
```

Path is unchanged. The K-013 Sacred clause `AC-075-K013-CONTRACT` is trivially satisfied.

The Vitest spec `statsComputation.test.ts` tests the util directly — no AppPage coupling — and requires no modification.

### Sacred DOM testid inventory

7-pattern grep sweep results (run against worktree HEAD):

| Pattern | Hits | Resolution |
|---------|------|-----------|
| `data-testid="official-input-section"` | AppPage.tsx JSX | Preserved in residual JSX |
| `data-testid="history-reference-section"` | AppPage.tsx JSX | Preserved in residual JSX |
| `data-testid="error-toast"` | AppPage.tsx JSX | Preserved in residual JSX |
| `data-testid="history-freshness-stale"` | AppPage.tsx JSX | Preserved in residual JSX |
| `data-testid="match-chart"` | MatchList.tsx | Not touched by AppPage refactor |
| `data-testid="match-chart-split-line"` | MatchList.tsx | Not touched by AppPage refactor |
| `trackCsvUploaded(` | AppPage.tsx `handleOfficialFilesUpload` | Moves to `useOfficialInput.ts`; import of analytics util must follow |

All `data-testid` attributes remain in unchanged JSX positions; no Sacred regression.

---

## §6 Test Impact

### Playwright specs — no modification required

These specs test observable UI behavior, not implementation internals. The refactor is
behavior-preserving by definition (same render output, same API call shapes, same event
handling). All pass unmodified:

| Spec file | AppPage/MatchList coverage | Requires change? |
|-----------|--------------------------|-----------------|
| `app-bg-isolation.spec.ts` | K-030 root div, no navbar/footer | No |
| `K-046-example-upload.spec.ts` | official-input-section, history-reference-section, upload flow | No |
| `upload-real-1h-csv.spec.ts` | real CSV upload, predict flow, error-toast | No |
| `ma99-chart.spec.ts` | MA99 flow, PredictorChart chart render, trend labels, timeframe toggle | No |
| `K-013-consensus-stats-ssot.spec.ts` | Consensus chart visibility (full-set vs subset vs empty vs 1-bar) | No |

Remaining specs (`about-*.spec.ts`, `diary-*.spec.ts`, `navbar.spec.ts`, etc.) do not
touch AppPage or MatchList.

### Vitest specs — one modification required

| Spec file | Change needed |
|-----------|--------------|
| `frontend/src/__tests__/parseOfficialCsvFile.test.ts` | Update import: `'../AppPage'` → `'../utils/officialCsvParsing'` |
| `frontend/src/__tests__/statsComputation.test.ts` | No change — imports directly from `utils/statsComputation` |
| `frontend/src/__tests__/aggregation.test.ts` | No change — imports directly from `utils/aggregation` |

### New Vitest unit tests required

| New test file | What to test |
|--------------|-------------|
| `frontend/src/__tests__/useOfficialInput.test.ts` | Required — `parseOfficialCsvFile` path change creates a coverage gap; additionally, `emptyRows`, `isRowComplete`, `parseExchangeTimestamp` move from AppPage inline to `utils/officialCsvParsing.ts` and need standalone unit coverage. Test key behaviors: 24-row parse roundtrip, timestamp conversion, empty row detection. |
| `frontend/src/__tests__/statsByDay.test.ts` | Required — `computeStatsByDay` moves to utils; test the UTC+8 date grouping logic (currently untested). Key cases: 3-day grouping, single-day input, empty input. |

Hook-level unit tests (useOfficialInput, useHistoryUpload, usePredictionWorkspace) are
**not required** for the initial delivery. The hooks are integration-tested end-to-end
by the existing Playwright suite. Pure-logic unit tests target only the pure functions
in utils/.

### TD-004 Playwright coverage gap

AC-075-TD004-CHART-STABLE cannot be fully verified by the existing Playwright suite
because `ma99-chart.spec.ts` only asserts that the chart container renders (`data-testid="match-chart"` present), not that distinct candle data appears. A new
Playwright test is **recommended** (not blocking Engineer release) that:
1. Uploads a fixture where two matches have identical length but different first-close values
2. Opens match 1 accordion, records the rendered chart state
3. Closes match 1, opens match 2 accordion
4. Asserts the chart container re-rendered (detects via `key`-driven DOM replacement)

This is flagged as a Known Gap for QA Early Consultation to scope.

---

## Implementation Order

1. **Phase A — utils extraction (no behavior change, testable in isolation):**
   - Create `frontend/src/utils/officialCsvParsing.ts` with `emptyRows`, `parseExchangeTimestamp`, `parseOfficialCsvFile`, `isRowComplete`
   - Create `frontend/src/utils/statsByDay.ts` with `computeStatsByDay`
   - Update `parseOfficialCsvFile.test.ts` import path
   - Run `npx tsc --noEmit` + Vitest

2. **Phase B — TD-004 fix in MatchList (isolated change):**
   - Add `key` prop to `<PredictorChart>` in MatchList.tsx
   - Remove `eslint-disable-next-line` at line 255
   - Restore full dep array
   - Run Playwright: `ma99-chart.spec.ts` must pass

3. **Phase C — hook extraction:**
   - Create `useHistoryUpload.ts` (smallest, no cross-hook dep)
   - Create `useOfficialInput.ts` (accepts `computeMa99` + `resetPredictionState` as params)
   - Create `usePredictionWorkspace.ts` (accepts `predict` + `apiRows` + `viewTimeframe` + setters)
   - Rewrite `AppPage.tsx` to call all four hooks + residual useMemos
   - Run `npx tsc --noEmit` + Vitest + full Playwright suite

4. **Phase D — new unit tests:**
   - Write `useOfficialInput.test.ts` for utils functions
   - Write `statsByDay.test.ts`

---

## Risks and Notes

| Risk | Severity | Mitigation |
|------|----------|-----------|
| `handlePredict` sets `queryMa99` / `queryMa99Gap` (owned by useOfficialInput) from inside usePredictionWorkspace | Medium | Inject `setQueryMa99` + `setQueryMa99Gap` as params into usePredictionWorkspace; never allow workspace hook to import useOfficialInput directly |
| `handleOfficialFilesUpload` and `handleTimeframeChange` call `resetPredictionState` (owned by usePredictionWorkspace) | Medium | Inject `resetPredictionState` as param into useOfficialInput |
| `parseOfficialCsvFile` is exported from AppPage — import path in test will break | Low | Update import path in same commit (Phase A) |
| `computeMa99` from usePrediction is called inside two hooks but usePrediction is instantiated once in AppPage | Low | AppPage calls `usePrediction()` once; passes `computeMa99` reference to both hooks — no double instantiation |
| Sample auto-load useEffect (K-057) calls both `resetPredictionState` and `computeMa99` — it references both domains | Medium | This useEffect must move to `useOfficialInput` because it primarily manages ohlcData + sourcePath; it receives `resetPredictionState` via the injected param, maintaining correct domain ownership |
| `searchParams` (from `useSearchParams`) is used only in the K-057 sample auto-load effect | Low | Move `const [searchParams] = useSearchParams()` into `useOfficialInput` along with the effect |

### Security notes

- No auth, env var, or injection concerns — pure component extraction
- Analytics calls (`trackDemoStarted`, `trackCsvUploaded`, etc.) must move with their trigger handlers into the extracted hooks

---

## Refactorability Checklist

- [x] **Single responsibility:** each hook owns exactly one concern; residual AppPage owns composition only
- [x] **Interface minimization:** hook params contain only what the hook needs; no over-passing
- [x] **Unidirectional dependency:** AppPage → hooks; hooks do not import each other; utils are leaf nodes with no React dependency
- [x] **Replacement cost:** if usePrediction is swapped, only AppPage changes its call site + passes updated function refs; hooks are unaware of usePrediction internals
- [x] **Clear test entry point:** pure utils functions (officialCsvParsing, statsByDay) have standalone input/output contracts; hooks are integration-tested via Playwright
- [x] **Change isolation:** TD-004 MatchList change is isolated to one `key` prop addition in MatchList.tsx; no API contract change; no AppPage change required for this part

---

## All-Phase Coverage Gate

| Phase | Backend API | Frontend Routes | Component Tree | Props Interface |
|-------|------------|----------------|----------------|----------------|
| Phase 1 (Architect RFC) | N/A — no API change | N/A — `/app` route unchanged | Covered in §1 + §2 (hook decomposition + file plan) | Covered in §1 (all four hook interfaces defined) |

Architect delivery gate:
  all-phase-coverage=✓,
  pencil-frame-completeness=N/A — no visual-delta,
  visual-spec-json-consumption=N/A — no .pen file,
  sacred-ac-cross-check=✓ (§5 DOM testid inventory),
  route-impact-table=N/A — no global CSS / sitewide token change,
  cross-page-duplicate-audit=✓ (hooks are page-specific to AppPage; no shared component introduced),
  target-route-consumer-scan=N/A — no route navigation behavior change,
  architecture-doc-sync=pending (system-overview.md update required at task close),
  self-diff=N/A — new file, no prior table to diff against,
  output-language=✓
  → OK

---

## Retrospective

**Where most time was spent:** Mapping the cross-hook dependency graph for `resetPredictionState` and `setQueryMa99`/`setQueryMa99Gap` — ensuring no circular import while preserving single-instance usePrediction.
**Which decisions needed revision:** Initial hook boundary table omitted the `queryMa99`/`queryMa99Gap` setters called from inside `handlePredict`; added setter injection to `usePredictionWorkspace` params after tracing the full `handlePredict` body.
**Next time improvement:** When mapping hook boundaries, trace all cross-domain setter calls (not just state declarations) before finalizing the interface table.
