import { render, screen } from '@testing-library/react'
import { StatsPanel } from '../components/StatsPanel'
import { PredictStats } from '../types'

const fullStats: PredictStats = {
  highest: { label: 'Highest', price: 2200, pct: 5, occurrenceBar: 8, occurrenceWindow: 'Hour +8', historicalTime: '2023-01-02 08:00' },
  secondHighest: { label: 'Second Highest', price: 2175, pct: 3.75, occurrenceBar: 6, occurrenceWindow: 'Hour +6', historicalTime: '2023-01-02 06:00' },
  secondLowest: { label: 'Second Lowest', price: 1925, pct: -3.75, occurrenceBar: 4, occurrenceWindow: 'Hour +4', historicalTime: '2023-01-02 04:00' },
  lowest: { label: 'Lowest', price: 1900, pct: -5, occurrenceBar: 2, occurrenceWindow: 'Hour +2', historicalTime: '2023-01-02 02:00' },
  winRate: 0.7, meanCorrelation: 0.95,
}

const projectedFutureBars = Array.from({ length: 24 }, (_, index) => ({
  time: `Hour +${index + 1}`,
  ts: (index + 1) * 3600,
  open: 2000 + index,
  high: 2010 + index,
  low: 1990 + index,
  close: 2005 + index,
}))

const projectedFutureBars1D = Array.from({ length: 3 }, (_, index) => ({
  time: `04/0${index + 1}`,
  ts: (index + 1) * 86400,
  open: 2000 + index * 10,
  high: 2030 + index * 10,
  low: 1980 + index * 10,
  close: 2010 + index * 10,
}))

test('renders nothing meaningful when stats is null', () => {
  render(<StatsPanel stats={null} projectedFutureBars={[]} projectedFutureBars1D={[]} dayStats={[]} timeframe="1H" isDirty={false} selectedCount={0} totalCount={0} />)
  expect(screen.getByText(/run prediction/i)).toBeInTheDocument()
})

test('renders full stats correctly', () => {
  render(<StatsPanel stats={fullStats} projectedFutureBars={projectedFutureBars} projectedFutureBars1D={projectedFutureBars1D} dayStats={[]} timeframe="1H" isDirty={false} selectedCount={1} totalCount={1} />)
  expect(screen.getByText('2200.00')).toBeInTheDocument()
  expect(screen.getByText('Consensus Forecast (1H)')).toBeInTheDocument()
  expect(screen.getByText('Consensus Forecast (1D)')).toBeInTheDocument()
  expect(screen.getByText('70.0%')).toBeInTheDocument()
  expect(screen.getAllByTestId('stats-projection-chart')).toHaveLength(2)
})

// ── Null-safety regression (toFixed crash) ───────────────────────────────────

test('does not crash when stat values are null/undefined', () => {
  const partial = {
    highest: { label: 'Highest', price: null, pct: null, occurrenceBar: 1, occurrenceWindow: 'Hour +1', historicalTime: '' },
    secondHighest: { label: 'Second Highest', price: 2100, pct: 2.5, occurrenceBar: 2, occurrenceWindow: 'Hour +2', historicalTime: '' },
    secondLowest: { label: 'Second Lowest', price: 1900, pct: -2.5, occurrenceBar: 3, occurrenceWindow: 'Hour +3', historicalTime: '' },
    lowest: { label: 'Lowest', price: undefined, pct: undefined, occurrenceBar: 4, occurrenceWindow: 'Hour +4', historicalTime: '' },
    winRate: null,
    meanCorrelation: undefined,
  } as unknown as PredictStats
  expect(() =>
    render(<StatsPanel stats={partial} projectedFutureBars={projectedFutureBars} projectedFutureBars1D={projectedFutureBars1D} dayStats={[]} timeframe="1H" isDirty={false} selectedCount={1} totalCount={1} />)
  ).not.toThrow()
  // Page must still be interactive — not a blank screen
  expect(document.body.innerHTML).not.toBe('')
})

test('win rate and avg r display actual values (not dashes)', () => {
  render(<StatsPanel stats={fullStats} projectedFutureBars={projectedFutureBars} projectedFutureBars1D={projectedFutureBars1D} dayStats={[]} timeframe="1H" isDirty={false} selectedCount={1} totalCount={1} />)
  expect(screen.getByText('70.0%')).toBeInTheDocument()
  expect(screen.getByText('0.9500')).toBeInTheDocument()
  expect(screen.getByText('2200.00')).toBeInTheDocument()
})

test('shows dirty banner when isDirty is true', () => {
  render(<StatsPanel stats={fullStats} projectedFutureBars={projectedFutureBars} projectedFutureBars1D={projectedFutureBars1D} dayStats={[]} timeframe="1H" isDirty={true} selectedCount={1} totalCount={2} />)
  expect(screen.getByText(/selection changed/i)).toBeInTheDocument()
})

test('1D timeframe shows only the native 1D chart', () => {
  render(<StatsPanel stats={fullStats} projectedFutureBars={projectedFutureBars1D} projectedFutureBars1D={[]} dayStats={[]} timeframe="1D" isDirty={false} selectedCount={1} totalCount={1} />)
  expect(screen.getByText('Consensus Forecast (1D)')).toBeInTheDocument()
  expect(screen.queryByText('Consensus Forecast (1H)')).not.toBeInTheDocument()
  expect(screen.getAllByTestId('stats-projection-chart')).toHaveLength(1)
})
