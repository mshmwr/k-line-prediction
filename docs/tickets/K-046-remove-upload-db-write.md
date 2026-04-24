---
id: K-046
title: Comment out upload-history DB write + add example CSV download
status: open
created: 2026-04-24
revised: 2026-04-24
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

Two coordinated changes to `/api/upload-history` flow so the public deployment cannot have its authoritative history DB poisoned by anonymous CSV uploads, while keeping the `/app` demo experience intact for first-time visitors:

1. **Backend write-path comment-out** — the write-side-effect inside `upload_history_file()` (`_save_history_csv()` + `_history_1h` / `_history_1d` module-level assignments) is wrapped in a commented block. Endpoint still returns 200, CSV is still parsed, response still carries bar counts for the frontend toast — but the on-disk authoritative DB (`history_database/Binance_ETHUSDT_1h.csv` / `_d.csv`) and the in-memory module state stay untouched. Future auto-scraper (K-047) will replace the re-enabled write path.
2. **Frontend example CSV download** — `/app` renders a `Download example CSV` link in the upload region so visitors without their own CSV can experience the full upload → predict flow. File is served as a static asset from `frontend/public/examples/ETHUSDT_1h_test.csv` (Firebase Hosting), filename drops the `Binance_` prefix.

**Why (scope pivot from original K-046 plan):** user ruling 2026-04-24 — "不用拿掉 `/api/upload-history` api，只需要暫時先註解這個功能就好了" + "附上一個 example csv 的 link text，可以用你之前使用的測試檔案" + "檔名把 `Binance_` 拿掉". Original K-046 (remove DB write path, rename response schema, rewrite 4+2 backend tests, reshape frontend state) = large-scope refactor. Revised K-046 = surgical defensive comment + small demo affordance. Reversibility matters — K-047 auto-scraper will decide whether to re-enable or permanently excise.

**Paired with:** K-047 (Auto scraper for authoritative K-line history DB) — replaces upload-as-DB-maintenance with scheduled scraper-pull. K-047 stub reserved in repo (`docs/tickets/K-047-*.md`), no implementation yet. K-046 lands first and is independently valuable (stops DB-poisoning risk immediately).

## Scope

**In scope:**
- `backend/main.py` — wrap `_save_history_csv()` call + `_history_1h` / `_history_1d` mutation (lines 162-167) in a commented `#` block with `TODO(K-047)` marker; parse path + response payload unchanged (response still returns `added_count: 0` always because no merge happens from a frontend observer's view — but `bar_count` reflects parsed-upload count, not authoritative DB count; see BQ-46D for full semantics ruling)
- `frontend/public/examples/ETHUSDT_1h_test.csv` — new static asset (copied from `history_database/Binance_ETHUSDT_1h_test.csv`, filename with `Binance_` prefix stripped)
- `frontend/src/AppPage.tsx` — add `Download example CSV` link below (or adjacent to) the Upload History CSV label, always visible (not empty-state gated), with `download="ETHUSDT_1h_test.csv"` attribute pointing at `/examples/ETHUSDT_1h_test.csv`
- `backend/tests/test_main.py` — update 4 existing upload tests (AC-TEST-UPLOAD-1..4) for new invariants (mtime unchanged, `_history_1h` length unchanged); no test-rewrite scope beyond invariant change
- `agent-context/architecture.md` — 1-line note that `/api/upload-history` is temporarily commented-write pending K-047

**Out of scope (explicit):**
- Removing `/api/upload-history` endpoint or the frontend upload UI (both stay)
- `_merge_bars()` helper (still used by `/api/predict` and `/api/merge-and-compute-ma99` in-memory paths — unchanged)
- Reshaping response payload schema (no rename `added_count` → `parsed_bar_count`; see BQ-46D)
- Building K-047 scheduled scraper
- Adding auth to any endpoint
- Filename heuristic robustness — K-046 does not fix the `'1d' in name` substring collision bug (e.g. a filename like `ETHUSDT_1h_mar1d.csv` still routes to the 1D branch). With the write block commented out the downside is limited to a wrong `timeframe` field in the response payload; actual DB is untouched. Tracked as future tech debt, not a K-046 regression surface.

**Affected files (expected):**
- `backend/main.py` — lines 162-167 (write block comment-out) + 1-line comment at line 158 marking the gap
- `frontend/public/examples/ETHUSDT_1h_test.csv` — new file (~646 bytes)
- `frontend/src/AppPage.tsx` — lines 414-444 region (insert example download link)
- `backend/tests/test_main.py` — AC-TEST-UPLOAD-1..4 invariant updates
- `agent-context/architecture.md` — 1-line entry

## Acceptance Criteria

### AC-046-COMMENT-1 — Upload does not mutate on-disk history file

- **Given:** the backend server has booted with `HISTORY_1H_PATH` pointing at a real CSV file with a known `mtime_ns` and `size`
- **When:** a client POSTs a valid 1H CSV (with bars whose timestamps are newer than anything in the history file) to `/api/upload-history`
- **Then:** the HTTP response is `200 OK`
- **And:** after the request completes, `os.stat(HISTORY_1H_PATH).st_mtime_ns` and `st_size` are byte-identical to the pre-request snapshot
- **And:** reading `HISTORY_1H_PATH` back produces content byte-identical to the pre-request file content
- **And:** the same invariant holds for `HISTORY_1D_PATH` when the uploaded file is a 1D CSV (triggered by `1d` / `_d_` / `_d.csv` in filename)

### AC-046-COMMENT-2 — Upload does not mutate in-memory history state

- **Given:** the FastAPI app's module-level `_history_1h` list has N entries before the request
- **When:** a client POSTs a CSV containing M bars (with M ≥ 1 new timestamps not already in `_history_1h`) to `/api/upload-history`
- **Then:** after the request completes, `len(main._history_1h) == N` (zero delta, NOT N+M)
- **And:** `main._history_1h` is the same Python list object identity as before the request (no reassignment happened — `id(main._history_1h)` unchanged)
- **And:** the same invariant holds for `_history_1d` when the uploaded file is a 1D CSV

### AC-046-COMMENT-3 — Response payload remains meaningful for frontend

- **Given:** the client POSTs a valid CSV containing M parseable bars to `/api/upload-history`
- **When:** the response body is parsed by the frontend
- **Then:** the JSON response schema is unchanged from pre-K-046: `{ filename, latest, bar_count, added_count, timeframe }`
- **And:** response still carries this `filename` field unchanged for schema stability; current frontend ignores it (`AppPage.tsx:306` reads `file.name` from the user-selected File object) but future consumers MAY use it
- **And:** `latest` is the latest timestamp from the existing authoritative `_history_*` (NOT from the merged list, because no merge-assignment happens) — i.e. `existing[-1]['date']` in the handler's local scope
- **And:** `bar_count` is `len(existing)` (the authoritative DB bar count) — NOT `len(merged)`, because `merged` is no longer persisted anywhere
- **And:** `added_count` is always `0` regardless of upload contents (because no bars are added to state)
- **And:** `timeframe` is `'1H'` or `'1D'` per filename heuristic (unchanged)
- **And:** the existing frontend `lastHistoryUpload` state shape (`AppPage.tsx:306`) reading `added_count` + `bar_count` continues to render without TypeScript error or runtime crash

### AC-046-COMMENT-4 — Response semantics toast remains correct with `added_count === 0`

- **Given:** the user uploads any valid CSV via the `/app` Upload History CSV UI
- **When:** the upload succeeds
- **Then:** the existing conditional branch at `AppPage.tsx:438-440` renders the already-there "資料已是最新，無需更新（共 N bars）" copy (because `addedCount === 0` is always true post-K-046)
- **And:** the toast border/background uses the already-there informational gray-border variant (`border-gray-700 bg-gray-800/40 text-gray-400`), not the green success variant — existing conditional is correct for K-046 semantics without edit
- **And:** no Chinese copy change is required in this ticket (frontend stays as-is; only the comment-out + example-link changes land)

### AC-046-EXAMPLE-1 — Frontend /app shows Download example CSV link near upload UI

- **Given:** the user navigates to `/app` for the first time (no prior upload state)
- **When:** the page renders the sidebar History Reference section (`AppPage.tsx:408-431` region)
- **Then:** immediately below the Upload History CSV `<label>` (lines 415-430) or adjacent to the existing "時間欄位須為 UTC+0" hint, there is a visible anchor element with text `Don't have a CSV? Download example →`
- **And:** the anchor's `href` is `/examples/ETHUSDT_1h_test.csv` (repo-root relative, served via Firebase Hosting static assets)
- **And:** the anchor carries a `download="ETHUSDT_1h_test.csv"` attribute (HTML5 force-download hint)
- **And:** the anchor uses the existing small-text inline style (`text-[10px]` or `text-[11px]` + `text-gray-500` for label, with `text-blue-400 hover:text-blue-300` or equivalent link color for the clickable word `Download example`) — must be visually subordinate to the Upload label, not dominate
- **And:** the link is always rendered (not empty-state-gated, not hidden after upload)

### AC-046-EXAMPLE-2 — Clicking the link downloads ETHUSDT_1h_test.csv

- **Given:** the user is on `/app` with the Download example CSV link rendered
- **When:** the user clicks the link
- **Then:** the browser initiates a download of a file literally named `ETHUSDT_1h_test.csv` (no `Binance_` prefix anywhere in the downloaded filename)
- **And:** the downloaded file byte content matches `frontend/public/examples/ETHUSDT_1h_test.csv` (which is a verbatim copy of `history_database/Binance_ETHUSDT_1h_test.csv` as of K-046 landing — 646 bytes, 7 lines)
- **And:** the file opens as a valid CSV parseable by `_parse_csv_history_from_text()` (header row on line 2 after the `https://www.CryptoDataDownload.com` provenance row, OHLCV rows following, UTC+0 timestamps)

### AC-046-EXAMPLE-3 — Example CSV round-trips through upload → predict flow

- **Given:** the user has downloaded `ETHUSDT_1h_test.csv` via the example link
- **When:** the user immediately re-uploads that same file via the Upload History CSV button (unchanged bytes)
- **Then:** the upload returns `200 OK`
- **And:** the frontend toast renders the existing "資料已是最新，無需更新" informational copy (per AC-046-COMMENT-4)
- **And:** the on-disk authoritative DB and in-memory state remain unchanged (per AC-046-COMMENT-1, -2)
- **And:** subsequent `/api/predict` calls in the same session succeed (the example's 5 bars are insufficient for full 24-bar query, but the ticket's AC is "parseable round-trip without error", not "produces a match"; the user's separate CSV is expected for real prediction)

### AC-046-REGRESSION-SACRED — K-009 + K-013 invariants preserved

- **Given:** K-009 AC-009-1H-MA99-FROM-1D locks `/api/predict` 1H path using `_history_1d` for MA99 (line 296 `ma_history=_history_1d`)
- **When:** K-046 refactor lands
- **Then:** `/api/predict` 1H response's `query_ma99_1h` is byte-identical to pre-K-046 for the same fixture input
- **And:** `/api/predict` 1D response's `query_ma99_1d` is byte-identical to pre-K-046
- **And:** `/api/merge-and-compute-ma99` response (K-009 / K-013 behavior, in-memory ephemeral merge path lines 252-254) is byte-identical to pre-K-046
- **And:** `backend/tests/fixtures/stats_contract_cases.json` (K-013 cross-layer contract) still validates with `test_predictor.py::test_stats_contract` — all existing cases PASS
- **And:** `/api/example` endpoint returns bit-identical JSON before and after any number of `/api/upload-history` POSTs (implied invariant from AC-046-COMMENT-1: DB unchanged ⇒ /api/example output unchanged)

### AC-046-QA-2 — Reversibility invariant (fail-if-write-block-restored)

- **Given:** a fresh `_history_1h` with N ≥ 1 bars and `HISTORY_1H_PATH` pointed at `tmp_path` with a known `mtime_ns` captured pre-request
- **When:** the client POSTs a valid 1H CSV containing M ≥ 1 bars whose timestamps are **strictly later** than any bar in `_history_1h` (so `_merge_bars(existing, new_bars)` would produce `len(merged) == N + M` if the write block were active)
- **Then:** the HTTP response is `200 OK`
- **And:** `response.json()["added_count"] == 0` (honest reporting per AC-046-COMMENT-3, NOT M)
- **And:** `len(main._history_1h) == N` (unchanged — the module-level list has zero delta even though merged would have produced N+M)
- **And:** `os.stat(HISTORY_1H_PATH).st_mtime_ns == pre_mtime_ns` (file not written)
- **Why:** only this test fails if a future edit accidentally uncomments the K-046 write block. The pre-K-046 merge dedup test (`test_upload_duplicate_bars_added_count_zero`) passes even before K-046 lands, so it has zero monitoring power for the comment-out invariant. This AC is the reversibility guard.

### AC-046-QA-3 — Playwright E2E round-trip for example download link

- **Given:** a Playwright session on `/app` with backend mocked — `POST /api/upload-history` returns `{ filename: "ETHUSDT_1h_test.csv", latest: null, bar_count: 1000, added_count: 0, timeframe: "1H" }`
- **When:** the page first renders
- **Then:** a visible anchor element with text matching `/Download example/i` is rendered
- **And:** that anchor's `href` attribute equals `/examples/ETHUSDT_1h_test.csv` AND `download` attribute equals `ETHUSDT_1h_test.csv`
- **And:** a `request.get('/examples/ETHUSDT_1h_test.csv')` issued from the Playwright page context returns HTTP 200 with `Content-Length` 646 (byte count parity with `frontend/public/examples/ETHUSDT_1h_test.csv`)
- **And:** using `setInputFiles()` to upload that same CSV back via the Upload History CSV input triggers the mocked `POST /api/upload-history` call, and the response handler renders the toast copy matching `/資料已是最新/`
- **New spec file:** `frontend/e2e/K-046-example-upload.spec.ts`
- **Notes on assertion shape (see Known Gap GAP-3):** `getAttribute('download')` asserts the HTML attribute value, not the filesystem filename — sufficient for Playwright Chromium; Safari/Firefox filesystem-filename parity is NOT in scope

### AC-046-QA-4 — Backend CSV format round-trip test

- **Given:** `backend/tests/test_main.py` reads the raw bytes of `frontend/public/examples/ETHUSDT_1h_test.csv` from disk (path resolved relative to repo root)
- **When:** those bytes are POSTed to `/api/upload-history` as a multipart upload with filename `ETHUSDT_1h_test.csv`
- **Then:** `response.status_code == 200`
- **And:** `response.json()["timeframe"] == "1H"` (no 1D misdetection from the `1h` substring)
- **And:** `response.json()["added_count"] == 0` (K-046 invariant)
- **And:** the handler's internal parse succeeds with ≥ 5 OHLCV bars extracted from the CSV body (header row + 5 data rows per the 646-byte fixture)
- **Why:** catches future edits to the example CSV fixture (accidental CRLF line endings, BOM prefix, column reorder, header drift) that would silently break the user-visible round-trip flow asserted by AC-046-EXAMPLE-3. Decouples "file shipped in /public" from "file is a valid backend-parseable CSV".

### AC-046-DOCS — architecture.md reflects the comment-out

- **Given:** K-046 lands
- **When:** reader opens `agent-context/architecture.md` current-state block
- **Then:** a 1-line English note describes `/api/upload-history` as "write-disabled (commented-out pending K-047 auto-scraper)" with a K-046 pointer
- **And:** the line is added via Architect's Step "每次任務結束前必同步 architecture.md" path, not by Engineer

## Phase Plan

### Phase 1 — Backend comment-out + test invariant update

- Engineer wraps `backend/main.py:162-167` (the `if added_count > 0:` block that calls `_save_history_csv()` and assigns `_history_1d` / `_history_1h`) in a multi-line comment, preserving the logic verbatim behind `#` for easy K-047 uncomment
  - Add a leading comment line above the block:
    ```python
    # TODO(K-047): re-enable upload-driven DB write once auto-scraper lands.
    # Commented-out 2026-04-24 per K-046 to prevent anonymous public writes to authoritative history DB.
    ```
  - The `merged = _merge_bars(existing, new_bars)` and `added_count = len(merged) - original_count` computations on lines 159-160 can stay active (they're local variables; no side effect) — but reading them into the response payload needs adjustment per AC-046-COMMENT-3
  - Adjust response payload (lines 170-176) so that the observable semantics match AC-046-COMMENT-3: `filename` = `target_path.name`, `latest` = `existing[-1]['date'] if existing else None` (from authoritative, not merged), `bar_count` = `len(existing)`, `added_count` = `0` (hardcoded), `timeframe` unchanged. This keeps the schema shape stable for the frontend while honestly reporting DB-observable state.
- Engineer updates `backend/tests/test_main.py` AC-TEST-UPLOAD-1..4:
  - UPLOAD-1 (1H happy path) → add assertion: `os.stat(HISTORY_1H_PATH).st_mtime_ns == pre_mtime_ns` + `len(main._history_1h) == pre_len`
  - UPLOAD-2 (1D filename detection) → add same invariants on `HISTORY_1D_PATH` + `_history_1d`
  - UPLOAD-3 (empty file → 422) → unchanged (error path still applies)
  - UPLOAD-4 (duplicate bars) → previously asserted `added_count == 0` and `bar_count == N`; under K-046 the assertion `added_count == 0` stays true trivially; also add `mtime` invariant
  - Optionally add one new test UPLOAD-RO-5 asserting `added_count === 0` regardless of payload novelty (explicit K-046 invariant) — Engineer ruling based on coverage judgment
- **Gate:** `python3 -m pytest backend/tests/` all pass (counts match pre-K-046 baseline ± new UPLOAD-RO-5 if added)
- **Gate:** `python3 -m py_compile backend/main.py` exit 0

### Phase 2 — Frontend example CSV asset + download link

- Engineer confirms `frontend/public/examples/ETHUSDT_1h_test.csv` exists (already landed by PM in this ticket commit — verify byte-identical to `history_database/Binance_ETHUSDT_1h_test.csv`)
- Engineer inserts the Download example CSV link into `AppPage.tsx` near line 418 (adjacent to the existing "時間欄位須為 UTC+0" hint) — render pattern:
  ```tsx
  <a
    href="/examples/ETHUSDT_1h_test.csv"
    download="ETHUSDT_1h_test.csv"
    className="text-[10px] text-gray-500 hover:text-blue-400"
  >
    Don't have a CSV? Download example →
  </a>
  ```
  Placement detail: render as a sibling `<span>`/`<a>` immediately after the UTC+0 hint inside the same flex-column label content block, OR as a sibling element directly below the `<label>` — Engineer picks based on visual balance, but link must always be visible (not hidden by upload state).
- **Gate:** `npx tsc --noEmit` exit 0
- **Gate:** Playwright full suite pass at pre-K-046 baseline (no new spec required — example link covered by AC Playwright assertion added in Phase 2 if QA requests; otherwise manual dev-server visual check per `/playwright` convention)

### Phase 3 — Architecture.md sync + Phase Gate close

- Architect appends 1-line entry to `agent-context/architecture.md` current-state block: `/api/upload-history — upload-driven DB write commented out 2026-04-24 per K-046 (security: prevent anonymous writes to authoritative history DB); K-047 auto-scraper will replace write path on schedule. Endpoint still parses uploaded CSV and returns 200 with observable (non-mutated) DB state in response payload.`
- PM Phase Gate verifies: AC-046-COMMENT-1..4 + AC-046-EXAMPLE-1..3 + AC-046-REGRESSION-SACRED + AC-046-DOCS all PASS; Deploy Record block written; close commit

## Blocking Questions — PM Rulings

### BQ-046-D — Scope of comment-out: full handler body (return 501) vs write block only

**Options raised (this session):**
- **(X)** Full handler body commented → endpoint returns 501 Not Implemented. Most defensive: zero parse cost, zero response surface, frontend upload UI must be visibly disabled or it will error-toast on every click.
- **(Y)** Comment only the write block (lines 162-167); parse + response still run; `added_count` always 0, `bar_count` reflects authoritative DB.

**PM ruling: (Y).**

**Rationale per 4-source priority (per `feedback_pm_self_decide_bq.md`):**
1. Pencil `.pen` design — no frame covers backend API behavior. No signal.
2. Ticket text — user's verbatim 2026-04-24 scope: "不用拿掉 /api/upload-history api, 只需要暫時先註解這個功能就好了" — "暫時" (temporarily) + "先" (for now) → reversible surgical comment, not endpoint disabling. Plus the Download example CSV AC requires user round-trip through upload → this is impossible if upload endpoint returns 501. Both together point unambiguously to (Y).
3. Memory — `feedback_engineer_no_scope_downgrade.md` (minimize unintended diff), `feedback_playwright_mock_realism.md` (preserve frontend observable contract to avoid silent downstream breaks). Both lean (Y).
4. Codebase — `/api/predict` and `/api/merge-and-compute-ma99` still use `_merge_bars()` in-memory (lines 252, 278). Upload's parse path stays useful + aligns with the in-memory merge pattern. (Y) keeps the conceptual surface consistent.

Verdict: (Y). Comment out lines 162-167 write block only; parse + response payload preserved; response payload adjusted so `latest` + `bar_count` honestly reflect authoritative DB state (not ghost-merged state).

### BQ-046-E — Example CSV artifact location

**Options raised:**
- **(A)** Copy CSV to `frontend/public/examples/ETHUSDT_1h_test.csv` — Firebase Hosting serves it as a static asset. Zero backend roundtrip.
- **(B)** New `/api/example-download` FastAPI endpoint that streams the file from `history_database/Binance_ETHUSDT_1h_test.csv` — requires backend dispatch; lets backend control filename on the fly.

**PM ruling: (A).**

**Rationale per 4-source priority:**
1. Pencil — no signal.
2. Ticket text — user: "可以用你之前使用的測試檔案, 給使用者參考" + "檔名把 Binance_ 拿掉". A simple copy + rename satisfies both exactly, no backend dependency.
3. Memory — `feedback_api_path_scan_all_clients.md` implies we already audit `/api/` paths carefully; adding a new endpoint multiplies deploy dependencies with no gain. `feedback_firebase_hosting_public_dir.md` already establishes `frontend/public/` as the correct serve location.
4. Codebase — `frontend/public/` already serves `diary.json` (runtime fetch) + `manifest.json` + favicons. `examples/` is a conventional subdirectory. Firebase Hosting `public` dir already points at `frontend/dist` (which Vite populates from `public/`), so the artifact ships with every deploy.

Verdict: (A). File landed at `frontend/public/examples/ETHUSDT_1h_test.csv`, served from `https://<host>/examples/ETHUSDT_1h_test.csv`. File size is 646 bytes (7 lines — CryptoDataDownload provenance row + 1 CSV header + 5 OHLCV rows), small enough to keep as-is without truncation.

### BQ-046-F — Download link copy + placement

**Options raised:**
- Placement: (α) sibling span under Upload History CSV label, always visible ←→ (β) empty-state-gated section (only shown before first upload) ←→ (γ) dedicated sidebar block.
- Copy: `Don't have a CSV? Download example →` vs `Download example CSV` vs `Try with example data →`.

**PM ruling: (α) always visible + copy `Don't have a CSV? Download example →`.**

**Rationale per 4-source priority:**
1. Pencil — no `/app` frame per K-021 §2 (route is dev-tool, not design-reviewed). No signal.
2. Ticket text — user: "empty-state 時最顯眼、upload 後仍保留連結" → always visible, not hidden by upload state. Direct match with (α). Plus user's phrasing "link text" signals compact inline text, not banner/block, eliminating (γ).
3. Memory — `feedback_readme_plain_language.md` (plain language, no jargon). `Don't have a CSV? Download example →` is plain + invitational; `Download example CSV` is terse but less contextual for first-time visitors.
4. Codebase — `AppPage.tsx:418` already has pattern `<span class="text-[10px] text-gray-500">時間欄位須為 UTC+0</span>` — identical style for the new link, one line of text, no iconography.

Verdict: (α) always-visible inline link, copy `Don't have a CSV? Download example →`, style `text-[10px] text-gray-500 hover:text-blue-400`, rendered immediately after the UTC+0 hint. No empty-state gating.

## Test Coverage Plan

**Backend (pytest):**
- 4 updated AC-TEST-UPLOAD-1..4 tests + optional UPLOAD-RO-5 = 4–5 tests
- Each asserts an independent invariant (mtime_ns, module state length + identity, response schema, parse still succeeds). Parallel Given: AC-046-COMMENT-1 covers 1H + 1D timeframes × mtime invariant × length invariant = 4 independent assertions inside 2 test functions (one per timeframe). **Minimum 2 independent Playwright/pytest cases required** (1H path + 1D path); do not merge into one parameterized function that hides per-path failure.

**Frontend (Playwright):**
- AC-046-EXAMPLE-1 + EXAMPLE-2 + EXAMPLE-3 — if QA Early Consultation calls for new E2E spec, cover: (a) link is visible on `/app` initial render with correct `href` + `download` attributes; (b) clicking link initiates download (check `getAttribute('download')` rather than trigger download + inspect filesystem — Playwright-friendly); (c) optional: upload → toast copy assertion is covered by existing frontend state, no new spec needed unless QA requests.
- Parallel Given: AC-046-EXAMPLE-1..3 are 3 independent assertions (link rendered / filename + href correct / round-trip upload succeeds) → **3 independent test cases** if QA requests coverage.

**Cross-layer fixture:**
- K-013 `stats_contract_cases.json` validation must still pass (AC-046-REGRESSION-SACRED)

## Sacred Invariants

**Preserved:**
- K-009 AC-009-1H-MA99-FROM-1D — `/api/predict` 1H path uses `_history_1d` for MA99 (line 296 `ma_history=_history_1d`), unchanged by K-046
- K-013 cross-layer stats contract — `stats_contract_cases.json` validation path unchanged
- `/api/predict` in-memory ephemeral merge (line 278) — unchanged; this is the actual path pattern-matching uses, independent of upload-handler write status

**Retired by K-046:** none — no prior Sacred clause locked `/api/upload-history` write behavior.

## Known Gaps

PM-acknowledged coverage limits on K-046. Each gap was surfaced by QA Early Consultation and explicitly ruled acceptable — documented here so downstream reviewers do not misread them as regression misses.

### GAP-1 — Concurrency / race-condition testing for upload handler

- **Gap:** no AC exercises concurrent POSTs against `/api/upload-history` (e.g. two uploads in flight while the module-level `_history_1h` list is being read/written elsewhere)
- **Reason ruled acceptable:** FastAPI `TestClient` is single-request by design; concurrent repro would need `asyncio.gather` + a real uvicorn instance. Moreover, post-K-046 the write block is commented out, so the only remaining module-state touchpoints on this handler are reads against a list that startup-loads and never mutates within this handler — there is no race surface to test. If K-047 re-enables the write path, concurrency coverage becomes a hard gate at that point.
- **PM acknowledgment:** moot for K-046; revisit at K-047 Architect design phase.

### GAP-2 — Firebase Hosting first-deploy 404 race for `/examples/*.csv`

- **Gap:** AC-046-EXAMPLE-2 asserts a 200 response for `GET /examples/ETHUSDT_1h_test.csv`, but CDN propagation after a fresh `firebase deploy` can create a ~100ms window where `index.html` is already serving the new bundle while the new `/examples/` asset is still propagating, producing a transient 404 for users who happen to click the link in that window.
- **Reason ruled acceptable:** no deterministic Playwright repro without a real deploy; the window is ops-time not build-time. A local `firebase serve` or mocked fetch cannot reproduce the CDN layer behavior.
- **PM acknowledgment:** ops-time risk, not build-time; monitor manually on deploy day. If it recurs post-K-046 landing, track as a deploy-sequencing tech debt ticket.

### GAP-3 — Cross-browser `download` attribute behavior for same-origin hrefs

- **Gap:** AC-046-EXAMPLE-2 asserts the `download="ETHUSDT_1h_test.csv"` attribute value on the anchor element, not the filename that actually hits the user's filesystem after clicking. Safari and Firefox have historically been inconsistent about honoring `download="..."` on same-origin links vs triggering in-page display.
- **Reason ruled acceptable:** Playwright default project is Chromium, which honors `download=` reliably. Attribute-level assertion is the strongest decoupled proof that the frontend intent is correct; OS-filesystem-level assertion would require adding WebKit + Firefox projects to `playwright.config.ts`, which is a significant scope expansion beyond K-046.
- **PM acknowledgment:** attribute-level assertion sufficient for K-046 scope; no new Playwright projects added. Cross-browser download verification remains manual QA on deploy day.

## Release Status

- 2026-04-24 — K-046 opened (original scope: remove DB write path; 7 ACs)
- 2026-04-24 — PM halt: upper session lacked Agent tool, QA Early Consultation could not real-spawn
- 2026-04-24 — **Scope revision by user**: `/api/upload-history` kept (comment-out write block only) + add example CSV download on `/app` + example filename drops `Binance_` prefix
- 2026-04-24 — PM rewrote PRD: 8 ACs (4 COMMENT + 3 EXAMPLE + 1 REGRESSION + 1 DOCS), 3 BQ rulings (BQ-46D/E/F all PM-decided), 3-Phase plan
- 2026-04-24 — **ready for QA Early Consultation** → main session to spawn real qa sub-agent → PM ingests feedback → ticket AC supplemented if needed → Architect release
- 2026-04-24 — **QA Early Consultation complete (real qa sub-agent):** verdict READY, no Sacred conflicts (K-009 + K-013 both verified preserved). PM ingested 5 supplemental recommendations + 3 Known Gaps. Applied to ticket: wording fix on AC-046-COMMENT-3 bullet 2 (response `filename` field is consumer-agnostic, frontend reads `file.name` not `uploadResult.filename`); 3 new ACs appended (AC-046-QA-2 reversibility / AC-046-QA-3 Playwright round-trip / AC-046-QA-4 backend CSV format round-trip); Out-of-scope gains 1 bullet for filename-heuristic tech debt; new §Known Gaps section documents 3 PM-acknowledged coverage limits (concurrency moot, CDN propagation ops-time, cross-browser download attribute-level). AC count: 8 → 11. Ticket ready for Architect release.
- 2026-04-24 — **Architect design complete:** `docs/designs/K-046-comment-out-upload-write.md` landed; Option A (write-block-only comment-out) recommended matching BQ-46D; OLD vs NEW 6-row truth table; Route Impact = `/app` only; Shared Component Inventory = none (inline `<a>`); Sacred preservation K-009 + K-013 + TD-003 moot-pending-K-047 all documented; architecture.md Phase 3 sync plan included.
- 2026-04-24 — **Engineer Phase 1–3 landed:** commits `40e1e48` (backend comment-out + test invariants) + `922bfa2` (frontend example CSV link + E2E spec). Pre-commit gates: `python3 -m py_compile backend/main.py` exit 0; pytest 70/70 including 2 new tests (AC-046-QA-2 strictly-later reversibility + AC-046-QA-4 example CSV round-trip); `npx tsc --noEmit` exit 0; `frontend/e2e/K-046-example-upload.spec.ts` 3/3 green.
- 2026-04-24 — **Code Review two-layer PASS:** Step 1 `superpowers:code-reviewer` breadth: 0 Critical / 0 Important / 5 Minor. Step 2 `Agent(reviewer.md)` depth: READY TO MERGE — Behavior Diff truth table every OLD→NEW delta AC-pinned; 12/12 AC impl+test matrix complete; Sacred K-009 + K-013 preserved (verified via `git show 0ec215e:backend/main.py` dry-run); Git Status Commit-Block Gate PASS (no runtime-scope dirty at PASS time). 5 Minor findings re-classified by Reviewer as accept-as-is after depth analysis.
- 2026-04-24 — **QA regression sign-off (real qa sub-agent):** pytest 70/70 + Playwright full suite 284/284 baseline (2 pre-existing failures inherited from pre-K-046 HEAD per K-045 architect retro: `ga-spa-pageview.spec.ts::AC-020-BEACON-SPA` + `shared-components.spec.ts::Footer snapshot on /diary` subpixel drift; both confirmed K-045-class, NOT K-046-caused) + tsc exit 0. Prod-endpoint smoke test against real uvicorn + 3.5MB authoritative history file (`Binance_ETHUSDT_1h.csv`, 73990 bars) — `mtime_ns` + `size` + md5 byte-identical pre/post upload, confirming comment-out also holds on real on-disk DB beyond tmp_path fixture coverage. `TICKET_ID=K-046` prepended on full-suite command per K-041 retro learning, post-step verification confirmed `K-046-visual-report.html` exists + `K-UNKNOWN-*.html` absent.
- 2026-04-24 — **PM ruled on 3 post-review items** (see §PM Rulings below); ticket moves to **ready-to-deploy** state. Deploy (`firebase deploy --only hosting` per K-Line `CLAUDE.md §Deploy Checklist`) gated by main session + user confirmation; Deploy Record remains PENDING until post-deploy.

## PM Rulings (Post-Review)

Ruled 2026-04-24 after ingesting Reviewer Step 1 breadth + Step 2 depth + QA regression sign-off. Each ruling cites the 4-source priority per `feedback_pm_self_decide_bq.md`.

### 1. 5 Minor findings (M-1..M-5) — accept-as-is, NO Tech Debt entry

- **Items:**
  - **M-1** `added_count_local` local-var rename (backend/main.py in comment-out block)
  - **M-2** lexicographic `max_existing` sanity note in merge helper
  - **M-3** conditional `Content-Length` assertion phrasing in K-046 E2E
  - **M-4** `>= 5` fixture bar-count lower bound asymmetry with example CSV's exactly-5 rows
  - **M-5** tab-order a11y sequence for new anchor element

- **Ruling:** **Accept-as-is, no TD entry, no catch-all log.**

- **4-source priority walk:**
  1. Pencil — no frame covers backend internal naming / E2E assertion phrasing / a11y tab-order detail at this granularity. No signal.
  2. Ticket text — all 5 items are outside PRD AC scope (AC-046-COMMENT-1..4 + AC-046-EXAMPLE-1..3 + AC-046-REGRESSION-SACRED + AC-046-QA-2..4 + AC-046-DOCS all PASS per Code Reviewer + QA). None of M-1..M-5 falls under an AC violation. No signal toward Fix-Now.
  3. Memory — `feedback_measure_before_restructure.md` (quantify bottleneck before structural change); `feedback_retrospective_honesty.md` (no fabricated tracking); `feedback_pm_close_bq_iteration.md` (`DEFERRED-TO-TD-XXX` label requires the TD file to exist at close, and the TD must carry a scoped problem — catch-all "Minor accept log" TD is exactly the paperwork-only anti-pattern the rule guards against). Reviewer already re-classified all 5 as accept-as-is after depth analysis — creating a single catch-all TD entry would add a SOR with no owner, no scheduled remediation, no recurring signal, and no behavior change trigger. All 3 memory sources align: accept-as-is without TD.
  4. Codebase — M-1..M-5 are style/phrasing preferences at local-variable / assertion-shape / a11y-detail scope. No existing file convention is violated; no cross-file consistency contract is broken; no future-maintenance footgun is created (`added_count_local` rename, `Content-Length` phrasing are within normal Python / Playwright idiom range).

- **Verdict rationale:** Reviewer's depth re-classification is the authoritative ruling on these 5 items; PM endorses accept-as-is. Logging rationale inline in this section (not as TD) so future audit trail reads "5 Minor items ruled at 2026-04-24 close, reasoning here" rather than "5 Minor items → TD-K046-01 catch-all → unresolved forever". If any of M-1..M-5 recurs in a future ticket's review, that second-occurrence becomes the trigger to file a real TD at that point.

### 2. GAP-1 (concurrency surface for `/api/upload-history`) — RESOLVED, tracker = K-047 Architect design phase (existing persisted artifact, no new TD)

- **Context:** PRD §Known Gaps GAP-1 documents that no AC exercises concurrent POSTs against `/api/upload-history`; FastAPI `TestClient` is single-request by design; concurrent repro would need `asyncio.gather` + real uvicorn. Post-K-046 write block is commented, so the race surface on the upload handler is removed until K-047 re-enables the write path. Design doc `docs/designs/K-046-comment-out-upload-write.md §7 Sacred Preservation Notes` L279 explicitly states: "TD-003 (upload handler concurrency risk) — becomes moot post-K-046 because there is no write path to race on. See ticket §Known Gaps GAP-1. Revisit at K-047 design." `agent-context/architecture.md` L252 has a parallel annotation.

- **Ruling:** **RESOLVED — tracker = K-047 Architect design phase**; NO new TD opened.

- **4-source priority walk:**
  1. Pencil — no signal for backend concurrency design.
  2. Ticket text — K-046 PRD §Known Gaps GAP-1 already names "K-047 Architect design phase" as the resurfacing moment; design doc §7 re-iterates; architecture.md L252 cross-links. Three persisted SORs already point at K-047 as the tracker.
  3. Memory — `feedback_pm_close_bq_iteration.md` requires at-close each BQ is RESOLVED / DEFERRED-TO-TD-XXX / OPEN. "DEFERRED-TO-TD" requires the TD ticket to exist AND carry a scoped problem. Opening a new TD now for "revisit concurrency at K-047" would create a fourth SOR duplicating the existing K-047-design-phase pointer, with no additional signal — identical anti-pattern to Ruling #1. `feedback_dual_repo_mirror_gap_detection.md` / `feedback_retrospective_honesty.md` collectively point toward: one issue, one tracker (not three, not four).
  4. Codebase — K-047 ticket stub is already reserved in repo (`docs/tickets/K-047-*.md` per Release Status 2026-04-24 opening entry). Architect on K-047 will encounter `# TODO(K-047)` markers at `backend/main.py:162-167` when uncommenting; those markers plus the three existing SORs force the concurrency question to surface at K-047 design time. No additional tracker needed.

- **Verdict rationale:** GAP-1 is **RESOLVED (pointer persisted)** per `feedback_pm_close_bq_iteration.md` §RESOLVED label — the pointer to K-047 Architect design phase exists in 3 locations (ticket §Known Gaps + design doc §7 + architecture.md L252) and the `TODO(K-047)` source-level marker guarantees the K-047 Architect session will surface the concurrency concern. Not OPEN (no work owed here), not DEFERRED-TO-TD (the existing K-047 ticket IS the tracker, a duplicate TD would dilute signal).

### 3. TD-003 moot window — keep TD-003 listed with "moot until K-047" annotation; do NOT close

- **Context:** `agent-context/architecture.md` L252 currently reads "用 module globals（`_history_1h` / `_history_1d`）做 read-merge-write-swap，無同步機制，併發上傳可能遺失 bars。**Post-K-046 write path 註解後 race surface 移除**，直到 K-047 重啟 write path 再回到此風險面；revisit 於 K-047 Architect design phase." L393 tech-debt row still lists TD-003 as open.

- **Ruling:** **Keep TD-003 listed (not closed) with the existing moot-until-K-047 annotation.**

- **4-source priority walk:**
  1. Pencil — no signal.
  2. Ticket text — TD-003 defines the race risk against module-global mutation. K-046 removed the *write path* that triggers the mutation, but did NOT remove `_history_1h` / `_history_1d` as module globals, did NOT add `asyncio.Lock`, did NOT extract a `history_repository.py`. The underlying design problem (race-prone module globals) is still present in the code; only the specific write entry-point is commented. When K-047 re-enables an auto-scraper-driven write path, the race surface returns — possibly worse, because a scheduled scraper + concurrent `/api/predict` reads hit the same unsynchronized module globals.
  3. Memory — `feedback_retrospective_honesty.md` (no premature celebration); `feedback_pm_close_bq_iteration.md` (a TD with a still-valid underlying design problem stays open even when the acute trigger path is temporarily disabled). Closing TD-003 now would claim "resolved" on a problem that is only dormant; worse, if K-047 Architect doesn't re-read TD-003 (because it's closed), the race re-surfaces silently in production.
  4. Codebase — `backend/main.py` still carries module-level `_history_1h: list[dict] = []` + `_history_1d: list[dict] = []` + the commented-out `_history_*_= merged` assignment lines. The race primitive is unchanged; only the specific mutation call site is disabled. `/api/predict` + `/api/merge-and-compute-ma99` still *read* these globals concurrently with other handlers.

- **Verdict rationale:** TD-003 remains a valid open tech-debt entry describing the module-global-mutation race pattern. The L252 moot annotation + the "revisit於 K-047" pointer accurately capture the current state (race trigger path commented, race primitive still present). Closing TD-003 would mis-represent K-046's scope — K-046 is a *defensive comment-out*, not a *concurrency fix*. K-047 Architect design MUST re-read TD-003 before re-enabling any write path; keeping TD-003 open is what forces that read.

## Retrospective

### Engineer (2026-04-24)

**AC judgments that were wrong:** T3 E2E 首次用 `page.locator('input[type="file"]')` 撞 strict-mode（`/app` 有 2 個 file input：multi-select OHLC + History CSV）。重新讀 JSX 後改用 label 容器限定才通過 — AC-046-QA-3 的 setInputFiles 動作需要精確 selector，第一版沒考量頁面整體有多個同類 input。

**Edge cases not anticipated:** Vitest `diary.legacy-merge.test.ts` 在 HEAD 就已失敗（legacy text word count < 50），與 K-046 scope 無關，但 full-gate 跑 Vitest 時會觸發；已 stash 後確認同失敗，非本票責任。

**Next time improvement:** Edit page 級檔前先 `grep 'input\[type="file"\]' <target-file>` 盤點同類 DOM，避免 E2E 階段才被 Playwright strict-mode 提醒。

## Ready-to-Deploy Block

Ticket reached ready-to-deploy state 2026-04-24 after Reviewer two-layer PASS + QA regression sign-off + PM rulings on 3 post-review items (see §PM Rulings above). Deploy execution (`firebase deploy --only hosting` per `K-Line-Prediction/CLAUDE.md §Deploy Checklist`) is gated by the main session + user confirmation — PM sub-agent session does NOT run deploy.

**Pre-deploy gate evidence captured at ready-to-deploy time:**

- Engineer commits: `40e1e48` (backend comment-out + test invariants) + `922bfa2` (frontend example CSV link + E2E spec) + `2ef3188` (Engineer retrospective docs-only)
- Worktree HEAD at ready-to-deploy: will be recorded at deploy time by main session
- py_compile: exit 0 on `backend/main.py`
- pytest: 70/70 including 2 new AC-046-QA-2 reversibility + AC-046-QA-4 example CSV round-trip
- tsc: exit 0
- Playwright K-046 spec: 3/3 (`frontend/e2e/K-046-example-upload.spec.ts`)
- Playwright full regression: 284/284 baseline (2 pre-existing non-K-046 failures documented in Release Status + QA retrospective 2026-04-24 K-046 entry)
- Prod-endpoint smoke: real uvicorn + 3.5MB authoritative history (73990 bars) — mtime_ns + size + md5 byte-identical pre/post upload (comment-out verified beyond tmp_path fixture scope)
- Sacred cross-check: K-009 `ma_history=_history_1d` (main.py:297) untouched; K-013 `stats_contract_cases.json` handler non-overlapping; verified via `git show 0ec215e:backend/main.py` dry-run per Reviewer depth pass

**Status remains `open` until Deploy Record is filled post-deploy by main session.** The project convention (per K-045) writes `status: closed` + `deployed: YYYY-MM-DD` + `deployed-commit: <SHA>` atomically at Deploy Record completion time. Leaving `status: open` here signals "ready-to-deploy, not yet deployed".

## Deploy Record

- firebase hosting: **PENDING** (main session gates user confirmation)
- cloud run: **PENDING** (main session gates user confirmation; K-046 is frontend + backend — `/api/upload-history` behavior change lives in `backend/main.py`, so Cloud Run deploy is required in addition to Firebase Hosting)
- prod smoke: **PENDING** post-deploy

Placeholder only — actual deploy date / Git SHA at deploy / hosting bundle hash / Cloud Run revision / verification probe output / release status will be filled by main session after successful `firebase deploy --only hosting` + `gcloud run deploy` (if applicable) per `K-Line-Prediction/CLAUDE.md §Deploy Checklist`.

**Verification probe plan (to be executed post-deploy by main session):**

- **Frontend (Firebase Hosting):** `curl -s https://k-line-prediction-app.web.app/assets/index-<hash>.js | grep -oE 'Download example' | wc -l` → expect `1` (K-046 anchor text landed); `curl -sI https://k-line-prediction-app.web.app/examples/ETHUSDT_1h_test.csv` → expect HTTP 200 + Content-Length 646 (example CSV static asset served)
- **Backend (Cloud Run):** `curl -X POST https://<cloud-run-url>/api/upload-history -F 'file=@frontend/public/examples/ETHUSDT_1h_test.csv'` → expect HTTP 200 + response `{ "added_count": 0, "timeframe": "1H" }` (K-046 invariant: added_count always 0 post-K-046); pre/post `curl <cloud-run-url>/api/example` byte-identical (implied DB-unchanged invariant from AC-046-COMMENT-1)

Both probes name K-046-specific identifiers (`Download example` anchor text + `/examples/ETHUSDT_1h_test.csv` asset path + `added_count: 0` invariant) per `~/.claude/agents/pm.md §Deploy Record` executed-probe rule; generic 200-response probes are NOT sufficient.

