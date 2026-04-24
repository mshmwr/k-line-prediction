import { RAIL } from './timelinePrimitives'

// K-024 Phase 3 — shared timeline rail (design §6.3 / §6.5 / §9.1).
// K-041 — `mobileVisible` prop consolidates Homepage + /diary into one
// component. Default `false` preserves K-024 §6.8 hide-on-<sm; `/diary` and
// Homepage pass `true` after K-041 AC-024-CONTENT-WIDTH rewrite. Consumer
// controls conditional render (e.g., Homepage 1-entry boundary via
// `entries.length >= 2 &&`); DiaryRail itself is unconditional visual.

interface DiaryRailProps {
  mobileVisible?: boolean
}

export default function DiaryRail({ mobileVisible = false }: DiaryRailProps) {
  const visibilityClass = mobileVisible ? 'block' : 'hidden sm:block'
  return (
    <div
      aria-hidden="true"
      data-testid="diary-rail"
      className={`${visibilityClass} absolute`}
      style={{
        width: RAIL.width,
        backgroundColor: RAIL.color,
        left: RAIL.xOffset,
        top: RAIL.topInset,
        bottom: RAIL.bottomInset,
      }}
    />
  )
}
