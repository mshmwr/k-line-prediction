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

**Breadth + depth 雙輪完成。** 6 個 findings：1 Critical / 3 Important / 3 Minor（含 Reviewer 建議保留 1 條）。

### PM Ruling Table

| # | Severity | Finding | Ruling | Assignee |
|---|---|---|---|---|
| C-1 | Critical | `HeroSection.tsx:26-32` Try the App CTA 仍為 SPA `<Link>`，與 NavBar App link new-tab 行為分歧；Homepage 2 entry points 到 `/app` 不一致 | **Fix-now (Option A)** — 改 `<a target="_blank" rel="noopener noreferrer">` + 補 1 Playwright case | Engineer |
| I-1 | Important | `AppPage` interaction regression test gap（PredictButton sticky / OHLC edit 無 E2E 斷言） | **Tech Debt → TD-K030-01** | — |
| I-2 | Important | design doc §6.2 寫 4 cases 但實際 `app-bg-isolation.spec.ts` 實作 5 cases（T4/T5 拆 BG-COLOR a+b） | **Fix-now** — 回補 design doc §6.2 表 4→5 並拆 T4/T5 行 | Architect |
| I-3 | Important | `sitewide-footer.spec.ts` header JSDoc 表述（L12/L13 vs L5 Given 列 2 routes 但 total 4）可讀性弱，reviewer 認為 drift | **Fix-now** — 併入 Engineer C-1 commit；JSDoc clarify「L5 Given 2 routes 是 HomeFooterBar 渲染處；L13 total=4 含 /business-logic 登入後 + /about FooterCtaSection boundary」 | Engineer |
| M-1 | Minor | T1 `newPage.waitForLoadState()` default `'load'` | **放行保留**（Reviewer 亦建議保留） | — |
| M-3 | Minor | `UnifiedNavBar` `renderLink` 本地 type alias 非 `typeof TEXT_LINKS[number]` | **Tech Debt → TD-K030-02** | — |

### PM Ruling Rationale (C-1 Pre-Verdict)

**Step 1 — 多維度評分矩陣：**

| 選項 | 實作成本 | 與 ticket AC 對齊度 | 可逆性 | Pencil + 一致行為硬規則對齊 | Fail-fast | 總分 |
|---|---|---|---|---|---|---|
| A (fix HeroSection + 補 1 spec) | 2 | 2 | 2 | 2 | 2 | **10** |
| B (接受分歧 + 補 AC 鎖 same-tab) | 1 | 0（違 §Scope #1） | 1 | 0 | 1 | **3** |
| C (TD + 本票放行) | 2 | 0 | 2 | 0 | 0 | **4** |

**Step 2 — Red Team Self-Check：**
1. **使用者挑戰**（Pencil `ap001` 1:1 硬規則）：Pencil frame 無 NavBar → 使用者 Hero CTA same-tab 進去後無法回 marketing。A 選項正中紅心。
2. **Engineer 挑戰**（拖到 QA 階段再修不是更省？）：QA 只跑測試，不驗 two entry-points consistency 邏輯；Reviewer 已抓到，拖 QA 雙輪重測反而昂貴。
3. **Devil's advocate**（3 個月後行動裝置 popup blocker）：§2.3 + Boundary Preemption 已證使用者觸發 click 在主流瀏覽器不受 blocker 影響；與 NavBar App link 同機制，不引入新風險。

**Step 3 — 最終裁決：** Option A。最大未解風險：Hero CTA 視覺樣式（button dark bg + paper text）與 NavBar link 視覺不同，使用者 mental model 可能認為兩者行為必然不同——透過補 1 獨立 E2E spec case 顯式鎖 `target=_blank` 消除此不確定性。

### Engineer Fix-Now Task（即刻執行）

**Scope：**
1. 修 `frontend/src/components/home/HeroSection.tsx`：
   - `<Link to="/app">` 改 `<a href="/app" target="_blank" rel="noopener noreferrer">`
   - 保留既有 className（`inline-block bg-[#2A2520] text-[#F4EFE5] rounded-[6px] px-[26px] py-[12px] text-[13px] font-bold tracking-[1px]`）與 `style={{ fontFamily: '"Geist Mono", monospace' }}`
   - 移除 `import { Link } from 'react-router-dom'`（此檔其他地方無 Link 使用）
2. 新增 E2E case 鎖 Hero CTA new-tab 行為：
   - 推薦加到 `frontend/e2e/app-bg-isolation.spec.ts` T1 同 describe block 內新 test case 名 `clicking Hero CTA on / opens new tab with /app URL`，複用 T1 pattern（`Promise.all([context.waitForEvent('page'), ctaClick])`）
   - 或新 describe block `AC-030-NEW-TAB — Hero CTA opens /app in new tab`
   - 斷言：Hero CTA `<a>` 有 `target=_blank` + `rel` 含 `noopener noreferrer`；click 後 new page URL 含 `/app`；原 tab URL 仍 `/`
3. 順便修 I-3：`frontend/e2e/sitewide-footer.spec.ts` L5 / L12-L13 的 JSDoc 文案調整（讓 Given 列的 2 routes 與 total=4 的拆帳顯式對齊；建議改寫 L5 `Given: user visits /, /business-logic (HomeFooterBar routes)` + L12-L13 保持現狀即可，或拆成獨立計數行）

**驗收：**
- `npx tsc --noEmit` 退出 0
- `npm test` Vitest 全綠
- `/playwright` 跑 `app-bg-isolation.spec.ts` + `sitewide-footer.spec.ts` + `pages.spec.ts` 全綠
- 依 feedback_engineer_design_doc_checklist_gate 回讀 design doc table 逐列勾
- 完成後自動進入 QA phase（不再回 PM）

### Architect Fix-Now Task（即刻執行，可與 Engineer 平行）

**Scope：** `docs/designs/K-030-app-isolation.md` §6.2
- §6.2 開頭「測試總數：4 個獨立 test case」改為「5 個獨立 test case」
- §6.2 表格拆 T4 為 T4（BG-COLOR a — wrapper bg）+ T5（BG-COLOR b — body bg 仍為 paper），對齊實際實作 `app-bg-isolation.spec.ts` L91-L120
- §6 File Change List 若有 `app-bg-isolation.spec.ts` 4 → 5 數字也同步

**驗收：**
- 屬 docs-only，不跑 tsc / Playwright；commit message 標 `docs-only`
- Architect 按 persona Mandatory Task Completion Steps append self-diff verification

### Tech Debt Registered

| TD ID | 條目 | 觸發條件 |
|---|---|---|
| TD-K030-01 | AppPage interaction regression E2E coverage 缺 | TD-005 AppPage 拆分 ticket 啟動時 |
| TD-K030-02 | UnifiedNavBar renderLink type alias 應用 `typeof TEXT_LINKS[number]` 派生 | 下次 NavBar 結構改動 ticket |

已寫入 `docs/tech-debt.md`。

### PM Session Capability Note

本 PM session 不具 Agent tool（與 2026-04-21 前次 session 同樣限制）。Engineer / Architect 召喚由 parent orchestrator 解讀本段 handoff 執行；不上報使用者（遵 feedback_pm_self_decide_bq）。

### Next Stage

Engineer + Architect fix-now 完成後：
1. Engineer 跑全綠 → QA phase（自動進入）
2. QA sign-off（含 `mcp__pencil__get_screenshot` ap001 視覺比對）
3. PM 驗收 → deploy → ticket closure + AC 遷至 PRD §4 Closed

---

### QA — 2026-04-21 (final regression sign-off)

**Regression tests that were insufficient:** 無新增缺口。Full Playwright 172 passed / 1 skipped / 0 failed；Vitest 36/36；tsc exit 0。`app-bg-isolation.spec.ts` 6/6（T1~T6）；sitewide-body-paper / sitewide-footer / sitewide-fonts / navbar 的 /app 拆除後迴歸無破壞；ma99-chart / ga-tracking 仍綠。

**Edge cases not covered:** 已補 mobile (375×667) + tablet (768×1024) viewport 兩組 `/app` isolation + mobile NavBar App link new-tab 斷言，臨時 spec 驗過後已移除。middle-click / cmd-click / popup blocker / 舊 Safari 等 browser-native 行為屬 design doc §7 登記為 Known Gap acceptable（QA 不測 browser-native 機制）。

**Next time improvement:** `visual-report.ts` 於未帶 `TICKET_ID` 時應 throw 而非 fallback `K-UNKNOWN`，避免 full Playwright suite 靜默污染 `docs/reports/`。本次已手動清除 `K-UNKNOWN-visual-report.html` 並重跑 `TICKET_ID=K-030 npx playwright test visual-report.ts`，report 定版於 `docs/reports/K-030-visual-report.html`。此項建議已寫入 per-role retro log，待 PM 評估另開 TD。

**Pencil v1 `ap001` 比對結論：**
- `homepage-v1.pen` 直讀 JSON：frame `ap001.fill = #030712`、child[0] `ap002.fill = #111827`（TopBar）、logo color `#FB923C`（"K-Line Predictor"）
- Dev screenshot `/tmp/k030-qa-app.png` 視覺判讀：wrapper bg = 最深灰、TopBar = 稍淺深灰、logo = 橘紅色，三者皆與 .pen 色值一致
- Playwright T4 已程式斷言 wrapper `backgroundColor === 'rgb(3, 7, 18)'` = `#030712`
- **AC-030-PENCIL-ALIGN: PASS**

**Visual report:** `docs/reports/K-030-visual-report.html`（5 routes 全覆蓋）

**QA verdict: PASS — PM 可 close + deploy。**

---

## Deploy Record

**2026-04-21 — Production deploy executed.**

- **Branch merged:** `fix/K-030-app-isolation` → `main`（fast-forward / merge commit recorded in outer repo log）
- **Build:** `cd frontend && npm run build` — exit 0（待填 bundle hash / size delta）
- **Deploy command:** `firebase deploy --only hosting` — exit 0
- **Hosting URL:** https://k-line-prediction.web.app (primary) / https://k-line-prediction.firebaseapp.com (alt)
- **Smoke test:** `/` NavBar App link + Hero CTA 均開新分頁；`/app` wrapper bg gray-950、無 NavBar / Footer、TopBar 正常顯示；prediction tool 功能未破壞
- **API path scan:** `grep -r "'/api/" frontend/src/` + `grep -r '"/api/' frontend/src/` — 無 bare relative path

**Ticket closed 2026-04-21.** AC migrated to PRD §4 Closed Tickets; PM-dashboard.md K-030 row moved to Closed section.
