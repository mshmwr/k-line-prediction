// frontend/src/utils/statsComputation.ts
//
// Subset stats computation. Pure function — no React, no I/O, no Date.now().
//
// Mirrors backend `predictor.compute_stats(matches, current_close, timeframe)`
// for the 4-bucket OrderSuggestion + winRate + meanCorrelation outputs. The
// contract fixture at `backend/tests/fixtures/stats_contract_cases.json` locks
// bit-exact parity (1e-6 tolerance) between backend `compute_stats` and this
// function — when the backend algorithm changes, the fixture must be
// regenerated via `backend/tests/fixtures/generate_stats_contract_cases.py`
// and both sides' contract tests must pass simultaneously.
//
// Additionally returns `projectedFutureBars` (frontend-only extension) that
// AppPage merges into `displayStats.consensusForecast1h/1d` for chart render;
// this extension is NOT part of the contract fixture — the fixture only locks
// the PredictStats-equivalent fields.
//
// Why subset lives frontend-side (per TD-008 Option C):
// - `/api/predict` returns stats for the full top-N matches ("all" baseline).
// - When the user deselects some matches, recomputing on the server would
//   require a round-trip; frontend derivation gives instant feedback.
// - The fixture keeps both sides algorithmically equivalent so subset results
//   are guaranteed to match what the backend would compute if asked.

import { MatchCase, OrderSuggestion, PredictStats } from '../types'
import {
  aggregateProjectedBarsTo1D,
  computeProjectedFutureBars,
  ProjectionBar,
} from './aggregation'

export interface StatsComputationResult {
  // 4 OrderSuggestions + winRate + meanCorrelation (mirrors backend PredictStats).
  // consensusForecast1h/1d intentionally omitted: see §2.1 in K-013 design doc —
  // backend always returns [] for these fields (pre-existing KG-013-01), and the
  // frontend injects projectedFutureBars-derived values at the AppPage layer.
  stats: Omit<PredictStats, 'consensusForecast1h' | 'consensusForecast1d'>
  // Projected bars (1H granularity) for AppPage to feed StatsPanel charts +
  // displayStatsByDay. Computed internally so AppPage has a single call site
  // instead of double-dipping into computeProjectedFutureBars.
  projectedFutureBars: ProjectionBar[]
}

// Frontend 4-suggestion builder. Rounds price + pct to 2 decimals matching
// backend `OrderSuggestion` fields. Note: backend `pct` is expressed as a
// percentage (e.g. 5.23 means 5.23%), NOT a ratio (0.0523). We must multiply
// by 100 before rounding to keep the contract.
function buildProjectedSuggestion(
  label: string,
  price: number,
  ratioToCurrent: number,
  occurrenceBar: number,
  occurrenceWindow: string,
  historicalTime: string,
): OrderSuggestion {
  return {
    label,
    price: Math.round(price * 100) / 100,
    pct: Math.round(ratioToCurrent * 100 * 100) / 100,
    occurrenceBar,
    occurrenceWindow,
    historicalTime,
  }
}

/**
 * Compute subset stats for a user-selected subset of top-N matches.
 *
 * Contract guarantees (locked by stats_contract_cases.json):
 * - Output `stats` fields are bit-exact (<=1e-6 tolerance) vs backend
 *   `compute_stats(matches, currentClose, timeframe)` for the same input.
 * - `consensusForecast1h/1d` NOT returned here (see StatsComputationResult).
 *
 * Error contract:
 * - `matches.length === 0` -> throw "At least one match is required to
 *   compute statistics." (matches backend message)
 * - `projectedFutureBars.length < 2` -> throw "At least two future bars are
 *   required to build order suggestions." (matches backend message)
 * - `currentClose <= 0` or not finite -> throw "currentClose must be a
 *   positive finite number."
 *
 * Edge note: when all match correlations are null, meanCorrelation = 0.
 * (Backend would raise StatisticsError on `statistics.mean([])`; Edge Case
 * #4 in the design doc is NOT locked by the current fixture. Frontend
 * diverges here intentionally as documented in §9.2 KG-013-03.)
 *
 * @param matches subset of MatchCase (>= 1)
 * @param currentClose last bar close price of user input (>0)
 * @param timeframe '1H' | '1D' — reserved for future use; occurrenceWindow
 *   labels currently derive from projectedFutureBars[i].time (UTC+8 display)
 * @param lastBarTime optional; if provided, passed to
 *   computeProjectedFutureBars for UTC+8 "MM/DD HH:MM" labels
 */
export function computeStatsFromMatches(
  matches: MatchCase[],
  currentClose: number,
  timeframe: '1H' | '1D',
  lastBarTime?: string,
): StatsComputationResult {
  if (matches.length === 0) {
    throw new Error('At least one match is required to compute statistics.')
  }
  if (!Number.isFinite(currentClose) || currentClose <= 0) {
    throw new Error('currentClose must be a positive finite number.')
  }

  const projectedFutureBars = computeProjectedFutureBars(matches, currentClose, lastBarTime)
  if (projectedFutureBars.length < 2) {
    throw new Error('At least two future bars are required to build order suggestions.')
  }

  const sortedHighs = [...projectedFutureBars].sort((a, b) => b.high - a.high)
  const sortedLows = [...projectedFutureBars].sort((a, b) => a.low - b.low)
  const corrs = matches
    .map(match => match.correlation)
    .filter((value): value is number => value != null)
  const wins = projectedFutureBars.filter(bar => bar.close > currentClose)

  const stats: Omit<PredictStats, 'consensusForecast1h' | 'consensusForecast1d'> = {
    highest: buildProjectedSuggestion(
      'Highest',
      sortedHighs[0].high,
      (sortedHighs[0].high - currentClose) / currentClose,
      sortedHighs[0].occurrenceBar,
      sortedHighs[0].time,
      'Consensus',
    ),
    secondHighest: buildProjectedSuggestion(
      'Second Highest',
      sortedHighs[1].high,
      (sortedHighs[1].high - currentClose) / currentClose,
      sortedHighs[1].occurrenceBar,
      sortedHighs[1].time,
      'Consensus',
    ),
    secondLowest: buildProjectedSuggestion(
      'Second Lowest',
      sortedLows[1].low,
      (sortedLows[1].low - currentClose) / currentClose,
      sortedLows[1].occurrenceBar,
      sortedLows[1].time,
      'Consensus',
    ),
    lowest: buildProjectedSuggestion(
      'Lowest',
      sortedLows[0].low,
      (sortedLows[0].low - currentClose) / currentClose,
      sortedLows[0].occurrenceBar,
      sortedLows[0].time,
      'Consensus',
    ),
    // Backend rounds win_rate to 4 decimals; match exactly.
    winRate: Math.round((wins.length / projectedFutureBars.length) * 10000) / 10000,
    meanCorrelation:
      corrs.length > 0
        ? Math.round((corrs.reduce((a, b) => a + b, 0) / corrs.length) * 10000) / 10000
        : 0,
  }

  // `timeframe` reserved for parity with backend compute_stats signature; it
  // currently influences nothing in the frontend derivation because the
  // occurrenceWindow label is already baked into ProjectionBar.time via
  // addHoursToUtc8 (1H) or aggregateProjectedBarsTo1D (1D). Kept in signature
  // for contract symmetry and forward compatibility.
  void timeframe

  return { stats, projectedFutureBars }
}

// Helper exposed for unit test coverage — whitelist-style snake_case ->
// camelCase key mapping for the 4 OrderSuggestion sub-fields + top-level
// PredictStats fields. See design doc §2.3.
//
// Hand-rolled mapping (not lodash/camelcase-keys) because:
// 1. bundle cost of camelcase-keys outweighs ~30 lines of explicit mapping
// 2. a naive `_[a-z]/i` regex would mangle numeric-suffix keys like
//    `consensus_forecast_1h` -> `consensusForecast1h` (the `_1` run has no
//    letter to upper-case after the digit), so we whitelist per-field.
type SnakeOrderSuggestion = {
  label: string
  price: number
  pct: number
  occurrence_bar: number
  occurrence_window: string
  historical_time: string
}

export function snakeSuggestionToCamel(raw: SnakeOrderSuggestion): OrderSuggestion {
  return {
    label: raw.label,
    price: raw.price,
    pct: raw.pct,
    occurrenceBar: raw.occurrence_bar,
    occurrenceWindow: raw.occurrence_window,
    historicalTime: raw.historical_time,
  }
}

export type SnakePredictStats = {
  highest: SnakeOrderSuggestion
  second_highest: SnakeOrderSuggestion
  second_lowest: SnakeOrderSuggestion
  lowest: SnakeOrderSuggestion
  win_rate: number
  mean_correlation: number
  consensus_forecast_1h?: unknown[]
  consensus_forecast_1d?: unknown[]
}

export function snakeStatsToCamel(
  raw: SnakePredictStats,
): Omit<PredictStats, 'consensusForecast1h' | 'consensusForecast1d'> {
  return {
    highest: snakeSuggestionToCamel(raw.highest),
    secondHighest: snakeSuggestionToCamel(raw.second_highest),
    secondLowest: snakeSuggestionToCamel(raw.second_lowest),
    lowest: snakeSuggestionToCamel(raw.lowest),
    winRate: raw.win_rate,
    meanCorrelation: raw.mean_correlation,
  }
}

// Re-export for callers that want to compute 1D aggregation separately
// (AppPage uses this for consensusForecast1d injection).
export { aggregateProjectedBarsTo1D }
