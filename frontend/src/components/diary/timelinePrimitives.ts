// K-024 — shared timeline primitives, derived from docs/designs/K-024-visual-spec.json
// (crossFrameConsistency.sharedPrimitives). Any change to visual-spec.json for the
// diary rail / marker / entry typography roles propagates here; consumers are:
//   - DevDiarySection (Homepage, inline render)
//   - DiaryRail / DiaryMarker / DiaryEntryV2 (Phase 3 /diary components)
//
// Added in Phase 1+2 as a pre-placed contract so Phase 3 components can import
// without further design churn. Phase 2 DevDiarySection currently inlines the
// equivalent literal values; Phase 3 will refactor both sides to import here.

export const RAIL = {
  width: 1,
  color: '#2A2520',
  xOffset: 29,
  topInset: 40,
  bottomInset: 40,
} as const

export const MARKER = {
  width: 20,
  height: 14,
  cornerRadius: 6,
  color: '#9C4A3B',
  leftInset: 20,
  topInset: 10,
} as const

export const ENTRY_TYPE = {
  title: {
    font: 'Geist Mono, ui-monospace, monospace',
    style: 'normal',
    size: 16,
    weight: 700,
    color: '#1A1814',
  },
  date: {
    font: 'Geist Mono, monospace',
    size: 12,
    color: '#6B5F4E',
    letterSpacing: 1,
  },
  body: {
    font: 'Geist Mono, ui-monospace, monospace',
    style: 'normal',
    size: 15,
    lineHeight: 1.55,
    color: '#2A2520',
  },
} as const
