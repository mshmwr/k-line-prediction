/**
 * ROLES — pure-data SSOT for the six-role cards rendered on /about.
 *
 * This module is the TEXT SSOT (K-039 AC-039-P1-TSX-CANON). Pencil frame
 * `about-v2.frame-8mqwX.json` remains the VISUAL SSOT (font, size, color,
 * layout, typography) per K-034 AC-034-P2-DRIFT-D5/D6/D7/D8 visual portions;
 * K-039 split-SSOT rule governs content-vs-visual ownership (see ticket
 * K-039 §5 AC-039-P3-SACRED-SPLIT table).
 *
 * Consumers:
 *   - frontend/src/components/about/RoleCardsSection.tsx (runtime render)
 *   - frontend/e2e/roles-doc-sync.spec.ts (drift regression gate)
 *   - (Phase 2) scripts/sync-role-docs.mjs (README + docs/ai-collab-protocols.md generator)
 *
 * Constraints (K-039 AC-039-P1-TSX-CANON + ROLES-COUNT-INVARIANT):
 *   - ROLES.length === 6 (coordinated change required for any other count;
 *     see AC-039-P1-ROLES-COUNT-INVARIANT)
 *   - Order: PM → Architect → Engineer → Reviewer → QA → Designer
 *   - Every `owns` + `artefact` string MUST match /^[^|\n`]*$/
 *     (no pipe, no unescaped newline, no unbalanced backtick) so the text
 *     is safe to inject into Markdown table cells by the Phase 2 generator.
 *
 * Module discipline: pure data. Zero React imports. No runtime side effects.
 */

export type RoleKey = 'PM' | 'Architect' | 'Engineer' | 'Reviewer' | 'QA' | 'Designer'

export interface RoleEntry {
  fileNo: number
  role: RoleKey
  owns: string
  artefact: string
}

export const ROLES: readonly RoleEntry[] = [
  {
    fileNo: 1,
    role: 'PM',
    owns: 'Requirements, AC, Phase Gates',
    artefact: 'PRD.md, docs/tickets/K-XXX.md',
  },
  {
    fileNo: 2,
    role: 'Architect',
    owns: 'System design, cross-layer contracts',
    artefact: 'docs/designs/K-XXX-*.md',
  },
  {
    fileNo: 3,
    role: 'Engineer',
    owns: 'Implementation, stable checkpoints',
    artefact: 'commits + ticket retrospective',
  },
  {
    fileNo: 4,
    role: 'Reviewer',
    owns: 'Code review, Bug Found Protocol',
    artefact: 'Review report + Reviewer 反省',
  },
  {
    fileNo: 5,
    role: 'QA',
    owns: 'Regression, E2E, visual report',
    artefact: 'Playwright results + docs/reports/*.html',
  },
  {
    fileNo: 6,
    role: 'Designer',
    owns: 'Pencil MCP, flow diagrams',
    artefact: '.pen file + get_screenshot output',
  },
]
