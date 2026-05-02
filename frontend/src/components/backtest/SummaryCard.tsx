import type { BacktestSummary } from '../../types/backtest'

interface SummaryCardProps {
  summary: BacktestSummary | null
  status: 'loading' | 'ready' | 'error'
  error: string | null
}

export default function SummaryCard({ summary, status, error }: SummaryCardProps) {
  if (status === 'loading') {
    return (
      <div data-testid="summary-card-loading" className="rounded-xl border border-ink/10 bg-paper p-6">
        <div className="h-4 w-1/3 animate-pulse rounded bg-ink/10 mb-3" />
        <div className="h-8 w-2/3 animate-pulse rounded bg-ink/10" />
      </div>
    )
  }

  if (status === 'error' || summary == null) {
    return (
      <div data-testid="summary-card-error" className="rounded-xl border border-red-300 bg-red-50 p-6 text-red-700">
        {error ?? 'Data unavailable'}
      </div>
    )
  }

  return (
    <div data-testid="backtest-summary-card" className="rounded-xl border border-ink/10 bg-paper p-6">
      <h2 className="font-mono text-sm font-semibold text-ink/60 uppercase tracking-wider mb-4">
        Latest Summary
      </h2>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-ink/50 mb-1">High Hit Rate</dt>
          <dd data-testid="summary-hit_rate_high" className="font-mono text-xl font-bold text-ink">
            {(summary.hit_rate_high * 100).toFixed(1)}%
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink/50 mb-1">Low Hit Rate</dt>
          <dd data-testid="summary-hit_rate_low" className="font-mono text-xl font-bold text-ink">
            {(summary.hit_rate_low * 100).toFixed(1)}%
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink/50 mb-1">Avg MAE</dt>
          <dd data-testid="summary-avg_mae" className="font-mono text-xl font-bold text-ink">
            {summary.avg_mae.toFixed(4)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink/50 mb-1">Avg RMSE</dt>
          <dd data-testid="summary-avg_rmse" className="font-mono text-xl font-bold text-ink">
            {summary.avg_rmse.toFixed(4)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink/50 mb-1">Sample Size</dt>
          <dd data-testid="summary-sample_size" className="font-mono text-xl font-bold text-ink">
            {String(summary.sample_size)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink/50 mb-1">Window (days)</dt>
          <dd data-testid="summary-window_days" className="font-mono text-xl font-bold text-ink">
            {String(summary.window_days)}
          </dd>
        </div>
      </dl>
    </div>
  )
}
