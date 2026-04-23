import ArchPillarBlock from './ArchPillarBlock'

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
        <ArchPillarBlock
          layerNo={1}
          category="BACKBONE"
          title="Monorepo, contract-first"
          fields={[
            {
              type: 'labelValue',
              label: 'BOUNDARY',
              value:
                'Frontend (React/TypeScript) and backend (FastAPI/Python) live in one repo.',
              valueFont: 'body',
            },
            {
              type: 'labelValue',
              label: 'CONTRACT',
              value:
                'Every cross-layer change starts with a written API contract mapping snake_case (backend) ↔ camelCase (frontend) — parallel agents implement against it.',
              valueFont: 'body',
            },
          ]}
        />

        <ArchPillarBlock
          layerNo={2}
          category="DISCIPLINE"
          title="Docs-driven tickets"
          fields={[
            {
              type: 'labelValue',
              label: 'SPEC FORMAT',
              value:
                'Acceptance Criteria are written in Behavior-Driven Development (BDD) style — Given/When/Then/And scenarios — so every Playwright test mirrors the spec 1:1.',
              valueFont: 'body',
            },
            {
              type: 'labelValue',
              label: 'FLOW',
              value: 'PRD → docs/tickets/K-XXX.md → role retrospectives.',
              valueFont: 'mono',
            },
          ]}
        />

        <ArchPillarBlock
          layerNo={3}
          category="ASSURANCE"
          title="Three-layer testing pyramid"
          fields={[
            {
              type: 'pyramid',
              rows: [
                {
                  no: '01',
                  layerLabel: 'UNIT',
                  detail: 'Vitest (frontend), pytest (backend).',
                },
                {
                  no: '02',
                  layerLabel: 'INTEGRATION',
                  detail: 'FastAPI test client.',
                },
                {
                  no: '03',
                  layerLabel: 'E2E',
                  detail:
                    'Playwright, including a visual-report pipeline that renders every page to HTML for human review.',
                },
              ],
            },
          ]}
        />
      </div>
    </div>
  )
}
