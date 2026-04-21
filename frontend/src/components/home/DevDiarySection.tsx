import { Link } from 'react-router-dom'
import type { DiaryMilestone } from '../../types/diary'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'

interface DevDiarySectionProps {
  milestones: DiaryMilestone[]
  loading: boolean
  error: string | null
}

// K-028: layout refactored from absolute positioning (ENTRY_HEIGHT=140 固定假設)
// to flex-col flow. Entry height is now content-driven — long text entries
// grow naturally and adjacent entries no longer overlap.
//
// Rail: single absolute <div aria-hidden> positioned inside the relative flex
// container, with top:40 / bottom:40 insets so it spans from the first marker
// center to the last marker center automatically (no totalHeight arithmetic).
//
// K-023 contracts preserved: marker 20x14 brick-dark radius 0 unchanged;
// diaryHead / subtitle / diaryViewAllRow unchanged.

export default function DevDiarySection({ milestones, loading, error }: DevDiarySectionProps) {
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

      {/* 介紹文字 */}
      <p className="font-['Newsreader'] text-[15px] italic text-[#1A1814] leading-relaxed mb-8">
        — A running log of decisions, fixes, and lessons from building this system.
      </p>

      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner label="載入日記中…" />
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      {!loading && !error && milestones.length > 0 && (
        <>
          {/* diaryEntries — flex-col flow layout (K-028) */}
          <div
            className="relative flex flex-col gap-5 mb-8"
            data-testid="diary-entries"
          >
            {/*
              Vertical rail — single absolute div spanning from first marker
              center (top: 40) to last marker center (bottom: 40). Height is
              derived from the flex wrapper's auto-grown size, not arithmetic.
            */}
            <div
              className="absolute w-px bg-[#2A2520]"
              style={{ left: 29, top: 40, bottom: 40 }}
              aria-hidden="true"
              data-testid="diary-rail"
            />

            {milestones.map((m) => (
              <div
                key={m.milestone}
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

                {/* Content flows in normal document order; height grows with text */}
                <p className="font-['Bodoni_Moda'] text-[18px] italic font-bold text-[#1A1814] leading-tight">
                  {m.milestone}
                </p>
                <span className="font-mono text-[12px] text-[#6B5F4E] tracking-wide block mt-0.5">
                  {m.items[0]?.date ?? ''}
                </span>
                {m.items[0]?.text && (
                  <p className="font-['Newsreader'] text-[18px] italic text-[#2A2520] leading-[1.55] mt-1 break-words">
                    {m.items[0].text}
                  </p>
                )}
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
