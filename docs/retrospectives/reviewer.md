## 2026-05-02 — K-075 AppPage decomp (Step 2 depth review; CODE-PASS, COMMIT-BLOCKED)

**What went well:** Hook interface tables matched design doc §1 exactly; K-013 spirit verified via workspaceComputation.ts call chain; useRef circular-dep pattern documented.

**What went wrong:** Engineer extracted computeWorkspace to a new undocumented util file absent from design doc §2 File Plan, making the design doc §3/§5 statements about the call site factually wrong; AC-075-APPPAGE-LINE-COUNT violated (127 vs ≤100) due to Architect underestimate of Sacred JSX size.

**Next time improvement:** When AC specifies a line-count bound on a component with Sacred DOM testids, Architect must count actual JSX lines before publishing the constraint.

**Slowest step:** Verifying K-013 spirit vs letter — required reading K-013 design doc §5.3 call tree, workspaceComputation.ts body, and AC-075-K013-CONTRACT text to confirm the dead-import is a grep anchor, not a behavior regression.


## 2026-04-30 — K-048 Phase 1 (freshness_hours API + stale indicator; Step 2 depth review; CODE-PASS, COMMIT-BLOCKED)

**What went well:** All 3 ACs trace directly to implementation; date-slice logic ([:16] for 1H, [:10] for 1D) matches design doc §2 exactly; loose `!= null` guard correctly handles both `null` and `undefined`; K-009 Sacred clause (ma_history=_history_1d) and K-046 write-block both intact.

**What went wrong:** `frontend/public/sitemap.xml` (lastmod date bump) was left unstaged in the worktree — unrelated to K-048 scope but falls inside `frontend/public/**` commit-block scope per K-037 gate, making the branch not merge-ready.

**Next time improvement:** Engineer should run `git status --short` and restore/stage stray dev-server side-effects before handing off to Reviewer; the sitemap.xml date bump is a known pre-build side-effect that recurs across tickets.

**Slowest step:** Verifying the monkeypatch-ordering in test_history_info_freshness_null_when_mock_data took longest — tracing Python module-reload semantics in conftest.py make_client fixture confirmed the test is valid.

---

## 2026-04-29 — K-061 (Fix 24 E2E backend-dependent failures; Step 2 depth review; CODE-PASS, COMMIT-BLOCKED)

**What went well:** ga-consent.spec.ts sacred-check verified — addInitScript pattern is established there (per-test body, before goto); fix in 3 new specs follows the identical pattern with no conflict. AC-061-NO-FALSE-PASS confirmed: only addInitScript + comment lines added, zero assertion changes. AC-061-NO-SHARED-BEFOREEACH confirmed: no beforeEach block exists in ma99-chart.spec.ts.

**What went wrong:** Ticket and commit message claim "24 failing / 17 from ma99-chart" but grep of base commit (dac6cee) finds only 13 tests in ma99-chart, 3 in upload-real-1h-csv, 4 in K-013 = 20 total; even subtracting 2 previously-passing tests yields 18 max failing, not 24 — count discrepancy in AC text vs actual spec.

**Next time improvement:** When reviewing a fix ticket whose AC states a specific test count, run `grep -c` on the base-commit spec file immediately to validate the count claim before reviewing code.

---

## 2026-04-29 — K-059 (Infinite Scroll + paper-palette rebrand; Step 2 depth review; CODE-PASS, COMMIT-BLOCKED)

**What went well:** Sacred AC-024-LOADING-ERROR-PRESERVED byte-verified against `git show 387cdd5:frontend/src/components/diary/DiaryLoading.tsx` — outer div attributes identical before/after; all three attributes (`data-testid`, `role`, `aria-label`) preserved verbatim. Removed-text widened grep confirmed `diary-load-more` only in comment context (DiaryPage.tsx:17 inline comment) and new negative-assertion test (diary-page.spec.ts:795) — zero orphaned positive assertions. Commit-Block Gate caught 3 uncommitted runtime files (`content/site-content.json`, `frontend/public/sitemap.xml`) + 1 docs file; reported with exact list per gate format.

**What went wrong:** `design-locked: false` in ticket frontmatter is a pre-merge gate violation per AC-059-DESIGN-LOCKED — the ticket field was never updated to `true` despite the arch doc having `design-locked: true`. No single-role owns the cross-check; PM handoff gate should catch it but did not trigger because AC-059-DESIGN-LOCKED is a ticket-frontmatter check, not a code-surface check. Stale comment in `pages.spec.ts:89` ("load-more button appears when entry count > 5") survived the 8-location update pass — not a test failure but misleads future readers.

**Next time improvement:** Reviewer §Plan Alignment checklist should explicitly include: "when any AC has the form `<field>: <value> set before Phase A PR merge`, grep ticket frontmatter for that field and verify current value — mismatch = Warning (PM must set before PR create)." Codification: `~/.claude/agents/reviewer.md` §Plan Alignment bullet.

---

## 2026-04-26 — K-053 (Scroll-to-top on route change; Step 2 depth review; CODE-PASS, 0 Critical / 0 Warning / 2 Info)

**What went well:** Pre-Implementation Design Challenge Gate (Architect Round 2 verdicts on Engineer A1/C1/M1/Z1 sheet) absorbed every issue a depth review would have surfaced — TS typing of `'instant'` literal verified empirically, `history.scrollRestoration='manual'` placement reasoned through StrictMode idempotency, T-K053-04 query-only test correctly skipped via concrete wrong-axis risk analysis (`page.evaluate(window.history.pushState)` bypasses `history` package wrapper, would never trigger `useLocation` re-render — false-pass risk). Depth scan found zero new Critical/Warning because Engineer↔Architect handshake landed all four contract decisions before code committed. AC ↔ implementation alignment verified one-to-one for all 9 AC rows (6 PRD ACs, 4 of which are AC-K053-06 sub-blocks); architecture.md 4-site sync (frontmatter / Directory Structure entry / Frontend Routing one-liner / Changelog prepend) all landed in same commit per `feedback_architect_must_update_arch_doc.md`. Sacred cross-check (K-030 isolation / K-031 adjacency / K-034 P1 byte-identity / K-024 horizontal-overflow / K-040 Footer width parity) all structurally orthogonal — `<ScrollToTop />` adds zero DOM and zero CSS, sibling-additive only. Engineer-judgment adaptations (Suspense-settle anchor `section#header` vs design doc `[data-testid="diary-entry"]`, T-K053-02 lower bound `>= 700` vs `> 0`) both verified sound: `id="header"` is single-instance on `frontend/src/pages/AboutPage.tsx:31`, and `>= 700` discriminates "anchor-driven scroll to ~800" from "any non-reset" with 100px headroom. Git status clean in runtime scope — `frontend/node_modules/` and `frontend/test-results/` are artifact dirs, not commit-blockers per Reviewer §Git Status Commit-Block Gate.

**What went wrong:** Architect Round 2 self-flagged in retro that §12 AC ↔ Test Cross-Check Status column for AC-K053-06 was left stale at "Pending — PM Phase 1 ruling required" despite the row's reality (T-K053-03 active, BQ-K053-01 ruled). Not a code defect; design doc internal-consistency drift. Engineer commit landed without a §12 status-cell refresh pass; Reviewer Step 2 §Design doc checklist re-tick caught it on Architect's own admission rather than independently — meaning the depth checklist line "§12 AC ↔ Test cross-check 9 rows present" is satisfied structurally (9 rows exist) but does not verify the Status column accuracy of each row against §3.3 spec contract reality. Process gap, not Engineer/Architect blame, but exposes a checklist hole.

**Next time improvement:** Add to `~/.claude/agents/reviewer.md` §Design Doc Checklist re-tick — when Architect addendum (e.g. "Round 2 Verdicts") Edits §3 spec contract, also Read §12 AC ↔ Test cross-check Status column **same-pass** and flag stale "Pending..." / "TBD" / "Phase 1 ruling required" cells as Warning to PM. Codification target: add a new bullet under §Design Doc Checklist re-tick reading "(c) Status-column staleness scan: when §3 / §3.3 was Edited via addendum since the table's last full Edit, verify every Status cell in §12 reflects the addendum reality — stale cells = Warning". Memory file proposed: `feedback_reviewer_design_doc_status_column_drift.md` (PM rules whether to write).

---

## 2026-04-26 — K-051 Phase 4 (predictor gate align + toast data-testid + UI i18n; Step 2 depth review; RELEASE-OK to QA, 0 Critical / 0 Warning / 2 Info)

**What went well:** Architect §1 Pre-Design Audit was the strongest dry-run table on record this project — verbatim `git show HEAD:` excerpts for predictor.py 8/11/155-157/331-336/343-345 + AppPage.tsx 349-353 + the full 29-row CJK truth table with file:line citations and (a)/(b)/(c) classification. Made Reviewer Step 2 mechanical: every actionable row had a single Read target + a single grep verification, every preserve row had explicit out-of-scope rationale (zh-TW timestamp regex `上午|下午` functional / JS comments non-display / K-046 K-022 cosmetics era-bound). Sacred K-015 substring runtime byte-identity verified by direct subprocess eval (`python3 -c "from predictor import ...; print(f'... {MA_TREND_WINDOW_DAYS + MA_WINDOW} ...')"` → bytes-identical to literal "129"). Boundary unit tests at `_fetch_30d_ma_series` direct invocation pin the gate at the closest layer (3 new tests, 128/129/130 bars, deterministic `_make_real_date_1d_bars` helper, no DB I/O). Stale comment block deletions clean (11-line empirical-floor block + 10-line "Truncation rationale" paragraph both removed verbatim). All 6 backend Phase-4-affected pytest tests pass (3 new boundary + 3 integration). Targeted Playwright (ma99-chart + upload-real-1h-csv) 16/16 pass on first run. Frontend `tsc --noEmit` exits 0. CJK widened grep (`[一-鿿㐀-䶿぀-ゟ゠-ヿ　-〿＀-￯]`) over 5 scoped files returns exactly the design-doc allow-list (MainChart.tsx:33 + 38 zh-TW timestamp regex preserve), zero leak. Full-width punctuation grep (`（）：，。「」`) on same file set returns ZERO hits — B4 ASCII-only contract met. about.spec.ts:26 isolated re-run passes (1.4s) — Engineer's flake claim valid; `git diff --stat frontend/e2e/about.spec.ts` shows zero modification, ruling out Phase 4 regression.

**What went wrong:** None of substance. Two Info-level observations only — neither blocks QA:

- **F-N1 (Info, AC-051-11 wording vs spec reality):** AC-051-11 says spec swaps selector "for both the visibility-true assertion (24-row reject negative case) AND the visibility-false assertion (happy-path positive case)". The current `upload-real-1h-csv.spec.ts` only has ONE error-toast assertion site (line 164, `toHaveCount(0)`, visibility-false equivalent on a clean 24-row happy-path fixture); there is no parser-rejection test that drives the toast visible-true. Engineer correctly swapped the one site that exists. AC text appears to anticipate a hypothetical visible-true test that was never authored — semantically the swap is complete for the present spec surface. No code change required; recommend PM clarify AC wording in retro to remove the "both" phrasing or open a follow-up to add the visible-true negative parse test (currently 23-bar fixture coverage lives under separate AC-051-09 Sacred message scope, not toast scope). Non-blocking.

- **F-N2 (Info, sitemap.xml drift):** `frontend/public/sitemap.xml` shows `M` in `git status` (lastmod 2026-04-23 → 2026-04-24), confirmed unrelated dev-server build-script artifact (Engineer retro Phase 3c noted same drift pattern). Out-of-scope per ticket prompt; Engineer correctly did NOT stage it (`git diff --stat` confirms staged set excludes sitemap). `~/.claude/agents/reviewer.md` Git Status Commit-Block Gate exempts pre-existing unrelated drift from blocking — but flagging here so PM can route the chronic dev-server-touches-public-asset to TD-K049-01 follow-up if not already tracked.

10 verification mandates verdict: (1) dual-callsite gate at predictor.py:156 affecting both query-side L331-336 + candidate-side L343-345 in unison: **PASS** (per `git show HEAD:` baseline + current file Read; gate change is single point, both callers route through `_fetch_30d_ma_series`). (2) AC-051-10 B1 boundary tests at 128/129/130 bars: **PASS** (3 tests at test_predictor.py:606-652, asserts `[]` / 30 floats / 30 floats, deterministic synthetic history). (3) AC-051-10 B2 stale comment deletions: **PASS** (`git diff` confirms 11-line empirical-floor block + 10-line "Truncation rationale" paragraph both deleted; replaced with concise post-fix wording). (4) AC-051-10 message coupling f-string: **PASS** (predictor.py:335 reads `f"ma_history requires at least {MA_TREND_WINDOW_DAYS + MA_WINDOW} daily bars ending at that date."`, runtime byte-identity to literal "129" verified). (5) AC-051-11 `data-testid="error-toast"` placement + spec swap: **PASS** (AppPage.tsx:350 attribute present; upload-real-1h-csv.spec.ts:164 swapped; no remaining `.text-red-400.border-red-700` chain in spec). (6) AC-051-12 B3 test description on ma99-chart.spec.ts:247: **PASS** (`'MainChart shows MA99 computing label while loading, then value after load'`, fully English). (7) AC-051-12 B4 ASCII punctuation: **PASS** (zero hits across 5 scoped files for `（）：，。「」`). (8) Sacred substring runtime byte-identity: **PASS** (subprocess eval byte-identical to literal). (9) about.spec.ts:26 isolation re-run: **PASS** (1 passed in 1.4s, flake claim valid, no Phase 4 modification). (10) sitemap.xml exclusion: **PASS** (unstaged, untouched by Engineer's commits set).

**Next time improvement:** When AC text references "both visibility-true and visibility-false assertions" but the spec has only one assertion site, Reviewer should flag in retro for PM to either (a) reword AC to match spec reality, or (b) add the missing test in same commit — current pattern of Engineer literal-correct interpretation + AC speculative wording leaves an Info finding that could be a Warning if the missing assertion turns out to be load-bearing. Codify into Reviewer §AC Alignment checklist as a hard sub-step: "any AC clause naming a multi-case assertion list (`for both X AND Y`) must map to N concrete spec line numbers; if N < AC count, Info-flag PM for AC text reconciliation." Memory: `feedback_reviewer_ac_assertion_count_match.md` candidate (low priority — first occurrence on this project).

## 2026-04-25 — K-050 (Footer brand-asset SVG anchors + click-to-copy email; Step 2 depth review; CODE-PASS-with-warnings, 1 Critical / 1 Warning / 2 Suggestions)

**What went well:** Architect §4 dry-run truth-table (pre vs post on 4 routes × event × trigger) made Behavior-Diff transcription mechanical at Reviewer Step 2 — re-ran `git show <base>:Footer.tsx` and confirmed the only OLD-vs-NEW deltas are the explicitly-AC'd ones (3 anchor triad + button + sr-only aria-live + GA disclosure preserved). Pencil parity gate (per `feedback_reviewer_pencil_parity_gate.md`) cleared — all 4 frame JSON specs (`1BGtd / 86psQ / ei7cl / 2ASmw`) carry `_design-divergence` (kebab) / `_designDivergence` (camel) field with text-node id mapping, and `design-exemptions.md §2 BRAND-ASSET` row explicitly lists all 4 frame IDs. Structural-chrome scan returned single Footer source consumed by 4 pages — zero duplication risk; K-034 P1 byte-identity invariant preserved by single zero-prop component. Sacred cross-check (K-017 partial / K-018 full + cross-route sanity / K-022 N/A / K-024 N/A / K-030 / K-034 P1 / K-045 T18+T19) all spec-traceable. Git status clean — every runtime file committed (no COMMIT-BLOCK). E2E specs added under AC-050-EMAIL-COPY-BEHAVIOR + 4 ga-tracking tests + cross-route sanity all use Playwright auto-retry timeout; no hardcoded `waitForTimeout` sleeps in K-050 additions.

**What went wrong:** **Brand-asset SVG fill normalization regression** — `frontend/design/brand-assets/mail.svg` ships with `<path fill="#0F172A">` hardcoded on both path elements (raw Heroicons solid envelope upstream encoding). `fill-current` Tailwind utility on the wrapper SVG sets CSS `fill: currentColor` which path elements inherit, BUT path-level `fill="#0F172A"` SVG presentation attribute overrides the parent CSS-inherited value. Net: mail icon will render dark slate (#0F172A ≈ #0F172A near-black, not `text-muted` #6B5F4E nor hover `text-ink` #1A1814), violating AC-050-FOOTER-LAYOUT clause "fill inherits `text-muted` (#6B5F4E)" + "hover on any icon or email text transitions to `text-ink`". GitHub + LinkedIn SVGs are fine (path has no fill attr → inherits from parent SVG → CSS `fill: currentColor` works). The `vite-plugin-svgr` config `svgrOptions: { icon: true }` only sizes the SVG to `1em` — it does NOT replace `fill="#xxx"` with `currentColor`; that requires `replaceAttrValues: { '#0F172A': 'currentColor' }` (or equivalent). The newly-committed Playwright snapshot baseline `footer-*-chromium-darwin.png` files were captured against this buggy mail icon color, locking in the wrong design. Snapshot tests will pass (against their own bug), masking the regression — Reviewer caught this only via static SVG audit, not via E2E. Designer/Architect handoff did not include "verify path-level fill normalization for fill-current Tailwind contract" — `feedback_reviewer_pencil_parity_gate.md` covers JSX-vs-JSON node parity but does not cover SVG asset internal attribute compatibility with the CSS contract the runtime declares.

**Next time improvement:** Reviewer persona checklist new mandatory sub-step under "Pencil parity gate" — when ticket adds `?react` SVG imports paired with `fill-current` / `text-current` Tailwind utility on the wrapper, grep the imported `.svg` file(s) for any `fill="#..."` / `stroke="#..."` attribute on `<path>` / `<circle>` / `<rect>` / `<polygon>` elements; any non-`currentColor` / non-`none` value violates the CSS-inherit contract and must be flagged Critical regardless of snapshot baseline existence (snapshot can lock in a bug — visual diff against design intent must be human-checked or the SVGR config must include `replaceAttrValues`). Also: when AC includes color/fill claims on icons (`fill inherits text-muted`, etc.), Reviewer must run a live `dev-server + Playwright getComputedStyle().fill` assertion or static-analysis on the SVG asset — not rely on Playwright snapshot since snapshot is captured AFTER the bug freezes. Codify into `~/.claude/agents/reviewer.md` Pencil parity section as a hard sub-step. Memory file: `feedback_reviewer_svg_fill_currentcolor_audit.md` to be written + persona Edit same commit.

## 2026-04-24 — K-049 (public-surface plumbing — Step 2 depth review; CODE-PASS with 1 Important deploy-ordering hazard + 2 Minor test-race latents)

**What went well:** 8 of 8 depth gates fired with verifiable evidence. Pure-Refactor Behavior Diff for Phase 3 `main.tsx` (static imports → `React.lazy`): OLD vs NEW diff showed 5 lines `import X from './pages/X'` swapped for 5 lines `const X = lazy(() => import('./pages/X'))` + one `<Suspense fallback={<RouteSuspense />}>` wrap around `<Routes>` — `initGA()` position untouched, `<GATracker />` mount point unchanged, `useGAPageview()` unchanged (same `PAGE_TITLES` map, `location.pathname`-keyed, synchronous resolution before lazy chunk mount). AC-049-GA-LAZY-1's anti-race design is entirely pre-existing (`useGAPageview.ts:5-11` PAGE_TITLES) — confirmed by running `git show f0fce2c:frontend/src/hooks/useGAPageview.ts` and matching HEAD byte-identical. Architect Claim E verified at code level, not accepted as narrative. Sacred compliance: K-037 6 favicon `<link>` tags byte-identical base→HEAD (`grep -E "rel=\"icon\"|apple-touch|rel=\"manifest\"" frontend/index.html` → 6 identical lines); K-034-P1 `Footer.tsx` untouched (`git log f0fce2c..f150023 -- frontend/src/components/Footer.tsx` empty); K-030 `/app` isolation untouched (`AppPage.tsx` not in diff); K-024 `diary.json` flat schema untouched (`git log` empty), `/diary.json` fetch at `useDiary.ts:39` remains literal static path (Firebase step-3 file serving catches before `/api/**` rewrite — no false match). Build chunk naming verified on-disk (`frontend/dist/assets/`): `page-homepage-*.js` / `page-apppage-*.js` / `page-aboutpage-*.js` / `page-diarypage-*.js` / `page-businesslogicpage-*.js` + `vendor-react` / `vendor-charts` / `vendor-markdown` + `index` — chunk naming convention exact; no page code leaked into vendor chunks. JSON-LD schema.org compliance: `@graph` wrapper valid, `SoftwareApplication` fields (`@type / name / url / applicationCategory / operatingSystem / description / offers`) all schema.org-recognized; `WebSite` fields (`@type / name / url`) minimal-valid. Manifest W3C compliance: required `name / short_name / icons (192+512) / theme_color / background_color / display / start_url` all present; `display: standalone` flipped cleanly from pre-ticket `browser` (single-line diff confirmed). Git Status Gate: `git -C worktree status --short` = `?? frontend/node_modules` only (gitignored, pre-existing); `git -C main-repo status --short` = `?? .claude/` + `?? agent-context/pm-project.md` (both pre-existing, neither is runtime-scope per `feedback_reviewer_git_status_gate.md`); PASS — no commit-block. `tsc --noEmit` exit 0 at HEAD f150023. Playwright full chromium suite: 269 passed / 1 skipped / 1 failed — the 1 failure is `AC-020-BEACON-SPA` explicitly documented as "RED on purpose" in spec header lines 175-193 (K-033 tracker, pre-existing baseline noise carried through K-039/K-041/K-042/K-045 sign-offs), zero K-049 regression authority. Contract test coverage check: about-layout.spec.ts `sectionBoxes` helper (line 36-37) has explicit `waitFor({ state: 'attached' })` gates on `#header` + `#architecture` — addresses the exact lazy-boundary snapshot race Engineer retro called out in K-049 Phase 3 learning. `ga-spa-pageview.spec.ts` AC-020-SPA-NAV (lines 82-96) and BuiltByAIBanner CTA (lines 128-142) both use page_view-scoped `waitForFunction` predicates (not generic `length > prevLen`), correctly waits for the lazy chunk's `useGAPageview` to fire post-mount rather than snapping on the prior `trackCtaClick` push.

**What went wrong:** One Important non-blocking finding + two Minor observations. (I-1) **Deploy-time coordination hazard around `VITE_API_BASE_URL` pre-existing local .env.production**: `frontend/.env.production:1` at the user's local checkout still contains `VITE_API_BASE_URL=https://k-line-backend-841575332599.asia-east1.run.app` (pre-K-049 pinned Cloud Run URL). `.env.production` is gitignored (see `frontend/.gitignore:16: .env.*`) so Engineer cannot commit the retire; the file is the user's local deploy-time state. However, `backend/main.py:34-38` has already removed CORSMiddleware (Phase 2b landed pre-deploy), and `frontend/src/utils/api.ts:1` still does `API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''`. Deploy sequence hazard: if user runs `npm run build` with this .env.production unchanged, production bundle will bake `API_BASE=https://k-line-backend-...run.app` and all 6 `${API_BASE}/api/...` call sites (AppPage.tsx:145 history-info, BusinessLogicPage.tsx:23/59 business-logic/auth, usePrediction.ts:29/116 predict/merge-and-compute-ma99) become cross-origin requests to Cloud Run → CORSMiddleware is gone → preflight OPTIONS fails → **APIs break in production**. The architect brief §16 risk 6 acknowledged `.env.production.example` VITE_API_BASE_URL retirement as "safer zero-diff" but did not flag the deploy-day coordination hazard in the already-materialized local .env.production. No runtime guard in `validate-env.mjs` warns the user at build time (only `VITE_GA_MEASUREMENT_ID` is checked). AC-049-DEPLOY-ORDER-1 step 4 is deploy-time-verified, not build-time-guarded. Not a code defect in the K-049 branch (gitignored file is user state), but PM needs to surface to user BEFORE the Phase 2 deploy runs — recommend user manually empties `frontend/.env.production` line 1 (or deletes the VITE_API_BASE_URL line) before `npm run build`, OR extends `validate-env.mjs` with a Phase 2b-soak-aware advisory (not block) that warns when `VITE_API_BASE_URL` is set post-CORS-removal. Recommend accept-as-is within code review and escalate to PM as deploy-op coordination item. (N-1) **AC-022-ROLE-GRID-HEIGHT at about-v2.spec.ts:324-333 has `evaluateAll` without prior `toHaveCount` / `waitFor attached` gate under React.lazy boundary**: test ran green in this review (serial mode, 437ms), but the pattern is structurally identical to what Engineer's retro identified as the T1 lazy-race in about-layout.spec.ts. The sibling test at line 340-341 has `expect(cards).toHaveCount(6)` BEFORE `evaluateAll` which provides auto-wait. Line 324 variant is passing today because Vite dev-server chunk fetch is sub-ms on localhost, but under higher CI latency or real prod deploy + Playwright-against-deployed-bundle (if ever configured), this has the same latent race Engineer fixed in about-layout. Not blocking — empirically green — but worth Engineer dropping a one-line `await expect(cards).toHaveCount(6)` before line 327 for symmetry with line 341. TD candidate. (N-2) **AC-049 test anchors not tagged in E2E spec comments**: of the 10 AC in ticket §Acceptance Criteria, only AC-049-SUSPENSE-1 + AC-049-GA-LAZY-1 are explicitly referenced in spec comments (ga-spa-pageview.spec.ts lines 80, 126). AC-049-PROBE-1 / AC-049-PWA-1 / AC-049-BODONI-1 / AC-049-ROBOTS-1 / AC-049-SITEMAP-1 / AC-049-CSP-REPORT-1 / AC-049-DEPLOY-ORDER-1 / AC-049-DEPLOY-ENVGUARD-1 / AC-049-CACHE-1 are ALL deploy-time curl-probe ACs by PM design (per AC text "When curl -sI https://k-line-prediction-app.web.app/..." / Lighthouse audit / `curl -H` probes). Per architect §15 and engineer retro, these 8 ACs are verified via post-deploy smoke test, not Playwright E2E. That is correct ticket scoping — but the E2E spec suite has no anchor mapping the contract. QA post-deploy sign-off will be carrying a verbal anchor-less ticket/curl-cookbook. Recommend Engineer add a stub `tests/smoke/K-049-deploy-probes.sh` (or inline into a Playwright test.describe skip-by-default block) that enumerates the 8 curl probe commands verbatim with AC-049-* label per block; turns deploy-day checks into git-committed artifact. TD candidate. Not blocking Phase 3 code merge.

**Next time improvement:** when a multi-Phase ticket ships runtime code changes whose correctness depends on deploy-time environment-variable state (Phase 2b CORS removal + .env.production gitignored variable), Reviewer Step 2 MUST add a "deploy-time variable coordination hazard" sub-check: (a) grep `frontend/.gitignore` for `.env*` entries; (b) for each runtime env-var removed from backend validation / middleware, grep frontend source to find its consumers; (c) if consumers still reference the env var with fallback (`?? ''`) and the env file is gitignored, FLAG as Important deploy-ordering finding and request PM to enumerate pre-deploy user-action checklist. This is adjacent to `feedback_reviewer_git_status_gate.md` (which catches uncommitted runtime files) — the new sibling gate catches "committed code depends on uncommitted local env that user must adjust before deploy." Codify as `feedback_reviewer_deploy_env_coordination_hazard.md` and Edit into `~/.claude/agents/reviewer.md` §Review Checklist as new subsection "Deploy-Time Environment-Variable Coordination Gate."

## 2026-04-24 — K-046 Phase 2b (UI restructure + fixture refresh + parseOfficialCsvFile export; CODE-PASS, 0 Critical / 0 Warning / 1 Note)

**What went well:** Architect §10 pre-design dry-run truth tables transcribed OLD/NEW state for every AC line-by-line against `git show 4c873b3:AppPage.tsx` — Reviewer Step 2 only had to re-run the identical grep commands and confirm the deltas; no Behavior-Diff surprises. Handler-removal raw count dropped 19 → 0 cleanly (§3 REMOVE ruling honored verbatim — no residual `handleHistoryUpload` / `lastHistoryUpload` / `uploadError` / `uploadLoading` / `上傳中` / `Upload History CSV` tokens). Engineer's self-diff caught the Phase 1 `646` byte-count hard-code in `test_main.py:262` as unavoidable cross-file co-evolution and fixed it inline (not an AC change, just the fixture's co-evolving expected size) — documented clearly in the retro as the next-time improvement to pre-impl grep constants across `backend/` + `frontend/`. K-046 Phase 2 Playwright suite 8/8 green first run (T1-T8), full pytest 70/70 green, Sacred K-009/K-013 untouched. Design-exemptions.md §1 `/app` K-030 row made Pencil-parity gate correctly bypassed without Architect overreach. The B4 methodology codification (parse-layer test not endpoint-layer) shows its value immediately — Engineer ran the fail-if-gate-removed dry-run by truncating the fixture to 10 rows and confirming Vitest turns red, proving monitoring power (not a K-025 degenerate `pre=0` proxy).

**What went wrong:** `data-testid="official-input-section"` at AppPage.tsx:356 is allocated in design doc §5 but unreferenced by any current Playwright case (T3/T8 anchor on the nested `official-input-expected-format` instead). Surfaced as N-1 non-blocking. Design doc §5 could have marked `official-input-section` as "reserved for future K-048 re-enablement structural tests" to pre-empt Reviewer Q on scaffolding purpose; as written it read as "consumer = AC §1.3 case A ancestor chain" which turned out to not be the ancestor the Engineer ultimately scoped to (more specific container won). Also minor: initial Playwright run hit port 4173 collision from a prior session — unrelated to K-046, but Reviewer depth flow lost ~1 min on `lsof -ti:4173 | xargs kill`.

**Next time improvement:** When Architect design doc allocates testids in a table (§5-style), add a "Consumer spec / line" column — verify during self-diff that every row has a real consumer in the same commit, OR mark "reserved for K-XXX future use" explicitly. This prevents unused-testid notes accumulating without governance. Action: Edit `~/.claude/agents/senior-architect.md` testid section to require this column. Second improvement (local Reviewer habit): before running Playwright in worktree sessions, `lsof -ti:<port>` pre-flight if prior K-* worktree sessions may have left dev/preview servers; saves the 4-line false-positive debugging path.

## 2026-04-24 — K-046 (comment out upload DB write + example CSV download)

**What went well:** Architect's §1.3 truth-table (6 cases × 11 columns) made the Behavior Diff table trivially transcribable at Reviewer Step 2 — just verified each row against the OLD git show and NEW code. The reversibility guard test (AC-046-QA-2) genuinely has 5 independent failing dimensions (added_count / bar_count / mtime / len / id), not a degenerate tautology. Engineer's `added_count_local` rename with `noqa: F841` preserves K-048 revert intent legibly.

**What went wrong:** First Playwright run showed 2 failures (T2 content-length 1408 instead of 646, T1 flake-adjacent) — initially concerning, but second run was 3/3 in 2.0s, confirming Vite dev-server cold-start gzip-encoding quirk, not K-046 regression. The spec's conditional content-length assertion (only check header if present, body length is primary) is the right defense.

**Next time improvement:** when reviewing a ticket with Playwright asset-fetch assertions against Vite dev-server static files, run the spec twice — first run may show Vite cold-start Content-Length header drift from chunked/gzip; stable value only appears on warm cache. Codify as Reviewer depth-gate: "Playwright asset-fetch regression → 2 consecutive passes required before MERGE verdict." This prevents false-positive Critical findings on infra flake.


## 2026-04-24 — K-045 (/about desktop layout consistency — Step 2 depth review; CODE-PASS, 0 Critical / 1 Warning / 2 Nit)

**What went well:** OLD vs NEW behavior-diff truth table built from `git show ef3519d:*` produced a full accounting — every OLD≠NEW cell mapped to either a K-045 AC (width 1024→1248, padding 24→96 desktop, gap 128→72) or a Pencil SSOT target (Y80Iv [72,96,96,96] gap:72, b6TgM no maxWidth cap). Zero unaccounted divergence. Pattern A compliance verified independently: ran `about-v2.spec.ts:441` K-031 adjacency spec live, confirmed `nextElementSibling='footer'` post-refactor — the design's Option C per-section root-child tree survives the Sacred that would have broken under a naïve body-wrapper mirror of HomePage.tsx. Widened token-retire sweep (4 sub-scans: SectionContainer / max-w-{3,5}xl / py-{16,20} / docs) returned 0 runtime residues — Engineer retirement was clean. Footer pairwise T19 Δ=0 identified as structural invariant, not fixture coincidence (root-child pattern makes Footer.width = viewport.width); noted inline so future readers don't loosen the tolerance.

**What went wrong:** Mobile hero non-overlap assertion T8 is weaker than the AC intent — asserts `tgBox.y >= h1.bottom - 1` (non-negative gap) but doesn't pin a minimum separation; a future regression that collapses role-line + divider + tagline to 0 gap would still PASS. Surfaced as W-1 with accept-as-is recommendation (desktop T5-T7 cover primary rhythm; mobile has no Pencil SOT; cost/value doesn't justify tightening). T8 was AC-literal-compliant at Engineer time — gap is upstream at PM AC wording "no overlap, no negative gap" literally. Also noted N-1 `.first()` implicit coupling on section-label locator (low future fragility if a second label enters a section) and N-2 T19 invariant provenance missing inline comment (Engineer retrospective flagged this but spec-header annotation wasn't added).

**Next time improvement:** when AC says "no X, no negative Y" for visual rhythm (non-overlap, gap-below-threshold), Reviewer should verify the spec's fail-if-regressed direction with a concrete counter-example — specifically: for each hero/rhythm AC that uses `>=` / `<=` bounds, construct the degenerate case (all elements collapse to same y) and check whether the spec would still pass. If yes → recommend PM tighten AC wording to include a positive minimum (e.g., "tagline top ≥ h1 bottom + 18 at mobile"). Codify this as a Reviewer checklist sub-item under Track A spec logic self-check (§`feedback_engineer_e2e_spec_logic_selfcheck.md` extension: "degenerate-collapse dry-run for non-overlap assertions"). Will Edit into `~/.claude/agents/reviewer.md` §AC alignment checklist as "For every `>=` / `<=` boundary assertion, verify degenerate-collapse case FAILS the assertion — otherwise escalate as Warning with tighter-bound suggestion."

## 2026-04-24 — K-041 (diary rail/marker mobileVisible shared-prop unification)

**What went well:** Pure-refactor behavior-diff gate fired cleanly — OLD (c6c1aa2) vs NEW (0955813) 12-attribute Homepage DOM equivalence verified in one pass; K-023 (borderRadius=0) + K-028 (top:8 + mobile always-visible) Sacred props traceable end-to-end from DevDiarySection explicit prop pass → DiaryMarker/Rail default overrides → DOM. Spec flip completeness grep returned 4 hits all in flipped T-C6 (zero residual display:none). Sacred assertion tests (pages.spec.ts borderRadius=0, boundingBox 20x14, rail toBeVisible) still guard.

**What went wrong:** K-028 Sacred "Homepage mobile rail always-visible" has no direct <640px viewport assertion — only Homepage desktop (pages.spec.ts default viewport) tested rail visibility. K-041 preserves K-028 behavior via mobileVisible prop but a silent regression (e.g., default flip + missing Homepage prop) would pass the current suite. Not a K-041 introduction — pre-existing test gap surfaced by depth review. Flagged as TD-K041-03.

**Next time improvement:** when reviewing Sacred-preservation refactors, cross-check each Sacred invariant against **viewport-specific** test coverage (not just "a test with same testid exists"). Add to reviewer.md checklist: for every Sacred mobile-behavior invariant in the cross-check table, grep e2e/ for  with the testid — missing viewport-specific assertion is a gap to surface as tech-debt even if not regression-introducing.

## 2026-04-24 — K-039 Phase 1 (split SSOT ROLES extraction + README/protocols markers — Step 2 depth review; CODE-PASS, commit pending per PM instruction)

**What went well:** Step 2 depth gates fired clean on 8 of 8 axes, with every gate deriving verifiable evidence before ruling (no narrative-only acceptance). Behavior Diff verified byte-identical 6-entry × 4-field table between HEAD~1 inline `ROLES` and new `roles.ts` module (per `feedback_reviewer_pure_refactor_behavior_diff.md`). Pencil parity gate: all 13 text nodes in Pencil frame 8mqwX (r1..r6 role/owns/artefact + s3Intro) match TSX verbatim; no JSON file touched in Phase 1 diff. AC-039-P1-NO-OTHER-CONTENT-TOUCHED grep (PM-patched anchored form) raw-count sanity: pre=0 at HEAD~1 across 3 candidate files, post=2 at HEAD (README.md + docs/ai-collab-protocols.md) — monitoring power non-trivial, passes `feedback_refactor_ac_grep_raw_count_sanity.md` gate. Token-retire widened grep (`redactArtefact`) found zero residue in runtime code (only 1 JSDoc historical note in RoleCard.tsx, all other hits in ticket/design/retro docs — correct scope). Playwright: new spec 4/4 PASS at review time; about.spec + about-v2.spec 71 passed / 1 skipped (0 failed) — zero regression on pre-existing RoleCard assertions (AC-022-ROLE-GRID-HEIGHT, AC-034-P2-FILENOBAR-VARIANTS RoleCard 01..06, AC-034-P2-DRIFT-D26-SUBTITLE-VERBATIM S3). E2E spec logic self-check: correct scope (file I/O, no `page`), fail direction demonstrable (Engineer §8 dogfood evidence), no hardcoded sleeps. tsc exit 0 at review time.

**What went wrong:** nothing in this review — but two items worth logging as process-level observations (not defects): (1) AC-039-P1-EXTRACT-ROLES-MODULE originally listed `redactArtefact` field when HEAD TSX (post-K-034 Phase 2 rebase) already had `fileNo`; PM patched AC wording same session. Gap is upstream: PM rebase onto c6c1aa2 happened after AC was written, so AC text lagged HEAD. Next time, PM should re-read §AC after rebase to detect shape drift before Engineer dispatch. (2) AC-039-P1-NO-OTHER-CONTENT-TOUCHED original grep pattern (`grep -rn "ROLES:start" . == 2`) was literally unsatisfiable because prose references in ticket + string-literal in spec also match; PM patched to anchored `grep -rlE "^<!-- ROLES:(start|end) -->$"` form same session. Both patches recorded inline in ticket §5 with "PM patch 2026-04-24" annotation — audit trail preserved. Neither defect reached commit; PM silent-auto-mode rulings caught both pre-review.

**Next time improvement:** add "post-rebase AC re-read" as an explicit PM Session Handoff Verification sub-step — when PM rebases a ticket's worktree onto a new base, re-grep the ticket AC section for field names / file shapes against the new HEAD and update AC wording before Engineer dispatch. This is a sharper version of the already-codified `feedback_pm_ac_sacred_cross_check.md` (which checks Sacred invariants across tickets). New rule targets same-ticket AC-vs-HEAD drift after base shift. Codified: will be Edited into `~/.claude/agents/pm.md` §Session Handoff Verification as hard step "post-rebase AC shape sweep" (per `feedback_retrospective_codify_behavior.md` — retrospective log does not replace persona edit).

## 2026-04-23 — K-040 (sitewide UI polish batch — Step 2 depth review; 3 Warnings, 0 Critical)

**What went well:**
1. Raw-count monitor table (K-025 W-1 gate) caught the pre=1 degenerate-proxy edge case for `"Bodoni Moda"` string literal grep, properly documented as borderline with adjacent gates covering.
2. Pencil parity spot-check on `homepage-v2.frame-4CsvQ.json` vs `HeroSection.tsx` verified 4 font-token fields match node-by-node (size/weight/letterSpacing/color) — confirmed gate works for mono-token migration tickets.
3. Commit-scope verification on 338e670 (scoped snapshot regen) — `git show --stat` returned exactly 1 PNG, confirming Engineer obeyed BQ-040-SNAPSHOT Option A scope.
4. Sacred AC-034-P1-ROUTE-DOM-PARITY verified independently: T1 byte-identity assertion intact + all 4 per-route baselines present + Footer.tsx unchanged.

**What went wrong:**
1. Design doc + ticket §1 contain a path-pointer mismatch (typo directory `frontend/src/utils/` under filename `timelinePrimitives.ts` vs actual `frontend/src/components/diary/timelinePrimitives.ts`). Architect §9 self-diff was supposed to catch this but verified row counts only, not path strings. This should have been caught at Architect stage.
2. `valueFont: 'italic' | 'mono'` prop enum in ArchPillarBlock survived AC-040 italic-retire because design doc §3 File Change Manifest enumerated class-level strips only, not prop-name / JSDoc descriptor sweeps. Pre-Design Audit §6 didn't audit prop enums. This is a structural design-doc gap for "token retire" refactors.
3. JSDoc comment sweep missed — 14+ `/about` component JSDoc headers still describe Bodoni Moda / Newsreader voice. Not a code-level issue, but Pencil-SSOT documentation pointers that now mislead future readers. No existing Reviewer gate forced a JSDoc grep for retired tokens.

**Next time improvement:**
For any "token retire" refactor ticket (font/color/spacing token deletion), Reviewer Step 2 MUST add a widened grep scan beyond class names — include:
- Prop enum values referencing the retired term (`valueFont: 'italic'`, `fontWeight: 'bold'`, etc.)
- JSDoc headers mentioning the retired term outside `// K-NNN retired` context comments
- Design doc + ticket path pointer cross-check (path strings must Read-verify, not just grep-verify)

Flag any unscoped hit as Warning. Architect pre-design audit should include a "prop-name + JSDoc + path-pointer audit" row alongside the existing file grep rows. Codified as hard checklist item in reviewer.md §Review Checklist.

---

## 2026-04-23 — K-034 Phase 2 (/about audit — Step 2 depth review; 3 Critical + 4 Important surfaced)

**What went well:** Step 2 depth gates fired as designed on 4 of 5 axes:
1. **Pencil parity gate** (codified K-034 Phase 1) caught C-1 — PillarCard `<code>` span editorial divergence vs Pencil `UXy2o.p1Body` plain text, not in `design-exemptions.md`. Breadth review flagged as I-1 Important; depth persona rule correctly upgraded to Critical block-merge.
2. **Git status commit-block gate** (codified K-037 F-N2) caught C-3 — `frontend/route-sanity.mjs` untracked runtime-scope file. Breadth review flagged as M-4; depth gate correctly classifies as commit-block.
3. **AC ↔ test mapping cross-check** caught I-1 — FileNoBar contract tests cover 1 of 5 consumers (only PROTOCOL variant asserted, zero coverage for PERSONNEL / CASE FILE / BACKBONE / DISCIPLINE / ASSURANCE / bare FILE Nº). Breadth review did not flag this; depth-review-only find. Matches persona §Contract tests gate.
4. **Design doc authoritative-spec cross-check** caught I-2 — `FileNoBarProps.label` downgraded required → optional without PM BQ (§6.2 explicit rule "Engineer must not extend without PM BQ"). Depth-review-only find.

**What went wrong:**
1. C-2 (Footer snapshot baseline regen vs PM ruling) was the highest-stakes finding but required me to cross-reference THREE documents to detect: (a) ticket §4.7 BQ-034-P2-ENG-01 ruling Option A only, (b) AC-034-P2-SNAPSHOT-POLICY's "§Reviewer ruling log" requirement, (c) Engineer retrospective admission "/about 跨 tolerance 改走 baseline regen". No existing Reviewer gate treats "PM BQ ruling contradiction" as a first-class category — it was caught only because I happened to read the engineer.md retrospective cross-referencing the PM BQ. A weaker review might have let it through under "snapshot changed + tolerance added = normal Phase 2 hygiene". This is a new structural gap: existing gates verify Pencil ↔ code, AC ↔ test, design-doc ↔ implementation, but there is no `PM-BQ-ruling ↔ implementation` gate.
2. Depth review of I-3 (section subtitle Pencil-exact assertions missing for 2 of 3 sections) required running `grep -n "Each role a separate\|Anatomy of a ticket" frontend/e2e/*.spec.ts` and seeing zero hits — a specific cross-reference that came from reading AC-034-P2-DRIFT-D26-D27 verbatim. If ticket had not itemized the 3 literal strings, I would have missed it. Reveals fragility: depth review quality is bounded by AC literal-string specificity.
3. Design-exemptions.md §2 has only 3 rows (all Footer-related from K-034 Phase 1). C-1 PillarCard `<code>` span might reasonably qualify for a new `EDITORIAL` category, but the exemption governance document does NOT enumerate `EDITORIAL` as a valid category (only REGULATORY / RESPONSIVE / INHERITED). This forces me to flag Critical even when PM might legitimately approve an exemption — friction in the Reviewer-PM handoff.

**Next time improvement:**
1. **New Reviewer hard gate codified — `§PM BQ Ruling Compliance Cross-Check`:** for any ticket with PM BQ rulings (§4.x PM Rulings on … Blockers sections), Reviewer must enumerate each BQ's ruled option and grep the implementation for matching/contradicting change. Any ruling marked "Option A" with code evidence of Option B also applied → Critical block-merge. Will Edit into `~/.claude/agents/reviewer.md` §Review Checklist as new subsection, and write to memory as `feedback_reviewer_pm_bq_compliance_gate.md`.
2. **Design-exemptions.md category expansion:** propose PM add `EDITORIAL` as a 4th category to §2 (covering Pencil-plain-text → inline markup enhancements like `<code>`, `<strong>`, `<em>`). Short rationale: "readability / markup improvements that preserve text content verbatim". Without this category, Reviewer is forced to flag Critical on cosmetic markup divergence where PM might legitimately approve.
3. **Contract test gate expansion:** AC-level "N independent Playwright assertions" clauses should be enumerated in depth review as a mandatory AC ↔ test count table (e.g. "AC-034-P2-DRIFT-D2 requires 4 metric card assertions; actual count: 4 title + 3 subtext = 7 content assertions; FileNoBar label assertions: 0"). Will add to reviewer.md §AC count vs implementation count cross-check sub-bullet.

---

## 2026-04-23 — K-037 Favicon wiring (Step 1 breadth + Step 2 depth two-layer pattern; F-N2 git-status gate codified)

**What went well:** Step 1 superpowers breadth scan + Step 2 `~/.claude/agents/reviewer.md` depth pass executed cleanly on the two-layer model. Step 1 emitted 0 Critical / 0 Important / 6 Minor (M-1 through M-6) — all 6 legitimately sub-threshold for fix-now, correctly deferred as accept-as-is (M-1/M-2/M-3 are Step 1 content observations with no defect), local-iteration ergonomic (M-4/M-5 Playwright project-split pattern acceptable), or PM-close-time action (M-6 Deploy Record TBD). Step 2 depth pass produced CODE-PASS on code quality (no Fix-now / no Tech-Debt findings on code itself) — the `index.html` 6-link-tag block, `manifest.json` 7-field schema, and `favicon-assets.spec.ts` 10-test-case Playwright spec all mapped 1:1 to AC-037-LINK-TAGS-PRESENT / AC-037-ASSETS-200-OK / AC-037-MANIFEST-VALID / AC-037-MANIFEST-MIME-ACCEPTABLE AC text verbatim, MIME normalization logic (`.toLowerCase()` + `.replace(/;\s*/g, '; ')`) correctly handles Vite's `application/json; charset=utf-8` vs Firebase's potential `application/json;charset=UTF-8` drift, and the `vite preview` webServer additive-project pattern correctly isolates the favicon spec from the other 256 green dev-server specs (no blast radius).

**What went wrong:** Step 1 breadth scan emitted "APPROVED FOR MERGE" while `git status --short` showed 2 modified runtime files (`frontend/index.html`, `frontend/playwright.config.ts`) + 3 untracked runtime files (`frontend/public/manifest.json`, `frontend/e2e/favicon-assets.spec.ts`) + `frontend/public/diary.json` (modified) — i.e. the branch was NOT actually merge-ready; a merge would have fast-forwarded to a commit without the reviewed changes. Step 2 caught this as process finding F-N2 (Important, gate-mechanical rather than code-quality). Existing `reviewer.md` Review Checklist had zero item covering "runtime file commit state" — the Git Status Commit-Block Gate did not exist prior to this ticket. Both Step 1 and Step 2 historically focused on code content and AC / design-doc alignment, not on the mechanical precondition that branch state must be clean before PASS. Pencil-parity gate (K-034), raw-count-sanity gate (K-025), structural-chrome-duplication gate (K-035), pure-refactor behavior-diff gate (K-013) — all address code-content correctness axes; none address the commit-state axis. F-N2 is a structurally new class of finding that the existing gates could not have caught.

**Next time improvement:**
1. **New Reviewer hard gate codified — `§Git Status Commit-Block Gate`:** before any PASS / APPROVED verdict (Step 1 or Step 2), Reviewer must run `git status --short` and inspect runtime-path scope (`frontend/src/**`, `frontend/e2e/**`, `frontend/public/**`, `frontend/index.html`, `*.config.ts`, `backend/**`). Any `M` or `??` in that scope → verdict downgraded to **`CODE-PASS, COMMIT-BLOCKED`** with explicit uncommitted-file list. Doc-only / persona / retrospective `.md` files do not trigger the block. Edited into `~/.claude/agents/reviewer.md` §General as a new subsection.
2. **Codified to memory:** `feedback_reviewer_git_status_gate.md` with frontmatter + rule text + Why + How to apply + rollback criterion (false-positive rate on doc-only tickets → widen scope exclusions; false-negative on runtime file missed → tighten scope).
3. **Delta from existing K-series Reviewer gates:** K-013 / K-025 / K-034 / K-035 gates catch code-content divergence against various source-of-truth contracts (OLD code / AC grep raw-count / Pencil frame JSON / shared-chrome inventory). K-037 F-N2 gate catches branch-state divergence against the commit log — a structurally different correctness axis. No prior gate subsumes it; no future code-content gate will subsume it.

---

## 2026-04-23 — K-034 Phase 1 (Pencil parity gate first real use)

**做得好：** Pencil parity gate（Phase 0 codified `feedback_reviewer_pencil_parity_gate.md` + `reviewer.md §Review Checklist` new subsection）在首次實戰即按設計運作。Step 2 depth review 逐節點比對 `frontend/design/specs/homepage-v2.frame-86psQ.json` + `frame-1BGtd.json` vs 當前 working-tree `Footer.tsx`，產出 13 行屬性對照表（children count、content、fontFamily、fontSize、fontWeight、fill、letterSpacing、padding、alignItems、justifyContent、stroke thickness、stroke fill）。10 分鐘內 surface 3 個真結構 divergence：GA disclosure `<p>` 節點（Critical C1）、mobile padding deviation (W1)、HomePage 容器 ancestor padding 導致跨路由 visual width delta (W3)。superpowers Step 1 breadth scan 與 Engineer 自驗都未察覺這三項。gate 工作如設計。

**沒做好：** reviewer.md persona 對 Pencil parity divergence 的分類是「not in design-exemptions.md → Critical block merge」— 正確但過度一刀切。實際遇到的 C1（GA disclosure）與 W1（mobile padding）屬「可由 PM 分類宣告為 exempt 的合法 divergence」類，不是「Engineer 隨意加料」。當前 persona 沒有 sub-category 區分，所有 divergence 一律 Critical，會導致 PM 每次都必須動 design-exemptions.md 才能放行。這不是 bug 但流程負擔偏高。另一個小問題：設計文件 §8 Sacred cross-check 漏列 K-031 AC-031-LAYOUT-CONTINUITY + AC-018-PRIVACY-POLICY vs Pencil 的衝突，Reviewer 只能被動 surface，無法主動 force Architect 早期補齊。

**下次改善：**
1. **reviewer.md §Pencil Parity Cross-Check 條款加 category 判別子步：** 節點差異發現後先分類 REGULATORY / RESPONSIVE / INHERITED / UNKNOWN；前三類若未入 `design-exemptions.md` §2 則起 Warning（而非 Critical）並列 remediation path「PM 當場裁決加 §2 列」；僅 UNKNOWN 類（無法分類、無合理設計意圖）起 Critical。編入 reviewer.md §Review Checklist 作為 Pencil parity gate 流程細則。
2. **新增 Reviewer 預掃步：** Step 2 開始前先 `grep -n "AC-" docs/designs/<ticket>.md | grep -iE "sacred|cross-check"` cross-ref `docs/tickets/K-0<N>-*.md` 所有 K-XXX 前綴 Sacred 清單，未列入 design doc §8 Sacred table 的 Sacred 回報給 PM 作 "design doc coverage gap" finding。這補足 Architect 端的 §8 完整度問題，讓 Reviewer 不只被動捕捉。
3. **Sacred-vs-Pencil AC conflict 升級 BQ：** 當一 component 同時受 Sacred AC 與 Pencil SSOT 約束且兩者對同節點有不同斷言（AC-018-PRIVACY-POLICY 要求 GA disclosure 文字顯示 vs Pencil frame `children.length = 1`），Reviewer 不得自行擇一，必列為 BQ-escalate-to-PM per `feedback_pm_ac_pen_conflict_escalate`，即使 design doc 在 AC 層已 implicitly 解決（如 K-034 Phase 1 設計 doc §2.2 NEW column 已含 GA disclosure）。根因是設計 doc 的「implicit resolution」在 Reviewer 視角看不到完整的 AC-vs-Pencil 衝突矩陣，必須外顯為 BQ 才能 audit trail。編入 reviewer.md §Review Checklist。

---

## 2026-04-23 — K-034 Phase 0 (BFP Round 2 for K-035 α-premise failure)

**What went wrong:** K-035 Step 2 depth review cross-checked shared Footer DOM equivalence modulo the declared `variant` prop axis (home vs about), producing a 17-row byte-by-byte table that Reviewer independently verified against `git show bdc9231:…` OLD sources. That table was internally consistent — but the **axis of declared divergence itself (variant=home vs variant=about) was never cross-checked against Pencil SSOT**. Reviewer accepted Architect's §0 BQ-035-01 scoring matrix ("Pencil fidelity α=10/10, both frames 4CsvQ + 35VCj render their own designs") on its own narrative terms without independently invoking `batch_get` on the two frames or demanding Pencil-source evidence block inline in design doc. Existing Reviewer persona gates — Pure-Refactor Behavior Diff (K-013), AC alignment, field mapping, K-025 grep-pattern raw-count sanity, K-035 structural-chrome-duplication scan, contract tests — all assume the design doc's statement of what differs is true; none require "every code-level branch/variant must be backed by divergent Pencil frames". Post-deploy 2026-04-23 main-session `batch_get` on 86psQ + 1BGtd revealed both frames contain the identical text node `yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn` Geist Mono 11px. Pencil SSOT has ONE footer design, not two; the entire `variant="about"` CTA branch had zero Pencil backing. Reviewer is explicitly designed to catch structural issues beyond AC literal text — variant-without-Pencil-divergence is exactly that class of issue, and reviewer.md had no gate for it.

**Next time improvement:**
1. **New Reviewer Step 2 hard gate — "Pencil-Parity Sub-Step" (K-034 Phase 0 codify):** any ticket with `visual-delta: yes` frontmatter OR any code-level `variant` / branch / `if (variant === …)` / switch-on-prop construct in shared components triggers this gate. Reviewer MUST (a) read the design doc's embedded Pencil JSON snapshot block (required by new Designer `.pen`-JSON-sync gate); (b) read the full-frame JSON dump at `frontend/design/specs/<page>.frame-<id>.json` for every frame referenced in design doc frontmatter; (c) grep implementation for every variant/branch introduced or preserved in this ticket; (d) map each code-level variant 1-to-1 to a Pencil frame divergence (content / fontFamily / fontSize / layout-direction / color / spacing property differs across two JSON dumps). Any code variant without a corresponding documented Pencil divergence = **Critical, block merge**. Accept `batch_get` output pasted in design doc as evidence only if Designer ran it post-`.pen` Edit (verify via `last-verified` line in JSON snapshot block). Architect scoring matrices claiming "Pencil fidelity X/10" rejected unless inline evidence block present — Reviewer does not accept narrative as substitute for `batch_get` output.
2. **Codify to** `feedback_reviewer_pencil_parity_gate.md` (Q4a Reviewer hard-gate cell) + Edit `~/.claude/agents/reviewer.md` §Review Checklist as new subsection "Pencil Parity Cross-Check" with the 4-step procedure above; both as hard gates not descriptions per `feedback_rule_strength_tiers.md`.
3. **Delta from K-035 Structural Chrome Duplication Scan:** that gate catches "new page duplicates existing shared chrome" (forward-direction architectural smell); Pencil-Parity gate catches "shared chrome declares variants that Pencil doesn't actually diverge on" (reverse-direction SSOT violation). Both directions needed; neither subsumes the other.

---

## 2026-04-22 — K-035 Phase 3 shared Footer migration (Step 2 depth review)

**做得好：** Pure-Refactor Behavior Diff Gate 按 `feedback_reviewer_pure_refactor_behavior_diff.md` + K-013 規則逐行執行 — `git show bdc9231:frontend/src/components/home/HomeFooterBar.tsx` 與 `FooterCtaSection.tsx` 讀 OLD 後列 17-row byte-by-byte equivalence table，確認 `shared/Footer.tsx` L30-L37（home branch）與 L43-L87（about branch）為逐字節複製，零 class / attribute / text drift；設計稿 §3.3 「17 equivalent / 0 divergent」斷言 Reviewer 獨立驗證而非接受 Architect 敘事。K-025 Grep-Pattern Raw-Count Sanity gate 雙向驗證：pre-K-035 `git grep -c "HomeFooterBar\|FooterCtaSection" bdc9231 -- frontend/` 回 39 hits 跨 10 files，post-K-035 為 0 hits — 證明 Step 6 grep sweep 並非 degenerate proxy（pre==0==post）。QA Early Consultation 3 flags 全數對照 commit body 逐條 close：Flag 1 看 ga-tracking.spec.ts AC-018-CLICK 3 個 data-testid 仍指向 /about + Playwright 3/3 green；Flag 2 看 Step 6 commit message 7-line 明文記錄為何排除 `docs/audits/`；Flag 3 看 Step 7 commit body 含精確 Playwright timeout error 字串（`Timed out 5000ms waiting for expect(locator('footer').last()).toBeVisible()`），不接受含糊 "failed as expected"。Sacred 守護用 7-row 表把 K-017 / K-022 A-7 / K-024 / K-030 / K-018 對應 spec 檔案 + 行號逐條列出。架構文件 self-diff 以設計稿 §11.1 / §11.2 / §11.3 為 source-of-truth 逐 cell 驗證（Footer 表 5 rows ✓、Shared Components 表 2 rows ✓、Directory Structure shared/ block ✓）。

**沒做好：** 本輪沒有 Critical / Warning 級 finding，但有 2 Minor drift 項（M-1 architecture.md L653 Architect 設計期「4 cases」與 L652 Engineer landing「3 cases」並存；M-2 architect/designer/pm/qa 其他 retros 仍 unstaged）— Engineer 自己的 retro 已 codify 為 Pre-Step-0 Architect Changelog cross-check rule，屬下游 catch，不屬於 Reviewer 首攔的早期階段問題。實質上 Reviewer 深度 review 在 Step 11 commit 已可見 Engineer 補正 Architect drift（L652 取代 L653）— Reviewer 無可早攔。

**下次改善：** 
1. 當設計稿含 design-phase Changelog（例如 architecture.md Architect 先寫入「預期 N cases」）時，Reviewer 深度 review 應主動 grep `architecture.md` 本 ticket ID 條目，對照 Engineer landing 實際值（例如 `grep -n "cases" architecture.md` + 比對 spec 檔 `test(` 實際 count），提前一輪發現「設計期宣稱 vs 實際落地」數字 drift，不等 Engineer 自查。這是對既有 K-025 raw-count sanity gate 的延伸 — 設計文件也是 grep-proxy 的一種 source-of-truth。此改善 codify 為 reviewer.md §Plan Alignment 新子條「架構文件 Changelog 設計期預期 vs landing 實際值 cross-check」。
2. 確認「其他角色 retro 未 stage」屬合理分工（每角色 commit 自己的）還是 leak — 本次 M-2 判斷為前者，無需 escalation，但若未來出現 agent retro 遲遲未 commit 而導致 ticket close 後 diary/retrospective 斷層，應早期 PM 主動追蹤。Reviewer 側職責僅 surface，不主動 push 其他 role。

---

## 2026-04-22 — K-035 Bug Found Protocol (Reviewer)

**做得好（具體事件限定）：** 無。K-017（2026-04-19）與 K-022（2026-04-20）兩輪 Step 2 depth review 皆未攔截 `frontend/src/components/about/FooterCtaSection.tsx` 這個 inline footer duplicate，且 retrospective 全無提及 `/` 與 `/diary` 已有 `HomeFooterBar.tsx` 可重用。reviewer.md 現有 Review Checklist 針對 shared-component placement 的 `architecture.md` 表格 cross-check 規則是在 K-021 Round 2（2026-04-20）才落地，當時 K-017 已 closed；K-022 在該規則落地後 review，仍未觸發檢查，因為 K-022 的改動 scope 被 Architect 限縮為「結構細節對齊」，未列 Footer 為改動對象 → Reviewer 在 §Plan Alignment 執行「out-of-scope 改動偵測」反向邏輯（只驗有無越界改未列檔），未執行正向邏輯（本頁該用 shared component 卻重造）。

**沒做好（根因 — Reviewer 本該在 Step 2 就攔下）：** reviewer.md §Review Checklist 現行條目：AC alignment、設計文件 spec 清單 vs 實作檔名、架構文件放置表、AC count vs impl count、Pure-Refactor Behavior Diff、Test vs Production 一致性、Python/FastAPI、React/TypeScript、Frontend Build Integrity，**無任何一條掃「頁面級 JSX 是否重造已存在的 shared structural chrome（footer / nav / hero）」**。K-017 當時 Reviewer 看到 `FooterCtaSection.tsx` 新增檔案，對照 AC 斷言「頁面底部顯示 CTA + footer 文案」全通過，未回頭問「為什麼不是 import `HomeFooterBar`」。K-022 Reviewer 在 reviewer.md 已補 shared-component placement 表 cross-check 硬 gate，但該 gate 的觸發條件是「shared component 改動」，K-022 改的是 About 內部 section 層級不是 Footer 本體，依規則未觸發 → 規則 scope 漏掉「新頁面 / 大範圍頁面改寫時反向掃既有 shared 是否被重造」這個正向 case。此屬 architectural smell 範疇，Reviewer 即使在 AC 未明文要求 shared footer 的情況下，**仍有責任**把「duplicate of existing structural chrome」升級為 Critical — 就像重複的 `<nav>` 會標 Critical 一樣，不該因「AC 沒寫」而降級。Reviewer 的角色定義就是「超越 AC 字面抓結構性問題」，否則 Step 2 depth review 與 superpowers 廣度掃描無差異。

**下次改善（具體硬 gate codify 進 reviewer.md）：**
1. **新增 Review Checklist 硬步驟「Structural Chrome Duplication Scan」（K-035 2026-04-22 入）**：對任何 page-level `.tsx` 新增或大幅改寫（新檔 / diff >50% / 列為「頁面 v2」），Reviewer Step 2 固定執行三步——
   - Step A：`grep -rn "<footer\|<nav\|<header" frontend/src/components/ frontend/src/pages/` 枚舉全站 structural chrome 來源，建 inventory 表（file → element 類型 → 使用路由）。
   - Step B：對 review 目標頁面 grep 同類 structural element（`<footer>` / `<nav>` / `<header>` / repeated CTA 大 block），找出 JSX 樹狀結構重疊 ≥3 elements 的 candidates。
   - Step C：比對 inventory，重疊者分類標註：(a) structural chrome（footer/nav/hero/page-header）重複 → **Critical**，阻擋 merge，要求抽 shared 或 justify 在 design doc；(b) content cards / section wrapper 重複 → **Warning**，列 TD；(c) utility primitives（Button / Badge 等）重複 → Suggestion 即可。
2. **AC 不要求 ≠ 可以不檢查**：reviewer.md 明文增註「shared-component reuse 屬 architectural smell 類檢查，即便 AC 未列，duplicate of structural chrome 一律升 Critical；不得以『AC 未要求』為理由降級。」理由：K-017 / K-022 兩輪 AC 都沒寫 "use shared Footer"，Reviewer 全部以「AC 全通過」結案，結果 duplicate footer 存活 6 天才被使用者肉眼抓到；這就是 Reviewer 角色失職。
3. **新頁面 / 頁面 v2 類 ticket 觸發「Shared Inventory Cross-Ref」硬 gate**：review 開場先 `ls frontend/src/components/` + `ls frontend/src/pages/` 列現有 shared 候選，對照本票新增/改寫頁面，逐項問「這個 shared 是否該被 import？如果沒有，design doc 是否明列原因？」未列原因 → Critical。此步應與「設計文件 spec 清單 vs 實作檔名 cross-check」並列，為 page-level ticket 的預設開場動作。

---

## 2026-04-22 — K-025 UnifiedNavBar hex→token + dual-rail spec upgrade (Step 2 depth review)

**做得好：** Pure-Refactor Behavior Diff Gate 按規執行：`git show main:frontend/src/components/UnifiedNavBar.tsx` 讀 OLD 後列逐分支 truth table（isActive=true / isActive=false / external=true / external=false / pathname==='/' / pathname!=='/'）7 格，每格 NEW className 與 OLD className 經 tailwind.config 解析後 computed color 完全等價（`#9C4A3B` ↔ `rgb(156 74 59)`、`#1A1814` ↔ `rgb(26 24 20)`、`#F4EFE5` ↔ `rgb(244 239 229)`、`/60` opacity modifier 保留），props 零異動、`TEXT_LINKS` 靜態常數不動、`renderLink` external / SPA 分支邏輯不動、`useLocation`+`pathname` 判斷不動。AC ↔ test count cross-check 通過（AC-025-NAVBAR-SPEC 5 And 家族 → spec 新增/改寫 5 tests）。dual-rail 斷言 rgb/rgba 格式用已存在的 `toHaveCSS` 實例（app-bg-isolation L119 / sitewide-body-paper L20）佐證 Chromium stringify 格式，無需冷啟實驗；/business-logic 路由 NavBar 實際掛載（BusinessLogicPage.tsx L90 `<UnifiedNavBar />`）經 grep 證實，`toHaveCount(0)` 斷言為「hidden-route behavior」而非「NavBar 未 render 的 false-green」。

**沒做好（本來該在更早階段攔截）：** AC-025-REGRESSION 的 4 條 `dist/assets/*.css` hex declaration grep（`color:#9c4a3b` / `color:#1a1814` / `background-color:#f4efe5` / `border-color:#1a1814`）作為等價性證據屬於 degenerate proxy — Tailwind JIT 對非 opacity-modified utility 輸出 `color:rgb(156 74 59)` 而非 lowercase hex，grep `color:#9c4a3b` 在 refactor 前與後同為 0（post-refactor dist 實測 0/7/0/3），pre==post 不變並非因為等價性成立而是因為 pattern 本身就測不到 brick-dark 與 paper 的主體 declaration。真正的 SSOT 是 `rgb(156 74 59)` (5 occurrences) / `rgb(244 239 229)` (5) / `rgb(26 24 20)` (7)，才是有 signal 的 invariant。此缺陷在 PRD QA Early Consultation Q1 採納時就應由 QA 或 Architect 追問「此 grep pattern 能否 capture 所有 declaration」，但當時 Q1 裁決用「dist grep pre==post」字眼結案，三方未對 pattern 覆蓋範圍追問。Engineer 在實作過程中自行發現並寫入 retrospective（§Next time improvement），屬下游 catch，不屬於 Reviewer 首攔的早期階段問題。

**下次改善：**
1. **QA Early Consultation 對 "grep-based equivalence proxy" 新增一步 SSOT 對齊檢驗：** 當 AC 引用「post-build grep 某 pattern 在 dist CSS 中 pre == post」作為等價性證據，QA 必須在 pre-Architect 階段先 `npm run build` 一次當前 main，把 grep pattern 跑過實際 dist/assets/*.css 並報告 raw count。若 raw count 為 0（或與可能的 SSOT 數量差距大），立即回 PM 要求 widen grep（例如補 `rgb(R G B` 形式）或換 strategy（例如 `.text-brick-dark` class 存在斷言）。此建議 codify 進 qa.md 硬步驟。
2. **Reviewer Step 1 pre-build sanity：** 深度 review 時對「dist grep 等價」類 AC，先跑實際 grep 報 raw count，不只看 pre==post 結果是否相等。本次若執行 `grep -c 'color:#9c4a3b' dist/assets/*.css` = 0 在 Round 1 就會浮上 pattern-degenerate 疑慮，而不是靠 Engineer retrospective 揭示；codify 為 reviewer.md §Plan Alignment 子條「equivalence-grep proxy raw-count sanity」。

---

# Reviewer Retrospective Log — K-Line Prediction

跨 ticket 累積式反省記錄。每次 review 結束前由 senior-engineer agent（code reviewer）append 一筆，最新在上。

## 寫入格式

```
## YYYY-MM-DD — <Ticket ID 或 Phase 名稱>

**做得好：**（具體事件；無則省略本行，勿捏造）
**沒做好：**（本來該在更早的設計/AC 階段攔截到的問題）
**下次改善：**（具體可執行的行動）
```

- 倒序（最新在上）
- 與單票 `docs/tickets/K-XXX.md` 的 `## Retrospective` 段落 Reviewer 反省並存，不互相取代
- 啟用日：2026-04-18（K-008 起）
## 2026-04-21 — K-031 /about BuiltByAI showcase 移除（Step 2 depth review）

**做得好：** AC-031 三條 AC 逐條到 Playwright 層：AC-031-SECTION-ABSENT 用 id + heading role + caption text 三重 toHaveCount(0) 斷言（不是 not.toBeVisible，真正 deleted-from-DOM 語義）；AC-031-LAYOUT-CONTINUITY 用 nextElementSibling 直接斷 DOM adjacency（Architect §7 已 pre-verify SectionContainer emits <section>，Engineer read 過再寫）；AC-031-K022-REGRESSION 靠既有 about-v2.spec.ts 39 cases 全 pass 佐證。architecture.md §8 self-diff 3 drift（L13/L140/L410）git diff 對照 row-by-row 全落地，Changelog entry 已補 L585。file deletion 用 git rm 不是 rm，staged 狀態 clean。Pencil .pen 194 行 S7 block 整段刪，JSON schema 驗 OK，homepage BuiltByAIBanner frame 完好。out-of-scope 三項（BuiltByAIBanner / Nº 01–05 / FooterCtaSection）grep + ls 驗證全數未動。

**沒做好：** 無 Reviewer 此輪可抓早一點的問題。票乾淨、AC count / 設計文件 / 實作三者 count 一致（7 sections 全鏈路對齊），Engineer retro 自己抓到 worktree `node_modules` 缺漏屬於自運維範圍不涉及 review。唯一 observation：Pencil MCP offline 導致 Designer 無法輸出 get_screenshot，Designer retro 已明示 fallback 至 JSON + grep 三路交叉驗 + 主動要求 PM/使用者目視確認——此屬合理降級，不構成 MERGE blocker（純 removal，視覺變化 = 無此 section，無可「看錯」空間）。

**下次改善：**
1. **視覺 artefact deletion 類 ticket 的 Pencil screenshot 降級規則：** 當 ticket 屬 pure-removal 且 Designer JSON-level grep 已證殘骸為零時，MCP offline 不 block PM 驗收；Reviewer 負責在報告明示「視覺驗證 fallback 至 JSON schema + structural grep，無 screenshot」給 PM 裁決。無需 codify 進 persona（此為 Designer retro 已處理的議題；Reviewer 只做 relay）。
2. **worktree node_modules 缺漏觀察：** Engineer retro 自提首次進入 `.worktrees/K-031` 需 `npm install`，屬 engineer.md Pre-Implementation Checklist 改善範圍，非 reviewer 規則；Reviewer 執行深度 review 時本次先遇到 tsc 跑不動就自己 npm install，不阻塞 verdict。


## 2026-04-21 — K-013 Round 2 Fix Pack (Step 2 專案深度)

**做得好：** Gate 1 Pure-Refactor Behavior Diff 我主動重跑 5 輸入路徑 dry-run（`appliedData.stats=null` / full-set×bars≥2 / full-set×bars<2 / subset×bars≥2 / empty matches），逐列對照 Engineer L268-274 table，五列全綠（consensusForecast1h/1d 在 R2 `displayStats` spread pattern 下恢復與 OLD `b0212bb` L224-226 一致的無條件注入語意，其他欄位如 winRate/meanCorrelation 走 full-set=backend baseline 為 K-013 AC-013-APPPAGE 刻意行為非 regression）。Gate 4 Architecture Doc cross-check 逐檔 grep `consensus` / `SQ-013-01` / `Known Gap`：`docs/designs/K-013-consensus-stats-ssot.md` L39-47 / L202-203 / L474 / L509-513 / L558 **仍保留** 「全集下不顯示 consensus 圖 … pre-existing 行為」的 false premise；`agent-context/architecture.md` L354 亦同；R2 commit range 對兩檔 diff 皆空。這是 Round 2 遺漏，列為 Critical F-1（design doc 與 reality 永久矛盾，未來 reader 踩坑）。Gate 5 dev-mode warn 確認 `import.meta.env.DEV` 正確保護，prod build dead-code-eliminated。Gate 6/7 commit 粒度四刀切乾淨，docs-only 第 4 commit 無需 gate 符合 CLAUDE.md §File Class。Case D substitution 代數等價性（observable DOM 相同：StatsProjectionChart `if (!bars.length)` fallback branch）經 StatsPanel.tsx L109-121 code trace 確認，PM Option X 裁決合理。

**沒做好：** Round 1 review 時，Gate 4「architecture doc cross-check」只 grep `consensus_forecast_1h` producer 確認後端永遠 `[]`，但沒 grep 設計文件 SQ-013-01 文字斷言本身是否符合事實（本該把「全集下不顯示 consensus 圖」這句話本身 dry-run 一次，就能在 Round 1 抓到 C-1 的同一個源頭矛盾，而非等到 Pass/Fail table 回讀才觸發）。根因：我把「設計文件斷言」預設為可信 source，只驗 claim 內引用的具體 commit / file:line，沒直接 dry-run claim 本身。

**下次改善：**
1. **Gate 4 擴為「斷言本身 dry-run」：** 設計文件出現「不顯示 X」「無 Y」「全集下如 Z」等 negative/existential claim 時，除了驗 claim 引用的 file:line source，必須對 claim **結論本身**跑 dry-run（例：「全集下不顯示 consensus 圖」→ 模擬 isFullSet=true × projectedFutureBars.length>=2 → 追 displayStats.consensusForecast1h 值 → 追 StatsPanel.tsx bars.length 判斷 → 對結論「不顯示」成立與否做代數證明）。Codify 進 `~/.claude/agents/reviewer.md` §Architecture Doc Cross-Check 硬 gate，triggers = `pre-existing` / `全集下` / `subset 下` / 任何帶 existential quantifier 的 claim。
2. **Round 2 remediation cycle 必掃「前一輪遺留 stale 敘述」：** Bug Found Protocol Round 2 fix commit range 對 design doc / architecture.md diff 為空時（本次 R2 兩檔皆空），需主動提醒 PM 驗證「前一輪斷言是否仍成立」。即使 fix commit 只動 code / test / retro，根因為 false premise 的票必伴隨 doc 斷言修訂，否則下一位 reader 會 inherit 同一誤解。Codify 為「Round 2 Post-Fix Doc Consistency Check」。

---


## 2026-04-21 — K-013 Round 1 (Critical C-1 Consensus chart disappears on full-set)

**做得好：** 設計文件 SQ-013-01 明寫「pre-existing behavior, full-set consensus chart 本來就不畫」，初讀接受 Architect 斷言過，但在 Pass/Fail table 編完後回讀一次覺得 AC-013-APPPAGE NEW 實作「full-set 吐 appliedData.stats」與「OLD 本來就不畫」兩個斷言組合邏輯不合（consensus chart OLD 究竟有沒有畫？無法同時成立），決定 `git show b0212bb:frontend/src/AppPage.tsx` 讀 base，跑 useMemo 資料流 dry-run（isFullSet=true × projectedFutureBars.length>=2），得出 OLD 實際一律注入 consensusForecast1h/1d 的結論 → 推翻 SQ-013-01 premise → 升級為 Critical C-1（K-013 引入 regression）。這一步不是測試驗證可覆蓋，Architect design doc + Engineer AC 字面 + 174 Playwright 全綠也不會觸發，單靠 Reviewer 回讀時「邏輯斷言矛盾感」+「手動 git show base」才能抓到。

**沒做好：** Review 第一輪讀 design doc §0.1 + §SQ-013-01 時接受「pre-existing behavior」宣稱未 code-level 驗，等到 Pass/Fail table 回讀才懷疑。若 Reviewer Step 2 開場就把 type=refactor / SSOT 移轉 / hook 搬家類 ticket 固定做「Behavior Diff: OLD vs NEW」表作為第一步，不讓 Architect 敘述替代 code-level 驗，C-1 可在 review 第一輪前 10 分鐘抓到，省掉 PM Phase Gate 2 重跑。

**下次改善：** 三條 codify 進 `~/.claude/agents/reviewer.md` Review Checklist：(1) refactor / SSOT 移轉 / util 抽取 / hook 搬家類 ticket 固定跑「Behavior Diff: OLD vs NEW」表為第一步，逐輸入路徑列 OLD return 欄位集合 vs NEW return 欄位集合；(2) design doc 任何「pre-existing」「legacy」「API 不變」敘述一律 `git show <base>:<file>` 驗證，未跑視為 SQ 未解；(3)「行為等價」為唯一通過標準，tsc+test 綠 + AC 字面符合皆不足以取代此步驟。記 `feedback_reviewer_pure_refactor_behavior_diff.md`（已寫）。

---

## 2026-04-21 — K-022 /about 結構細節對齊 v2（Step 2 專案深度）

**做得好：**
- 設計文件 §10 文件同步清單逐列對照 commit diff，抓出 `agent-context/architecture.md` 在 K-022 commit range 未更新（Critical: architecture.md 不同步）。
- A-12 shared primitives 逐檔確認 dark pattern 殘留，理解 SectionLabel 保留舊色屬「向後相容、/about 不使用 SectionLabel」，不誤判為 Warning。
- AC-022-HERO-TWO-LINE 字型不一致（AC 說 Newsreader / Pencil TQmUG 是 Bodoni Moda / E2E 驗 Bodoni Moda）三方比對後確認 Architect 設計文件已調整，但 ticket AC 未同步，正確列為 Warning 而非 Critical。

**沒做好：**
- AC-022-SECTION-LABEL ticket AC「6 個 section」vs 設計文件「5 個 label」數字差異，等到審查尾段才發現，應在 Review 開始時就做 ticket AC 數字 × 設計文件列表 × E2E count 三方比對。

**下次改善：**
1. Review 開始時固定 grep ticket AC 中所有數字（「N 個 X」），對照設計文件列表與 E2E spec count 斷言三方比對；不一致立即列 Warning。
2. Architect 因 Pencil 實測覆蓋 AC 文字時，Reviewer 驗設計文件 §2.x 是否有「AC 勘誤說明」，若無則列 Warning 要求 Architect 反寫 ticket AC（雙向一致性）。

---

## 2026-04-20 — K-021 Round 3 re-review（Step 2 專案深度）

**做得好：** Round 3 fix 後實跑 `npm run build`（max chunk vendor-react 179.29 kB gzip 58.57，無 >500 kB warning）+ 全量 Playwright chromium（115 passed + 1 skipped，skip 為 AC-017-BUILD 既有），直接驗 AC-021-REGRESSION 末段；逐檔讀 C-1（PasswordForm/BusinessLogicPage）/ C-2（Diary 三個子元件）/ C-3（HomePage wrapper 刪除 diff 486f06e）/ C-4（sitewide-fonts.spec.ts 73 行 3 case）commit diff 對照 Round 2 問題清單，確認 fix 真正消除而非症狀遮蓋；AC-021-FONTS 判定從 Round 2 PARTIAL → Round 3 PASS（3 case 覆蓋 font-display Bodoni + font-mono Geist + /app cross-route）；Round 2 新增 persona 硬步驟全部落地驗證（engineer.md L14 絕對不做第 4 條 / L69-73 前端實作順序第 5 步 / L84-88 驗證清單設計文件 checklist gate / senior-architect.md L71-85 Architecture Doc Self-Diff 段 / 4 memory 檔 + MEMORY.md 索引）。

**沒做好：** W-5 architecture.md Footer 表 Round 2 修 L463-469（`/app = HomeFooterBar`, `/diary = 無`）正確落地，但**同檔 L476 `Shared Components 邊界` 表的 `HomeFooterBar` 用於欄位仍誤寫** `/ /diary /business-logic`（應為 `/ /app /business-logic`）—— 屬 Architect self-diff 硬步驟覆蓋範圍內（結構化表格）卻漏掃第二張表。Reviewer Round 2 只對照 L463-469 未延伸檢 L476，屬 cross-check 範圍不足；已在本輪列為新發現 Warning（W-R3-01）。Round 3 另一遺漏：AC-021-FONTS 第三字型 Newsreader 的 fontFamily 斷言未被 spec 覆蓋（`font-italic` class 在 codebase 零使用，現況以 `font-['Newsreader']` arbitrary value + inline style 落地），屬 TD-K021-01 漸進處理範圍但應在 Round 2 點出，未點出。

**下次改善：**
1. Architecture doc cross-check 擴為「全檔 grep 同義欄位」：每次 architecture.md drift 檢查不只對照設計文件當下 section，同檔所有含同名組件（`HomeFooterBar` / `UnifiedNavBar` / `FooterCtaSection`）的表格均需 grep 逐列比對；不限於本次新增段落。
2. AC 列舉 N 字型 / N 路由 / N 狀態時，spec 覆蓋率 cross-check 延伸到每一項，不以「主要項已覆蓋」降級為 PASS；未覆蓋項如屬既有漸進遷移（TD 範圍），Reviewer 仍應於 Round 報告標 Suggestion，不沉默通過。

---

## 2026-04-20 — K-021 Sitewide Design System（Step 2 專案深度 review Round 2）

**做得好：** 沒停留於 Step 1 findings 的彙整，實際跑 `npm run build` 取得最新 chunk size（vendor-react 179.29 kB gzip 58.57 最大；無 >500 kB warning 新增）確認 AC-021-REGRESSION 末段；讀 `docs/designs/K-021-sitewide-design-system.md` §9.1 列出的 3 支 spec（`sitewide-body-paper` / `sitewide-footer` / `sitewide-fonts`）vs `frontend/e2e/` 實際檔案 cross-check，確認缺 `sitewide-fonts.spec.ts` 屬設計文件明列但 Engineer 未建（不是 Reviewer 自創新要求）；逐頁 grep HomeFooterBar + FooterCtaSection 實作，對照 `agent-context/architecture.md` § Footer 放置策略表，抓出 `/app` 與 `/diary` 兩列 drift（實作 `/app` 有 footer、`/diary` 無，architecture.md 寫顛倒）。

**沒做好：** AC-021-FONTS 的 Playwright 斷言「font-display / font-mono computed fontFamily」Architect 已在設計文件 §9.1 明列為獨立 spec 檔，卻未在放行 Engineer 時交付清單明寫「3 支 spec 必建」，讓 Engineer 實作只建 2 支（Engineer 在自己的 Retrospective 也沒列為 edge case）。Reviewer 在 Step 1 後若更早讀設計文件 §9 就能在 Engineer Pre-implementation Q&A 階段即點出缺口，而非等實作完檢查。同樣的「設計文件指定的 spec 清單 vs 實作 spec 檔名 cross-check」在 K-018 Reviewer retrospective（2026-04-19）已列「每條 AC 的 Then/And 逐行 grep spec」改善動作，但當時僅針對 AC 文字，未擴及設計文件明列的 spec 清單；本次仍漏。

**下次改善：**
1. Review 開始時固定跑：`grep -n "spec.ts" docs/designs/<ticket>*.md` 抽設計文件列出的 spec 檔名 → `ls frontend/e2e/` cross-check 實際檔名；有 drift 先列 Critical/Warning，不等跑 build 才發現。此條已 Edit 進 `~/.claude/agents/reviewer.md` 「Review Checklist」新增「設計文件 spec 清單 vs 實作 spec 檔名 cross-check」硬步驟（詳下）。
2. 架構文件 drift 檢查擴及「放置表」類規格表：每次 review 涉及 shared component placement 改動，固定對照 `agent-context/architecture.md` 的表格（Footer 放置 / NavBar 項目 / 路由表）逐列 grep 實作確認一致，drift 當場列 Warning 回 PM；不因「只是文件」降級為 Suggestion。

---

## 2026-04-19 — K-017 /about portfolio enhancement

**做得好：** 實際執行 `bash scripts/audit-ticket.sh K-002`、`K-008`、`K-999` 三個 AC-017-AUDIT case 驗證 exit code 與輸出格式，而非只讀 code；逐條對照 PRD 全部 10 條 AC 的 Then/And 子句與 spec 覆蓋，發現 AC-017-NAVBAR 的 DOM 順序斷言和 AC-017-BUILD 的 dev/build 環境矛盾兩個 spec 漏洞，而非只比對 describe 標題與 AC 標題。

**沒做好：** AC-017-NAVBAR 「NavBar 在 PageHeaderSection 之上（DOM 順序）」這條 And 子句在 spec 中缺漏；AC-017-BUILD test 在 dev server 下必然失敗的問題沒被 Architect 在 §7 風險清單中點出（只提了 Firebase Hosting 問題，沒有說 Playwright dev vs build 矛盾），而 Engineer 也未加 test.skip 或環境說明。這兩個缺漏本應在 AC 撰寫（PM）與 E2E 策略設計（Architect §7.11）時就明確——AC-017-NAVBAR 的 DOM 順序 And 子句是 PM 寫 AC 時明確列出的，Architect E2E 風險清單應把「DOM 結構順序斷言」的 Playwright selector 策略列為風險項目。

**下次改善：** Review E2E spec 時固定執行：展開每條 AC 所有 Then/And 子句，逐行 grep spec；對「DOM 順序」「URL 跳轉」「空間關係」類斷言優先盤點，這類斷言比內容斷言更容易漏寫。遇到 test 依賴 build artifact 時直接標為需要 build mode，不等 CI 失敗才發現。

---

## 2026-04-19 — K-018 GA4 Tracking

**做得好：** 逐條比對 PRD AC 的所有 Then/And 子句與 spec 覆蓋率，抓出 `/app` 路由 pageview 測試缺失和 click event `page_location` 斷言漏掉，而非只看測試標題與 AC 標題是否對應；同時確認 `initGA()` 的 spy 覆蓋分析（addInitScript 的 spy 與 initGA 的 gtag 都 push 到同一個 `window.dataLayer`，測試讀 dataLayer 不受 gtag 被覆寫影響），而非只從表面「函式被覆寫」就誤判為 bug。

**沒做好：** AC-018-PAGEVIEW 的「SPA 內部路由切換也會各自觸發 pageview」這條 And 子句（不只是 page.goto，而是透過 Link click 導航），spec 內沒有一個測試實際驗證 SPA 導航觸發的 pageview；banner_about 測試的 SPA 導航副作用雖間接覆蓋了部分場景，但並不是明確的 SPA pageview 路由切換斷言。這應在設計階段就由 Architect 把「SPA 路由切換測試 pattern」列進 Playwright 驗證策略（§6.3），而非只列靜態 page.goto 斷言。

**下次改善：** Review 時加固定步驟：展開 PRD 每條 AC 的所有 Then/And 子句逐行 grep spec，不只比對 describe block 名稱；有「每個 X 都要有 Y」這類全稱量詞的 And 子句時，確認 spec 對每個 X 各自斷言 Y，而非只第一個。

---

## 2026-04-18 — K-008 visual-report script

**做得好：** 沒只看檔案 diff，實跑 `npx playwright test --list`（無 project 篩選）重現「default E2E 流程會被 visual-report.ts 模組頂層 `resolveTicketId()` 印 warning 污染 stdout」的 side-effect（W1），抓到 Engineer / Architect 紙上審查漏掉的跨 project noise；並以 `path.join` 實測 `TICKET_ID=../../...` 算出預期外的 output path（W4），把「純理論威脅」轉成可觀察的行為。

**沒做好：** W1 的根因在 Architect §2.1 的設計「啟動時 stdout 印黃色警告」裡其實就埋了 — 「啟動」何時發生（module load / test body）沒被追問；如果設計階段要求把 side-effect 發生點寫明，Engineer 實作就會自然避開 module-level 執行。W4 的 path traversal 屬於「env var → filename 生成」類通用安全檢查，AC 階段沒寫 TICKET_ID 格式約束、Architect §2.1 也沒加 validation 條款，落到 Reviewer 才捕到；這是跨 role 的 checklist 缺口。

**下次改善：**
1. Review AC / Architect 設計文件時，遇「模組載入時 warning / console / fs / 啟動檢查」類語句，主動問「執行時機？誰會 import？」把 side-effect 發生點寫進設計或 AC。
2. 凡 AC 有「外部輸入（env var / URL param）→ 生成檔名 / 路徑」的場景，Reviewer checklist 加固定一條「驗證 whitelist / allow-list / path normalize 是否存在」；未來可把此條回推到 PM AC 模板，讓 K-Line 下一張類似 ticket 起就不漏。
3. 對 per-project testMatch / testIgnore 類 Playwright config 決策，Reviewer 除了驗證目前 spec 集合，還要主動指出「以後新增 spec 如何歸 project」的操作守則是否寫進 architecture.md（W2 的根源是 Architect 文件沒把 final 決策的副作用寫清楚）。

---

## 2026-04-18 — K-011 LoadingSpinner label

**做得好：** 除了對 4 個 callsite 紙上比對，還 Grep 全工作目錄 `LoadingSpinner` + `Running prediction` 兩個關鍵字，cross-check 沒遺漏任何 src / test / E2E 斷言；並實跑 `npx tsc --noEmit` + `npm test`（非信任 Engineer 回報），確認 `PredictButton.test.tsx:24` 的英文斷言仍命中 `PredictButton` 傳入的 `"Running prediction..."` label，AC-011-REGRESSION 自動保。

**沒做好：** Engineer 指出 3 條 drift（architecture.md / k002-component-spec.md / homepage.pen），但 ticket AC 從頭到尾只鎖「4 個 callsite 傳 label」，沒把文件同步寫進 AC。Architect 裁決「無需 Architecture」時其實已經知道 architecture.md:139 有「目前固定 Running prediction...」這行，卻未在裁決中指示 Engineer 順手修；結果全交給 Reviewer 裁 in-scope/tech-debt。這類「單行文件同步」本該在 Architect 放行時就標為 in-scope。

**下次改善：** Review 發現「架構文件 drift 根因是本次改動」時，若改動極小（一行），直接建議 PM 本票內修（不拆 tech debt）；同時回饋 Architect 未來裁決「無需 Architecture」時，加一句 checklist：「grep 過期描述，有則列入 Engineer scope」。對 spec 歷史文件（已歸檔的 K-00X-design）不強求同步，建議 PM 改為加「superseded by K-XXX」頭註，不動原內容。

---

## 2026-04-18 — K-009 1H MA history fix

**做得好：** 除了紙上比對 diff，實際執行 stash push → pytest 單 test → stash pop 驗證 Engineer 聲稱「移除 fix 後 test 會失敗」屬實（`captured['ma_history']` = None，斷言 `is main._history_1d` 失敗）；同時跑全量 63 tests 確認 1D 分支與其他 endpoint 未受影響。Test 斷言只鎖參數身分（`is` / `is not`），Test Escalation Rule 自動合規。

**沒做好：** Architect 把「predictor 層 ma_history 靜默 fallback」列為 defense-in-depth 選項並授權 Engineer 自裁；Engineer 拒絕並標技術債後通過。但此決定本質是把根因留原地，未來新 caller 仍可能重犯 — 我作為 Reviewer 接受此選擇，僅把它列 Suggestion 上送 PM，沒主動要求開 follow-up ticket 追踪技術債（容易被遺忘在單票 Retrospective）。

**下次改善：** 遇到 Engineer 明示「保留技術債 + 寫在 Retrospective」的情況，review 必同步建議 PM 開 follow-up ticket（不一定立刻做，但至少 ticket queue 有條目），避免 Retrospective 被當作 garbage collection；同類靜默 fallback / optional 參數陷阱在未來 review 預設標 Warning 而非 Suggestion。

---

## 2026-04-18 — K-010 Vitest AppPage 修復

**做得好：** 除了紙上比對還實跑 `npm test`（36 pass）/`tsc --noEmit`（exit 0）/`npx playwright test`（45 pass）三重驗證，沒只信 Engineer 的 Implementation log；同時 grep handlePredict / handleTimeframeChange 確認 test 斷言的 payload 與 production 行為完全一致（timeframe=viewTimeframe、toggle 只打 merge-and-compute-ma99）。

**沒做好：** K-010 原被標為單純 selector 修復，但 test 的行為斷言與生產碼矛盾（R1/R2）本應在 K-010 建立階段就透過「原 test 能否反映 production handler 今天的呼叫序列」這個檢查攔到；我作為 Reviewer 在更早的類似 ticket（如 K-005 / K-006 的 UI 改動）也未提醒「重構 UI 時 grep `src/__tests__/` 的舊斷言」，讓 dual-toggle 遺留斷言苟活到 K-010 才爆。

**下次改善：** Review checklist 加一條「UI/flow 重構 ticket 預設要求 Engineer 附 `grep -r <被改組件或 handler 名> src/__tests__/` 輸出」；我 review 到 test 改動時必用 grep 掃同名 handler 的所有 spec 依賴；遇到 index-based selector（`getAllBy*()[N]`）不管在不在 scope 內，一律在 Warning 欄列出並建議開 follow-up ticket。

---

<!-- 新條目從此處往上 append -->