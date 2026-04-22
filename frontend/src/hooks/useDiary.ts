import { useState, useEffect, useCallback } from 'react'
import { ZodError } from 'zod'
import { DiaryJsonSchema } from '../types/diary'
import type { DiaryEntry } from '../types/diary'
import { sortDiary } from '../utils/diarySort'

interface DiaryState {
  entries: DiaryEntry[]
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * K-024 Phase 2 — fetch /diary.json and return flat DiaryEntry[] (sorted).
 *
 * - Returns entries sorted by date desc, tie-break array-index desc (design §3.5).
 * - zod validates the response body; invalid data → error state, entries stays [].
 * - limit:
 *     undefined → return all sorted entries
 *     0         → return []
 *     N > 0     → return first N after sort
 *
 * Shared by HomePage (useDiary(3)) and DiaryPage (useDiary()).
 */
export function useDiary(limit?: number): DiaryState {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDiary = useCallback(() => {
    setLoading(true)
    setError(null)

    fetch('/diary.json')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load diary: ${res.status}`)
        return res.json()
      })
      .then((data: unknown) => {
        const parsed = DiaryJsonSchema.parse(data) // zod validates; throws on schema violation
        const sorted = sortDiary(parsed)
        const result =
          limit === 0 ? [] : limit !== undefined ? sorted.slice(0, limit) : sorted
        setEntries(result)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (err instanceof ZodError) {
          setError('Invalid diary data format')
        } else if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('Unknown error loading diary')
        }
        setLoading(false)
      })
  }, [limit])

  useEffect(() => {
    fetchDiary()
  }, [fetchDiary])

  return { entries, loading, error, refetch: fetchDiary }
}
