import { render, screen, fireEvent } from '@testing-library/react'
import { MatchList } from '../components/MatchList'
import { MatchCase } from '../types'

const makeMatch = (id: string, correlation: number): MatchCase => ({
  id, correlation,
  historicalOhlc: [], futureOhlc: [], startDate: '2023-01-01', endDate: '2023-01-02',
  historicalMa99: [], futureMa99: [],
})

test('renders match cards', () => {
  render(
    <MatchList
      matches={[makeMatch('m1', 0.92), makeMatch('m2', 0.85)]}
      selected={new Set(['m1', 'm2'])}
      onToggle={() => {}}
      timeframe="1H"
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
      timeframe="1H"
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
      timeframe="1H"
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
      timeframe="1H"
    />
  )
  fireEvent.click(screen.getByRole('checkbox'))
  expect(onToggle).toHaveBeenCalledWith('m1')
})

// ── Visual integrity tests ────────────────────────────────────────────────────

test('expanded match item renders chart container when OHLC data provided', () => {
  render(
    <MatchList
      matches={[{
        id: 'm1', correlation: 0.92,
        historicalOhlc: [
          { open: 100, high: 110, low: 95, close: 105 },
          { open: 105, high: 115, low: 100, close: 110 },
        ],
        futureOhlc: [{ open: 110, high: 120, low: 105, close: 115 }],
        startDate: '2023-06-15',
        endDate: '2023-06-16',
        historicalMa99: [], futureMa99: [],
      }]}
      selected={new Set(['m1'])}
      onToggle={() => {}}
      timeframe="1H"
    />
  )
  fireEvent.click(screen.getByText(/2023-06-15/i))
  expect(screen.getByTestId('match-chart')).toBeInTheDocument()
  expect(screen.getByText('Right = Actual future 1 x 1H bars')).toBeInTheDocument()
})

test('match item displays start date', () => {
  render(
    <MatchList
      matches={[makeMatch('m1', 0.92)]}
      selected={new Set(['m1'])}
      onToggle={() => {}}
      timeframe="1H"
    />
  )
  expect(screen.getByText(/2023-01-01/)).toBeInTheDocument()
})

test('expanded match chart shows orange split line when both historical and future OHLC present', () => {
  render(
    <MatchList
      matches={[{
        id: 'm1', correlation: 0.9,
        historicalOhlc: [{ open: 100, high: 110, low: 95, close: 105 }],
        futureOhlc: [{ open: 110, high: 120, low: 105, close: 115 }],
        startDate: '2023-01-01',
        endDate: '2023-01-02',
        historicalMa99: [], futureMa99: [],
      }]}
      selected={new Set(['m1'])}
      onToggle={() => {}}
      timeframe="1H"
    />
  )
  fireEvent.click(screen.getByText(/2023-01-01/i))
  expect(screen.getByTestId('match-chart-split-line')).toBeInTheDocument()
})

// ── Null-safety tests (regression for toFixed crash) ──────────────────────────

test('does not crash when correlation is null/undefined', () => {
  const malformed = { id: 'm1', correlation: null as unknown as number, historicalOhlc: [], futureOhlc: [], startDate: '', endDate: '', historicalMa99: [], futureMa99: [] }
  expect(() =>
    render(<MatchList matches={[malformed]} selected={new Set(['m1'])} onToggle={() => {}} timeframe="1H" />)
  ).not.toThrow()
  expect(screen.getByRole('checkbox')).toBeInTheDocument()
})

test('does not crash when futureOhlc is missing', () => {
  const malformed = { id: 'm2', correlation: 0.8, historicalOhlc: [], futureOhlc: undefined as any, startDate: '2023-01-01', endDate: '2023-01-02', historicalMa99: [], futureMa99: [] }
  expect(() =>
    render(<MatchList matches={[malformed]} selected={new Set()} onToggle={() => {}} timeframe="1H" />)
  ).not.toThrow()
})

test('expanded match with missing start date shows fallback instead of crashing', () => {
  const malformed = {
    id: 'm3',
    correlation: 0.7,
    historicalOhlc: [{ open: 100, high: 110, low: 95, close: 105 }],
    futureOhlc: [{ open: 105, high: 115, low: 100, close: 110 }],
    startDate: '',
    endDate: '',
    historicalMa99: [], futureMa99: [],
  }
  render(<MatchList matches={[malformed]} selected={new Set(['m3'])} onToggle={() => {}} timeframe="1H" />)
  fireEvent.click(screen.getByText(/unknown interval/i))
  expect(screen.getByText(/match chart unavailable because this case does not have a valid start date/i)).toBeInTheDocument()
})
