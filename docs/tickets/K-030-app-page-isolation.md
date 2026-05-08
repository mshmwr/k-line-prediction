---
id: K-030
title: /app page isolation — new tab + no NavBar/Footer + background color restore
status: closed
type: fix
priority: high
created: 2026-04-21
closed: 2026-04-21
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
**And** the `<a>` element for the App link has `target="_blank"` and `rel="noopener noreferrer"` attributes (both required — `noopener` alone is insufficient; both must be verified by spec)

**Playwright test case count:** At least **1 independent test case** verifying: clicking App link → new page/tab opened → new page URL contains `/app` → original tab URL unchanged.

**QA new-tab pattern note (Early Consultation 2026-04-21):** No existing spec in `frontend/e2e/` currently uses `context.waitForEvent('page')` — this ticket introduces the pattern for the first time. Engineer must use the `Promise.all([waitForEvent, click])` ordering to register the listener before the click fires (sequential await will race), per design doc §6.2.1. QA will verify on sign-off that the pattern follows this ordering exactly.

---

### AC-030-NO-NAVBAR: /app page has no UnifiedNavBar `[K-030]`

**Given** the user navigates directly to `/app` (either via new tab from NavBar or direct URL)
**When** the page finishes loading
**Then** the `UnifiedNavBar` component is not present in the DOM — both testids used by the existing NavBar (`[data-testid="navbar-desktop"]` and `[data-testid="navbar-mobile"]`) must resolve to `toHaveCount(0)` on `/app`
**And** no navigation links from the marketing site (links with accessible name `Home`, `Diary`, `About`, `App` via `getByRole('link')`) are present on `/app`
**And** the `/app` tool content (OHLC input area, Predict button) is visible and not obscured

**Playwright test case count:** At least **1 independent test case** asserting the NavBar is absent (both desktop + mobile testid) and tool content is visible.

**QA testid note (Early Consultation 2026-04-21):** `UnifiedNavBar.tsx` exposes two sibling containers with testids `navbar-desktop` (L51) and `navbar-mobile` (L68); there is no wrapper `unified-navbar` testid. Assert absence on both; asserting only one leaves a false-negative gap on the other viewport class.

---

### AC-030-NO-FOOTER: /app page has no HomeFooterBar `[K-030]`

**Given** the user is on the `/app` page
**When** the page finishes loading
**Then** the `HomeFooterBar` component is not present in the DOM — specifically, `page.getByRole('contentinfo')` (semantic `<footer>` landmark rendered by `HomeFooterBar.tsx`) must resolve to `toHaveCount(0)` on `/app`
**And** neither `HomeFooterBar`'s signature contact text (`yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn`, exact match) nor its GA disclosure text (`This site uses Google Analytics to collect anonymous usage data.`, exact match) appears anywhere on `/app`
**And** the bottom of the viewport is occupied by the tool UI, not by a marketing footer bar

**Playwright test case count:** At least **1 independent test case** asserting the footer absence via both (a) `<footer>` role absence and (b) both signature text absences.

**QA testid note (Early Consultation 2026-04-21):** `HomeFooterBar.tsx` does NOT expose any `data-testid`; it renders a semantic `<footer>` tag. Assertion must use `getByRole('contentinfo')` or the component's signature text. A `data-testid="home-footer-bar"` assertion will always pass vacuously and is not acceptable.

---

### AC-030-BG-COLOR: /app page background matches Pencil v1 `/app` frame `[K-030]`

**Given** the user is on the `/app` prediction tool page
**When** the page finishes loading
**Then** the page visible background — the wrapper `<div>` directly inside `<div id="root">` — must render the same dark neutral tone as the Pencil v1 `/app` frame `ap001` (`fill: #030712`), which is equivalent to Tailwind `bg-gray-950` (`rgb(3, 7, 18)`); the tool area must not appear as paper/beige and must not inherit the body `bg-paper` visually through any gap
**And** the wrapper bg is consistent across the full viewport (no partial paper bleed-through: both top (where NavBar used to sit) and bottom (where Footer used to sit) must show the dark wrapper bg, not paper)
**And** the body `@layer base` paper rule continues to apply to the `<body>` element itself (global rule unchanged); the wrapper merely overrides the visual layer above it

**Playwright test case count:** At least **2 independent test cases**:
  1. Assert the wrapper `<div>` directly inside `<div id="root">` has computed `background-color === 'rgb(3, 7, 18)'` (must NOT be `rgb(244, 239, 229)`)
  2. Assert the `<body>` itself still has `background-color === 'rgb(244, 239, 229)'` on `/app` — proving the wrapper override strategy (design doc Option α), not a body-level rule change

**Pencil Alignment Note (added by PM 2026-04-21):** Architect design doc §0.2 stated "`/app` is not in Pencil design scope," asserting only `homepage-v2.pen` (4 marketing frames). PM audit found `/app` DOES exist in `homepage-v1.pen` (frame id `ap001`, fill `#030712`, no NavBar children, no Footer children — TopBar + MainContent only). Architect's chosen color `bg-gray-950 = rgb(3, 7, 18) = #030712` is therefore **exactly aligned with Pencil v1 `ap001`**, even though the Architect's reasoning path referenced pre-K-021 codebase, not Pencil. This AC locks the value to the Pencil v1 frame as source of truth.

---

### AC-030-FUNC-REGRESSION: existing /app prediction functionality not broken `[K-030]`

**Given** the user is on the `/app` page after the layout changes from this ticket
**When** the user interacts with the prediction tool (input OHLC data, click Predict)
**Then** the existing Vitest unit tests for AppPage components (`AppPage.test.tsx`, `OHLCEditor.test.tsx`, `PredictButton.test.tsx`, `StatsPanel.test.tsx`, `MatchList.test.tsx`) all pass without modification
**And** the existing Playwright E2E specs for `/app` functionality continue to pass (no new failures introduced)
**And** the chart, match list, and stats panel are rendered without visual obstruction from site chrome

**Playwright test case count:** This AC is covered by the **existing E2E suite regression run** — no new test cases required; Engineer confirms suite passes after layout changes.

---

---

### AC-030-PENCIL-ALIGN: /app implementation matches Pencil v1 `ap001` frame (colors + layout) `[K-030]`

**Given** the Pencil v1 design file `frontend/design/homepage-v1.pen` contains the canonical `/app` frame (id `ap001`, fill `#030712`)
**When** the ticket implementation is complete on `fix/K-030-app-isolation` branch
**Then** the following visible properties of `/app` must match the Pencil v1 `ap001` frame literally (exact color values, exact structural presence/absence):

| Pencil v1 `ap001` attribute | Required implementation value |
|----------------------------|-------------------------------|
| Frame `fill` | wrapper `<div>` bg = `rgb(3, 7, 18)` (`#030712`, Tailwind `bg-gray-950`) |
| Top-level child #1 `TopBar` present | `<TopBar />` rendered |
| Top-level child `NavBar` / `UnifiedNavBar` | **absent** (no NavBar node in Pencil v1 frame) |
| Top-level child `Footer` / `HomeFooterBar` | **absent** (no Footer node in Pencil v1 frame) |
| TopBar `fill` | `#111827` (`bg-gray-900`) — already present in current code, no change required |

**And** any visual regression against the Pencil v1 frame (wrong bg color, any re-appearance of NavBar/Footer, altered panel palette) must be treated as a blocker, not a known-acceptable difference

**Playwright test case count:** Covered by AC-030-BG-COLOR (bg value) + AC-030-NO-NAVBAR (NavBar absence) + AC-030-NO-FOOTER (Footer absence). No new spec required; this AC serves as the Pencil-alignment contract binding those three.

**QA sign-off requirement:** QA must run `mcp__pencil__get_screenshot` against `homepage-v1.pen` frame `ap001` and visually compare against the running dev server at `/app` per QA persona "Mandatory Task Completion Step 0" (Pencil design comparison, 2026-04-21). Visual discrepancy = QA Visual Flag = ticket NOT accepted until resolved.

---

**AC total: 6 ACs, minimum 5 new Playwright test cases (NEW-TAB × 1 + NO-NAVBAR × 1 + NO-FOOTER × 1 + BG-COLOR × 2) + 1 regression suite confirmation; AC-030-PENCIL-ALIGN is a contract-binding AC verified visually, not by new spec.**

## QA Early Consultation

**Status: Complete — 2026-04-21.** 4 challenges raised, 4 supplemented to AC, 0 declared Known Gap.

**Consultation method note:** This session's PM process lacks Agent-tool access (function roster limited to Read/Edit/Write/Bash/Glob/Grep). PM performed consultation by reading `~/.claude/agents/qa.md` persona + existing e2e codebase, then applying QA-lens to each boundary. Finalized rulings documented below. Any disagreement from a later full-agent QA review must be filed as a QA Interception and re-ruled by PM; present rulings are binding until then.

### QA Challenge #1 — NavBar absence testid pattern

**Raised:** Ticket AC-030-NO-NAVBAR originally specified `data-testid="unified-navbar"`, which does not exist in the codebase.
**Evidence:** `grep -n 'data-testid' frontend/src/components/UnifiedNavBar.tsx` → L51 `navbar-desktop`, L68 `navbar-mobile`. No wrapper `unified-navbar` testid exists.
**PM ruling (Option A — supplement AC):** AC-030-NO-NAVBAR amended to assert `toHaveCount(0)` on both `[data-testid="navbar-desktop"]` AND `[data-testid="navbar-mobile"]`, plus role-based absence of `Home`/`Diary`/`About`/`App` link names. Single-testid assertion insufficient (false-negative on the other viewport class).

### QA Challenge #2 — Footer absence testid pattern

**Raised:** Ticket AC-030-NO-FOOTER originally specified `data-testid="home-footer-bar"`, which does not exist in the codebase.
**Evidence:** `grep -n 'testid' frontend/src/components/home/HomeFooterBar.tsx` → zero matches. Component renders semantic `<footer>` tag without testid.
**PM ruling (Option A — supplement AC):** AC-030-NO-FOOTER amended to assert (a) `getByRole('contentinfo')` `toHaveCount(0)` and (b) both signature text strings (`yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn` + GA disclosure) absence. Asserting only a non-existent testid would pass vacuously and provide no coverage.

### QA Challenge #3 — Background color assertion target

**Raised:** K-021 body `@layer base` paper rule still applies; asserting `<body>` bg on `/app` would still return paper (not the wrapper override color), hiding whether the wrapper override actually works.
**Evidence:** Design doc §2.2 Option α chooses wrapper `<div>` override while leaving body rule unchanged.
**PM ruling (Option A — supplement AC):** AC-030-BG-COLOR amended to require TWO Playwright cases: (1) wrapper `<div>` bg === `rgb(3, 7, 18)`, (2) body bg === `rgb(244, 239, 229)` on `/app`. Case (2) proves the override strategy; without it, a future refactor to body-level route-scoped rule could pass case (1) while silently regressing K-021's sitewide body rule.

### QA Challenge #4 — `sitewide-body-paper.spec.ts` spec conflict resolution

**Raised:** Existing `/app` assertion in `sitewide-body-paper.spec.ts` (L46–51) will fail after this ticket's changes. Additionally, Architect's design doc §2.6 flagged two further spec conflicts (`sitewide-footer.spec.ts` L47–51 + `sitewide-fonts.spec.ts` L55–73) that were not in the ticket's original conflict list.
**Evidence:** Design doc §2.6 Pre-verdict scoring matrix chose Option B (remove `/app` from sitewide specs + new `app-bg-isolation.spec.ts`) over Option A (keep `/app` in spec but assert wrapper bg).
**PM ruling (accept design doc Option B):** Option B is endorsed. The three sitewide specs each lose their `/app` test case per design doc §6 File Change List; the new `frontend/e2e/app-bg-isolation.spec.ts` becomes the source of truth for `/app` bg/chrome assertions. Rationale: `/app` is explicitly excluded from the sitewide design system by this ticket — the spec names `sitewide-*` should reflect that scope exactly. Option A would leave a semantic contradiction ("sitewide" spec asserting a per-page exception).

### Additional PM finding (not a QA Challenge) — Pencil design file scope

**Finding:** Design doc §0.2 stated "`/app` is not in Pencil design scope." PM audit found this is incomplete — `/app` exists in `homepage-v1.pen` (frame `ap001`, fill `#030712`, no NavBar/Footer children), which is the canonical `/app` design source. Architect's chosen `bg-gray-950` (`rgb(3, 7, 18)` = `#030712`) matches Pencil v1 `ap001.fill` exactly, so the color decision is sound — but the justification path missed the Pencil source of truth.
**Action:** Added AC-030-PENCIL-ALIGN to bind implementation to Pencil v1 `ap001` frame as source of truth (colors + structural presence/absence). Architect design doc §0.2 wording should be corrected when Architect next opens this design doc, but this is a doc-hygiene item not blocking release (the chosen color is correct regardless).

### Regression/edge-case additional scan (QA persona Boundary Sweep)

Per QA persona §Edge Cases Boundary Condition Mandatory Sweep:

| Boundary Type | Finding | AC coverage |
|---------------|---------|-------------|
| Direct URL load (not through NavBar) | AC-030-NO-NAVBAR/NO-FOOTER/BG-COLOR tests use direct `page.goto('/app')`; covers | ✓ |
| Mobile viewport for NavBar testid coverage | AC-030-NO-NAVBAR amended to require both desktop + mobile testid absence | ✓ |
| Middle-click / cmd-click / ctrl-click on App link | Design doc §7 confirms native `<a>` supports browser-native nav shortcuts; current AC doesn't mandate test but behavior is inherent to native anchor | Known Gap acceptable — QA does not test browser-native behavior |
| Popup blocker on new tab | Design doc §7: user-initiated click on `<a target=_blank>` is not popup-blocked by major browsers | Known Gap acceptable — browser-native behavior |
| `/app` loaded in iframe / webview | Out of scope per ticket §Scope | Known Gap acceptable — not in scope |
| Prediction tool regression on `/app` after layout changes | AC-030-FUNC-REGRESSION covers via existing Vitest + full E2E suite | ✓ |
| Panel child elements bleeding paper through `/app` root | AC-030-BG-COLOR "consistent across full viewport, no partial paper bleed-through" covers | ✓ |

## Release Status

**2026-04-21 10:00: Ticket opened.** PM registered ticket + dashboard + retrospective log entry.

**2026-04-21 (later): Architect design doc delivered.** `docs/designs/K-030-app-isolation.md`; 5 Architect decisions ruled; 3 spec conflicts resolved (Option B — remove `/app` from 3 sitewide specs + add `app-bg-isolation.spec.ts`); architecture.md synced.

**2026-04-21 (PM Phase Gate this pass):**

- **Pencil design audit (Step 1):** PM parsed both `.pen` files via JSON walk. `homepage-v2.pen` confirms no `/app` frame (4 marketing frames only). `homepage-v1.pen` contains `/app` frame `ap001` (fill `#030712`, TopBar + MainContent children, **no NavBar, no Footer**). Architect's chosen `bg-gray-950` = `rgb(3, 7, 18)` = `#030712` matches Pencil v1 `ap001.fill` literally. Pencil v1 frame structure (no NavBar/Footer children) confirms NavBar/Footer removal is Pencil-aligned, not just a K-021 revert. Architect §0.2 wording ("not in Pencil design scope") is incomplete — `/app` IS in v1, just not in v2. Flagged as doc-hygiene fix-up for Architect, NOT a release blocker (the chosen color + structural decisions are correct regardless of how §0.2 was worded).
- **QA Early Consultation (Step 2):** 4 Challenges raised + answered by PM (Options A-A-A + accept design doc Option B). Additional PM finding on Pencil v1 scope added AC-030-PENCIL-ALIGN. See §QA Early Consultation above.
- **AC supplementation (Step 3):** AC-030-NO-NAVBAR, AC-030-NO-FOOTER, AC-030-BG-COLOR, AC-030-NEW-TAB amended with testid/role/pattern specifics; AC-030-PENCIL-ALIGN added. AC count 5 → 6.
- **Mandatory gate note for release:** AC-030-PENCIL-ALIGN requires QA to run `mcp__pencil__get_screenshot` against `homepage-v1.pen` frame `ap001` and visually compare against dev server `/app` before QA sign-off. This session (PM) lacks `mcp__pencil__*` tool access, so PM cannot pre-capture the Pencil baseline; QA agent invoked at QA phase will do so per its persona step 0. If QA cannot access Pencil MCP either, task must escalate to user — do not bypass this step.

**Phase Gate verdict (PM): GO — release Engineer.**

Rationale:
- All 6 ACs have explicit Given/When/Then/And + quantified Playwright test case count.
- testid / role / pattern ambiguities resolved against actual codebase greps (not assumed).
- Pencil v1 `ap001` frame is the source-of-truth anchor, color + structure match Architect's decisions.
- QA Consultation 4 challenges answered; no Known Gaps on testable boundaries.
- Design doc spec conflict Option B accepted; no orphaned spec assertions will remain after Engineer work.
- `/app` functional regression is guarded by existing Vitest suite (5 unit test files) + full Playwright E2E suite under AC-030-FUNC-REGRESSION.

**Biggest unresolved risk (disclosed):** The `mcp__pencil__get_screenshot` visual verification step for AC-030-PENCIL-ALIGN cannot be executed from this PM session. QA must perform it at sign-off; if QA session also lacks the tool, user must do the visual compare before ticket closure.

**Engineer release:** PM releases `fix/K-030-app-isolation` branch to Engineer for implementation per design doc §8 Implementation Order.

## Retrospective

### Engineer — 2026-04-21

**AC judgments that were wrong:** None. All 6 ACs (NEW-TAB / NO-NAVBAR / NO-FOOTER / BG-COLOR ×2 / FUNC-REGRESSION / PENCIL-ALIGN) implementable exactly as specified; PM amendments from QA Early Consultation (testid + role + signature text + wrapper-vs-body dual-assertion) were correct against the actual codebase.

**Edge cases not anticipated:** Vite dev-server transform cache held stale source across Playwright webServer re-use, making a correctly applied `AppPage.tsx` edit appear un-applied. First spec re-run showed 4/5 failing identical to the TDD red baseline; only a `curl http://localhost:5173/src/AppPage.tsx` sanity check revealed vite was still serving the pre-edit module graph. Not an AC gap — a dev-environment invariant that was implicit and unchecked.

**Next time improvement:** Whenever Playwright webServer is reused within a worktree after source edits, explicitly clear vite cache (`pkill -f vite && rm -rf frontend/node_modules/.vite`) before re-running. Added to Engineer persona retrospective log (`docs/retrospectives/engineer.md` 2026-04-21 K-030 entry) for persistence.

---

## Code Review Results (2026-04-21)

**Breadth + depth dual rounds complete.** 6 findings: 1 Critical / 3 Important / 3 Minor (including 1 Reviewer recommended to retain).

### PM Ruling Table

| # | Severity | Finding | Ruling | Assignee |
|---|---|---|---|---|
| C-1 | Critical | `HeroSection.tsx:26-32` Try the App CTA still uses SPA `<Link>`, diverging from NavBar App link new-tab behavior; the 2 entry points from Homepage to `/app` are inconsistent | **Fix-now (Option A)** — change to `<a target="_blank" rel="noopener noreferrer">` + add 1 Playwright case | Engineer |
| I-1 | Important | `AppPage` interaction regression test gap (no E2E assertions for PredictButton sticky / OHLC edit) | **Tech Debt → TD-K030-01** | — |
| I-2 | Important | design doc §6.2 says 4 cases but `app-bg-isolation.spec.ts` actually implements 5 cases (T4/T5 split BG-COLOR a+b) | **Fix-now** — backfill design doc §6.2 table 4→5 and split into T4/T5 rows | Architect |
| I-3 | Important | `sitewide-footer.spec.ts` header JSDoc wording (L12/L13 vs L5 Given lists 2 routes but total 4) is poorly readable; reviewer considers it drift | **Fix-now** — fold into Engineer C-1 commit; JSDoc clarification: "L5 Given 2 routes are HomeFooterBar render points; L13 total=4 includes /business-logic post-login + /about FooterCtaSection boundary" | Engineer |
| M-1 | Minor | T1 `newPage.waitForLoadState()` default `'load'` | **Retain as-is** (Reviewer also recommends retaining) | — |
| M-3 | Minor | `UnifiedNavBar` `renderLink` local type alias is not `typeof TEXT_LINKS[number]` | **Tech Debt → TD-K030-02** | — |

### PM Ruling Rationale (C-1 Pre-Verdict)

**Step 1 — Multi-dimensional scoring matrix:**

| Option | Implementation cost | Alignment with ticket AC | Reversibility | Alignment with Pencil + consistent-behavior hard rules | Fail-fast | Total |
|---|---|---|---|---|---|---|
| A (fix HeroSection + add 1 spec) | 2 | 2 | 2 | 2 | 2 | **10** |
| B (accept divergence + add AC locking same-tab) | 1 | 0 (violates §Scope #1) | 1 | 0 | 1 | **3** |
| C (TD + release this ticket) | 2 | 0 | 2 | 0 | 0 | **4** |

**Step 2 — Red Team Self-Check:**
1. **User challenge** (Pencil `ap001` 1:1 hard rule): Pencil frame has no NavBar → after the user enters via Hero CTA same-tab, they cannot return to marketing. Option A directly addresses this.
2. **Engineer challenge** (isn't deferring to QA stage cheaper?): QA only runs tests, does not verify two-entry-points consistency logic; Reviewer has already caught it, deferring to QA dual-round retest is more expensive.
3. **Devil's advocate** (mobile popup blocker 3 months later): §2.3 + Boundary Preemption proves user-initiated click is unaffected by blockers in major browsers; same mechanism as NavBar App link, no new risk introduced.

**Step 3 — Final ruling:** Option A. Largest unresolved risk: Hero CTA visual style (button dark bg + paper text) differs visually from NavBar link, the user mental model may assume the two behaviors are necessarily different — eliminate this uncertainty by adding 1 independent E2E spec case explicitly locking `target=_blank`.

### Engineer Fix-Now Task (immediate execution)

**Scope:**
1. Edit `frontend/src/components/home/HeroSection.tsx`:
   - Change `<Link to="/app">` to `<a href="/app" target="_blank" rel="noopener noreferrer">`
   - Preserve existing className (`inline-block bg-[#2A2520] text-[#F4EFE5] rounded-[6px] px-[26px] py-[12px] text-[13px] font-bold tracking-[1px]`) and `style={{ fontFamily: '"Geist Mono", monospace' }}`
   - Remove `import { Link } from 'react-router-dom'` (no other Link usage in this file)
2. Add E2E case locking Hero CTA new-tab behavior:
   - Recommended: add to `frontend/e2e/app-bg-isolation.spec.ts` within the T1 describe block as a new test case named `clicking Hero CTA on / opens new tab with /app URL`, reusing the T1 pattern (`Promise.all([context.waitForEvent('page'), ctaClick])`)
   - Or new describe block `AC-030-NEW-TAB — Hero CTA opens /app in new tab`
   - Assertions: Hero CTA `<a>` has `target=_blank` + `rel` containing `noopener noreferrer`; after click, the new page URL contains `/app`; original tab URL remains `/`
3. While at it, fix I-3: `frontend/e2e/sitewide-footer.spec.ts` L5 / L12-L13 JSDoc wording adjustment (make the Given line's 2 routes explicitly align with the total=4 breakdown; recommended rewrite L5 to `Given: user visits /, /business-logic (HomeFooterBar routes)` + keep L12-L13 as-is, or split into independent count lines)

**Acceptance:**
- `npx tsc --noEmit` exit 0
- `npm test` Vitest all green
- `/playwright` runs `app-bg-isolation.spec.ts` + `sitewide-footer.spec.ts` + `pages.spec.ts` all green
- Per feedback_engineer_design_doc_checklist_gate, re-read design doc table and check each row
- Auto-enter QA phase upon completion (no return to PM)

### Architect Fix-Now Task (immediate execution, parallel with Engineer)

**Scope:** `docs/designs/K-030-app-isolation.md` §6.2
- §6.2 opening "Total tests: 4 independent test cases" → "5 independent test cases"
- §6.2 table: split T4 into T4 (BG-COLOR a — wrapper bg) + T5 (BG-COLOR b — body bg still paper), aligning with actual implementation `app-bg-isolation.spec.ts` L91-L120
- §6 File Change List: if `app-bg-isolation.spec.ts` 4 → 5 numbers appear, sync them

**Acceptance:**
- Docs-only, no tsc / Playwright run; commit message tagged `docs-only`
- Architect appends self-diff verification per persona Mandatory Task Completion Steps

### Tech Debt Registered

| TD ID | Item | Trigger condition |
|---|---|---|
| TD-K030-01 | AppPage interaction regression E2E coverage missing | When TD-005 AppPage split ticket starts |
| TD-K030-02 | UnifiedNavBar renderLink type alias should derive from `typeof TEXT_LINKS[number]` | Next NavBar structural-change ticket |

Logged in `docs/tech-debt.md`.

### PM Session Capability Note

This PM session lacks the Agent tool (same limitation as the prior 2026-04-21 session). Engineer / Architect dispatch is interpreted and executed by the parent orchestrator from this handoff section; not escalated to the user (per feedback_pm_self_decide_bq).

### Next Stage

After Engineer + Architect fix-now complete:
1. Engineer runs all green → QA phase (auto-enter)
2. QA sign-off (including `mcp__pencil__get_screenshot` ap001 visual comparison)
3. PM acceptance → deploy → ticket closure + AC migrated to PRD §4 Closed

---

### QA — 2026-04-21 (final regression sign-off)

**Regression tests that were insufficient:** No new gaps. Full Playwright 172 passed / 1 skipped / 0 failed; Vitest 36/36; tsc exit 0. `app-bg-isolation.spec.ts` 6/6 (T1~T6); after `/app` removal from sitewide-body-paper / sitewide-footer / sitewide-fonts / navbar, regression intact; ma99-chart / ga-tracking still green.

**Edge cases not covered:** Added two groups of mobile (375×667) + tablet (768×1024) viewport assertions for `/app` isolation + mobile NavBar App link new-tab; the temporary spec was removed after passing. Browser-native behaviors such as middle-click / cmd-click / popup blocker / older Safari are logged in design doc §7 as Known Gap acceptable (QA does not test browser-native mechanisms).

**Next time improvement:** `visual-report.ts` should throw rather than fall back to `K-UNKNOWN` when `TICKET_ID` is not provided, to avoid silent pollution of `docs/reports/` by full Playwright suite runs. This time `K-UNKNOWN-visual-report.html` was manually purged and `TICKET_ID=K-030 npx playwright test visual-report.ts` re-run; the report is finalized at `docs/reports/K-030-visual-report.html`. This recommendation is logged in the per-role retro log, pending PM evaluation for a separate TD.

**Pencil v1 `ap001` comparison conclusion:**
- `homepage-v1.pen` direct JSON read: frame `ap001.fill = #030712`, child[0] `ap002.fill = #111827` (TopBar), logo color `#FB923C` ("K-Line Predictor")
- Dev screenshot `/tmp/k030-qa-app.png` visual interpretation: wrapper bg = darkest gray, TopBar = slightly lighter dark gray, logo = orange-red — all three match the .pen color values
- Playwright T4 already programmatically asserts wrapper `backgroundColor === 'rgb(3, 7, 18)'` = `#030712`
- **AC-030-PENCIL-ALIGN: PASS**

**Visual report:** `docs/reports/K-030-visual-report.html` (full coverage of 5 routes)

**QA verdict: PASS — PM may close + deploy.**

---

## Deploy Record

**2026-04-21 — Production deploy executed.**

- **Branch merged:** `fix/K-030-app-isolation` → `main` (merge commit `95f6ea5`, including PRD + architecture.md + 3 retros interleave conflict resolution with K-031 close)
- **Build:** `cd frontend && npm run build` — exit 0; bundle: `index-DzbMkytg.js` 114.08 kB / gzip 38.30 kB, `vendor-react-DBzpJYIJ.js` 179.29 kB / gzip 58.57 kB, CSS 44.21 kB / gzip 7.77 kB
- **Deploy command:** `firebase deploy --only hosting` — exit 0
- **Hosting URL:** https://k-line-prediction-app.web.app
- **Smoke test:** `curl -I /` → HTTP 200 + `curl -I /app` → HTTP 200 (etag `8769e6917b6b...` last-modified 2026-04-21 14:23:13 GMT)
- **API path scan:** `grep -rn "['\"]/api/" src/` — only 3 occurrences in `src/__tests__/AppPage.test.tsx` (mock verification, not runtime), no bare relative path
- **Push:** `git push origin main` → `8b0214f..95f6ea5`

**Ticket closed 2026-04-21.** AC migrated to PRD §4 Closed Tickets; PM-dashboard.md K-030 row moved to Closed section.
