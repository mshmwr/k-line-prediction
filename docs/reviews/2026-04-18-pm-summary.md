# K-Line Prediction PM Review Summary

Date: 2026-04-18
Audience: PM / Product Stakeholders
Source: Engineering code review and test verification

## Executive Summary

The project is generally in a usable state, and most major user flows are still working.

What is healthy right now:

- Backend automated tests are passing.
- End-to-end browser tests are passing.
- Main multi-page navigation flow is working.

What needs attention:

- The frontend unit test suite is currently failing.
- There is one backend logic issue that may affect the quality of `1H` prediction results.
- The codebase is becoming harder to maintain because several core files are now too large and hold too many responsibilities.

## Current Status

From a product perspective, this is not a total system failure.

- The application is not in a "fully broken" state.
- Core pages still render and navigate correctly.
- Protected content flow and UI routing are working in browser-level tests.

However, this is also not a clean "ready to ship without follow-up" state.

- Engineering confidence is lower than it should be because one frontend test suite is red.
- A prediction-related backend issue could affect correctness on part of the forecasting flow.

## Key Risks

### 1. Frontend test pipeline is currently broken

This does not necessarily mean users are seeing a broken page today, but it does mean:

- the team has a weaker safety net for future changes
- merges may be blocked in environments where unit tests are required
- regressions are easier to introduce unnoticed

Recommended PM interpretation:

- treat this as a short-term release-readiness issue
- it should be fixed before calling the current branch stable

### 2. `1H` prediction quality may be affected

One backend path appears to be using the wrong history source for part of the MA99 trend filtering logic on `1H` predictions.

This matters because:

- users may still get results
- but the ranking/filtering behind those results may not match intended business logic

Recommended PM interpretation:

- this is more important than a cosmetic bug
- it affects trust in prediction quality
- it should be prioritized ahead of purely visual cleanup

### 3. Maintainability risk is increasing

A few files now contain too much logic in one place. This is not an immediate production outage, but it creates delivery risk:

- changes take longer
- bugs become harder to isolate
- future tickets are more likely to create side effects

Recommended PM interpretation:

- not necessarily an emergency
- but worth scheduling refactor work soon, especially if more features are coming

## Suggested Priority Order

### Immediate

- Fix the frontend unit test failures.
- Fix the backend `1H` prediction logic issue.

### Near-term

- Tighten tests around prediction correctness.
- Clean up one misleading automated test so it verifies the behavior it claims to cover.

### Short refactor window

- Refactor the largest frontend page controller.
- Refactor backend request orchestration and history update flow.

## Delivery Recommendation

If the team is deciding whether to continue feature work or stabilize first, the safer recommendation is:

1. Spend a short stabilization pass on the current branch.
2. Restore frontend test health.
3. Fix the `1H` prediction logic path.
4. Then continue feature delivery.

This should keep product momentum while reducing the chance of shipping lower-confidence prediction behavior.

## Test Snapshot

Verified during review:

- Backend auth/main tests: passing
- Backend predictor tests: passing
- Playwright end-to-end suite: passing
- Frontend Vitest unit suite: failing

## Bottom Line

The project is functional, but not yet in an ideal "high-confidence" state.

For PM planning purposes:

- This is not a stop-everything incident.
- It does justify a focused stabilization pass.
- The most important issue is prediction correctness, followed by restoring frontend test health.
