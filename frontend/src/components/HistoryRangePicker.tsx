import { useEffect, useState } from 'react'
import { OHLCRow } from '../types'
import { toUTC8Display, fromUTC8Input } from '../utils/time'

interface RangeInfo {
  earliest: string
  latest: string
  count: number
}

interface Props {
  onLoad: (rows: OHLCRow[], label: string) => Promise<void>
}

// "YYYY-MM-DD HH:MM" → "YYYY-MM-DDTHH:MM" (datetime-local value format)
function toInputValue(dbTs: string): string {
  return dbTs.replace(' ', 'T').slice(0, 16)
}

// "YYYY-MM-DDTHH:MM" → "YYYY-MM-DD HH:MM" (for display label)
function toDisplayLabel(inputVal: string): string {
  return inputVal.replace('T', ' ')
}

export function HistoryRangePicker({ onLoad }: Props) {
  const [rangeInfo, setRangeInfo] = useState<RangeInfo | null>(null)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [barCount, setBarCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/history/range-info')
      .then(r => r.json())
      .then((data: RangeInfo) => {
        setRangeInfo(data)
        // default to last 24 hours; compute window in UTC+0, then convert to UTC+8 for display
        const endDt = new Date(data.latest.replace(' ', 'T') + ':00Z')
        const startDt = new Date(endDt.getTime() - 23 * 3600000)
        const toUtc0Str = (d: Date) =>
          `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
        setStart(toInputValue(toUTC8Display(toUtc0Str(startDt))))
        setEnd(toInputValue(toUTC8Display(toUtc0Str(endDt))))
      })
      .catch(() => setError('Failed to load history range'))
  }, [])

  async function handleLoad() {
    if (!start || !end) return
    setLoading(true)
    setError(null)
    setBarCount(null)
    try {
      const startUtc0 = fromUTC8Input(toDisplayLabel(start))
      const endUtc0 = fromUTC8Input(toDisplayLabel(end))
      const params = new URLSearchParams({ start: startUtc0, end: endUtc0 })
      const res = await fetch(`/api/history/bars?${params}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { detail?: string }).detail ?? `HTTP ${res.status}`)
      }
      const data = await res.json() as { bars: OHLCRow[]; count: number }
      setBarCount(data.count)
      const label = `DB ${toDisplayLabel(start)} → ${toDisplayLabel(end)} (${data.count} bars)`
      await onLoad(data.bars, label)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const minVal = rangeInfo ? toInputValue(toUTC8Display(rangeInfo.earliest)) : ''
  const maxVal = rangeInfo ? toInputValue(toUTC8Display(rangeInfo.latest)) : ''
  const canLoad = !loading && !!start && !!end && start <= end

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-gray-500">
        {rangeInfo
          ? `Available: ${toUTC8Display(rangeInfo.earliest)} — ${toUTC8Display(rangeInfo.latest)} UTC+8 (${rangeInfo.count.toLocaleString()} bars)`
          : 'Loading…'}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-gray-400">Start (UTC+8)</label>
        <input
          type="datetime-local"
          value={start}
          min={minVal}
          max={maxVal}
          step="3600"
          onChange={e => setStart(e.target.value)}
          className="rounded border border-gray-600 bg-gray-950 px-2 py-1 text-xs text-gray-200 focus:border-orange-400 focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-gray-400">End (UTC+8)</label>
        <input
          type="datetime-local"
          value={end}
          min={start || minVal}
          max={maxVal}
          step="3600"
          onChange={e => setEnd(e.target.value)}
          className="rounded border border-gray-600 bg-gray-950 px-2 py-1 text-xs text-gray-200 focus:border-orange-400 focus:outline-none"
        />
      </div>

      {barCount !== null && !error && (
        <div className="text-xs text-green-400">{barCount} bars loaded</div>
      )}
      {error && (
        <div className="text-xs text-red-400">{error}</div>
      )}

      <button
        onClick={handleLoad}
        disabled={!canLoad}
        className="rounded bg-orange-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? 'Loading…' : 'Load & Analyze'}
      </button>
    </div>
  )
}
