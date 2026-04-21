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
    <div className="border border-ink/10 rounded-sm mb-4 sm:mb-3">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
      >
        <span className="font-mono text-sm font-semibold text-ink">{milestone.milestone}</span>
        <span className="text-muted text-lg leading-none">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-ink/10 divide-y divide-ink/5 overflow-hidden">
          {milestone.items.map((item, i) => (
            <DiaryEntry key={i} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
