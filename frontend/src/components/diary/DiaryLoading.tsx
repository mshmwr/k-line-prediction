import LoadingSpinner from '../common/LoadingSpinner'

// K-024 Phase 3 — /diary loading state wrapper (design §6.3 / §6.4).
// Provides `data-testid="diary-loading"` + ARIA role/label required by
// AC-024-LOADING-ERROR-PRESERVED. Inner LoadingSpinner retains its existing
// visual (dark residue); paper-palette migration is tracked as TD-K024-01.

export default function DiaryLoading() {
  return (
    <div
      data-testid="diary-loading"
      role="status"
      aria-label="Loading diary entries"
      className="flex justify-center py-16"
    >
      {/* TODO TD-K024-01: LoadingSpinner paper-palette migration (out of scope for K-024) */}
      <LoadingSpinner label="Loading diary…" />
    </div>
  )
}
