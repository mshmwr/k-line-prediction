---
id: K-002
title: UI optimization — icons, layout, loading animation
status: closed
type: feat
priority: medium
created: 2026-04-16
closed: 2026-04-18
---

## Background

The current UI lacks icons, the overall layout has insufficient visual hierarchy, and the loading state is just a CSS border-spin animation.
A comprehensive visual quality lift is needed.

## Scope

**In:**
- Icons: introduce an icon library for the NavBar, buttons, Section headings, etc.
- Page layout: spacing, typography, visual hierarchy improvements
- Loading animation: upgrade `LoadingSpinner` to a richer animation
- NavBar link completeness: add the About entry link (`/about`)

**Out:**
- Functional logic changes
- Dark / light theme toggle
- Route name changes (`/business-logic` stays as is; open a separate ticket to discuss)
- Page-transition system rebuild (user said "discuss later", separate ticket)

## Design decision log

| Decision | Content | Source | Date |
|----------|------|------|------|
| NavBar button presentation | Home button: icon only; other functional buttons (App / About / Diary / Logic): text | User confirmed | 2026-04-18 |
| Home icon source | Designer picks a suitable home icon from Lucide; this home icon also serves as the **placeholder** brand identity logo until a proper brand icon is designed | User confirmed (corrected) | 2026-04-18 |
| Brand icon design | Deferred; the home icon (Lucide) currently stands in as brand identity, not within K-002 scope | User confirmed (corrected) | 2026-04-18 |
| Logic link presentation | "Logic" text + Lock icon side by side (**text on the left, icon on the right**), **always shown** regardless of login state; this is existing design and Designer must not remove the Lock icon | User confirmed (requirement correction) | 2026-04-18 |
| Logic link route | href maps to existing `/business-logic`, route unchanged; design-spec `/logic` is treated as a typo, Engineer follows the existing route | PM ruling (raised by Architect) | 2026-04-18 |
| About link entry | NavBar adds an About link (href: `/about`), in K-002 implementation scope; user confirmed "do change" | PM ruling (user addition) | 2026-04-18 |
| Page-transition system | K-002 does not touch the page-transition system; user said "discuss later", separate new ticket | PM ruling (user addition) | 2026-04-18 |

## Status

**Releasing to Engineer.** PM has ruled on all blocking questions (2026-04-18): route stays as `/business-logic`, NavBar adds About link, page-transition system deferred to a new ticket. Design specs are complete, all ACs confirmed, Engineer can begin implementation.

## Acceptance Criteria

Full AC defined in [PRD.md — UI optimization Backlog](../../PRD.md).

### AC-002-NAV: NavBar link completeness

**Given** any page has finished loading
**When** the user sees UnifiedNavBar
**Then** NavBar contains the following links: Home (icon only), App, About, Diary, Logic
**And** About link's href is `/about`
**And** Logic link's href is `/business-logic` (route unchanged)
**And** Logic link is shown as "text on the left, Lock icon on the right" persistently

---

### AC-002-ICON: Icon Library introduction

**Given** the frontend has installed an icon library (specific choice up to Designer, e.g. Heroicons / Lucide)
**When** the user loads any page
**Then** UnifiedNavBar's home icon uses the icon library's home icon (replacing the existing ⌂ Unicode symbol)
**And** PredictButton's icon explicitly uses Lucide `Play` icon (replacing the existing ▶ Unicode symbol)
**And** SectionHeader's section headings use semantically matching icon-library icons
**And** all icons render crisply on Retina / high-DPI screens with no aliasing

**Given** the icon library is installed
**When** an engineer adds an icon
**Then** they can use it via a single-package import without manually managing SVG files

### AC-002-LAYOUT: Layout optimization

**Given** the user visits `/` (home) or `/app` (predict)
**When** the page loads
**Then** spacing between page sections (section padding / gap) is consistent and matches the design spec
**And** the primary text hierarchy is clear: heading / subheading / body / caption — four typography levels are visually distinguishable
**And** interactive elements (buttons, inputs) have sufficient touch targets (min 44×44px)

**Given** the user visits on a mobile device (viewport ≤ 768px)
**When** the page loads
**Then** content does not overflow the screen width
**And** visual hierarchy matches desktop (no element overlap or text truncation)

### AC-002-LOADING: Loading animation upgrade

**Given** the user clicks PredictButton to trigger a prediction request
**When** the API request is in progress (loading state)
**Then** LoadingSpinner shows an animation with more visual quality than border-spin (specific design up to Designer, e.g. pulse, skeleton, multi-ring)
**And** the animation is smooth, with no jank or flicker

**Given** the prediction request completes or fails
**When** the loading state ends
**Then** LoadingSpinner disappears immediately, no residual
**And** the page smoothly transitions to result or error state (no visible jump)

## Tech debt

| Item | Description | Priority | PM ruling | Ruling date |
|------|------|--------|---------|---------|
| AppPage.test.tsx 2 pre-existing failures | `shared timeframe toggle` and `display mode toggle` cannot find buttons in the JSDOM environment; unrelated to K-002, a JSDOM environment limitation. Does not affect Playwright E2E coverage. | Low | Filed as tech debt, no new ticket; JSDOM environment fixes deferred until needed | 2026-04-18 |
| AC-002-ICON Playwright coverage insufficient | Existing spec only verifies "icon library is usable", does not assert each of the 8 SectionHeader icons individually; this is the test gap behind CRITICAL-1's root cause. | Medium | Filed as tech debt; the next UI-changing ticket adds the assertions | 2026-04-18 |
| ARIA role has no Playwright assertion | E2E has no coverage for `role="status"` / `aria-label`; this is the test gap behind CRITICAL-2's root cause. | Medium | Filed as tech debt; recommend adding accessibility assertions when AC-002-LOADING is verified | 2026-04-18 |

## Related links

- [PRD.md — UI optimization Backlog](../../PRD.md)
- [PM-dashboard.md](../../../PM-dashboard.md)

---

## Retrospective

### Architect retrospective

**Where most time was spent:** Assessing the impact of fully removing the `isLoggedIn` prop — needed to confirm one by one all pages using NavBar; but this assessment lived only in the design doc, not deeply enough, and the missing About link href spec slipped through.

**Judgment that needed correction:** The About link entry was originally not included in the design scope and was only caught at Code Review and added back; this missing spec should have been intercepted when Architect reviewed the PRD.

**Next time improvement:** When verifying the design doc, line-by-line cross-check the AC about "what links does NavBar contain"; can't only look at the prop interface; every URL path written in AC must have a confirmed href in the design spec.

---

### Engineer retrospective

**Misjudged AC:** AC-002-ICON's And 3 (SectionHeader's section headings use icons) — the And condition was missed during implementation, only caught at Code Review. Cause: when reading AC, habitually skipped "And" clauses and only looked at "Then".

**Unforeseen edge:** `LoadingSpinner`'s `role="status"` attribute — was deleted during integration without realizing this would break ARIA semantics, and there was no corresponding test to intercept it. `business-logic.spec.ts` and `pages.spec.ts` were not updated to follow the component change — a systemic omission.

**Next time improvement:** Before implementing, list every Then/And one by one (not just Then), and write a Playwright assertion per And; immediately after a component change, grep all test files referencing that component to confirm whether selectors need to be synced.

---

### Code Reviewer retrospective

**Issues that should have been intercepted earlier in the process:**
- SectionHeader icon (AC-002-ICON And 3) is in black and white in the ticket AC; Engineer's omission could have been intercepted at AC verification; Code Reviewer catching it at review means the AC verification step (PM Gate Check) did not do line-by-line And cross-checking.
- The removal of `role="status"` is an accessibility-spec issue; if the Architect design doc had clear ARIA specs, Engineer would not have easily missed it; this issue's root is at the design layer.

**Next time improvement:** During Review, do a dedicated checklist for ARIA-related attributes (`role`, `aria-label`, `aria-live`); and before review, scan AC's And clauses line by line, not just the diff.

---

### QA retrospective

**Insufficiencies in regression test design:**
- Existing AC-002-ICON Playwright spec only verifies "icon library is usable" and does not individually assert each of the 8 SectionHeader icons; this test gap is the direct reason CRITICAL-1 (SectionHeader icon implementation missing) passed CI.
- The removal of `role="status"` was not intercepted by E2E because E2E has no ARIA-role assertions; this is the test-gap root cause of CRITICAL-2.

**Edges not covered:** The grep search range did not include all tests referencing SectionHeader, so `business-logic.spec.ts` and `pages.spec.ts` were not pulled into the regression scan.

**Next time improvement:** For every AC with a UI icon, QA must write an independent assertion per icon (`getByTestId` or `getByRole`); ARIA attributes (`role`, `aria-label`) become part of the standard E2E assertion checklist.

---

### PM Summary

**Cross-role recurring issues:**
1. **Systemic neglect of And clauses**: Architect design verification, Engineer implementation, and QA testing — all three roles failed to thoroughly check AC's And conditions, and the same SectionHeader icon issue was missed by all three roles, only finally intercepted at Code Review.
2. **ARIA spec gap**: design doc did not include ARIA attribute spec; Engineer and QA had nothing to reference, and the same `role="status"` issue was deleted at the implementation layer and not covered at the test layer.
3. **Visual verification depending on JSON structure**: PM did not explicitly mark "visual verification requires get_screenshot to count as complete" after Designer output, leading to a visual blind spot in design verification.

**Process improvement decisions:**

| Issue | Owner | Action | Update location |
|------|---------|------|---------|
| Systemic And-clause omissions | PM / Engineer / QA | PM gate check adds a mandatory step "line-by-line And cross-check"; QA must have a corresponding assertion for each And | CLAUDE.md Engineer/QA section; pm.md Phase Gate list |
| ARIA spec gap | Architect | Design doc adds an "ARIA spec" field (role, aria-label, aria-live); Code Reviewer adds an ARIA checklist | K-Line CLAUDE.md Architect section |
| Visual verification blind spot | PM | After Designer completes, PM explicitly declares the visual verification gap; cannot substitute JSON structure for screenshot confirmation | pm.md Phase Gate list (already has `get_screenshot` rule, strengthen wording) |
| SectionHeader icon test gap | QA | Tech debt is recorded (AC-002-ICON Playwright coverage insufficient); the next UI-changing ticket adds the assertions | K-002 tech debt (filed) |
