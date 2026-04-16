interface ErrorBannerProps {
  message: string
  onRetry: () => void
}

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="border border-red-800 bg-red-950/30 px-6 py-4 max-w-sm w-full">
      <p className="text-red-400 text-sm font-mono mb-3">{message}</p>
      <button
        onClick={onRetry}
        className="text-xs text-red-300 underline hover:text-red-200"
      >
        Try again
      </button>
    </div>
  )
}
