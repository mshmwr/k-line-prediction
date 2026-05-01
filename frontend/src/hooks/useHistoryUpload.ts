import { useEffect, useState } from 'react'
import { API_BASE } from '../utils/api'

export type HistoryEntry = { filename: string; latest: string | null; bar_count: number; freshness_hours: number | null }
export type HistoryInfo = { '1H': HistoryEntry; '1D': HistoryEntry }

/**
 * Fetches /api/history-info once on mount and exposes the result.
 * Used on: AppPage
 */
export function useHistoryUpload(): { historyInfo: HistoryInfo | null } {
  const [historyInfo, setHistoryInfo] = useState<HistoryInfo | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/history-info`)
      .then(r => r.json())
      .then(data => setHistoryInfo(data as HistoryInfo))
      .catch(() => {})
  }, [])

  return { historyInfo }
}
