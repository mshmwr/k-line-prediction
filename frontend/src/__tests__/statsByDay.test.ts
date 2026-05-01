import { describe, it, expect } from 'vitest'
import { computeStatsByDay } from '../utils/statsByDay'

/**
 * Unit tests for utils/statsByDay.ts.
 *
 * computeStatsByDay groups bars by UTC+8 date using the "MM/DD HH:MM" format
 * produced by the aggregation utils. Falls back to position-based grouping
 * (i/24) when bars lack a date prefix.
 *
 * PM ruling (QA Challenge #4 — required): UTC+8 day-boundary test case.
 * Bars at UTC 2024-01-01T23:30Z (= UTC+8 2024-01-02 07:30) and
 * UTC 2024-01-02T00:30Z (= UTC+8 2024-01-02 08:30) should group to the
 * SAME UTC+8 day (01/02).
 * Bars at UTC 2024-01-01T15:30Z (= UTC+8 2024-01-01 23:30) and
 * UTC 2024-01-01T16:30Z (= UTC+8 2024-01-02 00:30) straddle the UTC+8
 * midnight boundary and must group to DIFFERENT UTC+8 days.
 */

// Helper to build a bar using the MM/DD HH:MM time format that
// computeStatsByDay expects (UTC+8 display, as produced by aggregation utils).
function bar(date: string, time: string, high: number, low: number) {
  return { time: `${date} ${time}`, high, low }
}

describe('computeStatsByDay — 3-day grouping', () => {
  it('groups bars into 3 days and returns label/highest/lowest for each', () => {
    const bars = [
      bar('01/01', '10:00', 100, 90),
      bar('01/01', '11:00', 105, 92),
      bar('01/02', '10:00', 110, 95),
      bar('01/02', '11:00', 108, 97),
      bar('01/03', '10:00', 115, 88),
    ]
    const result = computeStatsByDay(bars, 100)

    expect(result).toHaveLength(3)
    expect(result[0].label).toBe('Day 1')
    expect(result[0].highest.price).toBe(105)
    expect(result[0].lowest.price).toBe(90)
    expect(result[1].label).toBe('Day 2')
    expect(result[1].highest.price).toBe(110)
    expect(result[2].label).toBe('Day 3')
    expect(result[2].highest.price).toBe(115)
  })
})

describe('computeStatsByDay — single-day input', () => {
  it('returns one day entry for single-date bars', () => {
    const bars = [
      bar('01/01', '10:00', 200, 190),
      bar('01/01', '11:00', 210, 195),
    ]
    const result = computeStatsByDay(bars, 200)
    expect(result).toHaveLength(1)
    expect(result[0].label).toBe('Day 1')
    expect(result[0].highest.price).toBe(210)
    expect(result[0].lowest.price).toBe(190)
  })
})

describe('computeStatsByDay — empty input', () => {
  it('returns empty array for zero bars', () => {
    const result = computeStatsByDay([], 100)
    expect(result).toHaveLength(0)
  })
})

describe('computeStatsByDay — UTC+8 day-boundary (PM ruling QA Challenge #4, required)', () => {
  /**
   * computeStatsByDay receives bars already in UTC+8 "MM/DD HH:MM" format.
   * The UTC → UTC+8 conversion happens upstream in aggregateProjectedBarsTo1D
   * (addHoursToUtc8 in aggregation.ts, which adds 8h before formatting).
   *
   * To test the UTC+8 grouping boundary directly, we pass bars with MM/DD
   * timestamps that straddle the UTC+8 midnight:
   * - "01/01 23:30" (UTC+8 day 01/01, late night) → groups to 01/01
   * - "01/02 00:30" (UTC+8 day 01/02, after midnight) → groups to 01/02
   *
   * This corresponds to:
   * - UTC 2024-01-01T15:30Z + 8h = 2024-01-01T23:30 UTC+8 → date "01/01"
   * - UTC 2024-01-01T16:30Z + 8h = 2024-01-02T00:30 UTC+8 → date "01/02"
   */
  it('bars straddling UTC+8 midnight group to different days', () => {
    const bars = [
      { time: '01/01 23:30', high: 100, low: 90 }, // UTC+8 day 01/01
      { time: '01/02 00:30', high: 110, low: 95 }, // UTC+8 day 01/02
    ]
    const result = computeStatsByDay(bars, 100)
    expect(result).toHaveLength(2)
    expect(result[0].highest.price).toBe(100) // Day 1 max from 01/01 bars only
    expect(result[1].highest.price).toBe(110) // Day 2 max from 01/02 bars only
  })

  it('bars both after UTC midnight but same UTC+8 day group to one day', () => {
    // UTC 2024-01-01T23:30Z + 8h = 2024-01-02T07:30 UTC+8 → date "01/02"
    // UTC 2024-01-02T00:30Z + 8h = 2024-01-02T08:30 UTC+8 → date "01/02"
    // Both on UTC+8 day 01/02 → one group
    const bars = [
      { time: '01/02 07:30', high: 100, low: 90 },
      { time: '01/02 08:30', high: 110, low: 95 },
    ]
    const result = computeStatsByDay(bars, 100)
    expect(result).toHaveLength(1)
    expect(result[0].highest.price).toBe(110)
    expect(result[0].lowest.price).toBe(90)
  })
})

describe('computeStatsByDay — pct calculation', () => {
  it('pct values are relative to currentClose', () => {
    const bars = [bar('01/01', '10:00', 110, 90)]
    const result = computeStatsByDay(bars, 100)
    expect(result[0].highest.pct).toBeCloseTo(10, 1)
    expect(result[0].lowest.pct).toBeCloseTo(-10, 1)
  })
})
