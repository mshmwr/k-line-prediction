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

  test('T2 — Footer contains only Pencil-canonical text (/ sample)', async ({ page }) => {
    await mockApis(page)
    await page.goto('/')
    const footer = page.locator('footer').last()
    await expect(footer).toBeVisible()

    // U+00B7 MIDDLE DOT delimiter per Pencil specs/homepage-v2.frame-86psQ.json + 1BGtd.json
    await expect(
      footer.getByText('yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn', { exact: true }),
    ).toBeVisible()

    // GA disclosure
    await expect(
      footer.getByText('This site uses Google Analytics to collect anonymous usage data.', { exact: true }),
    ).toBeVisible()
  })
})

test.describe('AC-034-P1-NO-ABOUT-CTA — /about has no "Let\'s talk" CTA block', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('T3 — /about renders no CTA text + no cta-* testids + no mailto/github/linkedin anchors', async ({ page }) => {
    await mockApis(page)
    await page.goto('/about')

    // No CTA text strings
    await expect(page.getByText("Let's talk →", { exact: true })).toHaveCount(0)
    await expect(page.getByText('Or see the source:', { exact: true })).toHaveCount(0)

    // No cta-* testids
    await expect(page.locator('[data-testid="cta-email"]')).toHaveCount(0)
    await expect(page.locator('[data-testid="cta-github"]')).toHaveCount(0)
    await expect(page.locator('[data-testid="cta-linkedin"]')).toHaveCount(0)

    // No mailto / github / linkedin anchors
    await expect(page.locator('a[href="mailto:yichen.lee.20@gmail.com"]')).toHaveCount(0)
    await expect(page.locator('a[href="https://github.com/mshmwr/k-line-prediction"]')).toHaveCount(0)
    await expect(page.locator('a[href="https://linkedin.com/in/yichenlee-career"]')).toHaveCount(0)
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
    await expect(
      footer.getByText('yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn', { exact: true }),
    ).toBeVisible()

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

// ── AC-034-P1 Snapshot baselines (Q5a ruling — shared components get Playwright snapshots) ─
// First run creates baselines under frontend/e2e/__screenshots__/<spec>/<testname>/;
// subsequent runs FAIL if Footer drifts visually. Pencil drift → Designer re-export →
// baseline update commit (new snapshots become new SSOT).

test.describe('AC-034-P1 — Footer toMatchSnapshot() baselines per route', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  for (const route of ['/', '/about', '/business-logic', '/diary']) {
    test(`Footer snapshot on ${route}`, async ({ page }) => {
      await mockApis(page)
      await page.goto(route)
      const footer = page.locator('footer').last()
      await expect(footer).toBeVisible()
      const snapshotName = `footer-${route.replace(/^\//, '') || 'home'}.png`
      await expect(await footer.screenshot()).toMatchSnapshot(snapshotName, { maxDiffPixelRatio: 0.02 })
    })
  }
})
