import { useDiary } from '../hooks/useDiary'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import DiaryTimeline from '../components/diary/DiaryTimeline'
import UnifiedNavBar from '../components/UnifiedNavBar'

// K-024 Phase 1+2 — minimum-touch reshape. Real /diary rewrite lands in Phase 3
// (design §6, §13 Phase 3). Here we adapt the new flat DiaryEntry[] into the old
// nested milestone shape (1 flat entry → 1 synthetic milestone with 1 item) so
// the existing accordion DOM still renders without crashing.
//
// Expected test fallout during the Phase 1+2 PR window (per design §13 step 12):
//   AC-DIARY-1 three accordion tests in e2e/pages.spec.ts may fail because the
//   milestone titles now carry a K-XXX prefix + em-dash (e.g. "K-031 — Remove
//   Built by AI showcase section from /about"). These tests are rewritten in
//   Phase 3; failure is accepted during this PR.

export default function DiaryPage() {
  const { entries, loading, error, refetch } = useDiary()

  // Adapter: flat DiaryEntry[] → synthetic nested milestones for legacy Timeline.
  const syntheticMilestones = entries.map((e) => ({
    milestone: e.ticketId ? `${e.ticketId} — ${e.title}` : e.title,
    items: [{ date: e.date, text: e.text }],
  }))

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

        {!loading && !error && syntheticMilestones.length > 0 && (
          <DiaryTimeline milestones={syntheticMilestones} />
        )}
      </div>
    </div>
  )
}
