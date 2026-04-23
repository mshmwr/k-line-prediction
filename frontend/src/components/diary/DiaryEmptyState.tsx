// K-024 Phase 3 — /diary empty state (design §6.3 / §6.4).
// Shown when loading=false, error=null, and entries.length === 0.

export default function DiaryEmptyState() {
  return (
    <div data-testid="diary-empty" className="py-16">
      <p className="text-[15px] text-[#1A1814]">
        No entries yet. Check back soon.
      </p>
    </div>
  )
}
