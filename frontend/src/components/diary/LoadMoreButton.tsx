// K-024 Phase 3 — /diary Load more button (design §6.3 / §6.7).
// AC-024-DIARY-PAGE-CURATION: button click + client-side slicing.
// Disabled while a load-more click is in flight (useDiaryPagination concurrency
// gate); DOM-level disabled prevents rapid double-click from advancing twice.

interface LoadMoreButtonProps {
  onClick: () => void
  disabled: boolean
}

export default function LoadMoreButton({ onClick, disabled }: LoadMoreButtonProps) {
  return (
    <div className="flex justify-end mt-12">
      <button
        type="button"
        data-testid="diary-load-more"
        onClick={onClick}
        disabled={disabled}
        aria-label="Load more diary entries"
        className="font-mono text-[11px] sm:text-[12px] font-bold text-[#9C4A3B] tracking-wide hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Load more ↓
      </button>
    </div>
  )
}
