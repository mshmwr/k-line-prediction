import RoleCard from './RoleCard'

const ROLES = [
  {
    role: 'PM' as const,
    owns: 'Requirements, AC, Phase Gates',
    artefact: 'PRD.md, docs/tickets/K-XXX.md',
    redactArtefact: false,
  },
  {
    role: 'Architect' as const,
    owns: 'System design, cross-layer contracts',
    artefact: 'docs/designs/K-XXX-*.md',
    redactArtefact: false,
  },
  {
    role: 'Engineer' as const,
    owns: 'Implementation, stable checkpoints',
    artefact: 'commits + ticket retrospective',
    redactArtefact: false,
  },
  {
    role: 'Reviewer' as const,
    owns: 'Code review, Bug Found Protocol',
    artefact: 'Review report + Reviewer 反省',
    redactArtefact: true,  // A-5: classified artefact
  },
  {
    role: 'QA' as const,
    owns: 'Regression, E2E, visual report',
    artefact: 'Playwright results + docs/reports/*.html',
    redactArtefact: false,
  },
  {
    role: 'Designer' as const,
    owns: 'Pencil MCP, flow diagrams',
    artefact: '.pen file + get_screenshot output',
    redactArtefact: false,
  },
]

/**
 * S3 — RoleCardsSection (AC-017-ROLES, AC-022-ROLE-GRID-HEIGHT)
 * 6 role cards with Owns + Artefact fields.
 * C-4: grid gap-[14px] (gap-3.5), card min-h-[320px] (set in RoleCard)
 * A-4: italic subtitle
 */
export default function RoleCardsSection() {
  return (
    <div>
      <h2 className="font-mono font-bold text-ink text-2xl mb-2">The Roles</h2>
      <p
        className="font-italic italic text-[15px] text-ink leading-relaxed mb-6"
        data-section-subtitle
      >
        Six specialized agents, each with a defined scope and a trail of artefacts.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[14px]">
        {ROLES.map(({ role, owns, artefact, redactArtefact }) => (
          <RoleCard key={role} role={role} owns={owns} artefact={artefact} redactArtefact={redactArtefact} />
        ))}
      </div>
    </div>
  )
}
