import { test, expect, type Route } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Playwright's ESM loader requires explicit `with { type: 'json' }` import attributes
// under Node ≥20. Use sync readFileSync for the static visual-spec SSOT — compatible
// with the loader and semantically identical to a JSON module import.
const __here = dirname(fileURLToPath(import.meta.url))
const spec = JSON.parse(
  readFileSync(join(__here, '..', '..', 'docs', 'designs', 'K-024-visual-spec.json'), 'utf-8'),
) as {
  frames: Array<{
    id: string
    components: Array<{ role: string; color?: string; [k: string]: unknown }>
  }>
}

// K-024 Phase 3 — AC-024-HOMEPAGE-CURATION coverage (design §7.3 T-H1..T-H4).
// All visual CSS assertions import visual-spec.json roles; no hardcoded hex/px.

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgb(${r}, ${g}, ${b})`
}

// Visual-spec N0WWY (Homepage) frame → roles
const homeFrame = spec.frames.find((f) => f.id === 'N0WWY')!
const homeMarker = homeFrame.components.find((c) => c.role === 'marker')!

async function mockDiary(route: Route, body: unknown): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

// ── T-H1 — happy path + tie-break + marker count ─────────────────────────────
test.describe('HomePage diary — AC-024-HOMEPAGE-CURATION T-H1', () => {
  test('3-entry happy path renders exactly 3 diary-entry-wrapper elements', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    // Use a 3-entry mock to exercise the full curation path deterministically
    await page.route('**/diary.json', (route) =>
      mockDiary(route, [
        { ticketId: 'K-101', title: 'Curation test 1', date: '2026-04-10', text: 'Body 1.' },
        { ticketId: 'K-102', title: 'Curation test 2', date: '2026-04-11', text: 'Body 2.' },
        { ticketId: 'K-103', title: 'Curation test 3', date: '2026-04-12', text: 'Body 3.' },
      ]),
    )
    await page.goto('/')

    const entries = page.locator('[data-testid="diary-entry-wrapper"]')
    await expect(entries).toHaveCount(3)

    const markers = page.locator('[data-testid="diary-marker"]')
    await expect(markers).toHaveCount(3)
  })

  test('tie-break: same-date entries — array-index-later renders above index-earlier', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.route('**/diary.json', (route) =>
      mockDiary(route, [
        { ticketId: 'K-100', title: 'Older of two (array index 0)', date: '2026-04-20', text: 'First.' },
        { ticketId: 'K-101', title: 'Newer of two (array index 1)', date: '2026-04-20', text: 'Second.' },
      ]),
    )
    await page.goto('/')

    const entries = page.locator('[data-testid="diary-entry-wrapper"]')
    await expect(entries).toHaveCount(2)

    // Array-index larger = newer → K-101 renders above K-100 (closer to top of DOM)
    const firstEntry = entries.nth(0)
    await expect(firstEntry.locator('p').first()).toContainText('K-101')
    const secondEntry = entries.nth(1)
    await expect(secondEntry.locator('p').first()).toContainText('K-100')
  })
})

// ── T-H2 — 0-entry section hidden ────────────────────────────────────────────
test.describe('HomePage diary — AC-024-HOMEPAGE-CURATION T-H2', () => {
  test('diary.json returns 0 entries: no diary-entry-wrapper, no diary-rail', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.route('**/diary.json', (route) => mockDiary(route, []))
    await page.goto('/')

    await expect(page.locator('[data-testid="diary-entry-wrapper"]')).toHaveCount(0)
    await expect(page.locator('[data-testid="diary-rail"]')).toHaveCount(0)
  })
})

// ── T-H3 — 1-entry: rail hidden, marker visible ──────────────────────────────
test.describe('HomePage diary — AC-024-HOMEPAGE-CURATION T-H3', () => {
  test('1 entry fixture: rail hidden, 1 marker visible, entry count = 1', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.route('**/diary.json', (route) =>
      mockDiary(route, [
        { ticketId: 'K-001', title: 'Solo fixture', date: '2026-04-20', text: 'Single body.' },
      ]),
    )
    await page.goto('/')

    await expect(page.locator('[data-testid="diary-entry-wrapper"]')).toHaveCount(1)
    // 1-entry boundary (design §4.3.1): rail NOT rendered
    await expect(page.locator('[data-testid="diary-rail"]')).toHaveCount(0)
    // marker still present (1 entry, 1 marker)
    await expect(page.locator('[data-testid="diary-marker"]')).toHaveCount(1)
  })
})

// ── T-H4 — 2 entries: rail visible, 2 markers, marker CSS from visual-spec ──
test.describe('HomePage diary — AC-024-HOMEPAGE-CURATION T-H4', () => {
  test('2 entries: rail visible, 2 markers, marker backgroundColor matches visual-spec N0WWY', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.route('**/diary.json', (route) =>
      mockDiary(route, [
        { ticketId: 'K-201', title: 'Two fixture 1', date: '2026-04-18', text: 'Body 1.' },
        { ticketId: 'K-202', title: 'Two fixture 2', date: '2026-04-20', text: 'Body 2.' },
      ]),
    )
    await page.goto('/')

    await expect(page.locator('[data-testid="diary-entry-wrapper"]')).toHaveCount(2)
    await expect(page.locator('[data-testid="diary-rail"]')).toHaveCount(1)

    const markers = page.locator('[data-testid="diary-marker"]')
    await expect(markers).toHaveCount(2)

    // Marker backgroundColor comes from visual-spec (no hardcoded hex)
    await expect(markers.first()).toHaveCSS('background-color', hexToRgb(homeMarker.color))
  })
})
