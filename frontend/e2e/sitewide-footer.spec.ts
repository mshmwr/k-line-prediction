import { test, expect } from '@playwright/test'

// ── AC-021-FOOTER ────────────────────────────────────────────────────────────
// Given: user visits /, /app, /business-logic
// When:  page is rendered
// Then:  <HomeFooterBar /> 單行資訊列顯示 `yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn`
// And:   字級 11px、顏色 #6B5F4E (text-muted)、top border
//
// /about 維持 <FooterCtaSection />（K-017 鎖定），不得渲染 HomeFooterBar。
//
// 3 個獨立 test case（PM 量化規則）+ /business-logic 登入後狀態 = 4；
// 另加 /about FooterCtaSection 存在 + HomeFooterBar 不存在 = 5。

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

const FOOTER_TEXT = 'yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn'

async function expectHomeFooterBarVisible(page: import('@playwright/test').Page) {
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

test.describe('AC-021-FOOTER — HomeFooterBar per route', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('/ — HomeFooterBar shows with 11px muted + border-top', async ({ page }) => {
    await mockApis(page)
    await page.goto('/')
    await expectHomeFooterBarVisible(page)
  })

  test('/app — HomeFooterBar shows with 11px muted + border-top', async ({ page }) => {
    await mockApis(page)
    await page.goto('/app')
    await expectHomeFooterBarVisible(page)
  })

  test('/business-logic (PasswordForm state) — HomeFooterBar shows with 11px muted + border-top', async ({ page }) => {
    await mockApis(page)
    await page.goto('/business-logic')
    await expectHomeFooterBarVisible(page)
  })

  test('/business-logic (logged-in state) — HomeFooterBar still shows', async ({ page }) => {
    // catch-all 先註冊，再疊 /api/auth + /api/business-logic 具體 mock
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

    await expectHomeFooterBarVisible(page)
  })
})

test.describe('AC-021-FOOTER — /about boundary', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('/about renders FooterCtaSection, NOT HomeFooterBar', async ({ page }) => {
    await mockApis(page)
    await page.goto('/about')

    // FooterCtaSection 特徵：Let's talk heading
    await expect(page.getByText("Let's talk →", { exact: true })).toBeVisible()

    // HomeFooterBar 資訊行不得出現
    await expect(page.getByText(FOOTER_TEXT, { exact: true })).toHaveCount(0)
  })
})
