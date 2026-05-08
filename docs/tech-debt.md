# K-Line Prediction — Tech-Debt Registry

Centralized record of items that PM has ruled "do not fix immediately, schedule later" as tech debt. Each entry is produced by Code Review / Retrospective and written into this file after PM confirmation.

Code Reviewer / Engineer may NOT migrate items into this file before obtaining a PM ruling.

---

## Index

| ID | Item | Source | Priority | Registered |
|----|------|--------|----------|------------|
| TD-001 | Frontend bundle too large (K-003 main work done, residual monitoring) | K-003 retrospective | Low | 2026-04-16 |
| TD-002 | Backend test coverage insufficient (K-001 closed residuals) | K-001 retrospective | Medium | 2026-04-16 |
| TD-003 | Upload history module global variables not synchronized; concurrency race | 2026-04-18 Codex review P2-A | Medium | 2026-04-18 |
| TD-004 | MatchList PredictorChart effect deps do not include actual candle values | 2026-04-18 Codex review P2-B | Medium | 2026-04-18 |
| TD-005 | `frontend/src/AppPage.tsx` over-responsibility; recommend extracting 3 hooks + presentational sub-sections | 2026-04-18 Codex review Modularity | Medium | 2026-04-18 |
| TD-006 | `backend/main.py` mixes FastAPI routes / CSV parsing / state management / persistence / prediction orchestration | 2026-04-18 Codex review Modularity | Medium | 2026-04-18 |
| TD-007 | `backend/predictor.py` module too broad; recommend splitting into `predictor_ma` / `predictor_similarity` / `predictor_stats` | 2026-04-18 Codex review Modularity | Medium | 2026-04-18 |
| TD-008 | Cross-layer: consensus/stats computed once on each side of frontend/backend, drift risk | 2026-04-18 Codex review | High | 2026-04-18 → K-013 |
| TD-009 | Vitest index-based selector residue (AppPage + OHLCEditor) | 2026-04-18 K-010 review W1/W2 | Low | 2026-04-18 → K-014 |
| TD-010 | `predictor.find_top_matches()` `ma_history` silent fallback (K-009 root cause) | 2026-04-18 K-009 review S1 | Medium | 2026-04-18 → K-015 |
| TD-011 | `frontend/design/homepage.pen` still contains `Running prediction...` text node (K-011 drift) | 2026-04-18 K-011 review Drift C | Low | 2026-04-18 |
| TD-012 | visual-report `/app` empty-state screenshot has low value — when backend is unavailable, downgrade to placeholder | 2026-04-18 K-008 review S1 | Low | 2026-04-18 |
| TD-013 | GA4 initGA() lacks idempotent guard + dataLayer typing + unknown route lacks warn (S2/S3/S4) | 2026-04-19 K-018 review S2–S4 | Low | 2026-04-19 |
| TD-K021-01 | Some pages still use Tailwind default `font-mono`, not yet fully migrated to K-021 `mono` (Geist Mono) token | K-021 Engineer retro | Low | 2026-04-20 |
| TD-K021-02 | UnifiedNavBar retains 6 hardcoded hex values (PM Q2 existing-assertion vs user prompt "no hardcode" conflict) | K-021 Reviewer W-3 | Medium | 2026-04-20 → K-025 |
| TD-K021-07 | AppPage `h-screen overflow-hidden` + HomeFooterBar may squeeze predictor at <900px viewport | K-021 Reviewer W-1 | Low | 2026-04-20 |
| TD-K021-08 | HomeFooterBar `email / github / LinkedIn` not wrapped in `<a>` anchors | K-021 Reviewer S-1 | Low | 2026-04-20 |
| TD-K021-09 | `/` route NavBar inactive color not asserted in navbar.spec.ts | K-021 Reviewer S-2 | Low | 2026-04-20 |
| TD-K021-10 | DiaryPage `font-mono` still Tailwind default; reassess switching to `font-mono` (Geist Mono) token at K-024 | K-021 Reviewer S-5 | Low | 2026-04-20 |
| TD-K021-11 | PasswordForm button retains `bg-purple-600 text-white` (Q1 user ruling kept), not migrated to `bg-brick` token | K-021 Reviewer Round 3 S-R3-02 | Low | 2026-04-20 |
| TD-K021-13 | PasswordForm `expiredMessage` uses `text-yellow-400`; on cream background (`#F4EFE5`) contrast ~2.4:1, fails WCAG AA | K-021 Reviewer Round 3 S-NEW-1 | Medium | 2026-04-20 |
| TD-K027-01 | diary-mobile.spec.ts TC-007 only tests 1280px; AC-027-DESKTOP-NO-REGRESSION requires 1024/1280/1440px three viewports | K-027 Reviewer I-002 | Low | 2026-04-21 |
| TD-K027-02 | diary-mobile.spec.ts `.px-4.pb-4` locator is fragile; will silently fail after K-024 structural rewrite | K-027 Reviewer N-001 | Low | 2026-04-21 |
| TD-K027-03 | milestone title overflow attribute not verified (AC-027-TEXT-READABLE includes this requirement but spec lacks the assertion); actual truncation scenario very unlikely under flex-col | K-027 Reviewer N-003 | Low | 2026-04-21 |
| TD-K027-04 | `assertLastCardVisible`'s `waitForTimeout(200)` hardcoded sleep; potentially flaky on slow CI machines; switching to `toBeInViewport()` requires logic refactor; currently 7 tests all pass | K-027 Reviewer R2 I-R2-01b | Low | 2026-04-21 |
| TD-K022-01 | `font-italic` fontFamily class easily confused with `italic` font-style class; should rename `fontFamily.italic` → `fontFamily.newsreader` | K-022 Breadth Review I-2 | Low | 2026-04-21 |
| TD-K022-02 | `SectionLabel` zombie colorMap (purple/cyan/pink/white) kept for backward compatibility; clean up once K-026 confirms AppPage no longer uses it | K-022 Breadth Review I-3 | Low | 2026-04-21 → cleanup after K-026 |
| TD-K030-01 | `AppPage` interaction regression E2E coverage missing (PredictButton sticky position, OHLC edit interaction lack Playwright assertions) | K-030 Code Review I-1 | Low | 2026-04-21 |
| TD-K030-02 | `UnifiedNavBar` `renderLink` local type alias is structurally a subset of `typeof TEXT_LINKS[number]`; should use `typeof`-derived types to avoid drift | K-030 Code Review M-3 | Low | 2026-04-21 |
| TD-K030-03 | `visual-report.ts` should throw rather than fallback to `K-UNKNOWN` when `TICKET_ID` env var is missing, to avoid silent pollution of `docs/reports/` from full Playwright suite | K-030 QA retro + K-034 Phase 1 QA retro (recurrence) | High | 2026-04-23 |
| TD-K030-04 | `frontend/public/diary.json` legacy traditional-Chinese entries from K-021/K-022/K-023 violate `feedback_diary_json_english` English-only hard rule | K-030 QA retro | Medium | 2026-04-21 |
| TD-K029-01 | `about-v2.spec.ts` L474 / L487 Outcome / Learning label Playwright selector uses `locator('span', { hasText: 'Outcome' })` / `hasText: 'Learning'`; label copy is locked safely now, but future data flexibility could cause sibling `<p>` to be wrongly matched | K-029 Reviewer Step 2 W-1 + QA sign-off | Low | 2026-04-22 |
| TD-K025-01 | Tailwind refactor AC grep pattern is a degenerate proxy for non-opacity-modifier utilities (`color:#hex` only matches `/60` etc. alpha variants; non-opacity uses `rgb(R G B / var(...))` form) | K-025 Reviewer W-1 | Medium | 2026-04-22 |
| TD-K034-01 | `scripts/check-pen-json-parity.sh` automation: verify `pen-file` + `pen-mtime-at-export` in `frontend/design/specs/*.json` matches actual `.pen` file mtime; integrate as pre-commit hook | K-034 QA Early Consultation Q1 | Medium | 2026-04-23 |
| TD-K034-02 | `scripts/validate-visual-delta.sh` automation: when ticket has `visual-delta: none`, trigger `git diff main..HEAD -- frontend/src/** frontend/public/**`; block commit on any match | K-034 QA Early Consultation Q3 | Medium | 2026-04-23 |
| TD-K034-03 | Phase 2 expansion: `shared-components.spec.ts` auto-generated NavBar × routes + BuiltByAIBanner × routes pairwise byte-diff matrix, covering full inventory | K-034 QA Early Consultation Q5 (full part) | Medium | 2026-04-23 |
| TD-K034-04 | Designer persona "new-route intake" hard-gate codification (`.pen` frame + specs JSON + PNG + inventory Edit four-piece set must all complete before reporting back to PM) | K-034 QA Early Consultation Q7 | Low | 2026-04-23 |
| TD-K034-05 | Phase 1 QA sign-off implements dual-baseline verification: `scripts/compare-baselines.sh` hash diffs `frontend/e2e/__screenshots__/*.png` vs `frontend/design/screenshots/*.png`; `package.json` `test:e2e:update-snapshots` adds branch-name guard (only `chore/baseline-refresh-*` may execute) | K-034 QA Early Consultation Q2 | Medium | 2026-04-23 |
| TD-K034-06 | Designer persona monthly Pencil orphan audit step; `.pen` schema version bump mechanism (requires Pencil MCP support); upgrade to hard gate on first orphan event | K-034 QA Early Consultation Q4 | Low | 2026-04-23 |
| TD-K034-07 | Define `docs/reports/ci-budget.md`: full Playwright suite >6 min triggers reduction; reduction order visual-report > viewport sweep > shared-component snapshot (snapshot is Sacred) | K-034 QA Early Consultation Q6 | Low | 2026-04-23 |
| TD-K034-P2-15 | Footer per-route snapshot tolerance audit (`/about` 3% drift absorbed; consider per-route baselines with tighter 0.5% tolerance after next Footer edit) | K-034 Phase 2 §4.8 C-2 | Medium | 2026-04-23 |
| TD-K034-P2-16 | S4 h2 "How AI Stays Reliable" computed-style E2E: add `getComputedStyle` fontSize=30px + fontFamily contains Bodoni Moda checks | K-034 Phase 2 §4.8 I-4 | Low | 2026-04-23 |
| TD-K034-P2-17 | K-029 `ticket-anatomy-id-badge` test-target semantic retro cross-note: badge now lives inside FileNoBar trailing slot; assertion still valid via sr-only span | K-034 Phase 2 §4.8 M-1 | Low | 2026-04-23 |
| TD-K034-P3-02 | /diary Footer viewport-padding seam at 640–768px not covered by E2E; trigger: user-reported visible regression in 640–768px window — if reported, add `.spec` with 3-viewport baseline (640/720/768). Scope: single snapshot comparison per breakpoint, tolerance 0.5% per K-034 Phase 2 snapshot precedent. | K-034 Phase 3 Challenge #2 | Low | 2026-04-23 |
| TD-K041-01 | AC-041-SHARED-COMPONENT-UNIFIED has structural grep proof only (no behavioral test verifying Homepage `<DiaryMarker borderRadius={0} topInset={HOMEPAGE_MARKER_TOP_INSET}/>` prop-pass reaches rendered DOM via shared component path, not via accidental equivalence with previous inline render). | K-041 Reviewer depth Step 2 | Low | 2026-04-24 |
| TD-K041-03 | K-028 Sacred "Homepage mobile rail always-visible" has no direct <640px viewport assertion in current suite — pages.spec.ts default viewport covers desktop only; silent regression (default flip + missing Homepage `mobileVisible` prop) would pass. Pre-existing gap surfaced by K-041 depth review, not K-041-introduced. | K-041 Reviewer retro 2026-04-24 | Medium | 2026-04-24 |
| TD-K050-01 | `~/.claude/agents/designer.md` persona supplement — codify BRAND-ASSET exemption category authoring rules (when Designer must surface a runtime-divergence BQ to PM rather than redrawing the Pencil frame; flat-text ↔ runtime-component mapping documentation expectations on per-frame JSON spec). K-050 surfaced the gap when Pencil flat-text node was reinterpreted as interactive components without Designer Pencil edit authority. | K-050 Architect handoff D-TD-K050-01 | Medium | 2026-04-25 |
| TD-K050-02 | `docs/designs/design-system-handbook.md` (NEW) — consolidated Pencil-vs-runtime contract handbook covering all 5 §2 categories (REGULATORY / RESPONSIVE / INHERITED / INHERITED-editorial / BRAND-ASSET) with worked examples, exemption-row authoring template, and `_design-divergence` JSON schema reference. Currently each category is one bullet in `design-exemptions.md` §2 preamble — handbook is the long-form documentation for Designer / Architect / Engineer / Reviewer onboarding. | K-050 Architect handoff D-TD-K050-02 | Low | 2026-04-25 |
| TD-K050-03 | `ssot/system-overview.md` `updated:` frontmatter line narrative-chain bloat cleanup — current line is 1 super-paragraph chaining K-046 → K-045 → K-044 → K-040 → K-034 P3 / P2; K-050 appends one more block. Path Y minimal (per K-050 design doc §9) keeps appending, but chain readability degrades. Future ticket: extract historical entries into a `## Architecture Changelog` section, keep `updated:` to last 1-2 tickets only. | K-050 Architect handoff D-TD-K050-03 | Low | 2026-04-25 |
| TD-K078-01 | `backend/main.py` imports `predictor` twice: once as named import (`from predictor import predictor`) and once as the module alias `_predictor = predictor` (module-level re-binding). Consolidate to a single import style during K-079 when predictor module is next touched. | K-078 Reviewer D-2 (PM accepted as-is) | Low | 2026-05-02 → K-079 |

<!-- TD-K041-02: Reviewer's summary referenced 3 TD candidates, but retro body only enumerated 2 (TD-K041-01 prop-pass coverage + TD-K041-03 Sacred viewport gap). The 3rd candidate is un-documented in retro body and not filed. -->

---

## TD-003 — Upload history concurrency race

**Source:** Codex code review 2026-04-18 P2-A

`backend/main.py` stores `_history_1h` / `_history_1d` as module globals; the read-merge-write-swap flow of `upload_history_file()` lacks any synchronization mechanism.

**Risk:** Concurrent uploads may lose bars; the last writer overwrites other requests' merge results; risk amplifies under multi-worker deployment.

**PM ruling (2026-04-18):** Current deployment is single-user, single-worker; concurrency probability is low — file as tech debt for now. If we ever switch to multi-worker or open multi-user upload, immediately escalate to a P1 ticket.

**Recommended approach (RFC required before Architect engagement):**
- Option A: wrap update/write flow with `asyncio.Lock`
- Option B: extract a `history_repository` layer that handles atomic write + lock internally

Scheduling trigger: when multi-worker deployment is decided, or when TD-006 (backend/main.py split) starts — handle together.

---

## TD-004 — PredictorChart effect deps incomplete

**Source:** Codex code review 2026-04-18 P2-B

The `PredictorChart` useEffect inside `frontend/src/components/MatchList.tsx` depends on `startDate` / `timeframe` / array lengths, not on actual candle values. If a rerun prediction returns the same length but different bar contents, an expanded card may display an outdated chart.

**PM ruling (2026-04-18):** The current user interaction path rarely triggers this (most scenarios change timeframe or startDate), but the design contains a bug; tolerate the current state for a short while and handle it in the same batch as TD-005 (AppPage split).

**Recommended approach:** Change effect deps to a memoized chart input (or data identity hash); also remove the exhaustive-deps suppression along the way.

---

## TD-005 — AppPage.tsx over-responsibility

**Source:** Codex code review 2026-04-18 Modularity

`frontend/src/AppPage.tsx` simultaneously handles official CSV parsing / upload workflows / MA99 loading / prediction orchestration / derived statistics / selection state / layout composition.

**PM ruling (2026-04-18):** Currently functional; not urgent — but this split must happen before the next UI-related feature begins, to avoid further accumulation.

**Recommended approach (RFC required before Architect engagement):**
- `useOfficialInput()`
- `useHistoryUpload()`
- `usePredictionWorkspace()`
- Extract left/right rails as presentational sub-sections

Scheduling trigger: before opening the next `/app` UI-related ticket.

**Architect note (2026-04-18):** Architect RFC required (after TD-008). When splitting, `usePredictionWorkspace()` will be affected by the TD-008 ruling (hook boundary changes once consensus/stats is extracted); order: **TD-008 RFC accepted → TD-005 RFC → implementation**.

---

## TD-006 — backend/main.py split

**Source:** Codex code review 2026-04-18 Modularity

`backend/main.py` mixes FastAPI wiring / CSV parsing / state management / persistence / prediction orchestration / fallback routing.

**PM ruling (2026-04-18):** Forms a backend refactor batch alongside TD-003 and TD-007; priority is after the UI fixes (K-009/010/011/012).

**Recommended approach (RFC required before Architect engagement):**
- `history_repository.py`
- `history_service.py`
- `prediction_service.py`
- `main.py` retained as a thin routing layer only

**Architect note (2026-04-18):** Architect RFC required (after TD-008). Recommend folding TD-003 (concurrency race) into the same RFC (the `history_repository` layer can handle atomic write + lock at the same time).

---

## TD-007 — predictor.py split

**Source:** Codex code review 2026-04-18 Modularity

`backend/predictor.py` contains time normalization / MA99 helpers / similarity scoring / trend classification / 1D aggregation / stats generation.

**PM ruling (2026-04-18):** Same batch as TD-006.

**Recommended approach:**
- `predictor_ma.py`
- `predictor_similarity.py`
- `predictor_stats.py`
- `predictor.py` retained as orchestration entrypoint

**Architect note (2026-04-18):** Architect RFC required (after TD-008). If TD-008 takes Option C, `compute_stats` will be locked by contract test; when splitting into `predictor_stats.py`, the fixture must migrate in sync. RFC order: **TD-008 → TD-007**.

---

## TD-008 — Cross-layer duplicate computation

**Source:** Codex code review 2026-04-18

projected future bar aggregation / stats derivation / time aggregation each have one implementation on frontend and backend, prone to long-term drift.

**PM ruling (2026-04-18):** Marked as "high-priority tech debt". Do not act immediately, but the single source of truth must be decided before TD-005 + TD-006 begin (recommendation: unify by computing the payload on backend, frontend purely renders).

**Architect note (2026-04-18):** RFC draft produced at [`docs/designs/TD-008-rfc-consensus-source-of-truth.md`](designs/TD-008-rfc-consensus-source-of-truth.md). Lists Option A (backend only) / B (frontend only) / C (shared schema + contract test); **recommends Option C** (no UX regression + CI locks drift + API backward-compatible). Awaiting PM ruling to open K-XXX implementation ticket.

**PM ruling (2026-04-18):**

| Item | Ruling |
|------|--------|
| Plan | Accept **Option C** (shared schema + frontend computes subset + backend computes full set + contract test) |
| Open Q1: fixture path | Accept recommendation A — `backend/tests/fixtures/stats_contract_cases.json` (do not introduce a new `shared/` directory layer; frontend tests read via relative path) |
| Open Q2: CI contract drift job | **Defer**, add in next phase; for this cycle rely on PR reviewer manual gate + auto-failing fixtures on both sides as safety net |
| Owners | Engineer (implementation), senior-engineer agent (code review) |
| Corresponding ticket | [K-013](tickets/K-013-consensus-stats-contract.md) |
| RFC status | `draft` → `accepted` (see PM ruling block at bottom of RFC) |

**Scheduling order (post-PM-confirmation version):**
1. First do K-010 (CI safety-net fix, minimal change)
2. Then K-009 (1H correctness bug — highest priority, narrow scope)
3. K-011 / K-012 (UX cleanup + E2E assertion completion)
4. K-013 (TD-008 implementation, biggest change so last; contract test locks drift)
5. After K-013 is accepted, then start TD-005 / TD-006 / TD-007 split RFCs

---

## TD-009 — Vitest index-based selector residue

**Source:** K-010 senior-engineer review W1/W2 (2026-04-18)

The following locations still use `getAllBy...()[N]`-style index-based selectors and will become fragile if the corresponding component structure changes (OHLCEditor field order, AppPage input layout):

- `frontend/src/__tests__/AppPage.test.tsx` lines 66 / 86 / 89 / 92 — `getAllByPlaceholderText('Open')[0]`
- `frontend/src/__tests__/OHLCEditor.test.tsx` line 25 — same-pattern assertion

**Risk:** Currently not red, but is the same class of issue as AC-010-ROBUST; if OHLCEditor later adds a second Open-style input (e.g. reserved bar editor or a second-tier form), it breaks.

**PM ruling (2026-04-18):** Low-priority tech debt. Reasoning:
- Suite is fully green now; does not block merge gate
- Fix approach is clear (switch to accessible name / `data-testid`); fix cost is low but immediate value is none
- Cleanup cost is lowest at the next OHLCEditor structural change (same-cycle test rewrite)

**Recommended approach:** Replace with `getByLabelText` / `getByRole({ name, exact })` / `data-testid`; also add accessible names for a11y.

**Scheduling trigger:** When the next UI structural change ticket opens for OHLCEditor or the AppPage upload area, sweep cleanup in the same ticket; or process as standalone batch via K-014.

**Corresponding ticket:** [K-014](tickets/K-014-vitest-index-selector-cleanup.md)

---

## TD-010 — predictor `find_top_matches()` ma_history silent fallback

**Source:** K-009 senior-engineer review 2026-04-18 Suggestion S1

`backend/predictor.py` `find_top_matches()` contains `if ma_history is None: ma_history = history` silent fallback. The root reason K-009 bug reached production was exactly this: the 1H path in `backend/main.py` did not pass `ma_history`; `find_top_matches()` silently used 1H history as 30-day MA data, producing wrong filter / correlation results with no log / error.

**Risk:** Any future new caller of `find_top_matches()` that forgets to pass `ma_history` will repeat K-009. The K-009 regression test only locks the current 1H call site behavior; it does not protect future callers. Compile-time / linter / test suite cannot auto-catch a missing argument.

**PM ruling (2026-04-18):** File as tech debt; do not fold into K-009 scope. Reasoning:
- K-009 regression test already locks current behavior; not an active bug
- Changing the signature equals modifying a public API — belongs to the predictor-layer refactor scope; should batch with TD-007 (`predictor.py` split)
- Once K-013 (TD-008 Option C) lands, the contract-test foundation is in place; implementing Option A then has lowest cost
- Folding it into cycle #2 immediately would drag the whole K-011/012/013/008/014 pipeline

**Recommended approach (Architect-RFC pre-draft, see K-015):**
- Option A: `ma_history` becomes a required keyword-only parameter (recommended — compile-time catch, zero silent fallback)
- Option B: keep optional but assert at entry (test raise) + warning (prod log)

**Scheduling trigger:** After K-013 accepted / when TD-007 RFC starts. If a new `find_top_matches()` caller appears in between, escalate to P1.

**Corresponding ticket:** [K-015](tickets/K-015-find-top-matches-ma-history-required.md)

---

## TD-011 — homepage.pen design spinner text node not synced with K-011

**Source:** K-011 code review 2026-04-18 Drift C

`frontend/design/homepage.pen` still contains a `Running prediction...` text node, inconsistent with the post-K-011 `LoadingSpinner` + `label?: string` prop behavior.

**Risk:** Low — `.pen` files are design snapshots; not part of build / runtime. But the next time a Designer agent enters to do UI adjustments, using this as the baseline would copy the stale copy into a new design.

**PM ruling (2026-04-18):** This belongs exclusively to the Designer agent — requires Pencil MCP operations + `get_screenshot` visual verification, a different toolchain from Engineer; do not escalate to a ticket; record as tech debt and sync at the next Designer engagement (e.g. K-008 Visual Report or any future UI redesign ticket).

**Recommended approach:**
- Designer agent updates the corresponding text node via `batch_design`:
  - Option A: if the design-portrayed scenario is "Predict flow", keep English copy but switch to a generic placeholder (e.g. `[loading label]`)
  - Option B: directly reflect the new implementation; per-callsite scenarios use scenario-specific copy ("Loading diary…" / "Loading content…" / keep English "Running prediction..." on the PredictButton screen)
- After update, take screenshot via `get_screenshot` and submit to PM for review

**Scheduling trigger:** Next Designer agent engagement, sync along the way; escalate to a standalone small ticket if no Designer engagement within 3 months.

---

## TD-012 — visual-report `/app` empty-state screenshot has low value

**Source:** K-008 senior-engineer review 2026-04-18 Suggestion S1

When `frontend/e2e/visual-report.ts` runs, the `/app` route stops at loading / empty-state due to backend ECONNREFUSED (E2E env has no backend); screenshot height 720. AC-008-CONTENT technical requirements (full-page screenshot + route marker) are met, but the value of this screenshot for "visual acceptance" is near zero.

**Risk:** Low — does not affect script operation; does not affect the other 3 route screenshots. Pure information-density issue: when a user opens the HTML report and flips to the `/app` section, they only see the empty-state loading and cannot judge whether actual page functionality has regressed.

**PM ruling (2026-04-18):** Register as low-priority tech debt. Reasoning:
- Not an active bug; AC-008-CONTENT still passes
- Solution scope exceeds K-008 scope (involves backend probe strategy / E2E fixture / mock choice)
- The current 3 other route screenshots (`/`, `/diary`, `/about`) already cover most visual acceptance
- Fix cost is moderate but immediate benefit is limited; handle along with a related ticket (e.g. visual-report v2 / `/app` E2E expansion).

**Recommended approach (Architect-RFC pre-draft):**
- Option A: at script startup, probe backend availability (`fetch /api/health` timeout 2s); if unavailable, mark `/app` route as `auth-required` / `backend-unavailable` placeholder and exclude from captured count
- Option B: introduce a backend fixture or mock server (MSW / local FastAPI fixed payload) so `/app` can render the actual screen
- Option C: downgrade to "log in + upload mock CSV before running `/app`" as full E2E preparatory flow (heavy, not recommended)

**Scheduling trigger:** Next visual-report-related ticket, or when expanding `/app` E2E coverage — fold in.

---

## TD-013 — GA4 initGA() lacks idempotent guard + dataLayer typing imprecise + unknown route lacks warn

**Source:** K-018 senior-engineer review 2026-04-19 S2/S3/S4 (three items merged into the same TD)

**S2 — initGA() may double-inject under HMR reload:** `initGA()` does not check whether `window.gtag` already exists; HMR reload may insert `<script src="gtag.js">` twice, causing duplicate dataLayer event push in the dev environment. Production GA4 gtag.js itself dedupes, so live data accuracy is unaffected.

**S3 — dataLayer typing imprecise:** `window.dataLayer` is declared as `unknown[]`; each element is actually `unknown[]` (Array); switching to `unknown[][]` improves IDE type-hint precision. Pure DX improvement, no runtime impact.

**S4 — Unknown route lacks console.warn:** the pageview tracking switch contains a fallback; unknown routes silently fall back to `document.title` without warning, making it hard to notice during debugging that title doesn't match the route.

**PM ruling (2026-04-19):** All three are low-priority tech debt. Reasoning:
- S2 does not affect production correctness, only dev experience; idempotent guard is cheap but lacks immediate acceptance scenario
- S3 is pure type refinement; linter does not warn; doesn't block tests
- S4 has no AC requirement; all currently-supported routes have a case; unknown routes do not exist in normal SPA operation paths

**Recommended approach:**
- S2: add `if (window.gtag) return;` idempotent guard at the top of `initGA()`
- S3: `window.dataLayer: unknown[][]`
- S4: add `console.warn(\`[GA] Unknown route: ${path}\`)` to the `default` case

**Scheduling trigger:** Next GA-related ticket (e.g. SPA pageview E2E, GA setup refactor) sweep along the way; or handle in a subsequent DX cleanup ticket.

---

## TD-K021-01 — Some pages' fonts not migrated to mono token

**Source:** K-021 Engineer retrospective 2026-04-20

Some components still use Tailwind default `font-mono` (not bound to Geist Mono CDN font); not yet fully migrated to K-021 theme `mono` token. Architect design doc has listed this as gradual migration.

**PM ruling (2026-04-20):** Low priority. Reasoning: existing `font-mono` falls back to a system monospace under Tailwind default; visual difference is small; this ticket's AC-021-FONTS only requires `font-mono` computed fontFamily to contain "Geist Mono"; the token is registered; the actual class migration is gradual cleanup.

**Scheduling trigger:** Migrate along the way during K-022 / K-023 / K-024 page redesigns.

---

## TD-K021-02 — UnifiedNavBar hardcoded hex (→ K-025)

**Source:** K-021 Reviewer merged report W-3 (2026-04-20)

`UnifiedNavBar.tsx` retains 6 hex values (`text-[#9C4A3B]` etc.); `navbar.spec.ts` has 8 regex assertions — PM Q2 ruling allowed retention to avoid K-005 existing-assertion regression, but this conflicts with the user prompt "no hardcoded hex".

**PM ruling (2026-04-20):** Open follow-up ticket K-025 to handle separately. Reasoning: (a) K-021 AC-021-NAVBAR explicitly allows `text-[#9C4A3B]` or `text-brick-dark` (compiled CSS is identical); (b) modifying NavBar + 8 spec sites at once is an independent unit of work — folding it in would pollute the fix-now batch; (c) the user prompt "no hardcoded" is a future norm and needs a formal ticket ruling on its applicable scope.

**Corresponding ticket:** [K-025](tickets/K-025-navbar-hex-to-token.md)

---

## TD-K021-07 — AppPage squeeze at <900px viewport

**Source:** K-021 Reviewer merged report W-1 (2026-04-20)

AppPage `h-screen overflow-hidden` + newly added HomeFooterBar; below 900px viewport, the predictor panel may be squeezed. Engineer only verified 1280×800.

**PM ruling (2026-04-20):** Low-priority tech debt. Reasoning: AppPage design §8.1 explicitly states "no mobile screenshot; AppPage is not mobile-friendly by design"; co-grouped with TD-K021-04 `/app` redesign; fold into the future post-K-025 AppPage redesign ticket (placeholder note: "process when TD-K021-04 triggers").

**Recommended approach:** Change HomeFooterBar to `flex-shrink-0` + add `min-h-0` scroll container to AppPage; or add a 900×600 viewport Playwright case as smoke test.

**Scheduling trigger:** Fold in when TD-K021-04 AppPage redesign ticket starts.

---

## TD-K021-08 — HomeFooterBar text lacks `<a>` anchors

**Source:** K-021 Reviewer merged report S-1 (2026-04-20)

The three items `email / github / LinkedIn` in `HomeFooterBar` are plain text, not wrapped in `<a href>` anchors, so they cannot be clicked to navigate.

**PM ruling (2026-04-20):** Low priority. K-021 AC-021-FOOTER only specifies "single-line info row" text assertions; does not require clickable links. Visitors can manually copy; not blocking UX.

**Scheduling trigger:** K-025 or any UI-polish ticket — handle along the way.

---

## TD-K021-09 — `/` route navbar inactive color not asserted

**Source:** K-021 Reviewer merged report S-2 (2026-04-20)

`navbar.spec.ts` does not assert that on `/`, the inactive items (App / Diary / About) have color `#1A1814/60` or the corresponding muted token. AC-021-NAVBAR only requires the active item; inactive is uncovered.

**PM ruling (2026-04-20):** Low priority. The current AC does not explicitly require inactive color; this ticket does not expand scope; fold into K-025 navbar rewrite to add the assertion.

**Scheduling trigger:** K-025 or any subsequent navbar-change ticket.

---

## TD-K021-10 — DiaryPage font-mono not migrated to mono token

**Source:** K-021 Reviewer merged report S-5 (2026-04-20)

DiaryPage uses Tailwind default `font-mono`; not bound to Geist Mono CDN. Reassess at K-024 when handling diary structural rework.

**PM ruling (2026-04-20):** Low priority. K-024 ticket is responsible.

**Scheduling trigger:** K-024 starts.

---

## TD-K021-11 — PasswordForm button retains purple, not migrated to brick token

**Source:** K-021 Reviewer Round 3 S-R3-02 (2026-04-20)

`frontend/src/components/business-logic/PasswordForm.tsx:37` retains `bg-purple-600 text-white`. K-021 Q1 user ruling kept it temporarily (to avoid affecting current login behavior), but the paper palette in `design doc §6` only contains `brick` / `brick-dark` as the primary accent color; purple is a non-token off-system color.

**Risk:** Low — login entry visual disconnects from the design system, but functionally works fine; if PasswordForm is later refactored as a whole, this falls under "one-off design-decision migration" scope.

**PM ruling (2026-04-20):** Register as low-priority tech debt. Q1 ruling kept it as "do not touch in this ticket"; the TD record states the future expectation of "migrate to `bg-brick` in one batch" so that three months later a new developer doesn't mistake the purple as deliberately preserved.

**Recommended approach:** When the PasswordForm batch refactor or `/business-logic` page structural redesign ticket starts, change the button to `bg-brick hover:bg-brick-dark text-paper` + sync AC assertion.

**Scheduling trigger:** Fold in when the `/business-logic` page structural redesign ticket starts; or open a standalone small ticket if no scope-trigger occurs within 3 months.

---

## TD-K021-13 — PasswordForm expiredMessage insufficient contrast

**Source:** K-021 Reviewer Round 3 S-NEW-1 (2026-04-20)

The `expiredMessage` text in `frontend/src/components/business-logic/PasswordForm.tsx:20` uses `text-yellow-400` (about `#FACC15`); on the K-021 sitewide cream background (`#F4EFE5`) the contrast is roughly 2.4:1, failing WCAG AA (normal text 4.5:1). At K-017, PasswordForm sat on a dark background where this color was reasonable; after K-021 body cream-ification, it is a leftover.

**Risk:** Medium — affects readability of the "session expired" message; if the user does not see the error message of the login flow, they may misjudge as "cannot log in". Accessibility issue, not a pure-visual matter.

**PM ruling (2026-04-20):** Medium-priority tech debt. Reasoning:
- Not an active bug (message still renders, just low contrast)
- This ticket's fix-now batch is overloaded; Round 3 does not expand scope
- Fix is clear (switch to `text-amber-700` or `text-brick-dark`, WCAG AA ≥4.5:1)

**Recommended approach:** `text-yellow-400` → `text-amber-700` (contrast ~5.8:1) or `text-brick-dark` (contrast ~6.2:1, consistent with design system). Test recommendation: add `@axe-core/playwright` site-wide accessibility scan.

**Scheduling trigger:** Same family as TD-K021-11 (`/business-logic` page structural redesign) — handle together; or sweep relevant shared primitives when K-022 /about redesign occurs.

---

## TD-K027-01 — diary-mobile.spec.ts desktop TC only covers 1280px

**Source:** K-027 Code Review I-002 (2026-04-21)

`diary-mobile.spec.ts` TC-007 only tests 1280px viewport; AC-027-DESKTOP-NO-REGRESSION requires 1024px / 1280px / 1440px three viewports.

**Risk:** Low — `sm:` prefix = 640px; the three desktop viewports apply identical Tailwind classes; no breakpoint difference. Probability of bug at 1024px / 1440px is extremely low.

**PM ruling (2026-04-21):** Low-priority tech debt. The CI cost vs. benefit of adding three visually-identical desktop TCs is unbalanced; complete the three-viewport desktop TC when K-024 starts (diary structural rework).

**Scheduling trigger:** When K-024 starts, the design doc's desktop regression test spec must enforce all three viewports.

---

## TD-K027-02 — diary-mobile.spec.ts `.px-4.pb-4` locator fragile

**Source:** K-027 Code Review N-001 (2026-04-21)

Some locators in `diary-mobile.spec.ts` rely on the `.px-4.pb-4` class combination to locate the MilestoneSection expanded area; once K-024 removes the accordion structure, these classes will not exist and the relevant specs will silently fail (pass without truly testing the target element).

**Risk:** Low-medium — current K-027 tests pass; does not affect today; once K-024 starts, if Reviewer fails to audit this locator, the result will be E2E pass with no real coverage.

**PM ruling (2026-04-21):** Low-priority tech debt. K-024 Reviewer checklist must include "audit whether diary-mobile.spec.ts locators are still valid" as a hard requirement of code review.

**Scheduling trigger:** Mandatory audit during K-024 Reviewer stage; optionally update the locator to a structure-agnostic selector (e.g. `data-testid`) during K-024 Engineer implementation.

---

## TD-K027-03 — milestone title overflow attribute not verified

**Source:** K-027 Code Review N-003 (2026-04-21)

AC-027-TEXT-READABLE requires "no text-overflow: ellipsis truncation, no overflow: hidden hiding characters", but `diary-mobile.spec.ts` does not assert overflow computed style on the milestone title element.

**Risk:** Low — milestone title takes a full-row width under `flex-col`; no `truncate`-style class; in real scenarios the chance of character truncation is near zero.

**PM ruling (2026-04-21):** Low-priority tech debt. When K-024 design occurs, the title element structure may change (Bodoni 64px h1 etc.) — adding the title overflow check then has the lowest cost and the most meaning.

**Scheduling trigger:** When AC-024-ENTRY-LAYOUT Playwright assertions are planned, add the title overflow verification into the spec.

---

## TD-K027-04 — assertLastCardVisible hardcoded sleep

**Source:** K-027 Code Review Round 2 I-R2-01b (2026-04-21)

After `page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))`, `assertLastCardVisible` waits for scroll-stable via `waitForTimeout(200)`; on slow CI machines (CPU throttle, Headless Chrome startup latency) the hardcoded sleep may be insufficient, causing `boundingBox()` to be taken before scroll completes — an unstable assertion.

**Risk:** Low — currently 7/7 tests pass; 200ms is plenty on local machines; only emerges if the CI environment has throttle.

**PM ruling (2026-04-21):** Low-priority tech debt. Switching to Playwright `toBeInViewport()` requires refactoring the `assertLastCardVisible` logic (`toBeInViewport()` only verifies "visible in viewport", not "card bottom ≤ viewportHeight") — not a direct swap; and there is no current CI flakiness report; sweep when K-024 rewrites the diary spec.

**Recommended approach:**
- Option A: switch to `page.waitForFunction(() => document.readyState === 'complete')` or scroll-event listener + Promise resolve to ensure scroll fully stops
- Option B: switch to `lastCard.scrollIntoViewIfNeeded()` instead of `window.scrollTo(0, scrollHeight)` + 200ms sleep, letting Playwright manage scroll positioning

**Scheduling trigger:** Sweep along with K-024 diary spec rewrite; or escalate immediately if CI reports flaky records.

---

## TD-K022-01 — `font-italic` fontFamily naming semantic confusion

**Source:** K-022 Breadth Review I-2 (2026-04-21)

In `tailwind.config.ts`, `theme.extend.fontFamily.italic` points to the Newsreader font, conflicting in name with Tailwind's native `italic` (font-style); easy to misread. Current users must write `font-italic italic` simultaneously — the former is the font class, the latter is the italic class.

**Risk:** Low — functions correctly; pure naming confusion; new developers or first-time Engineers easily misunderstand.

**PM ruling (2026-04-21):** Low-priority tech debt. Renaming requires syncing all components using `font-italic` (grep + bulk replace); a one-off cleanup, no immediate safety/functional risk.

**Recommended approach:** In `tailwind.config.ts`, `fontFamily.italic` → `fontFamily.newsreader`; grep the whole project and bulk-replace `font-italic` → `font-newsreader`; sync E2E spec `computed fontFamily` assertions need no changes (compiled CSS is identical).

**Scheduling trigger:** Next time tailwind.config.ts has structural changes, rename along the way; or open a standalone small ticket (DX cleanup batch) for batch processing.

---

## TD-K022-02 — `SectionLabel` legacy dark colorMap zombie code

**Source:** K-022 Breadth Review I-3 (2026-04-21)

`components/common/SectionLabel.tsx` retains `purple/cyan/pink/white` color options for backward compatibility, but post-K-022 only `/about` uses SectionLabel-related components (in `SectionLabelRow` form), and does not use the above colors.

**Risk:** Low — zombie code; no functional impact; once K-030 confirms AppPage also doesn't reference it, these colorMap branches can be safely removed.

**PM ruling (2026-04-21 update):** K-026 already superseded by K-030 (K-030 redefines `/app` as a standalone tool, will redo AppPage palette and structure). After K-030 closed, Reviewer confirms AppPage consumer status; if confirmed unused, fold cleanup into K-030 or a standalone small ticket for one-shot removal.

**Recommended approach:** After K-030 closed, grep `SectionLabel` usage across the project; confirm only `/about`-related components use it (and all use the new prop format); remove `purple/cyan/pink/white` colorMap branches; simplify type definitions in sync.

**Scheduling trigger:** Within one review cycle after K-030 closed.

---

## TD-K030-01 — AppPage interaction regression E2E coverage missing

**Source:** K-030 Code Review I-1 (2026-04-21)

After K-030 Engineer delivery, Vitest 36 tests pass, but they only verify render (`@testing-library/react` shallow render); no Playwright spec asserts PredictButton sticky position, OHLC table edit interaction, chart rerender, etc. — internal behaviors of the `/app` tool. AC-030-FUNC-REGRESSION is maintained only via existing Vitest + existing E2E suite; no interaction-layer assertions added.

**Risk:** Low — QA visual diff (Pencil v1 `ap001` + get_screenshot) + existing Vitest render tests still cover main regressions; but if sticky positioning later silently breaks due to CSS flex-context change (e.g. removing `h-screen` or switching to `min-h-screen`), existing tests cannot catch it.

**PM ruling (2026-04-21):** Low-priority tech debt; this ticket does not expand scope. Reasoning: (a) K-030 core scope is "isolation layer" (new-tab + chrome removal + bg), not `/app`-internal interaction hardening; (b) sticky positioning is visually covered by existing Playwright `ma99-chart.spec.ts` + `visual-report.ts`; (c) maximum benefit comes from completing interaction E2E during the TD-005 (`AppPage.tsx` over-responsibility) refactor.

**Recommended approach:** Add `frontend/e2e/app-interaction.spec.ts` asserting (1) PredictButton `position: sticky` + `bottom: 0` computed style; (2) OHLC table cell-edit triggers state update; (3) chart rerenders after Predict button click.

**Scheduling trigger:** Fold into the TD-005 `AppPage.tsx` split ticket when it starts; or process via a standalone small ticket.

---

## TD-K030-02 — UnifiedNavBar renderLink type alias should use typeof derivation

**Source:** K-030 Code Review M-3 (2026-04-21)

In `frontend/src/components/UnifiedNavBar.tsx`, the `renderLink` function declares its `link` parameter type as a local inline `{ label: string; path: string; hidden?: boolean; external?: boolean }`, structurally a subset of a `TEXT_LINKS` entry; if `TEXT_LINKS` entry shape is later extended (e.g. `icon` / `analyticsId`), `renderLink` needs a manual type sync — drift risk.

**Risk:** Low — pure DX / type-derivation idiom difference; no runtime impact. Current TEXT_LINKS fields are stable.

**PM ruling (2026-04-21):** Low-priority tech debt. Reviewer suggests changing to `typeof TEXT_LINKS[number]` for auto-derivation — one-line edit, no functional change; but does not block K-030.

**Recommended approach:** `renderLink(link: typeof TEXT_LINKS[number], isMobile: boolean)` derivation; ensures `renderLink` signature auto-syncs when TEXT_LINKS gains new fields.

**Scheduling trigger:** Fold into TD-K021-02 / K-025 NavBar hex-to-token follow-ups, or any NavBar structural change ticket — handle along the way.

---

## TD-K030-03 — visual-report.ts fallback `K-UNKNOWN` when TICKET_ID missing

**Source:** K-030 QA retrospective 2026-04-21

When `frontend/e2e/visual-report.ts` runs without `TICKET_ID` env var, current fallback writes `K-UNKNOWN-visual-report.html` into `docs/reports/`. K-030 QA accidentally triggered an env-var-less run during a full Playwright suite run, producing a `K-UNKNOWN-visual-report.html` pollution file (manually cleaned, then re-ran with `TICKET_ID=K-030 npx playwright test visual-report.ts`).

**Risk:** Medium — if CI or a developer runs the full suite without env var, `K-UNKNOWN` files get written silently; if a subsequent commit accidentally stages these files, version control gets polluted. Currently `docs/reports/*.html` is in gitignore, mitigating commit pollution, but the local dir still gets overwritten.

**PM ruling (2026-04-21):** Medium-priority tech debt. Reasoning: (a) gitignore currently blocks commit-layer pollution; (b) local pollution requires QA / developer manual cleanup, affecting report credibility; (c) fix is simple (change fallback to throw), but it's tooling-scope, unrelated to K-030 feature — do not expand scope.

**Recommended approach:** At the top level of `frontend/e2e/visual-report.ts` (outside the Playwright test discovery stage, to comply with `feedback_test_module_toplevel_pure` — move into `test.beforeAll` or config setup), read `process.env.TICKET_ID`; if absent, directly `throw new Error('TICKET_ID env var required for visual-report.ts')`; remove the `K-UNKNOWN` fallback.

**Recurrence log:**
- 2026-04-23 K-034 Phase 1 QA sign-off produced second `K-UNKNOWN-visual-report.html` pollution file despite `qa.md` persona §Sign-off stage step 1 warning (`K-UNKNOWN output = failure, must re-run`). Priority bumped Medium → High (recurrence count = 2). Post-step filename verification gate added to `qa.md` §Sign-off stage step 2a as compensating control, but the tooling-level fix (throw on missing `TICKET_ID` in `visual-report.ts`) remains the correct root-cause solution.

**Scheduling trigger:** Next visual-report tooling adjustment or when CI adds a visual-report job — handle in same pass. Recurrence count = 2 triggers escalation; next time visual-report-related work is touched, close immediately, do not defer further.

---

## TD-K030-04 — diary.json K-021/K-022/K-023 legacy traditional-Chinese entries violate English-only hard rule

**Source:** K-030 QA retrospective 2026-04-21

In `frontend/public/diary.json`, the milestone items related to K-021 / K-022 / K-023 partially have `text` fields in traditional Chinese, violating the `~/.claude/memory/feedback_diary_json_english.md` hard rule ("milestone names and text fields must be English; outward-facing portfolio page").

**Risk:** Medium — outward-facing portfolio page has language inconsistency; affects recruiter / visitor experience. Not a functional issue, but is user-facing content.

**PM ruling (2026-04-21):** Medium-priority tech debt. Reasoning: (a) the rule was codified at the K-024 ticket; K-021/22/23 are historical entries; (b) one-off translation is an independent unit of work, not in K-030 scope (K-030 is `/app` isolation); (c) wording must be reviewed entry by entry, do not rush.

**Recommended approach:** Translate K-021/022/023 milestone items entry by entry, keeping technical proper nouns intact (`UnifiedNavBar`, `HomeFooterBar`, etc.); after translation, run `DiaryPage.spec.ts` to confirm no E2E breakage.

**Scheduling trigger:** Fold into the next diary-class ticket (K-024 /diary structural rework or any other diary.json update); or open a standalone small ticket.

---

## TD-K025-01 — Tailwind refactor AC grep pattern degenerate proxy

**Source:** K-025 Reviewer depth (Step 2) W-1 2026-04-22

The "pre==post declaration count" grep in AC-025-REGRESSION effectively monitors only 2 of the 4 hex patterns (`color:#1a1814` variants / `border-color:#1a1814`); the other 2 (`color:#9c4a3b` / `background-color:#f4efe5`) have count 0 both pre and post — the assertion holds regardless of whether the refactor is correct.

**Root cause:** QA Q1's initially-suggested grep patterns were not sanity-checked against actual dist CSS form. Tailwind JIT emits `color:rgb(R G B / var(--tw-text-opacity, 1))` for non-opacity-modifier utilities; only opacity variants (`/60`, `/80`) emit lowercase-hex-with-alpha-byte form (`color:#1a181499`). PM integrated the suggestion into the AC, Architect copied to design doc, Engineer executed — none re-verified the actual pattern match counts.

**Actual impact on this ticket:** None. Reviewer behavior-diff truth table + dual-rail assertions (aria-current + toHaveCSS) independently proved rendered-color equivalence; grep is an additional monitoring layer. Outcome unaffected.

**Risk:** Medium — future Tailwind refactors applying the same AC template could think they are covered when in fact they are not. Need persona/skill-layer codification of a raw-count sanity rule (this ticket synchronously executes).

**PM ruling (2026-04-22):** Accept as TD; do not block K-025 close. Reasoning: (a) behavioral equivalence is independently proven by other gates; (b) fixing the AC requires re-running Engineer verification at disproportionate cost; (c) sync-codify Reviewer/QA persona hard gates to prevent future refactor tickets from repeating (see `feedback_refactor_ac_grep_raw_count_sanity.md`, `reviewer.md` §Pure-Refactor Behavior Diff + `qa.md` §Early Consultation gate).

**Recommended approach:** When the next Tailwind refactor-class ticket builds its AC, the pattern list must simultaneously cover:
- Named selector positive existence (`.text-brick-dark { color:` count > 0)
- Non-opacity-utilities `rgb(R G B /` form count pre==post
- Opacity-modifier-utilities alpha-byte hex form count pre==post
- Any pattern with raw count 0 has "no monitoring power" and must be replaced; cannot be used as equivalence evidence

**Scheduling trigger:** When the next Tailwind token refactor ticket starts, require this as the AC template; or process via a standalone TD cleanup ticket.

---

## TD-K029-01 — about-v2.spec.ts Outcome / Learning label selector future data-flexibility risk

**Source:** K-029 Reviewer Step 2 W-1 + QA sign-off (2026-04-22, both independently flagged as TD candidates)

`frontend/e2e/about-v2.spec.ts` L474 + L487 use `locator('span', { hasText: 'Outcome' })` / `locator('span', { hasText: 'Learning' })` as selectors for the TicketAnatomyCard Outcome / Learning label spans. At K-029 implementation, the Outcome / Learning labels of TicketAnatomyCard are **hardcoded in component source** (not data-driven), and the sibling `<p>` element text contains `outcome` / `learning` descriptive sentences — at present no `hasText` mismatch risk exists; all 21 assertions are green.

**Risk:** Low — three conditions must all hold to break: (a) schema becomes data-driven label; (b) new label text contains the string `Outcome` / `Learning` (case-sensitive full match); (c) sibling `<p>` text simultaneously contains that string. Currently the label is a component-level literal; changing requires Architect-level scope (exceeds a pure-visual ticket).

**PM ruling (2026-04-22):** Register as low-priority tech debt; close this ticket without fixing. Reasoning:
- Reviewer Step 1 (breadth) 0 Critical / 0 Important; Step 2 (depth) 0 Critical / 0 Warning; W-1 is Info-class future-proofing, not active bug
- QA sign-off PASS, full suite 197 pass / 1 skip / 0 fail
- Fix is clear (add `data-testid="ticket-anatomy-outcome-label"` + `data-testid="ticket-anatomy-learning-label"` two testids + spec getByTestId replacement); cost ~10 minutes
- Currently the label is a component literal; any future schema-dynamicization change must land in TicketAnatomyCard's own ticket (trigger condition is explicit; no silent drift)

**Recommended approach:**
1. Add `data-testid="ticket-anatomy-outcome-label"` / `data-testid="ticket-anatomy-learning-label"` to the two existing label spans in `frontend/src/components/about/TicketAnatomyCard.tsx`
2. In `frontend/e2e/about-v2.spec.ts` L474 / L487 replace `locator('span', { hasText: 'Outcome' })` with `getByTestId('ticket-anatomy-outcome-label')` (Learning identical)
3. Run full Playwright suite to confirm 21 assertions remain green

**Scheduling trigger:** (a) Next ticket touching `TicketAnatomyCard.tsx`; (b) or any ticket converting TicketAnatomyCard Outcome / Learning to data-driven schema (this TD must be fixed first).

---

## TD-K034-08 — HomePage Footer container width cross-route visual inconsistency (byte-diff invisible)

**Source:** K-034 Phase 1 Reviewer Step 2 Warning #W3 (2026-04-23)

`frontend/src/pages/HomePage.tsx:13` root div `<div className="... sm:pl-[96px] sm:pr-[96px]">` wraps `<Footer />` inside 96px left/right padding; at viewport=1280 the effective width of `<footer>` on `/` is `1280 − 192 = 1088px`; whereas `/about` (`AboutPage.tsx:71`) and `/business-logic` (`BusinessLogicPage.tsx`) render `<Footer />` as a root-level sibling at full width (effective 1280px).

**Reviewer evidence:** three baseline PNGs at `frontend/e2e/shared-components.spec.ts-snapshots/`:
- `footer-home-chromium-darwin.png` → 1088 × 87 px
- `footer-about-chromium-darwin.png` → 1280 × 87 px
- `footer-business-logic-chromium-darwin.png` → 1280 × 86 px

**Why K-034 Phase 1 does not fix:**
- AC-034-P1-ROUTE-DOM-PARITY asserts `<footer>` outerHTML byte-identical — satisfied (the `<footer>` element itself is fully identical across the three routes, only ancestor structure differs)
- T1 byte-identity gate reads `<footer>`.outerHTML; cannot see render-width differences caused by ancestor padding — out-of-scope class of divergence
- Fix requires modifying HomePage root div structure (lifting `<Footer />` out of the padded wrapper to a root sibling), affecting other HomePage section left/right padding semantics — exceeds K-034 Phase 1 "variant prop retirement" scope
- Already filed under `docs/designs/design-exemptions.md` §2 INHERITED category (pre-existing since K-017 / K-021; visual cross-route divergence temporarily declared acceptable)

**Risk:** Medium — `/`'s Footer is visually 192px narrower than `/about` / `/business-logic`; portfolio outward-facing cross-page inconsistency; if K-036 UI polish Item 3 (HomePage desktop padding adjustment) does not also handle the Footer wrapper structure, the divergence may worsen or solidify.

**Recommended approach:**
1. In `frontend/src/pages/HomePage.tsx`, decompose the root div: padded wrapper wraps only the sections that need the inset (HeroSection / FeaturesSection etc.); move `<Footer />` out as a sibling of the root fragment
2. Run `shared-components.spec.ts` PNG snapshot — at this point `/` PNG should become 1280px, requires `--update-snapshots` to rebuild baseline (review diff to confirm only width changed)
3. Confirm other HomePage section left/right padding semantics did not break (add `px-6 md:px-[96px]` to the section itself if needed to retain existing inset)
4. Sync-delete the "HomePage.tsx Footer render context" row in `docs/designs/design-exemptions.md` §2 (structure has been corrected)

**Scheduling trigger:**
- (a) Recommended: fold into K-036 UI polish Item 3 (HomePage desktop padding adjustment) implementation
- (b) Or any ticket touching HomePage root-level structure (must evaluate co-fix beforehand)
- (c) Standalone ticket K-037+ (if K-036 decides to only touch Hero/features padding without Footer wrapper)

**PM ruling (2026-04-23):** Register as medium-priority tech debt; K-034 Phase 1 closes without fix. Reasoning: pre-existing since K-017; byte-identity AC satisfied; already filed in design-exemptions §2 INHERITED; K-036 natural trigger point is clear.

---

## TD-K034-P2-15 — Footer per-route snapshot tolerance audit

**Source:** K-034 Phase 2 §4.8 C-2 PM ruling (2026-04-23)

During Phase 2 implementation, `shared-components.spec.ts:129` Footer snapshot tolerance was set to `{ maxDiffPixelRatio: 0.02 }` (per BQ-034-P2-ENG-01); measured `/about` drifted to 3% actual pixel difference, crossing the 2% threshold — applied §4.8 C-2 Option (b) ruling to regen baseline. The T1 byte-identity outerHTML stayed green throughout (content unchanged); the 3% drift is purely Playwright Chromium font antialiasing / subpixel / GPU-state drift, not content change.

**Current state:**
- `shared-components.spec.ts` three routes share 2% tolerance (`/`, `/about`, `/business-logic`)
- `/about` baseline regen 2026-04-23, threshold not relaxed

**Recommended approach:**
1. Before the next Footer edit cycle, evaluate per-route baselines (`/` `/about` `/business-logic` each with own PNG baseline); tighten tolerance to 0.5%
2. Investigate Playwright Chromium `--font-rendering` flag stability
3. If the Footer snapshot regens for a third time without content change, escalate to a K-XXX ticket

**Scheduling trigger:**
- (a) Priority: next ticket touching `frontend/src/components/shared/Footer.tsx`
- (b) Footer baseline regen for the third time without content change — escalate to ticket
- (c) Cross-route Footer visual divergence (TD-K034-08) fix ticket — handle together

**Priority:** Medium

---

## TD-K034-P2-16 — S4 h2 "How AI Stays Reliable" computed-style E2E

**Source:** K-034 Phase 2 §4.8 I-4 PM ruling (2026-04-23)

Phase 2 Reviewer pointed out that `/about` S4 h2 "How AI Stays Reliable" currently only asserts text-content (`about-v2.spec.ts`); no `getComputedStyle` check on fontSize / fontFamily — no structural assertion. h1 Hero has full Bodoni Moda + 64px assertions; h2 only text-only — asymmetric coverage.

**Pencil spec:** `frontend/design/specs/about-v2.frame-UXy2o.json` s4Intro — Bodoni Moda italic 700 30px.

**Current state:**
- `about-v2.spec.ts` for h2 "How AI Stays Reliable" only has `toContainText` assertion
- If Pencil UXy2o.s4Intro changes fontSize from 30px to 28px or swaps font family, E2E will not catch it

**Recommended approach:**
1. In `about-v2.spec.ts` add a new `test('S4 h2 computed style: Bodoni Moda 30px', ...)` above AC-022-LAYER-LABEL
2. `getComputedStyle(el).fontSize` === `'30px'`
3. `getComputedStyle(el).fontFamily` contains `'Bodoni Moda'`

**Scheduling trigger:**
- (a) When Pencil UXy2o.s4Intro typography changes
- (b) When visual review flags "h2 looks off"
- (c) K-036 UI polish or the next /about typography ticket — handle together

**Priority:** Low (text assertion already catches copy drift; only typography asymmetry lacks awareness)

---

## TD-K034-P2-17 — K-029 `ticket-anatomy-id-badge` test-target retro cross-note

**Source:** K-034 Phase 2 §4.8 M-1 PM ruling (2026-04-23)

K-029 spec `about-v2.spec.ts:430-438` asserts `ticket-anatomy-id-badge` strict `rgb(42, 37, 32)` charcoal color. After K-034 Phase 2 introduces the FileNoBar primitive, the original single-DOM-node K-00N badge becomes a dual render:
- visible FileNoBar `trailing` slot (K-00N, paper on charcoal, Pencil EBC1e original color)
- sr-only `<span data-testid="ticket-anatomy-id-badge" className="sr-only text-charcoal">` keeps K-029 assertion passing

**Current state:**
- Test passes; target semantics shifted from "visible badge color" to "sr-only badge color"
- Badge still renders to sighted users via FileNoBar trailing slot (paper color)
- K-029 strict charcoal assertion passes via sr-only dual render; no spec downgrade

**Required retro cross-note:**
1. K-029 retrospective or ticket should add 1 line: "target semantics shifted to FileNoBar trailing slot post-K-034 Phase 2; assertion still valid via sr-only DOM lookup"
2. Inline comment in the test itself (already added near `about-v2.spec.ts:425`, `// ticket-anatomy-id-badge target shifted to FileNoBar trailing slot post-K-034 Phase 2; assertion still valid via DOM lookup`)

**Recommended approach:**
1. Updating the assertion to the truly-visible badge (currently paper on charcoal) requires rewriting the K-029 AC (product decision, not technical) — PM and user must discuss whether needed
2. If the current state is preserved, this TD exists as a historical trace.

**Scheduling trigger:**
- (a) K-029 AC rewrite — if product decision determines the visible badge needs a specific color assertion
- (b) Next ticket touching TicketAnatomyCard schema or FileNoBar trailing slot

**Priority:** Low (test passes; pure audit trail / future-reader context)

---

## Update Rules

- Adding new tech debt: Code Reviewer first compiles the list → PM rules item by item → write into this file
- Promoting tech debt to ticket: open a K-XXX ticket simultaneously, mark `→ K-XXX` in this table, then archive in the "promoted to ticket" section
