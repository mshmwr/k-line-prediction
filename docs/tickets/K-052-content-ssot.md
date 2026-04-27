---
id: K-052
title: Ticket-derived SSOT — site-content (About/Home metrics + stack) + sacred-registry
status: open
type: feat
priority: high
created: 2026-04-26
visual-delta: yes
design-locked: false
content-delta: yes
qa-early-consultation: ✓ → docs/retrospectives/qa.md 2026-04-27 K-052
parent-plan: ~/.claude/plans/pm-ux-ux-wild-shore.md
prerequisite: meta-engineer-challenge-gate PR merged to main (codifies Pre-Implementation Design Challenge Gate into engineer.md / senior-architect.md / pm.md personas; K-052 Architect dispatch BLOCKED until that lands)
---

## BQ Resolution Lock-Ins (Phase 1 close 2026-04-27 + Phase 1.5 architectural reversal 2026-04-27)

PM rulings on Phase 1 QA Early Consultation challenges + late-Phase-1 user-driven SSOT direction reversal. This table supersedes earlier BQ drafts in the parent plan file and is the in-ticket SOR for Architect Phase 1.5 redesign.

**⚠️ Phase 1.5 redesign needed.** Existing Architect design doc (`docs/designs/K-052-content-ssot.md`) was produced under "README is source" assumption. BQ-052-14 reverses direction to "JSON is source". §Architecture / §Scope / §AC sections below describe OLD direction; Architect Phase 1.5 dispatch will produce delta covering: (a) Output 3 reverse direction (JSON → README marker block, not README → JSON), (b) bootstrap one-shot script + delete, (c) PM persona patch for ticket-close site-content review checklist.

| BQ / Zone | Decision | Impact on architecture |
|---|---|---|
| **BQ 1** — `featuresShipped` definition | **A — permissive** (count `K-*` with `status: closed`, no `closed-commit:` gate) | Card #1 reflects "shipped to main" intent loosely; Sacred-registry retains its own strict `closed-commit:` gate for retirement audit |
| **BQ 2** — Card #4 metric | **B — replace `Guardrails in Place` with `Lessons Codified`**, auto-derived from `claude-config/memory/feedback_*.md` count | Removes manual-override field; emit pulls live count from memory feedback files; card label updates in `MetricsStripSection.tsx` |
| **Zone 1** — README badge consistency | **B — structured stack `[{name, category, logo, color}]`** in JSON; README badges rendered FROM JSON via `<!-- STACK:start -->...<!-- STACK:end -->` marker block (direction confirmed JSON→README per BQ-052-14) | Triple-emit pipeline: JSON SSOT + sacred-registry + README marker blocks. Marker pattern mirrors K-039 `<!-- ROLES:start -->` |
| **Zone 2 — /about consumer** | **Z — defer to K-057** | K-052 builds SSOT + weight schema + maintenance flow; /about Pencil-frame design + new section component deferred to K-057 (open same PR as K-052 close, orphan period < 1 week) |
| **Zone 2 — weight calc** | **B — auto formula** `weight = recencyScore + severityScore` (recency decays from `addedAfter` ticket close date; severity = 3-tier structured JSON field `critical-blocker` / `warning` / `advisory`) | Severity now structured JSON field per BQ-052-14 (was inline README tag); PM edits JSON entry, generator reads. Top-N rotation by sorted weight when consumer slot count < entry count |
| **Designer persona patch** (Gap 1 + Gap 2 combined) | **Bundle into K-052 Architect design doc as a deliverable** — single-commit edit to `~/.claude/agents/designer.md` §Text fields are frozen-at-session snapshots | Gap 1: generalize L231 example from `roles.json` only → any `content/*.json` member, list metrics / processRules → about-v2.pen frame mapping. Gap 2: add §Weighted top-N layout slot sub-section |
| **BQ 3** — Sacred-detection rule + closed-commit gate | **A — frontmatter `sacred-clauses: [AC-XXX]` declaration + backfill 5 legacy Sacred-bearing tickets** (K-021 / K-031 / K-035 / K-040 / K-046) — K-034 dropped per BQ-052-13 body-locality | Generator only registers clauses listed in frontmatter (typo guard + invariant integrity); strict `closed-commit:` gate retained. Backfill cost: ~10 lines patch across 5 tickets, single PM commit |
| **BQ-052-12** — Home stack render count | **A — Category filter** | 6-category schema; Home consumer filters `category ∈ {language, framework, build-tool, e2e-test}` → 6 items match current visual; README badges render all 10 (no filter) |
| **BQ-052-13** — K-034 vs K-035 Sacred clause file ownership | **A — body-locality wins, backfill K-035 not K-034** | `sacred-clauses:` frontmatter co-locates with `### AC-` body heading; Generator stays single-file. K-034 dropped from backfill (its body has 0 Sacred headings; clauses live in K-035 file) |
| **BQ-052-14** — SSOT direction (Architectural reversal, user directive "重新規劃") | **A — JSON is sole source-of-truth; README marker blocks rendered FROM JSON** | Direction reversed from initial plan. `content/site-content.json` is sole hand-edit target for `stack[]` + `processRules[]`. Generator writes `<!-- STACK:start -->` and `<!-- NAMED-ARTEFACTS:start -->` README marker blocks FROM JSON (overwrite). Severity becomes structured JSON field (no inline README tags). README narrative paragraphs (K-line description, BFP quote) remain hand-written outside markers. `renderSlots.{home,about,readme}` per-consumer count fields |
| **BQ-052-15** — Bootstrap parser lifecycle | **A — One-shot parse + delete** | `scripts/bootstrap-site-content-from-readme.mjs` runs once at K-052 land, parses current README badges + §Named Artefacts → seeds JSON, then `git rm`-ed in same commit. Avoids reverse-direction parser blurring SSOT direction |
| **BQ-052-16** — Maintenance trigger at ticket close | **A — PM persona checklist addition** | `~/.claude/agents/pm.md` Phase Gate ticket-close checklist gains item: "Reviewed `content/site-content.json` against this ticket's retro: added new processRule / upgraded severity / downgraded stale entry / no change". Hard step, recorded in ticket close-out section |
| **BQ-052-17** — Sacred Registry direction unchanged | **Confirmed — Sacred chain stays as designed** | Sacred Registry already follows JSON-is-source pattern (ticket frontmatter `sacred-clauses:` + body headings are source → registry rendered). BQ-052-14 reversal applies only to site-content chain; Architect design doc §Sacred sections untouched |

**JSON-is-source paradigm (user directive 2026-04-27, supersedes earlier "README is source-of-truth on overlap"):** `content/site-content.json` is the sole hand-edit target for `stack[]` + `processRules[]`. Generator runs one direction only — JSON → README marker blocks + frontend consumers. Bootstrap script seeds JSON from current README content one-shot then self-deletes. Maintenance enforced via PM ticket-close checklist (BQ-052-16).

**Triple-emit (final architecture, all WRITE-direction from SSOT):**
1. `content/site-content.json` — site-content SSOT (sole hand-edit; bootstrap seeds from README once, then JSON is master)
2. `docs/sacred-registry.md` — Sacred lifecycle output (orthogonal SSOT chain: ticket frontmatter is source → registry rendered; unchanged by BQ-052-14)
3. README marker blocks (`<!-- STACK:start -->` + `<!-- NAMED-ARTEFACTS:start -->`) + frontend consumers (/home + /about) — all rendered FROM site-content.json

**Architect Phase 1.5 input**: this table is the design-doc delta spec. Existing `docs/designs/K-052-content-ssot.md` §1-13 (shared infra + auto-derived fields + Sacred sections) remains valid; §14 (README marker block consumer wiring) needs reverse-direction rewrite; new §16 needed for bootstrap one-shot + PM persona patch. Designer persona patch (Gap 1 + Gap 2) unchanged. Net design doc delta: ~150-200 lines.

## Goal

Establish a **ticket-derived SSOT pattern** for K-Line — one build-time pipeline that reads `docs/tickets/K-*.md` once per build and emits TWO derived artefacts from the same parse pass:

1. **`content/site-content.json`** — About-page DELIVERY METRICS (Features Shipped / AC Coverage / Post-mortems / Guardrails) + Home-page Stack list. Eliminates hardcoded ticket counts in `MetricsStripSection.tsx` (currently claims "17 Features Shipped (K-001→K-017)" while 50 K-tickets actually exist).
2. **`docs/sacred-registry.md`** (or `.json` + rendered markdown — final form decided in Phase 2 by Architect) — consolidated index of every Sacred clause from closed-and-shipped tickets (`status: closed` + `closed-commit:` present), eliminating PM's grep-every-ticket motion in §AC-vs-Sacred cross-check (replaced with one Read of the registry).

Both outputs share one build script, one pre-commit `--check` hook, and one Architect Pre-Design Audit grep. K-039 split-SSOT pattern (`content/roles.json` + generator + pre-commit) is the structural template, extended to multi-emit-target.

## Background

Operator raised UX issue #2 (UX brainstorm session 2026-04-26): About / Home content is hardcoded and stale; no SSOT means manual sync drifts every time a ticket closes. Plan brainstorming + ExitPlanMode approval landed the architecture decision in `~/.claude/plans/pm-ux-ux-wild-shore.md` (renumbered from original K-051 to K-052 because K-051 was occupied by `K-051-daily-db-backfill-rollup-fix` shipped in PR #13).

**Scope expansion 2026-04-26 (post-initial-PRD, operator decision):** What was originally scoped as a separate TD ticket — a Sacred Registry SSOT to replace PM's `grep -rn '## AC-.*-REGRESSION' docs/tickets/` motion at every AC-write-time §AC-vs-Sacred cross-check — was merged into K-052 because the two outputs share a single ticket-parse infrastructure. Splitting into TD would force Architect to run the same Pre-Design Audit twice, Engineer to maintain two scripts and two pre-commit hooks, and QA to verify two near-identical drift-detection paths. Bundling cleaner; same PRD owns both emit targets.

Confirmed BQs from plan + 2026-04-26 scope expansion ruling:
- **BQ 1** — Metrics card #2 swapped from "First-pass Review Rate" → **AC Coverage** (auto-derivable, monodirectional). Bug Found Protocol story relocated to README narrative (covered by K-054).
- **BQ 2** — README line 28 `Stack:` is NOT a JSON consumer; it gets deleted in K-054. site-content JSON serves About + Home only.
- **Filter rule (both outputs)** — `K-*` tickets only enter the parse pipeline; `TD-*` (tech-debt) tickets excluded. Repo currently has 46 K-XXX + 3 TD-XXX tickets; only 46 enter the math AND only 46 contribute Sacred entries to the registry.
- **BQ 3 (sacred bundle vs split, operator-ruled 2026-04-26)** — Bundle into K-052 over spinning a TD ticket. Reasoning: same parse pass, same pre-commit hook, same Audit grep — splitting yields 2× infrastructure for zero coupling reduction.

Existing K-039 split-SSOT pattern (`content/roles.json` + `scripts/sync-roles-docs.mjs` + pre-commit `--check`) is the structural template; K-052 extends it with a multi-emit-target generator (one parse, two writers).

## Scope

**In-scope (shared infrastructure):**
- New build script: `K-Line-Prediction/scripts/build-ticket-derived-ssot.mjs` (renamed from initial `build-site-content.mjs` to reflect dual-emit role; final filename Architect-decided in Phase 2). Single parse of `docs/tickets/K-*.md`; multi-writer architecture; supports `--check` mode for pre-commit (compares ALL emit targets against re-derive).
- Edit: `K-Line-Prediction/frontend/package.json` — add `prebuild` invocation that runs the generator (covers both emit targets in one call)
- Edit: `.husky/pre-commit` (or equivalent K-039 hook location) — add generator `--check` invocation (single hook covers both emit targets)
- Edit: `K-Line-Prediction/CLAUDE.md` — document the new ticket-derived SSOT pattern (both site-content + sacred-registry) alongside existing `roles.json` / `diary.json` sync rules

**In-scope (Output 1 — site-content):**
- New SSOT: `K-Line-Prediction/content/site-content.json` (sibling of existing `content/roles.json`)
- Edit: `K-Line-Prediction/frontend/src/components/about/MetricsStripSection.tsx` — replace hardcoded `METRICS` array with JSON-driven 4 cards (Features Shipped / AC Coverage / Post-mortems Written / Guardrails)
- Edit: `K-Line-Prediction/frontend/src/components/home/ProjectLogicSection.tsx:79–80` — replace hardcoded `STACK` array with JSON read
- Edit: `K-Line-Prediction/frontend/e2e/about-v2.spec.ts` + `about-layout.spec.ts` — assertions adapt to dynamic count (label "Nº 01 — DELIVERY METRICS" remains exact match; value cells use regex `/^\d+$/` for Features Shipped, `/^\d+ \/ \d+ \(\d+%\)$/` for AC Coverage)
- Designer follow-up artefacts: Pencil frame for the 4-card MetricsStrip (label change "First-pass Review Rate" → "Documented AC Coverage"; format spec `{covered} / {total} ({percent}%)`); `frontend/design/specs/<frame-id>.json` re-export; `frontend/design/screenshots/<frame-id>.png`

**In-scope (Output 2 — sacred-registry):**
- New SSOT: `K-Line-Prediction/docs/sacred-registry.md` (Architect Phase 2 decides whether to additionally emit `.json` source + render `.md`, or markdown-only with structured-comment fences)
- New ticket frontmatter convention: `retires-sacred:` field (list-of-strings; each entry references a Sacred clause ID being retired by THIS ticket — e.g. `retires-sacred: [AC-021-FOOTER, AC-022-HERO-TWO-LINE]`). PM uses this in retiring-ticket frontmatter; generator reads it to flip target Sacred entries' status from `active` → `retired-by: <this-ticket-id>`. Documented in CLAUDE.md alongside the SSOT pattern.
- New Architect-rule documentation in `K-Line-Prediction/CLAUDE.md`: Sacred reconcile workflow — when PM amends a Sacred clause's text in a NEW ticket (not retire — modify), the new ticket's frontmatter carries `modifies-sacred: [<sacred-id>]` and the source ticket's Sacred clause body is re-Edited in the same PM session (retired-in-place pattern preserved); the registry generator detects body-text drift via SHA hash on each clause and updates `last-modified-by` + `last-modified-at` fields.
- Generator subroutine: `parseSacredClauses()` extracts `## AC-*-REGRESSION` (and equivalent Sacred-marked) sections from each closed-and-shipped K-* ticket; computes upsert+diff against existing `docs/sacred-registry.md` — three-case algorithm (Add / Modify / Retire) per Architect Phase 2 design.
- Pre-commit hook integration: same `--check` invocation as Output 1 — generator regenerates registry, diffs against committed file; mismatch → exit non-zero with the offending Sacred clause ID + ticket source named in the failure message.

**Out-of-scope:**
- README line 28 `Stack:` line removal (covered by K-054; K-052 confirms README is NOT a JSON consumer)
- Programmatic derivation for `guardrails` field (no consistent SOR — manual override only; would require sweeping rule-introduction commit history mining)
- Any non-About / non-Home consumers of the site-content JSON (Diary page, App page, business-logic page out of scope)
- Translation of ticket markdown (covered by K-054)
- Scroll-to-top behavior (covered by K-053)
- **Sacred clause content review** — the registry is a **mechanical aggregator**, not a content reviewer. Whether a Sacred clause SHOULD have been written, retired, or modified is PM's §AC-vs-Sacred cross-check work at AC-write time (`feedback_pm_ac_sacred_cross_check.md`); the registry only consolidates what already exists in tickets. Any "Sacred clause looks wrong / outdated" conclusion is a PM decision triggering a reconcile ticket, not a generator-script decision.
- **Backfill of legacy retirement notations** — tickets that already retired-in-place (K-022 / K-034 P2 / K-039 Sacred D-4 / K-040 retirements) without `retires-sacred:` frontmatter are NOT retroactively flagged. Generator picks up their retirements via the source-ticket Sacred clause body containing a "retired" notation (Architect Phase 2 specifies the exact heuristic — recommended: heading suffix `[RETIRED by K-XXX YYYY-MM-DD]` or body marker `**Status:** retired-by: K-XXX`). PM does not retroactively edit closed tickets' frontmatter.

### Split-Threshold check

§Split-Threshold rule (`~/.claude/agents/pm.md`): AC count > 8 per ticket triggers split consideration. K-052 lands at **11 ACs** (8 site-content + 3 sacred). Split rationale evaluated: splitting into K-052a (site-content) + K-052b (sacred) would force Architect to run two Pre-Design Audits over the same `docs/tickets/K-*.md` corpus, Engineer to maintain two parsers, two pre-commit hook entries, two `prebuild` invocations, two QA early-consultation sessions covering near-identical drift-detection edge cases. Coupling cost vastly exceeds the cap-of-8 violation cost. **Operator-approved single-ticket bundle 2026-04-26**, with this rationale block as the on-record waiver. Split would be revisited only if AC count exceeds 14 OR if Architect Phase 2 design surfaces structural reasons to separate the two outputs (e.g. site-content needs different release cadence than sacred-registry).

## Acceptance Criteria

AC numbering: `AC-K052-01..08` cover site-content output; `AC-K052-09..11` cover sacred-registry output. Both groups land in the same Phase 4 implementation pass (single generator). Cross-output integration is implicit in the shared-script ACs (AC-K052-02 + AC-K052-03 cover the parser; AC-K052-09..11 extend the same script's emit phase).

### AC-K052-01 — SSOT JSON file exists with locked schema
**Given:** `content/site-content.json` lands at K-Line-Prediction repo root  
**When:** `cat content/site-content.json | jq .` runs  
**Then:** JSON parses cleanly  
**And:** top-level keys are exactly `metrics`, `stack`, `lastUpdated`, `ticketRange`  
**And:** `metrics.featuresShipped`, `metrics.acCoverage`, `metrics.postMortemsWritten`, `metrics.guardrails` all present  
**And:** `stack` is array of 10 strings: `["React", "TypeScript", "Vite", "FastAPI", "Python", "Playwright", "Vitest", "pytest", "Firebase Hosting", "Cloud Run"]`  
**And:** `ticketRange.first` = `"K-001"` and `ticketRange.last` matches max K-NNN from `docs/tickets/`

### AC-K052-02 — Build script computes metrics deterministically (single parse, two emit targets)
**Given:** the ticket-derived SSOT generator (filename Architect-decided, e.g. `scripts/build-ticket-derived-ssot.mjs`) runs in a fresh clone  
**When:** `node scripts/<generator>.mjs` exits 0  
**Then:** `metrics.featuresShipped.value` equals count of `docs/tickets/K-*.md` files where frontmatter `status: closed`  
**And:** `metrics.acCoverage.covered` equals count of `docs/tickets/K-*.md` files with non-empty `## Acceptance Criteria` section (≥ 1 line of content between heading and next `##`)  
**And:** `metrics.acCoverage.total` equals total count of `docs/tickets/K-*.md` files (TD-* excluded)  
**And:** `metrics.postMortemsWritten.value` equals count of `docs/tickets/K-*.md` files with non-empty `## Retrospective` section  
**And:** `metrics.guardrails.value` is preserved from previous JSON (manual override; script must NOT zero it)  
**And:** the ticket corpus is parsed exactly once per invocation (verifiable via Architect-defined logging or single-`fs.readFile`-per-ticket assertion in unit test) — both `site-content.json` and `sacred-registry.md` derive from the same in-memory parse result

### AC-K052-03 — Pre-commit hook fails on JSON / registry drift (single hook, multi-emit)
**Given:** developer modifies a ticket (e.g. closes a ticket: `status: open` → `status: closed`, OR adds a new Sacred clause to `## AC-*-REGRESSION` section) but forgets to regenerate the derived artefacts  
**When:** `git commit` runs  
**Then:** pre-commit hook executes the generator with `--check` flag  
**And:** hook detects drift in EITHER `content/site-content.json` OR `docs/sacred-registry.md` (or both), exits non-zero  
**And:** commit is blocked with message naming the drifted artefact + the specific field / Sacred clause ID that drifted  
**And:** running the generator without `--check` regenerates BOTH artefacts in one pass; subsequent commit succeeds  
**And:** an isolated drift in only one emit target does NOT cause spurious failure in the other (e.g. ticket closure that affects metrics but not Sacred clauses regenerates only `site-content.json`; pre-commit `--check` reports only the metrics drift, not a phantom registry drift)

### AC-K052-04 — About-page MetricsStripSection consumes JSON
**Given:** user visits `/about`  
**When:** Nº 01 — DELIVERY METRICS card renders  
**Then:** card 1 label = `"Features Shipped"`, value = `metrics.featuresShipped.value` from JSON  
**And:** card 2 label = `"Documented AC Coverage"`, value renders per format `{covered} / {total} ({percent}%)` (e.g. `46 / 46 (100%)`)  
**And:** card 3 label = `"Post-mortems Written"`, value = `metrics.postMortemsWritten.value`  
**And:** card 4 label = `"Guardrails in Place"`, value = `metrics.guardrails.value`  
**And:** NO hardcoded numbers remain in `MetricsStripSection.tsx` (grep `frontend/src/components/about/MetricsStripSection.tsx` for `K-001\|K-017\|17 Features` returns empty)  
**And:** Pencil frame for MetricsStrip + `frontend/design/specs/<frame-id>.json` updated to label "Documented AC Coverage" with format `{covered} / {total} ({percent}%)`

### AC-K052-05 — Home-page Stack list consumes JSON
**Given:** user visits `/`  
**When:** ProjectLogicSection renders the stack list  
**Then:** stack items render in the order from JSON `stack` array (10 items: React, TypeScript, Vite, FastAPI, Python, Playwright, Vitest, pytest, Firebase Hosting, Cloud Run)  
**And:** NO hardcoded `STACK = [...]` array remains in `frontend/src/components/home/ProjectLogicSection.tsx` (grep returns empty)

### AC-K052-06 — Playwright assertions use regex (not exact counts)
**Given:** `frontend/e2e/about-v2.spec.ts` and `about-layout.spec.ts` updated  
**When:** Playwright suite runs  
**Then:** label assertions still use exact match (`Nº 01 — DELIVERY METRICS`, `Features Shipped`, `Documented AC Coverage`, `Post-mortems Written`, `Guardrails in Place`)  
**And:** value assertions use regex: `/^\d+$/` for integer cards, `/^\d+ \/ \d+ \(\d+%\)$/` for AC Coverage  
**And:** suite passes against current JSON values  
**And:** suite WOULD pass after a future ticket close (no hard-coded "17" / "46" anywhere in spec files)

### AC-K052-07 — `frontend/package.json` prebuild wires JSON regen
**Given:** `frontend/package.json` `prebuild` script edited  
**When:** developer runs `cd frontend && npm run build`  
**Then:** `prebuild` step executes `node ../scripts/build-site-content.mjs` (or equivalent path-correct invocation) before Vite build  
**And:** Vite build picks up the regenerated JSON (asset import or public copy mechanism per Architect decision)  
**And:** built bundle in `frontend/dist/` reflects current ticket counts

### AC-K052-08 — CLAUDE.md documents the new sync rule (both emit targets)
**Given:** `K-Line-Prediction/CLAUDE.md` updated  
**When:** developer reads the SSOT-sync section  
**Then:** section explicitly names BOTH `content/site-content.json` AND `docs/sacred-registry.md` as build-derived from `docs/tickets/K-*.md` via one shared generator  
**And:** documents the K-* filter (TD-* excluded with one-line reason — applies uniformly to both emit targets)  
**And:** documents `guardrails` as manual-override field  
**And:** documents the pre-commit guard analogous to K-039 `roles.json` flow (single `--check` invocation covers both emit targets)  
**And:** documents the new `retires-sacred:` and `modifies-sacred:` frontmatter fields with one example each, pointing to the Sacred reconcile workflow section

### AC-K052-09 — Sacred Registry derived from closed-and-shipped ticket Sacred clauses
**Given:** any ticket file `docs/tickets/K-XXX*.md` has frontmatter `status: closed` AND `closed-commit:` is non-empty (ticket has been deployed; `closed-commit:` presence is the K-Line proxy for "shipped to main" since there is no separate `deploy:` frontmatter field)  
**And:** the ticket file contains one or more `## AC-*-REGRESSION` headings (Sacred clauses)  
**When:** the generator runs (`node scripts/<generator>.mjs`)  
**Then:** `docs/sacred-registry.md` contains one entry per Sacred clause from that ticket  
**And:** each registry entry exposes at minimum: source ticket ID (e.g. `K-035`), clause ID (e.g. `AC-K035-REGRESSION-01` or whatever heading the source ticket used verbatim), status (`active` by default), original clause body verbatim, `last-modified-by` (= source ticket ID at first emit), and `last-modified-at` (= source ticket `closed:` date)  
**And:** entries are grouped by source ticket ID, ascending K-NNN order, with a per-ticket sub-heading naming the source ticket  
**And:** the registry's top section enumerates the corpus (count of source tickets contributing Sacred clauses, total active vs retired clause count) — derivable from the parse pass, not hand-counted  
**And:** a ticket with `status: open` OR `status: closed` but missing `closed-commit:` does NOT contribute Sacred entries (in-flight Sacred clauses are not authoritative until the ticket ships)

### AC-K052-10 — Sacred Registry handles modify (reconcile-in-place)
**Given:** an existing Sacred clause `AC-K035-REGRESSION-01` (source: K-035, status: `active`) is amended in PM session work — PM Edits the K-035 source ticket's clause body text AND opens a new ticket K-NNN whose frontmatter declares `modifies-sacred: [AC-K035-REGRESSION-01]`  
**When:** the generator runs after K-NNN ships (`status: closed` + `closed-commit:` non-empty)  
**Then:** the registry entry for `AC-K035-REGRESSION-01` shows the new clause body text verbatim (matching the current K-035 source ticket text)  
**And:** the entry's `last-modified-by` field updates to `K-NNN`  
**And:** the entry's `last-modified-at` field updates to K-NNN's `closed:` date  
**And:** the entry's status remains `active` (modify is not retire)  
**And:** the generator detects the body-text change via SHA hash comparison (Architect Phase 2 specifies hash algorithm and which clause-body bytes are included — at minimum: heading text + body markdown between heading and next `##`, normalized whitespace)  
**And:** if K-NNN frontmatter declares `modifies-sacred:` but the referenced Sacred clause body is unchanged in source, the generator emits a warning naming the no-op modification (Architect Phase 2 decides whether warning is fatal or advisory; PM recommendation: advisory + register output diff to surface to PM at next AC-write)  
**And:** if the source K-035 clause body is edited but K-NNN frontmatter omits `modifies-sacred:`, the generator emits a fatal error naming the unannotated drift (prevents silent reconcile)

### AC-K052-11 — Sacred Registry handles retire
**Given:** a new ticket K-MMM frontmatter declares `retires-sacred: [AC-K021-FOOTER]` (the format used per the K-035 → K-021 Sacred retirement precedent)  
**And:** the source K-021 ticket's clause `AC-K021-FOOTER` body has been annotated with the retirement notation per Architect Phase 2 spec (recommended: heading-suffix `[RETIRED by K-MMM YYYY-MM-DD]` so a body-text re-Edit of closed K-021 ticket is audit-traceable)  
**And:** K-MMM is `status: closed` + `closed-commit:` non-empty  
**When:** the generator runs  
**Then:** the registry entry for `AC-K021-FOOTER` flips status from `active` to `retired-by: K-MMM`  
**And:** the entry preserves the original clause body text as `originalText` field (history retained — registry is auditable not append-only-erasable)  
**And:** the entry exposes `retired-at: <K-MMM closed: date>` field  
**And:** the registry's top-section count totals reflect the retire (active count -1, retired count +1)  
**And:** the entry remains in its original per-ticket grouping (K-021 grouping), NOT moved to a separate "retired" section — preserves source-ticket provenance for audit  
**And:** if K-MMM frontmatter declares `retires-sacred:` but the source K-021 clause body lacks the retirement notation, the generator emits a fatal error (PM forgot to annotate-in-place; reconcile workflow incomplete)  
**And:** if a Sacred clause body has retirement notation but no ticket has `retires-sacred:` pointing to it, the generator emits a fatal error (orphaned retirement; PM annotated source without opening the retiring ticket's frontmatter properly)

## Phase plan

### Phase 0 — Prerequisite gate (BLOCKED state — operator action required)

**BLOCKED until `meta-engineer-challenge-gate` PR merged to main.** That PR codifies Pre-Implementation Design Challenge Gate into:
- `~/.claude/agents/engineer.md` (5-dimension challenge sheet + read-only-pass-first rule)
- `~/.claude/agents/senior-architect.md` (same-session verdict obligation + 3 verdict types)
- `~/.claude/agents/pm.md` (dispatch-prompt template addition + Phase Gate field "Engineer challenge sheet resolved? ✓/N/A")
- New memory `feedback_engineer_pre_implementation_challenge_gate.md`
- MEMORY.md pointer sync

K-052 worktree creation (`K-052-content-ssot`) and Architect dispatch happen ONLY after that PR merges. Operator triggers when ready.

### Phase 1 — QA Early Consultation (real qa, pre-Architect)

**Dispatch:** real `qa` agent via Agent tool inside K-052 worktree.

**QA scope (adversarial cases qa must surface verdicts on):**

**Site-content output (Output 1):**
- Empty `docs/tickets/` directory (fresh clone before any tickets) — script behavior?
- Malformed YAML frontmatter — script must not crash; fail loudly with file path
- Ticket with `status: closed` AND `type: tech-debt` — included in `featuresShipped`? (Plan rule: filter is `K-*` filename prefix; if a K-* ticket has `type: tech-debt` frontmatter — possible? — what wins?)
- Ticket with empty AC section but `status: closed` — counts as 0 coverage? Edge of AC Coverage definition.
- AC heading variants — `## Acceptance Criteria` vs `## Acceptance criteria` vs `## AC` — regex must handle or fail loud
- Pre-commit hook failure modes: dirty `content/site-content.json` blocks unrelated commits (e.g. fixing typo in a `.tsx` file shouldn't trip the hook)
- Migration first run after merge: large initial JSON diff — review burden? Atomic commit with both JSON + script?
- `lastUpdated` field — derived from `git log -1 --format=%cd docs/tickets/` (most recent ticket touch) or build timestamp? Both have failure modes.
- TD-* tickets that LATER convert to K-* (rename) — script handles?

**Sacred-registry output (Output 2):**
- Sacred clause heading variants — `## AC-021-FOOTER` (K-021 style) vs `## AC-K035-REGRESSION-01` (newer style) vs `## AC-034-P1-ROUTE-DOM-PARITY` (K-034 multi-phase style) — what is the parser's match rule? Conservative regex risks missing legitimate Sacred; permissive risks false-positives on regular AC headings.
- Closed-but-not-shipped state — what if a K-XXX ticket is `status: closed` but `closed-commit:` is empty (e.g. operator marked closed but the merge commit hasn't landed yet)? AC-K052-09 says do NOT contribute Sacred; QA confirms parser rejects cleanly with a warning, not silent skip.
- Same-commit add+retire — a single new ticket K-NNN closes with frontmatter `retires-sacred: [AC-OLD]` AND its own `## AC-NEW-REGRESSION` clause (introduces a new Sacred while retiring an old one). Generator must emit BOTH operations in the registry diff (one retire entry-flip + one new active entry). Edge-of-edge: K-NNN's new Sacred is itself a replacement for the retired one — registry must not artificially link them, just emit both as independent registry events.
- Same-clause modify+retire in adjacent commits — K-NNN closes with `modifies-sacred: [AC-OLD]`, then K-NNN+1 closes with `retires-sacred: [AC-OLD]`. After K-NNN+1 ships, registry shows AC-OLD as `retired-by: K-NNN+1`, with `last-modified-by: K-NNN` preserved in history? Or is `last-modified-by` overwritten? AC-K052-11 says `originalText` preserved + `retired-at` set; the K-NNN modify chapter MUST also be visible in the entry's audit trail (Architect Phase 2 to design the history field structure).
- Reconcile-without-annotation drift — PM Edits a source Sacred clause body but forgets to open a `modifies-sacred:` ticket. AC-K052-10 says fatal error. QA confirms the error message names the source ticket + the clause + the drift bytes (developer must be able to fix without grepping).
- Orphaned retirement — `retires-sacred:` points to a Sacred clause that does not exist in any closed-and-shipped ticket. Generator must fail loud (typo guard).
- Heading-suffix retirement notation drift — `[RETIRED by K-MMM 2026-04-26]` vs `[Retired by K-MMM]` vs `(retired)` — what shapes does the parser accept? Permissive accepts all; conservative requires exact spec. PM recommendation: enforce exact spec with one canonical form, reject variants with fatal error to keep audit unambiguous.
- Backfill scope — legacy retirement notations from K-022 / K-034 P2 / K-039 D-4 / K-040 retired Sacred clauses are out-of-scope (PRD §Out-of-scope). QA confirms generator's first run does NOT crash on these (recommended: generator infers `retired` status from heading suffix, but does NOT create synthetic `retires-sacred:` frontmatter on the retiring ticket; instead emits a Phase-1-of-K-052 migration warning listing legacy tickets that need backfill in a follow-up TD ticket).
- Pre-commit hook noise — same as site-content concern, scoped to registry: a cosmetic ticket Edit (typo fix in non-Sacred section) regenerates the registry deterministically (no spurious diff)? Or does any ticket touch trigger registry rewrite? AC-K052-03 last clause says no spurious cross-emit drift; QA verifies with a typo-only ticket Edit + `--check` exit code = 0.

**Deliverable:** QA returns Challenge list; PM rules per Challenge → either supplement AC OR mark Known Gap with reason. Phase 1 closes when every QA Challenge has a recorded ruling in this PRD.

**Gate:** PM does NOT dispatch Architect until QA Challenge ruling block is added to PRD.

### Phase 2 — Architect design

**Dispatch:** `senior-architect` agent inside K-052 worktree, with QA Challenge rulings + this PRD attached.

**Architect deliverables:**
- `docs/designs/K-052-content-ssot.md` design doc covering BOTH emit targets in one document (NOT two separate design docs — the shared parse pipeline is the load-bearing decision):

  **Shared infrastructure section:**
  - Build script API (CLI flags: `--check` vs default; exit codes per emit-target failure mode; output format on drift; whether drift in one emit target affects exit code reporting for the other)
  - Single-parse architecture: how the in-memory ticket parse result feeds both writers; data structure between parse and emit; failure isolation (registry emit failure must not corrupt site-content emit, and vice versa)
  - TD-vs-K filter implementation (filename prefix match — confirm not frontmatter-based) — applies uniformly to both outputs
  - Pre-commit hook integration test plan (drift detect / regen / pass cycle for each emit target independently AND together)
  - Final filename for the generator (PRD draft uses `build-ticket-derived-ssot.mjs`; Architect locks)

  **Output 1 (site-content) section:**
  - JSON schema lock (key list, types, required vs optional)
  - AC-detection regex specification (which heading variants accepted; how empty section detected)
  - Frontend wiring: Vite asset import vs `public/` copy — pick one, justify
  - Regression analysis for `MetricsStripSection.tsx` consumers (any other file imports the hardcoded `METRICS`?)
  - `lastUpdated` source decision (git log vs build timestamp)

  **Output 2 (sacred-registry) section:**
  - Sacred clause heading match rule (exact spec, with explicit list of accepted heading shapes from existing closed K-tickets — Architect runs `grep -hE '^## AC-' docs/tickets/K-*.md | sort -u` and decides the canonical regex; QA Challenge #1 of registry feeds this)
  - Final registry artefact form: markdown-only with structured-comment fences, OR JSON-source + rendered-markdown — Architect ruling with rationale (PM observation: markdown-only is simpler for diff-readability; JSON-source enables programmatic consumers later)
  - Three-case algorithm spec (Add / Modify / Retire) — pseudocode + edge-case truth table covering at minimum: same-commit add+retire (QA Challenge), modify-then-retire chain (QA Challenge), retire-without-annotation (fatal), modify-without-annotation (fatal), orphaned `retires-sacred` (fatal)
  - SHA hash spec for clause-body-text drift detection (which bytes are hashed — heading + body? whitespace normalized? — and the canonical algorithm, e.g. SHA-256 of UTF-8 bytes after `[\s]+` collapse)
  - Reconcile workflow documentation: the precise sequence of PM actions (Edit source ticket Sacred clause body → annotate retirement-suffix in source heading → declare `retires-sacred:` / `modifies-sacred:` in new ticket frontmatter → close new ticket → generator detects + updates registry)
  - History/audit-trail field structure on registry entries (handles the modify-then-retire chain QA challenge; entry's audit trail must show every `modifies-sacred:` event in chronological order, with the final `retired-by:` capping it)
  - Schema for `retires-sacred:` / `modifies-sacred:` frontmatter fields (list-of-strings; reference grammar: `AC-XXX-...`; validation rule: each referenced ID must resolve to a real Sacred clause heading in some closed-and-shipped K-* ticket OR in this same ticket — covers in-ticket modify edge case)
  - Legacy backfill warning format (Phase-1 migration message listing K-022 / K-034 P2 / K-039 D-4 / K-040 retired Sacred without `retires-sacred:` annotation; this is a TD candidate, not a K-052 deliverable per §Out-of-scope)

- Pencil frame draft + `frontend/design/specs/<frame-id>.json` showing label change to "Documented AC Coverage" + format string (visual deliverable scope unchanged from initial PRD — sacred-registry output is markdown only, no Pencil frame)

### Phase 3 — Designer (visual-delta: yes Sign-off)

**Dispatch:** `designer` agent inside K-052 worktree.

**Designer deliverables:**
- Pencil frame edits per Architect draft
- `frontend/design/specs/<frame-id>.json` exported
- `frontend/design/screenshots/<frame-id>.png` captured at relevant breakpoint
- PM sets ticket frontmatter `design-locked: true` + 1-line release note after parity confirmed

### Phase 4 — Engineer Challenge Sheet + Implementation

**Dispatch:** `engineer` agent inside K-052 worktree, with Architect design doc + Designer artefacts attached.

**Engineer flow (per Pre-Implementation Design Challenge Gate codified in Phase 0):**
1. **Read-only pass** over `docs/designs/K-052-content-ssot.md` — NO Edit allowed yet
2. Produce **Design Challenge Sheet** across 5 dimensions (Ambiguity / Internal contradiction / Missing info / Implementation blocker / Cost challenge)
3. Each challenge → Architect (or PM proxy) verdict (Resolve in design doc / Defer to Engineer judgment / Reject with reason)
4. Edit unlocks ONLY after every challenge verdict'd
5. Implementation order (single PR scope; both emit targets land together):
   a. Generator skeleton with `parseTicketCorpus()` returning the in-memory parse result
   b. Site-content emit subroutine + `content/site-content.json` initial commit
   c. Sacred parse subroutine `parseSacredClauses()` + `docs/sacred-registry.md` initial commit (covers all currently closed-and-shipped K-tickets — expected ~5-10 source tickets contributing entries based on K-021 / K-034 / K-035 / K-040 / K-049 / K-050 history)
   d. Three-case algorithm (Add / Modify / Retire) with unit tests covering each case + each fatal-error path
   e. Pre-commit hook wire (single `--check` invocation, both targets verified)
   f. Frontend consumers (MetricsStripSection + ProjectLogicSection)
   g. CLAUDE.md doc (both emit targets in one section + `retires-sacred:` / `modifies-sacred:` frontmatter doc)
   h. E2E regex updates (site-content only — registry has no E2E surface)
6. Mid-implementation re-discovery loops back through gate (new ambiguity at line 200 = pause Edit, append to sheet, get verdict)

### Phase 5 — Code Review + QA regression

**Dispatch:** Code Reviewer (breadth `/superpowers:requesting-code-review` → depth `Agent(reviewer)`) → QA (`Agent(qa)` for E2E + edge case regression).

**QA scope (sacred-specific regression tests, in addition to site-content E2E + general regression):**
- **Drift test 1 — manual ticket Edit → registry sync:** QA edits the body of an existing Sacred clause in a closed-and-shipped K-ticket (e.g. K-035 AC-K035-REGRESSION-01) by ONE word, runs the generator, confirms `docs/sacred-registry.md` shows the new clause body verbatim AND the generator emits the unannotated-modify fatal error per AC-K052-10 (since QA's edit doesn't include a `modifies-sacred:` frontmatter declaration in any new ticket). Then QA opens a temp ticket K-XXX-test with `modifies-sacred: [AC-K035-REGRESSION-01]`, marks it closed+shipped, re-runs generator, confirms the entry's `last-modified-by` flips to K-XXX-test and the error clears. Reverts both edits after assertion.
- **Drift test 2 — retire flow:** QA opens a temp ticket K-YYY-test with `retires-sacred: [<some-active-sacred-id>]`, annotates the source ticket's clause heading with the retirement suffix, marks K-YYY-test closed+shipped, runs generator, confirms registry entry flips to `retired-by: K-YYY-test` per AC-K052-11, `originalText` field preserved, count totals shift. Reverts after assertion.
- **Pre-commit hook block test:** QA simulates the unannotated-drift case (Edit Sacred clause body, attempt commit) and confirms hook exits non-zero with the correct error message naming the offending Sacred clause ID + ticket source.
- **Cross-output isolation:** QA performs a site-content-only-affecting change (close a ticket via frontmatter `status: open` → `closed`) and confirms `--check` reports only `content/site-content.json` drift, not phantom registry drift (AC-K052-03 last clause).
- **Legacy backfill warning:** QA confirms first run on existing repo emits the migration warning listing K-022 / K-034 P2 / K-039 D-4 / K-040 retired-Sacred-without-annotation tickets (per Architect Phase 2 spec) without crashing or emitting fatal errors for those legacy retirements.

### Phase 6 — Deploy + close

**PM acceptance** (aggregation only — see `~/.claude/agents/pm.md` §External Verifier Chain):
- Pencil frame vs implementation visual parity (PM `mcp__pencil__get_screenshot` cross-check)
- Visual Spec JSON consumption verification (Architect doc cites JSON values; Engineer DOM matches; QA spec imports JSON or cites)
- Engineer-made visual change scan (any Tailwind `text-[Npx]` / px literals introduced under `visual-delta: yes`? → Designer follow-up if any)
- Deploy executed (Firebase hosting per CLAUDE.md §Deploy Checklist) + Deploy Record block written + live hosting probe (`curl <site>/about | grep -E '(\d+ \/ \d+|Documented AC Coverage)'`)
- **Sacred-registry verification (sacred output has no live deploy surface — registry is repo-only):** PM confirms `docs/sacred-registry.md` exists at HEAD on main post-merge AND is in sync with current ticket Sacred clauses (`node scripts/<generator>.mjs --check` on a fresh main checkout exits 0)
- BQ closure iteration (every BQ → RESOLVED / DEFERRED-TO-TD-XXX / OPEN; K=0 required)
- Ticket closure bookkeeping (4 steps: AC migrate to PRD §4 / `closed:` frontmatter / dashboard deregister / Deploy Record block)
- **Sacred reconcile workflow self-test:** PM uses the new registry on the very next ticket's §AC-vs-Sacred cross-check — instead of `grep -rn '## AC-.*-REGRESSION' docs/tickets/`, PM does `cat docs/sacred-registry.md | grep -E '(active|retired-by)'`. If the registry doesn't actually save grep motion (because a Sacred ID is missing or hard to find), PM files a TD ticket against K-052 schema same session.

## Phase Gate Checklist

| Gate | Required at | Evidence |
|---|---|---|
| Engineer challenge sheet resolved? ✓/N/A | Phase 4 close | Sheet appended to ticket §BQs section with each item verdict'd; ✓ if any item raised, N/A if zero items raised |
| QA Early Consultation | Phase 1 close | Real qa retro entry at `docs/retrospectives/qa.md`; this PRD §QA Challenge Rulings block populated; sacred-output adversarial cases included (heading-variant match rule, same-commit add+retire, modify-then-retire chain, unannotated-drift fatal, orphaned `retires-sacred:`, legacy backfill warning) |
| AC ↔ Sacred cross-check | Phase 2 dispatch | PM evidence line `AC vs Sacred cross-check: ✓ no conflict` (initial scan: K-039 / K-040 / K-050 Sacred clauses do not conflict with K-052 ACs; the K-021 Sacred AC-021-FOOTER was already retired by K-035 Phase 3 — K-052 does NOT re-touch it). **Special note:** K-052 itself introduces `retires-sacred:` and `modifies-sacred:` frontmatter conventions but does NOT retire or modify any existing Sacred. Generator's first run will list legacy retirements (K-022 / K-034 P2 / K-039 D-4 / K-040) as backfill warnings — those are Out-of-scope per PRD §Out-of-scope. Architect Phase 2 re-confirms before design lock. |
| Visual Spec JSON gate | Phase 3 close | `docs/designs/K-052-visual-spec.json` exists; staleness check: JSON commit ts ≥ `.pen` commit ts |
| Shared-component inventory per route | Phase 2 dispatch | `/about` and `/` already have NavBar + Footer (shared); MetricsStrip + ProjectLogicSection are page-specific; PRD enumerates these |
| Worktree isolation pre-flight | Architect dispatch | `git worktree list` shows `.claude/worktrees/K-052-content-ssot`; created off latest main after meta PR merges |
| ID reservation pre-flight | Worktree create | `git show HEAD:docs/tickets/K-052-*.md` returns this file content |
| Pre-merge close-sync scan | Each PM session Turn 1 | No drift between merged K-* commits and dashboard / ticket frontmatter `status` |
| Refactor AC grep raw-count sanity | N/A | Not a refactor ticket |
| Engineer-made visual change scan | Pre-CLOSED | Output line: `Engineer-made visual change scan: [no literals found OR literal <X> at <file:line> → follow-up K-XXX opened]` |
| Deploy evidence gate | Pre-CLOSED | `Runtime-scope triggered: YES (files: frontend/src/...)` + Deploy Record line numbers + live hosting probe with grep'd output |
| BQ closure iteration | Pre-CLOSED | `BQ closure: [N resolved] [M deferred→TD] [K=0 open]` |
| **Sacred-registry initial dump audit** (NEW for K-052) | Phase 4 close | PM personally Reads first commit of `docs/sacred-registry.md` and verifies the source-ticket grouping covers every closed-and-shipped K-ticket with `## AC-*-REGRESSION` clauses (cross-checked with `grep -lE '^## AC-.*-REGRESSION' docs/tickets/K-*.md` filtered to `status: closed` + `closed-commit:` non-empty); spot-check 3 random Sacred entries against source ticket bodies for verbatim text match |
| **Sacred-registry self-test on next ticket** (NEW for K-052) | Phase 6 close | PM uses the registry (not grep) on the very next ticket's §AC-vs-Sacred cross-check; if registry doesn't actually save the grep motion, file TD ticket against K-052 schema same session |
| **Three-case algorithm coverage** (NEW for K-052) | Phase 4 close | Generator's unit test suite covers Add / Modify / Retire happy paths + each fatal-error path (unannotated-modify-drift, unannotated-retire-drift, orphaned `retires-sacred:`, no-op `modifies-sacred:`); QA spec adds drift simulation tests per Phase 5 scope |

## Open BQs

(Populated as Phases progress. Phase 1 QA consultation typically generates the first batch.)

## Retrospective

(Populated at ticket close per `~/.claude/CLAUDE.md` §Daily Diary Style + per-role retros at `docs/retrospectives/<role>.md`.)
