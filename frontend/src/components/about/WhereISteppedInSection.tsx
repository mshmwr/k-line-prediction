import CardShell from '../primitives/CardShell'
import FileNoBar from './FileNoBar'

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
  return (
    <div>
      <p
        data-testid="where-i-narrative"
        className="text-[14px] text-ink leading-[1.6] mb-6"
      >
        I am the single operator. Every ticket is filed by me, reviewed by me, and merged by me. The agents execute; I decide.
      </p>

      <div data-testid="where-i-table" className="mb-4">
        {/* Desktop: bordered table grid */}
        <div className="hidden md:block border border-ink rounded-md overflow-hidden">
          <div className="grid grid-cols-3 bg-charcoal">
            {HEADERS.map((h, i) => (
              <div
                key={h}
                className={`px-3 py-2 font-mono text-[10px] font-bold text-paper tracking-[2px] uppercase${i > 0 ? ' border-l border-muted/40' : ''}`}
              >
                {h}
              </div>
            ))}
          </div>
          {ROWS.map((row, i) => (
            <div key={i} className="grid grid-cols-3 border-t border-muted/40">
              <div className="px-3 py-3 font-mono text-[12px] text-ink leading-[1.55]">
                {row.aiDid}
              </div>
              <div className="px-3 py-3 font-mono text-[12px] text-ink leading-[1.55] border-l border-muted/40">
                {row.iDecided}
              </div>
              <div className="px-3 py-3 font-mono text-[12px] text-brick leading-[1.55] border-l border-muted/40">
                {row.outcome}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: each row as a CardShell card */}
        <div className="md:hidden flex flex-col gap-3">
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
          60 tickets. 100% AC coverage. Every decision logged.
        </p>
      </div>
    </div>
  )
}
