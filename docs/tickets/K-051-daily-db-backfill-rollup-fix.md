---
id: K-051
title: Daily history DB backfill (2026-03-20 → 2026-04-08) + Cloud Build rollup-linux-x64-musl fix
status: done
closed: 2026-04-26
created: 2026-04-25
type: ops + fix
priority: high
size: small
visual-delta: none
content-delta: none
design-locked: N/A
qa-early-consultation: docs/retrospectives/qa.md 2026-04-26 K-051 Phase 3 Early Consultation (real-QA tier — Phase 3b/3c add runtime backend pytest + Playwright spec; original retroactive N/A scope only covered Phase 1+2 data/Dockerfile; Phase 3 expansion required real-qa spawn per feedback_qa_early_proxy_tier.md; Verdict BLOCK→RELEASE-OK after PM addressed B1-B5 AC tightenings 2026-04-26)
retroactive: true
retroactive-reason: Ops slug (CSV refresh) + Phase A.5 fix-forward (Dockerfile build break) shipped without PM→Architect→Engineer chain; user explicitly requested PRD/ticket backfill after PRs #19/#20 opened to make audit trail complete
dependencies: [K-015 (find_top_matches MA history requirement)]
sacred-regression: [K-015 ma_history requires ≥129 daily bars ending at input date]
worktree: .claude/worktrees/ops-daily-db-backfill (outer) + fix-cloudbuild-rollup-musl branch (inner)
branch: fix-cloudbuild-rollup-musl (inner) / ops-daily-db-backfill (outer)
runtime-commit: pending — see PR #19 (inner #11), PR #20 (inner #12)
related-prs:
  - https://github.com/mshmwr/notes/pull/19 (outer, merged) — daily DB backfill
  - https://github.com/mshmwr/k-line-prediction/pull/11 (inner, merged) — daily DB backfill
  - https://github.com/mshmwr/notes/pull/20 (outer, open) — Dockerfile rollup-musl fix
  - https://github.com/mshmwr/k-line-prediction/pull/12 (inner, open) — Dockerfile rollup-musl fix
---

## Background

User uploaded `ETHUSDT-1h-2026-04-07.csv` (24 1H bars covering 2026-04-07) to the live `/app` upload flow and received:

> Unable to compute 30-day MA99 trend for 2026-04-07: ma_history requires at least 129 daily bars ending at that date.

Diagnosis trace:

1. `history_database/Binance_ETHUSDT_d.csv` — daily K-line history database used by `find_top_matches` to compute MA99 / 30-day trend metadata — last row was `2026-03-27`.
2. To return matches for an input dated `2026-04-07`, the engine needs ≥129 trailing daily bars **ending at the input date** (per K-015 invariant). Coverage gap: 2026-03-20, 2026-03-21, 2026-03-22, 2026-03-25, and the contiguous run 2026-03-28 → 2026-04-08 (16 missing days within Binance's available window at fetch time).
3. Without those daily bars, `find_top_matches` raises `ValueError`, surfaced to the user as the message above.

**Approach pivot.** First considered: change backend logic to auto-aggregate the user-provided 1H CSV into a synthetic daily bar to fill the MA history. User explicitly redirected:

> 我其實想要叫你自己去網站抓資料

→ One-shot manual fetch from Binance API; refresh `Binance_ETHUSDT_d.csv` so the existing logic works unchanged. No schema change, no aggregation code path added, no new endpoints.

**Secondary failure (Phase A.5 fix-forward).** After the data backfill PR merged and Cloud Run redeploy was triggered, the build failed twice with:

```
Error: Cannot find module @rollup/rollup-linux-x64-musl
```

Root cause: npm bug [#4828](https://github.com/npm/cli/issues/4828) — `package-lock.json` generated on macOS lists `@rollup/rollup-darwin-arm64` as the only platform-specific rollup binary; `node:20-alpine` (Linux x64 musl) container build cannot resolve it. `npm ci` enforces the lockfile literally, so it never falls back to fetching the missing musl binary. Workaround: extra explicit install step in the Dockerfile post-`npm ci` to pull the musl variant.

## Acceptance Criteria

### AC-051-01 — User-visible: 1H upload for 2026-04-07 returns matches

- **Given** the live frontend `https://k-line-prediction-app.web.app/app` is deployed against the post-K-051 backend
- **When** the user uploads `ETHUSDT-1h-2026-04-07.csv` (24 1H bars, the original CSV that triggered the bug)
- **Then** the backend `/api/predict` endpoint returns HTTP 200 with a non-empty `matches[]` array
- **And** the previously-blocking error message `ma_history requires at least 129 daily bars ending at that date` does NOT appear
- **And** the smoke-tested response shape (10 matches, top correlation ≈ 0.87 on local backend) is reproduced on the deployed environment within tolerance

### AC-051-02 — Daily history DB covers through 2026-04-08

- **Given** `history_database/Binance_ETHUSDT_d.csv` after Phase 1 commit
- **When** the file is read line-count and tail-inspected
- **Then** the file contains at least 3157 data rows (3141 pre-backfill + 16 newly appended daily bars)
- **And** the final row's date column equals `2026-04-08`
- **And** the appended rows for 2026-03-20 through 2026-04-08 (excluding any Binance-side gaps) are sourced from Binance public klines API at 1d interval
- **And** the column schema (date, open, high, low, close, volume, etc.) of appended rows matches every preceding row byte-for-byte

### AC-051-03 — Cloud Build produces a working frontend bundle on linux/amd64

- **Given** the inner repo Dockerfile after Phase 2 commit
- **When** Cloud Build executes `docker build` for the `linux/amd64` platform (Cloud Run's deploy target)
- **Then** the build completes with exit 0
- **And** the build log does NOT contain `Cannot find module @rollup/rollup-linux-x64-musl`
- **And** the resulting image, when run as the Cloud Run service, serves the production frontend bundle without rollup-related runtime errors

### AC-051-04 — Dockerfile change is minimal and surgical

- **Given** the Dockerfile diff between pre-K-051 and post-K-051 commits
- **When** the diff is reviewed
- **Then** exactly one logical line is changed: `RUN npm ci` → `RUN npm ci && npm install --no-save @rollup/rollup-linux-x64-musl@4.60.1`
- **And** no other Dockerfile instruction (FROM / COPY / WORKDIR / EXPOSE / CMD / ENTRYPOINT) is altered
- **And** the explicit `4.60.1` version pin matches the rollup version transitively required by the project's `package-lock.json` so the post-install version is deterministic

### AC-051-05 — Local pre-merge dry-run reproduces the build green

- **Given** the Phase 2 Dockerfile change
- **When** the developer runs `docker build --platform linux/amd64 -f Dockerfile .` from the K-Line-Prediction repo root
- **Then** the local build completes with exit 0 (matches the post-K-049 Deploy Checklist Step 0 mandatory local docker dry-run gate)
- **And** the PR #20 description includes the `✅ local docker build dry-run pass` line per the gate's Reviewer Step 2 requirement

### AC-051-06 — Worktree hydration drift policy codified (Phase 3, scope-revised 2026-04-26)

- **Given** the user ruling 2026-04-26 reverting the fix-after-merge classification of TD-K051-02/03/04/05 back into K-051's own scope (rationale: regression coverage for the bug class K-051 fixed is K-051's own deliverable, not a follow-up ticket)
- **When** the K-051 commit set is reviewed
- **Then** `ClaudeCodeProject/K-Line-Prediction/CLAUDE.md` contains a new `### Worktree Hydration Drift Policy` subsection under §Worktree Isolation describing the canonical-revalidate protocol
- **And** `~/.claude/agents/qa.md` (mirrored at `claude-config/agents/qa.md` for repo tracking) contains a new `## Worktree Hydration Drift Handling` section before §Test Scope codifying the same protocol from QA persona angle
- **And** both files cite the K-051 2026-04-26 retroactive root cause (`rollup-linux-x64-gnu` missing + `ETHUSDT_1h_test.csv` missing — both canonical-clean)

### AC-051-07 — Backend pytest contiguity gap detector (B1-tightened 2026-04-26)

- **Given** `history_database/Binance_ETHUSDT_d.csv` is the canonical daily DB read by `find_top_matches` (rows are descending-ordered, newest-first, ISO `YYYY-MM-DD` date column at index 1, no time component, UTC-anchored)
- **When** `pytest backend/tests/test_history_db_contiguity.py` runs in canonical (`ClaudeCodeProject/K-Line-Prediction/`)
- **Then** the test parses the date column with `datetime.strptime(row[1], "%Y-%m-%d")`, sorts ascending, and walks consecutive pairs asserting `(d2 - d1).days == 1` for every pair (no gap, no duplicate, no zigzag)
- **And** the test asserts row dates are strictly monotonic (no duplicate-date drift slips through with `delta == 0`; no ascending-then-descending zigzag — explicit B1 coverage of two failure modes a naive "gap > 1" check passes silently on)
- **And** the test asserts a freshness floor: `last_row.date >= TODAY - 7 days` (matches K-048 auto-scraper SLA — without this, AC-051-07 is a contiguity guard but NOT a freshness guard, and freshness was the K-051 root cause; future shrink that drops only the head still passes contiguity but loses 1H upload window space)
- **And** the test loads the actual `history_database/Binance_ETHUSDT_d.csv` (not a synthetic fixture), so a future drift like the 2026-03-20 → 2026-04-08 gap would fail loud the moment a new gap appears
- **And** the test is wired into the project pytest suite so CI reruns it on every backend change

### AC-051-08 — Backend integration test loading real DB + real 24-bar 1H CSV (B2/B3-tightened 2026-04-26)

- **Given** the real `history_database/Binance_ETHUSDT_d.csv` (post-K-051 backfill, **read live not pinned** per PM ruling B2 — see User Ruling 2026-04-26 below; reproducibility is sacrificed deliberately so a future DB shrink fails this test rather than hides behind a frozen fixture; AC-051-07 contiguity layer catches the shrink shape, AC-051-08 catches the user-visible failure shape) and a committed real 24-bar 1H CSV at `backend/tests/fixtures/ETHUSDT-1h-2026-04-07-original.csv` (regenerated from Binance public klines API matching `parseOfficialCsvFile` column shape — Unix-ms timestamp first column, OHLC numerics next; the original user-uploaded CSV is unrecoverable, fixture is an equivalent-shape regenerated slice with regen command + date in fixture-file docstring header for audit)
- **When** `pytest backend/tests/test_predict_real_csv_integration.py` runs
- **Then (positive case)** the test calls `find_top_matches` with the live DB + real 24-bar 1H input ending 2026-04-07 and asserts the call returns ≥1 match without raising — i.e. the exact failure mode of K-051 stays caught in CI permanently
- **And (negative case — K-015 sacred-regression anchor, B3)** a second test in the same file copies the live DB to a tmp path truncated to **`MA_WINDOW - 1 = 98` bars** ending at 2026-04-07 (one bar below the actual code-level gate at `predictor.py:156` `if len(combined_closes) < MA_WINDOW: return []`; the user-facing ValueError text claims "129 daily bars" but empirically the gate fires at < 99 — `predictor.py:335` doc/code drift outside K-051 scope, tracked under TD-K051-MSG-DRIFT below), calls `find_top_matches` with the same 24-bar 1H input, and asserts `ValueError` is raised whose message contains the exact substring `"ma_history requires at least 129 daily bars ending at that date"` — pins the K-015 invariant message text stability AND the empirical floor `SACRED_FLOOR == MA_WINDOW == 99` via a same-file drift-guard test pinning both numbers (user-retest SOP greps for the substring, so silent rewording would break telemetry)
- **And** any future regression that re-introduces the bug (DB shrinks, MA window changes, error message rewording) fails one of the two tests rather than reaching the user

### AC-051-10 — Predictor message-vs-gate drift fix (Phase 4, user override 2026-04-26; QA-tightened B1+B2 2026-04-26)

- **Given** the drift observed in Phase 3b/3c — `predictor.py:335` ValueError text claims "ma_history requires at least 129 daily bars" but the actual gate at `predictor.py:156` (`_fetch_30d_ma_series`) is `if len(combined_closes) < MA_WINDOW: return []` (= 99). User override: "兩個小坑不可以留成 TD，只要有問題能做完就當次做完" — drift must be fixed inside K-051.
- **When** any caller of `_fetch_30d_ma_series` runs with a daily history shorter than `MA_TREND_WINDOW_DAYS + MA_WINDOW = 129` bars ending at the anchor date — both **query-side** at `predictor.py:332-336` (raises Sacred ValueError) AND **candidate-side** at `predictor.py:343-344` (skips candidate via `continue`)
- **Then** the gate at `predictor.py:156` returns `[]` for both callsites in unison; query-side caller raises the exact Sacred ValueError whose message contains `"ma_history requires at least 129 daily bars ending at that date"`; candidate-side `continue`s (existing `if not candidate_30d_ma: continue` keeps working without change). Dual-tightening is intentional — both sides must agree on the 129-bar floor for trend-direction comparison reliability (QA B-Phase4-hidden-callsite gate)
- **And** `MA_WINDOW` and `MA_TREND_WINDOW_DAYS` remain unchanged (existing 99 + 30 invariants); fix is at the gate comparison only — `if len(combined_closes) < MA_TREND_WINDOW_DAYS + MA_WINDOW: return []`
- **And** message text in `predictor.py:335` switches to f-string referencing the constants (`f"ma_history requires at least {MA_TREND_WINDOW_DAYS + MA_WINDOW} daily bars ending at that date."`) so future changes to either constant auto-update the user-visible text
- **And** `backend/tests/test_predict_real_csv_integration.py` updates: `SACRED_FLOOR` becomes `MA_TREND_WINDOW_DAYS + MA_WINDOW = 129` (no longer drifts from `MA_WINDOW`); `bars_to_keep = SACRED_FLOOR - 1 = 128` (one short of the now-aligned floor); drift-guard test asserts `SACRED_FLOOR == 129`
- **And (B2 — stale-doc gate)** the 11-line "Empirical Sacred-error floor" explanatory comment at `test_predict_real_csv_integration.py:33-43` and any other comment block that documents the now-fixed drift (e.g. the "Truncation rationale" paragraph in `test_truncated_db_raises_sacred_value_error`) MUST be deleted in the same commit — leaving stale doc that says "this drift exists" after the drift is fixed = future-engineer landmine
- **And (B1 — boundary unit-test gate)** new boundary unit tests in `backend/tests/test_predictor.py` (or extension of an existing test file if it already exists) covering: (a) `_fetch_30d_ma_series` with exactly 128 bars of synthetic history → returns `[]`, (b) with exactly 129 bars → returns 30 floats, (c) with 130 bars → returns 30 floats. These are the unit-level boundary anchors so future refactors of either constant or the gate expression fail at the closest layer to the bug

### AC-051-11 — Toast bar `data-testid` hardening (Phase 4, user override 2026-04-26)

- **Given** Phase 3c's chained 3-class selector `.text-red-400.border-red-700.bg-red-950` at `frontend/e2e/upload-real-1h-csv.spec.ts` (engineer chose chained classes because bare `.text-red-400` matched StatsPanel/MatchList unrelated red elements) — brittle to future Tailwind refactors. User override: TD-K051-DATA-TESTID promoted from "fix-after-merge" to in-scope.
- **When** the AppPage error bar at `AppPage.tsx:349-353` renders
- **Then** the bar has `data-testid="error-toast"` attribute on the wrapping `<div>`
- **And** `frontend/e2e/upload-real-1h-csv.spec.ts` swaps the `.text-red-400.border-red-700.bg-red-950` chained selector to `page.getByTestId('error-toast')` for both the visibility-true assertion (24-row reject negative case) and the visibility-false assertion (happy-path positive case)
- **And** existing assertions on the inner text content (`✗ {errorMessage}`) remain intact

### AC-051-12 — App UI Chinese → English (Phase 4, user override 2026-04-26; QA-tightened B3+B4 2026-04-26)

- **Given** the user-visible Chinese strings in the React app surface — `AppPage.tsx` (363, 379, 399), `MainChart.tsx` (264, 270), `PredictButton.tsx:16`, `pages/BusinessLogicPage.tsx:106`. User instruction: "你順便把app畫面的中文文案改成英文". Code-internal Chinese (regex patterns parsing user-pasted zh-TW timestamps in `MainChart.tsx:33-42`; JS comments in `UnifiedNavBar.tsx:7-20`; CJK regex in `__tests__/diary.english.test.ts:9-16`) is functional / non-display and stays as-is.
- **When** the affected pages render
- **Then** all user-visible text is English; no characters in the broad CJK range used by `__tests__/diary.english.test.ts` (`[一-鿿㐀-䶿぀-ゟ゠-ヿ　-〿＀-￯]`) remain in the rendered DOM of `/app`, `/business-logic`, the chart loading state, or the Predict button title
- **And (B4 — full-width punctuation gate)** full-width CJK punctuation (`（`/`）`/`：`/`／`/`，`/`。`/`「`/`」`/etc.) MUST be replaced with ASCII equivalents (`(`/`)`/`:`/`/`/`,`/`.`/`"`/`"`) in any translated string — the `＀-￯` block in the diary.english.test.ts CJK regex catches half-width-form (FF00–FFEF) artifacts; full-width punctuation falls inside `　-〿` — both blocks must produce zero matches across the translated surface
- **And (B3 — test description-string gate)** Playwright `test('...')` description strings that contain Chinese (`frontend/e2e/ma99-chart.spec.ts:247` `'MainChart shows MA99 計算中 label while loading, then value after load'`) MUST also be translated; test descriptions are user-visible in Playwright HTML reports + CI logs and count as the same display surface
- **And** Playwright spec assertions in `frontend/e2e/ma99-chart.spec.ts` (lines 188, 194, 238, 247, 268, 274) update to the new English strings — selector logic unchanged, only the asserted text changes; before-edit grep `[一-鿿㐀-䶿぀-ゟ゠-ヿ　-〿＀-￯]` over `frontend/src/` + `frontend/e2e/` must enumerate every match; post-edit re-grep must return zero matches except the deliberately-preserved code-internal regex patterns enumerated above
- **And** `npx tsc --noEmit` exits 0 and the full Playwright suite passes (no string-match regressions elsewhere)

### AC-051-09 — E2E spec uploading real 1H CSV against mocked `/api/predict` (B4/B5-tightened 2026-04-26)

- **Given** a committed real 1H CSV at `frontend/e2e/fixtures/ETHUSDT-1h-2026-04-07.csv` (NOT under `frontend/public/examples/` — that path is reserved for K-046 example download, conflating would couple two ACs) that is **byte-clean (no UTF-8 BOM)** + **headerless (24 data lines exactly, matches K-046 ETHUSDT_1h_test.csv shape — `parseOfficialCsvFile` at `frontend/src/AppPage.tsx:48-82` enforces `OFFICIAL_ROW_COUNT = 24` strict and throws on any non-numeric first column or BOM-prefixed first cell)** and a Playwright spec at `frontend/e2e/upload-real-1h-csv.spec.ts`
- **When** `npx playwright test upload-real-1h-csv` runs against the dev server with `/api/predict` mocked using the existing `frontend/e2e/_fixtures/mock-apis.ts` payload shape (B5 mock-realism guard — that fixture already meets `ClaudeCodeProject/CLAUDE.md` §Test Data Realism: future_ohlc array ≥ 2 bars to avoid silent `computeDisplayStats` fallback, all `PredictStats` fields populated to avoid runtime crashes from `undefined`); spec drives upload via `page.locator('input[type="file"]').setInputFiles(...)` (B4 — file input is `className="hidden"` inside a `<label>`, `setInputFiles` works on hidden inputs and is the proven pattern from K-046 spec at `K-046-example-upload.spec.ts:97-99`; do NOT use label-click + fileChooser pattern, slower + flake-prone)
- **Then** the spec uploads the real-shape CSV through the actual `OHLCEditor` upload UI
- **And** asserts the user-visible AC-051-01 path: chart renders, matches list populates, no error toast bar (`.text-red-400` red error bar at `AppPage.tsx:349-353` MUST NOT be visible — the K-051 user-visible failure was the red bar, not just a text substring; assert visual chrome too)
- **And** asserts the previously-blocking `ma_history requires…` error string is NOT shown anywhere in the DOM (negative assertion anchors the bug class)

## Scope

- **Phase 1 — daily history DB backfill (already shipped via PR #19 / inner #11):**
  - Single file: `history_database/Binance_ETHUSDT_d.csv`
  - Append daily bars for the contiguous + sparse missing window 2026-03-20 → 2026-04-08 (16 bars after Binance gap reconciliation)
  - Source: Binance public klines API, 1d interval, ETHUSDT pair
  - Line count: 3141 → 3157
- **Phase 2 — Cloud Build rollup-musl fix (PR #20 / inner #12, in review):**
  - Single file: `Dockerfile` (repo root)
  - Single line change post-`npm ci` to install the missing Linux musl rollup binary
  - Local `docker build --platform linux/amd64` pre-merge dry-run completed (matches K-049 Phase 2b retro-codified gate)
- **Phase 3 — Regression coverage + hydration policy (scope-revised 2026-04-26, in-progress on this branch):**
  - `ClaudeCodeProject/K-Line-Prediction/CLAUDE.md` — new §Worktree Hydration Drift Policy subsection (AC-051-06)
  - `claude-config/agents/qa.md` (mirrors `~/.claude/agents/qa.md`) — new §Worktree Hydration Drift Handling section (AC-051-06)
  - `backend/tests/test_history_db_contiguity.py` — new pytest gap detector (AC-051-07)
  - `backend/tests/test_predict_real_csv_integration.py` + `backend/tests/fixtures/ETHUSDT-1h-2026-04-07-original.csv` — new integration test + fixture (AC-051-08)
  - `frontend/e2e/upload-real-1h-csv.spec.ts` + `frontend/e2e/fixtures/ETHUSDT-1h-2026-04-07.csv` — new E2E spec + fixture (AC-051-09)
  - PR-split note: per CLAUDE.md PR split rule (b) cross file class, this Phase 3 work splits into 3 commits / PRs sharing the same `ops-daily-db-backfill` branch motivation: (i) docs-only hydration policy, (ii) backend pytest, (iii) frontend e2e

## Out of Scope

- Backend logic change to auto-aggregate 1H → 1D when daily history is short — explicitly rejected by user in favor of manual data refresh
- Schema migration of `Binance_ETHUSDT_d.csv` (column additions, type changes) — append-only refresh
- Switching base image away from `node:20-alpine` — workaround keeps current image
- General `package-lock.json` regeneration on Linux to permanently eliminate the platform-specific binary mismatch — deferred (see Tech Debt)
- Automated daily DB refresh (cron / scheduled scrape) — covered by K-048 auto-scraper, not in this ticket's scope
- Any frontend (`frontend/src/**`) or backend (`backend/main.py`) source changes
- Updates to `PM-dashboard.md` (separate sync per user instruction in this retroactive backfill)

## Phase Plan (retroactive)

### Phase 1 — daily history DB backfill (DONE, PR #19/#11 merged)

1. Fetch ETHUSDT 1d klines from Binance public API for the gap window
2. Append rows to `history_database/Binance_ETHUSDT_d.csv` preserving existing column order + format
3. Local smoke test: feed the original `ETHUSDT-1h-2026-04-07.csv` to the local backend → verify 10 matches returned, top corr 0.8746, no ValueError
4. Commit + open PR #19 (outer) / #11 (inner) → merge

### Phase 2 — Dockerfile rollup-musl fix (PR #20/#12 OPEN, in code review)

1. Identify Cloud Build failure root cause (npm cli #4828 platform-specific lockfile drift)
2. Patch Dockerfile: append `&& npm install --no-save @rollup/rollup-linux-x64-musl@4.60.1` to the `npm ci` line
3. Local `docker build --platform linux/amd64 -f Dockerfile .` dry-run → exit 0
4. Commit + open PR #20 (outer) / #12 (inner) → currently in Code Reviewer (breadth) + reviewer-depth (Agent) parallel review
5. On review pass: merge → Cloud Run redeploy → user retest of the original 1H CSV upload to validate AC-051-01 end-to-end

### Phase 3 — Regression coverage + hydration policy (scope-revised 2026-04-26)

User ruling 2026-04-26 reverted PM's earlier classification of TD-K051-02/03/04/05 from "fix-after-merge → separate follow-up tickets" back into K-051's own scope — rationale: regression coverage for the bug class K-051 fixed is K-051's own deliverable, not new work. Three-PR split on the same `ops-daily-db-backfill` branch (per CLAUDE.md PR split rule (b) cross file class):

1. **Phase 3a — docs-only hydration policy (this commit set):** edit `ClaudeCodeProject/K-Line-Prediction/CLAUDE.md` + `claude-config/agents/qa.md` per AC-051-06; commit + push + open PR for outer mirror.
2. **Phase 3b — backend pytest coverage:** add `backend/tests/test_history_db_contiguity.py` per AC-051-07 + `backend/tests/test_predict_real_csv_integration.py` + `backend/tests/fixtures/ETHUSDT-1h-2026-04-07-original.csv` per AC-051-08. Run `pytest backend/tests/` in canonical, exit 0. Commit + push + open PR.
3. **Phase 3c — frontend E2E:** add `frontend/e2e/upload-real-1h-csv.spec.ts` + `frontend/e2e/fixtures/ETHUSDT-1h-2026-04-07.csv` per AC-051-09. Run `npx playwright test upload-real-1h-csv`, all green. Commit + push + open PR.

After all three PRs merge → K-051 status flips to `closed` (was reopened from closed for Phase 3 scope revision); record full closed-* metadata.

### Phase 4 — In-scope TD fixes + UI i18n (user override 2026-04-26)

User override 2026-04-26 reverted PM's Phase 3 close that left TD-K051-MSG-DRIFT + TD-K051-DATA-TESTID as fix-after-merge: 「兩個小坑不可以留成 TD，只要有問題能做完就當次做完」. Same user instruction added UI Chinese → English in scope: 「既然你這次有動到前端，你順便把 app 畫面的中文文案改成英文」. Single Phase 4 commit on the same `ops-daily-db-backfill` branch (PR #23 already covers all of Phase 3, Phase 4 appends).

1. **Backend gate align (AC-051-10):** `backend/predictor.py` line 156 gate `< MA_WINDOW` → `< MA_TREND_WINDOW_DAYS + MA_WINDOW`; line 335 message → f-string referencing constants. `backend/tests/test_predict_real_csv_integration.py` `SACRED_FLOOR` → 129; `bars_to_keep` → 128; drift-guard assertions updated. `pytest backend/tests/` exit 0.
2. **Toast `data-testid` (AC-051-11):** `frontend/src/AppPage.tsx:349-353` add `data-testid="error-toast"`; `frontend/e2e/upload-real-1h-csv.spec.ts` swap chained-class selector to `getByTestId('error-toast')`. `npx playwright test upload-real-1h-csv` green.
3. **UI i18n (AC-051-12):** translate user-visible Chinese in `AppPage.tsx` (363, 379, 399), `MainChart.tsx` (264, 270), `PredictButton.tsx:16`, `pages/BusinessLogicPage.tsx:106`. Update `frontend/e2e/ma99-chart.spec.ts` assertions (188, 194, 238, 247, 268, 274) to match new English text. `npx tsc --noEmit` exit 0; full Playwright suite passes.
4. **Reviewer + QA real-tier:** runtime change at backend gate forces real-qa per `feedback_qa_early_proxy_tier.md`; reviewer depth + qa regression sign-off before commit.
5. **Commit + push to PR #23 + wait for user merge approval** (per 「做完再 merge」).

## Risks

1. **Binance API rate limit / outage during backfill window** — mitigated; backfill is one-shot manual fetch, succeeded on first attempt; no retry logic in scope
2. **Daily DB drift over time** — this ticket only covers the 16-day gap that blocked the user's specific test case; future drift requires K-048 auto-scraper to land
3. **`@rollup/rollup-linux-x64-musl@4.60.1` version drift** — pinning a specific patch version protects today's build but creates future maintenance burden if rollup major-bumps; tracked under Tech Debt
4. **PR #20 merge ordering vs simultaneous parallel review** — Code Reviewer + reviewer-depth running concurrently with this ticket-write; if either flags a Critical/Warning, the Bug Found Protocol applies and Phase 2 may need iteration before merge
5. **Retroactive AC vacuity risk** — AC-051-01 through AC-051-05 are reverse-engineered from the already-shipped diff; per `feedback_no_fabricated_specifics.md` they cite specific verifiable evidence (line counts, log strings, commit-pinned Dockerfile diff) rather than aspirational claims; QA validation post-deploy is the binding check

## Tech Debt

- **TD candidate: regenerate `package-lock.json` on Linux** — eliminates the platform-specific rollup binary entry permanently; would let future Dockerfile drop the explicit musl install. Not in scope here because it would touch the lockfile across many transitive deps and require a separate review/deploy cycle. Will open as TD-K051-01 after this ticket closes if the workaround proves brittle.
- **TD candidate: automated daily DB refresh end-to-end** — partially covered by K-048 (auto-scraper); when K-048 ships, the manual fetch path used in Phase 1 here should be retired.
- **Process debt: bypassed PM→Architect→Engineer chain** — by user direction this ticket is retroactive, not a precedent. Future "user uploads CSV → backend errors" repro flows should still go through QA Early Consultation + AC drafting before code lands. Note logged here so it is not lost in the retro.
- ~~**TD-K051-MSG-DRIFT**~~ → **resolved in Phase 4 as AC-051-10** (user override 2026-04-26 「兩個小坑不可以留成 TD，只要有問題能做完就當次做完」 reverted the fix-after-merge classification; gate at `predictor.py:156` tightened to `MA_TREND_WINDOW_DAYS + MA_WINDOW = 129` matching the message text).
- ~~**TD-K051-DATA-TESTID**~~ → **resolved in Phase 4 as AC-051-11** (same user override; `data-testid="error-toast"` added at `AppPage.tsx:349-353`; Phase 3c spec swapped to `getByTestId`).

## Blocking Questions

(None at ticket-write time. Code Reviewer + reviewer-depth currently running on PR #20; any findings they raise will be added back here per Bug Found Protocol.)

## Retrospective

Placeholder — to be filled by:

- Engineer (root cause for skipping branch + going CSV-first instead of testing the auto-aggregate idea)
- Reviewer (any Critical/Warning from PR #20 parallel review)
- QA (post-deploy retest of the original 1H upload — confirms AC-051-01 end-to-end)
- PM (cross-role summary + process notes on retroactive ticket workflow)

### Engineer (Phase 4)

**AC judgments that were wrong:** none — design doc §1 truth table classified all 29 CJK hits with file:line + class (a/b/c); applied verbatim with zero scope drift.
**Edge cases not anticipated:** full-Playwright-suite parallel-flake variance — design doc baseline cited 299/2/1 but my run showed 298/3/1 because `about.spec.ts:26 AC-017-NAVBAR` flaked under parallel load (passes in isolation). Investigation confirmed not a Phase 4 regression (i18n/data-testid/backend gate cannot affect /about NavBar DOM order); reported as third pre-existing flake.
**Next time improvement:** for full-Playwright gate, switch design doc spec from raw count "299/2/1" to named-flake allow-list ("expected pass ≥ 296 AND failures ⊆ {documented flake set}") so regressions are detectable independent of total-count drift. Codify into `~/.claude/agents/engineer.md` §Verification Checklist (full Playwright run sub-rule).

### PM TD Rulings (2026-04-25)

QA surfaced 5 TD candidates in the 2026-04-25 K-051 retro entry. PM rulings:

- **TD-K051-02 → fix-after-merge** (rationale: backend-pytest-only contiguity gap detector. Real coverage gap — same bug class can recur silently — but does NOT block AC-051-01/03/05 deploy gates. Open as standalone backend-test ticket immediately post-K-051 merge; same motivation cluster as TD-K051-03, may bundle into one PR per PR split rules.)
- **TD-K051-03 → fix-after-merge** (rationale: backend integration test loading real `history_database/Binance_ETHUSDT_d.csv` + committed real 24-bar 1H CSV. Highest-value coverage of the exact failure mode that triggered K-051. Not deploy-blocking; bundle with TD-K051-02 into one backend-test follow-up ticket since both share motivation "permanent regression coverage for K-051 bug class".)
- **TD-K051-04 → fix-after-merge** (rationale: E2E spec uploading committed real 1H CSV against mocked `/api/predict`. Anchors AC-051-01 user-visible path with permanent test coverage. Different file class from -02/-03 (frontend e2e vs backend pytest) per CLAUDE.md PR split rule (b) "cross file class (runtime + docs)" → separate ticket/PR. Open as a sibling follow-up.)
- **TD-K051-05 → fix-after-merge** (rationale: docs-only — adds worktree hydration drift policy to K-Line `CLAUDE.md` + qa.md persona. Not deploy-blocking. Bundle into a single docs-only PR per PR split rules; short ticket, low ROI to rush pre-merge.)
- **TD-K030-03 → fix-after-merge (HIGH PRIORITY, separate ticket/PR mandatory)** (rationale: three strikes (K-030, K-034 P1, K-051) confirms persona pre/post checks insufficient — source-level hard gate is the right fix. BUT touches `frontend/scripts/visual-report.ts` (or equivalent runtime), different motivation from K-051's data + Dockerfile scope → CLAUDE.md PR split rules (b) cross file class + (c) cross deploy target force a SEPARATE ticket/PR. Visual-report is a Playwright report generator, not Cloud Run runtime, so this does NOT actually block K-051's deploy gate (AC-051-01/03/05). Classify as fix-after-merge but open the ticket the same day K-051 merges; do not let it slip a fourth time.)

**Net effect on K-051 merge:** zero blockers. PR #12 (inner) + #20 (outer) cleared to merge once Code Reviewer + reviewer-depth return clean.

### User Ruling: 2026-04-26 — Scope Revision (TD-K051-02..05 reverted to in-scope)

User overturned PM's 2026-04-25 fix-after-merge rulings for TD-K051-02/03/04/05:

> 為什麼你沒做完的東西還要另外開ticket處理？你應該在這個ticket範圍把它做完

Rationale (user-validated): permanent regression coverage for the K-051 bug class (real-CSV integration test, contiguity gap detector, real-CSV E2E) is K-051's own deliverable, not "new work in a follow-up ticket". The "fix-after-merge" classification was a defer-by-rebrand of work that should have shipped with K-051's first merge. Hydration drift policy is in the same boat — it's the codified learning from K-051's worktree triage misclassifications, owned by K-051's retro.

**Effect:**

- TD-K051-02 / -03 / -04 / -05 promoted from fix-after-merge follow-up tickets → K-051 Phase 3 in-scope (see new AC-051-06..09 + Phase 3 plan)
- No new ticket numbers created; all four land on the same `ops-daily-db-backfill` branch as Phase 3 commits
- TD-K030-03 stays a separate high-priority ticket (kept) — it's a cross-ticket recurrence (K-030 + K-034 P1 + K-051), not a K-051-specific deliverable; source-level hard gate in `frontend/scripts/visual-report.ts` is its own motivation
- Status: K-051 reopens from `closed` back to `in-progress` until Phase 3a/3b/3c PRs merge

**Codification (memory):** `feedback_no_followup_ticket_for_unfinished_scope.md` — when work was deferred under the rationale "not deploy-blocking" or "different file class", check whether it's regression coverage or codification of the bug class the ticket fixed; if yes, it's the same ticket's deliverable, do not split into a new ticket — split into separate PRs on the same branch instead.

### PM Ruling: 2026-04-26 — QA Phase 3 Early Consultation B1-B5 resolution

QA Early Consultation 2026-04-26 (Verdict: BLOCK) surfaced 5 AC-text gaps. PM rulings:

- **B1 (AC-051-07):** APPLIED — AC tightened to require monotonic-ascending sort + duplicate-date rejection + freshness-floor (`last_row.date >= TODAY - 7 days` matching K-048 SLA). The original "no gap > 1" wording silently passed three failure modes (duplicate, zigzag, head-shrink); contiguity guard ≠ freshness guard, K-051's bug was freshness.
- **B2 (AC-051-08, PM ruling required):** OPTION A — read live `history_database/Binance_ETHUSDT_d.csv`, NOT a frozen fixture. Reproducibility is sacrificed deliberately. Rationale: K-051's bug class is silent DB drift; option B (frozen fixture) hides the bug class behind reproducibility. Drift detection is the entire point — pair AC-051-07 contiguity layer + AC-051-08 user-visible layer, both fail loud on shrink.
- **B3 (AC-051-08):** APPLIED — added second test asserting `ValueError` raised with exact substring `"ma_history requires at least 129 daily bars ending at that date"` on a 128-bar truncated DB. K-015 sacred-regression invariant now has both positive AND negative anchors, plus user-message text stability (the K-051 user-retest SOP literally greps for that string).
- **B4 (AC-051-09):** APPLIED — AC explicitly requires `setInputFiles` driver pattern (proven in K-046 spec), BOM-clean headerless 24-line fixture, fixture path `frontend/e2e/fixtures/` (NOT `frontend/public/examples/` to avoid coupling with K-046), explicit toast-bar negative assertion (`.text-red-400` MUST NOT be visible).
- **B5 (AC-051-09):** APPLIED — AC requires reuse of `frontend/e2e/_fixtures/mock-apis.ts` payload shape (already meets `feedback_playwright_mock_realism.md` + `ClaudeCodeProject/CLAUDE.md` §Test Data Realism contract: future_ohlc ≥2 bars, all PredictStats fields populated). Hand-rolled mocks risk silent fallback to `appliedData.stats`.

**Effect:** QA Early Consultation Verdict flips BLOCK → RELEASE-OK. Architect cleared for Phase 3b/3c design. Frontmatter `qa-early-consultation` field now points to docs/retrospectives/qa.md 2026-04-26 K-051 Phase 3 entry (was N/A).

**Non-blocking refinements N1-N3 (QA's nice-to-haves) NOT codified into AC:** N1 (parametrize MAX_GAP_DAYS) — Engineer-time. N2 (parametrize multi-date tests) — Reviewer can flag. N3 (MatchList row-count snapshot) — peripheral to bug class. Engineer free to add; Reviewer free to require; not gated.

### PM Summary

(To be appended after Reviewer + QA close out.)

## Deploy Record

(To be appended after PR #20 merges, Cloud Run redeploys, and AC-051-01 is verified live.)
