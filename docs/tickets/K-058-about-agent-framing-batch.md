---
id: K-058
title: About page — "One operator, six AI agents" framing batch (role pipeline section + Where I Stepped In + role card compact redesign + processRules weight system + TicketAnatomy SSOT migration)
status: open
created: 2026-04-28
type: feat + refactor
priority: high
size: large
visual-delta: yes
content-delta: yes
design-locked: false
qa-early-consultation: pending
dependencies: [K-057]
worktree: .claude/worktrees/K-058-about-agent-framing-batch
branch: K-058-about-agent-framing-batch
base-commit: (to be filled at branch creation)
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

### Phase 1 — Designer

Designer deliverables before Architect starts:

- Update Pencil `.pen` for `/about` frame `35VCj`:
  - Add Role Pipeline section spec (static flow diagram + role table layout)
  - Add "Where I Stepped In" section spec (A+C+B layout, 3-column comparison)
  - Update Role Cards section to compact format α (reduced height, single-column)
- Export updated `frontend/design/specs/35VCj.json` + `frontend/design/screenshots/35VCj.png`
- In `35VCj.json`, mark `ticketCases[].title`, `ticketCases[].summary`, `ticketCases[].impact` text nodes as dynamic placeholder (annotate as `"dynamic": true` on the node, same pattern as numeric metric fields)
- Update `/about` design doc spec table to reflect new sections

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

**Copy-change write-back gate (K-057 2026-04-28):** if any text node visible in `specs/35VCj.json` is changed in TSX, Engineer MUST update the matching JSON text node in the same PR.

Sacred:
- K-030 `/app` isolation preserved
- K-049 `og:image` / canonical / security headers untouched
- BuiltByAIBanner retirement: 4 E2E spec files reference `data-testid="built-by-ai-banner"` (`about.spec.ts:347`, `ga-tracking.spec.ts:232`, `pages.spec.ts:353`, `ga-spa-pageview.spec.ts:114`) — update or remove these assertions in the same Engineer commit if banner is removed/replaced

E2E (new):
- `about.spec.ts`: assert role pipeline section visible + role table row count ≥ 6
- `about.spec.ts`: assert "Where I Stepped In" section visible with narrative block + comparison table
- `about.spec.ts`: assert `TicketAnatomySection` renders 3 ticket cards from SSOT (not hardcoded TSX)
- `about.spec.ts`: assert processRules rendered count = `renderSlots.about.processRules` (5)

### Phase 4 — QA + Deploy

QA: visual report + E2E full pass + Playwright screenshot comparison against updated `35VCj.png`
Deploy: Firebase Hosting only (frontend-only changes)

## Acceptance Criteria

- AC-058-ROLE-PIPELINE: `/about` contains role pipeline section with ≥6 role names (PM/Architect/Engineer/Reviewer/QA/Designer) visible (Playwright `getByText`)
- AC-058-PERIOD-STYLE: About page descriptive text uses period separators; zero `·` characters in rendered section bodies (Playwright text content scan)
- AC-058-WHERE-I: `/about` contains "Where I Stepped In" section with narrative block + 3-column comparison table visible (Playwright)
- AC-058-ROLE-CARD-HEIGHT: Role cards use compact format α; Playwright screenshot shows reduced height vs K-057 baseline
- AC-058-WEIGHT-FIX: `content/site-content.json` processRules all have `weight > 0` after generator run (`jq '.processRules[].weight' content/site-content.json | grep -v '^0$'` returns all lines)
- AC-058-TOP-N: About page renders exactly `renderSlots.about.processRules` (5) process rules sorted by descending weight (Playwright count assertion)
- AC-058-TICKET-CASES-SSOT: `TicketAnatomySection` imports from `content/ticket-cases.json`; no hardcoded array in TSX (`grep -n "const TICKETS" frontend/src/components/about/TicketAnatomySection.tsx` returns empty)
- AC-058-DESIGN-LOCKED: `design-locked: true` set in this ticket frontmatter + Phase 1 Pencil artifacts landed before Phase A PR merge

## Open BQs for Architect

- **BQ-058-01** — Role pipeline visual: (A) static TSX flex row with arrow connectors, (B) CSS grid with role name pills + role-owns tooltip on hover, (C) inline SVG flow diagram. Default: A (no additional dep, current Tailwind sufficient).
- **BQ-058-02** — "Where I Stepped In" placement on `/about`: (A) after MetricsStrip, (B) before Role Cards, (C) after Ticket Anatomy. Default: A (narrative precedes role detail).
- **BQ-058-03** — `content/ticket-cases.json` location: (A) new top-level JSON in `content/`, (B) nested inside `site-content.json` as `ticketCases[]`. Default: A (separate concern; generator-independent).

## Tech Debt Spawned (preliminary)

- TD-K058-01 (low) — processRules weight breakpoint calibration: current formula is first-pass; revisit when rule count exceeds 10.
- TD-K058-02 (low) — Role pipeline TSX hardcodes role data; future migration to `content/roles.json` → RolePipelineSection (same SSOT as README `<!-- ROLES:start -->` block).
