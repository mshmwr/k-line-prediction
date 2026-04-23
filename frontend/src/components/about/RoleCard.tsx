import CardShell from '../primitives/CardShell'
import FileNoBar from './FileNoBar'

/**
 * RoleCard (K-034 Phase 2 §7 Step 4 — D-4/D-5/D-6/D-7/D-8)
 * Used on: /about (RoleCardsSection)
 *
 * Pencil frame 8mqwX.role_* — dark FILE Nº 0N · PERSONNEL top bar + body:
 *   - Bodoni Moda italic 700 role name in brick; size 36 for 2-char roles (PM/QA), 32 otherwise
 *   - 40px × 1px charcoal rule
 *   - OWNS label (Geist Mono 10 muted letterSpacing 2 uppercase)
 *   - owns text (Newsreader italic 14 ink lh 1.5)
 *   - ARTEFACT label (same style as OWNS)
 *   - artefact text (Geist Mono 12 ink lh 1.5 — NOT italic, NOT muted)
 *
 * D-5: ROLE_ANNOTATIONS + `annotation` prop removed.
 * D-8: `redactArtefact` prop removed (Reviewer no longer redacted per PM ruling).
 */
interface RoleCardProps {
  fileNo: number
  role: 'PM' | 'Architect' | 'Engineer' | 'Reviewer' | 'QA' | 'Designer'
  owns: string
  artefact: string
}

export default function RoleCard({ fileNo, role, owns, artefact }: RoleCardProps) {
  const roleSizeClass = role.length <= 2 ? 'text-[26px]' : 'text-[22px]'

  return (
    <CardShell padding="md" className="flex flex-col min-h-[320px] overflow-hidden">
      <FileNoBar fileNo={fileNo} label="PERSONNEL" cardPaddingSize="md" />
      <article data-role={role} className="flex flex-col flex-1 gap-[14px] pt-[18px]">
        <h3
          className={`font-bold text-brick ${roleSizeClass} leading-none`}
        >
          {role}
        </h3>
        <div className="w-[40px] h-px bg-charcoal" />
        <div>
          <span className="font-mono text-[10px] text-muted uppercase tracking-[2px]">OWNS</span>
          <p className="text-ink text-[12px] leading-[1.5] mt-1">{owns}</p>
        </div>
        <div>
          <span className="font-mono text-[10px] text-muted uppercase tracking-[2px]">ARTEFACT</span>
          <p className="font-mono text-ink text-[12px] leading-[1.5] mt-1">{artefact}</p>
        </div>
      </article>
    </CardShell>
  )
}
