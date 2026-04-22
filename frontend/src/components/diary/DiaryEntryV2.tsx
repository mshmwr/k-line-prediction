import type { DiaryEntry } from '../../types/diary'
import DiaryMarker from './DiaryMarker'

// K-024 Phase 3 — /diary flat 3-layer entry (design §6.1 / §6.3 / §6.5 / §6.8).
// Replaces old DiaryEntry.tsx. Wrapped in <li> by DiaryTimeline; this component
// is an <article> that holds:
//   - DiaryMarker (absolute-positioned at left:20 top:10)
//   - <h2> entry-title — "K-XXX — <title>" (em-dash U+2014) or plain title
//   - <time> entry-date
//   - <p> entry-body
//
// Mobile (<sm): marker hidden (via DiaryMarker's hidden sm:block), paddingLeft
// collapses to 0. Desktop: pl-[92px] aligns text past the rail (x=29) + marker
// (x=20, width=20) + breathing room.

interface DiaryEntryV2Props {
  entry: DiaryEntry
}

export default function DiaryEntryV2({ entry }: DiaryEntryV2Props) {
  const title = entry.ticketId ? `${entry.ticketId} — ${entry.title}` : entry.title
  return (
    <article
      className="relative pl-0 sm:pl-[92px] min-h-[48px]"
      data-testid="diary-entry"
    >
      <DiaryMarker />
      <h2 className="font-['Bodoni_Moda'] italic font-bold text-[16px] sm:text-[18px] text-[#1A1814]">
        {title}
      </h2>
      <time
        dateTime={entry.date}
        className="block font-mono text-[11px] sm:text-[12px] text-[#6B5F4E] tracking-wide mt-1"
      >
        {entry.date}
      </time>
      <p className="font-['Newsreader'] italic text-[16px] sm:text-[18px] text-[#2A2520] leading-[1.55] mt-2 break-words">
        {entry.text}
      </p>
    </article>
  )
}
