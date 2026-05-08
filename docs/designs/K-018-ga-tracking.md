---
title: K-018 GA4 Tracking — System Design
ticket: K-018
type: design
status: approved
author: senior-architect
created: 2026-04-19
---

## 1. Tech Selection: `react-ga4` vs hand-rolled `gtag.js`

### Option Comparison

| Aspect | `react-ga4` | Hand-rolled `gtag.js` |
|------|-------------|----------------|
| Install cost | `npm i react-ga4` (~5 KB gzip) | No new package |
| API familiarity | `ReactGA.initialize()` / `ReactGA.send()` | Direct `window.gtag()` calls |
| Pageview tracking | Provides `usePageViews()` hook but must be called inside BrowserRouter; still requires custom `useEffect` | Likewise needs `useEffect` + `useLocation` |
| SPA route change support | Must manually wire `useLocation` to detect route changes; not automatic | Likewise manual |
| TypeScript support | Complete (package ships types) | Need to declare `window.gtag` type ourselves |
| Playwright spy difficulty | Underlying still pushes `window.dataLayer`; spy approach identical | Direct spy on `window.dataLayer` |
| Maintenance status | Community maintained (GitHub 1.1k stars, commits in 2024) | GA4 official API, long-term Google maintenance |
| Extra package deps | None | None |

### Recommendation: **Hand-rolled `gtag.js`**

**Reason:** `react-ga4`'s main selling point (`usePageViews()`) still requires `useLocation` for SPA route changes in practice, saving no work; instead it introduces a third-party package doing what we can hand-roll, while `window.gtag()` is Google's officially long-term-stable API. This project's GA4 needs are simple (1 pageview hook + 4 click events); hand-rolling avoids package version locking and peer dependency risk. `react-ga4` maintenance frequency has declined (2025/2026); choosing the official API offers more guarantee.

---

## 2. Install Strategy

### 2.1 Script Tag Injection Method

**Chosen: JS dynamic injection (no hardcode in `index.html`)**

**Reason:** AC-018-INSTALL requires "if `VITE_GA_MEASUREMENT_ID` is unset, snippet is not injected." Static script tag in `index.html` cannot conditionally omit at build time per env var (Vite's `index.html` env var injection does not support conditional existence). JS dynamic injection allows `if (!measurementId) return` guard at code level, fully meeting the AC.

**Why not static script tag in `index.html`:** If `index.html` contains `<script src="https://www.googletagmanager.com/gtag/js?id=%VITE_GA_MEASUREMENT_ID%">`, Vite replaces `%VITE_GA_MEASUREMENT_ID%` at build, but if unset src becomes `?id=undefined` which still issues a network request, violating the AC.

### 2.2 Env Var Injection Method

Read via Vite's `import.meta.env.VITE_GA_MEASUREMENT_ID` (Vite auto-exposes all `VITE_`-prefixed vars to client bundle).

**Format:** `G-XXXXXXXXXX` (GA4 measurement ID standard format)

**Set location:**
- Local dev: `frontend/.env.local` (not committed; added to `.gitignore`)
- Firebase Hosting / CI: via env var set before `firebase deploy --only hosting` (Vite build prerequisite) or GitHub Actions secret

### 2.3 Dynamic Injection Implementation Location

Create `frontend/src/utils/analytics.ts`, exposing:

```typescript
// Init function (call once in main.tsx or root component)
export function initGA(): void

// Pageview tracking (used by useGAPageview hook)
export function trackPageview(path: string, title: string): void

// Click event tracking (used by each CTA component)
export function trackCtaClick(label: string): void
```

`initGA()` internal logic:
1. Read `import.meta.env.VITE_GA_MEASUREMENT_ID`
2. If empty string / undefined → return (no inject)
3. Dynamically create `<script>` tag, src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`, async = true, append to `document.head`
4. Init `window.dataLayer = window.dataLayer || []`
5. Define `window.gtag = function() { dataLayer.push(arguments) }`
6. Call `gtag('js', new Date())` and `gtag('config', measurementId, { send_page_view: false })` (disable auto pageview, instead manually trigger via `useGAPageview` hook to ensure correct send on SPA route change)

**TypeScript Window type augment (top of `analytics.ts`):**
```typescript
declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}
```

---

## 3. Pageview Tracking

### 3.1 Hook Design

Create `frontend/src/hooks/useGAPageview.ts`:

```typescript
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageview } from '../utils/analytics'

const PAGE_TITLES: Record<string, string> = {
  '/': 'K-Line Prediction — Home',
  '/app': 'K-Line Prediction — App',
  '/about': 'K-Line Prediction — About',
  '/diary': 'K-Line Prediction — Dev Diary',
  '/business-logic': 'K-Line Prediction — Business Logic',
}

export function useGAPageview(): void {
  const location = useLocation()
  useEffect(() => {
    const title = PAGE_TITLES[location.pathname] ?? document.title
    trackPageview(location.pathname, title)
  }, [location.pathname])
}
```

### 3.2 Mount Location

**Mount in a Layout wrapper component inside `main.tsx`, not scattered across each Page component.**

Concrete approach: inside `main.tsx`'s `<BrowserRouter>`, add a `<GATracker />` component (pure hook, no render) that calls `useGAPageview()` at the same level as `<Routes>`:

```tsx
// main.tsx (modified)
function GATracker() {
  useGAPageview()
  return null
}

// Inside BrowserRouter:
<BrowserRouter>
  <GATracker />
  <Routes>
    ...
  </Routes>
</BrowserRouter>
```

**Why not mount in each Page component?**
- Avoids duplicating hook logic in each page
- New routes don't require remembering to add the hook
- `GATracker` lives inside Router context, can correctly use `useLocation()`

**Why not mount in `App.tsx`?**
- This project has no `App.tsx` (entry is directly `main.tsx`'s BrowserRouter + Routes). `GATracker` placed in `main.tsx` is clearest.

**`initGA()` call timing:** at the top of `main.tsx` (outside BrowserRouter), called once before `ReactDOM.createRoot(...).render(...)`.

---

## 4. Click Event Tracking

### 4.1 Event Spec

All CTA click events use unified name = `cta_click`, with:
- `label`: string identifying trigger source (see table below)
- `page_location`: current `window.location.pathname`

`trackCtaClick(label: string)` implementation:
```typescript
export function trackCtaClick(label: string): void {
  if (typeof window.gtag === 'undefined') return
  window.gtag('event', 'cta_click', {
    label,
    page_location: window.location.pathname,
  })
}
```

### 4.2 Per-CTA Modification Locations

| CTA | label | Modified component | Change method |
|-----|-------|----------|---------|
| Email link | `"contact_email"` | `FooterCtaSection.tsx` | `<a>` adds `onClick={() => trackCtaClick('contact_email')}` |
| GitHub link | `"github_link"` | `FooterCtaSection.tsx` | `<ExternalLink>` adds `onClick={() => trackCtaClick('github_link')}` |
| LinkedIn link | `"linkedin_link"` | `FooterCtaSection.tsx` | `<ExternalLink>` adds `onClick={() => trackCtaClick('linkedin_link')}` |
| BuiltByAIBanner | `"banner_about"` | `BuiltByAIBanner.tsx` (new) | Whole banner wraps `onClick` handler |

**Note:** `ExternalLink` primitive (`frontend/src/components/primitives/ExternalLink.tsx`) currently **does not accept an `onClick` prop**. Two options:

- **Option A (recommended):** In `FooterCtaSection.tsx`, do not wrap with `ExternalLink`; instead use raw `<a target="_blank" rel="noopener noreferrer">` directly with `onClick` handler. Avoids modifying `ExternalLink` primitive (other consumers unaffected).
- **Option B:** Add `onClick?: React.MouseEventHandler<HTMLAnchorElement>` prop to `ExternalLink.tsx` and pass-through.

**Recommend Option A**, because: `ExternalLink` is a primitive; adding `onClick` makes it carry business logic (GA tracking), violating "primitive only handles rel/target" design principle (K-017 design decision). `FooterCtaSection` directly using native `<a>` is more surgical.

### 4.3 Props Interface

**Do not extract a shared hook** (only 4 CTAs, simple logic; extracting a hook adds complexity). Each component imports `trackCtaClick` and calls directly.

### 4.4 BuiltByAIBanner Component (new)

Architecture.md records `home/BuiltByAIBanner.tsx` should exist, but it currently **does not exist** (no such file under `frontend/src/components/home/`). `HomePage.tsx` also does not yet render the banner.

**K-018 scope:** Create `frontend/src/components/home/BuiltByAIBanner.tsx`, and add render in `HomePage.tsx` (thin banner after NavBar, before HeroSection). Banner click navigates to `/about` (React Router `<Link>`); click triggers `trackCtaClick('banner_about')`.

Banner design references the mockup inside `BuiltByAIShowcaseSection.tsx` (S7 section already has full mockup; Engineer copies styling directly).

---

## 5. Footer Text (AC-018-PRIVACY-POLICY)

### 5.1 Insert Location

Add a line at the bottom of `FooterCtaSection.tsx`.

### 5.2 Copy

```
This site uses Google Analytics to collect anonymous usage data.
```

### 5.3 Style

Reuse existing footer text style: `text-gray-500 text-xs font-mono text-center mt-4`. No link needed, no Cookie banner needed.

**Playwright assertion:** `expect(page.locator('footer')).toContainText('Google Analytics')` or equivalent (if page lacks `<footer>` tag, use FooterCtaSection outer container's role/label).

---

## 6. Playwright Verification Strategy

### 6.1 Core Principle

**Do not hit real GA4 network requests.** In each E2E test's setup phase, spy `window.dataLayer`.

### 6.2 Spy Mechanism

`window.dataLayer` is GA4's universal message bus; `gtag()` is essentially `dataLayer.push`; all events (pageview, custom event) flow into `dataLayer`.

```typescript
// In test setup
await page.addInitScript(() => {
  window.dataLayer = window.dataLayer || []
  // Override gtag function so dataLayer can be spied
  window.gtag = function (...args: unknown[]) {
    window.dataLayer.push(args)
  }
})
```

`addInitScript` runs before the page's JS executes, ensuring our version is in place when `initGA()` calls `window.gtag`.

### 6.3 Per-AC Playwright Assertion Strategy

**AC-018-INSTALL:**
```typescript
await page.goto('/')
// Verify script tag exists (no real env var value needed; Playwright dev server sets VITE_GA_MEASUREMENT_ID=G-TEST)
await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(1)
```
Or (if E2E env does not set GA env var):
```typescript
// Verify initGA() guard correct — no gtag script in head
await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(0)
```
**Decision:** E2E env sets a fake measurement ID `G-TESTID0000` (`.env.test` or playwright.config.ts `webServer.env`) so the snippet is injected, enabling AC-018-INSTALL + AC-018-PAGEVIEW + AC-018-CLICK verification. GA4 server receives no real hits (fake ID invalid), no impact on tests.

**AC-018-PAGEVIEW:**
```typescript
const dataLayer = await page.evaluate(() => window.dataLayer)
// Find page_view event
const pageviewEntry = dataLayer.find(
  entry => Array.isArray(entry) && entry[0] === 'event' && entry[1] === 'page_view'
)
expect(pageviewEntry).toBeDefined()
expect(pageviewEntry[2]).toMatchObject({ page_location: '/about' })
```

**AC-018-CLICK:**
```typescript
await page.locator('[data-testid="cta-email"]').click()
const dataLayer = await page.evaluate(() => window.dataLayer)
const clickEntry = dataLayer.find(
  entry => Array.isArray(entry) && entry[1] === 'cta_click'
)
expect(clickEntry[2]).toMatchObject({ label: 'contact_email' })
```

**AC-018-PRIVACY:**
```typescript
// Confirm gtag config does not include user_id
const configEntry = dataLayer.find(
  entry => Array.isArray(entry) && entry[0] === 'config'
)
if (configEntry) {
  expect(configEntry[2]).not.toHaveProperty('user_id')
}
```

**AC-018-PRIVACY-POLICY:**
```typescript
await page.goto('/')
await expect(page.getByText('Google Analytics', { exact: false })).toBeVisible()
```

### 6.4 Playwright Config Adjustment

In `playwright.config.ts`'s `webServer`, add GA test env var:
```typescript
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:5173',
  env: {
    VITE_GA_MEASUREMENT_ID: 'G-TESTID0000',  // Fake ID; lets snippet inject without hitting real GA4
  },
  reuseExistingServer: !process.env.CI,
  timeout: 30_000,
},
```

### 6.5 New E2E Spec File

Create `frontend/e2e/ga-tracking.spec.ts`, covering:
- AC-018-INSTALL: snippet script tag exists in head
- AC-018-PAGEVIEW: each route's pageview event includes `page_location`
- AC-018-CLICK: 4 CTA click events include `label`
- AC-018-PRIVACY: config call excludes `user_id`
- AC-018-PRIVACY-POLICY: Footer Google Analytics text visible

---

## 7. Expected Modified File List

### New

| File | Description |
|------|------|
| `frontend/src/utils/analytics.ts` | GA4 init + trackPageview + trackCtaClick |
| `frontend/src/hooks/useGAPageview.ts` | useLocation → trackPageview hook |
| `frontend/src/components/home/BuiltByAIBanner.tsx` | Home thin banner; click → /about + click event |
| `frontend/e2e/ga-tracking.spec.ts` | Playwright spec for all K-018 ACs |
| `frontend/.env.example` | Documents VITE_GA_MEASUREMENT_ID (no real value, reference only) |

### Modified

| File | Change description |
|------|---------|
| `frontend/src/main.tsx` | 1. Call `initGA()` 2. Add `<GATracker />` component (calls useGAPageview) |
| `frontend/src/components/about/FooterCtaSection.tsx` | 1. email/GitHub/LinkedIn add onClick trackCtaClick 2. Add GA notice text at bottom 3. ExternalLink switched to native `<a>` (Option A) |
| `frontend/src/pages/HomePage.tsx` | import + render `<BuiltByAIBanner />` (after NavBar, before HeroSection) |
| `frontend/playwright.config.ts` | webServer.env adds VITE_GA_MEASUREMENT_ID=G-TESTID0000 |
| `agent-context/architecture.md` | Directory Structure + Changelog updated (Architect backfills after design done) |

### Excluded

| File / Directory | Reason |
|-----------|------|
| `frontend/src/components/primitives/ExternalLink.tsx` | Option A chooses not to modify primitive |
| `frontend/src/components/about/BuiltByAIShowcaseSection.tsx` | About S7 showcase card, not real banner; left alone |
| `backend/` all files | GA4 is fully frontend; no backend change |
| `frontend/index.html` | Static injection in index.html not used |
| `/business-logic` related components | Ticket explicitly excludes auth-gated pages |
| `frontend/src/components/UnifiedNavBar.tsx` | No change needed |

---

## 8. Out of Scope

- GA4 Admin Console creation (user's own action)
- Conversion goal, funnel, audience configuration
- Server-side event tracking
- `/business-logic` page behavior tracking
- Cookie Consent Banner / GDPR modal
- Splitting `window.gtag` TypeScript global augment into a separate `.d.ts` file under `frontend/src/types/` (inline declaration in `analytics.ts` is sufficient; not worth a new types file)

---

## Retrospective

**Where most time was spent:** Confirming actual existence of `BuiltByAIBanner.tsx`. Architecture.md records it under `home/`, but `ls` shows file does not exist; HomePage.tsx also has no import. Spent time confirming whether this was "K-017 Engineer not yet implemented" or "design changed"; ultimately confirmed it was a K-017 expected deliverable but implementation was interrupted (About S7 showcase card is static mockup, not real banner). So K-018 must build the real banner component.

**Decisions needing revision:** Initially leaned toward `react-ga4` (industry standard pattern), but after counting actual code savings, found pageview / click event hand-rolling lighter. If GA4 needs expand later (ecommerce tracking, enhanced measurement), may need to reassess introducing `react-ga4`.

**Next time improvement:** When involving "components recorded in architecture.md", `ls` to verify existence at design start, rather than assuming the file exists from architecture.md alone. Same lag pattern as K-017's "AC required deploy walkthrough only after AC requirement".
