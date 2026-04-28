import { useEffect, useState } from 'react'
import { consentGA } from '../../utils/analytics'

const CONSENT_KEY = 'kline-consent'
type ConsentState = 'granted' | 'declined' | null

function readConsentStorage(): ConsentState {
  try {
    const stored = localStorage.getItem(CONSENT_KEY)
    return stored === 'granted' || stored === 'declined' ? stored : null
  } catch {
    return null
  }
}

function writeConsentStorage(status: 'granted' | 'declined'): void {
  try {
    localStorage.setItem(CONSENT_KEY, status)
  } catch {}
}

/**
 * GDPR consent banner (K-057 Phase 5, BQ-057-03 default A: bottom-left compact).
 * - First visit (no localStorage): renders banner.
 * - Previously accepted: auto-inits GA4, no banner shown.
 * - Previously declined: no banner, no GA4.
 */
export default function ConsentBanner() {
  const [state, setState] = useState<ConsentState>(readConsentStorage)

  useEffect(() => {
    if (state === 'granted') consentGA('granted')
  }, [state])

  if (state !== null) return null

  function accept() {
    writeConsentStorage('granted')
    setState('granted')
  }

  function decline() {
    writeConsentStorage('declined')
    setState('declined')
  }

  return (
    <div
      data-testid="consent-banner"
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 z-50 max-w-[320px] rounded-lg border border-gray-600 bg-gray-900 p-4 text-sm text-gray-300 shadow-xl"
    >
      <p className="mb-3 leading-relaxed">
        This site uses Google Analytics to understand usage patterns.
        No personally identifiable information is collected.
      </p>
      <div className="flex gap-2">
        <button
          data-testid="consent-accept"
          onClick={accept}
          className="rounded bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-500"
        >
          Accept
        </button>
        <button
          data-testid="consent-decline"
          onClick={decline}
          className="rounded border border-gray-600 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200"
        >
          Decline
        </button>
      </div>
    </div>
  )
}
