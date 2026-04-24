# K-045 Code Review — Desktop layout consistency across /about, /, /diary

**Reviewer role:** Step 2 depth review (subsumes Step 1 breadth gates per task scope).
**Worktree:** `.claude/worktrees/K-045-desktop-layout-consistency/` (branch `K-045-desktop-layout-consistency`).
**Base commit:** `ef3519d` (K-Line main, K-042 backfill).
**Commits reviewed (`git log 00f8ac6..HEAD`):**
- `0b6567d` — feat(K-045): retire SectionContainer, per-section container refactor [Phase 1]
- `55f640c` — test(K-045): AC-045-* E2E coverage T1–T19 [Phase 3]
- `4d840f0` — chore(K-045): architecture.md sync + Engineer retrospective [Phase 4] [docs-only]

Ticket: `docs/tickets/K-045-desktop-layout-consistency.md`. Design doc: `docs/designs/K-045-design.md`. Ticket type: `refactor`, `visual-delta: none`.

---

## Summary

**Verdict: CODE-PASS, MERGE-READY (pending QA regression + PM Phase Gate close).**

All three depth tracks + Step 1 breadth gate PASS with evidence:
- Track A (AC alignment T1–T19): 15/15 T1–T17 green in `about-layout.spec.ts`; 4 parametric tests (T18 + T19×3 viewports) green in `shared-components.spec.ts`. All assertions mirror Pencil SSOT numeric targets. All use `{ exact: true }` where applicable, no hardcoded sleeps.
- Track B (pure-refactor behavior diff): OLD vs NEW truth table produces a clean, complete delta. Every OLD≠NEW cell maps to either a K-045 AC or a Pencil-SSOT target; no unaccounted divergence.
- Track C (Sacred 14 clauses): all 14 verified preserved, including the at-risk K-031 `#architecture.nextElementSibling === <footer>` (PASS in live run).
- Step 1 breadth: commit hygiene clean, tsc exit 0, Playwright subset green (`about-layout` 15/15 + `shared-components` + `about-v2` 53/53 combined), token-retire widened grep 0 residues in runtime scope, git status clean in runtime scope.

Findings: **0 Critical, 1 Warning, 2 Nit**. See §Findings.

Recommend release to QA for full-suite regression + Phase Gate close + deploy sequence.

---

## Track A — AC Alignment (T1–T19)

| Test ID | AC | Impl (file:line) | Spec (file:line) | Verdict | Notes |
|---|---|---|---|---|---|
| T1 | AC-045-CONTAINER-WIDTH (desktop) | `AboutPage.tsx:22,31,36,42,48,54,62` (`max-w-[1248px]`, `sm:px-24`) | `about-layout.spec.ts:49-62` | PASS | 6 sections × (maxWidth=1248px, paddingLeft=96px, paddingRight=96px); width 1246–1250. Live: PASS. |
| T2 | AC-045-CONTAINER-WIDTH (mobile) | `AboutPage.tsx:22` (`px-6`) | `about-layout.spec.ts:64-75` | PASS | All 6 sections paddingLeft/Right=24px, width 373–377 at 375 viewport. |
| T3 | AC-045-SECTION-GAP (desktop) | `AboutPage.tsx:23,31,62` (`mt-6 sm:mt-[72px]` + `pt-8 sm:pt-[72px]`) | `about-layout.spec.ts:79-88` | PASS | 5 adjacent pairs all gap ∈ [70,74]. Assertion direction correct — raises `mt` to `mt-0` would FAIL. |
| T4 | AC-045-SECTION-GAP (mobile) | `AboutPage.tsx:23` | `about-layout.spec.ts:90-99` | PASS | 5 pairs all gap ∈ [22,26] at 375. |
| T5 | AC-045-HERO-LINE-COUNT h1 | `PageHeaderSection.tsx:21-28` (PageHero 52px 2-span block) | `about-layout.spec.ts:103-111` | PASS | h1 height 107–112 at 1280 (2 lines × 52 × 1.05 ≈ 109.2). |
| T6 | AC-045-HERO-LINE-COUNT role | `PageHeaderSection.tsx:30-32` | `about-layout.spec.ts:113-121` | PASS | Role line height 22–26; `{ exact: true }` used. |
| T7 | AC-045-HERO-LINE-COUNT tagline | `PageHeaderSection.tsx:33-35` | `about-layout.spec.ts:123-131` | PASS | Tagline height 23–28; `{ exact: true }` used. |
| T8 | AC-045-HERO-LINE-COUNT mobile | `PageHeaderSection.tsx:19-37` | `about-layout.spec.ts:133-146` | PASS | Non-overlap (tagline.y ≥ h1.bottom - 1) at 375. |
| T9 | AC-045-SECTION-LABEL-X (desktop) | `SectionLabelRow.tsx:19-22` + `AboutPage.tsx:22` (`sm:px-24`) | `about-layout.spec.ts:150-170` | PASS | 5 labels left-edge ≤1px from section.x+96. Uses `#<id> [data-testid="section-label"]` scoped locator — correct, no cross-section pollution. |
| T10 | AC-045-SECTION-LABEL-X (mobile) | same | `about-layout.spec.ts:172-186` | PASS | 5 labels left-edge ≤1px from section.x+24 at 375. |
| T11 | AC-045-SECTION-LABEL-X hairline | `SectionLabelRow.tsx:26` (`flex-1 h-px`) | `about-layout.spec.ts:188-203` | PASS | Hairline right-edge ≤1px from section.right-96. |
| T12 | AC-045-K031-ADJACENCY-PRESERVED | `AboutPage.tsx:60-69` (S6 then `<Footer />`) | `about-v2.spec.ts:388-405` (delegated, Sacred) | PASS | Existing K-031 spec: `nextSiblingTag === 'footer'`. Green in combined run. |
| T13 | AC-045-K031-ADJACENCY-PRESERVED | `AboutPage.tsx:69` (Footer last child of root) | `about-v2.spec.ts:388-405` | PASS | Same spec. |
| T14 | AC-045-K031-ADJACENCY-PRESERVED (safety net) | `AboutPage.tsx:27,31,36,42,48,54,60,69` | `about-layout.spec.ts:207-222` | PASS | Direct-section IDs `['header','metrics','roles','pillars','tickets','architecture']` + lastChildTag='footer' verified in one evaluate. |
| T15 | AC-045-SM-BOUNDARY @639 | `AboutPage.tsx:22` (`px-6` active at <640) | `about-layout.spec.ts:226-235` | PASS | `#metrics` paddingLeft=24px at 639. |
| T16 | AC-045-SM-BOUNDARY @640 | `AboutPage.tsx:22` (`sm:px-24` active at ≥640) | `about-layout.spec.ts:237-246` | PASS | `#metrics` paddingLeft=96px at 640. |
| T17 | AC-045-SM-BOUNDARY @1440 | `AboutPage.tsx:22` (`mx-auto max-w-[1248px]`) | `about-layout.spec.ts:248-262` | PASS | width=1248, x=96 (centered at 1440 - 1248 = 192 / 2). |
| T18 | AC-045-FOOTER-WIDTH-PARITY (non-descendant) | `AboutPage.tsx:69` (`<Footer />` root sibling) | `shared-components.spec.ts:193-222` | PASS | Ancestor walk returns `hasCappedAncestor=false`; Footer.width ∈ [1278,1282]. Fail-if-wrapped direction correct. |
| T19 | AC-045-FOOTER-WIDTH-PARITY (pairwise) | root-level Footer on all 3 routes | `shared-components.spec.ts:224-243` | PASS | Pairwise max-min ≤2px across `/`, `/about`, `/diary` at 1280/1440/375. |

**Spec logic self-check (`feedback_engineer_e2e_spec_logic_selfcheck`):**
- Target scope: every assertion scopes to `/about` or cross-route Footer — correct.
- Fail direction: each assertion would FAIL if the refactor regressed (e.g., T1 would FAIL if `max-w-[1248px]` downgraded to `max-w-5xl`; T18 would FAIL if Footer moved inside wrapper; T3/T4 would FAIL if `mt-*` changed to `py-*`). No degenerate proxies.
- No hardcoded sleeps. No `page.waitForTimeout` in spec (confirmed via grep).
- `{ exact: true }` present on all text-getByText locators (T6, T7, T8).

**AC-Test count cross-check (design §6.2):** ticket declares 7 new AC + 1 regression AC; design §6.2 enumerates T1–T19 (19 IDs). Spec realizes T1–T11 + T14 + T15–T17 (15 in `about-layout.spec.ts`) + T18 + T19 parametric×3 (4 in `shared-components.spec.ts`) = 19 assertion instances (with T19 expanding to 3 viewport runs). T12/T13 delegated to existing K-031 Sacred spec (`about-v2.spec.ts:388-405`) per design §6.2 "Engineer may delegate". Count reconciles.

---

## Track B — Pure-Refactor Behavior Diff

### OLD vs NEW Truth Table (by section × viewport, condensed)

OLD baseline from `git show ef3519d:frontend/src/pages/AboutPage.tsx` + `ef3519d:frontend/src/components/primitives/SectionContainer.tsx` + `ef3519d:frontend/src/components/about/PageHeaderSection.tsx`. NEW from HEAD.

#### Hero section (S1 `#header`)

| Property | OLD @ 375 | OLD @ 640 | OLD @ 1280 | OLD @ 1440 | NEW @ 375 | NEW @ 640 | NEW @ 1280 | NEW @ 1440 | AC / Sacred mapping | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| maxWidth | 768 (`max-w-3xl`) | 768 | 768 centered | 768 centered | 1248 (`max-w-[1248px]` + `w-full`) | 1248 | 1248 centered | 1248 centered | BQ-045-05 Option A + Pencil `35VCj` no maxWidth cap on `b6TgM` | Intentional (BQ) |
| paddingLeft | 24 (`px-6`) | 24 (no `sm:px-*` on SectionContainer) | 24 | 24 | 24 | 96 (`sm:px-24`) | 96 | 96 | AC-045-CONTAINER-WIDTH + Pencil `Y80Iv padding[3]=96` | Intentional |
| paddingTop | 64 (`py-16`) | 64 | 64 | 64 | 32 (`pt-8`) | 72 (`sm:pt-[72px]`) | 72 | 72 | Pencil `Y80Iv padding[0]=72`; mobile mirrors Home `pt-8` | Intentional |
| paddingBottom | 64 (`py-16`) on SectionContainer + 80 (`py-20`) inside PageHeaderSection | 64+80 | 64+80 | 64+80 | 0 (no py on section; `py-20` retired from PageHeaderSection) | 0 | 0 | 0 | AC-045-SECTION-GAP "single layout mechanism" (margin-top only) | Intentional |
| id | `header` (on `<section>` via SectionContainer) | same | same | same | `header` (on `<section>` direct) | same | same | same | K-031 implicit | Preserved |
| DOM adjacency | `<section id="header">` is child of root `<div className="min-h-screen">` | same | same | same | same | same | same | same | K-031 Sacred | Preserved |

#### Body sections S2–S6 (`#metrics`, `#roles`, `#pillars`, `#tickets`, `#architecture`) — uniform pattern, one row

| Property | OLD | NEW | AC / Sacred mapping | Verdict |
|---|---|---|---|---|
| maxWidth | 1024 (`max-w-5xl`) | 1248 (`max-w-[1248px]`) | AC-045-CONTAINER-WIDTH + K-040 Item 3 1248 target | Intentional |
| paddingLeft @375 | 24 | 24 | unchanged | identity |
| paddingLeft @640 | 24 | 96 (`sm:px-24`) | AC-045-CONTAINER-WIDTH + AC-045-SM-BOUNDARY | Intentional |
| paddingLeft @1280/1440 | 24 | 96 | same | Intentional |
| paddingTop | 64 (`py-16`) | 0 | AC-045-SECTION-GAP single-mechanism | Intentional |
| paddingBottom | 64 (`py-16`) | 0 (except S6 adds `mb-8 sm:mb-[96px]`) | Pencil `Y80Iv padding[2]=96` encoded via S6 `mb` | Intentional |
| marginTop @375 | 0 | 24 (`mt-6`) | AC-045-SECTION-GAP mobile | Intentional |
| marginTop @640/1280/1440 | 0 | 72 (`sm:mt-[72px]`) | Pencil `Y80Iv gap=72` | Intentional |
| divider / border-b | `border-b border-muted/40` (SectionContainer divider) | removed | Pencil frames have no section-terminal border; hairline carried by SectionLabelRow only | Intentional (design §2.5) |
| Adjacent-pair gap @375 (S_i.bottom → S_{i+1}.top) | 128 (64 from S_i's `py-16` bottom + 64 from S_{i+1}'s `py-16` top) = 128 | 24 (mt-6 only; no py) | AC-045-SECTION-GAP mobile 24±2 | Intentional |
| Adjacent-pair gap @1280 | 128 | 72 | AC-045-SECTION-GAP desktop 72±2 + Pencil gap:72 | Intentional |
| id | S_i id preserved | S_i id preserved | AC-045-REGRESSION (K-022 section-label selectors) | Preserved |
| DOM position (root child) | direct child of root `<div>` | direct child of root `<div>` | K-031 Sacred | Preserved |
| `<section>` element tag | yes (SectionContainer emits `<section>`) | yes (direct `<section>`) | K-031 adjacency + K-022 section-label selectors | Preserved |

#### Root-level DOM structure (non-section)

| Property | OLD | NEW | Verdict |
|---|---|---|---|
| Root element | `<div className="min-h-screen">` | same | Preserved |
| NavBar position | 1st child after div open | same | Preserved |
| Section count as direct root children | 6 (header/metrics/roles/pillars/tickets/architecture) | 6 (same IDs) | Preserved |
| Footer position | last child of root | last child of root | K-031 + K-034 P1 Sacred | Preserved |
| `#architecture.nextElementSibling` | `<Footer>` | `<Footer>` | K-031 Sacred `about-v2.spec.ts:388-405` PASS | Preserved |
| Footer is descendant of max-w-[1248px] wrapper | NO (root sibling) | NO (root sibling) | K-034 P1 byte-identity + K-040 pairwise Δ=0 | Preserved |
| SectionLabelRow extraction | inline `function SectionLabelRow` defined in AboutPage.tsx | separate file `components/about/SectionLabelRow.tsx`, named default export | AC-022-SECTION-LABEL selectors (`data-testid="section-label"` + `data-section-hairline`) preserved | Preserved (refactor) |
| PageHeaderSection outer py | `py-20` | (removed — rhythm moved to parent `<section>` via `pt-8 sm:pt-[72px]`) | design §2.4 | Intentional |

**Summary of OLD vs NEW deltas:**
- 0 unaccounted divergences — every OLD≠NEW cell maps to a K-045 AC or a Pencil-SSOT target.
- `margin-top` single-mechanism gap (§3.2 of design doc) correctly selected over `flex gap` wrapper because a flex wrapper would break K-031 adjacency (`#architecture.nextElementSibling` would become `null`). Live K-031 spec confirms preserved.
- Hero width widens 768→1248 per BQ-045-05 Option A (PM ruled); K-022 AC-022-HERO-TWO-LINE retired 2026-04-23 by K-040 — no Sacred conflict.

---

## Track C — Sacred 14 clauses cross-check

| # | Clause | Evidence (file:line) | Verdict | Notes |
|---|---|---|---|---|
| 1 | K-017 NAVBAR / ROLES | `AboutPage.tsx:28` (`<UnifiedNavBar />` unchanged) + `UnifiedNavBar.tsx` not touched | PASS | shared primitive unchanged |
| 2 | K-017 AC-017-FOOTER | `shared-components.spec.ts:36-56,58-73` Footer byte-identity + canonical text (subset run 4/4 green) | PASS | — |
| 3 | K-022 AC-022-SECTION-LABEL | `SectionLabelRow.tsx:22` `data-testid="section-label"` + L26 `data-section-hairline` preserved; 5 labels on S2–S6 | PASS | `about-v2.spec.ts:30-58` still green (confirmed in combined run) |
| 4 | K-022 AC-022-ROLE-GRID-HEIGHT | `RoleCardsSection.tsx` not touched; verified via grep no change to about components except SectionLabelRow + PageHeaderSection | PASS | live 3/3 green (375/390/414) |
| 5 | K-022 AC-022-REDACTION-BAR | `MetricCard.tsx` not touched | PASS | — |
| 6 | K-022 AC-022-OWNS-ARTEFACT-LABEL | `RoleCard.tsx` not touched | PASS | — |
| 7 | K-023 AC-023-BODY-PADDING | `HomePage.tsx:22` untouched (verified git diff) | PASS | /home not in scope |
| 8 | K-024 AC-024-CONTENT-WIDTH | `DiaryPage.tsx:42` untouched | PASS | /diary not in scope |
| 9 | K-028 AC-028-SECTION-SPACING | `HomePage.tsx:25` `flex flex-col gap-6 sm:gap-[72px]` untouched | PASS | /home gap mechanism preserved |
| 10 | K-030 AC-030-APP-ISOLATION | no changes to `AppPage.tsx` or app-bg | PASS | — |
| 11 | K-031 AC-031-LAYOUT-CONTINUITY | `about-v2.spec.ts:441-467` (measured at re-run: nextElementSibling='footer' + #banner-showcase count=0) | PASS | primary risk — mitigated by Option C per-section root-child tree |
| 12 | K-031 AC-031-SECTION-ABSENT | `about-v2.spec.ts:408-438` #banner-showcase absent | PASS | — |
| 13 | K-034 Phase 1 AC-034-P1-ROUTE-DOM-PARITY | `shared-components.spec.ts:36-56` T1 byte-identity across 4 routes | PASS | Footer.tsx unchanged; `/about` Footer outerHTML byte-identical to `/` |
| 14 | K-034 Phase 2 FileNoBar / arch-pillar | no changes to FileNoBar/ArchPillarBlock (git diff confirmed) | PASS | — |
| 15 | K-034 Phase 3 AC-034-P3-DIARY-FOOTER | `shared-components.spec.ts:105-158` Footer renders on /diary (loading + resolved) | PASS | — |
| 16 | K-040 Footer pairwise ≤32px (actual Δ=0 baseline) | T19 live green — Δ ≤2 at 1280/1440/375 | PASS | Option C root-child pattern makes Footer width = viewport width regardless of route, Δ=0 is structural invariant (not fixture coincidence) — see §Findings N-2 |
| 17 | K-040 Designer Decision Memo §Item 3 (1248+96) | `AboutPage.tsx:22` `max-w-[1248px] sm:px-24` verbatim matches `HomePage.tsx:22` + `DiaryPage.tsx:42` | PASS | cross-page target landed |

All clauses enumerated in design §9 Regression Risk Matrix verified preserved. K-022 AC-022-HERO-TWO-LINE already retired by K-040 2026-04-23 (not a live Sacred) — no conflict with BQ-045-05 Option A 768→1248 hero widening.

---

## Step 1 Breadth Gate (subsumed)

### Commit hygiene (`feedback_separate_commits.md`)

| Commit | Scope | Strictest gate | Gate status |
|---|---|---|---|
| `0b6567d` Phase 1 | `frontend/src/**` + snapshot .png baselines | Full (tsc + Vitest + Playwright E2E) | PASS per Engineer commit msg: tsc exit 0 + subset Playwright 54/54 green; re-verified in this review (tsc exit 0 + about-layout + about-v2 + shared-components green) |
| `55f640c` Phase 3 | `frontend/e2e/**` | Full | PASS per Engineer commit msg: tsc exit 0 + full suite 261 pass + 1 pre-existing flaky + 1 skipped; re-verified here tsc exit 0 + about-layout 15/15 + about-v2 53/53 |
| `4d840f0` Phase 4 | `agent-context/architecture.md` + `docs/retrospectives/engineer.md` + `docs/tickets/K-045-*.md` | docs-only, no gate (correctly marked `[docs-only]`) | PASS |

Each commit is single-purpose, scoped correctly, docs-only split out per gate rules. No mixed-class commits.

### File class gate

Phase 1 + Phase 3 both hit `frontend/src/**` or `frontend/e2e/**` → Full gate required. Engineer commit messages + re-verified in this review:
- `npx tsc --noEmit` exit 0 (confirmed).
- Playwright subset `about-layout.spec.ts` + `shared-components.spec.ts` + `about-v2.spec.ts` = 72/72 green (re-verified combined run).

### Token-retire widened grep sweep (`feedback_reviewer_token_retire_widened_grep`)

This is a refactor-retire ticket (SectionContainer primitive retired). Applied 4-sub-scan:

| Scan | Pattern | Scope | Hit count | Verdict |
|---|---|---|---|---|
| (a) Import / JSX usage | `SectionContainer` | `frontend/src/` | 2 hits — both in comments (`SectionLabelRow.tsx:6` + `AboutPage.tsx:12`) referencing the retirement context, no imports or JSX usage | PASS (comments acceptable as history pointer) |
| (b) Class-name residue | `max-w-5xl\|max-w-3xl` | `frontend/src/` | 0 | PASS |
| (c) Padding residue | `py-16\|py-20` | `frontend/src/components/about/` + `AboutPage.tsx` | 0 | PASS |
| (d) Docs residue | `SectionContainer` | `docs/` + `agent-context/` | Only in historical design docs (K-017/K-022/K-029/K-034 etc.) + the K-045 ticket/design itself (referencing retirement) — all contextual, no live references | PASS |

Architecture.md `primitives/` block correctly shows SectionContainer retirement (L178 trailing comment `SectionContainer.tsx P1 — K-045 2026-04-24 RETIRED (git rm)`). SectionLabelRow.tsx added (L151). No dead doc pointers.

### Git status commit-block gate (`feedback_reviewer_git_status_gate`)

`git status --short` at review time:
```
?? frontend/node_modules
```

`node_modules` is build artifact (not runtime, not commit-scope) — not a commit-blocker per the gate definition. No runtime-scope file (`frontend/src/**`, `frontend/e2e/**`, `frontend/public/**`, config files) is dirty. Gate: PASS (merge-ready when QA + PM sign-off lands).

### Architecture.md self-diff (spot-check of 8 cells from design §X.3)

| Cell | Spec | Verified |
|---|---|---|
| C1 frontmatter updated | Updated with K-045 narrative | ✓ diff shows L5 updated to include K-045 summary |
| C2 Summary bullet | K-045 new bullet added | ✓ diff shows L19 bullet landed |
| C3 L175 SectionContainer removed | `SectionContainer.tsx P1 /about 7 sections 外層 wrap` line deleted | ✓ Directory Structure `primitives/` block shows only `CardShell.tsx` + `ExternalLink.tsx` + parenthetical retirement note |
| C4 CardShell comment | copy-edit | ✓ |
| C5 primitives trailing comment | SectionContainer retirement annotation | ✓ "SectionContainer.tsx P1 — K-045 2026-04-24 RETIRED (git rm)..." present |
| C6 SectionLabelRow line | New entry in about/ block | ✓ `SectionLabelRow.tsx — K-045 2026-04-24 landed` present L151 |
| C7 Frontend Routing /about cell | K-045 narrative appended | ✓ L457 diff confirms |
| C8 Changelog | K-045 prepend | ✓ L654 diff confirms |

Source of truth cross-check: Directory Structure `primitives/` = {CardShell.tsx, ExternalLink.tsx} post-retirement — consistent with `ls frontend/src/components/primitives/` (2 files remaining). about/ block includes SectionLabelRow.tsx — consistent with disk. 8/8 cells accurately reflect real code. PASS.

---

## Findings

### Critical

None.

### Warning

**W-1 — T8 mobile non-overlap assertion is weaker than other hero assertions (small)**

`about-layout.spec.ts:143` asserts `tgBox!.y >= h1Box!.y + h1Box!.height - 1` (tagline top ≥ h1 bottom − 1px tolerance). This is a non-overlap gate but does not assert a minimum separation — a future regression that collapses the role line + divider + tagline so they render *immediately* beneath h1 with 0 gap would still PASS. AC-045-HERO-LINE-COUNT §And clause 4 asserts "no overlap, no negative gap" which the spec honors literally, but the visual intent (Geist Mono 18/16 natural line-height gap ≈ 18 from `gap-[18px]` flex) is weaker than asserted.

**Impact:** low — K-022 AC-022-SECTION-LABEL + K-045 T5/T6/T7 desktop line-heights already lock the hero internal rhythm on the high-traffic viewport. Mobile coverage is a nice-to-have, not a core AC target.

**Suggested fix (Tech Debt, not blocker):** either drop T8 (already covered by T5–T7 at desktop + visual eyeball Phase 2) or tighten to `tgBox!.y >= h1Box!.bottom + 36` (Geist Mono 16/18 × 1.5 line-height ≈ 24-27 × 2 items below h1).

**PM decision requested:** file as TD-K045-02 (reviewer suggestion) or accept-as-is? Reviewer recommends **accept-as-is** — visual-delta is `none` and mobile hero rhythm has no Pencil SOT (Pencil 1440 canvas only). Engineer can tighten if regression shows.

### Nit (informational, no action required)

**N-1 — Duplicate `data-testid="section-label"` selector + `.first()` implicit coupling**

`about-layout.spec.ts:178` T10 uses `page.locator(`#${parentId} [data-testid="section-label"]`).first()`. The scoping is correct (parent ID prefix), but `.first()` assumes a single `data-testid="section-label"` per section. If a future design adds a secondary label (e.g., layer sub-label), this assertion silently picks the first one. Low risk today (SectionLabelRow renders exactly one `<span data-testid>`); record as latent fragility.

**N-2 — T19 Footer pairwise Δ=0 is structural, not fixture coincidence**

Engineer retrospective already notes this. The spec tolerance is `≤2px` (mirrors K-040 pairwise rule), but under Option C per-section root-child pattern, Footer is a direct child of root `<div className="min-h-screen">` on all 3 routes → Footer width = viewport width → Δ is always 0 across routes at the same viewport. The `≤2` tolerance is defense against future layout drift, not current reality. Suggest adding an `invariant:` comment block in the spec describe header citing "Δ=0 structural under per-section root-child pattern; ≤2px defense-in-depth tolerance" to prevent future readers from loosening the gate under an assumption that `~2px` jitter is expected.

**Suggested fix (documentation only):** file as TD-K045-03 or Engineer can edit inline in a follow-up.

---

## Next Step Recommendation

- **Engineer fix-list:** none (0 Critical / 0 actionable Warning — W-1 is accept-as-is per reviewer recommendation; N-1/N-2 are documentation hardening, not blockers).
- **QA release:** proceed. Full-suite regression expected PASS (Engineer already ran 261 pass + 1 pre-existing flaky AC-020-BEACON-SPA not K-045 related, confirmed via `git checkout 00f8ac6` rerun).
- **PM Phase Gate close:** after QA signs off, PM can close Phase 4 and rule on W-1/N-1/N-2 as TD or accept-as-is. Reviewer recommends: W-1 accept-as-is, N-1 + N-2 no-action (documentation hardening that Engineer can include in K-046+ or leave).
- **Deploy:** per K-Line Deploy Checklist 4 steps (verify main synced → scan relative API paths → build → deploy).

