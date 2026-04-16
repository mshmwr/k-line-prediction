interface ErrorMessageProps {
  message: string
  onRetry?: () => void
  className?: string
}

export default function ErrorMessage({ message, onRetry, className = '' }: ErrorMessageProps) {
  return (
    <div className={`text-red-400 ${className}`}>
      <p>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-sm text-purple-400 underline hover:text-purple-300"
        >
          Retry
        </button>
      )}
    </div>
  )
}
