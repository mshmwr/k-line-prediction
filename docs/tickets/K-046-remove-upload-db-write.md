---
id: K-046
title: Remove DB write from /api/upload-history endpoint
status: open
created: 2026-04-24
type: refactor
priority: medium
size: small
visual-delta: none
content-delta: yes
design-locked: N/A
qa-early-consultation: docs/retrospectives/qa.md 2026-04-24 K-046
dependencies: []
sacred-regression: [K-009 MA99 1H→1D history path, K-013 stats contract cross-layer]
---

## Summary

Change `/api/upload-history` so it no longer persists uploaded CSV bars into the on-disk authoritative history database (`history_database/Binance_ETHUSDT_1h.csv` / `_d.csv`) and no longer mutates the in-memory `_history_1h` / `_history_1d` module state. The endpoint keeps accepting CSV uploads, but the parsed bars become ephemeral per-request input used for pattern-matching context only; the authoritative DB stays read-only from the user-facing API.

**Why:** Public deployment has no auth. Anyone hitting `/api/upload-history` can overwrite or append to the global history DB, which poisons every subsequent `/api/predict` / `/api/example` / `/api/history-info` response for every visitor. The fix is to retire the write path entirely. Future authoritative DB refreshes will be done by a scheduled scraper (K-047, separate ticket).

**Paired with:** K-047 (Auto scraper for authoritative K-line history DB) — replaces the upload-as-maintenance mental model with scheduled-pull-from-exchange. K-047 is backlog; K-046 lands first and is independently valuable (stops DB-poisoning risk immediately).

## Scope

**In scope:**
- `backend/main.py` — remove `_save_history_csv()` call + `_history_1h` / `_history_1d` global mutation inside `upload_history_file()` handler (lines 162-167)
- `backend/main.py` — revisit `upload_history_file()` response payload semantics (`added_count` is now always 0; decide rename vs keep)
- `frontend/src/AppPage.tsx` — update the upload-result toast copy to reflect new semantics ("analysed N bars" vs "added N bars")
- `backend/tests/test_main.py` — rewrite 4 existing upload tests (AC-TEST-UPLOAD-1..4) to assert no-write behavior; add 2 new tests for mtime + in-memory state invariants
- Docs: `agent-context/architecture.md` — note the endpoint semantics change in the current-state block

**Out of scope (explicit):**
- Removing the `/api/upload-history` endpoint or the frontend upload UI (both stay — upload CSV is still used as **query input** for pattern matching downstream; only the DB-write side effect is removed)
- `_merge_bars()` helper (still used in-memory by `/api/predict` and `/api/merge-and-compute-ma99` — those already correctly in-memory-only per line 252 / 278 comments)
- Building the scheduled scraper (K-047, separate ticket)
- Adding auth to any endpoint (the point of K-046 is that removing mutation makes auth unnecessary)

**Affected files (expected):**
- `backend/main.py` — lines 139-176 (`upload_history_file` handler body)
- `backend/tests/test_main.py` — AC-TEST-UPLOAD-1/2/3/4 rewrite + new RO-5/RO-6
- `frontend/src/AppPage.tsx` — lines 297-312 (handler) + lines 432-444 (result toast copy)
- `agent-context/architecture.md` — updated block (single-line summary)

## Acceptance Criteria

### AC-046-RO-1 — Upload does not mutate on-disk history file

- **Given:** the backend server has booted with `HISTORY_1H_PATH` pointing at a real CSV file with a known `mtime` and `size`
- **When:** a client POSTs a valid 1H CSV (with bars whose timestamps are newer than anything in the history file) to `/api/upload-history`
- **Then:** the HTTP response is `200 OK`
- **And:** after the request completes, `os.stat(HISTORY_1H_PATH).st_mtime_ns` and `st_size` are byte-identical to the pre-request snapshot
- **And:** reading `HISTORY_1H_PATH` back produces content byte-identical to the pre-request file content

### AC-046-RO-2 — Upload does not mutate in-memory history state

- **Given:** the FastAPI app's module-level `_history_1h` list has N entries before the request
- **When:** a client POSTs a CSV containing M bars (with M ≥ 1 new timestamps not already in `_history_1h`) to `/api/upload-history`
- **Then:** after the request completes, `len(main._history_1h) == N` (no delta)
- **And:** `main._history_1h` is the same list object identity as before the request (no reassignment)
- **And:** the same invariant holds for `_history_1d` when the uploaded file is a 1D CSV

### AC-046-RO-3 — /api/example reflects only the authoritative DB after uploads

- **Given:** `HISTORY_1H_PATH` exists with K rows
- **When:** a client performs an upload POST to `/api/upload-history` (file parses successfully) followed by GET `/api/example?n=5&timeframe=1H`
- **Then:** `/api/example` returns the same 5 rows it would have returned without the intervening upload (bit-identical JSON body)
- **And:** repeating the upload N times (same or different CSV payloads) does not change the `/api/example` response

### AC-046-RO-4 — Frontend /app upload → match → projection flow still works end-to-end

- **Given:** the user is on `/app` and the upload UI is rendered
- **When:** the user uploads a valid History CSV, then clicks Predict on their input OHLC
- **Then:** the upload result toast renders without error (new copy per AC-046-COPY-1 below)
- **And:** `/api/predict` returns matches successfully (the upload's ephemeral in-memory merge for pattern-matching context still works via the `/api/predict` handler's own in-memory merge at `backend/main.py:277-278`)
- **And:** no Playwright spec in `frontend/e2e/*.spec.ts` regresses (full suite continues to pass at pre-K-046 pass count)

### AC-046-RO-5 — Response payload renamed to reflect new semantics

- **Given:** the client POSTs a valid CSV to `/api/upload-history`
- **When:** the response body is parsed
- **Then:** the JSON contains `parsed_bar_count` (int, = the number of bars successfully parsed from the upload) instead of `added_count`
- **And:** the JSON contains `history_bar_count` (int, = authoritative `HISTORY_*_PATH` row count, read from disk at request time — not affected by the upload) instead of the prior `bar_count` which conflated merged-and-persisted count
- **And:** the JSON still contains `filename` (target history filename, for display), `latest` (latest timestamp in the authoritative DB, not the upload), `timeframe` (`'1H'` | `'1D'`)
- **And:** no `added_count` field is present in the response

### AC-046-COPY-1 — Frontend upload toast copy reflects analyse-only semantics

- **Given:** the user uploads a valid CSV via the `/app` upload UI
- **When:** the upload returns successfully
- **Then:** the result toast renders text like `Parsed N bars from <filename> · authoritative DB has M bars · latest <timestamp> UTC+0` (English, font-mono, consistent with existing `/app` toast style)
- **And:** the toast does NOT say "added N bars" or "資料已是最新" (old Chinese copy bound to old semantics)
- **And:** the visual style of the toast (border/background/icon) matches the existing "informational" variant (gray-border, not green-success), because no DB update happened

### AC-046-REGRESSION-SACRED — Downstream endpoints unaffected

- **Given:** the K-009 AC-009-1H-MA99-FROM-1D invariant holds (1H predict path uses `_history_1d` for MA99)
- **When:** K-046 refactor lands
- **Then:** `/api/predict` 1H response's `query_ma99_1h` is computed identically to pre-K-046 (same fixture, same output)
- **And:** `/api/predict` 1D response's `query_ma99_1d` is computed identically to pre-K-046
- **And:** `/api/merge-and-compute-ma99` response (K-009 / K-013 behavior) is identical to pre-K-046 (in-memory ephemeral merge path on lines 252-254 unchanged)
- **And:** `backend/tests/fixtures/stats_contract_cases.json` (K-013 cross-layer contract) still validates with `test_predictor.py::test_stats_contract` all 3 cases PASS

### AC-046-DOCS — architecture.md reflects the change

- **Given:** K-046 lands
- **When:** reader opens `agent-context/architecture.md` current-state block
- **Then:** there is an English note describing `/api/upload-history` as read-only (no DB write) with a pointer to K-046 + forward pointer to K-047
- **And:** the line is added via Architect's Step "每次任務結束前必同步 architecture.md" path, not by Engineer

## Phase Plan

### Phase 1 — Backend refactor + test rewrite

- Engineer removes `_save_history_csv(merged, target_path)` + both `_history_1h = merged` / `_history_1d = merged` assignments inside `upload_history_file()`
- Engineer reshapes response payload per AC-046-RO-5: `parsed_bar_count` + `history_bar_count` + `filename` + `latest` + `timeframe`; `added_count` field REMOVED
- Engineer keeps `_parse_csv_history_from_text()` and `_merge_bars()` helpers (still used by `/api/predict` in-memory merge path — do not delete)
- `_save_history_csv()` helper becomes orphaned after this refactor; Engineer decides: delete now (simpler) or keep for K-047 reuse (future scheduled scraper will also write to disk). **PM ruling:** delete now. K-047 will reintroduce its own write path with a different call-site shape (scheduled job context, not request handler). Dead code invites confusion.
- Engineer rewrites `backend/tests/test_main.py` AC-TEST-UPLOAD-1..4 to:
  - UPLOAD-1 (1H happy path) → assert `parsed_bar_count == N`, `os.stat` `mtime_ns` invariant, `main._history_1h` length invariant, response schema per AC-046-RO-5
  - UPLOAD-2 (1D filename detection) → same invariants on `_history_1d` + `HISTORY_1D_PATH`
  - UPLOAD-3 (empty file 422) → unchanged (422 response still applies)
  - UPLOAD-4 (duplicate bars) → previously asserted `added_count == 0`; now obsolete, rewrite to assert `parsed_bar_count == N` (still informative) + same-file mtime invariant
- Engineer adds 2 new tests:
  - UPLOAD-RO-5 (`/api/example` stability) → per AC-046-RO-3
  - UPLOAD-RO-6 (new payload schema) → per AC-046-RO-5, asserts field names + absence of `added_count`
- Gate: `python3 -m pytest backend/tests/` all pass
- Gate: `python3 -m py_compile backend/main.py` exit 0

### Phase 2 — Frontend copy + schema sync

- Engineer updates `HistoryUpload` state shape in `AppPage.tsx:142` from `{ filename, latest, barCount, addedCount }` → `{ filename, latest, historyBarCount, parsedBarCount }`
- Engineer updates the fetch handler `handleHistoryUpload` (lines 297-312) to read `parsed_bar_count` / `history_bar_count` from the response
- Engineer rewrites the toast copy block (lines 432-444) per AC-046-COPY-1: English, no conditional success-vs-noop styling (always informational gray border since no DB mutation ever happens), copy pattern `Parsed N bars from <filename> · authoritative DB has M bars · latest <ts> UTC+0`
- Gate: `npx tsc --noEmit` exit 0
- Gate: Playwright suite full pass (match pre-K-046 pass count)

### Phase 3 — Architecture.md sync + close

- Architect appends 1-line entry to `agent-context/architecture.md` current-state block describing the endpoint semantics change + K-047 forward pointer
- PM Phase Gate verifies: AC-046-RO-1..5 + AC-046-COPY-1 + AC-046-REGRESSION-SACRED + AC-046-DOCS all PASS; Deploy Record written; close commit

## Blocking Questions — PM Rulings

### BQ-046-A — Endpoint name: keep `/api/upload-history` or rename?

**Options raised:**
- (a) Keep `/api/upload-history` — zero frontend churn, URL already deployed
- (b) Rename to `/api/analyze-kline` or `/api/parse-kline` — URL matches new semantics
- (c) Introduce new name + leave old as alias — cost of both

**PM ruling: (a) keep `/api/upload-history`.**

**Rationale per 4-source priority (per `feedback_pm_self_decide_bq.md`):**
1. Pencil `.pen` design — no frame covers this API endpoint (backend route). No signal.
2. Ticket text — user's verbatim scope was "把上傳時會更新後端資料庫的功能改掉" (remove the DB-write side effect), not "rename the endpoint." No signal toward rename.
3. Memory rules — `feedback_engineer_no_scope_downgrade.md` + `feedback_readme_plain_language.md` both lean "minimize incidental churn"; rename would balloon diff + invalidate `/api/upload-history` grep-history in retrospectives/tickets without behavior value.
4. Codebase evidence — URL is hit from exactly 1 frontend site (`AppPage.tsx:303`) and 4 backend test cases. Rename cost is low but non-zero; benefit is cosmetic (URL describing what it does). Rename value recovers only if frontend copy can't make new semantics clear — and it can (BQ-046-C ruling).

Priority 2 wins (ticket text explicit about surgical removal, not rename). Keep the name.

### BQ-046-B — Response payload shape: `added_count`, `parsed_bar_count`, both, or minimal?

**Options raised:**
- (α) Keep `added_count`, always 0 — frontend change = cosmetic only
- (β) Replace with `parsed_bar_count` (N bars successfully parsed from upload) — informative
- (γ) Return only HTTP 200 + empty body — minimal
- (δ) `parsed_bar_count` + `history_bar_count` + `filename` + `latest` + `timeframe` — full informational payload

**PM ruling: (δ).**

**Rationale per 4-source priority:**
1. Pencil — no signal (backend contract).
2. Ticket text — user's guidance `Response payload（added_count 語義）對 frontend 仍 meaningful 或已調整` explicitly asks for a meaningful payload, not silent removal. Eliminates (α) + (γ).
3. Memory — `feedback_playwright_mock_realism.md` ("absent field = undefined = runtime crash TS alone can't catch") + K-028 Sacred testid discipline argue for explicit schema, not shape-shifting. Leans toward full explicit payload (δ) over minimal (β).
4. Codebase — existing frontend state shape already reads 4 fields (`filename` / `latest` / `bar_count` / `added_count`, `AppPage.tsx:306`). A 4-field replacement keeps cognitive load constant. (δ) delivers the parallel 4-field shape, just with renamed semantics.

Verdict: (δ). Frontend toast can render "Parsed N bars · DB has M bars · latest <ts>" which is meaningful and actionable. `history_bar_count` and `latest` come from the current on-disk DB state (unaffected by this upload), which is also informational for the user.

### BQ-046-C — Frontend copy: explain "analysis only, not stored"?

**Options raised:**
- (i) Ship only a toast copy change, no explanatory banner
- (ii) Toast copy change + small "Upload is analysed, not saved" inline hint near the file-picker
- (iii) Large warning block at top of `/app`

**PM ruling: (ii).**

**Rationale per 4-source priority:**
1. Pencil — no `/app` Pencil frame per K-021 §2 (route is dev-tool, not design-reviewed). No signal.
2. Ticket text — user framed this as "frontend `/app` 是否需要調整 copy 說明『Your upload is used for analysis only, not stored』" — explicitly suggests user-facing clarification. Eliminates (i).
3. Memory — `feedback_readme_plain_language.md` (plain language, no jargon). `feedback_options_with_recommendation.md` (explicit recommendations). Both lean toward concise inline hint, not prominent warning. Eliminates (iii) — oversized banner misleads that there's a security concern on the user's end; the real concern was on the server operator's end and is fixed by the refactor itself.
4. Codebase — existing upload affordance at `AppPage.tsx:415-428` is a small dashed-border button with `"時間欄位須為 UTC+0"` secondary hint inline — exact pattern for adding one more subtext line.

Verdict: (ii). Add one line of secondary hint near the button: `Uploads are analysed for this session only — the authoritative history DB is read-only.` Size/style matches the existing `"時間欄位須為 UTC+0"` hint.

**Copy detail for Engineer (AC-046-COPY-1 extension):** render the analyse-only hint as a `<span class="text-[10px] text-gray-500">` sibling inside the `<label>` wrapper, below or adjacent to the existing UTC+0 hint. One line of English. No icon, no color accent.

## Test Coverage Plan

Test case counting per `feedback_pm_all_phases_before_engineer.md` and parallel-Given quantification rule:

**Backend (pytest):**
- 4 rewritten AC-TEST-UPLOAD-1..4 + 2 new UPLOAD-RO-5/6 = 6 tests
- Each asserts an independent invariant (mtime, module state, response schema, /api/example stability). Not merge-able into single test.

**Frontend (Playwright):**
- No new Playwright spec required (upload UI not part of any Playwright E2E currently — verified via `grep -rln "upload\|Upload" frontend/e2e/` returning only `ma99-chart.spec.ts` with unrelated match). Existing `/app` spec (if any) will naturally cover the toast copy via regression.
- tsc + full e2e regression expected to continue at pre-K-046 baseline pass count.

**Cross-layer fixture:**
- K-013 `stats_contract_cases.json` must still validate (AC-046-REGRESSION-SACRED)

## Sacred Invariants

**Preserved:**
- K-009 AC-009-1H-MA99-FROM-1D — `/api/predict` 1H path uses `_history_1d` for MA99 (line 296 `ma_history=_history_1d`), unchanged by K-046
- K-013 cross-layer stats contract — `stats_contract_cases.json` validation path unchanged
- `/api/predict` in-memory ephemeral merge (line 278) — unchanged; this is the actual path pattern-matching uses

**Retired by K-046:** none — no prior Sacred clause locked `/api/upload-history` write behavior.

## Release Status

- 2026-04-24 open — PM drafted PRD + 7 ACs + 3 BQ rulings + Phase 1/2/3 plan
- Next gate: QA Early Consultation → PM Handoff check → Architect release

## Retrospective

_(filled at close)_
