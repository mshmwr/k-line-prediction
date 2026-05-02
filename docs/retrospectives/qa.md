# QA Retrospective Log — K-Line Prediction

Cross-ticket cumulative retrospective log. The QA agent appends one entry before every task close, newest on top.

## Entry format

```
## YYYY-MM-DD — <Ticket ID or Phase name>

**What went well:** (specific event; omit this line if none — do not fabricate)
**What went wrong:** (which regression tests were under-designed / which boundaries were missed)
**Next-time improvement:** (concrete, actionable follow-up)
```

- Newest first (reverse chronological)


## 2026-05-02 — K-078

**What went well:** All 5 pytest AC targets green on first run; W1 bypass replay caught ast.Name reference exactly as designed.
**What went wrong:** 3 canonical-identical pre-existing failures in test_history_db_contiguity.py absent from known-reds manifest — step 3a triggered a flag; manifest backfill required.
**Next time improvement:** Pre-sign-off, QA must verify known-reds manifest covers all canonical-failing tests before running full suite; missing entries = PM notification before sign-off not after.
**Slowest step:** Full pytest suite (36s) dominated by CSV integration fixtures — no mitigation, fixture load is necessary.

## 2026-05-02 — K-075 Final Sign-off

**What went well:** 323 passed; tsc zero errors; all 6 ACs verified by script (line count wc -l=129, 3 hook files, no UnifiedNavBar/Footer, K-013 import chain, no eslint-disable in MatchList.tsx); 7 failures all identity-matched known-reds.
**What went wrong:** visual-report spec (`K-008 Visual Report`) fails without TICKET_ID but is not in the known-reds manifest — sign-off blocked on identity check until environmental context confirmed pre-existing.
**Next time improvement:** Add visual-report to known-reds manifest with reason "requires TICKET_ID env var at runtime; environmental, not a regression."
**Slowest step:** Playwright full suite (1.1 min); unavoidable for full regression.

## 2026-05-02 — Phase 2 (K-075)

**What went well:** Design doc §6 explicitly flagged TD-004 Playwright gap + analytics migration risk — both surfaced as Challenges without needing extra investigation.
**What went wrong:** AC-075-APPPAGE-LINE-COUNT's "all logic in hooks" clause has no automatable proxy beyond line count; gap was not caught at PM AC-authoring stage.
**Next time improvement:** For refactor ACs, always add a grep-based "no inline hook calls in residual component" clause alongside the line-count gate.
**Slowest step:** Tracing analytics call migration path through design doc (2 reads); future: design doc should explicitly list all analytics call sites in the sacred testid inventory section.


## 2026-05-01 — K-073 Final Sign-off

**What went well:** 327 tests passed; tsc clean; AC-073-STEPS-ASSERTIONS + AC-073-WHERE-ASSERTIONS + AC-073-METRICS-BLOCK all verified; 6 of 7 failures matched known-reds by identity.
**What went wrong:** `docs/qa/known-reds.md` entry for `ga-spa-pageview.spec.ts` carries stale test title `AC-020-BEACON-SPA SPA navigation fires GA pageview beacon` (K-032 2026-04-21); actual test title is `AC-020-BEACON-SPA — SPA navigate fires a NEW beacon referencing /about` since K-049/K-057 rename; title mismatch blocks strict byte-equal identity check.
**Next-time improvement:** When a test file is renamed or restructured, update the known-reds manifest in the same PR; manifest staleness is invisible until the next full-suite identity check.
**Slowest step:** Tracing the ga-spa title mismatch to git log to confirm it predates K-073 (2 Bash calls); unavoidable but signals manifest needs a periodic freshness audit.

## 2026-05-01 — K-073 Phase 2 Sign-off

**What went well:** AC-073-STEPS-ASSERTIONS and AC-073-WHERE-ASSERTIONS confirmed in spec with exact markers; AC-029-ARCH-BODY-TEXT regression passed cleanly; generator --check exit 0.
**What went wrong:** known-reds manifest missing `Footer snapshot on /` (homepage) — the K-059 entry covered /about + /diary but silently omitted /; identity check caught the gap at sign-off.
**Next time improvement:** when adding snapshot known-red entries, enumerate all affected routes explicitly — never collapse sibling routes into a single entry.
**Slowest step:** Playwright full suite (1.3 min); no avoidance possible for full regression.

## 2026-05-01 — K-073 QA Early Consultation (PM proxy)

**Status:** Complete — 9 challenges raised; 5 resolved to scope reduction, 4 resolved to AC refinement.

**Challenges summary:**
- C1 → PageHeaderSection removed from scope: subtitle is static role-name list, not a number; Sacred AC-017-HEADER exact-text constraint
- C2 → BuiltByAIBanner removed from scope: "Six AI agents" is Pencil SSOT marketing copy; 2 exact-text E2E assertions would break
- C3 → WhereISteppedInSection PIPELINE_DEPTH removed from scope: K-066 AC-066-SSOT mandates module-level constant; K-073 cannot override
- C4 → Option B: README METRICS marker block added (new `<!-- METRICS:start -->...<!-- METRICS:end -->` block written by generator)
- C5 → Option A: AC-073-HOME-STEPS requires behavior-equivalence E2E assertions for step title + description after migration
- C6 → AC-073-ABOUT-PILLARS removed entirely: `body` prop is `ReactNode` with `<code>` markup; cannot JSON-serialize without markdown parser; no cross-page sync benefit
- C7 → Option A: ArchPillarBlock `fields` union type schema provided in ticket §Schema section; `satisfies` required
- C8 → AC-073-ABOUT-WHERE removed: K-066 open conflict (C9 sequencing); defer to post-K-066 ticket
- C9 → K-066 must close before any K-073 work touches WhereISteppedInSection

**What went well:** Caught three Sacred exact-text conflicts (C1/C2/C3) before Engineer wrote a single line — prevented guaranteed regression on about.spec.ts and pages.spec.ts.
**What went wrong:** K-073 was scoped assuming all hardcoded strings are trivially JSON-serializable; JSX ReactNode body in Pillars and K-066 open conflict were not pre-checked before ticket authoring.
**Next-time improvement:** Before scoping a content externalization ticket, PM must grep `frontend/src/` for ReactNode/JSX props and check open ticket list for conflicts on same component files. Both checks are SOR-verifiable and must run before ticket creation.
**Slowest step:** Distinguishing Sacred exact-text constraints (C1/C2) from non-Sacred hardcoded strings — required reading all three spec files (about.spec.ts, about-v2.spec.ts, pages.spec.ts) to enumerate exact-text assertions per component.

## 2026-05-01 — K-072 QA Early Consultation (PM proxy)

**Status:** Complete — 7 challenges raised. Ticket closed without implementation; PM decision.

**Challenges summary:**
- C1 → Sacred violation risk: inserting ProcessRulesSection after `#architecture` breaks AC-031-LAYOUT-CONTINUITY (`document.getElementById('architecture')?.nextElementSibling?.tagName === 'footer'`); clean resolution = insert before architecture (push architecture to Nº 08)
- C2 → No existing Playwright spec covers processRules rendering on About page — new spec would be required from scratch
- C3 → `renderSlots.about.processRules = 0` guard required in component to prevent empty render
- C4 → Weight ties have no stable secondary sort — spec must define deterministic tie-break
- C5 → Severity badge enum validation: unknown severity value would silently render empty badge
- C6 → Card text overflow at 390px viewport — title/summary line-clamp behavior unspecified
- C7 → About page quick-impression audience mismatch: processRules detail suits developer/README audience, not portfolio visitor

**What went well:** Sacred constraint caught pre-implementation — avoided a broken E2E suite on first Engineer run.
**What went wrong:** Ticket opened before verifying no existing component reads `siteContent.processRules`; renderSlots slot being reserved != feature being planned for delivery.
**Next-time improvement:** Before opening a feat ticket for a renderSlot component, PM should verify: (a) slot is non-zero, AND (b) a component reads the slot. Slot value alone is not sufficient signal.
**Slowest step:** Enumerating all 7 challenges covering Sacred + new spec scope + audience fit — each requires a separate grep/Read pass through AboutPage.tsx, about-v2.spec.ts, and site-content.json.

## 2026-05-01 — K-071 QA Early Consultation (PM proxy)

**Status:** Complete — 7 challenges raised; all 7 resolved to Option A (no blocker). Ticket correction: `visual-delta: yes` → `no`.

**Challenges summary:**
- C1 → No E2E impact: no spec asserts processRules content, count, or order
- C2 → No E2E impact: `npm run rules` is dev-only utility; not in build or test target
- C3 → No TypeScript error: `resolveJsonModule: true` — TS infers array type; new entries with same shape pass tsc
- C4 → No spec impact: `roles-doc-sync.spec.ts` reads README.md ROLES marker block only, not NAMED-ARTEFACTS
- C5 → No About page impact: `renderSlots.about.processRules = 5` reserved slot with no React component consuming it; no frontend file reads `siteContent.processRules`
- C6 → No regression: K-063 Release Status correction is docs-only text edit; no Sacred clause, no test assertion
- C7 → Ticket correction: `visual-delta: yes` wrong — processRules only render to README.md (generator), not deployed site. Corrected to `visual-delta: no`.

**What went well:** Discovered visual-delta misclaim (C7) early — prevents unnecessary Pencil SSOT sync gate from blocking a docs-only ticket.
**What went wrong:** Ticket authored with `visual-delta: yes` based on incorrect assumption that processRules renders on About page.
**Next time improvement:** Before setting `visual-delta: yes` for processRules mutations, verify a frontend component reads `siteContent.processRules`. Currently none does — About page slot is reserved but unimplemented.
**Slowest step:** Tracing renderSlots.about.processRules through all frontend source files to confirm no component consumes it (3 grep passes).

## 2026-04-30 — K-048 Phase 1 Sign-off

**What went well:** All 17 backend unit tests and 10 E2E tests (T1–T10) passed in first run; AC coverage was complete and testable.
**What went wrong:** 2 pre-existing failures (`scroll-to-top` AC-K053-04 + `shared-components` Footer snapshot `/about` + `/diary`) not in known-reds manifest — exposed missing manifest maintenance after K-059/K-067 landed.
**Next time improvement:** After any ticket changing page layout or footer, QA must regenerate snapshots OR add a known-red entry same ticket, not defer silently.
**Slowest step:** Canonical re-run to distinguish hydration drift from real regression — resolved in one step but required separate `cd canonical` run.


## 2026-04-30 — K-048 QA Early Consultation (PM proxy)

**Status:** Complete — 9 challenges raised; 8 resolved to AC or setup gate; 1 zero-impact (C9 Sacred).

**Challenges summary:**
- C1 → AC-048-P2-03 CLOSED-ONLY: exclude Binance in-progress candle (`close_time_ms > now_ms`)
- C2 → AC-048-P2-04 BACKFILL-PAGINATE: pagination loop for gaps > 1000 bars
- C3 → AC-048-P2-08 FORMAT-MIGRATION-TEST: update `test_history_db_contiguity.py` to detect both CSV header formats
- C4 → AC-048-P1-03 FRESHNESS-MOCK-NULL: return `null` when CSV not on disk
- C5 → AC-048-P2-05 IDEMPOTENT: skip commit if no new bars
- C6 → AC-048-P2-09 PUSH-AUTH (setup gate): `GH_PAT` secret with `contents: write` scope
- C7 → AC-048-P2-06 COMMIT-FORMAT: `[skip ci]` tag to prevent Cloud Build loop
- C8 → AC-048-P2-07 DEPLOY-TRIGGER: `gcloud run deploy` after push
- C9 → No AC: Sacred K-009/K-013/K-015 unaffected (bar_count only increases)

**What went well:** Caught CSV format migration regression risk (C3) before any code touched — `test_history_db_contiguity.py` raw `csv.reader` would silently mis-parse post-scraper 1D file.
**What went wrong:** N/A (PM proxy tier, pre-implementation consultation).
**Next-time improvement:** When a ticket changes CSV format on disk, always check if any test reads the file via raw `csv.reader` rather than `load_csv_history` — these are invisible to `load_csv_history` format-detection logic.
**Slowest step:** Determining Cloud Run ephemeral storage constraint (architecture constraint, §1.3) and its impact on hosting shape decision.

## 2026-04-29 — K-067 Early Consultation

**What went well:** Identified three cross-spec affected files (about-v2.spec.ts, about.spec.ts, about-layout.spec.ts) and the uncovered COMPARISON FileNoBar variant before any code was touched.
**What went wrong:** No prior spec covered `FILE Nº · COMPARISON` despite AC-034-P2-FILENOBAR-VARIANTS establishing the pattern for all other FileNoBar consumers; silent gap.
**Next time improvement:** When a new FileNoBar consumer label variant is added, Engineer must add it to AC-034-P2-FILENOBAR-VARIANTS same ticket, not deferred.
**Slowest step:** Tracing `AC-058-WHERE-I` intent (sacred vs. updatable) across three spec files took the most time; resolved by reading ticket K-058 frontmatter directly.




## 2026-04-29 — K-061 QA Early Consultation

**What went well:** Read all three spec files verbatim; identified LIFO mock ordering risk and fixture-loading side-effect before Engineer touched a line.
**What went wrong:** No prior Early Consultation existed for E2E mock-coverage tickets; the ECONNREFUSED gap class went undetected until 24 tests were already failing.
**Next-time improvement:** Any ticket adding or modifying page.route() handlers must list existing handlers for the same endpoint in the PR description to surface LIFO ordering conflicts before review.


## 2026-04-29 — K-059 QA Early Consultation

**Status:** Complete — 9 challenges raised, 6 supplemented to AC, 2 Known Gaps, 1 Engineer scope add.

**Challenges summary:**
- C-1 → New AC: AC-059-SCROLL-TRIGGER (IntersectionObserver via page.evaluate scroll, not rootMargin workaround)
- C-2 → AC-059-INFINITE-SCROLL supplemented: sentinel absent from DOM when hasMore=false
- C-3 → KG-059-01 Known Gap: CSS opacity transition visual timing deferred (screenshot-only, not CI-reliable)
- C-4 → AC-059-PAPER-PALETTE supplemented: visual-spec JSON colors imported, not hardcoded
- C-5 → New AC: AC-059-RAPID-SCROLL (sentinel fires ≥2 rapid scrolls; only one batch per event)
- C-6 → AC-059-A11Y-LOADING supplemented: aria-label literal verbatim preserved
- C-7 → Engineer scope: update T-D2/T-D7/T-D8/T-D9 + pages.spec.ts load-more assertions
- C-8 → New AC: AC-059-NO-SENTINEL-WHEN-EXHAUSTED (sentinel not in DOM after last batch)
- C-9 → KG-059-02 Known Gap: canLoadMore concurrent gate under IntersectionObserver (Vitest covers hook; E2E deferred)

**What went well:** Read diary-page.spec.ts line-by-line — identified all tests referencing diary-load-more needing update.
**What went wrong:** AC-059-INFINITE-SCROLL lacked sentinel DOM lifecycle assertion (appears/disappears with hasMore).

## 2026-04-28 — K-058 QA Early Consultation

**Status:** Complete — 7 challenges raised, 5 supplemented to AC, 1 Known Gap, 1 Engineer scope add.

**Challenges summary:**
- C-1 → AC-058-SECTION-LABELS-UPDATED (section Nº-label collisions in existing green tests)
- C-2 → KG-058-01 Known Gap (SVG mobile legibility at narrow viewport)
- C-3 → AC-058-PERIOD-STYLE scoped to `[data-section="..."] p`, FileNoBar exempted
- C-4 → AC-058-TICKET-CASES-GITHUB-LINKS (GitHub hrefs must match verbatim post-migration)
- C-5 → weight formula floor `max(1, recencyScore + severityScore)` added; AC-058-WEIGHT-FIX updated
- C-6 → AC-058-ROLE-CARD-HEIGHT replaced screenshot with `offsetHeight < 320` numeric assertion
- C-7 → Engineer scope: update `docs/qa/known-reds.md` T14 manifest entry in same PR

**What went well:** Existing E2E baseline (`about.spec.ts`, `about-layout.spec.ts`, `about-v2.spec.ts`) read thoroughly before raising challenges — no false positives. SVG coordinate math done from Designer spec to verify mobile clipping risk.
**What went wrong:** AC-058-WEIGHT-FIX as originally written was structurally impossible (formula cannot guarantee all-nonzero without floor). Should have been caught at PRD drafting. Lesson: weight-formula ACs need a floor specified at AC-authoring time.

## 2026-04-28 — K-057 QA gate (Phase A sign-off)

**Status:** ✅ QA-PASS — 290/311 Playwright passing; 21 known-reds all documented in manifest; 86/86 Vitest; tsc exit 0.

**Gate results:**
- **G1 tsc:** exit 0. ✓
- **G2 Vitest:** 86/86 pass (including legacy-merge entry expanded to 56 words to satisfy AC-024-LEGACY-MERGE). ✓
- **G3 Full E2E:** 290 pass / 21 fail (all known-red per `docs/qa/known-reds.md`) / 311 total.

**Known-red additions this ticket (20 newly documented pre-existing failures):**
- `about-layout.spec.ts` T14 — K-045 container migration changed section nesting depth; selector returns empty array
- `about-v2.spec.ts` AC-022-REDACTION-BAR — `[data-redaction]` elements removed in prior ticket, test not cleaned up
- `K-013-consensus-stats-ssot.spec.ts` Cases A–D — require live `/api/predict` backend; timeout without running backend
- `ma99-chart.spec.ts` × 10 — all require live `/api/ma99` + `/api/predict`; timeout without backend
- `upload-real-1h-csv.spec.ts` × 3 — require live backend + real CSV; timeout without backend

**What went well:** Commit-scope `git log main..HEAD -- <test-file>` verification classified all 21 failures as pre-existing without a single canonical re-run. ConsentBanner overlay was neutralized in snapshot tests via `addInitScript` consent grant before the gate — no Phase 5 regressions escaped to QA.

**What went wrong:** None this gate.

**Next time improvement:**
- When a site-wide overlay/banner component ships in the same ticket as E2E coverage, QA Early Consultation should add an adversarial case: "does this overlay render in snapshot tests, and do existing snapshot baselines need to be regenerated with overlay-dismissed?" Proactive catch at Early Consultation saves a multi-round diagnosis at gate time.

## 2026-04-27 — K-052 QA Early Consultation (pre-Architect, dual-emit ticket-derived SSOT)

**Tier:** Real-QA spawn (not PM proxy). Schema + pre-commit hook + dual emit targets are runtime/infra layer; PM proxy disallowed per `feedback_qa_early_proxy_tier.md`. 26 adversarial cases surfaced across site-content + sacred-registry outputs; PM ruled all 26 in same-session lock-ins (table in PRD §BQ Resolution Lock-Ins). No challenges left in OPEN state at Phase 1 close.

**Status:** ⚠ approved with locked-in scope expansion — original 8-AC scope expanded to 11 ACs + triple-emit architecture (site-content.json + sacred-registry.md + README marker block) + 6-ticket Sacred backfill + Designer persona patch as bundled deliverable. PM ruled every QA Challenge before Architect dispatch; no deferred-to-Engineer scope.

**Coverage matrix (QA Challenges → PM rulings, all RESOLVED):**

- **Site-content edge cases** (empty `docs/tickets/`, malformed YAML, K-* + `type: tech-debt` collision, empty AC + `status: closed`, AC heading variants, pre-commit hook noise on unrelated commits, `lastUpdated` source choice, TD→K rename) — 8 cases. PM ruling: BQ 1 permissive `featuresShipped` removes the `closed-commit:` gate edge entirely; AC heading variants resolved at Architect Phase 2 via canonical regex spec; pre-commit cross-output isolation enforced by AC-K052-03 last clause; `lastUpdated` decision deferred to Architect Phase 2 (truth table covers both options).
- **Sacred-registry edge cases** (heading variants `AC-021-FOOTER` vs `AC-K035-REGRESSION-01` vs `AC-034-P1-ROUTE-DOM-PARITY`, closed-but-not-shipped state, same-commit add+retire, modify-then-retire chain, reconcile-without-annotation drift, orphaned `retires-sacred:`, retirement-suffix notation drift, legacy backfill scope, cross-output isolation) — 9 cases. PM ruling: BQ 3 frontmatter `sacred-clauses:` declaration replaces grep-by-heading-pattern entirely (typo-class FN eliminated); Architect Phase 2 spec covers three-case algorithm + SHA hash + audit trail + reconcile workflow; legacy backfill of 6 tickets (K-021/K-031/K-034/K-035/K-040/K-046) bundled into K-052 close commit instead of follow-up TD.
- **Card #4 metric provenance** (`Guardrails in Place` had no programmatic SOR — manual override only) — 1 case. PM ruling: BQ 2 replaces with `Lessons Codified` (auto-derived from `claude-config/memory/feedback_*.md` filesystem count); manual-override field removed from schema.
- **README badge consistency** (badges hand-curated; SSOT JSON has separate stack list; risk of badge-vs-stack drift) — 1 case. PM ruling: Zone 1 makes README badges the 3rd JSON consumer via `<!-- STACK:start -->...<!-- STACK:end -->` marker block; structured stack schema `[{name, category, logo, color}]` enables downstream marker injection.
- **/about processRules section consumer** (slot-count vs entry-count mismatch when entries exceed display slots) — 2 cases. PM ruling: Zone 2 weight calc auto formula `weight = recencyScore + severityScore`; consumer component design deferred to K-057 (orphan SSOT period accepted, < 1 week to K-057 PR).
- **Designer persona generalization gap** (L231 of `~/.claude/agents/designer.md` referenced only `roles.json`; `Text fields are frozen-at-session snapshots` rule did not generalize to weighted-top-N rotation pattern) — 2 cases (Gap 1 + Gap 2). PM ruling: Designer persona patch bundled into K-052 Architect design doc as a single-commit deliverable, not a separate ticket.
- **README §Named Artefacts overlap with SSOT JSON** (which side wins on phrasing conflict?) — 1 case. PM ruling: README is SOR on overlap; SSOT generator reads README marker block to derive processRules entries; display-count divergence between consumers permitted and annotated per-entry in JSON.
- **Sacred lifecycle vocabulary symmetry** (frontmatter has `retires-sacred:` and `modifies-sacred:` but no declaration field; relies on heading-pattern grep) — 1 case. PM ruling: BQ 3 introduces `sacred-clauses: [AC-XXX]` as the third frontmatter field, forming a symmetric three-field family (declare / reconcile / retire) for the Sacred lifecycle.
- **Triple-emit cross-output isolation** (drift in one emit target should not cause spurious failure in another) — 1 case. AC-K052-03 last clause already covers; PM confirms triple-emit (vs original dual-emit) preserves the same isolation property — README marker block regen is independent of site-content.json regen which is independent of sacred-registry.md regen.

Total: 26 challenges raised → 26 ruled → 0 supplemented to AC as new gaps → 0 declared Known Gap → 0 OPEN at Phase 1 close.

**Adversarial coverage gaps to monitor in later phases:**
- AC count expansion: 11 ACs may need 2-3 additions in Phase 2 to cover the new triple-emit surface (weighted-top-N test, Lessons Codified count test, README marker injection test). Architect Phase 2 produces the final AC list; PM amends ticket if additions land.
- Designer persona patch is a K-052 deliverable but lives outside the worktree (`~/.claude/agents/designer.md`). Phase Gate Checklist needs an explicit verification line at Phase 6 confirming the persona file actually got patched (not just claimed in design doc).
- 6-ticket Sacred backfill is a same-session PM commit; verify each backfilled ticket's `closed-commit:` SHA resolves to a real merge commit on main before declaring K-052 closed.

**What went wrong:**
- Original Phase 1 PRD draft anchored on dual-emit (site-content + sacred) and missed the README badge consumer; Zone 1 surfaced only because PM probed README§Named Artefacts overlap during ruling pass. QA Early Consultation could have caught the badge-vs-stack drift earlier by enumerating README marker blocks as a separate consumer surface during the consultation. Codification: when a ticket touches a JSON SSOT that has a near-mirror in README, QA persona checklist should add `grep -E '<!-- [A-Z-]+:(start|end) -->' README.md` as a pre-verdict step to enumerate marker blocks as candidate consumers.
- Original PRD assumed manual-override `guardrails` field was acceptable scope; only during ruling pass did QA + PM converge on auto-derivable replacement (`Lessons Codified` from filesystem count). Lesson: when a schema field is documented as "manual override — no programmatic SOR", QA persona should challenge that classification (does an SOR exist that we haven't enumerated?) before approving the schema lock. Auto-derived metrics supersede manual-override fields when a programmatic SOR exists; manual-override is justified only when no consistent SOR.

**Next time improvement (codification candidates):**
- **QA persona — Marker-block consumer enumeration:** when a ticket introduces or modifies a `content/*.json` SSOT, run `grep -E '<!-- [A-Z-]+:(start|end) -->' README.md` AND `grep -rE '<!-- [A-Z-]+:(start|end) -->' docs/` during Early Consultation. Each marker block is a candidate consumer; surface to PM as a question "is this a third emit target?" before schema lock.
- **QA persona — Manual-override field challenge:** any schema field labeled "manual override — no programmatic SOR" gets a Challenge in Early Consultation: "what filesystem / git / tooling state could derive this automatically?" Default-decision should be auto-derive; manual-override accepted only when QA + PM agree no SOR exists.
- **QA persona — Sacred lifecycle vocabulary check:** when a ticket touches frontmatter conventions for one Sacred lifecycle action (declare / modify / retire), QA Early Consultation must verify the other two actions have symmetric vocabulary. Asymmetric naming (e.g. `modifies-sacred:` exists but no `sacred-clauses:`) is a typo-class false-negative trap; flag for PM ruling pre-Architect.
- **QA persona — Weighted top-N pattern recognition:** when consumer slot count is fixed and entry count is unbounded, surface the rotation algorithm as a Challenge before schema lock. Default rotation = recency; severity-weighted rotation needs a 3-tier severity tag in schema. PM rules pattern at AC-write time, not at Engineer-implement time.

**Verdict for PM:** ✓ **release Architect with PRD §BQ Resolution Lock-Ins block as canonical input.** Phase 1 closes clean — every challenge ruled in same session, no deferred-to-Engineer scope, no Known Gaps carried forward. Architect Phase 2 dispatches with the locked decision table + symmetric three-field Sacred frontmatter family + triple-emit architecture + Designer persona patch as bundled deliverable. AC count may grow from 11 to ~13-14 during Phase 2 design; PM amends ticket §Acceptance Criteria when Architect lands new ACs.

## 2026-04-26 — K-053 regression (post-Reviewer QA gate)

**Status:** ✅ QA-PASS — all 4 gates green; 2 pre-existing fails confirmed not K-053-introduced.

**Gate results:**
- **G1 tsc:** `frontend && npx tsc --noEmit` exit 0. ✓
- **G2 vitest:** 85/86 pass; 1 fail `diary.legacy-merge.test.ts` (legacy entry word count 33 < 50). Pre-existing — `git log main..HEAD -- frontend/public/diary.json frontend/src/__tests__/diary.legacy-merge.test.ts` returns empty; K-053 commit `05e56fd` did not touch either file. Diary content gap, not K-053 regression.
- **G3 K-053 spec:** `e2e/scroll-to-top.spec.ts` 3/3 pass (AC-K053-03 nav reset 1.2s, AC-K053-04 hash preserve 470ms, AC-K053-06 §1 same-route preserve 533ms). Deferred T-K053-04 absent per Architect M1 ruling (dep array contract). ✓
- **G4 full E2E:** 299 pass / 2 fail / 1 skip / 302 total (1.3min).
  - Fail #1: `ga-spa-pageview.spec.ts:164 AC-020-BEACON-SPA` — test self-document (lines 184-189) explicitly defers to K-033 fix and instructs "DO NOT loosen, WILL FAIL until canonical SPA pattern fix"; K-053 didn't touch GA path. Pre-existing.
  - Fail #2: `shared-components.spec.ts:275 Footer toMatchSnapshot on /` — 4105px diff (0.04 ratio); snapshot baseline last regenerated by K-040 (`338e670 chore(K-040): regen /home Footer snapshot after Item 3 full-bleed refactor`); K-053 didn't touch Footer / Home / shared-components spec. Pre-existing visual drift.
- Net delta vs Engineer-reported baseline (277p+3f → 299p+2f): +22 pass (K-053 +3 plus other merges since baseline), -1 fail (an earlier baseline fail resolved). No NEW failure attributable to K-053.

**Adversarial coverage (per QA Early Consultation §):**
- Hash anchor preservation → covered AC-K053-04 (T-K053-02). ✓
- Browser POP nav → AC-K053-06 spec; deferred T-K053-04 documents Phase-2 follow-up. ✓
- Same-route navigation → covered AC-K053-06 §1 (T-K053-03). ✓
- Modal/query change → N/A in current routes (no `?q=` consumers); Engineer correctly deferred per dep-array contract.
- Refresh restore → `history.scrollRestoration = 'manual'` set on ScrollToTop mount; verified `frontend/src/components/ScrollToTop.tsx` per BQ-K053-04 ruling.

**What went well:** Pre-existing fail classification was deterministic — `git log main..HEAD -- <test-file> <subject-file>` returned empty for both fail cases inside one Bash call, no canonical re-run needed (commit-scope grep is faster than hydration drift workflow when the changed-file list is small and disjoint).

**What went wrong:** None this gate.

**Next time improvement:** When Engineer pre-measures baseline (277p+3f), QA should record the canonical SHA the baseline was measured at — current run shows 299p+2f because intervening main merges shifted the count, making "baseline match" arithmetic ambiguous. One-line "baseline measured at SHA X" in Engineer handoff would let QA do exact diff arithmetic instead of inferring "no NEW failure" from commit scope.

## 2026-04-26 — K-053 QA Early Consultation (pre-Architect adversarial review of design doc)

**Status:** ⚠ approved with caveats — 2 must-fix factual errors in design doc §3.3 spec contract; 6 adversarial cases worth folding into truth table; 2 BQs flagged for PM Phase 1 ruling (AC-K053-06 same-route + back/forward POP).

**Design doc verification (verified vs design doc claims):**
- §2 quoted `frontend/src/main.tsx` at base SHA `803935e` matches `git show 803935e:frontend/src/main.tsx` byte-for-byte (BrowserRouter L33, GATracker L34, Suspense L35) — Architect Pre-Design Audit dry-run honest. ✓
- §7.1 source-side scan (`grep -rn "scrollY|scrollTo|scrollIntoView|window.scroll" frontend/src/`) — 0 hits confirmed. ✓
- §7.2 E2E-side scan — confirmed `frontend/e2e/about-layout.spec.ts:44-45` are the only `window.scrollY` reads (geometric, read-only). ✓
- `useGAPageview` mirror pattern — confirmed at `frontend/src/hooks/useGAPageview.ts` (17 LOC, `useEffect([location.pathname])`, returns void). Architect's structural-mirror claim verified.
- No CSS `scroll-behavior: smooth` anywhere; no `behavior: 'smooth'` in src/. ScrollToTop will not fight in-page smooth-scroll. ✓

**Truth-table review (16 rows):**
- Row-by-row verdict agreement: **agree on 14/16**, **flag 2/16** (rows #11 refresh-mid-scroll, #5 hash removal — Architect default-decision OK technically but reasoning underplays browser-default-restore expectation; see BQs below).
- Default-decision rows (#5, #11) labelled correctly as Architect default (not PM block) — naming convention helps Engineer/Reviewer challenge.
- Rows #8 (same-route) and #9/#10 (POP back/forward) correctly flagged as PM-ruling slots per `AC-K053-06`. ✓
- StrictMode row #15 idempotency claim (`scrollTo(0,0)` twice = no-op): VERIFIED. `window.scrollTo` to current position is a synchronous no-op; React 18 dev-mode double-invoke produces zero user-visible effect. ✓
- Hash early-return idempotency (row #3/#4): VERIFIED. `if (hash) return` runs synchronously before any side effect; double-invoke under StrictMode is a no-op for the hash branch too.

**Adversarial cases added (6 new edge cases worth raising to spec or noting in design doc):**

1. **`/about` page already exposes 6 hash-targetable IDs** (`#header`, `#metrics`, `#roles`, `#pillars`, `#tickets`, `#architecture` — verified `frontend/src/pages/AboutPage.tsx:31-61`). Design doc §22 says "site has zero `#anchor` href today" which is true for **link sources** but understates that **link targets exist**: any external email/README/social-share with `https://site/about#architecture` will already trigger the hash-mount path (truth-table row #16). Forward-compat insurance is **already exercisable today** by external traffic. Recommend §22 wording fix to "no internal `<a href="#...">` consumers; external deep-link to `/about#architecture` already valid via existing section IDs". No code change required — row #16 behavior is correct.

2. **URL with both pathname change AND hash** (e.g. `/about` → `/diary#K-049`): truth table doesn't enumerate this combo. Trace through code: `pathname` changes → effect re-fires → `hash` is non-empty → early-return → browser anchor wins. Behavior matches user mental model (hash takes precedence). **Recommend Architect add as row #17** for explicitness, OR Engineer adds an inline comment in `ScrollToTop.tsx` noting "early-return on hash applies to ALL pathname-change navigations to a hash target, not just same-pathname hash-only changes".

3. **`prefers-reduced-motion` users**: Architect chose `behavior: 'instant'` which side-steps the question entirely (instant ≠ smooth ≠ animated). **VERIFIED**: instant means no animation regardless of OS reduced-motion setting. ✓ No issue. Worth a JSDoc one-liner noting this for future maintainers ("instant chosen explicitly to bypass smooth-scroll preference negotiation").

4. **Browser `history.scrollRestoration` interaction**: design doc §22 mentions this as "trade-off, see truth-table row #9/#10/#11" but does NOT confirm WHEN our useEffect fires relative to browser's restoration attempt on POP nav. Adversarial concern: on Back-button POP, browser may attempt scroll restoration BEFORE React commits the new route's element tree; our `useEffect` fires AFTER commit; net effect = browser restores → React commits → useEffect fires → we override to 0. Result is correct (we always end at 0 with current design) but the **single-frame visual flicker** (user sees old position briefly, then jump to 0) on POP is not covered by AC-K053-03 "no smooth-scroll animation perceived". **Recommend Phase 1 PM ruling** include explicit verdict: is single-frame restore-then-override flicker acceptable, OR should we set `history.scrollRestoration = 'manual'` in ScrollToTop's first effect run to suppress browser restore entirely? If POP-restore option chosen later (option from row #9/#10 BQ), this becomes critical.

5. **Lazy-route Suspense interaction (rows #1, #14)**: per K-049 Phase 3, all 5 routes are `lazy()` (verified `frontend/src/main.tsx:14-19`). On `/diary` → `/about` PUSH, the sequence is: pathname changes → React begins suspending while AboutPage chunk loads → `<Suspense fallback={<RouteSuspense />}>` renders → useEffect fires NOW (effect runs after commit, even of Suspense fallback) → scrollTo(0,0) → AboutPage chunk loads later → AboutPage mounts. Net result: scroll resets to 0 BEFORE AboutPage paints, which is correct behavior (Suspense fallback at top, then content at top). But T-K053-01 spec uses `page.waitForURL('**/about')` which fires on URL change, NOT on AboutPage paint — possible race where assertion runs before AboutPage finishes lazy-loading. Recommend spec adds `await page.waitForLoadState('networkidle')` OR `await expect(page.getByRole('heading', { name: /about/i })).toBeVisible()` after `waitForURL` to guarantee chunk-loaded state.

6. **Programmatic `useNavigate()` from non-existent code path**: VERIFIED no `useNavigate` consumer exists in `frontend/src/` today (grep returns zero hits — only `<Navigate>` declarative redirect on catch-all `*` route at `main.tsx:40`). Architect's row #14 hypothetical "login redirect navigate('/about', { replace: true })" is forward-compat speculation; no AC-driven test possible until consumer code exists. Recommend leaving row #14 in truth table as a contract for future code, but skip building a Playwright assertion for it (no observable behavior to test). Architect already correctly omits a T-K053 case for it.

**MUST-FIX factual errors in design doc §3.3 spec contract** (Engineer cannot copy-paste-implement as written):

- **(M1) `mock-apis` import path WRONG**: design doc shows `import { mockApis } from './_fixtures/mock-apis'` but actual file is `frontend/e2e/mock-apis.ts` (no `_fixtures/` subdirectory; verified `ls frontend/e2e/_fixtures/` returns only `diary` subdir — no mock-apis.ts there). Correct import: `import { mockApis } from './mock-apis'`. **Block-level fix required** — Engineer copy-paste would produce module-not-found tsc error.
- **(M2) `data-testid="diary-timeline"` does NOT exist**: design doc T-K053-01 + T-K053-02 use `await page.waitForSelector('[data-testid="diary-timeline"]')` as settle anchor. Actual testids on DiaryPage tree (verified grep): `diary-main` (page main), `diary-entry` (per item), `diary-rail`, `diary-marker`, `diary-load-more`, `diary-loading`, `diary-error`, `diary-empty`. **Recommend** `await page.waitForSelector('[data-testid="diary-entry"]')` (waits for first entry to render = body height extends past 500px) OR `await page.locator('[data-testid="diary-entry"]').first().waitFor()`. Block-level fix required — current selector will timeout.

**Test surface gaps:**
- T-K053-01 lacks `await page.waitForLoadState('networkidle')` between `waitForURL` and scroll assertion — possible race with lazy AboutPage chunk load (see adversarial #5).
- T-K053-02 hash-injection test is correct in approach but doesn't programmatically prove the early-return executed (only proves scrollY > 0 after hash nav). To distinguish "browser anchor put us there" from "no scroll change at all", the spec should ALSO assert `scrollY > some-threshold-near-anchor-target` (currently `> 0` is satisfied by any non-reset). Recommend `toBeGreaterThanOrEqual(700)` given the synthetic anchor is at top:800px.
- T-K053-03 (`AC-K053-06`) ships as `.skip()` — acceptable per Phase-1-pending; un-skip plan for both PM-ruling options should be drafted in design doc §3.3 (currently says "Engineer un-skips and writes assertion" — too open-ended; pre-write both option-a and option-b assertion bodies as commented blocks so Engineer just deletes the unused branch).
- **Missing Playwright case: query-only navigation preserves scroll** (truth-table row #6/#7). Design doc lists this in truth table but `scroll-to-top.spec.ts` contract has no test asserting it. Without a Playwright case, future bug where someone changes `useEffect` deps to `[pathname, hash, search]` would slip past CI. Recommend adding **T-K053-04** (`AC-K053-04` extension): scroll on `/about`, programmatically `navigate('/about?tab=foo')` via `history.pushState`, assert scrollY unchanged. Single-test addition, ~12 LOC.
- **Missing Playwright case: same-pathname hash-add preserves scroll** (truth-table row #3): T-K053-02 hash-injection covers it indirectly (sets `window.location.hash` mid-page) but doesn't traverse a `<Link to="/diary#anchor">` style navigation. Acceptable given no production link source exists today, but worth noting as a future test if `/diary` ticket-anchor links land per K-049 followup.

**Engineer pre-implementation notes (must-have hints derived from QA review):**
- **Fix M1 + M2 BEFORE writing T-K053-01/02**: corrected imports + selectors above.
- **Add T-K053-04** (query-preserve scroll) to spec — non-controversial, locks in the dep-array `[pathname, hash]` choice via regression test rather than relying on truth-table prose alone.
- **Effect dep array justification (§3.1 explanation) is correct** — verified by row #5 truth-table walk: removing hash from deps would cause `/diary#K-049` → `/diary` to NOT fire effect (neither `pathname` nor stale-`hash`-removed-from-deps changed). `[pathname, hash]` is the only correct config given the early-return semantics.
- **Mount position after `<GATracker />`, OUTSIDE `<Suspense>`** — Architect's §3.2 reasoning is correct. Suspense fallback render does not block useEffect commit; effect fires on fallback render too, which means scroll resets to 0 before lazy chunk finishes loading (correct UX — user sees fallback at top, then content at top).
- **No `setTimeout` / `requestAnimationFrame` wrapping** — confirmed correct per §3.1 reasoning. useEffect runs after commit; synchronous scrollTo from inside effect is the right shape.

**BQs for PM (Phase 1 ruling slots):**

- **BQ-K053-01 (AC-K053-06 same-route navigation, truth-table row #8):** when user clicks `/about` link in NavBar while already on `/about`, `pathname` is unchanged so effect does NOT fire — scroll position preserved. **QA recommendation: option (a) accept no-reset.** Reasoning: re-clicking a link to where you already are is conventionally a noop (browsers don't reset scroll on re-clicking the address bar URL either). Implementation cost: zero. If PM disagrees and wants force-reset on same-route click, option (b) requires `useNavigationType()` + `Date.now()` dep trick (single line addition, but introduces a "click counter" mental model that's harder to reason about). Default recommendation aligns with operator's bug report (which was about cross-route loss of position, not same-route).

- **BQ-K053-02 (truth-table rows #9/#10 — POP back/forward):** browser back from `/about` → `/diary` currently resets scroll to 0 under Architect default. Browser-default behavior would attempt scroll restoration to `/diary`'s prior position. **QA recommendation: option (a) accept always-reset (current design).** Reasoning: (i) consistent mental model "every nav goes to top, including back"; (ii) operator complaint was about UX defect, not about losing scroll-restore feature; (iii) implementing POP-exception requires `useNavigationType()` + skip on `'POP'` action — adds 3 LOC + introduces a behavioral asymmetry (PUSH resets, POP doesn't) that users may find confusing. **Caveat:** if PM chooses option (b) restore-on-POP, we must ALSO set `history.scrollRestoration = 'manual'` to prevent the single-frame double-restore flicker (browser restores → useEffect fires → no-op now). Layered design risk increase.

- **BQ-K053-03 (truth-table row #11 — refresh mid-scroll):** browser default with `history.scrollRestoration = 'auto'` would restore the user's prior scroll position on F5 refresh. Architect default forces top on initial mount. **QA recommendation: option (a) accept reset-on-refresh (current design).** Reasoning: (i) refresh is "user explicitly re-entered URL" → reasonable to start fresh; (ii) if user wants to preserve state across refresh, app-level state-persistence is the right mechanism, not browser scroll-restore. **Counter-argument PM should consider:** for `/diary` specifically (long timeline), refresh-mid-scroll losing position IS annoying; users may prefer browser default here. If PM rules option (b) preserve-on-refresh, Architect adds `useRef`-based first-mount guard to skip the first effect run — single-line addition. Default recommendation aligns with "every nav including initial-mount goes to top".

- **BQ-K053-04 (POP single-frame flicker, dependent on BQ-K053-02 outcome):** if option (a) for BQ-K053-02 (always reset on POP), is the single-frame "browser restored to old position → useEffect fires → snap to 0" visual flicker acceptable on slow devices? QA cannot test this empirically without slow-device fleet, but the theoretical concern is worth a PM-acknowledged Known Gap. **Mitigation if needed:** set `history.scrollRestoration = 'manual'` in ScrollToTop's first effect run to suppress browser restore entirely; eliminates flicker; one-line addition. Recommend PM accepts current design with this Known Gap noted.

**Verdict for PM:** ⚠ **release Engineer with caveats** — design doc is structurally sound (mirror pattern correct, dep array correct, mount position correct, regression analysis comprehensive); but the **2 factual errors in §3.3 spec contract (mock-apis path, diary-timeline testid) MUST be corrected by Architect Edit BEFORE Engineer reads the design doc**, otherwise Engineer will copy-paste and hit immediate tsc/Playwright failures. Recommend PM either (a) bounce design doc back to Architect for §3.3 correction (preferred — keeps design doc as authoritative source), or (b) explicitly authorize Engineer to deviate from §3.3 import path and selector at implementation time with this QA Early Consultation entry as the deviation evidence. Phase 1 PM rulings on BQ-K053-01/02/03/04 must land in PRD §QA Challenge Rulings before Engineer un-skips T-K053-03 and writes its assertion.

**What went well:**
- Architect Pre-Design Audit dry-run on `git show 803935e:frontend/src/main.tsx` was honest — every line-number citation verified against actual source. No hallucinated mirror pattern.
- Truth-table 16-row enumeration covered hard-to-reason-about combos (initial mount + hash, StrictMode double-invoke, query-only change) without leaving "Engineer decides" cells.
- §7 Regression Analysis correctly identified that `about-layout.spec.ts:44-45` is read-only `window.scrollY` and won't break.
- Mirror-pattern choice (`useGAPageview`) is exactly right — keeps the codebase's "side-effect-on-route-change" mental model singular.

**What went wrong:**
- Architect cited a Playwright fixture path (`./_fixtures/mock-apis`) without `ls`-verifying it — actual path is `./mock-apis`. Pre-Design Audit dry-run was applied to source code (correct) but NOT to test fixture infrastructure (gap). Recurring pattern with Architect spec contracts referencing test fixtures.
- Architect cited `data-testid="diary-timeline"` as a settle anchor without grepping DiaryPage component tree — testid does not exist. Same gap class as the mock-apis path.
- Truth table missed the "pathname change AND hash" combo as an explicit row (covered implicitly by combining row #1 + row #16, but not enumerated).
- §22 "site has zero `#anchor` href today" understates that hash TARGETS exist on /about (6 section IDs) — external deep-link to `/about#architecture` already exercises the hash-mount path; forward-compat is not purely speculative.

**Next time improvement:**
- **QA persona hard step (codify):** when reviewing an Architect design doc that contains a Playwright spec contract (any `.spec.ts` snippet), QA must run `ls <referenced-fixture-path>` AND `grep -rn <referenced-data-testid> frontend/src/` for every fixture import + selector cited in the design doc. Failure-to-verify is a recurring class for Architect (precedent: Engineer-side has a similar rule per `feedback_engineer_e2e_spec_logic_selfcheck.md`). Add to `~/.claude/agents/qa.md` Early Consultation section as a pre-verdict gate.
- Recommend PM consider promoting the same gate to Architect persona: before claiming a fixture/testid in a design doc spec contract, Architect runs `ls` + `grep` on cited paths. Currently Architect's Pre-Design Audit dry-run gate is source-code-focused; extend to test-infra paths.

---

## 2026-04-26 — K-051 Phase 4 Regression Pass (RELEASE-OK verdict)

**Tier:** Real-QA spawn. Phase 4 sign-off after Reviewer RELEASE-OK (0/0/2 Info, PM accept-as-is). 7-check matrix + 3 adversarial probes.

**做得好：**
- Backend pytest **79/0/0** in 40.18s — exact match to Architect §6.1 (76 baseline + 3 new boundary). New `_fetch_30d_ma_series` boundary trio (128 → []/129 → 30/130 → 30), reshaped drift-guard `SACRED_FLOOR == MA_TREND_WINDOW_DAYS + MA_WINDOW == 129`, truncated-DB Sacred negative at `bars_to_keep=128`, pre-existing `_fetch_30d_ma_series_*` family all green.
- **Sacred substring runtime byte-identity:** subprocess eval → `'ma_history requires at least 129 daily bars ending at that date.'` — single-quoted, period-terminated, K-051 user-retest SOP grep substring bit-identical (30 + 99 = 129 interpolated).
- `tsc --noEmit` exit 0. Targeted Playwright (ma99-chart + upload-real-1h-csv) **16/16 PASS** 10.8s — 6 i18n assertion edits + line-247 description + `getByTestId('error-toast')` swap all green first run.
- Full Playwright **299/2/1** — 1 PASS BETTER than Engineer baseline (298/3/1). The 2 fails = documented pre-existing flakes only (`ga-spa-pageview AC-020-BEACON-SPA` + `shared-components AC-034-P1 Footer snapshot on /`); about.spec.ts:26 AC-017-NAVBAR did NOT recur, confirming Reviewer's parallel-execution flake claim. Zero new failures.
- **Probe 6a (boundary subsumption):** synthetic `_fetch_30d_ma_series` calls with n ∈ {99,100,127,128} all returned `[]`; n=129 → 30 floats. New gate genuinely subsumes OLD 99-128 range — regression coverage extension real.
- **Probe 6b (testid uniqueness):** `data-testid="error-toast"` = 1 source hit (AppPage.tsx:350) + 1 assertion hit (upload-real-1h-csv.spec.ts:164); zero collision with StatsPanel/MatchList/ErrorBoundary/ErrorBanner red surfaces. `AC-051-09-NO-ERROR-TOAST` green via `toHaveCount(0)`.
- **Probe 6c (CJK enumeration):** `grep -rnP '[一-鿿㐀-䶿぀-ゟ゠-ヿ　-〿＀-￯]'` ~50 hits, every one in design doc §1.3 allow-list (MainChart.tsx:33,38 zh-TW regex; UnifiedNavBar comments; diary.english.test CJK_REGEX; K-046 Sacred; 7 spec-comment files K-021/22/40 cosmetics). Zero leak in Phase 4 scope; zero full-width punctuation per B4.
- **Architecture.md gate:** frontmatter line 5 + Changelog line 683 both carry Phase 4 narrative. Doc-sync mandate satisfied.

**沒做好：** TD-K030-03 (`visual-report.ts` throw-on-missing-TICKET_ID) still pending; lazy-eval guard held this pass (no `K-UNKNOWN-*.html` pollution), but root fix overdue. Pre-existing, not Phase 4 regression.

**下次改善：** when Reviewer Info findings flag AC-text-vs-spec mismatch (F-N1: AC-051-11 says "both visible-true AND visible-false" but spec has only visible-false), QA should grep/Read verify at runtime + report `Info confirmed: <details>` in entry. Practiced this pass. Codify into `~/.claude/agents/qa.md` Mandatory Steps if K-052 surfaces second case (memory candidate `feedback_qa_verify_reviewer_info_findings.md`, low priority).

**Verdict: RELEASE-OK** — 7 checks PASS, 3 probes negative, full Playwright 1 PASS better than baseline. PM cleared to ship K-051 Phase 4.

## 2026-04-26 — K-051 Phase 4 Early Consultation (AC-051-10/-11/-12 pre-Architect)

**Tier:** Real-QA spawn (not PM proxy). AC-051-10 changes a backend runtime gate at `predictor.py:156` (semantic threshold shift 99 → 129, message text becomes f-string) — this is exactly the runtime/schema/layout class that `feedback_qa_early_proxy_tier.md` forces real-qa for. AC-051-11 is a frontend DOM hardening; AC-051-12 is i18n that touches Playwright text-anchored assertions in 3 specs. PM proxy disallowed.

**Sacred regression invariants in play:**
- K-015 / K-051: Sacred ValueError substring `"ma_history requires at least 129 daily bars ending at that date"` — user retest SOP greps for this literal.
- AC-051-10 retires the doc/code drift recorded in `test_predict_real_csv_integration.py` lines 33-43 + `SACRED_FLOOR = MA_WINDOW = 99`. After Phase 4, gate fires at <129, drift-comment must be deleted, `SACRED_FLOOR = 129`, `bars_to_keep = 128`.

### (a) AC review findings — edge cases PM/Architect must tighten

**AC-051-10 (gate align, predictor.py:156 + 335):**

1. **Hidden caller of `_fetch_30d_ma_series` — line 343 inside the matching loop.** `find_top_matches` calls `_fetch_30d_ma_series` TWICE: once at line 331 (query side, `query_30d_ma`) where the empty-return raises the Sacred ValueError at line 333-336; AND at line 343 inside `for i in range(0, len(history) - n - future_n)` (candidate side, `candidate_30d_ma`) where empty-return is silently `continue`'d (line 344-345). The gate change at line 156 affects BOTH callsites. Implication: with the live DB at 3176 rows, the candidate-side gate will reject 30 more candidate windows per match attempt (those whose `idx` falls in [99, 128]) than the previous threshold did, because each window now needs 30 more prefix bars. **PM must explicitly confirm** that this candidate-side tightening is desired (it likely is — the original drift was the bug — but it shifts the match-set composition slightly). Architect must document the dual effect in the Phase 4 design doc; Engineer must NOT scope-downgrade to "only patch the query side".

2. **Existing unit tests at `backend/tests/test_predictor.py:582-603` will break under the new gate.**
   - `test_fetch_30d_ma_series_sufficient_returns_30_points` (line 582): builds 200 bars, anchors at index 150, currently returns 30 floats. Under new gate: needs `len(combined_closes) >= 129`. Anchor-150 has prefix [0..150] = 151 bars; 151 >= 129 → still passes. **OK.**
   - `test_fetch_30d_ma_series_insufficient_prefix_returns_empty` (line 590): 50 bars, anchors at last bar. Currently returns `[]` because 50 < 99. Under new gate: 50 < 129, still returns `[]`. **OK.**
   - **But:** there is NO existing unit test at the empirical boundary (98/99 bars, 128/129 bars). After Phase 4, the boundary shifts and the test gap is wider (no test catches a future regression that flips the gate from `< 129` back to `< 99`). **Required:** Engineer must add two boundary tests: (a) 128 bars → returns `[]`; (b) 129 bars → returns 30 floats. Both anchor at last bar. Without these, AC-051-10 has no unit-level coverage at the exact threshold AC mandates.
   - `test_predict_endpoint_requires_valid_date_for_ma99_trend` (line 155 onward): assesses end-to-end ValueError from `/api/predict`; payload uses 20 bars with `time: ""`. Under new gate, this test is unaffected (it fails on `MIN_BARS_FOR_MA_TREND` first, line 327-328) — but Engineer must verify by re-running.

3. **Message-text drift-guard test at `test_predict_real_csv_integration.py:201-206` will FAIL after Phase 4.** It currently asserts `SACRED_FLOOR == MA_WINDOW == 99`. After AC-051-10, `SACRED_FLOOR` is redefined to `MA_TREND_WINDOW_DAYS + MA_WINDOW = 129`, decoupled from `MA_WINDOW` alone. The assertion `SACRED_FLOOR == MA_WINDOW == 99` becomes false. Engineer MUST update this test in the same commit per AC text ("`SACRED_FLOOR` becomes `MA_TREND_WINDOW_DAYS + MA_WINDOW = 129`; drift-guard test asserts `SACRED_FLOOR == 129` and removes the prior 'drift between message and gate' comment"). **Verify:** also delete the explanatory paragraph at lines 33-43 that documents the drift — it is now a stale historical artifact and would mislead future readers.

4. **Truncated-DB negative test `test_truncated_db_raises_sacred_value_error` (line 137-177) — bars_to_keep arithmetic.** Currently `bars_to_keep = SACRED_FLOOR - 1 = 98` to push below the empirical 99-bar gate. After AC-051-10: `bars_to_keep = SACRED_FLOOR - 1 = 128`. AC text confirms 128. **Edge case:** at exactly 128 bars, the new gate `len(combined_closes) < 129` fires → empty return → Sacred raises. At exactly 129, gate does NOT fire → matches return. The negative test pinning `128 → raise` is correct. **But:** ensure the truncated DB still has the `2026-04-07` end_date row reachable; with 128 bars going back from 2026-04-07, `end_date` of the trailing 30-day window is fine, but the live DB has 3176 rows so 128 bars back from 2026-04-07 ends around 2025-12-01 — well within the DB. Engineer must verify `_write_truncated_daily_db` arithmetic still works with the larger `bars_to_keep`.

5. **History-1H `_query_ma_series` at `predictor.py:168-189` — separate ValueError raise sites.** Lines 181, 184, 188 raise three different ValueError messages, none of which contain the Sacred substring. AC-051-10 does NOT touch these and should not — they are 1H-input MA99 path, not the 30-day daily MA history path. **No action needed**, but PM must confirm scope boundary: AC-051-10 is `_fetch_30d_ma_series` only, `_query_ma_series` 1H gate is unrelated. Document this in the Phase 4 design doc to prevent Engineer from "while we're at it" expanding scope.

**AC-051-11 (`data-testid="error-toast"` hardening):**

6. **Single dependent spec — confirmed.** Grepping `frontend/e2e/` and `frontend/src/__tests__/` for `text-red-400.border-red-700.bg-red-950` returns only `upload-real-1h-csv.spec.ts:172`. No other spec uses the chained-class selector. **PM-actionable risk:** none on this front. Selector swap is local.

7. **Other red-error UI surfaces use the same Tailwind classes individually** (StatsPanel.tsx:147,154,155 — pct text; MatchList.tsx:394 — trend arrow; ErrorBoundary.tsx:16-17 — page-level; ErrorBanner.tsx:8-9 — business-logic page). Bare `.text-red-400` would match these. The 3-class chain currently disambiguates. After adding `data-testid="error-toast"` and swapping to `getByTestId`, the chained selector is gone — but the toast bar at `AppPage.tsx:350` is still styled with the same 3 classes. **No bug**, but Engineer must NOT remove the visual classes — i.e. the AC says "add `data-testid` attribute to the wrapping `<div>`", not "refactor the toast styling". Test assertion swap is independent of styling.

8. **Existing inner-text assertion `✗ {errorMessage}` (AppPage.tsx:351) is preserved per AC text** — but no spec currently asserts the `✗` glyph specifically. **Optional improvement (non-blocking):** Engineer could add `await expect(page.getByTestId('error-toast')).toContainText('✗')` to anchor the visual glyph; not required by AC but cheap.

**AC-051-12 (UI Chinese → English):**

9. **Six string sites confirmed correct in AC; one MISSED string** at `BusinessLogicPage.tsx:106` is mentioned, but Chinese also appears at:
   - `frontend/src/AppPage.tsx:399` — `(最新：${historyInfo['1H'].latest ?? 'N/A'} UTC+0)` ← AC mentions line 399 ✓
   - `frontend/src/AppPage.tsx:363` — `Upload 1H CSV（可多選）` ← AC mentions line 363 ✓
   - `frontend/src/AppPage.tsx:379` — `多檔合併 · 每檔 24 × 1H bars · UTC+0` ← AC mentions line 379 ✓
   - `frontend/src/components/MainChart.tsx:264` — `'MA(99) 計算中…'` ← AC mentions line 264 ✓
   - `frontend/src/components/MainChart.tsx:270` — `⚠ MA99 資料缺失：{...} ~ {...}（歷史前置資料不足 99 根）` ← AC mentions line 270 ✓ but **note** the surrounding template-literal punctuation `：` and `（…）` are full-width CJK chars; replacement must use ASCII `:` and `(…)` to truly be English (writing "MA99 missing：..." would still leave a CJK colon in DOM).
   - `frontend/src/components/PredictButton.tsx:16` — `'MA99 計算中，請稍候…'` ← AC mentions line 16 ✓
   - `frontend/src/pages/BusinessLogicPage.tsx:106` — `<LoadingSpinner label="載入內容中…" />` ← AC mentions line 106 ✓

   **All seven sites covered.** No site missed in the AC — verified by grepping `[一-龥]` across `frontend/src/`.

10. **Code-internal Chinese explicitly out-of-scope per AC text** — confirmed: `MainChart.tsx:33-42` (regex parsing zh-TW timestamps `上午|下午`) is functional and stays; `UnifiedNavBar.tsx:7-20` JS comments stay; `__tests__/diary.english.test.ts:9-16` CJK regex stays. **PM/Architect should verify** the i18n PR description explicitly calls out these intentional exclusions to head off Reviewer false-positive comments.

11. **Three E2E spec assertion sites at `ma99-chart.spec.ts` cited (188, 194, 238, 247, 268, 274) — that's six sites, not three. AC text matches the actual 6 sites (188, 194, 238, 247, 268, 274). Test name on line 247 includes Chinese in the `test(...)` description string itself: `test('MainChart shows MA99 計算中 label while loading, then value after load', ...)` — Engineer must update the test NAME too, not just the assertion. Otherwise Playwright HTML report will show mixed-language test names. **AC clarification needed:** does AC-051-12 require updating test descriptions, or only assertions? PM ruling.

12. **diary.json content at `frontend/public/diary.json:6`** quotes the Sacred error string `'ma_history requires at least 129 daily bars'` in user-facing diary text. This is the AC-051-10 message AFTER alignment, so **no change needed** — but Engineer must verify the diary.json string still matches `predictor.py:335` post-edit byte-for-byte. If Engineer accidentally rewords (e.g. lowercase, extra punctuation), the diary entry becomes incorrect.

13. **No unit-test or fixture file depends on Chinese strings besides `ma99-chart.spec.ts`** — verified by grep. Vitest specs at `frontend/src/__tests__/` do NOT assert any of the seven strings. `__tests__/diary.english.test.ts:9-16` uses CJK regex defensively to ENSURE no CJK leaks into diary.json — that test will continue to pass after Phase 4 (it asserts diary content is English; Phase 4 makes more strings English, not less).

### (b) Tests that must run AND tests likely to break

**Backend pytest (must run after Phase 4 implementation):**
- `pytest backend/tests/test_predictor.py` — full file (76+ tests). At-risk: `test_fetch_30d_ma_series_*` family (lines 582-603) — must verify the existing 4 still pass under new gate, and Engineer ADDS the boundary pair (128 → empty, 129 → 30 floats).
- `pytest backend/tests/test_predict_real_csv_integration.py` — all 3 tests. **Will BREAK without same-commit edits**: positive test still passes (live DB has 3176 bars >> 129); negative test breaks unless `bars_to_keep` updates 98 → 128; drift-guard test BREAKS unless `SACRED_FLOOR` redefined and assertion updated per AC-051-10.
- `pytest backend/tests/test_history_db_contiguity.py` — 3 tests. Unrelated to Phase 4 changes; must still pass (regression sanity).
- `pytest backend/tests/test_main.py` — `/api/predict` endpoint integration. Must verify no payload that previously returned 200 now raises Sacred (i.e. real DB still has ≥129 bars; verified — 3176).

**Frontend Playwright (must run after Phase 4 implementation):**
- `npx playwright test ma99-chart` — 6 assertion changes per AC-051-12. Will BREAK if Engineer skips any of the 6 sites.
- `npx playwright test upload-real-1h-csv` — selector swap per AC-051-11. Will BREAK if `data-testid` not added or spec not swapped.
- Full Playwright suite — must still show baseline 299/2/1 (the 2 documented pre-existing flakes). Any new failure = regression.
- `npx tsc --noEmit` — translation strings should not introduce type errors; safety net.

**Vitest:**
- `frontend/src/__tests__/diary.english.test.ts` — CJK guard on diary content; unrelated, must still pass.

### (c) Verdict

**RELEASE-OK** for Architect to proceed to Phase 4 design — but conditional on PM ruling on the following BLOCKING items before Engineer release:

- **B1 (AC-051-10):** add explicit AC clause "Engineer adds boundary unit tests at `test_predictor.py`: `test_fetch_30d_ma_series_at_floor_returns_30_points` (129 bars → 30 floats) + `test_fetch_30d_ma_series_below_floor_returns_empty` (128 bars → `[]`)". Without these, gate change has no unit-level proof at the exact threshold the AC mandates.
- **B2 (AC-051-10):** add explicit AC clause "Engineer deletes the empirical-floor explanatory paragraph at `test_predict_real_csv_integration.py:33-43` and rewrites the SACRED_FLOOR comment to reference the post-fix `MA_TREND_WINDOW_DAYS + MA_WINDOW` sum". The current comment block becomes a misleading stale artifact.
- **B3 (AC-051-12):** add explicit AC clause "test description names containing Chinese (e.g. `ma99-chart.spec.ts:247` `'MainChart shows MA99 計算中 label...'`) are also updated to English". Otherwise Playwright HTML report shows mixed-language names — visible inconsistency.
- **B4 (AC-051-12):** add explicit AC clause "full-width CJK punctuation `（）：…，` adjacent to translated strings (e.g. `MainChart.tsx:270` `MA99 資料缺失：` and `（歷史前置資料不足 99 根）`) is replaced by ASCII `():,...`, not just the Chinese characters between them". Half-translated strings would still fail a `[一-龥]` post-grep.

**Non-blocking notes (Engineer free to take, Reviewer free to require):**
- N1: AC-051-11 could add `toContainText('✗')` to anchor the cross glyph alongside `getByTestId`.
- N2: AC-051-12 could move all translated strings to a centralized `frontend/src/i18n.ts` to enable future locale switching — pure refactor, out of scope here.
- N3: After Phase 4, regenerate the K-051 visual report only if `visual-delta` flips from `none` to something — currently `none` per ticket frontmatter, so visual-report.ts should be skipped (TD-K030-03 still pending).

**Codification reminder:** if PM accepts B1-B4, AC-051-10/-12 frontmatter must update the AC text inline (PM is the only role allowed to Edit ticket AC per `feedback_ticket_ac_pm_only.md`). Architect cleared to draft Phase 4 design doc immediately after PM ruling.

## 2026-04-26 — K-051 Phase 3 Regression Pass (RELEASE-OK verdict)

**Tier:** Real-QA spawn (post-implementation regression). Phase 3b/3c sign-off pass after Code Reviewer RELEASE-OK (0 Critical / 4 Warning / 5 Nit). Independently re-ran full backend pytest + frontend tsc + full Playwright + targeted K-051 spec; verified DB freshness anchor + Sacred substring drift-guard + fixture strict-gate via three adversarial probes.

**做得好：**
- Backend pytest 76/76 PASS; matches Engineer's reported baseline exactly. New tests `test_history_db_contiguity.py` (3) + `test_predict_real_csv_integration.py` (3) all green; freshness floor test passing on TODAY=2026-04-26 vs last_row.date=2026-04-25 (days_behind=1, well within 7-day SLA).
- Frontend Playwright 299/2/1 (pass/fail/skip) — exactly matches Engineer's baseline. Both failures (`ga-spa-pageview AC-020-BEACON-SPA`, `shared-components AC-034-P1 Footer snapshot on /`) are pre-existing flakes documented in CLAUDE.md; orthogonal to K-051 scope. No new failures introduced.
- Targeted spec `upload-real-1h-csv.spec.ts` 3/3 PASS in 2.6s. AC-051-09 toast bar negative assertion uses 3-class chain `.text-red-400.border-red-700.bg-red-950` with `toHaveCount(0)` (PM-accepted deviation per TD-K051-DATA-TESTID).
- Adversarial probe 3 (fixture strict-gate): `wc -l` = 24 lines, first 3 bytes `31 37 37` (ASCII "177...") — confirmed NO BOM (`EF BB BF`); first column starts with numeric Binance timestamp `1775520000000000` — `parseOfficialCsvFile` strict-gate (24-row + no-BOM + numeric-first-col) satisfied.
- Adversarial probe 2 (Sacred substring): `SACRED_VALUE_ERROR_SUBSTRING` is a literal Python string `"ma_history requires at least 129 daily bars ending at that date"` (line 47 of test file), used via `re.escape()` inside `pytest.raises(ValueError, match=...)`. If a future contributor refactors `predictor.py:335` from `"129"` to f-string `f"{MA_TREND_WINDOW_DAYS + MA_WINDOW}"`, the bytes still match → test still passes (good). If they change wording (e.g. `"requires"` → `"needs"`), test fails (good). Drift-guard `test_min_daily_bars_constant_is_imported_not_magic` independently asserts `MA_WINDOW == 99 && MA_TREND_WINDOW_DAYS == 30 && MIN_DAILY_BARS == 129`.
- Adversarial probe 1 (DB drift mock): test uses `date.today()` directly (not parameterized clock). Mocking to 2026-05-04 (8 days past last_row=2026-04-25) → `(today - last) = 9 days > FRESHNESS_FLOOR_DAYS = 7` → assertion fires with explicit message including `last_row.date` and `days_behind`. Test would catch SLA breach. Caveat: K-048 auto-scraper SLA delay >7 days = legitimate failure, not test bug — desired behavior.
- DB tail count `wc -l` = 3176 (Engineer's reported), max date = 2026-04-25 (after sort), strictly-monotonic + gap==1 contiguity holds end-to-end.

**沒做好：**
- `K-UNKNOWN-visual-report.html` was generated during full Playwright suite (visual-report.ts spec runs unconditionally without TICKET_ID env var); pollution required manual cleanup. K-051 ticket has `visual-delta: none` — visual-report should not have been written for this ticket. TD-K030-03 hardening (throw on missing TICKET_ID in `visual-report.ts`) still pending. Persona post-step verification (step 2a) was followed — pollution detected and cleaned before sign-off — so the gate worked, but the underlying root-cause fix is overdue.

**下次改善：**
- Continue post-step `ls K-UNKNOWN-*.html 2>/dev/null` verification per persona step 2a; do not skip because "ticket is visual-delta: none".
- For tickets with `visual-delta: none`, persona could grow an explicit pre-suite skip flag to prevent visual-report.ts from running at all. File as TD enhancement on top of TD-K030-03.

**Verdict:** RELEASE-OK. PM may proceed to ticket close + Phase A wrap-up. No Critical bugs identified; the 2 frontend failures are pre-existing pre-K-051 flakes, classified per CLAUDE.md §Worktree Hydration Drift Policy adjacent rules.


## 2026-04-26 — K-051 Phase 3 Early Consultation (AC-051-07/-08/-09 pre-Architect)

**Tier:** Real-QA spawn (not PM proxy). Phase 3b adds runtime backend pytest exercising `find_top_matches` with the real daily DB (cross-layer behavior: data + algorithm). Phase 3c adds new Playwright spec exercising `OHLCEditor` upload path (frontend runtime). Both clear the `feedback_qa_early_proxy_tier.md` runtime/schema bar — PM proxy disallowed.

**Sacred regression anchor:** `MA_TREND_WINDOW_DAYS (30) + MA_WINDOW (99) = 129` daily bars ending at input date (`backend/predictor.py:8,11,331-336`). The exact ValueError text K-051 surfaced: `"Unable to compute 30-day MA99 trend for {input_end_time}: ma_history requires at least 129 daily bars ending at that date."` Both the positive (≥129 → returns matches) and the negative (<129 → raises with exact substring) sides must be locked.

### (a) AC review findings — edge cases PM/Architect must tighten

**AC-051-07 (contiguity gap detector, ticket lines 103–109):**

1. **"Gap > 1 calendar day" semantics underspecified.** Daily DB date column format is ISO `YYYY-MM-DD` (verified: header at `Binance_ETHUSDT_d.csv:2`, last row `2026-04-08`). Ticket says "no gap > 1 calendar day" — must clarify: (i) parse strategy (`datetime.strptime(row[1], "%Y-%m-%d")` → `(d2 - d1).days == 1` for every consecutive pair); (ii) timezone irrelevant since Binance daily bars are UTC-anchored ISO dates with no time component — call this out so Engineer doesn't reach for `pytz`; (iii) DB ordering: rows are descending (newest at top, `2026-04-08` row 3 → `2017-08-17` row 3157) — pair-walk must sort ascending first or compare in reverse direction, otherwise `(d2 - d1).days == -1` always. Ticket does not say which.
2. **Duplicate / out-of-order coverage missing.** "No gap > 1" passes silently if two adjacent rows have IDENTICAL date (delta = 0 days, not > 1). A duplicate-row drift would slip through. Same for descending-then-ascending zigzag. Recommend AC adds: "no duplicate dates" + "rows sorted strictly monotonically (ascending or descending, not mixed)".
3. **First/last row edge.** No assertion on absolute first or last date. If the DB shrinks 100 rows from the head (loses 2017-08-17 → 2017-11-25), gap detector still passes but `find_top_matches` window space shrinks. Recommend: assert `last_row.date >= TODAY - N days` where N matches the K-048 auto-scraper SLA (or hard-code a freshness floor like 7 days). Without this, AC-051-07 is a contiguity guard but not a freshness guard — and freshness was the actual K-051 bug.

**AC-051-08 (real-CSV integration test, lines 111–117):**

1. **DB pinning vs drift detection — ticket is silent.** Reading live `history_database/Binance_ETHUSDT_d.csv` gives drift detection (a future shrink fails the test) but breaks reproducibility (test result depends on when the DB was last refreshed). PM must rule: option A — read live DB, accept that the test is a regression-on-live invariant, and pair with AC-051-07 to catch the shrink at contiguity layer; option B — copy a frozen 200-bar slice into `backend/tests/fixtures/Binance_ETHUSDT_d_pinned_2026-04-08.csv` for reproducibility, lose drift detection. Recommend A: K-051's bug class is silent DB drift, exactly the failure mode option B hides.
2. **K-015 sacred-regression invariant assertion missing the negative case.** AC says "returns ≥1 match without raising `ma_history requires`" (positive). Add a second test in same file that loads a DB truncated to 128 bars ending at 2026-04-07 and asserts `find_top_matches` raises `ValueError` whose message contains the exact substring `"ma_history requires at least 129 daily bars ending at that date"`. Without the negative path the K-015 invariant has no test enforcing that the error message text stays stable for telemetry / user-message stability — and the K-051 user retest SOP literally greps for that string.
3. **Real-CSV format pin.** Ticket says "real 24-bar 1H CSV at `backend/tests/fixtures/ETHUSDT-1h-2026-04-07-original.csv` (the exact CSV that triggered K-051)". The exact CSV is lost (user uploaded once, no commit). Recommend AC clarifies: fixture is a regenerated 24-bar UTC 2026-04-07 ETHUSDT slice from Binance public klines API matching the column shape `parseOfficialCsvFile` accepts (Unix-ms timestamp first column, OHLC numerics next), with a docstring naming the regeneration command + date so future drift is auditable. "The exact CSV" is unrecoverable — don't promise it; promise an equivalent.

**AC-051-09 (E2E real-CSV upload, lines 119–125):**

1. **`OHLCEditor` upload path NOT directly testable from page surface.** Reviewed `frontend/src/AppPage.tsx:362–374`: file `<input>` is `className="hidden"` inside a `<label>`. Playwright can drive it via `page.locator('input[type="file"]').setInputFiles(...)` (works on hidden inputs in Playwright since v1.x). Ticket should explicitly choose `setInputFiles` to avoid Engineer reaching for label-click + fileChooser pattern (slower, more flake-prone). K-046 spec already proves the locator pattern works (`K-046-example-upload.spec.ts:97-99`).
2. **`parseOfficialCsvFile` fragility surfaced by code reading.** `AppPage.tsx:48–82`:
   - **No BOM strip.** A UTF-8 BOM-prefixed CSV (Excel default save) makes `cols[0]` start with `﻿`, `Number()` returns NaN → throws `"Invalid timestamp: ﻿1775606400000"`. AC-051-09 fixture must be byte-clean (no BOM); state explicitly so future fixture regen doesn't quietly break.
   - **Strict 24-row gate (`OFFICIAL_ROW_COUNT = 24`).** Anything not exactly 24 rows throws. Fixture row count is a hard contract; AC must say "24 data lines, no header row" (the existing `ETHUSDT_1h_test.csv` is headerless per K-046 fixture refresh).
   - **CRLF tolerated** via `line.trim()`, decimal-separator must be `.` (Number()), scientific notation accepted (Number() handles `1e3`). These three are SAFE and don't need AC text.
   - **Header-row variation** is NOT tolerated: any non-numeric first column → throws. AC must assert fixture is headerless (matches the K-046 ETHUSDT_1h_test.csv shape).
3. **Negative assertion + AC-051-01 cross-link.** Ticket asks for "ma_history requires… NOT shown anywhere in the DOM" — good. Add: also assert no error toast bar (`.text-red-400` red error bar at `AppPage.tsx:349-353`) is visible. The K-051 user-visible failure was the red error bar, not just a text-substring; assert the visual chrome too.
4. **Mock realism per `feedback_playwright_mock_realism.md`.** AC says mock returns "200 with non-empty `matches[]`". Must extend: mock response MUST include `future_ohlc` array of ≥2 bars (else `computeDisplayStats` falls back silently — see `ClaudeCodeProject/CLAUDE.md` §Test Data Realism); MUST include all `PredictStats` fields (an absent field = `undefined` runtime crash). Recommend AC reuses the existing `frontend/e2e/_fixtures/mock-apis.ts` payload shape rather than hand-rolling — that fixture already meets the realism bar across 8 specs.

### (b) Blocking gaps — PM must address before Architect release

- **B1 (AC-051-07):** add monotonic-ordering + duplicate-date rejection + freshness-floor assertion to AC text (currently only says "no gap > 1 calendar day"). Without B1 the test passes on three failure modes K-051 itself surfaced.
- **B2 (AC-051-08):** PM rule on DB pinning (option A live-DB drift detection vs option B frozen fixture). Recommend A. AC text must state the ruling.
- **B3 (AC-051-08):** add second test case asserting the exact ValueError message substring on a 128-bar DB. K-015 sacred regression has no negative-case anchor today.
- **B4 (AC-051-09):** AC must specify `setInputFiles` driver pattern, BOM-clean + headerless fixture, and explicit toast-bar negative assertion. Without B4 the spec is structurally fragile.
- **B5 (AC-051-09):** mock-realism guard — AC must reference `_fixtures/mock-apis.ts` (or the equivalent realism contract) so Engineer doesn't paste a 1-bar future_ohlc mock that silently passes.

### (c) Non-blocking refinements (Engineer / Reviewer-time enhancements)

- **N1 (AC-051-07):** Engineer may parametrize `MAX_GAP_DAYS = 1` as a module constant to make the threshold tunable for non-trading-day-aware future markets. Not required by AC.
- **N2 (AC-051-08):** Engineer may add a parametrize-mark covering 2–3 different input dates (2026-04-07, 2024-01-01, 2020-03-12 — span market regimes) to widen coverage without expanding AC. Reviewer can flag if missing.
- **N3 (AC-051-09):** spec may add a snapshot of the rendered MatchList row count (e.g. `await expect(page.locator('[data-testid="match-row"]')).toHaveCount(10)`) for additional drift catch — not core to the bug class.

### (d) Test isolation strategy — avoiding hydration-drift false positives

Per K-Line `CLAUDE.md` §Worktree Hydration Drift Policy (Phase 3a, AC-051-06):

- **Backend pytest (Phase 3b):** Engineer + QA both run the new tests **inside canonical `ClaudeCodeProject/K-Line-Prediction/`**, not the worktree, when classifying any failure. Worktree is fine for editing the test code, but the `history_database/Binance_ETHUSDT_d.csv` is a tracked file (3157 lines verified) so canonical and worktree should match — if they don't, hydration drift, hydrate worktree first. The new fixture `backend/tests/fixtures/ETHUSDT-1h-2026-04-07-original.csv` MUST be committed (tracked) so worktree and canonical see the same bytes.
- **Frontend E2E (Phase 3c):** the new `frontend/e2e/upload-real-1h-csv.spec.ts` runs against Vite dev server. The `@rollup/rollup-<platform>` native binary drift surfaced in K-051 worktree QA can re-bite here. Rule: if Playwright webServer crashes citing rollup module not found, re-run in canonical first (per AC-051-06 protocol); only file as bug if canonical also fails. The new `frontend/e2e/fixtures/ETHUSDT-1h-2026-04-07.csv` must be committed under the e2e fixtures directory (NOT under `frontend/public/examples/` — that path is reserved for the K-046 example download, conflating the two would couple two ACs).
- **Pre-existing failure baseline:** prior K-051 retro recorded 295 passed / 3 failed / 1 skipped on canonical (3 pre-existing in K-031/K-022/K-020). Phase 3c adds 1 new spec with multiple cases. Goalpost: post-3c run on canonical must be `≥296 passed, exactly 3 failed (same K-031/K-022/K-020 specs), 1 skipped` — any new failure attributable to AC-051-09 = bug, file back to Engineer. State this baseline in the AC explicitly so QA sign-off has a clear comparator.
- **TICKET_ID hygiene:** when generating the visual report at QA sign-off time, `TICKET_ID=K-051 npx playwright test visual-report.ts` — recurrence of `K-UNKNOWN-visual-report.html` pollution would be the 4th strike on TD-K030-03. Persona Step 2a post-step `ls` verification still active; Phase 3 does NOT change visual-report.ts source. Mention in QA sign-off retro to keep TD-K030-03 priority visible.

**Verdict: BLOCK — PM must address [B1, B2, B3, B4, B5] before Architect release.**

Five blocking AC-text gaps span all three new ACs. None require code changes — all are AC-text tightenings PM can resolve in the ticket file in one Edit pass. Once B1–B5 land in the ticket, QA Early Consultation flips to RELEASE-OK and Architect is cleared to design Phase 3b + 3c.

Non-blocking items N1–N3 are Engineer/Reviewer-time, do not gate Architect release.

## 2026-04-25 — K-051 retroactive QA pass (daily DB backfill + Cloud Build rollup-musl fix)

**What went well:**
- Backend pytest (canonical repo) — 70/70 pass; K-051 daily DB invariants verified at the data layer: `Binance_ETHUSDT_d.csv` line count 3157 (3141 + 16 backfill), final row date column = `2026-04-08`, header schema unchanged (Unix,Date,Symbol,Open,High,Low,Close,Volume ETH,Volume USDT,tradecount). AC-051-02 evidentially supported.
- Playwright full suite (canonical repo) — 295 passed / 3 failed / 1 skipped. The 3 failures (`about-layout.spec.ts:281` T14 root-child sanity, `about-v2.spec.ts:176` redaction-bar, `ga-spa-pageview.spec.ts:164` AC-020-BEACON-SPA) are all pre-existing, in K-031/K-022/K-020 territory — none touched by K-051's scope (CSV append + Dockerfile 1-line). No K-051-attributable regression.
- AC-051-04 surgical-diff confirmed by reading PR #12 diff: exactly one logical line changed in Dockerfile, no other instructions altered.

**What went wrong:**
- **Summoned retroactively after both PRs already pushed.** AC-051-01 (deploy-side user retest) cannot be QA-gated pre-merge — it depends on Cloud Run redeploy. This violates the standard PM→Architect→Engineer→Reviewer→QA chain; retroactive ticket frontmatter acknowledges it but the process gap stands.
- **K-051 has zero permanent regression coverage.** No backend test asserts daily DB date-column contiguity (gap detector). No backend test pins the "≥129 daily bars ending at input date" invariant for the 1H upload path against the live `history_database/Binance_ETHUSDT_d.csv` — only synthetic-history unit tests in `test_predictor.py`. No E2E uploads a real 1H CSV (e.g. the `ETHUSDT-1h-2026-04-07.csv` that triggered the bug) to assert the live `/api/predict` returns matches. The exact bug class can recur and tests will stay green.
- **Worktree-only env drift surfaced two false positives** that wasted ~2 turns of triage: (a) Playwright webServer crashed in worktree because `node_modules/@rollup/` had only `rollup-linux-x64-gnu` (lockfile drift, missing darwin-arm64 + musl); (b) `frontend/public/examples/ETHUSDT_1h_test.csv` missing in worktree, failing `test_upload_example_csv_fixture_round_trip`. Canonical is clean for both. Worktree hydration ≠ canonical state — must run regressions in canonical when worktree shows env-class failures.
- Initial visual-report run forgot `TICKET_ID=K-051`, produced `K-UNKNOWN-visual-report.html` pollution. Caught by persona Step 2a post-step verification, deleted, re-ran with TICKET_ID — but the trigger (TD-K030-03 root-cause fix to throw on missing TICKET_ID) is still not landed; persona instruction alone failed to prevent at first attempt. Recurrence of TD-K030-03.

**Next time improvement:**
- Open TD entries (PM ruling required): **TD-K051-02** add `tests/test_history_db_contiguity.py` asserting daily DB date column has no gap > 1 day from first row to last — runs in canonical against the actual `history_database/Binance_ETHUSDT_d.csv`, not a fixture. **TD-K051-03** add backend integration test that loads the real `history_database/Binance_ETHUSDT_d.csv` + a real 24-bar 1H CSV (committed as `backend/tests/fixtures/ETHUSDT-1h-2026-04-07-original.csv`) and asserts `find_top_matches` returns ≥1 match without raising `ma_history requires`. **TD-K051-04** add E2E spec `frontend/e2e/upload-real-1h-csv.spec.ts` that uploads a committed-in-repo small-but-real 1H CSV against a mocked `/api/predict` returning 200 + matches[], anchoring the user-visible AC-051-01 path. **TD-K051-05** worktree hydration drift — document in K-Line CLAUDE.md that QA runs regressions in canonical when worktree shows rollup/native-binary or fixture-path failures (this class is hydration drift, not regression).
- Codify in qa.md persona: when ticket frontmatter has `retroactive: true`, QA Early Consultation degrades to "post-deploy retest plan + permanent-test gap audit" — both mandatory, both must produce TD entries to PM. Currently the persona has no retroactive-ticket protocol.
- Hard-gate the `TICKET_ID` requirement in `visual-report.ts` source code (TD-K030-03) — persona pre/post checks have now failed at first attempt on K-030, K-034 Phase 1, and K-051. Three strikes; recommend PM rule the source-level fix as not-deferrable.


## 2026-04-25 — K-050 Footer social links — full regression sign-off (post BFP-R2)

**What went well:**
- Round 2 full Playwright caught 6 K-050 regressions in `sitewide-footer.spec.ts` (5 tests) + `sitewide-fonts.spec.ts` (1 test) that Reviewer Step 2 missed. Failing assertion `page.getByText('yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn', { exact: true })` was a hardcoded text constant in helper functions outside the K-050 audit lens. QA's mandate to "run the FULL suite, not just the ticket's own E2E spec" surfaced the cross-spec text-constant dependency that pre-edit component-name grep cannot reach.
- AC-018-INSTALL gtag.js script-tag count failure (`Expected: 1, Received: 0`) was correctly diagnosed as environmental — manual dev server PID 89085/89112 was masking Playwright's own webServer config, which sets `VITE_GA_MEASUREMENT_ID='G-TESTID0000'`. Killing the manual server unblocked it without touching production code. Pre-existing TD AC-020-BEACON-SPA flake on first re-run also resolved on subsequent stable run — non-regression confirmed.
- Final state after BFP Round 2 fix: Playwright 299/299 pass, exit 0; tsc exit 0. No remaining failures attributable to K-050 scope.

**What went wrong:**
- Round 1 sign-off was issued after only the K-050-scoped E2E spec passed. Sibling specs (`sitewide-footer.spec.ts`, `sitewide-fonts.spec.ts`) were not run as part of the initial pre-BFP audit, so the text-constant orphan references slipped through to "QA pass" before Round 2 caught them. Should have been caught at Round 1 by full-suite policy, not deferred.

**Next time improvement:**
- Codified gates already added in BFP-R2 commit set: Engineer Step 0c-bis (removed-text widened grep before commit) + Reviewer Pencil parity gate sub-clause (removed-text widened grep at Step 2). For QA: when a ticket DELETES a literal string from a shared component, full-suite Playwright is mandatory at first sign-off — partial-spec subset is not acceptable even on a "small ticket" classification, since text-constant dependencies are invisible to AC scope.


## 2026-04-24 — K-049 QA regression-pass sign-off (post-Code-Review, pre-deploy)

**What went well:**
- Baseline byte-identity verification without `git stash`: AC-024-LEGACY-MERGE Vitest failure + AC-020-BEACON-SPA Playwright failure both proven pre-existing via `git show 1090e63:<file>` + cp-swap spec restore — K-049 commit range never touched diary.json / diary.legacy-merge.test.ts / analytics.ts / useGAPageview.ts / Footer.tsx / AppPage.tsx, so failure signatures guaranteed identical to base.
- Anchor-audit confirmed PM/Architect scope split holds: 2 in-tree ACs (AC-049-SUSPENSE-1 at `ga-spa-pageview.spec.ts:80,126` + AC-049-GA-LAZY-1 covered by same lazy-boundary probe) have regression spec coverage; 8 deploy-time ACs (PROBE-1 / PWA-1 / BODONI-1 / ROBOTS-1 / SITEMAP-1 / CSP-REPORT-1 / DEPLOY-ORDER-1 / DEPLOY-ENVGUARD-1 / CACHE-1) correctly have zero in-tree Playwright anchors — they belong to deploy-smoke cookbook, not E2E.
- Sacred regression byte-identity pass across all 4 items (K-037 favicon 6 link tags, K-034-P1 Footer.tsx, K-030 AppPage.tsx, K-024 diary.json) + spot-run 18/18 pass on shared-components + app-bg-isolation specs — K-049 refactor did not regress any locked-in invariant.

**What went wrong:**
- Initial `git stash` path for baseline verify was denied by global Destructive Op Safety rule (tree clean except `?? node_modules`; no prior explicit user approval for stashing). Had to pivot to `git show <base>:<file>` + `diff` + cp-swap spec — correct outcome but cost ~2 turns of planning.
- `src/components/Footer.tsx` first-guess path was wrong (actual: `src/components/shared/Footer.tsx`) — should have `find`/`grep` located path before issuing diff, not default to top-level `components/`.

**Next time improvement:**
- For any pre-existing-failure baseline-verify on a clean tree: default to `git show <base>:<path>` + `diff -q` against current path, cp-swap only when runtime-side proof is required (e.g. spec vs runtime code). Skip `git stash` entirely when tree is clean — no upside, only policy risk.
- Before issuing `git show <base>:<relpath>` or `diff` against repo paths, run a 1-line `find <root> -name "<basename>*"` locate pass to get exact path — avoids "No such file or directory" mid-verify.
- Deploy-smoke cookbook pattern (303-line `docs/reports/K-XXX-deploy-smoke.md` with curl/python/xmllint per deploy-time AC) should be auto-generated when ≥3 ACs are deploy-time-only — codify in QA persona as a trigger heuristic.


## 2026-04-24 — K-049 QA Early Consultation (public-surface plumbing, pre-Architect)

**What went well:** Pre-design adversarial pass surfaced 8 edge gaps across deploy-env-var loss path, CSP report-only silent-drop, Cloud Run rewrite + CORS ordering, Firebase rewrite first-match, React.lazy GA pageview race, Suspense fallback E2E flake risk, `/assets/**` immutable mis-scope, and manifest PWA drift — all pinned to observable `curl` / Playwright assertions so PM can paste AC verbatim.
**What went wrong:** Entry was initially written to main `docs/retrospectives/qa.md` instead of K-049 worktree — agent spawn did not verify cwd before file write. Migrated via hotfix commit (see §Retrospective below).
**Next time improvement:** For ops/config tickets (firebase.json / hosting / headers), add a mandatory "deployed-bundle probe AC" pattern — every claim about shipped bundle content (env-var baked, meta present, header present) must have a `curl -sI` or `curl -s ... | grep` AC citing the exact production URL, not just a local-build assertion.


## 2026-04-24 — K-046 Phase 2b QA full regression sign-off (post-Code-Review pass 2)

**What went well:**
- Full-suite Playwright 14 failures identified as pre-existing via base-main HEAD (`d923ed3`) replay — same 14 specs fail on base (9 `ga-spa-pageview.spec.ts` + 1 `ga-tracking.spec.ts AC-018-INSTALL` + 4 `pages.spec.ts AC-023-DIARY-BULLET/AC-028-MARKER-COORD-INTEGRITY`). K-046 scope diff against main covers only `AppPage.tsx` + `parseOfficialCsvFile.test.ts` + `K-046-example-upload.spec.ts` + `ETHUSDT_1h_test.csv` + backend `test_main.py` + docs — none of the 14 failing specs exercise files touched by K-046, so zero regression authority.
- Dev-server visual verification script (mock `/api/history-info` + 4 assertions) confirmed all 4 Phase 2 UI state markers green: Upload History CSV count=0, History Reference filename rendered (loading count=0 — Phase 1 B3 bug gone), Download link in `official-input-expected-format` scope=1, stray link in `history-reference-section`=0.

**What went wrong:**
- T4 (`AC-046-PHASE2-UI-LINK-MOVED case B` — link NOT inside `history-reference-section`) in isolation does NOT fail-on-revert because the base (pre-K-046) HEAD has zero `data-testid` markers, so the scoped locator returns count=0 on both current and reverted states. T4 is a complementary drift-prevention guard, not a revert-sensitive assertion. Revert-sensitivity for AC-046-PHASE2-UI-LINK-MOVED is adequately carried by T3 (positive scope assertion) + T8 (computed style of scoped link). No ticket-level gap — just a test taxonomy note.

**Next time improvement:**
- For multi-case AC coverage (T3 + T4 + T8 all target one AC), document in the spec header which case is the positive assertion (fail-on-revert) vs which is the drift guard (insensitive to revert, sensitive to future rename). Engineer / Reviewer currently self-classify during Step 2 depth review; making it explicit in the spec JSDoc removes the mental step at QA sign-off.



## 2026-04-24 — K-046 Phase 2 QA Early Consultation — QA proxy by PM

**Tier classification (per `feedback_qa_early_proxy_tier.md`):**

Phase 2 scope = CORS env var update (no image rebuild) + static CSV asset swap (verified-compatible source) + frontend DOM restructure on dev-tool `/app` route (no Pencil frame per K-021 §2) + one Vitest unit test for `parseOfficialCsvFile` + Playwright assertion rewrites. No new runtime schema, no cross-layer refactor, no migration, no behavior-preserving hook extraction, no layout-primitives change. `visual-delta: yes` on `/app` is strictly text-only layout move (no typography scale, no color token, no shared primitive). Tier = **PM proxy permitted** (not runtime refactor / not schema / not cross-layer / not layout-or-typography on user-voice route).

**Role-switch tag:** QA proxy by PM (not `QA reviewed`).

**Adversarial cases surfaced (PM-proxy, ≥3 required):**

1. **Playwright mock CORS mismatch with live CORS:** AC-046-PHASE2-HISTORY-INFO-RENDERS asserts the `historyInfo` block renders after a mocked 200 response. In real browser against real Cloud Run, even post-Action-1 env update, CORS preflight could still fail if `CORS_ORIGINS` env var carries trailing whitespace, wrong scheme (http vs https), or if the Cloud Run revision with new env var has NOT fully propagated to 100% traffic at the probe moment. Mock path gives zero coverage of real preflight. **Mitigation:** AC-046-PHASE2-CORS explicitly requires manual `curl -H "Origin:" -I` + browser DevTools smoke on deploy day; Phase 2 Deploy Record probe table includes the header-line check with expected exact-match string. Captured as GAP-4.

2. **`parseOfficialCsvFile` import path coupling:** AC-046-PHASE2-EXAMPLE-PARSE requires the Vitest spec to import `parseOfficialCsvFile` from `AppPage.tsx`. Currently the function is module-internal (not exported). If Engineer adds `export` to make the unit test work but Architect didn't flag this as a design change, the function becomes part of `AppPage.tsx` public API surface — a minor but trackable scope expansion. Alternative: Vitest uses `vite-node` / dynamic import to reach internal symbols, but that's non-idiomatic. **Mitigation:** Architect design doc §Test Plan MUST explicitly rule on export-or-extract decision and justify; Engineer follows ruling. If "extract to own module" is chosen, AC count doesn't change but file inventory grows by 1. PM pre-emptively flags this as an Architect ruling item, not a BQ-to-user.

3. **UI-LINK-MOVED assertion over-specifies on testids that don't yet exist:** AC-046-PHASE2-UI-LINK-MOVED uses `[data-testid="official-input-section"]` and `[data-testid="history-reference-section"]` in its Playwright assertions. `grep -rn 'data-testid="official-input-section"' frontend/src/` returns zero matches today — the testids do NOT yet exist. Writing an AC against non-existent selectors = vacuously passing AC per `feedback_pm_visual_verification.md` testid existence rule. **Mitigation:** AC-046-PHASE2-UI-LINK-MOVED explicitly names "Engineer adds testid if not present, OR Playwright uses text-anchored locator chain". Architect design doc must rule on which path (testid-first preferred for clarity); Engineer adds testids as part of Action 3 with the UI restructure. AC cannot sign off on Phase 2d until the testids exist AND the assertions resolve non-vacuously.

4. **`ETHUSDT-1h-2026-04-08.csv` source vs shipped asset drift:** Action 2 copies from `/Users/yclee/Desktop/…` (user's local machine), not from a repo-checked-in source. If Desktop file is modified/deleted between PM AC authoring and Engineer Phase 2b execution, the shipped asset differs from what PM verified. **Mitigation:** Action 2 is "cp then commit into worktree immediately"; post-commit the worktree's `frontend/public/examples/ETHUSDT_1h_test.csv` is the SSOT. AC-046-PHASE2-EXAMPLE-PARSE reads `frontend/public/examples/ETHUSDT_1h_test.csv` (the committed repo path), NOT `~/Desktop/…`. Engineer commits the CSV copy as an atomic step with the UI changes. PM does not treat Desktop file as long-lived source.

5. **B2 re-occurrence via a future Engineer swapping the fixture:** if post-K-046 someone swaps `frontend/public/examples/ETHUSDT_1h_test.csv` with a CSV that has different row count (e.g. 100 rows) or different column order, AC-046-PHASE2-EXAMPLE-PARSE as written fails (expects exactly 24). Is this the right guard? **Analysis:** yes — `parseOfficialCsvFile` itself enforces `OFFICIAL_ROW_COUNT` = 24, so a future fixture mismatch is exactly the failure mode this AC must catch. If Engineer later wants to change `OFFICIAL_ROW_COUNT` or support variable-length example fixtures, that is a separate PRD change. Current AC correctly couples to the parser contract.

**Fail-once escalation rule:** if any Phase 2c Reviewer / Phase 2d QA stage finds a boundary the PM proxy missed (e.g. a CORS header edge case, a Playwright mock leak, a handler-removal regression in K-048 reversibility), the next same-class ticket (docs-only / content-delta / non-runtime UI restructure) MUST force a real `qa` sub-agent spawn instead of PM proxy.

**Sacred cross-check (K-009 + K-013):** Phase 2 does NOT touch `backend/main.py` code, only Cloud Run env var. K-009 `ma_history=_history_1d` at `main.py:297` untouched. K-013 `stats_contract_cases.json` handler + test paths untouched. Frontend restructure confined to `/app`'s OHLC upload + History Reference sidebar panel; no impact on `/api/predict` response parsing or `query_ma99_*` fields. No conflict.

**Verdict:** READY for Architect release. PM proxy has surfaced 5 adversarial items, all with documented mitigations or ruled-to-Architect items. If any item recurs at Reviewer/QA stage, fail-once rule forces real-qa escalation on next same-class ticket.


## 2026-04-24 — K-046 QA regression sign-off (post-Code-Review)

**What went well:**
- Caught the `K-UNKNOWN-visual-report.html` persona Step 2a pollution on first Playwright pass (visual-report.ts was swept in as part of the full suite run without `TICKET_ID`), deleted the stale file and re-ran with `TICKET_ID=K-046`; post-step `ls` verification confirmed `K-046-visual-report.html` exists + `K-UNKNOWN-*` absent, closing TD-K030-03-class regression risk same session.
- Prod-endpoint smoke test with real uvicorn + real 3.5MB authoritative history file (`Binance_ETHUSDT_1h.csv`, 73990 bars) confirmed mtime_ns + size + md5 byte-identical across upload; gives confidence beyond tmp_path pytest fixtures that the comment-out also holds against the real on-disk DB.

**What went wrong:**
- None K-046-specific. Two pre-existing Playwright failures (`ga-spa-pageview.spec.ts::AC-020-BEACON-SPA` + `shared-components.spec.ts::Footer snapshot on /diary`) were inherited from pre-K-046 HEAD (K-045 Architect retro already logged `AC-020-BEACON-SPA` as pre-existing flaky; Footer /diary drift baseline-vs-actual is K-045 subpixel anti-alias recorded in architecture.md line 245). Neither spec file was touched by K-046.

**Next time improvement:**
- Persona Step 1 already mandates `TICKET_ID=K-XXX npx playwright test visual-report.ts`, but `npx playwright test` without args sweeps `visual-report.ts` into the full suite and produces `K-UNKNOWN-*.html` as a side effect. Add a persona-level reminder: **when running full-suite regression (not just screenshot step), pre-set `TICKET_ID` in env or explicitly `--grep-invert visual-report` to prevent pollution**. Root-cause fix (throw on missing TICKET_ID in `visual-report.ts`) is the TD-K030-03 engineering path; this is the QA workaround until that lands.


## 2026-04-24 — K-046 QA Early Consultation (surgical comment-out + example CSV download)

**What went well:**
- Confirmed byte-parity (`diff` clean, both 646 bytes) between `history_database/Binance_ETHUSDT_1h_test.csv` and `frontend/public/examples/ETHUSDT_1h_test.csv` before AC-046-EXAMPLE-2 lands — AC wording can assert byte-identical without risk.
- Caught that PM's AC-046-COMMENT-3 claim "`filename` is the authoritative target history filename … for frontend display continuity" is inaccurate — `AppPage.tsx:306` uses `file.name` (user's upload filename) not `uploadResult.filename`. Response field is unused by the one frontend consumer; AC wording should not overstate the semantic.
- Verified `grep -rn "/api/upload-history" frontend/e2e/` returns **zero hits** — no existing Playwright spec depends on upload response shape, so the `bar_count` + `latest` semantic flip (post-merge → existing-only) has no E2E regression surface. Removes a false worry.
- Verified filename 1D-detection truth table: `ETHUSDT_1h_test.csv` (Binance_ prefix dropped) still evaluates `is_1d == False` — AC-046-EXAMPLE-3 round-trip safe. `ETHUSDT_1d.csv` still `is_1d == True` — no regression.

**What went wrong:**
- Initial ticket draft had AC-046-COMMENT-3 spec the `filename` field's purpose ("for frontend display continuity") without grepping how `uploadResult.filename` is actually consumed by `AppPage.tsx`. The claim did not match code. QA caught it in Early Consultation, but PM should have grepped before writing the AC.
- Ticket Phase Plan §Phase 1 bullet 2 lists backend test invariants (mtime, module state identity) but does not mandate an assertion that `added_count == 0` **even when uploaded bars are genuinely new** (novel timestamps not in existing). Without this assertion, a future re-uncomment of the write block would not fail the test — the invariant is observationally weak for refactor-reversibility.
- Playwright coverage gap: no existing spec covers upload round-trip, and PRD §Test Coverage Plan defers E2E creation to "if QA requests". QA requests explicitly — round-trip spec needed so Phase 2 frontend link is tested end-to-end, not just href-attribute asserted.

**Next time improvement:**
- Before Write on ticket AC text that references a backend→frontend field flow, PM must `grep -rn <field_name>` in the frontend layer and confirm consumer behavior matches AC wording. Add this to `feedback_pm_ac_sacred_cross_check.md` companion check.
- For comment-out / refactor-reversibility tickets, QA must mandate **at least one test that would fail if the commented block were uncommented** (this is the dual of "fail-if-gate-removed" — here "fail-if-gate-restored"). Update QA persona `## Test Scope › Boundary Sweep` with a "reversibility assertion" row for future comment-out tickets.
- Upload round-trip E2E spec is now a hard request for K-046 Phase 2 — added to supplemental ACs (AC-046-QA-3).


## 2026-04-24 — K-047 Early Consultation (Favicon Twin Pulse v1 Redesign)

**Tier:** real qa (visual/layout per `feedback_qa_early_proxy_tier.md`)
**Verdict:** CHANGE-REQUESTED (5 blocker-class gaps, 7 edge cases raised, 6 new AC proposed, 2 REGRESSION additions)

**做得好：**
- 抓出 ticket Solution spec vs PM 對話 context 的色值矛盾（ticket: `#22C55E`/`#EF4444` 透明底無外框 vs 對話: `#EC4899`/`#10B981` 黑底圓角 20%）— 若未釐清 Designer Phase 1 會做錯方向，產出要重工；以 ticket 正文為 SSOT 並在 Findings 要求 PM 明確裁決。
- 發現 AC-047-16PX-LEGIBILITY 驗證條件「人眼目視兩根 bar 分離」無硬數字 — 主觀判斷無法進 sign-off gate；提議 gap≥1px + 對比度 ≥ 4.5:1 (WCAG AA) 量化。
- 抓出 `theme_color: "#F4EFE5"` 米黃底背景 context — Solution spec 要求透明底純色塊，在淺色分頁上紅(`#EF4444` vs `#F4EFE5`)/綠(`#22C55E` vs `#F4EFE5`) 邊緣對比可能不足；目前無 AC 覆蓋淺色分頁情境。
- 提醒 AC-047-WIRE-UNCHANGED 的 `wc -l == 6` 已驗過現況 index.html 正好 6 行（grep 結果：4 icon links + 1 apple-touch + 1 manifest），但沒有人在寫 AC 時驗證 baseline — 硬編 6 沒 raw-count sanity 呼應 K-025 feedback。

**沒做好：**
- （這是 Early Consultation，Final QA 尚未執行，故無 final-stage 事後 gap。）

**下次改善：**
- 針對「favicon/icon 類小尺寸 raster 資產」類 ticket，未來 Early Consultation 預設包含：(1) 硬數字 legibility 門檻（gap px、對比度 WCAG ratio）；(2) 全 browser matrix × 淺/深色主題；(3) Retina @2x 驗證；(4) 每個 raster 檔 sha256 對 HEAD diff 證明已 regen。把本次 checklist 轉為 `feedback_qa_favicon_raster_early_consultation_template.md`（K-048 後複用，省重推）。


## 2026-04-24 — K-045 Early Consultation (desktop layout consistency /about vs / vs /diary)

**做得好：**
- 針對 PM 初稿 §4 seed 邊界（640px、1248 hero、SectionLabelRow 位置、FileNoBar、grid flip）逐條展開成 10 個具體 Challenge；每個 Challenge 附建議 AC 草稿 + 驗證路徑 + Sacred cross-check 結果。
- 主動抓出兩個 scope gap：(a) C-2 section-to-section vertical gap 不在 §2 scope（SectionContainer `py-16` 會貢獻 inter-section rhythm，只改 width 不改 py 會視覺仍不一致），(b) C-6 K-031 adjacency Sacred（`about-architecture-sibling.spec.ts` 硬斷 `#architecture.nextElementSibling === <footer>`）會被 body-wrapper pattern 破壞。兩者若到 Engineer 階段才發現會退回 Architect。
- 發現 C-3 BQ-045-03：Pencil wwa0m 無 maxWidth constraint，K-022 legacy narrow=768 無 Sacred 鎖，建議依 Pencil SSOT 選 1248 — 把需要 PM ruling 的設計決策明確標出。

**沒做好：**
- Challenge 編號使用 C-N 而非 QA-045-CN，與 PM AC ID 前綴不一致（AC-045-XXX）；混用可能造成 Engineer 引用混淆。
- C-9/C-10 標 N/A 後仍留在列表，沒有直接刪除 — PM 讀時需多 parse 兩條才知道不需 ruling。

**下次改善：**
- Challenge ID 統一前綴 `QA-<ticket>-CN` 格式；N/A 條目合併成一行單獨段落列出（「Out-of-concern items: C-9, C-10」）避免 PM 誤判需 ruling。

- 與單票 `docs/tickets/K-XXX.md` 的 `## Retrospective` 段落 QA 反省並存，不互相取代
- 啟用日：2026-04-18（K-008 起）

---

<!-- 新條目從此處往上 append -->
## 2026-04-24 — K-045 Full Regression (QA sign-off)

**What went well:**
- Full suite 282 passed / 1 failed (AC-020-BEACON-SPA pre-existing K-020 baseline flake, verified same failure on ef3519d base per Engineer retro) / 1 skipped. All K-045 tests green: T1–T17 in `about-layout.spec.ts` (15/15) + T18 + T19×3 viewports in `shared-components.spec.ts` (4/4). TICKET_ID=K-045 prepended on full-suite command per K-041 retro learning — no K-UNKNOWN-visual-report.html pollution this run, post-step 2a filename verification passed.
- Cross-route parity adversarial check (Playwright node script, dev server, 3 routes × 1280×800): /about + / + /diary all have containerWidth=1248, maxWidth=1248px, padL=padR=96px, footerWidth=1280 (structural Δ=0 across all 3 routes). Mobile 375×812: padL=padR=24px all 3 routes. sm breakpoint boundary: 640→96px active, 639→24px active (exactly as AC-045-SM-BOUNDARY). K-031 live DOM: #architecture.nextElementSibling === footer AND root.lastElementChild === footer. All axes matched AC numerics with zero drift — the per-section root-child pattern produces structural invariance, not fixture coincidence (confirming Reviewer N-2).
- Note: /about container element is `<section id="header">`, /home is `<div>`, /diary is `<main>` — three different tag types but identical computed layout geometry. This validates the "per-section container classes" pattern achieves visual parity without forcing DOM-tag uniformity (which would break K-031 semantic structure).

**What went wrong:**
- No QA-observable defect. Process note: AC-020-BEACON-SPA flake is now on its 4th+ consecutive sign-off (K-039 / K-041 / K-042 / K-045), still unquarantined per K-039 retro's "known-red manifest" next-time-improvement that never got codified. Each sign-off re-derives its is-this-K-045 judgment from scratch.

**Next time improvement:**
- Implement the `docs/qa/known-reds.md` manifest proposed in K-039 retro 2026-04-24. Before declaring any full-suite run matches baseline: byte-compare failing test IDs against manifest; new red ID = hard BLOCK; missing baseline red = targeted rerun before claiming pass. File as TD-QA-KNOWN-REDS ticket at next PM session end — cross-session accumulation of "known red" in retro text without a manifest file means each QA re-checks from zero. Add to qa.md persona §Mandatory Task Completion Steps between steps 2a and 3: "2b — compare failing test IDs against `docs/qa/known-reds.md`; any new ID = BLOCK". Codifying without filing a TD = same meta-violation as K-045 itself (retrospective lesson not landed as enforcement).

## 2026-04-24 — K-045 — Early Consultation step applicability not codified — codified into `~/.claude/agents/qa.md` §Suspended Steps at Pre-Implementation Phase (outer PR #58 SHA `2a2f1ee`, 2026-04-28)

## 2026-04-24 — K-041 — TICKET_ID env var missing on full-suite run — codified into `~/.claude/agents/qa.md` §Mandatory Task Completion Steps step 1 (outer PR #58 SHA `2a2f1ee`, 2026-04-28)

## 2026-04-24 — K-041 QA Early Consultation (PM proxy tier — @qa-proxy)

**Role:** PM proxy (not spawned QA agent). Invoked under user-approved `b + 不 deploy + 開工` directive (2026-04-24). Tier rationale: narrow scope (4 source files + 1 spec flip), Sacred invariants pre-locked in ticket table, no new runtime/schema introduced — layout class present but restoration-only (Homepage behavior already in production). FAIL-ONCE rule: any adversarial question below surfacing uncodified behavior or missing assertion forces escalation to real QA spawn.

**Adversarial questions (5):**

**Q1 — Sacred regression: marker borderRadius**
After `DiaryMarker` accepts `borderRadius?: number` prop defaulting to `MARKER.cornerRadius = 6`, will Homepage still render `borderRadius: 0`?
**Answer:** Only if `DevDiarySection` explicitly passes `borderRadius={0}`. Guardrail = existing `pages.spec.ts` Homepage Sacred assertion `toHaveCSS('border-radius', '0px')` (K-023 AC-023-DIARY-BULLET / K-028 AC-028-MARKER-COORD-INTEGRITY). Regression is caught automatically by Phase 4 full regression. **PASS** (no escalation).

**Q2 — Sacred regression: marker topInset**
After `DiaryMarker` accepts `topInset?: number` prop defaulting to `MARKER.topInset = 10`, will Homepage still render `top: 8px`?
**Answer:** Only if `DevDiarySection` explicitly passes `topInset={HOMEPAGE_MARKER_TOP_INSET}` (currently `= 8`). Guardrail = existing Homepage coord assertion (K-028 AC-028-MARKER-COORD-INTEGRITY). **PASS**.

**Q3 — Rail conditional render boundary (1-entry case)**
Homepage renders rail only when `entries.length >= 2` (design §4.3.1). /diary renders unconditionally. Shared `<DiaryRail />` must not force rail at 1-entry on Homepage.
**Answer:** Consumer decides render — Homepage keeps `{entries.length >= 2 && <DiaryRail mobileVisible />}` guard. Sacred guardrail = `diary-homepage.spec.ts` T-H2 (0-entry hides rail) + T-H3 (1-entry hides rail). **PASS** — but Engineer MUST NOT lift conditional into DiaryRail; keep at consumer.

**Q4 — Mobile padding overflow at narrowest viewport**
`/diary` entry mobile `paddingLeft: 92px` on 390px viewport leaves 298px content width. Does text overflow horizontally?
**Answer:** Existing T-C5 asserts no-overflow at 390px with current desktop `pl-[92px]`. After K-041 mobile also = 92px → `no-overflow` must hold at 390px. Homepage already uses same 92px padding at all viewports with no overflow. **PASS** — Engineer runs T-C5 as part of Phase 2 gate; regression if `scrollWidth > innerWidth`.

**Q5 — Cross-spec hidden dependencies on OLD mobile-hidden behavior**
Besides T-C6 (`diary-page.spec.ts:572`), any other spec asserting `/diary` mobile rail/marker `display: none`?
**Answer:** Grep of `frontend/e2e/*.spec.ts` for rail/marker mobile assertions found: only T-C6 asserts `display: none` explicitly. T-H2/T-H3/T-H4 in `diary-homepage.spec.ts` are entry-count boundaries (0/1/2 entries), not viewport-dependent. T-T4 in `diary-page.spec.ts` is backgroundColor/dimensions, not display. **PASS** — only T-C6 needs flip.

**Verdict:** ALL-5-PASS → PM proxy tier approved. Engineer released for Phase 2. No real QA spawn required pre-implementation.

**Phase 4 mandatory full regression (unchanged):** post-implementation full Playwright suite + tsc must pass before PM close.

## 2026-04-24 — K-039 — known-red manifest enforcement gap — codified into `~/.claude/agents/qa.md` §Mandatory Task Completion Steps step 3a (outer PR #58 SHA `2a2f1ee`, 2026-04-28); manifest file created at `docs/qa/known-reds.md`

## 2026-04-23 — K-039 — QA Early Consultation (Split SSOT + README sync generator)

**Disclosure (capability pre-flight, pm.md §PM session capability pre-flight):** This session has no `Agent` tool available. PM acted as main-session QA proxy; consultation was conducted by Reading `~/.claude/agents/qa.md` persona + codebase + specs + plan doc. Risk: blind spots a full QA agent with interactive boundary sweep might catch could be missed. Mitigation: (a) explicit disclosure here; (b) PM will re-invoke full QA agent for sign-off in a later turn if Agent tool becomes available; (c) QA Challenges below derived directly from `qa.md` §Boundary Condition Mandatory Sweep table applied to K-039 Phase 1/2/3 ACs + K-Line E2E spec inventory.

**Pre-consultation evidence probe (2026-04-23):**
- Worktree HEAD: 2e4ac97 (clean, pre-K-022/K-034 Phase 2 shape). TSX `ROLES` has `redactArtefact` field + no `fileNo`; section subtitle is paraphrased (not Pencil-verbatim).
- Drift audit confirmed: README 6/6 responsibilities paraphrased + 3/6 artefact drift; `docs/ai-collab-protocols.md` 0/6 owns drift + 3/6 artefact drift; TSX ↔ Pencil `specs/about-v2.frame-8mqwX.json` byte-aligned on `owns`/`artefact` only (subtitle is the known HEAD divergence).
- Existing E2E coverage: `frontend/e2e/about.spec.ts` asserts /about role card text via `getByText` (6 `owns` + 6 `artefact` entries, case-sensitive exact). `shared-components.spec.ts` exists for cross-route shared chrome (NavBar, Footer) — no role-card cross-surface equivalence spec yet.
- No existing `scripts/` folder has a sync generator; only `scripts/audit-ticket.sh` lives there. Pre-commit hook ecosystem: repo has no `.husky/` or `lefthook.yml`; `.git/hooks/pre-commit` is absent. Engineer must pick pattern in Phase 2 (see Challenge #5).

---

### QA Challenge #1 — AC-039-P1-README-SYNCED — column-header rename is unstated

**Issue:** AC says README markers-delimited table must have columns `Role / Owns / Artefact` (no Responsibilities/Verifiable Output rename). But README HEAD currently uses columns `Role / Responsibilities / Verifiable Output`. The AC mandates a column-header **rename** — this is a narrative change to the README that goes beyond "drift repair", and it's not called out as a Goal in §2. A reader passing by the AC might think the AC asks only for table data to be updated and leave the old column headers in place, producing a synced-but-wrongly-labeled table.

**Risk:** Phase 1 ships README with columns `Role / Responsibilities / Verifiable Output` but data in the Owns/Artefact sense — semantic mismatch in a public-facing portfolio doc. Generator (Phase 2) would then have two options: (a) also rename the column headers on every run (silent cosmetic churn), or (b) preserve existing column-header text and only rewrite data rows — harder regex + risk of inconsistent output across the two files.

**Option A (fix):** Add explicit AC clause: "AC-039-P1-README-SYNCED `And` — README column headers after Phase 1 must read exactly `| Role | Owns | Artefact |` (not `Responsibilities` / `Verifiable Output`); this is a narrative change to README beyond drift repair."

**Option B (Known Gap):** Keep README columns `Responsibilities / Verifiable Output`; generator maps TSX `owns` → Responsibilities and `artefact` → Verifiable Output. Accepted risk: two names for the same concept across files, generator carries a rename map, cognitive overhead for future readers.

**Recommendation:** **Option A.** Plan §"README sync" explicitly says "Rewrites the 6-row table" — the simplest mental model is TSX-shape mirror. Rename map is accidental complexity.

**If not ruled:** AC-039-P1-README-SYNCED will be ambiguous at sign-off; Engineer may ship either variant and QA cannot declare PASS/FAIL deterministically.

---

### QA Challenge #2 — AC-039-P1-PLAYWRIGHT-REGRESSION — TSX import path from Playwright spec is non-trivial

**Issue:** AC says `roles-doc-sync.spec.ts` must "deep-equal `ROLES` imported from `frontend/src/components/about/RoleCardsSection.tsx`". Playwright E2E specs run under Playwright's own tsconfig (`frontend/playwright.config.ts` + `frontend/e2e/tsconfig.json` if exists). Importing from `frontend/src/` into `frontend/e2e/` works in this repo (verified — `about.spec.ts` uses relative paths into `src/` for some specs), but (a) `ROLES` is currently declared inside the component file without `export`, (b) importing a React component module into Node Playwright causes the React import chain to resolve and can trip on CSS/Tailwind/image loaders.

**Risk:** Engineer writes spec assuming clean import of `ROLES`, then hits a Vite/Playwright module-resolution failure, then adds a dual-source-of-truth shim (copies `ROLES` into a `.json` or `.ts` constant in spec folder) — **recreating the drift K-039 was meant to prevent**.

**Option A (fix):** Refactor TSX to extract `ROLES` into a pure-data module: `frontend/src/components/about/roles.ts` (no React imports; exports `ROLES`). `RoleCardsSection.tsx` imports from there. Playwright spec imports directly from `roles.ts` (clean no-React module). This is a 5-line code change in Phase 1 — low cost, eliminates Challenge class.

**Option B (Known Gap):** Playwright spec parses the marker-delimited tables in README + protocols.md and compares the two tables to each other (not to TSX). Covers "doc-vs-doc drift" but not "TSX-vs-doc drift" — if Engineer edits TSX and forgets to run generator, doc tables might still match each other from a previous sync.

**Option C:** Playwright spec shells out to `node scripts/sync-role-docs.mjs --dry-run --json` which outputs the parsed ROLES as JSON, spec asserts parsed README table matches that JSON. Script is the SSOT adapter between TSX parse and Playwright assertion.

**Recommendation:** **Option A.** Cleanest architecture; `roles.ts` data module is a natural split (data vs rendering) and makes generator regex trivially robust. Option C is clever but adds a runtime dependency from Playwright → script — fragile.

**If not ruled:** AC-039-P1-PLAYWRIGHT-REGRESSION untestable without a chosen import path; Engineer may pick Option B silently and ship weaker coverage.

---

### QA Challenge #3 — Boundary: TSX `ROLES` array with < 6 or > 6 entries

**Issue:** AC-039-P1-TSX-CANON mandates 6 roles (PM/Architect/Engineer/Reviewer/QA/Designer). If someone adds a 7th role (e.g. "Documentarian") to TSX, what does the generator do? What does the Playwright spec assert? No AC covers "role count changes". Empty `ROLES = []` is a degenerate case — generator should not crash, but neither spec nor AC specifies behavior.

**Risk:** 7-role addition ships: generator silently writes a 7-row table; README visual section breaks (Mermaid diagram still shows 6 flowchart nodes); Playwright spec FAILs with unclear error; Engineer can't tell whether the change is rejected or the test is stale.

**Option A (fix):** Add `AC-039-P1-ROLES-COUNT-INVARIANT` — generator + spec both assert `ROLES.length === 6`; changes to count require a separate ticket that also updates Mermaid diagram + Pencil 8mqwX frame + AC table. Count invariant is codified.

**Option B (Known Gap):** Accept "adding a role is out of scope for K-039; any attempt will fail Playwright which is acceptable signal". TD registered for future role-count-change ticket.

**Recommendation:** **Option A.** Role count is visually + architecturally significant (Pencil has 6 sub-frames, Mermaid has 6 flowchart nodes, section label "Nº 02 — THE ROLES" implies fixed count). Making it an invariant at Phase 1 gives the generator a clean precondition.

**If not ruled:** boundary sweep row "Empty list / single / large (0 / 1 / 1000 items)" is unfilled — QA boundary table incomplete, sign-off blocked per `qa.md` §Boundary Condition Mandatory Sweep.

---

### QA Challenge #4 — Boundary: role-specific characters (CJK, pipe, asterisk) break Markdown table rendering

**Issue:** Current TSX `ROLES[3].artefact = "Review report + Reviewer 反省"` contains CJK characters. Markdown handles CJK fine, but if a future `owns` or `artefact` contains `|` (table-column delimiter), `*` (emphasis), backticks (inline code), or a newline, the generator must escape or reject. Plan §Format constraints says `owns ≤6 words, comma-separated` — but doesn't forbid special chars.

**Risk:** PM approves a phrase like `"code review | breadth + depth"` (pipe-separated); generator naïvely emits `| Reviewer | code review | breadth + depth | ... |` — 6-column row, breaks table rendering. README portfolio surface gets visual regression.

**Option A (fix):** AC-039-P1-TSX-CANON gains an `And` clause: TSX string values must not contain `|`, unescaped newlines, or unbalanced backticks. Generator rejects (non-zero exit) if detected, prints offending field. Playwright spec adds `expect(roles.every(r => !/\||
/.test(r.owns + r.artefact))).toBe(true)`.

**Option B (Known Gap):** Accept — "PM will review phrases, won't approve special chars". No enforcement.

**Recommendation:** **Option A.** Format enforcement at parse time is cheap (1-line regex) and prevents the class of bug. Per `feedback_sanitize_by_sink_not_source.md` — source is TSX string, sink is Markdown table cell; sanitize at sink boundary.

**If not ruled:** boundary sweep row "Special chars / overlong input" unfilled; QA sign-off blocked.

---

### QA Challenge #5 — AC-039-P2-PRE-COMMIT — hook ecosystem not declared

**Issue:** AC-039-P2-PRE-COMMIT says "new file under `.husky/`, `.git/hooks/`, or lefthook config — Engineer picks the project's existing pattern". But repo has NONE of these at HEAD (verified `ls -la .husky/ .git/hooks/pre-commit lefthook.yml` all absent/example-only). Leaving the choice to Engineer at implementation time means PM's Phase Gate can't verify the pattern a priori, and Engineer may choose the least robust option (e.g. raw `.git/hooks/pre-commit` — not version-controlled, doesn't install on fresh clone).

**Risk:** Engineer picks `.git/hooks/pre-commit` (single-file). Ships. New contributor clones repo, edits TSX, commits — no hook runs, doc drift re-emerges. K-039's core deliverable (close the drift gap forever) silently fails.

**Option A (fix):** PM rules at Phase 2 release: Engineer must use `husky` (de facto standard, version-controlled via `package.json` + `.husky/`). If Engineer rejects husky for size reasons, Engineer files a BQ with alternative (`simple-git-hooks`, `lefthook`) — PM approves before implementation.

**Option B (Known Gap):** Hook is `.git/hooks/pre-commit` only; doc drift re-emerges on fresh clone is accepted as TD; README adds "run `npm run setup-hooks` after clone" step. Enforced by Engineer-authored setup script.

**Recommendation:** **Option A.** `husky` is ~50 KB, standard in React ecosystem, version-controlled. Option B forces every contributor to remember a manual setup step — failure mode is silent.

**If not ruled:** hook mechanism choice deferred to Engineer = Engineer could ship a non-portable hook = fresh-clone drift re-emerges.

---

### QA Challenge #6 — AC-039-P2-PRE-COMMIT — performance / interactive behavior unspecified

**Issue:** Pre-commit hook runs generator + `git status` comparison on every commit that stages `RoleCardsSection.tsx`. But the hook mechanism of Option A (husky) typically runs in sub-shell and can auto-stage regenerated files OR fail with "re-run git add && git commit". AC doesn't say which. User experience of "commit, hook rewrites files, re-stage, re-commit" vs "commit auto-succeeds with regenerated staged files" is materially different.

**Risk:** Engineer picks auto-stage behavior; hook silently modifies user's WIP commit (surprising side-effect on "commit pre-flight (mandatory)" rule in `~/.claude/CLAUDE.md`). Or Engineer picks fail+message behavior; first-time user hits confusing "generator modified files, run again" loop.

**Option A (fix):** AC-039-P2-PRE-COMMIT `And` clause: hook must FAIL (non-zero exit + clear message "Run `npm run sync-role-docs` and stage the docs") rather than auto-stage. Rationale: `~/.claude/CLAUDE.md §Commit Hygiene` mandates explicit staged file list pre-flight; auto-staging violates that rule by modifying the staged set after `git diff --cached`.

**Option B (Known Gap):** Auto-stage accepted; commit pre-flight rule is silently relaxed for this one hook.

**Recommendation:** **Option A.** Keeps `git diff --cached` as the canonical pre-commit staged state.

**If not ruled:** Engineer picks either, user surprise on first hit, retrospective entry.

---

### QA Challenge #7 — AC-039-P3-SACRED-SPLIT — retirement scope granularity

**Issue:** AC says "retire `content` portion of K-034 AC-034-P2-DRIFT-D5/D6/D7/D8/D26". But reading D-5 / D-6 / D-7 / D-8 / D-26 verbatim: D-5 mandates Reviewer `redactArtefact: false` AND "ARTEFACT text `"Review report + Reviewer 反省"` renders as plain" (content portion) AND "no RedactionBar, no sr-only" (visual portion). D-6 mandates role name font-size = 36/32 based on `role.length <= 2` (computed from content — blend of content + visual). D-26 mandates section subtitle verbatim from Pencil `s3Intro` (pure content).

Scope of "content portion" is not 100% clean across these 5 ACs. Blanket retirement risks retiring a D-6 clause that actually depends on content-length even when content itself is TSX-SSOT.

**Risk:** K-034 reviewer reading retirement annotation interprets "content portion retired" as "entire D-6 retired" → drops role-length-based font-size logic → PM/QA gate re-triggers at next Sacred cross-check.

**Option A (fix):** AC-039-P3-SACRED-SPLIT specifies per-D-ID exactly what's retired:
- D-5: "Reviewer ARTEFACT content string" retired (TSX owns); redaction absence (`redactArtefact: false`) and typography tokens remain Pencil-SSOT.
- D-6: NOT retired — role-length-based font-size is a visual rule computed from content length, not from content value; stays Pencil-SSOT.
- D-7: NOT retired — `FILE Nº 0N · PERSONNEL` label is Pencil-SSOT (content-of-label is static, not runtime); `N` comes from `ROLES` order which is fine.
- D-8: "owns text content + artefact text content" retired (TSX); typography tokens remain.
- D-26: "section subtitle content string" retired (TSX); italic + font-family + size tokens remain.

**Option B (Known Gap):** Accept blanket "content portion" framing; annotate K-034 once, trust future readers to re-interpret case-by-case. TD registered for per-AC clarification.

**Recommendation:** **Option A.** Sacred retirement is a rare event; per-AC explicit scope prevents future confusion and matches `feedback_pm_ac_sacred_cross_check.md` rigor.

**If not ruled:** AC-039-P3-SACRED-SPLIT annotation in K-034 will be ambiguous; future ticket reading D-6 + retirement note may misinterpret.

---

### QA Challenge #8 — Protocols.md table may contain links or nested markdown not in TSX

**Issue:** `docs/ai-collab-protocols.md` is a reference-type wiki article (`type: reference`). The table at L20-27 today is plain text, but the surrounding article uses inline markdown links (`[artefact-audit]`, cross-file links). A future editor might add a link to an artefact path in a table cell (e.g. `[PRD.md](../PRD.md)`). If generator overwrites with plain TSX strings, links are lost.

**Risk:** Protocols doc regresses from link-enhanced to plain-text on first generator run. User notices, files a Bug Found Protocol. Gap: AC-039-P1-PROTOCOLS-SYNCED says "table matches TSX verbatim" — intentionally destructive to any in-cell markdown enrichment.

**Option A (fix):** Accept destructive behavior as design intent; add `And` clause "any pre-existing in-cell markdown (links, bold, inline code) is stripped on generator run; enrich at TSX level if needed (via dedicated `artefactLink` field in `ROLES`, out of scope K-039, register TD K-040 candidate)".

**Option B:** Generator preserves in-cell markdown by diffing only text nodes — more complex regex, harder to prove idempotent.

**Recommendation:** **Option A.** K-039 establishes the pattern; enrichment is YAGNI per plan's own scope exclusion.

**If not ruled:** generator behavior on enriched cells undefined, first invocation could silently remove links.

---

### QA Challenge #9 — `npm run sync-role-docs` package.json location

**Issue:** AC-039-P2-NPM-ENTRY says "Engineer decides at implementation, document choice" between repo-root and `frontend/package.json`. But project has both: repo root has no `package.json` (confirmed — repo root contains `Dockerfile`, `firebase.json`, no top-level `package.json`); `frontend/package.json` is the only existing one. Generator script lives in repo-root `scripts/` but npm entry would need to live in `frontend/package.json` — creating a cross-directory invocation: user must `cd frontend && npm run sync-role-docs`.

**Risk:** Pre-commit hook running from repo root (`.git/hooks/pre-commit` or `.husky/pre-commit`) can't simply `npm run sync-role-docs` — must either `cd frontend &&` or use node directly. Cross-directory commands are fragile (path resolution, CWD assumptions in script).

**Option A (fix):** Generator script uses absolute paths via `path.resolve(__dirname, '..')` to locate repo root files (README.md, docs/*, frontend/src/*). `frontend/package.json` script entry is `"sync-role-docs": "node ../scripts/sync-role-docs.mjs"`. Hook invokes `node scripts/sync-role-docs.mjs` from repo root directly (bypassing npm). Dual invocation paths both work.

**Option B:** Create repo-root `package.json` just for this one script. Adds another package boundary to project, pollutes root with npm ecosystem.

**Option C:** Move script invocation to a shell wrapper `scripts/sync-role-docs.sh` that does `node scripts/sync-role-docs.mjs`. Hook calls shell wrapper.

**Recommendation:** **Option A.** `frontend/package.json` for npm-run convenience; absolute paths in the script make it CWD-independent; hook bypasses npm for speed.

**If not ruled:** Engineer picks; implementation details could break pre-commit hook on cross-platform (macOS vs Linux CI) CWD differences.

---

### QA Challenge #10 — Dogfood test (AC-039-P2-DOGFOOD-FLIP) doesn't cover deploy

**Issue:** AC says "no Designer session / `batch_design` / `.pen` edit is required" for a text tweak. Good. But doesn't mention **deploy verification**: does a deployed /about page reflect the TSX text change? If generator runs in pre-commit but Playwright visual baseline is stale, sign-off could pass while production bundle still serves old text.

**Risk:** Dogfood "runs" but the K-034 Phase 2 `AC-034-P2-DRIFT-LIST` Pencil-verbatim assertions on role card text are still active (Phase 2 WIP on main will assert TSX `owns` equals Pencil `r*Owns.content`). K-039's split retires that for TSX side; K-034 Phase 2 E2E test post-merge may assert against stale PNG/JSON; dogfood doesn't catch it.

**Option A (fix):** AC-039-P2-DOGFOOD-FLIP `And` clause: after flip + commit + Playwright pass, `npm run build && grep "<new-phrase>" frontend/dist/**/*.js` returns ≥1 match; or — if dogfood is reverted — build from clean state. Dogfood must touch the deploy path, not just the source.

**Option B (Known Gap):** Deploy-level verification deferred to K-034 Phase 2 visual audit (which will cover /about build output). Dogfood is a source-only proof.

**Recommendation:** **Option A.** Build-time assertion is trivial (one grep) and proves end-to-end.

**If not ruled:** dogfood proves nothing about what ships to browser.

---

## Summary

| # | Challenge | Recommended | Sign-off blocker? |
|---|-----------|-------------|-------------------|
| 1 | README column header rename unstated | Option A (explicit rename) | Yes |
| 2 | Playwright-TSX import path | Option A (extract `roles.ts`) | Yes |
| 3 | Role count boundary | Option A (count=6 invariant) | Yes |
| 4 | Special chars in TSX strings | Option A (reject at parse) | Yes |
| 5 | Pre-commit hook ecosystem | Option A (husky) | Yes |
| 6 | Hook fail-vs-auto-stage | Option A (fail + message) | No (UX) |
| 7 | Sacred retirement granularity | Option A (per-D-ID explicit) | Yes |
| 8 | Markdown enrichment in cells | Option A (destructive, enrich at TSX) | No |
| 9 | package.json location | Option A (frontend/ + absolute paths) | No |
| 10 | Dogfood deploy coverage | Option A (+ build grep) | No |

**Sign-off blockers (PM must rule before Engineer release):** 1, 2, 3, 4, 5, 7.

**PM ruling status: PENDING — see K-039 ticket §5 Phase Plan for rulings, and §7 QA Early Consultation for pointer back here.**

## 2026-04-23 — K-040 BFP Fix Regression Sweep (commit a092598)

**What went well:** Targeted regression sweep (5 specs = 44 tests) all green on HEAD a092598 — sitewide-footer 5/5, navbar 22/22, sitewide-fonts 8/8, shared-components 8/8 (AC-034-P1 Footer byte-identity holds 4 routes), about+about-v2 71 passed 1 skipped. Dev server 200 on `/`, `/about`, `/diary`, `/business-logic`. K-040 commit scope (11 files under `frontend/src/components/about/` + 2 retro docs) is zero runtime behavior — aligned with Reviewer's 0 Critical / 0 Warning.

**What went wrong:** Engineer's handoff claim "1 pre-existing flake AC-020-BEACON-SPA" under-reported severity. Standalone `npx playwright test e2e/ga-spa-pageview.spec.ts` reproduces **9 failures** on both a092598 AND baseline 66d9573 — full `describe()` block collapses (SPA-NAV ×2, BEACON ×4, NEG ×3). Verified pre-existing via `git checkout 66d9573` baseline run = identical 9 failures, identical timeout pattern → NOT K-040 regression, but Engineer's single-flake framing masked the scale. Likely root cause: spec file expects isolated webServer (Playwright config) vs shared `npm run dev` port 5173 — beacon collector race with hot state. Belongs in separate tech-debt ticket, not K-040 close.

**Next time improvement:** QA regression sweep must re-run any spec Engineer flags as "flaky" standalone against both fix HEAD and `git show <base>:HEAD` baseline before accepting "pre-existing" designation. Single-test flake claims demand spec-file-level verification — a 1-test report for a 9-test collapse is a trust-erosion signal even when not a regression. Also: file `ga-spa-pageview.spec.ts` isolation-requirement drift as standalone TD for PM (spec unrunnable outside Playwright config webServer = operational bug distinct from K-040).

---

## 2026-04-23 — K-040 QA Early Consultation (sitewide typography)

**What went well:** Designer's 36-row per-site calibration table + AC-040-SITEWIDE-FONT-MONO 4× raw-count gates (font-display pre=13, Bodoni-inline pre=4, `'Bodoni Moda'` string pre=1, tailwind keys pre=2) already anticipated most sitewide-font-swap risks; QA additions were edge-case tightening (stale Bodoni/Newsreader spec assertions, no cross-viewport matrix, no unit test on `timelinePrimitives.ENTRY_TYPE`), not foundational gaps.

**What went wrong:** Ticket ACs targeted only *source-side* grep + 4 representative-page Playwright assertions; **`timelinePrimitives.ts:30` is NOT Konva** (as stated in both ticket §1 and AC `And` clause) — it's a shared token-literal consumed DOM-side by `DiaryEntryV2` (via `diary-page.spec.ts` T-E6, which asserts `font-family` against `titleFont.family = "Bodoni Moda"` loaded from `visual-spec.json`). That means changing the literal without also updating `docs/designs/K-024-visual-spec.json` will break `diary-page.spec.ts:419` with a Playwright FAIL — the AC grep gate alone doesn't catch this. `about-v2.spec.ts:66-83,124-130` still assert `Bodoni Moda` + `Newsreader italic` on /about h1 + subtitle — these will all FAIL post-implementation and must be rewritten by Engineer as part of AC-040-SITEWIDE-FONT-MONO, not treated as regression. `sitewide-fonts.spec.ts` AC-021-FONTS must be rewritten in full (current spec's whole premise inverts under K-040). None of these stale-assertion sites are enumerated in the ticket's raw-count gates.

**Next time improvement:** for any sitewide typography/palette change that retires a design token, QA Early Consultation must enumerate ALL existing E2E assertions that reference the retiring token (grep `Bodoni\|Newsreader\|italic\|font-display` across `frontend/e2e/*.spec.ts`) before release, and flag each as (a) must-rewrite, (b) must-delete, or (c) unaffected — raw-count grep on `frontend/src/` misses regression tests asserting the retired value. Also: shared token-literal files (`*Primitives.ts`, `*tokens.ts`) feeding both DOM and potential Canvas consumers must be audited for both surfaces; AC text calling such a file "Konva literal" when it's actually a DOM token creates false confidence in pixel-diff / source-grep gates.

---

## 2026-04-23 — K-040 Early Consultation (sitewide UI polish batch)

**Verdict:** PM-RULE-REQUIRED (6 Challenges + 2 Interceptions raised — PM must respond before Phase 1 Designer release)

**Session capability disclosure:** QA was not dispatched as Agent sub-process — main-session Agent tool unavailable this turn. PM simulated QA adversarial review inline using `~/.claude/agents/qa.md` §Early Consultation protocol + codebase context. Mitigation: all challenges filed with explicit AC citation + file:line evidence; re-dispatch to real QA agent will run at Phase 5 regression sign-off (capability-restored session). Per PM persona §PM session capability pre-flight.

### QA Challenge #1 — AC-040-HERO-FONT-MONO (Item 1)

**Issue:** "font voice matches BuiltByAIBanner" is visual-intent (good per `feedback_pm_ac_visual_intent.md`) but provides NO way for Playwright to assert. Need a testable downstream clause.
**Needs supplementation:** Add an And clause: "Playwright asserts `computed font-family` of `HeroSection h1` starts with `Geist Mono` (or equivalent monospace family name substring); raw-count sanity `font-display` in `HeroSection.tsx` pre=2, post=0 is present but is refactor-grep only, does not prove render-time font applied."
**If not supplemented:** AC will PASS on `font-display` grep === 0 but FAIL a designer who meant something specific; regression test can't differentiate "mono font applied" from "no font class at all".

### QA Challenge #2 — AC-040-DIARY-FOOTER-BOTTOM-GAP (Item 2)

**Issue:** AC reads "whitespace below GA disclosure line is visually tight (no large empty band)" — no numeric threshold, no way to prove regression at sign-off. Playwright cannot assert "tight".
**Needs supplementation:** Designer provides numeric target (e.g., `main pb-12` = 48px) calibrated in .pen + recorded in `homepage-v2.frame-*.json` spec; AC adds: "measured bottom gap (CTA bottom edge → Footer top edge, or Footer bottom edge → viewport bottom on short pages) matches Designer JSON spec value ±2px."
**If not supplemented:** silent drift at sign-off; "looks tight to me" is not a test oracle.

### QA Challenge #3 — AC-040-HOME-DESKTOP-PADDING (Item 3)

**Issue:** "Rhythm matches `/diary` and `/about`" is not quantified. Currently `/diary` is `sm:px-24` (96px) within `max-w-[1248px]`. `/about` uses SectionContainer (varying per width prop). `/` is `sm:pr-[96px] sm:pl-[96px]` currently. Target is unclear — IS it already 96px like diary, and user wants it REDUCED to something else, or was user observing an illusion because HomePage has no max-width cap?
**Needs supplementation:** Designer explicit numeric target in .pen (e.g., "desktop 72px left+right, max-width 1248px") + PM documents which reference page is the true anchor. Possibility: user's complaint is actually about missing `max-w-[1248px]` cap causing wide-monitor overflow, not padding per se.
**If not supplemented:** Engineer may reduce padding to 72px but user still sees same issue because real cause was max-width absence.

### QA Challenge #4 — AC-040-DIARY-CTA-FOOTER-GAP (Item 4)

**Issue:** same class as #2 — "vertical gap visually open" not quantified.
**Needs supplementation:** Designer numeric value in .pen; AC asserts measured distance matches spec ±2px.
**If not supplemented:** ditto #2.

### QA Challenge #5 — AC-040-DIARY-MOBILE-RAIL (Item 6)

**Issue:** Two divergent outcomes — (a) rail restored or (b) rail removed-by-design — have opposite test assertions. Currently AC is conditional on Designer's finding, which means the Playwright spec cannot be written until Phase 1 completes. That's fine for sequencing but **QA needs the Designer decision path recorded in .pen/JSON before Phase 3 Engineer release** so QA can author the mobile rail spec deterministically.
**Needs supplementation:** Designer delivers `homepage-v2.frame-*.json` Diary mobile frame with explicit annotation `mobileRail: "restored" | "design-removed"` (or equivalent machine-readable key); AC references that annotation as the source of truth.
**If not supplemented:** QA will mark AC FAIL on sign-off regardless of Engineer's choice because there's no tiebreaker.

### QA Challenge #6 — AC-040-ABOUT-PROTOCOL-LINK-NEW-TAB (Item 11)

**Issue:** the AC is clean (Given/When/Then/And all testable). But **user-reported regression risk**: clicking a link that opens a `target="_blank"` to a site-relative path (`/docs/ai-collab-protocols.md#role-flow`) produces a new-tab navigation to a **raw markdown file**, not a rendered page. On the live SPA, `/docs/...` paths are NOT handled by the React router (confirmed by `grep docs/ai-collab-protocols.md frontend/src/App.tsx` — zero routes). User will open new tab → see `index.html` 404 fallback or raw markdown download.
**Needs supplementation:** PM must rule one of:
  - (A) `docsHref` values in `ReliabilityPillarsSection.tsx` need to be changed to an actual rendered destination (external GitHub blob URL, or an in-repo rendered route that exists);
  - (B) Accept Known Gap: "new tab opens 404 until docs route is added — scope for follow-up ticket";
  - (C) Scope expansion: this ticket also adds a `/docs/*` MD renderer route.
**If not supplemented:** Item 11 "works" per AC (new tab opens) but delivers broken UX.

### QA Interception #1 — K-034 Phase 1 Sacred cross-check (proactive)

**Boundary scenario:** Item 2 / Item 4 both adjust Diary footer vicinity. AC §3 Constraints correctly cites `AC-034-P1-ROUTE-DOM-PARITY` but **PM's BQ-040-02 ruling (Option A, Diary-only `main` pb reduction) is the Sacred-safe path** — this ruling must be carried into the Designer instruction and echoed in AC-040-DIARY-FOOTER-BOTTOM-GAP And clause as "adjustment location = `<main>` container, Footer internals untouched". Current AC And says "implementation location documented in Designer .pen annotation" — Designer's decision would reopen BQ-040-02. Pin the ruling now.

**Covered by existing AC:** partial — ruling text is in BQ-040-02 but not in the AC itself.
**PM action:** promote BQ-040-02 Option A into AC-040-DIARY-FOOTER-BOTTOM-GAP as a hard And clause ("adjustment must be in `<main>` container `pb-*`, not in `<Footer>` component") before releasing Designer.

### QA Interception #2 — Item 1 Hero font cascade risk

**Boundary scenario:** `font-display` is declared as `"Bodoni Moda", serif` in `tailwind.config.js`. Removing `font-display` from HeroSection is scoped, but **grep confirms** (PM should verify): other components may also use `font-display` for unrelated reasons (About headings? Diary Hero?). If the Bodoni Moda font file loads solely because HeroSection used `font-display`, removing that last reference doesn't break anything (Tailwind JIT strips unused). But if `font-display` is still used elsewhere, the class survives. AC-040-HERO-FONT-MONO grep `font-display` in `HeroSection.tsx` = 0 is correct (scoped to one file) — just need to confirm the grep stays file-scoped, not repo-wide.

**Covered by existing AC:** yes — AC already says grep restricted to `frontend/src/components/home/HeroSection.tsx`.
**PM action:** no change needed; noted as sanity-check for Engineer at impl time.

**What went well:**
- PM raised all 8 items with file:line evidence before drafting AC (per `feedback_verify_before_status_update.md`).
- AC visual-intent wording used consistently (Items 1/2/3/4/14) per `feedback_pm_ac_visual_intent.md`.
- Sacred cross-check done at AC authoring time (Items 2/4 → K-034 P1 ROUTE-DOM-PARITY) per `feedback_pm_ac_sacred_cross_check.md`.
- Raw-count sanity recorded for Items 1 and 11 per `feedback_refactor_ac_grep_raw_count_sanity.md`.

**What went wrong:**
- 4 of 8 ACs (Items 2/3/4/6) currently lack numeric Designer-spec tie-back — Challenges #2/#3/#4/#5 raised. Acceptable for PM Gate because ACs explicitly defer numbers to Designer .pen JSON; but JSON must exist and be frozen before Phase 3 Engineer release, not just "Designer will pick a value".
- Item 11 has a broken-UX risk (Challenge #6) that the AC mechanically passes — classic QA catch: happy-path green, user-facing broken.
- QA was simulated in PM persona because main-session Agent tool unavailable. Documented; mitigated by re-dispatch to real QA agent at Phase 5 regression.

**Next time improvement:**
- When ticket AC defers numeric targets to Designer, add a gate clause: "Phase 3 Engineer release requires Designer JSON spec frozen with numeric values for [list of AC IDs]."
- For any AC referencing a link/href, grep the live route table to confirm destination exists before accepting AC. (Item 11 would have been caught earlier.)

---

## 2026-04-23 — K-034 Phase 3 regression (/diary adopts shared Footer, absorbs ex-K-038)

**Verdict:** RELEASE-PM

**What went well:**
- Full Playwright suite 253 passed / 1 pre-existing K-032 fail (AC-020-BEACON-SPA unchanged) / 1 skipped — no new failures, no regression in previously-green tests.
- 4-route Footer snapshot baselines (`footer-{home,about,business-logic,diary}-chromium-darwin.png`) all PASS; new `/diary` baseline committed as untracked file ready for next commit.
- Sacred K-030 AC-030-NO-FOOTER (`app-bg-isolation.spec.ts:70`) untouched, PASS — `/app` isolation unchanged.
- Retirement annotations verified in both source tickets: K-017 line 294 + K-024 line 412 carry `> Retired 2026-04-23 by K-034 Phase 3` blockquote with AC text preserved as historical record.
- Engineer FAIL-IF-GATE-REMOVED dry-run (Challenge #8 compliance) recorded in `docs/retrospectives/engineer.md` lines 23–27: 3 expected FAILs enumerated (T1 /diary, LOADING-VISIBLE, snapshot /diary) with exact timeout symptom strings; `app-bg-isolation.spec.ts + pages.spec.ts` 39/39 green proves cross-contamination sweep.
- TD-K034-P3-02 viewport seam gap logged in `docs/tech-debt.md:56` with explicit trigger condition (user-reported 640–768px regression).

**What went wrong:**
- Nothing regressed this round. One minor observation: `visual-report` test harness still prints `WARNING: TICKET_ID not set` (K-UNKNOWN-visual-report.html) when PASS suite invoked without env var — out of scope for Phase 3 but worth a future harness cleanup.

**Next time improvement:**
- When QA regression is invoked without an explicit TICKET_ID env var (because Reviewer ran full suite as part of depth pass), set `TICKET_ID=K-XXX` before re-running `visual-report.ts` so the generated HTML file is named correctly — applies to all future regression rounds.


## 2026-04-23 — K-034 Phase 2 sign-off regression (Engineer fix-forward complete)

**做得好：**
- Full Playwright regression 251 passed / 1 failed / 1 skipped — single failure is the pre-existing K-032 GA gap `ga-spa-pageview.spec.ts:142` (AC-020-BEACON-SPA), matching Engineer's fix-forward expectation exactly; zero new regressions introduced by Phase 2 (19 AC).
- tsc `--noEmit` exit 0; visual report regenerated with `TICKET_ID=K-034` to `docs/reports/K-034-visual-report.html` (all 4 marketing routes captured green); Sacred cross-check clean — `grep -rE "DossierHeader|dossier-header|data-annotation|ROLE_ANNOTATIONS"` against `frontend/src/` + `frontend/e2e/` returns zero live dependencies on the 4 retired K-022 Sacred clauses (only historical retirement comments remain).
- Cross-route shared-component parity gate (`shared-components.spec.ts`) T1 byte-identity + T2 Pencil-canonical content + T3 no /about CTA + T4 /diary footer absence all pass — Phase 2 did not disturb Phase 1 Footer invariants.
- Pencil parity spot-check on FileNoBar vs `BF4Xe m*Top/m*Lbl` + `8mqwX r*Top` + `UXy2o p*Top` + `EBC1e t*Top` + `JFizO arch*Top`: `padding [6,10] → px-[10px] py-[6px]`, `fill #2A2520 → bg-charcoal`, `Geist Mono 10 paper letterSpacing 2 → font-mono text-[10px] text-paper tracking-[2px]`, `label?` optional matching MetricCard bare `FILE Nº 0N` — all match, zero drift in 5 FileNoBar consumers.

**沒做好：**
- **New QA Flag (Minor, not a blocker)** — `MetricCard` m1Note + m4Note typography drift vs Pencil `BF4Xe.m1Note`/`m4Note`: Pencil specifies `fontSize: 13, fill: #1A1814 (ink)` (distinct from m2Note/m3Note which ARE `11px muted`), but code `MetricCard.tsx:56` renders ALL notes uniformly as `text-[11px] text-muted`. Reviewer §4.8 gate missed this because §5 drift row D-2 lumped all notes as "Newsreader 11 italic note" (design-doc level drift vs Pencil JSON) and no E2E `getComputedStyle` assertion exists on `17 tickets, K-001 → K-017` or `Bug Found Protocol, per-role retro logs, audit script` fontSize/color (only `toBeVisible` text-content gates). Recommend Engineer open TD-K034-P2-18 "MetricCard m1/m4 note: restore Pencil `fontSize: 13` + `fill: ink` (distinguish high-signal notes from low-signal muted classification lines)"; NOT a Phase 2 close blocker — pre-existing design-doc-vs-Pencil drift class, content verbatim, visually minor, caught at QA parity spot-check (which is what the gate is for).
- AC-coverage audit: 16 / 19 Phase 2 new AC have direct E2E assertion coverage; 3 AC (AC-034-P2-AUDIT-DUMP revised, AC-034-P2-DRIFT-LIST revised, AC-034-P2-DESIGNER-ATOMICITY, AC-034-P2-SNAPSHOT-POLICY, AC-034-P2-SACRED-RETIRE, AC-034-P2-DEPLOY) are documentation/infra/deploy gates — not E2E-assertable by design; verified via filesystem + ticket content. AC-034-P2-DRIFT-D19-D21-HERO-REWRITE has `Bodoni Moda` + `text-brick` assertions in `about-v2.spec.ts:66-91` but no explicit `64px`/`left-align`/`fill_container divider` computed-style assertion — covered indirectly via `AC-022-HERO-TWO-LINE` snapshot baseline + font family check; tight enough for sign-off but TD-eligible for future hardening.

**下次改善：**
- Add a Pencil-font-size parity sweep to QA sign-off checklist: for each `FileNoBar` / `MetricCard` / `RoleCard` / `PillarCard` / `TicketAnatomyCard` / `ArchPillarBlock` body text node, grep Pencil JSON `fontSize` + `fill` values, enumerate per-card (not per-card-type), and compare against code `text-[Npx]` / `text-ink|muted|brick|charcoal` — catches m1Note-class drifts that Reviewer's §5-table-scoped gate misses. Codify as new `qa.md` §Mandatory Task Completion step 0d "Pencil text-node typography sweep" so future `.pen`-backed UI tickets enumerate per-node typography, not per-component-class.

## 2026-04-23 — K-034 Phase 2 Early Consultation (/about visual audit)

**Consultation trigger:** PM opening Phase 2 with 2 placeholder ACs (AC-034-P2-AUDIT-DUMP, AC-034-P2-DRIFT-LIST). Both are untestable as written. QA filing 9 Challenges before PM releases Designer/Architect/Engineer.

**Pre-consultation evidence probe (2026-04-23):**
- `frontend/design/` contains: `favicon.pen`, `homepage-v1.pen`, `homepage-v2.pen` — **no `about-v2.pen` file exists**.
- `frontend/design/specs/` contains 2 JSONs: `homepage-v2.frame-86psQ.json` + `homepage-v2.frame-1BGtd.json` — both are Footer frames, **zero /about body frames exported**.
- `frontend/design/screenshots/` contains 3 PNGs, all Footer-related.
- `docs/designs/K-022-about-structure.md` line 7: `pencil-frame: 35VCj (About /about K-017 v2)` — /about Pencil SSOT is frame `35VCj` **inside `homepage-v2.pen`**, not a separate file. This frame has never been JSON/PNG exported.
- `AboutPage.tsx` renders 8 distinct sections: DossierHeader (A-2) + 6 `SectionContainer` sections (S1 header through S6 architecture) + `<Footer />`. All body sections beyond Footer have zero Pencil JSON/PNG provenance on HEAD.

---

### QA Challenge #1 — AC-034-P2-AUDIT-DUMP — "every /about Pencil frame" is undefined
**Issue:** AC line 301 says "every /about Pencil frame has a corresponding `frontend/design/specs/about-v2.frame-<id>.json`". But (a) there is no `about-v2.pen` file; the /about SSOT is frame `35VCj` living inside `homepage-v2.pen`; (b) frame `35VCj` is a single monolithic frame per K-022 design doc — there is no authoritative inventory of sub-frames per /about section. The AC filename pattern `about-v2.frame-<id>.json` presupposes a file that does not exist.
**Risk:** Designer dumps `35VCj` as one 1000-node JSON → AC passes trivially but audit has no section granularity. Or Designer fabricates a section split and names them arbitrarily → drift diff format inconsistent across sections. Either way, Phase 2 audit output is unusable by Engineer.
**Option A (fix):** PM rules on authoritative frame inventory BEFORE Designer dumps. Two sub-options:
  - A1: Designer first splits `35VCj` into 7 sub-frames (one per /about section: DossierHeader, Header, Metrics, Roles, Reliability, TicketAnatomy, Architecture) inside `homepage-v2.pen`, then dumps each. AC filename pattern becomes `homepage-v2.frame-<id>.json` matching existing `86psQ`/`1BGtd` convention.
  - A2: Dump monolithic `35VCj` + Designer produces one `docs/designs/K-034-P2-about-section-inventory.md` mapping each code section (AboutPage.tsx line N–M) to a node-ID subtree within `35VCj`. Drift list references node IDs, not frame IDs.
**Option B (Known Gap):** "Audit only Footer frames `86psQ`+`1BGtd` (already exported); /about body sections out of scope Phase 2" → TD-K034-P2-01, explicit scope shrink. Ticket's stated deliverable "per-section Pencil JSON dump" gets retitled as "Footer-only re-parity dump".
**Recommendation:** **Option A1** — matches established `homepage-v2.*` filename convention, gives Engineer deterministic per-section diff target, and splitting `35VCj` creates reusable Pencil SSOT for future /about tickets. A2 risks node-ID drift every time Designer edits Pencil (see Challenge #9).
**If not ruled:** AC-034-P2-AUDIT-DUMP will FAIL at sign-off (cannot prove "every frame" without an inventory).

---

### QA Challenge #2 — AC-034-P2-DRIFT-LIST has no schema for diff entries
**Issue:** AC-034-P2-DRIFT-LIST (line 304) is a stub "To be expanded at Phase 1 close". Ticket deliverable 2 says "property, expected, observed" but gives no canonical form. Without a schema, Engineer and PM cannot deterministically compare: is `fill: "#6B5F4E"` drift from CSS `rgb(107 95 78)` a drift or a representation? Is Tailwind `text-[13px]` equivalent to JSON `fontSize: 13`? Is `tracking-[2px]` equivalent to `letterSpacing: 1` (existing Footer JSON uses `letterSpacing: 1` — unit unknown, px or em?).
**Risk:** K-024 C-1 pattern repeats — "·" vs "—" style literal-drift slipped past green tests because assertion and implementation both used wrong literal. Here, if drift diff uses eyeball color comparison, oklch-vs-hex conversion rounding (e.g. `#6B5F4E` ≈ `oklch(0.49 0.02 65)` but not byte-identical) triggers false drift flags, or false absence when Tailwind compiles to `rgb()` with 3-digit truncation.
**Option A (fix):** PM rules on drift-diff schema before Phase 2 starts. Minimum columns: `section | property | pencil-json-path | json-raw-value | code-path (file:line) | code-raw-value | normalized-json | normalized-code | drift: yes/no | proposed-resolution`. Normalizer rules: color → `#RRGGBB` lowercase 6-digit (no alpha unless present); sizes → integer px (`fontSize: 13` matches Tailwind `text-[13px]`); letterSpacing → px (`letterSpacing: 1` = `1px`, Tailwind `tracking-[1px]`); fontWeight → numeric (`"normal"` = 400, `"bold"` = 700). Tailwind arbitrary values (`text-[13px]`, `tracking-[2px]`) preferred over named utilities to make unit explicit.
**Option B (Known Gap):** Accept eyeball diff, log TD-K034-P2-02 "formalize drift schema in future ticket" → Phase 2 drift list remains advisory, cannot block Engineer updates.
**Recommendation:** **Option A** — K-024/K-025 W-1 feedback loop (`feedback_refactor_ac_grep_raw_count_sanity.md`) proved that un-normalized comparison produces silent false negatives. Without a normalizer, drift list is as credible as my grandmother's cross-stitch pattern.
**If not ruled:** AC-034-P2-DRIFT-LIST will FAIL at sign-off (untestable — no deterministic predicate).

---

### QA Challenge #3 — Shared component drift: NavBar + SectionContainer NOT in Phase 2 scope
**Issue:** Phase 2 Deliverables list scopes to "per-section Pencil JSON dump" of /about frames. But AboutPage.tsx line 1 imports `UnifiedNavBar` (shared across /, /about, /business-logic) and line 2 `SectionContainer` (primitive wrapping every section). K-035 Footer drift (2026-04-22) root cause was per-route-local assertion letting cross-route DOM divergence survive; same class of bug applies to NavBar. If Phase 2 audits only /about-specific components (DossierHeader, MetricCard, RoleCard, etc.) and skips UnifiedNavBar + SectionContainer primitive styling, Pencil-vs-code drift on those shared components goes undetected on /about AND leaks to sibling routes.
**Risk:** Phase 2 closes green, /about ships Pencil-parity perfect for body sections, but NavBar still has a 1px padding drift that Pencil already encodes correctly. Next sprint someone "fixes" NavBar and breaks /. This is exactly K-035 Footer drift repackaged.
**Option A (fix):** Phase 2 scope explicitly INCLUDES `UnifiedNavBar` + `SectionContainer` Pencil parity on /about. Those are 2 more sub-frames in the A1 split (or 2 additional node-ID subtrees in A2). Cross-route regression spec `shared-components.spec.ts` extends to assert any NavBar drift would break all 3 NavBar-consuming routes (Option A1 in K-034 Phase 3 AC precedent — byte-identity pattern).
**Option B (Known Gap):** "Phase 2 audits only /about-specific body components; shared chrome (NavBar, SectionContainer) audit deferred" → TD-K034-P2-03, explicit tracker. Risk acknowledged: any shared-chrome drift on /about will not be flagged.
**Recommendation:** **Option A** — shared-component inventory check is codified behavior rule (`feedback_shared_component_inventory_check.md`, 2026-04-22), excluding NavBar from a "/about full visual audit" violates the rule. Footer is already Phase 1 so that box is ticked, but NavBar and SectionContainer remain.
**If not ruled:** QA sign-off withheld with citation "Phase 2 shared-component inventory gate not met".

---

### QA Challenge #4 — Regression protection for non-/about Footer consumers absent
**Issue:** Phase 1 unified Footer across /, /about, /business-logic. Phase 2 will likely trigger Engineer edits to Footer IF Phase 2 drift finds divergence between Footer code and Pencil `86psQ`/`1BGtd` JSON. But Phase 2 ticket deliverable 4 says only "tsc + Playwright" — which currently runs a single-viewport suite and a single `shared-components.spec.ts` snapshot set. No explicit mandate to re-run `visual-report.ts` on / and /business-logic (Phase 3 will add /diary as 4th consumer, so by end of this week, 4 routes share Footer).
**Risk:** Phase 2 fixes a Footer drift to match Pencil (say letterSpacing 1 → 2); /about passes; / and /business-logic visual regression slip through because Playwright snapshot was regenerated not compared. K-035 2026-04-22 feedback memo explicitly mandates cross-route equivalence assertion on shared chrome.
**Option A (fix):** Phase 2 AC adds a mandatory step: "for every Engineer code edit touching `components/shared/**`, run `shared-components.spec.ts` ALL routes + snapshot diff against baseline + visual-report on all Footer-consuming routes (`/`, `/about`, `/business-logic`). Any snapshot diff without corresponding Pencil JSON re-export is a FAIL." Extend to /diary the moment Phase 3 lands.
**Option B (Known Gap):** Phase 2 assumes Footer is frozen per Phase 1 → Engineer MUST NOT touch `Footer.tsx` or `shared/**` during Phase 2. Any Footer drift found in Phase 2 audit is punted to Phase 4 (new ticket). Enforced by Reviewer Git Status Commit-Block Gate (K-037 F-N2 precedent).
**Recommendation:** **Option B** — cleaner scope boundary. Phase 1 already proved Footer parity; if Phase 2 audit finds Footer drift, that's a Phase 1 regression and deserves its own ticket + BFP Round 2, not a silent fix. Also avoids the "Engineer edits shared Footer during /about audit" combinatorial explosion.
**If not ruled:** QA will flag any Phase 2 commit touching `frontend/src/components/shared/**` as CODE-PASS / COMMIT-BLOCKED until PM rules scope expansion.

---

### QA Challenge #5 — `.pen` update path round-trip atomicity unspecified
**Issue:** Phase 2 deliverable 3 says "PM ruling per drift: `.pen` update (send to Designer) vs code update (send to Engineer)". For the `.pen`-update branch: Designer edits `homepage-v2.pen` via Pencil MCP, but then needs to atomically re-export the affected frame's JSON + PNG. `feedback_designer_json_sync_hard_gate.md` (2026-04-23) mandates "same session batch_design → export JSON + PNG". But Phase 2 has N drifts potentially affecting M Pencil frames; partial re-sync (e.g. `.pen` updated + JSON updated + PNG NOT updated) is a K-035 α-premise regression waiting to happen — the spec JSON and screenshot would drift within the Designer session.
**Risk:** Designer fixes 3 drifts in Pencil, exports JSON for 2, forgets PNG for 1 (or vice versa). Reviewer's Pencil-parity gate (Step 2 per `feedback_reviewer_pencil_parity_gate.md`) compares JSX to JSON — passes. QA's 0c frame spec + screenshot parity compares Playwright screenshot to PNG — might pass if PNG is stale matching old Pencil state. Same drift re-introduced in 4 weeks via stale PNG.
**Option A (fix):** Phase 2 adds a hard gate: "for every `.pen`-side ruling, Designer session output must include in one batch: (a) updated `.pen` commit, (b) re-exported `specs/<frame>.json`, (c) re-captured `screenshots/<frame>.png`, (d) side-by-side PNG if the frame participates in multi-frame cross-consistency (Footer does, per K-034 Phase 1 `86psQ-vs-1BGtd-side-by-side.png`). All four in same Git commit; QA 0c rejects any commit with < 4 of 4 updated."
**Option B (Known Gap):** Accept best-effort Designer sync; QA 0c verifies JSON+PNG but does NOT re-diff `.pen`→JSON; TD-K034-P2-04 opened for future tooling to auto-verify export freshness (e.g. `.pen` mtime vs JSON `pen-mtime-at-export` header).
**Recommendation:** **Option A** — the JSON header already contains `pen-mtime-at-export` (verified in `86psQ.json` line 3: `"pen-mtime-at-export": "2026-04-21T19:52:16+0800"`). QA 0c can programmatically verify `pen-mtime` of file on disk ≥ JSON `pen-mtime-at-export` ≥ PNG stat.mtime (monotonic chain). Zero ambiguity, zero extra tooling, K-035 α-premise eliminated.
**If not ruled:** QA 0c will FAIL any Phase 2 commit where Designer-side pencil-mtime chain is non-monotonic.

---

### QA Challenge #6 — Viewport seam: Phase 2 desktop-only = mobile drift undetected
**Issue:** `frontend/e2e/about-v2.spec.ts` tests /about at desktop + 375px mobile viewport (grep confirms lines 44, 112, 295, 318). Pencil frame `35VCj` is a single viewport design (likely ~1440px wide). Phase 2 drift list will necessarily be desktop-only unless explicitly scoped. But /about ships to users in both viewports; silent mobile drift (Tailwind responsive utilities `md:`, `lg:` branches) is code-side-only and has no Pencil SSOT to audit against.
**Risk:** Phase 2 closes green at desktop parity; mobile /about has a broken grid that was never part of the Pencil design. User reports "looks wrong on phone" next week; QA re-audits and finds no Pencil source of truth to compare to. Known K-027 class of bug (mobile /diary overlap).
**Option A (fix):** Phase 2 scope explicitly DESKTOP-ONLY (single breakpoint matching Pencil `35VCj` width); mobile parity is Known Gap TD-K034-P2-05, explicit scope note in AC-034-P2-AUDIT-DUMP. Ticket receives mobile-design-exemption row in `design-exemptions.md` §2 RESPONSIVE (precedent: K-034 Phase 3 Challenge #2 → same exemption).
**Option B (fix with expanded scope):** Designer produces a second Pencil frame `35VCj-mobile` at 375px width; Phase 2 audits both breakpoints; drift diff schema adds a `viewport` column. Doubles Phase 2 effort.
**Recommendation:** **Option A** — matches Phase 3 Challenge #2 precedent exactly; mobile /about has no current user complaint; expanding Pencil to 2 breakpoints is Designer work outside this ticket's stated scope. Explicitly log TD-K034-P2-05 so intent is preserved.
**If not ruled:** AC-034-P2-AUDIT-DUMP cannot pass — dumping only desktop frames while silent on mobile is a Sweep Table ❌ under QA persona.

---

### QA Challenge #7 — Dark mode intent silent: K-029 paper palette vs Pencil unknown
**Issue:** K-029 (2026-04-22) moved /about card body text to paper palette (`text-ink`, `text-muted`). Pencil frame `35VCj` was authored pre-K-029 and may still encode the old dark palette, OR the K-029 fix may have been a code-only patch that never reached Pencil. Without Phase 2 explicitly ruling, drift list could either flag every card as "code drift from Pencil" (false positive, Pencil is the stale one) or silently accept current code as canonical (baking in K-029 drift permanently).
**Risk:** Drift list has N entries saying "card body color: Pencil `#E5E5E5` vs code `#1a1814`". PM can't rule without knowing K-029 intent was retrofit-Pencil-or-not. Eight-week-old memory gap.
**Option A (fix):** PM reads K-029 design doc + commit history, rules BEFORE drift list is authored: "K-029 palette is canonical; Pencil frame `35VCj` must be updated to match K-029 code (Designer task in Phase 2 `.pen`-side bucket)". Drift list then treats K-029-touched properties as "Pencil-side fix required, code unchanged".
**Option B (fix, reverse):** PM rules K-029 was a temporary patch; Pencil `35VCj` is canonical; Phase 2 reverts K-029 on code side. Requires user sign-off (reverting a landed ticket).
**Option C (Known Gap):** Out of scope Phase 2; pre-flag all K-029-touched properties as "K-029 drift — do not audit"; TD-K034-P2-06 for future resolution.
**Recommendation:** **Option A** — K-029 landed based on user-visible quality (readability on paper bg); Pencil should chase reality, not the other way. Designer updates `35VCj` as first Phase 2 task.
**If not ruled:** drift list author will default to "flag everything", 20+ false-positive drift entries, Phase 2 audit signal-to-noise collapses.

---

### QA Challenge #8 — Regression snapshot baselines: `shared-components.spec.ts-snapshots/` will drift
**Issue:** `frontend/e2e/shared-components.spec.ts-snapshots/` currently contains 3 PNGs (`footer-about-chromium-darwin.png`, `footer-business-logic-chromium-darwin.png`, `footer-home-chromium-darwin.png`) from Phase 1. Any Phase 2 Engineer code update on Footer (if Challenge #4 Option B is rejected) OR any body-section layout change triggers Playwright snapshot mismatch on next CI run. Phase 2 ticket currently has no AC covering snapshot baseline update policy — Engineer may `--update-snapshots` silently (regenerating) or manually delete + accept, both lose regression protection.
**Risk:** Engineer fixes 3 drifts, runs `npx playwright test --update-snapshots`, all snapshots regenerate, all tests green. New baseline now locks in the fix BUT also silently absorbs any unrelated side effect (font metric shift, hairline color change). QA 0c screenshot parity against Pencil PNG still catches Pencil-drift, but Playwright snapshot regression protection is voided for that cycle.
**Option A (fix):** Phase 2 AC adds explicit snapshot policy: "any snapshot baseline update during Phase 2 requires (a) corresponding Pencil JSON/PNG re-export (Designer round-trip per Challenge #5), OR (b) PM-written rationale in ticket §5 recording the exact drift and why no Pencil change needed. Blanket `--update-snapshots` is prohibited; Engineer runs update per-file with git diff review before commit."
**Option B (Known Gap):** Accept blanket snapshot regeneration; rely on Pencil PNG parity (QA 0c) as sole regression line. TD-K034-P2-07 opened for future snapshot review tooling.
**Recommendation:** **Option A** — K-035 root cause was exactly this pattern ("route-local assertion + baseline regenerated at each green run = drift codified"). Phase 2 needs snapshot hygiene, not more snapshots.
**If not ruled:** QA will flag any Phase 2 commit containing `--update-snapshots` in git history as CODE-PASS / COMMIT-BLOCKED pending PM rationale.

---

### QA Challenge #9 — Idempotency: Pencil frame node IDs not stable
**Issue:** Phase 2 dump + drift list will reference Pencil node IDs (per `86psQ.json` structure: `"id": "hpwtD"`). But Pencil's MCP-assigned node IDs are autogenerated per insert. If Designer does ANY edit to `homepage-v2.pen` after Phase 2 dump (e.g. a Phase 3 Footer tweak), node IDs for unchanged nodes MAY or MAY NOT be stable — depends on Pencil internals (undocumented per MCP instructions). If unstable, re-running Phase 2 audit tomorrow yields JSON with different IDs, drift list references become stale, and any follow-up ticket referencing "node `hpwtD`" has no anchor.
**Risk:** Drift list cites node IDs, PM rules resolution, Designer edits Pencil, IDs churn, next-day re-verification can't find the node. This is an idempotency test failure for the whole audit process.
**Option A (fix):** Phase 2 drift list uses `(frame-id, node path)` tuple instead of raw node ID — e.g. `(35VCj, children[3].children[1])` or `(35VCj, name="DossierHeaderBar")`. Requires Designer to ensure every Pencil node has a stable `name` attribute (most nodes in current `86psQ.json` do — `"name": "ftR"`). Drift schema (Challenge #2) then specifies path-by-name, not path-by-ID.
**Option B (Known Gap):** Accept node-ID instability; TD-K034-P2-08 opened; drift list is a point-in-time snapshot; any follow-up references Pencil via re-dump + manual re-match.
**Recommendation:** **Option A** — trivial lift (Pencil nodes already have `name`), huge return (idempotency preserved across sessions). Drift schema column `pencil-json-path` uses name-based JSONPath (e.g. `$.frame.children[?(@.name=="DossierHeaderBar")].children[?(@.name=="FileNumber")].fontSize`).
**If not ruled:** Phase 2 drift list will have 1-week shelf life; any follow-up audit must redo from scratch.

---

**Summary: 9 Challenges filed. All 9 require PM ruling before Designer/Architect/Engineer release.** Without rulings on #1, #2, #5, #9, Phase 2 output is mathematically not verifiable — audit will FAIL at sign-off regardless of effort invested. Challenges #3, #4, #6, #7, #8 need rulings to define scope; silent scope = QA marks Phase 2 FAIL per persona rule ("no explicit 'not testing because ___' = silent omission not acceptable").

**Recommended PM ruling session scope:** answer all 9 inline in ticket §Phase 2 PM Rulings block (parallels §4.4 Phase 3 PM Rulings structure). Expected output: 9 Option picks + rationale + any TD-K034-P2-0N trackers opened. Then expand AC-034-P2-DRIFT-LIST from stub to full Given/When/Then block citing the drift schema.

**What went well:** pre-consultation evidence probe caught three concrete blockers (no `about-v2.pen`; `35VCj` is unsplit monolith; JSON header `pen-mtime-at-export` already provides round-trip atomicity primitive) before drafting Challenges — grounded every Challenge in file-path evidence.

**What went wrong:** N/A — Early Consultation fired at correct gate (Phase 2 open, Designer not yet released).

**Next time improvement:** when PM opens a Phase with placeholder ACs flagged "to be expanded at Phase N-1 close", QA Early Consultation should fire immediately on Phase open, not wait for PM to request — placeholder ACs are by definition untestable and deserve Challenge treatment before any downstream role engages. Codify as hard rule in `qa.md` Early Consultation section.

---

## 2026-04-23 — K-038 /diary shared Footer (ABSORBED INTO K-034 Phase 3)

**Absorption note (2026-04-23):** Per user directive, ex-K-038 scope absorbed into K-034 as Phase 3. All 9 Challenges below remain valid and binding on Phase 3 AC structure. PM has ruled the 4 Option-required Challenges per Phase 3 AC block (verbatim rulings in `docs/tickets/K-034-about-spec-audit-and-workflow-codification.md` §4.4 PM Rulings on Phase 3 QA Early Consultation):
- Challenge #1 (loading state) → **Option A** (Footer renders during loading) — routed to AC-034-P3-DIARY-FOOTER-LOADING-VISIBLE
- Challenge #2 (viewport seam) → **Option A** (Known Gap, log to design-exemptions.md §2 RESPONSIVE; TD-K034-P3-02 opened) — routed to AC-034-P3-VIEWPORT-SEAM-KNOWN-GAP
- Challenge #6 (sitewide-footer /diary coverage) → **Option A** (add /diary to 4-route computed-style loop) — routed to AC-034-P3-SITEWIDE-FOOTER-4-ROUTES
- Challenge #9 (K-017 retroactive retirement) → **Option A** (retroactive annotation for 3-ticket trail consistency) — routed to AC-034-P3-SACRED-RETIREMENT

The other 5 Challenges (#3 fixture registration, #4 describe block cleanup, #5 snapshot baseline precision, #7 inventory footnote, #8 FAIL-IF-GATE-REMOVED scope) all confirmed by Phase 3 AC structure / Engineer design-doc expectations per §4.4 ruling table. QA Early Consultation now serves **K-034 Phase 3** (absorbed ex-K-038), not a standalone K-038 ticket; ticket ID K-038 file never landed on disk (reserved-but-absorbed; next new ticket = K-039).

Cross-ref: `docs/tickets/K-034-about-spec-audit-and-workflow-codification.md` §Phase 3 AC block + §4.3 BQ rulings + §4.4 QA Challenge rulings.

---

**Ticket (historical as-filed):** `docs/tickets/K-038-diary-shared-footer-adoption.md` — /diary adopts shared Footer; retire K-017 + K-024 + K-034 P1 half Sacred; /app (K-030) preserved. **Note:** file never landed on disk; content preserved below as historical Challenge record. Ongoing ticket tracking is now K-034 Phase 3.

**Scope reviewed：** ticket AC-038-P0-* + AC-038-P1-* (10 AC total); Sacred retirement table (§3 BQ-038-03); affected spec files `shared-components.spec.ts` T1/T2/T4 + `pages.spec.ts` L152–164 + `sitewide-footer.spec.ts` L3–20 header comment + `sitewide-fonts.spec.ts` L9 comment; DiaryPage.tsx current structure (3 terminal states + loading); shared Footer component (`components/shared/Footer.tsx` prop-less); K-030 `/app` isolation preserved.

**Grep audit cross-reference：**
- `grep -rn "/diary" frontend/e2e/ | grep -iE "footer"` → 3 hits: `shared-components.spec.ts:99–100` (T4), `pages.spec.ts:152/158` (AC-017-FOOTER no-footer block). No hidden third spec.
- `grep -rn "footer" frontend/e2e/ | grep -i diary` → same 3 hits + `visual-report.ts:38` (visual report route list, benign — will auto-pick up Footer render after Phase 1).
- `grep -n "diary\|Footer" sitewide-fonts.spec.ts` → 零 `/diary`-specific 斷言（既有 shared Footer fontFamily 斷言只跑 `/`，不需要改）。
- `sitewide-footer.spec.ts` 頂端 L7 註解 `Given: user visits /, /business-logic` — /about 已因 K-035 退役 Sacred 納入共用 Footer；此 spec 的兩個 `test()` 只跑 `/` 與 `/business-logic`，/diary 不在其覆蓋面。Phase 1 若決定納入必須顯式討論（Challenge #6 涵蓋）。

**QA Challenge 清單（9 條）：**

---

### QA Challenge #1 — AC-038-P1-DIARY-FOOTER-LOADING-ABSENT：loading state Footer 行為交給 Engineer「自己決定」= untestable

**AC 原文：** "Engineer self-decides — not a product decision; Playwright asserts whichever the implementation chooses"

**Issue：** 這不是 AC，這是開罰單時才補規範的 post-hoc rationalization。"any of two branches OK" 使 Playwright 無法在 fail-if-gate-removed dry-run 中偵測 regression — 若未來 Engineer 刪掉 loading-branch Footer 渲染（或反向），沒有任何 spec 會 FAIL。loading state 可能停留 >1s（`useDiary` 串 fetch `/diary.json`，慢網路 3G 實測 2–4s），非 transient，User 看得到。

**需補充（PM 裁決二選一）：**
- Option A — **loading 時渲染 Footer**：AC 改寫為 `locator('footer').count() === 1 during loading`；Playwright 用 `page.route('**/diary.json', ...)` 人為延遲 2s 斷言 loading skeleton + Footer 同時在 DOM。與 `/business-logic` PasswordForm 預登入 state（Footer 有渲染）一致。**推薦**：此選項與其他 consumer route 行為一致，實作最簡單（`<Footer />` 放 `<main>` 同層就自動覆蓋所有 state）。
- Option B — **loading 時不渲染 Footer**：AC 改寫為 `locator('footer').count() === 0 during loading, count === 1 after loading done`；Engineer 需 conditional render `{!loading && <Footer />}`。測試需延遲 fixture + 雙重斷言。

**若不補充：** AC-038-P1-DIARY-FOOTER-LOADING-ABSENT sign-off 時 QA mark FAIL（原因：AC 無 falsifiable predicate）。

---

### QA Challenge #2 — AC-038-P1-BYTE-IDENTITY-4-ROUTES 缺 mobile viewport 斷言

**AC 原文：** T1 byte-identity matrix + viewport hardcoded `width: 1280, height: 800`（desktop only，繼承自 K-034 Phase 1）

**Issue：** DiaryPage `<main>` 用 `px-6 sm:px-24`（mobile 24px / desktop 96px）而 Footer 用 `px-6 md:px-[72px]`（mobile 24px / desktop 72px ≥ 768px）。兩者 horizontal padding 在 **640px–768px 區間**（Tailwind `sm` 斷點 640px vs `md` 斷點 768px）會發生 main 已經切到 desktop 但 Footer 還是 mobile 的 **viewport-padding seam**。K-034 Phase 1 shared-components-inventory.md §INHERITED exemption 允許 Footer padding 因祖先差異視覺表現不同，但此 seam 在 `/diary` 是新情境 — `/`、`/about`、`/business-logic` 祖先都沒有 `sm:px-24` 同時存在。

**需補充（PM 裁決二選一）：**
- Option A — **byte-identity 僅 desktop，視覺 seam 列 Known Gap**：保留 T1 只跑 1280×800，PM 顯式裁決 "640–768px seam 不測，因為 K-034 §INHERITED 已允許 padding variance"。**推薦**：最低成本，與既有 Sacred 一致。但 QA 要求 `design-exemptions.md §INHERITED` 追加一行明列 /diary 情境。
- Option B — **T1 跑三 viewport（360 / 768 / 1280）**：成本上升，但覆蓋 seam 真實渲染。若選 B，`footer-diary-chromium-darwin.png` snapshot baseline 從 1 個變成 3 個。

**若不補充：** 640px–768px 區間若存在視覺 regression，Phase 1 sign-off 時 QA 無 spec 可依；走 Known Gap 路徑 (PM 表態 "不測") 才算覆蓋。

---

### QA Challenge #3 — AC-038-P1-DIARY-FOOTER-EMPTY-STATE / ERROR-STATE 缺 fixture 註冊機制

**AC 原文：** "Given useDiary returns empty entries: []" / "Given useDiary returns error state"

**Issue：** 未明說 Playwright 如何 **強制** 進入 empty / error state。`diary-page.spec.ts` 既有手法是 `page.route('**/diary.json', ...)` fulfill 空陣列或 status=500。AC 沒寫 → Engineer 可能漏寫 fixture 路由，測試跑 production `diary.json`（非空），empty-state 分支 0 coverage。K-024 Phase 3 AC-024-BOUNDARY 已確立 "boundary spec 用 `page.route` fulfill fixture、不改 production diary.json" — 此 AC 應引用既有 pattern。

**需補充：** AC-038-P1-DIARY-FOOTER-EMPTY-STATE + ERROR-STATE 各加一行 `And Playwright uses page.route('**/diary.json', ...) to force the state (empty array / status=500) per K-024 Phase 3 boundary spec pattern`。且 Engineer 在 design doc 明列 fixture 檔名（`_fixtures/diary/empty.json` 已存在？）。**推薦**：直接複用既有 fixture，無新檔案。

**若不補充：** Engineer 自創 state-mock 方式，test 可能誤 PASS（production `diary.json` 有資料 → 走 timeline 分支 → Footer 也在，斷言通過但沒驗到 empty/error 分支）。QA sign-off 時 FAIL。

---

### QA Challenge #4 — `pages.spec.ts` L158–164 退役後 describe block 命名殘留

**AC 原文：** AC-038-P1-SACRED-RETIREMENT "the assertion block is deleted and a replacement inline comment reads ..."

**Issue：** `pages.spec.ts` L157 有 `test.describe('DiaryPage — AC-017-FOOTER no footer', () => {...})`。AC-038 只說「刪除 assertion block + 加 inline comment」，沒說 describe wrapper 怎麼處理。若只刪 `test()` 內容留 describe block 外殼，spec 會 discovery 到空 describe（Playwright 不 FAIL 但 test count 報表顯示 orphan block）；若連 describe 一起刪，K-024 retirement log 的行號引用會失效。

**需補充：** AC-038-P1-SACRED-RETIREMENT 明列：
- **刪除整個 describe block**（L157–164）
- **replacement inline comment 放在刪除處原位**，內容 verbatim: `// AC-017-FOOTER /diary negative clause retired per K-038 §3 BQ-038-03 — user intent change 2026-04-23; Footer now covered by shared-components.spec.ts T1 (byte-identity 4 routes)`
- **行號引用更新** K-017 + K-024 ticket 回指 K-038 §7（非回指被刪掉的 spec 行號）

**若不補充：** sign-off 時 QA 會發現 spec file 有 orphan describe 或 comment 位置錯亂；PM escalate。

---

### QA Challenge #5 — AC-038-P1-SNAPSHOT-BASELINE：新 baseline 容許 0.1% 變異但沒定義「祖先 padding 差異」如何處理

**AC 原文：** "all 4 PNGs visually identical (pixel-level diff ≤ 0.1%; Footer content and styling byte-identical modulo ancestor padding variance per design-exemptions §2 INHERITED category)"

**Issue：** 兩層問題：
1. **Playwright `toMatchSnapshot` 是 per-route 獨立 baseline**，不是 cross-route diff；AC 文字「4 PNGs visually identical」技術上不精確 — 實際運作是 `footer-diary-chromium-darwin.png` 獨立 baseline，未來 CI 只比自己 vs 自己。跨 route identity 由 T1 byte-identity 斷言承擔（outerHTML 等價），不是 snapshot 承擔。
2. **祖先 padding variance** — `/diary` Footer 繼承 `<main className="px-6 sm:px-24">` 祖先的 horizontal padding。Footer 自己 `w-full` + `px-6 md:px-[72px]` 是 viewport 級、不受祖先 padding 影響，但 Footer 截圖範圍（`footer.screenshot()`）若 Playwright clip 到 Footer element box 就沒影響，若包含 overflow 影響的祖先 scroll bar 就可能有 1–2px 差。這是 Phase 1 Engineer dry-run 才會知道。

**需補充：** AC-038-P1-SNAPSHOT-BASELINE 改寫為：
- **Mandatory：** 新 baseline `footer-diary-chromium-darwin.png` generated；per-route snapshot 獨立檢查不回歸。
- **Cross-route identity by T1, not snapshot**：AC 文字移除「4 PNGs visually identical」這句（誤導）；改為 "cross-route byte-identity asserted by T1 outerHTML diff（per AC-034-P1-ROUTE-DOM-PARITY）; this AC only locks per-route visual baseline."
- Engineer 在 design doc 先跑 dry-run 確認 `<main>` 祖先 padding 不外溢到 `<footer>` 截圖；若外溢 → 列 BQ 回 PM。

**若不補充：** 第一次 CI 跑 snapshot 若因祖先 padding 產生 2–3px 差，Engineer 會被迫 retrofit baseline 或質疑 AC；sign-off 出現反覆。

---

### QA Challenge #6 — `sitewide-footer.spec.ts` 沒加 /diary 斷言 = Footer 各屬性斷言對 /diary 零覆蓋

**Issue：** K-038 ticket 只規劃 `shared-components.spec.ts` T1 + snapshot；`sitewide-footer.spec.ts`（驗 fontSize 11px + color rgb(107, 95, 78) + border-top-width > 0）目前跑 `/`、`/business-logic` 兩 route（`/about` 由 K-035 退役後 K-034 Phase 1 rewrite 由 shared-components.spec.ts T1/T2 承擔）。

- T1 byte-identity 只驗 outerHTML 字串完全相等，**不驗 computed style** — outerHTML 相等不保證 browser 實際 `getComputedStyle` 渲染出相同 `fontSize`（極端情境如 CSS inheritance 被 `<main>` 祖先某個 `font-size: 16px !important` override）。
- T2 Pencil-canonical text 只跑 `/`（L58–73），單 route 抽樣。
- `sitewide-footer.spec.ts` 的 computed-style 斷言才是 per-route defensive net，但 K-038 沒提。

**需補充（PM 裁決）：**
- Option A — **`sitewide-footer.spec.ts` 的 describe block 覆蓋 `/diary`**：新增 `test('/diary — shared Footer shows with 11px muted + border-top', ...)`，複用既有 `expectSharedFooterVisible()` helper，一行新增。**推薦**：成本極低，但覆蓋 T1 無法捕捉的 computed-style regression（CSS cascade 被破壞），與 /、/business-logic 對稱。
- Option B — **不補充**：PM 顯式裁決 "T1 byte-identity 已涵蓋 `/diary` computed style"（理論上 outerHTML 相等 + 同一 CSS file → computed style 相等）；登 Known Gap，sign-off 時 QA 不 FAIL。

**若不補充：** Sign-off 時 QA mark /diary computed-style regression 為 Known Gap（須 PM 表態），否則 FAIL。

---

### QA Challenge #7 — `shared-components-inventory.md` Footer 行未涵蓋 Pencil frame ID 重用條款

**AC 原文：** AC-038-P0-INVENTORY "Footer row `Consuming routes` cell = `/`, `/about`, `/business-logic`, `/diary`"

**Issue：** inventory.md 現行 Footer 行的 "Pencil Source of truth" 欄列 `4CsvQ`, `86psQ`, `1BGtd`, `35VCj`（homepage-v2.pen）。/diary 被加入 consumer 後，讀者可能誤解「需要為 /diary 找一個 Pencil frame ID」。BQ-038-01 PM ruling 明說 `/diary` 不需要新 Pencil frame（shared Footer 的 Pencil 起源已明列），但 inventory.md 若只改 consuming routes 欄、不加註解說明 "/diary inherits Pencil provenance via shared component（BQ-038-01 ruling）"，3 個月後新加入專案的 reviewer 會困惑並可能發起反向 BQ。

**需補充：** AC-038-P0-INVENTORY 加一條：
- **And** inventory.md Footer 行加 footnote 或 "Notes" 欄：`/diary consumes shared Footer per K-038 §3 BQ-038-01 ruling — no dedicated Pencil frame; Pencil provenance inherited from 86psQ + 1BGtd sitewide one-liner.`
- **And** "Routes with NO shared chrome" section 刪除 `/diary` bullet 時，行上方加 comment 引用 K-038 ticket id。

**若不補充：** 未來維護者重複發起 BQ；本次 Sacred 退役記錄不完整。

---

### QA Challenge #8 — AC-038-P1-FAIL-IF-GATE-REMOVED dry-run scope 不清

**AC 原文：** "Engineer temporarily reverts `<Footer />` from DiaryPage.tsx as dry-run; ... dry-run is reverted before Phase 1 close; Engineer retro records stdout snippet"

**Issue：** 三個 gap：
1. **dry-run 要跑哪些 spec file？** 只跑 `shared-components.spec.ts`？還是全 Playwright suite？K-024 Phase 3 feedback_engineer_concurrency_gate_fail_dry_run 明確規定 fail-if-gate-removed 應「跑斷言直接相關的 spec subset」不跑全套。
2. **"reverts Footer" 指哪種 revert？** (a) 刪 `import Footer`（tsc 會 FAIL）、(b) 刪 `<Footer />` JSX render 但保留 import、(c) 條件化 `{false && <Footer />}`。不同選法測試到的 failure mode 不同。
3. **Engineer retro 要記什麼 stdout？** 只記 FAIL message？還是整個 test run summary？

**需補充：** AC-038-P1-FAIL-IF-GATE-REMOVED 明列：
- **Scope：** `npx playwright test shared-components.spec.ts` subset（3 個 test：T1、T4a `/app`、Footer snapshot on /diary），不跑全套
- **Revert method：** (b) 只刪 `<Footer />` JSX（保留 import；tsc 不 FAIL；純 behavioral revert）
- **Expected FAIL：** T1 `/diary` byte-identity assert FAIL + Footer snapshot baseline assert FAIL；T4a `/app` 應 PASS（不受影響，驗 `/diary` 與 `/app` 沒跨污染）
- **Retro format：** 附 FAIL message + `Expected: <normalizedHtml>` vs `Received: <non-existent footer>` 前三行

**若不補充：** Engineer 自定義 dry-run、Reviewer 深度 gate 可能放過 false-green（如沒跑到真正的 T1）。

---

### QA Challenge #9 — Sacred 退役後 K-017 / K-024 / K-034 ticket 歷史記錄追溯更新未明

**AC 原文：** §7 Retired Items Log "K-024 ticket §Sacred table gets an appended retirement line pointing here" / "K-034 ticket §7 Sacred table gets an appended retirement line pointing here"

**Issue：** §7 說 K-024 + K-034 ticket 要回寫「retirement line pointing here」，但 K-017 ticket 沒提要不要回寫。§3 BQ-038-03 表格也只說 "ticket K-017 AC text left unchanged (historical record)"。不一致：
- K-017 Sacred 原生來源 → 不回寫（AC text 不動），但歷史讀者找 K-017 AC-017-FOOTER 時如何知道已退役？
- K-024 inheritor → 回寫
- K-034 inheritor → 回寫

**需補充：** §7 Retired Items Log 加一列 K-017 處理方式：
- **Option A — 回寫 K-017**：於 K-017 AC-017-FOOTER `/diary` 負斷言區塊下方 append 一行 `> **Retired 2026-04-23 by K-038 §3 BQ-038-03** — user intent change; see K-038 ticket for new AC-038-P1-FOOTER-ON-DIARY.`。AC text 本體保留（historical record）。**推薦**：一致性，3 個 ticket 都有 retirement trail。
- **Option B — 不回寫**：僅靠 K-038 §7 table 作為唯一追溯來源。節省 K-017 不動原則，但 K-017 讀者視角殘缺。

**若不補充：** Sign-off 時 PM retrospective 會發現 retirement trail 不一致；raise meta-BQ 回流 K-038。

---

### QA Challenge — NOT RAISED（已確認在 AC 內）

以下 boundary QA pre-check pass，不列 Challenge：
- **Sticky footer / viewport-short content overlay：** shared Footer 非 sticky（`w-full` + `border-t` + `py-5` 自然 flow），DiaryPage `<main pb-24>` 已有 96px 底 padding，viewport 高 且 entries 少時 Footer 自然落在 `<main>` 下方 — 不會與 DiaryEmptyState / DiaryError 重疊。
- **SEO / GA disclosure route-specific variant：** Footer 已含 GA disclosure `<p>` 子元素，byte-identical 跨 route；/diary 自動繼承，不需要新 variant。
- **Footer accessibility landmark 衝突：** DiaryPage 無其他 `<footer>` 或 `role="contentinfo"`；`page.getByRole('contentinfo')` 斷言單一匹配 OK。
- **K-018 GA click events regression：** 如 ticket §Non-Goals 4 所述，shared Footer 已是純文字無 `<a>` 錨點；/diary 採用後無新 click 追蹤可觸發，不需 K-018 擴充。
- **K-028 Diary empty-state Sacred 衝突：** K-028 AC-028-DIARY-EMPTY-BOUNDARY 管的是 **homepage 的 diary section**（`DevDiarySection.tsx`），非 `/diary` 頁。`/diary` 採 `DiaryEmptyState` 是獨立組件；Footer 加到 `/diary` 不動 K-028。

---

**總結：**
- **Recommended additional AC / AC 強化：** 9 條（Challenge #1 / #3 / #4 / #5 / #7 / #8 / #9 各需直接補 AC 文字或 §7 table；Challenge #2 / #6 需 PM 二選一裁決 Option A/B）
- **Known Gap 候選（若 PM 選 Option B）：** Challenge #2 mobile viewport seam、Challenge #6 /diary computed-style
- **Sacred 退役無 regression risk：** 3 條退役 Sacred（K-017 `/diary` 負、K-024 `/diary` no-footer、K-034 P1 `/diary` half）與 1 條保留 Sacred（K-030 `/app` isolation）的 grep audit 無其他 hidden dependency；ticket §3 表格完整且與 spec 實際斷言 1:1 對應。K-017 AC-017-FOOTER about-page anchors 部分已由 K-034 Phase 1 另外退役，與 K-038 無交集。
- **重大發現：** 無 regression-inducing Sacred conflict；K-030 `/app` isolation 完全不動、相關 spec (`app-bg-isolation.spec.ts`、`sitewide-fonts.spec.ts` L56 /app Footer removal comment) 與本 ticket 零交集。

**PM ruling required：** 9 條 QA Challenge 逐條回覆（補 AC / 選 Option / 登 Known Gap）；完成後 Phase 0 design-locked sign-off 方可放行 Architect。

**PM ruling landed 2026-04-23:** All 9 Challenges resolved per K-034 Phase 3 AC block absorption (see heading block at top). Challenges #1/#2/#6/#9 each ruled Option A; Challenges #3/#4/#5/#7/#8 all ACCEPT with Phase 3 AC structure carrying the binding text. Cross-ref: `docs/tickets/K-034-about-spec-audit-and-workflow-codification.md` §4.4. Phase 3 Architect release still gated behind Phase 2 close (conservative sequencing per `depends-on: [K-034-phase-2-closed]`) + Designer OPTIONAL decision on `diary-v2.pen` (BQ-034-P3-02) + PM `design-locked: true` sign-off.


---

## 2026-04-23 — K-034 Phase 1 QA sign-off gap — TD-K030-03 recurrence

**沒做好：** 兩層失誤：(a) K-034 Phase 1 QA sign-off 未以 `TICKET_ID=K-034` 前綴執行 `visual-report.ts`，直接跑 `npx playwright test visual-report.ts`，落入 TD-K030-03 已知 fallback 分支，寫出 `K-UNKNOWN-visual-report.html`；(b) 寫出後 QA 未察覺檔名不符，未依 persona §Sign-off step 1 硬規則（`K-UNKNOWN output = failure, must re-run`）重跑。Persona 規則明文存在，Phase 1 QA run 靜默 bypass；兩次同類汙染（K-030 一次、K-034 Phase 1 一次）= TD-K030-03 recurrence count 2。

**下次改善：** (1) Persona §Sign-off stage step 2 後新增 post-step filename verification 硬 gate —— `ls docs/reports/K-${TICKET_ID}-visual-report.html` 必成功 AND `ls docs/reports/K-UNKNOWN-visual-report.html` 必失敗；任一違反 = sign-off BLOCKED，須清除 K-UNKNOWN 汙染後以正確 TICKET_ID 重跑 step 1。Pre-step 指示不足（已證明兩次 bypass），需 post-step 主動驗證。(2) TD-K030-03 優先級 中 → 高（recurrence count 2 觸發 escalation），下次 visual-report tooling 調整時必處理 throw-on-missing-TICKET_ID（根因修復）。本 session 已在 persona 硬 gate 層補 compensating control，但 tooling 層 fix 仍是正解。

---


## 2026-04-23 — K-034 Phase 0 (BFP Round 2 for K-035 α-premise failure)

**做得好：** 省略 — K-017 / K-021 / K-022 / K-035 全程 QA regression 皆未在結構層面挑戰 variant 軸的 Pencil-backing，無具體事件可列。

**沒做好：** `shared-components.spec.ts` K-035 一交付即 3/3 綠，但斷言契約是「DOM equivalence **modulo variant**」——variant 本身（home/about）被接受為「設計上 intentional 的分歧軸」而非須被挑戰的命題。K-034 §1.2 Pencil `batch_get` 現場證明 frame `86psQ`（/about）與 `1BGtd`（/home）為 byte-identical inline 單行（`yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn` Geist Mono 11px），Pencil SSOT 只有一份 Footer 設計，不存在兩個 variant；K-035 的 Architect α-premise（「兩個 Pencil frame 各自的設計」）在 QA 側從未被要求以 Pencil content-parity 驗證過。QA 當時的 regression 維度為 AC-per-route / visual report per page / viewport sweep / cross-route DOM equivalence (K-035 首次加入)，但 cross-route equivalence **已含內建豁免**（variant axis）—spec 本身即為 drift carrier。QA persona 既無「shared-component Playwright spec 必須對照 Pencil `get_screenshot` PNG baseline」規則，也無「code-declared variant 必須對應 Pencil-declared divergence」檢查；QA 上游仰賴 Architect design doc + Reviewer depth review 作為品質閘，兩層皆靜默 propagate α-premise，QA 未在下游獨立挑戰。

**下次改善：** （落地為 persona 硬 gate，Phase 0 由主 session Edit `~/.claude/agents/qa.md`；此處為 QA 同意的語意）(a) Q5a 硬 gate —— shared-component Playwright spec 必須以 `toMatchSnapshot()` + PNG baseline 位於 `frontend/e2e/__screenshots__/`，取代（或加成）現行 class/DOM-string 斷言；baseline 缺失時 spec 自動 fail，不得靠 `--update-snapshots` 靜默過。(b) Q5c 硬 gate —— sign-off 階段必須將 Designer 交付的 Pencil PNG（`frontend/design/screenshots/<page>-<frameid>.png`）與 dev-server PNG 做 pixel-diff（tolerance 由 Designer 在 design doc §Visual Acceptance 明列，預設 ≤0.5% RMS），任何超出 = regression fail，不得以「視覺相似」人眼判定。(c) 當 code 宣稱某組件有 N 個 variant，QA 必 grep `frontend/design/specs/` 對應頁面 JSON 驗證 N 個 variant 是否各自有獨立 Pencil frame ID + 非 byte-identical 的 content／layout／style key；若 N > Pencil divergence count，即 QA Challenge → PM（不得 sign-off）。(d) Cross-route spec 禁用「modulo variant」字樣當豁免語；divergence 必須以「frame-<idA> vs frame-<idB> 的 <key> 欄位 diff」具體列舉，沒有 frame-level 證據即 QA Challenge。

---

## 2026-04-23 — K-034 Phase 0 Early Consultation (new sitewide design workflow)

**Scope:** Challenge edge cases / boundary conditions for the new `.pen`-SSOT-via-JSON workflow being codified in Phase 0 (17-decision table Q1–Q8c). QA 角色評估所有 Q-cell 實作後 Phase 1+ 的 QA-facing 回歸風險與 sign-off gate 可行性。以下為本 Early Consultation 盤點出的 7 條 Challenge，含建議 AC 補強條文與 PM 裁決待填欄。

**Challenges (7):**

**Q1. [`.pen` ↔ specs JSON drift detection]** 當 Designer Edit `.pen` 但遺漏重生 `frontend/design/specs/<page>.frame-<id>.json`（例如忘了跑 export script、或 script 跑一半出 error 被忽略），下游 Engineer / Reviewer / QA 全部對著**過期 JSON**工作卻綠燈，drift 只能靠下一次 Designer 主動 batch_get 時才暴露。
- **建議 AC 補強**：Phase 0 新增 AC-034-P0-DRIFT-GATE：(i) `frontend/design/specs/` 目錄下每個 `*.json` 頂層 frontmatter 必含 `pen-file: <relative-path>` + `pen-mtime-at-export: <ISO-8601>` + `exporter-version: <semver>`；(ii) CI/pre-commit hook `scripts/check-pen-json-parity.sh` 對每個 specs JSON 檢驗 `stat -f %m <pen-file>` 與 `pen-mtime-at-export` 一致，不一致即 exit 1；(iii) PR template 在 `.pen` 或 `specs/*.json` 任一改動時強制列出「我已跑 export script 並確認 JSON 與 .pen 同步」checkbox。
- **PM ruling (2026-04-23):** **ACCEPT** doc-level AC → Phase 0 新增 **AC-034-P0-DRIFT-GATE**（`specs/*.json` 必帶 `pen-file` + `pen-mtime-at-export` + `exporter-version`；Designer persona 手動自查作為 Phase 0 enforcement）。Script 自動化 `scripts/check-pen-json-parity.sh` + pre-commit hook → **TD-K034-01**（Phase 0 non-blocker，待第二次 drift 事件後再自動化；現階段靠 Designer persona §Frame Artifact Export 硬 gate 人工兼顧）。

**Q2. [Playwright snapshot baseline staleness vs Pencil re-export]** Q5a 引入 `toMatchSnapshot()` 後 baseline PNG 存於 `frontend/e2e/__screenshots__/`，但 Pencil 設計變更時 Designer 交付的 `frontend/design/screenshots/<page>-<frameid>.png` 會更新，而 Playwright baseline 不會自動追上——Engineer 只要跑 `--update-snapshots` 即可「通過」而實際上 live UI 與 Pencil 早已不一致。舊 baseline 反而形同 drift 的共犯。
- **建議 AC 補強**：Phase 0 新增 AC-034-P0-SNAPSHOT-DUAL：(i) `frontend/e2e/__screenshots__/<component>-<route>.png` 與 `frontend/design/screenshots/<page>-<frameid>.png` 雙向比對為 QA sign-off 硬 gate（現行 Mandatory Task Completion Steps §0b 延伸）；(ii) QA sign-off 前跑 `scripts/compare-baselines.sh`，若 Playwright baseline hash ≠ Designer PNG hash 即 QA Challenge → PM（可能是 Pencil 改了 baseline 未重跑，也可能是 Engineer 跑 `--update-snapshots` 偷渡）；(iii) `package.json` script `test:e2e:update-snapshots` 新增 guard：只允許在 branch 名 `chore/baseline-refresh-*` 下執行，其他 branch 即 exit 1。
- **PM ruling (2026-04-23):** **DEFER** → **TD-K034-05**。理由：Phase 1 Playwright baseline 尚未建立（`shared-components.spec.ts` `toMatchSnapshot()` 是 Phase 1 deliverable），Phase 0 加 dual-baseline script 為時過早；Phase 1 QA sign-off 步驟才是實際觸發點。執行時機：Phase 1 QA 首次跑完 baseline 時，QA 同步補 `scripts/compare-baselines.sh` + `package.json` `--update-snapshots` branch-name guard，並在 qa.md 登記此 TD 已實作。Phase 0 不為此阻塞。

**Q3. [`visual-delta: none` exemption abuse]** Q7b 的 `visual-delta: none` 讓 Designer-less ticket 成為可能，但沒有結構性阻擋「Phase 2 audit-heavy ticket / 新組件 ticket」被誤標為 `none` 以求快速出貨——PM Phase Gate 若只做「frontmatter 有沒有填」的 syntactic 檢查，無法攔截語意層面的誤標。
- **建議 AC 補強**：Phase 0 新增 AC-034-P0-VISUAL-DELTA-VALIDATOR：(i) ticket template 要求 `visual-delta: none` 時必附 `visual-delta-rationale:` 欄位（單行，Example："pure backend fix, no frontend/src/** file change"）；(ii) pre-commit hook `scripts/validate-visual-delta.sh` 對 `none` ticket 跑 `git diff --name-only main..HEAD -- 'frontend/src/**' 'frontend/public/**'`，若有任何 match 即 block commit；(iii) PM Phase Gate `feedback_pm_all_phases_before_engineer` 延伸：放行前 grep ticket file `visual-delta:`，若 `none` 但 Phase 計畫出現 "new component" / "layout" / "style" / "Pencil" 字樣即降為 QA Challenge。
- **PM ruling (2026-04-23):** **ACCEPT** doc-level AC → Phase 0 新增 **AC-034-P0-VISUAL-DELTA-VALIDATOR**（`visual-delta-rationale:` 欄位強制；PM Phase Gate 人工 grep 關鍵字）。Script `scripts/validate-visual-delta.sh` + pre-commit hook → **TD-K034-02**（待第二次 `visual-delta` 事件或有人第一次提 `none` 票時再自動化；現階段 PM 人工把關）。

**Q4. [Pencil-Pencil internal drift (orphan frames / stale subtrees)]** Pencil `.pen` 本身可能含「設計意圖已經作廢但還沒刪除」的 orphan frame / 子節點（例如某 CTA block 曾被 remove 但仍存在於某 navigation map frame 裡）。Workflow 假設 Pencil SSOT 為無矛盾整體，但現實中 Designer 可能漸進重構、短暫 carry 過期 frame——任何下游從 orphan frame 生 spec 即將 dead design 當活。
- **建議 AC 補強**：Phase 0 新增 AC-034-P0-PENCIL-AUDIT-CADENCE：(i) Designer persona 加 monthly audit step：`batch_get` 所有 top-level frames、列 orphan（無 incoming reference 且無 top-level frame status）；(ii) `.pen` 新增 schema version 欄位，任何 frame 被 mark deprecated 或 deleted 時版本 bump，觸發 `frontend/design/specs/` full re-export；(iii) Ticket 若涉及 cross-frame reference (e.g. Q1 的 Footer 共用)，Architect Pre-Design Audit 必須 `batch_get` 所有被 reference 的 frame 確認非 orphan 再下刀。
- **PM ruling (2026-04-23):** **DEFER** → **TD-K034-06**。理由：目前無實證 orphan frame 導致誤設計的事件（K-035 α-premise 是「兩個 frame 內容相同」非「orphan」問題）；monthly audit cadence 尚無觸發點；`.pen` schema version 需 Pencil MCP 工具支援（非本倉決定權）。現階段 Architect Pre-Design Audit 既有 `feedback_architect_pre_design_audit_dry_run` + Pencil Frame Completeness 已涵蓋 cross-frame reference check 的最基本需求。第一次 orphan 事件發生時，TD-K034-06 升級為 Designer persona 硬 gate。

**Q5. [Cross-page regression after Phase 1 Footer unification]** Phase 1 刪除 `variant` 後 `shared-components.spec.ts` 須由 DOM-equivalence-modulo-variant 升級為**byte-identical DOM across all consuming routes**。但現行 cross-route regression 只有 Footer 一處，NavBar / Hero / BuiltByAIBanner 等其他 shared chrome 未納入；未來任何 ticket 重新引入「針對某一 route 的共用組件 variant」（e.g. `<NavBar compact />` on /app），回歸 spec 仍可能通過。
- **建議 AC 補強**：Phase 1 AC-034-P1-ROUTE-DOM-PARITY 擴充 + Phase 0 新增 AC-034-P0-SHARED-CHROME-INVENTORY：(i) `docs/designs/shared-components-inventory.md` 為 SSOT，列出全站所有 shared chrome 組件（Footer、NavBar、Hero、BuiltByAIBanner、PageHeader 等）+ 消費路由列表 + 允許的 variant（預設 0）；(ii) `shared-components.spec.ts` 為 inventory 的所有組件 × 所有路由自動生成 pairwise byte-identical 斷言；(iii) 任何 PR 引入新 variant prop 必先 Edit inventory + 得 PM 裁決 + 附 Pencil frame 證明 divergence。
- **PM ruling (2026-04-23):** **SPLIT ACCEPT** → Phase 0 收 (i) **AC-034-P0-SHARED-CHROME-INVENTORY**（`docs/designs/shared-components-inventory.md` MVP：Footer + NavBar + BuiltByAIBanner 三組件 × 路由表 + allowed-variant=0）；Reviewer persona Structural Chrome Duplication Scan 已在 K-035 入規則，此 inventory 是 source-of-truth 補位。(ii) 全 inventory × 所有路由 auto-generated byte-diff matrix → **TD-K034-03**（Phase 2 執行，或下次 NavBar/Banner drift 時觸發，arriving sooner）。(iii) 新 variant prop PR gate：PM 人工把關 + inventory Edit 即可，不需自動化。

**Q6. [CI cost of PNG snapshot + per-route byte-diff budget]** Q5a `toMatchSnapshot()` PNG baseline + Q5 所有 shared chrome × 所有路由 byte-diff 會顯著增加 CI 時間（估：現行 full Playwright suite ~3 分鐘，若 + 5 shared × 4 routes × screenshot + pixel-diff 估加 2–4 分鐘）。若無預算框架，工程 pressure 下會傾向關閉 snapshot 或 sample-only。
- **建議 AC 補強**：Phase 0 新增 AC-034-P0-CI-BUDGET：(i) `docs/reports/ci-budget.md` 記錄 full-suite 時間上限（建議 ≤8 分鐘），超出觸發 PM + Architect review；(ii) PNG snapshot **僅限** shared-components.spec.ts 啟用（頁面層級 visual report 維持 on-demand via `TICKET_ID=K-XXX npx playwright test visual-report.ts`，非 CI 常駐）；(iii) 若未來 CI 時間超預算，reduction 優先順序：viewport sweep > page visual report > shared-component snapshot（snapshot 為 Sacred）。
- **PM ruling (2026-04-23):** **DEFER** → **TD-K034-07**。理由：目前 full Playwright suite ~3 分鐘，未近預算上限；Phase 1 snapshot 僅 Footer + 3 路由，估算增量 <30 秒，無迫切性；「snapshot 為 Sacred, viewport sweep / visual report 優先裁」的 reduction policy 當作 TD-K034-07 的 landing 內容，實際預算超出才寫 `docs/reports/ci-budget.md`。現階段僅在此 ruling block 錄此 policy 作為備忘：**若 full suite >6 分鐘，先關 visual-report.ts，再關 viewport sweep，snapshot 最後才考慮**。

**Q7. [New route onboarding checklist]** 當未來新增路由（e.g. /insights、/roadmap），workflow 需保證「Pencil frame 存在 + `frontend/design/specs/*.json` 導出 + `frontend/design/screenshots/*.png` 產出 + shared-components inventory 更新」四者皆 precede Engineer 動工，否則 new route 變成 SSOT 漏洞（無 Pencil backing 即可進 prod）。
- **建議 AC 補強**：Phase 0 新增 AC-034-P0-NEW-ROUTE-GATE：(i) `docs/tickets/` template 新增「新路由 checklist」段落，列出 Pencil frame ID / specs JSON path / screenshots PNG path / inventory entry 四格，任一空即為 incomplete；(ii) PM Phase Gate 於釋出 Architect 前驗證四格皆填；(iii) Designer persona 新增「新路由 intake」流程：PM 提新路由需求時，Designer 先在 `.pen` 新增 frame + 產 specs JSON + 產 PNG + Edit inventory，再通知 PM 放行 Architect。
- **PM ruling (2026-04-23):** **ACCEPT** doc-level AC → Phase 0 新增 **AC-034-P0-NEW-ROUTE-GATE**（新路由 ticket frontmatter 四格必填；PM Phase Gate 人工驗證）。Designer persona 「新路由 intake」流程 codification → **TD-K034-04**（待第一次新路由 ticket 出現時才 codify persona，避免純假設性規則）。

**Cross-reference:** 上述 7 條 Challenge 與 K-034 PRD §4 Phase 0 Deliverables 5–7 部分重疊（Q1/Q2/Q3/Q5 已有相關 persona edit 或 memory file 預計產出），但 Deliverables 未明列 CI/pre-commit hook、inventory 文件、ci-budget 規範、new-route checklist 等**結構性 gate** ——請 PM 裁決：(a) 是否納入 Phase 0 AC（建議 Q1、Q3、Q5、Q7 全納入；Q2、Q6 建議至少以 memory file 層級落地；Q4 建議列 Phase 2 後續 TD）；或 (b) 哪些降為 Known Gap 並記 `docs/tech-debt.md`。未得 PM 明確裁決前，QA 不對 Phase 1 AC 做最終 sign-off。

**PM ruling (2026-04-23 — 綜合裁決):** 7 條 Challenge 按 doc-level vs automation-level + blocking vs non-blocking 二維切：
- **ACCEPT doc-level Phase 0 AC (4 條)**：Q1 → AC-034-P0-DRIFT-GATE；Q3 → AC-034-P0-VISUAL-DELTA-VALIDATOR；Q5 (inventory 部分) → AC-034-P0-SHARED-CHROME-INVENTORY；Q7 → AC-034-P0-NEW-ROUTE-GATE。人工把關（Designer persona 已收 Q1；PM persona 已收 Q3/Q7；Reviewer persona 已收 Q5-inventory cross-ref）為 Phase 0 enforcement。
- **DEFER 至 TD (3 條)**：Q2 → TD-K034-05（Phase 1 QA sign-off 觸發）；Q4 → TD-K034-06（首次 orphan 事件觸發）；Q6 → TD-K034-07（CI 破 6 分鐘觸發）。
- **DEFER 至 TD 的自動化 (4 條腳本)**：TD-K034-01 (drift-gate script)、TD-K034-02 (visual-delta-validator script)、TD-K034-03 (Phase 2 pairwise matrix)、TD-K034-04 (Designer new-route intake persona codification)。
- **Phase 0 增額 deliverable**：`docs/designs/shared-components-inventory.md` MVP（Footer + NavBar + BuiltByAIBanner 三組件 × 路由）為 Phase 0 必產文件，由 PM 本 session 直接產出（單檔小 doc，無需 Designer 介入）。
- **Ticket 更新**：K-034 §4 Phase 0 AC block 新增四條 AC-034-P0-DRIFT-GATE / VISUAL-DELTA-VALIDATOR / SHARED-CHROME-INVENTORY / NEW-ROUTE-GATE + 新章節 §4.1 PM Rulings；`docs/tech-debt.md` append TD-K034-01 ~ TD-K034-07 七條；四條 Q1/Q3/Q5/Q7 ACCEPT 的 AC 於 K-034 Phase 0 commit 階段視為綁定，QA Phase 1 AC sign-off 以此四條 AC 存在為先決條件（詳 K-034 §4.1 最後一段）。
- **QA Phase 1 sign-off 放行條件確認**：以上裁決 + 四條新 AC + TD-K034-01~07 + inventory doc 全部落地後，QA 即可放行 Phase 1 AC 草案至 Engineer dispatch。不需再次 Early Consultation。

## 2026-04-22 — K-035 Phase 3 QA regression

**做得好：** 全 Playwright suite 一把過 243 passed / 1 skipped / 1 failed（唯一 failure `ga-spa-pageview.spec.ts::AC-020-BEACON-SPA` 比對 K-033 tracker 症狀「SPA navigate 後 beacon count 維持 1 未增」完全相符，classify 為 pre-existing 非本票責任）；`shared-components.spec.ts` 3/3 綠 2.5 秒收工（/ variant="home" + /about variant="about" + /diary no-Footer 三向斷言 + 首 Cross-Page spec 首執行即穩定）；`ga-tracking.spec.ts` AC-018-CLICK 3 case 綠燈（contact_email / github_link / linkedin_link），Early Consultation Flag-1「GA click-event AC-visibility gap」以 spec 層面確認 trackCtaClick label 保留；Sacred 四 spec 全綠（sitewide-footer 3/3、pages.spec.ts L158 `/diary has no Footer`、app-bg-isolation AC-030-NO-FOOTER、sitewide-fonts font-mono on Footer variant="home"）；grep 掃 `HomeFooterBar|FooterCtaSection` 於 frontend/src + frontend/e2e = 0 hits，Engineer Step 6 刪除動作在 final commit 維持；visual-report.ts 以 `TICKET_ID=K-035` 跑出 `docs/reports/K-035-visual-report.html`（1.8MB；4 base64 PNG = /, /app, /about, /diary；/business-logic 依 `authRequired:true` 標 placeholder 符合 MVP 規範）；dev-server 多 viewport 手動 spot-check（375/390/414/1280）/ variant="home" Footer fontSize=11px + borderTop=1px + 文字基線一致、/about variant="about" email italic+underline + 所有 CTA href 正確、/diary + /app Sacred no-Footer（`<footer>` tag absent + `Let's talk →` absent + home-variant signature text absent）三條全滿。

**下次改善：** 第一輪多 viewport 手動 spot-check script 用 `document.querySelector('footer')` 單一 selector 驗 `/about` Footer，誤判為「exists:false」卡 1 次；根因是未事先讀 Footer.tsx 確認 variant="about" 刻意 render `<div>` 非 `<footer>` tag（design doc §10.1 已明載）。Spot-check script v2 改用 `data-testid="cta-email/github/linkedin"` + `Let's talk →` 文字 + `class` 計算樣式三條斷言才通過。行為規則：QA 跑自製 spot-check script 前，若 target 組件有多 variant / 多 render 分支，應先 Read 該組件 source 或對照 shared-components.spec.ts 的官方 selector，再挑 selector；不可假設「Footer = `<footer>` tag」這類單一假設即涵蓋全 variant。

## 2026-04-22 — K-035 Phase 3 QA Early Consultation

**做得好：** 對 Pure-refactor behavior-diff 表（design doc §3 17/0）直接跑 QA-側 AC×spec×mock 三維檢核，而非只讀 AC；mockApis fixture 確認 `/api/**` catch-all + `/api/history-info` 具體覆蓋，斷言 shared-components.spec.ts 3 cases 所需 API 已全覆蓋；對 `sitewide-footer.spec.ts`、`pages.spec.ts` L160、`app-bg-isolation.spec.ts`、`sitewide-fonts.spec.ts`、`ga-tracking.spec.ts` L212 逐一 grep 現況，確認 design doc §6 EDIT #9–#13 的 rename/comment-only edits 與斷言邏輯不變，未放掉可能殘留的「含 `FooterCtaSection` 字樣但仍斷言 literal 的地方」。對 AC-035-CROSS-PAGE-SPEC 的 §7.1 spec 契約做 selector 強度檢查，確認 `class` string 字面全等 + `getByText({exact:true})` + `data-testid` + `href` 屬性等值四者已組成充足的 DOM-equivalence contract（不需升級為 outerHTML snapshot）。

**沒做好：** GA click-event 回歸（`ga-tracking.spec.ts` AC-018-CLICK 3 個 email/github/linkedin case）在 design doc §3 diff table row 11 已宣稱 import path 與 `trackCtaClick` 呼叫保留但未在 AC-035-FOOTER-UNIFIED 的 AC 敘述裡以 And-clause 明載「GA click event 名稱（`contact_email` / `github_link` / `linkedin_link`）+ `page_location === '/about'` 不變」；僅靠現有 spec 綠燈等同於把 GA regression 藏在 ga-tracking.spec.ts 內而非明擺在 K-035 AC 上，AC-visibility 略低。依 `feedback_pm_ac_sacred_cross_check` 屬 AC↔Sacred 可並存非衝突，但若 Engineer 誤改 `trackCtaClick(label)` 的字串參數，ga-tracking.spec.ts 會 fail，但 K-035 AC 不會直接點名該失敗屬「AC-035-FOOTER-UNIFIED 違反」。

**下次改善：** Early Consultation 在純 refactor 類 ticket 做 AC 覆盖盤點時，強制檢查「既有的非本票 spec 但斷言的行為是 refactor 必須保留」→ 建議 PM 在 AC-XXX-FOOTER-UNIFIED 這類 AC 加一條 And-clause `And existing <spec-file> <AC-ID> remains green without assertion text change`，讓 AC 層面直接鎖定跨 spec 的 Sacred 行為。

---

## 2026-04-22 — K-035 Bug Found Protocol (QA)

**What went wrong (root cause):**
User found on 2026-04-22 that `/about` renders `FooterCtaSection.tsx` while `/` and `/diary` render `HomeFooterBar`. Both K-017 (AC-017-FOOTER in `about.spec.ts` L306–346) and K-022 (AC-022-FOOTER-REGRESSION in `about-v2.spec.ts` L264–280) signed off because every footer assertion was **route-local** — they asserted "Let's talk →", `mailto:` link, "Or see the source:", GitHub / LinkedIn hrefs *on `/about` only*, never compared against the footer rendered on `/` or `/diary`.

Worse, `sitewide-footer.spec.ts` (K-021) actively **codified the drift as intentional** at L10 (`/about 維持 <FooterCtaSection />（K-017 鎖定），不得渲染 HomeFooterBar`) and L88–101 (`/about renders FooterCtaSection, NOT HomeFooterBar`). A ticket-level decision ("K-017 is the About scope") was promoted into a sitewide regression assertion without anyone asking: *why does the "sitewide" footer have a one-route exception?* I treated the AC-017 boundary as ground truth and wrote a spec that pins `/about` away from the shared component — making the drift test-enforced.

Trace of "did I consider cross-page consistency when writing K-017 / K-022 specs?" — **No.** The QA regression dimensions at the time were: (1) AC-per-route visible text + style, (2) visual report per page, (3) viewport-boundary sweeps. Cross-route DOM equivalence for shared chrome (Footer, NavBar, Hero, CTA) was not a dimension. The cross-route matrix pattern *does* exist in `navbar.spec.ts` (`for (const {path, name} of pages)` loop over `/`, `/about`, `/diary`, `/business-logic`) but only asserts "NavBar links present" — not "NavBar DOM is the same shared component." The pattern was never extended to Footer, and the shape-of-assertion (presence vs equivalence) never asked "is this the same component instance on every route?"

Visual report (`visual-report.ts`) takes per-route screenshots side-by-side, but my sign-off criterion was "each screenshot looks correct for its own AC," not "Footer crop on `/about` is pixel-equivalent to Footer crop on `/`." FooterCtaSection and HomeFooterBar are *both* valid footers in isolation — only cross-page comparison surfaces the drift, and that comparison step was missing from the sign-off checklist.

**What went well:** Omitted — no concrete QA behavior in K-017 / K-022 caught any part of this class of defect; claiming otherwise would be fabrication.

**Next time improvement:**

1. **Add `frontend/e2e/shared-components.spec.ts`** with the following hard assertions:
   - `Footer`: on `/`, `/about`, `/diary` — assert `page.locator('footer').innerHTML()` (or normalized `innerText`) is **equal across all three routes**. Use one route as canonical reference (`/`), compare others against it. A new route rendering its own inline footer → fails automatically without spec edits.
   - `NavBar`: on `/`, `/about`, `/diary`, `/business-logic` — assert `page.locator('nav').outerHTML()` modulo the single `aria-current="page"` attribute (which legitimately varies per route). Everything else must be byte-identical.
   - `BuiltByAIBanner` (if rendered on ≥2 routes): same innerHTML equivalence pattern.
   - Structure the spec so that adding a new route to the routes array is the *only* edit needed when the project adds `/foo`; the assertion body must not be per-route.

2. **Delete the "`/about` maintains FooterCtaSection" assertion in `sitewide-footer.spec.ts` L88–101** once Phase 3 lands. A sitewide spec pinning one route *away* from the sitewide component is a drift-preservation anti-pattern — the spec itself enforced the bug.

3. **Hard step to append to `~/.claude/agents/qa.md`** (under `## Test Scope (general framework)` → new subsection `### Cross-Page Shared-Component Consistency (mandatory when project has ≥2 routes rendering the same chrome)`):

   ```
   Every shared chrome component (Footer, NavBar, Hero, PageHeader, CTA block, banner) 
   that renders on ≥2 routes MUST have a `frontend/e2e/shared-components.spec.ts` 
   (or equivalent) that asserts DOM / innerText equivalence across ALL routes 
   rendering it. Per-route presence assertions ("NavBar visible on /about") are 
   insufficient — they pass when the route renders a duplicate inline copy with 
   matching text.
   
   Required assertion pattern: capture reference route's component outerHTML/innerText, 
   compare every other consuming route against the reference. Route-specific variations 
   (aria-current, active link highlight) are allowed only as explicit modulo-X exceptions 
   in the spec comment.
   
   Audit trigger for existing tickets: before QA sign-off on any ticket touching a 
   shared chrome route, grep `frontend/e2e/` for a spec file that asserts 
   cross-route equivalence of the component being changed. None found = QA sign-off 
   withheld, PM escalation required (not a "nice to have" — a hard gate).
   
   Drift-preservation anti-pattern: if an existing sitewide spec contains a 
   "route X renders <LocalComponent>, NOT <SharedComponent>" assertion, that is a 
   red flag, not an AC. Flag to PM immediately as a cross-role drift, do not treat 
   the assertion as ground truth.
   ```

4. **Hard step to append to `~/.claude/agents/qa.md` under `## Mandatory Task Completion Steps`** (new step 0.5, before Pencil comparison):

   ```
   0.5. **Cross-route shared-component equivalence check (mandatory when ticket 
   touches any route that renders a shared chrome component):**
   For each shared component on the affected route, run the Playwright 
   `shared-components.spec.ts` subset. Any FAIL (cross-route DOM divergence) = 
   do NOT declare PASS, file back to Engineer with route-diff in the bug report. 
   Sign-off based on per-route AC pass + per-route visual report is insufficient — 
   K-035 2026-04-22 proved 5 roles × 2 tickets can miss Footer drift when 
   cross-route equivalence is not a regression dimension.
   ```

---


## 2026-04-23 — K-037 Favicon Wiring Final Sign-off (post-Code-Review, post-Engineer-commit-pending)

**做得好：** 三閘門機械驗證順序清晰 — (1) 完整 Playwright suite 257 passed / 1 skipped / 1 failed，唯一紅燈 `AC-020-BEACON-SPA` 透過 grep 確認是 `ga-spa-pageview.spec.ts` 檔案 L143 註解明文標註「K-033 TRACKER — currently RED on purpose」的預期紅，非 K-037 回歸；(2) favicon 獨立 suite 16/16 全綠（8 asset-200 + 6 link-tag + 1 manifest schema + 1 MIME accept-list）完全對齊 AC-037 四條可測 AC 結構；(3) 機械 AC-037-TAB-ICON-VISIBLE curl grep 驗證（rel="icon"×4 + apple-touch-icon×1 + manifest×1 + theme-color×1）全部吻合期望值，且 theme-color meta content `#F4EFE5` 與 manifest.json `theme_color` byte-for-byte 一致（Architect §3 binding contract #5 達成）。Sacred invariant 交叉比對零衝突 — K-037 scope 僅 `<head>` + `public/` + playwright config 三層（git diff --stat 確認 index.html +7 / playwright.config.ts +41-9 / diary.json +6），未觸及 K-028/K-035/K-021/K-024 shared chrome surfaces。Engineer 回報的 `diary-page T-L1` timing flake 本次 full-suite 未重現，與 Engineer retro「isolated re-run green」敘述一致（timing 類 flake 本質）。Visual report `TICKET_ID=K-037` 正確產生於 `docs/reports/K-037-visual-report.html`（1.8MB，5 captures），並主動清除先前 full-suite run 產生的 `K-UNKNOWN-visual-report.html` 殘檔，避免下游污染。

**沒做好：** Playwright project-split 架構（`chromium` + `favicon-preview` + `visual-report` 三 project）首次出現，QA 未在 Early Consultation 時預先確認「full-suite 呼叫 `npx playwright test` 不帶 --project 參數是否會自動跑 favicon-preview 與 visual-report」— 實際行為是三 project 全跑（favicon 16 + visual 5 + chromium 核心），總數因此跳升到 257，與 Engineer pre-commit baseline 的 256 + 16 = 272 預期不完全一致（差異來自 visual-report 被無意間觸發 + 1 個 diary-page flake 未重現）。事後對照 playwright config 可推出（無 --project filter 時跑所有 project），但若 QA 在 Early Consultation 階段就預審 config 三 project 結構並書面化「full-suite 預期總數＝X（含 visual-report auto-run）」，可避免 sign-off 當下的瞬間困惑。另：mobile Safari iOS / Android Chrome 實機 tab icon 渲染仍為 ticket 內明示 Known Gap（AC-037-TAB-ICON-VISIBLE 條款），本次 sign-off 無法覆蓋 — 依賴 PM close-time 與 user 在真實裝置做側邊比對，非 QA 可機械驗。

**下次改善：** Early Consultation 階段若 Engineer 計畫引入新 Playwright project（測試隔離/附加 webServer/多 baseURL 等），QA 必須書面產出「full-suite invocation matrix」表格（欄：`npx playwright test` / `--project=X` / `<spec-file>`；列：三 project 是否會被觸發；格：預期 test count）貼回 ticket Release Status，作為 sign-off 時對照基線。本次 K-037 回溯補 matrix：`npx playwright test` = chromium(236) + favicon-preview(16) + visual-report(5) = 257 total（1 skipped 在 chromium 核心，屬既有 K-033 tracker）；`npx playwright test favicon-assets.spec.ts --project=favicon-preview` = 16；`TICKET_ID=K-037 npx playwright test --project=visual-report` = 5。已 codify 至 `~/.claude/agents/qa.md` §Mandatory Task Completion Steps — 新增「Step 0c: multi-project playwright config invocation matrix pre-flight」，當 `playwright.config.ts` 出現 ≥2 project 時必備。

## 2026-04-22 — K-025 Final Sign-off (post-Code-Review)

**做得好：** 三閘門串行驗證（tsc exit 0、`npm run build` exit 0、full Playwright suite 192 passed / 1 skipped / 0 failed、navbar.spec.ts 22/22）完全對齊 Engineer 實作回報；AC-025-NAVBAR-TOKEN 額外做 `grep -nE '#[0-9A-Fa-f]{6}' UnifiedNavBar.tsx` 並逐行驗證僅剩 L18–19 註解塊（K-017 legacy provenance 文字），runtime class literals 零 hex，未盲信 Engineer 宣稱。W-1 (TD-K025-01) PM 裁決 TD 入帳而非 sign-off blocker，因 behavior-diff truth table + dual-rail aria-current/computed color 斷言已獨立證明等價，CSS declaration grep 為冗餘 proxy 而非唯一證據。
**沒做好：** 本票 visual verification 依 ticket frontmatter `visual-spec: N/A` + zero rendered-color change 豁免（SCHEMA.md §L124），未開 dev server 做全路由目視 — 對 zero-visual refactor 而言合理但仍屬 coverage 選擇；若未來有 NavBar class 同時跨 active/inactive/hover 三態的改動（非本票 scope），純 computed color 無法覆蓋 hover pseudo-state。
**下次改善：** Sign-off 輸出強制段落化（Verdict / Evidence / Known Gap / Next-ticket-watch）於 persona `qa.md`「Mandatory Task Completion Steps」下加一條模板範例，避免未來 final sign-off 只寫結論不寫證據數字；並在 refactor 類 ticket sign-off 增列「hover/focus pseudo-state 未覆蓋」作為 Known Gap 顯式標示，不靠讀者自行推斷。

---

## 2026-04-22 — K-025 Early Consultation

**做得好：** Pre-Architect gate 即完成三題 Q1/Q2/Q3 審查，提前鎖定 refactor behavior-equivalence 風險（Tailwind arbitrary-value vs token compile 差異）、aria-current attribute-only selector 的視覺盲點、`/business-logic` route 覆蓋 gap；Q2 建議雙軌斷言（aria-current + computed color `rgb(156,74,59)`）而非單純保留 class regex，避免 refactor 後測試僅驗屬性不驗顏色渲染。
**沒做好：** 諮詢時 spec 裡仍殘留「`toHaveClass(/text-\\[#1A1814\\]/)` 同時命中 active `/60` 變體 + inactive 兩種狀態」的寬鬆 regex（L178、L204），K-021 放行時未挑出，導致 K-025 本票 selector 遷移前 regression baseline 本身不嚴格；早期 consultation 第一次看到該 spec。
**下次改善：** 未來 pre-Architect QA consultation 必含一步「baseline spec grep」— `grep -E 'toHaveClass\(/' frontend/e2e/<target>.spec.ts` 列所有 class regex 斷言，逐條檢查 regex 是否唯一命中目標 state（不會跨 active/inactive 同時匹配），有歧義先回 PM 要求 AC 升級為 aria-current + computed color 雙軌，再進 Architect。

---

## 2026-04-22 — K-029 Regression Sign-off

**What went well:** Independent full-suite re-run (197 pass / 1 skip / 0 fail) matched Engineer's report; stale K-UNKNOWN-visual-report.html caught + deleted pre-run per K-028 memory; all 4 K-029 testids (arch-pillar-body / arch-pillar-layer / ticket-anatomy-body / ticket-anatomy-id-badge) verified present + exclusive (zero class-selector fallback for tested components); KG-029-01 closed cleanly.

**What went wrong:** Pencil MCP tool surface not granted to QA agent — forced source-grep fallback for parity verification instead of direct .pen visual diff. Reduces parity confidence to "source palette matches spec" (indirect proxy) rather than "design canvas matches render" (direct).

**Next time improvement:** PM/main-session grant mcp__pencil__batch_get + mcp__pencil__get_screenshot to QA persona tool surface before sign-off rounds on UI tickets, so §0b Pencil parity is first-class, not fallback. Codify in qa.md §0b: "if pencil MCP missing from tool grant, BLOCK sign-off and request tool-grant from PM before proceeding" (currently §0b only handles MCP-server-down, not MCP-tool-not-granted case).


## 2026-04-22 — K-020 Regression (full Playwright E2E sign-off)

**What went well:** Full-suite run (200 tests discovered) landed exactly on the shape agreed in Early Consultation + design §3.1 — 198 pass / 1 skip / 1 fail, where the lone fail is the intentional K-033 tracker (`AC-020-BEACON-SPA`) carrying the PM-ruled C-1 doc-block above it. No pre-existing spec regressed; the 9 new tests in `frontend/e2e/ga-spa-pageview.spec.ts` match design §3.1 one-for-one. AC coverage mapping verified per spec: AC-020-SPA-NAV ×2 green, AC-020-BEACON-INITIAL / PAYLOAD / COUNT green, AC-020-NEG-QUERY / NEG-HASH / NEG-SAMEROUTE green, AC-020-BEACON-SPA red-on-purpose with visible K-033 TRACKER explainer in-source.

**What went wrong:** Pencil MCP fallback policy triggered — `mcp__pencil__get_screenshot` not invoked because K-020 is a pure test-addition ticket (no production code, no UI delta, no `.pen` associated). Per persona the visual comparison is only mandatory when the ticket has a `.pen` design; still, I should be explicit that the visual layer is intentionally skipped rather than silently omitted. Also: `visual-report` run inside the full-suite call printed `TICKET_ID not set, output will be K-UNKNOWN-visual-report.html` — fine for this test-only regression where visual report isn't required, but a generic reminder that the screenshot wrapper needs `TICKET_ID=K-020` when a visual deliverable is expected. No rule was violated on this ticket because the task instruction explicitly waived per-test screenshots; logging so future test-only tickets inherit the same explicit waiver language.

**Next time improvement:** When QA sign-off is a test-only / no-UI-delta ticket, declare in the verdict block "visual layer N/A — no production code change, no `.pen` delta" instead of silently omitting the Pencil comparison step. This makes the Known Gap explicit and matches the persona rule that unstated omissions don't count as sign-off. If any future test-only ticket also introduces even one UI-touching line, revert to full Pencil comparison.


## 2026-04-22 — K-020 Early Consultation (real Agent(qa) run — independent pass)

**Context:** Independent QA Early Consultation invoked by PM for K-020 (GA4 SPA Pageview E2E hardening) following the PM-simulated pass earlier this session. Scope: read ticket K-020 + PRD + `frontend/src/utils/analytics.ts` + `frontend/src/hooks/useGAPageview.ts` + `frontend/e2e/ga-tracking.spec.ts` + `frontend/playwright.config.ts`, probe AC for boundary / edge-case / race-condition gaps. PM pre-decided: BQ-1 resolved to `page.route()` intercept; AC-020-SPY-PATTERN removed.

**Testability review:**
- AC-020-SPA-NAV → ⚠️ Testable but incomplete — click-delta guard present, but beacon payload key not pinned (which of `page_path`, `page_location`, `page_title`, `dl`, `dp` on `/g/collect` query?), same-route / query-only / hash-only navigation behavior undefined, init-vs-SPA timing race for `page.route()` registration undefined.
- AC-020-BEACON → ⚠️ Testable but incomplete — "URL + query" is vague; missing concrete required keys; no assertion that the beacon count matches pageview count (silent over-firing or double-fire undetectable); `page.route()` cleanup on failure unspecified.

**QA Challenges raised (11):**

**Blocking (Architect cannot design without PM ruling):**

1. **QA Challenge #5 — AC-020-BEACON beacon payload keys unpinned.**  
   Issue: AC says "URL query string contains `en=page_view`" but does not enumerate which payload keys constitute a valid pageview beacon. `/g/collect` carries `tid` (measurement ID), `dl` (document location / full URL), `dp` (document path), `dt` (title), `en` (event name), `v=2` (GA4). Asserting only `en=page_view` accepts a beacon that drops `dl` or points at the wrong path — that is precisely K-018 class of silent-drop bug moved one layer down.  
   Needs supplementation: AC must specify required keys — recommend `v=2` AND `tid=G-TESTID0000` AND `en=page_view` AND (`dl` contains `/about` OR `dp=/about` — which one depends on gtag.js version, must be verified in dry-run).  
   If not supplemented: BEACON test will pass on a partial/corrupt beacon, defeating the purpose.

2. **QA Challenge #6 — AC-020-SPA-NAV and AC-020-BEACON do not cross-verify.**  
   Issue: Phase 1 asserts dataLayer has a new entry after SPA navigate; Phase 2 asserts initial `/` load produces one `/g/collect` beacon. Neither AC asserts **SPA navigate produces a new `/g/collect` beacon**. This is the exact K-018 failure mode: `gtag('event', 'page_view', ...)` called but beacon never sent. If the helper internal implementation drifts (e.g. future refactor breaks the Arguments-object push), SPA-NAV will pass (dataLayer entry present) but no beacon leaves the page. AC currently has no test that catches this at the SPA layer.  
   Needs supplementation: Add a third AC or extend AC-020-BEACON with a second test case — NavBar click to `/about` → `page.waitForRequest(/\/g\/collect/)` captures a second beacon whose path-key points to `/about`. BQ-3 in ticket alludes to this race but punts it ("Phase 2 初版只要求初始 load"). Punting it removes the only defense against K-018 shape drift in the SPA path.  
   Recommendation: do NOT defer. Add as hard AC.

3. **QA Challenge #7 — Same-route / query-only / hash-only navigation behavior undefined.**  
   Issue: `useGAPageview` depends on `[location.pathname]`. Therefore:  
   (a) `/` → `/` click (user clicks same-page link): `location.pathname` unchanged → `useEffect` does not re-fire → no pageview. Expected? AC silent.  
   (b) `/?x=1` → `/?x=2` (query-param-only change): `pathname` unchanged → no pageview. Expected?  
   (c) `/#foo` → `/#bar` (hash-only change): `pathname` unchanged, React Router may or may not remount depending on `BrowserRouter` vs `HashRouter` → no pageview. Expected?  
   These are live user flows (tab click that points to current route, filter query changes, in-page anchor). AC and implementation silently disagree on (a)/(b): GA4 Measurement Protocol guidance says pageview should fire when `page_location` changes (location includes query). Current impl does NOT fire on query change — either a bug to be fixed (change hook dep to `location`) or intentional behavior to be documented.  
   Needs supplementation: PM must rule — for each of (a)/(b)/(c), fire or not fire? Then AC must encode the ruling (at minimum one negative-case test: "query-only change does NOT push new dataLayer entry" if the ruling is "don't fire"; otherwise fix the hook + add positive test).

**Non-blocking (Architect can design but must handle in design doc):**

4. **QA Challenge #8 — Back/forward navigation not covered.**  
   Browser back from `/about` to `/` and forward to `/about` again should each fire pageviews (standard GA4 expectation). React Router pushes popstate → pathname change → hook fires. Current AC only tests forward click; back/forward untested. Edge case recommendation: Architect adds a third SPA-NAV case (back button from `/about` fires pageview to `/`). Not blocking; can be Known Gap if PM rules scope.

5. **QA Challenge #9 — Rapid sequential navigation race.**  
   A → B → C within <100ms: three pageviews or coalesced? `useEffect` on `pathname` is synchronous per-render, so three renders = three effect runs = three `trackPageview` calls = three beacons. gtag.js may batch/debounce at the beacon layer. AC silent. Known production risk: rapid NavBar clicks (double-tap on mobile) firing duplicate beacons inflates GA4 user/session counts. Architect dry-run should measure.

6. **QA Challenge #10 — Test isolation: `page.route()` cleanup on failure.**  
   If AC-020-BEACON test throws mid-assertion (e.g. beacon query malformed), does the route handler leak into the next test in the file? Playwright `page.route()` scope is per-page, so `page.close()` cleans it, but `test.afterEach` explicit `page.unroute()` is safer. Specify in Architect design doc: "all `page.route('**/g/collect')` handlers must register in `test` body and rely on per-test page fixture teardown; no shared `test.beforeAll` route registration." — otherwise flake on CI parallel runs.

7. **QA Challenge #11 — Beacon count assertion missing.**  
   Even with correct `en=page_view`, nothing asserts that **exactly one** beacon fires per pageview. A future impl bug that fires the event twice (e.g. StrictMode double-invoke in dev, or someone adds a second `trackPageview` call) will pass current AC. Recommendation: Phase 2 test counts beacons between click and next assertion checkpoint and asserts `=== 1`.

8. **QA Challenge #12 — Invalid measurement ID `G-TESTID0000` dry-run (covered in ticket as Challenge #3).**  
   Already flagged by PM-simulated pass as Architect dry-run item. Reaffirm: gtag.js may refuse to fire `/g/collect` for syntactically malformed IDs. If dry-run shows no beacon fires, Phase 2 is un-implementable with current playwright.config env; need either real test ID or to accept that Phase 2 runs only against `G-` pattern + non-existent ID (possible — GA4 client-side validation is loose, but confirm).

9. **QA Challenge #13 — Navigation type: NavBar Link vs BuiltByAIBanner CTA vs programmatic `navigate()`.**  
   AC names two entry points. Third (programmatic: e.g. a future redirect-on-success-calls `navigate('/app')`) exists in the codebase — any component calling `useNavigate()` hits the same `useLocation()` reactive path, so the test logic is invariant. Recommendation: state explicitly in design doc that NavBar + BuiltByAIBanner cover all human-trigger entry types and that programmatic `navigate()` is considered equivalent (no separate test). Non-blocking — just document.

10. **QA Challenge #14 — BuiltByAIBanner target route.**  
    Current AC-020-SPA-NAV says both cases go `/` → `/about`. BuiltByAIBanner CTA indeed points at `/about` (confirmed via `a[aria-label="About the AI collaboration behind this project"]` in K-018 spec line 166). Two test cases testing the same route transition with different triggers is a weak test matrix. Recommendation: let NavBar test `/` → `/about` and BuiltByAIBanner test a different target if it exists, OR explicitly accept that the two cases are near-duplicates because the goal is to prove "different DOM entry points both reach the hook". Non-blocking — PM already rationalized this in AC wording, just make it explicit in the test comment.

11. **QA Challenge #15 — `page_location` value semantics.**  
    Impl `useGAPageview.ts:17` passes `location.pathname` (e.g. `/about`) as `page_location` — but GA4 Measurement Protocol convention is that `page_location` is the **full URL** (`https://host/about?q=...`), and `page_path` is the path. Helper is sending path-as-location. This works for funnel analysis on simple sites but is a semantic bug. Current AC pins `page_location: '/about'` which **codifies the bug**. Flag to PM: is this intentional (simplification) or a bug to fix now? If fix now, AC must change. Non-blocking for K-020 scope but user should know.

**What went well:** Caught that both AC-020-SPA-NAV and AC-020-BEACON individually have click-delta / throw-on-fail guards but neither enforces the K-018-specific invariant "SPA navigate → new `/g/collect` beacon leaves the page" — which is the exact bug class the ticket was created to prevent. This is a hole. Also surfaced that `useGAPageview`'s `[location.pathname]` dep array causes query-only changes to be silently ignored, an undocumented behavior that AC codifies by omission.

**What went wrong:** PM-simulated pass earlier today caught 4 challenges but missed these 11, including the scope-defining hole (#6 SPA → beacon cross-verify). Simulation from the PM seat lacks the adversarial posture QA role requires — PM-simulated review tends to validate existing design rather than stress-test it. This justifies the ticket's `§Release Status` row flagging "Agent(qa) required" as a real blocker, not a procedural formality.

**Next time improvement:** When K-018-class ticket (production bug retrofit) is created, QA Early Consultation must map "original bug manifestation" → "which AC directly catches it" as a concrete table. For K-020 the bug was "gtag call succeeded but beacon never sent" — AC-020-BEACON covers it for initial load, nothing covers it for SPA navigate. A bug-mapping table would have made this omission visible on first read. Codify in qa.md Early Consultation protocol.

---

## 2026-04-22 — K-020 Early Consultation (self-retrospective on the consultation itself)

**What went well:** Independent read of implementation before reading the ticket surfaced the `[location.pathname]` dep array gap (Challenge #7) and the `page_location`-as-pathname semantic issue (#15) — these would have been invisible if starting from AC text alone. Cross-referencing K-018 retro ("mock/production override order") with the current `addInitScript` pattern in `ga-tracking.spec.ts:34` confirmed BQ-2's premise is sound.

**What went wrong:** Initial scan did not immediately spot Challenge #6 (SPA → beacon cross-verify missing) — it only surfaced after building the challenge list and cross-checking against the ticket's stated goal ("E2E against production GA4 pipeline"). Reading AC in order instead of mapping AC to failure modes allowed the hole to hide.

**Next time improvement:** For any "E2E hardening" or "production bug regression test" ticket, start Early Consultation with a 2-column table — rows = historical bug modes from the linked ticket's retro, columns = AC covers / AC does not cover. Do this BEFORE reading AC line-by-line. If any row has no column checked, that is a blocking gap.

## 2026-04-22 — K-020 Early Consultation (PM-simulated, Agent tool unavailable)

**Context:** PM re-plan session for K-020 (GA4 SPA Pageview E2E). Session lacked Agent tool → could not spawn real `qa` sub-agent; PM executed Early Consultation by reading `~/.claude/agents/qa.md` §Early Consultation protocol + deep inspection of `frontend/src/utils/analytics.ts`, `frontend/src/hooks/useGAPageview.ts`, `frontend/e2e/ga-tracking.spec.ts`, `frontend/playwright.config.ts`. Explicitly disclosed as simulation in ticket §Release Status — user may require a real Agent(qa) pass before Architect release.

**Testability review:**
- AC-020-SPA-NAV → ✅ Testable after wording fix (original AC used GTM dataLayer `{event, page_location}` object shape; production pushes `Arguments` object with index-based access — corrected)
- AC-020-BEACON → ⚠️ Needs supplementation — CI network policy unresolved (no `.github/workflows/` in repo)

**Challenges raised (4):**
1. AC-020-BEACON CI egress unknown → **supplemented to AC** (added "test must throw on timeout, not skip")
2. AC-020-SPA-NAV initial-load pageview entry interferes with click assertion → **supplemented to AC** (added "record dataLayer.length before click, assert new entry points to `/about` after")
3. AC-020-BEACON fake `G-TESTID0000` — does gtag.js fire beacon for invalid IDs? → **deferred to Architect dry-run** (must verify in design doc §Dry-run)
4. Arguments-object type narrowing → **no AC change**, noted for Architect (use existing `IArguments` cast pattern from K-018 spec)

**What went well:** Surfaced 2 AC-level defects (wrong dataLayer shape wording; no click-delta guard) before Architect took the ticket — Phase 1 would have false-passed on the initial `/` pageview entry otherwise. Identified that `ga-tracking.spec.ts:34` `addInitScript` mock is overwritten by production `initGA()` at module load, confirming K-018 retro's "mock/production override order" lesson and making BQ-2's recommendation (drop addInitScript mock, read real dataLayer) concrete.

**What went wrong:** Could not run real Agent(qa) — PM simulating QA loses the independent-perspective value of the role; risks blind spots (e.g., Playwright version-specific `waitForRequest` behavior, edge cases QA would know from regression history). Disclosed in ticket as Known Gap pending user decision.

**Next time improvement:** When PM session lacks Agent tool, block release at §Release Status with an explicit "BLOCK: Agent(qa) required" row rather than proceeding with simulation; only simulate when user has pre-authorized. Codify in `pm.md` §PM session capability pre-flight — already present since 2026-04-21 K-030; enforce "explicit user authorization" clause this session (done: ticket surfaces decision back to user).


## 2026-04-22 — K-029 Early Consultation (verified by qa subagent)

**What went well:** Main session called real qa subagent to re-verify PM-simulated consultation, closing the capability-gap workaround from earlier this session. Findings differed from simulated on 2 of 7 challenges + 1 AC testability issue PM had accepted, confirming value of running the real agent.

**Divergences from simulated (acted on):**
- C3 (selector stability): simulated declared Known Gap with Engineer discretion; verified flagged this contradicts existing about/ testid convention (DossierHeader, FooterCtaSection already use data-testid) — upgraded to Architect design-doc mandate with 4 prescribed testid names (arch-pillar-body / arch-pillar-layer / ticket-anatomy-body / ticket-anatomy-id-badge).
- C6 (pyramid layer span text-ink): simulated left `<li>` detail under 3-token allow-list; verified flagged hierarchy inversion risk (if Engineer picks text-ink for both `<li>` and layer span, the "label more prominent than detail" intent collapses since child==parent) — AC tightened to pin `<li>` detail at text-muted fixed.
- AC "at least one" clause: simulated accepted (and even main session's initial post-PM review agreed); verified showed Engineer could pick a color outside BOTH allow and disallow lists (e.g. text-blue-600) — passes disallow, and only 1 of 3 cards needs allow match, so 2 cards with wrong color slip through. Tightened to "三個皆須命中 allow-list".

**Confirmed (no action):**
- No `darkMode` in tailwind.config + no `dark:` classes — PM's "no OS dark-mode boundary" claim VERIFIED.
- K-022 `about-v2.spec.ts` L195 uses `getComputedStyle` + exact RGB — canonical pattern for K-029 to follow.
- No K-022 spec asserts `text-gray-*` or `text-purple-*` on these components — AC-029-REGRESSION safe, no existing spec breakage.
- Scope = 2 files (7 sites) — grep re-confirmed.
- CardShell inheritance neutral on text color.

**Borderline observation (recorded, no action):**
text-muted on paper at 12px (text-xs) = 4.84:1 contrast — passes WCAG AA 4.5:1 but near the floor. If future font weight reduces perceived contrast, revisit.

**Known Gap reframed:**
**KG-029-01** — Playwright selector path: Architect design doc prescribes data-testid names; Engineer implements per doc; QA sign-off verifies compliance. (No longer speculative stability concern.)

**What went wrong (capability-gap root cause):** PM subagent lacks Agent tool → initial consultation was PM self-review of PM-authored AC, with inherent blind spots. 3 of 7 challenges needed correction once real adversarial review ran. Confirms `feedback_pm_session_capability_pre-flight` is structural, not per-ticket; user/main session must call real qa subagent for Early Consultation when PM subagent cannot spawn one.

**Next time improvement:** When main session hands off to PM subagent and flow requires QA Early Consultation, main session (which has Agent tool) should call qa subagent FIRST and feed the consultation findings into PM's handoff prompt — don't rely on PM simulation as the primary path. Simulation is fallback only when main session itself is unavailable. Codify in future PM release: "QA Early Consultation must come from qa subagent (not PM simulation) whenever main session has Agent tool available."

---

## 2026-04-22 — K-029 Early Consultation (AC testability + palette contrast review)

**DISCLOSURE:** This consultation was simulated by the PM subagent because the current PM session has no Agent-tool access to spawn qa subagent. Per persona §PM session capability pre-flight + memory `feedback_pm_session_capability_pre-flight`, PM proceeded with explicit disclosure. Upon next K-029 QA sign-off the actual qa subagent will re-verify this consultation's findings; any missed boundary at sign-off = gap to be logged back here.

**What went well (simulated QA review):** PM-driven scope scan via `grep -rn "text-gray-\|text-purple-\|text-blue-" frontend/src/components/about/` confirmed dark-theme residuals exist only in `ArchPillarBlock.tsx` (3 sites: body div / pyramid li / pyramid layer span) and `TicketAnatomyCard.tsx` (4 sites: body div / Outcome span / Learning span / ticket ID badge). RoleCard + MetricCard + PillarCard + FooterCtaSection already on paper palette — no additional scope. WCAG AA contrast on paper `#F4EFE5`: text-muted `#6B5F4E` ≈ 4.84:1 (passes AA for body), text-charcoal `#2A2520` ≈ 11.9:1 (AAA), text-ink `#1A1814` ≈ 13.5:1 (AAA). All three palette tokens clear AA for `text-xs` body. No dark-mode / OS-preference boundary — body is hard-pinned `bg-paper`.

**Challenges raised (and resolution):**
1. **AC phrasing "可讀深色" / "或更深" ambiguous** — `deeper` in color space not deterministically verifiable. → **Supplement AC**: replace with explicit allow-list (text-ink / text-charcoal / text-muted RGB) + explicit disallow-list (gray-300/400/500 + purple-400 RGB). PM will patch AC-029-ARCH-BODY-TEXT + AC-029-TICKET-BODY-TEXT.
2. **Ticket ID badge semantic color BQ** — PM-002 asks `text-charcoal` vs `text-muted`. → **PM rules text-charcoal** (see ticket §Architect Pre-check decisions): badge is an identifier / metadata label (Geist Mono mono-weight), not body prose; token table assigns `charcoal` to "次文字 / 輔助元素" — exactly this role. `text-muted` is for Footer / meta / NavBar non-active per architecture.md L453. text-charcoal also gives AAA contrast, preserving the "prominent identifier" visual weight the original `text-purple-400 font-bold` was trying to achieve.
3. **Playwright selector stability** — ArchPillarBlock + TicketAnatomyCard have no `data-testid`; new color assertions must anchor via section heading descent (fragile if Section reshuffles). → **Known Gap declared (KG-029-01)**: Engineer may add `data-testid="arch-pillar-body"` / `data-testid="ticket-anatomy-body"` + `data-testid="ticket-anatomy-id-badge"` at implementation time for stable assertion, OR anchor via `section:has(h2:has-text("Project Architecture"))` + descendant. Not AC-required; Engineer discretion. QA at sign-off will verify whichever path was taken produces stable selectors.
4. **Regression: new computed-color spec vs existing K-022 about-v2.spec.ts** — K-022 spec exists; AC-029 requires extending with color assertions or new K-029 spec. → Engineer task; Architect must explicitly state in design doc which spec file the new assertions go into. Not AC-blocking.
5. **Cross-component consistency (K-022 A-12 scope completion)** — Grep confirms no other `/about` components carry dark-theme residuals. Architect Pre-check item 3 resolved.
6. **testing pyramid `<span>`** — currently `text-gray-300` on font-mono. Per Pre-check: Architect decides between `text-charcoal` (prominence, matches layer label treatment in PillarCard per PillarCard.tsx L22-L25 `text-paper` on `bg-charcoal`) or `text-ink` (direct tonal match with body). → **PM rules text-ink** for the layer span (same as body treatment; avoids visual hierarchy conflict with the bold sibling li). Documented below.
7. **CardShell border/bg isolation** — PillarCard pattern confirms `CardShell` neutral on text color; children drive their own. No inheritance surprise.

**Supplement to AC (PM will patch):**
- AC-029-ARCH-BODY-TEXT Then/And rewritten with explicit RGB allow/disallow lists.
- AC-029-TICKET-BODY-TEXT Then/And rewritten with explicit RGB allow/disallow lists.
- AC-029-REGRESSION unchanged.

**Known Gap declared:**
- **KG-029-01** — Playwright selector stability for new color assertions: no `data-testid` mandated in AC; Engineer may introduce testids or use structural anchors. QA sign-off will confirm chosen path.

**Next time improvement:** If future PM session lacks Agent-tool access, escalate to user to re-spawn main session with full capabilities BEFORE starting BQ resolution. This session accepted the capability gap and mitigated via explicit simulation disclosure, but the upstream fix is session permission hygiene (see memory `feedback_pm_session_capability_pre-flight`).

## 2026-04-22 — K-024 Phase 3 final sign-off

**What went well:** Full regression + Phase 3 sign-off gate completed cleanly on the R2 fix-batch commit 3201622 — tsc 0, Vitest 81/81, Playwright 224 pass / 1 skipped / 0 fail (225 total; +1 from T-C6 mobile hidden-asserts vs Phase 1+2 baseline of 190). All 21 Sacred-bearing tests (K-017 NavBar + K-021 body-paper / fonts + K-023 DevDiarySection marker 20×14 borderRadius 0 + K-028 entry-wrapper 3-marker + DEV DIARY heading at 0-entry + section-spacing + no-overlap + rail-visible + empty-boundary) green without remediation. All six R2 fix items (I-3 dispatchEvent-in-single-tick gate test, D-2 Retry toBeDisabled during in-flight refetch, I-1/I-2 combined T-C6 DiaryMarker + DiaryRail display:none at 390px, I-5 entry-date letterSpacing + entry-body fontWeight/lineHeight catchall extension, D-4/M-5 design doc diary-main row + count 33→41 sync) verified present in spec + design doc. visual-spec.json SSOT consumption confirmed: `readFileSync + JSON.parse` in `diary-page.spec.ts` + const re-export via `timelinePrimitives.ts` — zero hardcoded px/hex in Phase 3 spec file. em-dash U+2014 delimiter integrity preserved end-to-end (visual-spec `textPattern: "K-XXX — <title>"` → `DiaryEntryV2.tsx` L21 + `DevDiarySection.tsx` L122 → dev-server screenshot titles `K-022 — About page structure…`). Dev-server screenshots at 1440 desktop + 390 mobile both visually align with wiDSi + N0WWY Pencil frame geometry (rail inset 40/40, marker 20×14 cornerRadius 6 on /diary, cornerRadius 0 on Homepage Sacred deviation, Bodoni/Newsreader/Geist Mono 3-font catchall per role).

**What went wrong:** Pencil MCP tool calls (`mcp__pencil__open_document`, `get_screenshot`, `batch_get`) registered as unavailable in this session despite the MCP server instructions block being attached — could not capture pixel-level Pencil frame screenshots for side-by-side diff. Executed the three-step offline fallback per QA persona rule (positive delta grep + schema parity + explicit Known Gap declaration), with dev-server screenshot comparison as the visual substitute. Separately: `npx playwright test e2e/visual-report.ts` WITHOUT `TICKET_ID` during the initial full-suite run wrote `K-UNKNOWN-visual-report.html` inline as a side-effect (harmless — overwritten by the explicit TICKET_ID=K-024 rerun, but easy to forget and noisy).

**Next time improvement:**
1. When Pencil MCP tools register but don't respond to calls, try one `get_editor_state` as a probe FIRST before starting any Pencil-dependent step — fail fast and jump to the offline fallback rather than discovering the gap mid-flow. Codify in `qa.md` §"Pencil visual comparison" as a new pre-flight line: "Before `open_document`, probe via `get_editor_state` — timeout / error → offline fallback activated immediately".
2. The visual-report.ts side-effect in the full suite writes `K-UNKNOWN-visual-report.html` whenever `TICKET_ID` env is absent, polluting `docs/reports/`. Propose (as PM Tech Debt candidate, not QA fix scope): either gate visual-report.ts behind a `--grep` filter so it's skipped in the default `npx playwright test` run, or have it read TICKET_ID from branch name (`git rev-parse --abbrev-ref HEAD`) as a fallback before `K-UNKNOWN`. Not blocking; log as TD.
3. Phase-3 sign-off should formally cross-check: any production-code change made in the R2 fix batch (here `useDiary.ts` setError ordering + `DiaryEntryV2.tsx` tracking-wide → tracking-[1px]) must have a corresponding new test assertion that FAILs without the production change. T-L4 covers setError ordering (holds the in-flight promise open and asserts `toBeDisabled` which would not fire if Retry unmounted); T-E6 letterSpacing assertion covers the tracking fix. Both covered in this session, but add to QA checklist as a formal row: "R2 production-code changes cross-checked against new test FAIL-without-change coverage".


## 2026-04-22 — K-024 Phase 1+2 Post-R1 Regression Sign-off

**What went well:** Full gate (tsc 0 / Vitest 81/81 / Playwright 190 passed / 1 skipped / 0 fail) green in a single pass after the R1 remediation commit 694510c, including the new diary.legacy-merge.test.ts (6 tests) which precisely validates the Option B amendment (title-literal pin + non-legacy key-absent permitted). Legacy-merge test coverage directly asserts all five PM-locked constraints (exactly-one, title literal, date 2026-04-16, 50–100 word count, ticketId key-absent at raw JSON level) plus the new non-legacy key-absent allowance — complete coverage of AC-024-LEGACY-MERGE. R1 remediation did not introduce any new regression: K-017/K-021/K-023/K-027 Sacred assertions (NavBar order, AC-021-BODY-PAPER, AC-021-FONTS, DevDiarySection 3-marker, AC-028-MARKER-COUNT-INTEGRITY, diary-mobile flex-col/break-words) all remained green, confirming the minimum-touch Phase 1+2 reshape strategy held through remediation.

**What went wrong:** Nothing observed in this sign-off pass; R1 findings were resolved cleanly and no residual regression surfaced. Pre-existing 1 skipped Playwright test is inherited from main (not introduced by K-024) — acceptable per invocation. No cross-ticket boundary violations detected.

**Next time improvement:**
1. For Option-B-style AC amendments that relax a uniqueness constraint (here: "other ticketId-key-absent entries permitted"), the regression test suite should include at least one positive assertion that the relaxation is exercised in production data — the 6th legacy-merge test correctly does this by counting `!('ticketId' in e)` in raw JSON. Codify as a QA check pattern: whenever an AC amendment introduces a permissive clause, verify the test either exercises the permissive branch on production fixtures or adds a synthetic fixture that does.
2. Visual report was generated with TICKET_ID=K-024 correctly; filename `K-024-visual-report.html` confirmed. No action needed — existing persona step worked.
3. Phase 3 sign-off (future PR) will introduce DiaryPage rewrite + 6+ Playwright specs (T-L1..T-L5 loading/error/empty/retry/long-message, timeline-structure, entry-layout, page-hero, content-width, homepage-curation, diary-page-curation). Pre-commit to running all boundary fixtures (entry = 0/1/3/5/10/11) as separate Playwright specs rather than parametrized, to match the PM-enforced enumeration in AC-024-DIARY-PAGE-CURATION.


## 2026-04-22 — K-024 Early Consultation Round 2

**What went well:** Architect's design doc §6.3 + §6.4 delivered concrete contracts for all three states (DiaryLoading wrapping LoadingSpinner label="Loading diary…", DiaryError with canonical fallback literal "Couldn't load the diary right now. Please try again." + "Retry" button + onRetry prop, DiaryEmptyState literal "No entries yet. Check back soon.") — every selector / literal / retry semantic needed for a Playwright spec is unambiguous in a single authoritative table. Confirmed visual-spec.json does NOT need loading/error roles (thin wrappers around existing LoadingSpinner/ErrorMessage — no new visual primitive), preventing a false Challenge about missing role entries. Cross-checked useDiary hook error classification (§4.1 L307-310) against DiaryError error-classification-scope (§6.3 L572-578) — matched: 4xx/5xx, network TypeError, JSON parse, timeout, no-auto-retry all consistent across both sections.

**What went wrong:** Discovered PM skipped Unblock Protocol step 2 — the AC-024-LOADING-ERROR-PRESERVED text in the ticket at line 337 remains verbatim DEFERRED ("Blocked on Architect design"); PM jumped from step 1 (Architect design delivered) directly to step 3 (QA Round 2 invoked) without executing step 2 (supplement Given/When/Then into AC body). QA cannot testability-review an AC that still reads "Blocked…Architect must deliver…"; the concrete contracts live only in the design doc, not in the AC. Separate issue: Architect's §6.3 introduces DiaryError retry button (line 559 props `onRetry`, line 563 `<button>Retry</button>`) — this is net-new behavior not in the pre-DEFERRED AC scope (original AC only said "沿用既有 UX"); no AC currently asserts retry click → re-fetch → loading-reappears-then-resolves flow, so this behavior ships untested unless PM supplements AC. Third issue: `<DevDiarySection>` on Homepage is stated to "preserve loading/error gates" (§6.2 L473) but no AC specifies Homepage loading/error selectors — only /diary page is contract-covered; Homepage error could silently render nothing and pass all tests.

**Next time improvement:**
1. **Round 2 pre-flight MUST read the AC text itself** — don't assume "PM invoked Round 2" means PM completed all protocol steps. Before boundary sweep, grep the AC section and verify Given/When/Then has been written; if still DEFERRED text, halt Round 2 and return single Challenge ("AC body not supplemented") rather than attempting full review. Codify in `qa.md` Early Consultation: pre-flight check 1 = read target AC body, pre-flight check 2 = verify design doc exists, both must pass before boundary sweep runs.
2. **Cross-scope coverage check for shared components** — when design doc mentions "X preserved" on a route NOT covered by the AC under review (e.g., DevDiarySection Homepage loading/error per §6.2), raise as QA Interception to PM asking whether the un-covered scope needs a parallel AC or explicit Known Gap. Codify in `qa.md` Boundary Sweep: add 8th row "Cross-route coverage — component X exists on routes A and B, AC covers only A; is B in scope or Known Gap?"
3. **Novel-UX-element detection in design doc** — when Architect's design doc introduces a UX element not in the pre-deferred AC text (retry button / auto-retry / anything actionable), QA must raise Interception before PASS. This goes beyond "AC matches design" to "design matches AC+reasonable user expectation"; don't let design-introduced features bypass AC coverage just because design mentions them in prose. Codify in `qa.md` Round 2 checklist: diff the AC pre-DEFERRED-text vs the design doc's component section; every behavior in design not traceable to an AC clause = mandatory Interception.

## 2026-04-22 — K-024 Early Consultation Round 1

**What went well:** Visual-spec.json SSOT pattern caught the PRD line 385 middle-dot vs em-dash drift in cross-check — without JSON to anchor against, this would have reached Engineer and produced a shipped bug. Cross-verified every AC citation against `K-024-visual-spec.json` in a role-by-role table (10 roles / 2 frames: wiDSi + N0WWY); all role references match exactly, no SSOT drift on in-ticket AC. Full 7-type boundary sweep executed (not just "happy path") and found 6 of 7 types had gaps — forced PM to address empty-list / concurrency / special-chars cases before Architect release. Produced 11 concrete Challenges with specific "needs supplementation" wording so PM could Edit the AC directly without re-analysis.

**What went wrong:** 10 of 12 AC (83%) needed supplementation at first review; 6 of 7 boundary types had gaps. Root cause: PM wrote AC against the visual-spec.json citation catchall pattern (good) but did not independently sweep the boundary table or cross-check mobile scope consistency or enumerate empty/concurrency cases. AC-024-LOADING-ERROR-PRESERVED was released for QA review before Architect had defined selectors, creating a circular untestable — had to be deferred as a whole, requiring a QA Round 2 after Architect design lands. Only 1 AC (AC-024-PAGE-HERO) passed cleanly.

**Next time improvement:**
1. PM Phase Gate pre-flight checklist (codify in `pm.md`): before invoking QA Early Consultation, PM must self-run the 7-type boundary sweep table (empty / min-max / special-chars / API-fail / network / concurrency / list-size) and produce a coverage map. Any AC released with obvious empty/concurrency gaps → bounce back without QA cycles.
2. Any AC that references "既有 UX" / "既有機制" / "existing component" without a stable selector must carry a `blocked-on: architect-design` marker and be excluded from Early Consultation Round 1 (review only Architect-dependent AC in a subsequent Round 2). Codify in `pm.md` AC authoring template.
3. Cross-document drift check: when AC text is edited in ticket, PM runs `diff <(grep AC-024-ENTRY-LAYOUT docs/tickets/K-024.md) <(grep AC-024-ENTRY-LAYOUT PRD.md)` — the middle-dot vs em-dash drift would have been caught automatically. Codify as `pm.md` DoD before marking AC revision complete.
4. Visual-spec SSOT cross-check (role-by-role table) must be a standard artifact in every QA Early Consultation report for any UI ticket with a visual-spec.json — codify in `qa.md` Early Consultation section.

## 2026-04-21 — K-013 Round 2 Regression Pass

**做得好：** Round 2 gate 全綠一次過（tsc 0 / vitest 45 / pytest 68 / playwright full 173+1 skipped / K-013 spec 4/4），未停在第一個 fail 就中止；K-013 spec 4 cases（full-set / subset / empty matches / <2 bars fallback）直接對應 AC-013-APPPAGE-E2E 的四態斷言，regression 範圍完整。Visual report 5 route 全部截圖成功，輸出至 `docs/reports/K-013-visual-report.html`。Ticket §Pencil 設計稿檢查明確將本票標為 zero-visual-change exemption，sign-off 未錯誤要求 Pencil frame cross-check。

**沒做好：** 嘗試跑「browser smoke beyond Playwright」以人手操作 /app live stack（實上傳 CSV + Start Prediction）時，發現 file input 並非本 app 的 OHLC 資料入口（按鈕維持 disabled，需透過 official CSV source / 手動 rows 才能觸發），smoke spec 跑 30 秒 timeout。無預先閱讀 AppPage 上傳流程，直接照任務單的步驟 pseudo 化 E2E 操作；雖最後移除了 ad-hoc spec 沒汙染 repo，但浪費了一次時間。

**下次改善：** 未來任何 QA 要寫 "live smoke beyond mocks" 的 one-off spec 前，先 `grep -r "setInputFiles\|file input" frontend/e2e/` 找到現有 happy-path spec 的上傳實作照抄，不自己推理 DOM 入口。若 E2E spec 已完整覆蓋（K-013 spec 就是此例），不應再疊加人手 smoke — 以 spec + visual-report 兩線交付就足夠，並在 QA report 註記「live smoke = K-013 spec + visual-report 替代，pure refactor 不另行人手走查」。

## 2026-04-21 — K-030 /app page isolation (final regression)

**做得好：** Pencil v1 `ap001` frame 於本 session 透過直接讀 `frontend/design/homepage-v1.pen` JSON 確認 `fill: #030712`，對照 dev screenshot `/app` wrapper bg 視覺判讀吻合（同時 Playwright T4 已 assert `rgb(3, 7, 18)`）；mcp__pencil 工具不可用時以 .pen JSON 直讀替代，完成 AC-030-PENCIL-ALIGN 視覺比對。主動為 mobile (375px) + tablet (768px) viewport 補 `/app` isolation 驗證（寫入臨時 spec，執行後刪除），補 persona Boundary Sweep viewport 維度；mobile NavBar App link `target=_blank` 亦確認。

**沒做好：** Full Playwright suite `npx playwright test` 跑時 webServer 不帶 `TICKET_ID` 環境變數，`visual-report.ts` fallback 產出 `K-UNKNOWN-visual-report.html` 汙染 `docs/reports/`。QA 驗到尾端才發現並手動 rm + 補跑 `TICKET_ID=K-030 npx playwright test visual-report.ts`。

**下次改善：** 建議於 `frontend/e2e/visual-report.ts` 加 hard gate — `TICKET_ID` 未設時 `throw new Error('TICKET_ID not set')`，不 fallback K-UNKNOWN；或於 QA persona Step 1 改為「必先 export TICKET_ID=K-XXX 再跑 full suite」硬規則。屬 shared tooling，回報 PM 評估另開 TD 票處理。另發現 `frontend/public/diary.json` 存在繁中 milestone 名稱（違反 feedback_diary_json_english），屬 K-021/K-022/K-023 遺留，與本票 scope 無關，僅備註給 PM 參考。

## 2026-04-21 — K-031 /about 移除 Built by AI showcase section

**做得好：** PM 已預先核定 targeted scope（about-v2 + about + pages 三 spec + 2 route 視覺驗證），QA 不盲目跑 full suite；tsc 0 errors + 95 passed / 1 skipped / 0 failed；獨立 visual spec 直接 evaluate document 的 8 個候選 section id，讀到的順序與 Architect 設計文件 §3 File Change List 的 7 SectionContainer 列完全一致（header → metrics → roles → pillars → tickets → architecture → footer-cta）；homepage banner 點擊 → `/about` SPA 導航一起驗；Pencil `.pen` JSON grep 對 `banner-showcase` / `Built by AI` 零命中，與 codebase parity 對齊。

**沒做好：** 依賴 JSON grep 做 Pencil parity（MCP 目前不可用），無法驗視覺層 — 例如若 .pen 裡殘留空白 frame 或 placeholder rect 但移除了文字 label，單純 text grep 會 false-green。本次是純刪除 ticket，風險可接受，但已登 Known Gap。

**下次改善：** 當 Pencil MCP `get_screenshot` 不可用時，QA Pencil parity 檢查應改為：(1) JSON grep 移除項零命中，(2) JSON top-level frame children count 對照設計文件預期 section 數，(3) 明確在 retrospective 宣告「視覺層未驗（MCP offline）」。已將第三點 codify 到 `~/.claude/agents/qa.md` 的 Mandatory Task Completion Steps 0 之下（若 MCP offline 則明文宣告 + grep fallback 最低門檻）— 下次做此類 ticket 時必照此步驟。


## 2026-04-21 — K-028 Regression Sign-off

**What went well:** Full Playwright suite 186 passed / 1 skipped / 0 failed (1 pre-existing skip is AC-017-BUILD, requires production build, not a regression hole). K-023 regression confirmed: AC-023-DIARY-BULLET (3 markers 20×14 / rgb(156,74,59) / borderRadius 0), AC-023-STEP-HEADER-BAR (STEP 01/02/03 all PASS, Geist Mono 10px + bg charcoal + paper text), AC-023-BODY-PADDING (desktop 72/96/96/96 + mobile 375px 32/24) all PASS post flex-col refactor. K-028 ACs: AC-028-MARKER-COORD-INTEGRITY + AC-028-MARKER-COUNT-INTEGRITY + AC-028-SECTION-SPACING (desktop 1280 + tablet 640/639 breakpoint boundary + mobile 375) + AC-028-DIARY-ENTRY-NO-OVERLAP (desktop + mobile first 3 entries) + AC-028-DIARY-RAIL-VISIBLE + AC-028-DIARY-EMPTY-BOUNDARY (0 entries + 1 entry) all PASS. Footer visibility manual probe at `/` scroll-to-bottom: desktop 1280 footer bbox y=617 visible, mobile 375 footer bbox y=313 visible — KG-028-02 mitigation holds. Visual report generated at `docs/reports/K-028-visual-report.html` with correct TICKET_ID. Pencil frame `4CsvQ` hpBody.gap=72 confirmed matches AC-028-SECTION-SPACING desktop 72px assertion (Architect extraction validated).

**What went wrong:** Stale `K-UNKNOWN-visual-report.html` remains in `docs/reports/` from an earlier run that forgot TICKET_ID env var. Did not auto-clean; noise for PM reviewing report dir. Separately, KG-028-01 (long-word overflow in Summary text on 375px) remains untested as registered Known Gap — no new test case added; boundary behavior is assumption-only.

**Next time improvement:** Before running visual-report, `rm -f docs/reports/K-UNKNOWN-visual-report.html` to prevent stale artifacts from prior TICKET_ID-less runs polluting the dir. Codify in `qa.md` persona: screenshot step explicitly deletes any `K-UNKNOWN-*.html` before running the new report.

## 2026-04-21 — K-028 Early Consultation (AC testability review)

**What went well:** Caught PM frontmatter mis-ruling (`qa-early-consultation: N/A`) that violated the "QA Early Consultation every PRD, not only edge-case AC" rule. Surfaced 5 boundary/regression gaps before Engineer started: tablet breakpoint missing, rail-visible guard buried in Architect doc without an AC, empty / 1-entry / 2-entry diary not explicit in AC, K-023 marker assertions re-run is implicit only, and `data-testid="diary-marker"` DOM-nesting change (marker moves from absolute-child-of-outer-wrapper to child of new entry wrapper) — existing K-023 spec still selects by testid so pass is expected, but bounding-box coordinate space changes need explicit regression confirmation.

**What went wrong:** PM shipped `qa-early-consultation: N/A — reason: all ACs are happy-path layout fix` on the ticket frontmatter. The rule `feedback_qa_early_mandatory.md` explicitly says not limited to edge-case AC; layout ticket still needs QA review because (a) diary.json content mutation is an implicit input domain and (b) any CSS refactor that removes DOM structure (absolute-positioned content wrapper deleted, replaced with `pl-[92px]` padding) risks silent breakage of coordinate-based assertions in existing specs. PM skipped QA; consultation only happened after user flagged the protocol breach.

**Next time improvement:** PM Phase Gate must treat `qa-early-consultation` as mandatory-yes — any "N/A — reason: happy path" value is an automatic violation and the ticket is bounced back. Codify in `pm.md`: the frontmatter field accepts only (a) a reference to a QA Early Consultation report/section, or (b) "skipped by user explicit override — ___". Layout/visual tickets specifically must not claim N/A — layout changes can break existing specs through DOM coordinate shifts even when AC is happy-path.

---

## 2026-04-21 — K-018 GA4 runtime fix regression run

**做得好：** 完整跑滿 175 test (166 passed / 1 skipped / 8 failed)，未在 ga-tracking.spec.ts 第一支 fail 就中止；failure log 直接對應到 spec mock 與 production helper 實作不一致的根因，交付訊息可供 PM 直接裁決。

**沒做好：** K-018 原 sign-off 時接受 `ga-tracking.spec.ts` 的 mock 用 `(...args) => dataLayer.push(args)` 形式，沒注意到此 mock shape 與 production helper 的實作細節耦合；當 production 改回 `arguments` 物件後，spec 的 `Array.isArray(entry)` filter 全部失效，8 個 case 同時 fail。Mock 與被測程式對同一個 global (window.gtag) 的 override 順序、以及 Arguments object vs Array 的差異，K-018 QA 當時未辨識為 boundary。

**下次改善：** 任何 spec 以 `addInitScript` mock 全域 function 時，QA sign-off checklist 需新增一條：「此 mock shape 是否與 production 實作的推送 payload 形狀一致？若 production 改寫同一 global 會覆蓋 mock 嗎？」若兩者對同一變數 override，必須列為 Known Gap 或要求 Engineer 改用 spy 而非 replace。

## 2026-04-21 — K-023（Homepage 結構細節對齊 v2）

**做得好：** 175 tests 全套跑完 174 pass / 1 skip / 0 fail；skip（AC-017-BUILD）為已知設計排除（需 production build），非回歸失漏；TICKET_ID=K-023 帶入正確執行，產出 `K-023-visual-report.html`；AC-023-DIARY-BULLET（width/height/backgroundColor/borderRadius，3 markers）、AC-023-STEP-HEADER-BAR（STEP 01/02/03 各自獨立 3 test，含 fontFamily Geist Mono 斷言）、AC-023-BODY-PADDING（desktop 72px/96px + mobile 375px 32px/24px）、AC-023-REGRESSION（Banner DOM-order compareDocumentPosition + diary markers 存在 + diary link）全部 PASS；K-017 / K-021 / K-022 / AC-HOME-1 / NavBar / DiaryPage 完整回歸無任何破壞。

**沒做好：** KG-023-04（640px breakpoint boundary test，639px vs 640px）Ticket 明定「QA adds at sign-off」，但 QA 角色定義僅能回報，不能寫 spec；此邊界場景實際上未被任何 test case 覆蓋，sign-off 時未主動將此 Known Gap 升級為 PM interception，而只留在 ticket 記錄中。

**下次改善：** Ticket 記載「QA adds at sign-off」的 Known Gap，QA sign-off 時必須明確向 PM 聲明「此邊界未覆蓋，需 Engineer 補 spec 或 PM 正式裁決降為 Known Gap」，不得以「已在 ticket 記載」為由跳過正式 Interception 流程。

## 2026-04-21 — K-022（/about 結構細節對齊 v2）

**做得好：** 165 tests 全套跑完 164 pass / 1 skip / 0 fail，skip（AC-017-BUILD）為已知設計排除（需 production build），非回歸失漏；visual report 正確帶 `TICKET_ID=K-022` 執行，產出 `K-022-visual-report.html`，K-027 反省改善已落地；AC-017-HEADER / METRICS / ROLES / PILLARS / TICKETS / ARCH / FOOTER 全部仍 PASS，I-1 fix（PillarCard overflow-hidden 移除）無破壞。

**沒做好：** I-1 fix 移除 overflow-hidden 屬性後，未補「長文字溢出」邊界場景的 Playwright spec；現有斷言只能確認結構存在，無法保護未來 PillarCard 文字過長時的 layout 完整性。

**下次改善：** Engineer fix 涉及移除 overflow / layout guard 屬性時，QA 須主動補一條 boundary spec（e.g., 注入長文字 prop 確認容器不崩），不能只靠結構斷言通過就放行。

## 2026-04-21 — K-027（DiaryPage 手機版 milestone timeline 視覺重疊修復）

**沒做好：**
- TC-001~003（NO-OVERLAP）僅覆蓋「全折疊」與「全展開」兩個端點，未測試 accordion 中間態（奇偶交叉展開），而中間態正是原始 bug 的高發場景。
- Mobile viewport 測試覆蓋 375 / 390 / 414px，但 AC 明定「≤ 480px 全部 breakpoint」；430px（iPhone 14 Pro Max）與 480px 邊界值未被任何獨立 TC 覆蓋。
- visual report 執行未帶 `TICKET_ID=K-027` 環境變數，產出檔名為 `K-UNKNOWN-visual-report.html`；K-017 retro 已記錄此改善點，本次仍未落地，屬重複失誤。
- `assertLastCardVisible` 的 scroll-to-bottom 可見性未作目視或 `toBeInViewport()` 輔助驗證，僅依賴 bounding box 斷言通過，實測路徑存在盲點。

**下次改善：**
1. **截圖 script TICKET_ID 強制格式**：執行步驟改為 `TICKET_ID=<ticket-id> npx playwright test visual-report.ts`，不允許省略 — 已同步更新 qa.md persona 步驟為硬 gate。
2. **Accordion 中間態測試**：凡有 accordion/collapse 的頁面，NO-OVERLAP 類斷言必須額外加一輪「奇偶交叉展開」場景（展開奇數索引、折疊偶數索引）。
3. **Viewport 邊界補點**：AC 定義「≤ X px」時，QA 必須在標準三種 viewport 之外加測 X px 邊界值本身（本票應補 480px TC）。
4. **Scroll 可見性獨立實測**：scroll-to-bottom 類斷言修正後，QA 須另開 browser session 以目視或 `toBeInViewport()` 補充驗證。

## 2026-04-20 — K-021 Round 4（`/about` readability re-verify）

**做得好：** Round 3 挑出的 10 處 white-on-paper 疑慮在 Round 4 寫了直接針對 CSS token 的 computed-color 探針（11 處 selector 對 `rgb(26, 24, 20)` 斷言 + 9 處 pillar/arch/ticket-anatomy 延伸），11 主 + 9 延伸 = 20/20 全 pass，證據與 K-017 baseline 無關、直接綁 `ink` token 語意；另外加一道 paper-bg 感知的 white-leaf 全頁掃描（對 `/about` 回 0 筆、對 `/`, `/diary`, `/app`, `/business-logic` 各回 0 筆），回歸證據不止針對 Round 3 舉證的 10 處，而是「整頁再無白字殘留」；regression 三件套自跑（tsc exit 0 / build 所有 chunk < 500kB，最大 vendor-react 179kB gzip 58kB / Playwright 115 passed + 1 skipped），不以 Engineer 自述為憑；visual-report 以 `TICKET_ID=K-021 npx playwright test --project=visual-report` 覆寫 Round 3 報告，檔案 timestamp 與 size 驗證確認寫入成功。

**沒做好：** Round 4 是 narrow re-verify，但 probe script 起手時 import 寫成 `from 'playwright'`（套件只有 `@playwright/test`），第一次執行 ERR_MODULE_NOT_FOUND，多跑一次；為了不污染 E2E suite，把探針放在 `e2e/_k021-round4-*.mjs` 並依賴 playwright config 的 `testMatch: /.*\.spec\.ts$/` 篩掉，但「命名以 `_` 開頭 + `.mjs` 副檔名 + 非 spec」三重保險這層規則沒先寫在探針檔頭註解，之後同事看到可能誤會是遺漏的 spec。

**下次改善：** (1) `/frontend` 下 ad-hoc Playwright 探針統一 `import { chromium } from '@playwright/test'`，新增 `_k*.mjs` template 註解首行標註「非 spec，不被 testMatch 收斂，執行完 rm」；(2) Round N re-verify 類任務，QA retro 標題明確加 `Round N (<focus>)`，與原始 ticket retro 區隔閱讀路徑，避免後續翻閱者混淆範圍。

## 2026-04-20 — K-021

**做得好：** 自動化三件套（tsc exit 0 / build 無 chunk warning / Playwright 115 passed + 1 skipped）一次通過並逐項記錄具體數字（最大 chunk vendor-react 179kB，gzip 58kB），非只標 PASS；5 路由視覺檢查不依賴肉眼，以臨時 Playwright spec 逐頁 evaluate 出 body bg / color / heading fontFamily / footer fontFamily 等數值，再與 AC 原始 rgb 斷言並對；`/about` readability 疑慮不以肉眼判斷，撰寫 readability 探針（讀 hero h1 / metric cards / h2/h3 headings 的 computed color）取得 `rgb(255, 255, 255)` 白字出現於 paper bg 的客觀證據，再對照 K-017 baseline（extract K-017-visual-report.html 的 base64 還原 /tmp/k017-about.png）逐幅肉眼比對；NavBar 疑似 hex leak 先以 `outerHTML` regex 偵測，再寫第二版探針區分「inline style vs className literal」，避免錯判 TD-K021-02 允許的 `text-[#9C4A3B]` 為 regression；結束前以 `rm e2e/_tmp-*.spec.ts` 清除所有臨時 spec，避免污染 repo。

**沒做好：** readability 探針一開始沒把 `/about` 排為優先核心——先跑「6 routes 通用截圖 + 色值抽樣」才發現異常，多跑一輪探針；臨時 spec 建立時沒先看 `playwright.config.ts` 的 `testDir: './e2e'`，第一次放 `/tmp/` 啟動失敗才改放 `e2e/_tmp-*.spec.ts`，浪費一次 run；Reviewer 2 條件之一「`/about` 與 K-017 baseline 對比 → 判斷是 K-022 regression 還是立即修」QA 視為「回報事實給 PM 裁決」而非自己下判斷，但沒在 retrospective 明確標示「技術證據已收集完整，裁決在 PM」的邊界角色。

**下次改善：** (1) 視覺全面改版類 ticket（K-021 此類 design system rebuild）QA 視覺 audit step 先讀 ticket §Scope 與 §Tech Debt 列出「本票遷移 vs 未遷移」範圍，**優先針對「未遷移但受波及」路由做 readability 探針**，不倚賴均勻抽樣；(2) 臨時 Playwright spec 一律直接建在 `e2e/_tmp-<task>.spec.ts`，並在結束前 `rm` + `ls` 驗證清除，不走 `/tmp/` 導致 testDir 不覆蓋；(3) QA retro 明確分段「客觀數據」vs「PM 裁決題」，前者 QA 負責，後者只陳述證據不下結論，避免角色越權。

## 2026-04-19 — K-018

**做得好：** ga-tracking.spec.ts 12/12 全綠逐一目視確認（AC-018-INSTALL × 1、AC-018-PAGEVIEW × 4、AC-018-CLICK × 4、AC-018-PRIVACY × 1、AC-018-PRIVACY-POLICY × 2），與 ticket AC 清單逐條對齊；`TICKET_ID=K-018` 環境變數本次記得帶，產出正確命名的 `K-018-visual-report.html`（K-017 反省的改善行動已落地）；全套 99 passed / 1 skipped，skipped 條目屬已知問題，正確標注不 block。

**沒做好：** `waitForFunction` 取代 `waitForTimeout` 的修復屬 E2E 穩定性改善，QA 未獨立驗證「舊版確實存在 flaky 風險」——只依賴 Engineer retro 自述，未執行 `--repeat-each` 確認新版不 flaky；「`/business-logic` 不在追蹤範圍」的設計理由沒有在 QA retro 中明記，後續若有 coverage 疑問需翻 ticket 才能找到依據。

**下次改善：** (1) E2E timeout 改善類修復，QA 須執行 `npx playwright test <spec> --repeat-each=5` 驗證穩定性，不全然依賴 Engineer 自述；(2) 「刻意不追蹤/跳過」的路由或功能，QA retro 明記排除理由，作為後續 coverage 問題的第一線文件依據。

---

## 2026-04-19 — K-017

**沒做好：** 執行 visual report script 時未帶 `TICKET_ID=K-017` 環境變數，導致產出為 `K-UNKNOWN-visual-report.html`；AC-017-BUILD（prebuild hook）因 dev mode skip 而未補 build-mode 手動驗證；AC-017-AUDIT（audit-ticket.sh）屬 shell script 不被 Playwright 覆蓋，但 QA 未主動手動執行 K-002/K-008/K-999 三個情境逐條確認 AC。
**下次改善：** (1) 截圖 script 執行前固定確認 `TICKET_ID` 已設；(2) 含 build artifact 依賴的 AC，QA 額外執行 `npm run build` 確認 artifact 存在；(3) Shell script / CLI tool 類 AC，QA 主動手動執行所有情境，不以 Playwright skip 代替驗證。

---

## 2026-04-18 — K-008 QA 驗收反省

**做得好：** 6 步回歸不只機械執行，在 Step 3 HTML 產出後主動補跑「結構抽樣」驗證（`grep -c 'class="page-section'` = 5、`grep -o 'data:image/png;base64' \| wc -l` = 4、`grep -A1 'class="route"'` 列 5 條 `<code>` 路由標記），把 AC-008-CONTENT 條文「每張截圖有對應的 route path 標記」從「Engineer 自述」升級為「QA 獨立驗證」。Step 6 也額外執行 `git check-ignore -v` 確認 `.gitignore:32` rule 精確命中、無 overreach，不只看 `status` 輸出有無目標檔。

**沒做好：** W4 whitelist 的 negative path 只驗 PM prompt 指定的 `../../etc/passwd` 一個 payload；QA 應自備邊界清單（空字串、純空白、尾空白、`K-` 大小寫、Unicode、overflow 長度）主動擴展驗證面，但這次沒做。另外 `.gitignore` rule overreach 只做 `docs/reports/*.html` 單 rule 抽樣，未對 `dist/`、`coverage/`、`node_modules/` 內常見產物目錄各抽 1 sample 跑 `check-ignore` 確認未誤傷。HTML size 驗證僅比 `>500KB` / `<10MB` 門檻，若未來產物結構大幅異常（例：24 張截圖擠成 1 MB，或某條 route 變空），size 仍會落在範圍內，size 不足以當 structural invariant。

**下次改善：**
1. **邊界 payload 清單固定化** — QA 自備 fixed checklist（空字串、純空白、尾空白、大小寫、Unicode、overflow 長度）隨任何 env var / CLI 輸入 ticket 一起跑，不等 Reviewer / PM 在 prompt 列 payload。
2. **gitignore 跨產物 sample 檢查** — 凡修改 `.gitignore`，QA 對 repo 內常見產物目錄（`dist/`、`coverage/`、`node_modules/`、`docs/`）各抽 1 個 sample 檔案跑 `git check-ignore -v`，確認 rule 精確，不靠「只看目標檔是否被 ignore」單點判斷。
3. **Artifact 內容抽樣作為 invariant** — HTML / JSON artifact 不只看 size；每種 artifact 定義 1~3 個結構 grep 作為 AC 的 operational invariant（本票 `<section>` 數、base64 圖數、route 標記清單），寫進 QA 驗收章節當證據，不靠 Engineer 自述。

---

## 2026-04-18 — K-011（LoadingSpinner label prop 回歸測試）

**做得好：** 三層驗證（tsc exit 0 / Vitest 36 pass / Playwright 45/45）全程實跑並 tail 輸出驗證精確數字，未沿用 Reviewer 段落 relay；主動 Read `agent-context/architecture.md:139` 確認 Drift A 已由 Engineer 補完，不假設「PM 裁決 = 已執行」。補執行「獨立 grep `Running prediction` 於 `frontend/` 全樹」作為雙重驗證，確認 `frontend/e2e/` 無任何斷言依賴、`PredictButton.test.tsx:24` 為唯一依賴點、`homepage.pen:4825` 為 TD-011 已登記項，無漏網。

**沒做好：** `LoadingSpinner` 本身沒有 unit test（現存 test 都走上層 PredictButton / AppPage 間接覆蓋），對 `label` 的 falsy 邊界（空字串 `""`、`undefined`、極長字串）與 `aria-label` fallback（`label ?? 'Loading'`）未有直接斷言；若未來新 callsite 誤傳空字串，行為是「不渲染 `<p>` 且 `aria-label` 走 fallback」，本票無測試攔截此情境。此外，未主動在 retrospective 中將這些邊界列成「K-011 未覆蓋」的 follow-up 清單交 PM 評估是否需要補 unit test。

**下次改善：** (1) 共用 UI 組件「新增 prop」類 ticket，QA 必主動列「新 callsite 的邊界條件」（falsy 值、極長字串、RTL / emoji）給 PM 評估是否補 unit test；即使 PM 判定非 scope，也要在 retrospective 明記「這些邊界未覆蓋」供未來 bug 溯源。(2) 沿用 Reviewer grep 結論前，自己跑一次獨立 grep（`frontend/e2e/ frontend/src/__tests__/ frontend/src/`），把 Reviewer 的結論當 hypothesis 而非 fact，發出 PASS 前必有 QA 自行 grep 紀錄。

## 2026-04-18 — K-009（1H MA history fix 回歸測試）

**做得好：** 實跑 `python3 -m pytest` 取得完整 63 passed 數字，並與 ticket AC-009-REGRESSION 基準（18 + 44 = 62 + 新增 1 = 63）逐項 cross-check 對齊；同步跑 `py_compile` 雙檔確認無語法/縮排漏網。跳過 Playwright 的決策明確寫進報告並附理由（無前端 diff、無 UI surface），不用「沒時間」含糊帶過。

**沒做好：** 未執行單點驗證「移除 fix 後 test 會失敗」—— 雖然 Reviewer 已實跑 `git stash` 驗過（ticket Reviewer 段有記錄），但 QA 層面未再獨立覆核，純粹 relay Reviewer 結論；若 Reviewer 記錄本身有誤（此次無，但流程上不應假設），QA 等於失守。此外，S1 技術債（predictor 層靜默 fallback）已開 K-015，但 QA 未主動列出「未來新增 `find_top_matches()` caller 時，測試需攔截此類 regression」的邊界條件清單給 PM。

**下次改善：** (1) 後端 bug fix 類 ticket，QA 必須獨立執行「reverse-fix → test fail → restore fix → test pass」一輪小驗證，不全然依賴 Reviewer 段落；(2) 看到「技術債已開票」的裁決時，QA 主動在 retrospective 註記該 follow-up 需要的 regression 測試覆蓋點（例如：K-015 解掉時必須附「新 caller 忘記傳 ma_history」的 predictor 層 assert test），避免技術債修復時又踩相同坑。

## 2026-04-18 — K-010（Vitest AppPage 修復）

**做得好：** 三重回歸（Vitest 36/36、tsc exit 0、Playwright 45/45）全程實跑並 tail 輸出確認數字，不信 Implementation log；額外 grep `chart-timeframe-` 比對 testid 在 E2E 是否被依賴，釐清本次 DOM 改動的 blast radius 只在 Vitest，E2E 無回歸風險。

**沒做好：** 未跑 Vitest coverage 確認 Engineer 是否意外讓既有 test skip 或改判（只看 pass 數無法偵測「斷言被削弱」），本次靠 review 手動檢查 test diff 間接證明，程序上有漏洞；截圖 script 仍缺（K-008 未實作 cycle #6），本次跳過但流程定義上 QA 尾段是缺的。

**下次改善：** (1) 日後 Vitest 涉及改寫斷言的 ticket，QA 必加跑 `npm test -- --run --coverage` 比對 coverage diff（或至少 read 改動的 test 原/新 diff）再聲明 PASS；(2) 在 K-008 實作前，QA 的「截圖報告」欄位採固定「跳過（K-008 未完成）」而不逕自聲稱流程完整，避免 PM 誤解。

## 2026-04-27 — K-052 Phase 5 Sign-off

**What went well:** AC-K052-14 drift tests (both cases) passed cleanly; sacred-registry 6+1 count correct; lessonsCodified count matched local (173=173).
**What went wrong:** AC-K052-15 and AC-K052-17 persona patches (designer.md + pm.md) were not applied before Phase 5 QA — design doc §15/§17 specified "PM persona owner applies," but no commit evidence found; 2 pre-existing E2E failures (pages.spec.ts AC-023-DIARY-BULLET, shared-components.spec.ts footer snapshot) not K-052-introduced but unresolved; processRules schema gap (missing `lastReviewed`/`docHref`, extra `aboutSlots`/`homeSlots`/`ticketAnchor`) diverges from AC-K052-01 §5.3 spec.
**Next time improvement:** Persona-patch ACs must have an explicit "applied-by" owner assigned in ticket frontmatter before Phase 5 dispatch; QA should block sign-off when Reviewer-gate items have no confirmed applier.
