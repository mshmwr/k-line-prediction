import { useMemo, useState } from 'react'
import { Ma99Gap, MatchCase, OHLCRow, PredictResponse, PredictStats } from '../types'
import { toDisplayMatch, AggregatedMatch } from '../utils/aggregation'
import { trackMatchRun, trackResultViewed } from '../utils/analytics'

interface UsePredictionWorkspaceParams {
  predict: (rows: OHLCRow[], ids: string[], timeframe: string) => Promise<PredictResponse | null>
  apiRows: OHLCRow[]
  viewTimeframe: '1H' | '1D'
  setQueryMa99: (vals: (number | null)[]) => void
  setQueryMa99Gap: (gap: Ma99Gap | null) => void
}

interface UsePredictionWorkspaceReturn {
  matches: MatchCase[]
  tempSelection: Set<string>
  appliedSelection: Set<string>
  appliedData: { matches: MatchCase[]; stats: PredictStats | null; inputs: OHLCRow[] }
  displayMatches: AggregatedMatch[]
  resetPredictionState: () => void
  handleToggle: (id: string) => void
  handlePredict: () => Promise<void>
}

/**
 * Owns matches, tempSelection, appliedSelection, appliedData, and all predict
 * flow logic. Receives setQueryMa99 / setQueryMa99Gap injected from
 * useOfficialInput to update MA99 display after predict returns.
 * Used on: AppPage
 */
export function usePredictionWorkspace({
  predict,
  apiRows,
  viewTimeframe,
  setQueryMa99,
  setQueryMa99Gap,
}: UsePredictionWorkspaceParams): UsePredictionWorkspaceReturn {
  const [matches, setMatches] = useState<MatchCase[]>([])
  const [tempSelection, setTempSelection] = useState<Set<string>>(new Set())
  const [appliedSelection, setAppliedSelection] = useState<Set<string>>(new Set())
  const [appliedData, setAppliedData] = useState<{
    matches: MatchCase[]
    stats: PredictStats | null
    inputs: OHLCRow[]
  }>({ matches: [], stats: null, inputs: [] })

  const displayMatches = useMemo(
    () => matches.map(match => toDisplayMatch(match)),
    [matches],
  )

  function resetPredictionState() {
    setMatches([])
    setTempSelection(new Set())
    setAppliedSelection(new Set())
    setAppliedData({ matches: [], stats: null, inputs: [] })
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

  return {
    matches,
    tempSelection,
    appliedSelection,
    appliedData,
    displayMatches,
    resetPredictionState,
    handleToggle,
    handlePredict,
  }
}
