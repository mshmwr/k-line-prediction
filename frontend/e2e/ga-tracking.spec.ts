import { test, expect } from '@playwright/test'

/**
 * K-018 GA4 Tracking E2E tests.
 *
 * window.dataLayer spy is injected before page JS runs via addInitScript,
 * so all gtag() calls (including initGA()) push into the same dataLayer array.
 * No real GA4 network requests are made — VITE_GA_MEASUREMENT_ID is set to
 * 'G-TESTID0000' in playwright.config.ts webServer.env (a non-existent ID).
 */

// ── AC-018-INSTALL ────────────────────────────────────────────────────────────
// Given: VITE_GA_MEASUREMENT_ID is set
// When:  any page loads
// Then:  a <script src*="googletagmanager.com"> is present in <head>

test.describe('AC-018-INSTALL — GA4 snippet injected', () => {
  test('gtag.js script tag exists in document head', async ({ page }) => {
    await page.goto('/')
    const scriptCount = await page.locator('script[src*="googletagmanager.com"]').count()
    expect(scriptCount).toBe(1)
  })
})

// ── AC-018-PAGEVIEW ──────────────────────────────────────────────────────────
// Given: user navigates to a route
// When:  route renders
// Then:  a page_view event with page_location is pushed to dataLayer

test.describe('AC-018-PAGEVIEW — pageview events fired on route change', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.dataLayer = window.dataLayer || []
      window.gtag = function () {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer.push(arguments)
      }
    })
  })

  test('/ fires page_view with page_location "/"', async ({ page }) => {
    await page.goto('/')
    await page.waitForFunction(() =>
      (window.dataLayer as unknown[][]).some(
        (entry) => (entry as IArguments)[0] === 'event' && (entry as IArguments)[1] === 'page_view'
      )
    )
    const dataLayer = await page.evaluate(() => window.dataLayer)
    const pageviewEntry = (dataLayer as unknown[][]).find(
      (entry) => (entry as IArguments)[0] === 'event' && (entry as IArguments)[1] === 'page_view'
    )
    expect(pageviewEntry).toBeDefined()
    expect(pageviewEntry![2]).toMatchObject({ page_location: '/' })
  })

  test('/about fires page_view with page_location "/about"', async ({ page }) => {
    await page.goto('/about')
    await page.waitForFunction(() =>
      (window.dataLayer as unknown[][]).some(
        (entry) => (entry as IArguments)[0] === 'event' && (entry as IArguments)[1] === 'page_view'
      )
    )
    const dataLayer = await page.evaluate(() => window.dataLayer)
    const pageviewEntry = (dataLayer as unknown[][]).find(
      (entry) => (entry as IArguments)[0] === 'event' && (entry as IArguments)[1] === 'page_view'
    )
    expect(pageviewEntry).toBeDefined()
    expect(pageviewEntry![2]).toMatchObject({ page_location: '/about' })
  })

  test('/app fires page_view with page_location "/app"', async ({ page }) => {
    await page.goto('/app')
    await page.waitForFunction(() =>
      (window.dataLayer as unknown[][]).some(
        (entry) => (entry as IArguments)[0] === 'event' && (entry as IArguments)[1] === 'page_view'
      )
    )
    const dataLayer = await page.evaluate(() => window.dataLayer)
    const pageviewEntry = (dataLayer as unknown[][]).find(
      (entry) => (entry as IArguments)[0] === 'event' && (entry as IArguments)[1] === 'page_view'
    )
    expect(pageviewEntry).toBeDefined()
    expect(pageviewEntry![2]).toMatchObject({ page_location: '/app' })
  })

  test('/diary fires page_view with page_location "/diary"', async ({ page }) => {
    await page.goto('/diary')
    await page.waitForFunction(() =>
      (window.dataLayer as unknown[][]).some(
        (entry) => (entry as IArguments)[0] === 'event' && (entry as IArguments)[1] === 'page_view'
      )
    )
    const dataLayer = await page.evaluate(() => window.dataLayer)
    const pageviewEntry = (dataLayer as unknown[][]).find(
      (entry) => (entry as IArguments)[0] === 'event' && (entry as IArguments)[1] === 'page_view'
    )
    expect(pageviewEntry).toBeDefined()
    expect(pageviewEntry![2]).toMatchObject({ page_location: '/diary' })
  })
})

// ── AC-018-CLICK ─────────────────────────────────────────────────────────────
// Given: user clicks a CTA
// When:  onClick fires
// Then:  a cta_click event with the correct label is pushed to dataLayer

test.describe('AC-018-CLICK — CTA click events fired', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.dataLayer = window.dataLayer || []
      window.gtag = function () {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer.push(arguments)
      }
    })
  })

  // The three /about-scoped CTA click tests (contact_email / github_link / linkedin_link)
  // deleted per K-034 §PM ruling on BQ-034-P1-01 — Sacred retired per §1.4 Pencil SSOT verdict.
  // /about Footer now renders plain text (no <a> anchors), so no CTA click events fire there.

  test('BuiltByAIBanner fires cta_click with label "banner_about"', async ({ page }) => {
    await page.goto('/')
    // Intercept navigation so we can read dataLayer after click
    await page.route('**/*', (route) => route.continue())
    // Click then wait for cta_click to appear in dataLayer before navigation completes
    const clickPromise = page.locator('a[aria-label="About the AI collaboration behind this project"]').click()
    await page.waitForFunction(() =>
      (window.dataLayer as unknown[][]).some(
        (entry) => (entry as IArguments)[1] === 'cta_click'
      )
    )
    const dataLayer = await page.evaluate(() => window.dataLayer)
    const clickEntry = (dataLayer as unknown[][]).find(
      (entry) => (entry as IArguments)[1] === 'cta_click'
    )
    expect(clickEntry).toBeDefined()
    expect(clickEntry![2]).toMatchObject({ label: 'banner_about' })
    expect((clickEntry![2] as Record<string, unknown>).page_location).toBeDefined()
    expect((clickEntry![2] as Record<string, unknown>).page_location).toBe('/')
    await clickPromise
  })
})

// ── AC-018-PRIVACY ────────────────────────────────────────────────────────────
// Given: GA4 is initialised
// When:  config call is made
// Then:  no user_id is passed (no PII collection)

test.describe('AC-018-PRIVACY — no PII in GA4 config', () => {
  test('gtag config call does not include user_id', async ({ page }) => {
    await page.addInitScript(() => {
      window.dataLayer = window.dataLayer || []
      window.gtag = function () {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer.push(arguments)
      }
    })
    await page.goto('/')
    await page.waitForTimeout(300)
    const dataLayer = await page.evaluate(() => window.dataLayer)
    const configEntry = (dataLayer as unknown[][]).find(
      (entry) => (entry as IArguments)[0] === 'config'
    )
    if (configEntry) {
      expect(configEntry[2]).not.toHaveProperty('user_id')
    }
    // If no config entry, GA was not initialised — acceptable (env var guard)
  })
})

// ── AC-018-PRIVACY-POLICY ─────────────────────────────────────────────────────
// Given: user visits any page rendering the shared Footer (K-034 Phase 1 prop-less)
// When:  page loads
// Then:  Google Analytics disclosure text is visible in the footer

test.describe('AC-018-PRIVACY-POLICY — GA disclosure text visible', () => {
  test('Google Analytics disclosure text visible on home page', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Google Analytics', { exact: false })).toBeVisible()
  })

  test('Google Analytics disclosure text visible on about page', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('Google Analytics', { exact: false })).toBeVisible()
  })
})
