---
id: K-018
title: GA4 Tracking — visitor analytics + click events
status: closed
type: feat
priority: medium
size: S
created: 2026-04-19
closed: 2026-04-21
---

## Background

K-Line Prediction is already deployed to Firebase Hosting but currently has no visitor analytics tooling. K-017 is enhancing the `/about` page's portfolio presentation, and recruiter visit behavior needs observability. Adding GA4 tracking lets us confirm whether recruiters arrive, which pages they stay on, and which CTAs they click.

## Goals

- Record which page a visitor lands on (pageview)
- Track key CTA clicks recruiters are most likely to interact with (custom event)
- Collect no personally identifiable information (PII)
- Read the GA4 measurement ID from an environment variable; do not hardcode it in source

## Scope

**Includes:**
- GA4 script snippet installation (gtag.js via `@gtag` or react-ga4)
- Automatic pageview event per route (`/`, `/about`, `/app`, `/diary`)
- Custom click events (with labels) for the key CTAs on `/about`:
  - Footer CTA email (`mailto:` link)
  - GitHub link
  - LinkedIn link
  - BuiltByAIBanner "See how →" (homepage)
- Inject the measurement ID via the `VITE_GA_MEASUREMENT_ID` env var
- Playwright verifies the GA4 snippet is present (does not assert on network calls)
- Add a one-line GA4 anonymous-tracking notice to the footer (in lieu of a Cookie Consent Banner)

**Excludes:**
- Creating the GA4 Admin Console property (user does this manually)
- Conversion goals / funnel setup
- Server-side event tracking
- Behavior tracking on the `/business-logic` password page (auth gate makes it inapplicable)

## AC Summary

- AC-018-INSTALL `[K-018]`
- AC-018-PAGEVIEW `[K-018]`
- AC-018-CLICK `[K-018]`
- AC-018-PRIVACY `[K-018]`
- AC-018-PRIVACY-POLICY `[K-018]`

## Acceptance Criteria

### AC-K018-1

**Given** GA measurement ID is configured
**When** user visits any route
**Then** a GA4 `page_view` event is recorded in `window.dataLayer`

### AC-K018-2

**Given** user is on a page with a tracked CTA
**When** user clicks the CTA
**Then** a `cta_click` event is recorded with correct label and `page_location`

## Dependencies / Coordination

- **After K-017 completes, the designer must update the design file**: AC-018-PRIVACY-POLICY requires adding GA4 notice text to the Footer; the design file must align with the final implementation. After K-017's Engineer completes and before K-018's Engineer starts, summon the designer to add this text to the Footer design file.

## PM Ruling

**Ruling date:** 2026-04-19
**Source:** Code Reviewer K-018 review results (8 items: W1–W4 / S1–S4)

| ID | Issue | Ruling | Rationale |
|----|------|------|------|
| W1 | /app pageview Playwright assertion missing | **Fix now (this ticket)** | AC-018-PAGEVIEW lists 4 routes (`/`, `/about`, `/app`, `/diary`); missing `/app` is incomplete AC coverage and cannot be left |
| W2 | click `page_location` assertion missing | **Fix now (this ticket)** | The And clause in AC-018-CLICK ("each custom event additionally includes `page_location`") is part of the AC; all 4 click specs missed it, treated as AC not passed |
| W3 | `waitForTimeout` (banner) flaky in CI | **Fix now (this ticket)** | Engineer retro already flagged this as a stopgap; replacing with `waitForNavigation` / `page.on('request')` removes timing dependency — known fix, low cost |
| W4 | `waitForTimeout` (pageview) flaky in CI | **Fix now (this ticket)** | Same logic as W3; waiting `waitForTimeout(300)` after pageview fires is the same class of risk — fix together |
| S1 | SPA pageview not explicitly tested | **Follow-up ticket (K-019 SPA Pageview E2E)** | `goto()` tests the initial page-load pageview; SPA Link click → route change → pageview is an independent scenario requiring navigate intercept and is high-complexity — do not expand this ticket's scope; the scenario is clearly valuable, so open K-019 to track |
| S2 | `initGA()` has no idempotency guard | **Tech debt (TD-013)** | Production unaffected (GA4 gtag.js itself dedupes); only an HMR DX issue; record it, no implementation deadline |
| S3 | `dataLayer` type imprecise | **Tech debt (folded into TD-013)** | `unknown[]` → `unknown[][]` is pure DX improvement, no behavioral impact; same class as S2, log together |
| S4 | No `console.warn` for unknown routes | **Tech debt (folded into TD-013)** | Fallback to `document.title` is defensive logging, not an AC requirement; log it; raise priority if a future debug need arises |

**Engineer TODO (this ticket):** after fixing W1, W2, W3, W4, rerun Playwright; full green = complete.
**Tech debt:** S2/S3/S4 folded into TD-013, logged in `docs/tech-debt.md`.

---

## Retrospective

<!-- Each role appends their retrospective when finishing -->

### Engineer — 2026-04-19

**Done well:** before implementing, noticed `BuiltByAIBanner.tsx` already existed (completed in K-017) and `HomePage.tsx` already imported/rendered it, saving unnecessary rebuild work; all 11 K-018 ga-tracking.spec.ts tests went green on the first run. The design doc's Option A (FooterCtaSection uses native `<a>` instead of ExternalLink) was the correct call, avoiding modifying a primitive.

**Done poorly:** the `BuiltByAIBanner` CTA click test required intercepting SPA navigation before reading dataLayer; the first version did not consider that after SPA navigate the dataLayer would be replaced by the new page; resolved with a brief `waitForTimeout(100)`, but that approach depends on timing and is not the most robust solution. Root cause: did not trace the timing impact of "SPA Link click → navigate → new-page JS execution" on the dataLayer spy in advance.

**Next-time improvement:** for GA click event tests on SPA Link components, use `page.on('request', ...)` or `Promise.race([clickPromise, page.waitForNavigation()])` to capture state after click but before navigate, instead of assuming timing with `waitForTimeout`. Adopt this pattern directly the next time a "click then page transition" GA tracking test comes up.

**W1-W4 follow-up fix (2026-04-19):**
- **W1**: added a `page_view` test for the `/app` route, same format as `/`, `/about`, `/diary`, fully covering all 4 routes in AC-018-PAGEVIEW.
- **W2**: added `page_location` assertions to all 4 `cta_click` tests (`toBeDefined()` + `toBe(current route)`), filling in the AC-018-CLICK And clause.
- **W3**: replaced `banner_about`'s `waitForTimeout(100)` with `waitForFunction` waiting for `cta_click` to appear in `dataLayer`, removing timing dependency.
- **W4**: replaced the `waitForTimeout(300)` in the three pageview tests with `waitForFunction` waiting for `page_view` to appear in `dataLayer`, removing timing dependency.
- **Verification**: `ga-tracking.spec.ts` 12/12 fully green; full suite 100 tests, 99 passed 1 skipped (skipped is pre-existing); `npx tsc --noEmit` zero errors.

### Reviewer — 2026-04-19

**Done poorly:** AC-018-PAGEVIEW explicitly lists `/app` as needing a pageview test, but the Engineer's spec only covered `/`, `/about`, `/diary`; the missing Playwright assertion for `/app` made the AC coverage incomplete. Additionally, for AC-018-CLICK's "And each custom event additionally includes parameter `page_location`" clause, none of the click tests asserted `page_location` was present — partial AC coverage missed. Both gaps should have been caught either at PM AC-definition time (spelling out which routes need to be tested as acceptance criteria) or by the Engineer cross-checking PRD assertions at the Then/And granularity before writing the spec; Reviewer only caught them when comparing PRD AC with spec coverage clause by clause.

**Next-time improvement:** when reviewing E2E specs, before comparing "test descriptions" against "AC titles", first expand all Then/And clauses in the PRD (not just Given/When) and check whether the spec asserts each one. Sub-conditions like "And each event must have `page_location`" are especially prone to being asserted only in the first test and omitted in the rest. Add this as a fixed item in the Review checklist next time.

### QA — 2026-04-19

**Done well:** confirmed ga-tracking.spec.ts 12/12 green visually item by item (AC-018-INSTALL × 1, AC-018-PAGEVIEW × 4, AC-018-CLICK × 4, AC-018-PRIVACY × 1, AC-018-PRIVACY-POLICY × 2), aligned clause by clause with the ticket AC list; remembered to set the `TICKET_ID=K-018` env var this time, producing a correctly named `K-018-visual-report.html` (the improvement action from the K-017 retro has landed); the 1 skipped item out of full-suite 99 passed / 1 skipped (AC-017-BUILD) is a known issue, annotated and non-blocking.

**Done poorly:** the `waitForFunction`-replaces-`waitForTimeout` fix is an E2E stability improvement, but QA did not independently verify that "the old `waitForTimeout` was actually flaky" — relied solely on the Engineer's self-report and did not run a CI-like fast repeat (`--repeat-each=10`) locally to confirm the new version is indeed not flaky. AC-018-PAGEVIEW excludes `/business-logic` by design, but QA did not record the rationale "`/business-logic` is out of tracking scope" in the retro, so anyone questioning coverage later would need to dig the ticket to find the basis.

**Next-time improvement:** (1) for E2E timeout-improvement fixes, QA must run `npx playwright test ga-tracking.spec.ts --repeat-each=5` to verify stability rather than fully trusting Engineer self-report; (2) for "deliberately untracked" routes or events, QA retro must record "out of scope per ticket definition, reason: xxx" as the first-line document basis for future coverage questions.

### PM Summary

**Cross-role recurring issue:**
- **AC And-clause coverage incomplete (jointly raised by Engineer + Reviewer):** the Engineer did not turn the `/app` route and the `page_location` And clause into independent test cases; Reviewer caught them only when expanding PRD Then/And clause by clause. Common root cause: when an AC lists multiple parallel Given or And clauses, downstream roles (Engineer implementing, Reviewer reviewing) lack a written, quantified rule that "each Given/And = one independent test" and end up interpreting coverage granularity intuitively.

**Process improvement decisions:**

| Issue | Owner | Action | Update Location |
|------|---------|------|---------|
| Multiple parallel Givens in an AC are not quantified into corresponding test counts; Engineer implementation granularity inconsistent | PM | Before releasing Engineer, append the line "this AC requires N independent test cases in the Playwright spec, asserting each one" | pm.md (apply on next PM entry) |
| AC And clauses with sub-conditions like "every event must have it" only get asserted in the first test; the rest skip | Reviewer | When reviewing E2E specs, expand all Then/And first before comparing against the spec; add this as a fixed item in the Review checklist | senior-engineer.md (pending authorization) |
| For E2E timeout-class fixes, QA only trusts the Engineer self-report and doesn't run `--repeat-each` to verify stability independently | QA | For E2E test stability improvements, QA must run `--repeat-each=5` to verify | qa.md (pending authorization) |
| For "deliberately excluded" routes/events, QA retro does not record the exclusion rationale | QA | Add a fixed paragraph to QA retro: "out-of-scope items: excluded per ticket definition, reason: xxx" | qa.md (pending authorization) |

---

## Final Close Record — 2026-04-21

**Deployment live:** created GA4 property `K-Line-Prediction` with Measurement ID `G-9JC9YBZTPF`; wrote it to `frontend/.env.production`; `npm run build` + `firebase deploy --only hosting` completed deployment to `k-line-prediction-app.web.app`; GA4 Realtime page successfully received `page_view` events; user count went from 0 → 1 (verified).

**Runtime bug discovered during deployment (fixed before close):**

The original `window.gtag` helper in `frontend/src/utils/analytics.ts`:

```ts
window.gtag = function (...args: unknown[]) {
  window.dataLayer.push(args)  // ← wrong: pushes an Array
}
```

gtag.js distinguishes two kinds of entries inside `dataLayer`:
- An `arguments` object → handled as a gtag command (js/config/event)
- An object with an `event` key → handled as a GTM event

Pushing an Array matches neither, so gtag.js ignores them all; as a result `gtag.js` loaded successfully but `event page_view` was never sent as a `/g/collect` beacon. Inspecting `dataLayer` showed:

```
[
  ["js", Date],            ← Array, ignored
  ["config", "G-...", ...],← Array, ignored
  ["event", "page_view",...],← Array, ignored
  { event: "gtm.dom" },    ← GTM event, processed
]
```

Fix: revert to the official Google snippet pattern `dataLayer.push(arguments)` (commit TBA).

**Why E2E missed it:**
`ga-tracking.spec.ts` uses `page.addInitScript()` to intercept `window.gtag` and verify "call arguments", but it never verifies whether gtag.js internally treats the dataLayer entry as a gtag command or whether an actual `/g/collect` HTTP request is sent. E2E passing = our code called `gtag('event', ...)`; E2E passing ≠ GA4 actually receives the event.

**Next-time improvement:** for E2E coverage of GA4 or any third-party SDK integration, in addition to verifying the client-side call pattern, add an assertion like `page.waitForRequest(url => url.includes('/g/collect'))` (or equivalent) to verify the actual HTTP beacon left the client. Ticket already closed; this improvement action is converted into a follow-up E2E hardening item (open a follow-up ticket or fold into the K-020 SPA pageview E2E scope).
