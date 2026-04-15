export interface DiaryItem {
  date: string
  text: string
}

export interface DiaryMilestone {
  milestone: string
  items: DiaryItem[]
}
