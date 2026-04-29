import TicketAnatomyCard from './TicketAnatomyCard'
import ticketCasesData from '@/content/ticket-cases.json'

const { ticketCases } = ticketCasesData

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
        {ticketCases.map((tc, i) => (
          <TicketAnatomyCard
            key={tc.id}
            fileNo={i + 1}
            caseNo={String(i + 1).padStart(2, '0')}
            id={tc.id as 'K-002' | 'K-008' | 'K-009'}
            title={tc.title}
            outcome={tc.summary}
            learning={tc.impact}
            githubHref={tc.githubUrl}
          />
        ))}
      </div>
    </div>
  )
}
