import type { DiaryEntry } from '../../types/diary'
import DiaryRail from './DiaryRail'
import DiaryEntryV2 from './DiaryEntryV2'

// K-024 Phase 3 — /diary flat timeline (design §6.1 / §6.6).
// Replaces the old MilestoneSection accordion. Semantic <ol role="list">
// (ordered by date desc; role preserves SR announcement under list-style:none
// per WebKit). Rail is a shared primitive inside the container; each entry is
// wrapped in <li>. Key uses ticketId+date+title composite to remain stable for
// legacy-merge entry (no ticketId).

interface DiaryTimelineProps {
  entries: DiaryEntry[]
}

export default function DiaryTimeline({ entries }: DiaryTimelineProps) {
  return (
    <ol
      role="list"
      className="list-none p-0 m-0 relative flex flex-col gap-8 sm:gap-10"
    >
      <DiaryRail />
      {entries.map((e) => (
        <li
          key={`${e.ticketId ?? 'no-id'}-${e.date}-${e.title}`}
          className="m-0 p-0"
        >
          <DiaryEntryV2 entry={e} />
        </li>
      ))}
    </ol>
  )
}
