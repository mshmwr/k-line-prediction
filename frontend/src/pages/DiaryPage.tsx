import { useDiary } from '../hooks/useDiary'
import { useDiaryPagination } from '../hooks/useDiaryPagination'
import UnifiedNavBar from '../components/UnifiedNavBar'
import DiaryHero from '../components/diary/DiaryHero'
import DiaryTimeline from '../components/diary/DiaryTimeline'
import DiaryLoading from '../components/diary/DiaryLoading'
import DiaryError from '../components/diary/DiaryError'
import DiaryEmptyState from '../components/diary/DiaryEmptyState'
import LoadMoreButton from '../components/diary/LoadMoreButton'
import Footer from '../components/shared/Footer'

// K-024 Phase 3 — /diary full rewrite (design §6.1 / §6.9).
// Flat timeline: DiaryHero + DiaryTimeline (ol/li + rail + markers + entries)
// + LoadMoreButton. Consumes flat DiaryEntry[] via useDiary (no limit = full
// sorted array), then slices through useDiaryPagination for Load-more pattern.
//
// State transitions (mutually exclusive render gates):
//   loading                      → <DiaryLoading>
//   error                        → <DiaryError message loading onRetry>
//   !loading && !error && 0      → <DiaryEmptyState>
//   !loading && !error && N>0    → <DiaryTimeline> (+ <LoadMoreButton> when hasMore)
//
// Content container: max-w-[1248px] + mx-auto (AC-024-CONTENT-WIDTH) + px-6
// sm:px-24 (mobile ≤ 640px → 24px, desktop ≥ 640px → 96px per AC-024-CONTENT-WIDTH
// & design §6.8).
//
// K-034 Phase 3 (2026-04-23) — /diary adopts shared Footer.
// <Footer /> rendered as last sibling of root <div className="min-h-screen">,
// full-bleed (outside <main> padded ancestor), matching /about + /business-logic
// pattern. Footer renders regardless of terminal state (loading / error / empty /
// timeline) per AC-034-P3-DIARY-FOOTER-LOADING-VISIBLE Option A.
// Retires: K-017 AC-017-FOOTER /diary negative, K-024 /diary no-footer Sacred,
// K-034 Phase 1 T4 AC-034-P1-NO-FOOTER-ROUTES /diary row.

export default function DiaryPage() {
  const { entries, loading, error, refetch } = useDiary()
  const { visible, hasMore, loadMore, canLoadMore } = useDiaryPagination(entries)

  return (
    <div className="min-h-screen">
      <UnifiedNavBar />
      <main className="px-6 sm:px-24 pb-12 mx-auto max-w-[1248px]" data-testid="diary-main">
        <DiaryHero />

        {loading && <DiaryLoading />}

        {error && (
          <DiaryError message={error} loading={loading} onRetry={refetch} />
        )}

        {!loading && !error && visible.length === 0 && <DiaryEmptyState />}

        {!loading && !error && visible.length > 0 && (
          <>
            <DiaryTimeline entries={visible} />
            {hasMore && (
              <LoadMoreButton onClick={loadMore} disabled={!canLoadMore} />
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
