---
title: K-058 Phase 2 — /about "One operator, six AI agents" framing (Architect)
ticket: docs/tickets/K-058-about-agent-framing-batch.md
phase: 2
author: Architect
updated: 2026-04-28
status: ready-for-engineer
designer-spec: docs/designs/K-058-about-framing-designer.md
visual-spec-root: frontend/design/specs/about-v2*.json
---

## 0 Scope Questions

None. All BQs resolved: BQ-058-01 and BQ-058-02 resolved in Phase 1. BQ-058-03 resolved in this doc §2.

---

## 1 BQ-058-03 Ruling — ticket-cases.json location

**Question:** Should `content/ticket-cases.json` be (A) a new top-level JSON in `content/`, or (B) a nested array inside `content/site-content.json`?

**Ruling: Option A — separate file.**

Rationale:
- `site-content.json` is the hand-edit SSOT for metrics/stack/processRules/renderSlots; it is also generator-read by `scripts/build-ticket-derived-ssot.mjs` during every regen cycle. Ticket case studies are editorially distinct (narrative, not metrics); embedding them adds non-generator-managed content to a generator-owned file, creating a mutation-conflict risk.
- `content/roles.json` precedent: domain-specific content lives in a dedicated file imported directly by its consumer component (`RoleCardsSection.tsx`). ticket-cases.json follows the same pattern.
- The generator does NOT need to read or write ticket-cases.json; it has no corpus-derived fields. Separation eliminates any accidental overwrite on `node scripts/build-ticket-derived-ssot.mjs` runs.
- File `content/site-content.json` structure read and verified: its array patterns (`processRules[]`, `stack[]`) are all generator-managed; adding a non-generated array would create a mixed-ownership section with no precedent.

**Decision recorded:** `content/ticket-cases.json` is a new top-level file in `content/`. `TicketAnatomySection.tsx` imports it directly. The generator is NOT modified to touch this file.

---

## 2 Component Tree

### New files

```
frontend/src/components/about/
  WhereISteppedInSection.tsx   [NEW]
  RolePipelineSection.tsx      [NEW]
```

### Modified files

```
frontend/src/components/about/
  RoleCardsSection.tsx         [MODIFIED — compact format alpha]
  TicketAnatomySection.tsx     [MODIFIED — SSOT migration]

frontend/src/pages/
  AboutPage.tsx                [MODIFIED — section order + new imports]

content/
  ticket-cases.json            [NEW — SSOT for TicketAnatomySection]

scripts/
  build-ticket-derived-ssot.mjs  [MODIFIED — weight formula implementation]
```

### Component tree (1-level deep)

```
AboutPage
  UnifiedNavBar
  <section id="header">    PageHeaderSection
  <section id="metrics">   MetricsStripSection
  <section id="where-i-stepped-in">   WhereISteppedInSection  [NEW]
  <section id="role-pipeline">         RolePipelineSection      [NEW]
  <section id="roles">     RoleCardsSection  [compact alpha]
  <section id="pillars">   ReliabilityPillarsSection
  <section id="tickets">   TicketAnatomySection  [SSOT migrated]
  <section id="architecture">  ProjectArchitectureSection
  Footer
  FooterDisclaimer
```

---

## 3 Props Interfaces

### 3.1 WhereISteppedInSection

```typescript
// No props — all data is hardcoded copy confirmed in Phase 0 Content-Alignment Gate.
// (Pencil frame GMEdT: wsNarrative + wsRows + wsBBlock are static editorial content,
//  not data-driven from an external SSOT.)
interface WhereISteppedInSectionProps {}
```

Internal structure:
- Section header row (label + divider line) — matches `SectionLabelRow` pattern but uses
  Pencil-specified label `Nº 02.5 — WHERE I STEPPED IN` (not a separate SectionLabelRow
  call; label is rendered inline at the `<section>` level via the AboutPage SectionLabelRow
  wrapper, consistent with all other sections)
- Narrative `<p>` block (A block)
- Comparison table container `<div data-section="where-i-stepped-in">` with:
  - Header row: "AI DID" / "I DECIDED" / "OUTCOME"
  - 3 data rows, each a `<div>` with `grid-cols-1 md:grid-cols-3`
  - Mobile: each row wraps in `CardShell` + `FileNoBar`
- Outcome row `<div>` (B block) — dark background, bold metric copy

**Shared primitives used:** `CardShell`, `FileNoBar`

**data-testid / data-section attributes:**
- Outer `<section>` element: `data-section="where-i-stepped-in"`
- Narrative `<p>`: `data-testid="where-i-narrative"`
- Comparison table container: `data-testid="where-i-table"`
- Outcome row: `data-testid="where-i-outcome"`

**Sub-component decision — OperatorNarrativeBlock / ComparisonTable / OutcomeMetricsRow:**
Rule: inline, not separate files.

Justification: All three blocks are used exclusively inside `WhereISteppedInSection.tsx` (no cross-component reuse path exists; no other page or section renders these blocks). Extracting them to separate files adds 3 import targets with zero reuse benefit, increasing directory noise. The section is small enough (< 80 lines) that single-responsibility is preserved inline. If reuse emerges post-K-058, extraction is a 1-file-to-3-files refactor with no external contract change (Replacement Cost check: affects 1 file → acceptable).

---

### 3.2 RolePipelineSection

```typescript
// No props — section header, description, and SVG are fully static.
// Roles displayed in SVG come from Designer spec coordinates, not from roles.json.
// (TD-K058-02 deferred: future migration of SVG role labels to roles.json SSOT)
interface RolePipelineSectionProps {}
```

Internal structure:
- Section header row: label `Nº 03 — THE ROLES`, divider line
- Description `<p>`: Pencil `rpDesc` node verbatim
- Inline `<svg>` block: viewBox `0 0 900 200`, `width="100%"`, `height="auto"`
  - Full SVG element order per `docs/designs/K-058-about-framing-designer.md §SVG Flow Diagram Spec`

**Shared primitives used:** None (SVG does not wrap in CardShell; no card pattern here)

**data-testid / data-section attributes:**
- Outer `<section>` element: `data-section="role-pipeline"`
- `<svg>` element: `data-testid="role-pipeline-svg"`
- Each role `<text>` node: identified by text content (used by AC-058-ROLE-PIPELINE Playwright `getByText`)

---

### 3.3 RoleCardsSection (modified)

```typescript
// Existing interface — no props change.
// Compact format alpha: section label updated to "THE ROLES",
// intro text updated to Pencil s3Intro compact variant,
// card height: fit_content (padding 12px, gap 8px).
interface RoleCardsSectionProps {}
```

**NOTE for Engineer:** The Pencil spec `8mqwX` heading reads `Nº 04 — THE ROLES (compact)` — this is a Pencil-internal annotation. The TSX section label MUST render as `THE ROLES` only (no `(compact)` suffix). This is confirmed by Phase 1 Designer spec note in ticket Phase 1 deliverables.

**data-section:** existing `<section id="roles">` — no change to id; update `SectionLabelRow` label to reflect new Nº (see §5 section order).

---

### 3.4 TicketAnatomySection (modified)

```typescript
// No external props.
// Internal TICKETS const removed; replaced by JSON import.
import ticketCases from '../../../content/ticket-cases.json'
```

**Refactor AC grep sanity (AC-058-TICKET-CASES-SSOT):**
- Pattern: `grep -n "const TICKETS" frontend/src/components/about/TicketAnatomySection.tsx`
- Pre-count (baseline HEAD): 1 (line 18 confirmed by Read)
- Post-target: 0
- Valid: true

---

## 4 `content/ticket-cases.json` Schema

Full schema with all 3 entries populated from existing hardcoded data in `TicketAnatomySection.tsx`:

```json
{
  "ticketCases": [
    {
      "id": "K-002",
      "title": "UI optimization",
      "summary": "Large-scale UI refactor surfaced a systematic And-clause omission — the SectionHeader icon And-clause was silently skipped by Engineer, Architect review, and QA before Code Review caught it.",
      "impact": "The incident directly catalyzed the per-role retrospective log mechanism: one structural gap, three roles, one process improvement.",
      "phase": "K-002",
      "githubUrl": "https://github.com/mshmwr/k-line-prediction/blob/main/docs/tickets/K-002-ui-optimization.md"
    },
    {
      "id": "K-008",
      "title": "Visual report script",
      "summary": "Automated the visual screenshot pipeline (Playwright → HTML report). Bug Found Protocol triggered three times: module-level side effects, mutable accumulator state, and path traversal via env var.",
      "impact": "Demonstrates the four-step Bug Found Protocol: reflect → PM confirms quality → write memory → release fix.",
      "phase": "K-008",
      "githubUrl": "https://github.com/mshmwr/k-line-prediction/blob/main/docs/tickets/K-008-visual-report.md"
    },
    {
      "id": "K-009",
      "title": "1H MA history fix",
      "summary": "1H predictions silently fell back to 1D MA history, producing incorrect similarity matches. Fixed via test-driven approach: failing test first, production fix second.",
      "impact": "Demonstrates test-driven discipline: monkeypatch the internal call, write the failing assertion, confirm it fails, then fix implementation.",
      "phase": "K-009",
      "githubUrl": "https://github.com/mshmwr/k-line-prediction/blob/main/docs/tickets/K-009-1h-ma-history-fix.md"
    }
  ]
}
```

**Field mapping (TicketAnatomySection.tsx → ticket-cases.json):**

| Old TSX field | JSON field | Notes |
|---|---|---|
| `id` | `id` | same |
| `title` | `title` | same |
| `outcome` | `summary` | renamed; Designer spec `EBC1e` uses `dynamic: true` on outcome node |
| `learning` | `impact` | renamed; Designer spec `EBC1e` uses `dynamic: true` on learning node |
| `githubHref` (computed) | `githubUrl` (verbatim) | AC-058-TICKET-CASES-GITHUB-LINKS requires verbatim URL; no formula derivation |

**AC-058-TICKET-CASES-GITHUB-LINKS compliance:** All 3 `githubUrl` values are verbatim from `TicketAnatomySection.tsx` `GITHUB_BASE` constant + suffix. URLs confirmed by Read at line 28, 39, 50:
- K-002: `https://github.com/mshmwr/k-line-prediction/blob/main/docs/tickets/K-002-ui-optimization.md`
- K-008: `https://github.com/mshmwr/k-line-prediction/blob/main/docs/tickets/K-008-visual-report.md`
- K-009: `https://github.com/mshmwr/k-line-prediction/blob/main/docs/tickets/K-009-1h-ma-history-fix.md`

**`TicketAnatomyCard` field rename contract:** The TSX card component currently receives `outcome` and `learning` props. After SSOT migration, these props will be populated from `summary` and `impact` fields respectively. Engineer must either: (a) keep `TicketAnatomyCard` props as `outcome`/`learning` and map at the `TicketAnatomySection` call site, or (b) rename card props to `summary`/`impact`. Option (a) preferred — card props are an internal interface; preserving existing prop names avoids modifying `TicketAnatomyCard.tsx`.

---

## 5 Section Order + data-section Attributes

New render order in `AboutPage.tsx`:

| Nº | Section | `id` attr | `data-section` attr | SectionLabelRow label |
|----|---------|-----------|---------------------|-----------------------|
| — | PageHeaderSection | `header` | — | (no label row — hero above-fold) |
| 01 | MetricsStripSection | `metrics` | — | `Nº 01 — DELIVERY METRICS` |
| 02.5 | WhereISteppedInSection | `where-i-stepped-in` | `where-i-stepped-in` | `Nº 02.5 — WHERE I STEPPED IN` |
| 03 | RolePipelineSection | `role-pipeline` | `role-pipeline` | `Nº 03 — THE ROLES` |
| 04 | RoleCardsSection | `roles` | — | `Nº 04 — THE ROLES` |
| 05 | ReliabilityPillarsSection | `pillars` | — | `Nº 05 — RELIABILITY` |
| 06 | TicketAnatomySection | `tickets` | — | `Nº 06 — ANATOMY OF A TICKET` |
| 07 | ProjectArchitectureSection | `architecture` | — | `Nº 07 — PROJECT ARCHITECTURE` |

**Important:** `data-section` attribute is required only on the sections scoped by AC-058-PERIOD-STYLE (`[data-section="where-i-stepped-in"] p` and `[data-section="role-pipeline"] p`). Other sections do not require `data-section` unless they scope an existing AC.

**Nº renumbering impact:** All existing Nº-label assertions in `about-layout.spec.ts` T9, `about-v2.spec.ts`, and `about.spec.ts` MUST be updated (AC-058-SECTION-LABELS-UPDATED). Current baselines:
- `Nº 02 — THE ROLES` → becomes `Nº 04 — THE ROLES`
- `Nº 03 — RELIABILITY` → becomes `Nº 05 — RELIABILITY`
- `Nº 04 — ANATOMY OF A TICKET` → becomes `Nº 06 — ANATOMY OF A TICKET`
- `Nº 05 — PROJECT ARCHITECTURE` → becomes `Nº 07 — PROJECT ARCHITECTURE`

**Sacred constraint — K-031 `#architecture.nextElementSibling === <footer>`:** `ProjectArchitectureSection` MUST remain the last `<section>` before `<Footer />`. The new sections are inserted between MetricsStrip and RoleCards — no change to footer adjacency.

---

## 6 processRules Weight Formula

### 6.1 Formula

```javascript
// Insert after the processRules array is read from existingSiteContent,
// BEFORE building the output object in buildSiteContentJson().
// Location: scripts/build-ticket-derived-ssot.mjs, inside buildSiteContentJson()
// — after line: const preserved = existingSiteContent || {}

const processedRules = (preserved.processRules || []).map(rule => {
  // recencyScore: based on the ticket ID in addedAfter field
  const addedAfter = rule.addedAfter || ''
  const ticketNumMatch = addedAfter.match(/K-(\d+)/)
  const ticketNum = ticketNumMatch ? parseInt(ticketNumMatch[1], 10) : 0
  const recencyScore = ticketNum > 40 ? 2 : ticketNum > 20 ? 1 : 0

  // severityScore
  const severityScore =
    rule.severity === 'critical-blocker' ? 3 :
    rule.severity === 'warning' ? 1 :
    0  // 'advisory' or missing

  // floor of 1 (QA C-5 ruling)
  const weight = Math.max(1, recencyScore + severityScore)

  return { ...rule, weight }
})
```

Then replace `processRules: preserved.processRules || [],` with `processRules: processedRules,` in the `output` object.

### 6.2 Formula verification (existing processRules in site-content.json)

| Rule ID | addedAfter | ticketNum | recencyScore | severity | severityScore | weight (formula) | weight (current) |
|---------|-----------|-----------|-------------|----------|--------------|-----------------|-----------------|
| bug-found-protocol | K-008 | 8 | 0 | critical-blocker | 3 | max(1, 0+3)=3 | 0 |
| content-alignment-gate | null | 0 | 0 | advisory | 0 | max(1, 0+0)=1 | 0 |
| deploy-rebase-then-ff-merge | null | 0 | 0 | advisory | 0 | max(1, 0+0)=1 | 0 |
| pencil-as-design-source-of-truth | null | 0 | 0 | warning | 1 | max(1, 0+1)=1 | 0 |
| locked-marker-block | K-039 | 39 | 1 | advisory | 0 | max(1, 1+0)=1 | 0 |

All 5 rules post-formula have weight >= 1. AC-058-WEIGHT-FIX satisfied.

### 6.3 Insertion point in build-ticket-derived-ssot.mjs

Insert processedRules computation at line 359, immediately after:
```javascript
const preserved = existingSiteContent || {}
```
Replace the output object's `processRules: preserved.processRules || [],` line (currently line 383) with:
```javascript
processRules: processedRules,
```

---

## 7 Shared Component Constraint

Per Phase 3 ticket constraint (2026-04-28, PM-approved):

- All new cards in `WhereISteppedInSection` and `RolePipelineSection` MUST use `CardShell` (`frontend/src/components/primitives/CardShell.tsx`) + `FileNoBar` (`frontend/src/components/about/FileNoBar.tsx`)
- No inline card JSX (no ad-hoc `div` with manually duplicated border/padding/radius styles)
- `CardShell` props: `padding="md"` (default), `borderColorClass="border-ink/20"` (default); override only if Pencil spec requires different token
- `FileNoBar` props: `fileNo` (required integer), `label` (required string matching Pencil `FILE Nº 0N · LABEL` pattern), `cardPaddingSize="md"` (must match CardShell padding prop)

**Applicability to WhereISteppedInSection:**
- Mobile rows of the comparison table use CardShell + FileNoBar
- Desktop view uses the table grid directly (no CardShell wrapper per Pencil `UFPld` frame which uses native border/cornerRadius)

**Applicability to RolePipelineSection:**
- RolePipelineSection has NO card pattern — it renders a section header + description + SVG only. CardShell constraint does NOT apply to this section.

---

## 8 AC Coverage Table

| AC ID | Implementing file(s) | Playwright selector / verification |
|-------|---------------------|-------------------------------------|
| AC-058-ROLE-PIPELINE | `RolePipelineSection.tsx` | `getByText('PM')`, `getByText('Architect')`, etc. on `[data-section="role-pipeline"]`; `data-testid="role-pipeline-svg"` visible |
| AC-058-PERIOD-STYLE | `WhereISteppedInSection.tsx`, `RolePipelineSection.tsx` | Scoped text scan `[data-section="where-i-stepped-in"] p` + `[data-section="role-pipeline"] p`; zero `·` chars; `[data-testid="file-no-bar"]` explicitly exempted |
| AC-058-WHERE-I | `WhereISteppedInSection.tsx` | `data-testid="where-i-narrative"` visible; `data-testid="where-i-table"` visible with 3 rows |
| AC-058-ROLE-CARD-HEIGHT | `RoleCardsSection.tsx` + `RoleCard.tsx` | `evaluate('[data-role]', el => el.offsetHeight < 320)` at 1280px viewport |
| AC-058-WEIGHT-FIX | `scripts/build-ticket-derived-ssot.mjs` + `content/site-content.json` | `jq '.processRules[].weight' content/site-content.json | grep -v '^0$'` returns all lines |
| AC-058-TOP-N | `AboutPage.tsx` (passes `renderSlots.about.processRules=5` to ReliabilityPillarsSection or equivalent) | Playwright count assertion: rendered processRules count = 5 |
| AC-058-TICKET-CASES-SSOT | `TicketAnatomySection.tsx` + `content/ticket-cases.json` | `grep -n "const TICKETS"` returns empty; import statement present |
| AC-058-TICKET-CASES-GITHUB-LINKS | `TicketAnatomySection.tsx` (rendered from JSON) | `page.locator('a[href="https://...K-002..."]').toHaveAttribute('href', ...)` × 3 |
| AC-058-SECTION-LABELS-UPDATED | `AboutPage.tsx` + `about-layout.spec.ts` + `about.spec.ts` | No pre-K-058 green test becomes red from renumbering alone |
| AC-058-DESIGN-LOCKED | Ticket frontmatter | `design-locked: true` already set in ticket frontmatter |

---

## 9 Boundary Pre-emption

| Boundary scenario | Behavior defined |
|---|---|
| `content/ticket-cases.json` missing or malformed | TypeScript import will throw at build time — no runtime fallback needed; build gate prevents deploy |
| `ticketCases[]` empty array | `TicketAnatomySection` renders empty grid (0 cards) — AC-058-TICKET-CASES-SSOT does not mandate non-empty; acceptable empty state |
| processRules `addedAfter` is null or non-K-XXX string | Formula handles: `ticketNum` defaults to 0 → recencyScore=0; weight=max(1, severityScore); minimum 1 |
| processRules `severity` field missing | `severityScore` defaults to 0 via final `0` fallback; weight=max(1, 0)=1 |
| SVG viewBox at ≤375px viewport | KG-058-01 Known Gap — SVG scales via `width:100%` so node presence is preserved; visual overlap not tested |
| Comparison table at mobile with CardShell | Grid collapses correctly via Tailwind `grid-cols-1 md:grid-cols-3` |
| `githubUrl` field missing in a ticket-cases entry | `TicketAnatomyCard` receives undefined href → `<a href={undefined}>` renders without href attribute; Playwright `toHaveAttribute` test would fail → caught by AC-058-TICKET-CASES-GITHUB-LINKS |

---

## 10 Refactorability Checklist

- [x] **Single responsibility**: each component does exactly one thing — WhereISteppedIn owns only the A+C+B narrative; RolePipeline owns only the SVG flow; TicketAnatomy owns only the case study grid
- [x] **Interface minimization**: all new components have zero external props (content is static copy or JSON import); CardShell and FileNoBar props unchanged
- [x] **Unidirectional dependency**: data flows top-down (JSON → component → render); no circular dependencies
- [x] **Replacement cost**: ticket-cases.json swap requires modifying only `TicketAnatomySection.tsx` (1 file) — acceptable
- [x] **Clear test entry point**: each component's data-testid + data-section attributes give QA clean selectors without reading internals
- [x] **Change isolation**: UI changes to WhereISteppedIn / RolePipeline do not affect API contract; SVG changes are self-contained

---

## 11 All-Phase Coverage Gate

| Phase | Backend API | Frontend Routes | Component Tree | Props Interface |
|-------|------------|----------------|----------------|----------------|
| Phase 2 (Architect) | N/A — frontend-only ticket | N/A — /about route unchanged | ✅ | ✅ |

---

## 12 Implementation Order

1. **`content/ticket-cases.json`** — create new file (no dependencies)
2. **`scripts/build-ticket-derived-ssot.mjs`** — add processedRules formula + replace output field; run `node scripts/build-ticket-derived-ssot.mjs` to regenerate `content/site-content.json`; verify AC-058-WEIGHT-FIX
3. **`WhereISteppedInSection.tsx`** — new file; depends on CardShell + FileNoBar (existing)
4. **`RolePipelineSection.tsx`** — new file; self-contained SVG; no external dependencies
5. **`RoleCardsSection.tsx`** — compact format alpha update; depends on RoleCard.tsx (existing)
6. **`TicketAnatomySection.tsx`** — migrate TICKETS → JSON import; depends on ticket-cases.json (step 1)
7. **`AboutPage.tsx`** — wire all new sections in order; update SectionLabelRow labels + section ids; add new imports
8. **E2E updates** — update `about.spec.ts`, `about-layout.spec.ts`, `about-v2.spec.ts` Nº-label assertions + SECTION_IDS array; add new section assertions

Steps 1–6 can be parallelized. Step 7 depends on steps 3–6. Step 8 depends on step 7.

---

## 13 Risks and Notes

- **`(compact)` label in Pencil spec:** Pencil frame `8mqwX` heading is `Nº 04 — THE ROLES (compact)` — this is a Pencil-internal annotation; TSX MUST render `THE ROLES` only (no `(compact)` suffix). Engineer must not copy the Pencil heading verbatim.
- **SectionLabelRow re-use:** `WhereISteppedInSection` and `RolePipelineSection` do NOT call `SectionLabelRow` internally — section labels are provided by `AboutPage.tsx` (consistent with all other sections). Each section component receives its label via the surrounding `<section>` block in `AboutPage.tsx`.
- **SVG role name text nodes:** AC-058-ROLE-PIPELINE uses Playwright `getByText` on SVG `<text>` nodes. All 6 role names (PM / Architect / Engineer / Reviewer / QA / Designer) must appear as SVG `<text>` nodes with text content matching exactly, per Designer spec labels table.
- **K-031 Sacred preservation:** `ProjectArchitectureSection` must remain last `<section>` before `<Footer />`. The `#architecture.nextElementSibling === <footer>` invariant is satisfied as long as new sections are inserted before `architecture` (confirmed by new order in §5).
- **`data-testid="file-no-bar"` exemption:** AC-058-PERIOD-STYLE explicitly exempts `[data-testid="file-no-bar"]` from the period-separator scan. Engineer must ensure `FileNoBar` usage in new sections preserves the `data-testid="file-no-bar"` attribute (it does — per `FileNoBar.tsx` line 34).
- **BuiltByAIBanner:** Ticket Phase 3 notes that `data-testid="built-by-ai-banner"` is referenced in 4 E2E spec files. If Engineer removes/replaces the banner, those assertions must be updated in the same commit.

---

## Retrospective

**Where most time was spent:** Reading the processRules formula insertion point — needed to trace exactly where `preserved.processRules` is read and where the output object is built in `buildSiteContentJson()` to give Engineer a precise insertion instruction rather than a vague "add formula somewhere."

**Which decisions needed revision:** None — BQ-058-03 ruling was straightforward once site-content.json structure was verified against the generator's preservation logic.

**Next time improvement:** When a phase involves a script modification alongside frontend components, read the full relevant function in the script (not just the first 100 lines) upfront, so the insertion-point instruction can be included in the initial design doc pass without a second read cycle.

---

## Consolidated Delivery Gate

```
Architect delivery gate:
  all-phase-coverage=✓,
  pencil-frame-completeness=✓ (4 frames: GMEdT/omyb7/8mqwX/EBC1e verified),
  visual-spec-json-consumption=fresh (GMEdT/omyb7/8mqwX read this session),
  sacred-ac-cross-check=✓ (K-031 Sacred preserved — architecture remains last section before footer),
  route-impact-table=N/A — ticket scoped to /about page only; no global CSS / sitewide token change,
  cross-page-duplicate-audit=✓ (WhereISteppedInSection and RolePipelineSection are /about-only; no cross-page pattern grep required),
  target-route-consumer-scan=N/A — ticket does not change route navigation behavior,
  architecture-doc-sync=✓ (ssot/system-overview.md update required — see §14),
  self-diff=✓ (new file; no prior version to diff against),
  output-language=✓
  → OK
```

---

## 14 ssot/system-overview.md Sync Note

After Engineer completes Phase 3, `ssot/system-overview.md` must be updated to reflect:
- New components: `WhereISteppedInSection`, `RolePipelineSection` added to About page component list
- New content file: `content/ticket-cases.json` added to content SSOT inventory
- Script modification: `build-ticket-derived-ssot.mjs` now computes weight formula
- Section order change on /about route
