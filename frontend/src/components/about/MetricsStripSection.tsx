import MetricCard from './MetricCard'

const METRICS = [
  {
    title: 'Features Shipped',
    subtext: '17 tickets, K-001 → K-017',
    redacted: false,
  },
  {
    title: 'First-pass Review Rate',
    subtext: 'Reviewer catches issues before QA on most tickets',
    redacted: true,  // A-5: classified metric
  },
  {
    title: 'Post-mortems Written',
    subtext: 'Every ticket has cross-role retrospective',
    redacted: false,
  },
  {
    title: 'Guardrails in Place',
    subtext: 'Bug Found Protocol, per-role retro logs, audit script',
    redacted: false,
  },
] as const

/**
 * S2 — MetricsStripSection (AC-017-METRICS)
 * 4 narrative metrics, no exact percentages.
 * A-4: italic subtitle below section h2 (handled in AboutPage SectionLabelRow + section h2).
 */
export default function MetricsStripSection() {
  return (
    <div>
      <h2 className="font-mono font-bold text-ink text-2xl mb-2">Delivery Metrics</h2>
      <p
        className="font-italic italic text-[15px] text-ink leading-relaxed mb-6"
        data-section-subtitle
      >
        Numbers that tell the story of how this project evolved.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map(({ title, subtext, redacted }) => (
          <MetricCard key={title} title={title} subtext={subtext} redacted={redacted} />
        ))}
      </div>
    </div>
  )
}
