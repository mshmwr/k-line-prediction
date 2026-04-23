---
id: TD-001
title: ga-spa-pageview.spec.ts isolation fix — standalone run reproduces 9 failures against shared dev server
status: open
type: TD
priority: medium
source: K-040 QA regression
created: 2026-04-23
related-to: [K-020, K-032, K-033, K-040]
---

## 1. Context

During K-040 QA regression sweep (2026-04-23), Engineer handoff described **1 pre-existing flake** (`AC-020-BEACON-SPA`) in `frontend/e2e/ga-spa-pageview.spec.ts`. QA independent verification under standalone run (`npx playwright test e2e/ga-spa-pageview.spec.ts`) reproduced **9 failures**, not 1:

- **SPA-NAV** ×2
- **BEACON** ×4 (INITIAL / PAYLOAD / COUNT / SPA)
- **NEG** ×3 (QUERY / HASH / SAMEROUTE)

QA cross-verified against K-040 base commit `66d9573` — identical 9-failure pattern reproduces on pristine HEAD pre-fix → **pre-existing, NOT a K-040 regression**. K-040 ticket is therefore closable on its own ACs; this TD captures the operational flake independently.

## 2. Provisional root cause

The spec appears to assume a **Playwright-isolated `webServer`** (per `playwright.config.ts` `webServer` block) but breaks when executed against a shared `npm run dev` instance on port 5173. Likely contributing factors:

- Beacon-collector race with hot-state between tests (HMR WebSocket interference, shared module state).
- Initial-beacon-count assertions assume fresh server state per spec file; shared dev server persists state across unrelated tests.
- SPA-NAV / NEG assertions possibly depend on specific middleware ordering only satisfied by the Playwright-managed webServer.

## 3. Scope

**In scope:**
- Investigate why `ga-spa-pageview.spec.ts` fails against shared `npm run dev` but (presumably) passes under Playwright `webServer` config.
- Isolate the spec so that either (a) it consistently passes under both modes, or (b) it is explicitly gated to run only under the isolated `webServer` mode (e.g. separate Playwright project name + `npm script` for CI).
- Reconcile the 1-test-flake claim (`AC-020-BEACON-SPA` is the K-033 tracker red-on-purpose) with the observed 9-test collapse — confirm whether the 8 extra failures are (i) genuine pre-existing bugs masked by shared-server state, or (ii) harness-level isolation breakage that does not reflect production behavior.

**Out of scope:**
- Implementing the K-033 canonical GA4 SPA beacon pattern (tracked separately in K-033).
- Fixing the K-032 `page_location` full-URL bug (tracked in K-032).
- Re-architecting the Playwright config webServer (avoid scope creep into test-infra redesign).

## 4. Acceptance criteria (draft — to be refined when scheduled)

- **Given:** developer runs `npx playwright test e2e/ga-spa-pageview.spec.ts` in isolation.
- **When:** running against both (a) Playwright-managed `webServer` and (b) shared `npm run dev` on port 5173.
- **Then:** either both modes produce the same pass/fail shape, OR the spec is explicitly pinned to mode (a) via a dedicated Playwright project name + script, and documented as such in `frontend/e2e/README.md` (if that file exists) or top-of-spec comment block.
- **And:** the remaining intentional red (`AC-020-BEACON-SPA` K-033 tracker) is preserved; no other beacon test is silently disabled or `.skip`ped.
- **And:** QA regression sweep for future tickets can run `ga-spa-pageview.spec.ts` deterministically in whatever mode the main suite uses — no flake-vs-failure ambiguity on handoff.

## 5. QA root-cause analysis (source)

See `docs/retrospectives/qa.md` 2026-04-23 K-040 entry for the pristine-baseline reproduction evidence and the 9-failure breakdown.

## 6. Links

- K-040 close summary (this ticket filed from K-040 QA regression): `docs/tickets/K-040-sitewide-ui-polish-batch.md` §6 Retrospective PM close summary.
- K-020 original 9-test green delivery: `docs/tickets/K-020-ga-spa-pageview-e2e.md`.
- K-033 canonical GA4 SPA beacon tracker: `docs/tickets/K-033-ga-spa-beacon-emission-fix.md`.
- K-032 GA page_location full-URL bug: `docs/tickets/K-032-ga-page-location-full-url.md`.

## 7. Priority rationale

**Medium** — flake is pre-existing (K-020 delivered as 8-green + 1-intentional-red), so production GA telemetry is not affected. However, the isolation drift actively mis-frames QA handoffs (Engineer under-reported by 8 tests), which erodes trust in regression reports. Fix before next GA-involving ticket (K-032 / K-033) to prevent compound confusion.
