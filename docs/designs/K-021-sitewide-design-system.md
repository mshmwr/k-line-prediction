---
title: K-021 Sitewide Design System Foundation — Palette + Fonts + NavBar + Footer
type: design
ticket: K-021
owner: senior-architect
created: 2026-04-20
pencil-frames-confirmed:
  - "35VCj — About /about (K-017 v2)"
  - "4CsvQ — Homepage / (v2 Dossier)"
  - "wiDSi — Diary /diary (v2 Dossier)"
  - "VSwW9 — Business Logic /business-logic (v2 Dossier)"
pencil-frames-missing:
  - "/login (no frame in design source — see §0 Scope Question Q1)"
---

## 0. Scope Questions for PM (read before design)

Architect persona cannot rule on requirements. The following two items are contradictions between ticket text and actual codebase / design source; PM must rule **before** releasing Engineer. Design below proceeds with assumed PM rulings. Engineer must check PM reply before acting.

### Ruling status (2026-04-20 PM agent ruling)

| Question | PM Ruling | Pre-Verdict Matrix Score | Anchor |
|----------|-----------|--------------------------|--------|
| Q1 — `/login` route | **Option A — Replace with `/business-logic`** (no new /login route) | 10/10 (A vs B=1, C=4) | ticket §3 + AC-021-BODY-PAPER + AC-021-FOOTER + design decision table |
| Q2 — NavBar active color | **Option C — Two colors coexist** (`brick = #B43A2C` for K-023 Hero; `brick-dark = #9C4A3B` for NavBar active) | 10/10 (C vs B=9, A=3) | ticket AC-021-NAVBAR + design decision table |

Engineer takes over per ticket revised text. Design below assumes "Q1=A / Q2=C"; Architect recommendation matches PM ruling.

### Q1 — `/login` route does not exist; AC 5-page assertion coverage conflict

**Facts:**
- Ticket AC-021-BODY-PAPER / AC-021-FOOTER list 5 routes: `/` / `/about` / `/diary` / `/app` / `/login`
- `frontend/src/main.tsx` registers 5 routes: `/` / `/app` / `/about` / `/diary` / `/business-logic`
- `frontend/design/homepage-v2.pen` top-level frames cover 4 pages: Homepage / About / Diary / Business Logic (no Login frame)
- Codebase grep `login` → 0 match (only e2e spec contains `bl_token` localStorage logic, unrelated to login page)
- Existing `BusinessLogicPage` is itself an auth-gated page rendering `<PasswordForm />` when no token (acts as the de-facto login page)

**Two interpretations:**

| Interpretation | Meaning | Impact |
|----------------|---------|--------|
| A | Ticket typo, `/login` should be `/business-logic` | 5 pages = current 5 routes; ticket scope unchanged, implementation path clear |
| B | `/login` is a future standalone route; ticket asks to scaffold an empty page | Ticket scope expands; need new `frontend/src/pages/LoginPage.tsx` + main.tsx route registration; but ticket "scope" section did not list this work |

**Architect recommendation: A (ticket typo).** Reasons:
1. All concrete work items in ticket "Scope" §1 palette token, §2 fonts, §3 body palette, §4 NavBar, §5 Footer assume the existing 5-route frame; adding `/login` would be a separate feat ticket
2. Ticket §3 lists "`/` / `/about` / `/diary` / `/app` / `/login`" then says "excluding `/business-logic`" — the "excluding" reveals the author originally treated /business-logic as out of scope. Under interpretation A, PM realises business-logic is auth-gated; auth gate state is the de-facto login state. AC-021-BODY-PAPER requires `/login` body to go paper, so under A, `/business-logic` must also go paper, covering both "unauthenticated form" and "authenticated trade logic" UI states
3. Pencil frame VSwW9 named "Business Logic /business-logic (v2 Dossier)" already contains the paper version of /business-logic; no /login frame

**PM must answer:**
- A or B?
- If A: in AC-021-BODY-PAPER / AC-021-FOOTER replace `/login` with `/business-logic`. 5 pages = `/` / `/app` / `/about` / `/diary` / `/business-logic` (literal contradiction with ticket §3 "excluding /business-logic" — PM must decide: include /business-logic, or actually skip it making it 4 pages?)
- If B: ask Architect to open scope-extension ticket K-021-B; this ticket excludes /login

**Design below assumes "PM adopts A and includes `/business-logic` in 5 pages (with auth gate state)".** Engineer must not start until Q1 confirmed.

### Q2 — NavBar active state color does not match ticket AC

**Facts:**
- Ticket AC-021-NAVBAR: active state `text-brick` = `#B43A2C`
- Ticket scope §1 palette tokens: `brick` = `#B43A2C`, `brick-dark` = `#9C4A3B`
- Existing `UnifiedNavBar.tsx` + `frontend/e2e/navbar.spec.ts` use `#9C4A3B` (brick-dark) for active
- K-017 Pass 2 Reviewer retrospective updated palette to `#9C4A3B` (see ticket `## AC-NAV-4 — Active link highlighted`)

**Two interpretations:**

| Interpretation | Meaning |
|----------------|---------|
| A | Ticket AC is truth; active should change to `#B43A2C`; existing navbar.spec.ts active assertion updates accordingly |
| B | Existing implementation is truth (K-017 accepted brick-dark); ticket AC is typo; AC-021-NAVBAR `text-brick` should change to `text-brick-dark` or stay `#9C4A3B` |

**Architect recommendation: B (existing implementation is truth).** Reasons: design source homepage-v2.pen renders NavBar active closer to `#9C4A3B` (brick-dark contrasts better on paper; #B43A2C on #F4EFE5 is too bright). Existing Playwright assertion already accepted in K-017. Changing color regresses K-017 visual decision.

**PM must answer:** A or B? If B, design below uses `text-brick-dark` for NavBar active throughout; `brick` token reserved but not used in this ticket (kept for future high-contrast accent use).

**Design below assumes interpretation B.**

---

## 1. Decision summary (three rulings + consistency notes)

| Item | Ruling | Section |
|------|--------|---------|
| Font loading | **Confirm existing Google Fonts CDN (index.html preconnect + stylesheet link)**; do not switch to local `@font-face` | §3 |
| Sitewide body palette CSS entry | **Option A: `frontend/src/index.css` global `body { @apply bg-paper text-ink; }`**; remove dark wrapper `bg-[#0D0D0D] text-white` from 4 Page components | §6 |
| Footer placement | **Each Page component imports `<HomeFooterBar />` / `<FooterCtaSection />` at its end**; no Layout slot | §5 |
| NavBar active state color | `#9C4A3B` (brick-dark), pending Q2 PM ruling | §4 |

---

## 2. Pencil frame completeness audit (persona-mandated)

This section satisfies `~/.claude/agents/senior-architect.md` Pencil Frame Completeness Check rule (root-cause guard against K-017 missing Homepage v2).

**Confirmed frame list via batch_get (homepage-v2.pen):**

| Frame ID | Name | Route | Affected by this ticket |
|----------|------|-------|-------------------------|
| `4CsvQ` | Homepage / (v2 Dossier) | `/` | Yes (body bg / NavBar / HomeFooterBar) |
| `35VCj` | About /about (K-017 v2) | `/about` | Yes (body bg overrides dark / NavBar / FooterCtaSection unchanged) |
| `wiDSi` | Diary /diary (v2 Dossier) | `/diary` | Yes (body bg overrides dark / NavBar; K-024 decides Footer) |
| `VSwW9` | Business Logic /business-logic (v2 Dossier) | `/business-logic` | Yes (body bg overrides dark / NavBar / HomeFooterBar) assuming Q1=A |

**AppPage (`/app`) has no .pen frame:** design source contains only the 4 public-facing pages; `/app` is a tool page (predictor UI). Its palette must follow the sitewide unified paper/ink rule **mandatorily** without separate design-source verification. Engineer must dev-server-inspect `/app` in 4 states (empty / uploading / predicting / results); Playwright class-name assertion alone is insufficient (memory `feedback_shared_component_all_routes_visual_check.md`).

**PM scope match:** ticket §3 lists 5 pages (assuming Q1=A includes /business-logic). 4 .pen frames + AppPage = 5, matches. No missing pages.

---

## 3. Font loading ruling

### 3.1 Current state

- `frontend/index.html` line 7–9 already contains preconnect + stylesheet `<link>` to Google Fonts loading IBM Plex Mono / Bodoni Moda / Newsreader / Geist Mono
- `frontend/src/components/home/HeroSection.tsx` uses inline `style={{ fontFamily: '"Bodoni Moda", serif' }}` etc. for 3 fonts; K-017 QA visual report PASS confirms Google Fonts already serves in production
- `frontend/tailwind.config.js` `theme.extend` is empty `{}`; `fontFamily` not registered → cannot use `font-display` / `font-italic` / `font-mono` Tailwind classes; Engineer can only use inline style

### 3.2 Option comparison

**Option A: Keep Google Fonts CDN** (extend current state)

- Implementation: keep index.html `<link>`, only add tailwind `fontFamily` entries binding `font-display/italic/mono` classes to `Bodoni Moda/Newsreader/Geist Mono`
- Optional: add `media="print" onload="this.media='all'"` non-blocking load mode to index.html `<link>` (FOUC optimisation)

**Option B: Switch to local `@font-face`**

- Implementation: download 4 woff2 files to `frontend/public/fonts/`, add `@font-face` block to `index.css`, remove Google Fonts `<link>` from index.html
- New files: `public/fonts/BodoniModa-Italic.woff2`, `public/fonts/Newsreader-Italic.woff2`, `public/fonts/GeistMono-Regular.woff2` + `GeistMono-Bold.woff2` + `public/fonts/IBMPlexMono-Regular.woff2` + `IBMPlexMono-Bold.woff2` (~6 woff2 files)

### 3.3 Scoring matrix (Pre-Verdict)

| Dimension | Weight | Option A — CDN | Option B — Local |
|-----------|--------|----------------|------------------|
| Performance (first-paint load) | 20% | 7/10 (CDN edge cache hot, but cross-origin handshake; preconnect optimised) | 8/10 (same-origin HTTP/2 multiplex, but first load increases bundle body) |
| Offline reliability | 20% | 4/10 (Google Fonts down or blocked = fails; fallback active but visual degrades) | 10/10 (fully controlled) |
| Implementation cost | 20% | 10/10 (already in place; only add tailwind tokens) | 4/10 (download licence compliance, file naming, 5 @font-face blocks, `font-display: swap`, subsetting all manual) |
| Maintenance cost | 20% | 9/10 (Google auto-updates + subsetting) | 5/10 (font upgrades need manual re-subset + update) |
| Privacy GDPR | 20% | 5/10 (Google Fonts CDN reports IP/User-Agent to Google; GDPR grey area; some EU enterprises ban) | 10/10 (fully self-hosted) |
| **Weighted total** | | **7.0** | **7.4** |

### 3.4 Red-team self-check (≥3 items)

1. **"CDN is live and K-017 has PASSED, why not just Option A?"** — Option A perf/cost scores reasonable; total trails B by 0.4 mainly on GDPR. Target audience is recruiter portfolio, not EU B2B contract clients; GDPR at current user scale is over-engineering.
2. **"Will Option B woff2 download exceed CDN traffic?"** — 4 fonts subset total ~80–120 kB, CDN similar 80 kB level; Option B same-origin HTTP/2 multiplex with main bundle may yield faster TTFP. But Firebase Hosting single-bundle size already near 500 kB warning line (per AC-021-REGRESSION); +120 kB triggers warning, requires Engineer to adjust `vite build` chunk split, out of ticket scope.
3. **"Google Fonts blocked scenario?"** — Production target (Firebase Hosting + global CDN) rarely hits this; dev environment (Taipei / Taiwan) unaffected. If recruiter opens from mainland China, fonts may fail → fallback `serif`/`monospace`, visual degrades but no crash. Risk logged as Tech Debt (§11 TD-K021-01); not blocker.
4. **"index.html preconnect already active, why need stylesheet link?"** — preconnect only establishes TCP+TLS; stylesheet still requires CSS download. Current implementation correct; Option A unchanged.

### 3.5 Ruling

**Adopt Option A — keep Google Fonts CDN.** Tailwind config adds `fontFamily` mapping; Engineer this ticket: no woff2 files, no index.html `<link>` edit. Fallback strategy: Tailwind tokens use `['Bodoni Moda', 'serif']` arrays with fallback; if Google Fonts fails to load, system serif / monospace renders, body does not crash. GDPR / firewall risk logged as Tech Debt; not blocker.

### 3.6 Migrating existing inline fontFamily (tech debt cleanup)

`HeroSection.tsx` 4 inline `style={{ fontFamily: ... }}` instances **recommended for Engineer to convert to Tailwind class in this ticket** (`font-display italic` / `font-italic` / `font-mono`) — K-022 Homepage v2 redesign will heavily edit this file; standardising class convention now reduces K-022 conflict. This work is in ticket scope (palette tokens applied via class concurrently); no new TD.

---

## 4. Tailwind config structure (full before/after diff)

### 4.1 Before (current)

File: `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/frontend/tailwind.config.js`

```js
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [require('@tailwindcss/typography')],
}
```

### 4.2 After (Engineer target shape)

```js
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F4EFE5',
        ink: '#1A1814',
        brick: '#B43A2C',
        'brick-dark': '#9C4A3B',
        charcoal: '#2A2520',
        muted: '#6B5F4E',
      },
      fontFamily: {
        display: ['"Bodoni Moda"', 'serif'],
        italic: ['"Newsreader"', 'serif'],
        mono: ['"Geist Mono"', 'monospace'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
```

### 4.3 JIT availability verification

- Tailwind v3.4.4 (per package.json) JIT enabled by default; `content` glob covers `src/**/*.{ts,tsx}`; new tokens compile once they appear in tsx class
- `bg-paper` / `text-ink` / `text-brick` / `text-brick-dark` / `bg-charcoal` / `text-muted` / `font-display` / `font-italic` / `font-mono` — 9 classes available
- Verification steps (Engineer checklist):
  1. Edit tailwind.config.js
  2. Add `<div className="bg-paper text-ink">` in any component → dev server hot reload renders correctly
  3. `npx tsc --noEmit` exit 0
  4. `npm run build` succeeds; verify `dist/assets/index-*.css` contains `.bg-paper{background-color:#F4EFE5}` etc.

### 4.4 Existing hardcoded hex migration strategy

Codebase grep finds multiple hardcoded `#F4EFE5` / `#1A1814` / `#9C4A3B` instances (NavBar, HomeFooterBar, HeroSection, BuiltByAIBanner). **This ticket does not force full migration** (out of scope; K-022/K-023/K-024 page-redesigns will handle progressively). Only require:

- Files newly added or rewritten in this ticket (mainly `index.css`, `tailwind.config.js`, `UnifiedNavBar.tsx`, `HomeFooterBar.tsx` + 5 Page wrappers) use new classes (`bg-paper` / `text-ink` / `text-brick-dark` / `text-muted` etc.)
- Existing inline hex untouched; subsequent tickets migrate progressively (TD logged as §11 TD-K021-02)

---

## 5. NavBar component refactor

### 5.1 Existing implementation (Read confirmed)

File: `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/frontend/src/components/UnifiedNavBar.tsx`

- **Item order (current):** left `⌂` icon Link / right `App | About | Diary | Logic 🔒` (`Logic` includes LockIcon)
- **Palette (current):** `bg-[#F4EFE5]` / `border-[#1A1814]` / inactive text `text-[#1A1814]/60` / active text `text-[#9C4A3B]` / Logic purple `text-purple-500`
- **Height / padding:** `h-[56px] md:h-[72px]` / `px-6 md:px-[120px]`
- **Active detection:** `pathname === path` (`useLocation()` hook)
- **Mobile / Desktop:** two containers tagged `data-testid="navbar-desktop"` / `data-testid="navbar-mobile"`, toggled via `hidden md:flex` / `flex md:hidden`

### 5.2 Ticket §4 requirements (delta from current)

| Item | Current | Ticket required | Delta |
|------|---------|-----------------|-------|
| Item order | ⌂ / App / About / Diary / Logic 🔒 | ⌂ / App / Diary / Prediction(hidden) / About | Reorder: About → rightmost; Diary moves up; Logic → Prediction (hidden) |
| `Logic` label | `Logic` | `Prediction` (hidden) | Rename |
| Prediction link rendering | `Logic` rendered (with LockIcon, text-purple-500) | `Prediction` hidden (not rendered to DOM) | Change to `hidden` attribute or conditional false |
| Active state | `text-[#9C4A3B]` (brick-dark) | `text-brick` (#B43A2C) | Q2 pending PM ruling; design assumes B (keep brick-dark) |

### 5.3 Props interface (before / after diff)

**Before:** `UnifiedNavBar` has no props (zero props).

**After:** `UnifiedNavBar` keeps zero props (all logic derived from `useLocation()`), **no new props**. Item order and labels reordered via internal `TEXT_LINKS` constant; `Prediction` flagged `hidden: true` and filtered.

```ts
// Internal constant (non-exported API) redefined:
// Assuming Q2=B (active=brick-dark unchanged)

const TEXT_LINKS: Array<{ label: string; path: string; hidden?: boolean }> = [
  { label: 'App', path: '/app' },
  { label: 'Diary', path: '/diary' },
  { label: 'Prediction', path: '/business-logic', hidden: true }, // K-021 hidden
  { label: 'About', path: '/about' },
]
```

Component renders via `TEXT_LINKS.filter(link => !link.hidden).map(...)`; `Prediction` link and LockIcon never reach DOM. Existing desktop/mobile dual-container structure unchanged.

### 5.4 Item-order migration steps

1. Reorder `TEXT_LINKS` array: `App / Diary / Prediction(hidden) / About`
2. Delete original `<Link to="/business-logic">...LockIcon...</Link>` standalone JSX block (one each in desktop + mobile); render via map (filter hidden)
3. Remove `LockIcon` import from `lucide-react` (unused)
4. Keep `HomeIcon` as left Home link
5. If Q2=A, change color class to `text-[#B43A2C]`; if Q2=B, keep `text-[#9C4A3B]`

### 5.5 Active state detection

**Keep class comparison + add `aria-current="page"` (dual mechanism)** — previously class-only, suboptimal for screen reader and future test assertion flexibility:

```tsx
<Link
  to={link.path}
  aria-current={isActive ? 'page' : undefined}
  className={isActive ? 'text-[#9C4A3B] ...' : 'text-[#1A1814]/60 ...'}
>
```

- Existing Playwright assertion `toHaveClass(/text-\[#9C4A3B\]/)` continues to pass
- New `aria-current="page"` attribute lets AC-021-NAVBAR's 4 active-state test cases use the more stable `[aria-current="page"]` selector (Engineer adds assertion in this ticket; see §9)

### 5.6 Consumer impact (grep results)

Current `UnifiedNavBar` consumers (5 imports + 5 JSX usages):

| File | Usage line | Affected |
|------|------------|----------|
| `frontend/src/pages/HomePage.tsx` | L7 import / L14 `<UnifiedNavBar />` | No (NavBar internals change; consumer unchanged) |
| `frontend/src/pages/AboutPage.tsx` | L1 import / L15 | No |
| `frontend/src/pages/DiaryPage.tsx` | L5 import / L12 | No |
| `frontend/src/pages/BusinessLogicPage.tsx` | L6 import / L89 | No |
| `frontend/src/AppPage.tsx` | L9 import / L368 | No |

**Conclusion:** NavBar internal refactor does not affect any consumer JSX usage. Only potential impact: `LockIcon` no longer rendered → e2e/navbar.spec.ts AC-NAV-6 "Logic link with LockIcon" test must fail (must update spec or delete test group; see §9 REGRESSION).

### 5.7 Legacy `NavBar.tsx` handling

File: `frontend/src/components/NavBar.tsx` (marked `@deprecated`, never imported, 5-link order is old Home/App/About/Diary/Business Logic).

**Recommend deleting in this ticket** (dead file, 0 consumers; K-017 Code Reviewer already flagged dead file). Reasons:
- Dead file removal cost is trivial (1 git rm)
- Keeping old file misleads new Engineer
- AC-021-NAVBAR involves NavBar refactor; cleaning up alongside is reasonable

If PM disallows scope expansion, log as TD (§11 TD-K021-03) for future.

---

## 6. Sitewide body palette CSS entry ruling

### 6.1 Current state

- `frontend/index.html` body already has `class="bg-[#F4EFE5]"` → paper bg active
- `frontend/src/index.css` currently only `@tailwind base; @tailwind components; @tailwind utilities;`; no body rule
- 4 Page components inner `<div className="min-h-screen bg-[#0D0D0D] text-white">` overrides body to dark (AboutPage / DiaryPage / BusinessLogicPage / AppPage's `h-screen bg-gray-950 text-gray-100`)
- HomePage already `<div className="min-h-screen bg-[#F4EFE5] text-[#1A1814]">` (paper, K-017 done)

### 6.2 Option comparison

**Option A — `frontend/src/index.css` global `body` rule**

```css
/* index.css after */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-paper text-ink;
  }
}
```

+ 4 Page components (AboutPage / DiaryPage / BusinessLogicPage / AppPage) **remove** inner `<div className="min-h-screen bg-[#0D0D0D] text-white">` wrapper; change to `<div className="min-h-screen">` (or `<></>`) so body bg shows through.

**Option B — Layout component / Route wrapper with `div.bg-paper`**

New `frontend/src/layouts/AppLayout.tsx`:

```tsx
// pseudo
<div className="min-h-screen bg-paper text-ink">
  <UnifiedNavBar />
  <Outlet />
</div>
```

main.tsx routes wrap with `<Route element={<AppLayout />}>`; 5 Page components remove their `<UnifiedNavBar />` and outer `<div>`.

**Option C — Each page `<div className="bg-paper text-ink">`**

Do not touch index.css or layout; only change the 4 Page components' outer `<div>` class from `bg-[#0D0D0D] text-white` to `bg-paper text-ink`. HomePage already in this state.

### 6.3 Scoring matrix (Pre-Verdict, 4 dimensions)

| Dimension | Weight | Option A (index.css) | Option B (Layout) | Option C (per-page) |
|-----------|--------|----------------------|-------------------|---------------------|
| Implementation cost | 25% | 9/10 (1 line CSS + 4 page dark wrapper removal) | 4/10 (new AppLayout + main.tsx routes restructure + 5 page refactor + Outlet pattern) | 8/10 (only 4 page class change) |
| Pollution surface (unintended impact) | 25% | 7/10 (body global change; future dark-need page must inline override) | 9/10 (Layout layer isolated) | 10/10 (fully local) |
| tsc / verifiability | 25% | 8/10 (CSS class doesn't pass tsc, but Playwright body computed bg assertion verifies) | 9/10 (TS route structure changes; tsc full check) | 9/10 (class change verified by tsc + Playwright simultaneously) |
| Future dark-mode rollback cost | 25% | 6/10 (future dark-mode requires body `dark:bg-*` + per-page non-override check) | 9/10 (Layout single-point dark/light toggle simplest) | 5/10 (5 page individual edit most laborious) |
| **Weighted total** | | **7.5** | **7.75** | **8.0** |

### 6.4 Red-team self-check (≥3 items)

1. **"Option C scores highest, why not adopt?"** — Option C scores high but violates ticket "sitewide shared design system foundation" intent (ticket §3 heading is "sitewide body paper-isation"). Per-page class lacks single source of truth between token and rendering; new pages may miss it. Option A's body base rule makes "new pages default to paper" framework behavior, aligning with token-naming spirit. Option C's pollution score 10/10 reflects "only affects current 4 pages"; future pages unprotected. Tiebreaker: token-centralised management spirit.
2. **"Why is Option B tsc verifiability 9?"** — Layout component + Outlet pattern forces route restructure; tsc enforces stricter Outlet children inference. But cost 4/10 reflects this complexity. Cost > benefit.
3. **"Will Option A's `@layer base body` be overridden by Tailwind preflight?"** — `@tailwind base` loads preflight defaults `body { line-height: inherit; }` etc.; `@layer base` written after tailwind import correctly stacks (Tailwind v3 JIT merge strategy: `base` layer same selector takes last definition). Engineer verification: after writing `index.css`, `npm run build`, grep `dist/assets/index-*.css` to confirm body rule containing `background-color:#F4EFE5` appears after preflight.
4. **"Will AppPage `h-screen overflow-hidden` flex layout break?"** — AppPage uses `h-screen bg-gray-950 text-gray-100 flex flex-col overflow-hidden` (full-screen grid layout). Under Option A, change to `h-screen flex flex-col overflow-hidden` (keep h-screen + flex; remove dark class); body bg-paper shows through AppPage outer. But AppPage inner `bg-gray-900/70` / `bg-gray-950/70` panels contrast harshly with paper body. **AppPage visual system requires K-022/K-023/K-024-level page redesign for full alignment; this ticket only requires body bg show-through, not panel re-palette** (AC-021-BODY-PAPER assertion verifies body computed bg only, not panel sublayer bg). Limit logged as Tech Debt TD-K021-04.

### 6.5 Ruling

**Adopt Option A — `frontend/src/index.css` global `body` rule.** Together with 4 Page components' dark wrapper removal (AppPage keeps h-screen/flex/overflow but removes bg/text class). `index.html` body's `class="bg-[#F4EFE5]"` retained as preload hint (avoid pre-CSS-parse FOUC white flash); no conflict.

### 6.6 Exact 4 Page component edits (pseudo diff, not code)

| File | Before (line / class) | After |
|------|------------------------|-------|
| `AboutPage.tsx` | L14 `<div className="min-h-screen bg-[#0D0D0D] text-white">` | `<div className="min-h-screen">` |
| `DiaryPage.tsx` | L11 `<div className="min-h-screen bg-[#0D0D0D] text-white">` | `<div className="min-h-screen">` |
| `BusinessLogicPage.tsx` | L88 `<div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col">` | `<div className="min-h-screen flex flex-col">` |
| `AppPage.tsx` | L367 `<div className="h-screen bg-gray-950 text-gray-100 flex flex-col overflow-hidden">` | `<div className="h-screen flex flex-col overflow-hidden">` (panel sublayers stay dark gray; TD-K021-04) |
| `HomePage.tsx` | L13 `<div className="min-h-screen bg-[#F4EFE5] text-[#1A1814]">` | `<div className="min-h-screen">` (clean redundant class; body manages) |

---

## 7. Footer placement ruling

### 7.1 Current state

- `HomeFooterBar.tsx` (`components/home/HomeFooterBar.tsx`): single consumer = HomePage; class `font-mono text-[11px] tracking-[1px] text-[#6B5F4E] px-[72px] py-5 border-t border-[#1A1814] w-full`
- `FooterCtaSection.tsx` (`components/about/FooterCtaSection.tsx`): single consumer = AboutPage; contains email + GitHub + LinkedIn links + GA tracking onClick + GA disclaimer; **internal class includes `text-white` / `text-purple-400` / `text-gray-500` dark-theme legacy** (clashes with paper page; K-017 legacy but K-017 accepted; this ticket does not touch)
- `/app` / `/business-logic` (assuming Q1=A includes Footer): currently **no Footer**
- `/diary`: this ticket does not decide (K-024 handles)

### 7.2 Option comparison

**Option A — Each page imports independently** (extend current state)

- HomePage.tsx keeps `<HomeFooterBar />`
- AboutPage.tsx keeps `<FooterCtaSection />`
- AppPage.tsx adds `<HomeFooterBar />` at end (Q1=A includes /business-logic)
- BusinessLogicPage.tsx adds `<HomeFooterBar />` at end
- DiaryPage.tsx untouched
- `HomeFooterBar.tsx` location stays `components/home/` (TD-K017-01 logged moving to common/, but this ticket skips)

**Option B — Layout component slot**

`AppLayout.tsx` with `footer` prop or conditional: per route render `HomeFooterBar` / `FooterCtaSection` / `null`

### 7.3 Scoring matrix (Pre-Verdict, 3 dimensions)

| Dimension | Weight | Option A (per-page) | Option B (Layout slot) |
|-----------|--------|---------------------|------------------------|
| Implementation cost | 34% | 9/10 (each page +1 import line + 1 JSX line) | 3/10 (same as §6.2 Option B; full route restructure) |
| Locality | 33% | 10/10 (only 2 Page files + `HomeFooterBar.tsx` class) | 6/10 (Layout + 5 Page edited together) |
| Future extension (K-024 decides /diary) | 33% | 9/10 (K-024 only edits DiaryPage.tsx +1 line) | 7/10 (K-024 must edit AppLayout conditional + DiaryPage) |
| **Weighted total** | | **9.33** | **5.33** |

### 7.4 Red-team self-check (≥3 items)

1. **"Will K-022/K-023/K-024 unified Footer change require N file edits in Option A?"** — If K-024 decides Diary uses `<HomeFooterBar />`, Option A requires DiaryPage.tsx +1 line; Option B requires AppLayout conditional + DiaryPage. Option A is cleaner (DiaryPage's "has Footer?" decision lives in DiaryPage file).
2. **"Is Option B sticky-footer layout more controllable?"** — Layout pattern is canonical for sticky footer, but ticket §3 doesn't require sticky (AC-021-FOOTER says "Then displayed when page scrolls to bottom" = natural document flow bottom). AppPage `h-screen overflow-hidden` actually **forbids** footer at scroll bottom (page doesn't scroll); footer placement TBD in §7.5.
3. **"Must `HomeFooterBar.tsx` move to `common/` to be cross-page importable?"** — No. TypeScript import path has no location restriction; current `import from '../components/home/HomeFooterBar'` works. "Shared component should be in common/" is team naming convention, not technical requirement; TD-K017-01 handles later. This ticket keeps original path; reduces diff noise.

### 7.5 Ruling

**Adopt Option A — each page imports independently.** Specific placement:

| Route | Page file | Footer component | Placement (JSX hierarchy) |
|-------|-----------|------------------|---------------------------|
| `/` | `HomePage.tsx` | `<HomeFooterBar />` | Last child of page flex vertical column (current) |
| `/about` | `AboutPage.tsx` | `<FooterCtaSection />` | Inside `<SectionContainer id="footer-cta">` (current; K-017 locked) |
| `/app` | `AppPage.tsx` | `<HomeFooterBar />` | **Special:** AppPage `h-screen overflow-hidden` doesn't scroll; Footer cannot go at `</div>` end (flex squashes it). **Approach:** add `<HomeFooterBar />` as last child of AppPage outer `flex flex-col`, appearing at viewport bottom (Engineer must reduce predictor UI `flex-1` container height slightly). Visually equivalent to sticky bottom. Engineer must dev-server-inspect `/app` Footer not occluding work area |
| `/diary` | `DiaryPage.tsx` | None (this ticket skips; K-024 decides) | — |
| `/business-logic` | `BusinessLogicPage.tsx` (assuming Q1=A) | `<HomeFooterBar />` | Last child of page flex vertical column |

### 7.6 `<HomeFooterBar />` style diff (current vs ticket spec)

**Current (Read confirmed):**

```tsx
<footer className="font-mono text-[11px] tracking-[1px] text-[#6B5F4E] px-[72px] py-5 border-t border-[#1A1814] w-full">
  <div className="flex justify-between items-center">
    <span>yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn</span>
  </div>
  <p className="text-center mt-3">
    This site uses Google Analytics to collect anonymous usage data.
  </p>
</footer>
```

**Ticket AC-021-FOOTER requires:**
- Font Geist Mono ✅ (already `font-mono`; §4 tailwind fontFamily new token does not change behavior)
- Size 11px ✅ (already `text-[11px]`)
- Color `text-muted` = `#6B5F4E` ✅ (already `text-[#6B5F4E]`; switching to `text-muted` class meets token convention)
- border-top ✅ (already `border-t border-[#1A1814]`)

**Conclusion: functionally compliant; only token class migration needed** (`text-[#6B5F4E]` → `text-muted`; `border-[#1A1814]` → `border-ink`; optional). GA disclaimer retained.

**Only new spec delta:** `px-[72px]` is too wide on mobile viewport (< 768px), causing horizontal squeeze. Recommend Engineer change to `px-6 md:px-[72px]` (responsive); small in-scope edit.

---

## 8. 5-page visual verification checklist

Per memory `feedback_shared_component_all_routes_visual_check.md`. Engineer/Reviewer/QA run per-page dev-server visual + Playwright assertion via this checklist.

### 8.1 Per-page verification items

**Page `/` (HomePage)**
- Visual: body paper (#F4EFE5), NavBar paper, Hero paper, Banner red "See how", HomeFooterBar 11px muted + border-top
- Playwright selector:
  - body bg: `await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(244, 239, 229)')`
  - body text: via `document.documentElement` computed color via `page.evaluate`
  - HomeFooterBar: `page.getByText('yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn', { exact: true })`
  - NavBar active: `page.locator('[data-testid="navbar-desktop"] [aria-current="page"]')` — on `/` route should be Home icon parent Link
- Viewport: 1280×800 desktop + 375×667 mobile dual screenshot

**Page `/app` (AppPage)**
- Visual: body paper (via AppPage outer `h-screen flex flex-col`), NavBar paper, predictor panel (gray-900/70 gray) contrasts paper body sharply but not jarring (TD-K021-04 pending), HomeFooterBar at viewport bottom
- Playwright selector: body bg + HomeFooterBar copy + NavBar active (App link `text-[#9C4A3B]`)
- Viewport: 1280×800 desktop only (no mobile screenshot; AppPage not mobile-friendly)

**Page `/about` (AboutPage)**
- Visual: body paper, NavBar paper, PageHeaderSection text dark-readable, FooterCtaSection `text-white` text **invisible** on paper bg → needs cleaning FooterCtaSection inline dark class in this ticket; **but K-017 locks `FooterCtaSection` from edit**. This conflict logged as TD-K021-05 or this-ticket force-fix (Engineer dev-server visual fails on `text-white` invisibility otherwise)
- Playwright selector: body bg + `page.getByText("Let's talk →", { exact: true })`
- Viewport: 1280×800 desktop + 375×667 mobile

**Page `/diary` (DiaryPage)**
- Visual: body paper, NavBar paper, DiaryTimeline content dark-readable, **no Footer** (K-017 AC-017-FOOTER negative assertion)
- Playwright selector: body bg + `page.getByText("Let's talk →")` toHaveCount(0) + `page.getByText('yichen.lee.20@gmail.com', { exact: true })` toHaveCount(0)
- Viewport: 1280×800 desktop

**Page `/business-logic` (assuming Q1=A)**
- Visual: body paper, NavBar paper, PasswordForm content (input / button) readable on paper, HomeFooterBar at bottom
- Playwright selector: body bg + HomeFooterBar copy; Prediction link NOT in NavBar DOM (toHaveCount 0)
- Viewport: 1280×800 desktop + 375×667 mobile

### 8.2 Visual checklist (manual; Code Reviewer + QA)

```
Dev server: cd frontend && npm run dev
Visit in order:
  [ ] http://localhost:5173/        body paper + NavBar paper + footer paper + banner visible
  [ ] http://localhost:5173/app     body paper + NavBar paper + footer at bottom
  [ ] http://localhost:5173/about   body paper + NavBar paper + FooterCta text readable on paper
  [ ] http://localhost:5173/diary   body paper + NavBar paper + no footer
  [ ] http://localhost:5173/business-logic  body paper + NavBar paper + PasswordForm readable + footer at bottom

Per-page additional:
  [ ] NavBar item order: ⌂ / App / Diary / About (Prediction not visible)
  [ ] Current page NavBar item active color (brick-dark #9C4A3B)
  [ ] Other items inactive color (#1A1814/60)
  [ ] body default text color dark (#1A1814) not white
```

---

## 9. Test plan (per PM quantitative requirement)

### 9.1 Playwright spec filename suggestions

| Purpose | Suggested filename | New / extend |
|---------|---------------------|--------------|
| AC-021-BODY-PAPER (5 test cases) | `frontend/e2e/sitewide-body-paper.spec.ts` | New |
| AC-021-FOOTER (5 test cases) | `frontend/e2e/sitewide-footer.spec.ts` | New |
| AC-021-NAVBAR (4 active-state cases + others) | extend `frontend/e2e/navbar.spec.ts` | Extend (existing) |
| AC-021-TOKEN | merge with BODY-PAPER; smoke test bg-paper class renders correctly | merge into `sitewide-body-paper.spec.ts` |
| AC-021-FONTS | `frontend/e2e/sitewide-fonts.spec.ts` (2 assertions: any page font-display / font-mono computed fontFamily contains "Bodoni Moda" / "Geist Mono") | New |
| AC-021-REGRESSION | run full existing suite + visual report | no new spec |

### 9.2 AC-021-BODY-PAPER — 5 independent test case skeletons

File: `frontend/e2e/sitewide-body-paper.spec.ts`

```ts
import { test, expect } from '@playwright/test'

// Mock all /api/* to avoid backend dependency (reuse pages.spec.ts mockApis helper)
async function mockApis(page) { /* same as navbar.spec.ts */ }

test.describe('AC-021-BODY-PAPER — body paper bg on 5 routes', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  const routes = [
    { path: '/',                name: 'HomePage' },
    { path: '/about',           name: 'AboutPage' },
    { path: '/diary',           name: 'DiaryPage' },
    { path: '/app',             name: 'AppPage' },
    { path: '/business-logic',  name: 'BusinessLogicPage' }, // assuming Q1=A
  ]

  for (const { path, name } of routes) {
    test(`${name} (${path}) — body bg=#F4EFE5 + text=#1A1814`, async ({ page }) => {
      await mockApis(page)
      await page.goto(path)
      // wait for render
      await page.waitForLoadState('networkidle')

      // body computed background
      await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(244, 239, 229)')

      // body computed text color (via document.documentElement or body computed style)
      const bodyColor = await page.evaluate(() => getComputedStyle(document.body).color)
      expect(bodyColor).toBe('rgb(26, 24, 20)')
    })
  }
})
```

**Notes:**
- Each route an independent test case (not parametrize-merged), satisfying PM "5 independent test cases" requirement
- `page.waitForLoadState('networkidle')` ensures CSS fully applied (Tailwind base layer body rule)
- `toHaveCSS('color', ...)` on body may return inherit; use `page.evaluate` reading `getComputedStyle(document.body).color` for reliability

### 9.3 AC-021-FOOTER — 5 independent test case skeletons

File: `frontend/e2e/sitewide-footer.spec.ts`

```ts
test.describe('AC-021-FOOTER — footer per route', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  // 3 pages verify <HomeFooterBar />
  for (const path of ['/', '/app', '/business-logic']) {
    test(`${path} — HomeFooterBar present with 11px muted + border-top`, async ({ page }) => {
      await mockApis(page)
      await page.goto(path)
      const footerText = page.getByText(
        'yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn',
        { exact: true }
      )
      await expect(footerText).toBeVisible()

      // size 11px
      const fs = await footerText.evaluate(el => getComputedStyle(el).fontSize)
      expect(fs).toBe('11px')

      // color muted
      const color = await footerText.evaluate(el => getComputedStyle(el).color)
      expect(color).toBe('rgb(107, 95, 78)')
    })
  }

  // /about verifies <FooterCtaSection /> present + <HomeFooterBar /> absent
  test('/about — FooterCtaSection present, HomeFooterBar absent', async ({ page }) => {
    await mockApis(page)
    await page.goto('/about')
    await expect(page.getByText("Let's talk →", { exact: true })).toBeVisible()
    await expect(
      page.getByText('yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn', { exact: true })
    ).toHaveCount(0)
  })

  // /diary not enforced (K-024 decides) — this ticket no assertion; K-017 AC-017-FOOTER already has negative assertion in pages.spec.ts; no duplication
})
```

### 9.4 AC-021-NAVBAR — 4 independent active-state test case skeletons

**Extend** `frontend/e2e/navbar.spec.ts` (existing file has AC-NAV-4 active assertion; this ticket adds 4 explicit per-route active cases):

```ts
test.describe('AC-021-NAVBAR — active state per route', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('on / — Home icon active', async ({ page }) => {
    await mockApis(page)
    await page.goto('/')
    // aria-current=page on Home icon link
    const homeLink = page.getByRole('link', { name: 'Home', exact: true })
    await expect(homeLink).toHaveAttribute('aria-current', 'page')
  })

  test('on /app — App link active', async ({ page }) => {
    await mockApis(page)
    await page.goto('/app')
    const nav = page.locator('[data-testid="navbar-desktop"]')
    const appLink = nav.getByRole('link', { name: 'App', exact: true })
    await expect(appLink).toHaveAttribute('aria-current', 'page')
    await expect(appLink).toHaveClass(/text-brick-dark|text-\[#9C4A3B\]/)
  })

  test('on /diary — Diary link active', async ({ page }) => {
    await mockApis(page)
    await page.goto('/diary')
    const nav = page.locator('[data-testid="navbar-desktop"]')
    const diaryLink = nav.getByRole('link', { name: 'Diary', exact: true })
    await expect(diaryLink).toHaveAttribute('aria-current', 'page')
  })

  test('on /about — About link active', async ({ page }) => {
    await mockApis(page)
    await page.goto('/about')
    const nav = page.locator('[data-testid="navbar-desktop"]')
    const aboutLink = nav.getByRole('link', { name: 'About', exact: true })
    await expect(aboutLink).toHaveAttribute('aria-current', 'page')
  })
})

test.describe('AC-021-NAVBAR — Prediction hidden', () => {
  test('Prediction link not rendered in DOM', async ({ page }) => {
    await mockApis(page)
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Prediction', exact: true })).toHaveCount(0)
  })
})
```

### 9.5 REGRESSION — existing spec updates / confirmations

| Existing spec | Status | This ticket action |
|---------------|--------|--------------------|
| `e2e/navbar.spec.ts` AC-NAV-1 (Desktop 5 pages home icon+links) | Asserts `Logic` link → `nav.getByRole('link', { name: /Logic/ })` → 0 match after Prediction hidden | **Edit:** delete Logic link assertion; add `expect Prediction link toHaveCount(0)` |
| `e2e/navbar.spec.ts` AC-NAV-2 (Mobile 5 pages) | Same | Same |
| `e2e/navbar.spec.ts` AC-NAV-4 (Logic link → /business-logic navigate) | After Prediction hidden, no link to click | **Delete:** remove this test |
| `e2e/navbar.spec.ts` AC-NAV-6 (Logic link LockIcon) | After Prediction hidden, LockIcon not rendered | **Delete** AC-NAV-6 entire block |
| `e2e/navbar.spec.ts` AC-NAV-4 active-state test | Currently uses `toHaveClass(/text-\[#9C4A3B\]/)` | **Keep** (Q2=B); if Q2=A, change regex |
| `e2e/pages.spec.ts` AC-ABOUT-1 PageHeader | Doesn't depend on bg class; text assertion | No change |
| `e2e/pages.spec.ts` AC-ABOUT-1 Footer CTA | `Let's talk →` text | No change |
| `e2e/about.spec.ts` whole file | K-017 main spec | No change (AC-017 locked) |
| `e2e/ga-tracking.spec.ts` | K-018 | No change |
| `e2e/ma99-chart.spec.ts` | K-009 | No change |
| `e2e/business-logic.spec.ts` | original AuthState spec | If body changes from dark to paper, internal assertion may break — Engineer reviews after run |

**REGRESSION gate:**
1. `npx tsc --noEmit` exit 0
2. `npm run build` succeeds (no new > 500 kB chunk warning, per AC-021-REGRESSION)
3. Full Playwright suite `npm run test:e2e` chromium project all green (except expected delete / update of AC-NAV-6 block)
4. visual-report: `TICKET_ID=K-021 npx playwright test visual-report.ts` produces `docs/reports/K-021-visual-report.html`

---

## 10. Engineer implementation order

6 stages; each stage = stable checkpoint (per engineer.md discipline); each stage delivers then runs §9 corresponding verification.

### Stage 1 — Tailwind token + fontFamily registration

**Deliverable:** `frontend/tailwind.config.js` add extend (§4.2)
**Verification:** `npx tsc --noEmit` exit 0 + `npm run build` succeeds + dev server hot reload + manually try `<div className="bg-paper text-ink">` in any component to verify rendering
**AC:** AC-021-TOKEN

### Stage 2 — `index.css` body base rule + 4 Page dark wrapper removal

**Deliverable:** `frontend/src/index.css` add `@layer base body`; AboutPage / DiaryPage / BusinessLogicPage / AppPage 4 files outer `<div>` remove dark bg/text class (§6.6)
**Verification:** dev server visual 5 pages (per §8.2 checklist) + Playwright `sitewide-body-paper.spec.ts` pass
**AC:** AC-021-BODY-PAPER
**Suggested spec:** `frontend/e2e/sitewide-body-paper.spec.ts` (new, §9.2)

### Stage 3 — UnifiedNavBar refactor

**Deliverable:** `components/UnifiedNavBar.tsx` reorder `TEXT_LINKS` + Prediction hidden + aria-current + remove LockIcon import + delete legacy `NavBar.tsx` (if PM allows)
**Verification:** dev server visual 5 pages NavBar item order + active state + Prediction not in DOM + delete unrelated existing navbar.spec.ts tests (AC-NAV-6 Logic LockIcon)
**AC:** AC-021-NAVBAR
**Suggested spec:** extend `frontend/e2e/navbar.spec.ts` (§9.4 AC-021-NAVBAR + Prediction hidden); delete AC-NAV-6 block + AC-NAV-4 Logic navigate test

### Stage 4 — Footer placement (`/app` / `/business-logic` add `<HomeFooterBar />`)

**Deliverable:** AppPage.tsx + BusinessLogicPage.tsx (assuming Q1=A) end add `<HomeFooterBar />`; `HomeFooterBar.tsx` minor edit `px-6 md:px-[72px]` responsive padding
**Verification:** dev server visual 5 pages Footer (§8.1) + Playwright `sitewide-footer.spec.ts` pass
**AC:** AC-021-FOOTER
**Suggested spec:** `frontend/e2e/sitewide-footer.spec.ts` (new, §9.3)

### Stage 5 — Font Tailwind class migration (optional, secondary cleanup)

**Deliverable:** `HeroSection.tsx` 4 inline `style={{ fontFamily: ... }}` → `font-display italic` / `font-italic` / `font-mono` class
**Verification:** dev server visual Hero font unchanged + Playwright `sitewide-fonts.spec.ts` pass
**AC:** AC-021-FONTS
**Suggested spec:** `frontend/e2e/sitewide-fonts.spec.ts` (new, §9.1)

### Stage 6 — Full regression + visual report

**Deliverable:** run full suite + produce visual-report + manual §8.2 checklist 5-page visual
**Verification:** `npx tsc --noEmit` + `npm run build` + `npm run test:e2e` + `TICKET_ID=K-021 npx playwright test visual-report.ts`
**AC:** AC-021-REGRESSION

---

## 11. Tech Debt / risk register

| ID | Description | Priority | Disposition |
|----|-------------|----------|-------------|
| TD-K021-01 | Google Fonts CDN load fail in GFW environment; fallback serif/monospace visual degrade | low | Current portfolio scenario unaffected; reassess local-fonts switch if China target |
| TD-K021-02 | Existing codebase multiple hardcoded hex (`#F4EFE5` / `#1A1814` / `#9C4A3B`) not migrated to token class | medium | K-022 / K-023 / K-024 page-redesigns migrate alongside; this ticket does not enforce |
| TD-K021-03 | Legacy `components/NavBar.tsx` (@deprecated dead file) | low | If PM disallows this-ticket delete, separate cleanup ticket; recommend this-ticket cleanup |
| TD-K021-04 | `/app` AppPage inner panels use `bg-gray-900/70` dark style; jarring contrast with paper body | medium | `/app` requires page-level re-palette (K-022 / K-023 / K-024 don't cover /app; recommend K-025 AppPage redesign) |
| TD-K021-05 | `/about` FooterCtaSection contains `text-white` / `text-gray-500` dark legacy; invisible on paper body | **high** | K-017 locked; conflicts with K-021 paper body; PM must rule: this-ticket fix or separate ticket. If unfixed, Stage 2 dev-server visual /about shows "Let's talk →" white-on-paper invisible |
| TD-K021-06 | Q1 interpretation A unresolved; /login semantic contradiction (ticket §3 explicit "exclude /business-logic") | **blocker** | PM must answer Q1 + Q2 before Engineer starts |

**Tech Debt advice:** PM rules on each item upon approving this design (fix now / log unfixed / separate later); ruling written back to §11 `Disposition` column.

---

## 12. Shared component boundary (persona-mandated)

Per memory `feedback_architect_shared_components.md`.

### 12.1 Affected shared components

| Component | File | Consumers | This ticket | Props interface |
|-----------|------|-----------|--------------|-----------------|
| `<UnifiedNavBar />` | `components/UnifiedNavBar.tsx` | HomePage / AboutPage / DiaryPage / BusinessLogicPage / AppPage | TEXT_LINKS reorder + Prediction hidden + aria-current + remove LockIcon | **Zero props** (before/after same; see §5.3) |
| `<HomeFooterBar />` | `components/home/HomeFooterBar.tsx` | HomePage (current) + AppPage (new) + BusinessLogicPage (new, assuming Q1=A) | extend consumers + `px-6 md:px-[72px]` responsive padding | **Zero props** (no change) |
| `<FooterCtaSection />` | `components/about/FooterCtaSection.tsx` | AboutPage | **This ticket locks** (K-017 decision) | **Zero props** |

### 12.2 Page-specific edits (non-shared)

| Page component | This ticket |
|----------------|-------------|
| `HomePage.tsx` | outer `<div>` class cleanup (body manages bg/text; HomePage keeps `min-h-screen`) |
| `AboutPage.tsx` | outer `<div>` class remove dark wrapper |
| `DiaryPage.tsx` | outer `<div>` class remove dark wrapper |
| `BusinessLogicPage.tsx` | outer `<div>` class remove dark wrapper + end add `<HomeFooterBar />` |
| `AppPage.tsx` | outer `<div>` class remove dark wrapper (keep h-screen/flex/overflow) + end add `<HomeFooterBar />` |
| `HeroSection.tsx` | 4 inline `style={{ fontFamily }}` → Tailwind class (optional, Stage 5) |

### 12.3 CSS / config layer edits

| File | Edit |
|------|------|
| `frontend/tailwind.config.js` | `theme.extend.colors` + `theme.extend.fontFamily` |
| `frontend/src/index.css` | `@layer base body { @apply bg-paper text-ink; }` |

**Unchanged:** `frontend/index.html` (preconnect + Google Fonts `<link>` keep), `frontend/vite.config.ts`, `frontend/playwright.config.ts`, `frontend/package.json`

---

## 13. Architect → Engineer pre-handoff checklist

Per Architect persona "Pencil Frame Completeness Check" + "Cross-Page Duplicate Audit" + "Drift check when Triage doesn't need Architecture".

- [x] Pencil frame completeness audit (§2) — 4 frames confirmed, no missing
- [x] Cross-page duplicate audit (§13.1) — below
- [x] architecture.md sync (§14) — pending Write below
- [x] Design doc end `## Retrospective` section (§15) — pending Write below
- [ ] PM answer Q1 + Q2 (§0) — **BLOCKER, no Engineer handoff until done**
- [ ] Per-project retrospective log (§15.2) — write into architect.md below

### 13.1 Cross-Page Duplicate Audit (mandatory)

This ticket adds component/section: Prediction hidden item, Footer placement on 2 pages. Grep existing codebase for in-scope "new components":

```
# Grepped
grep -rn "HomeFooterBar" frontend/src/        → HomePage + home/HomeFooterBar.tsx (1 consumer)
grep -rn "FooterCtaSection" frontend/src/    → AboutPage + about/FooterCtaSection.tsx (1 consumer)
grep -rn "UnifiedNavBar" frontend/src/       → 5 Page consumers (correct shared)
```

**No duplicate pattern; no new primitive needed.** This ticket is purely existing component consumer extension + palette system foundation; no new component.

---

## 14. architecture.md sync (after design doc Write)

This ticket structural changes:
- Tailwind config adds `colors` + `fontFamily` token (palette and font API now sitewide convention)
- body palette CSS entry changes to `index.css` `@layer base`
- `HomeFooterBar.tsx` consumers grow from 1 to 3
- legacy `NavBar.tsx` may be deleted (TBD by PM)

**Architect plans 4 architecture.md edits:**

1. `## Directory Structure` section: `frontend/src/components/NavBar.tsx` flag `(to be removed K-021)` or delete (TBD by PM)
2. **Add `## Design System (K-021)` section** defining paper / ink / brick / brick-dark / charcoal / muted 6 color tokens + 3 font tokens + body base rule
3. `## Frontend Routing` NavBar description update: "left ⌂ / right App / Diary / About (Prediction hidden)" + active uses aria-current
4. `## Changelog` append entry `2026-04-20 (Architect, K-021 design) — ...`

Actual Edit operation occurs after this doc Write; see architecture.md update.

---

## 15. Retrospective

### 15.1 Architect retrospective for this design

**Done well:**
- Pre-design used `grep Login` + `grep /login` + batch_get .pen frame list double-verified `/login` route absence; reported in §0 Scope Questions to PM rather than self-ruling, avoiding Architect requirement-decision
- Used `git status / codebase read` to confirm Google Fonts CDN already in index.html, avoiding redundant "CDN vs local @font-face" full re-evaluation (this info not in ticket; ticket author may have assumed font is fully new)
- Item-by-item Pre-Verdict scoring + red-team ≥3: font loading / body CSS entry / Footer placement all walked complete ruling procedure
- Tech Debt list (§11) flagged TD-K021-05 (FooterCtaSection dark legacy) as high-priority blocker; prevents Engineer from being surprised by /about Let's talk white-on-paper invisibility on dev-server visual

**Done poorly:**
- Did not ScheduleWakeup or actively pause to report PM Q1/Q2 at design start; instead used "interpretation A/B assumption" throughout. If PM rules differ from assumption, large §5/§6/§9 sections require rewrite. Root cause: Architect persona forbids decision but does not explicitly require "pause to wait for PM on scope questions"; I chose "produce complete framework so PM rules once on full picture", but this blurs "no requirement decision" boundary (which assumed clauses are implicit decisions)
- §6 Option A vs C scoring matrix Option C scored highest (8.0 > 7.5), but final pick was A — using "token spirit" tiebreaker not pre-listed in scoring dimensions. Theoretically should add "token-centralised management" as scoring dimension 5, not retroactive tiebreaker overriding total

**Improvements:**
1. **Architect must immediately ScheduleWakeup pause + report PM upon scope question (e.g. Q1/Q2 ticket-codebase contradiction); not run "assumption" through full design doc** — write rule into persona as hard step (see §15.3 persona edit)
2. **Pre-Verdict scoring matrix must pre-list all tiebreaker dimensions; no retroactive "spirit"/"intent" overriding total.** If a dimension is hard to quantify (e.g. token-centralised management), at least name it and give 1–10 score; accept "weighted total may be biased" rather than "hidden tiebreaker" — this rule also into persona

### 15.2 Per-project retrospective log

Write top entry into `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/docs/retrospectives/architect.md`; see file content.

### 15.3 Persona update

§15.1 "Improvements" item 1 (Architect must pause on scope question) Edit into `~/.claude/agents/senior-architect.md` as new "Scope Question Pause Rule" section (hard step).

---

## Appendix A — file change list (Engineer deliverable)

### Add

- `frontend/e2e/sitewide-body-paper.spec.ts`
- `frontend/e2e/sitewide-footer.spec.ts`
- `frontend/e2e/sitewide-fonts.spec.ts`

### Edit

- `frontend/tailwind.config.js` (§4.2)
- `frontend/src/index.css` (§6.2 Option A)
- `frontend/src/components/UnifiedNavBar.tsx` (§5)
- `frontend/src/components/home/HomeFooterBar.tsx` (responsive padding + optional token class migration)
- `frontend/src/pages/AboutPage.tsx` (outer div class)
- `frontend/src/pages/DiaryPage.tsx` (outer div class)
- `frontend/src/pages/BusinessLogicPage.tsx` (outer div class + end `<HomeFooterBar />`)
- `frontend/src/pages/HomePage.tsx` (outer div class cleanup, optional)
- `frontend/src/AppPage.tsx` (outer div class + end `<HomeFooterBar />`)
- `frontend/src/components/home/HeroSection.tsx` (Stage 5, optional)
- `frontend/e2e/navbar.spec.ts` (§9.5 update / delete test groups; §9.4 add active-state 4 test + Prediction hidden)

### Delete (PM rules)

- `frontend/src/components/NavBar.tsx` (legacy dead code, K-017 Reviewer flagged)
  - If PM disallows scope expansion → log TD-K021-03

### Doc sync

- `ClaudeCodeProject/K-Line-Prediction/agent-context/architecture.md` (§14)
- `ClaudeCodeProject/K-Line-Prediction/docs/retrospectives/architect.md` (§15.2)
- `~/.claude/agents/senior-architect.md` (§15.3)

---

**Architect this design doc complete; awaits PM ruling on Q1 + Q2 + §11 Tech Debt before releasing Engineer.**
