---
title: K-034 Phase 3 — /diary adopts shared Footer
ticket: K-034 (Phase 3; absorbs ex-K-038)
owner: Architect
status: design-locked (Phase 3 PM sign-off `design-locked: true` per ticket §4.5, commit 9cdde2f)
pencil-provenance:
  - frontend/design/specs/homepage-v2.frame-86psQ.json (SSOT read-only)
  - frontend/design/specs/homepage-v2.frame-1BGtd.json (SSOT read-only)
  - frontend/design/specs/diary-footer-ssot-decision.md (Designer BQ-034-P3-02 ruling artifact)
visual-delta: yes (new Footer DOM on /diary; no new Pencil frame per BQ-034-P3-01)
updated: 2026-04-23
---

## 0 Scope Questions

None. All ambiguities pre-ruled by PM in ticket §4.3 (BQ-034-P3-01/02/03) + §4.4 (9 QA Challenges) + §4.5 (design-locked sign-off). This design doc is pure implementation specification against 9 `AC-034-P3-*` entries.

---

## 1 Pre-Design Audit

### 1.1 Files inspected (git show HEAD truth table)

| File | HEAD read | Actual state vs pre-existing assumption | Verdict |
|------|-----------|-----------------------------------------|---------|
| `frontend/src/pages/DiaryPage.tsx` | Read HEAD:55 lines | Matches ticket description — hooks + mutually-exclusive terminal-state switch inside `<main>`; root `<div className="min-h-screen">` has no Footer import/render; `<main>` has `px-6 sm:px-24 pb-24 mx-auto max-w-[1248px]` | ✓ confirmed |
| `frontend/src/components/shared/Footer.tsx` | Read HEAD:45 lines | Prop-less `<footer>` element (K-034 Phase 1 landed); JSX comment header lists consuming routes as `/`, `/business-logic`, `/about` and explicitly names `/diary` + `/app` as "NOT rendered on" — header copy must be updated this Phase | ✓ confirmed; requires JSDoc edit (not just JSX add) |
| `frontend/e2e/shared-components.spec.ts` | Read HEAD:133 lines | T1 loop hardcodes `['/', '/about', '/business-logic']`; T4 `test.describe('AC-034-P1-NO-FOOTER-ROUTES — /diary has no Footer rendered')` asserts `locator('footer').toHaveCount(0)` on `/diary`; snapshot `for` loop also hardcodes 3-route list | ✓ confirmed; 3 independent edit sites |
| `frontend/e2e/sitewide-footer.spec.ts` | Read HEAD:88 lines | 3 tests (`/`, `/business-logic` pre-auth, `/business-logic` logged-in) against `expectSharedFooterVisible()` helper; no `/about` or `/diary` in loop (despite `/about` being consumer — pre-existing pattern per comment L10-14, defers `/about` to `shared-components.spec.ts`); 2 consumer-route iterations not a `for` loop — explicit `test(...)` per route | ✓ confirmed; Challenge #6 ruling forces 4-route iteration — requires restructuring to explicit loop OR adding 2 explicit `test()` blocks (`/about` + `/diary`) |
| `frontend/e2e/pages.spec.ts` | Read HEAD:140-170 lines | L161–168 `test.describe('DiaryPage — AC-017-FOOTER no footer', ...)` block with single `test(...)` inside; asserts `getByText` counts 0 for `"Let's talk →"` and `yichen.lee.20@gmail.com` | ✓ confirmed; AC-034-P3-SACRED-RETIREMENT specifies verbatim inline comment replacement |
| `docs/tickets/K-017-about-portfolio-enhancement.md` | Read HEAD L260-294 | `AC-017-FOOTER` block contains three Given/When/Then triples: `/about` (FooterCtaSection), `/` (HomeFooterBar), `/diary` (no footer) — the `/diary` triple at L289-292 is the retirement target | ✓ confirmed |
| `docs/tickets/K-024-diary-structure-and-schema.md` | Read HEAD L408-434 | `AC-024-REGRESSION` Sacred block L411 bullet `K-017 NavBar order + Footer 可見性（/diary 無 Footer 負斷言，見 AC-017-FOOTER）` — the retirement target bullet | ✓ confirmed |
| `docs/tickets/K-034-...md` Phase 1 T4 | grep `AC-034-P1-NO-FOOTER-ROUTES` L276-277 | AC block exists; Phase 1 T4 `/diary` assertion is embedded in this AC (though AC references both `/diary` and `/app`). Retirement edits the `/diary` row only; `/app` preserved. Also edits `shared-components.spec.ts` T4 block (L99-112) which is a pair with this AC. | ✓ confirmed |
| `docs/designs/shared-components-inventory.md` | Read HEAD 57 lines | Footer row already lists `/diary` as consumer + `[^diary-adoption]` footnote already present; "Routes with NO shared chrome" `/diary` bullet already struck through. **Pre-staged during ex-K-038 PM phase; no Engineer edit required.** | ✓ confirmed; inventory Edit already landed |
| `docs/designs/design-exemptions.md` | Read HEAD 45 lines | §2 row 3 "HomePage.tsx Footer render context" covers ancestor-padding INHERITED exemption; no `/diary`-specific row present; `AC-034-P3-VIEWPORT-SEAM-KNOWN-GAP` requires new §2 RESPONSIVE row for the 640–768px seam | ✓ confirmed; one new row Edit required |
| `docs/tech-debt.md` | Read HEAD L1-55 | TD-K034-P3-02 not yet in table; needs append. TD-K034-P3-01 currently absent (no Phase 3 TD yet); `-02` is the first `-P3-*` TD — numbering gap intentional per ticket §AC-034-P3-VIEWPORT-SEAM-KNOWN-GAP wording. | ✓ confirmed; one new row append required |
| `agent-context/architecture.md` | Read L440-523 (Routing + Design System + Shared Components) | `/diary` row L456 still describes pre-Phase-3 state (no Footer mention — correct for pre-Phase-3 state); Footer placement table L514 reads `無 footer (K-024)` — must change to `<Footer />` with Phase 3 reference; Shared Components table L523 Footer row lists 3 consumer routes — must expand to 4 | ✓ confirmed; 3 structural Edit sites + 1 Changelog prepend + frontmatter `updated:` |

### 1.2 §API 不變性 dual-axis

(a) **Wire-level schema diff.** This Phase changes **zero** backend artifacts (no schema, no endpoint, no API response shape). `git diff main -- backend/` is expected to show 0 lines.

(b) **Frontend observable behavior diff table.**

| DiaryPage render branch | OLD `<footer>` count | NEW `<footer>` count | Observable diff |
|------------------------|----------------------|----------------------|-----------------|
| `loading === true` (full-set, fetching /diary.json) | 0 | 1 (Pencil-canonical one-liner + GA disclosure) | Footer appears during loading window — satisfies AC-034-P3-DIARY-FOOTER-LOADING-VISIBLE Option A |
| `error !== null` (subset — fetch non-2xx or network fail) | 0 | 1 (identical DOM) | Footer renders alongside DiaryError retry UI |
| `!loading && !error && entries.length === 0` (empty) | 0 | 1 (identical DOM) | Footer renders alongside DiaryEmptyState |
| `!loading && !error && entries.length > 0` (boundary — happy path timeline) | 0 | 1 (identical DOM) | Footer renders as last sibling after DiaryTimeline + optional LoadMoreButton |

All four observable branches converge to `count === 1` after Phase 3. Pre-Phase-3 all branches were `count === 0` (per retired Sacred). This is a pure **additive** DOM change; no existing DiaryPage content is mutated.

### 1.3 Pre-existing claims cited in this doc

| Claim | Source citation (git show) | Dry-run evidence |
|-------|---------------------------|------------------|
| "Shared Footer is prop-less, Pencil SSOT byte-identical across consumer routes" | `git show HEAD:frontend/src/components/shared/Footer.tsx:L33-44` | Footer returns single JSX literal; no props destructure, no conditional. Pencil JSON `86psQ` + `1BGtd` verified byte-identical per ticket §4.5 PM cross-check table (12 fields identical, 2 fields Pencil-internal-only differ). |
| "DiaryPage root wrapper is `<div className='min-h-screen'>`, Footer can render as last sibling without ancestor-width issue" | `git show HEAD:frontend/src/pages/DiaryPage.tsx:L31` | Root div has no horizontal padding; `<main>` is the padded ancestor (`px-6 sm:px-24 ... max-w-[1248px]`). Footer as sibling of `<main>` → Footer inherits root-div full width (viewport width 1280px at desktop). Matches `/about` pattern (AboutPage root `<div className='min-h-screen'>`, Footer is last sibling at L67) and `/business-logic` pattern (BusinessLogicPage root div, Footer sibling at L117). **No new `design-exemptions.md` §2 row required** — `/diary` joins the "full-bleed Footer sibling" group already characterized by §2 row 3 (HomePage INHERITED entry describes the exception, not the rule). |
| "HomePage Footer renders inside padded ancestor (`sm:pl-[96px] sm:pr-[96px]`), effective width ≠ viewport — cross-route ancestor delta exists" | `git show HEAD:frontend/src/pages/HomePage.tsx:L13,L25` | Root div has `sm:pl-[96px] sm:pr-[96px]`; Footer is last child. T1 byte-identity passes because `<footer>` outerHTML is identical — ancestor padding does not mutate footer DOM. DiaryPage will join the `/about` + `/business-logic` pattern (Footer at root-level, full-bleed). |

All pre-existing claims cited with `git show HEAD:<path>:L<n>` evidence; no bare Read relied upon.

---

## 2 Shared Primitive & Reuse Planning (Cross-Page Duplicate Audit)

```bash
grep -rn "import Footer" frontend/src/
# HEAD state:
#   AboutPage.tsx:9:import Footer from '../components/shared/Footer'
#   HomePage.tsx:6:import Footer from '../components/shared/Footer'
#   BusinessLogicPage.tsx:7:import Footer from '../components/shared/Footer'
```

**Audit decision per component:**

| Component | Decision | Rationale |
|-----------|----------|-----------|
| `shared/Footer.tsx` | **keep existing; add 4th consumer (`DiaryPage.tsx`)** | Prop-less; Pencil SSOT canonical per K-034 Phase 1 unification. Zero inline duplication; 3-consumer pattern already established — adding 4th is additive only. |
| DiaryPage JSX | **no new primitive extraction** | Terminal-state switch (loading/error/empty/timeline) is DiaryPage-local; Footer append is a single line of JSX. No re-usable pattern surfaces. |
| `shared/Footer.tsx` JSDoc header | **update inline (not extract)** | JSDoc "Used on" + "NOT rendered on" lists are documentation, not code; per-file JSDoc is the standard for per-component provenance. |

No new primitive. No component tree changes. Footer `Props` interface remains `{}` (empty, prop-less).

### 2.1 Target-Route Consumer Scan

```bash
grep -rn "to=\"/diary\"\|href=\"/diary\"" frontend/src/
# HEAD state:
#   UnifiedNavBar.tsx:24:  { label: 'Diary', path: '/diary', ... }   (SPA <Link to="/diary">)
#   (DevDiarySection → READ FULL LOG link — verified via separate grep below)
```

```bash
grep -rn "'/diary'\|\"/diary\"" frontend/src/
# Returns: UnifiedNavBar TEXT_LINKS entry + DevDiarySection footer link + useGAPageview map.
```

All `/diary` entry points continue to navigate via SPA (`<Link to="/diary">`); none open new tabs. Phase 3 does NOT change `/diary` navigation behavior. All entry points are `aligned` — no `needs-sync` consumers. (This scan is per K-030 precedent — route-entry-point scan when footer/navbar changes occur, not only when navigation behavior changes; included for defense.)

---

## 3 Technical Solution Selection

### 3.1 Where to place `<Footer />` within DiaryPage JSX

**Option A (recommended):** Render `<Footer />` as **last sibling under the root `<div className="min-h-screen">`** (outside `<main>`).

**Option B:** Render `<Footer />` as last child **inside** `<main>`.

**Option C:** Render `<Footer />` conditionally per terminal state (wrapped in each of the four render branches).

| Dimension | A (root-level sibling) | B (inside main) | C (per-branch) |
|-----------|------------------------|-----------------|----------------|
| Byte-identity with `/about` + `/business-logic` + `/` | ✓ same pattern | ✗ inside content wrapper → different ancestor → same footer DOM but potentially different computed width | ✗ duplicate render sites invite drift |
| AC-034-P3-DIARY-FOOTER-LOADING-VISIBLE | ✓ always renders (outside terminal switch) | ✓ always renders | ✗ must duplicate into loading branch (fragile) |
| Ancestor width matches `/about` (full-bleed sibling) | ✓ | ✗ inherits `max-w-[1248px]` (~1088px at 1280 viewport) — visual delta from `/about` | N/A |
| Pencil SSOT fidelity | ✓ | ✗ constrained width ≠ Pencil canonical | ✓ but 4× code duplication |
| Implementation simplicity | 1 line add | 1 line add (different location) | 4 insertions |

**Recommendation: Option A.** Matches `/about` + `/business-logic` pattern verbatim; gives byte-identical `<footer>` outerHTML + byte-identical ancestor context. Ticket AC-034-P3-DIARY-FOOTER-RENDERS explicitly requires "last sibling under the page root" — this is Option A.

### 3.2 How to restructure sitewide-footer.spec.ts for 4-route loop

**Option α (recommended):** Convert the 3 explicit `test()` blocks into a `for` loop over `['/', '/about', '/business-logic', '/diary']` using `expectSharedFooterVisible()` helper; keep the logged-in `/business-logic` test as a separate non-loop case (different auth fixture setup).

**Option β:** Add 2 new explicit `test()` blocks for `/about` + `/diary` next to the existing 3.

| Dimension | α (loop) | β (explicit) |
|-----------|----------|--------------|
| AC-034-P3-SITEWIDE-FOOTER-4-ROUTES "loop iterates over 4 routes" literal | ✓ satisfies verbatim text | ✗ not a loop (AC text says "route loop") |
| Symmetry / maintainability | ✓ one place to edit on 5th consumer | ✗ copy-paste proliferation |
| Existing logged-in `/business-logic` test fate | preserved as separate block below loop | preserved as-is alongside new blocks |
| Test count parity (4 independent) | ✓ exactly 4 `test()` instantiations per loop iteration | ✓ 4 total (existing 2 + new 2) |

**Recommendation: Option α.** AC-034-P3-SITEWIDE-FOOTER-4-ROUTES §"route loop" phrasing requires loop form; the 2 existing `test('/ ...')` and `test('/business-logic (PasswordForm) ...')` can be consolidated into the loop body. The third existing test (`/business-logic (logged-in state)`) stays separate because it has distinct fixture requirements (JWT injection + post-login wait).

---

## 4 API / Interface Contracts

**No API changes.** No backend endpoint modified. No request/response schema touched.

### 4.1 Footer component props interface (authoritative)

`Props` interface: **empty (zero props).** Per `shared-components-inventory.md` Footer row: **"Allowed variants: 0 (Phase 1 retires `variant` prop per AC-034-P1-FOOTER-UNIFIED)"**.

```
// frontend/src/components/shared/Footer.tsx — TypeScript type signature
export default function Footer(): JSX.Element  // no props parameter
```

**No `variant` prop. No `className` override. No `data-testid` override.** DiaryPage renders `<Footer />` with zero props. Any prop addition requires new AC + inventory Edit + PM ruling per `shared-components-inventory.md` §Edit procedure.

### 4.2 DiaryPage render contract

Terminal-state switch (lines 36-51 in HEAD DiaryPage.tsx) stays **unchanged**. Footer is appended as a **NEW sibling** at the same level as `<main>` within the root `<div className="min-h-screen">`. Order:

```
<div className="min-h-screen">
  <UnifiedNavBar />
  <main ...>
    (DiaryHero + terminal-state switch — unchanged)
  </main>
  <Footer />   ← NEW (last sibling)
</div>
```

**Render branch × Footer matrix** (AC-034-P3-DIARY-FOOTER-LOADING-VISIBLE contract):

| State | UnifiedNavBar | `<main>` (DiaryHero + state branch) | `<Footer />` |
|-------|---------------|-------------------------------------|--------------|
| loading | ✓ | DiaryLoading | ✓ |
| error | ✓ | DiaryError | ✓ |
| empty (entries.length === 0) | ✓ | DiaryEmptyState | ✓ |
| timeline (entries.length > 0) | ✓ | DiaryTimeline + optional LoadMoreButton | ✓ |

All four rows converge to Footer `count === 1`. Falsifiable predicate per AC.

---

## 5 File Change List (Engineer scope)

| # | File | Change type | Responsibility | AC anchor |
|---|------|-------------|----------------|-----------|
| 1 | `frontend/src/pages/DiaryPage.tsx` | Modify (add import + JSX) | Import `Footer` from `'../components/shared/Footer'`; render `<Footer />` as last sibling under root `<div className="min-h-screen">` (after `</main>`, before closing `</div>`) | AC-034-P3-DIARY-FOOTER-RENDERS + AC-034-P3-DIARY-FOOTER-LOADING-VISIBLE |
| 2 | `frontend/src/components/shared/Footer.tsx` | Modify (JSDoc header only — no JSX change) | Update JSDoc "Used on" list from 3 → 4 routes (add `/diary`); remove `/diary` from "NOT rendered on" list; keep `/app` as only entry in "NOT rendered on"; add retirement cross-reference note | AC-034-P3-INVENTORY-UPDATED (parallel doc sync; no AC literal but required by K-034 Phase 2 drift precedent) |
| 3 | `frontend/e2e/shared-components.spec.ts` | Modify | (a) Extend T1 `consumingRoutes` const `['/', '/about', '/business-logic']` → `['/', '/about', '/business-logic', '/diary']`; (b) T1 pairwise assertion block continues to iterate `consumingRoutes` — no other change needed (assertion count auto-scales from 3 → 4 per AC "4 independent assertions"); (c) **DELETE** entire `test.describe('AC-034-P1-NO-FOOTER-ROUTES — /diary has no Footer rendered', ...)` block (L99-112) including T4 test; replace with verbatim comment per AC; (d) Extend `for` loop at L122 `['/', '/about', '/business-logic']` → `['/', '/about', '/business-logic', '/diary']` so 4th snapshot baseline is generated | AC-034-P3-DIARY-FOOTER-RENDERS + AC-034-P3-SACRED-RETIREMENT |
| 4 | `frontend/e2e/sitewide-footer.spec.ts` | Modify | Restructure per Option α §3.2: replace 2 explicit `test('/ ...')` + `test('/business-logic (PasswordForm) ...')` with `for (const route of ['/', '/about', '/business-logic', '/diary'])` loop invoking `expectSharedFooterVisible()` per route; keep `test('/business-logic (logged-in state) — shared Footer still shows')` as separate non-loop block below (distinct auth fixture) | AC-034-P3-SITEWIDE-FOOTER-4-ROUTES (explicit "4 independent assertions" + loop structure) |
| 5 | `frontend/e2e/pages.spec.ts` | Modify | **DELETE entire block L157–168** (header comment L156-159 + `test.describe('DiaryPage — AC-017-FOOTER no footer', ...)` + inner test); replace with single verbatim comment line per AC-034-P3-SACRED-RETIREMENT: `// AC-017-FOOTER /diary negative clause retired per K-034 Phase 3 §BQ-034-P3-03 — user intent change 2026-04-23; Footer now covered by shared-components.spec.ts T1 (byte-identity 4 routes)` | AC-034-P3-SACRED-RETIREMENT (Challenge #4 ruling) |
| 6 | `docs/tickets/K-017-about-portfolio-enhancement.md` | Modify (retirement annotation only — preserve historical AC text) | Insert verbatim blockquote **immediately after L294** (end of the `/diary` Given/When/Then triple at L289-293, before `---` separator): `> **Retired 2026-04-23 by K-034 Phase 3 (absorbs ex-K-038 §3 BQ-034-P3-03)** — user intent change: /diary now renders shared Footer per AC-034-P3-DIARY-FOOTER-RENDERS. AC text body preserved as historical record.` | AC-034-P3-SACRED-RETIREMENT (Challenge #9 Option A — retroactive K-017 annotation) |
| 7 | `docs/tickets/K-024-diary-structure-and-schema.md` | Modify (retirement annotation only — preserve historical bullet text) | At L411 the Sacred bullet reads: `- K-017 NavBar order + Footer 可見性（/diary 無 Footer 負斷言，見 AC-017-FOOTER）`. Append retirement blockquote **immediately below that bullet** (keep bullet text verbatim for historical record): `> **Retired 2026-04-23 by K-034 Phase 3 (absorbs ex-K-038 §3 BQ-034-P3-03)** — user intent change: /diary now renders shared Footer per AC-034-P3-DIARY-FOOTER-RENDERS. AC text body preserved as historical record.` | AC-034-P3-SACRED-RETIREMENT |
| 8 | `docs/tickets/K-034-about-spec-audit-and-workflow-codification.md` Phase 1 T4 row | Modify | In Phase 1 section, `AC-034-P1-NO-FOOTER-ROUTES` block (L276-277): edit the AC body so the route list `/diary and /app` → `/app` only; append retirement blockquote below the AC referencing `/diary` specifically: `> **Retired 2026-04-23 by K-034 Phase 3 (absorbs ex-K-038 §3 BQ-034-P3-03)** — /diary portion only; /app row PRESERVED per K-030 AC-030-NO-FOOTER (distinct rationale). User intent change: /diary now renders shared Footer per AC-034-P3-DIARY-FOOTER-RENDERS. AC text body preserved as historical record.` | AC-034-P3-SACRED-RETIREMENT (AC `/diary` row removal + `/app` preserved) |
| 9 | `docs/designs/shared-components-inventory.md` | **NO EDIT** — already staged during ex-K-038 PM prep (Footer row row already has `/diary` + `[^diary-adoption]` footnote + "Routes with NO shared chrome" `/diary` bullet already struck-through per HEAD read) | verify per Engineer Pre-Implementation check; AC-034-P3-INVENTORY-UPDATED satisfied in prior commit | AC-034-P3-INVENTORY-UPDATED (satisfied pre-Engineer) |
| 10 | `docs/designs/design-exemptions.md` | Modify (append one row in §2 RESPONSIVE category) | Append below current §2 row 4 (PillarCard INHERITED-editorial): `\| Footer.tsx @ /diary \| homepage-v2.pen 86psQ + 1BGtd \| Viewport-padding seam at 640–768px: main ancestor uses px-6 sm:px-24 (24→96 at sm breakpoint 640px), Footer uses px-6 md:px-[72px] (24→72 at md breakpoint 768px) — in the 640–768px window main is desktop-padded but Footer remains mobile-padded \| RESPONSIVE \| K-034 Phase 3 \| T1 byte-identity asserted at 1280×800 desktop only; seam not covered by E2E per K-034 Phase 3 Challenge #2 Option A ruling (cost-of-3-viewport-baselines > likelihood-of-visible-regression). Tracker: TD-K034-P3-02. \| 2026-04-23 \|` | AC-034-P3-VIEWPORT-SEAM-KNOWN-GAP |
| 11 | `docs/tech-debt.md` | Modify (append one row) | Append below TD-K034-P2-17: `\| TD-K034-P3-02 \| /diary Footer viewport-padding seam at 640–768px not covered by E2E; trigger: user-reported visible regression in 640–768px window — if reported, add `.spec` with 3-viewport baseline (640/720/768). Scope: single snapshot comparison per breakpoint, tolerance 0.5% per K-034 Phase 2 snapshot precedent. \| K-034 Phase 3 Challenge #2 \| low \| 2026-04-23 \|` | AC-034-P3-VIEWPORT-SEAM-KNOWN-GAP |
| 12 | `frontend/e2e/shared-components.spec.ts-snapshots/footer-diary-chromium-darwin.png` | **NEW (regenerated during Engineer `playwright --update-snapshots`)** | After §3.1 Option A is implemented, run `npx playwright test shared-components.spec.ts --update-snapshots`; commit the new file alongside other edits. **Do NOT hand-craft the PNG.** | AC-034-P3-DIARY-FOOTER-RENDERS (implicit per K-034 Phase 1 snapshot baseline precedent) |
| 13 | `agent-context/architecture.md` | Modify (3 structural edits + Changelog prepend + frontmatter `updated:`) | (a) Frontend Routing `/diary` row L456 — append sentence: `**Phase 3 (2026-04-23): /diary 加入 shared Footer** (AC-034-P3-DIARY-FOOTER-RENDERS); K-017/K-024/K-034-P1-T4 三條 /diary no-footer Sacred 全退役; `<Footer />` last sibling of root `<div className="min-h-screen">`（/about / /business-logic 同 pattern）; 載入期間亦渲染 (Challenge #1 Option A); Footer ancestor-padding seam 640–768px 為 Known Gap TD-K034-P3-02.`; (b) Footer 放置策略 table L514 `/diary` cell: change `無 footer (K-024 Architect 裁決...)` → `<Footer />`（K-034 Phase 3 design 2026-04-23：絕對位置為 root div 最末 sibling；K-017/K-024/K-034-P1-T4 三條 /diary no-footer Sacred 全退役；/app isolation preserved 不動 per K-030）`; (c) Shared Components 邊界 table L523 Footer row `用於` cell: change `/ / /business-logic / /about 三路由` → `/ / /about / /business-logic / /diary 四路由`（K-034 Phase 3 新增 /diary 2026-04-23；Pencil provenance 同 86psQ + 1BGtd, inherited per BQ-034-P3-01）; (d) Prepend Changelog entry (2026-04-23, Architect, K-034 Phase 3) describing DiaryPage Footer integration + 4-route byte-identity + 3-Sacred retirement + /app preserved + TD-K034-P3-02 opened; (e) Update frontmatter `updated: 2026-04-23` line adding `K-034 Phase 3 Architect — /diary shared Footer adoption design landed; 3 Sacred clauses retired; /app K-030 isolation preserved; TD-K034-P3-02 opened for 640-768px seam.` | Architect mandatory per `feedback_architect_must_update_arch_doc.md` |

**Total Engineer file touches:** 11 files edited + 1 new snapshot PNG (auto-generated). Architect pre-commits file 13 (architecture.md) this session.

---

## 6 Test Case Plan

### 6.1 AC ↔ Test ID mapping

| AC | Test assertions | Test count | File |
|----|-----------------|-----------|------|
| AC-034-P3-DIARY-FOOTER-RENDERS | T1 loop extended to 4 routes — 4 byte-identical outerHTML comparisons (each route vs `/` reference) | 1 test, 4 assertions | `shared-components.spec.ts` T1 |
| AC-034-P3-DIARY-FOOTER-RENDERS | Footer snapshot per route (4 routes) | 4 independent tests (one per loop iteration) | `shared-components.spec.ts` snapshot `for` loop |
| AC-034-P3-DIARY-FOOTER-LOADING-VISIBLE | **NEW test** in `shared-components.spec.ts` or `diary-page.spec.ts` — `page.route('**/diary.json', ...)` with 2000ms delay, assert `locator('footer').count() === 1` during loading AND after resolution | 1 new test | **Architect ruling: place in `shared-components.spec.ts`** adjacent to T1 (under same describe block or new `AC-034-P3-DIARY-FOOTER-LOADING-VISIBLE` describe) — rationale: Footer rendering invariant belongs with other Footer invariants; `diary-page.spec.ts` owns DiaryPage-specific content invariants |
| AC-034-P3-SITEWIDE-FOOTER-4-ROUTES | 4-route `for` loop with `expectSharedFooterVisible(page)` per iteration (fontSize 11px / color rgb(107, 95, 78) / border-top-width > 0) | 4 tests (one per loop iter) | `sitewide-footer.spec.ts` |
| AC-034-P3-SACRED-RETIREMENT | `pages.spec.ts` L157-168 block **deleted** (not replaced with new test — retirement removes coverage; T1 + snapshot coverage above subsumes) | 0 new tests; 1 deletion | `pages.spec.ts` |
| AC-034-P3-PREVIOUS-SACRED-PRESERVED | T4a `/app — no Footer` assertion in `shared-components.spec.ts` — **verify HEAD has T4a** (spec file does NOT currently have a T4a — ticket AC says "preserved"; if absent pre-Phase-3, Architect flags as **BQ-034-P3-04** to PM) | **Verification step during Engineer implementation** — see §7 Known Gaps | `shared-components.spec.ts` |
| AC-034-P3-INVENTORY-UPDATED | No test; doc-only assertion (inventory already edited) | 0 tests | N/A |
| AC-034-P3-VIEWPORT-SEAM-KNOWN-GAP | No test; documented as Known Gap per ruling | 0 tests | design-exemptions.md + tech-debt.md |

**Total NEW Playwright test count:** 1 (AC-034-P3-DIARY-FOOTER-LOADING-VISIBLE) + implicit 1 additional snapshot test + 1 additional loop iteration in sitewide-footer (extends 2→4 = 2 additional test instantiations, but all under same describe so count semantics: 2 new assertions or 2 new tests depending on how runner reports).

**Sum verification:** AC-034-P3-DIARY-FOOTER-RENDERS "4 independent Playwright assertions" → T1 loop body iterates 4× over consumingRoutes, each iteration runs `expect(footerHtmlByRoute[route]).toBe(referenceHtml)` → 4 assertions total. Matches AC verbatim "cannot be merged into a single assertion." **`shared-components.spec.ts` T1 test count: 1 test, 4 assertions inside loop.**

AC-034-P3-SITEWIDE-FOOTER-4-ROUTES "4 independent Playwright assertions" → 4 `test()` instantiations from `for` loop (one per route). Matches AC verbatim "cannot be merged." **`sitewide-footer.spec.ts` loop: 4 tests.**

### 6.2 Snapshot baseline generation

First Engineer run: `npx playwright test shared-components.spec.ts --update-snapshots`. This creates:
- `footer-diary-chromium-darwin.png` (NEW — file #12 in change list)
- Existing 3 baselines (`footer-home`, `footer-about`, `footer-business-logic`) regenerated **if** any pixel drift from current baseline is tolerated under `maxDiffPixelRatio: 0.02`.

**Engineer pre-commit dry-run (per AC-034-P3-DIARY-FOOTER-RENDERS Engineer retro Challenge #8 ruling):**

```bash
# Method (b) revert: delete only <Footer /> JSX line from DiaryPage.tsx; keep import; tsc exit 0
# Expected fails (capture first 3 Expected/Received lines per retro format):
#   - shared-components.spec.ts T1 /diary (byte-identity fails — outerHTML missing)
#   - shared-components.spec.ts "Footer snapshot on /diary"  (snapshot file orphan vs runtime DOM 0 footers)
# Expected pass:
#   - shared-components.spec.ts T4a /app — no Footer  (cross-contamination check — removing /diary footer should NOT affect /app)
```

FAIL-IF-GATE-REMOVED dry-run is recorded in Engineer's retrospective section at Phase 3 close; not committed as code.

---

## 7 Route Impact Table (mandatory per §Global Style Route Impact Table)

| Route | Status | Notes |
|-------|--------|-------|
| `/` | **unaffected** | HomePage `<Footer />` unchanged; T1 reference baseline preserved |
| `/about` | **unaffected** | AboutPage `<Footer />` unchanged; Phase 1 / Phase 2 edits remain committed |
| `/business-logic` | **unaffected** | BusinessLogicPage `<Footer />` unchanged (all 3 auth states) |
| `/diary` | **affected** | **NEW** `<Footer />` render; Sacred 3-clause retirement; snapshot baseline added; viewport seam TD opened |
| `/app` | **must-be-isolated** | **K-030 AC-030-NO-FOOTER Sacred explicitly PRESERVED** — `AppPage.tsx` remains Footer-free; `shared-components.spec.ts` T4a `/app — no Footer` preserved (see §7 Known Gap verify step); `app-bg-isolation.spec.ts` AC-030-NO-FOOTER preserved; **distinct rationale from retired /diary clauses** — `/app` is tool page not marketing chrome, isolation is product intent not oversight |
| `*` catch-all | **unaffected** | redirects to `/`; inherits homepage Footer |

**Cross-check vs inventory §Routes with NO shared chrome:** inventory now reads only `/app` (the `/diary` bullet is struck-through). Consistent with this table.

---

## 8 Boundary Pre-emption

| Boundary scenario | Is behavior defined? | Action |
|------------------|----------------------|--------|
| Empty input (entries.length === 0) | ✅ AC-034-P3-DIARY-FOOTER-RENDERS + AC-034-P3-DIARY-FOOTER-LOADING-VISIBLE — `count === 1` across all 4 terminal states | Satisfied |
| Max/min boundary (entries.length === 1, entries.length === 1000) | ✅ — Footer render is independent of entries.length | Satisfied |
| API error (diary.json fetch 404/500/timeout) | ✅ — Footer renders alongside DiaryError retry UI (error branch in matrix §4.2) | Satisfied |
| API loading > 10s (slow 3G) | ✅ — Footer renders during full loading window (AC-034-P3-DIARY-FOOTER-LOADING-VISIBLE Option A) | Satisfied |
| Concurrency (rapid route navigation /→/diary→/about) | ✅ — each route mounts its own Footer instance; no global state shared | Satisfied |
| Empty list + max viewport | ✅ — Footer full-bleed at desktop; DiaryEmptyState centered in main | Satisfied |
| Mobile viewport < 640px | ✅ — Footer uses `px-6 md:px-[72px]` responsive idiom (pre-existing, RESPONSIVE exemption §2 row 2 already covers) | Satisfied |
| Mobile viewport 640–768px (sm ≤ vp < md) | ❌ — main ancestor goes `sm:px-24`, Footer stays `px-6`; padding seam | **Known Gap — TD-K034-P3-02 opened per AC-034-P3-VIEWPORT-SEAM-KNOWN-GAP** |

All scenarios either have a defined contract or an explicit Known Gap + TD entry. No boundary left for "Engineer decides."

### 7.1 Known Gap — BQ-034-P3-04 (flagged to PM, non-blocking)

**Observation:** `shared-components.spec.ts` HEAD does NOT contain a `T4a /app — no Footer` assertion. AC-034-P3-PREVIOUS-SACRED-PRESERVED L683 cites it as a Sacred assertion to preserve. Two explanations possible:

1. T4a was a proposed-but-not-landed assertion in an earlier Phase / ticket — AC text drift.
2. T4a exists in a different spec file (e.g. `app-bg-isolation.spec.ts` already covers `/app` no-Footer per K-030 AC-030-NO-FOOTER — see AboutPage.tsx footer comment L109-110 in `shared-components.spec.ts` HEAD).

**Architect does NOT edit ticket AC** (per `feedback_ticket_ac_pm_only.md`). Options for PM:

- **Option (a):** Interpret AC-034-P3-PREVIOUS-SACRED-PRESERVED `/app` bullet as satisfied by `app-bg-isolation.spec.ts` AC-030-NO-FOOTER (no new test needed; T4a reference is shorthand for that pre-existing Sacred).
- **Option (b):** Engineer adds a new T4a assertion in `shared-components.spec.ts` this Phase as documented in AC.
- **Option (c):** PM edits ticket AC L683 to remove the `T4a /app` reference (redundant with app-bg-isolation spec).

**Recommendation: Option (a)** — `app-bg-isolation.spec.ts` already owns `/app` no-Footer Sacred (see `shared-components.spec.ts` HEAD L109-110 comment); a duplicate assertion would violate single-source-of-truth. But decision belongs to PM.

**Engineer release status:** does not block Phase 3 implementation of ACs P3-DIARY-FOOTER-RENDERS / -LOADING-VISIBLE / -SITEWIDE-4-ROUTES / -SACRED-RETIREMENT / -INVENTORY-UPDATED / -VIEWPORT-SEAM-KNOWN-GAP. BQ-034-P3-04 surface here so Engineer does not invent a "preserved" assertion that never existed. PM rules inline at Engineer release or leaves Engineer to skip and flag in retro.

---

## 9 Refactorability Checklist

- [x] **Single responsibility**: Footer does one thing (render sitewide one-liner); DiaryPage terminal-state switch unchanged.
- [x] **Interface minimization**: Footer has 0 props (empty interface); DiaryPage Footer insertion is 1 JSX line.
- [x] **Unidirectional dependency**: DiaryPage imports Footer; no reverse dep.
- [x] **Replacement cost**: swapping Footer backend (e.g. to an i18n-aware component) affects 4 import sites (`HomePage` / `AboutPage` / `BusinessLogicPage` / `DiaryPage`); centralized via `shared/Footer.tsx` per K-035.
- [x] **Clear test entry point**: `shared-components.spec.ts` T1 / snapshot loop / loading-visible test + `sitewide-footer.spec.ts` 4-route loop are all falsifiable predicates.
- [x] **Change isolation**: this Phase's UI changes do not touch any API contract; `/diary` layout unchanged; only additive DOM.

All 6 items satisfied. No debt accepted.

---

## 10 All-Phase Coverage Gate

K-034 is a multi-Phase ticket; Phase 3 is a separate slice with its own spec-cascade. Coverage for **Phase 3** deliverable scope only:

| Phase | Backend API | Frontend Routes | Component Tree | Props Interface |
|-------|------------|----------------|----------------|----------------|
| 3 | ✅ N/A (no backend change) | ✅ /diary affected; others unaffected; /app preserved | ✅ no new components; DiaryPage + Footer JSDoc edits | ✅ Footer props = `{}` (empty, already locked Phase 1) |

Phase 3 gate passed on all four items.

---

## 11 Implementation Order

1. **DiaryPage.tsx** — add `import Footer` + `<Footer />` at root-level sibling (file #1).
2. **Footer.tsx JSDoc** — update "Used on" list (file #2); purely cosmetic, no runtime effect. Can parallel with #1.
3. **shared-components.spec.ts** — (a) T1 route list 3→4; (b) delete T4 `/diary no-Footer` block; (c) snapshot loop 3→4 (file #3). First run with `--update-snapshots` generates new baseline PNG (file #12).
4. **sitewide-footer.spec.ts** — restructure to 4-route loop per Option α (file #4).
5. **pages.spec.ts** — delete L157-168 block, replace with verbatim comment (file #5).
6. **Ticket annotation edits** — 3 retirement blockquotes in K-017 / K-024 / K-034 P1 T4 (files #6, #7, #8). Doc-only, parallelizable.
7. **design-exemptions.md + tech-debt.md** — append RESPONSIVE row + TD entry (files #10, #11). Doc-only.
8. **architecture.md** — 3 structural Edits + Changelog + frontmatter `updated:` (file #13). Architect session commit (this doc set).
9. **Engineer gate:** `npx tsc --noEmit` exit 0 → `npx playwright test shared-components.spec.ts sitewide-footer.spec.ts pages.spec.ts diary-page.spec.ts` → full suite → commit.

Parallelizable: doc-only files (#6, #7, #8, #10, #11) can be edited in parallel; code changes (#1–#5) are serial (spec depends on runtime behavior from #1).

---

## 12 Risks and Notes

- **Snapshot drift risk:** regenerating `footer-home`, `footer-about`, `footer-business-logic` baselines — if pixel drift exists, snapshot loop will silently regenerate all 4 baselines on first `--update-snapshots` run, potentially masking a pre-Phase-3 drift. Engineer must `git diff --stat` the snapshots dir post-generation; any diff on 3 existing baselines requires investigation (pre-existing issue, not Phase 3 scope).
- **Viewport seam (640–768px):** known; TD-K034-P3-02; no E2E coverage. User must visually verify Phase 3 at `/diary` on viewport 720×900 during PM sign-off (or post-deploy) to confirm no immediate regression.
- **Sacred-retirement blockquote templates:** the retirement blockquote text is **verbatim** per AC. Engineer must not paraphrase. Any change → PM blocker.
- **pages.spec.ts block deletion:** must delete **entire** `test.describe(...)` including both header comment (L156-159) AND inner test body (L161-168). Partial deletion (e.g. keeping header comment) fails AC-034-P3-SACRED-RETIREMENT "deleted entirely."
- **Footer JSDoc header update** (file #2) is non-runtime but is a documentation Sacred — future Reviewers grep Footer.tsx JSDoc to verify inventory consistency; stale JSDoc = drift.
- **BQ-034-P3-04 surfaced in §8.1** (T4a `/app — no Footer` verification) — Architect does not self-decide; Engineer flags at release if PM hasn't ruled inline.

---

## 13 §API 不變性證明 (dual-axis, final)

**Axis (a) — wire-level schema diff:**

```
git diff main -- backend/ frontend/src/types.ts frontend/src/types/diary.ts
# Expected: 0 lines
```

Phase 3 touches zero API surfaces. Zero schema migrations. Zero types/diary changes.

**Axis (b) — frontend observable behavior diff:**

| useDiary / useDiaryPagination output key | OLD → NEW | Observable diff | Row class |
|------------------------------------------|-----------|-----------------|-----------|
| `entries` (full-set happy path) | unchanged | Timeline renders same N entries | **full-set** row ✓ |
| `entries` (error branch) | unchanged | DiaryError unchanged | **subset (error)** row ✓ |
| `entries` (empty branch) | `[]` → `[]` | DiaryEmptyState unchanged | **empty** row ✓ |
| `entries` (loading branch) | undefined → undefined | DiaryLoading unchanged | **boundary (loading)** row ✓ |
| Footer presence at root level | absent → present | New sibling; no mutation to `<main>` subtree | additive — does not belong to useDiary contract |

All 4 required row classes (full-set / subset / empty / boundary) present. Footer addition is orthogonal to `useDiary` / `useDiaryPagination` return values — isolated change.

---

## 14 Retrospective

**Where most time was spent:** Pre-Design Audit §1.1 files-inspected truth table — 11 rows with `git show HEAD:<file>` verification each. Mandatory per `feedback_architect_pre_design_audit_dry_run.md` K-013 hard gate; substantial upfront investment pays off by letting §5 File Change List reference exact line numbers (L157-168 deletion, L294 blockquote insertion, etc.) without Engineer re-discovery.

**Which decisions needed revision:** Initial draft placed AC-034-P3-DIARY-FOOTER-LOADING-VISIBLE test in `diary-page.spec.ts` as a DiaryPage invariant; revised to `shared-components.spec.ts` because Footer rendering invariants cluster better by component than by page — matches existing `sitewide-footer.spec.ts` pattern. Also initially wrote DiaryPage Footer inside `<main>` (Option B in §3.1); revised to root-level sibling (Option A) after reading AboutPage L67 pattern and realizing byte-identity across 4 routes requires ancestor parity.

**Next time improvement:** When ticket AC references an assertion (AC-034-P3-PREVIOUS-SACRED-PRESERVED → T4a `/app`) that is not verifiable in HEAD spec file, raise as BQ to PM **in §0 Scope Questions** (even pre-design-locked) instead of deferring to §7 Known Gap. Pre-design-lock sign-off cannot catch missing-assertion-references because PM is verifying the ruling set, not the spec-file truth table. Codify as Architect hard step before AC-vs-spec-file cross-check; add to persona Same-File Cross-Table Sweep equivalent for spec files.
