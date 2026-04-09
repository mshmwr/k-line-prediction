import { useState } from 'react'
import axios from 'axios'
import { OHLCRow, PredictResponse, Ma99Gap } from '../types'

interface Ma99RawResponse {
  query_ma99: (number | null)[]
  query_ma99_gap: { from_date: string; to_date: string } | null
}

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
          historicalMa99: m.historical_ma99 ?? [],
          futureMa99: m.future_ma99 ?? [],
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
        queryMa99: raw.query_ma99 ?? [],
        queryMa99Gap: raw.query_ma99_gap
          ? { fromDate: raw.query_ma99_gap.from_date, toDate: raw.query_ma99_gap.to_date }
          : null,
      }
      return result
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Prediction failed. Is the backend running?')
      return null
    } finally {
      setLoading(false)
    }
  }

  async function computeMa99(
    ohlcRows: OHLCRow[],
    timeframe: string = '1H',
  ): Promise<{ queryMa99: (number | null)[]; queryMa99Gap: Ma99Gap | null }> {
    const res = await axios.post<Ma99RawResponse>('/api/merge-and-compute-ma99', {
      ohlc_data: ohlcRows.map(r => ({
        open: Number(r.open),
        high: Number(r.high),
        low: Number(r.low),
        close: Number(r.close),
        time: r.time ?? '',
      })),
      timeframe,
    })
    const raw = res.data
    return {
      queryMa99: raw.query_ma99 ?? [],
      queryMa99Gap: raw.query_ma99_gap
        ? { fromDate: raw.query_ma99_gap.from_date, toDate: raw.query_ma99_gap.to_date }
        : null,
    }
  }

  return { predict, computeMa99, loading, error }
}
