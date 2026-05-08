---
id: K-014
title: Vitest index-based selector residual cleanup (AppPage + OHLCEditor)
status: backlog
type: test
priority: low
created: 2026-04-18
source: docs/tickets/K-010-vitest-apppage-fix.md#reviewer-warnings-w1-w2
td: TD-009
---

## Background

K-010 senior-engineer review raised Warnings W1 / W2: aside from the two failing tests already fixed by K-010, there are still 5 places using the `getAllBy...()[N]` index-based selector form that have not been cleaned up. Not red at the moment (out-of-scope + UI unchanged), but they belong to the same class of issue as AC-010-ROBUST. Tracked as TD-009 and addressed in the background by this ticket.

## Scope

**In:**
- `frontend/src/__tests__/AppPage.test.tsx` lines 66 / 86 / 89 / 92 — switch to `getByLabelText` / `getByRole({ name, exact })` / `data-testid`
- `frontend/src/__tests__/OHLCEditor.test.tsx` line 25 — same class of change
- If `data-testid` or `aria-label` needs to be added → touch the corresponding component, and synchronously add an accessible name (a11y consideration)

**Out:**
- Other test files (if Engineer discovers more residuals of the same class during implementation, fold them into the consolidated fix in this ticket)
- Component behavior changes — pure test refactor + accessibility attribute reinforcement

## Acceptance Criteria

### AC-014-SELECTOR: no index-based selector

**Given** `frontend/src/__tests__/`
**When** running `grep -rn "getAllBy.*\[\d\]" frontend/src/__tests__/`
**Then** there are no results
**And** if `getAllBy` must be used, pair it with filter/find plus a semantic assertion, not `[N]`

### AC-014-GREEN: Vitest suite all green

**Given** the modified test files
**When** running `npm test -- --run`
**Then** all tests pass, exit 0

### AC-014-REGRESSION: tsc / E2E no regression

**Given** the full frontend check
**When** running `npx tsc --noEmit` and `/playwright`
**Then** tsc exits 0
**And** Playwright E2E all pass

## Priority Rationale

**low** — current suite is all green, does not block merge gate; cost is low but immediate value is none; recommended to fold this in the next time the OHLCEditor / AppPage upload region undergoes a structural change. If a background idle cycle is available, it can be cleared directly.

## Next Step

Backlog — queued behind K-009 / K-011 / K-012 / K-013, scheduled by PM into Architect / Engineer based on cycle capacity.

## Related Links

- [TD-009](../tech-debt.md#td-009--vitest-index-based-selector-residual)
- [K-010 Review Warnings](./K-010-vitest-apppage-fix.md#retrospective)
