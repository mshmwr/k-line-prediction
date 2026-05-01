import ArchPillarBlock from './ArchPillarBlock'
import siteContent from '@/content/site-content.json'
import type { ArchLayer } from '../../content/site-content.types'

// resolveJsonModule widens literals to string; cast through unknown to ArchLayer[] for map usage.
// ArchLayer uses string for discriminant fields (category, type) — satisfies verifies structural shape.
const architectureLayers = siteContent.aboutContent.architecture as unknown as ArchLayer[]

/**
 * S6 — ProjectArchitectureSection (K-034 Phase 2 §7 Step 7 — D-16/D-17/D-18/D-26/D-27)
 * Used on: /about
 *
 * Pencil frame JFizO — 3 layer cards:
 *   LAYER Nº 01 · BACKBONE → Monorepo, contract-first (BOUNDARY + CONTRACT)
 *   LAYER Nº 02 · DISCIPLINE → Docs-driven tickets (SPEC FORMAT + FLOW)
 *   LAYER Nº 03 · ASSURANCE → Three-layer testing pyramid (3 pyramid rows)
 *
 * Section has NO internal h2 (SectionLabelRow "Nº 05 — PROJECT ARCHITECTURE" owns the
 * heading per AboutPage.tsx); subtitle is Pencil s6Intro literal.
 */
export default function ProjectArchitectureSection() {
  return (
    <div>
      <p
        className="text-[14px] text-ink leading-[1.6] mb-6"
        data-section-subtitle
      >
        — How the codebase stays legible for a solo operator + AI agents.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">
        {architectureLayers.map(layer => (
          <ArchPillarBlock
            key={layer.no}
            layerNo={layer.no}
            category={layer.category as 'BACKBONE' | 'DISCIPLINE' | 'ASSURANCE'}
            title={layer.title}
            fields={layer.fields as Parameters<typeof ArchPillarBlock>[0]['fields']}
          />
        ))}
      </div>
    </div>
  )
}
