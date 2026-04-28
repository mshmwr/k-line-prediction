import { test, expect } from '@playwright/test'
import { mockApis } from './_fixtures/mock-apis.ts'

// ── AC-021-FONTS — K-040 retirement rewrite (2026-04-23) ─────────────────────
// Given: 使用者訪問任一頁面
// When:  頁面載入完成
// Then:  body 預設 font-mono（K-040 AC-040-SITEWIDE-FONT-MONO），任一元素的
//        computed fontFamily 繼承自 body → 含 "Geist Mono" 或 "ui-monospace"
// And:   shared Footer（全站共用 Footer，K-034 Phase 1 prop-less）computed
//        fontFamily 含 "Geist Mono"
//
// K-021 原三字型分類（display=Bodoni / italic=Newsreader / mono=Geist Mono）
// 已於 K-040 退役 — Bodoni Moda + Newsreader 在 tailwind.config.js 移除，
// 全站統一為 Geist Mono，italic OFF。原 `font-display class 渲染 Bodoni Moda`
// 斷言反轉為 `body-level Geist Mono 預設 + shared Footer Geist Mono` 兩組斷言。

test.describe('AC-021-FONTS — sitewide body default is Geist Mono (K-040)', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('HomePage body computed fontFamily 含 "Geist Mono" (sitewide mono default)', async ({ page }) => {
    await mockApis(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // K-040 @layer base body { @apply font-mono ... } — default page typography
    // is Geist Mono, inherited by all descendants that do not override.
    const bodyFontFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily)
    expect(bodyFontFamily).toMatch(/Geist Mono|ui-monospace/)
  })

  test('HomePage HeroSection h1 computed fontFamily 含 "Geist Mono" (K-040 Bodoni retired)', async ({ page }) => {
    await mockApis(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // K-042 — HeroSection h1 is now single h1 with 2 <span className="block"> children.
    const heroHeading = page.getByRole('heading', { level: 1 })
    await expect(heroHeading).toBeVisible()
    await expect(heroHeading).toContainText('K-line similarity')

    const fontFamily = await heroHeading.evaluate(el => getComputedStyle(el).fontFamily)
    expect(fontFamily).toMatch(/Geist Mono|ui-monospace/)

    // K-040 BQ-040-01 italic OFF non-negotiable.
    const fontStyle = await heroHeading.evaluate(el => getComputedStyle(el).fontStyle)
    expect(fontStyle).toBe('normal')
  })
})

test.describe('AC-021-FONTS — shared Footer font-mono renders Geist Mono', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('HomePage shared Footer font-mono element computed fontFamily 含 "Geist Mono"', async ({ page }) => {
    await mockApis(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // K-050: shared Footer is now <footer className="font-mono ..."> wrapping cta-* anchors;
    // assert font-mono on <footer> element directly (was inline text node pre-K-050).
    const footer = page.locator('footer').last()
    await expect(footer).toBeVisible()

    const fontFamily = await footer.evaluate(el => getComputedStyle(el).fontFamily)
    expect(fontFamily).toMatch(/Geist Mono/)
  })
})

// ── AC-040-SITEWIDE-FONT-MONO (K-040) — 4-route H1 spot-check + code-tag guard ──
// Per design doc §5.8 + §13 mapping row And-9 (T-AC040-H1-*) + And-13 (T-AC040-CODE-NOT-ITALIC).
// Each route's representative h1 renders Geist Mono + style=normal.

test.describe('AC-040-SITEWIDE-FONT-MONO — 4-route h1 Geist Mono + style=normal', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('T-AC040-H1-HOME: / HeroSection h1 Geist Mono + style=normal', async ({ page }) => {
    await mockApis(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // K-042 — HeroSection h1 is single h1 with 2 span block children.
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    await expect(h1).toContainText('K-line similarity')
    const ff = await h1.evaluate(el => getComputedStyle(el).fontFamily)
    expect(ff).toMatch(/Geist Mono|ui-monospace/)
    const style = await h1.evaluate(el => getComputedStyle(el).fontStyle)
    expect(style).toBe('normal')
  })

  test('T-AC040-H1-ABOUT: /about PageHeaderSection h1 Geist Mono + style=normal', async ({ page }) => {
    await mockApis(page)
    await page.goto('/about')
    await page.waitForLoadState('networkidle')
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    const ff = await h1.evaluate(el => getComputedStyle(el).fontFamily)
    expect(ff).toMatch(/Geist Mono|ui-monospace/)
    const style = await h1.evaluate(el => getComputedStyle(el).fontStyle)
    expect(style).toBe('normal')
  })

  test('T-AC040-H1-DIARY: /diary DiaryHero h1 Geist Mono + style=normal', async ({ page }) => {
    await mockApis(page)
    await page.goto('/diary')
    await page.waitForLoadState('networkidle')
    const h1 = page.getByRole('heading', { name: 'Dev Diary', exact: true })
    await expect(h1).toBeVisible()
    const ff = await h1.evaluate(el => getComputedStyle(el).fontFamily)
    expect(ff).toMatch(/Geist Mono|ui-monospace/)
    const style = await h1.evaluate(el => getComputedStyle(el).fontStyle)
    expect(style).toBe('normal')
  })

  test('T-AC040-H1-BL: /business-logic gate h1 Geist Mono + style=normal', async ({ page }) => {
    await mockApis(page)
    await page.goto('/business-logic')
    await page.waitForLoadState('networkidle')
    // BL gate h1 = "Business Logic" (pre-auth state)
    const h1 = page.getByRole('heading', { name: 'Business Logic', exact: true })
    await expect(h1).toBeVisible()
    const ff = await h1.evaluate(el => getComputedStyle(el).fontFamily)
    expect(ff).toMatch(/Geist Mono|ui-monospace/)
    const style = await h1.evaluate(el => getComputedStyle(el).fontStyle)
    expect(style).toBe('normal')
  })
})

test.describe('AC-040-SITEWIDE-FONT-MONO — ReliabilityPillars <code> style=normal guard (QA-040-Q6)', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('T-AC040-CODE-NOT-ITALIC: each <code> inside ReliabilityPillarsSection computed font-style normal', async ({ page }) => {
    await mockApis(page)
    await page.goto('/about')
    await page.waitForLoadState('networkidle')
    // ReliabilityPillarsSection has 3 pillar bodies; each body includes ≥1 <code>
    // element (docs/retrospectives/<role>.md pattern). Assert every rendered
    // <code> in that section has font-style: normal — regression guard for
    // future italic ancestor drift re-cascading italic onto mono code tags
    // (K-040 BQ-040-06 Option A retired the 3× `<code class="not-italic">`
    // defensive overrides; this test locks the new no-italic-cascade invariant).
    const pillarSection = page.locator('section').filter({ hasText: 'How AI Stays Reliable' })
    const codeTags = pillarSection.locator('code')
    const codeCount = await codeTags.count()
    expect(codeCount).toBeGreaterThanOrEqual(3)
    for (let i = 0; i < codeCount; i++) {
      const codeEl = codeTags.nth(i)
      const style = await codeEl.evaluate(el => getComputedStyle(el).fontStyle)
      expect(style).toBe('normal')
    }
  })
})

// 註（K-030 + K-035 + K-040）：原 `AC-021-FONTS — Footer fontFamily cross-route` describe block
// 唯一的測試 case 是 /app Footer fontFamily — 由於 /app 於 K-030 撤除 Footer，
// 該 case 已移除；HomePage 共用 Footer Geist Mono 由上方既有 case 涵蓋
// （K-035 將 /、/business-logic、/about 三路由 Footer 合併入
// components/shared/Footer.tsx；font-mono class + DOM 不變，既有斷言繼續有效）。
// K-040 Bodoni 退役後，原 `font-display → Bodoni` 斷言反轉為 body-level mono 預設 +
// Hero h1 Geist Mono + style=normal 雙重斷言。
