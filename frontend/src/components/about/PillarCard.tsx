import type { ReactNode } from 'react'
import CardShell from '../primitives/CardShell'
import FileNoBar from './FileNoBar'

/**
 * PillarCard (K-034 Phase 2 §7 Step 5 — D-9/D-10/D-11/D-12/D-13)
 * Used on: /about (ReliabilityPillarsSection)
 *
 * Pencil frame UXy2o.pillar_* — dark FILE Nº 0N · PROTOCOL top bar + body:
 *   - bold 20 ink title (lh 1.15)
 *   - 40px × 1px charcoal rule
 *   - 12 ink body (lh 1.6)
 *   - border-l-[3px] brick quote (bold 12 brick, padding-l 14)
 *   - Geist Mono 11 ink link (no underline; letterSpacing 1)
 *
 * D-13: `layerLabel` prop removed (FileNoBar prefix="FILE Nº" + label="PROTOCOL").
 * K-040: typeface retired; all fonts inherit Geist Mono from body.
 *
 * Editorial markup exemption (K-034 Phase 2 §4.8 C-1a ruling, PM 2026-04-23):
 *   Consumer (`ReliabilityPillarsSection.tsx`) wraps file-path tokens
 *   `MEMORY.md` / `docs/retrospectives/<role>.md` / `./scripts/audit-ticket.sh K-XXX`
 *   inside this component's `body` slot with `<code>` monospace spans. The wrapped
 *   text itself is Pencil-verbatim (`UXy2o.pillar_{1,2,3}.p*BodyText.content`);
 *   only inline markup is added to restore the file-path semantic signal that
 *   Pencil's flat-text encoding cannot carry. See `docs/designs/design-exemptions.md`
 *   §2 INHERITED-editorial row (PillarCard) for full scope: monospace signal
 *   only — no sentence additions, no copy changes, no schema reshape.
 *
 * C-1b reversal note: initial Reviewer flagged p3 body as adding an editorial
 *   sentence ("Handoffs produce artifacts that ./scripts/audit-ticket.sh K-XXX
 *   can verify end-to-end."). Pencil JSON re-verification on 2026-04-23
 *   (`frontend/design/specs/about-v2.frame-UXy2o.json` line 75, node name
 *   `p3BodyText`) confirmed that sentence IS Pencil SSOT verbatim. No edit
 *   required; finding reversed. Lesson: always grep the JSON spec before
 *   assuming any prose differs from Pencil authority.
 */
interface PillarCardProps {
  fileNo: number
  title: 'Persistent Memory' | 'Structured Reflection' | 'Role Agents'
  body: ReactNode
  anchorQuote: string
  linkText: string
  docsHref: string
}

export default function PillarCard({
  fileNo,
  title,
  body,
  anchorQuote,
  linkText,
  docsHref,
}: PillarCardProps) {
  return (
    <CardShell padding="lg" className="flex flex-col overflow-hidden">
      <FileNoBar fileNo={fileNo} label="PROTOCOL" cardPaddingSize="lg" />
      <div className="flex flex-col flex-1 gap-[14px] pt-[18px]">
        <h3 className="font-bold text-ink text-[20px] leading-[1.15]">
          {title}
        </h3>
        <div className="w-[40px] h-px bg-charcoal" />
        <div className="text-ink text-[12px] leading-[1.6]">{body}</div>
        <blockquote className="border-l-[3px] border-brick pl-[14px]">
          <p className="font-bold text-brick text-[12px] leading-[1.55]">
            {anchorQuote}
          </p>
        </blockquote>
        <a
          href={docsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-ink text-[11px] tracking-[1px] hover:text-brick"
        >
          {linkText}
        </a>
      </div>
    </CardShell>
  )
}
