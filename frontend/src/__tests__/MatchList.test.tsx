import { render, screen, fireEvent } from '@testing-library/react'
import { MatchList } from '../components/MatchList'
import { MatchCase } from '../types'

const makeMatch = (id: string, correlation: number): MatchCase => ({
  id, correlation,
  historicalOhlc: [], futureOhlc: [], startDate: '2023-01-01'
})

test('renders match cards', () => {
  render(
    <MatchList
      matches={[makeMatch('m1', 0.92), makeMatch('m2', 0.85)]}
      selected={new Set(['m1', 'm2'])}
      onToggle={() => {}}
    />
  )
  expect(screen.getByText('r = 0.9200')).toBeInTheDocument()
  expect(screen.getByText('r = 0.8500')).toBeInTheDocument()
})

test('unchecked card has 50% opacity class', () => {
  const { container } = render(
    <MatchList
      matches={[makeMatch('m1', 0.9)]}
      selected={new Set()}
      onToggle={() => {}}
    />
  )
  expect(container.querySelector('.opacity-50')).toBeInTheDocument()
})

test('checked card has full opacity', () => {
  const { container } = render(
    <MatchList
      matches={[makeMatch('m1', 0.9)]}
      selected={new Set(['m1'])}
      onToggle={() => {}}
    />
  )
  expect(container.querySelector('.opacity-50')).not.toBeInTheDocument()
})

test('calls onToggle when checkbox clicked', () => {
  const onToggle = vi.fn()
  render(
    <MatchList
      matches={[makeMatch('m1', 0.9)]}
      selected={new Set(['m1'])}
      onToggle={onToggle}
    />
  )
  fireEvent.click(screen.getByRole('checkbox'))
  expect(onToggle).toHaveBeenCalledWith('m1')
})

// ── Visual integrity tests ────────────────────────────────────────────────────

test('match item renders MiniChart SVG thumbnail when OHLC data provided', () => {
  const { container } = render(
    <MatchList
      matches={[{
        id: 'm1', correlation: 0.92,
        historicalOhlc: [
          { open: 100, high: 110, low: 95, close: 105 },
          { open: 105, high: 115, low: 100, close: 110 },
        ],
        futureOhlc: [{ open: 110, high: 120, low: 105, close: 115 }],
        startDate: '2023-06-15',
      }]}
      selected={new Set(['m1'])}
      onToggle={() => {}}
    />
  )
  // SVG thumbnail must be present
  expect(container.querySelector('[data-testid="mini-chart"]')).toBeInTheDocument()
  // Candle rect bodies must be rendered (3 candles = 3 rects)
  const rects = container.querySelectorAll('[data-testid="mini-chart"] rect')
  expect(rects.length).toBeGreaterThan(0)
})

test('match item displays start date', () => {
  render(
    <MatchList
      matches={[makeMatch('m1', 0.92)]}
      selected={new Set(['m1'])}
      onToggle={() => {}}
    />
  )
  expect(screen.getByText('2023-01-01')).toBeInTheDocument()
})

test('mini-chart shows orange split line when both historical and future OHLC present', () => {
  const { container } = render(
    <MatchList
      matches={[{
        id: 'm1', correlation: 0.9,
        historicalOhlc: [{ open: 100, high: 110, low: 95, close: 105 }],
        futureOhlc: [{ open: 110, high: 120, low: 105, close: 115 }],
        startDate: '2023-01-01',
      }]}
      selected={new Set(['m1'])}
      onToggle={() => {}}
    />
  )
  // The orange split line is a <line> with stroke="#f97316"
  const lines = container.querySelectorAll('[data-testid="mini-chart"] line')
  const splitLine = Array.from(lines).find(l => l.getAttribute('stroke') === '#f97316')
  expect(splitLine).toBeTruthy()
})

// ── Null-safety tests (regression for toFixed crash) ──────────────────────────

test('does not crash when correlation is null/undefined', () => {
  const malformed = { id: 'm1', correlation: null as unknown as number, historicalOhlc: [], futureOhlc: [], startDate: '' }
  expect(() =>
    render(<MatchList matches={[malformed]} selected={new Set(['m1'])} onToggle={() => {}} />)
  ).not.toThrow()
  expect(screen.getByRole('checkbox')).toBeInTheDocument()
})

test('does not crash when futureOhlc is missing', () => {
  const malformed = { id: 'm2', correlation: 0.8, historicalOhlc: [], futureOhlc: undefined as any, startDate: '2023-01-01' }
  expect(() =>
    render(<MatchList matches={[malformed]} selected={new Set()} onToggle={() => {}} />)
  ).not.toThrow()
})
