import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import axios from 'axios'
import App from '../App'

vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({
      data: {
        matches: [
          {
            id: 'm1', correlation: 0.95,
            historicalOhlc: [
              { open: 1985, high: 1993, low: 1980, close: 1992 },
              { open: 1992, high: 2000, low: 1988, close: 1997 },
            ],
            futureOhlc: [{ open: 2100, high: 2120, low: 2090, close: 2110 }],
            startDate: '2023-01-01',
          },
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

test('Use Example Value auto-triggers prediction and renders MatchCard elements in DOM', async () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /use example value/i }))

  await waitFor(() => {
    // MatchCard for m1 must be visible in the document
    expect(screen.getByText('r = 0.9500')).toBeInTheDocument()
  })
  // Checkbox for the match card must also be present
  expect(screen.getByRole('checkbox')).toBeInTheDocument()
})

test('MainChart container remains in DOM after Use Example Value (no crash / blank screen)', async () => {
  const { container } = render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /use example value/i }))

  await waitFor(() => {
    expect(screen.getAllByPlaceholderText('Open')[0]).toHaveValue('1985.51')
  })

  // Pure SVG chart must be present
  expect(container.querySelector('[data-testid="main-chart-svg"]')).toBeInTheDocument()
  // Top-level app shell must not have been replaced by an error screen
  expect(container.querySelector('[class*="bg-gray-950"]')).toBeInTheDocument()
})

test('MainChart renders candlestick rects after prediction', async () => {
  const { container } = render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /use example value/i }))

  await waitFor(() => {
    expect(screen.getByText('r = 0.9500')).toBeInTheDocument()
  })

  // SVG rect elements exist (candle bodies) — user candles + forecast candle
  const rects = container.querySelectorAll('[data-testid="main-chart-svg"] rect')
  expect(rects.length).toBeGreaterThan(0)
})

// ── TDD: State preservation ───────────────────────────────────────────────────

test('unchecking 2 of 3 matches then clicking Start Prediction keeps them unchecked', async () => {
  vi.mocked(axios.post).mockResolvedValueOnce({
    data: {
      matches: [
        { id: 'm1', correlation: 0.95, historicalOhlc: [{ open: 100, high: 110, low: 90, close: 105 }], futureOhlc: [{ open: 105, high: 115, low: 100, close: 110 }], startDate: '2023-01-01' },
        { id: 'm2', correlation: 0.85, historicalOhlc: [{ open: 100, high: 110, low: 90, close: 105 }], futureOhlc: [{ open: 105, high: 115, low: 100, close: 110 }], startDate: '2023-02-01' },
        { id: 'm3', correlation: 0.75, historicalOhlc: [{ open: 100, high: 110, low: 90, close: 105 }], futureOhlc: [{ open: 105, high: 115, low: 100, close: 110 }], startDate: '2023-03-01' },
      ],
      stats: { optimistic: 2200, baseline: 2100, pessimistic: 1900, winRate: 0.7, meanCorrelation: 0.85 }
    }
  })

  render(<App />)

  // Fill all 5 rows to enable button
  for (let i = 0; i < 5; i++) {
    fireEvent.change(screen.getAllByPlaceholderText('Open')[i], { target: { value: String(2000 + i) } })
    fireEvent.change(screen.getAllByPlaceholderText('High')[i], { target: { value: String(2010 + i) } })
    fireEvent.change(screen.getAllByPlaceholderText('Low')[i], { target: { value: String(1990 + i) } })
    fireEvent.change(screen.getAllByPlaceholderText('Close')[i], { target: { value: String(2005 + i) } })
  }

  // First predict — API returns 3 matches
  fireEvent.click(screen.getByRole('button', { name: /start prediction/i }))
  await waitFor(() => expect(screen.getAllByRole('checkbox')).toHaveLength(3))

  // All 3 should be checked
  let boxes = screen.getAllByRole('checkbox')
  expect(boxes[0]).toBeChecked()
  expect(boxes[1]).toBeChecked()
  expect(boxes[2]).toBeChecked()

  // Uncheck m2 (index 1) and m3 (index 2)
  fireEvent.click(boxes[1])
  fireEvent.click(boxes[2])
  expect(screen.getAllByRole('checkbox')[1]).not.toBeChecked()
  expect(screen.getAllByRole('checkbox')[2]).not.toBeChecked()

  // Second predict — should NOT reset checkboxes
  fireEvent.click(screen.getByRole('button', { name: /start prediction/i }))

  // Wait for any async work to settle (button must not be in "Predicting..." state)
  await waitFor(() => expect(screen.queryByText(/predicting/i)).not.toBeInTheDocument())

  // All 3 match cards must still be in DOM, m2 and m3 must stay unchecked
  const b = screen.getAllByRole('checkbox')
  expect(b).toHaveLength(3)          // all 3 matches still present
  expect(b[0]).toBeChecked()         // m1 still checked
  expect(b[1]).not.toBeChecked()     // m2 still unchecked
  expect(b[2]).not.toBeChecked()     // m3 still unchecked
})

test('MatchList items show mini-chart thumbnails and dates after prediction', async () => {
  const { container } = render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /use example value/i }))

  await waitFor(() => {
    expect(screen.getByText('r = 0.9500')).toBeInTheDocument()
  })

  // Each match card must have an SVG mini-chart
  expect(container.querySelector('[data-testid="mini-chart"]')).toBeInTheDocument()
  // Date must be visible
  expect(screen.getByText('2023-01-01')).toBeInTheDocument()
})
