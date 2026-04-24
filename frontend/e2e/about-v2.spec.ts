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

// AC-022-DOSSIER-HEADER retired per K-034 §5 drift D-1 — Pencil SSOT has no DossierHeader frame; component deleted.
// The FILE Nº motif is now carried by FileNoBar inside MetricCard/RoleCard/PillarCard/TicketAnatomyCard/ArchPillarBlock
// and covered by AC-022-HERO-TWO-LINE + AC-022-LAYER-LABEL (rewritten to FILE Nº · PROTOCOL).

// ── AC-022-HERO-TWO-LINE ──────────────────────────────────────────────────────
// Given: user visits /about
// When:  page loads
// Then:  Hero main sentence + tagline render in Geist Mono (sitewide reset,
//        K-040 AC-040-SITEWIDE-FONT-MONO). K-022 Bodoni italic voice retired
//        2026-04-23; text-content + two-line layout contract preserved.

test.describe('AC-022-HERO-TWO-LINE — Hero two-line structure', () => {
  test('h1 contains main sentence with Geist Mono fontFamily (K-040 sitewide reset)', async ({ page }) => {
    await page.goto('/about')
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    await expect(h1).toContainText('One operator, orchestrating AI')
    const mainFF = await h1.evaluate(el => getComputedStyle(el).fontFamily)
    expect(mainFF).toMatch(/Geist Mono|ui-monospace/)
    const mainStyle = await h1.evaluate(el => getComputedStyle(el).fontStyle)
    expect(mainStyle).toBe('normal')
  })

  test('tagline "Every feature ships with a doc trail." Geist Mono style=normal (K-040 sitewide reset)', async ({ page }) => {
    await page.goto('/about')
    const tagline = page.getByText('Every feature ships with a doc trail.', { exact: true })
    await expect(tagline).toBeVisible()
    const tagFF = await tagline.evaluate(el => getComputedStyle(el).fontFamily)
    expect(tagFF).toMatch(/Geist Mono|ui-monospace/)
    const tagStyle = await tagline.evaluate(el => getComputedStyle(el).fontStyle)
    expect(tagStyle).toBe('normal')
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
// Then:  3 section subtitles render in Geist Mono (sitewide reset,
//        K-040 AC-040-SITEWIDE-FONT-MONO). K-022 Newsreader italic voice
//        retired 2026-04-23; text-content + presence contract preserved
//        (K-034 DRIFT-D26-SUBTITLE-VERBATIM still in force).

test.describe('AC-022-SUBTITLE — Section italic subtitles', () => {
  test('3 data-section-subtitle elements exist', async ({ page }) => {
    // K-034 Phase 2 §7 Step 3/5 — S2 MetricsStripSection + S4 ReliabilityPillarsSection
    // no longer carry data-section-subtitle (Pencil BF4Xe has no intro; Pencil UXy2o
    // uses h2 "How AI Stays Reliable" instead). Remaining: S3 RoleCards + S5 TicketAnatomy + S6 ProjectArchitecture.
    await page.goto('/about')
    const subtitles = page.locator('[data-section-subtitle]')
    await expect(subtitles).toHaveCount(3)
  })

  test('first subtitle fontFamily Geist Mono + style=normal (K-040 sitewide reset)', async ({ page }) => {
    await page.goto('/about')
    const firstSubtitle = page.locator('[data-section-subtitle]').first()
    const ff = await firstSubtitle.evaluate(el => getComputedStyle(el).fontFamily)
    expect(ff).toMatch(/Geist Mono|ui-monospace/)
    const style = await firstSubtitle.evaluate(el => getComputedStyle(el).fontStyle)
    expect(style).toBe('normal')
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

// AC-022-LINK-STYLE retired per K-034 §5 drift D-11/D-14 — Pencil SSOT shows pillar/ticket
// links as Geist Mono 11 ink (no italic, no underline). The A-7 Newsreader italic + underline
// pattern was a K-022 Sacred rule superseded by Pencil frames UXy2o.p*Link + EBC1e.t*Link.

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
// Then:  FILE Nº 01 · PROTOCOL / Nº 02 / Nº 03 labels visible (Geist Mono 10px)
// K-022 AC-022-LAYER-LABEL Sacred retired per K-034 §5 drift D-10 — Pencil SSOT now
// specifies FILE Nº · PROTOCOL pattern unified with card FILE Nº motif.

test.describe('AC-022-LAYER-LABEL — FILE Nº · PROTOCOL pillar labels', () => {
  test('FILE Nº 01/02/03 · PROTOCOL all visible (exact)', async ({ page }) => {
    await page.goto('/about')
    const layerLabels = [
      'FILE Nº 01 · PROTOCOL',
      'FILE Nº 02 · PROTOCOL',
      'FILE Nº 03 · PROTOCOL',
    ] as const
    for (const label of layerLabels) {
      await expect(page.getByText(label, { exact: true })).toBeVisible()
    }
  })

  test('FILE Nº 01 · PROTOCOL label fontFamily contains Geist Mono and fontSize is 10px', async ({ page }) => {
    await page.goto('/about')
    const layerEl = page.getByText('FILE Nº 01 · PROTOCOL', { exact: true })
    const ff = await layerEl.evaluate(el => getComputedStyle(el).fontFamily)
    expect(ff).toContain('Geist Mono')
    const fs = await layerEl.evaluate(el => getComputedStyle(el).fontSize)
    expect(fs).toBe('10px')
  })
})

// ── AC-034-P2-FILENOBAR-VARIANTS ──────────────────────────────────────────────
// Given: user visits /about
// When:  page renders the 5 card consumers of FileNoBar primitive
// Then:  each consumer displays its Pencil-literal FILE Nº / LAYER Nº label variant:
//        - MetricCard → bare `FILE Nº 0N` (no suffix, Pencil BF4Xe m*Lbl)
//        - RoleCard → `FILE Nº 0N · PERSONNEL` (Pencil 8mqwX r*Top)
//        - TicketAnatomyCard → `FILE Nº 0N · CASE FILE` (Pencil EBC1e t*TopL)
//        - ArchPillarBlock → `LAYER Nº 0N · BACKBONE / DISCIPLINE / ASSURANCE` (Pencil JFizO arch*Top)
//        Closes gap where only PROTOCOL variant had Pencil-literal E2E assertion
//        (per K-034 Phase 2 §4.8 I-1 PM ruling 2026-04-23 — prevents silent drift
//        on any one card-shell motif; refactor-AC-grep raw-count sanity per
//        `feedback_refactor_ac_grep_raw_count_sanity.md`).

test.describe('AC-034-P2-FILENOBAR-VARIANTS — FileNoBar Pencil-literal label per consumer', () => {
  test('MetricCard: bare `FILE Nº 01..04` visible with no suffix label (BF4Xe m*Lbl)', async ({ page }) => {
    await page.goto('/about')
    // Scope to FileNoBar data-testid to exclude PillarCard `FILE Nº 01 · PROTOCOL`
    // which would otherwise match `FILE Nº 01` exact via ancestor text.
    const bareBars = page
      .locator('[data-testid="file-no-bar"]')
      .filter({ hasText: /^FILE Nº 0\d$/ })
    await expect(bareBars).toHaveCount(4)
    // Verify each numeric slot shows up exactly once as a bare bar.
    for (const n of [1, 2, 3, 4]) {
      const padded = String(n).padStart(2, '0')
      const bareN = page
        .locator('[data-testid="file-no-bar"]')
        .filter({ hasText: new RegExp(`^FILE Nº ${padded}$`) })
      await expect(bareN).toHaveCount(1)
    }
  })

  test('RoleCard: `FILE Nº 01 · PERSONNEL` through `FILE Nº 06 · PERSONNEL` all visible (exact)', async ({ page }) => {
    await page.goto('/about')
    for (const n of [1, 2, 3, 4, 5, 6]) {
      const padded = String(n).padStart(2, '0')
      await expect(
        page.getByText(`FILE Nº ${padded} · PERSONNEL`, { exact: true })
      ).toBeVisible()
    }
  })

  test('TicketAnatomyCard: `FILE Nº 01 · CASE FILE` through `FILE Nº 03 · CASE FILE` all visible (exact)', async ({ page }) => {
    await page.goto('/about')
    for (const n of [1, 2, 3]) {
      const padded = String(n).padStart(2, '0')
      await expect(
        page.getByText(`FILE Nº ${padded} · CASE FILE`, { exact: true })
      ).toBeVisible()
    }
  })

  test('ArchPillarBlock: `LAYER Nº 01 · BACKBONE` / `LAYER Nº 02 · DISCIPLINE` / `LAYER Nº 03 · ASSURANCE` visible (exact)', async ({ page }) => {
    await page.goto('/about')
    const layerLabels = [
      'LAYER Nº 01 · BACKBONE',
      'LAYER Nº 02 · DISCIPLINE',
      'LAYER Nº 03 · ASSURANCE',
    ] as const
    for (const label of layerLabels) {
      await expect(page.getByText(label, { exact: true })).toBeVisible()
    }
  })
})

// AC-022-FOOTER-REGRESSION deleted per K-034 §PM ruling on BQ-034-P1-01 — Sacred retired per §1.4 Pencil SSOT verdict
// The K-022 A-7 italic+underline styling plus `Let's talk →` / `Or see the source:` strings on /about
// are retired because Pencil frames 86psQ + 1BGtd show plain-text inline Footer with no anchors.
// Footer content is now validated by shared-components.spec.ts AC-034-P1-ROUTE-DOM-PARITY (byte-identical).

// AC-022-ANNOTATION retired per K-034 §5 drift D-4 — POSITION/BEHAVIOUR marginalia removed;
// Pencil SSOT 8mqwX has no such labels. Role cards now carry FILE Nº 0N · PERSONNEL via FileNoBar.

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
    await expect(cards).toHaveCount(6)  // auto-wait + count gate before evaluateAll (K-049 N-1 — symmetric with sibling at line 341 under React.lazy chunk-load race)
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
// Then:  #architecture is immediately followed by Footer (no banner-showcase between)
//
// DOM-target update per K-034 Phase 1 §4.3 — the <SectionContainer id="footer-cta">
// wrapper was removed so /about Footer renders as a full-bleed sibling matching
// / + /business-logic layout (Pencil frames 86psQ + 1BGtd). The K-031 behavioral
// invariant (no banner-showcase between architecture and Footer) is preserved;
// the target element changes from `#footer-cta` div to `<footer>` element.

test.describe('AC-031-LAYOUT-CONTINUITY — Footer immediately follows architecture', () => {
  test('#architecture nextElementSibling is <footer> and banner-showcase absent', async ({ page }) => {
    await page.goto('/about')

    // Both neighbours present and visible
    await expect(page.locator('#architecture')).toBeVisible()
    await expect(page.locator('footer').last()).toBeVisible()

    // Banner-showcase does not exist between them (or anywhere)
    await expect(page.locator('#banner-showcase')).toHaveCount(0)

    // DOM-order adjacency: architecture's nextElementSibling is the <footer> tag
    const nextSiblingTag = await page.evaluate(
      () => document.getElementById('architecture')?.nextElementSibling?.tagName?.toLowerCase() ?? null
    )
    expect(nextSiblingTag).toBe('footer')
  })
})

// ── AC-029-ARCH-BODY-TEXT ─────────────────────────────────────────────────────
// Given: user visits /about
// When:  page scrolls to Project Architecture section (Nº 05)
// Then:  3 ArchPillarBlock body + 3 pyramid <li> detail + 3 layer span = 9 assertions
// DOM enumeration (design doc §13): arch-pillar-body × 3 (one per pillar),
// arch-pillar-layer × 3 (Unit/Integration/E2E in Pillar 3's testingPyramid only;
// Pillars 1 & 2 have no testingPyramid prop).

test.describe('AC-029-ARCH-BODY-TEXT — ArchPillarBlock paper palette text', () => {
  const PAPER_ALLOW = ['rgb(26, 24, 20)', 'rgb(42, 37, 32)', 'rgb(107, 95, 78)']
  const DISALLOW_ARCH = ['rgb(209, 213, 219)', 'rgb(156, 163, 175)', 'rgb(107, 114, 128)']

  test('body color on all 3 pillars is paper palette (allow-list, not gray-300/400/500)', async ({ page }) => {
    await page.goto('/about')
    const bodies = page.getByTestId('arch-pillar-body')
    await expect(bodies).toHaveCount(3)
    for (let i = 0; i < 3; i++) {
      const color = await bodies.nth(i).evaluate(el => getComputedStyle(el).color)
      expect(PAPER_ALLOW).toContain(color)
      expect(DISALLOW_ARCH).not.toContain(color)
    }
  })

  test('pyramid <li> detail is strict text-muted rgb(107, 95, 78) on all 3 layers', async ({ page }) => {
    await page.goto('/about')
    // pyramid layer span × 3 (Unit/Integration/E2E in Pillar 3 only); parent <li> is the detail row.
    const layers = page.getByTestId('arch-pillar-layer')
    await expect(layers).toHaveCount(3)
    for (let i = 0; i < 3; i++) {
      const liColor = await layers.nth(i).evaluate(el => {
        const li = el.closest('li')
        return li ? getComputedStyle(li).color : ''
      })
      expect(liColor).toBe('rgb(107, 95, 78)')
    }
  })

  test('pyramid layer span is strict text-ink rgb(26, 24, 20) on all 3 layers', async ({ page }) => {
    await page.goto('/about')
    const layers = page.getByTestId('arch-pillar-layer')
    await expect(layers).toHaveCount(3)
    for (let i = 0; i < 3; i++) {
      const color = await layers.nth(i).evaluate(el => getComputedStyle(el).color)
      expect(color).toBe('rgb(26, 24, 20)')
    }
  })
})

// ── AC-029-TICKET-BODY-TEXT ───────────────────────────────────────────────────
// Given: user visits /about
// When:  page scrolls to Anatomy of a Ticket section (Nº 04)
// Then:  3 body + 3 Outcome + 3 Learning + 3 badge = 12 assertions
// DOM enumeration: ticket-anatomy-body × 3, ticket-anatomy-id-badge × 3
// (one per TicketAnatomyCard, 3 cards rendered via .map).

test.describe('AC-029-TICKET-BODY-TEXT — TicketAnatomyCard paper palette text', () => {
  const PAPER_ALLOW = ['rgb(26, 24, 20)', 'rgb(42, 37, 32)', 'rgb(107, 95, 78)']
  const DISALLOW_TICKET = ['rgb(156, 163, 175)', 'rgb(107, 114, 128)']
  const DISALLOW_BADGE = 'rgb(196, 181, 253)' // purple-400

  test('body color on all 3 TicketAnatomyCards is paper palette (allow-list, not gray-400/500)', async ({ page }) => {
    await page.goto('/about')
    const bodies = page.getByTestId('ticket-anatomy-body')
    await expect(bodies).toHaveCount(3)
    for (let i = 0; i < 3; i++) {
      const color = await bodies.nth(i).evaluate(el => getComputedStyle(el).color)
      expect(PAPER_ALLOW).toContain(color)
      expect(DISALLOW_TICKET).not.toContain(color)
    }
  })

  test('Outcome label on all 3 cards is paper palette and not gray-500', async ({ page }) => {
    await page.goto('/about')
    const bodies = page.getByTestId('ticket-anatomy-body')
    await expect(bodies).toHaveCount(3)
    for (let i = 0; i < 3; i++) {
      const label = bodies.nth(i).locator('span', { hasText: 'Outcome' })
      await expect(label).toHaveCount(1)
      const color = await label.evaluate(el => getComputedStyle(el).color)
      expect(PAPER_ALLOW).toContain(color)
      expect(color).not.toBe('rgb(107, 114, 128)')
    }
  })

  test('Learning label on all 3 cards is paper palette and not gray-500', async ({ page }) => {
    await page.goto('/about')
    const bodies = page.getByTestId('ticket-anatomy-body')
    await expect(bodies).toHaveCount(3)
    for (let i = 0; i < 3; i++) {
      const label = bodies.nth(i).locator('span', { hasText: 'Learning' })
      await expect(label).toHaveCount(1)
      const color = await label.evaluate(el => getComputedStyle(el).color)
      expect(PAPER_ALLOW).toContain(color)
      expect(color).not.toBe('rgb(107, 114, 128)')
    }
  })

  // ticket-anatomy-id-badge target shifted to FileNoBar trailing slot post-K-034 Phase 2; assertion still valid via DOM lookup (sr-only span preserves strict charcoal color per AC-029; K-034 Phase 2 §4.8 M-1; TD-K034-P2-17).
  test('ticket ID badge on all 3 cards is strict text-charcoal rgb(42, 37, 32) and not purple-400', async ({ page }) => {
    await page.goto('/about')
    const badges = page.getByTestId('ticket-anatomy-id-badge')
    await expect(badges).toHaveCount(3)
    for (let i = 0; i < 3; i++) {
      const color = await badges.nth(i).evaluate(el => getComputedStyle(el).color)
      expect(color).toBe('rgb(42, 37, 32)')
      expect(color).not.toBe(DISALLOW_BADGE)
    }
  })
})
