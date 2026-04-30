---
id: K-048
title: Auto scraper for authoritative K-line history DB
status: open
created: 2026-04-24
updated: 2026-04-30
type: feature
priority: medium
size: large
visual-delta: none
content-delta: none
design-locked: "N/A — no visual changes"
qa-early-consultation: "docs/retrospectives/qa.md 2026-04-30 K-048 (PM proxy tier)"
dependencies: [K-046]
base-commit: "f70dc6a"
phase1-closed-commit: "5074caf"
sacred-clauses: []
---

## 0. One-Line Summary

Replace the human-upload-as-DB-maintenance model (retired by K-046) with a GitHub Actions cron job that fetches ETH/USDT 1H + 1D bars from Binance public API daily at 03:00 UTC, appends new bars to the authoritative CSV files, and redeploys Cloud Run so the backend serves fresh data. Phase 1 adds a `freshness_hours` field to `/api/history-info` and a stale indicator in the History Reference UI.

---

## 1. Background

### 1.1 Current state (2026-04-30)

- `history_database/Binance_ETHUSDT_1h.csv` — last bar `2026-04-08 23:00` UTC+0 (22 days stale)
- `history_database/Binance_ETHUSDT_d.csv` — last bar `2026-04-25` UTC+0 (5 days stale)
- K-046 (2026-04-24) commented out the upload-write path. No mechanism exists to update the DB without a manual CSV upload + code change.
- History Reference UI shows `filename (latest: YYYY-MM-DD HH:MM UTC+0)` with no freshness signal.

### 1.2 Data source

Binance public REST: `GET /api/v3/klines?symbol=ETHUSDT&interval={1h|1d}&startTime=...&limit=1000`. No API key required. `load_csv_history` already supports Binance raw klines format.

### 1.3 Architecture constraint

Cloud Run containers are ephemeral — writes to local filesystem do not persist across restarts. Updating the authoritative CSV files requires committing them to the repo and triggering a container rebuild + redeploy.

### 1.4 BQ rulings (2026-04-30)

| BQ | Question | Ruling |
|----|----------|--------|
| BQ-048-01 | Hosting shape | GitHub Actions cron — zero new infra, built-in failure email |
| BQ-048-02 | 1H update cadence | Daily once at 03:00 UTC |
| BQ-048-03 | Failure alerting | A + B — GitHub Actions email on failure + `freshness_hours` stale warning in frontend |

---

## 2. Goals / Non-Goals

### Goals
1. GitHub Actions cron `0 3 * * *`: fetch new 1H + 1D bars → append to CSV → commit → push → redeploy Cloud Run.
2. Backend `/api/history-info` gains `freshness_hours: int | null` per timeframe.
3. History Reference UI shows freshness; highlights stale if `freshness_hours >= 48`.
4. Idempotent: no commit if no new closed bars.
5. Backfill: fetch all missing bars from `latest + 1 interval` to now; paginate for gaps > 1000 bars.

### Non-Goals
- Real-time (sub-hourly) updates.
- GCS or other persistent storage backends.
- Symbols other than ETHUSDT.
- Changes to prediction algorithm or Sacred clauses.

---

## 3. Technical Decisions

| Decision | Ruling | Reason |
|----------|--------|--------|
| CSV output format | Simple `date,open,high,low,close` via `_save_history_csv` | Consistent with existing write path; `load_csv_history` handles both old and new format |
| 1D format migration | Accepted on first scraper run (CryptoDataDownload descending → simple ascending) | `load_csv_history` transparent; `test_history_db_contiguity.py` updated per AC-048-P2-08 |
| `freshness_hours` on mock data | `null` (CSV not on disk) | Prevents nonsensical values from synthetic dates |
| In-progress candle | Exclude bars where `close_time_ms` > `now_ms` | Incomplete bars corrupt pattern matching |
| Loop prevention | Commit message includes `[skip ci]` | Prevents Cloud Build from re-triggering scraper workflow |
| Scraper script location | `scripts/scrape_history.py` | Consistent with existing `scripts/` directory |

---

## 4. QA Early Consultation (PM proxy — 2026-04-30)

**Tier:** PM proxy (backend schema change + new CI job + frontend change + CSV migration risk).

| # | Challenge | PM Ruling | AC |
|---|-----------|-----------|-----|
| C1 | Binance returns current in-progress candle (`close_time` in future); storing it corrupts predictions. | Exclude bars where `close_time_ms > now_ms`. | AC-048-P2-03 |
| C2 | Binance `limit=1000`; gap > 1000 1H bars (~41 days) needs pagination. | Implement `while` loop advancing `startTime`. | AC-048-P2-04 |
| C3 | `test_history_db_contiguity.py` reads 1D CSV via raw `csv.reader`; after format migration column detection changes. | Update test to detect both formats by checking `lines[0]`. | AC-048-P2-08 |
| C4 | `freshness_hours` on mock data produces huge synthetic-date values. | Return `null` when CSV not on disk at startup. | AC-048-P1-03 |
| C5 | No new bars case should not create empty commit. | Skip commit if nothing changed. | AC-048-P2-05 |
| C6 | GitHub Actions push to `main` may fail if branch protection requires PRs. | Use `GH_PAT` secret with `contents: write` scope; document in §5. | AC-048-P2-09 (setup gate) |
| C7 | Scraper commit may trigger Cloud Build loop. | `[skip ci]` in commit message; Cloud Build trigger configured to honour it. | AC-048-P2-06 |
| C8 | Running Cloud Run instance still has stale in-memory data after CSV commit. | Workflow triggers `gcloud run deploy` after push. | AC-048-P2-07 |
| C9 | Sacred clauses K-009 / K-013 / K-015 impact check. | Zero impact — predict logic unchanged; bar_count only increases. | No AC |

---

## 5. Setup Requirements (one-time ops, before Phase 2 first run)

| Secret | Value | Used for |
|--------|-------|----------|
| `GH_PAT` | Personal Access Token with `contents: write` scope | `git push` to main from Actions |
| `GCP_SA_KEY` | GCP service account JSON with Cloud Run Admin + Cloud Build Editor + Storage Object Admin | `gcloud run deploy` from Actions |

Cloud Build trigger must be configured to skip builds when commit message contains `[skip ci]`.

---

## 6. Acceptance Criteria

### Phase 1 — Backend `freshness_hours` + Frontend stale indicator

#### AC-048-P1-01 FRESHNESS-SCHEMA
`GET /api/history-info` response gains `freshness_hours: int | null` in each timeframe entry alongside existing `filename`, `latest`, `bar_count`.

- Value: `floor((now_utc - latest_bar_utc).total_seconds() / 3600)` as integer
- `null` when history is loaded from mock (CSV not on disk at startup)
- Backend: `HistoryEntry` model gains `freshness_hours: int | None = None`
- Frontend type: `HistoryEntry` gains `freshness_hours: number | null`

**Test:** `backend/tests/test_main.py` AC-TEST-HISTORY-INFO-1 updated — assert `freshness_hours` is `int` or `null` in both `1H` and `1D` response entries.

#### AC-048-P1-02 FRESHNESS-UI
History Reference section renders freshness.

- Format: `{filename} (latest: {latest} UTC+0 · {X}d {Y}h ago)` where `X = floor(h/24)`, `Y = h%24`
- If `freshness_hours` is `null`: omit the `· Xd Yh ago` portion
- If `freshness_hours >= 48`: wrapper div has `data-testid="history-freshness-stale"`

**Test:** `frontend/e2e/K-046-example-upload.spec.ts` T9 — mock returns `freshness_hours: 528`; assert `· 22d 0h ago` renders. T10 — mock returns `freshness_hours: 72`; assert `[data-testid="history-freshness-stale"]` present.

#### AC-048-P1-03 FRESHNESS-MOCK-NULL
When `HISTORY_1H_PATH` does not exist on disk at startup, `freshness_hours` is `null`. Frontend omits `· Xd Yh ago` and does not render `data-testid="history-freshness-stale"`.

**Test:** `test_main.py` mock-data path asserts `freshness_hours` is `None`.

---

### Phase 2 — GitHub Actions scraper job

#### AC-048-P2-01 CRON-TRIGGER
`.github/workflows/scrape-history.yml` triggers at `cron: '0 3 * * *'` (03:00 UTC) and `workflow_dispatch`.

#### AC-048-P2-02 BINANCE-SOURCE
`scripts/scrape_history.py` fetches from `https://api.binance.com/api/v3/klines` for `symbol=ETHUSDT` at `interval=1h` and `interval=1d`. No API key.

#### AC-048-P2-03 CLOSED-ONLY
Only bars where Binance element `[6]` (`close_time` ms) < `current_time_ms` are persisted. Current in-progress candle excluded.

**Test:** `backend/tests/test_scraper.py` — mock response with one closed + one open bar; assert only closed bar in output.

#### AC-048-P2-04 BACKFILL-PAGINATE
Fetches all missing bars from `(latest_bar_date + 1 interval)` to now via a `while` loop advancing `startTime` by `limit * interval_ms` until fewer than `limit` closed bars returned.

**Test:** `test_scraper.py` — mock two pages of 1000 bars each; assert all 2000 present in output.

#### AC-048-P2-05 IDEMPOTENT
If no new closed bars returned, scraper exits without git commit.

**Test:** `test_scraper.py` — mock 0 new bars; assert no output rows added.

#### AC-048-P2-06 COMMIT-FORMAT
Commit message: `ops(scraper): append K-line bars YYYY-MM-DD [skip ci]` (UTC date of run).

#### AC-048-P2-07 DEPLOY-TRIGGER
After commit + push, workflow step runs `gcloud run deploy k-line-backend --region us-central1 --source .` using `GCP_SA_KEY` secret.

**Verification (manual, post-deploy):** `GET /api/history-info` `latest` on 1H advances past `2026-04-08 23:00` after first successful run.

#### AC-048-P2-08 FORMAT-MIGRATION-TEST
`backend/tests/test_history_db_contiguity.py` updated to handle both CSV formats:
- Old: `lines[0]` starts with `http` (CryptoDataDownload, descending)
- New: `lines[0]` is `date,open,high,low,close` (simple, ascending)

Existing no-gap, monotonic-date, and ≥129-bar-floor assertions apply to both formats.

#### AC-048-P2-09 PUSH-AUTH (setup gate — not a code AC)
`GH_PAT` and `GCP_SA_KEY` secrets documented in §5. Workflow uses `GH_PAT` for `git push`. Engineer to confirm secrets exist before marking Phase 2 ship-ready.

---

## 7. Phase Plan

### Phase 1 — Backend freshness + Frontend UI
**Files:** `backend/main.py`, `backend/models.py` (if `HistoryEntry` lives there — else inline in `main.py`), `frontend/src/AppPage.tsx`, `frontend/e2e/K-046-example-upload.spec.ts`, `backend/tests/test_main.py`

**Gate:** `python -m pytest backend/tests/test_main.py` + `npx tsc --noEmit` + Playwright `K-046-example-upload.spec.ts` green.

### Phase 2 — Scraper job
**Files:** `scripts/scrape_history.py` (new), `.github/workflows/scrape-history.yml` (new), `backend/tests/test_scraper.py` (new), `backend/tests/test_history_db_contiguity.py` (edit)

**Gate:** `python -m pytest backend/tests/test_scraper.py backend/tests/test_history_db_contiguity.py` green.

**Deploy dependency:** Phase 2 ships after Phase 1 is deployed. Secrets configured in GitHub before first cron run.

---

## 8. Release Status

- 2026-04-24 — K-ID stub created alongside K-046 forward pointer; not scheduled
- 2026-04-30 — Promoted backlog → open; full PRD + BQ rulings + QA Early Consultation + AC authored by PM; next gate = Architect

---

## Retrospective

### QA

**Regression tests that were insufficient:** `scroll-to-top` AC-K053-04 and `shared-components.spec.ts` Footer snapshot (`/about`, `/diary`) — both pre-existing reds not in known-reds manifest, introduced by K-059/K-067 layout changes without manifest update.
**Next time improvement:** Layout-touching tickets must regenerate snapshots or add known-red entries in the same PR; silent deferral is not acceptable.
