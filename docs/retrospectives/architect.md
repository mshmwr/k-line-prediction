# Architect Retrospective Log — K-Line Prediction

Cross-ticket cumulative retrospective log. The senior-architect agent appends one entry before every task close, newest on top.

## Entry format

```
## YYYY-MM-DD — <Ticket ID or Phase name>

**What went well:** (specific event; omit this line if none — do not fabricate)
**What went wrong:** (root cause + why design/review failed to catch it)
**Next-time improvement:** (concrete, actionable follow-up)
```

- Newest first (reverse chronological)
- Coexists with single-ticket `docs/tickets/K-XXX.md` `## Retrospective` Architect entries; neither replaces the other
- Active since 2026-04-18 (from K-008 onward)

---

## 2026-05-05 — K-096

**What went well:** All SVG coordinates derived purely from reading `pipeline.svg` source — no ambiguity; lane separation math (85px lanes, 15px gaps) produced a clean, non-overlapping layout without iteration.
**What went wrong:** None in this session; no revisions needed.
**Next time improvement:** For pure-SVG diagram tickets with no Pencil frame, start with the coordinate scratch-pad (lane table + box position table) as the first artifact — it forces all spatial decisions before prose and eliminates backtracking.
**Slowest step:** Deriving the three-lane y-coordinate grid from scratch; next time use a fixed lane-height template (e.g. 85px/lane + 15px gap) from the outset.

## 2026-05-05 — K-095

**What went well:** All confirmed facts sourced from tool inspection (vite.config.ts, vite-env.d.ts, MailIcon.tsx) before writing — no fabricated specifics; zero research loops.
**What went wrong:** n/a
**Next-time improvement:** For any SVGR migration ticket, check `vite-env.d.ts` for the `vite-plugin-svgr/client` reference before any other research step — eliminates the type-declaration question in one read.

## 2026-05-04 — K-092

**What went well:** Pre-read of `find_top_matches` loop body confirmed that `_aligned_ma_series(window, history[:i])` is already the established pattern for per-candidate prefix context; the new gate reuses it with zero new helpers.
**What went wrong:** Hook blocked the initial Write because the design doc was attempted in the canonical repo (main branch) rather than in the worktree, despite the PM note saying "no worktree needed." The hook takes precedence — always create the worktree first.
**Next-time improvement:** PM "docs-only, no worktree needed" instructions do not override the pre-edit-branch-check hook; always create the worktree first, even for docs-only tasks.

## 2026-05-03 — K-085

**What went well:** Pre-read of `find_top_matches()` and `daily_predict.py` before designing revealed that `history=`, `run_prediction()`, `compute_outcome()`, `build_6h_query_window()` are all already composable — design reduced to a thin loop with a slice, zero predictor changes required.
**What went wrong:** n/a
**Next-time improvement:** When designing a new script that wraps existing backend logic, always read the existing script's public function list first — it frequently eliminates the need for new abstraction.

## 2026-05-03 — K-084

**What went well:** Identified two distinct ValueError catch sites (build_6h_query_window vs find_top_matches) before drafting; this prevented a design that would mis-handle the graceful-exit contract. Read `_build_query_bars_from_prediction` in full before deciding whether to change it — confirmed it must stay at 24 bars for optimizer replay correctness.

**What went wrong:** None this session.

**Next time improvement:** When a ticket adds a parameter to an existing function, immediately list all callers (grep) to confirm None-default backward-compat holds across all call sites — not just the two explicitly mentioned in the ticket scope.

**Slowest step:** Confirming the correct filter insertion point within the `find_top_matches` loop — needed to read the full loop body to confirm `history[i]` vs `window[0]` equivalence and that inserting the filter before existing `continue` guards avoids wasted computation.

---

## 2026-05-02 — K-083

**What went well:** All required source files read before drafting (firestore_config.py, predictor.py signatures, daily_predict.py patterns, test_daily_predict.py import conventions); `param_override` context manager designed before writing test cases, preventing spec drift between §4 and §10.

**What went wrong:** None this session.

**Next time improvement:** When objective function interacts with a module-global, draft the context manager contract in the algorithm section before writing the test plan — test isolation cases (#7) depend on it.

**Slowest step:** Resolving `EarlyExitSignal` + `skopt.gp_minimize` callback interaction — skopt has no native early-stop; required designing custom exception + callback raise pattern.

---

## 2026-05-02 — K-081

**What went well:** All 10 mandatory input files read before writing; `actual_close` derivation gap caught at design time (field absent from `ActualOutcome` frozenset), preventing Engineer from discovering it mid-implementation.

**What went wrong:** QA Challenge #6 ruling ("Recharts confirmed present") was accepted without immediately grepping `package.json`; discovered Recharts is absent only after completing the rest of the design, requiring a §0 blocker to PM.

**Next time improvement:** When any QA ruling asserts a dependency "is confirmed present," grep `package.json` in the same read batch as the ticket — do not defer to the ruling's stated evidence.

**Slowest step:** Tracing the "actual_close" derivation — `ActualOutcome` has `actual_high` + `actual_low` but no close; ruling on midpoint proxy required re-reading the K-080 frozenset.

## 2026-05-02 — K-080

**What went well:** All 5 input files read before design started; `find_top_matches` signature read in full before specifying the `run_prediction` wrapper — caught the need for a `full_df` parameter at design time, not during Engineer implementation.

**What went wrong:** Initial mental model of `run_prediction()` assumed `query_df` was sufficient, missing that `find_top_matches` needs a full `history` + `ma_history` context arg. Caught during function-layout design, not during Engineer challenge — correct catch point.

**Next time improvement:** When designing a wrapper function around an existing multi-arg function, read the callee's full signature before specifying the wrapper signature — prevents Engineer from discovering missing params at implementation time.

**Slowest step:** MAE/RMSE computation strategy decision — single-scalar vs per-bar path store; resolved by confirming per-bar path is K-082 scope, not K-080.

## 2026-05-02 — K-078

**What went well:** All six inline constant read sites in predictor.py identified upfront; sacred test import chain traced before writing the rewrite plan, avoiding a mid-Engineer surprise.
**What went wrong:** The existing `test_min_daily_bars_constant_is_imported_not_magic` imports `MA_TREND_WINDOW_DAYS` directly from predictor — this import becomes incorrect after K-078 because the operative value moves to `predictor.params.ma_trend_window_days`. This constraint should have been surfaced in the ticket as a sacred-import dependency before QA consultation, not discovered during design.
**Next time improvement:** When a ticket replaces module-level constants with a namespace object, grep all test files for direct constant imports (`from <module> import <CONSTANT>`) at design start — list each as a "test import that must change" in the design doc before writing the sacred-test rewrite plan.
**Slowest step:** Confirming the exact lines in predictor.py where `MA_TREND_WINDOW_DAYS` and `MA_TREND_PEARSON_THRESHOLD` are read (required reading predictor.py in three offset passes to cover the full 440-line file).

## 2026-05-02 — K-075 Phase 1 (Architect RFC)

**What went well:** Cross-hook dependency graph (resetPredictionState / setQueryMa99 setter injection) was identified before finalizing hook interfaces, avoiding a design revision after handoff.
**What went wrong:** Initial hook boundary table omitted the `queryMa99`/`queryMa99Gap` setter calls inside `handlePredict`; discovered only after tracing the full function body, requiring the usePredictionWorkspace interface to be revised mid-session.
**Next time improvement:** When mapping hook boundaries, trace all cross-domain setter calls (not just useState declarations) as the first step before writing any interface table.
**Slowest step:** Determining whether `workspace` useMemo should live in AppPage or a fourth hook — cross-hook dep analysis required reading both existing hooks' state maps before ruling.

---

## 2026-04-30 — K-048 PM-correction round

**What went well:** Both PM rulings (region confirmed, upload-write item removed) were precise enough to apply as direct edits with no ambiguity; all six affected locations in the design doc updated in one pass.

**What went wrong:** Upload write path item (d) in `backend/main.py` row was included in the initial design despite the ticket not covering re-enabling it — design doc drifted from ticket scope on that point.

**Next-time improvement:** Before listing `backend/main.py` edit items, grep the ticket's out-of-scope / explicitly-disabled section to confirm no carry-over from a prior ticket's TODO comment.

**Slowest step:** Locating the `Change isolation` line for the refactorability checklist required a grep because the exact wording differed from memory; keep checklist language generic to avoid precision-match failures.

---

## 2026-04-30 — K-048 Architect

**What went well:** Cloud Run region discrepancy (`us-central1` in ticket vs `asia-east1` in deployed revisions) caught before writing the workflow YAML by cross-reading K-049 and K-046 deploy records.

**What went wrong:** Initial scraper option draft used direct `main.py` import without first checking module-level side-effects; pivoted to `history_utils.py` extraction after confirming FastAPI app construction runs at import time.

**Next-time improvement:** When a new script targets an existing FastAPI module, grep module-level statements for side-effects before selecting the import strategy.

**Slowest step:** Region discrepancy discovery required reading two deploy-record files; pre-scanning `grep "region\|gcloud run" docs/tickets/` before writing workflow YAML would surface this faster.

---

## 2026-04-29 — K-059 Phase 1 Architect

**What went well:** Sacred T-L1 text dependency identified early by reading `LoadingSpinner.tsx` immediately after `DiaryLoading.tsx` — cross-referenced the inner `<p>Loading diary…</p>` against T-L1 `toHaveText(/Loading diary/)` before writing the rebrand spec.

**What went wrong:** Initial fade-in strategy assumed `transition-opacity` + React state toggle; reading `DiaryEntryV2.tsx` confirmed no existing state, requiring a pivot to CSS `@keyframes` animation approach.

**Next-time improvement:** When rebrand touches a wrapper that imports a shared primitive, read the primitive's JSX in the same upfront batch — its own ARIA/text content may be load-bearing for existing Sacred tests.

---

## 2026-04-28 — K-058 Phase 2 (component tree + ticket-cases schema + weight formula)

**What went well:** BQ-058-03 resolved cleanly by reading site-content.json structure and verifying generator preservation logic — separation decision was unambiguous once the generator's mutation boundary was confirmed.

**What went wrong:** Initial read of build-ticket-derived-ssot.mjs stopped at line 100; needed a second read pass to locate the exact insertion point in `buildSiteContentJson()`. Root cause: skipped reading the full relevant function body upfront.

**Next-time improvement:** When a phase includes a script modification, read the complete target function (not just file header) in the same upfront read batch — avoids a second read cycle for insertion-point precision.

---

## 2026-04-27 — K-052 Phase 1.5 Delta (reverse SSOT direction + bootstrap + PM persona patch)

**What went well:** Surgical-edits-only discipline maintained — §1–§13 + §15 untouched, all changes scoped to §0 (K-G-01 close), §5.3 (severity field clarification), §5.7 (new renderSlots subsection), §14 (full reverse-direction rewrite), §16 + §17 (new sections), §20 ACs (rewrite AC-K052-14 + add AC-K052-16/17), and §18-§23 renumber pass. PM persona insertion-point verified by direct Read of `~/.claude/agents/pm.md` — line 489 is the closure of `Ticket closure bookkeeping` and line 490 is `Outer-repo mirror commit pre-flight`; cited line numbers exactly. AC-K052-14 reframed from "round-trip test" to "drift detection with two distinct cases (JSON-changed-but-README-stale vs README-edited-inside-markers)" — direction reversal makes round-trip framing semantically incorrect, drift framing matches JSON-is-source paradigm.

**What went wrong:** Initial pass through §16 bootstrap script almost included a "rerun bootstrap on README structural change post-merge" maintenance scenario; caught during §16.5 drafting that BQ-052-15 ruling explicitly closes that door (recovery uses `git restore`, not re-parse). Re-read Lock-Ins BQ-052-15 fully before writing §16.5 decision rule. Root cause: speed-reading Lock-Ins table cell during initial outline — "one-shot parse + delete" should have been read as constraint not just lifecycle event.

**Next-time improvement:** When a Phase-N redesign reverses architectural direction (here: SSOT polarity), produce a side-by-side direction table (parse-then-emit vs render-then-overwrite) in §0 Scope Questions BEFORE any §-section rewrite. Each algorithm in the old direction maps to an inverse in the new direction; surfacing the inverse map upfront prevents the "is this still correct?" loop on every paragraph. This is a sub-rule under the existing Scope Question Pause Rule — added trigger: "Lock-Ins reverses an existing architectural direction (e.g. source-of-truth polarity, read-vs-write flow, ownership boundary)".

---

## 2026-04-27 — K-052 Phase 2 Architect Design Doc (triple-emit + Designer persona patch)

**What went well:** Drafted §1–§21 in one pass against PRD §BQ Resolution Lock-Ins as the in-ticket SOR. Each Lock-In cell traceable to a design-doc section (BQ 1 → §5.1 metrics, BQ 2 → §5.1 lessonsCodified, Zone 1 → §5.2 + §14, Zone 2 → §5.3 + §5.5 weight formula, BQ 3 → §8 frontmatter-gated parser + §9 three-case algorithm + §13 backfill table). Edge-case truth table (§9.2) enumerates 11 cases across the 5 sacred-lifecycle invariants (Add/Modify/Retire happy paths + 5 fatal paths + 1 advisory path + 1 in-flight skip path); each row names exit code so Engineer + QA share one source of truth. Verified before fabricating: ran `grep -nE '^### (AC-|Sacred)' docs/tickets/K-021* K-031* K-034* K-035* K-040* K-046*` to confirm Sacred clause body locations across the 6 backfill candidates BEFORE writing §13 patch table; discovered K-034 has zero AC-shape Sacred headings (its file absorbed K-035 retros but bodies live in K-035 file) and surfaced the grouping ambiguity to PM via §13.2 escalation rather than self-arbitrating.

**What went wrong:** First draft of §5.1 `metrics.lessonsCodified` hardcoded `claude-config/memory/feedback_*.md` glob without considering that the generator runs from `K-Line-Prediction/scripts/` and `claude-config/` lives 3 directories up at `~/Diary/claude-config/` (sibling of `ClaudeCodeProject/`). CI environments don't share the parent layout. Caught during §5 self-review and revised to require `process.env.CLAUDE_CONFIG_PATH` env-var override + null-fallback when path resolves missing. Root cause: Lock-Ins introduced a cross-repo SSOT field (sibling-repo path) without architect-time portability check. Should have surfaced as §0 Scope Question before committing to schema — instead the path concern was absorbed into §5.1 itself, complicating the spec.

**Next time improvement:** When Lock-Ins introduces a new SSOT field whose source lives outside the project repo (sibling repo, parent directory, env-var-pathed asset), surface CI environment portability as a §0 Scope Question BEFORE drafting §5 schema. Add to senior-architect persona §Scope Question Pause Rule trigger list: "any Lock-In field with source path outside `<project-root>/`" — pause + escalate to PM whether to (a) require env-var override, (b) hardcode-with-fallback, or (c) rule the field out-of-scope until path is canonical. PM-time decision saves §5-section rewrite at delivery time.

---

## 2026-04-26 — K-053 Architect Round 2 Verdicts on Engineer Sheet (A1/C1/M1/Z1)

**What went well:** Engineer's Pre-Implementation Design Challenge Sheet surfaced 4 items (A1 TS typing of `'instant'`, C1 `history.scrollRestoration = 'manual'` placement, M1 T-K053-04 query-only test contract, Z1 `'scrollRestoration' in history` SSR-safety guard). All 4 ruled in single response per ≤2-turn obligation: A1 verified empirically with `npx tsc --noEmit EXIT=0` against a temp src test file under repo's actual TS 5.9.3 + tsconfig (avoiding the `--target/--lib` override pitfall that produced spurious moduleResolution errors on first attempt — caught the false-positive and re-ran cleaner); Z1 verified with `grep -rE "createRoot|hydrateRoot|renderToString" frontend/src/` (single hit, SPA-only confirmed); C1 verdict supported by reasoning about React lifecycle + StrictMode idempotency; M1 verdict supported by concrete wrong-axis risk analysis (`page.evaluate(window.history.pushState)` bypasses `history` package wrapper, would not trigger React Router `useLocation` re-render — false-pass risk). Edits landed in same response: §3.1 component spec gained the `useEffect(() => { history.scrollRestoration = 'manual' }, [])` line as canonical Engineer copy-paste source; §3.3 spec contract un-skipped T-K053-03 (per BQ-K053-01 ruling) and added comment-only annotation block where T-K053-04 would have been. Per-item rationale anchored in code conventions (Karpathy Simplicity for Z1, blast-radius minimization for C1) rather than personal preference.

**What went wrong:** §12 AC ↔ Test Case Cross-Check Status column for AC-K053-06 left stale ("Pending — PM Phase 1 ruling required") despite the table now reflecting an active T-K053-03 in the Test count column. Caught in self-diff and noted in addendum, but should have Edited §12 in the same Edit pass rather than asking Engineer to refresh. Root cause: addendum-pattern (append rather than table-Edit) is comfortable but creates two-sources-of-truth between addendum verdict and §12 status cell. First A1 verification attempt also wasted ~1 round overriding tsconfig flags (`--target ES2020 --lib ES2020,DOM`) instead of using the project's own `tsc --noEmit` from `frontend/`, which surfaced 14 unrelated module resolution errors before I realized the override was the cause.

**Next time improvement:** When a verdict mutates §3 spec contract, immediately run a per-section self-diff against §12 (AC ↔ Test cross-check) and §11 (All-Phase Coverage), Edit any stale cells in the same response. Treat §12 as a downstream view of §3 — addendum-only updates are stale-by-default. For tsc / tsx / build-tool verifications, default to running the project's own configured invocation (`cd frontend && npx tsc --noEmit`) before reaching for `--target/--lib` overrides; project tsconfig is the canonical environment, not flag-construction guesses.

---

## 2026-04-26 — K-053 Architect Same-Session Verdict on QA-flagged M1+M2 (factual error round-trip, ≤2 turns honored)

**What went well:** QA Early Consultation surfaced two factual errors in §3.3 (M1 missing `.ts` extension on `mock-apis` import; M2 non-existent `diary-timeline` testid as wait selector); Architect verified both with same-response tool calls (`find frontend/e2e -name "mock-apis*"` + `grep -rn "mock-apis" frontend/e2e/` for M1; `grep -rn "data-testid=\"diary-" frontend/src/` for M2 — confirmed 13 mock-apis hits all use `.ts` extension, and no `diary-timeline` testid exists across 11 diary-* hits). Edits landed in same response as verification, plus full Self-Diff (`diary-timeline` 0 hits / bare `mock-apis` path 0 hits / `mock-apis.ts` 2 hits / `data-testid="diary-entry"` 2 hits — all 4 gates pass). Same-Session Verdict ≤2-turn obligation honored: turn 1 = QA flagged, turn 2 = Architect verified + Edited + addendum + retro entry. Also caught one task-spec inaccuracy via verification (the relayed M1 correction text suggested file lives at `frontend/e2e/mock-apis.ts` but it actually lives at `frontend/e2e/_fixtures/mock-apis.ts` — fix lands as `'./_fixtures/mock-apis.ts'`, matching the 8-spec precedent rather than the relayed suggestion); Architect verified-before-Edit per Global §Pre-response verify triad rather than blindly applying the relayed string.

**What went wrong:** Both M1 and M2 are first-pass §3.3 authoring misses that an Engineer's compile + first-spec-run would have caught in seconds, but Engineer would have eaten one full round-trip (read design doc → discover failure → file Design Challenge Sheet → wait for Architect verdict). Root cause for M1: extension-less import is the convention in many TS codebases, but this project's `moduleResolution: "bundler"` tsconfig requires explicit `.ts` — a 5-second `grep -rn "mock-apis" frontend/e2e/` during initial design doc authoring would have surfaced the 8-spec precedent. Root cause for M2: `diary-timeline` was a plausibility-guess rather than a grepped-from-source testid — exactly the failure pattern `feedback_no_fabricated_specifics.md` warns against. Spec contracts referencing testids must come from `grep` output, not memory.

**Next time improvement:** Codify into `~/.claude/agents/senior-architect.md` §3 / §3.3 contract authoring: any design doc snippet that references (a) module import path (`from '...'`), (b) `data-testid` selector, or (c) file path used in test code MUST cite a `grep` output (file:line) inline within the same paragraph as the snippet. Treat snippets without inline grep citation as unverified pseudo-code (mark `// pseudo` per persona rule "do not write code — use pseudo-code or interface definitions"). When the snippet is intended as copy-paste-ready (the §3.3 case here), the grep citation is mandatory, not optional. This converts the "QA caught it" loop into an "Architect grep gate before doc save" loop.

**What went well:** Pre-Design Audit dry-run (`git show 803935e:frontend/src/main.tsx` + `grep useLocation frontend/src/`) confirmed the canonical mirror pattern (`useGAPageview`) exists exactly as PRD assumed, which let the §3 component spec land first-pass with zero rework. Edge-case truth table (§6) enumerated 16 rows across 5 axes (pathname × hash × search × initial-mount × POP/PUSH/REPLACE/StrictMode) and explicitly named each row's verdict source — PM ruling slot vs Architect default-decision vs spec-verified — so Engineer and Reviewer have zero ambiguity about which cells are debatable. Sacred 7-pattern grep sweep + 5-route regression sweep both came back zero hits, validating the "purely additive UX" framing.

**What went wrong:** Truth table row notes mixed "Architect default rationale" with "PM ruling required" inside prose paragraphs rather than a separate column — Reviewer has to re-read full row note to confirm which ruling slot a row belongs to. Specifically rows #5 (hash removal → reset, Architect default) and #11 (refresh-mid-scroll → always-reset, Architect default) are easy to mistake for PM-ruling slots without careful reading. Cost was tolerable here (16 rows, 1-page table) but at 30+ rows it would degrade.

**Next time improvement:** When edge-case truth tables include a mix of Architect-default-decisions and PM-ruling-slots, add an explicit "Verdict Source" column (values: `PRD AC`, `PM ruling pending`, `Architect default — challengeable`) so Engineer / Reviewer can scan-grep instead of paragraph-read. Codify into senior-architect persona §Edge cases truth table contract on next persona Edit cycle.
---

## 2026-04-26 — K-051 Phase 4 design

**What went well:** Pre-Design Audit `git show HEAD:` evidence on `predictor.py` lines 8 / 11 / 155-157 / 331-336 / 343-345 caught the dual-callsite implication of the AC-051-10 gate change up front. PM brief framed the fix as "single line 156 + line 335"; only by reading both `_fetch_30d_ma_series` callsites in `find_top_matches` did the candidate-side `if not candidate_30d_ma: continue` (line 343-345) silently-tightening behavior surface. Documented in §8.3 with explicit cross-reference to QA Phase 4 Early Consultation finding #1 and PM B-Phase4-hidden-callsite ruling — Engineer reads one section to know "top-N composition will shift, AC-051-08 positive integration test still passes, do not panic". Without the audit dry-run that line of reasoning would have only emerged at Engineer's pytest run, costing one round-trip back to PM.

**What went wrong:** §1.3 CJK enumeration sweep took ~40% of total design time — 29 grep hits had to be classified individually with citation rationale. Initial classification used a 2-column split (`translate / preserve`) but 18 of 29 hits fell into "preserve" without distinguishing functional-preserve (regex parser literals at `MainChart.tsx:33,38` will literally break the AM/PM parser if removed) from out-of-scope-preserve (JS comments in `UnifiedNavBar.tsx`, K-046 Sacred assertion in `K-046-example-upload.spec.ts:105`). Engineer reading the 2-column table would still ask "should I touch UnifiedNavBar comments since they look like 'just comments'?" — exactly the scope-expansion risk the table was supposed to head off. Had to re-classify mid-design into a 3-column scheme `(a) translate / (b) preserve-functional / (c) preserve-out-of-scope` with citation per row.

**Next time improvement:** when a ticket scopes "translate user-visible language X in surface Y" with explicit out-of-scope code-internal X, the Architect's enumeration table MUST use 3 classification columns from row 1 — `translate / preserve-functional / preserve-out-of-scope` — not 2. Codify into `~/.claude/agents/senior-architect.md` §All-Phase Coverage Gate as a hard-step row: "i18n / language-scope tickets: enumeration table 3-class column (translate / preserve-functional / preserve-out-of-scope) mandatory; 2-class scheme = design doc incomplete." This prevents the mid-design re-classification round-trip.

---

## 2026-04-26 — K-051 Phase 3b/3c design

**What went well:** Pre-Design Audit code-level dry-run caught two pointer errors before they became Engineer time-sinks: (a) PM brief said mock `/api/predict-stats`, but main.py exposes no such endpoint — resolved as SQ-01 with code citation, no PM BQ needed; (b) QA retro pointed at K-046 spec line 97-99 for the `setInputFiles` pattern, but that line targets the history-reference section, not the official-input multi-select that K-051 actually drives — swapped the citation to `ma99-chart.spec.ts:163-168` (canonical pattern) before delivery so Engineer never has to discover the mismatch live. Both errors caught only because §1.1 / §1.2 truth tables were filled in *before* the file-change list was drafted.

**What went wrong:** Initial pass treated the AC-051-08 fixture provenance docstring as a `# Source: ...` comment line in the CSV itself. Code-level dry-run on `parseOfficialCsvFile` (AppPage.tsx:48-66) showed the strict numeric-first-column gate would throw on any leading `# ` line — forcing a sibling `README.md` as the audit-trail container. Caught at design time, but only because §1.2 BOM and header-row truth tables were filled BEFORE the fixture-content section was drafted; if I had drafted the sections in the order PM listed them in the brief, the bug would have shipped to Engineer.

**Next time improvement:** when a design touches BOTH backend and frontend fixture format gates with a shared fixture (mirrored or symlinked), the fixture-format truth table goes BEFORE the file-change list, not after. Codify into this persona's Pre-Design Audit checklist as: "any cross-layer fixture shipping into ≥2 parsers — write parser-tolerance truth table first, then fixture content design". Append to `~/.claude/agents/senior-architect.md` §Pre-Design Dry-Run Proof Gate 1 a new row: "Cross-layer fixture parser-tolerance truth table — list each consumer parser × accept/reject for {BOM, header row, comment line, trailing newline, CRLF, empty}; any reject cell determines fixture format constraint. Skipping = blocker."
---

## 2026-04-25 — K-051 Daily DB backfill + Cloud Build rollup-musl fix (Architect bypassed)

**What went wrong:** Architect role was skipped end-to-end. Two PRs shipped (PR #19 data backfill, PR #20 Phase A.5 Dockerfile fix) with no design doc, no Pre-Design Audit, no truth table. The cost showed up in Phase A.5: the first Dockerfile fix attempt regenerated `package-lock.json` inside an Alpine container, which produced a working musl binary entry but dropped `@types/node` from a transitive direct dep down to optional peer — surfaced only when `tsc` failed in the second `docker build`. The second attempt switched base image to `node:20-bookworm-slim` (glibc) on the assumption that "musl base + macOS-generated lockfile" was the precise root cause; local `docker build --platform linux/amd64` immediately reproduced the same npm bug for `@rollup/rollup-linux-x64-gnu`, proving the root cause was lockfile-generation OS, not base libc. Three attempts cost ~15 minutes plus two Docker base-image pulls; a 3×2 truth table (lockfile-gen-OS ∈ {macOS, linux} × base-image-libc ∈ {musl, glibc}) drawn before attempt 1 would have predicted both failures and pointed at the surgical `--no-save` pin in one shot. Pre-Design Audit (the persona's mandatory §0) was implicitly skipped because "Phase A.5 fix-forward" felt urgent enough to bypass design — but the bypass made the fix-forward longer, not shorter.

**Next time improvement:** Phase A.5 fix-forward (deploy fail → patch) still requires a 5-minute pre-edit design note when the suspected root cause spans more than one variable axis. Format: a markdown truth table with one row per cell, predicted outcome per cell, and the proposed fix annotated to the cell it directly addresses. Codify into `~/.claude/agents/senior-architect.md` under §Pre-Design Audit a new sub-rule "§Phase A.5 truth table (build infra)": when the failure mode involves *system × system* interaction (lockfile × runtime × arch × cache), enumerate the matrix before the first edit. Skipping is acceptable for single-axis failures (e.g. wrong env var name) but not for multi-axis (libc × lockfile-OS × cache-state).

---

## 2026-04-24 — K-049 Public-surface plumbing (architect brief, all-phases design)

**What went well:** §1 Pre-Design Audit ran `git show 1090e63:<path>` on all 4 files mentioned in PM handoff and immediately found that the PM brief's `backend/app/main.py` path did not actually exist at `1090e63` — correct path is `backend/main.py`. Without the base-commit dry-run, design doc §6.2 request-flow would have referenced the wrong path and Engineer would have hit a fatal error at implementation. Concurrently, §F's Bodoni usage grep confirmed zero consumers across `frontend/src` + `tailwind.config.js`, providing empirical evidence for the AC-049-BODONI-1 safe-to-remove claim, not just intuition. §0 BQ-049-ARCH-01 actively caught that the PM handoff brief wrote sitemap's 5th route as `/examples` (does not exist) vs ticket AC-049-SITEMAP-1 wrote `/business-logic` (exists); per `feedback_ticket_ac_pm_only.md` did not self-amend AC, flagged back to PM as BQ, design continued with ticket AC as SSOT. §7.4 Firebase Hosting file-serving vs rewrite priority adopted empirical baseline (backed by Firebase docs' documented priority) + Engineer post-deploy curl-probe guard, instead of hard-coding rewrite exclusion — shrunk the "possibly redundant" config to Known Gap + deployment-time verification, avoiding K-021-style silent config bloat.

**What went wrong:** §7.3 CSP policy string was written as "draft — Engineer implements verbatim" but the script-src list was best-guess (GA + googletagmanager are necessary; but whether `'unsafe-inline'` is required for Vite-emitted inline bootstrap script was not empirically verified). The correct approach should have been: produce a Phase 2a first-pass build, inspect inline script / style tags emitted in `frontend/dist/index.html`, decide each CSP directive item by item, then lock down the policy. The current "see violation after deploy, tighten and redeploy" written into §16 risk 2 effectively outsources the first-pass design work of CSP to the deploy loop — in tension with the §Boundary Pre-emption requirement to "complete boundary at design stage". Second-pass design iteration should run local `npm run build` + grep `dist/index.html` for inline script hash needs before Phase 2a commit, locking CSP to the minimum set that passes headless Chromium.

**Next time improvement:** CSP-class config design doc should not be marked "draft, Engineer verbatim"; should at design stage walk through (1) `npm run build` → (2) `grep -oE 'on[a-z]+="' dist/index.html` + `grep -oE '<script[^>]*>' dist/index.html` to list all inline handler / script → (3) author minimum CSP policy from these findings, deliver to Engineer the "verified zero-violation under headless Chromium" finalized version. Append this step to persona `senior-architect.md` for Firebase Hosting / CSP-class ticket pre-design checklist (location: §Boundary Pre-emption or new §Deploy Config Design Protocol sub-section), avoiding next ticket's first-pass CSP tuning being pushed to deploy loop again.

---

## 2026-04-24 — K-046 Phase 2 UI restructure + CORS env fix

**What went well:** §3 handler-removal ruling did not stop at "dead-code, just delete" — first ran `grep -n "uploadError\|setUploadError" /tmp/AppPage-4c873b3.tsx` confirming all 5 hits are within HISTORY-ONLY range (L143/299/310/452/455), zero crossover with `handleOfficialFilesUpload`, before issuing REMOVE; wrote this scope-critical verification into §3.1 table so reviewer/engineer can self-replay. §10.3 Pre-Design Audit found `handleHistoryUpload` L309 `setHistoryInfo(data)` is the post-upload refresh path, after REMOVE only `useEffect` initial fetch sets `historyInfo` — same §10.3 note paragraph explicitly states this behavior delta + AC-046-PHASE2-HISTORY-INFO-RENDERS only asserts initial fetch path, K-048 supplements post-upload refresh, so Engineer/Reviewer doesn't misjudge regression. §10.5 actively flagged existing `K-046-example-upload.spec.ts:81` `page.locator('label', { hasText: 'Upload History CSV' })` as stale anchor, gave Engineer specific T1/T2 updating + T3 removal directives, avoiding red tests appearing only at Phase 2b.

**What went wrong:** §4 `parseOfficialCsvFile` export decision initial draft mistakenly listed Option B (extract to `utils/parseOfficialCsvFile.ts`) as tied recommendation; re-reading AC-046-PHASE2-EXAMPLE-PARSE original text "imported from `frontend/src/AppPage.tsx`" only then realized the AC text already locked the import path, Option B would require AC change (Architect cannot change AC), auto-disqualified. This constraint should have been written at the top when listing the three options, not appended after scoring.

**Next time improvement:** options table should list "binding constraints from AC text / PM ruling" row before recommendation, making AC-locked paths explicit, avoiding tied scoring then disqualification. Already back-written to single-ticket Retrospective corresponding row.

---

## 2026-04-24 — K-046 Comment-out upload write path + example CSV download

**What went well:** Pre-Design Audit §1.3 drew a 6-row × 11-column OLD vs NEW truth table (full-overlap / strictly-later / partial-overlap / empty / first-boot / 1D-filename) with per-cell dry-run; Case E (first-boot mock fallback, N=0) directly pointed out that `existing[-1]['date']` would IndexError, §6 Phase 1 implementation order explicitly writes `existing[-1]['date'] if existing else None` guard — closing the boundary hole at design stage, not leaving it for Engineer to hit. §6 Phase 2 step 6 placement check found `<label>` wraps `<input type="file">`, if the new anchor is inserted inside `<label>`, click would trigger file picker rather than navigation — explicitly wrote "anchor must be sibling, not child, of `<label>`" hard gate. Sacred cross-check 7-pattern grep sweep (token-selector 4 + DOM-adjacency 3) all run, confirmed 0 collision with K-046 scope. §API invariance dual-axis (wire schema 0 diff + frontend observable per-case diff table) complete; ticket §Test Coverage Plan declared "minimum 2 pytest + 3 Playwright" vs §9 delivered 6 pytest + 3 Playwright aligned.

**What went wrong:** §5 Shared Component Inventory initial draft almost wrote "none" with one word; was pulled back by §§ consolidated-delivery-gate mental-check, then supplemented `grep -rn 'Download example' frontend/src/` + `grep -rn 'text-\[10px\] text-gray-500'` two lines of audit evidence. Inventory = none does not mean audit = skip; even if conclusion is none, evidence must be present.

**Next time improvement:** single-component-add ticket (scope only "add a page-specific DOM element") still requires actual Shared Component Inventory grep sweep with 0-hit pattern listed; codify this step into persona §Cross-Page Duplicate Audit triggering condition — not just "new component / new section / new page", but also "new single element JSX added to existing page". Already codified at end of this retro into persona path (memory rule: `feedback_shared_component_inventory_check.md` already covers; this run confirms practical trigger condition not limited to component level, element level also applies).

---

## 2026-04-24 — K-045 Desktop layout consistency

**What went well:** Pre-Design Audit phase fully executed Gate 1 file-truth-table (15 rows with `git show ef3519d:<path>` logs) + Gate 2 Cartesian product 18-row current-vs-target dry-run + Gate 3 §API invariance dual-axis (wire-level 0 diff + frontend observable delta table); K-031 Sacred `#architecture.nextElementSibling === <footer>` after writing §2.1 naïve component tree draft (reusing HomePage body+inner-flex-wrapper pattern), immediately self-checked the risk via DOM adjacency dry-run, switched to Option C (per-section self-contained container classes + margin-top rhythm) instead of body wrapper, preserving Sacred. BQ-045-02 Architect ruling used 12-dim decision matrix instead of intuition to deliver Option α (remove SectionContainer), ticket explicitly marked as Architect-ruled, not escalated to PM.

**What went wrong:** Ticket §4 AC-045-K031-ADJACENCY-PRESERVED references `about.spec.ts:386-403` but actual filename is `about-v2.spec.ts:387-404` (file does not exist + line numbers off-by-1). After grep confirmed, per `feedback_ticket_ac_pm_only.md` forbids self-amending ticket AC, flagged into §10 with BQ-045-ARCH-01 awaiting PM ruling; but only realized halfway through writing first-draft §2.1 component tree that K-031 adjacency conflicts with outer-wrapper pattern — counts as "design doc itself only hit Sacred when writing §2" reactive discovery, not §0 stage proactive identification. If Pre-Design Audit §0.4 had listed all regression-class Sacred as DOM-shape assertion table (selector + expected ancestor chain), it would have been first-time obvious that outer wrapper is unusable, would not have written naïve draft and then re-thrown it.

**Next time improvement:** Pre-Design Audit §0 add mandatory sub-item **§0.4a DOM-shape Sacred Assertion Catalogue** — list each regression-class Sacred for this ticket's corresponding DOM structural assertion (selector + ancestor chain + sibling adjacency), build the catalogue before §2 Component Tree; each draft of §2 Component Tree must do "is each assertion still valid" truth-table self-verification against this catalogue before entering §3. Codify into `senior-architect.md` §Pre-Design Dry-Run Proof Gate 2 extension clause.
---

## 2026-04-24 — K-044 README showcase rewrite design (PM scoped re-dispatch)

**What went well:** Challenge C3 feasibility pre-check ran again in PM's scoped re-dispatch — used `git stash` to save WIP, `git checkout 80e12d7 -- frontend/`, full `npm install` (no pre-existing node_modules, 126 packages), `nohup npm run dev`, `curl` observed `<body class="bg-gray-950">` + Google Fonts `IBM+Plex+Mono` dual signals confirming pre-K-021 state, kill pid, full restore via `git restore --source=HEAD --staged --worktree frontend/` + `git stash pop`. Did not rely on memory of prior session or design doc §1 record to default-pass — PM's C3 gate is a hard gate, every summons must run it again. Self-Diff Gate also ran strictly — `git diff --stat` got authoritative `32 insertions, 1 deletion = net +31 lines` matching the breakdown of Patch 1 (+10) + Patch 2 (+19) + Changelog (+2) + frontmatter (0) = +31 ✓ aligned, not just relying on design doc description as completion. frontmatter `updated:` also moved forward in same commit (2026-04-23 K-040 → 2026-04-24 K-044 + K-040 demoted to upstream context), no missed sync rule.

**What went wrong:** First-pass migration plan instinct was "all 5 blocks moved into architecture.md", later in cross-check found 4/5 already fully covered by existing architecture.md sections (Tech Stack, Frontend Routing, API Endpoints, Data Flow call-chain, Consensus Stats SSOT), only Deployment Architecture is the real gap. Without running `grep -n '^## ' agent-context/architecture.md` against README section list diff, design doc would have made Engineer write same content into architecture.md again, causing the duplicate-ownership drift K-034/K-039 lessons most fear. This pass 1 miss is not a technical error, but a workflow ordering error — should have "audit before plan".

**Next time improvement:** docs-migration class ticket design doc, before writing migration plan, must run a "target doc `grep -n '^## '` vs source doc section list" diff — mark overlapping parts as `already-covered` first, then decide which are gaps to patch. Codify into senior-architect.md §Architecture Doc Sync Rule nearby: docs-migration ticket forced to present coverage-audit table in design doc §N, cannot just write "move to X". This session has implemented this rule in K-044 design doc §3.1 + §10.7 with 8-row coverage-audit table (although memory/persona edit is out of worktree scope, needs to wait for meta-edit session to sync).
---

## 2026-04-23 — K-040 Item 1 sitewide typography reset design

**What went well:** Designer memo's 36-row per-site calibration table + QA-040 Early Consultation 6 Q's all already PM-landed into AC, when establishing Route Impact Table 5 routes × multi-component, almost all data has single source to reference, no need to re-judge in Pencil or Figma; Pre-Design Audit on 4 "pre-existing" shared component mono assertions all empirically passed via `git show HEAD:<path>`, no impressionistic substitution.

**What went wrong:** Ticket §2 AC And-clause 8's grep pre-count "1" for `"Bodoni Moda"` string literal was found at §6 Pre-Design Audit stage to potentially under-count — `timelinePrimitives.ts:30`'s `'Bodoni Moda, serif'` would be hit by ticket's grep pattern but ticket only writes "1". Did not immediately write BQ to PM, instead recorded in §6 as "⚠ clarifying observation", letting Engineer re-grep reconcile at impl time, equivalent to kicking PM's judgment to Engineer; this does not match "Architect surface ambiguity for PM ruling" Scope Question Pause Rule.

**Next time improvement:** When discovering ticket AC hard-coded number ≠ self-verified grep number (even if it might be a counting definition issue), immediately write §0 Scope Question back to PM, do not self-rationalize with "Engineer will re-grep at the time". Codify this into `senior-architect.md` §Scope Question Pause Rule's triggering condition: "AC hard-coded number ≠ self-verified grep number" also belongs to scope inconsistency case that must pause.

---

## 2026-04-23 — K-034 Phase 3 — /diary shared Footer adoption design doc

**What went well:**
- §1 Pre-Design Audit used `git show HEAD:<path>` + Read combo to verify 11 source files' current state (DiaryPage / Footer / 3 spec files / 3 ticket files / 2 doc files / architecture.md), each row of truth table corresponds to specific L<n> line numbers in subsequent §5 File Change List; complies with persona §Pre-Design Dry-Run Proof hard gate. §1.3 Pre-existing claims cited 3 entries (Footer prop-less / DiaryPage root wrapper full-bleed / HomePage ancestor padding INHERITED), each with `git show HEAD:<path>:L<n>` citation, no bare Read dependency.
- §3.1 DiaryPage Footer placement three-option scoring table (A root div sibling / B inside main / C per-branch) using 5-dim scoring with overwhelming A > B > C, Option A directly corresponds to AC original "last sibling under the page root", no post-hoc tiebreaker. §3.2 sitewide-footer.spec.ts refactor also ran α vs β comparison, Option α directly corresponds to AC original "route loop".
- §7.1 Known Gap BQ-034-P3-04 (`shared-components.spec.ts` T4a `/app — no Footer` HEAD does not exist but AC references) actively discovered and flagged to PM, with three options no self-decision — complies with persona §Scope Question Pause Rule + `feedback_ticket_ac_pm_only.md`. Design doc other content continued to deliver because BQ-034-P3-04 is non-blocker (does not affect implementation of the other 6 ACs).
- §13 §API invariance dual-axis: wire-level `git diff main -- backend/ frontend/src/types.ts frontend/src/types/diary.ts` = 0 diff, plus frontend observable 4-row class (full-set / subset / empty / boundary) all behaviorally equivalent and Footer is additive; complies with `feedback_architect_pre_design_audit_dry_run.md` K-013 dual-axis hard gate.
- architecture.md 3 structural Edits (Frontend Routing `/diary` row / Footer placement strategy `/diary` cell / Shared Components boundary Footer row) + Changelog prepend + frontmatter `updated:` 4 places same commit; Self-Diff Verification `grep "Footer\|/diary"` swept 23 hits all classified (current-state edits consistent, historical Changelog preserved, Directory Structure L180 historical comment unchanged), complies with persona §Same-File Cross-Table Sweep + §Pre-Write Name-Reference Sweep.

**What went wrong:**
- §7.1 Known Gap BQ-034-P3-04 was correctly flagged to PM, but ideally should have surfaced at §0 Scope Questions — persona §Scope Question Pause Rule requires "stop on AC vs code contradiction discovery". This run only surfaced at §7.1 because pre-design audit §1.1 only grepped existing spec files' structural locations, did not cross-check whether each test id / describe name referenced in the AC exists in the corresponding spec file at HEAD. Result: design doc already delivered but BQ awaits PM ruling; if discovered at §0, could have been fixed in same session after PM ruling, saving one round trip.
- §10 Architect self-diff claimed `shared-components-inventory.md` requires no Edit because "already pre-edited in ex-K-038 PM phase" — this assertion was based on single Read verification (line 27 has `/diary` + footnote, line 36 `/diary` bullet struck-through), without `git show HEAD` explicit verification that the Edit has entered HEAD vs WIP. Actually verified (inventory.md is HEAD file, single Read is truth), but persona §Pre-Design Audit requires "any pre-existing assertion must `git show HEAD:<path>:L<n>`"; this is a narrow boundary case (inventory not referenced as pre-existing behavior, but asserted as "already pre-edited"), not within hard gate scope but worth recording.

**Next time improvement:**
- §0 Scope Questions / Pre-Design Audit expand scope: when ticket AC references specific test id (T1 / T4 / T4a etc.), describe name, specific LN within spec file, pre-design audit §1.1 truth table must verify each reference via `grep -n "<test-id>" <spec-file>`; missing one becomes §0 Scope Question. With this rule, BQ-034-P3-04 (T4a does not exist) would have surfaced at §0 instead of §7.1, saving one round. Action: `senior-architect.md` §Pre-Design Dry-Run Proof add 4th gate: "AC-referenced test-id verification: every test id / describe name cited in ticket AC must be grep-verified in its claimed spec file at HEAD; absent ones surface as §0 Scope Question, not §Boundary Pre-emption Known Gap".

---

## 2026-04-23 — K-034 Phase 2 — /about full Pencil SSOT audit design doc

**What went well:**
- §1 Pencil SSOT Read Gate `PASS` first ran `ls -l` to verify all 7 JSON + 9 PNG file existence + byte size, not relying on Designer retro verbal claim; Manifest `about-v2-manifest.md` also read for verification. Complies with persona §Pencil Artifact Preflight hard gate.
- §3 27-row Drift Truth Table, each row mapped to ticket §5 PM ruling verbatim, schema (section | node-path | property | pencil-raw | pencil-normalized | code-raw | code-normalized | drift | resolution) matches BQ-034-P2-QA-02 PM ruling; 23 rows code-side each linked to §7 Step number + AC number.
- §6.3 FileNoBar as new primitive vs CardShell extending props selection ran formal scoring matrix (cohesion/coupling/blast-radius/reuse) Option B 8.5 > Option A 6.5; avoids Tiebreaker post-hoc problem (K-021 case). cardPaddingSize prop explicit "follows CardShell size to prevent silent drift" actively pre-closes invisible coupling.
- §10 architecture.md sync plan first drafted Edit scope before execution, Pre-Write name-reference sweep grep `DossierHeader|FileNoBar|K-034 Phase 2` classified hits to current-state vs historical, L19 / L671 K-022 historical Changelog correctly preserved unchanged.

**What went wrong:**
- Prompt summary said "17 new AC" but ticket §5.1 actually lists 19 `####` AC headings. Architect after checking recorded as BQ-034-P2-ARCH-01 in §12 Risks but continued design (because all 19 are covered in drift table / Step, no blocker). But more compliant practice: stop at §0 Scope Questions, ask PM to confirm number (17 vs 19, whether to amend ticket summary to align with §5.1), complies with persona §AC Sync Gate "only PM can change AC" spirit; this run with Risk record + continue design is borderline judgment, not violation but not best practice.
- After reading Pencil frame JSON file by file and writing Bodoni font-size into §3, several MetricCard title fontSize was 22 vs 28 "per-card differentiation" (m1/m3/m4 = 22; m2 = 28), §3 row D-2 recorded as "Bodoni 22/28 italic" summary form but did not expand each card's granular value into FileNoBar or MetricCard §2.1 sub-table; Engineer needs to re-read frame JSON at impl to get per-card exact value. Better is to list per-m1..m4 Pencil-verbatim token values as MetricCard dedicated sub-table (similar to §6.2 FileNoBar spec table), letting Engineer implement single-read design doc without JSON lookup.

**Next time improvement:**
- Design doc when writing multi-variant same-type cards (m1/m3/m4 vs m2 differences, 6 RoleCard, 3 PillarCard, 3 TicketAnatomyCard, 3 ArchPillarBlock), if Pencil values differ per-variant, must include per-variant token value table in §6 or §7; cannot only use vague reference "see frame JSON". Action: senior-architect.md §Visual Spec JSON Consumption Gate add: "per-variant values: when a component is rendered N times with different Pencil values, design doc must include an N-row token table with pencil-verbatim values; cannot defer to JSON lookup by Engineer".
- AC count inconsistency (prompt summary vs ticket §5.1) "continue or pause" borderline judgment, next time encountering difference ≥ 2 (this run 19 vs 17 = diff 2) directly go §0 Scope Questions stop ask PM, do not continue + Risk record. Action: senior-architect.md §Scope Question Pause Rule add "ticket AC count vs prompt / summary diff ≥ 2 means pause" explicit numeric threshold.

---

## 2026-04-23 — K-037 (favicon wiring — architect-ruling only, no design doc)

**What went well:**
- PM pre-recommendation sufficient (7 rationale points, File Change Scope frozen, 5 technical questions clearly separated as "Architect decides" rather than mixed with PM decisions), Architect side directly entered §Triage path instead of re-deriving rationale; avoided K-011 historical pit of "no architecture needed but doc has drifted" without prior grep.
- §Triage grep hits 2 lines both `dist/index.html` (SPA fallback) and Google Font preconnect, none describing favicon/manifest — directly confirms K-037 is net-add, single-line Changelog is the correct treatment path, no need to change Directory Structure or Frontend Routing sections.
- Q1 link tag order / Q3 `display: browser` / Q4 no firebase headers / Q5 theme-color = `#F4EFE5` all 5 questions given binding concrete values rather than "depends", each with rationale, complies with persona §Never Do "never leave boundary blank spots".

**What went wrong:**
- This run's ruling path itself was smooth, but brief's "capability disclosure" + "exempt from designer JSON+PNG gate" organizational decisions are PM-consumed in advance; if future direct ticket from main session without brief, Architect needs to self-judge whether exempt `feedback_designer_json_sync_hard_gate`, currently persona has no clear clauses for this "non-page iconographic artwork" edge case, only K-037 as case.

**Next time improvement:**
- In `senior-architect.md` §Visual Spec JSON Consumption Gate add: "non-page-class iconographic artwork (favicon / app icon / logo-as-image-file) exempt from `specs/*.json` requirements, but ticket frontmatter must explicitly state `design-locked: pending — human side-by-side review` + point to Pencil source file path". Once this rule lands, future similar tickets do not need ad-hoc exception "PM consumed in advance" each time. **Action:** Open Tech Debt / pending persona rule (K-037 close or next architect session, PM decides whether to land).
- K-037 has 5 Q's all Architect can rule, but if any Q needs PM arbitration (e.g. Q3 changing to `standalone` would extend AC), persona §Scope Question Pause Rule's format (§0 Scope Questions) has no example for "brief format". This run did not trigger, but next similar context, Architect should put Q into brief's independent §Scope Questions block instead of mixing in §Architect Ruling.

---

## 2026-04-23 — K-034 Phase 1 — Design doc §8 Sacred cross-check coverage gap (Reviewer-surfaced)

**What went well:** BQ-034-P1-01 (/about GA Sacred vs Pencil) actively surfaced as blocker — actually represents §8 Sacred cross-check is complete in K-017/K-018/K-022 three Sacred dimensions.

**What went wrong:** §8 Sacred cross-check table missed two classes of Sacred:
1. **K-031 AC-031-LAYOUT-CONTINUITY + AC-031-SECTION-ABSENT** — §4.3 Option A removing `<SectionContainer id="footer-cta">` wrapper would also invalidate `about-v2.spec.ts` L373-382's `#architecture.nextElementSibling.id === 'footer-cta'` assertion. This downstream DOM-id dependency does not appear in §8 table 9 row's K-031. Engineer's first Playwright run failed, self-adjudicated as pure selector upgrade (Reviewer verified as legitimate pure refactor), but procedurally Architect should grep this out as downstream impact in §8 Sacred table early on, not Engineer discovering at red.
2. **AC-018-PRIVACY-POLICY GA disclosure vs Pencil SSOT** — §8 last row mentions AC-018-PRIVACY-POLICY "Passes as-is", but did not list GA disclosure `<p>` node not in Pencil frames (86psQ + 1BGtd `children.length = 1`) as AC-vs-Pencil structural conflict. Reviewer Pencil parity gate first practical run surfaced as Critical #C1, forcing PM to open `design-exemptions.md` §2 REGULATORY category on the spot. If Architect listed as BQ-034-P1-02 at design time, PM could rule before releasing Engineer instead of discovering at Review stage.

Root cause: senior-architect.md §Sacred cross-check current filter strategy is "grep ticket ID prefix (K-017 / K-018 / K-022)", but Sacred is not limited to "originally owned by who, the file modified by this ticket" — also includes "JSX structure/DOM `id` modified by this ticket asserted by who in E2E spec" reverse dependency. K-031 AC-031 is exactly this downstream-dependency-class Sacred, ticket ID prefix grep cannot find (K-031's spec file is `about-v2.spec.ts`, indirect relation to JSX wrapper id modified by this ticket).

**Next time improvement (Edit senior-architect.md persona at Phase 1 close):**
1. **Expand §Sacred cross-check pre-grep range** (originally has `data-testid="cta-"` + `trackCtaClick(` + `target="_blank"` + `href="mailto:"` four items, intent to add at K-034 Phase 1 close — expand two new items):
   - `nextElementSibling.id\|previousElementSibling.id\|.closest('#.*')\|querySelector('#` — any spec on JSX `id` cross-node DOM-adjacency assertion
   - `querySelectorAll('[id=` / `parentElement.id` / `#<id-regex>.nextElementSibling` etc. variants
2. **Pencil-vs-Sacred AC conflict matrix mandatory** — for any design doc `visual-delta: yes` and ticket-modified component has any Sacred AC constraint, §8 Sacred cross-check table must add column "Pencil SSOT for this Sacred AC asserted node / property has corresponding frame.children node Y/N". Any row that column = "NO / PARTIAL" lists as BQ-escalate-to-PM rather than self-resolving implicitly in design doc NEW column.
3. Both improvements will be Edit-ed into `~/.claude/agents/senior-architect.md` §Sacred cross-check at Phase 1 close, merged with the original 4 grep pre-ACCEPT'd by BQ-034-P1-01 §PM ruling into a complete persona addendum.

---

## 2026-04-23 — K-034 Phase 1 — Footer variant retirement design

**What went well:**
- Pencil Artifact Preflight landed before any design-doc writing — verified `frontend/design/specs/home-footer.json` + `about-footer.json` + PNGs exist at HEAD, satisfying the K-034 Phase 0 `feedback_architect_no_design_without_pencil.md` gate on its first real-use ticket.
- Caught GA Sacred cross-conflict as BQ-034-P1-01 rather than silent-retiring the `data-testid="cta-email-contact"` + `trackCtaClick('email-contact', ...)` path that K-017 marked Sacred; escalated to PM per `feedback_ticket_ac_pm_only` + `feedback_pm_ac_pen_conflict_escalate` instead of deciding in design doc.
- Design doc §3 Route Impact Table enumerated all 5 routes (`/`, `/about`, `/diary`, `/app`, `/business-logic`) with affected / must-be-isolated / unaffected markers, matching `feedback_global_style_route_impact_table` hard gate for the shared-component retirement scope.

**What went wrong:**
- First-pass draft recommended Option B on GA handling silently (retire `trackCtaClick` because "Pencil footer spec has no tracking attribute") — reviewing `feedback_ticket_ac_pm_only` + `feedback_pm_ac_pen_conflict_escalate` on second pass forced reclassification into BQ-034-P1-01 for PM ruling. Root cause: Architect instinct on refactor tickets is "simplify by dropping non-Pencil attributes"; Sacred invariant cross-check happens late in the pass rather than as a first-line grep.
- No pre-existing persona rule required Architect to grep `data-testid="cta-"` + `trackCtaClick(` + `target="_blank"` + `href="mailto:"` against the files slated for retirement/replacement before recommending an option, so GA-side collisions only surfaced during §API invariance proof write-up after option scoring had already been drafted.

**Next time improvement:**
- Per PM ruling on BQ-034-P1-01 (§PM ruling in K-034 ticket): for refactor tickets touching `<a>` elements or CTA components, Architect first-pass must run a fixed grep sweep on `data-testid="cta-"` + `trackCtaClick(` + `target="_blank"` + `href="mailto:"` across `frontend/src/` + `frontend/e2e/`, list each hit with its Sacred-status (K-017 / K-024 / K-030 etc.), and include the sweep output as a new §Sacred Cross-Check row **before** drafting option-scoring matrix. Codify as persona addendum in `senior-architect.md` at Phase 1 close — GA-type collisions surface in first pass instead of second, matching the spirit of `feedback_pm_ac_sacred_cross_check` already in place for PM but not yet for Architect.

---

## 2026-04-23 — K-034 Phase 0 (BFP Round 2 for K-035 α-premise failure)

**What went wrong:**
- K-035 design doc (`docs/designs/K-035-shared-component-migration.md`) §0 BQ-035-01 scoring matrix declared "Pencil fidelity: α=10, β=10, γ=0" with narrative rationale "Option α preserves both frames 4CsvQ + 35VCj — both render their own designs". The "both render their own designs" predicate was **asserted from memory of prior /about CTA-block perception**, not verified by `batch_get` on the two frames before scoring. Post-K-035 main-session `batch_get` on frames `86psQ` (/about footer) + `1BGtd` (/home footer) returned byte-identical content: one text node `yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn` in Geist Mono 11px. Pencil SSOT has ONE footer design, not two; the α-premise was empirically false and the correct ruling was γ (sitewide unify, no variant).
- Root cause of miss: existing `feedback_architect_pre_design_audit_dry_run.md` hard gate (K-013 2026-04-21) covered (a) `git show <base>:<file>` code-level dry-run for "pre-existing" / "API invariance" assertions and (b) backend-schema + frontend-observable dual-axis — but did **not** cover "Pencil frame **content parity** across frames cited in option-scoring matrices". Architect listed frame IDs `4CsvQ` / `35VCj` in design doc header and in §0 narrative, but the persona rule did not require retrieving each frame's text/children nodes to verify narrative claims about "what each frame renders". No gate required option-scoring "Pencil fidelity" scores to be backed by `batch_get` output + `get_screenshot` PNG **embedded as evidence block in the design doc itself**; narrative assertion was accepted as sufficient.
- Compounding: Q6a "design locked = PM sign-off on Designer visual deliverable" did not yet exist as a persona rule — Architect started scoring options before Designer delivered any cross-frame content-parity artifact, so there was no upstream artifact to read. The whole "design locked → Architect starts" sequencing gate was missing from persona flow.

**Next time improvement:**
- **Structural fix (Q7c, §3 of K-034 ticket) — hard persona rule:** Architect may not produce a design doc for any route/page whose design is not represented by a corresponding Pencil frame exported to `frontend/design/specs/*.json`. No Pencil frame present → Architect escalates to PM (pushes back to Designer first), does not proceed with logic-only / parallel / "design catches up" path. To be codified into `senior-architect.md` during K-034 Phase 0 as a new top-level mandatory section alongside existing Pencil Frame Completeness Check.
- **Pre-Design Pencil Content-Parity Dry-Run (upgrade of existing `feedback_architect_pre_design_audit_dry_run.md` from code-level to code + Pencil content-parity dry-run):** whenever the design doc scoring matrix or narrative cites ≥2 Pencil frames as distinct/equivalent, Architect must (1) run `batch_get` on each cited frame including full children/text subtree, (2) embed the retrieved JSON (or Designer-produced `frontend/design/specs/*.json`) verbatim into the design doc as evidence block, (3) produce a cell-by-cell content-parity truth table across frames (font family/size/weight, text string, layout direction, padding, gap, color), (4) only then score "Pencil fidelity" per option. Narrative claims of "both render their own designs" / "frame X preserves K-017 CTA" without embedded `batch_get` + truth-table evidence are invalid and block design-doc delivery.
- **Maps to upcoming memory file `feedback_architect_no_design_without_pencil.md`** (K-034 Phase 0 deliverable 6), which will codify both the Q7c "no Pencil = no design doc" hard stop and the content-parity evidence-block requirement as a single combined gate. Existing `feedback_architect_pre_design_audit_dry_run.md` will be cross-linked (extended scope, not replaced).
- Post-K-034 Phase 0, all future option-scoring matrices that cite Pencil fidelity must carry a new mandatory sub-section `### Pencil Content-Parity Evidence` with the `batch_get` output block + truth table; Reviewer Step 2 Pencil-parity sub-step (Reviewer-side memory file) will reject design docs missing this block.

---

## 2026-04-22 — K-035 Phase 3 design-doc second-pass (/business-logic scope clarification sync)

**What went well:**
- PM scope-clarification loop caught the missed cross-section refs before Engineer release — design doc overall consistency was completed before Engineer step 1, system integrity preserved, no stale `/business-logic` AC-verified text spilled over to spec implementation or verification table.

**What went wrong:**
- First-pass design doc made 30+ references to `/business-logic` (§0 BQ ruling, §5 Route Impact Table, §6 EDIT list, §7 spec note, §8 QA visual, §9 Step 3, §11 architecture.md mapping, §13 Pre-Design Audit, §15 AC↔Test cross-check), when PM later ruled `/business-logic` as technical-cleanup-only, main-session first-round scope-update pass missed 4 non-obvious cross-sections:
  1. §8.3 L473 `(4 cases)` — test count literal
  2. §9 Step 7 L547 `new 4 cases pass` — Engineer gate language
  3. §6 EDIT #14 L667 Changelog pre-written text's `4 cases: ... /business-logic assertion ...` enumeration
  4. §15 AC ↔ Test Case Count Cross-Check entire section (L789 / L791 / L795 / L802–803 / L805 five locations) listing `/business-logic` as AC-035-NO-DRIFT sub-test + declaration `4 = 4 = 4`
- Root cause: these locations are scattered across "pre-written architecture doc Changelog", "Engineer gate number literal", "AC ↔ test count hard gate table" three sections, not obvious locations directly hit by route-name grep; scope-update relied on reviewing `/business-logic` keyword but missed "number literal `4 cases` itself also needs to be recalculated" this independent dimension. Architect first-pass already wrote §7.1 exclusion note and §8.4 visual placeholder for `/business-logic` — but §15 AC↔Test hard gate table's count math was not synchronously recalculated, causing §7.1 = 3 cases vs §15 = 4 cases internal contradiction.

**Next time improvement:**
- Add Architect Post-Design Sweep hard step: "When any spec row or AC cell is marked as `technical-cleanup-only` / `unaffected` / `must-be-isolated`, immediately grep the entire design doc for that route name occurrence audit, each occurrence cross-referenced against the route's status cell for semantic consistency."
  - Specific steps:
    1. After first-round design doc is complete, run `grep -n "<route-name>" <design-doc>` for each non-standard-status route
    2. Classify each hit: AC-verified / technical-cleanup-only / exclusion-note / audit-reference / table-row
    3. Any hit classification inconsistent with the route's authoritative §5 Route Impact Table status cell → fix or add exclusion comment
    4. Simultaneously cross-check any test case count literal (`N cases` / `N tests` / arithmetic like `+N` / `= N`) across §7 / §8 / §9 / §15: §7 authoritative number, §15 AC↔Test hard gate, §8 Playwright gate, §9 Engineer step all need to align
- This improvement is codification candidate; this round used surgical consistency pass without modifying `senior-architect.md` persona, leaving for main session or retrospect skill to decide whether to codify after Phase 3 closed (possible locations: under Same-File Cross-Table Consistency Sweep new §Route-Status-Change Trigger sub-clause, or under AC ↔ Test Case Count Cross-Check new §Cross-Section Count Literal Sweep sub-clause).

---

## 2026-04-22 — K-035 Phase 3 design — shared Footer migration + shared-component canonical registry

**What went well:**
- OQ-1 α/β/γ variant selection used formal weighted scoring matrix (Pencil fidelity 0.25 / behavior equivalence contract 0.25 / drift resistance 0.20 / maintenance cost 0.15 / visual change 0.15), α 9.7 vs β 6.25 vs γ 5.3, gap 3.45 no tiebreaker needed; no post-hoc scoring or PM rebound, weights declared before scoring complies with Pre-Verdict Tiebreaker Pre-listing Rule.
- §3 OLD-vs-NEW behavior-diff table 17 cells per-cell dry-run (DOM tag / container class / content / link href / GA tracking / `data-testid` × home/about two variants), 17 equivalent / 0 divergent, Pure-Refactor Behavior Diff hard gate passed via enumeration rather than summarization.
- §13 dual-axis API invariance proof simultaneously covers (a) wire-level schema diff (`git diff main -- frontend/public/diary.json` + types/ = 0 lines) and (b) frontend observable behavior diff 4-row (homepage full / about full / business-logic full / /diary empty), closes K-013 C-1 single-axis hole.
- §5 Route Impact Table covers all 5 routes (`/` affected / `/about` affected / `/business-logic` affected / `/diary` unaffected no-footer / `/app` must-be-isolated K-030 Sacred), each row attached "is this ticket touched" + "Engineer visual verification step", aligns with `feedback_global_style_route_impact_table.md`.
- Props interface required + no default explicitly refuses silent drift (`variant: 'home' | 'about'`, all three import points must explicitly pass value), avoiding Engineer adding default for convenience and letting future new routes default to wrong variant.
- `components/shared/` directory as sitewide page-level chrome canonical registry explicitly named (not `common/`, not `primitives/`), first occupant Footer, simultaneously opens TD-K035-01 to track UnifiedNavBar follow-up migration, instead of expanding scope in this ticket; architecture narrative cleanly separates "this ticket does" vs "follow-up ticket does".
- architecture.md Self-Diff: Footer placement strategy table 3 rows, Shared Components boundary table 2 rows (merged from 3 rows), Directory Structure 3 places (L160 FooterCtaSection pending deletion / L175 new shared/ block / L455 /app row HomeFooterBar → Footer), Changelog prepend — 5 Edits all per-cell against source, `grep HomeFooterBar|FooterCtaSection` 7 hit classified (current state / Changelog historical) all verified.

**What went wrong:**
- §4 Pencil node ID references (`4CsvQ` homepage footer / `35VCj` /about footer subtree) should have used `mcp__pencil__batch_get` for verification, but Pencil MCP showed `No such tool available` in this session, switched to K-021 design doc §Appendix + K-035 ticket §Evidence existing node references as secondary source; if Pencil node structure changed before K-035, secondary source would be inaccurate. Engineer Step 1 should add a pre-implementation step "After Pencil MCP available, re-run batch_get to re-verify `4CsvQ` + `35VCj` DOM structure still matches this design doc".
- Initial Phase 3 re-engagement spent more context rebuilding K-017 / K-021 / K-022 three tickets' Footer historical state (three tickets' accumulated Sacred clause + K-021 drift-preservation test + K-022 link style mandate); if previous Architect retrospective log had cross-ticket "Sacred clause table", would save much re-reading; this is downstream improvement, not delivery gap of this run.

**Next time improvement:**
- **Pre-Write Name-Reference Sweep** (new behavior rule, already synchronously Edit-ed into `~/.claude/agents/senior-architect.md`): any architecture.md Edit involving "rename / delete / replace" class operation (e.g.: `HomeFooterBar` → `Footer`, `FooterCtaSection` → disappear), after Edit completion before Self-Diff Verification must run `grep -n "<old-name>\|<new-name>"` on same file, list all hits classified as "current state (needs sync Edit)" vs "Changelog historical (cannot Edit)" vs "other tables (needs sync)"; if classification "current state" has missing hits → supplement Edit; "other tables" has missing hits → expand Edit to cover all → before entering Self-Diff. This run L455 `/app` row was almost missed (only because final smooth sweep caught it).
- **Sacred clause retirement requires explicit registration**: K-021's `/about preserved FooterCtaSection (locked by K-017)` was retired in K-035 design, this design doc §2 has retired Sacred table written, but retrospective log simultaneous record allows future any ticket grep "retired Sacred" to find together; from next ticket Architect persona adds "Sacred retirement Edit architecture.md Changelog write retired: K-XYZ some clause (originally locked by K-ABC)" as hard step.
- **Pencil MCP unavailable fallback SOP**: When encountering `No such tool available`, use "most recent ticket that read Pencil node ID + that ticket's design doc reference" as secondary source, and mark in this design doc §4 with red text "Pencil MCP unavailable for this session, Pencil node references are secondary source (last verification: K-XXX on YYYY-MM-DD), Engineer Step 1 must re-run batch_get"; avoid not explicitly marking which would let downstream assume nodes were just verified.

---

## 2026-04-22 — K-029 /about card body text paper palette migration

**What went well:** Pre-Design Audit verified ArchPillarBlock + TicketAnatomyCard with worktree fully consistent via `git show main:<file>`, confirmed 7 sites no omissions; §13 Boundary Pre-emption self-check caught `testingPyramid` as optional props, `arch-pillar-layer` actual DOM count is 3 (Pillar 3 contains Unit/Integration/E2E three layers), not 9 (three Pillar × three layers) nor 1, design doc explicit avoiding Engineer mistakenly writing `toHaveCount`.
**What went wrong:** First-draft §6.2 only listed `data-testid` injection 4 items, did not in same table simultaneously explain Outcome / Learning label selection path (from `ticket-anatomy-body` down `locator('span', { hasText })`), pre-§15 AC↔Test Case check did not supplement; AC says 3 Outcome + 3 Learning each independent assertion, if not specifying selector Engineer might custom testid violating Architect mandate. Pre-delivery supplemented §6.2 Note paragraph for completion.
**Next time improvement:** Future mandate testid design, for all elements under same AC needing assertion (including testid + non-testid selected sub-elements), list selection path all at once, do not split into two stages. Add "Assertion selector matrix: target-element × selector-path × toHaveCount" as §6 mandatory sub-table.

---

<!-- New entries prepend above this line -->

## 2026-04-22 — K-024 /diary structure rework + diary.json flat schema design (all 4 Phases)

**What went well:**
- All-Phase coverage gate hard-held: design covers Phase 1 (schema + zod + Vitest) / Phase 2 (useDiary reshape + useDiaryPagination hook) / Phase 3 (/diary v2 visual rework + DevDiarySection reshape) / Phase 4 (PM persona edit), no "supplement Phase 3 later" gap left. §16 All-Phase Coverage Gate table 4 rows all ✓, Engineer takeover has full picture not just first two Phases.
- Pre-Design Dry-Run Proof: §0.3 drew complete 3×3 truth table for `useDiary(limit)` (limit=undefined / 0 / N × data 0/N/N+ entries), and cited `git show main:frontend/src/hooks/useDiary.ts` to verify OLD branch behavior; avoiding K-013 C-1 same-class pre-existing misjudgment.
- Cross-Page Duplicate Audit really done: §9 grep `rail|marker|timeline` three patterns, identified DevDiarySection + DiaryEntryV2 + DiaryRail + DiaryMarker four files share rail/marker pattern, extracted `timelinePrimitives.ts` constants module, explicitly wrote RAIL / MARKER / ENTRY_TYPE three exports, avoiding homepage vs /diary drift.
- BQ stays in role: `homepage-diary-entry` literal vs K-028 Sacred `diary-entry-wrapper` conflict written as BQ-024-01 three options + Architect recommendation (a) rename-with-Sacred-update, explicit "Phase 2 startup blocked awaiting PM ruling", does not self-decide, does not Edit ticket AC.
- AC ↔ Test Case count Cross-Check: §7.3 mapping table 8 rows + 33 test total + declaration "Playwright new test total: 33" three numbers consistent, Engineer at delivery time `wc -l test(` = 33 directly verifiable.
- 1-entry rail boundary capture: §4.3.1 identified entries.length=1 when rail `top:40 / bottom:40` would collapse (under 48px min-height), explicitly defined `entries.length >= 2 && <DiaryRail />` conditional render, avoiding orphan rail line.

**What went wrong (root cause + why design phase almost missed):**
- §6.4 data-testid conflict initial draft mistakenly recommended (C) dual data-testid attribute, second pass realized HTML spec forbids duplicate attribute names. Root cause: when AC literal vs Sacred spec conflicts, reflexively thought "both coexist" without first checking HTML spec. Same-file cross-attribute check should be the first step in §data-testid section. BQ-024-01 thus rewritten twice.
- Pencil MCP still unstable in this ticket, but not first time used in K-024: this ticket already knew `.pen` = JSON can fallback, still spent time confirming MCP status. K-028 retrospective already mentioned this. Should have directly JSON parse one step earlier.
- Design doc 24 + 8 + 3 = 35 file change scale on the larger side, one ticket contains 4 Phases. Although All-Phase Coverage Gate requires full coverage, Phase 3's 24 file changes + 2 spec + 8 fixtures + delete 3 files, Engineer impl + Reviewer audit pressure concentrated. Phase 1+2 / Phase 3 split PR is §13 mitigation, but ticket itself should originally have been split finer at PM (Phase 3 might be independent ticket K-024-B). This is PM responsibility, but Architect can actively flag "suggest split" at design time rather than only splitting PR.

**Next time improvement:**
1. **HTML spec sanity check for testid conflicts (first pass, not second pass)**: any `data-testid` AC literal conflicts with existing Sacred value → first verify HTML spec allows duplicate attribute (forbidden) → directly skip dual-attribute option. This behavior rule should be added to `~/.claude/agents/senior-architect.md` as §Testid Conflict Resolution sub-rule; if K-025 same class recurrence then codify, otherwise temporarily retain in retrospective.
2. **Pencil MCP fallback becomes reflexive**: this retrospective itself no longer mentions MCP status, directly `.pen` JSON parse. This behavior already mentioned in K-028 retro, still violated → this entry codified into persona: Pencil MCP connection failure or `batch_get` error → immediate Python traversal JSON, do not wait for user reminder.
3. **Design doc scale > 1000 lines or 4+ Phase → Architect actively reports PM suggesting split**: not just split PR, design doc itself if exceeding threshold (line count / Phase count / file change count) is ticket-too-large signal, should add §0 Scope Question "suggest split into K-XXX-A + K-XXX-B" to let PM decide before Phase Gate. This behavior rule candidate, observe one round at K-025 then decide whether to codify persona.

**BQ-024-01 resolution:** PM ruled Option (b) 2026-04-22 — K-024 AC literal `homepage-diary-entry` renamed to `diary-entry-wrapper` (reuse K-028 Sacred). PM rationale: K-028 closed + deployed + live CDN bundle grep-verified contains `diary-entry-wrapper` → Sacred immutability is absolute; AC literal edit is PM-owned (`feedback_ticket_ac_pm_only`) and cheapest. Architect's initial (a) rename-Sacred recommendation was wrong primary — should have ordered (b) → (c) → (a) with (a) flagged "requires Sacred-break PM override". Lesson codified in `docs/designs/K-024-diary-structure.md` §20 "Next time improvement" item 1 (deployed Sacred + conflicting AC literal → primary rec is AC literal edit). Will promote to `~/.claude/agents/senior-architect.md` if pattern recurs in K-025+.

---

## 2026-04-22 — K-025 UnifiedNavBar hex→token + dual-rail spec upgrade

**What went well:** Pure-refactor implements "behavior equivalent at rendered-color level, NOT at CSS-selector level" layered narrative (aligns with QA Early Consultation Q1 correction): §5 Behavior-diff Statement 3 bullets each handle rendered-color / selector-name / props-logic three layers, avoiding K-021 Q2 ruling-time mistakenly stated "compiled CSS identical" recurrence. §7 Step 2 / Step 5 designed as `npm run build` before/after dist CSS declaration count diff gate, letting QA Q1 dist grep equivalence land from AC text into pipeline executable verification (rather than relying on Engineer mental math). §3 AC ↔ Test Case Count cross-check explicitly listed 5 AC `And` ≤ 5 new/modified tests, avoiding "AC 3 inactive assertions = 3 independent test" inflation problem (retrospective section details this once-strayed thought).

**What went wrong:** Initial draft once split `/` 3 inactive links into 3 independent test cases, only later realized ticket AC-025-NAVBAR-SPEC `And #3` "add `/` route desktop inactive 3 assertions" did not require 3 tests. Splitting into 3 tests violates persona "test count aligned to AC family count, no inflation" principle; although caught at design stage and changed to 1 test 3 `expect`, reflects Architect lacking "spec-file old structure scan" as design shared anchor for pure-refactor tickets.

**Next time improvement:** Future pure-refactor / spec-refactor class ticket (type=refactor and scope contains *.spec.ts / *.test.ts rewrite), before writing §3 E2E diff table, first pull a "Source of Truth Scan" section (in §1.5 or appendix), in `grep -n` format list spec all relevant describe / test titles + assertion line numbers to be modified + corresponding AC `And` # number, as §2 (code mapping table) + §3 (spec mapping table) shared reference source; avoiding subsequent manual cross-check of correspondence between different §, also avoiding "split too fine test count inflation" alignment errors. This entry added to senior-architect.md "Pre-Design Dry-Run Proof" same level, as supplementary gate for refactor-type ticket.

---

## 2026-04-22 — K-020 GA4 SPA Pageview E2E Test Hardening (design)

**What went well:** Built a 6-row "URL transition → `location.pathname` change → effect fires → beacon sent" truth table (§1 in design doc) before drafting any AC mapping. This table resolved 4 separate AC (SPA-NAV / NEG-QUERY / NEG-HASH / NEG-SAMEROUTE) from one source of behavior truth, prevented "Engineer decides" in negative-test design, and mapped 1:1 onto QA Challenge #7 (the blocking BQ the ticket was re-planned to close). AC ↔ test count cross-check (§4 in design doc) locked 9 = 9 = 9 before delivery — no silent drift between AC sum, test table row count, and declared total (K-030 I-2 class).

**What went wrong:** On the `dl` vs `dp` GA4 MP v2 payload key question, I was tempted to pin `dl` decisively in design from knowledge-cutoff (GA4 gtag.js always emits `dl`), but Pre-Design Dry-Run Proof gate requires `git show <base>:<file>` or equivalent verifiable citation for pre-existing behavioral claims. I have no browser/network execution capability as an Architect persona — AC literally asks "Architect dry-run confirm" which is un-executable. Had to compromise to a test-tolerant regex `[?&](dl|dp)=` + mandate Engineer Dry-Run Record DR-1..3 at implementation time. This works, but it reveals a systemic gap: AC-level expectations (e.g. "Architect dry-run determines value X") assume Architect has runtime tools that the persona actually lacks.

**Next time improvement:** Codify as a persona pattern "Dry-Run Deferral": when an AC asks Architect to determine a value that requires browser/network execution, the correct design output is (a) a test-tolerant assertion that accepts either plausible outcome + (b) an explicit Engineer Dry-Run Record block the Engineer must populate pre-freeze. This is NOT the same as "let Engineer decide" (which is forbidden) — the design still pins the contract; only the observable value identity is resolved at implementation. Will propose adding this as a named pattern under `## Pre-Design Dry-Run Proof` in senior-architect.md after K-020 closes (gates durable rule additions behind "pattern recurred ≥ 2 tickets" — K-020 is case 1, so log only this round, propose persona edit when case 2 appears).

---

## 2026-04-21 — K-030 post-code-review doc alignment (I-2 fix-now)

**What went well:** First read ticket AC confirmed BG-COLOR via QA Early Consultation already split by PM into two Playwright cases (ticket L191 Option A ruling), then cross-referenced ticket §AC total explicitly listing "minimum 5 new Playwright test cases (NEW-TAB × 1 + NO-NAVBAR × 1 + NO-FOOTER × 1 + BG-COLOR × 2)", confirmed source of truth = 5 cases, not 4, not 6. Hero CTA addition adopted conservative strategy (total first written 5 + §6.3 addendum placeholder), avoiding forward-writing 6 causing inconsistency between design doc and main branch spec count.

**What went wrong:** Design doc §6.2 writing time did not align with AC layer BG-COLOR's "2 cases" requirement — at the time only saw AC title "/app page background matches ..." then mentally calculated as 1 case, did not expand ticket L191 PM ruling's two-assertion structure (wrapper ≠ paper AND === gray-950; body === paper) directly split into two test cases. Result: §6.2 table actually already stuffed wrapper + body two assertions in T4 row (merged write), count still listed 4. This is typical "implementation done but count not aligned" drift, only exposed after Code Reviewer I-2 catch.

**Next time improvement:** Add Architect persona checklist hard step "design doc §6.x test count vs ticket AC count cross-check": every time writing §6 Playwright new spec section, re-read ticket §AC total declaration's minimum test case number, list mapping table per AC corresponding test ID, mapping table row count must equal §6.x table row count = declared "total test count". Any non-equal → design doc not complete, cannot deliver to Engineer. This entry added to senior-architect.md "All-Phase Coverage Gate" same level.

## 2026-04-21 — K-030 /app isolation design (new tab + remove NavBar/Footer + bg override)

**What went well:** PM-flagged spec conflict only listed `sitewide-body-paper.spec.ts`, but Architect proactively `grep -rn "/app" frontend/e2e/` whole-directory scan before §6 File Change List, found two additional must-link specs (`sitewide-footer.spec.ts` L47–51 + `sitewide-fonts.spec.ts` L55–73 two `/app` footer assertions would fail after footer removal). If only handling PM-flagged one spec, Engineer at deploy would hit other two fails. This proactive scan avoided staged-fix round-trip. Pre-verdict scoring two places (§2.1 bg color, §2.6 spec strategy) all locked 5-dim weights before ruling, after-adopted Option with diff ≥ 1, no post-hoc weight adjustment. After architecture doc sync, in same-file cross-table sweep `grep -n "HomeFooterBar|UnifiedNavBar"` found L118 TopBar description and L415 NavBar narrative still had pre-K-030 stale strings, fixed together, avoiding K-021 Round 3 same-class cross-table drift recurrence.

**What went wrong:** When ruling §2.1 bg color, Option A (pre-K-021 original design `bg-gray-950`) was excellent at first sight, spent considerable time fully filling out Option B/C/D pros/cons. For Architect 20-cell scoring provides traceable evidence, but for PM readability §2.1 could be simpler — Option B/C/D could be merged into one row "light scheme (white/off-white/paper-adjacent)" centralized scoring, reducing redundant dimensions.

**Next time improvement:** Pre-verdict matrix if same-class Option diff is expected ≥ 3 points, merge into same row instead of expanding individually (e.g. this ticket B/C/D three light schemes on "alignment with original design intent" dimension all 2-3 points, can merge into "light scheme" single row), scoring table shrinks to Option A vs Option light-scheme two rows. Reserve differentiated dimension analysis for prose supplement, not table grid. This improvement added to persona Pre-Verdict Tiebreaker section as "homogeneous Option merge rule".
## 2026-04-21 — K-031 /about remove "Built by AI" showcase (S7)

**What went well:** Cross-repo grep for `BuiltByAIShowcaseSection|banner-showcase|The real banner is clickable` surfaced four distinct drift points in architecture.md (L13 Summary `8 sections`, L140 `S8 email`, L410 Frontend Routing row, plus L147 coincidence commentary) in a single audit pass. Ticket's pre-verified AC table (§Route / Component Existence Verification) aligned 1:1 with my grep evidence, meaning PM had already done the existence check — no duplicated work, no contradictions. No Scope Questions needed, delivery was pure mechanical removal + doc sync.

**What went wrong:** The `BuiltByAIShowcaseSection.tsx` file was never added to architecture.md Directory Structure block during K-017 Pass 3 when the file was first created. I inherited this 2-day-old drift silently, and only noticed after running the §8 Self-Diff grep. If K-031 had been an add-feature ticket instead of a removal ticket, the missing entry would have caused me to treat the file as "new" rather than "existing". Architect's own earlier ticket (K-017 Pass 3) skipped the sync — a self-audit gap.

**Next time improvement:** After any `/about` (or other page with a sub-component directory) ticket, execute `ls frontend/src/components/about/*.tsx | wc -l` and count the entries in architecture.md's about/ tree block — if mismatched, flag as "pre-existing drift" in design doc §Self-Diff and decide whether this ticket fixes it (cheap) or logs it as Known Gap. Codify this count-match check as an explicit bullet under `## Architecture Doc Structural Content Self-Diff` → `### Same-File Cross-Table Consistency Sweep` in senior-architect.md. Will propose persona edit if this pattern recurs in K-032+; for K-031 the fix is soft (noted in design doc §8.1), no persona edit this round.

## 2026-04-21 — K-028 Homepage Visual Fix (Section Spacing + DevDiarySection Flow Layout)

**What went well:** Pencil MCP was failing (`✗ Failed to connect`) but I immediately pivoted to direct JSON parse of `frontend/design/homepage-v2.pen` via a short Python traversal. Got the full layout tree for `4CsvQ > hpBody` including `gap: 72` (exact section spacing source of truth) and rail node `x=29, y=40, h=304` inside `diaryEntries` in one pass. No stall on the MCP failure. All three pre-verdict matrices (spacing wrapper / rail implementation / mobile gap value) declared dimensions before scoring and converged without post-hoc weight adjustments. Boundary pre-emption table enumerated 9 scenarios (including single-milestone edge case that could collapse the rail) before design handoff — no blank spots left for Engineer to decide.

**What went wrong:** Initial tool call batch did not include the Pencil MCP connectivity check, so I only noticed the MCP failure mid-read after trying to recall frame data. Lost ~30 seconds of reasoning on "should I retry MCP" before confirming the `.pen` file is plain JSON. The K-021 architecture.md gave enough hints that `.pen` is JSON-based but I did not internalize that as a fallback pattern.

**Next time improvement:** Add to `senior-architect.md` persona — "Pencil MCP Fallback: `.pen` files are plain JSON; if `claude mcp list` reports the pencil server failed or `batch_get` errors, read the file directly with Read / Python traversal. Do not block the session on MCP recovery." This is a behavioral rule (tool fallback strategy), so per the codify-retrospective rule it must also be Edited into the persona file as a hard step — will request PM to acknowledge this retrospective before I make the persona edit.

---

## 2026-04-21 — K-013 Bug Found Protocol (Architect W-1) Pre-Design Audit missing code-level dry-run

**What went well:** (none — this entry is a self-reflection on a miss, not listed)

**What went wrong (specific event + file:line + root cause):**

1. **Specific event:** K-013 design doc `docs/designs/K-013-consensus-stats-ssot.md` §0.3 SQ-013-01 asserted "full-set (`appliedSelection == all matches`) branch goes through `appliedData.stats`, StatsPanel's ConsensusForecastChart receives empty array, **consensus chart not displayed in full-set**". This premise is **wrong**. Code Review depth Reviewer verified Critical C-1: K-013 Engineer implemented per AC-013-APPPAGE, full-set branch consensus forecast chart disappeared, because OLD code originally drew it, K-013 removed it.

2. **OLD implementation actual behavior (base commit `b0212bb`, `frontend/src/AppPage.tsx`):**
   - L202–210 `projectedFutureBars` useMemo: `const activeMatches = appliedData.matches.filter(m => appliedSelection.has(m.id))` — after first predict `setAppliedSelection(allIds)` (L363), so **in full-set `activeMatches` = all matches, `projectedFutureBars` calculates ≥2 entries**.
   - L218–231 `displayStats` useMemo:
     ```
     if (!appliedData.stats) return null
     if (projectedFutureBars.length < 2) return appliedData.stats     // ← fallback (L220)
     const computed = computeDisplayStats(...)
     if (!computed) return appliedData.stats
     return {
       ...computed,
       consensusForecast1h: projectedFutureBars,                      // ← unconditional inject (L224)
       consensusForecast1d: projectedFutureBars1D,                    // ← unconditional inject (L225)
     }
     ```
   - Third branch (L222–226) **has no full-set vs subset judgment**, regardless of whether `appliedSelection` equals all-set, will use frontend `projectedFutureBars` to override `consensusForecast1h/1d`. Consensus chart in OLD code **displays in both full-set and subset**.
   - K-013 AC-013-APPPAGE asks Engineer to "directly return `appliedData.stats` in full-set branch", equivalent to cutting L222–226 inject path → in full-set consensusForecast falls back to backend's `[]` (SQ-013-01 second half I correctly described backend PredictStats always `[]`) → chart disappears. This is K-013 **introduced regression**, not pre-existing.

3. **Root cause (why Pre-Design Audit didn't catch):**
   - Pre-Design Audit listed `frontend/src/AppPage.tsx L110-236 read` in §0.1. I did Read that range, but **only read structure** (saw `if (projectedFutureBars.length < 2) return appliedData.stats` line, intuitively "full-set enters this fallback"), **did not do code-level dry-run**: did not trace `projectedFutureBars` calculation path → did not find `appliedSelection` after predict will `setAppliedSelection(allIds)` (L363) → did not derive that in full-set `projectedFutureBars.length >= 2` actually holds → did not enter third branch (L222–226) → wrong conclusion "full-set goes through fallback".
   - In other words: I treated "read this file:line range" as "verified the behavior of this range". Actually I only pattern-matched one if statement, did not run data-flow once for all input combinations (full-set with matches / full-set without matches / subset / empty).

4. **Why §8 API invariance proof passed but didn't block:**
   - §8.1 Before/After diff six rows are all **backend schema** dimension (`PredictRequest` / `PredictResponse` / `PredictStats` field / `compute_stats()` signature / backend return value range / `usePrediction.ts` camelCase mapping). All marked Diff: empty.
   - §8.2 verification method only requires `git diff main -- backend/models.py` = 0 lines — only proves **backend wire-level schema invariant**, did not prove **frontend `displayStats` observable behavior equivalent**.
   - In other words: when I wrote "API Schema invariance" I was thinking wire contract, but K-013 AC-013-APPPAGE changes **frontend's `displayStats` calculation branch**, this observable output (`consensusForecast1h/1d` from "has frontend projected value" to "backend `[]`") completely not verified in §8. §8's domain too narrow, doesn't cover "frontend behavior equivalence".

**Next time improvement (specific executable, written into persona hard steps):**

- **Next time improvement A (Pre-Design Audit file scan + mandatory dry-run):** Pre-Design Audit's `§0.1 Files inspected` table cannot end with "range read"; each listed range, if involves **"pre-existing behavior" / "existing bug" / "existing branch goes which path"** behavior assertion, must additionally attach a **dry-run truth table**, listing all relevant state combinations (e.g. full-set vs subset × matches empty vs ≥2 × viewTimeframe 1H vs 1D) × each branch output, with corresponding file:line citation. No dry-run table = cannot write "existing behavior is X" assertion in design doc.
- **Next time improvement B (pre-existing assertion mandatory `git show <base>:<file>` + dry-run):** Wherever design doc has `pre-existing` / `existing behavior` / `before K-013 it was so` text, **mandatorily `git show <base-commit>:<file>` to read OLD implementation + per-branch dry-run** (not per-file Read HEAD, that only proves "now HEAD looks like this", does not prove "base also looks like this"; this run K-013 Reviewer required reading `b0212bb` to verify). When writing assertion must cite `git show <commit>:<path> L<start>-<end>` as source, cannot substitute with HEAD Read.
- **Next time improvement C (§API invariance proof extended to "Wire + Frontend Behavior dual-axis"):** §API invariance proof's domain must explicitly state dual-axis: (1) wire-level schema (`git diff main -- backend/models.py` = 0), (2) frontend observable behavior (for each `useMemo` / `useState` / event handler etc. output channel, list Before → After output diff table, full-set / subset / empty three scenarios each one row). Only doing (1) without (2) design doc = invariance proof not established. When AC involves frontend computational logic rewrite, this § must extend to frontend branch observable behavior, cannot only conclude with backend schema diff.
- **Next time improvement D (all three codified into `senior-architect.md` hard rule section):** A/B/C three items synchronously Edit into persona "Pre-Design Dry-Run Proof" paragraph (hard gate, not narrative), and in `feedback_architect_pre_design_audit_dry_run.md` memory entry leave triggering condition with K-013 W-1 event as Why.

---

## 2026-04-21 — K-013 Consensus / Stats SSOT design doc

**What went well:** §0 Pre-Design Audit per-file read `compute_stats` / `_projected_future_bars` / `computeDisplayStats` / `computeProjectedFutureBars` / `PredictStats` 5 implementations, found pre-existing gap (`PredictStats.consensus_forecast_1h/1d` backend always returns `[]`, in full-set StatsPanel's consensus chart originally not drawn), listed as SQ-013-01 pinned in §0 letting Engineer + Reviewer + PM three parties align, avoiding Engineer self "convenient fix" expanding scope or Reviewer mistakenly judging as K-013 introduced regression. Sub-decisions D1/D2/D3 (util vs hook / generator script in version / import JSON) all use pre-verdict scoring table ≥1 diff directly adopted, no post-hoc supplemented dimensions. After architecture.md Edit, grep `statsComputation` / `stats_contract_cases` / `computeStatsFromMatches` 3 keywords whole-file 11 hits one-by-one verified, and corrected §Consensus Stats Source of Truth originally written as `PredictStats` return type stale signature to `StatsComputationResult`.

**What went wrong:** First draft wrote Directory Structure new `statsComputation.ts` / `fixtures/` / `statsComputation.test.ts` as "K-013; ..." rather than "pending K-013 Engineer Step N" markers — these three files **all do not exist** on disk at this moment (Architect not yet started Engineer), violating persona rule "must ls or Glob to confirm disk state; if deletion/creation hasn't happened, use pending marker". Self-Diff catch-up time only realized to change back to pending. Root cause: when writing Directory Structure intuitively used "target state" wording, missed disk state verification this step.

**Next time improvement:** Before editing architecture.md Directory Structure block, **mandatorily run `ls` / `Glob`** against current disk state, then decide each entry use "current state" or "pending K-XXX Step N" marker; add this step to Pre-Design Path Audit hard action list (K-023 already established, this run extends "disk-vs-target marker distinction" small item).

## 2026-04-21 — K-023 Homepage Structure Detail Alignment v2

**What went well:** Pencil design file analysis surfaced four critical contradictions (A-3 already implemented, A-4 has no corresponding element in design, A-5 hairline is already in correct position per design, C-4 bottom padding mismatch) before any code was written. All four were escalated as Scope Questions to PM rather than self-resolved, preventing Engineer from implementing changes that contradict the design. Pre-Design Path Audit caught `StepCard.tsx` and `TechTag.tsx` as ghost entries in architecture.md.

**What went wrong:** The ticket stated "Architect extracts text from design" for A-4, implying the content exists in the design. Architect read the ticket before checking the Pencil file structure, spending time on AC analysis before discovering the design has no second-line brick subtitle. The contradiction should have been surfaced in the first tool call sequence.

**Next time improvement:** When a ticket references "Architect extracts exact content from design file", open the design file first to verify that content exists before reading AC details. Design file extraction should be the first operation, not confirmation of what AC already claims exists. Add this as a pre-condition check in the design workflow: "design file verification before AC analysis" when ticket scope involves design content extraction.

## 2026-04-21 — K-022 /about structure detail design

**What went well:** After hard step grep dark pattern execution, found `SectionLabel.tsx` and `SectionHeader.tsx` not directly used by /about now, avoiding Engineer changing a component /about does not use; Pencil batch_get retrieved Redaction bar height (10px) / Role Card height (320px) / grid gap (14px) / OWNS label font-size (10px) precise values, design doc spec can be directly transcribed rather than estimated; found AC vs design two inconsistencies (BQ-022-01 CASE FILE vs Nº 04, BQ-022-02 LAYER vs FILE Nº), listed Blocking Questions for PM ruling, no self-side-taking. Self-Diff executed: 13 rows vs 13 rows ✓.

**What went wrong:** Ticket §A-12 explicitly listed `components/shared/` path, actual codebase has no this directory (primitives in `primitives/`, SectionHeader/SectionLabel/CtaButton in `common/`). Design doc corrected actual path, but did not prominently note in §0 "ticket path typo, design doc as authoritative", Engineer reading ticket first then doc may still be confused. Root cause: Architect when ticket vs codebase paths mismatch, only corrected design doc, did not explicitly warn ticket typo at entry point.

**Next time improvement:** When ticket specific path or component name does not match codebase, design doc **§0 Design Premise** section must add a "Ticket path errata" list, comparing ticket path vs actual path, preventing Engineer confusion. This rule supplemented into senior-architect.md hard step "Pre-Design Path Audit" section.

## 2026-04-21 — K-027 mobile /diary milestone overlap fix

**What went well:** Before design starts, `ls` verified `primitives/` directory, found architecture.md claims K-017 Pass 2 already deleted `MilestoneSection.tsx` / `DiaryEntry.tsx` and replaced with `MilestoneAccordion.tsx`, but disk completely has no `MilestoneAccordion.tsx`. After active confirmation, used actual codebase as design baseline, and explicitly marked this drift in design doc §1.1, avoiding Engineer searching for non-existent component. Simultaneously triggered architecture.md multiple drift fixes (diary/ subtree + DevDiarySection + Summary section), one cleanup.

**What went wrong:** `architecture.md` K-017 Pass 2 drift (diary/ component described as deleted but actually retained) was not audited at K-017 / K-021 task end, accumulated to K-027 to be discovered. Root cause: K-017 Pass 3 abandoned P4/P7 primitive plan, design doc updated, but `architecture.md`'s `Directory Structure` section only updated partially (primitives/ directory description), did not synchronize backing out "diary/ delete MilestoneSection.tsx / DiaryEntry.tsx" description. Architect at K-017 Pass 3 end's doc sync only did Summary section text correction, did not do `ls` verification for Directory Structure.

**Next time improvement:** Before Edit-ing architecture.md `Directory Structure` recording "component deletion", must `ls` or `Glob` to confirm disk state in same Edit operation, cannot use "next Engineer will delete" as reason to mark deletion in advance; if deletion not yet complete, use "pending deletion (K-XXX Step N)" marker rather than directly removing entry. This rule supplemented into `senior-architect.md` Architecture Doc sync rule section.

## 2026-04-20 — K-021 W-R3-01 architecture.md Shared Components table cross-table drift (Round 3 second-layer reflection)

**What went wrong:**
1. **Specific event:** Round 2 already corrected `### Footer placement strategy` table (L463-469) from `/diary = HomeFooterBar`, `/app = no footer` to correct `/diary = no footer`, `/app = HomeFooterBar`, but same file below `### Shared Components boundary` table (L476) independently recorded same component's "used in" column, at the time written as `/` `/diary` `/business-logic` (same wrong three-route combination), **Round 2 fixing Footer placement table did not scan this row at all**. Reviewer Round 3 re-audit caught this cross-table inconsistency, opened W-R3-01 blocker. Source error same root cause as Round 2 (AppPage footer placement short-term memory overriding source of truth), but this ticket's lesson is "fix scope".
2. **Why guard failed:** Round 2 reflection's added Self-Diff Verification hard step explicitly requires per-cell comparison against source of truth after Edit, **but only covered "this Edit's section"**. When same component is recorded in multiple tables in same file, Self-Diff only sees this Edit's diff, cannot read whether other tables are consistent, rule cannot propagate cross-table. Essentially Self-Diff is vertical verification (before vs after Edit), missing horizontal verification (other paragraphs in same file consistent).
3. **Structural root cause:** architecture.md uses "multi-faceted tables expressing same component" structure (Footer placement strategy table + Shared Components boundary table + directory structure tree, three places each list HomeFooterBar), any table update must scan other two. Persona hard step lacks "Same-File Cross-Table Consistency Sweep" — when Edit involves component/route/endpoint/identifier, grep whole-file that identifier, every occurrence verified against actual implementation and other source of truth.

**Next time improvement:**
1. **Persona add third hard step `Same-File Cross-Table Consistency Sweep`** (already simulated in W-R3-01 task content once, needs formal write into `~/.claude/agents/senior-architect.md`): Whenever Edit-ing architecture.md (or any source-of-truth document) involves named identifier (component name / route path / endpoint / field), after Edit must grep whole-file that identifier, list all occurrence locations, one-by-one against actual implementation and other source of truth, all green = done. This run already demonstrated ✓ block format output.
2. **Structural level:** Future writing of architecture.md sections, avoid same component recorded redundantly across multiple tables. If unavoidable (information dimensions different, like placement strategy vs shared boundary), must explicitly state at file top or section header "this component also recorded at L476", reducing cross-table drift incidence. This is TD, registered to PM dashboard for PM ruling.
3. **Rule propagation direction:** Self-Diff (vertical) + Cross-Table Sweep (horizontal) = 2D coverage. With only vertical, sole defense for cross-table drift is Reviewer — unacceptable, Architect must self-close loop.

---

## 2026-04-20 — K-021 W-5 architecture.md Footer table drift

**What went wrong:**
1. **Specific event:** K-021 design task before end Edit `agent-context/architecture.md` adding `## Design System (K-021)` section, `### Footer placement strategy` table's `/diary` and `/app` two rows whole values reversed (written as `/diary = HomeFooterBar`, `/app = no footer`), and paragraph rationale sentence wrote "per-page can preserve AppPage no footer working area UX" continuing wrong assumption. Actual source of truth: design doc §7.5 ruling table and ticket AC-021-FOOTER explicitly write `/app = <HomeFooterBar />` + `/diary` decided by K-024; when I Edit-ed, **did not per-cell against design doc §7.5** but relied on short-term memory (red-team self-discussion discussed AppPage footer placement complexity), directly wrote, mistook "AppPage special handling" as "AppPage no footer".
2. **Why guard failed:** Persona already had `## Architecture Doc sync rule` hard step requiring "structural / API / cross-layer decision / new shared components must Edit architecture.md + Changelog + updated", memory `feedback_architect_must_update_arch_doc.md` also reinforces this rule. **But that rule only covers "should Edit", not "self-diff after Edit".** My Edit execution itself complies (changed, has Changelog, has updated), but no step mandates me to per-cell cross-check newly-written table against source of truth. Rule covers "writing" not "writing correctly".
3. **Structural root cause:** Persona missing post-Edit cross-check beat — when Edit-ing architecture.md tables / lists / endpoint schema "structured content", as long as source of truth (design doc / ticket AC / codebase grep) exists, after Edit must compare line-by-line/cell-by-cell, any cell inconsistent goes back to fix, no diff = task complete. Previous three tickets (K-017 Pass 3 step list residue, K-018 BuiltByAIBanner does not exist, K-009/K-011 drift) all have same-class "writing / writing correctly" gap, retros also recorded, but did not convert to hard step.

**Next time improvement:**
1. **Add persona hard step (`~/.claude/agents/senior-architect.md` `## Architecture Doc sync rule` section end append):** After Edit-ing any architecture.md "structured content" (tables, lists, endpoint schema, component props table), must read corresponding source of truth (design doc ruling section / ticket AC / `ls` or `grep` codebase), **line-by-line/cell-by-cell diff**, record "X row vs Y row — per-cell match ✓" in task delivery log; any cell inconsistent, go back to fix, no diff = task complete. Cannot declare task end without completing this diff.
2. New memory file `feedback_architect_arch_doc_self_diff.md` records this rule and trigger event, Ingest next session can auto remind.

---

## 2026-04-20 — K-021 sitewide design system foundation

**What went well:** Font loading approach used 5-dim Pre-Verdict matrix + red-team 3 rounds then chose Option A (Google Fonts CDN), incorporated existing index.html already loaded fonts fact into decision avoiding over-engineering; Footer placement Option A vs B score 9.33 vs 5.33 wide gap ruling, AppPage `h-screen overflow-hidden` and Layout slot conflict red-team caught; FooterCtaSection's dark-theme residue (text-white / border-white/10) identified as TD-K021-05 blocker, avoiding Engineer visual acceptance failure.
**What went wrong:**
1. Scope found `/login` does not exist in codebase + .pen, but still in design doc §0 Q1 went "assume A continue" rather than pause and report PM, violates persona "no requirement decisions"; substantively a borderline ruling on AC scope.
2. Body CSS entry Option A (index.css @layer) 7.5 vs Option C (per-page) 8.0, lower score yet selected A via "token spirit" tiebreaker, tiebreaker dimension not pre-listed in scoring matrix, belongs to post-hoc dimension self-justification.
3. Ticket AC writes `text-brick` (#B43A2C) but implementation + K-017 visual-report verification used #9C4A3B (brick-dark), Q2 should not give recommendation before PM ruling, still wrote "recommend B preserve implementation", same-class borderline acting as PM.
**Next time improvement:**
1. **Scope Question Pause Rule** (added to persona hard step): When Architect finds ticket AC vs codebase/design inconsistent, must immediately stop design, list contradiction in Q&A section, report PM, cannot self-go with "assume X continue"; before PM response design doc cannot declare complete.
2. **Pre-Verdict Tiebreaker Pre-listing Rule** (added to persona hard step): Pre-Verdict scoring matrix must **list all scoring dimensions (including tiebreaker) when listing options synchronously**, after options scored cannot add new dimensions; when diff < 1 tiebreaker can only use existing dimension weighting, otherwise treated as "undecided" report to PM.
3. Ticket vs implementation color discrepancy must be marked in design doc §0 as "PM pending ruling" listing, no recommendation attached, avoiding Architect acting as PM color setter.

**What went wrong:** Q8 reply "HomePage sitewide add FooterCtaSection" did not cross-check Pencil design, design actually is pure-text hpFooterBar (one text node, copy `"yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn"`, Geist Mono 11px #6B5F4E, no independent links), completely different design philosophy from FooterCtaSection (three independent external links: email/GitHub/LinkedIn + ExternalLink + P3 primitive). Wrong ruling would let Engineer implement wrong component at HomePage bottom.
**Next time improvement:** When Q&A reply involves "add component to which pages", must first batch_get corresponding Pencil frame to confirm actual design spec, do not infer from AC text; especially "sitewide shared" decision requires confirming each page's bottom in design is same component design, not just looking at AC description text.

## 2026-04-19 — K-017 Homepage v2 missed item

**What went wrong:** Pass 3 Pencil cross-check only focused on /about dependencies, did not warn that Homepage v2 Dossier (frame `4CsvQ`) contains complete new layout (hpHero, hpLogic both have all-new copy and visual structure), not included in K-017 design scope. Caused §2.3 only to write "HeroSection existing, no change / ProjectLogicSection existing, no change", Engineer following old doc would miss v2 design update.

**Next time improvement:** When Pencil cross-checking, for each frame one-by-one declare "all changes in this frame are within current ticket scope or not", out-of-scope changes immediately warn PM; especially `v2 Dossier` named frames must be treated as "has new design spec" rather than "for reference", per-child confirm whether there are corresponding implementation specs.

## 2026-04-19 — K-018 GA4 Tracking design

**What went well:** Before design starts simultaneously verified `BuiltByAIBanner.tsx` actual existence (`ls` confirm), found architecture.md record inconsistent with disk current state, in design doc explicitly marked "Engineer needs to create this component", avoiding Engineer assuming file exists per old doc and skipping creation step. `ExternalLink` primitive's modification decision (Option A vs B) also did clear trade-off discussion, not letting Engineer guess.

**What went wrong:** `BuiltByAIBanner.tsx` non-existence, if earlier (design start) `ls` verified, no need mid-way to confirm; current is "read architecture.md → feel weird → then ls" passive flow, equivalent to K-017 retro's "real-path walkthrough done too late" same-class problem recurring in K-018.

**Next time improvement:** Each design start, §5 "file change list"'s "create" items, if architecture.md already records, must first `ls` or `Glob` to verify whether the file really exists, do not wait until "feels weird somewhere" to check. Add this to senior-architect's pre-checklist.

## 2026-04-19 — K-017 Pass 3 Engineer Q&A

**What went wrong:** Phase C4 text retained Pass 2 old version ("delete MilestoneSection.tsx / DiaryEntry.tsx, replaced by P4/P7"), and Pass 3 already abandoned P4/P7 and explicitly retained these two components; Engineer following C4 would mistakenly delete. Root cause: Each Pass update did not systematically scan "Phase step description" paragraph, confirming steps no longer reference deleted components.

**Next time improvement:** Each Pass update (delete primitive, abandon component, change architecture decision), mandatorily scan `## 6. Implementation order` whole section, cross-compare all Phase A–E step descriptions with current §2.0, §5 list — any Phase step referenced component name marked DELETED/retained in list must synchronously fix step description. This scan written into this retrospective log as next-time directly executable checklist.

## 2026-04-19 — K-017 Pass 3

**What went well:** (none — Pass 3 is correcting Pass 2 blind extraction error, no proactive design highlight to claim)

**What went wrong:** P5/P6 blind extraction decision before Pencil cross-check could not confirm whether shared, causing Pass 2 output needing Pass 3 correction; root cause is "commit message implying shared" treated as sufficient condition for primitive extraction, but actually two pages' timeline even design philosophy different (Homepage uses absolute rectangle rail + absolute marker; Diary uses flexbox left-border stroke, no independent rail no marker), commit message similarity ≠ DOM pattern similarity

**Next time improvement:** When conditional primitive, directly ask Designer "DOM sketch of all pages using this pattern", do not infer from commit message; structural similarity is necessary condition for primitive extraction, semantic/visual similarity insufficient

## 2026-04-19 — K-017 /about portfolio enhancement design (Pass 2 — cross-page component audit)

**What went well:**
- Primitive scope disciplined: Q3/Q4 user chose A (extract primitive) simultaneously imposed hard scope ("only for K-017 new components"), this round fully executed, §2.0 + §2.0.3 explicitly write "HomePage existing sections do not migrate", "existing common/ does not move", avoiding scope creep
- Q8 conditional primitive marked appropriately: When Pencil MCP connection failed, did not hard guess nor give up, explicitly marked P5/P6 as "conditional primitive", deferred decision to Engineer A0.1 and hard-required "after cross-check synchronously update this doc §2.0.1", no empty planning

**What went wrong:**
- Pass 1 did not do cross-page duplicate audit, Pass 2 then audited 10 D1–D10 patterns. Root cause: Pass 1 design only did component split for PRD-specified `/about` rewrite, did not actively ask "do these new sections / cards have patterns duplicate with other pages". Duplicate audit should be Architect's standard step before deciding "extract primitive", but personal workflow defaulted "components within ticket scope are design objects". This omission directly caused user requesting Pass 2 re-audit
- §5 file change list Pass 1 missed extracting primitive related additions/deletions (P1–P7, useDiary, MilestoneAccordion replacing MilestoneSection/DiaryPreviewEntry etc.), Engineer following only Pass 1 list would write duplicate code, requiring Pass 2 entire rewrite
- Pass 2 Edit §2.1 AboutPage component tree, one Edit accidentally deleted `## 2. Component tree split` major heading along with `### 2.1`, supplemented back; root cause: did not fully verify `old_string` contains all expected preserved content before direct replacement

**Next time improvement:**
- **New persona hard step (codify into `~/.claude/agents/senior-architect.md`):** Architect each design doc delivery must do cross-page duplicate audit — for each new component / new section in this ticket scope, grep existing `frontend/src/components/**` + `frontend/src/pages/**` searching semantic / structurally similar files, list duplicate / near-duplicate and decide "extract primitive" / "keep individual inline" / "merge existing into single component". This audit output must be merged into design doc `## X Shared Primitive & Reuse Plan` section, cannot be omitted
- When Edit-ing large design doc, for "replace including title line" old_string must fully verify preservation scope; before replacement first Grep target section boundary, confirm old_string does not swallow next section title

**Persona codify status:** (mandatory clause — if improvement is behavior rule must synchronously Edit persona)
- Above "cross-page duplicate audit" is Architect behavior rule, requires synchronous Edit to `~/.claude/agents/senior-architect.md`. After this retro completion will Edit; if cannot Edit persona this retro is invalid (per persona `feedback_retrospective_codify_behavior`)

---

## 2026-04-19 — K-017 /about portfolio enhancement design

**What went well:**
- Drift check really done: Read all 14 component files of `AboutPage.tsx` / `HomePage.tsx` / `about/*` + `architecture.md` Directory Structure subtree + `main.tsx` route, then started writing design; therefore §5 file change list directly marked "delete old 12 components, RoleCard interface needs change, add 11 components", Engineer impl no need to reverse-derive
- Explicit defer decision: §4.4 curated retrospective "which 2-3 to pick" did not decide for PM, only gave selection principle + reference format, complies with senior-architect.md "no requirement decisions"
- Proactive trap supplement: §7.8 Firebase SPA fallback would swallow `.md`, when designing found this and synchronously marked across §4.3 + §5 + §7 three places + recommended `frontend/public/docs/` copy approach

**What went wrong:**
- Firebase `.md` SPA fallback trap was thought of when writing §4.3, not mapping at design start. Root cause: AC-017-PROTOCOLS only requires "doc exists + inline link points to that file", AC did not mandate "recruiter can actually open after click", my mental walkthrough on recruiter end-to-end usage path done too late; **senior-architect responsibility should be after "AC coverage complete" plus one more "real-world path walkthrough"**, otherwise Engineer impl will hit wall at deploy stage
- Did not first grep `frontend/e2e/pages.spec.ts` for old AboutPage text ("What Is This Project?" / "AI COLLABORATION" / "HUMAN-AI") assertion dependency. §5 only writes "Engineer needs grep one sweep", instead of self-sweeping to give list — equivalent to pushing fragility points that should be intercepted at design stage to Engineer, violates "design must be specific enough that engineer can directly follow"

**Next time improvement:**
1. Before design doc submission must do "end-to-end real-path walkthrough": for each link on `/about` (internal SPA link / internal `.md` link / external GitHub / external LinkedIn / `mailto:`) one-by-one ask "after production deploy can click reach right place". This walkthrough output listed into this retrospective log as next-time directly transcribable checklist
2. Major restructure existing page tickets (delete 12 / change 4 / add 19 scale) in §5 file change list, before Architect self-grep one sweep existing E2E spec / Vitest for old text / old component name dependency, write result into list as Engineer mandatory pre-action. Cannot only list "Engineer needs grep" then drop
3. Firebase Hosting characteristics (SPA fallback / rewrite / public dir location) listed into this project Architect mandatory reference list. Next time involving adding publicly-accessible non-HTML resources (`.md` / `.txt` / `.json`) first step check Hosting behavior

---

## 2026-04-18 — K-008 W2/S3 post-fix reflection

**What went well:**
- When fixing W2 first read `playwright.config.ts` final implementation then change architecture.md, ensuring text matches final state (2 project split) rather than Bug Found Protocol retro time's anticipation, avoiding leaving stale again
- When fixing S3 cross-referenced `visual-report.ts::renderHtml`'s `successes` / `failures` / `authRequired` three variable's actual string template, no self-invented format

**What went wrong:** (no surprise — drift already synchronized to implementation; this fix is mechanical write-back after retro, no new judgment events worth recording)

**Next time improvement:**
- Architect doc sync rule's "Engineer auto ping Architect to write back after completion" hook still pending land (this run relied on Reviewer marking W2 to passively re-engage). Next ticket if Engineer deviates from original design again, I will add a "Post-impl sync checklist" at ticket §Architecture end, giving Engineer / PM clear trigger to call me back

---

## 2026-04-18 — K-008 W2/S3 Bug Found Protocol reflection

**What went wrong:**

- **W2 root cause (design coverage + post-event sync dual gap):**
  - Design stage only listed "default glob eats → add `testIgnore`" / "default glob doesn't eat → continue" two branches (ticket §6.2), **missed third branch "default doesn't eat but CLI specifying file also blocked"**. Root cause: I treated Playwright `testMatch` as "only affects default discover" filter, did not check whether CLI file argument also applies same glob; this is Architect not checking "config behavior boundary" completely before assuming branch enumeration, essentially "no test then conclusion enumeration" error (same as last retro's "transferring testMatch test to Engineer" — **same bad habit recurrence** — last time only no test, this time no test plus "model imagination" filling branches).
  - Engineer at impl decided `per-project testMatch` (correctly deviating from original design), **Architect was not summoned back to fix architecture.md §QA Artifacts line 425's stale narrative**. Root cause: Architect doc sync rule (senior-architect.md §Architecture Doc sync rule) requires "sync before each ticket end", but K-008's ticket flow is "Architect designs → Engineer implements → Reviewer finds drift → PM rules then fixes", Architect at design stage delivery means "exit", no hook to re-engage me back to doc sync; until Reviewer W2 marked then passively re-entered. This is **flow lacking "Engineer auto ping Architect to write back after completion" sync mechanism**, not simply "forgot to update".

- **S3 root cause (sibling of W2 same root):**
  - §3 HTML design `Pages: 4 captured, {failures} failed` was Engineer expanded to `Pages: {successes} captured, {failures} failed, {authRequired} auth-required (not captured)`. Engineer's expansion is correct (counting auth-required as separate category, hard-coded `4` changed to `{successes}` avoiding future page additions requiring manual change), but Architect at design stage **did not reflect "auth-required not captured" into state count model** — §3 fixed write `4 captured`, meaning at design stage `/business-logic` placeholder also treated as captured, but placeholder has no screenshot at all, semantically contradictory.
  - This is **same-class defect as W2**: Architect when output spec did not list "state × count" boundary completely (W2 is testMatch × CLI boundary, S3 is success/failure/auth-required × captured boundary), used "approximately correct" summary to pass design review, until Engineer impl boundary exposed then fixed. Same lacks sync mechanism to write fix back to architecture.md §3.

**Next time improvement:**

1. **Design stage "config/state boundary" must list complete truth table, do not rely on enumeration imagination.** Architect output any "X case → Y behavior" branch, use table form to write all X combinations (e.g.: `testMatch × run mode {default, --list, file-arg, --project}` = 4 × 4 = 16 cells), at least run dry-run once to confirm each cell; not "two branches I thought of". State count similarly (success/failure/auth-required × captured/not-captured to draw matrix, not one-line `4 captured` glossed over).
2. **Ticket flow add "Engineer completion → Architect doc sync ping" hook.** Add to K-Line CLAUDE.md ticket close checklist: "When Engineer marks impl complete, if implementation decision deviates from Architect §N original design (per-project testMatch, HTML counter expansion etc.), PM must re-summon Architect to do doc sync, do not wait for Reviewer to find drift". Move W2/S3 class "passively waiting for Reviewer to find" drift forward to Engineer delivery time.
3. **Bug Found Protocol triggered, Architect retro **must** do self-check against last retrospective.** This run W2 root cause "no test then conclusion" same as 2026-04-18 K-008 design entry's "transferring testMatch test to Engineer" same bad habit recurrence — last time marked "next time test" but did not implement before entering K-008 design. New rule: each appended new retrospective first read last entry's "next time improvement", explicitly mark whether this run repeated violation (repeated violation must escalate action, e.g. add git pre-commit hook or PM audit item).

## 2026-04-18 — K-008 (Visual Report Script design)

**What went well:** Triage Drift Check first ran then made decision — grep found `docs/reports/` already at architecture.md line 50 "reserved but not landed", so this design explicitly upgraded to "add QA Artifacts section + Directory Structure supplement visual-report.ts" rather than silently patching; also incidentally fixed `ma99-chart.spec.ts` / `navbar.spec.ts` originally missed from Directory Structure.

**What went wrong:** Playwright `testMatch` default glob whether mistakenly eats `visual-report.ts` (non-`.spec.ts` naming) — I did not on-the-spot run `npx playwright test --list` to verify, instead threw it to Engineer to verify at impl. Root cause: Architect this run does not have shell with frontend deps installed, test cost higher than "let Engineer test once and write into Retrospective"; but this substantively transfers design decision to impl stage, not "thoroughly thought through" enough.

**Next time improvement:**
1. Design decisions involving test runner glob / config behavior, Architect should locally run `npx playwright test --list` or equivalent dry-run command to confirm, not transfer to Engineer.
2. If actually unable to test (missing deps / missing env), in ticket Architecture section explicitly mark "this item is Engineer test decision point" and list judgment conditions and corresponding action (this run §6.2 already done so), no ambiguity left.
3. New `docs/reports/` "doc reserved first, impl later" directory, when reserving should mark in architecture.md Changelog "reserved pending K-XXX landing", avoiding future drift checks reverse-judging "is this reserved or omission".

