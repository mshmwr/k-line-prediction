type DisabledReason = 'ohlcIncomplete' | 'noSelection' | 'maLoading' | null

interface Props {
  disabled: boolean
  disabledReason: DisabledReason
  onClick: () => void
  loading: boolean
}

const TOOLTIP: Record<NonNullable<DisabledReason>, string> = {
  ohlcIncomplete: 'Complete all rows',
  noSelection: 'Select at least 1 case',
  maLoading: 'MA99 計算中，請稍候…',
}

export function PredictButton({ disabled, disabledReason, onClick, loading }: Props) {
  const tooltip = disabledReason ? TOOLTIP[disabledReason] : undefined
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      title={tooltip}
      className={`w-full py-2 rounded font-bold tracking-wide transition-colors ${
        disabled || loading
          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
          : 'bg-orange-500 hover:bg-orange-400 text-white cursor-pointer'
      }`}
    >
      {loading ? 'Predicting...' : '▶ Start Prediction'}
    </button>
  )
}
