import { test, expect } from '@playwright/test'
import { mockApis } from './_fixtures/mock-apis.ts'

// ── K-034 Phase 1 — Footer Pencil-literal unification ───────────────────────
// Supersedes K-035 AC-035-CROSS-PAGE-SPEC per PM ruling on BQ-034-P1-01
// (2026-04-23). Pencil SSOT (frames 86psQ + 1BGtd) shows byte-identical
// inline one-liner footer content across all consuming routes. Any
// divergence = FAIL; any re-introduction of variant-specific CTA branch
// = FAIL (AC-034-P1-FAIL-IF-GATE-REMOVED).

/**
 * Normalize <footer> outerHTML for cross-route byte-identity comparison.
 * Strips React-hydration / dynamic attrs that can legitimately differ
 * between routes without reflecting a real DOM divergence (e.g. data-reactroot,
 * data-react-helmet, __processed attrs). Tailwind JIT class ordering is
 * stable so we do NOT strip class attr — class-order divergence across
 * routes would indicate a real variant leak and must FAIL.
 */
function normalizeFooterHtml(html: string): string {
  return html
    .replace(/\s+data-reactroot="[^"]*"/g, '')
    .replace(/\s+data-react-helmet="[^"]*"/g, '')
    .replace(/\s+data-rh="[^"]*"/g, '')
    // __playwright_target__ is a Playwright internal attribute injected by the
    // locator engine; its suffix (`call@NNN`) differs per locator invocation
    // and has no relationship to the rendered DOM.
    .replace(/\s+__playwright_target__="[^"]*"/g, '')
    .trim()
}

test.describe('AC-034-P1-ROUTE-DOM-PARITY — Footer byte-identical across consuming routes', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  const consumingRoutes = ['/', '/about', '/business-logic', '/diary']

  test('T1 — / + /about + /business-logic + /diary Footer byte-identical outerHTML', async ({ page }) => {
    const footerHtmlByRoute: Record<string, string> = {}

    for (const route of consumingRoutes) {
      await mockApis(page)
      await page.goto(route)
      const footer = page.locator('footer').last()
      await expect(footer).toBeVisible()
      const html = await footer.evaluate((el) => el.outerHTML)
      footerHtmlByRoute[route] = normalizeFooterHtml(html)
    }

    // Pairwise byte-identity assertion
    const referenceHtml = footerHtmlByRoute['/']
    for (const route of consumingRoutes) {
      expect(
        footerHtmlByRoute[route],
        `Footer outerHTML on ${route} must equal outerHTML on / (Pencil SSOT byte-identity)`,
      ).toBe(referenceHtml)
    }
  })

  test('T2 — Footer renders K-050 brand-asset CTA triad + email button + GA disclosure (/ sample)', async ({ page }) => {
    await mockApis(page)
    await page.goto('/')
    const footer = page.locator('footer').last()
    await expect(footer).toBeVisible()

    // K-050 — brand-asset SVG anchor triad + click-to-copy email <button>
    // Pencil flat text node `yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn` superseded
    // by interactive components; runtime divergence backed by design-exemptions.md §2 BRAND-ASSET.
    await expect(footer.locator('[data-testid="cta-email"]')).toBeVisible()
    await expect(footer.locator('[data-testid="cta-email-copy"]')).toBeVisible()
    await expect(footer.locator('[data-testid="cta-github"]')).toBeVisible()
    await expect(footer.locator('[data-testid="cta-linkedin"]')).toBeVisible()

    // Email button shows plain-text email in initial (non-copied) state
    await expect(footer.locator('[data-testid="cta-email-copy"]')).toHaveText('yichen.lee.20@gmail.com')

    // GA disclosure preserved (K-018 REGULATORY exemption)
    await expect(
      footer.getByText('This site uses Google Analytics to collect anonymous usage data.', { exact: true }),
    ).toBeVisible()
  })
})

// K-050 (2026-04-25) INVERTS K-034-P1-NO-ABOUT-CTA — /about Footer now renders all 4
// brand-asset CTAs (K-017 anchor partial-restore + K-018 click-to-copy full-restore).
// Pencil flat-text framing preserved as layout-placeholder; runtime divergence backed by
// design-exemptions.md §2 BRAND-ASSET. K-022 italic/underline label "Let's talk →" stays
// retired (Pencil has no such label).
test.describe('AC-050-FOOTER-LINKS-PRESENT — /about Footer renders 4 brand-asset CTAs', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('T3 — /about renders cta-email + cta-email-copy + cta-github + cta-linkedin testids + 3 hrefs', async ({ page }) => {
    await mockApis(page)
    await page.goto('/about')

    // K-050 — brand-asset CTA testids count=1 each (single Footer DOM 4 routes)
    await expect(page.locator('[data-testid="cta-email"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="cta-email-copy"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="cta-github"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="cta-linkedin"]')).toHaveCount(1)

    // K-050 — anchors with explicit hrefs count=1 each (K-017 AC-017-FOOTER partial-restore)
    await expect(page.locator('a[href="mailto:yichen.lee.20@gmail.com"]')).toHaveCount(1)
    await expect(page.locator('a[href="https://github.com/mshmwr/k-line-prediction"]')).toHaveCount(1)
    await expect(page.locator('a[href="https://linkedin.com/in/yichenlee-career"]')).toHaveCount(1)

    // K-022 italic/underline NOT restored — "Let's talk →" + "Or see the source:" retired
    await expect(page.getByText("Let's talk →", { exact: true })).toHaveCount(0)
    await expect(page.getByText('Or see the source:', { exact: true })).toHaveCount(0)
  })
})

// AC-034-P1-NO-FOOTER-ROUTES — /diary row retired 2026-04-23 by K-034 Phase 3 (absorbs ex-K-038 §3 BQ-034-P3-03).
// User intent change: /diary now renders shared Footer per AC-034-P3-DIARY-FOOTER-RENDERS;
// T4 block deleted per AC-034-P3-SACRED-RETIREMENT. /diary Footer coverage now in T1 byte-identity loop above.
// /app no-footer preserved by existing app-bg-isolation.spec.ts AC-030-NO-FOOTER
// (single source of truth per feedback_shared_component_inventory_check).

test.describe('AC-034-P3-DIARY-FOOTER-LOADING-VISIBLE — /diary Footer renders during loading', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('Footer visible during /diary.json fetch delay AND after resolution', async ({ page }) => {
    // Delay diary.json response to keep DiaryPage in loading state long enough to assert Footer.
    // mockApis catch-all fulfills /api/** only; /diary.json is a public asset fetched relative
    // to origin — overrideable via page.route('**/diary.json', ...).
    let release: (() => void) | null = null
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })

    await mockApis(page)
    await page.route('**/diary.json', async (route) => {
      await gate
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            ticketId: 'K-034',
            title: 'Sample entry for LOADING-VISIBLE fixture',
            date: '2026-04-23',
            text: 'Fixture entry asserting Footer remains rendered across loading→resolved transition.',
          },
        ]),
      })
    })

    await page.goto('/diary')

    // Assert DiaryLoading is mounted (confirming we're in the loading branch, NOT post-resolution).
    await expect(page.locator('[data-testid="diary-loading"]')).toBeVisible()

    // Assert Footer visible DURING loading state (before diary.json resolves).
    // Footer renders as sibling of <main>; DiaryLoading is inside <main>.
    const footer = page.locator('footer').last()
    await expect(footer).toBeVisible()
    await expect(page.locator('footer')).toHaveCount(1)
    // K-050 — assert click-to-copy email button visible (Pencil flat-text superseded;
    // testid-based assertion is K-050 BRAND-ASSET runtime contract per AC-050-FOOTER-CTA-PRESENT)
    await expect(footer.locator('[data-testid="cta-email-copy"]')).toBeVisible()

    // Release the delay; diary.json resolves and DiaryPage transitions to timeline state.
    release!()

    // Wait for transition: DiaryLoading unmounts AND diary-entry renders (timeline branch).
    await expect(page.locator('[data-testid="diary-loading"]')).toHaveCount(0)
    await expect(page.locator('[data-testid="diary-entry"]').first()).toBeVisible()

    // Assert Footer STILL visible after resolution (post-loading terminal state).
    await expect(page.locator('footer')).toHaveCount(1)
    await expect(footer).toBeVisible()
  })
})

// ── AC-050-EMAIL-COPY-BEHAVIOR ────────────────────────────────────────────────
// K-050 (2026-04-25) — click-to-copy email <button>:
//   1. writes EMAIL ('yichen.lee.20@gmail.com') to navigator.clipboard
//   2. swaps button label from email → 'Copied!'
//   3. announces 'Email address copied to clipboard' via sr-only role=status aria-live=polite
//   4. auto-reverts button label + clears aria-live announcement after COPY_RESET_MS (1500ms in impl)
// Permission: Playwright BrowserContext.grantPermissions(['clipboard-read', 'clipboard-write']).
// No hardcoded sleep — Playwright auto-retry on toHaveText handles the 1500ms revert window.

test.describe('AC-050-EMAIL-COPY-BEHAVIOR — click-to-copy email <button>', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('T-COPY — clipboard receives EMAIL + button text swaps + sr-only aria-live announces + auto-reverts', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await mockApis(page)
    await page.goto('/about')

    const footer = page.locator('footer').last()
    await expect(footer).toBeVisible()

    const copyBtn = footer.locator('[data-testid="cta-email-copy"]')
    const ariaLive = footer.locator('[role="status"][aria-live="polite"]')

    // Initial state — plain email label, empty aria-live region
    await expect(copyBtn).toHaveText('yichen.lee.20@gmail.com')
    await expect(ariaLive).toHaveText('')

    await copyBtn.click()

    // Clipboard contents = EMAIL
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toBe('yichen.lee.20@gmail.com')

    // Button label swapped + aria-live announces
    await expect(copyBtn).toHaveText('Copied!')
    await expect(ariaLive).toHaveText('Email address copied to clipboard')

    // Auto-revert after COPY_RESET_MS (1500ms in impl) — Playwright auto-retry covers the window
    await expect(copyBtn).toHaveText('yichen.lee.20@gmail.com', { timeout: 3000 })
    await expect(ariaLive).toHaveText('', { timeout: 3000 })
  })

  test('T-COPY-RAPID — second click within revert window resets timer (useRef cleanup)', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await mockApis(page)
    await page.goto('/about')

    const footer = page.locator('footer').last()
    const copyBtn = footer.locator('[data-testid="cta-email-copy"]')

    // Click 1 — label swaps to Copied!
    await copyBtn.click()
    await expect(copyBtn).toHaveText('Copied!')

    // Click 2 within 500ms (well inside the 1500ms revert window)
    await page.waitForTimeout(500)
    await copyBtn.click()
    await expect(copyBtn).toHaveText('Copied!')

    // 1200ms after click 2 (total 1700ms after click 1) — without timer-reset bug, label
    // would have reverted at click1+1500ms=1500ms. With cleanup, it must still show Copied!
    await page.waitForTimeout(1200)
    await expect(copyBtn).toHaveText('Copied!')

    // Eventually reverts after click2+1500ms — Playwright auto-retry covers
    await expect(copyBtn).toHaveText('yichen.lee.20@gmail.com', { timeout: 3000 })
  })
})

// ── AC-034-P1 Snapshot baselines (Q5a ruling — shared components get Playwright snapshots) ─
// First run creates baselines under frontend/e2e/__screenshots__/<spec>/<testname>/;
// subsequent runs FAIL if Footer drifts visually. Pencil drift → Designer re-export →
// baseline update commit (new snapshots become new SSOT).

test.describe('AC-034-P1 — Footer toMatchSnapshot() baselines per route', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  for (const route of ['/', '/about', '/business-logic', '/diary']) {
    test(`Footer snapshot on ${route}`, async ({ page }) => {
      // K-057 Phase 5: grant consent so ConsentBanner is hidden — banner is fixed bottom-left
      // and would overlap the footer bounding box in the screenshot if present.
      await page.addInitScript(() => { localStorage.setItem('kline-consent', 'granted') })
      await mockApis(page)
      await page.goto(route)
      const footer = page.locator('footer').last()
      await expect(footer).toBeVisible()
      const snapshotName = `footer-${route.replace(/^\//, '') || 'home'}.png`
      await expect(await footer.screenshot()).toMatchSnapshot(snapshotName, { maxDiffPixelRatio: 0.02 })
    })
  }
})

// ── AC-045-FOOTER-WIDTH-PARITY ────────────────────────────────────────────────
// K-045 (2026-04-24) — Footer full-bleed preserved across /about container migration
// + cross-route pairwise width diff ≤ 2px regression gate (mirrors K-040 pairwise rule).
// Given: K-034 Phase 1 Sacred + K-040 Footer pairwise width ≤2px.
// When:  /about container migration lands (SectionContainer retired, per-section
//        inline max-w-[1248px]).
// Then:  Footer element is NOT a descendant of the 1248 wrapper (must remain root
//        sibling, full-bleed at viewport width); width parity across 3 routes ≤ 2px.

test.describe('AC-045-FOOTER-WIDTH-PARITY — Footer full-bleed + cross-route pairwise diff', () => {
  const pairwiseRoutes = ['/', '/about', '/diary'] as const

  test('T18 — Footer is NOT descendant of max-w-[1248px] wrapper on /about (full-bleed)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/about')
    const footer = page.locator('footer').last()
    await expect(footer).toBeVisible()

    // Footer width MUST equal viewport width (not capped at 1248)
    const measure = await footer.evaluate(el => {
      const r = el.getBoundingClientRect()
      // Walk up ancestors — Footer MUST NOT have an ancestor with a max-w-[1248px] computed max-width
      let ancestor: HTMLElement | null = el.parentElement
      let hasCappedAncestor = false
      while (ancestor) {
        const s = window.getComputedStyle(ancestor)
        // computed max-width of 1248 (or 1232, etc. near-range) = capped ancestor
        if (s.maxWidth && s.maxWidth !== 'none' && s.maxWidth !== '100%') {
          const maxW = parseFloat(s.maxWidth)
          if (!Number.isNaN(maxW) && maxW > 0 && maxW <= 1300) {
            hasCappedAncestor = true
            break
          }
        }
        ancestor = ancestor.parentElement
      }
      return { width: r.width, hasCappedAncestor }
    })
    expect(measure.hasCappedAncestor, 'Footer must NOT be descendant of max-w-[1248px] wrapper').toBe(false)
    expect(measure.width).toBeGreaterThanOrEqual(1278)
    expect(measure.width).toBeLessThanOrEqual(1282)
  })

  for (const vp of [
    { w: 1280, h: 800, label: '1280×800' },
    { w: 1440, h: 900, label: '1440×900' },
    { w: 375, h: 667, label: '375×667' },
  ] as const) {
    test(`T19 — @${vp.label}: Footer width pairwise diff across ${pairwiseRoutes.join(', ')} ≤ 2px`, async ({ page }) => {
      await page.setViewportSize({ width: vp.w, height: vp.h })
      const widths: Record<string, number> = {}
      for (const route of pairwiseRoutes) {
        await mockApis(page)
        await page.goto(route)
        const footer = page.locator('footer').last()
        await expect(footer).toBeVisible()
        widths[route] = await footer.evaluate(el => el.getBoundingClientRect().width)
      }
      const values = Object.values(widths)
      const maxDiff = Math.max(...values) - Math.min(...values)
      expect(maxDiff, `Footer pairwise widths @${vp.label}: ${JSON.stringify(widths)}`).toBeLessThanOrEqual(2)
    })
  }
})
