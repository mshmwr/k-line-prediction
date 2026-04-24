import { Link } from 'react-router-dom'
import type { DiaryEntry } from '../../types/diary'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'
import DiaryRail from '../diary/DiaryRail'
import DiaryMarker from '../diary/DiaryMarker'

interface DevDiarySectionProps {
  entries: DiaryEntry[]
  loading: boolean
  error: string | null
}

// K-024 Phase 3 (flat schema consumer; preserves K-023 + K-028 Sacred layout).
//
// - entries is a pre-sliced DiaryEntry[] from useDiary(3).
// - Title renders `${ticketId} — ${title}` with em-dash U+2014 + single space
//   each side; ticketId absent → title only (legacy-merge entry case).
// - Rail hidden when entries.length < 2 (1-entry boundary, design §4.3.1).
// - Sacred testids preserved: diary-entries / diary-rail / diary-entry-wrapper
//   / diary-marker.
//
// K-041 — inline rail/marker consolidated into shared <DiaryRail /> +
// <DiaryMarker /> components. Homepage's Sacred divergences are passed as
// props: rail `mobileVisible` (K-028), marker `mobileVisible` + `borderRadius={0}`
// (K-023 AC-023-DIARY-BULLET) + `topInset={8}` (K-028 AC-028-MARKER-COORD-INTEGRITY).
// The 1-entry hide-rail boundary stays at consumer (`entries.length >= 2`).

const HOMEPAGE_MARKER_TOP_INSET = 8 // K-023 Sacred, not MARKER.topInset (10)

export default function DevDiarySection({ entries, loading, error }: DevDiarySectionProps) {
  return (
    <section>
      {/* diaryHead */}
      <div className="flex items-center gap-4 w-full mb-4">
        <span
          className="font-mono text-[16px] font-bold tracking-widest text-[#F4EFE5] bg-[#9C4A3B] -rotate-3 px-3.5 py-2 inline-block"
        >
          § DEV DIARY
        </span>
        <div className="flex-1 h-px bg-[#8B7A6B]" />
        <span className="font-mono text-[11px] text-[#1A1814] tracking-widest">
          DEVELOPMENT LOG
        </span>
      </div>

      {/* Section intro */}
      <p className="text-[14px] text-[#1A1814] leading-relaxed mb-8">
        — A running log of decisions, fixes, and lessons from building this system.
      </p>

      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner label="Loading diary…" />
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      {!loading && !error && entries.length > 0 && (
        <>
          {/* diaryEntries — flex-col flow layout (K-028) */}
          <div
            className="relative flex flex-col gap-5 mb-8"
            data-testid="diary-entries"
          >
            {entries.length >= 2 && <DiaryRail mobileVisible />}

            {entries.map((e) => (
              <div
                key={`${e.ticketId ?? 'no-id'}-${e.date}-${e.title}`}
                className="relative pl-[92px] min-h-[48px]"
                data-testid="diary-entry-wrapper"
              >
                <DiaryMarker
                  mobileVisible
                  borderRadius={0}
                  topInset={HOMEPAGE_MARKER_TOP_INSET}
                />

                <p className="text-[16px] font-bold text-[#1A1814] leading-tight">
                  {e.ticketId ? `${e.ticketId} — ${e.title}` : e.title}
                </p>
                <span className="font-mono text-[12px] text-[#6B5F4E] tracking-wide block mt-0.5">
                  {e.date}
                </span>
                <p className="text-[15px] text-[#2A2520] leading-[1.55] mt-1 break-words">
                  {e.text}
                </p>
              </div>
            ))}
          </div>

          {/* diaryViewAllRow — K-040 Item 4: 40px top margin per Designer memo (frame yg0qF padding-top). */}
          <div className="flex justify-end w-full mt-10">
            <Link
              to="/diary"
              className="font-mono text-[12px] font-bold text-[#9C4A3B] tracking-wide hover:underline"
            >
              — View full log →
            </Link>
          </div>
        </>
      )}
    </section>
  )
}
