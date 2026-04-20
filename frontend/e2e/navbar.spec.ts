import { test, expect } from '@playwright/test'

// ── Shared setup helpers ─────────────────────────────────────────────────────

/** Mock all /api/* routes so tests don't depend on the backend */
async function mockApis(page: import('@playwright/test').Page) {
  // Register catch-all FIRST (Playwright routes are LIFO — later-registered routes match first)
  await page.route('/api/**', route => route.fulfill({ status: 200, body: '{}' }))
  // Specific mock for history-info (registered last = matches first) to prevent AppPage rendering crash
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

/**
 * NavBar has desktop + mobile right-side link containers both in the DOM.
 * We scope right-side link queries to the visible container via data-testid.
 * Home link is in the shared <nav> element (not inside either testid div).
 *
 * On desktop (≥768px) we use [data-testid="navbar-desktop"],
 * on mobile (<768px)  we use [data-testid="navbar-mobile"].
 */
function navLinksScope(page: import('@playwright/test').Page, isMobile: boolean) {
  return page.locator(isMobile ? '[data-testid="navbar-mobile"]' : '[data-testid="navbar-desktop"]')
}

// ── AC-NAV-1: Desktop — home icon + nav links visible on all 5 pages ─────────
// Given: desktop viewport (1280×800)
// When:  user visits each of the 5 pages
// Then:  Home icon link (aria-label="Home") and right-side links (App, About, Diary, Logic) are visible

test.describe('AC-NAV-1 — Desktop NavBar present on all 5 pages', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  const pages = [
    { path: '/', name: 'HomePage' },
    { path: '/app', name: 'AppPage' },
    { path: '/about', name: 'AboutPage' },
    { path: '/diary', name: 'DiaryPage' },
    { path: '/business-logic', name: 'BusinessLogicPage' },
  ]

  for (const { path, name } of pages) {
    test(`${name} (${path}) — home icon and nav links visible`, async ({ page }) => {
      await mockApis(page)
      await page.goto(path)

      // Home link via aria-label
      await expect(page.getByRole('link', { name: 'Home', exact: true })).toBeVisible()

      const nav = navLinksScope(page, false)

      // Nav links
      await expect(nav.getByRole('link', { name: 'App', exact: true })).toBeVisible()
      await expect(nav.getByRole('link', { name: 'About', exact: true })).toBeVisible()
      await expect(nav.getByRole('link', { name: 'Diary', exact: true })).toBeVisible()
      // Logic link always visible with LockIcon
      await expect(nav.getByRole('link', { name: /Logic/ })).toBeVisible()
    })
  }
})

// ── AC-NAV-2: Mobile — home icon left, nav links right, no hamburger ─────────
// Given: mobile viewport (375×667)
// When:  user visits each of the 5 pages
// Then:  Home icon visible, App/About/Diary/Logic links visible, no hamburger

test.describe('AC-NAV-2 — Mobile NavBar on all 5 pages', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  const pages = [
    { path: '/', name: 'HomePage' },
    { path: '/app', name: 'AppPage' },
    { path: '/about', name: 'AboutPage' },
    { path: '/diary', name: 'DiaryPage' },
    { path: '/business-logic', name: 'BusinessLogicPage' },
  ]

  for (const { path, name } of pages) {
    test(`${name} (${path}) — home icon and nav links visible, no hamburger`, async ({ page }) => {
      await mockApis(page)
      await page.goto(path)

      // Home link via aria-label
      await expect(page.getByRole('link', { name: 'Home', exact: true })).toBeVisible()

      const nav = navLinksScope(page, true)

      // Nav links
      await expect(nav.getByRole('link', { name: 'App', exact: true })).toBeVisible()
      await expect(nav.getByRole('link', { name: 'About', exact: true })).toBeVisible()
      await expect(nav.getByRole('link', { name: 'Diary', exact: true })).toBeVisible()
      await expect(nav.getByRole('link', { name: /Logic/ })).toBeVisible()

      // No hamburger button inside nav
      const hamburger = page.locator('nav').getByRole('button', { name: /menu|hamburger/i })
      await expect(hamburger).toHaveCount(0)
    })
  }
})

// ── AC-NAV-3: Home icon links to / using SPA routing ─────────────────────────
// Given: user is on /about
// When:  user clicks Home icon link in NavBar
// Then:  URL becomes / without full page reload (SPA navigation)

test.describe('AC-NAV-3 — Home icon navigates to / (SPA) — desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('clicking home icon navigates to /', async ({ page }) => {
    await mockApis(page)
    await page.goto('/about')

    await page.getByRole('link', { name: 'Home', exact: true }).click()
    await expect(page).toHaveURL('/')
  })
})

test.describe('AC-NAV-3 — Home icon navigates to / (SPA) — mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('mobile home icon navigates to /', async ({ page }) => {
    await mockApis(page)
    await page.goto('/about')

    await page.getByRole('link', { name: 'Home', exact: true }).click()
    await expect(page).toHaveURL('/')
  })
})

// ── AC-NAV-4: Nav links navigate to correct routes (SPA) ─────────────────────
// Given: user is on /
// When:  user clicks each nav link
// Then:  URL changes to the correct route without full page reload

test.describe('AC-NAV-4 — Nav links navigate correctly (SPA)', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('App link navigates to /app', async ({ page }) => {
    await mockApis(page)
    await page.goto('/')
    const nav = navLinksScope(page, false)
    await nav.getByRole('link', { name: 'App', exact: true }).click()
    await expect(page).toHaveURL('/app')
  })

  test('About link navigates to /about', async ({ page }) => {
    await mockApis(page)
    await page.goto('/')
    const nav = navLinksScope(page, false)
    await nav.getByRole('link', { name: 'About', exact: true }).click()
    await expect(page).toHaveURL('/about')
  })

  test('Diary link navigates to /diary', async ({ page }) => {
    await mockApis(page)
    await page.goto('/')
    const nav = navLinksScope(page, false)
    await nav.getByRole('link', { name: 'Diary', exact: true }).click()
    await expect(page).toHaveURL('/diary')
  })

  test('Logic link navigates to /business-logic', async ({ page }) => {
    await mockApis(page)
    await page.goto('/')
    const nav = navLinksScope(page, false)
    await nav.getByRole('link', { name: /Logic/ }).click()
    await expect(page).toHaveURL('/business-logic')
  })
})

// ── AC-NAV-4: Active link highlighted — v2 color system ──────────────────────
// Given: user is on /about
// When:  page loads
// Then:  "About" link has text-[#9C4A3B] class (active), others text-[#1A1814]/60

test.describe('AC-NAV-4 — Active link highlighted #9C4A3B, others #1A1814/60', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('About link is active (#9C4A3B) on /about page', async ({ page }) => {
    await mockApis(page)
    await page.goto('/about')

    const nav = navLinksScope(page, false)
    await expect(nav.getByRole('link', { name: 'About', exact: true })).toHaveClass(/text-\[#9C4A3B\]/)
    await expect(nav.getByRole('link', { name: 'App', exact: true })).toHaveClass(/text-\[#1A1814\]/)
  })

  test('Diary link is active (#9C4A3B) on /diary page', async ({ page }) => {
    await mockApis(page)
    await page.goto('/diary')

    const nav = navLinksScope(page, false)
    await expect(nav.getByRole('link', { name: 'Diary', exact: true })).toHaveClass(/text-\[#9C4A3B\]/)
    await expect(nav.getByRole('link', { name: 'About', exact: true })).toHaveClass(/text-\[#1A1814\]/)
  })
})

// ── AC-NAV-4 (mobile): Active link highlighted — mobile viewport ─────────────

test.describe('AC-NAV-4 — Active link highlighted (mobile)', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('App link is active (#9C4A3B) on /app page (mobile)', async ({ page }) => {
    await mockApis(page)
    await page.goto('/app')

    const nav = navLinksScope(page, true)
    await expect(nav.getByRole('link', { name: 'App', exact: true })).toHaveClass(/text-\[#9C4A3B\]/)
    await expect(nav.getByRole('link', { name: 'About', exact: true })).toHaveClass(/text-\[#1A1814\]/)
  })

  test('About link is inactive (#1A1814/60) on / page (mobile)', async ({ page }) => {
    await mockApis(page)
    await page.goto('/')

    const nav = navLinksScope(page, true)
    await expect(nav.getByRole('link', { name: 'About', exact: true })).toHaveClass(/text-\[#1A1814\]/)
  })
})

// ── AC-NAV-6: Logic link always shows LockIcon, purple styling ───────────────
// Given: any page regardless of login state
// When:  user visits any page
// Then:  Logic link always shows with purple styling (LockIcon always visible)
// And:   no 🔒 emoji-based auth gate behavior

test.describe('AC-NAV-6 — Logic link always visible with LockIcon', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('Logic link shows with purple style regardless of login state', async ({ page }) => {
    await mockApis(page)
    await page.goto('/')

    // Ensure no valid token
    await page.evaluate(() => localStorage.removeItem('bl_token'))
    await page.reload()

    const nav = navLinksScope(page, false)
    const logicLink = nav.getByRole('link', { name: /Logic/ })
    await expect(logicLink).toBeVisible()
    await expect(logicLink).toHaveClass(/text-purple/)
  })

  test('Logic link still shows with purple style when logged in', async ({ page }) => {
    await mockApis(page)

    // Create a fake JWT with exp far in the future (year 2099)
    const futureExp = Math.floor(new Date('2099-01-01').getTime() / 1000)
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = btoa(JSON.stringify({ exp: futureExp }))
    const fakeToken = `${header}.${payload}.signature`

    await page.goto('/')
    await page.evaluate((token) => localStorage.setItem('bl_token', token), fakeToken)
    await page.reload()

    const nav = navLinksScope(page, false)
    const logicLink = nav.getByRole('link', { name: /Logic/ })
    await expect(logicLink).toBeVisible()
    await expect(logicLink).toHaveClass(/text-purple/)
  })
})
