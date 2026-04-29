---
id: K-058
title: About page — "One operator, six AI agents" framing batch (role pipeline section + Where I Stepped In + role card compact redesign + processRules weight system + TicketAnatomy SSOT migration)
status: closed
closed-commit: 80e061a1
created: 2026-04-28
type: feat + refactor
priority: high
size: large
visual-delta: yes
content-delta: yes
design-locked: true
qa-early-consultation: docs/retrospectives/qa.md 2026-04-28 K-058 — 7 challenges raised, 5 supplemented to AC, 1 Known Gap, 1 Engineer scope add
dependencies: [K-057]
worktree: .claude/worktrees/K-058-about-agent-framing-batch
branch: K-058-about-agent-framing-batch
base-commit: 28de229
---

## Summary

Second-pass About page enhancement after K-057, targeting one strategic message: **One operator orchestrating six AI agents end-to-end**. Six confirmed items from 2026-04-28 PM discussion with user. All items share the same About-page narrative motivation and are batched to avoid 6× deploy cycles.

### Items

1. **Role pipeline section** — Add a new `<section>` to `/about` rendering the six-role pipeline (PM → Architect → Engineer → Reviewer → QA → Designer). Source content from README `## Role pipeline` (role table + flow description). Renders as visual role flow diagram + role–owns–artefact table (no mermaid; static TSX).
2. **Period-delimited sentence style** — All descriptive text on About page uses period-delimited sentences (`. ` separator), not middle-dot (`·`) or dash separators.
3. **"Where I Stepped In" section** — New `<section>` showing operator contribution in A+C+B format:
   - A: Narrative intro paragraph ("I am the single operator…")
   - C: 3-column comparison table (AI did / I decided / outcome)
   - B: Quantified outcome row (metrics/numbers)
4. **Role card compact redesign (format α)** — Replace current sparse tall role cards with compact single-column format: role name + `Owns:` line + `Artefact:` line; remove excess internal padding; reduce card height. Source data: `content/roles.json` (existing SSOT).
5. **processRules weight system (Mode A) + bug fix** — `content/site-content.json` `processRules[].weight` is currently always `0` due to generator bug (formula designed in K-052 §5.5 never executed). Fix: implement `weight = recencyScore + severityScore` in `scripts/build-ticket-derived-ssot.mjs`. About page renders `renderSlots.about.processRules` top-N rules sorted by descending weight (Mode A).
6. **TicketAnatomy SSOT migration** — `TicketAnatomySection.tsx` currently has `const TICKETS = [...]` hardcoded (K-002/K-008/K-009). Migrate to `content/ticket-cases.json`. Designer marks case study copy fields (`title`, `summary`, `impact`) as dynamic placeholders in Pencil spec (same pattern as numeric fields) — no Content-Alignment Gate phase needed.

## Phases

### Phase 0 — Content-Alignment Gate (PM + user)

Lock down all copy for new sections before Designer draws anything. Gate condition: user confirms all items below → PM sets `[GATE-PASSED]` → Designer dispatched.

**Confirmed copy (2026-04-28):**

**1. Role Pipeline section**
- Heading: `THE ROLES`
- Description: `Automatic handoffs between six AI agents. Each role owns a single responsibility and produces a verifiable artefact.`
- Table source: `content/roles.json` (verbatim — no copy changes)

**2. "Where I Stepped In" section**
- A (narrative): `I am the single operator. Every ticket is filed by me, reviewed by me, and merged by me. The agents execute; I decide.`
- C (comparison table):

  | AI did | I decided | Outcome |
  |---|---|---|
  | Architect proposed component tree + API contract | Approved scope, rejected over-abstraction, set sacred constraints | Each ticket ships with a verifiable artefact trail |
  | Engineer implemented + Reviewer flagged bugs | Confirmed root cause, approved fix strategy | Zero regressions across 60+ merged PRs |
  | Designer produced Pencil spec per each visual ticket | Selected visual direction (A/B/C options), approved design-locked gate | SSOT maintained across 3-page redesign |

- B (outcome row): `60 tickets. 100% AC coverage. Every decision logged.`

**3. Role Card copy** — `content/roles.json` `owns` + `artefact` fields confirmed final; no changes.

**Gate status:** `[GATE-PASSED 2026-04-28]`

### Phase 1 — Designer `[COMPLETE 2026-04-28]`

Actual deliverables (supersedes original spec — scope evolved during design session):

- `omyb7` (SY_RolePipelineSection): section header + description + SVG placeholder; role table REMOVED (duplicate of compact cards); pills row REMOVED (replaced by SVG approach)
- `GMEdT` (SX_WhereISteppedIn): A+C+B layout; mobile constraints annotated in JSON
- `8mqwX` (S3_RoleCardsSection): compact format α; `(compact)` label **still in Pencil heading — Architect must flag to Engineer to use correct label "THE ROLES" in TSX**
- `EBC1e` (S5_TicketAnatomySection): `dynamic: true` annotated on ticketCase title/outcome/learning nodes
- Design doc: `docs/designs/K-058-about-framing-designer.md` (SVG spec, mobile constraints, shared component constraint)
- BQ-058-01/02 resolved; BQ-058-03 open for Architect

**Key scope changes vs. original PRD:**
- Role Pipeline table removed (PM decision: duplicate of compact cards)
- Pipeline flow: inline SVG (Engineer hand-writes from Designer spec) — CSS pills rejected (cannot represent cycle + on-demand branch)
- Section order: S1 → S2 MetricsStrip → SX WhereISteppedIn → SY RolePipeline → S3 RoleCards(compact) → S4 → S5 → S6

### Phase 2 — Architect

- Read Phase 1 design artifacts (`specs/35VCj.json` + `screenshots/35VCj.png`) before any decision
- Design component tree:
  - `RolePipelineSection.tsx` — role flow diagram + table
  - `WhereISteppedInSection.tsx` — A+C+B layout (sub-components: `OperatorNarrativeBlock`, `ComparisonTable`, `OutcomeMetricsRow`)
- Define `content/ticket-cases.json` schema:
  ```json
  {
    "ticketCases": [
      { "id": "K-002", "title": "...", "summary": "...", "impact": "...", "phase": "..." }
    ]
  }
  ```
- Design processRules weight formula for `scripts/build-ticket-derived-ssot.mjs`:
  - `recencyScore`: rules added after K-040 = +2, after K-020 = +1, else 0
  - `severityScore`: `severity: "critical-blocker"` = +3, `"warning"` = +1, `"advisory"` = 0
  - `weight = recencyScore + severityScore`
- Write architecture doc `docs/designs/K-058-about-framing-arch.md`

### Phase 3 — Engineer

Source targets:
- `frontend/src/components/about/RoleCardsSection.tsx` — compact format α
- `frontend/src/components/about/RolePipelineSection.tsx` — new file
- `frontend/src/components/about/WhereISteppedInSection.tsx` — new file
- `frontend/src/components/about/TicketAnatomySection.tsx` — migrate hardcoded array → import from `content/ticket-cases.json`
- `content/ticket-cases.json` — new SSOT file (3 initial entries: K-002, K-008, K-009)
- `scripts/build-ticket-derived-ssot.mjs` — implement weight formula
- `frontend/src/pages/AboutPage.tsx` — wire new sections in design-spec order

**Shared component constraint (2026-04-28):** All new cards in RolePipelineSection and WhereISteppedInSection MUST use `CardShell` (`frontend/src/components/primitives/CardShell.tsx`) + `FileNoBar` (`frontend/src/components/about/FileNoBar.tsx`). No inline card JSX permitted. Grid layout uses inline Tailwind class (no shared grid wrapper — consistent with existing sections).

**Mobile UX spec (2026-04-28, PM-approved):**
- "Where I Stepped In" comparison table: `grid-cols-1 md:grid-cols-3` — each row stacks as a CardShell card on mobile, columns collapse to label+text pairs
- Role Pipeline flow diagram: **inline SVG in TSX** (Engineer implements from Designer SVG spec in design doc) — SVG scales via `viewBox`, mobile uses `width: 100%`
- Role Pipeline roles table: **REMOVED** — duplicate of compact RoleCards below. Role Pipeline section contains ONLY the flow diagram SVG + section header + description text.
- Role Pipeline roles view (compact cards below): `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` — reuse compact RoleCard

**Pipeline flow diagram spec (2026-04-28):**
- Implementation: inline `<svg>` in `RolePipelineSection.tsx` — Engineer hand-writes SVG from Designer spec
- Content: main loop (PM → Architect → Engineer → Reviewer → QA → PM cycle) + on-demand branch (Designer, dispatched by PM, feeds back to Architect)
- Source of truth: `docs/designs/K-058-about-framing-designer.md` §SVG Flow Diagram Spec
- Pills/CSS approach: REJECTED (cannot represent cyclic + on-demand branch in static Tailwind without JS)

**Copy-change write-back gate (K-057 2026-04-28):** if any text node visible in `specs/35VCj.json` is changed in TSX, Engineer MUST update the matching JSON text node in the same PR.

Sacred:
- K-030 `/app` isolation preserved
- K-049 `og:image` / canonical / security headers untouched
- BuiltByAIBanner retirement: 4 E2E spec files reference `data-testid="built-by-ai-banner"` (`about.spec.ts:347`, `ga-tracking.spec.ts:232`, `pages.spec.ts:353`, `ga-spa-pageview.spec.ts:114`) — update or remove these assertions in the same Engineer commit if banner is removed/replaced

E2E (new):
- `about.spec.ts`: assert role pipeline section visible + ≥6 role name SVG text nodes present (`getByText` each of PM/Architect/Engineer/Reviewer/QA/Designer)
- `about.spec.ts`: assert "Where I Stepped In" section visible with narrative block + comparison table
- `about.spec.ts`: assert `TicketAnatomySection` renders 3 ticket cards from SSOT (not hardcoded TSX)
- `about.spec.ts`: assert processRules rendered count = `renderSlots.about.processRules` (5)
- `about.spec.ts` / `about-layout.spec.ts`: update ALL existing Nº-label assertions + SECTION_IDS array to reflect new section order (C-1 ruling)
- `docs/qa/known-reds.md`: update T14 manifest entry — failure reason changes from "empty array" to "wrong expected list" after new section IDs added (C-7 ruling; T14 fix deferred)

**Weight formula floor (C-5 ruling):** `weight = max(1, recencyScore + severityScore)` — ensures all processRules have weight ≥ 1 regardless of age/severity combination. Update formula in `scripts/build-ticket-derived-ssot.mjs`.

### Phase 4 — QA + Deploy

QA: visual report + E2E full pass + Playwright screenshot comparison against updated `35VCj.png`
Deploy: Firebase Hosting only (frontend-only changes)

## Acceptance Criteria

- AC-058-ROLE-PIPELINE: `/about` contains role pipeline section with ≥6 role names (PM/Architect/Engineer/Reviewer/QA/Designer) visible (Playwright `getByText` on SVG `<text>` nodes)
- AC-058-PERIOD-STYLE: About page descriptive text uses period separators; zero `·` characters within `[data-section="where-i-stepped-in"] p, [data-section="role-pipeline"] p` (Playwright scoped text scan); `[data-testid="file-no-bar"]` explicitly exempted from scan
- AC-058-WHERE-I: `/about` contains "Where I Stepped In" section with narrative block + 3-column comparison table visible (Playwright)
- AC-058-ROLE-CARD-HEIGHT: each role card `offsetHeight < 320` (K-057 fixed baseline) at 1280px viewport, verified by Playwright `evaluate` on `[data-role]` container
- AC-058-WEIGHT-FIX: `content/site-content.json` processRules all have `weight ≥ 1` after generator run (formula: `max(1, recencyScore + severityScore)`); `jq '.processRules[].weight' content/site-content.json | grep -v '^0$'` returns all lines
- AC-058-TOP-N: About page renders exactly `renderSlots.about.processRules` (5) process rules sorted by descending weight (Playwright count assertion)
- AC-058-TICKET-CASES-SSOT: `TicketAnatomySection` imports from `content/ticket-cases.json`; no hardcoded array in TSX (`grep -n "const TICKETS" frontend/src/components/about/TicketAnatomySection.tsx` returns empty)
- AC-058-TICKET-CASES-GITHUB-LINKS: after SSOT migration, each of the 3 ticket card `<a>` hrefs matches the known-good GitHub URL for K-002/K-008/K-009 verbatim (Playwright `toHaveAttribute`)
- AC-058-SECTION-LABELS-UPDATED: all existing Nº-label assertions in `about-layout.spec.ts` T9, `about-v2.spec.ts`, and `about.spec.ts` updated to reflect new section order; no pre-K-058 green test becomes red from label-number renumbering alone
- AC-058-DESIGN-LOCKED: `design-locked: true` set in this ticket frontmatter + Phase 1 Pencil artifacts landed before Phase A PR merge

**Known Gaps:**
- KG-058-01 (SVG mobile legibility): SVG role pipeline diagram legibility at narrow viewports (≤375px) not tested; `getByText` verifies node presence but not visual non-overlap; deferred — visual-only concern at this scale.

## Open BQs for Architect

- **BQ-058-01** — ~~Role pipeline visual~~ **RESOLVED (Phase 1):** Option A — static TSX flex row with arrow connectors (`flex flex-wrap justify-center`, `→` inline). Implemented in Pencil spec `omyb7`.
- **BQ-058-02** — ~~"Where I Stepped In" placement~~ **RESOLVED (Phase 1):** Option A — after MetricsStrip, before Role Pipeline. Confirmed in Pencil section order (y-coordinate validated).
- **BQ-058-03** — `content/ticket-cases.json` location: (A) new top-level JSON in `content/`, (B) nested inside `site-content.json` as `ticketCases[]`. Default: A (separate concern; generator-independent). **Open for Architect.**

## Tech Debt Spawned (preliminary)

- TD-K058-01 (low) — processRules weight breakpoint calibration: current formula is first-pass; revisit when rule count exceeds 10.
- TD-K058-02 (low) — Role pipeline TSX hardcodes role data; future migration to `content/roles.json` → RolePipelineSection (same SSOT as README `<!-- ROLES:start -->` block).
