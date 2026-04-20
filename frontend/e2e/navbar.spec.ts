import { test, expect } from '@playwright/test'
import { mockApis } from './_fixtures/mock-apis.ts'

// ── Shared setup helpers ─────────────────────────────────────────────────────
//
// `mockApis` 從 `_fixtures/mock-apis.ts` 匯入。LIFO ordering invariant 內建。
// Test 若需加具體 route（e.g. /api/auth）必須於 mockApis() **之後**註冊，
// 否則 catch-all 會攔截具體 route。詳見 _fixtures/mock-apis.ts JSDoc。

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
// Then:  Home icon link (aria-label="Home") and right-side links (App, Diary, About) are visible
// And:   Prediction link is NOT in DOM (hidden per K-021 AC-021-NAVBAR)

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

      // Nav links (K-021 order: App / Diary / About — Prediction hidden)
      await expect(nav.getByRole('link', { name: 'App', exact: true })).toBeVisible()
      await expect(nav.getByRole('link', { name: 'Diary', exact: true })).toBeVisible()
      await expect(nav.getByRole('link', { name: 'About', exact: true })).toBeVisible()

      // Prediction link MUST NOT render (AC-021-NAVBAR hidden)
      await expect(page.getByRole('link', { name: 'Prediction', exact: true })).toHaveCount(0)
    })
  }
})

// ── AC-NAV-2: Mobile — home icon left, nav links right, no hamburger ─────────
// Given: mobile viewport (375×667)
// When:  user visits each of the 5 pages
// Then:  Home icon visible, App/Diary/About links visible, no hamburger
// And:   Prediction link NOT in DOM

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

      // Nav links (K-021 order: App / Diary / About)
      await expect(nav.getByRole('link', { name: 'App', exact: true })).toBeVisible()
      await expect(nav.getByRole('link', { name: 'Diary', exact: true })).toBeVisible()
      await expect(nav.getByRole('link', { name: 'About', exact: true })).toBeVisible()

      // Prediction link MUST NOT render
      await expect(page.getByRole('link', { name: 'Prediction', exact: true })).toHaveCount(0)

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
//
// 註：K-021 移除 Logic link（Prediction hidden），故刪除原 Logic navigate 子 case。

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
})

// ── AC-NAV-4: Active link highlighted — v2 color system ──────────────────────
// Given: user is on /about
// When:  page loads
// Then:  "About" link has text-[#9C4A3B] class (active), others text-[#1A1814]/60
//
// 註：既有 8 處 text-\[#9C4A3B\] 斷言維持（編譯後 CSS 與 text-brick-dark 等價，
// PM 2026-04-20 Q2 裁決）。

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

// ── AC-021-NAVBAR: active state per route via aria-current ───────────────────
// Given: user visits each of 4 routes with aria-current support
// When:  page loads
// Then:  the corresponding NavBar link has aria-current="page"
// 4 個獨立 test case（PM 量化規則）

test.describe('AC-021-NAVBAR — active state per route', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('on / — Home link has aria-current=page', async ({ page }) => {
    await mockApis(page)
    await page.goto('/')
    const homeLink = page.getByRole('link', { name: 'Home', exact: true })
    await expect(homeLink).toHaveAttribute('aria-current', 'page')
  })

  test('on /app — App link has aria-current=page', async ({ page }) => {
    await mockApis(page)
    await page.goto('/app')
    const nav = navLinksScope(page, false)
    const appLink = nav.getByRole('link', { name: 'App', exact: true })
    await expect(appLink).toHaveAttribute('aria-current', 'page')
    await expect(appLink).toHaveClass(/text-\[#9C4A3B\]/)
  })

  test('on /diary — Diary link has aria-current=page', async ({ page }) => {
    await mockApis(page)
    await page.goto('/diary')
    const nav = navLinksScope(page, false)
    const diaryLink = nav.getByRole('link', { name: 'Diary', exact: true })
    await expect(diaryLink).toHaveAttribute('aria-current', 'page')
  })

  test('on /about — About link has aria-current=page', async ({ page }) => {
    await mockApis(page)
    await page.goto('/about')
    const nav = navLinksScope(page, false)
    const aboutLink = nav.getByRole('link', { name: 'About', exact: true })
    await expect(aboutLink).toHaveAttribute('aria-current', 'page')
  })
})

// ── AC-021-NAVBAR: Prediction hidden ─────────────────────────────────────────
// Given: user visits any route
// When:  page loads
// Then:  Prediction link is NOT rendered at all (not just CSS-hidden)

test.describe('AC-021-NAVBAR — Prediction hidden from DOM', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('Prediction link not rendered on / (desktop)', async ({ page }) => {
    await mockApis(page)
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Prediction', exact: true })).toHaveCount(0)
  })

  test('Prediction link not rendered on /business-logic (desktop)', async ({ page }) => {
    await mockApis(page)
    await page.goto('/business-logic')
    await expect(page.getByRole('link', { name: 'Prediction', exact: true })).toHaveCount(0)
  })
})
