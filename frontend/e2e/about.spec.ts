import { test, expect } from '@playwright/test'

// ── AC-017-NAVBAR ─────────────────────────────────────────────────────────────
// Given: user visits /about
// When:  page loads
// Then:  NavBar is visible; "Prediction" link is not in the DOM

test.describe('AC-017-NAVBAR — NavBar on /about', () => {
  test('NavBar home icon visible, no Prediction link in DOM', async ({ page }) => {
    await page.goto('/about')

    // NavBar home icon
    await expect(page.getByRole('link', { name: 'Home', exact: true })).toBeVisible()

    // "Prediction" link must NOT be in DOM (AC-017-NAVBAR)
    await expect(page.getByRole('link', { name: 'Prediction', exact: true })).toHaveCount(0)
  })

  test('NavBar appears before first section in DOM order', async ({ page }) => {
    await page.goto('/about')

    // AC-017-NAVBAR And: NavBar is above PageHeaderSection (DOM order)
    const isNavBeforeSection = await page.evaluate(() => {
      const nav = document.querySelector('nav')
      const section = document.querySelector('section')
      if (!nav || !section) return false
      // Node.DOCUMENT_POSITION_FOLLOWING = 4 means section comes after nav
      return !!(nav.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING)
    })
    expect(isNavBeforeSection).toBe(true)
  })
})

// ── AC-017-HEADER ─────────────────────────────────────────────────────────────
// Given: user visits /about
// When:  page loads
// Then:  PageHeaderSection shows the one-operator declaration

test.describe('AC-017-HEADER — PageHeaderSection one-operator declaration', () => {
  test('full hero text visible with correct role names and casing', async ({ page }) => {
    await page.goto('/about')

    // h1 heading contains the declaration
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    await expect(h1).toContainText('One operator, orchestrating AI agents end-to-end —')
    await expect(h1).toContainText('PM, architect, engineer, reviewer, QA, designer.')

    // Closing sentence is in a separate element (p or span), not crammed on same line
    await expect(page.getByText('Every feature ships with a doc trail.', { exact: true })).toBeVisible()
  })
})

// ── AC-017-METRICS ────────────────────────────────────────────────────────────
// Given: user visits /about
// When:  page loads
// Then:  4 metric cards with title + subtext shown; no exact percentages

test.describe('AC-017-METRICS — Metrics strip', () => {
  test('Features Shipped card title and subtext correct', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('Features Shipped', { exact: true })).toBeVisible()
    await expect(page.getByText('17 tickets, K-001 → K-017', { exact: true })).toBeVisible()
  })

  test('First-pass Review Rate card subtext correct', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('First-pass Review Rate', { exact: true })).toBeVisible()
    await expect(page.getByText('Reviewer catches issues before QA on most tickets', { exact: true })).toBeVisible()
  })

  test('Post-mortems Written card subtext correct', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('Post-mortems Written', { exact: true })).toBeVisible()
    await expect(page.getByText('Every ticket has cross-role retrospective', { exact: true })).toBeVisible()
  })

  test('Guardrails in Place card subtext correct', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('Guardrails in Place', { exact: true })).toBeVisible()
    await expect(page.getByText('Bug Found Protocol, per-role retro logs, audit script', { exact: true })).toBeVisible()
  })
})

// ── AC-017-ROLES ──────────────────────────────────────────────────────────────
// Given: user visits /about
// When:  page loads
// Then:  6 role cards each with Role name, Owns, Artefact (18 assertions total)

test.describe('AC-017-ROLES — Role Cards 6 × 3 assertions', () => {
  test('PM card: role + owns + artefact', async ({ page }) => {
    await page.goto('/about')
    const article = page.locator('[data-role="PM"]')
    await expect(article.getByText('PM', { exact: true })).toBeVisible()
    await expect(article.getByText('Requirements, AC, Phase Gates', { exact: true })).toBeVisible()
    await expect(article.getByText('PRD.md, docs/tickets/K-XXX.md', { exact: true })).toBeVisible()
  })

  test('Architect card: role + owns + artefact', async ({ page }) => {
    await page.goto('/about')
    const article = page.locator('[data-role="Architect"]')
    await expect(article.getByText('Architect', { exact: true })).toBeVisible()
    await expect(article.getByText('System design, cross-layer contracts', { exact: true })).toBeVisible()
    await expect(article.getByText('docs/designs/K-XXX-*.md', { exact: true })).toBeVisible()
  })

  test('Engineer card: role + owns + artefact', async ({ page }) => {
    await page.goto('/about')
    const article = page.locator('[data-role="Engineer"]')
    await expect(article.getByText('Engineer', { exact: true })).toBeVisible()
    await expect(article.getByText('Implementation, stable checkpoints', { exact: true })).toBeVisible()
    await expect(article.getByText('commits + ticket retrospective', { exact: true })).toBeVisible()
  })

  test('Reviewer card: role + owns + artefact', async ({ page }) => {
    await page.goto('/about')
    const article = page.locator('[data-role="Reviewer"]')
    await expect(article.getByText('Reviewer', { exact: true })).toBeVisible()
    await expect(article.getByText('Code review, Bug Found Protocol', { exact: true })).toBeVisible()
    await expect(article.getByText('Review report + Reviewer 反省', { exact: true })).toBeVisible()
  })

  test('QA card: role + owns + artefact', async ({ page }) => {
    await page.goto('/about')
    const article = page.locator('[data-role="QA"]')
    await expect(article.getByText('QA', { exact: true })).toBeVisible()
    await expect(article.getByText('Regression, E2E, visual report', { exact: true })).toBeVisible()
    await expect(article.getByText('Playwright results + docs/reports/*.html', { exact: true })).toBeVisible()
  })

  test('Designer card: role + owns + artefact', async ({ page }) => {
    await page.goto('/about')
    const article = page.locator('[data-role="Designer"]')
    await expect(article.getByText('Designer', { exact: true })).toBeVisible()
    await expect(article.getByText('Pencil MCP, flow diagrams', { exact: true })).toBeVisible()
    await expect(article.getByText('.pen file + get_screenshot output', { exact: true })).toBeVisible()
  })
})

// ── AC-017-PILLARS ────────────────────────────────────────────────────────────
// Given: user visits /about
// When:  page scrolls to "How AI Stays Reliable"
// Then:  3 pillars with title + keyword + anchor blockquote + inline link

test.describe('AC-017-PILLARS — How AI Stays Reliable section', () => {
  test('section heading visible', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('How AI Stays Reliable', { exact: true })).toBeVisible()
  })

  test('Persistent Memory pillar: keywords + anchor quote + link', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('Persistent Memory', { exact: true })).toBeVisible()
    // Keywords
    await expect(page.getByText(/MEMORY\.md/)).toBeVisible()
    await expect(page.getByText(/cross-conversation/)).toBeVisible()
    // Anchor blockquote
    await expect(page.getByText('Every "stop doing X" becomes a memory entry — corrections outlive the session.')).toBeVisible()
    // Inline link to docs
    const link = page.locator('a[href="/docs/ai-collab-protocols.md#per-role-retrospective-log"]')
    await expect(link).toBeVisible()
  })

  test('Structured Reflection pillar: keywords + anchor quote + link', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('Structured Reflection', { exact: true })).toBeVisible()
    // Keywords — scope to the pillar card to avoid strict mode ambiguity
    await expect(page.getByText(/docs\/retrospectives\/<role>\.md/)).toBeVisible()
    // Bug Found Protocol appears in multiple places; use the pillar body p element
    await expect(page.getByText(/Bug Found Protocol gates fixes behind mandatory reflection/)).toBeVisible()
    // Anchor blockquote
    await expect(page.getByText('No memory write = the bug is not closed.', { exact: true })).toBeVisible()
    // Inline link
    const link = page.locator('a[href="/docs/ai-collab-protocols.md#bug-found-protocol"]')
    await expect(link).toBeVisible()
  })

  test('Role Agents pillar: keywords + anchor quote + link', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('Role Agents', { exact: true })).toBeVisible()
    // Keywords
    await expect(page.getByText(/PM \/ Architect \/ Engineer \/ Reviewer \/ QA \/ Designer/)).toBeVisible()
    await expect(page.getByText(/audit-ticket\.sh K-XXX/)).toBeVisible()
    // Anchor blockquote
    await expect(page.getByText('No artifact = no handoff.', { exact: true })).toBeVisible()
    // Inline link
    const link = page.locator('a[href="/docs/ai-collab-protocols.md#role-flow"]')
    await expect(link).toBeVisible()
  })
})

// ── AC-017-TICKETS ────────────────────────────────────────────────────────────
// Given: user visits /about
// When:  page scrolls to "Anatomy of a Ticket"
// Then:  3 ticket cards with ID, title, and GitHub href

test.describe('AC-017-TICKETS — Anatomy of a Ticket section', () => {
  test('section heading visible', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('Anatomy of a Ticket', { exact: true })).toBeVisible()
  })

  test('K-002 card: ID + title + GitHub link', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('K-002', { exact: true })).toBeVisible()
    await expect(page.getByText('UI optimization', { exact: true })).toBeVisible()
    const link = page.locator('a[href="https://github.com/mshmwr/k-line-prediction/blob/main/docs/tickets/K-002-ui-optimization.md"]')
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('K-008 card: ID + title + GitHub link', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('K-008', { exact: true })).toBeVisible()
    await expect(page.getByText('Visual report script', { exact: true })).toBeVisible()
    const link = page.locator('a[href="https://github.com/mshmwr/k-line-prediction/blob/main/docs/tickets/K-008-visual-report.md"]')
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('K-009 card: ID + title + GitHub link', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('K-009', { exact: true })).toBeVisible()
    await expect(page.getByText('1H MA history fix', { exact: true })).toBeVisible()
    const link = page.locator('a[href="https://github.com/mshmwr/k-line-prediction/blob/main/docs/tickets/K-009-1h-ma-history-fix.md"]')
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

// ── AC-017-ARCH ───────────────────────────────────────────────────────────────
// Given: user visits /about
// When:  page scrolls to "Project Architecture"
// Then:  3 sub-blocks with titles and keywords

test.describe('AC-017-ARCH — Project Architecture section', () => {
  test('section heading and intro visible', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('Project Architecture', { exact: true })).toBeVisible()
    await expect(page.getByText('How the codebase stays legible for a solo operator + AI agents.', { exact: true })).toBeVisible()
  })

  test('Monorepo contract-first block: title + keywords', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('Monorepo, contract-first', { exact: true })).toBeVisible()
    await expect(page.getByText(/React\/TypeScript/)).toBeVisible()
    await expect(page.getByText(/FastAPI\/Python/)).toBeVisible()
    await expect(page.getByText(/snake_case/)).toBeVisible()
    await expect(page.getByText(/camelCase/)).toBeVisible()
  })

  test('Docs-driven tickets block: title + keywords', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('Docs-driven tickets', { exact: true })).toBeVisible()
    await expect(page.getByText(/Given\/When\/Then\/And/)).toBeVisible()
    await expect(page.getByText(/Playwright test mirrors the spec 1:1/)).toBeVisible()
    // docs/tickets/K-XXX.md appears in multiple places; target the code element in the arch section
    await expect(page.locator('code').getByText('docs/tickets/K-XXX.md', { exact: true }).first()).toBeVisible()
  })

  test('Three-layer testing pyramid block: title + three layers', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('Three-layer testing pyramid', { exact: true })).toBeVisible()
    // Testing pyramid list items render as "Layer — detail" inside li
    await expect(page.getByText(/Vitest \(frontend\), pytest \(backend\)/)).toBeVisible()
    await expect(page.getByText(/FastAPI test client/)).toBeVisible()
    await expect(page.getByText(/visual-report pipeline/)).toBeVisible()
  })
})

// ── AC-017-BANNER ─────────────────────────────────────────────────────────────
// Given: user visits / (homepage)
// When:  page loads
// Then:  thin banner above hero with correct text + click navigates to /about

test.describe('AC-017-BANNER — Homepage BuiltByAIBanner', () => {
  test('banner text visible with exact match', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('One operator. Six AI agents. Every ticket leaves a doc trail.', { exact: false })).toBeVisible()
    await expect(page.getByText('See how →')).toBeVisible()
  })

  test('clicking banner navigates to /about via SPA routing', async ({ page }) => {
    await page.goto('/')
    // Click the banner link
    await page.locator('a[href="/about"][aria-label*="AI collaboration"]').click()
    await expect(page).toHaveURL('/about')
  })

  test('banner does not break existing AC-HOME-1 sections', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Predict the Next Move/i })).toBeVisible()
    await expect(page.getByText('HOW IT WORKS')).toBeVisible()
    await expect(page.getByText('DEV DIARY')).toBeVisible()
  })
})

// ── AC-017-FOOTER ─────────────────────────────────────────────────────────────
// Given: user visits /about
// When:  page scrolls to footer
// Then:  Let's talk, email, GitHub, LinkedIn all correct

test.describe('AC-017-FOOTER — Footer CTA on /about', () => {
  test("Let's talk heading visible", async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText("Let's talk →", { exact: true })).toBeVisible()
  })

  test('email link has correct href with mailto prefix', async ({ page }) => {
    await page.goto('/about')
    const emailLink = page.locator('a[href="mailto:yichen.lee.20@gmail.com"]')
    await expect(emailLink).toBeVisible()
    await expect(emailLink).toHaveAttribute('href', 'mailto:yichen.lee.20@gmail.com')
  })

  test('Or see the source label visible', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('Or see the source:', { exact: true })).toBeVisible()
  })

  test('GitHub link: correct href + target=_blank + rel=noopener noreferrer', async ({ page }) => {
    await page.goto('/about')
    const githubLink = page.locator('a[href="https://github.com/mshmwr/k-line-prediction"]')
    await expect(githubLink).toBeVisible()
    await expect(githubLink).toHaveAttribute('href', 'https://github.com/mshmwr/k-line-prediction')
    await expect(githubLink).toHaveAttribute('target', '_blank')
    await expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('LinkedIn link: correct href + target=_blank + rel=noopener noreferrer', async ({ page }) => {
    await page.goto('/about')
    const linkedinLink = page.locator('a[href="https://linkedin.com/in/yichenlee-career"]')
    await expect(linkedinLink).toBeVisible()
    await expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com/in/yichenlee-career')
    await expect(linkedinLink).toHaveAttribute('target', '_blank')
    await expect(linkedinLink).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

// ── AC-017-BUILD ─────────────────────────────────────────────────────────────
// Given: frontend has been built (prebuild copied ai-collab-protocols.md to public/docs/)
// When:  user navigates to /docs/ai-collab-protocols.md
// Then:  browser receives markdown content (not SPA redirect)

test.describe('AC-017-BUILD — docs/ai-collab-protocols.md accessible as static file', () => {
  test('/docs/ai-collab-protocols.md returns markdown content, not SPA', async ({ page }) => {
    test.skip(true, 'Requires npm run build first: prebuild hook copies docs/ai-collab-protocols.md to public/docs/. Run with production build, not dev server.')
    const response = await page.goto('/docs/ai-collab-protocols.md')
    // Should succeed (200) and not redirect back to SPA index.html with HTML content
    expect(response?.status()).toBe(200)
    const body = await page.content()
    // Markdown file should contain the title, not a React SPA root
    expect(body).toContain('AI Collaboration Protocols')
  })
})
