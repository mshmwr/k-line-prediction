import { render, screen } from '@testing-library/react'
import { PredictButton } from '../components/PredictButton'

test('disabled when reason is ohlcIncomplete', () => {
  render(<PredictButton disabled={true} disabledReason="ohlcIncomplete" onClick={() => {}} loading={false} />)
  expect(screen.getByRole('button')).toBeDisabled()
  expect(screen.getByTitle('Complete all rows')).toBeInTheDocument()
})

test('disabled when reason is noSelection', () => {
  render(<PredictButton disabled={true} disabledReason="noSelection" onClick={() => {}} loading={false} />)
  expect(screen.getByTitle('Select at least 1 case')).toBeInTheDocument()
})

test('enabled when not disabled', () => {
  const onClick = vi.fn()
  render(<PredictButton disabled={false} disabledReason={null} onClick={onClick} loading={false} />)
  expect(screen.getByRole('button')).not.toBeDisabled()
})

test('shows loading spinner when loading', () => {
  render(<PredictButton disabled={false} disabledReason={null} onClick={() => {}} loading={true} />)
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  expect(screen.getByText('Running prediction...')).toBeInTheDocument()
})
