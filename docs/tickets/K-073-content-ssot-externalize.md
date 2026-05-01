---
id: K-073
title: Content SSOT — externalize hardcoded arrays + README metrics marker block
status: open
created: 2026-05-01
type: refactor
priority: medium
size: medium
visual-delta: no
content-delta: no
design-locked: false
qa-early-consultation: docs/retrospectives/qa.md 2026-05-01 K-073
dependencies: []
worktree: .claude/worktrees/K-073-content-ssot-externalize
branch: K-073-content-ssot-externalize
base-commit: cc35581
---

## Summary

Audit of three pages (About, Homepage, README) found hardcoded content that should live in `content/site-content.json` for cross-page sync and single-source maintainability. This ticket externalizes the safe-to-serialize items and adds a README METRICS marker block so key numbers stop drifting from `metrics.*` values.

**Out of scope (QA Early Consultation rulings):**
- `PageHeaderSection` subtitle — static role-name list, not a number; Sacred exact-text (AC-017-HEADER)
- `BuiltByAIBanner` text — marketing copy tied to Pencil SSOT; Sacred exact-text assertions
- `WhereISteppedInSection.PIPELINE_DEPTH` — K-066 AC-066-SSOT mandates module-level constant; defer to K-066 close
- `ReliabilityPillarsSection` body — `ReactNode` / `<code>` inline markup; cannot JSON-serialize without markdown parser
- `WhereISteppedInSection` comparison ROWS — K-066 still open; conflict risk; defer to post-K-066 ticket

## Acceptance Criteria

### Phase 1 — Architect

**AC-073-ARCH-DESIGN:** Architect produces `docs/designs/K-073-content-ssot.md` defining:
- JSON field paths for each new addition to `site-content.json`
- TypeScript `satisfies` strategy for new nested fields (prevent type widening on `resolveJsonModule`)
- Schema sketch for `aboutContent.architecture[].fields` union type (see §Schema below)
- No new React component abstractions — read-path only

### Phase 2 — Engineer

**AC-073-PIPELINE-FIELD:** Add `pipeline.agentCount = 6` to `content/site-content.json`. No component reads it (PageHeaderSection and BuiltByAIBanner excluded; PIPELINE_DEPTH excluded per K-066). Field exists as SSOT reference and for generator use in AC-073-METRICS-MARKER.

**AC-073-METRICS-MARKER:** Add `<!-- METRICS:start -->...<!-- METRICS:end -->` marker block to `README.md` at the existing first `40+` reference location. `scripts/build-ticket-derived-ssot.mjs` writes this block from `metrics.*`. Format:

```
${featuresShipped.value}+ tickets shipped · ${acCoverage.covered}/${acCoverage.total} AC covered · ${postMortemsWritten} post-mortems · ${lessonsCodified} lessons codified
```

Generator must handle all four STACK / NAMED-ARTEFACTS / FOLDER-STRUCTURE / METRICS marker blocks and report METRICS count in its stdout summary line.

**AC-073-HOME-STEPS:** Externalize `ProjectLogicSection.tsx` STEPS array (3 step objects) to `site-content.json homeContent.steps[]`. Component reads from `siteContent.homeContent.steps`. Rendered output must be byte-identical to current output. E2E spec must add `{ exact: true }` assertions for at least one step `title` and one step `description` to verify behavior equivalence (currently no such assertion exists).

**AC-073-ABOUT-ARCH:** Externalize `ProjectArchitectureSection.tsx` architecture layers (3 pillar objects) to `site-content.json aboutContent.architecture[]`. Component reads from `siteContent.aboutContent.architecture`. TypeScript `satisfies` required on the JSON constant to prevent `type` field from widening to `string`. Rendered output byte-identical to current. Existing `AC-029-ARCH-BODY-TEXT` E2E assertions must continue to pass.

**AC-073-ABOUT-WHERE:** Externalize `WhereISteppedInSection.tsx` ROWS array (3 rows × 3 cols: `aiDid` / `iDecided` / `outcome`) to `site-content.json aboutContent.whereISteppedIn.rows[]`. Component reads from `siteContent.aboutContent.whereISteppedIn.rows`. Rendered output byte-identical. E2E spec must add `{ exact: true }` assertion for at least one `outcome` cell value to verify behavior equivalence.

### Phase 3 — QA

**AC-073-BEHAVIOR-EQUIV:** All existing E2E specs pass unchanged. Zero console errors. `npx tsc --noEmit` clean.

**AC-073-METRICS-BLOCK:** `README.md` METRICS marker block shows current `metrics.*` values. Running `node scripts/build-ticket-derived-ssot.mjs` updates the block. Manual `grep "tickets shipped" README.md` returns a line matching `[0-9]+\+ tickets shipped`.

**AC-073-STEPS-ASSERTIONS:** `pages.spec.ts` or `home.spec.ts` contains `{ exact: true }` assertions for step title (`"Upload"`) and step description (`"Drop in a CSV of 24 × 1H OHLC bars. The reference sample."`).

## §Schema — aboutContent.architecture fields union

```ts
type ArchField =
  | { type: 'labelValue'; label: string; value: string; valueFont?: string }
  | { type: 'pyramid'; rows: Array<{ no: string; layerLabel: string; detail: string }> }

type ArchLayer = {
  no: string       // e.g. "BACKBONE"
  label: string    // e.g. "Monorepo, contract-first"
  fields: ArchField[]
}
```

JSON must be cast with `satisfies ArchLayer[]` (or equivalent type assertion) to prevent TypeScript from widening `type` field to `string`.

## §Schema — homeContent.steps

```ts
type Step = {
  no: string          // "01" | "02" | "03"
  verb: string        // "INGEST" | "MATCH" | "PROJECT"
  title: string       // "Upload" | "Scan" | "Project"
  description: string
}
```

## Non-Goals

- No visual changes — rendered output identical before and after
- No changes to component props interfaces beyond reading from JSON instead of inline constant
- No new React components or abstractions
- No changes to roles.json, ticket-cases.json, or any other content file
- No changes to `ReliabilityPillarsSection`, `PageHeaderSection`, `BuiltByAIBanner` (excluded per QA Early Consultation)
- `WhereISteppedInSection`: ROWS externalized (AC-073-ABOUT-WHERE); narrative text and PIPELINE_DEPTH constant unchanged

## Release Status

- TBD

## Retrospective

### Engineer

**AC judgments that were wrong:** `satisfies ArchLayer[]` fails with `resolveJsonModule`-widened JSON — used `as unknown as ArchLayer[]` cast + `string` discriminant types instead of literal unions.

**Edge cases not anticipated:** `buildSiteContentJson` preservation list did not include new hand-authored fields — wiped on first generator run; required adding three `...(preserved.X ? { X: preserved.X } : {})` spread clauses.

**Next time improvement:** Before running generator after adding JSON fields: verify the preservation list in `buildSiteContentJson` first. For `satisfies` + JSON imports: use `string` for all discriminant fields in shared types.

### QA

**Regression tests that were insufficient:** `docs/qa/known-reds.md` — `Footer snapshot on /` was missing; K-059 entry only recorded `/about` + `/diary`, silently omitting the homepage route.
**Edge cases not covered:** N/A — this is a pure content-externalization refactor; all behavioral equivalence assertions passed.
**Next time improvement:** When adding snapshot known-red entries, enumerate all affected routes one-by-one — never collapse sibling routes into a shared entry.
