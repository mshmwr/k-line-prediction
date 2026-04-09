import { aggregateMaValuesTo1D, aggregateProjectedBarsTo1D, aggregateRowsTo1D } from '../utils/aggregation'
import { OHLCRow } from '../types'

test('aggregateRowsTo1D groups 1H rows by UTC+8 calendar day for display', () => {
  const rows: OHLCRow[] = [
    { time: '2024-01-01 00:00', open: '100', high: '110', low: '95', close: '108' },
    { time: '2024-01-01 15:00', open: '108', high: '118', low: '104', close: '116' },
    { time: '2024-01-01 16:00', open: '116', high: '120', low: '112', close: '118' },
    { time: '2024-01-02 15:00', open: '118', high: '130', low: '117', close: '125' },
  ]

  expect(aggregateRowsTo1D(rows)).toEqual([
    { time: '2024-01-01', open: '100', high: '118', low: '95', close: '116' },
    { time: '2024-01-02', open: '116', high: '130', low: '112', close: '125' },
  ])
})

test('aggregateMaValuesTo1D keeps the latest MA99 value in each UTC+8 display day', () => {
  const rows: OHLCRow[] = [
    { time: '2024-01-01 00:00', open: '100', high: '110', low: '95', close: '108' },
    { time: '2024-01-01 15:00', open: '108', high: '118', low: '104', close: '116' },
    { time: '2024-01-01 16:00', open: '116', high: '120', low: '112', close: '118' },
    { time: '2024-01-02 15:00', open: '118', high: '130', low: '117', close: '125' },
  ]

  expect(aggregateMaValuesTo1D(rows, [null, 2010, 2020, 2030])).toEqual([2010, 2030])
})

test('aggregateProjectedBarsTo1D composes the statistics 1D chart from the same 1H forecast path', () => {
  const bars = [
    { occurrenceBar: 1, time: '04/01 09:00', ts: Date.UTC(2024, 3, 1, 1, 0) / 1000, open: 100, high: 110, low: 95, close: 108 },
    { occurrenceBar: 2, time: '04/01 10:00', ts: Date.UTC(2024, 3, 1, 15, 0) / 1000, open: 108, high: 118, low: 104, close: 116 },
    { occurrenceBar: 3, time: '04/01 11:00', ts: Date.UTC(2024, 3, 1, 16, 0) / 1000, open: 116, high: 120, low: 112, close: 118 },
  ]

  expect(aggregateProjectedBarsTo1D(bars)).toEqual([
    { occurrenceBar: 1, time: '04-01', ts: Date.UTC(2024, 3, 1, 15, 0) / 1000, open: 100, high: 118, low: 95, close: 116 },
    { occurrenceBar: 2, time: '04-02', ts: Date.UTC(2024, 3, 1, 16, 0) / 1000, open: 116, high: 120, low: 112, close: 118 },
  ])
})
