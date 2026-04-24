---
title: K-046 — Comment out upload-history DB write + add example CSV download
type: design
status: architect-signed-off
ticket: K-046
created: 2026-04-24
author: Architect
---

## 0 Scope Questions

None. PM rulings BQ-46D/E/F already locked in ticket §Blocking Questions. All 11 ACs + 3 Known Gaps accepted as authoritative. No Pencil frame in scope (`/app` is dev-tool route, not design-reviewed per K-021 §2 precedent). No `visual-delta` (`visual-delta: none`), so `visual-spec.json` consumption gate is N/A — text-only addition with existing hint-style class.

---

## 1 Pre-Design Audit

### Files inspected (`git show main:` dry-run)

| File | Command run | Purpose |
|------|-------------|---------|
| `backend/main.py` | `git show main:backend/main.py` | Identify exact write block + confirm Sacred read paths untouched |
| `frontend/src/AppPage.tsx` | `git show main:frontend/src/AppPage.tsx` | Confirm upload region JSX + upload response consumer |
| `backend/tests/test_main.py` | `git show main:backend/tests/test_main.py` | Identify 4 existing upload tests to amend |
| `frontend/public/examples/ETHUSDT_1h_test.csv` | `ls -la` + `wc -c` | Confirm asset present (646B) |
| `history_database/Binance_ETHUSDT_1h_test.csv` | `diff -q` | Byte-identity with `/public/examples/` copy |
| `agent-context/architecture.md` | Read lines 240-251 | Current `/api/upload-history` description needs sync |

### Grep audit — `_history_1h` / `_history_1d` / `HISTORY_*_PATH` touchpoints

```
main.py:17  HISTORY_1H_PATH = ...                     # constant
main.py:18  HISTORY_1D_PATH = ...                     # constant
main.py:30  _history_1h: list = _load_or_mock(...)    # boot-time load (unaffected)
main.py:31  _history_1d: list = _load_or_mock(...)    # boot-time load (unaffected)
main.py:56  def _save_history_csv(...)                # helper def (unused after K-046 — retained for K-047)
main.py:134 history_info — '1H': info(_history_1h, HISTORY_1H_PATH)   # read
main.py:135 history_info — '1D': info(_history_1d, HISTORY_1D_PATH)   # read
main.py:141 global _history_1h, _history_1d           # upload handler (mutation scope)
main.py:155 target_path = HISTORY_1D_PATH if is_1d else HISTORY_1H_PATH
main.py:156 existing = _history_1d if is_1d else _history_1h
main.py:163 _save_history_csv(merged, target_path)    # ← COMMENT OUT
main.py:165 _history_1d = merged                       # ← COMMENT OUT
main.py:167 _history_1h = merged                       # ← COMMENT OUT
main.py:181 /api/example — reads HISTORY_*_PATH from disk (unaffected)
main.py:239 /api/predict — read _history_*             # read
main.py:270 /api/merge-and-compute-ma99 — read _history_*  # read
main.py:286 /api/predict — ma_history=_history_1d (K-009 Sacred)  # read
main.py:297-298 /api/predict — K-009 1H→1D MA99 path   # read (Sacred preserved)
```

**Conclusion:** the only writer of `_history_1h` / `_history_1d` / `HISTORY_*_PATH` files after boot is `upload_history_file()` lines 163/165/167. Commenting those three lines + the `if added_count > 0:` guard (lines 162-167) removes every runtime write path. Startup still populates `_history_1h/_1d` via `_load_or_mock()` at module import (line 30-31) — unaffected.

### Frontend upload-response consumer grep

```
AppPage.tsx:142  useState<{ filename, latest, barCount, addedCount }>  # state shape
AppPage.tsx:303  fetch(`${API_BASE}/api/upload-history`, ...)
AppPage.tsx:305  .then(uploadResult => { ... })
AppPage.tsx:306  setLastHistoryUpload({
                   filename: file.name,           # ← read from FILE object, NOT from uploadResult.filename
                   latest: uploadResult.latest ?? null,
                   barCount: uploadResult.bar_count ?? 0,
                   addedCount: uploadResult.added_count ?? 0,
                 })
```

**Conclusion:** `uploadResult.filename` is **unused** by frontend (QA-1 finding confirmed). Only `latest` / `bar_count` / `added_count` matter to the runtime contract.

### Upload payload semantics — truth table (OLD vs NEW)

Given: `_history_1h` pre-request has N bars, client POSTs CSV with M bars. Case rows enumerate whether uploaded bars overlap existing.

| Case | N (pre) | M (CSV) | overlap | OLD `merged` len | OLD `added_count` | OLD `bar_count` (returned) | OLD `latest` returned | NEW `bar_count` (returned) | NEW `latest` returned | NEW `added_count` | Disk written OLD | Disk written NEW |
|------|---------|---------|---------|--------------------|---------------------|------------------------------|-------------------------|------------------------------|------------------------|--------------------|--------------------|--------------------|
| A full-overlap (duplicate) | 100 | 2 | all 2 bars already in history | 100 | 0 | 100 | existing[-1].date | 100 | existing[-1].date | 0 | no (guard 162 false) | no (block commented) |
| B strict-later | 100 | 2 | 0 overlap, M timestamps > all N | 102 | 2 | 102 (OLD) | merged[-1].date (= new) | **100** | **existing[-1].date** | **0** | yes | no |
| C partial overlap | 100 | 3 | 1 of 3 already in history | 102 | 2 | 102 | merged[-1].date | **100** | **existing[-1].date** | **0** | yes | no |
| D empty CSV | 100 | 0 | N/A (422 before merge) | N/A | N/A | N/A — HTTPException(422) | N/A | N/A — HTTPException(422) | N/A | N/A | no | no |
| E first boot, mock fallback | 0 | 5 | N/A (nothing to overlap) | 5 | 5 | 5 | merged[-1].date | **0** | **None** | **0** | yes | no |
| F 1D upload (filename heuristic) | 200 | 5 strictly later | 0 | 205 | 5 | 205 | merged[-1].date | **200** | **existing[-1].date** | **0** | yes (1D file) | no |

Rows B + C + E + F are the cases where OLD ≠ NEW observable. AC-046-COMMENT-3 + AC-046-QA-2 both pin the NEW column values. Case B is the reversibility test (AC-046-QA-2).

### Example CSV asset verification

```
$ ls -la frontend/public/examples/
-rw-r--r--@  1  646 Apr 24 15:46 ETHUSDT_1h_test.csv
$ diff -q frontend/public/examples/ETHUSDT_1h_test.csv history_database/Binance_ETHUSDT_1h_test.csv
(no output = byte-identical)
$ head -3 frontend/public/examples/ETHUSDT_1h_test.csv
https://www.CryptoDataDownload.com,,,,,,,,,
Unix,Date,Symbol,Open,High,Low,Close,Volume ETH,Volume USDT,tradecount
1774652400000,2026-03-27 23:00:00,ETHUSDT,1985.51,1993.85,1980.54,1992.75,5204.99,10345971.73643,61934
```

Format: CryptoDataDownload (provenance row + header row + 5 OHLCV rows = 7 lines, 646 bytes). `_parse_csv_history_from_text` branch at `main.py:91 (is_cryptodatadownload = startswith('http'))` handles this exactly. `lines.reverse()` on 102 puts bars chronological.

### §API 不變性 dual-axis

**(a) Wire-level schema diff:** response dict keys unchanged — `{filename, latest, bar_count, added_count, timeframe}`. Same 5 keys pre and post K-046. **Zero schema-level drift.**

**(b) Frontend observable behavior diff:** the `uploadResult` object the `AppPage.tsx:306` handler receives differs semantically in Cases B/C/E/F per truth table above — `bar_count` flips from `len(merged)` to `len(existing)`, `latest` from `merged[-1]` to `existing[-1]`, `added_count` always 0. The frontend renders this through the existing branch:

| Handler branch | Condition | OLD render | NEW render |
|-----------------|-----------|--------------|--------------|
| `addedCount === 0` | Case A | `資料已是最新，無需更新（共 N bars）` informational gray | **same** informational gray, with `N = len(existing)` (authoritative DB count) |
| `addedCount !== 0` | Cases B/C/E/F (OLD only) | `新增 K bars · 共 M bars · 最新 T UTC+0` green success | **never taken** post-K-046 — `added_count` is always 0 |

Under NEW, all cases land on the gray informational branch. No TypeScript error (same schema, same field types, just different values). AC-046-COMMENT-4 confirms this copy is correct for K-046 semantics without edit.

---

## 2 Technical Solution — 3 Options (required ≥3)

| Option | Description | Trade-off | Adoption scenario |
|--------|-------------|-----------|--------------------|
| **A. Comment-out write block only (recommended, matches PM ruling BQ-46D)** | Wrap lines 162-167 (`if added_count > 0: ... _history_* = merged`) in `#` comments + add `TODO(K-047)` marker. Adjust payload so `bar_count = len(existing)`, `latest = existing[-1]['date'] if existing else None`, `added_count = 0` — honest observable DB state. | Local diff ≤ 20 lines. Endpoint still parses CSV (upload → predict flow still round-trips). Easy K-047 revert. Payload needed a minor semantic shift (bar_count/latest drawn from `existing` not `merged`) — a deliberate honesty change, NOT a schema change. | Public deployment defense while retaining upload UX; pairs with K-047 scraper. |
| **B. Full handler commented, return 501** | Comment entire handler body, raise `HTTPException(501, detail='Upload temporarily disabled; scheduled scraper lands K-047')`. | Most defensive — zero parse cost. Breaks the upload → round-trip flow required by AC-046-EXAMPLE-3 (user cannot demo upload). Requires frontend error handling change (currently treats non-200 as error toast, which would show the 501 detail verbatim as error). | Emergency if uploads are causing crashes or must be sealed off entirely. |
| **C. Gate by env var `UPLOAD_WRITE_ENABLED=false`** | Add boolean env var read at startup; branch inside handler; default false on production. | Most flexible (can toggle write on dev without code change). Adds 1 new config knob to manage across Cloud Run + local + test environments; 12fa-style env sprawl. Env-var misconfig on prod re-enables write invisibly. | Multi-environment with dev wanting the write path. |

**Recommendation: A.** Matches PM ruling BQ-46D verbatim; minimal diff; upload UX preserved for demo round-trip; payload-honesty semantic reflects true DB state; K-047 revert is a 6-line `#` strip. Options B and C were considered and rejected per PM's "暫時先註解" (temporarily comment) phrasing — not "disable" or "gate".

---

## 3 File Change List

| # | File (absolute path from repo root) | Type | Responsibility |
|---|---------------------------------------|------|----------------|
| 1 | `backend/main.py` | modify | Comment out write block lines 162-167; adjust payload (lines 170-176) to read from `existing` not `merged`; add `TODO(K-047)` marker |
| 2 | `frontend/src/AppPage.tsx` | modify | Add `Download example CSV` anchor (1 element, ~5 lines) in History Reference block, always-visible inline style |
| 3 | `frontend/public/examples/ETHUSDT_1h_test.csv` | pre-existing (no Edit) | Verify byte-identity with `history_database/Binance_ETHUSDT_1h_test.csv` (646B); Engineer runs `diff -q` before commit, does NOT re-copy |
| 4 | `backend/tests/test_main.py` | modify | Update 4 existing upload tests with `mtime_ns` + `id()` + length invariants (AC-046-COMMENT-1/-2); add new AC-046-QA-2 strictly-later test; add new AC-046-QA-4 example-CSV round-trip test |
| 5 | `frontend/e2e/K-046-example-upload.spec.ts` | new | Playwright spec per AC-046-QA-3 (3 test cases: link-rendered / asset-fetch-200-646B / mocked-upload-round-trip) |
| 6 | `agent-context/architecture.md` | modify | Update `## API Endpoints` → `### POST /api/upload-history` section: strike "自動合併去重後寫入 history_database" → "parse + return observable DB state; write path commented 2026-04-24 per K-046 pending K-047 auto-scraper"; add Changelog entry |

---

## 4 API Contract Diff

### Wire schema (`POST /api/upload-history` response)

| Field | OLD semantic | NEW semantic | Type | Frontend consumer |
|-------|--------------|----------------|------|---------------------|
| `filename` | `target_path.name` (e.g. `Binance_ETHUSDT_1h.csv`) | **unchanged** — `target_path.name` | `string` | unused (FE reads `file.name`) |
| `latest` | `merged[-1]['date']` if merged else None | `existing[-1]['date']` if existing else None | `string \| null` | rendered in success toast (never rendered post-K-046 because addedCount is always 0) |
| `bar_count` | `len(merged)` | `len(existing)` | `int` | rendered in both toast branches as "共 N bars" |
| `added_count` | `len(merged) - original_count` (0..M) | `0` always | `int` | drives branch: 0 → gray info; !=0 → green success. Post-K-046 always 0 → always gray info branch. |
| `timeframe` | `'1H'` or `'1D'` per filename heuristic | **unchanged** | `'1H' \| '1D'` | unused (debug field) |

### snake_case ↔ camelCase mapping

| Backend (response JSON) | Frontend state field | Location |
|---------------------------|-----------------------|----------|
| `bar_count` | `barCount` | `AppPage.tsx:306` (renamed at read) |
| `added_count` | `addedCount` | `AppPage.tsx:306` |
| `latest` | `latest` | `AppPage.tsx:306` |
| `filename` | `filename` (overwritten with `file.name`) | `AppPage.tsx:306` |
| `timeframe` | (not stored) | — |

No new fields, no renames. Schema parity preserved.

---

## 5 Shared Component Inventory & Route Impact

### 5.1 Shared component inventory

**None.** This ticket adds one `<a>` element inline inside `AppPage.tsx`'s existing History Reference `<div>` (around line 418). It is a page-specific element, not a reusable primitive. Cross-page duplicate audit:

```
grep -rn 'Download example' frontend/src/        → (no matches)
grep -rn 'text-\[10px\] text-gray-500' frontend/src/  → 1 match (AppPage.tsx:418 existing UTC+0 hint, sibling to our new anchor — same style class, single-consumer acceptable)
grep -rn 'examples/' frontend/src/               → (no matches)
```

No existing anchor / primitive is duplicated. No new `components/primitives/` entry. Single-consumer inline JSX is the correct structure for a one-off `/app`-scoped link.

### 5.2 Route Impact Table

| Route | Affected by K-046 | Notes |
|-------|--------------------|--------|
| `/` (HomePage) | no | No upload UI; unchanged |
| `/app` (AppPage) | **yes** | Upload UI receives the new example-download anchor; upload toast copy renders on the `addedCount === 0` branch always post-K-046 |
| `/about` (AboutPage) | no | No upload UI |
| `/business-logic` | no | Unrelated endpoint |
| `/diary` | no | Unrelated static data |

**Isolation requirement:** single-route scope; no sitewide style or primitive touched; no global CSS / `tailwind.config.js` / index.css file in the change list, so no cross-route blast radius. Global Style Route Impact Table N/A — text addition uses existing `text-[10px] text-gray-500 hover:text-blue-400` class pattern (first three classes already in sibling hint; `hover:text-blue-400` is a new-element-local utility, Tailwind built-in, no config change needed).

### 5.3 Target-Route Consumer Scan

Not applicable. This ticket does not change route navigation behavior (no new link → another route; new link is `href="/examples/ETHUSDT_1h_test.csv"` = static asset fetch, not SPA navigation).

---

## 6 Implementation Order (Engineer)

### Phase 1 — Backend comment-out + test invariants

1. **Edit `backend/main.py:162-176`** — comment the write block + adjust the response payload to read from `existing` instead of `merged`. Target state:

   Pseudo-code shape (Engineer writes actual Python):
   ```
   merged = _merge_bars(existing, new_bars)            # KEEP (still a local — useful for future re-enable)
   added_count = len(merged) - original_count         # KEEP (informational local)

   # TODO(K-047): re-enable upload-driven DB write once auto-scraper lands.
   # Commented-out 2026-04-24 per K-046 to prevent anonymous public writes
   # to authoritative history DB. Restore by uncommenting the block below.
   # if added_count > 0:
   #     _save_history_csv(merged, target_path)
   #     if is_1d:
   #         _history_1d = merged
   #     else:
   #         _history_1h = merged

   latest = existing[-1]['date'] if existing else None
   return {
       'filename': target_path.name,
       'latest': latest,
       'bar_count': len(existing),
       'added_count': 0,
       'timeframe': '1D' if is_1d else '1H',
   }
   ```
2. **`python3 -m py_compile backend/main.py`** must exit 0.
3. **Edit `backend/tests/test_main.py`** — amend 4 existing upload tests + add 2 new:
   - **test_upload_1h_csv_happy_path** (AC-TEST-UPLOAD-1 → AC-046-COMMENT-1/-2): add `pre_mtime_ns = os.stat(tmp_path / "Binance_ETHUSDT_1h.csv").st_mtime_ns if exists else None`; after request, assert `os.stat(...).st_mtime_ns == pre_mtime_ns` (or file not created if it didn't exist before) AND `len(main._history_1h) == pre_len` AND `id(main._history_1h) == pre_id`. Replace `assert body["added_count"] > 0` with `assert body["added_count"] == 0` (post-K-046 invariant). Replace `assert body["bar_count"] >= 2` with `assert body["bar_count"] == pre_len` (reads existing, not merged).
   - **test_upload_1d_filename_detection** (AC-TEST-UPLOAD-2): same invariants on `_history_1d` + `HISTORY_1D_PATH`. Keep `timeframe == "1D"` assertion.
   - **test_upload_empty_file_returns_422** (AC-TEST-UPLOAD-3): unchanged (error path independent).
   - **test_upload_duplicate_bars_added_count_zero** (AC-TEST-UPLOAD-4): add `mtime_ns` + `len(main._history_1h) == pre_len` + `id()` invariants.
   - **NEW `test_upload_strictly_later_bars_no_mutation`** (AC-046-QA-2): this is the reversibility guard. Given N ≥ 1 seeded bars + CSV containing M ≥ 1 strictly-later bars (timestamps > max existing); assert `response.json()["added_count"] == 0` AND `len(main._history_1h) == N` AND mtime unchanged. **Rationale:** this test fails if someone accidentally uncomments lines 163-167; the duplicate-bars test passes regardless.
   - **NEW `test_upload_example_csv_fixture_round_trip`** (AC-046-QA-4): read raw bytes from `frontend/public/examples/ETHUSDT_1h_test.csv` (resolved as `Path(__file__).parent.parent.parent / "frontend/public/examples/ETHUSDT_1h_test.csv"`); POST as multipart with filename `ETHUSDT_1h_test.csv`; assert status 200, `timeframe == "1H"` (no 1D misdetection), `added_count == 0`, and internal parse extracted ≥ 5 OHLCV bars.
4. **`python3 -m pytest backend/tests/`** — all pass; new count = baseline + 2 (UPLOAD-RO-5 + EXAMPLE-CSV).

### Phase 2 — Frontend example download link + Playwright spec

5. **Verify asset** — `diff -q frontend/public/examples/ETHUSDT_1h_test.csv history_database/Binance_ETHUSDT_1h_test.csv` must be empty output. Do NOT re-copy if already byte-identical (file was pre-landed at 95f2ea5).
6. **Edit `frontend/src/AppPage.tsx:415-418`** — insert a new `<a>` element as a sibling immediately after the UTC+0 hint `<span>` OR as a sibling `<div>` directly after the `<label>` closing tag (line 430). Engineer picks based on flex layout balance — both positions meet AC-046-EXAMPLE-1 "immediately below Upload History CSV `<label>` or adjacent to UTC+0 hint" clause.

   Target JSX shape (Engineer writes actual TSX):
   ```
   <a
     href="/examples/ETHUSDT_1h_test.csv"
     download="ETHUSDT_1h_test.csv"
     className="text-[10px] text-gray-500 hover:text-blue-400"
   >
     Don't have a CSV? Download example →
   </a>
   ```

   Placement constraint: the anchor must be **outside** the `<label>` element (clicking a link inside a `<label>` that wraps a file input triggers the file picker instead of navigating) — render as sibling, not child, of the upload label.
7. **`npx tsc --noEmit`** must exit 0.
8. **New `frontend/e2e/K-046-example-upload.spec.ts`** — 3 test cases per AC-046-QA-3:
   - **T1 — Link rendered with correct attributes:** navigate to `/app`; wait for upload block; assert `page.getByText(/Download example/i)` visible; assert `getAttribute('href') === '/examples/ETHUSDT_1h_test.csv'` AND `getAttribute('download') === 'ETHUSDT_1h_test.csv'`.
   - **T2 — Asset fetch 200 with 646B:** `const response = await page.request.get('/examples/ETHUSDT_1h_test.csv')`; assert `response.status() === 200` AND `parseInt(response.headers()['content-length']) === 646`.
   - **T3 — Mocked upload round-trip → toast copy:** `page.route('**/api/upload-history', route => route.fulfill({ status: 200, json: { filename: 'ETHUSDT_1h_test.csv', latest: null, bar_count: 1000, added_count: 0, timeframe: '1H' } }))`; fetch example CSV bytes via `page.request.get(...)`; `setInputFiles` with those bytes; assert toast matches `/資料已是最新/`.
9. **`/playwright`** (or `npx playwright test K-046-example-upload`) — all 3 new cases pass; full suite regression clean.

### Phase 3 — Architecture doc sync + Phase Gate

10. **Edit `agent-context/architecture.md:245-251`** — update the `### POST /api/upload-history` section:
    - Strike `上傳 CSV 歷史資料，自動合併去重後寫入 history_database/`
    - Replace with: `上傳 CSV 歷史資料，解析後回傳 observable DB state。Write path commented-out 2026-04-24 (K-046) pending K-047 auto-scraper — parse + response payload 仍正常，但不觸寫 history_database/；response 中 bar_count 與 latest 反映 existing authoritative state，added_count 永遠 0。支援三種 CSV 格式不變。`
    - Update `Response：` line to note `added_count` always 0
    - Add `## Changelog` entry (newest first) — see §8 entry
11. PM Phase Gate: AC-046-COMMENT-1..4 + EXAMPLE-1..3 + REGRESSION-SACRED + QA-2/-3/-4 + DOCS all PASS → close + deploy.

---

## 7 Sacred Preservation Notes

**K-009 AC-009-1H-MA99-FROM-1D** — `/api/predict` 1H path uses `ma_history=_history_1d` (line 297-298). Pre-Design Audit confirmed this read path is untouched by K-046. `_history_1d` still populates from disk at module import (line 31); subsequent uploads don't modify it (write block commented); K-009 invariant holds. AC-046-REGRESSION-SACRED pins `query_ma99_1h` / `query_ma99_1d` byte-identity with pre-K-046.

**K-013 cross-layer stats contract** — `backend/tests/fixtures/stats_contract_cases.json` validates via `test_predictor.py::test_stats_contract`. No change to `compute_stats()` path; no change to predictor logic; fixture fully decoupled from upload handler. AC-046-REGRESSION-SACRED pins all 3 contract cases PASS.

**TD-003 (upload handler concurrency risk)** — becomes moot post-K-046 because there is no write path to race on. See ticket §Known Gaps GAP-1. Revisit at K-047 design.

**Sacred cross-check (grep sweep):**

```
grep -rn 'data-testid="cta-' frontend/e2e/ frontend/src/   → irrelevant (no CTA touched)
grep -rn 'trackCtaClick('     frontend/e2e/ frontend/src/   → irrelevant
grep -rn 'target="_blank"'    frontend/e2e/ frontend/src/   → irrelevant (new anchor same-origin, no _blank)
grep -rn 'href="mailto:'      frontend/e2e/ frontend/src/   → irrelevant
grep -rn 'nextElementSibling.id' frontend/e2e/              → K-031 adjacency guard (AboutPage) — unrelated to /app
grep -rn "querySelector('#"   frontend/e2e/                 → unrelated
```

No Sacred token dependencies collide with K-046 scope. No DOM-adjacency invariants in `/app`. No cross-file E2E assertions on upload handler internals.

---

## 8 Architecture.md Sync

### 8.1 Edit target

Replace lines 245-251 (the `### POST /api/upload-history` block) with the updated description per Phase 3 step 10.

### 8.2 Changelog entry (prepend newest-first to `## Changelog`)

```
- 2026-04-24 (Architect, K-046) — `/api/upload-history` write path commented-out pending K-047 auto-scraper; endpoint still parses CSV and returns 200 with payload reflecting authoritative (non-mutated) DB state: `bar_count = len(existing)`, `latest = existing[-1]['date'] if existing else None`, `added_count = 0` (always). No schema/field rename. Frontend `AppPage.tsx` gains `Download example CSV →` anchor linking `/examples/ETHUSDT_1h_test.csv` (646B, copy of `history_database/Binance_ETHUSDT_1h_test.csv` with `Binance_` prefix stripped; served from `frontend/public/examples/`). Sacred K-009 1H→1D MA99 + K-013 stats contract preserved. TD-003 concurrency risk moot post-K-046. ticket: K-046.
```

### 8.3 Self-Diff Verification (K-021 Round 2/3)

**Structural source-of-truth cells:**
| Cell | Pre-edit (line ref) | Post-edit |
|------|----------------------|-----------|
| `### POST /api/upload-history` description sentence | "上傳 CSV 歷史資料，自動合併去重後寫入 history_database/" | "上傳 CSV 歷史資料，解析後回傳 observable DB state。Write path commented-out 2026-04-24 (K-046)..." |
| Response line | `{ filename, latest, bar_count, added_count, timeframe }` | same schema + note `added_count` always 0 post-K-046 |
| TD-003 risk note | "用 module globals 做 read-merge-write-swap" | add line: "post-K-046 write path commented → race surface removed until K-047" |

**Same-File Cross-Table Sweep:** `grep -n 'upload-history\|_history_1h\|_history_1d' agent-context/architecture.md` — confirmed only the `### POST /api/upload-history` section describes the endpoint; no redundant tables. `updated:` frontmatter bumped to 2026-04-24 (K-046 Architect …) following existing line-5 narrative style.

**Verification:**
- Rows touched: 1 endpoint section (lines 245-251) + 1 changelog entry prepend + 1 frontmatter `updated:` line-5 narrative = 3 discrete edit regions ✓
- Cross-table hits: none (API Endpoints section is the sole mention) ✓
- Pre-Write name reference sweep: `grep` confirms no rename/delete/replace of entity names ✓

---

## 9 Test Strategy Alignment

| AC | Test location | Test function / case |
|----|----------------|------------------------|
| AC-046-COMMENT-1 (mtime/file invariant) | `backend/tests/test_main.py` | `test_upload_1h_csv_happy_path` + `test_upload_1d_filename_detection` (augmented) |
| AC-046-COMMENT-2 (module state identity + length) | `backend/tests/test_main.py` | `test_upload_1h_csv_happy_path` + `test_upload_1d_filename_detection` + `test_upload_duplicate_bars_added_count_zero` (augmented) |
| AC-046-COMMENT-3 (payload schema + honest semantics) | `backend/tests/test_main.py` | all 4 upload tests assert `added_count == 0` + `bar_count == pre_len` + schema keys present |
| AC-046-COMMENT-4 (toast copy) | `frontend/e2e/K-046-example-upload.spec.ts` T3 | mocked upload → assert `/資料已是最新/` matched |
| AC-046-EXAMPLE-1 (link rendered) | `frontend/e2e/K-046-example-upload.spec.ts` T1 | `getByText(/Download example/i)` visible + attribute asserts |
| AC-046-EXAMPLE-2 (filename + fetch) | `frontend/e2e/K-046-example-upload.spec.ts` T1 + T2 | `download="ETHUSDT_1h_test.csv"` + `/examples/` fetch 200 646B |
| AC-046-EXAMPLE-3 (round-trip) | `frontend/e2e/K-046-example-upload.spec.ts` T3 | mocked POST + toast assert |
| AC-046-REGRESSION-SACRED (K-009 + K-013) | `backend/tests/test_predictor.py::test_stats_contract` + existing predict E2E | full pytest + Playwright regression pass |
| AC-046-QA-2 (reversibility / strictly-later) | `backend/tests/test_main.py::test_upload_strictly_later_bars_no_mutation` (NEW) | strictly-later payload + mtime + len + id invariants |
| AC-046-QA-3 (Playwright round-trip) | `frontend/e2e/K-046-example-upload.spec.ts` (NEW 3 cases) | T1/T2/T3 above |
| AC-046-QA-4 (backend CSV format) | `backend/tests/test_main.py::test_upload_example_csv_fixture_round_trip` (NEW) | bytes from `/public/examples/` → POST → 200 + timeframe 1H + added_count 0 + ≥5 parsed |
| AC-046-DOCS | manual: Architect § 8 completes this step same-commit | N/A (verified by PM at Phase Gate) |

**AC ↔ test-count cross-check:** ticket §Test Coverage Plan declares "minimum 2 independent pytest + 3 independent Playwright". Delivered: **6 pytest functions** (4 augmented + 2 new) + **3 Playwright test cases** (T1/T2/T3 in new spec). Totals align.

---

## 10 Boundary Coverage (mandatory pre-delivery gate)

| Boundary | Defined? | Where |
|----------|----------|--------|
| Empty CSV (M = 0) | ✓ | `_parse_csv_history_from_text` returns `[]` → `HTTPException(422)` per existing error path (AC-TEST-UPLOAD-3 unchanged) |
| Max payload (large CSV) | ✓ | No parse-size limit in current code; K-046 does not change this. `len(merged) - len(existing)` still computed as local; memory footprint same as pre-K-046 since merge still runs (just not persisted). Known Gap: no new limit. |
| 400/422 error responses | ✓ | Unchanged — 422 for empty parse per existing handler; 400 via FastAPI validator on missing `file` param |
| 500 / crash | ✓ | Disk-write errors no longer reachable (write path commented); parse errors still caught via `try/except UnicodeDecodeError` and 422-path |
| Concurrent POSTs | Known Gap (GAP-1) | PM-acknowledged moot post-K-046; revisit K-047 |
| First-boot mock fallback (N = 0, `_history_1h` is mock) | ✓ | Case E of truth table — `existing[-1]['date']` on empty list guarded by `existing[-1]['date'] if existing else None` |
| 1D filename heuristic false-positive | Known Gap (ticket §Out-of-scope) | PM-acknowledged — `'1d' in filename_lower` substring collision can route to 1D; with write commented, worst case is a wrong `timeframe` in response; tracked as tech debt |
| CDN 404 race | Known Gap (GAP-2) | PM-acknowledged ops-time |
| Cross-browser `download` attr | Known Gap (GAP-3) | PM-acknowledged Chromium-only |
| Anchor inside `<label>` (UX footgun) | ✓ | Implementation order §6 step 6 explicitly says anchor must be sibling, not child, of `<label>` |

---

## 11 Refactorability Checklist

- [x] **Single responsibility:** handler still parses + responds; write responsibility removed (was conflating two concerns). **Improvement.**
- [x] **Interface minimization:** wire schema unchanged (5 fields); new anchor uses 3 attributes (href, download, className) — minimal.
- [x] **Unidirectional dependency:** frontend reads response → renders toast; no new flows.
- [x] **Replacement cost:** if we swap Firebase Hosting → another CDN, `/examples/*.csv` paths still work via any static host. `download` attribute portable.
- [x] **Clear test entry:** 6 pytest + 3 Playwright, each asserts one boundary.
- [x] **Change isolation:** UI touch is 1 file / 1 JSX sibling; backend touch is 1 file / 6-line block + 6-line response dict adjust; tests are in their respective files.

---

## 12 Known Gaps (transcribed from ticket)

### GAP-1 — Concurrency / race-condition testing for upload handler

- **Gap:** no AC exercises concurrent POSTs against `/api/upload-history`.
- **Reason acceptable:** FastAPI `TestClient` single-request; concurrent repro needs real uvicorn + `asyncio.gather`. Post-K-046 no write path = no race surface.
- **PM acknowledgment:** moot for K-046; revisit at K-047 design.

### GAP-2 — Firebase Hosting first-deploy 404 race for `/examples/*.csv`

- **Gap:** ~100ms propagation window where `index.html` new bundle serves while `/examples/` asset still propagating.
- **Reason acceptable:** no deterministic local repro; ops-time not build-time.
- **PM acknowledgment:** monitor manually on deploy day; escalate if recurs.

### GAP-3 — Cross-browser `download` attribute behavior

- **Gap:** AC-046-EXAMPLE-2 asserts attribute value, not filesystem filename. Safari/Firefox inconsistent.
- **Reason acceptable:** Playwright default Chromium honors `download=` reliably; attribute-level assertion is strongest decoupled proof; cross-browser projects in `playwright.config.ts` = scope expansion.
- **PM acknowledgment:** attribute-level sufficient; manual QA on deploy for other browsers.

---

## 13 Retrospective

**Where most time was spent:** §1.3 truth table (6 cases × 11 columns) — disciplined dry-run on OLD vs NEW observable drift for each of full-overlap / strictly-later / partial-overlap / empty / first-boot / 1D-filename cases. Paid off in §4 (API contract diff) + §9 (test strategy) writing themselves off the table.

**Which decisions needed revision:** initially considered placing the anchor inside the `<label>` (sibling to UTC+0 `<span>`) — caught during §6 boundary coverage that clicking an anchor inside a `<label>` wrapping a file input triggers the file picker. Revised to sibling-of-`<label>` placement, explicit note in implementation order.

**Next time improvement:** when the ticket is this small (≤2 file Edits), still write the truth table — a 6-row table prevented me from accidentally dropping Case E (first-boot mock fallback) where `existing = []` and `existing[-1]` would raise IndexError if not guarded. The Phase 1 guard `existing[-1]['date'] if existing else None` came directly from reading that row.
