import { test, expect } from '@playwright/test'
import { mockApis } from './_fixtures/mock-apis.ts'

// ── AC-021-BODY-PAPER ────────────────────────────────────────────────────────
// Given: user visits any of the 5 routes (/, /about, /diary, /app, /business-logic)
// When:  page finishes loading
// Then:  <body> computed background-color = rgb(244, 239, 229) (#F4EFE5)
// And:   <body> computed color = rgb(26, 24, 20) (#1A1814)
// And:   each route is a standalone test case (PM 量化規則：5 個獨立 case 不合併；
//        /business-logic 另加登入後狀態 = 6 cases 總計)
//
// LIFO ordering invariant 由 _fixtures/mock-apis.ts 內建：catch-all 先註冊、常用
// 具體 mock 後註冊。Test 若需加額外具體 route（e.g. /api/auth）必須於 mockApis()
// **之後**註冊；詳見 _fixtures/mock-apis.ts JSDoc。

async function expectPaperBody(page: import('@playwright/test').Page) {
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(244, 239, 229)')
  const bodyColor = await page.evaluate(() => getComputedStyle(document.body).color)
  expect(bodyColor).toBe('rgb(26, 24, 20)')
}

test.describe('AC-021-BODY-PAPER — body paper bg across 5 routes', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('HomePage (/) — body bg=#F4EFE5 + text=#1A1814', async ({ page }) => {
    await mockApis(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expectPaperBody(page)
  })

  test('AboutPage (/about) — body bg=#F4EFE5 + text=#1A1814', async ({ page }) => {
    await mockApis(page)
    await page.goto('/about')
    await page.waitForLoadState('networkidle')
    await expectPaperBody(page)
  })

  test('DiaryPage (/diary) — body bg=#F4EFE5 + text=#1A1814', async ({ page }) => {
    await mockApis(page)
    await page.goto('/diary')
    await page.waitForLoadState('networkidle')
    await expectPaperBody(page)
  })

  test('AppPage (/app) — body bg=#F4EFE5 + text=#1A1814', async ({ page }) => {
    await mockApis(page)
    await page.goto('/app')
    await page.waitForLoadState('networkidle')
    await expectPaperBody(page)
  })

  test('BusinessLogicPage (/business-logic, PasswordForm state) — body bg=#F4EFE5 + text=#1A1814', async ({ page }) => {
    await mockApis(page)
    await page.goto('/business-logic')
    await page.waitForLoadState('networkidle')
    await expectPaperBody(page)
  })

  test('BusinessLogicPage (/business-logic, logged-in state) — body bg=#F4EFE5 + text=#1A1814', async ({ page }) => {
    // mockApis 內建 LIFO ordering：catch-all 先註冊（_fixtures/mock-apis.ts）。
    // 具體 /api/auth + /api/business-logic 在此之後註冊 → 優先匹配。
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

    await expectPaperBody(page)
  })
})
