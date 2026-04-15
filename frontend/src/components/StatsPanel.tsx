import { useEffect, useMemo, useRef } from 'react'
import { CandlestickSeries, ColorType, createChart, IChartApi, UTCTimestamp } from 'lightweight-charts'
import { DayStats, ForecastBar, PredictStats } from '../types'

type ProjectionBar = ForecastBar & { ts?: number }

interface Props {
  stats: PredictStats | null
  dayStats: DayStats[]
  isDirty: boolean
  selectedCount: number
  totalCount: number
}

function toChartTs(time: string, fallbackSeconds: number) {
  const trimmed = (time || '').trim()
  if (!trimmed) return fallbackSeconds as UTCTimestamp
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return Math.floor(new Date(`${trimmed}T00:00:00Z`).getTime() / 1000) as UTCTimestamp
  }
  return Math.floor(new Date(trimmed.replace(' ', 'T') + 'Z').getTime() / 1000) as UTCTimestamp
}

function buildFooterLabels(bars: ProjectionBar[], timeframe: '1H' | '1D') {
  if (timeframe === '1D') {
    return [
      bars[0]?.time ?? 'Day 1',
      bars[1]?.time ?? 'Day 2',
      bars[2]?.time ?? 'Day 3',
      bars[bars.length - 1]?.time ?? 'Day N',
    ]
  }
  return [
    bars[0]?.time ?? 'Hour +1',
    bars[24]?.time ?? 'Hour +25',
    bars[48]?.time ?? 'Hour +49',
    bars[71]?.time ?? 'Hour +72',
  ]
}

function StatsProjectionChart({ bars, title, timeframe, testId }: { bars: ProjectionBar[]; title: string; timeframe: '1H' | '1D'; testId: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  const chartData = useMemo(() => (
    bars.map((bar, index) => {
      const fallback = timeframe === '1H' ? (index + 1) * 3600 : (index + 1) * 86400
      const ts = bar.ts != null ? bar.ts : toChartTs(bar.time, fallback)
      return { time: ts as UTCTimestamp, open: bar.open, high: bar.high, low: bar.low, close: bar.close }
    })
  ), [bars, timeframe])

  const footerLabels = useMemo(() => buildFooterLabels(bars, timeframe), [bars, timeframe])

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
        timeVisible: timeframe === '1H',
        secondsVisible: false,
        ticksVisible: false,
        barSpacing: timeframe === '1H' ? 12 : 24,
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
  }, [chartData, timeframe])

  if (!bars.length) {
    return (
      <div className="overflow-hidden rounded-xl border border-[#252c39] bg-[#171b24]">
        <div className="flex items-center justify-between border-b border-[#252c39] px-3 py-2 text-[11px] text-[#c9d1e4]">
          <span>{title}</span>
          <span>Consensus view, not raw historical bars</span>
        </div>
        <div className="flex h-[220px] items-center justify-center px-4 text-center text-sm text-[#6f788b]">
          Forecast unavailable until prediction results are ready.
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#252c39] bg-[#171b24]">
      <div className="flex items-center justify-between border-b border-[#252c39] px-3 py-2 text-[11px] text-[#c9d1e4]">
        <span>{title}</span>
        <span>Consensus view, not raw historical bars</span>
      </div>
      <div ref={containerRef} className="h-[220px] w-full" data-testid={testId} />
      <div className="flex items-center justify-between border-t border-[#252c39] px-3 py-1.5 text-[10px] text-[#8d95a6]">
        <span>{footerLabels[0]}</span>
        <span>{footerLabels[1]}</span>
        <span>{footerLabels[2]}</span>
      </div>
    </div>
  )
}

function DayStatsRow({ day }: { day: DayStats }) {
  return (
    <div className="rounded border border-gray-700 bg-gray-900/60 px-3 py-2">
      <div className="mb-2 text-[11px] uppercase tracking-wider text-gray-500">{day.label}</div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-[11px] text-gray-400">Highest</div>
          <div className="font-mono text-sm font-bold text-green-400">{day.highest.price.toFixed(2)}</div>
          <div className={`text-[11px] font-mono ${day.highest.pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {day.highest.pct >= 0 ? '+' : ''}{day.highest.pct.toFixed(2)}%
          </div>
          <div className="mt-0.5 text-[10px] text-gray-500">{day.highest.time}</div>
        </div>
        <div>
          <div className="text-[11px] text-gray-400">Lowest</div>
          <div className="font-mono text-sm font-bold text-red-400">{day.lowest.price.toFixed(2)}</div>
          <div className={`text-[11px] font-mono ${day.lowest.pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {day.lowest.pct >= 0 ? '+' : ''}{day.lowest.pct.toFixed(2)}%
          </div>
          <div className="mt-0.5 text-[10px] text-gray-500">{day.lowest.time}</div>
        </div>
      </div>
    </div>
  )
}

export function StatsPanel({ stats, dayStats, isDirty, selectedCount, totalCount }: Props) {
  if (!stats) return <div className="text-gray-500 text-sm">Run prediction to see results.</div>

  return (
    <div className="flex flex-col gap-3">
      {isDirty && (
        <div className="rounded border border-yellow-600 px-2 py-1 text-xs text-yellow-400">
          ⚠️ Selection changed. Click 'Start Prediction' to sync.
        </div>
      )}
      <div className="flex gap-4 text-sm flex-wrap">
        <span className="text-gray-400">Win Rate: <span className="text-white">{stats.winRate != null ? (stats.winRate * 100).toFixed(1) : '—'}%</span></span>
        <span className="text-gray-400">Avg r: <span className="text-white">{stats.meanCorrelation != null ? stats.meanCorrelation.toFixed(4) : '—'}</span></span>
        {totalCount > 0 && (
          <span className="ml-auto text-gray-400">Using <span className="text-white">{selectedCount}</span> / {totalCount} matches</span>
        )}
      </div>
      {dayStats.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {dayStats.map(day => <DayStatsRow key={day.label} day={day} />)}
        </div>
      )}
      <StatsProjectionChart
        bars={stats.consensusForecast1h}
        title="Consensus Forecast (1H)"
        timeframe="1H"
        testId="stats-projection-chart-1h"
      />
      <StatsProjectionChart
        bars={stats.consensusForecast1d}
        title="Consensus Forecast (1D)"
        timeframe="1D"
        testId="stats-projection-chart-1d"
      />
    </div>
  )
}
