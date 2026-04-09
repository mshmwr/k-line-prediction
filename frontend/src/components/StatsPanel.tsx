import { useEffect, useMemo, useRef } from 'react'
import { toUTC8Display } from '../utils/time'
import { CandlestickSeries, ColorType, createChart, IChartApi, UTCTimestamp } from 'lightweight-charts'
import { PredictStats, DayStats } from '../types'

type ProjectionBar = {
  time: string
  ts?: number
  open: number
  high: number
  low: number
  close: number
}

interface Props {
  stats: PredictStats | null
  projectedFutureBars: ProjectionBar[]
  dayStats: DayStats[]
  isDirty: boolean
  selectedCount: number
  totalCount: number
}

function StatsProjectionChart({ bars }: { bars: ProjectionBar[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  const chartData = useMemo(() => (
    bars.map((bar, index) => ({
      time: (bar.ts ?? (index + 1) * 3600) as UTCTimestamp,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
    }))
  ), [bars])

  const footerLabels = useMemo(() => [
    bars[0]?.time ?? 'Hour +1',
    bars[24]?.time ?? 'Hour +25',
    bars[48]?.time ?? 'Hour +49',
    bars[71]?.time ?? 'Hour +72',
  ], [bars])

  useEffect(() => {
    if (!containerRef.current) return
    const element = containerRef.current
    const chart = createChart(element, {
      width: element.clientWidth,
      height: 220,
      layout: {
        background: { type: ColorType.Solid, color: '#171b24' },
        textColor: '#8d95a6',
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: 'rgba(63, 73, 92, 0.28)' },
        horzLines: { color: 'rgba(63, 73, 92, 0.28)' },
      },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: '#313849', scaleMargins: { top: 0.12, bottom: 0.1 } },
      timeScale: {
        borderColor: '#313849',
        timeVisible: true,
        secondsVisible: false,
        ticksVisible: false,
        barSpacing: 12,
        minBarSpacing: 8,
      },
      handleScroll: true,
      handleScale: true,
    })
    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#2fc98f',
      downColor: '#ff4d67',
      borderUpColor: '#2fc98f',
      borderDownColor: '#ff4d67',
      wickUpColor: '#2fc98f',
      wickDownColor: '#ff4d67',
      priceLineVisible: true,
      lastValueVisible: true,
    })
    series.setData(chartData)
    chart.timeScale().fitContent()

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({ width: element.clientWidth })
    })
    resizeObserver.observe(element)
    chartRef.current = chart

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartRef.current = null
    }
  }, [chartData])

  if (!bars.length) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-xl border border-[#252c39] bg-[#171b24] px-4 text-center text-sm text-[#6f788b]">
        Select at least one match to render the projected 72H candlestick view.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#252c39] bg-[#171b24]">
      <div className="flex items-center justify-between border-b border-[#252c39] px-3 py-2 text-[11px] text-[#c9d1e4]">
        <span>Projected Future 72 x 1H Candles</span>
        <span>Consensus view, not raw historical bars</span>
      </div>
      <div ref={containerRef} className="h-[220px] w-full" data-testid="stats-projection-chart" />
      <div className="flex items-center justify-between border-t border-[#252c39] px-3 py-1.5 text-[10px] text-[#8d95a6]">
        <span>{footerLabels[0]}</span>
        <span>{footerLabels[1]}</span>
        <span>{footerLabels[2]}</span>
        <span>{footerLabels[3]}</span>
      </div>
    </div>
  )
}

function DayStatsRow({ day }: { day: DayStats }) {
  return (
    <div className="rounded border border-gray-700 bg-gray-900/60 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-2">{day.label}</div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-[11px] text-gray-400">Highest</div>
          <div className="font-mono text-sm font-bold text-green-400">{day.highest.price.toFixed(2)}</div>
          <div className={`text-[11px] font-mono ${day.highest.pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {day.highest.pct >= 0 ? '+' : ''}{day.highest.pct.toFixed(2)}%
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">{day.highest.time}</div>
        </div>
        <div>
          <div className="text-[11px] text-gray-400">Lowest</div>
          <div className="font-mono text-sm font-bold text-red-400">{day.lowest.price.toFixed(2)}</div>
          <div className={`text-[11px] font-mono ${day.lowest.pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {day.lowest.pct >= 0 ? '+' : ''}{day.lowest.pct.toFixed(2)}%
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">{day.lowest.time}</div>
        </div>
      </div>
    </div>
  )
}

export function StatsPanel({ stats, projectedFutureBars, dayStats, isDirty, selectedCount, totalCount }: Props) {
  if (!stats) return <div className="text-gray-500 text-sm">Run prediction to see results.</div>

  const overallCards = [
    { item: stats.highest, color: 'text-green-400', border: 'border-green-700/60', hint: 'Primary take-profit ceiling' },
    { item: stats.lowest, color: 'text-red-400', border: 'border-red-700/60', hint: 'Deep pullback support' },
  ]

  return (
    <div className="flex flex-col gap-3">
      {isDirty && (
        <div className="text-yellow-400 text-xs border border-yellow-600 rounded px-2 py-1">
          ⚠️ Selection changed. Click 'Start Prediction' to sync.
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {overallCards.map(({ item, color, border, hint }) => (
          <div key={item.label} className={`bg-gray-800 rounded p-3 border ${border}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-gray-400">{item.label}</div>
                <div className={`text-lg font-bold font-mono ${color}`}>{item.price != null ? item.price.toFixed(2) : '—'}</div>
                <div className={`text-xs font-mono ${item.pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {item.pct != null ? `${item.pct >= 0 ? '+' : ''}${item.pct.toFixed(2)}%` : '—'}
                </div>
              </div>
              <div className="text-right text-[11px] leading-4 text-gray-400">
                <div>{item.occurrenceWindow}</div>
                <div>{toUTC8Display(item.historicalTime) || 'Time unavailable'}</div>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-gray-500">{hint}</div>
          </div>
        ))}
      </div>
      {dayStats.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {dayStats.map(day => <DayStatsRow key={day.label} day={day} />)}
        </div>
      )}
      <StatsProjectionChart bars={projectedFutureBars} />
      <div className="flex gap-4 text-sm flex-wrap">
        <span className="text-gray-400">Win Rate: <span className="text-white">{stats.winRate != null ? (stats.winRate * 100).toFixed(1) : '—'}%</span></span>
        <span className="text-gray-400">Avg r: <span className="text-white">{stats.meanCorrelation != null ? stats.meanCorrelation.toFixed(4) : '—'}</span></span>
        {totalCount > 0 && (
          <span className="text-gray-400 ml-auto">Using <span className="text-white">{selectedCount}</span> / {totalCount} matches</span>
        )}
      </div>
    </div>
  )
}
