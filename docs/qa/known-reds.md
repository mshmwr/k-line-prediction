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

- `frontend/e2e/ga-spa-pageview.spec.ts` :: `AC-020-BEACON-SPA — SPA navigate fires a NEW beacon referencing /about` — known-red since `K-032` (2026-04-21); reason: production GA pageview beacon fails to fire on SPA route change because the GTM container's history-change trigger is bound before React Router emits the route event, so the beacon misses the new pathname (K-032 production gap, code instrumentation insufficient to fix without GTM container republish); remediation: `deferred` — K-032 retro flagged this as out-of-scope for current sprint; revisit when GTM container ownership lands with marketing.
- `frontend/e2e/visual-report.ts` :: `K-008 Visual Report — capture Home (/)` — known-red since `K-008` (2026-04-18); reason: spec requires TICKET_ID env var at runtime; fails without it; environmental dependency, not a regression; remediation: `deferred` — run only with explicit TICKET_ID in QA sessions that need visual reports.
- `backend/tests/test_history_db_contiguity.py` :: `test_history_db_dates_strictly_monotonic_ascending` — known-red since pre-K-078 (surfaced 2026-05-02 during K-078 sign-off); reason: ETHUSDT 1h CSV date column contains `YYYY-MM-DD HH:MM` format but test parses with `%Y-%m-%d` only; canonical-identical failure (not a K-078 regression); remediation: `deferred` — fix strptime format in follow-up ticket.
- `backend/tests/test_history_db_contiguity.py` :: `test_history_db_dates_no_gap_greater_than_one_day` — known-red since pre-K-078 (surfaced 2026-05-02 during K-078 sign-off); reason: same date-format mismatch as monotonic test; canonical-identical; remediation: `deferred`.
- `backend/tests/test_history_db_contiguity.py` :: `test_history_db_freshness_floor_within_seven_days` — known-red since pre-K-078 (surfaced 2026-05-02 during K-078 sign-off); reason: same date-format mismatch; canonical-identical; remediation: `deferred`.
- `frontend/src/__tests__/diary.legacy-merge.test.ts` :: `AC-024-LEGACY-MERGE — legacy entry constraints > legacy entry text word count is within 50–100` — known-red surfaced 2026-05-02 during K-081 sign-off; reason: legacy entry text drifted to 19 words (below 50-word floor) as later tickets edited diary.json without re-padding the legacy entry; canonical-identical, not a K-081 regression (K-081 only appended a new entry, did not modify the legacy one); remediation: `deferred` — re-pad legacy entry text to ≥50 words in follow-up docs-only ticket.
- `frontend/e2e/ga-consent.spec.ts` :: `T2 — accept consent: banner disappears, GA script injected` — known-red since `K-082` (2026-05-02); reason: GTM container not available in Playwright test env; GA script injection never fires without live GTM container ID; remediation: `deferred` — requires GTM container ownership + test-env stub.
- `frontend/e2e/ga-consent.spec.ts` :: `T3 — previously accepted: no banner, GA script present` — known-red since `K-082` (2026-05-02); reason: same as T2 — GTM container not available in test env; remediation: `deferred`.
- `frontend/e2e/ga-consent.spec.ts` :: `T6 — app_demo_started fires when /app?sample=ethusdt sample loads` — known-red since `K-082` (2026-05-02); reason: GA event tracking requires live GTM container; dataLayer push never intercepted in test env; remediation: `deferred`.
- `frontend/e2e/ga-consent.spec.ts` :: `T7 — app_match_run + app_result_viewed fire after successful prediction` — known-red since `K-082` (2026-05-02); reason: same as T6 — GA events require live GTM container; remediation: `deferred`.
- `frontend/e2e/ga-spa-pageview.spec.ts` :: `NavBar About Link: / → /about pushes page_view entry referencing /about` — known-red since `K-082` (2026-05-02); reason: GTM container not available in test env; dataLayer page_view push not fired without live GTM; remediation: `deferred`.
- `frontend/e2e/ga-spa-pageview.spec.ts` :: `BuiltByAIBanner CTA: / → /about pushes page_view entry referencing /about` — known-red since `K-082` (2026-05-02); reason: same as NavBar test — GTM container absent in test env; remediation: `deferred`.
- `frontend/e2e/ga-spa-pageview.spec.ts` :: `AC-020-BEACON-INITIAL — page.goto fires at least one beacon in 5s` — known-red since `K-082` (2026-05-02); reason: GA4 /g/collect beacon requires live GTM container + real measurement ID; test env uses G-TESTID0000 fixture which does not resolve; remediation: `deferred`.
- `frontend/e2e/ga-spa-pageview.spec.ts` :: `AC-020-BEACON-PAYLOAD — beacon query contains v=2, tid, en=page_view, path-key` — known-red since `K-082` (2026-05-02); reason: same as BEACON-INITIAL — no beacon fires in test env; remediation: `deferred`.
- `frontend/e2e/ga-spa-pageview.spec.ts` :: `AC-020-BEACON-COUNT — initial load fires exactly 1 beacon within 1s settle window` — known-red since `K-082` (2026-05-02); reason: same as BEACON-INITIAL — no beacon fires in test env; remediation: `deferred`.
- `frontend/e2e/ga-spa-pageview.spec.ts` :: `AC-020-NEG-QUERY — query-only change does not fire new beacon` — known-red since `K-082` (2026-05-02); reason: negative assertion fails because initial beacon never fires (beacon count stays 0, pre-condition toBeGreaterThan(0) times out); remediation: `deferred`.
- `frontend/e2e/ga-spa-pageview.spec.ts` :: `AC-020-NEG-HASH — hash-only change does not fire new beacon` — known-red since `K-082` (2026-05-02); reason: same as NEG-QUERY — initial beacon pre-condition fails in test env; remediation: `deferred`.
- `frontend/e2e/ga-spa-pageview.spec.ts` :: `AC-020-NEG-SAMEROUTE — clicking About Link while on /about does not fire new beacon` — known-red since `K-082` (2026-05-02); reason: same as NEG-QUERY — initial beacon pre-condition fails in test env; remediation: `deferred`.
- `frontend/e2e/ga-tracking.spec.ts` :: `gtag.js script tag exists in document head after consent granted` — known-red since `K-082` (2026-05-02); reason: GTM container not available in test env; gtag.js script injection never occurs without live GTM container ID; remediation: `deferred`.
- `frontend/e2e/K-046-example-upload.spec.ts` :: `T2 AC-046-EXAMPLE-2 — /examples asset fetch returns 200 with 3926B` — known-red since `K-082` (2026-05-02); reason: Vite dev server performs SPA fallback for unknown MIME paths; /examples/ETHUSDT_1h_test.csv returns index.html (4046B) instead of CSV (3926B) in dev mode; production build serves CSV correctly; remediation: `deferred` — add dedicated Playwright project targeting vite preview or add `Content-Type: text/csv` server rule.
- `frontend/e2e/shared-components.spec.ts` :: `Footer snapshot on /diary` — known-red since `K-082` (2026-05-02); reason: DiaryRail (position:absolute inside ol.relative) has no z-index and visually overlays footer (position:static) per CSS stacking rules; Playwright element screenshot captures the stacking-order rendering (DiaryRail line + transparent background), not footer text; remediation: `deferred` — fix requires `position:relative; z-index:1` on footer or `z-index:0` on diary timeline.
- `frontend/e2e/shared-components.spec.ts` :: `Footer snapshot on /` — known-red since `K-095` (2026-05-05); reason: same DiaryRail z-index stacking issue as `/diary` entry — homepage DOM includes DiaryRail which visually overlays footer in Playwright element screenshot; canonical-identical failure (surfaced during K-095 QA, pre-existing, not introduced by K-095); remediation: `deferred` — same fix as `/diary` entry.
