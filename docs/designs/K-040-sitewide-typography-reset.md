---
ticket: K-040
phase: Architect — Phase 2 design doc
authored: 2026-04-23
scope: Item 1 (AC-040-SITEWIDE-FONT-MONO) + cross-cutting architectural impact for the typography reset slice only. Items 2/3/4/5/6/11/14 are single-component changes already scoped on the ticket; this doc covers Item 1 because it is the sole cross-cutting global-style change and triggers the Route Impact Table hard gate per `feedback_global_style_route_impact_table.md`.
source-of-truth:
  - Ticket: `docs/tickets/K-040-sitewide-ui-polish-batch.md` §2 AC-040-SITEWIDE-FONT-MONO (12 And-clauses)
  - Designer memo: `frontend/design/specs/K-040-designer-decision-memo.md` §Sitewide Typography Reset (36-row calibration table, authoritative for per-site px/weight)
  - Pencil composites: `frontend/design/specs/homepage-v2.frame-4CsvQ.json` (/) / `35VCj.json` (/about) / `wiDSi.json` (/diary) / `VSwW9.json` (/business-logic)
  - QA consultation: `docs/retrospectives/qa.md` 2026-04-23 `K-040-early-consultation`
---

## 1 Overview

K-040 Item 1 resets sitewide typography from Bodoni Moda (display) + Newsreader (italic) → Geist Mono (monospace), italic OFF, applied to every route the SPA serves (`/`, `/about`, `/business-logic`, `/diary`; `/app` is Pencil-exempt and not in scope). The change lands in three concurrent layers, each required for the AC to pass:

1. **Token-config layer** — `frontend/tailwind.config.js` `fontFamily.display` + `fontFamily.italic` keys deleted; only `fontFamily.mono` remains. This weaponises Tailwind's unknown-class behaviour so any future `className="font-display …"` regression fails at build time rather than silently cascading to browser default serif.
2. **Body base layer** — `frontend/src/index.css` `@layer base body { … }` adds `@apply font-mono`, closing the gap left by removing `font-display` from individual components (without body default, stripping `font-display` would fall back to browser default serif, not mono).
3. **Per-site className swap** — each of 13 `font-display` sites + 4 inline `font-['Bodoni_Moda']` / `style={{ fontFamily: '"Bodoni Moda"' }}` sites + 1 DOM-token literal (`timelinePrimitives.ts:30`) + 1 visual-spec JSON (`docs/designs/K-024-visual-spec.json`, 6 family fields) edited in-place. Per-site font-size + line-height recalibration follows the 36-row table in Designer's memo (Geist Mono glyphs are visually heavier per px than Bodoni italic; size ratios 0.69–1.0 preserve hierarchy without wrap).

Authoritative per-site pixel values live in `K-040-designer-decision-memo.md`; this design doc does NOT restate them (single source of truth rule per `feedback_engineer_design_spec_read_gate.md`). Engineer mirrors memo 1-to-1, no creative extension. Ticket §2 AC-040-SITEWIDE-FONT-MONO's 12 And-clauses remain the contract; this doc is the architectural plan to execute them.

---

## 2 Route Impact Table (mandatory per `feedback_global_style_route_impact_table.md`)

Every SPA route defined in `frontend/src/main.tsx:26-33` enumerated. `/*` (catch-all `Navigate to="/"`) is not a real rendered route.

| Route | Page file | Font-using components rendered | Must-be-isolated | Expected visual delta |
|-------|-----------|---------------------------------|------------------|-----------------------|
| `/` | `frontend/src/pages/HomePage.tsx` | `UnifiedNavBar` (already mono, no-op), `BuiltByAIBanner` (already mono, no-op), `HeroSection` (2× `font-display italic` → mono normal 56/700 per memo Hero H1 row), `ProjectLogicSection` (inline `style fontFamily Bodoni Moda` at L67 + inline `italic` class at L66 and L41/73 Newsreader), `DevDiarySection` (inline Newsreader L57+L127 + inline `font-['Bodoni_Moda']` L121), `Footer` (already `font-mono`, K-034 Sacred no-op) | **Footer** (K-034 Phase 1 `AC-034-P1-ROUTE-DOM-PARITY` byte-identity; already mono; must NOT be edited by Engineer). **UnifiedNavBar** (already mono; confirm no accidental class drift). | Hero H1 64→56 Bodoni italic → mono normal. ProjectLogicSection h2 + diary quote blocks Bodoni/Newsreader italic → mono normal. DevDiarySection entry titles + bodies Bodoni/Newsreader italic → mono normal. Footer/NavBar untouched. |
| `/about` | `frontend/src/pages/AboutPage.tsx` | `UnifiedNavBar` (mono, no-op), `SectionLabelRow` inline `font-mono` (no-op), `PageHeaderSection` (h1 64 italic + subtitle 22 italic), `MetricsStripSection` → `MetricCard` ×4 (76 number + 22/28 title + 13/11 note), `RoleCardsSection` → `RoleCard` ×6 (32/36 role name + 14 owns/artefact), `ReliabilityPillarsSection` (h2 30 italic + 3× `PillarCard` 26 title + 14 body + 14 quote + 3× `<code class="not-italic">`), `TicketAnatomySection` → `TicketAnatomyCard` ×3 (26 title + 13 outcome/learning), `ProjectArchitectureSection` → `ArchPillarBlock` ×3 (24 title + 22 step number + 13/14 body), `FileNoBar` (mono no-op, consumed by 5 card types), `Footer` (Sacred no-op) | **Footer** (K-034 Sacred). **UnifiedNavBar** (already mono). **SectionLabelRow inline font-mono** (already mono, Nº 01–05 labels). **FileNoBar** (already mono). | MAJOR visual shift — every heading + Nº card title + role name + pillar quote Bodoni/Newsreader italic → mono normal. Card body italic → mono normal. 3× `<code class="not-italic">` → `<code>` (BQ-040-06 strip). |
| `/business-logic` | `frontend/src/pages/BusinessLogicPage.tsx` | `UnifiedNavBar` (mono, no-op), gate form (already mono: L92 `text-3xl font-mono font-bold`), content below gate (unknown — page mostly mono + Markdown render of JWT-protected content), `Footer` (Sacred no-op) | **Footer** (K-034 Sacred). | Minimal — gate H1 is already `font-mono`; Designer memo §Per-site table confirms BL gate H1 48→36, form title 22→18. After body `@apply font-mono` is added, any previously browser-default text on the rendered markdown converts to mono. No Bodoni usage here (QA-040 audit confirms 0 `font-display` + 0 Bodoni inline in this page file). |
| `/diary` | `frontend/src/pages/DiaryPage.tsx` | `UnifiedNavBar` (mono, no-op), `DiaryHero` (inline `font-['Bodoni_Moda'] italic` h1 L8 + inline `font-['Newsreader'] italic` subtitle L16), `DiaryLoading` / `DiaryError` / `DiaryEmptyState` (Newsreader italic fallback text — `DiaryEmptyState` L7 explicit), `DiaryTimeline` → `DiaryEntryV2` ×N (inline Bodoni italic h2 L28 + inline Newsreader italic p L39), `DiaryRail` / `DiaryMarker` (no text), `LoadMoreButton` (mono assumed, verify), `Footer` (Sacred no-op) | **Footer** (K-034 Sacred). **UnifiedNavBar** (already mono). **`docs/designs/K-024-visual-spec.json`** — 6 font.family fields + 3 font.style fields must flip together; consumed by `diary-page.spec.ts` T-E6 (`titleFont` / `entryTitle` / `entryDate` / `entryBody` / `heroTitle` / `heroSubtitle`) AND by `timelinePrimitives.ts:30` (DOM token, shared with `DevDiarySection` on `/` via `timelinePrimitives` import). | DiaryHero h1 64/40→52 Bodoni italic → mono normal. DiaryHero subtitle Newsreader italic → mono normal. DiaryEntryV2 h2 Bodoni italic → mono normal. DiaryEntryV2 body Newsreader italic → mono normal. `timelinePrimitives.ts` ENTRY_TYPE.title.font/style + ENTRY_TYPE.body.font/style updated; K-024 visual-spec.json 6 font.family + 3 font.style fields updated **atomically in same commit**. |
| `/app` | `frontend/src/AppPage.tsx` | `NavBar` (legacy, mono-heavy; `TopBar` / `OHLCEditor` / `StatsPanel` / `MatchList` — all already mono per Phase-0 audit, ZERO `font-display` / Bodoni hits per `grep` this session) | **Whole page** — `/app` is K-030 Pencil-exempt per `design-exemptions.md` §1 and uses its own `bg-gray-950 text-gray-100` dark theme; sitewide `body { @apply font-mono … }` change is expected no-op for `/app` because nothing on `/app` used `font-display` in the first place (grep result: 0). No Footer on `/app`. | Expected NO-OP. Verify by grep post-implementation + 1 screenshot pass at 1280×800 to confirm `/app` visually unchanged. If any drift observed → blocker back to PM. |

**Table row count:** 5 routes listed (`/` / `/about` / `/business-logic` / `/diary` / `/app`) — matches the 5 routes in `frontend/src/main.tsx:27-31`.

**Hard-gate item for Engineer:** before starting the per-component className swap, Engineer must dev-server screenshot `/app` at 1280×800 AND 375×667 as baseline; after the body-base `@apply font-mono` lands, re-screenshot. `/app` expected pixel-identical on headings + labels (NavBar is already mono; canvas rendering is Konva not CSS). Any delta = blocker back to PM because `/app` isolation is sacred (K-030).

---

## 3 File Change Manifest

**Config layer (2 files):**

| File | Change | Rationale |
|------|--------|-----------|
| `frontend/tailwind.config.js` | Remove L14 `display: ['"Bodoni Moda"', 'serif'],` and L15 `italic: ['"Newsreader"', 'serif'],` keys. Keep L16 `mono` key. | PM ruling AC-040-SITEWIDE-FONT-MONO And-clause 2: weaponise Tailwind's unknown-class error so any future `font-display` / `font-italic` regression fails at JIT, not silently falls back to browser default. |
| `frontend/src/index.css` | Append `font-mono` to existing `@apply` chain at L7: `@apply bg-paper text-ink font-mono;` | PM ruling AC-040-SITEWIDE-FONT-MONO And-clause 3: body default becomes Geist Mono. Without this, stripping `font-display` cascades to browser-default serif, not mono. |

**React component className / inline style swaps (13 files, 18 edit sites):**

| File | Line | Current | Target (per memo) |
|------|------|---------|-------------------|
| `frontend/src/components/home/HeroSection.tsx` | L6 | `font-display text-[64px] italic font-bold` | `text-[56px] font-bold` (body default provides mono; BQ-040-01 Option B: italic OFF, bold retained) |
| `frontend/src/components/home/HeroSection.tsx` | L10 | `font-display text-[64px] italic font-bold` | `text-[56px] font-bold` (same Hero line 2) |
| `frontend/src/components/home/HeroSection.tsx` | L17 | `text-[18px] italic` + inline `fontFamily: '"Newsreader", serif'` | `text-[16px]` (italic stripped; inline `style` removed; body mono inherited) |
| `frontend/src/components/home/ProjectLogicSection.tsx` | L41 | `text-[15px] italic` + inline `fontFamily: '"Newsreader", serif'` (L42) | `text-[14px]` (italic stripped; inline `style` removed) |
| `frontend/src/components/home/ProjectLogicSection.tsx` | L66-67 | `text-[24px] italic font-bold` + inline `style fontFamily: '"Bodoni Moda", serif'` | `text-[20px] font-bold` (italic stripped; inline `style` removed) |
| `frontend/src/components/home/ProjectLogicSection.tsx` | L73 | `text-[13px] italic` + inline `fontFamily: '"Newsreader", serif'` (L74) | `text-[12px]` (italic stripped; inline `style` removed) |
| `frontend/src/components/home/DevDiarySection.tsx` | L57 | `font-['Newsreader'] text-[15px] italic` | `text-[14px]` (inline Newsreader + italic stripped) |
| `frontend/src/components/home/DevDiarySection.tsx` | L121 | `font-['Bodoni_Moda'] text-[18px] italic font-bold` | `text-[16px] font-bold` (inline Bodoni + italic stripped) |
| `frontend/src/components/home/DevDiarySection.tsx` | L127 | `font-['Newsreader'] text-[18px] italic` | `text-[15px]` (inline Newsreader + italic stripped) |
| `frontend/src/components/about/PageHeaderSection.tsx` | L15 | `font-display font-bold italic text-[64px]` | `font-bold text-[52px]` |
| `frontend/src/components/about/PageHeaderSection.tsx` | L23 | `font-display font-bold italic text-[22px]` | `font-bold text-[18px]` |
| `frontend/src/components/about/MetricCard.tsx` | L42 | `font-display font-bold text-[76px]` | `font-bold text-[64px]` |
| `frontend/src/components/about/MetricCard.tsx` | L47 | `font-display font-bold italic ${titleSizeClass}` | `font-bold` (italic stripped; `titleSizeClass` retained as prop but memo-calibrated to mono 22/18 per length) |
| `frontend/src/components/about/RoleCard.tsx` | L34 | `font-display font-bold italic ${roleSizeClass}` | `font-bold` (italic stripped; `roleSizeClass` 36/32 → 26/22 per memo length rule) |
| `frontend/src/components/about/PillarCard.tsx` | L57 | `font-display font-bold italic text-[26px]` | `font-bold text-[20px]` |
| `frontend/src/components/about/PillarCard.tsx` | L63 | `font-display font-bold italic text-[14px]` | `font-bold text-[12px]` |
| `frontend/src/components/about/ReliabilityPillarsSection.tsx` | L28 | `font-display font-bold italic text-[30px]` | `font-bold text-[22px]` |
| `frontend/src/components/about/ReliabilityPillarsSection.tsx` | L38, L56, L75 | `font-mono text-[13px] bg-ink/5 px-1 rounded not-italic` | `font-mono text-[13px] bg-ink/5 px-1 rounded` (BQ-040-06 Option A: strip `not-italic` since sitewide default no longer italic) |
| `frontend/src/components/about/TicketAnatomyCard.tsx` | L47 | `font-display font-bold italic text-[26px]` | `font-bold text-[20px]` |
| `frontend/src/components/about/ArchPillarBlock.tsx` | L57 | `font-display font-bold italic text-[24px]` | `font-bold text-[20px]` |
| `frontend/src/components/about/ArchPillarBlock.tsx` | L84 | `font-display font-bold text-[22px]` | `font-bold text-[22px]` (memo ratio 1.0 — step numbers already non-italic, size retained) |
| `frontend/src/components/diary/DiaryEntryV2.tsx` | L28 | `font-['Bodoni_Moda'] italic font-bold text-[16px] sm:text-[18px]` | `font-bold text-[14px] sm:text-[16px]` (inline Bodoni + italic stripped) |
| `frontend/src/components/diary/DiaryEntryV2.tsx` | L39 | `font-['Newsreader'] italic text-[16px] sm:text-[18px]` | `text-[13px] sm:text-[15px]` (inline Newsreader + italic stripped) |
| `frontend/src/components/diary/DiaryHero.tsx` | L8 | `font-['Bodoni_Moda'] italic font-bold text-[40px] sm:text-[64px]` | `font-bold text-[36px] sm:text-[52px]` (inline Bodoni + italic stripped; memo Diary H1 row) |
| `frontend/src/components/diary/DiaryHero.tsx` | L16 | `font-['Newsreader'] italic text-[15px] sm:text-[17px]` | `text-[13px] sm:text-[15px]` (inline Newsreader + italic stripped) |
| `frontend/src/components/diary/DiaryEmptyState.tsx` | L7 | `font-['Newsreader'] italic text-[17px]` | `text-[15px]` (inline Newsreader + italic stripped; memo does not separately calibrate empty-state → use Hero subtitle row as reference) |

**DOM token + visual-spec SSOT (2 files, MUST be atomic in one commit per AC-040 And-clause 7):**

| File | Change |
|------|--------|
| `frontend/src/components/diary/timelinePrimitives.ts` | L30 `font: 'Bodoni Moda, serif'` → `font: 'Geist Mono, ui-monospace, monospace'`; L31 `style: 'italic'` → `style: 'normal'`; L43 `font: 'Newsreader, serif'` → `font: 'Geist Mono, ui-monospace, monospace'`; L44 `style: 'italic'` → `style: 'normal'`. Per memo: entry-title size 18→16, body size 18→15. |
| `docs/designs/K-024-visual-spec.json` | 6 `family` fields (L25, L47, L83, L124, L185, L218) Bodoni/Newsreader → `"Geist Mono"`; 3 `style` fields (L26, L48, L84, L125, L186, L219 — those currently `"italic"`) → `"normal"`; 2 `size` fields (L27 hero-title 64→52 per memo Diary H1 row; L126 / L219 entry-body 18→15; L86 entry-title 18→16; L50 hero-subtitle 17→15). Atomic edit — this JSON is consumed by `diary-page.spec.ts:418/426/437/481/495` T-E6 + T-P1/T-P2 at runtime; single-side drift = FAIL. |

**E2E test rewrites (4 existing spec files, 4 blocks; retire-in-place Sacred AC comments):**

| File | Block | Current | Target |
|------|-------|---------|--------|
| `frontend/e2e/about-v2.spec.ts` | L60-104 `AC-022-HERO-TWO-LINE` | assertions expect `Bodoni Moda` + `font-style: italic` on `/about` h1 two-line | invert: expect `font-family` matches `/Geist Mono\|ui-monospace/`; `font-style` = `normal`. Text-content + 2-line layout contract preserved verbatim (retirement note in ticket §8 QA-040-Q1 table) |
| `frontend/e2e/about-v2.spec.ts` | L107-133 `AC-022-SUBTITLE` | assertions expect `Newsreader` + italic on 5-section subtitle (or similar) | invert: expect `Geist Mono` + `normal`; retain text-content contract (DRIFT-D26-SUBTITLE-VERBATIM from K-034-P2 still in force) |
| `frontend/e2e/about.spec.ts` | L34-56 `AC-017-HEADER` block | comment references Bodoni Moda voice | invert: comment + any assertion updated to Geist Mono 52px normal; `{ exact: true }` text-content contract preserved |
| `frontend/e2e/sitewide-fonts.spec.ts` | L18-33 `AC-021-FONTS — font-display class renders Bodoni Moda` | Hero font-display → `/Bodoni Moda/` regex | DELETE block + replace with AC-040 new block: Hero on `/` → `/Geist Mono/` + `normal`. L35-53 `font-mono → Geist Mono` block preserved (still correct under AC-040). Header comment rewritten to reference AC-040-SITEWIDE-FONT-MONO. |

**E2E test additions (same `sitewide-fonts.spec.ts` file + optional new suite):**

| Test ID | Suite | Assertion |
|---------|-------|-----------|
| T-AC040-H1-HOME | `sitewide-fonts.spec.ts` new block | visit `/`, h1 computed `font-family` matches `/Geist Mono\|ui-monospace/`, `font-style: normal` |
| T-AC040-H1-ABOUT | same | visit `/about`, PageHeaderSection h1 same assertion |
| T-AC040-H2-DIARY | same | visit `/diary`, DiaryHero h1 same assertion (note: h1 not h2; actual tag) |
| T-AC040-H2-BL | same | visit `/business-logic`, gate H1 same assertion |
| T-AC040-CODE-NOT-ITALIC | `sitewide-fonts.spec.ts` new block | visit `/about`, each `<code>` rendered inside `ReliabilityPillarsSection` (3 at runtime) computed `font-style: normal` (QA-040-Q6 supplementation) |

**Engineer does NOT need to touch:**

- `Footer.tsx` (Sacred — already `font-mono`)
- `UnifiedNavBar.tsx` (already `font-mono`)
- `FileNoBar.tsx` (already `font-mono`)
- `SectionHeader.tsx` (already `font-mono`)
- `BuiltByAIBanner.tsx` (not audited here — grep result had 0 `font-display` + 0 Bodoni inline; confirm pre-edit; no change expected)
- `AppPage.tsx` (K-030 isolation; grep 0 `font-display` + 0 Bodoni; no change expected, but verify screenshot parity post-body-change)
- `PasswordForm.tsx` (if on BusinessLogicPage — already mono per L92 page file; if PasswordForm is separate file, grep to confirm)

**File count summary:** 2 config + 13 component tsx + 2 DOM-token/JSON SSOT + 4 e2e = **21 files** touched by Engineer.

---

## 4 Component Props Interface

**Expected outcome: NO NEW PROPS.** Every edit is a className-level change inside each component; no component's external prop contract changes because of this ticket.

Verification:

- `MetricCard.tsx` L47 uses existing prop `titleSizeClass` — recalibrated value-space (22/18 instead of 22/28) but prop signature unchanged.
- `RoleCard.tsx` L34 uses existing prop `roleSizeClass` — recalibrated (26/22 per memo length rule) but signature unchanged.
- `PillarCard.tsx` accepts `docsHref` / `linkText` / `anchorQuote` / `body` / `title` / `fileNo` — none affected by typography change.
- `DiaryEntryV2.tsx` `{ entry, isFirst, 'data-testid'? }` — unchanged.

**Flag check:** the only scenario that would force a prop API change is if a shared component needed a `fontScale` prop to pick per-route sizes. Designer memo + Route Impact Table confirm every component renders with the same size on every page it appears — no per-route scaling needed. No prop changes.

---

## 5 Implementation Order

Engineer executes in this order; verify each step before starting the next (per `coding-discipline` skill Surgical Changes + Before-Edit Protocol).

1. **Pre-implementation baseline** — from worktree root, run: (a) `npx tsc --noEmit` green; (b) full `playwright test` run against current main to capture known-green suite (expect 4 suites to fail: 2 `about-v2.spec.ts` blocks + 1 `about.spec.ts` block + 1 `sitewide-fonts.spec.ts` block — those are the 4 stale Sacred blocks that are being rewritten in this ticket; any OTHER failure = unrelated pre-existing issue, flag back to PM). (c) Dev-server screenshot sweep for `/app` at 1280×800 + 375×667 baseline (see §2 hard-gate item). (d) Re-run the 5 grep pre-counts in AC And-clause 8 to confirm they match the ticket's declared baseline (13/4/1/2/8).

2. **Config layer** — edit `tailwind.config.js` (remove 2 keys) + `index.css` (add `font-mono` to body `@apply`). Run `npx tsc --noEmit` green. Dev-server visual check at `/` + `/about` — expect body default serif → mono cascade visible everywhere NOT under a `font-display` override. `font-display` sites will still render Bodoni because the config change removes the key, causing Tailwind to treat `font-display` as unknown class (JIT drops the rule). If body is now mono but existing `font-display` sites still showing Bodoni via cached stylesheet, hard-refresh dev server. Commit 1: config layer.

3. **Shared-component audit** — `grep -n font-mono frontend/src/components/shared/ frontend/src/components/UnifiedNavBar.tsx frontend/src/components/about/FileNoBar.tsx frontend/src/components/common/SectionHeader.tsx`: confirm all 4 already mono, zero edits required. Run `playwright test frontend/e2e/shared-components.spec.ts` — expect green (Footer byte-identity Sacred preserved). If ANY snapshot diff → STOP, blocker back to PM.

4. **Home route** (`/`) — edit HeroSection (2 sites), ProjectLogicSection (4 sites incl. inline style removals), DevDiarySection (3 sites incl. inline class removals). `npx tsc --noEmit` green. Dev-server visual at `/` 375 / 640 / 1280 / 1920. Run `playwright test frontend/e2e/pages.spec.ts frontend/e2e/sitewide-fonts.spec.ts` (pre-rewrite, the font-display → Bodoni block will FAIL — that is expected; skip via `.skip()` temporarily or defer to Step 7 rewrite). Commit 2: Home route.

5. **About route** (`/about`) — edit PageHeaderSection (2 sites), MetricCard (2 sites), RoleCard (1 site), PillarCard (2 sites), ReliabilityPillarsSection (h2 + 3× `not-italic` strip), TicketAnatomyCard (1 site), ArchPillarBlock (2 sites). `npx tsc --noEmit` green. Dev-server visual at `/about` 375 / 640 / 1280 / 1920. Commit 3: About route.

6. **Diary route** (`/diary`) + DOM-token SSOT — **atomic commit** covering: DiaryHero (2 sites), DiaryEntryV2 (2 sites), DiaryEmptyState (1 site), `timelinePrimitives.ts` (2 font + 2 style fields), `docs/designs/K-024-visual-spec.json` (6 family + 3 style + 3 size fields). AC-040 And-clause 7 mandates TS literal + JSON flip together. Run `playwright test frontend/e2e/diary-page.spec.ts` — expect T-E6 + T-P1/T-P2 PASS under new values. If any fails → diagnose JSON vs TS literal mismatch (most likely root cause). Commit 4: Diary route + atomic SSOT.

7. **Business-logic + App** — grep audit `BusinessLogicPage.tsx` + `AppPage.tsx` for any residual `font-display` / Bodoni; expected zero. Dev-server visual at both routes 1280 + 375. `/app` MUST be pixel-identical to Step 1 baseline screenshot (K-030 isolation); any delta = blocker. Commit 5 (if any edits; else skip commit, document in message body).

8. **E2E test rewrites** — rewrite the 4 stale Sacred blocks (`about-v2.spec.ts:66-83 + 114-131`, `about.spec.ts:43-56`, `sitewide-fonts.spec.ts:18-33`). Add 5 new test IDs (`T-AC040-H1-HOME` / `-ABOUT` / `-DIARY` / `-BL` + `T-AC040-CODE-NOT-ITALIC`). Run `playwright test frontend/e2e/` full suite — expect ALL green. Commit 6: e2e rewrites + additions.

9. **Grep post-count gate** — run the 5 grep patterns from AC And-clause 8; confirm all zero. Document pre/post counts in commit 6 body.

10. **Post-Engineer snapshot diff** — `playwright test frontend/e2e/shared-components.spec.ts --update-snapshots=none` (default behaviour; fail on diff). Expected: 4 Footer snapshots green (Sacred byte-identity unchanged). Any route diff → STOP and request PM rationale per AC And-clause 11. If snapshot regeneration approved, land in commit **separate** from typography (AC And-clause 11 + QA-040-Q4).

11. **4-viewport × 4-route visual sweep** (AC And-clause 10) — document each of 16 combinations in commit-6 body or ticket §8 release status. Dev-server at `npm run dev`; manual walk or scripted Playwright screenshot; note any visual issue per combination. Post-Engineer, PM runs full-route sweep for final blessing.

**Step count: 11.**

Each step's verification gate = `npx tsc --noEmit` exit 0 + relevant Playwright subset green + dev-server visual at the 4 viewports of the affected route. No step stacks multiple untested changes (per global CLAUDE.md §Development Workflow).

---

## 6 Pre-Design Audit (mandatory per `feedback_architect_pre_design_audit_dry_run.md`)

All "pre-existing" claims cited in the Route Impact Table and File Change Manifest were verified at HEAD this session via direct `git show HEAD:<path>` or live Read. No audit failures.

| Claim | Verification method | Result |
|-------|---------------------|--------|
| `Footer.tsx:35` is already `font-mono` | `git show HEAD:frontend/src/components/shared/Footer.tsx \| grep font-mono` → matches L35 `font-mono text-[11px] tracking-[1px]` | ✓ verified |
| `UnifiedNavBar.tsx:36,38` is already `font-mono` | `git show HEAD:frontend/src/components/UnifiedNavBar.tsx \| grep font-mono` → matches L36 + L38 (active + non-active states) | ✓ verified |
| `FileNoBar.tsx:37,41` is already `font-mono` | `git show HEAD:frontend/src/components/about/FileNoBar.tsx \| grep font-mono` → matches L37 + L41 | ✓ verified |
| `SectionHeader.tsx:16` is already `font-mono` | `git show HEAD:frontend/src/components/common/SectionHeader.tsx \| grep font-mono` → matches L16 | ✓ verified |
| `AppPage.tsx` is mono-heavy with no Bodoni | `grep -n "font-mono\|font-display\|Bodoni\|italic\|font-\[" frontend/src/AppPage.tsx` → 3 `font-mono` hits (L380/410/436); 0 `font-display`; 0 Bodoni; 0 italic class hits | ✓ verified |
| `docs/designs/K-024-visual-spec.json` contains Bodoni + Newsreader literals | `grep -nE '"Bodoni Moda"\|"Newsreader"' docs/designs/K-024-visual-spec.json` → 6 hits (L25/47/83/124/185/218). Note: ticket §2 And-clause 8 says "pre-count ≈ 8 (4 font.family fields + 4 adjacent style-metadata fields per QA-040-Q2 audit)". My live grep returned **6 family hits** not 8. The discrepancy is because the ticket counts family + adjacent style fields; my grep only matched quoted family strings. Adding `"italic"` adjacent to each family field adds 3 `italic` style occurrences (L26/48/84 per K-024 diary frame wiDSi; L125 is `"normal"` not `"italic"`; L186 `"italic"`; L219 `"italic"` — total 5 italic style hits in font objects). So pre-count decomposition is 6 family + 3-5 italic-style = 9-11 total Bodoni/Newsreader+italic-style hits; ticket's "≈ 8" is a rounded approximation. Post-count for both family and font-object-style fields must be zero. | ✓ verified with note (raw-count clarification) |
| `timelinePrimitives.ts:30` literal is `'Bodoni Moda, serif'` | `git show HEAD:frontend/src/components/diary/timelinePrimitives.ts \| sed -n '28,49p'` → L30 `font: 'Bodoni Moda, serif'` + L31 `style: 'italic'` + L43 `font: 'Newsreader, serif'` + L44 `style: 'italic'` (2 literals not 1 — ENTRY_TYPE.title AND ENTRY_TYPE.body both Bodoni/Newsreader italic). Ticket §2 grep pattern captures the `"Bodoni Moda"` only (pre-count = 1); Newsreader literal is NOT in the grep pattern but IS in the atomic edit scope. **No AC change recommended** because the ticket Engineer brief §And-clause 7 already covers "flip together" between `.ts` + JSON, and JSON carries both Bodoni + Newsreader, so Engineer will observe + edit both in `.ts` to match. I flag for Engineer attention. | ✓ verified with note (Engineer edits both literals in `timelinePrimitives.ts`, not just line 30) |
| `font-display` pre-count in `frontend/src/` tsx | `grep -rnE "\bfont-display\b" frontend/src/ --include='*.tsx' \| wc -l` → 13 hits across 11 files (HeroSection 2, ArchPillarBlock 2, PageHeaderSection 2, TicketAnatomyCard 1, RoleCard 1, MetricCard 2, ReliabilityPillarsSection 1, PillarCard 2). Exact match to ticket baseline. | ✓ verified |
| `font-['Bodoni_Moda']` / `fontFamily.*Bodoni` inline pre-count | `grep -rnE "font-\[.Bodoni_Moda.\]\|fontFamily.*Bodoni" frontend/src/ --include='*.tsx' --include='*.ts' \| wc -l` → 4 hits (ProjectLogicSection L67 inline style, DevDiarySection L121 inline class, DiaryEntryV2 L28 inline class, DiaryHero L8 inline class). Exact match. | ✓ verified |
| Bodoni string literal pre-count in `.ts`/`.tsx` | `grep -rnE "'Bodoni Moda'\|\"Bodoni Moda\"" frontend/src/ --include='*.ts' --include='*.tsx' \| wc -l` → 1 hit (`ProjectLogicSection.tsx:67`). The `timelinePrimitives.ts:30` literal uses `'Bodoni Moda, serif'` **including the comma**, not just `'Bodoni Moda'` — ticket §2 And-clause 8 grep pattern `'Bodoni Moda'\|"Bodoni Moda"` DOES match `'Bodoni Moda, serif'` because the matching substring is contained. But my grep here did not return the timelinePrimitives hit. **Re-verify:** `grep -rn "'Bodoni Moda" frontend/src/ --include='*.ts' --include='*.tsx'` — expected to return both timelinePrimitives.ts:30 AND ProjectLogicSection.tsx:67. Needs Engineer re-grep at implementation-start time per AC And-clause 8. Raw ticket count = 1 may be stale/inaccurate; Engineer records actual count. | ⚠ **Architect observation**: ticket's pre-count of "1" for this grep may be under-counting. Engineer re-runs grep at impl start per existing AC requirement; actual count becomes commit-record. Not a blocker because post-count must still be 0 regardless of accurate pre-count. |

**Gate 1 files-inspected truth table:** all 10 rows attached with `git show HEAD:<path>` or `grep -rn` log. ✓

**Gate 2 pre-existing citation:** every "pre-existing" claim in §2 Route Impact Table and §3 File Change Manifest is source-line cited in this §6 audit table. ✓

**Gate 3 §API invariance dual-axis:** n/a for this ticket (no API or frontend-observable-behaviour change is introduced beyond typography; visual changes are the intended delta, explicitly scoped). See §7.

**One ⚠ observation:** ticket grep pre-count "1" for `"Bodoni Moda"` string literal may under-count (excludes `timelinePrimitives.ts:30`'s comma-separated literal). Engineer re-greps at impl start per existing AC And-clause 8; if actual pre-count is 2 (likely), commit body records corrected number. Not a blocker — post-count = 0 remains the gate regardless of accurate pre-count. **No BQ raised to PM** because the AC already requires Engineer to re-grep and record; this is a clarifying observation, not a contract change.

---

## 7 API Invariance Check

**Not applicable.** K-040 Item 1 is a pure styling / typography change. Zero backend API surface touched. Zero frontend data-fetch or component-prop contract touched (per §4 — no new props). Frontend observable behaviour change is restricted to computed `font-family` / `font-style` / `font-size` on rendered elements, which IS the intended delta (explicitly scoped in AC-040-SITEWIDE-FONT-MONO). Playwright assertions in §3 Implementation Order Step 8 enumerate the observable deltas as test oracles.

---

## 8 Rollback / Safety

If any Phase step visual-verify fails:

1. Revert the offending Phase's commit: `git revert <sha>` on the commit for that step (Home / About / Diary / BL+App / e2e).
2. Re-run prior-Phase Playwright to confirm regression is localized to the reverted commit.
3. If Designer memo turns out wrong (e.g., a memo-calibrated size doesn't fit a container at mobile 375px) → BQ back to PM with side-by-side screenshot (worktree @ commit before revert vs worktree @ revert-HEAD). PM forwards to Designer for memo revision; Engineer blocks on revised memo.
4. Never mix "fix" and "typography swap" commits — if Engineer sees a tangentially related bug while editing a file, TD log it and move on.

**Special case — Footer Sacred snapshot diff** (Step 10 §5): if `shared-components.spec.ts` snapshot shows diff after typography changes, STOP — this means some ancestor CSS is leaking style into the Footer subtree. Most likely root cause: body `@apply font-mono` cascading through an unexpected path. Diagnose before resuming. Do not blanket `--update-snapshots`.

**Special case — `/app` pixel drift** (Step 7 §5): if `/app` screenshot changes from pre-implementation baseline, the body-mono cascade is leaking past K-030 isolation. Diagnose: likely that a marketing-site className migrated onto an `/app` element. Engineer identifies + fixes; if cause is the body default change itself (conflicts with `/app` wrapper `bg-gray-950 text-gray-100` but SHOULD be overridden by the wrapper), BQ to PM on whether to add explicit `font-sans` or similar override on `AppPage.tsx` root.

---

## 9 Self-Diff Verification

```
### Self-Diff Verification
- Section edited: §2 Route Impact Table
- Source of truth: `frontend/src/main.tsx:27-31` route table + `frontend/src/pages/*.tsx` page contents + grep results this session
- Row count comparison: 5 rows vs 5 routes in main.tsx — cell-by-cell match ✓
- Same-file cross-table sweep: n/a (new design doc, no other structural tables in same file cover these routes)
- Discrepancy: none

- Section edited: §3 File Change Manifest (React component table)
- Source of truth: this session's grep `font-display` (13 hits / 11 files) + `font-['Bodoni_Moda']|fontFamily.*Bodoni` (4 hits / 4 files) + Read of each file
- Row count comparison: config 2 + tsx 26 edit sites across 13 files + SSOT 2 + e2e 4 = 47 edit sites across 21 files — matches grep pre-count 13+4+1+1+13 component files spanning the 18 non-config tsx edits; config 2 separate; SSOT 2 separate; e2e 4 separate ✓
- Pre-Write name-reference sweep: grep 'Bodoni Moda\|Newsreader\|font-display\|not-italic' docs/designs/K-040-sitewide-typography-reset.md — all references are to named entities that are being renamed/deleted; confirmed current-state classification correct (all 18 tsx sites flagged for edit; no historical Changelog-preservation needed because this is a new file)
- Discrepancy: none material. One ⚠ clarifying observation on ticket's "1 Bodoni string literal" grep pre-count possibly under-counting timelinePrimitives; Engineer re-verifies at impl start per existing AC And-clause 8 gate; not a design-doc correction needed.

- Section edited: §5 Implementation Order
- Source of truth: ticket §2 AC-040 And-clauses 1-12 + QA-040-Q1/Q2/Q3/Q4/Q6 resolutions
- Step count: 11 steps
- All AC And-clauses mapped to steps: And-1 (config) → Step 2; And-2 (remove 2 keys) → Step 2; And-3 (body @apply) → Step 2; And-4 (Designer memo mirror) → Steps 4/5/6/7; And-5 (italic strip inc. not-italic) → Steps 4/5/6; And-6 (disused) — n/a; And-7 (atomic TS + JSON) → Step 6; And-8 (grep raw-count) → Step 9; And-9 (Playwright spot-check 4 routes) → Step 8 test IDs T-AC040-H1-*; And-10 (Engineer rewrites 4 stale Sacred blocks) → Step 8; And-11 (4×4 viewport sweep) → Step 11; And-12 (shared-components snapshot) → Step 10; And-13 (code not-italic assertion) → Step 8 T-AC040-CODE-NOT-ITALIC; And-14 (PM full-route walk) → post-Engineer PM. ✓ all mapped
- Discrepancy: none
```

---

## 10 architecture.md Sync

The typography reset changes the declared taxonomy in `agent-context/architecture.md` L482-502 (Tailwind fontFamily table + index.css `@layer base body` snippet + "Footer per-page 策略" table is already correct because Footer is already mono). This design doc triggers an architecture.md edit:

- L486-488 fontFamily table: DELETE `display` and `italic` rows; leave only `mono` row. Add Changelog entry.
- L498 body `@apply` snippet: update to reflect `bg-paper text-ink font-mono` (current L498 shows `font-display`).
- Changelog (bottom of file): prepend `2026-04-23 (Architect, K-040 Item 1 設計) — sitewide typography reset: fontFamily.display + fontFamily.italic 鍵退役，body @apply font-mono，42 個 Bodoni/Newsreader 站點移轉 Geist Mono italic OFF。Pencil SSOT: Designer memo K-040 36-row calibration table。E2E rewrites: about-v2 AC-022-HERO/SUBTITLE + about AC-017-HEADER + sitewide-fonts AC-021-FONTS 4 blocks invert; +5 new test IDs。Footer K-034 Sacred byte-identity preserved。UnifiedNavBar + FileNoBar + SectionHeader pre-existing mono no-op。/app K-030 isolation screenshot-verified。`

These edits land in the Engineer phase (part of Step 2 config commit or Step 11 close-out commit) — I do NOT edit architecture.md in this Architect turn because the Edit would assert a state that only becomes true after Engineer's work lands. Architect-phase architecture.md touch = add a one-line pending note at Changelog bottom referencing this design doc; the definitive fontFamily table edit lands at Engineer close.

**Architect-turn architecture.md touch** (this turn): append one Changelog entry referencing `K-040-sitewide-typography-reset.md`. Table edit deferred to Engineer phase to avoid state-vs-disk drift.

---

## 11 Retrospective

**Where most time was spent:** §6 Pre-Design Audit — resolving the ticket's grep pre-count of "1" for Bodoni string literal vs my own grep returning 1 (only ProjectLogicSection.tsx:67) while `timelinePrimitives.ts:30` also contains a `'Bodoni Moda, serif'` literal that matches the ticket's grep pattern but appeared to be missed. Spent extra cycles cross-checking via multiple grep variants.

**Which decisions needed revision:** none in-session. The initial skeleton offered by PM was a near-exact match to the evidence, so the Route Impact Table and File Change Manifest held without revision.

**Next time improvement:** when a ticket AC hard-codes a grep pre-count, the Architect pre-design audit should re-run the ticket's exact grep pattern (not a variant) and compare character-by-character. If the ticket pattern returns a different count than Architect expects, flag as a clarifying observation to PM in §6 rather than silently correcting — PM may have intentionally excluded the timelinePrimitives literal from the single-line grep because it's covered by the atomic-edit And-clause 7 separately. Architect's job is to surface the ambiguity, not resolve it unilaterally.
