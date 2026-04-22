import { useCallback, useMemo, useRef, useState } from 'react'
import type { DiaryEntry } from '../types/diary'

// K-024 Phase 2 — client-side pagination over an already-sorted DiaryEntry[].
// Design §4.2 contract:
//   initial page size = 5
//   load-more step   = +5 (capped at total)
//   inFlight gate    = rapid double-click collapses to one +5 advance
//
// Consumer: DiaryPage (Phase 3). No LocalStorage / no URL sync — pure in-memory.

export const DIARY_INITIAL_PAGE_SIZE = 5
export const DIARY_LOAD_MORE_STEP = 5

interface UseDiaryPaginationResult {
  visible: DiaryEntry[]
  hasMore: boolean
  loadMore: () => void
  canLoadMore: boolean // false while a load-more click is in-flight
}

export function useDiaryPagination(all: DiaryEntry[]): UseDiaryPaginationResult {
  const [count, setCount] = useState(DIARY_INITIAL_PAGE_SIZE)
  const [inFlight, setInFlight] = useState(false)
  // Ref mirror avoids a stale-closure gap when two synchronous calls race
  // before React commits the `inFlight` state update.
  const inFlightRef = useRef(false)

  const visible = useMemo(() => all.slice(0, count), [all, count])
  const hasMore = count < all.length

  const loadMore = useCallback(() => {
    if (inFlightRef.current) return // AC-024-DIARY-PAGE-CURATION concurrency gate
    inFlightRef.current = true
    setInFlight(true)
    setCount((prev) => Math.min(prev + DIARY_LOAD_MORE_STEP, all.length))
    queueMicrotask(() => {
      inFlightRef.current = false
      setInFlight(false)
    })
  }, [all.length])

  const canLoadMore = hasMore && !inFlight

  return { visible, hasMore, loadMore, canLoadMore }
}
