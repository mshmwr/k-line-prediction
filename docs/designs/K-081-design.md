---
ticket: K-081
title: Frontend /backtest route — design doc
status: ready-for-engineer
created: 2026-05-02
updated: 2026-05-02
visual-spec: N/A — reason: visual-delta=none; no Pencil frame produced for this ticket
---

## §0 Scope Questions (Architect gate)

**SQ-1 — Recharts not in package.json — RESOLVED 2026-05-02 (PM ruling: option b, lightweight-charts)**

- Original concern: AC-081-TIME-SERIES-CHART referenced "Recharts `LineChart`" but `recharts` is not installed; QA Challenge #6 ruling was incorrect (`MainChart.tsx` uses `lightweight-charts` v5.1.0).
- PM ruling 2026-05-02: option **(b)** — reuse `lightweight-charts`. Rationale: zero new dep, smaller bundle, same library already proven in `MainChart.tsx`. Architect's option-(a) recommendation overruled.
- AC-081-TIME-SERIES-CHART rewritten in ticket (commit on this branch): drops "Recharts LineChart" + "7 X-axis tick labels" assertions, replaces with container-div testid + non-zero pixel-dimension check (canvas-rendered ticks are not DOM-queryable, accepted trade-off).
- §5.3 TimeSeriesChart, §8 test plan, §9 implementation order all updated to reflect the lightweight-charts approach.
- Stale `ssot/system-overview.md` tech-stack "Recharts" entry to be corrected by Engineer in AC-081-DOCS-UPDATE.

_All ACs are now implementable as written. No open Architect questions._

---

## §1 Architecture Overview

```
Browser
  │  HTTP 200 /backtest
  ▼
React Router (main.tsx)
  │  lazy chunk: BacktestPage
  ▼
BacktestPage.tsx          ← page root; layout only; no fetch logic
  │  invokes
  ▼
useBacktestData.ts        ← single hook; owns all fetch + retry + state
  │  returns { summary, params, predictions, actuals, status, error }
  │
  ├── Firestore REST (public-read)
  │     GET .../backtest_summaries/{latest}
  │     GET .../predictor_params/active
  │     POST .../runQuery  (predictions + actuals 30-day series)
  │
  ├── SummaryCard.tsx         ← reads summary + status
  ├── PerTrendTable.tsx        ← reads summary.per_trend + status
  ├── TimeSeriesChart.tsx      ← reads predictions+actuals array + status
  └── ActiveParamsCard.tsx     ← reads params + status
```

State machine inside `useBacktestData`:

```
initial → loading
loading + both fetches pending → status='loading'
loading + both succeed        → status='ready', data populated
loading + any fail after retry → status='error', error=string message
```

Hook return shape:
```
{
  summary:     BacktestSummary | null
  params:      ActiveParams | null
  predictions: Prediction[]          // assembled 30-day series
  actuals:     ActualOutcome[]       // paired with predictions by doc-id
  status:      'loading' | 'ready' | 'error'
  error:       string | null
}
```

---

## §2 File Plan

### New files (10)

| File | Purpose | Exported symbols | Target LoC | Depends on |
|------|---------|-----------------|-----------|------------|
| `frontend/src/pages/BacktestPage.tsx` | Page root; layout shell; mounts 4 child components; no fetch logic | `default BacktestPage` | ≤180 | `useBacktestData`, 4 child components |
| `frontend/src/components/backtest/SummaryCard.tsx` | Renders hit rates, MAE, RMSE, sample_size, window_days; 3-state aware | `default SummaryCard` | ≤80 | `types/backtest.ts` |
| `frontend/src/components/backtest/PerTrendTable.tsx` | 3-row table (up/down/flat); N/A for missing trend keys | `default PerTrendTable` | ≤80 | `types/backtest.ts` |
| `frontend/src/components/backtest/TimeSeriesChart.tsx` | `lightweight-charts` line-overlay; container div + `useEffect` for chart instance lifecycle; pure presentation | `default TimeSeriesChart` | ≤100 | `lightweight-charts` (existing), `types/backtest.ts` |
| `frontend/src/components/backtest/ActiveParamsCard.tsx` | Displays 4 param fields + optimized_at; 3-state aware | `default ActiveParamsCard` | ≤80 | `types/backtest.ts` |
| `frontend/src/hooks/useBacktestData.ts` | Firestore REST reads; retry; state machine | `useBacktestData` | ≤150 | `types/backtest.ts` |
| `frontend/src/types/backtest.ts` | TypeScript mirror types for 4 frozensets | `BacktestSummary`, `ActualOutcome`, `Prediction`, `ActiveParams` | ≤60 | none |
| `frontend/e2e/backtest-page.spec.ts` | Playwright spec; 4 cases; route.fulfill() mocks | — | ≤120 | Playwright |
| `firestore.rules` (repo root) | Public-read rules for 4 collections; write-deny | — | ≤30 | Firebase CLI |
| `firebase.json` (repo root) | Firestore deploy target pointing at `firestore.rules` | — | ≤20 | Firebase CLI |

### Modified files (3)

| File | Change | Insertion point | Approx. added lines |
|------|--------|----------------|-------------------|
| `frontend/src/main.tsx` | Add lazy import + Route for `/backtest` | Lazy block: after line 21 (`BusinessLogicPage` lazy). Route: before `path="*"` catch-all (line 43). | +2 lines |
| `frontend/src/components/UnifiedNavBar.tsx` | Add `{ label: 'Backtest', path: '/backtest' }` entry | `TEXT_LINKS` array between `Diary` (index 1) and `About` (index 3). Insert at index 2, shifting `Prediction` and `About`. | +1 line |
| `frontend/src/hooks/useGAPageview.ts` | Add `/backtest` → page title entry | `PAGE_TITLES` map body, after `/business-logic` entry (line 10). | +1 line |

### Read-only (verified, must not change)

- `backend/firestore_config.py` — frozenset source of truth; K-081 mirrors, not edits.
- `backend/predictor.py` — out of scope.
- `scripts/daily_predict.py` — out of scope.

---

## §3 Exported Contract — TypeScript Mirror Types

File: `frontend/src/types/backtest.ts`

Header comment (verbatim):
```
// Mirrors backend/firestore_config.py frozensets — keep in sync; cross-ticket contract from K-080.
```

```typescript
// Source: FIRESTORE_PREDICTION_FIELDS (backend/firestore_config.py)
export interface Prediction {
  params_hash: string;          // sha256 hex (full 64 chars)
  projected_high: number | null;
  projected_low: number | null;
  projected_median: number | null;
  top_k_count: number;
  trend: 'up' | 'down' | 'flat' | 'unknown';
  query_ts: string;             // ISO8601 UTC
  created_at: string;           // ISO8601 UTC
  _doc_id?: string;             // injected by hook; not a Firestore field
}

// Source: FIRESTORE_ACTUAL_FIELDS (backend/firestore_config.py)
export interface ActualOutcome {
  high_hit: boolean;
  low_hit: boolean;
  mae: number;
  rmse: number;
  actual_high: number;
  actual_low: number;
  computed_at: string;          // ISO8601 UTC
  _doc_id?: string;             // injected by hook; not a Firestore field
}

// Source: FIRESTORE_BACKTEST_SUMMARY_FIELDS (backend/firestore_config.py)
export interface PerTrendEntry {
  hit_rate_high: number;
  hit_rate_low: number;
  avg_mae: number;
  sample_size: number;
}

export interface BacktestSummary {
  hit_rate_high: number;
  hit_rate_low: number;
  avg_mae: number;
  avg_rmse: number;
  sample_size: number;
  per_trend: Partial<Record<'up' | 'down' | 'flat', PerTrendEntry>>;
  window_days: number;
  computed_at: string;          // ISO8601 UTC
}

// Source: FIRESTORE_PREDICTOR_PARAMS_FIELDS (backend/firestore_config.py)
// Note: ParamSnapshot on backend stores ma_trend_window_days etc. —
// the Firestore doc uses shorter key names (window_days, pearson_threshold, top_k).
// The hook maps Firestore doc keys to these interface fields.
export interface ActiveParams {
  ma_trend_window_days: number;   // Firestore key: window_days
  ma_trend_pearson_threshold: number; // Firestore key: pearson_threshold
  top_k: number;
  optimized_at: string | null;
  params_hash: string;            // computed by hook from window+pearson+top_k
}
```

**snake_case rule (AC-081-TYPE-CONTRACT):** all field names in these interfaces use snake_case to mirror Firestore wire format. camelCase translation happens exclusively in `useBacktestData.ts` — these types are NOT camelCased.

**`per_trend` partial contract:** `system-overview.md` §Daily Workflow notes: "per_trend sub-keys are only written when sample_size > 0 for that trend." Using `Partial<Record<...>>` enforces graceful handling — no key = no data for that trend, renders N/A.

---

## §4 Firestore REST Read Strategy

### Base URL pattern

```
https://firestore.googleapis.com/v1/projects/{projectId}/databases/(default)/documents
```

Project ID resolution (in hook file `useBacktestData.ts`):
```typescript
// must match scripts/daily_predict.py firestore project (Known Gap KG-1: env-var wiring deferred to deploy ticket)
const K_LINE_FIRESTORE_PROJECT_ID = 'k-line-prediction'  // replace with actual GCP project ID
const PROJECT_ID = import.meta.env.VITE_FIRESTORE_PROJECT_ID ?? K_LINE_FIRESTORE_PROJECT_ID
```

### Summary + params fetch (two parallel GET requests)

Both are single-document reads using the document REST endpoint:

```
GET .../backtest_summaries/{latest}
GET .../predictor_params/active
```

**"latest" resolution:** The `backtest_summaries` collection uses `YYYY-MM-DD` doc IDs. "Latest" = highest lexicographic date. Strategy: use `listDocuments` with `pageSize=1&orderBy=__name__ desc` to fetch only the newest doc. This avoids a client-side sort over 30+ docs.

```
GET .../backtest_summaries?pageSize=1&orderBy=__name__%20desc
```

Response body: `{ documents: [ { name: "...", fields: { ... } } ] }`. Hook extracts `documents[0].fields`.

### 30-day time-series fetch (predictions + actuals join)

**Strategy: two parallel `runQuery` POST requests** — one for `predictions`, one for `actuals`. Filter by `query_ts >= 30 days ago`. Then join in memory by document ID.

```
POST .../runQuery
body (predictions):
{
  "structuredQuery": {
    "from": [{ "collectionId": "predictions" }],
    "where": {
      "fieldFilter": {
        "field": { "fieldPath": "query_ts" },
        "op": "GREATER_THAN_OR_EQUAL",
        "value": { "stringValue": "<ISO8601 30-days-ago>" }
      }
    },
    "orderBy": [{ "field": { "fieldPath": "query_ts" }, "direction": "ASCENDING" }],
    "limit": 35
  }
}
```

**Worst-case docs read:** 30 days × 1 prediction/day = 30 docs from `predictions`; up to 30 matching docs from `actuals`. Total: ≤60 docs. `limit: 35` provides a 5-doc safety margin while preventing pathological fetches.

**Join logic (in hook):** Create a `Map<docId, ActualOutcome>` from actuals response. For each prediction, look up `actuals[prediction._doc_id]`. Only pairs where both exist are valid chart points. Result: `ChartPoint[]` sorted by `query_ts`.

**Pagination strategy:** No pagination needed for 30-day window. 35-doc limit is a hard cap. If `runQuery` returns exactly 35 docs (edge case: backlog > 35), hook logs a warning and uses the 35 returned — data is still valid, just capped at most recent 35.

**Why `runQuery` over `listDocuments`?** `listDocuments` does not support `where` filtering with field values — only document ID range. `runQuery` supports arbitrary field filters required to scope to last 30 days.

### Retry strategy

Mirror K-080 backend pattern: 1 retry on network/HTTP error (4xx/5xx), 5-second delay before retry.

```
attempt 1 → fail → wait 5s → attempt 2 → fail → status='error', error=<message>
                           → succeed → continue
```

Both the "summary+params" fetch group AND the "predictions+actuals" runQuery group each apply this retry independently. If either group fails after retry, `status='error'`.

### Playwright mock URL prefix

Route pattern to fulfill in specs:
```typescript
await page.route('**/firestore.googleapis.com/**', async (route) => {
  // inspect route.request().url() to branch by collection
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPayload) })
})
```

The mock intercepts all Firestore REST traffic. Tests branch by URL substring (`/backtest_summaries`, `/predictor_params`, `/runQuery`) to return collection-specific payloads.

---

## §5 Component Boundaries

### 5.1 SummaryCard

**AC mapping:** AC-081-LATEST-SUMMARY-CARD

Props interface:
```typescript
interface SummaryCardProps {
  summary: BacktestSummary | null
  status: 'loading' | 'ready' | 'error'
  error: string | null
}
```

Internal state: none. Pure presentation.

| `data-testid` | Render condition | Content |
|---------------|-----------------|---------|
| `backtest-summary-card` | `status === 'ready'` | Card root |
| `summary-hit_rate_high` | inside ready card | `(summary.hit_rate_high * 100).toFixed(1) + '%'` |
| `summary-hit_rate_low` | inside ready card | `(summary.hit_rate_low * 100).toFixed(1) + '%'` |
| `summary-avg_mae` | inside ready card | `summary.avg_mae.toFixed(4)` |
| `summary-avg_rmse` | inside ready card | `summary.avg_rmse.toFixed(4)` |
| `summary-sample_size` | inside ready card | `String(summary.sample_size)` |
| `summary-window_days` | inside ready card | `String(summary.window_days)` |
| `summary-card-loading` | `status === 'loading'` | Skeleton placeholder div |
| `summary-card-error` | `status === 'error'` | Error block; renders `error` string |

**Boundary — null summary with status='ready':** should not occur if hook is correct, but render `summary-card-error` with "Data unavailable" as defensive fallback.

### 5.2 PerTrendTable

**AC mapping:** AC-081-PER-TREND-TABLE

Props interface:
```typescript
interface PerTrendTableProps {
  summary: BacktestSummary | null
  status: 'loading' | 'ready' | 'error'
}
```

Internal state: none.

| `data-testid` | Content |
|---------------|---------|
| `per-trend-table` | `<table>` root element |

Row order: `['up', 'down', 'flat']` — hardcoded iteration order (not sorted from data).

Missing trend key → cells display literal `N/A` string (not `0`).

Column headers `<th>`: Trend, High Hit %, Low Hit %, Avg MAE, Samples.

**Loading / error:** when `status !== 'ready'`, the `<table>` is not mounted. BacktestPage renders SummaryCard loading/error state; PerTrendTable renders null. (No separate loading testid required by AC for PerTrendTable.)

### 5.3 TimeSeriesChart

**AC mapping:** AC-081-TIME-SERIES-CHART

Props interface:
```typescript
interface TimeSeriesChartProps {
  predictions: Prediction[]
  actuals: ActualOutcome[]
  status: 'loading' | 'ready' | 'error'
}
```

Internal state: none. No fetch logic. Chart data assembly is in `useBacktestData`.

| `data-testid` | Render condition | Content |
|---------------|-----------------|---------|
| `time-series-chart` | `status === 'ready'` AND paired pairs ≥ 2 | `<div data-testid="time-series-chart">` wrapping a `lightweight-charts` chart instance attached via `useEffect` + `useRef` (mirror `MainChart.tsx` pattern). The `<div>` element receives the testid, NOT the canvas inside. |
| `time-series-empty` | `status === 'ready'` AND paired pairs < 2 | Placeholder div |

Text when empty: `Not enough completed pairs yet — minimum 2 required for chart.` (exact match per AC).

**Library:** `lightweight-charts` v5.1.0 (already in `package.json`; same lib as `MainChart.tsx`). PM SQ-1 ruling 2026-05-02: do NOT add `recharts`. The original Architect-recommended option (a) is overruled. AC-081-TIME-SERIES-CHART has been amended in the ticket to drop the "Recharts LineChart" + "7 X-axis tick labels" assertions — replaced with container-div testid + non-zero pixel-dimension check (canvas-rendered ticks are not DOM-queryable, accepted trade-off).

Two line series via `chart.addLineSeries({ color, lineWidth: 2 })`:
- `projected_median` — color `#9C4A3B` (brick-dark, K-017 palette)
- `actual_close` — color `#999999` (ink/60 approximation; lightweight-charts requires hex, not rgba)

X axis: lightweight-charts `LineData[]` time-series with ISO `YYYY-MM-DD` from `query_ts` (use `time: dateString` shape; lightweight-charts auto-scales the time axis). Y axis: auto-scaled price.

**Pixel-dimension contract:** the `<div data-testid="time-series-chart">` MUST have `style={{ width: '100%', minHeight: '240px' }}` and live inside a parent with at least 600px width at desktop breakpoint, so Playwright's `boundingBox()` check returns ≥600×240. Chart instance is created with `chart.applyOptions({ width: container.clientWidth, height: 240 })` on mount + `ResizeObserver` to keep width responsive.

**Cleanup:** `useEffect` cleanup function calls `chart.remove()` to prevent canvas/listener leaks on route unmount (same pattern as `MainChart.tsx`).

**"actual_close" derivation:** `ActualOutcome` does not have an `actual_close` field directly. The time-series chart plots `actual_high` as a proxy for close (or the hook derives a midpoint). **Architect ruling:** `useBacktestData` assembles `ChartPoint[]` as `{ date: string, projectedMedian: number, actualClose: number }` where `actualClose = (actualOutcome.actual_high + actualOutcome.actual_low) / 2` (midpoint of the 72-bar realized window). This is labeled "Actual (mid)" on the Y-axis legend. If PM wants a different derivation, this is the only place to change it.

### 5.4 ActiveParamsCard

**AC mapping:** AC-081-ACTIVE-PARAMS-CARD

Props interface:
```typescript
interface ActiveParamsCardProps {
  params: ActiveParams | null
  status: 'loading' | 'ready' | 'error'
  error: string | null
}
```

Internal state: none.

| `data-testid` | Content |
|---------------|---------|
| `active-params-card` | Card root (status=ready) |
| `param-ma_trend_window_days` | `String(params.ma_trend_window_days)` |
| `param-ma_trend_pearson_threshold` | `params.ma_trend_pearson_threshold.toFixed(2)` |
| `param-top_k` | `String(params.top_k)` |
| `param-params_hash` | `params.params_hash.slice(0, 12)` |
| `param-optimized_at` | Formatted `YYYY-MM-DD HH:mm UTC` or `Defaults — never optimized` |

`optimized_at` format: when null OR when `params` is null, display `Defaults — never optimized`. Otherwise `new Date(params.optimized_at).toISOString().slice(0,16).replace('T', ' ') + ' UTC'`.

Loading/error: mirror SummaryCard pattern — no separate testids required by AC for ActiveParamsCard.

---

## §6 Loading / Error State Choreography

State machine: `loading | ready | error`

| Component | `loading` render | `ready` render | `error` render |
|-----------|-----------------|----------------|----------------|
| SummaryCard | `<div data-testid="summary-card-loading">` skeleton | full card with `data-testid="backtest-summary-card"` | `<div data-testid="summary-card-error">` + error string |
| PerTrendTable | null (no render) | `<table data-testid="per-trend-table">` | null (error shown by SummaryCard) |
| TimeSeriesChart | null (no render) | `<div data-testid="time-series-chart">` or `time-series-empty` | null |
| ActiveParamsCard | null (no render) | `<div data-testid="active-params-card">` | null |

**Rationale for null on non-SummaryCard loading:** AC specifies loading testids only for SummaryCard. The page has one error surface (SummaryCard) because all data comes from a single hook call. Showing skeleton in other components would require prop drilling of per-component status — over-engineering for a single-hook page.

**Race condition / double-submit:** hook uses a single `useEffect` with empty deps `[]` — fires once on mount. No user-triggered refetch UI in scope, so no double-fetch risk.

---

## §7 GA Pageview Test Pattern

No existing `vi.mock('../utils/analytics')` pattern exists in `frontend/src/__tests__/`. The existing GA tests are all Playwright E2E (in `frontend/e2e/ga-*.spec.ts`), not Vitest unit tests.

**K-081 pattern (Vitest unit test for useGAPageview):**

```typescript
// frontend/src/__tests__/useGAPageview.test.tsx
import { renderHook } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { useGAPageview } from '../hooks/useGAPageview'
import * as analytics from '../utils/analytics'
import { vi, describe, it, expect, beforeEach } from 'vitest'

describe('AC-081-GA-PAGEVIEW — useGAPageview /backtest entry', () => {
  beforeEach(() => {
    vi.spyOn(analytics, 'trackPageview').mockImplementation(() => {})
  })

  it('fires trackPageview with "K-Line Prediction — Backtest" when on /backtest', () => {
    renderHook(() => useGAPageview(), {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={['/backtest']}>
          <Routes>
            <Route path="*" element={<>{children}</>} />
          </Routes>
        </MemoryRouter>
      ),
    })
    expect(analytics.trackPageview).toHaveBeenCalledWith(
      '/backtest',
      'K-Line Prediction — Backtest'
    )
    expect(analytics.trackPageview).toHaveBeenCalledTimes(1)
  })
})
```

**Implementation note:** the test uses `vi.spyOn` (not `vi.mock`) because `trackPageview` is exported as a named function. `MemoryRouter` + `initialEntries` replaces the need for a real browser — the hook reads `useLocation()` internally.

---

## §8 Test Plan

| # | Test | Type | Tool | AC |
|---|------|------|------|----|
| 1 | `npx tsc --noEmit` exits 0 | tsc gate | tsc | AC-081-TSC-CLEAN |
| 2 | Route renders; 4 testids present (`backtest-summary-card`, `per-trend-table`, `time-series-chart`, `active-params-card`); chart-container `boundingBox()` returns ≥600×240 px when ≥2 paired points | E2E | Playwright | AC-081-PLAYWRIGHT-SPEC case 1, AC-081-TIME-SERIES-CHART |
| 3 | PerTrendTable has exactly 3 rows in order up → down → flat | E2E | Playwright | AC-081-PLAYWRIGHT-SPEC case 2, AC-081-PER-TREND-TABLE |
| 4 | Loading state: Firestore mock delays 500ms; `summary-card-loading` visible during wait | E2E | Playwright | AC-081-PLAYWRIGHT-SPEC case 3 |
| 5 | Error state: Firestore mock fails twice; `summary-card-error` visible with mocked error message | E2E | Playwright | AC-081-PLAYWRIGHT-SPEC case 4 |
| 6 | Type contract: `Object.keys(BacktestSummaryShape)` matches K-080 frozenset parity | Unit | Vitest | AC-081-TYPE-CONTRACT |
| 7 | NavBar entry: `Backtest` link rendered between `Diary` and `About` | Unit | Vitest | AC-081-NAVBAR-ENTRY |
| 8 | GA pageview: navigate to `/backtest`, assert one `trackPageview` call with title `K-Line Prediction — Backtest` | Unit | Vitest | AC-081-GA-PAGEVIEW |

**Test 6 detail — frozenset parity check:**
```typescript
// frontend/src/__tests__/backtest-types.test.ts
import { describe, it, expect } from 'vitest'
const K080_BACKTEST_SUMMARY_FIELDS = [
  'hit_rate_high', 'hit_rate_low', 'avg_mae', 'avg_rmse',
  'sample_size', 'per_trend', 'window_days', 'computed_at'
]
const BacktestSummaryShape: Record<string, true> = {
  hit_rate_high: true, hit_rate_low: true, avg_mae: true, avg_rmse: true,
  sample_size: true, per_trend: true, window_days: true, computed_at: true
}
describe('AC-081-TYPE-CONTRACT — BacktestSummary parity with K-080 frozenset', () => {
  it('has exactly the same keys as FIRESTORE_BACKTEST_SUMMARY_FIELDS', () => {
    expect(Object.keys(BacktestSummaryShape).sort())
      .toEqual(K080_BACKTEST_SUMMARY_FIELDS.sort())
  })
})
```

**Test 7 detail — NavBar entry:**
```typescript
// Render UnifiedNavBar in MemoryRouter; assert 'Backtest' link exists and
// is positioned between 'Diary' and 'About' in the visibleLinks array.
// Check aria-current="page" when pathname === '/backtest'.
```

---

## §9 Implementation Order

1. **`frontend/src/types/backtest.ts`** — define 4 interfaces (§3). No dependencies. Verify with `tsc --noEmit`.
2. **`frontend/src/hooks/useBacktestData.ts`** — implement hook (§4): project ID constant, `listDocuments` for summary, `runQuery` for predictions/actuals, retry logic, state machine, `ChartPoint` assembly. Verify with `tsc --noEmit`.
3. **`frontend/src/components/backtest/SummaryCard.tsx`** — implement (§5.1). Verify `tsc`.
4. **`frontend/src/components/backtest/PerTrendTable.tsx`** — implement (§5.2). Verify `tsc`.
5. **`frontend/src/components/backtest/TimeSeriesChart.tsx`** — implement (§5.3) using `lightweight-charts` (PM SQ-1 ruling: option b; do NOT install recharts). Mirror the `MainChart.tsx` pattern: container `<div ref={containerRef} data-testid="time-series-chart" style={{ width: '100%', minHeight: '240px' }}>`; `useEffect` creates chart instance, two `addLineSeries` calls, sets data, returns cleanup that calls `chart.remove()`. Add `ResizeObserver` to keep `chart.applyOptions({ width: container.clientWidth })` synced. Verify `tsc`.
6. **`frontend/src/components/backtest/ActiveParamsCard.tsx`** — implement (§5.4). Verify `tsc`.
7. **`frontend/src/pages/BacktestPage.tsx`** — assemble page from hook + 4 components (§5). Verify `tsc`.
8. **`frontend/src/main.tsx`** — add lazy import line + Route (§2 Modified files).
9. **`frontend/src/components/UnifiedNavBar.tsx`** — add Backtest entry at index 2 (§2 Modified files).
10. **`frontend/src/hooks/useGAPageview.ts`** — add `/backtest` entry to PAGE_TITLES (§2 Modified files).
11. **`firestore.rules`** — write public-read / write-deny rules (AC-081-FIRESTORE-RULES).
12. **`firebase.json`** — add Firestore deploy target.
13. **Vitest unit tests** — `backtest-types.test.ts` (test 6), NavBar test (test 7), `useGAPageview.test.tsx` (test 8).
14. **`frontend/e2e/backtest-page.spec.ts`** — Playwright spec (4 cases, §8 tests 2–5). Use `route.fulfill()` for Firestore mock.
15. **`ssot/system-overview.md`** — add `/backtest` route, Firestore read arrow (AC-081-DOCS-UPDATE). Fix stale "Recharts" tech-stack entry per PM's SQ-1 ruling.
16. **`ssot/PRD.md`** — append Backtest Page heading with 4 AC IDs (AC-081-DOCS-UPDATE).

**Parallelizable:** Steps 3–6 (four child components) can be implemented in parallel once step 2 (hook types) is complete. Steps 13–14 (tests) can be written alongside steps 3–12.

---

## §10 Open Questions for PM

**None — all ACs implementable as written after SQ-1 resolution (PM ruled option b: `lightweight-charts`).**

---

## Boundary Pre-emption Checklist

| Boundary scenario | Status |
|--|--|
| Empty / null summary from Firestore | Defined: `per_trend` uses `Partial<Record<...>>`, missing keys → N/A rows |
| `listDocuments` returns 0 docs (no summary yet) | Defined: `documents[0]` undefined → hook sets `status='error'`, `error='No backtest summary available yet'` |
| `runQuery` returns < 2 paired chart points | Defined: `time-series-empty` placeholder per AC |
| API 400/403/500/timeout | Defined: retry once, 5s delay; second failure → `status='error'` |
| `optimized_at` null | Defined: `ActiveParamsCard` shows `Defaults — never optimized` |
| 35-doc runQuery limit exceeded (> 35 predictions in 30 days) | Defined: hook logs warning, uses the 35 returned; chart shows most recent 35 |
| Double-mount / StrictMode double-invoke | Defined: single `useEffect` with `[]`; no user-triggered refetch; second call is no-op |

## Refactorability Checklist

- [x] **Single responsibility:** hook owns fetch; each component owns its own rendering section only.
- [x] **Interface minimization:** hook returns 6 fields; no extra fields propagated.
- [x] **Unidirectional dependency:** BacktestPage → hook → Firestore REST; no circular deps.
- [x] **Replacement cost:** Firestore REST client is isolated in `useBacktestData.ts`; swapping to SDK or proxy API touches 1 file only.
- [x] **Clear test entry point:** each component props interface + hook return type are explicit contracts for QA.
- [x] **Change isolation:** UI changes to components don't touch hook; hook API contract changes are localized.

## All-Phase Coverage Gate

| Phase | Backend API | Frontend Routes | Component Tree | Props Interface |
|-------|------------|----------------|----------------|----------------|
| 1 (K-081 single) | N/A (no BE change; Firestore REST is documented in §4) | `/backtest` defined in §2 | 4 children listed in §5 | All 4 interfaces in §5 |

## Retrospective

**Where most time was spent:** §0 Scope Questions — discovering Recharts is not in package.json, tracing through QA Challenge #6 incorrect ruling.

**Which decisions needed revision:** `actual_close` derivation for TimeSeriesChart — `ActualOutcome` has no `actual_close` field; had to rule on midpoint `(actual_high + actual_low) / 2` as proxy.

**Next time improvement:** When a QA consultation ruling says "dependency confirmed present", grep `package.json` directly before accepting the ruling — do not rely on the ruling's stated evidence.

---

Architect delivery gate:
  all-phase-coverage=✓,
  pencil-frame-completeness=N/A — visual-delta=none; no Pencil frame produced,
  visual-spec-json-consumption=N/A — no .pen file,
  sacred-ac-cross-check=N/A — no DOM restructure; no data-testid deletion; all testids are new additions,
  route-impact-table=N/A — ticket scoped to single new route; no global CSS / sitewide token change,
  cross-page-duplicate-audit=✓ — grepped `backtest|SummaryCard|PerTrendTable|TimeSeriesChart|ActiveParams` in frontend/src/components frontend/src/pages; confirmed no existing duplicates; all 4 components are new under a new `backtest/` subdirectory,
  target-route-consumer-scan=N/A — new route `/backtest`; no existing entry points to scan before this ticket,
  architecture-doc-sync=✓ — ssot/system-overview.md to be updated per AC-081-DOCS-UPDATE (step 15 of implementation order),
  self-diff=N/A — new file; no prior version to diff,
  output-language=✓
  → OK (pending PM ruling on SQ-1 before Engineer writes TimeSeriesChart.tsx)
