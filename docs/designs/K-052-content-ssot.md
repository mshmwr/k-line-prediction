# Design Doc — K-052 Ticket-Derived SSOT (triple-emit + Designer persona patch)

**Ticket:** [K-052](../tickets/K-052-content-ssot.md)
**Worktree:** `.claude/worktrees/K-052-content-ssot/`
**Architect Phase:** 2 → 1.5 redesign needed
**Status:** Phase 2 delivered under "README is source" assumption; user reframe 2026-04-27 reverses direction. Architect Phase 1.5 dispatch pending in new session.
**Updated:** 2026-04-27 (Phase 1.5 stamp)

> **⚠️ Phase 1.5 redesign needed (BQ-052-14 thru BQ-052-17 in PRD Lock-Ins).** This doc was produced under "README is source-of-truth on overlap → generator reads README marker block, emits to JSON" assumption. User reframe locks JSON-is-source: generator writes README marker blocks FROM JSON. Sections marked **[REVERSE NEEDED]** below require rewrite. Sections without that tag remain valid.
>
> **Delta scope for Phase 1.5:**
> 1. §14 (README marker block consumer wiring) — direction reversed: JSON → README write, not README → JSON read
> 2. New §16 — bootstrap one-shot script `scripts/bootstrap-site-content-from-readme.mjs` (parses README current content → seeds JSON, then `git rm` same commit)
> 3. New §17 — PM persona patch for `~/.claude/agents/pm.md` Phase Gate ticket-close checklist (site-content.json review item per BQ-052-16)
> 4. Schema update — `processRules[].severity` becomes structured JSON field (was inline README tag); `renderSlots.{home,about,readme}` per-consumer count fields
>
> **Sections still valid:** §1 (build script API), §2 (single-parse architecture), §3 (TD-vs-K filter), §4 (generator filename), §5 (JSON schema lock — extended with severity/renderSlots), §6 (AC-detection regex), §7 (Vite asset wiring), §8-13 (Sacred sections per BQ-052-17), §15 (Designer persona patch).
>
> Lock-Ins anchor: PRD §BQ Resolution Lock-Ins (2026-04-27 + Phase 1.5 reversal). Where this doc and the older PRD §Architecture / §Scope / §AC sections conflict, Lock-Ins wins.

---

## 0. Scope Questions (PM rulings already locked, none open at design lock)

All Phase-1 BQs resolved by PM in PRD Lock-Ins table. No new contradictions surfaced during Phase 2 design that PM needs to rule on. One residual risk remains tracked as a Known Gap not a BQ:

- **K-G-01 — RESOLVED (BQ-052-12 ruled A — Category filter, 2026-04-27).** Home consumer filters `stack[]` by `category ∈ {language, framework, build-tool, e2e-test}` → renders 6 items (matches current visual). README marker block renders all 10 (no filter). Slot counts now codified in JSON `renderSlots.home.stack: 6` / `renderSlots.readme.stack: 10` (§5.7). No further BQ on this surface.

No prior Engineer Pre-Implementation Design Challenge Sheet exists (Phase 4 not yet dispatched). When that sheet lands, Architect will append §18 Verdict Sheet here per Same-Session Verdict Obligation.

---

## 1. Build script API

**Filename:** `scripts/build-ticket-derived-ssot.mjs` (locked — see §4)

**CLI flags:**

| Flag | Behaviour |
|---|---|
| (none, default) | Emit mode. Reads ticket corpus, writes 3 emit targets. Idempotent. |
| `--check` | Diff mode. Reads ticket corpus, builds in-memory artefacts, diffs vs on-disk. **No filesystem writes.** Exit code reflects drift. |
| `--verbose` | Adds per-ticket parse log line + per-emit-target byte count. Default off; CI may opt in. |

**Exit codes (precise per emit target):**

| Code | Meaning |
|---|---|
| `0` | All 3 emit targets in sync (--check) OR all 3 written successfully (default) |
| `1` | Drift in 1+ emit target (--check) OR write error in 1+ emit target (default). Stderr names each affected target by file path + offending field/clause ID |
| `2` | Parse error before any emit target reached (malformed YAML frontmatter, missing required field on a Sacred-bearing ticket, marker block missing in README). Halts before any write. |
| `3` | Sacred lifecycle invariant violated (unannotated body drift, orphaned `retires-sacred:`, body-text drift without `modifies-sacred:`). Different from code 1 because these are PM-action-required, not regen-fixable. |

**Drift output format (stderr, one block per drifted target):**

```
build-ticket-derived-ssot: DRIFT in <relative-path>
  field/clause: <e.g. metrics.featuresShipped.value OR AC-K021-FOOTER OR stack[2].name>
  expected: <regenerated value, truncated to 80 chars + ellipsis>
  on-disk:  <current value, truncated to 80 chars + ellipsis>
  fix: node scripts/build-ticket-derived-ssot.mjs && git add <relative-path>
```

For Sacred-lifecycle violations (exit 3), drift output names BOTH the source ticket (where body changed) AND the missing reconcile ticket (which should have declared `modifies-sacred:` / `retires-sacred:`).

**Log line format on default (one per emit target):**

```
build-ticket-derived-ssot: wrote content/site-content.json (4 metrics, 10 stack items, 3 processRules)
build-ticket-derived-ssot: wrote docs/sacred-registry.md (7 active, 0 retired, 7 source tickets)
build-ticket-derived-ssot: wrote README.md marker blocks (STACK: 10 badges, NAMED-ARTEFACTS: 5 entries)
```

In `--check` mode, per-target line is either `… already in sync` (mirrors K-039 phrasing) or the DRIFT block above.

---

## 2. Single-parse architecture

**Hard rule:** ticket corpus is read **once** per invocation. Any design that re-parses per emit target = fail.

**Pipeline:**

```
parseTicketCorpus()
   |
   v
ParsedCorpus { tickets: TicketData[], readme: ReadmeData }
   |
   +--[writer 1]--> emitSiteContent()    -> content/site-content.json
   +--[writer 2]--> emitSacredRegistry() -> docs/sacred-registry.md
   +--[writer 3]--> emitReadmeMarkers()  -> README.md (in-place marker block rewrite)
```

**Single-parse contract:**

- `parseTicketCorpus()` is the only function that calls `fs.readFile` on `docs/tickets/K-*.md` or on `README.md`.
- Returns one frozen `ParsedCorpus` object passed by reference into all three writers.
- **Unit test enforces single-parse:** wrap `fs.readFile` in a counter inside the test harness; assert each ticket file is read exactly once. AC-K052-02 already requires this; §9 unit-test plan codifies the test name.

**ParsedCorpus shape (in-memory, not persisted):**

```
ParsedCorpus = {
  tickets: [{
    id: "K-021",                          // from filename
    path: "docs/tickets/K-021-...md",
    frontmatter: {                        // YAML parsed
      status: "closed",
      type: "feat",
      closed: "2026-04-20",
      "closed-commit": "bd5e271",         // ← non-empty required for Sacred contribution
      "sacred-clauses": ["AC-021-FOOTER"], // optional, present after backfill
      "modifies-sacred": [...],            // optional
      "retires-sacred": [...],             // optional
    },
    sections: {
      "Acceptance Criteria": "... body ...",   // empty string if heading present but body empty
      "Retrospective": "... body ...",
      // every L2 heading body, keyed by heading text
    },
    sacredBodies: {                       // keyed by clause-id from sacred-clauses
      "AC-021-FOOTER": {
        heading: "### AC-021-FOOTER...",
        body: "... markdown verbatim ...",
        bodyHash: "sha256:abc123...",
        retiredSuffix: null,              // "[RETIRED by K-035 2026-04-22]" or null
      }
    },
  }],
  readme: {
    stackBlock: "...badge URLs verbatim between markers...",
    namedArtefactsBlock: "...list verbatim between markers...",
    parsedStack: [{ name, category, logo, color }, ...],
    parsedNamedArtefacts: [{ id, summary, ticketAnchor, severity }, ...],
  },
}
```

**Failure isolation across writers (mandatory):**

- Each writer wraps its own emit in `try/catch`.
- A `try/catch` failure in writer N records `{target, error}` to a `writerStatus[]` array but does NOT halt the other writers.
- Final exit code is `Math.max(exitCode_writer1, exitCode_writer2, exitCode_writer3)`.
- Stdout reports each writer's status (`wrote …` / `FAILED — <error>`); stderr surfaces each error.
- **Exception:** parse-phase failures (exit code 2 or 3) abort BEFORE any writer runs. The single-parse contract means a parse failure leaves on-disk artefacts byte-identical to pre-invocation state (no partial writes from a half-run pipeline).

**Why isolation matters:** drifted README badge → must not silently skip Sacred-registry regeneration; missing one ticket frontmatter → must not silently skip `site-content.json` regeneration. K-039's hook reports each downstream consumer separately (`README.md already in sync`, `docs/ai-collab-protocols.md already in sync`); K-052 mirrors that pattern at writer granularity.

**Parse-error surface:**

- Malformed YAML in any ticket: exit 2, stderr names file path + YAML parser error message.
- Missing `closed-commit:` on a ticket with `sacred-clauses:` field: exit 3, stderr names ticket path + which Sacred IDs cannot be registered.
- README missing either marker pair: exit 2, stderr names which marker pair is missing.

---

## 3. TD-vs-K filter

**Rule:** glob `docs/tickets/K-*.md`. Excludes `TD-*.md` purely by filename.

**Implementation:**

```
glob.sync('docs/tickets/K-*.md', { cwd: REPO_ROOT })
```

**Why glob, not frontmatter `type:` field:**

1. Filename prefix is the **operator-stated convention** ("K-prefix = feature, others don't count"). Frontmatter `type:` is per-ticket label authored by PM (e.g. `feat`, `fix`, `bug + process-fix`, `refactor`) and was never intended as the K-vs-TD discriminator.
2. Filename is **immutable post-creation**; frontmatter `type:` is mutable mid-session. A K-* ticket that morphs from `feat` to `fix` mid-Phase shouldn't drop in/out of metrics.
3. Glob is **filesystem-cheap** — single readdir vs N readFile + YAML parse. Parse errors in any one ticket frontmatter would otherwise corrupt the filter.
4. Glob handles the QA edge case "TD-* ticket renamed to K-*" cleanly: the rename IS the inclusion event; no frontmatter migration needed.

**Filter scope:**

- Both site-content emit AND sacred-registry emit consume the same filtered list. README marker injection consumes a separate list (badges + named-artefacts) authored in README itself, not derived from tickets.
- Repo today: 52 K-* + 3 TD-*. Filter yields 52 ticket inputs.
- `acCoverage.total` denominator = 52 (excludes TD).
- `sacred-registry` registers Sacred clauses only from the 6 backfilled tickets + K-052 itself = 7 source tickets at first run.

---

## 4. Generator filename lock

**Locked: `scripts/build-ticket-derived-ssot.mjs`** (PRD-draft name confirmed, not replaced).

**Rationale:**

- Mirrors `scripts/sync-role-docs.mjs` precedent style: `<verb>-<artefact-domain>.mjs` ESM single-file generator at repo-root `scripts/`.
- "Ticket-derived SSOT" name correctly signals dual-domain (site-content + sacred), unlike narrower alternatives (`build-site-content.mjs` would mislead on first read).
- `build-` prefix is an established repo idiom for `prebuild`-wired generators.

**Rejected alternatives:**

- `build-site-content.mjs` — too narrow, hides sacred-registry role (§Background scope expansion concern).
- `sync-ticket-ssot.mjs` — `sync-` connotes mirror-without-source-of-truth (K-039 has 1 source + 2 mirrors, that fits `sync-`). K-052 has 1 source + 3 derived **artefacts** (none of which are mirrors of each other) — `build-` is more accurate.
- `derive-portfolio-content.mjs` — too generic, doesn't name the input domain (tickets).

---

## 5. JSON schema lock — `content/site-content.json`

**Top-level keys (locked):** `metrics`, `stack`, `processRules`, `lastUpdated`, `ticketRange`.

(PRD AC-K052-01 lists 4 keys; this design adds `processRules` per Lock-Ins Zone 2 — Architect Phase 2 schema authority. Recommend PM amend AC-K052-01 to include `processRules` as a 5th locked top-level key.)

### 5.1 `metrics` (4 cards)

| Field | Type | Source of truth | Parser logic |
|---|---|---|---|
| `metrics.featuresShipped.value` | number | ticket frontmatter | count of K-*.md where `frontmatter.status === 'closed'` (Lock-Ins BQ 1: permissive — no `closed-commit:` gate) |
| `metrics.featuresShipped.label` | string | constant | `"Features Shipped"` |
| `metrics.acCoverage.covered` | number | ticket sections | count of K-*.md with non-empty `## Acceptance Criteria` body (≥1 non-whitespace char between heading and next `##`) |
| `metrics.acCoverage.total` | number | filesystem | count of K-*.md (TD-* excluded per §3) |
| `metrics.acCoverage.label` | string | constant | `"Documented AC Coverage"` |
| `metrics.acCoverage.format` | string | constant | `"{covered} / {total} ({percent}%)"` |
| `metrics.postMortemsWritten.value` | number | ticket sections | count of K-*.md with non-empty `## Retrospective` body |
| `metrics.postMortemsWritten.label` | string | constant | `"Post-mortems Written"` |
| `metrics.lessonsCodified.value` | number | filesystem | count of `claude-config/memory/feedback_*.md` files (Lock-Ins BQ 2 — replaces Guardrails). **Generator path:** `<repo-root>/../../../claude-config/memory/feedback_*.md` (relative from `K-Line-Prediction/scripts/` to global `~/Diary/claude-config/`). At write time current count = 171. |
| `metrics.lessonsCodified.label` | string | constant | `"Lessons Codified"` |

**Critical: `metrics.lessonsCodified` path resolution.** The generator runs from `K-Line-Prediction/scripts/`. The `claude-config/` directory lives at `~/Diary/claude-config/` (sibling of `ClaudeCodeProject/`), accessed via:

```
const CLAUDE_CONFIG_PATH = process.env.CLAUDE_CONFIG_PATH
  || join(REPO_ROOT, '..', '..', 'claude-config')
```

`process.env.CLAUDE_CONFIG_PATH` env-var override is **mandatory** for CI reproducibility (CI may not have the same parent-directory layout). Document override in CLAUDE.md alongside the SSOT pattern. If path resolves to non-existent directory: emit warning (not fatal), use `lessonsCodified.value: null` + log message; AC-K052-12 test runs locally only.

### 5.2 `stack` (10-item structured array per Lock-Ins Zone 1 B)

```json
"stack": [
  { "name": "TypeScript", "category": "Frontend", "logo": "typescript", "color": "3178C6" },
  { "name": "React",      "category": "Frontend", "logo": null,         "color": null     },
  ... 8 more
]
```

| Field | Type | Source of truth | Parser logic |
|---|---|---|---|
| `stack[].name` | string | README `<!-- STACK:start -->` block | extracted from badge URL pattern `Frontend-<name>%20%2B%20…` (§14 algorithm) |
| `stack[].category` | string | README badge label | the part before the `-` in the badge URL (e.g. `Frontend`, `Backend`, `Hosting`, `Tests`) |
| `stack[].logo` | string\|null | README badge URL `?logo=<x>` query param | null if no `?logo=` |
| `stack[].color` | string | README badge URL hex segment | 6-char hex code (no leading `#`) |

**Source direction:** README is source, JSON is derived. Generator parses README marker block, emits to JSON. On `--check`, regenerates README block from JSON and diffs against on-disk README — drift fails.

### 5.3 `processRules` (Lock-Ins Zone 2 schema, /about consumer deferred to K-057)

```json
"processRules": [
  {
    "id": "bug-found-protocol",
    "addedAfter": "K-008",
    "severity": "critical-blocker",
    "summary": "When a code reviewer finds a bug, the responsible role writes a short retrospective naming the root cause before any fix begins.",
    "ticketAnchor": "docs/tickets/K-008-...md",
    "homeSlots": null,
    "aboutSlots": 5,
    "weight": 0.0
  }
]
```

| Field | Type | Source of truth | Parser logic |
|---|---|---|---|
| `processRules[].id` | string | README named-artefacts block | kebab-case slug from `**<Name>**` heading at start of bullet |
| `processRules[].addedAfter` | string | README bullet body | regex `/Added (during\|after) (K-\d+)/` capture |
| `processRules[].severity` | enum | JSON-resident only (PM hand-edits in `content/site-content.json`) | `(critical-blocker\|warning\|advisory)`. **NOT serialized to README marker block** — README readers do not see the tag. Severity drives `weight` formula §5.5 + Reviewer prioritization only. PM updates severity at ticket-close per §17 PM persona checklist. |
| `processRules[].summary` | string | README bullet body | first sentence after the `—` em-dash, truncated at first `.` |
| `processRules[].ticketAnchor` | string | README bullet inline link | `href` of the first markdown link to `./docs/tickets/K-NNN-…md` |
| `processRules[].homeSlots` | number\|null | future K-057 design | null at K-052 close; populated when consumer ships |
| `processRules[].aboutSlots` | number\|null | future K-057 design | null at K-052 close |
| `processRules[].weight` | number | computed | `recencyScore + severityScore` (Lock-Ins Zone 2 B); see §5.5 |

### 5.4 `lastUpdated` + `ticketRange`

| Field | Source | Logic |
|---|---|---|
| `lastUpdated` | git-log | `git log -1 --format=%cI -- docs/tickets/` (most recent ticket touch in ISO-8601). Falls back to current invocation ISO date if git unavailable. |
| `ticketRange.first` | filesystem | min K-NNN from glob output (currently `K-001`) |
| `ticketRange.last` | filesystem | max K-NNN from glob output |

### 5.5 Weight formula (Lock-Ins Zone 2 B)

```
weight = recencyScore + severityScore

recencyScore = max(0, 1 - (daysSince(addedAfter.closed) / 180))
  // linear decay over 180 days; older than 180d → 0
severityScore =
  4   if severity == "critical-blocker"
  2   if severity == "warning"
  1   if severity == "advisory"
  0   if severity == null

tiebreak (when weights equal): alphabetical id ascending
```

**Why this formula:**

- 180-day half-life chosen because portfolio narrative lifecycle is multi-month; tighter window (e.g. 30d) churns top-N too aggressively.
- Severity step ratio 4:2:1 ensures a critical-blocker dominates a year-old advisory, but a fresh advisory + fresh warning still rotate above stale critical (correct portfolio story).
- Tiebreak alphabetical (not random) → deterministic; idempotency preserved.

### 5.6 Idempotency contract

- Object keys serialized in **lexicographic order** at every nesting level (`JSON.stringify(obj, Object.keys(obj).sort())` recursive).
- Numeric values written without trailing zero unless integer (`46`, not `46.0`).
- Unicode normalization: NFC.
- Trailing newline at file end.
- Running generator twice → byte-identical output (hard constraint).

### 5.7 `renderSlots` (per-consumer count fields, BQ-052-14)

```json
"renderSlots": {
  "home":   { "stack": 6, "processRules": 0 },
  "about":  { "stack": 0, "processRules": 5 },
  "readme": { "stack": 10, "processRules": 5 }
}
```

| Field | Type | Default | Consumer |
|---|---|---|---|
| `renderSlots.home.stack` | number | `6` | `ProjectLogicSection.tsx` slices first N from `stack[]` after Category filter (BQ-052-12) |
| `renderSlots.home.processRules` | number | `0` | Home page does not render processRules at K-052; reserved for future |
| `renderSlots.about.stack` | number | `0` | About page does not render stack list at K-052 (MetricsStrip only) |
| `renderSlots.about.processRules` | number | `5` | K-057 future consumer; weight-sorted top-5 |
| `renderSlots.readme.stack` | number | `10` | Generator §14.3 emits all 10 stack entries to README STACK marker block |
| `renderSlots.readme.processRules` | number | `5` | Generator §14.4 emits top-5-by-weight processRules to README NAMED-ARTEFACTS marker block |

**Filter discipline:** generator + frontend consumers all read `renderSlots` for slot count — slot counts are NOT hardcoded in any consumer or in the generator. Changing a slot count is a single JSON edit. Bootstrap script seeds with the defaults above.

**Hand-edited field:** `renderSlots` is preserved on regeneration (alongside `stack[]` and `processRules[]`); only `metrics.*` + `lastUpdated` + `ticketRange` are auto-rewritten.

---

## 6. AC-detection regex spec

**Heading regex:** `^##\s+(Acceptance Criteria|Acceptance criteria|AC)\s*$`

- Case-sensitive on `Acceptance Criteria` (matches K-052 PRD), case-insensitive on second word? **No — case-sensitive throughout.** Variants accepted are exhaustively enumerated by the regex's alternation. Future variants (`## Acceptance Criteria (K-052 ACs)` etc.) MUST be added to the alternation explicitly; trailing-text headings would be parse warnings (logged but counted as positive coverage).
- Leading `##` MUST be exactly `##` (level-2). Level-3 `### Acceptance Criteria` does not count.

**Empty-section detection algorithm:**

```
function hasNonEmptyACSection(ticketBody: string): boolean {
  const matches = ticketBody.match(
    /^##\s+(?:Acceptance Criteria|Acceptance criteria|AC)\s*\n([\s\S]*?)(?=^##\s|\Z)/m
  )
  if (!matches) return false  // no AC heading at all → not counted
  const body = matches[1]
  // body is "everything between the heading and the next ## (or EOF)"
  const stripped = body.replace(/\s+/g, '')  // remove all whitespace
  return stripped.length > 0
}
```

Empty section behaviour for `acCoverage.covered`:

- Heading present, body empty/whitespace-only → **does NOT count** toward `covered`. (Matches Lock-Ins intent: "non-empty AC section" = ticket actually has work-product to ship.)
- Heading absent entirely → does NOT count toward `covered`. (Same outcome via different code path; symmetry intentional.)
- `acCoverage.total` denominator includes both empty-AC and missing-AC tickets (denominator is total K-* count from §3 filter, not AC-bearing count).

QA Phase-1 note: "Ticket with empty AC section but `status: closed` — counts as 0 coverage?" → confirmed by this design as `0 toward covered, +1 toward total` (correct portfolio-honesty signal).

---

## 7. Vite asset wiring

**Decision: build-time `import` from `frontend/src/content/`.**

```ts
// frontend/src/components/about/MetricsStripSection.tsx
import siteContent from '@/content/site-content.json'
```

**Mechanism:**

- Generator writes to `<repo-root>/content/site-content.json` (sibling of `roles.json`).
- Frontend symlink or `prebuild` copy: `frontend/public/content/site-content.json` → no, public/ is runtime. We use **TypeScript path alias** `@/content/*` resolving to `<repo-root>/content/*`.
- Configure `frontend/tsconfig.app.json` paths + `frontend/vite.config.ts` `resolve.alias` to point `@/content` → `../content/`.
- Vite handles `.json` imports natively; the import becomes a frozen object at build time.

**Justified vs alternatives:**

| Approach | HMR | Bundle size | CI cache | Idempotency w/ AC-K052-07 |
|---|---|---|---|---|
| **Build-time import (chosen)** | ✓ Vite watches JSON, rebuilds on change | adds ~2KB to main bundle, gzip ~600B — negligible | Vite caches transformed module; no extra fetch | ✓ deterministic — JSON ts in build = ts at last regen |
| `frontend/public/content/site-content.json` runtime fetch | ✗ HMR doesn't apply to public/ | 0 bytes in main bundle, ~2KB extra HTTP | extra request adds 1 round-trip | ✗ runtime fetch — dev sees stale until refresh |
| `frontend/src/content/site-content.json` (move SSOT into frontend) | ✓ | same as build-time import | same | ✗ breaks dual-emit (SSOT wants to live at repo-root next to scripts/) |

Build-time import wins on HMR + idempotency. Bundle-size cost is ~600B gzip — acceptable for a 4-card metrics + 10-item stack + ≤10 processRules payload.

**Vite config additions (Engineer scope, this design specifies the contract):**

```ts
// vite.config.ts
resolve: {
  alias: {
    '@': resolve(__dirname, 'src'),
    '@/content': resolve(__dirname, '../content'),  // NEW
  }
}
```

```json
// tsconfig.app.json compilerOptions
"paths": {
  "@/content/*": ["../content/*"]   // NEW
}
```

---

## 8. Sacred-clause heading match rule + canonical regex

**Post-Phase-2 rule (Lock-Ins BQ 3 A):** parser uses `sacred-clauses:` frontmatter as **authoritative** list, NOT heading-grep. The canonical regex still exists for the parser to **locate the clause body** within the ticket markdown — but inclusion in the registry is gated by frontmatter declaration.

**Why this rule:** typo guard. `## AC-021-FOOTERR` (typo) without frontmatter declaration silently registers under heading-grep; with frontmatter-gated, it fails loudly because `sacred-clauses: [AC-021-FOOTER]` will fail to locate body and emit fatal exit-3.

### 8.1 Canonical clause-body locator regex

```regex
^(##|###)\s+(AC-[A-Z0-9]+(?:-[A-Z0-9]+)+)(?:[\s—:[].*?)?$\n([\s\S]*?)(?=^(?:##|###)\s|\Z)
```

Capture groups:
- `$2` = clause ID (e.g. `AC-021-FOOTER`, `AC-K035-REGRESSION-01`, `AC-046-REGRESSION-SACRED`)
- `$3` = clause body (markdown between heading and next `##`/`###`)

Heading-level: parser accepts BOTH `##` and `###` because the 6 legacy tickets vary (K-021 uses `### AC-021-FOOTER`; K-046 uses `### AC-046-REGRESSION-SACRED`). A single ticket's clause IDs MUST live at consistent heading level (mixed level inside one ticket = exit-2 parse error).

Heading-suffix retirement notation accepted:

```regex
\s*\[RETIRED by (K-\d+(?:-?[A-Z]+)?)\s+(\d{4}-\d{2}-\d{2})\]
```

Exact-spec only (PM recommendation upheld). Variants `[Retired by …]`, `(retired)`, `**Status:** retired-by:` are NOT accepted; if encountered the parser exits 3 with message "Unrecognized retirement notation in <ticket>:<line> — expected `[RETIRED by K-NNN YYYY-MM-DD]`".

### 8.2 6-ticket backfill sample frontmatter (one example per ticket)

For full backfill patches see §13. Samples below show the `sacred-clauses:` field shape (one example each):

| Ticket | `sacred-clauses:` example | Heading style in body |
|---|---|---|
| K-021 | `[AC-021-FOOTER]` | `### AC-021-FOOTER：全站 Footer 單行資訊列 [K-021]` |
| K-031 | `[AC-031-K022-REGRESSION]` | `### AC-031-K022-REGRESSION: K-022 and K-017 existing assertions not broken [K-031]` |
| K-034 | `[AC-035-FOOTER-UNIFIED]` (note: K-034 absorbed K-035 retros, this clause LIVES in K-035 file but the closing ticket per Lock-Ins is K-034 P3 → backfill on K-035 file, not K-034) **see §13 for resolution** |
| K-035 | `[AC-035-FOOTER-UNIFIED, AC-035-NO-DRIFT, AC-035-CROSS-PAGE-SPEC]` | `### AC-035-FOOTER-UNIFIED — /about uses shared Footer` |
| K-040 | `[AC-040-SITEWIDE-FONT-MONO]` | `### AC-040-SITEWIDE-FONT-MONO (Item 1 — scope-expanded …)` |
| K-046 | `[AC-046-REGRESSION-SACRED]` | `### AC-046-REGRESSION-SACRED — K-009 + K-013 invariants preserved` |

**§13 resolves the K-034/K-035 grouping ambiguity.**

---

## 9. Three-case algorithm (Add / Modify / Retire)

### 9.1 Pseudocode

```
function reconcileSacredRegistry(corpus: ParsedCorpus, existingRegistry: Registry): Registry {
  const next = clone(existingRegistry)
  const errors = []

  // Pass 1: collect declared clauses across all closed-and-shipped tickets
  for (ticket of corpus.tickets where status == 'closed' && closed-commit non-empty) {
    for (clauseId of ticket.frontmatter['sacred-clauses'] ?? []) {
      const body = ticket.sacredBodies[clauseId]
      if (!body) errors.push({code:3, msg:`${ticket.id} declares ${clauseId} but body not found`})
      // ADD case: not in existingRegistry
      if (!next.entries[clauseId]) {
        next.entries[clauseId] = {
          id: clauseId,
          sourceTicket: ticket.id,
          status: 'active',
          body: body.body,
          bodyHash: body.bodyHash,
          firstSeenAt: ticket.frontmatter.closed,
          lastModifiedBy: ticket.id,
          lastModifiedAt: ticket.frontmatter.closed,
          history: [{event:'added', ticket:ticket.id, at:ticket.frontmatter.closed}],
        }
      }
    }
  }

  // Pass 2: process modify declarations
  for (ticket of corpus.tickets where status=='closed' && closed-commit non-empty) {
    for (clauseId of ticket.frontmatter['modifies-sacred'] ?? []) {
      const entry = next.entries[clauseId]
      if (!entry) errors.push({code:3, msg:`${ticket.id} modifies-sacred ${clauseId} but no such Sacred clause exists`})
      const sourceBody = lookupCurrentBody(corpus, clauseId)
      if (sourceBody.bodyHash == entry.bodyHash) {
        warn(`${ticket.id} declares modifies-sacred ${clauseId} but body unchanged (no-op)`)  // advisory
      } else {
        entry.body = sourceBody.body
        entry.bodyHash = sourceBody.bodyHash
        entry.lastModifiedBy = ticket.id
        entry.lastModifiedAt = ticket.frontmatter.closed
        entry.history.push({event:'modified', ticket:ticket.id, at:ticket.frontmatter.closed})
      }
    }
  }

  // Pass 3: detect unannotated drift (fatal)
  for (entry of next.entries) {
    const sourceBody = lookupCurrentBody(corpus, entry.id)
    if (sourceBody && sourceBody.bodyHash != entry.bodyHash) {
      const reconcileTicket = findTicketWith('modifies-sacred', entry.id, corpus)
      if (!reconcileTicket || !isShipped(reconcileTicket)) {
        errors.push({code:3, msg:`UNANNOTATED DRIFT: ${entry.id} body changed in ${entry.sourceTicket} but no closed-and-shipped ticket declares modifies-sacred:[${entry.id}]`})
      }
    }
  }

  // Pass 4: process retire declarations
  for (ticket of corpus.tickets where status=='closed' && closed-commit non-empty) {
    for (clauseId of ticket.frontmatter['retires-sacred'] ?? []) {
      const entry = next.entries[clauseId]
      if (!entry) errors.push({code:3, msg:`ORPHANED RETIRE: ${ticket.id} retires ${clauseId} but no such Sacred clause exists`})
      const sourceBody = lookupCurrentBody(corpus, clauseId)
      if (!sourceBody.retiredSuffix) {
        errors.push({code:3, msg:`MISSING ANNOTATION: ${ticket.id} retires ${clauseId} but source ticket clause heading lacks [RETIRED by ${ticket.id} YYYY-MM-DD] suffix`})
      }
      entry.originalText = entry.body              // preserve audit
      entry.status = `retired-by: ${ticket.id}`
      entry.retiredAt = ticket.frontmatter.closed
      entry.history.push({event:'retired', ticket:ticket.id, at:ticket.frontmatter.closed})
    }
  }

  // Pass 5: orphaned retirement-suffix detection
  for (ticket of corpus.tickets) {
    for (clauseId, body of ticket.sacredBodies) {
      if (body.retiredSuffix) {
        const retireSourceTicket = parseRetireSuffix(body.retiredSuffix)  // K-XXX from suffix
        const matchingTicket = corpus.tickets[retireSourceTicket]
        if (!matchingTicket || !matchingTicket.frontmatter['retires-sacred']?.includes(clauseId)) {
          errors.push({code:3, msg:`ORPHANED ANNOTATION: ${ticket.id}:${clauseId} has [RETIRED by ${retireSourceTicket}] but ${retireSourceTicket} frontmatter omits retires-sacred:[${clauseId}]`})
        }
      }
    }
  }

  if (errors.length > 0) {
    errors.forEach(e => stderr.write(e.msg))
    process.exit(3)
  }

  return next
}
```

### 9.2 Edge-case truth table

| Case | Input | Expected output | Exit code |
|---|---|---|---|
| **Add (happy path)** | New ticket K-NNN closed+shipped, frontmatter `sacred-clauses: [AC-NEW]`, body present | Registry gains entry with `status: active`, `firstSeenAt: K-NNN.closed` | 0 |
| **Modify (happy path)** | K-NNN+1 closed+shipped, frontmatter `modifies-sacred: [AC-OLD]`, K-NNN source ticket body edited | Entry's `body` + `bodyHash` updated, `lastModifiedBy: K-NNN+1`, history.push('modified'); status stays `active` | 0 |
| **Retire (happy path)** | K-MMM closed+shipped, `retires-sacred: [AC-OLD]`, source heading has `[RETIRED by K-MMM 2026-04-XX]` suffix | Entry status flips to `retired-by: K-MMM`, `originalText` field captured, `retiredAt: K-MMM.closed`, count totals shift | 0 |
| **Same-commit add+retire** | K-NNN frontmatter has BOTH `sacred-clauses: [AC-NEW]` AND `retires-sacred: [AC-OLD]`, both bodies present + suffix on AC-OLD source | Two independent registry events: AC-OLD flipped to retired (Pass 4); AC-NEW added as active (Pass 1). Generator does NOT auto-link them — separate entries, no replacement-relation field | 0 |
| **Modify-then-retire chain** | K-NNN modifies AC-OLD (Pass 2 mutates entry), then K-NNN+1 retires AC-OLD (Pass 4 flips status) | Entry shows `status: retired-by: K-NNN+1`, `lastModifiedBy: K-NNN`, `retiredAt: K-NNN+1.closed`. **history array preserves both events** in chronological order: `[{added,K-035}, {modified,K-NNN}, {retired,K-NNN+1}]` | 0 |
| **Unannotated body drift (fatal)** | Source ticket K-021 body edited (e.g. PM Edit), no ticket declares `modifies-sacred: [AC-021-FOOTER]` | Pass 3 detects bodyHash mismatch, no reconcile ticket found → exit 3 with message naming K-021 + AC-021-FOOTER + bodyHash diff | 3 |
| **Orphaned `retires-sacred:` (fatal)** | K-MMM frontmatter has `retires-sacred: [AC-DOES-NOT-EXIST]` (typo) | Pass 4 lookup returns no entry → exit 3 with message naming K-MMM + the unresolved ID | 3 |
| **Missing retirement-suffix annotation (fatal)** | K-MMM `retires-sacred: [AC-OLD]` declared but source ticket heading lacks `[RETIRED by …]` suffix | Pass 4 finds entry but `retiredSuffix == null` → exit 3 with message "MISSING ANNOTATION: K-MMM retires AC-OLD but source heading lacks suffix" | 3 |
| **Orphaned retirement-suffix (fatal)** | Source ticket has `[RETIRED by K-MMM 2026-04-XX]` suffix but K-MMM frontmatter omits `retires-sacred:` | Pass 5 detects mismatch → exit 3 with message naming source ticket + clause + missing K-MMM declaration | 3 |
| **No-op `modifies-sacred:` (advisory)** | K-NNN declares `modifies-sacred: [AC-OLD]` but bodyHash unchanged | Pass 2 emits warning to stderr, NO mutation, NO history entry, NO exit code change. PM surfaces at next AC-write per Lock-Ins recommendation | 0 |
| **Sacred-bearing ticket without `closed-commit:`** | K-XXX `status: closed` but `closed-commit:` empty/missing, has `sacred-clauses: [...]` | Ticket NOT in shipped pool (§3 filter pass 1 skips it). Sacred clauses NOT registered. Stderr emits info line "K-XXX has sacred-clauses but no closed-commit; skipped (in-flight)" | 0 |

---

## 10. SHA hash spec

**Algorithm:** SHA-256 of UTF-8 bytes after the following normalization, hex-encoded with `sha256:` prefix.

**Normalization rules (in order):**

1. Locate clause body via canonical regex (§8.1) — capture group `$3`.
2. **Exclude leading heading line** (the `### AC-…` line) from the body. Hash covers body markdown only.
3. Strip the trailing-suffix retirement annotation (`[RETIRED by …]`) IF present in the heading — hash is invariant across retire transition. (Hash MUST NOT change just because retirement notation was added; the body is what matters, not the lifecycle marker.)
4. Normalize line endings: `\r\n` → `\n`, `\r` → `\n`.
5. Trim trailing whitespace per line: `/[ \t]+$/m → ''`.
6. Trim leading + trailing blank lines from the entire body.
7. Apply Unicode NFC normalization.
8. SHA-256 over UTF-8 bytes.

**Storage:**

```yaml
# inside docs/sacred-registry.md, per entry frontmatter-style block
- id: AC-021-FOOTER
  sourceTicket: K-021
  status: active
  bodyHash: sha256:abc123...def
  ...
  body: |
    ...verbatim body markdown...
```

**Drift comparison:** generator always recomputes hash from current source ticket body and compares against `bodyHash` stored in registry. Mismatch → Pass 3 (unannotated drift) or Pass 2 (modifies-sacred reconcile) flow. Re-emitting the registry stores the new hash.

**Why exclude heading line:** heading text contains the clause ID + decorative info (e.g. `[K-021]` ticket-tag). Whitespace re-formatting in heading would otherwise spuriously trip drift detection. The clause ID IS the registry key; that doesn't need to be hashed.

**Why include retire-suffix-stripping:** preserves invariant "retire is a status change, not a body change". Otherwise PM annotating retirement would force a parallel `modifies-sacred:` declaration — friction the design rejects.

---

## 11. Reconcile workflow doc

**Sequence — PM action when modifying a Sacred clause's text:**

1. Open new ticket K-NNN to carry the modification (cannot edit the source ticket's body alone — that's unannotated drift).
2. In K-NNN frontmatter, declare `modifies-sacred: [<sacred-id>]`.
3. In the **source ticket's** Sacred clause, Edit the body markdown to the new text. (The source ticket file itself is mutated; this is "retired-in-place" pattern preserved.)
4. Close K-NNN, set `closed-commit: <SHA>`, ship.
5. Run generator → registry entry's `body` + `bodyHash` updates, `lastModifiedBy: K-NNN`, history captures `modified` event.

**Expected error messages on each failure:**

| Failure mode | Error message format (stderr, exit 3) |
|---|---|
| Source body edited without `modifies-sacred:` ticket | `UNANNOTATED DRIFT: AC-<id> body changed in K-<src> (current sha256:<new>, registry sha256:<old>); no closed-and-shipped ticket declares modifies-sacred:[AC-<id>]. Open a reconcile ticket or revert the source.` |
| `modifies-sacred:` declared but no body change | (advisory, exit 0) `NO-OP MODIFY: K-<NNN> declares modifies-sacred:[AC-<id>] but body sha256:<x> unchanged. Remove the declaration or edit the source.` |
| `modifies-sacred:` references unknown clause | `UNKNOWN MODIFY TARGET: K-<NNN> modifies-sacred:[AC-<id>] but no such Sacred clause exists in any closed-and-shipped ticket.` |

**Sequence — PM action when retiring a Sacred clause:**

1. Open new ticket K-MMM.
2. In K-MMM frontmatter, declare `retires-sacred: [<sacred-id>]`.
3. In the source ticket's clause heading, append `[RETIRED by K-MMM YYYY-MM-DD]` suffix (exact format).
4. Close K-MMM, set `closed-commit:`, ship.
5. Run generator → entry status flips, `originalText` captured, count totals shift.

| Failure mode | Error message |
|---|---|
| `retires-sacred:` without source heading suffix | `MISSING ANNOTATION: K-<MMM> retires AC-<id> but source ticket K-<src>:<line> heading lacks [RETIRED by K-<MMM> YYYY-MM-DD] suffix. Annotate source heading or remove retires-sacred declaration.` |
| Source heading suffix without `retires-sacred:` | `ORPHANED ANNOTATION: K-<src>:<line> has [RETIRED by K-<MMM>] but K-<MMM> frontmatter omits retires-sacred:[AC-<id>]. Add the declaration or revert the suffix.` |
| `retires-sacred:` references unknown clause | `ORPHANED RETIRE: K-<MMM> retires AC-<id> but no such Sacred clause exists.` |

**Recommended doc landing:** `K-Line-Prediction/CLAUDE.md` gains a §Sacred reconcile workflow subsection (Engineer Phase 4 deliverable per AC-K052-08).

---

## 12. Sacred lifecycle frontmatter family

Three frontmatter fields form one vocabulary. All are **arrays of clause ID strings** (consistent shape; YAML inline `[…]` or block `- …` both accepted).

### 12.1 `sacred-clauses:` (declare-new)

```yaml
sacred-clauses: [AC-021-FOOTER, AC-021-NAVBAR]
```

- Lists all Sacred clauses authored in THIS ticket.
- At first registry emit, each becomes an entry with `status: active`, `sourceTicket: <this-ticket>`.
- Required field on Sacred-bearing tickets; absence = generator skips heading-grep, no auto-detection (typo guard).

### 12.2 `modifies-sacred:` (reconcile body change)

```yaml
modifies-sacred: [AC-K035-REGRESSION-01]
```

- Lists Sacred clauses whose body text is edited by THIS ticket's PM session work.
- Source ticket's clause body MUST be re-Edited in the same PM commit window.
- Generator updates entry's `body` + `bodyHash` + `lastModifiedBy`.

### 12.3 `retires-sacred:` (retire)

```yaml
retires-sacred: [AC-021-FOOTER]
```

- Lists Sacred clauses retired by THIS ticket.
- Source ticket's clause heading MUST gain `[RETIRED by <this-ticket> YYYY-MM-DD]` suffix.
- Generator flips entry's `status` to `retired-by: <this-ticket>`, captures `originalText`, sets `retiredAt`.

### 12.4 Combined-use example

A single ticket that introduces a new Sacred AND retires an old one:

```yaml
---
id: K-035
title: ...
status: closed
closed: 2026-04-22
closed-commit: e042262
sacred-clauses: [AC-035-FOOTER-UNIFIED, AC-035-NO-DRIFT]   # K-035's own new clauses
retires-sacred: [AC-021-FOOTER]                             # retired K-021's clause
# NB: modifies-sacred field absent — no pre-existing clause's body changed
---
```

This satisfies the "same-commit add+retire" QA edge case without introducing a 4th field. Generator emits TWO independent registry events (one retire, two adds); they're not artificially linked.

---

## 13. 6-ticket backfill plan

PM applies all 6 patches in a **single commit** at K-052 close (per Lock-Ins). Each patch is 2 lines (1 frontmatter line for `sacred-clauses:` + 1 for `closed-commit:` if missing).

### 13.1 Per-ticket patch table

| Ticket | New frontmatter lines | Source heading (verifies clause body locatable) | Notes |
|---|---|---|---|
| **K-021** | `closed-commit: bd5e271`<br>`sacred-clauses: [AC-021-FOOTER]` | line 179: `### AC-021-FOOTER：全站 Footer 單行資訊列 [K-021]` | AC-021-FOOTER will retire on first registry emit because K-035 already shipped its retirement. K-035 backfill MUST include `retires-sacred: [AC-021-FOOTER]` (see K-035 row). |
| **K-031** | `closed-commit: f49344d`<br>`sacred-clauses: [AC-031-K022-REGRESSION]` | line 90: `### AC-031-K022-REGRESSION: K-022 and K-017 existing assertions not broken [K-031]` | The other K-031 ACs are scope-narrow and not Sacred — only the regression AC qualifies. |
| **K-034** | `closed-commit: 6300e44`<br>`sacred-clauses: []` | (no Sacred clauses in K-034 file itself) | K-034 file has no `### AC-` Sacred-style headings. K-034 absorbed K-035 retros + K-038 work but K-035's own Sacred clauses live in K-035's file. K-034 backfill stays empty for `sacred-clauses:`; this row exists to record "K-034 examined, no clauses owned". **Recommend OMITTING K-034 from the patch entirely** — empty `sacred-clauses: []` adds noise; backfill scope is 5 tickets, not 6. **PM ruling needed** — see §0 K-G-01 footnote. |
| **K-035** | `closed-commit: e042262`<br>`sacred-clauses: [AC-035-FOOTER-UNIFIED, AC-035-NO-DRIFT, AC-035-CROSS-PAGE-SPEC]`<br>`retires-sacred: [AC-021-FOOTER]` | line 239 / 247 / 254 in K-035 file | K-035 retires AC-021-FOOTER per the historical sequence; K-021's clause needs heading suffix `[RETIRED by K-035 2026-04-22]` added (PM Edit on closed K-021 file — acceptable per §11 retired-in-place). |
| **K-040** | `closed-commit: 76915d2`<br>`sacred-clauses: [AC-040-SITEWIDE-FONT-MONO]` | line 65: `### AC-040-SITEWIDE-FONT-MONO (Item 1 …)` | Other K-040 items are non-Sacred polish. K-040 also retired `AC-040-HERO-FONT-MONO` mid-ticket (line 88) — that retirement is **out-of-scope per PRD §Out-of-scope** (legacy retired-in-place without `retires-sacred:` declaration). Generator emits a Phase-1 migration warning for it. |
| **K-046** | `closed-commit: 1090e63`<br>`sacred-clauses: [AC-046-REGRESSION-SACRED]` | line 129: `### AC-046-REGRESSION-SACRED — K-009 + K-013 invariants preserved` | Single Sacred clause in K-046. |

### 13.2 K-034 ambiguity escalation

**Recommendation:** Architect surfaces to PM the K-034-vs-K-035 grouping question:

> K-034 absorbed K-035 + K-038 retros into Phase 3 close. K-035's Sacred clauses (`AC-035-FOOTER-UNIFIED` / `AC-035-NO-DRIFT` / `AC-035-CROSS-PAGE-SPEC`) live in **K-035's file**, not K-034's. Lock-Ins lists K-034 as a backfill ticket — confirm intent: should `sacred-clauses:` go on K-035 file (where the bodies live) or K-034 file (where the closure absorbed K-035)? Architect recommends **K-035 file** for body-locality reasons (generator regex locates body in same file as frontmatter); if PM disagrees, the parser would need a cross-file `body-source:` field to support body-in-different-file.

Defer to PM ruling. Architect's Phase 2 design assumes K-035 file backfill; if PM rules K-034 instead, generator gains complexity (cross-file body lookup) — this needs a Phase-2.5 design supplement.

### 13.3 First-run registry contents (post-backfill)

After 6-ticket backfill + K-052 own clauses (none — K-052 introduces the registry but has no Sacred ACs of its own per PRD §Phase Gate Checklist "AC ↔ Sacred cross-check"):

- **5 source tickets** contributing entries (K-021, K-031, K-035, K-040, K-046; K-034 likely empty per §13.2)
- **6 active entries** (K-021 / K-031 / K-035×3 / K-040 / K-046 = 6 — wait, K-021 retires immediately on first emit because K-035 backfill includes `retires-sacred: [AC-021-FOOTER]`. So:)
- **Final first-run state:** 5 active entries (K-031, K-035×3, K-040, K-046 — wait that's also 6). Let me recount:
  - K-021: AC-021-FOOTER → status `retired-by: K-035` (1)
  - K-031: AC-031-K022-REGRESSION → active (1)
  - K-035: AC-035-FOOTER-UNIFIED, AC-035-NO-DRIFT, AC-035-CROSS-PAGE-SPEC → 3 active
  - K-040: AC-040-SITEWIDE-FONT-MONO → active (1)
  - K-046: AC-046-REGRESSION-SACRED → active (1)
- **Totals: 7 entries, 6 active, 1 retired** (matches Lock-Ins "~7-9 entries" estimate).

---

## 14. README marker block emit (JSON → README, reverse direction per BQ-052-14)

**Direction (locked):** `content/site-content.json` is sole hand-edit; generator WRITES marker-block contents in README from JSON. README narrative paragraphs (K-line description, BFP quote, etc.) outside markers remain hand-written; generator never touches them. `--check` mode regenerates marker contents in-memory, diffs against on-disk README, drift → exit 1 + named marker pair.

### 14.1 Two marker pairs Engineer adds to README in init commit

Engineer adds the marker pairs verbatim. Body inside markers is left as a single placeholder line `(populated by generator)`; first generator run overwrites with rendered content. Each marker pair is preceded by a DO-NOT-EDIT comment line.

**Marker pair A — STACK** (wraps existing badge block at README:5–9; markers + DO-NOT-EDIT comment inserted around the existing 5 badge lines):

```markdown
<!-- DO NOT EDIT inside markers — generator overwrites. Edit content/site-content.json instead. -->
<!-- STACK:start -->
(populated by generator)
<!-- STACK:end -->
```

**Marker pair B — NAMED-ARTEFACTS** (wraps the body of `## Named artefacts` section at README:54–80; section heading + intro paragraph stay OUTSIDE markers):

```markdown
## Named artefacts

Each rule was written after a specific failure was observed during the build. Five examples:

<!-- DO NOT EDIT inside markers — generator overwrites. Edit content/site-content.json instead. -->
<!-- NAMED-ARTEFACTS:start -->
(populated by generator)
<!-- NAMED-ARTEFACTS:end -->
```

First post-init generator invocation overwrites the placeholder; subsequent runs are byte-idempotent against the prior output.

### 14.2 Marker block locator regex

Generator locates marker pairs to know which byte range to overwrite:

```regex
<!--\s*STACK:start\s*-->\n([\s\S]*?)\n<!--\s*STACK:end\s*-->
<!--\s*NAMED-ARTEFACTS:start\s*-->\n([\s\S]*?)\n<!--\s*NAMED-ARTEFACTS:end\s*-->
```

Capture group `$1` = current on-disk block contents (used by `--check` for diff target only — never used as input source). Marker absence = exit code 2 with message naming which marker pair is missing.

### 14.3 JSON `stack[]` → README badge URL render algorithm (slot count: `renderSlots.readme.stack`)

Generator slices `stack[]` first N entries (N from `renderSlots.readme.stack`, default 10), groups by `category`, emits one badge line per category group.

```
function renderStackBadges(stack, slotCount) {
  const limited = stack.slice(0, slotCount)
  const groups = groupBy(limited, e => e.category)
  const lines = []
  for ([category, entries] of groups) {
    const namesEncoded = entries.map(e => e.name).join('%20%2B%20')
    const first = entries[0]
    const logoSegment = first.logo ? `?logo=${first.logo}` : ''
    const linkHref = LINK_HREF_BY_CATEGORY[category]  // hardcoded map; see below
    lines.push(`[![${category}](https://img.shields.io/badge/${category}-${namesEncoded}-${first.color}${logoSegment})](${linkHref})`)
  }
  // Live-Demo badge prepended verbatim (marketing badge, not derived from stack[])
  lines.unshift(LIVE_DEMO_BADGE_LITERAL)
  return lines.join('\n')
}
```

| Item | Source | Notes |
|---|---|---|
| Category grouping | derived from `stack[i].category` | Generator preserves first-seen category order from the JSON |
| Name join separator | constant `%20%2B%20` (` + ` URL-encoded) | Matches existing badge convention — multi-name shields.io badge |
| Color | first entry's `color` per group | Group's first entry wins; trailing entries' `color` ignored on output |
| Logo | first entry's `logo` per group; `null` → omit `?logo=` | Same first-wins rule |
| Link href | hardcoded `LINK_HREF_BY_CATEGORY` map | Static map: `Frontend → vitejs.dev`, `Backend → fastapi.tiangolo.com`, `Hosting → firebase.google.com`, `Tests → playwright.dev`. Categories in JSON `stack[]` use lowercase singulars (`framework`, `build-tool`, `e2e-test`, etc.); the badge category label uses the canonical visual mapping defined in this map. |
| Live-Demo badge | constant `LIVE_DEMO_BADGE_LITERAL` | Hardcoded; not derived from `stack[]` because it's a marketing badge, not a stack entry. Generator prepends it verbatim. |

**No `EXCLUDED_CATEGORIES` filter needed.** Live-Demo badge is hardcoded prepended; consumer-side filter is enforced via `renderSlots.readme.stack` slot count + `stack[]` JSON containing exactly the 10 stack entries (no marketing entries). Generator emits exactly slotCount + 1 badge lines (10 stack + 1 marketing).

### 14.4 JSON `processRules[]` → README bullet render algorithm (slot count: `renderSlots.readme.processRules`)

Generator sorts `processRules[]` by `weight` desc (formula §5.5), takes top-N (N from `renderSlots.readme.processRules`, default 5), emits one bullet per entry.

```
function renderNamedArtefacts(processRules, slotCount) {
  const sorted = [...processRules].sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id))
  const limited = sorted.slice(0, slotCount)
  return limited.map(r => {
    const anchor = anchorFromTicketHref(r.ticketAnchor)  // e.g. "docs/tickets/K-008-...md" → relative link
    return `- **${r.title}** — ${r.summary} See [${anchor.label}](${anchor.href}).`
  }).join('\n')
}
```

| Field | Source | Notes |
|---|---|---|
| `r.title` | JSON `processRules[].title` | Hand-edit in JSON; bootstrap seeds from current README bullet `**…**` heading |
| `r.summary` | JSON `processRules[].summary` | Single sentence; bootstrap seeds from first sentence of current README bullet body |
| Link target | `r.ticketAnchor` (JSON field) | Relative path to ticket file; rendered as `See [docs/tickets/K-XXX-…md](./docs/tickets/K-XXX-…md).` shape; bootstrap seeds from existing README inline link |
| Severity | NOT serialized | `r.severity` lives in JSON only — drives `weight` formula §5.5 + Reviewer prioritization. README readers do not see the tag (per BQ-052-14). |

**Why severity is omitted from README:** Lock-Ins BQ-052-14 codifies severity as a structured JSON-resident attribute; surfacing it inline as `[critical-blocker]` would clutter README narrative tone. Reviewer/PM workflows consume severity from JSON directly.

### 14.5 `--check` mode

1. Read JSON `stack[]` + `processRules[]` + `renderSlots`.
2. In-memory render via §14.3 + §14.4 algorithms.
3. Read README from disk; locate marker pairs via §14.2.
4. Byte-compare regenerated block against on-disk block contents (capture group `$1`).
5. Mismatch → exit 1, stderr names which marker pair drifted + first offending bullet/badge index. Default mode (no `--check`) overwrites marker block contents on disk.

**Hand-edit inside markers is unrecoverable on next regen.** The DO-NOT-EDIT comment line above each marker pair (§14.1) makes the rule visible at edit time; pre-commit `--check` makes any drift surface before commit. Recovery: re-edit `content/site-content.json` to reflect the desired text, re-run generator. There is no path back from in-marker hand-edits except `git restore`.

**Direction discipline:** generator NEVER reads marker block contents as input — only as `--check` diff target. JSON is sole source.

---

## 15. Designer persona patch (spec only — Engineer does NOT apply)

Architect specifies the patch text below. Designer agent applies it in K-052 Phase 3 dispatch with a single Edit call against `~/.claude/agents/designer.md` lines 224–235.

### 15.1 Patch — generalize Gap 1 + add Gap 2 sub-section

**Replace existing § "Text fields are frozen-at-session snapshots (K-039 2026-04-24 split-SSOT)" body (current lines 224–235) with:**

```markdown
### Text fields are frozen-at-session snapshots (K-039 2026-04-24 split-SSOT, generalized K-052 2026-04-27 to all `content/*.json` SSOTs)

Pencil owns **visual SSOT** — container geometry, typography tokens, color tokens, card shape, layout grid. Pencil does NOT own **runtime text SSOT** for any `content/*.json` member at repo root. Runtime text lives in JSON; Pencil's `content` field on text nodes is illustrative-at-last-session-time only.

Implications:
- `content` field values on Pencil text nodes are **illustrative at last-session time**, not binding on runtime. They may be stale between Designer-led tickets.
- **Before `batch_design` on a text-bearing frame (pre-Step-0 re-sync gate):** grep the matching `content/*.json` to retrieve the current runtime text → inject it into the Pencil node as the new `content` value. Do NOT re-draw from the stale prior snapshot and do NOT invent phrasing.
- A `content-delta: yes, visual-delta: none` ticket does NOT invoke Designer. Pencil text fields carry stale text until the next `visual-delta: yes` ticket; lazy re-sync is the rule, not bidirectional export.

#### content/*.json → about-v2.pen frame mapping

| `content/*.json` member | Pencil frame node group | Verbatim source fields |
|---|---|---|
| `content/roles.json` | RoleCard frames in `about-v2.pen` (`r*Role` / `r*Owns` / `r*Art` nodes) | `.role`, `.owns`, `.artefact` |
| `content/site-content.json` `metrics` | MetricsStrip frame `BF4Xe` (4 metric-card nodes m1–m4) | `metrics.featuresShipped.value/label`, `metrics.acCoverage.format` interpolation, `metrics.postMortemsWritten.*`, `metrics.lessonsCodified.*` |
| `content/site-content.json` `processRules[]` | (Future: K-057 about-v2.pen "Process rules" frame) | `id`, `addedAfter`, `severity`, `summary` per slot |
| `content/site-content.json` `stack[]` | (Currently rendered as flat string in `ProjectLogicSection`; not a Pencil-owned frame) | n/a — Pencil layout owns home-page chrome only |

If runtime `content/*.json` has drifted past format constraints, that is a BQ to PM — Pencil layout would break. Do not silently resize the card.

#### Weighted top-N layout slot (K-052 2026-04-27)

When a `content/*.json` array has more entries than the Pencil frame has rendering slots (e.g. `processRules[]` has 8 entries but the frame has slot count N=5), runtime renders the **top-N by weight** (descending). Designer responsibility:

1. **Define N at design-doc time.** Slot count is a Pencil layout decision — Designer authors a fixed N per consumer frame. Document N inside the frame's spec (`frontend/design/specs/<frame-id>.json`) under `slots: { count: N, perSlotConstraints: {...} }`.
2. **Per-slot character / line constraints.** Each slot has a max-content envelope (mirror K-039 pattern: `role >1 word / owns >6 words / artefact >8 words`). Constraints prevent overflow when a high-weight entry has long body text.
3. **SSOT supplies ordered list, runtime takes top-N.** Designer does NOT pre-sort or pre-pick — generator emits entries with `weight` field (sorted descending), runtime slices `array.slice(0, N)`.
4. **BQ-back-to-PM if any SSOT entry exceeds slot constraint.** Pencil layout would break. Do not silently resize the card. Emit BQ verbatim:
   > "Frame `<frame-id>` slot N=`<count>` constraint `<max chars/words>`; SSOT entry `<id>` body is `<actual length>` — exceeds constraint. PM ruling required: (a) trim SSOT body, (b) increase slot envelope, (c) accept truncation with ellipsis."

Ticket-time question: when a new `visual-delta: yes` ticket touches a slot-bearing frame, Designer re-runs the SSOT vs constraint audit; if any entry now exceeds constraint, surface BQ before `batch_design`.

Memory: `feedback_content_ssot_split.md` (extended with K-052 weighted top-N rule).
```

### 15.2 Patch verification (post-apply, recommend AC-K052-15)

Grep test in `docs/retrospectives/designer.md` next-task verifying:

```bash
grep -E '(any `content/\*\.json`|Weighted top-N layout slot)' ~/.claude/agents/designer.md
```

Both phrases present after Designer applies = verification pass.

**Recommendation on AC-K052-15 fold:** Architect rules **fold into Reviewer Pencil-parity gate, NOT standalone AC**. Reviewer's existing scan adds one row "designer.md persona patch lines 224–235 contain expected K-052 phrasing"; this is one grep, not a full E2E spec. Standalone AC creates Engineer-level test surface for a persona-file edit that doesn't touch frontend code — overkill.

---

## 16. Bootstrap one-shot script (BQ-052-15)

`scripts/bootstrap-site-content-from-readme.mjs` — single-purpose seeder. Lifecycle: K-052 PR creates the script → runs it → seed `content/site-content.json` committed → script is `git rm`-ed in the SAME commit. Script is NOT in the final tree.

### 16.1 Filename + lifecycle

| Phase | Action |
|---|---|
| Engineer Phase 4 commit | `scripts/bootstrap-site-content-from-readme.mjs` added |
| Same commit | `node scripts/bootstrap-site-content-from-readme.mjs` invoked → emits `content/site-content.json` with `stack[]` + `processRules[]` populated |
| Same commit | `git rm scripts/bootstrap-site-content-from-readme.mjs` |
| Final tree (post-merge) | `git ls-files scripts/bootstrap-*` returns empty (AC-K052-16 gate) |

**Why one-shot + delete:** keeping a reverse-direction parser around blurs SSOT direction (BQ-052-15). Recovery from accidental JSON loss uses `git restore content/site-content.json` against the K-052 commit, NOT re-running a bootstrap parser against current README (which by then may have drifted).

### 16.2 Parse algorithm

The bootstrap script PARSES current README §badge block + §Named artefacts list using regexes that are reverse-equivalent to the §14.3 / §14.4 RENDER algorithms (parse direction here, not render).

| Source in README | JSON field populated | Regex / extraction |
|---|---|---|
| Badge block (current README:5–9) | `stack[]` | Per-badge regex `^\[!\[([^\]]+)\]\(https://img\.shields\.io/badge/([^-]+)-([^-]+(?:%20[^-]+)*)-([0-9A-Fa-f]{6})(?:\?logo=([^)]+))?\)\]\(([^)]+)\)$` — capture `$2`=category, `$3`=names (split on `%20%2B%20`), `$4`=color, `$5`=logo. Live-Demo badge skipped (matched separately + ignored). Names within a multi-name badge inherit category + color; first name keeps logo, trailing names get `logo: null`. |
| Named artefacts bullets (current README:54–80, top-level `- **…**` only) | `processRules[]` | Per-bullet regex `^- \*\*([^*]+)\*\*\s+—\s+([\s\S]*?)(?=\n- \*\*|\Z)` — capture `$1`=title, `$2`=full body. Summary = first sentence of body (split on `\.[\s\n]`). `addedAfter` = regex match `Added (?:during|after) (K-\d+)`. `ticketAnchor` = first markdown link to `./docs/tickets/K-NNN-…md`. |
| (no source) | `renderSlots`, `metrics.*`, `lastUpdated`, `ticketRange` | Bootstrap does NOT populate these — the regular generator (§1, §5) computes them on first post-bootstrap invocation. Bootstrap emits placeholder structure + lets generator fill in. |

### 16.3 Severity defaults at seed time (5 hardcoded entries)

Bootstrap script hardcodes severity for the 5 current README named-artefacts bullets. PM may adjust before the bootstrap commit lands.

| `processRules[].id` (slug) | Severity at seed time |
|---|---|
| `bug-found-protocol` | `critical-blocker` |
| `pencil-as-design-source-of-truth` | `warning` |
| `content-alignment-gate` | `advisory` |
| `deploy-rebase-then-ff-merge` | `advisory` |
| `locked-marker-block` | `advisory` |

PM ruling window: bootstrap script run → JSON in working tree → PM review JSON before staging → adjust severity values → `git add content/site-content.json`. Adjustments after the K-052 land are governed by §17 PM persona checklist (ticket-close review).

### 16.4 `weight` field at seed time

All `processRules[].weight` entries seeded with `0`. Weight is computed at render-time by the regular generator (§5.5 formula: `recencyScore + severityScore`); seeding `0` is intentional — generator overwrites on first invocation. Bootstrap does NOT compute weight (would require `recencyScore` from `addedAfter` ticket close date, which bootstrap doesn't read).

### 16.5 Decision rule for README structural change mid-K-052

Q: "What if README badge block / named-artefacts list structure changes during K-052 implementation, after bootstrap has already seeded JSON?"

**Architect ruling:** re-run bootstrap. The old JSON in working tree is `git restore`-d (no commit yet at intermediate stages OR `git checkout HEAD -- content/site-content.json` if a WIP commit exists), bootstrap re-runs against fresh README, new JSON staged. This is NOT a maintenance scenario — bootstrap is one-shot and only relevant during the K-052 implementation window. Once K-052 ships, README is no longer authoritative for any field; subsequent edits go to JSON only. The `git rm` of the bootstrap script in the same commit is the architectural enforcement of "no re-bootstrap post-merge".

---

## 17. PM persona patch (spec only — Engineer does NOT apply)

Architect specifies the patch text below. PM persona owner (or Engineer-as-proxy under PM dispatch) applies it in a single Edit call against `~/.claude/agents/pm.md`. Mirror of §15 Designer-patch pattern.

### 17.1 Target line range in `~/.claude/agents/pm.md`

Insertion point: **after line 489** (closing line of `Ticket closure bookkeeping (mandatory at close, 2026-04-21)` 4-step item) and **before line 490** (start of `Outer-repo mirror commit pre-flight (mandatory, 2026-04-22)` item). Both anchor lines verified by Architect via direct Read of `~/.claude/agents/pm.md` 2026-04-27.

The new checklist item slots into the `### Phase end` section's bullet list, immediately after the 4-step `Ticket closure bookkeeping` item. Architect did NOT modify either anchor; PM persona owner inserts only the patch block below.

### 17.2 Patch text (exact, verbatim insertion)

```markdown
- [ ] **`content/site-content.json` review at ticket close (mandatory, K-052 2026-04-27)**: at every ticket close, PM reviews `K-Line-Prediction/content/site-content.json` `processRules[]` entries against this ticket's retrospective. Outcome must be one of:
  - **added new processRule entry** — this ticket surfaced a new persona / workflow rule worth showcasing in README named-artefacts; PM hand-edits JSON `processRules[]` (id + title + summary + severity + addedAfter + ticketAnchor) before close
  - **upgraded severity** — an existing entry's severity tier moves up (e.g. `advisory` → `warning`) because this ticket revealed it as more critical; PM edits `processRules[<id>].severity` field
  - **downgraded stale entry** — an existing rule no longer applies / has been retired by a newer rule; PM either deletes the entry or downgrades severity to `advisory`
  - **no change** — this ticket's retrospective revealed no processRule mutation

  Outcome recorded in ticket §Release Status as one line: `site-content.json review: <added|upgraded|downgraded|no-change> — <one-sentence rationale + entry id if applicable>`. Missing line = ticket NOT truly closed; PM Phase Gate does not PASS.

  **Why:** K-052 2026-04-27 — JSON-is-source paradigm requires every ticket close to touch the SSOT once, ensuring rule lifecycle (introduce → mature → retire) tracks ticket retrospectives instead of drifting in README hand-edits. Memory: `feedback_pm_site_content_review.md` (to be authored at K-052 close).
```

### 17.3 Patch verification (post-apply, fold into Reviewer gate per §15.2 precedent)

```bash
grep -F 'site-content.json' ~/.claude/agents/pm.md
```

Must return at least 1 hit (the new checklist item) after PM persona owner applies the patch. Reviewer's existing scan adds one row "pm.md ticket-close checklist contains expected K-052 phrasing"; this is one grep, not a full E2E spec. Fold into Reviewer Pencil-parity gate's adjacent persona-patch verification slot — same shape as §15.2 Designer patch verification, NOT a standalone AC.

**Recommendation on AC fold:** AC-K052-17 codifies this gate (see §20). AC-K052-17 is verified at Reviewer Phase 5, not Engineer Phase 4 — Engineer does NOT touch `~/.claude/agents/pm.md`.

---

## 18. Engineer Pre-Implementation Design Challenge Sheet — verdict slot

(Empty at delivery. Architect appends per Same-Session Verdict Obligation when Engineer dispatch returns sheet.)

---

## 19. Architecture Doc Sync

`agent-context/architecture.md` does not currently exist for K-Line-Prediction repo (uses `ssot/system-overview.md` + per-domain SSOTs). K-052 adds:

- **New SSOT files:** `content/site-content.json`, `docs/sacred-registry.md`
- **New build script:** `scripts/build-ticket-derived-ssot.mjs`
- **Pre-commit hook addition:** `.githooks/pre-commit` gains a second `--check` invocation for the new generator (or the K-039 hook is generalized — Engineer may choose; design doc accepts either)
- **Ticket frontmatter convention extension:** `sacred-clauses:`, `modifies-sacred:`, `retires-sacred:` (3 new fields)
- **README marker pairs:** `<!-- STACK:start/end -->`, `<!-- NAMED-ARTEFACTS:start/end -->`

**Architect must update on K-052 close (post-Engineer ship):**

- `K-Line-Prediction/CLAUDE.md` — add §Sacred reconcile workflow + §Ticket-derived SSOT pattern (extends existing diary.json sync rule documentation per AC-K052-08)
- `K-Line-Prediction/ssot/system-overview.md` — list both new SSOT files in artefact inventory
- `K-Line-Prediction/ssot/conventions.md` — document `sacred-clauses:` / `modifies-sacred:` / `retires-sacred:` frontmatter family

This Sync rule is recorded for Phase 6 close; not blocking Phase 2 design lock.

---

## 20. New ACs proposed for §Acceptance Criteria

PM amend block (Architect proposes; PM rules):

### AC-K052-12 — `lessonsCodified` count test
**Given:** generator runs in mode `default`
**When:** `content/site-content.json` is regenerated
**Then:** `metrics.lessonsCodified.value` equals `ls claude-config/memory/feedback_*.md | wc -l` evaluated at generator-invocation time
**And:** label = `"Lessons Codified"`
**And:** if `claude-config/` path resolves to non-existent directory, generator emits warning + sets value to `null` (test does not fail on absence — local-only field per §5.1)

### AC-K052-13 — Weighted top-N rotation test
**Given:** `processRules[]` length > consumer's slot count `N`
**When:** consumer renders the slot-bearing frame
**Then:** rendered list = `processRules.slice(0, N)` after sorting by `weight` descending
**And:** ties broken alphabetically by `id` ascending
**And:** weight formula: `recencyScore + severityScore` per §5.5

### AC-K052-14 — README marker drift detection (reverse direction per BQ-052-14)
**Given:** `content/site-content.json` is the sole hand-edit source; README marker contents are generator-rendered
**When:** `--check` mode runs against drift-free state
**Then:** exit code = 0 (marker contents on disk byte-match generator's in-memory render)
**And:** drift case A — `stack[]` or `processRules[]` is hand-edited in JSON but generator NOT re-run (README marker contents stale relative to JSON) → `--check` exits 1, stderr names which marker pair drifted (`STACK` or `NAMED-ARTEFACTS`) + first offending entry index
**And:** drift case B — README marker block contents hand-edited inside markers (regardless of JSON state) → `--check` exits 1, stderr names which marker pair drifted + diff hint pointing to `content/site-content.json` as source-of-truth
**And:** exit code on drift = 1 (not 2 or 3 — drift is regen-fixable, not parse error or lifecycle violation)
**And:** the regression note `<!-- DO NOT EDIT inside markers — generator overwrites. Edit content/site-content.json instead. -->` precedes both `<!-- STACK:start -->` and `<!-- NAMED-ARTEFACTS:start -->` markers in README

### AC-K052-15 — Designer persona patch presence (Reviewer gate, NOT standalone test)
**Recommended fold into Reviewer Pencil-parity gate.** Reviewer adds one grep step:
```bash
grep -E '(any `content/\*\.json`|Weighted top-N layout slot)' ~/.claude/agents/designer.md
```
Both matches present = pass. Standalone AC creates frontend-test surface that doesn't fit the persona-file domain. **Do NOT add as standalone AC.**

### AC-K052-16 — Bootstrap one-shot script lifecycle (BQ-052-15)
**Given:** K-052 PR is the only window in which `scripts/bootstrap-site-content-from-readme.mjs` exists in the repo
**When:** the K-052 PR is merged to main
**Then:** the bootstrap script was created → run → its output `content/site-content.json` was committed → script `git rm`-ed in the SAME commit
**And:** at HEAD on main post-merge, `git ls-files scripts/bootstrap-*` returns empty (script absent from final tree)
**And:** `content/site-content.json` is present at HEAD on main with `stack[]` (10 entries) + `processRules[]` (5 entries) populated
**And:** `processRules[]` severity values match the §16.3 hardcoded defaults (or PM-adjusted equivalents recorded in K-052 ticket §Release Status)
**And:** all `processRules[].weight` values = `0` at bootstrap commit (computed by regular generator on first post-bootstrap invocation per §5.5)

### AC-K052-17 — PM persona ticket-close checklist patch (BQ-052-16)
**Given:** PM persona owner applies the §17.2 patch text to `~/.claude/agents/pm.md` after line 489 (Ticket closure bookkeeping item) and before line 490 (Outer-repo mirror item)
**When:** Reviewer Phase 5 runs the verification grep:
```bash
grep -F 'site-content.json' ~/.claude/agents/pm.md
```
**Then:** at least 1 hit returned (the new checklist item)
**And:** Reviewer Pencil-parity gate's persona-patch verification slot includes the line `pm.md ticket-close site-content.json checklist: ✓ patched`
**And:** verification is a Reviewer-gate row, NOT a standalone Engineer test surface (mirror of §15.2 / AC-K052-15 precedent — Engineer does NOT touch `~/.claude/agents/pm.md`)

---

## 21. Refactorability checklist

- [x] **Single responsibility:** `parseTicketCorpus()` reads, three writers emit. Three writers do not call each other.
- [x] **Interface minimization:** `ParsedCorpus` shape is the only inter-phase contract; ~10 fields. Writers receive frozen object, no mutation.
- [x] **Unidirectional dependency:** parse → emit; no circular calls. Writers never read each other's output.
- [x] **Replacement cost:** swap-out test — replacing `content/site-content.json` consumer with a new format would touch `MetricsStripSection.tsx` + `ProjectLogicSection.tsx` + the writer subroutine = 3 files. Acceptable.
- [x] **Clear test entry point:** generator exposes `--check` flag + exit codes documented; unit tests can stub `fs.readFile` and assert ParsedCorpus shape.
- [x] **Change isolation:** README content edit cannot cascade into `MetricsStripSection.tsx` directly — JSON is the boundary. Sacred-registry rule changes don't affect site-content emit.

All passes.

---

## 22. All-Phase Coverage Gate

K-052 is single-phase (engineering) in implementation terms; Phases 0–6 in PRD are workflow phases not engineering phases. Engineering coverage:

| Engineering surface | Backend API | Frontend Routes | Component Tree | Props Interface |
|---|---|---|---|---|
| K-052 entire ticket | N/A (no API) | `/about` (MetricsStripSection consumes JSON), `/` (ProjectLogicSection consumes JSON) | `MetricsStripSection` (renamed METRICS array → JSON read), `ProjectLogicSection` (STACK array → JSON read), no new components | `MetricCard` props unchanged; consumer-side prop construction from JSON |

All four columns covered for K-052's single engineering Phase. processRules consumer is K-057 (deferred per Lock-Ins Zone 2 Z) — separate ticket, separate coverage table.

---

## 23. Consolidated Delivery Gate Summary (2026-04-27)

```
Architect delivery gate:
  all-phase-coverage=✓,
  pencil-frame-completeness=N/A (no Pencil-frame change in this ticket — Designer Phase 3 delivers MetricsStrip label change separately),
  visual-spec-json-consumption=N/A (sacred-registry has no visual surface; site-content metrics card label change is a 1-line text update — see PRD AC-K052-04),
  sacred-ac-cross-check=✓ (PRD Phase Gate Checklist already confirmed),
  route-impact-table=N/A (no global CSS / sitewide token change),
  cross-page-duplicate-audit=✓ (grepped `frontend/src/components/` for `STACK = ` and `METRICS = ` arrays — only 1 hit each, no duplicates),
  target-route-consumer-scan=N/A (no route navigation behavior change),
  architecture-doc-sync=deferred-to-K-052-close (per §19),
  self-diff=✓ (this doc structural content cross-checked against PRD Lock-Ins table cell-by-cell)
  → OK
```

`pencil-frame-completeness` = N/A reason: K-052 Phase 3 Designer dispatch will change the MetricsStrip card label "First-pass Review Rate" → "Documented AC Coverage" (per AC-K052-04 last clause). That is a single text-content change inside a single existing frame; no frame additions or restructure. K-034 § Pencil Frame Completeness rule applies but is satisfied by Designer's existing MetricsStrip frame export.

`visual-spec-json-consumption` = N/A reason: K-052's visual-delta surface is one label string. Site-content JSON is the *content* SSOT, not a *visual* SSOT. Visual spec JSON gate applies to ticket-design-doc-cited frame nodes; this ticket cites metrics and processRules (data fields, not Pencil nodes).

---

## Retrospective

**Where most time was spent:** §13 6-ticket backfill table — reconciling K-034-vs-K-035 grouping (which ticket file owns the Sacred clauses originally absorbed by K-034 Phase 3) required reading both K-034 and K-035 frontmatter + scanning AC heading lines to confirm body locality. K-034 file has zero `### AC-` Sacred-shape headings, K-035 has 3; the design surface this answer with §13.2 escalation rather than self-arbitrate. Also §14.1 marker block placement — distinguishing "wrap whole §Named artefacts section incl. heading" vs "wrap body only, heading outside" required re-reading README structure to find the natural boundary.

**Which decisions needed revision:** §5.1 `lessonsCodified` path resolution — first draft hardcoded `claude-config/memory/feedback_*.md` relative path; revised to require `process.env.CLAUDE_CONFIG_PATH` env-var override after realizing CI environments don't share the parent-directory layout. §14.4 `processRules` round-trip — first draft assumed full prose round-trip; revised to structural-fields-only verification (count + ID + addedAfter + summary first-sentence) once it became clear "README phrasing wins" rules out reverse-direction prose generation.

**Next time improvement:** When Lock-Ins introduces a new SSOT field that depends on a path outside the project repo (here: `claude-config/memory/`), surface CI environment portability concern in §0 Scope Questions before the field schema is locked. PM-level decision (whether to require env-var or hardcode-with-fallback) saves a §5-section rewrite.

---

### Phase 1.5 Delta Retrospective (2026-04-27)

**Where most time was spent:** §14 reverse-direction rewrite — Phase-2 §14 was a parse-then-emit pipeline (README is source); Phase-1.5 §14 is a render-then-overwrite pipeline (JSON is source). Re-deriving the algorithm tables required holding both directions in mind to ensure Engineer's Phase-4 init commit can hand off cleanly to ongoing-mode generator. Also §17 PM persona insertion-point coordinates — Read of `~/.claude/agents/pm.md` necessary to verify line 489 is the bookkeeping closure and line 490 is outer-repo mirror; insertion-anchor drift would put the new checklist item in the wrong gate section.

**Which decisions needed revision:** AC-K052-14 — Phase-2 framed it as "round-trip test" (parse + re-render symmetry); Phase-1.5 reframes as "drift detection" with two distinct cases (JSON-changed-but-README-stale vs README-edited-inside-markers). Round-trip framing implied bidirectional integrity; drift framing matches JSON-is-source paradigm cleanly. Also §16 — initial draft included "rerun bootstrap" as a maintenance scenario; revised to one-shot-only after re-reading BQ-052-15 ruling that recovery uses `git restore`, not re-parse.

**Next time improvement:** When a Phase-N redesign reverses architectural direction (here: SSOT polarity), produce a side-by-side direction table (parse-then-emit vs render-then-overwrite) in §0 Scope Questions before any §-section rewrite. Each algorithm in the old direction maps to an inverse in the new direction; surfacing the inverse map upfront prevents accidental keep-old-text on sections (here: §14.2 marker locator regex stayed valid because it's directional-agnostic; §14.3 / §14.4 fully reversed). Saves the "is this still correct?" loop on every paragraph.
