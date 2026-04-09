import { useEffect, useMemo, useRef } from 'react'
import {
  CandlestickSeries,
  ColorType,
  createChart,
  IChartApi,
  LineSeries,
  UTCTimestamp,
} from 'lightweight-charts'
import { OHLCRow } from '../types'

interface Props {
  userOhlc: OHLCRow[]
  timeframe: '1H' | '1D'
  ma99Values?: (number | null)[]
  ma99Gap?: { fromDate: string; toDate: string } | null
  maLoading?: boolean
}

type CandleTime = UTCTimestamp | string

type CandleDatum = {
  time: CandleTime
  open: number
  high: number
  low: number
  close: number
}

function parseLocalizedDateTime(value: string) {
  const normalized = value.trim()
  const match = normalized.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})\s+(上午|下午)\s+(\d{1,2}):(\d{2})$/)
  if (!match) return null

  const [, year, month, day, meridiem, rawHour, minute] = match
  let hour = Number(rawHour)
  if (meridiem === '上午') {
    if (hour === 12) hour = 0
  } else if (hour !== 12) {
    hour += 12
  }

  return Math.floor(Date.UTC(Number(year), Number(month) - 1, Number(day), hour, Number(minute)) / 1000) as UTCTimestamp
}

const UTC8_OFFSET = 8 * 3600

function toTimestamp(value: string) {
  const localized = parseLocalizedDateTime(value)
  // parseLocalizedDateTime treats the input as already UTC+8; shift to display as UTC+8 in chart
  if (localized) return (localized + UTC8_OFFSET) as UTCTimestamp

  // row.time is stored as UTC+0; shift +8h so lightweight-charts displays UTC+8
  const directMatch = value.trim().match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?$/)
  if (directMatch) {
    const [, year, month, day, rawHour = '0', minute = '0'] = directMatch
    return Math.floor(
      Date.UTC(Number(year), Number(month) - 1, Number(day), Number(rawHour), Number(minute)) / 1000 + UTC8_OFFSET
    ) as UTCTimestamp
  }

  const normalized = value.trim().replace(/\//g, '-')
  const isoValue = normalized.includes(' ') ? `${normalized.replace(' ', 'T')}Z` : `${normalized}Z`
  const parsed = new Date(isoValue)
  if (!Number.isNaN(parsed.getTime())) {
    return Math.floor(parsed.getTime() / 1000 + UTC8_OFFSET) as UTCTimestamp
  }
  return null
}

function toTime(value: string, timeframe: '1H' | '1D'): CandleTime {
  if (timeframe === '1D') return value.slice(0, 10)
  return toTimestamp(value) ?? ('invalid' as CandleTime)
}

function isRowComplete(row: OHLCRow) {
  return row.time !== '' && (['open', 'high', 'low', 'close'] as const).every(
    field => row[field] !== '' && !isNaN(Number(row[field]))
  )
}

function sortData<T extends { time: CandleTime }>(data: T[]): T[] {
  return [...data].sort((a, b) =>
    typeof a.time === 'number'
      ? (a.time as number) - (b.time as number)
      : new Date(a.time as string).getTime() - new Date(b.time as string).getTime()
  )
}

function formatPrice(value: number | null) {
  if (value == null || !Number.isFinite(value)) return '--'
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatAxisTime(value: CandleTime, timeframe: '1H' | '1D') {
  if (typeof value === 'string') return value.replace(/-/g, '/')

  const date = new Date(value * 1000)
  if (timeframe === '1D') {
    return `${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${String(date.getUTCDate()).padStart(2, '0')}`
  }

  return `${String(date.getUTCMonth() + 1).padStart(2, '0')}/${String(date.getUTCDate()).padStart(2, '0')} ${String(date.getUTCHours()).padStart(2, '0')}:00`
}

function buildSma(data: CandleDatum[], period: number) {
  let rollingSum = 0
  return data.flatMap((bar, index) => {
    rollingSum += bar.close
    if (index >= period) rollingSum -= data[index - period].close
    if (index < period - 1) return []
    return [{ time: bar.time, value: rollingSum / period }]
  })
}

export function MainChart({ userOhlc, timeframe, ma99Values, ma99Gap, maLoading }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null)
  const ma99SeriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null)

  const data = useMemo(() => {
    const rows = userOhlc
      .filter(isRowComplete)
      .map(row => ({
        time: toTime(row.time, timeframe),
        open: Number(row.open),
        high: Number(row.high),
        low: Number(row.low),
        close: Number(row.close),
      }))
      .filter(row => row.time !== 'invalid')
    return sortData(rows)
  }, [userOhlc, timeframe])

  const ma99LineData = useMemo(() => {
    if (!ma99Values?.length) return []
    return data
      .map((bar, i) => {
        const val = ma99Values[i]
        return val != null ? { time: bar.time, value: val } : null
      })
      .filter((d): d is { time: CandleTime; value: number } => d !== null)
  }, [data, ma99Values])
  const timeMarkers = useMemo(() => {
    if (!data.length) return []
    const first = data[0]
    const middle = data[Math.floor((data.length - 1) / 2)]
    const last = data[data.length - 1]
    return [first, middle, last].map(point => formatAxisTime(point.time, timeframe))
  }, [data, timeframe])

  useEffect(() => {
    if (!containerRef.current) return

    const element = containerRef.current
    const chart = createChart(element, {
      width: element.clientWidth,
      height: element.clientHeight,
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
      rightPriceScale: {
        borderColor: '#313849',
        scaleMargins: { top: 0.12, bottom: 0.1 },
      },
      timeScale: {
        borderColor: '#313849',
        timeVisible: timeframe === '1H',
        secondsVisible: false,
        barSpacing: timeframe === '1H' ? 14 : 22,
        minBarSpacing: 8,
        rightOffset: 2,
        visible: true,
        ticksVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    })

    chartRef.current = chart
    candleSeriesRef.current = chart.addSeries(CandlestickSeries, {
      upColor: '#2fc98f',
      downColor: '#ff4d67',
      borderUpColor: '#2fc98f',
      borderDownColor: '#ff4d67',
      wickUpColor: '#2fc98f',
      wickDownColor: '#ff4d67',
      priceLineVisible: true,
      lastValueVisible: true,
    })
    ma99SeriesRef.current = chart.addSeries(LineSeries, {
      color: '#b889ff',
      lineWidth: 2,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    })

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({ width: element.clientWidth, height: element.clientHeight })
    })
    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartRef.current = null
      candleSeriesRef.current = null
      ma99SeriesRef.current = null
    }
  }, [timeframe, data.length])

  useEffect(() => {
    if (!candleSeriesRef.current) return

    candleSeriesRef.current.setData(data)
    ma99SeriesRef.current?.setData(ma99LineData)

    if (data.length > 0) {
      chartRef.current?.timeScale().fitContent()
    }
  }, [data, ma99LineData])

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-[#252c39] bg-[#171b24] shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
      <div className="border-b border-[#252c39] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold tracking-wide text-[#eef2ff]">ETHUSDT</span>
            <div className="flex items-center gap-3 text-xs text-[#8d95a6]">
              {(['1H', '1D'] as const).map(label => (
                <span key={label} className={label === timeframe ? 'font-semibold text-white' : ''}>
                  {label}
                </span>
              ))}
            </div>
          </div>
          <span className="rounded-full border border-[#313849] px-2 py-1 text-[11px] text-[#c9d1e4]">
            Official CSV input
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <span className="text-[#b889ff]">
            {maLoading
              ? 'MA(99) 計算中…'
              : `MA(99) ${formatPrice([...(ma99Values ?? [])].reverse().find(v => v != null) ?? null)}`}
          </span>
        </div>
        {ma99Gap && (
          <div className="mt-1.5 rounded bg-yellow-950/60 border border-yellow-700/50 px-3 py-1 text-[11px] text-yellow-300">
            ⚠ MA99 資料缺失：{ma99Gap.fromDate} ~ {ma99Gap.toDate}（歷史前置資料不足 99 根）
          </div>
        )}
      </div>

      <div className="relative min-h-[220px] flex-1">
        {!data.length && (
          <div className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center text-sm text-[#6f788b]">
            Add timestamps and OHLC values to render the chart.
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" data-testid="main-chart-container" />
      </div>
      <div className="border-t border-[#252c39] px-3 py-1.5 text-[10px] text-[#8d95a6]">
        {timeMarkers.length ? (
          <div className="flex items-center justify-between gap-3">
            <span>{timeMarkers[0]}</span>
            <span>{timeMarkers[1]}</span>
            <span>{timeMarkers[2]}</span>
          </div>
        ) : (
          <div className="text-center">Time axis will appear after valid OHLC rows are loaded.</div>
        )}
      </div>
    </div>
  )
}
