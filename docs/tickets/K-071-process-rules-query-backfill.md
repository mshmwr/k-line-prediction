---
id: K-071
title: processRules — PM quick-query script + systematic backfill (5 → 17 entries)
status: closed
created: 2026-05-01
closed: 2026-05-01
type: feat+docs
priority: medium
size: medium
visual-delta: no
content-delta: yes
design-locked: n/a
qa-early-consultation: docs/retrospectives/qa.md 2026-05-01 K-071 (PM proxy) — 7 challenges, all Option A; no E2E impact; processRules not rendered by any frontend component
dependencies: []
---

## Summary

Two gaps in the processRules lifecycle surfaced during K-071 root cause analysis:

1. **No fast PM query path.** To evaluate whether a new ticket warrants a processRules mutation,
   PM must load the full `content/site-content.json` (large JSON) and mentally compute
   render weights. This creates a friction tax that incentivises skipping the step.

2. **Systematic under-representation.** 200+ lessons are codified across memory files,
   personas, and CLAUDE.md, but only 5 appear in processRules[]. The Explore scan in
   K-071 pre-work identified 12 unrecorded candidates covering critical-blocker-tier
   and warning-tier rules.

   Additionally, K-063 (Slowest step mandatory retro field) was incorrectly recorded as
   `no-change`; it should be `added` (cross-role quality discipline comparable to
   bug-found-protocol).

This ticket delivers:
- `scripts/query-process-rules.mjs` — fast token-efficient PM query tool
- `npm run rules` convenience alias
- processRules[] backfill from 5 → 17 entries
- K-063 Release Status correction

---

## Acceptance Criteria

### Phase 1 — PM Query Script (Engineer)

**AC-071-QUERY-SCRIPT:** `scripts/query-process-rules.mjs` added. The script:
- Reads `content/site-content.json` with no external dependencies (Node.js fs only)
- Prints a markdown table: `| id | title | severity | stored-weight | addedAfter |`
- Rows sorted by stored-weight descending, then id ascending
- Exits 0; no env variables required
- Callable via `node scripts/query-process-rules.mjs` from repo root

**AC-071-NPM-SCRIPT:** `package.json` scripts block includes `"rules": "node scripts/query-process-rules.mjs"`. `npm run rules` executes the script cleanly.

### Phase 2 — processRules Backfill (PM)

**AC-071-K063-CORRECTED:** `docs/tickets/K-063-retro-slowest-step.md` §Release Status
line updated from `no-change` to `added: retro-slowest-step-mandatory (K-063 2026-04-29)`.
Rationale noted inline: Slowest step mandatory field is a cross-role quality discipline rule.

**AC-071-BACKFILL:** `content/site-content.json` processRules[] expanded from 5 to 17
entries. All entries from §Implementation Notes §Backfill Candidates included with:
- `id`: kebab-case, matches the process rule name used in memory files
- `title`: ≤6 words, sentence-case
- `summary`: 1–2 sentences, present-tense, describes the rule not its history
- `severity`: one of `critical-blocker` / `warning` / `advisory`
- `addedAfter`: ticket number string where the rule was first introduced (or `null`)
- `ticketAnchor`: relative path to source ticket markdown (or `null`)
- `weight`: integer per stored-weight formula (≥1)
- `aboutSlots`: null (generator fills)
- `homeSlots`: null (generator fills)

**AC-071-GENERATOR:** `node scripts/build-ticket-derived-ssot.mjs` exits 0 after backfill.
No drift. README NAMED-ARTEFACTS section updated to reflect new processRules count.

### Phase 3 — Visual Acceptance (QA)

**AC-071-ABOUT-RENDER:** About page loads without error. Top-5 processRules visible.
`npm run rules` output matches `content/site-content.json` processRules[] content.

---

## Non-Goals

- No changes to About page React components.
- No changes to the weight formula in `scripts/build-ticket-derived-ssot.mjs`.
- No English translation of existing Chinese summary text in other files.
- No runtime behavior changes beyond static JSON data update.

---

## Implementation Notes

### §Query Script Design

**Token-efficient PM workflow (post-K-071):**
```bash
npm run rules
# or
node scripts/query-process-rules.mjs
```

Expected output format:
```
| id | title | severity | stored-weight | addedAfter |
|---|---|---|---|---|
| deploy-local-docker-dry-run | Deploy local docker dry-run | critical-blocker | 5 | K-049 |
| real-csv-integration-test-mandatory | Real CSV integration test | critical-blocker | 5 | K-051 |
| bug-found-protocol | Bug Found Protocol | critical-blocker | 3 | K-008 |
...
```

**Weight formula for display** (stored-weight stored in JSON, script reads it directly —
no need to re-compute):
- recencyScore: ticketNum > 40 → 2; > 20 → 1; else 0
- severityScore: critical-blocker → 3; warning → 1; advisory → 0
- weight = max(1, recencyScore + severityScore)

### §Backfill Candidates

All 12 candidates confirmed by Explore scan. Ordered by proposed severity descending.

| id | title | severity | addedAfter | ticket anchor |
|---|---|---|---|---|
| `deploy-local-docker-dry-run` | Deploy local docker dry-run | critical-blocker | K-049 | K-049-public-surface-plumbing.md |
| `real-csv-integration-test-mandatory` | Real CSV integration test mandatory | critical-blocker | K-051 | K-051-real-csv-integration-test.md |
| `shared-component-inventory-check` | Shared component inventory check | warning | K-035 | K-035-shared-component-inventory.md |
| `ticket-derived-ssot-pipeline` | Ticket-derived SSOT pipeline | warning | K-052 | K-052-ticket-derived-ssot.md |
| `split-ssot-visual-vs-textual` | Split SSOT: visual vs textual | warning | K-039 | K-039-split-ssot-role-cards.md |
| `contract-test-ssot-fixture` | Contract test SSOT fixture | warning | K-013 | K-013-cross-layer-consensus-stats.md |
| `sacred-regression-inventory-audit` | Sacred regression inventory audit | warning | K-035 | K-035-shared-component-inventory.md |
| `pencil-designer-parity-code-review` | Pencil–code parity code review | warning | K-034 | K-034-about-spec-audit-and-workflow-codification.md |
| `retro-slowest-step-mandatory` | Retro slowest step mandatory | advisory | K-063 | K-063-retro-slowest-step.md |
| `visual-ssot-sync-gate` | Visual SSOT sync gate | advisory | K-060 | K-060-k057-ssot-backfill.md |
| `ac-grep-raw-count-sanity` | AC grep raw-count sanity | advisory | K-046 | K-046-neutralize-upload-db-write.md |
| `marker-block-generator-discipline` | Marker block generator discipline | advisory | K-062 | K-062-readme-folder-structure-marker.md |

**Note on `pencil-as-design-source-of-truth` (existing entry):** retained; this covers
*ownership* (only Designer edits .pen). `pencil-designer-parity-code-review` is a distinct
rule covering *validation* (code reviewer runs line-by-line parity check vs shipped component).
No overlap — keep both.

### §K-063 Release Status Correction

Current (wrong):
```
- `site-content.json review: no-change — internal retro format discipline (Slowest step field); not an external-facing portfolio process rule for processRules[] showcase (retroactive backfill 2026-05-01)`
```

Correct:
```
- `site-content.json review: added: retro-slowest-step-mandatory (K-063 2026-04-29) — mandatory Slowest step field in all per-role retrospective entries; cross-role quality discipline rule comparable to bug-found-protocol; retroactively added via K-071 2026-05-01`
```

---

## §8 Sacred Clauses

None. No runtime behavior changes; SSOT JSON data update only.

## Release Status

- `site-content.json review: added × 12 (deploy-local-docker-dry-run / real-csv-integration-test-mandatory / ticket-derived-ssot-pipeline / shared-component-inventory-check / split-ssot-visual-vs-textual / contract-test-ssot-fixture / sacred-regression-inventory-audit / pencil-designer-parity-code-review / retro-slowest-step-mandatory / visual-ssot-sync-gate / ac-grep-raw-count-sanity / marker-block-generator-discipline); processRules expanded 5→17 entries; K-063 corrected from no-change→added`
