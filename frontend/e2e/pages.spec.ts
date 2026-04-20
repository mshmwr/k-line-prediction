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
