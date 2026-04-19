import RoleCard from './RoleCard'

const ROLES = [
  {
    role: 'PM' as const,
    owns: 'Requirements, AC, Phase Gates',
    artefact: 'PRD.md, docs/tickets/K-XXX.md',
  },
  {
    role: 'Architect' as const,
    owns: 'System design, cross-layer contracts',
    artefact: 'docs/designs/K-XXX-*.md',
  },
  {
    role: 'Engineer' as const,
    owns: 'Implementation, stable checkpoints',
    artefact: 'commits + ticket retrospective',
  },
  {
    role: 'Reviewer' as const,
    owns: 'Code review, Bug Found Protocol',
    artefact: 'Review report + Reviewer 反省',
  },
  {
    role: 'QA' as const,
    owns: 'Regression, E2E, visual report',
    artefact: 'Playwright results + docs/reports/*.html',
  },
  {
    role: 'Designer' as const,
    owns: 'Pencil MCP, flow diagrams',
    artefact: '.pen file + get_screenshot output',
  },
]

/**
 * S3 — RoleCardsSection (AC-017-ROLES)
 * 6 role cards with Owns + Artefact fields.
 */
export default function RoleCardsSection() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {ROLES.map(({ role, owns, artefact }) => (
        <RoleCard key={role} role={role} owns={owns} artefact={artefact} />
      ))}
    </div>
  )
}
