import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { OHLCRow, MatchCase, PredictStats, DayStats, Ma99Gap } from './types'
import { OHLCEditor } from './components/OHLCEditor'
import { TopBar } from './components/TopBar'
import { PredictButton } from './components/PredictButton'
import { MatchList } from './components/MatchList'
import { StatsPanel } from './components/StatsPanel'
import { MainChart } from './components/MainChart'
import { usePrediction } from './hooks/usePrediction'
import {
  aggregateProjectedBarsTo1D,
  aggregateRowsTo1D,
  ProjectionBar,
  toDisplayMatch,
} from './utils/aggregation'
import { computeStatsFromMatches } from './utils/statsComputation'
import { API_BASE } from './utils/api'
import { trackDemoStarted, trackCsvUploaded, trackMatchRun, trackResultViewed } from './utils/analytics'
const OFFICIAL_ROW_COUNT = 24

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

function isRowComplete(row: OHLCRow): boolean {
  return Boolean(row.time) && (['open', 'high', 'low', 'close'] as const).every(
    field => row[field] !== '' && !Number.isNaN(Number(row[field]))
  )
}

function computeStatsByDay(projectedBars: Array<{ time: string; high: number; low: number }>, currentClose: number): DayStats[] {
  // Group bars by UTC+8 calendar date (MM/DD from "MM/DD HH:MM"), preserving chronological order.
  // Falls back to position-based grouping when bars lack a date label.
  const orderedDates: string[] = []
  const dateMap = new Map<string, Array<{ time: string; high: number; low: number }>>()
  projectedBars.forEach((bar, i) => {
    const date = /^\d{2}\/\d{2}/.test(bar.time) ? bar.time.substring(0, 5) : String(Math.floor(i / 24))
    if (!dateMap.has(date)) {
      orderedDates.push(date)
      dateMap.set(date, [])
    }
    dateMap.get(date)!.push(bar)
  })

  return orderedDates.slice(0, 3).map((date, dayIndex) => {
    const dayBars = dateMap.get(date)!
    const sortedHighs = [...dayBars].sort((a, b) => b.high - a.high)
    const sortedLows = [...dayBars].sort((a, b) => a.low - b.low)
    return {
      label: `Day ${dayIndex + 1}`,
      highest: {
        price: Math.round(sortedHighs[0].high * 100) / 100,
        pct: Math.round(((sortedHighs[0].high - currentClose) / currentClose) * 10000) / 100,
        time: sortedHighs[0].time,
      },
      lowest: {
        price: Math.round(sortedLows[0].low * 100) / 100,
        pct: Math.round(((sortedLows[0].low - currentClose) / currentClose) * 10000) / 100,
        time: sortedLows[0].time,
      },
    }
  })
}

export default function AppPage() {
  type HistoryEntry = { filename: string; latest: string | null; bar_count: number }
  type HistoryInfo = { '1H': HistoryEntry; '1D': HistoryEntry }

  const [ohlcData, setOhlcData] = useState<OHLCRow[]>(() => emptyRows(48))
  const [viewTimeframe, setViewTimeframe] = useState<'1H' | '1D'>('1H')
  const [matches, setMatches] = useState<MatchCase[]>([])
  const [queryMa99, setQueryMa99] = useState<(number | null)[]>([])
  const [queryMa99Gap, setQueryMa99Gap] = useState<Ma99Gap | null>(null)
  const [tempSelection, setTempSelection] = useState<Set<string>>(new Set())
  const [appliedSelection, setAppliedSelection] = useState<Set<string>>(new Set())
  const [appliedData, setAppliedData] = useState<{ matches: MatchCase[]; stats: PredictStats | null; inputs: OHLCRow[] }>({
    matches: [], stats: null, inputs: []
  })
  const [loadError, setLoadError] = useState<string | null>(null)
  const [sourcePath, setSourcePath] = useState('No file uploaded yet.')
  const [maLoading, setMaLoading] = useState(false)
  const [historyInfo, setHistoryInfo] = useState<HistoryInfo | null>(null)
  const { predict, computeMa99, loading, error: predictionError } = usePrediction()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    fetch(`${API_BASE}/api/history-info`)
      .then(r => r.json())
      .then(data => setHistoryInfo(data as HistoryInfo))
      .catch(() => {})
  }, [])

  // K-057 Phase 2 — `/app?sample=ethusdt` auto-load.
  // Fetches the bundled `/examples/ETHUSDT_1h_test.csv`, parses via the
  // shared `parseOfficialCsvFile` (K-046 Sacred — bit-exact backend contract),
  // then mirrors the post-upload flow from `handleOfficialFilesUpload` so the
  // sample row set, MA99 series, and source-path label all match what a real
  // CSV upload would produce. Runs once on mount when the query param is set.
  useEffect(() => {
    if (searchParams.get('sample') !== 'ethusdt') return
    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch('/examples/ETHUSDT_1h_test.csv')
        if (!response.ok) throw new Error(`Sample fetch failed: HTTP ${response.status}`)
        const text = await response.text()
        const rows = parseOfficialCsvFile(text, 'ETHUSDT_1h_test.csv')
        if (cancelled) return
        const nextApiRows = viewTimeframe === '1D' ? aggregateRowsTo1D(rows) : rows
        setOhlcData(rows)
        setSourcePath('ETHUSDT_1h_test.csv (sample)')
        trackDemoStarted()
        resetPredictionState()
        setQueryMa99([])
        setQueryMa99Gap(null)
        setMaLoading(true)
        try {
          const ma99Result = await computeMa99(nextApiRows, viewTimeframe)
          if (cancelled) return
          setQueryMa99(viewTimeframe === '1D' ? (ma99Result.queryMa991d ?? []) : (ma99Result.queryMa991h ?? []))
          setQueryMa99Gap(viewTimeframe === '1D' ? (ma99Result.queryMa99Gap1d ?? null) : (ma99Result.queryMa99Gap1h ?? null))
        } catch (err) {
          if (!cancelled) setLoadError((err as Error).message)
        } finally {
          if (!cancelled) setMaLoading(false)
        }
      } catch (err) {
        if (!cancelled) setLoadError((err as Error).message)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ohlcComplete = useMemo(() => ohlcData.every(isRowComplete), [ohlcData])
  const hasSelection = tempSelection.size > 0
  const errorMessage = loadError ?? predictionError
  const completedRows = useMemo(() => ohlcData.filter(isRowComplete), [ohlcData])
  const apiRows = useMemo(
    () => (viewTimeframe === '1D' ? aggregateRowsTo1D(completedRows) : completedRows),
    [completedRows, viewTimeframe],
  )
  const displayMatches = useMemo(
    () => matches.map(match => toDisplayMatch(match)),
    [matches],
  )

  const disabledReason = useMemo(() => {
    if (maLoading) return 'maLoading' as const
    if (!ohlcComplete) return 'ohlcIncomplete' as const
    if (matches.length > 0 && !hasSelection) return 'noSelection' as const
    return null
  }, [maLoading, ohlcComplete, hasSelection, matches.length])

  // K-013 (TD-008 Option C): full-set stats come from backend
  // (`appliedData.stats`, the authoritative baseline); subset stats come from
  // the shared `statsComputation` util which is locked bit-exact to the
  // backend via `backend/tests/fixtures/stats_contract_cases.json`. We derive
  // `projectedFutureBars` once and reuse it for (a) StatsPanel consensus
  // charts (subset branch only, full branch preserves backend's pre-existing
  // empty consensus arrays — see KG-013-01) and (b) `displayStatsByDay`.
  const workspace = useMemo<{
    projectedFutureBars: ProjectionBar[]
    projectedFutureBars1D: ProjectionBar[]
    displayStats: PredictStats | null
  }>(() => {
    const emptyResult = { projectedFutureBars: [], projectedFutureBars1D: [], displayStats: null as PredictStats | null }
    if (!appliedData.stats) return emptyResult

    const activeMatches = appliedData.matches.filter(m => appliedSelection.has(m.id))
    if (activeMatches.length === 0) {
      return { ...emptyResult, displayStats: appliedData.stats }
    }

    const currentClose = Number(appliedData.inputs[appliedData.inputs.length - 1]?.close) || 0
    const lastBarTime = appliedData.inputs[appliedData.inputs.length - 1]?.time
    const isFullSet = activeMatches.length === appliedData.matches.length

    try {
      const { stats: subsetStats, projectedFutureBars } = computeStatsFromMatches(
        activeMatches,
        currentClose,
        viewTimeframe,
        lastBarTime,
      )
      const projectedFutureBars1D =
        viewTimeframe === '1H' ? aggregateProjectedBarsTo1D(projectedFutureBars) : []

      // Full set -> defer to backend baseline stats (AC-013-APPPAGE line 1),
      //             BUT still inject consensus bars so the ConsensusForecastChart
      //             renders (matching OLD behavior at base `b0212bb` — OLD
      //             unconditionally injected consensusForecast1h/1d regardless of
      //             full-set vs subset; Round 1 regression ate the chart).
      // Subset   -> merge util stats with consensus bars for chart render.
      const displayStats: PredictStats = {
        ...(isFullSet ? appliedData.stats : subsetStats),
        consensusForecast1h: projectedFutureBars,
        consensusForecast1d: projectedFutureBars1D,
      }

      return { projectedFutureBars, projectedFutureBars1D, displayStats }
    } catch {
      // Error contract: when util throws (e.g. projectedFutureBars.length < 2
      // or currentClose invalid), fall back to backend baseline and skip
      // consensus chart / day-stats rendering — same behaviour as before the
      // refactor (`if (!computed) return appliedData.stats`).
      if (import.meta.env.DEV) {
        console.warn('[K-013] Consensus fallback path triggered: projectedFutureBars.length < 2 (or util threw)')
      }
      return { ...emptyResult, displayStats: appliedData.stats }
    }
  }, [appliedData, appliedSelection, viewTimeframe])

  const projectedFutureBars = workspace.projectedFutureBars
  const projectedFutureBars1D = workspace.projectedFutureBars1D
  const displayStats = workspace.displayStats

  const displayStatsByDay = useMemo(() => {
    if (viewTimeframe === '1D') return []
    if (projectedFutureBars.length === 0) return []
    const currentClose = Number(appliedData.inputs[appliedData.inputs.length - 1]?.close) || 0
    return computeStatsByDay(projectedFutureBars, currentClose)
  }, [projectedFutureBars, appliedData.inputs, viewTimeframe])

  const isDirty = useMemo(() => {
    if (!appliedData.stats) return false
    if (appliedSelection.size !== tempSelection.size) return true
    for (const id of tempSelection) if (!appliedSelection.has(id)) return true
    return false
  }, [tempSelection, appliedSelection, appliedData.stats])

  function resetPredictionState() {
    setMatches([])
    setQueryMa99([])
    setQueryMa99Gap(null)
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
      }))
    ).then(async results => {
      const combined = results.flat().sort((a, b) => a.time.localeCompare(b.time))
      const nextApiRows = viewTimeframe === '1D' ? aggregateRowsTo1D(combined) : combined
      setOhlcData(combined)
      setSourcePath(fileList.map(f => f.name).join(' + '))
      trackCsvUploaded(combined.length)
      resetPredictionState()
      setQueryMa99([])
      setQueryMa99Gap(null)
      setMaLoading(true)
      try {
        const ma99Result = await computeMa99(nextApiRows, viewTimeframe)
        setQueryMa99(viewTimeframe === '1D' ? (ma99Result.queryMa991d ?? []) : (ma99Result.queryMa991h ?? []))
        setQueryMa99Gap(viewTimeframe === '1D' ? (ma99Result.queryMa99Gap1d ?? null) : (ma99Result.queryMa99Gap1h ?? null))
      } catch (err) {
        setLoadError((err as Error).message)
      } finally {
        setMaLoading(false)
      }
    }).catch(err => setLoadError((err as Error).message))
  }

  function handleCellChange(rowIdx: number, field: keyof OHLCRow, value: string) {
    setOhlcData(prev => prev.map((row, index) => index === rowIdx ? { ...row, [field]: value } : row))
  }

  async function handleTimeframeChange(nextTimeframe: '1H' | '1D') {
    if (nextTimeframe === viewTimeframe) return
    setViewTimeframe(nextTimeframe)
    resetPredictionState()
    setLoadError(null)
    setQueryMa99([])
    setQueryMa99Gap(null)
    if (!ohlcComplete) return
    const nextApiRows = nextTimeframe === '1D' ? aggregateRowsTo1D(completedRows) : completedRows
    setMaLoading(true)
    try {
      const ma99Result = await computeMa99(nextApiRows, nextTimeframe)
      setQueryMa99(nextTimeframe === '1D' ? (ma99Result.queryMa991d ?? []) : (ma99Result.queryMa991h ?? []))
      setQueryMa99Gap(nextTimeframe === '1D' ? (ma99Result.queryMa99Gap1d ?? null) : (ma99Result.queryMa99Gap1h ?? null))
    } catch (err) {
      setLoadError((err as Error).message)
    } finally {
      setMaLoading(false)
    }
  }

  function handleToggle(id: string) {
    setTempSelection(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handlePredict() {
    const inputsChanged = JSON.stringify(apiRows) !== JSON.stringify(appliedData.inputs)
    if (!inputsChanged && appliedData.stats) {
      setAppliedSelection(new Set(tempSelection))
      return
    }

    const result = await predict(apiRows, [], viewTimeframe)
    if (!result) return
    trackMatchRun(result.matches.length)
    if (result.matches.length > 0) trackResultViewed(result.matches.length)

    const allIds = new Set(result.matches.map(m => m.id))
    setMatches(result.matches)
    setQueryMa99(viewTimeframe === '1D' ? (result.queryMa991d ?? []) : (result.queryMa991h ?? []))
    setQueryMa99Gap(viewTimeframe === '1D' ? (result.queryMa99Gap1d ?? null) : (result.queryMa99Gap1h ?? null))
    setTempSelection(allIds)
    setAppliedSelection(allIds)
    setAppliedData({ matches: result.matches, stats: result.stats, inputs: apiRows })
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-950 text-gray-100">
      <TopBar rowCount={ohlcData.filter(isRowComplete).length} />
      {errorMessage && (
        <div data-testid="error-toast" className="mx-4 mt-1 text-red-400 text-xs border border-red-700 rounded px-3 py-1.5 bg-red-950 flex-shrink-0">
          ✗ {errorMessage}
        </div>
      )}
      <div className="flex flex-1 gap-4 px-4 pb-4 pt-3 min-h-0">
        <div className="w-80 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2 pb-20">
          <div data-testid="official-input-section" className="rounded border border-gray-700 bg-gray-900/70 p-3 flex flex-col gap-2">
            <div className="text-xs uppercase tracking-wider text-gray-400">Official Input</div>
            <div className="rounded border border-gray-700 bg-gray-950/70 p-2 text-xs text-gray-300">
              <div className="text-gray-500">Source file</div>
              <div className="mt-1 break-all font-mono text-[11px]">{sourcePath || 'No file uploaded yet.'}</div>
            </div>
            <label className="flex cursor-pointer items-center justify-center rounded border border-dashed border-gray-600 px-3 py-4 text-center text-xs text-gray-300 transition-colors hover:border-orange-400 hover:text-white">
              Upload 1H CSV (multi-select)
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
              <div data-testid="official-input-expected-format" className="rounded border border-gray-700 bg-gray-950/70 px-2 py-2">
                <div className="text-gray-500">Expected format</div>
                <div className="mt-1 text-gray-200">Merged multi-file · 24 x 1H bars per file · UTC+0</div>
                <a
                  href="/examples/ETHUSDT_1h_test.csv"
                  download="ETHUSDT_1h_test.csv"
                  className="mt-1 inline-block text-xs text-gray-400 hover:text-blue-400"
                >
                  Don't have a CSV? Download example →
                </a>
              </div>
              <div className="rounded border border-gray-700 bg-gray-950/70 px-2 py-2">
                <div className="text-gray-500">Displayed timezone</div>
                <div className="mt-1 text-gray-200">UTC+8</div>
              </div>
            </div>
          </div>

          <div data-testid="history-reference-section" className="rounded border border-gray-700 bg-gray-900/70 p-3 flex flex-col gap-2">
            <div className="text-xs uppercase tracking-wider text-gray-400">History Reference</div>
            <div className="rounded border border-gray-700 bg-gray-950/70 p-2 text-xs text-gray-300 font-mono">
              {historyInfo
                ? `${historyInfo['1H'].filename} (latest: ${historyInfo['1H'].latest ?? 'N/A'} UTC+0)`
                : 'Loading...'}
            </div>
          </div>

          <OHLCEditor rows={ohlcData} timeframe={'1H'} onChange={handleCellChange} />

          <div className="h-[360px]">
            <MainChart
              key={viewTimeframe}
              userOhlc={apiRows}
              timeframe={viewTimeframe}
              ma99Values={queryMa99}
              ma99Gap={queryMa99Gap}
              maLoading={maLoading}
              onTimeframeChange={handleTimeframeChange}
            />
          </div>

          <div className="sticky bottom-0 z-10 mt-auto bg-gray-950 pt-2 pb-1">
            <PredictButton
              disabled={!!disabledReason}
              disabledReason={disabledReason}
              onClick={handlePredict}
              loading={loading}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
          <div className="flex-1 min-h-[260px] flex flex-col overflow-hidden">
            <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-wider flex-shrink-0">Match List</h3>
            <MatchList matches={displayMatches} selected={tempSelection} onToggle={handleToggle} timeframe={viewTimeframe} />
          </div>
          <div className="max-h-[48vh] flex-shrink-0 overflow-y-auto pr-1">
            <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Statistics</h3>
            <StatsPanel
              stats={displayStats}
              dayStats={displayStatsByDay}
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
