import { useState } from 'react'
import type { DiaryMilestone } from '../../types/diary'
import DiaryEntry from './DiaryEntry'

interface MilestoneSectionProps {
  milestone: DiaryMilestone
  defaultOpen?: boolean
}

export default function MilestoneSection({ milestone, defaultOpen = false }: MilestoneSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-white/10 rounded-sm mb-3">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
      >
        <span className="font-mono text-sm font-semibold text-white">{milestone.milestone}</span>
        <span className="text-gray-500 text-lg leading-none">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-white/10 divide-y divide-white/5">
          {milestone.items.map((item, i) => (
            <DiaryEntry key={i} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
