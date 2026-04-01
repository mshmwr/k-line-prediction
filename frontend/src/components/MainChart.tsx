import { useRef, useState, useEffect } from 'react'
import { OHLCRow, MatchCase } from '../types'

interface Props {
  userOhlc: OHLCRow[]
  appliedMatches: MatchCase[]
  height?: number
}

export function MainChart({ userOhlc, appliedMatches, height = 300 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const userCandles = userOhlc
    .filter(r => r.close !== '' && !isNaN(Number(r.close)))
    .map(r => ({
      open: +r.open, high: +r.high, low: +r.low, close: +r.close,
      type: 'user' as const,
    }))

  const futureCandles = (appliedMatches[0]?.futureOhlc ?? []).map(c => ({
    ...c, type: 'forecast' as const,
  }))

  const allCandles = [...userCandles, ...futureCandles]
  const splitIdx = userCandles.length

  const H = height
  const pad = { t: 20, b: 28, l: 56, r: 12 }
  const chartH = H - pad.t - pad.b
  const chartW = width - pad.l - pad.r

  if (allCandles.length === 0) {
    return (
      <div ref={containerRef} className="w-full bg-gray-900 rounded" style={{ height: H }}>
        <div className="flex items-center justify-center h-full text-gray-600 text-sm">
          Enter OHLC data to see chart
        </div>
      </div>
    )
  }

  const yMax = Math.max(...allCandles.map(c => c.high))
  const yMin = Math.min(...allCandles.map(c => c.low))
  const yPad = (yMax - yMin) * 0.06 || 1
  const domainMax = yMax + yPad
  const domainMin = yMin - yPad
  const yRange = domainMax - domainMin

  const toY = (v: number) => pad.t + chartH * (1 - (v - domainMin) / yRange)
  const colW = chartW / allCandles.length
  const candleW = Math.max(2, colW - 2)
  const toX = (i: number) => pad.l + (i + 0.5) * colW
  const splitX = pad.l + splitIdx * colW

  const yTicks = Array.from({ length: 5 }, (_, i) => domainMin + (yRange * i) / 4)

  return (
    <div ref={containerRef} className="w-full bg-gray-900 rounded" style={{ height: H }}>
      <svg data-testid="main-chart-svg" width={width} height={H}>
        {/* Grid lines */}
        {yTicks.map((v, i) => (
          <line
            key={i}
            x1={pad.l} x2={width - pad.r}
            y1={toY(v)} y2={toY(v)}
            stroke="#374151" strokeWidth={0.5}
          />
        ))}

        {/* Y axis labels */}
        {yTicks.map((v, i) => (
          <text
            key={i}
            x={pad.l - 4} y={toY(v)}
            textAnchor="end" dominantBaseline="middle"
            fontSize={10} fill="#9ca3af"
          >
            {v.toFixed(0)}
          </text>
        ))}

        {/* Candlesticks */}
        {allCandles.map((c, i) => {
          const bullish = c.close >= c.open
          const isForecast = c.type === 'forecast'
          const color = isForecast
            ? (bullish ? '#86efac' : '#fca5a5')
            : (bullish ? '#22c55e' : '#ef4444')
          const cx = toX(i)
          const yHigh = toY(c.high)
          const yLow = toY(c.low)
          const yTop = toY(Math.max(c.open, c.close))
          const yBot = toY(Math.min(c.open, c.close))
          const bodyH = Math.max(1, yBot - yTop)

          return (
            <g key={i}>
              <line x1={cx} x2={cx} y1={yHigh} y2={yLow} stroke={color} strokeWidth={1} />
              <rect x={cx - candleW / 2} y={yTop} width={candleW} height={bodyH} fill={color} />
            </g>
          )
        })}

        {/* Orange dashed "Now" split line */}
        {splitIdx > 0 && futureCandles.length > 0 && (
          <g>
            <line
              x1={splitX} x2={splitX}
              y1={pad.t} y2={H - pad.b}
              stroke="#f97316" strokeDasharray="6 3" strokeWidth={1.5}
            />
            <text x={splitX + 4} y={pad.t + 10} fontSize={10} fill="#f97316">Now</text>
          </g>
        )}

        {/* Legend */}
        <rect x={pad.l} y={H - pad.b + 7} width={8} height={8} fill="#22c55e" />
        <text x={pad.l + 12} y={H - pad.b + 15} fontSize={10} fill="#9ca3af">Current</text>
        {futureCandles.length > 0 && (
          <>
            <rect x={pad.l + 68} y={H - pad.b + 7} width={8} height={8} fill="#86efac" />
            <text x={pad.l + 80} y={H - pad.b + 15} fontSize={10} fill="#9ca3af">Forecast</text>
          </>
        )}
      </svg>
    </div>
  )
}
