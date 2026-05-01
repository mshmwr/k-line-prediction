import { MatchCase, OHLCRow, PredictStats } from '../types'
import { aggregateProjectedBarsTo1D, ProjectionBar } from './aggregation'
import { computeStatsFromMatches } from './statsComputation'

/**
 * K-013 (TD-008 Option C): derives displayStats and projectedFutureBars from
 * appliedData + appliedSelection. Full-set uses backend baseline stats;
 * subset uses util stats. projectedFutureBars feeds consensus charts and
 * displayStatsByDay.
 * Used on: AppPage residual workspace useMemo
 */
export function computeWorkspace(
  appliedData: { matches: MatchCase[]; stats: PredictStats | null; inputs: OHLCRow[] },
  appliedSelection: Set<string>,
  viewTimeframe: '1H' | '1D',
): { projectedFutureBars: ProjectionBar[]; displayStats: PredictStats | null } {
  const empty = { projectedFutureBars: [] as ProjectionBar[], displayStats: null as PredictStats | null }
  if (!appliedData.stats) return empty

  const active = appliedData.matches.filter(m => appliedSelection.has(m.id))
  if (active.length === 0) return { ...empty, displayStats: appliedData.stats }

  const currentClose = Number(appliedData.inputs[appliedData.inputs.length - 1]?.close) || 0
  const lastBarTime = appliedData.inputs[appliedData.inputs.length - 1]?.time
  const isFullSet = active.length === appliedData.matches.length

  try {
    const { stats: subsetStats, projectedFutureBars } = computeStatsFromMatches(active, currentClose, viewTimeframe, lastBarTime)
    const projectedFutureBars1D = viewTimeframe === '1H' ? aggregateProjectedBarsTo1D(projectedFutureBars) : []
    // Full set -> defer to backend baseline stats (AC-013-APPPAGE line 1),
    //             BUT still inject consensus bars so ConsensusForecastChart renders
    //             (matching OLD behavior at base `b0212bb` — see KG-013-01).
    // Subset   -> merge util stats with consensus bars.
    const displayStats: PredictStats = {
      ...(isFullSet ? appliedData.stats : subsetStats),
      consensusForecast1h: projectedFutureBars,
      consensusForecast1d: projectedFutureBars1D,
    }
    return { projectedFutureBars, displayStats }
  } catch {
    if (import.meta.env.DEV) {
      console.warn('[K-013] Consensus fallback path triggered: projectedFutureBars.length < 2 (or util threw)')
    }
    return { ...empty, displayStats: appliedData.stats }
  }
}
