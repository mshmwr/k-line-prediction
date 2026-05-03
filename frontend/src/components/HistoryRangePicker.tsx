import { useEffect, useState } from 'react'
import { OHLCRow } from '../types'

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
        // default to last 24 hours of available data
        const endVal = toInputValue(data.latest)
        const endDt = new Date(data.latest.replace(' ', 'T') + ':00Z')
        endDt.setUTCHours(endDt.getUTCHours() - 23)
        const startVal = endDt.toISOString().slice(0, 16)
        setStart(startVal)
        setEnd(endVal)
      })
      .catch(() => setError('Failed to load history range'))
  }, [])

  async function handleLoad() {
    if (!start || !end) return
    setLoading(true)
    setError(null)
    setBarCount(null)
    try {
      const params = new URLSearchParams({ start, end })
      const res = await fetch(`/api/history/bars?${params}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { detail?: string }).detail ?? `HTTP ${res.status}`)
      }
      const data = await res.json() as { bars: OHLCRow[]; count: number }
      setBarCount(data.count)
      const label = `DB ${toDisplayLabel(start)} → ${toDisplayLabel(end)} (${data.count} bars, UTC+0)`
      await onLoad(data.bars, label)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const minVal = rangeInfo ? toInputValue(rangeInfo.earliest) : ''
  const maxVal = rangeInfo ? toInputValue(rangeInfo.latest) : ''
  const canLoad = !loading && !!start && !!end && start <= end

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-gray-500">
        {rangeInfo
          ? `Available: ${rangeInfo.earliest} — ${rangeInfo.latest} UTC+0 (${rangeInfo.count.toLocaleString()} bars)`
          : 'Loading…'}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-gray-400">Start (UTC+0)</label>
        <input
          type="datetime-local"
          value={start}
          min={minVal}
          max={maxVal}
          onChange={e => setStart(e.target.value)}
          className="rounded border border-gray-600 bg-gray-950 px-2 py-1 text-xs text-gray-200 focus:border-orange-400 focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-gray-400">End (UTC+0)</label>
        <input
          type="datetime-local"
          value={end}
          min={start || minVal}
          max={maxVal}
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
