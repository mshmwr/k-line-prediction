import type { DiaryItem } from '../../types/diary'

interface DiaryEntryProps {
  item: DiaryItem
}

export default function DiaryEntry({ item }: DiaryEntryProps) {
  return (
    <div className="flex gap-4 py-2">
      <span className="shrink-0 font-mono text-xs text-muted pt-0.5 w-24">{item.date}</span>
      <p className="text-sm text-ink/80 leading-relaxed">{item.text}</p>
    </div>
  )
}
