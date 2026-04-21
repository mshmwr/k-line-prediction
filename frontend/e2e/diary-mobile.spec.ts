import { test, expect } from '@playwright/test'

// ── K-027 Mobile Diary Layout Fix ────────────────────────────────────────────
// AC-027-NO-OVERLAP:     相鄰 milestone card y 區間完全不重疊
// AC-027-TEXT-READABLE:  milestone title / date / text 完整可讀
// AC-027-DESKTOP-NO-REGRESSION: 桌面 layout 零回歸

// Helper: scroll to bottom 並驗最後一個 milestone card 完整可見於 viewport（I-001）
async function assertLastCardVisible(page: import('@playwright/test').Page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(200) // 等 scroll 穩定

  const cards = page.locator('.border.border-ink\\/10.rounded-sm')
  const lastCard = cards.last()
  const box = await lastCard.boundingBox()
  const viewportSize = page.viewportSize()

  expect(box).not.toBeNull()
  expect(viewportSize).not.toBeNull()
  if (box && viewportSize) {
    // card 頂部必須在 viewport 內（y >= 0）
    expect(box!.y).toBeGreaterThanOrEqual(0)
    // 最後一個 card 底部必須在 viewport 底部以內（+1px 容錯）
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewportSize!.height + 1)
  }
}

// Helper: 展開所有 accordion，再驗 y 不重疊（N-002 — 全展開狀態）
async function assertNoOverlapWhenAllExpanded(page: import('@playwright/test').Page) {
  await page.evaluate(() => window.scrollTo(0, 0))

  // 逐一展開所有 aria-expanded=false 的 accordion 按鈕
  // 限定在 milestone card 容器內，避免誤觸外部按鈕
  const milestoneCards = page.locator('.border.border-ink\\/10.rounded-sm')
  const buttons = milestoneCards.getByRole('button')
  const buttonCount = await buttons.count()
  for (let i = 0; i < buttonCount; i++) {
    const btn = buttons.nth(i)
    const expanded = await btn.getAttribute('aria-expanded')
    if (expanded === 'false') {
      await btn.click()
      await expect(btn).toHaveAttribute('aria-expanded', 'true') // 等展開完成
    }
  }

  // 全部展開後再跑 y 不重疊斷言
  await assertNoOverlap(page)
}

// Helper: 取得所有 milestone card 並依序斷言相鄰不重疊（y 區間）
async function assertNoOverlap(page: import('@playwright/test').Page) {
  await page.evaluate(() => window.scrollTo(0, 0))

  const cards = page.locator('.border.border-ink\\/10.rounded-sm')
  const count = await cards.count()
  expect(count).toBeGreaterThanOrEqual(3) // diary.json 含 12 個 milestone

  for (let i = 0; i < count - 1; i++) {
    const cardA = cards.nth(i)
    const cardB = cards.nth(i + 1)

    await cardA.scrollIntoViewIfNeeded()
    await cardB.scrollIntoViewIfNeeded()

    const boxA = await cardA.boundingBox()
    const boxB = await cardB.boundingBox()

    expect(boxA).not.toBeNull()
    expect(boxB).not.toBeNull()

    // 核心斷言：card A 底部 <= card B 頂部（完全不重疊）
    if (boxA && boxB) {
      expect(boxA.y + boxA.height).toBeLessThanOrEqual(boxB.y)
    }
  }
}

// Helper: 驗證手機模式下 DiaryEntry container 使用 flex-col（K-027 After 狀態）
async function assertMobileFlexCol(page: import('@playwright/test').Page) {
  const firstEntriesContainer = page.locator('.px-4.pb-4').first()
  await expect(firstEntriesContainer).toBeVisible()

  // 展開區內第一個 DiaryEntry container div 必須使用 flex-col（手機 After 狀態）
  const firstEntry = firstEntriesContainer.locator('div').first()
  await expect(firstEntry).toBeVisible()

  // 驗證 computed flex-direction = column（After 狀態）
  // Before 狀態：flex-direction = row；After 狀態：flex-direction = column
  const flexDirection = await firstEntry.evaluate((el) => {
    return window.getComputedStyle(el).flexDirection
  })
  expect(flexDirection).toBe('column')

  // 驗證 date span 的 computed max-width 不受 w-24 限制
  // After 狀態：w-auto（Tailwind class）→ computed width 不固定為 96px
  // 改用 class 驗證：span 不含 'w-24' class（含 'w-auto'）
  const dateSpan = firstEntry.locator('span').first()
  await expect(dateSpan).toBeVisible()
  const spanClasses = await dateSpan.getAttribute('class')
  // After 狀態：class 含 w-auto，不含桌面-only 的 w-24 class（inline 不再有 w-24）
  // class 字串格式：shrink-0 font-mono text-xs text-muted w-auto sm:w-24 sm:pt-0.5
  expect(spanClasses).toContain('w-auto')
  // w-24 仍存在於 class（作為 sm: prefix），但 computed style 在 mobile viewport 下不套用
  // 用 computed style 確認 width 非 96px（After: flex-col + w-auto → width = content width）
  const computedWidth = await dateSpan.evaluate((el) => {
    return parseFloat(window.getComputedStyle(el).width)
  })
  // flex-col 下 span 撐滿父容器，date text "YYYY-MM-DD" 理論 < container width
  // 只需確認此時 date span computed width != exactly 96px（w-24 未生效）
  expect(computedWidth).not.toBeCloseTo(96, 0)
}

// ── AC-027-NO-OVERLAP ────────────────────────────────────────────────────────

test.describe('AC-027-NO-OVERLAP — 手機 viewport 相鄰 milestone 不重疊', () => {
  test('TC-001: 375×812 viewport — 所有相鄰 milestone card y 區間不重疊且使用 flex-col', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
    })
    const page = await context.newPage()
    await page.goto('/diary')
    await page.waitForLoadState('networkidle')

    await assertNoOverlap(page)
    await assertMobileFlexCol(page)

    // I-001：最後一個 card 完整可見
    await assertLastCardVisible(page)

    // N-002：全展開狀態仍不重疊
    await assertNoOverlapWhenAllExpanded(page)

    await context.close()
  })

  test('TC-002: 390×844 viewport — 所有相鄰 milestone card y 區間不重疊且使用 flex-col', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    })
    const page = await context.newPage()
    await page.goto('/diary')
    await page.waitForLoadState('networkidle')

    await assertNoOverlap(page)
    await assertMobileFlexCol(page)

    // I-001：最後一個 card 完整可見
    await assertLastCardVisible(page)

    // N-002：全展開狀態仍不重疊
    await assertNoOverlapWhenAllExpanded(page)

    await context.close()
  })

  test('TC-003: 414×896 viewport — 所有相鄰 milestone card y 區間不重疊且使用 flex-col', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 414, height: 896 },
    })
    const page = await context.newPage()
    await page.goto('/diary')
    await page.waitForLoadState('networkidle')

    await assertNoOverlap(page)
    await assertMobileFlexCol(page)

    // I-001：最後一個 card 完整可見
    await assertLastCardVisible(page)

    // N-002：全展開狀態仍不重疊
    await assertNoOverlapWhenAllExpanded(page)

    await context.close()
  })
})

// ── AC-027-TEXT-READABLE ─────────────────────────────────────────────────────

async function assertTextReadable(page: import('@playwright/test').Page) {
  // 首個 milestone 預設展開（defaultOpen={i===0}）
  const milestoneCards = page.locator('.border.border-ink\\/10.rounded-sm')
  const firstMilestoneBtn = milestoneCards.first().getByRole('button').first()
  await expect(firstMilestoneBtn).toHaveAttribute('aria-expanded', 'true')

  // milestone title 文字完整顯示（不被 ellipsis 截斷）
  const milestoneTitle = firstMilestoneBtn.locator('span').first()
  await expect(milestoneTitle).toBeVisible()

  const titleOverflow = await milestoneTitle.evaluate((el) => {
    const style = window.getComputedStyle(el)
    return style.textOverflow
  })
  expect(titleOverflow).not.toBe('ellipsis')

  // 首個展開 milestone 的 entries
  const entriesContainer = page.locator('.px-4.pb-4').first()
  await expect(entriesContainer).toBeVisible()

  // date 欄：完整顯示（10 字元 YYYY-MM-DD）
  const firstDateSpan = entriesContainer.locator('span').first()
  await expect(firstDateSpan).toBeVisible()

  const dateText = await firstDateSpan.textContent()
  expect(dateText).toMatch(/^\d{4}-\d{2}-\d{2}$/)

  const dateStyle = await firstDateSpan.evaluate((el) => {
    const style = window.getComputedStyle(el)
    return {
      overflow: style.overflow,
      textOverflow: style.textOverflow,
      fontSize: parseFloat(style.fontSize),
    }
  })
  expect(dateStyle.textOverflow).not.toBe('ellipsis')
  // font-size >= 12px 可讀性下限
  expect(dateStyle.fontSize).toBeGreaterThanOrEqual(12)

  // text 欄：可見且字色不是 transparent，font-size >= 12px
  const firstTextP = entriesContainer.locator('p').first()
  await expect(firstTextP).toBeVisible()

  const textStyle = await firstTextP.evaluate((el) => {
    const style = window.getComputedStyle(el)
    return {
      color: style.color,
      fontSize: parseFloat(style.fontSize),
    }
  })
  expect(textStyle.color).not.toBe('transparent')
  expect(textStyle.color).not.toBe('rgba(0, 0, 0, 0)')
  expect(textStyle.fontSize).toBeGreaterThanOrEqual(12)

  // break-words 驗證：text p 的 overflowWrap 包含 break-word 或 anywhere
  const overflowWrap = await firstTextP.evaluate((el) => {
    return window.getComputedStyle(el).overflowWrap
  })
  // After 狀態加了 break-words → computed overflowWrap = 'break-word' 或 'anywhere'
  expect(['break-word', 'anywhere']).toContain(overflowWrap)

  // C-001：overflow-hidden 容器下文字未被截斷
  // .px-4.pb-4 容器有 overflow-hidden；flex-col + break-words 應使文字完整折行於容器內

  // 前提：記錄容器 computed overflow 狀態，協助理解下方 getBoundingClientRect 斷言的前提
  // 若為 hidden，表示容器可能截斷超出的子元素；下方斷言驗證文字在容器範圍內未被截斷
  // 此處只記錄狀態，不做 expect — getBoundingClientRect 段才是斷言
  const containerOverflow = await entriesContainer.evaluate((el) =>
    window.getComputedStyle(el).overflow
  )
  // containerOverflow 值供讀者理解：若為 'hidden'，下方 rect 斷言即是防截斷驗證
  void containerOverflow

  // 用 getBoundingClientRect 確認所有 p 的底部不超過容器底部
  const containerNotClipping = await entriesContainer.evaluate((container) => {
    const containerRect = container.getBoundingClientRect()
    const paragraphs = container.querySelectorAll('p')
    for (const p of paragraphs) {
      const pRect = p.getBoundingClientRect()
      // p 的底部不得超過容器底部（+2px subpixel 容錯）
      if (pRect.bottom > containerRect.bottom + 2) {
        return false
      }
    }
    return true
  })
  expect(containerNotClipping).toBe(true)
}

test.describe('AC-027-TEXT-READABLE — 手機 viewport milestone 文字完整可讀', () => {
  test('TC-004: 375×812 viewport — 首個展開 milestone title / date / text 可讀且 break-words 生效', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
    })
    const page = await context.newPage()
    await page.goto('/diary')
    await page.waitForLoadState('networkidle')

    await assertTextReadable(page)

    await context.close()
  })

  test('TC-005: 390×844 viewport — 首個展開 milestone title / date / text 可讀且 break-words 生效', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    })
    const page = await context.newPage()
    await page.goto('/diary')
    await page.waitForLoadState('networkidle')

    await assertTextReadable(page)

    await context.close()
  })

  test('TC-006: 414×896 viewport — 首個展開 milestone title / date / text 可讀且 break-words 生效', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 414, height: 896 },
    })
    const page = await context.newPage()
    await page.goto('/diary')
    await page.waitForLoadState('networkidle')

    await assertTextReadable(page)

    await context.close()
  })
})

// ── AC-027-DESKTOP-NO-REGRESSION ─────────────────────────────────────────────

test.describe('AC-027-DESKTOP-NO-REGRESSION — 桌面 1280px layout 零回歸', () => {
  test('TC-007: 1280×800 viewport — 首個 milestone 展開；桌面 flex-row + w-24 date 欄保留；aria-expanded 正常', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    })
    const page = await context.newPage()
    await page.goto('/diary')
    await page.waitForLoadState('networkidle')

    // 首個 milestone 預設展開
    const firstBtn = page.getByRole('button').first()
    await expect(firstBtn).toHaveAttribute('aria-expanded', 'true')

    // 展開區可見且有 diary entry
    const firstEntriesContainer = page.locator('.px-4.pb-4').first()
    await expect(firstEntriesContainer).toBeVisible()

    const entryParagraphs = firstEntriesContainer.locator('p')
    await expect(entryParagraphs.first()).toBeVisible()

    // 第二個 milestone 點擊後展開（accordion 行為）
    const secondBtn = page.getByRole('button').nth(1)
    await expect(secondBtn).toHaveAttribute('aria-expanded', 'false')
    await secondBtn.click()
    await expect(secondBtn).toHaveAttribute('aria-expanded', 'true')

    // 桌面 layout：flex-direction = row（sm:flex-row 在 1280px 下生效）
    const firstEntry = firstEntriesContainer.locator('div').first()
    const flexDirection = await firstEntry.evaluate((el) => {
      return window.getComputedStyle(el).flexDirection
    })
    expect(flexDirection).toBe('row')

    // 桌面 date 欄：w-24 = 96px（After 狀態 sm:w-24 保留桌面固定寬度）
    const dateSpan = firstEntry.locator('span').first()
    await expect(dateSpan).toBeVisible()
    const dateWidth = await dateSpan.evaluate((el) => {
      return el.getBoundingClientRect().width
    })
    // w-24 = 96px；允許 ±5px 渲染差異
    expect(dateWidth).toBeGreaterThanOrEqual(91)
    expect(dateWidth).toBeLessThanOrEqual(101)

    await context.close()
  })
})
