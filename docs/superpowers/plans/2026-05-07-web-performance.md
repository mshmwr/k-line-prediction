# Web Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve Lighthouse Performance score beyond 91 by converting hero image to WebP, self-hosting Google Fonts, and removing unused JS — then produce a before/after report for publishing as a technical article.

**Architecture:** Three independent optimizations executed sequentially with a Lighthouse measurement after each deploy. All changes are frontend-only (no backend, no new routes). Final output is a report markdown file for user review.

**Tech Stack:** Vite + React + TypeScript + Firebase Hosting. Font self-hosting via `@fontsource` npm packages. Image conversion via `cwebp` CLI. Bundle analysis via `rollup-plugin-visualizer`.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `frontend/public/hero-shot.webp` | Create | WebP version of hero image |
| `frontend/src/components/home/HeroSection.tsx` | Modify | Wrap `<img>` in `<picture>` with WebP source |
| `frontend/index.html` | Modify | Update preload to WebP, remove Google Fonts, add local font preload |
| `frontend/src/fonts.css` | Create | `@font-face` declarations via @fontsource imports |
| `frontend/src/main.tsx` | Modify | Add `import './fonts.css'` |
| `frontend/vite.config.ts` | Modify (temp + revert) | Add/remove `rollup-plugin-visualizer` for analysis |
| `docs/images/stats-before.png` | Create | Bundle visualizer screenshot before JS changes |
| `docs/images/stats-after.png` | Create | Bundle visualizer screenshot after JS changes |
| `raw/articles/k-line-web-performance-optimization-report.md` | Create | Final report for user review |

---

## Task 0: Record Baseline Lighthouse Score

**Files:** None — measurement only.

- [ ] **Step 1: Run Lighthouse baseline**

  Open Chrome → navigate to `https://k-line-prediction-app.web.app/` → DevTools → Lighthouse tab → Mode: Navigation, Device: Desktop → Analyze page load.

- [ ] **Step 2: Record all metrics**

  Copy into a scratch note (you'll fill these into the report at the end):

  ```
  Baseline:
    Score: 91
    FCP:   2.1s
    LCP:   3.1s
    TBT:   0ms
    CLS:   0
    SI:    3.1s
    TTI:   3.1s
  ```

---

## Task 1: Convert Hero Image to WebP

**Files:**
- Create: `frontend/public/hero-shot.webp`
- Modify: `frontend/src/components/home/HeroSection.tsx:18-28`
- Modify: `frontend/index.html:22`

- [ ] **Step 1: Verify cwebp is available**

  ```bash
  cwebp -version
  ```

  Expected: version string like `1.3.2`. If not found: `brew install webp`.

- [ ] **Step 2: Convert PNG to WebP**

  ```bash
  cwebp frontend/public/hero-shot.png -o frontend/public/hero-shot.webp -q 85
  ```

  Expected output ends with `File:      frontend/public/hero-shot.webp` and shows size reduction.

- [ ] **Step 3: Verify file size reduction**

  ```bash
  du -sh frontend/public/hero-shot.png frontend/public/hero-shot.webp
  ```

  Expected: WebP should be ~30-40% smaller than PNG.

- [ ] **Step 4: Update index.html preload to WebP**

  In `frontend/index.html`, find line 22:
  ```html
  <link rel="preload" as="image" href="/hero-shot.png" fetchpriority="high" />
  ```
  Replace with:
  ```html
  <link rel="preload" as="image" href="/hero-shot.webp" fetchpriority="high" />
  ```

- [ ] **Step 5: Wrap img in picture element in HeroSection.tsx**

  In `frontend/src/components/home/HeroSection.tsx`, replace:
  ```tsx
  <img
    src="/hero-shot.png"
    alt="Screenshot of the K-Line Prediction app showing a similarity match result for an ETH/USDT 1H window"
    width={1280}
    height={720}
    loading="eager"
    fetchPriority="high"
    decoding="async"
    className="w-full max-w-[960px] rounded-[8px] border border-[#2A2520] shadow-[0_2px_0_#2A2520]"
    data-testid="hero-product-shot"
  />
  ```
  With:
  ```tsx
  <picture>
    <source srcSet="/hero-shot.webp" type="image/webp" />
    <img
      src="/hero-shot.png"
      alt="Screenshot of the K-Line Prediction app showing a similarity match result for an ETH/USDT 1H window"
      width={1280}
      height={720}
      loading="eager"
      fetchPriority="high"
      decoding="async"
      className="w-full max-w-[960px] rounded-[8px] border border-[#2A2520] shadow-[0_2px_0_#2A2520]"
      data-testid="hero-product-shot"
    />
  </picture>
  ```

- [ ] **Step 6: Type-check**

  ```bash
  cd frontend && npx tsc --noEmit
  ```

  Expected: no errors.

- [ ] **Step 7: Run Playwright to verify hero image renders**

  ```bash
  cd frontend && npx playwright test --grep "hero" --headed
  ```

  If no hero-specific test exists, run the full homepage suite:
  ```bash
  npx playwright test e2e/home.spec.ts --headed
  ```

  Expected: all tests pass, hero image visible.

- [ ] **Step 8: Commit**

  ```bash
  git add frontend/public/hero-shot.webp frontend/src/components/home/HeroSection.tsx frontend/index.html
  git commit -m "perf: convert hero image to WebP with PNG fallback"
  ```

- [ ] **Step 9: Deploy and measure**

  ```bash
  firebase deploy --only hosting
  ```

  Then run Lighthouse again (same settings as Task 0). Record:
  ```
  After WebP:
    Score: ?
    LCP:   ?
    (other metrics)
  ```

---

## Task 2: Self-Host Google Fonts

**Files:**
- Create: `frontend/src/fonts.css`
- Modify: `frontend/src/main.tsx` (add import)
- Modify: `frontend/index.html` (remove Google Fonts, add font preload)

- [ ] **Step 1: Install @fontsource packages**

  ```bash
  cd frontend && npm install --save-dev @fontsource/ibm-plex-mono @fontsource/newsreader @fontsource/geist-mono
  ```

  Expected: packages installed, package.json updated.

- [ ] **Step 2: Verify packages are installed and find correct CSS file names**

  ```bash
  ls node_modules/@fontsource/ibm-plex-mono/ | grep -E "^400|^700"
  ls node_modules/@fontsource/newsreader/ | grep "italic"
  ls node_modules/@fontsource/geist-mono/ | grep -E "^400|^700"
  ```

  Expected: files like `400.css`, `700.css`, `400-italic.css` present.

- [ ] **Step 3: Create frontend/src/fonts.css**

  ```css
  @import '@fontsource/ibm-plex-mono/400.css';
  @import '@fontsource/ibm-plex-mono/700.css';
  @import '@fontsource/newsreader/400-italic.css';
  @import '@fontsource/geist-mono/400.css';
  @import '@fontsource/geist-mono/700.css';
  ```

- [ ] **Step 4: Verify font-display: swap is present in the imported CSS**

  ```bash
  grep "font-display" node_modules/@fontsource/ibm-plex-mono/400.css
  ```

  Expected: `font-display: swap;`

  If not present, add `font-display: swap` manually to each @font-face block in `fonts.css` instead of using @import (copy the @font-face declarations from the package CSS and add the property).

- [ ] **Step 5: Import fonts.css in main.tsx**

  Open `frontend/src/main.tsx`. Add at the top (before other imports):
  ```tsx
  import './fonts.css'
  ```

- [ ] **Step 6: Update index.html — remove Google Fonts, add local preload**

  Remove these three lines from `frontend/index.html`:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=Newsreader:ital,wght@1,400&family=Geist+Mono:wght@400;700&display=swap" rel="stylesheet" />
  ```

  Add a preload for the most-used font weight (IBM Plex Mono 400) after the WebP preload line:
  ```html
  <link rel="preload" as="font" type="font/woff2" href="/fonts/ibm-plex-mono-latin-400-normal.woff2" crossorigin />
  ```

  **Note:** The exact filename depends on the @fontsource package. Run this to find it after building:
  ```bash
  npm run build && ls dist/assets/*.woff2 | grep ibm | grep 400 | head -1
  ```
  Use that filename in the preload href.

- [ ] **Step 7: Type-check**

  ```bash
  cd frontend && npx tsc --noEmit
  ```

  Expected: no errors.

- [ ] **Step 8: Build and verify fonts are in dist/**

  ```bash
  npm run build && ls dist/assets/*.woff2
  ```

  Expected: woff2 files present in dist/assets/.

- [ ] **Step 9: Run Playwright to verify fonts render**

  ```bash
  npx playwright test e2e/home.spec.ts --headed
  ```

  Expected: all tests pass. Visually verify text renders in correct fonts (IBM Plex Mono for code elements, Newsreader for italic, Geist Mono for UI).

- [ ] **Step 10: Commit**

  ```bash
  git add frontend/src/fonts.css frontend/src/main.tsx frontend/index.html package.json package-lock.json
  git commit -m "perf: self-host Google Fonts via @fontsource, remove render-blocking stylesheet"
  ```

- [ ] **Step 11: Deploy and measure**

  ```bash
  firebase deploy --only hosting
  ```

  Run Lighthouse (same settings). Record:
  ```
  After Fonts:
    Score: ?
    FCP:   ?
    LCP:   ?
    (other metrics)
  ```

---

## Task 3: Unused JS Analysis and Tree-Shaking

**Files:**
- Modify: `frontend/vite.config.ts` (add visualizer temporarily)
- Create: `docs/images/stats-before.png` (manual screenshot)
- Create: `docs/images/stats-after.png` (manual screenshot)
- Modify: source files as determined by analysis

- [ ] **Step 1: Install rollup-plugin-visualizer**

  ```bash
  cd frontend && npm install --save-dev rollup-plugin-visualizer
  ```

- [ ] **Step 2: Add visualizer to vite.config.ts**

  At the top of `frontend/vite.config.ts`, add:
  ```ts
  import { visualizer } from 'rollup-plugin-visualizer'
  ```

  In the `plugins` array, add visualizer:
  ```ts
  plugins: [
    svgr({ svgrOptions: { icon: true } }),
    react(),
    visualizer({ open: false, gzipSize: true, filename: 'stats.html' }),
  ],
  ```

- [ ] **Step 3: Build to generate stats.html**

  ```bash
  npm run build
  ```

  Expected: `stats.html` generated in `frontend/` directory.

- [ ] **Step 4: Open stats.html and screenshot (stats-before.png)**

  ```bash
  open stats.html
  ```

  In the browser, expand the treemap to see all modules. Take a full-page screenshot.
  Save as `docs/images/stats-before.png`.

- [ ] **Step 5: Identify largest unnecessary modules**

  In the treemap, look for:
  - Any module > 10KB in a chunk it shouldn't be in
  - Libraries that appear in multiple chunks (duplicate bundling)
  - Modules you don't recognize — check if they're actually used

  Record findings as a comment here before proceeding.

- [ ] **Step 6: Fix identified issues**

  Apply fixes based on Step 5 findings. Common patterns:

  **If a library uses default import but supports named imports:**
  ```ts
  // Before (imports whole library)
  import _ from 'lodash'
  const result = _.debounce(fn, 300)

  // After (tree-shakeable)
  import debounce from 'lodash/debounce'
  const result = debounce(fn, 300)
  ```

  **If a library has an ESM variant:**
  ```ts
  // Before
  import { something } from 'commonjs-lib'

  // After (check if esm version exists)
  import { something } from 'commonjs-lib/esm'
  ```

  After each fix, run `npx tsc --noEmit` to verify no type errors.

- [ ] **Step 7: Rebuild and screenshot (stats-after.png)**

  ```bash
  npm run build
  open stats.html
  ```

  Take a full-page screenshot. Save as `docs/images/stats-after.png`.

- [ ] **Step 8: Record bundle size delta**

  ```bash
  du -sh dist/assets/*.js | sort -h
  ```

  Compare total JS size vs. before. Record the delta.

- [ ] **Step 9: Remove rollup-plugin-visualizer from vite.config.ts**

  Revert the two changes from Step 2:
  - Remove `import { visualizer } from 'rollup-plugin-visualizer'`
  - Remove `visualizer(...)` from plugins array

  Keep `rollup-plugin-visualizer` in package.json (dev dependency is fine).

- [ ] **Step 10: Type-check and final build**

  ```bash
  npx tsc --noEmit && npm run build
  ```

  Expected: no errors, `stats.html` no longer generated.

- [ ] **Step 11: Run Playwright**

  ```bash
  npx playwright test e2e/ --headed
  ```

  Expected: all tests pass.

- [ ] **Step 12: Commit**

  ```bash
  git add docs/images/stats-before.png docs/images/stats-after.png frontend/vite.config.ts frontend/src/ package.json package-lock.json
  git commit -m "perf: remove unused JS via tree-shaking analysis"
  ```

- [ ] **Step 13: Deploy and measure**

  ```bash
  firebase deploy --only hosting
  ```

  Run Lighthouse (same settings). Record:
  ```
  After JS:
    Score: ?
    FCP:   ?
    LCP:   ?
    TBT:   ?
    (other metrics)
  ```

---

## Task 4: Write Optimization Report

**Files:**
- Create: `raw/articles/k-line-web-performance-optimization-report.md`

**Note:** Write this file in the **Diary repo**, not the K-Line repo. Create a new worktree first:
```bash
git -C /Users/yclee/Diary worktree add .claude/worktrees/docs-2026-05-07-web-perf-report/ -b docs-2026-05-07-web-perf-report
```
Then write to: `/Users/yclee/Diary/.claude/worktrees/docs-2026-05-07-web-perf-report/raw/articles/k-line-web-performance-optimization-report.md`

- [ ] **Step 1: Fill in Lighthouse score table**

  Use all recorded measurements from Tasks 0–3:

  ```markdown
  | Metric | Baseline | After WebP | After Fonts | After JS |
  |--------|----------|------------|-------------|----------|
  | Score  | 91       | ?          | ?           | ?        |
  | FCP    | 2.1s     | ?          | ?           | ?        |
  | LCP    | 3.1s     | ?          | ?           | ?        |
  | TBT    | 0ms      | 0ms        | 0ms         | ?        |
  | CLS    | 0        | 0          | 0           | ?        |
  | SI     | 3.1s     | ?          | ?           | ?        |
  | TTI    | 3.1s     | ?          | ?           | ?        |
  ```

- [ ] **Step 2: Write Optimization 1 section**

  Include:
  - What changed (`<img>` → `<picture>`, preload updated)
  - File size delta (from Task 1 Step 3)
  - Before/after LCP number

- [ ] **Step 3: Write Optimization 2 section**

  Include:
  - What changed (Google Fonts removed, @fontsource + local @font-face)
  - Why `font-display: swap` matters
  - Before/after FCP number

- [ ] **Step 4: Write Optimization 3 section**

  Include:
  - What was found in stats.html (specific modules)
  - What was fixed (specific imports changed)
  - Bundle size delta
  - Embed stats-before and stats-after image references:
    ```markdown
    ![Bundle before](../../ClaudeCodeProject/K-Line-Prediction/docs/images/stats-before.png)
    ![Bundle after](../../ClaudeCodeProject/K-Line-Prediction/docs/images/stats-after.png)
    ```

- [ ] **Step 5: Write summary section**

  Final score, what remains (if anything), next steps.

- [ ] **Step 6: Commit report to Diary worktree**

  ```bash
  git add raw/articles/k-line-web-performance-optimization-report.md
  git commit -m "docs(article): K-Line web performance optimization report"
  ```

- [ ] **Step 7: Notify user — report ready for review**

  Report is at `raw/articles/k-line-web-performance-optimization-report.md`. User reviews before personal site publishing session.

---

## Done Criteria

- [ ] All three optimizations deployed to `https://k-line-prediction-app.web.app/`
- [ ] Lighthouse score recorded after each deploy
- [ ] `docs/images/stats-before.png` and `stats-after.png` committed
- [ ] Report written and committed to Diary repo
- [ ] User has reviewed and approved report
