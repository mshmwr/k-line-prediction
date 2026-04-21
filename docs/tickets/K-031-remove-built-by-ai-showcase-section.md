---
id: K-031
title: /about page — remove "Built by AI" showcase section (S7)
status: closed
type: fix
priority: high
created: 2026-04-21
closed: 2026-04-21
---

## Background

The `/about` page currently contains a "Built by AI" showcase section (S7 — `SectionContainer id="banner-showcase"`), rendered by `BuiltByAIShowcaseSection.tsx`. This section contains:

- Heading: "Built by AI"
- Subtitle: "The homepage banner — a thin strip above the hero — leads recruiters into this page."
- An inline mockup of the `BuiltByAIBanner` (dark background, "One operator. Six AI agents. Every ticket leaves a doc trail.")
- Caption: "The real banner is clickable and navigates to /about via SPA routing (no full-page reload)."

The user has decided this explanatory section is not needed and should be removed from both the Pencil design spec and the codebase.

## Scope

Two deliverables:

1. **Pencil design file** — remove the "Built by AI" section (S7) from the `/about` frame in the `.pen` design spec. Assigned to: **Designer agent**.

2. **Codebase** — remove the section from the production code. Assigned to: **Engineer agent**. Files to modify:
   - `frontend/src/pages/AboutPage.tsx` — remove the S7 `SectionContainer` block (lines 71–74) and the `import BuiltByAIShowcaseSection` statement (line 10)
   - `frontend/src/components/about/BuiltByAIShowcaseSection.tsx` — delete the file

**Not included:**
- `frontend/src/components/home/BuiltByAIBanner.tsx` — the real homepage banner; remains untouched
- Any changes to the 5 numbered section labels (Nº 01–05) on `/about`
- Any changes to `FooterCtaSection` (S8)
- K-029 scope (ArchPillarBlock.tsx / TicketAnatomyCard.tsx CSS token fix)

## Route / Component Existence Verification (PM gate)

Verified at ticket open (2026-04-21):

| Item | Path | Status |
|------|------|--------|
| Component to remove | `frontend/src/components/about/BuiltByAIShowcaseSection.tsx` | Confirmed exists |
| Page file | `frontend/src/pages/AboutPage.tsx` | Confirmed exists |
| S7 block in AboutPage | `SectionContainer id="banner-showcase"` lines 71–74 | Confirmed exists |
| Import to remove | `import BuiltByAIShowcaseSection` line 10 | Confirmed exists |

## E2E Spec Impact

No existing E2E spec directly asserts the `/about` showcase section content:

- `about.spec.ts` — `AC-017-BANNER` tests (`One operator. Six AI agents.`) navigate to `/` (homepage), not `/about`. **Not affected.**
- `pages.spec.ts` — `AC-023-REGRESSION` banner assertion is also on `/` homepage. **Not affected.**
- `about-v2.spec.ts` — asserts 5 section labels (`Nº 01` through `Nº 05`); no Nº 06 or "Built by AI" assertion. **Not affected.**

Engineer must confirm the full test suite still passes after removal.

## QA Early Consultation

**QA Early Consultation: N/A — all ACs are happy-path removal assertions (section absent from DOM, no layout gaps). No error state / boundary / network / auth edge case.**

## Acceptance Criteria

### AC-031-SECTION-ABSENT: "Built by AI" section is not present on /about `[K-031]`

**Given** the user navigates to `/about`
**When** the page finishes loading
**Then** no element with `id="banner-showcase"` exists in the DOM
**And** no heading with text "Built by AI" exists anywhere on the page
**And** no text matching "The real banner is clickable and navigates to /about" is present in the DOM
**And** the `BuiltByAIShowcaseSection` component file has been deleted from the codebase (`frontend/src/components/about/BuiltByAIShowcaseSection.tsx` no longer exists)

**Playwright test case count:** 1 independent test case asserting all four conditions above.

---

### AC-031-LAYOUT-CONTINUITY: No layout gap between S6 and footer `[K-031]`

**Given** the user is on `/about` after S7 is removed
**When** the user scrolls past the Project Architecture section (Nº 05)
**Then** the `FooterCtaSection` (`SectionContainer id="footer-cta"`) immediately follows the architecture section without a visible empty gap
**And** `SectionContainer id="banner-showcase"` does not exist in the DOM
**And** the overall page scroll height is reduced (section was removed, not hidden)

**Playwright test case count:** 1 independent test case confirming the `footer-cta` section is visible after the `architecture` section and `banner-showcase` is absent.

---

### AC-031-K022-REGRESSION: K-022 and K-017 existing assertions not broken `[K-031]`

**Given** K-022 and K-017 Playwright assertions were all PASS before this ticket
**When** this ticket's code changes are applied
**Then** all assertions in `about-v2.spec.ts` (AC-022-*) remain PASS — specifically:
  - `AC-022-SECTION-LABEL`: all 5 section labels (`Nº 01` through `Nº 05`) still visible (S7 had no section label)
  - `AC-022-DOSSIER-HEADER`: dossier header bar still present
  - `AC-022-FOOTER-REGRESSION`: FooterCtaSection still present at bottom of page
**And** all assertions in `about.spec.ts` (AC-017-*) remain PASS — specifically:
  - `AC-017-BANNER` banner tests on `/` homepage are unaffected (banner component not removed)
**And** `npx tsc --noEmit` exits 0

**Playwright test case count:** Covered by existing regression suite — no new test cases required; Engineer confirms suite passes after removal.

---

**AC total: 3 ACs, 2 new Playwright test cases + 1 regression suite confirmation.**

## Parallel Given Quantification

AC-031-K022-REGRESSION references 3 parallel Given clauses in about-v2.spec.ts (AC-022-SECTION-LABEL, AC-022-DOSSIER-HEADER, AC-022-FOOTER-REGRESSION). These are covered by **existing test cases** — no new independent cases required. The regression AC is satisfied by a full suite pass confirmation.

## Release Order

1. **Designer** — remove S7 from Pencil `.pen` design file; output `get_screenshot` to confirm
2. **Engineer** — remove S7 block from `AboutPage.tsx`, delete `BuiltByAIShowcaseSection.tsx`, run `tsc + Playwright`
3. **PM** — accept both deliverables, confirm ACs PASS

## Release Status

**2026-04-21: Ticket opened. Designer should be invoked first (Pencil removal), then Engineer (code removal).**

## Retrospective

**2026-04-21 — K-031 close summary**

- **What went well:** Pure-removal ticket executed cleanly across all 6 roles with zero Critical / Warning findings. Design doc §7 pre-verified `SectionContainer` emits `<section>` before Engineer wrote `nextElementSibling` adjacency selector — no AC↔implementation drift. PM Route/Component Existence Verification (ticket header table) eliminated Architect §0 Scope Questions; Architect's cross-file grep surfaced 3 pre-existing architecture.md drift points (L13/L140/L410) carried over from K-017 Pass 3 and fixed in the same commit. Reviewer depth pass found 0 Critical / 0 Warning / 4 Info; all 4 adjudicated fix-now (1) / no-action (3) via Arbitration matrix.
- **What went wrong:** Pencil MCP `Failed to connect` during Designer execution — visual `get_screenshot` impossible. Designer fell back to JSON grep + schema validation + structural diff; no persona rule existed for this fallback so each subsequent step (Engineer / Reviewer / QA / PM) had to independently re-rule on acceptability. Worktree `.worktrees/K-031/` lacked `frontend/node_modules/` on checkout — Engineer wasted one round on npx tsc "This is not the tsc command" false error before running `npm install` (logged to engineer.md improvement).
- **Next time improvement:** (1) If Pencil MCP offline recurs on a 2nd ticket, codify a "pure-removal + JSON valid + grep zero-residual → screenshot waived" exception rule into `~/.claude/agents/designer.md`. Single-event K-031 does not meet the evidence bar yet (per `feedback_new_rule_needs_session_evidence`). (2) Engineer persona will add worktree-init `npm install` check to Pre-Implementation Checklist (engineer already committed to this in engineer.md retro). (3) PM gate "Route / component / file path existence verification" proved its value again — keep it mandatory for every ticket open.
- **Accepted 2026-04-21** by PM per ACCEPT matrix (3/3 AC PASS, 95 passed / 1 skipped / 0 failed, tsc exit 0, 6 role retros written, architecture.md drift fixed). Deploy + branch merge follow.
