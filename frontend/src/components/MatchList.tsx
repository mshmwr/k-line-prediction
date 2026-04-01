import { useRef, useEffect, useState } from 'react'
import { createChart, IChartApi, UTCTimestamp, CandlestickSeries } from 'lightweight-charts'
import { MatchCase } from '../types'

interface Props {
  matches: MatchCase[]
  selected: Set<string>
  timeframe: '1H' | '1D'
  onToggle: (id: string) => void
}

type CandleTime = UTCTimestamp | string

function addStep(base: CandleTime, steps: number, timeframe: '1H' | '1D'): CandleTime {
  if (timeframe === '1H') {
    return ((base as number) + steps * 3600) as UTCTimestamp
  }
  const d = new Date((base as string) + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + steps)
  return d.toISOString().substring(0, 10)
}

function startTime(t: string, timeframe: '1H' | '1D'): CandleTime {
  if (timeframe === '1D') return t.substring(0, 10)
  const s = t.includes(' ') ? t.replace(' ', 'T') + 'Z' : t + 'Z'
  return Math.floor(new Date(s).getTime() / 1000) as UTCTimestamp
}

function formatInterval(startDate: string, endDate: string, timeframe: '1H' | '1D'): string {
  if (timeframe === '1D') return `${startDate} ~ ${endDate}`
  const sParts = startDate.split(' ')
  const eParts = endDate.split(' ')
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
}: {
  historical: Array<{ open: number; high: number; low: number; close: number }>
  future: Array<{ open: number; high: number; low: number; close: number }>
  startDate: string
  timeframe: '1H' | '1D'
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const [splitX, setSplitX] = useState<number | null>(null)

  const base = startTime(startDate, timeframe)
  const histData = historical.map((c, i) => ({ time: addStep(base, i, timeframe), ...c }))
  const splitTime = histData.length > 0 ? histData[histData.length - 1].time : null
  const futData = future.map((c, j) => ({ time: addStep(base, historical.length + j, timeframe), ...c }))

  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: CHART_HEIGHT,
      layout: { background: { color: '#1f2937' }, textColor: '#9ca3af' },
      grid: { vertLines: { color: '#374151' }, horzLines: { color: '#374151' } },
      crosshair: { mode: 1 },
      handleScroll: false,
      handleScale: false,
      rightPriceScale: { borderColor: '#374151', scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: { borderColor: '#374151', timeVisible: true, fixLeftEdge: true, fixRightEdge: true },
    })
    chartRef.current = chart

    const histSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e', downColor: '#ef4444',
      borderUpColor: '#22c55e', borderDownColor: '#ef4444',
      wickUpColor: '#22c55e', wickDownColor: '#ef4444',
    })
    const futSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#86efac', downColor: '#fca5a5',
      borderUpColor: '#86efac', borderDownColor: '#fca5a5',
      wickUpColor: '#86efac', wickDownColor: '#fca5a5',
    })

    histSeries.setData(histData)
    futSeries.setData(futData)
    chart.timeScale().fitContent()

    const updateSplitX = () => {
      if (!splitTime) return
      const x = chart.timeScale().timeToCoordinate(splitTime)
      setSplitX(x !== null ? (x as number) : null)
    }
    updateSplitX()
    chart.timeScale().subscribeVisibleTimeRangeChange(updateSplitX)

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: containerRef.current!.clientWidth })
      updateSplitX()
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      chart.timeScale().unsubscribeVisibleTimeRangeChange(updateSplitX)
      chart.remove()
      chartRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, timeframe, historical.length, future.length])

  return (
    <div className="relative w-full rounded overflow-hidden" style={{ height: CHART_HEIGHT }}>
      <div ref={containerRef} className="w-full h-full" />
      {splitX !== null && (
        <div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{ left: splitX, width: 1, background: '#f97316', opacity: 0.85 }}
        />
      )}
    </div>
  )
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
        <div className="flex gap-2 flex-shrink-0">
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
        </div>
      )}
      <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0">
        {matches.map(m => {
          const checked = selected.has(m.id)
          const isOpen = openSet.has(m.id)
          const hist = m.historicalOhlc ?? []
          const fut = m.futureOhlc ?? []
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
                <span className="text-xs text-gray-400 flex-1 truncate">
                  {formatInterval(m.startDate, m.endDate, timeframe)}
                </span>
                <span className="text-gray-500 text-xs flex-shrink-0">{isOpen ? '▲' : '▼'}</span>
              </div>
              {/* Expandable Chart */}
              {isOpen && (
                <div className="px-3 pb-3">
                  <PredictorChart
                    historical={hist}
                    future={fut}
                    startDate={m.startDate}
                    timeframe={timeframe}
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
