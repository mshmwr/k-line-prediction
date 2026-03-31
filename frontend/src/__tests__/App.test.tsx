import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import App from '../App'

vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({
      data: {
        matches: [
          { id: 'm1', correlation: 0.95, historicalOhlc: [], futureOhlc: [{ open: 2100, high: 2120, low: 2090, close: 2110 }], startDate: '2023-01-01' },
        ],
        stats: { optimistic: 2200, baseline: 2100, pessimistic: 1900, winRate: 0.7, meanCorrelation: 0.95 }
      }
    })
  }
}))

test('predict button disabled initially', () => {
  render(<App />)
  expect(screen.getByRole('button', { name: /start prediction/i })).toBeDisabled()
})

test('predict button enabled when all rows filled', async () => {
  render(<App />)
  const openInputs = screen.getAllByPlaceholderText('Open')
  const highInputs = screen.getAllByPlaceholderText('High')
  const lowInputs = screen.getAllByPlaceholderText('Low')
  const closeInputs = screen.getAllByPlaceholderText('Close')
  for (let i = 0; i < 5; i++) {
    fireEvent.change(openInputs[i], { target: { value: String(2000 + i) } })
    fireEvent.change(highInputs[i], { target: { value: String(2010 + i) } })
    fireEvent.change(lowInputs[i], { target: { value: String(1990 + i) } })
    fireEvent.change(closeInputs[i], { target: { value: String(2005 + i) } })
  }
  expect(screen.getByRole('button', { name: /start prediction/i })).not.toBeDisabled()
})

test('predict button disabled when all checkboxes unchecked', async () => {
  render(<App />)
  const openInputs = screen.getAllByPlaceholderText('Open')
  for (let i = 0; i < 5; i++) {
    fireEvent.change(openInputs[i], { target: { value: String(2000 + i) } })
    fireEvent.change(screen.getAllByPlaceholderText('High')[i], { target: { value: String(2010 + i) } })
    fireEvent.change(screen.getAllByPlaceholderText('Low')[i], { target: { value: String(1990 + i) } })
    fireEvent.change(screen.getAllByPlaceholderText('Close')[i], { target: { value: String(2005 + i) } })
  }
  fireEvent.click(screen.getByRole('button', { name: /start prediction/i }))
  await waitFor(() => expect(screen.getByRole('checkbox')).toBeInTheDocument())
  fireEvent.click(screen.getByRole('checkbox'))
  expect(screen.getByRole('button', { name: /start prediction/i })).toBeDisabled()
})
