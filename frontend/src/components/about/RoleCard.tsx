import CardShell from '../primitives/CardShell'
import RedactionBar from './RedactionBar'

interface RoleCardProps {
  role: 'PM' | 'Architect' | 'Engineer' | 'Reviewer' | 'QA' | 'Designer'
  owns: string
  artefact: string
  borderColorClass?: string
  annotation?: string   // A-11: marginalia annotation (BEHAVIOUR / POSITION / etc.)
  redactArtefact?: boolean  // A-5: redact artefact field
}

/**
 * A-8 role → annotation mapping (design-driven marginalia)
 */
const ROLE_ANNOTATIONS: Record<string, string> = {
  PM: 'POSITION',
  Architect: 'POSITION',
  Engineer: 'BEHAVIOUR',
  Reviewer: 'BEHAVIOUR',
  QA: 'BEHAVIOUR',
  Designer: 'BEHAVIOUR',
}

export default function RoleCard({ role, owns, artefact, borderColorClass, annotation, redactArtefact = false }: RoleCardProps) {
  const roleAnnotation = annotation ?? ROLE_ANNOTATIONS[role]

  return (
    <CardShell borderColorClass={borderColorClass ?? 'border-ink/20'} padding="md" className="flex flex-col min-h-[320px]">
      <article data-role={role} className="flex flex-col flex-1">
        {/* A-3 / §2.8: Role name Bodoni Moda 36px italic 700 text-brick */}
        <h3 className="font-display font-bold italic text-[36px] text-brick leading-none mb-3">{role}</h3>

        <div className="space-y-3 text-sm flex-1">
          <div>
            {/* A-6: OWNS label — Geist Mono 10px text-muted uppercase tracking-[2px] */}
            <span className="font-mono text-[10px] text-muted uppercase tracking-[2px]">OWNS</span>
            <p className="text-ink text-sm mt-0.5 leading-snug">{owns}</p>
          </div>
          <div>
            {/* A-6: ARTEFACT label — Geist Mono 10px text-muted uppercase tracking-[2px] */}
            <span className="font-mono text-[10px] text-muted uppercase tracking-[2px]">ARTEFACT</span>
            {redactArtefact ? (
              <div className="mt-1">
                <RedactionBar width="w-[140px]" />
                <span className="sr-only">{artefact}</span>
              </div>
            ) : (
              <p className="text-muted mt-0.5 font-mono text-xs leading-snug">{artefact}</p>
            )}
          </div>
        </div>

        {/* A-11: marginalia annotation — Geist Mono 9px text-muted */}
        {roleAnnotation && (
          <div className="mt-3 pt-2 border-t border-ink/10">
            <span
              data-annotation
              className="font-mono text-[9px] text-muted uppercase tracking-[2px]"
            >
              {roleAnnotation}
            </span>
          </div>
        )}
      </article>
    </CardShell>
  )
}
