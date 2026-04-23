---
title: K-034 Phase 2 — /about Full Visual Audit (Pencil SSOT Drift Remediation)
ticket: docs/tickets/K-034-about-spec-audit-and-workflow-codification.md
phase: 2
author: Architect (auto mode)
updated: 2026-04-23
status: ready-for-engineer
visual-delta: yes
design-locked: true
visual-spec-root: frontend/design/specs/about-v2*.json
screenshots-root: frontend/design/screenshots/about-v2-*.png
scope: /about (desktop 1440px, mobile Phase 3 Known Gap)
pencil-ssot-read-gate: PASS
ac-scope: 17 new AC (AC-034-P2-AUDIT-DUMP + DRIFT-LIST + DRIFT-D{1,2-D7-CARD-SHELL-UNIFIED,2-METRIC-CARD-REWRITE,3,4,5,6,8,9-D13,14-D15,16-D18,19-D21,26-D27} + DESIGNER-ATOMICITY + SNAPSHOT-POLICY + SACRED-RETIRE + DEPLOY)
drift-scope: 27 drifts total (24 code-side + 3 deferred/no-drift + 0 .pen-side)
---

## 0 Scope Questions

None. All 9 QA Early Consultation Challenges PM-ruled in ticket §4.5; all 27 drifts PM-ruled in ticket §5. Pencil SSOT read gate passes (7 JSON + 7 PNG all on disk, mtime-monotonicity verified by Designer retro 2026-04-23).

---

## §1 Pencil SSOT Read Gate

### Frame inventory (verbatim from manifest)

| # | Frame ID | Section | JSON path | PNG path | Status |
|---|----------|---------|-----------|----------|--------|
| 1 | `voSTK` | abNav (NavBar) | `frontend/design/specs/about-v2.frame-voSTK.json` | `frontend/design/screenshots/about-v2-voSTK.png` | PRESENT (2519 / 4567 bytes) |
| 2 | `wwa0m` | S1 PageHeaderSection | `frontend/design/specs/about-v2.frame-wwa0m.json` | `frontend/design/screenshots/about-v2-wwa0m.png` | PRESENT (3134 / 40686 bytes) |
| 3 | `BF4Xe` | S2 MetricsStripSection | `frontend/design/specs/about-v2.frame-BF4Xe.json` | `frontend/design/screenshots/about-v2-BF4Xe.png` | PRESENT (11045 / 59853 bytes) |
| 4 | `8mqwX` | S3 RoleCardsSection | `frontend/design/specs/about-v2.frame-8mqwX.json` | `frontend/design/screenshots/about-v2-8mqwX.png` | PRESENT (15340 / 96328 bytes) |
| 5 | `UXy2o` | S4 ReliabilityPillarsSection | `frontend/design/specs/about-v2.frame-UXy2o.json` | `frontend/design/screenshots/about-v2-UXy2o.png` | PRESENT (9400 / 110749 bytes) |
| 6 | `EBC1e` | S5 TicketAnatomySection | `frontend/design/specs/about-v2.frame-EBC1e.json` | `frontend/design/screenshots/about-v2-EBC1e.png` | PRESENT (10986 / 88323 bytes) |
| 7 | `JFizO` | S6 ProjectArchitectureSection | `frontend/design/specs/about-v2.frame-JFizO.json` | `frontend/design/screenshots/about-v2-JFizO.png` | PRESENT (10935 / 106284 bytes) |
| 8 | `86psQ` | abFooterBar (Phase 1 preserved) | `frontend/design/specs/homepage-v2.frame-86psQ.json` | `frontend/design/screenshots/about-v2-86psQ.png` | PRESENT (unchanged — Phase 1 Sacred; Footer frozen per BQ-034-P2-QA-04 ruling) |
| 9 | `35VCj` | Full page overview | (parent; not re-dumped) | `frontend/design/screenshots/about-v2-35VCj-full.png` | PRESENT (559299 bytes, full-page) |

- Manifest: `frontend/design/specs/about-v2-manifest.md` — PRESENT; BQ-034-P2-QA-01 Option A1 (7-sub-frame split) retroactively endorsed.
- `pen-mtime-at-export` on every JSON header: `2026-04-21T19:52:16+0800` (monotonic chain validated by Designer, see `docs/retrospectives/designer.md` 2026-04-23).
- `shared-components-inventory.md` — PRESENT at `docs/designs/`; Footer row lists 4 consuming routes (/, /about, /business-logic, /diary — latter pending Phase 3).

**Gate result: PASS.** All 7 required JSON + 9 PNG artifacts exist; Designer atomicity precondition satisfied for this Phase.

---

## §2 Scope + Component Inventory

### 2.1 /about page components — current vs target

| Component | File | Status | Pencil frame | Notes |
|-----------|------|--------|--------------|-------|
| `UnifiedNavBar` | `frontend/src/components/UnifiedNavBar.tsx` | **unchanged** (Phase 2) | `voSTK` | Body-scope drifts only; NavBar structural audit deferred to TD-K034-P2-14 per BQ-034-P2-QA-03 partial ruling. |
| `DossierHeader` | `frontend/src/components/about/DossierHeader.tsx` | **RETIRE (delete)** | NONE (D-1: no Pencil frame) | Import removed from `AboutPage.tsx`; component file deleted; K-022 AC-022-DOSSIER-HEADER Sacred retired concurrently. |
| `SectionLabelRow` (inline in AboutPage) | `frontend/src/pages/AboutPage.tsx:13-25` | **unchanged** (D-23/D-24 verified match) | `s*label` + `s*Line` per section | `font-mono text-[13px] font-bold tracking-[2px] text-ink` + `bg-[#8B7A6B]` hairline — matches Pencil exactly. |
| `PageHeaderSection` (S1) | `frontend/src/components/about/PageHeaderSection.tsx` | **rewrite (D-19/D-20/D-21)** | `wwa0m` | 2-line hero, left-aligned, full-width divider. |
| `MetricsStripSection` (S2) | `frontend/src/components/about/MetricsStripSection.tsx` | **rewrite** (delete h2 + subtitle per D-26/D-27; extend METRICS props to Pencil shape per D-2) | `BF4Xe` | Pass Pencil data to MetricCard. |
| `MetricCard` (S2) | `frontend/src/components/about/MetricCard.tsx` | **full rewrite (D-2/D-3/D-7)** | `BF4Xe.m1..m4` | Dark FILE Nº bar + body with optional big number + Bodoni/Newsreader typography; m2 shows bar + visible subtext + note. |
| `RoleCardsSection` (S3) | `frontend/src/components/about/RoleCardsSection.tsx` | **rewrite** (delete h2, delete subtitle, replace with Pencil intro; delete `redactArtefact` in data) | `8mqwX` | Intro = `s3Intro` literal. |
| `RoleCard` (S3) | `frontend/src/components/about/RoleCard.tsx` | **full rewrite (D-4/D-5/D-6/D-7/D-8)** | `8mqwX.role_*` | Retire POSITION/BEHAVIOUR + `redactArtefact` + `annotation` + `ROLE_ANNOTATIONS`; add FILE Nº PERSONNEL bar; add 40px rule; font-size varies by role length. |
| `ReliabilityPillarsSection` (S4) | `frontend/src/components/about/ReliabilityPillarsSection.tsx` | **rewrite** (h2 becomes s4Intro styled Bodoni 30; body content unchanged wording; LAYER→FILE Nº · PROTOCOL per D-10) | `UXy2o` | Keep `s4Intro` h2 "How AI Stays Reliable" (Pencil has it). |
| `PillarCard` (S4) | `frontend/src/components/about/PillarCard.tsx` | **full rewrite (D-9 through D-13)** | `UXy2o.pillar_*` | Title Bodoni 26, body Newsreader italic, brick left-border quote, per-card link text. |
| `TicketAnatomySection` (S5) | `frontend/src/components/about/TicketAnatomySection.tsx` | **rewrite** (delete h2 + subtitle per D-26/D-27; replace with s5Intro literal) | `EBC1e` | TICKETS array outcome/learning text unchanged. |
| `TicketAnatomyCard` (S5) | `frontend/src/components/about/TicketAnatomyCard.tsx` | **full rewrite (D-14/D-15)** | `EBC1e.ticket_*` | Dark FILE Nº · CASE FILE bar + K-00N right; body with Case Nº, Bodoni title, rule, OUTCOME/LEARNING labels, brick learning text, bottom link. |
| `ProjectArchitectureSection` (S6) | `frontend/src/components/about/ProjectArchitectureSection.tsx` | **rewrite** (delete h2 + subtitle per D-26/D-27; replace with s6Intro literal; migrate `body`+`testingPyramid` to structured `fields`) | `JFizO` | Update data passed to ArchPillarBlock per new props. |
| `ArchPillarBlock` (S6) | `frontend/src/components/about/ArchPillarBlock.tsx` | **full rewrite (D-16/D-17/D-18)** | `JFizO.arch_*` | Dark LAYER Nº · <CATEGORY> bar + Bodoni 24 title + structured label/value fields + testing-pyramid numbered rows variant. |
| `Footer` | `frontend/src/components/shared/Footer.tsx` | **unchanged (FROZEN)** | `86psQ` | BQ-034-P2-QA-04 ruling — `components/shared/**` scope frozen in Phase 2; Reviewer Git Status Commit-Block Gate triggers if modified. |
| `CardShell` (primitive) | `frontend/src/components/primitives/CardShell.tsx` | **unchanged** | N/A | Remains structural wrapper for all card consumers; dark top bar implemented inside each consumer (NOT added to CardShell — see §6.3 shared-primitive rationale). |
| `RedactionBar` | `frontend/src/components/about/RedactionBar.tsx` | **unchanged** | `m*Redact` / `r*` (Reviewer card Pencil has no RedactionBar — D-5 removes `redactArtefact` branch, but primitive stays for MetricCard) | Used by MetricCard m2 (140px), m1/m3/m4 (Pencil widths 100/110/90 — per-card prop). |

**New component (optional, see §6.3):** `FileNoBar` — candidate primitive OR extend `CardShell` with `fileNoBar?` prop. Architect ruling: **new `FileNoBar` primitive** at `frontend/src/components/about/FileNoBar.tsx` (page-specific for Phase 2; promote to `primitives/` if Phase 3+ surfaces a non-/about consumer).

### 2.2 Cross-page / shared component audit (K-017 cross-page duplicate-audit rule)

- `grep -rn "bg-charcoal.*text-paper.*font-mono.*text-\[10px\]" frontend/src/components/` — before Phase 2: 1 hit (`DossierHeader.tsx`) + 1 hit (`PillarCard.tsx:22-26` LAYER bar). After Phase 2: FILE Nº dark bar motif appears in 5 card types (Metric/Role/Pillar/TicketAnatomy/Arch) — ALL consumed via single `<FileNoBar>` primitive (see §6.3). No duplicate JSX across consumers.
- `grep -rn "font-italic italic" frontend/src/components/about/` — italic Newsreader is already convention-applied; Phase 2 extends to OWNS text (D-8) + pillar body (D-11) + ticket outcome/learning (D-15) + arch body (D-17).
- **Confirmed: no new shared chrome component is introduced outside `components/about/`.** UnifiedNavBar + Footer are the only sitewide shared chrome; both frozen in Phase 2.

---

## §3 Truth Table: Drift D1–D27 → File Changes (27 rows)

Columns: `drift-id | component | file | action | JSON source frame | AC covered`

| Drift | Component / Axis | File (action) | JSON frame / node-path | AC covered |
|-------|------------------|---------------|------------------------|------------|
| D-1 | DossierHeader retire | `frontend/src/components/about/DossierHeader.tsx` (**delete**), `frontend/src/pages/AboutPage.tsx:3,33` (**edit — remove import + render**) | none (no Pencil frame) | AC-034-P2-DRIFT-D1; AC-034-P2-SACRED-RETIRE (K-022 AC-022-DOSSIER-HEADER) |
| D-2 | MetricCard shell rewrite | `frontend/src/components/about/MetricCard.tsx` (**rewrite**) | `BF4Xe.s2MetricsRow.m{1..4}_*` | AC-034-P2-DRIFT-D2-D7-CARD-SHELL-UNIFIED; AC-034-P2-DRIFT-D2-METRIC-CARD-REWRITE |
| D-3 | MetricCard m2 subtext visible | `frontend/src/components/about/MetricCard.tsx` (**rewrite** — redacted branch never hides subtext), `frontend/src/components/about/MetricsStripSection.tsx` (**edit** METRICS array — pass `redacted={{width:'w-[140px]'}}` + visible `subtext`+`note`) | `BF4Xe.m2_FirstPassReview.m2Body` | AC-034-P2-DRIFT-D3-METRIC-M2-SUBTEXT-VISIBLE |
| D-4 | POSITION/BEHAVIOUR retired | `frontend/src/components/about/RoleCard.tsx` (**edit** — delete `ROLE_ANNOTATIONS` const, delete `annotation` prop, delete marginalia `<div>`); `frontend/e2e/about-v2.spec.ts:269-290` (**delete** AC-022-ANNOTATION describe block) | `8mqwX.role_*.r*Body` (no POSITION/BEHAVIOUR nodes) | AC-034-P2-DRIFT-D4-ROLE-ANNOTATION-RETIRED |
| D-5 | Reviewer unredacted | `frontend/src/components/about/RoleCardsSection.tsx` (**edit** — Reviewer `redactArtefact:false`; then delete `redactArtefact` from data entirely), `frontend/src/components/about/RoleCard.tsx` (**edit** — delete `redactArtefact` prop + RedactionBar branch) | `8mqwX.role_Reviewer.r4Art` | AC-034-P2-DRIFT-D5-REVIEWER-UNREDACTED |
| D-6 | Role font-size by length | `frontend/src/components/about/RoleCard.tsx` (**edit** — compute `role.length<=2?'text-[36px]':'text-[32px]'`) | `8mqwX.role_*.r*Role` (PM/QA=36, others=32) | AC-034-P2-DRIFT-D6-ROLE-FONT-SIZE |
| D-7 | Role card dark FILE Nº · PERSONNEL bar | `frontend/src/components/about/RoleCard.tsx` (**edit** — inject `<FileNoBar fileNo={n} label="PERSONNEL" />`), `frontend/src/components/about/RoleCardsSection.tsx` (**edit** — add `fileNo:1..6` to each entry) | `8mqwX.role_*.r*Top` | AC-034-P2-DRIFT-D2-D7-CARD-SHELL-UNIFIED |
| D-8 | Role body typography | `frontend/src/components/about/RoleCard.tsx` (**edit** — owns text `font-italic italic text-[14px]`; add `<div className="h-px w-10 bg-charcoal my-2" />` 40px rule between role name and OWNS) | `8mqwX.role_*.r*Body (r*Rule, r*OwnsL, r*Owns, r*ArtL, r*Art)` | AC-034-P2-DRIFT-D8-OWNS-ARTEFACT-TYPOGRAPHY |
| D-9 | PillarCard title Bodoni 26 | `frontend/src/components/about/PillarCard.tsx` (**edit** — `font-display font-bold italic text-[26px] text-ink`) | `UXy2o.pillar_*.p*Title` | AC-034-P2-DRIFT-D9-D13-PILLAR-CARD-REWRITE |
| D-10 | PillarCard LAYER label → FILE Nº · PROTOCOL | `frontend/src/components/about/PillarCard.tsx` (**edit** — `layerLabel` prop accepts new literal values; drop dark bar inline impl + use `<FileNoBar />`); `frontend/src/components/about/ReliabilityPillarsSection.tsx` (**edit** — pass `"FILE Nº 01 · PROTOCOL"` etc. OR `fileNo={1..3} label="PROTOCOL"`) | `UXy2o.pillar_*.p*Lbl` | AC-034-P2-DRIFT-D9-D13 + AC-034-P2-SACRED-RETIRE (K-022 AC-022-LAYER-LABEL) |
| D-11 | PillarCard body italic + ink | `frontend/src/components/about/PillarCard.tsx` (**edit** — body wrapper `font-italic italic text-ink text-[14px] leading-[1.6]`) | `UXy2o.pillar_*.p*BodyText` | AC-034-P2-DRIFT-D9-D13 |
| D-12 | PillarCard quote brick border + brick text | `frontend/src/components/about/PillarCard.tsx` (**edit** — `border-l-[3px] border-brick pl-[14px]`, inner text `font-display font-bold italic text-brick text-[14px]`) | `UXy2o.pillar_*.p*QuoteWrap` + `p*QuoteText` | AC-034-P2-DRIFT-D9-D13 |
| D-13 | PillarCard per-card link text | `frontend/src/components/about/PillarCard.tsx` (**edit** — accept `linkText` prop; style `font-mono text-[11px] text-ink tracking-[1px]` — drop italic/underline); `frontend/src/components/about/ReliabilityPillarsSection.tsx` (**edit** — pass per-card `linkText` values) | `UXy2o.pillar_*.p*Link` (content varies per card) | AC-034-P2-DRIFT-D9-D13 |
| D-14 | TicketAnatomyCard dark bar | `frontend/src/components/about/TicketAnatomyCard.tsx` (**edit** — `<FileNoBar fileNo={n} label="CASE FILE" trailing={id} />`; remove top flex row badge+GitHub link); `frontend/src/components/about/TicketAnatomySection.tsx` (**edit** — add `fileNo` to each TICKET entry) | `EBC1e.ticket_*.t*Top` | AC-034-P2-DRIFT-D14-D15-TICKET-CARD-REWRITE |
| D-15 | TicketAnatomyCard body layout | `frontend/src/components/about/TicketAnatomyCard.tsx` (**rewrite** — Case Nº prefix + Bodoni 26 title + 40px rule + OUTCOME/LEARNING labels + brick learning + bottom link) | `EBC1e.ticket_*.t*Body` | AC-034-P2-DRIFT-D14-D15 |
| D-16 | ArchPillarBlock title Bodoni 24 | `frontend/src/components/about/ArchPillarBlock.tsx` (**edit** — `font-display font-bold italic text-[24px] text-ink`) | `JFizO.arch_*` arch*Body first text | AC-034-P2-DRIFT-D16-D18-ARCH-CARD-REWRITE |
| D-17 | ArchPillarBlock structured fields | `frontend/src/components/about/ArchPillarBlock.tsx` (**rewrite interface** — `fields: Array<FieldEntry \| TestingRowEntry>`); `frontend/src/components/about/ProjectArchitectureSection.tsx` (**rewrite** — pass BOUNDARY/CONTRACT + SPEC FORMAT/FLOW + testing-row entries) | `JFizO.arch*Body` (labels + values) | AC-034-P2-DRIFT-D16-D18 |
| D-18 | ArchPillarBlock dark LAYER Nº · <CATEGORY> bar | `frontend/src/components/about/ArchPillarBlock.tsx` (**edit** — `<FileNoBar fileNo={n} label={category} prefix="LAYER Nº" />`); `ProjectArchitectureSection.tsx` (**edit** — pass `layerNo:1..3` + `category:'BACKBONE'/'DISCIPLINE'/'ASSURANCE'`) | `JFizO.arch_*.arch*Top` | AC-034-P2-DRIFT-D16-D18 |
| D-19 | Hero 2-line (Pencil: 2 text nodes) | `frontend/src/components/about/PageHeaderSection.tsx` (**rewrite** — 2 text nodes in flex column) | `wwa0m.titleColumn.ttl1 + ttl2` | AC-034-P2-DRIFT-D19-D21-HERO-REWRITE |
| D-20 | Hero divider full-width | `frontend/src/components/about/PageHeaderSection.tsx` (**edit** — divider class `h-px bg-charcoal w-full` — remove `max-w-sm mx-auto`) | `wwa0m.titleColumn.divider1` | AC-034-P2-DRIFT-D19-D21 |
| D-21 | Hero left-aligned | `frontend/src/components/about/PageHeaderSection.tsx` (**edit** — remove `text-center`; keep `py-20`) | `wwa0m` (no alignItems:center) | AC-034-P2-DRIFT-D19-D21 |
| D-22 | NavBar 5-link brick About | `frontend/src/components/UnifiedNavBar.tsx` | `voSTK.abNavLinks` | **deferred (TD-K034-P2-14)** per BQ-034-P2-QA-03 — body-scope only in Phase 2 |
| D-23 | Section label hairline color | `frontend/src/pages/AboutPage.tsx:22` | `s*Line.fill:#8B7A6B` | **no drift — verified match** |
| D-24 | Section label typography | `frontend/src/pages/AboutPage.tsx:16-21` | `s*label` | **no drift — verified match** |
| D-25 | SectionContainer divider | `frontend/src/pages/AboutPage.tsx:41,47,53,59,65` | `Y80Iv` (no section-level `<hr>`) | **deferred (TD-K034-P2-11)** per BQ-034-P2-QA-03 SectionContainer exemption |
| D-26 | Section subtitles → Pencil literal (S3/S5/S6) + delete S2 subtitle | `MetricsStripSection.tsx` / `RoleCardsSection.tsx` / `TicketAnatomySection.tsx` / `ProjectArchitectureSection.tsx` (**edit** — delete current `<p data-section-subtitle>`; replace with Pencil literal text or delete when none); `ReliabilityPillarsSection.tsx` (**edit** — subtitle→s4Intro h2 Bodoni 30) | `BF4Xe` (no intro), `8mqwX.s3Intro`, `UXy2o.s4Intro`, `EBC1e.s5Intro`, `JFizO.s6Intro` | AC-034-P2-DRIFT-D26-D27-SECTION-SUBTITLE |
| D-27 | Delete internal `<h2>` (S2 "Delivery Metrics" / S3 "The Roles" / S5 "Anatomy of a Ticket" / S6 "Project Architecture"; keep S4 "How AI Stays Reliable" restyled) | all 5 section TSX files (**edit**) | `8mqwX` / `BF4Xe` / `EBC1e` / `JFizO` (no inner h2); `UXy2o.s4Intro` (keep, restyle) | AC-034-P2-DRIFT-D26-D27 |

**Count check:** 27 rows (D-1 .. D-27). ✓

---

## §4 API / Contract

**No backend changes.** No API endpoint added, modified, or deleted. No `snake_case ↔ camelCase` mapping changes. Zero `.py` files edited.

`POST /api/predict`, `POST /api/merge-and-compute-ma99`, `POST /api/upload-history`, etc. — all untouched.

Confirmed by grep: `grep -rn "fetch\|axios" frontend/src/components/about/ frontend/src/pages/AboutPage.tsx` → zero HTTP clients (AboutPage is static portfolio content).

---

## §5 Route Impact Table (mandatory — global-style adjacent)

Note: this Phase 2 does NOT modify `index.css`, `tailwind.config.js`, or any sitewide CSS variable. However, it does touch shared primitive consumers (`CardShell` is read-only; new `FileNoBar` is `components/about/`-scoped, single-route). Route Impact Table is provided to document cross-route non-impact explicitly per K-021 precedent.

| Route | Status | Affected files | Verification |
|-------|--------|----------------|--------------|
| `/` | **unaffected** | none | `HomePage` does not import any `components/about/**`; Footer frozen. Visual smoke: Playwright snapshot `home-footer-chromium-darwin.png` must remain unchanged (no regeneration). |
| `/about` | **affected (full scope)** | `pages/AboutPage.tsx` + 12 `components/about/**` + 2 E2E spec files | Dev-server visual pass at 1280×800 + all E2E specs green. |
| `/business-logic` | **unaffected** | none | Does not consume `components/about/**`; Footer frozen. |
| `/diary` | **unaffected (Phase 2 scope)** | none | Phase 3 will add Footer; Phase 2 does NOT touch `/diary`. |
| `/app` | **must-be-isolated (preserved)** | none | K-030 Sacred preserved; no NavBar, no Footer. Verify via existing `app-bg-isolation.spec.ts` remains green. |

Engineer must dev-server-visit each route in this table before commit (per K-021 precedent).

---

## §6 Shared Component Boundary + Reuse Planning

### 6.1 Shared vs page-specific

| Component | Classification | Path | Allowed to change in Phase 2? |
|-----------|---------------|------|-------------------------------|
| `UnifiedNavBar` | **shared (sitewide chrome)** | `components/UnifiedNavBar.tsx` | **NO** — D-22 deferred to TD-K034-P2-14 |
| `Footer` | **shared (sitewide chrome)** | `components/shared/Footer.tsx` | **NO — FROZEN** per BQ-034-P2-QA-04 |
| `CardShell` | **shared primitive** | `components/primitives/CardShell.tsx` | **NO** (structural read-only; no prop extension per §6.3 ruling) |
| `SectionContainer` | **shared primitive** | `components/primitives/SectionContainer.tsx` | **NO** — D-25 deferred to TD-K034-P2-11 |
| `ExternalLink` | **shared primitive** | `components/primitives/ExternalLink.tsx` | **NO** (used by TicketAnatomyCard; link text changes, not primitive itself) |
| `RedactionBar` | **page-specific (about)** | `components/about/RedactionBar.tsx` | **YES** — consumer call sites change (m1/m3/m4 add widths; Reviewer card removes usage); primitive itself unchanged |
| `FileNoBar` (NEW) | **page-specific (about)** | `components/about/FileNoBar.tsx` (new file) | **YES** — create in Phase 2 |
| All 10 `components/about/*Section.tsx` + `*Card.tsx` + `ArchPillarBlock.tsx` + `PageHeaderSection.tsx` | **page-specific (about)** | `components/about/**` | **YES** |

### 6.2 `FileNoBar` — new primitive spec (authoritative)

**File:** `frontend/src/components/about/FileNoBar.tsx` (new)

**Responsibility:** render a dark charcoal header strip with left-aligned `FILE Nº 0N · <LABEL>` or `LAYER Nº 0N · <LABEL>` and an optional right-aligned trailing string (e.g. `K-002`). Used by MetricCard / RoleCard / PillarCard / TicketAnatomyCard / ArchPillarBlock (5 consumers; all within `components/about/**`).

**Props interface (authoritative — Engineer must not extend without PM BQ):**

> **Revised 2026-04-23 per §4.8 I-2 ruling:** `label` downgraded from required to optional based on empirical Pencil evidence — MetricCard BF4Xe m*Lbl nodes render as bare `FILE Nº 0N` without the `· <LABEL>` suffix. Engineer's implementation correctly mirrored Pencil; the design-doc spec (written before m*Lbl JSON dump verification) was the source of drift. Original spec `label: string` preserved below as historical record.

```
interface FileNoBarProps {
  fileNo: number            // 1..N — rendered as `0N` padded
  label?: string            // optional — when omitted, bar renders `${prefix} 0N` with no suffix
                            //   (MetricCard m*Lbl Pencil nodes carry no `· LABEL` suffix);
                            //   when present, values: "PERSONNEL" | "PROTOCOL" | "CASE FILE"
                            //   | "BACKBONE" | "DISCIPLINE" | "ASSURANCE"
  prefix?: "FILE Nº" | "LAYER Nº"  // default "FILE Nº"; "LAYER Nº" for ArchPillarBlock
  trailing?: string         // optional right-aligned trailing text (e.g. "K-002" for TicketAnatomyCard)
  cardPaddingSize?: "md" | "lg"    // optional; defaults to "md"; matches enclosing CardShell
                                   // padding prop; controls negative-margin adjustment
                                   // ("md" → `-mx-5 -mt-5`, "lg" → `-mx-6 -mt-6`)
}
```

> **PM endorsement note (2026-04-23 §4.8 I-2):** Props marked optional (`label?`, `cardPaddingSize?`) per PM I-2 post-hoc ruling 2026-04-23; Engineer correctly mirrored Pencil authority over design doc wording. Q6c `feedback_pm_ac_pen_conflict_escalate.md` precedence rule applied — Pencil SSOT beats pre-JSON-dump design-doc spec when the two disagree on an interface contract. This spec is authoritative going forward.

> **Historical (superseded 2026-04-23 §4.8 I-2):** original prop declared `label: string` (required). Engineer changed to optional during implementation to mirror MetricCard Pencil content. Per `feedback_ticket_ac_pm_only.md` + `feedback_engineer_design_doc_checklist_gate.md`, interface drift from design-doc should be BQ'd to PM pre-implementation. PM retroactively endorses the empirical-fit change; for future Phases, interface-change-from-design-doc is a BQ event not an implementation refinement (Engineer retrospective entry per §4.8 I-2 Action).

**Rendered DOM contract (Engineer must implement exactly):**

```
<div class="-mx-[PADDING] -mt-[PADDING] px-[10px] py-[6px] bg-charcoal flex items-center justify-between">
  <span class="font-mono text-[10px] text-paper tracking-[2px] uppercase">
    {prefix} {String(fileNo).padStart(2, '0')} · {label}
  </span>
  {trailing && (
    <span class="font-mono text-[12px] font-bold text-paper tracking-[2px]">{trailing}</span>
  )}
</div>
```

- The `-mx-[PADDING] -mt-[PADDING]` pattern assumes the bar sits inside a padded `CardShell` — callers must pass negative margin values matching their CardShell padding (`md`=`-mx-5 -mt-5`; `lg`=`-mx-6 -mt-6`). Alternative (recommended, simpler): **Engineer wraps the bar in the consumer component at CardShell's outer top edge using `-mx-5 -mt-5` (for `padding="md"`) or `-mx-6 -mt-6` (for `padding="lg"`).** Bar is always rendered inside CardShell, not outside.
- `padding: [6, 10]` in Pencil → Tailwind `px-[10px] py-[6px]`.
- `letterSpacing: 2` → `tracking-[2px]`.

**Error contract:**
- Missing `label` → bar renders `${prefix} 0N` with no suffix (MetricCard m*Lbl pattern); no runtime assertion. Per §4.8 I-2, optional label is the authoritative contract.
- `fileNo <= 0` or `fileNo > 99` → `String(fileNo).padStart(2,'0')` still works; no runtime assertion (out-of-range values are a data bug, not a component bug).
- Missing `trailing` → no right span rendered (JSX conditional `&&` short-circuits).
- Missing `cardPaddingSize` → defaults to `"md"` (`-mx-5 -mt-5` negative margin matching CardShell `padding="md"` = `p-5`).

### 6.3 Ruling: new `FileNoBar` primitive vs extending `CardShell`

**Decision: new `FileNoBar` primitive (not CardShell extension).**

**Rationale (per AC-034-P2-DRIFT-D2-D7-CARD-SHELL-UNIFIED "Architect chooses and documents"):**

- **Option A (extend CardShell):** add `fileNoBar?: { fileNo: number; label: string; ... }` prop. Pro: one primitive for all consumers. Con: (1) CardShell currently has 8 consumers outside `components/about/` (home/diary) that never want FileNoBar — prop bloat on unrelated callers; (2) CardShell is in `primitives/` — adding a page-specific visual motif crosses the boundary (primitive should be generic wrapper).
- **Option B (new FileNoBar primitive, composed inside consumer JSX):** 5 about-card consumers render `<FileNoBar ...>` inside their `<CardShell>`. Pro: (1) CardShell stays generic; (2) FileNoBar ownership is clearly `about/` scope; (3) easy to delete / modify without touching CardShell consumers; (4) matches K-017 Pass 2 primitive-extraction convention (place page-specific primitive in page dir until a second page adopts it, then promote to `primitives/`).
- **Option A score: 6.5** (cohesion ↓, coupling ↑). **Option B score: 8.5** (clean boundary, single-responsibility, minimal blast radius).

**Gap: 2.0 → adopt Option B.** Ruling lock — no post-hoc dimension added.

### 6.4 Shared-primitive reuse audit (K-017 cross-page duplicate rule)

- **CardShell:** consumed by 5 about-card types. Pattern (outer shell) remains single-source (`CardShell`).
- **FileNoBar:** introduced as new primitive in `components/about/`; consumed by 5 about-card types. No duplicate inline JSX.
- **RedactionBar:** consumed by MetricCard m1/m2/m3/m4 (4 widths: 100/140/110/90). Primitive stays generic.
- **ExternalLink:** TicketAnatomyCard `→ View K-00N on GitHub` inline anchor will be rewritten — Engineer choice: keep ExternalLink wrapper (recommended; preserves `rel="noopener noreferrer"` contract) with `<span className="font-mono text-[11px] text-ink tracking-[1px]">` child; drop A-7 italic+underline style per Pencil `p*Link` spec.
- **Grep evidence:** `grep -rn "bg-charcoal.*text-paper" frontend/src/components/` post-Phase-2 must return 1 hit (`FileNoBar.tsx`) + 0 hits in any card consumer. Reviewer verifies.

---

## §7 Implementation Order (Engineer checklist, ordered by dependency)

Each step is a stable checkpoint — verify (tsc + Playwright subset + dev-server visual) before next step.

### Step 1 — Retire DossierHeader
- **Files:** DELETE `frontend/src/components/about/DossierHeader.tsx`; EDIT `frontend/src/pages/AboutPage.tsx` (remove import line 3 + render line 33 + stale comment `{/* A-2 — Dossier Header Bar */}`).
- **E2E:** DELETE `frontend/e2e/about-v2.spec.ts:61-75` (AC-022-DOSSIER-HEADER describe block) with inline replacement comment `// AC-022-DOSSIER-HEADER retired per K-034 §5 drift D-1 — Pencil SSOT has no DossierHeader frame; component deleted.`.
- **Verify:** `grep -rn "DossierHeader\|dossier-header" frontend/` → 0 hits; `npx tsc --noEmit` exits 0.

### Step 2 — Create FileNoBar primitive
- **Files:** ADD `frontend/src/components/about/FileNoBar.tsx` per §6.2 spec.
- **Verify:** `npx tsc --noEmit` exits 0; file compiles but no consumer yet.

### Step 3 — MetricCard rewrite (D-2/D-3/D-7 + CARD-SHELL-UNIFIED)
- **Files:** EDIT `frontend/src/components/about/MetricCard.tsx` (new props `{fileNo, title, body?:string|{type:'number',value:string}, subtext?, note?, redacted?:{width:string}}`; body = FileNoBar top + conditional RedactionBar + conditional big Bodoni 76 number + Bodoni 22 (number cards) / 28 (text cards) italic title + Newsreader 13 subtext + Newsreader 11 italic muted note); EDIT `frontend/src/components/about/MetricsStripSection.tsx` (delete h2, delete `<p data-section-subtitle>` — Pencil BF4Xe has no intro; METRICS array rewritten to Pencil shape: m1={fileNo:1, body:{type:'number',value:'17'}, title:'Features Shipped', note:'17 tickets, K-001 → K-017'}, m2={fileNo:2, title:'First-pass Review Rate', subtext:'Reviewer catches issues before QA on most tickets', note:'— classification: NARRATIVE, un-metered.', redacted:{width:'w-[140px]'}}, m3={fileNo:3, title:'Post-mortems Written', subtext:'Every ticket has cross-role retrospective', note:'— filed per ticket, countersigned by PM.', redacted:{width:'w-[110px]'}}, m4={fileNo:4, body:{type:'number',value:'3'}, title:'Guardrails in Place', note:'Bug Found Protocol, per-role retro logs, audit script', redacted:{width:'w-[90px]'}}).
- **Verify:** Dev server `/about` — 4 cards render with dark top bars, numbers/titles/notes visible; m2 shows 140px redaction bar AND visible subtext + note (key assertion). tsc exits 0.

### Step 4 — RoleCard rewrite (D-4/D-5/D-6/D-7/D-8)
- **Files:** EDIT `frontend/src/components/about/RoleCard.tsx` (delete `ROLE_ANNOTATIONS` const, delete `annotation` + `redactArtefact` props, delete marginalia `<div>` + RedactionBar import; add `<FileNoBar fileNo={n} label="PERSONNEL" />` inside shell; add 40px charcoal rule between role name and OWNS; role name font-size computed `role.length<=2?'text-[36px]':'text-[32px]'`; owns text `font-italic italic text-ink text-[14px] leading-[1.5]`; artefact text `font-mono text-[12px] text-ink leading-[1.5]` — remove `text-muted`; keep OWNS/ARTEFACT labels `font-mono text-[10px] text-muted uppercase tracking-[2px]`); EDIT `frontend/src/components/about/RoleCardsSection.tsx` (delete h2 "The Roles", replace subtitle `<p data-section-subtitle>` with Pencil s3Intro literal `"— Each role a separate agent with spec'd responsibilities. Every handoff produces a verifiable artefact."` styled `font-italic italic text-[15px] text-ink leading-[1.6]`; ROLES array add `fileNo:1..6` in order PM/Architect/Engineer/Reviewer/QA/Designer; remove `redactArtefact` entirely from data).
- **E2E:** DELETE `frontend/e2e/about-v2.spec.ts:269-290` (AC-022-ANNOTATION describe block) with inline replacement comment `// AC-022-ANNOTATION retired per K-034 §5 drift D-4 — POSITION/BEHAVIOUR marginalia removed; Pencil SSOT has no such labels.`; MODIFY `frontend/e2e/about.spec.ts:205` `getByText('Anatomy of a Ticket', { exact: true })` target unchanged (label comes from SectionLabelRow `Nº 04 — ANATOMY OF A TICKET`; section h2 deletion does NOT break this assertion because it targets label row, not h2 — **verify by running spec after Step 8**).
- **Verify:** Dev server `/about` — 6 role cards with FILE Nº 01-06 · PERSONNEL bars; Reviewer artefact text plainly visible; PM/QA role names 36px others 32px; no POSITION/BEHAVIOUR text.

### Step 5 — PillarCard rewrite (D-9 through D-13 + CARD-SHELL-UNIFIED)
- **Files:** EDIT `frontend/src/components/about/PillarCard.tsx` (new props `{fileNo, title, body, quoteText, linkText, docsHref}`; remove `layerLabel` prop; use `<FileNoBar fileNo={fileNo} label="PROTOCOL" />`; title `font-display font-bold italic text-[26px] text-ink leading-[1.15]`; add 40px rule below title; body wrapper styled `font-italic italic text-ink text-[14px] leading-[1.6]` — consumer passes JSX content; quote wrap `<div className="border-l-[3px] border-brick pl-[14px]"><em className="font-display font-bold italic text-brick text-[14px] leading-[1.55] not-italic">{quoteText}</em></div>` — note: `<em>` + `italic` class needed because `font-display` has no implicit italic; link `<a href={docsHref} className="font-mono text-[11px] text-ink tracking-[1px] hover:text-brick">{linkText}</a>` — drop `font-italic italic underline`); EDIT `frontend/src/components/about/ReliabilityPillarsSection.tsx` (h2 "How AI Stays Reliable" restyled `font-display font-bold italic text-[30px] text-ink leading-[1.2]` — matches Pencil s4Intro; delete `<p data-section-subtitle>` subtitle — Pencil UXy2o has no intro subtitle; pass `fileNo=1/2/3` + `linkText="→ Per-role Retrospective Log protocol"` / `"→ Bug Found Protocol"` / `"→ Role Flow"` per card).
- **E2E:** MODIFY `frontend/e2e/about-v2.spec.ts:240-263` (AC-022-LAYER-LABEL describe block) — update array from `['LAYER 1','LAYER 2','LAYER 3']` to `['FILE Nº 01 · PROTOCOL','FILE Nº 02 · PROTOCOL','FILE Nº 03 · PROTOCOL']`; add inline comment `// K-022 AC-022-LAYER-LABEL Sacred retired per K-034 §5 drift D-10 — Pencil SSOT now specifies FILE Nº · PROTOCOL pattern unified with card FILE Nº motif.`; MODIFY `frontend/e2e/about.spec.ts:153` + `frontend/e2e/pages.spec.ts:65` — `getByText('How AI Stays Reliable', { exact: true })` still matches (h2 text unchanged, only style changes).
- **Verify:** Dev server `/about` — 3 pillar cards with FILE Nº 01-03 · PROTOCOL bars; Bodoni 26 italic titles; brick quote blocks; Geist Mono plain-link per card.

### Step 6 — TicketAnatomyCard rewrite (D-14/D-15 + CARD-SHELL-UNIFIED)
- **Files:** EDIT `frontend/src/components/about/TicketAnatomyCard.tsx` (new props `{fileNo, id, caseNo, title, outcome, learning, githubHref}`; replace flex row+badge with `<FileNoBar fileNo={fileNo} label="CASE FILE" trailing={id} />`; body: `<span className="font-italic italic text-[13px] text-muted">Case Nº {caseNo}</span>` + `<h3 className="font-display font-bold italic text-[26px] text-ink leading-[1.15] mt-1">` + 40px rule + OUTCOME label + outcome body Newsreader italic 13 ink + LEARNING label + learning body Newsreader italic 13 **brick** (`text-brick`) + `<ExternalLink href={githubHref} className="font-mono text-[11px] text-ink tracking-[1px] hover:text-brick">→ View {id} on GitHub</ExternalLink>`); EDIT `frontend/src/components/about/TicketAnatomySection.tsx` (delete h2 "Anatomy of a Ticket"; replace subtitle with Pencil s5Intro literal `"— Anatomy of a ticket. Three cases, each filed in full with outcome and learning."` styled `font-italic italic text-[15px] text-ink leading-[1.6]`; TICKETS array add `fileNo:1/2/3` + `caseNo:'01'/'02'/'03'`).
- **E2E:** MODIFY `frontend/e2e/about.spec.ts:205` + `about-v2.spec.ts:225` — `getByText('Anatomy of a Ticket', { exact: true })` must change target to `getByText('— Anatomy of a ticket. Three cases, each filed in full with outcome and learning.', { exact: true })` OR to SectionLabelRow `Nº 04 — ANATOMY OF A TICKET` (which is already asserted). Engineer picks one; recommend SectionLabelRow (already exists, stable).
- **Verify:** Dev server `/about` — 3 ticket cards with FILE Nº 01-03 · CASE FILE + K-002/K-008/K-009 right; Bodoni titles; brick LEARNING text.

### Step 7 — ArchPillarBlock rewrite (D-16/D-17/D-18 + CARD-SHELL-UNIFIED)
- **Files:** EDIT `frontend/src/components/about/ArchPillarBlock.tsx` (new props `{layerNo, category, title, fields}` where `type FieldEntry = {kind:'label-value'; label:string; value:string}` and `type TestingRowEntry = {kind:'testing-row'; number:string; layer:string; detail:string}`; `fields: Array<FieldEntry|TestingRowEntry>`; use `<FileNoBar fileNo={layerNo} label={category} prefix="LAYER Nº" />`; title `font-display font-bold italic text-[24px] text-ink leading-[1.15]`; 40px rule below title; render each field: label `<span className="font-mono text-[10px] text-muted tracking-[2px] uppercase">{field.label}</span>` + value `<p className="font-italic italic text-ink text-[14px] leading-[1.6]">{field.value}</p>`; for testing-row: `<div className="flex gap-[10px] items-start"><span className="font-display font-bold text-brick text-[22px] leading-none">{number}</span><div><span className="font-mono text-[10px] text-muted tracking-[2px] uppercase">{layer}</span><p className="font-italic italic text-ink text-[13px] leading-[1.55] mt-[3px]">{detail}</p></div></div>`); EDIT `frontend/src/components/about/ProjectArchitectureSection.tsx` (delete h2 "Project Architecture"; replace subtitle with Pencil s6Intro literal `"— How the codebase stays legible for a solo operator + AI agents."`; pass 3 arch blocks with `layerNo=1,category='BACKBONE',title='Monorepo, contract-first',fields=[{kind:'label-value',label:'BOUNDARY',value:'Frontend (React/TypeScript) and backend (FastAPI/Python) live in one repo.'},{kind:'label-value',label:'CONTRACT',value:'Every cross-layer change starts with a written API contract mapping snake_case (backend) ↔ camelCase (frontend) — parallel agents implement against it.'}]` and `layerNo=2,category='DISCIPLINE',title='Docs-driven tickets',fields=[{kind:'label-value',label:'SPEC FORMAT',value:'Acceptance Criteria are written in Behavior-Driven Development (BDD) style — Given/When/Then/And scenarios — so every Playwright test mirrors the spec 1:1.'},{kind:'label-value',label:'FLOW',value:'PRD → docs/tickets/K-XXX.md → role retrospectives.'}]` and `layerNo=3,category='ASSURANCE',title='Three-layer testing pyramid',fields=[{kind:'testing-row',number:'01',layer:'UNIT',detail:'Vitest (frontend), pytest (backend).'},{kind:'testing-row',number:'02',layer:'INTEGRATION',detail:'FastAPI test client.'},{kind:'testing-row',number:'03',layer:'E2E',detail:'Playwright, including a visual-report pipeline that renders every page to HTML for human review.'}]`).
- **E2E:** MODIFY `frontend/e2e/about.spec.ts:247-248` — `getByText('Project Architecture', { exact: true })` must change to target SectionLabelRow `Nº 05 — PROJECT ARCHITECTURE` (already asserted stable); `getByText('How the codebase stays legible for a solo operator + AI agents.', { exact: true })` becomes `getByText('— How the codebase stays legible for a solo operator + AI agents.', { exact: true })` (em-dash prefix). MODIFY `frontend/e2e/about-v2.spec.ts:386-499` (AC-029-ARCH-BODY-TEXT + AC-029-TICKET-BODY-TEXT): `arch-pillar-body` testid currently on body wrapper — must be preserved on the new arch body container; `arch-pillar-layer` testid must stay on pyramid layer spans; `ticket-anatomy-body` + `ticket-anatomy-id-badge` testids must survive the rewrite (preserve for K-029 color assertion compatibility).
- **Verify:** Dev server `/about` — 3 arch cards with LAYER Nº 01-03 bars; structured label/value fields; pyramid with brick numbers.

### Step 8 — PageHeaderSection rewrite (D-19/D-20/D-21)
- **Files:** EDIT `frontend/src/components/about/PageHeaderSection.tsx` (remove `text-center`; split h1 into two lines — option: single h1 with two spans using `display:block` or `flex flex-col gap-[18px]` wrapper with two `<h1>` / `<span>`; line 1 `"One operator, orchestrating AI"` text-ink; line 2 `"agents end-to-end —"` text-brick; both `font-display font-bold italic text-[64px] leading-[1.05]`; divider class `h-px bg-charcoal w-full` — drop `max-w-sm mx-auto`; role line `"PM, architect, engineer, reviewer, QA, designer."` `font-italic italic text-[18px] text-ink leading-[1.5]`; tagline `"Every feature ships with a doc trail."` `font-display font-bold italic text-[22px] text-ink leading-[1.4]`; outer wrapper `py-20 text-left flex flex-col gap-[18px]` — gap matches Pencil `titleColumn.gap:18`).
- **E2E:** `about-v2.spec.ts:82-100` AC-022-HERO-TWO-LINE — `getByRole('heading', { level: 1 })` `toContainText('One operator, orchestrating AI')` still matches line 1; verify; tagline test unchanged.
- **Verify:** Dev server `/about` — hero is left-aligned, 2 text lines with visually distinct colors (ink + brick), full-width charcoal hairline spans container, role line + tagline follow.

### Step 9 — Sacred retirement annotation sweep (AC-034-P2-SACRED-RETIRE)
- **Files:** EDIT the origin ticket(s):
  - `docs/tickets/K-022-about-v2-spec.md` (or wherever K-022 Sacred lives) — annotate AC-022-DOSSIER-HEADER + AC-022-LAYER-LABEL with blockquote `> **Retired 2026-04-23 by K-034 Phase 2 §5 drift audit** — Pencil SSOT supersedes pre-Phase-0 AC Sacred clauses per Q6c + feedback_pm_ac_pen_conflict_escalate. AC text body preserved as historical record.`
- **Verify:** grep confirms annotation landed in both AC blocks.

### Step 10 — Dev-server visual verification across all 4 routes
- Run `npm run dev` (or already-running); visit `/`, `/about`, `/business-logic`, `/diary`, `/app` at viewport 1280×800 in browser. Confirm `/` and `/business-logic` and `/diary` look visually identical to pre-Phase-2 state. `/about` looks like Pencil screenshots. `/app` still has dark background + no chrome.
- Stop if any cross-route visual regression — not in Phase 2 scope.

### Step 11 — Full test suite
- `npx tsc --noEmit` → exits 0
- `npx playwright test` → all green (with modified specs from Steps 1/4/5/6/7/8); no `--update-snapshots`.
- `python -m py_compile` — N/A (no .py changes).
- Snapshot baseline policy (AC-034-P2-SNAPSHOT-POLICY): zero new `-snapshots/*.png` blobs unless paired with a corresponding Pencil PNG re-export.

### Step 12 — Commit
- File classes: `frontend/src/**` + `frontend/e2e/**` + `docs/tickets/**` + `docs/designs/**` → **Full gate** already run in Step 11. Commit per K-Line conventions (English message, `co-authored-by` footer).

### Step 13 — Reviewer + QA + Deploy (per ticket Phase 2 flow)
- Reviewer: two-layer (superpowers breadth + reviewer.md depth including Pencil-parity gate per AC-034-P2-DESIGNER-ATOMICITY mtime-chain check).
- QA: full Playwright suite + visual report + Pencil side-by-side.
- PM: ruling on findings; Deploy Record (AC-034-P2-DEPLOY) with bundle-content probes.

### Parallelization note
Steps 3–8 can run in any order after Steps 1–2 complete. Step 9 is Sacred-cascade dependent (do near end). Step 10 cannot parallelize (visual verification). Steps 11–13 strictly sequential.

---

## §8 Pre-Design Audit — Code-Level Dry-Run

### 8.1 Files inspected (truth table)

| File | Current Read source | What was verified | Drift impact |
|------|--------------------|--------------------|--------------|
| `frontend/src/pages/AboutPage.tsx` | HEAD (`cat -n` via Read) | 74 lines; 8 top-level components imported + SectionLabelRow inline; lines 3, 33 carry DossierHeader | Step 1 target |
| `frontend/src/components/about/DossierHeader.tsx` | HEAD | 21 lines; `data-testid="dossier-header"`; `fileNo` default "K-017 / ABOUT" | Step 1 target (delete) |
| `frontend/src/components/about/MetricCard.tsx` | HEAD | 24 lines; `text-center`; `font-mono font-bold text-ink text-base` title; `text-muted text-sm` subtext; conditional RedactionBar replaces subtext | Step 3 target (rewrite) |
| `frontend/src/components/about/RoleCard.tsx` | HEAD | 69 lines; `ROLE_ANNOTATIONS` const; marginalia `<div>` lines 54-64; `redactArtefact` prop | Step 4 target (rewrite) |
| `frontend/src/components/about/PillarCard.tsx` | HEAD | 43 lines; inline dark bar lines 22-26; `font-mono font-bold text-ink text-base` title; `border-l-2 border-ink/20` quote | Step 5 target (rewrite) |
| `frontend/src/components/about/TicketAnatomyCard.tsx` | HEAD | 46 lines; top flex row with badge + GitHub link; `font-mono font-semibold text-ink text-sm` title; muted body | Step 6 target (rewrite) |
| `frontend/src/components/about/ArchPillarBlock.tsx` | HEAD | 34 lines; `font-mono font-bold text-ink text-sm` title; ReactNode `body`; optional `testingPyramid[]` list | Step 7 target (rewrite) |
| `frontend/src/components/about/PageHeaderSection.tsx` | HEAD | 29 lines; `text-center py-20`; single `<h1>` with inline `<span>` split; `max-w-sm mx-auto` divider | Step 8 target (rewrite) |
| `frontend/src/components/about/MetricsStripSection.tsx` | HEAD | 49 lines; METRICS array 4 entries with title/subtext/redacted | Step 3 target (rewrite data) |
| `frontend/src/components/about/RoleCardsSection.tsx` | HEAD | 66 lines; ROLES array 6 entries with `redactArtefact` flags | Step 4 target (rewrite data) |
| `frontend/src/components/about/ReliabilityPillarsSection.tsx` | HEAD | 60 lines; 3 pillars; LAYER 1/2/3 literals | Step 5 target (rewrite data + h2 style) |
| `frontend/src/components/about/TicketAnatomySection.tsx` | HEAD | 59 lines; TICKETS array with outcome/learning | Step 6 target (rewrite data) |
| `frontend/src/components/about/ProjectArchitectureSection.tsx` | HEAD | 60 lines; 3 arch blocks with `body` JSX + testingPyramid | Step 7 target (rewrite data) |
| `frontend/src/components/primitives/CardShell.tsx` | HEAD | 26 lines; confirmed `bg-paper`, padding variants `sm`/`md`/`lg` → `p-3`/`p-5`/`p-6` | Informs FileNoBar negative-margin values |
| `frontend/src/components/UnifiedNavBar.tsx` | HEAD | 102 lines; TEXT_LINKS; D-22 audit deferred — confirmed unchanged scope | TD-K034-P2-14 |
| `frontend/src/components/shared/Footer.tsx` | HEAD (existing) | Phase 1 Footer; frozen per BQ-034-P2-QA-04 | No changes |
| `frontend/design/specs/about-v2.frame-*.json` (all 7) | HEAD (newly untracked) | All JSON structure verified; text content verbatim-cited in §3 / §7 per visual-spec gate | SSOT for all code-side drifts |
| `frontend/e2e/about-v2.spec.ts` | HEAD | 493 lines; AC-022-DOSSIER-HEADER (L61-75), AC-022-ANNOTATION (L269-290), AC-022-LAYER-LABEL (L240-263), AC-022-HERO-TWO-LINE (L82-100), AC-029 (L386-499) | Steps 1/4/5/7/8 E2E targets |
| `frontend/e2e/about.spec.ts` | HEAD | 326 lines; AC-017-PILLARS (L150-…), AC-017-TICKETS (L202-…), AC-017-ARCH (L244-…) text assertions | Steps 5/6/7 E2E targets |
| `frontend/e2e/pages.spec.ts` | HEAD | L62-65 DiaryPage + AboutPage references to "How AI Stays Reliable" | No change needed (h2 preserved in Step 5) |

### 8.2 §API 不變性證明 (dual-axis)

- **Wire-level schema diff:** `git diff HEAD -- backend/` = 0 lines (no backend changes planned). ✓
- **Frontend observable behavior diff table:**

| Observable | OLD | NEW | Axis |
|-----------|-----|-----|------|
| HTTP request count from /about | 0 | 0 | network ✓ identical |
| DOM: `[data-testid="dossier-header"]` count | 1 | 0 | retired per D-1 ✓ |
| DOM: `[data-annotation]` count | 6 | 0 | retired per D-4 ✓ |
| DOM: `h1` count on /about | 1 | 1 (still one — either inline 2-line or split h1 per §7 Step 8; Engineer keeps single h1 accessibility contract) | identical ✓ |
| DOM: `[data-testid="section-label"]` count | 5 | 5 | identical — SectionLabelRow unchanged ✓ |
| DOM: `footer` element count | 1 | 1 | identical — Footer frozen ✓ |
| DOM: `nav` (UnifiedNavBar) count | 1 | 1 | identical — NavBar frozen ✓ |
| Visual: Pencil-side-by-side `/about` | 27 drifts | 0 drifts (24 fixed + 3 deferred) | improved ✓ |

### 8.3 Pre-existing claim citations

- **Claim: "CardShell `padding='md'` = `p-5` = 20px":** verified — `git show HEAD:frontend/src/components/primitives/CardShell.tsx:L17` → `const paddingClass = padding === 'sm' ? 'p-3' : padding === 'md' ? 'p-5' : 'p-6'`. FileNoBar negative margins derived: `md` → `-mx-5 -mt-5`; `lg` → `-mx-6 -mt-6`.
- **Claim: "SectionLabelRow `bg-[#8B7A6B]` matches Pencil `s*Line.fill`":** verified — `git show HEAD:frontend/src/pages/AboutPage.tsx:L22` → `<div className="flex-1 h-px bg-[#8B7A6B]" data-section-hairline />`. Pencil `BF4Xe.s2Head.s2Line.fill = "#8B7A6B"`. Match.
- **Claim: "Footer already Phase-1-unified":** verified — `git show HEAD:frontend/src/components/shared/Footer.tsx` exists; Phase 1 retro confirms; BQ-034-P2-QA-04 ruling freezes it.

---

## §9 Self-Diff Verification (mandatory per memory rule)

### Structural content edit targets (this design doc)

- **§3 Drift table:** 27 rows × 5 columns. Source of truth: ticket §5 table (27 rows). Row count: 27 vs 27 ✓
- **§1 Frame inventory:** 9 rows (7 about-v2 frames + 86psQ Phase 1 + 35VCj full). Source: `frontend/design/specs/about-v2-manifest.md`. Row count: 9 vs manifest 9 rows in its "Frame Inventory" table ✓
- **§2.1 Component inventory:** 17 rows. Source: `ls frontend/src/components/about/ + frontend/src/pages/AboutPage.tsx + shared/Footer.tsx + CardShell + new FileNoBar`. Spot check: `ls frontend/src/components/about/` → 13 `.tsx` (ArchPillarBlock, DossierHeader, MetricCard, MetricsStripSection, PageHeaderSection, PillarCard, ProjectArchitectureSection, RedactionBar, ReliabilityPillarsSection, RoleCard, RoleCardsSection, TicketAnatomyCard, TicketAnatomySection). Plus UnifiedNavBar, Footer, CardShell, SectionContainer, ExternalLink, new FileNoBar = 19 total — minus 2 already in shared primitives not itemized = 17 (as shown). ✓
- **§5 Route Impact Table:** 5 rows (all 5 routes). Source: architecture.md Frontend Routing section. ✓
- **§7 Implementation order:** 13 steps. Mapped to 24 code-side drifts + sacred retirement + visual + tests + deploy. Drift ↔ step mapping:
  - Step 1: D-1
  - Step 2: foundational (no drift directly)
  - Step 3: D-2, D-3, D-7 (MetricCard bar)
  - Step 4: D-4, D-5, D-6, D-7 (RoleCard bar), D-8, D-26 (S3 subtitle), D-27 (S3 h2)
  - Step 5: D-7 (PillarCard bar), D-9, D-10, D-11, D-12, D-13, D-26 (S4 subtitle→s4Intro), D-27 (S4 h2 retained, restyled)
  - Step 6: D-7 (TicketAnatomyCard bar), D-14, D-15, D-26 (S5 subtitle), D-27 (S5 h2)
  - Step 7: D-7 (ArchPillarBlock bar), D-16, D-17, D-18, D-26 (S6 subtitle), D-27 (S6 h2)
  - Step 8: D-19, D-20, D-21
  - Step 9: Sacred annotation
  - Steps 10–13: verify/commit/deploy
- **§3 column count:** drift-id + component + file+action + JSON source + AC → 5 columns ✓

### AC ↔ Test Case Count cross-check

Ticket §5.1 declares **17 new AC** (AUDIT-DUMP, DRIFT-LIST, DRIFT-D1, D2-D7-CARD-SHELL-UNIFIED, D2-METRIC-CARD-REWRITE, D3, D4, D5, D6, D8-OWNS-ARTEFACT-TYPOGRAPHY, D9-D13, D14-D15, D16-D18, D19-D21, D26-D27, DESIGNER-ATOMICITY, SNAPSHOT-POLICY, SACRED-RETIRE, DEPLOY) — wait, count: 1+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1 = 18. Let me recount against ticket §5.1 verbatim headings:

1. AC-034-P2-AUDIT-DUMP (revised)
2. AC-034-P2-DRIFT-LIST (revised)
3. AC-034-P2-DRIFT-D1
4. AC-034-P2-DRIFT-D2-D7-CARD-SHELL-UNIFIED
5. AC-034-P2-DRIFT-D2-METRIC-CARD-REWRITE
6. AC-034-P2-DRIFT-D3-METRIC-M2-SUBTEXT-VISIBLE
7. AC-034-P2-DRIFT-D4-ROLE-ANNOTATION-RETIRED
8. AC-034-P2-DRIFT-D5-REVIEWER-UNREDACTED
9. AC-034-P2-DRIFT-D6-ROLE-FONT-SIZE
10. AC-034-P2-DRIFT-D8-OWNS-ARTEFACT-TYPOGRAPHY
11. AC-034-P2-DRIFT-D9-D13-PILLAR-CARD-REWRITE
12. AC-034-P2-DRIFT-D14-D15-TICKET-CARD-REWRITE
13. AC-034-P2-DRIFT-D16-D18-ARCH-CARD-REWRITE
14. AC-034-P2-DRIFT-D19-D21-HERO-REWRITE
15. AC-034-P2-DRIFT-D26-D27-SECTION-SUBTITLE
16. AC-034-P2-DESIGNER-ATOMICITY
17. AC-034-P2-SNAPSHOT-POLICY
18. AC-034-P2-SACRED-RETIRE
19. AC-034-P2-DEPLOY

Count = **19 AC**, not 17 as prompt summary said. Prompt summary said "17 new AC" — discrepancy: prompt-summary under-counted by 2. Ticket §5.1 verbatim has 19 top-level `####` AC headings. **BQ flagged to PM for reconciliation** (see §10 BQ list below).

### Same-file cross-table sweep

- `grep -n "DossierHeader\|dossier-header" docs/designs/K-034-phase-2-about-audit.md` → hits only in §2.1 row 2 (retire marker) + §3 D-1 + §7 Step 1 + §8.1 table + §9 verification list. All current-state descriptions aligned with "delete this ticket" ✓
- `grep -n "FileNoBar" docs/designs/K-034-phase-2-about-audit.md` → hits in §2.1 (new primitive), §6.2 (spec), §6.3 (ruling), §6.4 (audit), §7 Steps 2/3/4/5/6/7, §8.1 (primitive introduced). All forward-compatible ✓

### Pre-Write name-reference sweep (K-035 rule)

- `grep -rn "DossierHeader\|dossier-header" frontend/ docs/` → current hits: `DossierHeader.tsx` (to delete), `AboutPage.tsx:3,33` (to edit), `about-v2.spec.ts:61-75` (to delete), `architecture.md:147` (to edit in §10 below), `about-v2-manifest.md` (historical drift doc — preserve). Classification complete.
- `grep -rn "ROLE_ANNOTATIONS\|POSITION\|BEHAVIOUR\|data-annotation\|redactArtefact" frontend/ docs/` → current-state hits: `RoleCard.tsx:9,10,16-23,25,26,43,55-63`, `RoleCardsSection.tsx:8,14,20,26,32,38,59,60`, `about-v2.spec.ts:269-290`. Historical hits to preserve: none (no Changelog mentions).

---

## §10 Architecture.md Sync Plan

**Target:** `agent-context/architecture.md`

**Edits required (to be applied by Architect at handoff):**

1. **Directory Structure `about/` block (L146-L160)** — delete `DossierHeader.tsx` line; delete `RoleCard.tsx` "interface 改為 { role, owns, artefact }" comment becomes "{ role, owns, artefact, fileNo }"; add new `FileNoBar.tsx` line `← K-034 Phase 2 新增；dark FILE Nº / LAYER Nº header bar（5 card consumers）`; update Phase-2 date marker.
2. **Frontend Routing `/about` row (L455)** — update description: `7 sections` list unchanged (PageHeader / MetricsStrip / RoleCards / ReliabilityPillars / TicketAnatomy / ProjectArchitecture / Footer); add note `K-034 Phase 2 (2026-04-23): all 5 card types migrated to Pencil SSOT — FILE Nº / LAYER Nº motif unified via FileNoBar primitive; DossierHeader retired; hero 2-line left-aligned; section h2s deleted in S2/S3/S5/S6; POSITION/BEHAVIOUR retired`.
3. **Shared Components section (L518-L525)** — **NO change** (Footer + UnifiedNavBar rows unchanged; FileNoBar not listed here because it's about-scoped, not sitewide chrome).
4. **Design System `### Tokens` + `### Footer 放置策略` (L469+L506)** — **NO change** (no token additions; Footer frozen).
5. **Changelog (L650 region)** — prepend entry:
   - `- **2026-04-23**（Architect, K-034 Phase 2 設計）— /about full visual audit complete. 27 drifts vs Pencil SSOT (frames voSTK/wwa0m/BF4Xe/8mqwX/UXy2o/EBC1e/JFizO) ruled by PM: 24 code-side + 3 deferred/no-drift + 0 .pen-side. 12 components rewritten or edited: DossierHeader retired (D-1); MetricCard/RoleCard/PillarCard/TicketAnatomyCard/ArchPillarBlock all gain FILE Nº (or LAYER Nº) dark bar via new FileNoBar primitive (components/about/FileNoBar.tsx, 4 consumers + 1 LAYER variant); PageHeaderSection 2-line left-aligned + full-width divider; 4 section h2 deleted (Delivery Metrics / The Roles / Anatomy of a Ticket / Project Architecture — SectionLabelRow is sole heading); s4Intro h2 "How AI Stays Reliable" preserved but restyled Bodoni 30; 3 section subtitles replaced with Pencil literal em-dash intros; S2 subtitle deleted entirely. Role name Bodoni font-size by length (PM/QA=36; others=32); 40px charcoal rules added on role/pillar/ticket/arch card bodies. POSITION/BEHAVIOUR marginalia + ROLE_ANNOTATIONS const + redactArtefact branch all deleted (D-4 / D-5). K-022 AC-022-DOSSIER-HEADER + AC-022-LAYER-LABEL Sacred retired (SACRED-RETIRE). Zero backend changes; zero shared chrome changes (Footer + NavBar frozen per BQ-034-P2-QA-04 + QA-03). 2 E2E spec blocks deleted (AC-022-DOSSIER-HEADER + AC-022-ANNOTATION); ~5 text assertions rewritten to Pencil literals; AC-022-LAYER-LABEL array updated to FILE Nº · PROTOCOL. 設計文件：[K-034-phase-2-about-audit.md](../docs/designs/K-034-phase-2-about-audit.md). 未改 code（Architect 僅設計）.`
6. **Frontmatter `updated:` line** — set to `2026-04-23`.

Edits to architecture.md are performed as part of this Architect task (below).

---

## §11 Tests to modify (summary)

| Spec file | Action | AC touched |
|-----------|--------|------------|
| `frontend/e2e/about-v2.spec.ts` | delete AC-022-DOSSIER-HEADER block (L61-75) + delete AC-022-ANNOTATION block (L269-290) + edit AC-022-LAYER-LABEL array (L240-263) + preserve AC-022-HERO-TWO-LINE (L82-100) + preserve AC-029-ARCH-BODY-TEXT + AC-029-TICKET-BODY-TEXT testid contracts | D-1, D-4, D-10, D-19..21 |
| `frontend/e2e/about.spec.ts` | edit L153 + L205 + L247-248 text assertions to match Pencil literals (or target SectionLabelRow) | D-26 |
| `frontend/e2e/pages.spec.ts` | L62-65 "How AI Stays Reliable" — **no change** (h2 preserved per s4Intro) | — |
| `frontend/e2e/ga-tracking.spec.ts` | none | — |
| `frontend/e2e/shared-components.spec.ts` | none (Footer frozen) | — |

---

## §12 Risks / Known Gaps

- **Mobile viewport seam** (BQ-034-P2-QA-06 Known Gap): 1440px Pencil design; 375/390/414 viewports not part of Pencil SSOT; TD-K034-P2-13 tracks.
- **NavBar structural audit** (D-22 deferred): TD-K034-P2-14 tracks.
- **SectionContainer prop completeness** (D-25 deferred): TD-K034-P2-11 tracks.
- **Prompt-summary vs ticket §5.1 AC-count mismatch**: prompt said "17 new AC"; verbatim ticket enumerates 19. **BQ-034-P2-ARCH-01 raised to PM** — likely counting variant (did prompt summary treat `AUDIT-DUMP (revised)` + `DRIFT-LIST (revised)` as non-"new"? If so 17 correct.). **No blocker for Engineer release** — PM reconciles count in Phase 2 close; all 19 AC enumerated are addressed by §7 implementation steps regardless.
- **TicketAnatomyCard ExternalLink preservation**: Pencil `p*Link` / `t*Link` are plain text; switching from `<ExternalLink>` to `<span>` would drop `target="_blank" rel="noopener noreferrer"` security contract. Architect ruling: **keep ExternalLink wrapper** (preserves security); span-only plain-link appearance achieved via ExternalLink's `className` prop. Engineer verifies the wrapper accepts + forwards className (already confirmed in current TicketAnatomyCard.tsx:24-30).
- **Hero h1 split**: two text nodes in Pencil; accessibility requires single h1 for page. **Architect ruling:** single `<h1>` wrapping two `<span className="block">` (preserves semantic h1; visually renders as two lines via block-span). Line 1 text-ink, line 2 text-brick.
- **FileNoBar CardShell padding coupling**: if any consumer later changes CardShell `padding` prop, negative-margin values must update. Guard: add explicit `cardPaddingSize?: 'md' | 'lg'` prop to FileNoBar (default `'md'` → `-mx-5 -mt-5`; `'lg'` → `-mx-6 -mt-6`) — Engineer implements this explicit prop to prevent silent drift.

---

## §13 Refactorability Checklist

- [x] **Single responsibility:** FileNoBar = header strip only; each card = card layout only; section containers = layout only.
- [x] **Interface minimization:** FileNoBar has 4 props (3 required + 1 optional); other card props minimized.
- [x] **Unidirectional dependency:** `pages/AboutPage` → `components/about/**` → `components/primitives/**`. No cycles.
- [x] **Replacement cost:** swapping FileNoBar (hypothetical new style) affects 1 file + 5 consumer files; contained.
- [x] **Clear test entry point:** each card has data-testid (preserved from K-029); FileNoBar content asserts via visible text (Pencil literals).
- [x] **Change isolation:** no API contract; no shared chrome impact; Footer + NavBar frozen.

---

## §14 Retrospective (mandatory per persona)

**Where most time was spent:** §3 drift-to-file mapping table — cross-referencing 27 drifts to 13 source files to 7 Pencil JSON specs to 3 E2E specs. Each row required per-drift Engineer instructions ordered for dependency.

**Which decisions needed revision:** FileNoBar CardShell coupling was initially "implicit negative margins" (§6.2 draft); upgraded to explicit `cardPaddingSize` prop during §12 risk review to prevent silent padding-drift regression.

**Next time improvement:** When designer manifest already documents drift (as here, `about-v2-manifest.md` flagged D-1 DossierHeader before PM wrote §5), cite manifest row numbers directly in drift table to reduce cross-referencing cost.

---

## Self-Diff Verification

- Section edited: this entire design doc (new file, authoritative for Phase 2)
- Source of truth: `docs/tickets/K-034-about-spec-audit-and-workflow-codification.md` §4.5 + §4.6 + §5 + §5.1 + 7 Pencil JSON specs + `frontend/design/specs/about-v2-manifest.md`
- Row count comparison:
  - Drift table (§3): 27 rows vs ticket §5 27 rows ✓
  - Frame inventory (§1): 9 rows vs manifest 9 rows (7 about + 86psQ + 35VCj) ✓
  - AC coverage: 19 AC enumerated in ticket §5.1 vs 19 references in §3/§7 (AC-034-P2-AUDIT-DUMP = §1 gate; AC-034-P2-DRIFT-LIST = §3 table; AC-034-P2-DRIFT-D{1..27} individual ACs = §3 + §7; AC-034-P2-DESIGNER-ATOMICITY = §1 + §7 Step 13; AC-034-P2-SNAPSHOT-POLICY = §7 Step 11; AC-034-P2-SACRED-RETIRE = §7 Step 9; AC-034-P2-DEPLOY = §7 Step 13). All 19 covered ✓
  - Route Impact Table (§5): 5 rows (/, /about, /business-logic, /diary, /app) vs architecture.md 5 routes ✓
  - Implementation steps (§7): 13 steps ✓
- Same-file cross-table sweep: `grep "FileNoBar" + "DossierHeader"` in this file — all hits classified current-state, historical preserved none. ✓
- Pre-Write name-reference sweep: `grep "DossierHeader\|ROLE_ANNOTATIONS\|redactArtefact\|POSITION\|BEHAVIOUR\|data-annotation\|LAYER 1|LAYER 2|LAYER 3"` in frontend/ + docs/ — current-state hits enumerated in §7 delete/edit steps; historical references not present in this new doc.
- Discrepancy: 1 — prompt summary said "17 new AC"; ticket §5.1 enumerates 19. BQ-034-P2-ARCH-01 filed in §12 to PM; no blocker (all 19 addressed by implementation plan).
