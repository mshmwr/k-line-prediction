import MetricCard from './MetricCard'

const METRICS = [
  {
    title: 'Features Shipped',
    subtext: '17 tickets, K-001 → K-017',
  },
  {
    title: 'First-pass Review Rate',
    subtext: 'Reviewer catches issues before QA on most tickets',
  },
  {
    title: 'Post-mortems Written',
    subtext: 'Every ticket has cross-role retrospective',
  },
  {
    title: 'Guardrails in Place',
    subtext: 'Bug Found Protocol, per-role retro logs, audit script',
  },
] as const

/**
 * S2 — MetricsStripSection (AC-017-METRICS)
 * 4 narrative metrics, no exact percentages.
 */
export default function MetricsStripSection() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {METRICS.map(({ title, subtext }) => (
        <MetricCard key={title} title={title} subtext={subtext} />
      ))}
    </div>
  )
}
