import { DayStats } from '../types'

/**
 * Groups projected future bars by UTC+8 calendar date and returns per-day
 * high/low stats relative to currentClose.
 *
 * Input bars use "MM/DD HH:MM" time strings (UTC+8 display format produced by
 * aggregateProjectedBarsTo1D / computeStatsFromMatches). Falls back to
 * position-based grouping (every 24 bars = 1 day) when time strings do not
 * match the expected format.
 *
 * Returns at most 3 days.
 */
export function computeStatsByDay(
  projectedBars: Array<{ time: string; high: number; low: number }>,
  currentClose: number,
): DayStats[] {
  const orderedDates: string[] = []
  const dateMap = new Map<string, Array<{ time: string; high: number; low: number }>>()
  projectedBars.forEach((bar, i) => {
    const date = /^\d{2}\/\d{2}/.test(bar.time)
      ? bar.time.substring(0, 5)
      : String(Math.floor(i / 24))
    if (!dateMap.has(date)) {
      orderedDates.push(date)
      dateMap.set(date, [])
    }
    dateMap.get(date)!.push(bar)
  })

  return orderedDates.slice(0, 3).map((date, dayIndex) => {
    const dayBars = dateMap.get(date)!
    const sortedHighs = [...dayBars].sort((a, b) => b.high - a.high)
    const sortedLows = [...dayBars].sort((a, b) => a.low - b.low)
    return {
      label: `Day ${dayIndex + 1}`,
      highest: {
        price: Math.round(sortedHighs[0].high * 100) / 100,
        pct: Math.round(((sortedHighs[0].high - currentClose) / currentClose) * 10000) / 100,
        time: sortedHighs[0].time,
      },
      lowest: {
        price: Math.round(sortedLows[0].low * 100) / 100,
        pct: Math.round(((sortedLows[0].low - currentClose) / currentClose) * 10000) / 100,
        time: sortedLows[0].time,
      },
    }
  })
}
