import RoleCard from './RoleCard'

/**
 * S3 — RoleCardsSection (K-034 Phase 2 §7 Step 4 — D-4/D-5/D-6/D-7/D-8)
 * Used on: /about
 *
 * Pencil frame 8mqwX — 6 role cards (PM/Architect/Engineer/Reviewer/QA/Designer).
 * Section has NO internal h2 (SectionLabelRow "Nº 02 — THE ROLES" owns the heading
 * per AboutPage.tsx); subtitle is Pencil s3Intro literal (15 ink, inherits Geist Mono).
 *
 * ROLES data mirrors Pencil 8mqwX.r{1..6} verbatim. Reviewer ARTEFACT is unredacted
 * per PM ruling (Pencil shows plain text).
 */
const ROLES = [
  {
    fileNo: 1,
    role: 'PM' as const,
    owns: 'Requirements, AC, Phase Gates',
    artefact: 'PRD.md, docs/tickets/K-XXX.md',
  },
  {
    fileNo: 2,
    role: 'Architect' as const,
    owns: 'System design, cross-layer contracts',
    artefact: 'docs/designs/K-XXX-*.md',
  },
  {
    fileNo: 3,
    role: 'Engineer' as const,
    owns: 'Implementation, stable checkpoints',
    artefact: 'commits + ticket retrospective',
  },
  {
    fileNo: 4,
    role: 'Reviewer' as const,
    owns: 'Code review, Bug Found Protocol',
    artefact: 'Review report + Reviewer 反省',
  },
  {
    fileNo: 5,
    role: 'QA' as const,
    owns: 'Regression, E2E, visual report',
    artefact: 'Playwright results + docs/reports/*.html',
  },
  {
    fileNo: 6,
    role: 'Designer' as const,
    owns: 'Pencil MCP, flow diagrams',
    artefact: '.pen file + get_screenshot output',
  },
]

export default function RoleCardsSection() {
  return (
    <div>
      <p
        className="text-[14px] text-ink leading-[1.6] mb-6"
        data-section-subtitle
      >
        — Each role a separate agent with spec&apos;d responsibilities. Every handoff produces a verifiable artefact.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[14px]">
        {ROLES.map(({ fileNo, role, owns, artefact }) => (
          <RoleCard key={role} fileNo={fileNo} role={role} owns={owns} artefact={artefact} />
        ))}
      </div>
    </div>
  )
}
