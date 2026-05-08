---
id: K-006
title: Homepage diary.json backfill for missing 4/1–4/16 milestones
type: content
priority: medium
status: closed
created: 2026-04-16
---

## Background

`frontend/public/diary.json` currently contains only entries for the following dates:

| Date | Milestone |
|------|-----------|
| 2026-04-01 | MA99 Pearson Trend Filter + 1H/1D Forecast (warning: date is wrong; needs to be split into two entries and corrected) |
| 2026-04-15 | Phase 0 Architecture Planning + Design |
| 2026-04-15 | Phase 1 JWT Auth |
| 2026-04-15 | Phase 2 BrowserRouter Routing |
| 2026-04-16 | Phase 3 Frontend Pages |
| 2026-04-16 | Deployment Firebase + Cloud Run |

**Missing range:** 4/8–4/14 (about one week)

Based on git log, the following milestones have no corresponding diary entry:

| Git date | Work item |
|----------|-----------|
| 2026-04-08 | `/api/merge-and-compute-ma99` endpoint + computeMa99 function |
| 2026-04-08 | Early MA99 loading state (compute on upload) + Match Trend Labels |
| 2026-04-09 | Shared 1H/1D Forecast UI (native timeframe API contract) |
| 2026-04-09 | UTC/UTC+8 timestamp unification fix |
| 2026-04-11 | MA99 Pearson 30-day trend filter replaces ma99_trend_override |

**PM decision (2026-04-16):** Dates always follow the git date, not the start date. The `"2026-04-01"` entry must be split into two:

| New date | Content |
|----------|---------|
| 2026-04-10 | Shared 1H/1D Forecast UI (native timeframe API contract) |
| 2026-04-11 | MA99 Pearson 30-day trend filter replaces ma99_trend_override |

## Acceptance Criteria

### AC-K006-1: backfill missing milestones

**Given** `diary.json` currently lacks records for 4/8–4/14
**When** Engineer completes the backfill
**Then** diary.json contains all of the following entries, with the date following the git merge date:

| Date | Milestone |
|------|-----------|
| 2026-04-08 | `/api/merge-and-compute-ma99` endpoint + computeMa99 function |
| 2026-04-08 | Early MA99 loading state (compute on upload) + Match Trend Labels |
| 2026-04-09 | UTC/UTC+8 timestamp unification fix |
| 2026-04-10 | Shared 1H/1D Forecast UI |
| 2026-04-11 | MA99 Pearson 30-day trend filter |

**And** the original `"2026-04-01"` entry is removed, replaced by the 4/10 and 4/11 entries above
**And** each `text` follows diary style (a single sentence describing the work + key decision/result)

### AC-K006-2: E2E no regression

**Given** diary.json has been modified
**When** Playwright E2E is run
**Then** all DiaryPage-related tests pass

## PM decision: milestone granularity rule

- **Standalone milestone:** work that can be described externally as "what feature was shipped" (Early MA99, Shared Forecast, Pearson Filter)
- **Sub-items inside `items`:** fixes, hardening, documentation updates (UTC fix, Playwright fix, code review changes)

→ The UTC timestamp fix is folded into the items of the "Shared 1H/1D Forecast UI" milestone rather than logged as a standalone entry.

## Blocking Questions

- [x] ~~Should the 4/1 entry's date be corrected?~~ → **Decided: follow the git date, split into two entries (4/10 + 4/11)**
- [x] ~~Milestone granularity?~~ → **Decided: standalone for features; bugfixes folded into the items of the most recent feature milestone**
- [ ] For each entry between 4/8–4/14, Engineer drafts the `text` description from the git log and sends it to PM for review

## Related files

- [frontend/public/diary.json](../../frontend/public/diary.json)
- PRD AC-HOME-1 (diary section rendering rule)
