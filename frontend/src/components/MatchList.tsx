import { useRef, useEffect, useState } from 'react'
import { toUTC8Display } from '../utils/time'
import { BusinessDay, createChart, IChartApi, LineSeries, UTCTimestamp, CandlestickSeries } from 'lightweight-charts'
import { MatchCase } from '../types'

interface Props {
  matches: MatchCase[]
  selected: Set<string>
  timeframe: '1H' | '1D'
  onToggle: (id: string) => void
}

type CandleTime = UTCTimestamp | BusinessDay

interface OHLCTooltip {
  x: number
  y: number
  open: number
  high: number
  low: number
  close: number
}

function addStep(base: CandleTime, steps: number, timeframe: '1H' | '1D'): CandleTime {
  if (timeframe === '1H') {
    return ((base as number) + steps * 3600) as UTCTimestamp
  }
  const day = base as BusinessDay
  const d = new Date(Date.UTC(day.year, day.month - 1, day.day))
  d.setUTCDate(d.getUTCDate() + steps)
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  }
}

function startTime(t: string, timeframe: '1H' | '1D'): CandleTime | null {
  const raw = (t || '').trim()
  if (!raw) return null
  if (timeframe === '1D') {
    const day = raw.substring(0, 10)
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
    if (!match) return null
    const year = Number(match[1])
    const month = Number(match[2])
    const date = Number(match[3])
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(date)) return null
    return { year, month, day: date }
  }
  const s = raw.includes(' ') ? raw.replace(' ', 'T') + 'Z' : raw + 'Z'
  const timestamp = new Date(s).getTime()
  if (Number.isNaN(timestamp)) return null
  return Math.floor(timestamp / 1000) as UTCTimestamp
}

// Fix 1: deduplicate by time key and sort ascending before setData()
function serializeTimeKey(time: CandleTime): string {
  if (typeof time === 'number') return String(time)
  return `${time.year}-${String(time.month).padStart(2, '0')}-${String(time.day).padStart(2, '0')}`
}

function toSortableValue(time: CandleTime): number {
  if (typeof time === 'number') return time
  return Date.UTC(time.year, time.month - 1, time.day)
}

function dedupeAndSort<T extends { time: CandleTime }>(data: T[]): T[] {
  const seen = new Set<string>()
  const deduped = data.filter(d => {
    const k = serializeTimeKey(d.time)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  return deduped.sort((a, b) => toSortableValue(a.time) - toSortableValue(b.time))
}

function formatInterval(startDate: string, endDate: string, timeframe: '1H' | '1D'): string {
  const s = toUTC8Display(startDate)
  const e = toUTC8Display(endDate)
  if (!s && !e) return 'Unknown interval'
  if (!s) return e || 'Unknown interval'
  if (!e) return s
  if (timeframe === '1D') return `${s} ~ ${e}`
  const sParts = s.split(' ')
  const eParts = e.split(' ')
  const sTime = sParts[1]?.substring(0, 5) ?? ''
  const eTime = eParts[1]?.substring(0, 5) ?? ''
  if (sParts[0] === eParts[0]) return `${sParts[0]} ${sTime} ~ ${eTime}`
  return `${sParts[0]} ${sTime} ~ ${eParts[0]} ${eTime}`
}

const CHART_HEIGHT = 110

function PredictorChart({
  historical,
  future,
  startDate,
  timeframe,
  historicalMa99 = [],
  futureMa99 = [],
}: {
  historical: Array<{ open: number; high: number; low: number; close: number }>
  future: Array<{ open: number; high: number; low: number; close: number }>
  startDate: string
  timeframe: '1H' | '1D'
  historicalMa99?: (number | null)[]
  futureMa99?: (number | null)[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [splitX, setSplitX] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<OHLCTooltip | null>(null)
  const [chartError, setChartError] = useState<string | null>(null)

  const base = startTime(startDate, timeframe)
  const histData = base == null ? [] : historical.map((c, i) => ({ ...c, time: addStep(base, i, timeframe) }))
  const futData = base == null ? [] : future.map((c, j) => ({ ...c, time: addStep(base, historical.length + j, timeframe) }))

  useEffect(() => {
    if (base == null) return
    if (!containerRef.current) return
    setChartError(null)

    let chart: IChartApi | null = null
    let ro: ResizeObserver | null = null
    let updateSplitX: (() => void) | null = null
    let onCrosshair: ((param: Parameters<Parameters<IChartApi['subscribeCrosshairMove']>[0]>[0]) => void) | null = null
    let disposed = false

    const disposeChart = () => {
      if (disposed) return
      disposed = true
      ro?.disconnect()
      ro = null
      try {
        if (chart && updateSplitX) chart.timeScale().unsubscribeVisibleTimeRangeChange(updateSplitX)
      } catch {}
      try {
        if (chart && onCrosshair) chart.unsubscribeCrosshairMove(onCrosshair)
      } catch {}
      try {
        chart?.remove()
      } catch {}
      chart = null
    }

    try {
      chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: CHART_HEIGHT,
        layout: { background: { color: '#1f2937' }, textColor: '#9ca3af' },
        grid: { vertLines: { color: '#374151' }, horzLines: { color: '#374151' } },
        crosshair: { mode: 1 },
        handleScroll: true,
        handleScale: true,
        rightPriceScale: { borderColor: '#374151', scaleMargins: { top: 0.1, bottom: 0.1 } },
        timeScale: { borderColor: '#374151', timeVisible: true, fixLeftEdge: true, fixRightEdge: true },
      })

      const seriesOpts = {
        priceFormat: { type: 'price' as const, precision: 4, minMove: 0.0001 },
      }
      const histSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#22c55e', downColor: '#ef4444',
        borderUpColor: '#22c55e', borderDownColor: '#ef4444',
        wickUpColor: '#22c55e', wickDownColor: '#ef4444',
        ...seriesOpts,
      })
      const futSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#86efac', downColor: '#fca5a5',
        borderUpColor: '#86efac', borderDownColor: '#fca5a5',
        wickUpColor: '#86efac', wickDownColor: '#fca5a5',
        ...seriesOpts,
      })

      const ma99Series = chart.addSeries(LineSeries, {
        color: '#b889ff',
        lineWidth: 2,
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
      })

      const sortedHistData = dedupeAndSort(histData)
      const sortedFutData = dedupeAndSort(futData)
      histSeries.setData(sortedHistData)
      futSeries.setData(sortedFutData)

      const ma99Data = [
        ...sortedHistData.map((bar, i) => {
          const val = historicalMa99[i]
          return val != null ? { time: bar.time, value: val } : null
        }),
        ...sortedFutData.map((bar, j) => {
          const val = futureMa99[j]
          return val != null ? { time: bar.time, value: val } : null
        }),
      ].filter((d): d is { time: CandleTime; value: number } => d !== null)
      ma99Series.setData(dedupeAndSort(ma99Data))

      chart.timeScale().fitContent()

      updateSplitX = () => {
        if (disposed || !chart) return
        const lastHistTime = sortedHistData.length > 0 ? sortedHistData[sortedHistData.length - 1].time : null
        const firstFutTime = sortedFutData.length > 0 ? sortedFutData[0].time : null
        if (!lastHistTime) return
        const x1 = chart.timeScale().timeToCoordinate(lastHistTime)
        const x2 = firstFutTime ? chart.timeScale().timeToCoordinate(firstFutTime) : null
        if (x1 !== null && x2 !== null) {
          setSplitX(((x1 as number) + (x2 as number)) / 2)
        } else if (x1 !== null) {
          setSplitX(x1 as number)
        }
      }
      updateSplitX()
      chart.timeScale().subscribeVisibleTimeRangeChange(updateSplitX)

      const allBars = [...sortedHistData, ...sortedFutData]
      const dataMap = new Map(allBars.map(d => [serializeTimeKey(d.time), d]))
      onCrosshair = (param) => {
        if (disposed) return
        if (!param.point || !param.time) { setTooltip(null); return }
        const key = typeof param.time === 'number'
          ? String(param.time)
          : serializeTimeKey(param.time as BusinessDay)
        const bar = dataMap.get(key)
        if (!bar) { setTooltip(null); return }
        setTooltip({ x: param.point.x, y: param.point.y, open: bar.open, high: bar.high, low: bar.low, close: bar.close })
      }
      chart.subscribeCrosshairMove(onCrosshair)

      ro = new ResizeObserver(() => {
        if (disposed || !chart || !containerRef.current) return
        chart.applyOptions({ width: containerRef.current.clientWidth })
        updateSplitX?.()
      })
      ro.observe(containerRef.current)
    } catch (error) {
      setChartError((error as Error).message || 'Unknown chart rendering error')
      setSplitX(null)
      setTooltip(null)
      disposeChart()
    }

    return () => {
      disposeChart()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, startDate, timeframe, historical.length, future.length, historicalMa99.length, futureMa99.length])

  return (
    <div className="relative w-full rounded overflow-hidden" style={{ height: CHART_HEIGHT }}>
      {base == null ? (
        <div className="flex h-full items-center justify-center rounded bg-gray-900/70 px-3 text-center text-xs text-gray-500">
          Match chart unavailable because this case does not have a valid start date.
        </div>
      ) : chartError ? (
        <div className="flex h-full items-center justify-center rounded bg-gray-900/70 px-3 text-center text-xs text-gray-500">
          Match chart unavailable because this case has an invalid date value. {chartError}
        </div>
      ) : (
        <>
      <div ref={containerRef} className="w-full h-full" data-testid="match-chart" />
      {/* Fix 2: orange vertical line at boundary between hist and future */}
      {splitX !== null && (
        <div
          data-testid="match-chart-split-line"
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{ left: splitX, width: 2, background: '#f97316', opacity: 0.9 }}
        />
      )}
      {/* Fix 3: OHLC tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs font-mono text-gray-200 z-10 leading-4"
          style={{
            left: tooltip.x > 150 ? tooltip.x - 80 : tooltip.x + 10,
            top: Math.max(4, tooltip.y - 68),
          }}
        >
          <div><span className="text-gray-500">O </span>{tooltip.open.toFixed(4)}</div>
          <div><span className="text-gray-500">H </span>{tooltip.high.toFixed(4)}</div>
          <div><span className="text-gray-500">L </span>{tooltip.low.toFixed(4)}</div>
          <div><span className="text-gray-500">C </span>{tooltip.close.toFixed(4)}</div>
        </div>
      )}
        </>
      )}
    </div>
  )
}

function computeMaTrend(futureMa99: (number | null)[]): { direction: 'up' | 'down'; pct: number } | null {
  const valid = futureMa99.filter((v): v is number => v !== null)
  if (valid.length < 2) return null

  const n = valid.length
  const xs = valid.map((_, i) => i)
  const meanX = (n - 1) / 2
  const meanY = valid.reduce((a, b) => a + b, 0) / n
  const denom = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0)
  if (denom === 0) return null
  const slope = xs.reduce((sum, x, i) => sum + (x - meanX) * (valid[i] - meanY), 0) / denom

  const pct = ((valid[valid.length - 1] - valid[0]) / valid[0]) * 100

  return { direction: slope >= 0 ? 'up' : 'down', pct }
}

function futureSegmentLabel(count: number, timeframe: '1H' | '1D'): string {
  if (count <= 0) return 'No future bars'
  return timeframe === '1D' ? `Actual future ${count}D bars` : `Actual future ${count} x 1H bars`
}

export function MatchList({ matches, selected, onToggle, timeframe }: Props) {
  const [openSet, setOpenSet] = useState<Set<string>>(new Set())

  function toggleOpen(id: string) {
    setOpenSet(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function expandAll() {
    setOpenSet(new Set(matches.map(m => m.id)))
  }

  function collapseAll() {
    setOpenSet(new Set())
  }

  return (
    <div className="flex flex-col gap-2 flex-1 min-h-0">
      {matches.length > 0 && (
        <div className="flex gap-2 flex-shrink-0 items-center">
          <button
            onClick={expandAll}
            className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
          >
            Collapse All
          </button>
          <span className="ml-auto text-[10px] text-gray-500">All times UTC+8</span>
        </div>
      )}
      <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0">
        {matches.map(m => {
          const checked = selected.has(m.id)
          const isOpen = openSet.has(m.id)
          const hist = m.historicalOhlc ?? []
          const fut = m.futureOhlc ?? []
          const trend = computeMaTrend(m.futureMa99 ?? [])
          return (
            <div
              key={m.id}
              className={`flex flex-col rounded bg-gray-800 border border-gray-700 transition-opacity ${checked ? '' : 'opacity-50'}`}
            >
              {/* Accordion Header */}
              <div
                className="flex items-center gap-3 px-3 py-2 cursor-pointer select-none hover:bg-gray-750"
                onClick={() => toggleOpen(m.id)}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(m.id)}
                  onClick={e => e.stopPropagation()}
                  className="accent-orange-400 cursor-pointer flex-shrink-0"
                />
                <span className="text-sm font-mono text-orange-300 flex-shrink-0">
                  r = {m.correlation != null ? m.correlation.toFixed(4) : '—'}
                </span>
                <span className="text-gray-500 flex-shrink-0">|</span>
                <span className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-xs text-gray-400 truncate">
                    {formatInterval(m.startDate, m.endDate, timeframe)}
                  </span>
                  {trend && (
                    <span className={`text-xs flex-shrink-0 ${trend.direction === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                      {trend.direction === 'up' ? '↑' : '↓'} {trend.direction === 'up' && trend.pct >= 0 ? '+' : ''}{trend.pct.toFixed(2)}%
                    </span>
                  )}
                </span>
                <span className="text-gray-500 text-xs flex-shrink-0">{isOpen ? '▲' : '▼'}</span>
              </div>
              {/* Expandable Chart */}
              {isOpen && (
                <div className="px-3 pb-3">
                  <div className="mb-2 flex items-center justify-between text-[11px] text-gray-400">
                    <span>Left = matched historical segment</span>
                    <span className="rounded border border-orange-700/60 bg-orange-950/40 px-2 py-0.5 text-orange-300">
                      Right = {futureSegmentLabel(fut.length, timeframe)}
                    </span>
                  </div>
                  <PredictorChart
                    historical={hist}
                    future={fut}
                    startDate={m.startDate}
                    timeframe={timeframe}
                    historicalMa99={m.historicalMa99 ?? []}
                    futureMa99={m.futureMa99 ?? []}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
