import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import axios from 'axios'
import App from '../App'

const OFFICIAL_CSV = Array.from({ length: 24 }, (_, i) =>
  `${1775088000000000 + i * 3600_000_000},${2000 + i},${2010 + i},${1990 + i},${2005 + i},0,0,0,0,0,0,0`
).join('\n')

vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({
      data: {
        matches: [
          {
            id: 'm1',
            correlation: 0.95,
            historical_ohlc: [
              { open: 1985, high: 1993, low: 1980, close: 1992 },
              { open: 1992, high: 2000, low: 1988, close: 1997 },
            ],
            future_ohlc: [{ open: 2100, high: 2120, low: 2090, close: 2110 }],
            start_date: '2023-01-01',
            end_date: '2023-01-02',
          },
        ],
        stats: {
          highest: { label: 'Highest', price: 2200, pct: 5, occurrence_bar: 8, occurrence_window: 'Hour +8', historical_time: '2023-01-02 08:00' },
          second_highest: { label: 'Second Highest', price: 2175, pct: 3.75, occurrence_bar: 6, occurrence_window: 'Hour +6', historical_time: '2023-01-02 06:00' },
          second_lowest: { label: 'Second Lowest', price: 1925, pct: -3.75, occurrence_bar: 4, occurrence_window: 'Hour +4', historical_time: '2023-01-02 04:00' },
          lowest: { label: 'Lowest', price: 1900, pct: -5, occurrence_bar: 2, occurrence_window: 'Hour +2', historical_time: '2023-01-02 02:00' },
          win_rate: 0.7,
          mean_correlation: 0.95,
        },
      },
    }),
  },
}))

function mockFileReader(content: string) {
  const mock: {
    result: string
    onload: ((event: { target: { result: string } }) => void) | null
    onerror: (() => void) | null
    readAsText: any
  } = {
    result: content,
    onload: null,
    onerror: null,
    readAsText: vi.fn(() => {
      setTimeout(() => mock.onload?.({ target: { result: content } }), 0)
    }),
  }
  vi.spyOn(window, 'FileReader').mockImplementationOnce(() => mock as unknown as FileReader)
  return mock
}

async function uploadOfficialCsv() {
  mockFileReader(OFFICIAL_CSV)
  const file = new File([OFFICIAL_CSV], 'ETHUSDT-1h.csv', { type: 'text/csv' })
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  fireEvent.change(input, { target: { files: [file] } })

  await waitFor(() => {
    expect(screen.getAllByPlaceholderText('Open')[0]).toHaveValue('2000')
  })
}

test('official input upload fills the editor and enables prediction', async () => {
  render(<App />)

  await uploadOfficialCsv()

  expect(screen.getByText('ETHUSDT-1h.csv')).toBeInTheDocument()
  expect(screen.getByText(/24 x 1H bars, source timestamps in UTC\+0/i)).toBeInTheDocument()
  expect(screen.getAllByDisplayValue('2026-04-02T08:00')[0]).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /start prediction/i })).not.toBeDisabled()
})

test('uploading a new official csv restores loaded values', async () => {
  render(<App />)

  await uploadOfficialCsv()

  fireEvent.change(screen.getAllByPlaceholderText('Open')[0], {
    target: { value: '9999' },
  })
  expect(screen.getAllByPlaceholderText('Open')[0]).toHaveValue('9999')

  await uploadOfficialCsv()
  expect(screen.getAllByPlaceholderText('Open')[0]).toHaveValue('2000')
})

test('uploaded official csv drives prediction and match list rendering', async () => {
  render(<App />)

  await uploadOfficialCsv()

  fireEvent.click(screen.getByRole('button', { name: /start prediction/i }))

  await waitFor(() => {
    expect(screen.getByText('r = 0.9500')).toBeInTheDocument()
  })

  expect(screen.getByRole('checkbox')).toBeInTheDocument()
  expect(screen.getByText(/2023-01-01/)).toBeInTheDocument()
})

test('screenshot ocr controls are removed from the app shell', async () => {
  render(<App />)

  await waitFor(() => expect(screen.getAllByText(/official input/i).length).toBeGreaterThan(0))

  expect(screen.queryByText(/screenshot ocr prompt/i)).not.toBeInTheDocument()
  expect(screen.queryByText(/paste ocr csv result/i)).not.toBeInTheDocument()
  expect(screen.queryByText(/ma99 assist/i)).not.toBeInTheDocument()
})

test('second prediction with unchanged inputs preserves unchecked matches', async () => {
  vi.mocked(axios.post).mockResolvedValueOnce({
    data: {
      matches: [
        {
          id: 'm1',
          correlation: 0.95,
          historical_ohlc: [{ open: 100, high: 110, low: 90, close: 105 }],
          future_ohlc: [{ open: 105, high: 115, low: 100, close: 110 }],
          start_date: '2023-01-01',
          end_date: '2023-01-02',
        },
        {
          id: 'm2',
          correlation: 0.85,
          historical_ohlc: [{ open: 100, high: 110, low: 90, close: 105 }],
          future_ohlc: [{ open: 105, high: 115, low: 100, close: 110 }],
          start_date: '2023-02-01',
          end_date: '2023-02-02',
        },
        {
          id: 'm3',
          correlation: 0.75,
          historical_ohlc: [{ open: 100, high: 110, low: 90, close: 105 }],
          future_ohlc: [{ open: 105, high: 115, low: 100, close: 110 }],
          start_date: '2023-03-01',
          end_date: '2023-03-02',
        },
      ],
      stats: {
        highest: { label: 'Highest', price: 2200, pct: 5, occurrence_bar: 8, occurrence_window: 'Hour +8', historical_time: '2023-01-02 08:00' },
        second_highest: { label: 'Second Highest', price: 2175, pct: 3.75, occurrence_bar: 6, occurrence_window: 'Hour +6', historical_time: '2023-01-02 06:00' },
        second_lowest: { label: 'Second Lowest', price: 1925, pct: -3.75, occurrence_bar: 4, occurrence_window: 'Hour +4', historical_time: '2023-01-02 04:00' },
        lowest: { label: 'Lowest', price: 1900, pct: -5, occurrence_bar: 2, occurrence_window: 'Hour +2', historical_time: '2023-01-02 02:00' },
        win_rate: 0.7,
        mean_correlation: 0.85,
      },
    },
  })

  render(<App />)

  await uploadOfficialCsv()

  fireEvent.click(screen.getByRole('button', { name: /start prediction/i }))
  await waitFor(() => expect(screen.getAllByRole('checkbox')).toHaveLength(3))

  const boxes = screen.getAllByRole('checkbox')
  fireEvent.click(boxes[1])
  fireEvent.click(boxes[2])

  fireEvent.click(screen.getByRole('button', { name: /start prediction/i }))

  await waitFor(() => expect(screen.queryByText(/predicting/i)).not.toBeInTheDocument())

  const updatedBoxes = screen.getAllByRole('checkbox')
  expect(updatedBoxes[0]).toBeChecked()
  expect(updatedBoxes[1]).not.toBeChecked()
  expect(updatedBoxes[2]).not.toBeChecked()
})

test('official input upload also updates the chart data source', async () => {
  const { container } = render(<App />)

  await uploadOfficialCsv()

  expect(container.querySelector('[data-testid="main-chart-container"]')).toBeInTheDocument()
  expect(screen.getByText('ETHUSDT-1h.csv')).toBeInTheDocument()
})
