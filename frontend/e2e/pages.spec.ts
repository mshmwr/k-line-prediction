import { test, expect } from '@playwright/test'

// ── AC-HOME-1 ────────────────────────────────────────────────────────────────
// Given: user visits /
// When:  page loads
// Then:  Hero, HOW IT WORKS, and Dev Diary sections each have corresponding headings

test.describe('HomePage — AC-HOME-1', () => {
  test('Hero, HOW IT WORKS, and Dev Diary headings visible', async ({ page }) => {
    await page.goto('/')

    // Hero heading
    await expect(page.getByRole('heading', { name: /Predict the Next Move/i })).toBeVisible()

    // HOW IT WORKS section label (inside the ProjectLogicSection SectionHeader)
    await expect(page.getByText('HOW IT WORKS')).toBeVisible()

    // Dev Diary section label
    await expect(page.getByText('DEV DIARY')).toBeVisible()
  })
})

// ── AC-ABOUT-1 ───────────────────────────────────────────────────────────────
// Given: user visits /about
// When:  page loads
// Then:  all 7 section labels are visible

test.describe('AboutPage — AC-ABOUT-1', () => {
  test('all 7 section labels visible', async ({ page }) => {
    await page.goto('/about')

    await expect(page.getByText('PROJECT OVERVIEW', { exact: true })).toBeVisible()
    await expect(page.getByText('AI COLLABORATION', { exact: true })).toBeVisible()
    await expect(page.getByText('CONTRIBUTIONS', { exact: true })).toBeVisible()
    await expect(page.getByText('TECH DECISIONS', { exact: true })).toBeVisible()
    await expect(page.getByText('SCREENSHOTS', { exact: true })).toBeVisible()
    await expect(page.getByText('TECH STACK', { exact: true })).toBeVisible()
    await expect(page.getByText('FEATURES', { exact: true })).toBeVisible()

    // PRD: "← Home" button navigates to /
    await expect(page.getByRole('link', { name: '← Home' })).toBeVisible()
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
