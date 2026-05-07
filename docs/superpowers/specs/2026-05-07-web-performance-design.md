# Web Performance Optimization — Design Spec

**Date:** 2026-05-07
**Baseline Score:** Lighthouse 91 (desktop, cold load)
**Target:** Maximize score from remaining opportunities without changing visual output or functionality

---

## Scope

Three optimizations, executed in order:

| # | Optimization | Expected Impact |
|---|---|---|
| 1 | Hero image PNG → WebP | LCP −35KB, score +1~2 |
| 2 | Google Fonts self-hosting | FCP −450ms (remove render-blocking stylesheet) |
| 3 | Unused JS tree-shaking analysis | Initial payload −64KB estimate |

Not in scope: SSR, CDN changes, backend, any route other than `/`.

---

## Optimization 1: Hero Image → WebP

### Problem
`hero-shot.png` (68KB) is the LCP element. PNG is larger than necessary.

### Changes
**`frontend/public/`**
- Convert `hero-shot.png` → `hero-shot.webp` using `cwebp` CLI
- Keep original `hero-shot.png` as fallback

**`frontend/index.html`**
- Update preload: `href="/hero-shot.webp"`
- Keep `fetchpriority="high"` and `as="image"`

**Hero `<img>` usage in source**
- Find usage site in `src/` (grep for `hero-shot`)
- Wrap in `<picture>` for WebP + PNG fallback:

```html
<picture>
  <source srcSet="/hero-shot.webp" type="image/webp" />
  <img src="/hero-shot.png" alt="..." width="1200" height="630" />
</picture>
```

### Measurement
Run Lighthouse after deploy. Record LCP delta.

---

## Optimization 2: Google Fonts Self-Hosting

### Problem
`<link href="https://fonts.googleapis.com/css2?..." rel="stylesheet" />` is render-blocking. Browser must download this CSS before rendering anything. Estimated FCP impact: −450ms.

### Fonts in use
- `IBM Plex Mono` wght 400, 700
- `Newsreader` ital wght 400
- `Geist Mono` wght 400, 700

### Changes

**`frontend/public/fonts/`** (new directory)
- Download `.woff2` files from `google-webfonts-helper` or `fontsource` npm packages
- Files: `ibm-plex-mono-400.woff2`, `ibm-plex-mono-700.woff2`, `newsreader-400-italic.woff2`, `geist-mono-400.woff2`, `geist-mono-700.woff2`

**`frontend/src/`** — new CSS file `fonts.css` (imported in `main.tsx`)
```css
@font-face {
  font-family: 'IBM Plex Mono';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/ibm-plex-mono-400.woff2') format('woff2');
}
/* ... repeat for each weight/style */
```

**`frontend/index.html`**
- Remove `<link rel="preconnect" href="https://fonts.googleapis.com" />`
- Remove `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />`
- Remove `<link href="https://fonts.googleapis.com/css2?..." rel="stylesheet" />`
- Add `<link rel="preload" as="font" type="font/woff2" href="/fonts/ibm-plex-mono-400.woff2" crossorigin />`  (preload the most-used weight only)

### Key principle
`font-display: swap` ensures text renders immediately with a fallback font, then swaps in the custom font when ready. Eliminates FOIT (Flash of Invisible Text) and removes the render-blocking dependency entirely.

### Measurement
Run Lighthouse after deploy. Record FCP and LCP delta. Verify fonts render correctly on all pages visually.

---

## Optimization 3: Unused JS Tree-Shaking Analysis

### Problem
Lighthouse reports ~64KB of unused JS in current bundles. Exact source unknown until analyzed.

### Analysis step
Install `rollup-plugin-visualizer` (dev dependency):

```ts
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'

plugins: [
  visualizer({ open: true, gzipSize: true, filename: 'stats.html' })
]
```

Run `npm run build` → inspect `stats.html` in browser.

### Likely candidates (to investigate)
- Named vs default imports from large libraries
- Any library imported in full but only using 1-2 functions
- `date-fns`, `lodash`, or similar utility libraries if present

### Changes
Depends on analysis findings. Pattern: replace `import lib from 'lib'` → `import { fn } from 'lib'` for tree-shaking to work. May also involve removing unused imports entirely.

`rollup-plugin-visualizer` is dev-only. Capture two screenshots before removing it:
- **stats-before.png**: after adding visualizer, before any import changes
- **stats-after.png**: after import changes, before removing visualizer

Both screenshots go into `docs/images/` and are referenced in the final report for the technical article. Then remove visualizer from `vite.config.ts` before final commit.

### Measurement
Compare `dist/` bundle sizes before/after (use `du -sh dist/assets/*.js`). Run Lighthouse after deploy.

---

## Report Format

After all three optimizations are deployed and measured, produce a report at `raw/articles/k-line-web-performance-optimization-report.md`:

```
# K-Line Web Performance Optimization Report

## Lighthouse Score Progression

| Metric | Baseline | After WebP | After Fonts | After JS |
|--------|----------|------------|-------------|----------|
| Score  | 91       | ?          | ?           | ?        |
| LCP    | 3.1s     | ?          | ?           | ?        |
| FCP    | 2.1s     | ?          | ?           | ?        |
| TBT    | 0ms      | 0ms        | 0ms         | ?        |
| CLS    | 0        | 0          | 0           | ?        |

## Optimization 1: Hero Image WebP
[what changed, size delta, code snippet]

## Optimization 2: Google Fonts Self-Hosting
[what changed, render-blocking removed, code snippet]

## Optimization 3: Unused JS
[analysis findings, what was removed, bundle size delta]
![stats before](../images/stats-before.png)
![stats after](../images/stats-after.png)

## Summary & Next Steps
```

Report is the handoff artifact for the personal site publishing session.

---

## Execution Order & Gates

```
1. Lighthouse baseline run (record exact numbers)
2. Impl Opt-1 (WebP) → deploy → Lighthouse run
3. Impl Opt-2 (Fonts) → deploy → Lighthouse run
4. Impl Opt-3 (JS analysis → changes) → deploy → Lighthouse run
5. Write report → user review
6. [Separate session] Publish to personal site
```

**Rollback gate:** Each optimization is independent. If a deploy causes visual regression, revert that optimization before proceeding to next.
