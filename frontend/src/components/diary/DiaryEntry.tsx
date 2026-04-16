import type { DiaryItem } from '../../types/diary'

interface DiaryEntryProps {
  item: DiaryItem
}

export default function DiaryEntry({ item }: DiaryEntryProps) {
  return (
    <div className="flex gap-4 py-2">
      <span className="shrink-0 font-mono text-xs text-gray-500 pt-0.5 w-24">{item.date}</span>
      <p className="text-sm text-gray-300 leading-relaxed">{item.text}</p>
    </div>
  )
}
