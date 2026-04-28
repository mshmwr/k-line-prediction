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
    // Phase 1 lazy-chunk timing: wait for section to be in DOM before checking order.
    await page.waitForSelector('section')

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

    // h1 heading contains the main operator declaration (K-040 sitewide reset:
    // Geist Mono 52px style=normal; K-017 Bodoni italic voice retired 2026-04-23).
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    await expect(h1).toContainText('One operator, orchestrating AI')
    // agents end-to-end is a span inside h1 (accent color text-brick)
    await expect(h1).toContainText('agents end-to-end —')

    // K-040 sitewide reset: "PM, architect..." role line renders in Geist Mono
    // style=normal (was Newsreader italic pre-K-040). Text-content contract +
    // { exact: true } preserved per K-017 retire-in-place note.
    await expect(page.getByText('PM, architect, engineer, reviewer, QA, designer.', { exact: true })).toBeVisible()

    // Closing sentence is in a separate element (p or span), not crammed on same line
    await expect(page.getByText('Every feature ships with a doc trail.', { exact: true })).toBeVisible()
  })
})

// ── AC-017-METRICS (updated K-052) ────────────────────────────────────────────
// Given: user visits /about
// When:  page loads
// Then:  4 metric cards with labels from content/site-content.json; values match regex patterns.
//
// AC-K052-06: value assertions use regex (values are dynamic from ticket corpus).
// Labels: "Features Shipped", "Documented AC Coverage", "Post-mortems Written", "Lessons Codified"
// m1 bigNumber: /^\d+$/
// m2 subtext:   /^\d+ \/ \d+ \(\d+%\)$/
// m3 bigNumber: /^\d+$/
// m4 bigNumber: /^\d+$/ (may be absent if lessonsCodified is null)

test.describe('AC-017-METRICS — Metrics strip (K-052 JSON-driven)', () => {
  test('Features Shipped card label and numeric value', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('Features Shipped', { exact: true })).toBeVisible()
    // bigNumber is a numeric string from siteContent.metrics.featuresShipped.value
    await expect(page.locator('h3').filter({ hasText: 'Features Shipped' })
      .locator('xpath=preceding-sibling::span[1]')).toHaveText(/^\d+$/)
  })

  test('Documented AC Coverage card label and subtext format', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('Documented AC Coverage', { exact: true })).toBeVisible()
    // subtext format: "{covered} / {total} ({percent}%)"
    await expect(page.getByText(/^\d+ \/ \d+ \(\d+%\)$/).first()).toBeVisible()
  })

  test('Post-mortems Written card label and numeric value', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('Post-mortems Written', { exact: true })).toBeVisible()
  })

  test('Lessons Codified card label visible', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('Lessons Codified', { exact: true })).toBeVisible()
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
    await expect(article.getByText('Requirements, AC, phase gating', { exact: true })).toBeVisible()
    await expect(article.getByText('PRD + ticket + retrospective', { exact: true })).toBeVisible()
  })

  test('Architect card: role + owns + artefact', async ({ page }) => {
    await page.goto('/about')
    const article = page.locator('[data-role="Architect"]')
    await expect(article.getByText('Architect', { exact: true })).toBeVisible()
    await expect(article.getByText('Design, API contract, component tree', { exact: true })).toBeVisible()
    await expect(article.getByText('Design doc + retrospective', { exact: true })).toBeVisible()
  })

  test('Engineer card: role + owns + artefact', async ({ page }) => {
    await page.goto('/about')
    const article = page.locator('[data-role="Engineer"]')
    await expect(article.getByText('Engineer', { exact: true })).toBeVisible()
    await expect(article.getByText('Implementation', { exact: true })).toBeVisible()
    await expect(article.getByText('Code + retrospective', { exact: true })).toBeVisible()
  })

  test('Reviewer card: role + owns + artefact', async ({ page }) => {
    await page.goto('/about')
    const article = page.locator('[data-role="Reviewer"]')
    await expect(article.getByText('Reviewer', { exact: true })).toBeVisible()
    await expect(article.getByText('Code review, Bug Found Protocol', { exact: true })).toBeVisible()
    await expect(article.getByText('Review report + retrospective', { exact: true })).toBeVisible()
  })

  test('QA card: role + owns + artefact', async ({ page }) => {
    await page.goto('/about')
    const article = page.locator('[data-role="QA"]')
    await expect(article.getByText('QA', { exact: true })).toBeVisible()
    await expect(article.getByText('Regression, E2E, visual report', { exact: true })).toBeVisible()
    await expect(article.getByText('QA report + retrospective', { exact: true })).toBeVisible()
  })

  test('Designer card: role + owns + artefact', async ({ page }) => {
    await page.goto('/about')
    const article = page.locator('[data-role="Designer"]')
    await expect(article.getByText('Designer', { exact: true })).toBeVisible()
    await expect(article.getByText('Pencil design source of truth', { exact: true })).toBeVisible()
    await expect(article.getByText('.pen file + JSON/PNG spec + retrospective', { exact: true })).toBeVisible()
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
    // K-040 Item 11 BQ-040-04 Option A — docsHref rewritten from site-relative to GitHub blob URL
    const link = page.locator('a[href="https://github.com/mshmwr/k-line-prediction/blob/main/docs/ai-collab-protocols.md#per-role-retrospective-log"]')
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', /noopener/)
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
    // K-040 Item 11 BQ-040-04 Option A — docsHref rewritten from site-relative to GitHub blob URL
    const link = page.locator('a[href="https://github.com/mshmwr/k-line-prediction/blob/main/docs/ai-collab-protocols.md#bug-found-protocol"]')
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', /noopener/)
  })

  test('Role Agents pillar: keywords + anchor quote + link', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('Role Agents', { exact: true })).toBeVisible()
    // Keywords
    await expect(page.getByText(/PM \/ Architect \/ Engineer \/ Reviewer \/ QA \/ Designer/)).toBeVisible()
    await expect(page.getByText(/audit-ticket\.sh K-XXX/)).toBeVisible()
    // Anchor blockquote
    await expect(page.getByText('No artifact = no handoff.', { exact: true })).toBeVisible()
    // K-040 Item 11 BQ-040-04 Option A — docsHref rewritten from site-relative to GitHub blob URL
    const link = page.locator('a[href="https://github.com/mshmwr/k-line-prediction/blob/main/docs/ai-collab-protocols.md#role-flow"]')
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', /noopener/)
  })
})

// ── AC-017-TICKETS ────────────────────────────────────────────────────────────
// Given: user visits /about
// When:  page scrolls to "Anatomy of a Ticket"
// Then:  3 ticket cards with ID, title, and GitHub href

test.describe('AC-017-TICKETS — Anatomy of a Ticket section', () => {
  test('section heading visible', async ({ page }) => {
    // K-034 Phase 2 §7 Step 6 — S5 h2 "Anatomy of a Ticket" deleted; SectionLabelRow
    // in AboutPage.tsx carries "Nº 04 — ANATOMY OF A TICKET" as the sole heading.
    await page.goto('/about')
    await expect(page.getByText('Nº 04 — ANATOMY OF A TICKET', { exact: true })).toBeVisible()
  })

  test('K-002 card: ID + title + GitHub link', async ({ page }) => {
    // K-034 Phase 2 §7 Step 6 — K-00N appears twice (FileNoBar trailing + sr-only
    // testid anchor for AC-029 color strict assertion). Use .first() to disambiguate.
    await page.goto('/about')
    await expect(page.getByText('K-002', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('UI optimization', { exact: true })).toBeVisible()
    const link = page.locator('a[href="https://github.com/mshmwr/k-line-prediction/blob/main/docs/tickets/K-002-ui-optimization.md"]')
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('K-008 card: ID + title + GitHub link', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('K-008', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Visual report script', { exact: true })).toBeVisible()
    const link = page.locator('a[href="https://github.com/mshmwr/k-line-prediction/blob/main/docs/tickets/K-008-visual-report.md"]')
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('K-009 card: ID + title + GitHub link', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('K-009', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('1H MA history fix', { exact: true })).toBeVisible()
    const link = page.locator('a[href="https://github.com/mshmwr/k-line-prediction/blob/main/docs/tickets/K-009-1h-ma-history-fix.md"]')
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

// ── AC-034-P2-DRIFT-D26-SUBTITLE-VERBATIM ─────────────────────────────────────
// Given: user visits /about
// When:  page scrolls to S3 RoleCards (Nº 02 — THE ROLES) and S5 TicketAnatomy (Nº 04 — ANATOMY OF A TICKET)
// Then:  each section's italic subtitle matches Pencil s3Intro / s5Intro verbatim.
//
// Pencil sources:
//   - S3 s3Intro (`frontend/design/specs/about-v2.frame-8mqwX.json` line 23):
//     "— Each role a separate agent with spec'd responsibilities. Every handoff produces a verifiable artefact."
//   - S5 s5Intro (`frontend/design/specs/about-v2.frame-EBC1e.json` line 18):
//     "— Anatomy of a ticket. Three cases, each filed in full with outcome and learning."
//
// S6 ProjectArchitecture subtitle already asserted verbatim at
// `AC-017-ARCH — section heading and intro visible` below. Per K-034 Phase 2
// §4.8 I-3 PM ruling 2026-04-23 — adds the remaining 2/3 Pencil-literal
// subtitle coverage so silent drift cannot slip past Pencil-parity gate.

test.describe('AC-034-P2-DRIFT-D26-SUBTITLE-VERBATIM — Pencil-verbatim section subtitles', () => {
  test('S3 RoleCards subtitle verbatim per Pencil s3Intro (8mqwX)', async ({ page }) => {
    await page.goto('/about')
    await expect(
      page.getByText(
        "— Each role a separate agent with spec'd responsibilities. Every handoff produces a verifiable artefact.",
        { exact: true }
      )
    ).toBeVisible()
  })

  test('S5 TicketAnatomy subtitle verbatim per Pencil s5Intro (EBC1e)', async ({ page }) => {
    await page.goto('/about')
    await expect(
      page.getByText(
        '— Anatomy of a ticket. Three cases, each filed in full with outcome and learning.',
        { exact: true }
      )
    ).toBeVisible()
  })
})

// ── AC-017-ARCH ───────────────────────────────────────────────────────────────
// Given: user visits /about
// When:  page scrolls to "Project Architecture"
// Then:  3 sub-blocks with titles and keywords

test.describe('AC-017-ARCH — Project Architecture section', () => {
  test('section heading and intro visible', async ({ page }) => {
    // K-034 Phase 2 §7 Step 7 — S6 h2 "Project Architecture" deleted; SectionLabelRow
    // carries "Nº 05 — PROJECT ARCHITECTURE". s6Intro subtitle now has em-dash prefix.
    await page.goto('/about')
    await expect(page.getByText('Nº 05 — PROJECT ARCHITECTURE', { exact: true })).toBeVisible()
    await expect(page.getByText('— How the codebase stays legible for a solo operator + AI agents.', { exact: true })).toBeVisible()
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
    // K-034 Phase 2 §7 Step 7 — arch FLOW value rendered as plain <p class="font-mono ...">
    // per Pencil SPEC FORMAT/FLOW label pattern; no <code> wrapper. Match text in any element.
    await expect(page.getByText('PRD → docs/tickets/K-XXX.md → role retrospectives.', { exact: true })).toBeVisible()
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
    await expect(page.getByRole('heading', { name: /K-line similarity/i })).toBeVisible()
    await expect(page.getByText('HOW IT WORKS')).toBeVisible()
    await expect(page.getByText('DEV DIARY')).toBeVisible()
  })
})

// AC-017-FOOTER deleted per K-034 §PM ruling on BQ-034-P1-01 — Sacred retired per §1.4 Pencil SSOT verdict
// Pencil frames 86psQ + 1BGtd contain no <a> anchors on /about Footer; the K-017 email/GitHub/LinkedIn
// href+target+rel assertions (5 tests) and `Let's talk →` / `Or see the source:` string literals are retired.
// Footer content is now validated by shared-components.spec.ts AC-034-P1-ROUTE-DOM-PARITY (byte-identical).

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
