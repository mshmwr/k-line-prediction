---
id: K-076
title: known-reds cleanup — verify K-061 ConsentBanner fix removed ma99-chart / K-013 / upload backend dependency
status: open
created: 2026-05-02
type: test
priority: high
size: small
visual-delta: no
content-delta: no
design-locked: n/a
qa-early-consultation: ✓ — pure test/manifest work, no runtime change
dependencies: [K-061]
base-commit: b80aec3
---

## Summary

K-061 (closed 2026-04-29) fixed ConsentBanner pointer-event interception as the root
cause of 24 backend-dependent E2E failures. Its retro confirmed "20 scope tests now
pass without backend." However, `docs/qa/known-reds.md` still lists those tests as
failing with reason "requires live backend / ECONNREFUSED" — entries that were written
before K-061 identified the real root cause.

Per known-reds manifest rule: "A manifest entry NOT failing this run = green signal,
drop the entry in a follow-up PR." This ticket executes that rule.

## Acceptance Criteria

### AC-076-VERIFY-MA99
Run `npx playwright test frontend/e2e/ma99-chart.spec.ts --reporter=list` without
backend. If all tests pass → remove all 17 ma99-chart entries from known-reds manifest.
If any still fail → document exact failure mode and determine whether K-061 fix was
partial.

### AC-076-VERIFY-K013
Run `npx playwright test frontend/e2e/K-013-consensus-stats-ssot.spec.ts --reporter=list`
without backend. If all 4 tests pass → remove entries from known-reds manifest.

### AC-076-VERIFY-UPLOAD
Run `npx playwright test frontend/e2e/upload-real-1h-csv.spec.ts --reporter=list`
without backend. If all 3 tests pass → remove entries from known-reds manifest.

### AC-076-NO-NEW-REDS
After manifest cleanup, full-suite run (`npx playwright test`) must not produce any
new failures outside the remaining known-reds entries.

### AC-076-MANIFEST-CONSISTENT
Every removed entry must have a green run confirmed in the same PR. Every remaining
entry must still be red and have a valid remediation ticket or explicit `deferred`.

## Notes

- If tests pass post-K-061: this is a manifest hygiene ticket only, zero code change.
- If tests still fail with a new failure mode (not ECONNREFUSED): update known-reds
  reason + open follow-up ticket before closing K-076.
- K-061 retro: root cause was `addInitScript` to hide ConsentBanner in 3 spec files.
  Verify those addInitScript calls cover ma99, upload, and K-013 specs.
