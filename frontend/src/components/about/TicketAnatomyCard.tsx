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
        <span className="font-mono text-xs text-purple-400 font-bold">{id}</span>
        <ExternalLink
          href={githubHref}
          className="text-gray-500 text-xs font-mono hover:text-gray-300 underline"
          ariaLabel={`View ${id} ticket on GitHub`}
        >
          GitHub →
        </ExternalLink>
      </div>
      <h3 className="font-mono font-semibold text-ink text-sm mb-3">{title}</h3>
      <div className="space-y-2 text-xs text-gray-400 leading-relaxed">
        <p>
          <span className="text-gray-500 uppercase tracking-wide font-mono">Outcome</span>{' '}
          {outcome}
        </p>
        <p>
          <span className="text-gray-500 uppercase tracking-wide font-mono">Learning</span>{' '}
          {learning}
        </p>
      </div>
    </CardShell>
  )
}
