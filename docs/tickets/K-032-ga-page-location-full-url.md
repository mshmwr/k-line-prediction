---
id: K-032
title: GA4 page_location field should send full URL (fix pre-existing bug, pathname → full URL)
status: backlog
type: bug
priority: low
size: S
created: 2026-04-22
updated: 2026-04-22
qa-early-consultation: N/A — single-field bug fix with matching AC; no edge case surface expected at Architect handoff. Will revisit if Architect design surfaces multi-path deps (e.g. SSR, custom domain override).
---

## Background

K-020 QA Early Consultation (2026-04-22) Challenge #15 found that `frontend/src/hooks/useGAPageview.ts` calls `trackPageview` with `page_location` set to `location.pathname` (e.g. `/about`), but GA4 Measurement Protocol convention for the `page_location` field is the **full URL** (e.g. `https://k-line.example.com/about`).

This bug was not introduced by K-018 or K-020; it predates K-018. K-020's scope is "test hardening" and does not mix in production bug fixes, so this ticket is opened separately to track it.

## Goal

- Fix the `useGAPageview` and `trackPageview` call chain so the `page_location` field sends the full URL (protocol + host + path + query)
- Update the `page_location === '/about'` style hard-coded fragments in AC-020-SPA-NAV and AC-020-BEACON-* assertions to verify the full URL (or use a regex match)
- Ensure the Page location field shown in GA4 Realtime / Reports follows GA4 convention and is no longer a bare pathname

## Scope

**In scope:**
- `frontend/src/hooks/useGAPageview.ts` — change `location.pathname` to `window.location.href` or equivalent full URL construction
- `frontend/src/utils/analytics.ts` — if `trackPageview` signature needs adjusting to distinguish pathname from location, update accordingly
- `frontend/e2e/ga-tracking.spec.ts` + the spec added by K-020 — update `page_location` assertions to use full URL or regex
- Sync PRD.md AC section

**Out of scope:**
- Changes to the `page_path` field (its convention is pathname; no change needed)
- GA4 property settings changes
- Custom domain or SSR scenarios (the project is currently a pure SPA, where `window.location.href` is the production URL)

## AC

**AC-032-PAGE-LOCATION-FULL-URL:** the `page_location` field value is the full URL
- **Given:** a user on any route (`/` / `/about` / `/diary` / `/app`), `window.location.href` is the full URL (protocol + host + path + optional query/hash)
- **When:** `useGAPageview`'s `useEffect` fires `trackPageview`
- **Then:** the Arguments-object entry[2].page_location pushed to `window.dataLayer` must equal `window.location.href` (full URL)
- **And:** must not be `location.pathname` (bare path) or `location.origin + pathname` (missing query/hash)

**AC-032-SPEC-SYNC:** existing K-020 / K-018 related E2E assertions are updated in sync
- **Given:** K-020 has shipped and the spec contains the hard-coded `page_location === '/about'`
- **When:** this ticket lands
- **Then:** the relevant spec must be changed to verify the `window.location.href` value (or match a regex `/\/about(?:\?|#|$)/`)
- **And:** all Playwright GA tracking specs must pass

**AC-032-NO-REGRESSION:** does not break existing K-018 / K-020 ACs
- **Given:** K-018 AC-018-PAGEVIEW and K-020 AC-020-SPA-NAV / AC-020-BEACON-* have all passed
- **When:** this ticket's implementation lands
- **Then:** all existing ACs still pass (may require the AC-032-SPEC-SYNC assertion update, but the semantics are unchanged)

## Dependencies

- **Schedule after K-020 lands:** K-020 first locks in the current `page_location === '/about'` assertion; this ticket updates that assertion in sync when it lands
- If K-020 has not landed, this ticket can also proceed standalone (modifying production + the existing K-018 spec), but bundling the two is recommended for easier review

## Notes

- GA4 Measurement Protocol official: `page_location` maps to the `dl` query key (full URL), `page_path` maps to the `dp` query key (pathname)
- Real-world impact of the current bug is limited (GA4 infers host from request headers and the page is still visible in Realtime), but the semantics are wrong; this is a low-priority bug
