---
id: K-011
title: LoadingSpinner copy neutralization — add label prop
status: closed
type: enhancement
priority: medium
created: 2026-04-18
closed: 2026-04-18
source: docs/reviews/2026-04-18-code-review.md#p3-shared-loading-spinner-copy-is-now-misleading
---

## Background

Codex code review 2026-04-18 found that `frontend/src/components/common/LoadingSpinner.tsx` hard-codes the copy `Running prediction...`.

This component is currently shared across multiple sites:

- `BusinessLogicPage`
- `DiaryPage`
- `DevDiarySection`
- `PredictButton`

In non-prediction contexts (diary, business-logic), showing prediction-related text is misleading.

## Scope

**In:**
- `LoadingSpinner` adds a `label?: string` prop, default value chosen by the caller
- Update all 4 call sites to pass a context-correct label (e.g. `"Loading diary…"`, `"Running prediction…"`)
- Fallback strategy when no label is given is up to Engineer (recommended: when no label, only render the spinner without text)

**Out:**
- Animation visual upgrade (already covered by K-002 AC-002-LOADING)
- Adding skeleton / pulse variants

## Expected file changes

- `frontend/src/components/common/LoadingSpinner.tsx`
- `frontend/src/pages/BusinessLogicPage.tsx`
- `frontend/src/pages/DiaryPage.tsx`
- `frontend/src/components/DevDiarySection.tsx`
- `frontend/src/components/PredictButton.tsx`
- Possibly: `frontend/src/__tests__/*`, `frontend/e2e/*` (if any test asserts spinner copy)

## Acceptance Criteria

### AC-011-PROP: LoadingSpinner supports the label prop

**Given** the `LoadingSpinner` component
**When** the caller renders `<LoadingSpinner label="Loading…" />`
**Then** the screen shows that label text
**And** when no label is passed, the prediction-specific `Running prediction...` text does not appear

### AC-011-CALLSITES: each call site is context-correct

**Given** the 4 LoadingSpinner usage sites
**When** each triggers its loading state
**Then** the displayed label matches the page's task context (diary-related copy on diary pages; prediction-related copy on predict pages)

### AC-011-REGRESSION: no existing functionality regression

**Given** full frontend checks
**When** running `npx tsc --noEmit` / `npm test` / `/playwright` in order
**Then** all pass
**And** any existing tests that assert `Running prediction...` text are updated to the new label

## Priority rationale

**medium** — not a correctness issue, but the review explicitly flagged it as misleading UX; same category as K-002 UI cleanup work, small change. Fine to schedule after K-009/K-010.

## Next handoff

Hand directly to Engineer (props addition + 5 call site updates, no architectural decisions).

## Related links

- [Code Review](../reviews/2026-04-18-code-review.md#p3-shared-loading-spinner-copy-is-now-misleading)
- [K-002 UI optimization AC-002-LOADING](../../PRD.md)

---

## Architecture Review

**Ruling: Architecture not required** — reviewed by senior-architect on 2026-04-18.

**Rationale:**
- Change scope: `LoadingSpinner` adds `label?: string` prop + 4 call sites pass their own copy
- No cross-layer impact: pure UI component prop extension, no API or routing impact
- Props interface change is minimal (backward-compatible, `label` optional + fallback "no text, only spinner")
- AC-011-PROP / AC-011-CALLSITES / AC-011-REGRESSION are sufficient to lock the behavior

**Implementation reminders (non-blocking, for Engineer reference):**
- If existing unit tests or E2E assert `Running prediction...` text, update them too (AC-011-REGRESSION already covers this)
- The 4 call sites' copy should be consistent with each page's i18n style (project currently uses Chinese UI, so spinner copy is recommended in Chinese)

**Releasing to Engineer.**

— senior-architect, 2026-04-18

---

## Retrospective

### Engineer — 2026-04-18

**What went wrong:**
- The ticket originally listed the call site as `frontend/src/components/DevDiarySection.tsx`, but it is actually located at `frontend/src/components/home/DevDiarySection.tsx`. The first Read got a 404, and only after grep was the correct path found. Root cause: did not verify the path listed in the ticket with Grep first; instead trusted it directly.
- Expected E2E or unit tests to assert `Running prediction...`; after grep, only `PredictButton.test.tsx` had one occurrence, and that PredictButton still passes `"Running prediction..."`, so no test change was needed. If PM had requested unifying to a Chinese label (predicting…), it would have triggered the Test Escalation Rule (assertion content change); fortunately this ticket did not change the copy at that call site.

**Next time improvement:**
- Before starting, run `Grep "<component-name>"` to verify ticket-listed paths; on mismatch, immediately report to PM and request a ticket fix, do not silently fix.
- For the 4 call sites' Chinese copy choice (BusinessLogic uses a Chinese "loading content" label / Diary's two sites use a Chinese "loading diary" label / Predict keeps English "Running prediction..."), produce the list for PM confirmation once before implementing, to avoid being kicked back later for copy-style reasons.

### Reviewer — 2026-04-18

**What went well:**
- Beyond paper review, also actually ran `npx tsc --noEmit` (exit 0) and `npm test` (36 pass / 6 files), independently verifying Engineer's report.
- Grep'd for `LoadingSpinner` + `Running prediction` across the entire working directory; cross-checked call sites with no omissions and no missed test assertions (`PredictButton.test.tsx:24` English assertion still hits the English label retained in PredictButton → AC-011-REGRESSION auto-protected).
- Issued explicit rulings on each of 3 drifts (A in-scope fix / B no-change with superseded note / C split ticket), preventing Engineer from inheriting unbounded scope.

**What went wrong:**
- The single line at `agent-context/architecture.md:139` ("currently fixed Running prediction...") falls under K-010-introduced Architect rule "structural / interface changes must sync architecture.md", but when Architect ruled "Architecture not required" on this ticket, Engineer was not directed to also fix it; the issue was caught only at Reviewer stage and proposed in-scope, delaying by one handoff. Should have been intercepted at Architect release.
- The 3 drifts were proactively raised by Engineer, but the ticket's AC stage never put "doc sync" in scope; Reviewer stage ended up making in-scope / tech-debt rulings that should have come from PM at ticket draft as "doc included / not included".

**Next time improvement:**
- When Review finds "architecture-doc drift caused by this change" and the change is tiny (single line), recommend in-scope fix; also feed back to Architect's "Architecture not required" ruling flow with a checklist line: "grep component name in architecture.md; any stale description goes into Engineer scope".
- For archived design specs (`docs/designs/*-design.md`), do not force content sync; recommend adding a "superseded by K-XXX" header note instead, to avoid distorting historical snapshots.

**Drift rulings:**
| Drift | File | Ruling | Rationale |
|------|------|------|------|
| A | `agent-context/architecture.md:139` | **In-scope fix (recommend PM release Engineer to add a line)** | Single-line comment, no design change, K-010 Architect rule mandates sync; leaving it would mislead the next agent |
| B | `docs/designs/k002-component-spec.md:99,111` | **Do not change content; recommend adding superseded header note (split into small ticket)** | Spec is K-002's design snapshot; changing distorts history; "superseded by K-011" suffices |
| C | `frontend/design/homepage.pen` | **Split ticket → tech debt** | Designer agent scope, requires Pencil MCP, not in Engineer scope |

**Review verdict: pass with suggestions (no Critical / no Warning / 1 in-scope fix recommendation + 2 drift split-ticket recommendations).**

### PM ruling (Review Suggestions) — 2026-04-18

| Drift | File | Ruling | Rationale / action |
|------|------|------|------------|
| A | `agent-context/architecture.md:139` | **In-scope fix** | Single-line comment change, K-010 Architect rule mandates sync of structural/interface changes to architecture.md; leaving it would mislead the next agent. Direct Engineer to update it — change the line "← K-011 will add label prop (currently fixed 'Running prediction...')" to reflect the new fact "← accepts `label?: string` prop, each call site passes context copy (K-011 completed 2026-04-18)". Keep this ticket status=in-progress; only hand to QA once Engineer has updated. |
| B | `docs/designs/k002-component-spec.md:99,111` | **Split into new ticket K-016 (low priority)** | Archived design spec is a K-002 snapshot at that point in time; changing the content would distort history. The correct approach is to add a "Superseded by K-011 (2026-04-18)" header note. The spec-archival convention is out of scope for this ticket, so split into a small dedicated ticket. |
| C | `frontend/design/homepage.pen` | **Register tech debt TD-011** | Designer agent scope, requires Pencil MCP + screenshot verification; tooling and scope differ from Engineer's. Schedule alongside the next Designer engagement. |

**Scope addition (Drift A):** This ticket's AC is augmented with an implicit acceptance: "the LoadingSpinner description on architecture.md:139 reflects the new label prop behavior." Engineer's steps:
1. Read `agent-context/architecture.md` lines 138–140 to confirm current text
2. Edit line 139, changing "currently fixed 'Running prediction...'" to a description that reflects the live label prop
3. Report to PM and hand off to QA (no need to re-run tsc/npm test, doc-only change)

**Next handoff:** Engineer (single-line architecture.md update), then directly to QA after completion.

**New ticket / tech-debt summary:**
- K-016 (new) — add superseded header note to K-002 component spec (low priority, backlog)
- TD-011 (new) — Designer-scope sync of homepage.pen spinner text node

### QA — 2026-04-18

**Acceptance result: PASS (go)**

| Item | Result |
|------|------|
| `npx tsc --noEmit` (frontend/) | exit 0 |
| `npm test` | 36 passed / 6 files |
| Playwright E2E | 45 passed / 45 total (12.6s) |
| AC-011-PROP | PASS — `LoadingSpinner` accepts `label?: string`; when no label, `p` is not rendered, `aria-label` falls back to `'Loading'`, prediction wording no longer appears at no-label call sites |
| AC-011-CALLSITES | PASS — 4 call sites: `BusinessLogicPage` shows Chinese "loading content" label, `DiaryPage` shows Chinese "loading diary" label, `DevDiarySection` shows Chinese "loading diary" label, `PredictButton` shows English "Running prediction..."; each call site's label matches the page's task context |
| AC-011-REGRESSION | PASS — tsc / Vitest / Playwright all green; `PredictButton.test.tsx:24` English assertion continues to hit the English label retained in PredictButton, no change needed |
| Drift A — `agent-context/architecture.md:139` | Updated by Engineer to reflect the new label prop fact |
| Visual report | Skipped — `frontend/e2e/visual-report.ts` does not exist (K-008 incomplete); visual verification deferred to PM / user manual confirmation in Pencil / browser |

**What went well:**
- Three-layer verification (tsc / Vitest / Playwright) was actually run end-to-end with `tail` to capture exact numbers (36/36, 45/45) rather than relaying Reviewer's narrative numbers; Grep'd the actual label strings at the 4 call sites and directly cross-checked AC-011-CALLSITES's "context match" Then-clause.
- Proactively cross-verified that Drift A (`agent-context/architecture.md:139`) was actually updated by Engineer; did not assume "PM ruled = Engineer must have done"; Read line 139 of the file to verify the original wording.

**What went wrong:**
- Did not write an independent reproduce verification for the `aria-label` fallback logic (`label ?? 'Loading'`). Although Vitest/E2E both pass, `LoadingSpinner` itself has **no** corresponding unit test (existing tests are all upstream PredictButton / AppPage); the actual fallback behavior is covered indirectly via different render-time branches. If a future call site passes an empty string `""` (falsy, would trigger "no `p` render + `aria-label` fallback"), this ticket has no test to intercept.
- Did not independently verify "did existing E2E ever assert `Running prediction...` text". Reviewer's section listed grep conclusions (`PredictButton.test.tsx:24` is the only dependency, still uses English), but at QA layer this round the conclusion was relayed without independently grepping `Running prediction` against `frontend/e2e/` for cross-check.

**Next time improvement:**
- (1) For tickets that add a prop to a shared UI component, QA must proactively list "edge cases for the new callsite" (empty string, undefined, very long string, RTL / emoji) for PM to evaluate whether to add unit tests; if PM rules them out of scope, also explicitly note in retrospective "these edges remain uncovered" as future bug breadcrumbs.
- (2) Do not relay Reviewer's grep conclusions. QA runs `grep -r "Running prediction" frontend/e2e/ frontend/src/__tests__/` independently before issuing PASS, double-confirming nothing slips through.

### PM Summary — 2026-04-18

**Cross-role recurring issues:**

1. **Three same-root incidents of "trusting upstream text without verifying on the spot"**
   - Engineer: trusted the ticket's "expected file changes" listing `components/DevDiarySection.tsx` → actually under `components/home/`, Read 404'd directly
   - Engineer: when fixing Drift A, trusted Reviewer-cited `architecture.md:139` original text; Read returned characters with different indentation than the expected `old_string`, first Edit failed and was retried
   - QA: trusted Reviewer's grep conclusion; did not run `grep -r "Running prediction" frontend/e2e/` independently to cross-check (QA's own retrospective acknowledged this gap)
   - Root cause: **upstream text (ticket / reviewer paragraph / reviewer grep conclusion) was treated as "fact" and quoted directly into downstream actions, instead of as a "hint" that triggers on-site verification**.
2. **"Doc-drift scope definition" missed at Architect release**
   - Reviewer's retrospective noted "Drift A should have been caught at Architect stage by grep'ing architecture.md for the description"
   - Second consecutive occurrence: last K-009 close-out (per-role log captured but agent spec didn't land), this time K-011 again missed the doc scan during Architect's "Architecture not required" ruling
   - Root cause: Architect's "no Architecture needed" sanity-check list was never formalized, and Architect agent spec hasn't been updated to include this grep rule.

**Process improvement decisions:**

| Issue | Owner | Action | Update location |
|------|---------|------|---------|
| Ticket's expected-changes paths are wrong, leading to Engineer Read 404 | PM (ticket draft) + Engineer (before action) | When PM drafts a ticket, every "expected file change" path must be Glob-or-Read-verified first; once Engineer receives the ticket, before any action run `ls` or `Glob` once on all listed paths; on mismatch, report back to PM to fix the ticket, not silently fix | K-017-onward ticket template; Engineer agent spec adds "pre-execution path verification" checklist |
| QA relays Reviewer's grep conclusion | QA | For "new prop affecting N call sites" tickets, QA must independently run keyword grep over `e2e/` + `__tests__/` + `src/`; cannot relay Reviewer conclusion; add an "independent grep verification" column to QA's acceptance table | `~/.claude/agents/qa.md` (next time edit permission is available) + K-Line `CLAUDE.md` QA section |
| Architect "Architecture not required" did not scan `architecture.md` for drift | Architect | Whenever Architect releases — whether ruling "design needed" or "no design needed" — first `grep <component-name>` against `agent-context/architecture.md`; any stale description of that component goes into Engineer scope; this rule was identified at the last retrospective but not landed; this round formally decides | `~/.claude/agents/senior-architect.md` add checklist; `docs/retrospectives/architect.md` Architect to append a "checklist landed" entry this round |
| "Read returns indentation that doesn't match actual characters" leading to Edit retries | Engineer | Before every Edit, always Read a small range (5 lines around `old_string`) to capture real characters, never compose `old_string` from memory or Reviewer-paragraph quotes; on first Edit failure, immediately Read to verify, no blind retry | Engineer agent spec / Before-Edit Protocol in K-Line `CLAUDE.md` Engineer section |
| Visual verification gap (K-011 QA cannot run screenshot report because K-008 not implemented) | PM | Bump K-008 (automated visual report script) priority from medium up to cycle #4, replacing K-012's current cycle #4 slot; rationale: **three consecutive tickets (K-009 / K-010 / K-011) have all left the QA visual layer empty due to K-008 absence**, now a systemic gap | PM-dashboard.md cycle re-order (K-008 advanced to cycle #4, K-012 to cycle #5, K-013 to cycle #6) |

**Ruling summary:** Of the 5 improvements above, (1)(2)(4) land at this retrospective by PM (recorded in this doc + applied at next ticket draft); (3) Architect checklist landing requires the next Architect engagement or user authorization to edit agent spec; (5) K-008 priority bump **requires final user approval**; this summary recommends "cycle #4 → K-008" and notes it as PM proposal in PM-dashboard pending user confirmation.
