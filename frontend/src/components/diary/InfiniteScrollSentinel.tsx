import { useEffect, useRef } from 'react'

// K-059 — InfiniteScrollSentinel (design §2).
// Renders a sentinel div that fires onVisible() when it enters the viewport via
// IntersectionObserver. Used on: /diary (DiaryPage) only.
//
// When hasMore=false: returns null — no DOM node emitted. This satisfies
// AC-059-NO-SENTINEL-WHEN-EXHAUSTED.
//
// Concurrency: rapid observer fires are absorbed by useDiaryPagination's
// inFlightRef gate — sentinel does not need its own gate.
//
// Test hook: in non-production environments the sentinel div carries a
// __onVisible property (set via ref callback) so that T-D9 can call loadMore()
// synchronously from page.evaluate without simulating IntersectionObserver.
// Production builds strip this — Vite drops the branch via dead-code
// elimination when import.meta.env.PROD === true.

interface InfiniteScrollSentinelProps {
  onVisible: () => void
  hasMore: boolean
}

// Extend HTMLDivElement for test hook
interface SentinelHTMLDivElement extends HTMLDivElement {
  __onVisible?: () => void
}

export default function InfiniteScrollSentinel({
  onVisible,
  hasMore,
}: InfiniteScrollSentinelProps) {
  const sentinelRef = useRef<SentinelHTMLDivElement | null>(null)

  useEffect(() => {
    if (!hasMore) return
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            onVisible()
          }
        }
      },
      { threshold: 0 },
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
    }
  }, [hasMore, onVisible])

  // T-D9 test hook: attach onVisible to the DOM node so page.evaluate can call
  // it synchronously without simulating IntersectionObserver. Only active in
  // test / dev environments (import.meta.env.PROD is false).
  const refCallback = (el: SentinelHTMLDivElement | null) => {
    sentinelRef.current = el
    if (el && !import.meta.env.PROD) {
      el.__onVisible = onVisible
    }
  }

  if (!hasMore) return null

  // h-px ensures the element has non-zero height so Playwright toBeVisible() passes
  // (empty div with no height is reported as "hidden" by Playwright visibility check).
  return <div ref={refCallback} data-testid="diary-sentinel" className="h-px" />
}
