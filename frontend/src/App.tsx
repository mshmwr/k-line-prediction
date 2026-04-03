import { useMemo, useState } from 'react'
import { OHLCRow, MatchCase, OrderSuggestion, PredictStats } from './types'
import { OHLCEditor } from './components/OHLCEditor'
import { TopBar } from './components/TopBar'
import { PredictButton } from './components/PredictButton'
import { MatchList } from './components/MatchList'
import { StatsPanel } from './components/StatsPanel'
import { MainChart } from './components/MainChart'
import { usePrediction } from './hooks/usePrediction'

const TIMEFRAME = '1H' as const
const OFFICIAL_ROW_COUNT = 24
const OFFICIAL_INPUT_UTC_OFFSET_HOURS = 8

type TrendOverride = 'up' | 'down' | 'flat'

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

  milliseconds += OFFICIAL_INPUT_UTC_OFFSET_HOURS * 60 * 60 * 1000

  const date = new Date(milliseconds)
  if (Number.isNaN(date.getTime())) throw new Error(`Unparseable timestamp: ${raw}`)

  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hour = String(date.getUTCHours()).padStart(2, '0')
  const minute = String(date.getUTCMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

function parseOfficialCsv(text: string): OHLCRow[] {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
  if (!lines.length) throw new Error('CSV is empty.')

  const rows = lines.map((line, index) => {
    const cols = line.split(',').map(col => col.trim())
    if (cols.length < 5) {
      throw new Error(`Line ${index + 1} does not contain timestamp/open/high/low/close.`)
    }

    const time = parseExchangeTimestamp(cols[0])
    const open = Number(cols[1])
    const high = Number(cols[2])
    const low = Number(cols[3])
    const close = Number(cols[4])

    if ([open, high, low, close].some(value => !Number.isFinite(value))) {
      throw new Error(`Line ${index + 1} contains invalid OHLC values.`)
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
    throw new Error(`Official input must contain exactly ${OFFICIAL_ROW_COUNT} rows, but received ${rows.length}.`)
  }

  return rows
}

function isRowComplete(row: OHLCRow): boolean {
  return Boolean(row.time) && (['open', 'high', 'low', 'close'] as const).every(
    field => row[field] !== '' && !Number.isNaN(Number(row[field]))
  )
}

function inferTrendOverride(rows: OHLCRow[]): TrendOverride {
  const completeRows = rows.filter(isRowComplete)
  if (completeRows.length < 4) return 'flat'

  const window = Math.min(6, Math.max(2, Math.floor(completeRows.length / 4)))
  const firstAvg = completeRows
    .slice(0, window)
    .reduce((sum, row) => sum + Number(row.close), 0) / window
  const lastAvg = completeRows
    .slice(-window)
    .reduce((sum, row) => sum + Number(row.close), 0) / window

  if (!Number.isFinite(firstAvg) || !Number.isFinite(lastAvg) || firstAvg === 0) return 'flat'
  const deltaPct = (lastAvg - firstAvg) / firstAvg
  if (deltaPct > 0.0015) return 'up'
  if (deltaPct < -0.0015) return 'down'
  return 'flat'
}

function buildOccurrenceWindow(barIndex: number, timeframe: string): string {
  return timeframe === '1D' ? `Day +${barIndex}` : `Hour +${barIndex}`
}

function buildProjectedSuggestion(
  label: string,
  price: number,
  pct: number,
  occurrenceBar: number,
  historicalTime: string,
): OrderSuggestion {
  return {
    label,
    price: Math.round(price * 100) / 100,
    pct: Math.round(pct * 100) / 100,
    occurrenceBar,
    occurrenceWindow: buildOccurrenceWindow(occurrenceBar, TIMEFRAME),
    historicalTime,
  }
}

function computeDisplayStats(matches: MatchCase[], projectedBars: Array<{ occurrenceBar: number; time: string; open: number; high: number; low: number; close: number }>, currentClose: number): PredictStats | null {
  if (projectedBars.length < 2) return null
  const sortedHighs = [...projectedBars].sort((a, b) => b.high - a.high)
  const sortedLows = [...projectedBars].sort((a, b) => a.low - b.low)
  const corrs = matches.map(match => match.correlation).filter((value): value is number => value != null)
  const wins = projectedBars.filter(bar => bar.close > currentClose)

  return {
    highest: buildProjectedSuggestion('Highest', sortedHighs[0].high, (sortedHighs[0].high - currentClose) / currentClose, sortedHighs[0].occurrenceBar, 'Consensus'),
    secondHighest: buildProjectedSuggestion('Second Highest', sortedHighs[1].high, (sortedHighs[1].high - currentClose) / currentClose, sortedHighs[1].occurrenceBar, 'Consensus'),
    secondLowest: buildProjectedSuggestion('Second Lowest', sortedLows[1].low, (sortedLows[1].low - currentClose) / currentClose, sortedLows[1].occurrenceBar, 'Consensus'),
    lowest: buildProjectedSuggestion('Lowest', sortedLows[0].low, (sortedLows[0].low - currentClose) / currentClose, sortedLows[0].occurrenceBar, 'Consensus'),
    winRate: wins.length / projectedBars.length,
    meanCorrelation: corrs.length > 0 ? corrs.reduce((a, b) => a + b, 0) / corrs.length : 0,
  }
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function computeProjectedFutureBars(matches: MatchCase[], currentClose: number) {
  return Array.from({ length: 24 }, (_, index) => {
    const projected = matches.flatMap(match => {
      const base = match.historicalOhlc[match.historicalOhlc.length - 1]?.close
      const bar = match.futureOhlc[index]
      if (!base || !bar) return []
      return [{
        open: currentClose * (bar.open / base),
        high: currentClose * (bar.high / base),
        low: currentClose * (bar.low / base),
        close: currentClose * (bar.close / base),
      }]
    })

    if (projected.length === 0) return null

    const open = median(projected.map(bar => bar.open))
    const close = median(projected.map(bar => bar.close))
    const high = Math.max(median(projected.map(bar => bar.high)), open, close)
    const low = Math.min(median(projected.map(bar => bar.low)), open, close)

    return {
      occurrenceBar: index + 1,
      time: `Hour +${index + 1}`,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
    }
  }).filter((bar): bar is { occurrenceBar: number; time: string; open: number; high: number; low: number; close: number } => bar != null)
}

export default function App() {
  const [ohlcData, setOhlcData] = useState<OHLCRow[]>(() => emptyRows(OFFICIAL_ROW_COUNT))
  const [matches, setMatches] = useState<MatchCase[]>([])
  const [tempSelection, setTempSelection] = useState<Set<string>>(new Set())
  const [appliedSelection, setAppliedSelection] = useState<Set<string>>(new Set())
  const [appliedData, setAppliedData] = useState<{ matches: MatchCase[]; stats: PredictStats | null; inputs: OHLCRow[] }>({
    matches: [], stats: null, inputs: []
  })
  const [loadError, setLoadError] = useState<string | null>(null)
  const [sourcePath, setSourcePath] = useState('No file uploaded yet.')
  const { predict, loading, error: predictionError } = usePrediction()

  const ohlcComplete = useMemo(() => ohlcData.every(isRowComplete), [ohlcData])
  const hasSelection = tempSelection.size > 0
  const errorMessage = loadError ?? predictionError
  const trendOverride = useMemo(() => inferTrendOverride(ohlcData), [ohlcData])

  const disabledReason = useMemo(() => {
    if (!ohlcComplete) return 'ohlcIncomplete' as const
    if (matches.length > 0 && !hasSelection) return 'noSelection' as const
    return null
  }, [ohlcComplete, hasSelection, matches.length])

  const displayStats = useMemo(() => {
    if (!appliedData.stats) return null
    const activeMatches = appliedData.matches.filter(m => appliedSelection.has(m.id))
    if (activeMatches.length === 0) return appliedData.stats
    const currentClose = Number(appliedData.inputs[appliedData.inputs.length - 1]?.close) || 0
    const projectedBars = computeProjectedFutureBars(activeMatches, currentClose)
    return computeDisplayStats(activeMatches, projectedBars, currentClose) ?? appliedData.stats
  }, [appliedData, appliedSelection])

  const projectedFutureBars = useMemo(() => {
    if (!appliedData.stats) return []
    const activeMatches = appliedData.matches.filter(m => appliedSelection.has(m.id))
    if (activeMatches.length === 0) return []
    const currentClose = Number(appliedData.inputs[appliedData.inputs.length - 1]?.close) || 0
    return computeProjectedFutureBars(activeMatches, currentClose)
  }, [appliedData, appliedSelection])

  const isDirty = useMemo(() => {
    if (!appliedData.stats) return false
    if (appliedSelection.size !== tempSelection.size) return true
    for (const id of tempSelection) if (!appliedSelection.has(id)) return true
    return false
  }, [tempSelection, appliedSelection, appliedData.stats])

  function resetPredictionState() {
    setMatches([])
    setTempSelection(new Set())
    setAppliedSelection(new Set())
    setAppliedData({ matches: [], stats: null, inputs: [] })
  }

  function handleOfficialFileUpload(file: File) {
    setLoadError(null)
    const reader = new FileReader()

    reader.onload = event => {
      try {
        const text = String(event.target?.result ?? '')
        const rows = parseOfficialCsv(text)
        setOhlcData(rows)
        setSourcePath(file.name)
        resetPredictionState()
      } catch (error) {
        setLoadError((error as Error).message)
      }
    }

    reader.onerror = () => {
      setLoadError('Failed to read the uploaded CSV file.')
    }

    reader.readAsText(file)
  }

  function handleCellChange(rowIdx: number, field: keyof OHLCRow, value: string) {
    setOhlcData(prev => prev.map((row, index) => index === rowIdx ? { ...row, [field]: value } : row))
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

    const result = await predict(ohlcData, [], TIMEFRAME, trendOverride)
    if (!result) return

    const allIds = new Set(result.matches.map(m => m.id))
    setMatches(result.matches)
    setTempSelection(allIds)
    setAppliedSelection(allIds)
    setAppliedData({ matches: result.matches, stats: result.stats, inputs: ohlcData })
  }

  return (
    <div className="h-screen bg-gray-950 text-gray-100 flex flex-col overflow-hidden">
      <TopBar rowCount={ohlcData.filter(isRowComplete).length} />
      {errorMessage && (
        <div className="mx-4 mt-1 text-red-400 text-xs border border-red-700 rounded px-3 py-1.5 bg-red-950 flex-shrink-0">
          ✗ {errorMessage}
        </div>
      )}
      <div className="flex flex-1 gap-4 px-4 pb-4 pt-3 min-h-0">
        <div className="w-80 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2 pb-20">
          <div className="rounded border border-gray-700 bg-gray-900/70 p-3 flex flex-col gap-2">
            <div className="text-xs uppercase tracking-wider text-gray-400">Official Input</div>
            <div className="rounded border border-gray-700 bg-gray-950/70 p-2 text-xs text-gray-300">
              <div className="text-gray-500">Source file</div>
              <div className="mt-1 break-all font-mono text-[11px]">{sourcePath || 'Loading...'}</div>
            </div>
            <label className="flex cursor-pointer items-center justify-center rounded border border-dashed border-gray-600 px-3 py-4 text-center text-xs text-gray-300 transition-colors hover:border-orange-400 hover:text-white">
              Upload official 1H CSV
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={event => {
                  const file = event.target.files?.[0]
                  if (file) handleOfficialFileUpload(file)
                  event.currentTarget.value = ''
                }}
              />
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded border border-gray-700 bg-gray-950/70 px-2 py-2">
                <div className="text-gray-500">Expected format</div>
                <div className="mt-1 text-gray-200">24 x 1H bars, source timestamps in UTC+0</div>
              </div>
              <div className="rounded border border-gray-700 bg-gray-950/70 px-2 py-2">
                <div className="text-gray-500">Displayed timezone</div>
                <div className="mt-1 text-gray-200">UTC+8</div>
              </div>
            </div>
            <p className="text-[11px] leading-4 text-gray-500">
              Screenshot OCR flow has been removed. Upload the official one-day ETHUSDT 1H CSV here; the app will convert source timestamps from UTC+0 to UTC+8, then use that same data for the table, chart, and prediction flow.
            </p>
          </div>

          <OHLCEditor rows={ohlcData} timeframe={TIMEFRAME} onChange={handleCellChange} />

          <div className="h-[360px]">
            <MainChart key={TIMEFRAME} userOhlc={ohlcData} timeframe={TIMEFRAME} />
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
            <MatchList matches={matches} selected={tempSelection} onToggle={handleToggle} timeframe={TIMEFRAME} />
          </div>
          <div className="max-h-[48vh] flex-shrink-0 overflow-y-auto pr-1">
            <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Statistics</h3>
            <StatsPanel
              stats={displayStats}
              projectedFutureBars={projectedFutureBars}
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
