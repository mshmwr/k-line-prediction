import { useEffect, useRef } from 'react'
import { createChart, LineSeries, ColorType } from 'lightweight-charts'
import type { ChartPoint } from '../../types/backtest'

interface TimeSeriesChartProps {
  chartPoints: ChartPoint[]
  status: 'loading' | 'ready' | 'error'
}

export default function TimeSeriesChart({ chartPoints, status }: TimeSeriesChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status !== 'ready') return
    if (chartPoints.length < 2) return
    if (!containerRef.current) return

    const element = containerRef.current

    const chart = createChart(element, {
      width: element.clientWidth,
      height: 240,
      layout: {
        background: { type: ColorType.Solid, color: '#F4EFE5' },
        textColor: '#3d3530',
      },
      grid: {
        vertLines: { color: 'rgba(61,53,48,0.08)' },
        horzLines: { color: 'rgba(61,53,48,0.08)' },
      },
      rightPriceScale: {
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        timeVisible: false,
      },
      handleScroll: false,
      handleScale: false,
    })

    const projectedSeries = chart.addSeries(LineSeries, {
      color: '#9C4A3B',  // brick-dark (K-017 palette)
      lineWidth: 2,
      lastValueVisible: false,
      priceLineVisible: false,
      title: 'Projected',
    })

    const actualSeries = chart.addSeries(LineSeries, {
      color: '#999999',  // ink/60 approximation
      lineWidth: 2,
      lastValueVisible: false,
      priceLineVisible: false,
      title: 'Actual (mid)',
    })

    projectedSeries.setData(
      chartPoints.map(pt => ({ time: pt.date as `${number}-${number}-${number}`, value: pt.projectedMedian }))
    )
    actualSeries.setData(
      chartPoints.map(pt => ({ time: pt.date as `${number}-${number}-${number}`, value: pt.actualClose }))
    )

    chart.timeScale().fitContent()

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({ width: element.clientWidth })
    })
    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
    }
  }, [status, chartPoints])

  if (status !== 'ready') return null

  if (chartPoints.length < 2) {
    return (
      <div data-testid="time-series-empty" className="rounded-xl border border-ink/10 bg-paper p-6 text-center text-ink/50 font-mono text-sm">
        Not enough completed pairs yet — minimum 2 required for chart.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-ink/10 bg-paper p-6">
      <h2 className="font-mono text-sm font-semibold text-ink/60 uppercase tracking-wider mb-4">
        30-Day Prediction vs Actual
      </h2>
      <div
        ref={containerRef}
        data-testid="time-series-chart"
        style={{ width: '100%', minHeight: '240px' }}
      />
    </div>
  )
}
