---
title: K-Line Prediction — Product Requirements Document
type: spec
tags: [K-Line-Prediction, PRD, AC]
updated: 2026-04-27
---

# Product Requirements Document — K-Line Prediction

ETH/USDT K-line pattern similarity prediction system. This document is the PM's product spec + AC master index.
For full ticket details, click each `[K-XXX]` link to `docs/tickets/K-XXX-*.md`.

## Table of Contents

- [§1 Product Spec](#1-product-spec)
- [§2 Sitewide AC](#2-sitewide-ac)
- [§3 Active Tickets](#3-active-tickets)
- [§4 Closed Tickets](#4-closed-tickets)
- [§5 Tech Debt](#5-tech-debt)

---

## §1 Product Spec

### Product

K-Line historical pattern matching and scenario forecasting.

### Goal

Find historical segments that are similar to the user's current K-line structure while keeping the MA99 trend aligned. The system should avoid cases where the current setup is under a falling MA99 but the returned matches come from rising-MA99 environments, or vice versa.

### Core Matching Logic

#### Input sources

- OHLC input remains the primary data source.
- Users can provide OHLC through CSV upload, JSON import, manual editing, or example data.
- Users may additionally upload a chart screenshot that shows the MA99 line and choose the MA99 trend direction from the screenshot.

#### Similarity model

- Do not match on `close` only.
- For each bar, derive candle-shape features:
  - body percent
  - full range percent
  - upper wick percent
  - lower wick percent
  - close-to-close return percent
- Compare historical windows using normalized similarity over the derived candle feature vector.

#### MA99 trend requirement

- Historical candidates must have an MA99 trend direction that matches the query trend direction.
- MA99 direction should be treated as a gate before final ranking.
- When MA99 direction differs, the candidate must be excluded.

#### MA99 source priority

1. Direct OHLC calculation — if the input segment contains enough data to compute MA99 directly, use the query OHLC itself.
2. Historical backfill — if the input segment is shorter than 99 bars but each row includes time values that can be aligned to the project history database, the system should fetch the bars immediately before the input segment and use them to compute MA99.
3. Screenshot-assisted override — if direct calculation and historical backfill are both unavailable, the user may upload a screenshot and manually specify whether MA99 is `up`, `down`, or `flat`. In this mode, MA99 is used as a trend-direction filter only; no precise MA99 similarity score is computed for the query segment.

#### Final ranking

- If query MA99 is available as a numeric series: `final_score = 0.6 * candle_score + 0.4 * ma_score`
- If query MA99 comes from screenshot override only: `final_score = candle_score`; MA99 direction is still used as a hard gate.

### Statistics Logic

- Stats are computed from the selected match set.
- Match List — each match includes the matched historical segment plus the actual next 72 x 1H bars from history; the expanded match chart must show these raw future bars, not a projected or aggregated chart.
- Statistics — build a projected 72 x 1H candle path from the selected match set; for each future hour bucket, rebase every selected match's future OHLC by its historical base close and project it onto the current input close; aggregate each hour bucket with median open, median close, median high, and median low to form one projected candle; the Statistics chart must visualize this aggregated projected 72-hour path.
- Overall stats (across all 72 projected bars):
  - highest = highest `high` found on the projected 72-hour chart
  - second highest = second-highest `high` found on the projected 72-hour chart
  - lowest = lowest `low` found on the projected 72-hour chart
  - second lowest = second-lowest `low` found on the projected 72-hour chart
  - occurrence window = the actual UTC+8 datetime where that projected extreme appears
  - win rate = share of projected candles whose close is above the current close
  - mean correlation = average match score
- Per-day stats (Day 1 / Day 2 / Day 3, each covering 24 projected bars):
  - highest = highest `high` within that day's 24 projected bars
  - lowest = lowest `low` within that day's 24 projected bars
  - occurrence window = actual UTC+8 datetime of the extreme within that day
- Time display:
  - all occurrence windows must show actual UTC+8 datetimes (format: MM/DD HH:mm) derived from the last bar of the user's input
  - the Statistics chart x-axis must show actual UTC+8 datetimes at day boundaries (Hour +1, Hour +25, Hour +49, Hour +72)

### Input Validation

- The predict button is enabled only when all visible OHLC rows are numerically complete.
- If all matches are unchecked, prediction must be disabled until at least one case is selected.
- If the query is shorter than 99 bars and cannot be aligned to history by time, the backend must require either aligned timestamps that allow historical backfill, or an MA99 screenshot override direction.

### API

#### POST `/api/merge-and-compute-ma99`

**Payload**
- `ohlc_data`: array of OHLC rows (merged from the two uploaded CSV files)
- `timeframe`: `1H` or `1D`

**Response**
- `query_ma99`: MA99 series for the uploaded query segment (`(number | null)[]`)
- `query_ma99_gap`: `null` if fully populated; otherwise `{ from_date, to_date }` indicating the date range where data was missing

**Purpose:** called immediately after the official CSV files are uploaded (before prediction) so that the MA99 line and header value can be rendered on the main chart without waiting for the user to click the predict button.

**Note:** this endpoint does NOT persist uploaded OHLC data to the history database. The merge is performed in memory only to provide the historical prefix needed for MA99 computation. History database updates must go through `/api/upload-history`.

#### POST `/api/predict`

**Payload**
- `ohlc_data`: array of OHLC rows with optional `time`
- `selected_ids`: array of selected match ids
- `timeframe`: `1H` or `1D`
- `ma99_trend_override`: optional `up`, `down`, or `flat`

**Response**
- `matches`: array of match cases; each case includes `historical_ohlc` / `future_ohlc` / `historical_ma99` / `future_ma99` / `historical_ohlc_1d` / `future_ohlc_1d` / `historical_ma99_1d` / `future_ma99_1d` / `start_date` / `end_date` / `correlation`
- `stats`: aggregated statistics across all selected matches
- `query_ma99`: MA99 series for the current query segment (`(number | null)[]`)
- `query_ma99_gap`: `null` if fully populated; otherwise `{ from_date, to_date }`

**Note:** this endpoint does NOT persist uploaded OHLC data to the history database. The merge is in-memory only.

#### POST `/api/upload-history`

**Payload:** multipart/form-data with a single `file` field (CSV).

**Response**
- `filename`: the canonical filename saved to disk (e.g. `Binance_ETHUSDT_1h.csv`)
- `latest`: the most recent bar's date string in UTC+0 `YYYY-MM-DD HH:MM` format, or `null` if the database is empty
- `bar_count`: total number of bars currently in the database after the merge
- `added_count`: number of net-new bars added in this upload (0 means all bars already existed)
- `timeframe`: `"1H"` or `"1D"` as detected from the uploaded file

**Purpose:** appends new bars to the persistent history database on disk. The endpoint deduplicates by normalized UTC timestamp so re-uploading overlapping data is safe.

**Supported CSV formats:**
- **CryptoDataDownload**: first line is a URL comment; header on second line; rows ordered newest-first (auto-reversed)
- **Standard CSV**: header on first line with `date`/`unix`/`open`/`high`/`low`/`close` columns; chronological order
- **Binance raw API**: no header; positional columns `open_time, open, high, low, close, …`; `open_time` is a Unix timestamp in milliseconds

**Note:** all timestamp formats are normalized to UTC `YYYY-MM-DD HH:MM` by `time_utils.normalize_bar_time` before storage. The file is only written to disk when `added_count > 0`.

#### GET `/api/history-info`

**Response** — object with `1H` and `1D` keys, each a `HistoryEntry`:

- `filename`: CSV filename on disk, or `"mock data (no file)"` when running without a CSV
- `latest`: most recent bar's date string in UTC+0 (`YYYY-MM-DD HH:MM`), or `null` if history is empty
- `bar_count`: total bars currently loaded in memory
- `freshness_hours`: integer — floor of hours elapsed since `latest` bar vs current UTC time; `null` when running on mock data (CSV not on disk at startup) — added K-048

**Purpose:** read-only status endpoint used by the History Reference UI to display DB freshness. Called once on component mount.

**Note (K-048):** `freshness_hours >= 48` means the DB is stale enough for the frontend to show a stale warning indicator.

### Timezone Convention

All timestamps are stored and transmitted as **UTC+0** in `YYYY-MM-DD HH:MM` format (16 characters). The display layer is responsible for converting to **UTC+8** for user-facing text.

- Backend (`time_utils.normalize_bar_time`): accepts any input format and outputs UTC+0 `YYYY-MM-DD HH:MM`
- Frontend storage / API payloads: UTC+0
- Frontend display (`utils/time.toUTC8Display`): converts UTC+0 → UTC+8 at render time only
- Chart rendering (lightweight-charts): timestamps are shifted by +8 h before passing to the library so that the chart's UTC-based x-axis shows UTC+8 labels

### UX Notes

- Keep OHLC input and MA99 assistance as separate UI concepts.
- Screenshot upload is optional and should be described as an MA99 assist path, not as the main data input.
- When screenshot-assisted override is active, users should understand that MA99 is being used as a directional filter rather than a fully reconstructed MA99 series.
- Match List and Statistics must be labeled clearly so users can distinguish between actual future historical bars in each matched case and the aggregated projected chart used for statistics and order suggestions.
- After prediction, the main chart header must display the latest non-null value from `query_ma99` formatted as `MA(99) x,xxx.xx`.
- If `query_ma99_gap` is non-null, a warning banner must appear below the main chart indicating the affected date range (e.g., `MA99 data missing: 2024-01-01 ~ 2024-01-10`).
- Each expanded match card must display a mini chart that overlays the `historical_ma99` and `future_ma99` as a purple MA99 line alongside the candlestick data; a vertical orange line separates the historical from the future segment.
- In 1D mode, the match card mini chart must display `historical_ohlc_1d` / `future_ohlc_1d` bars and `historical_ma99_1d` / `future_ma99_1d`. Right badge must show the count of 1D future bars (e.g., "Actual future 3D bars") rather than "No future bars".
- Early MA99 loading state: immediately after the official CSV files are uploaded, the system calls `/api/merge-and-compute-ma99` to pre-compute MA99. During this call, the main chart header shows `MA(99) computing…` and the predict button is disabled with tooltip `MA99 computing, please wait…`.
- Each match card header must display a MA99 trend label derived from `future_ma99` using linear regression slope.
- History upload feedback: status badge below upload button shows either new-bar count + latest timestamp or "Data already up to date, no update needed"; upload errors in red badge; "Uploading…" while uploading.
- All match interval timestamps and occurrence windows must display UTC+8 datetimes. A "All times UTC+8" label must appear in the match list header.

### Non-functional Requirements

- Prediction refresh after clicking the button should remain responsive.
- The matching logic should not return opposite-MA99-trend cases.
- The interface should remain usable on desktop widths without collapsing the editor and chart into an unreadable layout.

### Product-level ACs (1D bar aggregation rules)

The following three items are the contract for backend predictor 1H → 1D aggregation behavior, decoupled from any individual ticket and belonging to the Product Spec layer.

#### AC-1D-1: 1D mode match card badge shows daily bar count

- **Given** the user has uploaded 1H OHLC data and run prediction
- **When** the user switches to 1D timeframe mode and expands a match card
- **Then** the right badge displays "Actual future Nd bars" (N = number of aggregated daily future bars)
- **And** the badge "No future bars" is NOT visible

#### AC-1D-2: `_aggregate_bars_to_1d` correctly aggregates 1H bars into daily OHLC

- **Given** a list of 1H bars spanning one or more calendar days
- **When** `_aggregate_bars_to_1d` is called
- **Then** each output daily bar's `open` = first 1H bar's open of that day; `high` = max of all 1H highs for that day; `low` = min of all 1H lows for that day; `close` = last 1H bar's close of that day
- **And** bars with missing/empty date are skipped

#### AC-1D-3: predict endpoint populates `_1d` fields when `history_1d` is provided

- **Given** the backend has a non-empty `_history_1d`
- **When** `/api/predict` is called with 1H OHLC data
- **Then** each match in the response has non-empty `future_ohlc_1d`
- **And** `historical_ohlc_1d` contains the aggregated daily bars for the matched window

### Backtest Page

Read-only dashboard at `/backtest` showing 30-day rolling prediction accuracy from Firestore (K-081).

#### AC-081-LATEST-SUMMARY-CARD
- Summary card displaying `hit_rate_high`, `hit_rate_low`, `avg_mae`, `avg_rmse`, `sample_size`, `window_days` from `backtest_summaries/{latest}`. Loading skeleton (`summary-card-loading`) and error block (`summary-card-error`) on non-ready states.

#### AC-081-PER-TREND-TABLE
- Table with exactly 3 data rows (up → down → flat order); missing trend keys render `N/A` (not `0`). Column headers: Trend, High Hit %, Low Hit %, Avg MAE, Samples.

#### AC-081-TIME-SERIES-CHART
- `lightweight-charts` line chart with `projected_median` (color `#9C4A3B`) and `actual_close` (midpoint `(actual_high + actual_low) / 2`, color `#999999`). `data-testid="time-series-chart"` with `minHeight: 240px`. When fewer than 2 completed pairs: `data-testid="time-series-empty"` placeholder.

#### AC-081-ACTIVE-PARAMS-CARD
- Params card showing `ma_trend_window_days`, `ma_trend_pearson_threshold` (2dp), `top_k`, `params_hash` (12-char prefix), `optimized_at` (formatted or "Defaults — never optimized").

---

## §2 Sitewide AC

Sitewide AC spans multiple tickets / pages, listed with the source-of-truth ticket. For full Given/When/Then/And, see the corresponding ticket md.

- **AC-ROUTE-1 — SPA route direct access does not 404** (`/app`, `/about`, `/diary`, `/business-logic`) — established by the early Homepage & Routing phase, see [K-005](docs/tickets/K-005-unified-navbar.md) and the existing `frontend/e2e/pages.spec.ts`.
- **AC-ROUTE-2 — Existing /app functionality does not regress** (after route refactor, CSV upload / pattern match / chart rendering remain intact) — core regression of Homepage & Routing phase, see `pages.spec.ts`, `app.spec.ts`.
- **AC-HOME-1 — Each Homepage section renders correctly** (Hero / ProjectLogic / TechStack / DevDiary four sections + "Open App" navigates to `/app`) — continuously chained by [K-017](docs/tickets/K-017-about-portfolio-enhancement.md) (AC-017-HOME-V2), [K-023](docs/tickets/K-023-homepage-structure-v2.md), [K-028](docs/tickets/K-028-homepage-visual-fix.md), [K-024](docs/tickets/K-024-diary-structure-and-schema.md) (AC-024-HOMEPAGE-CURATION).
- **AC-ABOUT-1 — /about sections render correctly** — continuously defined by [K-017](docs/tickets/K-017-about-portfolio-enhancement.md) / [K-022](docs/tickets/K-022-about-structure-v2.md) / [K-029](docs/tickets/K-029-about-card-body-text-palette.md) / [K-031](docs/tickets/K-031-remove-built-by-ai-showcase-section.md).
- **AC-DIARY-1 — Diary page renders correctly from diary.json** — schema flattened by [K-024](docs/tickets/K-024-diary-structure-and-schema.md); mobile no-overlap ensured by [K-027](docs/tickets/K-027-mobile-diary-layout-fix.md).
- **AC-AUTH-1~4 — /business-logic password gate** — correct password obtains JWT and displays markdown; wrong password shows error message; no token shows input form; expired token auto-cleared. See Homepage & Routing phase initialization, no standalone ticket.
- **AC-NAV-1~5 — Unified NavBar** (display on all pages / ⌂ navigates home / each link routes correctly / active highlight / Logic lock auth state) — established by [K-005](docs/tickets/K-005-unified-navbar.md), hex→token migration by [K-025](docs/tickets/K-025-navbar-hex-to-token.md).
- **AC-021-TOKEN — Tailwind theme registers 6 paper palette tokens** (paper / ink / brick / brick-dark / charcoal / muted) — established by [K-021](docs/tickets/K-021-sitewide-design-system.md).
- **AC-021-FONTS — Three-font system (Bodoni Moda / Newsreader / Geist Mono) loaded + Tailwind `display` / `italic` / `mono` family registered** (see [K-021](docs/tickets/K-021-sitewide-design-system.md)).
- **AC-021-BODY-PAPER — Sitewide body unified beige `#F4EFE5` / `text-ink`** (`/`, `/about`, `/diary`, `/app`, `/business-logic` full coverage; `/business-logic` additionally covers both PasswordForm pre-login and post-login states) — established by [K-021](docs/tickets/K-021-sitewide-design-system.md); subsequently [K-030](docs/tickets/K-030-app-page-isolation.md) excludes `/app`.
- **AC-021-NAVBAR — NavBar beige conversion + item order aligned to Pencil v2 design** (⌂ / App / Diary / Prediction[hidden] / About) — [K-021](docs/tickets/K-021-sitewide-design-system.md); NavBar item hex→token subsequently handled by [K-025](docs/tickets/K-025-navbar-hex-to-token.md).
- **AC-021-FOOTER — Sitewide `<HomeFooterBar />` single-line info bar** (`/` / `/app` / `/business-logic`; `/about` retains FooterCtaSection; `/diary` decided by K-024) — by [K-021](docs/tickets/K-021-sitewide-design-system.md), with subsequent [K-030](docs/tickets/K-030-app-page-isolation.md) excluding `/app`. **[Retired 2026-04-22 by [K-035](docs/tickets/K-035-about-footer-shared-component-regression.md)]** — canonical shared Footer (`frontend/src/components/shared/Footer.tsx` with `variant="home"` / `variant="about"`) unified across `/` + `/about` + `/diary`; `HomeFooterBar.tsx` + `FooterCtaSection.tsx` deleted; `/app` preserves no-Footer per K-030; `/business-logic` import-only cleanup (not AC-verified, per K-017 defer).
- **AC-018-INSTALL / PAGEVIEW / CLICK / PRIVACY / PRIVACY-POLICY — GA4 Measurement sitewide installation + SPA pageview + CTA click + PII guard + Footer disclosure** — established by [K-018](docs/tickets/K-018-ga-tracking.md), SPA pageview E2E added by [K-020](docs/tickets/K-020-ga-spa-pageview-e2e.md).

> Sitewide AC rule: any PR that changes shared components (NavBar / Footer / body token / fonts / GA) must check whether all entries below still PASS, and correspondingly update the "sitewide Playwright quantitative assertions" (see each ticket's "N routes require N independent test cases" rule).

---

## §3 Active Tickets

The following 14 tickets are in `open` or `backlog` status (per `docs/tickets/*.md` frontmatter `status` field). Status meanings:
- **open** — PM has released prerequisite work (AC / QA early consultation), waiting on or being processed by Architect / Engineer
- **backlog** — triaged with draft AC, awaiting startup after prioritization

### K-012 — business-logic.spec.ts test name and assertion alignment

- **Status:** open / type: test
- **Ticket:** [docs/tickets/K-012-business-logic-spec-rename.md](docs/tickets/K-012-business-logic-spec-rename.md)
- **Summary:** Logic-lock-related E2E test names claim A but actually test B; fix name or assertions to align.

**AC:**

#### AC-012-ALIGN: test name and assertion semantics consistent

- **Given** the Logic-lock-related tests in `frontend/e2e/business-logic.spec.ts`
- **When** reading the test name and body
- **Then** the behavior described by the name fully corresponds to the actual assertion
- **And** no "name claims A, actually only tests B" mismatch

#### AC-012-PASS: Playwright E2E all green

- **Given** the frontend
- **When** running `/playwright`
- **Then** all tests pass (including new or updated assertions in this ticket)

---

### K-014 — Vitest index-based selector residue cleanup (AppPage + OHLCEditor)

- **Status:** backlog / type: test
- **Ticket:** [docs/tickets/K-014-vitest-index-selector-cleanup.md](docs/tickets/K-014-vitest-index-selector-cleanup.md)
- **Summary:** AppPage.test.tsx + OHLCEditor.test.tsx still use `getAllBy...()[N]` index locators; switch to `getByLabelText` / `getByRole({ name, exact })` / `data-testid`.

**AC:**

#### AC-014-SELECTOR: no index-based selectors

- **Given** `frontend/src/__tests__/`
- **When** running `grep -rn "getAllBy.*\[\d\]" frontend/src/__tests__/`
- **Then** no results
- **And** if `getAllBy` must be used, pair it with filter/find + semantic assertion, not `[N]`

#### AC-014-GREEN / AC-014-REGRESSION

See [K-014](docs/tickets/K-014-vitest-index-selector-cleanup.md): Vitest suite all green + tsc / E2E no regression.

---

### K-015 — `find_top_matches()` `ma_history` required

- **Status:** backlog / type: refactor
- **Ticket:** [docs/tickets/K-015-find-top-matches-ma-history-required.md](docs/tickets/K-015-find-top-matches-ma-history-required.md)
- **Summary:** Remove silent fallback in `backend/predictor.py` `find_top_matches()`; switch to required kwarg or add assert/warning. K-009 bug root cause.

**AC:**

#### AC-015-NO-FALLBACK: no silent fallback

- **Given** `backend/predictor.py` `find_top_matches()` implementation
- **When** caller does not pass `ma_history`
- **Then** behavior is one of: Option A = `TypeError` raised (required keyword); Option B = raise in tests / log warning in production
- **And** in either case there is no `if ma_history is None: ma_history = history` silent fallback

#### AC-015-CALLERS: all existing callers pass explicitly

- **Given** all `find_top_matches()` calls in `backend/main.py`
- **When** grepping `find_top_matches(` in that file
- **Then** every call explicitly passes `ma_history=<value>`

#### AC-015-TEST-GUARD: missing caller param is caught at test stage

- **Given** backend test suite
- **When** intentionally removing the `ma_history` argument from some caller
- **Then** at least one test must fail
- **And** the failure reason can directly indicate "`ma_history` missing"

#### AC-015-REGRESSION

See [K-015](docs/tickets/K-015-find-top-matches-ma-history-required.md): all 63 existing tests + K-009 regression test pass.

---

### K-016 — Add superseded header note to K-002 spec

- **Status:** backlog / type: docs
- **Ticket:** [docs/tickets/K-016-k002-spec-superseded-header.md](docs/tickets/K-016-k002-spec-superseded-header.md)
- **Summary:** Add a superseded header note after the `docs/designs/k002-component-spec.md` frontmatter pointing to K-011 (LoadingSpinner copy change).

**AC:**

#### AC-016-HEADER: superseded header note exists and link is correct

- **Given** `docs/designs/k002-component-spec.md`
- **When** the file is read
- **Then** a superseded header note appears after the frontmatter
- **And** the K-011 relative path in the note can be parsed by Markdown viewers (`../../tickets/K-011-loading-spinner-label.md`)
- **And** the original content of lines 99, 111 is preserved unchanged

---

### K-018 — GA4 Tracking (visitor tracking + click events)

- **Status:** open / type: feat
- **Ticket:** [docs/tickets/K-018-ga-tracking.md](docs/tickets/K-018-ga-tracking.md)
- **Summary:** Install GA4 snippet; inject measurement ID via env var; SPA full-page pageview; Footer CTA three-link cta_click; PII guard; Footer disclosure statement.

**AC overview:**

- **AC-018-INSTALL** — `<head>` includes gtag.js; measurement ID is read from `VITE_GA_MEASUREMENT_ID`; if unset, the build silently skips.
- **AC-018-PAGEVIEW** — `/` / `/about` / `/app` / `/diary` each fire a `page_view` event on SPA entry, with `page_location`.
- **AC-018-CLICK** — Footer email / GitHub / LinkedIn + Homepage BuiltByAIBanner click each fire `cta_click` with `label`.
- **AC-018-PRIVACY** — events contain no PII; `gtag('config')` does not set `user_id`/`client_id`.
- **AC-018-PRIVACY-POLICY** — Footer contains "Google Analytics" anonymous traffic disclosure text.

For full Given/When/Then/And, see [K-018](docs/tickets/K-018-ga-tracking.md).

---

### K-019 — Release Versioning & CI/CD

- **Status:** backlog / type: feat
- **Ticket:** [docs/tickets/K-019-release-versioning-ci.md](docs/tickets/K-019-release-versioning-ci.md)
- **Spec:** `docs/designs/2026-04-19-release-versioning-design.md`
- **Plan:** `docs/designs/2026-04-19-release-versioning-ci.md`
- **Summary:** Release version and CI/CD process design; AC in spec AC-K019-1 ~ AC-K019-5.

**AC:** see ticket reference spec.

**Future Enhancement:** After the `/business-logic` page is completed, update `frontend/e2e/screenshot.spec.ts` to add post-auth `/business-logic` screenshots.

---

### K-033 — GA4 SPA route-change beacon emission fix (useGAPageview gtag pattern)

- **Status:** backlog / type: bug / priority: medium
- **Ticket:** [docs/tickets/K-033-ga-spa-beacon-emission-fix.md](docs/tickets/K-033-ga-spa-beacon-emission-fix.md)
- **Summary:** Fix the pre-existing bug where `useGAPageview` did not emit a `/g/collect` beacon on SPA route switch; adopt canonical GA4 gtag SPA pattern (Architect dry-run decides Pattern A `gtag('config', ...)` vs Pattern B `gtag('set',...) + gtag('event',...)`); after landing, K-020 T4 AC-020-BEACON-SPA flips from red to green; assertion must not be loosened. Soft depends on K-032 (page_location value first changed to full URL).

**AC overview:**

- **AC-033-BEACON-SPA-GREEN** — K-020 T4 turns green with original assertion preserved
- **AC-033-BEACON-COUNT-GREEN** — T6 initial-load exactly 1 beacon unchanged
- **AC-033-NEG-UNCHANGED** — T7/T8/T9 NEG-* remain green (hook deps `[location.pathname]` unchanged)
- **AC-033-PAYLOAD-PINNED** — T5 beacon carries `v=2` + `tid` + `en=page_view` + path-key
- **AC-033-NO-REGRESSION** — K-018 ga-tracking.spec.ts 12 tests unaffected

For full Given/When/Then/And, see [K-033](docs/tickets/K-033-ga-spa-beacon-emission-fix.md).

---

### K-037 — Favicon wiring (link tags + web app manifest + E2E 200-status regression)

- **Status:** ready / type: feat / priority: medium / size: XS
- **Ticket:** [docs/tickets/K-037-favicon-wiring.md](docs/tickets/K-037-favicon-wiring.md)
- **Branch:** `K-036-favicon` (squashed with K-036 per user ruling 2026-04-23)
- ~~**Blocked-by-policy:** K-034 Q3 ordering rule — K-036 and later tickets blocked until K-034 closed; K-037 inherits via K-036 dependency.~~ **Block lifted by user 2026-04-23** — K-036 already shipped (commits `891fcfb` + `ea973c9`) so Q3 policy objective already failed; K-037 is grandfathered as the K-036 wiring sibling; K-034 Q1/Q5/Q6 new workflow applies only to K-034 Phase 1+ truly-new UI tickets. See K-037 ticket §Override Rationale.
- **Summary:** K-036 produced 7 favicon files but did not wire them into the page. K-037 adds 6 `<link>` tags to `frontend/index.html`, creates `frontend/public/manifest.json`, adds Playwright E2E asserting that 8 paths (7 favicons + manifest) return 200 under `vite preview`, and manually verifies Chrome/Firefox/Safari tab icons align with the K-036 Pencil design. Excludes asset regeneration, light/dark variants, PWA install.

**AC overview:**

- **AC-037-LINK-TAGS-PRESENT** — `<head>` in the built production bundle contains 6 `<link>` tags (favicon.ico / 16/32/48 PNG / apple-touch-icon / manifest), exact href match.
- **AC-037-ASSETS-200-OK** — under `vite preview`, all 8 resource paths (7 favicons + manifest.json) return 200 via Playwright `page.request.get`, with non-empty body; each resource is an independent test case, not merged.
- **AC-037-MANIFEST-VALID** — `manifest.json` parses as valid JSON; `icons[]` contains at least 192×192 + 512×512 entries, `src` aligned to K-036 filenames.
- **AC-037-MANIFEST-MIME-ACCEPTABLE** — `Content-Type` ∈ { `application/manifest+json`, `application/json`, `application/json; charset=utf-8` }; if the Architect locks W3C canonical, add a Firebase `headers` rule (implementation note, not AC tightening).
- **AC-037-TAB-ICON-VISIBLE** — manually verify Chrome / Firefox / Safari on macOS tab icons show the K-036 Pencil design; PM does a side-by-side comparison with Pencil `get_screenshot` before closing. Known Gap: mobile Safari iOS / Android Chrome real devices are not verified in this ticket.

For full Given/When/Then/And, see [K-037](docs/tickets/K-037-favicon-wiring.md).

---

<!-- K-024 closed 2026-04-22 → see §4 Closed Tickets -->

---

### K-025 — NavBar hex → token migration + navbar.spec.ts update

- **Status:** backlog / type: refactor
- **Ticket:** [docs/tickets/K-025-navbar-hex-to-token.md](docs/tickets/K-025-navbar-hex-to-token.md)
- **Summary:** UnifiedNavBar 6 occurrences of `text-[#9C4A3B]` hex → `text-brick-dark` token; navbar.spec.ts 8 regex occurrences changed to `[aria-current="page"]`; add 4 `/` inactive color assertions (TD-K021-09).

**AC:**

#### AC-025-NAVBAR-TOKEN: zero hex in NavBar

- **Given** developer greps `UnifiedNavBar.tsx`
- **When** searching for `#[0-9A-Fa-f]{6}` pattern
- **Then** result count = 0
- **And** all color / border / background classes are K-021 tokens

#### AC-025-NAVBAR-SPEC: existing assertion semantics not downgraded

- **Given** the 8 existing regexes in `navbar.spec.ts` are changed to token / aria-current selector
- **When** running `npx playwright test navbar.spec.ts`
- **Then** all existing test cases pass (K-005 AC-NAV-1~5 + K-021 AC-021-NAVBAR)
- **And** active-state assertions use the `[aria-current="page"]` selector
- **And** add 4 `/` route inactive color assertions (App / Diary / About / Prediction-hidden), addressing TD-K021-09

#### AC-025-REGRESSION

See [K-025](docs/tickets/K-025-navbar-hex-to-token.md): K-021 + K-005 + other page E2E no regression.

---

<!-- K-029 closed 2026-04-22 → see §4 Closed Tickets -->
<!-- K-030 closed 2026-04-21 → see §4 Closed Tickets -->
<!-- K-031 closed 2026-04-21 → see §4 Closed Tickets -->

---

### K-034 — /about spec audit + sitewide design-workflow codification (BFP Round 2 for K-035 α-premise failure)

- **Status:** open / phase: 0 / type: fix + process / priority: high / **visual-delta: yes**
- **Ticket:** [docs/tickets/K-034-about-spec-audit-and-workflow-codification.md](docs/tickets/K-034-about-spec-audit-and-workflow-codification.md)
- **Summary:** K-035 variant Footer's Option α "Pencil fidelity 10/10" premise is false — Pencil MCP `batch_get` on frames `86psQ` + `1BGtd` shows both frames contain identical inline one-liners (`yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn` Geist Mono 11px); Pencil SSOT has only one footer design. K-034 Phase 0 runs BFP Round 2 (6 roles + meta retrospective), codifies the new `.pen` SSOT via JSON snapshot workflow (17 decisions covering Designer/Engineer/Reviewer/Architect/PM/QA personas + 9 memory files + `frontend/design/specs/` + `frontend/design/screenshots/` + `design-exemptions.md`); Phase 1 hotfixes /about footer to the Pencil-compliant inline version, removing the `variant: 'about'` CTA branch; Phase 2+ runs full-page /about Pencil JSON drift audit. K-036 is blocked by K-034.

**AC overview:**

- **Phase 0 (BFP Round 2 + workflow codify):** AC-034-P0-PRD, AC-034-P0-QA, AC-034-P0-RETROS, AC-034-P0-PERSONAS, AC-034-P0-MEMORY, AC-034-P0-INFRA, AC-034-P0-COMMITS
- **Phase 1 (/about footer hotfix):** AC-034-P1-FOOTER-UNIFIED, AC-034-P1-ROUTE-DOM-PARITY, AC-034-P1-NO-ABOUT-CTA, AC-034-P1-NO-FOOTER-ROUTES, AC-034-P1-FAIL-IF-GATE-REMOVED, AC-034-P1-DEPLOY
- **Phase 2+ (/about full-page audit):** AC-034-P2-AUDIT-DUMP, AC-034-P2-DRIFT-LIST (expanded after Phase 1 closes)

For full Given/When/Then/And + 17-decision table + BFP Round-2 Why, see [K-034](docs/tickets/K-034-about-spec-audit-and-workflow-codification.md).

---

## §4 Closed Tickets

The following 16 closed + 2 superseded tickets reference AC details from corresponding `docs/tickets/*.md`. `closed` dates follow ticket frontmatter; entries without registered dates use `[Closed 2026-04, date TBD]` as placeholder.

### K-001 — Backend test reinforcement (main.py route handler coverage uplift)

- **Status:** closed / type: test / **Closed: [Closed 2026-04, date TBD]**
- **Ticket:** [docs/tickets/K-001-backend-test-coverage.md](docs/tickets/K-001-backend-test-coverage.md)
- **Summary:** main.py coverage 45% → ≥ 80%; complete happy-path + error-path tests for auth / history-info / upload-history / example / parse / merge routes.

**AC:**

- **AC-TEST-AUTH-3** — valid token `GET /api/business-logic` returns 200 + markdown content (use `tmp_path` to create temporary md)
- **AC-TEST-AUTH-5** — `business_logic.md` does not exist → 404
- **AC-TEST-HISTORY-INFO-1** — `GET /api/history-info` returns `1H`/`1D` each containing `bar_count`/`latest`/`filename`
- **AC-TEST-UPLOAD-1** — `POST /api/upload-history` 1H CSV happy path → `timeframe=1H`, `added_count>0`
- **AC-TEST-UPLOAD-2** — filename containing `_d.csv` → `timeframe=1D`
- **AC-TEST-UPLOAD-3** — empty file → 422
- **AC-TEST-UPLOAD-4** — duplicate upload → `added_count=0`
- **AC-TEST-EXAMPLE-1** — history CSV does not exist → 404
- **AC-TEST-PARSE-1~3** — CryptoDataDownload / Binance raw API / empty string parse behavior is correct
- **AC-TEST-MERGE-1** — `_merge_bars` deduplicates and sorts

---

### K-002 — UI optimization (icons, layout, loading animation)

- **Status:** closed / type: feat / **Closed: 2026-04-18**
- **Ticket:** [docs/tickets/K-002-ui-optimization.md](docs/tickets/K-002-ui-optimization.md)
- **Summary:** UI refactor — NavBar link completeness, Icon Library introduction, layout, LoadingSpinner revamp.

**AC:**

- **AC-002-NAV** — NavBar link completeness
- **AC-002-ICON** — Icon Library introduction: NavBar ⌂ / PredictButton ▶ / SectionHeader switched to icon library version; no aliasing
- **AC-002-LAYOUT** — section padding/gap consistent, four-level typography distinguishable; no overflow on mobile viewport
- **AC-002-LOADING** — LoadingSpinner upgraded to pulse/skeleton/multi-ring quality animations; disappears immediately on loading completion

> The LoadingSpinner copy portion is superseded by K-011 (see K-002 spec header note pending K-016).

---

### K-003 — Frontend bundle splitting (fix chunk > 500kB warning)

- **Status:** closed / type: chore / **Closed: 2026-04-17**
- **Ticket:** [docs/tickets/K-003-bundle-split.md](docs/tickets/K-003-bundle-split.md)
- **Summary:** Vite build chunk > 500 kB; split via dynamic import / manualChunks.

**AC:**

- **AC-BUNDLE-1** — build has no chunk > 500kB warning
- **AC-BUNDLE-2** — all existing E2E tests pass

---

### K-004 — /app TopBar Logo click returns Home (superseded by K-030)

- **Status:** superseded / type: feat
- **Ticket:** [docs/tickets/K-004-app-topbar-logo-home-link.md](docs/tickets/K-004-app-topbar-logo-home-link.md)
- **Superseded by:** [K-030](docs/tickets/K-030-app-page-isolation.md) (`/app` becomes a standalone tool page, in-page Home link no longer needed)

---

### K-005 — Unified NavBar — all pages

- **Status:** closed / type: feat / **Closed: [Closed 2026-04, date TBD]**
- **Ticket:** [docs/tickets/K-005-unified-navbar.md](docs/tickets/K-005-unified-navbar.md)
- **Summary:** All pages display `<UnifiedNavBar />`: left ⌂, right App / About / Diary / Logic 🔒; SPA routing; active highlight; Business Logic auth state.

**AC (AC-NAV-1~5):**

- **AC-NAV-1** — all pages display unified NavBar, no layout shift / missing items
- **AC-NAV-2** — ⌂ navigates home (SPA, no full-page reload)
- **AC-NAV-3** — App / About / Diary / Logic navigate to respective routes
- **AC-NAV-4** — current-page active brick-red `#9C4A3B`; others dark-brown 60% black
- **AC-NAV-5** — when not logged in, Logic 🔒 shows lock; clicking navigates to `/business-logic` auth gate

Design reference: `homepage.pen` NavBar — Revised series frame (x=7600).

---

### K-006 — Homepage diary.json backfill 4/1–4/16 missing milestones

- **Status:** closed / type: content / **Closed: [Closed 2026-04, date TBD]**
- **Ticket:** [docs/tickets/K-006-homepage-diary-backfill.md](docs/tickets/K-006-homepage-diary-backfill.md)
- **Summary:** Backfill missing 4/1–4/16 milestones into diary.json; Homepage Dev Diary fully displayed.

**AC:**

- **AC-K006-1** — backfill missing milestones into diary.json (4/1~4/16 daily or per-new-feature entries)
- **AC-K006-2** — E2E no regression (Homepage / Diary related specs all PASS)

---

### K-007 — About page description update

- **Status:** closed / type: content / **Closed: [Closed 2026-04, date TBD]**
- **Ticket:** [docs/tickets/K-007-about-page-description-update.md](docs/tickets/K-007-about-page-description-update.md)
- **Summary:** About page text description draft update; subsequently integrated by K-017 portfolio revamp.

**AC:**

- **AC-K007-1** — About page description aligned with current project status (draft state)

> This ticket's AC is a period draft version; the complete portfolio v2 rewrite is covered by [K-017](docs/tickets/K-017-about-portfolio-enhancement.md).

---

### K-008 — Automated visual report script (Playwright screenshots → HTML)

- **Status:** closed / type: feat / **Closed: 2026-04-18**
- **Ticket:** [docs/tickets/K-008-visual-report.md](docs/tickets/K-008-visual-report.md)
- **Summary:** `frontend/e2e/visual-report.ts` runs Playwright to screenshot 4 public routes (`/` / `/app` / `/about` / `/diary`) and emit `docs/reports/K-XXX-visual-report.html`; ticket ID is read from the `TICKET_ID` env var. MVP scope reduced to full-page screenshots + known routes; no ticket→page mapping.

**AC:**

#### AC-008-SCRIPT: script is executable

- **Given** QA complete, all Playwright E2E passed
- **When** running `npx playwright test visual-report.ts` in the `frontend/` directory (with ticket ID passed in; Architect decides CLI arg / env var)
- **Then** script executes successfully, exit code 0
- **And** emits `K-XXX-visual-report.html` under `docs/reports/`

#### AC-008-CONTENT: report contains full-page screenshots of all known pages

- **Given** `K-XXX-visual-report.html` has been emitted
- **When** opened in a browser
- **Then** the report contains the "complete set of known page routes" with one full-page screenshot per route
- **And** each screenshot has a corresponding route path label (e.g., `/`, `/app`, `/about`, `/diary`)
- **And** if a route requires login, the report marks "requires login" or screenshots after using the auth fixture (Architect decides)

**Blocking Question ruling (2026-04-18):**
- Execution environment — local dev server `http://localhost:5173` (Vite default), reusing existing Playwright E2E setup
- Page scope — 4 public pages: `/` / `/app` / `/about` / `/diary`; `/business-logic` (JWT) marked "requires login, deferred to next round", no auth fixture
- Ticket ID passing — env var `TICKET_ID=K-008 npx playwright test visual-report.ts`; if unset, default to `UNKNOWN` or exit code 1

---

### K-009 — 1H prediction path used wrong MA history source

- **Status:** closed / type: bug / **Closed: 2026-04-18**
- **Ticket:** [docs/tickets/K-009-1h-ma-history-fix.md](docs/tickets/K-009-1h-ma-history-fix.md)
- **Summary:** `backend/main.py` 1H prediction path called `find_top_matches()` without passing `ma_history`, silently falling back to 1H history as 30-day MA data; fixed by explicitly passing `ma_history=_history_1d`.

**AC:**

- **AC-009-FIX** — when `/api/predict` timeframe=1H, `find_top_matches()` receives `ma_history=_history_1d`; 1H prediction MA99 filter / correlation is based on daily history
- **AC-009-TEST** — a test case exists explicitly verifying that the 1H path's `ma_history` is `_history_1d`; if regressed to old behavior, the test fails
- **AC-009-REGRESSION** — existing 18 + 44 backend tests all pass, no new failures

---

### K-010 — Frontend Vitest fix (AppPage.test.tsx)

- **Status:** closed / type: bug / **Closed: 2026-04-18**
- **Ticket:** [docs/tickets/K-010-vitest-apppage-fix.md](docs/tickets/K-010-vitest-apppage-fix.md)
- **Summary:** `AppPage.test.tsx` carried legacy dual-toggle architecture residue assuming two 1D buttons and that payload always sends 1H; aligned with the post-fb20f21 native timeframe contract.

**AC:**

- **AC-010-GREEN** — Vitest suite all green, exit 0
- **AC-010-ROBUST** — timeframe assertions do not depend on index; locators remain valid even if buttons are added/removed in the future
- **AC-010-REGRESSION** — tsc + Playwright no regression
- **AC-010-R1** — `/api/predict` sends current view timeframe (= `viewTimeframe`, no "always send 1H" hardcoding)
- **AC-010-R2** — timeframe toggle triggers `POST /api/merge-and-compute-ma99` (does not trigger predict); MA99 header + MainChart re-render per new timeframe

---

### K-011 — LoadingSpinner copy neutralization (add label prop)

- **Status:** closed / type: enhancement / **Closed: 2026-04-18**
- **Ticket:** [docs/tickets/K-011-loading-spinner-label.md](docs/tickets/K-011-loading-spinner-label.md)
- **Summary:** Add `label?: string` prop to `LoadingSpinner`; 4 callsites (BusinessLogicPage / DiaryPage / DevDiarySection / PredictButton) get contextualized copy; remove hard-coded `Running prediction…`.

**AC:**

- **AC-011-PROP** — `LoadingSpinner` supports the `label` prop; when not passed, the prediction-specific text `Running prediction...` is not shown
- **AC-011-CALLSITES** — 4 callsites each have a label consistent with their page context
- **AC-011-REGRESSION** — tsc / Vitest / Playwright all green

---

### K-013 — Consensus / Stats Single Source of Truth (TD-008 Option C implementation)

- **Status:** closed / type: refactor / **Closed: 2026-04-21**
- **Ticket:** [docs/tickets/K-013-consensus-stats-contract.md](docs/tickets/K-013-consensus-stats-contract.md)
- **Summary:** Frontend extracts `statsComputation.ts` pure function + backend contract fixture locks compute_stats behavior; TD-008 Option C implementation. R2 remediation adds AC-013-APPPAGE-E2E 4 chart-visibility state spec as regression protection for the bug-found protocol.

**AC (original text preserved):**

#### AC-013-UTIL: frontend extracts shared pure function

- **Given** `frontend/src/utils/statsComputation.ts` is created
- **When** external code calls `computeStatsFromMatches(matches, currentClose, timeframe)`
- **Then** return type equals camelCase mapping of backend `PredictStats`
- **And** the function is pure, no React dependency, no side effects, no implicit `Date.now()`

#### AC-013-APPPAGE: AppPage.tsx displayStats logic simplification

- **Given** `frontend/src/AppPage.tsx`
- **When** reading `displayStats` useMemo
- **Then** `appliedSelection == all matches` → use `appliedData.stats` directly; subset → call `computeStatsFromMatches(...)`
- **And** the original inline `computeDisplayStats` and standalone `projectedFutureBars` useMemo are deleted or merged

#### AC-013-FIXTURE: contract fixture created

- **Given** `backend/tests/fixtures/stats_contract_cases.json` is created
- **When** the file is read
- **Then** content is an array, each entry containing `name` / `input` / `expected`
- **And** at least covers 3 cases: full set, subset, single match boundary (`future_ohlc` == 2 entries)

#### AC-013-BACKEND-CONTRACT: backend contract test passes

- **Given** `backend/tests/test_predictor.py` adds a parametrize test
- **When** running `python3 -m pytest backend/tests/`
- **Then** for each fixture case, `compute_stats(**input)` output is bit-exact or within 1e-6 tolerance vs `expected`

#### AC-013-FRONTEND-CONTRACT: frontend contract test passes

- **Given** `frontend/src/__tests__/statsComputation.test.ts` is added
- **When** running `npm test`
- **Then** for each fixture case, `computeStatsFromMatches(...)` output after camelCase mapping is bit-exact or within 1e-6 tolerance vs `expected`

#### AC-013-APPPAGE-E2E: AppPage chart 4-state visibility Playwright coverage (R2 remediation)

- **Given** AppPage three-path branches (full-set / subset / empty)
- **When** running `playwright test k-013-consensus.spec.ts`
- **Then** 4 cases all green: (1) full-set chart displays; (2) subset chart displays; (3) empty matches chart fallback; (4) `<2 bars` fallback does not break
- **And** consensusForecast in the full-set path maintains unconditional injection (R2 fix `853a8aa` locked)

#### AC-013-REGRESSION / AC-013-API-COMPAT / AC-013-COMMENT

See full ticket [K-013](docs/tickets/K-013-consensus-stats-contract.md).

**Deploy:** 2026-04-21 — details in ticket Deploy Record block (`frontend/public/docs/` unchanged; this ticket is a pure refactor + contract test addition)

---

### K-017 — /about portfolio-oriented recruiter enhancement

- **Status:** closed / type: feat / **Closed: 2026-04-20**
- **Ticket:** [docs/tickets/K-017-about-portfolio-enhancement.md](docs/tickets/K-017-about-portfolio-enhancement.md)
- **Summary:** `/about` redesigned to portfolio 8 sections (Header / Metrics / Roles / Pillars / Tickets / Architecture / Banner / Footer) + 2 artifacts (`scripts/audit-ticket.sh` + `docs/ai-collab-protocols.md`); Homepage `<BuiltByAIBanner />` introduced; Homepage v2 Dossier layout (frame `4CsvQ`) complete layout.

**AC overview (full Given/When/Then/And in ticket):**

- **AC-017-NAVBAR** — `/about` top displays NavBar
- **AC-017-HEADER** — PageHeaderSection's "One operator, orchestrating AI agents end-to-end — PM, architect, engineer, reviewer, QA, designer. Every feature ships with a doc trail."
- **AC-017-METRICS** — 4 narrative metrics: Features Shipped / First-pass Review Rate / Post-mortems Written / Guardrails in Place, each with corresponding subtext; absolute `N%` numbers prohibited
- **AC-017-ROLES** — 6 role cards (PM / Architect / Engineer / Reviewer / QA / Designer) each with `Owns` + `Artefact` (18 assertions)
- **AC-017-PILLARS** — How AI Stays Reliable three pillars Persistent Memory / Structured Reflection / Role Agents + three italic anchor quotes + three inline links to `/docs/ai-collab-protocols.md`
- **AC-017-TICKETS** — Anatomy of a Ticket three cards K-002 / K-008 / K-009 (ID / title / outcome / learning / external GitHub link)
- **AC-017-ARCH** — Project Architecture snapshot three sub-sections: `Monorepo, contract-first` / `Docs-driven tickets` / `Three-layer testing pyramid`
- **AC-017-BANNER** — Homepage `<BuiltByAIBanner />` "One operator. Six AI agents. Every ticket leaves a doc trail. *See how →*" (thin banner, below NavBar / above Hero; clickable, navigates to `/about`)
- **AC-017-FOOTER** — `/about` `<FooterCtaSection />` (Let's talk + email / GitHub / LinkedIn three target=_blank); `/` `<HomeFooterBar />` plain text; `/diary` no Footer
- **AC-017-AUDIT** — `scripts/audit-ticket.sh` is executable and outputs A–G checklist (K-002 skips F/G; K-008 includes F/G; K-999 → exit 2)
- **AC-017-PROTOCOLS** — `docs/ai-collab-protocols.md` three sections: Role Flow / Bug Found Protocol / Per-role Retrospective Log, English-written, with 2–3 curated retrospective excerpts
- **AC-017-HOME-V2** — Homepage `4CsvQ` v2 layout: hpHero / hpLogic / hpDiary three sections + BuiltByAIBanner + FooterCtaSection; does not break AC-HOME-1
- **AC-017-BUILD** — `docs/ai-collab-protocols.md` build-time sync to `frontend/public/docs/`

---

### K-021 — Sitewide design system foundation (palette + fonts + NavBar + Footer)

- **Status:** closed / type: feat / **Closed: 2026-04-20**
- **Ticket:** [docs/tickets/K-021-sitewide-design-system.md](docs/tickets/K-021-sitewide-design-system.md)
- **Summary:** After K-017, comparing with design v2 found that 3 sitewide pages had inverted color scheme (beige vs dark-mode) + missing font system; delivered Tailwind tokens (paper palette 6 colors) + three-font system + NavBar + Footer shared components as prerequisites for K-022 / K-023 / K-024.

**AC:**

- **AC-021-TOKEN** — Tailwind theme.extend.colors registers paper `#F4EFE5` / ink `#1A1814` / brick `#B43A2C` / brick-dark `#9C4A3B` / charcoal `#2A2520` / muted `#6B5F4E`; tsc exit 0, build succeeds
- **AC-021-FONTS** — load Bodoni Moda / Newsreader / Geist Mono; theme.extend.fontFamily registers `display` / `italic` / `mono`; load failure falls back to system fonts
- **AC-021-BODY-PAPER** — sitewide 5 pages (`/` / `/about` / `/diary` / `/app` / `/business-logic`) body computed `backgroundColor` `rgb(244, 239, 229)` + `color` `rgb(26, 24, 20)`; `/business-logic` additionally covers PasswordForm pre-login + post-login UI states (6 tests total, 5 route independent assertions cannot be merged)
- **AC-021-NAVBAR** — NavBar `bg-paper` + `text-ink`; item order ⌂ / App / Diary / Prediction(hidden) / About; active = `text-brick-dark` (brick reserved for K-023 Hero magenta); 4 routes independent test cases; Prediction `toHaveCount(0)`
- **AC-021-FOOTER** — `/` / `/app` / `/business-logic` show `<HomeFooterBar />` single-line `email · github · LinkedIn`; Geist Mono 11px, `#6B5F4E`, top border; 3 routes independent test cases; `/about` retains `<FooterCtaSection />`; `/diary` decided by K-024
- **AC-021-REGRESSION** — K-017 + K-005 all Playwright assertions still PASS; tsc exit 0

> K-030 subsequently excludes `/app` from following AC-021-BODY-PAPER + AC-021-FOOTER; the corresponding `/app` case in sitewide-body-paper.spec.ts must be updated or deleted by K-030.

---

### K-022 — /about structure detail alignment to design v2 (12 items)

- **Status:** closed / type: feat / **Closed: [Closed 2026-04, date TBD]**
- **Ticket:** [docs/tickets/K-022-about-structure-v2.md](docs/tickets/K-022-about-structure-v2.md)
- **Summary:** After K-017 copy is finalized, align `/about` structure details (section label / dossier header / redaction bar / annotation / LAYER label, etc.) 12 items to Pencil frame `35VCj`; copy unchanged. Depends on K-021 tokens + three fonts.

**AC:**

- **AC-022-SECTION-LABEL** — each section has a Geist Mono small-caps label + 1px hairline above (6 sections)
- **AC-022-DOSSIER-HEADER** — top of page has dossier header bar `bg-charcoal` + white text + `FILE Nº` number
- **AC-022-HERO-TWO-LINE** — main sentence Bodoni Moda display; trailing `Every feature ships with a doc trail.` Newsreader italic on its own line
- **AC-022-SUBTITLE** — Metrics / Roles / Pillars / Tickets / Architecture 5 sections each contain Newsreader italic subtitle
- **AC-022-REDACTION-BAR** — Metrics or Roles has at least one black rectangle redaction bar visually masking a field
- **AC-022-OWNS-ARTEFACT-LABEL** — Role Cards `OWNS` / `ARTEFACT` label Geist Mono small-caps 10-11px `text-muted` (6×2=12 assertions)
- **AC-022-LINK-STYLE** — in-page link Newsreader italic + underline
- **AC-022-CASE-FILE-HEADER** — Anatomy of a Ticket section label is `CASE FILE` (Geist Mono small-caps)
- **AC-022-LAYER-LABEL** — How AI Stays Reliable three pillars each contain `LAYER 1` / `LAYER 2` / `LAYER 3` prefix
- **AC-022-FOOTER-REGRESSION** — `/about` `<FooterCtaSection />` is not visually broken under beige body; AC-017-FOOTER assertions still PASS
- **AC-022-ANNOTATION** — at least one Role Card contains `BEHAVIOUR` / `POSITION` Geist Mono annotation (9-10px `text-muted`)
- **AC-022-ROLE-GRID-HEIGHT** — Role Cards 3×2 grid height error ≤ 2px
- **AC-022-REGRESSION** — K-017 all Playwright assertions still PASS; tsc exit 0

---

### K-023 — Homepage structure detail alignment to design v2 (5 items)

- **Status:** closed / type: feat / **Closed: 2026-04-21**
- **Ticket:** [docs/tickets/K-023-homepage-structure-v2.md](docs/tickets/K-023-homepage-structure-v2.md)
- **Summary:** Homepage v2 (frame `4CsvQ`) 5 structural differences: Diary bullet marker / hpLogic Step header bar / Hero divider / Body padding. B-2 left arrow withdrawn (implementation already correct); A-4 Hero subtitle two-line removed from scope in SQ-023-02. Depends on K-021 tokens + three fonts.

**AC:**

- **AC-023-DIARY-BULLET** — each Homepage Diary `<DiaryTimelineEntry>` has a left rectangular marker 20×14px `#9C4A3B`
- **AC-023-STEP-HEADER-BAR** — each hpLogic Step card has a top `#2A2520` bar + white text `STEP 0X · <LABEL>` Geist Mono 10px
- **AC-023-HERO-HAIRLINE** — full-width 1px `#2A2520` horizontal divider below Hero subtitle
- **AC-023-BODY-PADDING** — main content container desktop padding `72px 96px`; mobile responsive (defined by Architect)
- **AC-023-REGRESSION** — all K-017 ACs (especially AC-017-HOME-V2 / AC-017-BANNER / AC-HOME-1) still PASS; `<DiaryTimelineEntry>` absolute positioning mechanism not broken; tsc exit 0

> AC-023-HERO-SUBTITLE-TWO-LINE was originally item A-4; per PM ruling SQ-023-02 removed from scope (KG-023-01 formally closed).

---

### K-024 — /diary structure rebuild + diary.json schema flattening

- **Status:** closed / type: feat / **Closed: 2026-04-22**
- **Ticket:** [docs/tickets/K-024-diary-structure-and-schema.md](docs/tickets/K-024-diary-structure-and-schema.md)
- **Summary:** `/diary` redesigned to v2 (`wiDSi`) flat timeline; diary.json flat schema; English-only; Homepage 3 entries / Diary page 5 + Load more; PM persona daily update process text synced; visual-spec.json SSOT mechanism established.

**AC:**

- **AC-024-SCHEMA** — flat array `{ ticketId?, title, date, text }`.
- **AC-024-ENGLISH** — no CJK in any entry.
- **AC-024-LEGACY-MERGE** — at most 1 legacy entry without ticketId (Option B amend — registered as `chore` fallback aggregate, date falls on the latest entry of that batch).
- **AC-024-HOMEPAGE-CURATION** — Homepage shows latest 3 entries (0-entries scenario: retain `DEV DIARY` heading per K-028 Sacred, do not render rail / marker).
- **AC-024-DIARY-PAGE-CURATION** — `/diary` initial 5 entries + `useDiaryPagination` button/scroll load more; concurrency gate protected via `useRef`.
- **AC-024-TIMELINE-STRUCTURE** — no accordion; left-side rail + brick-red rectangular marker, sizes/colors per `docs/designs/K-024-visual-spec.json` wiDSi role.
- **AC-024-ENTRY-LAYOUT** — entry-title / entry-date / entry-body font/size/letterSpacing/line-height/color per visual-spec role (Playwright assertions import JSON); when `ticketId` exists, title is in `K-XXX — <title>` em-dash (U+2014) format; middle-dot or hyphen not allowed.
- **AC-024-PAGE-HERO** — large heading `Dev Diary` (hero-title role) + 1px divider + italic subtitle `Each entry records a milestone, a decision, or a lesson that shaped the system. Filed chronologically, latest first.` (hero-subtitle role).
- **AC-024-CONTENT-WIDTH** — desktop maxWidth 1248px; mobile rail/marker visible (K-041 overrides K-024 §6.8 design-removed intent, reverted by user decision); DiaryRail + DiaryMarker components must support `mobileVisible` prop so `/diary` and Homepage share the same component (eliminating K-024 Phase 3 dual render-path split); entry three-layer text mobile retains `pl-[92px]` indent so marker aligns visually with rail.
- **AC-024-LOADING-ERROR-PRESERVED** — Loading / Error UX retained; button disabled during refetch + error message preserved.
- **AC-024-PM-PERSONA-SYNC** — PM persona's "effective after K-023 launch" string updated to "effective after K-024 launch" when this ticket is closed (audit-personas synced earlier, DoD check grep already `[x]`).
- **AC-024-REGRESSION** — K-017 + K-021 + K-023 + K-028 all Sacred assertions (NavBar / body paper palette / three fonts / Homepage marker `borderRadius:0`+`top:8` / DevDiary heading + 3-marker + 0-entry `diary-entry-wrapper`) all green; QA Phase 3 sign-off PASS.

---

### K-026 — AppPage subcomponent paper palette migration (superseded by K-030)

- **Status:** superseded / type: refactor
- **Ticket:** [docs/tickets/K-026-apppage-subcomponents-paper-palette.md](docs/tickets/K-026-apppage-subcomponents-paper-palette.md)
- **Superseded by:** [K-030](docs/tickets/K-030-app-page-isolation.md) (K-030 repositions `/app` as a standalone tool page, will redo AppPage palette and structure; K-026's "align to paper palette" premise no longer holds)

**Context:** When K-026 was opened on 2026-04-20, the premise was "`/app` belongs to the marketing site"; user feedback on 2026-04-21 broke that premise. The original AC-026-APPPAGE-PAPER / AC-026-APPPAGE-VISUAL / AC-026-REGRESSION no longer apply.

---

### K-027 — DiaryPage mobile milestone timeline visual overlap fix

- **Status:** closed / type: bug / **Closed: 2026-04-21**
- **Ticket:** [docs/tickets/K-027-mobile-diary-layout-fix.md](docs/tickets/K-027-mobile-diary-layout-fix.md)
- **Summary:** `/diary` mobile (375 / 390 / 414) adjacent milestone card visual overlap fix; container `overflow-hidden` prevents long-string horizontal overflow + text uses `break-words` / `flex-col` for full wrapping.

**AC:**

- **AC-027-NO-OVERLAP** — under 3 mobile viewports, one round each in collapsed and fully-expanded states, adjacent milestone bounding-box y-ranges fully non-overlapping; the last card is fully visible; 3 independent test cases
- **AC-027-TEXT-READABLE** — title / date / text fully displayed, no `text-overflow: ellipsis` truncation, readable text contrast + font-size ≥ 12px at 375px; 3 independent test cases
- **AC-027-DESKTOP-NO-REGRESSION** — desktop 1024 / 1280 / 1440 viewports visually consistent with K-021-closed visual-report; existing diary spec full regression passes (desktop baseline 1 case + existing diary-related full regression)

**Test case total minimum: 7 new + existing regression.**

---

### K-029 — /about Architecture + Ticket Anatomy cards body-text palette migration

- **Status:** closed / type: fix / **Closed: 2026-04-22**
- **Ticket:** [docs/tickets/K-029-about-card-body-text-palette.md](docs/tickets/K-029-about-card-body-text-palette.md)
- **Summary:** `/about` Architecture + Ticket Anatomy two sections' `ArchPillarBlock` / `TicketAnatomyCard` had dark-theme `text-gray-300/400/500` + `text-purple-400` missed during K-022 A-12 migration → migrate to K-021 paper palette (body = `text-muted`; testing pyramid layer span = `text-ink`; ticket ID badge = `text-charcoal`; pyramid `<li>` detail pinned to `text-muted` to prevent hierarchy inversion). At Architect Pre-check BQ, PM ruled directly on the three token choices based on architecture.md Design System tokens + WCAG AA contrast calculation.

**AC (original text preserved):**

#### AC-029-ARCH-BODY-TEXT: Architecture section card body text uses paper palette tokens

- **Given** user visits `/about`
- **When** scrolling to the Project Architecture section (Nº 05)
- **Then** the three ArchPillarBlock body text computed `color` ∈ {`rgb(26, 24, 20)`, `rgb(42, 37, 32)`, `rgb(107, 95, 78)`} (all three must hit)
- **And** body text must not be `rgb(209, 213, 219)` / `rgb(156, 163, 175)` / `rgb(107, 114, 128)`
- **And** testing pyramid `<li>` detail pinned = `rgb(107, 95, 78)` (text-muted; no allow-list to prevent hierarchy collapse)
- **And** testing pyramid layer label span (Unit / Integration / E2E) = `rgb(26, 24, 20)` (text-ink)
- **And** Playwright assertions: 3 pillar + 3 pyramid li + 3 layer span = **9 independent assertions**

#### AC-029-TICKET-BODY-TEXT: Ticket Anatomy section card body text uses paper palette tokens

- **Given** user visits `/about`
- **When** scrolling to the Anatomy of a Ticket section (Nº 04)
- **Then** the three TicketAnatomyCard Outcome / Learning content computed `color` ∈ allow-list (all three must hit) + must not be gray-400/500
- **And** Outcome / Learning label (mono span) computed `color` ∈ allow-list, hitting individually for all three cards, must not be gray-500
- **And** ticket ID badge (`K-002` / `K-008` / `K-009`) = `rgb(42, 37, 32)` (text-charcoal), must not be `rgb(196, 181, 253)` (purple-400)
- **And** Playwright assertions: 3 body + 3 badge + 6 label = **12 independent assertions**

#### AC-029-REGRESSION: K-022 existing assertions no regression

See [K-029](docs/tickets/K-029-about-card-body-text-palette.md): K-022 + K-017 all assertions still PASS + tsc exit 0.

**Known Gap:** KG-029-01 (Playwright selector path prescribed by Architect design doc as 4 data-testid; Engineer follows; QA verifies compliance).

**Tech Debt:** TD-K029-01 (`about-v2.spec.ts` L474 / L487 Outcome / Learning label selector uses `hasText`; label copy currently safely locked, but future data flexibility may mismatch onto sibling `<p>`; low priority, the next ticket that touches TicketAnatomyCard or migrates label to data-driven schema migrates to testid).

**Test case total: 21 new Playwright assertions (9 + 12) + existing about-v2.spec.ts / about.spec.ts regression; full suite 197 pass / 1 skip / 0 fail.**

---

### K-028 — Homepage visual fix (section spacing + DevDiarySection entry height adaptive)

- **Status:** closed / type: fix / **Closed: 2026-04-21**
- **Ticket:** [docs/tickets/K-028-homepage-visual-fix.md](docs/tickets/K-028-homepage-visual-fix.md)
- **Summary:** Homepage section spacing reinforced (desktop gap 72 / mobile gap 24); DevDiarySection switched from absolute `ENTRY_HEIGHT=140` to flex-col flow layout; entry height adapts.

**AC (original text preserved):**

#### AC-028-SECTION-SPACING: Homepage sections have appropriate vertical spacing

- **Given** user visits `/`
- **When** page load completes (desktop 1280 / mobile 375 / tablet 640 / tablet 639)
- **Then** HeroSection / ProjectLogicSection / DevDiarySection three adjacent gaps ≥ design values (desktop 72px, mobile 24px)
- **And** Playwright bounding-box gap assertions align with frame `4CsvQ` extracted values

#### AC-028-DIARY-ENTRY-NO-OVERLAP: DevDiarySection entries render without overlap

- **Given** diary.json has ≥ 3 milestones and includes long-text entries
- **When** page scrolls to Diary section
- **Then** adjacent entry bounding boxes do not overlap (`bottom[N] <= top[N+1]` ±2px)
- **And** vertical rail visually spans through (rail is inside diary-entries container + width=1 + height>0)
- **And** 375px mobile viewport similarly has no overlap

#### AC-028-DIARY-EMPTY-BOUNDARY: 0-entry / 1-entry boundary does not break

- **Given** diary.json has 0 or 1 milestone entries
- **When** page loads
- **Then** 0-entry: rail does not exist or height=0; 1-entry: entry renders and marker exists

#### AC-028-DIARY-RAIL-VISIBLE: rail visible and aligned with container

- **Given** ≥ 2 entries
- **When** page loads
- **Then** `data-testid="diary-rail"` is inside `data-testid="diary-entries"` bbox + width=1 + height>0

#### AC-028-REGRESSION: K-023 assertions no regression + marker coord / count integrity

- marker / STEP header / body padding / tsc all pass
- MARKER-COORD-INTEGRITY: marker width=20 height=14 bg=#9C4A3B
- MARKER-COUNT-INTEGRITY: marker count = flattened milestone count of diary.json

**Known Gap:** KG-028-01 (40+ char long-word overflow, mitigated with `break-words`) / KG-028-02 (HomeFooterBar scrollHeight not independently asserted, engineering judgment + QA manual test cover).

**Tech Debt:** TD-028-A (marker x-center alignment assertion, P3) / TD-028-B (1-entry rail collapse height assertion, P3) / TD-028-C (KG-028-02 wording precision, P2 — fixed before this ticket close).

**Deploy:** 2026-04-21 20:28 UTC+8 — commits `2d30672` (src) + `e162bb5` (docs) → `https://k-line-prediction-app.web.app`

---

### K-030 — /app page isolation（new tab + no NavBar/Footer + background restore）

- **Status:** closed / type: fix / **Closed: 2026-04-21**
- **Ticket:** [docs/tickets/K-030-app-page-isolation.md](docs/tickets/K-030-app-page-isolation.md)
- **Summary:** `/app` is treated as a standalone tool page; NavBar's App link + Homepage Hero CTA dual entries both switch to new tab; `/app` page removes NavBar + Footer; background switched to `bg-gray-950` (`rgb(3, 7, 18) = #030712`, aligned with Pencil v1 `ap001.fill`). Supersedes K-026 + K-004 (scope already merged into this ticket).

**AC:**

#### AC-030-NEW-TAB: "App" link opens /app in a new tab

- **Given** user is on any page containing UnifiedNavBar (`/`, `/about`, `/diary`, `/business-logic`)
- **When** clicking the NavBar App link
- **Then** browser opens `/app` in a new tab (original tab unchanged)
- **And** new tab successfully loads `/app` (no 404 / redirect)
- **And** the `<a>` element contains `target="_blank"` and `rel="noopener noreferrer"`

#### AC-030-NO-NAVBAR: /app page has no UnifiedNavBar

- **Given** user visits `/app`
- **When** page load completes
- **Then** `[data-testid="navbar-desktop"]` + `[data-testid="navbar-mobile"]` both `toHaveCount(0)`
- **And** Home / Diary / About / App four link roles do not exist
- **And** `/app` tool content (OHLC input / Predict button) is visible

#### AC-030-NO-FOOTER: /app page has no HomeFooterBar

- **Given** user visits `/app`
- **When** page load completes
- **Then** `getByRole('contentinfo')` `toHaveCount(0)`
- **And** existing HomeFooterBar signature text (`yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn` and GA disclosure) does not appear
- **And** viewport bottom is tool UI, not marketing footer

#### AC-030-BG-COLOR: /app wrapper bg = gray-950 + body remains paper

- **Given** user visits `/app`
- **When** page load completes
- **Then** the wrapper `<div>` directly under `<div id="root">` has computed `background-color === 'rgb(3, 7, 18)'`
- **And** `<body>` computed `background-color === 'rgb(244, 239, 229)'` (proves wrapper override strategy did not modify body rules)
- **And** no paper bleed-through at top/bottom of viewport

#### AC-030-FUNC-REGRESSION: existing /app functionality not broken

- **Given** K-030 layout changes complete
- **When** user operates OHLC input + Predict button
- **Then** Vitest existing 36/36 pass (AppPage / OHLCEditor / PredictButton / StatsPanel / MatchList)
- **And** Playwright existing 172 passed / 1 skipped / 0 failed
- **And** chart / match list / stats panel have no visual obstruction

#### AC-030-PENCIL-ALIGN: /app implementation aligned with Pencil v1 `ap001` frame

- **Given** Pencil v1 `frontend/design/homepage-v1.pen` contains official `/app` frame `ap001` (fill `#030712`, child `ap002` TopBar fill `#111827`, no NavBar / Footer child nodes)
- **When** K-030 implementation complete
- **Then** wrapper bg = `#030712` (`bg-gray-950`) + TopBar bg = `#111827` (`bg-gray-900`) + NavBar / Footer structurally absent
- **And** QA `mcp__pencil__get_screenshot(ap001)` visual comparison PASS

**Test case total minimum: 6 new ACs + existing Vitest / Playwright regression. 6 new Playwright cases reside in `frontend/e2e/app-bg-isolation.spec.ts`.**

---

### K-031 — Remove /about "Built by AI" showcase section (S7)

- **Status:** closed / type: fix / **Closed: 2026-04-21**
- **Ticket:** [docs/tickets/K-031-remove-built-by-ai-showcase-section.md](docs/tickets/K-031-remove-built-by-ai-showcase-section.md)
- **Summary:** `/about` S7 `BuiltByAIShowcaseSection` entire section removed; homepage `BuiltByAIBanner` unchanged. Architecture.md 3 pre-existing drifts (L13/L140/L410) fixed in same commit.

**AC:**

#### AC-031-SECTION-ABSENT: "Built by AI" section is not present on /about

- **Given** user visits `/about`
- **When** page load completes
- **Then** DOM has no `id="banner-showcase"` element; no "Built by AI" heading; no "The real banner is clickable and navigates to /about" text
- **And** `BuiltByAIShowcaseSection.tsx` file has been deleted from the codebase

#### AC-031-LAYOUT-CONTINUITY: No layout gap between S6 and footer

- **Given** user is on `/about` after S7 removal
- **When** scrolling past the Project Architecture section (Nº 05)
- **Then** `FooterCtaSection` directly follows the architecture section, no visible blank gap
- **And** `SectionContainer id="banner-showcase"` does not exist in DOM
- **And** total page scroll height is shortened (section is deleted, not hidden)

#### AC-031-K022-REGRESSION

See [K-031](docs/tickets/K-031-remove-built-by-ai-showcase-section.md): about-v2.spec.ts AC-022-* + about.spec.ts AC-017-BANNER all green; tsc exit 0.

---

### K-020 — GA4 SPA Pageview E2E + HTTP Beacon Verification

- **Status:** closed / type: test / **Closed: 2026-04-22**
- **Ticket:** [docs/tickets/K-020-ga-spa-pageview-e2e.md](docs/tickets/K-020-ga-spa-pageview-e2e.md)
- **Follow-ups:** [K-032](docs/tickets/K-032-ga-page-location-full-url.md) (page_location value), [K-033](docs/tickets/K-033-ga-spa-beacon-emission-fix.md) (useGAPageview call pattern — T4 tracker)
- **Summary:** Delivered 9 Playwright tests (SPA-NAV × 2, BEACON × 4, NEG × 3); 8 green merged as regression guard, 1 intentionally red (T4 AC-020-BEACON-SPA) kept as K-033 tracker per PM Option A ruling. T4 correctly caught a K-018-class production bug: `useGAPageview` `gtag('event','page_view',…)` under `send_page_view:false` is silently dropped by gtag.js on SPA navigate. Three anti-decay guards landed (spec doc-block, architecture.md Known Gap blockquote, dashboard Active row for K-033). No production runtime code modified. Deploy: N/A (test-only).

**AC (original text preserved):**

#### AC-020-SPA-NAV: SPA Link click triggers dataLayer pageview entry (Phase 1 — PASS)

- **Given** user is on `/` page, `VITE_GA_MEASUREMENT_ID='G-TESTID0000'` (already set in playwright.config.ts), `window.dataLayer` already initialized by production `initGA()`
- **When** user clicks NavBar's `About` Link (not `page.goto('/about')`), triggering React Router SPA navigate
- **Then** Playwright confirms URL switch is complete via `page.waitForURL(/\/about$/)`, and via `waitForFunction` confirms an Arguments-object entry exists in `window.dataLayer` satisfying: entry[0] === 'event' AND entry[1] === 'page_view' AND entry[2].page_location === '/about'
- **And** that entry must be produced after the click action, not confused with the pageview from initial `/` load (the test must record `dataLayer.length` before click, asserting that length strictly increases after click and the new entry points to `/about`)
- **And** no `waitForTimeout` in tests; use `waitForURL` + `waitForFunction` for synchronization
- **And** at least 2 independent Playwright test cases — one covering NavBar Link (`/` → `/about`), the other covering BuiltByAIBanner CTA (`/` → `/about`, different DOM entry); each case independent spec (cannot be merged)

#### AC-020-BEACON-INITIAL: initial page load emits pageview beacon (Phase 2 — PASS)

- **Given** `VITE_GA_MEASUREMENT_ID='G-TESTID0000'`, `page.route('**/g/collect*', ...)` interceptor registered before test starts; the interceptor `route.fulfill({status: 204})` terminates the request and collects `route.request()` into a per-test array
- **When** user `page.goto('/about')` triggers initial pageview
- **Then** the interceptor receives at least 1 `/g/collect` request within 5 second timeout
- **And** the request host must be `www.google-analytics.com` (or `google-analytics.com`)
- **And** test failure must throw (no `test.skip()` or try-catch swallow), making beacon-missing issues immediately visible

#### AC-020-BEACON-SPA: SPA navigate emits a new pageview beacon (Phase 2 — INTENTIONALLY RED, K-033 TRACKER)

- **Given** interceptor is registered and records the beacon list received during initial `/` load as `initialBeacons`
- **When** user clicks NavBar `About` Link, triggering SPA navigate to `/about`
- **Then** after `page.waitForURL(/\/about$/)`, the interceptor receives at least 1 **new** `/g/collect` request within 5 second timeout (`beacons.length > initialBeacons.length`)
- **And** the new request's path key (`dl` or `dp`) after urlDecode must contain `/about`
- **And** at least 1 independent Playwright test case

**Red status rationale:** T4 currently fails because `useGAPageview` dispatches `gtag('event', 'page_view', {…})` while `initGA()` has set `send_page_view: false`; modern GA4 gtag.js silently drops this combo — no `/g/collect` emitted on SPA route change. K-020 Engineer Dry-Run (DR 2026-04-22) confirmed full-URL `page_location` does NOT fix beacon emission; the call pattern itself must change. **Do NOT loosen this assertion to turn it green** — loosening reintroduces the exact K-018-class gap K-020 was designed to close. K-033 will fix by migrating to canonical GA4 SPA pattern; AC-033-BEACON-SPA-GREEN defines green state preserving this assertion verbatim.

#### AC-020-BEACON-PAYLOAD: beacon query string pinned required fields (Phase 2 — PASS)

- **Given** the interceptor has captured one pageview beacon request
- **When** the test reads `request.url()` and parses the query string
- **Then** the query string must contain: `v=2` AND `tid=G-TESTID0000` AND `en=page_view`
- **And** the path key (`dl` per Engineer dry-run DR-2) after urlDecode corresponds to the current route

#### AC-020-BEACON-COUNT: each pageview emits exactly 1 beacon (Phase 2 — PASS)

- **Given** the interceptor is registered and beacon array is cleared
- **When** user completes 1 pageview action (initial load or SPA navigate)
- **Then** within 1 second after the action completes, the interceptor receives exactly 1 `/g/collect` request
- **And** prevents duplicate beacon emission from StrictMode double-invoke or future duplicate call sites (DR-4 confirms gtag.js internally dedupes StrictMode double push)

#### AC-020-NEG-QUERY / NEG-HASH / NEG-SAMEROUTE: behavior locked (Phase 3 — PASS)

- **AC-020-NEG-QUERY:** query-only change (`/?x=1` → `/?x=2`) — interceptor beacon count unchanged after 500ms
- **AC-020-NEG-HASH:** hash-only change (`/about` → `/about#team`) — beacon count unchanged after 500ms
- **AC-020-NEG-SAMEROUTE:** user re-clicks NavBar `About` Link on `/about` — beacon count unchanged after 500ms
- Locks current `[location.pathname]` deps behavior; future change to query/hash sensitivity requires separate ticket + AC change

**PM ruling 2026-04-22 (Option A — split):** Engineer delivered 8/9 pass. T4 root cause is pre-existing `useGAPageview` gtag call pattern (K-018 Engineer responsibility per Bug Found Protocol step 1). T4 retained as red, tracked to K-033. K-020 8 green merged as K-018-class regression guard. Pre-Verdict matrix: A=11/12, B=6/12, C=6/12 (red team 3 challenges all counterable; biggest unresolved risk = K-033 slippage, mitigated by medium priority + dashboard + in-file tracker). Bug Found Protocol 4 steps executed. Reviewer C-1/W-1/W-2/W-3 all fix-now. See ticket for full chain of custody.

---

## §5 Tech Debt

Full registry: [docs/tech-debt.md](docs/tech-debt.md). The following is an index summary (sorted by source + status).

| ID | Item | Source | Priority | Status / linked ticket |
|----|------|--------|----------|------------------------|
| TD-001 | Frontend bundle too large (K-003 main work done, residual monitoring) | K-003 retrospective | low | continuous monitoring |
| TD-002 | Backend test coverage insufficient (K-001 remainder) | K-001 retrospective | medium | continuous reinforcement |
| TD-003 | Upload history concurrency race | 2026-04-18 Codex review P2-A | medium | open — escalate to P1 with multi-worker |
| TD-004 | MatchList PredictorChart effect deps do not include actual candle values | 2026-04-18 Codex review P2-B | medium | open — combine with TD-005 |
| TD-005 | `frontend/src/AppPage.tsx` has too many responsibilities (split hook + sub-sections) | 2026-04-18 Codex review Modularity | medium | open — schedule RFC after TD-008 lands |
| TD-006 | `backend/main.py` mixes wiring / CSV / state / persistence / prediction | 2026-04-18 Codex review Modularity | medium | open — combine with TD-003 in same RFC |
| TD-007 | `backend/predictor.py` module too broad (split ma / similarity / stats) | 2026-04-18 Codex review Modularity | medium | open — schedule after TD-008 |
| TD-008 | Cross-layer duplicate computation (consensus/stats frontend/backend drift) | 2026-04-18 Codex review | high | **→ [K-013](docs/tickets/K-013-consensus-stats-contract.md)** in progress |
| TD-009 | Vitest index-based selector residue | 2026-04-18 K-010 review W1/W2 | low | **→ [K-014](docs/tickets/K-014-vitest-index-selector-cleanup.md)** |
| TD-010 | `predictor.find_top_matches()` `ma_history` silent fallback | 2026-04-18 K-009 review S1 | medium | **→ [K-015](docs/tickets/K-015-find-top-matches-ma-history-required.md)** |
| TD-011 | `homepage.pen` contains stale `Running prediction...` text node | 2026-04-18 K-011 review Drift C | low | open — sync at next Designer touchpoint |
| TD-012 | visual-report `/app` empty-state screenshot has low value | 2026-04-18 K-008 review S1 | low | open — handle at next visual-report revamp |
| TD-013 | GA4 initGA() lacks idempotency guard + dataLayer type + no warn for unknown routes | 2026-04-19 K-018 review S2–S4 | low | open — clean up at next GA ticket |
| TD-K021-01 | Some pages `font-mono` still use Tailwind defaults; not migrated to Geist Mono token | K-021 Engineer retro | low | open — progressive migration in K-022/023/024 |
| TD-K021-02 | UnifiedNavBar 6 hardcoded hex occurrences | K-021 Reviewer W-3 | medium | **→ [K-025](docs/tickets/K-025-navbar-hex-to-token.md)** |
| TD-K021-07 | AppPage `h-screen overflow-hidden` + HomeFooterBar squeeze under <900px viewport | K-021 Reviewer W-1 | low | open — combine at AppPage redesign |
| TD-K021-08 | HomeFooterBar email/github/LinkedIn lack `<a>` anchors | K-021 Reviewer S-1 | low | open — next UI polish |
| TD-K021-09 | `/` route NavBar inactive color not asserted in navbar.spec.ts | K-021 Reviewer S-2 | low | **→ K-025 AC-025-NAVBAR-SPEC** |
| TD-K021-10 | DiaryPage `font-mono` not migrated to Geist Mono token | K-021 Reviewer S-5 | low | open — evaluate at K-024 |
| TD-K021-11 | PasswordForm button retains `bg-purple-600`, not migrated to `bg-brick` | K-021 Reviewer Round 3 S-R3-02 | low | open — combine when PasswordForm is refactored |
| TD-K021-13 | PasswordForm `expiredMessage` `text-yellow-400` contrast ~2.4:1, fails WCAG AA | K-021 Reviewer Round 3 S-NEW-1 | medium | open — sweep during K-022 /about revamp |
| TD-K027-01 | diary-mobile.spec.ts TC-007 only at 1280px; AC-027-DESKTOP-NO-REGRESSION requires 1024/1280/1440px three viewports | K-027 Reviewer I-002 | low | open — backfill at K-024 startup |
| TD-K027-02 | diary-mobile.spec.ts `.px-4.pb-4` locator fragile (breaks after K-024 rewrite) | K-027 Reviewer N-001 | low | open — audit during K-024 Reviewer checklist |
| TD-K027-03 | milestone title overflow attribute not verified (AC-027-TEXT-READABLE has it but spec lacks assertion) | K-027 Reviewer N-003 | low | open — backfill verification when K-024 structure changes |
| TD-K027-04 | `assertLastCardVisible`'s `waitForTimeout(200)` hardcoded sleep | K-027 Reviewer R2 I-R2-01b | low | open — clean up during K-024 diary spec rewrite |
| TD-K022-01 | `fontFamily.italic` naming clashes with `italic` font-style class | K-022 Breadth Review I-2 | low | open — rename at next tailwind.config.ts structural change |
| TD-K022-02 | `SectionLabel` zombie colorMap (purple/cyan/pink/white) retained for backward compatibility | K-022 Breadth Review I-3 | low | open — grep-confirm cleanup after K-030 closed (K-030 closed 2026-04-21, follow-up pending) |
| TD-K030-01 | AppPage interaction regression E2E coverage missing (PredictButton sticky / OHLC edit interactions lack Playwright assertions) | K-030 Code Review I-1 | low | open — backfill at TD-005 AppPage split ticket startup |
| TD-K030-02 | UnifiedNavBar `renderLink` local type alias not changed to `typeof TEXT_LINKS[number]` derivation | K-030 Code Review M-3 | low | open — handle at next NavBar structural change ticket |
| TD-K030-03 | `visual-report.ts` fallback `K-UNKNOWN` when TICKET_ID is missing pollutes `docs/reports/` | K-030 QA retro | medium | open — throw + remove fallback at next visual-report tooling change |
| TD-K030-04 | `frontend/public/diary.json` K-021/K-022/K-023 legacy traditional-Chinese entries violate English-only hard rule | K-030 QA retro | medium | open — translate at next diary-related ticket (K-024 etc.) |

**Update rules:** new tech debt is listed by Code Reviewer → PM rules per item → write to tech-debt.md; when escalated to a ticket, mark `→ K-XXX` in this table; retain record after ticket is closed.
