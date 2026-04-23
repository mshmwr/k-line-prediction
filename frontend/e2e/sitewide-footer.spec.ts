import { test, expect } from '@playwright/test'
import { mockApis } from './_fixtures/mock-apis.ts'

// ── AC-021-FOOTER + AC-034-P3-SITEWIDE-FOOTER-4-ROUTES ──────────────────────
// Given: user visits /, /about, /business-logic, /diary
// When:  page is rendered
// Then:  <Footer /> 單行資訊列顯示 `yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn`
// And:   字級 11px、顏色 #6B5F4E (text-muted)、top border
//
// K-034 Phase 3 (2026-04-23): AC-034-P3-SITEWIDE-FOOTER-4-ROUTES — /diary 加入 4-route loop,
// 共用 Footer 覆蓋 /、/about、/business-logic、/diary 四路由。Challenge #6 ruling Option A.
//
// K-034 Phase 1 (2026-04-23): Footer variant prop 全數退役；/、/business-logic、/about
// 三路由共用同一份 prop-less Footer；舊的 variant="home"/"about" 語義不再適用。
// K-035 (2026-04-22): /about 原本的 separate-footer Sacred 已 retire，納入共用 Footer。
// /about DOM 斷言改由 frontend/e2e/shared-components.spec.ts（K-034 Phase 1 rewrite）
// 以 byte-identical outerHTML + PNG snapshot 承擔。
//
// 註（K-030）：/app 於 K-030 撤除 Footer；/app footer-absent 斷言移至
// frontend/e2e/app-bg-isolation.spec.ts（AC-030-NO-FOOTER）。
//
// LIFO ordering invariant 由 _fixtures/mock-apis.ts 內建。

const FOOTER_TEXT = 'yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn'

async function expectSharedFooterVisible(page: import('@playwright/test').Page) {
  const footerText = page.getByText(FOOTER_TEXT, { exact: true })
  await expect(footerText).toBeVisible()

  const fontSize = await footerText.evaluate(el => getComputedStyle(el).fontSize)
  expect(fontSize).toBe('11px')

  const color = await footerText.evaluate(el => getComputedStyle(el).color)
  expect(color).toBe('rgb(107, 95, 78)')

  // top border：span 在 <footer> 內，向上找 <footer> 驗 border-top-width
  const borderTopWidth = await footerText.evaluate(el => {
    const footer = el.closest('footer')
    if (!footer) return '0px'
    return getComputedStyle(footer).borderTopWidth
  })
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
