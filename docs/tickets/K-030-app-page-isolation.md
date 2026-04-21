---
id: K-030
title: /app page isolation — new tab + no NavBar/Footer + background color restore
status: open
type: fix
priority: high
created: 2026-04-21
---

## Background

Three visual/behavioral regressions on the `/app` page identified from production screenshot review (2026-04-21):

1. **Same-tab navigation** — clicking "App" in the UnifiedNavBar performs an SPA in-page route change (same tab). `/app` is a standalone tool application distinct from the marketing site; it should open in a new browser tab.

2. **NavBar and Footer present on /app** — the `/app` page currently renders `UnifiedNavBar` at the top and `HomeFooterBar` at the bottom (both introduced/confirmed by K-021 scope). The `/app` page is a tool application, not a marketing page, and should be a fully isolated viewport with no site chrome — no NavBar, no footer.

3. **Background color incorrect** — K-021 introduced a global `body { @apply bg-paper text-ink; }` rule in `frontend/src/index.css` (commit `338e4b8`). K-021 also removed the per-page dark wrapper from `AppPage.tsx`. The combination changed the `/app` page background to the site-wide paper color (`#F4EFE5`). The original `/app` design had a distinct, non-paper background appropriate for a data tool (neutral dark or white). The paper palette is a marketing/portfolio aesthetic and is inappropriate for the prediction tool UI.

## Root Cause

K-021 commit `338e4b8` ("feat(design-system): body paper bg via @layer base + remove dark wraps"):
- Added `@layer base { body { @apply bg-paper text-ink; } }` to `frontend/src/index.css`
- Removed per-page dark wrappers from `AppPage.tsx`, `AboutPage.tsx`, `DiaryPage.tsx`, `BusinessLogicPage.tsx`

This correctly establishes the marketing site palette but was applied globally, overriding `/app`'s original background. The AC-021-BODY-PAPER spec (`sitewide-body-paper.spec.ts`) enforces the paper background on all 5 routes including `/app`, which means the current spec is in direct tension with this ticket's requirement.

K-021 also added `<HomeFooterBar />` to `/app` per the Footer placement strategy table in architecture.md (per-page import model). This was an intentional K-021 decision, but the underlying assumption (that `/app` should share site chrome) is being reconsidered here.

The NavBar on `/app` has been present since K-005 (UnifiedNavBar rollout).

## Scope

**Included:**

1. Clicking "App" link in UnifiedNavBar opens `/app` in a new browser tab (`target="_blank"`)
2. `/app` page renders with no `UnifiedNavBar` component
3. `/app` page renders with no `HomeFooterBar` component
4. `/app` page background is a non-paper neutral color visually distinct from the marketing site (white, off-white tool background, or a neutral dark — Architect decides; not `#F4EFE5` paper)
5. Existing `/app` prediction functionality (OHLC input, Predict button, chart, MatchList, StatsPanel) is not broken by the layout changes
6. E2E regression: existing spec assertions on `/app` page that test prediction-related behavior continue to pass

**Not included:**

- Any change to the prediction feature logic or API
- Mobile responsive improvements for `/app` (separate scope)
- Redesigning the `/app` tool UI beyond background and removing site chrome
- Changes to other pages' NavBar or Footer behavior
- Changes to the body-level `bg-paper` rule (that rule remains for marketing pages; `/app` overrides at page level)

## Impact on Existing Specs

The following existing E2E spec and AC are in direct tension with Issue #3 and must be addressed:

| Spec file | AC | Tension |
|-----------|-----|---------|
| `frontend/e2e/sitewide-body-paper.spec.ts` | AC-021-BODY-PAPER | Spec currently asserts `/app` body background-color equals paper (`#F4EFE5`). After this fix, `/app` must have a different background, breaking this test case. |

**Resolution:** Architect must determine the correct implementation approach. Option A: `/app` overrides body bg at page wrapper level (wrapper `className` sets non-paper bg, takes precedence over body). Option B: `/app` is excluded from `sitewide-body-paper.spec.ts` assertions. Either way, the spec for `/app` in `sitewide-body-paper.spec.ts` must be updated as part of this ticket. PM flags this as a known spec conflict — not a blocker, but must be resolved explicitly.

## Design Decisions Pending (for Architect)

| Decision | Options | Current Status |
|----------|---------|---------------|
| `/app` background color | White (`#FFFFFF`) / off-white / neutral dark matching original app design / paper-adjacent neutral | Pending Architect review of original AppPage.tsx design intent |
| Implementation approach for bg override | Page-level wrapper class / `AppPage.tsx` root div bg override / CSS module / body class toggle | Pending Architect |
| New-tab behavior implementation | `target="_blank"` on NavBar App link only / `rel="noopener noreferrer"` required | Standard; Architect confirm implementation in UnifiedNavBar |
| NavBar removal scope | Remove NavBar import from AppPage.tsx only / confirm no layout dependency on NavBar height | Pending Architect impact assessment |
| Footer removal scope | Remove HomeFooterBar import from AppPage.tsx / confirm `flex flex-col h-screen` layout still valid without footer | Pending Architect; architecture.md notes AppPage uses `h-screen overflow-hidden` |

## Acceptance Criteria

### AC-030-NEW-TAB: "App" link opens /app in a new tab `[K-030]`

**Given** the user is on any page with the UnifiedNavBar (`/`, `/about`, `/diary`, `/business-logic`)
**When** the user clicks the "App" link in the navigation bar
**Then** the browser opens `/app` in a new tab (a new browsing context is created, the current tab remains unchanged)
**And** the new tab loads the `/app` prediction tool page successfully (no 404, no redirect)
**And** the `<a>` element for the App link has `target="_blank"` and `rel="noopener noreferrer"` attributes

**Playwright test case count:** At least **1 independent test case** verifying: clicking App link → new page/tab opened → new page URL contains `/app`.

---

### AC-030-NO-NAVBAR: /app page has no UnifiedNavBar `[K-030]`

**Given** the user navigates directly to `/app` (either via new tab from NavBar or direct URL)
**When** the page finishes loading
**Then** the `UnifiedNavBar` component is not present in the DOM (no element with `data-testid="unified-navbar"` or equivalent NavBar landmark)
**And** no navigation links from the marketing site (Home / Diary / About) are visible on the page
**And** the `/app` tool content (OHLC input area, Predict button) is visible and not obscured

**Playwright test case count:** At least **1 independent test case** asserting the NavBar is absent and tool content is visible.

---

### AC-030-NO-FOOTER: /app page has no HomeFooterBar `[K-030]`

**Given** the user is on the `/app` page
**When** the page finishes loading
**Then** the `HomeFooterBar` component is not present in the DOM (no element with `data-testid="home-footer-bar"` or equivalent footer landmark)
**And** the bottom of the viewport is occupied by the tool UI, not by a marketing footer bar

**Playwright test case count:** At least **1 independent test case** asserting the footer is absent on `/app`.

---

### AC-030-BG-COLOR: /app page background is visually distinct from marketing site `[K-030]`

**Given** the user is on the `/app` prediction tool page
**When** the page finishes loading
**Then** the page background color is visually distinct from the paper/beige marketing site background — the tool area does not appear as a warm beige or parchment tone
**And** the page background provides sufficient contrast for the prediction tool UI elements (chart, input table, buttons) to be clearly readable
**And** the background color is consistent across the full page viewport (no partial beige bleed-through from the body layer)

**Note:** Exact color value is determined by Architect design decision. AC passes when the `/app` background is not the `#F4EFE5` paper color and provides adequate contrast for tool UI content.

**Playwright test case count:** At least **1 independent test case** asserting the `/app` page background-color is not `rgb(244, 239, 229)` (the paper color) and is applied consistently.

---

### AC-030-FUNC-REGRESSION: existing /app prediction functionality not broken `[K-030]`

**Given** the user is on the `/app` page after the layout changes from this ticket
**When** the user interacts with the prediction tool (input OHLC data, click Predict)
**Then** the existing Vitest unit tests for AppPage components (`AppPage.test.tsx`, `OHLCEditor.test.tsx`, `PredictButton.test.tsx`, `StatsPanel.test.tsx`, `MatchList.test.tsx`) all pass without modification
**And** the existing Playwright E2E specs for `/app` functionality continue to pass (no new failures introduced)
**And** the chart, match list, and stats panel are rendered without visual obstruction from site chrome

**Playwright test case count:** This AC is covered by the **existing E2E suite regression run** — no new test cases required; Engineer confirms suite passes after layout changes.

---

**AC total: 5 ACs, minimum 4 new Playwright test cases + 1 regression suite confirmation.**

## QA Early Consultation

**Assessment: Required before releasing Engineer.**

This ticket contains multiple boundary conditions:

- **NavBar/Footer absence assertions**: `data-testid` existence checks require QA to confirm testid naming convention is consistent with existing specs (e.g. `navbar.spec.ts` uses specific locators — QA must verify or define the absence assertion pattern).
- **Background color assertion**: `getComputedStyle` on body vs page wrapper — QA should confirm which element to assert (body vs root div) given the K-021 body-level rule still applies.
- **New-tab navigation**: Playwright `context.waitForEvent('page')` pattern — QA should confirm the spec pattern for new-tab assertion against existing `pages.spec.ts` patterns.
- **Spec conflict (sitewide-body-paper.spec.ts)**: QA must explicitly rule on whether to update the `/app` assertion in that spec or delete the `/app` test case — silence is not allowed.

**PM will invoke QA Early Consultation after Architect design doc is complete, before releasing Engineer.**

## Release Status

**2026-04-21: Ticket opened. Awaiting Architect design + QA Early Consultation before Engineer release.**

PM actions on ticket open:
- Ticket file created: `docs/tickets/K-030-app-page-isolation.md`
- PM dashboard updated: K-030 added to "In Progress / Pending" table
- Per-role retrospective log updated: `docs/retrospectives/pm.md`

PM does NOT perform at this stage:
- Does not invoke Architect (user has not requested implementation start)
- Does not invoke QA Early Consultation (pending Architect design)
- Does not commit (awaiting user instruction)

## Retrospective

_(to be filled after ticket closes)_
