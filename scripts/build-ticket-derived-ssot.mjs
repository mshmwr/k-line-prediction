/**
 * K-052 build-ticket-derived-ssot.mjs
 *
 * Single-parse pipeline: reads ticket corpus once → emits 3 artefacts:
 *   1. content/site-content.json  — metrics (featuresShipped, acCoverage, postMortemsWritten, lessonsCodified)
 *   2. docs/sacred-registry.md    — Sacred clause lifecycle registry
 *   3. README.md                  — STACK + NAMED-ARTEFACTS marker blocks (JSON → README direction)
 *
 * CLI flags:
 *   (none)      Emit mode. Reads corpus, writes 3 targets. Idempotent.
 *   --check     Diff mode. Builds in-memory artefacts, diffs vs on-disk. No writes. Exit 1 on drift.
 *   --verbose   Per-ticket parse log + per-target byte count. Default off.
 *
 * Exit codes:
 *   0  All 3 targets in sync (--check) OR all 3 written (default)
 *   1  Drift in 1+ target (--check) OR write error in 1+ target (default)
 *   2  Parse error before any emit target reached
 *   3  Sacred lifecycle invariant violated (PM-action-required, not regen-fixable)
 *
 * Design doc: docs/designs/K-052-content-ssot.md §1–14
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))

// REPO_ROOT = the worktree (or canonical checkout) root = scripts/../
// This works in both canonical checkout and git worktrees because the script
// always lives at <worktree-root>/scripts/build-ticket-derived-ssot.mjs.
const REPO_ROOT = join(__dirname, '..')

// CANONICAL_REPO_ROOT: the main K-Line-Prediction checkout (not a worktree).
// Used only for computing CLAUDE_CONFIG_PATH (§5.1 design doc).
// In canonical: same as REPO_ROOT.
// In worktree (.claude/worktrees/K-NNN-<slug>/): navigate up 3 dirs (worktree/→.claude/→K-Line-Prediction/).
// Verified: join(REPO_ROOT, '../../..') from worktree = K-Line-Prediction/
let CANONICAL_REPO_ROOT = REPO_ROOT
try {
  const gitCommonDir = execSync('git rev-parse --git-common-dir', {
    cwd: REPO_ROOT, encoding: 'utf-8',
  }).trim()
  // git-common-dir is always K-Line-Prediction/.git regardless of worktree
  CANONICAL_REPO_ROOT = join(gitCommonDir, '..')
} catch { /* use REPO_ROOT as fallback */ }

// CLI flags
const args = process.argv.slice(2)
const CHECK_MODE = args.includes('--check')
const VERBOSE = args.includes('--verbose')

// Emit target paths
const SITE_CONTENT_PATH = join(REPO_ROOT, 'content', 'site-content.json')
const SACRED_REGISTRY_PATH = join(REPO_ROOT, 'docs', 'sacred-registry.md')
const README_PATH = join(REPO_ROOT, 'README.md')

// claude-config path for lessonsCodified count (§5.1)
// CANONICAL_REPO_ROOT = K-Line-Prediction/, so ../../claude-config = ~/Diary/claude-config
const CLAUDE_CONFIG_PATH = process.env.CLAUDE_CONFIG_PATH
  || join(CANONICAL_REPO_ROOT, '..', '..', 'claude-config')

// Link href map for badge categories (§14.3)
const LINK_HREF_BY_CATEGORY = {
  Frontend: 'https://vitejs.dev/',
  Backend: 'https://fastapi.tiangolo.com/',
  Hosting: 'https://firebase.google.com/',
  Tests: 'https://playwright.dev/',
}

// Live Demo badge — hardcoded, prepended verbatim (not derived from stack[])
const LIVE_DEMO_BADGE_LITERAL = '[![Live Demo](https://img.shields.io/badge/Live-Demo-blue)](https://k-line-prediction-app.web.app)'

// ── Utility ─────────────────────────────────────────────────────────────────

function sortKeysDeep(obj) {
  if (Array.isArray(obj)) return obj.map(sortKeysDeep)
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).sort().reduce((acc, k) => {
      acc[k] = sortKeysDeep(obj[k])
      return acc
    }, {})
  }
  return obj
}

function toJson(obj) {
  return JSON.stringify(sortKeysDeep(obj), null, 2) + '\n'
}

function sha256(text) {
  return 'sha256:' + createHash('sha256').update(text, 'utf8').digest('hex')
}

/** Normalize clause body for hashing per §10 */
function normalizeBody(body) {
  return body
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+$/mg, '')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '')
    .normalize('NFC')
}

// ── YAML frontmatter parser (minimal) ───────────────────────────────────────

function parseFrontmatter(content, filePath) {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  const yaml = match[1]
  const result = {}
  const lines = yaml.split('\n')
  let currentKey = null
  let listItems = []
  let inList = false

  for (const line of lines) {
    // Inline array: key: [val1, val2]
    const inlineArray = line.match(/^(\S[^:]*?):\s*\[([^\]]*)\]\s*$/)
    if (inlineArray) {
      const key = inlineArray[1].trim()
      const values = inlineArray[2].split(',').map(v => v.trim()).filter(Boolean)
      result[key] = values
      currentKey = null
      inList = false
      continue
    }
    // Key with value: key: value
    const keyVal = line.match(/^(\S[^:]*?):\s+(.+)$/)
    if (keyVal) {
      const key = keyVal[1].trim()
      const val = keyVal[2].trim()
      result[key] = val
      currentKey = key
      inList = false
      continue
    }
    // Key alone: key:
    const keyOnly = line.match(/^(\S[^:]*?):\s*$/)
    if (keyOnly) {
      currentKey = keyOnly[1].trim()
      inList = true
      listItems = []
      result[currentKey] = []
      continue
    }
    // List item: - value
    const listItem = line.match(/^\s+-\s+(.+)$/)
    if (listItem && inList && currentKey) {
      result[currentKey].push(listItem[1].trim())
      continue
    }
  }

  return result
}

// ── Ticket body sections ─────────────────────────────────────────────────────

function parseSection(content, heading) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`^##\\s+${escapedHeading}\\s*\\n([\\s\\S]*?)(?=^##\\s|$)`, 'm')
  const match = content.match(regex)
  if (!match) return ''
  return match[1]
}

/** §6 — detect non-empty AC section */
function hasNonEmptyACSection(content) {
  const match = content.match(/^##\s+(?:Acceptance Criteria|Acceptance criteria|AC)\s*\n([\s\S]*?)(?=^##\s|$)/m)
  if (!match) return false
  const body = match[1]
  return body.replace(/\s+/g, '').length > 0
}

/** §6 — detect non-empty Retrospective section */
function hasNonEmptyRetroSection(content) {
  const match = content.match(/^##\s+Retrospective\s*\n([\s\S]*?)(?=^##\s|$)/m)
  if (!match) return false
  const body = match[1]
  return body.replace(/\s+/g, '').length > 0
}

// ── Sacred clause body locator (§8.1) ────────────────────────────────────────

const RETIREMENT_SUFFIX_RE = /\s*\[RETIRED\s+by\s+(K-\d+(?:-?[A-Z]+)?)\s+(\d{4}-\d{2}-\d{2})\]/

/**
 * Locate a Sacred clause body within ticket content.
 * Returns { body, bodyHash, retiredSuffix } or null if not found.
 */
function locateClauseBody(content, clauseId, ticketPath) {
  const escapedId = clauseId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Accept both ## and ### heading levels; heading may have suffix decorations
  const regex = new RegExp(
    `^(##|###)\\s+(${escapedId})(?:[\\s—:\\[].*)?\n([\\s\\S]*?)(?=^(?:##|###)\\s|$)`,
    'm'
  )
  const match = content.match(regex)
  if (!match) return null

  const headingLine = match[0].split('\n')[0]
  const retiredMatch = headingLine.match(RETIREMENT_SUFFIX_RE)
  const retiredSuffix = retiredMatch ? headingLine.match(RETIREMENT_SUFFIX_RE)[0].trim() : null

  const rawBody = match[3]
  const normalized = normalizeBody(rawBody)
  return {
    body: normalized,
    bodyHash: sha256(normalized),
    retiredSuffix,
  }
}

// ── Parse ticket corpus (§2 single-parse) ───────────────────────────────────

function parseTicketCorpus() {
  // §3: glob K-*.md only (using readdirSync — no glob package needed)
  const ticketsDir = join(REPO_ROOT, 'docs', 'tickets')
  const ticketPaths = readdirSync(ticketsDir)
    .filter(f => /^K-\d+-.*\.md$/.test(f))
    .sort()
    .map(f => join('docs', 'tickets', f))

  const tickets = []
  let parseErrors = []

  for (const relPath of ticketPaths) {
    const content = readFileSync(join(REPO_ROOT, relPath), 'utf-8')
    const id = relPath.match(/K-\d+/)?.[0] || relPath

    let frontmatter
    try {
      frontmatter = parseFrontmatter(content, relPath)
    } catch (e) {
      parseErrors.push({ code: 2, msg: `${relPath}: YAML parse error — ${e.message}` })
      continue
    }

    // Detect Sacred clause bodies if sacred-clauses declared
    const sacredClauses = Array.isArray(frontmatter['sacred-clauses'])
      ? frontmatter['sacred-clauses']
      : []
    const sacredBodies = {}

    for (const clauseId of sacredClauses) {
      const located = locateClauseBody(content, clauseId, relPath)
      sacredBodies[clauseId] = located || null
    }

    // Better: scan for all headings with retirement suffix
    const retireSuffixBodies = {}
    const headingLineRegex = /^(##|###)\s+(AC-[A-Z0-9]+(?:-[A-Z0-9]+)+)(?:[^\n]*)$/gm
    let hlm
    while ((hlm = headingLineRegex.exec(content)) !== null) {
      const headingLine = hlm[0]
      const clauseId = hlm[2]
      const retiredMatch = headingLine.match(RETIREMENT_SUFFIX_RE)
      if (retiredMatch) {
        retireSuffixBodies[clauseId] = retiredMatch[0].trim()
      }
    }

    if (VERBOSE) {
      process.stdout.write(`  parsed ${relPath} (frontmatter keys: ${Object.keys(frontmatter).join(', ')})\n`)
    }

    tickets.push({
      id,
      path: relPath,
      frontmatter,
      content,
      sacredBodies,
      retireSuffixBodies,  // clauseIds that have [RETIRED by ...] in their headings
      hasNonEmptyAC: hasNonEmptyACSection(content),
      hasNonEmptyRetro: hasNonEmptyRetroSection(content),
    })
  }

  if (parseErrors.length > 0) {
    parseErrors.forEach(e => process.stderr.write(e.msg + '\n'))
    process.exit(2)
  }

  // Parse README once (§2 single-parse contract)
  const readmeContent = readFileSync(README_PATH, 'utf-8')

  return {
    tickets,
    readme: { content: readmeContent },
  }
}

// ── Compute metrics ──────────────────────────────────────────────────────────

function computeMetrics(tickets) {
  // §5.1: featuresShipped = closed tickets (permissive — no closed-commit gate)
  const featuresShipped = tickets.filter(t => t.frontmatter.status === 'closed').length

  // §5.1: acCoverage
  const total = tickets.length
  const covered = tickets.filter(t => t.hasNonEmptyAC).length

  // §5.1: postMortemsWritten
  const postMortemsWritten = tickets.filter(t => t.hasNonEmptyRetro).length

  // §5.1: lessonsCodified — count feedback_*.md in claude-config/memory/
  let lessonsCodified = null
  if (existsSync(CLAUDE_CONFIG_PATH)) {
    const memDir = join(CLAUDE_CONFIG_PATH, 'memory')
    const feedbackFiles = existsSync(memDir)
      ? readdirSync(memDir).filter(f => /^feedback_.*\.md$/.test(f))
      : []
    lessonsCodified = feedbackFiles.length
    if (VERBOSE) {
      process.stdout.write(`  lessonsCodified: ${lessonsCodified} feedback_*.md files in ${CLAUDE_CONFIG_PATH}/memory/\n`)
    }
  } else {
    process.stderr.write(`build-ticket-derived-ssot: WARNING — CLAUDE_CONFIG_PATH not found at ${CLAUDE_CONFIG_PATH}; lessonsCodified will be null\n`)
  }

  // §5.4: lastUpdated
  let lastUpdated
  try {
    lastUpdated = execSync('git log -1 --format=%cI -- docs/tickets/', {
      cwd: REPO_ROOT, encoding: 'utf-8',
    }).trim()
  } catch {
    lastUpdated = new Date().toISOString()
  }

  // §5.4: ticketRange
  const ids = tickets.map(t => {
    const m = t.id.match(/K-(\d+)/)
    return m ? parseInt(m[1], 10) : null
  }).filter(n => n !== null)
  const first = ids.length ? `K-${String(Math.min(...ids)).padStart(3, '0')}` : null
  const last = ids.length ? `K-${String(Math.max(...ids)).padStart(3, '0')}` : null

  return {
    featuresShipped,
    acCoverage: { covered, total },
    postMortemsWritten,
    lessonsCodified,
    lastUpdated,
    ticketRange: { first, last },
  }
}

// ── Writer 1: emitSiteContent ────────────────────────────────────────────────

function buildSiteContentJson(tickets, existingSiteContent) {
  const m = computeMetrics(tickets)

  // Preserve hand-edited fields: stack[], processRules[], renderSlots
  const preserved = existingSiteContent || {}

  const output = {
    lastUpdated: m.lastUpdated,
    metrics: {
      acCoverage: {
        covered: m.acCoverage.covered,
        format: '{covered} / {total} ({percent}%)',
        label: 'Documented AC Coverage',
        total: m.acCoverage.total,
      },
      featuresShipped: {
        label: 'Features Shipped',
        value: m.featuresShipped,
      },
      lessonsCodified: {
        label: 'Lessons Codified',
        value: m.lessonsCodified,
      },
      postMortemsWritten: {
        label: 'Post-mortems Written',
        value: m.postMortemsWritten,
      },
    },
    processRules: preserved.processRules || [],
    renderSlots: preserved.renderSlots || {
      about: { processRules: 5, stack: 0 },
      home: { processRules: 0, stack: 6 },
      readme: { processRules: 5, stack: 10 },
    },
    stack: preserved.stack || [],
    ticketRange: {
      first: m.ticketRange.first,
      last: m.ticketRange.last,
    },
  }

  return toJson(output)
}

function emitSiteContent(corpus, checkMode) {
  let existingSiteContent = null
  try {
    if (existsSync(SITE_CONTENT_PATH)) {
      existingSiteContent = JSON.parse(readFileSync(SITE_CONTENT_PATH, 'utf-8'))
    }
  } catch (e) {
    process.stderr.write(`build-ticket-derived-ssot: WARNING — could not parse existing site-content.json: ${e.message}\n`)
  }

  const generated = buildSiteContentJson(corpus.tickets, existingSiteContent)
  const relPath = relative(REPO_ROOT, SITE_CONTENT_PATH)

  if (checkMode) {
    const onDisk = existsSync(SITE_CONTENT_PATH)
      ? readFileSync(SITE_CONTENT_PATH, 'utf-8') : ''
    if (generated === onDisk) {
      process.stdout.write(`build-ticket-derived-ssot: ${relPath} already in sync\n`)
      return 0
    }
    // Find first drifted field
    let generated_obj, disk_obj
    try { generated_obj = JSON.parse(generated) } catch { generated_obj = {} }
    try { disk_obj = JSON.parse(onDisk) } catch { disk_obj = {} }
    // Simple top-level drift report (metrics fields)
    const genMetrics = generated_obj.metrics || {}
    const diskMetrics = disk_obj.metrics || {}
    let driftField = null
    for (const k of Object.keys(genMetrics)) {
      const gv = JSON.stringify(genMetrics[k])
      const dv = JSON.stringify(diskMetrics[k])
      if (gv !== dv) { driftField = `metrics.${k}`; break }
    }
    if (!driftField && generated_obj.lastUpdated !== disk_obj.lastUpdated) {
      driftField = 'lastUpdated'
    }
    if (!driftField && JSON.stringify(generated_obj.ticketRange) !== JSON.stringify(disk_obj.ticketRange)) {
      driftField = 'ticketRange'
    }
    process.stderr.write(
      `build-ticket-derived-ssot: DRIFT in ${relPath}\n` +
      `  field/clause: ${driftField || '(multiple fields)'}\n` +
      `  fix: node scripts/build-ticket-derived-ssot.mjs && git add ${relPath}\n`
    )
    return 1
  }

  try {
    writeFileSync(SITE_CONTENT_PATH, generated, 'utf-8')
    const m = JSON.parse(generated)
    process.stdout.write(
      `build-ticket-derived-ssot: wrote ${relPath}` +
      ` (featuresShipped=${m.metrics.featuresShipped.value},` +
      ` acCoverage=${m.metrics.acCoverage.covered}/${m.metrics.acCoverage.total},` +
      ` postMortems=${m.metrics.postMortemsWritten.value},` +
      ` lessons=${m.metrics.lessonsCodified.value ?? 'null'})\n`
    )
    return 0
  } catch (e) {
    process.stderr.write(`build-ticket-derived-ssot: FAILED to write ${relPath} — ${e.message}\n`)
    return 1
  }
}

// ── Sacred registry helpers ──────────────────────────────────────────────────

const SHIPPED_FILTER = t =>
  t.frontmatter.status === 'closed' &&
  t.frontmatter['closed-commit'] &&
  t.frontmatter['closed-commit'].trim() !== ''

/** §5.5 weight formula */
function computeWeight(processRule, tickets) {
  const severityScore = {
    'critical-blocker': 4,
    'warning': 2,
    'advisory': 1,
  }[processRule.severity] ?? 0

  // recencyScore: find addedAfter ticket's closed date
  let recencyScore = 0
  if (processRule.addedAfter) {
    const srcTicket = tickets.find(t => t.id === processRule.addedAfter)
    if (srcTicket && srcTicket.frontmatter.closed) {
      const daysAgo = (Date.now() - new Date(srcTicket.frontmatter.closed).getTime()) / (1000 * 86400)
      recencyScore = Math.max(0, 1 - daysAgo / 180)
    }
  }

  return recencyScore + severityScore
}

// ── Writer 2: emitSacredRegistry ────────────────────────────────────────────

function buildSacredRegistry(tickets) {
  const errors = []
  const entries = {}  // clauseId → entry

  // Pass 1: collect Sacred clauses from closed+shipped tickets
  for (const ticket of tickets.filter(SHIPPED_FILTER)) {
    const clauses = Array.isArray(ticket.frontmatter['sacred-clauses'])
      ? ticket.frontmatter['sacred-clauses'] : []
    for (const clauseId of clauses) {
      const bodyData = ticket.sacredBodies[clauseId]
      if (!bodyData) {
        errors.push({
          code: 3,
          msg: `${ticket.path}: ${ticket.id} declares ${clauseId} but body not found in ticket file`,
        })
        continue
      }
      if (!entries[clauseId]) {
        entries[clauseId] = {
          id: clauseId,
          sourceTicket: ticket.id,
          status: 'active',
          body: bodyData.body,
          bodyHash: bodyData.bodyHash,
          firstSeenAt: ticket.frontmatter.closed,
          lastModifiedBy: ticket.id,
          lastModifiedAt: ticket.frontmatter.closed,
          history: [{ at: ticket.frontmatter.closed, event: 'added', ticket: ticket.id }],
        }
      }
    }
  }

  // Pass 2: process modifies-sacred
  for (const ticket of tickets.filter(SHIPPED_FILTER)) {
    const modifies = Array.isArray(ticket.frontmatter['modifies-sacred'])
      ? ticket.frontmatter['modifies-sacred'] : []
    for (const clauseId of modifies) {
      const entry = entries[clauseId]
      if (!entry) {
        errors.push({
          code: 3,
          msg: `UNKNOWN MODIFY TARGET: ${ticket.path}: ${ticket.id} modifies-sacred:[${clauseId}] but no such Sacred clause exists in any closed-and-shipped ticket.`,
        })
        continue
      }
      // Find current body from source ticket
      const sourceTicket = tickets.find(t => t.id === entry.sourceTicket)
      if (!sourceTicket) continue
      const currentBodyData = locateClauseBody(sourceTicket.content, clauseId, sourceTicket.path)
      if (!currentBodyData) {
        errors.push({
          code: 3,
          msg: `${ticket.path}: ${ticket.id} modifies-sacred:[${clauseId}] but cannot locate body in source ticket ${entry.sourceTicket}`,
        })
        continue
      }
      if (currentBodyData.bodyHash === entry.bodyHash) {
        process.stderr.write(
          `NO-OP MODIFY: ${ticket.id} declares modifies-sacred:[${clauseId}] but body sha256 unchanged. Remove the declaration or edit the source.\n`
        )
      } else {
        entry.body = currentBodyData.body
        entry.bodyHash = currentBodyData.bodyHash
        entry.lastModifiedBy = ticket.id
        entry.lastModifiedAt = ticket.frontmatter.closed
        entry.history.push({ at: ticket.frontmatter.closed, event: 'modified', ticket: ticket.id })
      }
    }
  }

  // Pass 3: detect unannotated drift
  for (const [clauseId, entry] of Object.entries(entries)) {
    const sourceTicket = tickets.find(t => t.id === entry.sourceTicket)
    if (!sourceTicket) continue
    const currentBodyData = locateClauseBody(sourceTicket.content, clauseId, sourceTicket.path)
    if (!currentBodyData) continue
    if (currentBodyData.bodyHash !== entry.bodyHash) {
      // Check if any shipped ticket declares modifies-sacred for this clause
      const reconcileTicket = tickets.find(t =>
        SHIPPED_FILTER(t) &&
        Array.isArray(t.frontmatter['modifies-sacred']) &&
        t.frontmatter['modifies-sacred'].includes(clauseId)
      )
      if (!reconcileTicket) {
        errors.push({
          code: 3,
          msg: `UNANNOTATED DRIFT: ${clauseId} body changed in ${entry.sourceTicket} (current sha256:${currentBodyData.bodyHash}, registry sha256:${entry.bodyHash}); no closed-and-shipped ticket declares modifies-sacred:[${clauseId}]. Open a reconcile ticket or revert the source.`,
        })
      }
    }
  }

  // Pass 4: process retires-sacred
  for (const ticket of tickets.filter(SHIPPED_FILTER)) {
    const retires = Array.isArray(ticket.frontmatter['retires-sacred'])
      ? ticket.frontmatter['retires-sacred'] : []
    for (const clauseId of retires) {
      const entry = entries[clauseId]
      if (!entry) {
        errors.push({
          code: 3,
          msg: `ORPHANED RETIRE: ${ticket.path}: ${ticket.id} retires ${clauseId} but no such Sacred clause exists.`,
        })
        continue
      }
      const sourceTicket = tickets.find(t => t.id === entry.sourceTicket)
      if (!sourceTicket) continue
      const currentBodyData = locateClauseBody(sourceTicket.content, clauseId, sourceTicket.path)
      if (!currentBodyData || !currentBodyData.retiredSuffix) {
        errors.push({
          code: 3,
          msg: `MISSING ANNOTATION: ${ticket.id} retires ${clauseId} but source ticket ${entry.sourceTicket} clause heading lacks [RETIRED by ${ticket.id} YYYY-MM-DD] suffix. Annotate source heading or remove retires-sacred declaration.`,
        })
        continue
      }
      entry.originalText = entry.body
      entry.status = `retired-by: ${ticket.id}`
      entry.retiredAt = ticket.frontmatter.closed
      entry.history.push({ at: ticket.frontmatter.closed, event: 'retired', ticket: ticket.id })
    }
  }

  // Pass 5: orphaned retirement-suffix detection
  for (const ticket of tickets) {
    for (const [clauseId, retiredSuffix] of Object.entries(ticket.retireSuffixBodies)) {
      const retireTicketMatch = retiredSuffix.match(/RETIRED\s+by\s+(K-\d+)/)
      if (!retireTicketMatch) continue
      const retireTicketId = retireTicketMatch[1]
      const retireTicket = tickets.find(t => t.id === retireTicketId)
      if (!retireTicket ||
          !Array.isArray(retireTicket.frontmatter['retires-sacred']) ||
          !retireTicket.frontmatter['retires-sacred'].includes(clauseId)) {
        errors.push({
          code: 3,
          msg: `ORPHANED ANNOTATION: ${ticket.path}:${clauseId} has [RETIRED by ${retireTicketId}] but ${retireTicketId} frontmatter omits retires-sacred:[${clauseId}]. Add the declaration or revert the suffix.`,
        })
      }
    }
  }

  if (errors.length > 0) {
    errors.forEach(e => process.stderr.write(e.msg + '\n'))
    process.exit(3)
  }

  // Also: warn about in-flight tickets with sacred-clauses but no closed-commit
  for (const ticket of tickets) {
    const clauses = Array.isArray(ticket.frontmatter['sacred-clauses'])
      ? ticket.frontmatter['sacred-clauses'] : []
    if (clauses.length > 0 && (!ticket.frontmatter['closed-commit'] || ticket.frontmatter['closed-commit'].trim() === '')) {
      process.stderr.write(
        `${ticket.id} has sacred-clauses but no closed-commit; skipped (in-flight)\n`
      )
    }
  }

  return entries
}

function renderSacredRegistry(entries) {
  const all = Object.values(entries)
  const active = all.filter(e => e.status === 'active')
  const retired = all.filter(e => e.status !== 'active')
  const sourceTicketIds = [...new Set(all.map(e => e.sourceTicket))].sort()

  const lines = [
    '# Sacred Clause Registry',
    '',
    `<!-- Auto-generated by scripts/build-ticket-derived-ssot.mjs — DO NOT EDIT DIRECTLY -->`,
    `<!-- ${active.length} active, ${retired.length} retired, ${sourceTicketIds.length} source tickets -->`,
    '',
  ]

  if (all.length === 0) {
    lines.push('(no Sacred clauses registered yet)')
    lines.push('')
    return lines.join('\n')
  }

  // Sort: active first, then retired, each alphabetical by id
  const sorted = [
    ...active.sort((a, b) => a.id.localeCompare(b.id)),
    ...retired.sort((a, b) => a.id.localeCompare(b.id)),
  ]

  for (const entry of sorted) {
    lines.push(`## ${entry.id}`)
    lines.push('')
    lines.push(`- **status:** ${entry.status}`)
    lines.push(`- **sourceTicket:** ${entry.sourceTicket}`)
    lines.push(`- **bodyHash:** ${entry.bodyHash}`)
    lines.push(`- **firstSeenAt:** ${entry.firstSeenAt}`)
    lines.push(`- **lastModifiedBy:** ${entry.lastModifiedBy}`)
    lines.push(`- **lastModifiedAt:** ${entry.lastModifiedAt}`)
    if (entry.retiredAt) lines.push(`- **retiredAt:** ${entry.retiredAt}`)
    lines.push('')
    lines.push('### History')
    lines.push('')
    for (const h of entry.history) {
      lines.push(`- ${h.event} — ${h.ticket} at ${h.at}`)
    }
    lines.push('')
    lines.push('### Body')
    lines.push('')
    lines.push('```')
    lines.push(entry.body)
    lines.push('```')
    lines.push('')
  }

  return lines.join('\n')
}

function emitSacredRegistry(corpus, checkMode) {
  let entries
  try {
    entries = buildSacredRegistry(corpus.tickets)
  } catch (e) {
    process.stderr.write(`build-ticket-derived-ssot: FAILED to build Sacred registry — ${e.message}\n`)
    return 1
  }

  const generated = renderSacredRegistry(entries)
  const relPath = relative(REPO_ROOT, SACRED_REGISTRY_PATH)
  const active = Object.values(entries).filter(e => e.status === 'active').length
  const retired = Object.values(entries).filter(e => e.status !== 'active').length
  const sourceTickets = [...new Set(Object.values(entries).map(e => e.sourceTicket))].length

  if (checkMode) {
    const onDisk = existsSync(SACRED_REGISTRY_PATH)
      ? readFileSync(SACRED_REGISTRY_PATH, 'utf-8') : ''
    if (generated === onDisk) {
      process.stdout.write(`build-ticket-derived-ssot: ${relPath} already in sync\n`)
      return 0
    }
    process.stderr.write(
      `build-ticket-derived-ssot: DRIFT in ${relPath}\n` +
      `  fix: node scripts/build-ticket-derived-ssot.mjs && git add ${relPath}\n`
    )
    return 1
  }

  try {
    writeFileSync(SACRED_REGISTRY_PATH, generated, 'utf-8')
    process.stdout.write(
      `build-ticket-derived-ssot: wrote ${relPath} (${active} active, ${retired} retired, ${sourceTickets} source tickets)\n`
    )
    return 0
  } catch (e) {
    process.stderr.write(`build-ticket-derived-ssot: FAILED to write ${relPath} — ${e.message}\n`)
    return 1
  }
}

// ── Writer 3: emitReadmeMarkers ──────────────────────────────────────────────

function renderStackBadges(stack, slotCount) {
  const limited = stack.slice(0, slotCount)

  // Group by category, preserving first-seen order
  const groups = []
  const seen = new Set()
  for (const entry of limited) {
    if (!seen.has(entry.category)) {
      seen.add(entry.category)
      groups.push({ category: entry.category, entries: [] })
    }
    groups.find(g => g.category === entry.category).entries.push(entry)
  }

  const lines = []
  for (const { category, entries } of groups) {
    const namesEncoded = entries.map(e => encodeURIComponent(e.name).replace(/%20/g, '%20')).join('%20%2B%20')
    const first = entries[0]
    const logoSegment = first.logo ? `?logo=${first.logo}` : ''
    const linkHref = LINK_HREF_BY_CATEGORY[category] || '#'
    lines.push(`[![${category}](https://img.shields.io/badge/${category}-${namesEncoded}-${first.color}${logoSegment})](${linkHref})`)
  }

  // Live-Demo badge prepended verbatim
  lines.unshift(LIVE_DEMO_BADGE_LITERAL)
  return lines.join('\n')
}

function renderNamedArtefacts(processRules, slotCount, tickets) {
  // Compute weights and sort
  const withWeights = processRules.map(r => ({
    ...r,
    _weight: computeWeight(r, tickets),
  }))
  const sorted = [...withWeights].sort((a, b) =>
    b._weight - a._weight || a.id.localeCompare(b.id)
  )
  const limited = sorted.slice(0, slotCount)

  return limited.map(r => {
    const anchor = r.ticketAnchor
      ? `${r.ticketAnchor}`
      : (r.id ? `docs/tickets/${r.id}` : '#')
    const anchorLabel = r.ticketAnchor
      ? r.ticketAnchor
      : r.id
    return `- **${r.title}** — ${r.summary} See [${anchorLabel}](${r.ticketAnchor ? `./${r.ticketAnchor}` : '#'}).`
  }).join('\n')
}

function emitReadmeMarkers(corpus, siteContent, checkMode) {
  const readmeContent = corpus.readme.content
  const relPath = relative(REPO_ROOT, README_PATH)

  // §14.2: Locate marker pairs
  const stackMarkerRe = /<!--\s*STACK:start\s*-->\n([\s\S]*?)\n<!--\s*STACK:end\s*-->/
  const namedArtefactsRe = /<!--\s*NAMED-ARTEFACTS:start\s*-->\n([\s\S]*?)\n<!--\s*NAMED-ARTEFACTS:end\s*-->/

  const stackMatch = readmeContent.match(stackMarkerRe)
  const namedMatch = readmeContent.match(namedArtefactsRe)

  if (!stackMatch) {
    process.stderr.write(`build-ticket-derived-ssot: README missing <!-- STACK:start --> marker pair (exit 2)\n`)
    process.exit(2)
  }
  if (!namedMatch) {
    process.stderr.write(`build-ticket-derived-ssot: README missing <!-- NAMED-ARTEFACTS:start --> marker pair (exit 2)\n`)
    process.exit(2)
  }

  // §14.3: Generate stack badges from JSON
  const stackContent = renderStackBadges(
    siteContent.stack || [],
    (siteContent.renderSlots?.readme?.stack) ?? 10
  )

  // §14.4: Generate named artefacts from JSON
  const namedContent = renderNamedArtefacts(
    siteContent.processRules || [],
    (siteContent.renderSlots?.readme?.processRules) ?? 5,
    corpus.tickets
  )

  // Replace marker block contents
  let newReadme = readmeContent
    .replace(stackMarkerRe, `<!-- STACK:start -->\n${stackContent}\n<!-- STACK:end -->`)
    .replace(namedArtefactsRe, `<!-- NAMED-ARTEFACTS:start -->\n${namedContent}\n<!-- NAMED-ARTEFACTS:end -->`)

  if (checkMode) {
    if (newReadme === readmeContent) {
      process.stdout.write(`build-ticket-derived-ssot: ${relPath} marker blocks already in sync\n`)
      return 0
    }
    // Find which marker pair drifted
    const currentStack = (stackMatch[1] || '').trim()
    const currentNamed = (namedMatch[1] || '').trim()
    const genStack = stackContent.trim()
    const genNamed = namedContent.trim()

    if (currentStack !== genStack) {
      process.stderr.write(
        `build-ticket-derived-ssot: DRIFT in ${relPath}\n` +
        `  field/clause: STACK marker block\n` +
        `  fix: node scripts/build-ticket-derived-ssot.mjs && git add ${relPath}\n`
      )
    }
    if (currentNamed !== genNamed) {
      process.stderr.write(
        `build-ticket-derived-ssot: DRIFT in ${relPath}\n` +
        `  field/clause: NAMED-ARTEFACTS marker block\n` +
        `  fix: node scripts/build-ticket-derived-ssot.mjs && git add ${relPath}\n`
      )
    }
    return 1
  }

  try {
    writeFileSync(README_PATH, newReadme, 'utf-8')
    const stackLines = stackContent.split('\n').length
    const namedLines = namedContent.split('\n').length
    process.stdout.write(
      `build-ticket-derived-ssot: wrote ${relPath} marker blocks (STACK: ${stackLines} badge lines, NAMED-ARTEFACTS: ${namedLines} entries)\n`
    )
    return 0
  } catch (e) {
    process.stderr.write(`build-ticket-derived-ssot: FAILED to write ${relPath} — ${e.message}\n`)
    return 1
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (VERBOSE) {
    process.stdout.write(`build-ticket-derived-ssot: mode=${CHECK_MODE ? 'check' : 'emit'}\n`)
  }

  // Single parse (§2 contract)
  const corpus = parseTicketCorpus()

  if (VERBOSE) {
    process.stdout.write(`build-ticket-derived-ssot: parsed ${corpus.tickets.length} K-* tickets\n`)
  }

  // Read existing site-content.json to preserve hand-edited fields
  let existingSiteContent = null
  try {
    if (existsSync(SITE_CONTENT_PATH)) {
      existingSiteContent = JSON.parse(readFileSync(SITE_CONTENT_PATH, 'utf-8'))
    }
  } catch { /* non-fatal */ }

  // Run all 3 writers with failure isolation (§2)
  const writerStatus = []

  try {
    const code = emitSiteContent(corpus, CHECK_MODE)
    writerStatus.push({ target: SITE_CONTENT_PATH, code })
  } catch (e) {
    process.stderr.write(`build-ticket-derived-ssot: FAILED emitSiteContent — ${e.message}\n`)
    writerStatus.push({ target: SITE_CONTENT_PATH, code: 1 })
  }

  try {
    const code = emitSacredRegistry(corpus, CHECK_MODE)
    writerStatus.push({ target: SACRED_REGISTRY_PATH, code })
  } catch (e) {
    process.stderr.write(`build-ticket-derived-ssot: FAILED emitSacredRegistry — ${e.message}\n`)
    writerStatus.push({ target: SACRED_REGISTRY_PATH, code: 1 })
  }

  // For README markers writer, pass the (possibly updated) siteContent
  let siteContentForReadme = existingSiteContent
  if (!CHECK_MODE && existsSync(SITE_CONTENT_PATH)) {
    try {
      siteContentForReadme = JSON.parse(readFileSync(SITE_CONTENT_PATH, 'utf-8'))
    } catch { /* use old */ }
  }

  try {
    const code = emitReadmeMarkers(corpus, siteContentForReadme || {}, CHECK_MODE)
    writerStatus.push({ target: README_PATH, code })
  } catch (e) {
    process.stderr.write(`build-ticket-derived-ssot: FAILED emitReadmeMarkers — ${e.message}\n`)
    writerStatus.push({ target: README_PATH, code: 1 })
  }

  // §2: exit code = max of all writer exit codes
  const finalCode = Math.max(...writerStatus.map(s => s.code))
  process.exit(finalCode)
}

main().catch(e => {
  process.stderr.write(`build-ticket-derived-ssot: unhandled error — ${e.message}\n${e.stack}\n`)
  process.exit(2)
})
