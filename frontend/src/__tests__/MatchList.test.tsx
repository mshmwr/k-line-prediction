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
