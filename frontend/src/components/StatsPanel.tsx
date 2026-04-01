import { PredictStats } from '../types'

interface Props {
  stats: PredictStats | null
  isDirty: boolean
}

export function StatsPanel({ stats, isDirty }: Props) {
  if (!stats) return <div className="text-gray-500 text-sm">Run prediction to see results.</div>
  return (
    <div className="flex flex-col gap-3">
      {isDirty && (
        <div className="text-yellow-400 text-xs border border-yellow-600 rounded px-2 py-1">
          ⚠️ Selection changed. Click 'Start Prediction' to sync.
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Optimistic', value: stats.optimistic, color: 'text-green-400' },
          { label: 'Baseline', value: stats.baseline, color: 'text-blue-300' },
          { label: 'Pessimistic', value: stats.pessimistic, color: 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-800 rounded p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className={`text-lg font-bold font-mono ${color}`}>{value != null ? value.toFixed(2) : '—'}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-4 text-sm">
        <span className="text-gray-400">Win Rate: <span className="text-white">{stats.winRate != null ? (stats.winRate * 100).toFixed(1) : '—'}%</span></span>
        <span className="text-gray-400">Avg r: <span className="text-white">{stats.meanCorrelation != null ? stats.meanCorrelation.toFixed(4) : '—'}</span></span>
      </div>
    </div>
  )
}
