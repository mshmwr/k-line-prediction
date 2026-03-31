import { useState } from 'react'
import axios from 'axios'
import { OHLCRow, PredictResponse } from '../types'

export function usePrediction() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function predict(ohlcRows: OHLCRow[], selectedIds: string[]): Promise<PredictResponse | null> {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post<PredictResponse>('/api/predict', {
        ohlc_data: ohlcRows.map(r => ({
          open: Number(r.open), high: Number(r.high),
          low: Number(r.low), close: Number(r.close)
        })),
        selected_ids: selectedIds,
      })
      return res.data
    } catch (e) {
      setError('Prediction failed. Is the backend running?')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { predict, loading, error }
}
