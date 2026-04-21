---
id: K-031
title: /about — remove "Built by AI" showcase section (S7) — design doc
ticket: docs/tickets/K-031-remove-built-by-ai-showcase-section.md
status: ready-for-engineer
author: Architect (senior-architect agent)
created: 2026-04-21
---

## 0 Scope Questions

None. Ticket AC, Pencil design intent (Designer removes S7 from `.pen` per Release Order step 1), and codebase state all align. Deterministic pure-removal ticket.

No AC↔Pencil mismatch discovered. No BQ to escalate.

## 1 Summary

Pure deletion ticket. Remove `/about` S7 `SectionContainer id="banner-showcase"` block from `AboutPage.tsx` and delete the component file `BuiltByAIShowcaseSection.tsx`. After removal `/about` renders 7 sections (S1 PageHeader → S2 MetricsStrip → S3 RoleCards → S4 Pillars → S5 TicketAnatomy → S6 ProjectArchitecture → S7 FooterCta — renumbered). Homepage `BuiltByAIBanner` is unaffected.

## 2 Option Selection

Single feasible option: remove the JSX block + import, delete the component file. No alternatives (hiding via CSS / feature-flagging / conditional render all violate AC-031-SECTION-ABSENT `...BuiltByAIShowcaseSection component file has been deleted from the codebase`).

Recommendation: **delete** (AC-mandated). No tradeoff.

## 3 File Change List

| Path | Op | Responsibility after change |
|------|-----|-----------------------------|
| `frontend/src/pages/AboutPage.tsx` | MODIFY | Remove line 10 (`import BuiltByAIShowcaseSection ...`) + lines 71–74 (S7 `<SectionContainer id="banner-showcase">` block including trailing comment). After edit the file has 7 SectionContainers: `header` / `metrics` / `roles` / `pillars` / `tickets` / `architecture` / `footer-cta`. |
| `frontend/src/components/about/BuiltByAIShowcaseSection.tsx` | DELETE | File removed from disk. Verified by `git rm` or `rm` + `git add -u`. |
| `frontend/e2e/about-v2.spec.ts` | MODIFY (append) | Append new `test.describe('AC-031-SECTION-ABSENT')` block + new `test.describe('AC-031-LAYOUT-CONTINUITY')` block. Does NOT touch existing AC-022-* blocks. |
| `agent-context/architecture.md` | MODIFY | Architect-owned doc drift sync (see §8 Self-Diff). |
| `frontend/public/diary.json` | APPEND | Diary entry per CLAUDE.md Diary Sync Rule (Engineer-owned; not Architect scope). Mentioned here for completeness of release checklist. |

**Explicitly out of scope (do not touch):**
- `frontend/src/components/home/BuiltByAIBanner.tsx` (homepage banner — a different component)
- `frontend/src/components/home/HomePage.tsx` (imports `BuiltByAIBanner`, not `BuiltByAIShowcaseSection`)
- The 5 `SectionLabelRow` blocks (Nº 01–05) — S7 has no section label per current code, so no label to remove
- `FooterCtaSection.tsx` / `ProjectArchitectureSection.tsx` / any other S6/S8 neighbor component
- K-029 scope (ArchPillarBlock / TicketAnatomyCard CSS token fix)

## 4 Route Impact Table (global-style gate)

This ticket touches NO global style file (no `index.css`, no `tailwind.config.js`, no CSS variable / token file). The only edits are to `AboutPage.tsx` (page-private) and the deletion of a page-private component file. Route impact is therefore localised by construction.

The rule in `~/.claude/agents/senior-architect.md` mandates this table whenever `index.css` / `tailwind.config.js` / sitewide tokens are in scope — they are NOT in scope here. Producing the table anyway for audit completeness per PM instruction:

| Route | Status | Notes |
|-------|--------|-------|
| `/` (HomePage) | unaffected | Imports `BuiltByAIBanner` (homepage thin strip), not `BuiltByAIShowcaseSection`. Verified via `grep BuiltByAIShowcaseSection frontend/src/pages/HomePage.tsx` — no hit. |
| `/app` (AppPage) | unaffected | No import of removed component. |
| `/about` (AboutPage) | **affected (target)** | S7 section removed. S6 `architecture` now scrolls directly into `footer-cta`. 6 `SectionContainer` remain (was 7). |
| `/diary` (DiaryPage) | unaffected | No import of removed component. |
| `/business-logic` (BusinessLogicPage) | unaffected | No import of removed component. |

No route requires isolation or override. No sitewide CSS or token change. All pages other than `/about` are byte-identical after this ticket.

## 5 Shared Component Boundary Audit

Per senior-architect rule "Engineer must not self-decide whether a component is shared; this list is authoritative":

| Component | Status | Evidence |
|-----------|--------|----------|
| `BuiltByAIShowcaseSection` | **page-private** to `/about` | `grep -rn BuiltByAIShowcaseSection frontend/src` — only 2 hits, both in `AboutPage.tsx` (import + JSX); no other page/component imports it. Design doc K-017 §2.1 and K-018 design note line 346 also confirm "About S7 展示卡...保留不動" / "不是真實 banner" distinguishing it from the reusable `BuiltByAIBanner`. |
| `BuiltByAIBanner` | **shared** between `/` (HomePage) and GA4 tracking | Out of K-031 scope. Not touched. |
| `FooterCtaSection` | **page-private** to `/about` | Referenced by architecture.md §Shared Components Boundary as `/about` only. Not affected by this ticket. |

Deleting `BuiltByAIShowcaseSection` is safe — zero external consumers.

## 6 Cross-Page Duplicate Audit

Grepped for semantically similar "mockup showcase / annotated demo card" patterns across `frontend/src`:
- `grep -rn 'mockup\|showcase\|annotation' frontend/src/components` — no other component renders a banner-mockup-inside-a-dashed-frame pattern.
- `BuiltByAIShowcaseSection` is structurally unique (`h2 + <p> + rounded-lg border-white/10 + bg-slate-900/60 annotation row + bg-[#1a1a1a] inline mockup + bg-[#0D0D0D] hero peek + caption`). No reuse opportunity lost by deletion.
- No other `/about` section will be orphaned; S6 `ProjectArchitectureSection` and S8 (now S7) `FooterCtaSection` remain structurally independent of the removed S7.

Audit evidence: grepped `BuiltByAIShowcase|banner-showcase|The real banner is clickable` across entire repo — all hits are in files being deleted (`BuiltByAIShowcaseSection.tsx`), files being edited (`AboutPage.tsx`), ticket doc, or archived design docs (K-017 / K-018). No live consumer elsewhere.

## 7 E2E Test Plan

### Decision: append to existing `frontend/e2e/about-v2.spec.ts`

Rationale:
- K-031 assertions all target `/about`, same navigation pattern as K-022 AC-022-* blocks already in this file
- Ticket explicitly scopes AC-031-K022-REGRESSION as "existing tests stay green" → keeping new tests in same file surfaces co-regression faster (run same file, see one PASS/FAIL summary)
- Avoids proliferating one-AC-per-spec-file noise (file has 7 existing `test.describe` blocks; appending 2 more keeps naming locality by page)

**Reject alternative:** new `about-k031.spec.ts` — adds file with 2 test.describe blocks, cuts against existing convention (AC-017-* and AC-022-* are both in per-page spec files, not per-ticket).

### Test cases (2 new + 1 regression confirmation)

| Test ID | File | Assertion | AC |
|---------|------|-----------|-----|
| AC-031-SECTION-ABSENT | `about-v2.spec.ts` append | On `/about`: `locator('#banner-showcase').count() === 0` AND `getByRole('heading', { name: 'Built by AI' }).count() === 0` AND `getByText('The real banner is clickable', { exact: false }).count() === 0`. (Single test case asserting all three DOM absences.) | AC-031-SECTION-ABSENT |
| AC-031-LAYOUT-CONTINUITY | `about-v2.spec.ts` append | On `/about`: `footer-cta` section visible; `architecture` section visible; assert DOM order — `architecture` is immediately followed by `footer-cta` (no element with `id="banner-showcase"` between them). Use `locator('section#architecture ~ section#footer-cta')` sibling selector or evaluate `document.querySelector('#architecture').nextElementSibling.id === 'footer-cta'` (verify SectionContainer emits `<section id="...">` — Engineer to confirm `SectionContainer.tsx` outputs `<section>` not `<div>`; if `<div>`, adjust selector). | AC-031-LAYOUT-CONTINUITY |
| AC-031-K022-REGRESSION | Existing `about-v2.spec.ts` + `about.spec.ts` + `pages.spec.ts` — no edits | Run `npx playwright test about-v2.spec.ts about.spec.ts pages.spec.ts` — all existing tests PASS. Specifically AC-022-SECTION-LABEL (5 Nº labels visible), AC-022-DOSSIER-HEADER, AC-022-FOOTER-REGRESSION, AC-017-BANNER (homepage banner unaffected). | AC-031-K022-REGRESSION |

### Engineer's pre-test verification steps (mandatory before declaring test code complete)

1. **Dom element check** — Engineer must verify in browser devtools whether `SectionContainer.tsx` renders a `<section>` or `<div>`. The `AC-031-LAYOUT-CONTINUITY` sibling assertion is written assuming `<section>` — if `<div>`, change selector to `locator('[id="architecture"] + [id="footer-cta"]')` or adjacent-sibling CSS selector on the container element.
2. **Count assertion form** — use `expect(locator).toHaveCount(0)` not `expect(locator).not.toBeVisible()` (deleted-from-DOM semantics, not hidden-visually semantics, per AC wording "no element with id=... exists in the DOM").
3. **No reliance on text-content negative**, use id-absence as primary signal — text-content negative can silently pass if text is removed for unrelated reasons.

### Boundary / error cases

Per ticket §QA Early Consultation: "N/A — all ACs are happy-path removal assertions". No error state / boundary / auth / timing edge case to cover. Architect agrees with PM's QA ruling.

Empty / null inputs, API error responses, concurrency, large data — all N/A (no API, no async state, no input mutation).

## 8 `agent-context/architecture.md` Self-Diff

### 8.1 Drift discovered (3 inconsistencies)

Ran `grep -n 'Built\|S7\|S8\|8 sections\|7 sections' agent-context/architecture.md` before editing. Results:

| Line | Current text | Drift | Correct after K-031 |
|------|--------------|-------|---------------------|
| L13 | `...(8 sections), homepage 加 BuiltByAIBanner` | S7 showcase removal → 7 sections on `/about`, not 8. Pre-existing count was already incorrect vs. current code: `AboutPage.tsx` has 7 `SectionContainer` (`header`, `metrics`, `roles`, `pillars`, `tickets`, `architecture`, `banner-showcase`, `footer-cta` = 8 containers — line 37–79). After K-031: 7 containers. | `...(7 sections), homepage 加 BuiltByAIBanner` |
| L147 | `SectionContainer.tsx ← P1；/about 7 sections 外層 wrap` | Describes consumer count. Pre-K-031 correct count was 8 (drift). After K-031 = 7. | `SectionContainer.tsx ← P1；/about 7 sections 外層 wrap`（value unchanged post-fix — the line was already off-by-one, K-031 coincidentally makes the pre-existing wrong line correct) — treat as drift corrected by coincidence, explicit changelog note so the reader understands why no edit was made |
| L410 | `Portfolio-oriented recruiter page — 8 sections: PageHeader ... + FooterCta（email/GitHub/LinkedIn）。S7 (BuiltByAIBanner) 放 / homepage 而非此頁。` | 8 sections → 7; the parenthetical "S7 (BuiltByAIBanner)" is misleading — S7 on `/about` was the showcase (`BuiltByAIShowcaseSection`), not `BuiltByAIBanner` itself. After K-031 S7 is removed entirely. | `Portfolio-oriented recruiter page — 7 sections: PageHeader ... + FooterCta（email/GitHub/LinkedIn）。BuiltByAIBanner 放 / homepage，/about 不含 banner showcase（K-031 移除）。K-017 重寫（2026-04-19），K-031 移除 S7 showcase（2026-04-21）` |
| L140 | `FooterCtaSection.tsx ← S8 email + GitHub + LinkedIn 容器` | S8 label stale after S7 removal — FooterCta becomes S7 in post-K-031 numbering. | `FooterCtaSection.tsx ← S7 email + GitHub + LinkedIn 容器（K-031 後從 S8 重編為 S7）` |

**Also noted (no action needed):** `BuiltByAIShowcaseSection.tsx` was NEVER listed in Directory Structure block lines 126–141 — a pre-existing drift (K-017 Pass 3 added the file but architecture.md was not updated). No removal needed in the tree listing because it was never there. Engineer and Reviewer should not look for it in the tree block.

### 8.2 Self-Diff Verification (K-021 Round 3 mandatory block)

```
### Self-Diff Verification
- Section edited: `## Summary` L13 + Directory Structure (about/ block L140) + Frontend Routing (/about row L410)
- Source of truth: AboutPage.tsx (post-K-031 mental diff: 7 SectionContainer remaining) + ticket AC-031 §Scope + §Acceptance Criteria
- Row count comparison: 3 lines edited vs 3 drifts listed — cell-by-cell match: L13 "8 sections" → "7 sections" ✓；L140 "S8 email" → "S7 email (K-031 後從 S8 重編為 S7)" ✓；L410 "8 sections ... S7 (BuiltByAIBanner) 放 /" → "7 sections ... BuiltByAIBanner 放 /，/about 不含 banner showcase（K-031 移除）" ✓
- Same-file cross-table sweep: grep 'BuiltByAI\|banner-showcase\|S7\|S8\|7 sections\|8 sections' architecture.md hit 6 locations:
   - L13 (Summary 段) — edited ✓
   - L125 (BuiltByAIBanner.tsx directory entry) — not relevant, refers to homepage banner; left unchanged ✓
   - L140 (FooterCtaSection S8 label) — edited ✓
   - L147 (SectionContainer consumer count `7 sections`) — post-K-031 value matches; pre-existing drift coincidentally resolved; no edit; noted in changelog ✓
   - L410 (Frontend Routing /about row) — edited ✓
   - L590+ (Changelog / Retrospective historical entries) — historical, immutable; do not edit ✓
- Discrepancy: none after edit
```

### 8.3 Changelog entry to add

```
- **2026-04-21**（Architect, K-031 設計）— `/about` S7 BuiltByAIShowcaseSection 移除：Summary 段 `8 sections` → `7 sections`；Directory Structure about/ block FooterCtaSection 註解 `S8` → `S7`（S7 空出）；Frontend Routing `/about` 列 `8 sections` → `7 sections`，刪除誤導性的 `S7 (BuiltByAIBanner) 放 / homepage` 括號（BuiltByAIBanner 是 homepage 組件，與已刪的 S7 showcase 不同組件），改註明「K-031 移除 S7 showcase」。pre-existing drift 順便修：BuiltByAIShowcaseSection.tsx 原本就未列入 Directory Structure（K-017 Pass 3 新增時漏填），故不需從 tree 移除。`SectionContainer` L147 的 consumer count `7 sections` 原本為 `/about 8-container` 時的 drift，K-031 移除後 value 意外對齊，保留不動。無 code 變更（Architect 僅設計）。
```

## 9 Implementation Order

1. Engineer removes S7 block + import from `AboutPage.tsx` (2 edits in 1 file)
2. Engineer deletes `BuiltByAIShowcaseSection.tsx` (`git rm` preferred over plain `rm` to capture deletion in staged diff)
3. Engineer appends 2 `test.describe` blocks to `about-v2.spec.ts` (AC-031-SECTION-ABSENT + AC-031-LAYOUT-CONTINUITY)
4. Engineer runs `npx tsc --noEmit` — expect exit 0 (removing import + component is type-safe; TypeScript will flag if `BuiltByAIShowcaseSection` is still referenced anywhere — should be 0 references after step 1)
5. Engineer runs `npx playwright test about-v2.spec.ts about.spec.ts pages.spec.ts` (K-031 + regression) — expect all PASS
6. Engineer runs `/playwright` or full E2E as per CLAUDE.md Frontend Changes rule
7. Engineer appends diary entry to `frontend/public/diary.json` (per project CLAUDE.md Diary Sync Rule)
8. Engineer commits with File Class Full gate (frontend/src/** + e2e/** + architecture.md) — tsc + Vitest + Playwright all green

Parallelisable: none — step 1–2 must precede step 3–5 (test added before verification). Steps 4 and 5 can run concurrently in parallel tool calls.

## 10 Risks & Notes

### Security
- No auth, env var, or injection surface. N/A.

### Common error-prone areas
- **File deletion via Git** — Engineer must use `git rm frontend/src/components/about/BuiltByAIShowcaseSection.tsx` not `rm`. Plain `rm` leaves staged-as-untracked-deletion state that can be missed in `git status`. Verify with `git status` before commit: file must appear under `deleted:`.
- **Dead CSS class leftover** — Confirm no other component imports styles or uses the `banner-showcase` id as a CSS selector. Grepped: zero CSS `#banner-showcase` selector hits in the codebase — safe.
- **Visual-report.ts screenshots** — `frontend/e2e/visual-report.ts` screenshots `/about` full page. Post-K-031 the page will be shorter (approx. 300–400px less scroll). This is expected, not a regression. QA should note it.
- **Section numbering in comments** — `AboutPage.tsx` source comments say `S7 — BuiltByAIShowcaseSection` and `S8 — FooterCtaSection`. After removal, the remaining `S8 — FooterCtaSection` comment becomes semantically inaccurate (there is no S7 any more). Engineer SHOULD renumber the remaining comment to `S7 — FooterCtaSection` for self-documentation, but this is advisory polish, not AC-gated. Architect recommends the renumber for code hygiene.
- **Import order** — removing line 10 import shifts line numbers 11+ upward. Engineer should not rely on absolute line numbers in any subsequent edit within the same session.

### Known gaps / accepted debt
- None. The SectionContainer `<section>` vs `<div>` question (§7 test-plan item 1) is a deterministic verification step, not a gap — Engineer resolves by reading `frontend/src/components/primitives/SectionContainer.tsx` before writing the layout-continuity assertion.

## 11 All-Phase Coverage Gate

K-031 is a single-phase ticket (pure removal, no phased rollout). Applying the gate table:

| Phase | Backend API | Frontend Routes | Component Tree | Props Interface |
|-------|------------|----------------|----------------|----------------|
| 1 (only) | N/A (no API change) ✓ | §4 Route Impact Table ✓ | §5 Shared Component Boundary Audit + §3 File Change List ✓ | N/A (no new/modified component; `BuiltByAIShowcaseSection` takes zero props — confirmed line 7 of component file: `export default function BuiltByAIShowcaseSection()`) ✓ |

All four quadrants are covered (or N/A with rationale). No ❌ cells.

## 12 Refactorability Checklist

- [x] **Single responsibility** — removal only; no new code added that could violate SRP
- [x] **Interface minimization** — no new props, no new interfaces
- [x] **Unidirectional dependency** — dependency count drops by 1 (AboutPage.tsx → BuiltByAIShowcaseSection.tsx edge removed)
- [x] **Replacement cost** — N/A (deletion, not replacement)
- [x] **Clear test entry point** — 2 new tests with id-absence assertions; input (navigate to `/about`) and output (DOM count === 0) are both explicit
- [x] **Change isolation** — UI removal does not affect any API contract; no component tree cascade (no sibling re-layout needed; S8 → S7 comment relabel is purely semantic)

All 6 items pass. No N/A items to explain.

## 13 Boundary Pre-emption

| Boundary scenario | Defined? | Action |
|-------------------|----------|--------|
| Empty / null input | N/A (no input to this change) | ✓ |
| Max / min value boundary | N/A (deletion, not value range) | ✓ |
| API error response | N/A (no API) | ✓ |
| Concurrency / race | N/A (no async state) | ✓ |
| Empty list / single item / large data | N/A (no list) | ✓ |

All rows N/A by construction of a pure-removal ticket. PM's QA-Early-Consultation ruling (ticket §QA Early Consultation: "N/A — all ACs are happy-path removal assertions") confirms.

## 14 Handoff Note to Engineer

Execute steps in §9 order. The only non-obvious item is the `<section>` vs `<div>` DOM check in §7 before writing AC-031-LAYOUT-CONTINUITY — read `frontend/src/components/primitives/SectionContainer.tsx` once, adjust selector shape accordingly. If the SectionContainer outputs `<div>`, use:

```
// pseudo-code (not real code — Engineer writes real assertion):
expect(await page.evaluate(() =>
  document.getElementById('architecture')?.nextElementSibling?.id
)).toBe('footer-cta')
```

Everything else is mechanical. Expect total Engineer wall-clock: <15 minutes excluding test run time.

---

## Retrospective

**Where most time was spent:** §8 architecture.md drift audit — grep surfaced 3 inconsistencies (L13 "8 sections", L140 "S8", L410 "8 sections" + misleading "S7 (BuiltByAIBanner)" parenthetical) plus 1 pre-existing drift (`BuiltByAIShowcaseSection.tsx` never listed in tree since K-017 Pass 3). Cross-referencing each against actual `AboutPage.tsx` SectionContainer count pre- and post-ticket took longest part of the design phase. The L147 `7 sections` coincidence (pre-existing wrong → post-K-031 right) required explicit narration to avoid confusion.

**Which decisions needed revision:** None mid-design. One initial assumption revised before writing doc: I first assumed AC-031-LAYOUT-CONTINUITY could rely on `getByRole('region')` ordering, then realised `SectionContainer` element tag (section vs div) is not documented in architecture.md, so downgraded the assertion strategy to id-based adjacent-sibling check with an Engineer-side verification step in §7. This change protects against false greens from misread DOM shape.

**Next time improvement:** When editing `architecture.md` Directory Structure block, always run `grep -n '<component-file-name>' frontend/src` cross-checking against the tree listing for BOTH "component should appear in tree" and "component should be removed from tree" directions. The pre-existing `BuiltByAIShowcaseSection.tsx` omission (K-017 Pass 3) slipped through because K-017's own design doc was the source of truth that session — but architecture.md update was a second-tier sync that didn't happen. Sync rule is already codified in persona; the additional hard step is: on ANY `/about` component change going forward, `ls frontend/src/components/about/*.tsx | wc -l` must equal the count of entries in architecture.md L126–141 block. Mismatch → pre-existing drift, flag in design doc §Self-Diff. Will codify as a new line under `## Architecture Doc Structural Content Self-Diff` in senior-architect.md if PM confirms this pattern is worth hardening.
