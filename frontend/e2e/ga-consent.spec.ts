import { test, expect } from '@playwright/test'
import { mockApis } from './_fixtures/mock-apis.ts'

/**
 * K-057 Phase 5 — GDPR Consent Gate + Activation Funnel Events.
 *
 * AC-057-CONSENT-GATE: GA4 collect? must NOT fire before consent banner accepted.
 * AC-057-FUNNEL-EVENTS: 4 funnel events fire correctly after consent.
 *
 * Consent state stored in localStorage under key 'kline-consent'.
 * Tests use addInitScript to set localStorage BEFORE React mounts so
 * ConsentBanner initialState reads the correct value.
 *
 * Funnel event tests spy on window.gtag via addInitScript (no consent set,
 * so initGA never overwrites the spy). trackXxx() checks
 * typeof window.gtag === 'undefined' — spy is defined, so calls land in
 * window.dataLayer.
 */

const CONSENT_KEY = 'kline-consent'

function grantedScript() {
  return () => { localStorage.setItem('kline-consent', 'granted') }
}

// ── AC-057-CONSENT-GATE ───────────────────────────────────────────────────────

test.describe('AC-057-CONSENT-GATE — GA4 not initialised before consent', () => {
  test('T1 — fresh visit: consent banner visible, no GA script tag', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-testid="consent-banner"]')).toBeVisible()
    const scriptCount = await page.locator('script[src*="googletagmanager.com"]').count()
    expect(scriptCount, 'GA4 script must NOT be injected before consent').toBe(0)
  })

  test('T2 — accept consent: banner disappears, GA script injected', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-testid="consent-banner"]')).toBeVisible()
    await page.locator('[data-testid="consent-accept"]').click()
    await expect(page.locator('[data-testid="consent-banner"]')).not.toBeVisible()
    const scriptCount = await page.locator('script[src*="googletagmanager.com"]').count()
    expect(scriptCount, 'GA4 script must be injected after accept').toBe(1)
  })

  test('T3 — previously accepted: no banner, GA script present', async ({ page }) => {
    await page.addInitScript(grantedScript())
    await page.goto('/')
    await expect(page.locator('[data-testid="consent-banner"]')).not.toBeVisible()
    const scriptCount = await page.locator('script[src*="googletagmanager.com"]').count()
    expect(scriptCount, 'GA4 script must auto-init when previously accepted').toBe(1)
  })

  test('T4 — decline consent: banner disappears, no GA script', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-testid="consent-banner"]')).toBeVisible()
    await page.locator('[data-testid="consent-decline"]').click()
    await expect(page.locator('[data-testid="consent-banner"]')).not.toBeVisible()
    const scriptCount = await page.locator('script[src*="googletagmanager.com"]').count()
    expect(scriptCount, 'GA4 script must NOT be injected after decline').toBe(0)
  })

  test('T5 — previously declined: no banner, no GA script', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('kline-consent', 'declined') })
    await page.goto('/')
    await expect(page.locator('[data-testid="consent-banner"]')).not.toBeVisible()
    const scriptCount = await page.locator('script[src*="googletagmanager.com"]').count()
    expect(scriptCount, 'GA4 script must NOT be present for previously-declined user').toBe(0)
  })
})

// ── AC-057-FUNNEL-EVENTS ──────────────────────────────────────────────────────
//
// Set kline-consent=granted so ConsentBanner auto-hides and initGA() runs.
// initGA() sets window.dataLayer = [] and window.gtag → pushes there.
// trackXxx() calls window.gtag('event', ...) which pushes to window.dataLayer.
// Tests read window.dataLayer for expected events.

function hasEvent(dataLayer: unknown[], eventName: string): boolean {
  return (dataLayer as unknown[][]).some(
    (entry) => (entry as IArguments)[0] === 'event' && (entry as IArguments)[1] === eventName
  )
}

test.describe('AC-057-FUNNEL-EVENTS — activation events fire', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('T6 — app_demo_started fires when /app?sample=ethusdt sample loads', async ({ page }) => {
    // Grant consent so banner is hidden and initGA runs (no banner obstruction).
    await page.addInitScript(grantedScript())
    await mockApis(page)
    await page.route('/api/ma99', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          query_ma99_1h: [],
          query_ma99_1d: [],
          query_ma99_gap_1h: null,
          query_ma99_gap_1d: null,
        }),
      })
    )

    await page.goto('/app?sample=ethusdt')
    await expect(page.locator('[data-testid="official-input-section"]').getByText(/ETHUSDT_1h_test\.csv \(sample\)/)).toBeVisible({ timeout: 10_000 })

    const dataLayer = await page.evaluate(() => window.dataLayer)
    expect(
      hasEvent(dataLayer, 'app_demo_started'),
      'app_demo_started must fire after sample CSV auto-loads',
    ).toBe(true)
  })

  test('T7 — app_match_run + app_result_viewed fire after successful prediction', async ({ page }) => {
    // Grant consent so banner is hidden and initGA runs; no banner obstruction.
    await page.addInitScript(grantedScript())
    await mockApis(page)
    await page.route('/api/ma99', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ query_ma99_1h: [], query_ma99_1d: [], query_ma99_gap_1h: null, query_ma99_gap_1d: null }),
      })
    )
    const statStub = {
      label: 'Day 1', price: 3000, pct: 1.0,
      occurrence_bar: 1, occurrence_window: 1, historical_time: '2024-01-02 12:00',
    }
    await page.route('/api/predict', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          matches: [{
            id: 'match-001', correlation: 0.9,
            historical_ohlc: [], future_ohlc: [],
            historical_ohlc_1d: [], future_ohlc_1d: [],
            start_date: '2024-01-01 00:00', end_date: '2024-01-24 23:00',
            historical_ma99: [], future_ma99: [],
            historical_ma99_1d: [], future_ma99_1d: [],
          }],
          stats: {
            highest: statStub, second_highest: statStub,
            second_lowest: statStub, lowest: statStub,
            win_rate: 1.0, mean_correlation: 0.9,
            consensus_forecast_1h: [], consensus_forecast_1d: [],
          },
          query_ma99_1h: [], query_ma99_1d: [],
          query_ma99_gap_1h: null, query_ma99_gap_1d: null,
        }),
      })
    )

    await page.goto('/app?sample=ethusdt')
    await expect(page.locator('[data-testid="official-input-section"]').getByText(/ETHUSDT_1h_test\.csv \(sample\)/)).toBeVisible({ timeout: 10_000 })

    const predictBtn = page.locator('button').filter({ hasText: /Start Prediction/i })
    await expect(predictBtn).toBeEnabled({ timeout: 8_000 })
    await predictBtn.click()

    // Wait for dataLayer to receive the match_run event (async after predict response)
    await page.waitForFunction(
      () => (window.dataLayer as unknown[][]).some(
        (e) => (e as IArguments)[0] === 'event' && (e as IArguments)[1] === 'app_match_run'
      ),
      { timeout: 10_000 }
    )

    const dataLayer = await page.evaluate(() => window.dataLayer)
    expect(hasEvent(dataLayer, 'app_match_run'), 'app_match_run must fire after prediction').toBe(true)
    expect(hasEvent(dataLayer, 'app_result_viewed'), 'app_result_viewed must fire when ≥1 match').toBe(true)
  })

  // Known gap: app_csv_uploaded — requires file-input upload interaction;
  // verified via manual Playwright probe (AC-057-FUNNEL-EVENTS PM smoke).
})
