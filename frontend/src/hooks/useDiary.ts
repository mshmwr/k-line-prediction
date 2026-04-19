import { useState, useEffect, useCallback } from 'react'
import type { DiaryMilestone } from '../types/diary'

interface DiaryState {
  entries: DiaryMilestone[]
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Fetch /diary.json and return diary milestones.
 *
 * @param limit - Maximum number of milestones to return.
 *   - Omitted or undefined → return all entries (full diary)
 *   - 0 → return empty array (no entries)
 *   - N > 0 → return first N entries
 *
 * Shared by HomePage (useDiary(3)) and DiaryPage (useDiary()).
 */
export function useDiary(limit?: number): DiaryState {
  const [entries, setEntries] = useState<DiaryMilestone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDiary = useCallback(() => {
    setLoading(true)
    setError(null)

    fetch('/diary.json')
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load diary: ${res.status}`)
        return res.json() as Promise<DiaryMilestone[]>
      })
      .then(data => {
        // limit === 0 → return empty array (explicit zero, not fallback)
        // limit > 0 → slice to limit
        // limit is undefined → return all
        const result = limit === 0 ? [] : limit !== undefined ? data.slice(0, limit) : data
        setEntries(result)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }, [limit])

  useEffect(() => {
    fetchDiary()
  }, [fetchDiary])

  return { entries, loading, error, refetch: fetchDiary }
}
