---
id: K-051
title: Daily history DB backfill (2026-03-20 → 2026-04-08) + Cloud Build rollup-linux-x64-musl fix
status: in-progress
created: 2026-04-25
type: ops + fix
priority: high
size: small
visual-delta: none
content-delta: none
design-locked: N/A
qa-early-consultation: N/A — retroactive ticket for work already shipped; data refresh + 1-line Dockerfile fix, no schema/runtime/layout changes; QA validation runs post-deploy via user retest of the original 2026-04-07 1H upload that triggered the bug
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

## Blocking Questions

(None at ticket-write time. Code Reviewer + reviewer-depth currently running on PR #20; any findings they raise will be added back here per Bug Found Protocol.)

## Retrospective

Placeholder — to be filled by:

- Engineer (root cause for skipping branch + going CSV-first instead of testing the auto-aggregate idea)
- Reviewer (any Critical/Warning from PR #20 parallel review)
- QA (post-deploy retest of the original 1H upload — confirms AC-051-01 end-to-end)
- PM (cross-role summary + process notes on retroactive ticket workflow)

### PM TD Rulings (2026-04-25)

QA surfaced 5 TD candidates in the 2026-04-25 K-051 retro entry. PM rulings:

- **TD-K051-02 → fix-after-merge** (rationale: backend-pytest-only contiguity gap detector. Real coverage gap — same bug class can recur silently — but does NOT block AC-051-01/03/05 deploy gates. Open as standalone backend-test ticket immediately post-K-051 merge; same motivation cluster as TD-K051-03, may bundle into one PR per PR split rules.)
- **TD-K051-03 → fix-after-merge** (rationale: backend integration test loading real `history_database/Binance_ETHUSDT_d.csv` + committed real 24-bar 1H CSV. Highest-value coverage of the exact failure mode that triggered K-051. Not deploy-blocking; bundle with TD-K051-02 into one backend-test follow-up ticket since both share motivation "permanent regression coverage for K-051 bug class".)
- **TD-K051-04 → fix-after-merge** (rationale: E2E spec uploading committed real 1H CSV against mocked `/api/predict`. Anchors AC-051-01 user-visible path with permanent test coverage. Different file class from -02/-03 (frontend e2e vs backend pytest) per CLAUDE.md PR split rule (b) "cross file class (runtime + docs)" → separate ticket/PR. Open as a sibling follow-up.)
- **TD-K051-05 → fix-after-merge** (rationale: docs-only — adds worktree hydration drift policy to K-Line `CLAUDE.md` + qa.md persona. Not deploy-blocking. Bundle into a single docs-only PR per PR split rules; short ticket, low ROI to rush pre-merge.)
- **TD-K030-03 → fix-after-merge (HIGH PRIORITY, separate ticket/PR mandatory)** (rationale: three strikes (K-030, K-034 P1, K-051) confirms persona pre/post checks insufficient — source-level hard gate is the right fix. BUT touches `frontend/scripts/visual-report.ts` (or equivalent runtime), different motivation from K-051's data + Dockerfile scope → CLAUDE.md PR split rules (b) cross file class + (c) cross deploy target force a SEPARATE ticket/PR. Visual-report is a Playwright report generator, not Cloud Run runtime, so this does NOT actually block K-051's deploy gate (AC-051-01/03/05). Classify as fix-after-merge but open the ticket the same day K-051 merges; do not let it slip a fourth time.)

**Net effect on K-051 merge:** zero blockers. PR #12 (inner) + #20 (outer) cleared to merge once Code Reviewer + reviewer-depth return clean.

**Follow-up tickets to open post-merge:**

1. `TD-K051-coverage` (bundle TD-K051-02 + TD-K051-03; backend-test file class) — single PR
2. `TD-K051-04-e2e` (E2E real-CSV spec; frontend e2e file class) — separate PR
3. `TD-K051-05-hydration-policy` (docs-only; CLAUDE.md + qa.md) — single PR
4. `TD-K030-03-source-gate` (visual-report.ts source hard-gate; high priority, three-strikes) — separate PR

### PM Summary

(To be appended after Reviewer + QA close out.)

## Deploy Record

(To be appended after PR #20 merges, Cloud Run redeploys, and AC-051-01 is verified live.)
