import CardShell from '../primitives/CardShell'
import ExternalLink from '../primitives/ExternalLink'

interface TicketAnatomyCardProps {
  id: 'K-002' | 'K-008' | 'K-009'
  title: string
  outcome: string
  learning: string
  githubHref: string
}

export default function TicketAnatomyCard({
  id,
  title,
  outcome,
  learning,
  githubHref,
}: TicketAnatomyCardProps) {
  return (
    <CardShell padding="md">
      <div className="flex items-start justify-between gap-2 mb-3">
        <span data-testid="ticket-anatomy-id-badge" className="font-mono text-xs text-charcoal font-bold">{id}</span>
        {/* A-7: link — Newsreader italic + underline */}
        <ExternalLink
          href={githubHref}
          className="font-italic italic text-xs text-muted hover:text-ink underline"
          ariaLabel={`View ${id} ticket on GitHub`}
        >
          GitHub →
        </ExternalLink>
      </div>
      <h3 className="font-mono font-semibold text-ink text-sm mb-3">{title}</h3>
      <div data-testid="ticket-anatomy-body" className="space-y-2 text-xs text-muted leading-relaxed">
        <p>
          <span className="text-muted uppercase tracking-wide font-mono">Outcome</span>{' '}
          {outcome}
        </p>
        <p>
          <span className="text-muted uppercase tracking-wide font-mono">Learning</span>{' '}
          {learning}
        </p>
      </div>
    </CardShell>
  )
}
