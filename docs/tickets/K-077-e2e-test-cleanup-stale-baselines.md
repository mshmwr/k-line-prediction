---
id: K-077
title: E2E test cleanup — about DOM T14, data-redaction obsolete test, Footer baselines regen, scroll-to-top threshold
status: open
created: 2026-05-02
type: test
priority: medium
size: small
visual-delta: no
content-delta: no
design-locked: n/a
qa-early-consultation: ✓ — test-only changes, no runtime code
dependencies: [K-057, K-058, K-059, K-053]
base-commit: b80aec3
---

## Summary

Four deferred test-cleanup items accumulated across K-053, K-057, K-058, K-059. Each
was recorded in `known-reds.md` with `remediation: deferred` but no follow-up ticket
opened. This ticket closes all four in one small batch.

## Acceptance Criteria

### AC-077-ABOUT-DOM-T14
`frontend/e2e/about-layout.spec.ts` T14: "all 8 `<section>` are direct children of
root `<div class='min-h-screen'>`". Known-red since K-057 — DOM nesting depth mismatch.
Fix: investigate current AboutPage DOM structure; update test selector to match actual
DOM, OR fix the DOM if the nesting is unintentional.
**Pass condition:** T14 green in Playwright run.

### AC-077-DATA-REDACTION-REMOVED
`frontend/e2e/about-v2.spec.ts`: "at least one data-redaction element exists". Known-red
since K-057 — `[data-redaction]` removed from DOM in a prior ticket without test cleanup.
Fix: delete the obsolete test assertion (the feature is intentionally gone).
**Pass condition:** about-v2 spec runs with 0 failures on the affected assertion.

### AC-077-FOOTER-BASELINES-REGEN
`frontend/e2e/shared-components.spec.ts`: Footer snapshot on `/`, `/about`, `/diary`
all stale since K-059 (pixel diff ~3865–4538px). Regen all three baselines in a single
Playwright `--update-snapshots` run against current UI.
**Pass condition:** All three Footer snapshot tests green; new baseline PNGs committed.

### AC-077-SCROLL-THRESHOLD
`frontend/e2e/scroll-to-top.spec.ts` AC-K053-04: "hash navigation preserves scroll
(browser anchor wins)" — asserts scroll depth `>= 700`, actual `~583` after K-059
shortened /about page height.
Fix: measure current correct threshold (`window.scrollY` after anchor nav on current
/about), update assertion to match. Do NOT loosen to a trivially-small value.
**Pass condition:** AC-K053-04 green; threshold reflects real anchor scroll depth on
current /about layout.

### AC-077-NO-NEW-REDS
After all four fixes: full Playwright run must not introduce any new failures outside
the remaining known-reds entries.

### AC-077-MANIFEST-UPDATED
Remove all four entries from `docs/qa/known-reds.md` in the same PR as the fixes.

## Notes

- Footer baselines regen: commit the PNG files directly; do not use `--update-snapshots`
  in CI. Local regen → commit → PR.
- about DOM T14: read current AboutPage.tsx structure before writing the fix — DOM depth
  may have changed in K-067 layout unification.
- Scroll threshold: run `/playwright` to capture current value; hardcode the measured
  value, not an approximation.
