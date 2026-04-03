import { useState } from 'react'
import axios from 'axios'
import { OHLCRow, PredictResponse } from '../types'

export function usePrediction() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function predict(
    ohlcRows: OHLCRow[],
    selectedIds: string[],
    timeframe: string = '1H',
    ma99TrendOverride?: 'up' | 'down' | 'flat' | null,
  ): Promise<PredictResponse | null> {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post<any>('/api/predict', {
        ohlc_data: ohlcRows.map(r => ({
          open: Number(r.open), high: Number(r.high),
          low: Number(r.low), close: Number(r.close), time: r.time ?? ''
        })),
        selected_ids: selectedIds,
        timeframe,
        ma99_trend_override: ma99TrendOverride ?? null,
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
          highest: {
            label: raw.stats.highest.label,
            price: raw.stats.highest.price,
            pct: raw.stats.highest.pct,
            occurrenceBar: raw.stats.highest.occurrence_bar,
            occurrenceWindow: raw.stats.highest.occurrence_window,
            historicalTime: raw.stats.highest.historical_time,
          },
          secondHighest: {
            label: raw.stats.second_highest.label,
            price: raw.stats.second_highest.price,
            pct: raw.stats.second_highest.pct,
            occurrenceBar: raw.stats.second_highest.occurrence_bar,
            occurrenceWindow: raw.stats.second_highest.occurrence_window,
            historicalTime: raw.stats.second_highest.historical_time,
          },
          secondLowest: {
            label: raw.stats.second_lowest.label,
            price: raw.stats.second_lowest.price,
            pct: raw.stats.second_lowest.pct,
            occurrenceBar: raw.stats.second_lowest.occurrence_bar,
            occurrenceWindow: raw.stats.second_lowest.occurrence_window,
            historicalTime: raw.stats.second_lowest.historical_time,
          },
          lowest: {
            label: raw.stats.lowest.label,
            price: raw.stats.lowest.price,
            pct: raw.stats.lowest.pct,
            occurrenceBar: raw.stats.lowest.occurrence_bar,
            occurrenceWindow: raw.stats.lowest.occurrence_window,
            historicalTime: raw.stats.lowest.historical_time,
          },
          winRate: raw.stats.win_rate,
          meanCorrelation: raw.stats.mean_correlation,
        },
      }
      console.log("Mapped Stats:", result.stats)
      return result
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Prediction failed. Is the backend running?')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { predict, loading, error }
}
