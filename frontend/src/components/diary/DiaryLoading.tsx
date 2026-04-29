// K-059 — DiaryLoading paper-palette rebrand (design §5).
// Outer <div> attributes preserved byte-for-byte (Sacred AC-059-A11Y-LOADING /
// AC-024-LOADING-ERROR-PRESERVED): data-testid, role, aria-label, className.
// Inner LoadingSpinner removed; replaced with inline paper-palette pulse row
// (bg-[#F4EFE5] + ink dots bg-[#2A2520] + "Loading diary…" text).
//
// T-L1 invariant: outer div textContent contains "Loading diary" substring.

export default function DiaryLoading() {
  return (
    <div
      data-testid="diary-loading"
      role="status"
      aria-label="Loading diary entries"
      className="flex justify-center py-16"
    >
      <div className="bg-[#F4EFE5] rounded-lg px-8 py-6 flex flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2A2520] animate-pulse" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#2A2520] animate-pulse [animation-delay:120ms]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#2A2520] animate-pulse [animation-delay:240ms]" />
        </div>
        <p className="text-[#2A2520] font-mono text-[12px]">Loading diary…</p>
      </div>
    </div>
  )
}
