---
id: K-082
title: Surface PM autonomous arbitration in README pipeline + /about architecture
status: open
created: 2026-05-02
type: content
priority: medium
size: small
visual-delta: no
content-delta: yes
design-locked: false
qa-early-consultation: ✗
dependencies: []
base-commit: fdb6539
---

## Summary

The README pipeline section and /about architecture card describe the PM role as
"Requirements, AC, phase gating" — which omits the most distinctive PM behaviour:
self-arbitration via a 4-source priority stack without operator interruption.

PM holds 5 named verdict positions in the pipeline (pre-Architect, pre-Engineer,
post-Design-Challenge, post-Reviewer, post-QA). At each position PM resolves
conflicts by consulting: ① Pencil SSOT → ② ticket AC → ③ memory rules →
④ codebase. Operator is called only when all four sources are ambiguous.

This ticket makes that mechanism visible in three places:
1. `content/roles.json` — PM `owns` field
2. README "Role pipeline" paragraph + mermaid diagram
3. `content/site-content.json` aboutContent.architecture — extend DISCIPLINE card
   with a 3rd field (ARBITRATION) describing the 4-source stack

`visual-delta: no` — DISCIPLINE card gains a new field but uses identical tokens
as existing fields (Geist Mono 10px muted label + 12px ink body). No Pencil update needed.

## Acceptance Criteria

### AC-082-ROLES-JSON
`content/roles.json` PM row `owns` field updated to:

```
"Requirements, AC, phase gating; self-arbitrates at 5 named pipeline positions via 4-source priority stack (Pencil → ticket AC → memory rules → codebase); escalates to operator only when all sources are ambiguous"
```

**Pass condition:** `grep "4-source priority stack" content/roles.json` matches.

### AC-082-README-PIPELINE-PARAGRAPH
README "Role pipeline" introductory paragraph (currently: *"Automatic handoffs
between roles; operator checkpoints are explicit and named (see Content-Alignment
Gate below)."*) replaced with copy approved by Content-Alignment Gate that:
- Names PM's 5 verdict positions in the pipeline
- States the 4-source priority stack
- Names Content-Alignment Gate as the single operator-pause point

**Pass condition:** Content-Alignment Gate approved verbatim draft committed.

### AC-082-README-MERMAID
Mermaid flowchart in README updated to annotate PM's self-arbitration.
Minimum: add a `PM-verdict` style note or subgraph showing PM's 5 positions;
single operator-pause at `Architect → Engineer` for Content-Alignment Gate
on `content-delta: yes` tickets.

**Pass condition:** Mermaid renders without syntax error (`npx @mermaid-js/mermaid-cli` or visual verification on GitHub preview).

### AC-082-ABOUT-DISCIPLINE-CARD
`site-content.json` `aboutContent.architecture[1]` (DISCIPLINE card) gains a
third field:

```json
{
  "label": "ARBITRATION",
  "type": "labelValue",
  "value": "PM self-arbitrates at 5 named pipeline positions via a 4-source priority stack — Pencil SSOT, ticket AC, memory rules, codebase. Escalates to the operator only when all four sources are ambiguous.",
  "valueFont": "body"
}
```

**Pass condition:** `grep "four-source priority stack" content/site-content.json` matches; `/about` renders ARBITRATION field in DISCIPLINE card.

### AC-082-VISUAL-ACCEPTANCE
Pencil frame JFizO `.pen` file updated: DISCIPLINE card shows 3 fields
(SPEC FORMAT / FLOW / ARBITRATION). Visual matches shipped component.

**Pass condition:** Designer-produced screenshot shows 3-field DISCIPLINE card;
code reviewer runs Pencil–code parity check; no divergence flagged.

### AC-082-PLAYWRIGHT
E2E spec covering `/about` page still passes. DISCIPLINE card renders all 3
fields. No snapshot regression on other pages.

**Pass condition:** `npx playwright test` green; about page DISCIPLINE card
contains text "4-source priority stack".

## QA Early Consultation

**QA Lead — 2026-05-02**
**Scope:** AC testability review (Early Consultation tier).

| AC | Type | Smallest passing assertion |
|---|---|---|
| ROLES-JSON | grep | `grep "4-source priority stack" content/roles.json` |
| README-PIPELINE-PARAGRAPH | Content-Alignment Gate | operator approves verbatim draft before Engineer |
| README-MERMAID | visual / syntax | Mermaid renders on GitHub preview without error |
| ABOUT-DISCIPLINE-CARD | grep + visual | `grep "4-source priority stack" content/site-content.json`; `/about` renders ARBITRATION field |
| VISUAL-ACCEPTANCE | Pencil screenshot | Designer screenshot shows 3-field DISCIPLINE card; reviewer parity check clean |
| PLAYWRIGHT | Playwright E2E | `npx playwright test` green; DISCIPLINE card contains "4-source priority stack" |

### PM-resolved blockers

| Risk | PM decision |
|---|---|
| `ArchPillarBlock` field count — component uses `fields.map()`, supports variable count | No component change needed — adding 3rd `labelValue` field to JSON is sufficient |
| `site-content.types.ts` ArchLayer type narrowness | Engineer to verify before edit; extend type if `fields` array is length-capped |
| Content-Alignment Gate | **Gate active** — Engineer must NOT touch README pipeline copy before operator approves Architect's verbatim draft |

### Known Gaps

- VISUAL-ACCEPTANCE requires Designer session (Pencil MCP); accepted scope dependency

## Out of scope

- `whereISteppedIn` section — operator decisions live there; PM arbitration does not
- Adding a 4th architecture card (layout change deferred; extend existing card instead)
- K-078 epic tickets (K-079 / K-080 / K-081) — no dependency

## Notes

- `content/roles.json` change triggers pre-commit hook regen of README ROLES
  marker block — run `node scripts/build-ticket-derived-ssot.mjs` after edit
- Mermaid edit is a direct README edit (marker blocks do not cover the mermaid)
- DISCIPLINE card is `aboutContent.architecture[1]` (0-indexed), `no: 2`

## Retrospective

### Engineer

**AC judgments that were wrong:** AC-082-ABOUT-DISCIPLINE-CARD pass condition specifies `grep "4-source priority stack" content/site-content.json` but design doc §3 approved copy uses "four-source" (spelled out); grep won't match. PM/QA should verify actual rendered text rather than the numeric abbreviation grep.

**Edge cases not anticipated:** AC-017-ROLES PM card E2E (about.spec.ts line 112) asserts old `owns` value `'Requirements, AC, phase gating'` with `{ exact: true }` — will fail at QA because roles.json PM owns was changed. Design doc §2 only listed about.spec.ts for AC-058 update; AC-017-ROLES update was not in scope.

**Next time improvement:** Grep all E2E assertions of old field value with `{ exact: true }` before commit when any roles.json field changes (extend Step 0c-bis to cover structured JSON field values, not just shared component text nodes).

**Pre-audit findings:** AC-017-ROLES PM card E2E assertion gap identified; reported to Reviewer in handoff; not self-resolved per Test Change Escalation rule.

### QA

**Regression tests that were insufficient:** 17 non-manifest failures confirmed canonical-pre-existing (ga-consent, ga-spa-pageview non-BEACON-SPA, ga-tracking, K-046-example-upload, scroll-to-top, shared-components footer-home snapshot, about-v2 role-grid-height); not regressions introduced by K-082.
**Edge cases not covered:** Engineer's flagged concern (AC-017-ROLES exact-match) was unfounded — assertion uses no `{ exact: true }`, substring match passes with extended `owns` field.
**Next time improvement:** Verify `{ exact: true }` flag presence in E2E assertion before escalating as a potential failure — substring assertions tolerate field extensions.
