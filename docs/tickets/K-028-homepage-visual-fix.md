---
id: K-028
title: Homepage visual fix — supplement section spacing + DevDiarySection entry adaptive height
status: closed
type: fix
priority: high
created: 2026-04-21
closed: 2026-04-21
qa-early-consultation: "docs/retrospectives/qa.md 2026-04-21 K-028 entry (6 challenges: 4 must-add supplemented to AC, 2 declared Known Gap)"
---

## Background

After K-023 (Homepage structure detail alignment v2) was deployed, on-site screenshots revealed two visual issues:

### Issue 1: Missing homepage section spacing (side effect of the K-023 design decision)

K-023 AC-023-BODY-PADDING PM ruling (SQ-023-04 Q2): "the per-section `py-XX px-6 max-w-5xl mx-auto` on HeroSection / ProjectLogicSection / DevDiarySection must be removed to avoid double-stacking with the body padding."

The Engineer correctly executed this ruling — the per-section padding was removed and the body container padding now uses the correct values (`sm:pt-[72px] sm:pr-[96px] sm:pb-[96px] sm:pl-[96px]`).

**However**, after removing per-section padding, there is no vertical spacing at all between sections (HeroSection ↔ ProjectLogicSection ↔ DevDiarySection). The three sections butt up against each other, looking cluttered with no hierarchy. Design frame `4CsvQ` shows clear gaps should exist between sections.

**Root-cause judgment: the K-023 design decision is itself correct (unified body padding), but the K-023 ticket AC did not explicitly define what the section-to-section vertical spacing should be. This issue is not a K-023 regression (the K-023 implementation matches its AC); it is a design gap exposed after the K-023 decision was executed and needs a new ticket to supplement it.**

### Issue 2: DevDiarySection entry text overlap (pre-existing flaw triggered by the K-023 diary.json update)

`DevDiarySection.tsx` uses a fixed-height `ENTRY_HEIGHT = 140` for absolute positioning:
```js
const ENTRY_HEIGHT = 140
const ENTRY_GAP = 20
const top = i * (ENTRY_HEIGHT + ENTRY_GAP)  // each entry starts from a fixed top position
```

This design assumes each entry's rendered height does not exceed 140px. The milestone entry added in the K-023 diary.json update has text noticeably longer than the previous entries (the K-023 milestone text is ~270 characters, far exceeding the ~80 characters in older entries), leading to:

- entry 0 (K-023) actual rendered height > 140px
- entry 1 (K-022) absolute top = 160px, overlapping entry 0's rendered content

**Root-cause judgment: this is a long-standing design flaw in DevDiarySection (assumed fixed height); K-023 did not modify this component, but the K-023 diary.json update triggered the flaw. Not a K-023 regression — it is a new trigger of a pre-existing structural issue.**

## Scope

### Fix item 1: Vertical spacing between sections

In the `HomePage.tsx` root container, add appropriate vertical spacing between HeroSection / ProjectLogicSection / DevDiarySection to align with the section gap in design frame `4CsvQ`.

**Excludes:**
- Modifying body container padding values (defined by K-023 AC-023-BODY-PADDING; do not touch)
- Modifying the horizontal layout of each section

### Fix item 2: DevDiarySection entry adaptive height

Change the absolute-positioning layout in `DevDiarySection.tsx` so that each entry's height is determined by its content, eliminating the text overlap caused by the fixed `ENTRY_HEIGHT = 140` assumption.

**Refactor direction:** switch from absolute positioning + fixed totalHeight to a flex-col or relative flow layout, preserving the vertical rail visual effect while letting each entry's height adapt to content.

**Excludes:**
- Modifying the DevDiarySection header row styles (`§ DEV DIARY` badge + divider)
- Modifying the "— View full log →" link
- Modifying marker dimensions (20×14px rectangle, defined in K-023)

## Dependencies

- No upstream ticket dependency (K-023 is already closed; this ticket fixes things independently)

## AC Design Decision Records

| Decision Item | Content | Source |
|----------|------|------|
| Section spacing values | Awaiting Architect to extract exact values from design frame `4CsvQ` | Architect SQ |
| DevDiarySection layout refactor approach | Awaiting Architect design (absolute → flow-based) | Architect design doc |
| Mobile viewport assertion requirement | Both ACs must include 375px viewport acceptance | K-027 retrospective rule |

## Acceptance Criteria

### AC-028-SECTION-SPACING: Appropriate vertical spacing between Homepage sections `[K-028]`

**Given** the user visits `/`
**When** the page finishes loading
**Then** the visual gap between HeroSection and ProjectLogicSection is clear enough that the two sections are not flush
**And** the visual gap between ProjectLogicSection and DevDiarySection is clear enough that the two sections are not flush
**And** Playwright assertion: the gap between the bounding boxes of the HeroSection root element (`<section>`) and the ProjectLogicSection root element is > 32px (desktop 1280px viewport)
**And** Playwright assertion: the gap between the bounding boxes of the ProjectLogicSection root element and the DevDiarySection root element is > 32px (desktop 1280px viewport)

**Given** viewport width 375px (mobile)
**When** the page finishes loading
**Then** the visual gap between HeroSection and ProjectLogicSection remains clearly visible at the mobile viewport, with the two sections not flush
**And** the visual gap between ProjectLogicSection and DevDiarySection remains clearly visible at the mobile viewport, with the two sections not flush
**And** Playwright mobile assertion: both section gaps are > 16px (375px viewport)

**Given** viewport width 640px (the start of the Tailwind `sm` breakpoint)
**When** the page finishes loading
**Then** the section gap uses the desktop value (72px), not the mobile value (24px)
**And** Playwright assertion: HeroSection ↔ ProjectLogicSection gap is 72px (±2px tolerance) at 640px viewport

**Given** viewport width 639px (just below the Tailwind `sm` breakpoint)
**When** the page finishes loading
**Then** the section gap uses the mobile value (24px), not the desktop value (72px)
**And** Playwright assertion: HeroSection ↔ ProjectLogicSection gap is 24px (±2px tolerance) at 639px viewport

**PM Note:** the exact gap values, extracted by the Architect from design frame `4CsvQ`, are 72px desktop / 24px mobile (`gap-6 sm:gap-[72px]`). The tablet breakpoint assertions (640px / 639px) were added by QA Early Consultation #3 to guard against Tailwind `sm` breakpoint regression.

---

### AC-028-DIARY-ENTRY-NO-OVERLAP: DevDiarySection entries render without overlap `[K-028]`

**Given** the user visits `/` and `diary.json` contains at least 3 milestones with uneven text-field lengths (including a long-text entry such as K-023's ~270-character text)
**When** the page scrolls to the Diary section (`hpDiary`)
**Then** each diary entry's rendered content (milestone title + date + text paragraph) is fully visible and not covered by an adjacent entry
**And** the bounding boxes of two adjacent entries do not overlap (bottom of entry N ≤ top of entry N+1)
**And** the vertical rail still spans all entries (visually unbroken)
**And** Playwright assertion: take the first 3 diary entry wrapper elements and pairwise verify entry[N].boundingBox().y + entry[N].boundingBox().height ≤ entry[N+1].boundingBox().y (±2px tolerance)

**Given** viewport width 375px (mobile)
**When** the page scrolls to the Diary section
**Then** all 3 diary entries are individually fully readable at the 375px viewport, not truncated, not overlapping
**And** Playwright mobile assertion: same bounding-box non-overlap assertion executed at the 375px viewport

---

### AC-028-DIARY-EMPTY-BOUNDARY: No crash under abnormal diary.json counts `[K-028]`

**Given** `diary.json` returns 0 milestones (or `useDiary(3).entries.length === 0`)
**When** the page finishes loading
**Then** `DevDiarySection` renders no entries, displays no rail, and produces no layout crash
**And** the "— View full log →" link behavior is unchanged
**And** Playwright assertion: the count of `data-testid="diary-entry-wrapper"` elements is 0, and the rail element (`aria-hidden` rail div) is absent or has `height === 0`

**Given** `diary.json` returns exactly 1 milestone
**When** the page finishes loading
**Then** 1 entry renders, the marker is visible, and the rail can degrade to height=0 with no layout artifact
**And** Playwright assertion: the count of `data-testid="diary-entry-wrapper"` elements is 1, and the marker has `boundingBox().width === 20 && height === 14`

**PM Note:** diary.json is runtime JSON and could theoretically be hand-edited to be empty or 1 entry; this AC was added to guard against an untested empty-state regression. Architect §2.6 already covers the engineering implementation.

---

### AC-028-DIARY-RAIL-VISIBLE: Vertical rail has independently verifiable existence `[K-028]`

**Given** `diary.json` has ≥ 3 milestones
**When** the page loads to the Diary section
**Then** the rail element (vertical line) exists in the DOM and is visible
**And** the rail is 1px wide and has height greater than 0
**And** the rail sits inside the `diary-entries` container (child relationship), visually spanning the vertical extent of the entries
**And** Playwright assertion: the `data-testid="diary-rail"` element exists, `boundingBox().width === 1`, `height > 0`, and the rail's top / bottom fall within the bbox of the `data-testid="diary-entries"` container

**PM Note (2026-04-21 ruling):** the original AC draft said "rail covers first-marker-center → last-marker-center (±4px)", which was overly prescriptive — it would mechanically lock down the Architect's rail positioning design (top:40 / bottom:40 aligned to title baseline), violating `feedback_pm_ac_visual_intent` (ACs express visual intent, not property values). Replaced with "rail exists + has height + sits inside the entries container" as a defensive assertion that "the Engineer must not delete the rail", leaving the design intent to the Architect. Engineer BQ triggered PM ruling Option C.

---

### AC-028-REGRESSION: K-023 passing assertions do not regress `[K-028]`

**Given** all K-023 ACs (AC-023-*) were PASS at K-023 close
**When** this ticket's implementation is complete
**Then** all K-023 Playwright assertions still PASS, in particular:
**And** AC-023-DIARY-BULLET: the marker rectangle (20×14px, `rgb(156, 74, 59)`, `borderRadius: 0px`) is unchanged
**And** AC-023-STEP-HEADER-BAR: the text, font, and background color of the 3 STEP header bars are unchanged
**And** AC-023-BODY-PADDING: desktop padding `72px / 96px / 96px / 96px` and mobile padding `32px / 24px` are unchanged
**And** `npx tsc --noEmit` exits 0

**And** AC-028-MARKER-COORD-INTEGRITY: after the marker parent changes from an absolute wrapper to a flex-col entry, `firstMarker.boundingBox()` still returns `width === 20 && height === 14` (not 0/null); `backgroundColor === 'rgb(156, 74, 59)'`; `borderRadius === '0px'`; first 3 entries all satisfy
**And** AC-028-MARKER-COUNT-INTEGRITY: the count of `[data-testid="diary-marker"]` elements equals `useDiary(3).entries.length` (3) exactly, with no double-render or missed-render

---

## Known Gap (declared by PM via QA Early Consultation rulings)

### KG-028-01: Long-string (40-char no-whitespace continuous) mobile 375px overflow not tested

**QA Challenge #4 verbatim:** `break-words` handling of a 40-char no-whitespace string is not tested.
**PM ruling:** declared Known Gap.
**Rationale:** production data (`frontend/public/diary.json`) text fields are all mixed Chinese-English sentences with no pure 40-char no-whitespace continuous strings; diary content is all human-meaningful prose, and any URLs that appear naturally split by formatting; ROI is below the cost of adding the test.
**Risk:** if diary.json later introduces pure URL / hash strings, mobile could overflow horizontally.
**Mitigation:** the Engineer uses `break-words` (specified in Architect §2.6), covering 95% of cases; the test can be added later if a real instance appears.

### KG-028-02: `document.documentElement.scrollHeight` / footer visibility not independently tested

**QA Challenge #6 verbatim:** after the flex-col refactor, page scrollHeight changes; no AC verifies the footer is still visible.
**PM ruling:** declared Known Gap.
**Rationale (revised after 2026-04-21 Code Review):** the existing `pages.spec.ts` does **not** independently assert HomeFooterBar visibility-in-viewport (the original wording "covered indirectly by existing assertions" was too strong and has been corrected). Replaced with an engineering judgment — the flex-col refactor only changes the internal positioning of diary entries (absolute → flow); HomePage root padding is untouched (K-023 AC-023-BODY-PADDING is still tested); the footer's render position is determined by the HomePage.tsx structure, and flex-col will not produce extreme scrollHeight; this judgment + manual checks during the QA regression stage (dev server scroll-to-bottom visual check) is an acceptable mitigation.
**Risk:** if diary later contains extreme-length content (e.g. 100+ milestones), the page becomes longer but the footer's existence is unaffected; no runtime crash risk.
**Mitigation:** QA regression manually verifies the footer is visible at the bottom of `/`; if P2 TD-028-C is upgraded to add an AC, this KG closes.

---

## Release Status

**Released to Engineer:** 2026-04-21 PM ruling
- ✓ QA Early Consultation complete (6 challenges: 4 must-add → AC supplemented, 2 Known Gap)
- ✓ Architect design doc ready (`docs/designs/K-028-homepage-visual-fix.md`, Pencil frame `4CsvQ` values extracted)
- ✓ AC total: AC-028-SECTION-SPACING (desktop + mobile + tablet 640/639), AC-028-DIARY-ENTRY-NO-OVERLAP, AC-028-DIARY-EMPTY-BOUNDARY, AC-028-DIARY-RAIL-VISIBLE, AC-028-REGRESSION (including MARKER-COORD-INTEGRITY + MARKER-COUNT-INTEGRITY)
- ✓ Known Gap explicitly declared: KG-028-01 / KG-028-02

## Tech Debt

Added per the 2026-04-21 Code Review (breadth + depth) two-layer results. No Critical / Warning items; the 3 TDs are about test coverage refinement and document wording precision; they do not block merge.

### TD-028-A: No assertion that marker x-center aligns with rail x-center `priority: P3`

**Gap:** AC-028-MARKER-COORD-INTEGRITY asserts marker width/height/bg/radius but does not assert that marker x-center aligns with rail x-center. Currently rail `left: 29` and marker `left: 20 + w/2 = 30` differ by only 1px (same before and after refactor, not a regression), but after the parent changes from an absolute wrapper to `relative pl-[92px]`, future refactors could silently drift.

**Follow-up:** add an assertion `marker.x + marker.width/2 ≈ rail.x + rail.width/2 ± 2`.

---

### TD-028-B: No assertion for 1-entry rail collapse height `priority: P3`

**Gap:** the 0-entry branch of AC-028-DIARY-EMPTY-BOUNDARY asserts rail absent or height 0; the 1-entry branch only asserts entry count and marker dims, not the rail collapse height (design §2.6 row 2 predicts ~0).

**Follow-up:** add `expect((await rail.boundingBox())?.height ?? 0).toBeLessThanOrEqual(8)` to the 1-entry test.

---

### TD-028-C: KG-028-02 mitigation wording too strong `priority: P2`

**Gap:** Known Gap KG-028-02 wrote "HomeFooterBar visibility is covered indirectly by other assertions in the existing pages.spec.ts"; in fact `grep`ing `pages.spec.ts` shows no footer visibility-in-viewport assertion. The claim was too strong, violating memory `feedback_retrospective_honesty` (although this is PM's own ticket wording, not a retrospective).

**Follow-up:** pick one — (a) revise the KG-028-02 wording to "not independently verified; relies on the engineering judgment that the flex-col refactor will not produce extreme scrollHeight", or (b) add a footer visibility assertion to downgrade KG → closed. PM ruled P2 = handle in next iteration; at minimum, fix the wording before this ticket closes.

## Deploy Record

- **Deploy date:** 2026-04-21 22:47 UTC+8 (real deploy — earlier 20:28 entry was from worktree build that never reached live CDN; 2026-04-21 audit confirmed live bundle lacked K-028 testids)
- **Commit range:** merge commit `76b83c1` on `main` (rebased from original `2d30672`/`e162bb5`/`c5adacb` → `b26bb38`/`9ef9c2f`/`161d5bc`)
- **Build output:** `dist/index.html` 1.01 kB / CSS 44.34 kB gzip 7.81 kB / JS 114.13 kB gzip 38.28 kB / vendor chunks (react/charts/markdown) unchanged — bundle `index-D5Ufwtvm.js`
- **Firebase release:** Hosting URL `https://k-line-prediction-app.web.app` (project `k-line-prediction-app`)
- **Deploy Checklist PASS:** (1) `grep "/api/"` scan → test-only matches, no bare prefix in src production code; (2) `npm run build` exit 0; (3) `firebase deploy --only hosting` release complete.
- **Live verification:** live bundle `index-D5Ufwtvm.js` grep contains `"homepage-sections"` / `"diary-entries"` / `"diary-entry-wrapper"` / `"diary-marker"` — K-028 fix confirmed on production CDN.
- **Pre-deploy gate:** tsc exit 0 + Vitest 36/36 + Playwright 186/186 (QA sign-off 2026-04-21 before merge)

## Related Links

- [K-023 ticket (upstream, body padding design decision)](./K-023-homepage-structure-v2.md)
- [K-027 ticket (related to DevDiarySection absolute positioning mechanism)](./K-027-mobile-diary-layout-fix.md)
- [Design file: homepage-v2.pen frame 4CsvQ](../../frontend/design/homepage-v2.pen)
- [PRD.md — K-025 section](../../PRD.md) (TBA)

---

## Retrospective

(Architect / Engineer / Reviewer / QA / PM each append their entry at completion)
