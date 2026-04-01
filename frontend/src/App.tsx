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
    Array.from({ length: 5 }, () => ({ open: '', high: '', low: '', close: '' }))
  )
  const [matches, setMatches] = useState<MatchCase[]>([])
  const [tempSelection, setTempSelection] = useState<Set<string>>(new Set())
  const [appliedData, setAppliedData] = useState<{ matches: MatchCase[]; stats: PredictStats | null }>({
    matches: [], stats: null
  })
  const [uploadError, setUploadError] = useState<string | null>(null)
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
    const activeMatches = appliedData.matches.filter(m => tempSelection.has(m.id))
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
    const futureCloses = activeMatches
      .map(m => m.futureOhlc)
      .filter(fut => fut?.length > 0)
      .map(fut => fut[fut.length - 1].close)
      .sort((a, b) => a - b)
    const optimistic = futureCloses.length > 0 ? futureCloses[futureCloses.length - 1] : appliedData.stats.optimistic
    const pessimistic = futureCloses.length > 0 ? futureCloses[0] : appliedData.stats.pessimistic
    const mid = Math.floor(futureCloses.length / 2)
    const baseline = futureCloses.length > 0
      ? (futureCloses.length % 2 === 0
        ? (futureCloses[mid - 1] + futureCloses[mid]) / 2
        : futureCloses[mid])
      : appliedData.stats.baseline
    return { meanCorrelation, winRate, optimistic, pessimistic, baseline }
  }, [appliedData, tempSelection])

  const isDirty = useMemo(() => {
    if (!appliedData.stats) return false
    const applied = new Set(appliedData.matches.map(m => m.id))
    if (applied.size !== tempSelection.size) return true
    for (const id of tempSelection) if (!applied.has(id)) return true
    return false
  }, [tempSelection, appliedData])

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
          throw new Error(`Missing columns. Found: [${headers.join(', ')}]. Required: open, high, low, close.`)
        }
        const rows: OHLCRow[] = lines.slice(headerLineIdx + 1).map((line, i) => {
          const cols = line.split(',').map(c => c.trim().replace(/['"]/g, ''))
          const o = cols[oIdx], h = cols[hIdx], lo = cols[lIdx], c = cols[cIdx]
          if ([o, h, lo, c].some(v => v === undefined || isNaN(Number(v))))
            throw new Error(`Row ${i + 2} has invalid values.`)
          return { open: o, high: h, low: lo, close: c }
        })
        setN(rows.length)
        setOhlcData(rows)
        setMatches([])
        setTempSelection(new Set())
        setAppliedData({ matches: [], stats: null })
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
      const res = await axios.get<{ rows: { open: number; high: number; low: number; close: number }[] }>(
        '/api/example', { params: { n } }
      )
      const rows: OHLCRow[] = res.data.rows.map(r => ({
        open: String(r.open), high: String(r.high), low: String(r.low), close: String(r.close),
      }))
      setOhlcData(rows)
      setMatches([])
      setTempSelection(new Set())
      setAppliedData({ matches: [], stats: null })
      const result = await predict(rows, [])
      if (!result) return
      setMatches(result.matches)
      setTempSelection(new Set(result.matches.map(m => m.id)))
      setAppliedData({ matches: result.matches, stats: result.stats })
    } catch {
      setUploadError('Failed to load example data. Is the backend running?')
    }
  }

  function handleNChange(newN: number) {
    setN(newN)
    setOhlcData(Array.from({ length: newN }, () => ({ open: '', high: '', low: '', close: '' })))
    setMatches([])
    setTempSelection(new Set())
    setAppliedData({ matches: [], stats: null })
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
    if (matches.length > 0) {
      // Matches already loaded for this input — just sync selection, no API call
      const activeMatches = matches.filter(m => tempSelection.has(m.id))
      setAppliedData(prev => ({ ...prev, matches: activeMatches }))
      return
    }
    const result = await predict(ohlcData, [])
    if (!result) return
    setMatches(result.matches)
    setTempSelection(new Set(result.matches.map(m => m.id)))
    setAppliedData({ matches: result.matches, stats: result.stats })
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
          <OHLCEditor rows={ohlcData} onChange={handleCellChange} />
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
            <MatchList matches={matches} selected={tempSelection} onToggle={handleToggle} />
          </div>
          <div className="flex-shrink-0">
            <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Statistics</h3>
            <StatsPanel stats={displayStats} isDirty={isDirty} selectedCount={tempSelection.size} totalCount={matches.length} />
          </div>
        </div>
      </div>
    </div>
  )
}
