import { MatchCase } from '../types'

interface Props {
  matches: MatchCase[]
  selected: Set<string>
  onToggle: (id: string) => void
}

function MiniChart({
  historical,
  future,
}: {
  historical: Array<{ open: number; high: number; low: number; close: number }>
  future: Array<{ open: number; high: number; low: number; close: number }>
}) {
  const all = [...historical, ...future]
  if (all.length === 0) {
    return <div className="w-28 h-14 bg-gray-700 rounded flex-shrink-0" />
  }

  const W = 112, H = 56
  const pad = { t: 3, b: 3, l: 3, r: 3 }
  const cw = W - pad.l - pad.r
  const ch = H - pad.t - pad.b

  const yMax = Math.max(...all.map(c => c.high))
  const yMin = Math.min(...all.map(c => c.low))
  const yRange = yMax - yMin || 1

  const toY = (v: number) => pad.t + ch * (1 - (v - yMin) / yRange)
  const colW = cw / all.length
  const candleW = Math.max(1, colW - 1)
  const toX = (i: number) => pad.l + (i + 0.5) * colW
  const splitX = pad.l + historical.length * colW

  return (
    <svg data-testid="mini-chart" width={W} height={H} className="rounded flex-shrink-0 bg-gray-700">
      {all.map((c, i) => {
        const isFuture = i >= historical.length
        const bullish = c.close >= c.open
        const color = isFuture
          ? (bullish ? '#86efac' : '#fca5a5')
          : (bullish ? '#22c55e' : '#ef4444')
        const cx = toX(i)
        const yTop = toY(Math.max(c.open, c.close))
        const yBot = toY(Math.min(c.open, c.close))
        return (
          <g key={i}>
            <line x1={cx} x2={cx} y1={toY(c.high)} y2={toY(c.low)} stroke={color} strokeWidth={1} />
            <rect
              x={cx - candleW / 2}
              y={yTop}
              width={candleW}
              height={Math.max(1, yBot - yTop)}
              fill={color}
            />
          </g>
        )
      })}
      {historical.length > 0 && future.length > 0 && (
        <line
          x1={splitX} x2={splitX}
          y1={pad.t} y2={H - pad.b}
          stroke="#f97316" strokeDasharray="4 2" strokeWidth={1}
        />
      )}
    </svg>
  )
}

export function MatchList({ matches, selected, onToggle }: Props) {
  return (
    <div className="flex flex-col gap-2 overflow-y-auto max-h-[400px]">
      {matches.map(m => {
        const checked = selected.has(m.id)
        const hist = m.historicalOhlc ?? []
        const fut = m.futureOhlc ?? []
        return (
          <label
            key={m.id}
            className={`flex items-center gap-3 p-3 rounded bg-gray-800 border border-gray-700 cursor-pointer transition-opacity ${checked ? '' : 'opacity-50'}`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(m.id)}
              className="accent-orange-400"
            />
            <MiniChart historical={hist} future={fut} />
            <div>
              <div className="text-sm font-mono text-orange-300">
                r = {m.correlation != null ? m.correlation.toFixed(4) : '—'}
              </div>
              <div className="text-xs text-gray-400">{m.startDate}</div>
              <div className="text-xs text-gray-600">{hist.length}+{fut.length} bars</div>
            </div>
          </label>
        )
      })}
    </div>
  )
}
