import type { ReactNode } from 'react'
import CardShell from '../primitives/CardShell'

interface PillarCardProps {
  title: 'Persistent Memory' | 'Structured Reflection' | 'Role Agents'
  body: ReactNode
  anchorQuote: string
  docsHref: string
}

/**
 * Single pillar card for "How AI Stays Reliable" section (AC-017-PILLARS).
 * docsHref is a site-relative path (e.g. /docs/ai-collab-protocols.md#role-flow)
 * and opens in the same tab — NOT using ExternalLink which forces target=_blank.
 */
export default function PillarCard({ title, body, anchorQuote, docsHref }: PillarCardProps) {
  return (
    <CardShell padding="lg">
      <h3 className="font-mono font-bold text-white text-base mb-3">{title}</h3>
      <div className="text-gray-300 text-sm leading-relaxed mb-4">{body}</div>
      <blockquote className="border-l-2 border-white/20 pl-3 mb-4">
        <em className="text-gray-400 text-sm">{anchorQuote}</em>
      </blockquote>
      <a
        href={docsHref}
        className="text-purple-400 text-xs font-mono hover:text-purple-300 underline"
      >
        Read the protocol →
      </a>
    </CardShell>
  )
}
