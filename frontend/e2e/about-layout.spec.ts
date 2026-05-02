/**
 * K-045 — /about desktop layout consistency
 *
 * Hosts T1–T17 assertions for ACs:
 *   AC-045-CONTAINER-WIDTH   (T1, T2)
 *   AC-045-SECTION-GAP       (T3, T4)
 *   AC-045-HERO-LINE-COUNT   (T5, T6, T7, T8)
 *   AC-045-SECTION-LABEL-X   (T9, T10, T11)
 *   AC-045-SM-BOUNDARY       (T15, T16, T17)
 *
 * T12/T13 (K-031 adjacency) live in `about-v2.spec.ts:386-403` and are covered
 * by that existing Sacred spec — not re-asserted here to avoid duplication
 * (per design §6.2 Engineer may delegate). T14 DOM-structural sanity is
 * included here as an explicit safety net.
 *
 * T18/T19 (AC-045-FOOTER-WIDTH-PARITY) live in `shared-components.spec.ts`
 * within an AC-045-FOOTER-WIDTH-PARITY describe block — authored alongside
 * this file.
 *
 * Spec pattern follows `pages.spec.ts:436-521` (AC-028-SECTION-SPACING) for
 * section-gap tests and K-024 1248-width assertion for container checks.
 */

import { test, expect } from '@playwright/test'

const SECTION_IDS = ['header', 'metrics', 'where-i-stepped-in', 'role-pipeline', 'roles', 'pillars', 'tickets', 'architecture'] as const

async function sectionBoxes(page: import('@playwright/test').Page) {
  // K-049 Phase 3: AboutPage is now a React.lazy chunk. `page.goto('/about')`
  // resolves when the HTML shell lands; the 6 section DOM nodes arrive only
  // after the chunk loads and React mounts. `evaluateAll` does NOT auto-wait
  // on its source locator, so without this gate the helper snapshots an empty
  // DOM and T1/T3/T9/T11 collapse to `[]`. Wait for the first + last section
  // to attach before measuring — covers both the initial chunk race and any
  // future append-to-list structural edit.
  await page.locator('#header').waitFor({ state: 'attached', timeout: 10_000 })
  await page.locator('#architecture').waitFor({ state: 'attached', timeout: 10_000 })
  return page.locator('#header, #metrics, #where-i-stepped-in, #role-pipeline, #roles, #pillars, #tickets, #architecture').evaluateAll(els =>
    els.map(el => {
      const r = el.getBoundingClientRect()
      const s = window.getComputedStyle(el)
      return {
        id: el.id,
        top: r.top + window.scrollY,
        bottom: r.bottom + window.scrollY,
        left: r.left,
        right: r.right,
        width: r.width,
        paddingLeft: s.paddingLeft,
        paddingRight: s.paddingRight,
        maxWidth: s.maxWidth,
      }
    }),
  )
}

test.describe('AC-045-CONTAINER-WIDTH — /about content container aligns to 1248px + 96/24px horizontal padding', () => {
  test('T1 — desktop 1280×800: every <section> has max-width 1248, padding-left/right 96', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/about')
    const sections = await sectionBoxes(page)
    expect(sections.map(s => s.id)).toEqual([...SECTION_IDS])
    for (const s of sections) {
      expect(s.maxWidth, `${s.id} max-width`).toBe('1248px')
      expect(s.paddingLeft, `${s.id} padding-left`).toBe('96px')
      expect(s.paddingRight, `${s.id} padding-right`).toBe('96px')
      // At 1280 viewport (< 1248 + 2*96 = 1440), the section fills viewport-minus-padding: width = 1248 (max-w capped)
      expect(s.width).toBeGreaterThanOrEqual(1246)
      expect(s.width).toBeLessThanOrEqual(1250)
    }
  })

  test('T2 — mobile 375×667: every <section> has padding-left/right 24 + full viewport width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/about')
    const sections = await sectionBoxes(page)
    for (const s of sections) {
      expect(s.paddingLeft, `${s.id} padding-left`).toBe('24px')
      expect(s.paddingRight, `${s.id} padding-right`).toBe('24px')
      // Width = viewport (375), sections are `w-full`, max-w-[1248px] does not cap below 375
      expect(s.width).toBeGreaterThanOrEqual(373)
      expect(s.width).toBeLessThanOrEqual(377)
    }
  })
})

test.describe('AC-045-SECTION-GAP — /about adjacent-section vertical gap matches Pencil Y80Iv gap:72', () => {
  test('T3 — desktop 1280: each of 5 adjacent pairs has gap 72 ± 2', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/about')
    const sections = await sectionBoxes(page)
    for (let i = 1; i < sections.length; i++) {
      const gap = sections[i].top - sections[i - 1].bottom
      expect(gap, `gap ${sections[i - 1].id}→${sections[i].id}`).toBeGreaterThanOrEqual(70)
      expect(gap).toBeLessThanOrEqual(74)
    }
  })

  test('T4 — mobile 375: each of 5 adjacent pairs has gap 24 ± 2', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/about')
    const sections = await sectionBoxes(page)
    for (let i = 1; i < sections.length; i++) {
      const gap = sections[i].top - sections[i - 1].bottom
      expect(gap, `gap ${sections[i - 1].id}→${sections[i].id}`).toBeGreaterThanOrEqual(22)
      expect(gap).toBeLessThanOrEqual(26)
    }
  })
})

test.describe('AC-045-HERO-LINE-COUNT — /about hero wraps correctly at 1248 content width', () => {
  test('T5 — desktop 1280: hero h1 height ≈ 109.2 ± 2 (two visual lines @ Geist Mono 52px × 1.05)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/about')
    const h1 = page.locator('#header h1').first()
    const box = await h1.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(107)
    expect(box!.height).toBeLessThanOrEqual(112)
  })

  test('T6 — desktop 1280: hero role line single-line height ≈ 24 ± 2', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/about')
    const role = page.getByText('PM, architect, engineer, reviewer, QA, designer.', { exact: true })
    const box = await role.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(22)
    expect(box!.height).toBeLessThanOrEqual(26)
  })

  test('T7 — desktop 1280: hero tagline single-line height ≈ 25.2 ± 2', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/about')
    const tagline = page.getByText('Every feature ships with a doc trail.', { exact: true })
    const box = await tagline.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(23)
    expect(box!.height).toBeLessThanOrEqual(28)
  })

  test('T8 — mobile 375: hero content is non-clipped and tagline sits below h1 (no negative overlap)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/about')
    const h1 = page.locator('#header h1').first()
    const tagline = page.getByText('Every feature ships with a doc trail.', { exact: true })
    const h1Box = await h1.boundingBox()
    const tgBox = await tagline.boundingBox()
    expect(h1Box).not.toBeNull()
    expect(tgBox).not.toBeNull()
    // tagline top must be >= h1 bottom - 1 (allow 1px anti-alias tolerance)
    expect(tgBox!.y).toBeGreaterThanOrEqual(h1Box!.y + h1Box!.height - 1)
    await expect(h1).toBeVisible()
    await expect(tagline).toBeVisible()
  })
})

test.describe('AC-045-SECTION-LABEL-X — section-label left edge anchors to container inner left', () => {
  test('T9 — desktop 1280: all 7 section-labels left-edge = section.left + 96 ± 1', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/about')
    const labelIdPairs: Array<{ parentId: string; label: string }> = [
      { parentId: 'metrics', label: 'Nº 01 — DELIVERY METRICS' },
      { parentId: 'where-i-stepped-in', label: 'Nº 02 — WHERE I STEPPED IN' },
      { parentId: 'role-pipeline', label: 'Nº 03 — THE PIPELINE' },
      { parentId: 'roles', label: 'Nº 04 — THE PERSONNEL' },
      { parentId: 'pillars', label: 'Nº 05 — RELIABILITY' },
      { parentId: 'tickets', label: 'Nº 06 — ANATOMY OF A TICKET' },
      { parentId: 'architecture', label: 'Nº 07 — PROJECT ARCHITECTURE' },
    ]
    for (const { parentId, label } of labelIdPairs) {
      const section = page.locator(`#${parentId}`)
      const labelLoc = page.locator(`#${parentId} [data-testid="section-label"]`).filter({ hasText: label })
      const sectionBox = await section.boundingBox()
      const labelBox = await labelLoc.boundingBox()
      expect(sectionBox, `${parentId} section box`).not.toBeNull()
      expect(labelBox, `${parentId} label box`).not.toBeNull()
      const innerLeft = sectionBox!.x + 96
      expect(Math.abs(labelBox!.x - innerLeft), `${parentId} label x alignment`).toBeLessThanOrEqual(1)
    }
  })

  test('T10 — mobile 375: all 7 section-labels left-edge = section.left + 24 ± 1', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/about')
    const parentIds = ['metrics', 'where-i-stepped-in', 'role-pipeline', 'roles', 'pillars', 'tickets', 'architecture']
    for (const parentId of parentIds) {
      const section = page.locator(`#${parentId}`)
      const labelLoc = page.locator(`#${parentId} [data-testid="section-label"]`).first()
      const sectionBox = await section.boundingBox()
      const labelBox = await labelLoc.boundingBox()
      expect(sectionBox).not.toBeNull()
      expect(labelBox).not.toBeNull()
      const innerLeft = sectionBox!.x + 24
      expect(Math.abs(labelBox!.x - innerLeft), `${parentId} label x alignment @375`).toBeLessThanOrEqual(1)
    }
  })

  test('T11 — desktop 1280: hairline right-edge = section.right - 96 ± 1', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/about')
    const parentIds = ['metrics', 'where-i-stepped-in', 'role-pipeline', 'roles', 'pillars', 'tickets', 'architecture']
    for (const parentId of parentIds) {
      const section = page.locator(`#${parentId}`)
      const hairline = page.locator(`#${parentId} [data-section-hairline]`).first()
      const sectionBox = await section.boundingBox()
      const hairBox = await hairline.boundingBox()
      expect(sectionBox).not.toBeNull()
      expect(hairBox).not.toBeNull()
      const innerRight = sectionBox!.x + sectionBox!.width - 96
      const hairRight = hairBox!.x + hairBox!.width
      expect(Math.abs(hairRight - innerRight), `${parentId} hairline right-edge`).toBeLessThanOrEqual(1)
    }
  })
})

test.describe('AC-045-K031-ADJACENCY-PRESERVED — structural root-child sanity (T14 safety net)', () => {
  test('T14 — all 9 <section> are direct children of root <div class="min-h-screen">, FooterDisclaimer <section> is last child', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/about')
    await page.locator('section#header').waitFor({ state: 'attached', timeout: 10_000 })
    const summary = await page.evaluate(() => {
      const root = document.querySelector('div.min-h-screen')
      if (!root) return { ok: false, reason: 'min-h-screen root not found' }
      const directSectionIds = Array.from(root.children)
        .filter(c => c.tagName.toLowerCase() === 'section')
        .map(c => c.id)
      const lastChildTag = root.lastElementChild?.tagName.toLowerCase() ?? null
      return { ok: true, directSectionIds, lastChildTag }
    })
    expect(summary.ok).toBe(true)
    expect(summary.directSectionIds).toEqual(['header', 'metrics', 'where-i-stepped-in', 'role-pipeline', 'roles', 'pillars', 'tickets', 'architecture', 'disclaimer'])
    expect(summary.lastChildTag).toBe('section')
  })
})

test.describe('AC-045-SM-BOUNDARY — exact 640px breakpoint transition + 1440 Pencil canvas parity', () => {
  test('T15 — viewport 639: padding = 24 (mobile pattern active)', async ({ page }) => {
    await page.setViewportSize({ width: 639, height: 800 })
    await page.goto('/about')
    const pad = await page.locator('#metrics').evaluate(el => {
      const s = window.getComputedStyle(el)
      return { pl: s.paddingLeft, pr: s.paddingRight }
    })
    expect(pad.pl).toBe('24px')
    expect(pad.pr).toBe('24px')
  })

  test('T16 — viewport 640: padding = 96 (sm: breakpoint activates inclusive)', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 800 })
    await page.goto('/about')
    const pad = await page.locator('#metrics').evaluate(el => {
      const s = window.getComputedStyle(el)
      return { pl: s.paddingLeft, pr: s.paddingRight }
    })
    expect(pad.pl).toBe('96px')
    expect(pad.pr).toBe('96px')
  })

  test('T17 — viewport 1440 (Pencil canvas): content centred in 1248 with 96/96 padding', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/about')
    const measure = await page.locator('#metrics').evaluate(el => {
      const r = el.getBoundingClientRect()
      const s = window.getComputedStyle(el)
      return { x: r.x, width: r.width, paddingLeft: s.paddingLeft, maxWidth: s.maxWidth }
    })
    expect(measure.maxWidth).toBe('1248px')
    expect(measure.paddingLeft).toBe('96px')
    // Width capped at 1248 (< 1440 viewport); mx-auto centres → left offset = (1440 - 1248) / 2 = 96
    expect(measure.width).toBeGreaterThanOrEqual(1246)
    expect(measure.width).toBeLessThanOrEqual(1250)
    expect(Math.abs(measure.x - 96)).toBeLessThanOrEqual(1)
  })
})
