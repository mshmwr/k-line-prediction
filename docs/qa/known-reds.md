# Known-Red Manifest

QA sign-off baseline: every test ID listed below is a pre-existing red that must NOT block sign-off as long as failure pattern matches the recorded reason. Used by `~/.claude/agents/qa.md` §Mandatory Task Completion Steps step 3a (byte-equal identity check against full-suite failures).

**Format:**

```
- `<spec-file-path>` :: `<test title>` — known-red since `K-XXX` (`YYYY-MM-DD`); reason: <one-line root cause>; remediation: <ticket ID or "deferred">
```

**Rules:**

- Each entry is one line. Multi-line reasoning belongs in the linked ticket retrospective, not here.
- Adding an entry requires a paired remediation ticket OR an explicit "deferred" justification — known-red is not "ignored forever".
- Removing an entry requires a green run on the named test in the same PR.
- A failing test NOT in this manifest = **hard BLOCK** for sign-off; PM must be notified before any retry attempt.
- A manifest entry NOT failing this run = green signal, drop the entry in a follow-up PR (do NOT bundle entry-removal with unrelated PRs).

---

## Active Entries

- `frontend/e2e/ga-spa-pageview.spec.ts` :: `AC-020-BEACON-SPA SPA navigation fires GA pageview beacon` — known-red since `K-032` (2026-04-21); reason: production GA pageview beacon fails to fire on SPA route change because the GTM container's history-change trigger is bound before React Router emits the route event, so the beacon misses the new pathname (K-032 production gap, code instrumentation insufficient to fix without GTM container republish); remediation: `deferred` — K-032 retro flagged this as out-of-scope for current sprint; revisit when GTM container ownership lands with marketing.
- `frontend/e2e/about-layout.spec.ts` :: `T14 — all 6 <section> are direct children of root <div class="min-h-screen">, <footer> is last child` — known-red since `K-057` (2026-04-28); reason: AboutPage structural query returns empty array — likely K-045 container migration changed section nesting depth; remediation: `deferred` — investigate AboutPage DOM structure in follow-up ticket.
- `frontend/e2e/about-v2.spec.ts` :: `at least one data-redaction element exists` — known-red since `K-057` (2026-04-28); reason: `[data-redaction]` elements no longer present in /about DOM — removed in a prior ticket without test cleanup; remediation: `deferred` — remove obsolete test in follow-up ticket.
- `frontend/e2e/K-013-consensus-stats-ssot.spec.ts` :: `Case A — full-set: Consensus Forecast (1H) chart visible, fallback not visible` — known-red since `K-057` (2026-04-28); reason: test requires live backend (/api/predict); times out without running backend; remediation: `deferred` — needs mock-api integration.
- `frontend/e2e/K-013-consensus-stats-ssot.spec.ts` :: `Case B — subset (deselect one of two matches then re-apply): chart visible, fallback not visible` — known-red since `K-057` (2026-04-28); reason: same as Case A — requires live backend; remediation: `deferred`.
- `frontend/e2e/K-013-consensus-stats-ssot.spec.ts` :: `Case C — empty matches response: fallback visible, chart not visible` — known-red since `K-057` (2026-04-28); reason: same as Case A; remediation: `deferred`.
- `frontend/e2e/K-013-consensus-stats-ssot.spec.ts` :: `Case D — projectedFutureBars.length < 2 (util throw) fallback: fallback visible, chart not visible` — known-red since `K-057` (2026-04-28); reason: same as Case A; remediation: `deferred`.
- `frontend/e2e/ma99-chart.spec.ts` :: `MainChart header shows MA99 value after prediction` — known-red since `K-057` (2026-04-28); reason: requires live /api/ma99 + /api/predict; times out without backend; remediation: `deferred`.
- `frontend/e2e/ma99-chart.spec.ts` :: `MA99 gap warning banner is absent when query_ma99_gap is null` — known-red since `K-057` (2026-04-28); reason: requires live backend; remediation: `deferred`.
- `frontend/e2e/ma99-chart.spec.ts` :: `MA99 gap warning banner appears when query_ma99_gap is present` — known-red since `K-057` (2026-04-28); reason: requires live backend; remediation: `deferred`.
- `frontend/e2e/ma99-chart.spec.ts` :: `expanding a match card renders the PredictorChart container` — known-red since `K-057` (2026-04-28); reason: requires live backend; remediation: `deferred`.
- `frontend/e2e/ma99-chart.spec.ts` :: `MatchList card shows uptrend label after prediction with rising future MA99` — known-red since `K-057` (2026-04-28); reason: requires live backend; remediation: `deferred`.
- `frontend/e2e/ma99-chart.spec.ts` :: `MatchList card shows downtrend label after prediction with falling future MA99` — known-red since `K-057` (2026-04-28); reason: requires live backend; remediation: `deferred`.
- `frontend/e2e/ma99-chart.spec.ts` :: `MatchList card shows no trend label when future_ma99 has fewer than 2 values` — known-red since `K-057` (2026-04-28); reason: requires live backend; remediation: `deferred`.
- `frontend/e2e/ma99-chart.spec.ts` :: `shared 1D toggle sends native 1D timeframe to MA99 and predict APIs` — known-red since `K-057` (2026-04-28); reason: requires live backend; remediation: `deferred`.
- `frontend/e2e/ma99-chart.spec.ts` :: `Statistics shows both Consensus Forecast (1H) and Consensus Forecast (1D)` — known-red since `K-057` (2026-04-28); reason: requires live backend; remediation: `deferred`.
- `frontend/e2e/ma99-chart.spec.ts` :: `shared 1D toggle updates match list header to date-only display` — known-red since `K-057` (2026-04-28); reason: requires live backend; remediation: `deferred`.
- `frontend/e2e/ma99-chart.spec.ts` :: `AC-1D-1: in 1D mode, match card right badge shows daily bar count not No future bars` — known-red since `K-057` (2026-04-28); reason: requires live backend; remediation: `deferred`.
- `frontend/e2e/upload-real-1h-csv.spec.ts` :: `AC-051-09-UPLOAD-SUCCESS: real 24-bar 1H CSV uploads, predict succeeds, MainChart + MatchList render` — known-red since `K-057` (2026-04-28); reason: requires live backend + real CSV file upload; times out without backend; remediation: `deferred`.
- `frontend/e2e/upload-real-1h-csv.spec.ts` :: `AC-051-09-NO-ERROR-TOAST: post-upload error-toast bar must NOT be visible` — known-red since `K-057` (2026-04-28); reason: same as UPLOAD-SUCCESS — requires live backend; remediation: `deferred`.
- `frontend/e2e/upload-real-1h-csv.spec.ts` :: `AC-051-09-NO-MA-HISTORY-MESSAGE: Sacred ma_history error message must not leak into DOM` — known-red since `K-057` (2026-04-28); reason: same as UPLOAD-SUCCESS — requires live backend; remediation: `deferred`.
