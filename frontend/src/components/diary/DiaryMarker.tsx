import { MARKER } from './timelinePrimitives'

// K-024 Phase 3 — /diary-only marker primitive (design §6.3 / §6.5).
// 20×14 brick-dark rectangle, cornerRadius 6 (per visual-spec.json wiDSi
// marker shape).
//
// NOTE — K-023 Sacred exception on Homepage:
// Homepage's DevDiarySection renders its marker INLINE (not via this component)
// because AC-023-DIARY-BULLET / AC-028-MARKER-COORD-INTEGRITY lock the Homepage
// marker at `borderRadius: 0px` (pages.spec.ts L203 / L410), which conflicts
// with visual-spec `cornerRadius: 6`. Design §0.2 bullet (1) explicitly holds
// Homepage radius 0 as a pre-existing invariant, overriding §9.1's
// "both frames import <DiaryMarker />" dedup recommendation.
// DiaryMarker is therefore scoped to /diary only; DevDiarySection keeps its
// inline marker preserving the Sacred shape. timelinePrimitives.ts remains
// the shared values SSOT for color/size/position (both consumers read it).

export default function DiaryMarker() {
  return (
    <div
      aria-hidden="true"
      data-testid="diary-marker"
      className="hidden sm:block absolute"
      style={{
        width: MARKER.width,
        height: MARKER.height,
        borderRadius: MARKER.cornerRadius,
        backgroundColor: MARKER.color,
        left: MARKER.leftInset,
        top: MARKER.topInset,
      }}
    />
  )
}
