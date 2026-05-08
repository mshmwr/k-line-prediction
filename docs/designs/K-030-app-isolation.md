---
id: K-030-design
title: /app page isolation — new tab + no site chrome + bg override — design doc
ticket: K-030
author: senior-architect
created: 2026-04-21
status: ready-for-qa-early-consultation
---

## 0 Pre-impl Preconditions

### 0.1 Ticket path / component name audit

All file/component names referenced by the ticket are confirmed to exist on this worktree's disk (`ls` / `grep` verified):

| Ticket reference | Disk state |
|------------|---------|
| `frontend/src/AppPage.tsx` | ✓ exists |
| `frontend/src/components/UnifiedNavBar.tsx` | ✓ exists |
| `frontend/src/components/home/HomeFooterBar.tsx` | ✓ exists |
| `frontend/src/index.css` | ✓ exists (contains K-021 `@layer base body` rule, L5–9) |
| `frontend/e2e/sitewide-body-paper.spec.ts` | ✓ exists (contains `/app` test, L46–51) |
| `frontend/e2e/sitewide-footer.spec.ts` | ✓ exists (contains `/app` test, L47–51) |
| `frontend/e2e/sitewide-fonts.spec.ts` | ✓ exists (contains `/app` footer font test, L55–73) |
| commit `338e4b8` | ✓ confirmed as K-021 Stage 2 design-system commit |

No path errata to register.

### 0.2 Pencil design file coverage

**`/app` is out of scope for the Pencil design file.** The 4 top-level frames in `frontend/design/homepage-v2.pen` are `Homepage 4CsvQ` / `About 35VCj` / `Diary wiDSi` / `Business Logic VSwW9` (marketing pages). `/app` is intentionally excluded from the marketing design system — this ticket reverts the marketing palette that was wrongly applied. Hence Pencil frame completeness check does not apply to this ticket.

### 0.3 Scope Questions — no unresolved contradictions

No contradictions between ticket AC and codebase / design doc. The 5 Architect arbitration items in ticket §"Design Decisions Pending" are resolved in §2 of this doc. No PM escalation needed.

---

## 1 Root Cause Recap

The root cause is already laid out in ticket §Root Cause. Architect adds one codebase verification:

**K-021 commit `338e4b8` diff against `AppPage.tsx`:**

```
 return (
-    <div className="h-screen bg-gray-950 text-gray-100 flex flex-col overflow-hidden">
+    <div className="h-screen flex flex-col overflow-hidden">
```

The original design intent of `/app` was a **neutral dark tool palette (`bg-gray-950` = `#0B0F19`, `text-gray-100` = `#F3F4F6`)**, consistent with TopBar's `bg-gray-900` / panel `bg-gray-900/70` and other tool-style dark panels. K-021 only removed the `bg-gray-950 text-gray-100` wrapper without adding a corresponding `/app`-specific non-paper bg rule, so the body-level paper bg bleeds through.

→ This also dictates the §2.1 background-color recommendation direction: return to original dark tool UI intent rather than switching to white / off-white.

---

## 2 Design Decisions — Architect arbitration

### 2.1 `/app` background color

**Options:**

| Option | Description | Color values |
|--------|------|------|
| A | Pre-K-021 original (`bg-gray-950` + `text-gray-100`) | bg `rgb(3, 7, 18)` / text `rgb(243, 244, 246)` |
| B | White (`#FFFFFF`) | pure-white tool UI |
| C | Off-white (e.g. `#F8F8F6`) | neutral light base |
| D | Paper-adjacent neutral (`#EDEAE3` etc.) | same family as paper but lighter |

**Pre-verdict scoring (1–10; dimensions locked before arbitration):**

| Dimension | Weight | A (dark) | B (white) | C (off-white) | D (paper-adj) |
|------|-------|---------|----------|--------------|---------------|
| Aligns with original design intent (`/app` palette pre-`338e4b8`) | 3 | 10 | 3 | 3 | 2 |
| Visual separation clarity from marketing site (paper) | 3 | 10 | 7 | 5 | 2 |
| Consistency with existing `/app` panels (`bg-gray-900/70` / `bg-gray-950`) | 2 | 10 | 2 | 2 | 1 |
| chart / OHLC table readability (dark theme vs light theme existing UI) | 2 | 9 | 5 | 5 | 4 |
| Future maintenance cost (revert/adjust) | 1 | 8 | 9 | 9 | 9 |
| **Weighted total** | | **9.7** | **4.5** | **4.3** | **2.7** |

**Score gap ≥ 1, choose A directly.**

**Recommendation: A — `bg-gray-950` + `text-gray-100`** (Tailwind default gray scale, no new tokens needed)

**Justification (one sentence):** All `/app` internal panels (TopBar `bg-gray-900`, side panel `bg-gray-900/70`, sticky predict bar `bg-gray-950`) already form a dark tool UI palette; restoring the `bg-gray-950` wrapper reinstates the original design intent removed by commit `338e4b8`.

---

### 2.2 bg override implementation

**Options:**

| Option | Description | Pros | Cons |
|--------|------|------|------|
| α | Add `bg-gray-950 text-gray-100` class on AppPage root `<div>` | minimal change (single-line className); scope limited to `/app`; body rule unchanged | tooling tests must assert wrapper `<div>` instead of `<body>` |
| β | New CSS module (`AppPage.module.css`) | strong encapsulation | no existing files use CSS module; breaks consistency; over-engineered |
| γ | Mount `route-app` class on body, add `body.route-app { @apply bg-gray-950 text-gray-100 }` in `index.css` | body-level override; same layer as body-paper rule | needs effect hook for dynamic class toggle; entry/exit `/app` timing easy to miss; StrictMode double-effect risk |
| δ | `index.css` adds `body:has(> #root [data-page="app"]) { ... }` | pure CSS, no JS | `:has()` browser support is widespread but old Safari edges remain; couples to DOM structure |

**Recommendation: α — AppPage root div className**

**Justification:**
1. Restores the pre-K-021 implementation (commit `338e4b8` removed exactly this wrapper className) — the smallest reverse change.
2. Scope limited to `/app`; the other 4 routes unaffected, consistent with K-021 body paper rule's intent (marketing site paper preserved, only excluding the tool page).
3. No new CSS architecture introduced (module / `:has()` / JS class toggle), lowest maintenance cost.

**Tradeoff vs body-level K-021 rule:** body remains `bg-paper`, but `/app` root div `h-screen` fills viewport + applies `bg-gray-950` to fully cover body bg, no beige bleed-through possible. DOM structure: `<body bg-paper>` → `<div id="root">` → `<div class="h-screen bg-gray-950">` (overrides) → after NavBar/Footer removal child nodes no longer depend on `bg-paper`.

---

### 2.3 New-tab implementation (UnifiedNavBar App link)

**Current state (codebase verified):** `UnifiedNavBar.tsx` L55–63 (desktop) and L71–80 (mobile) use `<Link to={link.path}>` from `react-router-dom`. `<Link>` does not support `target` prop (React Router SPA navigation does not match `target="_blank"` semantics).

**Recommendation:** `App` link **only** changes to native `<a>`; other links keep `<Link>`.

**Implementation pseudo-code:**

```
// Mark App with external: true in TEXT_LINKS array
TEXT_LINKS = [
  { label: 'App', path: '/app', external: true },
  { label: 'Diary', path: '/diary' },
  { label: 'Prediction', path: '/business-logic', hidden: true },
  { label: 'About', path: '/about' },
]

// At map time branch: external uses <a>, else <Link>
visibleLinks.map(link =>
  link.external
    ? <a
        href={link.path}
        target="_blank"
        rel="noopener noreferrer"
        aria-current={undefined}  // no active state (cross-tab, no pathname-match semantics)
        className={navLinkClass(link.path)}  // still apply inactive class for visual consistency
      >{link.label}</a>
    : <Link to={link.path} ...>
)
```

**Required attributes:** `target="_blank"` + `rel="noopener noreferrer"` (the latter prevents reverse tabnabbing + Referrer leakage; matches the global `components/primitives/ExternalLink.tsx` convention).

**`aria-current` handling:** When App link opens in a new tab, the current tab is still on the original page; the App link in this tab should never be `aria-current="page"` (the user is not on `/app`, the new tab is). When the new tab loads `/app`, that tab's NavBar is removed, so there's no App link to flag. Thus the App link's `aria-current` is left unset.

**Active class visual handling:** Keep `navLinkClass(path)`, but `pathname` is never `/app` (since `/app` no longer renders NavBar), so the App link always has the inactive class `text-[#1A1814]/60`, visually equal to `Diary` / `About`.

---

### 2.4 NavBar removal scope

**Sole consumer:** `AppPage.tsx` L9 `import UnifiedNavBar from './components/UnifiedNavBar'` + L369 `<UnifiedNavBar />`.

**Grep verification:**
```
grep -n "UnifiedNavBar" frontend/src/
→ AppPage.tsx:9, AppPage.tsx:369
→ HomePage.tsx / AboutPage.tsx / DiaryPage.tsx / BusinessLogicPage.tsx (4 marketing pages, untouched)
```

**Layout dependency analysis:** NavBar `h-[56px] md:h-[72px]` is a flex child; inside `<div class="h-screen flex flex-col">` NavBar takes the top, TopBar takes the next, `flex-1` main region fills the rest. Removing NavBar **increases** main region's available height by 56–72px — non-destructive layout change. AppPage has **no** hardcoded `margin-top` / `padding-top` / `calc(100vh - 72px)` based on NavBar height — confirmed grep for `"72px\|56px\|h-\[56px\|h-\[72px"` in `AppPage.tsx` returns zero matches.

---

### 2.5 Footer removal scope

**One sole consumer:** `AppPage.tsx` L10 import + L496 `<HomeFooterBar />`.

**Other HomeFooterBar consumers (preserved):** `HomePage.tsx` / `BusinessLogicPage.tsx` (grep verified).

**Layout dependency analysis:** HomeFooterBar is the last child of `<div class="h-screen flex flex-col overflow-hidden">`, after the main region (`flex-1`). Since `flex-1` consumes all remaining space, Footer is squeezed to the bottom by flex. After removal:

- `main region` (`flex-1`) height += original footer height (`py-5` + content + border ≈ 60–80px)
- `h-screen overflow-hidden` root div still fully fills viewport
- sticky predict button (L469 `sticky bottom-0`) still correctly sticks to main region's bottom (sticky is relative to the overflow container, i.e. the side panel, unaffected by Footer removal)

Safe to remove, no layout dependency.

---

### 2.6 Spec conflict resolution (`sitewide-body-paper.spec.ts` / `sitewide-footer.spec.ts` / `sitewide-fonts.spec.ts`)

**PM flagged:** `sitewide-body-paper.spec.ts` conflicts with ticket AC-030-BG-COLOR.

**Architect found two extra conflicts:**
- `sitewide-footer.spec.ts` L47–51: `/app — HomeFooterBar shows` → must fail after footer removal
- `sitewide-fonts.spec.ts` L55–73: `/app HomeFooterBar fontFamily Geist Mono` → must fail (no footer text to find)

**Options:**

| Option | Description |
|--------|------|
| A | `/app` overrides body bg at wrapper level; spec changes `/app` assertion to "wrapper `<div>` bg = `rgb(3, 7, 18)` (gray-950)" |
| B | Remove `/app` from sitewide-body-paper.spec.ts entirely; spec keeps body-level assertion (4 routes); `/app` is no longer in the sitewide paper rule's scope |

**Pre-verdict (dimensions locked before arbitration):**

| Dimension | Weight | A (assert wrapper) | B (remove /app) |
|------|-------|--------------------|------------------|
| Semantic clarity (spec name `sitewide-body-paper` reflecting assertion scope) | 3 | 5 (`/app` asserts wrapper not body, contradicts spec name) | 10 |
| Defense (would future re-adding `bg-paper` to AppPage be caught) | 3 | 9 (still asserts `/app` wrapper bg ≠ paper) | 9 (separate AC-030-BG-COLOR spec asserts `/app` wrapper bg ≠ paper) |
| Architectural consistency (does `/app` belong to sitewide paper system) | 2 | 3 (named sitewide but actually exception) | 10 (explicit exclusion, consistent with ticket stance: `/app` is not marketing site) |
| Spec naming cost | 1 | 10 (no rename) | 10 (no rename) |
| Test-coverage completeness | 2 | 9 | 10 (new spec AC-030-BG-COLOR independently asserts `/app` non-paper + wrapper bg consistency) |
| **Weighted total** | | **6.8** | **9.7** |

**Score gap ≥ 1, choose B.**

**Recommendation: B — Remove `/app` from `sitewide-body-paper.spec.ts`**

**Justification:** `/app` design intent is to **be excluded from the sitewide design system** (this is the core stance of K-030). Let `sitewide-body-paper.spec.ts` keep "4 marketing routes + business-logic 2 states" asserting body bg = paper; `/app`'s background is independently guarded by a new spec `app-bg-isolation.spec.ts`. Naming and semantics stay consistent; future route additions are obvious at a glance.

**Handling for the three specs:**

| Spec | Action |
|------|------|
| `sitewide-body-paper.spec.ts` | Remove L46–51 `AppPage (/app) — body bg=#F4EFE5` test; header comment "5 routes" → "4 routes"; total cases `6 cases` → `5 cases` |
| `sitewide-footer.spec.ts` | Remove L47–51 `/app — HomeFooterBar shows` test; header comment "3 independent test cases" → "2 + /business-logic post-login 1 = 3" + /about FooterCtaSection boundary |
| `sitewide-fonts.spec.ts` | Remove L55–73 `AC-021-FONTS — HomeFooterBar fontFamily cross-route` whole describe block (only tested `/app`); no replacement needed; HomePage HomeFooterBar Geist Mono is already covered in L35–53 |

**New spec:** `frontend/e2e/app-bg-isolation.spec.ts` (AC-030-BG-COLOR test, see §6).

---

## 3 Refactorability Checklist

- [x] **Single responsibility:** AppPage root div still only handles layout structure (`h-screen flex flex-col`); the new `bg-gray-950 text-gray-100` is a presentational class on the same layer as layout, acceptable.
- [x] **Minimal interface:** `UnifiedNavBar.tsx` TEXT_LINKS adds optional `external?: boolean`, default false, backward-compatible; non-essential sites need no change.
- [x] **Unidirectional dependency:** No NavBar ↔ AppPage cycle; AppPage imports NavBar (one-way), NavBar has no AppPage dependency.
- [x] **Substitution cost:** `/app` background tailwind class can be reverted in 1 file 1 line. NavBar `external` branch can be reverted in 1 file 1 conditional block.
- [x] **Test entry clarity:** AC-030-* 5 ACs map to 5 independent tests (new-tab / no-navbar / no-footer / bg-color / regression), each assertion clear.
- [x] **Change isolation:** `/app` bg change does not affect marketing 4-page body paper bg; NavBar App link external change does not affect other links' behavior (`<Link>` keeps SPA).

---

## 4 All-Phase Coverage Gate

**This ticket is single-phase (K-030 has no multi-phase split).** Four-dimension coverage within single phase:

| Dimension | Status | Notes |
|------|------|------|
| Backend API | ✅ N/A | Zero backend changes (ticket §Scope explicitly states "Not included: Any change to the prediction feature logic or API") |
| Frontend Routes | ✅ | No new routes (`/app` already exists); §5.1 Route Impact Table marks each one |
| Component Tree | ✅ | §5.2 lists `UnifiedNavBar` / `AppPage` / `HomeFooterBar` three impacted components + blast radius |
| Props Interface | ✅ | §5.3 lists `TEXT_LINKS` entry shape change (add `external?: boolean`); AppPage has no props |

---

## 5 Route Impact & Shared Component Blast Radius

### 5.1 Route Impact Table

Per persona hard gate (global-style / shared-component changes must list a Route Impact Table).

| Route | State | Notes |
|-------|------|-------|
| `/` | unaffected | body `bg-paper` rule unchanged; NavBar App link external change: clicks no longer SPA-navigate, open new tab; Home page itself visually unchanged |
| `/about` | unaffected | body `bg-paper` rule unchanged; NavBar App link as above |
| `/diary` | unaffected | body `bg-paper` rule unchanged; NavBar App link as above |
| `/business-logic` | unaffected | body `bg-paper` rule unchanged; NavBar App link as above |
| `/app` | **must-be-isolated** | wrapper bg overrides body paper to gray-950; NavBar fully unrendered; Footer fully unrendered; §2.2 α defines override implementation |

**Zero routes added or removed; only `/app` behavior changes.**

### 5.2 Shared Component Changes + Blast Radius

| Component | Path | Change | Blast Radius |
|------|------|------|--------------|
| `UnifiedNavBar` | `frontend/src/components/UnifiedNavBar.tsx` | TEXT_LINKS adds `external?: boolean`; App link rendering branches `<a target=_blank>` vs `<Link>` | All 4 marketing pages (HomePage / AboutPage / DiaryPage / BusinessLogicPage) — NavBar still renders, App link behavior takes effect for "all visitors": clicking App from any page opens new tab. navbar.spec.ts AC-NAV-4 App link test needs minor adjustment (see §6.2) |
| `HomeFooterBar` | `frontend/src/components/home/HomeFooterBar.tsx` | **Component itself unchanged**; only AppPage.tsx removes the import + `<HomeFooterBar />` (consumer-1) | HomePage / BusinessLogicPage continue to use, unaffected. architecture.md Footer placement table `/app` column changes from `<HomeFooterBar />` to `no footer (K-030 isolation)` |
| `AppPage` | `frontend/src/AppPage.tsx` | Root div className adds `bg-gray-950 text-gray-100`; remove `<UnifiedNavBar />` + `<HomeFooterBar />` + their imports | Page-specific, no cross-page impact |

### 5.3 Props interface change

**`UnifiedNavBar.tsx` TEXT_LINKS shape (diff only, shared-component boundary declaration):**

```
Before:
{ label: string; path: string; hidden?: boolean }

After:
{ label: string; path: string; hidden?: boolean; external?: boolean }
```

- `external?: boolean` — Optional. default undefined = SPA `<Link>`; true = native `<a target="_blank" rel="noopener noreferrer">`
- Only `App` entry has `external: true`; Diary / About / Prediction stay SPA

**AppPage.tsx:** No props (default export is parameterless component); no interface change.

---

## 6 File Change List

| File | Action | One-line description |
|------|------|---------|
| `frontend/src/AppPage.tsx` | Modify | Root `<div>` className adds `bg-gray-950 text-gray-100`; remove L9 UnifiedNavBar import, L10 HomeFooterBar import, L369 `<UnifiedNavBar />`, L496 `<HomeFooterBar />` |
| `frontend/src/components/UnifiedNavBar.tsx` | Modify | TEXT_LINKS App entry adds `external: true`; map renders `<a target=_blank rel=noopener noreferrer>` vs `<Link>` based on `external`; do this for both desktop + mobile maps |
| `frontend/e2e/sitewide-body-paper.spec.ts` | Modify | Remove L46–51 `/app` test; header JSDoc L5 `5 routes` → `4 routes`; L12 `5 independent cases not merged; /business-logic adds post-login state = 6 cases total` → `4 independent cases not merged; /business-logic adds post-login state = 5 cases total` |
| `frontend/e2e/sitewide-footer.spec.ts` | Modify | Remove L47–51 `/app — HomeFooterBar shows` test; header JSDoc L7 `Given: user visits /, /app, /business-logic` → `Given: user visits /, /business-logic`; L12 `3 independent test cases` → `2 independent test cases`; L13 `= 4` → `= 3` |
| `frontend/e2e/sitewide-fonts.spec.ts` | Modify | Remove the entire describe block `AC-021-FONTS — HomeFooterBar fontFamily cross-route` (L55–73) — its sole test case was `/app`, leaving the block empty |
| `frontend/e2e/navbar.spec.ts` | Modify | AC-NAV-4 `App link navigates to /app` test (L141–147) changes to new-tab assertion (using `context.waitForEvent('page')`); AC-NAV-1 / AC-NAV-2 `/app` `{ path: '/app', name: 'AppPage' }` entries (L33 / L71) → remove these 2 iterations (since `/app` no longer renders NavBar, asserting NavBar-present-on-/app would always fail); AC-NAV-4 mobile active link `on /app page (mobile)` test (L201–208) removed (same reason); AC-021-NAVBAR `on /app — App link has aria-current=page` test (L235–242) removed |
| `frontend/e2e/app-bg-isolation.spec.ts` | **Add** | New spec, 4 test cases mapping AC-030-NEW-TAB / NO-NAVBAR / NO-FOOTER / BG-COLOR (§6.2 details) |
| `frontend/e2e/ga-tracking.spec.ts` | No change | `/app fires page_view` test (L71–84) directly `page.goto('/app')` without NavBar click, still passes. Engineer must run to confirm; Architect deems no change needed |
| `frontend/e2e/ma99-chart.spec.ts` | No change | All `page.goto('/app')` are direct URL loads, not NavBar clicks, unaffected |
| `frontend/e2e/visual-report.ts` | No change | Continues to screenshot `/app` full page (no more NavBar + Footer, screenshot reflects ticket result), no script change needed |

**AppPage unit test impact confirmation:** `frontend/src/__tests__/AppPage.test.tsx` / `OHLCEditor.test.tsx` / `PredictButton.test.tsx` / `StatsPanel.test.tsx` / `MatchList.test.tsx` all test component behavior / utility logic, not relying on NavBar / Footer DOM, **no changes needed** (AC-030-FUNC-REGRESSION requires unit tests to pass without modification).

---

## 6.2 New Playwright Test Cases (app-bg-isolation.spec.ts)

**File:** `frontend/e2e/app-bg-isolation.spec.ts`
**Total tests:** 5 independent test cases (mapping AC-030-NEW-TAB / NO-NAVBAR / NO-FOOTER / BG-COLOR ×2 / PENCIL-ALIGN bound by T4)
**Viewport:** 1280×800 (desktop); AC-030 does not require independent mobile validation, AC-030-NO-NAVBAR / NO-FOOTER DOM assertions on desktop fully cover

| Test ID | describe / test title | Assertion skeleton |
|---------|----------------------|---------|
| T1 | `AC-030-NEW-TAB — App link opens /app in new tab` / `clicking App link on / opens new tab with /app URL` | `page.goto('/')`; `await context.waitForEvent('page', { predicate: p => p.url().includes('/app') })` wraps click; assert App link element `attr target=_blank` + `attr rel=noopener noreferrer`; assert original tab URL still `/`; assert new page URL match `/app` |
| T2 | `AC-030-NO-NAVBAR — /app page has no UnifiedNavBar` / `navbar testids absent on /app` | `page.goto('/app')`; `expect(page.locator('[data-testid="navbar-desktop"]')).toHaveCount(0)`; `expect(page.locator('[data-testid="navbar-mobile"]')).toHaveCount(0)`; `expect(page.getByRole('link', { name: 'Home', exact: true })).toHaveCount(0)`; `expect(page.getByText('Loaded rows:')).toBeVisible()` (TopBar tool content still present) |
| T3 | `AC-030-NO-FOOTER — /app page has no HomeFooterBar` / `HomeFooterBar text absent on /app` | `page.goto('/app')`; `expect(page.getByText('yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn', { exact: true })).toHaveCount(0)`; `expect(page.getByText('This site uses Google Analytics to collect anonymous usage data.', { exact: true })).toHaveCount(0)` |
| T4 | `AC-030-BG-COLOR / AC-030-PENCIL-ALIGN — /app wrapper bg is gray-950, not paper` / `app root wrapper computed bg matches gray-950 (rgb(3,7,18)) — binds Pencil ap001 frame` | `page.goto('/app')`; wait networkidle; read root `<div class="h-screen ...">` computed `background-color`, assert `!== 'rgb(244, 239, 229)'` AND `=== 'rgb(3, 7, 18)'` (Tailwind gray-950, also locks Pencil v1 `ap001` frame color) |
| T5 | `AC-030-BG-COLOR — body bg paper rule preserved on /app` / `body computed bg remains rgb(244,239,229) on /app` | `page.goto('/app')`; wait networkidle; read body computed bg, assert `=== 'rgb(244, 239, 229)'` (proves K-021 sitewide body rule not deleted, only wrapper-level override; defends against future refactor that scopes body to route making T4 still pass while K-021 silently regresses) |

**Why split into 5 independent cases not merged:** PM quantitative rule (existing K-021 / K-022) — at least 1 independent test case per AC; merging makes failure debugging harder. AC-030-BG-COLOR was split during ticket QA Early Consultation by PM into wrapper and body assertions (ticket L191 Option A), so T4/T5 are listed separately; T4 also binds AC-030-PENCIL-ALIGN (no independent spec; T4's color assertion locks the Pencil frame).

### 6.3 Post-review addendum (pending Engineer landing)

After Code Review I-2 round, Engineer is in fix pass 2 to add a Hero CTA new-tab test case (another `/app` open entry outside `AppPage`; if it exists it needs the same new-tab assertion as T1). Once Engineer implements and lands the test, PM will update §6.2 total 5→6 and add T6 at ticket close. We don't pre-bump the total to avoid mismatch between design doc and main branch spec.

### 6.2.1 Playwright new-tab pattern (T1 detail for Engineer)

```
const { page, context } = ...
await page.goto('/')
const [newPage] = await Promise.all([
  context.waitForEvent('page'),
  page.locator('[data-testid="navbar-desktop"]').getByRole('link', { name: 'App', exact: true }).click(),
])
await newPage.waitForLoadState()
expect(newPage.url()).toContain('/app')
expect(page.url()).toMatch(/\/$/)  // original tab still on /
```

**Note:** `Promise.all` registers `waitForEvent('page')` and `click()` in parallel, avoiding the listener missing the new-page event triggered by click.

---

## 7 Boundary Preemption

For each impacted AC, list boundary behaviors:

| Boundary scenario | Defined in design | Behavior |
|---------|-------------------|------|
| User disables JS (SPA cannot run) | ✅ | AC-030 generally requires SPA scenarios; if JS disabled, `/app` itself cannot load (React not mounted), unrelated to this ticket |
| Popup blocker blocks new tab | ✅ | `<a target="_blank">` triggered by user click is user-initiated navigation; mainstream browsers don't block it (unlike `window.open()` script-triggered). No fallback needed |
| middle-click / ctrl-click | ✅ | Native `<a href>` supports all browser nav shortcuts (middle-click new tab / ctrl+click / cmd+click); `<Link>` react-router interception breaks this — switching to `<a>` actually fixes it (bonus) |
| keyboard accessibility | ✅ | `<a>` itself focusable; no extra `tabIndex` needed; NavBar keeps keyboard nav (Tab cycle) |
| App link clicked when context already closed (tab already in unload) | ✅ | N/A — when user clicks, tab must be active |
| `/app` direct URL load (not from NavBar click) | ✅ | T2 / T3 / T4 tests are direct goto; behavior consistent |
| Empty viewport (extra-narrow) | ✅ | AppPage already uses `h-screen` (not min-h); even without NavBar + Footer, main region fills viewport, no empty space |
| NavBar `external` not set (undefined) | ✅ | default branch goes to `<Link>`, backward-compatible |
| Browsers blocking `noopener` (very old) | ✅ | `rel="noopener noreferrer"` is a declarative string; old browsers ignoring it still render the link correctly (just without protection); not in ticket scope |

No unresolved boundary.

---

## 8 Implementation order (suggested for Engineer)

1. **Edit AppPage.tsx first** (smallest surface, no other-file dependency):
   - Add `bg-gray-950 text-gray-100` to root div
   - Remove UnifiedNavBar import + usage
   - Remove HomeFooterBar import + usage
   - `/playwright` runs ma99-chart + pages.spec.ts to confirm `/app` tool functions intact
   - `npx tsc --noEmit` to confirm types are clean

2. **Edit UnifiedNavBar.tsx** (NavBar shared site-wide, large impact radius):
   - TEXT_LINKS App entry adds `external: true`
   - desktop map + mobile map both add branch
   - `/playwright` runs the navbar.spec.ts tests — expect AC-NAV-4 App link test (current version) to fail (`.click()` triggers new tab not same-tab navigate); proceed to next step

3. **Fix the existing 3 specs** (sitewide-body-paper / sitewide-footer / sitewide-fonts / navbar):
   - Remove `/app` test cases / blocks (per §6)
   - `/playwright` full run — expect all green

4. **Add app-bg-isolation.spec.ts:**
   - Per §6.2 write 4 test cases
   - `/playwright` runs all E2E — all green

5. **Run Vitest unit once:**
   - `npm test` to confirm AppPage / OHLCEditor / PredictButton / StatsPanel / MatchList all green (AC-030-FUNC-REGRESSION)

6. **deploy check** (per CLAUDE.md Deploy Checklist):
   - `grep "/api/" src/` to confirm no missing API path
   - `npm run build` succeeds

**Parallelizable:** None; Step 2 depends on Step 1 having removed NavBar from AppPage (otherwise `/app` simultaneously renders NavBar + clicking App link → jumps from `/app` back to `/app`, weird semantics). Steps 3 / 4 can run in parallel after Step 2.

---

## 9 Risks & Notes

| Category | Item | Description |
|------|------|------|
| Security | `rel="noopener noreferrer"` must coexist | `noopener` blocks reverse tabnabbing, `noreferrer` blocks Referrer leakage. Defined in §2.3; Code Review greps `target="_blank"` to confirm pairing |
| Visual | Dark `/app` vs light marketing site contrast | Per ticket design intent (tool UI vs marketing palette deliberately separated), not a bug |
| Visual | TopBar L7 `bg-gray-900 border-b border-gray-700` vs new root `bg-gray-950` contrast | No issue; pre-K-021 was the same way (`bg-gray-950` root + `bg-gray-900` TopBar same design); restoring original |
| Layout | `h-screen overflow-hidden` + remove 2 flex children | main region flex-1 auto-grows to consume remaining height; sticky predict button `sticky bottom-0` still anchored to side panel bottom (relative to scroll container); no layout break |
| Accessibility | NavBar removal means `/app` has no in-site nav | User can only close tab or manually change URL to leave; consistent with "tool application has independent viewport" intent (analogy: Figma / Notion full-screen) |
| Test | ga-tracking.spec.ts tests `/app` pageview | Preserved (direct goto still triggers pageview); but Engineer must run to confirm |
| Test | `navbar.spec.ts` has 3 `/app` iterations to delete | Documented in §6; Engineer follows the table to delete |
| Deploy | Firebase Hosting + Cloud Run | No backend change, no API path change; `/app` route SPA fallback unchanged |

---

## 10 Architecture Doc Sync

Need to update the following sections of `agent-context/architecture.md`:

### 10.1 Frontend Routing table

`/app` row NavBar description: existing "NavBar mounted on all pages" remains (description is in Design System section), but in "UnifiedNavBar" section add a line "`/app` does not render NavBar (K-030 isolation)".

### 10.2 Design System §"Footer placement strategy" table

`/app` column: `<HomeFooterBar />` → `no footer (K-030 isolation, /app is independent tool viewport)`

### 10.3 Design System §"Shared Components boundary" table

`HomeFooterBar` used-by column: `/ /app /business-logic` → `/ /business-logic`

### 10.4 Design System §"Sitewide Body CSS entry point" section

Add a note: "`/app` overrides at wrapper level (`bg-gray-950 text-gray-100`); body rule's effect on `/app` is overridden. K-030 introduces this exception, marking `/app` as not part of the sitewide paper system (tool page, not marketing page)."

### 10.5 Add changelog entry

```
- **2026-04-21** (Architect, K-030 post-code-review doc alignment) — §6.2 test count 4→5 + T4/T5 split (originally T4 merged wrapper bg + body bg assertions; changed to T4 = wrapper `rgb(3,7,18)` + AC-030-PENCIL-ALIGN binding; T5 = body `rgb(244,239,229)` preserved); AC mapping adds AC-030-PENCIL-ALIGN; added §6.3 post-review addendum placeholder for Hero CTA new-tab test case pending Engineer fix pass 2 landing. I-2 Code Review drift fix, no source code change.
- **2026-04-21** (Architect, K-030 design) — `/app` isolation: UnifiedNavBar no longer renders on /app; HomeFooterBar removed from /app (Footer placement table /app changes to "no footer", Shared Components boundary table HomeFooterBar used-by shrinks to `/ /business-logic`); AppPage root div returns to pre-K-021 `bg-gray-950 text-gray-100` palette (wrapper-level override of body paper); UnifiedNavBar TEXT_LINKS adds `external?: boolean`, App link sets external=true to open new tab (`<a target=_blank rel=noopener noreferrer>`). Engineer post-delivery e2e spec change list: sitewide-body-paper/footer/fonts remove /app cases; navbar.spec.ts AC-NAV-*/AC-021-NAVBAR remove /app iterations; new app-bg-isolation.spec.ts (4 test cases for AC-030-NEW-TAB/NO-NAVBAR/NO-FOOTER/BG-COLOR).
```

### 10.6 Self-Diff Verification

After Architect syncs architecture.md, append the following to that Edit:

```
### Self-Diff Verification
- Section edited: Footer placement strategy table + Shared Components boundary table + Sitewide Body CSS entry section + Changelog
- Source of truth: K-030 ticket §Scope (ticket L35–41), this design doc §2.5 / §5.2 / §10
- Row count compare: Footer placement 5 rows vs 5 rows ✓; Shared Components 3 rows vs 3 rows ✓; used-by column `/ /business-logic` matches Footer table /app=no footer ✓
- Cross-table sweep within file: `grep -n 'HomeFooterBar' agent-context/architecture.md` all hits validated cell-by-cell ✓ (Footer placement table L468 + Shared Components table L476, synced)
- Diff: none
```

**This Self-Diff block will be appended to Changelog by Architect when actually editing architecture.md; design-doc stage declares expected results; actual edit happens immediately after handoff (see handoff steps below).**

---

## 11 Handoff

- This design doc status = `ready-for-qa-early-consultation`
- Next: PM initiates QA Early Consultation (per ticket §QA Early Consultation 4 boundary confirmations)
- After QA confirms, PM releases Engineer
- Architect finished: this doc + §10 architecture-doc sync + retrospective append (below)

---

## Retrospective

**Where most time was spent:** §2.1 background-color Pre-verdict scoring (5 dimensions × 4 options = 20 cells) and §2.6 spec conflict's two extra conflicts (`sitewide-footer.spec.ts` / `sitewide-fonts.spec.ts`) — PM only flagged `sitewide-body-paper.spec.ts`; Architect grepped `/app` across the whole e2e directory to find 2 more must-link specs.

**Which decisions needed revision:** None.

**Next-time improvement:** Persona already has "global style / shared component changes must list a Route Impact Table", but for "removing a shared component (reverse change)" the same scan is not codified. Next ticket involving "remove shared component from a page" should grep that component across the whole e2e directory in step 1, not just read the PM-flagged spec, to avoid missing linked specs. This improvement is added to `senior-architect.md` "Cross-Page Duplicate Audit" section as a separate **Shared Component Removal Scan** rule.
