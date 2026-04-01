import { render, screen } from '@testing-library/react'
import { StatsPanel } from '../components/StatsPanel'
import { PredictStats } from '../types'

const fullStats: PredictStats = {
  optimistic: 2200, baseline: 2100, pessimistic: 1900,
  winRate: 0.7, meanCorrelation: 0.95,
}

test('renders nothing meaningful when stats is null', () => {
  render(<StatsPanel stats={null} isDirty={false} />)
  expect(screen.getByText(/run prediction/i)).toBeInTheDocument()
})

test('renders full stats correctly', () => {
  render(<StatsPanel stats={fullStats} isDirty={false} />)
  expect(screen.getByText('2200.00')).toBeInTheDocument()
  expect(screen.getByText('70.0%')).toBeInTheDocument()
})

// ── Null-safety regression (toFixed crash) ───────────────────────────────────

test('does not crash when stat values are null/undefined', () => {
  const partial = { optimistic: null, baseline: 2100, pessimistic: undefined, winRate: null, meanCorrelation: undefined } as unknown as PredictStats
  expect(() =>
    render(<StatsPanel stats={partial} isDirty={false} />)
  ).not.toThrow()
  // Page must still be interactive — not a blank screen
  expect(document.body.innerHTML).not.toBe('')
})

test('win rate and avg r display actual values (not dashes)', () => {
  render(<StatsPanel stats={fullStats} isDirty={false} />)
  // Must show actual numeric values, not '—'
  expect(screen.getByText('70.0%')).toBeInTheDocument()
  expect(screen.getByText('0.9500')).toBeInTheDocument()
  // '—%' must NOT appear
  expect(screen.queryByText('—%')).not.toBeInTheDocument()
})

test('shows dirty banner when isDirty is true', () => {
  render(<StatsPanel stats={fullStats} isDirty={true} />)
  expect(screen.getByText(/selection changed/i)).toBeInTheDocument()
})
