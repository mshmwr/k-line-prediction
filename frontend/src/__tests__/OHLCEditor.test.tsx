import { render, screen, fireEvent } from '@testing-library/react'
import { OHLCEditor } from '../components/OHLCEditor'
import { OHLCRow } from '../types'

const emptyRows = (n: number): OHLCRow[] =>
  Array.from({ length: n }, () => ({ open: '', high: '', low: '', close: '', time: '' }))

test('renders N rows of OHLC inputs', () => {
  render(<OHLCEditor rows={emptyRows(5)} timeframe="1H" onChange={() => {}} />)
  expect(screen.getAllByPlaceholderText('Open')).toHaveLength(5)
})

test('shows completion status', () => {
  const rows: OHLCRow[] = [
    { open: '100', high: '110', low: '90', close: '105', time: '2026-04-02 00:00' },
    { open: '', high: '', low: '', close: '', time: '' },
  ]
  render(<OHLCEditor rows={rows} timeframe="1H" onChange={() => {}} />)
  expect(screen.getByText('1/2 rows filled')).toBeInTheDocument()
})

test('calls onChange when cell edited', () => {
  const onChange = vi.fn()
  render(<OHLCEditor rows={emptyRows(2)} timeframe="1H" onChange={onChange} />)
  fireEvent.change(screen.getAllByPlaceholderText('Open')[0], {
    target: { value: '2000' },
  })
  expect(onChange).toHaveBeenCalledWith(0, 'open', '2000')
})
