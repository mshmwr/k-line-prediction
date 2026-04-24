import RoleCard from './RoleCard'
import { ROLES } from './roles'

/**
 * S3 — RoleCardsSection (K-034 Phase 2 §7 Step 4 — D-4/D-5/D-6/D-7/D-8)
 * Used on: /about
 *
 * Pencil frame 8mqwX — 6 role cards (PM/Architect/Engineer/Reviewer/QA/Designer).
 * Section has NO internal h2 (SectionLabelRow "Nº 02 — THE ROLES" owns the heading
 * per AboutPage.tsx); subtitle is Pencil s3Intro literal (Newsreader italic 15 ink).
 *
 * K-039 split-SSOT: runtime text (role/owns/artefact) now lives in the pure-data
 * module `./roles.ts` (TEXT SSOT); Pencil frame retains VISUAL SSOT over font /
 * size / color / layout (see ticket K-039 §5 AC-039-P3-SACRED-SPLIT).
 */
export default function RoleCardsSection() {
  return (
    <div>
      <p
        className="font-italic italic text-[15px] text-ink leading-[1.6] mb-6"
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
