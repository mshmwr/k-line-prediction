import { PlayIcon } from 'lucide-react'
import LoadingSpinner from './common/LoadingSpinner'

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
  maLoading: 'MA99 computing, please wait...',
}

export function PredictButton({ disabled, disabledReason, onClick, loading }: Props) {
  const tooltip = disabledReason ? TOOLTIP[disabledReason] : undefined

  if (loading) {
    return <LoadingSpinner label="Running prediction..." />
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={`flex items-center justify-center gap-2 w-[320px] h-[40px] rounded font-mono text-[13px] font-bold text-white transition-colors ${
        disabled
          ? 'bg-violet-700 opacity-50 cursor-not-allowed'
          : 'bg-violet-700 hover:bg-violet-600 cursor-pointer'
      }`}
    >
      <PlayIcon size={16} />
      Start Prediction
    </button>
  )
}
