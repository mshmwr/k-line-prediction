import { test, expect } from '@playwright/test'
import { mockApis } from './_fixtures/mock-apis.ts'

// ── AC-021-FOOTER (post-K-035 unification) ──────────────────────────────────
// Given: user visits /, /business-logic
// When:  page is rendered
// Then:  <Footer variant="home" /> 單行資訊列顯示 `yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn`
// And:   字級 11px、顏色 #6B5F4E (text-muted)、top border
//
// K-035 (2026-04-22): /about 原本的 separate-footer Sacred 已正式 retire，
// /about 現在也渲染共用 Footer（variant="about"）。舊的 `/about boundary` describe
// block（pre-K-035 drift-preservation）刪除；/about DOM 斷言改由
// frontend/e2e/shared-components.spec.ts AC-035-CROSS-PAGE-SPEC 負責。
// 詳見 docs/designs/K-035-shared-component-migration.md §6 EDIT #9。
//
// 註（K-030）：/app 於 K-030 撤除 Footer；/app footer-absent 斷言移至
// frontend/e2e/app-bg-isolation.spec.ts（AC-030-NO-FOOTER）。
//
// LIFO ordering invariant 由 _fixtures/mock-apis.ts 內建。

const FOOTER_TEXT = 'yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn'

async function expectFooterHomeVariantVisible(page: import('@playwright/test').Page) {
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

test.describe('AC-021-FOOTER — Footer variant="home" per route', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('/ — Footer variant="home" shows with 11px muted + border-top', async ({ page }) => {
    await mockApis(page)
    await page.goto('/')
    await expectFooterHomeVariantVisible(page)
  })

  test('/business-logic (PasswordForm state) — Footer variant="home" shows with 11px muted + border-top', async ({ page }) => {
    await mockApis(page)
    await page.goto('/business-logic')
    await expectFooterHomeVariantVisible(page)
  })

  test('/business-logic (logged-in state) — Footer variant="home" still shows', async ({ page }) => {
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

    await expectFooterHomeVariantVisible(page)
  })
})
