import type { ReactNode } from 'react'
import CardShell from '../primitives/CardShell'

interface PillarCardProps {
  layerLabel: 'LAYER 1' | 'LAYER 2' | 'LAYER 3'  // A-9: BQ-022-02 cr決採 LAYER 1/2/3
  title: 'Persistent Memory' | 'Structured Reflection' | 'Role Agents'
  body: ReactNode
  anchorQuote: string
  docsHref: string
}

/**
 * Single pillar card for "How AI Stays Reliable" section (AC-017-PILLARS, AC-022-LAYER-LABEL).
 * A-9: layerLabel is displayed in charcoal header bar (Geist Mono 10px text-paper)
 * A-7: link uses Newsreader italic + underline
 * docsHref is a site-relative path (e.g. /docs/ai-collab-protocols.md#role-flow)
 */
export default function PillarCard({ layerLabel, title, body, anchorQuote, docsHref }: PillarCardProps) {
  return (
    <CardShell padding="lg" className="flex flex-col overflow-hidden">
      {/* A-9: LAYER label bar — Geist Mono 10px text-paper on bg-charcoal */}
      <div className="-mx-6 -mt-6 mb-4 px-4 py-[6px] bg-charcoal">
        <span className="font-mono text-[10px] text-paper tracking-[2px] uppercase">
          {layerLabel}
        </span>
      </div>

      <h3 className="font-mono font-bold text-ink text-base mb-3">{title}</h3>
      <div className="text-muted text-sm leading-relaxed mb-4 flex-1">{body}</div>
      <blockquote className="border-l-2 border-ink/20 pl-3 mb-4">
        <em className="text-muted text-sm">{anchorQuote}</em>
      </blockquote>
      {/* A-7: link — Newsreader italic + underline */}
      <a
        href={docsHref}
        className="font-italic italic text-xs text-ink hover:text-brick underline"
      >
        Read the protocol →
      </a>
    </CardShell>
  )
}
