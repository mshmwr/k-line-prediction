---
id: K-027
title: DiaryPage mobile milestone timeline visual overlap fix
status: closed
type: bug
priority: high
created: 2026-04-21
closed: 2026-04-21
---

## Background

User reported a production bug on 2026-04-21: the `/diary` page renders broken at mobile widths. Production URL: `https://k-line-prediction-app.web.app/diary`.

**User-provided screenshot description (mobile viewport ~375px/390px width):**

- Symptom: multiple milestone entries in Dev Diary visually overlap and stack on each other; the title / date / body text blurs together
- Specific entries hit (at least three): K-021 (sitewide design system foundation), K-008 (automated visual report script), Codex Review Follow-up (K-009/K-010/K-011) milestone blocks compress into each other
- Content area height calculation appears incorrect, causing overflow overlap (left-side timeline bullet / border position looks correct)
- English italic and Chinese body text mix together
- **Desktop width (≥ 1024px) on the same page is normal** — the K-017 / K-021 Playwright visual reports were all desktop screenshots and failed to capture this mobile regression

**Impact:** the portfolio-facing demo is broken from the mobile visitor perspective. When recruiters access via mobile they see a blurred-together Dev Diary, directly damaging job-search active exposure (per memory `project_job_search_criteria.md` hard criteria / K-017's portfolio-oriented positioning).

**Initial structural reference (left for Architect diagnosis, not a PM ruling):**

Current `/diary` component structure:
- `frontend/src/pages/DiaryPage.tsx` — outermost wrapper (`max-w-3xl mx-auto px-6 py-16`)
- `frontend/src/components/diary/DiaryTimeline.tsx` — directly maps milestones, no layout wrapper
- `frontend/src/components/diary/MilestoneSection.tsx` — accordion expand/collapse (`border rounded-sm mb-3`); when expanded, child content uses `divide-y`
- `frontend/src/components/diary/DiaryEntry.tsx` — `flex gap-4 py-2`, `date` fixed `w-24` (96px), `text` flex-1

After K-021 closed, `/diary` only received the body palette migration (paper/ink + fonts); **structure and mobile responsive were never independently signed off**.

## Dependencies

- **Does not depend on** K-022 / K-023 / K-024 (those three handle structure rework / schema flattening)
- This ticket is a hotfix in nature, only fixing the mobile responsive bug; does not change DiaryPage structure / diary.json schema
- **Scope boundary with K-024:** if the Architect assesses that the bug root cause requires schema / structural-level changes, raise a blocker back to PM to redeliberate whether to fold into K-024; K-027 defaults to a CSS / responsive-level surgical fix

## Scope

**Included:**

1. DiaryPage mobile timeline milestones do not overlap (across all breakpoints ≤ 480px viewport)
2. At mobile widths, every milestone's title, date, and body text remain readable (no clip / no `overflow-hidden` truncation)
3. Playwright adds new mobile viewport tests covering the above two
4. Desktop widths (≥ 1024px): existing layout and visuals must not regress

**Not included:**

- Desktop visual redesign (desktop is currently OK, not a regression)
- `diary.json` schema changes (belongs to K-024 scope)
- DiaryPage structure rework / new component splits (belongs to K-024 scope)
- Sitewide mobile responsive audit on other pages (Homepage / About / App / BusinessLogic) — open separate tickets if needed
- Font / palette adjustments (handled by K-021)

## Design Decisions Pending (deferred to Architect design phase; PM does not rule here)

| Decision | Content | Current Status |
|----------|---------|----------------|
| Layout technical approach | mobile switches to flex-col stacking / CSS Grid / media query rearranging date and text / other | Pending Architect assessment |
| DiaryEntry mobile date position | keep left w-24 / move date above text / shrink date font size | Pending Architect assessment |
| Milestone card padding/margin strategy | keep `mb-3` / increase mobile spacing / switch to `divide-y` on outer | Pending Architect assessment |
| Mobile breakpoint definition | Tailwind default `sm:` (640px) / custom 480px / 375px-specific | Pending Architect assessment |
| Whether accordion expand behavior is mobile-specific | mobile defaults to all collapsed (save space) / keep desktop's `defaultOpen={i===0}` | Pending Architect assessment |

This PM ticket only opens the ticket + defines AC visual behavior; the layout technical approach is delegated to the Architect design phase.

## Acceptance Criteria

### AC-027-NO-OVERLAP: adjacent milestones do not overlap on mobile viewport `[K-027]`

**Given** the user visits `/diary` at mobile viewports (375px / 390px / 414px, three widths)
**When** the page finishes loading and diary.json contains at least 3 milestones
**Then** any two adjacent milestone cards' bounding box y intervals **must not overlap** (`boxA.y + boxA.height <= boxB.y`); this assertion must cover the collapsed state and the all-expanded state, one round each
**And** every milestone card (regardless of expanded or collapsed state) must not have its `overflow-hidden` truncate any readable text (text fully displayed, no characters clipped or hidden); the container may add `overflow-hidden` to prevent long strings from horizontally overflowing into adjacent milestones, but the text itself must wrap fully within the container via `break-words` / `flex-col`
**And** scrolling to the bottom of the page, the last milestone card (folded state) must be fully visible (not occluded by viewport bottom / footer)

**Playwright test case count requirement:** at least **3 independent test cases**, one per viewport (375 / 390 / 414); each test case runs the y-interval assertion across all adjacent milestone pairs (N milestones → N-1 pairwise comparisons).

---

### AC-027-TEXT-READABLE: milestone title / date / body text remain fully readable `[K-027]`

**Given** the user visits `/diary` at mobile viewports (375px / 390px / 414px)
**When** any milestone is expanded (or the first one with `defaultOpen={i===0}`)
**Then** that milestone's `milestone` title text is fully displayed (no `text-overflow: ellipsis` truncation, no `overflow: hidden` hidden characters)
**And** all `items` `date` fields (in `YYYY-MM-DD` format) of that milestone are fully displayed (all 10 characters visible)
**And** all `items` `text` fields (mixed CN/EN) of that milestone are fully displayed, not truncated by container width
**And** the computed `color` of all text must not be `transparent` / equal to background (contrast must be readable)
**And** all text `font-size` at 375px viewport must not be smaller than 12px (readability floor)

**Playwright test case count requirement:** at least **3 independent test cases** (375 / 390 / 414 each), each case verifying readability conditions on three locations: "first expanded milestone's title + first item's date + text".

---

### AC-027-DESKTOP-NO-REGRESSION: zero desktop visual regression `[K-027]`

**Given** the user visits `/diary` at desktop viewports (1024px / 1280px / 1440px)
**When** the page finishes loading
**Then** the DiaryPage rendered result is **visually consistent** with the `/diary` screenshot in `docs/reports/K-021-visual-report.html` at K-021 close (layout / fonts / palette / spacing unchanged)
**And** all existing Playwright desktop tests (`diary.spec.ts` and other specs touching `/diary`) continue to pass with no assertion modifications
**And** `max-w-3xl mx-auto px-6 py-16` wrapper, `UnifiedNavBar`, and `MilestoneSection` accordion behavior remain unchanged

**Playwright test case count requirement:** at least **1 desktop baseline test case** (1280px viewport, runs first milestone expand + three item visibility assertions); **plus existing diary-related spec full regression passing** (count confirmed by QA running the suite).

---

**AC test case coverage minimum total:** `3 (NO-OVERLAP) + 3 (TEXT-READABLE) + 1 (DESKTOP-NO-REGRESSION) = 7 new test cases`, plus existing diary-related spec regression.

## Release Status

**Ticket opened 2026-04-21; pending Architect design phase pickup.**

This PM ticket does not perform the following:
- Does not summon Architect / Engineer / Reviewer / QA (user only requested ticket opening)
- Does not rule on layout technical approach (flexbox vs grid vs absolute vs media query is left to Architect)
- Does not commit (waiting for user instruction)
- Does not assume the user wants immediate execution (may stash to backlog first)

**Awaiting next user instruction:** release Architect to start design immediately vs. stash to backlog and handle alongside K-022/K-023/K-024 structure rework.

## PM Code Review Ruling (2026-04-21)

| Finding ID | Severity | Ruling | Note |
|------------|----------|--------|------|
| C-001 | Critical | Fix Now — AC revision + add assertion | The `overflow-hidden` technical defense is sound (prevents horizontal overflow, not text truncation); AC wording revised this session; Engineer adds verification "text fully visible under overflow-hidden" assertion |
| I-001 | Important | Fix Now — Engineer adds assertion | AC line 77 explicitly requires it; "/diary has no footer" is not a downgrade reason; add scroll-to-bottom + last card bounding box TC |
| N-002 | Warning | Fix Now — TC-001~003 add all-expanded assertions | AC explicitly states "regardless of expanded or collapsed state"; multiple milestones expanded simultaneously is a high-incidence scenario for the original bug |
| K-024 carry-over | Warning | Fix Now — PM doc patch | Design doc §6 five carry-over decisions updated to K-024 ticket (executed this session) |
| I-002 | Minor | Tech Debt (TD-K027-01) | 1024/1440px TC missing; behavior at sm: breakpoint is identical to 1280px, technical risk extremely low; backfill when K-024 starts |
| N-001 | Minor | Tech Debt (TD-K027-02) | `.px-4.pb-4` locator is fragile; will silently fail after K-024 structure rewrite; K-024 Reviewer must include checklist audit |
| N-003 | Minor | Tech Debt (TD-K027-03) | title overflow attribute not verified; truncation scenario hardly exists under flex-col; backfill when K-024 design changes title structure |

### Engineer Next Round Fix Now List (Round 2)

1. **Add "text visible under overflow-hidden" assertion** (C-001): in TC-004~006 (TEXT-READABLE) add an assertion; after expansion, verify `DiaryEntry` text field's `overflow` computed style is `visible` or that `textContent` length equals expected, confirming `overflow-hidden` did not truncate characters
2. **Add last-card visible TC** (I-001): for each viewport (375/390/414px), scroll to bottom, take the last MilestoneSection bounding box, assert `card.y + card.height <= viewportHeight` (folded state)
3. **TC-001~003 add all-expanded state assertion** (N-002): first sequentially click all `aria-expanded=false` accordion triggers, expand all milestones, then run the y-interval no-overlap assertion across all adjacent cards

### Tech Debt Registration (registered before Round 2)

See docs/tech-debt.md TD-K027-01 / TD-K027-02 / TD-K027-03.

---

## PM Code Review Round 2 Ruling (2026-04-21)

| Finding ID | Severity | Ruling | Note |
|------------|----------|--------|------|
| C-R2-01 | Critical | **Fix Now — Engineer Round 3** | The overflow-hidden for-loop is dead code (`isHiddenOverflow` is always false because the `overflow-hidden` class is on the container, not on `p`); `containerScrollCheck` no-ops when content sizes the container (`scrollHeight ≤ clientHeight + 2` is necessarily true); the only effective assertion is the getBoundingClientRect block; the dead code misleads readers into believing coverage exists, which is a test-integrity issue and must be removed |
| I-R2-01a | Important | **Fix Now — Engineer Round 3** | `assertLastCardVisible` only verifies `box.y + box.height <= viewportHeight + 1`, missing `box.y >= 0`; after scroll to bottom, the card top may scroll out of viewport while the assertion still passes — this is a logic gap; add `expect(box.y).toBeGreaterThanOrEqual(0)` |
| I-R2-01b | Minor | **Tech Debt (TD-K027-04)** | `waitForTimeout(200)` is a hardcoded sleep; switching to `toBeInViewport()` would require refactoring assertLastCardVisible logic, and Playwright's `toBeInViewport()` only verifies "visible in viewport" but not "bottom not exceeded"; currently 7 tests all pass; CI stability concern deferred to K-024 cleanup |
| I-R2-02 | Important | **Fix Now — Engineer Round 3** | `assertNoOverlapWhenAllExpanded` has two issues: (1) after click only `waitForTimeout(100)` without confirming expansion — switch to `await expect(btn).toHaveAttribute('aria-expanded', 'true')`; (2) `page.getByRole('button')` selects buttons across the whole page and may include NavBar buttons — should be scoped within the milestone container (`.border.border-ink\\/10.rounded-sm`) |

### Engineer Round 3 Fix Now List

1. **Delete the for-loop dead code** (C-R2-01): delete lines 238-253 in `assertTextReadable` (`paragraphs.count()` for-loop + `isHiddenOverflow` + if-block); keep lines 258-277 (`containerScrollCheck` + `containerNotClipping`); before the `containerNotClipping` block, add a container computed `overflow` verification (`entriesContainer.evaluate` confirms `getComputedStyle(container).overflow` includes `hidden`, validating the test premise)
2. **Add `box.y >= 0` assertion** (I-R2-01a): inside `assertLastCardVisible`'s `if (box && viewportSize)` block, **before** the existing `expect(box.y + box.height).toBeLessThanOrEqual(viewportSize.height + 1)`, add `expect(box.y).toBeGreaterThanOrEqual(0)`
3. **Wait for accordion expand + scope buttons** (I-R2-02): (a) after `await btn.click()`, replace `waitForTimeout(100)` with `await expect(btn).toHaveAttribute('aria-expanded', 'true')`; (b) change `const buttons = page.getByRole('button')` to `const milestoneCards = page.locator('.border.border-ink\\/10.rounded-sm')` + `const buttons = milestoneCards.getByRole('button')`

### Tech Debt Registration (added in Round 2)

See docs/tech-debt.md TD-K027-04.

---

## PM Code Review Round 3 Ruling (2026-04-21)

| Finding ID | Severity | Ruling | Note |
|------------|----------|--------|------|
| I-R3-01 | Important | **Fix Now — Engineer Round 4** | `assertTextReadable` line 181 `page.getByRole('button').first()` selects buttons across the whole page; Round 3 already fixed the equivalent issue in `assertNoOverlapWhenAllExpanded` to `milestoneCards.getByRole('button')`, this miss creates inconsistency; predictable silent-failure risk when K-022/K-024 changes the NavBar; one-line change, trivial effort, Fix Now |

### Engineer Round 4 Fix Now List

1. **`assertTextReadable` button scope restriction** (I-R3-01): line 181 `page.getByRole('button').first()` change to first take `milestoneCards = page.locator('.border.border-ink\\/10.rounded-sm')`, then `milestoneCards.first().getByRole('button').first()` — keeping consistency with the `assertNoOverlapWhenAllExpanded` fix

## Retrospective

### Engineer Reflection (2026-04-21)

**Done well:**
- Before implementation, grepped E2E specs one by one to confirm `DiaryEntry` / `MilestoneSection` / `DevDiarySection` had no dependencies in e2e/, avoiding silent spec failures after changes.
- Strict TDD order: write spec → confirm FAIL (6 tests fail on Before CSS state) → fix components → 7 tests all pass.
- Design doc §4 change list verified row by row, Before/After class-by-class comparison, no omissions.

**Done poorly:**
- The first version of `assertMobileFlexCol`'s date width assertion used `getBoundingClientRect().width < 96` to judge `w-auto`, but under `flex-col` the span fills the parent container width (293–332px), inverting the assertion logic (Before state would also pass). Root cause: incorrect expectation about "actual rendered width behavior of inline elements under `flex-col`" — did not first verify the assertion condition in browser DevTools, just wrote it directly into the spec.
- After correction, used `w-auto` class string verification + `computed width != 96px` combination so the assertion can correctly distinguish Before/After.

**Next time improvement:**
- For any assertion based on `getBoundingClientRect()` / computed style that involves flex/grid layout characteristics, **verify the expected value first in the browser console or via `page.evaluate()` before writing the assertion** — do not infer computed width from imagination.
- Add this rule to pre-implementation checklist: "computed-style assertions must evaluate to confirm expected values first".

### Engineer Round 2 Assertion Reflection (2026-04-21)

**Done well:**
- Fix 1 (C-001)'s `containerNotClipping` assertion's first version used `p.offsetTop + p.offsetHeight > container.clientHeight` to judge truncation; immediately ran Playwright and discovered 3 tests failed; diagnosed immediately rather than blindly modifying.
- Diagnostic path was correct: wrote a temporary debug spec → printed four data sets in page.evaluate (`offsetTop`, `offsetHeight`, `offsetParent`, `getBoundingClientRect`) → confirmed root cause was `offsetParent = BODY` (not the container), making the `offsetTop` baseline wrong.
- Switched to `scrollHeight <= clientHeight` (container has no overflow) + `getBoundingClientRect().bottom` for correct baseline comparison; after the change, 7/7 all pass.

**Done poorly:**
- `offsetTop` is computed relative to `offsetParent`, not relative to any arbitrary ancestor container. This is DOM fundamentals — should have confirmed who `offsetParent` is before writing the assertion. Same root cause as Round 1: did not `page.evaluate` the actual value first before writing the assertion.

**Next time improvement:**
- For any cross-container position assertion, the first step must be to `page.evaluate` and print `offsetParent.tagName`; confirm offsetParent is the expected container before using offsetTop, otherwise switch entirely to `getBoundingClientRect` for viewport-relative comparison.

### PM Summary (2026-04-21)

**Phase Gate decision: CLOSED 2026-04-21**

**AC coverage confirmation:**
- AC-027-NO-OVERLAP: TC-001 (375px) / TC-002 (390px) / TC-003 (414px) all-expanded + collapsed dual-state y-interval assertions → PASS
- AC-027-TEXT-READABLE: TC-004 (375px) / TC-005 (390px) / TC-006 (414px) title + date + text readability assertions → PASS
- AC-027-DESKTOP-NO-REGRESSION: TC-007 (1280px desktop baseline) + existing diary-related spec full regression pass → PASS
- All 7 TC PASS, 127 passed / 1 skipped / 0 failed, no regression

**Ticket history summary:**
4 rounds of Code Review → PM ruled per round → 3 rounds of Engineer fixes → 1 round QA pass. The core problem was that `DiaryEntry`'s `flex gap-4` + fixed `w-24` (96px date column) interacted with mixed CN/EN line-height under 375px viewport, producing visual overlap; the fix replaced the fixed date-column width with `flex-col` + `break-words`.

**Tech debt (carried over after this ticket):**
- TD-K027-01: 1024/1440px TC missing (backfill when K-024 starts)
- TD-K027-02: `.px-4.pb-4` locator fragile (checklist audit after K-024 structure rewrite)
- TD-K027-03: title overflow attribute not verified (backfill when K-024 design changes title structure)
- TD-K027-04: `waitForTimeout(200)` hardcoded sleep (K-024 cleanup)

---

### QA Reflection (2026-04-21)

**Done poorly:**
- TC-001~003 (NO-OVERLAP) collapsed-state assertions only verify adjacent milestones not overlapping, but did not cover "collapsed + expanded mixed state" (e.g., card 1 expanded, card 2 collapsed, card 3 expanded cross combinations); the current assertNoOverlapWhenAllExpanded only runs the two endpoints "all collapsed" and "all expanded" — the in-between states are unverified.
- The `assertLastCardVisible` `box.y >= 0` assertion (I-R2-01a Fix Now), although Engineer was asked to add it, QA did not independently perform a viewport-scroll empirical check after Round 3 to confirm the card top did not scroll out of viewport — relied solely on the assertion passing as proof.
- Mobile viewport tests covered only the three widths 375 / 390 / 414px; the 430px (iPhone 14 Pro Max) and 480px boundary values defined in AC's "all breakpoints ≤ 480px" were not independently covered by test cases.
- The visual report was produced without `TICKET_ID=K-027`, resulting in filename `K-UNKNOWN-visual-report.html` (a continuation of the same K-017 mistake; the K-017 retro recorded this improvement point but it still didn't land this time).

**Next time improvement:**
1. **TICKET_ID must be confirmed before running the screenshot script**: change the QA persona's "run screenshot script" step to `TICKET_ID=<ticket-id> npx playwright test visual-report.ts`, no env-var omission allowed. This rule was logged in the K-017 retro but not yet codified as a hard gate — strengthen it this time as a persona step in mandatory format.
2. **Accordion in-between-state coverage**: for any page with an accordion/collapse, QA must add an additional "odd-even cross expansion" scenario round (expand odd indices, collapse even indices) to NO-OVERLAP-class assertions, not only run all-collapsed vs all-expanded endpoints.
3. **Viewport boundary backfill**: if AC defines "all breakpoints ≤ X px", QA must additionally test the X px boundary itself beyond the three standard viewports (this ticket should add a 480px TC).
4. **Last-card visibility independent empirical check**: for scroll-to-bottom assertions, after all Fix Now corrections, QA must open a browser session and visually verify or use `toBeInViewport()` as supplementary verification — not rely on assertion passing as the sole proof.
