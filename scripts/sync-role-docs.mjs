#!/usr/bin/env node
/**
 * K-039 Phase 2 — sync-role-docs generator.
 *
 * Reads `content/roles.json` (the language-neutral text SSOT) and rewrites
 * the Markdown tables inside `<!-- ROLES:start -->` / `<!-- ROLES:end -->`
 * markers in both downstream consumers:
 *
 *   - README.md                        (repo-root portfolio table)
 *   - docs/ai-collab-protocols.md     (site /docs runtime table; K-017
 *                                      prebuild rsyncs this to
 *                                      frontend/public/docs/ at build time)
 *
 * Modes:
 *   node scripts/sync-role-docs.mjs           → write (default)
 *   node scripts/sync-role-docs.mjs --check   → diff-only, exit 1 on drift
 *
 * Idempotency: running on a clean tree produces no diff. Running on a
 * dirty tree deterministically writes the canonical table derived from
 * content/roles.json (no merge).
 *
 * Coupled with `.githooks/pre-commit` (repo-root) which invokes this with
 * `--check` to block commits that drop the tables out of sync.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __here = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__here, '..')

const CONTENT_JSON = join(REPO_ROOT, 'content', 'roles.json')
const README_PATH = join(REPO_ROOT, 'README.md')
const PROTOCOLS_PATH = join(REPO_ROOT, 'docs', 'ai-collab-protocols.md')

const MARKER_START = '<!-- ROLES:start -->'
const MARKER_END = '<!-- ROLES:end -->'

const CHECK_MODE = process.argv.includes('--check')

/**
 * Build the canonical Markdown table from ROLES.
 * Columns: Role | Owns | Artefact.
 * Header + separator + 6 data rows. Trailing newline at end of block.
 */
function buildTable(roles) {
  const lines = []
  lines.push('| Role | Owns | Artefact |')
  lines.push('|---|---|---|')
  for (const r of roles) {
    lines.push(`| ${r.role} | ${r.owns} | ${r.artefact} |`)
  }
  return lines.join('\n') + '\n'
}

/**
 * Rewrite the marker-delimited block in `fileContents` with `newBlock`.
 * Preserves everything outside markers. Throws if markers missing or
 * out of order. Preserves the marker lines themselves verbatim.
 */
function replaceMarkerBlock(fileContents, newBlock) {
  const startIdx = fileContents.indexOf(MARKER_START)
  const endIdx = fileContents.indexOf(MARKER_END)
  if (startIdx < 0 || endIdx < 0 || endIdx < startIdx) {
    throw new Error(
      `markers missing or out of order (start=${startIdx}, end=${endIdx})`,
    )
  }
  const before = fileContents.slice(0, startIdx + MARKER_START.length)
  const after = fileContents.slice(endIdx)
  return `${before}\n${newBlock}${after}`
}

function main() {
  const roles = JSON.parse(readFileSync(CONTENT_JSON, 'utf-8'))
  if (!Array.isArray(roles) || roles.length !== 6) {
    throw new Error(
      `content/roles.json must be an array of 6 roles, got ${Array.isArray(roles) ? roles.length : typeof roles}`,
    )
  }
  const table = buildTable(roles)

  const targets = [
    { path: README_PATH, label: 'README.md' },
    { path: PROTOCOLS_PATH, label: 'docs/ai-collab-protocols.md' },
  ]

  let drift = 0
  for (const { path, label } of targets) {
    const current = readFileSync(path, 'utf-8')
    const updated = replaceMarkerBlock(current, table)
    if (current === updated) {
      process.stdout.write(`sync-role-docs: ${label} already in sync\n`)
      continue
    }
    if (CHECK_MODE) {
      process.stderr.write(
        `sync-role-docs: DRIFT in ${label} — run \`node scripts/sync-role-docs.mjs\` to regenerate\n`,
      )
      drift += 1
      continue
    }
    writeFileSync(path, updated)
    process.stdout.write(`sync-role-docs: wrote ${label}\n`)
  }

  if (CHECK_MODE && drift > 0) {
    process.exit(1)
  }
}

main()
