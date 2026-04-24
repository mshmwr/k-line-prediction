/**
 * K-039 Phase 1 — roles-doc-sync regression gate.
 *
 * Enforces that the language-neutral content SSOT `content/roles.json`
 * (repo-root, see K-039 Phase 1.5 user-BQ ruling) is the single source of
 * truth for role/owns/artefact text, and that the two downstream Markdown
 * tables (README.md + docs/ai-collab-protocols.md) remain byte-aligned with
 * it between the `<!-- ROLES:start -->` / `<!-- ROLES:end -->` markers.
 * Covers:
 *
 *   - AC-039-P1-ROLES-COUNT-INVARIANT: ROLES.length === 6
 *   - AC-039-P1-TSX-CANON: every `owns` + `artefact` matches /^[^|\n`]*$/
 *   - AC-039-P1-README-SYNCED: marker-delimited README table deep-equals JSON
 *   - AC-039-P1-PROTOCOLS-SYNCED: marker-delimited protocols.md table deep-equals JSON
 *   - AC-039-P1-MARKER-IDEMPOTENT: both files retain markers verbatim
 *   - AC-039-P1-PLAYWRIGHT-REGRESSION: spec FAILs on any drift
 *
 * FAIL-IF-GATE-REMOVED (AC-039-P1-FAIL-IF-GATE-REMOVED) — Engineer dry-run
 * replaces one word in README inside the markers; this spec must turn red,
 * then revert must turn it green again. Evidence recorded in ticket §8.
 *
 * Loader note (Phase 1.5 refactor): this spec reads `content/roles.json`
 * directly via `fs.readFileSync` rather than through the React TS wrapper
 * (`frontend/src/components/about/roles.ts`). Rationale: Playwright's
 * Node-ESM loader in this version does not accept `with { type: 'json' }`
 * import attributes; reading JSON via fs decouples the spec from the
 * tool-version-sensitive JSON-import pipeline. The binding "React renders
 * JSON content" is preserved by separate rendered-DOM assertions in
 * e2e/about.spec.ts (AC-017-ROLES, AC-022-ROLE-GRID-HEIGHT, AC-034-P2-FILENOBAR-VARIANTS).
 *
 * No DOM / no Playwright `page` — this is a pure-data regression spec. We
 * use the Playwright test runner for integration with the existing suite
 * and report surface (QA picks up green/red from the same run).
 */
import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __here = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__here, '..', '..')
const README_PATH = join(REPO_ROOT, 'README.md')
const PROTOCOLS_PATH = join(REPO_ROOT, 'docs', 'ai-collab-protocols.md')
const CONTENT_JSON_PATH = join(REPO_ROOT, 'content', 'roles.json')

interface RoleEntry {
  fileNo: number
  role: string
  owns: string
  artefact: string
}

const ROLES: readonly RoleEntry[] = JSON.parse(readFileSync(CONTENT_JSON_PATH, 'utf-8'))

const MARKER_START = '<!-- ROLES:start -->'
const MARKER_END = '<!-- ROLES:end -->'

/**
 * Extracts the Markdown table between the sync markers, parses it into rows of
 * { role, owns, artefact }, and returns both the parsed rows and marker presence.
 *
 * The extraction is intentionally strict: missing markers → empty rows (spec
 * FAILs with a clear message rather than silently skipping).
 */
function parseMarkerTable(fileContents: string): {
  hasMarkers: boolean
  rows: Array<{ role: string; owns: string; artefact: string }>
} {
  const startIdx = fileContents.indexOf(MARKER_START)
  const endIdx = fileContents.indexOf(MARKER_END)
  if (startIdx < 0 || endIdx < 0 || endIdx < startIdx) {
    return { hasMarkers: false, rows: [] }
  }
  const between = fileContents.slice(startIdx + MARKER_START.length, endIdx)
  const rows: Array<{ role: string; owns: string; artefact: string }> = []
  for (const rawLine of between.split('\n')) {
    const line = rawLine.trim()
    // Skip empty lines, header row, and the `|---|---|---|` separator row.
    if (!line.startsWith('|')) continue
    if (/^\|[\s-|:]+\|$/.test(line)) continue
    // Expected: `| Role | Owns | Artefact |` header OR data row.
    const cells = line
      .split('|')
      .slice(1, -1) // drop the empty entries from leading/trailing pipes
      .map((c) => c.trim())
    if (cells.length !== 3) continue
    // Skip the header row (matches the literal header verbatim).
    if (cells[0] === 'Role' && cells[1] === 'Owns' && cells[2] === 'Artefact') continue
    rows.push({ role: cells[0], owns: cells[1], artefact: cells[2] })
  }
  return { hasMarkers: true, rows }
}

/** Projection of `ROLES` to the shape stored in Markdown tables. */
function projectRoles(): Array<{ role: string; owns: string; artefact: string }> {
  return ROLES.map((r) => ({
    role: r.role,
    owns: r.owns,
    artefact: r.artefact,
  }))
}

test.describe('K-039 Phase 1 — roles-doc-sync regression gate (no page)', () => {
  test('AC-039-P1-ROLES-COUNT-INVARIANT: ROLES.length === 6', () => {
    expect(ROLES.length).toBe(6)
  })

  test('AC-039-P1-TSX-CANON: every owns + artefact matches /^[^|\\n`]*$/', () => {
    const re = /^[^|\n`]*$/
    for (const entry of ROLES) {
      expect(entry.owns, `ROLES[${entry.role}].owns contains pipe/newline/backtick`).toMatch(re)
      expect(entry.artefact, `ROLES[${entry.role}].artefact contains pipe/newline/backtick`).toMatch(
        re,
      )
    }
  })

  test('AC-039-P1-README-SYNCED: marker-delimited README table matches TSX verbatim', () => {
    const contents = readFileSync(README_PATH, 'utf-8')
    const { hasMarkers, rows } = parseMarkerTable(contents)
    expect(hasMarkers, `README.md missing ${MARKER_START} / ${MARKER_END} markers`).toBe(true)
    expect(rows, 'README.md table rows must deep-equal ROLES projection').toEqual(projectRoles())
  })

  test('AC-039-P1-PROTOCOLS-SYNCED: marker-delimited protocols table matches TSX verbatim', () => {
    const contents = readFileSync(PROTOCOLS_PATH, 'utf-8')
    const { hasMarkers, rows } = parseMarkerTable(contents)
    expect(
      hasMarkers,
      `docs/ai-collab-protocols.md missing ${MARKER_START} / ${MARKER_END} markers`,
    ).toBe(true)
    expect(
      rows,
      'docs/ai-collab-protocols.md table rows must deep-equal ROLES projection',
    ).toEqual(projectRoles())
  })
})
