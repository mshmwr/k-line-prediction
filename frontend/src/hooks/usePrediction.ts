import { useState } from 'react'
import axios from 'axios'
import { OHLCRow, PredictResponse } from '../types'

export function usePrediction() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function predict(ohlcRows: OHLCRow[], selectedIds: string[], timeframe: string = '1H'): Promise<PredictResponse | null> {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post<any>('/api/predict', {
        ohlc_data: ohlcRows.map(r => ({
          open: Number(r.open), high: Number(r.high),
          low: Number(r.low), close: Number(r.close)
        })),
        selected_ids: selectedIds,
        timeframe,
      })
      const raw = res.data
      const result: PredictResponse = {
        matches: raw.matches.map((m: any) => ({
          id: m.id,
          correlation: m.correlation,
          historicalOhlc: m.historical_ohlc,
          futureOhlc: m.future_ohlc,
          startDate: m.start_date,
          endDate: m.end_date,
        })),
        stats: {
          optimistic: raw.stats.optimistic,
          baseline: raw.stats.baseline,
          pessimistic: raw.stats.pessimistic,
          optimisticPct: raw.stats.optimistic_pct,
          baselinePct: raw.stats.baseline_pct,
          pessimisticPct: raw.stats.pessimistic_pct,
          winRate: raw.stats.win_rate,
          meanCorrelation: raw.stats.mean_correlation,
        },
      }
      console.log("Mapped Stats:", result.stats)
      return result
    } catch (e) {
      setError('Prediction failed. Is the backend running?')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { predict, loading, error }
}
