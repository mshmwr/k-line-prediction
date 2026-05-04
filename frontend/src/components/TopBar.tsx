type CopyLabel = 'idle' | 'copied' | 'error'

interface Props {
  onCopyPrediction: () => void
  copyLabel: CopyLabel
}

export function TopBar({ onCopyPrediction, copyLabel }: Props) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-gray-900 border-b border-gray-700">
      <span className="text-orange-400 font-bold tracking-wide text-sm">K-Line Predictor</span>
      <span className="rounded-full border border-gray-700 px-2 py-1 text-xs text-gray-300">
        Official input upload: 24 x 1H bars
      </span>
      <div className="flex-1" />
      <button
        onClick={onCopyPrediction}
        className={`text-xs px-2 py-1 rounded border transition-colors ${
          copyLabel === 'copied' ? 'border-green-600 text-green-400' :
          copyLabel === 'error'  ? 'border-red-600 text-red-400' :
          'border-gray-600 text-gray-300 hover:border-orange-400 hover:text-orange-300'
        }`}
      >
        {copyLabel === 'copied' ? 'Copied ✓' : copyLabel === 'error' ? 'Error ✗' : 'Copy Prediction'}
      </button>
    </div>
  )
}
