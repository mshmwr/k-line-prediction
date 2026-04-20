import { useDiary } from '../hooks/useDiary'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import DiaryTimeline from '../components/diary/DiaryTimeline'
import UnifiedNavBar from '../components/UnifiedNavBar'

export default function DiaryPage() {
  const { entries, loading, error, refetch } = useDiary()

  return (
    <div className="min-h-screen">
      <UnifiedNavBar />
      <div className="px-6 py-16 max-w-3xl mx-auto">
        <h1 className="text-3xl font-mono font-bold mb-2">Development Diary</h1>
        <p className="text-muted mb-10 text-sm">Session-by-session log of this project's build.</p>

        {loading && (
          <div className="flex justify-center py-16">
            <LoadingSpinner label="載入日記中…" />
          </div>
        )}

        {error && <ErrorMessage message={error} onRetry={refetch} />}

        {!loading && !error && entries.length > 0 && (
          <DiaryTimeline milestones={entries} />
        )}
      </div>
    </div>
  )
}
