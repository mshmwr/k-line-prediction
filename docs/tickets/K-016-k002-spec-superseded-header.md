---
id: K-016
title: Add superseded header to K-002 component spec (LoadingSpinner copy)
status: backlog
type: docs
priority: low
created: 2026-04-18
source: docs/tickets/K-011-loading-spinner-label.md#pm-ruling-review-suggestions-2026-04-18 (Drift B)
---

## Background

K-011 changed `LoadingSpinner` from a fixed `Running prediction...` string to a `label?: string` prop, but `docs/designs/k002-component-spec.md:99,111` still describes the old behavior.

This spec is a design snapshot from the K-002 timepoint; rewriting its content would distort the historical record. The correct treatment is to add a "Superseded by K-011" header so future readers know that section no longer reflects the current implementation.

## Scope

**In scope:**
- Add a single annotation line at the top of `docs/designs/k002-component-spec.md` (after the frontmatter / before the body):
  ```
  > **Note:** Portions of this spec describing `LoadingSpinner` (lines 99, 111) are superseded by [K-011](../../tickets/K-011-loading-spinner-label.md) on 2026-04-18. Spec content preserved as a K-002 design snapshot.
  ```
- Do not modify the original content at lines 99 / 111

**Out of scope:**
- Scanning other archived specs for similar drift (file new tickets case-by-case if discovered later)
- Defining a "general annotation convention for archived specs" (process improvement, outside this ticket's scope)

## Acceptance Criteria

### AC-016-HEADER: superseded header exists with correct link

**Given** `docs/designs/k002-component-spec.md`
**When** the file is read
**Then** a superseded header appears after the frontmatter
**And** the relative path to K-011 inside the header resolves correctly in a Markdown viewer (`../../tickets/K-011-loading-spinner-label.md`)
**And** the original content at lines 99, 111 remains unchanged

## Priority Rationale

**low** — pure documentation change, no code / UX impact. But leaving it unaddressed lets future agents reading the spec trust outdated behavior, so it is logged rather than discarded. Sorted at the tail of the backlog; any maintenance session can knock it out.

## Next Step

Awaiting scheduling. Hand directly to Engineer (single file, single-line Edit, no architecture decisions).

## Related Links

- [K-011 LoadingSpinner label prop](./K-011-loading-spinner-label.md)
- [K-002 UI optimization ticket](./K-002-ui-optimization.md)
