import { test, expect } from '@playwright/test'

// ── AC-HOME-1 ────────────────────────────────────────────────────────────────
// Given: user visits /
// When:  page loads
// Then:  Hero, HOW IT WORKS, and Dev Diary sections each have corresponding headings

test.describe('HomePage — AC-HOME-1', () => {
  test('Hero, HOW IT WORKS, and Dev Diary headings visible', async ({ page }) => {
    await page.goto('/')

    // Hero heading (K-057 Phase 1 PageHero: single h1 with 2 <span className="block"> children)
    const hero = page.getByRole('heading', { level: 1 })
    await expect(hero).toBeVisible()
    await expect(hero).toContainText('K-line similarity')
    await expect(hero).toContainText('lookup engine.')

    // HOW IT WORKS section label (inside the ProjectLogicSection logicHead)
    await expect(page.getByText('HOW IT WORKS', { exact: true })).toBeVisible()

    // Dev Diary section label
    await expect(page.getByText('DEV DIARY')).toBeVisible()
  })
})

// ── AC-ABOUT-1 ───────────────────────────────────────────────────────────────
// Given: user visits /about
// When:  page loads (K-017 redesign)
// Then:  key K-017 section content is visible

test.describe('AboutPage — AC-ABOUT-1 (K-017)', () => {
  test('PageHeader one-operator declaration visible', async ({ page }) => {
    await page.goto('/about')

    // S1 — PageHeaderSection: hero heading text
    // K-034 Phase 2 Step 8 — h1 split into 2 <span className="block"> children per Pencil frame wwa0m.
    // Assert against the h1 as a whole (toContainText accommodates multi-span children).
    const hero = page.getByRole('heading', { level: 1 })
    await expect(hero).toBeVisible()
    await expect(hero).toContainText('One operator, orchestrating AI')
    await expect(hero).toContainText('agents end-to-end —')
    await expect(page.getByText('Every feature ships with a doc trail.')).toBeVisible()

    // NavBar home icon still present
    await expect(page.getByRole('link', { name: 'Home', exact: true })).toBeVisible()
  })

  test('Metrics strip four cards visible (K-052 JSON-driven labels)', async ({ page }) => {
    // K-052: card labels updated from site-content.json — no longer hardcoded
    // Old: "First-pass Review Rate" → "Documented AC Coverage"
    // Old: "Guardrails in Place" → "Lessons Codified"
    await page.goto('/about')

    await expect(page.getByText('Features Shipped', { exact: true })).toBeVisible()
    await expect(page.getByText('Documented AC Coverage', { exact: true })).toBeVisible()
    await expect(page.getByText('Post-mortems Written', { exact: true })).toBeVisible()
    await expect(page.getByText('Lessons Codified', { exact: true })).toBeVisible()
  })

  test('Role Cards section visible with 6 roles', async ({ page }) => {
    await page.goto('/about')
    // K-058: role names also appear in RolePipelineSection SVG text nodes; scope to #roles
    const roles = page.locator('#roles')
    await expect(roles.getByText('PM', { exact: true })).toBeVisible()
    await expect(roles.getByText('Architect', { exact: true })).toBeVisible()
    await expect(roles.getByText('Engineer', { exact: true })).toBeVisible()
    await expect(roles.getByText('Reviewer', { exact: true })).toBeVisible()
    await expect(roles.getByText('QA', { exact: true })).toBeVisible()
    await expect(roles.getByText('Designer', { exact: true })).toBeVisible()
  })

  test('How AI Stays Reliable three pillars visible', async ({ page }) => {
    await page.goto('/about')

    await expect(page.getByText('How AI Stays Reliable', { exact: true })).toBeVisible()
    await expect(page.getByText('Persistent Memory', { exact: true })).toBeVisible()
    await expect(page.getByText('Structured Reflection', { exact: true })).toBeVisible()
    await expect(page.getByText('Role Agents', { exact: true })).toBeVisible()
  })

  // `Footer CTA visible on /about` test deleted per K-034 §PM ruling on BQ-034-P1-01
  // Sacred retired per §1.4 Pencil SSOT verdict — /about Footer now has no "Let's talk →" string.
})

// ── AC-DIARY-1 (K-024 rewrite) ──────────────────────────────────────────────
// Given: user visits /diary
// When: diary.json loads successfully
// Then: flat timeline renders; Hero title visible; at least one entry visible;
//       infinite scroll sentinel appears when entry count > 5.
//
// K-024 AC-024-REGRESSION Allowed-to-change: the old accordion-based
// assertions (getByRole('button') + aria-expanded + .px-4.pb-4) targeted the
// removed MilestoneSection DOM. Replaced with the new flat-timeline
// observables, preserving the core behavior "diary.json loads and renders
// entries".

test.describe('DiaryPage — AC-DIARY-1 (K-024 flat timeline)', () => {
  test('hero title visible and at least one diary entry renders', async ({ page }) => {
    await page.goto('/diary')

    // Hero title (AC-024-PAGE-HERO)
    await expect(page.getByRole('heading', { level: 1, name: 'Dev Diary', exact: true })).toBeVisible()

    // At least one entry from diary.json is rendered
    const entries = page.locator('[data-testid="diary-entry"]')
    await expect(entries.first()).toBeVisible()
  })

  test('flat timeline structure — no accordion, no divide-y, no milestone wrapper', async ({ page }) => {
    await page.goto('/diary')

    // K-024 AC-024-TIMELINE-STRUCTURE negative assertions
    await expect(page.locator('details, summary')).toHaveCount(0)
    await expect(page.locator('[class*="divide-y"]')).toHaveCount(0)
    await expect(page.locator('[class*="milestone"]')).toHaveCount(0)
  })

  test('sentinel present when diary entry count > 5', async ({ page }) => {
    await page.goto('/diary')

    // Wait for initial 5 entries to render
    const entries = page.locator('[data-testid="diary-entry"]')
    await expect(entries.first()).toBeVisible()

    // Production diary.json has > 5 entries → sentinel should be present
    const sentinel = page.locator('[data-testid="diary-sentinel"]')
    await expect(sentinel).toBeVisible()
  })
})

// ── AC-017-HOME-V2 ───────────────────────────────────────────────────────────
// Given: user visits /
// When:  page loads (K-017 Homepage v2)
// Then:  HeroSection v2 and ProjectLogicSection v2 content is visible

test.describe('HomePage — AC-017-HOME-V2', () => {
  test('HeroSection v2: headings and CTA visible', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('K-line similarity', { exact: true })).toBeVisible()
    await expect(page.getByText('lookup engine.', { exact: true })).toBeVisible()
    await expect(page.getByText('Run the ETH/USDT Demo →', { exact: true })).toBeVisible()
  })

  test('ProjectLogicSection v2: HOW IT WORKS label and three steps visible', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('HOW IT WORKS', { exact: true })).toBeVisible()
    await expect(page.getByText('STEP 01 · INGEST', { exact: true })).toBeVisible()
    await expect(page.getByText('STEP 02 · MATCH', { exact: true })).toBeVisible()
    await expect(page.getByText('STEP 03 · PROJECT', { exact: true })).toBeVisible()
  })

  test('ProjectLogicSection v2: techRow STACK label visible', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('STACK —', { exact: true })).toBeVisible()
  })
})

// ── AC-073-STEPS-ASSERTIONS ──────────────────────────────────────────────────
// Given: user visits /
// When:  page loads (ProjectLogicSection v2, steps from site-content.json)
// Then:  step title "Upload" and its description are visible (exact match)
//        WhereISteppedIn outcome cell text is visible (exact match)

test.describe('HomePage — AC-073-STEPS-ASSERTIONS', () => {
  test('step title "Upload" visible (exact)', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Upload', { exact: true })).toBeVisible()
  })

  test('step description for step 01 visible (exact)', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByText('Drop in a CSV of 24 × 1H OHLC bars. The reference sample.', { exact: true })
    ).toBeVisible()
  })
})

// ── AC-073-WHERE-ASSERTIONS ──────────────────────────────────────────────────
// Given: user visits /about
// When:  page loads (WhereISteppedInSection, rows from site-content.json)
// Then:  one outcome cell value is visible (exact match)

test.describe('AboutPage — AC-073-WHERE-ASSERTIONS', () => {
  test('WhereISteppedIn outcome cell "Each ticket ships with a verifiable artefact trail" visible (exact)', async ({ page }) => {
    await page.goto('/about')
    await expect(
      page.getByText('Each ticket ships with a verifiable artefact trail', { exact: true })
    ).toBeVisible()
  })
})

// AC-017-FOOTER /diary negative clause retired per K-034 Phase 3 §BQ-034-P3-03 — user intent change 2026-04-23; Footer now covered by shared-components.spec.ts T1 (byte-identity 4 routes)

// ── AC-023-DIARY-BULLET ──────────────────────────────────────────────────────
// Given: user visits /
// When:  page scrolled to Diary section (hpDiary)
// Then:  each DiaryTimelineEntry marker is rectangular (no border-radius),
//        20×14px, backgroundColor rgb(156, 74, 59)

test.describe('HomePage — AC-023-DIARY-BULLET', () => {
  test('diary markers have correct width (20px) and height (14px)', async ({ page }) => {
    await page.goto('/')
    // Phase 1 hero image extends load-event time; wait for first marker to appear before count().
    const markers = page.locator('[data-testid="diary-marker"]')
    await expect(markers.first()).toBeVisible()
    // At least 3 markers must exist (AC requirement)
    const count = await markers.count()
    expect(count).toBeGreaterThanOrEqual(3)

    const firstMarker = markers.first()
    const box = await firstMarker.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBe(20)
    expect(box!.height).toBe(14)
  })

  test('diary markers have backgroundColor rgb(156, 74, 59) = brick-dark', async ({ page }) => {
    await page.goto('/')
    const markers = page.locator('[data-testid="diary-marker"]')
    await expect(markers.first()).toBeVisible()
    const count = await markers.count()
    expect(count).toBeGreaterThanOrEqual(3)

    for (let i = 0; i < Math.min(count, 3); i++) {
      const marker = markers.nth(i)
      const bg = await marker.evaluate(el => getComputedStyle(el).backgroundColor)
      expect(bg).toBe('rgb(156, 74, 59)')
    }
  })

  test('diary markers have borderRadius 0px (rectangular, not rounded)', async ({ page }) => {
    await page.goto('/')
    const markers = page.locator('[data-testid="diary-marker"]')
    await expect(markers.first()).toBeVisible()
    const count = await markers.count()
    expect(count).toBeGreaterThanOrEqual(3)

    for (let i = 0; i < Math.min(count, 3); i++) {
      const marker = markers.nth(i)
      const radius = await marker.evaluate(el => getComputedStyle(el).borderRadius)
      expect(radius).toBe('0px')
    }
  })
})

// ── AC-023-STEP-HEADER-BAR ──────────────────────────────────────────────────
// Given: user visits /
// When:  page loaded to hpLogic section
// Then:  each STEP card has a header bar with correct bg, white text, Geist Mono 10px
// Note:  3 independent test cases per AC (PM quantification rule — not merged)

test.describe('HomePage — AC-023-STEP-HEADER-BAR (STEP 01 · INGEST)', () => {
  test('STEP 01 header bar: bg charcoal, paper text, Geist Mono 10px', async ({ page }) => {
    await page.goto('/')

    const headerBar = page.locator('[data-testid="step-header-bar"]', { hasText: 'STEP 01 · INGEST' })
    await expect(headerBar).toBeVisible()

    const bg = await headerBar.evaluate(el => getComputedStyle(el).backgroundColor)
    expect(bg).toBe('rgb(42, 37, 32)')

    const span = headerBar.locator('span')
    const color = await span.evaluate(el => getComputedStyle(el).color)
    // text-paper = #F4EFE5 = rgb(244, 239, 229); AC corrected from pure white to paper token (PM ruling 2026-04-21)
    expect(color).toBe('rgb(244, 239, 229)')

    const fontSize = await span.evaluate(el => getComputedStyle(el).fontSize)
    expect(fontSize).toBe('10px')

    const fontFamily = await span.evaluate(el => getComputedStyle(el).fontFamily)
    expect(fontFamily).toContain('Geist Mono')
  })
})

test.describe('HomePage — AC-023-STEP-HEADER-BAR (STEP 02 · MATCH)', () => {
  test('STEP 02 header bar: bg charcoal, paper text, Geist Mono 10px', async ({ page }) => {
    await page.goto('/')

    const headerBar = page.locator('[data-testid="step-header-bar"]', { hasText: 'STEP 02 · MATCH' })
    await expect(headerBar).toBeVisible()

    const bg = await headerBar.evaluate(el => getComputedStyle(el).backgroundColor)
    expect(bg).toBe('rgb(42, 37, 32)')

    const span = headerBar.locator('span')
    const color = await span.evaluate(el => getComputedStyle(el).color)
    // text-paper = #F4EFE5 = rgb(244, 239, 229); AC corrected from pure white to paper token (PM ruling 2026-04-21)
    expect(color).toBe('rgb(244, 239, 229)')

    const fontSize = await span.evaluate(el => getComputedStyle(el).fontSize)
    expect(fontSize).toBe('10px')

    const fontFamily = await span.evaluate(el => getComputedStyle(el).fontFamily)
    expect(fontFamily).toContain('Geist Mono')
  })
})

test.describe('HomePage — AC-023-STEP-HEADER-BAR (STEP 03 · PROJECT)', () => {
  test('STEP 03 header bar: bg charcoal, paper text, Geist Mono 10px', async ({ page }) => {
    await page.goto('/')

    const headerBar = page.locator('[data-testid="step-header-bar"]', { hasText: 'STEP 03 · PROJECT' })
    await expect(headerBar).toBeVisible()

    const bg = await headerBar.evaluate(el => getComputedStyle(el).backgroundColor)
    expect(bg).toBe('rgb(42, 37, 32)')

    const span = headerBar.locator('span')
    const color = await span.evaluate(el => getComputedStyle(el).color)
    // text-paper = #F4EFE5 = rgb(244, 239, 229); AC corrected from pure white to paper token (PM ruling 2026-04-21)
    expect(color).toBe('rgb(244, 239, 229)')

    const fontSize = await span.evaluate(el => getComputedStyle(el).fontSize)
    expect(fontSize).toBe('10px')

    const fontFamily = await span.evaluate(el => getComputedStyle(el).fontFamily)
    expect(fontFamily).toContain('Geist Mono')
  })
})

// ── AC-023-BODY-PADDING ──────────────────────────────────────────────────────
// Given: user visits /
// When:  page loads on desktop (>= 640px)
// Then:  homepage-root container padding = 72px top, 96px right, 96px bottom, 96px left
//
// Given: viewport width < 640px (mobile)
// When:  page loads
// Then:  padding = 32px top/bottom, 24px left/right

test.describe('HomePage — AC-023-BODY-PADDING', () => {
  test('desktop padding: paddingTop=72px, paddingRight=96px, paddingBottom=96px, paddingLeft=96px', async ({ page }) => {
    // Default Playwright viewport is 1280×720 (desktop)
    await page.goto('/')

    const root = page.locator('[data-testid="homepage-root"]')
    await expect(root).toBeVisible()

    const padding = await root.evaluate(el => {
      const s = getComputedStyle(el)
      return {
        top: s.paddingTop,
        right: s.paddingRight,
        bottom: s.paddingBottom,
        left: s.paddingLeft,
      }
    })

    expect(padding.top).toBe('72px')
    expect(padding.right).toBe('96px')
    expect(padding.bottom).toBe('96px')
    expect(padding.left).toBe('96px')
  })

  test('mobile padding (375px viewport): paddingTop=32px, paddingBottom=32px, paddingLeft=24px, paddingRight=24px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    const root = page.locator('[data-testid="homepage-root"]')
    await expect(root).toBeVisible()

    const padding = await root.evaluate(el => {
      const s = getComputedStyle(el)
      return {
        top: s.paddingTop,
        right: s.paddingRight,
        bottom: s.paddingBottom,
        left: s.paddingLeft,
      }
    })

    expect(padding.top).toBe('32px')
    expect(padding.bottom).toBe('32px')
    expect(padding.left).toBe('24px')
    expect(padding.right).toBe('24px')
  })
})

// ── AC-023-REGRESSION ───────────────────────────────────────────────────────
// Regression guards: confirm K-017 existing structure still holds after K-023 changes.
// Running the full suite (npx playwright test) covers AC-017-HOME-V2 and AC-HOME-1 directly.
// This block adds explicit K-023 structural guards: Banner DOM-order + layout integrity.

test.describe('HomePage — AC-023-REGRESSION', () => {
  test('BuiltByAIBanner still renders between NavBar and Hero (K-017 regression)', async ({ page }) => {
    await page.goto('/')

    // Banner renders (actual text: "One operator. Six AI agents. Every ticket leaves a doc trail.")
    await expect(page.getByText('One operator. Six AI agents.', { exact: false })).toBeVisible()

    // Hero heading still exists
    await expect(page.getByText('K-line similarity', { exact: true })).toBeVisible()

    // DEV DIARY section still renders
    await expect(page.getByText('DEV DIARY')).toBeVisible()

    // DOM-order guard: Banner must appear before HeroSection in document order
    // (AC-023-REGRESSION: "BuiltByAIBanner position NavBar下方、Hero上方 not changed")
    const bannerBeforeHero = await page.evaluate(() => {
      const banner = document.querySelector('[data-testid="built-by-ai-banner"]')
      // Locate hero heading as a proxy for HeroSection root (K-057 Phase 1 text)
      const heroHeading = Array.from(document.querySelectorAll('h1')).find(
        el => el.textContent?.includes('K-line similarity')
      )
      if (!banner || !heroHeading) return false
      // DOCUMENT_POSITION_FOLLOWING = 4: heroHeading follows banner => banner is before hero
      return !!(banner.compareDocumentPosition(heroHeading) & Node.DOCUMENT_POSITION_FOLLOWING)
    })
    expect(bannerBeforeHero).toBe(true)
  })

  test('DiaryTimelineEntry layout not broken — markers exist and diary link visible', async ({ page }) => {
    await page.goto('/')

    // At least one marker rendered (diary data loaded)
    const markers = page.locator('[data-testid="diary-marker"]')
    await expect(markers.first()).toBeVisible()

    // View full log link still present
    await expect(page.getByText('— View full log →', { exact: true })).toBeVisible()
  })

  test('AC-028-MARKER-COORD-INTEGRITY: marker boundingBox width=20 height=14 after flex-col refactor', async ({ page }) => {
    await page.goto('/')
    const markers = page.locator('[data-testid="diary-marker"]')
    await expect(markers.first()).toBeVisible()
    const count = await markers.count()
    expect(count).toBeGreaterThanOrEqual(3)

    for (let i = 0; i < Math.min(count, 3); i++) {
      const box = await markers.nth(i).boundingBox()
      expect(box).not.toBeNull()
      expect(box!.width).toBe(20)
      expect(box!.height).toBe(14)

      const bg = await markers.nth(i).evaluate(el => getComputedStyle(el).backgroundColor)
      expect(bg).toBe('rgb(156, 74, 59)')

      const radius = await markers.nth(i).evaluate(el => getComputedStyle(el).borderRadius)
      expect(radius).toBe('0px')
    }
  })

  test('AC-028-MARKER-COUNT-INTEGRITY: marker count equals diary entry count (no double render / drop)', async ({ page }) => {
    await page.goto('/')

    // Wait for diary entries to hydrate (useDiary fetch)
    await expect(page.locator('[data-testid="diary-entry-wrapper"]').first()).toBeVisible()

    const entries = page.locator('[data-testid="diary-entry-wrapper"]')
    const markers = page.locator('[data-testid="diary-marker"]')

    const entryCount = await entries.count()
    const markerCount = await markers.count()

    // useDiary(3) slices to 3 — entry count === marker count (1:1)
    expect(entryCount).toBe(markerCount)
    expect(entryCount).toBeGreaterThanOrEqual(3)
  })
})

// ── AC-028-SECTION-SPACING ──────────────────────────────────────────────────
// Given: user visits /
// When:  page loads
// Then:  vertical gap between HeroSection ↔ ProjectLogicSection and
//        ProjectLogicSection ↔ DevDiarySection matches Pencil frame 4CsvQ hpBody gap:72
//        (desktop) / gap-6=24px (mobile < sm breakpoint).
//
// Tolerance: ±2px for sub-pixel rendering.

test.describe('HomePage — AC-028-SECTION-SPACING', () => {
  test('desktop 1280px: HeroSection ↔ ProjectLogicSection gap = 72px (±2px)', async ({ page }) => {
    // Default Playwright viewport = 1280x720 (≥ sm breakpoint 640px → sm:gap-[72px] applies)
    await page.goto('/')

    const hero = page.locator('section').filter({ hasText: 'K-line similarity' })
    const logic = page.locator('section').filter({ hasText: '§ PROJECT LOGIC' })

    const heroBox = await hero.boundingBox()
    const logicBox = await logic.boundingBox()
    expect(heroBox).not.toBeNull()
    expect(logicBox).not.toBeNull()

    const gap = logicBox!.y - (heroBox!.y + heroBox!.height)
    expect(gap).toBeGreaterThanOrEqual(70)
    expect(gap).toBeLessThanOrEqual(74)
  })

  test('desktop 1280px: ProjectLogicSection ↔ DevDiarySection gap = 72px (±2px)', async ({ page }) => {
    await page.goto('/')

    const logic = page.locator('section').filter({ hasText: '§ PROJECT LOGIC' })
    const diary = page.locator('section').filter({ hasText: '§ DEV DIARY' })

    const logicBox = await logic.boundingBox()
    const diaryBox = await diary.boundingBox()
    expect(logicBox).not.toBeNull()
    expect(diaryBox).not.toBeNull()

    const gap = diaryBox!.y - (logicBox!.y + logicBox!.height)
    expect(gap).toBeGreaterThanOrEqual(70)
    expect(gap).toBeLessThanOrEqual(74)
  })

  test('mobile 375px: both section gaps = 24px (gap-6, ±2px)', async ({ page }) => {
    // 375px < 640px (sm breakpoint) → gap-6 = 24px applies
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    const hero = page.locator('section').filter({ hasText: 'K-line similarity' })
    const logic = page.locator('section').filter({ hasText: '§ PROJECT LOGIC' })
    const diary = page.locator('section').filter({ hasText: '§ DEV DIARY' })

    const heroBox = await hero.boundingBox()
    const logicBox = await logic.boundingBox()
    const diaryBox = await diary.boundingBox()

    const heroLogicGap = logicBox!.y - (heroBox!.y + heroBox!.height)
    const logicDiaryGap = diaryBox!.y - (logicBox!.y + logicBox!.height)

    expect(heroLogicGap).toBeGreaterThanOrEqual(22)
    expect(heroLogicGap).toBeLessThanOrEqual(26)
    expect(logicDiaryGap).toBeGreaterThanOrEqual(22)
    expect(logicDiaryGap).toBeLessThanOrEqual(26)
  })

  test('tablet 640px (Tailwind sm breakpoint start): gap = 72px (desktop value applies)', async ({ page }) => {
    // 640px is exactly where sm: prefix activates → sm:gap-[72px]
    await page.setViewportSize({ width: 640, height: 812 })
    await page.goto('/')

    const hero = page.locator('section').filter({ hasText: 'K-line similarity' })
    const logic = page.locator('section').filter({ hasText: '§ PROJECT LOGIC' })

    const heroBox = await hero.boundingBox()
    const logicBox = await logic.boundingBox()

    const gap = logicBox!.y - (heroBox!.y + heroBox!.height)
    expect(gap).toBeGreaterThanOrEqual(70)
    expect(gap).toBeLessThanOrEqual(74)
  })

  test('tablet 639px (just below sm breakpoint): gap = 24px (mobile value applies)', async ({ page }) => {
    // 639px is 1px below sm → base gap-6 = 24px applies
    await page.setViewportSize({ width: 639, height: 812 })
    await page.goto('/')

    const hero = page.locator('section').filter({ hasText: 'K-line similarity' })
    const logic = page.locator('section').filter({ hasText: '§ PROJECT LOGIC' })

    const heroBox = await hero.boundingBox()
    const logicBox = await logic.boundingBox()

    const gap = logicBox!.y - (heroBox!.y + heroBox!.height)
    expect(gap).toBeGreaterThanOrEqual(22)
    expect(gap).toBeLessThanOrEqual(26)
  })
})

// ── AC-028-DIARY-ENTRY-NO-OVERLAP ───────────────────────────────────────────
// Given: user visits /, diary.json returns ≥ 3 milestones with varying text lengths
// When:  page scrolled to Diary section
// Then:  first 3 diary-entry-wrapper bounding boxes do not overlap:
//        entry[N].y + height ≤ entry[N+1].y (±2px tolerance)

test.describe('HomePage — AC-028-DIARY-ENTRY-NO-OVERLAP', () => {
  test('desktop 1280px: first 3 entries do not overlap (adjacent bbox ordering)', async ({ page }) => {
    await page.goto('/')

    const entries = page.locator('[data-testid="diary-entry-wrapper"]')
    await expect(entries.first()).toBeVisible()

    const count = await entries.count()
    expect(count).toBeGreaterThanOrEqual(3)

    const upper = Math.min(count, 3) - 1
    for (let i = 0; i < upper; i++) {
      const a = await entries.nth(i).boundingBox()
      const b = await entries.nth(i + 1).boundingBox()
      expect(a).not.toBeNull()
      expect(b).not.toBeNull()
      // bottom of entry N ≤ top of entry N+1 (with +2px tolerance for sub-pixel)
      expect(a!.y + a!.height).toBeLessThanOrEqual(b!.y + 2)
    }
  })

  test('mobile 375px: first 3 entries do not overlap', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    const entries = page.locator('[data-testid="diary-entry-wrapper"]')
    await expect(entries.first()).toBeVisible()

    const count = await entries.count()
    expect(count).toBeGreaterThanOrEqual(3)

    const upper = Math.min(count, 3) - 1
    for (let i = 0; i < upper; i++) {
      const a = await entries.nth(i).boundingBox()
      const b = await entries.nth(i + 1).boundingBox()
      expect(a).not.toBeNull()
      expect(b).not.toBeNull()
      expect(a!.y + a!.height).toBeLessThanOrEqual(b!.y + 2)
    }
  })
})

// ── AC-028-DIARY-RAIL-VISIBLE ───────────────────────────────────────────────
// Given: diary.json ≥ 3 milestones
// When:  page loaded to Diary section
// Then:  rail element exists with width=1, height>0, and rail top/bottom
//        fall within diary-entries container bbox range.
// PM ruling 2026-04-21 (see ticket AC-028-DIARY-RAIL-VISIBLE PM Note):
// marker-center ±4px clause removed — AC states visual intent (rail exists
// inside container), not property value (Architect decides rail geometry).

test.describe('HomePage — AC-028-DIARY-RAIL-VISIBLE', () => {
  test('rail exists with width=1 height>0 inside diary-entries container', async ({ page }) => {
    await page.goto('/')

    const rail = page.locator('[data-testid="diary-rail"]')
    await expect(rail).toBeVisible()

    const railBox = await rail.boundingBox()
    expect(railBox).not.toBeNull()
    expect(railBox!.width).toBeCloseTo(1, 0)
    expect(railBox!.height).toBeGreaterThan(0)

    const entriesContainer = page.locator('[data-testid="diary-entries"]')
    await expect(entriesContainer).toBeVisible()
    const containerBox = await entriesContainer.boundingBox()
    expect(containerBox).not.toBeNull()

    const railTop = railBox!.y
    const railBottom = railBox!.y + railBox!.height
    const containerTop = containerBox!.y
    const containerBottom = containerBox!.y + containerBox!.height

    // Rail's top/bottom must fall within the diary-entries container bbox
    expect(railTop).toBeGreaterThanOrEqual(containerTop)
    expect(railBottom).toBeLessThanOrEqual(containerBottom)
  })
})

// ── AC-028-DIARY-EMPTY-BOUNDARY ─────────────────────────────────────────────
// Given: diary.json returns 0 milestones → no entries, no rail
// Given: diary.json returns exactly 1 milestone → 1 entry, marker visible,
//        rail may collapse to height 0 but layout must not crash.

test.describe('HomePage — AC-028-DIARY-EMPTY-BOUNDARY', () => {
  test('diary.json returns 0 entries: entry count = 0, rail absent or height 0', async ({ page }) => {
    // Intercept /diary.json before navigation
    await page.route('**/diary.json', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    await page.goto('/')

    // Dev Diary section still renders (header + subtitle) but no entries
    await expect(page.getByText('DEV DIARY')).toBeVisible()

    const entries = page.locator('[data-testid="diary-entry-wrapper"]')
    await expect(entries).toHaveCount(0)

    // Rail is inside diary-entries wrapper which is gated by milestones.length > 0,
    // so both rail and entries wrapper should be absent.
    const rail = page.locator('[data-testid="diary-rail"]')
    const railCount = await rail.count()
    if (railCount > 0) {
      const box = await rail.boundingBox()
      // If rail still renders, its height must collapse to 0
      expect(box?.height ?? 0).toBeLessThanOrEqual(0)
    } else {
      expect(railCount).toBe(0)
    }
  })

  test('diary.json returns 1 entry: entry count = 1, marker 20x14 visible', async ({ page }) => {
    await page.route('**/diary.json', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        // K-024 Phase 1: flat schema — DiaryEntry { ticketId?, title, date, text }
        body: JSON.stringify([
          {
            ticketId: 'K-999',
            title: 'Solo entry for empty-boundary test',
            date: '2026-04-21',
            text: 'Single entry test text.',
          },
        ]),
      })
    })

    await page.goto('/')

    const entries = page.locator('[data-testid="diary-entry-wrapper"]')
    await expect(entries).toHaveCount(1)

    const marker = page.locator('[data-testid="diary-marker"]').first()
    const box = await marker.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBe(20)
    expect(box!.height).toBe(14)
  })
})
