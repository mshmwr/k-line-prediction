import MilestoneSection from './MilestoneSection'

// K-024 Phase 1+2 — minimum-touch reshape to keep tsc green until Phase 3 rewrite.
// This file will be rewritten to an <ol> + flat entries structure in Phase 3
// (design §6.1, §6.6). The DiaryMilestone type is inlined here to decouple from
// the new flat schema.

interface DiaryMilestoneLocal {
  milestone: string
  items: { date: string; text: string }[]
}

interface DiaryTimelineProps {
  milestones: DiaryMilestoneLocal[]
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
