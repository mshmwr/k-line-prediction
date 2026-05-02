import type { ActiveParams } from '../../types/backtest'

interface ActiveParamsCardProps {
  params: ActiveParams | null
  status: 'loading' | 'ready' | 'error'
  error: string | null
}

function formatOptimizedAt(value: string | null | undefined): string {
  if (value == null) return 'Defaults — never optimized'
  try {
    return new Date(value).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
  } catch {
    return 'Defaults — never optimized'
  }
}

export default function ActiveParamsCard({ params, status, error }: ActiveParamsCardProps) {
  if (status === 'loading') return null

  if (status === 'error' || params == null) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-red-700">
        {error ?? 'Params unavailable'}
      </div>
    )
  }

  return (
    <div data-testid="active-params-card" className="rounded-xl border border-ink/10 bg-paper p-6">
      <h2 className="font-mono text-sm font-semibold text-ink/60 uppercase tracking-wider mb-4">
        Active Parameters
      </h2>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-ink/50 mb-1">Window Days</dt>
          <dd data-testid="param-window_days" className="font-mono text-xl font-bold text-ink">
            {String(params.window_days)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink/50 mb-1">Pearson Threshold</dt>
          <dd data-testid="param-pearson_threshold" className="font-mono text-xl font-bold text-ink">
            {params.pearson_threshold.toFixed(2)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink/50 mb-1">Top K</dt>
          <dd data-testid="param-top_k" className="font-mono text-xl font-bold text-ink">
            {String(params.top_k)}
          </dd>
        </div>
        <div className="col-span-2 sm:col-span-3">
          <dt className="text-xs text-ink/50 mb-1">Params Hash (12-char)</dt>
          <dd data-testid="param-params_hash" className="font-mono text-base font-bold text-ink">
            {params.params_hash.slice(0, 12)}
          </dd>
        </div>
        <div className="col-span-2 sm:col-span-3">
          <dt className="text-xs text-ink/50 mb-1">Optimized At</dt>
          <dd data-testid="param-optimized_at" className="font-mono text-sm text-ink">
            {formatOptimizedAt(params.optimized_at)}
          </dd>
        </div>
      </dl>
    </div>
  )
}
