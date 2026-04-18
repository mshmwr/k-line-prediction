import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import type { DiaryMilestone } from '../../types/diary'
import SectionHeader from '../common/SectionHeader'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'
import DiaryPreviewEntry from './DiaryPreviewEntry'

interface DevDiarySectionProps {
  milestones: DiaryMilestone[]
  loading: boolean
  error: string | null
}

export default function DevDiarySection({ milestones, loading, error }: DevDiarySectionProps) {
  return (
    <section className="py-16 px-6 max-w-3xl mx-auto">
      <SectionHeader
        label="DEV DIARY"
        labelColor="pink"
        title="Development Log"
        description="Session-by-session record of how this project was built."
        icon={BookOpen}
      />

      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner label="載入日記中…" />
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <>
          <div className="space-y-3 mb-6">
            {milestones.map((m, i) => (
              <DiaryPreviewEntry key={i} milestone={m} defaultOpen={i === 0} />
            ))}
          </div>
          <div className="text-center">
            <Link
              to="/diary"
              className="font-mono text-sm text-purple-400 underline hover:text-purple-300"
            >
              View full diary →
            </Link>
          </div>
        </>
      )}
    </section>
  )
}
