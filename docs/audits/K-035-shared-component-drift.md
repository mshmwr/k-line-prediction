---
ticket: K-035
phase: 2
produced: 2026-04-22
source: PM audit
scope: 4 routes × 4 structural-chrome components (Footer / NavBar / Banner / Hero-strip)
---

# K-035 Shared-Component Drift Audit

## 0. Scope & Method

**Routes audited (per ticket):** `/` (HomePage) · `/about` (AboutPage) · `/diary` (DiaryPage) · `/app` (AppPage)

Route `/business-logic` (BusinessLogicPage) is in the app but **outside K-035 scope**; it is noted in §4 where its footer/navbar choice is material to canonical-component decisions.

**Component candidates audited (D3 expansion, not Footer-only):**

1. **NavBar** — structural top navigation chrome (`UnifiedNavBar.tsx` canonical, legacy `NavBar.tsx` deprecated, `TopBar.tsx` = /app tool-chrome variant)
2. **Footer** — structural bottom chrome (`HomeFooterBar.tsx` + `FooterCtaSection.tsx`, both claim "sitewide" status in their docstrings)
3. **Banner** — sitewide-candidate marketing banner (`BuiltByAIBanner.tsx`)
4. **Hero-strip** — above-the-fold page-header strip (`DossierHeader.tsx` /about, `HeroSection.tsx` /, `DiaryHero.tsx` /diary, none on /app)

**Evidence method per cell:**

- `grep -rn "<Component>" frontend/src/pages/` for import + JSX usage
- Read component file to confirm structural-chrome role (vs content-variant / page-specific body section)
- Cross-reference `docs/designs/K-017 / K-021 / K-022 / K-024 / K-030` for stated intent
- Cross-reference regression specs under `frontend/e2e/sitewide-*.spec.ts` + `pages.spec.ts` for codified behaviour

**Inventory baseline (2026-04-22):**

- `frontend/src/components/` direct children: `ErrorBoundary.tsx`, `MainChart.tsx`, `MatchList.tsx`, `NavBar.tsx` (deprecated), `OHLCEditor.tsx`, `PredictButton.tsx`, `StatsPanel.tsx`, `TopBar.tsx`, `UnifiedNavBar.tsx` + subdirs `about/`, `business-logic/`, `common/`, `diary/`, `home/`, `primitives/`
- `frontend/src/components/shared/` **DOES NOT EXIST** — there is no shared-component registry directory; "sitewide" components live inline in `components/home/` or at the top level. This itself is a drift pre-condition (§5 Drift #0 structural).

---

## 1. Drift Matrix

| Component | `/` | `/about` | `/diary` | `/app` | Canonical path (today) | Canonical path (proposed) | Notes |
|-----------|-----|----------|----------|--------|------------------------|---------------------------|-------|
| **NavBar** | shared (`UnifiedNavBar.tsx`) | shared (`UnifiedNavBar.tsx`) | shared (`UnifiedNavBar.tsx`) | n-a (`TopBar.tsx` tool-chrome; K-030 intentional) | `src/components/UnifiedNavBar.tsx` | `src/components/shared/NavBar.tsx` (move + rename) | NavBar is structurally unified across marketing routes; `/app` divergence is intentional (K-030 §2.4). Only drift = *location* (top-level vs `shared/`). |
| **Footer** | shared (`HomeFooterBar.tsx`) | **inline** (`FooterCtaSection.tsx`) | missing (intentional — K-024) | n-a (K-030 §2.5 removed; intentional) | split — `components/home/HomeFooterBar.tsx` + `components/about/FooterCtaSection.tsx` | **BQ-D1 to user** — one Footer with props vs two sibling Footer components | **This is the K-035 root drift.** Two sibling footer files both claim "sitewide" via docstring; `/about`'s inline variant is a structurally different "CTA + privacy footer" vs `/`'s "contact info + privacy footer". Docstrings are both stale (see §3). |
| **Banner** (BuiltByAIBanner) | shared-candidate (`BuiltByAIBanner.tsx`, only consumer = `/`) | missing | missing | n-a | `components/home/BuiltByAIBanner.tsx` | Stays in `components/home/` OR promote to `shared/Banner.tsx` if future routes consume | Currently consumed only on `/`; not a drift today but flagged as a **reuse-candidate** — if /diary or /about ever renders an AI-collab banner, Engineer must reuse this, not re-create. |
| **Hero-strip** | `HeroSection.tsx` (/ content) | `DossierHeader.tsx` + `PageHeaderSection.tsx` (/about content) | `DiaryHero.tsx` (/diary content) | n-a (`TopBar.tsx` = tool chrome, no hero) | n/a (each is page-specific content) | n/a | Hero-strip entries are **content-variant**, not structural chrome. Declaring them "drift" would be a category error — each page intentionally tells a different top-of-page story. **No action required; listed for completeness.** |

### 1.1 Cell legend

- **shared** — route imports the canonical shared component (or the single-source-of-truth file, acknowledging no `shared/` dir exists yet).
- **inline** — route imports a page-dir-local file that structurally duplicates (or diverges from) the shared variant.
- **missing** — route does NOT render this component. Noted as intentional if design doc or prior ticket explicitly says so; flagged as open question otherwise.
- **n-a** — component doesn't apply to this route by explicit design (e.g., `/app` Footer removed by K-030 as part of standalone-tool isolation).
- **shared-candidate** — single-page today, not a drift, but a potential reuse target if future tickets replicate the pattern.

### 1.2 Out-of-scope cells (for reference, not audit items)

- `/business-logic` renders `UnifiedNavBar` + `HomeFooterBar` (same as `/`). If Phase 3 unifies Footer into `components/shared/Footer.tsx`, this route's imports must update too (documented here so Architect includes it in Route Impact Table).

---

## 2. Per-Drift Findings

### Drift #1 — Footer on /about diverges from sitewide Footer (confirmed K-035 root case)

**Status:** Critical — blocks merge of K-035 Phase 3; cross-ticket-referenced as the bug that triggered K-035.

**Current state:**

- `/` and `/business-logic` render `<HomeFooterBar />` (`frontend/src/components/home/HomeFooterBar.tsx`): simple contact-info row + GA privacy line, 11px text, border-top.
- `/about` renders `<FooterCtaSection />` (`frontend/src/components/about/FooterCtaSection.tsx`): "Let's talk →" CTA heading + email mailto link + GitHub/LinkedIn links + GA privacy line.
- Both files live in page-specific directories; no `components/shared/` exists.
- Two files both declare "sitewide" ownership via docstring — both docstrings are stale (see §3).

**Codified anti-pattern (must be removed in Phase 3):**

- `frontend/e2e/sitewide-footer.spec.ts` L88–100 — describe block `AC-021-FOOTER — /about boundary` with test `'/about renders FooterCtaSection, NOT HomeFooterBar'`. Asserts `Let's talk →` visible AND `yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn` count = 0. This test **codifies the drift** and will fail any unification.
- `frontend/e2e/pages.spec.ts` L160–167 — DiaryPage test `'diary page has no FooterCtaSection and no HomeFooterBar'`. This one is *intentional* (K-024 no-footer decision), not an anti-pattern, but Phase 3 Architect must confirm `/diary` still has "no footer" post-unification or BQ to user.

**Root cause timeline:**

1. K-017 (closed 2026-04-20) — introduced `/about` with `FooterCtaSection` as a page-specific CTA footer. No shared Footer existed yet; the AC spec (AC-017-FOOTER) treated it as About-only.
2. K-021 (closed 2026-04-20) sitewide design system — §7 `Footer 放置策略裁決` explicitly chose **Option A** "each page imports its own footer at page end, no Layout component slot." Architect's §7.1 current-state analysis acknowledged both files existed as page-specific consumers. §7 reasoning: Option A was simpler than introducing an AppLayout + conditional. **This is the decision point where the drift was codified rather than resolved.**
3. K-022 (closed 2026-04) — About v2 restructure touched `FooterCtaSection.tsx` for A-7 link-style update; treated Footer as a regression-only surface (§3.10 AC-022-FOOTER-REGRESSION).
4. K-030 (closed 2026-04-21) — Removed Footer entirely from `/app`; added sitewide spec divergence for /app.
5. K-035 (2026-04-22) — User live-site review noticed the drift; Bug Found Protocol triggered.

**Canonical-target options (Architect to finalize in Phase 3 design doc; recommendation, NOT a PM decision):**

- **Option α — One Footer, two variants via prop:** `components/shared/Footer.tsx` with `variant: "minimal" | "cta"`; `/` and `/business-logic` pass `minimal`, `/about` passes `cta`. Keeps structural sharing while preserving content intent. File count drops from 2 to 1.
- **Option β — Two Footer components, one shared directory:** move both into `components/shared/` (`Footer.tsx` = minimal, `CtaFooter.tsx` = CTA) and rename so no file pretends to be sitewide when it isn't. Structural "both are shared chrome" truth is encoded via location.
- **Option γ — Unify to single CTA Footer sitewide:** delete `HomeFooterBar.tsx`; promote `FooterCtaSection.tsx` to sitewide and render on `/`, `/about`, `/business-logic`. Biggest visual change — `/` home bottom becomes "Let's talk" CTA. User BQ.

**Architect must also decide:**

- Whether `/diary` gains a Footer now (new scope) or stays "no footer" (K-024 decision preserved).
- Whether `components/shared/` directory creation is in K-035 scope or spun off as infrastructure TD.

**Anti-pattern assertions to delete in Phase 3:**

- `frontend/e2e/sitewide-footer.spec.ts` describe block `AC-021-FOOTER — /about boundary` (L88–100).
- Any K-017/K-021/K-022 AC that reads "/about renders FooterCtaSection" must be migrated to the new Footer spec; PM will handle AC migration in Phase 3 PRD update.

---

### Drift #2 — Stale consumer-list docstrings on BOTH Footer files

**Status:** Warning — not user-visible, but misleading to any future Engineer reading the file header. Must be fixed as part of Phase 3 Engineer cleanup (not a separate ticket).

**Evidence:**

- `components/home/HomeFooterBar.tsx` L2–9 docstring says: *"Consumer: HomePage / AppPage / BusinessLogicPage（K-021 擴增）. /about 用 `<FooterCtaSection />`，/diary 本票不插入（K-024 決定）。"* — **AppPage removed HomeFooterBar in K-030** (§2.5), so the consumer list is stale by one route.
- `components/about/FooterCtaSection.tsx` L4–11 docstring says: *"Used across all pages: AboutPage, HomePage, DiaryPage."* — **factually wrong on all three claims**. `HomePage` uses `HomeFooterBar`; `DiaryPage` renders no footer; only `AboutPage` imports this file.

**Resolution:** Phase 3 Engineer rewrites the docstring of whatever canonical Footer component survives. Both stale docstrings = result of page-local component being edited without cross-page consumer check — exactly the class of bug `feedback_shared_component_inventory_check.md` now guards against.

---

### Drift #0 (structural, not route-cell) — `components/shared/` directory does not exist

**Status:** Warning — blocks a clean Phase 3 outcome.

**Evidence:** `ls frontend/src/components/shared/` → no directory. "Sitewide" components (UnifiedNavBar at top level, HomeFooterBar under `components/home/`) live in ambiguous locations. A future engineer has no filesystem signal about what's shared vs page-local.

**Resolution direction (Architect to finalize):** Phase 3 creates `frontend/src/components/shared/` and migrates the decided-canonical Footer + `UnifiedNavBar.tsx` into it. `TopBar.tsx` stays at top level (it's /app tool-chrome, not sitewide marketing chrome — acceptable). `NavBar.tsx` deprecated stub: delete in Phase 3 or TD ticket per Architect.

**Why this matters for K-035:** without the shared dir, `components/shared/Footer.tsx` cannot be the canonical path; every per-Drift-#1 option above implies creating this directory. PM is flagging up-front so Phase 3 scope is unambiguous.

---

### Non-drift — Hero-strip (HeroSection vs DossierHeader vs DiaryHero)

**Status:** Not a drift. Documented for completeness because ticket asked about Hero-strip explicitly.

**Evidence:** Each route's hero conveys a different message (`/` = product tagline + CTA to /app; `/about` = FILE Nº dossier header; `/diary` = Dev Diary italic heading + subtitle). Pencil frames (4CsvQ / 35VCj / wiDSi per K-021 §Appendix) encode these as distinct designs. Structural chrome ≠ content variant.

**Open question for Architect:** should a future shared `<SectionLabelRow>` (currently inline in AboutPage.tsx L13–25) be promoted? This is out of K-035 scope but worth noting.

---

## 3. AC ↔ Sacred Cross-Check (per PM persona rule)

K-035 new ACs must not silently conflict with Sacred invariants from K-017 / K-021 / K-022 / K-024 / K-030.

| K-035 AC | Potential conflict with | Ruling | Action |
|----------|-------------------------|--------|--------|
| **AC-035-FOOTER-UNIFIED** — `/about` uses shared Footer; `FooterCtaSection.tsx` deleted or repurposed | **K-021 AC-021-FOOTER** (codifies `/about` = FooterCtaSection; `/` = HomeFooterBar) as enforced by `sitewide-footer.spec.ts` L88–100 | **Option (b) Sacred retires** — K-021's `/about` boundary assertion was a codification of the drift, not of design intent; memory `feedback_shared_component_inventory_check.md` §QA notes the pattern "sitewide spec containing 'route X renders LocalComponent, NOT SharedComponent' = codified bug, not AC". Phase 3 deletes this spec block; PM migrates AC-021-FOOTER wording in PRD §4 Closed Tickets to reflect retirement. | Phase 3 scope item; not a BQ to user. |
| **AC-035-FOOTER-UNIFIED** | **K-017 AC-017-FOOTER** (introduced `FooterCtaSection` with email + GitHub + LinkedIn + GA statement) | **No conflict on content.** Phase 3 design doc must preserve CTA content on whichever route gets the CTA variant (likely `/about`). K-017 Sacred invariants are on *content* (email text, link targets, GA statement text), not on *component file path*. | Phase 3 Architect preserves content; AC-017-FOOTER regression assertions migrate to new component file path. |
| **AC-035-FOOTER-UNIFIED** | **K-022 AC-022-FOOTER-REGRESSION** (A-7 Newsreader italic + underline link style on FooterCtaSection) | **No conflict.** Style is carried forward on whichever component renders the "Let's talk" CTA. | Phase 3 Engineer preserves A-7 link style on CTA variant. |
| **AC-035-NO-DRIFT** — every drift row resolved | **K-024 `/diary` no-footer** (pages.spec.ts L160–167) | **No conflict** iff Phase 3 design doc explicitly preserves `/diary` = missing (intentional). If Architect proposes adding Footer to `/diary`, that's new scope and requires user BQ. | Architect must state `/diary` Footer decision explicitly in design doc §Route Impact Table. |
| **AC-035-NO-DRIFT** | **K-030 `/app` no-footer / no-navbar** (`app-bg-isolation.spec.ts` AC-030-NO-FOOTER, AC-030-NO-NAVBAR) | **No conflict.** /app isolation is sacred; Phase 3 must preserve `/app` as n-a across all chrome components. | Architect's design doc Route Impact Table must mark `/app` = no change for every chrome row. |

**No BQ to user required on Sacred grounds today** — all conflicts resolve via "Option (b) Sacred retires because it codified the drift" or "no conflict, content preserved."

**One BQ surfaces orthogonally from Drift #1 Architect options (α / β / γ):** *"Is the `/about` Footer's 'Let's talk CTA' content intentional (preserved as a variant), or should `/about` adopt the same minimal contact-info footer as `/`?"* — this is a **product / taste decision**, not a Sacred conflict. PM flags for Architect to surface in design doc §BQ section; user rules at Architect review.

---

## 4. Summary

### 4.1 Drift count

- **Critical (blocks merge, must fix in Phase 3):** **1** — Drift #1 Footer divergence on `/about`
- **Warning (Phase 3 cleanup, same scope):** **2** — Drift #2 stale docstrings (both Footer files); Drift #0 missing `components/shared/` directory
- **Open question to surface at Architect review (not a blocker for Phase 3 start):** **1** — `/about` Footer content intent (Architect Option α/β/γ; user BQ at design-doc review)
- **Non-drift flagged for future-ticket inventory discipline:** **2** — BuiltByAIBanner (reuse-candidate), Hero-strip (content-variant by design)

### 4.2 Route cell tally

| Status | Count across 16 audit cells |
|--------|------------------------------|
| shared | 4 (NavBar × 3 routes; Footer × 1 route) |
| inline | 1 (Footer on /about — the K-035 root case) |
| missing (intentional) | 2 (Footer on /diary K-024 intent; Banner on /about and /diary — same "intentional absence") |
| n-a | 3 (NavBar on /app K-030; Footer on /app K-030; Hero-strip on /app TopBar-only) |
| shared-candidate | 1 (Banner on /) |
| content-variant (not-drift) | 4 (Hero-strip on /, /about, /diary; + /app TopBar-as-chrome row counted once) |
| non-applicable total | 16 ✓ |

(Hero-strip row: 3 route-specific content entries + 1 n-a = 4 cells; Banner row: 1 shared-candidate + 2 missing + 1 n-a = 4 cells; NavBar row: 3 shared + 1 n-a = 4 cells; Footer row: 1 shared + 1 inline + 1 missing + 1 n-a = 4 cells. Total = 16.)

### 4.3 Phase 3 scope preview (PM recommendation, Architect finalizes)

1. **Create `frontend/src/components/shared/` directory** (resolves Drift #0).
2. **Decide Footer canonical structure** (Architect Option α / β / γ → user BQ at design-doc review).
3. **Move `UnifiedNavBar.tsx` into `shared/`** (low-risk, opportunistic alongside Footer refactor; OR split to own TD ticket — Architect calls it).
4. **Delete drift-preservation spec block** `sitewide-footer.spec.ts` L88–100 + migrate AC-021-FOOTER wording.
5. **Refresh docstrings** on surviving Footer component (Drift #2).
6. **Add `frontend/e2e/shared-components.spec.ts`** per AC-035-CROSS-PAGE-SPEC (QA scope).
7. **Preserve Sacred invariants:** `/diary` no-footer, `/app` no-navbar/no-footer, K-017 content (email/links/GA text), K-022 A-7 link style.

### 4.4 Open questions for user (before Phase 3 Architect release)

**OQ-1 (product decision, cannot resolve from design + code):** Does `/about` keep its "Let's talk →" CTA footer variant (current content), or adopt the minimal contact-info footer that `/` uses? This determines whether Phase 3 needs a 2-variant Footer (Option α/β) or can unify to one (Option γ).

- PM recommendation: **Option α (variant prop)** — preserves both Pencil designs (4CsvQ minimal, 35VCj CTA) while sharing structure; minimal visual risk. But this is a taste/product call; user's call.

**No other open questions.** All Sacred conflicts resolve cleanly (§3); all technical drifts have concrete fixes; no cell has a blank or "TBD" status.

### 4.5 Phase 3 release readiness

- **Ready to release Architect for Phase 3 design doc**, iff user answers OQ-1 (or explicitly defers OQ-1 to Architect design-doc BQ section — acceptable, just means the BQ chain is Architect → PM → user at design-doc review instead of PM → user now).
- **Not ready** to release Engineer (Phase 3 implementation) until Architect design doc lands and PM Phase Gate on Architect output passes. That is a later gate, not this audit's concern.

