import { useEffect } from 'react'
import type { DiaryMilestone } from '../types/diary'
import { useAsyncState } from '../hooks/useAsyncState'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import DiaryTimeline from '../components/diary/DiaryTimeline'
import UnifiedNavBar from '../components/UnifiedNavBar'

export default function DiaryPage() {
  const [state, actions] = useAsyncState<DiaryMilestone[]>()

  const fetchDiary = () => {
    actions.setLoading()
    fetch('/diary.json')
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load diary: ${res.status}`)
        return res.json() as Promise<DiaryMilestone[]>
      })
      .then(actions.setSuccess)
      .catch((err: Error) => actions.setError(err.message))
  }

  useEffect(() => {
    fetchDiary()
  }, [])

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <UnifiedNavBar />
      <div className="px-6 py-16 max-w-3xl mx-auto">
      <h1 className="text-3xl font-mono font-bold mb-2">Development Diary</h1>
      <p className="text-gray-400 mb-10 text-sm">Session-by-session log of this project's build.</p>

      {state.status === 'loading' && (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      )}

      {state.status === 'error' && (
        <ErrorMessage message={state.error!} onRetry={fetchDiary} />
      )}

      {state.status === 'success' && state.data && (
        <DiaryTimeline milestones={state.data} />
      )}
      </div>
    </div>
  )
}
