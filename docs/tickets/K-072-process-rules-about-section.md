---
id: K-072
title: About page — ProcessRulesSection component (renderSlots.about.processRules)
status: closed
created: 2026-05-01
closed: 2026-05-01
type: feat
priority: medium
size: small
visual-delta: no
content-delta: no
design-locked: false
qa-early-consultation: docs/retrospectives/qa.md 2026-05-01 K-072
dependencies: [K-071]
worktree: .claude/worktrees/K-072-process-rules-about-section
branch: K-072-process-rules-about-section
base-commit: d559886
---

## Summary

`renderSlots.about.processRules = 5` has been configured in `content/site-content.json` since K-058 but the corresponding React component was never implemented. processRules[] data exists (17 entries after K-071 backfill), the README NAMED-ARTEFACTS section displays the top 5 — the About page should do the same.

This ticket implements a `ProcessRulesSection` component that reads `siteContent.processRules`, sorts by weight descending, takes the top `renderSlots.about.processRules` (= 5) entries, and inserts the section into the About page.

## Acceptance Criteria

### Phase 1 — Designer spec

**AC-072-DESIGN:** Designer specs `ProcessRulesSection` layout in `about-v2.pen` and exports `specs/about-process-rules.json`. Spec must define: section heading, per-rule card layout (id / title / severity badge / summary text), and mobile + desktop Tailwind classes per `renderSlots.about.processRules = 5` slot.

### Phase 2 — Engineer implementation

**AC-072-COMPONENT:** `frontend/src/components/about/ProcessRulesSection.tsx` created. Reads `siteContent.processRules`, sorts by `weight` descending, slices to `siteContent.renderSlots.about.processRules`. Renders each rule as a card with: severity badge (critical-blocker / warning / advisory), title, summary.

**AC-072-ABOUT-PAGE:** `ProcessRulesSection` inserted into `frontend/src/pages/AboutPage.tsx`. Section appears below the existing role cards section.

**AC-072-SLOT-DRIVEN:** Component reads `renderSlots.about.processRules` for the count — no hardcoded `5`. Changing the slot value changes the displayed count without code edit.

### Phase 3 — QA

**AC-072-RENDER:** About page (`/about`) shows exactly 5 process rule cards. First card matches highest-weight rule in `content/site-content.json`. No console errors.

**AC-072-SEVERITY-BADGE:** Each card displays the correct severity label. Playwright spec covers at least one card of each tier (critical-blocker / warning / advisory).

**AC-072-MOBILE:** Section renders correctly at 390px viewport (no overflow, cards stack vertically).

## Non-Goals

- No changes to processRules[] data in site-content.json.
- No changes to README NAMED-ARTEFACTS generator.
- No anchor / deep-link to individual rules.

## Release Status

- closed without implementation (2026-05-01): QA Early Consultation confirmed no React component reads `siteContent.processRules`; processRules content is already surfaced in README NAMED-ARTEFACTS for the right audience. About page optimized for quick impressions — processRules detail would add noise. `renderSlots.about.processRules` corrected from `5` → `0` in `content/site-content.json`.
