import { test, expect } from '@playwright/test'
import { mockApis } from './_fixtures/mock-apis.ts'

// ── K-030 — /app page isolation ──────────────────────────────────────────────
// 6 個獨立 test case：
//   T1  AC-030-NEW-TAB       clicking NavBar App link on / opens new tab with /app URL
//   T2  AC-030-NO-NAVBAR     navbar testids absent on /app
//   T3  AC-030-NO-FOOTER     Footer absent on /app (role + 2 signature texts)
//   T4  AC-030-BG-COLOR (a)  /app wrapper <div> bg = rgb(3, 7, 18) (gray-950 = Pencil #030712)
//   T5  AC-030-BG-COLOR (b)  /app body bg still = rgb(244, 239, 229) (paper) — proving wrapper override
//   T6  AC-030-NEW-TAB       Homepage Hero CTA opens /app in new tab (C-1 fix)
//
// AC-030-PENCIL-ALIGN 由 T2/T3/T4 合力保證（值 rgb(3, 7, 18) = #030712 = Pencil v1 ap001.fill）。
//
// LIFO ordering invariant 由 _fixtures/mock-apis.ts 內建。

test.describe('AC-030-NEW-TAB — App link opens /app in new tab', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('clicking App link on / opens new tab with /app URL', async ({ page, context }) => {
    await mockApis(page)
    await page.goto('/')

    const appLink = page
      .locator('[data-testid="navbar-desktop"]')
      .getByRole('link', { name: 'App', exact: true })

    // Assert attributes on the App link before click
    await expect(appLink).toHaveAttribute('target', '_blank')
    await expect(appLink).toHaveAttribute('rel', /noopener/)
    await expect(appLink).toHaveAttribute('rel', /noreferrer/)

    // Register waitForEvent + click in parallel (Promise.all — design doc §6.2.1)
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      appLink.click(),
    ])
    await newPage.waitForLoadState()

    // new tab → /app
    expect(newPage.url()).toContain('/app')
    // original tab URL unchanged
    expect(page.url()).toMatch(/\/$/)
  })
})

test.describe('AC-030-NO-NAVBAR — /app page has no UnifiedNavBar', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('navbar testids absent on /app; tool content visible', async ({ page }) => {
    await mockApis(page)
    await page.goto('/app')
    await page.waitForLoadState('networkidle')

    // Both desktop + mobile testids must be absent (UnifiedNavBar unrendered)
    await expect(page.locator('[data-testid="navbar-desktop"]')).toHaveCount(0)
    await expect(page.locator('[data-testid="navbar-mobile"]')).toHaveCount(0)

    // Marketing nav link names must not appear on /app
    await expect(page.getByRole('link', { name: 'Home', exact: true })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Diary', exact: true })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'About', exact: true })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'App', exact: true })).toHaveCount(0)

    // TopBar tool chrome still renders: `Loaded rows:` label (TopBar.tsx)
    await expect(page.getByText('Loaded rows:')).toBeVisible()
  })
})

test.describe('AC-030-NO-FOOTER — /app page has no Footer', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('Footer absent on /app (role + signature texts)', async ({ page }) => {
    await mockApis(page)
    await page.goto('/app')
    await page.waitForLoadState('networkidle')

    // semantic <footer> landmark must be absent
    await expect(page.getByRole('contentinfo')).toHaveCount(0)

    // signature contact text
    await expect(
      page.getByText('yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn', { exact: true }),
    ).toHaveCount(0)
    // GA disclosure text
    await expect(
      page.getByText('This site uses Google Analytics to collect anonymous usage data.', { exact: true }),
    ).toHaveCount(0)
  })
})

test.describe('AC-030-BG-COLOR — /app wrapper overrides body paper with gray-950', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('wrapper <div> bg = rgb(3, 7, 18) (Pencil v1 ap001 #030712 / tailwind gray-950)', async ({ page }) => {
    await mockApis(page)
    await page.goto('/app')
    await page.waitForLoadState('networkidle')

    // Target: AppPage.tsx root wrapper — bg-gray-950 (K-057 Phase 1 added DisclaimerBanner
    // as first root child, so ':scope > div' returns wrong element; use class selector).
    const wrapperBg = await page.evaluate(() => {
      const appWrapper = document.querySelector('#root div.bg-gray-950')
      if (!appWrapper) return null
      return getComputedStyle(appWrapper as Element).backgroundColor
    })

    expect(wrapperBg).toBe('rgb(3, 7, 18)')
    expect(wrapperBg).not.toBe('rgb(244, 239, 229)')
  })

  test('body element still has paper bg (body @layer base unchanged — wrapper-only override strategy)', async ({ page }) => {
    await mockApis(page)
    await page.goto('/app')
    await page.waitForLoadState('networkidle')

    // body layer paper rule must survive this ticket — only the wrapper covers it visually
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(244, 239, 229)')
  })
})

test.describe('AC-030-NEW-TAB — Homepage Hero CTA opens /app in new tab', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('Homepage Hero CTA opens /app in new tab', async ({ page, context }) => {
    await mockApis(page)
    await page.goto('/')

    // Hero CTA button: "Run the ETH/USDT Demo →" — Phase 1 renamed from "Try the App →"
    const heroCta = page.locator('[data-testid="hero-cta-run-demo"]')

    // Assert attributes on the Hero CTA before click
    await expect(heroCta).toHaveAttribute('target', '_blank')
    await expect(heroCta).toHaveAttribute('rel', /noopener/)
    await expect(heroCta).toHaveAttribute('rel', /noreferrer/)

    // Register waitForEvent + click in parallel (design doc §6.2.1 pattern)
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      heroCta.click(),
    ])
    await newPage.waitForLoadState()

    // new tab → /app
    expect(newPage.url()).toContain('/app')
    // original tab URL unchanged (still on Homepage)
    expect(page.url()).toMatch(/\/$/)
  })
})
