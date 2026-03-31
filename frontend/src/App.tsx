import { useState, useMemo } from 'react'
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
  const { predict, loading } = usePrediction()

  const ohlcComplete = useMemo(() => ohlcData.every(isRowComplete), [ohlcData])
  const hasSelection = tempSelection.size > 0

  const disabledReason = useMemo(() => {
    if (!ohlcComplete) return 'ohlcIncomplete' as const
    if (matches.length > 0 && !hasSelection) return 'noSelection' as const
    return null
  }, [ohlcComplete, hasSelection, matches.length])

  const isDirty = useMemo(() => {
    if (!appliedData.stats) return false
    const applied = new Set(appliedData.matches.map(m => m.id))
    if (applied.size !== tempSelection.size) return true
    for (const id of tempSelection) if (!applied.has(id)) return true
    return false
  }, [tempSelection, appliedData])

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
    const selectedIds = matches.length > 0 ? [...tempSelection] : []
    const result = await predict(ohlcData, selectedIds)
    if (!result) return
    setMatches(result.matches)
    const activeMatches = selectedIds.length > 0
      ? result.matches.filter(m => selectedIds.includes(m.id))
      : result.matches
    setTempSelection(new Set(result.matches.map(m => m.id)))
    setAppliedData({ matches: activeMatches, stats: result.stats })
  }

  const displayMatches = appliedData.matches.length > 0 ? appliedData.matches : matches

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <TopBar n={n} onNChange={handleNChange} onFileUpload={() => {}} />
      <div className="flex flex-1 gap-4 p-4">
        <div className="w-80 flex flex-col gap-4">
          <OHLCEditor rows={ohlcData} onChange={handleCellChange} />
          <PredictButton
            disabled={!!disabledReason}
            disabledReason={disabledReason}
            onClick={handlePredict}
            loading={loading}
          />
        </div>
        <div className="flex-1">
          <MainChart userOhlc={ohlcData} appliedMatches={displayMatches} />
        </div>
      </div>
      <div className="flex gap-4 p-4 border-t border-gray-800">
        <div className="w-80">
          <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Match List</h3>
          <MatchList matches={matches} selected={tempSelection} onToggle={handleToggle} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Statistics</h3>
          <StatsPanel stats={appliedData.stats} isDirty={isDirty} />
        </div>
      </div>
    </div>
  )
}
