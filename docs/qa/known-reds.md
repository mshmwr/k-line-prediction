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
