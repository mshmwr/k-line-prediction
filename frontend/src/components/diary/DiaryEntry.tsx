import type { DiaryItem } from '../../types/diary'

interface DiaryEntryProps {
  item: DiaryItem
}

export default function DiaryEntry({ item }: DiaryEntryProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 py-3 sm:py-2">
      <span className="shrink-0 font-mono text-xs text-muted w-auto sm:w-24 sm:pt-0.5">{item.date}</span>
      <p className="text-sm text-ink/80 leading-relaxed break-words">{item.text}</p>
    </div>
  )
}
