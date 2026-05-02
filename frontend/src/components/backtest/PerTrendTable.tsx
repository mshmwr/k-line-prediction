import type { BacktestSummary } from '../../types/backtest'

interface PerTrendTableProps {
  summary: BacktestSummary | null
  status: 'loading' | 'ready' | 'error'
}

const TREND_ORDER = ['up', 'down', 'flat'] as const

export default function PerTrendTable({ summary, status }: PerTrendTableProps) {
  if (status !== 'ready' || summary == null) return null

  return (
    <div className="rounded-xl border border-ink/10 bg-paper p-6 overflow-x-auto">
      <h2 className="font-mono text-sm font-semibold text-ink/60 uppercase tracking-wider mb-4">
        Per-Trend Breakdown
      </h2>
      <table data-testid="per-trend-table" className="w-full text-sm font-mono">
        <thead>
          <tr className="border-b border-ink/10">
            <th className="text-left py-2 pr-4 text-ink/50 font-medium">Trend</th>
            <th className="text-right py-2 px-4 text-ink/50 font-medium">High Hit %</th>
            <th className="text-right py-2 px-4 text-ink/50 font-medium">Low Hit %</th>
            <th className="text-right py-2 px-4 text-ink/50 font-medium">Avg MAE</th>
            <th className="text-right py-2 pl-4 text-ink/50 font-medium">Samples</th>
          </tr>
        </thead>
        <tbody>
          {TREND_ORDER.map(trend => {
            const entry = summary.per_trend[trend]
            return (
              <tr key={trend} className="border-b border-ink/5 last:border-0">
                <td className="py-2 pr-4 capitalize text-ink font-semibold">{trend}</td>
                <td className="text-right py-2 px-4 text-ink">
                  {entry ? `${(entry.hit_rate_high * 100).toFixed(1)}%` : 'N/A'}
                </td>
                <td className="text-right py-2 px-4 text-ink">
                  {entry ? `${(entry.hit_rate_low * 100).toFixed(1)}%` : 'N/A'}
                </td>
                <td className="text-right py-2 px-4 text-ink">
                  {entry ? entry.avg_mae.toFixed(4) : 'N/A'}
                </td>
                <td className="text-right py-2 pl-4 text-ink">
                  {entry ? String(entry.sample_size) : 'N/A'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
