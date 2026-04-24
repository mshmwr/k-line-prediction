# QA Retrospective Log — K-Line Prediction

跨 ticket 累積式反省記錄。每次任務結束前由 qa agent append 一筆，最新在上。

## 寫入格式

```
## YYYY-MM-DD — <Ticket ID 或 Phase 名稱>

**做得好：**（具體事件；無則省略本行，勿捏造）
**沒做好：**（哪些回歸測試設計不足 / 邊界沒覆蓋到）
**下次改善：**（具體可執行的行動）
```

- 倒序（最新在上）

## 2026-04-24 — K-045 Early Consultation (desktop layout consistency /about vs / vs /diary)

**做得好：**
- 針對 PM 初稿 §4 seed 邊界（640px、1248 hero、SectionLabelRow 位置、FileNoBar、grid flip）逐條展開成 10 個具體 Challenge；每個 Challenge 附建議 AC 草稿 + 驗證路徑 + Sacred cross-check 結果。
- 主動抓出兩個 scope gap：(a) C-2 section-to-section vertical gap 不在 §2 scope（SectionContainer `py-16` 會貢獻 inter-section rhythm，只改 width 不改 py 會視覺仍不一致），(b) C-6 K-031 adjacency Sacred（`about-architecture-sibling.spec.ts` 硬斷 `#architecture.nextElementSibling === <footer>`）會被 body-wrapper pattern 破壞。兩者若到 Engineer 階段才發現會退回 Architect。
- 發現 C-3 BQ-045-03：Pencil wwa0m 無 maxWidth constraint，K-022 legacy narrow=768 無 Sacred 鎖，建議依 Pencil SSOT 選 1248 — 把需要 PM ruling 的設計決策明確標出。

**沒做好：**
- Challenge 編號使用 C-N 而非 QA-045-CN，與 PM AC ID 前綴不一致（AC-045-XXX）；混用可能造成 Engineer 引用混淆。
- C-9/C-10 標 N/A 後仍留在列表，沒有直接刪除 — PM 讀時需多 parse 兩條才知道不需 ruling。

**下次改善：**
- Challenge ID 統一前綴 `QA-<ticket>-CN` 格式；N/A 條目合併成一行單獨段落列出（「Out-of-concern items: C-9, C-10」）避免 PM 誤判需 ruling。

- 與單票 `docs/tickets/K-XXX.md` 的 `## Retrospective` 段落 QA 反省並存，不互相取代
- 啟用日：2026-04-18（K-008 起）

---

<!-- 新條目從此處往上 append -->
## 2026-04-24 — K-045 QA Early Consultation (real QA spawn, pre-Architect)

**Tier:** runtime code (frontend Tailwind class refactor on /about) — `feedback_qa_early_proxy_tier.md` enforces real QA spawn. Invoked before Architect release per ticket §5 BLOCK gate; pm proxy explicitly NOT authorized.

**What went well:** Caught 3 Challenges not in PM's seed list — C-2 SectionContainer `py-16`/`py-12` vs Pencil `gap:72` structural mismatch (not a pure container-width migration — section-to-section vertical rhythm also needs reworking); C-3 Pencil `wwa0m` (S1 Hero) carries no per-line max-width constraint so migrating hero to full 1248 is actually Pencil-compliant (flips BQ-045-02 narrow-variant assumption); C-6 `about.spec.ts` Footer DOM-order assertion `#architecture.nextElementSibling === footer` requires Footer to remain full-bleed sibling of root `<div className="min-h-screen">` — any refactor that wraps sections in a new `max-w-[1248px]` outer wrapper MUST NOT swallow Footer or nextElementSibling breaks. 4 spec files grep'd byte-by-byte before writing each Challenge.

**What went wrong:** Could not execute mandatory task step 0c (frame spec JSON + Playwright screenshot parity gate) because this is a pre-Architect consultation, not post-implementation sign-off — the flow has no running dev server to screenshot. Early Consultation persona does not currently define which QA mandatory steps are suspended at this stage. Discovered mid-task.

**Next time improvement:** Edit `~/.claude/agents/qa.md` §Early Consultation to add explicit "suspended steps for pre-implementation mode": steps 0c (Pencil screenshot parity), 1 (visual-report.ts run), 2/2a (filename verify), 3 (PM notify of visual report) do NOT apply to Early Consultation; only apply to post-Code-Review sign-off. Step 0a (visual-spec.json read) + 0b (Pencil spec JSON read) DO apply to Early Consultation for any Pencil-backed ticket — K-045 has Pencil frames 35VCj / 4CsvQ / wiDSi as dependencies, all three were read verbatim before challenges were filed. Codify the tier-specific step applicability so future Early Consultations don't rediscover this case-by-case.

## 2026-04-24 — K-041 Phase 4 Full E2E Regression (QA sign-off)

**What went well:** Full suite (255 tests) ran once, 253 passed + 1 pre-existing flake + 1 skipped — Sacred K-023/K-028 Homepage marker tests (pages.spec.ts AC-023-DIARY-BULLET borderRadius 0px, AC-028-MARKER-COORD-INTEGRITY width=20 height=14) all green, confirming DiaryMarker prop unification preserved Homepage contract. Flipped T-C6 /diary mobile rail/marker display assertions now pass.

**What went wrong:** Ran `npx playwright test --reporter=line` without TICKET_ID, producing K-UNKNOWN-visual-report.html pollution (persona step 1 pre-warning bypassed, TD-K030-03 Round-N recurrence). Post-step 2a verification caught it; deleted pollution + re-ran with TICKET_ID=K-041. Root cause: full-suite command fires visual-report.ts as part of `[visual-report]` project and the persona step-1 pre-warn only binds when visual-report is invoked standalone.

**Next time improvement:** Before any `npx playwright test` command without test-file filter (i.e. full-suite run), prepend `TICKET_ID=K-XXX` env var — full-suite config contains visual-report project, so TICKET_ID is mandatory for BOTH standalone visual-report.ts runs AND full-suite runs. Codify into qa.md persona step 1: expand from "visual-report.ts standalone" to "any command that resolves the [visual-report] project, including full-suite".

## 2026-04-24 — K-041 QA Early Consultation (PM proxy tier — @qa-proxy)

**Role:** PM proxy (not spawned QA agent). Invoked under user-approved `b + 不 deploy + 開工` directive (2026-04-24). Tier rationale: narrow scope (4 source files + 1 spec flip), Sacred invariants pre-locked in ticket table, no new runtime/schema introduced — layout class present but restoration-only (Homepage behavior already in production). FAIL-ONCE rule: any adversarial question below surfacing uncodified behavior or missing assertion forces escalation to real QA spawn.

**Adversarial questions (5):**

**Q1 — Sacred regression: marker borderRadius**
After `DiaryMarker` accepts `borderRadius?: number` prop defaulting to `MARKER.cornerRadius = 6`, will Homepage still render `borderRadius: 0`?
**Answer:** Only if `DevDiarySection` explicitly passes `borderRadius={0}`. Guardrail = existing `pages.spec.ts` Homepage Sacred assertion `toHaveCSS('border-radius', '0px')` (K-023 AC-023-DIARY-BULLET / K-028 AC-028-MARKER-COORD-INTEGRITY). Regression is caught automatically by Phase 4 full regression. **PASS** (no escalation).

**Q2 — Sacred regression: marker topInset**
After `DiaryMarker` accepts `topInset?: number` prop defaulting to `MARKER.topInset = 10`, will Homepage still render `top: 8px`?
**Answer:** Only if `DevDiarySection` explicitly passes `topInset={HOMEPAGE_MARKER_TOP_INSET}` (currently `= 8`). Guardrail = existing Homepage coord assertion (K-028 AC-028-MARKER-COORD-INTEGRITY). **PASS**.

**Q3 — Rail conditional render boundary (1-entry case)**
Homepage renders rail only when `entries.length >= 2` (design §4.3.1). /diary renders unconditionally. Shared `<DiaryRail />` must not force rail at 1-entry on Homepage.
**Answer:** Consumer decides render — Homepage keeps `{entries.length >= 2 && <DiaryRail mobileVisible />}` guard. Sacred guardrail = `diary-homepage.spec.ts` T-H2 (0-entry hides rail) + T-H3 (1-entry hides rail). **PASS** — but Engineer MUST NOT lift conditional into DiaryRail; keep at consumer.

**Q4 — Mobile padding overflow at narrowest viewport**
`/diary` entry mobile `paddingLeft: 92px` on 390px viewport leaves 298px content width. Does text overflow horizontally?
**Answer:** Existing T-C5 asserts no-overflow at 390px with current desktop `pl-[92px]`. After K-041 mobile also = 92px → `no-overflow` must hold at 390px. Homepage already uses same 92px padding at all viewports with no overflow. **PASS** — Engineer runs T-C5 as part of Phase 2 gate; regression if `scrollWidth > innerWidth`.

**Q5 — Cross-spec hidden dependencies on OLD mobile-hidden behavior**
Besides T-C6 (`diary-page.spec.ts:572`), any other spec asserting `/diary` mobile rail/marker `display: none`?
**Answer:** Grep of `frontend/e2e/*.spec.ts` for rail/marker mobile assertions found: only T-C6 asserts `display: none` explicitly. T-H2/T-H3/T-H4 in `diary-homepage.spec.ts` are entry-count boundaries (0/1/2 entries), not viewport-dependent. T-T4 in `diary-page.spec.ts` is backgroundColor/dimensions, not display. **PASS** — only T-C6 needs flip.

**Verdict:** ALL-5-PASS → PM proxy tier approved. Engineer released for Phase 2. No real QA spawn required pre-implementation.

**Phase 4 mandatory full regression (unchanged):** post-implementation full Playwright suite + tsc must pass before PM close.

## 2026-04-24 — K-039 Phase 1 (QA sign-off)

**What went well:** Pre-existing guards on role cards (`AC-017-ROLES` 6×3, `AC-022-ROLE-GRID-HEIGHT` desktop + 3 mobile breakpoints, `AC-034-P2-FILENOBAR-VARIANTS` FILE Nº 01..06 exact, `AC-034-P2-DRIFT-D26-SUBTITLE-VERBATIM` S3 subtitle) all turned green on the refactored `RoleCardsSection` + new `roles.ts` module — single-source data extraction did not drift any visual or text assertion. The new `roles-doc-sync.spec.ts` (4/4 PASS) locks the TSX-canonical text against README + docs/ai-collab-protocols.md via explicit marker blocks, establishing a regression gate that would FAIL on any future drift without needing human diff review.

**What went wrong:** No QA-observable defect. Process-level note: the 1 pre-existing red in the full suite (`AC-020-BEACON-SPA` in `ga-spa-pageview.spec.ts`, K-032 production gap) flows through every sign-off run and risks becoming invisible baseline noise — when a new failure surfaces under similar framing, the "known red" heuristic could cause a real regression to be waved through. The categorisation is correct for K-039 (beacon file unchanged, same failure pattern, zero overlap with role-card scope) but the baseline-as-noise pattern needs an explicit quarantine mechanism.

**Next time improvement:** Enforce a "known-red manifest" in QA sign-off flow: before declaring any full-suite run matches baseline, compare the failing test IDs byte-equal against `docs/qa/known-reds.md` (to be created). Any new red ID = hard BLOCK even if count matches; any baseline red disappearing = verify with targeted rerun before claiming improvement. Codify as QA persona §Mandatory Task Completion Steps hard step (add between current steps 3 and 4).

## 2026-04-23 — K-039 — QA Early Consultation (Split SSOT + README sync generator)

**Disclosure (capability pre-flight, pm.md §PM session capability pre-flight):** This session has no `Agent` tool available. PM acted as main-session QA proxy; consultation was conducted by Reading `~/.claude/agents/qa.md` persona + codebase + specs + plan doc. Risk: blind spots a full QA agent with interactive boundary sweep might catch could be missed. Mitigation: (a) explicit disclosure here; (b) PM will re-invoke full QA agent for sign-off in a later turn if Agent tool becomes available; (c) QA Challenges below derived directly from `qa.md` §Boundary Condition Mandatory Sweep table applied to K-039 Phase 1/2/3 ACs + K-Line E2E spec inventory.

**Pre-consultation evidence probe (2026-04-23):**
- Worktree HEAD: 2e4ac97 (clean, pre-K-022/K-034 Phase 2 shape). TSX `ROLES` has `redactArtefact` field + no `fileNo`; section subtitle is paraphrased (not Pencil-verbatim).
- Drift audit confirmed: README 6/6 responsibilities paraphrased + 3/6 artefact drift; `docs/ai-collab-protocols.md` 0/6 owns drift + 3/6 artefact drift; TSX ↔ Pencil `specs/about-v2.frame-8mqwX.json` byte-aligned on `owns`/`artefact` only (subtitle is the known HEAD divergence).
- Existing E2E coverage: `frontend/e2e/about.spec.ts` asserts /about role card text via `getByText` (6 `owns` + 6 `artefact` entries, case-sensitive exact). `shared-components.spec.ts` exists for cross-route shared chrome (NavBar, Footer) — no role-card cross-surface equivalence spec yet.
- No existing `scripts/` folder has a sync generator; only `scripts/audit-ticket.sh` lives there. Pre-commit hook ecosystem: repo has no `.husky/` or `lefthook.yml`; `.git/hooks/pre-commit` is absent. Engineer must pick pattern in Phase 2 (see Challenge #5).

---

### QA Challenge #1 — AC-039-P1-README-SYNCED — column-header rename is unstated

**Issue:** AC says README markers-delimited table must have columns `Role / Owns / Artefact` (no Responsibilities/Verifiable Output rename). But README HEAD currently uses columns `Role / Responsibilities / Verifiable Output`. The AC mandates a column-header **rename** — this is a narrative change to the README that goes beyond "drift repair", and it's not called out as a Goal in §2. A reader passing by the AC might think the AC asks only for table data to be updated and leave the old column headers in place, producing a synced-but-wrongly-labeled table.

**Risk:** Phase 1 ships README with columns `Role / Responsibilities / Verifiable Output` but data in the Owns/Artefact sense — semantic mismatch in a public-facing portfolio doc. Generator (Phase 2) would then have two options: (a) also rename the column headers on every run (silent cosmetic churn), or (b) preserve existing column-header text and only rewrite data rows — harder regex + risk of inconsistent output across the two files.

**Option A (fix):** Add explicit AC clause: "AC-039-P1-README-SYNCED `And` — README column headers after Phase 1 must read exactly `| Role | Owns | Artefact |` (not `Responsibilities` / `Verifiable Output`); this is a narrative change to README beyond drift repair."

**Option B (Known Gap):** Keep README columns `Responsibilities / Verifiable Output`; generator maps TSX `owns` → Responsibilities and `artefact` → Verifiable Output. Accepted risk: two names for the same concept across files, generator carries a rename map, cognitive overhead for future readers.

**Recommendation:** **Option A.** Plan §"README sync" explicitly says "Rewrites the 6-row table" — the simplest mental model is TSX-shape mirror. Rename map is accidental complexity.

**If not ruled:** AC-039-P1-README-SYNCED will be ambiguous at sign-off; Engineer may ship either variant and QA cannot declare PASS/FAIL deterministically.

---

### QA Challenge #2 — AC-039-P1-PLAYWRIGHT-REGRESSION — TSX import path from Playwright spec is non-trivial

**Issue:** AC says `roles-doc-sync.spec.ts` must "deep-equal `ROLES` imported from `frontend/src/components/about/RoleCardsSection.tsx`". Playwright E2E specs run under Playwright's own tsconfig (`frontend/playwright.config.ts` + `frontend/e2e/tsconfig.json` if exists). Importing from `frontend/src/` into `frontend/e2e/` works in this repo (verified — `about.spec.ts` uses relative paths into `src/` for some specs), but (a) `ROLES` is currently declared inside the component file without `export`, (b) importing a React component module into Node Playwright causes the React import chain to resolve and can trip on CSS/Tailwind/image loaders.

**Risk:** Engineer writes spec assuming clean import of `ROLES`, then hits a Vite/Playwright module-resolution failure, then adds a dual-source-of-truth shim (copies `ROLES` into a `.json` or `.ts` constant in spec folder) — **recreating the drift K-039 was meant to prevent**.

**Option A (fix):** Refactor TSX to extract `ROLES` into a pure-data module: `frontend/src/components/about/roles.ts` (no React imports; exports `ROLES`). `RoleCardsSection.tsx` imports from there. Playwright spec imports directly from `roles.ts` (clean no-React module). This is a 5-line code change in Phase 1 — low cost, eliminates Challenge class.

**Option B (Known Gap):** Playwright spec parses the marker-delimited tables in README + protocols.md and compares the two tables to each other (not to TSX). Covers "doc-vs-doc drift" but not "TSX-vs-doc drift" — if Engineer edits TSX and forgets to run generator, doc tables might still match each other from a previous sync.

**Option C:** Playwright spec shells out to `node scripts/sync-role-docs.mjs --dry-run --json` which outputs the parsed ROLES as JSON, spec asserts parsed README table matches that JSON. Script is the SSOT adapter between TSX parse and Playwright assertion.

**Recommendation:** **Option A.** Cleanest architecture; `roles.ts` data module is a natural split (data vs rendering) and makes generator regex trivially robust. Option C is clever but adds a runtime dependency from Playwright → script — fragile.

**If not ruled:** AC-039-P1-PLAYWRIGHT-REGRESSION untestable without a chosen import path; Engineer may pick Option B silently and ship weaker coverage.

---

### QA Challenge #3 — Boundary: TSX `ROLES` array with < 6 or > 6 entries

**Issue:** AC-039-P1-TSX-CANON mandates 6 roles (PM/Architect/Engineer/Reviewer/QA/Designer). If someone adds a 7th role (e.g. "Documentarian") to TSX, what does the generator do? What does the Playwright spec assert? No AC covers "role count changes". Empty `ROLES = []` is a degenerate case — generator should not crash, but neither spec nor AC specifies behavior.

**Risk:** 7-role addition ships: generator silently writes a 7-row table; README visual section breaks (Mermaid diagram still shows 6 flowchart nodes); Playwright spec FAILs with unclear error; Engineer can't tell whether the change is rejected or the test is stale.

**Option A (fix):** Add `AC-039-P1-ROLES-COUNT-INVARIANT` — generator + spec both assert `ROLES.length === 6`; changes to count require a separate ticket that also updates Mermaid diagram + Pencil 8mqwX frame + AC table. Count invariant is codified.

**Option B (Known Gap):** Accept "adding a role is out of scope for K-039; any attempt will fail Playwright which is acceptable signal". TD registered for future role-count-change ticket.

**Recommendation:** **Option A.** Role count is visually + architecturally significant (Pencil has 6 sub-frames, Mermaid has 6 flowchart nodes, section label "Nº 02 — THE ROLES" implies fixed count). Making it an invariant at Phase 1 gives the generator a clean precondition.

**If not ruled:** boundary sweep row "Empty list / single / large (0 / 1 / 1000 items)" is unfilled — QA boundary table incomplete, sign-off blocked per `qa.md` §Boundary Condition Mandatory Sweep.

---

### QA Challenge #4 — Boundary: role-specific characters (CJK, pipe, asterisk) break Markdown table rendering

**Issue:** Current TSX `ROLES[3].artefact = "Review report + Reviewer 反省"` contains CJK characters. Markdown handles CJK fine, but if a future `owns` or `artefact` contains `|` (table-column delimiter), `*` (emphasis), backticks (inline code), or a newline, the generator must escape or reject. Plan §Format constraints says `owns ≤6 words, comma-separated` — but doesn't forbid special chars.

**Risk:** PM approves a phrase like `"code review | breadth + depth"` (pipe-separated); generator naïvely emits `| Reviewer | code review | breadth + depth | ... |` — 6-column row, breaks table rendering. README portfolio surface gets visual regression.

**Option A (fix):** AC-039-P1-TSX-CANON gains an `And` clause: TSX string values must not contain `|`, unescaped newlines, or unbalanced backticks. Generator rejects (non-zero exit) if detected, prints offending field. Playwright spec adds `expect(roles.every(r => !/\||
/.test(r.owns + r.artefact))).toBe(true)`.

**Option B (Known Gap):** Accept — "PM will review phrases, won't approve special chars". No enforcement.

**Recommendation:** **Option A.** Format enforcement at parse time is cheap (1-line regex) and prevents the class of bug. Per `feedback_sanitize_by_sink_not_source.md` — source is TSX string, sink is Markdown table cell; sanitize at sink boundary.

**If not ruled:** boundary sweep row "Special chars / overlong input" unfilled; QA sign-off blocked.

---

### QA Challenge #5 — AC-039-P2-PRE-COMMIT — hook ecosystem not declared

**Issue:** AC-039-P2-PRE-COMMIT says "new file under `.husky/`, `.git/hooks/`, or lefthook config — Engineer picks the project's existing pattern". But repo has NONE of these at HEAD (verified `ls -la .husky/ .git/hooks/pre-commit lefthook.yml` all absent/example-only). Leaving the choice to Engineer at implementation time means PM's Phase Gate can't verify the pattern a priori, and Engineer may choose the least robust option (e.g. raw `.git/hooks/pre-commit` — not version-controlled, doesn't install on fresh clone).

**Risk:** Engineer picks `.git/hooks/pre-commit` (single-file). Ships. New contributor clones repo, edits TSX, commits — no hook runs, doc drift re-emerges. K-039's core deliverable (close the drift gap forever) silently fails.

**Option A (fix):** PM rules at Phase 2 release: Engineer must use `husky` (de facto standard, version-controlled via `package.json` + `.husky/`). If Engineer rejects husky for size reasons, Engineer files a BQ with alternative (`simple-git-hooks`, `lefthook`) — PM approves before implementation.

**Option B (Known Gap):** Hook is `.git/hooks/pre-commit` only; doc drift re-emerges on fresh clone is accepted as TD; README adds "run `npm run setup-hooks` after clone" step. Enforced by Engineer-authored setup script.

**Recommendation:** **Option A.** `husky` is ~50 KB, standard in React ecosystem, version-controlled. Option B forces every contributor to remember a manual setup step — failure mode is silent.

**If not ruled:** hook mechanism choice deferred to Engineer = Engineer could ship a non-portable hook = fresh-clone drift re-emerges.

---

### QA Challenge #6 — AC-039-P2-PRE-COMMIT — performance / interactive behavior unspecified

**Issue:** Pre-commit hook runs generator + `git status` comparison on every commit that stages `RoleCardsSection.tsx`. But the hook mechanism of Option A (husky) typically runs in sub-shell and can auto-stage regenerated files OR fail with "re-run git add && git commit". AC doesn't say which. User experience of "commit, hook rewrites files, re-stage, re-commit" vs "commit auto-succeeds with regenerated staged files" is materially different.

**Risk:** Engineer picks auto-stage behavior; hook silently modifies user's WIP commit (surprising side-effect on "commit pre-flight (mandatory)" rule in `~/.claude/CLAUDE.md`). Or Engineer picks fail+message behavior; first-time user hits confusing "generator modified files, run again" loop.

**Option A (fix):** AC-039-P2-PRE-COMMIT `And` clause: hook must FAIL (non-zero exit + clear message "Run `npm run sync-role-docs` and stage the docs") rather than auto-stage. Rationale: `~/.claude/CLAUDE.md §Commit Hygiene` mandates explicit staged file list pre-flight; auto-staging violates that rule by modifying the staged set after `git diff --cached`.

**Option B (Known Gap):** Auto-stage accepted; commit pre-flight rule is silently relaxed for this one hook.

**Recommendation:** **Option A.** Keeps `git diff --cached` as the canonical pre-commit staged state.

**If not ruled:** Engineer picks either, user surprise on first hit, retrospective entry.

---

### QA Challenge #7 — AC-039-P3-SACRED-SPLIT — retirement scope granularity

**Issue:** AC says "retire `content` portion of K-034 AC-034-P2-DRIFT-D5/D6/D7/D8/D26". But reading D-5 / D-6 / D-7 / D-8 / D-26 verbatim: D-5 mandates Reviewer `redactArtefact: false` AND "ARTEFACT text `"Review report + Reviewer 反省"` renders as plain" (content portion) AND "no RedactionBar, no sr-only" (visual portion). D-6 mandates role name font-size = 36/32 based on `role.length <= 2` (computed from content — blend of content + visual). D-26 mandates section subtitle verbatim from Pencil `s3Intro` (pure content).

Scope of "content portion" is not 100% clean across these 5 ACs. Blanket retirement risks retiring a D-6 clause that actually depends on content-length even when content itself is TSX-SSOT.

**Risk:** K-034 reviewer reading retirement annotation interprets "content portion retired" as "entire D-6 retired" → drops role-length-based font-size logic → PM/QA gate re-triggers at next Sacred cross-check.

**Option A (fix):** AC-039-P3-SACRED-SPLIT specifies per-D-ID exactly what's retired:
- D-5: "Reviewer ARTEFACT content string" retired (TSX owns); redaction absence (`redactArtefact: false`) and typography tokens remain Pencil-SSOT.
- D-6: NOT retired — role-length-based font-size is a visual rule computed from content length, not from content value; stays Pencil-SSOT.
- D-7: NOT retired — `FILE Nº 0N · PERSONNEL` label is Pencil-SSOT (content-of-label is static, not runtime); `N` comes from `ROLES` order which is fine.
- D-8: "owns text content + artefact text content" retired (TSX); typography tokens remain.
- D-26: "section subtitle content string" retired (TSX); italic + font-family + size tokens remain.

**Option B (Known Gap):** Accept blanket "content portion" framing; annotate K-034 once, trust future readers to re-interpret case-by-case. TD registered for per-AC clarification.

**Recommendation:** **Option A.** Sacred retirement is a rare event; per-AC explicit scope prevents future confusion and matches `feedback_pm_ac_sacred_cross_check.md` rigor.

**If not ruled:** AC-039-P3-SACRED-SPLIT annotation in K-034 will be ambiguous; future ticket reading D-6 + retirement note may misinterpret.

---

### QA Challenge #8 — Protocols.md table may contain links or nested markdown not in TSX

**Issue:** `docs/ai-collab-protocols.md` is a reference-type wiki article (`type: reference`). The table at L20-27 today is plain text, but the surrounding article uses inline markdown links (`[artefact-audit]`, cross-file links). A future editor might add a link to an artefact path in a table cell (e.g. `[PRD.md](../PRD.md)`). If generator overwrites with plain TSX strings, links are lost.

**Risk:** Protocols doc regresses from link-enhanced to plain-text on first generator run. User notices, files a Bug Found Protocol. Gap: AC-039-P1-PROTOCOLS-SYNCED says "table matches TSX verbatim" — intentionally destructive to any in-cell markdown enrichment.

**Option A (fix):** Accept destructive behavior as design intent; add `And` clause "any pre-existing in-cell markdown (links, bold, inline code) is stripped on generator run; enrich at TSX level if needed (via dedicated `artefactLink` field in `ROLES`, out of scope K-039, register TD K-040 candidate)".

**Option B:** Generator preserves in-cell markdown by diffing only text nodes — more complex regex, harder to prove idempotent.

**Recommendation:** **Option A.** K-039 establishes the pattern; enrichment is YAGNI per plan's own scope exclusion.

**If not ruled:** generator behavior on enriched cells undefined, first invocation could silently remove links.

---

### QA Challenge #9 — `npm run sync-role-docs` package.json location

**Issue:** AC-039-P2-NPM-ENTRY says "Engineer decides at implementation, document choice" between repo-root and `frontend/package.json`. But project has both: repo root has no `package.json` (confirmed — repo root contains `Dockerfile`, `firebase.json`, no top-level `package.json`); `frontend/package.json` is the only existing one. Generator script lives in repo-root `scripts/` but npm entry would need to live in `frontend/package.json` — creating a cross-directory invocation: user must `cd frontend && npm run sync-role-docs`.

**Risk:** Pre-commit hook running from repo root (`.git/hooks/pre-commit` or `.husky/pre-commit`) can't simply `npm run sync-role-docs` — must either `cd frontend &&` or use node directly. Cross-directory commands are fragile (path resolution, CWD assumptions in script).

**Option A (fix):** Generator script uses absolute paths via `path.resolve(__dirname, '..')` to locate repo root files (README.md, docs/*, frontend/src/*). `frontend/package.json` script entry is `"sync-role-docs": "node ../scripts/sync-role-docs.mjs"`. Hook invokes `node scripts/sync-role-docs.mjs` from repo root directly (bypassing npm). Dual invocation paths both work.

**Option B:** Create repo-root `package.json` just for this one script. Adds another package boundary to project, pollutes root with npm ecosystem.

**Option C:** Move script invocation to a shell wrapper `scripts/sync-role-docs.sh` that does `node scripts/sync-role-docs.mjs`. Hook calls shell wrapper.

**Recommendation:** **Option A.** `frontend/package.json` for npm-run convenience; absolute paths in the script make it CWD-independent; hook bypasses npm for speed.

**If not ruled:** Engineer picks; implementation details could break pre-commit hook on cross-platform (macOS vs Linux CI) CWD differences.

---

### QA Challenge #10 — Dogfood test (AC-039-P2-DOGFOOD-FLIP) doesn't cover deploy

**Issue:** AC says "no Designer session / `batch_design` / `.pen` edit is required" for a text tweak. Good. But doesn't mention **deploy verification**: does a deployed /about page reflect the TSX text change? If generator runs in pre-commit but Playwright visual baseline is stale, sign-off could pass while production bundle still serves old text.

**Risk:** Dogfood "runs" but the K-034 Phase 2 `AC-034-P2-DRIFT-LIST` Pencil-verbatim assertions on role card text are still active (Phase 2 WIP on main will assert TSX `owns` equals Pencil `r*Owns.content`). K-039's split retires that for TSX side; K-034 Phase 2 E2E test post-merge may assert against stale PNG/JSON; dogfood doesn't catch it.

**Option A (fix):** AC-039-P2-DOGFOOD-FLIP `And` clause: after flip + commit + Playwright pass, `npm run build && grep "<new-phrase>" frontend/dist/**/*.js` returns ≥1 match; or — if dogfood is reverted — build from clean state. Dogfood must touch the deploy path, not just the source.

**Option B (Known Gap):** Deploy-level verification deferred to K-034 Phase 2 visual audit (which will cover /about build output). Dogfood is a source-only proof.

**Recommendation:** **Option A.** Build-time assertion is trivial (one grep) and proves end-to-end.

**If not ruled:** dogfood proves nothing about what ships to browser.

---

## Summary

| # | Challenge | Recommended | Sign-off blocker? |
|---|-----------|-------------|-------------------|
| 1 | README column header rename unstated | Option A (explicit rename) | Yes |
| 2 | Playwright-TSX import path | Option A (extract `roles.ts`) | Yes |
| 3 | Role count boundary | Option A (count=6 invariant) | Yes |
| 4 | Special chars in TSX strings | Option A (reject at parse) | Yes |
| 5 | Pre-commit hook ecosystem | Option A (husky) | Yes |
| 6 | Hook fail-vs-auto-stage | Option A (fail + message) | No (UX) |
| 7 | Sacred retirement granularity | Option A (per-D-ID explicit) | Yes |
| 8 | Markdown enrichment in cells | Option A (destructive, enrich at TSX) | No |
| 9 | package.json location | Option A (frontend/ + absolute paths) | No |
| 10 | Dogfood deploy coverage | Option A (+ build grep) | No |

**Sign-off blockers (PM must rule before Engineer release):** 1, 2, 3, 4, 5, 7.

**PM ruling status: PENDING — see K-039 ticket §5 Phase Plan for rulings, and §7 QA Early Consultation for pointer back here.**

## 2026-04-23 — K-040 BFP Fix Regression Sweep (commit a092598)

**What went well:** Targeted regression sweep (5 specs = 44 tests) all green on HEAD a092598 — sitewide-footer 5/5, navbar 22/22, sitewide-fonts 8/8, shared-components 8/8 (AC-034-P1 Footer byte-identity holds 4 routes), about+about-v2 71 passed 1 skipped. Dev server 200 on `/`, `/about`, `/diary`, `/business-logic`. K-040 commit scope (11 files under `frontend/src/components/about/` + 2 retro docs) is zero runtime behavior — aligned with Reviewer's 0 Critical / 0 Warning.

**What went wrong:** Engineer's handoff claim "1 pre-existing flake AC-020-BEACON-SPA" under-reported severity. Standalone `npx playwright test e2e/ga-spa-pageview.spec.ts` reproduces **9 failures** on both a092598 AND baseline 66d9573 — full `describe()` block collapses (SPA-NAV ×2, BEACON ×4, NEG ×3). Verified pre-existing via `git checkout 66d9573` baseline run = identical 9 failures, identical timeout pattern → NOT K-040 regression, but Engineer's single-flake framing masked the scale. Likely root cause: spec file expects isolated webServer (Playwright config) vs shared `npm run dev` port 5173 — beacon collector race with hot state. Belongs in separate tech-debt ticket, not K-040 close.

**Next time improvement:** QA regression sweep must re-run any spec Engineer flags as "flaky" standalone against both fix HEAD and `git show <base>:HEAD` baseline before accepting "pre-existing" designation. Single-test flake claims demand spec-file-level verification — a 1-test report for a 9-test collapse is a trust-erosion signal even when not a regression. Also: file `ga-spa-pageview.spec.ts` isolation-requirement drift as standalone TD for PM (spec unrunnable outside Playwright config webServer = operational bug distinct from K-040).

---

## 2026-04-23 — K-040 QA Early Consultation (sitewide typography)

**What went well:** Designer's 36-row per-site calibration table + AC-040-SITEWIDE-FONT-MONO 4× raw-count gates (font-display pre=13, Bodoni-inline pre=4, `'Bodoni Moda'` string pre=1, tailwind keys pre=2) already anticipated most sitewide-font-swap risks; QA additions were edge-case tightening (stale Bodoni/Newsreader spec assertions, no cross-viewport matrix, no unit test on `timelinePrimitives.ENTRY_TYPE`), not foundational gaps.

**What went wrong:** Ticket ACs targeted only *source-side* grep + 4 representative-page Playwright assertions; **`timelinePrimitives.ts:30` is NOT Konva** (as stated in both ticket §1 and AC `And` clause) — it's a shared token-literal consumed DOM-side by `DiaryEntryV2` (via `diary-page.spec.ts` T-E6, which asserts `font-family` against `titleFont.family = "Bodoni Moda"` loaded from `visual-spec.json`). That means changing the literal without also updating `docs/designs/K-024-visual-spec.json` will break `diary-page.spec.ts:419` with a Playwright FAIL — the AC grep gate alone doesn't catch this. `about-v2.spec.ts:66-83,124-130` still assert `Bodoni Moda` + `Newsreader italic` on /about h1 + subtitle — these will all FAIL post-implementation and must be rewritten by Engineer as part of AC-040-SITEWIDE-FONT-MONO, not treated as regression. `sitewide-fonts.spec.ts` AC-021-FONTS must be rewritten in full (current spec's whole premise inverts under K-040). None of these stale-assertion sites are enumerated in the ticket's raw-count gates.

**Next time improvement:** for any sitewide typography/palette change that retires a design token, QA Early Consultation must enumerate ALL existing E2E assertions that reference the retiring token (grep `Bodoni\|Newsreader\|italic\|font-display` across `frontend/e2e/*.spec.ts`) before release, and flag each as (a) must-rewrite, (b) must-delete, or (c) unaffected — raw-count grep on `frontend/src/` misses regression tests asserting the retired value. Also: shared token-literal files (`*Primitives.ts`, `*tokens.ts`) feeding both DOM and potential Canvas consumers must be audited for both surfaces; AC text calling such a file "Konva literal" when it's actually a DOM token creates false confidence in pixel-diff / source-grep gates.

---

## 2026-04-23 — K-040 Early Consultation (sitewide UI polish batch)

**Verdict:** PM-RULE-REQUIRED (6 Challenges + 2 Interceptions raised — PM must respond before Phase 1 Designer release)

**Session capability disclosure:** QA was not dispatched as Agent sub-process — main-session Agent tool unavailable this turn. PM simulated QA adversarial review inline using `~/.claude/agents/qa.md` §Early Consultation protocol + codebase context. Mitigation: all challenges filed with explicit AC citation + file:line evidence; re-dispatch to real QA agent will run at Phase 5 regression sign-off (capability-restored session). Per PM persona §PM session capability pre-flight.

### QA Challenge #1 — AC-040-HERO-FONT-MONO (Item 1)

**Issue:** "font voice matches BuiltByAIBanner" is visual-intent (good per `feedback_pm_ac_visual_intent.md`) but provides NO way for Playwright to assert. Need a testable downstream clause.
**Needs supplementation:** Add an And clause: "Playwright asserts `computed font-family` of `HeroSection h1` starts with `Geist Mono` (or equivalent monospace family name substring); raw-count sanity `font-display` in `HeroSection.tsx` pre=2, post=0 is present but is refactor-grep only, does not prove render-time font applied."
**If not supplemented:** AC will PASS on `font-display` grep === 0 but FAIL a designer who meant something specific; regression test can't differentiate "mono font applied" from "no font class at all".

### QA Challenge #2 — AC-040-DIARY-FOOTER-BOTTOM-GAP (Item 2)

**Issue:** AC reads "whitespace below GA disclosure line is visually tight (no large empty band)" — no numeric threshold, no way to prove regression at sign-off. Playwright cannot assert "tight".
**Needs supplementation:** Designer provides numeric target (e.g., `main pb-12` = 48px) calibrated in .pen + recorded in `homepage-v2.frame-*.json` spec; AC adds: "measured bottom gap (CTA bottom edge → Footer top edge, or Footer bottom edge → viewport bottom on short pages) matches Designer JSON spec value ±2px."
**If not supplemented:** silent drift at sign-off; "looks tight to me" is not a test oracle.

### QA Challenge #3 — AC-040-HOME-DESKTOP-PADDING (Item 3)

**Issue:** "Rhythm matches `/diary` and `/about`" is not quantified. Currently `/diary` is `sm:px-24` (96px) within `max-w-[1248px]`. `/about` uses SectionContainer (varying per width prop). `/` is `sm:pr-[96px] sm:pl-[96px]` currently. Target is unclear — IS it already 96px like diary, and user wants it REDUCED to something else, or was user observing an illusion because HomePage has no max-width cap?
**Needs supplementation:** Designer explicit numeric target in .pen (e.g., "desktop 72px left+right, max-width 1248px") + PM documents which reference page is the true anchor. Possibility: user's complaint is actually about missing `max-w-[1248px]` cap causing wide-monitor overflow, not padding per se.
**If not supplemented:** Engineer may reduce padding to 72px but user still sees same issue because real cause was max-width absence.

### QA Challenge #4 — AC-040-DIARY-CTA-FOOTER-GAP (Item 4)

**Issue:** same class as #2 — "vertical gap visually open" not quantified.
**Needs supplementation:** Designer numeric value in .pen; AC asserts measured distance matches spec ±2px.
**If not supplemented:** ditto #2.

### QA Challenge #5 — AC-040-DIARY-MOBILE-RAIL (Item 6)

**Issue:** Two divergent outcomes — (a) rail restored or (b) rail removed-by-design — have opposite test assertions. Currently AC is conditional on Designer's finding, which means the Playwright spec cannot be written until Phase 1 completes. That's fine for sequencing but **QA needs the Designer decision path recorded in .pen/JSON before Phase 3 Engineer release** so QA can author the mobile rail spec deterministically.
**Needs supplementation:** Designer delivers `homepage-v2.frame-*.json` Diary mobile frame with explicit annotation `mobileRail: "restored" | "design-removed"` (or equivalent machine-readable key); AC references that annotation as the source of truth.
**If not supplemented:** QA will mark AC FAIL on sign-off regardless of Engineer's choice because there's no tiebreaker.

### QA Challenge #6 — AC-040-ABOUT-PROTOCOL-LINK-NEW-TAB (Item 11)

**Issue:** the AC is clean (Given/When/Then/And all testable). But **user-reported regression risk**: clicking a link that opens a `target="_blank"` to a site-relative path (`/docs/ai-collab-protocols.md#role-flow`) produces a new-tab navigation to a **raw markdown file**, not a rendered page. On the live SPA, `/docs/...` paths are NOT handled by the React router (confirmed by `grep docs/ai-collab-protocols.md frontend/src/App.tsx` — zero routes). User will open new tab → see `index.html` 404 fallback or raw markdown download.
**Needs supplementation:** PM must rule one of:
  - (A) `docsHref` values in `ReliabilityPillarsSection.tsx` need to be changed to an actual rendered destination (external GitHub blob URL, or an in-repo rendered route that exists);
  - (B) Accept Known Gap: "new tab opens 404 until docs route is added — scope for follow-up ticket";
  - (C) Scope expansion: this ticket also adds a `/docs/*` MD renderer route.
**If not supplemented:** Item 11 "works" per AC (new tab opens) but delivers broken UX.

### QA Interception #1 — K-034 Phase 1 Sacred cross-check (proactive)

**Boundary scenario:** Item 2 / Item 4 both adjust Diary footer vicinity. AC §3 Constraints correctly cites `AC-034-P1-ROUTE-DOM-PARITY` but **PM's BQ-040-02 ruling (Option A, Diary-only `main` pb reduction) is the Sacred-safe path** — this ruling must be carried into the Designer instruction and echoed in AC-040-DIARY-FOOTER-BOTTOM-GAP And clause as "adjustment location = `<main>` container, Footer internals untouched". Current AC And says "implementation location documented in Designer .pen annotation" — Designer's decision would reopen BQ-040-02. Pin the ruling now.

**Covered by existing AC:** partial — ruling text is in BQ-040-02 but not in the AC itself.
**PM action:** promote BQ-040-02 Option A into AC-040-DIARY-FOOTER-BOTTOM-GAP as a hard And clause ("adjustment must be in `<main>` container `pb-*`, not in `<Footer>` component") before releasing Designer.

### QA Interception #2 — Item 1 Hero font cascade risk

**Boundary scenario:** `font-display` is declared as `"Bodoni Moda", serif` in `tailwind.config.js`. Removing `font-display` from HeroSection is scoped, but **grep confirms** (PM should verify): other components may also use `font-display` for unrelated reasons (About headings? Diary Hero?). If the Bodoni Moda font file loads solely because HeroSection used `font-display`, removing that last reference doesn't break anything (Tailwind JIT strips unused). But if `font-display` is still used elsewhere, the class survives. AC-040-HERO-FONT-MONO grep `font-display` in `HeroSection.tsx` = 0 is correct (scoped to one file) — just need to confirm the grep stays file-scoped, not repo-wide.

**Covered by existing AC:** yes — AC already says grep restricted to `frontend/src/components/home/HeroSection.tsx`.
**PM action:** no change needed; noted as sanity-check for Engineer at impl time.

**What went well:**
- PM raised all 8 items with file:line evidence before drafting AC (per `feedback_verify_before_status_update.md`).
- AC visual-intent wording used consistently (Items 1/2/3/4/14) per `feedback_pm_ac_visual_intent.md`.
- Sacred cross-check done at AC authoring time (Items 2/4 → K-034 P1 ROUTE-DOM-PARITY) per `feedback_pm_ac_sacred_cross_check.md`.
- Raw-count sanity recorded for Items 1 and 11 per `feedback_refactor_ac_grep_raw_count_sanity.md`.

**What went wrong:**
- 4 of 8 ACs (Items 2/3/4/6) currently lack numeric Designer-spec tie-back — Challenges #2/#3/#4/#5 raised. Acceptable for PM Gate because ACs explicitly defer numbers to Designer .pen JSON; but JSON must exist and be frozen before Phase 3 Engineer release, not just "Designer will pick a value".
- Item 11 has a broken-UX risk (Challenge #6) that the AC mechanically passes — classic QA catch: happy-path green, user-facing broken.
- QA was simulated in PM persona because main-session Agent tool unavailable. Documented; mitigated by re-dispatch to real QA agent at Phase 5 regression.

**Next time improvement:**
- When ticket AC defers numeric targets to Designer, add a gate clause: "Phase 3 Engineer release requires Designer JSON spec frozen with numeric values for [list of AC IDs]."
- For any AC referencing a link/href, grep the live route table to confirm destination exists before accepting AC. (Item 11 would have been caught earlier.)

---

## 2026-04-23 — K-034 Phase 3 regression (/diary adopts shared Footer, absorbs ex-K-038)

**Verdict:** RELEASE-PM

**What went well:**
- Full Playwright suite 253 passed / 1 pre-existing K-032 fail (AC-020-BEACON-SPA unchanged) / 1 skipped — no new failures, no regression in previously-green tests.
- 4-route Footer snapshot baselines (`footer-{home,about,business-logic,diary}-chromium-darwin.png`) all PASS; new `/diary` baseline committed as untracked file ready for next commit.
- Sacred K-030 AC-030-NO-FOOTER (`app-bg-isolation.spec.ts:70`) untouched, PASS — `/app` isolation unchanged.
- Retirement annotations verified in both source tickets: K-017 line 294 + K-024 line 412 carry `> Retired 2026-04-23 by K-034 Phase 3` blockquote with AC text preserved as historical record.
- Engineer FAIL-IF-GATE-REMOVED dry-run (Challenge #8 compliance) recorded in `docs/retrospectives/engineer.md` lines 23–27: 3 expected FAILs enumerated (T1 /diary, LOADING-VISIBLE, snapshot /diary) with exact timeout symptom strings; `app-bg-isolation.spec.ts + pages.spec.ts` 39/39 green proves cross-contamination sweep.
- TD-K034-P3-02 viewport seam gap logged in `docs/tech-debt.md:56` with explicit trigger condition (user-reported 640–768px regression).

**What went wrong:**
- Nothing regressed this round. One minor observation: `visual-report` test harness still prints `WARNING: TICKET_ID not set` (K-UNKNOWN-visual-report.html) when PASS suite invoked without env var — out of scope for Phase 3 but worth a future harness cleanup.

**Next time improvement:**
- When QA regression is invoked without an explicit TICKET_ID env var (because Reviewer ran full suite as part of depth pass), set `TICKET_ID=K-XXX` before re-running `visual-report.ts` so the generated HTML file is named correctly — applies to all future regression rounds.


## 2026-04-23 — K-034 Phase 2 sign-off regression (Engineer fix-forward complete)

**做得好：**
- Full Playwright regression 251 passed / 1 failed / 1 skipped — single failure is the pre-existing K-032 GA gap `ga-spa-pageview.spec.ts:142` (AC-020-BEACON-SPA), matching Engineer's fix-forward expectation exactly; zero new regressions introduced by Phase 2 (19 AC).
- tsc `--noEmit` exit 0; visual report regenerated with `TICKET_ID=K-034` to `docs/reports/K-034-visual-report.html` (all 4 marketing routes captured green); Sacred cross-check clean — `grep -rE "DossierHeader|dossier-header|data-annotation|ROLE_ANNOTATIONS"` against `frontend/src/` + `frontend/e2e/` returns zero live dependencies on the 4 retired K-022 Sacred clauses (only historical retirement comments remain).
- Cross-route shared-component parity gate (`shared-components.spec.ts`) T1 byte-identity + T2 Pencil-canonical content + T3 no /about CTA + T4 /diary footer absence all pass — Phase 2 did not disturb Phase 1 Footer invariants.
- Pencil parity spot-check on FileNoBar vs `BF4Xe m*Top/m*Lbl` + `8mqwX r*Top` + `UXy2o p*Top` + `EBC1e t*Top` + `JFizO arch*Top`: `padding [6,10] → px-[10px] py-[6px]`, `fill #2A2520 → bg-charcoal`, `Geist Mono 10 paper letterSpacing 2 → font-mono text-[10px] text-paper tracking-[2px]`, `label?` optional matching MetricCard bare `FILE Nº 0N` — all match, zero drift in 5 FileNoBar consumers.

**沒做好：**
- **New QA Flag (Minor, not a blocker)** — `MetricCard` m1Note + m4Note typography drift vs Pencil `BF4Xe.m1Note`/`m4Note`: Pencil specifies `fontSize: 13, fill: #1A1814 (ink)` (distinct from m2Note/m3Note which ARE `11px muted`), but code `MetricCard.tsx:56` renders ALL notes uniformly as `text-[11px] text-muted`. Reviewer §4.8 gate missed this because §5 drift row D-2 lumped all notes as "Newsreader 11 italic note" (design-doc level drift vs Pencil JSON) and no E2E `getComputedStyle` assertion exists on `17 tickets, K-001 → K-017` or `Bug Found Protocol, per-role retro logs, audit script` fontSize/color (only `toBeVisible` text-content gates). Recommend Engineer open TD-K034-P2-18 "MetricCard m1/m4 note: restore Pencil `fontSize: 13` + `fill: ink` (distinguish high-signal notes from low-signal muted classification lines)"; NOT a Phase 2 close blocker — pre-existing design-doc-vs-Pencil drift class, content verbatim, visually minor, caught at QA parity spot-check (which is what the gate is for).
- AC-coverage audit: 16 / 19 Phase 2 new AC have direct E2E assertion coverage; 3 AC (AC-034-P2-AUDIT-DUMP revised, AC-034-P2-DRIFT-LIST revised, AC-034-P2-DESIGNER-ATOMICITY, AC-034-P2-SNAPSHOT-POLICY, AC-034-P2-SACRED-RETIRE, AC-034-P2-DEPLOY) are documentation/infra/deploy gates — not E2E-assertable by design; verified via filesystem + ticket content. AC-034-P2-DRIFT-D19-D21-HERO-REWRITE has `Bodoni Moda` + `text-brick` assertions in `about-v2.spec.ts:66-91` but no explicit `64px`/`left-align`/`fill_container divider` computed-style assertion — covered indirectly via `AC-022-HERO-TWO-LINE` snapshot baseline + font family check; tight enough for sign-off but TD-eligible for future hardening.

**下次改善：**
- Add a Pencil-font-size parity sweep to QA sign-off checklist: for each `FileNoBar` / `MetricCard` / `RoleCard` / `PillarCard` / `TicketAnatomyCard` / `ArchPillarBlock` body text node, grep Pencil JSON `fontSize` + `fill` values, enumerate per-card (not per-card-type), and compare against code `text-[Npx]` / `text-ink|muted|brick|charcoal` — catches m1Note-class drifts that Reviewer's §5-table-scoped gate misses. Codify as new `qa.md` §Mandatory Task Completion step 0d "Pencil text-node typography sweep" so future `.pen`-backed UI tickets enumerate per-node typography, not per-component-class.

## 2026-04-23 — K-034 Phase 2 Early Consultation (/about visual audit)

**Consultation trigger:** PM opening Phase 2 with 2 placeholder ACs (AC-034-P2-AUDIT-DUMP, AC-034-P2-DRIFT-LIST). Both are untestable as written. QA filing 9 Challenges before PM releases Designer/Architect/Engineer.

**Pre-consultation evidence probe (2026-04-23):**
- `frontend/design/` contains: `favicon.pen`, `homepage-v1.pen`, `homepage-v2.pen` — **no `about-v2.pen` file exists**.
- `frontend/design/specs/` contains 2 JSONs: `homepage-v2.frame-86psQ.json` + `homepage-v2.frame-1BGtd.json` — both are Footer frames, **zero /about body frames exported**.
- `frontend/design/screenshots/` contains 3 PNGs, all Footer-related.
- `docs/designs/K-022-about-structure.md` line 7: `pencil-frame: 35VCj (About /about K-017 v2)` — /about Pencil SSOT is frame `35VCj` **inside `homepage-v2.pen`**, not a separate file. This frame has never been JSON/PNG exported.
- `AboutPage.tsx` renders 8 distinct sections: DossierHeader (A-2) + 6 `SectionContainer` sections (S1 header through S6 architecture) + `<Footer />`. All body sections beyond Footer have zero Pencil JSON/PNG provenance on HEAD.

---

### QA Challenge #1 — AC-034-P2-AUDIT-DUMP — "every /about Pencil frame" is undefined
**Issue:** AC line 301 says "every /about Pencil frame has a corresponding `frontend/design/specs/about-v2.frame-<id>.json`". But (a) there is no `about-v2.pen` file; the /about SSOT is frame `35VCj` living inside `homepage-v2.pen`; (b) frame `35VCj` is a single monolithic frame per K-022 design doc — there is no authoritative inventory of sub-frames per /about section. The AC filename pattern `about-v2.frame-<id>.json` presupposes a file that does not exist.
**Risk:** Designer dumps `35VCj` as one 1000-node JSON → AC passes trivially but audit has no section granularity. Or Designer fabricates a section split and names them arbitrarily → drift diff format inconsistent across sections. Either way, Phase 2 audit output is unusable by Engineer.
**Option A (fix):** PM rules on authoritative frame inventory BEFORE Designer dumps. Two sub-options:
  - A1: Designer first splits `35VCj` into 7 sub-frames (one per /about section: DossierHeader, Header, Metrics, Roles, Reliability, TicketAnatomy, Architecture) inside `homepage-v2.pen`, then dumps each. AC filename pattern becomes `homepage-v2.frame-<id>.json` matching existing `86psQ`/`1BGtd` convention.
  - A2: Dump monolithic `35VCj` + Designer produces one `docs/designs/K-034-P2-about-section-inventory.md` mapping each code section (AboutPage.tsx line N–M) to a node-ID subtree within `35VCj`. Drift list references node IDs, not frame IDs.
**Option B (Known Gap):** "Audit only Footer frames `86psQ`+`1BGtd` (already exported); /about body sections out of scope Phase 2" → TD-K034-P2-01, explicit scope shrink. Ticket's stated deliverable "per-section Pencil JSON dump" gets retitled as "Footer-only re-parity dump".
**Recommendation:** **Option A1** — matches established `homepage-v2.*` filename convention, gives Engineer deterministic per-section diff target, and splitting `35VCj` creates reusable Pencil SSOT for future /about tickets. A2 risks node-ID drift every time Designer edits Pencil (see Challenge #9).
**If not ruled:** AC-034-P2-AUDIT-DUMP will FAIL at sign-off (cannot prove "every frame" without an inventory).

---

### QA Challenge #2 — AC-034-P2-DRIFT-LIST has no schema for diff entries
**Issue:** AC-034-P2-DRIFT-LIST (line 304) is a stub "To be expanded at Phase 1 close". Ticket deliverable 2 says "property, expected, observed" but gives no canonical form. Without a schema, Engineer and PM cannot deterministically compare: is `fill: "#6B5F4E"` drift from CSS `rgb(107 95 78)` a drift or a representation? Is Tailwind `text-[13px]` equivalent to JSON `fontSize: 13`? Is `tracking-[2px]` equivalent to `letterSpacing: 1` (existing Footer JSON uses `letterSpacing: 1` — unit unknown, px or em?).
**Risk:** K-024 C-1 pattern repeats — "·" vs "—" style literal-drift slipped past green tests because assertion and implementation both used wrong literal. Here, if drift diff uses eyeball color comparison, oklch-vs-hex conversion rounding (e.g. `#6B5F4E` ≈ `oklch(0.49 0.02 65)` but not byte-identical) triggers false drift flags, or false absence when Tailwind compiles to `rgb()` with 3-digit truncation.
**Option A (fix):** PM rules on drift-diff schema before Phase 2 starts. Minimum columns: `section | property | pencil-json-path | json-raw-value | code-path (file:line) | code-raw-value | normalized-json | normalized-code | drift: yes/no | proposed-resolution`. Normalizer rules: color → `#RRGGBB` lowercase 6-digit (no alpha unless present); sizes → integer px (`fontSize: 13` matches Tailwind `text-[13px]`); letterSpacing → px (`letterSpacing: 1` = `1px`, Tailwind `tracking-[1px]`); fontWeight → numeric (`"normal"` = 400, `"bold"` = 700). Tailwind arbitrary values (`text-[13px]`, `tracking-[2px]`) preferred over named utilities to make unit explicit.
**Option B (Known Gap):** Accept eyeball diff, log TD-K034-P2-02 "formalize drift schema in future ticket" → Phase 2 drift list remains advisory, cannot block Engineer updates.
**Recommendation:** **Option A** — K-024/K-025 W-1 feedback loop (`feedback_refactor_ac_grep_raw_count_sanity.md`) proved that un-normalized comparison produces silent false negatives. Without a normalizer, drift list is as credible as my grandmother's cross-stitch pattern.
**If not ruled:** AC-034-P2-DRIFT-LIST will FAIL at sign-off (untestable — no deterministic predicate).

---

### QA Challenge #3 — Shared component drift: NavBar + SectionContainer NOT in Phase 2 scope
**Issue:** Phase 2 Deliverables list scopes to "per-section Pencil JSON dump" of /about frames. But AboutPage.tsx line 1 imports `UnifiedNavBar` (shared across /, /about, /business-logic) and line 2 `SectionContainer` (primitive wrapping every section). K-035 Footer drift (2026-04-22) root cause was per-route-local assertion letting cross-route DOM divergence survive; same class of bug applies to NavBar. If Phase 2 audits only /about-specific components (DossierHeader, MetricCard, RoleCard, etc.) and skips UnifiedNavBar + SectionContainer primitive styling, Pencil-vs-code drift on those shared components goes undetected on /about AND leaks to sibling routes.
**Risk:** Phase 2 closes green, /about ships Pencil-parity perfect for body sections, but NavBar still has a 1px padding drift that Pencil already encodes correctly. Next sprint someone "fixes" NavBar and breaks /. This is exactly K-035 Footer drift repackaged.
**Option A (fix):** Phase 2 scope explicitly INCLUDES `UnifiedNavBar` + `SectionContainer` Pencil parity on /about. Those are 2 more sub-frames in the A1 split (or 2 additional node-ID subtrees in A2). Cross-route regression spec `shared-components.spec.ts` extends to assert any NavBar drift would break all 3 NavBar-consuming routes (Option A1 in K-034 Phase 3 AC precedent — byte-identity pattern).
**Option B (Known Gap):** "Phase 2 audits only /about-specific body components; shared chrome (NavBar, SectionContainer) audit deferred" → TD-K034-P2-03, explicit tracker. Risk acknowledged: any shared-chrome drift on /about will not be flagged.
**Recommendation:** **Option A** — shared-component inventory check is codified behavior rule (`feedback_shared_component_inventory_check.md`, 2026-04-22), excluding NavBar from a "/about full visual audit" violates the rule. Footer is already Phase 1 so that box is ticked, but NavBar and SectionContainer remain.
**If not ruled:** QA sign-off withheld with citation "Phase 2 shared-component inventory gate not met".

---

### QA Challenge #4 — Regression protection for non-/about Footer consumers absent
**Issue:** Phase 1 unified Footer across /, /about, /business-logic. Phase 2 will likely trigger Engineer edits to Footer IF Phase 2 drift finds divergence between Footer code and Pencil `86psQ`/`1BGtd` JSON. But Phase 2 ticket deliverable 4 says only "tsc + Playwright" — which currently runs a single-viewport suite and a single `shared-components.spec.ts` snapshot set. No explicit mandate to re-run `visual-report.ts` on / and /business-logic (Phase 3 will add /diary as 4th consumer, so by end of this week, 4 routes share Footer).
**Risk:** Phase 2 fixes a Footer drift to match Pencil (say letterSpacing 1 → 2); /about passes; / and /business-logic visual regression slip through because Playwright snapshot was regenerated not compared. K-035 2026-04-22 feedback memo explicitly mandates cross-route equivalence assertion on shared chrome.
**Option A (fix):** Phase 2 AC adds a mandatory step: "for every Engineer code edit touching `components/shared/**`, run `shared-components.spec.ts` ALL routes + snapshot diff against baseline + visual-report on all Footer-consuming routes (`/`, `/about`, `/business-logic`). Any snapshot diff without corresponding Pencil JSON re-export is a FAIL." Extend to /diary the moment Phase 3 lands.
**Option B (Known Gap):** Phase 2 assumes Footer is frozen per Phase 1 → Engineer MUST NOT touch `Footer.tsx` or `shared/**` during Phase 2. Any Footer drift found in Phase 2 audit is punted to Phase 4 (new ticket). Enforced by Reviewer Git Status Commit-Block Gate (K-037 F-N2 precedent).
**Recommendation:** **Option B** — cleaner scope boundary. Phase 1 already proved Footer parity; if Phase 2 audit finds Footer drift, that's a Phase 1 regression and deserves its own ticket + BFP Round 2, not a silent fix. Also avoids the "Engineer edits shared Footer during /about audit" combinatorial explosion.
**If not ruled:** QA will flag any Phase 2 commit touching `frontend/src/components/shared/**` as CODE-PASS / COMMIT-BLOCKED until PM rules scope expansion.

---

### QA Challenge #5 — `.pen` update path round-trip atomicity unspecified
**Issue:** Phase 2 deliverable 3 says "PM ruling per drift: `.pen` update (send to Designer) vs code update (send to Engineer)". For the `.pen`-update branch: Designer edits `homepage-v2.pen` via Pencil MCP, but then needs to atomically re-export the affected frame's JSON + PNG. `feedback_designer_json_sync_hard_gate.md` (2026-04-23) mandates "same session batch_design → export JSON + PNG". But Phase 2 has N drifts potentially affecting M Pencil frames; partial re-sync (e.g. `.pen` updated + JSON updated + PNG NOT updated) is a K-035 α-premise regression waiting to happen — the spec JSON and screenshot would drift within the Designer session.
**Risk:** Designer fixes 3 drifts in Pencil, exports JSON for 2, forgets PNG for 1 (or vice versa). Reviewer's Pencil-parity gate (Step 2 per `feedback_reviewer_pencil_parity_gate.md`) compares JSX to JSON — passes. QA's 0c frame spec + screenshot parity compares Playwright screenshot to PNG — might pass if PNG is stale matching old Pencil state. Same drift re-introduced in 4 weeks via stale PNG.
**Option A (fix):** Phase 2 adds a hard gate: "for every `.pen`-side ruling, Designer session output must include in one batch: (a) updated `.pen` commit, (b) re-exported `specs/<frame>.json`, (c) re-captured `screenshots/<frame>.png`, (d) side-by-side PNG if the frame participates in multi-frame cross-consistency (Footer does, per K-034 Phase 1 `86psQ-vs-1BGtd-side-by-side.png`). All four in same Git commit; QA 0c rejects any commit with < 4 of 4 updated."
**Option B (Known Gap):** Accept best-effort Designer sync; QA 0c verifies JSON+PNG but does NOT re-diff `.pen`→JSON; TD-K034-P2-04 opened for future tooling to auto-verify export freshness (e.g. `.pen` mtime vs JSON `pen-mtime-at-export` header).
**Recommendation:** **Option A** — the JSON header already contains `pen-mtime-at-export` (verified in `86psQ.json` line 3: `"pen-mtime-at-export": "2026-04-21T19:52:16+0800"`). QA 0c can programmatically verify `pen-mtime` of file on disk ≥ JSON `pen-mtime-at-export` ≥ PNG stat.mtime (monotonic chain). Zero ambiguity, zero extra tooling, K-035 α-premise eliminated.
**If not ruled:** QA 0c will FAIL any Phase 2 commit where Designer-side pencil-mtime chain is non-monotonic.

---

### QA Challenge #6 — Viewport seam: Phase 2 desktop-only = mobile drift undetected
**Issue:** `frontend/e2e/about-v2.spec.ts` tests /about at desktop + 375px mobile viewport (grep confirms lines 44, 112, 295, 318). Pencil frame `35VCj` is a single viewport design (likely ~1440px wide). Phase 2 drift list will necessarily be desktop-only unless explicitly scoped. But /about ships to users in both viewports; silent mobile drift (Tailwind responsive utilities `md:`, `lg:` branches) is code-side-only and has no Pencil SSOT to audit against.
**Risk:** Phase 2 closes green at desktop parity; mobile /about has a broken grid that was never part of the Pencil design. User reports "looks wrong on phone" next week; QA re-audits and finds no Pencil source of truth to compare to. Known K-027 class of bug (mobile /diary overlap).
**Option A (fix):** Phase 2 scope explicitly DESKTOP-ONLY (single breakpoint matching Pencil `35VCj` width); mobile parity is Known Gap TD-K034-P2-05, explicit scope note in AC-034-P2-AUDIT-DUMP. Ticket receives mobile-design-exemption row in `design-exemptions.md` §2 RESPONSIVE (precedent: K-034 Phase 3 Challenge #2 → same exemption).
**Option B (fix with expanded scope):** Designer produces a second Pencil frame `35VCj-mobile` at 375px width; Phase 2 audits both breakpoints; drift diff schema adds a `viewport` column. Doubles Phase 2 effort.
**Recommendation:** **Option A** — matches Phase 3 Challenge #2 precedent exactly; mobile /about has no current user complaint; expanding Pencil to 2 breakpoints is Designer work outside this ticket's stated scope. Explicitly log TD-K034-P2-05 so intent is preserved.
**If not ruled:** AC-034-P2-AUDIT-DUMP cannot pass — dumping only desktop frames while silent on mobile is a Sweep Table ❌ under QA persona.

---

### QA Challenge #7 — Dark mode intent silent: K-029 paper palette vs Pencil unknown
**Issue:** K-029 (2026-04-22) moved /about card body text to paper palette (`text-ink`, `text-muted`). Pencil frame `35VCj` was authored pre-K-029 and may still encode the old dark palette, OR the K-029 fix may have been a code-only patch that never reached Pencil. Without Phase 2 explicitly ruling, drift list could either flag every card as "code drift from Pencil" (false positive, Pencil is the stale one) or silently accept current code as canonical (baking in K-029 drift permanently).
**Risk:** Drift list has N entries saying "card body color: Pencil `#E5E5E5` vs code `#1a1814`". PM can't rule without knowing K-029 intent was retrofit-Pencil-or-not. Eight-week-old memory gap.
**Option A (fix):** PM reads K-029 design doc + commit history, rules BEFORE drift list is authored: "K-029 palette is canonical; Pencil frame `35VCj` must be updated to match K-029 code (Designer task in Phase 2 `.pen`-side bucket)". Drift list then treats K-029-touched properties as "Pencil-side fix required, code unchanged".
**Option B (fix, reverse):** PM rules K-029 was a temporary patch; Pencil `35VCj` is canonical; Phase 2 reverts K-029 on code side. Requires user sign-off (reverting a landed ticket).
**Option C (Known Gap):** Out of scope Phase 2; pre-flag all K-029-touched properties as "K-029 drift — do not audit"; TD-K034-P2-06 for future resolution.
**Recommendation:** **Option A** — K-029 landed based on user-visible quality (readability on paper bg); Pencil should chase reality, not the other way. Designer updates `35VCj` as first Phase 2 task.
**If not ruled:** drift list author will default to "flag everything", 20+ false-positive drift entries, Phase 2 audit signal-to-noise collapses.

---

### QA Challenge #8 — Regression snapshot baselines: `shared-components.spec.ts-snapshots/` will drift
**Issue:** `frontend/e2e/shared-components.spec.ts-snapshots/` currently contains 3 PNGs (`footer-about-chromium-darwin.png`, `footer-business-logic-chromium-darwin.png`, `footer-home-chromium-darwin.png`) from Phase 1. Any Phase 2 Engineer code update on Footer (if Challenge #4 Option B is rejected) OR any body-section layout change triggers Playwright snapshot mismatch on next CI run. Phase 2 ticket currently has no AC covering snapshot baseline update policy — Engineer may `--update-snapshots` silently (regenerating) or manually delete + accept, both lose regression protection.
**Risk:** Engineer fixes 3 drifts, runs `npx playwright test --update-snapshots`, all snapshots regenerate, all tests green. New baseline now locks in the fix BUT also silently absorbs any unrelated side effect (font metric shift, hairline color change). QA 0c screenshot parity against Pencil PNG still catches Pencil-drift, but Playwright snapshot regression protection is voided for that cycle.
**Option A (fix):** Phase 2 AC adds explicit snapshot policy: "any snapshot baseline update during Phase 2 requires (a) corresponding Pencil JSON/PNG re-export (Designer round-trip per Challenge #5), OR (b) PM-written rationale in ticket §5 recording the exact drift and why no Pencil change needed. Blanket `--update-snapshots` is prohibited; Engineer runs update per-file with git diff review before commit."
**Option B (Known Gap):** Accept blanket snapshot regeneration; rely on Pencil PNG parity (QA 0c) as sole regression line. TD-K034-P2-07 opened for future snapshot review tooling.
**Recommendation:** **Option A** — K-035 root cause was exactly this pattern ("route-local assertion + baseline regenerated at each green run = drift codified"). Phase 2 needs snapshot hygiene, not more snapshots.
**If not ruled:** QA will flag any Phase 2 commit containing `--update-snapshots` in git history as CODE-PASS / COMMIT-BLOCKED pending PM rationale.

---

### QA Challenge #9 — Idempotency: Pencil frame node IDs not stable
**Issue:** Phase 2 dump + drift list will reference Pencil node IDs (per `86psQ.json` structure: `"id": "hpwtD"`). But Pencil's MCP-assigned node IDs are autogenerated per insert. If Designer does ANY edit to `homepage-v2.pen` after Phase 2 dump (e.g. a Phase 3 Footer tweak), node IDs for unchanged nodes MAY or MAY NOT be stable — depends on Pencil internals (undocumented per MCP instructions). If unstable, re-running Phase 2 audit tomorrow yields JSON with different IDs, drift list references become stale, and any follow-up ticket referencing "node `hpwtD`" has no anchor.
**Risk:** Drift list cites node IDs, PM rules resolution, Designer edits Pencil, IDs churn, next-day re-verification can't find the node. This is an idempotency test failure for the whole audit process.
**Option A (fix):** Phase 2 drift list uses `(frame-id, node path)` tuple instead of raw node ID — e.g. `(35VCj, children[3].children[1])` or `(35VCj, name="DossierHeaderBar")`. Requires Designer to ensure every Pencil node has a stable `name` attribute (most nodes in current `86psQ.json` do — `"name": "ftR"`). Drift schema (Challenge #2) then specifies path-by-name, not path-by-ID.
**Option B (Known Gap):** Accept node-ID instability; TD-K034-P2-08 opened; drift list is a point-in-time snapshot; any follow-up references Pencil via re-dump + manual re-match.
**Recommendation:** **Option A** — trivial lift (Pencil nodes already have `name`), huge return (idempotency preserved across sessions). Drift schema column `pencil-json-path` uses name-based JSONPath (e.g. `$.frame.children[?(@.name=="DossierHeaderBar")].children[?(@.name=="FileNumber")].fontSize`).
**If not ruled:** Phase 2 drift list will have 1-week shelf life; any follow-up audit must redo from scratch.

---

**Summary: 9 Challenges filed. All 9 require PM ruling before Designer/Architect/Engineer release.** Without rulings on #1, #2, #5, #9, Phase 2 output is mathematically not verifiable — audit will FAIL at sign-off regardless of effort invested. Challenges #3, #4, #6, #7, #8 need rulings to define scope; silent scope = QA marks Phase 2 FAIL per persona rule ("no explicit 'not testing because ___' = silent omission not acceptable").

**Recommended PM ruling session scope:** answer all 9 inline in ticket §Phase 2 PM Rulings block (parallels §4.4 Phase 3 PM Rulings structure). Expected output: 9 Option picks + rationale + any TD-K034-P2-0N trackers opened. Then expand AC-034-P2-DRIFT-LIST from stub to full Given/When/Then block citing the drift schema.

**What went well:** pre-consultation evidence probe caught three concrete blockers (no `about-v2.pen`; `35VCj` is unsplit monolith; JSON header `pen-mtime-at-export` already provides round-trip atomicity primitive) before drafting Challenges — grounded every Challenge in file-path evidence.

**What went wrong:** N/A — Early Consultation fired at correct gate (Phase 2 open, Designer not yet released).

**Next time improvement:** when PM opens a Phase with placeholder ACs flagged "to be expanded at Phase N-1 close", QA Early Consultation should fire immediately on Phase open, not wait for PM to request — placeholder ACs are by definition untestable and deserve Challenge treatment before any downstream role engages. Codify as hard rule in `qa.md` Early Consultation section.

---

## 2026-04-23 — K-038 /diary shared Footer (ABSORBED INTO K-034 Phase 3)

**Absorption note (2026-04-23):** Per user directive, ex-K-038 scope absorbed into K-034 as Phase 3. All 9 Challenges below remain valid and binding on Phase 3 AC structure. PM has ruled the 4 Option-required Challenges per Phase 3 AC block (verbatim rulings in `docs/tickets/K-034-about-spec-audit-and-workflow-codification.md` §4.4 PM Rulings on Phase 3 QA Early Consultation):
- Challenge #1 (loading state) → **Option A** (Footer renders during loading) — routed to AC-034-P3-DIARY-FOOTER-LOADING-VISIBLE
- Challenge #2 (viewport seam) → **Option A** (Known Gap, log to design-exemptions.md §2 RESPONSIVE; TD-K034-P3-02 opened) — routed to AC-034-P3-VIEWPORT-SEAM-KNOWN-GAP
- Challenge #6 (sitewide-footer /diary coverage) → **Option A** (add /diary to 4-route computed-style loop) — routed to AC-034-P3-SITEWIDE-FOOTER-4-ROUTES
- Challenge #9 (K-017 retroactive retirement) → **Option A** (retroactive annotation for 3-ticket trail consistency) — routed to AC-034-P3-SACRED-RETIREMENT

The other 5 Challenges (#3 fixture registration, #4 describe block cleanup, #5 snapshot baseline precision, #7 inventory footnote, #8 FAIL-IF-GATE-REMOVED scope) all confirmed by Phase 3 AC structure / Engineer design-doc expectations per §4.4 ruling table. QA Early Consultation now serves **K-034 Phase 3** (absorbed ex-K-038), not a standalone K-038 ticket; ticket ID K-038 file never landed on disk (reserved-but-absorbed; next new ticket = K-039).

Cross-ref: `docs/tickets/K-034-about-spec-audit-and-workflow-codification.md` §Phase 3 AC block + §4.3 BQ rulings + §4.4 QA Challenge rulings.

---

**Ticket (historical as-filed):** `docs/tickets/K-038-diary-shared-footer-adoption.md` — /diary adopts shared Footer; retire K-017 + K-024 + K-034 P1 half Sacred; /app (K-030) preserved. **Note:** file never landed on disk; content preserved below as historical Challenge record. Ongoing ticket tracking is now K-034 Phase 3.

**Scope reviewed：** ticket AC-038-P0-* + AC-038-P1-* (10 AC total); Sacred retirement table (§3 BQ-038-03); affected spec files `shared-components.spec.ts` T1/T2/T4 + `pages.spec.ts` L152–164 + `sitewide-footer.spec.ts` L3–20 header comment + `sitewide-fonts.spec.ts` L9 comment; DiaryPage.tsx current structure (3 terminal states + loading); shared Footer component (`components/shared/Footer.tsx` prop-less); K-030 `/app` isolation preserved.

**Grep audit cross-reference：**
- `grep -rn "/diary" frontend/e2e/ | grep -iE "footer"` → 3 hits: `shared-components.spec.ts:99–100` (T4), `pages.spec.ts:152/158` (AC-017-FOOTER no-footer block). No hidden third spec.
- `grep -rn "footer" frontend/e2e/ | grep -i diary` → same 3 hits + `visual-report.ts:38` (visual report route list, benign — will auto-pick up Footer render after Phase 1).
- `grep -n "diary\|Footer" sitewide-fonts.spec.ts` → 零 `/diary`-specific 斷言（既有 shared Footer fontFamily 斷言只跑 `/`，不需要改）。
- `sitewide-footer.spec.ts` 頂端 L7 註解 `Given: user visits /, /business-logic` — /about 已因 K-035 退役 Sacred 納入共用 Footer；此 spec 的兩個 `test()` 只跑 `/` 與 `/business-logic`，/diary 不在其覆蓋面。Phase 1 若決定納入必須顯式討論（Challenge #6 涵蓋）。

**QA Challenge 清單（9 條）：**

---

### QA Challenge #1 — AC-038-P1-DIARY-FOOTER-LOADING-ABSENT：loading state Footer 行為交給 Engineer「自己決定」= untestable

**AC 原文：** "Engineer self-decides — not a product decision; Playwright asserts whichever the implementation chooses"

**Issue：** 這不是 AC，這是開罰單時才補規範的 post-hoc rationalization。"any of two branches OK" 使 Playwright 無法在 fail-if-gate-removed dry-run 中偵測 regression — 若未來 Engineer 刪掉 loading-branch Footer 渲染（或反向），沒有任何 spec 會 FAIL。loading state 可能停留 >1s（`useDiary` 串 fetch `/diary.json`，慢網路 3G 實測 2–4s），非 transient，User 看得到。

**需補充（PM 裁決二選一）：**
- Option A — **loading 時渲染 Footer**：AC 改寫為 `locator('footer').count() === 1 during loading`；Playwright 用 `page.route('**/diary.json', ...)` 人為延遲 2s 斷言 loading skeleton + Footer 同時在 DOM。與 `/business-logic` PasswordForm 預登入 state（Footer 有渲染）一致。**推薦**：此選項與其他 consumer route 行為一致，實作最簡單（`<Footer />` 放 `<main>` 同層就自動覆蓋所有 state）。
- Option B — **loading 時不渲染 Footer**：AC 改寫為 `locator('footer').count() === 0 during loading, count === 1 after loading done`；Engineer 需 conditional render `{!loading && <Footer />}`。測試需延遲 fixture + 雙重斷言。

**若不補充：** AC-038-P1-DIARY-FOOTER-LOADING-ABSENT sign-off 時 QA mark FAIL（原因：AC 無 falsifiable predicate）。

---

### QA Challenge #2 — AC-038-P1-BYTE-IDENTITY-4-ROUTES 缺 mobile viewport 斷言

**AC 原文：** T1 byte-identity matrix + viewport hardcoded `width: 1280, height: 800`（desktop only，繼承自 K-034 Phase 1）

**Issue：** DiaryPage `<main>` 用 `px-6 sm:px-24`（mobile 24px / desktop 96px）而 Footer 用 `px-6 md:px-[72px]`（mobile 24px / desktop 72px ≥ 768px）。兩者 horizontal padding 在 **640px–768px 區間**（Tailwind `sm` 斷點 640px vs `md` 斷點 768px）會發生 main 已經切到 desktop 但 Footer 還是 mobile 的 **viewport-padding seam**。K-034 Phase 1 shared-components-inventory.md §INHERITED exemption 允許 Footer padding 因祖先差異視覺表現不同，但此 seam 在 `/diary` 是新情境 — `/`、`/about`、`/business-logic` 祖先都沒有 `sm:px-24` 同時存在。

**需補充（PM 裁決二選一）：**
- Option A — **byte-identity 僅 desktop，視覺 seam 列 Known Gap**：保留 T1 只跑 1280×800，PM 顯式裁決 "640–768px seam 不測，因為 K-034 §INHERITED 已允許 padding variance"。**推薦**：最低成本，與既有 Sacred 一致。但 QA 要求 `design-exemptions.md §INHERITED` 追加一行明列 /diary 情境。
- Option B — **T1 跑三 viewport（360 / 768 / 1280）**：成本上升，但覆蓋 seam 真實渲染。若選 B，`footer-diary-chromium-darwin.png` snapshot baseline 從 1 個變成 3 個。

**若不補充：** 640px–768px 區間若存在視覺 regression，Phase 1 sign-off 時 QA 無 spec 可依；走 Known Gap 路徑 (PM 表態 "不測") 才算覆蓋。

---

### QA Challenge #3 — AC-038-P1-DIARY-FOOTER-EMPTY-STATE / ERROR-STATE 缺 fixture 註冊機制

**AC 原文：** "Given useDiary returns empty entries: []" / "Given useDiary returns error state"

**Issue：** 未明說 Playwright 如何 **強制** 進入 empty / error state。`diary-page.spec.ts` 既有手法是 `page.route('**/diary.json', ...)` fulfill 空陣列或 status=500。AC 沒寫 → Engineer 可能漏寫 fixture 路由，測試跑 production `diary.json`（非空），empty-state 分支 0 coverage。K-024 Phase 3 AC-024-BOUNDARY 已確立 "boundary spec 用 `page.route` fulfill fixture、不改 production diary.json" — 此 AC 應引用既有 pattern。

**需補充：** AC-038-P1-DIARY-FOOTER-EMPTY-STATE + ERROR-STATE 各加一行 `And Playwright uses page.route('**/diary.json', ...) to force the state (empty array / status=500) per K-024 Phase 3 boundary spec pattern`。且 Engineer 在 design doc 明列 fixture 檔名（`_fixtures/diary/empty.json` 已存在？）。**推薦**：直接複用既有 fixture，無新檔案。

**若不補充：** Engineer 自創 state-mock 方式，test 可能誤 PASS（production `diary.json` 有資料 → 走 timeline 分支 → Footer 也在，斷言通過但沒驗到 empty/error 分支）。QA sign-off 時 FAIL。

---

### QA Challenge #4 — `pages.spec.ts` L158–164 退役後 describe block 命名殘留

**AC 原文：** AC-038-P1-SACRED-RETIREMENT "the assertion block is deleted and a replacement inline comment reads ..."

**Issue：** `pages.spec.ts` L157 有 `test.describe('DiaryPage — AC-017-FOOTER no footer', () => {...})`。AC-038 只說「刪除 assertion block + 加 inline comment」，沒說 describe wrapper 怎麼處理。若只刪 `test()` 內容留 describe block 外殼，spec 會 discovery 到空 describe（Playwright 不 FAIL 但 test count 報表顯示 orphan block）；若連 describe 一起刪，K-024 retirement log 的行號引用會失效。

**需補充：** AC-038-P1-SACRED-RETIREMENT 明列：
- **刪除整個 describe block**（L157–164）
- **replacement inline comment 放在刪除處原位**，內容 verbatim: `// AC-017-FOOTER /diary negative clause retired per K-038 §3 BQ-038-03 — user intent change 2026-04-23; Footer now covered by shared-components.spec.ts T1 (byte-identity 4 routes)`
- **行號引用更新** K-017 + K-024 ticket 回指 K-038 §7（非回指被刪掉的 spec 行號）

**若不補充：** sign-off 時 QA 會發現 spec file 有 orphan describe 或 comment 位置錯亂；PM escalate。

---

### QA Challenge #5 — AC-038-P1-SNAPSHOT-BASELINE：新 baseline 容許 0.1% 變異但沒定義「祖先 padding 差異」如何處理

**AC 原文：** "all 4 PNGs visually identical (pixel-level diff ≤ 0.1%; Footer content and styling byte-identical modulo ancestor padding variance per design-exemptions §2 INHERITED category)"

**Issue：** 兩層問題：
1. **Playwright `toMatchSnapshot` 是 per-route 獨立 baseline**，不是 cross-route diff；AC 文字「4 PNGs visually identical」技術上不精確 — 實際運作是 `footer-diary-chromium-darwin.png` 獨立 baseline，未來 CI 只比自己 vs 自己。跨 route identity 由 T1 byte-identity 斷言承擔（outerHTML 等價），不是 snapshot 承擔。
2. **祖先 padding variance** — `/diary` Footer 繼承 `<main className="px-6 sm:px-24">` 祖先的 horizontal padding。Footer 自己 `w-full` + `px-6 md:px-[72px]` 是 viewport 級、不受祖先 padding 影響，但 Footer 截圖範圍（`footer.screenshot()`）若 Playwright clip 到 Footer element box 就沒影響，若包含 overflow 影響的祖先 scroll bar 就可能有 1–2px 差。這是 Phase 1 Engineer dry-run 才會知道。

**需補充：** AC-038-P1-SNAPSHOT-BASELINE 改寫為：
- **Mandatory：** 新 baseline `footer-diary-chromium-darwin.png` generated；per-route snapshot 獨立檢查不回歸。
- **Cross-route identity by T1, not snapshot**：AC 文字移除「4 PNGs visually identical」這句（誤導）；改為 "cross-route byte-identity asserted by T1 outerHTML diff（per AC-034-P1-ROUTE-DOM-PARITY）; this AC only locks per-route visual baseline."
- Engineer 在 design doc 先跑 dry-run 確認 `<main>` 祖先 padding 不外溢到 `<footer>` 截圖；若外溢 → 列 BQ 回 PM。

**若不補充：** 第一次 CI 跑 snapshot 若因祖先 padding 產生 2–3px 差，Engineer 會被迫 retrofit baseline 或質疑 AC；sign-off 出現反覆。

---

### QA Challenge #6 — `sitewide-footer.spec.ts` 沒加 /diary 斷言 = Footer 各屬性斷言對 /diary 零覆蓋

**Issue：** K-038 ticket 只規劃 `shared-components.spec.ts` T1 + snapshot；`sitewide-footer.spec.ts`（驗 fontSize 11px + color rgb(107, 95, 78) + border-top-width > 0）目前跑 `/`、`/business-logic` 兩 route（`/about` 由 K-035 退役後 K-034 Phase 1 rewrite 由 shared-components.spec.ts T1/T2 承擔）。

- T1 byte-identity 只驗 outerHTML 字串完全相等，**不驗 computed style** — outerHTML 相等不保證 browser 實際 `getComputedStyle` 渲染出相同 `fontSize`（極端情境如 CSS inheritance 被 `<main>` 祖先某個 `font-size: 16px !important` override）。
- T2 Pencil-canonical text 只跑 `/`（L58–73），單 route 抽樣。
- `sitewide-footer.spec.ts` 的 computed-style 斷言才是 per-route defensive net，但 K-038 沒提。

**需補充（PM 裁決）：**
- Option A — **`sitewide-footer.spec.ts` 的 describe block 覆蓋 `/diary`**：新增 `test('/diary — shared Footer shows with 11px muted + border-top', ...)`，複用既有 `expectSharedFooterVisible()` helper，一行新增。**推薦**：成本極低，但覆蓋 T1 無法捕捉的 computed-style regression（CSS cascade 被破壞），與 /、/business-logic 對稱。
- Option B — **不補充**：PM 顯式裁決 "T1 byte-identity 已涵蓋 `/diary` computed style"（理論上 outerHTML 相等 + 同一 CSS file → computed style 相等）；登 Known Gap，sign-off 時 QA 不 FAIL。

**若不補充：** Sign-off 時 QA mark /diary computed-style regression 為 Known Gap（須 PM 表態），否則 FAIL。

---

### QA Challenge #7 — `shared-components-inventory.md` Footer 行未涵蓋 Pencil frame ID 重用條款

**AC 原文：** AC-038-P0-INVENTORY "Footer row `Consuming routes` cell = `/`, `/about`, `/business-logic`, `/diary`"

**Issue：** inventory.md 現行 Footer 行的 "Pencil Source of truth" 欄列 `4CsvQ`, `86psQ`, `1BGtd`, `35VCj`（homepage-v2.pen）。/diary 被加入 consumer 後，讀者可能誤解「需要為 /diary 找一個 Pencil frame ID」。BQ-038-01 PM ruling 明說 `/diary` 不需要新 Pencil frame（shared Footer 的 Pencil 起源已明列），但 inventory.md 若只改 consuming routes 欄、不加註解說明 "/diary inherits Pencil provenance via shared component（BQ-038-01 ruling）"，3 個月後新加入專案的 reviewer 會困惑並可能發起反向 BQ。

**需補充：** AC-038-P0-INVENTORY 加一條：
- **And** inventory.md Footer 行加 footnote 或 "Notes" 欄：`/diary consumes shared Footer per K-038 §3 BQ-038-01 ruling — no dedicated Pencil frame; Pencil provenance inherited from 86psQ + 1BGtd sitewide one-liner.`
- **And** "Routes with NO shared chrome" section 刪除 `/diary` bullet 時，行上方加 comment 引用 K-038 ticket id。

**若不補充：** 未來維護者重複發起 BQ；本次 Sacred 退役記錄不完整。

---

### QA Challenge #8 — AC-038-P1-FAIL-IF-GATE-REMOVED dry-run scope 不清

**AC 原文：** "Engineer temporarily reverts `<Footer />` from DiaryPage.tsx as dry-run; ... dry-run is reverted before Phase 1 close; Engineer retro records stdout snippet"

**Issue：** 三個 gap：
1. **dry-run 要跑哪些 spec file？** 只跑 `shared-components.spec.ts`？還是全 Playwright suite？K-024 Phase 3 feedback_engineer_concurrency_gate_fail_dry_run 明確規定 fail-if-gate-removed 應「跑斷言直接相關的 spec subset」不跑全套。
2. **"reverts Footer" 指哪種 revert？** (a) 刪 `import Footer`（tsc 會 FAIL）、(b) 刪 `<Footer />` JSX render 但保留 import、(c) 條件化 `{false && <Footer />}`。不同選法測試到的 failure mode 不同。
3. **Engineer retro 要記什麼 stdout？** 只記 FAIL message？還是整個 test run summary？

**需補充：** AC-038-P1-FAIL-IF-GATE-REMOVED 明列：
- **Scope：** `npx playwright test shared-components.spec.ts` subset（3 個 test：T1、T4a `/app`、Footer snapshot on /diary），不跑全套
- **Revert method：** (b) 只刪 `<Footer />` JSX（保留 import；tsc 不 FAIL；純 behavioral revert）
- **Expected FAIL：** T1 `/diary` byte-identity assert FAIL + Footer snapshot baseline assert FAIL；T4a `/app` 應 PASS（不受影響，驗 `/diary` 與 `/app` 沒跨污染）
- **Retro format：** 附 FAIL message + `Expected: <normalizedHtml>` vs `Received: <non-existent footer>` 前三行

**若不補充：** Engineer 自定義 dry-run、Reviewer 深度 gate 可能放過 false-green（如沒跑到真正的 T1）。

---

### QA Challenge #9 — Sacred 退役後 K-017 / K-024 / K-034 ticket 歷史記錄追溯更新未明

**AC 原文：** §7 Retired Items Log "K-024 ticket §Sacred table gets an appended retirement line pointing here" / "K-034 ticket §7 Sacred table gets an appended retirement line pointing here"

**Issue：** §7 說 K-024 + K-034 ticket 要回寫「retirement line pointing here」，但 K-017 ticket 沒提要不要回寫。§3 BQ-038-03 表格也只說 "ticket K-017 AC text left unchanged (historical record)"。不一致：
- K-017 Sacred 原生來源 → 不回寫（AC text 不動），但歷史讀者找 K-017 AC-017-FOOTER 時如何知道已退役？
- K-024 inheritor → 回寫
- K-034 inheritor → 回寫

**需補充：** §7 Retired Items Log 加一列 K-017 處理方式：
- **Option A — 回寫 K-017**：於 K-017 AC-017-FOOTER `/diary` 負斷言區塊下方 append 一行 `> **Retired 2026-04-23 by K-038 §3 BQ-038-03** — user intent change; see K-038 ticket for new AC-038-P1-FOOTER-ON-DIARY.`。AC text 本體保留（historical record）。**推薦**：一致性，3 個 ticket 都有 retirement trail。
- **Option B — 不回寫**：僅靠 K-038 §7 table 作為唯一追溯來源。節省 K-017 不動原則，但 K-017 讀者視角殘缺。

**若不補充：** Sign-off 時 PM retrospective 會發現 retirement trail 不一致；raise meta-BQ 回流 K-038。

---

### QA Challenge — NOT RAISED（已確認在 AC 內）

以下 boundary QA pre-check pass，不列 Challenge：
- **Sticky footer / viewport-short content overlay：** shared Footer 非 sticky（`w-full` + `border-t` + `py-5` 自然 flow），DiaryPage `<main pb-24>` 已有 96px 底 padding，viewport 高 且 entries 少時 Footer 自然落在 `<main>` 下方 — 不會與 DiaryEmptyState / DiaryError 重疊。
- **SEO / GA disclosure route-specific variant：** Footer 已含 GA disclosure `<p>` 子元素，byte-identical 跨 route；/diary 自動繼承，不需要新 variant。
- **Footer accessibility landmark 衝突：** DiaryPage 無其他 `<footer>` 或 `role="contentinfo"`；`page.getByRole('contentinfo')` 斷言單一匹配 OK。
- **K-018 GA click events regression：** 如 ticket §Non-Goals 4 所述，shared Footer 已是純文字無 `<a>` 錨點；/diary 採用後無新 click 追蹤可觸發，不需 K-018 擴充。
- **K-028 Diary empty-state Sacred 衝突：** K-028 AC-028-DIARY-EMPTY-BOUNDARY 管的是 **homepage 的 diary section**（`DevDiarySection.tsx`），非 `/diary` 頁。`/diary` 採 `DiaryEmptyState` 是獨立組件；Footer 加到 `/diary` 不動 K-028。

---

**總結：**
- **Recommended additional AC / AC 強化：** 9 條（Challenge #1 / #3 / #4 / #5 / #7 / #8 / #9 各需直接補 AC 文字或 §7 table；Challenge #2 / #6 需 PM 二選一裁決 Option A/B）
- **Known Gap 候選（若 PM 選 Option B）：** Challenge #2 mobile viewport seam、Challenge #6 /diary computed-style
- **Sacred 退役無 regression risk：** 3 條退役 Sacred（K-017 `/diary` 負、K-024 `/diary` no-footer、K-034 P1 `/diary` half）與 1 條保留 Sacred（K-030 `/app` isolation）的 grep audit 無其他 hidden dependency；ticket §3 表格完整且與 spec 實際斷言 1:1 對應。K-017 AC-017-FOOTER about-page anchors 部分已由 K-034 Phase 1 另外退役，與 K-038 無交集。
- **重大發現：** 無 regression-inducing Sacred conflict；K-030 `/app` isolation 完全不動、相關 spec (`app-bg-isolation.spec.ts`、`sitewide-fonts.spec.ts` L56 /app Footer removal comment) 與本 ticket 零交集。

**PM ruling required：** 9 條 QA Challenge 逐條回覆（補 AC / 選 Option / 登 Known Gap）；完成後 Phase 0 design-locked sign-off 方可放行 Architect。

**PM ruling landed 2026-04-23:** All 9 Challenges resolved per K-034 Phase 3 AC block absorption (see heading block at top). Challenges #1/#2/#6/#9 each ruled Option A; Challenges #3/#4/#5/#7/#8 all ACCEPT with Phase 3 AC structure carrying the binding text. Cross-ref: `docs/tickets/K-034-about-spec-audit-and-workflow-codification.md` §4.4. Phase 3 Architect release still gated behind Phase 2 close (conservative sequencing per `depends-on: [K-034-phase-2-closed]`) + Designer OPTIONAL decision on `diary-v2.pen` (BQ-034-P3-02) + PM `design-locked: true` sign-off.


---

## 2026-04-23 — K-034 Phase 1 QA sign-off gap — TD-K030-03 recurrence

**沒做好：** 兩層失誤：(a) K-034 Phase 1 QA sign-off 未以 `TICKET_ID=K-034` 前綴執行 `visual-report.ts`，直接跑 `npx playwright test visual-report.ts`，落入 TD-K030-03 已知 fallback 分支，寫出 `K-UNKNOWN-visual-report.html`；(b) 寫出後 QA 未察覺檔名不符，未依 persona §Sign-off step 1 硬規則（`K-UNKNOWN output = failure, must re-run`）重跑。Persona 規則明文存在，Phase 1 QA run 靜默 bypass；兩次同類汙染（K-030 一次、K-034 Phase 1 一次）= TD-K030-03 recurrence count 2。

**下次改善：** (1) Persona §Sign-off stage step 2 後新增 post-step filename verification 硬 gate —— `ls docs/reports/K-${TICKET_ID}-visual-report.html` 必成功 AND `ls docs/reports/K-UNKNOWN-visual-report.html` 必失敗；任一違反 = sign-off BLOCKED，須清除 K-UNKNOWN 汙染後以正確 TICKET_ID 重跑 step 1。Pre-step 指示不足（已證明兩次 bypass），需 post-step 主動驗證。(2) TD-K030-03 優先級 中 → 高（recurrence count 2 觸發 escalation），下次 visual-report tooling 調整時必處理 throw-on-missing-TICKET_ID（根因修復）。本 session 已在 persona 硬 gate 層補 compensating control，但 tooling 層 fix 仍是正解。

---


## 2026-04-23 — K-034 Phase 0 (BFP Round 2 for K-035 α-premise failure)

**做得好：** 省略 — K-017 / K-021 / K-022 / K-035 全程 QA regression 皆未在結構層面挑戰 variant 軸的 Pencil-backing，無具體事件可列。

**沒做好：** `shared-components.spec.ts` K-035 一交付即 3/3 綠，但斷言契約是「DOM equivalence **modulo variant**」——variant 本身（home/about）被接受為「設計上 intentional 的分歧軸」而非須被挑戰的命題。K-034 §1.2 Pencil `batch_get` 現場證明 frame `86psQ`（/about）與 `1BGtd`（/home）為 byte-identical inline 單行（`yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn` Geist Mono 11px），Pencil SSOT 只有一份 Footer 設計，不存在兩個 variant；K-035 的 Architect α-premise（「兩個 Pencil frame 各自的設計」）在 QA 側從未被要求以 Pencil content-parity 驗證過。QA 當時的 regression 維度為 AC-per-route / visual report per page / viewport sweep / cross-route DOM equivalence (K-035 首次加入)，但 cross-route equivalence **已含內建豁免**（variant axis）—spec 本身即為 drift carrier。QA persona 既無「shared-component Playwright spec 必須對照 Pencil `get_screenshot` PNG baseline」規則，也無「code-declared variant 必須對應 Pencil-declared divergence」檢查；QA 上游仰賴 Architect design doc + Reviewer depth review 作為品質閘，兩層皆靜默 propagate α-premise，QA 未在下游獨立挑戰。

**下次改善：** （落地為 persona 硬 gate，Phase 0 由主 session Edit `~/.claude/agents/qa.md`；此處為 QA 同意的語意）(a) Q5a 硬 gate —— shared-component Playwright spec 必須以 `toMatchSnapshot()` + PNG baseline 位於 `frontend/e2e/__screenshots__/`，取代（或加成）現行 class/DOM-string 斷言；baseline 缺失時 spec 自動 fail，不得靠 `--update-snapshots` 靜默過。(b) Q5c 硬 gate —— sign-off 階段必須將 Designer 交付的 Pencil PNG（`frontend/design/screenshots/<page>-<frameid>.png`）與 dev-server PNG 做 pixel-diff（tolerance 由 Designer 在 design doc §Visual Acceptance 明列，預設 ≤0.5% RMS），任何超出 = regression fail，不得以「視覺相似」人眼判定。(c) 當 code 宣稱某組件有 N 個 variant，QA 必 grep `frontend/design/specs/` 對應頁面 JSON 驗證 N 個 variant 是否各自有獨立 Pencil frame ID + 非 byte-identical 的 content／layout／style key；若 N > Pencil divergence count，即 QA Challenge → PM（不得 sign-off）。(d) Cross-route spec 禁用「modulo variant」字樣當豁免語；divergence 必須以「frame-<idA> vs frame-<idB> 的 <key> 欄位 diff」具體列舉，沒有 frame-level 證據即 QA Challenge。

---

## 2026-04-23 — K-034 Phase 0 Early Consultation (new sitewide design workflow)

**Scope:** Challenge edge cases / boundary conditions for the new `.pen`-SSOT-via-JSON workflow being codified in Phase 0 (17-decision table Q1–Q8c). QA 角色評估所有 Q-cell 實作後 Phase 1+ 的 QA-facing 回歸風險與 sign-off gate 可行性。以下為本 Early Consultation 盤點出的 7 條 Challenge，含建議 AC 補強條文與 PM 裁決待填欄。

**Challenges (7):**

**Q1. [`.pen` ↔ specs JSON drift detection]** 當 Designer Edit `.pen` 但遺漏重生 `frontend/design/specs/<page>.frame-<id>.json`（例如忘了跑 export script、或 script 跑一半出 error 被忽略），下游 Engineer / Reviewer / QA 全部對著**過期 JSON**工作卻綠燈，drift 只能靠下一次 Designer 主動 batch_get 時才暴露。
- **建議 AC 補強**：Phase 0 新增 AC-034-P0-DRIFT-GATE：(i) `frontend/design/specs/` 目錄下每個 `*.json` 頂層 frontmatter 必含 `pen-file: <relative-path>` + `pen-mtime-at-export: <ISO-8601>` + `exporter-version: <semver>`；(ii) CI/pre-commit hook `scripts/check-pen-json-parity.sh` 對每個 specs JSON 檢驗 `stat -f %m <pen-file>` 與 `pen-mtime-at-export` 一致，不一致即 exit 1；(iii) PR template 在 `.pen` 或 `specs/*.json` 任一改動時強制列出「我已跑 export script 並確認 JSON 與 .pen 同步」checkbox。
- **PM ruling (2026-04-23):** **ACCEPT** doc-level AC → Phase 0 新增 **AC-034-P0-DRIFT-GATE**（`specs/*.json` 必帶 `pen-file` + `pen-mtime-at-export` + `exporter-version`；Designer persona 手動自查作為 Phase 0 enforcement）。Script 自動化 `scripts/check-pen-json-parity.sh` + pre-commit hook → **TD-K034-01**（Phase 0 non-blocker，待第二次 drift 事件後再自動化；現階段靠 Designer persona §Frame Artifact Export 硬 gate 人工兼顧）。

**Q2. [Playwright snapshot baseline staleness vs Pencil re-export]** Q5a 引入 `toMatchSnapshot()` 後 baseline PNG 存於 `frontend/e2e/__screenshots__/`，但 Pencil 設計變更時 Designer 交付的 `frontend/design/screenshots/<page>-<frameid>.png` 會更新，而 Playwright baseline 不會自動追上——Engineer 只要跑 `--update-snapshots` 即可「通過」而實際上 live UI 與 Pencil 早已不一致。舊 baseline 反而形同 drift 的共犯。
- **建議 AC 補強**：Phase 0 新增 AC-034-P0-SNAPSHOT-DUAL：(i) `frontend/e2e/__screenshots__/<component>-<route>.png` 與 `frontend/design/screenshots/<page>-<frameid>.png` 雙向比對為 QA sign-off 硬 gate（現行 Mandatory Task Completion Steps §0b 延伸）；(ii) QA sign-off 前跑 `scripts/compare-baselines.sh`，若 Playwright baseline hash ≠ Designer PNG hash 即 QA Challenge → PM（可能是 Pencil 改了 baseline 未重跑，也可能是 Engineer 跑 `--update-snapshots` 偷渡）；(iii) `package.json` script `test:e2e:update-snapshots` 新增 guard：只允許在 branch 名 `chore/baseline-refresh-*` 下執行，其他 branch 即 exit 1。
- **PM ruling (2026-04-23):** **DEFER** → **TD-K034-05**。理由：Phase 1 Playwright baseline 尚未建立（`shared-components.spec.ts` `toMatchSnapshot()` 是 Phase 1 deliverable），Phase 0 加 dual-baseline script 為時過早；Phase 1 QA sign-off 步驟才是實際觸發點。執行時機：Phase 1 QA 首次跑完 baseline 時，QA 同步補 `scripts/compare-baselines.sh` + `package.json` `--update-snapshots` branch-name guard，並在 qa.md 登記此 TD 已實作。Phase 0 不為此阻塞。

**Q3. [`visual-delta: none` exemption abuse]** Q7b 的 `visual-delta: none` 讓 Designer-less ticket 成為可能，但沒有結構性阻擋「Phase 2 audit-heavy ticket / 新組件 ticket」被誤標為 `none` 以求快速出貨——PM Phase Gate 若只做「frontmatter 有沒有填」的 syntactic 檢查，無法攔截語意層面的誤標。
- **建議 AC 補強**：Phase 0 新增 AC-034-P0-VISUAL-DELTA-VALIDATOR：(i) ticket template 要求 `visual-delta: none` 時必附 `visual-delta-rationale:` 欄位（單行，Example："pure backend fix, no frontend/src/** file change"）；(ii) pre-commit hook `scripts/validate-visual-delta.sh` 對 `none` ticket 跑 `git diff --name-only main..HEAD -- 'frontend/src/**' 'frontend/public/**'`，若有任何 match 即 block commit；(iii) PM Phase Gate `feedback_pm_all_phases_before_engineer` 延伸：放行前 grep ticket file `visual-delta:`，若 `none` 但 Phase 計畫出現 "new component" / "layout" / "style" / "Pencil" 字樣即降為 QA Challenge。
- **PM ruling (2026-04-23):** **ACCEPT** doc-level AC → Phase 0 新增 **AC-034-P0-VISUAL-DELTA-VALIDATOR**（`visual-delta-rationale:` 欄位強制；PM Phase Gate 人工 grep 關鍵字）。Script `scripts/validate-visual-delta.sh` + pre-commit hook → **TD-K034-02**（待第二次 `visual-delta` 事件或有人第一次提 `none` 票時再自動化；現階段 PM 人工把關）。

**Q4. [Pencil-Pencil internal drift (orphan frames / stale subtrees)]** Pencil `.pen` 本身可能含「設計意圖已經作廢但還沒刪除」的 orphan frame / 子節點（例如某 CTA block 曾被 remove 但仍存在於某 navigation map frame 裡）。Workflow 假設 Pencil SSOT 為無矛盾整體，但現實中 Designer 可能漸進重構、短暫 carry 過期 frame——任何下游從 orphan frame 生 spec 即將 dead design 當活。
- **建議 AC 補強**：Phase 0 新增 AC-034-P0-PENCIL-AUDIT-CADENCE：(i) Designer persona 加 monthly audit step：`batch_get` 所有 top-level frames、列 orphan（無 incoming reference 且無 top-level frame status）；(ii) `.pen` 新增 schema version 欄位，任何 frame 被 mark deprecated 或 deleted 時版本 bump，觸發 `frontend/design/specs/` full re-export；(iii) Ticket 若涉及 cross-frame reference (e.g. Q1 的 Footer 共用)，Architect Pre-Design Audit 必須 `batch_get` 所有被 reference 的 frame 確認非 orphan 再下刀。
- **PM ruling (2026-04-23):** **DEFER** → **TD-K034-06**。理由：目前無實證 orphan frame 導致誤設計的事件（K-035 α-premise 是「兩個 frame 內容相同」非「orphan」問題）；monthly audit cadence 尚無觸發點；`.pen` schema version 需 Pencil MCP 工具支援（非本倉決定權）。現階段 Architect Pre-Design Audit 既有 `feedback_architect_pre_design_audit_dry_run` + Pencil Frame Completeness 已涵蓋 cross-frame reference check 的最基本需求。第一次 orphan 事件發生時，TD-K034-06 升級為 Designer persona 硬 gate。

**Q5. [Cross-page regression after Phase 1 Footer unification]** Phase 1 刪除 `variant` 後 `shared-components.spec.ts` 須由 DOM-equivalence-modulo-variant 升級為**byte-identical DOM across all consuming routes**。但現行 cross-route regression 只有 Footer 一處，NavBar / Hero / BuiltByAIBanner 等其他 shared chrome 未納入；未來任何 ticket 重新引入「針對某一 route 的共用組件 variant」（e.g. `<NavBar compact />` on /app），回歸 spec 仍可能通過。
- **建議 AC 補強**：Phase 1 AC-034-P1-ROUTE-DOM-PARITY 擴充 + Phase 0 新增 AC-034-P0-SHARED-CHROME-INVENTORY：(i) `docs/designs/shared-components-inventory.md` 為 SSOT，列出全站所有 shared chrome 組件（Footer、NavBar、Hero、BuiltByAIBanner、PageHeader 等）+ 消費路由列表 + 允許的 variant（預設 0）；(ii) `shared-components.spec.ts` 為 inventory 的所有組件 × 所有路由自動生成 pairwise byte-identical 斷言；(iii) 任何 PR 引入新 variant prop 必先 Edit inventory + 得 PM 裁決 + 附 Pencil frame 證明 divergence。
- **PM ruling (2026-04-23):** **SPLIT ACCEPT** → Phase 0 收 (i) **AC-034-P0-SHARED-CHROME-INVENTORY**（`docs/designs/shared-components-inventory.md` MVP：Footer + NavBar + BuiltByAIBanner 三組件 × 路由表 + allowed-variant=0）；Reviewer persona Structural Chrome Duplication Scan 已在 K-035 入規則，此 inventory 是 source-of-truth 補位。(ii) 全 inventory × 所有路由 auto-generated byte-diff matrix → **TD-K034-03**（Phase 2 執行，或下次 NavBar/Banner drift 時觸發，arriving sooner）。(iii) 新 variant prop PR gate：PM 人工把關 + inventory Edit 即可，不需自動化。

**Q6. [CI cost of PNG snapshot + per-route byte-diff budget]** Q5a `toMatchSnapshot()` PNG baseline + Q5 所有 shared chrome × 所有路由 byte-diff 會顯著增加 CI 時間（估：現行 full Playwright suite ~3 分鐘，若 + 5 shared × 4 routes × screenshot + pixel-diff 估加 2–4 分鐘）。若無預算框架，工程 pressure 下會傾向關閉 snapshot 或 sample-only。
- **建議 AC 補強**：Phase 0 新增 AC-034-P0-CI-BUDGET：(i) `docs/reports/ci-budget.md` 記錄 full-suite 時間上限（建議 ≤8 分鐘），超出觸發 PM + Architect review；(ii) PNG snapshot **僅限** shared-components.spec.ts 啟用（頁面層級 visual report 維持 on-demand via `TICKET_ID=K-XXX npx playwright test visual-report.ts`，非 CI 常駐）；(iii) 若未來 CI 時間超預算，reduction 優先順序：viewport sweep > page visual report > shared-component snapshot（snapshot 為 Sacred）。
- **PM ruling (2026-04-23):** **DEFER** → **TD-K034-07**。理由：目前 full Playwright suite ~3 分鐘，未近預算上限；Phase 1 snapshot 僅 Footer + 3 路由，估算增量 <30 秒，無迫切性；「snapshot 為 Sacred, viewport sweep / visual report 優先裁」的 reduction policy 當作 TD-K034-07 的 landing 內容，實際預算超出才寫 `docs/reports/ci-budget.md`。現階段僅在此 ruling block 錄此 policy 作為備忘：**若 full suite >6 分鐘，先關 visual-report.ts，再關 viewport sweep，snapshot 最後才考慮**。

**Q7. [New route onboarding checklist]** 當未來新增路由（e.g. /insights、/roadmap），workflow 需保證「Pencil frame 存在 + `frontend/design/specs/*.json` 導出 + `frontend/design/screenshots/*.png` 產出 + shared-components inventory 更新」四者皆 precede Engineer 動工，否則 new route 變成 SSOT 漏洞（無 Pencil backing 即可進 prod）。
- **建議 AC 補強**：Phase 0 新增 AC-034-P0-NEW-ROUTE-GATE：(i) `docs/tickets/` template 新增「新路由 checklist」段落，列出 Pencil frame ID / specs JSON path / screenshots PNG path / inventory entry 四格，任一空即為 incomplete；(ii) PM Phase Gate 於釋出 Architect 前驗證四格皆填；(iii) Designer persona 新增「新路由 intake」流程：PM 提新路由需求時，Designer 先在 `.pen` 新增 frame + 產 specs JSON + 產 PNG + Edit inventory，再通知 PM 放行 Architect。
- **PM ruling (2026-04-23):** **ACCEPT** doc-level AC → Phase 0 新增 **AC-034-P0-NEW-ROUTE-GATE**（新路由 ticket frontmatter 四格必填；PM Phase Gate 人工驗證）。Designer persona 「新路由 intake」流程 codification → **TD-K034-04**（待第一次新路由 ticket 出現時才 codify persona，避免純假設性規則）。

**Cross-reference:** 上述 7 條 Challenge 與 K-034 PRD §4 Phase 0 Deliverables 5–7 部分重疊（Q1/Q2/Q3/Q5 已有相關 persona edit 或 memory file 預計產出），但 Deliverables 未明列 CI/pre-commit hook、inventory 文件、ci-budget 規範、new-route checklist 等**結構性 gate** ——請 PM 裁決：(a) 是否納入 Phase 0 AC（建議 Q1、Q3、Q5、Q7 全納入；Q2、Q6 建議至少以 memory file 層級落地；Q4 建議列 Phase 2 後續 TD）；或 (b) 哪些降為 Known Gap 並記 `docs/tech-debt.md`。未得 PM 明確裁決前，QA 不對 Phase 1 AC 做最終 sign-off。

**PM ruling (2026-04-23 — 綜合裁決):** 7 條 Challenge 按 doc-level vs automation-level + blocking vs non-blocking 二維切：
- **ACCEPT doc-level Phase 0 AC (4 條)**：Q1 → AC-034-P0-DRIFT-GATE；Q3 → AC-034-P0-VISUAL-DELTA-VALIDATOR；Q5 (inventory 部分) → AC-034-P0-SHARED-CHROME-INVENTORY；Q7 → AC-034-P0-NEW-ROUTE-GATE。人工把關（Designer persona 已收 Q1；PM persona 已收 Q3/Q7；Reviewer persona 已收 Q5-inventory cross-ref）為 Phase 0 enforcement。
- **DEFER 至 TD (3 條)**：Q2 → TD-K034-05（Phase 1 QA sign-off 觸發）；Q4 → TD-K034-06（首次 orphan 事件觸發）；Q6 → TD-K034-07（CI 破 6 分鐘觸發）。
- **DEFER 至 TD 的自動化 (4 條腳本)**：TD-K034-01 (drift-gate script)、TD-K034-02 (visual-delta-validator script)、TD-K034-03 (Phase 2 pairwise matrix)、TD-K034-04 (Designer new-route intake persona codification)。
- **Phase 0 增額 deliverable**：`docs/designs/shared-components-inventory.md` MVP（Footer + NavBar + BuiltByAIBanner 三組件 × 路由）為 Phase 0 必產文件，由 PM 本 session 直接產出（單檔小 doc，無需 Designer 介入）。
- **Ticket 更新**：K-034 §4 Phase 0 AC block 新增四條 AC-034-P0-DRIFT-GATE / VISUAL-DELTA-VALIDATOR / SHARED-CHROME-INVENTORY / NEW-ROUTE-GATE + 新章節 §4.1 PM Rulings；`docs/tech-debt.md` append TD-K034-01 ~ TD-K034-07 七條；四條 Q1/Q3/Q5/Q7 ACCEPT 的 AC 於 K-034 Phase 0 commit 階段視為綁定，QA Phase 1 AC sign-off 以此四條 AC 存在為先決條件（詳 K-034 §4.1 最後一段）。
- **QA Phase 1 sign-off 放行條件確認**：以上裁決 + 四條新 AC + TD-K034-01~07 + inventory doc 全部落地後，QA 即可放行 Phase 1 AC 草案至 Engineer dispatch。不需再次 Early Consultation。

## 2026-04-22 — K-035 Phase 3 QA regression

**做得好：** 全 Playwright suite 一把過 243 passed / 1 skipped / 1 failed（唯一 failure `ga-spa-pageview.spec.ts::AC-020-BEACON-SPA` 比對 K-033 tracker 症狀「SPA navigate 後 beacon count 維持 1 未增」完全相符，classify 為 pre-existing 非本票責任）；`shared-components.spec.ts` 3/3 綠 2.5 秒收工（/ variant="home" + /about variant="about" + /diary no-Footer 三向斷言 + 首 Cross-Page spec 首執行即穩定）；`ga-tracking.spec.ts` AC-018-CLICK 3 case 綠燈（contact_email / github_link / linkedin_link），Early Consultation Flag-1「GA click-event AC-visibility gap」以 spec 層面確認 trackCtaClick label 保留；Sacred 四 spec 全綠（sitewide-footer 3/3、pages.spec.ts L158 `/diary has no Footer`、app-bg-isolation AC-030-NO-FOOTER、sitewide-fonts font-mono on Footer variant="home"）；grep 掃 `HomeFooterBar|FooterCtaSection` 於 frontend/src + frontend/e2e = 0 hits，Engineer Step 6 刪除動作在 final commit 維持；visual-report.ts 以 `TICKET_ID=K-035` 跑出 `docs/reports/K-035-visual-report.html`（1.8MB；4 base64 PNG = /, /app, /about, /diary；/business-logic 依 `authRequired:true` 標 placeholder 符合 MVP 規範）；dev-server 多 viewport 手動 spot-check（375/390/414/1280）/ variant="home" Footer fontSize=11px + borderTop=1px + 文字基線一致、/about variant="about" email italic+underline + 所有 CTA href 正確、/diary + /app Sacred no-Footer（`<footer>` tag absent + `Let's talk →` absent + home-variant signature text absent）三條全滿。

**下次改善：** 第一輪多 viewport 手動 spot-check script 用 `document.querySelector('footer')` 單一 selector 驗 `/about` Footer，誤判為「exists:false」卡 1 次；根因是未事先讀 Footer.tsx 確認 variant="about" 刻意 render `<div>` 非 `<footer>` tag（design doc §10.1 已明載）。Spot-check script v2 改用 `data-testid="cta-email/github/linkedin"` + `Let's talk →` 文字 + `class` 計算樣式三條斷言才通過。行為規則：QA 跑自製 spot-check script 前，若 target 組件有多 variant / 多 render 分支，應先 Read 該組件 source 或對照 shared-components.spec.ts 的官方 selector，再挑 selector；不可假設「Footer = `<footer>` tag」這類單一假設即涵蓋全 variant。

## 2026-04-22 — K-035 Phase 3 QA Early Consultation

**做得好：** 對 Pure-refactor behavior-diff 表（design doc §3 17/0）直接跑 QA-側 AC×spec×mock 三維檢核，而非只讀 AC；mockApis fixture 確認 `/api/**` catch-all + `/api/history-info` 具體覆蓋，斷言 shared-components.spec.ts 3 cases 所需 API 已全覆蓋；對 `sitewide-footer.spec.ts`、`pages.spec.ts` L160、`app-bg-isolation.spec.ts`、`sitewide-fonts.spec.ts`、`ga-tracking.spec.ts` L212 逐一 grep 現況，確認 design doc §6 EDIT #9–#13 的 rename/comment-only edits 與斷言邏輯不變，未放掉可能殘留的「含 `FooterCtaSection` 字樣但仍斷言 literal 的地方」。對 AC-035-CROSS-PAGE-SPEC 的 §7.1 spec 契約做 selector 強度檢查，確認 `class` string 字面全等 + `getByText({exact:true})` + `data-testid` + `href` 屬性等值四者已組成充足的 DOM-equivalence contract（不需升級為 outerHTML snapshot）。

**沒做好：** GA click-event 回歸（`ga-tracking.spec.ts` AC-018-CLICK 3 個 email/github/linkedin case）在 design doc §3 diff table row 11 已宣稱 import path 與 `trackCtaClick` 呼叫保留但未在 AC-035-FOOTER-UNIFIED 的 AC 敘述裡以 And-clause 明載「GA click event 名稱（`contact_email` / `github_link` / `linkedin_link`）+ `page_location === '/about'` 不變」；僅靠現有 spec 綠燈等同於把 GA regression 藏在 ga-tracking.spec.ts 內而非明擺在 K-035 AC 上，AC-visibility 略低。依 `feedback_pm_ac_sacred_cross_check` 屬 AC↔Sacred 可並存非衝突，但若 Engineer 誤改 `trackCtaClick(label)` 的字串參數，ga-tracking.spec.ts 會 fail，但 K-035 AC 不會直接點名該失敗屬「AC-035-FOOTER-UNIFIED 違反」。

**下次改善：** Early Consultation 在純 refactor 類 ticket 做 AC 覆盖盤點時，強制檢查「既有的非本票 spec 但斷言的行為是 refactor 必須保留」→ 建議 PM 在 AC-XXX-FOOTER-UNIFIED 這類 AC 加一條 And-clause `And existing <spec-file> <AC-ID> remains green without assertion text change`，讓 AC 層面直接鎖定跨 spec 的 Sacred 行為。

---

## 2026-04-22 — K-035 Bug Found Protocol (QA)

**What went wrong (root cause):**
User found on 2026-04-22 that `/about` renders `FooterCtaSection.tsx` while `/` and `/diary` render `HomeFooterBar`. Both K-017 (AC-017-FOOTER in `about.spec.ts` L306–346) and K-022 (AC-022-FOOTER-REGRESSION in `about-v2.spec.ts` L264–280) signed off because every footer assertion was **route-local** — they asserted "Let's talk →", `mailto:` link, "Or see the source:", GitHub / LinkedIn hrefs *on `/about` only*, never compared against the footer rendered on `/` or `/diary`.

Worse, `sitewide-footer.spec.ts` (K-021) actively **codified the drift as intentional** at L10 (`/about 維持 <FooterCtaSection />（K-017 鎖定），不得渲染 HomeFooterBar`) and L88–101 (`/about renders FooterCtaSection, NOT HomeFooterBar`). A ticket-level decision ("K-017 is the About scope") was promoted into a sitewide regression assertion without anyone asking: *why does the "sitewide" footer have a one-route exception?* I treated the AC-017 boundary as ground truth and wrote a spec that pins `/about` away from the shared component — making the drift test-enforced.

Trace of "did I consider cross-page consistency when writing K-017 / K-022 specs?" — **No.** The QA regression dimensions at the time were: (1) AC-per-route visible text + style, (2) visual report per page, (3) viewport-boundary sweeps. Cross-route DOM equivalence for shared chrome (Footer, NavBar, Hero, CTA) was not a dimension. The cross-route matrix pattern *does* exist in `navbar.spec.ts` (`for (const {path, name} of pages)` loop over `/`, `/about`, `/diary`, `/business-logic`) but only asserts "NavBar links present" — not "NavBar DOM is the same shared component." The pattern was never extended to Footer, and the shape-of-assertion (presence vs equivalence) never asked "is this the same component instance on every route?"

Visual report (`visual-report.ts`) takes per-route screenshots side-by-side, but my sign-off criterion was "each screenshot looks correct for its own AC," not "Footer crop on `/about` is pixel-equivalent to Footer crop on `/`." FooterCtaSection and HomeFooterBar are *both* valid footers in isolation — only cross-page comparison surfaces the drift, and that comparison step was missing from the sign-off checklist.

**What went well:** Omitted — no concrete QA behavior in K-017 / K-022 caught any part of this class of defect; claiming otherwise would be fabrication.

**Next time improvement:**

1. **Add `frontend/e2e/shared-components.spec.ts`** with the following hard assertions:
   - `Footer`: on `/`, `/about`, `/diary` — assert `page.locator('footer').innerHTML()` (or normalized `innerText`) is **equal across all three routes**. Use one route as canonical reference (`/`), compare others against it. A new route rendering its own inline footer → fails automatically without spec edits.
   - `NavBar`: on `/`, `/about`, `/diary`, `/business-logic` — assert `page.locator('nav').outerHTML()` modulo the single `aria-current="page"` attribute (which legitimately varies per route). Everything else must be byte-identical.
   - `BuiltByAIBanner` (if rendered on ≥2 routes): same innerHTML equivalence pattern.
   - Structure the spec so that adding a new route to the routes array is the *only* edit needed when the project adds `/foo`; the assertion body must not be per-route.

2. **Delete the "`/about` maintains FooterCtaSection" assertion in `sitewide-footer.spec.ts` L88–101** once Phase 3 lands. A sitewide spec pinning one route *away* from the sitewide component is a drift-preservation anti-pattern — the spec itself enforced the bug.

3. **Hard step to append to `~/.claude/agents/qa.md`** (under `## Test Scope (general framework)` → new subsection `### Cross-Page Shared-Component Consistency (mandatory when project has ≥2 routes rendering the same chrome)`):

   ```
   Every shared chrome component (Footer, NavBar, Hero, PageHeader, CTA block, banner) 
   that renders on ≥2 routes MUST have a `frontend/e2e/shared-components.spec.ts` 
   (or equivalent) that asserts DOM / innerText equivalence across ALL routes 
   rendering it. Per-route presence assertions ("NavBar visible on /about") are 
   insufficient — they pass when the route renders a duplicate inline copy with 
   matching text.
   
   Required assertion pattern: capture reference route's component outerHTML/innerText, 
   compare every other consuming route against the reference. Route-specific variations 
   (aria-current, active link highlight) are allowed only as explicit modulo-X exceptions 
   in the spec comment.
   
   Audit trigger for existing tickets: before QA sign-off on any ticket touching a 
   shared chrome route, grep `frontend/e2e/` for a spec file that asserts 
   cross-route equivalence of the component being changed. None found = QA sign-off 
   withheld, PM escalation required (not a "nice to have" — a hard gate).
   
   Drift-preservation anti-pattern: if an existing sitewide spec contains a 
   "route X renders <LocalComponent>, NOT <SharedComponent>" assertion, that is a 
   red flag, not an AC. Flag to PM immediately as a cross-role drift, do not treat 
   the assertion as ground truth.
   ```

4. **Hard step to append to `~/.claude/agents/qa.md` under `## Mandatory Task Completion Steps`** (new step 0.5, before Pencil comparison):

   ```
   0.5. **Cross-route shared-component equivalence check (mandatory when ticket 
   touches any route that renders a shared chrome component):**
   For each shared component on the affected route, run the Playwright 
   `shared-components.spec.ts` subset. Any FAIL (cross-route DOM divergence) = 
   do NOT declare PASS, file back to Engineer with route-diff in the bug report. 
   Sign-off based on per-route AC pass + per-route visual report is insufficient — 
   K-035 2026-04-22 proved 5 roles × 2 tickets can miss Footer drift when 
   cross-route equivalence is not a regression dimension.
   ```

---


## 2026-04-23 — K-037 Favicon Wiring Final Sign-off (post-Code-Review, post-Engineer-commit-pending)

**做得好：** 三閘門機械驗證順序清晰 — (1) 完整 Playwright suite 257 passed / 1 skipped / 1 failed，唯一紅燈 `AC-020-BEACON-SPA` 透過 grep 確認是 `ga-spa-pageview.spec.ts` 檔案 L143 註解明文標註「K-033 TRACKER — currently RED on purpose」的預期紅，非 K-037 回歸；(2) favicon 獨立 suite 16/16 全綠（8 asset-200 + 6 link-tag + 1 manifest schema + 1 MIME accept-list）完全對齊 AC-037 四條可測 AC 結構；(3) 機械 AC-037-TAB-ICON-VISIBLE curl grep 驗證（rel="icon"×4 + apple-touch-icon×1 + manifest×1 + theme-color×1）全部吻合期望值，且 theme-color meta content `#F4EFE5` 與 manifest.json `theme_color` byte-for-byte 一致（Architect §3 binding contract #5 達成）。Sacred invariant 交叉比對零衝突 — K-037 scope 僅 `<head>` + `public/` + playwright config 三層（git diff --stat 確認 index.html +7 / playwright.config.ts +41-9 / diary.json +6），未觸及 K-028/K-035/K-021/K-024 shared chrome surfaces。Engineer 回報的 `diary-page T-L1` timing flake 本次 full-suite 未重現，與 Engineer retro「isolated re-run green」敘述一致（timing 類 flake 本質）。Visual report `TICKET_ID=K-037` 正確產生於 `docs/reports/K-037-visual-report.html`（1.8MB，5 captures），並主動清除先前 full-suite run 產生的 `K-UNKNOWN-visual-report.html` 殘檔，避免下游污染。

**沒做好：** Playwright project-split 架構（`chromium` + `favicon-preview` + `visual-report` 三 project）首次出現，QA 未在 Early Consultation 時預先確認「full-suite 呼叫 `npx playwright test` 不帶 --project 參數是否會自動跑 favicon-preview 與 visual-report」— 實際行為是三 project 全跑（favicon 16 + visual 5 + chromium 核心），總數因此跳升到 257，與 Engineer pre-commit baseline 的 256 + 16 = 272 預期不完全一致（差異來自 visual-report 被無意間觸發 + 1 個 diary-page flake 未重現）。事後對照 playwright config 可推出（無 --project filter 時跑所有 project），但若 QA 在 Early Consultation 階段就預審 config 三 project 結構並書面化「full-suite 預期總數＝X（含 visual-report auto-run）」，可避免 sign-off 當下的瞬間困惑。另：mobile Safari iOS / Android Chrome 實機 tab icon 渲染仍為 ticket 內明示 Known Gap（AC-037-TAB-ICON-VISIBLE 條款），本次 sign-off 無法覆蓋 — 依賴 PM close-time 與 user 在真實裝置做側邊比對，非 QA 可機械驗。

**下次改善：** Early Consultation 階段若 Engineer 計畫引入新 Playwright project（測試隔離/附加 webServer/多 baseURL 等），QA 必須書面產出「full-suite invocation matrix」表格（欄：`npx playwright test` / `--project=X` / `<spec-file>`；列：三 project 是否會被觸發；格：預期 test count）貼回 ticket Release Status，作為 sign-off 時對照基線。本次 K-037 回溯補 matrix：`npx playwright test` = chromium(236) + favicon-preview(16) + visual-report(5) = 257 total（1 skipped 在 chromium 核心，屬既有 K-033 tracker）；`npx playwright test favicon-assets.spec.ts --project=favicon-preview` = 16；`TICKET_ID=K-037 npx playwright test --project=visual-report` = 5。已 codify 至 `~/.claude/agents/qa.md` §Mandatory Task Completion Steps — 新增「Step 0c: multi-project playwright config invocation matrix pre-flight」，當 `playwright.config.ts` 出現 ≥2 project 時必備。

## 2026-04-22 — K-025 Final Sign-off (post-Code-Review)

**做得好：** 三閘門串行驗證（tsc exit 0、`npm run build` exit 0、full Playwright suite 192 passed / 1 skipped / 0 failed、navbar.spec.ts 22/22）完全對齊 Engineer 實作回報；AC-025-NAVBAR-TOKEN 額外做 `grep -nE '#[0-9A-Fa-f]{6}' UnifiedNavBar.tsx` 並逐行驗證僅剩 L18–19 註解塊（K-017 legacy provenance 文字），runtime class literals 零 hex，未盲信 Engineer 宣稱。W-1 (TD-K025-01) PM 裁決 TD 入帳而非 sign-off blocker，因 behavior-diff truth table + dual-rail aria-current/computed color 斷言已獨立證明等價，CSS declaration grep 為冗餘 proxy 而非唯一證據。
**沒做好：** 本票 visual verification 依 ticket frontmatter `visual-spec: N/A` + zero rendered-color change 豁免（SCHEMA.md §L124），未開 dev server 做全路由目視 — 對 zero-visual refactor 而言合理但仍屬 coverage 選擇；若未來有 NavBar class 同時跨 active/inactive/hover 三態的改動（非本票 scope），純 computed color 無法覆蓋 hover pseudo-state。
**下次改善：** Sign-off 輸出強制段落化（Verdict / Evidence / Known Gap / Next-ticket-watch）於 persona `qa.md`「Mandatory Task Completion Steps」下加一條模板範例，避免未來 final sign-off 只寫結論不寫證據數字；並在 refactor 類 ticket sign-off 增列「hover/focus pseudo-state 未覆蓋」作為 Known Gap 顯式標示，不靠讀者自行推斷。

---

## 2026-04-22 — K-025 Early Consultation

**做得好：** Pre-Architect gate 即完成三題 Q1/Q2/Q3 審查，提前鎖定 refactor behavior-equivalence 風險（Tailwind arbitrary-value vs token compile 差異）、aria-current attribute-only selector 的視覺盲點、`/business-logic` route 覆蓋 gap；Q2 建議雙軌斷言（aria-current + computed color `rgb(156,74,59)`）而非單純保留 class regex，避免 refactor 後測試僅驗屬性不驗顏色渲染。
**沒做好：** 諮詢時 spec 裡仍殘留「`toHaveClass(/text-\\[#1A1814\\]/)` 同時命中 active `/60` 變體 + inactive 兩種狀態」的寬鬆 regex（L178、L204），K-021 放行時未挑出，導致 K-025 本票 selector 遷移前 regression baseline 本身不嚴格；早期 consultation 第一次看到該 spec。
**下次改善：** 未來 pre-Architect QA consultation 必含一步「baseline spec grep」— `grep -E 'toHaveClass\(/' frontend/e2e/<target>.spec.ts` 列所有 class regex 斷言，逐條檢查 regex 是否唯一命中目標 state（不會跨 active/inactive 同時匹配），有歧義先回 PM 要求 AC 升級為 aria-current + computed color 雙軌，再進 Architect。

---

## 2026-04-22 — K-029 Regression Sign-off

**What went well:** Independent full-suite re-run (197 pass / 1 skip / 0 fail) matched Engineer's report; stale K-UNKNOWN-visual-report.html caught + deleted pre-run per K-028 memory; all 4 K-029 testids (arch-pillar-body / arch-pillar-layer / ticket-anatomy-body / ticket-anatomy-id-badge) verified present + exclusive (zero class-selector fallback for tested components); KG-029-01 closed cleanly.

**What went wrong:** Pencil MCP tool surface not granted to QA agent — forced source-grep fallback for parity verification instead of direct .pen visual diff. Reduces parity confidence to "source palette matches spec" (indirect proxy) rather than "design canvas matches render" (direct).

**Next time improvement:** PM/main-session grant mcp__pencil__batch_get + mcp__pencil__get_screenshot to QA persona tool surface before sign-off rounds on UI tickets, so §0b Pencil parity is first-class, not fallback. Codify in qa.md §0b: "if pencil MCP missing from tool grant, BLOCK sign-off and request tool-grant from PM before proceeding" (currently §0b only handles MCP-server-down, not MCP-tool-not-granted case).


## 2026-04-22 — K-020 Regression (full Playwright E2E sign-off)

**What went well:** Full-suite run (200 tests discovered) landed exactly on the shape agreed in Early Consultation + design §3.1 — 198 pass / 1 skip / 1 fail, where the lone fail is the intentional K-033 tracker (`AC-020-BEACON-SPA`) carrying the PM-ruled C-1 doc-block above it. No pre-existing spec regressed; the 9 new tests in `frontend/e2e/ga-spa-pageview.spec.ts` match design §3.1 one-for-one. AC coverage mapping verified per spec: AC-020-SPA-NAV ×2 green, AC-020-BEACON-INITIAL / PAYLOAD / COUNT green, AC-020-NEG-QUERY / NEG-HASH / NEG-SAMEROUTE green, AC-020-BEACON-SPA red-on-purpose with visible K-033 TRACKER explainer in-source.

**What went wrong:** Pencil MCP fallback policy triggered — `mcp__pencil__get_screenshot` not invoked because K-020 is a pure test-addition ticket (no production code, no UI delta, no `.pen` associated). Per persona the visual comparison is only mandatory when the ticket has a `.pen` design; still, I should be explicit that the visual layer is intentionally skipped rather than silently omitted. Also: `visual-report` run inside the full-suite call printed `TICKET_ID not set, output will be K-UNKNOWN-visual-report.html` — fine for this test-only regression where visual report isn't required, but a generic reminder that the screenshot wrapper needs `TICKET_ID=K-020` when a visual deliverable is expected. No rule was violated on this ticket because the task instruction explicitly waived per-test screenshots; logging so future test-only tickets inherit the same explicit waiver language.

**Next time improvement:** When QA sign-off is a test-only / no-UI-delta ticket, declare in the verdict block "visual layer N/A — no production code change, no `.pen` delta" instead of silently omitting the Pencil comparison step. This makes the Known Gap explicit and matches the persona rule that unstated omissions don't count as sign-off. If any future test-only ticket also introduces even one UI-touching line, revert to full Pencil comparison.


## 2026-04-22 — K-020 Early Consultation (real Agent(qa) run — independent pass)

**Context:** Independent QA Early Consultation invoked by PM for K-020 (GA4 SPA Pageview E2E hardening) following the PM-simulated pass earlier this session. Scope: read ticket K-020 + PRD + `frontend/src/utils/analytics.ts` + `frontend/src/hooks/useGAPageview.ts` + `frontend/e2e/ga-tracking.spec.ts` + `frontend/playwright.config.ts`, probe AC for boundary / edge-case / race-condition gaps. PM pre-decided: BQ-1 resolved to `page.route()` intercept; AC-020-SPY-PATTERN removed.

**Testability review:**
- AC-020-SPA-NAV → ⚠️ Testable but incomplete — click-delta guard present, but beacon payload key not pinned (which of `page_path`, `page_location`, `page_title`, `dl`, `dp` on `/g/collect` query?), same-route / query-only / hash-only navigation behavior undefined, init-vs-SPA timing race for `page.route()` registration undefined.
- AC-020-BEACON → ⚠️ Testable but incomplete — "URL + query" is vague; missing concrete required keys; no assertion that the beacon count matches pageview count (silent over-firing or double-fire undetectable); `page.route()` cleanup on failure unspecified.

**QA Challenges raised (11):**

**Blocking (Architect cannot design without PM ruling):**

1. **QA Challenge #5 — AC-020-BEACON beacon payload keys unpinned.**  
   Issue: AC says "URL query string contains `en=page_view`" but does not enumerate which payload keys constitute a valid pageview beacon. `/g/collect` carries `tid` (measurement ID), `dl` (document location / full URL), `dp` (document path), `dt` (title), `en` (event name), `v=2` (GA4). Asserting only `en=page_view` accepts a beacon that drops `dl` or points at the wrong path — that is precisely K-018 class of silent-drop bug moved one layer down.  
   Needs supplementation: AC must specify required keys — recommend `v=2` AND `tid=G-TESTID0000` AND `en=page_view` AND (`dl` contains `/about` OR `dp=/about` — which one depends on gtag.js version, must be verified in dry-run).  
   If not supplemented: BEACON test will pass on a partial/corrupt beacon, defeating the purpose.

2. **QA Challenge #6 — AC-020-SPA-NAV and AC-020-BEACON do not cross-verify.**  
   Issue: Phase 1 asserts dataLayer has a new entry after SPA navigate; Phase 2 asserts initial `/` load produces one `/g/collect` beacon. Neither AC asserts **SPA navigate produces a new `/g/collect` beacon**. This is the exact K-018 failure mode: `gtag('event', 'page_view', ...)` called but beacon never sent. If the helper internal implementation drifts (e.g. future refactor breaks the Arguments-object push), SPA-NAV will pass (dataLayer entry present) but no beacon leaves the page. AC currently has no test that catches this at the SPA layer.  
   Needs supplementation: Add a third AC or extend AC-020-BEACON with a second test case — NavBar click to `/about` → `page.waitForRequest(/\/g\/collect/)` captures a second beacon whose path-key points to `/about`. BQ-3 in ticket alludes to this race but punts it ("Phase 2 初版只要求初始 load"). Punting it removes the only defense against K-018 shape drift in the SPA path.  
   Recommendation: do NOT defer. Add as hard AC.

3. **QA Challenge #7 — Same-route / query-only / hash-only navigation behavior undefined.**  
   Issue: `useGAPageview` depends on `[location.pathname]`. Therefore:  
   (a) `/` → `/` click (user clicks same-page link): `location.pathname` unchanged → `useEffect` does not re-fire → no pageview. Expected? AC silent.  
   (b) `/?x=1` → `/?x=2` (query-param-only change): `pathname` unchanged → no pageview. Expected?  
   (c) `/#foo` → `/#bar` (hash-only change): `pathname` unchanged, React Router may or may not remount depending on `BrowserRouter` vs `HashRouter` → no pageview. Expected?  
   These are live user flows (tab click that points to current route, filter query changes, in-page anchor). AC and implementation silently disagree on (a)/(b): GA4 Measurement Protocol guidance says pageview should fire when `page_location` changes (location includes query). Current impl does NOT fire on query change — either a bug to be fixed (change hook dep to `location`) or intentional behavior to be documented.  
   Needs supplementation: PM must rule — for each of (a)/(b)/(c), fire or not fire? Then AC must encode the ruling (at minimum one negative-case test: "query-only change does NOT push new dataLayer entry" if the ruling is "don't fire"; otherwise fix the hook + add positive test).

**Non-blocking (Architect can design but must handle in design doc):**

4. **QA Challenge #8 — Back/forward navigation not covered.**  
   Browser back from `/about` to `/` and forward to `/about` again should each fire pageviews (standard GA4 expectation). React Router pushes popstate → pathname change → hook fires. Current AC only tests forward click; back/forward untested. Edge case recommendation: Architect adds a third SPA-NAV case (back button from `/about` fires pageview to `/`). Not blocking; can be Known Gap if PM rules scope.

5. **QA Challenge #9 — Rapid sequential navigation race.**  
   A → B → C within <100ms: three pageviews or coalesced? `useEffect` on `pathname` is synchronous per-render, so three renders = three effect runs = three `trackPageview` calls = three beacons. gtag.js may batch/debounce at the beacon layer. AC silent. Known production risk: rapid NavBar clicks (double-tap on mobile) firing duplicate beacons inflates GA4 user/session counts. Architect dry-run should measure.

6. **QA Challenge #10 — Test isolation: `page.route()` cleanup on failure.**  
   If AC-020-BEACON test throws mid-assertion (e.g. beacon query malformed), does the route handler leak into the next test in the file? Playwright `page.route()` scope is per-page, so `page.close()` cleans it, but `test.afterEach` explicit `page.unroute()` is safer. Specify in Architect design doc: "all `page.route('**/g/collect')` handlers must register in `test` body and rely on per-test page fixture teardown; no shared `test.beforeAll` route registration." — otherwise flake on CI parallel runs.

7. **QA Challenge #11 — Beacon count assertion missing.**  
   Even with correct `en=page_view`, nothing asserts that **exactly one** beacon fires per pageview. A future impl bug that fires the event twice (e.g. StrictMode double-invoke in dev, or someone adds a second `trackPageview` call) will pass current AC. Recommendation: Phase 2 test counts beacons between click and next assertion checkpoint and asserts `=== 1`.

8. **QA Challenge #12 — Invalid measurement ID `G-TESTID0000` dry-run (covered in ticket as Challenge #3).**  
   Already flagged by PM-simulated pass as Architect dry-run item. Reaffirm: gtag.js may refuse to fire `/g/collect` for syntactically malformed IDs. If dry-run shows no beacon fires, Phase 2 is un-implementable with current playwright.config env; need either real test ID or to accept that Phase 2 runs only against `G-` pattern + non-existent ID (possible — GA4 client-side validation is loose, but confirm).

9. **QA Challenge #13 — Navigation type: NavBar Link vs BuiltByAIBanner CTA vs programmatic `navigate()`.**  
   AC names two entry points. Third (programmatic: e.g. a future redirect-on-success-calls `navigate('/app')`) exists in the codebase — any component calling `useNavigate()` hits the same `useLocation()` reactive path, so the test logic is invariant. Recommendation: state explicitly in design doc that NavBar + BuiltByAIBanner cover all human-trigger entry types and that programmatic `navigate()` is considered equivalent (no separate test). Non-blocking — just document.

10. **QA Challenge #14 — BuiltByAIBanner target route.**  
    Current AC-020-SPA-NAV says both cases go `/` → `/about`. BuiltByAIBanner CTA indeed points at `/about` (confirmed via `a[aria-label="About the AI collaboration behind this project"]` in K-018 spec line 166). Two test cases testing the same route transition with different triggers is a weak test matrix. Recommendation: let NavBar test `/` → `/about` and BuiltByAIBanner test a different target if it exists, OR explicitly accept that the two cases are near-duplicates because the goal is to prove "different DOM entry points both reach the hook". Non-blocking — PM already rationalized this in AC wording, just make it explicit in the test comment.

11. **QA Challenge #15 — `page_location` value semantics.**  
    Impl `useGAPageview.ts:17` passes `location.pathname` (e.g. `/about`) as `page_location` — but GA4 Measurement Protocol convention is that `page_location` is the **full URL** (`https://host/about?q=...`), and `page_path` is the path. Helper is sending path-as-location. This works for funnel analysis on simple sites but is a semantic bug. Current AC pins `page_location: '/about'` which **codifies the bug**. Flag to PM: is this intentional (simplification) or a bug to fix now? If fix now, AC must change. Non-blocking for K-020 scope but user should know.

**What went well:** Caught that both AC-020-SPA-NAV and AC-020-BEACON individually have click-delta / throw-on-fail guards but neither enforces the K-018-specific invariant "SPA navigate → new `/g/collect` beacon leaves the page" — which is the exact bug class the ticket was created to prevent. This is a hole. Also surfaced that `useGAPageview`'s `[location.pathname]` dep array causes query-only changes to be silently ignored, an undocumented behavior that AC codifies by omission.

**What went wrong:** PM-simulated pass earlier today caught 4 challenges but missed these 11, including the scope-defining hole (#6 SPA → beacon cross-verify). Simulation from the PM seat lacks the adversarial posture QA role requires — PM-simulated review tends to validate existing design rather than stress-test it. This justifies the ticket's `§Release Status` row flagging "Agent(qa) required" as a real blocker, not a procedural formality.

**Next time improvement:** When K-018-class ticket (production bug retrofit) is created, QA Early Consultation must map "original bug manifestation" → "which AC directly catches it" as a concrete table. For K-020 the bug was "gtag call succeeded but beacon never sent" — AC-020-BEACON covers it for initial load, nothing covers it for SPA navigate. A bug-mapping table would have made this omission visible on first read. Codify in qa.md Early Consultation protocol.

---

## 2026-04-22 — K-020 Early Consultation (self-retrospective on the consultation itself)

**What went well:** Independent read of implementation before reading the ticket surfaced the `[location.pathname]` dep array gap (Challenge #7) and the `page_location`-as-pathname semantic issue (#15) — these would have been invisible if starting from AC text alone. Cross-referencing K-018 retro ("mock/production override order") with the current `addInitScript` pattern in `ga-tracking.spec.ts:34` confirmed BQ-2's premise is sound.

**What went wrong:** Initial scan did not immediately spot Challenge #6 (SPA → beacon cross-verify missing) — it only surfaced after building the challenge list and cross-checking against the ticket's stated goal ("E2E against production GA4 pipeline"). Reading AC in order instead of mapping AC to failure modes allowed the hole to hide.

**Next time improvement:** For any "E2E hardening" or "production bug regression test" ticket, start Early Consultation with a 2-column table — rows = historical bug modes from the linked ticket's retro, columns = AC covers / AC does not cover. Do this BEFORE reading AC line-by-line. If any row has no column checked, that is a blocking gap.

## 2026-04-22 — K-020 Early Consultation (PM-simulated, Agent tool unavailable)

**Context:** PM re-plan session for K-020 (GA4 SPA Pageview E2E). Session lacked Agent tool → could not spawn real `qa` sub-agent; PM executed Early Consultation by reading `~/.claude/agents/qa.md` §Early Consultation protocol + deep inspection of `frontend/src/utils/analytics.ts`, `frontend/src/hooks/useGAPageview.ts`, `frontend/e2e/ga-tracking.spec.ts`, `frontend/playwright.config.ts`. Explicitly disclosed as simulation in ticket §Release Status — user may require a real Agent(qa) pass before Architect release.

**Testability review:**
- AC-020-SPA-NAV → ✅ Testable after wording fix (original AC used GTM dataLayer `{event, page_location}` object shape; production pushes `Arguments` object with index-based access — corrected)
- AC-020-BEACON → ⚠️ Needs supplementation — CI network policy unresolved (no `.github/workflows/` in repo)

**Challenges raised (4):**
1. AC-020-BEACON CI egress unknown → **supplemented to AC** (added "test must throw on timeout, not skip")
2. AC-020-SPA-NAV initial-load pageview entry interferes with click assertion → **supplemented to AC** (added "record dataLayer.length before click, assert new entry points to `/about` after")
3. AC-020-BEACON fake `G-TESTID0000` — does gtag.js fire beacon for invalid IDs? → **deferred to Architect dry-run** (must verify in design doc §Dry-run)
4. Arguments-object type narrowing → **no AC change**, noted for Architect (use existing `IArguments` cast pattern from K-018 spec)

**What went well:** Surfaced 2 AC-level defects (wrong dataLayer shape wording; no click-delta guard) before Architect took the ticket — Phase 1 would have false-passed on the initial `/` pageview entry otherwise. Identified that `ga-tracking.spec.ts:34` `addInitScript` mock is overwritten by production `initGA()` at module load, confirming K-018 retro's "mock/production override order" lesson and making BQ-2's recommendation (drop addInitScript mock, read real dataLayer) concrete.

**What went wrong:** Could not run real Agent(qa) — PM simulating QA loses the independent-perspective value of the role; risks blind spots (e.g., Playwright version-specific `waitForRequest` behavior, edge cases QA would know from regression history). Disclosed in ticket as Known Gap pending user decision.

**Next time improvement:** When PM session lacks Agent tool, block release at §Release Status with an explicit "BLOCK: Agent(qa) required" row rather than proceeding with simulation; only simulate when user has pre-authorized. Codify in `pm.md` §PM session capability pre-flight — already present since 2026-04-21 K-030; enforce "explicit user authorization" clause this session (done: ticket surfaces decision back to user).


## 2026-04-22 — K-029 Early Consultation (verified by qa subagent)

**What went well:** Main session called real qa subagent to re-verify PM-simulated consultation, closing the capability-gap workaround from earlier this session. Findings differed from simulated on 2 of 7 challenges + 1 AC testability issue PM had accepted, confirming value of running the real agent.

**Divergences from simulated (acted on):**
- C3 (selector stability): simulated declared Known Gap with Engineer discretion; verified flagged this contradicts existing about/ testid convention (DossierHeader, FooterCtaSection already use data-testid) — upgraded to Architect design-doc mandate with 4 prescribed testid names (arch-pillar-body / arch-pillar-layer / ticket-anatomy-body / ticket-anatomy-id-badge).
- C6 (pyramid layer span text-ink): simulated left `<li>` detail under 3-token allow-list; verified flagged hierarchy inversion risk (if Engineer picks text-ink for both `<li>` and layer span, the "label more prominent than detail" intent collapses since child==parent) — AC tightened to pin `<li>` detail at text-muted fixed.
- AC "at least one" clause: simulated accepted (and even main session's initial post-PM review agreed); verified showed Engineer could pick a color outside BOTH allow and disallow lists (e.g. text-blue-600) — passes disallow, and only 1 of 3 cards needs allow match, so 2 cards with wrong color slip through. Tightened to "三個皆須命中 allow-list".

**Confirmed (no action):**
- No `darkMode` in tailwind.config + no `dark:` classes — PM's "no OS dark-mode boundary" claim VERIFIED.
- K-022 `about-v2.spec.ts` L195 uses `getComputedStyle` + exact RGB — canonical pattern for K-029 to follow.
- No K-022 spec asserts `text-gray-*` or `text-purple-*` on these components — AC-029-REGRESSION safe, no existing spec breakage.
- Scope = 2 files (7 sites) — grep re-confirmed.
- CardShell inheritance neutral on text color.

**Borderline observation (recorded, no action):**
text-muted on paper at 12px (text-xs) = 4.84:1 contrast — passes WCAG AA 4.5:1 but near the floor. If future font weight reduces perceived contrast, revisit.

**Known Gap reframed:**
**KG-029-01** — Playwright selector path: Architect design doc prescribes data-testid names; Engineer implements per doc; QA sign-off verifies compliance. (No longer speculative stability concern.)

**What went wrong (capability-gap root cause):** PM subagent lacks Agent tool → initial consultation was PM self-review of PM-authored AC, with inherent blind spots. 3 of 7 challenges needed correction once real adversarial review ran. Confirms `feedback_pm_session_capability_pre-flight` is structural, not per-ticket; user/main session must call real qa subagent for Early Consultation when PM subagent cannot spawn one.

**Next time improvement:** When main session hands off to PM subagent and flow requires QA Early Consultation, main session (which has Agent tool) should call qa subagent FIRST and feed the consultation findings into PM's handoff prompt — don't rely on PM simulation as the primary path. Simulation is fallback only when main session itself is unavailable. Codify in future PM release: "QA Early Consultation must come from qa subagent (not PM simulation) whenever main session has Agent tool available."

---

## 2026-04-22 — K-029 Early Consultation (AC testability + palette contrast review)

**DISCLOSURE:** This consultation was simulated by the PM subagent because the current PM session has no Agent-tool access to spawn qa subagent. Per persona §PM session capability pre-flight + memory `feedback_pm_session_capability_pre-flight`, PM proceeded with explicit disclosure. Upon next K-029 QA sign-off the actual qa subagent will re-verify this consultation's findings; any missed boundary at sign-off = gap to be logged back here.

**What went well (simulated QA review):** PM-driven scope scan via `grep -rn "text-gray-\|text-purple-\|text-blue-" frontend/src/components/about/` confirmed dark-theme residuals exist only in `ArchPillarBlock.tsx` (3 sites: body div / pyramid li / pyramid layer span) and `TicketAnatomyCard.tsx` (4 sites: body div / Outcome span / Learning span / ticket ID badge). RoleCard + MetricCard + PillarCard + FooterCtaSection already on paper palette — no additional scope. WCAG AA contrast on paper `#F4EFE5`: text-muted `#6B5F4E` ≈ 4.84:1 (passes AA for body), text-charcoal `#2A2520` ≈ 11.9:1 (AAA), text-ink `#1A1814` ≈ 13.5:1 (AAA). All three palette tokens clear AA for `text-xs` body. No dark-mode / OS-preference boundary — body is hard-pinned `bg-paper`.

**Challenges raised (and resolution):**
1. **AC phrasing "可讀深色" / "或更深" ambiguous** — `deeper` in color space not deterministically verifiable. → **Supplement AC**: replace with explicit allow-list (text-ink / text-charcoal / text-muted RGB) + explicit disallow-list (gray-300/400/500 + purple-400 RGB). PM will patch AC-029-ARCH-BODY-TEXT + AC-029-TICKET-BODY-TEXT.
2. **Ticket ID badge semantic color BQ** — PM-002 asks `text-charcoal` vs `text-muted`. → **PM rules text-charcoal** (see ticket §Architect Pre-check decisions): badge is an identifier / metadata label (Geist Mono mono-weight), not body prose; token table assigns `charcoal` to "次文字 / 輔助元素" — exactly this role. `text-muted` is for Footer / meta / NavBar non-active per architecture.md L453. text-charcoal also gives AAA contrast, preserving the "prominent identifier" visual weight the original `text-purple-400 font-bold` was trying to achieve.
3. **Playwright selector stability** — ArchPillarBlock + TicketAnatomyCard have no `data-testid`; new color assertions must anchor via section heading descent (fragile if Section reshuffles). → **Known Gap declared (KG-029-01)**: Engineer may add `data-testid="arch-pillar-body"` / `data-testid="ticket-anatomy-body"` + `data-testid="ticket-anatomy-id-badge"` at implementation time for stable assertion, OR anchor via `section:has(h2:has-text("Project Architecture"))` + descendant. Not AC-required; Engineer discretion. QA at sign-off will verify whichever path was taken produces stable selectors.
4. **Regression: new computed-color spec vs existing K-022 about-v2.spec.ts** — K-022 spec exists; AC-029 requires extending with color assertions or new K-029 spec. → Engineer task; Architect must explicitly state in design doc which spec file the new assertions go into. Not AC-blocking.
5. **Cross-component consistency (K-022 A-12 scope completion)** — Grep confirms no other `/about` components carry dark-theme residuals. Architect Pre-check item 3 resolved.
6. **testing pyramid `<span>`** — currently `text-gray-300` on font-mono. Per Pre-check: Architect decides between `text-charcoal` (prominence, matches layer label treatment in PillarCard per PillarCard.tsx L22-L25 `text-paper` on `bg-charcoal`) or `text-ink` (direct tonal match with body). → **PM rules text-ink** for the layer span (same as body treatment; avoids visual hierarchy conflict with the bold sibling li). Documented below.
7. **CardShell border/bg isolation** — PillarCard pattern confirms `CardShell` neutral on text color; children drive their own. No inheritance surprise.

**Supplement to AC (PM will patch):**
- AC-029-ARCH-BODY-TEXT Then/And rewritten with explicit RGB allow/disallow lists.
- AC-029-TICKET-BODY-TEXT Then/And rewritten with explicit RGB allow/disallow lists.
- AC-029-REGRESSION unchanged.

**Known Gap declared:**
- **KG-029-01** — Playwright selector stability for new color assertions: no `data-testid` mandated in AC; Engineer may introduce testids or use structural anchors. QA sign-off will confirm chosen path.

**Next time improvement:** If future PM session lacks Agent-tool access, escalate to user to re-spawn main session with full capabilities BEFORE starting BQ resolution. This session accepted the capability gap and mitigated via explicit simulation disclosure, but the upstream fix is session permission hygiene (see memory `feedback_pm_session_capability_pre-flight`).

## 2026-04-22 — K-024 Phase 3 final sign-off

**What went well:** Full regression + Phase 3 sign-off gate completed cleanly on the R2 fix-batch commit 3201622 — tsc 0, Vitest 81/81, Playwright 224 pass / 1 skipped / 0 fail (225 total; +1 from T-C6 mobile hidden-asserts vs Phase 1+2 baseline of 190). All 21 Sacred-bearing tests (K-017 NavBar + K-021 body-paper / fonts + K-023 DevDiarySection marker 20×14 borderRadius 0 + K-028 entry-wrapper 3-marker + DEV DIARY heading at 0-entry + section-spacing + no-overlap + rail-visible + empty-boundary) green without remediation. All six R2 fix items (I-3 dispatchEvent-in-single-tick gate test, D-2 Retry toBeDisabled during in-flight refetch, I-1/I-2 combined T-C6 DiaryMarker + DiaryRail display:none at 390px, I-5 entry-date letterSpacing + entry-body fontWeight/lineHeight catchall extension, D-4/M-5 design doc diary-main row + count 33→41 sync) verified present in spec + design doc. visual-spec.json SSOT consumption confirmed: `readFileSync + JSON.parse` in `diary-page.spec.ts` + const re-export via `timelinePrimitives.ts` — zero hardcoded px/hex in Phase 3 spec file. em-dash U+2014 delimiter integrity preserved end-to-end (visual-spec `textPattern: "K-XXX — <title>"` → `DiaryEntryV2.tsx` L21 + `DevDiarySection.tsx` L122 → dev-server screenshot titles `K-022 — About page structure…`). Dev-server screenshots at 1440 desktop + 390 mobile both visually align with wiDSi + N0WWY Pencil frame geometry (rail inset 40/40, marker 20×14 cornerRadius 6 on /diary, cornerRadius 0 on Homepage Sacred deviation, Bodoni/Newsreader/Geist Mono 3-font catchall per role).

**What went wrong:** Pencil MCP tool calls (`mcp__pencil__open_document`, `get_screenshot`, `batch_get`) registered as unavailable in this session despite the MCP server instructions block being attached — could not capture pixel-level Pencil frame screenshots for side-by-side diff. Executed the three-step offline fallback per QA persona rule (positive delta grep + schema parity + explicit Known Gap declaration), with dev-server screenshot comparison as the visual substitute. Separately: `npx playwright test e2e/visual-report.ts` WITHOUT `TICKET_ID` during the initial full-suite run wrote `K-UNKNOWN-visual-report.html` inline as a side-effect (harmless — overwritten by the explicit TICKET_ID=K-024 rerun, but easy to forget and noisy).

**Next time improvement:**
1. When Pencil MCP tools register but don't respond to calls, try one `get_editor_state` as a probe FIRST before starting any Pencil-dependent step — fail fast and jump to the offline fallback rather than discovering the gap mid-flow. Codify in `qa.md` §"Pencil visual comparison" as a new pre-flight line: "Before `open_document`, probe via `get_editor_state` — timeout / error → offline fallback activated immediately".
2. The visual-report.ts side-effect in the full suite writes `K-UNKNOWN-visual-report.html` whenever `TICKET_ID` env is absent, polluting `docs/reports/`. Propose (as PM Tech Debt candidate, not QA fix scope): either gate visual-report.ts behind a `--grep` filter so it's skipped in the default `npx playwright test` run, or have it read TICKET_ID from branch name (`git rev-parse --abbrev-ref HEAD`) as a fallback before `K-UNKNOWN`. Not blocking; log as TD.
3. Phase-3 sign-off should formally cross-check: any production-code change made in the R2 fix batch (here `useDiary.ts` setError ordering + `DiaryEntryV2.tsx` tracking-wide → tracking-[1px]) must have a corresponding new test assertion that FAILs without the production change. T-L4 covers setError ordering (holds the in-flight promise open and asserts `toBeDisabled` which would not fire if Retry unmounted); T-E6 letterSpacing assertion covers the tracking fix. Both covered in this session, but add to QA checklist as a formal row: "R2 production-code changes cross-checked against new test FAIL-without-change coverage".


## 2026-04-22 — K-024 Phase 1+2 Post-R1 Regression Sign-off

**What went well:** Full gate (tsc 0 / Vitest 81/81 / Playwright 190 passed / 1 skipped / 0 fail) green in a single pass after the R1 remediation commit 694510c, including the new diary.legacy-merge.test.ts (6 tests) which precisely validates the Option B amendment (title-literal pin + non-legacy key-absent permitted). Legacy-merge test coverage directly asserts all five PM-locked constraints (exactly-one, title literal, date 2026-04-16, 50–100 word count, ticketId key-absent at raw JSON level) plus the new non-legacy key-absent allowance — complete coverage of AC-024-LEGACY-MERGE. R1 remediation did not introduce any new regression: K-017/K-021/K-023/K-027 Sacred assertions (NavBar order, AC-021-BODY-PAPER, AC-021-FONTS, DevDiarySection 3-marker, AC-028-MARKER-COUNT-INTEGRITY, diary-mobile flex-col/break-words) all remained green, confirming the minimum-touch Phase 1+2 reshape strategy held through remediation.

**What went wrong:** Nothing observed in this sign-off pass; R1 findings were resolved cleanly and no residual regression surfaced. Pre-existing 1 skipped Playwright test is inherited from main (not introduced by K-024) — acceptable per invocation. No cross-ticket boundary violations detected.

**Next time improvement:**
1. For Option-B-style AC amendments that relax a uniqueness constraint (here: "other ticketId-key-absent entries permitted"), the regression test suite should include at least one positive assertion that the relaxation is exercised in production data — the 6th legacy-merge test correctly does this by counting `!('ticketId' in e)` in raw JSON. Codify as a QA check pattern: whenever an AC amendment introduces a permissive clause, verify the test either exercises the permissive branch on production fixtures or adds a synthetic fixture that does.
2. Visual report was generated with TICKET_ID=K-024 correctly; filename `K-024-visual-report.html` confirmed. No action needed — existing persona step worked.
3. Phase 3 sign-off (future PR) will introduce DiaryPage rewrite + 6+ Playwright specs (T-L1..T-L5 loading/error/empty/retry/long-message, timeline-structure, entry-layout, page-hero, content-width, homepage-curation, diary-page-curation). Pre-commit to running all boundary fixtures (entry = 0/1/3/5/10/11) as separate Playwright specs rather than parametrized, to match the PM-enforced enumeration in AC-024-DIARY-PAGE-CURATION.


## 2026-04-22 — K-024 Early Consultation Round 2

**What went well:** Architect's design doc §6.3 + §6.4 delivered concrete contracts for all three states (DiaryLoading wrapping LoadingSpinner label="Loading diary…", DiaryError with canonical fallback literal "Couldn't load the diary right now. Please try again." + "Retry" button + onRetry prop, DiaryEmptyState literal "No entries yet. Check back soon.") — every selector / literal / retry semantic needed for a Playwright spec is unambiguous in a single authoritative table. Confirmed visual-spec.json does NOT need loading/error roles (thin wrappers around existing LoadingSpinner/ErrorMessage — no new visual primitive), preventing a false Challenge about missing role entries. Cross-checked useDiary hook error classification (§4.1 L307-310) against DiaryError error-classification-scope (§6.3 L572-578) — matched: 4xx/5xx, network TypeError, JSON parse, timeout, no-auto-retry all consistent across both sections.

**What went wrong:** Discovered PM skipped Unblock Protocol step 2 — the AC-024-LOADING-ERROR-PRESERVED text in the ticket at line 337 remains verbatim DEFERRED ("Blocked on Architect design"); PM jumped from step 1 (Architect design delivered) directly to step 3 (QA Round 2 invoked) without executing step 2 (supplement Given/When/Then into AC body). QA cannot testability-review an AC that still reads "Blocked…Architect must deliver…"; the concrete contracts live only in the design doc, not in the AC. Separate issue: Architect's §6.3 introduces DiaryError retry button (line 559 props `onRetry`, line 563 `<button>Retry</button>`) — this is net-new behavior not in the pre-DEFERRED AC scope (original AC only said "沿用既有 UX"); no AC currently asserts retry click → re-fetch → loading-reappears-then-resolves flow, so this behavior ships untested unless PM supplements AC. Third issue: `<DevDiarySection>` on Homepage is stated to "preserve loading/error gates" (§6.2 L473) but no AC specifies Homepage loading/error selectors — only /diary page is contract-covered; Homepage error could silently render nothing and pass all tests.

**Next time improvement:**
1. **Round 2 pre-flight MUST read the AC text itself** — don't assume "PM invoked Round 2" means PM completed all protocol steps. Before boundary sweep, grep the AC section and verify Given/When/Then has been written; if still DEFERRED text, halt Round 2 and return single Challenge ("AC body not supplemented") rather than attempting full review. Codify in `qa.md` Early Consultation: pre-flight check 1 = read target AC body, pre-flight check 2 = verify design doc exists, both must pass before boundary sweep runs.
2. **Cross-scope coverage check for shared components** — when design doc mentions "X preserved" on a route NOT covered by the AC under review (e.g., DevDiarySection Homepage loading/error per §6.2), raise as QA Interception to PM asking whether the un-covered scope needs a parallel AC or explicit Known Gap. Codify in `qa.md` Boundary Sweep: add 8th row "Cross-route coverage — component X exists on routes A and B, AC covers only A; is B in scope or Known Gap?"
3. **Novel-UX-element detection in design doc** — when Architect's design doc introduces a UX element not in the pre-deferred AC text (retry button / auto-retry / anything actionable), QA must raise Interception before PASS. This goes beyond "AC matches design" to "design matches AC+reasonable user expectation"; don't let design-introduced features bypass AC coverage just because design mentions them in prose. Codify in `qa.md` Round 2 checklist: diff the AC pre-DEFERRED-text vs the design doc's component section; every behavior in design not traceable to an AC clause = mandatory Interception.

## 2026-04-22 — K-024 Early Consultation Round 1

**What went well:** Visual-spec.json SSOT pattern caught the PRD line 385 middle-dot vs em-dash drift in cross-check — without JSON to anchor against, this would have reached Engineer and produced a shipped bug. Cross-verified every AC citation against `K-024-visual-spec.json` in a role-by-role table (10 roles / 2 frames: wiDSi + N0WWY); all role references match exactly, no SSOT drift on in-ticket AC. Full 7-type boundary sweep executed (not just "happy path") and found 6 of 7 types had gaps — forced PM to address empty-list / concurrency / special-chars cases before Architect release. Produced 11 concrete Challenges with specific "needs supplementation" wording so PM could Edit the AC directly without re-analysis.

**What went wrong:** 10 of 12 AC (83%) needed supplementation at first review; 6 of 7 boundary types had gaps. Root cause: PM wrote AC against the visual-spec.json citation catchall pattern (good) but did not independently sweep the boundary table or cross-check mobile scope consistency or enumerate empty/concurrency cases. AC-024-LOADING-ERROR-PRESERVED was released for QA review before Architect had defined selectors, creating a circular untestable — had to be deferred as a whole, requiring a QA Round 2 after Architect design lands. Only 1 AC (AC-024-PAGE-HERO) passed cleanly.

**Next time improvement:**
1. PM Phase Gate pre-flight checklist (codify in `pm.md`): before invoking QA Early Consultation, PM must self-run the 7-type boundary sweep table (empty / min-max / special-chars / API-fail / network / concurrency / list-size) and produce a coverage map. Any AC released with obvious empty/concurrency gaps → bounce back without QA cycles.
2. Any AC that references "既有 UX" / "既有機制" / "existing component" without a stable selector must carry a `blocked-on: architect-design` marker and be excluded from Early Consultation Round 1 (review only Architect-dependent AC in a subsequent Round 2). Codify in `pm.md` AC authoring template.
3. Cross-document drift check: when AC text is edited in ticket, PM runs `diff <(grep AC-024-ENTRY-LAYOUT docs/tickets/K-024.md) <(grep AC-024-ENTRY-LAYOUT PRD.md)` — the middle-dot vs em-dash drift would have been caught automatically. Codify as `pm.md` DoD before marking AC revision complete.
4. Visual-spec SSOT cross-check (role-by-role table) must be a standard artifact in every QA Early Consultation report for any UI ticket with a visual-spec.json — codify in `qa.md` Early Consultation section.

## 2026-04-21 — K-013 Round 2 Regression Pass

**做得好：** Round 2 gate 全綠一次過（tsc 0 / vitest 45 / pytest 68 / playwright full 173+1 skipped / K-013 spec 4/4），未停在第一個 fail 就中止；K-013 spec 4 cases（full-set / subset / empty matches / <2 bars fallback）直接對應 AC-013-APPPAGE-E2E 的四態斷言，regression 範圍完整。Visual report 5 route 全部截圖成功，輸出至 `docs/reports/K-013-visual-report.html`。Ticket §Pencil 設計稿檢查明確將本票標為 zero-visual-change exemption，sign-off 未錯誤要求 Pencil frame cross-check。

**沒做好：** 嘗試跑「browser smoke beyond Playwright」以人手操作 /app live stack（實上傳 CSV + Start Prediction）時，發現 file input 並非本 app 的 OHLC 資料入口（按鈕維持 disabled，需透過 official CSV source / 手動 rows 才能觸發），smoke spec 跑 30 秒 timeout。無預先閱讀 AppPage 上傳流程，直接照任務單的步驟 pseudo 化 E2E 操作；雖最後移除了 ad-hoc spec 沒汙染 repo，但浪費了一次時間。

**下次改善：** 未來任何 QA 要寫 "live smoke beyond mocks" 的 one-off spec 前，先 `grep -r "setInputFiles\|file input" frontend/e2e/` 找到現有 happy-path spec 的上傳實作照抄，不自己推理 DOM 入口。若 E2E spec 已完整覆蓋（K-013 spec 就是此例），不應再疊加人手 smoke — 以 spec + visual-report 兩線交付就足夠，並在 QA report 註記「live smoke = K-013 spec + visual-report 替代，pure refactor 不另行人手走查」。

## 2026-04-21 — K-030 /app page isolation (final regression)

**做得好：** Pencil v1 `ap001` frame 於本 session 透過直接讀 `frontend/design/homepage-v1.pen` JSON 確認 `fill: #030712`，對照 dev screenshot `/app` wrapper bg 視覺判讀吻合（同時 Playwright T4 已 assert `rgb(3, 7, 18)`）；mcp__pencil 工具不可用時以 .pen JSON 直讀替代，完成 AC-030-PENCIL-ALIGN 視覺比對。主動為 mobile (375px) + tablet (768px) viewport 補 `/app` isolation 驗證（寫入臨時 spec，執行後刪除），補 persona Boundary Sweep viewport 維度；mobile NavBar App link `target=_blank` 亦確認。

**沒做好：** Full Playwright suite `npx playwright test` 跑時 webServer 不帶 `TICKET_ID` 環境變數，`visual-report.ts` fallback 產出 `K-UNKNOWN-visual-report.html` 汙染 `docs/reports/`。QA 驗到尾端才發現並手動 rm + 補跑 `TICKET_ID=K-030 npx playwright test visual-report.ts`。

**下次改善：** 建議於 `frontend/e2e/visual-report.ts` 加 hard gate — `TICKET_ID` 未設時 `throw new Error('TICKET_ID not set')`，不 fallback K-UNKNOWN；或於 QA persona Step 1 改為「必先 export TICKET_ID=K-XXX 再跑 full suite」硬規則。屬 shared tooling，回報 PM 評估另開 TD 票處理。另發現 `frontend/public/diary.json` 存在繁中 milestone 名稱（違反 feedback_diary_json_english），屬 K-021/K-022/K-023 遺留，與本票 scope 無關，僅備註給 PM 參考。

## 2026-04-21 — K-031 /about 移除 Built by AI showcase section

**做得好：** PM 已預先核定 targeted scope（about-v2 + about + pages 三 spec + 2 route 視覺驗證），QA 不盲目跑 full suite；tsc 0 errors + 95 passed / 1 skipped / 0 failed；獨立 visual spec 直接 evaluate document 的 8 個候選 section id，讀到的順序與 Architect 設計文件 §3 File Change List 的 7 SectionContainer 列完全一致（header → metrics → roles → pillars → tickets → architecture → footer-cta）；homepage banner 點擊 → `/about` SPA 導航一起驗；Pencil `.pen` JSON grep 對 `banner-showcase` / `Built by AI` 零命中，與 codebase parity 對齊。

**沒做好：** 依賴 JSON grep 做 Pencil parity（MCP 目前不可用），無法驗視覺層 — 例如若 .pen 裡殘留空白 frame 或 placeholder rect 但移除了文字 label，單純 text grep 會 false-green。本次是純刪除 ticket，風險可接受，但已登 Known Gap。

**下次改善：** 當 Pencil MCP `get_screenshot` 不可用時，QA Pencil parity 檢查應改為：(1) JSON grep 移除項零命中，(2) JSON top-level frame children count 對照設計文件預期 section 數，(3) 明確在 retrospective 宣告「視覺層未驗（MCP offline）」。已將第三點 codify 到 `~/.claude/agents/qa.md` 的 Mandatory Task Completion Steps 0 之下（若 MCP offline 則明文宣告 + grep fallback 最低門檻）— 下次做此類 ticket 時必照此步驟。


## 2026-04-21 — K-028 Regression Sign-off

**What went well:** Full Playwright suite 186 passed / 1 skipped / 0 failed (1 pre-existing skip is AC-017-BUILD, requires production build, not a regression hole). K-023 regression confirmed: AC-023-DIARY-BULLET (3 markers 20×14 / rgb(156,74,59) / borderRadius 0), AC-023-STEP-HEADER-BAR (STEP 01/02/03 all PASS, Geist Mono 10px + bg charcoal + paper text), AC-023-BODY-PADDING (desktop 72/96/96/96 + mobile 375px 32/24) all PASS post flex-col refactor. K-028 ACs: AC-028-MARKER-COORD-INTEGRITY + AC-028-MARKER-COUNT-INTEGRITY + AC-028-SECTION-SPACING (desktop 1280 + tablet 640/639 breakpoint boundary + mobile 375) + AC-028-DIARY-ENTRY-NO-OVERLAP (desktop + mobile first 3 entries) + AC-028-DIARY-RAIL-VISIBLE + AC-028-DIARY-EMPTY-BOUNDARY (0 entries + 1 entry) all PASS. Footer visibility manual probe at `/` scroll-to-bottom: desktop 1280 footer bbox y=617 visible, mobile 375 footer bbox y=313 visible — KG-028-02 mitigation holds. Visual report generated at `docs/reports/K-028-visual-report.html` with correct TICKET_ID. Pencil frame `4CsvQ` hpBody.gap=72 confirmed matches AC-028-SECTION-SPACING desktop 72px assertion (Architect extraction validated).

**What went wrong:** Stale `K-UNKNOWN-visual-report.html` remains in `docs/reports/` from an earlier run that forgot TICKET_ID env var. Did not auto-clean; noise for PM reviewing report dir. Separately, KG-028-01 (long-word overflow in Summary text on 375px) remains untested as registered Known Gap — no new test case added; boundary behavior is assumption-only.

**Next time improvement:** Before running visual-report, `rm -f docs/reports/K-UNKNOWN-visual-report.html` to prevent stale artifacts from prior TICKET_ID-less runs polluting the dir. Codify in `qa.md` persona: screenshot step explicitly deletes any `K-UNKNOWN-*.html` before running the new report.

## 2026-04-21 — K-028 Early Consultation (AC testability review)

**What went well:** Caught PM frontmatter mis-ruling (`qa-early-consultation: N/A`) that violated the "QA Early Consultation every PRD, not only edge-case AC" rule. Surfaced 5 boundary/regression gaps before Engineer started: tablet breakpoint missing, rail-visible guard buried in Architect doc without an AC, empty / 1-entry / 2-entry diary not explicit in AC, K-023 marker assertions re-run is implicit only, and `data-testid="diary-marker"` DOM-nesting change (marker moves from absolute-child-of-outer-wrapper to child of new entry wrapper) — existing K-023 spec still selects by testid so pass is expected, but bounding-box coordinate space changes need explicit regression confirmation.

**What went wrong:** PM shipped `qa-early-consultation: N/A — reason: all ACs are happy-path layout fix` on the ticket frontmatter. The rule `feedback_qa_early_mandatory.md` explicitly says not limited to edge-case AC; layout ticket still needs QA review because (a) diary.json content mutation is an implicit input domain and (b) any CSS refactor that removes DOM structure (absolute-positioned content wrapper deleted, replaced with `pl-[92px]` padding) risks silent breakage of coordinate-based assertions in existing specs. PM skipped QA; consultation only happened after user flagged the protocol breach.

**Next time improvement:** PM Phase Gate must treat `qa-early-consultation` as mandatory-yes — any "N/A — reason: happy path" value is an automatic violation and the ticket is bounced back. Codify in `pm.md`: the frontmatter field accepts only (a) a reference to a QA Early Consultation report/section, or (b) "skipped by user explicit override — ___". Layout/visual tickets specifically must not claim N/A — layout changes can break existing specs through DOM coordinate shifts even when AC is happy-path.

---

## 2026-04-21 — K-018 GA4 runtime fix regression run

**做得好：** 完整跑滿 175 test (166 passed / 1 skipped / 8 failed)，未在 ga-tracking.spec.ts 第一支 fail 就中止；failure log 直接對應到 spec mock 與 production helper 實作不一致的根因，交付訊息可供 PM 直接裁決。

**沒做好：** K-018 原 sign-off 時接受 `ga-tracking.spec.ts` 的 mock 用 `(...args) => dataLayer.push(args)` 形式，沒注意到此 mock shape 與 production helper 的實作細節耦合；當 production 改回 `arguments` 物件後，spec 的 `Array.isArray(entry)` filter 全部失效，8 個 case 同時 fail。Mock 與被測程式對同一個 global (window.gtag) 的 override 順序、以及 Arguments object vs Array 的差異，K-018 QA 當時未辨識為 boundary。

**下次改善：** 任何 spec 以 `addInitScript` mock 全域 function 時，QA sign-off checklist 需新增一條：「此 mock shape 是否與 production 實作的推送 payload 形狀一致？若 production 改寫同一 global 會覆蓋 mock 嗎？」若兩者對同一變數 override，必須列為 Known Gap 或要求 Engineer 改用 spy 而非 replace。

## 2026-04-21 — K-023（Homepage 結構細節對齊 v2）

**做得好：** 175 tests 全套跑完 174 pass / 1 skip / 0 fail；skip（AC-017-BUILD）為已知設計排除（需 production build），非回歸失漏；TICKET_ID=K-023 帶入正確執行，產出 `K-023-visual-report.html`；AC-023-DIARY-BULLET（width/height/backgroundColor/borderRadius，3 markers）、AC-023-STEP-HEADER-BAR（STEP 01/02/03 各自獨立 3 test，含 fontFamily Geist Mono 斷言）、AC-023-BODY-PADDING（desktop 72px/96px + mobile 375px 32px/24px）、AC-023-REGRESSION（Banner DOM-order compareDocumentPosition + diary markers 存在 + diary link）全部 PASS；K-017 / K-021 / K-022 / AC-HOME-1 / NavBar / DiaryPage 完整回歸無任何破壞。

**沒做好：** KG-023-04（640px breakpoint boundary test，639px vs 640px）Ticket 明定「QA adds at sign-off」，但 QA 角色定義僅能回報，不能寫 spec；此邊界場景實際上未被任何 test case 覆蓋，sign-off 時未主動將此 Known Gap 升級為 PM interception，而只留在 ticket 記錄中。

**下次改善：** Ticket 記載「QA adds at sign-off」的 Known Gap，QA sign-off 時必須明確向 PM 聲明「此邊界未覆蓋，需 Engineer 補 spec 或 PM 正式裁決降為 Known Gap」，不得以「已在 ticket 記載」為由跳過正式 Interception 流程。

## 2026-04-21 — K-022（/about 結構細節對齊 v2）

**做得好：** 165 tests 全套跑完 164 pass / 1 skip / 0 fail，skip（AC-017-BUILD）為已知設計排除（需 production build），非回歸失漏；visual report 正確帶 `TICKET_ID=K-022` 執行，產出 `K-022-visual-report.html`，K-027 反省改善已落地；AC-017-HEADER / METRICS / ROLES / PILLARS / TICKETS / ARCH / FOOTER 全部仍 PASS，I-1 fix（PillarCard overflow-hidden 移除）無破壞。

**沒做好：** I-1 fix 移除 overflow-hidden 屬性後，未補「長文字溢出」邊界場景的 Playwright spec；現有斷言只能確認結構存在，無法保護未來 PillarCard 文字過長時的 layout 完整性。

**下次改善：** Engineer fix 涉及移除 overflow / layout guard 屬性時，QA 須主動補一條 boundary spec（e.g., 注入長文字 prop 確認容器不崩），不能只靠結構斷言通過就放行。

## 2026-04-21 — K-027（DiaryPage 手機版 milestone timeline 視覺重疊修復）

**沒做好：**
- TC-001~003（NO-OVERLAP）僅覆蓋「全折疊」與「全展開」兩個端點，未測試 accordion 中間態（奇偶交叉展開），而中間態正是原始 bug 的高發場景。
- Mobile viewport 測試覆蓋 375 / 390 / 414px，但 AC 明定「≤ 480px 全部 breakpoint」；430px（iPhone 14 Pro Max）與 480px 邊界值未被任何獨立 TC 覆蓋。
- visual report 執行未帶 `TICKET_ID=K-027` 環境變數，產出檔名為 `K-UNKNOWN-visual-report.html`；K-017 retro 已記錄此改善點，本次仍未落地，屬重複失誤。
- `assertLastCardVisible` 的 scroll-to-bottom 可見性未作目視或 `toBeInViewport()` 輔助驗證，僅依賴 bounding box 斷言通過，實測路徑存在盲點。

**下次改善：**
1. **截圖 script TICKET_ID 強制格式**：執行步驟改為 `TICKET_ID=<ticket-id> npx playwright test visual-report.ts`，不允許省略 — 已同步更新 qa.md persona 步驟為硬 gate。
2. **Accordion 中間態測試**：凡有 accordion/collapse 的頁面，NO-OVERLAP 類斷言必須額外加一輪「奇偶交叉展開」場景（展開奇數索引、折疊偶數索引）。
3. **Viewport 邊界補點**：AC 定義「≤ X px」時，QA 必須在標準三種 viewport 之外加測 X px 邊界值本身（本票應補 480px TC）。
4. **Scroll 可見性獨立實測**：scroll-to-bottom 類斷言修正後，QA 須另開 browser session 以目視或 `toBeInViewport()` 補充驗證。

## 2026-04-20 — K-021 Round 4（`/about` readability re-verify）

**做得好：** Round 3 挑出的 10 處 white-on-paper 疑慮在 Round 4 寫了直接針對 CSS token 的 computed-color 探針（11 處 selector 對 `rgb(26, 24, 20)` 斷言 + 9 處 pillar/arch/ticket-anatomy 延伸），11 主 + 9 延伸 = 20/20 全 pass，證據與 K-017 baseline 無關、直接綁 `ink` token 語意；另外加一道 paper-bg 感知的 white-leaf 全頁掃描（對 `/about` 回 0 筆、對 `/`, `/diary`, `/app`, `/business-logic` 各回 0 筆），回歸證據不止針對 Round 3 舉證的 10 處，而是「整頁再無白字殘留」；regression 三件套自跑（tsc exit 0 / build 所有 chunk < 500kB，最大 vendor-react 179kB gzip 58kB / Playwright 115 passed + 1 skipped），不以 Engineer 自述為憑；visual-report 以 `TICKET_ID=K-021 npx playwright test --project=visual-report` 覆寫 Round 3 報告，檔案 timestamp 與 size 驗證確認寫入成功。

**沒做好：** Round 4 是 narrow re-verify，但 probe script 起手時 import 寫成 `from 'playwright'`（套件只有 `@playwright/test`），第一次執行 ERR_MODULE_NOT_FOUND，多跑一次；為了不污染 E2E suite，把探針放在 `e2e/_k021-round4-*.mjs` 並依賴 playwright config 的 `testMatch: /.*\.spec\.ts$/` 篩掉，但「命名以 `_` 開頭 + `.mjs` 副檔名 + 非 spec」三重保險這層規則沒先寫在探針檔頭註解，之後同事看到可能誤會是遺漏的 spec。

**下次改善：** (1) `/frontend` 下 ad-hoc Playwright 探針統一 `import { chromium } from '@playwright/test'`，新增 `_k*.mjs` template 註解首行標註「非 spec，不被 testMatch 收斂，執行完 rm」；(2) Round N re-verify 類任務，QA retro 標題明確加 `Round N (<focus>)`，與原始 ticket retro 區隔閱讀路徑，避免後續翻閱者混淆範圍。

## 2026-04-20 — K-021

**做得好：** 自動化三件套（tsc exit 0 / build 無 chunk warning / Playwright 115 passed + 1 skipped）一次通過並逐項記錄具體數字（最大 chunk vendor-react 179kB，gzip 58kB），非只標 PASS；5 路由視覺檢查不依賴肉眼，以臨時 Playwright spec 逐頁 evaluate 出 body bg / color / heading fontFamily / footer fontFamily 等數值，再與 AC 原始 rgb 斷言並對；`/about` readability 疑慮不以肉眼判斷，撰寫 readability 探針（讀 hero h1 / metric cards / h2/h3 headings 的 computed color）取得 `rgb(255, 255, 255)` 白字出現於 paper bg 的客觀證據，再對照 K-017 baseline（extract K-017-visual-report.html 的 base64 還原 /tmp/k017-about.png）逐幅肉眼比對；NavBar 疑似 hex leak 先以 `outerHTML` regex 偵測，再寫第二版探針區分「inline style vs className literal」，避免錯判 TD-K021-02 允許的 `text-[#9C4A3B]` 為 regression；結束前以 `rm e2e/_tmp-*.spec.ts` 清除所有臨時 spec，避免污染 repo。

**沒做好：** readability 探針一開始沒把 `/about` 排為優先核心——先跑「6 routes 通用截圖 + 色值抽樣」才發現異常，多跑一輪探針；臨時 spec 建立時沒先看 `playwright.config.ts` 的 `testDir: './e2e'`，第一次放 `/tmp/` 啟動失敗才改放 `e2e/_tmp-*.spec.ts`，浪費一次 run；Reviewer 2 條件之一「`/about` 與 K-017 baseline 對比 → 判斷是 K-022 regression 還是立即修」QA 視為「回報事實給 PM 裁決」而非自己下判斷，但沒在 retrospective 明確標示「技術證據已收集完整，裁決在 PM」的邊界角色。

**下次改善：** (1) 視覺全面改版類 ticket（K-021 此類 design system rebuild）QA 視覺 audit step 先讀 ticket §Scope 與 §Tech Debt 列出「本票遷移 vs 未遷移」範圍，**優先針對「未遷移但受波及」路由做 readability 探針**，不倚賴均勻抽樣；(2) 臨時 Playwright spec 一律直接建在 `e2e/_tmp-<task>.spec.ts`，並在結束前 `rm` + `ls` 驗證清除，不走 `/tmp/` 導致 testDir 不覆蓋；(3) QA retro 明確分段「客觀數據」vs「PM 裁決題」，前者 QA 負責，後者只陳述證據不下結論，避免角色越權。

## 2026-04-19 — K-018

**做得好：** ga-tracking.spec.ts 12/12 全綠逐一目視確認（AC-018-INSTALL × 1、AC-018-PAGEVIEW × 4、AC-018-CLICK × 4、AC-018-PRIVACY × 1、AC-018-PRIVACY-POLICY × 2），與 ticket AC 清單逐條對齊；`TICKET_ID=K-018` 環境變數本次記得帶，產出正確命名的 `K-018-visual-report.html`（K-017 反省的改善行動已落地）；全套 99 passed / 1 skipped，skipped 條目屬已知問題，正確標注不 block。

**沒做好：** `waitForFunction` 取代 `waitForTimeout` 的修復屬 E2E 穩定性改善，QA 未獨立驗證「舊版確實存在 flaky 風險」——只依賴 Engineer retro 自述，未執行 `--repeat-each` 確認新版不 flaky；「`/business-logic` 不在追蹤範圍」的設計理由沒有在 QA retro 中明記，後續若有 coverage 疑問需翻 ticket 才能找到依據。

**下次改善：** (1) E2E timeout 改善類修復，QA 須執行 `npx playwright test <spec> --repeat-each=5` 驗證穩定性，不全然依賴 Engineer 自述；(2) 「刻意不追蹤/跳過」的路由或功能，QA retro 明記排除理由，作為後續 coverage 問題的第一線文件依據。

---

## 2026-04-19 — K-017

**沒做好：** 執行 visual report script 時未帶 `TICKET_ID=K-017` 環境變數，導致產出為 `K-UNKNOWN-visual-report.html`；AC-017-BUILD（prebuild hook）因 dev mode skip 而未補 build-mode 手動驗證；AC-017-AUDIT（audit-ticket.sh）屬 shell script 不被 Playwright 覆蓋，但 QA 未主動手動執行 K-002/K-008/K-999 三個情境逐條確認 AC。
**下次改善：** (1) 截圖 script 執行前固定確認 `TICKET_ID` 已設；(2) 含 build artifact 依賴的 AC，QA 額外執行 `npm run build` 確認 artifact 存在；(3) Shell script / CLI tool 類 AC，QA 主動手動執行所有情境，不以 Playwright skip 代替驗證。

---

## 2026-04-18 — K-008 QA 驗收反省

**做得好：** 6 步回歸不只機械執行，在 Step 3 HTML 產出後主動補跑「結構抽樣」驗證（`grep -c 'class="page-section'` = 5、`grep -o 'data:image/png;base64' \| wc -l` = 4、`grep -A1 'class="route"'` 列 5 條 `<code>` 路由標記），把 AC-008-CONTENT 條文「每張截圖有對應的 route path 標記」從「Engineer 自述」升級為「QA 獨立驗證」。Step 6 也額外執行 `git check-ignore -v` 確認 `.gitignore:32` rule 精確命中、無 overreach，不只看 `status` 輸出有無目標檔。

**沒做好：** W4 whitelist 的 negative path 只驗 PM prompt 指定的 `../../etc/passwd` 一個 payload；QA 應自備邊界清單（空字串、純空白、尾空白、`K-` 大小寫、Unicode、overflow 長度）主動擴展驗證面，但這次沒做。另外 `.gitignore` rule overreach 只做 `docs/reports/*.html` 單 rule 抽樣，未對 `dist/`、`coverage/`、`node_modules/` 內常見產物目錄各抽 1 sample 跑 `check-ignore` 確認未誤傷。HTML size 驗證僅比 `>500KB` / `<10MB` 門檻，若未來產物結構大幅異常（例：24 張截圖擠成 1 MB，或某條 route 變空），size 仍會落在範圍內，size 不足以當 structural invariant。

**下次改善：**
1. **邊界 payload 清單固定化** — QA 自備 fixed checklist（空字串、純空白、尾空白、大小寫、Unicode、overflow 長度）隨任何 env var / CLI 輸入 ticket 一起跑，不等 Reviewer / PM 在 prompt 列 payload。
2. **gitignore 跨產物 sample 檢查** — 凡修改 `.gitignore`，QA 對 repo 內常見產物目錄（`dist/`、`coverage/`、`node_modules/`、`docs/`）各抽 1 個 sample 檔案跑 `git check-ignore -v`，確認 rule 精確，不靠「只看目標檔是否被 ignore」單點判斷。
3. **Artifact 內容抽樣作為 invariant** — HTML / JSON artifact 不只看 size；每種 artifact 定義 1~3 個結構 grep 作為 AC 的 operational invariant（本票 `<section>` 數、base64 圖數、route 標記清單），寫進 QA 驗收章節當證據，不靠 Engineer 自述。

---

## 2026-04-18 — K-011（LoadingSpinner label prop 回歸測試）

**做得好：** 三層驗證（tsc exit 0 / Vitest 36 pass / Playwright 45/45）全程實跑並 tail 輸出驗證精確數字，未沿用 Reviewer 段落 relay；主動 Read `agent-context/architecture.md:139` 確認 Drift A 已由 Engineer 補完，不假設「PM 裁決 = 已執行」。補執行「獨立 grep `Running prediction` 於 `frontend/` 全樹」作為雙重驗證，確認 `frontend/e2e/` 無任何斷言依賴、`PredictButton.test.tsx:24` 為唯一依賴點、`homepage.pen:4825` 為 TD-011 已登記項，無漏網。

**沒做好：** `LoadingSpinner` 本身沒有 unit test（現存 test 都走上層 PredictButton / AppPage 間接覆蓋），對 `label` 的 falsy 邊界（空字串 `""`、`undefined`、極長字串）與 `aria-label` fallback（`label ?? 'Loading'`）未有直接斷言；若未來新 callsite 誤傳空字串，行為是「不渲染 `<p>` 且 `aria-label` 走 fallback」，本票無測試攔截此情境。此外，未主動在 retrospective 中將這些邊界列成「K-011 未覆蓋」的 follow-up 清單交 PM 評估是否需要補 unit test。

**下次改善：** (1) 共用 UI 組件「新增 prop」類 ticket，QA 必主動列「新 callsite 的邊界條件」（falsy 值、極長字串、RTL / emoji）給 PM 評估是否補 unit test；即使 PM 判定非 scope，也要在 retrospective 明記「這些邊界未覆蓋」供未來 bug 溯源。(2) 沿用 Reviewer grep 結論前，自己跑一次獨立 grep（`frontend/e2e/ frontend/src/__tests__/ frontend/src/`），把 Reviewer 的結論當 hypothesis 而非 fact，發出 PASS 前必有 QA 自行 grep 紀錄。

## 2026-04-18 — K-009（1H MA history fix 回歸測試）

**做得好：** 實跑 `python3 -m pytest` 取得完整 63 passed 數字，並與 ticket AC-009-REGRESSION 基準（18 + 44 = 62 + 新增 1 = 63）逐項 cross-check 對齊；同步跑 `py_compile` 雙檔確認無語法/縮排漏網。跳過 Playwright 的決策明確寫進報告並附理由（無前端 diff、無 UI surface），不用「沒時間」含糊帶過。

**沒做好：** 未執行單點驗證「移除 fix 後 test 會失敗」—— 雖然 Reviewer 已實跑 `git stash` 驗過（ticket Reviewer 段有記錄），但 QA 層面未再獨立覆核，純粹 relay Reviewer 結論；若 Reviewer 記錄本身有誤（此次無，但流程上不應假設），QA 等於失守。此外，S1 技術債（predictor 層靜默 fallback）已開 K-015，但 QA 未主動列出「未來新增 `find_top_matches()` caller 時，測試需攔截此類 regression」的邊界條件清單給 PM。

**下次改善：** (1) 後端 bug fix 類 ticket，QA 必須獨立執行「reverse-fix → test fail → restore fix → test pass」一輪小驗證，不全然依賴 Reviewer 段落；(2) 看到「技術債已開票」的裁決時，QA 主動在 retrospective 註記該 follow-up 需要的 regression 測試覆蓋點（例如：K-015 解掉時必須附「新 caller 忘記傳 ma_history」的 predictor 層 assert test），避免技術債修復時又踩相同坑。

## 2026-04-18 — K-010（Vitest AppPage 修復）

**做得好：** 三重回歸（Vitest 36/36、tsc exit 0、Playwright 45/45）全程實跑並 tail 輸出確認數字，不信 Implementation log；額外 grep `chart-timeframe-` 比對 testid 在 E2E 是否被依賴，釐清本次 DOM 改動的 blast radius 只在 Vitest，E2E 無回歸風險。

**沒做好：** 未跑 Vitest coverage 確認 Engineer 是否意外讓既有 test skip 或改判（只看 pass 數無法偵測「斷言被削弱」），本次靠 review 手動檢查 test diff 間接證明，程序上有漏洞；截圖 script 仍缺（K-008 未實作 cycle #6），本次跳過但流程定義上 QA 尾段是缺的。

**下次改善：** (1) 日後 Vitest 涉及改寫斷言的 ticket，QA 必加跑 `npm test -- --run --coverage` 比對 coverage diff（或至少 read 改動的 test 原/新 diff）再聲明 PASS；(2) 在 K-008 實作前，QA 的「截圖報告」欄位採固定「跳過（K-008 未完成）」而不逕自聲稱流程完整，避免 PM 誤解。
