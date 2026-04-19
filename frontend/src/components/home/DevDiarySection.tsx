import { Link } from 'react-router-dom'
import type { DiaryMilestone } from '../../types/diary'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'

interface DevDiarySectionProps {
  milestones: DiaryMilestone[]
  loading: boolean
  error: string | null
}

const ENTRY_HEIGHT = 140
const ENTRY_GAP = 20

export default function DevDiarySection({ milestones, loading, error }: DevDiarySectionProps) {
  const totalHeight = milestones.length > 0
    ? (milestones.length - 1) * (ENTRY_HEIGHT + ENTRY_GAP) + ENTRY_HEIGHT
    : 0

  return (
    <section className="py-16 px-6 max-w-5xl mx-auto">
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
          {/* diaryEntries — absolute positioning layout */}
          <div className="relative mb-8" style={{ height: totalHeight }}>
            {/* Vertical rail */}
            <div
              className="absolute w-px bg-[#2A2520]"
              style={{
                left: 29,
                top: 40,
                height: Math.max(0, totalHeight - 40),
              }}
              aria-hidden="true"
            />

            {milestones.map((m, i) => {
              const top = i * (ENTRY_HEIGHT + ENTRY_GAP)
              return (
                <div key={i} className="absolute w-full" style={{ top }}>
                  {/* Marker */}
                  <div
                    className="absolute w-5 h-3.5 bg-[#9C4A3B] rounded-[6px]"
                    style={{ left: 20, top: 8 }}
                    aria-hidden="true"
                  />

                  {/* Content */}
                  <div className="absolute" style={{ left: 92 }}>
                    <p className="font-['Bodoni_Moda'] text-[18px] italic font-bold text-[#1A1814] leading-tight">
                      {m.milestone}
                    </p>
                    <span className="font-mono text-[12px] text-[#6B5F4E] tracking-wide block mt-0.5">
                      {m.items[0]?.date ?? ''}
                    </span>
                    {m.items[0]?.text && (
                      <p className="font-['Newsreader'] text-[18px] italic text-[#2A2520] leading-[1.55] mt-1">
                        {m.items[0].text}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
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
