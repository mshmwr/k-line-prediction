import TicketAnatomyCard from './TicketAnatomyCard'

const GITHUB_BASE = 'https://github.com/mshmwr/k-line-prediction/blob/main/docs/tickets'

const TICKETS = [
  {
    id: 'K-002' as const,
    title: 'UI optimization',
    outcome:
      'Large-scale UI refactor surfaced a systematic And-clause omission — the SectionHeader icon And-clause was silently skipped by Engineer, Architect review, and QA before Code Review caught it.',
    learning:
      'The incident directly catalyzed the per-role retrospective log mechanism: one structural gap, three roles, one process improvement.',
    githubHref: `${GITHUB_BASE}/K-002-ui-optimization.md`,
  },
  {
    id: 'K-008' as const,
    title: 'Visual report script',
    outcome:
      'Automated the visual screenshot pipeline (Playwright → HTML report). Bug Found Protocol triggered three times: module-level side effects, mutable accumulator state, and path traversal via env var.',
    learning:
      'Demonstrates the four-step Bug Found Protocol: reflect → PM confirms quality → write memory → release fix.',
    githubHref: `${GITHUB_BASE}/K-008-visual-report.md`,
  },
  {
    id: 'K-009' as const,
    title: '1H MA history fix',
    outcome:
      '1H predictions silently fell back to 1D MA history, producing incorrect similarity matches. Fixed via test-driven approach: failing test first, production fix second.',
    learning:
      'Demonstrates test-driven discipline: monkeypatch the internal call, write the failing assertion, confirm it fails, then fix implementation.',
    githubHref: `${GITHUB_BASE}/K-009-1h-ma-history-fix.md`,
  },
]

/**
 * S5 — TicketAnatomySection (AC-017-TICKETS)
 * K-002 / K-008 / K-009 ticket anatomy trio.
 */
export default function TicketAnatomySection() {
  return (
    <div>
      <h2 className="font-mono font-bold text-white text-2xl mb-2">Anatomy of a Ticket</h2>
      <p className="text-gray-400 text-sm mb-6">
        Three tickets that shaped how this project works.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TICKETS.map(ticket => (
          <TicketAnatomyCard key={ticket.id} {...ticket} />
        ))}
      </div>
    </div>
  )
}
