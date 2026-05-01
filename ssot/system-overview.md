---
title: K-Line Prediction — System Architecture
type: reference
tags: [K-Line-Prediction, Architecture, API]
updated: 2026-04-30 (K-048)
---

## Summary

ETH/USDT K-line candlestick pattern similarity prediction system. User uploads recent OHLC; backend finds the most similar historical segments, computes MA99, and returns projection statistics.

- **Frontend:** 5 SPA routes (`/` `/app` `/about` `/diary` `/business-logic`) + Unified NavBar. `/about` is a portfolio-oriented recruiter page with 8 sections (K-058, 2026-04-28). `/diary` is a v2 timeline with infinite-scroll pagination (K-024/K-059).
- **Backend:** FastAPI single-file `main.py`; 2 in-memory history stores (`_history_1h` / `_history_1d`); auto-scraper via K-048 Cloud Run cron keeps history current.
- **Stats SSOT (TD-008 Option C, K-013 closed 2026-04-21):** frontend computes subset stats (`statsComputation.ts`); backend computes full-set baseline; drift locked by `backend/tests/fixtures/stats_contract_cases.json`.
- **Content SSOT (K-052/K-062):** `content/site-content.json` is the hand-edit source for stack[], processRules[], renderSlots; generator (`scripts/build-ticket-derived-ssot.mjs`) auto-fills metrics and emits `docs/sacred-registry.md` + README marker blocks.
- **Known modularity debt:** `AppPage.tsx` (TD-005) / `main.py` (TD-006) / `predictor.py` (TD-007) pending Architect RFC; see Known Architecture Debt table.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | TypeScript + React + Recharts + lightweight-charts + Vite + react-router-dom |
| Backend | Python + FastAPI + PyJWT |
| Tests (FE) | Vitest + Playwright |
| Tests (BE) | pytest |

---

## Directory Structure

```
ClaudeCodeProject/
├── agent-context/
│   ├── architecture.md          ← monorepo 層級 overview
│   └── conventions.md           ← 通用規範
├── PM-dashboard.md              ← 跨專案 ticket 進度表
├── CLAUDE.md                    ← Claude Code 專案指令
├── AGENTS.md                    ← Codex 專案指令
├── K-Line-Prediction/
│   ├── agent-context/
│   │   ├── architecture.md      ← 本檔
│   │   └── conventions.md       ← K-Line 專屬規範（命名、pre-commit、history DB）
│   ├── docs/
│   │   ├── tickets/             ← K-001 ~ K-017 ticket
│   │   ├── tech-debt.md         ← TD-001 ~ TD-008 登記簿
│   │   ├── designs/             ← RFC + ticket design（TD-008 / K-017 等）
│   │   ├── reviews/             ← Codex / senior-engineer review 紀錄
│   │   ├── retrospectives/      ← per-role 跨 ticket 累積反省（K-008 起）
│   │   ├── reports/             ← Playwright visual-report 產出
│   │   └── ai-collab-protocols.md ← K-017 公開版協議文件（英文，對外 recruiter 可見）
│   ├── scripts/                 ← K-017; portfolio demo scripts
│   │   ├── audit-ticket.sh      ← A–G check group audit (portfolio demo, not CI gate)
│   │   └── build-ticket-derived-ssot.mjs ← K-052/K-062; reads ticket corpus + README markers; emits site-content.json metrics/ticketRange, sacred-registry.md, README STACK + NAMED-ARTEFACTS blocks
│   ├── content/                 ← K-052 ticket-derived SSOT (hand-edit source); generator reads + preserves hand-edited fields
│   │   ├── site-content.json    ← stack[], processRules[], renderSlots (hand-edit); metrics.*, lastUpdated, ticketRange (generator-filled)
│   │   ├── ticket-cases.json    ← K-058 SSOT for TicketAnatomySection (K-002/K-008/K-009 trio)
│   │   └── roles.json           ← K-058 SSOT for RoleCards (6 roles × Owns/Artefact)
│   ├── backend/
│   │   ├── main.py              ← FastAPI app + 所有 /api route + SPA fallback（最後一個 route）
│   │   ├── models.py            ← Pydantic request/response models
│   │   ├── predictor.py         ← 相似度搜尋 + MA99 + trend classify + stats 計算
│   │   ├── time_utils.py        ← 時間 normalize（統一 UTC+0 `YYYY-MM-DD HH:MM`）
│   │   ├── mock_data.py         ← 測試用假資料 + CSV loader
│   │   ├── auth.py              ← APIRouter: POST /api/auth + GET /api/business-logic + require_jwt
│   │   ├── business_logic.md    ← JWT 保護的交易邏輯內容
│   │   └── tests/
│   │       ├── conftest.py
│   │       ├── test_auth.py     ← AC-AUTH-1/2/4 + AC-TEST-AUTH-3/5
│   │       ├── test_main.py     ← main.py route integration（K-001 補齊 coverage）
│   │       ├── test_predictor.py ← predictor 純函式測試（49 tests，含 K-013 contract parametrize 3 cases + fixture coverage + realism rule）
│   │       └── fixtures/                              ← K-013 跨層 contract fixture 目錄
│   │           ├── __init__.py                        ← 空檔；讓 fixtures 成為 importable package
│   │           ├── stats_contract_cases.json         ← 3 cases（all_matches_full_set / subset_deselect_one / single_match_two_bars）；snake_case expected；前後端共吃
│   │           └── generate_stats_contract_cases.py  ← deterministic generator；呼叫現有 `compute_stats` 產 ground truth；後端改算法時一鍵重跑
│   ├── frontend/
│   │   ├── public/
│   │   │   ├── diary.json       ← flat DiaryEntry[] static data ({ ticketId?, title, date, text }, all English, zod .strict() validated at fetch time)
│   │   │   └── docs/
│   │   │       └── ai-collab-protocols.md  ← K-017 起；copy from docs/，讓 SPA Hosting 可直接訪問 `/docs/ai-collab-protocols.md`（避免 SPA fallback 吞 .md）
│   │   ├── e2e/
│   │   │   ├── business-logic.spec.ts
│   │   │   ├── pages.spec.ts
│   │   │   ├── ma99-chart.spec.ts
│   │   │   ├── navbar.spec.ts
│   │   │   ├── diary-page.spec.ts          ← K-024 Phase 3; 29 test cases (DIARY-PAGE-CURATION×9 + TIMELINE×6 + ENTRY-LAYOUT×6 + PAGE-HERO×3 + CONTENT-WIDTH×5)
│   │   │   ├── diary-homepage.spec.ts      ← K-024 Phase 3; 4 test cases (HOMEPAGE-CURATION 0/1/2/3-entry + tie-break)
│   │   │   ├── visual-report.ts          ← K-008 視覺報告 script（env var TICKET_ID → docs/reports/K-XXX-visual-report.html）
│   │   │   ├── K-013-consensus-stats-ssot.spec.ts ← K-013 cross-layer contract fixture E2E guard
│   │   │   ├── K-046-example-upload.spec.ts    ← K-046; example CSV download link + upload-hidden E2E
│   │   │   ├── about-layout.spec.ts            ← K-045; 15 tests: container width / section gap / hero / section-label-x / sm-boundary / K031-adjacency
│   │   │   ├── about-v2.spec.ts                ← K-022 / K-034 /about structural spec (palette + FileNoBar + section labels)
│   │   │   ├── about.spec.ts                   ← legacy /about spec (pre-K-022)
│   │   │   ├── app-bg-isolation.spec.ts        ← K-030; /app bg-gray-950 isolation + no-NavBar + no-Footer guards
│   │   │   ├── favicon-assets.spec.ts          ← K-037; 8 asset paths + link-tag hrefs + manifest schema
│   │   │   ├── ga-consent.spec.ts              ← GA consent flow E2E
│   │   │   ├── ga-spa-pageview.spec.ts         ← K-020; 9 tests: SPA-NAV × 2 + BEACON × 4 + NEG × 3
│   │   │   ├── ga-tracking.spec.ts             ← K-018; dataLayer spy: pageview / click / privacy / install
│   │   │   ├── roles-doc-sync.spec.ts          ← K-039; roles SSOT parity guard
│   │   │   ├── scroll-to-top.spec.ts           ← K-053; 3 tests: route-change reset / hash early-return / same-route preserve
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
│   │       ├── main.tsx         ← BrowserRouter + Routes 入口
│   │       ├── AppPage.tsx      ← K-Line 預測主頁（TD-005：責任過多，待拆分）
│   │       ├── types.ts         ← MatchCase / PredictStats / ProjectionBar 等
│   │       ├── types/
│   │       │   └── diary.ts     ← `DiaryEntry { ticketId?, title, date, text }` + zod `.strict()` schema export (replaces DiaryItem / DiaryMilestone)
│   │       ├── hooks/
│   │       │   ├── useAsyncState.ts
│   │       │   ├── usePrediction.ts    ← predict + computeMa99 呼叫封裝
│   │       │   ├── useDiary.ts         ← K-024; fetches /diary.json + AsyncState; returns sorted `DiaryEntry[]` (date desc + array-index tie-break); see Changelog K-024
│   │       │   └── useDiaryPagination.ts ← client-side slicing pagination (5-per-click) + inFlight concurrency gate (`queueMicrotask` flush + `hasMore` / `loadMore` / `visibleCount` return shape), DiaryPage only
│   │       ├── utils/
│   │       │   ├── aggregation.ts      ← 1H → 1D bar 聚合、time formatter
│   │       │   ├── analytics.ts        ← K-018；GA4 initGA / trackPageview / trackCtaClick
│   │       │   ├── api.ts              ← API_BASE env
│   │       │   ├── auth.ts             ← localStorage bl_token helper
│   │       │   ├── diarySort.ts        ← pure `sortDiary(entries)`: date desc + array-index tie-break (later index = newer within same date); called by useDiary
│   │       │   ├── statsComputation.ts ← K-013；`computeStatsFromMatches` 純 util（subset stats，與 backend `compute_stats` 由 `backend/tests/fixtures/stats_contract_cases.json` 鎖 bit-exact <=1e-6）；另 export `snakeSuggestionToCamel` / `snakeStatsToCamel` / `aggregateProjectedBarsTo1D`
│   │       │   └── time.ts             ← toUTC8Display（render-only）
│   │       ├── pages/
│   │       │   ├── HomePage.tsx
│   │       │   ├── AboutPage.tsx
│   │       │   ├── DiaryPage.tsx
│   │       │   └── BusinessLogicPage.tsx
│   │       ├── __tests__/
│   │       │   ├── AppPage.test.tsx         ← Vitest（K-010 修復中）
│   │       │   ├── MatchList.test.tsx
│   │       │   ├── OHLCEditor.test.tsx
│   │       │   ├── PredictButton.test.tsx
│   │       │   ├── StatsPanel.test.tsx
│   │       │   ├── aggregation.test.ts
│   │       │   ├── statsComputation.test.ts ← K-013；relative path import `../../../backend/tests/fixtures/stats_contract_cases.json`，對 3 case 跑 `computeStatsFromMatches` 並 assert bit-exact (`toBeCloseTo(value, 6)`) + error contract + key mapping（共 9 tests）
│   │       │   ├── diary.schema.test.ts     ← zod `.strict()` schema validation (valid / extra-key reject / missing-required reject / ticketId optional)
│   │       │   ├── diary.english.test.ts    ← CJK regex sweep (no `/[一-鿿]/` in text+title per entry), AC-024-ENGLISH
│   │       │   ├── diary.legacy-merge.test.ts ← verifies legacy entries (pre-K-001) merged into single "Early project phases and deployment setup" (date=2026-04-16), AC-024-LEGACY-MERGE
│   │       │   ├── diarySort.test.ts        ← date desc + array-index tie-break pure function tests
│   │       │   └── useDiaryPagination.test.ts ← visibleCount / hasMore / loadMore / concurrent double-click idempotent assertions
│   │       └── components/
│   │           ├── ErrorBoundary.tsx
│   │           ├── ScrollToTop.tsx          ← K-053; sitewide scroll-reset on route change; `useEffect` on `[pathname, hash]`, hash-link early-return, returns null
│   │           ├── MainChart.tsx            ← 主圖（歷史 + 預測 + MA99 疊加）
│   │           ├── MatchList.tsx            ← 相似案例列表 + 展開 PredictorChart（TD-004）
│   │           ├── OHLCEditor.tsx           ← OHLC 輸入表格
│   │           ├── StatsPanel.tsx           ← 統計面板
│   │           ├── PredictButton.tsx
│   │           ├── TopBar.tsx               ← /app 上方 bar（K-030 起 /app 不渲染 UnifiedNavBar，TopBar 為 /app 實際頂端 bar）
│   │           ├── UnifiedNavBar.tsx        ← K-005 統一 NavBar（所有頁面）
│   │           ├── NavBar.tsx               ← legacy，保留相容
│   │           ├── home/
│   │           │   ├── HeroSection.tsx
│   │           │   ├── ProjectLogicSection.tsx
│   │           │   ├── DevDiarySection.tsx      ← Home page Diary preview; consumes `useDiary(3)` flat `DiaryEntry[]`; flex-col flow layout + shared `timelinePrimitives.ts` rail/marker constants (K-024/K-028)
│   │           │   └── BuiltByAIBanner.tsx      ← K-017 新增；Homepage 最上方 thin banner → /about（DiaryPreviewEntry.tsx 刪除，被 P4 取代）
│   │           ├── about/                        ← /about portfolio page components; K-017 initial, K-022/K-034/K-045/K-058 progressively refactored; see Changelog
│   │           │   ├── FileNoBar.tsx                     ← K-034; dark charcoal header bar (FILE/LAYER/CASE variant); props { fileNo, rightSlot?, variant?, cardPaddingSize? }; 5 card consumers
│   │           │   ├── RedactionBar.tsx                  ← K-022; black redaction bar (`data-redaction` testid); used only in MetricCard m2
│   │           │   ├── PageHeaderSection.tsx             ← S1 "One operator" declaration; 2-line left-aligned hero + full-width divider (K-034/K-045)
│   │           │   ├── SectionLabelRow.tsx               ← K-045; extracted from AboutPage.tsx; props `{ label: string }`; renders `data-testid="section-label"` + 1px hairline
│   │           │   ├── MetricsStripSection.tsx           ← S2 4 narrative metrics container; SectionLabelRow only heading (K-034)
│   │           │   ├── MetricCard.tsx                    ← K-034; FileNoBar + Bodoni number + italic title + Newsreader subtext/note; m2 shows redaction bar
│   │           │   ├── WhereISteppedInSection.tsx        ← K-058; Nº 02.5 A+C+B comparison table (AI Did / I Decided / Outcome); testids: where-i-narrative/table/outcome
│   │           │   ├── RolePipelineSection.tsx           ← K-058; Nº 03 inline SVG pipeline diagram; viewBox 0 0 900 200; data-testid="role-pipeline-svg"
│   │           │   ├── RoleCardsSection.tsx              ← Nº 04 6-role container; K-034 removed h2; K-058 updated intro to compact format
│   │           │   ├── RoleCard.tsx                      ← K-034; interface `{ role, owns, artefact, fileNo }`; Bodoni font-size 36/32 by length; K-058 compact format α (padding sm)
│   │           │   ├── ReliabilityPillarsSection.tsx     ← S4 3 pillars + anchor quotes; h2 "How AI Stays Reliable" Bodoni 30 italic (K-034)
│   │           │   ├── PillarCard.tsx                    ← K-034; Bodoni 26 italic title + Newsreader body + 40px rule + brick-left-border quote
│   │           │   ├── TicketAnatomySection.tsx          ← Nº 06 K-002/K-008/K-009 trio; K-058 inline TICKETS moved to `content/ticket-cases.json` SSOT
│   │           │   ├── TicketAnatomyCard.tsx             ← K-034; FileNoBar (CASE FILE) + Bodoni 26 title + OUTCOME/LEARNING labels + ExternalLink
│   │           │   ├── ProjectArchitectureSection.tsx    ← S6 Monorepo / Docs-driven / Testing pyramid; K-034 ARCH_PILLARS uses structured `fields` array
│   │           │   └── ArchPillarBlock.tsx               ← K-034; interface `{ layerNo, category, title, fields }`; LAYER Nº FileNoBar + Bodoni 24 title + field pattern
│   │           │   （`DossierHeader.tsx` RETIRED K-034; `FooterCtaSection.tsx` deleted K-035）
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
│   │           ├── primitives/                            ← K-017 Pass 2 新目錄；cross-page primitive 抽出（/about 專用；diary/ 重構未落地）
│   │           │   ├── CardShell.tsx                      ← P2；MetricCard / RoleCard / PillarCard / TicketAnatomyCard / ArchPillarBlock 共用（K-022：dark class 遷 paper palette；PillarCard consumer 加 overflow-hidden）
│   │           │   └── ExternalLink.tsx                   ← P3；target=_blank + rel=noopener noreferrer 寫死
│   │           │   （SectionContainer.tsx P1 — **K-045 2026-04-24 RETIRED (git rm)**；單一 consumer 清空；AboutPage.tsx 改寫為 per-section root-child 容器替代，primitive 抽象不再需要）
│   │           │   （MilestoneAccordion.tsx / DiaryEntryRow.tsx / VerticalRail.tsx / TimelineMarker.tsx — K-017 Pass 2 P4/P5/P6/P7 未落地，磁碟不存在；K-024 結構重做時重新設計）
│   │           ├── shared/                                 ← K-035 新目錄（2026-04-22 落地）；sitewide page-level chrome canonical registry（Footer / 未來 NavBar 搬入 per TD-K035-01）
│   │           │   └── Footer.tsx                          ← K-034/K-050; zero-prop shared Footer; 3 brand-asset SVG anchors + click-to-copy email; rendered across 4 routes, byte-identical DOM (Sacred)
│   │           ├── business-logic/
│   │           │   ├── PasswordForm.tsx
│   │           │   ├── BusinessLogicContent.tsx
│   │           │   └── ErrorBanner.tsx
│   │           └── common/
│   │               ├── LoadingSpinner.tsx   ← 接受 `label?: string` prop，各呼叫處傳入情境文案；無 label 時只顯示 spinner 不顯示文字（K-011 完成 2026-04-18）
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

實際 route 在 `backend/main.py`（外加 `auth.py` router）。全部以 `/api/*` prefix。

### `POST /api/predict`

主預測端點。

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

**注意事項（K-009 修復中）：** `find_top_matches()` 目前在 1H 路徑下未傳 `ma_history=_history_1d`，導致 fallback 為 `history=_history_1h`，MA99 filter 與 ranking 資料源錯誤。AC-009-FIX 鎖定此行為。

---

### `POST /api/merge-and-compute-ma99`

僅計算 MA99（前端早期載入 MA99 用，UX：Predict 按鈕先 disabled，MA99 算好後 enable）。

**Request** (`Ma99Request`): `{ ohlc_data, timeframe }`
**Response** (`Ma99Response`): `{ query_ma99_1h, query_ma99_1d, query_ma99_gap_1h, query_ma99_gap_1d }`

**In-memory only**：不寫入 history database。

---

### `POST /api/upload-history`

上傳 CSV 歷史資料，解析後回傳 observable DB state。**Write path commented-out 2026-04-24（K-046）pending K-048 auto-scraper** — parse + response payload 仍正常，但不觸寫 `history_database/` 也不更新 `_history_1h` / `_history_1d` module state；response 中 `bar_count` 與 `latest` 反映 existing authoritative state（`len(existing)` / `existing[-1]['date']`），`added_count` 永遠 `0`。支援三種 CSV 格式不變：CryptoDataDownload、標準 header、Binance raw API。

**Timeframe 偵測：** 檔名含 `_d` / `_1d` → 1D，否則 1H。
**Response：** `{ filename, latest, bar_count, added_count, timeframe }` — schema 不變；post-K-046 `added_count` 恆為 0。

**已知風險（TD-003）：** 用 module globals（`_history_1h` / `_history_1d`）做 read-merge-write-swap，無同步機制，併發上傳可能遺失 bars。**Post-K-046 write path 註解後 race surface 移除**，直到 K-048 重啟 write path 再回到此風險面；revisit 於 K-048 Architect design phase。

---

### `GET /api/history-info`

回傳 1H / 1D 歷史資料的最新日期、筆數、filename。

### `GET /api/example?n=5&timeframe=1H`

從歷史資料庫讀取前 N 筆作為範例輸入。

### `GET /api/official-input`

從 env var `OFFICIAL_INPUT_CSV_PATH` 指定的路徑載入官方輸入 CSV。

### `POST /api/auth`

密碼驗證，回傳 JWT token（`auth.py` router）。

- Payload: `{ password }` → Response: `{ token }` 或 401
- 密碼來源：env var `BUSINESS_LOGIC_PASSWORD`，用 `hmac.compare_digest` 防 timing attack
- JWT secret：env var `JWT_SECRET`
- Payload: `{ sub: "business-logic-access", iat, exp: iat + 86400 }`
- `jwt.decode` 必須 pin `algorithms=["HS256"]`

### `GET /api/business-logic`

密碼保護內容（`auth.py` router，同一個 APIRouter）。

- Header: `Authorization: Bearer <token>`，用 `HTTPBearer` + `Depends(require_jwt)` 驗證
- 內容從 `Path(__file__).parent / "business_logic.md"` 讀取（避免 Railway/CR 工作目錄不一致）
- 200 → `{ content }`；401 token 無效；404 檔案不存在

### SPA Fallback

`GET /{full_path:path}` → `FileResponse("dist/index.html")`。**必須是 main.py 最後一個 route**，在所有 `include_router()` 之後，讓前端 BrowserRouter 的路由由客戶端接管。

---

## Key Data Models

**後端 Pydantic Models (`backend/models.py`)**
```python
OHLCBar:       open, high, low, close: float; time: str (ISO UTC)
MatchCase:     id, correlation, historical_ohlc, future_ohlc,
               historical_ohlc_1d, future_ohlc_1d,
               start_date, end_date,
               historical_ma99, future_ma99,
               historical_ma99_1d, future_ma99_1d
PredictStats:  highest/second_highest/second_lowest/lowest: OrderSuggestion,
               win_rate, mean_correlation,
               consensus_forecast_1h, consensus_forecast_1d  # 全集 baseline（TD-008 Option C 語意）
Ma99Gap:       from_date, to_date
AuthRequest:   password: str
AuthResponse:  token: str
```

**前端 TypeScript Types (`frontend/src/types.ts` + `types/diary.ts`)**
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
使用者輸入 OHLC（編輯表格 / CSV upload / JSON import / example）
  → OHLCEditor (前端)
  → POST /api/merge-and-compute-ma99 (預先算 MA99，Predict 按鈕 disable)
  → POST /api/predict (按下 Predict)
    → find_top_matches(history, ma_history, history_1d, timeframe) [predictor.py]
        ├─ _candle_feature_vector() 產 candle shape 特徵
        ├─ _normalized_similarity() 算 similarity score
        ├─ _fetch_30d_ma_series() 從 ma_history（應為 1D）取 30 天 MA series
        ├─ _classify_trend_by_pearson() 判 MA99 方向
        ├─ MA99 方向 gate（direction mismatch 排除）
        └─ 回 top N matches + 1D aggregation
    → compute_stats(matches, current_close, timeframe)
        ├─ _projected_future_bars() → consensus forecast（全集）
        └─ OrderSuggestion × 4 + win_rate + mean_correlation
  → PredictResponse
  → frontend displayStats useMemo
    ├─ appliedSelection == 全集 → 用 appliedData.stats（後端算好）
    └─ appliedSelection ⊂ 全集 → utils/statsComputation.ts::computeStatsFromMatches() 前端算 subset（K-013 落地）
  → MainChart + MatchList + StatsPanel 渲染
```

---

## Consensus Stats Source of Truth

**決策來源：** TD-008 RFC Option C（accepted 2026-04-18，見 `docs/designs/TD-008-rfc-consensus-source-of-truth.md`）。實作 ticket：[K-013](../docs/tickets/K-013-consensus-stats-contract.md)。

**核心規則：**

1. **全集 stats（all top-N matches）由後端算**：`/api/predict` 回傳的 `stats.consensus_forecast_1h/1d` 與 4 檔 OrderSuggestion 是「全集 baseline」。前端拿到時若 `appliedSelection == 全部 matches`，直接用，不重算。
2. **Subset stats（使用者 deselect 部分 matches）由前端算**：不回後端 round-trip（保留零 latency UX）。純函式抽至 `frontend/src/utils/statsComputation.ts`，簽名：
   ```ts
   computeStatsFromMatches(
     matches: MatchCase[],
     currentClose: number,
     timeframe: '1H' | '1D',
     lastBarTime?: string,
   ): StatsComputationResult
   // StatsComputationResult = { stats: Omit<PredictStats, 'consensusForecast1h' | 'consensusForecast1d'>, projectedFutureBars: ProjectionBar[] }
   // consensusForecast1h/1d 由 AppPage 以 projectedFutureBars + aggregateProjectedBarsTo1D 於 util 外組合
   ```
3. **雙實作由 contract fixture 鎖漂移**：
   - Fixture：`backend/tests/fixtures/stats_contract_cases.json`（array of `{name, input, expected}`，涵蓋全集 / subset / single-match 邊界）
   - 產生器：`backend/tests/fixtures/generate_stats_contract_cases.py`（入版 script，以當前 `compute_stats` 輸出作 ground truth；後端改算法時重跑一鍵重生）
   - 後端 `test_predictor.py` 加 parametrize test：讀 fixture，assert `compute_stats(**input)` == `expected`（容忍 1e-6）
   - 前端 `__tests__/statsComputation.test.ts`：relative path `../../../backend/tests/fixtures/stats_contract_cases.json`，build-time JSON import（需 `tsconfig.json::resolveJsonModule: true`），對 3 case 跑 `computeStatsFromMatches(...)` 並經 snake→camel whitelist 轉換後 assert bit-exact
   - 後端改算法但未同步 fixture → 後端測試失敗；前端算法漂移 → 前端測試失敗。兩端任一破漂移立即 CI red。
   - Contract test 比對範圍：4 檔 OrderSuggestion + `win_rate` + `mean_correlation`。**不比對** `consensus_forecast_1h/1d`（見 Known Gap）。
4. **API payload 不變**：`/api/predict` 回傳 schema 完全不動；現有 E2E mock 不需改。
5. **CI contract drift job 暫緩**：本 cycle 靠 PR reviewer 人工把關 + 測試同吃 fixture 作為安全網，K-013 驗收後下個 cycle 再評估是否加獨立 drift job。

**為什麼不選 Option A / B**（節錄，完整論證見 RFC）：
- A（backend-only，每次 deselect 打 API）：每次 click 100~300ms round-trip，what-if 分析情境 UX 退步
- B（frontend-only，刪 backend stats）：作廢 `test_predictor.py` 44 tests 中相當比例，負投資

**Wire-level vs Observable contract（2026-04-21 Round 2 Fix 1 `853a8aa` 更正，原 Known Gap 撤回）：** 後端 `PredictStats.consensus_forecast_1h/1d` wire-level 永遠是 `[]`（`compute_stats` 從未填入；`models.py` 預設 `[]`）— 此為 backend API schema 事實。**Observable chart render 由前端 `AppPage.tsx` `displayStats` useMemo 無條件注入** `projectedFutureBars` / `projectedFutureBars1D` 保證（full-set 與 subset 兩分支皆注入），故 `StatsPanel::ConsensusForecastChart` 兩種選擇狀態皆可見。OLD base `b0212bb` L224-226 即為此無條件注入行為，K-013 Round 1 `8442966` 把注入誤綁 subset 分支 → 全集分支 chart 消失 → 觸發 C-1 Critical；Round 2 Fix 1 `853a8aa` 恢復無條件注入。早期設計文件敘述「全集下無 consensus 圖 pre-existing gap」為 Architect Pre-Design Audit 只讀 backend schema 未 cross-verify OLD frontend observable 所致誤判，已於 K-013 設計文件 §0.3 以 "RETRACTED" 標記留底並更正。若未來要讓 `consensus_forecast_*` 成為 backend-computed 而非 frontend-injected，需另開 ticket。

---

## Known Architecture Debt

完整登記於 [`docs/tech-debt.md`](../docs/tech-debt.md)，以下是結構性技術債與 Architect 預定拆分方向。

| ID | 區塊 | 問題 | 預定方向 | 排期觸發 |
|----|------|------|---------|---------|
| TD-003 | `backend/main.py` | upload history 用 module globals，併發 race | `asyncio.Lock` 或 `history_repository` atomic write（建議併入 TD-006 RFC） | 多 worker 部署 / TD-006 啟動 |
| TD-004 | `frontend/src/components/MatchList.tsx` | `PredictorChart` effect deps 不含 candle values，長度相同但內容不同 → 殘留舊 chart | 改用 memoized chart input 或 data identity hash，同時移除 exhaustive-deps suppression | 與 TD-005 同梯次 |
| TD-005 | `frontend/src/AppPage.tsx` | 22 KB 單檔，責任含 official CSV parse / upload workflow / MA99 loading / prediction orchestration / derived stats / selection state / layout | 拆 `useOfficialInput()` / `useHistoryUpload()` / `usePredictionWorkspace()` + 左右 rail 抽 presentational sub-section | K-013 驗收後 → Architect RFC |
| TD-006 | `backend/main.py` | 12 KB 單檔，FastAPI wiring / CSV parse / mutable state / 持久化 / prediction orchestration / SPA fallback 全混 | 拆 `history_repository.py` / `history_service.py` / `prediction_service.py`，`main.py` 僅留薄路由層；建議併 TD-003 | K-013 驗收後 → Architect RFC（併 TD-003） |
| TD-007 | `backend/predictor.py` | 17 KB 單檔，time normalize / MA99 helpers / similarity / trend classify / 1D aggregation / stats generation 全混 | 拆 `predictor_ma.py` / `predictor_similarity.py` / `predictor_stats.py`，`predictor.py` 作 orchestration entrypoint。`compute_stats` 搬進 `predictor_stats.py` 時 K-013 contract fixture 需同步遷移 | K-013 驗收後 → Architect RFC |
| TD-008 | cross-layer stats | frontend/backend double-compute drift risk | Option C implemented (K-013, closed 2026-04-21); contract fixture locks drift | closed |

**RFC ordering (PM confirmed):**
1. TD-005 RFC (`AppPage.tsx` split; `usePredictionWorkspace()` boundary uses `statsComputation.ts` from K-013)
2. TD-006 + TD-003 combined RFC (backend split + concurrency lock)
3. TD-007 RFC (`predictor.py` split; contract fixture migration)

---

## Time Format Convention

**傳輸/儲存層統一 UTC+0 `YYYY-MM-DD HH:MM`（16 字元）。Render 層才轉 UTC+8。**

- 後端：`time_utils.normalize_bar_time()` 負責統一轉換（ISO、Unix ms、ISO with `HH:MM:SS` 都接受）
- 前端 API payload：UTC+0
- 前端 render：`utils/time.ts::toUTC8Display()` 在顯示前轉 UTC+8 `MM/DD HH:mm`
- Chart（lightweight-charts）：timestamp 先 +8h 再餵給 library，讓 UTC-based x-axis 顯示 UTC+8 labels

> 此規範源自 2026-04 bug fix：UTC vs UTC+8 混用導致 MA99 方向判斷錯誤。

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

使用 `react-router-dom` BrowserRouter，路由定義於 `main.tsx`。

| Path | Component | 說明 |
|------|-----------|------|
| `/` | `HomePage` | Hero + ProjectLogic + DevDiary 預覽（K-024 Phase 2：DevDiarySection 消費 `useDiary(3)` 回傳的 flat `DiaryEntry[]`，前 3 筆 sorted by date desc + array-index tie-break，共用 `timelinePrimitives.ts` rail/marker 常數） |
| `/app` | `AppPage` | K-Line 預測功能（原 App.tsx；TD-005 待拆分）。**K-030 isolation**：不渲染 UnifiedNavBar、不渲染 Footer（K-035 統一後為 `components/shared/Footer.tsx`；pre-K-035 為 `components/home/HomeFooterBar.tsx`）；根 div 套 `bg-gray-950 text-gray-100` 覆蓋 body paper；視為獨立 tool viewport（由 marketing 頁 NavBar 的 App link 開 new tab 進入） |
| `/about` | `AboutPage` | Portfolio-oriented recruiter page — 8 sections: PageHeader（One operator 聲明）+ MetricsStrip + WhereISteppedIn (Nº 02.5, A+C+B comparison) + RolePipeline (Nº 03, inline SVG diagram) + RoleCards (Nº 04, 6 roles × Owns/Artefact) + ReliabilityPillars (Nº 05, 3 pillars + anchor quotes) + TicketAnatomy (Nº 06, K-002/K-008/K-009, SSOT→content/ticket-cases.json) + ProjectArchitecture (Nº 07) + Footer（shared，email/GitHub/LinkedIn 單行）。`BuiltByAIBanner` 放 `/` homepage；`/about` 不含 banner showcase（K-031 移除 S7 BuiltByAIShowcaseSection）。**K-058（2026-04-28）加 2 sections + RoleCard compact format α + processRules weight formula**。K-017 重寫（2026-04-19），K-031 移除 S7 showcase（2026-04-21）。**K-034 Phase 2（2026-04-23）全頁 Pencil SSOT 對齊**：5 card 類型（Metric/Role/Pillar/TicketAnatomy/Arch）統一經 `FileNoBar` primitive 套 dark charcoal FILE Nº/LAYER Nº header bar；`DossierHeader` 退役（Pencil 無對應 frame）；S2/S3/S5/S6 h2 刪除（SectionLabelRow 為唯一標題，S4 h2 "How AI Stays Reliable" per Pencil s4Intro 保留改 Bodoni 30）；3 section subtitle 改 Pencil em-dash literal；S1 hero 改 2-line 左對齊 + 全寬 divider；ROLE_ANNOTATIONS (POSITION/BEHAVIOUR) + redactArtefact 退役；role font-size Bodoni 36/32 by length；40px charcoal rule 進 Role/Pillar/Ticket/Arch card body。**K-045（2026-04-24 Engineer 交付）desktop layout consistency**：AboutPage.tsx 重寫為 6 `<section>` 直接為 root `<div className="min-h-screen">` 子元素（per-section container classes，per ticket §4a pattern A 強制，K-031 `#architecture.nextElementSibling === <footer>` Sacred runtime 驗 pass）；每 section inline `max-w-[1248px] mx-auto px-6 sm:px-24 w-full` + 垂直節奏 `mt-6 sm:mt-[72px]`（S2–S6）/ `pt-8 sm:pt-[72px]`（S1）/ `mb-8 sm:mb-[96px]`（S6 before footer）；對齊 Pencil frame 35VCj `Y80Iv padding:[72,96,96,96], gap:72`；hero BQ-045-05 Option A 升 1248 落地；SectionContainer.tsx primitive DELETED（git rm，單一 consumer 清空）；SectionLabelRow 抽至 `components/about/SectionLabelRow.tsx` 獨立 file；PageHeaderSection 去除 `py-20`。**K-058（2026-04-28 Engineer）拓展為 8 `<section>`**：新增 `WhereISteppedInSection`（Nº 02.5，A+C+B 三欄比較表）+ `RolePipelineSection`（Nº 03，inline SVG pipeline diagram）；RoleCards 升 Nº 04，Pillars→05，TicketAnatomy→06（SSOT 移至 `content/ticket-cases.json`），Architecture→07；`processRules` weight 公式進 `build-ticket-derived-ssot.mjs`；`CardShell padding='sm'` + `FileNoBar cardPaddingSize='sm'` 新增（RoleCard compact format α） |
| `/diary` | `DiaryPage` | K-024 Phase 3 v2 timeline：讀 `public/diary.json`（flat `DiaryEntry[]`）→ `<DiaryHero />` + `<DiaryTimeline />` (`<ol role="list">` flat renderer) + `<LoadMoreButton />`；Hero + rail + marker + 3-layer entry (title em-dash / date Geist Mono / body Newsreader italic)；初始 5 筆，Load more 每 click +5 (`useDiaryPagination` client-side slicing + inFlight 併發 gate)；content maxWidth 1248px；mobile < 640px rail/marker 隱藏、fonts 縮放；loading / error / empty-state 各有獨立 component + literal copy。**K-034 Phase 3（2026-04-23）加入 shared Footer**（AC-034-P3-DIARY-FOOTER-RENDERS）：`<Footer />` 為 root `<div className="min-h-screen">` 最末 sibling（/about / /business-logic 同 pattern）；4 個 terminal state（loading / error / empty / timeline）皆渲染 Footer（AC-034-P3-DIARY-FOOTER-LOADING-VISIBLE Option A）；K-017 AC-017-FOOTER /diary 負斷言 + K-024 /diary no-footer Sacred + K-034 Phase 1 T4 AC-034-P1-NO-FOOTER-ROUTES /diary row 三條全退役（BQ-034-P3-03）；Pencil provenance 沿用 homepage-v2.pen `86psQ` + `1BGtd`（無新 .pen frame 需求，BQ-034-P3-01 裁決）；Footer ancestor-padding seam 640–768px 為 Known Gap（TD-K034-P3-02） |
| `/business-logic` | `BusinessLogicPage` | 交易邏輯（密碼保護，JWT 驗證後顯示） |
| `*` | `Navigate to /` | 未匹配路徑一律導回首頁 |

**NavBar：** `UnifiedNavBar` 掛在 4 個 marketing 頁面頂端（`/` / `/about` / `/diary` / `/business-logic`；K-005 統一方案 → K-021 設計系統對齊 → K-030 從 `/app` 撤除 → K-025 hex → token 遷移規劃中）。左側 home icon 連 `/`，右側 TEXT_LINKS：App / Diary / About（Prediction 暫隱藏，以常數註解保留）；active 狀態用 `aria-current="page"` + class `text-brick-dark`（#9C4A3B，K-025 落地後；pre-K-025 為 arbitrary-value `text-[#9C4A3B]`），非 active `text-ink/60`（#1A1814 @ 60% opacity，K-025 落地後；pre-K-025 為 `text-[#1A1814]/60`）。背景 `bg-paper`（#F4EFE5）。**K-030 起** `App` entry 於 TEXT_LINKS 標 `external: true`，改渲染原生 `<a target="_blank" rel="noopener noreferrer">` 而非 `<Link>`，使點擊於新 tab 開 `/app`。

**Sitewide scroll behavior：** `<ScrollToTop />` (`components/ScrollToTop.tsx`, K-053 2026-04-26) mounted inside `<BrowserRouter>` resets `window.scrollY` to 0 on every pathname change, with hash-link early-return to preserve browser anchor behavior. Mirrors `useGAPageview` pattern (sibling component, `useEffect` on `[pathname, hash]`). Sets `history.scrollRestoration = 'manual'` once on mount (BQ-K053-04 ruling) to suppress browser POP-restore single-frame flicker. Same-route NavBar re-click preserves scroll (dep array unchanged); query-only nav preserves scroll (`search` not in dep array); hash navigation preserves scroll (early-return on `hash` truthy).

---

## Design System (K-021)

**設計稿來源：** `frontend/design/homepage-v2.pen`（4 個 top-level frames：Homepage 4CsvQ / About 35VCj / Diary wiDSi / Business Logic VSwW9）
**設計文件：** [K-021-sitewide-design-system.md](../docs/designs/K-021-sitewide-design-system.md)

### Tokens

**Tailwind `theme.extend.colors`（K-021 註冊，替代目前 inline `[#XXXXXX]`）：**

| Token | Value | 用途 |
|-------|-------|------|
| `paper` | `#F4EFE5` | 全站底色 body bg |
| `ink` | `#1A1814` | 主文字 |
| `brick` | `#B43A2C` | Logo / brand 主色 |
| `brick-dark` | `#9C4A3B` | NavBar active link + CTA 按鈕 |
| `charcoal` | `#2A2520` | 次文字 / 輔助元素 |
| `muted` | `#6B5F4E` | Footer / meta / NavBar non-active |

**Tailwind `theme.extend.fontFamily`：**

| Token | Stack | 用途 |
|-------|-------|------|
| `display` | `['"Bodoni Moda"', 'serif']` | H1 / hero / section title |
| `italic` | `['Newsreader', 'serif']` | italic emphasis / blockquote |
| `mono` | `['"Geist Mono"', 'monospace']` | 程式碼 / 數據 / Footer meta |

**字型載入：** Google Fonts CDN via `index.html` preconnect + stylesheet link（既有，無需改）。

### 全站 Body CSS 入口

`frontend/src/index.css` 採 `@layer base` 註冊 body 預設：

```
@layer base {
  body { @apply bg-paper text-ink font-display; }
}
```

所有頁面的外層 `<div className="min-h-screen bg-[#0D0D0D] text-white">` 包 wrap（AboutPage / DiaryPage / AppPage / BusinessLogicPage）於 K-021 移除，改由 body 底色承接。HomePage 已是 `bg-[#F4EFE5]` 直接轉為繼承 body。

**例外（K-030）：** `/app` 於 wrapper 層 override（`h-screen` 根 div 套 `bg-gray-950 text-gray-100`），body paper 規則對 `/app` 的視覺效果被完全覆蓋。`/app` 不屬 sitewide paper design system（tool page，非 marketing page）；此例外獨立守護於 `frontend/e2e/app-bg-isolation.spec.ts`。

### Footer 放置策略

**決策：per-page import（非 Layout slot）**，原因：AppPage `h-screen overflow-hidden` 與 Layout slot 模型衝突，per-page 才能讓各頁獨立決定是否渲染 Footer 與放置位置（/diary 本票不決定、由 K-024 處理）。

| 頁面 | Footer |
|------|--------|
| `/` | `<Footer />`（**K-050 design 2026-04-25**：brand-asset SVG anchor triad + click-to-copy email `<button>` + sr-only aria-live status；supersedes K-034 Phase 1 plain-text inline one-liner；Pencil SSOT frame 1BGtd flat-text 為 layout-placeholder，runtime divergence 由 `design-exemptions.md §2 BRAND-ASSET` 背書） |
| `/about` | `<Footer />`（**K-050 design 2026-04-25**：同上 shared DOM；K-017 AC-017-FOOTER 部分恢復（anchor href + testid，`Let's talk →` copy 不恢復）；K-018 AC-018-CLICK 完整恢復；Pencil SSOT frame 86psQ flat-text 為 layout-placeholder） |
| `/diary` | `<Footer />`（**K-050 design 2026-04-25**：同上 shared DOM；continues K-034 Phase 3 root `<div className="min-h-screen">` 最末 sibling 配置；4 個 terminal state（loading / error / empty / timeline）皆渲染；640–768px viewport padding seam Known Gap TD-K034-P3-02 不動；Pencil SSOT frame ei7cl flat-text 為 layout-placeholder） |
| `/app` | 無 footer（K-030 isolation — `/app` 為獨立 tool viewport，撤除 NavBar 與 Footer 使其不繼承 marketing site chrome；K-050 不動） |
| `/business-logic` | `<Footer />`（**K-050 design 2026-04-25**：同上 shared DOM；Pencil SSOT frame 2ASmw flat-text 為 layout-placeholder） |

### Shared Components 邊界

| 組件 | 位置 | 用於 |
|------|------|------|
| `UnifiedNavBar` | `components/UnifiedNavBar.tsx` | `/` `/about` `/diary` `/business-logic`（K-030 起 `/app` 不渲染；TEXT_LINKS 的 `App` entry 標 `external: true`，於 4 marketing 頁點擊時開 new tab 載入 `/app`）。**TD-K035-01 追蹤** 後續搬 `components/shared/NavBar.tsx`（blocked-by K-025 close） |
| `Footer` | `components/shared/Footer.tsx` | `/` / `/about` / `/business-logic` / `/diary` **四路由** render 同一 zero-prop `<Footer />`，DOM 跨 4 路由 byte-identical（K-034 P1 T1 Sacred 守護）。**K-050 (2026-04-25) supersedes K-034 Phase 1 plain-text framing** — runtime DOM 為 3 brand-asset SVG anchor triad（MailIcon / GithubIcon / LinkedinIcon，CC0/MIT mirror at `frontend/design/brand-assets/`，`?react` SVGR import）+ click-to-copy email `<button>`（`navigator.clipboard.writeText` + range-selection fallback + 1500ms revert + sr-only `role="status" aria-live="polite"` 狀態廣播）+ K-018 REGULATORY GA disclosure `<p>`。Pencil SSOT = frames `1BGtd` (/) + `86psQ` (/about) + `ei7cl` (/diary) + `2ASmw` (/business-logic) flat-text 為 layout-placeholder，runtime divergence 由 `design-exemptions.md §2 BRAND-ASSET` 背書（4 個 frame JSON 各帶 `_design-divergence` (kebab) / `_designDivergence` (camel) 欄位）。K-017 AC-017-FOOTER 部分恢復（anchor href + testid；`Let's talk →` copy 不恢復）；K-018 AC-018-CLICK 完整恢復 + 1 cross-route sanity；K-022 italic/underline 不恢復；K-034 P1 T1 byte-identity + K-045 T18/T19 width parity 全保留（單一 Footer DOM 4 路由）。/app K-030 isolation preserved 不渲染 per AC-030-NO-FOOTER Sacred（K-050 不動）。|

### Legacy NavBar

`components/NavBar.tsx`（legacy）於 K-021 驗收後若無 consumer 則刪除（Engineer grep 確認）。

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

## Scripts & Public Protocols Doc（K-017 起）

### `scripts/audit-ticket.sh`

**定位：** Portfolio demo script，展示 6-role + doc trail 機制的可驗證性；**不是 CI gate**（不接 pre-commit / GitHub Actions）。

**Usage：** `./scripts/audit-ticket.sh K-XXX`（從專案根目錄執行；script 內含 `cd` 保險）

**Check groups：** A. Ticket file frontmatter / B. AC + PRD mapping / C. Architecture design / D. Commit trail / E. Code Review 反省 / F. 5 角色反省 + per-role log（K-008+ 才含）/ G. Playwright spec + visual report HTML（K-008+ 才含）

**Date-based skip：** `created < 2026-04-18` 的 ticket F/G 直接 SKIP（per-role retro 機制啟用前）

**Exit codes：** 0 = all pass / 1 = warning / 2 = critical missing

**實作約束：** bash only（不依賴 node / python / jq），ANSI escape 上色（TTY detect），shebang `#!/usr/bin/env bash`

### `docs/ai-collab-protocols.md`

**定位：** 公開版協議文件，對外 recruiter 可讀；從 `/about` Section 4「How AI Stays Reliable」三個 pillar inline link 進入。

**結構：** 三個主 section — `Role Flow` / `Bug Found Protocol` / `Per-role Retrospective Log` —  每個含 stable anchor（`{#role-flow}` / `{#bug-found-protocol}` / `{#per-role-retrospective-log}`）讓 `/about` pillar 深度連結。附 curated retrospective 節選 2–3 條。

**部署：** Copy / symlink 到 `frontend/public/docs/ai-collab-protocols.md`，避免 Firebase SPA fallback 吞 `.md` 路徑。

---

## Auth Flow（Business Logic）

`BusinessLogicPage` 掛載時的 token 狀態機：

```
mount → 讀 localStorage('bl_token')
  ├─ 無 token
  │   └─ → SHOW_PASSWORD_FORM
  ├─ 有 token，exp ≤ now（已過期）
  │   └─ 清除 localStorage → SHOW_PASSWORD_FORM + 過期提示
  └─ 有 token，exp > now（有效）
      └─ → LOADING_CONTENT → GET /api/business-logic
            ├─ 200 → SHOW_CONTENT（渲染 Markdown）
            └─ 401 → 清除 localStorage → SHOW_ERROR

SHOW_PASSWORD_FORM → 使用者輸入密碼 → POST /api/auth
  ├─ 200 → 存 token 至 localStorage → LOADING_CONTENT（接上面流程）
  └─ 401 → SHOW_ERROR（密碼錯誤提示）
```

**環境變數：**
- `BUSINESS_LOGIC_PASSWORD` — 驗證密碼
- `JWT_SECRET` — JWT 簽名 secret

**Token 規格：**
- Algorithm: HS256
- 有效期：24 小時（`exp = iat + 86400`）
- Subject: `"business-logic-access"`

---

## Changelog

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
- **2026-04-22** (Architect, K-020 design) — GA4 SPA pageview E2E hardening: `ga-spa-pageview.spec.ts` added (9 tests); `§GA4 E2E Test Matrix` section added. Design doc: [K-020-ga-spa-pageview-e2e.md](../docs/designs/K-020-ga-spa-pageview-e2e.md).
- **2026-04-22** (Architect, K-024 design) — `/diary` structure rework: `DiaryEntry` → flat `DiaryEntry[]` schema; 8 new `diary/` components + `timelinePrimitives.ts`; 5 Vitest specs + 29+4 Playwright cases. Design doc: [K-024-diary-structure.md](../docs/designs/K-024-diary-structure.md).
- **2026-04-21** (PM, K-013 close) — K-013 Stats SSOT (TD-008 Option C) closed after R2 bug-found remediation; merged + deployed.
- **2026-04-21** (Architect, K-013/K-030/K-031/K-028/K-023 designs) — Stats SSOT frontend util + contract fixture; `/app` isolation; `/about` S7 showcase removed; homepage visual fix; directory drift fixes. Design docs in `docs/designs/`.
- **2026-04-22** (PM, K-022 review) — K-022 `/about` v2: `DossierHeader` + `RedactionBar` added; `CardShell` dark→paper palette; `SectionLabelRow` added; 5 section labels.
- **2026-04-21** (Architect, K-027 design) — `diary/` directory structure drift corrected; mobile overlay hotfix in `DiaryEntry.tsx` + `MilestoneSection.tsx`.
- **2026-04-20** (Architect, K-021 design) — Sitewide design system: 6 color tokens + 3 font tokens + body `@layer base`; Footer per-page strategy; shared components boundary table. Design doc: [K-021-sitewide-design-system.md](../docs/designs/K-021-sitewide-design-system.md).
- **2026-04-19** (Architect, K-018/K-017 designs) — GA4 tracking design (`analytics.ts` + `useGAPageview`); `/about` rewritten as portfolio page with `audit-ticket.sh` + `ai-collab-protocols.md`.
- **2026-04-18** (Architect, K-008 design) — `## QA Artifacts` section added; `chromium`/`visual-report` Playwright project split design.
- **2026-04-15** (initial) — Phase 1/2 complete: JWT auth + BrowserRouter + 4 pages + business-logic password gate.
