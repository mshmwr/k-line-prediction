import type { DiaryEntry } from '../types/diary'

// K-024 Phase 1 — contract per design §3.5 + AC-024-HOMEPAGE-CURATION tie-break.
// Sort by date desc; for ties, the entry later in the original array (higher index)
// is considered newer.
//
// Consumers: useDiary (Phase 2) slices this output for Homepage curation
// and /diary pagination.
export function sortDiary(entries: DiaryEntry[]): DiaryEntry[] {
  return entries
    .map((e, originalIndex) => ({ e, originalIndex }))
    .sort((a, b) => {
      if (a.e.date !== b.e.date) return a.e.date < b.e.date ? 1 : -1 // date desc
      return b.originalIndex - a.originalIndex // array-index desc (later = newer)
    })
    .map(({ e }) => e)
}
