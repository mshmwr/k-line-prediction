import { Link } from 'react-router-dom'
import type { DiaryEntry } from '../../types/diary'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'

interface DevDiarySectionProps {
  entries: DiaryEntry[]
  loading: boolean
  error: string | null
}

// K-024 Phase 2 (flat schema consumer; preserves K-028 layout + K-023 marker).
//
// - entries is a pre-sliced DiaryEntry[] from useDiary(3).
// - Title renders `${ticketId} — ${title}` with em-dash U+2014 + single space on each side;
//   ticketId absent → title only (legacy-merge entry case).
// - Rail hidden when entries.length < 2 (1-entry boundary, design §4.3.1).
// - Sacred testids preserved: diary-entries / diary-rail / diary-entry-wrapper / diary-marker.
// - No second testid, no data-homepage-entry (per BQ-024-01 PM ruling (b), design §13 step 9).

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
      <p className="font-['Newsreader'] text-[15px] italic text-[#1A1814] leading-relaxed mb-8">
        — A running log of decisions, fixes, and lessons from building this system.
      </p>

      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner label="載入日記中…" />
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
            {/* Vertical rail — spans from first marker center (top:40) to last marker
                center (bottom:40). With 1 entry the inset math yields invisible/negative
                height, so we hide the rail entirely (design §4.3.1). */}
            {entries.length >= 2 && (
              <div
                className="absolute w-px bg-[#2A2520]"
                style={{ left: 29, top: 40, bottom: 40 }}
                aria-hidden="true"
                data-testid="diary-rail"
              />
            )}

            {entries.map((e) => (
              <div
                key={`${e.ticketId ?? 'no-id'}-${e.date}-${e.title}`}
                className="relative pl-[92px] min-h-[48px]"
                data-testid="diary-entry-wrapper"
              >
                {/* Marker — K-023 AC-023-DIARY-BULLET: 20x14 brick-dark radius 0 */}
                <div
                  className="absolute w-5 h-3.5 bg-brick-dark"
                  style={{ left: 20, top: 8 }}
                  aria-hidden="true"
                  data-testid="diary-marker"
                />

                <p className="font-['Bodoni_Moda'] text-[18px] italic font-bold text-[#1A1814] leading-tight">
                  {e.ticketId ? `${e.ticketId} — ${e.title}` : e.title}
                </p>
                <span className="font-mono text-[12px] text-[#6B5F4E] tracking-wide block mt-0.5">
                  {e.date}
                </span>
                <p className="font-['Newsreader'] text-[18px] italic text-[#2A2520] leading-[1.55] mt-1 break-words">
                  {e.text}
                </p>
              </div>
            ))}
          </div>

          {/* diaryViewAllRow */}
          <div className="flex justify-end w-full">
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
