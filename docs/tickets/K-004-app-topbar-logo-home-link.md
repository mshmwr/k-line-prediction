---
id: K-004
title: /app TopBar logo click returns to Home
status: superseded
superseded-by: K-030
superseded-date: 2026-04-21
type: feat
priority: medium
created: 2026-04-16
---

## ⚠️ SUPERSEDED BY K-030 (2026-04-21)

**Supersede reason:** K-030 removes UnifiedNavBar from `/app` page and opens `/app` in a new browser tab. With no NavBar on `/app`, the TopBar logo-click-to-Home premise of K-004 no longer exists. Users naturally return to the marketing site by closing the `/app` tab; a dedicated Home link is redundant.

**Action:** No work required on this ticket. Close as superseded.

## Background

After entering `/app`, users have no obvious path back to the Landing Page (`/`).
Other pages (`/about`, `/diary`) have a "← Home" link in the NavBar, but the `/app` TopBar only has a logo + badge with no entry point back to the home page.

## Decision

Clicking the logo ("K-Line Predictor") navigates to `/`.
Adopting the industry convention (logo = home link); no extra text link is added to the TopBar in order to save space.

## Scope

**In:**
- Change the `/app` TopBar logo text into a clickable `<Link to="/">`
- Hover style indicates clickability (cursor-pointer, slight opacity change)

**Out:**
- Other pages' NavBar (already has "← Home")
- Modifications to other TopBar fields

## Acceptance Criteria

**AC-K004-1: Logo click navigates to Home**

**Given** the user is on the `/app` page
**When** clicking the "K-Line Predictor" logo at the top-left of the TopBar
**Then** the page navigates to `/` (Landing Page)
**And** no full-page reload occurs (SPA routing)

**AC-K004-2: Hover style**

**Given** the user is on the `/app` page
**When** hovering the mouse over the logo
**Then** the cursor displays as a pointer, and the logo has an opacity or color change

## Related Links

- [PM-dashboard.md](../../../PM-dashboard.md)
- [Design — homepage.pen, App /app section](../../frontend/design/homepage.pen)
- [K-030 — /app page isolation](./K-030-app-page-isolation.md) (supersede source for this ticket)

---

## Retrospective

### PM — 2026-04-21

**Supersede decision:** K-030 removes NavBar + Footer from `/app` and opens `/app` in a new tab. With no NavBar, the TopBar logo-click-to-Home UX need is dissolved — closing the tab replaces the Home link. Superseded without implementation work.

**Lesson:** K-004 assumed `/app` is part of the marketing site chrome (same as `/about`, `/diary`). K-030 reframed `/app` as an isolated tool surface, which dissolved the "return-to-Home" UX need entirely. Future: when a navigation-related ticket depends on "page X shares chrome with page Y," explicitly state the chrome-sharing assumption so it can be re-validated when page role changes.
