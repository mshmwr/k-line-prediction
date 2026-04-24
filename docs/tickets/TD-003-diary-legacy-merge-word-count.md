---
id: TD-003
title: Vitest diary.legacy-merge.test.ts — legacy entry word count drift below 50-word minimum
status: open
type: TD
priority: low
source: K-046 Phase 2b Engineer retrospective + Phase 2e Reviewer I-3 (cross-ticket standard)
created: 2026-04-24
related-to: [K-024, K-046]
---

## 1. Context

Vitest `frontend/src/__tests__/diary.legacy-merge.test.ts > legacy entry text word count is within 50–100` expects each legacy diary entry to carry ≥50 words. As of HEAD `e1f3924` (K-046 Phase 2b), one or more legacy entries parse to 33 words — asserts `>=50` and fails.

**Root cause (confirmed via git log):** commit `f24b9d7` "data(diary): rewrite all entries as short summaries" deliberately shortened legacy entry text. The test's 50-word floor was set against the pre-shortening content and was never updated to match the new content discipline.

**Provenance trail:**
- K-046 Phase 1 — Engineer retrospective 2026-04-24 flagged this Vitest failure as pre-existing, out of scope
- K-046 Phase 2b — Engineer retrospective 2026-04-24 re-flagged, confirmed pre-existing on base HEAD (not K-046 regression)
- K-046 Phase 2d — QA regression sign-off confirmed 1 Vitest failure, out-of-scope
- K-046 Phase 2e — Reviewer Step 1 classified as Important but non-blocking for K-046; Reviewer recommended TD filing

**Not K-046-caused.** K-046 scope is upload-flow + example CSV fixture; does not touch `diary.json` content or legacy-merge parser.

## 2. Scope

**In scope:**
- Decide the word-count floor policy against current diary content discipline:
  - Option (a) Lower the floor to match current shortest entry (e.g. `>=30` or `>=25`) — accepts the content-shortening direction as permanent
  - Option (b) Raise existing short entries back to ≥50 words — reverses the `f24b9d7` direction for legacy entries specifically
  - Option (c) Drop the word-count assertion entirely — relies on other tests (schema, rendering) for coverage
- Architect to pick between (a)/(b)/(c) with reference to user intent at `f24b9d7` commit time + current diary voice guidelines
- Engineer applies the chosen direction:
  - (a) → update `diary.legacy-merge.test.ts` floor literal + inline comment referencing TD-003 resolution
  - (b) → edit the short entries in `frontend/public/diary.json` to add words (coordinate with user on content)
  - (c) → remove the word-count assertion + add JSDoc explaining the removal

**Out of scope:**
- Re-writing the broader diary voice policy (covered by `diary-voice-guidelines` if that document exists, or by a new doc)
- Any K-046 functionality (upload flow, example CSV, CORS — all separately tracked)

## 3. Sacred preservation

None directly. The legacy-merge parser logic itself is unchanged; only the word-count threshold policy is in question.

## 4. Acceptance criteria

### AC-TD003-VITEST-GREEN — Vitest full suite passes without the word-count failure

- **Given:** TD-003 resolution lands (option a/b/c applied)
- **When:** `npx vitest run` executes on clean HEAD
- **Then:** all suites pass including `diary.legacy-merge.test.ts`
- **And:** no test that was green pre-TD-003 flips red (no regression from the fix)

### AC-TD003-RATIONALE-DOCUMENTED — Resolution path captured in test comment or CHANGELOG

- **Given:** TD-003 option picked
- **When:** reader opens `diary.legacy-merge.test.ts` (option a or c) OR reads the commit message for option (b)
- **Then:** the commit message or test comment names the option (a/b/c) + references TD-003 + names the policy decision (e.g. "floor lowered to 30 matching content discipline set by f24b9d7")

## 5. Related

- K-024 — diary structure + schema (original word-count monitor authored here)
- K-046 Phase 1/2 — out-of-scope flag chain that surfaced the drift
- Commit `f24b9d7` — root-cause content shortening

## 6. Release Status

- 2026-04-24 — TD-003 opened from K-046 Phase 2e Reviewer recommendation; no implementation yet
