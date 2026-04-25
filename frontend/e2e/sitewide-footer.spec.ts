import { test, expect } from '@playwright/test'
import { mockApis } from './_fixtures/mock-apis.ts'

// ── AC-021-FOOTER + AC-034-P3-SITEWIDE-FOOTER-4-ROUTES ──────────────────────
// Given: user visits /, /about, /business-logic, /diary
// When:  page is rendered
// Then:  <Footer /> shows clickable email button + GitHub + LinkedIn brand-asset SVG anchors
// And:   font-size 11px, text-muted color (#6B5F4E) on <footer>, top border, font-mono
//
// K-050 (2026-04-25): Footer flat-text one-liner replaced with 3 brand-asset SVG anchors
// (mail / GitHub / LinkedIn) + click-to-copy email <button>. Old plaintext line
// `yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn` removed. Assertions now target
// <footer> element directly for font/color/border + the cta-email-copy button text for
// email visibility (see shared-components.spec.ts AC-050-* for behavior coverage).
//
// K-034 Phase 3 (2026-04-23): AC-034-P3-SITEWIDE-FOOTER-4-ROUTES — /diary 4-route loop,
// shared Footer覆蓋 /、/about、/business-logic、/diary四路由. Challenge #6 ruling Option A.
//
// K-034 Phase 1 (2026-04-23): Footer variant prop fully retired; / + /business-logic +
// /about share a single prop-less Footer; old variant="home"/"about" semantics no longer
// apply. K-035 (2026-04-22): /about original separate-footer Sacred retired, merged into
// shared Footer. /about DOM assertion delegated to shared-components.spec.ts (K-034 P1).
//
// Note (K-030): /app removed Footer in K-030; /app footer-absent assertion lives at
// frontend/e2e/app-bg-isolation.spec.ts (AC-030-NO-FOOTER).
//
// LIFO ordering invariant from _fixtures/mock-apis.ts.

async function expectSharedFooterVisible(page: import('@playwright/test').Page) {
  const footer = page.locator('footer').last()
  await expect(footer).toBeVisible()

  // K-050: email visible as cta-email-copy button text content (not flat text node)
  const copyBtn = footer.locator('[data-testid="cta-email-copy"]')
  await expect(copyBtn).toHaveText('yichen.lee.20@gmail.com')

  // font-size 11px on <footer> element
  const fontSize = await footer.evaluate(el => getComputedStyle(el).fontSize)
  expect(fontSize).toBe('11px')

  // text-muted color #6B5F4E (rgb(107, 95, 78)) on <footer>
  const color = await footer.evaluate(el => getComputedStyle(el).color)
  expect(color).toBe('rgb(107, 95, 78)')

  // top border > 0
  const borderTopWidth = await footer.evaluate(el => getComputedStyle(el).borderTopWidth)
  expect(parseFloat(borderTopWidth)).toBeGreaterThan(0)
}

test.describe('AC-021-FOOTER + AC-034-P3-SITEWIDE-FOOTER-4-ROUTES — shared Footer per route', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  // 4-route loop per AC-034-P3-SITEWIDE-FOOTER-4-ROUTES (Challenge #6 Option A).
  // Each iteration is an independent `test()` — 4 independent assertions, cannot be merged.
  for (const route of ['/', '/about', '/business-logic', '/diary']) {
    test(`${route} — shared Footer shows with 11px muted + border-top`, async ({ page }) => {
      await mockApis(page)
      await page.goto(route)
      await expectSharedFooterVisible(page)
    })
  }

  test('/business-logic (logged-in state) — shared Footer still shows', async ({ page }) => {
    // mockApis 內建 LIFO ordering（_fixtures/mock-apis.ts）；具體 route 於此後註冊。
    await mockApis(page)

    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '')
    const payload = btoa(JSON.stringify({
      sub: 'business-logic-access',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    })).replace(/=/g, '')
    const fakeToken = `${header}.${payload}.fakesig`

    await page.route('/api/auth', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: fakeToken }) })
    )
    await page.route('/api/business-logic', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: '## Strategy\n\nContent body.' }),
      })
    )

    await page.goto('/business-logic')
    await page.getByPlaceholder('Enter access password').fill('anypass')
    await page.getByRole('button', { name: 'Submit' }).click()
    await expect(page.getByText('Strategy')).toBeVisible({ timeout: 5000 })

    await expectSharedFooterVisible(page)
  })
})
