import { useState, useMemo } from 'react'
import axios from 'axios'
import { OHLCRow, MatchCase, PredictStats } from './types'
import { OHLCEditor } from './components/OHLCEditor'
import { TopBar } from './components/TopBar'
import { PredictButton } from './components/PredictButton'
import { MatchList } from './components/MatchList'
import { StatsPanel } from './components/StatsPanel'
import { MainChart } from './components/MainChart'
import { usePrediction } from './hooks/usePrediction'

function isRowComplete(row: OHLCRow): boolean {
  return (['open', 'high', 'low', 'close'] as const).every(
    f => row[f] !== '' && !isNaN(Number(row[f]))
  )
}

export default function App() {
  const [n, setN] = useState(5)
  const [ohlcData, setOhlcData] = useState<OHLCRow[]>(() =>
    Array.from({ length: 5 }, () => ({ open: '', high: '', low: '', close: '', time: '' }))
  )
  const [matches, setMatches] = useState<MatchCase[]>([])
  const [tempSelection, setTempSelection] = useState<Set<string>>(new Set())
  const [appliedSelection, setAppliedSelection] = useState<Set<string>>(new Set())
  const [appliedData, setAppliedData] = useState<{ matches: MatchCase[]; stats: PredictStats | null; inputs: OHLCRow[] }>({
    matches: [], stats: null, inputs: []
  })
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<'1H' | '1D'>('1H')
  const { predict, loading } = usePrediction()

  const ohlcComplete = useMemo(() => ohlcData.every(isRowComplete), [ohlcData])
  const hasSelection = tempSelection.size > 0

  const disabledReason = useMemo(() => {
    if (!ohlcComplete) return 'ohlcIncomplete' as const
    if (matches.length > 0 && !hasSelection) return 'noSelection' as const
    return null
  }, [ohlcComplete, hasSelection, matches.length])

  const displayStats = useMemo(() => {
    if (!appliedData.stats) return null
    const activeMatches = appliedData.matches.filter(m => appliedSelection.has(m.id))
    if (activeMatches.length === 0) return appliedData.stats
    const corrs = activeMatches.map(m => m.correlation).filter((v): v is number => v != null)
    const meanCorrelation = corrs.length > 0
      ? corrs.reduce((a, b) => a + b, 0) / corrs.length
      : appliedData.stats.meanCorrelation
    const wins = activeMatches.filter(m => {
      const hist = m.historicalOhlc
      const fut = m.futureOhlc
      if (!hist?.length || !fut?.length) return false
      return fut[fut.length - 1].close > hist[hist.length - 1].close
    })
    const winRate = wins.length / activeMatches.length
    const currentClose = Number(appliedData.inputs[appliedData.inputs.length - 1]?.close) || 0
    const pctChanges = activeMatches
      .filter(m => m.historicalOhlc?.length > 0 && m.futureOhlc?.length > 0)
      .map(m => {
        const base = m.historicalOhlc[m.historicalOhlc.length - 1].close
        const future = m.futureOhlc[m.futureOhlc.length - 1].close
        return (future - base) / base
      })
      .sort((a, b) => a - b)
    if (pctChanges.length === 0) return appliedData.stats
    const optPct = pctChanges[pctChanges.length - 1]
    const pesPct = pctChanges[0]
    const mid = Math.floor(pctChanges.length / 2)
    const basePct = pctChanges.length % 2 === 0
      ? (pctChanges[mid - 1] + pctChanges[mid]) / 2
      : pctChanges[mid]
    return {
      meanCorrelation,
      winRate,
      optimistic: Math.round(currentClose * (1 + optPct) * 100) / 100,
      baseline: Math.round(currentClose * (1 + basePct) * 100) / 100,
      pessimistic: Math.round(currentClose * (1 + pesPct) * 100) / 100,
      optimisticPct: Math.round(optPct * 10000) / 100,
      baselinePct: Math.round(basePct * 10000) / 100,
      pessimisticPct: Math.round(pesPct * 10000) / 100,
    }
  }, [appliedData, appliedSelection])

  const isDirty = useMemo(() => {
    if (!appliedData.stats) return false
    if (appliedSelection.size !== tempSelection.size) return true
    for (const id of tempSelection) if (!appliedSelection.has(id)) return true
    return false
  }, [tempSelection, appliedSelection, appliedData.stats])

  function handleFileUpload(file: File) {
    setUploadError(null)
    if (file.type.startsWith('image/')) {
      setUploadError('Image upload is not supported. Please upload a CSV file with columns: open, high, low, close.')
      return
    }
    if (!file.name.endsWith('.csv')) {
      setUploadError(`Unsupported file type: ${file.name}. Please upload a .csv file.`)
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.trim().split('\n').filter(l => l.trim())
        // Skip URL header line (CryptoDataDownload format)
        const headerLineIdx = lines[0].trim().startsWith('http') ? 1 : 0
        if (lines.length < headerLineIdx + 2) throw new Error('CSV must have a header row and at least one data row.')
        const headers = lines[headerLineIdx].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
        const oIdx = headers.findIndex(h => h === 'open')
        const hIdx = headers.findIndex(h => h === 'high')
        const lIdx = headers.findIndex(h => h === 'low')
        const cIdx = headers.findIndex(h => h === 'close')
        if ([oIdx, hIdx, lIdx, cIdx].some(i => i === -1)) {
          alert('Invalid CSV format. Please use the template.')
          throw new Error(`Missing columns. Found: [${headers.join(', ')}]. Required: open, high, low, close.`)
        }
        const rows: OHLCRow[] = lines.slice(headerLineIdx + 1).map((line, i) => {
          const cols = line.split(',').map(c => c.trim().replace(/['"]/g, ''))
          const o = cols[oIdx], h = cols[hIdx], lo = cols[lIdx], c = cols[cIdx]
          if ([o, h, lo, c].some(v => v === undefined || isNaN(Number(v))))
            throw new Error(`Row ${i + 2} has invalid values.`)
          return { open: o, high: h, low: lo, close: c, time: '' }
        })
        // Auto-detect timeframe from Unix timestamp column
        const unixIdx = headers.findIndex(h => h === 'unix')
        if (unixIdx !== -1 && lines.length > headerLineIdx + 2) {
          const t0 = parseFloat(lines[headerLineIdx + 1].split(',')[unixIdx] ?? '0')
          const t1 = parseFloat(lines[headerLineIdx + 2].split(',')[unixIdx] ?? '0')
          const diffSec = Math.abs(t0 - t1) / 1000
          if (diffSec > 3000 && diffSec < 4200) setTimeframe('1H')
          else if (diffSec > 80000 && diffSec < 93000) setTimeframe('1D')
        }
        setN(rows.length)
        setOhlcData(rows)
        setMatches([])
        setTempSelection(new Set())
        setAppliedSelection(new Set())
        setAppliedData({ matches: [], stats: null, inputs: [] })
      } catch (err) {
        setUploadError((err as Error).message)
      }
    }
    reader.onerror = () => setUploadError('Failed to read file.')
    reader.readAsText(file)
  }

  async function handleUseExample() {
    setUploadError(null)
    try {
      console.log('[handleUseExample] fetching', { n, timeframe })
      const res = await axios.get<{ rows: { open: number; high: number; low: number; close: number; time: string }[] }>(
        '/api/example', { params: { n, timeframe } }
      )
      console.log('[handleUseExample] response', res.data)
      const rows: OHLCRow[] = res.data.rows.map(r => ({
        open: String(r.open), high: String(r.high), low: String(r.low), close: String(r.close), time: r.time ?? '',
      }))
      console.log('[handleUseExample] mapped rows', rows)
      setOhlcData(rows)
      setMatches([])
      setTempSelection(new Set())
      setAppliedSelection(new Set())
      setAppliedData({ matches: [], stats: null, inputs: [] })
    } catch (e) {
      console.error('[handleUseExample] error', e)
      setUploadError('Failed to load example data. Is the backend running?')
    }
  }

  function handleNChange(newN: number) {
    setN(newN)
    setOhlcData(Array.from({ length: newN }, () => ({ open: '', high: '', low: '', close: '', time: '' })))
    setMatches([])
    setTempSelection(new Set())
    setAppliedSelection(new Set())
    setAppliedData({ matches: [], stats: null, inputs: [] })
  }

  function handleCellChange(rowIdx: number, field: keyof OHLCRow, value: string) {
    setOhlcData(prev => prev.map((r, i) => i === rowIdx ? { ...r, [field]: value } : r))
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
      // Scenario B: same inputs, only selection changed — sync without re-running API
      setAppliedSelection(new Set(tempSelection))
      return
    }
    // Scenario A: new inputs — re-run matching, reset to select all
    const result = await predict(ohlcData, [], timeframe)
    if (!result) return
    const allIds = new Set(result.matches.map(m => m.id))
    setMatches(result.matches)
    setTempSelection(allIds)
    setAppliedSelection(allIds)
    setAppliedData({ matches: result.matches, stats: result.stats, inputs: ohlcData })
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <TopBar n={n} onNChange={handleNChange} onFileUpload={handleFileUpload} onUseExample={handleUseExample} />
      {uploadError && (
        <div className="mx-4 mt-2 text-red-400 text-xs border border-red-700 rounded px-3 py-2 bg-red-950">
          ✗ {uploadError}
        </div>
      )}
      <div className="flex flex-1 gap-4 p-4 min-h-0">
        {/* Left sidebar: editor → compact chart → predict button */}
        <div className="w-80 flex flex-col gap-4">
          <OHLCEditor rows={ohlcData} timeframe={timeframe} onChange={handleCellChange} />
          <div className="flex flex-col gap-1">
            <div className="flex rounded overflow-hidden border border-gray-700">
              {(['1H', '1D'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
                    timeframe === tf
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Reference: {timeframe === '1H' ? 'Binance ETHUSDT 1H' : 'Binance ETHUSDT 1D'}
            </p>
          </div>
          <MainChart userOhlc={ohlcData} appliedMatches={appliedData.matches} height={160} />
          <PredictButton
            disabled={!!disabledReason}
            disabledReason={disabledReason}
            onClick={handlePredict}
            loading={loading}
          />
        </div>
        {/* Right panel: match list (top) + statistics (bottom) */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <div className="flex-1 min-h-0 flex flex-col">
            <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-wider flex-shrink-0">Match List</h3>
            <MatchList matches={matches} selected={tempSelection} onToggle={handleToggle} timeframe={timeframe} />
          </div>
          <div className="flex-shrink-0">
            <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Statistics</h3>
            <StatsPanel stats={displayStats} isDirty={isDirty} selectedCount={appliedSelection.size} totalCount={matches.length} />
          </div>
        </div>
      </div>
    </div>
  )
}
