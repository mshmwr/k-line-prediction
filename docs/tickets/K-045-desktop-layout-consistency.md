---
id: K-045
title: Desktop layout consistency across /about, /, /diary — align /about to 1248px content width + 96px horizontal padding per Pencil SSOT
status: open
owner: pm
priority: high
type: refactor
created: 2026-04-24
visual-delta: none
content-delta: none
design-locked: N/A — reason: aligning to existing Pencil SSOT (frames `35VCj` /about + `4CsvQ` / home + `wiDSi` /diary — all 1440 canvas, 1248 content, 96px horizontal padding). No new design needed; K-040 Designer Decision Memo §Item 3 already confirmed Pencil SOT for all 4 routes.
qa-early-consultation: docs/retrospectives/qa.md 2026-04-24 K-045 — real QA spawn complete, 10 Challenges raised, 7 supplemented to AC, 0 Known Gap, 2 N/A (C-9, C-10 out-of-concern), 1 surfaced as BQ-045-05 (PM-ruled Option A Pencil-compliant 1248)
visual-spec: docs/designs/K-024-visual-spec.json (diary SSOT, referenced for cross-page parity targets: contentWidth=1248, desktopHorizontalPaddingPx=96)
parent: N/A
dependencies: K-022 (SectionContainer introduced /about), K-023 (Homepage body-padding pattern `max-w-[1248px] sm:px-24`), K-024 (Diary AC-024-CONTENT-WIDTH 1248px canonical), K-040 (Designer Decision Memo §Item 3 established 1248+96 as cross-route target)
---

# K-045 — Desktop layout consistency across /about, /, /diary

> **Stub authored:** 2026-04-24 per `feedback_pm_reserve_k_id_before_commit.md` (reserve K-ID before any commit / branch / worktree reference).
> **Ticket body filled:** 2026-04-24 after PM Requirement Confirmation Gate + QA Early Consultation (10 Challenges ruled; 7 → AC; 1 → BQ-045-05 Option A Pencil-compliant 1248; 2 N/A).
> **Worktree:** `.claude/worktrees/K-045-desktop-layout-consistency` (branch `K-045-desktop-layout-consistency`, cut from `ef3519d`).

## §1 Problem Statement (one-line)

Desktop viewport rendering of `/about`, `/`, `/diary` is visually inconsistent; mobile is consistent. Root cause: `/about` uses legacy `SectionContainer` primitive (`max-w-5xl` = 1024px content + `px-6` = 24px horizontal, no `sm:` desktop-padding bump), while `/` and `/diary` use the canonical `max-w-[1248px] px-6 sm:px-24` pattern from K-023 / K-024 / K-040 Item 3.

## §2 Scope (enumerated per `feedback_pm_scope_multipage_v2.md`)

**Affected pages (in scope):**
- `/about` — `frontend/src/pages/AboutPage.tsx` — 7 `<SectionContainer>` usages to migrate
- `/` (homepage) — `frontend/src/pages/HomePage.tsx` — **baseline (no change)**; reference container pattern
- `/diary` — `frontend/src/pages/DiaryPage.tsx` — **baseline (no change)**; reference container pattern

**Affected shared primitive:**
- `frontend/src/components/primitives/SectionContainer.tsx` — legacy primitive, `max-w-5xl`/`max-w-3xl` + `py-16` hardcoded; used ONLY by `/about`. Decision deferred to Architect (BQ-045-02). QA C-2 finding makes **remove-and-inline** the recommended option: SectionContainer's `py-16` contributes inter-section spacing that diverges from Pencil `gap:72` SSOT and AC-028-SECTION-SPACING (Home uses `flex flex-col gap-6 sm:gap-[72px]`). Update-in-place also viable but requires changing `py-16` → `py-0` and migrating vertical rhythm to consumer (adds risk of missed section). Architect picks.

**In-scope layout axes (QA C-2 addition):**
- Horizontal: container width `max-w-[1248px]` + padding `px-6 sm:px-24` per Pencil 1248+96 SSOT
- **Vertical (new axis added after QA Early Consultation):** section-to-section gap = **72±2px at desktop (≥640px), 24±2px at mobile (<640px)**, matching Home's `gap-6 sm:gap-[72px]` pattern + AC-028-SECTION-SPACING regression baseline. Inter-section gap must NOT be contributed by per-section `py-*` — either consumer owns `flex gap-*` rhythm (remove-and-inline) or SectionContainer strips `py-*` and consumer adds wrapper (update-in-place).

**Out of scope (enumerated but not touched this ticket):**
- `/business-logic` — password-protected auth screen uses `flex items-center justify-center` centered layout, different category from documentation pages; separate investigation if needed.
- `/app` — K-030 Sacred `app-bg-isolation` requires `/app` stays isolated from sitewide layout; do not touch.
- FileNoBar / PageHero strip layout (QA C-9 N/A — cards are responsive, no fixed px width)
- Role Cards grid breakpoints (QA C-10 N/A — `lg:grid-cols-3` activates at 1024px, container widening 1024→1248 does not cross breakpoint)

**Shared components expected on affected routes (per `feedback_shared_component_inventory_check.md`):**
- NavBar (`frontend/src/components/UnifiedNavBar.tsx`) — unchanged, pre-container sibling
- Footer (`frontend/src/components/shared/Footer.tsx`) — unchanged, post-container sibling (full-bleed per K-034 Phase 1 Sacred byte-identity + K-040 pairwise diff ≤2px)
- BuiltByAIBanner (`frontend/src/components/home/BuiltByAIBanner.tsx`) — HomePage-only, unchanged

## §3 BQ Ruling Log (PM self-decided per BQ Self-Decision Rule)

| BQ | Question | Source consulted | Verdict |
|----|----------|------------------|---------|
| BQ-045-01 | Which page is baseline for the "consistent" target? | Source-1 Pencil: frames `35VCj` (about) / `4CsvQ` (home) / `wiDSi` (diary) all use 1440 canvas + 1248 content + 96px horizontal. Source-2 Ticket: K-040 Designer Decision Memo §Item 3 Table — all 4 routes share 96px horizontal padding. Source-4 Codebase: `HomePage.tsx:22` + `DiaryPage.tsx:42` both use `max-w-[1248px] px-6 sm:px-24`. | `/` and `/diary` are baseline; `/about` must migrate to the same pattern. Pencil SSOT unanimous — no user escalation needed. |
| BQ-045-02 | `SectionContainer.tsx` — update primitive in place vs remove primitive? | Source-4 Codebase: `SectionContainer` used ONLY by `AboutPage.tsx` (7 usages, no other consumer). No Sacred clause locks the primitive. `width="narrow"` used once (PageHeaderSection hero); `width="wide"` used 6× for body sections. QA C-2 surfaced: SectionContainer `py-16` contributes inter-section spacing which diverges from Pencil `gap:72` — either option must address vertical rhythm. | DEFERRED to Architect design. PM recommendation after QA C-2 analysis: **remove-and-inline** is simpler (one variant axis eliminated, matches Home/Diary pattern verbatim, no `py-16` → `py-0` migration risk). Architect final call — both options must satisfy horizontal + vertical axes of §2 Scope. |
| BQ-045-03 | Is `visual-delta` = `none` or `yes`? | Source-1 Pencil: no new design needed — target matches existing frames. Source-3 Memory `feedback_ticket_visual_delta_field.md`: "yes" triggers Designer + design-locked gate; "none" = logic/refactor ticket aligning to existing SOT. | `none` — Engineer-only pathway. Designer not required. No `design-locked` sign-off. |
| BQ-045-04 | Include `/business-logic` in scope? | User report explicitly listed 3 pages; /business-logic has different layout category (auth-centered). `feedback_pm_scope_multipage_v2.md` requires enumeration — done in §2. | OUT of scope; enumerated for audit trail; separate investigation if layout drift surfaces there. |
| BQ-045-05 | Hero (PageHeaderSection) content width — 1248 (Pencil) or 768 (K-022 legacy `max-w-3xl` narrow)? Raised by QA C-3. | Source-1 Pencil `frontend/design/specs/about-v2.frame-wwa0m.json`: titleColumn `b6TgM` has NO `maxWidth` / `width` constraint; inherits parent frame `35VCj` 1248 content zone. Source-2 Ticket: K-022 `AC-022-HERO-TWO-LINE` status **RETIRED 2026-04-23 by K-040**; K-022 has NO Sacred clause locking hero to narrow=768. Source-3 Memory `feedback_all_roles_check_pencil.md`: Pencil is SSOT when no competing Sacred exists. Source-4 Codebase: `SectionContainer.tsx:21` `max-w-3xl` (narrow) not backed by Pencil. Readability check: hero's longest line "One operator, orchestrating AI" = 30 chars at Geist Mono 52px ≈ 900px rendered width, well under 75ch ideal line (75ch × 52px×0.6 = 2340px), so 1248 does not cause line-length problem. | **Option A — Hero migrates to 1248** (same as body sections, Pencil-compliant). PM self-decided per BQ Self-Decision Rule §1 (Pencil SSOT) + §2 (K-022 AC retired, no Sacred conflict) + §3 (memory supports Pencil default). Hero gets the same `max-w-[1248px] px-6 sm:px-24` container as body sections; `width="narrow"` variant is therefore unused and can be dropped if Architect picks remove-and-inline, or retained for theoretical future readable-text need if update-in-place. |

## §4 Acceptance Criteria

**PM Requirement Confirmation Gate:** user brief = align desktop rendering of `/about`, `/`, `/diary` (mobile already consistent). PM interpretation: `/about` migrates to Home/Diary container pattern `max-w-[1248px] px-6 sm:px-24`; hero goes full 1248 per Pencil SSOT (BQ-045-05 Option A); section-to-section vertical gap aligns to Pencil `gap:72`. No changes to /, /diary, /business-logic, /app.

**QA Early Consultation:** complete — 10 Challenges raised by QA sub-agent 2026-04-24, 7 supplemented to AC below (AC-045-CONTAINER-WIDTH, AC-045-SECTION-GAP, AC-045-HERO-LINE-COUNT, AC-045-SECTION-LABEL-X, AC-045-K031-ADJACENCY-PRESERVED, AC-045-SM-BOUNDARY, AC-045-FOOTER-WIDTH-PARITY), 0 Known Gap, 2 N/A (C-9, C-10 out-of-concern — see §2), 1 surfaced as BQ-045-05 and PM-ruled Option A.

### AC-045-CONTAINER-WIDTH — /about content container aligns to 1248px + 96/24px horizontal padding `[K-045]`

**Given** user visits `/about` on any viewport
**When** page finishes loading
**Then** every page-level content container has `max-width: 1248px` (computed style)
**And** at desktop breakpoint (viewport ≥ 640px): horizontal padding = 96px on both left and right (`padding-left: 96px` + `padding-right: 96px`)
**And** at mobile breakpoint (viewport < 640px): horizontal padding = 24px on both sides (`padding-left: 24px` + `padding-right: 24px`)
**And** container is horizontally centred (`margin-left: auto; margin-right: auto`) at viewports wider than 1248px
**And** at viewports narrower than 1248px, container width = viewport width minus horizontal padding (no wasted space)
**And** Playwright asserts: at 1280×800 `/about` every content container's `boundingBox().width === 1248 ± 2` and padding computed style matches 96px
**And** at 375×667 `/about` every content container's padding computed style matches 24px

### AC-045-SECTION-GAP — /about section-to-section vertical rhythm matches Pencil `gap:72` SSOT `[K-045]`

**Given** user visits `/about` on any viewport
**When** page finishes loading
**Then** visual vertical gap between adjacent sections is 72px at desktop (≥640px viewport), 24px at mobile (<640px viewport)
**And** the vertical gap is contributed by a single layout mechanism (either consumer `flex flex-col gap-*` OR per-section `margin-*`, not accumulated from per-section `py-*` summed across adjacent sections)
**And** no section contributes its own `py-16` (128px) that would cause adjacent-section gap to sum to 128+128=256px at desktop
**And** Playwright asserts: at 1280×800 `/about`, for each adjacent section pair `(section[i].bottom, section[i+1].top)`, `Math.abs(section[i+1].getBoundingClientRect().top - section[i].getBoundingClientRect().bottom) === 72 ± 2`
**And** at 375×667 `/about`, the same adjacent-pair delta === 24 ± 2
**And** this AC mirrors Home's existing `AC-028-SECTION-SPACING` (`pages.spec.ts:436-521`) to keep cross-route parity

### AC-045-HERO-LINE-COUNT — /about hero wraps correctly at 1248 content width `[K-045]`

**Given** BQ-045-05 Option A ruled (hero content uses 1248 not 768)
**When** user visits `/about` at 1280×800 desktop
**Then** hero `<h1>` remains visually readable as two conceptual lines (title + accent) per Pencil wwa0m `nolk3` + `02p72` sub-nodes at Geist Mono 52px
**And** hero `<h1>` computed `boundingBox().height` ≈ 109.2 ± 2px (two lines × 52px × 1.05 line-height)
**And** hero role line (`PM, architect, engineer, reviewer, QA, designer.`) renders on a single line at desktop (Geist Mono 16px, `boundingBox().height` ≈ 24 ± 2)
**And** hero tagline (`Every feature ships with a doc trail.`) renders on a single line at desktop (Geist Mono 18px, `boundingBox().height` ≈ 25.2 ± 2)
**And** at 375×667 mobile, hero `<h1>` wraps to 2+ visual lines and tagline `getBoundingClientRect().top >= h1.getBoundingClientRect().bottom - 1` (no overlap, no negative gap)
**And** Playwright asserts hero content remains visible and non-clipped in both viewports

### AC-045-SECTION-LABEL-X — section-label testid horizontal position anchors to content edge `[K-045]`

**Given** user visits `/about` at any viewport
**When** page finishes loading
**Then** each `[data-testid="section-label"]` element (5 labels: Nº 01–05, per K-022 AC-022-SECTION-LABEL) has its left edge aligned to the container's inner left edge
**And** each section's hairline divider has its right edge aligned to the container's inner right edge
**And** at desktop (≥640px): section-label `boundingBox().x === section.wrapper.boundingBox().x + 96 ± 1` and hairline `boundingBox().right === section.wrapper.boundingBox().right - 96 ± 1`
**And** at mobile (<640px): the same relationship with 24 ± 1
**And** Playwright asserts all 5 section-labels satisfy the horizontal anchor in both viewports

### AC-045-K031-ADJACENCY-PRESERVED — K-031 Sacred `#architecture → <footer>` adjacency not broken `[K-045]`

**Given** K-031 Sacred `AC-031-LAYOUT-CONTINUITY` (`about-v2.spec.ts:386-403`) asserts `document.getElementById('architecture').nextElementSibling.tagName.toLowerCase() === 'footer'`
**When** user visits `/about` after this ticket's migration lands
**Then** the DOM structure preserves: `#architecture` element's next DOM sibling is the `<footer>` element (no wrapper inserted between them)
**And** the AboutPage root `<div>`'s last element child is `<footer>` (no `<div id="banner-showcase">` or other wrapper inserted as last child)
**And** implementation MUST use pattern where each section carries its own container classes (either inline `max-w-[1248px] px-6 sm:px-24` on each section element, OR each section wrapped individually) — MUST NOT wrap all 6 body sections inside a single parent wrapper `<div>` that would break `#architecture.nextElementSibling === <footer>`
**And** Playwright asserts the K-031 existing adjacency spec still PASSes after migration (`about-v2.spec.ts:386-403` runs unchanged)

### AC-045-SM-BOUNDARY — exact 640px breakpoint transition correctness `[K-045]`

**Given** user visits `/about`
**When** viewport width is exactly 640px (Tailwind `sm:` activates inclusive at 640px)
**Then** container padding = 96px on both sides (desktop pattern)
**And** at viewport width 639px, container padding = 24px on both sides (mobile pattern)
**And** at viewport width 1440px (Pencil canvas width), container renders identically to Pencil frame `35VCj` — content zone 1248 centred, 96/96 padding, margin-auto
**And** Playwright asserts all three viewport widths (639, 640, 1440) produce expected padding computed styles and container widths

### AC-045-FOOTER-WIDTH-PARITY — Footer full-bleed preserved + cross-route pairwise diff `[K-045]`

**Given** K-034 Phase 1 Sacred enforces Footer byte-identity across /, /about, /diary; K-040 pairwise diff tolerance ≤2px across routes
**When** /about container migration lands
**Then** Footer element is NOT a descendant of the 1248px content container (Footer must remain at AboutPage root level, full-bleed sibling to the content region)
**And** at viewport 1280×800, Footer `boundingBox().width === 1280 ± 2` (full viewport width, NOT capped to 1248)
**And** Footer's parent in DOM is the AboutPage root `<div>` (typically `min-h-screen` wrapper), not a `max-w-[1248px]` wrapper
**And** Footer pairwise diff: at 1280×800, `|footer_about.boundingBox().width - footer_home.boundingBox().width| <= 2` AND `|footer_about.boundingBox().width - footer_diary.boundingBox().width| <= 2`
**And** Playwright asserts Footer width parity across 3 routes at 1280, 1440, 375 viewports

### AC-045-REGRESSION — All prior Sacred ACs preserved `[K-045]`

**Given** prior Sacred ACs that this ticket touches the perimeter of
**When** migration lands
**Then** the following Sacred ACs continue to PASS unchanged:
- K-017 AC-017-FOOTER (Footer CTA structure on /about)
- K-022 AC-022-SECTION-LABEL (5 section labels + hairline on /about)
- K-022 AC-022-REGRESSION (K-017 assertions not regressed)
- K-024 AC-024-CONTENT-WIDTH (/diary 1248 container)
- K-028 AC-028-SECTION-SPACING (/ section gap 72±2 desktop / 24±2 mobile)
- K-031 AC-031-ARCHITECTURE-FOOTER-ADJACENCY (/about `#architecture → <footer>` sibling)
- K-034 Phase 1 Footer byte-identity (cross-route Footer DOM identical)
- K-040 Footer pairwise width diff ≤2px (cross-route Footer geometry parity)
**And** `npx tsc --noEmit` exit 0
**And** full Playwright E2E suite PASS (no regression)

---

### §4a Architect Constraint (MUST be honoured in design doc + implementation)

**MUST honour pattern A: per-section container classes.** Each of the 6 body sections on `/about` carries its own container classes (`max-w-[1248px] px-6 sm:px-24 mx-auto` either inline on each `<section>` or via SectionContainer's updated variant). The AboutPage root `<div>` retains each section as a direct child element (no body-wrapper div inserted between root and sections). Reason: AC-045-K031-ADJACENCY-PRESERVED + K-031 Sacred `about-v2.spec.ts:386-403` assert `#architecture.nextElementSibling === <footer>`; a body-wrapper pattern B (`<div class="max-w-[1248px]"><section id="architecture">…</section></div><footer>`) would place `#architecture` as a child of the wrapper, making its `nextElementSibling` null and breaking the Sacred assertion.

**If Architect believes pattern B is necessary** (e.g., for simplicity / CSS optimisation): do NOT implement it silently. File a BQ `BQ-045-ARCH-NN` to PM with (a) justification, (b) proposed update to AC-031, (c) regression plan for dependent tests. PM arbitrates; user notified. Current baseline forbids pattern B.

**Additional Architect deliverables:**
- BQ-045-02 verdict in design doc §1 (remove-and-inline vs update-in-place) with one-table comparison on: LOC diff, vertical-rhythm migration risk, future consumer flexibility, test surface change
- Per-section `py-*` audit: current SectionContainer `py-16` (128px per section × 6 = 768px stacked) does NOT align with Pencil `gap:72`; design doc must enumerate new vertical rhythm mechanism (consumer `flex flex-col gap-6 sm:gap-[72px]` OR per-section `margin-top`) and reconcile with existing `AC-028-SECTION-SPACING` pattern on Home
- Existing SectionContainer `divider` prop (border-b border-muted/40): design doc must state whether hairline is preserved (likely yes per K-022 AC-022-SECTION-LABEL `And`-clause) and how the new layout encodes it

## §5 Release Status

### §5.1 Architect delivery (completed 2026-04-24)

Architect sub-agent returned `docs/designs/K-045-design.md` (635 LOC). Key outputs:

- **BQ-045-02 verdict:** Option α (remove `SectionContainer.tsx`, inline per-section container classes on each `<section>`) — justified via 12-dimension comparison matrix in §1.1. Single consumer + byte-identity target + `py-16` strip required under β anyway + reduces Sacred surface.
- **Container pattern:** Option C (per-section self-contained container classes; NO body or inner wrapper around the 6 sections). §2.2 captured the near-miss where the initial tree used Home's body+inner-wrapper pattern (broke K-031 `#architecture.nextElementSibling === <footer>`) and revised to per-section root-child tree per ticket §4a Architect Constraint.
- **Vertical rhythm:** margin-top-based (not `flex gap`, because consumer-flex wrapper would break K-031 adjacency). S1 `pt-8 sm:pt-[72px]`; S2–S6 each `mt-6 sm:mt-[72px]`; S6 adds `mb-8 sm:mb-[96px]`. Mirrors Pencil `Y80Iv padding:[72,96,96,96] gap:72` verbatim at desktop.
- **New Playwright assertions:** T1–T19 (19 test IDs) mapped across 7 new AC blocks + existing K-031 spec covers T12/T13.
- **Sacred regression matrix:** 14 clauses cross-checked in design §9; K-031 is primary risk, explicitly mitigated by §2.3 per-section root-child tree.
- **File change list:** AboutPage.tsx MODIFY, SectionContainer.tsx DELETE, SectionLabelRow.tsx ADD, PageHeaderSection.tsx MODIFY (drop `py-20`), about-layout.spec.ts ADD, shared-components.spec.ts EXTEND, architecture.md EDIT.

### §5.2 BQ Closure Log (PM iteration before Architect release)

| BQ | Status | Resolution pointer |
|----|--------|--------------------|
| BQ-045-01 | RESOLVED | ticket §3 (Pencil SSOT + HomePage/DiaryPage baseline) |
| BQ-045-02 | RESOLVED | design doc §1.2 Option α verdict |
| BQ-045-03 | RESOLVED | ticket frontmatter `visual-delta: none` + design doc §0.4 Gate 3 |
| BQ-045-04 | RESOLVED | ticket §2 out-of-scope enumeration |
| BQ-045-05 | RESOLVED | ticket §3 Option A (Pencil-compliant 1248 for hero) |
| BQ-045-ARCH-01 | RESOLVED | PM-corrected ticket §4 + §4a spec filename (`about.spec.ts` → `about-v2.spec.ts`) in this session |

All BQs RESOLVED; no OPEN / DEFERRED-TO-TD. Closure count: **6 RESOLVED, 0 DEFERRED, 0 OPEN**.

TD-K045-01 (`PageContainer` primitive extraction for future Home/Diary/About parity) — optional follow-up flagged by Architect in design §5.1; PM decision: **not filed as TD ticket this session** (trigger condition is "Diary gains inner flex wrapper"; no current need; revisit if K-046+ refactors Diary body).

### §5.2a Code Review delivery (completed 2026-04-24)

Code Reviewer (Step 2 depth pass, subsumes Step 1 breadth) returned `docs/reviews/K-045-review.md`. Verdict: **CODE-PASS, MERGE-READY**.

- Track A (AC T1–T19): 19/19 PASS — 15 in `about-layout.spec.ts` + 4 parametric in `shared-components.spec.ts` (T19 × 3 viewports); all assertions mirror Pencil SSOT numerics with correct FAIL direction; no hardcoded sleeps; `{ exact: true }` honoured.
- Track B (pure-refactor behavior diff): OLD vs NEW truth table (Hero + Body S2–S6 + Root-level DOM); 0 unaccounted divergences; every delta cell maps to an AC or Pencil SOT target.
- Track C (Sacred 14+ clauses): all preserved; K-031 `#architecture.nextElementSibling === <footer>` confirmed green under Option C per-section root-child pattern.
- Step 1 breadth: commit hygiene clean (3 commits single-purpose), tsc exit 0, subset Playwright green, token-retire 4-sub-grep all 0 residues in runtime scope, git status clean (only `node_modules` untracked).

Findings: **0 Critical, 1 Warning, 2 Nit** — see §5.2b.

### §5.2b Review Rulings (PM 2026-04-24)

| Finding | Type | Reviewer suggestion | PM ruling | Rationale |
|---|---|---|---|---|
| **W-1** — T8 mobile non-overlap assertion `tgBox.y >= h1.bottom - 1` allows 0-gap collapse | Warning (low) | accept-as-is (or TD-K045-02 tighten) | **RESOLVED — accept-as-is** | visual-delta=none; mobile hero rhythm has no Pencil SOT (Pencil 1440 canvas only); desktop T5–T7 locks high-traffic viewport; AC text literal compliant; Engineer can tighten if regression surfaces. No TD filed. |
| **N-1** — T10 `.first()` implicit single-label assumption at `about-layout.spec.ts:178` | Nit | no-action | **RESOLVED — no-action** | current SectionLabelRow renders exactly one `data-testid="section-label"` per section; parent ID scoping is correct; latent fragility noted for future designers, no action needed today. |
| **N-2** — T19 Δ=0 is structural invariant under Option C root-child, not fixture coincidence | Nit | no-action (Engineer retro §8 already loaded) | **RESOLVED — no-action** | Engineer retrospective §8 bullet 3 "Invariant proofs belong in spec-file header comments" already documents the cause; cumulative learning captured; not a Sacred violation; no code change required. Future layout-pattern specs expected to inline invariant comments per Engineer "next time improvement" §8. |

**Closure count:** 3 RESOLVED, 0 DEFERRED-TO-TD, 0 OPEN. No Bug Found Protocol 4-step trigger (0 Critical; Warning + Nit = simple PM ruling).

**BQ Closure iteration (`feedback_pm_close_bq_iteration.md`):** `[3 resolved] [0 deferred→TD] [0 open]` — close gate satisfiable at Phase Gate close.

### §5.3 Handoff check (Engineer release)

```
Handoff check:
  worktree=.claude/worktrees/K-045-desktop-layout-consistency (existing),
  qa-early-consultation=docs/retrospectives/qa.md 2026-04-24 K-045 (OK — real QA spawn, 10 Challenges, 7 → AC, 0 Known Gap, 2 N/A, 1 → BQ-045-05 ruled),
  ac-sacred-cross-check=✓ no conflict (AC-045-REGRESSION enumerates K-017/022/024/028/031/034/040 Sacreds preserved; AC-045-K031-ADJACENCY-PRESERVED explicitly protects K-031 Sacred via §2.3 per-section root-child tree; K-022 AC-022-HERO-TWO-LINE RETIRED 2026-04-23 by K-040, no conflict with BQ-045-05),
  shared-component-inventory=complete (NavBar + Footer + BuiltByAIBanner + SectionContainer + SectionLabelRow + PageHeaderSection + 5 page-specific sections enumerated in design §5; §5.1 cross-page duplicate audit; §5.2 target-route consumer scan all aligned),
  route-impact-table=N/A — reason: ticket scoped to /about page-level only; SectionContainer has 1 consumer (/about) per design §5; no global CSS / sitewide token / shared primitive broadcast change,
  visual-delta=none (aligning to existing Pencil SSOT frames 35VCj + 4CsvQ + wiDSi per K-040 Designer Decision Memo §Item 3),
  content-delta=none,
  design-locked=N/A (aligning to existing Pencil SOT; no new design),
  visual-spec=fresh (docs/designs/K-024-visual-spec.json diary SSOT referenced for cross-page parity target 1248+96; no new JSON needed per frontmatter),
  design-doc=docs/designs/K-045-design.md (verified, 635 LOC, 10 sections + §X Consolidated Delivery Gate Summary = OK)
  → OK — Engineer release for Phase 1 (SectionContainer retirement + AboutPage container rewrite)
```

### §5.4 Engineer release pointer

Engineer starts with **Phase 1** per design doc §8:

1. Add `frontend/src/components/about/SectionLabelRow.tsx` (extract from AboutPage inline; 14 LOC, `{ label: string }` prop).
2. Edit `frontend/src/pages/AboutPage.tsx` per design §2.3 tree (6 `<section>` as direct children of root `<div className="min-h-screen">`).
3. Delete `frontend/src/components/primitives/SectionContainer.tsx`.
4. Edit `frontend/src/components/about/PageHeaderSection.tsx` — drop outer `py-20` (vertical rhythm now owned by S1 `<section>` `pt-8 sm:pt-[72px]`).

**Phase 1 commit gate (before Phase 2):**
- `npx tsc --noEmit` exit 0.
- Subset Playwright: `about-v2.spec.ts` + `shared-components.spec.ts` + `sitewide-footer.spec.ts` all green (proves K-031 adjacency + K-034 Phase 1 Footer byte-identity preserved).
- `grep -rn 'SectionContainer' frontend/src/` returns **0 results** (primitive fully retired).

Phase 2 = visual eyeball verification (375 / 640 / 1280 / 1440).  
Phase 3 = E2E spec authoring (T1–T19 in new `about-layout.spec.ts` + AC-045-FOOTER-WIDTH-PARITY in `shared-components.spec.ts`); full suite regression gate.  
Phase 4 = Docs sync (architecture.md 8 cells per design §X.3) + retrospectives.

## §6 Next Gate

Engineer Phase 1 implementation → Phase 1 commit gate → Phase 2 visual eyeball → Phase 3 E2E specs + full suite → Phase 4 architecture.md + retrospectives → **Code Reviewer (COMPLETE 2026-04-24 — CODE-PASS, MERGE-READY; 0 Critical / 1 Warning accept-as-is / 2 Nit no-action; see §5.2a + §5.2b)** → **QA regression (RELEASED 2026-04-24 — full Playwright suite, Sacred cross-route parity, AC-020-BEACON-SPA pre-existing flake acknowledged)** → PM Phase Gate close → deploy (per K-Line Deploy Checklist 4 steps).

## §7 Deploy Record

(Pending ticket close.)

## §8 Retrospective

### Engineer

**AC judgments that were wrong:** None. All 8 AC blocks (AC-045-CONTAINER-WIDTH / SECTION-GAP / HERO-LINE-COUNT / SECTION-LABEL-X / K031-ADJACENCY-PRESERVED / SM-BOUNDARY / FOOTER-WIDTH-PARITY / REGRESSION) mapped cleanly to helpers + assertions; `sectionBoxes()` + `evaluateAll` covered `{top/bottom/left/right/width/paddingLeft/paddingRight/maxWidth}` in one shot, no AC needed interpretive stretching.

**Edge cases not anticipated:**
- Footer snapshot baseline drift on `/about` + `/diary` after Phase 1. Root cause: /about page height shrank 3790→3263 (legitimate — K-045 removed extra vertical whitespace from SectionContainer `py-16` pairs), causing subpixel anti-alias shift at Footer's render band. DOM byte-identity preserved (T1 outerHTML cross-route all equal). Design doc §9 Regression Risk Matrix flagged K-034 Phase 1 byte-identity but did NOT warn that page-height changes could cascade into Playwright pixel-snapshot diffs. Fixed by `--update-snapshots` after validating T1 green + probe spec confirmed DOM unchanged.
- AC-020-BEACON-SPA full-suite flakiness. Not caused by K-045 (verified by `git checkout 00f8ac6 -- AboutPage.tsx PageHeaderSection.tsx SectionContainer.tsx` rerun — same fail). K-020 close commit `cd19a75` labels this as "8/9 green" baseline. Design doc did not enumerate pre-existing flaky specs, so first failure felt like a K-045 regression.

**Next time improvement:**
- Snapshot baseline changes after layout refactor get a 3-line commit message block: (1) DOM byte-identity still asserted by <testname>, (2) pixel diff root cause is <X>, (3) old baseline also fails / does-not-fail on HEAD <sha>. This preempts Reviewer Git Status Commit-Block Gate re-question. Codified in `feedback_engineer_behavior_diff_pure_refactor.md` parallel: extend to cover snapshot-specific refactors.
- Phase 0 pwd check is mandated by §Step 0 but I only caught the wrong-cwd after the first Bash call errored. Add a literal TodoWrite item "pwd = worktree root?" before any Read/Bash in Phase 0 so compact-recovery forces the check. Engineer persona §Step 0 already requires this; enforcement gap is in my session startup not the persona text.
- Invariant proofs belong in spec-file header comments, not commit messages. T19 Δ=0 is the inevitable outcome of Option C root-child pattern (Footer width = viewport width regardless of route), not a fixture coincidence. Future layout-pattern specs should name the invariant + cite the architectural cause in the `describe` block comment.
