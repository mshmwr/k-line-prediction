import { test, expect } from '@playwright/test'

// ── AC-021-BODY-PAPER ────────────────────────────────────────────────────────
// Given: user visits any of the 5 routes (/, /about, /diary, /app, /business-logic)
// When:  page finishes loading
// Then:  <body> computed background-color = rgb(244, 239, 229) (#F4EFE5)
// And:   <body> computed color = rgb(26, 24, 20) (#1A1814)
// And:   each route is a standalone test case (PM 量化規則：5 個獨立 case 不合併；
//        /business-logic 另加登入後狀態 = 6 cases 總計)

/** Mock all /api/* routes so tests don't depend on backend.
 *  Register catch-all first (Playwright LIFO), then the specific /api/history-info
 *  mock AppPage依賴的 payload。
 */
async function mockApis(page: import('@playwright/test').Page) {
  await page.route('/api/**', route => route.fulfill({ status: 200, body: '{}' }))
  await page.route('/api/history-info', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        '1H': { filename: 'test.csv', latest: '2024-01-01 00:00', bar_count: 1000 },
        '1D': { filename: 'test.csv', latest: '2024-01-01', bar_count: 500 },
      }),
    })
  )
}

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
    // Playwright page.route LIFO：後註冊的先 match。catch-all 先註冊，
    // 之後再註冊 /api/auth + /api/business-logic 的具體 mock 才會優先生效。
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
