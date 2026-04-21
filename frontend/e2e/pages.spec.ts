import { test, expect } from '@playwright/test'

// ── AC-HOME-1 ────────────────────────────────────────────────────────────────
// Given: user visits /
// When:  page loads
// Then:  Hero, HOW IT WORKS, and Dev Diary sections each have corresponding headings

test.describe('HomePage — AC-HOME-1', () => {
  test('Hero, HOW IT WORKS, and Dev Diary headings visible', async ({ page }) => {
    await page.goto('/')

    // Hero heading (v2: two separate h1 elements)
    await expect(page.getByRole('heading', { name: 'Predict the next move', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'before it happens —', exact: true })).toBeVisible()

    // HOW IT WORKS section label (inside the ProjectLogicSection logicHead)
    await expect(page.getByText('HOW IT WORKS', { exact: true })).toBeVisible()

    // Dev Diary section label
    await expect(page.getByText('DEV DIARY')).toBeVisible()
  })
})

// ── AC-ABOUT-1 ───────────────────────────────────────────────────────────────
// Given: user visits /about
// When:  page loads (K-017 redesign)
// Then:  key K-017 section content is visible

test.describe('AboutPage — AC-ABOUT-1 (K-017)', () => {
  test('PageHeader one-operator declaration visible', async ({ page }) => {
    await page.goto('/about')

    // S1 — PageHeaderSection: hero heading text
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText('One operator, orchestrating AI agents end-to-end —')).toBeVisible()
    await expect(page.getByText('Every feature ships with a doc trail.')).toBeVisible()

    // NavBar home icon still present
    await expect(page.getByRole('link', { name: 'Home', exact: true })).toBeVisible()
  })

  test('Metrics strip four cards visible', async ({ page }) => {
    await page.goto('/about')

    await expect(page.getByText('Features Shipped', { exact: true })).toBeVisible()
    await expect(page.getByText('First-pass Review Rate', { exact: true })).toBeVisible()
    await expect(page.getByText('Post-mortems Written', { exact: true })).toBeVisible()
    await expect(page.getByText('Guardrails in Place', { exact: true })).toBeVisible()
  })

  test('Role Cards section visible with 6 roles', async ({ page }) => {
    await page.goto('/about')

    await expect(page.getByText('PM', { exact: true })).toBeVisible()
    await expect(page.getByText('Architect', { exact: true })).toBeVisible()
    await expect(page.getByText('Engineer', { exact: true })).toBeVisible()
    await expect(page.getByText('Reviewer', { exact: true })).toBeVisible()
    await expect(page.getByText('QA', { exact: true })).toBeVisible()
    await expect(page.getByText('Designer', { exact: true })).toBeVisible()
  })

  test('How AI Stays Reliable three pillars visible', async ({ page }) => {
    await page.goto('/about')

    await expect(page.getByText('How AI Stays Reliable', { exact: true })).toBeVisible()
    await expect(page.getByText('Persistent Memory', { exact: true })).toBeVisible()
    await expect(page.getByText('Structured Reflection', { exact: true })).toBeVisible()
    await expect(page.getByText('Role Agents', { exact: true })).toBeVisible()
  })

  test('Footer CTA visible on /about', async ({ page }) => {
    await page.goto('/about')

    await expect(page.getByText("Let's talk →", { exact: true })).toBeVisible()
  })
})

// ── AC-DIARY-1 ───────────────────────────────────────────────────────────────
// Given: user visits /diary
// When: diary.json loads successfully
// Then: milestone titles are visible; first milestone is expanded (defaultOpen); clicking a closed milestone expands it

test.describe('DiaryPage — AC-DIARY-1', () => {
  test('milestone titles visible and first milestone expanded by default', async ({ page }) => {
    await page.goto('/diary')

    // First milestone title visible
    const firstMilestone = page.getByRole('button').first()
    await expect(firstMilestone).toBeVisible()

    // First milestone is expanded (aria-expanded=true)
    await expect(firstMilestone).toHaveAttribute('aria-expanded', 'true')

    // At least one diary entry text visible (first milestone open)
    const entries = page.locator('.px-4.pb-4 p')
    await expect(entries.first()).toBeVisible()
  })

  test('clicking a closed milestone expands it', async ({ page }) => {
    await page.goto('/diary')

    // Second milestone starts closed
    const buttons = page.getByRole('button')
    const secondBtn = buttons.nth(1)
    await expect(secondBtn).toHaveAttribute('aria-expanded', 'false')

    // Click to open
    await secondBtn.click()
    await expect(secondBtn).toHaveAttribute('aria-expanded', 'true')
  })

  test('clicking an open milestone collapses it', async ({ page }) => {
    await page.goto('/diary')

    const firstBtn = page.getByRole('button').first()
    await expect(firstBtn).toHaveAttribute('aria-expanded', 'true')

    await firstBtn.click()
    await expect(firstBtn).toHaveAttribute('aria-expanded', 'false')
  })
})

// ── AC-017-HOME-V2 ───────────────────────────────────────────────────────────
// Given: user visits /
// When:  page loads (K-017 Homepage v2)
// Then:  HeroSection v2 and ProjectLogicSection v2 content is visible

test.describe('HomePage — AC-017-HOME-V2', () => {
  test('HeroSection v2: headings and CTA visible', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('Predict the next move', { exact: true })).toBeVisible()
    await expect(page.getByText('before it happens —', { exact: true })).toBeVisible()
    await expect(page.getByText('Try the App →', { exact: true })).toBeVisible()
  })

  test('ProjectLogicSection v2: HOW IT WORKS label and three steps visible', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('HOW IT WORKS', { exact: true })).toBeVisible()
    await expect(page.getByText('STEP 01 · INGEST', { exact: true })).toBeVisible()
    await expect(page.getByText('STEP 02 · MATCH', { exact: true })).toBeVisible()
    await expect(page.getByText('STEP 03 · PROJECT', { exact: true })).toBeVisible()
  })

  test('ProjectLogicSection v2: techRow STACK label visible', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('STACK —', { exact: true })).toBeVisible()
  })
})

// ── AC-017-FOOTER (diary no-footer) ─────────────────────────────────────────
// Given: user visits /diary
// When:  page loads
// Then:  NO FooterCtaSection and NO HomeFooterBar rendered

test.describe('DiaryPage — AC-017-FOOTER no footer', () => {
  test('diary page has no FooterCtaSection and no HomeFooterBar', async ({ page }) => {
    await page.goto('/diary')

    await expect(page.getByText("Let's talk →", { exact: true })).toHaveCount(0)
    await expect(page.getByText('yichen.lee.20@gmail.com', { exact: true })).toHaveCount(0)
  })
})

// ── AC-023-DIARY-BULLET ──────────────────────────────────────────────────────
// Given: user visits /
// When:  page scrolled to Diary section (hpDiary)
// Then:  each DiaryTimelineEntry marker is rectangular (no border-radius),
//        20×14px, backgroundColor rgb(156, 74, 59)

test.describe('HomePage — AC-023-DIARY-BULLET', () => {
  test('diary markers have correct width (20px) and height (14px)', async ({ page }) => {
    await page.goto('/')

    const markers = page.locator('[data-testid="diary-marker"]')
    // At least 3 markers must exist (AC requirement)
    const count = await markers.count()
    expect(count).toBeGreaterThanOrEqual(3)

    const firstMarker = markers.first()
    const box = await firstMarker.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBe(20)
    expect(box!.height).toBe(14)
  })

  test('diary markers have backgroundColor rgb(156, 74, 59) = brick-dark', async ({ page }) => {
    await page.goto('/')

    const markers = page.locator('[data-testid="diary-marker"]')
    const count = await markers.count()
    expect(count).toBeGreaterThanOrEqual(3)

    for (let i = 0; i < Math.min(count, 3); i++) {
      const marker = markers.nth(i)
      const bg = await marker.evaluate(el => getComputedStyle(el).backgroundColor)
      expect(bg).toBe('rgb(156, 74, 59)')
    }
  })

  test('diary markers have borderRadius 0px (rectangular, not rounded)', async ({ page }) => {
    await page.goto('/')

    const markers = page.locator('[data-testid="diary-marker"]')
    const count = await markers.count()
    expect(count).toBeGreaterThanOrEqual(3)

    for (let i = 0; i < Math.min(count, 3); i++) {
      const marker = markers.nth(i)
      const radius = await marker.evaluate(el => getComputedStyle(el).borderRadius)
      expect(radius).toBe('0px')
    }
  })
})

// ── AC-023-STEP-HEADER-BAR ──────────────────────────────────────────────────
// Given: user visits /
// When:  page loaded to hpLogic section
// Then:  each STEP card has a header bar with correct bg, white text, Geist Mono 10px
// Note:  3 independent test cases per AC (PM quantification rule — not merged)

test.describe('HomePage — AC-023-STEP-HEADER-BAR (STEP 01 · INGEST)', () => {
  test('STEP 01 header bar: bg charcoal, paper text, Geist Mono 10px', async ({ page }) => {
    await page.goto('/')

    const headerBar = page.locator('[data-testid="step-header-bar"]', { hasText: 'STEP 01 · INGEST' })
    await expect(headerBar).toBeVisible()

    const bg = await headerBar.evaluate(el => getComputedStyle(el).backgroundColor)
    expect(bg).toBe('rgb(42, 37, 32)')

    const span = headerBar.locator('span')
    const color = await span.evaluate(el => getComputedStyle(el).color)
    // text-paper = #F4EFE5 = rgb(244, 239, 229); AC corrected from pure white to paper token (PM ruling 2026-04-21)
    expect(color).toBe('rgb(244, 239, 229)')

    const fontSize = await span.evaluate(el => getComputedStyle(el).fontSize)
    expect(fontSize).toBe('10px')

    const fontFamily = await span.evaluate(el => getComputedStyle(el).fontFamily)
    expect(fontFamily).toContain('Geist Mono')
  })
})

test.describe('HomePage — AC-023-STEP-HEADER-BAR (STEP 02 · MATCH)', () => {
  test('STEP 02 header bar: bg charcoal, paper text, Geist Mono 10px', async ({ page }) => {
    await page.goto('/')

    const headerBar = page.locator('[data-testid="step-header-bar"]', { hasText: 'STEP 02 · MATCH' })
    await expect(headerBar).toBeVisible()

    const bg = await headerBar.evaluate(el => getComputedStyle(el).backgroundColor)
    expect(bg).toBe('rgb(42, 37, 32)')

    const span = headerBar.locator('span')
    const color = await span.evaluate(el => getComputedStyle(el).color)
    // text-paper = #F4EFE5 = rgb(244, 239, 229); AC corrected from pure white to paper token (PM ruling 2026-04-21)
    expect(color).toBe('rgb(244, 239, 229)')

    const fontSize = await span.evaluate(el => getComputedStyle(el).fontSize)
    expect(fontSize).toBe('10px')

    const fontFamily = await span.evaluate(el => getComputedStyle(el).fontFamily)
    expect(fontFamily).toContain('Geist Mono')
  })
})

test.describe('HomePage — AC-023-STEP-HEADER-BAR (STEP 03 · PROJECT)', () => {
  test('STEP 03 header bar: bg charcoal, paper text, Geist Mono 10px', async ({ page }) => {
    await page.goto('/')

    const headerBar = page.locator('[data-testid="step-header-bar"]', { hasText: 'STEP 03 · PROJECT' })
    await expect(headerBar).toBeVisible()

    const bg = await headerBar.evaluate(el => getComputedStyle(el).backgroundColor)
    expect(bg).toBe('rgb(42, 37, 32)')

    const span = headerBar.locator('span')
    const color = await span.evaluate(el => getComputedStyle(el).color)
    // text-paper = #F4EFE5 = rgb(244, 239, 229); AC corrected from pure white to paper token (PM ruling 2026-04-21)
    expect(color).toBe('rgb(244, 239, 229)')

    const fontSize = await span.evaluate(el => getComputedStyle(el).fontSize)
    expect(fontSize).toBe('10px')

    const fontFamily = await span.evaluate(el => getComputedStyle(el).fontFamily)
    expect(fontFamily).toContain('Geist Mono')
  })
})

// ── AC-023-BODY-PADDING ──────────────────────────────────────────────────────
// Given: user visits /
// When:  page loads on desktop (>= 640px)
// Then:  homepage-root container padding = 72px top, 96px right, 96px bottom, 96px left
//
// Given: viewport width < 640px (mobile)
// When:  page loads
// Then:  padding = 32px top/bottom, 24px left/right

test.describe('HomePage — AC-023-BODY-PADDING', () => {
  test('desktop padding: paddingTop=72px, paddingRight=96px, paddingBottom=96px, paddingLeft=96px', async ({ page }) => {
    // Default Playwright viewport is 1280×720 (desktop)
    await page.goto('/')

    const root = page.locator('[data-testid="homepage-root"]')
    await expect(root).toBeVisible()

    const padding = await root.evaluate(el => {
      const s = getComputedStyle(el)
      return {
        top: s.paddingTop,
        right: s.paddingRight,
        bottom: s.paddingBottom,
        left: s.paddingLeft,
      }
    })

    expect(padding.top).toBe('72px')
    expect(padding.right).toBe('96px')
    expect(padding.bottom).toBe('96px')
    expect(padding.left).toBe('96px')
  })

  test('mobile padding (375px viewport): paddingTop=32px, paddingBottom=32px, paddingLeft=24px, paddingRight=24px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    const root = page.locator('[data-testid="homepage-root"]')
    await expect(root).toBeVisible()

    const padding = await root.evaluate(el => {
      const s = getComputedStyle(el)
      return {
        top: s.paddingTop,
        right: s.paddingRight,
        bottom: s.paddingBottom,
        left: s.paddingLeft,
      }
    })

    expect(padding.top).toBe('32px')
    expect(padding.bottom).toBe('32px')
    expect(padding.left).toBe('24px')
    expect(padding.right).toBe('24px')
  })
})

// ── AC-023-REGRESSION ───────────────────────────────────────────────────────
// Regression guards: confirm K-017 existing structure still holds after K-023 changes.
// Running the full suite (npx playwright test) covers AC-017-HOME-V2 and AC-HOME-1 directly.
// This block adds explicit K-023 structural guards: Banner DOM-order + layout integrity.

test.describe('HomePage — AC-023-REGRESSION', () => {
  test('BuiltByAIBanner still renders between NavBar and Hero (K-017 regression)', async ({ page }) => {
    await page.goto('/')

    // Banner renders (actual text: "One operator. Six AI agents. Every ticket leaves a doc trail.")
    await expect(page.getByText('One operator. Six AI agents.', { exact: false })).toBeVisible()

    // Hero heading still exists
    await expect(page.getByText('Predict the next move', { exact: true })).toBeVisible()

    // DEV DIARY section still renders
    await expect(page.getByText('DEV DIARY')).toBeVisible()

    // DOM-order guard: Banner must appear before HeroSection in document order
    // (AC-023-REGRESSION: "BuiltByAIBanner position NavBar下方、Hero上方 not changed")
    const bannerBeforeHero = await page.evaluate(() => {
      const banner = document.querySelector('[data-testid="built-by-ai-banner"]')
      // Locate hero heading as a proxy for HeroSection root
      const heroHeading = Array.from(document.querySelectorAll('h1')).find(
        el => el.textContent?.includes('Predict the next move')
      )
      if (!banner || !heroHeading) return false
      // DOCUMENT_POSITION_FOLLOWING = 4: heroHeading follows banner => banner is before hero
      return !!(banner.compareDocumentPosition(heroHeading) & Node.DOCUMENT_POSITION_FOLLOWING)
    })
    expect(bannerBeforeHero).toBe(true)
  })

  test('DiaryTimelineEntry layout not broken — markers exist and diary link visible', async ({ page }) => {
    await page.goto('/')

    // At least one marker rendered (diary data loaded)
    const markers = page.locator('[data-testid="diary-marker"]')
    await expect(markers.first()).toBeVisible()

    // View full log link still present
    await expect(page.getByText('— View full log →', { exact: true })).toBeVisible()
  })
})
