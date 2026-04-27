import MetricCard from './MetricCard'
import siteContent from '@/content/site-content.json'

/**
 * S2 — MetricsStripSection (K-034 Phase 2 §7 Step 3 — D-2/D-3/D-26/D-27)
 * Used on: /about
 *
 * Pencil frame BF4Xe — 4 metric cards; section has NO internal h2 and NO subtitle
 * (SectionLabelRow "Nº 01 — DELIVERY METRICS" owns the heading per AboutPage.tsx).
 *
 * K-052: metric values now driven by content/site-content.json (JSON-is-SSOT).
 *   m1 FILE Nº 01: bigNumber=featuresShipped.value + title="Features Shipped" (width 100)
 *   m2 FILE Nº 02: title="Documented AC Coverage" + subtext="{covered}/{total}({%})" (width 140)
 *   m3 FILE Nº 03: bigNumber=postMortemsWritten.value + title="Post-mortems Written" (width 110)
 *   m4 FILE Nº 04: bigNumber=lessonsCodified.value + title="Lessons Codified" (width 90)
 */

const { metrics } = siteContent

export default function MetricsStripSection() {
  const acPercent = metrics.acCoverage.total > 0
    ? Math.round((metrics.acCoverage.covered / metrics.acCoverage.total) * 100)
    : 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px]">
      {/* m1 — Features Shipped */}
      <MetricCard
        fileNo={1}
        bigNumber={String(metrics.featuresShipped.value ?? '')}
        title="Features Shipped"
        redacted={{ width: 'w-[100px]' }}
      />
      {/* m2 — Documented AC Coverage */}
      <MetricCard
        fileNo={2}
        title="Documented AC Coverage"
        subtext={`${metrics.acCoverage.covered} / ${metrics.acCoverage.total} (${acPercent}%)`}
        redacted={{ width: 'w-[140px]' }}
      />
      {/* m3 — Post-mortems Written */}
      <MetricCard
        fileNo={3}
        bigNumber={String(metrics.postMortemsWritten.value ?? '')}
        title="Post-mortems Written"
        redacted={{ width: 'w-[110px]' }}
      />
      {/* m4 — Lessons Codified */}
      <MetricCard
        fileNo={4}
        bigNumber={metrics.lessonsCodified.value != null ? String(metrics.lessonsCodified.value) : undefined}
        title="Lessons Codified"
        redacted={{ width: 'w-[90px]' }}
      />
    </div>
  )
}
