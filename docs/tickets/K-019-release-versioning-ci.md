---
id: K-019
title: Release Versioning & CI/CD
status: backlog
type: feat
priority: medium
size: M
created: 2026-04-19
---

## Background

Each deploy triggers a release pipeline: auto-generate the version manifest, git tag, and GitHub Release (with Playwright screenshots). The goal is to build a UI "time machine".

## Spec & Plan

- Spec: `docs/designs/2026-04-19-release-versioning-design.md`
- Plan: `docs/designs/2026-04-19-release-versioning-ci.md`

## Acceptance Criteria

See spec AC-K019-1 ~ AC-K019-5.

## Future Enhancement

The `/business-logic` page is not yet implemented (per K-017 PM ruling to defer; the Navbar Prediction link is hidden as well).  
Once that page lands, update `frontend/e2e/screenshot.spec.ts` to add a post-auth `/business-logic` screenshot capturing the actual UI state behind the auth wall.  
→ Append this requirement to the `/business-logic` ticket when it opens.

## Retrospective
