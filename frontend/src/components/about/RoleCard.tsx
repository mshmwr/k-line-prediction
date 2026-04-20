import CardShell from '../primitives/CardShell'

interface RoleCardProps {
  role: 'PM' | 'Architect' | 'Engineer' | 'Reviewer' | 'QA' | 'Designer'
  owns: string
  artefact: string
  borderColorClass?: string
}

export default function RoleCard({ role, owns, artefact, borderColorClass }: RoleCardProps) {
  return (
    <CardShell borderColorClass={borderColorClass ?? 'border-white/10'} padding="md">
      <article data-role={role}>
        <h3 className="font-mono font-bold text-ink text-base mb-3">{role}</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-500 text-xs uppercase tracking-wide font-mono">Owns</span>
            <p className="text-gray-300 mt-0.5">{owns}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs uppercase tracking-wide font-mono">Artefact</span>
            <p className="text-gray-400 mt-0.5 font-mono text-xs">{artefact}</p>
          </div>
        </div>
      </article>
    </CardShell>
  )
}
