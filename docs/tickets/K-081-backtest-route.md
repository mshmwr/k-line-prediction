---
id: K-081
title: Frontend /backtest route — read-only consumer of Firestore predictions/actuals/summaries
status: closed
created: 2026-05-02
closed: 2026-05-02
closed-commit: 1388b51
type: feat
priority: high
size: medium
owner: engineer
dependencies: [K-080]
epic: backtest-self-tuning
epic-tickets: [K-078, K-080, K-081, K-082]
spec: ~/.claude/plans/pm-app-jaunty-wren.md
base-commit: fb3d989
visual-delta: none
content-delta: none
qa-early-consultation: "complete — 7 challenges raised, 5 supplemented to AC, 2 declared Known Gap — see ## QA Early Consultation"
---

# K-081 — Frontend /backtest route

## Summary

New React route `/backtest` that reads Firestore `backtest_summaries/{latest}` + `predictor_params/active` (read-only) and renders four sections: latest summary card (hit rates, MAE, RMSE, sample size), per-trend table (up/down/flat × hit metrics), time-series chart (last 30 days predicted-vs-actual using existing Recharts dependency), and active params card (window/pearson/top_k/optimized_at/params_hash). Firestore access uses public-read REST endpoint — no auth required for reads, write-deny enforced by `firestore.rules` (PM ruling on QA Challenge #3).

## Scope

**New files:**
- `frontend/src/pages/BacktestPage.tsx` — top-level page component (≤180 lines target)
- `frontend/src/components/backtest/SummaryCard.tsx` — latest summary section
- `frontend/src/components/backtest/PerTrendTable.tsx` — 3-row trend table
- `frontend/src/components/backtest/TimeSeriesChart.tsx` — Recharts overlay (predicted-median vs actual-close, 30-day)
- `frontend/src/components/backtest/ActiveParamsCard.tsx` — params display
- `frontend/src/hooks/useBacktestData.ts` — Firestore read hook (REST fetch + retry + loading/error states)
- `frontend/src/types/backtest.ts` — TypeScript mirror types of K-080's 3 frozensets + ParamSnapshot
- `frontend/e2e/backtest-page.spec.ts` — Playwright spec
- `firestore.rules` (new at repo root) — public-read on `predictions`/`actuals`/`backtest_summaries`/`predictor_params`; deny all writes
- `firebase.json` — add `firestore` deploy target (rules path only; no indexes file)

**Modified files:**
- `frontend/src/main.tsx` — register `/backtest` route + lazy chunk
- `frontend/src/components/UnifiedNavBar.tsx` — add `Backtest` link entry between `Diary` and `About`
- `frontend/src/hooks/useGAPageview.ts` — add `/backtest` entry to `PAGE_TITLES` map

**Read-only (must not change):**
- `backend/firestore_config.py` — K-081 is a frontend reader, not a backend modifier
- `backend/predictor.py` — out of scope
- `scripts/daily_predict.py` — out of scope (writer ticket K-080)

**Docs updates:**
- `ssot/system-overview.md` — add `/backtest` route to frontend route list + Firestore read arrow on the data-flow diagram
- `ssot/PRD.md` — append AC IDs for `/backtest` page surface
- `docs/designs/K-081-design.md` — Architect deliverable

**Out of scope:**
- Bayesian optimizer workflow (`weekly-optimize.yml`) — K-082
- Any write path from frontend to Firestore (write-deny enforced; UI is read-only)
- Authentication / role-based UI gating (Firestore reads are public per Phase-1 design)
- Mobile-specific layout polish beyond Tailwind responsive defaults

## Acceptance Criteria

### AC-081-ROUTE-REGISTRATION
- Given: K-081 changes are applied
- When: `frontend/src/main.tsx` is read
- Then: a `<Route path="/backtest" element={<BacktestPage />} />` line exists inside the `<Routes>` block
- And: `BacktestPage` is imported via `React.lazy(() => import('./pages/BacktestPage'))` to match the K-049 Phase-3 chunk-splitting pattern
- And: navigating to `/backtest` in the running dev server returns HTTP 200 and renders the `BacktestPage` root element

### AC-081-NAVBAR-ENTRY
- Given: K-081 changes are applied
- When: `frontend/src/components/UnifiedNavBar.tsx` is read
- Then: a `{ label: 'Backtest', path: '/backtest' }` entry exists in `TEXT_LINKS` between the existing `Diary` and `About` entries
- And: the entry has neither `hidden: true` nor `external: true` (renders as a standard SPA `<Link>`)
- And: when `pathname === '/backtest'`, the link receives `aria-current="page"` and the `text-brick-dark` active class

### AC-081-GA-PAGEVIEW
- Given: K-081 changes are applied
- When: `frontend/src/hooks/useGAPageview.ts` is read
- Then: `PAGE_TITLES` contains the entry `'/backtest': 'K-Line Prediction — Backtest'`
- And: navigating to `/backtest` in the dev server fires exactly one GA `page_view` event with that title (verified via the existing `analytics` mock pattern from K-049)

### AC-081-FIRESTORE-READ-HOOK
- Given: `useBacktestData` is invoked from `BacktestPage`
- When: the hook executes
- Then: it fetches `backtest_summaries/{latest}` AND `predictor_params/active` from Firestore via the public REST endpoint (`https://firestore.googleapis.com/v1/projects/{projectId}/databases/(default)/documents/...`)
- And: it returns a typed object `{ summary, params, status, error }` where `status ∈ { 'loading', 'ready', 'error' }`
- And: while either fetch is pending, `status === 'loading'`; when both succeed, `status === 'ready'`; if either fails after one retry, `status === 'error'` and `error` carries a string message
- And: the hook does NOT use any write API (no `setDoc`, no `addDoc`, no `update`)
- And: the project ID is read from `import.meta.env.VITE_FIRESTORE_PROJECT_ID` with a fallback to a hardcoded constant `K_LINE_FIRESTORE_PROJECT_ID` defined in the hook file (Known Gap: env-var wiring is left to deploy ticket; constant must match the project used by K-080's GHA writer)

### AC-081-LATEST-SUMMARY-CARD
- Given: `useBacktestData` returns `status === 'ready'` with a non-null `summary`
- When: `BacktestPage` renders
- Then: a `SummaryCard` element with `data-testid="backtest-summary-card"` is mounted
- And: the card displays four numeric metrics from `summary`: `hit_rate_high` (formatted as percentage with 1 decimal), `hit_rate_low` (same), `avg_mae` (4-decimal float), `avg_rmse` (4-decimal float)
- And: the card displays `sample_size` and `window_days` as plain integers
- And: each metric label-value pair has a `data-testid` attribute of the form `summary-{field}` for stable Playwright selection
- And: when `status === 'loading'` the card renders a skeleton (placeholder div with `data-testid="summary-card-loading"`); when `status === 'error'` the card renders an error block with `data-testid="summary-card-error"` showing the error message

### AC-081-PER-TREND-TABLE
- Given: `summary.per_trend` contains keys `up`, `down`, `flat` (any subset is valid; missing keys render N/A row)
- When: `BacktestPage` renders
- Then: a `<table>` element with `data-testid="per-trend-table"` is mounted with exactly 3 data rows (one per trend, in the order up → down → flat)
- And: each row's cells display: trend label, `hit_rate_high` (% 1-decimal), `hit_rate_low` (% 1-decimal), `avg_mae` (4-decimal), `sample_size` (int)
- And: rows for trends not present in `summary.per_trend` show literal `N/A` in numeric cells (do not render `0` — distinguish "no data" from "zero hits")
- And: the table has accessible column headers `<th>` for each column (Trend, High Hit %, Low Hit %, Avg MAE, Samples)

### AC-081-TIME-SERIES-CHART
- Given: K-081 implementation is complete; the chart consumes a 30-day time-series of completed (prediction + actual) pairs assembled by `useBacktestData`
- When: `BacktestPage` renders with `status === 'ready'`
- Then: a chart container `<div data-testid="time-series-chart">` is mounted with non-zero rendered pixel dimensions (width ≥ 600px at desktop, height ≥ 240px) when ≥2 completed pairs are present
- And: the chart is implemented using `lightweight-charts` (existing dependency, same library as `MainChart.tsx` — PM ruling 2026-05-02 SQ-1: AC originally said Recharts but `recharts` is not installed; reuse `lightweight-charts` to avoid adding a new dep)
- And: the chart renders at minimum two line series: one for `projected_median` (color: brick-dark per K-017 palette = `#9C4A3B`) and one for `actual_close` (color: ink/60 ≈ `#999999`)
- And: when fewer than 2 completed pairs exist, the chart slot renders a placeholder `<div data-testid="time-series-empty">` with the text `Not enough completed pairs yet — minimum 2 required for chart.`
- And: data assembly logic is in `useBacktestData` (or a sibling helper); `TimeSeriesChart.tsx` is a presentational component (no fetch logic inside)
- Known Gap 1: 30-day series assembly requires reading `predictions/{ts}` + `actuals/{ts}` collections (not just `backtest_summaries/{latest}`); Architect specified the exact REST collection-list query shape + pagination strategy in `docs/designs/K-081-design.md` §4
- Known Gap 2: `lightweight-charts` renders to a canvas — the container `data-testid` is queryable from Playwright but axis tick labels are not DOM-queryable. Acceptable trade-off: presence + dimensions check substitutes for tick-count assertion.

### AC-081-ACTIVE-PARAMS-CARD
- Given: `useBacktestData` returns `params` (the `predictor_params/active` doc body)
- When: `BacktestPage` renders
- Then: an `ActiveParamsCard` element with `data-testid="active-params-card"` is mounted
- And: the card displays four fields from `params`: `window_days` (int), `pearson_threshold` (2-decimal float), `top_k` (int), `params_hash` (12-char prefix only — full hash is too long for the layout)
- And: the card displays `optimized_at` formatted as `YYYY-MM-DD HH:mm UTC` (or `Defaults — never optimized` when the doc is missing or `optimized_at` is null)
- And: each value has a `data-testid` of the form `param-{field}` — exact testids: `param-window_days`, `param-pearson_threshold`, `param-top_k`, `param-params_hash`, `param-optimized_at`
- And: when `predictor_params/active` doc is missing (404), the hook returns a sentinel with `optimized_at: null` and defaults `window_days: 30, pearson_threshold: 0.4, top_k: 10` so the card shows `Defaults — never optimized`

### AC-081-FIRESTORE-RULES
- Given: K-081 changes are applied
- When: `firestore.rules` is read
- Then: it contains a `match /databases/{database}/documents` block declaring:
  - `allow read: if true` for paths `predictions/{id}`, `actuals/{id}`, `backtest_summaries/{id}`, `predictor_params/{id}`
  - `allow write: if false` (or equivalent service-account-only rule) for all four collections
- And: `firebase.json` declares a `firestore.rules` deploy target pointing at `firestore.rules`
- And: a manual one-line deploy verification step is documented in `ssot/deploy.md` (`firebase deploy --only firestore:rules`)

### AC-081-PLAYWRIGHT-SPEC
- Given: K-081 implementation is complete
- When: `npx playwright test backtest-page.spec.ts` is run against the dev server
- Then: the spec passes with at minimum 4 cases:
  1. Route renders without console error; all 4 testids (`backtest-summary-card`, `per-trend-table`, `time-series-chart`, `active-params-card`) are present
  2. Per-trend table has exactly 3 data rows in order up → down → flat
  3. Loading state: when Firestore fetch is mocked to delay 500ms, `summary-card-loading` testid is visible during the wait
  4. Error state: when Firestore fetch is mocked to fail twice, `summary-card-error` testid is visible with the mocked error message
- And: the spec uses Playwright `route.fulfill()` to mock the Firestore REST responses (no live network call in tests)
- And: cases use `getByTestId(...)` and `{ exact: true }` text assertions per the K-Line frontend page checklist

### AC-081-TYPE-CONTRACT
- Given: K-081 changes are applied
- When: `frontend/src/types/backtest.ts` is read
- Then: it exports TypeScript types `BacktestSummary`, `ActualOutcome`, `Prediction`, `ActiveParams`
- And: each property name in `BacktestSummary` matches exactly one element of K-080's `FIRESTORE_BACKTEST_SUMMARY_FIELDS` frozenset (camelCase ↔ snake_case translation handled in the read hook, NOT in the type — type uses snake_case to mirror Firestore wire format and enforce parity)
- And: the same parity holds for `ActualOutcome` ↔ `FIRESTORE_ACTUAL_FIELDS` and `Prediction` ↔ `FIRESTORE_PREDICTION_FIELDS`
- And: a comment block at the top of the file states: `// Mirrors backend/firestore_config.py frozensets — keep in sync; cross-ticket contract from K-080.`

### AC-081-NO-BACKEND-MUTATION
- Given: the K-081 branch changes are applied
- When: `git diff origin/main backend/` is run
- Then: the output is empty (zero lines changed under `backend/`)

### AC-081-TSC-CLEAN
- Given: K-081 implementation is complete
- When: `npx tsc --noEmit` is run from the `frontend/` directory
- Then: it exits 0 with zero type errors
- And: `npm run lint` (if configured) also exits 0

### AC-081-DOCS-UPDATE
- Given: K-081 changes are applied
- When: `ssot/system-overview.md` is read
- Then: `/backtest` is listed under the frontend routes inventory with a one-line description
- And: a Firestore read arrow from frontend to Firestore is shown in the data-flow diagram (or text description)
- And: `ssot/PRD.md` lists the AC IDs `AC-081-LATEST-SUMMARY-CARD`, `AC-081-PER-TREND-TABLE`, `AC-081-TIME-SERIES-CHART`, `AC-081-ACTIVE-PARAMS-CARD` under a `Backtest Page` heading

## Blocking Questions

_(none at ticket open — all QA challenges resolved or declared Known Gap)_

## QA Early Consultation

**Mode:** PM proxy (disclosed)
**Date:** 2026-05-02
**Ticket:** K-081

### Challenges raised and rulings

**QA Challenge #1 — Firestore project ID source-of-truth**
Issue: AC-081-FIRESTORE-READ-HOOK references project ID; if the value is hardcoded in two places (frontend constant + GHA writer in K-080) they will drift.
Ruling: Hardcoded constant `K_LINE_FIRESTORE_PROJECT_ID` in `useBacktestData.ts` with a `// must match scripts/daily_predict.py firestore project` comment. Env-var injection (`VITE_FIRESTORE_PROJECT_ID`) is preferred path with the constant as fallback. Single-SOR enforcement deferred to deploy ticket. Known Gap codified.

**QA Challenge #2 — TypeScript types snake_case vs camelCase**
Issue: K-Line convention is camelCase frontend / snake_case backend; types in `types/backtest.ts` should follow which?
Ruling: snake_case in the type definition (mirror Firestore wire format) — translation to camelCase happens in the read hook only at the boundary. This makes `frozenset` parity verifiable by direct text-comparison; AC-081-TYPE-CONTRACT enforces this.

**QA Challenge #3 — Public-read security implication**
Issue: `allow read: if true` exposes prediction history to anyone with the project ID.
Ruling: Acceptable for Phase-1; this is a portfolio app showing public ETH/USDT predictions, no PII. Write-deny enforced. If app expands beyond ETH/USDT or stores user-specific data, revisit in a Phase-2 ticket. Codified as design constraint in AC-081-FIRESTORE-RULES.

**QA Challenge #4 — Time-series chart data assembly**
Issue: 30-day predicted-vs-actual series requires reading `predictions/{ts}` + `actuals/{ts}` collections, not just `backtest_summaries/{latest}`. Where does the join happen — frontend or backend?
Ruling: Frontend. Architect must specify the REST `runQuery` or `listDocuments` shape in the design doc. Pagination strategy left to Architect. Known Gap declared (AC-081-TIME-SERIES-CHART has explicit "Architect to specify" clause).

**QA Challenge #5 — Loading vs error UI distinction**
Issue: Original AC said "renders without console error" — does not distinguish between loading and error states for Playwright.
Ruling: Three distinct testids — `summary-card-loading`, `summary-card-error`, plus the ready-state main testid `backtest-summary-card`. AC-081-PLAYWRIGHT-SPEC has explicit cases for both edge states.

**QA Challenge #6 — Recharts dependency check**
Issue: AC mentions Recharts; need to verify it's in `package.json`.
Original ruling (SUPERSEDED): "Confirmed present (existing chart code in `MainChart.tsx`). No new dependency needed; reuse existing version." This was incorrect — `MainChart.tsx` uses `lightweight-charts`, not Recharts; `recharts` is NOT in `package.json`. The stale `system-overview.md` listed Recharts in tech stack.
Updated ruling (2026-05-02 SQ-1, PM mid-pipeline): use `lightweight-charts` (existing dep) rather than installing `recharts`. AC-081-TIME-SERIES-CHART rewritten — chart-container testid + pixel-dimension check substitute for the original "Recharts LineChart element + 7 X-axis tick labels" assertion (canvas-rendered ticks are not DOM-queryable).

**QA Challenge #7 — `/backtest` GA pageview test wiring**
Issue: AC-081-GA-PAGEVIEW says "verified via existing analytics mock" — Engineer needs to know which mock pattern.
Ruling: Architect to surface the pattern in the design doc. The existing `useGAPageview` hook tests under `frontend/src/__tests__/` are the reference. Codified as a design-doc obligation, not a fresh AC.

### QA Consultation summary
7 challenges raised — 5 supplemented to AC, 2 declared Known Gap:
- Known Gap 1: Firestore project ID hardcoded in two places (frontend constant + GHA writer) until deploy ticket wires `VITE_FIRESTORE_PROJECT_ID`.
- Known Gap 2: 30-day predicted-vs-actual series requires `predictions/{ts}` + `actuals/{ts}` collection reads; exact REST query shape and pagination to be specified by Architect in design doc, not pre-codified at ticket open.

## Release Status

_(to be filled at close)_

## Retrospective

_(to be filled at close)_
