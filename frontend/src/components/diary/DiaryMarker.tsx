import { MARKER } from './timelinePrimitives'

// K-024 Phase 3 — timeline marker primitive (design §6.3 / §6.5).
// K-041 — unified with Homepage via props. Defaults match /diary values
// (cornerRadius 6, topInset 10); Homepage passes `borderRadius={0}` +
// `topInset={8}` to preserve K-023 AC-023-DIARY-BULLET (`borderRadius: 0px`)
// and K-028 AC-028-MARKER-COORD-INTEGRITY (`top: 8px`) Sacred invariants.
// `mobileVisible` default `false` preserves K-024 §6.8 hide-on-<sm; both
// consumers pass `true` after K-041 AC rewrite.

interface DiaryMarkerProps {
  mobileVisible?: boolean
  borderRadius?: number
  topInset?: number
}

export default function DiaryMarker({
  mobileVisible = false,
  borderRadius = MARKER.cornerRadius,
  topInset = MARKER.topInset,
}: DiaryMarkerProps) {
  const visibilityClass = mobileVisible ? 'block' : 'hidden sm:block'
  return (
    <div
      aria-hidden="true"
      data-testid="diary-marker"
      className={`${visibilityClass} absolute`}
      style={{
        width: MARKER.width,
        height: MARKER.height,
        borderRadius,
        backgroundColor: MARKER.color,
        left: MARKER.leftInset,
        top: topInset,
      }}
    />
  )
}
