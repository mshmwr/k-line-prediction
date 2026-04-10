import { useEffect, useMemo, useState } from 'react'
import { OHLCEditor } from './components/OHLCEditor'
import { TopBar } from './components/TopBar'
import { PredictButton } from './components/PredictButton'
import { MatchList } from './components/MatchList'
import { StatsPanel } from './components/StatsPanel'
import { MainChart } from './components/MainChart'
import { usePrediction } from './hooks/usePrediction'
import { DayStats, Ma99Gap, MatchCase, OHLCRow, PredictStats } from './types'
import { toUTC8Display } from './utils/time'

const TIMEFRAME = '1H' as const
const OFFICIAL_ROW_COUNT = 24

type TrendOverride = 'up' | 'down' | 'flat'
type DisplayMode = '1H' | '1D'

function emptyRows(count: number): OHLCRow[] {
  return Array.from({ length: count }, () => ({ open: '', high: '', low: '', close: '', time: '' }))
}

function parseExchangeTimestamp(rawValue: string): string {
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

function parseOfficialCsvFile(text: string, filename: string): OHLCRow[] {
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

    return { time, open: String(open), high: String(high), low: String(low), close: String(close) }
  })

  if (rows.length !== OFFICIAL_ROW_COUNT) {
    throw new Error(`${filename}: expected ${OFFICIAL_ROW_COUNT} rows, got ${rows.length}.`)
  }

  return rows
}

function isRowComplete(row: OHLCRow): boolean {
  return Boolean(row.time) && (['open', 'high', 'low', 'close'] as const).every(
    field => row[field] !== '' && !Number.isNaN(Number(row[field])),
  )
}

function inferMa99TrendOverride(ma99Values: (number | null)[]): TrendOverride {
  const valid = ma99Values.filter((v): v is number => v !== null)
  if (valid.length < 2) return 'flat'
  const delta = valid[valid.length - 1] - valid[0]
  if (delta > 0.01) return 'up'
  if (delta < -0.01) return 'down'
  return 'flat'
}

function aggregateRowsTo1D(rows: OHLCRow[]): OHLCRow[] {
  const completed = rows.filter(isRowComplete)
  const byDay = new Map<string, OHLCRow[]>()
  completed.forEach(row => {
    const day = row.time.slice(0, 10)
    const dayRows = byDay.get(day) ?? []
    dayRows.push(row)
    byDay.set(day, dayRows)
  })
  return [...byDay.entries()].map(([day, dayRows]) => {
    const opens = dayRows[0]
    const closes = dayRows[dayRows.length - 1]
    const highs = Math.max(...dayRows.map(row => Number(row.high)))
    const lows = Math.min(...dayRows.map(row => Number(row.low)))
    return {
      time: day,
      open: opens.open,
      high: String(highs),
      low: String(lows),
      close: closes.close,
    }
  })
}

function computeStatsByDay(stats: PredictStats | null, currentClose: number): DayStats[] {
  if (!stats?.consensusForecast1h?.length) return []
  const grouped = new Map<string, typeof stats.consensusForecast1h>()
  stats.consensusForecast1h.forEach(bar => {
    const display = toUTC8Display(bar.time)
    const key = display ? display.slice(0, 10) : bar.time.slice(0, 10)
    const entries = grouped.get(key) ?? []
    entries.push(bar)
    grouped.set(key, entries)
  })

  return [...grouped.entries()].slice(0, 3).map(([_, bars], index) => {
    const highest = [...bars].sort((a, b) => b.high - a.high)[0]
    const lowest = [...bars].sort((a, b) => a.low - b.low)[0]
    return {
      label: `Day ${index + 1}`,
      highest: {
        price: highest.high,
        pct: ((highest.high - currentClose) / currentClose) * 100,
        time: toUTC8Display(highest.time),
      },
      lowest: {
        price: lowest.low,
        pct: ((lowest.low - currentClose) / currentClose) * 100,
        time: toUTC8Display(lowest.time),
      },
    }
  })
}

export default function App() {
  type HistoryEntry = { filename: string; latest: string | null; bar_count: number }
  type HistoryInfo = { '1H': HistoryEntry; '1D': HistoryEntry }

  const [displayMode, setDisplayMode] = useState<DisplayMode>('1H')
  const [ohlcData, setOhlcData] = useState<OHLCRow[]>(() => emptyRows(48))
  const [matches, setMatches] = useState<MatchCase[]>([])
  const [queryMa991h, setQueryMa991h] = useState<(number | null)[]>([])
  const [queryMa991d, setQueryMa991d] = useState<(number | null)[]>([])
  const [queryMa99Gap1h, setQueryMa99Gap1h] = useState<Ma99Gap | null>(null)
  const [queryMa99Gap1d, setQueryMa99Gap1d] = useState<Ma99Gap | null>(null)
  const [tempSelection, setTempSelection] = useState<Set<string>>(new Set())
  const [appliedSelection, setAppliedSelection] = useState<Set<string>>(new Set())
  const [appliedData, setAppliedData] = useState<{ matches: MatchCase[]; stats: PredictStats | null; inputs: OHLCRow[] }>({ matches: [], stats: null, inputs: [] })
  const [loadError, setLoadError] = useState<string | null>(null)
  const [sourcePath, setSourcePath] = useState('No file uploaded yet.')
  const [maLoading, setMaLoading] = useState(false)
  const [historyInfo, setHistoryInfo] = useState<HistoryInfo | null>(null)
  const [lastHistoryUpload, setLastHistoryUpload] = useState<{ filename: string; latest: string | null; barCount: number; addedCount: number } | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const { predict, computeMa99, loading, error: predictionError } = usePrediction()

  useEffect(() => {
    fetch('/api/history-info')
      .then(r => r.json())
      .then(data => setHistoryInfo(data as HistoryInfo))
      .catch(() => {})
  }, [])

  const ohlcComplete = useMemo(() => ohlcData.every(isRowComplete), [ohlcData])
  const hasSelection = tempSelection.size > 0
  const errorMessage = loadError ?? predictionError
  const currentClose = Number(appliedData.inputs[appliedData.inputs.length - 1]?.close) || 0

  const disabledReason = useMemo(() => {
    if (maLoading) return 'maLoading' as const
    if (!ohlcComplete) return 'ohlcIncomplete' as const
    if (matches.length > 0 && !hasSelection) return 'noSelection' as const
    return null
  }, [maLoading, ohlcComplete, hasSelection, matches.length])

  const displayRows = useMemo(
    () => (displayMode === '1D' ? aggregateRowsTo1D(ohlcData) : ohlcData),
    [displayMode, ohlcData],
  )

  const displayMa99 = displayMode === '1D' ? queryMa991d : queryMa991h
  const displayMa99Gap = displayMode === '1D' ? queryMa99Gap1d : queryMa99Gap1h

  const dayStats = useMemo(() => computeStatsByDay(appliedData.stats, currentClose), [appliedData.stats, currentClose])

  const isDirty = useMemo(() => {
    if (!appliedData.stats) return false
    if (appliedSelection.size !== tempSelection.size) return true
    for (const id of tempSelection) {
      if (!appliedSelection.has(id)) return true
    }
    return false
  }, [tempSelection, appliedSelection, appliedData.stats])

  function resetPredictionState() {
    setMatches([])
    setQueryMa991h([])
    setQueryMa991d([])
    setQueryMa99Gap1h(null)
    setQueryMa99Gap1d(null)
    setTempSelection(new Set())
    setAppliedSelection(new Set())
    setAppliedData({ matches: [], stats: null, inputs: [] })
  }

  function handleOfficialFilesUpload(files: FileList) {
    setLoadError(null)
    const fileList = Array.from(files)
    Promise.all(
      fileList.map(file => new Promise<OHLCRow[]>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = e => {
          try {
            resolve(parseOfficialCsvFile(String(e.target?.result ?? ''), file.name))
          } catch (err) {
            reject(err)
          }
        }
        reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))
        reader.readAsText(file)
      })),
    ).then(async results => {
      const combined = results.flat().sort((a, b) => a.time.localeCompare(b.time))
      setOhlcData(combined)
      setSourcePath(fileList.map(f => f.name).join(' + '))
      resetPredictionState()
      setMaLoading(true)
      try {
        const ma99Result = await computeMa99(combined, TIMEFRAME)
        setQueryMa991h(ma99Result.queryMa991h)
        setQueryMa991d(ma99Result.queryMa991d)
        setQueryMa99Gap1h(ma99Result.queryMa99Gap1h)
        setQueryMa99Gap1d(ma99Result.queryMa99Gap1d)
      } catch (err) {
        setLoadError((err as Error).message)
      } finally {
        setMaLoading(false)
      }
    }).catch(err => setLoadError((err as Error).message))
  }

  function handleHistoryUpload(file: File) {
    setLastHistoryUpload(null)
    setUploadError(null)
    setUploadLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    fetch('/api/upload-history', { method: 'POST', body: formData })
      .then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(new Error(d.detail ?? 'Upload failed'))))
      .then(uploadResult => {
        setLastHistoryUpload({
          filename: file.name,
          latest: uploadResult.latest ?? null,
          barCount: uploadResult.bar_count ?? 0,
          addedCount: uploadResult.added_count ?? 0,
        })
        return fetch('/api/history-info').then(r => r.json())
      })
      .then(data => setHistoryInfo(data))
      .catch(err => setUploadError((err as Error).message))
      .finally(() => setUploadLoading(false))
  }

  function handleCellChange(rowIdx: number, field: keyof OHLCRow, value: string) {
    setOhlcData(prev => prev.map((row, index) => index === rowIdx ? { ...row, [field]: value } : row))
  }

  function handleTimeframeChange(nextTimeframe: '1H' | '1D') {
    setDisplayMode(nextTimeframe)
  }

  function handleToggle(id: string) {
    setTempSelection(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handlePredict() {
    const inputsChanged = JSON.stringify(ohlcData) !== JSON.stringify(appliedData.inputs)
    if (!inputsChanged && appliedData.stats) {
      setAppliedSelection(new Set(tempSelection))
      return
    }

    const ma99Trend = inferMa99TrendOverride(queryMa991d)
    const result = await predict(ohlcData, [], TIMEFRAME, ma99Trend)
    if (!result) return

    const allIds = new Set(result.matches.map(m => m.id))
    setMatches(result.matches)
    setQueryMa991h(result.queryMa991h)
    setQueryMa991d(result.queryMa991d)
    setQueryMa99Gap1h(result.queryMa99Gap1h)
    setQueryMa99Gap1d(result.queryMa99Gap1d)
    setTempSelection(allIds)
    setAppliedSelection(allIds)
    setAppliedData({ matches: result.matches, stats: result.stats, inputs: ohlcData })
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-950 text-gray-100">
      <TopBar rowCount={ohlcData.filter(isRowComplete).length} />
      {errorMessage && (
        <div className="mx-4 mt-1 flex-shrink-0 rounded border border-red-700 bg-red-950 px-3 py-1.5 text-xs text-red-400">
          ✗ {errorMessage}
        </div>
      )}
      <div className="flex flex-1 gap-4 px-4 pb-4 pt-3 min-h-0">
        <div className="flex w-80 min-h-0 flex-col gap-2 overflow-y-auto pr-1 pb-20">
          <div className="rounded border border-gray-700 bg-gray-900/70 p-3 flex flex-col gap-2">
            <div className="text-xs uppercase tracking-wider text-gray-400">Official Input</div>
            <div className="rounded border border-gray-700 bg-gray-950/70 p-2 text-xs text-gray-300">
              <div className="text-gray-500">Source file</div>
              <div className="mt-1 break-all font-mono text-[11px]">{sourcePath || 'No file uploaded yet.'}</div>
            </div>
            <label className="flex cursor-pointer items-center justify-center rounded border border-dashed border-gray-600 px-3 py-4 text-center text-xs text-gray-300 transition-colors hover:border-orange-400 hover:text-white">
              Upload 1H CSV（可多選）
              <input
                type="file"
                accept=".csv,text/csv"
                multiple
                className="hidden"
                onChange={event => {
                  const files = event.target.files
                  if (files && files.length > 0) handleOfficialFilesUpload(files)
                  event.currentTarget.value = ''
                }}
              />
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded border border-gray-700 bg-gray-950/70 px-2 py-2">
                <div className="text-gray-500">Expected format</div>
                <div className="mt-1 text-gray-200">多檔合併 · 每檔 24 × 1H bars · UTC+0</div>
              </div>
              <div className="rounded border border-gray-700 bg-gray-950/70 px-2 py-2">
                <div className="text-gray-500">Displayed timezone</div>
                <div className="mt-1 text-gray-200">UTC+8</div>
              </div>
            </div>
          </div>

          <div className="rounded border border-gray-700 bg-gray-900/70 p-3 flex flex-col gap-2">
            <div className="text-xs uppercase tracking-wider text-gray-400">History Reference</div>
            <div className="rounded border border-gray-700 bg-gray-950/70 p-2 text-xs text-gray-300 font-mono">
              {historyInfo ? `${historyInfo['1H'].filename}（最新：${historyInfo['1H'].latest ?? 'N/A'} UTC+0）` : 'Loading...'}
            </div>
            <label className={`flex items-center justify-center rounded border border-dashed px-3 py-3 text-center text-xs transition-colors ${uploadLoading ? 'cursor-not-allowed border-gray-700 text-gray-500' : 'cursor-pointer border-gray-600 text-gray-300 hover:border-blue-400 hover:text-white'}`}>
              <span className="flex flex-col items-center gap-0.5">
                <span>{uploadLoading ? '上傳中…' : 'Upload History CSV'}</span>
                {!uploadLoading && <span className="text-[10px] text-gray-500">時間欄位須為 UTC+0</span>}
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                disabled={uploadLoading}
                onChange={event => {
                  const file = event.target.files?.[0]
                  if (file) handleHistoryUpload(file)
                  event.currentTarget.value = ''
                }}
              />
            </label>
            {lastHistoryUpload && (
              <div className={`flex items-start gap-1.5 rounded border px-2 py-1.5 text-[11px] ${lastHistoryUpload.addedCount === 0 ? 'border-gray-700 bg-gray-800/40 text-gray-400' : 'border-green-800 bg-green-950/40 text-green-400'}`}>
                <span className="mt-px shrink-0">{lastHistoryUpload.addedCount === 0 ? '–' : '✓'}</span>
                <div className="min-w-0">
                  <div className="break-all font-mono">{lastHistoryUpload.filename}</div>
                  <div className={`mt-0.5 ${lastHistoryUpload.addedCount === 0 ? 'text-gray-500' : 'text-green-600'}`}>
                    {lastHistoryUpload.addedCount === 0
                      ? `資料已是最新，無需更新（共 ${lastHistoryUpload.barCount} bars）`
                      : `新增 ${lastHistoryUpload.addedCount} bars · 共 ${lastHistoryUpload.barCount} bars · 最新 ${lastHistoryUpload.latest ?? 'N/A'} UTC+0`}
                  </div>
                </div>
              </div>
            )}
            {uploadError && (
              <div className="flex items-start gap-1.5 rounded border border-red-800 bg-red-950/40 px-2 py-1.5 text-[11px] text-red-400">
                <span className="mt-px shrink-0">✗</span>
                <div className="min-w-0 break-all">{uploadError}</div>
              </div>
            )}
          </div>

          <OHLCEditor rows={ohlcData} timeframe={'1H'} onChange={handleCellChange} />

          <div className="h-[360px]">
            <MainChart
              key={displayMode}
              userOhlc={displayRows}
              timeframe={displayMode}
              ma99Values={displayMa99}
              ma99Gap={displayMa99Gap}
              maLoading={maLoading}
              onTimeframeChange={handleTimeframeChange}
            />
          </div>

          <div className="sticky bottom-0 z-10 mt-auto bg-gray-950 pt-2 pb-1">
            <PredictButton disabled={!!disabledReason} disabledReason={disabledReason} onClick={handlePredict} loading={loading} />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 min-h-0 overflow-hidden">
          <div className="flex items-center justify-end gap-2">
            {(['1H', '1D'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setDisplayMode(mode)}
                className={`rounded border px-3 py-1 text-xs ${displayMode === mode ? 'border-orange-400 bg-orange-500/10 text-orange-300' : 'border-gray-700 text-gray-400'}`}
              >
                {mode}
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-[260px] flex flex-col overflow-hidden">
            <h3 className="mb-2 flex-shrink-0 text-sm uppercase tracking-wider text-gray-400">Match List</h3>
            <MatchList matches={matches} selected={tempSelection} onToggle={handleToggle} timeframe={displayMode} />
          </div>
          <div className="max-h-[48vh] flex-shrink-0 overflow-y-auto pr-1">
            <h3 className="mb-2 text-sm uppercase tracking-wider text-gray-400">Statistics</h3>
            <StatsPanel
              stats={appliedData.stats}
              dayStats={dayStats}
              isDirty={isDirty}
              selectedCount={appliedSelection.size}
              totalCount={matches.length}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
