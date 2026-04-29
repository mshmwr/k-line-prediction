import { test, expect, type Route } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Playwright's ESM loader requires explicit `with { type: 'json' }` import attributes
// under Node ≥20 (TypeError: "needs an import attribute of type 'json'"). esbuild
// transform does not synthesize these at runtime, so use sync readFileSync + JSON.parse
// for the static visual-spec SSOT — equivalent semantics, compatible with the loader.
const __here = dirname(fileURLToPath(import.meta.url))
const spec = JSON.parse(
  readFileSync(join(__here, '..', '..', 'docs', 'designs', 'K-024-visual-spec.json'), 'utf-8'),
) as {
  frames: Array<{
    id: string
    components: SpecComponent[]
  }>
}

// Loose visual-spec component shape — only `role` is strongly typed; all other
// accessors use field-level casts (e.g. `marker.shape as {...}`) which already
// exist in the suite. Keeping this permissive avoids coupling the spec loader
// to the evolving visual-spec.json schema.
type SpecComponent = {
  role: string
  color?: string
  text?: string
  font?: unknown
  layout?: { width?: number } & Record<string, unknown>
  shape?: unknown
  [k: string]: unknown
}

// K-024 Phase 3 — /diary E2E coverage (design §7.3).
// Tests reference visual-spec.json roles for CSS assertions; no hardcoded
// hex/px literals. Fixtures live under _fixtures/diary/*.json.
//
// Structure (design §7.3 table):
//   T-D1..T-D9 — AC-024-DIARY-PAGE-CURATION (9)
//   T-T1..T-T6 — AC-024-TIMELINE-STRUCTURE (6)
//   T-E1..T-E6 — AC-024-ENTRY-LAYOUT (6)
//   T-P1..T-P3 — AC-024-PAGE-HERO (3)
//   T-C1..T-C5 — AC-024-CONTENT-WIDTH (5)
//   T-L1..T-L5 — AC-024-LOADING-ERROR-PRESERVED (ticket L478 supplementation, 6)
//   Total: 35

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgb(${r}, ${g}, ${b})`
}

// Visual-spec wiDSi (/diary) frame → roles
const diaryFrame = spec.frames.find((f) => f.id === 'wiDSi')!
const heroTitle = diaryFrame.components.find((c) => c.role === 'hero-title')!
const heroDivider = diaryFrame.components.find((c) => c.role === 'hero-divider')!
const heroSubtitle = diaryFrame.components.find((c) => c.role === 'hero-subtitle')!
const rail = diaryFrame.components.find((c) => c.role === 'rail')!
const marker = diaryFrame.components.find((c) => c.role === 'marker')!
const entryTitle = diaryFrame.components.find((c) => c.role === 'entry-title')!
const entryDate = diaryFrame.components.find((c) => c.role === 'entry-date')!
const entryBody = diaryFrame.components.find((c) => c.role === 'entry-body')!

async function mockDiaryBody(route: Route, body: unknown): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

async function loadFixture(filename: string): Promise<unknown> {
  const { readFile } = await import('node:fs/promises')
  const { fileURLToPath } = await import('node:url')
  const { dirname, join } = await import('node:path')
  const here = dirname(fileURLToPath(import.meta.url))
  const raw = await readFile(join(here, '_fixtures', 'diary', filename), 'utf-8')
  return JSON.parse(raw)
}

// ════════════════════════════════════════════════════════════════════════════
// AC-024-DIARY-PAGE-CURATION (T-D1..T-D9)
// ════════════════════════════════════════════════════════════════════════════

test.describe('DiaryPage — AC-024-DIARY-PAGE-CURATION', () => {
  test('T-D1: 5 initial entries rendered when fixture has exactly 5', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const fixture = await loadFixture('diary-five.json')
    await page.route('**/diary.json', (route) => mockDiaryBody(route, fixture))
    await page.goto('/diary')

    const entries = page.locator('[data-testid="diary-entry"]')
    await expect(entries).toHaveCount(5)
    // No sentinel when entry count = initial page size (hasMore=false)
    await expect(page.locator('[data-testid="diary-sentinel"]')).toHaveCount(0)
  })

  test('T-D2: Scroll sentinel into view reveals +5 entries when fixture has > 5', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const fixture = await loadFixture('diary-ten.json')
    await page.route('**/diary.json', (route) => mockDiaryBody(route, fixture))
    await page.goto('/diary')

    const entries = page.locator('[data-testid="diary-entry"]')
    await expect(entries).toHaveCount(5)

    const sentinel = page.locator('[data-testid="diary-sentinel"]')
    await expect(sentinel).toHaveCount(1)
    await sentinel.scrollIntoViewIfNeeded()

    await expect(entries).toHaveCount(10)
    // 10 of 10 rendered → sentinel gone (hasMore=false)
    await expect(sentinel).toHaveCount(0)
  })

  test('T-D3: 0-entry empty state renders diary-empty', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const fixture = await loadFixture('diary-empty.json')
    await page.route('**/diary.json', (route) => mockDiaryBody(route, fixture))
    await page.goto('/diary')

    await expect(page.locator('[data-testid="diary-empty"]')).toBeVisible()
    await expect(page.locator('[data-testid="diary-empty"]')).toHaveText(/No entries yet\. Check back soon\./)
    await expect(page.locator('[data-testid="diary-entry"]')).toHaveCount(0)
    await expect(page.locator('[data-testid="diary-sentinel"]')).toHaveCount(0)
  })

  test('T-D4: 1-entry boundary — no Load more button', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const fixture = await loadFixture('diary-one.json')
    await page.route('**/diary.json', (route) => mockDiaryBody(route, fixture))
    await page.goto('/diary')

    await expect(page.locator('[data-testid="diary-entry"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="diary-sentinel"]')).toHaveCount(0)
  })

  test('T-D5: 3-entry boundary — all rendered, no Load more', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const fixture = await loadFixture('diary-three.json')
    await page.route('**/diary.json', (route) => mockDiaryBody(route, fixture))
    await page.goto('/diary')

    await expect(page.locator('[data-testid="diary-entry"]')).toHaveCount(3)
    await expect(page.locator('[data-testid="diary-sentinel"]')).toHaveCount(0)
  })

  test('T-D6: 5-entry boundary — all rendered, no Load more', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const fixture = await loadFixture('diary-five.json')
    await page.route('**/diary.json', (route) => mockDiaryBody(route, fixture))
    await page.goto('/diary')

    await expect(page.locator('[data-testid="diary-entry"]')).toHaveCount(5)
    await expect(page.locator('[data-testid="diary-sentinel"]')).toHaveCount(0)
  })

  test('T-D7: 10-entry fixture — one scroll trigger then sentinel gone', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const fixture = await loadFixture('diary-ten.json')
    await page.route('**/diary.json', (route) => mockDiaryBody(route, fixture))
    await page.goto('/diary')

    const entries = page.locator('[data-testid="diary-entry"]')
    const sentinel = page.locator('[data-testid="diary-sentinel"]')

    await expect(entries).toHaveCount(5)
    await expect(sentinel).toHaveCount(1)
    await sentinel.scrollIntoViewIfNeeded()
    await expect(entries).toHaveCount(10)
    await expect(sentinel).toHaveCount(0)
  })

  test('T-D8: 11-entry fixture — two scroll triggers reveal all, sentinel then gone', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const fixture = await loadFixture('diary-eleven.json')
    await page.route('**/diary.json', (route) => mockDiaryBody(route, fixture))
    await page.goto('/diary')

    const entries = page.locator('[data-testid="diary-entry"]')
    const sentinel = page.locator('[data-testid="diary-sentinel"]')

    await expect(entries).toHaveCount(5)
    await expect(sentinel).toHaveCount(1)
    await sentinel.scrollIntoViewIfNeeded()
    await expect(entries).toHaveCount(10)
    // Sentinel still present (11 entries, 10 visible, 1 remaining)
    await expect(sentinel).toHaveCount(1)
    await sentinel.scrollIntoViewIfNeeded()
    await expect(entries).toHaveCount(11)
    await expect(sentinel).toHaveCount(0)
  })

  test('T-D9: rapid double-fire on sentinel onVisible advances +5 only once', async ({ page }) => {
    // Fixture: 11 entries. Initial visible=5. Two synchronous onVisible() calls
    // in the same JS tick (via page.evaluate + __onVisible test hook, bypassing
    // IntersectionObserver timing):
    //   - With useDiaryPagination inFlightRef gate  → first +5 → 10, second gated → 10.
    //   - Without gate                              → first +5 → 10, second +5 capped → 11.
    // Asserting count === 10 (NOT 11) is the only way to distinguish gated from
    // ungated behaviour; a 10-entry fixture would yield 10 either way.
    // 11 is the minimum fixture size that surfaces the gate.
    // Dry-run verified 2026-04-22 (K-024 R2 I-3): commenting out the
    // `if (inFlightRef.current) return` guard → count=11 → test flips red.
    // Restoring the guard → count=10 → test passes.
    await page.setViewportSize({ width: 1280, height: 800 })
    const fixture = await loadFixture('diary-double-click.json')
    await page.route('**/diary.json', (route) => mockDiaryBody(route, fixture))
    await page.goto('/diary')

    const entries = page.locator('[data-testid="diary-entry"]')
    const sentinel = page.locator('[data-testid="diary-sentinel"]')

    await expect(entries).toHaveCount(5)
    await expect(sentinel).toHaveCount(1)

    // Call onVisible twice in the SAME microtask via the __onVisible test hook
    // attached to the sentinel div. This bypasses IntersectionObserver timing
    // and lets us observe the inFlightRef concurrency gate synchronously.
    await page.evaluate(() => {
      const el = document.querySelector<HTMLDivElement & { __onVisible?: () => void }>(
        '[data-testid="diary-sentinel"]',
      )
      if (!el) throw new Error('diary-sentinel missing')
      if (!el.__onVisible) throw new Error('diary-sentinel __onVisible hook missing')
      el.__onVisible()
      el.__onVisible()
    })
    await expect(entries).toHaveCount(10)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// AC-024-TIMELINE-STRUCTURE (T-T1..T-T6)
// ════════════════════════════════════════════════════════════════════════════

test.describe('DiaryPage — AC-024-TIMELINE-STRUCTURE', () => {
  test('T-T1: no <details> / <summary> elements (negative — no accordion)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/diary')
    await expect(page.locator('details, summary')).toHaveCount(0)
  })

  test('T-T2: no divide-y class on any element (negative — old divider gone)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/diary')
    await expect(page.locator('[class*="divide-y"]')).toHaveCount(0)
  })

  test('T-T3: no milestone wrapper class (negative — old milestone wrapper gone)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/diary')
    await expect(page.locator('[class*="milestone"]')).toHaveCount(0)
  })

  test('T-T4: rail backgroundColor + width + height > 0 + positioned inside timeline', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const fixture = await loadFixture('diary-five.json')
    await page.route('**/diary.json', (route) => mockDiaryBody(route, fixture))
    await page.goto('/diary')

    const railEl = page.locator('[data-testid="diary-rail"]')
    await expect(railEl).toBeVisible()
    await expect(railEl).toHaveCSS('background-color', hexToRgb(rail.color))
    await expect(railEl).toHaveCSS('width', `${rail.layout.width}px`)

    // Design §6.5 / visual-spec: rail is absolute-positioned inside <ol> with
    // top=40px / bottom=40px insets (intentional whitespace past the first/last
    // markers — rail does NOT fully cover marker centers by design). The
    // meaningful invariant here is: rail has non-zero height AND overlaps the
    // timeline's vertical extent.
    const railBox = await railEl.boundingBox()
    expect(railBox).not.toBeNull()
    expect(railBox!.height).toBeGreaterThan(0)

    const entries = page.locator('[data-testid="diary-entry"]')
    const count = await entries.count()
    const firstBox = await entries.first().boundingBox()
    const lastBox = await entries.nth(count - 1).boundingBox()
    expect(firstBox).not.toBeNull()
    expect(lastBox).not.toBeNull()
    const timelineTop = firstBox!.y
    const timelineBottom = lastBox!.y + lastBox!.height
    // Rail must be vertically inside the timeline's [top, bottom] span
    expect(railBox!.y).toBeGreaterThanOrEqual(timelineTop - 2)
    expect(railBox!.y + railBox!.height).toBeLessThanOrEqual(timelineBottom + 2)
  })

  test('T-T5: marker count dynamically equals entry count (after scroll trigger)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const fixture = await loadFixture('diary-ten.json')
    await page.route('**/diary.json', (route) => mockDiaryBody(route, fixture))
    await page.goto('/diary')

    const entries = page.locator('[data-testid="diary-entry"]')
    const markers = page.locator('[data-testid="diary-marker"]')

    await expect(entries).toHaveCount(5)
    await expect(markers).toHaveCount(5)

    await page.locator('[data-testid="diary-sentinel"]').scrollIntoViewIfNeeded()
    await expect(entries).toHaveCount(10)
    await expect(markers).toHaveCount(10)
  })

  test('T-T6: marker CSS backgroundColor + width + height + borderRadius from visual-spec', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const fixture = await loadFixture('diary-five.json')
    await page.route('**/diary.json', (route) => mockDiaryBody(route, fixture))
    await page.goto('/diary')

    const markers = page.locator('[data-testid="diary-marker"]')
    const firstMarker = markers.first()
    await expect(firstMarker).toBeVisible()

    const markerShape = marker.shape as { cornerRadius: number; size: [number, number] }
    await expect(firstMarker).toHaveCSS('background-color', hexToRgb(marker.color))
    await expect(firstMarker).toHaveCSS('width', `${markerShape.size[0]}px`)
    await expect(firstMarker).toHaveCSS('height', `${markerShape.size[1]}px`)
    await expect(firstMarker).toHaveCSS('border-radius', `${markerShape.cornerRadius}px`)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// AC-024-ENTRY-LAYOUT (T-E1..T-E6)
// ════════════════════════════════════════════════════════════════════════════

test.describe('DiaryPage — AC-024-ENTRY-LAYOUT', () => {
  test('T-E1: DOM order title → date → body inside each entry', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const fixture = await loadFixture('diary-five.json')
    await page.route('**/diary.json', (route) => mockDiaryBody(route, fixture))
    await page.goto('/diary')

    const firstEntry = page.locator('[data-testid="diary-entry"]').first()
    await expect(firstEntry).toBeVisible()

    // compareDocumentPosition check via evaluate
    const ordered = await firstEntry.evaluate((el) => {
      const h2 = el.querySelector('h2')
      const time = el.querySelector('time')
      const p = el.querySelector('p')
      if (!h2 || !time || !p) return false
      const titleBeforeDate = !!(h2.compareDocumentPosition(time) & Node.DOCUMENT_POSITION_FOLLOWING)
      const dateBeforeBody = !!(time.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING)
      return titleBeforeDate && dateBeforeBody
    })
    expect(ordered).toBe(true)
  })

  test('T-E2: entry-title with ticketId matches /^K-\\d{3} \\u2014 .+$/ regex', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const fixture = await loadFixture('diary-five.json')
    await page.route('**/diary.json', (route) => mockDiaryBody(route, fixture))
    await page.goto('/diary')

    const firstEntryTitle = page.locator('[data-testid="diary-entry"] h2').first()
    const text = await firstEntryTitle.textContent()
    expect(text).not.toBeNull()
    expect(text!).toMatch(/^K-\d{3} — .+$/)
  })

  test('T-E3: entry-title does NOT use middle-dot (U+00B7) as ticketId separator', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const fixture = await loadFixture('diary-five.json')
    await page.route('**/diary.json', (route) => mockDiaryBody(route, fixture))
    await page.goto('/diary')

    const firstEntryTitle = page.locator('[data-testid="diary-entry"] h2').first()
    const text = await firstEntryTitle.textContent()
    expect(text).not.toBeNull()
    expect(text!).not.toMatch(/^K-\d{3} · /)
  })

  test('T-E4: entry-title does NOT use hyphen-minus (U+002D) as ticketId separator', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const fixture = await loadFixture('diary-five.json')
    await page.route('**/diary.json', (route) => mockDiaryBody(route, fixture))
    await page.goto('/diary')

    const firstEntryTitle = page.locator('[data-testid="diary-entry"] h2').first()
    const text = await firstEntryTitle.textContent()
    expect(text).not.toBeNull()
    expect(text!).not.toMatch(/^K-\d{3} - /)
  })

  test('T-E5: no ticketId — title textContent does not start with K-\\d{3}', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    // Mock fixture with one entry lacking ticketId
    await page.route('**/diary.json', (route) =>
      mockDiaryBody(route, [
        { title: 'Plain title without ticketId', date: '2026-04-20', text: 'Body.' },
      ]),
    )
    await page.goto('/diary')

    const onlyEntryTitle = page.locator('[data-testid="diary-entry"] h2').first()
    const text = await onlyEntryTitle.textContent()
    expect(text).not.toBeNull()
    expect(text!).not.toMatch(/^K-\d{3}/)
    expect(text!).toBe('Plain title without ticketId')
  })

  test('T-E6: entry-title / entry-date / entry-body CSS computed from visual-spec roles', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const fixture = await loadFixture('diary-five.json')
    await page.route('**/diary.json', (route) => mockDiaryBody(route, fixture))
    await page.goto('/diary')

    const firstEntry = page.locator('[data-testid="diary-entry"]').first()
    const titleEl = firstEntry.locator('h2')
    const dateEl = firstEntry.locator('time')
    const bodyEl = firstEntry.locator('p')

    // entry-title
    const titleFont = entryTitle.font as { family: string; size: number; style: string; weight: number }
    await expect(titleEl).toHaveCSS('font-family', new RegExp(titleFont.family.replace(' ', '[\\s_]?')))
    await expect(titleEl).toHaveCSS('font-size', `${titleFont.size}px`)
    await expect(titleEl).toHaveCSS('font-style', titleFont.style)
    await expect(titleEl).toHaveCSS('font-weight', `${titleFont.weight}`)
    await expect(titleEl).toHaveCSS('color', hexToRgb(entryTitle.color))

    // entry-date
    const dateFont = entryDate.font as { family: string; size: number; letterSpacing: number }
    await expect(dateEl).toHaveCSS('font-family', new RegExp(dateFont.family.replace(' ', '[\\s_]?')))
    await expect(dateEl).toHaveCSS('font-size', `${dateFont.size}px`)
    await expect(dateEl).toHaveCSS('color', hexToRgb(entryDate.color))
    // I-5 (R2 2026-04-22): catchall previously omitted letter-spacing. Spec
    // letterSpacing is expressed in px (Pencil unit); tracking-[1px] in
    // DiaryEntryV2 matches. Previous `tracking-wide` resolved to 0.3px at
    // 12px font size — off-spec.
    await expect(dateEl).toHaveCSS('letter-spacing', `${dateFont.letterSpacing}px`)

    // entry-body
    const bodyFont = entryBody.font as {
      family: string
      size: number
      style: string
      weight: string | number
      lineHeight: number
    }
    await expect(bodyEl).toHaveCSS('font-family', new RegExp(bodyFont.family.replace(' ', '[\\s_]?')))
    await expect(bodyEl).toHaveCSS('font-size', `${bodyFont.size}px`)
    await expect(bodyEl).toHaveCSS('font-style', bodyFont.style)
    await expect(bodyEl).toHaveCSS('color', hexToRgb(entryBody.color))
    // I-5 (R2 2026-04-22): catchall previously omitted font-weight + line-height.
    // Visual-spec weight "normal" maps to CSS computed font-weight "400";
    // keywords other than "normal" (e.g., "bold") would map to "700". Guard
    // both shapes explicitly.
    const expectedWeight =
      typeof bodyFont.weight === 'number'
        ? String(bodyFont.weight)
        : bodyFont.weight === 'bold'
          ? '700'
          : '400' // "normal" / "lighter" / others default to 400 for body text
    await expect(bodyEl).toHaveCSS('font-weight', expectedWeight)
    // line-height in Pencil is a unitless multiplier (1.55) → browsers compute
    // it as `lineHeight × fontSize` px. K-024: 1.55 × 18 = 27.9px (IEEE-754
    // residue 27.900000000000002 → .toFixed(1) = "27.9"). K-040: body size
    // flipped 18→15, 1.55 × 15 = 23.25 exact (no residue) — browser returns
    // "23.25px" literal. Normalise via computed-style roundtrip so either
    // integer or 2-decimal forms match without hand-picking toFixed precision.
    const computedLineHeight = await bodyEl.evaluate(
      (el) => getComputedStyle(el as HTMLElement).lineHeight,
    )
    const expectedRaw = bodyFont.lineHeight * bodyFont.size
    // Browser emits shortest roundtrip representation (e.g. "23.25px" or
    // "27.9px"). Parse computed, assert equivalence within 0.01px.
    const computedPx = parseFloat(computedLineHeight)
    expect(Math.abs(computedPx - expectedRaw)).toBeLessThan(0.01)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// AC-024-PAGE-HERO (T-P1..T-P3)
// ════════════════════════════════════════════════════════════════════════════

test.describe('DiaryPage — AC-024-PAGE-HERO', () => {
  test('T-P1: hero-title text + font + color from visual-spec', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/diary')

    const h1 = page.getByRole('heading', { level: 1, name: 'Dev Diary', exact: true })
    await expect(h1).toBeVisible()
    await expect(h1).toHaveText(heroTitle.text!)

    const titleFont = heroTitle.font as { family: string; size: number; style: string; weight: number }
    await expect(h1).toHaveCSS('font-family', new RegExp(titleFont.family.replace(' ', '[\\s_]?')))
    await expect(h1).toHaveCSS('font-size', `${titleFont.size}px`)
    await expect(h1).toHaveCSS('font-style', titleFont.style)
    await expect(h1).toHaveCSS('color', hexToRgb(heroTitle.color))
  })

  test('T-P2: hero-subtitle text + font + color from visual-spec', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/diary')

    const subtitle = page.getByText(heroSubtitle.text!, { exact: true })
    await expect(subtitle).toBeVisible()

    const subFont = heroSubtitle.font as { family: string; size: number; style: string }
    await expect(subtitle).toHaveCSS('font-family', new RegExp(subFont.family.replace(' ', '[\\s_]?')))
    await expect(subtitle).toHaveCSS('font-size', `${subFont.size}px`)
    await expect(subtitle).toHaveCSS('font-style', subFont.style)
    await expect(subtitle).toHaveCSS('color', hexToRgb(heroSubtitle.color))
  })

  test('T-P3: hero-divider backgroundColor from visual-spec', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/diary')

    // Hero <hr> is the only role=separator at the top of main
    const divider = page.locator('main hr[role="separator"]').first()
    await expect(divider).toBeVisible()
    await expect(divider).toHaveCSS('background-color', hexToRgb(heroDivider.color))
  })
})

// ════════════════════════════════════════════════════════════════════════════
// AC-024-CONTENT-WIDTH (T-C1..T-C5)
// ════════════════════════════════════════════════════════════════════════════

test.describe('DiaryPage — AC-024-CONTENT-WIDTH', () => {
  test('T-C1: 1920px viewport — content maxWidth = 1248px', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/diary')

    const main = page.locator('[data-testid="diary-main"]')
    await expect(main).toHaveCSS('max-width', '1248px')
  })

  test('T-C2: 1440px viewport — content maxWidth = 1248px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/diary')

    const main = page.locator('[data-testid="diary-main"]')
    await expect(main).toHaveCSS('max-width', '1248px')
  })

  test('T-C3: 1248px boundary — content maxWidth = 1248px, no overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1248, height: 800 })
    await page.goto('/diary')

    const main = page.locator('[data-testid="diary-main"]')
    await expect(main).toHaveCSS('max-width', '1248px')

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }))
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth)
  })

  test('T-C4: 800 / 1024 / 1200 viewports — no horizontal overflow', async ({ page }) => {
    for (const width of [800, 1024, 1200]) {
      await page.setViewportSize({ width, height: 800 })
      await page.goto('/diary')

      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }))
      expect(overflow.scrollWidth, `viewport ${width}: scrollWidth ${overflow.scrollWidth} > innerWidth ${overflow.innerWidth}`).toBeLessThanOrEqual(overflow.innerWidth)
    }
  })

  test('T-C5: 390px mobile viewport — no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/diary')

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }))
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth)
  })

  test('T-C6: 390px mobile — DiaryMarker + DiaryRail computed display !== none on /diary (K-041)', async ({ page }) => {
    // K-041 — AC-024-CONTENT-WIDTH rewrite: /diary mobile rail/marker visible.
    // DiaryRail + DiaryMarker accept `mobileVisible` prop; DiaryTimeline +
    // DiaryEntryV2 pass `mobileVisible` so /diary mobile breakpoint renders
    // rail + marker. Asserting `not.toHaveCSS('display', 'none')` so a
    // future regression (someone dropping `mobileVisible` prop, or flipping
    // default back) is caught.
    //
    // Homepage always visible on mobile via same prop (K-028 Sacred preserved
    // in diary-homepage.spec.ts — orthogonal).
    await page.setViewportSize({ width: 390, height: 844 })
    const fixture = await loadFixture('diary-five.json')
    await page.route('**/diary.json', (route) => mockDiaryBody(route, fixture))
    await page.goto('/diary')

    const markers = page.locator('[data-testid="diary-marker"]')
    await expect(markers).toHaveCount(5)
    await expect(markers.first()).not.toHaveCSS('display', 'none')

    const railEl = page.locator('[data-testid="diary-rail"]')
    await expect(railEl).not.toHaveCSS('display', 'none')
  })
})

// ════════════════════════════════════════════════════════════════════════════
// AC-024-LOADING-ERROR-PRESERVED (T-L1..T-L5 per ticket L478 supplementation)
// ════════════════════════════════════════════════════════════════════════════

test.describe('DiaryPage — AC-024-LOADING-ERROR-PRESERVED', () => {
  test('T-L1: slow-network — diary-loading visible with role/label/text, then entries appear', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const fixture = await loadFixture('diary-three.json')
    await page.route('**/diary.json', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 300))
      await mockDiaryBody(route, fixture)
    })

    const navigationPromise = page.goto('/diary')
    const loading = page.locator('[data-testid="diary-loading"]')
    await expect(loading).toBeVisible()
    await expect(loading).toHaveAttribute('role', 'status')
    await expect(loading).toHaveAttribute('aria-label', 'Loading diary entries')
    await expect(loading).toHaveText(/Loading diary/)
    // Error / entry / empty not visible during loading
    await expect(page.locator('[data-testid="diary-error"]')).toHaveCount(0)
    await expect(page.locator('[data-testid="diary-entry"]')).toHaveCount(0)
    await expect(page.locator('[data-testid="diary-empty"]')).toHaveCount(0)

    await navigationPromise
    await expect(page.locator('[data-testid="diary-entry"]').first()).toBeVisible()
    await expect(page.locator('[data-testid="diary-loading"]')).toHaveCount(0)
  })

  test('T-L2a: 404 fetch — diary-error visible with role=alert + status-aware message + Retry', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.route('**/diary.json', (route) =>
      route.fulfill({ status: 404, contentType: 'application/json', body: '{}' }),
    )
    await page.goto('/diary')

    const err = page.locator('[data-testid="diary-error"]')
    await expect(err).toBeVisible()
    await expect(err).toHaveAttribute('role', 'alert')
    await expect(err).toContainText('Failed to load diary: 404')

    const retry = err.getByRole('button', { name: 'Retry' })
    await expect(retry).toBeVisible()

    await expect(page.locator('[data-testid="diary-loading"]')).toHaveCount(0)
    await expect(page.locator('[data-testid="diary-entry"]')).toHaveCount(0)
    await expect(page.locator('[data-testid="diary-empty"]')).toHaveCount(0)
  })

  test('T-L2b: 500 fetch — diary-error with status-aware message', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.route('**/diary.json', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }),
    )
    await page.goto('/diary')

    const err = page.locator('[data-testid="diary-error"]')
    await expect(err).toBeVisible()
    await expect(err).toContainText('Failed to load diary: 500')
  })

  test('T-L3: empty — diary-empty visible with literal text', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const fixture = await loadFixture('diary-empty.json')
    await page.route('**/diary.json', (route) => mockDiaryBody(route, fixture))
    await page.goto('/diary')

    const empty = page.locator('[data-testid="diary-empty"]')
    await expect(empty).toBeVisible()
    await expect(empty).toHaveText(/No entries yet\. Check back soon\./)
  })

  test('T-L4: Retry is enabled while error + !loading; disabled during in-flight refetch', async ({ page }) => {
    // AC-024-LOADING-ERROR-PRESERVED (ticket L367, L373) specifies Retry MUST
    // be `disabled` during the refetch in-flight window. useDiary preserves the
    // prior `error` string through the refetch so that <DiaryError> (and its
    // Retry button) remains mounted — disabled state is observable during the
    // loading window, not merely "the button has disappeared" (which would
    // trivially satisfy toBeDisabled without actually gating concurrent
    // clicks). Fix-bundle R2 D-2 (2026-04-22).
    await page.setViewportSize({ width: 1280, height: 800 })
    let firstHit = true
    let secondFetchInFlightResolve: (() => void) | null = null
    await page.route('**/diary.json', async (route) => {
      if (firstHit) {
        firstHit = false
        await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' })
      } else {
        // Hold the second fetch open until the test releases it so that the
        // disabled-state assertion runs against a known in-flight window.
        await new Promise<void>((resolve) => {
          secondFetchInFlightResolve = resolve
        })
        await mockDiaryBody(route, await loadFixture('diary-three.json'))
      }
    })
    await page.goto('/diary')

    const retry = page.locator('[data-testid="diary-error"]').getByRole('button', { name: 'Retry' })
    await expect(retry).toBeVisible()
    await expect(retry).toBeEnabled()

    // Click once; loading begins → retry stays mounted (error preserved through
    // refetch per useDiary L33 comment) but becomes `disabled` while loading.
    await retry.click()
    await expect(page.locator('[data-testid="diary-loading"]')).toBeVisible()
    // Retry button still in DOM (DiaryError not unmounted) and now disabled
    // because `loading === true`.
    await expect(retry).toBeVisible()
    await expect(retry).toBeDisabled()

    // Release the in-flight fetch → refetch resolves → error clears, entries
    // render, and DiaryError (and thus Retry) unmount.
    if (!secondFetchInFlightResolve) throw new Error('in-flight resolver missing')
    secondFetchInFlightResolve()
    await expect(page.locator('[data-testid="diary-entry"]').first()).toBeVisible()
    await expect(page.locator('[data-testid="diary-error"]')).toHaveCount(0)
  })

  test('T-L5: long error message — no horizontal overflow + Retry still visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    // Fulfill body with invalid schema to force zod → long error or set status
    // that yields a long message path. We use a synthetic long message via 500
    // with a long body that useDiary will surface as err.message. Simpler: use
    // a schema violation that zod renders into a long string.
    await page.route('**/diary.json', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          // Each entry missing required `text` → zod error message will be long
          { ticketId: 'K-099', title: 'Bad row', date: '2026-04-20' },
        ]),
      }),
    )
    await page.goto('/diary')

    const err = page.locator('[data-testid="diary-error"]')
    await expect(err).toBeVisible()

    const retry = err.getByRole('button', { name: 'Retry' })
    await expect(retry).toBeVisible()

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }))
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// AC-059-INFINITE-SCROLL + AC-059-NO-SENTINEL-WHEN-EXHAUSTED + AC-059-RAPID-SCROLL
// ════════════════════════════════════════════════════════════════════════════

test.describe('DiaryPage — AC-059-INFINITE-SCROLL', () => {
  test('AC-059-INFINITE-SCROLL: scroll sentinel into view reveals more entries', async ({ page }) => {
    // Fixture: 10 entries. Initial batch = 5. Scroll sentinel → 10.
    await page.setViewportSize({ width: 1280, height: 800 })
    const fixture = await loadFixture('diary-ten.json')
    await page.route('**/diary.json', (route) => mockDiaryBody(route, fixture))
    await page.goto('/diary')

    const entries = page.locator('[data-testid="diary-entry"]')
    await expect(entries).toHaveCount(5)

    const sentinel = page.locator('[data-testid="diary-sentinel"]')
    await expect(sentinel).toHaveCount(1)
    await sentinel.scrollIntoViewIfNeeded()

    // After scroll trigger, entry count increases above initial batch
    await expect(entries).toHaveCount(10)
  })

  test('AC-059-NO-SENTINEL-WHEN-EXHAUSTED: sentinel not attached when total entries <= page size', async ({ page }) => {
    // Fixture: 5 entries. All visible on initial render → hasMore=false → no sentinel.
    await page.setViewportSize({ width: 1280, height: 800 })
    const fixture = await loadFixture('diary-five.json')
    await page.route('**/diary.json', (route) => mockDiaryBody(route, fixture))
    await page.goto('/diary')

    const entries = page.locator('[data-testid="diary-entry"]')
    await expect(entries).toHaveCount(5)

    // Sentinel must not be in DOM when all entries are visible
    await expect(page.locator('[data-testid="diary-sentinel"]')).toHaveCount(0)
  })

  test('AC-059-NO-LOAD-MORE-BUTTON: diary-load-more not in DOM', async ({ page }) => {
    await page.goto('/diary')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-testid="diary-load-more"]')).toHaveCount(0)
  })

  test('AC-059-FADE-IN: new entries have transition-opacity duration-300 classes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const fixture = await loadFixture('diary-five.json')
    await page.route('**/diary.json', (route) => mockDiaryBody(route, fixture))
    await page.goto('/diary')
    await page.waitForLoadState('networkidle')
    const entries = page.locator('[data-testid="diary-entry"]')
    const firstEntry = entries.first()
    await expect(firstEntry).toHaveClass(/transition-opacity/)
    await expect(firstEntry).toHaveClass(/duration-300/)
  })

  test('AC-059-PAPER-PALETTE: diary-loading inner container has paper-palette background', async ({ page }) => {
    // DiaryLoading inner container uses bg-[#F4EFE5] (paper-palette rebrand, K-059 §5).
    // Route intercepts diary.json with a 300ms delay to hold loading state visible.
    const fixture = await loadFixture('diary-five.json')
    await page.route('**/diary.json', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 300))
      await mockDiaryBody(route, fixture)
    })
    const navigationPromise = page.goto('/diary')
    const loading = page.locator('[data-testid="diary-loading"]')
    await expect(loading).toBeVisible()
    // Inner card carries the paper-palette background colour
    const innerCard = loading.locator('div').first()
    await expect(innerCard).toHaveCSS('background-color', 'rgb(244, 239, 229)')
    await navigationPromise
  })

  test('AC-059-RAPID-SCROLL: double invocation of onVisible returns +5 only once', async ({ page }) => {
    // Fixture: 11 entries. Two rapid onVisible() calls → gated to +5 → count=10, not 11.
    // Uses same __onVisible test hook as T-D9.
    await page.setViewportSize({ width: 1280, height: 800 })
    const fixture = await loadFixture('diary-double-click.json')
    await page.route('**/diary.json', (route) => mockDiaryBody(route, fixture))
    await page.goto('/diary')

    const entries = page.locator('[data-testid="diary-entry"]')
    const sentinel = page.locator('[data-testid="diary-sentinel"]')

    await expect(entries).toHaveCount(5)
    await expect(sentinel).toHaveCount(1)

    await page.evaluate(() => {
      const el = document.querySelector<HTMLDivElement & { __onVisible?: () => void }>(
        '[data-testid="diary-sentinel"]',
      )
      if (!el) throw new Error('diary-sentinel missing')
      if (!el.__onVisible) throw new Error('diary-sentinel __onVisible hook missing')
      el.__onVisible()
      el.__onVisible()
    })
    // inFlightRef gate ensures only one +5 advance regardless of double-fire
    await expect(entries).toHaveCount(10)
  })
})
