import { useRef, useEffect } from 'react'
import { createChart, IChartApi, UTCTimestamp, CandlestickSeries } from 'lightweight-charts'
import { OHLCRow } from '../types'

interface Props {
  userOhlc: OHLCRow[]
  timeframe: '1H' | '1D'
}

type CandleTime = UTCTimestamp | string

function toTime(t: string, timeframe: '1H' | '1D'): CandleTime {
  if (timeframe === '1D') return t.substring(0, 10)           // "YYYY-MM-DD"
  const s = t.includes(' ') ? t.replace(' ', 'T') + 'Z' : t + 'Z'
  return Math.floor(new Date(s).getTime() / 1000) as UTCTimestamp
}

function sortData<T extends { time: CandleTime }>(data: T[]): T[] {
  return [...data].sort((a, b) =>
    typeof a.time === 'number' ? (a.time as number) - (b.time as number)
    : new Date(a.time as string).getTime() - new Date(b.time as string).getTime()
  )
}

function isRowComplete(r: OHLCRow) {
  return r.time !== '' && (['open', 'high', 'low', 'close'] as const).every(
    f => r[f] !== '' && !isNaN(Number(r[f]))
  )
}

export function MainChart({ userOhlc, timeframe }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const chart = createChart(el, {
      width: el.clientWidth,
      height: el.clientHeight,
      layout: { background: { color: '#111827' }, textColor: '#9ca3af' },
      grid: { vertLines: { color: '#1f2937' }, horzLines: { color: '#1f2937' } },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: '#374151' },
      timeScale: { borderColor: '#374151', timeVisible: true },
    })
    chartRef.current = chart
    seriesRef.current = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e', downColor: '#ef4444',
      borderUpColor: '#22c55e', borderDownColor: '#ef4444',
      wickUpColor: '#22c55e', wickDownColor: '#ef4444',
    })

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth, height: el.clientHeight })
    })
    ro.observe(el)

    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; seriesRef.current = null }
  }, [timeframe]) // remount on timeframe switch to get clean chart instance

  useEffect(() => {
    if (!seriesRef.current) return
    const raw = userOhlc
      .filter(isRowComplete)
      .map(r => ({ time: toTime(r.time, timeframe), open: +r.open, high: +r.high, low: +r.low, close: +r.close }))
    const data = sortData(raw)
    seriesRef.current.setData(data)
    if (data.length > 0) chartRef.current?.timeScale().fitContent()
  }, [userOhlc, timeframe])

  const hasData = userOhlc.some(isRowComplete)

  return (
    <div className="relative w-full h-full bg-gray-900 rounded overflow-hidden">
      {!hasData && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm pointer-events-none">
          Enter OHLC data to see chart
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
