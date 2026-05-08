---
id: K-005
title: Unified NavBar — all pages
status: closed
type: feat
priority: high
created: 2026-04-16
supersedes: K-004
---

## Background

Each page's NavBar design is inconsistent, making cross-page navigation hard for users:
- Homepage `/`: 3 links (Home / App / Business Logic), missing About and Diary
- About `/about`: logo + `← Home`
- Diary `/diary`: logo + `← Home`
- Business Logic `/business-logic`: logo + `← Back to App`
- App `/app`: TopBar (entirely different design language)

K-004 (`/app` logo click goes back to Home) is subsumed by this ticket; K-004 will close once this ticket lands.

## Decision

All 5 pages use the exact same NavBar — one set for desktop, one for mobile.
Design source: [homepage.pen](../../frontend/design/homepage.pen) — `NavBar — Revised` series of frames (x=7600)

**Desktop (≥ 768px):**
- Left: K-LINE PREDICTION logo (IBM Plex Mono, 16px, 700)
- Right: ⌂ (14px) | App | About | Diary | Logic 🔒 (purple)
- Height 72px, background #111827, horizontal padding 120px

**Mobile (< 768px):**
- Left: ⌂ icon (18px, white, clickable → `/`)
- Right: App | About | Diary | Logic 🔒 (11px)
- Height 56px, background #111827, horizontal padding 16px

## Scope

**In:**
- All 5 pages (`/`, `/app`, `/about`, `/diary`, `/business-logic`) switched to a unified NavBar component
- Extract a shared `<UnifiedNavBar>` component referenced by each page
- Desktop hover styling: cursor-pointer; the active page link is highlighted (white; others gray)
- Business Logic link keeps the auth gate (logged-out → purple lock icon; logged-in → normal link)

**Out:**
- Page layout changes outside the NavBar
- Other fields in the App `/app` internal TopBar utility bar

## Acceptance Criteria

**AC-NAV-1: desktop NavBar unified**

**Given** the user visits any page (`/`, `/app`, `/about`, `/diary`, `/business-logic`)
**When** the page loads with viewport ≥ 768px
**Then** the NavBar shows: logo "K-LINE PREDICTION" on the left and links ⌂ / App / About / Diary / Logic 🔒 on the right
**And** no layout shift or NavBar absence occurs

**AC-NAV-2: mobile NavBar unified**

**Given** the user visits any page with viewport < 768px
**When** the page loads
**Then** the NavBar shows: ⌂ icon on the left and links App / About / Diary / Logic 🔒 on the right
**And** there is no hamburger menu and no horizontal scroll

**AC-NAV-3: ⌂ goes to home**

**Given** the user is on any page
**When** the ⌂ icon is clicked (right-side link on desktop, or left-side icon on mobile)
**Then** the page navigates to `/` without a full reload (SPA routing)

**AC-NAV-4: each link routes correctly**

**Given** the user is on any page
**When** a NavBar link is clicked
**Then** App → `/app`, About → `/about`, Diary → `/diary`, Logic 🔒 → `/business-logic`
**And** no full reload occurs

**AC-NAV-5: current page link highlighted**

**Given** the user is on a given page
**When** the page loads
**Then** the corresponding NavBar link is shown in white (active) and the others in gray

**AC-NAV-6: Business Logic link auth state**

**Given** the user is not logged in
**When** they look at the NavBar
**Then** the Logic 🔒 link shows the lock icon and clicking it routes to `/business-logic` (the auth gate page)
**And** when logged in, the Logic link is normal and clicking it directly shows the content

## Related links

- [PM-dashboard.md](../../../PM-dashboard.md)
- [Design source homepage.pen](../../frontend/design/homepage.pen)
- [K-004](./K-004-app-topbar-logo-home-link.md) (closes after this ticket lands)
