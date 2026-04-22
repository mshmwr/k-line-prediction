// K-024 Phase 1+2 — minimum-touch reshape to keep tsc green until Phase 3 rewrite.
// This file is scheduled for deletion in Phase 3 (design §10 + §13 Phase 3 step 1).
// The DiaryItem type is inlined here to decouple from the new flat DiaryEntry shape
// in types/diary.ts; render behavior is unchanged.

interface DiaryItemLocal {
  date: string
  text: string
}

interface DiaryEntryProps {
  item: DiaryItemLocal
}

export default function DiaryEntry({ item }: DiaryEntryProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 py-3 sm:py-2">
      <span className="shrink-0 font-mono text-xs text-muted w-auto sm:w-24 sm:pt-0.5">{item.date}</span>
      <p className="text-sm text-ink/80 leading-relaxed break-words">{item.text}</p>
    </div>
  )
}
