/**
 * ROLES — thin typed wrapper over the language-neutral content SSOT.
 *
 * Content source-of-truth (K-039 Phase 1.5, post-BQ user ruling):
 *   /content/roles.json   (repo-root, framework-neutral, human-editable)
 *
 * This file owns the TYPE contract only (RoleEntry, RoleKey). It does not
 * own runtime data — the array literal lives in JSON. Editing role text?
 * Edit the JSON, not this file.
 *
 * Pencil frame `about-v2.frame-8mqwX.json` remains the VISUAL SSOT (font,
 * size, color, layout, typography) per K-034 AC-034-P2-DRIFT-D5/D6/D7/D8
 * visual portions; K-039 split-SSOT rule governs content-vs-visual
 * ownership (see ticket K-039 §5 AC-039-P3-SACRED-SPLIT table).
 *
 * Consumers:
 *   - frontend/src/components/about/RoleCardsSection.tsx (runtime render)
 *   - frontend/e2e/roles-doc-sync.spec.ts (drift regression gate)
 *   - (Phase 2) scripts/sync-role-docs.mjs (README + docs/ai-collab-protocols.md generator,
 *     reads content/roles.json directly, not this wrapper)
 *
 * Constraints (enforced at Playwright runtime per
 * AC-039-P1-ROLES-COUNT-INVARIANT + AC-039-P1-TSX-CANON):
 *   - ROLES.length === 6
 *   - Order: PM → Architect → Engineer → Reviewer → QA → Designer
 *   - Every `owns` + `artefact` string MUST match /^[^|\n`]*$/
 *     (no pipe, no unescaped newline, no unbalanced backtick) so the text
 *     is safe to inject into Markdown table cells by the Phase 2 generator.
 *
 * Vite note: `server.fs.allow: ['..']` in vite.config.ts permits dev-server
 * resolution of `../../../../content/roles.json`; TS `resolveJsonModule`
 * handles type-check-time resolution. Vite handles the JSON import natively
 * (no import-attribute needed for browser bundle path); Playwright E2E spec
 * intentionally bypasses this wrapper and reads the JSON via fs.readFileSync
 * so the spec-side loader is not sensitive to TS/ESM import-attribute
 * version drift (the binding "React renders JSON content" is covered by
 * separate rendered-DOM assertions in e2e/about.spec.ts).
 */
import rolesData from '../../../../content/roles.json'

export type RoleKey = 'PM' | 'Architect' | 'Engineer' | 'Reviewer' | 'QA' | 'Designer'

export interface RoleEntry {
  fileNo: number
  role: RoleKey
  owns: string
  artefact: string
}

export const ROLES: readonly RoleEntry[] = rolesData as readonly RoleEntry[]
