---
title: K-048 Auto Scraper — Architecture Design
ticket: K-048
phase: Phase 1 + Phase 2
status: ready-for-engineer
updated: 2026-04-30 (BQ-ARCH-048-01 resolved, upload-write item removed)
visual-spec: N/A — reason: no UI component additions, only text-format change in existing History Reference section
---

## 0 Scope Questions / BQ

### BQ-ARCH-048-01 — Cloud Run region mismatch [RESOLVED]

- **Ruling (PM 2026-04-30):** Use `region: asia-east1`. Confirmed by K-046 deploy record (`k-line-backend-00003-qdx` at `asia-east1.run.app`) and K-049 deploy record (`k-line-backend-00005-zn4` in `asia-east1`).
- **Action:** §5 workflow YAML updated to `region: asia-east1`. No open BQs remain.

---

## 1 Technical Option Selection

### Phase 1 — Computing `freshness_hours`

**Option A (conservative):** Compute inline in `get_history_info()` inside `main.py`. One extra `datetime.utcnow()` call per request, no new module.

- Applicable when: change surface is minimal and `HistoryEntry` dict is assembled in a single function.
- Trade-off: `main.py` grows by ~5 LOC; no structural downside.

**Option B (middle ground):** Add a `HistoryEntry` Pydantic model in `models.py` and serialize from there.

- Applicable when: `HistoryEntry` is already a Pydantic model reused across endpoints.
- Trade-off: requires import round-trip; current `get_history_info` returns plain `dict`, no Pydantic in that path.

**Option C (progressive):** Extract history freshness into a standalone `freshness.py` utility module.

- Applicable when: freshness logic is reused in multiple endpoints or is testable in isolation.
- Trade-off: new file overhead is unjustified for a single function used once.

**Recommendation: Option A.** `get_history_info` returns a plain `dict`; computing freshness inline keeps the change in one function, zero new files, matches existing style. Option B adds complexity for no gain since `HistoryEntry` is only a local type alias on the frontend.

### Phase 2 — Scraper import strategy

**Option A (conservative):** `scripts/scrape_history.py` imports `_merge_bars` + `_save_history_csv` directly from `backend/main.py`.

- Applicable when: `main.py` is importable without side-effects.
- Trade-off: importing `main.py` triggers FastAPI app construction and disk reads of both history files at module level; makes cron import unsafe.

**Option B (middle ground):** `scripts/scrape_history.py` duplicates the two ~20-line helper functions inline to avoid the side-effect import.

- Applicable when: helpers are simple enough to inline and the duplication risk is accepted.
- Trade-off: two definitions of the same logic; drift risk if one is updated without the other.

**Option C (progressive):** Extract `_merge_bars` + `_save_history_csv` into `backend/history_utils.py`; both `main.py` and `scraper.py` import from there.

- Applicable when: shared helpers justify a new module to prevent drift.
- Trade-off: requires editing `main.py` imports; small blast radius (two files touched: `main.py` + new `history_utils.py`).

**Recommendation: Option C.** Moving the two helpers into `backend/history_utils.py` eliminates the FastAPI app side-effect and keeps a single source of truth. The two helpers are pure utilities with no FastAPI dependency; extracting them is clean and safe.

---

## 2 API Contract Change

### GET `/api/history-info` — `HistoryEntry` schema extension

**Backend response (snake_case):**

```
{
  "1H": {
    "filename": "Binance_ETHUSDT_1h.csv",
    "latest": "2026-04-30 02:00",
    "bar_count": 74000,
    "freshness_hours": 25
  },
  "1D": {
    "filename": "Binance_ETHUSDT_d.csv",
    "latest": "2026-04-29",
    "bar_count": 3083,
    "freshness_hours": 3
  }
}
```

**Null contract:**

- `freshness_hours` is `None` / `null` when `path.exists()` is `False` at startup (mock data path).
- `freshness_hours` is `None` / `null` when `history[-1]['date']` is `None` (empty history list).
- `freshness_hours` is an `int` (floor, non-negative) in all other cases.

**Computation:** `int(math.floor((datetime.utcnow() - latest_bar_utc).total_seconds() / 3600))`

`latest_bar_utc` is parsed from `history[-1]['date']` using `datetime.strptime(date_str[:16], "%Y-%m-%d %H:%M")` for 1H (which has time component) and `datetime.strptime(date_str[:10], "%Y-%m-%d")` for 1D (date-only string).

**Field mapping (snake_case → camelCase):**

| Backend (Python) | Frontend (TypeScript) | Notes |
|---|---|---|
| `freshness_hours: int \| None` | `freshness_hours: number \| null` | Same name; no camelCase conversion needed |
| `filename: str` | `filename: string` | Unchanged |
| `latest: str \| None` | `latest: string \| null` | Unchanged |
| `bar_count: int` | `bar_count: number` | Unchanged |

**Boundary contracts:**

| Scenario | Backend behavior | Frontend behavior |
|---|---|---|
| CSV exists, `latest` valid | `freshness_hours = int`, ≥ 0 | Display `· Xd Yh ago` suffix |
| CSV not on disk (mock data path) | `freshness_hours = None` | Omit `· Xd Yh ago`; no stale indicator |
| `freshness_hours >= 48` | Returns int ≥ 48 | Render `data-testid="history-freshness-stale"` on wrapper div |
| `freshness_hours = 0` | Latest bar is current UTC hour | Display `· 0d 0h ago`; no stale indicator (0 < 48) |
| API unavailable / fetch error | n/a | `historyInfo` stays `null`; renders "Loading..." — no stale indicator triggered |

---

## 3 Frontend Field Mapping and Display Logic

### Type extension — `AppPage.tsx` local type (line 127)

Current:
```
type HistoryEntry = { filename: string; latest: string | null; bar_count: number }
```

New:
```
type HistoryEntry = { filename: string; latest: string | null; bar_count: number; freshness_hours: number | null }
```

### Freshness display format

Display string formula (inline JSX expression, no utility function needed):

```
if historyInfo is null:
  render "Loading..."

if freshness_hours is null:
  render "{filename} (latest: {latest} UTC+0)"

if freshness_hours is number:
  X = Math.floor(freshness_hours / 24)
  Y = freshness_hours % 24
  render "{filename} (latest: {latest} UTC+0 · {X}d {Y}h ago)"
```

Stale indicator wrapper (AC-048-P1-02):

```
wrapper div:
  if freshness_hours !== null && freshness_hours >= 48:
    add data-testid="history-freshness-stale"
  else:
    no data-testid (or a neutral testid so Playwright can assert count=0)
```

The wrapper div wraps the existing text content at lines 448–451 of `AppPage.tsx`. The stale `data-testid` lives on that wrapper, not on the inner text span.

### Component tree impact

Only `AppPage.tsx` is modified. No shared component is created. `HistoryEntry` type and `historyInfo` state are local to `AppPage.tsx`.

**Cross-page duplicate audit:** `grep -rn "history-reference\|historyInfo\|HistoryEntry" frontend/src/components frontend/src/pages` — expected zero hits. Confirmed no cross-page consumers; no shared primitive needed.

---

## 4 Scraper Script Architecture (`scripts/scrape_history.py`)

### Binance API response format

`GET https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=<1h|1d>&startTime=<ms>&limit=1000`

Each element in the response array:
```
[
  open_time_ms,    # [0] int — open timestamp in ms
  open,            # [1] str
  high,            # [2] str
  low,             # [3] str
  close,           # [4] str
  volume,          # [5] str
  close_time_ms,   # [6] int — close timestamp in ms (used for in-progress exclusion)
  ...              # [7..11] ignored
]
```

### Bar conversion

Each Binance kline element converts to `{ date, open, high, low, close }`:

- `date`: `normalize_bar_time(datetime.utcfromtimestamp(open_time_ms / 1000).strftime(...))`
- `open/high/low/close`: `float(element[1..4])`
- Exclude bar if `int(element[6]) >= now_ms` (AC-048-P2-03: close_time in future = in-progress candle)

### Pagination pseudocode

```
INTERVAL_MS = { "1h": 3_600_000, "1d": 86_400_000 }
limit = 1000

function fetch_new_bars(symbol, interval, start_time_ms, now_ms):
  all_bars = []
  cursor = start_time_ms
  while True:
    response = GET .../klines?symbol=symbol&interval=interval&startTime=cursor&limit=limit
    closed_bars = [bar for bar in response if int(bar[6]) < now_ms]
    all_bars.extend(convert(closed_bars))
    if len(closed_bars) < limit:
      break   # last page: fewer than limit closed bars means no more complete data
    cursor = cursor + limit * INTERVAL_MS[interval]
  return all_bars
```

### Idempotency contract

- `start_time_ms`: derived from `(latest_bar_date + 1 interval)` in the existing CSV, parsed via `load_csv_history` or direct CSV read.
- If no existing CSV: full backfill from a defined epoch (e.g., `2020-01-01 00:00 UTC`).
- If `fetch_new_bars` returns zero bars: print "No new bars", exit 0, no file write, no git commit.
- Before write: merge via `_merge_bars` (dedup by normalized date) then write via `_save_history_csv`.

### Boundary contracts

| Scenario | Behavior |
|---|---|
| No new closed bars | Exit 0, no file write, no git commit (AC-048-P2-05) |
| Exactly 1000 closed bars on first page | Continue to next page (not terminal) |
| Fewer than 1000 closed bars on any page | Terminal — break the loop |
| Binance returns 5xx / network timeout | Exception propagates; GitHub Actions marks job failed; failure email sent (BQ-048-03) |
| CSV does not exist yet | `existing = []`; full backfill from epoch |
| 1D CSV still in CryptoDataDownload format | `load_csv_history` handles both formats (existing logic); `_save_history_csv` writes simple format on first successful run (migration) |

---

## 5 GitHub Actions Workflow Skeleton

File: `.github/workflows/scrape-history.yml`

```yaml
name: Scrape K-Line History

on:
  schedule:
    - cron: '0 3 * * *'   # AC-048-P2-01: 03:00 UTC daily
  workflow_dispatch:       # AC-048-P2-01: manual trigger

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GH_PAT }}   # AC-048-P2-09: contents:write scope for push

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install requests   # scraper only needs requests + stdlib

      - name: Run scraper
        run: python scripts/scrape_history.py

      - name: Commit and push if changed
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add history_database/
          if git diff --cached --quiet; then
            echo "No new bars — skipping commit"
            exit 0
          fi
          TODAY=$(date -u +%Y-%m-%d)
          git commit -m "ops(scraper): append K-line bars ${TODAY} [skip ci]"
          git push

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}   # AC-048-P2-09

      - name: Deploy Cloud Run
        uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: k-line-backend
          region: asia-east1
          source: .
```

**Design notes:**

- The Deploy Cloud Run step runs unconditionally after every scraper run (even if no new bars). A no-op deploy is acceptable; Cloud Run redeploys the same image idempotently. If PM prefers skipping deploy when no new bars, Engineer should expose `NEW_BARS` env var from the scraper exit code — this is not modeled in the default design.
- `[skip ci]` in commit message satisfies AC-048-P2-06. Cloud Build trigger must be configured to honor it (manual setup gate, AC-048-P2-09).

---

## 6 `backend/history_utils.py` (new file)

Contains exactly two functions extracted from `main.py`:

- `_merge_bars(existing: list, new_bars: list) -> list` — unchanged logic; dedup by normalized `date`, sort chronologically
- `_save_history_csv(bars: list, path: Path) -> None` — unchanged logic; writes `date,open,high,low,close` simple format

Both functions import `normalize_bar_time` from `time_utils` and `csv`, `Path` from stdlib. No FastAPI, no disk reads on import.

`main.py` changes:
- Remove local `_merge_bars` and `_save_history_csv` definitions (lines 45–65)
- Add: `from history_utils import _merge_bars, _save_history_csv`

`scripts/scrape_history.py` imports:
```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
from history_utils import _merge_bars, _save_history_csv
from time_utils import normalize_bar_time
```

---

## 7 `test_history_db_contiguity.py` Format Detection Update (AC-048-P2-08)

### Current behavior (lines 33–48)

`_load_dates_ascending()` reads `rows[2:]`, parses `row[1]` as date — hardcoded for CryptoDataDownload format:
- `rows[0]` = URL comment starting with `http`
- `rows[1]` = column header
- `rows[2+]` = data, date in column index 1

### New format (post-migration, written by `_save_history_csv`)

- `rows[0]` = `date,open,high,low,close` (header)
- `rows[1+]` = data, date in column index 0

### Replacement logic for `_load_dates_ascending`

Format detection (replaces hardcoded `rows[2:]` + `row[1]`):

```
if rows[0][0].strip().startswith('http'):
  # CryptoDataDownload format
  data_rows = rows[2:]      # skip URL line + header line
  date_col = 1
else:
  # Simple format (date,open,high,low,close header)
  data_rows = rows[1:]      # skip header line only
  date_col = 0
```

The three existing test assertions (`strictly_monotonic_ascending`, `no_gap_greater_than_one_day`, `freshness_floor_within_seven_days`) operate on the returned `dates` list — no changes needed to the assertion functions themselves.

`FRESHNESS_FLOOR_DAYS = 7` remains correct as a regression guard for the K-048 daily-scraper SLA.

---

## 8 File Change List

| File | Action | Description |
|---|---|---|
| `backend/history_utils.py` | New | Extracted `_merge_bars` + `_save_history_csv`; shared between `main.py` and the scraper; no FastAPI dependency |
| `backend/main.py` | Edit | (a) `from history_utils import _merge_bars, _save_history_csv`; (b) delete local definitions of those two functions (lines 45–65); (c) add `freshness_hours` computation to `get_history_info` (lines 121–132) |
| `backend/tests/test_main.py` | Edit | Extend `test_history_info_returns_1h_and_1d` (AC-TEST-HISTORY-INFO-1): assert `freshness_hours` is `int` or `None` in both entries; add a second test using monkeypatched non-existent path to assert `freshness_hours` is `None` (AC-048-P1-03) |
| `backend/tests/test_scraper.py` | New | Unit tests: (a) closed-only filter — mock one closed + one open bar, assert one output row (AC-048-P2-03); (b) pagination — mock two pages of 1000 bars each, assert 2000 output rows (AC-048-P2-04); (c) idempotent — mock 0 new bars, assert no output rows (AC-048-P2-05) |
| `backend/tests/test_history_db_contiguity.py` | Edit | Replace `_load_dates_ascending` inner logic with format-detection branching per §7; no changes to assertion functions |
| `scripts/scrape_history.py` | New | Fetch 1H + 1D bars from Binance; pagination loop; exclude in-progress; merge + save; exit 0 if no new bars |
| `.github/workflows/scrape-history.yml` | New | Cron `0 3 * * *` + `workflow_dispatch`; run scraper; commit with `[skip ci]`; deploy Cloud Run |
| `frontend/src/AppPage.tsx` | Edit | (a) Extend local `HistoryEntry` type (line 127) with `freshness_hours: number \| null`; (b) History Reference render (lines 445–452): display freshness string + stale indicator div |
| `frontend/e2e/K-046-example-upload.spec.ts` | Edit | Add T9 (mock `freshness_hours: 528`; assert `· 22d 0h ago` renders) and T10 (mock `freshness_hours: 72`; assert `[data-testid="history-freshness-stale"]` present) |

---

## 9 Boundary Pre-emption Table

| Boundary scenario | Defined? | Detail |
|---|---|---|
| `freshness_hours` null (mock path) | Yes | `path.exists()` = False → return `None`; frontend omits `· Xd Yh ago` |
| `freshness_hours = 0` (latest bar in current UTC hour) | Yes | Floor(0) = 0 → "0d 0h ago"; no stale indicator (0 < 48) |
| `freshness_hours = 48` exactly | Yes | `>= 48` threshold from AC-048-P1-02; exactly 48 triggers stale indicator |
| Binance returns in-progress candle | Yes | `close_time_ms >= now_ms` filter; excluded before merge |
| Pagination gap > 1000 bars | Yes | `while` loop advancing `cursor` by `limit * interval_ms` |
| No new closed bars returned | Yes | Exit 0, no file write, no git commit (AC-048-P2-05) |
| Empty history CSV (no rows) | Yes | `existing = []`; full backfill from epoch |
| 1D CSV still in CryptoDataDownload format | Yes | `test_history_db_contiguity.py` detects both formats; `_save_history_csv` migrates on first write |
| Binance API error (5xx / timeout) | Yes | Exception propagates → Actions job fails → failure email (BQ-048-03) |
| Git push fails (branch protection) | Yes | `GH_PAT` with `contents: write` scope required (AC-048-P2-09 setup gate) |
| `[skip ci]` loop prevention | Yes | Commit message contains `[skip ci]`; Cloud Build trigger must honor it (AC-048-P2-06 + setup gate) |

---

## 10 Refactorability Checklist

- [x] **Single responsibility:** `history_utils.py` (merge + save), `scrape_history.py` (fetch + CLI entry point), `main.py` (routes only after extraction)
- [x] **Interface minimization:** scraper imports two pure functions from `history_utils`; no FastAPI coupling
- [x] **Unidirectional dependency:** `scraper → history_utils ← main`; no cycles
- [x] **Replacement cost:** swapping Binance URL to another exchange affects one function in `scrape_history.py` only
- [x] **Clear test entry point:** `test_scraper.py` tests scraper functions with mock HTTP; `test_main.py` tests freshness via `make_client` + `monkeypatch`
- [x] **Change isolation:** frontend `HistoryEntry` type extension does not affect predict/upload/example endpoints; upload write path remains disabled per K-046 (out of K-048 scope)

---

## 11 All-Phase Coverage Gate

| Phase | Backend API | Frontend Routes | Component Tree | Props Interface |
|---|---|---|---|---|
| Phase 1 | `GET /api/history-info` extended (§2) | `/app` only | `AppPage.tsx` History Reference section (§3) | Local `HistoryEntry.freshness_hours: number \| null` (§3) |
| Phase 2 | No new endpoint; scraper writes CSV directly | N/A | N/A | N/A |

---

## 12 Implementation Order

### Phase 1 (standalone; must deploy before Phase 2 ships)

1. Create `backend/history_utils.py` with `_merge_bars` + `_save_history_csv`.
2. Edit `backend/main.py`: import from `history_utils`; remove local definitions; add `freshness_hours` to `get_history_info`. Upload write path (`/api/upload-history` write side) remains disabled per K-046; do NOT restore the `TODO(K-048)` block.
3. Edit `backend/tests/test_main.py`: extend AC-TEST-HISTORY-INFO-1; add mock-data null test.
4. Gate: `python -m pytest backend/tests/test_main.py` green.
5. Edit `frontend/src/AppPage.tsx`: extend `HistoryEntry` type; update History Reference render block.
6. Edit `frontend/e2e/K-046-example-upload.spec.ts`: add T9 and T10.
7. Gate: `npx tsc --noEmit` + Playwright `K-046-example-upload.spec.ts` green.

### Phase 2 (after Phase 1 is deployed; secrets must be configured before first cron run)

1. Write `scripts/scrape_history.py` (imports from `backend/history_utils`).
2. Write `backend/tests/test_scraper.py`.
3. Edit `backend/tests/test_history_db_contiguity.py`: format-detection logic in `_load_dates_ascending`.
4. Gate: `python -m pytest backend/tests/test_scraper.py backend/tests/test_history_db_contiguity.py` green.
5. Write `.github/workflows/scrape-history.yml` (region: `asia-east1` per BQ-ARCH-048-01 ruling).
6. Confirm `GH_PAT` + `GCP_SA_KEY` secrets exist in GitHub repo settings.
7. Confirm Cloud Build trigger is configured to skip builds on `[skip ci]`.

---

## 13 Risks and Notes

| Risk | Severity | Mitigation |
|---|---|---|
| `sys.path.insert` in scraper | Low | Required to import `history_utils` + `time_utils` from the `backend/` sibling directory without packaging; acceptable for a scripts/ one-off. |
| Binance public API rate limits | Low | 1200 req/min limit; daily single run with 1-2 pages per interval is well within bounds. |
| `[skip ci]` not honored by Cloud Build | Medium | If Cloud Build does not skip on `[skip ci]`, each scraper commit triggers a full redeploy loop. AC-048-P2-09 setup gate requires manual verification before Phase 2 ships. Engineer must document verification result. |
| `test_history_db_contiguity.py` must ship with Phase 2 | High | The test uses CryptoDataDownload-format assumptions for `Binance_ETHUSDT_d.csv`. After the first scraper run migrates the file to simple format, the test will fail on `row[1]` parse. `test_history_db_contiguity.py` edit must ship in Phase 2 before or alongside the workflow activation. |

---

## Consolidated Delivery Gate

```
Architect delivery gate (K-048):
  all-phase-coverage=OK,
  pencil-frame-completeness=N/A — no visual component changes,
  visual-spec-json-consumption=N/A — visual-spec: N/A in frontmatter,
  sacred-ac-cross-check=N/A — no JSX node deletion/rename; History Reference section text content only,
  route-impact-table=N/A — ticket scoped to /app with no global CSS or shared primitive touch,
  cross-page-duplicate-audit=OK — grepped "historyInfo|HistoryEntry|history-reference" in frontend/src/components frontend/src/pages; zero cross-page consumers confirmed,
  target-route-consumer-scan=N/A — no route navigation behavior change,
  architecture-doc-sync=pending (ssot/system-overview.md update to follow),
  self-diff=N/A — new design doc; no prior version to diff,
  output-language=OK
  → OK — all BQs resolved; ready for Engineer
```

---

## Retrospective

**Where most time was spent:** Discovering the Cloud Run region discrepancy required cross-reading K-049 deploy record and K-046 gcloud update command; the ticket stated `us-central1` but both deploy artifacts point to `asia-east1`.

**Which decisions needed revision:** Initially drafted Option A (scraper imports directly from `main.py`), then pivoted to Option C (extract `history_utils.py`) after confirming `main.py` constructs the FastAPI app and reads history CSVs at module level — unsafe for a cron import.

**Next time improvement:** When a new script needs to import from an existing FastAPI module, check module-level side-effects first (`grep -n "^[a-zA-Z_]" <file>` at top-level lines) before selecting the import architecture option.
