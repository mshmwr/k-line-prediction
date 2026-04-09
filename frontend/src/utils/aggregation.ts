import { MatchCase, OHLCRow } from '../types'
import { toUTC8Display } from './time'

export type NumericBar = {
  time: string
  open: number
  high: number
  low: number
  close: number
}

export type ProjectionBar = {
  occurrenceBar: number
  time: string
  ts?: number
  open: number
  high: number
  low: number
  close: number
}

export type AggregatedMatch = MatchCase & {
  displayStartDate: string
  displayEndDate: string
  displayReturnPct: number | null
}

const UTC8_OFFSET_MS = 8 * 3600 * 1000

function parseUtcTime(value: string): number | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}))?$/)
  if (!match) return null
  const [, year, month, day, hour = '0', minute = '0'] = match
  return Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
}

function formatUtc(value: number): string {
  const date = new Date(value)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hour = String(date.getUTCHours()).padStart(2, '0')
  const minute = String(date.getUTCMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

function formatUtcDateOnly(value: number): string {
  return formatUtc(value).slice(0, 10)
}

function addHours(time: string, hours: number): string | null {
  const parsed = parseUtcTime(time)
  if (parsed == null) return null
  return formatUtc(parsed + hours * 3600 * 1000)
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

type GroupedBar<T extends { open: number; high: number; low: number; close: number; time: string }> = T[]

function groupByUtc8Day<T extends { open: number; high: number; low: number; close: number; time: string }>(bars: T[]): GroupedBar<T>[] {
  const groups: GroupedBar<T>[] = []
  let currentKey = ''
  let currentGroup: GroupedBar<T> = []

  bars.forEach(bar => {
    const utcMs = parseUtcTime(bar.time)
    if (utcMs == null) return
    const utc8Date = formatUtcDateOnly(utcMs + UTC8_OFFSET_MS)
    if (utc8Date !== currentKey) {
      if (currentGroup.length > 0) groups.push(currentGroup)
      currentKey = utc8Date
      currentGroup = [bar]
      return
    }
    currentGroup.push(bar)
  })

  if (currentGroup.length > 0) groups.push(currentGroup)
  return groups
}

export function aggregateNumericBarsTo1D(bars: NumericBar[]): NumericBar[] {
  // Build daily OHLC rows from uploaded 1H bars using UTC+8 calendar days.
  // The result is used as the frontend-side query input when the user switches to 1D mode.
  return groupByUtc8Day(bars).map(group => {
    const first = group[0]
    const last = group[group.length - 1]
    return {
      time: formatUtcDateOnly((parseUtcTime(first.time) ?? 0) + UTC8_OFFSET_MS),
      open: first.open,
      high: Math.max(...group.map(bar => bar.high)),
      low: Math.min(...group.map(bar => bar.low)),
      close: last.close,
    }
  })
}

export function aggregateRowsTo1D(rows: OHLCRow[]): OHLCRow[] {
  const complete = rows.flatMap(row => {
    const time = row.time.trim()
    const open = Number(row.open)
    const high = Number(row.high)
    const low = Number(row.low)
    const close = Number(row.close)
    if (!time || [open, high, low, close].some(value => !Number.isFinite(value))) return []
    return [{ time, open, high, low, close }]
  })

  return aggregateNumericBarsTo1D(complete).map(bar => ({
    time: bar.time,
    open: String(bar.open),
    high: String(bar.high),
    low: String(bar.low),
    close: String(bar.close),
  }))
}

function aggregateMaSeriesTo1D(times: string[], values: (number | null)[]): (number | null)[] {
  const groups = groupByUtc8Day(
    times.map((time, index) => ({ time, open: 0, high: 0, low: 0, close: 0, value: values[index] ?? null }))
  )

  return groups.map(group => {
    const valid = group.map(item => item.value).filter((value): value is number => value != null)
    return valid.length > 0 ? valid[valid.length - 1] : null
  })
}

export function aggregateMaValuesTo1D(rows: OHLCRow[], values: (number | null)[]): (number | null)[] {
  const times = rows.map(row => row.time).filter(Boolean)
  return aggregateMaSeriesTo1D(times, values.slice(0, times.length))
}

function matchBarsWithTime(bars: Array<{ open: number; high: number; low: number; close: number }>, startTime: string): NumericBar[] {
  return bars.flatMap((bar, index) => {
    const time = addHours(startTime, index)
    if (!time) return []
    return [{ ...bar, time }]
  })
}

function calculateReturnPct(historical: Array<{ close: number }>, future: Array<{ close: number }>): number | null {
  const baseClose = historical[historical.length - 1]?.close
  const futureClose = future[future.length - 1]?.close
  if (!baseClose || futureClose == null) return null
  return ((futureClose - baseClose) / baseClose) * 100
}

export function toDisplayMatch(match: MatchCase): AggregatedMatch {
  return {
    ...match,
    displayStartDate: match.startDate,
    displayEndDate: match.endDate,
    displayReturnPct: calculateReturnPct(match.historicalOhlc, match.futureOhlc),
  }
}

export function addHoursToUtc8(baseTimeStr: string, hours: number): [string, number] {
  const parsed = parseUtcTime(baseTimeStr)
  if (parsed == null) return [`Hour +${hours}`, hours * 3600]
  const displayMs = parsed + hours * 3600 * 1000 + UTC8_OFFSET_MS
  const dt = new Date(displayMs)
  const month = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const day = String(dt.getUTCDate()).padStart(2, '0')
  const hour = String(dt.getUTCHours()).padStart(2, '0')
  const minute = String(dt.getUTCMinutes()).padStart(2, '0')
  return [`${month}/${day} ${hour}:${minute}`, displayMs / 1000]
}

export function computeProjectedFutureBars(matches: MatchCase[], currentClose: number, lastBarTime?: string): ProjectionBar[] {
  return Array.from({ length: 72 }, (_, index) => {
    const projected = matches.flatMap(match => {
      const base = match.historicalOhlc[match.historicalOhlc.length - 1]?.close
      const bar = match.futureOhlc[index]
      if (!base || !bar) return []
      return [{
        open: currentClose * (bar.open / base),
        high: currentClose * (bar.high / base),
        low: currentClose * (bar.low / base),
        close: currentClose * (bar.close / base),
      }]
    })

    if (projected.length === 0) return null

    const open = median(projected.map(bar => bar.open))
    const close = median(projected.map(bar => bar.close))
    const high = Math.max(median(projected.map(bar => bar.high)), open, close)
    const low = Math.min(median(projected.map(bar => bar.low)), open, close)

    const [timeStr, ts] = lastBarTime
      ? addHoursToUtc8(lastBarTime, index + 1)
      : [`Hour +${index + 1}`, (index + 1) * 3600]

    return {
      occurrenceBar: index + 1,
      time: timeStr,
      ts,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
    }
  }).flatMap(bar => (bar == null ? [] : [bar]))
}

export function aggregateProjectedBarsTo1D(bars: ProjectionBar[]): ProjectionBar[] {
  // Keep the secondary statistics chart in 1H mode by rolling the projected 1H consensus path up to UTC+8 days.
  const datedBars = bars.flatMap(bar => {
    if (bar.ts == null) return []
    const dt = new Date(bar.ts * 1000)
    const year = dt.getUTCFullYear()
    const month = String(dt.getUTCMonth() + 1).padStart(2, '0')
    const day = String(dt.getUTCDate()).padStart(2, '0')
    const hour = String(dt.getUTCHours()).padStart(2, '0')
    const minute = String(dt.getUTCMinutes()).padStart(2, '0')
    return [{ ...bar, time: `${year}-${month}-${day} ${hour}:${minute}` }]
  })

  return groupByUtc8Day(datedBars).map((group, index) => {
    const first = group[0]
    const last = group[group.length - 1]
    return {
      occurrenceBar: index + 1,
      time: toUTC8Display(first.time).slice(5, 10),
      ts: last.ts,
      open: first.open,
      high: Math.max(...group.map(bar => bar.high)),
      low: Math.min(...group.map(bar => bar.low)),
      close: last.close,
    }
  })
}
