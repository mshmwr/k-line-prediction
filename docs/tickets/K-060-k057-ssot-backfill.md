---
id: K-060
title: K-057 SSOT backfill — Pencil .pen + design doc spec tables for DisclaimerBanner + Disclaimer footer section (visual-delta sync gap)
status: closed
closed: 2026-04-29
closed-commit: dce848e
created: 2026-04-28
type: docs
priority: medium
size: small
visual-delta: no
content-delta: no
design-locked: true
qa-early-consultation: N/A — docs-only, no runtime change
dependencies: [K-057]
worktree: .claude/worktrees/K-060-k057-ssot-backfill
branch: K-060-k057-ssot-backfill
base-commit: 4a722d8
roles: [Designer, PM]
---

## Summary

K-057 shipped two new visual components — `DisclaimerBanner` (top banner) and `<section id="disclaimer">` (Disclaimer footer block) — without updating the Pencil `.pen` design file or writing design doc spec tables for the new components. This violates the Visual SSOT sync gate (K-057 PM retro 2026-04-28).

This ticket closes the gap: Designer adds the K-057 shipped components to Pencil and exports artifacts; PM closes the ticket.

**Scope:** docs-only (Pencil `.pen` + design doc). No runtime code change. No Engineer needed.

## Root Cause

K-057 Phase 3 (hero shot + OG image) and Phase 5 (consent + funnel) were the last phases with Designer involvement. DisclaimerBanner (Phase 1) and Disclaimer section (Phase 1) were implemented by Engineer without a Designer pass, and the visual SSOT sync gate (`design-locked` + Pencil artifact update) was not enforced before the Phase A PR merge.

## Work

### Designer deliverables

1. **Update `/` home frame (`4CsvQ`) in Pencil `.pen`:**
   - Add `DisclaimerBanner` component spec at top of page canvas (above Hero section):
     - Background: `#2A2520`
     - Text: `#F4EFE5`, size `12px`, center-aligned
     - Copy: `"Lookup tool for K-line shape similarity — for learning and exploration. Outputs are not predictions and not financial advice."`
     - Height: single line bar, ~36px
   - Export `frontend/design/specs/4CsvQ.json` + `frontend/design/screenshots/4CsvQ.png`

2. **Update global Footer frame (or relevant frame) in Pencil `.pen`:**
   - Add Disclaimer `<section>` spec at bottom of Footer area (below social links):
     - Heading: `<h2>Disclaimer</h2>`, serif, ~14px
     - Body: 4-sentence disclaimer text block, `13px`, `line-height: 1.6`, paper palette
   - Export updated Footer frame JSON + PNG

3. **Add K-057 spec table to design doc:**
   - Read existing `/` design doc (likely `docs/designs/K-017-homepage-spec.md` or nearest equivalent)
   - Add section `## K-057 New Components` with spec table:

   | Component | Location | Background | Text | Copy |
   |---|---|---|---|---|
   | DisclaimerBanner | top of page, above Hero | `#2A2520` | `#F4EFE5` 12px center | "Lookup tool for K-line shape similarity…" |
   | Disclaimer section | bottom of Footer | paper `#F4EFE5` bg | ink 13px lh-1.6 | see K-057 §Phase 1 §1d |

### PM close

- Verify Designer artifacts landed: `specs/4CsvQ.json` + `screenshots/4CsvQ.png` updated post-K-057
- Verify design doc spec table present
- Close ticket with `closed-commit`

## Acceptance Criteria

- AC-060-BANNER-SPEC: `frontend/design/specs/4CsvQ.json` contains a node matching DisclaimerBanner (background `#2A2520`, text `#F4EFE5`) post-update (PM grep)
- AC-060-DISCLAIMER-SPEC: design doc contains K-057 Disclaimer section spec table with copy + color values matching shipped `frontend/src/components/shared/FooterDisclaimer.tsx`
- AC-060-SCREENSHOT-UPDATED: `frontend/design/screenshots/4CsvQ.png` timestamp is after K-057 closed-commit `0aeeb6ee` (2026-04-28)

## Why This Matters

Stale Pencil `.pen` means the next Designer session working on `/` home will have a canvas that shows the old "Predict the next move" hero without the top banner or Disclaimer section — leading to re-divergence. Keeping `.pen` as living SSOT prevents this class of conflict.
