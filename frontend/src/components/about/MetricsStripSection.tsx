import MetricCard from './MetricCard'

/**
 * S2 — MetricsStripSection (K-034 Phase 2 §7 Step 3 — D-2/D-3/D-26/D-27)
 * Used on: /about
 *
 * Pencil frame BF4Xe — 4 metric cards; section has NO internal h2 and NO subtitle
 * (SectionLabelRow "Nº 01 — DELIVERY METRICS" owns the heading per AboutPage.tsx).
 *
 * METRICS array mirrors Pencil verbatim:
 *   m1 FILE Nº 01: "17" + "Features Shipped" + "17 tickets, K-001 → K-017" (width 100)
 *   m2 FILE Nº 02: "First-pass Review Rate" + visible subtext + note (width 140)
 *   m3 FILE Nº 03: "Post-mortems Written" + visible subtext + note (width 110)
 *   m4 FILE Nº 04: "3" + "Guardrails in Place" + note (width 90)
 */
const METRICS = [
  {
    fileNo: 1,
    bigNumber: '17',
    title: 'Features Shipped',
    note: '17 tickets, K-001 → K-017',
    redacted: { width: 'w-[100px]' },
  },
  {
    fileNo: 2,
    title: 'First-pass Review Rate',
    subtext: 'Reviewer catches issues before QA on most tickets',
    note: '— classification: NARRATIVE, un-metered.',
    redacted: { width: 'w-[140px]' },
  },
  {
    fileNo: 3,
    title: 'Post-mortems Written',
    subtext: 'Every ticket has cross-role retrospective',
    note: '— filed per ticket, countersigned by PM.',
    redacted: { width: 'w-[110px]' },
  },
  {
    fileNo: 4,
    bigNumber: '3',
    title: 'Guardrails in Place',
    note: 'Bug Found Protocol, per-role retro logs, audit script',
    redacted: { width: 'w-[90px]' },
  },
] as const

export default function MetricsStripSection() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px]">
      {METRICS.map(metric => (
        <MetricCard key={metric.fileNo} {...metric} />
      ))}
    </div>
  )
}
