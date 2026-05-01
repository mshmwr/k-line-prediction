import { OHLCRow } from '../types'

const OFFICIAL_ROW_COUNT = 24

export function emptyRows(count: number): OHLCRow[] {
  return Array.from({ length: count }, () => ({ open: '', high: '', low: '', close: '', time: '' }))
}

export function parseExchangeTimestamp(rawValue: string): string {
  const raw = rawValue.trim()
  if (!raw) throw new Error('Missing timestamp column.')

  const numeric = Number(raw)
  if (!Number.isFinite(numeric)) throw new Error(`Invalid timestamp: ${raw}`)

  let milliseconds = numeric
  if (Math.abs(numeric) >= 1e18) milliseconds = numeric / 1e6
  else if (Math.abs(numeric) >= 1e15) milliseconds = numeric / 1e3
  else if (Math.abs(numeric) >= 1e12) milliseconds = numeric
  else milliseconds = numeric * 1e3

  const date = new Date(milliseconds)
  if (Number.isNaN(date.getTime())) throw new Error(`Unparseable timestamp: ${raw}`)

  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hour = String(date.getUTCHours()).padStart(2, '0')
  const minute = String(date.getUTCMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

export function isRowComplete(row: OHLCRow): boolean {
  return Boolean(row.time) && (['open', 'high', 'low', 'close'] as const).every(
    field => row[field] !== '' && !Number.isNaN(Number(row[field]))
  )
}

export function parseOfficialCsvFile(text: string, filename: string): OHLCRow[] {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
  if (!lines.length) throw new Error(`${filename}: CSV is empty.`)

  const rows = lines.map((line, index) => {
    const cols = line.split(',').map(col => col.trim())
    if (cols.length < 5) {
      throw new Error(`${filename} line ${index + 1}: does not contain timestamp/open/high/low/close.`)
    }

    const time = parseExchangeTimestamp(cols[0])
    const open = Number(cols[1])
    const high = Number(cols[2])
    const low = Number(cols[3])
    const close = Number(cols[4])

    if ([open, high, low, close].some(value => !Number.isFinite(value))) {
      throw new Error(`${filename} line ${index + 1}: contains invalid OHLC values.`)
    }

    return {
      time,
      open: String(open),
      high: String(high),
      low: String(low),
      close: String(close),
    }
  })

  if (rows.length !== OFFICIAL_ROW_COUNT) {
    throw new Error(`${filename}: expected ${OFFICIAL_ROW_COUNT} rows, got ${rows.length}.`)
  }

  return rows
}
