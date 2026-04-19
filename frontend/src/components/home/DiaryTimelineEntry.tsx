import type { DiaryMilestone } from '../../types/diary'

interface DiaryTimelineEntryProps {
  milestone: DiaryMilestone
  isLast?: boolean
}

/**
 * Homepage Dev Diary timeline entry using absolute positioning
 * to match the Pencil design (layout:none frame with absolute rail + marker).
 *
 * Intended to replace DiaryPreviewEntry in DevDiarySection (Phase C).
 * The parent DevDiarySection must supply a relative-positioned container
 * with sufficient height per entry.
 */
export default function DiaryTimelineEntry({ milestone, isLast = false }: DiaryTimelineEntryProps) {
  return (
    <div className="relative pl-16 pb-6">
      {/* Vertical rail line — simulates Pencil rectangle rail (x:29, width:1, fill:#2A2520) */}
      {!isLast && (
        <div className="absolute left-7 top-4 bottom-0 w-px bg-[#2A2520]" />
      )}

      {/* Dot marker — simulates Pencil absolute marker (fill:#9C4A3B, w-5 h-3.5, cornerRadius:6) */}
      <span
        className="absolute left-5 top-2 w-5 h-3.5 rounded-sm bg-[#9C4A3B]"
        aria-hidden="true"
      />

      {/* Content */}
      <div>
        <span className="font-mono text-xs text-gray-500 block mb-0.5">
          {milestone.items[0]?.date ?? ''}
        </span>
        <p className="font-mono text-sm font-semibold text-white">{milestone.milestone}</p>
        {milestone.items.length > 1 && (
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            +{milestone.items.length - 1} more entries
          </p>
        )}
      </div>
    </div>
  )
}
