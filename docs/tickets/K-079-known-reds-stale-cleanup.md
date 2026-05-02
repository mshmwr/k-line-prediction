---
id: K-079
title: "Remove 20 stale known-red entries — K-013 ×4, ma99 ×13, upload ×3"
type: ops
status: closed
opened: 2026-05-02
closed: 2026-05-02
closed-commit: TBD
qa-early-consultation: ✓
visual-delta: no
content-delta: no
sacred-clauses: []
---

## Context

K-077 full-suite run (327/329) confirmed all K-013, ma99-chart, and upload-real-1h-csv entries now pass. Prior failures were state contamination from backgrounded Playwright runs, not genuine backend dependency. Known-reds reasons recorded "requires live backend" but these specs have working `route.fulfill()` mocks. Manifest entries are stale and must be dropped per manifest rule: "A manifest entry NOT failing this run = green signal, drop the entry in a follow-up PR."

Remaining active after removal: ga-spa-pageview (GTM-owned, genuinely deferred) + visual-report (env-dep TICKET_ID) = 2 entries.

## Acceptance Criteria

### AC-079-MANIFEST-DROP
- [ ] 20 entries removed: K-013 ×4 + ma99-chart ×13 + upload ×3
- [ ] Playwright run of affected specs exits green (no new failures)
- [ ] Remaining manifest: 2 active entries (ga-spa-pageview + visual-report)

## §8 Sacred Clauses

None — docs-only ticket.

## Retrospective

### PM

**What went well:** —
**What went wrong:** 20 known-reds were kept stale because manifest rule says "no bundle with unrelated PRs" — correct sequencing, just late.
**Next time improvement:** run full-suite after any E2E cleanup and drop stale entries same session if green.
**Slowest step:** waiting for K-077 to close before opening this cleanup.
