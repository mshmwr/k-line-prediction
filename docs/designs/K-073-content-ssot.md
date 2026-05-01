---
ticket: K-073
title: Content SSOT — externalize hardcoded arrays + README METRICS marker block
phase: 1 (Architect)
status: draft
created: 2026-05-01
visual-spec: N/A — reason: visual-delta=no; refactor only, rendered output byte-identical
---

## 0 Scope Confirmation

No scope questions raised. All four AC-073-* items have unambiguous codebase evidence:

- `pipeline.agentCount` — new leaf field; no existing path conflict.
- `homeContent.steps[]` — extracted verbatim from `ProjectLogicSection.tsx` STEPS array.
- `aboutContent.architecture[]` — extracted verbatim from `ProjectArchitectureSection.tsx` layers.
- METRICS marker — README line 3 contains first hand-written `40+` reference; insertion target per AC-073-METRICS-MARKER.

Out-of-scope items from QA Early Consultation rulings are confirmed non-overlapping with this design.

---

## 1 Options Considered

### Option A — Conservative: inline `satisfies` cast in each component, no shared type file
- **Trade-off:** `ArchLayer` and `Step` types duplicated if a third consumer appears.

### Option B — Middle ground (recommended): shared `site-content.types.ts` + `satisfies` at import site
- Single `frontend/src/content/site-content.types.ts` exports `ArchLayer`, `ArchField`, `Step`.
- Each component imports the type and uses `satisfies` immediately after the JSON import.
- **Trade-off:** one additional file; must keep in sync when JSON schema changes.

### Option C — Progressive: `json-schema-to-ts` build-time generation
- Disproportionate for three types. Overkill for K-073 scope.

**Recommendation: Option B.** Two consumers warrant a single source of truth for `ArchLayer`/`Step`.

---

## 2 New `site-content.json` Fields

### 2.1 `pipeline.agentCount`

```json
"pipeline": {
  "agentCount": 6
}
```

New top-level object. No component reads it in this ticket — SSOT reference for generator METRICS block.

### 2.2 `homeContent.steps[]`

```json
"homeContent": {
  "steps": [
    {
      "no": "01",
      "verb": "INGEST",
      "title": "Upload",
      "description": "Drop in a CSV of 24 × 1H OHLC bars. The reference sample."
    },
    {
      "no": "02",
      "verb": "MATCH",
      "title": "Scan",
      "description": "Cosine similarity walks the history database to rank windows."
    },
    {
      "no": "03",
      "verb": "PROJECT",
      "title": "Project",
      "description": "Show the price action that followed each matched window."
    }
  ]
}
```

`label` is NOT stored — reconstructed in JSX as `` `STEP ${step.no} · ${step.verb}` ``.

### 2.3 `aboutContent.architecture[]`

```json
"aboutContent": {
  "architecture": [
    {
      "no": 1,
      "category": "BACKBONE",
      "title": "Monorepo, contract-first",
      "fields": [
        { "type": "labelValue", "label": "BOUNDARY", "value": "Frontend (React/TypeScript) and backend (FastAPI/Python) live in one repo.", "valueFont": "body" },
        { "type": "labelValue", "label": "CONTRACT", "value": "Every cross-layer change starts with a written API contract mapping snake_case (backend) ↔ camelCase (frontend) — parallel agents implement against it.", "valueFont": "body" }
      ]
    },
    {
      "no": 2,
      "category": "DISCIPLINE",
      "title": "Docs-driven tickets",
      "fields": [
        { "type": "labelValue", "label": "SPEC FORMAT", "value": "Acceptance Criteria are written in Behavior-Driven Development (BDD) style — Given/When/Then/And scenarios — so every Playwright test mirrors the spec 1:1.", "valueFont": "body" },
        { "type": "labelValue", "label": "FLOW", "value": "PRD → docs/tickets/K-XXX.md → role retrospectives.", "valueFont": "mono" }
      ]
    },
    {
      "no": 3,
      "category": "ASSURANCE",
      "title": "Three-layer testing pyramid",
      "fields": [
        {
          "type": "pyramid",
          "rows": [
            { "no": "01", "layerLabel": "UNIT", "detail": "Vitest (frontend), pytest (backend)." },
            { "no": "02", "layerLabel": "INTEGRATION", "detail": "FastAPI test client." },
            { "no": "03", "layerLabel": "E2E", "detail": "Playwright, including a visual-report pipeline that renders every page to HTML for human review." }
          ]
        }
      ]
    }
  ]
}
```

### 2.4 `aboutContent.whereISteppedIn.rows[]`

JSON path: `$.aboutContent.whereISteppedIn.rows`

Add alongside `aboutContent.architecture` (same top-level object):

```json
"whereISteppedIn": {
  "rows": [
    {
      "aiDid": "Architect proposed component tree + API contract",
      "iDecided": "Approved scope, rejected over-abstraction, set sacred constraints",
      "outcome": "Each ticket ships with a verifiable artefact trail"
    },
    {
      "aiDid": "Engineer implemented + Reviewer flagged bugs",
      "iDecided": "Confirmed root cause, approved fix strategy",
      "outcome": "Zero regressions across 60+ merged PRs"
    },
    {
      "aiDid": "Designer produced Pencil spec per each visual ticket",
      "iDecided": "Selected visual direction (A/B/C options), approved design-locked gate",
      "outcome": "SSOT maintained across 3-page redesign"
    }
  ]
}
```

---

## 3 TypeScript `satisfies` Strategy

### 3.1 Shared type file: `frontend/src/content/site-content.types.ts`

```ts
export type ArchField =
  | { type: 'labelValue'; label: string; value: string; valueFont?: 'body' | 'mono' }
  | { type: 'pyramid'; rows: Array<{ no: string; layerLabel: 'UNIT' | 'INTEGRATION' | 'E2E'; detail: string }> }

export type ArchLayer = {
  no: number
  category: 'BACKBONE' | 'DISCIPLINE' | 'ASSURANCE'
  title: string
  fields: ArchField[]
}

export type Step = {
  no: string
  verb: string
  title: string
  description: string
}

export type WhereIRow = {
  aiDid: string
  iDecided: string
  outcome: string
}
```

### 3.2 Usage in `ProjectArchitectureSection.tsx`

```ts
import siteContent from '@/content/site-content.json'
import type { ArchLayer } from '../content/site-content.types'

const architectureLayers = siteContent.aboutContent.architecture satisfies ArchLayer[]
```

### 3.3 Usage in `ProjectLogicSection.tsx`

```ts
import siteContent from '@/content/site-content.json'
import type { Step } from '../content/site-content.types'

const steps = siteContent.homeContent.steps satisfies Step[]
```

**Why `satisfies` not `as`:** narrows type without silencing errors on malformed JSON. Errors at cast site if `type` field value doesn't match the union.

---

## 4 Generator Changes for AC-073-METRICS-MARKER

### 4.1 New function `renderMetricsLine(siteContent)`

```
featuresShipped = siteContent.metrics.featuresShipped.value
acCovered       = siteContent.metrics.acCoverage.covered
acTotal         = siteContent.metrics.acCoverage.total
postMortems     = siteContent.metrics.postMortemsWritten.value
lessons         = siteContent.metrics.lessonsCodified.value
return `${featuresShipped}+ tickets shipped · ${acCovered}/${acTotal} AC covered · ${postMortems} post-mortems · ${lessons} lessons codified`
```

`agentCount` is NOT included in the output line per AC-073-METRICS-MARKER format spec.

### 4.2 Marker regex

```
/<!--\s*METRICS:start\s*-->\n([\s\S]*?)\n<!--\s*METRICS:end\s*-->/
```

### 4.3 README insertion target

Replace **line 3 bold paragraph** (`**Directing a team of AI coding agents...40+ shipped tickets...**`) with:

```
<!-- DO NOT EDIT inside markers — generator overwrites. Edit content/site-content.json instead. -->
<!-- METRICS:start -->
49+ tickets shipped · 68/68 AC covered · 35 post-mortems · 206 lessons codified
<!-- METRICS:end -->
```

Lines 29 and 111 (`40+` in narrative prose) remain static — not wrapped in markers.

### 4.4 `emitReadmeMarkers` changes

- Add `metricsMarkerRe` alongside existing marker regexes
- Add missing-marker guard (exit 2)
- Add `.replace(metricsMarkerRe, ...)` in `newReadme` chain
- Update stdout summary: append `, METRICS: 1 line`
- Add drift check in `checkMode` branch (contributes to existing `return 1` path)

### 4.5 `pipeline.agentCount` fallback

```js
const agentCount = siteContent.pipeline?.agentCount ?? 6
```

Backwards compat for runs before field is added to JSON.

---

## 5 File Change List

| File | Change | Description |
|------|--------|-------------|
| `content/site-content.json` | edit | Add `pipeline`, `homeContent`, `aboutContent` top-level keys |
| `frontend/src/content/site-content.types.ts` | add | `ArchLayer`, `ArchField`, `Step` TypeScript types |
| `frontend/src/components/home/ProjectLogicSection.tsx` | edit | Replace inline `STEPS` constant with `siteContent.homeContent.steps satisfies Step[]` |
| `frontend/src/components/about/ProjectArchitectureSection.tsx` | edit | Replace hardcoded layer props with `siteContent.aboutContent.architecture satisfies ArchLayer[]` |
| `scripts/build-ticket-derived-ssot.mjs` | edit | Add `renderMetricsLine`, `metricsMarkerRe`, extend `emitReadmeMarkers`, update stdout |
| `README.md` | edit | Replace line 3 bold paragraph with `<!-- METRICS:start/end -->` marker block |
| `frontend/src/components/about/WhereISteppedInSection.tsx` | edit | Replace inline `ROWS` constant with `siteContent.aboutContent.whereISteppedIn.rows satisfies WhereIRow[]` |
| `frontend/e2e/pages.spec.ts` | edit | Add `{ exact: true }` assertions for step title ("Upload"), description, and one ROWS outcome cell |

---

## 6 Implementation Order

1. `content/site-content.json` — all downstream consumers depend on new keys
2. `frontend/src/content/site-content.types.ts` — must exist before component edits
3. `scripts/build-ticket-derived-ssot.mjs` — add generator logic before touching README
4. `README.md` — manually insert marker block; run generator; verify `METRICS: 1 line` in stdout
5. `frontend/src/components/home/ProjectLogicSection.tsx` — run `npx tsc --noEmit` after
6. `frontend/src/components/about/ProjectArchitectureSection.tsx` — run `npx tsc --noEmit` after
7. `frontend/src/components/about/WhereISteppedInSection.tsx` — run `npx tsc --noEmit` after
8. `frontend/e2e/pages.spec.ts` — add assertions; run Playwright to confirm all pass

Steps 5, 6, and 7 may be parallelized.

---

## 7 E2E Additions

Target: `frontend/e2e/pages.spec.ts`, inside or after existing `ProjectLogicSection v2` block.

```ts
test('AC-073-STEPS-ASSERTIONS: step title "Upload" visible (exact)', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Upload', { exact: true })).toBeVisible()
})

test('AC-073-STEPS-ASSERTIONS: step description for step 01 visible (exact)', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByText('Drop in a CSV of 24 × 1H OHLC bars. The reference sample.', { exact: true })
  ).toBeVisible()
})
```

If "Upload" multi-matches (unlikely on `/`), scope to `.grid` parent locator.

Existing `AC-029-ARCH-BODY-TEXT` assertions remain valid post-refactor — no spec file changes needed for them.

---

## 8 Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| `satisfies` requires TypeScript ≥ 4.9 | Run `npx tsc --noEmit` immediately after each component edit |
| `layerLabel` widened to `string` on some TS versions | `satisfies ArchLayer[]` fails at compile time — surfaces at step 5/6 of impl order |
| README marker absent when generator runs | Engineer inserts marker before first generator run; generator exits 2 with clear stderr if missing |
| "Upload" multi-match in Playwright | Add `.grid` parent locator scope if needed (one-line fix) |
| `homeContent`/`aboutContent` keys overwritten by generator | Generator merge logic preserves hand-edited fields; confirmed in generator source |

---

## 9 Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-01 | Option B (shared types file) | Two consumers warrant a single source; avoids duplicate type definitions |
| 2026-05-01 | `label` NOT stored in JSON | Ticket §Schema defines `no` + `verb` separately; reconstructed in JSX |
| 2026-05-01 | METRICS marker replaces line 3 only | Lines 29/111 are narrative prose; wrapping them adds fragility |
| 2026-05-01 | `agentCount` NOT in METRICS output line | AC-073-METRICS-MARKER format spec does not include it; field is SSOT reference |
