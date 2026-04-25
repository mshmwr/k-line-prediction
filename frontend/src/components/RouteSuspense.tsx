/**
 * K-049 Phase 3 — RouteSuspense.tsx
 *
 * Minimal loading skeleton rendered while React.lazy chunks resolve for a
 * route transition. No props — a single instance wraps <Routes> in main.tsx.
 *
 * Design notes:
 * - bg-[#F4EFE5] matches the site-wide paper background so 4 of 5 routes
 *   show no color flash during Suspense. /app mounts a dark bg AFTER the
 *   chunk resolves — residual paper-flash is ~100ms, equivalent to the
 *   pre-lazy first-paint reflow (architect §8.2 K-030 row: acceptable).
 * - No animation per K-030 isolation (nothing that could leak token/keyframe
 *   across route boundaries).
 * - data-testid="route-suspense" exposed for Playwright timing probes when
 *   specs need to wait for the fallback to exit (AC-049-SUSPENSE-1).
 *
 * Used on: frontend/src/main.tsx (1 consumer).
 */

export default function RouteSuspense() {
  return (
    <div
      data-testid="route-suspense"
      className="min-h-screen bg-[#F4EFE5]"
      aria-busy="true"
      aria-live="polite"
    />
  )
}
