import ArchPillarBlock from './ArchPillarBlock'

/**
 * S6 — ProjectArchitectureSection (AC-017-ARCH)
 * Monorepo contract-first / Docs-driven tickets / Three-layer testing pyramid.
 */
export default function ProjectArchitectureSection() {
  return (
    <div>
      <h2 className="font-mono font-bold text-ink text-2xl mb-2">Project Architecture</h2>
      <p
        className="font-italic italic text-[15px] text-ink leading-relaxed mb-6"
        data-section-subtitle
      >
        How the codebase stays legible for a solo operator + AI agents.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ArchPillarBlock
          title="Monorepo, contract-first"
          body={
            <p>
              Frontend (React/TypeScript) and backend (FastAPI/Python) live in one repo. Every
              cross-layer change starts with a written API contract mapping{' '}
              <code className="text-pink-300 bg-white/5 px-1 rounded">snake_case</code> (backend){' '}
              ↔ <code className="text-pink-300 bg-white/5 px-1 rounded">camelCase</code> (frontend)
              — parallel agents implement against it.
            </p>
          }
        />

        <ArchPillarBlock
          title="Docs-driven tickets"
          body={
            <p>
              Acceptance Criteria are written in Behavior-Driven Development (BDD) style —
              Given/When/Then/And scenarios — so every Playwright test mirrors the spec 1:1. Flow:{' '}
              PRD → <code className="text-pink-300 bg-white/5 px-1 rounded">docs/tickets/K-XXX.md</code>{' '}
              → role retrospectives.
            </p>
          }
        />

        <ArchPillarBlock
          title="Three-layer testing pyramid"
          body={<p>Every feature is covered at three levels before shipping.</p>}
          testingPyramid={[
            { layer: 'Unit', detail: 'Vitest (frontend), pytest (backend)' },
            { layer: 'Integration', detail: 'FastAPI test client' },
            {
              layer: 'E2E',
              detail:
                'Playwright, including a visual-report pipeline that renders every page to HTML for human review',
            },
          ]}
        />
      </div>
    </div>
  )
}
