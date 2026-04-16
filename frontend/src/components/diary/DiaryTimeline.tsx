import type { DiaryMilestone } from '../../types/diary'
import MilestoneSection from './MilestoneSection'

interface DiaryTimelineProps {
  milestones: DiaryMilestone[]
}

export default function DiaryTimeline({ milestones }: DiaryTimelineProps) {
  return (
    <div>
      {milestones.map((m, i) => (
        <MilestoneSection key={i} milestone={m} defaultOpen={i === 0} />
      ))}
    </div>
  )
}
