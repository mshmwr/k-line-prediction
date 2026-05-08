---
id: K-012
title: business-logic.spec.ts test name and assertion alignment
status: open
type: test
priority: low
created: 2026-04-18
source: docs/reviews/2026-04-18-code-review.md#p3-one-playwright-test-passes-but-does-not-verify-what-it-claims
---

## Background

Codex code review on 2026-04-18 flagged that one test in `frontend/e2e/business-logic.spec.ts` has a name implying it verifies "the lock icon on the Logic link disappears after login", but the actual assertions only check:

- Logic link is visible
- Content renders

The test passes, but its semantics do not match its name, creating false confidence.

## Scope

Engineer picks one of the following:

- **Option A (recommended):** keep the test name and add the "lock icon disappears after login" assertion
- **Option B:** rename the test to describe what is actually asserted (e.g. `"logged-in user can view Logic link and secret content"`), without adding new assertions

**Option A recommended:** the behavior described by the name is the actual requirement of AC-NAV-5 (K-005); adding the assertion also strengthens E2E coverage of that AC.

**Out of scope:**
- Cleanup of other Playwright specs

## Expected file changes

- `frontend/e2e/business-logic.spec.ts`

## Acceptance Criteria

### AC-012-ALIGN: test name and assertions are semantically aligned

**Given** the test in `business-logic.spec.ts`
**When** reading the test name and body
**Then** the behavior described by the name corresponds exactly to the actual assertions
**And** there is no mismatch where "the name claims A but the test only verifies B"

### AC-012-PASS: Playwright E2E all green

**Given** the frontend
**When** `/playwright` is executed
**Then** all 45+ tests pass (including assertions added or updated by this ticket)

## Priority rationale

**low** — neither a regression nor a correctness issue, this is a test-quality concern. Can be handled in the same sprint as K-011 or K-013; does not need a dedicated cycle.

## Next handoff

Engineer. Recommend bundling this cycle with K-009/K-010/K-011.

## Related links

- [Code Review](../reviews/2026-04-18-code-review.md#p3-one-playwright-test-passes-but-does-not-verify-what-it-claims)
- [AC-NAV-5 K-005](../../PRD.md#ac-nav-5-business-logic-link-auth-state-k-005)

---

## Architecture Review

**Decision: no Architecture review needed** — reviewed by senior-architect on 2026-04-18.

**Rationale:**
- Change scope: a single test in `frontend/e2e/business-logic.spec.ts` (Option A adds an assertion or Option B renames it)
- No cross-layer, interface, or component changes
- The Option A / B choice is a "test-quality decision" that Engineer / QA can make within ticket scope

**Architect agrees with the Option A recommendation** for the reason listed in the ticket: adding the assertion strengthens AC-NAV-5 E2E coverage and is the higher-value option.

**Engineer cleared to proceed.**

— senior-architect, 2026-04-18
