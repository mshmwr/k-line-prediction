import { useState } from 'react'
import axios from 'axios'
import { Ma99Gap, OHLCRow, PredictResponse } from '../types'
import { API_BASE } from '../utils/api'

interface Ma99RawResponse {
  query_ma99_1h: (number | null)[]
  query_ma99_1d: (number | null)[]
  query_ma99_gap_1h: { from_date: string; to_date: string } | null
  query_ma99_gap_1d: { from_date: string; to_date: string } | null
}

function mapGap(raw: { from_date: string; to_date: string } | null | undefined): Ma99Gap | null {
  return raw ? { fromDate: raw.from_date, toDate: raw.to_date } : null
}

export function usePrediction() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function predict(
    ohlcRows: OHLCRow[],
    selectedIds: string[],
    timeframe: string = '1H',
  ): Promise<PredictResponse | null> {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post<any>(`${API_BASE}/api/predict`, {
        ohlc_data: ohlcRows.map(r => ({
          open: Number(r.open),
          high: Number(r.high),
          low: Number(r.low),
          close: Number(r.close),
          time: r.time ?? '',
        })),
        selected_ids: selectedIds,
        timeframe,
      })
      const raw = res.data
      return {
        matches: raw.matches.map((m: any) => ({
          id: m.id,
          correlation: m.correlation,
          historicalOhlc: m.historical_ohlc ?? [],
          futureOhlc: m.future_ohlc ?? [],
          historicalOhlc1d: m.historical_ohlc_1d ?? [],
          futureOhlc1d: m.future_ohlc_1d ?? [],
          startDate: m.start_date,
          endDate: m.end_date,
          historicalMa99: m.historical_ma99 ?? [],
          futureMa99: m.future_ma99 ?? [],
          historicalMa991d: m.historical_ma99_1d ?? [],
          futureMa991d: m.future_ma99_1d ?? [],
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
          consensusForecast1h: raw.stats.consensus_forecast_1h ?? [],
          consensusForecast1d: raw.stats.consensus_forecast_1d ?? [],
        },
        queryMa991h: raw.query_ma99_1h ?? [],
        queryMa991d: raw.query_ma99_1d ?? [],
        queryMa99Gap1h: mapGap(raw.query_ma99_gap_1h),
        queryMa99Gap1d: mapGap(raw.query_ma99_gap_1d),
      }
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
  ): Promise<{
    queryMa991h: (number | null)[]
    queryMa991d: (number | null)[]
    queryMa99Gap1h: Ma99Gap | null
    queryMa99Gap1d: Ma99Gap | null
  }> {
    const res = await axios.post<Ma99RawResponse>(`${API_BASE}/api/merge-and-compute-ma99`, {
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
      queryMa991h: raw.query_ma99_1h ?? [],
      queryMa991d: raw.query_ma99_1d ?? [],
      queryMa99Gap1h: mapGap(raw.query_ma99_gap_1h),
      queryMa99Gap1d: mapGap(raw.query_ma99_gap_1d),
    }
  }

  return { predict, computeMa99, loading, error }
}
