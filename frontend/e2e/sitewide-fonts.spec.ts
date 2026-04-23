import { test, expect } from '@playwright/test'
import { mockApis } from './_fixtures/mock-apis.ts'

// ── AC-021-FONTS ─────────────────────────────────────────────────────────────
// Given: 使用者訪問任一頁面
// When:  頁面載入完成
// Then:  套用 `font-display` class 的元素，computed fontFamily 含 "Bodoni Moda"
// And:   套用 `font-mono` class 的元素，computed fontFamily 含 "Geist Mono"
// And:   shared Footer（全站共用 Footer，K-034 Phase 1 prop-less）computed fontFamily 含 "Geist Mono"
//
// 依 design doc §9.1 L530 規範新檔，C-4 修復：K-021 Round 1 遺漏此 spec → AC-021-FONTS
// 零斷言 → PARTIAL。此 spec 與既有 `sitewide-footer.spec.ts` 互補：
//   - sitewide-footer 驗 fontSize 11px + color + border-top（版面結構）
//   - sitewide-fonts 驗 fontFamily（字型家族載入）
//
// LIFO ordering invariant 由 _fixtures/mock-apis.ts 內建。

test.describe('AC-021-FONTS — font-display class renders Bodoni Moda', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('HomePage HeroSection font-display element computed fontFamily 含 "Bodoni Moda"', async ({ page }) => {
    await mockApis(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // HeroSection `<h1 className="font-display ...">Predict the next move</h1>`
    const heroHeading = page.getByRole('heading', { name: 'Predict the next move', exact: true })
    await expect(heroHeading).toBeVisible()

    const fontFamily = await heroHeading.evaluate(el => getComputedStyle(el).fontFamily)
    expect(fontFamily).toMatch(/Bodoni Moda/)
  })
})

test.describe('AC-021-FONTS — font-mono class renders Geist Mono', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('HomePage shared Footer font-mono element computed fontFamily 含 "Geist Mono"', async ({ page }) => {
    await mockApis(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 共用 Footer `<footer className="font-mono ...">` 的資訊列是套用 font-mono 的代表元素
    const footerText = page.getByText(
      'yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn',
      { exact: true }
    )
    await expect(footerText).toBeVisible()

    const fontFamily = await footerText.evaluate(el => getComputedStyle(el).fontFamily)
    expect(fontFamily).toMatch(/Geist Mono/)
  })
})

// 註（K-030 + K-035）：原 `AC-021-FONTS — Footer fontFamily cross-route` describe block
// 唯一的測試 case 是 /app Footer fontFamily — 由於 /app 於 K-030 撤除 Footer，
// 該 case 已移除；HomePage 共用 Footer Geist Mono 由上方 L35–53 既有 case 涵蓋
// （K-035 將 /、/business-logic、/about 三路由 Footer 合併入
// components/shared/Footer.tsx；font-mono class + DOM 不變，既有斷言繼續有效）。
