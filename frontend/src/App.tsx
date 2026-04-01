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
  const [jsonText, setJsonText] = useState('')
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

  function handleJsonImport() {
    try {
      const parsed = JSON.parse(jsonText)
      if (!Array.isArray(parsed)) throw new Error('Expected a JSON array')
      const rows: OHLCRow[] = parsed.slice(0, n).map((item: Record<string, unknown>, i: number) => {
        const o = String(item.open ?? ''), h = String(item.high ?? '')
        const l = String(item.low ?? ''), c = String(item.close ?? '')
        const t = String(item.time ?? '')
        if ([o, h, l, c].some(v => isNaN(Number(v)))) throw new Error(`Row ${i + 1} has invalid values`)
        return { open: o, high: h, low: l, close: c, time: t }
      })
      setOhlcData(rows)
      setMatches([])
      setTempSelection(new Set())
      setAppliedSelection(new Set())
      setAppliedData({ matches: [], stats: null, inputs: [] })
      setUploadError(null)
      setJsonText('')
    } catch (err) {
      setUploadError(`JSON parse error: ${(err as Error).message}`)
    }
  }

  function handleCopyPrompt() {
    navigator.clipboard.writeText(
      'Please format my data into this JSON structure for a K-Line Predictor:\n[{"time": "2024-01-01", "open": 2000, "high": 2100, "low": 1950, "close": 2050}, ...]'
    )
  }

  return (
    <div className="h-screen bg-gray-950 text-gray-100 flex flex-col overflow-hidden">
      <TopBar n={n} onNChange={handleNChange} onUseExample={handleUseExample} />
      {uploadError && (
        <div className="mx-4 mt-1 text-red-400 text-xs border border-red-700 rounded px-3 py-1.5 bg-red-950 flex-shrink-0">
          ✗ {uploadError}
        </div>
      )}
      <div className="flex flex-1 gap-4 px-4 pb-4 pt-3 min-h-0">
        {/* Left sidebar */}
        <div className="w-80 flex flex-col gap-3">
          {/* TOP: 2-column Data Sources */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left: CSV Upload */}
            <label className="flex items-center justify-center border-2 border-dashed border-gray-600 rounded text-gray-400 text-xs text-center px-2 cursor-pointer hover:border-orange-400 transition-colors min-h-[100px]">
              Drop CSV or click to upload
              <input type="file" accept=".csv,image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]) }} />
            </label>
            {/* Right: JSON Import */}
            <div className="flex flex-col gap-1 min-h-[100px]">
              <textarea
                className="flex-1 bg-gray-800 text-gray-200 rounded px-2 py-1 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-orange-400 font-mono placeholder-gray-600"
                placeholder={'[{"time":"...","open":0,...}]'}
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
              />
              <div className="flex gap-1">
                <button
                  onClick={handleJsonImport}
                  className="flex-1 text-xs py-1 rounded bg-orange-600 text-white hover:bg-orange-500 transition-colors"
                >
                  Import JSON
                </button>
                <button
                  onClick={handleCopyPrompt}
                  className="flex-1 text-xs py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                >
                  Copy Prompt
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700" />

          {/* BOTTOM: OHLC Table */}
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
          <div className="flex-1 min-h-0">
            <MainChart key={timeframe} userOhlc={ohlcData} timeframe={timeframe} />
          </div>
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
