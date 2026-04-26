import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Resets window scroll to top on every pathname change, with hash-link
 * exception (when location.hash is non-empty, browser anchor behavior wins).
 *
 * Mirrors the useGAPageview pattern (frontend/src/hooks/useGAPageview.ts) —
 * mounted inside <BrowserRouter> as a side-effect-only component returning
 * null. Uses behavior: 'instant' to avoid any smooth-scroll animation that
 * would compete with the new page's first paint.
 *
 * K-053 design doc: docs/designs/K-053-scroll-to-top.md
 */
export function ScrollToTop(): null {
  const { pathname, hash } = useLocation()

  // Disable browser scroll restoration once on mount (PM ruling BQ-K053-04 / AC-K053-06 §4).
  // Idempotent under React StrictMode dev double-invoke: assigning the same string twice
  // is a no-op. Empty dep array — runs exactly once per component lifecycle in production.
  useEffect(() => {
    history.scrollRestoration = 'manual'
  }, [])

  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])
  return null
}
