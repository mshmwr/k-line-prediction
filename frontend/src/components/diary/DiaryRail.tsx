import { RAIL } from './timelinePrimitives'

// K-024 Phase 3 — shared timeline rail (design §6.3 / §6.5 / §9.1).
// Absolute-positioned 1px vertical line inside the timeline container.
// Hidden on mobile (<sm, 640px) per design §6.8; consumers control visibility
// via Tailwind responsive classes only. Color / width / x-offset read from
// timelinePrimitives.ts (derived from visual-spec.json wiDSi + N0WWY shared
// primitive).

export default function DiaryRail() {
  return (
    <div
      aria-hidden="true"
      data-testid="diary-rail"
      className="hidden sm:block absolute"
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
