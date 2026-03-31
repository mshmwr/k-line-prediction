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
    }),
    get: vi.fn().mockResolvedValue({
      data: {
        rows: Array.from({ length: 5 }, (_, i) => ({
          open: 1985.51 + i, high: 1993.85 + i, low: 1980.54 + i, close: 1992.75 + i,
        }))
      }
    }),
  }
}))

// ── Existing tests (kept) ─────────────────────────────────────────────────────

test('predict button disabled initially', () => {
  render(<App />)
  expect(screen.getByRole('button', { name: /start prediction/i })).toBeDisabled()
})

test('predict button enabled when all rows filled manually', async () => {
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
  for (let i = 0; i < 5; i++) {
    fireEvent.change(screen.getAllByPlaceholderText('Open')[i], { target: { value: String(2000 + i) } })
    fireEvent.change(screen.getAllByPlaceholderText('High')[i], { target: { value: String(2010 + i) } })
    fireEvent.change(screen.getAllByPlaceholderText('Low')[i], { target: { value: String(1990 + i) } })
    fireEvent.change(screen.getAllByPlaceholderText('Close')[i], { target: { value: String(2005 + i) } })
  }
  fireEvent.click(screen.getByRole('button', { name: /start prediction/i }))
  await waitFor(() => expect(screen.getByRole('checkbox')).toBeInTheDocument())
  fireEvent.click(screen.getByRole('checkbox'))
  expect(screen.getByRole('button', { name: /start prediction/i })).toBeDisabled()
})

// ── New tests ─────────────────────────────────────────────────────────────────

const CDD_CSV = [
  'https://www.CryptoDataDownload.com,,,,,,,,,',
  'Unix,Date,Symbol,Open,High,Low,Close,Volume ETH,Volume USDT,tradecount',
  '1774652400000,2026-03-27 23:00:00,ETHUSDT,1985.51,1993.85,1980.54,1992.75,5204.99,10345971.73643,61934',
  '1774648800000,2026-03-27 22:00:00,ETHUSDT,1985.74,1987.23,1981.95,1985.52,2720.8642,5400531.165024,56343',
  '1774645200000,2026-03-27 21:00:00,ETHUSDT,1986.05,1991.08,1984.36,1985.73,3983.907,7919080.653004,65718',
  '1774641600000,2026-03-27 20:00:00,ETHUSDT,1991.7,1996.31,1980.0,1986.04,9603.2605,19091957.90524,103827',
  '1774638000000,2026-03-27 19:00:00,ETHUSDT,1984.43,1997.73,1978.94,1991.71,29660.8329,58997101.735945,177989',
].join('\n')

function mockFileReader(content: string) {
  const mock = {
    result: content,
    onload: null as any,
    onerror: null as any,
    readAsText: vi.fn(function (this: typeof mock) {
      setTimeout(() => this.onload?.({ target: { result: content } }), 0)
    }),
  }
  vi.spyOn(window, 'FileReader').mockImplementationOnce(() => mock as any)
  return mock
}

test('CSV upload (CryptoDataDownload format) fills editor and enables predict button', async () => {
  mockFileReader(CDD_CSV)
  render(<App />)

  const file = new File([CDD_CSV], 'test.csv', { type: 'text/csv' })
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  fireEvent.change(input, { target: { files: [file] } })

  // ohlcData populated → first Open input should show the parsed value
  await waitFor(() => {
    expect(screen.getAllByPlaceholderText('Open')[0]).toHaveValue('1985.51')
  })
  // All 5 rows filled → button enabled
  expect(screen.getByRole('button', { name: /start prediction/i })).not.toBeDisabled()
  // No error message
  expect(screen.queryByText(/missing columns/i)).not.toBeInTheDocument()
})

test('image upload shows an informative error message', () => {
  render(<App />)
  const file = new File(['...'], 'chart.png', { type: 'image/png' })
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  fireEvent.change(input, { target: { files: [file] } })

  expect(screen.getByText(/image upload is not supported/i)).toBeInTheDocument()
  // Predict button remains disabled — no data loaded
  expect(screen.getByRole('button', { name: /start prediction/i })).toBeDisabled()
})

test('Use Example Value fills editor and enables predict button', async () => {
  render(<App />)
  expect(screen.getByRole('button', { name: /start prediction/i })).toBeDisabled()

  fireEvent.click(screen.getByRole('button', { name: /use example value/i }))

  await waitFor(() => {
    expect(screen.getAllByPlaceholderText('Open')[0]).toHaveValue('1985.51')
  })
  expect(screen.getByRole('button', { name: /start prediction/i })).not.toBeDisabled()
})
