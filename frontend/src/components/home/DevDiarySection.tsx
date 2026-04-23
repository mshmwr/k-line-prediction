import { Link } from 'react-router-dom'
import type { DiaryEntry } from '../../types/diary'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'
import { RAIL, MARKER } from '../diary/timelinePrimitives'

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
// K-023 Sacred exception (design §0.2 bullet 1):
//   Homepage marker MUST render borderRadius: 0 (K-023 AC-023-DIARY-BULLET /
//   AC-028-MARKER-COORD-INTEGRITY assert `borderRadius === '0px'`). This
//   conflicts with visual-spec cornerRadius:6, so DevDiarySection keeps its
//   marker inline rather than importing the shared <DiaryMarker /> component
//   (which renders radius:6 for /diary). timelinePrimitives.MARKER constants
//   still feed color / size / position — only cornerRadius diverges.
//   The same rationale extends to rail: K-028 locks top:40 bottom:40 and
//   always-visible on mobile; DiaryRail hides on <sm, so DevDiarySection
//   keeps rail inline too. See design §9.1 + §0.2 for the contract.
//
// Marker top:8 carries over from pre-K-024 inline render (K-023 Sacred
// coordinate, verified by AC-028-MARKER-COORD-INTEGRITY). Not changed to
// MARKER.topInset (10) because that would shift the marker 2px downward on
// Homepage — a non-design-doc-ordained visual change.

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
            {/* Vertical rail — spans from first marker center (top:40) to last
                marker center (bottom:40). With 1 entry the inset math yields
                invisible/negative height, so we hide the rail entirely
                (design §4.3.1). Kept inline (not <DiaryRail />) to preserve
                K-028 always-visible-on-mobile behavior. Values from RAIL const
                (timelinePrimitives.ts) — shared with /diary for cross-frame
                consistency. */}
            {entries.length >= 2 && (
              <div
                className="absolute"
                style={{
                  width: RAIL.width,
                  backgroundColor: RAIL.color,
                  left: RAIL.xOffset,
                  top: RAIL.topInset,
                  bottom: RAIL.bottomInset,
                }}
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
                {/* Marker — K-023 AC-023-DIARY-BULLET Sacred: 20x14 brick-dark,
                    borderRadius 0 (NOT MARKER.cornerRadius=6). Kept inline to
                    enforce radius:0 which differs from /diary's DiaryMarker. */}
                <div
                  className="absolute"
                  style={{
                    width: MARKER.width,
                    height: MARKER.height,
                    backgroundColor: MARKER.color,
                    left: MARKER.leftInset,
                    top: HOMEPAGE_MARKER_TOP_INSET,
                    // borderRadius intentionally omitted → 0 (K-023 Sacred)
                  }}
                  aria-hidden="true"
                  data-testid="diary-marker"
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
