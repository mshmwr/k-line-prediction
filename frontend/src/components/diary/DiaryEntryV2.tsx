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
// K-041 — marker visible on mobile (via DiaryMarker `mobileVisible`);
// paddingLeft pl-[92px] at all viewports to align text past rail (x=29) +
// marker (x=20, width=20) + breathing room. Supersedes K-024 §6.8 mobile
// pl-0 / hidden-marker rule (see PRD L786 AC-024-CONTENT-WIDTH rewrite).

interface DiaryEntryV2Props {
  entry: DiaryEntry
}

export default function DiaryEntryV2({ entry }: DiaryEntryV2Props) {
  const title = entry.ticketId ? `${entry.ticketId} — ${entry.title}` : entry.title
  return (
    <article
      className="relative pl-[92px] min-h-[48px]"
      data-testid="diary-entry"
    >
      <DiaryMarker mobileVisible />
      <h2 className="font-['Bodoni_Moda'] italic font-bold text-[16px] sm:text-[18px] text-[#1A1814]">
        {title}
      </h2>
      <time
        dateTime={entry.date}
        // letter-spacing: 1px (K-024 visual-spec wiDSi entry-date.font.letterSpacing=1)
        // NOT tracking-wide (0.025em → 0.3px at 12px font, off-spec).
        className="block font-mono text-[11px] sm:text-[12px] text-[#6B5F4E] tracking-[1px] mt-1"
      >
        {entry.date}
      </time>
      <p className="font-['Newsreader'] italic text-[16px] sm:text-[18px] text-[#2A2520] leading-[1.55] mt-2 break-words">
        {entry.text}
      </p>
    </article>
  )
}
