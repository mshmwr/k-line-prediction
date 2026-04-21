/**
 * K-022 — /about 結構細節對齊設計稿 v2
 * AC-022-* E2E assertions
 */
import { test, expect } from '@playwright/test'

// ── AC-022-SECTION-LABEL ───────────────────────────────────────────────────────
// Given: user visits /about
// When:  page scrolls to any section
// Then:  section label (Geist Mono 13px bold) + hairline visible

test.describe('AC-022-SECTION-LABEL — Section labels + hairline', () => {
  test('all 5 section labels visible with exact text', async ({ page }) => {
    await page.goto('/about')

    const sectionLabels = [
      'Nº 01 — DELIVERY METRICS',
      'Nº 02 — THE ROLES',
      'Nº 03 — RELIABILITY',
      'Nº 04 — ANATOMY OF A TICKET',
      'Nº 05 — PROJECT ARCHITECTURE',
    ]

    for (const label of sectionLabels) {
      await expect(page.getByText(label, { exact: true })).toBeVisible()
    }
  })

  test('section label fontFamily contains Geist Mono', async ({ page }) => {
    await page.goto('/about')
    const labelEl = page.getByText('Nº 01 — DELIVERY METRICS', { exact: true })
    const ff = await labelEl.evaluate(el => getComputedStyle(el).fontFamily)
    expect(ff).toContain('Geist Mono')
  })

  test('hairline element exists (data-section-hairline)', async ({ page }) => {
    await page.goto('/about')
    const hairline = page.locator('[data-section-hairline]').first()
    await expect(hairline).toBeVisible()
  })

  for (const width of [375, 390, 414]) {
    test(`AC-022-SECTION-LABEL — ${width}px — label visible, not overflow:hidden`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width, height: 812 } })
      const page = await ctx.newPage()
      await page.goto('/about')
      const label = page.getByText('Nº 01 — DELIVERY METRICS', { exact: true })
      await expect(label).toBeVisible()
      const overflow = await label.evaluate(el => getComputedStyle(el).overflow)
      expect(overflow).not.toBe('hidden')
      await ctx.close()
    })
  }
})

// ── AC-022-DOSSIER-HEADER ─────────────────────────────────────────────────────
// Given: user visits /about
// When:  page loads
// Then:  dossier header bar visible with FILE Nº text + bg-charcoal

test.describe('AC-022-DOSSIER-HEADER — Dossier header bar', () => {
  test('dossier header bar exists and contains FILE Nº', async ({ page }) => {
    await page.goto('/about')
    const header = page.locator('[data-testid="dossier-header"]')
    await expect(header).toBeVisible()
    await expect(header).toContainText('FILE Nº')
  })

  test('dossier header background is bg-charcoal (#2A2520)', async ({ page }) => {
    await page.goto('/about')
    const header = page.locator('[data-testid="dossier-header"]')
    const bg = await header.evaluate(el => getComputedStyle(el).backgroundColor)
    expect(bg).toBe('rgb(42, 37, 32)') // #2A2520
  })
})

// ── AC-022-HERO-TWO-LINE ──────────────────────────────────────────────────────
// Given: user visits /about
// When:  page loads
// Then:  Hero main sentence Bodoni Moda italic + tagline Bodoni Moda italic

test.describe('AC-022-HERO-TWO-LINE — Hero two-line structure', () => {
  test('h1 contains main sentence with Bodoni Moda fontFamily', async ({ page }) => {
    await page.goto('/about')
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    await expect(h1).toContainText('One operator, orchestrating AI')
    const mainFF = await h1.evaluate(el => getComputedStyle(el).fontFamily)
    expect(mainFF).toContain('Bodoni Moda')
  })

  test('tagline "Every feature ships with a doc trail." Bodoni Moda italic', async ({ page }) => {
    await page.goto('/about')
    const tagline = page.getByText('Every feature ships with a doc trail.', { exact: true })
    await expect(tagline).toBeVisible()
    const tagFF = await tagline.evaluate(el => getComputedStyle(el).fontFamily)
    expect(tagFF).toContain('Bodoni Moda')
    const tagStyle = await tagline.evaluate(el => getComputedStyle(el).fontStyle)
    expect(tagStyle).toBe('italic')
  })

  test('brick accent on "agents end-to-end —" span', async ({ page }) => {
    await page.goto('/about')
    const accentSpan = page.getByText('agents end-to-end —', { exact: true })
    await expect(accentSpan).toBeVisible()
    const color = await accentSpan.evaluate(el => getComputedStyle(el).color)
    // text-brick = #B43A2C
    expect(color).toBe('rgb(180, 58, 44)')
  })

  test('375px — h1 and tagline do not overlap', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } })
    const page = await ctx.newPage()
    await page.goto('/about')
    const h1 = page.getByRole('heading', { level: 1 })
    const tagline = page.getByText('Every feature ships with a doc trail.', { exact: true })
    const h1Rect = await h1.evaluate(el => el.getBoundingClientRect())
    const tagRect = await tagline.evaluate(el => el.getBoundingClientRect())
    expect(tagRect.top).toBeGreaterThanOrEqual(h1Rect.bottom - 1) // -1 for subpixel rounding tolerance
    await ctx.close()
  })
})

// ── AC-022-SUBTITLE ───────────────────────────────────────────────────────────
// Given: user visits /about
// When:  page scrolls to Metrics/Roles/Pillars/Tickets/Architecture
// Then:  5 italic subtitles (Newsreader italic) exist

test.describe('AC-022-SUBTITLE — Section italic subtitles', () => {
  test('5 data-section-subtitle elements exist', async ({ page }) => {
    await page.goto('/about')
    const subtitles = page.locator('[data-section-subtitle]')
    await expect(subtitles).toHaveCount(5)
  })

  test('first subtitle fontFamily contains Newsreader and is italic', async ({ page }) => {
    await page.goto('/about')
    const firstSubtitle = page.locator('[data-section-subtitle]').first()
    const ff = await firstSubtitle.evaluate(el => getComputedStyle(el).fontFamily)
    expect(ff).toContain('Newsreader')
    const style = await firstSubtitle.evaluate(el => getComputedStyle(el).fontStyle)
    expect(style).toBe('italic')
  })
})

// ── AC-022-REDACTION-BAR ──────────────────────────────────────────────────────
// Given: user visits /about
// When:  page scrolls to Metrics or Roles section
// Then:  at least one redaction bar exists with charcoal bg + 10px height

test.describe('AC-022-REDACTION-BAR — Redaction bars', () => {
  test('at least one data-redaction element exists', async ({ page }) => {
    await page.goto('/about')
    const bars = page.locator('[data-redaction]')
    const count = await bars.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('redaction bar background is bg-charcoal and height is 10px', async ({ page }) => {
    await page.goto('/about')
    const bar = page.locator('[data-redaction]').first()
    const bg = await bar.evaluate(el => getComputedStyle(el).backgroundColor)
    expect(bg).toBe('rgb(42, 37, 32)') // #2A2520
    const h = await bar.evaluate(el => getComputedStyle(el).height)
    expect(h).toBe('10px')
  })
})

// ── AC-022-OWNS-ARTEFACT-LABEL ────────────────────────────────────────────────
// Given: user visits /about
// When:  page scrolls to Role Cards
// Then:  6 cards × 2 labels = 12 assertions (OWNS + ARTEFACT, Geist Mono 10px text-muted)

test.describe('AC-022-OWNS-ARTEFACT-LABEL — OWNS / ARTEFACT labels', () => {
  const roles = ['PM', 'Architect', 'Engineer', 'Reviewer', 'QA', 'Designer'] as const

  for (const role of roles) {
    test(`${role} card: OWNS + ARTEFACT labels visible (Geist Mono 10px text-muted)`, async ({ page }) => {
      await page.goto('/about')
      const card = page.locator(`[data-role="${role}"]`)

      const ownsLabel = card.getByText('OWNS', { exact: true })
      const artLabel = card.getByText('ARTEFACT', { exact: true })

      await expect(ownsLabel).toBeVisible()
      await expect(artLabel).toBeVisible()

      const ff = await ownsLabel.evaluate(el => getComputedStyle(el).fontFamily)
      expect(ff).toContain('Geist Mono')

      const fs = await ownsLabel.evaluate(el => getComputedStyle(el).fontSize)
      expect(fs).toBe('10px')

      const color = await ownsLabel.evaluate(el => getComputedStyle(el).color)
      expect(color).toBe('rgb(107, 95, 78)') // text-muted #6B5F4E
    })
  }
})

// ── AC-022-LINK-STYLE ─────────────────────────────────────────────────────────
// Given: user visits /about
// When:  any link on page
// Then:  at least one <a> has Newsreader italic + underline

test.describe('AC-022-LINK-STYLE — Newsreader italic + underline links', () => {
  test('at least one link uses Newsreader italic + underline', async ({ page }) => {
    await page.goto('/about')
    const links = page.locator('a')
    let found = false
    for (const link of await links.all()) {
      const ff = await link.evaluate(el => getComputedStyle(el).fontFamily)
      const style = await link.evaluate(el => getComputedStyle(el).fontStyle)
      const deco = await link.evaluate(el => getComputedStyle(el).textDecoration)
      if (ff.includes('Newsreader') && style === 'italic' && deco.includes('underline')) {
        found = true
        break
      }
    }
    expect(found).toBe(true)
  })
})

// ── AC-022-CASE-FILE-HEADER ───────────────────────────────────────────────────
// Given: user visits /about
// When:  page scrolls to Anatomy of a Ticket section
// Then:  "Nº 04 — ANATOMY OF A TICKET" label visible (BQ-022-01 PM 裁決)

test.describe('AC-022-CASE-FILE-HEADER — Ticket section label format', () => {
  test('Nº 04 — ANATOMY OF A TICKET label visible (exact)', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('Nº 04 — ANATOMY OF A TICKET', { exact: true })).toBeVisible()
  })
})

// ── AC-022-LAYER-LABEL ────────────────────────────────────────────────────────
// Given: user visits /about
// When:  page scrolls to "How AI Stays Reliable"
// Then:  LAYER 1/2/3 labels visible (Geist Mono 10px, BQ-022-02 PM 裁決)

test.describe('AC-022-LAYER-LABEL — LAYER 1/2/3 pillar labels', () => {
  test('LAYER 1, LAYER 2, LAYER 3 all visible (exact)', async ({ page }) => {
    await page.goto('/about')
    const layerLabels = ['LAYER 1', 'LAYER 2', 'LAYER 3'] as const
    for (const label of layerLabels) {
      await expect(page.getByText(label, { exact: true })).toBeVisible()
    }
  })

  test('LAYER 1 label fontFamily contains Geist Mono and fontSize is 10px', async ({ page }) => {
    await page.goto('/about')
    const layerEl = page.getByText('LAYER 1', { exact: true })
    const ff = await layerEl.evaluate(el => getComputedStyle(el).fontFamily)
    expect(ff).toContain('Geist Mono')
    const fs = await layerEl.evaluate(el => getComputedStyle(el).fontSize)
    expect(fs).toBe('10px')
  })
})

// ── AC-022-FOOTER-REGRESSION ──────────────────────────────────────────────────
// Given: K-017 AC-017-FOOTER was PASS
// When:  K-022 implementation complete
// Then:  all K-017 footer assertions still PASS

test.describe('AC-022-FOOTER-REGRESSION — Footer CTA K-017 regression', () => {
  test("Let's talk → still visible", async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText("Let's talk →", { exact: true })).toBeVisible()
  })

  test('email link still visible', async ({ page }) => {
    await page.goto('/about')
    const emailLink = page.locator('a[href="mailto:yichen.lee.20@gmail.com"]')
    await expect(emailLink).toBeVisible()
  })

  test('Or see the source: still visible', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('Or see the source:', { exact: true })).toBeVisible()
  })
})

// ── AC-022-ANNOTATION ─────────────────────────────────────────────────────────
// Given: user visits /about
// When:  page scrolls to Role Cards
// Then:  at least one BEHAVIOUR or POSITION annotation visible (Geist Mono 9-10px text-muted)

test.describe('AC-022-ANNOTATION — Role Card marginalia annotations', () => {
  test('at least one data-annotation element exists', async ({ page }) => {
    await page.goto('/about')
    const annotations = page.locator('[data-annotation]')
    const count = await annotations.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('BEHAVIOUR or POSITION text visible (exact)', async ({ page }) => {
    await page.goto('/about')
    const behav = page.getByText('BEHAVIOUR', { exact: true })
    const pos = page.getByText('POSITION', { exact: true })
    const total = (await behav.count()) + (await pos.count())
    expect(total).toBeGreaterThanOrEqual(1)
  })

  test('annotation fontSize is 9px or 10px', async ({ page }) => {
    await page.goto('/about')
    const el = page.locator('[data-annotation]').first()
    const fs = await el.evaluate(e => getComputedStyle(e).fontSize)
    expect(['9px', '10px']).toContain(fs)
  })
})

// ── AC-022-ROLE-GRID-HEIGHT ───────────────────────────────────────────────────
// Given: user visits /about
// When:  page scrolls to Role Cards (desktop viewport)
// Then:  6 cards, getBoundingClientRect height max-min ≤ 2px

test.describe('AC-022-ROLE-GRID-HEIGHT — Role Cards grid height', () => {
  test('6 role cards exist', async ({ page }) => {
    await page.goto('/about')
    const cards = page.locator('[data-role]')
    await expect(cards).toHaveCount(6)
  })

  test('6 role card heights differ by ≤ 2px (desktop)', async ({ page }) => {
    await page.goto('/about')
    const cards = page.locator('[data-role]')
    const heights = await cards.evaluateAll(els =>
      els.map(el => el.getBoundingClientRect().height)
    )
    const maxH = Math.max(...heights)
    const minH = Math.min(...heights)
    expect(maxH - minH).toBeLessThanOrEqual(2)
  })

  for (const width of [375, 390, 414]) {
    test(`AC-022-ROLE-GRID-HEIGHT — ${width}px — 6 cards visible, height ≥ 200px each`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width, height: 812 } })
      const page = await ctx.newPage()
      await page.goto('/about')
      const cards = page.locator('[data-role]')
      await expect(cards).toHaveCount(6)
      const heights = await cards.evaluateAll(els =>
        els.map(el => el.getBoundingClientRect().height)
      )
      for (const h of heights) {
        expect(h).toBeGreaterThanOrEqual(200)
      }
      await ctx.close()
    })
  }
})

// ── AC-031-SECTION-ABSENT ─────────────────────────────────────────────────────
// Given: user navigates to /about
// When:  page finishes loading
// Then:  no #banner-showcase element, no "Built by AI" heading, no showcase caption text

test.describe('AC-031-SECTION-ABSENT — Built by AI showcase section removed from /about', () => {
  test('showcase section absent from DOM (id + heading + caption all gone)', async ({ page }) => {
    await page.goto('/about')

    // Primary signal: id is gone (deleted-from-DOM semantics per Architect §7 note)
    await expect(page.locator('#banner-showcase')).toHaveCount(0)

    // Heading with text "Built by AI" must not exist anywhere on /about
    await expect(page.getByRole('heading', { name: 'Built by AI', exact: true })).toHaveCount(0)

    // Caption text from removed component must not appear
    await expect(
      page.getByText('The real banner is clickable and navigates to /about', { exact: false })
    ).toHaveCount(0)
  })
})

// ── AC-031-LAYOUT-CONTINUITY ──────────────────────────────────────────────────
// Given: user is on /about after S7 removal
// When:  page renders
// Then:  #architecture is immediately followed by #footer-cta (no banner-showcase between)

test.describe('AC-031-LAYOUT-CONTINUITY — FooterCta immediately follows architecture', () => {
  test('#architecture nextElementSibling is #footer-cta and banner-showcase absent', async ({ page }) => {
    await page.goto('/about')

    // Both neighbours present and visible
    await expect(page.locator('#architecture')).toBeVisible()
    await expect(page.locator('#footer-cta')).toBeVisible()

    // Banner-showcase does not exist between them (or anywhere)
    await expect(page.locator('#banner-showcase')).toHaveCount(0)

    // DOM-order adjacency: architecture's nextElementSibling is footer-cta
    const nextSiblingId = await page.evaluate(
      () => document.getElementById('architecture')?.nextElementSibling?.id ?? null
    )
    expect(nextSiblingId).toBe('footer-cta')
  })
})
