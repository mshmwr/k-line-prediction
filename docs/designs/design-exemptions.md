# Design Exemptions — Routes intentionally without Pencil frames

Registry of routes / surfaces that have **no corresponding Pencil frame** by intentional design decision. Architect persona Q7c rule forbids producing a design doc for a route without Pencil frames UNLESS that route is listed here.

Any new route or page added to the codebase that does not have a Pencil frame must land here with a linked ticket and explicit rationale. Otherwise PM blocks Architect at design-doc review and pushes back to Designer.

---

## Exemption table

| Route | Ticket | Rationale | Exempt since |
|-------|--------|-----------|--------------|
| `/app` | [K-030](../tickets/K-030-app-page-isolation.md) | `/app` is a standalone prediction tool — isolated viewport, no NavBar, no Footer, non-paper bg. Marketing-site design system (Pencil `homepage-v2.pen`) does not apply; tool UX uses its own ad-hoc layout decided per-feature. No sitewide visual contract. | 2026-04-21 |

---

## Governance

- Adding a row: PM approves via ticket linking here; Designer does not need to draw a frame for exempt routes.
- Removing a row (i.e. a route leaves exemption): PM requires Designer to produce a Pencil frame first, then the exempt row is deleted in the same commit.
- Reviewer persona Pencil-parity Step 2: exempt routes skip Pencil-parity check (but full Playwright / DOM parity still applies).
