// K-024 Phase 3 — /diary error state (design §6.3 / §6.4).
// data-testid="diary-error" + role="alert" (AC-024-LOADING-ERROR-PRESERVED).
// Retry button is `disabled` while loading=true to prevent rapid double-click
// fetch races. `word-break: break-word` + `overflow-wrap` on message ensure
// long err.message strings don't overflow mobile viewports.

interface DiaryErrorProps {
  message: string
  loading: boolean
  onRetry: () => void
}

const FALLBACK_MESSAGE = "Couldn't load the diary right now. Please try again."

export default function DiaryError({ message, loading, onRetry }: DiaryErrorProps) {
  const displayMessage = message && message.trim().length > 0 ? message : FALLBACK_MESSAGE

  return (
    <div
      data-testid="diary-error"
      role="alert"
      className="py-12 text-ink"
    >
      <p
        className="text-[15px] sm:text-[16px] leading-[1.55] mb-4 break-words"
        style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
      >
        {displayMessage}
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={loading}
        className="font-mono text-[12px] font-bold text-[#9C4A3B] tracking-wide hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Retry
      </button>
    </div>
  )
}
