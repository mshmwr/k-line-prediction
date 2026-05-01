import { useMemo, useRef } from 'react'
import { OHLCEditor } from './components/OHLCEditor'
import { TopBar } from './components/TopBar'
import { PredictButton } from './components/PredictButton'
import { MatchList } from './components/MatchList'
import { StatsPanel } from './components/StatsPanel'
import { MainChart } from './components/MainChart'
import { usePrediction } from './hooks/usePrediction'
import { useHistoryUpload, HistoryInfo } from './hooks/useHistoryUpload'
import { useOfficialInput } from './hooks/useOfficialInput'
import { usePredictionWorkspace } from './hooks/usePredictionWorkspace'
import { computeStatsFromMatches } from './utils/statsComputation'
import { computeStatsByDay } from './utils/statsByDay'
import { isRowComplete } from './utils/officialCsvParsing'
import { computeWorkspace } from './utils/workspaceComputation'

export default function AppPage() {
  const { predict, computeMa99, loading, error: predictionError } = usePrediction()
  const { historyInfo } = useHistoryUpload()
  // Stable ref breaks circular dep: useOfficialInput needs resetPredictionState
  // (owned by usePredictionWorkspace); usePredictionWorkspace needs apiRows/setters
  // (owned by useOfficialInput). Ref wrapper always delegates to latest value.
  const resetPredWsRef = useRef<() => void>(() => {})
  const oi = useOfficialInput({ computeMa99, resetPredictionState: () => resetPredWsRef.current() })
  const ws = usePredictionWorkspace({ predict, apiRows: oi.apiRows, viewTimeframe: oi.viewTimeframe, setQueryMa99: oi.setQueryMa99, setQueryMa99Gap: oi.setQueryMa99Gap })
  resetPredWsRef.current = ws.resetPredictionState

  const errorMessage = oi.loadError ?? predictionError
  const hasSelection = ws.tempSelection.size > 0

  const disabledReason = useMemo(() => {
    if (oi.maLoading) return 'maLoading' as const
    if (!oi.ohlcComplete) return 'ohlcIncomplete' as const
    if (ws.matches.length > 0 && !hasSelection) return 'noSelection' as const
    return null
  }, [oi.maLoading, oi.ohlcComplete, hasSelection, ws.matches.length])

  const workspace = useMemo(
    () => computeWorkspace(ws.appliedData, ws.appliedSelection, oi.viewTimeframe),
    [ws.appliedData, ws.appliedSelection, oi.viewTimeframe],
  )

  const displayStatsByDay = useMemo(() => {
    if (oi.viewTimeframe === '1D' || workspace.projectedFutureBars.length === 0) return []
    const close = Number(ws.appliedData.inputs[ws.appliedData.inputs.length - 1]?.close) || 0
    return computeStatsByDay(workspace.projectedFutureBars, close)
  }, [workspace.projectedFutureBars, ws.appliedData.inputs, oi.viewTimeframe])

  const isDirty = useMemo(() => {
    if (!ws.appliedData.stats) return false
    if (ws.appliedSelection.size !== ws.tempSelection.size) return true
    for (const id of ws.tempSelection) if (!ws.appliedSelection.has(id)) return true
    return false
  }, [ws.tempSelection, ws.appliedSelection, ws.appliedData.stats])

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-950 text-gray-100">
      <TopBar rowCount={oi.ohlcData.filter(isRowComplete).length} />
      {errorMessage && (
        <div data-testid="error-toast" className="mx-4 mt-1 text-red-400 text-xs border border-red-700 rounded px-3 py-1.5 bg-red-950 flex-shrink-0">✗ {errorMessage}</div>
      )}
      <div className="flex flex-1 gap-4 px-4 pb-4 pt-3 min-h-0">
        <div className="w-80 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2 pb-20">
          <div data-testid="official-input-section" className="rounded border border-gray-700 bg-gray-900/70 p-3 flex flex-col gap-2">
            <div className="text-xs uppercase tracking-wider text-gray-400">Official Input</div>
            <div className="rounded border border-gray-700 bg-gray-950/70 p-2 text-xs text-gray-300">
              <div className="text-gray-500">Source file</div>
              <div className="mt-1 break-all font-mono text-[11px]">{oi.sourcePath || 'No file uploaded yet.'}</div>
            </div>
            <label className="flex cursor-pointer items-center justify-center rounded border border-dashed border-gray-600 px-3 py-4 text-center text-xs text-gray-300 transition-colors hover:border-orange-400 hover:text-white">
              Upload 1H CSV (multi-select)
              <input type="file" accept=".csv,text/csv" multiple className="hidden" onChange={e => { const f = e.target.files; if (f && f.length > 0) oi.handleOfficialFilesUpload(f); e.currentTarget.value = '' }} />
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div data-testid="official-input-expected-format" className="rounded border border-gray-700 bg-gray-950/70 px-2 py-2">
                <div className="text-gray-500">Expected format</div>
                <div className="mt-1 text-gray-200">Merged multi-file · 24 x 1H bars per file · UTC+0</div>
                <a href="/examples/ETHUSDT_1h_test.csv" download="ETHUSDT_1h_test.csv" className="mt-1 inline-block text-xs text-gray-400 hover:text-blue-400">Don't have a CSV? Download example →</a>
              </div>
              <div className="rounded border border-gray-700 bg-gray-950/70 px-2 py-2">
                <div className="text-gray-500">Displayed timezone</div>
                <div className="mt-1 text-gray-200">UTC+8</div>
              </div>
            </div>
          </div>
          <div data-testid="history-reference-section" className="rounded border border-gray-700 bg-gray-900/70 p-3 flex flex-col gap-2">
            <div className="text-xs uppercase tracking-wider text-gray-400">History Reference</div>
            {historyInfo ? (
              <>
                {(['1H', '1D'] as const).map(tf => {
                  const entry = (historyInfo as HistoryInfo)[tf]
                  const fh = entry.freshness_hours
                  const freshnessStr = fh != null ? ` · ${Math.floor(fh / 24)}d ${fh % 24}h ago` : ''
                  const isStale = fh != null && fh >= 48
                  return (
                    <div key={tf} className="rounded border border-gray-700 bg-gray-950/70 p-2 text-xs text-gray-300 font-mono" {...(isStale ? { 'data-testid': 'history-freshness-stale' } : {})}>
                      {`${entry.filename} (latest: ${entry.latest ?? 'N/A'} UTC+0${freshnessStr})`}
                    </div>
                  )
                })}
              </>
            ) : (
              <div className="rounded border border-gray-700 bg-gray-950/70 p-2 text-xs text-gray-300 font-mono">Loading...</div>
            )}
          </div>
          <OHLCEditor rows={oi.ohlcData} timeframe={'1H'} onChange={oi.handleCellChange} />
          <div className="h-[360px]">
            <MainChart key={oi.viewTimeframe} userOhlc={oi.apiRows} timeframe={oi.viewTimeframe} ma99Values={oi.queryMa99} ma99Gap={oi.queryMa99Gap} maLoading={oi.maLoading} onTimeframeChange={oi.handleTimeframeChange} />
          </div>
          <div className="sticky bottom-0 z-10 mt-auto bg-gray-950 pt-2 pb-1">
            <PredictButton disabled={!!disabledReason} disabledReason={disabledReason} onClick={ws.handlePredict} loading={loading} />
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
          <div className="flex-1 min-h-[260px] flex flex-col overflow-hidden">
            <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-wider flex-shrink-0">Match List</h3>
            <MatchList matches={ws.displayMatches} selected={ws.tempSelection} onToggle={ws.handleToggle} timeframe={oi.viewTimeframe} />
          </div>
          <div className="max-h-[48vh] flex-shrink-0 overflow-y-auto pr-1">
            <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Statistics</h3>
            <StatsPanel stats={workspace.displayStats} dayStats={displayStatsByDay} isDirty={isDirty} selectedCount={ws.appliedSelection.size} totalCount={ws.matches.length} />
          </div>
        </div>
      </div>
    </div>
  )
}
