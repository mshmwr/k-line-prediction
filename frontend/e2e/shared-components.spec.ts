import { test, expect } from '@playwright/test'
import { mockApis } from './_fixtures/mock-apis.ts'

// ── AC-035-CROSS-PAGE-SPEC — Footer cross-route DOM-equivalence ────────────
// Given: Footer variant="home" rendered on `/`
//        Footer variant="about" rendered on `/about`
// When:  Playwright visits each route
// Then:  per-variant outerHTML equivalent (modulo dynamic attrs like React id)
// And:   removing Footer from any consuming route causes this spec to fail
//        (negative fail-if-gate-removed dry-run — see design doc §7.2)
// Note:  `/business-logic` also uses variant="home" (technical-cleanup-only swap
//        per §3 Step 3); NOT asserted here because /business-logic page content
//        is deferred to K-018 per K-017 PM decision. Existing sitewide-footer.spec.ts
//        coverage for /business-logic pre-dates K-035 and remains unchanged.

test.describe('AC-035-CROSS-PAGE-SPEC — Footer variant="home" DOM-equivalence', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  const homeRoutes = ['/']  // `/business-logic` intentionally excluded — see note above

  for (const route of homeRoutes) {
    test(`${route} — Footer variant="home" structural match`, async ({ page }) => {
      await mockApis(page)
      await page.goto(route)

      const footer = page.locator('footer').last()  // last footer element on page
      await expect(footer).toBeVisible()

      // class-string equality (exact)
      const classAttr = await footer.getAttribute('class')
      expect(classAttr).toBe('font-mono text-[11px] tracking-[1px] text-muted px-6 md:px-[72px] py-5 border-t border-ink w-full')

      // contact info row
      await expect(footer.getByText('yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn', { exact: true })).toBeVisible()

      // GA disclosure
      await expect(footer.getByText('This site uses Google Analytics to collect anonymous usage data.', { exact: true })).toBeVisible()
    })
  }
})

test.describe('AC-035-CROSS-PAGE-SPEC — Footer variant="about" DOM structure', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('/about — Footer variant="about" structural match', async ({ page }) => {
    await mockApis(page)
    await page.goto('/about')

    await expect(page.getByText("Let's talk →", { exact: true })).toBeVisible()

    const emailLink = page.locator('[data-testid="cta-email"]')
    await expect(emailLink).toHaveAttribute('href', 'mailto:yichen.lee.20@gmail.com')

    const githubLink = page.locator('[data-testid="cta-github"]')
    await expect(githubLink).toHaveAttribute('href', 'https://github.com/mshmwr/k-line-prediction')
    await expect(githubLink).toHaveAttribute('target', '_blank')
    await expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer')

    const linkedinLink = page.locator('[data-testid="cta-linkedin"]')
    await expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com/in/yichenlee-career')
    await expect(linkedinLink).toHaveAttribute('target', '_blank')
    await expect(linkedinLink).toHaveAttribute('rel', 'noopener noreferrer')

    // GA disclosure
    await expect(page.getByText('This site uses Google Analytics to collect anonymous usage data.', { exact: true })).toBeVisible()

    // A-7 link style Sacred (K-022)
    const emailStyle = await emailLink.evaluate(el => getComputedStyle(el).fontStyle)
    expect(emailStyle).toBe('italic')
    const emailDeco = await emailLink.evaluate(el => getComputedStyle(el).textDecorationLine)
    expect(emailDeco).toContain('underline')
  })
})

test.describe('AC-035-CROSS-PAGE-SPEC — no-Footer routes preserve intentional absence', () => {
  test('/diary has no Footer rendered', async ({ page }) => {
    await mockApis(page)
    await page.goto('/diary')
    await expect(page.getByText("Let's talk →", { exact: true })).toHaveCount(0)
    await expect(page.getByText('yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn', { exact: true })).toHaveCount(0)
  })

  // /app no-footer preserved by existing app-bg-isolation.spec.ts AC-030-NO-FOOTER
  // (no duplicate assertion here — single source of truth).
})
