import { OHLCRow } from '../types'

interface Props {
  rows: OHLCRow[]
  timeframe: '1H' | '1D'
  onChange: (rowIdx: number, field: keyof OHLCRow, value: string) => void
}

function isRowComplete(row: OHLCRow): boolean {
  return ['open', 'high', 'low', 'close'].every(
    f => row[f as keyof OHLCRow] !== '' && !isNaN(Number(row[f as keyof OHLCRow]))
  )
}

function toInputValue(time: string, timeframe: '1H' | '1D'): string {
  if (!time) return ''
  return timeframe === '1H' ? time.replace(' ', 'T') : time
}

function fromInputValue(value: string, timeframe: '1H' | '1D'): string {
  if (!value) return ''
  return timeframe === '1H' ? value.replace('T', ' ') : value
}

export function OHLCEditor({ rows, timeframe, onChange }: Props) {
  const filled = rows.filter(isRowComplete).length
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm text-yellow-400 font-mono mb-1">
        {filled}/{rows.length} rows filled
      </div>
      <div className="overflow-auto max-h-80">
        <table className="w-full text-xs text-gray-200">
          <thead>
            <tr className="text-gray-400 uppercase">
              {['#', 'Time', 'Open', 'High', 'Low', 'Close'].map(h => (
                <th key={h} className="px-2 py-1 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={isRowComplete(row) ? 'bg-gray-800' : 'bg-gray-900'}>
                <td className="px-2 py-1 text-gray-500">{i + 1}</td>
                <td className="px-1 py-0.5">
                  <input
                    type={timeframe === '1H' ? 'datetime-local' : 'date'}
                    className="w-40 bg-gray-700 text-gray-100 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-orange-400"
                    value={toInputValue(row.time, timeframe)}
                    onChange={e => onChange(i, 'time', fromInputValue(e.target.value, timeframe))}
                  />
                </td>
                {(['open', 'high', 'low', 'close'] as const).map(field => (
                  <td key={field} className="px-1 py-0.5">
                    <input
                      className="w-20 bg-gray-700 text-gray-100 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-orange-400"
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      value={row[field]}
                      onChange={e => onChange(i, field, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
