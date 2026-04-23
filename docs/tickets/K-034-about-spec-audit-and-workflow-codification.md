---
id: K-034
title: /about spec audit + sitewide design-workflow codification (absorbs K-035 footer-drift hotfix + BFP Round 2)
status: open
phase: 0
type: fix + process
priority: high
visual-delta: yes
qa-early-consultation: docs/retrospectives/qa.md 2026-04-23 K-034
design-locked: false
created: 2026-04-23
depends-on: []
supersedes: K-037 (would-be /about footer re-hotfix, absorbed into Phase 1)
related: K-017, K-021, K-022, K-035 (root BFP ticket whose α-premise is retired here)
---

## 0. One-Line Summary

K-035 closed with a `variant` prop Footer that Option α declared "Pencil-fidelity 10/10". Post-deploy Pencil `batch_get` on frames `86psQ` (/about footer, v2.pen) and `1BGtd` (/home footer, v2.pen) shows **both frames contain one identical text node: `yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn` in Geist Mono 11px**. The α-premise ("two intentionally-different Pencil designs") is false; Pencil SSOT has ONE footer, not two. K-035's implementation therefore violates SSOT. This ticket runs Bug Found Protocol Round 2 (6 roles + meta retrospective), codifies a new `.pen`-SSOT-via-JSON workflow across 6 personas + 9 memory files, then hotfixes /about to render the inline one-liner (Phase 1), then full /about audit (Phase 2+).

---

## 1. Background — What K-035 got wrong (root cause record)

### 1.1 User-observable symptom
Production `/about` footer still renders the "Let's talk →" CTA + email/GitHub/LinkedIn anchors block. User reports: "this is not what Pencil shows for /about". Live bundle `index-CtxpPhIH.js` is the correct K-035 artifact; code at `frontend/src/pages/AboutPage.tsx:72` is `<Footer variant="about" />`; K-035 deploy was not miscarried.

### 1.2 Pencil ground truth (2026-04-23 main-session batch_get)
- Frame `86psQ` (homepage-v2.pen): contains a single text node `yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn`, Geist Mono 11px.
- Frame `1BGtd` (homepage-v2.pen): contains a single text node `yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn`, Geist Mono 11px.
- Visual: both frames render as byte-identical inline one-liners. **One design, two frame IDs** (duplicated for layout composition, not divergence).

### 1.3 K-035 Architect's false premise
`docs/designs/K-035-shared-component-migration.md` §0 BQ-035-01 scoring matrix declared "Pencil fidelity: α=10, β=10, γ=0" with rationale "Option α preserves both frames 4CsvQ + 35VCj — both render their own designs". The "both their own designs" predicate is **empirically false** — both Pencil frames contain the same inline one-liner. Architect did not `batch_get` the two frames to verify content parity before scoring.

### 1.4 Correct ruling (user verdict, 2026-04-23)
γ (unify content sitewide, delete one) was the correct choice. /about must render the inline one-liner, same as /. `variant` prop must be retired. The old "Let's talk →" CTA block is not Pencil-backed and must be deleted.

### 1.5 Why 6 roles missed it (BFP Round 2 scope — each role writes own retrospective)
| Role | Miss | Why their existing gate didn't catch |
|------|------|--------------------------------------|
| Architect | Did not `batch_get` frames 4CsvQ/35VCj before scoring Pencil fidelity | No persona rule required content-parity verification before option scoring; only "list frames in frontmatter" gate was active |
| Designer | Did not flag that `frame 35VCj footer subtree` was content-identical to `frame 4CsvQ` | No rule required cross-frame content-diff when two frames share a named subtree |
| Engineer | Implemented `variant="about"` CTA branch from design doc without verifying Pencil content | No Step 0 gate required reading Pencil source (JSON snapshot did not exist as deliverable) |
| Reviewer | Step 2 depth pass cross-checked DOM-equivalence modulo variant, but the variant itself was never cross-checked against Pencil | No rule required "variants declared in code must correspond to actual Pencil divergence" |
| QA | `shared-components.spec.ts` asserted DOM-equivalence with `variant` as declared divergence axis — spec was internally consistent but had no Pencil tie-back | No rule required Playwright shared-component spec to baseline against Pencil `get_screenshot` |
| PM | Phase Gate released α without requiring Architect Pencil-screenshot evidence; accepted scoring matrix on its own terms | `feedback_pm_visual_verification.md` existed but only checked design-doc-vs-implementation, not design-doc-vs-Pencil |

BFP Round 2 must: (a) each role writes their own retrospective with root cause + structural gate proposal; (b) a meta retrospective documents that Round-1 BFP (the K-035 ticket itself) had no Pencil-content-parity requirement and therefore could not have caught this class of bug.

---

## 2. Goals / Non-Goals

### Goals
1. **New sitewide design workflow codified across 6 personas + 9 memory files, in one Phase 0 commit pair.**
2. **`frontend/design/specs/*.json` + `frontend/design/screenshots/*.png` as git-tracked SSOT mirror of `.pen` files** — Designer is authority; other roles read JSON/PNG, not Pencil MCP directly.
3. **Hotfix /about footer to Pencil-matching inline one-liner** (Phase 1), delete `variant: 'about'` branch + CTA text entirely.
4. **Full /about visual-audit** in Phase 2, comparing per-section DOM against Pencil JSON dump.
5. **BFP Round 2 retrospectives** — 6 role files + 1 new `retrospective-meta.md` anchor.
6. **Ticket frontmatter gains `visual-delta: none|yes` field** — `none` tickets skip Designer; `yes` tickets cannot.

### Non-Goals
1. Redesign of /about content (Phase 2 may reshape per drift but not invent new sections).
2. NavBar / Hero / Banner shared-component migration (opportunistic only if drift found in Phase 2 audit).
3. /app or /diary footer changes (K-024 / K-030 isolation preserved).
4. Changes to the existing K-035 ticket record (history preserved; retiree marker added in §4 Closed Tickets of PRD).

---

## 3. User-directed Decision Table (17 decisions, 2026-04-23 walk-through)

This table is the authoritative source for all downstream role rules. Every persona edit and memory file in Phase 0 maps back to one cell here.

| # | Topic | Decision | Rationale |
|---|-------|----------|-----------|
| Q1 | SSOT architecture | **C** — `.pen` is SSOT; Designer exports key-property JSON snapshot into `docs/designs/K-XXX-*.md` AND full frame JSON dump into `frontend/design/specs/<page>.frame-<id>.json` (git-tracked) | "MCP 花太多時間了，每個人員都讀不符合效益。必須確保設計師有修改 .pen 時，一定有更新 json 檔" |
| Q2 | Footer drift handling | **C** — roll the /about footer hotfix into K-034 (not a separate K-037) | Phase 0 codifies workflow; Phase 1 does the hotfix using that workflow as first real exercise |
| Q3 | Ticket ordering | **A** — K-034 first, K-036 blocked until K-034 closed | K-036 would otherwise ship before the new workflow gates exist |
| Q4a | Roles with hard-gate on design-spec read | Designer + Engineer + Reviewer | PM/Architect/QA use the spec but not as persona-level hard gate (they gate on upstream artifacts) |
| Q4b | JSON granularity | **3** — key properties (fontFamily, fontSize, content, spacing, color, layout-direction, padding, gap) in design doc; complete frame JSON dump in `frontend/design/specs/` | Level 1 (content-only) too weak; level 2 (properties-only) misses layout; level 3 covers both human-readability in doc + machine-verification in JSON |
| Q5a | Visual verification method | **3** — mixed: shared components (Footer/NavBar/BuiltByAIBanner) get Playwright `toMatchSnapshot()`; page-level visuals human-eye | Full snapshot for everything = noisy test maintenance; zero snapshot = drift re-emerges |
| Q5b | Pencil screenshot storage | **2** — Designer runs `get_screenshot` → PNG to `frontend/design/screenshots/<page>-<frameid>.png` (git-tracked); design doc references the PNGs | Git-tracked so Reviewer/QA can cross-check offline; PNG small enough vs `.pen` binary |
| Q5c | Visual-acceptance responsibility | **3** — Designer delivers side-by-side (Pencil PNG + implementation screenshot) as single PNG; PM/QA judge directly | PM/QA do not need to independently capture; Designer owns authorship of the evidence |
| Q6a | "Design locked" trigger | **2** — Designer delivers (.pen + JSON snapshot + specs JSON + screenshots PNG + side-by-side) → **PM sign-off** on visual → design locked | Architect cannot start until lock; prevents Architect designing against in-flux Pencil |
| Q6b | `.pen` mutation authority post-lock | **3** — any `.pen` change goes through Designer; Engineer has zero self-judgment space (not even 2px padding); implementation blocker → BQ → PM → Designer | Parallel to AC being PM-only; prevents drift at implementation time |
| Q6c | AC vs `.pen` conflict | **Escalate to user** — PM does not pick a side unilaterally when AC text and `.pen` contradict on font/content/spacing | Both are SSOT-authorship-locked; conflict is product-decision not technical-ambiguity |
| Q7a | Routes without Pencil frame (e.g. /app) | **2** — design doc lists explicitly under "intentionally no design" exemption table | Current state (K-030 /app isolation) is valid but implicit; make it explicit |
| Q7b | Behavior-only changes (no visual delta) | **3** — ticket frontmatter `visual-delta: none|yes`; `none` tickets skip Designer entirely | Avoids forcing Designer turn on `target="_blank"`-class tickets |
| Q7c | New feature where `.pen` not drawn | **1** — Architect **forbidden** from producing design doc without corresponding Pencil frames; PM pushes back to Designer first | No parallel/logic-first Architect; prevents "design catches up" anti-pattern |
| Q8a | BFP Round 2 retrospective scope | **3** — all 6 delivery roles (Architect, Designer, Engineer, Reviewer, QA, PM) + new `docs/retrospectives/retrospective-meta.md` | Engineer included even though user said "5 roles" — Engineer had Step 0 catch-point via design doc read |
| Q8b | BFP vs PRD/AC sequence | **3** — Phase 0 bundles PRD + retrospectives + personas + memory + infrastructure as single sub-plan; Phase 0 exit requires all done before Phase 1 | Prevents partial codification; prevents hotfix shipping before workflow exists |
| Q8c | Codify scope | **1** — all 17 decisions codified into personas + memory at once during Phase 0 | No phased/partial; one coherent rule set |

---

## 4. Phase Plan

### Phase 0 — BFP Round 2 + workflow codification (PRD + retrospectives + personas + memory + infra)

**Deliverables (all must land before Phase 1 starts):**

1. This ticket file (K-034-about-spec-audit-and-workflow-codification.md) with complete PRD.
2. `qa-early-consultation` field populated — QA agent invoked for edge-case challenge round on the new workflow itself.
3. `docs/retrospectives/retrospective-meta.md` created with Round-1-missed → mechanism-insufficient → Round-2-structural-change narrative.
4. `docs/retrospectives/architect.md`, `designer.md`, `engineer.md`, `reviewer.md`, `qa.md`, `pm.md` each **prepended** with one entry specifically about K-035 α-premise failure (root cause + persona-level hard-gate proposal).
5. 6 persona files Edited at `claude-config/agents/`:
   - `designer.md` — `.pen`-Edit-triggers-4-artifact-update hard gate; `batch_get` self-diff post-Edit; deliver side-by-side PNG.
   - `engineer.md` — Step 0 read design-doc JSON snapshot + `frontend/design/specs/*.json`; zero `.pen` mutation authority.
   - `reviewer.md` — Step 2 Pencil-parity sub-step; variants in code must correspond to Pencil divergence.
   - `senior-architect.md` — no design doc without Pencil frames (Q7c); Pre-Design Pencil audit with content parity across same-named sub-trees.
   - `pm.md` — Q6a sign-off = design-locked; Q6c AC-vs-Pencil escalate-to-user; `visual-delta` frontmatter field required; Phase Gate design-spec-sync check; retire `feedback_pm_visual_verification.md` JSON-only guardrail.
   - `qa.md` — Q5a shared-components `toMatchSnapshot()`; Q5c cross-check Pencil-PNG vs dev-server-PNG.
6. 9 memory files at `/Users/yclee/.claude/projects/-Users-yclee-Diary/memory/`:
   - `feedback_pencil_ssot_json_snapshot.md` (Q1)
   - `feedback_designer_json_sync_hard_gate.md` (Designer side)
   - `feedback_architect_no_design_without_pencil.md` (Q7c)
   - `feedback_engineer_design_spec_read_gate.md` (Engineer Step 0)
   - `feedback_reviewer_pencil_parity_gate.md` (Reviewer Step 2)
   - `feedback_pm_design_lock_sign_off.md` (Q6a)
   - `feedback_pm_ac_pen_conflict_escalate.md` (Q6c)
   - `feedback_ticket_visual_delta_field.md` (Q7b)
   - `feedback_bfp_round2_meta_lesson.md` (Round-N escalation mechanism)
   MEMORY.md index updated with 1-line entry per new file.
7. Infrastructure:
   - `frontend/design/specs/` directory + `README.md` (schema + filename convention).
   - `frontend/design/screenshots/` directory + `README.md` (PNG naming: `<page>-<frameid>.png` and `<page>-<frameid>-side-by-side.png`).
   - `docs/designs/design-exemptions.md` seeded with `/app` route (K-030 isolation).
   - `docs/designs/shared-components-inventory.md` MVP (Footer + UnifiedNavBar + BuiltByAIBanner × consuming routes + allowed-variant=0; per AC-034-P0-SHARED-CHROME-INVENTORY / QA Q5 ruling).
   - `docs/tech-debt.md` appended with TD-K034-01 ~ TD-K034-07 (QA Early Consultation deferrals).
8. Commits (file-class split per `feedback_separate_commits`):
   - Commit A: `ClaudeCodeProject/K-Line-Prediction/**` (this ticket + PRD + retrospectives + infra dirs + exemption doc) — docs-only gate.
   - Commit B: `claude-config/agents/**` + `claude-config/memory/**` (6 personas + 9 memory files + MEMORY.md index) — no gate per file-class table.
   - Both commits mirrored to outer Diary repo per `reference_diary_kline_dual_tracking.md`.

**AC for Phase 0:**

#### AC-034-P0-PRD — This PRD exists with 17-decision table
- **Given** this ticket file exists at `docs/tickets/K-034-about-spec-audit-and-workflow-codification.md`
- **When** a reader opens the file
- **Then** §3 contains the 17-decision table with all Q1–Q8c rows populated
- **And** §4 Phase Plan lists Phase 0 / 1 / 2 deliverables
- **And** frontmatter contains `visual-delta: yes` and `qa-early-consultation:` pointing to the filled QA entry

#### AC-034-P0-QA — QA Early Consultation landed
- **Given** QA agent invoked on this ticket
- **When** QA writes challenges
- **Then** `docs/retrospectives/qa.md` has a new dated entry for K-034 Phase 0 listing ≥3 challenges on the new workflow (e.g. "what happens when `.pen` is edited but JSON not regenerated" / "how to detect a missing `frontend/design/specs/*.json` file in CI" / "what regression gate catches Designer shipping a PNG that doesn't match Pencil")
- **And** each challenge has a PM ruling (supplement AC / declare Known Gap) recorded inline
- **And** this ticket's frontmatter `qa-early-consultation` field points to the date+ticket-id of that retrospectives/qa.md entry

#### AC-034-P0-RETROS — 6 role retrospectives + 1 meta retrospective prepended
- **Given** each role agent (architect/designer/engineer/reviewer/qa/pm) invoked with the K-035 α-premise scope
- **When** they write retrospectives
- **Then** each `docs/retrospectives/<role>.md` has a new top entry dated 2026-04-23 naming K-034 (or K-035 α-premise) as topic
- **And** each entry contains root cause (file:line or decision point) + why existing persona gate didn't catch + ≥1 concrete new gate
- **And** `docs/retrospectives/retrospective-meta.md` exists with Round-1-missed → Mechanism-insufficient → Round-2-structural-change narrative

#### AC-034-P0-PERSONAS — 6 persona files Edited
- **Given** persona files at `claude-config/agents/`
- **When** `git diff claude-config/agents/` is inspected
- **Then** designer.md, engineer.md, reviewer.md, senior-architect.md, pm.md, qa.md all show Edits covering their assigned decision cells (§4 Phase 0 deliverable 5)
- **And** Edits are explicit "hard gate" / "mandatory" phrasing (not descriptive)
- **And** each persona edit cross-links to the corresponding memory file

#### AC-034-P0-MEMORY — 9 memory files written + MEMORY.md index updated
- **Given** memory dir `/Users/yclee/.claude/projects/-Users-yclee-Diary/memory/`
- **When** `ls` on the dir
- **Then** all 9 listed filenames in §4 Phase 0 deliverable 6 exist
- **And** each file has frontmatter `last-verified: 2026-04-23`
- **And** MEMORY.md index has 9 new lines (newest first or grouped) linking each file

#### AC-034-P0-INFRA — Infrastructure scaffolding present
- **Given** `frontend/design/`
- **When** `ls` on subdirectories
- **Then** `specs/` and `screenshots/` both exist with `README.md`
- **And** each README documents its schema / filename convention
- **And** `docs/designs/design-exemptions.md` exists listing `/app` under "intentionally no design"

#### AC-034-P0-COMMITS — 2 commits landed, file-class split
- **Given** git log for this ticket window
- **When** reading commit history
- **Then** there is a docs-only commit covering K-Line-Prediction tree changes and a separate claude-config commit for agents+memory
- **And** `git diff --cached --name-only` at each commit time was filtered to that commit's scope only (per commit-hygiene rule)
- **And** outer Diary mirror commit follows for each (dual-repo rule)

#### AC-034-P0-DRIFT-GATE — .pen ↔ specs JSON drift detection (Q1 ruling, doc-level)
- **Given** `frontend/design/specs/` contains exported frame JSON files
- **When** any commit touches `frontend/design/*.pen` or `frontend/design/specs/*.json`
- **Then** each `specs/*.json` file must carry top-level keys `pen-file: <relative-path>`, `pen-mtime-at-export: <ISO-8601>`, `exporter-version: <semver>`
- **And** Designer persona (§Frame Artifact Export) enforces this on every `batch_design` as manual step until automation lands
- **And** script automation `scripts/check-pen-json-parity.sh` deferred to TD-K034-01 (not Phase 0 blocker; Phase 0 rule is manual enforcement)
- **Why:** QA Early Consultation Q1 — without drift detection, Designer editing `.pen` without re-export silently propagates stale JSON downstream. Phase 0 accepts the rule; script is TD.

#### AC-034-P0-VISUAL-DELTA-VALIDATOR — ticket `visual-delta: none` semantic guard (Q3 ruling, doc-level)
- **Given** a ticket frontmatter contains `visual-delta: none`
- **When** the ticket is opened / updated
- **Then** frontmatter must also contain `visual-delta-rationale: <single-line explanation>` (e.g. "pure backend fix, no frontend/src/** change")
- **And** PM Phase Gate (pre-Architect release) rejects ticket when `visual-delta: none` but Phase plan text contains any of `new component / layout / style / Pencil frame`
- **And** script automation `scripts/validate-visual-delta.sh` (git diff frontend/src + frontend/public against `none` label) deferred to TD-K034-02
- **Why:** QA Q3 — unguarded `none` invites mis-labeling to skip Designer. Phase 0 = manual PM enforcement; script is TD.

#### AC-034-P0-SHARED-CHROME-INVENTORY — shared-component inventory SSOT MVP (Q5 Phase 0 slice)
- **Given** `docs/designs/shared-components-inventory.md`
- **When** file is read
- **Then** it enumerates every current shared chrome component (Footer, NavBar, BuiltByAIBanner) with columns: (a) file path, (b) consuming routes, (c) allowed variants (default 0), (d) Pencil frame IDs
- **And** any PR introducing a new variant prop MUST first Edit this inventory + get PM ruling + cite Pencil frame evidence (Reviewer persona structural-chrome-duplication-scan cross-reference)
- **And** Phase 2 expansion — `shared-components.spec.ts` auto-generated NavBar × routes + Banner × routes byte-diff matrix — deferred to TD-K034-03
- **Why:** QA Q5 — Phase 1 Footer unification leaves NavBar/Banner unprotected. Inventory doc is MVP Phase 0 infrastructure; full pairwise matrix follows in Phase 2.

#### AC-034-P0-NEW-ROUTE-GATE — new-route onboarding checklist (Q7 ruling, doc-level)
- **Given** a ticket introduces a new route (e.g. /insights, /roadmap, /playbook)
- **When** ticket is opened
- **Then** ticket frontmatter must include `new-route-checklist:` block with 4 fields: `pencil-frame-id:`, `specs-json-path:`, `screenshots-png-path:`, `inventory-entry:`
- **And** PM Phase Gate refuses to release Architect until all 4 non-empty (per PM persona new-route gate, added inline at §PM Ruling below)
- **And** Designer persona "new-route intake" sub-flow (receive PM request → produce 4 artifacts → notify PM) lands at first new-route ticket; codification deferred to TD-K034-04
- **Why:** QA Q7 — prevents new routes shipping without Pencil backing. Phase 0 = AC-level rule; Designer persona intake flow is TD.

### §4.1 PM Rulings on QA Early Consultation Challenges

QA retrospective `docs/retrospectives/qa.md 2026-04-23 — K-034 Phase 0 Early Consultation` raised 7 challenges. PM rulings (binding; QA sign-off of Phase 1 conditional on this section):

| QA # | Topic | Ruling | Routed to |
|------|-------|--------|-----------|
| Q1 | `.pen` ↔ specs JSON drift | **ACCEPT** doc-level AC | AC-034-P0-DRIFT-GATE (above); TD-K034-01 for script |
| Q2 | Snapshot dual-baseline vs Pencil re-export | **DEFER** to Phase 1 QA sign-off step | TD-K034-05; QA adds `scripts/compare-baselines.sh` check at Phase 1 close when Playwright baseline first lands |
| Q3 | `visual-delta: none` abuse | **ACCEPT** doc-level AC | AC-034-P0-VISUAL-DELTA-VALIDATOR (above); TD-K034-02 for script |
| Q4 | Pencil orphan frames | **DEFER** to tech-debt | TD-K034-06 (monthly audit; Designer persona addition at first recurrence) |
| Q5 | Cross-page regression beyond Footer | **SPLIT** — inventory doc to Phase 0; full pairwise matrix to Phase 2 | AC-034-P0-SHARED-CHROME-INVENTORY (above); TD-K034-03 for Phase 2 matrix |
| Q6 | CI cost budget | **DEFER** to tech-debt | TD-K034-07 (`docs/reports/ci-budget.md` when full-suite first exceeds 6 min; snapshot declared Sacred in reduction order) |
| Q7 | New-route onboarding | **ACCEPT** doc-level AC | AC-034-P0-NEW-ROUTE-GATE (above); TD-K034-04 for Designer intake codification |

**Rationale for DEFER choices:** Q2/Q4/Q6 are enforcement-layer concerns that (a) do not exist without Phase 1 baselines (Q2), (b) require empirical trigger before audit cadence is worth codifying (Q4), (c) are monitoring concerns not currently triggered (Q6). Phase 0 scope stays tight to the 17-decision rule set + QA's 4 ACCEPT ACs; enforcement scripts and audit cadence follow via tech-debt when Phase 1/2 events require them.

**QA sign-off condition:** QA releases Phase 1 AC to Engineer only after (a) this section §4.1 exists in this ticket, (b) 7 tech-debt entries TD-K034-01 through TD-K034-07 land in `docs/tech-debt.md`, (c) 4 new Phase 0 AC entries exist above, (d) `docs/designs/shared-components-inventory.md` exists.

### Phase 1 — /about footer hotfix (Pencil-compliant inline version)

**Deliverables:**
1. Architect: `docs/designs/K-034-phase1-footer-inline-unification.md` — retires `variant` prop, collapses Footer.tsx to single inline variant, updates `shared-components.spec.ts` to assert byte-identical Footer across /, /about, /business-logic, Route Impact Table (/, /about, /business-logic affected; /diary, /app unaffected), fail-if-gate-removed dry-run description.
2. Designer: JSON snapshot of `86psQ` + `1BGtd` in design doc (confirming content-identity); specs JSON at `frontend/design/specs/homepage-v2.frame-86psQ.json` + `homepage-v2.frame-1BGtd.json`; screenshots PNG of both + side-by-side vs current /about.
3. Engineer: delete `variant: 'about'` branch from `frontend/src/components/shared/Footer.tsx`; update 3 call sites (`HomePage.tsx`, `AboutPage.tsx`, `BusinessLogicPage.tsx`) to `<Footer />` without variant prop; tsc + Playwright green.
4. Reviewer: Step 2 Pencil-parity pass (using new gate from Phase 0 persona update).
5. QA: full Playwright regression + new `toMatchSnapshot()` baseline for Footer on /, /about, /business-logic.
6. Deploy + Deploy Record block in this ticket.
7. PM close Phase 1: retrospective + dashboard + `diary.json` sync (English text).

**AC for Phase 1:**

#### AC-034-P1-FOOTER-UNIFIED — Single-variant Footer component
- **Given** `frontend/src/components/shared/Footer.tsx`
- **When** a reader greps `variant` in the file
- **Then** 0 matches (no `variant` prop, no branch logic, no interface field)
- **And** Component renders only the inline one-liner DOM identical to Pencil frames 4CsvQ/86psQ/1BGtd

#### AC-034-P1-ROUTE-DOM-PARITY — All consuming routes render identical Footer DOM
- **Given** dev-server at `/`, `/about`, `/business-logic`
- **When** `shared-components.spec.ts` runs
- **Then** each route's `<footer>` element has identical `outerHTML` (byte-for-byte, no variant modulo)
- **And** the single text node reads `yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn`
- **And** the GA disclosure `<p>` reads `This site uses Google Analytics to collect anonymous usage data.`

#### AC-034-P1-NO-ABOUT-CTA — "Let's talk →" block deleted
- **Given** dev-server at `/about`
- **When** page loads
- **Then** no `Let's talk →` text appears anywhere on the page
- **And** no `data-testid="cta-email"` / `cta-github` / `cta-linkedin` element exists in DOM
- **And** no `<a href="mailto:yichen.lee.20@gmail.com">` or `https://github.com/mshmwr/k-line-prediction` A-7-styled link remains

#### AC-034-P1-NO-FOOTER-ROUTES — /diary and /app unchanged
- **Given** dev-server at `/diary` and `/app`
- **When** pages load
- **Then** no `<footer>` element (K-024 no-footer / K-030 isolation preserved)

#### AC-034-P1-FAIL-IF-GATE-REMOVED — Spec FAILs if CTA branch re-introduced
- **Given** Phase 1 deploy
- **When** Engineer temporarily re-adds `variant: 'about'` CTA branch as dry-run
- **Then** `shared-components.spec.ts` must FAIL (at least one route's DOM diverges)
- **And** dry-run is reverted before Phase 1 close

#### AC-034-P1-DEPLOY — Phase 1 deployed with Deploy Record block
- **Given** Phase 1 all other AC pass
- **When** `firebase deploy --only hosting` runs
- **Then** live bundle contains the new single-variant Footer (verified via `curl <live-URL>/assets/index-<hash>.js | grep -v "Let's talk"` — 0 matches)
- **And** this ticket's §Deploy Record block (Phase 1) is populated with Git SHA + URL + bundle hash + executed probe output

### Phase 2 — /about full visual audit (per original K-034 scope)

**Deliverables:**
1. Per-section Pencil JSON dump (all /about frames in `frontend/design/specs/`).
2. Drift list: for each section, `code → JSON` diff summary (property, expected, observed).
3. PM ruling per drift: `.pen` update (send to Designer) vs code update (send to Engineer).
4. Execute updates, tsc + Playwright, Reviewer, QA, deploy + Deploy Record.

**AC for Phase 2 (to be expanded at Phase 1 close; placeholders below):**

#### AC-034-P2-AUDIT-DUMP — Full Pencil JSON dump landed
- **Given** `frontend/design/specs/`
- **When** `ls` on the directory
- **Then** every /about Pencil frame has a corresponding `frontend/design/specs/about-v2.frame-<id>.json` file
- **And** JSON content matches Pencil `batch_get` output for each frame (Designer-generated)

#### AC-034-P2-DRIFT-LIST — Every implementation-vs-JSON drift documented
- (To be expanded at Phase 1 close based on actual Phase 2 audit findings)

### Phase 3+ — as uncovered in Phase 2.

---

## 5. Scope / Out-of-scope

**In-scope:**
- BFP Round 2 for K-035 α-premise failure
- New sitewide design workflow (17 decisions)
- /about footer hotfix (Phase 1)
- /about full audit (Phase 2)

**Out-of-scope (unless Phase 2 audit elevates):**
- NavBar / Hero / Banner structural refactor
- /app / /diary changes beyond preserving isolation
- K-036 and later tickets (blocked until K-034 closed per Q3)

---

## 6. Retired / Superseded Items

- `docs/designs/K-035-shared-component-migration.md` §0 BQ-035-01 "Option α recommendation" — retired; rationale "Pencil fidelity 10/10" is based on false content-parity claim (Pencil has one design, not two).
- K-035 `variant: 'home' | 'about'` prop interface — retired in Phase 1; Footer becomes single-variant.
- K-035 `shared-components.spec.ts` DOM-equivalence-modulo-variant contract — tightened to strict byte-identity in Phase 1.
- K-021 Sacred `/about 維持 FooterCtaSection（K-017 鎖定）` — already retired by K-035; remains retired.

---

## 7. Sacred Invariants Preserved

- K-017 content: email, GitHub URL, LinkedIn URL, GA disclosure (all flow into the single inline footer content).
- K-022 A-7 link style (applied on /about body-section links, not on the Footer which is now mono-style).
- K-024 `/diary` no-footer.
- K-030 `/app` isolation (no NavBar, no Footer, non-paper background).

---

## Retrospective (PM-authored at ticket close)

(Populated at Phase 1 close and Phase 2 close.)

### Architect (2026-04-23, Phase 1 design doc delivery)

**Where most time was spent:** cross-checking Sacred invariants (K-017 / K-018 / K-022) against Pencil ground-truth. All three Sacred clauses depend on `<a>` anchors on /about that Pencil SSOT does not show. Surfaced as BQ-034-P1-01 requiring PM ruling (Option A Pencil-literal, B anchors-as-text, or C separate CTA block). Without this cross-check, Phase 1 would have shipped Option A and silently retired 3 Sacred clauses — the α-premise class of failure K-034 exists to prevent.

**Which decisions needed revision:** Initial draft proposed Option B as architect recommendation. Second pass reclassified to BQ escalated to PM per `feedback_ticket_ac_pm_only.md` + `feedback_pm_ac_pen_conflict_escalate.md`. Retiring Sacred is a product-scope decision, not technical.

**Next time improvement:** For any refactor-class ticket touching `<a>` elements, Architect grep sweep on `data-testid="cta-"` + `trackCtaClick(` + `target="_blank"` + `href="mailto:"` across `frontend/src/` + `frontend/e2e/` as a §Sacred cross-check row. Would have surfaced BQ-034-P1-01 in first-pass. Candidate for senior-architect.md persona addendum pending PM ruling at Phase 1 close.

**Design doc:** [K-034-phase1-footer-inline-unification.md](../designs/K-034-phase1-footer-inline-unification.md)
**BQ for PM:** BQ-034-P1-01 — Option A/B/C on /about GA click-event tracking under inline Footer (blocks Engineer release).

### PM ruling on BQ-034-P1-01 (2026-04-23)

**Ruling: Option A (Pencil-literal).** /about Footer = byte-identical DOM to / and /business-logic = single plain-text inline one-liner, no `<a>` anchors. Retires K-017 hrefs on /about, K-018 GA click events on /about, K-022 A-7 italic+underline on /about.

**Rationale:** §1.4 user verdict already dictates "/about must render the inline one-liner, same as /" — "/" renders plain text (zero anchors per Designer JSON specs for frames 86psQ + 1BGtd). Under new Phase 0 workflow (AC-034-P0-PERSONAS Q6c + `feedback_pm_ac_pen_conflict_escalate`), Pencil SSOT supersedes pre-Phase-0 AC Sacred clauses when AC-vs-Pencil conflict exists. K-017 Sacred hrefs, K-018 Sacred GA events, K-022 Sacred A-7 style on /about are all pre-Phase-0 artifacts that Pencil SSOT never authorized — they are the α-premise failure class K-034 exists to correct. GA click events on / and /business-logic are NOT affected (those routes already render plain-text inline Footer today; there are no /about-specific events on those routes).

**Sacred clause retirement log (binding on Phase 1 spec cascade):**
- K-017 AC-017-FOOTER email/GitHub/LinkedIn anchor href + target="_blank" + rel assertions on /about → RETIRED (assertions deleted from `about.spec.ts`; comment-only retirement marker added referencing this ticket + §1.4 verdict).
- K-018 AC-018-CLICK contact_email / github_link / linkedin_link GA events on /about → RETIRED (those 3 events now only fire on /business-logic if anchors ever appear there, or never; `ga-tracking.spec.ts` L118–159 /about-scoped assertions deleted).
- K-022 A-7 italic + underline styling on /about CTA anchors → RETIRED (anchors no longer exist).
- GA click events on / and /business-logic (if currently asserted) → UNCHANGED (those routes already render plain-text; no behavior change).

**Engineer release condition:** Design doc Option A implementation path selected. Phase 1 scope proceeds with variant retirement + `variant='about'` branch deletion + 3 call site prop removals + Sacred retirement edits on 2 spec files (`about.spec.ts` + `ga-tracking.spec.ts`) + `shared-components.spec.ts` byte-identical DOM assertion upgrade. Engineer dispatched with this ruling as binding AC supplement.

**Phase 1 AC supplement (binding, append to §AC for Phase 1):** `AC-034-P1-SACRED-RETIRE` — retiree spec files and retired AC identifiers enumerated above must be edited to delete /about-scoped assertions; each deletion must carry an inline code comment citing `K-034 §PM ruling on BQ-034-P1-01 — Sacred retired per §1.4 Pencil SSOT verdict`. Spec file test counts post-deletion must match pre-deletion minus retired-AC-count exactly.

**Architect's persona-addendum proposal** (grep sweep on `data-testid="cta-"` / `trackCtaClick(` / `target="_blank"` / `href="mailto:"` for refactor-class tickets touching `<a>` elements): **ACCEPT at Phase 1 close.** Will Edit `senior-architect.md §Sacred cross-check` with this sweep as hard step after Phase 1 deploys successfully (codifying the improvement that this BQ would have surfaced automatically in first-pass). Not a Phase 1 blocker — it is a Phase 1-retrospective-class persona improvement.

## Deploy Record

(Populated at end of Phase 1 and Phase 2 after each deploy.)
