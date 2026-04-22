---
id: K-035
title: /about footer shared-component regression + cross-page component drift audit (Bug Found Protocol)
status: closed
type: bug + process-fix
priority: high
size: M
created: 2026-04-22
closed: 2026-04-22
qa-early-consultation: docs/retrospectives/qa.md 2026-04-22 K-035 Phase 3
triggered-by: user live-site review 2026-04-22
bug-found-protocol: closed 2026-04-22 (all 4 phases complete, memory + 4 personas codified, fix deployed live)
blocks:
  - K-034
  - K-036
related:
  - K-017  # initial About page (missed shared Footer)
  - K-022  # About structure v2 (missed shared Footer)
  - K-021  # sitewide design system (Footer was expected sitewide)
worktree: .worktrees/K-035  # to be created when Phase 3 implementation is released
---

## Summary

On 2026-04-22 the user reviewed the live site and found that `/about` renders its own inline footer (`components/about/FooterCtaSection.tsx`) instead of the shared Footer component used by `/` and `/diary`. The duplicate structure slipped past K-017 (initial About page, 2026-04-20) and K-022 (About structure v2, closed 2026-04) even though PM / Architect / Engineer / Reviewer / QA all signed off on both tickets. Since 5 roles × 2 tickets all missed the same class of defect, this is a **process bug**, not a one-line code bug — Bug Found Protocol is triggered. Per user decision D3 the scope is expanded beyond Footer to a **cross-page shared-component drift audit** (NavBar, Footer, Hero layout, and any other component used on ≥2 routes) across `/`, `/about`, `/diary`, `/app`. The fix lands as 3 coordinated tickets (Strategy A); K-035 is the Bug Found Protocol + audit + fix ticket.

## Background

**Concrete evidence (captured 2026-04-22):**

- `frontend/src/pages/HomePage.tsx` → imports `components/home/HomeFooterBar.tsx`
- `frontend/src/pages/DiaryPage.tsx` → imports the same footer (via sitewide layout established in K-021)
- `frontend/src/pages/AboutPage.tsx` → imports `components/about/FooterCtaSection.tsx` (separate file, duplicate content/structure)
- `frontend/src/components/` has no `shared/` subdir — there is no shared-component registry today; Footer sharing is only implicit convention

**Process gap:** no role persona currently has a step enforcing "when implementing a page, check the shared-component inventory first." The convention was assumed but never codified.

## Scope

**Includes:**

1. Phase 0 — Bug Found Protocol retrospectives (Engineer / PM / QA / Reviewer)
2. Phase 1 — Memory file + 4 persona edits to prevent recurrence
3. Phase 2 — Cross-page shared-component drift audit (D3 expansion)
4. Phase 3 — Fix: unify `/about` footer + any other drift surfaced by Phase 2

**Excludes:**

- New feature work on `/about` or other pages (those go to K-034 / K-036)
- Pencil design redraws (Designer only confirms existing frames match unified spec; updates in place if drift)
- Backend / API changes (this ticket is frontend-only)
- `/business-logic` page content / implementation (per K-017 PM decision deferred to K-018; daily-diary.md 2026-04-20). However, `BusinessLogicPage.tsx` Footer **import swap** is mandatory technical cleanup — `HomeFooterBar.tsx` is being deleted in this ticket, so leaving the old import would fail TSC. The import swap is **not AC-verified visually** (no dev-server visit, no visual report slot, no Designer Pencil confirmation, no cross-route assertion in `shared-components.spec.ts`). It exists solely to preserve route compilation.

## Expected changed / created artifacts

### Phase 0 — Retrospectives (each role owns their file)
- `docs/retrospectives/engineer.md` (prepended entry)
- `docs/retrospectives/pm.md` (prepended entry)
- `docs/retrospectives/qa.md` (prepended entry)
- `docs/retrospectives/reviewer.md` (prepended entry)

### Phase 1 — Memory + persona edits
- `~/.claude/projects/-Users-yclee-Diary/memory/feedback_shared_component_inventory_check.md` (new)
- `~/.claude/projects/-Users-yclee-Diary/memory/MEMORY.md` (index entry)
- `~/.claude/agents/engineer.md` (new hard step)
- `~/.claude/agents/qa.md` (new regression step)
- `~/.claude/agents/pm.md` (new AC-authoring check)
- `~/.claude/agents/reviewer.md` (new depth step)

### Phase 2 — Audit artifact
- `docs/audits/K-035-shared-component-drift.md` (new)

### Phase 3 — Fix
- `docs/designs/K-035-footer-unification.md` (new — Architect)
- `frontend/src/components/shared/Footer.tsx` (likely new canonical location — Architect to decide final path)
- `frontend/src/pages/AboutPage.tsx` (swap to shared Footer)
- `frontend/src/components/about/FooterCtaSection.tsx` (deleted or turned into About-only CTA block without footer structure, per Architect design)
- `frontend/e2e/shared-components.spec.ts` (new cross-page consistency spec — QA)
- `frontend/public/*.pen` frames (only if Designer finds drift)

## Phase 0 — Retrospectives (BLOCKING — no implementation until all 4 land)

Each role must prepend one entry to `docs/retrospectives/<role>.md` dated `2026-04-22 — K-035`. Content requirements (root cause only, no hand-waving):

### Engineer retrospective
- **Root cause:** why `FooterCtaSection.tsx` was created inline in AboutPage during K-017 instead of reusing / extracting a shared Footer
- **Why existing safeguards missed it:** at K-017 time, was there a `components/shared/` check step? Was there a grep of existing footer implementations?
- **Codifiable fix:** what concrete pre-implementation step would have caught this

### PM retrospective
- **Root cause:** why the K-017 and K-022 PRD ACs did not name the shared Footer component
- **Why Phase Gate missed it:** the "UI AC check" gate existed by K-022 — why didn't it flag Footer as a shared-component AC?
- **Codifiable fix:** new AC-authoring checklist item

### QA retrospective
- **Root cause:** why cross-page consistency (same Footer DOM across /, /about, /diary) was not in the regression suite
- **Why the visual report didn't catch it:** QA screenshots cover each page individually; cross-page DOM-equivalence assertion was never a regression dimension
- **Codifiable fix:** new cross-page consistency spec pattern

### Reviewer retrospective
- **Root cause:** why both Step 1 (breadth) and Step 2 (depth) Code Review passes on K-017 / K-022 did not flag `FooterCtaSection.tsx` as duplicate-of-shared-structure
- **Why pattern-scan missed it:** Reviewer depth step today grep's for specific anti-patterns — duplicate JSX of shared-component structure was not one
- **Codifiable fix:** new depth-pass scan item

**Phase 0 Gate:** PM confirms all 4 retrospective entries meet the "root cause → structural fix → codifiable into persona" bar (not "didn't think it through"). If any retrospective is hand-wavy, PM returns to that role to rewrite before proceeding to Phase 1.

## Phase 1 — Memory + persona updates (BLOCKING before Phase 3 release)

### Step 1.1: New memory file

**Path:** `~/.claude/projects/-Users-yclee-Diary/memory/feedback_shared_component_inventory_check.md`

**Rule (generalized from D3):** Before implementing any page-level UI (new page, new section, new layout block), first:
1. `ls frontend/src/components/shared/` (if exists) and `ls frontend/src/components/` to enumerate candidates
2. grep all peer pages for existing footer / navbar / hero / CTA / card primitives
3. If a reusable candidate exists → use it (or extract to `shared/` if it lives in a single-page folder today and is about to be reused)
4. If no candidate → still name the new component so a future page can discover it via grep

**Why:** K-035 2026-04-22 — About page shipped a duplicate Footer across K-017 + K-022 because no role had a "check shared inventory first" step. 5 roles × 2 tickets all missed it. General rule: convention alone does not prevent drift; the first pre-implementation step must be an inventory scan.

### Step 1.2: `MEMORY.md` index entry
Append one line to the memory index pointing to the new file.

### Step 1.3: Persona edits (4 files, each is a hard step, not a description)

- **`~/.claude/agents/engineer.md`** — new pre-implementation step: "Before writing any new page-level component, run `ls frontend/src/components/` + grep peer pages for equivalent structure. Record the scan result in the ticket before Edit. Creating a new component without the scan = gate fail."
- **`~/.claude/agents/qa.md`** — new regression step: "Cross-page shared-component consistency spec is mandatory. For every shared component (Footer / NavBar / Hero / etc.), a Playwright spec must assert DOM / visible text equivalence across all routes that render it. Missing spec = QA sign-off withheld."
- **`~/.claude/agents/pm.md`** — new AC-authoring check under Phase Gate: "When drafting PRD AC for any ticket that touches a route, enumerate the shared components expected on that route and write an AC line `the page must use <SharedComponent>` (not just 'the page displays a footer'). Shared-component name missing from AC = AC invalid, cannot release Engineer."
- **`~/.claude/agents/reviewer.md`** — new depth-pass scan: "For any new page-level `.tsx` file, grep the diff for JSX structures that duplicate existing shared components (`<footer>`, `<nav>`, `<header>`, repeated CTA blocks). Duplicate detected + not justified in design doc = Critical finding."

**Phase 1 Gate:** PM confirms memory file + index + 4 persona files all have concrete Edit calls in current session before releasing Phase 2.

## Phase 2 — Shared-component drift audit (D3 expansion, BLOCKING before Phase 3)

### Owner: PM (audit is a requirements / compliance artifact, not implementation)

### Steps

1. **Enumerate shared-component inventory** — list every component in `frontend/src/components/` that is used on ≥2 routes today. Minimum candidates to examine: Footer, NavBar, Hero / PageHeader, CTA card, section wrapper.
2. **Enumerate routes** — `/`, `/about`, `/diary`, `/app` (4 routes minimum; add any future routes present at audit time).
3. **Drift table** — for each (component × route) cell, record status:
   - `shared` — route uses the canonical shared component
   - `inline` — route has a duplicate / inline copy (drift)
   - `missing` — route should render this component but doesn't
   - `n/a` — component is intentionally not on this route (e.g., NavBar on /app per K-030)
4. **Root-cause column** — for every `inline` / `missing` cell, point to the ticket that introduced the drift (K-017 / K-022 / K-030 / etc.) + one sentence on why.

### Audit output

**Path:** `docs/audits/K-035-shared-component-drift.md`

**Format:**
```
# K-035 Shared Component Drift Audit (2026-04-22)

## Inventory
- <component>: <canonical path> — used on <routes>

## Drift table
| Component | /  | /about | /diary | /app | Notes |
|-----------|----|--------|--------|------|-------|
| Footer    | shared | inline (K-017 FooterCtaSection.tsx) | shared | n/a (K-030) | ... |
| NavBar    | ... | ... | ... | ... | ... |
| ...       | ... | ... | ... | ... | ... |

## Drift roster (things Phase 3 must resolve)
1. /about Footer inline → unify to shared
2. <any other drift found>
```

**Phase 2 Gate:** PM confirms every cell has a concrete value (no blanks, no "TBD"); every `inline` / `missing` cell has either a Phase 3 fix line or an explicit "intentional, TD-logged" note with a TD ticket link.

## Phase 3 — Fix implementation (runs only after Phase 0 + 1 + 2 pass)

### 3.1 Architect design doc

**Path:** `docs/designs/K-035-footer-unification.md`

Must cover:
- **Route Impact Table** — per §global-style-rule; every route × decision on Footer rendering
- **Canonical Footer spec** — final path (`components/shared/Footer.tsx`?) + props interface
- **Migration plan** — how AboutPage swaps from `FooterCtaSection.tsx` to shared Footer; what happens to the About-specific CTA copy (does it become a prop? a separate section above Footer?)
- **Other drift resolution** — one subsection per drift row from Phase 2 audit
- **Target-route consumer pre-list** — every page import of Footer (current + after change)

### 3.2 Designer confirmation

Open Pencil frames for `home`, `about`, `diary`, `app` (batch_get), verify Footer spec is consistent across frames. If any frame drifts from the canonical spec, Designer updates the frame (batch_design) and returns `get_screenshot` for PM visual verification. No frame open for a route = Designer flags to PM (Pencil-absent route is acceptable iff design doc explicitly marks route as "no footer" per K-030 pattern).

### 3.3 Engineer implementation

- Swap `/about` to shared Footer (delete or refactor `FooterCtaSection.tsx` per design doc)
- Resolve every other drift row from Phase 2 audit per Architect's migration plan
- Add `frontend/e2e/shared-components.spec.ts` asserting cross-page consistency (DOM / text equivalence for Footer across routes where it appears)
- Per `engineer.md` updated step: record shared-component inventory scan in commit / ticket before Edit

### 3.4 QA regression

- Full Playwright E2E suite (all routes)
- New `shared-components.spec.ts` cross-page assertion passes
- Visual report covers `/`, `/about`, `/diary` Footer side-by-side

### 3.5 Code Review

- Step 1 `/superpowers:requesting-code-review` (breadth)
- Step 2 Agent(reviewer.md) with the new duplicate-JSX scan step applied to this diff
- Any Critical / Warning → Bug Found Protocol on K-035 itself (meta, but necessary)

### 3.6 Deploy

Per project Deploy Checklist. Deploy Record block appended to this ticket before close (executed probe: `curl <live>/assets/index-<hash>.js | grep <Footer-testid>` → exact match).

## Acceptance Criteria

### AC-035-RETRO — Phase 0 retrospectives land before implementation

**Given** the user-reported bug on 2026-04-22 triggers Bug Found Protocol
**When** Phase 0 runs
**Then** `docs/retrospectives/engineer.md`, `pm.md`, `qa.md`, `reviewer.md` each contain one new prepended entry dated `2026-04-22 — K-035`
**And** every entry names a concrete root cause (file:line or decision point) + explains why the role's existing safeguards didn't cover it + proposes a codifiable fix (not "didn't think it through")

### AC-035-MEMORY — Phase 1 memory + persona edits land before Engineer release

**Given** Phase 0 retrospectives signed off by PM
**When** Phase 1 completes
**Then** `~/.claude/projects/-Users-yclee-Diary/memory/feedback_shared_component_inventory_check.md` exists with the generalized rule (not footer-specific)
**And** `MEMORY.md` index has a line pointing to the new memory file
**And** `engineer.md`, `qa.md`, `pm.md`, `reviewer.md` each have at least one new hard step (gate-enforced, not descriptive) diffable against the pre-K-035 version of the persona

### AC-035-AUDIT — Phase 2 drift table is exhaustive

**Given** Phase 1 persona updates land
**When** Phase 2 audit runs
**Then** `docs/audits/K-035-shared-component-drift.md` exists
**And** the drift table has at least 4 shared-component rows × 4 route columns = 16 cells minimum
**And** every cell has a concrete status (`shared` / `inline` / `missing` / `n/a`) — no blanks, no "TBD"
**And** every `inline` and `missing` cell has a root-cause ticket reference + a Phase 3 resolution line (fix or TD)

### AC-035-FOOTER-UNIFIED — /about uses shared Footer

**Given** Phase 3 implementation lands
**When** Playwright navigates to `/about`
**Then** the rendered footer DOM is identical to the footer rendered on `/` and `/diary` (DOM-snapshot equivalence or text + structure assertion, whichever Architect specifies)
**And** `frontend/src/components/about/FooterCtaSection.tsx` is deleted OR refactored into a non-footer component per Architect design doc
**And** `frontend/src/pages/AboutPage.tsx` imports the canonical shared Footer

### AC-035-NO-DRIFT — every drift row from audit is resolved

**Given** the Phase 2 audit drift roster
**When** Phase 3 implementation completes
**Then** every `inline` / `missing` row in the audit table is resolved — either by unification in this ticket or by an explicit TD ticket reference with rationale written into the audit doc
**And** the audit doc is re-run / re-checked at Phase 3 close; no new drift introduced

### AC-035-CROSS-PAGE-SPEC — regression spec prevents recurrence

**Given** Phase 3 Engineer work complete
**When** the Playwright suite runs
**Then** `frontend/e2e/shared-components.spec.ts` exists and asserts Footer DOM / visible text equivalence across `/`, `/about`, `/diary`
**And** the spec is structured so that adding a future shared-component drift (e.g., a new inline NavBar) would cause a failing assertion without spec changes
**And** `/business-logic` is **not** asserted by this spec — the route's Footer import is swapped for compile-only cleanup per Excludes (K-017 defer to K-018); any future `/business-logic` AC work re-adds a cross-route assertion at that time

### AC-035-DEPLOY — deploy + Deploy Record

**Given** all above ACs green
**When** `firebase deploy --only hosting` runs
**Then** a Deploy Record block is appended to this ticket with: deploy date (Asia/Taipei), Git SHA (full 40-char), Hosting URL, bundle hash, executed verification probe (`curl <live>/assets/index-<hash>.js | grep <Footer-identifier>` with captured output), status Live
**And** ticket status moves to `closed`, PRD §3 AC entries migrate to §4 Closed Tickets, PM-dashboard.md row moves to Closed section, `closed: 2026-04-XX` frontmatter filled

## Release Status (live tracking)

- [x] Phase 0 — 4 retrospectives landed
- [x] Phase 1 — memory + 4 personas edited
- [x] Phase 2 — audit doc complete + gate-passed → [`docs/audits/K-035-shared-component-drift.md`](../audits/K-035-shared-component-drift.md) (produced 2026-04-22; 1 Critical + 2 Warning drifts; 1 open product-question OQ-1 flagged for user BQ; no Sacred conflicts — all resolve via "codified-drift spec retires" or "content preserved on new file path")
- [x] Phase 3 — Architect design doc → [`docs/designs/K-035-shared-component-migration.md`](../designs/K-035-shared-component-migration.md) (2026-04-22; ~830 lines; OQ-1 resolved to Option α by weighted scoring 9.7/6.25/5.3; behavior diff 17/0 equivalent across both variants; Route Impact 5 routes / 3 affected / 1 unaffected / 1 isolated; 14 files / 11 Engineer steps; K-021 Sacred `/about 維持 FooterCtaSection` formally retired in design doc §10; architecture.md synced + self-diff; PM Phase Gate 2026-04-22 PASS — Option α ruling + K-021 Sacred retire both approved per `feedback_pm_self_decide_bq.md` priority-1 Pencil source-of-truth signal)
- [x] **Scope clarification 2026-04-22 (PM, retrospective-reviewed):** `/business-logic` is **technical-cleanup-only** per K-017 PM defer decision (daily-diary.md 2026-04-20 L247). `BusinessLogicPage.tsx` Footer import swap is mandatory (otherwise TSC fails when `HomeFooterBar.tsx` is deleted), but the route is **not** AC-verified: no dev-server visual, no Designer Pencil confirmation, no cross-route assertion in `shared-components.spec.ts`. Main-session edits to ticket §Excludes + design doc §3 Step 3 / §5 Route Impact Table / §7.1 spec contract (`homeRoutes = ['/']`, 3 cases) / §8.3 net count / §8.4 dev-server target reviewed by PM and ruled PASS. Residual stale references (§8.3 L473 "4 cases", §9 Step 7 L547 "4 cases", §6 EDIT #14 architecture.md pre-baked Changelog text L667, §10 verification table L802-805) flagged for Architect second-pass sync in the next main-session Architect spawn; these are cross-section consistency fixes, not PM territory. No AC scope expansion introduced; AC-035-CROSS-PAGE-SPEC extended with an explicit "not asserted on /business-logic" And-clause.
- [x] Phase 3 — Designer Pencil confirmation → 2026-04-22 → [`docs/retrospectives/designer.md`](../retrospectives/designer.md) (frames `4CsvQ` home + `35VCj` about aligned with design doc §3 DOM spec; NavBar sanity OK; no Pencil edits required since canonical Footer spec matches existing frames; PM visual-accept captured)
- [x] Phase 3 — Engineer implementation + cross-page spec → 2026-04-22 → HEAD `f7b6aa3` (7 commits Steps 1–11 per design doc §9 Migration Order; `npx tsc --noEmit` exit 0; Playwright 243 passed / 1 skipped / 1 failed [pre-existing K-033]; grep sweep `HomeFooterBar|FooterCtaSection` across `frontend/src/` + `frontend/e2e/` = 0 hits; fail-if-gate-removed dry-run symptom captured in commit `64d080a`)
- [x] Phase 3 — QA regression + visual report → 2026-04-22; Playwright 243 passed / 1 skipped / 1 failed (ga-spa-pageview.spec.ts::AC-020-BEACON-SPA classified pre-existing K-033); `shared-components.spec.ts` 3/3 green in 2.5s; `ga-tracking.spec.ts` AC-018-CLICK 3/3 green; Sacred specs (sitewide-footer / pages.spec.ts L158 / app-bg-isolation AC-030-NO-FOOTER / sitewide-fonts font-mono) all green; grep sweep `HomeFooterBar|FooterCtaSection` = 0 hits; visual report → [`docs/reports/K-035-visual-report.html`](../reports/K-035-visual-report.html) (4 base64 PNGs for /, /app, /about, /diary + /business-logic placeholder per MVP `authRequired`); dev-server multi-viewport spot-check (375/390/414/1280) Footer variant="home" + variant="about" render consistent across breakpoints, /diary + /app Sacred no-Footer preserved, /about email italic+underline (K-022 A-7) preserved. CLEAR for deploy.
- [x] Phase 3 — Code Review (Step 1 + Step 2) passes → 2026-04-22 → [`docs/reviews/K-035-review.md`](../reviews/K-035-review.md) (Step 1 `/superpowers:requesting-code-review` breadth + Step 2 Agent(reviewer.md) depth both verdict READY; 0 Critical / 0 Warning; 3 Minor cosmetic-only non-blocking — M-1 Architect Changelog "4 cases" stale / M-2 `homeRoutes` single-element loop / M-3 `Footer.tsx` JSDoc "outerHTML" wording)
- [x] QA Early Consultation — 2026-04-22 → [`docs/retrospectives/qa.md`](../retrospectives/qa.md) (CLEAR WITH FLAGS; 3 findings forwarded to Engineer via PM — GA click-event AC-visibility gap, AC-035-NO-DRIFT residual naming ambiguity, fail-if-gate-removed dry-run automation optional; mockApis fixture verified sufficient for new spec; §3 17/0 behavior-diff accepted as pure-refactor gate evidence)
- [x] Deploy + Deploy Record block appended → 2026-04-22 → prod deployed (SHA `f7b6aa3`, bundle `assets/index-CtxpPhIH.js`; live probes green — Footer identifier `This site uses Google Analytics` + `yichen.lee.20@gmail.com` both present in live bundle; deleted components `HomeFooterBar`/`FooterCtaSection` confirmed absent from live bundle)

## Retrospective

### PM Summary

K-035 was triggered by user live-site review 2026-04-22 — a duplicate Footer on `/about` (`FooterCtaSection.tsx`) that had survived K-017 + K-022 through 5 roles × 2 tickets of sign-offs. Bug Found Protocol ran all 4 phases within a single session (retrospectives → memory + 4 personas codified → shared-component drift audit with 1 Critical + 2 Warning drifts surfaced + 1 OQ-1 resolved to Option α by weighted scoring → Phase 3 fix landed as 7-commit refactor with full Playwright green + cross-page spec `shared-components.spec.ts` preventing recurrence). Three process-level learnings codified across the session: (1) `feedback_shared_component_inventory_check.md` memory file + 4 persona hard-steps (engineer/qa/pm/reviewer) now force every page-level task to run a shared-component inventory scan before Edit; (2) PM scope-clarification discipline (daily-diary.md K-017 defer decision for `/business-logic`) was re-instantiated mid-ticket via retrospective-reviewed ticket/design-doc sync pattern, logged as repeat violation of `feedback_use_agent_before_self.md`; (3) Architect Changelog pre-bake awareness (main-session noticed cross-section stale references §8.3 / §9 / §6 / §10 in design doc and flagged them as Architect second-pass items, not PM territory). What worked: Bug Found Protocol gave clear phase-ordering discipline; deploy-verification probe (`curl index-CtxpPhIH.js | grep` Footer-identifier + deleted-component-absent) green on first try with no retry cycles. What was learned at process level: convention alone does not prevent drift — the first pre-implementation step on every page-level task must be an inventory scan of `frontend/src/components/`, because a 5-role × 2-ticket miss is diagnostic of missing structural check, not individual role carelessness.

### Cross-role recurring issues

Aggregating Engineer / PM / QA / Reviewer Phase 0 retrospectives reveals one shared structural root cause across all 4 roles: **each role had per-route correctness checks but no cross-route consistency check for page-level composite chrome (Footer / NavBar / Hero / CTA)**. Specifically:

- **Engineer** had `feedback_shared_component_all_routes_visual_check.md` (2026-04-20, post-K-021) but that rule assumes components are already canonical; it does not ask "are there two components serving the same conceptual role?" — K-017 Pass 4 permanently split `HomeFooterBar` + `FooterCtaSection` into "two components, intentionally non-shared," and no subsequent ticket re-evaluated that boundary.
- **PM** had NavBar named explicitly as a shared component in AC-017-NAVBAR but Footer was codified as a page-differentiated inline component across three routes; the K-017 "設計決策紀錄" even contradicted its own AC ("Footer CTA 為全站共用組件" vs three inline footers), and no Phase Gate checked "did this AC name the shared component from `frontend/src/components/`."
- **QA** had route-local AC assertions (text + href + style on `/about` only) but no cross-route DOM-equivalence dimension for shared chrome. Worse, `sitewide-footer.spec.ts` L88–101 actively **codified the drift as intentional** (`/about renders FooterCtaSection, NOT HomeFooterBar`), turning the bug into a test-enforced invariant — QA became a drift-preservation mechanism, not a drift-detection mechanism.
- **Reviewer** Step 2 depth passes on K-017 and K-022 executed "out-of-scope-change detection" (reverse logic — detect touching unlisted files) but never executed "positive structural-chrome duplication scan" (forward logic — detect recreating existing shared structure). Reviewer treated `FooterCtaSection.tsx` as a legitimately new component because the AC didn't forbid it; Reviewer's role definition (beyond-AC structural smell catching) was neutralized by an implicit "AC didn't require it → no Critical" rule.

**Common theme:** convention alone does not prevent drift; the first pre-implementation step (Engineer) / pre-AC-authoring step (PM) / pre-sign-off step (QA) / depth-review step (Reviewer) must be an **inventory scan** that asks "does this conceptual role already have a canonical shared component?" before anything else. This is now codified as a hard gate in 4 persona files + 1 cross-role memory file (`feedback_shared_component_inventory_check.md`).

### Process improvement decisions

| Issue | Responsible Role | Action | Update Location |
|-------|------------------|--------|-----------------|
| Shared Footer duplication (FooterCtaSection vs HomeFooterBar) survived 5 roles × 2 tickets | Cross-role (Engineer / PM / QA / Reviewer) | New hard-gate persona steps + new cross-role memory file + cross-page consistency spec | `~/.claude/agents/engineer.md` (Shared-Component Inventory Scan pre-Edit step), `~/.claude/agents/pm.md` (Shared-component inventory per route AC-authoring gate), `~/.claude/agents/qa.md` (Cross-Page Shared-Component Consistency regression step), `~/.claude/agents/reviewer.md` (Structural Chrome Duplication Scan depth-review step), `~/.claude/projects/-Users-yclee-Diary/memory/feedback_shared_component_inventory_check.md` (new), `frontend/e2e/shared-components.spec.ts` (new) |
| Architect Changelog pre-bake drift (design-doc §6 EDIT #14 architecture.md pre-baked text with "4 cases" stale after `/business-logic` scope-clarification) | Engineer + Architect | Engineer added pre-Step-0 cross-check + flagged stale sections for Architect second-pass sync (§8.3 L473, §9 Step 7 L547, §6 EDIT #14 L667, §10 verification table L802–805) | `docs/retrospectives/engineer.md` 2026-04-22 K-035 entry (Engineer self-caught); Architect second-pass sync scheduled on next Architect spawn |
| `/business-logic` scope confusion (K-017 defer decision per daily-diary.md 2026-04-20 L247 vs K-035 ticket §Excludes ambiguity) | PM | Scope-clarification loop pattern — main session reviewed + flagged mid-stream; PM spawned for review and ruled main-session edits KEEP with AC-035-CROSS-PAGE-SPEC extended with explicit "not asserted on /business-logic" And-clause; repeat violation of `feedback_use_agent_before_self.md` logged | `docs/retrospectives/pm.md` 2026-04-22 K-035 Phase 3 scope clarification entry; ticket §Excludes + AC-035-CROSS-PAGE-SPEC And-clause; no new persona rule — existing rule is globally scoped, fix is main-session discipline |
| K-021 AC-021-FOOTER Sacred clause (`/about 維持 FooterCtaSection`) directly contradicted by K-035 Phase 3 fix (unification to shared Footer) | PM + Architect | Formal retire of K-021 Sacred in K-035 design doc §10; PM ruling documented per `feedback_pm_self_decide_bq.md` priority-1 Pencil source-of-truth signal; Phase Gate gate-passed 2026-04-22 | `docs/designs/K-035-shared-component-migration.md` §10; PRD §2 Sitewide AC annotation (AC-021-FOOTER retired by K-035) |

### Deploy Record

**Deploy date:** 2026-04-22 (Asia/Taipei)
**Git SHA at deploy:** `f7b6aa318b5b69a14f5b0de9c2996e04aa928aef`
**Hosting URL:** https://k-line-prediction-app.web.app
**Bundle hash:** `assets/index-CtxpPhIH.js` (from live probe `curl -s https://k-line-prediction-app.web.app/index.html | grep -oE 'assets/index-[^"]+\.js'`)
**Deploy command:** `firebase deploy --only hosting` (from worktree root `.worktrees/K-035`)

**Executed verification probes (captured 2026-04-22):**

```
$ curl -s https://k-line-prediction-app.web.app/assets/index-CtxpPhIH.js \
    | grep -oE 'yichen\.lee\.20@gmail\.com|This site uses Google Analytics'
This site uses Google Analytics
yichen.lee.20@gmail.com
```
→ Footer identifier (`This site uses Google Analytics` + `yichen.lee.20@gmail.com`) **present** in live bundle, confirming the canonical shared Footer component is rendered in production.

```
$ curl -s https://k-line-prediction-app.web.app/assets/index-CtxpPhIH.js \
    | grep -oE 'HomeFooterBar|FooterCtaSection'
(empty)
```
→ Deleted components (`HomeFooterBar` + `FooterCtaSection`) **absent** from live bundle, confirming the Phase 3 migration landed on CDN and the two duplicate footer files are not shipping.

**Status:** Live
