import { useState } from 'react'
import type { DiaryMilestone } from '../../types/diary'

interface DiaryPreviewEntryProps {
  milestone: DiaryMilestone
  defaultOpen?: boolean
}

export default function DiaryPreviewEntry({ milestone, defaultOpen = false }: DiaryPreviewEntryProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-white/10 rounded-sm">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
      >
        <span className="font-mono text-sm font-semibold text-white">{milestone.milestone}</span>
        <span className="text-gray-500">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-4 pb-3 border-t border-white/10 space-y-2 pt-2">
          {milestone.items.map((item, i) => (
            <div key={i} className="flex gap-3">
              <span className="shrink-0 font-mono text-xs text-gray-500 w-24">{item.date}</span>
              <p className="text-xs text-gray-400 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
