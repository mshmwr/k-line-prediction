---
title: K-Line Prediction — System Architecture
type: reference
tags: [K-Line-Prediction, Architecture, API]
updated: 2026-05-05 (K-096)
---

## Summary

ETH/USDT K-line candlestick pattern similarity prediction system. User uploads recent OHLC; backend finds the most similar historical segments, computes MA99, and returns projection statistics.

- **Frontend:** 6 SPA routes (`/` `/app` `/about` `/diary` `/business-logic` `/backtest`) + Unified NavBar. `/about` is a portfolio-oriented recruiter page with 8 sections (K-058, 2026-04-28). `/diary` is a v2 timeline with infinite-scroll pagination (K-024/K-059). `/backtest` is a read-only Firestore consumer showing 30-day rolling prediction accuracy (K-081).
- **Backend:** FastAPI single-file `main.py`; 2 in-memory history stores (`_history_1h` / `_history_1d`); auto-scraper via K-048 Cloud Run cron keeps history current.
- **Stats SSOT (TD-008 Option C, K-013 closed 2026-04-21):** frontend computes subset stats (`statsComputation.ts`); backend computes full-set baseline; drift locked by `backend/tests/fixtures/stats_contract_cases.json`.
- **Content SSOT (K-052/K-062):** `content/site-content.json` is the hand-edit source for stack[], processRules[], renderSlots; generator (`scripts/build-ticket-derived-ssot.mjs`) auto-fills metrics and emits `docs/sacred-registry.md` + README marker blocks.
- **Known modularity debt:** `AppPage.tsx` (TD-005 — K-075 RFC in progress, 3-hook decomposition + `useOfficialInput` / `useHistoryUpload` / `usePredictionWorkspace`) / `main.py` (TD-006) / `predictor.py` (TD-007) pending Architect RFC; see Known Architecture Debt table.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | TypeScript + React + lightweight-charts + Vite + react-router-dom |
| Backend | Python + FastAPI + python-jose |
| Tests (FE) | Vitest + Playwright |
| Tests (BE) | pytest |

---

## Firestore Config Layer (K-078/K-080)

| Collection | Doc | Purpose |
|---|---|---|
| `predictor_params` | `active` | Current predictor params (window, pearson, top_k, optimized_at, params_hash) |
| `predictor_params` | `history/{run_id}` | K-081: Bayesian run winners |
| `predictions` | `{YYYY-MM-DD-HH}` | K-080: daily prediction records (fields: `FIRESTORE_PREDICTION_FIELDS`) |
| `actuals` | `{YYYY-MM-DD-HH}` | K-080: realized 72h windows (fields: `FIRESTORE_ACTUAL_FIELDS`) |
| `backtest_summaries` | `{YYYY-MM-DD}` | K-080: rolling 30-day accuracy summaries (fields: `FIRESTORE_BACKTEST_SUMMARY_FIELDS`) |
| `optimize_runs` | `{run_id}` | K-083: Bayesian optimizer run metadata (fields: `FIRESTORE_OPTIMIZE_RUN_FIELDS`) |

Backend reads `predictor_params/active` once at boot via `backend/firestore_config.py::load_active_params()`.
`predictor.params` is the single `ParamSnapshot` namespace object; atomically replaced at startup.
Firestore calls are NOT made per-request — `/api/health` reads the cached `predictor.params`.
Security: client-facing writes denied; Admin SDK (Cloud Run runtime SA) bypasses client rules.

### Frontend Firestore Read (K-081)

```
Browser /backtest  →  useBacktestData.ts
  ├─ GET .../backtest_summaries?pageSize=1&orderBy=__name__%20desc  → BacktestSummary
  ├─ GET .../predictor_params/active                                 → ActiveParams
  ├─ POST .../runQuery  (predictions, query_ts >= 30-days-ago)       → Prediction[]
  └─ POST .../runQuery  (actuals,     query_ts >= 30-days-ago)       → ActualOutcome[]

Join: predictions + actuals by doc-id → ChartPoint[] for TimeSeriesChart
Public-read enforced by firestore.rules; write-deny for all client paths.
```

### Daily Workflow (K-080)

```
GitHub Actions — 04:00 UTC daily (after scrape-history.yml at 03:00 UTC)
─────────────────────────────────────────────────────────────────────────
.github/workflows/daily-predict.yml
  │
  ├─ CSV freshness gate: history_database/Binance_ETHUSDT_1h.csv mtime ≤ 90 min
  │    └─ stale → log warning, exit 0 (graceful skip)
  │
  ├─ load_active_params() → predictor.params = <ParamSnapshot>
  │
  ├─ sample hour_start = random.randint(0, 17)  (K-084)
  ├─ load_csv_history → build_6h_query_window (6 × 1H bars at hour_start)
  │
  ├─ run_prediction(query_df, params, full_df, hour_start)  (K-084: hour_start added)
  │    └─ find_top_matches(hour_start=hour_start) + compute_stats() → prediction dict
  │
  ├─ write_prediction(client, ts, prediction) → predictions/{YYYY-MM-DD-HH}
  │    fields include hour_start: int (K-084, FIRESTORE_PREDICTION_FIELDS)
  │
  ├─ backfill_actuals(client, df, cutoff_ts=now-72h)
  │    └─ list_predictions_older_than() → compute_outcome() → write_actual()
  │
  └─ compute_backtest_summary(client, today) → write_summary()
       └─ backtest_summaries/{YYYY-MM-DD} (30-day rolling window)

Contract: `per_trend` sub-keys ("up"/"down"/"flat") are only written when sample_size > 0
for that trend. K-081 (frontend) must handle missing trend keys gracefully.
─────────────────────────────────────────────────────────────────────────
```

### Weekly Optimizer Workflow (K-083)

```
GitHub Actions — Mondays 05:00 UTC (workflow_dispatch also enabled)
─────────────────────────────────────────────────────────────────────────
.github/workflows/weekly-optimize.yml
  │
  ├─ pip install -r backend/requirements.txt (includes scikit-optimize>=0.9)
  ├─ GOOGLE_APPLICATION_CREDENTIALS ← ${{ secrets.GCP_SA_KEY }}
  │
  └─ python scripts/weekly_optimize.py
       │
       ├─ Corpus fetch: predictions/ + actuals/ last 90 days → completed_pairs[]
       │
       ├─ Data-sufficiency guard: len(completed_pairs) < 30 → exit 0 (graceful skip)
       │
       ├─ Bayesian search: skopt.gp_minimize over (window∈[14,60], pearson∈[0.2,0.7], top_k∈[5,30])
       │    ≤50 iterations, RANDOM_STATE=42, cost guard: early exit after 20 no-improvement iters
       │    Objective: 0.5·high_hit_rate + 0.5·low_hit_rate (evaluated via param_override context mgr)
       │
       ├─ Idempotency check: winner_hash == current_params_hash → exit 0 (no writes)
       │
       ├─ Sequential Firestore writes (retry-once each):
       │    predictor_params/active  (FIRESTORE_PREDICTOR_PARAMS_FIELDS)
       │    predictor_params/history/{run_id}  (FIRESTORE_PREDICTOR_PARAMS_HISTORY_FIELDS)
       │    optimize_runs/{run_id}   (FIRESTORE_OPTIMIZE_RUN_FIELDS)
       │
       └─ Cloud Run redeploy: gcloud run services update k-line-backend --region=asia-east1 --no-traffic
            failure → exit 1 (Firestore writes NOT rolled back)

Helper module: backend/optimizer.py (param_override, evaluate_corpus, doc builders — no Firestore I/O)
─────────────────────────────────────────────────────────────────────────
```

---

## Directory Structure

```
ClaudeCodeProject/
├── agent-context/
│   ├── architecture.md          ← monorepo-level overview
│   └── conventions.md           ← General conventions
├── PM-dashboard.md              ← Cross-project ticket progress table
├── CLAUDE.md                    ← Claude Code project instructions
├── AGENTS.md                    ← Codex project instructions
├── K-Line-Prediction/
│   ├── agent-context/
│   │   ├── architecture.md      ← This file
│   │   └── conventions.md       ← K-Line-specific conventions (naming, pre-commit, history DB)
│   ├── docs/
│   │   ├── tickets/             ← K-001 ~ K-017 tickets
│   │   ├── tech-debt.md         ← TD-001 ~ TD-008 registry
│   │   ├── designs/             ← RFC + ticket designs (TD-008 / K-017 etc.)
│   │   ├── reviews/             ← Codex / senior-engineer review records
│   │   ├── retrospectives/      ← Per-role cross-ticket accumulated retros (since K-008)
│   │   ├── reports/             ← Playwright visual-report outputs
│   │   └── ai-collab-protocols.md ← K-017 public protocol document (English, recruiter-visible)
│   ├── scripts/                 ← K-017; portfolio demo scripts
│   │   ├── audit-ticket.sh      ← A–G check group audit (portfolio demo, not CI gate)
│   │   └── build-ticket-derived-ssot.mjs ← K-052/K-062; reads ticket corpus + README markers; emits site-content.json metrics/ticketRange, sacred-registry.md, README STACK + NAMED-ARTEFACTS blocks
│   ├── content/                 ← K-052 ticket-derived SSOT (hand-edit source); generator reads + preserves hand-edited fields
│   │   ├── site-content.json    ← stack[], processRules[], renderSlots (hand-edit); metrics.*, lastUpdated, ticketRange (generator-filled)
│   │   ├── ticket-cases.json    ← K-058 SSOT for TicketAnatomySection (K-002/K-008/K-009 trio)
│   │   └── roles.json           ← K-058 SSOT for RoleCards (6 roles × Owns/Artefact)
│   ├── backend/
│   │   ├── main.py              ← FastAPI app + all /api routes + SPA fallback (last route)
│   │   ├── models.py            ← Pydantic request/response models
│   │   ├── predictor.py         ← Similarity search + MA99 + trend classify + stats computation
│   │   ├── time_utils.py        ← Time normalize (unified UTC+0 `YYYY-MM-DD HH:MM`)
│   │   ├── mock_data.py         ← Test fake data + CSV loader
│   │   ├── auth.py              ← APIRouter: POST /api/auth + GET /api/business-logic + require_jwt
│   │   ├── business_logic.md    ← JWT-protected business logic content
│   │   └── tests/
│   │       ├── conftest.py
│   │       ├── test_auth.py     ← AC-AUTH-1/2/4 + AC-TEST-AUTH-3/5
│   │       ├── test_main.py     ← main.py route integration (K-001 coverage backfill)
│   │       ├── test_predictor.py ← predictor pure function tests (incl. K-013 contract parametrize + fixture coverage + realism rule)
│   │       └── fixtures/                              ← K-013 cross-layer contract fixture directory
│   │           ├── __init__.py                        ← Empty file; makes fixtures an importable package
│   │           ├── stats_contract_cases.json         ← (all_matches_full_set / subset_deselect_one / single_match_two_bars); snake_case expected; consumed by both frontend and backend
│   │           └── generate_stats_contract_cases.py  ← deterministic generator; calls existing `compute_stats` to produce ground truth; one-click regen when backend algorithm changes
│   ├── frontend/
│   │   ├── public/
│   │   │   ├── diary.json       ← flat DiaryEntry[] static data ({ ticketId?, title, date, text }, all English, zod .strict() validated at fetch time)
│   │   │   └── docs/
│   │   │       └── ai-collab-protocols.md  ← Since K-017; copy from docs/, so SPA Hosting can directly access `/docs/ai-collab-protocols.md` (avoids SPA fallback swallowing .md)
│   │   ├── e2e/
│   │   │   ├── business-logic.spec.ts
│   │   │   ├── pages.spec.ts
│   │   │   ├── ma99-chart.spec.ts
│   │   │   ├── navbar.spec.ts
│   │   │   ├── diary-page.spec.ts          ← K-024 Phase 3; DIARY-PAGE-CURATION + TIMELINE + ENTRY-LAYOUT + PAGE-HERO + CONTENT-WIDTH
│   │   │   ├── diary-homepage.spec.ts      ← K-024 Phase 3; HOMEPAGE-CURATION (0/1/2/3-entry + tie-break)
│   │   │   ├── visual-report.ts          ← K-008 visual report script (env var TICKET_ID → docs/reports/K-XXX-visual-report.html)
│   │   │   ├── K-013-consensus-stats-ssot.spec.ts ← K-013 cross-layer contract fixture E2E guard
│   │   │   ├── K-046-example-upload.spec.ts    ← K-046; example CSV download link + upload-hidden E2E
│   │   │   ├── about-layout.spec.ts            ← K-045; container width / section gap / hero / section-label-x / sm-boundary / K031-adjacency
│   │   │   ├── about-v2.spec.ts                ← K-022 / K-034 /about structural spec (palette + FileNoBar + section labels)
│   │   │   ├── about.spec.ts                   ← legacy /about spec (pre-K-022)
│   │   │   ├── app-bg-isolation.spec.ts        ← K-030; /app bg-gray-950 isolation + no-NavBar + no-Footer guards
│   │   │   ├── favicon-assets.spec.ts          ← K-037; asset paths + link-tag hrefs + manifest schema
│   │   │   ├── ga-consent.spec.ts              ← GA consent flow E2E
│   │   │   ├── ga-spa-pageview.spec.ts         ← K-020; SPA-NAV + BEACON + NEG
│   │   │   ├── ga-tracking.spec.ts             ← K-018; dataLayer spy: pageview / click / privacy / install
│   │   │   ├── roles-doc-sync.spec.ts          ← K-039; roles SSOT parity guard
│   │   │   ├── scroll-to-top.spec.ts           ← K-053; route-change reset / hash early-return / same-route preserve
│   │   │   ├── shared-components.spec.ts       ← K-034 P1 + K-045; Footer byte-identity × 4 routes + width parity
│   │   │   ├── sitewide-body-paper.spec.ts     ← sitewide bg-paper body guard
│   │   │   ├── sitewide-fonts.spec.ts          ← K-040; sitewide Geist Mono body reset guard
│   │   │   ├── sitewide-footer.spec.ts         ← K-034; Footer 4-route + /business-logic auth fixture
│   │   │   ├── upload-real-1h-csv.spec.ts      ← K-051; real-CSV upload + 23-bar error toast + fixture parity
│   │   │   ├── _fixtures/
│   │   │   │   └── diary/                  ← K-024 Phase 3; 8 JSON fixtures (0/1/2-same-date/3/5/10/11 entry + double-click race)
│   │   │   └── fixtures/
│   │   │       └── expired-token.ts
│   │   └── src/
│   │       ├── main.tsx         ← BrowserRouter + Routes entrypoint
│   │       ├── AppPage.tsx      ← K-Line prediction main page (TD-005: too much responsibility, pending split)
│   │       ├── types.ts         ← MatchCase / PredictStats / ProjectionBar etc.
│   │       ├── types/
│   │       │   ├── diary.ts     ← `DiaryEntry { ticketId?, title, date, text }` + zod `.strict()` schema export (replaces DiaryItem / DiaryMilestone)
│   │       │   └── backtest.ts  ← K-081; TypeScript mirror types for K-080 frozensets: Prediction, ActualOutcome, BacktestSummary, ActiveParams, ChartPoint
│   │       ├── hooks/
│   │       │   ├── useAsyncState.ts
│   │       │   ├── usePrediction.ts    ← predict + computeMa99 call wrapper
│   │       │   ├── useDiary.ts         ← K-024; fetches /diary.json + AsyncState; returns sorted `DiaryEntry[]` (date desc + array-index tie-break); see Changelog K-024
│   │       │   ├── useDiaryPagination.ts ← client-side slicing pagination (5-per-click) + inFlight concurrency gate (`queueMicrotask` flush + `hasMore` / `loadMore` / `visibleCount` return shape), DiaryPage only
│   │       │   └── useBacktestData.ts  ← K-081; Firestore REST read hook (backtest_summaries + predictor_params + predictions/actuals 30-day series); retry-once; state machine loading|ready|error; assembles ChartPoint[]
│   │       ├── utils/
│   │       │   ├── aggregation.ts      ← 1H → 1D bar aggregation, time formatter
│   │       │   ├── analytics.ts        ← K-018; GA4 initGA / trackPageview / trackCtaClick
│   │       │   ├── api.ts              ← API_BASE env
│   │       │   ├── auth.ts             ← localStorage bl_token helper
│   │       │   ├── diarySort.ts        ← pure `sortDiary(entries)`: date desc + array-index tie-break (later index = newer within same date); called by useDiary
│   │       │   ├── statsComputation.ts ← K-013; `computeStatsFromMatches` pure util (subset stats, locked bit-exact <=1e-6 with backend `compute_stats` via `backend/tests/fixtures/stats_contract_cases.json`); also exports `snakeSuggestionToCamel` / `snakeStatsToCamel` / `aggregateProjectedBarsTo1D`
│   │       │   └── time.ts             ← toUTC8Display (render-only)
│   │       ├── pages/
│   │       │   ├── HomePage.tsx
│   │       │   ├── AboutPage.tsx
│   │       │   ├── DiaryPage.tsx
│   │       │   ├── BusinessLogicPage.tsx
│   │       │   └── BacktestPage.tsx             ← K-081; /backtest read-only dashboard; layout shell; mounts useBacktestData + 4 child components
│   │       ├── __tests__/
│   │       │   ├── AppPage.test.tsx         ← Vitest (K-010 fix in progress)
│   │       │   ├── MatchList.test.tsx
│   │       │   ├── OHLCEditor.test.tsx
│   │       │   ├── PredictButton.test.tsx
│   │       │   ├── StatsPanel.test.tsx
│   │       │   ├── aggregation.test.ts
│   │       │   ├── statsComputation.test.ts ← K-013; relative path import `../../../backend/tests/fixtures/stats_contract_cases.json`, runs `computeStatsFromMatches` against fixture cases and asserts bit-exact (`toBeCloseTo(value, 6)`) + error contract + key mapping
│   │       │   ├── diary.schema.test.ts     ← zod `.strict()` schema validation (valid / extra-key reject / missing-required reject / ticketId optional)
│   │       │   ├── diary.english.test.ts    ← CJK regex sweep (no `/[一-鿿]/` in text+title per entry), AC-024-ENGLISH
│   │       │   ├── diary.legacy-merge.test.ts ← verifies legacy entries (pre-K-001) merged into single "Early project phases and deployment setup" (date=2026-04-16), AC-024-LEGACY-MERGE
│   │       │   ├── diarySort.test.ts        ← date desc + array-index tie-break pure function tests
│   │       │   └── useDiaryPagination.test.ts ← visibleCount / hasMore / loadMore / concurrent double-click idempotent assertions
│   │       └── components/
│   │           ├── ErrorBoundary.tsx
│   │           ├── ScrollToTop.tsx          ← K-053; sitewide scroll-reset on route change; `useEffect` on `[pathname, hash]`, hash-link early-return, returns null
│   │           ├── MainChart.tsx            ← Main chart (history + prediction + MA99 overlay)
│   │           ├── MatchList.tsx            ← Similar case list + expandable PredictorChart (TD-004)
│   │           ├── OHLCEditor.tsx           ← OHLC input table
│   │           ├── StatsPanel.tsx           ← Statistics panel
│   │           ├── PredictButton.tsx
│   │           ├── TopBar.tsx               ← /app top bar (since K-030, /app does not render UnifiedNavBar; TopBar is the actual top bar of /app)
│   │           ├── UnifiedNavBar.tsx        ← K-005 unified NavBar (all pages)
│   │           ├── NavBar.tsx               ← legacy, kept for compatibility
│   │           ├── home/
│   │           │   ├── HeroSection.tsx
│   │           │   ├── ProjectLogicSection.tsx
│   │           │   ├── DevDiarySection.tsx      ← Home page Diary preview; consumes `useDiary(3)` flat `DiaryEntry[]`; flex-col flow layout + shared `timelinePrimitives.ts` rail/marker constants (K-024/K-028)
│   │           │   └── BuiltByAIBanner.tsx      ← Added in K-017; Homepage top thin banner → /about (DiaryPreviewEntry.tsx deleted, replaced by P4)
│   │           ├── about/                        ← /about portfolio page components; K-017 initial, K-022/K-034/K-045/K-058 progressively refactored; see Changelog
│   │           │   ├── FileNoBar.tsx                     ← K-034; dark charcoal header bar (FILE/LAYER/CASE variant); props { fileNo, rightSlot?, variant?, cardPaddingSize? }; 5 card consumers
│   │           │   ├── RedactionBar.tsx                  ← K-022; black redaction bar (`data-redaction` testid); used only in MetricCard m2
│   │           │   ├── PageHeaderSection.tsx             ← S1 "One operator" declaration; 2-line left-aligned hero + full-width divider (K-034/K-045)
│   │           │   ├── SectionLabelRow.tsx               ← K-045; extracted from AboutPage.tsx; props `{ label: string }`; renders `data-testid="section-label"` + 1px hairline
│   │           │   ├── MetricsStripSection.tsx           ← S2 4 narrative metrics container; SectionLabelRow only heading (K-034)
│   │           │   ├── MetricCard.tsx                    ← K-034; FileNoBar + Bodoni number + italic title + Newsreader subtext/note; m2 shows redaction bar
│   │           │   ├── WhereISteppedInSection.tsx        ← K-058; Nº 02.5 A+C+B comparison table (AI Did / I Decided / Outcome); testids: where-i-narrative/table/outcome
│   │           │   ├── RolePipelineSection.tsx           ← K-058; Nº 03 inline SVG pipeline diagram; viewBox 0 0 900 200; data-testid="role-pipeline-svg"; K-096 adds QA Early annotation + "PM Arbitration Detail" h3 heading + PmArbitrationDetailSvg below
│   │           │   ├── RoleCardsSection.tsx              ← Nº 04 6-role container; K-034 removed h2; K-058 updated intro to compact format
│   │           │   ├── RoleCard.tsx                      ← K-034; interface `{ role, owns, artefact, fileNo }`; Bodoni font-size 36/32 by length; K-058 compact format α (padding sm)
│   │           │   ├── ReliabilityPillarsSection.tsx     ← S4 3 pillars + anchor quotes; h2 "How AI Stays Reliable" Bodoni 30 italic (K-034)
│   │           │   ├── PillarCard.tsx                    ← K-034; Bodoni 26 italic title + Newsreader body + 40px rule + brick-left-border quote
│   │           │   ├── TicketAnatomySection.tsx          ← Nº 06 K-002/K-008/K-009 trio; K-058 inline TICKETS moved to `content/ticket-cases.json` SSOT
│   │           │   ├── TicketAnatomyCard.tsx             ← K-034; FileNoBar (CASE FILE) + Bodoni 26 title + OUTCOME/LEARNING labels + ExternalLink
│   │           │   ├── ProjectArchitectureSection.tsx    ← S6 Monorepo / Docs-driven / Testing pyramid; K-034 ARCH_PILLARS uses structured `fields` array
│   │           │   └── ArchPillarBlock.tsx               ← K-034; interface `{ layerNo, category, title, fields }`; LAYER Nº FileNoBar + Bodoni 24 title + field pattern
│   │           │   (`DossierHeader.tsx` RETIRED K-034; `FooterCtaSection.tsx` deleted K-035)
│   │           ├── diary/                                 ← K-024 Phase 3; flat `<ol role="list">` timeline; rail + marker redesign; 7 components + timelinePrimitives.ts constants module
│   │           │   ├── DiaryTimeline.tsx                  ← K-024; flat `<ol role="list">` renderer for DiaryEntryV2 + DiaryRail + InfiniteScrollSentinel
│   │           │   ├── DiaryHero.tsx                      ← K-024; page hero heading + 1px divider + subtitle
│   │           │   ├── DiaryEntryV2.tsx                   ← K-024; 3-layer entry (title em-dash / date Geist Mono / body Newsreader italic)
│   │           │   ├── DiaryRail.tsx                      ← K-024; absolute 1px vertical rail; shared with DevDiarySection; hidden when entries < 2
│   │           │   ├── DiaryMarker.tsx                    ← K-024; 20×14 brick-dark rectangle marker per AC-023-DIARY-BULLET
│   │           │   ├── DiaryLoading.tsx                   ← K-024; LoadingSpinner wrapper (data-testid="diary-loading")
│   │           │   ├── DiaryError.tsx                     ← K-024; error state (data-testid="diary-error") + Retry button
│   │           │   ├── DiaryEmptyState.tsx                ← K-024; empty state literal "No entries yet. Check back soon."
│   │           │   ├── InfiniteScrollSentinel.tsx         ← K-059; IntersectionObserver-based sentinel replacing LoadMoreButton; fade-in via transition-opacity
│   │           │   └── timelinePrimitives.ts              ← K-024; constants module: RAIL / MARKER / ENTRY_TYPE; shared by DevDiarySection + diary/ components to prevent drift
│   │           ├── primitives/                            ← K-017 Pass 2 new directory; cross-page primitive extraction (/about-only; diary/ refactor not landed)
│   │           │   ├── CardShell.tsx                      ← P2; shared by MetricCard / RoleCard / PillarCard / TicketAnatomyCard / ArchPillarBlock (K-022: dark class migrated to paper palette; PillarCard consumer adds overflow-hidden)
│   │           │   └── ExternalLink.tsx                   ← P3; target=_blank + rel=noopener noreferrer hardcoded
│   │           │   (SectionContainer.tsx P1 — **K-045 2026-04-24 RETIRED (git rm)**; sole consumer cleared; AboutPage.tsx rewritten with per-section root-child containers, primitive abstraction no longer needed)
│   │           │   (MilestoneAccordion.tsx / DiaryEntryRow.tsx / VerticalRail.tsx / TimelineMarker.tsx — K-017 Pass 2 P4/P5/P6/P7 not landed, do not exist on disk; redesigned during K-024 structural rework)
│   │           ├── shared/                                 ← K-035 new directory (landed 2026-04-22); sitewide page-level chrome canonical registry (Footer / future NavBar moves in per TD-K035-01)
│   │           │   └── Footer.tsx                          ← K-034/K-050; zero-prop shared Footer; 3 brand-asset SVG anchors + click-to-copy email; rendered across 4 routes, byte-identical DOM (Sacred)
│   │           ├── business-logic/
│   │           │   ├── PasswordForm.tsx
│   │           │   ├── BusinessLogicContent.tsx
│   │           │   └── ErrorBanner.tsx
│   │           └── common/
│   │               ├── LoadingSpinner.tsx   ← Accepts `label?: string` prop; each callsite passes context-specific copy; without label, only spinner is rendered without text (K-011 completed 2026-04-18)
│   │               ├── ErrorMessage.tsx
│   │               ├── SectionHeader.tsx
│   │               ├── SectionLabel.tsx
│   │               └── CtaButton.tsx
│   └── history_database/
│       ├── Binance_ETHUSDT_1h.csv
│       └── Binance_ETHUSDT_d.csv
```

---

## API Endpoints

Actual routes live in `backend/main.py` (plus `auth.py` router). All prefixed with `/api/*`.

### `POST /api/predict`

Main prediction endpoint.

**Request** (`PredictRequest`):
```json
{
  "ohlc_data": [{"open": 0, "high": 0, "low": 0, "close": 0, "time": "2026-01-01T00:00:00"}],
  "selected_ids": [],
  "timeframe": "1H",
  "ma99_trend_override": "up"  // optional: "up" | "down" | "flat"
}
```

**Response** (`PredictResponse`):
```json
{
  "matches": [MatchCase],
  "stats": PredictStats,
  "query_ma99_1h": [float | null],
  "query_ma99_1d": [float | null],
  "query_ma99_gap_1h": {"from_date": "...", "to_date": "..."} | null,
  "query_ma99_gap_1d": {"from_date": "...", "to_date": "..."} | null
}
```

**Caveat (K-009 fix in progress):** `find_top_matches()` currently does not pass `ma_history=_history_1d` on the 1H path, causing the fallback to be `history=_history_1h`, which makes the MA99 filter and ranking data source incorrect. AC-009-FIX locks this behavior.

---

### `POST /api/merge-and-compute-ma99`

Computes MA99 only (frontend uses this for early MA99 load; UX: Predict button is initially disabled and enables once MA99 is ready).

**Request** (`Ma99Request`): `{ ohlc_data, timeframe }`
**Response** (`Ma99Response`): `{ query_ma99_1h, query_ma99_1d, query_ma99_gap_1h, query_ma99_gap_1d }`

**In-memory only**: does not write to the history database.

---

### `POST /api/upload-history`

Uploads CSV history data; after parsing returns observable DB state. **Write path commented-out 2026-04-24 (K-046) pending K-048 auto-scraper** — parse + response payload still work, but `history_database/` is not written and `_history_1h` / `_history_1d` module state is not updated; the response's `bar_count` and `latest` reflect existing authoritative state (`len(existing)` / `existing[-1]['date']`), and `added_count` is always `0`. Three CSV formats remain supported: CryptoDataDownload, standard header, Binance raw API.

**Timeframe detection:** filename containing `_d` / `_1d` → 1D, otherwise 1H.
**Response:** `{ filename, latest, bar_count, added_count, timeframe }` — schema unchanged; post-K-046 `added_count` is always 0.

**Known risk (TD-003):** uses module globals (`_history_1h` / `_history_1d`) for read-merge-write-swap with no synchronization mechanism; concurrent uploads may lose bars. **After K-046 commented out the write path, the race surface is removed**; once K-048 restarts the write path the risk surface returns; revisit during K-048 Architect design phase.

---

### `GET /api/history-info`

Returns latest date, bar count, and filename for 1H / 1D history data.

### `GET /api/example?n=5&timeframe=1H`

Reads the first N bars from the history database as example input.

### `GET /api/official-input`

Loads the official input CSV from the path specified by env var `OFFICIAL_INPUT_CSV_PATH`.

### `POST /api/auth`

Password authentication; returns JWT token (`auth.py` router).

- Payload: `{ password }` → Response: `{ token }` or 401
- Password source: env var `BUSINESS_LOGIC_PASSWORD`, compared via `hmac.compare_digest` to prevent timing attack
- JWT secret: env var `JWT_SECRET`
- Payload: `{ sub: "business-logic-access", iat, exp: iat + 86400 }`
- `jwt.decode` must pin `algorithms=["HS256"]`

### `GET /api/business-logic`

Password-protected content (`auth.py` router, same APIRouter).

- Header: `Authorization: Bearer <token>`, validated via `HTTPBearer` + `Depends(require_jwt)`
- Content read from `Path(__file__).parent / "business_logic.md"` (avoids Railway/CR working directory inconsistency)
- 200 → `{ content }`; 401 invalid token; 404 file not found

### SPA Fallback

`GET /{full_path:path}` → `FileResponse("dist/index.html")`. **Must be the last route in main.py**, after all `include_router()` calls, so that the frontend BrowserRouter routes are taken over by the client.

---

## Key Data Models

**Backend Pydantic Models (`backend/models.py`)**
```python
OHLCBar:       open, high, low, close: float; time: str (ISO UTC)
MatchCase:     id, correlation, historical_ohlc, future_ohlc,
               historical_ohlc_1d, future_ohlc_1d,
               start_date, end_date,
               historical_ma99, future_ma99,
               historical_ma99_1d, future_ma99_1d
PredictStats:  highest/second_highest/second_lowest/lowest: OrderSuggestion,
               win_rate, mean_correlation,
               consensus_forecast_1h, consensus_forecast_1d  # full-set baseline (TD-008 Option C semantics)
Ma99Gap:       from_date, to_date
AuthRequest:   password: str
AuthResponse:  token: str
```

**Frontend TypeScript Types (`frontend/src/types.ts` + `types/diary.ts`)**
```typescript
interface DiaryEntry       { ticketId?: string; title: string; date: string; text: string }
// DiaryItem / DiaryMilestone retired K-024; all consumers (useDiary / DevDiarySection / DiaryTimeline / DiaryEntryV2) use DiaryEntry
type AuthState             = 'IDLE' | 'SHOW_PASSWORD_FORM' | 'LOADING_CONTENT' | 'SHOW_CONTENT' | 'SHOW_ERROR'
type AsyncStatus           = 'idle' | 'loading' | 'success' | 'error'
// MatchCase / PredictStats field mapping (camelCase), see Field Mapping below
```

---

## Data Flow

**The prediction pipeline (user-facing summary):**

1. User uploads recent OHLC data (CSV / JSON / manual entry / example).
2. Backend computes candlestick shape features (body%, wick%, return%).
3. Historical similar segments are filtered using MA99 trend direction as a gate (direction mismatch excluded).
4. A projected 72-hour price path is computed (median OHLC across matched segments).
5. Win rate, highest/lowest extremes, and per-day statistics are displayed.

**Call-chain detail (below).**

```
User inputs OHLC (edit table / CSV upload / JSON import / example)
  → OHLCEditor (frontend)
  → POST /api/merge-and-compute-ma99 (pre-compute MA99, Predict button disabled)
  → POST /api/predict (press Predict)
    → find_top_matches(history, ma_history, history_1d, timeframe) [predictor.py]
        ├─ _candle_feature_vector() generates candle shape features
        ├─ _normalized_similarity() computes similarity score
        ├─ _fetch_30d_ma_series() fetches 30-day MA series from ma_history (should be 1D)
        ├─ _classify_trend_by_pearson() determines MA99 direction
        ├─ MA99 direction gate (direction mismatch excluded)
        └─ Returns top N matches + 1D aggregation
    → compute_stats(matches, current_close, timeframe)
        ├─ _projected_future_bars() → consensus forecast (full set)
        └─ OrderSuggestion × 4 + win_rate + mean_correlation
  → PredictResponse
  → frontend displayStats useMemo
    ├─ appliedSelection == full set → use appliedData.stats (computed by backend)
    └─ appliedSelection ⊂ full set → utils/statsComputation.ts::computeStatsFromMatches() frontend computes subset (landed in K-013)
  → MainChart + MatchList + StatsPanel render
```

---

## Consensus Stats Source of Truth

**Decision source:** TD-008 RFC Option C (accepted 2026-04-18, see `docs/designs/TD-008-rfc-consensus-source-of-truth.md`). Implementation ticket: [K-013](../docs/tickets/K-013-consensus-stats-contract.md).

**Core rules:**

1. **Full-set stats (all top-N matches) computed by backend**: the `stats.consensus_forecast_1h/1d` and 4 OrderSuggestions returned by `/api/predict` are the "full-set baseline". When the frontend receives them and `appliedSelection == all matches`, use them directly; do not recompute.
2. **Subset stats (user deselects some matches) computed by frontend**: no backend round-trip (preserves zero-latency UX). Pure function extracted into `frontend/src/utils/statsComputation.ts`, signature:
   ```ts
   computeStatsFromMatches(
     matches: MatchCase[],
     currentClose: number,
     timeframe: '1H' | '1D',
     lastBarTime?: string,
   ): StatsComputationResult
   // StatsComputationResult = { stats: Omit<PredictStats, 'consensusForecast1h' | 'consensusForecast1d'>, projectedFutureBars: ProjectionBar[] }
   // consensusForecast1h/1d is composed outside the util by AppPage from projectedFutureBars + aggregateProjectedBarsTo1D
   ```
3. **Dual implementations locked against drift by contract fixture**:
   - Fixture: `backend/tests/fixtures/stats_contract_cases.json` (array of `{name, input, expected}`, covers full-set / subset / single-match boundaries)
   - Generator: `backend/tests/fixtures/generate_stats_contract_cases.py` (versioned script; uses current `compute_stats` output as ground truth; one-click regen when backend algorithm changes)
   - Backend `test_predictor.py` adds a parametrize test: reads fixture, asserts `compute_stats(**input)` == `expected` (tolerance 1e-6)
   - Frontend `__tests__/statsComputation.test.ts`: relative path `../../../backend/tests/fixtures/stats_contract_cases.json`, build-time JSON import (requires `tsconfig.json::resolveJsonModule: true`); runs `computeStatsFromMatches(...)` against 3 cases and asserts bit-exact after snake→camel whitelist conversion
   - Backend algorithm change without fixture sync → backend test fails; frontend algorithm drift → frontend test fails. Either side breaking the contract turns CI red immediately.
   - Contract test comparison scope: 4 OrderSuggestions + `win_rate` + `mean_correlation`. **Does not compare** `consensus_forecast_1h/1d` (see Known Gap).
4. **API payload unchanged**: `/api/predict` response schema is untouched; existing E2E mocks need no changes.
5. **CI contract drift job deferred**: this cycle relies on PR reviewer manual gating + tests consuming the same fixture as a safety net. After K-013 acceptance, evaluate next cycle whether to add a standalone drift job.

**Why Options A / B were not chosen** (excerpt; full argument in the RFC):
- A (backend-only, hits API on every deselect): each click incurs 100–300ms round-trip; UX regresses for what-if analysis scenarios
- B (frontend-only, delete backend stats): invalidates a substantial portion of existing `test_predictor.py` tests; negative investment

**Wire-level vs Observable contract (2026-04-21 Round 2 Fix 1 `853a8aa` correction; original Known Gap retracted):** Backend `PredictStats.consensus_forecast_1h/1d` is always `[]` at wire level (`compute_stats` never populates them; `models.py` default `[]`) — this is a backend API schema fact. **Observable chart rendering is unconditionally injected by the frontend `AppPage.tsx` `displayStats` useMemo** with `projectedFutureBars` / `projectedFutureBars1D` (injected on both full-set and subset branches), so `StatsPanel::ConsensusForecastChart` is visible in both selection states. OLD base `b0212bb` L224-226 already had this unconditional injection behavior; K-013 Round 1 `8442966` mistakenly bound the injection to the subset branch only → full-set branch chart disappeared → triggered C-1 Critical; Round 2 Fix 1 `853a8aa` restored unconditional injection. The earlier design-doc statement "no consensus chart in full-set, pre-existing gap" was a misjudgment by Architect Pre-Design Audit which only read the backend schema without cross-verifying the OLD frontend observable; this has been marked "RETRACTED" in K-013 design doc §0.3 and corrected. Making `consensus_forecast_*` backend-computed instead of frontend-injected in the future would require a separate ticket.

---

## Known Architecture Debt

Full registry in [`docs/tech-debt.md`](../docs/tech-debt.md); below are the structural tech-debt items and Architect's planned split directions.

| ID | Area | Problem | Planned direction | Schedule trigger |
|----|------|---------|-------------------|------------------|
| TD-003 | `backend/main.py` | upload history uses module globals, concurrent race | `asyncio.Lock` or `history_repository` atomic write (suggest folding into TD-006 RFC) | multi-worker deploy / TD-006 start |
| TD-004 | `frontend/src/components/MatchList.tsx` | `PredictorChart` effect deps do not include candle values; same length but different content → stale chart remains | switch to memoized chart input or data identity hash, also remove exhaustive-deps suppression | same batch as TD-005 |
| TD-005 | `frontend/src/AppPage.tsx` | 22 KB single file; responsibilities include official CSV parse / upload workflow / MA99 loading / prediction orchestration / derived stats / selection state / layout | split into `useOfficialInput()` / `useHistoryUpload()` / `usePredictionWorkspace()` + extract left/right rails as presentational sub-sections | After K-013 acceptance → Architect RFC |
| TD-006 | `backend/main.py` | 12 KB single file; FastAPI wiring / CSV parse / mutable state / persistence / prediction orchestration / SPA fallback all mixed | split into `history_repository.py` / `history_service.py` / `prediction_service.py`; `main.py` keeps only a thin routing layer; suggest folding TD-003 | After K-013 acceptance → Architect RFC (with TD-003) |
| TD-007 | `backend/predictor.py` | 17 KB single file; time normalize / MA99 helpers / similarity / trend classify / 1D aggregation / stats generation all mixed | split into `predictor_ma.py` / `predictor_similarity.py` / `predictor_stats.py`; `predictor.py` becomes orchestration entrypoint. When `compute_stats` moves to `predictor_stats.py`, the K-013 contract fixture must be migrated in sync | After K-013 acceptance → Architect RFC |
| TD-008 | cross-layer stats | frontend/backend double-compute drift risk | Option C implemented (K-013, closed 2026-04-21); contract fixture locks drift | closed |

**RFC ordering (PM confirmed):**
1. TD-005 RFC (`AppPage.tsx` split; `usePredictionWorkspace()` boundary uses `statsComputation.ts` from K-013)
2. TD-006 + TD-003 combined RFC (backend split + concurrency lock)
3. TD-007 RFC (`predictor.py` split; contract fixture migration)

---

## Time Format Convention

**Transport/storage layer unifies on UTC+0 `YYYY-MM-DD HH:MM` (16 chars). Convert to UTC+8 only at render layer.**

- Backend: `time_utils.normalize_bar_time()` handles unified conversion (accepts ISO, Unix ms, ISO with `HH:MM:SS`)
- Frontend API payload: UTC+0
- Frontend render: `utils/time.ts::toUTC8Display()` converts to UTC+8 `MM/DD HH:mm` before display
- Chart (lightweight-charts): timestamps are shifted +8h before being fed into the library, so the UTC-based x-axis displays UTC+8 labels

> This convention originated from a 2026-04 bug fix: mixing UTC vs UTC+8 caused incorrect MA99 direction classification.

---

## Frontend ↔ Backend Field Mapping

| Backend (snake_case) | Frontend (camelCase) |
|---------------------|---------------------|
| `ohlc_data` | `ohlcData` |
| `selected_ids` | `selectedIds` |
| `start_date` | `startDate` |
| `end_date` | `endDate` |
| `historical_ohlc` | `historicalOhlc` |
| `future_ohlc` | `futureOhlc` |
| `historical_ohlc_1d` | `historicalOhlc1d` |
| `future_ohlc_1d` | `futureOhlc1d` |
| `historical_ma99` | `historicalMa99` |
| `future_ma99` | `futureMa99` |
| `historical_ma99_1d` | `historicalMa991d` |
| `future_ma99_1d` | `futureMa991d` |
| `win_rate` | `winRate` |
| `mean_correlation` | `meanCorrelation` |
| `query_ma99_1h` | `queryMa991h` |
| `query_ma99_1d` | `queryMa991d` |
| `query_ma99_gap_1h` | `queryMa99Gap1h` |
| `query_ma99_gap_1d` | `queryMa99Gap1d` |
| `consensus_forecast_1h` | `consensusForecast1h` |
| `consensus_forecast_1d` | `consensusForecast1d` |
| `ma99_trend_override` | `ma99TrendOverride` |

---

## Frontend Routing

Uses `react-router-dom` BrowserRouter; routes defined in `main.tsx`.

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `HomePage` | Hero + ProjectLogic + DevDiary preview (K-024 Phase 2: DevDiarySection consumes the flat `DiaryEntry[]` returned by `useDiary(3)`, top 3 sorted by date desc + array-index tie-break, sharing `timelinePrimitives.ts` rail/marker constants) |
| `/app` | `AppPage` | K-Line prediction tool (formerly App.tsx; TD-005 pending split). **K-030 isolation**: does not render UnifiedNavBar or Footer (post-K-035 unified to `components/shared/Footer.tsx`; pre-K-035 was `components/home/HomeFooterBar.tsx`); root div applies `bg-gray-950 text-gray-100` overriding body paper; treated as an isolated tool viewport (entered via the App link in the marketing-page NavBar opening a new tab) |
| `/about` | `AboutPage` | Portfolio-oriented recruiter page — 8 sections: PageHeader (One operator declaration) + MetricsStrip + WhereISteppedIn (Nº 02.5, A+C+B comparison) + RolePipeline (Nº 03, inline SVG diagram) + RoleCards (Nº 04, 6 roles × Owns/Artefact) + ReliabilityPillars (Nº 05, 3 pillars + anchor quotes) + TicketAnatomy (Nº 06, K-002/K-008/K-009, SSOT→content/ticket-cases.json) + ProjectArchitecture (Nº 07) + Footer (shared; email/GitHub/LinkedIn one-liner). `BuiltByAIBanner` lives on the `/` homepage; `/about` does not contain a banner showcase (K-031 removed the S7 BuiltByAIShowcaseSection). **K-058 (2026-04-28) adds 2 sections + RoleCard compact format α + processRules weight formula**. K-017 rewrite (2026-04-19); K-031 removed S7 showcase (2026-04-21). **K-034 Phase 2 (2026-04-23) full-page Pencil SSOT alignment**: the 5 card types (Metric/Role/Pillar/TicketAnatomy/Arch) all go through the `FileNoBar` primitive applying a dark charcoal FILE Nº/LAYER Nº header bar; `DossierHeader` retired (no corresponding Pencil frame); S2/S3/S5/S6 h2 deleted (SectionLabelRow is the sole heading; S4 h2 "How AI Stays Reliable" preserved per Pencil s4Intro, switched to Bodoni 30); 3 section subtitles switched to the Pencil em-dash literal; S1 hero switched to 2-line left-aligned + full-width divider; ROLE_ANNOTATIONS (POSITION/BEHAVIOUR) + redactArtefact retired; role font-size Bodoni 36/32 by length; 40px charcoal rule added to Role/Pillar/Ticket/Arch card body. **K-045 (2026-04-24 Engineer delivery) desktop layout consistency**: AboutPage.tsx rewritten as 6 `<section>` directly children of root `<div className="min-h-screen">` (per-section container classes, per ticket §4a pattern A enforced; K-031 `#architecture.nextElementSibling === <footer>` Sacred runtime check passes); each section inline `max-w-[1248px] mx-auto px-6 sm:px-24 w-full` + vertical rhythm `mt-6 sm:mt-[72px]` (S2–S6) / `pt-8 sm:pt-[72px]` (S1) / `mb-8 sm:mb-[96px]` (S6 before footer); aligned to Pencil frame 35VCj `Y80Iv padding:[72,96,96,96], gap:72`; hero BQ-045-05 Option A widened to 1248; SectionContainer.tsx primitive DELETED (git rm; sole consumer cleared); SectionLabelRow extracted into standalone file `components/about/SectionLabelRow.tsx`; PageHeaderSection drops `py-20`. **K-058 (2026-04-28 Engineer) expansion to 8 `<section>`**: adds `WhereISteppedInSection` (Nº 02.5, A+C+B three-column comparison table) + `RolePipelineSection` (Nº 03, inline SVG pipeline diagram); RoleCards promoted to Nº 04; Pillars→05; TicketAnatomy→06 (SSOT moved to `content/ticket-cases.json`); Architecture→07; `processRules` weight formula moved into `build-ticket-derived-ssot.mjs`; `CardShell padding='sm'` + `FileNoBar cardPaddingSize='sm'` added (RoleCard compact format α) |
| `/diary` | `DiaryPage` | K-024 Phase 3 v2 timeline: reads `public/diary.json` (flat `DiaryEntry[]`) → `<DiaryHero />` + `<DiaryTimeline />` (`<ol role="list">` flat renderer) + `<LoadMoreButton />`; Hero + rail + marker + 3-layer entry (title em-dash / date Geist Mono / body Newsreader italic); 5 entries initially, Load more adds +5 per click (`useDiaryPagination` client-side slicing + inFlight concurrency gate); content maxWidth 1248px; on mobile < 640px the rail/marker is hidden and fonts scale down; loading / error / empty-state each have a dedicated component + literal copy. **K-034 Phase 3 (2026-04-23) adopts shared Footer** (AC-034-P3-DIARY-FOOTER-RENDERS): `<Footer />` is the last sibling of root `<div className="min-h-screen">` (same pattern as /about / /business-logic); all 4 terminal states (loading / error / empty / timeline) render the Footer (AC-034-P3-DIARY-FOOTER-LOADING-VISIBLE Option A); K-017 AC-017-FOOTER /diary negative assertion + K-024 /diary no-footer Sacred + K-034 Phase 1 T4 AC-034-P1-NO-FOOTER-ROUTES /diary row — all three retired (BQ-034-P3-03); Pencil provenance reuses homepage-v2.pen `86psQ` + `1BGtd` (no new .pen frame needed, BQ-034-P3-01 ruling); Footer ancestor-padding seam at 640–768px is a Known Gap (TD-K034-P3-02) |
| `/business-logic` | `BusinessLogicPage` | Trading logic (password-protected, displayed after JWT validation) |
| `*` | `Navigate to /` | Unmatched paths redirect to home |

**NavBar:** `UnifiedNavBar` is mounted at the top of the 4 marketing pages (`/` / `/about` / `/diary` / `/business-logic`; K-005 unification → K-021 design system alignment → K-030 removed from `/app` → K-025 hex → token migration in planning). Left-side home icon links to `/`; right-side TEXT_LINKS: App / Diary / About (Prediction temporarily hidden, preserved as a commented-out constant); active state uses `aria-current="page"` + class `text-brick-dark` (#9C4A3B, post-K-025 landing; pre-K-025 was the arbitrary-value `text-[#9C4A3B]`); non-active `text-ink/60` (#1A1814 @ 60% opacity, post-K-025 landing; pre-K-025 was `text-[#1A1814]/60`). Background `bg-paper` (#F4EFE5). **Since K-030**, the `App` entry in TEXT_LINKS is marked `external: true` and renders a native `<a target="_blank" rel="noopener noreferrer">` instead of `<Link>`, so clicking it opens `/app` in a new tab.

**Sitewide scroll behavior：** `<ScrollToTop />` (`components/ScrollToTop.tsx`, K-053 2026-04-26) mounted inside `<BrowserRouter>` resets `window.scrollY` to 0 on every pathname change, with hash-link early-return to preserve browser anchor behavior. Mirrors `useGAPageview` pattern (sibling component, `useEffect` on `[pathname, hash]`). Sets `history.scrollRestoration = 'manual'` once on mount (BQ-K053-04 ruling) to suppress browser POP-restore single-frame flicker. Same-route NavBar re-click preserves scroll (dep array unchanged); query-only nav preserves scroll (`search` not in dep array); hash navigation preserves scroll (early-return on `hash` truthy).

---

## Design System (K-021)

**Design source:** `frontend/design/homepage-v2.pen` (4 top-level frames: Homepage 4CsvQ / About 35VCj / Diary wiDSi / Business Logic VSwW9)
**Design doc:** [K-021-sitewide-design-system.md](../docs/designs/K-021-sitewide-design-system.md)

### Tokens

**Tailwind `theme.extend.colors` (registered in K-021, replacing the current inline `[#XXXXXX]`):**

| Token | Value | Purpose |
|-------|-------|---------|
| `paper` | `#F4EFE5` | Sitewide body bg |
| `ink` | `#1A1814` | Primary text |
| `brick` | `#B43A2C` | Logo / brand primary |
| `brick-dark` | `#9C4A3B` | NavBar active link + CTA buttons |
| `charcoal` | `#2A2520` | Secondary text / accents |
| `muted` | `#6B5F4E` | Footer / meta / NavBar non-active |

**Tailwind `theme.extend.fontFamily`:**

| Token | Stack | Purpose |
|-------|-------|---------|
| `display` | `['"Bodoni Moda"', 'serif']` | H1 / hero / section title |
| `italic` | `['Newsreader', 'serif']` | italic emphasis / blockquote |
| `mono` | `['"Geist Mono"', 'monospace']` | Code / data / Footer meta |

**Font loading:** Google Fonts CDN via `index.html` preconnect + stylesheet link (existing; no change needed).

### Sitewide Body CSS Entry

`frontend/src/index.css` registers the body default via `@layer base`:

```
@layer base {
  body { @apply bg-paper text-ink font-display; }
}
```

All pages' outer `<div className="min-h-screen bg-[#0D0D0D] text-white">` wrappers (AboutPage / DiaryPage / AppPage / BusinessLogicPage) were removed in K-021; body bg is now inherited. HomePage was already `bg-[#F4EFE5]` and is now inherited from body directly.

**Exception (K-030):** `/app` overrides at the wrapper layer (`h-screen` root div applies `bg-gray-950 text-gray-100`); the body paper rule has no visible effect on `/app`. `/app` is not part of the sitewide paper design system (tool page, not marketing page); this exception is independently guarded by `frontend/e2e/app-bg-isolation.spec.ts`.

### Footer Placement Strategy

**Decision: per-page import (not a Layout slot).** Reason: AppPage `h-screen overflow-hidden` conflicts with the Layout slot model; per-page allows each page to independently decide whether to render the Footer and its placement (this ticket does not decide /diary; that is handled by K-024).

| Page | Footer |
|------|--------|
| `/` | `<Footer />` (**K-050 design 2026-04-25**: brand-asset SVG anchor triad + click-to-copy email `<button>` + sr-only aria-live status; supersedes the K-034 Phase 1 plain-text inline one-liner; Pencil SSOT frame 1BGtd flat-text serves as layout-placeholder; runtime divergence is endorsed by `design-exemptions.md §2 BRAND-ASSET`) |
| `/about` | `<Footer />` (**K-050 design 2026-04-25**: same shared DOM as above; K-017 AC-017-FOOTER partially restored (anchor href + testid; `Let's talk →` copy not restored); K-018 AC-018-CLICK fully restored; Pencil SSOT frame 86psQ flat-text serves as layout-placeholder) |
| `/diary` | `<Footer />` (**K-050 design 2026-04-25**: same shared DOM; continues K-034 Phase 3 placement as last sibling of root `<div className="min-h-screen">`; rendered in all 4 terminal states (loading / error / empty / timeline); 640–768px viewport padding seam Known Gap TD-K034-P3-02 untouched; Pencil SSOT frame ei7cl flat-text serves as layout-placeholder) |
| `/app` | No footer (K-030 isolation — `/app` is an isolated tool viewport; NavBar and Footer are removed so it does not inherit marketing site chrome; K-050 leaves this unchanged) |
| `/business-logic` | `<Footer />` (**K-050 design 2026-04-25**: same shared DOM; Pencil SSOT frame 2ASmw flat-text serves as layout-placeholder) |

### Shared Components Boundary

| Component | Location | Used in |
|-----------|----------|---------|
| `UnifiedNavBar` | `components/UnifiedNavBar.tsx` | `/` `/about` `/diary` `/business-logic` (since K-030, `/app` does not render it; the `App` entry in TEXT_LINKS is marked `external: true` and opens `/app` in a new tab when clicked from any of the 4 marketing pages). **Tracked by TD-K035-01** for a future move to `components/shared/NavBar.tsx` (blocked-by K-025 close) |
| `Footer` | `components/shared/Footer.tsx` | `/` / `/about` / `/business-logic` / `/diary` — **all 4 routes** render the same zero-prop `<Footer />`, with DOM byte-identical across the 4 routes (guarded by K-034 P1 T1 Sacred). **K-050 (2026-04-25) supersedes K-034 Phase 1 plain-text framing** — runtime DOM is 3 brand-asset SVG anchors (MailIcon / GithubIcon / LinkedinIcon, CC0/MIT mirror at `frontend/design/brand-assets/`, `?react` SVGR import) + click-to-copy email `<button>` (`navigator.clipboard.writeText` + range-selection fallback + 1500ms revert + sr-only `role="status" aria-live="polite"` status broadcast) + K-018 REGULATORY GA disclosure `<p>`. Pencil SSOT = frames `1BGtd` (/) + `86psQ` (/about) + `ei7cl` (/diary) + `2ASmw` (/business-logic) flat-text as layout-placeholder; runtime divergence endorsed by `design-exemptions.md §2 BRAND-ASSET` (each of the 4 frame JSONs carries `_design-divergence` (kebab) / `_designDivergence` (camel) fields). K-017 AC-017-FOOTER partially restored (anchor href + testid; `Let's talk →` copy not restored); K-018 AC-018-CLICK fully restored + 1 cross-route sanity; K-022 italic/underline not restored; K-034 P1 T1 byte-identity + K-045 T18/T19 width parity all preserved (single Footer DOM across 4 routes). /app K-030 isolation preserved — does not render per AC-030-NO-FOOTER Sacred (K-050 unchanged). |

### Legacy NavBar

`components/NavBar.tsx` (legacy) — to be deleted after K-021 acceptance if no consumer (Engineer grep to confirm).

---

## Deployment Architecture

```
Browser
  ├── Firebase Hosting  ← SPA static assets (frontend/dist/)
  │     rewrites: ** → /index.html    (BrowserRouter fallback)
  └── Google Cloud Run  ← Docker container
        Two-stage build: Node 20 builds frontend → Python 3.11 serves
        ENV: BUSINESS_LOGIC_PASSWORD, JWT_SECRET, PORT
```

**Hosting split rationale:** SPA static assets on Firebase Hosting (global CDN, zero cold-start); FastAPI backend on Cloud Run (containerized, scales to zero). SPA fallback `rewrites: ** → /index.html` routes unknown URLs to the BrowserRouter; `/api/*` calls hit Cloud Run directly via `VITE_API_BASE` build-time env var.

**Deploy gate:** see `CLAUDE.md § Deploy Checklist` — (1) all ticket branches rebased+merged into main, (2) relative-path API client grep, (3) `npm run build` from `frontend/`, (4) `firebase deploy --only hosting` from project root.

**Two-stage Dockerfile:** Node 20 build stage emits `frontend/dist/`; Python 3.11 runtime stage serves both static assets (via FastAPI SPA fallback route) and `/api/*` endpoints. See `Dockerfile` at project root.

---

## QA Artifacts

Visual report generation and Playwright project configuration: see `ssot/frontend-checklist.md §QA Visual Report`. The visual-report spec runs in a separate Playwright `visual-report` project (configured in `playwright.config.ts`).

---

## GA4 E2E Test Matrix

E2E test matrix and GA4 intercept contract: see `ssot/conventions.md §GA4 E2E Test Matrix`.

---

## Scripts & Public Protocols Doc (since K-017)

### `scripts/audit-ticket.sh`

**Positioning:** portfolio demo script that demonstrates the verifiability of the 6-role + doc-trail mechanism; **not a CI gate** (not wired into pre-commit / GitHub Actions).

**Usage:** `./scripts/audit-ticket.sh K-XXX` (run from project root; script includes a `cd` safeguard)

**Check groups:** A. Ticket file frontmatter / B. AC + PRD mapping / C. Architecture design / D. Commit trail / E. Code Review retro / F. 5-role retros + per-role log (K-008+ only) / G. Playwright spec + visual report HTML (K-008+ only)

**Date-based skip:** tickets `created < 2026-04-18` SKIP F/G outright (before per-role retro mechanism was enabled)

**Exit codes:** 0 = all pass / 1 = warning / 2 = critical missing

**Implementation constraints:** bash only (no node / python / jq dependency); ANSI escape coloring (TTY detect); shebang `#!/usr/bin/env bash`

### `docs/ai-collab-protocols.md`

**Positioning:** public-facing protocol document, recruiter-readable; entered from the three pillar inline links in `/about` Section 4 "How AI Stays Reliable".

**Structure:** three main sections — `Role Flow` / `Bug Found Protocol` / `Per-role Retrospective Log` — each with a stable anchor (`{#role-flow}` / `{#bug-found-protocol}` / `{#per-role-retrospective-log}`) so the `/about` pillars can deep-link. Includes 2–3 curated retrospective excerpts.

**Deployment:** copy / symlink to `frontend/public/docs/ai-collab-protocols.md` to avoid Firebase SPA fallback swallowing the `.md` path.

---

## Auth Flow（Business Logic）

Token state machine on `BusinessLogicPage` mount:

```
mount → read localStorage('bl_token')
  ├─ no token
  │   └─ → SHOW_PASSWORD_FORM
  ├─ token present, exp ≤ now (expired)
  │   └─ clear localStorage → SHOW_PASSWORD_FORM + expired notice
  └─ token present, exp > now (valid)
      └─ → LOADING_CONTENT → GET /api/business-logic
            ├─ 200 → SHOW_CONTENT (render Markdown)
            └─ 401 → clear localStorage → SHOW_ERROR

SHOW_PASSWORD_FORM → user enters password → POST /api/auth
  ├─ 200 → save token to localStorage → LOADING_CONTENT (continues above flow)
  └─ 401 → SHOW_ERROR (incorrect password notice)
```

**Environment variables:**
- `BUSINESS_LOGIC_PASSWORD` — authentication password
- `JWT_SECRET` — JWT signing secret

**Token spec:**
- Algorithm: HS256
- Validity: 24 hours (`exp = iat + 86400`)
- Subject: `"business-logic-access"`

---

## Changelog

**2026-05-05 — K-096 — /about pipeline section: QA Early Consultation annotation added to `pipeline.svg`; new `pm-arbitration-detail.svg` (3-lane CAG/Reviewer/QA-Interception flows); `RolePipelineSection.tsx` gains "PM Arbitration Detail" h3 + second SVG.**
Design doc: [docs/designs/K-096-pm-arbitration-detail-diagram.md](../docs/designs/K-096-pm-arbitration-detail-diagram.md)

**2026-05-04 — K-092 — Add local 1H MA slope direction gate in `find_top_matches`: pre-loop query direction via `_query_ma_series` + `_trend_direction`; per-candidate gate rejects opposite-direction segments; flat (0) compatible with both.**
Design doc: [docs/architecture/K-092-local-ma-slope-filter.md](../docs/architecture/K-092-local-ma-slope-filter.md)

**2026-05-03 — K-084 — Intraday 6H window random sampling: `find_top_matches` gains `hour_start: Optional[int]`; new `_get_bar_hour()` helper; `build_6h_query_window()` in daily_predict.py; `evaluate_corpus` samples per-pair; `hour_start` added to `FIRESTORE_PREDICTION_FIELDS`.**
Design doc: [docs/designs/K-084-design.md](../docs/designs/K-084-design.md)

**2026-05-02 — K-083 — Weekly Bayesian optimizer design: new `scripts/weekly_optimize.py` + `backend/optimizer.py` + `.github/workflows/weekly-optimize.yml`; added `FIRESTORE_OPTIMIZE_RUN_FIELDS` + `FIRESTORE_PREDICTOR_PARAMS_HISTORY_FIELDS` frozensets; weekly optimizer workflow added to system-overview.md.**
Design doc: [docs/designs/K-083-design.md](../docs/designs/K-083-design.md)

**2026-05-02 — K-078 — Firestore plumbing: new `backend/firestore_config.py` (ParamSnapshot dataclass + load_active_params loader), predictor.params module attr, /api/health endpoint, firestore.rules, requirements.txt google-cloud-firestore pin.**
Design doc: [docs/designs/K-078-design.md](../docs/designs/K-078-design.md)

**2026-05-02 — K-075 — Architect RFC: AppPage.tsx 3-hook decomposition (useOfficialInput / useHistoryUpload / usePredictionWorkspace) + TD-004 PredictorChart stale chart fix via key-based remount.**
Design doc: [docs/designs/K-075-apppage-decomp.md](../docs/designs/K-075-apppage-decomp.md)

**2026-04-30 — K-048 — Architecture design: daily Binance scraper + `freshness_hours` field on `/api/history-info` + History Reference stale indicator.**
Design doc: [docs/designs/K-048-scraper-design.md](../docs/designs/K-048-scraper-design.md)

**2026-04-29 — K-062 — Add FOLDER-STRUCTURE marker block to README; generator emits tree from content/site-content.json.**
Design doc: [docs/designs/K-062-readme-folder-structure.md](../docs/designs/K-062-readme-folder-structure.md)

- **2026-04-26** (Engineer, K-053) — `ScrollToTop` component added; sitewide scroll-reset on route change with hash-link early-return; 3 E2E tests pass. Design doc: [K-053-scroll-to-top.md](../docs/designs/K-053-scroll-to-top.md).

- **2026-04-26** (Architect, K-051 Phase 4) — Predictor MA floor raised from 99 to 129 bars; `data-testid="error-toast"` added to AppPage; UI i18n sweep (CJK → ASCII punctuation in 6 files). Design doc: [K-051-phase4.md](../docs/designs/K-051-phase4.md).

- **2026-04-26** (Architect, K-051 Phase 3b/3c) — Permanent regression coverage: 3 new backend test files + real-CSV E2E spec (`upload-real-1h-csv.spec.ts`) + `frontend/e2e/fixtures/` added. Design doc: [K-051-phase-3-design.md](../docs/designs/K-051-phase-3-design.md).

- **2026-04-24** (Architect, K-046 Phase 2) — `/app` UI restructure: download link moved to OFFICIAL INPUT; Upload History CSV input removed; CORS env fix on Cloud Run. Design doc: [K-046-phase2-ui-restructure.md](../docs/designs/K-046-phase2-ui-restructure.md).

- **2026-04-24** (Architect, K-046 Phase 1) — `/api/upload-history` write-path commented out (pending K-048); example CSV download link added to `/app`. Design doc: [K-046-comment-out-upload-write.md](../docs/designs/K-046-comment-out-upload-write.md).

- **2026-04-24** (Engineer, K-045) — `/about` desktop layout consistency: `SectionContainer.tsx` retired; `AboutPage.tsx` rewritten to 6 per-section root-child containers; `SectionLabelRow.tsx` extracted. Design doc: [K-045-design.md](../docs/designs/K-045-design.md).

- **2026-04-24** (Architect, K-045 design) — Design for `/about` desktop layout: `SectionContainer` retire, 6 per-section root-child containers, `SectionLabelRow` extraction, hero width 768→1248. Design doc: [K-045-design.md](../docs/designs/K-045-design.md).
- **2026-04-24** (Architect, K-044) — Added `## Deployment Architecture` section; `## Data Flow` 5-step prose intro added; README trimmed.

- **2026-04-23** (Architect, K-040 Item 1) — Sitewide typography reset: body default switched to Geist Mono; `font-display`/`font-italic` Tailwind keys retired; 18 TSX sites updated. Design doc: [K-040-sitewide-typography-reset.md](../docs/designs/K-040-sitewide-typography-reset.md).

- **2026-04-23** (Architect, K-034 Phase 3) — `/diary` adopted shared Footer; 3 Sacred clauses retired; Footer now rendered across all 4 routes. Design doc: [K-034-phase3-diary-footer-adoption.md](../docs/designs/K-034-phase3-diary-footer-adoption.md).

- **2026-04-23** (Architect, K-034 Phase 2) — `/about` full Pencil audit: `FileNoBar` primitive added; `DossierHeader` retired; 4 section h2s removed; 12 components rewritten. Design doc: [K-034-phase-2-about-audit.md](../docs/designs/K-034-phase-2-about-audit.md).
- **2026-04-23** (Architect, K-034 Phase 1) — Footer `variant` prop retired; `Footer.tsx` unified to single zero-prop return; cross-route byte-identical outerHTML established. Design doc: [K-034-phase1-footer-inline-unification.md](../docs/designs/K-034-phase1-footer-inline-unification.md).
- **2026-04-22** (Engineer, K-035) — `components/shared/Footer.tsx` created; `HomeFooterBar.tsx` + `FooterCtaSection.tsx` deleted; `shared-components.spec.ts` added. Design doc: [K-035-shared-component-migration.md](../docs/designs/K-035-shared-component-migration.md).
- **2026-04-22** (Architect, K-035 design) — `/about` Footer shared-component migration design: `components/shared/` directory created; `Footer.tsx` unified variant prop. Design doc: [K-035-shared-component-migration.md](../docs/designs/K-035-shared-component-migration.md).
- **2026-04-22** (PM, K-024 close) — K-024 `/diary` flat-timeline closed after Phase 3 QA sign-off; merged + deployed to Firebase Hosting.
- **2026-04-22** (Engineer, K-025) — `UnifiedNavBar` 7 hex values migrated to K-021 design tokens; `navbar.spec.ts` updated to computed-color assertions. Design doc: [K-025-design.md](../docs/designs/K-025-design.md).
- **2026-04-22** (Architect, K-025 design) — `UnifiedNavBar` hex → token migration design; class-name regex assertions replaced by `toHaveCSS`. Design doc: [K-025-design.md](../docs/designs/K-025-design.md).
- **2026-04-22** (Architect, K-029 design) — `/about` card body text palette aligned to paper tokens; 21 new computed-color E2E assertions. Design doc: [K-029-about-card-body-text-palette.md](../docs/designs/K-029-about-card-body-text-palette.md).
- **2026-04-22** (Architect, K-020 design) — GA4 SPA pageview E2E hardening: `ga-spa-pageview.spec.ts` added; `§GA4 E2E Test Matrix` section added. Design doc: [K-020-ga-spa-pageview-e2e.md](../docs/designs/K-020-ga-spa-pageview-e2e.md).
- **2026-04-22** (Architect, K-024 design) — `/diary` structure rework: `DiaryEntry` → flat `DiaryEntry[]` schema; 8 new `diary/` components + `timelinePrimitives.ts`; 5 Vitest specs + 29+4 Playwright cases. Design doc: [K-024-diary-structure.md](../docs/designs/K-024-diary-structure.md).
- **2026-04-21** (PM, K-013 close) — K-013 Stats SSOT (TD-008 Option C) closed after R2 bug-found remediation; merged + deployed.
- **2026-04-21** (Architect, K-013/K-030/K-031/K-028/K-023 designs) — Stats SSOT frontend util + contract fixture; `/app` isolation; `/about` S7 showcase removed; homepage visual fix; directory drift fixes. Design docs in `docs/designs/`.
- **2026-04-22** (PM, K-022 review) — K-022 `/about` v2: `DossierHeader` + `RedactionBar` added; `CardShell` dark→paper palette; `SectionLabelRow` added; 5 section labels.
- **2026-04-21** (Architect, K-027 design) — `diary/` directory structure drift corrected; mobile overlay hotfix in `DiaryEntry.tsx` + `MilestoneSection.tsx`.
- **2026-04-20** (Architect, K-021 design) — Sitewide design system: 6 color tokens + 3 font tokens + body `@layer base`; Footer per-page strategy; shared components boundary table. Design doc: [K-021-sitewide-design-system.md](../docs/designs/K-021-sitewide-design-system.md).
- **2026-04-19** (Architect, K-018/K-017 designs) — GA4 tracking design (`analytics.ts` + `useGAPageview`); `/about` rewritten as portfolio page with `audit-ticket.sh` + `ai-collab-protocols.md`.
- **2026-04-18** (Architect, K-008 design) — `## QA Artifacts` section added; `chromium`/`visual-report` Playwright project split design.
- **2026-04-15** (initial) — Phase 1/2 complete: JWT auth + BrowserRouter + 4 pages + business-logic password gate.
