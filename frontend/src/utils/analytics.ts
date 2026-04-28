/**
 * GA4 Analytics utilities.
 * Dynamically injects the gtag.js snippet only when VITE_GA_MEASUREMENT_ID is set.
 * All tracking calls are no-ops when the snippet is not installed.
 *
 * K-057 Phase 5: GA4 init is gated behind GDPR consent.
 * Call consentGA('granted') after user accepts the consent banner.
 */

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

let _gaInitialized = false

/**
 * Called by ConsentBanner after user grants or declines consent.
 * Only 'granted' triggers GA4 initialisation (idempotent).
 */
export function consentGA(status: 'granted' | 'declined'): void {
  if (status !== 'granted' || _gaInitialized) return
  initGA()
  _gaInitialized = true
}

/**
 * Initialises GA4 by dynamically injecting the gtag.js script.
 * Do NOT call directly from module scope — use consentGA() instead.
 * If VITE_GA_MEASUREMENT_ID is empty/undefined, this is a no-op.
 */
export function initGA(): void {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined
  if (!measurementId) return

  // Initialise dataLayer and define gtag helper.
  // MUST push `arguments` (Arguments object), not a spread Array — gtag.js
  // distinguishes gtag commands from GTM events by the Arguments-object shape.
  window.dataLayer = window.dataLayer || []
  window.gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments)
  }

  window.gtag('js', new Date())
  // send_page_view: false — pageviews are fired manually by useGAPageview hook
  window.gtag('config', measurementId, { send_page_view: false })

  // Dynamically inject the gtag.js script tag
  const script = document.createElement('script')
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  script.async = true
  document.head.appendChild(script)
}

/**
 * Sends a page_view event to GA4.
 * @param path  Current pathname (e.g. '/about')
 * @param title Human-readable page title
 */
export function trackPageview(path: string, title: string): void {
  if (typeof window.gtag === 'undefined') return
  window.gtag('event', 'page_view', {
    page_location: path,
    page_title: title,
  })
}

/**
 * Sends a cta_click event to GA4.
 * @param label Identifies which CTA was clicked (e.g. 'contact_email')
 */
export function trackCtaClick(label: string): void {
  if (typeof window.gtag === 'undefined') return
  window.gtag('event', 'cta_click', {
    label,
    page_location: window.location.pathname,
  })
}

// K-057 Phase 5 — activation funnel events

export function trackDemoStarted(): void {
  if (typeof window.gtag === 'undefined') return
  window.gtag('event', 'app_demo_started')
}

export function trackCsvUploaded(rowCount: number): void {
  if (typeof window.gtag === 'undefined') return
  window.gtag('event', 'app_csv_uploaded', { row_count: rowCount })
}

export function trackMatchRun(matchCount: number): void {
  if (typeof window.gtag === 'undefined') return
  window.gtag('event', 'app_match_run', { match_count: matchCount })
}

export function trackResultViewed(matchCount: number): void {
  if (typeof window.gtag === 'undefined') return
  window.gtag('event', 'app_result_viewed', { match_count: matchCount })
}
