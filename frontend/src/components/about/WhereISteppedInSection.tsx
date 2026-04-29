import CardShell from '../primitives/CardShell'
import FileNoBar from './FileNoBar'
import siteContent from '@/content/site-content.json'

const { metrics } = siteContent
// Not in site-content.json: build script auto-overwrites metrics block; architectural constant per K-066 AC-066-SSOT
const PIPELINE_DEPTH = 6

const ROWS = [
  {
    aiDid: 'Architect proposed component tree + API contract',
    iDecided: 'Approved scope, rejected over-abstraction, set sacred constraints',
    outcome: 'Each ticket ships with a verifiable artefact trail',
  },
  {
    aiDid: 'Engineer implemented + Reviewer flagged bugs',
    iDecided: 'Confirmed root cause, approved fix strategy',
    outcome: 'Zero regressions across 60+ merged PRs',
  },
  {
    aiDid: 'Designer produced Pencil spec per each visual ticket',
    iDecided: 'Selected visual direction (A/B/C options), approved design-locked gate',
    outcome: 'SSOT maintained across 3-page redesign',
  },
]

const HEADERS = ['AI DID', 'I DECIDED', 'OUTCOME'] as const

export default function WhereISteppedInSection() {
  const acPercent = metrics.acCoverage.total > 0
    ? Math.round((metrics.acCoverage.covered / metrics.acCoverage.total) * 100)
    : 0

  return (
    <div>
      <p
        data-testid="where-i-narrative"
        className="text-[14px] text-ink leading-[1.6] mb-6"
      >
        I am the single operator. I define requirements and the rules agents run by; they handle design through QA. I review at the boundary — correcting output when needed, and deciding what ships.
      </p>

      <div data-testid="where-i-table" className="mb-4">
        {/* Cards — all breakpoints */}
        <div className="flex flex-col gap-3">
          {ROWS.map((row, i) => (
            <CardShell key={i} padding="md">
              <FileNoBar fileNo={i + 1} label="COMPARISON" />
              <div className="flex flex-col gap-2 pt-3">
                {HEADERS.map((h, j) => (
                  <div key={h}>
                    <span className="font-mono text-[10px] text-muted uppercase tracking-[2px]">{h}</span>
                    <p className={`font-mono text-[12px] leading-[1.55] mt-0.5 ${j === 2 ? 'text-brick' : 'text-ink'}`}>
                      {j === 0 ? row.aiDid : j === 1 ? row.iDecided : row.outcome}
                    </p>
                  </div>
                ))}
              </div>
            </CardShell>
          ))}
        </div>
      </div>

      <div
        data-testid="where-i-outcome"
        className="bg-charcoal rounded-md px-5 py-4"
      >
        <p className="font-mono text-[14px] font-bold text-paper tracking-[1px]">
          {metrics.featuresShipped.value} features shipped. {acPercent}% AC coverage. {PIPELINE_DEPTH}-agent pipeline.
        </p>
      </div>
    </div>
  )
}
