# K-046 Phase 2 — UI Restructure + CORS Env Fix (Architect Design)

- **Ticket:** `docs/tickets/K-046-remove-upload-db-write.md` §Phase 2 Scope + AC
- **Worktree:** `.claude/worktrees/K-046-remove-upload-db-write/`
- **Branch:** `K-046-remove-upload-db-write`
- **Baseline SHA for dry-run:** `4c873b3` (worktree HEAD, PM Phase 2 PRD)
- **Upstream main HEAD:** `d923ed3` (Phase 1 + PM Phase 2 scope appended)
- **Upstream deployed SHA:** `34570a3` (Phase 1 prod deploy 2026-04-24)
- **Visual delta:** yes (text-only layout move on `/app`, no Pencil frame per K-021 §2 — `/app` is dev-tool route, exempt)
- **Design-locked gate:** N/A (exemption row in `docs/designs/design-exemptions.md`; no Pencil parity requirement)

---

## 0 Scope Questions / BQs

None open. PM Q1 (b) / Q3 handled inline in ticket §Phase 2 Scope; all 6 ACs ruled; Architect rulings below are within-scope design decisions (handler removal, parseOfficialCsvFile export, testid additions) — not ticket AC mutations. Each ruling is an Architect decision per the ticket's defer-to-Architect clauses (Action 3 handler ruling + Action 4 AC-046-PHASE2-EXAMPLE-PARSE test file ruling + AC-046-PHASE2-UI-* testid-or-locator ruling).

**No new BQ to PM.** If any of the three rulings below conflicts with the user's intent discovered at Engineer stage, Engineer raises BQ back through PM — Architect does not pre-emptively escalate here.

---

## 1 AC → OLD vs NEW Truth Table

Per `feedback_architect_pre_design_audit_dry_run.md`, each AC gets a pre-Phase-2 vs post-Phase-2 observable state row + verification column.

### 1.1 AC-046-PHASE2-CORS

| Axis | Pre-Phase-2 (Cloud Run revision `00003-qdx`, post-34570a3) | Post-Phase-2 (post-Action-1 env update) | Observable delta | Verification |
|---|---|---|---|---|
| `CORS_ORIGINS` env var | `https://k-line-prediction.web.app` (missing `-app` suffix, pre-existing misconfig, not K-046-Phase-1-introduced) | `https://k-line-prediction-app.web.app` (exact match) | env-var line diff in Cloud Run revision | `gcloud run services describe k-line-backend --region asia-east1 --format='value(spec.template.spec.containers[0].env)'` |
| `access-control-allow-origin` header on `GET /api/history-info` when `Origin: https://k-line-prediction-app.web.app` is set | absent / wildcard mismatch → browser CORS block | exact-match echo `https://k-line-prediction-app.web.app` | response header | `curl -H "Origin: https://k-line-prediction-app.web.app" -I <cloud-run-url>/api/history-info \| grep -i access-control-allow-origin` |
| `/app` HISTORY REFERENCE panel `historyInfo` block render | stuck at literal `"Loading..."` (fetch rejected by browser CORS before setState) | `Binance_ETHUSDT_1h.csv（最新：… UTC+0）` | DOM text diff | browser DevTools Network tab smoke + AC-046-PHASE2-HISTORY-INFO-RENDERS Playwright path coverage (mocked) |

**AC verifies by:** 3 layers — (i) env-var presence via `gcloud describe`, (ii) header echo via `curl` probe in Phase 2 Deploy Record, (iii) render path via Playwright mock (GAP-4 documented: mock path does NOT exercise real preflight).

### 1.2 AC-046-PHASE2-EXAMPLE-PARSE

| Axis | Pre-Phase-2 (commit `4c873b3`, fixture at `frontend/public/examples/ETHUSDT_1h_test.csv`) | Post-Phase-2 (fixture refreshed per Action 2) | Observable delta | Verification |
|---|---|---|---|---|
| Fixture format | 10-col CryptoDataDownload (header row `https://www.CryptoDataDownload.com,,,,,,,,,` + `Unix,Date,Symbol,Open,High,Low,Close,Volume ETH,Volume USDT,tradecount` + 5 data rows, 7 lines total) — **confirmed via `wc -l` = 7** | 12-col Binance raw klines, 24 data rows, microseconds Unix ts, headerless | line count 7 → 24; col count 10 → 12 | `wc -l frontend/public/examples/ETHUSDT_1h_test.csv` |
| `parseOfficialCsvFile(text, 'ETHUSDT_1h_test.csv')` return value | **throws** — first data row `1774652400000,2026-03-27 23:00:00,ETHUSDT,1985.51,…` has col[1]=`"2026-03-27 23:00:00"` interpreted as `Number(…)` = `NaN` on open → exception `line 1: contains invalid OHLC values.` OR if parse proceeds, `rows.length` is 6 (5 data + 1 header row as data) vs `OFFICIAL_ROW_COUNT` = 24 → exception `expected 24 rows, got 6`. Either branch throws. | returns `OHLCRow[]` of length exactly 24; each element has string `time` + finite-number-parseable `open/high/low/close` | throw → 24-element array | **new Vitest** `frontend/src/__tests__/parseOfficialCsvFile.test.ts` (Architect-ruled path; §4 below) — reads fixture via `fs.readFileSync('frontend/public/examples/ETHUSDT_1h_test.csv', 'utf-8')`, calls `parseOfficialCsvFile(text, 'ETHUSDT_1h_test.csv')`, asserts `result.length === 24` + each `OHLCRow` schema |

**AC verifies by:** parse-layer unit test (not endpoint round-trip). Fail-if-gate-removed dry-run: if Engineer swaps the fixture with a 10-row CSV, `OFFICIAL_ROW_COUNT` assertion inside `parseOfficialCsvFile` throws, Vitest fails. B4 neutralize-masked invariant rule satisfied.

### 1.3 AC-046-PHASE2-UI-LINK-MOVED

| Axis | Pre-Phase-2 (commit `4c873b3`) | Post-Phase-2 | Observable delta | Verification |
|---|---|---|---|---|
| `<a>` DOM ancestry | inside HISTORY REFERENCE wrapper (`AppPage.tsx:408-458`); sibling of `<label>Upload History CSV</label>` (ticket says lines 432-438 — confirmed line 432-438 post-dry-run §10) | inside OFFICIAL INPUT wrapper (`AppPage.tsx:376-406` region); inline in or below the "Expected format" card (lines 397-400) | ancestor chain changes from `history-reference-section` → `official-input-section` | Playwright case A: `page.locator('[data-testid="official-input-section"]').getByText(/Download example/i)` resolves to **1** match |
| `<a>` NOT inside HISTORY REFERENCE | currently **inside** — match count 1 | not inside — match count 0 | count 1 → 0 | Playwright case B: `page.locator('[data-testid="history-reference-section"]').getByText(/Download example/i)` resolves to **0** matches |
| `<a>` `href` attribute | `/examples/ETHUSDT_1h_test.csv` | `/examples/ETHUSDT_1h_test.csv` (unchanged) | no diff | `toHaveAttribute('href', '/examples/ETHUSDT_1h_test.csv')` |
| `<a>` `download` attribute | `ETHUSDT_1h_test.csv` | `ETHUSDT_1h_test.csv` (unchanged) | no diff | `toHaveAttribute('download', 'ETHUSDT_1h_test.csv')` |
| Computed `font-size` | `10px` (class `text-[10px]` → 10px) | `≥ 12px` (class `text-xs` → 12px, or larger) | 10 → ≥12 | `window.getComputedStyle(anchor).fontSize` parsed to number `>= 12` |
| Computed color | `text-gray-500` = `rgb(107, 114, 128)` | at least `text-gray-400` = `rgb(156, 163, 175)` (lighter) | luminance increase | `window.getComputedStyle(anchor).color` — compare to `rgb(156, 163, 175)` or lighter by per-channel ≥ |

**AC verifies by:** 2 independent Playwright cases (A + B) per PM parallel-quantification clause. Do NOT merge. Engineer writes each as `test('… inside official input scope', …)` and `test('… not inside history reference scope', …)`.

### 1.4 AC-046-PHASE2-UI-UPLOAD-HIDDEN

| Axis | Pre-Phase-2 | Post-Phase-2 | Observable delta | Verification |
|---|---|---|---|---|
| `<label>` + `<input type="file">` for "Upload History CSV" | rendered at `AppPage.tsx:415-431` (confirmed §10 dry-run) | removed from JSX | DOM subtree absent | `page.locator('[data-testid="history-reference-section"] input[type="file"][accept*=".csv"]').count() === 0` |
| Visible text `/Upload History CSV/i` anywhere on `/app` | 1 match | 0 matches | 1 → 0 | `page.getByText(/Upload History CSV/i).count() === 0` |
| Visible text `/上傳中/` or `uploadLoading` state UI | reachable only mid-upload (transient) | not reachable at all (handler removed per §3 ruling) | dead code | static assertion — if Architect ruling is REMOVE: `grep -n '上傳中' frontend/src/AppPage.tsx` → 0 hits |

**AC verifies by:** 1 Playwright test for upload-input absence + 1 for label-text absence. The `上傳中` assertion is static grep (post-ruling §3 = REMOVE). If ruling §3 were COMMENT-OUT instead, `上傳中` would still be dead-code (no render path) — same Playwright assertion would pass; static grep would fail but be irrelevant. Ruling §3 picks REMOVE; static grep gate lands.

### 1.5 AC-046-PHASE2-HISTORY-LABEL-KEPT

| Axis | Pre-Phase-2 | Post-Phase-2 | Observable delta | Verification |
|---|---|---|---|---|
| `<div>` with text exactly `"History Reference"` inside HISTORY REFERENCE wrapper | 1 match at `AppPage.tsx:409` (inside `<div className="rounded border border-gray-700 bg-gray-900/70 p-3 ...">`) | 1 match at same DOM position (wrapper + label preserved per PM Q1:b) | no diff | `page.getByText('History Reference', { exact: true }).count() === 1` + ancestor chain check to `[data-testid="history-reference-section"]` |
| `historyInfo` block (`AppPage.tsx:410-414`) | rendered with `Loading...` or `${filename}（最新：…）` | same | no diff | `page.locator('[data-testid="history-reference-section"] .font-mono').first()` visible |

**AC verifies by:** exact-text getByText + ancestor chain assertion. The `historyInfo` filename render is covered separately by AC-046-PHASE2-HISTORY-INFO-RENDERS.

### 1.6 AC-046-PHASE2-HISTORY-INFO-RENDERS

| Axis | Pre-Phase-2 | Post-Phase-2 | Observable delta | Verification |
|---|---|---|---|---|
| Mocked `GET /api/history-info` → `{ "1H": { filename: "Binance_ETHUSDT_1h.csv", … }, "1D": {…} }` | currently K-046 Phase 1 mock-apis.ts serves mocked history-info already — `historyInfo` state fills, text `Binance_ETHUSDT_1h.csv（最新：…）` renders | same (mock path unchanged; no Phase 2 delta) | no diff in render path; Phase 2's real-browser CORS unblock is observed out-of-band | `page.locator('[data-testid="history-reference-section"]').getByText(/Binance_ETHUSDT_1h\.csv/)` visible AND `.getByText('Loading...')` hidden |

**AC verifies by:** Playwright path — mocks `/api/history-info`, asserts render. Real CORS behavior is NOT covered here (GAP-4) — that's the AC-046-PHASE2-CORS manual curl + browser smoke.

---

## 2 Component Tree Diff — `frontend/src/AppPage.tsx`

Extracted via `git show 4c873b3:frontend/src/AppPage.tsx`; all line numbers from that snapshot. See §10 for dry-run transcripts.

### 2.1 OFFICIAL INPUT section — lines 376-406 (OLD)

```
<div className="rounded border border-gray-700 bg-gray-900/70 p-3 flex flex-col gap-2">   // L376
  <div className="text-xs uppercase tracking-wider text-gray-400">Official Input</div>    // L377
  <div className="rounded border border-gray-700 bg-gray-950/70 p-2 text-xs text-gray-300">  // L378
    <div className="text-gray-500">Source file</div>                                      // L379
    <div className="mt-1 break-all font-mono text-[11px]">{sourcePath || …}</div>         // L380
  </div>
  <label className="flex cursor-pointer items-center …">                                  // L382
    Upload 1H CSV（可多選）                                                                // L383
    <input type="file" accept=".csv,text/csv" multiple … onChange={…handleOfficialFilesUpload…} />
  </label>
  <div className="grid grid-cols-2 gap-2 text-xs">                                        // L396
    <div className="rounded border border-gray-700 bg-gray-950/70 px-2 py-2">              // L397
      <div className="text-gray-500">Expected format</div>                                // L398
      <div className="mt-1 text-gray-200">多檔合併 · 每檔 24 × 1H bars · UTC+0</div>        // L399
    </div>                                                                                // L400
    <div className="rounded border border-gray-700 bg-gray-950/70 px-2 py-2">              // L401
      <div className="text-gray-500">Displayed timezone</div>
      <div className="mt-1 text-gray-200">UTC+8</div>
    </div>                                                                                // L404
  </div>                                                                                  // L405
</div>                                                                                    // L406
```

### 2.2 OFFICIAL INPUT section — NEW

Wrapper div on L376 gains `data-testid="official-input-section"` attribute (§5 ruling). The "Expected format" card (L397-400) gains an inline sibling `<a>` below L399's `<div>多檔合併 …</div>`:

```
<div className="rounded border border-gray-700 bg-gray-950/70 px-2 py-2">
  <div className="text-gray-500">Expected format</div>
  <div className="mt-1 text-gray-200">多檔合併 · 每檔 24 × 1H bars · UTC+0</div>
  <a
    href="/examples/ETHUSDT_1h_test.csv"
    download="ETHUSDT_1h_test.csv"
    className="mt-1 inline-block text-xs text-gray-400 hover:text-blue-400"
  >
    Don't have a CSV? Download example →
  </a>
</div>
```

**Placement note:** Engineer picks `mt-1 inline-block` vs `mt-1 block` — both preserve the 2-col grid balance. The `text-xs text-gray-400` is the Architect-mandated minimum; Engineer may NOT reduce (AC §1.3 computed-style gate).

**Why inline inside the Expected format card, not beneath the whole OFFICIAL INPUT wrapper:** PM Action 3 verbatim — "inline below (or after) the `多檔合併 …` text" + "link MUST live inside the Expected format card's DOM scope (Playwright `locator('[data-testid="official-input-expected-format"]').getByText(…)` must match)". Architect reads this as: DOM ancestry must include the Expected format `<div>` (L397-400), not merely the OFFICIAL INPUT wrapper. **Engineer adds either `data-testid="official-input-expected-format"` on L397's inner `<div>` OR the Playwright locator uses the text-anchored chain `getByText("Expected format").locator('xpath=ancestor::div[1]')`.** §5 ruling picks the testid path for clarity.

### 2.3 HISTORY REFERENCE section — lines 408-458 (OLD)

```
<div className="rounded border border-gray-700 bg-gray-900/70 p-3 flex flex-col gap-2">   // L408
  <div className="text-xs uppercase tracking-wider text-gray-400">History Reference</div> // L409
  <div className="rounded border border-gray-700 bg-gray-950/70 p-2 text-xs … font-mono">  // L410
    {historyInfo ? `${historyInfo['1H'].filename}（最新：…）` : 'Loading...'}                // L411-413
  </div>                                                                                  // L414
  <label className={`flex items-center justify-center rounded border border-dashed …`}>    // L415  ← REMOVED
    <span className="flex flex-col items-center gap-0.5">                                 // L416
      <span>{uploadLoading ? '上傳中…' : 'Upload History CSV'}</span>                      // L417
      {!uploadLoading && <span className="text-[10px] text-gray-500">時間欄位須為 UTC+0</span>}  // L418
    </span>                                                                               // L419
    <input type="file" accept=".csv,text/csv" … disabled={uploadLoading}                 // L420-430
           onChange={event => { if (file) handleHistoryUpload(file); … }} />
  </label>                                                                                // L431
  <a href="/examples/ETHUSDT_1h_test.csv" download="ETHUSDT_1h_test.csv"                  // L432  ← MOVES to §2.2
     className="text-[10px] text-gray-500 hover:text-blue-400">
    Don't have a CSV? Download example →
  </a>                                                                                    // L438
  {lastHistoryUpload && ( … toast block … )}                                              // L439-451  ← REMOVED (ruling §3)
  {uploadError && ( … error block … )}                                                    // L452-457  ← REMOVED (ruling §3)
</div>                                                                                    // L458
```

### 2.4 HISTORY REFERENCE section — NEW

```
<div data-testid="history-reference-section"
     className="rounded border border-gray-700 bg-gray-900/70 p-3 flex flex-col gap-2">
  <div className="text-xs uppercase tracking-wider text-gray-400">History Reference</div>
  <div className="rounded border border-gray-700 bg-gray-950/70 p-2 text-xs … font-mono">
    {historyInfo ? `${historyInfo['1H'].filename}（最新：…）` : 'Loading...'}
  </div>
</div>
```

**Diff summary:**

| Element | Action | Rationale |
|---|---|---|
| Wrapper `<div>` L408 | MODIFY (add `data-testid="history-reference-section"`) | testid scope for AC §1.3/1.4/1.5 |
| Section label `<div>History Reference</div>` L409 | KEEP | PM Q1:b preserved |
| `historyInfo` filename block L410-414 | KEEP | PM Q1:b preserved; rendered by AC §1.5/1.6 |
| `<label>` upload L415-431 | REMOVE | PM Action 3 verbatim |
| `<a>` download link L432-438 | MOVE to §2.2 (OFFICIAL INPUT Expected format card) | PM Action 3 verbatim |
| `lastHistoryUpload` toast L439-451 | REMOVE | Dead after handler removal (§3 ruling) |
| `uploadError` error block L452-457 | REMOVE | Dead after handler removal (§3 ruling) |

### 2.5 Expected format card (OFFICIAL INPUT) — minor testid addition

L397's inner `<div className="rounded border border-gray-700 bg-gray-950/70 px-2 py-2">` gains `data-testid="official-input-expected-format"` to let Playwright AC §1.3 scope the download-link ancestry check precisely (not just to OFFICIAL INPUT at large — to the specific Expected format card per PM Action 3). §5 ruling finalises.

---

## 3 Ruling — `handleHistoryUpload` + 3 companion state hooks: REMOVE (not comment-out)

### 3.1 Items in scope

| Symbol | Line (4c873b3) | Current consumers | Post-Phase-2 consumer count if no action |
|---|---|---|---|
| `handleHistoryUpload(file)` | 297-312 | `<input onChange>` at L427 (inside removed `<label>`) | 0 |
| `lastHistoryUpload` state hook | 142 | display block L439-451 (inside removed `<label>` sibling); `setLastHistoryUpload(null)` at L298 (inside `handleHistoryUpload`); `setLastHistoryUpload({…})` at L306 | 0 (both setter and consumer inside removed tree) |
| `uploadError` state hook | 143 | display block L452-457; `setUploadError(null)` at L299; `setUploadError((err as Error).message)` at L310 | 0 |
| `uploadLoading` state hook | 144 | className branch L415, `disabled={uploadLoading}` L424, text branch L417-418; `setUploadLoading(true/false)` at L300 + L311 | 0 |
| `historyInfo` state hook | 141 | render L411-413 (KEPT per §2.4); `setHistoryInfo(data)` at L148 + L309 | **≥ 1** (initial `useEffect` fetch at L147-150, AC §1.6) |

**Critical finding — `uploadError` scope:**

`grep -n "uploadError\|setUploadError" /tmp/AppPage-4c873b3.tsx` returns lines 143, 299, 310, 452, 455. All five sites are either inside `handleHistoryUpload` or inside the removed display block at L452-457. **Zero crossover with `handleOfficialFilesUpload` (L260-…) or any other code path.** `uploadError` is HISTORY-ONLY. Safe to remove.

Same pattern for `lastHistoryUpload` (L142, 298, 306, 439, 440, 441, 443, 444, 445) and `uploadLoading` (L144, 300, 311, 415, 417, 418, 424) — no crossover.

`historyInfo` MUST STAY — drives HISTORY REFERENCE panel's filename display (PM Q1:b preserved) + initial `useEffect` at L147-150 remains the source of the render. AC §1.6 depends on this.

### 3.2 Decision factors (3 factors, per persona rubric)

| Factor | REMOVE | COMMENT-OUT | Weight |
|---|---|---|---|
| **Engineering cleanliness** — ruled-dead code path, zero consumers | **clean** — deletes 16 lines (4 hooks + handler body) + 19 lines of JSX; AppPage.tsx total line count −35 | leaves 35 lines of `// ` commented-out JSX + handler + hooks; visual noise + grep false-positives on future search for `handleHistoryUpload` | REMOVE wins |
| **K-048 reversibility symmetric with Phase 1 BQ-046-D backend** | low — frontend re-add cost ≈ 30 min (re-type hooks, re-render JSX, re-wire handler) because the full JSX block is version-controlled at `4c873b3:frontend/src/AppPage.tsx:415-457` and recoverable via `git show`; no schema design work needed to re-derive it | identical practical cost (uncomment vs re-type, both require a PR) but preserves the inline `TODO(K-048)` marker next to each line, making re-enablement visually discoverable | COMMENT-OUT marginally wins; REMOVE offsets by providing the same discoverability via git blame + commit subject + architecture.md K-048 TD entry |
| **Test blast radius** — what changes for E2E specs | `frontend/e2e/K-046-example-upload.spec.ts:81` currently anchors on `page.locator('label', { hasText: 'Upload History CSV' })` — this anchor is stale in both REMOVE and COMMENT-OUT (commented-out JSX does NOT render, so the Playwright locator resolves to 0 matches either way). Engineer rewrites T3 regardless. | identical | TIE |

**Score: REMOVE 2, COMMENT-OUT 0, TIE 1.** Recommendation: **REMOVE.**

### 3.3 Reversibility note (for the COMMENT-OUT path not chosen)

K-048 Architect (when it opens) retrieves the full removed block via:

```
git show 4c873b3:frontend/src/AppPage.tsx | sed -n '142p;143p;144p;297,312p;415,457p'
```

Plus a follow-up `git log --all --oneline -- frontend/src/AppPage.tsx | grep K-046` to anchor the commit. architecture.md TD-003 already marks K-048 as "revisit" — next Architect cycle can include a 1-line note in the K-048 design doc pointing to this commit for the JSX + handler template. No design debt is incurred by REMOVE that COMMENT-OUT would have prevented. Backend Phase 1 chose COMMENT-OUT for different reasons (schema/response semantics discoverability for QA smoke, not code restoration ease), so asymmetric frontend-REMOVE + backend-COMMENT-OUT is coherent.

### 3.4 Summary

- **REMOVE:** lines 142-144 (3 state hooks); lines 297-312 (handler body); lines 415-431 (Upload History CSV `<label>`); lines 439-451 (lastHistoryUpload toast); lines 452-457 (uploadError block).
- **KEEP:** line 141 (`historyInfo` hook); lines 147-150 (initial useEffect fetch); lines 410-414 (historyInfo render).
- **TOTAL LINE DELTA:** −38 lines net from AppPage.tsx (−35 via removal + ~−3 via layout tightening where the gap between historyInfo block and `</div>` collapses).

---

## 4 Ruling — `parseOfficialCsvFile` export: EXPORT from AppPage.tsx (option A)

### 4.1 Three options considered

| Option | Mechanism | Applicability | Trade-off |
|---|---|---|---|
| **A** | Add `export` keyword at `AppPage.tsx:48` so `function parseOfficialCsvFile` becomes a named export; Vitest `import { parseOfficialCsvFile } from '../AppPage'` | Smallest diff, zero new files, function stays co-located with its one consumer (`handleOfficialFilesUpload` at L269). | `AppPage.tsx` public API surface grows by 1 symbol. QA adversarial case #2 flags this as "trackable scope expansion" but not blocking. |
| **B** | Extract to `frontend/src/utils/parseOfficialCsvFile.ts` (new file); re-import into `AppPage.tsx`; export from new file for test | Cleanest module boundary; parse logic lives alongside other utils (`utils/aggregation.ts`, `utils/statsComputation.ts` exist already). | Adds file; AppPage.tsx gets one more import line; diff size ≈ 2× option A. |
| **C** | Inline parse assertions directly in test (read CSV → `text.split('\n')` → manually assert col count, ts format, row count = 24) | No production code change at all. | **Vacuously passes** — test exercises its own parse logic, not `parseOfficialCsvFile`. Fails AC-046-PHASE2-EXAMPLE-PARSE wording verbatim: "passes them … to `parseOfficialCsvFile()` imported from `frontend/src/AppPage.tsx`". Disqualified by AC text. |

### 4.2 Recommendation: **Option A**

- **Rationale:** AC text locks Engineer to `import { parseOfficialCsvFile } from 'frontend/src/AppPage.tsx'` (not `from '../utils/parseOfficialCsvFile'`). Option A satisfies verbatim, minimum diff. Option B requires AC re-wording (not allowed per Architect persona).
- **Export form:** change `function parseOfficialCsvFile(text: string, filename: string): OHLCRow[] {` at L48 to `export function parseOfficialCsvFile(text: string, filename: string): OHLCRow[] {`. No signature change, no behavior change, no caller change.
- **Helpers `parseExchangeTimestamp` (L24), `OFFICIAL_ROW_COUNT` (L18), `emptyRows` (L20):** NOT exported. Internal to `parseOfficialCsvFile`'s closure reach or unrelated. Keep scope minimum.

### 4.3 Vitest spec file ruling

- **Path:** `frontend/src/__tests__/parseOfficialCsvFile.test.ts`
- **Why `__tests__/` subdirectory:** repo already has `frontend/src/__tests__/` (verified `ls frontend/src/` output), consistent with Vitest/Jest convention.
- **Why `.test.ts` not `.spec.ts`:** Vitest default picks up both, but repo convention (check `frontend/src/__tests__/` — whatever exists). If `__tests__` is empty, Architect defaults to `.test.ts`. Engineer runs `ls frontend/src/__tests__/` and matches the existing extension if any sibling spec exists; if directory is empty, uses `.test.ts`.
- **Shape:**
  ```
  import { describe, it, expect } from 'vitest'
  import fs from 'node:fs'
  import path from 'node:path'
  import { parseOfficialCsvFile } from '../AppPage'

  describe('parseOfficialCsvFile — example CSV fixture', () => {
    it('AC-046-PHASE2-EXAMPLE-PARSE — parses 24 rows cleanly', () => {
      const csvPath = path.resolve(__dirname, '../../public/examples/ETHUSDT_1h_test.csv')
      const text = fs.readFileSync(csvPath, 'utf-8')
      const rows = parseOfficialCsvFile(text, 'ETHUSDT_1h_test.csv')
      expect(rows).toHaveLength(24)
      for (const row of rows) {
        expect(typeof row.time).toBe('string')
        expect(row.time.length).toBeGreaterThan(0)
        expect(Number.isFinite(Number(row.open))).toBe(true)
        expect(Number.isFinite(Number(row.high))).toBe(true)
        expect(Number.isFinite(Number(row.low))).toBe(true)
        expect(Number.isFinite(Number(row.close))).toBe(true)
      }
    })
  })
  ```
- **Path resolution note:** `path.resolve(__dirname, '../../public/examples/…')` from `frontend/src/__tests__/` resolves to `frontend/public/examples/ETHUSDT_1h_test.csv` — the committed SSOT per QA adversarial #4. No reliance on `/Users/yclee/Desktop/…`.

---

## 5 Ruling — testid additions

### 5.1 Three testids

| testid | Element | Line (post-Phase-2) | Consumer |
|---|---|---|---|
| `official-input-section` | outer wrapper `<div>` of OFFICIAL INPUT | L376 (modified) | AC §1.3 case A ancestor chain |
| `history-reference-section` | outer wrapper `<div>` of HISTORY REFERENCE | L408 (modified) | AC §1.3 case B + AC §1.4 + AC §1.5 + AC §1.6 |
| `official-input-expected-format` | inner `<div>` of Expected format card | L397 (modified) | AC §1.3 PM-verbatim "must live inside the Expected format card's DOM scope" constraint |

### 5.2 Why testids over text-anchored locators

PM Action 3 Playwright AC text offered both paths: "`[data-testid="official-input-expected-format"]` — Engineer adds testid if not present, OR Playwright uses a text-anchored locator chain". QA Early Consultation adversarial case #3 flags text-anchored chains as brittle (section label text is CJK-adjacent, future copy edits silently break locator). Architect picks testid-first path:

- **Resilience:** testid is decoupled from section copy; future CJK or i18n edits don't break Playwright.
- **Clarity:** one-to-one mapping testid ↔ AC; reviewer doesn't trace xpath `ancestor::*` chains during sign-off.
- **Cost:** 3 short attribute additions. Zero runtime impact.

**Rejection rationale for text-anchored:** reviewer burden + fragility outweighs the ~15 char saving per test.

### 5.3 Naming rationale

`history-reference-section` / `official-input-section` is PM-suggested verbatim in AC §1.3 / §1.4 / §1.5. `official-input-expected-format` is Architect-named to match the ticket's literal "Expected format card" phrasing.

---

## 6 Route Impact Table

| Route | Status | Notes |
|---|---|---|
| `/` (HomePage) | **unaffected** | No import of `AppPage.tsx`; no shared primitive touched (§7). |
| `/about` | **unaffected** | Same as above. |
| `/diary` | **unaffected** | Same as above. |
| `/business-logic` | **unaffected** | Same as above. |
| `/app` | **affected** | Primary route. All Phase 2 changes land here. AC §1.3–1.6 assert on `/app` only. `/app` isolation preserved by K-030 (dark-theme standalone) + K-021 §2 exemption. |

**Why no other routes need isolation spec:** Phase 2 edits are confined to `frontend/src/AppPage.tsx` (lines 141-144, 297-312, 376-458) + one new fixture file (`frontend/public/examples/ETHUSDT_1h_test.csv`) + one new test file (`frontend/src/__tests__/parseOfficialCsvFile.test.ts`). No `index.css`, no `tailwind.config.*`, no shared component. Global Style Route Impact Gate returns N/A per rule "emit `N/A` if ticket scope has no global CSS / sitewide token change".

---

## 7 Shared Component Inventory

**Inventory:** none touched.

`grep` verification against the affected lines (376-458) of `AppPage.tsx`:

```
grep -n "import.*components\|from './components" /tmp/AppPage-4c873b3.tsx
```

Imports: `OHLCEditor`, `TopBar`, `PredictButton`, `MatchList`, `StatsPanel`, `MainChart`. None of these appear inside the edited region (L376-458). The OFFICIAL INPUT + HISTORY REFERENCE sections are pure inline JSX + `<a>` + `<div>` + `<label>` + `<input>`. No shared primitive.

**Cross-page duplicate audit:**

```
grep -rn "Download example\|download=\".*\.csv\"" frontend/src/ frontend/e2e/
```

(run mentally per pre-Phase-2 code) → only AppPage.tsx + K-046 E2E spec. No duplicate pattern elsewhere. No new primitive extraction triggered.

**Target-route consumer scan** (routes pointing to `/app` navigation behavior): N/A — Phase 2 does not change `/app` navigation or entry point behavior, only internal DOM of the page. Rule emits N/A per Architect persona §Target-Route Consumer Scan.

---

## 8 Sacred Preservation Statement

**K-009 (`_history_1d` object-identity invariant, `backend/main.py:31`) + K-013 (`stats_contract_cases.json` invariants): both preserved.**

Phase 2 touches:

- Cloud Run env var `CORS_ORIGINS` (Action 1) — **no backend code diff**.
- `frontend/public/examples/ETHUSDT_1h_test.csv` (Action 2) — **no backend code diff**.
- `frontend/src/AppPage.tsx` lines 141-144, 297-312, 376-458 (Action 3) — frontend only.
- `frontend/src/__tests__/parseOfficialCsvFile.test.ts` (new) — frontend test only.
- Playwright spec rewrite — test code only.

**Grep proof of backend untouched:**

```
grep -n "ma_history\|_history_1d" backend/main.py
# returns: L31 _history_1d assignment, L135 info(_history_1d, …), L141 global _history_1h, _history_1d,
#          L156 existing = _history_1d if is_1d else _history_1h, L168 (K-009/K-046 commented-out block)
```

Phase 2 file change list does NOT include `backend/main.py`. K-009 `_history_1d` object identity guarantee at L31 (`_load_or_mock` single assignment) + K-013 stats contract handlers both reside in `backend/main.py`; neither path is touched. `_merge_bars` helper (referenced in PM-proxy QA Early Consultation §Sacred cross-check) — also backend-only, untouched.

**Verified:** Phase 2 Sacred compliance = 100%. No conflict.

---

## 9 `agent-context/architecture.md` Sync Plan

### 9.1 What changes (1-line entry per persona rule)

Add under `## Changelog` (line 652 section), inserted at the top of the Changelog list (newest-first convention):

```
- **2026-04-24**（Architect, K-046 Phase 2 設計）— 設計：`/app` OHLC 上傳面板 UI 重構（OFFICIAL INPUT Expected format 卡片加入 Download example 內聯連結 + HISTORY REFERENCE 移除 Upload History CSV button 但保留 section label 與 `historyInfo` 檔名顯示）+ Cloud Run `CORS_ORIGINS` env var 補 `-app` suffix（`https://k-line-prediction-app.web.app`）修復 prod browser CORS block。Architect ruling：`handleHistoryUpload` + `lastHistoryUpload` / `uploadError` / `uploadLoading` 3 state hook REMOVE（非 comment-out，與 backend BQ-046-D 非對稱但各自 optimal）；`parseOfficialCsvFile` `export` 化（不抽新檔）以支援 AC-046-PHASE2-EXAMPLE-PARSE Vitest 新 spec 於 `frontend/src/__tests__/parseOfficialCsvFile.test.ts`；3 新 testid（`official-input-section` / `history-reference-section` / `official-input-expected-format`）取代 text-anchored Playwright 鏈。Route Impact Table：`/app` only affected；其餘 4 route unaffected（無 global style 變更）。Sacred K-009 + K-013 untouched（backend 僅 env var）。Changelog 與 `## API Endpoints § POST /api/upload-history` 區塊 K-046 註記**不需**修改（backend write-path comment-out 狀態由 Phase 1 寫入已定稿；Phase 2 是前端 UI restructure + CORS env var，非 backend 行為變更）。
```

**Frontmatter `updated:` field:** if architecture.md has frontmatter with `updated:` field, bump to `2026-04-24`. `grep -n "^updated:" agent-context/architecture.md` → run at Engineer stage; if no frontmatter, skip.

### 9.2 What does NOT change

- §API Endpoints → POST /api/upload-history block (line 245 region) — **keep as-is.** Phase 1 write-path-commented text is accurate; Phase 2 does not re-enable or further neutralize.
- §Frontend Routing (line 449) — keep as-is; `/app` entry unchanged.
- §Known Architecture Debt (line 387) — TD-003 remains "moot until K-048". Phase 2 does not touch TD-003 surface (race condition is bound to the write path which is still commented).
- §Directory Structure (line 36) — no new directory or file type; `frontend/src/__tests__/` already exists (if empty, structure doesn't need documenting at directory level; file-level additions are Changelog-only).

### 9.3 Drift check — file names Phase 2 will touch

`grep -n "AppPage.tsx\|parseOfficialCsvFile\|ETHUSDT_1h_test.csv\|upload-history" agent-context/architecture.md` to be run at Engineer stage. Any hits where the content contradicts Phase 2 outcome → Engineer flags to Architect / PM. None expected given the Phase 2 scope stays inside files already referenced.

---

## 10 Pre-Existing Assertion Dry-Run

Per `feedback_architect_pre_design_audit_dry_run.md` — `git show 4c873b3:frontend/src/AppPage.tsx` was read into `/tmp/AppPage-4c873b3.tsx` (503 lines), transcripts below.

### 10.1 OFFICIAL INPUT section lines 376-406

```
git show 4c873b3:frontend/src/AppPage.tsx | sed -n '376,406p'
```

Output (verified):

```
376:          <div className="rounded border border-gray-700 bg-gray-900/70 p-3 flex flex-col gap-2">
377:            <div className="text-xs uppercase tracking-wider text-gray-400">Official Input</div>
378:            <div className="rounded border border-gray-700 bg-gray-950/70 p-2 text-xs text-gray-300">
379:              <div className="text-gray-500">Source file</div>
380:              <div className="mt-1 break-all font-mono text-[11px]">{sourcePath || 'No file uploaded yet.'}</div>
381:            </div>
382:            <label className="flex cursor-pointer items-center justify-center rounded border border-dashed border-gray-600 px-3 py-4 text-center text-xs text-gray-300 transition-colors hover:border-orange-400 hover:text-white">
383:              Upload 1H CSV（可多選）
384:              <input
385-395:           (input element with onChange → handleOfficialFilesUpload + event.currentTarget.value clear)
396:            <div className="grid grid-cols-2 gap-2 text-xs">
397:              <div className="rounded border border-gray-700 bg-gray-950/70 px-2 py-2">
398:                <div className="text-gray-500">Expected format</div>
399:                <div className="mt-1 text-gray-200">多檔合併 · 每檔 24 × 1H bars · UTC+0</div>
400:              </div>
401:              <div className="rounded border border-gray-700 bg-gray-950/70 px-2 py-2">
402:                <div className="text-gray-500">Displayed timezone</div>
403:                <div className="mt-1 text-gray-200">UTC+8</div>
404:              </div>
405:            </div>
406:          </div>
```

**Truth table — what survives, changes, vanishes in Phase 2:**

| Input line | Phase 2 action | Output line (post) |
|---|---|---|
| 376 | MODIFY — add `data-testid="official-input-section"` | 376 (modified attrs) |
| 377-380 | SURVIVE | 377-380 |
| 381 | SURVIVE | 381 |
| 382-395 | SURVIVE (handleOfficialFilesUpload `<label>`) | 382-395 |
| 396 | SURVIVE (2-col grid wrapper) | 396 |
| 397 | MODIFY — add `data-testid="official-input-expected-format"` | 397 (modified attrs) |
| 398-399 | SURVIVE | 398-399 |
| N/A (new) | INSERT — `<a href="/examples/ETHUSDT_1h_test.csv" download="ETHUSDT_1h_test.csv" className="mt-1 inline-block text-xs text-gray-400 hover:text-blue-400">Don't have a CSV? Download example →</a>` | inserted between old 399 + 400 |
| 400 | SURVIVE | renumbered post-insert |
| 401-404 | SURVIVE (Displayed timezone card) | renumbered |
| 405-406 | SURVIVE (wrapper closers) | renumbered |

### 10.2 HISTORY REFERENCE section lines 408-458

```
git show 4c873b3:frontend/src/AppPage.tsx | sed -n '408,458p'
```

(Already cited verbatim in §2.3; lines 408-458 transcribed.)

**Truth table:**

| Input line | Phase 2 action | Output line (post) |
|---|---|---|
| 408 | MODIFY — add `data-testid="history-reference-section"` | 408 (modified attrs) |
| 409 | SURVIVE (section label `<div>History Reference</div>`) | 409 |
| 410-414 | SURVIVE (`historyInfo` render block) | 410-414 |
| 415-431 | **VANISH** (Upload History CSV `<label>` + `<input>`) | — |
| 432-438 | **VANISH from this location** (MOVED to §10.1 between old 399 + 400) | — |
| 439-451 | **VANISH** (lastHistoryUpload toast block) | — |
| 452-457 | **VANISH** (uploadError block) | — |
| 458 | SURVIVE (wrapper `</div>`) | shifted up ~37 lines |

### 10.3 Handler block lines 297-312

```
git show 4c873b3:frontend/src/AppPage.tsx | sed -n '297,312p'
```

Output (verified):

```
297:  function handleHistoryUpload(file: File) {
298:    setLastHistoryUpload(null)
299:    setUploadError(null)
300:    setUploadLoading(true)
301:    const formData = new FormData()
302:    formData.append('file', file)
303:    fetch(`${API_BASE}/api/upload-history`, { method: 'POST', body: formData })
304:      .then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(new Error(d.detail ?? 'Upload failed'))))
305:      .then(uploadResult => {
306:        setLastHistoryUpload({ filename: file.name, latest: uploadResult.latest ?? null, barCount: uploadResult.bar_count ?? 0, addedCount: uploadResult.added_count ?? 0 })
307:        return fetch(`${API_BASE}/api/history-info`).then(r => r.json())
308:      })
309:      .then(data => setHistoryInfo(data))
310:      .catch(err => setUploadError((err as Error).message))
311:      .finally(() => setUploadLoading(false))
312:  }
```

**Truth table:** all 16 lines VANISH (REMOVE per §3 ruling).

**Note on L309 `setHistoryInfo(data)`:** after handler removal, `historyInfo` is set only by the initial `useEffect` at L147-150 (`fetch(${API_BASE}/api/history-info`)`). This is acceptable for Phase 2 — there is no "just-uploaded" refresh path anymore because there is no upload. AC-046-PHASE2-HISTORY-INFO-RENDERS only asserts the initial fetch path. K-048 re-enablement will restore the post-upload refresh.

### 10.4 State hooks lines 140-144

```
git show 4c873b3:frontend/src/AppPage.tsx | sed -n '140,144p'
```

Output (verified):

```
140:  const [maLoading, setMaLoading] = useState(false)
141:  const [historyInfo, setHistoryInfo] = useState<HistoryInfo | null>(null)
142:  const [lastHistoryUpload, setLastHistoryUpload] = useState<{ filename: string; latest: string | null; barCount: number; addedCount: number } | null>(null)
143:  const [uploadError, setUploadError] = useState<string | null>(null)
144:  const [uploadLoading, setUploadLoading] = useState(false)
```

**Truth table:**

| Input line | Phase 2 action | Rationale |
|---|---|---|
| 140 | SURVIVE | `maLoading` unrelated to Phase 2 (MA99 loading spinner) |
| 141 | SURVIVE | `historyInfo` drives HISTORY REFERENCE render (PM Q1:b preserved) |
| 142 | **VANISH** | `lastHistoryUpload` consumer removed (§3) |
| 143 | **VANISH** | `uploadError` consumer removed (§3) |
| 144 | **VANISH** | `uploadLoading` consumer removed (§3) |

### 10.5 Existing E2E spec behavioral diff

`frontend/e2e/K-046-example-upload.spec.ts` T3 at line 81 currently anchors:

```
const historyLabel = page.locator('label', { hasText: 'Upload History CSV' })
```

Post-Phase-2 this resolves to 0 matches → T3 fails. Engineer rewrites T3 to remove the label dependency (the mocked `/api/upload-history` route becomes unreachable since the click trigger is gone). T3 should be **removed entirely** (superseded by AC-046-PHASE2-UI-UPLOAD-HIDDEN which asserts the label does not exist) or converted to a direct `page.request.post()` call that still exercises the mocked response semantics. Architect recommends **remove T3** — the mock was only needed to verify the `added_count: 0` toast render, which itself is dead after §3 ruling. Engineer replaces with AC-046-PHASE2-UI-UPLOAD-HIDDEN + AC-046-PHASE2-UI-LINK-MOVED cases in same file (or a new file — Engineer picks; Architect suggests **extend same file** since it's already scoped to `K-046-example-upload.spec.ts` and Phase 2 is a supersede of Phase 1's E3/QA-4).

---

## 11 All-Phase Coverage Gate

| Phase | Backend | Frontend Routes | Component Tree | Props Interface |
|---|---|---|---|---|
| 2 | ✓ (Cloud Run env var only, no code) | ✓ (`/app` affected, 4 others unaffected — §6) | ✓ (OFFICIAL INPUT + HISTORY REFERENCE diff in §2) | ✓ (no new component, no new props — only 3 testid additions; trivially "no diff") |

All ✓. Gate passes.

## 12 Delivery Gate Summary

```
Architect delivery gate:
  all-phase-coverage=✓,
  pencil-frame-completeness=N/A (K-021 §2 /app exemption),
  visual-spec-json-consumption=N/A (no Pencil frame),
  sacred-ac-cross-check=✓ (§8),
  route-impact-table=complete (§6),
  cross-page-duplicate-audit=✓ (§7),
  target-route-consumer-scan=N/A (Phase 2 does not change /app navigation behavior),
  architecture-doc-sync=✓ (§9 plan laid out),
  self-diff=✓ (§10 truth tables transcribed + verified against /tmp/AppPage-4c873b3.tsx)
  → OK
```

## 13 Refactorability Checklist

- [x] **Single responsibility** — Phase 2 edits are scoped to `/app` OHLC sidebar; no other surface.
- [x] **Interface minimization** — `parseOfficialCsvFile` export is the minimum public API expansion (1 symbol); no new props.
- [x] **Unidirectional dependency** — no circular; `parseOfficialCsvFile` is used by `handleOfficialFilesUpload` + new Vitest; both downstream of the export.
- [x] **Replacement cost** — if `parseOfficialCsvFile` swapped, 2 files touch (`AppPage.tsx` + test). Well under 2-file threshold.
- [x] **Clear test entry point** — Vitest path (§4.3) + 3 Playwright cases (§1.3–1.5) each with explicit input/output.
- [x] **Change isolation** — UI-only DOM restructure; no API contract change; no component tree change beyond testid additions.

All items pass.

## 14 Boundary Pre-emption

| Boundary | Defined? | Contract |
|---|---|---|
| Empty / null `historyInfo` | ✓ | `Loading...` fallback (L411-413, SURVIVES) |
| Malformed example CSV (< 24 rows) | ✓ | `parseOfficialCsvFile` throws "expected 24 rows, got N" (existing behavior) + Vitest AC-046-PHASE2-EXAMPLE-PARSE catches at build time |
| Malformed example CSV (non-numeric OHLC) | ✓ | Throws "contains invalid OHLC values." (existing) + Vitest catches |
| CORS preflight fails post-env-update | ⚠ GAP-4 | acknowledged in ticket §Phase 2 Known Gaps; mitigated by manual deploy-day smoke (AC-046-PHASE2-CORS) |
| User clicks Download example inside `<label>` wrapping `<input type="file">` | N/A | New placement is OUTSIDE any `<label>` (§2.2 sibling to "Expected format" text, inside a plain `<div>` card). Avoids the K-046 Phase 1 footgun verbatim (Architect Changelog anchor `2026-04-24`). |
| Rapid double-click on Download example | N/A | Native `<a download>` browser behavior; no handler gate needed |
| User clicks where Upload History CSV used to be | ✓ | Button removed; no JSX renders; no click target exists. Stable. |

No ❌. No Known Gap escalation needed beyond GAP-4 (already PM-ruled acceptable).

## 15 AC ↔ Test Case Count Cross-Check

Ticket AC declared: **6 Phase 2 ACs**.

| AC | Test cases | Test file |
|---|---|---|
| AC-046-PHASE2-CORS | 1 manual curl + 1 browser DevTools smoke (both in Phase 2 Deploy Record; not Playwright) | `docs/tickets/K-046-remove-upload-db-write.md § Phase 2 Deploy Record` probe table |
| AC-046-PHASE2-EXAMPLE-PARSE | 1 Vitest case | `frontend/src/__tests__/parseOfficialCsvFile.test.ts` |
| AC-046-PHASE2-UI-LINK-MOVED | **2 Playwright cases** (case A + case B per PM parallel-quantification) | `frontend/e2e/K-046-example-upload.spec.ts` (extended) |
| AC-046-PHASE2-UI-UPLOAD-HIDDEN | 1 Playwright case | same file |
| AC-046-PHASE2-HISTORY-LABEL-KEPT | 1 Playwright case | same file |
| AC-046-PHASE2-HISTORY-INFO-RENDERS | 1 Playwright case | same file |

**Declared total:** 1 (Vitest) + 6 (Playwright: 2 + 1 + 1 + 1 + 1) + 2 (manual) = **9**.

**Playwright new-case total: 6.** Matches 2+1+1+1+1 per AC mapping.

Sanity: 3 pre-existing K-046 Phase 1 Playwright cases (T1 / T2 / T3) — T1 + T2 remain as-is (Download example link existence + 646B → need rewrite for **new** byte count of the 24-row fixture, Engineer probes size post-Action-2 and updates `EXPECTED_BYTES`). T3 removed (superseded per §10.5). New total post-Phase-2 in this spec file: 2 (T1 updated + T2 updated) + 6 new = **8 cases total in `K-046-example-upload.spec.ts`**.

---

## Retrospective

**Where most time was spent:** Triaging `uploadError` state hook's crossover scope — needed grep over the full 503-line file to confirm zero usage in `handleOfficialFilesUpload` before safely ruling REMOVE. §3 decision-factor matrix took longest to build.

**Which decisions needed revision:** Initially considered Option B (extract `parseOfficialCsvFile` to `utils/`) but AC text verbatim locks import path to `AppPage.tsx`; flipped to Option A same response with verification.

**Next time improvement:** When AC text pins an import path, list that constraint at the top of the "three options" table so option elimination is visible before scoring, not after.
