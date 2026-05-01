---
id: K-069
title: system-overview.md cleanup — stale annotations, structure, changelog reduction
status: open
created: 2026-05-01
type: docs
priority: medium
size: medium
visual-delta: no
content-delta: no
design-locked: n/a
qa-early-consultation: N/A (docs-only, no runtime touch)
dependencies: []
---

## Summary

`ssot/system-overview.md` has accumulated structural problems over K-017 → K-068:
22 stale "(pending)" annotations pointing to work already delivered, a Retrospective section
the Writing Standards prohibit, verbose pre-K-063 Changelog entries consuming 25% of the
file, missing `content/` directory from the tree, and a Summary section that reads as a
historical narrative rather than a current-state reference.

This is a docs-only ticket. Zero runtime code changes.

**Root cause:** The file was continuously appended without a periodic cleanup pass.
K-063 codified the 3-line Changelog cap, but the pre-K-063 backlog was never trimmed.

---

## Acceptance Criteria

### Phase 1 — Quick Wins (low-risk, immediate)

**AC-069-RETRO-REMOVED:** `## Retrospective` section (currently at the bottom of the file)
is deleted. Writing Standards rule (codified K-063): this section does not belong in
system-overview.md. Retro content was already recorded in `docs/retrospectives/architect.md`.

**AC-069-PENDING-CLEARED:** All stale "(pending)" / "(pending Engineer)" / "(pending
deletion)" annotations updated to present-tense descriptions matching disk reality.
Full item list in §Implementation Notes. Key categories:
- K-024 Phase 3 components: all exist on disk — remove "(pending)" qualifiers
- MilestoneSection.tsx + DiaryEntry.tsx + diary-mobile.spec.ts: deleted — remove entries
  from tree entirely
- Footer.tsx `variant prop 即將 retire`: already zero-prop — remove the "pending" clause
- K-013 language in Summary: closed 2026-04-21 — restate as closed
- Data Models `DiaryItem`/`DiaryMilestone` "(pending Engineer)": delivered — update
- diary.json "(pending Engineer)" flat schema: delivered — update
- LoadMoreButton.tsx: replaced by InfiniteScrollSentinel (K-059) — update entry

**AC-069-CONTENT-DIR:** `content/` directory added to the Directory Structure tree with
entries for `site-content.json`, `ticket-cases.json`, and `roles.json`, each with a
one-sentence description referencing the Ticket-Derived SSOT pattern (K-052).

**AC-069-MISSING-FILES:** The following files confirmed on disk but absent from the tree
are added with one-sentence descriptions:
- `frontend/e2e/ga-consent.spec.ts`
- `frontend/e2e/roles-doc-sync.spec.ts`
- `frontend/e2e/K-013-consensus-stats-ssot.spec.ts`
- `frontend/src/components/diary/InfiniteScrollSentinel.tsx` (K-059)
- Any other e2e specs on disk not yet listed (Architect to verify with `ls frontend/e2e/`)

**AC-069-TD008-CLOSED:** Known Architecture Debt table: TD-008 row status updated from
"實作中" to "closed 2026-04-21 (K-013)". RFC ordering note below the table updated to
remove "K-013 實作 + 驗收" as first step (prerequisite satisfied); restate
TD-005/006/007 RFC as "not yet opened (K-013 prerequisite satisfied 2026-04-21)".

**AC-069-SUMMARY-CURRENT:** Summary section trimmed to ≤5 bullets describing only current
state. Historical per-ticket attribution sentences moved or dropped — those belong in the
Changelog, not the Summary. Required bullets: (a) tech stack, (b) route count + layout,
(c) backend layout, (d) K-013 Option C cross-layer stats decision, (e) open tech debt
status (TD-005/006/007 RFC not yet opened).

---

### Phase 2 — Structural Cleanup

**AC-069-TREE-TRIM:** Directory Structure inline annotations trimmed to ≤2 sentences per
file entry. Files with >200-character inline descriptions (DevDiarySection.tsx, diary/
subcomponents, about/ subcomponents) are reduced to: what the file owns + one ticket
attribution. Design rationale replaced by a pointer to the relevant design doc or
Changelog entry.

**AC-069-CHANGELOG-COLLAPSED:** Pre-K-063 Changelog entries collapsed to the 3-line
standard (Writing Standards rule): one-line architectural fact + design doc link + ticket/date.
Delivery Gate tables, grep outputs, truth tables, and AC↔Test cross-checks are removed
(that detail is in the linked design docs). Post-K-063 entries (K-048 2026-04-30, K-062
2026-04-29) already comply — do not modify.

**AC-069-GA4-RELOCATED:** `## GA4 E2E Test Matrix` section moved to
`ssot/conventions.md` (new §GA4 E2E Test Matrix subsection). In system-overview.md,
replaced with: "E2E test matrix and GA4 intercept contract: `ssot/conventions.md §GA4
E2E Test Matrix`."

**AC-069-QA-ARTIFACTS-RELOCATED:** `## QA Artifacts` section (visual-report how-to, spec
project split rationale) moved to `ssot/frontend-checklist.md` (new §QA Visual Report
subsection). In system-overview.md, replaced with a one-sentence pointer. The single
architectural fact (visual-report spec runs in a separate Playwright `visual-report`
project) kept as one sentence in `ssot/conventions.md §Testing`.

---

## Non-Goals

- No English translation in this ticket. Language compliance is per-touch per global rule.
- No changes to runtime source files (`.tsx`, `.ts`, `.py`, etc.).
- No changes to Pencil design files.
- No new Sacred clauses.

---

## Implementation Notes

### Full stale-annotation list for AC-069-PENDING-CLEARED

| File/annotation | Approx line | Action |
|---|---|---|
| `diary.json` "(pending)" flat schema | 79 | Remove qualifier |
| `types/diary.ts` "(pending Engineer)" | 100 | Remove qualifier |
| `diary/` header "(pending Engineer)" | 166 | Change to present-tense |
| `DiaryHero.tsx` "新增 pending" | 170 | Remove "pending" |
| `DiaryEntryV2.tsx` "新增 pending" | 171 | Remove "pending" |
| `DiaryRail.tsx` "新增 pending" | 172 | Remove "pending" |
| `DiaryMarker.tsx` "新增 pending" | 173 | Remove "pending" |
| `DiaryLoading.tsx` "新增 pending" | 174 | Remove "pending" |
| `DiaryError.tsx` "新增 pending" | 175 | Remove "pending" |
| `DiaryEmptyState.tsx` "新增 pending" | 176 | Remove "pending" |
| `LoadMoreButton.tsx` "新增 pending" | 177 | Update: replaced by InfiniteScrollSentinel (K-059) |
| `timelinePrimitives.ts` "新增 pending" | 178 | Remove "pending" |
| `MilestoneSection.tsx` "pending deletion" | 168 | Remove entire entry (file deleted) |
| `DiaryEntry.tsx` "pending deletion" | 169 | Remove entire entry (file deleted) |
| `diary-mobile.spec.ts` "pending deletion" | 89 | Remove entire entry (file deleted) |
| `diarySort.ts` "pending" | 111 | Remove "pending" |
| `useDiaryPagination.ts` "pending" | 105 | Remove "pending" |
| `diary-page.spec.ts` "pending" | 87 | Remove "pending" |
| `diary-homepage.spec.ts` "pending" | 88 | Remove "pending" |
| `diary.schema.test.ts` "pending" | 127 | Remove "pending" |
| `diary.english.test.ts` "pending" | 128 | Remove "pending" |
| `diary.legacy-merge.test.ts` "pending" | 129 | Remove "pending" |
| `diarySort.test.ts` "pending" | 130 | Remove "pending" |
| `useDiaryPagination.test.ts` "pending" | 131 | Remove "pending" |
| Data Models `DiaryItem`/`DiaryMilestone` "(pending Engineer)" | 318–320 | Update to reflect delivered state |
| `Footer.tsx` "variant prop 即將 retire (pending)" | 185 | Remove — already zero-prop |
| K-013 in Summary "設計完成，已放行 Engineer" | ~15 | Restate as "closed 2026-04-21" |

### Changelog collapse target (AC-069-CHANGELOG-COLLAPSED)

- K-048 (2026-04-30) + K-062 (2026-04-29): already ≤3 lines — keep unchanged
- K-053, K-051 Phase 4, K-051 Phase 3b/3c: collapse to 3 lines each
- All entries before 2026-04-26: collapse, merge same-day/same-ticket sequences

---

## §8 Sacred Clauses

None. Docs-only ticket; no runtime behavior changes.
