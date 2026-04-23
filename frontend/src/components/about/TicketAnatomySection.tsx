import TicketAnatomyCard from './TicketAnatomyCard'

const GITHUB_BASE = 'https://github.com/mshmwr/k-line-prediction/blob/main/docs/tickets'

/**
 * S5 — TicketAnatomySection (K-034 Phase 2 §7 Step 6 — D-14/D-15/D-26/D-27)
 * Used on: /about
 *
 * Pencil frame EBC1e — 3 ticket cards (K-002 / K-008 / K-009).
 * Section has NO internal h2 (SectionLabelRow "Nº 04 — ANATOMY OF A TICKET" owns the
 * heading per AboutPage.tsx); subtitle is Pencil s5Intro literal.
 *
 * TICKETS data mirrors Pencil t{1..3} outcome/learning content (editorial phrasing
 * preserved from prior revision to avoid truncating technical detail; Pencil versions
 * are shorter narrative summaries — body text is legal to enhance beyond Pencil prose
 * per Phase 2 design doc §8 content-authorship note).
 */
const TICKETS = [
  {
    fileNo: 1,
    caseNo: '01',
    id: 'K-002' as const,
    title: 'UI optimization',
    outcome:
      'Large-scale UI refactor surfaced a systematic And-clause omission — the SectionHeader icon And-clause was silently skipped by Engineer, Architect review, and QA before Code Review caught it.',
    learning:
      'The incident directly catalyzed the per-role retrospective log mechanism: one structural gap, three roles, one process improvement.',
    githubHref: `${GITHUB_BASE}/K-002-ui-optimization.md`,
  },
  {
    fileNo: 2,
    caseNo: '02',
    id: 'K-008' as const,
    title: 'Visual report script',
    outcome:
      'Automated the visual screenshot pipeline (Playwright → HTML report). Bug Found Protocol triggered three times: module-level side effects, mutable accumulator state, and path traversal via env var.',
    learning:
      'Demonstrates the four-step Bug Found Protocol: reflect → PM confirms quality → write memory → release fix.',
    githubHref: `${GITHUB_BASE}/K-008-visual-report.md`,
  },
  {
    fileNo: 3,
    caseNo: '03',
    id: 'K-009' as const,
    title: '1H MA history fix',
    outcome:
      '1H predictions silently fell back to 1D MA history, producing incorrect similarity matches. Fixed via test-driven approach: failing test first, production fix second.',
    learning:
      'Demonstrates test-driven discipline: monkeypatch the internal call, write the failing assertion, confirm it fails, then fix implementation.',
    githubHref: `${GITHUB_BASE}/K-009-1h-ma-history-fix.md`,
  },
]

export default function TicketAnatomySection() {
  return (
    <div>
      <p
        className="text-[14px] text-ink leading-[1.6] mb-6"
        data-section-subtitle
      >
        — Anatomy of a ticket. Three cases, each filed in full with outcome and learning.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">
        {TICKETS.map(ticket => (
          <TicketAnatomyCard key={ticket.id} {...ticket} />
        ))}
      </div>
    </div>
  )
}
