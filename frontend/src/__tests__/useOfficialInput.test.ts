import { describe, it, expect } from 'vitest'
import { emptyRows, isRowComplete, parseExchangeTimestamp } from '../utils/officialCsvParsing'

/**
 * Unit tests for utils/officialCsvParsing.ts pure functions.
 * parseOfficialCsvFile is already tested in parseOfficialCsvFile.test.ts
 * (import path updated to ../utils/officialCsvParsing in Phase A).
 *
 * PM ruling (QA Challenge #3): parseExchangeTimestamp uses UTC output
 * (getUTCFullYear/Month/Date/Hours/Minutes). Required cases:
 * (a) unix-seconds roundtrip, (b) milliseconds auto-detection,
 * (c) empty string throws, (d) non-numeric throws.
 */

describe('parseExchangeTimestamp', () => {
  it('(a) unix-seconds 1700000000 → "2023-11-14 22:13"', () => {
    expect(parseExchangeTimestamp('1700000000')).toBe('2023-11-14 22:13')
  })

  it('(b) milliseconds 1700000000000 → same result as unix-seconds 1700000000', () => {
    expect(parseExchangeTimestamp('1700000000000')).toBe('2023-11-14 22:13')
  })

  it('(c) empty string throws', () => {
    expect(() => parseExchangeTimestamp('')).toThrow('Missing timestamp column.')
  })

  it('(d) non-numeric string throws', () => {
    expect(() => parseExchangeTimestamp('not-a-number')).toThrow('Invalid timestamp: not-a-number')
  })

  it('whitespace-only string throws (treated as empty after trim)', () => {
    expect(() => parseExchangeTimestamp('   ')).toThrow('Missing timestamp column.')
  })
})

describe('isRowComplete', () => {
  it('row with all valid fields returns true', () => {
    expect(isRowComplete({ time: '2023-11-14 22:13', open: '1800.5', high: '1850.0', low: '1790.0', close: '1820.0' })).toBe(true)
  })

  it('row with empty time returns false', () => {
    expect(isRowComplete({ time: '', open: '1800.5', high: '1850.0', low: '1790.0', close: '1820.0' })).toBe(false)
  })

  it('row with empty close returns false', () => {
    expect(isRowComplete({ time: '2023-11-14 22:13', open: '1800.5', high: '1850.0', low: '1790.0', close: '' })).toBe(false)
  })

  it('row with NaN close returns false', () => {
    expect(isRowComplete({ time: '2023-11-14 22:13', open: '1800.5', high: '1850.0', low: '1790.0', close: 'abc' })).toBe(false)
  })
})

describe('emptyRows', () => {
  it('returns array of n empty rows', () => {
    const rows = emptyRows(3)
    expect(rows).toHaveLength(3)
    for (const row of rows) {
      expect(row).toEqual({ open: '', high: '', low: '', close: '', time: '' })
    }
  })

  it('returns empty array for n=0', () => {
    expect(emptyRows(0)).toHaveLength(0)
  })

  it('each row is a distinct object (not shared reference)', () => {
    const rows = emptyRows(2)
    rows[0].open = 'X'
    expect(rows[1].open).toBe('')
  })
})
