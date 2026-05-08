---
id: K-023
title: Homepage structure detail alignment with design v2 (5 items)
status: closed
type: feat
priority: medium
created: 2026-04-20
closed: 2026-04-21
qa-early-consultation: completed-2026-04-21
---

## Background

After K-017 AC-017-HOME-V2 completed the Homepage v2 (`<DiaryTimelineEntry>` + basic hpHero / hpLogic / hpDiary rendering), PM on 2026-04-20 cross-checked the Pencil design v2 (`Homepage v2 Dossier` frame `4CsvQ`) against the Playwright visual report line by line and found the Homepage still has 5 structural-detail mismatches that need alignment.

**B-2 left arrow withdrawal:** The original memory mistakenly recorded "implementation has an extra left arrow"; in reality `DevDiarySection.tsx:99` is `— View full log →` with no left arrow, so **no mismatch**, removed from this ticket.

**Full ruling record:** memory `project_k017_design_vs_visual_comparison.md` (2026-04-20)

## Dependencies

- **Depends on K-021** (sitewide design system foundation): all UI assertions in this ticket reference the Tailwind tokens / three-font system / NavBar / Footer delivered by K-021
- This ticket cannot start Engineer implementation until K-021 is released
- **Token usage alignment (PM ruling Q2 2026-04-20):** K-021 defines two coexisting colors `brick = #B43A2C` (hero/title magenta) and `brick-dark = #9C4A3B` (hover/active variant). This ticket's A-2 Diary marker uses `brick-dark`, A-4 Hero subtitle second-line magenta uses `brick` — usage division aligns with K-021's decision table. If Engineer is unsure which class to pick during implementation, follow K-021 ticket's "design decision log" table.

## Scope (5 structural alignments)

In:

### A-2 Diary bullet rectangular brick-red marker
The marker on the left of each `<DiaryTimelineEntry>` in Homepage's `hpDiary` section changes to a rectangular brick red (`20×14px` rectangle, `#9C4A3B` = `brick-dark` color)

### A-3 Step card header bar
Each Step card top in Homepage `hpLogic` section (4-step flow / 3-step flow) gets a header bar:
- Background `#2A2520` (`charcoal`)
- White text
- Content in `STEP 01 · INGEST` / `STEP 02 · <...>` / `STEP 03 · <...>` format (Geist Mono 10px)

### ~~A-4 Hero subtitle second-line brick-red Bodoni italic~~ [REMOVED — PM ruling SQ-023-02, 2026-04-21]
Pencil design frame `4CsvQ` hpHero heroCol has no second-line brick Bodoni italic element. Design file is source of truth. A-4 removed from scope.

### ~~A-5 Hero horizontal divider~~ [REMOVED — PM ruling SQ-023-03, 2026-04-21]
Current hairline position (after H1 heading, before subtitle) already matches Pencil design exactly. A-5 was predicated on A-4 (second subtitle line) which no longer exists. A-5 removed from scope.

### C-4 Body padding
The Homepage page body's padding aligns with the design spec: `padding: 72px 96px 96px 96px` (top 72px / right 96px / bottom 96px / left 96px)

**PM ruling SQ-023-04 Q1 (2026-04-21):** Pencil `hpBody` metadata shows `padding: [72, 96, 96, 96]` (bottom=96px). Design overrides original ticket text (`72px 96px`). Correct value: top=72px, right=96px, bottom=96px, left=96px.

**PM ruling SQ-023-04 Q2 (2026-04-21):** Per-section `py-XX px-6 max-w-5xl mx-auto` padding classes on HeroSection, ProjectLogicSection, and DevDiarySection must be removed when body padding is applied to prevent double-stacking. Design's `hpBody` sections have no individual padding.

**Out (explicit exclusions):**
- ~~B-2 left arrow~~ (withdrawn, implementation is correct)
- Copy changes (hpHero / hpLogic / hpDiary copy is finalized by K-017 or design spec; this ticket only changes structural visuals)
- New section / removed section
- `<BuiltByAIBanner />` change (defined by K-017 AC-017-BANNER, this ticket does not touch)

## Design decision log

| Decision | Content | Source |
|----------|------|------|
| 5-item scope split (original) | Per PM line-by-line cross-check (memory's A-2/A-3/A-4/A-5/C-4) | PM ruling 2026-04-20 |
| B-2 left arrow withdrawal | Original memory record was wrong; implementation has no such mismatch | PM re-cross-checked 2026-04-20 |
| Body padding adopts design-spec value | `72px 96px` (Pencil frame 4CsvQ) | Design spec decided |
| SQ-023-01: A-3 already implemented | `ProjectLogicSection.tsx:55–62` fully implements header bar matching the AC spec. Engineer only needs to add a Playwright spec, no component change required. | PM ruling SQ-023-01, 2026-04-21 |
| SQ-023-02: A-4 removed | Pencil design frame `4CsvQ` hpHero has no second-line brick Bodoni italic element; AC misread the design spec. Design spec is the sole source of truth. | PM ruling SQ-023-02, 2026-04-21 |
| SQ-023-03: A-5 removed | Current hairline position (after H1, before subtitle) already matches the design spec; A-5 depended on A-4 (removed); no change needed. | PM ruling SQ-023-03, 2026-04-21 |
| SQ-023-04 Q1: bottom padding = 96px | Pencil hpBody `padding: [72, 96, 96, 96]` (bottom=96px) overrides ticket original text `72px 96px`. | PM ruling SQ-023-04, 2026-04-21 |
| SQ-023-04 Q2: remove individual section padding | HeroSection / ProjectLogicSection / DevDiarySection's `py-XX px-6 max-w-5xl mx-auto` is removed when body padding is added, to avoid double-stacking. | PM ruling SQ-023-04, 2026-04-21 |
| AC-023-STEP-HEADER-BAR text color correction | `rgb(255,255,255)` (original AC approximation was wrong) → `rgb(244, 239, 229)` (`paper` = `#F4EFE5`, K-021 design system token). Design doc §2 A-3 current code state source code is `text-[#F4EFE5]`, Target state = Same as current; implementation is correct, AC was a recording error. | PM ruling 2026-04-21 |

## Acceptance Criteria

### AC-023-DIARY-BULLET: Homepage Diary section each entry has a left-side rectangular brick-red marker `[K-023]`

**Given** the user visits `/`
**When** the page scrolls to the Diary section (`hpDiary`)
**Then** each `<DiaryTimelineEntry>`'s left-side marker is rendered as a rectangle (not a circle)
**And** marker computed `width` = `20px`, `height` = `14px`
**And** marker `backgroundColor` = `rgb(156, 74, 59)` (`#9C4A3B` = `brick-dark`)
**And** marker computed `borderRadius` = `0px` (all four corner border-radius = 0, confirming no rounded effect)
**And** Playwright assertion: at least 3 marker elements in Homepage diary section, each with bounding rect width 20px and height 14px, computed backgroundColor `rgb(156, 74, 59)`, computed borderRadius `0px`

---

### AC-023-STEP-HEADER-BAR: hpLogic section each Step card top has a header bar `[K-023]`

**Given** the user visits `/`
**When** the page scrolls to hpLogic section (process step block)
**Then** each Step card top displays a header bar
**And** header bar `backgroundColor` = `rgb(42, 37, 32)` (`#2A2520` = `charcoal`)
**And** header bar text color = `paper` (`rgb(244, 239, 229)`, `#F4EFE5`) — K-021 design system token, not pure white; original AC `rgb(255,255,255)` was an approximation error, corrected by PM ruling 2026-04-21
**And** header bar text format = `STEP 0X · <LABEL>` (e.g. `STEP 01 · INGEST`, `STEP 02 · MATCH`, `STEP 03 · PROJECT`; exact labels extracted by Architect from design frame `4CsvQ`)
**And** header bar text font is Geist Mono, font size 10px (computed `fontSize` = `10px`)
**And** Playwright assertion: **3 independent test cases**, asserting STEP 01, STEP 02, STEP 03 header bar text each match the `STEP 0X · <WORD>` pattern (regex); must not be merged into a single test case (PM quantification rule)

---

### ~~AC-023-HERO-SUBTITLE-TWO-LINE~~ [REMOVED — PM ruling SQ-023-02, 2026-04-21]

Pencil design frame `4CsvQ` hpHero has no second-line brick Bodoni italic element. This AC is removed from scope. No implementation or Playwright spec required.

---

### ~~AC-023-HERO-HAIRLINE~~ [REMOVED — PM ruling SQ-023-03, 2026-04-21]

Current hairline position already matches Pencil design. This AC was predicated on A-4 (second subtitle line) which is removed. No implementation or Playwright spec required.

---

### AC-023-BODY-PADDING: Homepage body padding matches design spec `[K-023]`

**Given** the user visits `/`
**When** the page finishes loading
**Then** Homepage main content container's computed padding is: `paddingTop: 72px`, `paddingRight: 96px`, `paddingBottom: 96px`, `paddingLeft: 96px`
**And** this padding applies to the common container of hpHero / hpLogic / hpDiary three sections (`HomePage.tsx` root container)
**And** existing HeroSection / ProjectLogicSection / DevDiarySection's individual `py-XX px-6 max-w-5xl mx-auto` padding classes have been removed; must not double-stack with body padding
**And** Playwright assertion: Homepage root container (`data-testid="homepage-root"`) computed `paddingTop` is `72px`, `paddingRight` is `96px`, `paddingBottom` is `96px`, `paddingLeft` is `96px`

**Given** viewport width < 640px (mobile, Tailwind `sm:` breakpoint)
**When** the page finishes loading
**Then** padding drops to responsive variant: `paddingTop: 32px`, `paddingBottom: 32px`, `paddingLeft: 24px`, `paddingRight: 24px`
**And** Playwright mobile viewport (375px width) assertion: padding values match the above mobile values, not the desktop `72px / 96px`

**PM ruling SQ-023-04 (2026-04-21):**
- Q1: bottom padding = 96px (Pencil `hpBody` metadata `[72, 96, 96, 96]` overrides original ticket text)
- Q2: per-section padding removal is required (Option A) — prevents double-stacking, matches design intent
- Mobile breakpoint: Tailwind `sm:` (640px), not 767px — standard breakpoint avoids custom `tailwind.config.js` change

**Known Gap (PM ruling 2026-04-21):** 640px breakpoint boundary precise test case (639px vs 640px) added by QA at sign-off.

---

### AC-023-REGRESSION: K-017 existing assertions do not regress `[K-023]`

**Given** all K-017 ACs (AC-017-*) PASS at K-017 close, especially AC-017-HOME-V2 / AC-017-BANNER
**When** this ticket's implementation is complete
**Then** all K-017 Playwright assertions still PASS
**And** especially `<BuiltByAIBanner />` position (below NavBar, above Hero) is not changed
**And** the basic existence assertions for hpHero / hpLogic / hpDiary three sections still PASS
**And** `<DiaryTimelineEntry>` component (K-017 Pass 3 design)'s `layout:none` absolute positioning mechanism is not broken
**And** AC-HOME-1 existing assertion (Homepage four sections render) still PASSES
**And** `npx tsc --noEmit` exit 0

---

## Release status

**Pending K-021 completion + Architect design:** Architect picks up K-023 after K-021 release, producing design doc `docs/designs/K-023-homepage-structure.md` covering:
- Exact Step label text extraction from design frame `4CsvQ` (each WORD for STEP 01/02/03)
- Hero subtitle second-line exact text extraction
- `<DiaryTimelineEntry>`'s existing marker style change to rectangle (CSS `border-radius: 0` + `width/height`) implementation method
- Step card header bar component structure (new `<StepHeaderBar>` vs inline)
- Body padding responsive breakpoint (desktop vs mobile exact values)

**Known Gap trigger points (updated after PM rulings SQ-023-02/03/04, 2026-04-21):**
- ~~KG-023-01: AC-023-HERO-SUBTITLE-TWO-LINE~~ — CLOSED. A-4 removed from scope per SQ-023-02.
- KG-023-02/03: AC-023-BODY-PADDING mobile responsive exact pixel value — RESOLVED per SQ-023-04: mobile = `32px top/bottom, 24px left/right` at `sm:` breakpoint (640px). No further PM action needed.
- KG-023-04: 640px breakpoint boundary test (639px vs 640px) — QA adds at sign-off.

## Tech Debt

Items deferred from Code Review (2026-04-21 Code Review ruling):

| ID | Finding | Description | Priority | Reason for Deferral |
|----|---------|-------------|----------|---------------------|
| TD-K023-01 | F5 — DIARY-BULLET bounding-box on first() only | `pages.spec.ts` AC-023-DIARY-BULLET bounding-box test asserts width/height only on `markers.first()`, while backgroundColor and borderRadius tests loop all 3. Inconsistent coverage. | Low | borderRadius loop already covers all 3 markers for the primary AC concern (rounded vs rect). Width/height is set by same CSS class on all markers — variance is effectively zero. Cost of fix does not justify mid-ticket interruption. |
| TD-K023-02 | F6 — Incomplete K-021 token migration in ProjectLogicSection + DevDiarySection headers | `ProjectLogicSection.tsx` logicHead and DiarySection header badge still use inline hex (`bg-[#9C4A3B]`, `text-[#F4EFE5]`, `text-[#1A1814]`). Same computed color as tokens, no visual impact. | Medium | Follows pattern of K-025 (NavBar hex→token) and K-026 (AppPage paper palette). Scope expansion into logicHead is outside K-023 AC. Should be bundled into K-025/K-026 or a new follow-up ticket to avoid scope creep. |

---

## Related links

- [PRD.md — K-023 section](../../PRD.md) (to be synced in)
- [memory: project_k017_design_vs_visual_comparison.md](~/.claude/projects/-Users-yclee-Diary/memory/project_k017_design_vs_visual_comparison.md)
- [K-017 ticket (prerequisite copy + v2 Pass 3)](./K-017-about-portfolio-enhancement.md)
- [K-021 ticket (prerequisite foundation)](./K-021-sitewide-design-system.md)
- [Design spec: homepage-v2.pen frame 4CsvQ](../../frontend/design/homepage-v2.pen)

---

## QA Early Consultation Record (2026-04-21)

QA Early Consultation completed before releasing to Architect.

### Challenges Filed (6 total)

| # | AC | Issue | PM Ruling |
|---|-----|-------|-----------|
| 1 | AC-023-DIARY-BULLET | `borderRadius` not quantified in AC — risk of false-pass since existing code has `rounded-[6px]` | Option A: Added `borderRadius: 0px` assertion to AC |
| 2 | AC-023-STEP-HEADER-BAR | "≥ 3" assertion not quantified as independent test cases (PM parallel-Given rule) | Option A: Added explicit "3 independent test cases" requirement to AC |
| 3 | AC-023-HERO-SUBTITLE-TWO-LINE | DOM structure of "two lines" undefined; exact second-line text pending Architect extraction | Known Gap: Playwright to use regex; exact text to be added after Architect design doc |
| 4 | AC-023-HERO-HAIRLINE | Existing hairline in HeroSection is between heading and subtitle (not after subtitle). No position assertion in AC. | Option A: Added DOM-order position requirement and explicit note about existing element location |
| 5 | AC-023-BODY-PADDING | Mobile exact value pending Architect doc; 767px boundary test not specified | Known Gap (mobile value) + Known Gap (boundary test — to be added after Architect doc) |
| 6 | AC-023-REGRESSION | `layout:none` absolute positioning not covered by existing Playwright assertions | Known Gap: visual regression covered by QA sign-off `visual-report.ts`; positional quantification out of scope |

### Known Gaps (PM explicit rulings — updated 2026-04-21 per SQ rulings)

- **KG-023-01**: ~~AC-023-HERO-SUBTITLE-TWO-LINE second-line exact text~~ — CLOSED. AC removed from scope per PM ruling SQ-023-02.
- **KG-023-02**: AC-023-BODY-PADDING mobile responsive exact pixel value — RESOLVED. Mobile = `32px top/bottom, 24px left/right` at `sm:` breakpoint (640px) per PM ruling SQ-023-04.
- **KG-023-03**: ~~AC-023-BODY-PADDING 767px boundary test~~ — SUPERSEDED. Breakpoint changed to Tailwind `sm:` 640px per PM ruling SQ-023-04. QA to add 640px boundary test at sign-off.
- **KG-023-04**: AC-023-REGRESSION absolute positioning metric — covered by visual report screenshot, not quantitative assertion.

---

## Retrospective

(Architect / Engineer / Reviewer / QA / Designer each append their own retrospective at completion stage; PM consolidates after QA PASS)

### PM Summary — Code Review Ruling (2026-04-21)

**Findings ruled: 7 total (F1–F7). Fix-now: 5. Tech Debt: 2.**

| Finding | Ruling | Rationale |
|---------|--------|-----------|
| F1 — Design doc §2 C-4 class order inverted | **Fix Now** | Tailwind mobile-first: `pt-[72px] sm:pt-8` in doc would cause mobile=72px/desktop=32px (wrong). Any future engineer copying from doc would ship a bug. 1-line edit. |
| F2 — fontFamily (Geist Mono) not asserted in STEP header bar tests | **Fix Now** | AC-023-STEP-HEADER-BAR explicitly requires Geist Mono. Font load failures are silent with monospace fallback. Added `toContain('Geist Mono')` to all 3 test cases. |
| F3 — BuiltByAIBanner DOM-order not asserted | **Fix Now** | AC-023-REGRESSION requires Banner position "below NavBar, above Hero, not changed." No structural guard existed. Added `compareDocumentPosition` check using `data-testid="built-by-ai-banner"` + h1 heading as proxy for HeroSection. |
| F4 — Step header bar locator couples to CSS class `div.bg-charcoal` | **Fix Now** | Token renames break locator silently. `data-testid="step-header-bar"` added to `ProjectLogicSection.tsx`; locators in all 3 spec blocks updated to `[data-testid="step-header-bar"]`. Consistent with established `data-testid` pattern (diary-marker, homepage-root). |
| F5 — DIARY-BULLET bounding-box on first() only | **Tech Debt** (TD-K023-01, Low) | borderRadius test already loops all 3. Width/height same CSS class on all markers. Variance probability near zero. |
| F6 — Incomplete K-021 token migration | **Tech Debt** (TD-K023-02, Medium) | Same computed color, no correctness issue. Bundle into K-025/K-026 scope. |
| F7 — "aliases" comment misleading | **Fix Now** | 1-line edit. "Aliases" implies tests duplicate existing tests (they don't — they add structural guards). Changed to "Regression guards." |

**Actions taken by PM (all executed in this session):**
- `docs/designs/K-023-homepage-structure.md` line 163: corrected Tailwind class order
- `frontend/src/components/home/ProjectLogicSection.tsx` line 55: added `data-testid="step-header-bar"`
- `frontend/src/components/home/BuiltByAIBanner.tsx`: added `data-testid="built-by-ai-banner"`
- `frontend/e2e/pages.spec.ts`: updated 3 STEP header bar locators + added fontFamily assertions; added Banner DOM-order check; fixed regression comment
- `docs/tickets/K-023-homepage-structure-v2.md`: added `## Tech Debt` section with TD-K023-01 and TD-K023-02

**Cross-role recurring issues:** None new — data-testid gap was an Architect recommendation already in §5 of design doc that Engineer did not implement. Root cause: design doc recommendation marked as "optional" was treated as skippable.

**Process improvement decisions:**
| Issue | Responsible Role | Action | Update Location |
|-------|-----------------|--------|----------------|
| Architect `data-testid` recommendations in design doc §5 treated as optional by Engineer | Engineer | Add to Engineer persona: "Architect §5 testability recommendations are required deliverables, not optional" | `~/.claude/agents/engineer.md` |

### QA

**Regression tests that were insufficient:** KG-023-04 (640px breakpoint boundary — 639px vs 640px) was listed in ticket as "QA adds at sign-off" but was not actioned at sign-off; boundary is uncovered.

**Edge cases not covered:** AC-023-BODY-PADDING does not test the exact sm: breakpoint boundary (639px mobile vs 640px desktop). Existing tests only cover 375px and 1280px.

**Next time improvement:** Any Known Gap labeled "QA adds at sign-off" must be escalated as a formal QA Interception to PM at sign-off — either Engineer adds the spec, or PM explicitly rules it as Known Gap with reason. Cannot leave it only in ticket metadata.

---

### PM Ruling — KG-023-04 (2026-04-21)

**Decision: Option B — Declare Known Gap**

**Rationale:** Testing Tailwind's `sm:` breakpoint boundary precision (639px vs 640px) is not the application's responsibility. The breakpoint boundary math is internal to Tailwind CSS framework and is tested at the framework level, not the application level. The existing 375px (mobile canonical) and 1280px (desktop canonical) Playwright test cases fully cover the application's padding intent for AC-023-BODY-PADDING. Application-level tests must verify business intent (correct padding values in mobile vs desktop contexts), not framework implementation details.

**KG-023-04 status: Formally closed as Known Gap — Option B (framework-level boundary, not application responsibility)**

---

### Deploy Record

**Deploy date:** 2026-04-21
**Git SHA at deploy:** `fbbd58c2e1fdd1f8aaa4b79e5b76b58d57c7793c`
**Hosting URL:** https://k-line-prediction-app.web.app
**Status:** Live
