---
id: K-008
title: Automated visual report script (Playwright screenshots → HTML)
status: closed
closed: 2026-04-18
type: feat
priority: high
created: 2026-04-18
updated: 2026-04-18
---

## Background

After QA finishes, there is currently no visual acceptance report; the Retrospective flow asks QA to run a screenshot script and tell the PM "the report is at `docs/reports/K-XXX-visual-report.html`", but the script does not yet exist — the QA agent's defined wrap-up step is dangling.

## Scope (MVP)

**In-scope:**
- Create the `frontend/e2e/visual-report.ts` Playwright script
- Capture one full-page screenshot per route in the "set of known page routes" — no ticket → page mapping
- Produce `docs/reports/K-XXX-visual-report.html` (an HTML report with embedded screenshots; XXX passed in via CLI)

**Out-of-scope (MVP):**
- Ticket → page mapping (add later based on real needs after a few runs; avoid premature optimization)
- Per-section screenshots (full page first; carve later)
- Screenshot diffing (pixel diff)
- CI auto-trigger (stay manual via `npx playwright test visual-report.ts`)

## Acceptance Criteria

### AC-008-SCRIPT: Script is executable

**Given** QA is complete and all Playwright E2E tests pass
**When** running `npx playwright test visual-report.ts` from the `frontend/` directory (with whatever mechanism the Architect picks for passing the ticket ID — CLI arg / env var)
**Then** the script runs successfully with exit code 0
**And** `K-XXX-visual-report.html` is produced under `docs/reports/`

### AC-008-CONTENT: Report contains full-page screenshots for every known route

**Given** `K-XXX-visual-report.html` has been generated
**When** opened in a browser
**Then** the report contains one full-page screenshot per route in the "set of known page routes"
**And** each screenshot is labelled with its route path (e.g. `/`, `/app`, `/about`, `/diary`)
**And** if a route requires login, the report labels it "auth required" or captures it via an auth fixture (Architect's call)

## Triage (PM 2026-04-18)

- **priority: low → medium → high** (raised again after the 2026-04-18 K-011 PM roll-up)
- **Standalone ticket, not folded into K-011** — the script runs across pages and is not bound to any single UI ticket; not demoted to a K-011 sub-task
- **MVP scope trimmed** — full-page screenshots + all known routes, no ticket→page mapping (add later as needed after a few runs)
- **Cycle position (2026-04-18 update): cycle #6 → cycle #4** — three consecutive tickets K-009/010/011 lack a visual verification layer (Engineer/Reviewer/QA/PM all unable to confirm the UI), a systemic gap that cannot be deferred any further
- **Knock-on:** K-012 → cycle #6, K-013 → cycle #7 (each pushed back one cycle)
- **Status: open (cycle #6) → open (cycle #4)**

## Blocking Questions (resolved 2026-04-18)

| # | Question | Ruling |
|---|------|------|
| 1 | Execution environment | **Local dev server** — the script assumes `http://localhost:5173` (Vite default) is up; consistent with existing Playwright E2E, runs offline |
| 2 | Page scope | **4 public pages: `/` `/app` `/about` `/diary`** (`/app` is the prediction home and does not require login; PM's original recommendation misclassified it and is now corrected); `/business-logic` (JWT) labelled "auth required, follow-up ticket" — no auth fixture |
| 3 | Ticket ID input | **env var: `TICKET_ID=K-008 npx playwright test visual-report.ts`** — script reads `process.env.TICKET_ID`; if unset, default to the string `UNKNOWN` or exit 1 (Architect decides) |

## Related Links

- [PM-dashboard.md](../../../PM-dashboard.md)
- [K-002 Retrospective — QA reflection section](K-002-ui-optimization.md#retrospective)
- QA agent wrap-up definition: `~/.claude/agents/qa.md`
- Per-Role Retrospective Log mechanism: `CLAUDE.md` lines 39–64

---

## Architecture (2026-04-18)

### 1. Technical Approach

#### 1.1 Runner: Playwright Test Runner vs standalone Node script

**Recommendation: Playwright Test Runner (`npx playwright test visual-report.ts`)**

**Rationale (one line):** the existing `playwright.config.ts` already defines `webServer.command=npm run dev` + `baseURL=http://localhost:5173` + `reuseExistingServer`; reusing it gives us three things for free: "auto-start dev server when not up, reuse when up, unified `baseURL`". A standalone Node script would have to spawn `chromium.launch()`, wait for the server to be ready, and set baseURL itself — reinventing wheels we already have.

**Trade-offs:**
- Runner path: `visual-report.ts` must be written as a `test(...)` or `test.describe(...)` block; report-generation logic sits in `test.afterAll()` for aggregation — slightly indirect semantically.
- Standalone script: simple imperative semantics, but gives up the existing webServer / baseURL / retries settings.
- Alternative (rejected): inline inside the existing `pages.spec.ts` → violates the AC requirement of a standalone executable `visual-report.ts`.

#### 1.2 HTML template: inline generation vs standalone template file

**Recommendation: inline generation (template literal inside the script)**

**Rationale:** MVP only renders an `<h1>` + 4 sections (route label + screenshot + dimensions); the template is < 40 lines. A standalone `.html` template would add one more file I/O hop + placeholder substitution, and K-008 has no template reuse needs.

**Trade-offs:**
- inline: editing the template means editing the script — review in one place.
- Standalone file (rejected): if we later add variants like "diff report / timeline report", extracting to `frontend/e2e/visual-report/templates/` then is fine — YAGNI.

#### 1.3 Screenshot output: inline base64 single file vs split-file directory

**Recommendation: inline base64 single file (`docs/reports/K-XXX-visual-report.html`)**

**Rationale:** AC-008-SCRIPT explicitly requires emitting a single file `docs/reports/K-XXX-visual-report.html`; the QA agent wrap-up is "tell the PM the report is at this single file path". One file is openable offline, easy to commit / attach / share with the user; 4 full-page screenshots embedded as base64 PNG, estimated 2–5 MB at K-Line's current page complexity (risk clause in §6.3).

**Trade-offs:**
- Single inline file: move / share one file; downside is a larger HTML and slightly slower browser render (acceptable for MVP's 4 images).
- Split-file directory (rejected): `docs/reports/K-XXX/` containing `index.html` + `*.png` — small files, fast to open, but breaks the "single-file delivery" AC semantics, makes commits noisy with many files, and bloats `docs/reports/`.
- If §6.3 measured single-file > 10 MB → trigger fallback: compress images to JPEG quality=85 then base64; if still too large → switch to split files (handled in the next ticket; do not adjust AC within K-008 scope).

---

### 2. Script Interface

#### 2.1 Behavior when `TICKET_ID` is unset

**Recommendation: default to the string `UNKNOWN`, do not exit 1.**

**Rationale:** the script is a "visual-output tool", not a validation tool; QA may manually run it locally to view the current UI state without caring about a ticket number, in which case hard-failing is just annoying. To prevent accidentally committing a `K-UNKNOWN-visual-report.html` from a forgotten env var, when the script detects `UNKNOWN` at startup it prints a yellow warning to stdout:
```
[visual-report] WARNING: TICKET_ID not set, output will be K-UNKNOWN-visual-report.html
```

**Trade-offs:**
- `UNKNOWN` + warning: UX-friendly, explicit warning.
- exit 1 (rejected): matches a "strict CI" style, but K-008 currently has no CI trigger; AC-008-SCRIPT only says `TICKET_ID=K-008 npx playwright test visual-report.ts` must succeed, not that an unset value must fail.

#### 2.2 Behavior when a single page fails (timeout / 4xx / navigation error)

**Recommendation: partial report — keep running remaining pages, mark that page's section as failed, script exits 1 at the end.**

**Rationale:**
- QA manual-run scenario: "show me which pages broke" beats "abort on first failure"; a partial report gives the full picture in one run.
- The final exit 1 ensures CI / QA flows don't mistake "partially failed" for "passed".

**Implementation:**
- Each route uses its own `try { goto + screenshot } catch (e) { push failureSection }`
- Failed sections render a red border + error message (`e.message` + first 3 stack lines) + no-screenshot placeholder
- In the aggregation step, if `failures.length > 0` → `process.exitCode = 1`

**Trade-offs:**
- partial + exit 1: QA / humans see immediately which pages broke from the HTML; CI still fails.
- first-fail exit (rejected): CI-friendly but QA must fix the first to discover the second is broken → multiple iterations.

---

### 3. HTML report contents

**Structure (in render order):**

```
<html>
  <head>
    <meta charset="utf-8">
    <title>{TICKET_ID} — Visual Report</title>
    <style>/* inline CSS: grid layout, sticky header, screenshot max-width:100%, failure red border */</style>
  </head>
  <body>
    <header>
      <h1>{TICKET_ID} — Visual Report</h1>
      <p>Generated at {ISO-8601 local time} · Base URL: http://localhost:5173</p>
      <p>Pages: 4 captured, {failures} failed</p>
    </header>
    <main>
      <!-- one section per page, fixed order -->
      <section class="page-section {status=success|failure|auth-required}">
        <h2>{label}</h2>
        <p class="route">{routePath}</p>
        <p class="meta">Dimensions: {width} × {height} · Status: {httpStatus}</p>
        <!-- success -->
        <img src="data:image/png;base64,..." alt="{label} screenshot">
        <!-- failure -->
        <pre class="error">{error.message}</pre>
        <!-- auth-required (/business-logic only) -->
        <div class="placeholder">Login required; deferred to next ticket (K-008 MVP omits auth fixture)</div>
      </section>
      ...
    </main>
  </body>
</html>
```

**Page list (fixed order, MVP):**

| Order | Label | Route | Notes |
|-------|-------|-------|------|
| 1 | Home | `/` | Public |
| 2 | App (K-Line Prediction) | `/app` | Public; main prediction feature |
| 3 | About | `/about` | Public |
| 4 | Dev Diary | `/diary` | Public |
| 5 | Business Logic | `/business-logic` | **Marked as "auth required, follow-up ticket" placeholder; no screenshot** |

**Why `/business-logic` is also listed as a section:** the report's semantics is "this route's coverage state in MVP"; omitting it would make readers think the route doesn't exist. An explicit placeholder hands the next ticket a clear pickup point.

---

### 4. File Change List

**Added:**

| Path | Responsibility |
|------|------|
| `frontend/e2e/visual-report.ts` | Playwright test runner script; per-page screenshot + aggregated HTML report generation (single file, ~150–200 lines) |
| `docs/reports/.gitkeep` | Create the `docs/reports/` directory (git needs a file to retain an empty directory; `.gitkeep` is the convention) |

**Modified:**

| Path | Change |
|------|---------|
| `frontend/playwright.config.ts` | Keep `testMatch` at default (`**/*.spec.ts`) → meaning `visual-report.ts` **will not** be picked up by `npx playwright test` (no file specified); **this behavior must be verified** (see §6.2). If it does get swept into the e2e suite by default → add `testIgnore: ['**/visual-report.ts']` to config. |
| `.gitignore` (repo root) | Confirm `docs/reports/*.html` is **not** in the ignore list (artifacts must be committable for PM / user to see); if a broad rule catches it, add `!docs/reports/` whitelist. |
| `K-Line-Prediction/agent-context/architecture.md` | Add a structural "QA Artifacts" section + `docs/reports/` responsibility; Directory Structure adds `e2e/visual-report.ts` (see §8) |

**Deleted:** none.

**Unchanged:**
- Existing e2e specs (`pages.spec.ts` / `business-logic.spec.ts` / `ma99-chart.spec.ts` / `navbar.spec.ts`) untouched.
- Backend and frontend src/ untouched.
- No `package.json` script alias added — keep `npx playwright test visual-report.ts` (per AC-008-SCRIPT).

---

### 5. Implementation Order

**Dependency graph:**
```
(A) Create docs/reports/ + .gitkeep
(B) visual-report.ts skeleton (routes array + test.describe)
    └─ requires (A)
(C) Per-page goto + full-page screenshot + buffer collection
    └─ requires (B)
(D) HTML template literal + base64 embedding + fs.writeFileSync
    └─ requires (C)
(E) Failure capture + partial report + process.exitCode
    └─ requires (D)
(F) architecture.md sync
    └─ can run parallel with (A)~(E)
(G) Verification: local `TICKET_ID=K-008 npx playwright test visual-report.ts` → open HTML
    └─ requires (A)~(E)
```

**Suggested commit breakdown:**
1. (A) + (B) + (C): single-page success path works (verifies runner choice)
2. (D): HTML output takes shape (verifies inline base64 size is acceptable)
3. (E): failure branch + placeholder page
4. (F): architecture.md sync

After each step run `npx tsc --noEmit` + manual verification before moving on (matches the project's one-edit-one-verify rule).

---

### 6. Risks & Notes

#### 6.1 Vite dev server startup check

**Conclusion: no need to poll manually.** `playwright.config.ts` lines 17–22 already set `webServer.command=npm run dev` + `webServer.url=http://localhost:5173` + `reuseExistingServer: !process.env.CI` + `timeout: 30_000`. The Playwright runner polls the URL until 200 or timeout itself; `visual-report.ts` can call `await page.goto(...)` directly.

**Note:** `reuseExistingServer` is true (non-CI); if a local dev server is already up it is reused; CI forces a restart (this ticket stays manual-trigger, so no CI scenario for now).

#### 6.2 Existing Playwright config testMatch behavior — **Engineer must verify**

**Issue:** `playwright.config.ts` doesn't set `testMatch` explicitly; Playwright default is `.*(test|spec)\.(js|ts|mjs)` → primarily a `spec.ts` glob, but in practice the default glob may cover `*.ts` (needs empirical confirmation).

**Engineer must verify during implementation:**
1. Write a stub `visual-report.ts` first, then run `npx playwright test` (no file specified)
2. If the output lists visual-report.ts → it gets swept into the e2e suite (every normal test run would produce a report) → add `testIgnore: ['**/visual-report.ts']`
3. If not listed → keep as-is; `npx playwright test visual-report.ts` (file specified) still runs
4. Record the verification approach in the ticket Retrospective (Engineer section)

**Why not just edit the config directly:** editing config without measuring first risks misjudging the default; Engineer measures, then decides — prevents drift.

#### 6.3 HTML single-file base64 size

**Estimate:** 4 public pages, each full-page PNG ~500 KB – 1.5 MB (depending on content length); base64 inflates ~33% → single HTML around 2–8 MB.

**Verification threshold:** after Engineer's first run, `ls -la docs/reports/K-008-visual-report.html` checks file size:
- ≤ 10 MB: accept, commit.
- > 10 MB: Engineer logs in ticket Retrospective, does not optimize immediately; PM decides whether to file as K-008 follow-up debt / next-cycle ticket.

**Fallbacks (not implemented in K-008 scope):**
- PNG → JPEG quality 85 (acceptable for colour screenshots)
- Switch to split directory + `index.html` + `*.png` (requires AC change; PM ruling needed)

#### 6.4 Playwright full-page screenshot viewport consistency

**Issue:** Playwright default viewport is 1280×720; `fullPage: true` scrolls down but stays at 1280 wide. If `/app` has layout differences at different widths (K-Line home is responsive), the screenshot only reflects the 1280px viewport state.

**Conclusion: MVP accepts a fixed 1280 width.** Each section's meta line states `Dimensions: 1280 × <actual height>` so the reader knows which breakpoint the screenshot represents. Multi-breakpoint capture goes into a future ticket.

#### 6.5 fs.writeFileSync throws when `docs/reports/` does not exist

**Conclusion:** `fs.mkdirSync(path, { recursive: true })` first, then write. `.gitkeep` is only for retaining the empty directory at commit time; runtime does not depend on it.

#### 6.6 Script semantics vs reports produced by the `test` function

**Issue:** Playwright runner produces `playwright-report/` HTML by default (list reporter + html reporter when tests retry/fail). We also produce `docs/reports/K-XXX-visual-report.html`; names and paths differ, so there is **no conflict**. But note:
- If our script throws → Playwright treats it as a test failure → the runner itself produces a `playwright-report/` that obscures the real issue.
- Solution: inside the script, "page goto / screenshot failures" do not rethrow — they are recorded to `failures`; finally, in `test.afterAll()` after the HTML is aggregated, assert with `expect(failures.length).toBe(0)` (so exit code reflects real state).

---

### 7. Triage Drift Check

Grep `agent-context/architecture.md` for names K-008 will change:

| Keyword | Hit line | Status |
|--------|--------|------|
| `visual-report` | — | No hit |
| `docs/reports` | line 50 "Playwright visual-report output" | Doc placeholder, not yet landed; K-008 will realize it — no drift fix needed |
| `TICKET_ID` | — | No hit |
| `e2e/fixtures` | exists, unchanged | n/a |

**Conclusion: no Engineer-actionable drift fix.** `docs/reports/` is already noted at line 50 in "to be produced" tense; K-008 implementation lands it. This time, architecture.md adds a new "QA Artifacts" section formally promoting the directory to a structural element (see §8).

---

### 8. Architecture Doc Sync Plan

`agent-context/architecture.md` exists → K-008 adds `e2e/visual-report.ts` + `docs/reports/K-XXX-visual-report.html` artifacts + env-var convention (`TICKET_ID`). This is "new module + new artifacts directory" → Edit required.

**Plan (Architect executes before this task ends):**
1. `updated:` from 2026-04-18 → 2026-04-18 (same-day multi-edit; no change needed)
2. Directory Structure `e2e/` block adds one line: `│   │   │   ├── visual-report.ts     ← K-008 visual report script`
3. Add `## QA Artifacts` section (after `## Frontend Routing`, before `## Auth Flow`):
   - `docs/reports/` directory responsibility
   - `visual-report.ts` execution model (env var + CLI example)
   - Summary of the single-file inline-base64 design decision
4. Changelog append: `2026-04-18 (Architect) — K-008 added QA visual report script and docs/reports/ artifacts section`

---

### 9. Release Status

**Design complete; Engineer can take over.**

**No blocking questions for PM** — the 3 blocking items (local dev server / 4 public pages / env var TICKET_ID) were already locked by PM; Architect's additional decisions (default `UNKNOWN` + warning, partial report + exit 1, inline base64 single file ≤ 10 MB, `testIgnore` decided after Engineer measurement) all sit within Architect authority — no need to bounce back to PM.

**Engineer must complete before starting:**
- `git worktree list` + confirm HEAD is on the latest main (K-Line convention)
- Read §5 implementation order before touching code

---

## Engineer (2026-04-18)

### Implementation Summary

Followed Architect §5 in order; actual file changes:

| File | Status | Contents |
|------|------|------|
| `frontend/e2e/visual-report.ts` | New | 255-line Playwright test runner; routes array + per-page goto+screenshot + `test.afterAll` aggregation producing HTML; failure capture writes a failure section without rethrow; final `expect(failures).toHaveLength(0)` decides exit code. **ESM fix:** package.json `"type": "module"` → use `fileURLToPath(import.meta.url)` instead of `__dirname` (Architect §5 did not mention this ESM constraint) |
| `frontend/playwright.config.ts` | Modified | Split into two projects (`chromium` + `visual-report`), each with its own `testMatch` regex. Rationale in §6.2 measurement below |
| `docs/reports/.gitkeep` | New | Empty file to retain the directory |
| `docs/reports/K-008-visual-report.html` | New (artifact) | 1,039,886 B ≈ 1.04 MB, well below the §6.3 10 MB threshold; 4 full-page base64 PNGs + 1 auth-required placeholder |

### §6.2 testMatch measurement (Engineer must-verify item)

**Steps:**
1. After writing `visual-report.ts`, ran `npx playwright test --list` (no file specified) → only listed the existing 4 files / 45 tests; **the default does not pick up** visual-report.ts (the default testMatch is `**/*.@(spec|test).?(c|m)[jt]s?(x)`; filename does not match).
2. But `TICKET_ID=K-008 npx playwright test visual-report.ts` (file specified) was also blocked by the same default glob → `Error: No tests found`.
3. If testMatch is changed to a regex union (`[/.*\.spec\.ts$/, /visual-report\.ts$/]`), default `npx playwright test` will also start sweeping visual-report.ts in, producing an HTML report on every normal E2E run — violating Architect §6.6's "should not conflict" intent.

**Decision: per-project testMatch (Playwright independent-project approach)**
- `chromium` project: `testMatch: /.*\.spec\.ts$/` — existing 45 tests stay clean
- `visual-report` project: `testMatch: /visual-report\.ts$/` — separate 5 tests
- Verification: `npx playwright test --project=chromium` → 45 tests green; `TICKET_ID=K-008 npx playwright test visual-report.ts` → auto-binds to the `visual-report` project, runs 5 tests
- **Alternative (rejected):** single project + `testIgnore` — does not solve the core "CLI file-spec still filtered by default" issue

### §6.3 HTML single-file size

1.04 MB, passes the ≤ 10 MB threshold; no debt entry needed.

### Local verification results

| Item | Result |
|------|------|
| `npx tsc --noEmit` | exit 0 |
| `TICKET_ID=K-008 npx playwright test visual-report.ts` | 5 passed (4.5s), exit 0 |
| `npx playwright test --project=chromium` | 45 passed (12.4s), exit 0 (regression check) |
| HTML output path | `docs/reports/K-008-visual-report.html` (1,039,886 B) |
| HTML structure | 1× h1 + 4× success sections (with route/dimensions/HTTP status/base64 PNG) + 1× auth-required placeholder, HTML well-formed |

### AC achievement check

- **AC-008-SCRIPT** ✅ — `TICKET_ID=K-008 npx playwright test visual-report.ts` exit 0, `docs/reports/K-008-visual-report.html` produced
- **AC-008-CONTENT** ✅ — full-page screenshot for each of the 4 public pages + route path (`/` `/app` `/about` `/diary`); `/business-logic` shows the explicit "auth required, follow-up ticket (K-008 MVP omits auth fixture)" placeholder

### Open / follow-up debt

No blocking questions. Non-blocking observations (for PM / future tickets):

1. **`/app` screenshot height 720** (other pages 1087–3502) — when `/app` loads, the backend `/api/history-info` proxy returns ECONNREFUSED (backend not running), so the page stays at loading or empty state. MVP accepts this (the report's purpose is to reflect "what the local run currently looks like"); to get a "data-loaded /app screenshot" requires a separate ticket introducing a backend fixture or mock.
2. **`waitUntil: 'networkidle'`** — used for the 4 pages other than `/business-logic`; with backend unavailable, this may wait the full 5s timeout (measured: `/app` 1.1s pass, `/` 1.2s pass). If a backend mock is added in the future, switch to `'load'`.

### W1/W3/W4/S2 fixes (2026-04-18)

Implemented after PM ruling (this file's `## Code Review` §PM ruling). Retrospective in `docs/retrospectives/engineer.md` 2026-04-18 Bug Found Protocol entry.

| Item | File / Line | Summary |
|------|-----------|------|
| W1 | `frontend/e2e/visual-report.ts` L72–93 (`resolveTicketId()`), L235–244 (`test.describe` + `test.beforeAll`) | `resolveTicketId()` no longer called at module top level; `ticketId` / `outputPath` now resolved lazily in `test.beforeAll()`. Module load no longer prints a warning; `npx playwright test --list` stdout is clean |
| W3 | `frontend/e2e/visual-report.ts` L237–244 | The `results: SectionResult[]` array is moved into the `test.describe` closure and reset by `beforeAll` on each run; the original module-level `const results = []` is removed. Future retries / `--repeat-each` will not accumulate duplicate sections |
| W4 | `frontend/e2e/visual-report.ts` L79–93 (`resolveTicketId()`) | After reading `process.env.TICKET_ID` and normalizing with `replace(/^K-/i, '')`, apply the whitelist regex `/^[A-Za-z0-9_-]+$/`; invalid input directly `throw new Error('Invalid TICKET_ID: ...')`, blocking HTML emission |
| S2 | `.gitignore` L31–32 (new section) | Added `docs/reports/*.html`; `docs/reports/.gitkeep` remains and is unaffected by the ignore, so the directory structure is preserved in PRs |

**Side effects:** `renderHtml()` now accepts `(ticketId, results)` parameters (previously read from module-level variables); `renderSection()` unchanged. Architect §3's HTML section still holds.

**Local acceptance (all 6 steps passed):**

| Step | Command | Result |
|------|------|------|
| 1 | `cd frontend && npx tsc --noEmit` | exit 0 |
| 2 | `cd frontend && npx playwright test --list 2>&1 \| grep -i "TICKET_ID not set"` | No output (W1 acceptance passed) |
| 3 | `cd frontend && npx playwright test --project=chromium` | 45 passed (12.6s) |
| 4 | `cd frontend && TICKET_ID=K-008 npx playwright test visual-report.ts` | 5 passed (4.5s), HTML produced 1,039,886 B |
| 5 | `cd frontend && TICKET_ID=../../etc/passwd npx playwright test visual-report.ts` | `Error: Invalid TICKET_ID: ../../etc/passwd`; HTML not produced (W4 acceptance passed) |
| 6 | `git -C <inner repo> status --untracked-files=all` | `docs/reports/*.html` does not appear (`check-ignore -v` returns `.gitignore:32`); only `.gitkeep` shows as untracked |

---

## Retrospective

### Engineer (2026-04-18)

**AC reading:** AC-008-SCRIPT + AC-008-CONTENT both land directly within MVP scope without ambiguity.

**testMatch edge case unanticipated:** Architect §6.2 expected two branches — "default testMatch does not pick up → no change" or "picks up → add testIgnore". The actual third branch hit was: **default does not pick up, but CLI file-spec is also blocked**. The cause is that the Playwright default glob (`*.@(spec|test).?(c|m)[jt]s?(x)`) also applies to the CLI file-filter; the CLI does not override testMatch. The fix uses per-project testMatch (clean separation that does not pollute the default E2E run); Architect did not list this branch, and I ran into two wrong attempts during implementation (first tried `testMatch: [regex1, regex2]` → polluted default; then switched to per-project).

**ESM unanticipated:** Architect §3 HTML template implied `fs.writeFileSync` but did not mention that `package.json "type": "module"` would make `__dirname` unavailable after TS→ESM compilation. The first `--list` run hit `ReferenceError: __dirname is not defined in ES module scope`; switched to `fileURLToPath(import.meta.url)` to resolve.

**Next time improvement:**
1. **Engineer runs `--list` on the stub before implementing** — at skeleton step (B), run `npx playwright test visual-report.ts --list` to verify the runner can see the file, instead of waiting until the actual run to discover the filename filter issue.
2. **Check `package.json` for ESM environment first** — for any new `.ts` that uses Node runtime globals (`__dirname` / `__filename` / `require`), first `grep '"type"' package.json`; if `module`, immediately use `import.meta.url` style.
3. **New Architect §6 risk-clause branches must be folded back in** — §6.2's "default does not pick up" conclusion did not cover "CLI file-spec also blocked"; the per-project measurement should be folded back into architecture.md or Architect retrospective so it isn't hit again (I will hand this back to Architect).

### QA Reflection (2026-04-18)

**What didn't go well:**
- The regression plan was pre-listed as 6 steps in the PM prompt; QA only executed by the table without adding boundary tests (e.g. `TICKET_ID` empty string, all-whitespace, with Unicode, mixed-case `K-`); the W4 whitelist negative path was only verified with the single `../../etc/passwd` payload. If a user accidentally passed `TICKET_ID=" "` or `TICKET_ID="K-008 "` with trailing whitespace, the regex would reject it — but QA never ran or documented this behavior, leaving no reference for future bug triage.
- Did not produce a downstream-impact list for "all shared files": this ticket modifies `.gitignore` / `playwright.config.ts`, both cross-spec impact surfaces; QA only ran `--project=chromium` to verify the 45-test regression, without an independent sweep of `.gitignore` for "are other HTML artifacts unintentionally being ignored?" (e.g. `frontend/dist/*.html`, `coverage/*.html`). The Reviewer's `check-ignore -v` output showed the rule matched `docs/reports/*.html` precisely with no overreach, but QA only verified per PM step 6 rather than checking proactively.
- The "content layer" verification of the HTML artifact was missing: size 1,039,886 B passed the >500KB/<10MB threshold, but the HTML wasn't opened to check whether `/app` was still in an empty state (1.04 MB makes sense because 3 pages have content, but if `/app` were 3500px tall and `/business-logic` had been mistakenly classified as auth-required, the size would still fall in the normal range). AC-008-CONTENT's "each screenshot has a corresponding route-path label" was never verified by actually opening the HTML — QA relied on the Engineer's self-report.

**Next time improvement:**
1. **Auto-expand boundary payload list** — for any ticket involving env var / CLI input, QA prepares a fixed list (empty string, all-whitespace, trailing whitespace, case variants, Unicode, length overflow) without waiting for the Reviewer to list payloads; attach the regression report after running.
2. **Cross-file impact inventory** — for any ticket modifying `.gitignore` / cross-spec config, QA runs `git check-ignore -v` on a sample file from each common artifact directory (`dist/`, `coverage/`, `node_modules/`, `docs/`) to confirm no overreach.
3. **Artifact content verification** — for HTML / JSON / any readable artifact, QA samples structure at least once (e.g. `grep -c "<section"` for HTML section count, `grep "data:image/png"` for base64 count); not just size. For this ticket, add `grep -c 'class="page-section' docs/reports/K-008-visual-report.html` → should be 5 (4 success + 1 auth-required).

---

## Code Review (2026-04-18)

Reviewer: senior-engineer agent
Scope: `frontend/e2e/visual-report.ts` (+255), `frontend/playwright.config.ts` (split into 2 projects), `docs/reports/.gitkeep`, `docs/reports/K-008-visual-report.html` (artifact 1.04 MB), architecture.md §QA Artifacts

### Critical (must-fix)

**None.** Implementation matches AC-008-SCRIPT + AC-008-CONTENT; `npx tsc --noEmit` exit 0; `npx playwright test --project=chromium` 45 existing tests green; `TICKET_ID=K-008 npx playwright test visual-report.ts` 5 tests green; XSS surface fully covered by `escapeHtml`; exit code correctly reflects real state via `expect(failures).toHaveLength(0)`.

### Warning (suggested fixes)

**W1 — `resolveTicketId()` warning pollutes the default Playwright workflow** (`visual-report.ts:88`)
The module-level `const TICKET_ID = resolveTicketId()` is imported when Playwright collects tests (even when `--project=chromium` does not run this file); empirically `cd frontend && npx playwright test --list` already prints `[visual-report] WARNING: TICKET_ID not set...` to stdout, contaminating the existing E2E flow log. Recommendation: move `resolveTicketId()` inside `test.beforeAll()` or `test.afterAll()`, or refactor to a lazy `function`. Module-load phase should not compute or emit side effects.

**W2 — architecture.md §QA Artifacts line 425 stale (design vs implementation drift)**
Architect §8 originally wrote: "if the default glob is later found to pull visual-report.ts into the e2e suite → add `testIgnore`". Engineer hit the third branch (default does not pick up but CLI file-spec also blocked), and chose per-project testMatch splitting into 2 projects (not testIgnore). architecture.md line 425 retains the stale wording. Architect must update §QA Artifacts:
- Final decision: per-project testMatch (`chromium` / `visual-report` two projects)
- Rationale: default testMatch + CLI file-filter interaction + testIgnore does not solve the CLI file-spec problem
- Side-effect notes: future new specs must be confirmed to belong to the `chromium` project; new visual-report-style files require either a new project or extending the `visual-report` testMatch regex

**W3 — module-level `results: SectionResult[] = []` is not test-scoped** (`visual-report.ts:72`)
If `playwright.config.ts` later enables `retries`, or dev runs with `--repeat-each=2`, the results array does not clear → HTML will show duplicate page sections. retries is currently unset, so the risk is latent. Recommendation: move results into the `test.describe` callback and reset with `test.beforeAll()` (initialize once per batch run).

**W4 — `TICKET_ID` lacks whitelist; potential path traversal** (`visual-report.ts:85–92`)
`TICKET_ID=../../etc/passwd npx playwright test visual-report.ts` would compute `OUTPUT_PATH = docs/etc/passwd-visual-report.html` (verified via `path.join`). Only triggerable by a user setting a malicious env var; threat model is low, but 2 lines of validation seal it:
```
const normalized = raw.replace(/^K-/i, '')
if (!/^[A-Za-z0-9_-]+$/.test(normalized)) throw new Error(`Invalid TICKET_ID: ${raw}`)
```

### Suggestions (filed as tech debt)

**S1 → TD-012 — `/app` empty-state screenshot report has low value**
Engineer already noted in §"Open / follow-up debt" item 1: `/app` stalls at loading/empty due to backend ECONNREFUSED, screenshot height is 720. AC-008-CONTENT is technically met (full-page screenshot + route label exist), but the "visual acceptance" value is zero. File as TD-012; solution direction: probe backend availability at startup, downgrade to an "auth-required"-style placeholder when unavailable; or introduce backend fixture / mock.

**S2 — HTML artifact version-control strategy (PM ruling required, not a bug)**
Current state: `docs/reports/K-008-visual-report.html` 1.04 MB is untracked, awaiting commit. One per ticket with binary-ish base64 → git diff is meaningless, repo size grows linearly. Options:
- (a) commit into version control — convenient for PR / online GitHub viewing / offline user reading; cost is repo bloat
- (b) add `docs/reports/*.html` to `.gitignore`, keep only `.gitkeep` — clean repo, regenerate locally when needed
- (c) commit only "milestone" reports (when PM/QA close a Phase); gitignore the rest

Reviewer recommends (b), rationale: `visual-report.ts` can regenerate locally any time, the QA flow already notifies the PM of the report path (the user can open it locally), and committing binary files long-term costs more than online-viewing convenience. Needs PM ruling.

**S3 — architecture.md Pages line drifts from implementation (minor)** (`visual-report.ts:250` vs architecture.md §3)
Architect §3 HTML design said `Pages: 4 captured, {failures} failed`; Engineer extended to `Pages: {successes} captured, {failures} failed, {authRequired} auth-required (not captured)`. The extension is reasonable (more accurate auth-required count) but architecture.md is not synced. Suggest Architect fold this fix into the W2 §QA Artifacts edit.

**S4 — Pass items (confirmed)**
- TypeScript types complete (discriminated union `SectionResult`)
- XSS: `escapeHtml` correctly covers label / routePath / error message / error stack / TICKET_ID / generatedAt
- Error handling: per-page try/catch + first 3 stack lines + no rethrow + afterAll aggregation exit code, correctly per Architect §6.6 design
- `fs.mkdirSync(OUTPUT_DIR, { recursive: true })` handles directory-missing case (Architect §6.5)
- Existing 4 specs (`pages` / `ma99-chart` / `business-logic` / `navbar`) untainted (verified `--project=chromium` 45 pass)
- `console.log/warn` carries eslint-disable comments and is only used inside the script / afterAll — reasonable dev-tool usage

### Tech debt registration draft

| ID | Item | Priority | Notes |
|----|------|--------|------|
| TD-012 | visual-report `/app` empty-state screenshot — placeholder downgrade when backend unavailable | Low | Awaits PM ruling before filing |

### PM Ruling Table (items requiring Reviewer-to-PM decision)

| # | Finding | Severity | Reviewer recommendation | PM decision needed |
|---|------|--------|---------------|-----------|
| W1 | TICKET_ID warning pollutes default run | Warning | Fix in this ticket (move into test scope) | Fix / Defer |
| W2 | architecture.md §QA Artifacts stale | Warning | Summon Architect to add per-project decision and side effects | Fix / Defer |
| W3 | module-level `results` not scoped | Warning | Fix in this ticket (add `test.beforeAll` reset) | Fix / Defer |
| W4 | TICKET_ID lacks whitelist (path traversal) | Warning | Fix in this ticket (2-line validation) | Fix / Defer |
| S1 | `/app` empty-state report low value | Suggestion | File as TD-012 | Confirm TD-012 ID + priority |
| S2 | HTML artifact version-control strategy | Suggestion | Recommend (b) `.gitignore` + `.gitkeep` | Choose (a) / (b) / (c) |
| S3 | Pages line minor drift | Suggestion | Fold into W2 fix | — |

### PM Ruling (2026-04-18)

| # | Decision | Rationale | Owner |
|---|------|------|---------|
| W1 | Fix in this ticket | Module-level side effect pollutes every Playwright run (`--list` also prints the warning); fix is clear (move to test scope / lazy function), cost <5 lines; leaving it means every existing E2E run is noise-polluted, debt compounds. | Engineer |
| W2 | Fix in this ticket | architecture.md is the input source for the next ticket; stale design-vs-implementation drift directly misleads follow-up tickets (e.g. a new visual-report-style spec would walk down the dead-end `testIgnore` path). Architect retrospective §3 already said this should be folded back; not fixing here means the prior retrospective conclusion is hollow. | Architect |
| W3 | Fix in this ticket | Although retries=0 keeps risk latent, the fix lives in the same change region as W1 (`visual-report.ts` module top → test scope); marginal cost of fixing together is 0; splitting to a later ticket would force re-opening context. | Engineer |
| W4 | Fix in this ticket | Adopt Reviewer's original assessment (threat model low but 2-line validation seals it); the rule "external input → generated filename → default whitelist" is already in the Reviewer retrospective future-AC template, and this ticket serves as the first concrete instance. | Engineer |
| S1 | Tech debt TD-012 | The root-cause solution (backend probe / fixture / mock) reaches beyond the visual report script itself — it's a `/app` test-data strategy issue. TD-012 is "low" priority, handled together with a related ticket later (current screenshot behavior already meets AC-008-CONTENT). | — |
| S2 | (b) `.gitignore` + `.gitkeep` | Adopt Reviewer's recommendation: HTML reports can be regenerated locally (just run `npx playwright test visual-report.ts`); the QA flow already informs PM of the path (user opens locally); 1 MB × N tickets in git long-term costs more than online-viewing convenience. If a future "milestone archival" need arises, revisit (c); for now (b). | Engineer |
| S3 | Fold into W2 fix | Same file, same section (architecture.md §3 / §QA Artifacts) → lowest single-edit cost; splitting forces Architect to re-engage twice. | Architect |

**Remaining work for this ticket:**
1. Engineer: fix W1 (move resolveTicketId into test scope) / W3 (results array reset in beforeAll) / W4 (TICKET_ID 2-line whitelist validation) + S2 `.gitignore` setup (add `docs/reports/*.html` ignore, keep `.gitkeep`, clean up the already-untracked `K-008-visual-report.html`)
2. Architect: fix W2 (architecture.md §QA Artifacts updated to per-project testMatch decision + rationale + side-effect notes) + S3 (§3 Pages line synced to `{successes} captured, {failures} failed, {authRequired} auth-required (not captured)`)
3. After → QA regression (Playwright full suite + visual-report script rerun) → PM close

**Order: Engineer first, then Architect.** Rationale: W1/W3/W4 all live in `visual-report.ts`; Engineer fixes them in one pass + runs `npx tsc --noEmit` + `TICKET_ID=K-008 npx playwright test visual-report.ts` to verify. Only after that does Architect have the final "per-project testMatch decision + W4 whitelist implementation" to reference into architecture.md; the reverse order would force a second drift-fix pass.

### Retrospective (Reviewer)

**What didn't go well:**
- The side effect of `resolveTicketId()` running at module top level was foreseeable at Architect §2.1 design time ("prints a warning at startup" was written into the design, but "startup = when" was not). If AC or design had required marking the side-effect trigger point (module load / beforeAll / test body), W1 would not have slipped through to the Reviewer.
- W4's path traversal is a basic security checklist item for "env var → filesystem"; AC didn't constrain TICKET_ID format and Architect §2.1 didn't require validation, so the implementation didn't add it. This is a coverage gap at the PM AC-definition stage (any future "AC where external input becomes a filename" should default to requiring a whitelist).

**Next time improvement:**
1. When reviewing AC / Architect design docs, for any "module-level side effect"-class statement (warning / console / fs op) ask directly "when does this trigger? who imports it?" and write the trigger time into the design.
2. For any AC involving "external input (env var / URL param / file path) → generated filename / path", add a Reviewer checklist line: verify a whitelist or allow-list exists. K-Line future tickets should fold this into the PM AC-writing template.

---

## QA Acceptance (2026-04-18)

Executed by: qa agent (`~/.claude/agents/qa.md`)
Scope: full AC-008-SCRIPT + AC-008-CONTENT acceptance + Playwright E2E regression + W1/W4/S2 fix verification + HTML artifact structure verification.

### Per-AC acceptance

| AC | Result | Evidence |
|----|------|------|
| AC-008-SCRIPT | **PASS** | `cd frontend && TICKET_ID=K-008 npx playwright test visual-report.ts` → 5 passed (4.6s); `docs/reports/K-008-visual-report.html` produced (1,039,886 B), exit code 0 |
| AC-008-CONTENT | **PASS** | HTML structural sampling: `grep -c 'class="page-section'` = **5** (4 success + 1 auth-required); `grep -o 'data:image/png;base64' \| wc -l` = **4** (one full-page PNG per public route); `grep -A1 'class="route"'` lists 5 `<code>` labels: `/`, `/app`, `/about`, `/diary`, `/business-logic`; the "auth required, follow-up ticket" placeholder appears once (only in the `/business-logic` section) |

### Regression Test (6 steps)

| # | Command (cwd = `frontend/`) | Result | Notes |
|---|--------------------------|------|------|
| 1 | `npx tsc --noEmit` | **PASS** (exit 0) | No type errors |
| 2 | `npx playwright test --project=chromium` | **PASS** (45 passed / 12.6s) | Existing 4 specs green, no regression |
| 3 | `TICKET_ID=K-008 npx playwright test visual-report.ts` | **PASS** (5 passed / 4.6s) | HTML produced at 1,039,886 B = 1.04 MB |
| 4 | `npx playwright test --list 2>&1 \| grep -i "TICKET_ID not set"` | **PASS** (no output, grep exit 1) | **W1 verified:** after `resolveTicketId()` moved into `test.beforeAll()`, module-load phase no longer prints the warning |
| 5 | `TICKET_ID=../../etc/passwd npx playwright test visual-report.ts` | **PASS** (test fails with `Error: Invalid TICKET_ID: ../../etc/passwd`) | **W4 verified:** whitelist regex rejects the invalid ID at the `beforeAll` stage, HTML is not written; 4 tests skipped as expected (beforeAll throw aborts subsequent tests) |
| 6 | `git status --untracked-files=all` | **PASS** | **S2 verified:** `docs/reports/K-008-visual-report.html` not in untracked list; `git check-ignore -v docs/reports/K-008-visual-report.html` returns `.gitignore:32:docs/reports/*.html` — rule matches precisely, no overreach; `.gitkeep` remains untracked (expected behavior, preserves directory in PR) |

### Backend regression

`git -C <repo> diff --name-only HEAD -- backend/` → no output.
**Backend unchanged, pytest skipped.**

### HTML artifact

| Item | Value |
|------|-----|
| Path | `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/docs/reports/K-008-visual-report.html` |
| Size | 1,039,886 B = 1.04 MB |
| Size threshold | ≥ 500 KB ✅; ≤ 10 MB ✅ (well below Architect §6.3 threshold) |
| Structure | 5 × `<section class="page-section ...">` + 4 × base64 PNG (`/`, `/app`, `/about`, `/diary`) + 1 × auth-required placeholder (`/business-logic`) |
| Gitignore | rule `.gitignore:32:docs/reports/*.html` matches precisely; does not accidentally hit `dist/`, `coverage/`, or other directories (sampled) |

### Known observations (do not affect this ticket's PASS)

1. **`/app` screenshot still in empty state** (height 720) — backend ECONNREFUSED; falls under TD-012 scope; PM ruled it as tech debt, not this ticket's concern.
2. **W4 whitelist negative payload only verified `../../etc/passwd`** — empty string / trailing whitespace / Unicode not tested; QA reflection section lists this as a next-time improvement.
3. **HTML size range is wide** (1.04 MB far below 10 MB threshold) — if `/app` later has full data, 4 screenshots + base64 estimated 2–5 MB, still within Architect §6.3 acceptance range.

### Conclusion

**Pass — clear for PM close.**

All 2 ACs pass, all 6 regression steps pass, W1/W3/W4/S2 fix verifications pass, HTML structure correct, no existing E2E regression, backend untouched so pytest skipped. Recommend PM proceed with roll-up + close flow.

---

## Retrospective

### PM Roll-up (2026-04-18)

**Cross-role recurring issues:**

1. **"Architect design docs do not specify side-effect trigger time / state boundary / config × run-mode matrix" is the shared upstream root cause for most Warnings in this ticket** (Architect / Engineer / Reviewer flagged it independently):
   - W1: Architect §2.1 wrote "prints a yellow warning at startup" but did not define "startup" = module load vs test body; Engineer wrote it as module top-level under a "script entry" mental model; Reviewer ran `--list` and discovered it polluting the default E2E stdout
   - W3: Architect §3 did not factor in the impact of Playwright `retries` / `--repeat-each` on module-level state; Engineer's module-top `results: SectionResult[] = []` accumulates across runs
   - W2: Architect §6.2 listed two branches ("default picks up / does not pick up") and missed the third ("default does not pick up but CLI file-spec is also blocked"); Engineer hit it empirically and pivoted to per-project testMatch
   - S3: Architect §3 `Pages: 4 captured` counted the `/business-logic` placeholder as captured; the state × count matrix was incomplete
   - **Shared root cause: Architect designed via "approximately right enumeration" rather than a "config/state × trigger-time truth table"**
2. **"External input → filesystem sink" security check failed at all three layers** (W4; Engineer / Reviewer share the root):
   - PM AC template did not require a TICKET_ID format constraint
   - Architect §2.1 did not include a validation clause
   - Engineer mental model: an env var typed by the dev ≠ untrusted input — flowed straight into `path.join` → `fs.writeFileSync`
3. **No automatic trigger for post-implementation Architect doc sync** (W2 structural axis; Architect's own prior K-008-design retrospective forewarned "next time measure", yet the K-008 design recurred — self-flagged as a repeat violation): when Engineer implementation decisions diverge from Architect's original design (per-project testMatch / HTML counter expansion), there is no hook to re-engage Architect for doc sync; drift is caught reactively only at Reviewer time
4. **QA missed three checklists: boundary payload, gitignore overreach, artifact structural invariant** (QA's own reflection, dovetailing with Reviewer's "whitelist checklist should feed back into the PM AC template"): W4 used only the `../../etc/passwd` payload; `.gitignore` only verified the target file without sampling `dist/` `coverage/`; HTML size threshold is insufficient as a structural invariant

**Process improvement decisions:**

| Issue | Owner | Action | Update Location |
|------|---------|------|---------|
| Architect design lacks "config/state × trigger-time" truth table (W1/W2/W3/S3 share this root) | Architect | When the design doc involves "X → Y branches" or "module load / console / fs side effects", mandatorily enumerate via a truth table and tag each side-effect's trigger time (module load / beforeAll / test body); for items unable to be measured, explicitly mark "Engineer measurement decision point" with the decision criteria | `architect.md` agent spec adds a "config/state boundary truth table" checklist; Architect retrospective already noted "next-time improvement §1"; this roll-up requires PM to verify the agent spec contains this rule before next Architect dispatch |
| "External input → filesystem sink" security check failed at all 3 layers (W4) | PM + Architect + Engineer | PM AC template defaults to writing a "TICKET_ID needs whitelist" AC for "env var / URL param / CLI arg → generated filename/path" scenarios; Architect design lists validation clauses; Engineer immediately adds a `/^[A-Za-z0-9_-]+$/`-class whitelist when seeing `process.env.*` flowing into `fs.*/path.*/child_process.*/URL` | PM AC template (`pm.md` agent spec), `architect.md` agent spec, `engineer.md` agent spec each add the corresponding checklist (requires user authorization to edit agent specs; this ticket records in per-role retrospectives only) |
| No automatic post-implementation Architect doc sync (W2 structural; Architect self-flagged as repeat violation) | PM + Architect | Ticket close checklist adds "Engineer implementation decision diverges from Architect §N → PM must re-summon Architect for doc sync, do not wait for Reviewer to discover drift"; when Architect delivers ticket §Architecture, append a "Post-impl sync checklist" so PM / Engineer have an explicit trigger | K-Line `CLAUDE.md` ticket close checklist; Architect retrospective already noted (2026-04-18 W2/S3 post-fix reflection §next-time improvement §1); this roll-up upgrades it to "PM must do" rather than "Architect's choice" |
| QA boundary payload / gitignore / artifact-invariant checklists | QA | QA agent establishes a fixed checklist: (a) for env var / CLI input tickets, automatically run 6 payloads (empty string / all-whitespace / trailing whitespace / case variants / Unicode / length overflow); (b) when modifying `.gitignore`, run `git check-ignore -v` against a sample from each common artifact directory (`dist/` `coverage/` `node_modules/` `docs/`); (c) for each artifact type, define 1–3 structural greps as operational invariants in the QA acceptance section | `qa.md` agent spec; QA retrospective already noted three "next-time improvements"; this roll-up confirms no ticket split — QA folds the checklist in before its next task |
| PM did not explicitly list an "ordering decision" when a Reviewer finding routed work to both Engineer + Architect | PM | Below the ruling table, "Remaining work for this ticket" gets its own "Ordering decision" sub-section explicitly stating the three options (A first / B first / parallel) plus the rationale; not buried in narrative meta-commentary | `pm.md` agent spec (PM retrospective 2026-04-18 K-008 W1–W4 ruling §next-time improvement already noted) |
| Cross-ticket trend detection (K-011 PM roll-up forewarned this; K-008 PM roll-up implements it for the first time) | PM | Each PM roll-up adds a "scan QA retrospectives of the most recent 3 closed tickets" step to identify recurring categories of unverified gaps; verified in this ticket: K-008 QA's self-added HTML structure-sampling closed the K-010 "missing screenshot script" systemic gap; trend has converged | `pm.md` agent spec "auto-trigger" table; this roll-up is the first formal execution; the loop closes for the first time |

**Notes on this roll-up's decisions:** of the 6 process improvements above, items (2)(3)(5)(6) involve editing `~/.claude/agents/*.md` agent specs — institutional changes requiring user authorization; this ticket records them in each role's per-role retrospective log and stages them in this roll-up table. Items (1)(4) are per-ticket operational rules; Architect / QA must read their own retrospective logs and apply them before next dispatch. PM does not expand scope to edit agent specs this round, to avoid violating the "discuss before modify when the approach is unclear" memory; user can authorize them together when the relevant mechanism next triggers.
