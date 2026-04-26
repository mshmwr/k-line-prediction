---
ticket: K-051
phase: 3b + 3c
author: Architect
created: 2026-04-26
updated: 2026-04-26
visual-spec: N/A — backend pytest + frontend e2e only; no Pencil frame, `/app` is K-021 §2 dev-tool exemption (visual-delta=none)
qa-early-consultation: docs/retrospectives/qa.md 2026-04-26 K-051 Phase 3 (Verdict BLOCK→RELEASE-OK after PM addressed B1-B5)
sacred-regression: [K-015 ma_history requires ≥129 daily bars ending at input date]
---

# K-051 Phase 3b/3c — Permanent Regression Coverage Design

## 0 Scope Questions (resolved before delivery — none open)

- **SQ-051-PHASE3-01 — `/api/predict-stats` mock?** PM instruction text mentioned mocking both `/predict` and `/predict-stats`. Code-level dry-run shows main.py exposes `/api/predict` + `/api/merge-and-compute-ma99` + `/api/upload-history` + `/api/history-info` only — there is NO `/api/predict-stats` endpoint. AC-051-09 ticket text only says `/api/predict`, which is correct. **Resolution:** mock `/api/predict` + `/api/merge-and-compute-ma99` + `/api/history-info` (matching `usePrediction` hook call pattern verified in `frontend/e2e/ma99-chart.spec.ts:150-158`). PM instruction text was a misstatement; ticket AC is authoritative. No PM ruling required — verifiable from code.
- **SQ-051-PHASE3-02 — mock-apis.ts shared helper extraction?** `frontend/e2e/_fixtures/mock-apis.ts` currently exposes only catch-all `/api/**` + `/api/history-info`. The full predict-flow constants (`MOCK_PREDICT_BASE`, `MOCK_STATS`, `MOCK_HISTORY_INFO`, `QUERY_MA99`) live inline in `frontend/e2e/ma99-chart.spec.ts:20-89`. Three options: (α) duplicate constants verbatim into the new K-051 spec, (β) extract a shared helper in `mock-apis.ts` and refactor `ma99-chart.spec.ts` to consume it, (γ) cross-spec import from `ma99-chart.spec.ts`. Recommendation in design: **α (verbatim duplication)** — β expands K-051 scope into ma99 spec refactor (out of ticket), γ creates a fragile cross-spec dependency. Engineer copies the four constants from `ma99-chart.spec.ts:20-89` into `K-051-real-1h-csv-upload.spec.ts` with a one-line JSDoc pointer to the canonical source. Re-evaluate β when the third spec needs the same constants (rule-of-three). **No PM BQ** — Architect ruling within design authority (test fixture code organization, not AC text).

## 1 Pre-Design Audit (truth table backed by `git show HEAD:` evidence)

### 1.1 Backend code-level facts

| Fact | Evidence (path:line) | Verbatim |
|------|----------------------|---------|
| MA constants sum = 129 | `backend/predictor.py:8,11` | `MA_WINDOW = 99` ; `MA_TREND_WINDOW_DAYS = 30` ; sum = 129 |
| Sacred ValueError exact text | `backend/predictor.py:333-336` | `raise ValueError(f"Unable to compute 30-day MA99 trend for {input_end_time}: " "ma_history requires at least 129 daily bars ending at that date.")` |
| `find_top_matches` signature | `backend/predictor.py:314-321` | `find_top_matches(input_bars, future_n=72, history=None, timeframe='1H', ma_history=None, history_1d=None)` |
| ma_history defaults to history when None | `backend/predictor.py:322-325` | `if history is None: history = MOCK_HISTORY` then `if ma_history is None: ma_history = history` |
| Daily DB load mechanism | `backend/main.py:14,17,22-30` | `HISTORY_1D_PATH = HISTORY_DB / "Binance_ETHUSDT_d.csv"` ; `_history_1d = _load_or_mock(HISTORY_1D_PATH)` |
| `load_csv_history` parses CryptoDataDownload | `backend/mock_data.py:30-53` | header at line 1 is URL → `header_idx = 1` (DictReader starts at line 2) ; `bars.reverse()` returns chronological-ascending dicts |
| Daily DB on-disk shape | `history_database/Binance_ETHUSDT_d.csv` (HEAD) | L1 = `https://www.CryptoDataDownload.com` ; L2 = header `Unix,Date,Symbol,Open,High,Low,Close,Volume ETH,Volume USDT,tradecount` ; L3 = newest `2026-04-08` ; L3157 = oldest `2017-08-17` ; total `wc -l` = 3157 (1 URL + 1 header + 3155 data) |
| Existing pytest convention | `backend/tests/test_predictor.py:1-50, 652` | no `pytest.ini` / `pyproject.toml` ; tests use plain `pytest` ; `@pytest.mark.parametrize` already present ; **no `integration` marker convention exists in repo** |
| conftest pattern | `backend/tests/conftest.py:1-15` | `make_client` fixture monkeypatches env + reloads `auth` + `main` modules — pattern only relevant for HTTP route tests |

### 1.2 Frontend code-level facts

| Fact | Evidence (path:line) | Verbatim |
|------|----------------------|---------|
| `parseOfficialCsvFile` strict 24-row gate | `frontend/src/AppPage.tsx:48-82` | `const OFFICIAL_ROW_COUNT = 24` ; `if (rows.length !== OFFICIAL_ROW_COUNT) throw new Error(\`${filename}: expected ${OFFICIAL_ROW_COUNT} rows, got ${rows.length}.\`)` |
| BOM behaviour (no strip) | `frontend/src/AppPage.tsx:48-58, 24-29` | `parseOfficialCsvFile` does NOT strip `﻿` ; first cell goes to `parseExchangeTimestamp(cols[0])` → `Number(raw)` returns `NaN` on BOM-prefixed digits → `throw new Error(\`Invalid timestamp: ${raw}\`)` ; **fixture MUST be UTF-8 byte-clean** |
| Header-row tolerance (none) | `frontend/src/AppPage.tsx:54-66` | first cell `parseExchangeTimestamp(cols[0])` ; non-numeric first column → `throw new Error(\`Invalid timestamp: ...\`)` ; **fixture MUST be headerless** |
| OFFICIAL INPUT file input locator | `frontend/src/AppPage.tsx:362-374` | `<label>` wrapping `<input type="file" accept=".csv,text/csv" multiple className="hidden" .../>` inside `[data-testid="official-input-section"]` ; canonical Playwright selector = `page.locator('input[type="file"][multiple]')` per `ma99-chart.spec.ts:164` |
| Error toast bar (negative assertion target) | `frontend/src/AppPage.tsx:349-353` | `{errorMessage && (<div className="mx-4 mt-1 text-red-400 text-xs border border-red-700 rounded px-3 py-1.5 bg-red-950 ...">✗ {errorMessage}</div>)}` ; selector = `.text-red-400` |
| Predict flow API calls | `frontend/e2e/ma99-chart.spec.ts:150-158` | mocks `/api/history-info` + `/api/merge-and-compute-ma99` + `/api/predict` (NO `/api/predict-stats`) |
| Setup helper canonical pattern | `frontend/e2e/ma99-chart.spec.ts:145-174` | register 3 mocks → `goto('/app')` → `page.locator('input[type="file"][multiple]').setInputFiles([...])` → `await expect(page.getByRole('button', { name: /Start Prediction/ })).toBeEnabled({ timeout: 5000 })` → click |
| Realistic predict payload (B5 reuse target) | `frontend/e2e/ma99-chart.spec.ts:51-89` | `MOCK_PREDICT_BASE.matches[0].future_ohlc.length === 2` ✓ ; `MOCK_STATS` has all `PredictStats` fields ✓ |
| `_fixtures/mock-apis.ts` current scope | `frontend/e2e/_fixtures/mock-apis.ts:26-42` | catch-all `/api/**` → `{ status: 200, body: '{}' }` + specific `/api/history-info` ; **NO `/api/predict` mock** ; LIFO rule: caller registers specific mocks AFTER `mockApis(page)` |
| K-046 setInputFiles reference | `frontend/e2e/K-046-example-upload.spec.ts:97-99` | locator targets `[data-testid="history-reference-section"] input[type="file"]` (history-reference, NOT official-input) ; for K-051 use `ma99-chart.spec.ts:164` pattern instead |

### 1.3 B1–B5 verification grid

| AC | Target file | Change type | Depends on (verified line) | Exit gate |
|----|-------------|-------------|----------------------------|-----------|
| B1 / AC-051-07 | `backend/tests/test_history_db_contiguity.py` (NEW) | new pytest file | `history_database/Binance_ETHUSDT_d.csv` L2 header schema; `MA_TREND_WINDOW_DAYS` import via `from predictor import MA_TREND_WINDOW_DAYS, MA_WINDOW` (predictor.py:8,11) | `pytest backend/tests/test_history_db_contiguity.py` exit 0; assertion failure surfaces gap with the exact missing date pair |
| B2 / AC-051-08 positive | `backend/tests/test_predict_real_csv_integration.py` (NEW) | new pytest file | `find_top_matches` (predictor.py:314); `load_csv_history` (mock_data.py:30); `HISTORY_1D_PATH` (main.py:17) | `pytest -k test_real_db_real_csv_returns_matches` exit 0; ≥1 match returned without raising |
| B3 / AC-051-08 negative | same file as B2, separate test function | new pytest test (same file) | exact ValueError substring at `predictor.py:335` | `pytest.raises(ValueError, match=re.escape("ma_history requires at least 129 daily bars ending at that date"))` |
| B3 fixture | `backend/tests/fixtures/ETHUSDT-1h-2026-04-07-original.csv` (NEW) | new fixture | `parseOfficialCsvFile` parser shape (AppPage.tsx:48-82) — backend integration test does NOT use frontend parser, but fixture shape must match what backend `find_top_matches` accepts via `load_official_day_csv` semantics; commit fixture as canonical regenerated 24-bar UTC slice | byte-clean, headerless, 24 rows, comma-delimited, Unix-ms first column |
| B4 / AC-051-09 positive | `frontend/e2e/upload-real-1h-csv.spec.ts` (NEW) | new Playwright spec | `page.locator('input[type="file"][multiple]')` (AppPage.tsx:364-373); `[data-testid="official-input-section"]` (AppPage.tsx:356) | `npx playwright test upload-real-1h-csv` exit 0; chart visible, MatchList populated |
| B4 fixture | `frontend/e2e/fixtures/ETHUSDT-1h-2026-04-07.csv` (NEW; new directory) | new fixture | `parseOfficialCsvFile` strict gate (AppPage.tsx:48-82) | byte-clean, headerless, 24 rows, comma-delimited, Unix-ms first column; same content as backend fixture B3 (mirrored) |
| B5 / AC-051-09 mock | within `upload-real-1h-csv.spec.ts` | inline route handlers | `MOCK_PREDICT_BASE` shape (ma99-chart.spec.ts:51-89, future_ohlc.length=2, MOCK_STATS complete); `mockApis(page)` LIFO rule (mock-apis.ts:6-25) | spec runs without `computeDisplayStats` fallback to appliedData.stats; no runtime undefined-field crash |

## 2 Backend Module Design — AC-051-07 (B1)

### 2.1 File and structure

**File:** `backend/tests/test_history_db_contiguity.py` (NEW; ~80 LOC)

**Why a separate file (not extend `test_predictor.py`):**

- `test_predictor.py` is **pure-function tests** with synthetic inputs (`MOCK_HISTORY`). AC-051-07 requires reading the **on-disk canonical CSV** as integration evidence. Mixing on-disk-file dependency into `test_predictor.py` couples a 70-test pure suite to filesystem state.
- AC-051-07 says verbatim: "the test loads the actual `history_database/Binance_ETHUSDT_d.csv` (not a synthetic fixture), so a future drift like the 2026-03-20 → 2026-04-08 gap would fail loud the moment a new gap appears". Separate file makes the failure reason self-evident from the test filename.
- Discovery: `pytest backend/tests/` (default) picks up both files; no marker needed to opt in.

**No pytest marker** — repo has no existing `integration` marker convention (verified §1.1). AC-051-07 says "wired into the project pytest suite so CI reruns it on every backend change" — default discovery satisfies that.

### 2.2 Function signatures (pseudo-code)

```text
# backend/tests/test_history_db_contiguity.py
"""
AC-051-07 — Daily history DB contiguity + freshness regression coverage.

Loads the on-disk canonical history_database/Binance_ETHUSDT_d.csv and asserts:
  (i)   strictly-monotonic ascending date sequence (no duplicates, no zigzag)
  (ii)  every consecutive pair gap == 1 calendar day (no missing day)
  (iii) freshness floor: last_row.date >= TODAY - 7 days (K-048 SLA)

The 2026-03-20 → 2026-04-08 K-051 gap class would have failed (ii); a future
DB-shrink that drops only the head still fails (iii).

Loads via raw csv.reader (not load_csv_history) so the test exercises the
on-disk bytes directly, not the post-processed loader output.
"""
from datetime import date, datetime, timedelta
from pathlib import Path
import csv

# Path resolution: walk up from this test file to repo root
HISTORY_DB_PATH = Path(__file__).resolve().parents[2] / "history_database" / "Binance_ETHUSDT_d.csv"

# Module constant (N1 non-blocking — Engineer may parametrize MAX_GAP_DAYS = 1)
MAX_GAP_DAYS = 1
FRESHNESS_FLOOR_DAYS = 7  # matches K-048 auto-scraper SLA

def _load_dates_ascending() -> list[date]:
    """
    Read on-disk CSV, skip the URL line + header line, parse row[1] (Date column)
    of every data row with datetime.strptime(row[1], "%Y-%m-%d").date().
    Return a list sorted ascending (input file is descending; sort here, do not reverse,
    so a future re-ordering of the file is detected by the strict-monotonic assertion).
    """

def test_history_db_dates_strictly_monotonic_ascending():
    """B1 assertion: no duplicates, no descending pair after the sort.
    A naive `(d2 - d1).days <= 1` check would silently pass on duplicates (delta=0)
    and on zigzag (delta=-1). This test checks delta > 0 strictly.
    """

def test_history_db_dates_no_gap_greater_than_one_day():
    """B1 assertion: every consecutive pair gap == MAX_GAP_DAYS (= 1) calendar day.
    K-051's 16-bar gap (2026-03-20 → 2026-04-08) would fail here.
    Failure message MUST include the offending date pair so triage points at the
    exact missing window without re-running.
    """

def test_history_db_freshness_floor_within_seven_days():
    """B1 assertion: last_row.date >= TODAY - 7 days.
    Without this, a future shrink that drops only the head still passes (i)+(ii)
    but loses 1H upload window space — and freshness was the K-051 root cause.
    """
```

### 2.3 Boundary contract

| Boundary | Behavior | Source |
|----------|----------|--------|
| Empty CSV | `_load_dates_ascending()` returns `[]` → first test ALSO asserts `len(dates) > 0` (no silent vacuous pass) | new check, design-level |
| Duplicate-date row | `(d2 - d1).days == 0` → strictly-monotonic test fails with `"duplicate date <X> appears at indices <i>, <j>"` | B1 explicit |
| Zigzag (descending pair after sort would only happen if sort fails) | sort-then-pair-walk; if pair-walk finds `d2 < d1` → strict-monotonic fails | B1 explicit |
| 16-bar gap (K-051 actual) | gap-detector test fails with `"gap of 16 days between 2026-03-20 and 2026-04-08"` | B1 explicit |
| Stale DB (last_row > 7d old) | freshness test fails with `"last_row.date 2026-03-27 is 12 days behind TODAY 2026-04-08; freshness floor breach"` | B1 freshness |
| Path resolution wrong | `HISTORY_DB_PATH.exists()` False → tests fail with `FileNotFoundError`; QA hydration drift policy (K-Line CLAUDE.md §Worktree Hydration Drift) tells QA to re-run in canonical | inherited from AC-051-06 |
| TODAY clock skew | uses `date.today()` (local clock, UTC-anchored interpretation matches Binance daily ISO dates per QA retro line 27) | acceptable; documented in test docstring |

## 3 Backend Integration Test Design — AC-051-08 (B2 + B3)

### 3.1 File and structure

**File:** `backend/tests/test_predict_real_csv_integration.py` (NEW; ~120 LOC)

**Mode (B2 PM ruling Option A — live DB, NOT pinned fixture):**

The test loads `history_database/Binance_ETHUSDT_d.csv` at runtime using the production loader `load_csv_history`. Reproducibility is sacrificed deliberately so a future DB shrink fails this test rather than hides behind a frozen fixture. AC-051-07 contiguity layer catches the shrink shape; AC-051-08 catches the user-visible failure shape.

**No pytest marker** — same rationale as §2.1. The test runs on every `pytest backend/tests/` invocation, which is exactly the freshness pressure the AC requires.

### 3.2 Function signatures (pseudo-code)

```text
# backend/tests/test_predict_real_csv_integration.py
"""
AC-051-08 — Real-DB + real-1H-CSV integration regression coverage.

Positive case: K-051 user-visible bug shape (uploading 2026-04-07 1H CSV against
post-K-051 daily DB → /api/predict succeeds with ≥1 match).

Negative case (K-015 sacred regression anchor): DB truncated to 128 bars ending
at 2026-04-07 → ValueError with the exact substring K-051 user-retest SOP greps.
"""
from datetime import datetime
from pathlib import Path
import csv
import re
import shutil

import pytest

# Backend imports — fixtures dir is package-importable, predictor is importable
from predictor import find_top_matches, MA_TREND_WINDOW_DAYS, MA_WINDOW
from mock_data import load_csv_history, load_official_day_csv

REPO_ROOT = Path(__file__).resolve().parents[2]
LIVE_DAILY_DB_PATH = REPO_ROOT / "history_database" / "Binance_ETHUSDT_d.csv"
REAL_1H_CSV_FIXTURE = Path(__file__).parent / "fixtures" / "ETHUSDT-1h-2026-04-07-original.csv"

# Constants from production code — imported, NOT hard-coded
MIN_DAILY_BARS = MA_TREND_WINDOW_DAYS + MA_WINDOW  # 30 + 99 = 129

# Exact substring from predictor.py:335 (K-015 sacred + K-051 user-message stability)
SACRED_VALUE_ERROR_SUBSTRING = "ma_history requires at least 129 daily bars ending at that date"


def _load_real_1h_input_bars() -> list[dict]:
    """
    Load the committed 24-bar 1H CSV fixture as backend OHLCBar-shaped dicts.
    Reuses backend/mock_data.py::load_official_day_csv since that is the
    function backend uses for 1H official-input parsing — symmetry with prod path.
    """


def test_real_db_real_csv_returns_matches(tmp_path: Path):
    """
    B2 positive: live DB (≥129 daily bars ending 2026-04-08) + real 24-bar 1H CSV
    ending 2026-04-07 → find_top_matches returns ≥1 match without raising.

    Pins the exact failure mode of K-051 in CI permanently. If the DB shrinks
    below the 129-bar floor ending at the input date, this test fails with the
    Sacred ValueError — ratifying both the regression and the user-message.
    """


def test_truncated_db_raises_sacred_value_error(tmp_path: Path):
    """
    B3 negative (K-015 sacred regression): copy live DB to tmp_path, truncate to
    128 bars ending 2026-04-07, call find_top_matches → must raise ValueError
    whose message contains SACRED_VALUE_ERROR_SUBSTRING (verbatim).

    Uses re.escape() in pytest.raises(match=...) since the substring contains
    no regex metacharacters but defensive escape avoids future drift.
    """


def test_min_daily_bars_constant_is_imported_not_magic(tmp_path: Path):
    """
    Drift guard: assert MIN_DAILY_BARS == 129 by reading the runtime sum of
    imported constants (not a hard-coded 129). If a future refactor changes
    MA_WINDOW or MA_TREND_WINDOW_DAYS, this test reveals the drift; tests above
    that depend on '128 bars' as 'one short of 129' must be updated together.
    """
```

### 3.3 Fixture regeneration documentation (B3 mandate)

The original user-uploaded `ETHUSDT-1h-2026-04-07.csv` is unrecoverable. The committed `backend/tests/fixtures/ETHUSDT-1h-2026-04-07-original.csv` is an equivalent-shape regenerated slice. **Engineer MUST embed in the fixture file as a comment-prefixed docstring (or accompanying README.md sibling), the regeneration command + date** so future drift is auditable. Example header content (Engineer chooses comment vs sibling README based on whether `parseOfficialCsvFile` tolerates a leading `# ` line — it does NOT (numeric-first-column gate). Therefore: ship a sibling `backend/tests/fixtures/ETHUSDT-1h-2026-04-07-original.README.md` documenting:

```
Source: Binance public klines API
Endpoint: GET https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=1h&startTime=<2026-04-07T00:00:00Z ms>&endTime=<2026-04-07T23:59:59Z ms>
Regenerated: 2026-04-26
Shape: 24 rows × 12 columns trimmed to 5 (Unix ms, open, high, low, close)
Equivalence: byte-replays the K-051 trigger CSV's structural shape; numeric values
are Binance-canonical for the same UTC day, not byte-identical to the user's lost upload.
```

### 3.4 Boundary contract

| Boundary | Behavior | Source |
|----------|----------|--------|
| Live DB has gap (re-emergence of K-051 bug class) | positive test fails with Sacred ValueError raised by `find_top_matches` | AC-051-08 explicit |
| Live DB shrunk below 129 bars ending input date | positive test fails with same Sacred ValueError | AC-051-08 explicit |
| 128-bar truncated DB raises non-Sacred ValueError | negative test fails (`pytest.raises match=` mismatch) | B3 explicit |
| Sacred message text reworded | negative test fails — telemetry stability anchor | B3 explicit |
| `MA_WINDOW + MA_TREND_WINDOW_DAYS` changes | drift-guard test fails; integration tests must be updated together | new check, design-level |
| Fixture missing / corrupt | both tests fail at fixture load → fail-fast, not skip | acceptable |
| Live DB file missing | both tests fail at `load_csv_history(LIVE_DAILY_DB_PATH)` → fail-fast | acceptable |

## 4 Frontend E2E Design — AC-051-09 (B4 + B5)

### 4.1 File and structure

**Spec:** `frontend/e2e/upload-real-1h-csv.spec.ts` (NEW; ~150 LOC)
**Fixture:** `frontend/e2e/fixtures/ETHUSDT-1h-2026-04-07.csv` (NEW file in NEW directory)
**Fixture content rule:** byte-identical to `backend/tests/fixtures/ETHUSDT-1h-2026-04-07-original.csv` so backend integration test and frontend E2E exercise the same input shape. Engineer copies the bytes (not a symlink — both directories are committed to git, two physical copies is acceptable to keep boundaries clean: backend tests and frontend e2e are separate test frameworks).

### 4.2 Driver pattern (B4 verbatim — NOT label-click + fileChooser)

The QA retro pointed at K-046 spec line 97-99 as the proven pattern, but that line targets `[data-testid="history-reference-section"] input[type="file"]` (the **history-reference** input, which Phase 2 of K-046 hid). For K-051 the target is the **OFFICIAL INPUT** section's multi-select file input. The canonical pattern is at `frontend/e2e/ma99-chart.spec.ts:163-168`:

```text
// AppPage.tsx:362-374 wraps a hidden <input type="file" multiple> in a <label>.
// Playwright drives hidden inputs directly via setInputFiles — no label click,
// no fileChooser, no flake.
const fileInput = page.locator('input[type="file"][multiple]')
await fileInput.setInputFiles([
  { name: 'ETHUSDT-1h-2026-04-07.csv', mimeType: 'text/csv', buffer: <fixture-bytes> },
])
```

Buffer comes from reading `frontend/e2e/fixtures/ETHUSDT-1h-2026-04-07.csv` via Node `readFileSync` at the top of the spec file. Single-file array (the fixture is one 24-row file ending at 2026-04-07) — this differs from `ma99-chart.spec.ts` which uses two files for a 48-bar 2-day input.

### 4.3 Mock plan (B5 — payload realism)

Mock three endpoints in this LIFO order (per `_fixtures/mock-apis.ts:6-25` invariant):

```text
await mockApis(page)  // catch-all + /api/history-info — registered FIRST per LIFO
await page.route('/api/history-info', route =>
  route.fulfill({ status: 200, contentType: 'application/json',
                  body: JSON.stringify(MOCK_HISTORY_INFO) }))  // re-register to override
await page.route('/api/merge-and-compute-ma99', route =>
  route.fulfill({ status: 200, contentType: 'application/json',
                  body: JSON.stringify({ query_ma99_1h: QUERY_MA99, query_ma99_gap_1h: null }) }))
await page.route('/api/predict', route =>
  route.fulfill({ status: 200, contentType: 'application/json',
                  body: JSON.stringify(MOCK_PREDICT_BASE) }))
```

Constants (`MOCK_HISTORY_INFO`, `QUERY_MA99`, `MOCK_PREDICT_BASE`, `MOCK_STATS`) are duplicated verbatim from `ma99-chart.spec.ts:20-89` per SQ-051-PHASE3-02 ruling. Spec header includes a JSDoc pointer:

```text
/**
 * Constants below mirror frontend/e2e/ma99-chart.spec.ts:20-89 (canonical source).
 * Duplicated rather than cross-spec-imported per K-051 design doc §0 SQ-02.
 * If the third spec needs the same constants, refactor into _fixtures/mock-apis.ts.
 */
```

### 4.4 Test cases (3 cases — all in one spec file)

| ID | Description | Positive / negative | Failure mode it catches |
|----|-------------|---------------------|--------------------------|
| `T1 AC-051-09-UPLOAD-SUCCESS` | upload real 24-bar 1H CSV → MainChart visible + MatchList ≥1 match | positive | K-051 user-visible failure: `/api/predict` returns the bug instead of matches |
| `T2 AC-051-09-NO-ERROR-TOAST` | post-upload `.text-red-400` toast bar (AppPage.tsx:349-353) MUST NOT be visible | negative | parser error path triggered (BOM, header row, wrong row count) silently — visual chrome assertion |
| `T3 AC-051-09-NO-MA-HISTORY-MESSAGE` | `page.getByText(/ma_history requires/i)` returns count = 0 | negative | Sacred error message leaks into DOM (K-051 user-visible bug class anchor) |

Setup helper structure mirrors `ma99-chart.spec.ts::setupAndPredict` but takes a buffer parameter and uses single-file `setInputFiles` array.

### 4.5 Boundary contract

| Boundary | Behavior | Source |
|----------|----------|--------|
| Fixture has UTF-8 BOM | spec fails at upload — `parseOfficialCsvFile` throws → red toast bar visible → T2 fails. Fixture-write step (Engineer) MUST verify `head -c 3 fixture | xxd` does NOT begin `ef bb bf` | AppPage.tsx:48-58 |
| Fixture has header row | spec fails — first cell non-numeric → `parseExchangeTimestamp` throws → red toast | AppPage.tsx:54-66 |
| Fixture row count != 24 | spec fails — `parseOfficialCsvFile` throws "expected 24 rows, got N" | AppPage.tsx:77-79 |
| Predict mock returns non-200 | spec fails on chart not visible (T1) — fail-fast, not silent retry | acceptable |
| `future_ohlc.length < 2` in mock | `computeDisplayStats` falls back to `appliedData.stats`; T1 still passes (chart renders) but B5 contract violated. Mock-realism reuse from `ma99-chart.spec.ts:67-70` (`length === 2`) prevents this; if Engineer hand-rolls payload and breaks it, K-013 spec will catch in regression | `ClaudeCodeProject/CLAUDE.md` §Test Data Realism |
| `MOCK_STATS` missing field | runtime undefined-field crash on render → T1 fails. Reusing `ma99-chart.spec.ts:25-46` constant prevents this | same |
| Hydration drift (rollup-musl missing in worktree) | Playwright webServer crashes pre-test → re-run in canonical per K-Line CLAUDE.md §Worktree Hydration Drift Policy; only file as bug if canonical also fails | AC-051-06 |

### 4.6 QA non-blocking refinements (N1, N2, N3 — Engineer-time)

- **N1** (AC-051-07): `MAX_GAP_DAYS = 1` already proposed as module constant in §2.2 pseudo-code.
- **N2** (AC-051-08): Engineer may add `@pytest.mark.parametrize` over 2-3 input dates; not required by AC. If added, parametrize positive test only — negative-case fixture truncation is date-coupled to 2026-04-07.
- **N3** (AC-051-09): Engineer may add `await expect(page.locator('[data-testid="match-row"]')).toHaveCount(N)` for additional drift catch; locator existence requires verifying the testid in MatchList component first (do NOT assert against non-existent testid).

## 5 File Change List

| Path | Type | Responsibility |
|------|------|----------------|
| `backend/tests/test_history_db_contiguity.py` | NEW | AC-051-07 — on-disk daily DB strict-monotonic + gap-≤-1 + freshness-≤-7d gate |
| `backend/tests/test_predict_real_csv_integration.py` | NEW | AC-051-08 — live DB + real-CSV positive integration + 128-bar truncated negative + constants drift guard |
| `backend/tests/fixtures/ETHUSDT-1h-2026-04-07-original.csv` | NEW | regenerated 24-bar 1H slice for backend integration test |
| `backend/tests/fixtures/ETHUSDT-1h-2026-04-07-original.README.md` | NEW | regeneration command + date provenance (B3 audit-trail mandate) |
| `frontend/e2e/upload-real-1h-csv.spec.ts` | NEW | AC-051-09 — real 1H CSV upload E2E with mocked /api/predict + toast/Sacred-message negative assertions |
| `frontend/e2e/fixtures/` | NEW DIRECTORY | (created implicitly when adding the fixture below) |
| `frontend/e2e/fixtures/ETHUSDT-1h-2026-04-07.csv` | NEW | byte-identical copy of backend fixture; consumed by `setInputFiles` |
| `agent-context/architecture.md` | EDIT | append Changelog entry; structural sections unchanged (no new directory beyond `frontend/e2e/fixtures/`) |
| `docs/retrospectives/architect.md` | EDIT (PREPEND) | newest-first 2026-04-26 entry per `feedback_per_project_role_retrospective_log.md` |
| `docs/designs/K-051-phase-3-design.md` | NEW (this file) | design SoR for Engineer |

**No edits to:** `backend/main.py` (untouched per ticket §Out of Scope), `backend/predictor.py`, `backend/mock_data.py`, `frontend/src/**`, `frontend/e2e/_fixtures/mock-apis.ts` (extraction deferred per SQ-051-PHASE3-02), `frontend/e2e/ma99-chart.spec.ts`, `playwright.config.ts`, `docs/tickets/K-051-*.md` (Architect must NOT modify ticket per `feedback_ticket_ac_pm_only.md`).

## 6 Implementation Order

Three PRs on the same branch per ticket §Phase Plan Phase 3b/3c. Architect recommends:

1. **Phase 3b — backend pytest (one PR):**
   1. Create `backend/tests/fixtures/ETHUSDT-1h-2026-04-07-original.csv` (24 rows, byte-clean, headerless) + sibling README with provenance.
   2. Write `backend/tests/test_history_db_contiguity.py` with three test functions per §2.2; run `pytest backend/tests/test_history_db_contiguity.py -v` → exit 0.
   3. Write `backend/tests/test_predict_real_csv_integration.py` with three test functions per §3.2; run `pytest backend/tests/test_predict_real_csv_integration.py -v` → exit 0.
   4. Run full backend pytest suite (`pytest backend/tests/`) in canonical to verify no regression in the existing 70 tests; exit 0.
   5. Commit + push + open PR.

2. **Phase 3c — frontend E2E (one PR):**
   1. Create `frontend/e2e/fixtures/` directory and copy fixture bytes from backend (atomic with the spec commit so reviewer can `diff -q` the two fixtures).
   2. Write `frontend/e2e/upload-real-1h-csv.spec.ts` per §4 (3 test cases).
   3. Run `npx tsc --noEmit` → exit 0.
   4. Run `npx playwright test upload-real-1h-csv` → all 3 pass.
   5. Run full Playwright suite in canonical (per QA retro test isolation strategy line 62-69); compare against pre-3c baseline of 295 passed / 3 failed (K-031/K-022/K-020 pre-existing) / 1 skipped. Post-3c goalpost: ≥296 passed (or 298 if 3 cases all green-classified together — verify per spec count, not collapsed), exactly 3 pre-existing failed, 1 skipped. Any new failure attributable to AC-051-09 = bug, file back to Engineer.
   6. Commit + push + open PR.

3. **Architecture Doc Sync** (this PR or paired with whichever above PR opens first):
   1. Edit `agent-context/architecture.md` Changelog entry per §7.
   2. Edit `docs/retrospectives/architect.md` per §8.
   3. Commit on the same branch.

**Parallelization:** Phase 3b and 3c can be authored in parallel by Engineer (no shared file). Architecture doc sync rides on whichever lands first.

## 7 Architecture Doc Update Plan

### 7.1 Self-Diff scope

Structural-content cells affected: **0** (no Directory Structure tree change beyond a new test file under existing `backend/tests/` and a new `frontend/e2e/fixtures/` directory; no new API endpoint; no new component; no new route; no new env var; no shared-component change). The new `frontend/e2e/fixtures/` directory is a leaf addition under the existing `e2e/` block — Engineer adds one tree-line for the new dir.

Per `feedback_architect_must_update_arch_doc.md`: "Only bug fix / test change / copy / pure refactor with no external contract impact → add one entry at bottom `## Changelog`". K-051 Phase 3b/3c is exactly that case.

### 7.2 Changelog entry (Architect appends at delivery)

Single new entry at the top of `## Changelog`, dated 2026-04-26, summarizing: (a) 5 new test files + 2 new fixtures landed under `backend/tests/` and `frontend/e2e/fixtures/`; (b) zero structural code change; (c) zero API / schema / route / shared-component change; (d) Sacred K-015 invariant gains positive + negative anchors via AC-051-08; (e) link to this design doc.

Self-Diff Verification block to attach: `0 cells modified ✓ (no Directory Structure entity affected beyond leaf-additive tests/fixtures); 1 Changelog row appended ✓; updated: 2026-04-26 ✓; Cross-Table Sweep: grep "test_history_db_contiguity\|test_predict_real_csv_integration\|frontend/e2e/fixtures" architecture.md → 0 prior hits → no other-table reconciliation needed`.

## 8 Architect Retrospective (per-project log preview)

Final entry written into `docs/retrospectives/architect.md` at delivery; preview here for Engineer/PM context:

```
## 2026-04-26 — K-051 Phase 3b/3c design

**What went well:** Pre-Design Audit code-level dry-run caught two pointer
errors before they became Engineer time-sinks: (a) PM brief said mock
`/api/predict-stats`, but main.py exposes no such endpoint — resolved as
SQ-01 with code citation; (b) QA retro pointed at K-046 spec line 97-99
for setInputFiles pattern, but that line targets the history-reference
section, not the official-input multi-select that K-051 actually drives —
swapped the citation to ma99-chart.spec.ts:163-168 (canonical) before
delivery so Engineer never has to discover the mismatch live.

**What went wrong:** Initial pass treated the AC-051-08 fixture
provenance docstring as a `# Source: ...` comment line in the CSV itself.
Code-level dry-run on parseOfficialCsvFile (AppPage.tsx:48-66) showed the
strict numeric-first-column gate would throw on any leading `# ` line —
forcing a sibling README.md as the audit-trail container. Caught at design
time, but only because §1.2 BOM and header-row truth tables were filled
in BEFORE the fixture-content section was drafted; if I had drafted the
sections in the order PM listed them in the brief, the bug would have
shipped.

**Next time improvement:** when a design touches BOTH backend and
frontend fixture format gates with a shared fixture, the fixture-format
truth table goes BEFORE the file-change list, not after. Codify into
this persona's Pre-Design Audit checklist as: "any cross-layer fixture
shipping into ≥2 parsers — write parser-tolerance truth table first, then
fixture content design".
```

## 9 Risks and Notes

- **Hydration drift recurrence:** Phase 3c spec runs against Vite dev server. Worktree-only `@rollup/rollup-<platform>` failure is a recognised K-051 hazard; AC-051-06 protocol says "re-run in canonical first". Engineer should test in canonical after passing in worktree to confirm no new env-class drift.
- **TICKET_ID hygiene at QA sign-off:** when QA generates the visual report, `TICKET_ID=K-051 npx playwright test visual-report.ts` — recurrence of `K-UNKNOWN-visual-report.html` would be the 4th strike on TD-K030-03. This Phase 3 design does NOT touch `visual-report.ts` source — TD-K030-03 stays a separate ticket per PM 2026-04-25 ruling.
- **Sacred message text drift via i18n:** if a future ticket internationalizes user-facing error messages, `test_truncated_db_raises_sacred_value_error` (B3) fails first. This is by design — the K-051 user-retest SOP literally greps the substring; rewording is a coordinated change requiring both this test update and the SOP update.
- **Path resolution from worktree vs canonical:** `Path(__file__).resolve().parents[2]` walks `backend/tests/<file>` → `backend/tests` → `backend` → `K-Line-Prediction`; `K-Line-Prediction/history_database/Binance_ETHUSDT_d.csv` is the target. Both worktree and canonical resolve identically because the worktree is a symlink-equivalent of the same git tree. Verified by inspection of `pwd` resolution rules in §1.1 evidence.
- **Engineer-time mock-realism check:** PR for Phase 3c MUST NOT hand-roll a 1-bar `future_ohlc` payload — the MOCK_PREDICT_BASE from ma99-chart.spec.ts:67-70 is the realism contract. If Engineer cannot copy verbatim due to TypeScript import scope issues, escalate to Architect rather than degrade — the realism gate is K-013 sacred.

## 10 Open Questions

**None open.** SQ-051-PHASE3-01 and -02 resolved within design authority (verifiable from code, not requirements). All B1–B5 PM rulings already encoded into ticket AC. Engineer cleared to start.

## 11 Handoff to Engineer

**Release condition:** Engineer may begin Phase 3b/3c when:

1. PM confirms this design doc as the SoR for K-051 Phase 3b/3c (PM 2026-04-26 ruling already applied via B1–B5; this design is the operationalization).
2. Worktree branch `ops-daily-db-backfill` is current with origin/main (verified clean at design-write time).
3. Engineer reads §1 (Pre-Design Audit), §2 (backend pytest), §3 (backend integration), §4 (frontend E2E) before opening any file.
4. Engineer follows §6 implementation order — backend first, frontend second, architecture sync paired.

**No PM blockers, no Architect-pending items.**
