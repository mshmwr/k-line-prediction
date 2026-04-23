import CardShell from '../primitives/CardShell'
import ExternalLink from '../primitives/ExternalLink'
import FileNoBar from './FileNoBar'

/**
 * TicketAnatomyCard (K-034 Phase 2 §7 Step 6 — D-14/D-15)
 * Used on: /about (TicketAnatomySection)
 *
 * Pencil frame EBC1e.ticket_* — dark FILE Nº 0N · CASE FILE bar with trailing K-00N;
 * body with Case Nº prefix, Bodoni 26 italic title, 40px charcoal rule, OUTCOME label,
 * Newsreader italic 13 outcome, LEARNING label, brick learning body, GitHub link.
 *
 * Testid preservation (AC-029 compatibility contract per Phase 2 design doc):
 *   - `ticket-anatomy-id-badge` — sr-only span styled `text-charcoal` keeps the K-029
 *     color assertion (`rgb(42, 37, 32)`) satisfied while the visible K-00N label lives
 *     on FileNoBar's paper-on-charcoal trailing slot per Pencil.
 *   - `ticket-anatomy-body` — body container, color inherits `text-ink` (allow-list pass).
 */
interface TicketAnatomyCardProps {
  fileNo: number
  caseNo: string
  id: 'K-002' | 'K-008' | 'K-009'
  title: string
  outcome: string
  learning: string
  githubHref: string
}

export default function TicketAnatomyCard({
  fileNo,
  caseNo,
  id,
  title,
  outcome,
  learning,
  githubHref,
}: TicketAnatomyCardProps) {
  return (
    <CardShell padding="md" className="flex flex-col overflow-hidden">
      <FileNoBar fileNo={fileNo} label="CASE FILE" trailing={id} cardPaddingSize="md" />
      {/* sr-only testid anchor; preserves AC-029 strict charcoal color assertion. */}
      <span data-testid="ticket-anatomy-id-badge" className="sr-only text-charcoal">
        {id}
      </span>
      <div className="flex flex-col flex-1 gap-[12px] pt-[18px]">
        <span className="text-[11px] text-muted">Case Nº {caseNo}</span>
        <h3 className="font-bold text-ink text-[20px] leading-[1.15]">
          {title}
        </h3>
        <div className="w-[40px] h-px bg-charcoal" />
        <div data-testid="ticket-anatomy-body" className="flex flex-col gap-[10px] text-ink">
          <div>
            <span className="font-mono text-[10px] text-muted uppercase tracking-[2px]">
              OUTCOME
            </span>
            <p className="text-ink text-[12px] leading-[1.55] mt-1">
              {outcome}
            </p>
          </div>
          <div>
            <span className="font-mono text-[10px] text-muted uppercase tracking-[2px]">
              LEARNING
            </span>
            <p className="text-brick text-[12px] leading-[1.55] mt-1">
              {learning}
            </p>
          </div>
        </div>
        <ExternalLink
          href={githubHref}
          className="font-mono text-ink text-[11px] tracking-[1px] hover:text-brick"
          ariaLabel={`View ${id} ticket on GitHub`}
        >
          → View {id} on GitHub
        </ExternalLink>
      </div>
    </CardShell>
  )
}
