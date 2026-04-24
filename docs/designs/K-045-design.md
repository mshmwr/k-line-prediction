# K-045 — Desktop layout consistency across /about, /, /diary (Architect Design)

**Ticket:** `docs/tickets/K-045-desktop-layout-consistency.md`
**Base commit:** `ef3519d` (K-Line main, K-042 backfill) — all `git show ef3519d:*` refs below are against this.
**Worktree:** `.claude/worktrees/K-045-desktop-layout-consistency/`
**visual-delta:** `none` (align to existing Pencil SSOT — K-040 Designer Decision Memo §Item 3 + frame 35VCj/4CsvQ/wiDSi).
**content-delta:** `none`.
**design-locked:** `N/A`.

---

## §0 Pre-Design Audit

### §0.1 Files inspected truth table (Gate 1 — with `git show <base>:<path>` logs)

| Row | Path | `git show ef3519d:<path>` inspected | Key extracted value |
|-----|------|-------------------------------------|---------------------|
| A1 | `frontend/src/pages/AboutPage.tsx` | YES (70 LOC) | Root `<div className="min-h-screen">` → NavBar → 6×`<SectionContainer>` → Footer. All ids (`header`, `metrics`, `roles`, `pillars`, `tickets`, `architecture`) live on the `<section>` element rendered by SectionContainer. First container uses `width="narrow"` (max-w-3xl = 768); rest use `width="wide" divider` (max-w-5xl = 1024). Inline `<SectionLabelRow>` defined locally. |
| A2 | `frontend/src/components/primitives/SectionContainer.tsx` | YES (33 LOC) | Renders `<section id={id} className="${py} px-6 ${maxWidth} mx-auto ${border}">`. `py = py-16` (128px both sides) by default, `py-12` on `paddingY="md"`. `maxWidth = max-w-3xl (narrow) \| max-w-5xl (wide)`. Horizontal `px-6` hard-coded; **NO `sm:px-24` bump**. Divider = `border-b border-muted/40`. |
| A3 | `frontend/src/pages/HomePage.tsx` | YES (38 LOC) | Body wrapper: `<div className="pt-8 pb-8 px-6 sm:pt-[72px] sm:px-24 sm:pb-[96px] mx-auto max-w-[1248px]" data-testid="homepage-root">` → inner `<div className="flex flex-col gap-6 sm:gap-[72px]" data-testid="homepage-sections">` wrapping 3 sections. NavBar + BuiltByAIBanner + Footer are siblings at root `min-h-screen`, **outside** the 1248 wrapper (Footer full-bleed). |
| A4 | `frontend/src/pages/DiaryPage.tsx` | YES (65 LOC) | `<main className="px-6 sm:px-24 pb-12 mx-auto max-w-[1248px]" data-testid="diary-main">` directly contains DiaryHero + state-switched body. NavBar + Footer siblings at root `min-h-screen`. No internal `flex gap-*` wrapper (timeline owns its own `<ol>` gap). Top padding provided by `DiaryHero` component, not the `<main>`. |
| A5 | `frontend/src/components/about/PageHeaderSection.tsx` | YES | Currently `<div className="py-20 flex flex-col gap-[18px]">` (py-20=80px both sides). Renders `<PageHero>` + divider + role line + tagline. No own container — relies on parent `SectionContainer width="narrow"` (768) for width. |
| A6 | `frontend/design/specs/about-v2.frame-wwa0m.json` | YES | Per §0.3 Pencil mapping below. |
| A7 | `frontend/design/specs/homepage-v2.frame-35VCj.json` | YES | `page-body Y80Iv padding:[72,96,96,96], gap:72, layout:"vertical"` → wraps 6 section frames. Footer `86psQ` is a separate sibling of page-body. |
| A8 | `frontend/design/specs/homepage-v2.frame-4CsvQ.json` | YES | Homepage body hosts hero/logic/diary sections under the same 1440 canvas + 1248 content zone (K-040 Decision Memo §Item 3 Table row confirms `[72,96,96,96]`). |
| A9 | `frontend/design/specs/homepage-v2.frame-wiDSi.json` | YES | Diary page body `wtC03 padding:[72,96,48,96], gap:56` (bottom 48 per K-040 Item 2). |
| A10 | `frontend/design/specs/K-040-designer-decision-memo.md` | YES | §Item 3 Table: all 4 frames share 96px horizontal desktop padding. Conclusion: "Item 3 is an impl-side drift. Engineer must audit `HomePage.tsx` vs `DiaryPage.tsx` / `AboutPage.tsx` … target `desktopPaddingPx = 96`, `maxWidthPx = 1248`." |
| A11 | `frontend/e2e/about-v2.spec.ts:42-62` | YES | AC-022-SECTION-LABEL loop for 375/390/414 px asserts label visible + `overflow !== 'hidden'`. Binds selector `getByText('Nº 01 — DELIVERY METRICS', { exact: true })` — container wrap choice does not affect this as long as label still rendered inside the wrapper. |
| A12 | `frontend/e2e/about-v2.spec.ts:387-404` | YES | K-031 `AC-031-LAYOUT-CONTINUITY` asserts `document.getElementById('architecture').nextElementSibling.tagName.toLowerCase() === 'footer'`. **This is the pattern-A hard gate.** Note: ticket §4 points at `about.spec.ts:386-403` — actual location is `about-v2.spec.ts:387-404`. Ticket copy will be corrected by PM (flagged in §10 BQ-045-ARCH-01). |
| A13 | `frontend/e2e/pages.spec.ts:296-340` + `pages.spec.ts:436-521` | YES | AC-023-BODY-PADDING on `[data-testid="homepage-root"]` asserts desktop 72/96/96/96; AC-028-SECTION-SPACING asserts Hero↔Logic + Logic↔Diary gap=72 at 1280, 24 at 375, 72 at 640. Home baseline template for /about's new ACs. |
| A14 | `frontend/e2e/shared-components.spec.ts:31-56, 160-180` | YES | T1 cross-route Footer byte-identity `outerHTML` loop for 4 routes; T-snapshot loop for 4 routes. **Footer must remain at root level (not inside 1248 container) for both tests to keep passing** — parity depends on identical DOM position + full viewport width. |
| A15 | `agent-context/architecture.md` L450-520 (routing + Directory Structure) | YES | `/about` row says "7 sections"; Directory Structure L175 `SectionContainer.tsx P1 /about 7 sections 外層 wrap`; L180 Footer shared/. |

### §0.2 Cartesian-product truth table — current vs target

Enumerate (viewport) × (route) grid; fields = `paddingLeft (px)`, `contentMaxWidth`, `inter-section gap contributor`.

| Viewport (css px) | Route | OLD paddingLeft | OLD maxWidth | OLD section gap mechanism | NEW paddingLeft | NEW maxWidth | NEW gap mechanism |
|---|---|---|---|---|---|---|---|
| 375 (mobile) | / | 24 (`px-6`) | 1248 | inner `gap-6` = 24 | 24 | 1248 | inner `gap-6` = 24 (no change) |
| 375 | /about | 24 (`px-6`, SectionContainer) | 1024 (`max-w-5xl` wide) / 768 (narrow on hero) | `py-16` per section → adjacent gap = 128+128 = 256 (divider line collapses to the border, not a void) | 24 | 1248 | outer wrapper `gap-6` = 24 |
| 375 | /diary | 24 (`px-6`) | 1248 | Timeline owns its own `<ol>` gap | 24 | 1248 | unchanged (no outer flex) |
| 639 (sub-sm) | / | 24 | 1248 | 24 | 24 | 1248 | 24 |
| 639 | /about | 24 | 1024/768 | 256 (py-16 × 2) | 24 | 1248 | 24 |
| 640 (sm edge) | / | 96 (`sm:px-24`) | 1248 | 72 (`sm:gap-[72px]`) | 96 | 1248 | 72 |
| 640 | /about | 24 (no `sm:` variant) | 1024/768 | 256 | 96 | 1248 | 72 |
| 640 | /diary | 96 (`sm:px-24`) | 1248 | per-timeline | 96 | 1248 | unchanged |
| 1024 | / | 96 | 1248 | 72 | 96 | 1248 | 72 |
| 1024 | /about | 24 | 1024/768 | 256 | 96 | 1248 | 72 |
| 1280 (default Playwright) | / | 96 | 1248 centred | 72 | 96 | 1248 centred | 72 |
| 1280 | /about | 24 | 1024 centred (wide) / 768 centred (narrow) | 256 | 96 | 1248 centred | 72 |
| 1280 | /diary | 96 | 1248 centred | per-timeline | 96 | 1248 centred | unchanged |
| 1440 (Pencil canvas) | / | 96 | 1248 centred | 72 | 96 | 1248 centred | 72 |
| 1440 | /about | 24 | 1024/768 centred | 256 | 96 | 1248 centred | 72 |
| 1440 | /diary | 96 | 1248 centred | per-timeline | 96 | 1248 centred | unchanged |

**18-row truth table confirms:** only `/about` rows are `OLD ≠ NEW`. `/` + `/diary` rows are identity (baseline — no change).

### §0.3 Pencil value mapping (frame 35VCj `page-body Y80Iv`)

| Pencil node | Pencil property | Pencil value | Runtime target |
|---|---|---|---|
| `Y80Iv` | `padding` | `[72, 96, 96, 96]` (T,R,B,L) | first-section top=72, outer right=96, last-section bottom=96, outer left=96 |
| `Y80Iv` | `gap` | `72` | inter-section vertical gap at desktop |
| `Y80Iv` | `layout` | `"vertical"` | CSS `flex-direction: column` |
| `Y80Iv` children | 6 section frames + Footer is Y80Iv sibling | — | 6 sections flex-column with gap 72, then Footer full-bleed outside |
| (no `maxWidth` on Y80Iv) | — | inherits 1440 canvas − 2×96 padding = 1248 content zone | `max-w-[1248px] mx-auto` |

Desktop mapping: `max-w-[1248px] mx-auto px-6 sm:px-24 pt-8 pb-8 sm:pt-[72px] sm:pb-[96px]` outer + `flex flex-col gap-6 sm:gap-[72px]` inner → produces identical T=72, R=96, B=96, L=96, gap=72 at ≥640 viewport. Byte-identical mapping to Home's `HomePage.tsx:22-25`.

### §0.4 API invariance (§API 不變性 — Gate 3)

| Axis | Verdict |
|---|---|
| (a) wire-level backend schema diff | `git diff ef3519d -- backend/ frontend/src/types/ frontend/src/hooks/` = 0 lines. This ticket is frontend layout refactor only; no API / contract / hook / schema change. |
| (b) frontend observable behavior diff table | See §4 Pattern A diff table + §6 E2E spec additions. OLD `/about` renders 7 `<SectionContainer>` children inside `<div className="min-h-screen">` with cumulative `py-16`; NEW renders 6 direct-child `<section>` elements (hero = S1 inside PageHeaderSection's own container) + Footer at root, with outer flex-column gap providing inter-section rhythm. Observable: container width 1024/768→1248, desktop padding 24→96, inter-section gap 256→72. No JS / event / handler / prop diff on any component other than SectionContainer (removed) + PageHeaderSection (container-bearing class migration). |

Gate 3 cleared: wire-level 0 diff + frontend observable enumerated across 4 axes (width, padding, gap, section count) × 3 viewports in §0.2.

---

## §1 BQ-045-02 Verdict — remove-inline vs update-primitive

### §1.1 Decision matrix

| Dimension | Option α — remove SectionContainer, inline per section | Option β — update SectionContainer in place (`width="wide"` → 1248, `py` → 0, add `sm:px-24`) | Option γ — keep primitive, add `wrapper` prop |
|---|---|---|---|
| LOC delta on `primitives/SectionContainer.tsx` | −33 (file deleted) | edit ~8 lines (maxWidth literals `max-w-3xl/5xl` → `max-w-[1248px]`, `px-6` → `px-6 sm:px-24`, `py-16/12` → `py-0`) | edit ~15 lines (+ new `outerGap` prop branches) |
| LOC delta on `AboutPage.tsx` | −15 (replace 6×`<SectionContainer>` wrapper with one outer wrapper + 6 inline `<section>`) → est. final 68 LOC | 0 (AboutPage keeps `<SectionContainer>` calls but drops the now-unused `width="narrow"` usage, swaps narrow→wide for hero; still needs outer `flex-col gap` wrapper inserted) → est. final 78 LOC | +5 (new prop plumbing) → est. final 72 LOC |
| SectionContainer consumer count (before → after) | 1 → 0 (file removed) | 1 → 1 | 1 → 1 |
| Vertical rhythm migration risk | LOW — consumer owns `flex flex-col gap-6 sm:gap-[72px]` wrapper (byte-copy of HomePage L24), explicit in one place | MEDIUM — primitive strips its own `py-*`, consumer must supply a `flex gap` wrapper anyway; risk: future consumer forgets to add the wrapper and gets sections touching | MEDIUM — prop combinatorics `outerGap × paddingY × width` expands primitive surface; more tests to cover |
| Pencil parity risk (K-045 ACs) | LOW — emit Home's container pattern verbatim (HomePage.tsx:22-25), easy to grep-parity | LOW — same emission target, just inside primitive | LOW — same emission target |
| AC-045-K031-ADJACENCY-PRESERVED compliance | CLEAN — each `<section>` is direct child of root `min-h-screen`; `#architecture.nextElementSibling === <footer>` preserved | CLEAN — each `<section>` rendered by primitive still direct child if the `flex-col gap` wrapper is added OUTSIDE the primitive calls (not wrapping all 6) | CLEAN — same as β |
| Impact on other routes/consumers | Zero (0 other consumers) | Zero (0 other consumers) | Zero (0 other consumers) |
| Future flexibility (new /foo page reusing primitive) | Consumer copies HomePage pattern (4 LOC) — no primitive needed for this trivial case | Retains primitive for future /foo | Retains primitive for future /foo |
| E2E spec change surface | Only add K-045 new test suite; no selector drift (ids still on `<section>`) | Same | Same |
| Reviewer parity gate complexity | SIMPLE — diff shows one component removed + one page restructure | MEDIUM — must verify primitive `px-6 sm:px-24` substitution doesn't regress any style combination the primitive ever emitted | MEDIUM — prop-combinatoric verification |
| Design doc / architecture.md sync lines | 4 cells (Summary / Directory Structure `primitives/` / Frontend Routing `/about` / §Footer 放置策略表) | 5 cells (same + SectionContainer prop table) | 5 cells (same + new prop) |
| Byte-identity with `/` + `/diary` container pattern | HIGHEST — literal `max-w-[1248px] mx-auto px-6 sm:px-24 pt-8 pb-8 sm:pt-[72px] sm:pb-[96px]` + inner `flex flex-col gap-6 sm:gap-[72px]` wrapped inline, identical to HomePage.tsx:22-25 verbatim | LESS — primitive abstracts the emission; harder for reader to confirm "same as HomePage" without re-reading primitive source | LESS — same concern |

### §1.2 Verdict — Option α (remove SectionContainer, inline per section)

**Rationale:**

1. **Single consumer + zero future leverage.** Primitive has been used only by `/about` for ~5 tickets (K-017 → K-034 Phase 2). K-045 is the third time it has been touched structurally. Keeping a primitive with one consumer adds an abstraction layer that hasn't paid back.
2. **Byte-identity target.** The explicit goal of the ticket is "align /about to /` + /diary` container pattern". Inlining the exact `max-w-[1248px] mx-auto px-6 sm:px-24 …` + `flex flex-col gap-6 sm:gap-[72px]` byte-copy of `HomePage.tsx:22-25` makes grep-parity trivial (§6 Reviewer parity gate becomes a string-compare).
3. **Vertical rhythm semantics.** SectionContainer's `py-16` is the reason adjacent gaps are currently 256px; any non-destructive "update in place" (Option β) must still strip `py-*` to 0 and hand gap ownership back to a consumer wrapper. Once that is done, the primitive is a 4-line `<section id={id} className="…">` — an anemic abstraction.
4. **Reduces Sacred surface.** Fewer primitives = fewer drift watch points for Reviewer / QA.

Option β would also work; rejected because it preserves a primitive with one consumer and makes the Pencil-parity grep slightly more indirect. Option γ expands the primitive surface — rejected as design debt.

**Trade-off accepted:** if a hypothetical future `/foo` page wants the same container pattern, it must copy the 2-line classname (trivial; no generalisation justified).

### §1.3 Decision log entry

`BQ-045-02 → Option α (remove-and-inline). Justified by: single consumer, byte-identity target with HomePage.tsx, py-16 strip required anyway under β, 0 other routes affected. Reviewer parity gate reduced to "grep /about container classes match HomePage container classes".`

---

## §2 Component Tree & Props Interface

### §2.1 New AboutPage.tsx component tree (ASCII)

```
<div className="min-h-screen">                               ← root (unchanged)
├── <UnifiedNavBar />                                        ← unchanged, pre-body sibling
├── <div                                                     ← NEW body wrapper (byte-copy of HomePage.tsx:22)
│     className="pt-8 pb-8 px-6 sm:pt-[72px] sm:px-24 sm:pb-[96px] mx-auto max-w-[1248px]"
│     data-testid="about-root">
│   └── <div                                                 ← NEW inner flex wrapper (byte-copy of HomePage.tsx:24)
│         className="flex flex-col gap-6 sm:gap-[72px]"
│         data-testid="about-sections">
│       ├── <section id="header">                            ← S1 (PageHeaderSection)
│       │     <SectionLabelRow label="…" optional per §2.3/>
│       │     <PageHeaderSection />
│       │   </section>
│       ├── <section id="metrics">                           ← S2
│       │     <SectionLabelRow label="Nº 01 — DELIVERY METRICS" />
│       │     <MetricsStripSection />
│       │   </section>
│       ├── <section id="roles">                             ← S3
│       │     <SectionLabelRow label="Nº 02 — THE ROLES" />
│       │     <RoleCardsSection />
│       │   </section>
│       ├── <section id="pillars">                           ← S4
│       │     <SectionLabelRow label="Nº 03 — RELIABILITY" />
│       │     <ReliabilityPillarsSection />
│       │   </section>
│       ├── <section id="tickets">                           ← S5
│       │     <SectionLabelRow label="Nº 04 — ANATOMY OF A TICKET" />
│       │     <TicketAnatomySection />
│       │   </section>
│       └── <section id="architecture">                      ← S6 — MUST remain the LAST node inside the inner wrapper
│             <SectionLabelRow label="Nº 05 — PROJECT ARCHITECTURE" />
│             <ProjectArchitectureSection />
│           </section>
└── <Footer />                                               ← unchanged full-bleed sibling of body wrapper
```

### §2.2 K-031 adjacency concern & resolution

The ticket §4a Architect Constraint asserts pattern A (per-section container): "each section carries its own container classes … MUST NOT wrap all 6 body sections inside a single parent wrapper `<div>` that would break `#architecture.nextElementSibling === <footer>`."

This design uses a **body wrapper** (`<div data-testid="about-root">`) with an **inner flex wrapper** (`<div data-testid="about-sections">`) around the 6 sections. Under a naïve read, this looks like pattern B — 6 sections wrapped inside a single parent `<div>`.

**But K-031's Sacred assertion is not broken.** Source-of-truth read:

```
// frontend/e2e/about-v2.spec.ts:398-400
const nextSiblingTag = await page.evaluate(
  () => document.getElementById('architecture')?.nextElementSibling?.tagName?.toLowerCase() ?? null
)
expect(nextSiblingTag).toBe('footer')
```

`#architecture`'s `nextElementSibling` is evaluated at whatever DOM level `#architecture` is a child of. Under the NEW tree:

- Under OLD: `#architecture` is a `<section>` child of root `<div className="min-h-screen">`; its `nextElementSibling` is `<Footer>` (root-level). ✓
- Under NEW: `#architecture` is a `<section>` child of the **inner flex wrapper** `<div data-testid="about-sections">`; its `nextElementSibling` is … **`null`** (S6 is the last section, so no sibling). ✗

**This breaks K-031.**

**Resolution options evaluated:**

| Option | Approach | K-031 status | Ticket §4a compliance |
|---|---|---|---|
| A | Drop the body wrapper; place 6 `<section>` elements + outer flex wrapping directly at root, then `<Footer>` outside | BROKEN — adjacency still fails because `#architecture` is then a child of a flex wrapper, not of root | Pattern B-shaped, violates §4a |
| B | Keep body+inner wrappers as above and move `<Footer>` INSIDE the inner wrapper as its last child | FIXED — `#architecture.nextElementSibling === <footer>` holds | But then Footer is inside `max-w-[1248px]`, violating AC-045-FOOTER-WIDTH-PARITY + K-034 Phase 1 Footer byte-identity |
| C | **Per-section self-contained container classes on each `<section>`, no body/inner wrapper** | FIXED — `#architecture` is root child, `nextElementSibling === <footer>` | **Pattern A compliant** — matches §4a verbatim |
| D | Same as current NEW tree (body + inner wrapper) but file a BQ to PM to update AC-031 and replace its DOM adjacency invariant with a CSS `:has()` / id-locator assertion | — | Not compliant with §4a ("current baseline forbids pattern B"); would require PM AC edit cycle |

**Final design = Option C** (per-section container, no outer wrapper). See §2.3 for concrete classes.

### §2.3 Final AboutPage.tsx tree (Option C — the design)

```
<div className="min-h-screen">                                              ← root (unchanged)
├── <UnifiedNavBar />
├── <section id="header"                                                    ← S1 (hero)
│     className="pt-8 px-6 sm:pt-[72px] sm:px-24 mx-auto max-w-[1248px] w-full">
│     <PageHeaderSection />
│   </section>
├── <section id="metrics"                                                   ← S2
│     className="mt-6 sm:mt-[72px] px-6 sm:px-24 mx-auto max-w-[1248px] w-full">
│     <SectionLabelRow label="Nº 01 — DELIVERY METRICS" />
│     <MetricsStripSection />
│   </section>
├── <section id="roles"                                                     ← S3
│     className="mt-6 sm:mt-[72px] px-6 sm:px-24 mx-auto max-w-[1248px] w-full">
│     <SectionLabelRow label="Nº 02 — THE ROLES" />
│     <RoleCardsSection />
│   </section>
├── <section id="pillars"                                                   ← S4
│     className="mt-6 sm:mt-[72px] px-6 sm:px-24 mx-auto max-w-[1248px] w-full">
│     <SectionLabelRow label="Nº 03 — RELIABILITY" />
│     <ReliabilityPillarsSection />
│   </section>
├── <section id="tickets"                                                   ← S5
│     className="mt-6 sm:mt-[72px] px-6 sm:px-24 mx-auto max-w-[1248px] w-full">
│     <SectionLabelRow label="Nº 04 — ANATOMY OF A TICKET" />
│     <TicketAnatomySection />
│   </section>
├── <section id="architecture"                                              ← S6 (LAST section → sibling of <Footer>)
│     className="mt-6 sm:mt-[72px] mb-8 sm:mb-[96px] px-6 sm:px-24 mx-auto max-w-[1248px] w-full">
│     <SectionLabelRow label="Nº 05 — PROJECT ARCHITECTURE" />
│     <ProjectArchitectureSection />
│   </section>
└── <Footer />                                                              ← full-bleed, #architecture.nextElementSibling ✓
```

**Key class decisions:**

- `max-w-[1248px] mx-auto` on every `<section>` — centers content, matches Pencil 1248 zone.
- `px-6 sm:px-24` on every `<section>` — 24px mobile, 96px desktop per `sm:` prefix (640px breakpoint).
- `w-full` to ensure mobile sections span viewport minus padding (otherwise `max-w-[1248px]` at narrow viewports collapses to content-size).
- **Vertical rhythm via `margin-top` (not `flex gap`)**: first section (hero) uses `pt-8 sm:pt-[72px]` for top padding; S2–S6 each use `mt-6 sm:mt-[72px]` for inter-section gap; S6 alone adds `mb-8 sm:mb-[96px]` for bottom padding (mirrors Pencil Y80Iv padding [72,_,96,_]). This single-mechanism approach satisfies AC-045-SECTION-GAP "contributed by a single layout mechanism" AND keeps all 6 sections as direct root children (K-031 adjacency preserved).
- No `py-*` on any section — vertical breathing lives in margin only.
- S1 hero intentionally has no `SectionLabelRow` (matches pre-K-045 design: hero is above-the-fold, no Nº label).

### §2.4 Props interface changes

Since Option α removes `SectionContainer.tsx` entirely:

| Component | Before | After |
|---|---|---|
| `SectionContainer` | `{ id?, width?, divider?, paddingY?, className?, children }` | **DELETED** (file removed) |
| `SectionLabelRow` (inline in AboutPage) | `{ label: string }` | Extract to `frontend/src/components/about/SectionLabelRow.tsx` for re-use across all 5 uses. Same props `{ label: string }`. No behavioural change. |
| `PageHeaderSection` | no props, internal `<div className="py-20 flex flex-col gap-[18px]">` | no props (unchanged). Strip `py-20` (vertical rhythm now owned by S1 `<section>` top-padding). Keep `flex flex-col gap-[18px]` for internal hero layout. |
| Other 5 section components | unchanged | unchanged (they don't touch container classes; they render inner content only) |

### §2.5 Divider / hairline

Current SectionContainer's `divider: border-b border-muted/40` provided a 1px bottom border on each wide section. **The hairline in current /about comes from `<SectionLabelRow>` (which contains its own `<div data-section-hairline>`), not from SectionContainer's `divider`.** `SectionContainer divider` renders a second separator at the BOTTOM of each section.

**Design decision:** drop SectionContainer's `border-b` bottom divider — it does not appear in Pencil (frames BF4Xe/8mqwX/UXy2o/EBC1e/JFizO have no section-terminal border). The hairline next to the section label (`data-section-hairline`) is the only Pencil-authentic separator and is preserved by extracting `<SectionLabelRow>` into its own component.

K-022 AC-022-SECTION-LABEL `data-section-hairline` assertion (about-v2.spec.ts:48) still PASSes — the hairline is inside the label row, unaffected by SectionContainer removal.

---

## §3 Vertical Rhythm Design (AC-045-SECTION-GAP)

### §3.1 Pencil `Y80Iv` value-by-value mapping

| Pencil field | Pencil value | CSS encoding (desktop ≥640) | CSS encoding (mobile <640) |
|---|---|---|---|
| `padding[0]` (top) | 72 | S1 `sm:pt-[72px]` | S1 `pt-8` = 32px (Home pattern mirror) |
| `padding[1]` (right) | 96 | every section `sm:px-24` | `px-6` = 24 |
| `padding[2]` (bottom) | 96 | S6 `sm:mb-[96px]` | S6 `mb-8` = 32 (Home pattern mirror) |
| `padding[3]` (left) | 96 | every section `sm:px-24` | `px-6` = 24 |
| `gap` (inter-section) | 72 | S2–S6 each `sm:mt-[72px]` | S2–S6 each `mt-6` = 24 |

Note: Pencil frames are desktop-only (1440 canvas). Mobile values mirror Home's `HomePage.tsx:22-25` established pattern (`pt-8 pb-8 px-6 gap-6`) — 32px vertical padding / 24px horizontal / 24px gap. This is the documented cross-page mobile convention under K-023/K-028.

### §3.2 Mechanism — `margin-top` over `flex gap`

Home uses `flex flex-col gap-6 sm:gap-[72px]` on an inner wrapper. /about cannot use the same inner-wrapper trick without breaking K-031 `#architecture.nextElementSibling === <footer>` (since `nextElementSibling` looks at immediate DOM siblings, and an inner-wrapper flex-column would make sections siblings of each other but not of `<footer>`).

Therefore /about uses **`margin-top` on each section** (except S1, which gets `padding-top`). Byte-identical visual result for adjacent-section gap calculation:

- `Math.abs(section[i+1].top - section[i].bottom)` at desktop = `margin-top of section[i+1]` = 72 (because no `py-*` on sections).
- On mobile: 24.

Trade-off: `margin-top` does not collapse into parent padding on `/about` root `min-h-screen` (not a flex container), so there is no collapse-surprise risk. Pencil Y80Iv padding-top 72 is encoded by S1's `sm:pt-[72px]` — S1 is the first section, no predecessor to collapse with.

### §3.3 AC-045-SECTION-GAP assertion alignment

Ticket AC-045-SECTION-GAP asserts:
> "for each adjacent section pair `(section[i].bottom, section[i+1].top)`, `Math.abs(section[i+1].top - section[i].bottom) === 72 ± 2`"

Under the design: each section's bottom = top + content-height (no bottom padding on sections except S6); next section's top = prev bottom + margin-top 72. So the measured gap = 72 exactly on desktop. ✓

Also: "the vertical gap is contributed by a single layout mechanism (either consumer `flex flex-col gap-*` OR per-section `margin-*`, not accumulated from per-section `py-*`)" — margin-top is a single mechanism, satisfied. ✓

---

## §4 Pattern A Compliance (AC-045-K031-ADJACENCY-PRESERVED)

### §4.1 Explicit Pattern-A constraints encoded

1. 6 body `<section>` elements (+ S1 hero) are **direct children** of root `<div className="min-h-screen">`. No intermediary wrapper `<div>`.
2. `<Footer />` is the **last child** of root `<div>`.
3. `#architecture` (S6) is the **last `<section>`** before `<Footer />`, so its `nextElementSibling === <footer>`.
4. No `<div id="banner-showcase">` or any other node between S6 and Footer. (K-031 removed the banner-showcase in the past; reinstating it is forbidden by AC-031.)

### §4.2 AboutPage.tsx pseudo-diff

```tsx
// OLD (70 LOC)
export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <UnifiedNavBar />
      <SectionContainer id="header" width="narrow">
        <PageHeaderSection />
      </SectionContainer>
      <SectionContainer id="metrics" width="wide" divider>
        <SectionLabelRow label="Nº 01 — DELIVERY METRICS" />
        <MetricsStripSection />
      </SectionContainer>
      {/* … 4 more wide+divider SectionContainer … */}
      <SectionContainer id="architecture" width="wide" divider>
        <SectionLabelRow label="Nº 05 — PROJECT ARCHITECTURE" />
        <ProjectArchitectureSection />
      </SectionContainer>
      <Footer />
    </div>
  )
}

// NEW (~66 LOC, plus SectionLabelRow extracted to its own file)
export default function AboutPage() {
  const baseContainer = "px-6 sm:px-24 mx-auto max-w-[1248px] w-full"
  const bodyGap = "mt-6 sm:mt-[72px]"
  return (
    <div className="min-h-screen">
      <UnifiedNavBar />
      <section id="header" className={`pt-8 sm:pt-[72px] ${baseContainer}`}>
        <PageHeaderSection />
      </section>
      <section id="metrics" className={`${bodyGap} ${baseContainer}`}>
        <SectionLabelRow label="Nº 01 — DELIVERY METRICS" />
        <MetricsStripSection />
      </section>
      {/* … 3 more sections … */}
      <section id="architecture" className={`${bodyGap} mb-8 sm:mb-[96px] ${baseContainer}`}>
        <SectionLabelRow label="Nº 05 — PROJECT ARCHITECTURE" />
        <ProjectArchitectureSection />
      </section>
      <Footer />
    </div>
  )
}
```

Const hoists (`baseContainer`, `bodyGap`) are optional; Engineer may inline literally for grep-parity with HomePage. Design picks the readable variant.

### §4.3 K-031 Sacred grep proof

After migration:
- `grep -n 'id="architecture"' frontend/src/pages/AboutPage.tsx` → single hit, on a `<section>` directly inside root `<div className="min-h-screen">`.
- `document.getElementById('architecture').nextElementSibling` → `<footer>` ✓ (Footer is the next root child).
- `document.getElementById('banner-showcase')` → null (K-031 guard, unchanged) ✓.

---

## §5 Shared Component Inventory

| Component | Shared or page-specific | K-045 touches it? | Action |
|---|---|---|---|
| `UnifiedNavBar` | Shared (4 routes) | No | Unchanged |
| `Footer` (`components/shared/Footer.tsx`) | Shared (4 routes, byte-identical per K-034 P1) | No (structural position unchanged — still root sibling, full-bleed) | Unchanged |
| `BuiltByAIBanner` | Homepage-only | No | Unchanged |
| `SectionContainer` (`components/primitives/`) | Used only by /about (7 call sites) | YES — **DELETE** the file per Option α | Remove file; remove import from AboutPage.tsx |
| `SectionLabelRow` (currently inline in AboutPage) | Currently page-private inline definition; used 5× | **EXTRACT** to `components/about/SectionLabelRow.tsx` for clarity (K-045 incidental cleanup since AboutPage is being rewritten anyway) | Move 14 LOC to new file; export default |
| `PageHeaderSection` | About-only | YES — strip outer `py-20`; container responsibility moves to parent `<section id="header">` | Edit internal class `py-20 flex flex-col gap-[18px]` → `flex flex-col gap-[18px]` (drop `py-20`) |
| `MetricsStripSection`, `RoleCardsSection`, `ReliabilityPillarsSection`, `TicketAnatomySection`, `ProjectArchitectureSection` | About-only | No internal class change (they don't own container width/padding today) | Unchanged |
| `FileNoBar`, `CardShell`, `MetricCard`, `RoleCard`, `PillarCard`, `TicketAnatomyCard`, `ArchPillarBlock`, `RedactionBar` | About-only (used inside the 5 body sections) | No | Unchanged |
| `CtaButton`, `ExternalLink`, `SectionHeader`, `SectionLabel`, `LoadingSpinner`, `ErrorMessage` | Shared commons | No | Unchanged |

### §5.1 Cross-page duplicate audit (mandatory per `feedback_shared_component_inventory_check.md`)

Grep sweeps:

```bash
grep -rn 'max-w-\[1248px\]' frontend/src/
#   frontend/src/pages/HomePage.tsx  (2 occurrences, L22+L24 pattern — baseline)
#   frontend/src/pages/DiaryPage.tsx (1 occurrence, L42 <main> — baseline)
#   AFTER K-045: AboutPage.tsx will add 6 occurrences (one per <section>)

grep -rn 'sm:px-24' frontend/src/
#   Same three files, same positions. Post K-045 AboutPage adds 6.
```

**Decision per pattern:** **keep inline, do NOT extract a `<PageContainer>` primitive.** Rationale:

- Extracting a `<PageContainer>` primitive would require Home + Diary + About to all migrate (3-file refactor cascade) — out of scope for K-045.
- The pattern is 2 class strings; the cost of extraction (new primitive + props + tests + doc sync across 3 routes) exceeds the readability benefit.
- If Diary ever gains a `flex gap` inner wrapper (Home pattern), extraction becomes more attractive; revisit as TD.

**TD proposal:** file `TD-K045-01 PageContainer primitive extraction` as an optional follow-up; do NOT block K-045 on it.

Audit evidence:
```
Grepped `max-w-[1248px]`, `sm:px-24`, `pt-8.*sm:pt-\[72px\]` — 3 files (/Home, /Diary, /About).
No near-duplicates beyond the documented baseline pattern. Decision: inline K-045 migration; log TD for future primitive extraction.
```

### §5.2 Target-route consumer scan (K-030 2026-04-21 §)

`/about` is the target route. Entry points to `/about`:

```bash
grep -rn 'to="/about"\|href="/about"' frontend/src/
```
Expected hits: UnifiedNavBar (link), HeroSection CTA (maybe), BuiltByAIBanner (maybe). None of these care about /about's internal container structure — they only care that the route exists and renders. **All entry points: `aligned`** (no entry-point behavior change since routing / navigation semantics don't change).

---

## §6 E2E Test Plan

### §6.1 AC → spec mapping

| AC (ticket §4) | Minimum test IDs | Spec file | Action |
|---|---|---|---|
| AC-045-CONTAINER-WIDTH | T1 desktop 1280 width+padding on every section; T2 mobile 375 padding | `frontend/e2e/pages.spec.ts` new `describe('AboutPage — AC-045-CONTAINER-WIDTH')` block; OR new `frontend/e2e/about-layout.spec.ts` dedicated file | **NEW spec file** recommended: `frontend/e2e/about-layout.spec.ts` |
| AC-045-SECTION-GAP | T3 desktop 1280 adjacent-pair gap=72±2 for 5 adjacent pairs (S1↔S2 … S5↔S6); T4 mobile 375 gap=24±2 | `about-layout.spec.ts` | Mirror `pages.spec.ts:436-521` pattern (AC-028) |
| AC-045-HERO-LINE-COUNT | T5 hero h1 height≈109.2±2 at 1280; T6 role line height≈24±2; T7 tagline height≈25.2±2; T8 mobile 375 non-overlap | `about-layout.spec.ts` | new |
| AC-045-SECTION-LABEL-X | T9 desktop 1280: 5 section-labels left-edge vs wrapper inner-left=96±1; T10 mobile 375: left-edge=24±1; T11 hairline right-edge parity | `about-layout.spec.ts` | new; compatible with `about-v2.spec.ts:42-62` existing AC-022-SECTION-LABEL |
| AC-045-K031-ADJACENCY-PRESERVED | T12 `document.getElementById('architecture').nextElementSibling.tagName === 'FOOTER'` after migration; T13 last element child of root div === `<footer>`; T14 pattern-A structural grep | Existing `about-v2.spec.ts:387-404` continues to cover T12/T13 verbatim (**no new spec needed**); T14 optional DOM-structural assertion in `about-layout.spec.ts` | **Existing spec passes unchanged** — this is the Sacred gate |
| AC-045-SM-BOUNDARY | T15 @639 padding=24; T16 @640 padding=96; T17 @1440 padding=96 + container centered | `about-layout.spec.ts` | new |
| AC-045-FOOTER-WIDTH-PARITY | T18 /about Footer width≈1280 at 1280 viewport; T19 cross-route pairwise diff ≤2px (`/about` vs `/` vs `/diary`) at 1280/1440/375 | **Extend** `frontend/e2e/shared-components.spec.ts` with a new describe block `AC-045-FOOTER-WIDTH-PARITY` | Extend existing, not new file |
| AC-045-REGRESSION | All prior Sacred ACs continue to pass (K-017 AC-017-FOOTER, K-022 AC-022-SECTION-LABEL, K-022 AC-022-REGRESSION, K-024 AC-024-CONTENT-WIDTH, K-028 AC-028-SECTION-SPACING, K-031 AC-031-LAYOUT-CONTINUITY, K-034 P1 T1+T2, K-040 pairwise≤2px) | The full Playwright suite runs | Engineer gate: `npx playwright test` exit 0 |

### §6.2 Test ID count (Cross-Check — mandatory per architect.md §AC ↔ Test Case Count Cross-Check)

Ticket AC count: **7 new ACs + 1 regression AC = 8 ACs**. New T IDs declared: **T1–T19 (19 new assertions)**. Regression AC covered by re-running existing suite.

| AC | Test IDs assigned |
|---|---|
| AC-045-CONTAINER-WIDTH | T1, T2 |
| AC-045-SECTION-GAP | T3, T4 |
| AC-045-HERO-LINE-COUNT | T5, T6, T7, T8 |
| AC-045-SECTION-LABEL-X | T9, T10, T11 |
| AC-045-K031-ADJACENCY-PRESERVED | T12, T13 (both satisfied by existing `about-v2.spec.ts:387-404`), T14 (new optional) |
| AC-045-SM-BOUNDARY | T15, T16, T17 |
| AC-045-FOOTER-WIDTH-PARITY | T18, T19 |
| AC-045-REGRESSION | (no new; full-suite gate) |
| **TOTAL NEW** | **19 assertions across 8 ACs** |

Declared total: **19 new Playwright assertions** (T1–T19); T12/T13 may be covered by the existing K-031 spec keeping its green state (Engineer may skip adding duplicate assertions if the existing test green is sufficient — but T14 structural assertion in new spec is recommended). Final count: **min 17 new assertions (if T12/T13 delegated to existing spec) up to 19 (if all T1–T19 authored fresh)**. Engineer records final in the spec block header.

### §6.3 Spec file organisation

- **NEW**: `frontend/e2e/about-layout.spec.ts` — home for K-045 AC-045-CONTAINER-WIDTH / AC-045-SECTION-GAP / AC-045-HERO-LINE-COUNT / AC-045-SECTION-LABEL-X / AC-045-SM-BOUNDARY (T1–T17). Parallels `about-v2.spec.ts` naming convention.
- **EXTEND**: `frontend/e2e/shared-components.spec.ts` — add AC-045-FOOTER-WIDTH-PARITY block (T18–T19).
- **UNCHANGED (Sacred, must still green)**: `about-v2.spec.ts:387-404`, `about-v2.spec.ts:42-62`, `pages.spec.ts:436-521`, `shared-components.spec.ts:31-56`, `shared-components.spec.ts:160-180`, `sitewide-footer.spec.ts` full file.

---

## §7 File Change List

| File | Action | Responsibility (1 sentence) |
|---|---|---|
| `frontend/src/pages/AboutPage.tsx` | **MODIFY** | Rewrite body: 6 direct `<section>` children of root `<div>` with inline container classes + margin-based rhythm; drop SectionContainer import + local SectionLabelRow. |
| `frontend/src/components/primitives/SectionContainer.tsx` | **DELETE** | Legacy single-consumer primitive retired per BQ-045-02 Option α. |
| `frontend/src/components/about/SectionLabelRow.tsx` | **ADD** | Extract `<SectionLabelRow>` inline component from AboutPage.tsx (14 LOC, `{ label: string }` prop, renders mono label + `<div data-section-hairline>`). |
| `frontend/src/components/about/PageHeaderSection.tsx` | **MODIFY** | Drop outer `py-20`; inner structure (`flex flex-col gap-[18px]` + PageHero + divider + role line + tagline) unchanged. |
| `frontend/e2e/about-layout.spec.ts` | **ADD** | K-045 new suite hosting T1–T17 (6 new AC blocks). |
| `frontend/e2e/shared-components.spec.ts` | **EXTEND** | Append AC-045-FOOTER-WIDTH-PARITY describe (T18–T19). |
| `agent-context/architecture.md` | **EDIT** | §Directory Structure `primitives/` block (remove SectionContainer entry + `P1 /about 7 sections 外層 wrap` comment + update CardShell comment noting SectionContainer removal); §Frontend Routing `/about` row (update "7 sections" narrative to reference the 6-section structure and new Pencil-aligned container pattern); Summary section (add K-045 one-liner); `updated:` frontmatter date; `## Changelog` entry (this ticket). See §8 architecture.md self-diff plan for exact cells. |
| `docs/designs/K-045-design.md` | **THIS FILE** | Architect deliverable; PM reads; Engineer consumes. |
| `docs/retrospectives/architect.md` | **PREPEND** | Architect retrospective entry dated 2026-04-24 (per project rule). |
| `CHANGELOG` / `tech-debt.md` | **N/A** this ticket (TD-K045-01 PageContainer primitive optional follow-up may be filed by PM if they want to track it; Architect flags it but doesn't create) | — |

**NOT touched:** any other `.tsx` / `.ts` / `.css` files. Zero CSS tokens. Zero `tailwind.config.js` edits. Zero backend / Python.

---

## §8 Implementation Order (Phase breakdown)

### Phase 1 — SectionContainer decision execution + AboutPage container rewrite

**Scope:**
1. Add `frontend/src/components/about/SectionLabelRow.tsx` (extract from AboutPage inline).
2. Edit `frontend/src/pages/AboutPage.tsx` per §2.3 tree.
3. Delete `frontend/src/components/primitives/SectionContainer.tsx`.
4. Edit `frontend/src/components/about/PageHeaderSection.tsx` (drop `py-20`).

**Commit gate (before Phase 2):**
- `npx tsc --noEmit` exit 0.
- Subset Playwright: `about-v2.spec.ts` + `shared-components.spec.ts` + `sitewide-footer.spec.ts` all green (proves K-031 adjacency + K-034 Footer byte-identity preserved).
- `grep -rn 'SectionContainer' frontend/src/` returns **0 results** (primitive fully retired).

**Do not proceed to Phase 2 until this commit gate passes.**

### Phase 2 — Vertical rhythm assertion + hero-specific padding tuning

**Scope:** none if Phase 1's AboutPage edit already landed the correct `mt-6 sm:mt-[72px]` / `pt-8 sm:pt-[72px]` / `mb-8 sm:mb-[96px]` classes. This Phase is a measurement sanity check.

**Commit gate:** visual eyeball at 375 / 640 / 1280 / 1440 in dev server, confirm gap = 72px desktop / 24px mobile; PageHeaderSection hero top matches Home's `pt-8 sm:pt-[72px]` first-element position visually.

If measurements drift, file a hotfix commit before Phase 3.

### Phase 3 — E2E spec authoring (K-045 AC assertions)

**Scope:**
1. Create `frontend/e2e/about-layout.spec.ts` with T1–T17.
2. Append `AC-045-FOOTER-WIDTH-PARITY` block (T18–T19) to `frontend/e2e/shared-components.spec.ts`.

**Commit gate:**
- `npx playwright test` exit 0 (**full suite**, not subset — regression gate for AC-045-REGRESSION).
- All 17+ new test IDs present (grep `'T1' through 'T19'` or AC-045-* describe blocks).
- `npx tsc --noEmit` exit 0 (spec file TS coverage).

### Phase 4 — Docs + retrospective

**Scope:**
1. Edit `agent-context/architecture.md` per §8.1 Self-Diff plan.
2. Prepend retrospective entry to `docs/retrospectives/architect.md`.
3. Add K-045 retrospective to `docs/tickets/K-045-*.md` §8 Retrospective.

**Commit gate:** `updated:` date in architecture.md frontmatter = today; Changelog has K-045 entry.

### §8.1 Implementation parallelism

Phase 1 and Phase 3 have some parallel potential (spec can be drafted against the §2.3 tree before Phase 1 lands), but since Phase 1 will be a small commit, serial execution is recommended for clarity.

---

## §9 Regression Risk Matrix

| Sacred / prior AC | Risk under this design | Mitigation |
|---|---|---|
| K-017 AC-017-FOOTER (Footer CTA structure on /about) | OK — Footer is untouched; same `components/shared/Footer.tsx` rendered at root | Existing spec stays green |
| K-017 AC-017-HOME-V2 | N/A (different route) | — |
| K-022 AC-022-SECTION-LABEL (5 section labels + hairline on /about) | OK — labels + hairline extracted into dedicated `SectionLabelRow` component; selector `getByText('Nº 01 …', { exact: true })` still matches | `about-v2.spec.ts:42-62` unchanged, should PASS |
| K-022 AC-022-REGRESSION (K-017 assertions not regressed) | OK — no K-017 behaviors touched | — |
| K-022 AC-022-HERO-TWO-LINE (Hero mono, 2-line content) | AT-RISK (minor) — hero container width grows 768 → 1248 (BQ-045-05 Option A ruling). Hero `<h1>` content "One operator, orchestrating AI / agents end-to-end —" at Geist Mono 52px ≈ ~900px rendered width per PM BQ-045-05 readability check, still under 1248, so still wraps into two visual lines as intended | T5 assertion in AC-045-HERO-LINE-COUNT pins `h1.height ≈ 109.2 ± 2px` at 1280; also Engineer visual eyeball Phase 2 |
| K-023 AC-023-BODY-PADDING | N/A (homepage, different route) | — |
| K-024 AC-024-CONTENT-WIDTH (/diary 1248 container) | OK — /diary untouched | — |
| K-028 AC-028-SECTION-SPACING (/ section gap 72±2 desktop / 24±2 mobile) | OK — /homepage untouched | — |
| K-030 AC-030-APP-ISOLATION | OK — /app untouched | — |
| **K-031 AC-031-LAYOUT-CONTINUITY** (`/about #architecture → <footer>` sibling) | **CRITICAL — primary risk**. Design §2.3 mitigates by placing all 6 sections directly as root children of `<div className="min-h-screen">`; no intermediate wrapper; S6 (`#architecture`) is the last `<section>` before `<Footer>` | `about-v2.spec.ts:387-404` continues to PASS unchanged. Engineer Phase 1 commit gate REQUIRES this spec green before continuing. |
| K-034 Phase 1 AC-034-P1-ROUTE-DOM-PARITY (cross-route Footer byte-identical) | OK — Footer placement unchanged (root sibling, full-bleed) | `shared-components.spec.ts:31-56` T1 continues to PASS |
| K-034 Phase 1 snapshot per route | OK — Footer screenshot unchanged | Snapshot loop L160-180 continues to PASS |
| K-034 Phase 3 AC-034-P3-DIARY-FOOTER-RENDERS | N/A (/diary untouched) | — |
| K-040 AC-040-SITEWIDE-FONT-MONO | OK — no font changes | — |
| K-040 Footer pairwise width diff ≤ 2px (K-040 Item 3 / T19) | OK — Footer full-bleed at each route; /about Footer width = viewport width same as /, /diary | AC-045-FOOTER-WIDTH-PARITY T19 explicitly tests pairwise |
| K-042 `<PageHero>` usage (PageHeaderSection uses PageHero) | OK — PageHero props unchanged, only container wrapping changes | — |
| `data-section-hairline` locator (`about-v2.spec.ts:48`) | OK — hairline moved to new `SectionLabelRow` file but attribute preserved | — |

---

## §10 Open Questions for PM (BQ)

### BQ-045-ARCH-01 — about-v2.spec.ts vs about.spec.ts K-031 location drift

**Observation:** Ticket §4 AC-045-K031-ADJACENCY-PRESERVED and Architect Constraint reference `about.spec.ts:386-403` as the K-031 Sacred spec. Actual codebase at `ef3519d`: the K-031 `AC-031-LAYOUT-CONTINUITY` describe block lives in **`frontend/e2e/about-v2.spec.ts:387-404`**, not `about.spec.ts`. `about.spec.ts` (379 LOC) has no K-031 / `nextElementSibling` / `architecture` matches.

**Impact:** None on design or implementation (the Sacred assertion is what matters, and it exists at the correct functional location `about-v2.spec.ts:387-404`). Only the ticket's textual cross-reference is stale.

**Requested ruling (PM only — Architect cannot edit ticket AC per `feedback_ticket_ac_pm_only.md`):** PM please correct the ticket §4 AC-045-K031-ADJACENCY-PRESERVED reference from `about.spec.ts:386-403` to `about-v2.spec.ts:387-404` (same for §4a Architect Constraint). I am proceeding under the correct file reference.

---

## §X All-Phase Coverage + Delivery Gate

### §X.1 All-Phase Coverage Gate

This ticket is **frontend-only / single-phase-class**. `backend API` column is N/A (reason: no backend / wire-level / schema change — confirmed in §0.4 Gate 3 axis (a)).

| Phase | Backend API | Frontend Routes | Component Tree | Props Interface |
|---|---|---|---|---|
| 1 (Container rewrite) | ✅ N/A (no API) | ✅ § 2.3 | ✅ §2.3 | ✅ §2.4 |
| 2 (Vertical rhythm sanity) | ✅ N/A | ✅ §3 | ✅ (same as Phase 1) | ✅ (same as Phase 1) |
| 3 (E2E authoring) | ✅ N/A | ✅ §6 | ✅ (spec targets confirmed) | ✅ (no prop change) |
| 4 (Docs + retro) | ✅ N/A | ✅ §8.1 | ✅ (arch.md cells) | ✅ N/A |

### §X.2 Consolidated Delivery Gate Summary (per `architect.md §Consolidated Delivery Gate Summary`)

```
Architect delivery gate:
  all-phase-coverage=✓,
  pencil-frame-completeness=✓ (35VCj + 4CsvQ + wiDSi inspected; K-040 Decision Memo confirms),
  visual-spec-json-consumption=N/A — reason: ticket visual-delta=none, aligning to existing Pencil SSOT via K-040 Decision Memo §Item 3 numeric targets (desktopPaddingPx=96, maxWidthPx=1248); no new visual-spec.json artifact per ticket frontmatter `visual-spec: docs/designs/K-024-visual-spec.json (diary SSOT, referenced for cross-page parity)`,
  sacred-ac-cross-check=✓ (§9 enumerates K-017/022/024/028/030/031/034 P1+P3/040/042; K-031 is the one at risk and explicitly mitigated by §2.3 per-section root-child tree),
  route-impact-table=N/A — reason: ticket scoped to a single route (/about), no global CSS / sitewide token / shared primitive broadcast change (SectionContainer used only by /about per §5 inventory),
  cross-page-duplicate-audit=✓ (§5.1 grep output + TD-K045-01 flagged),
  target-route-consumer-scan=N/A — reason: no route navigation behavior change (no new-tab / SPA / redirect / auth semantics touched),
  architecture-doc-sync=pending (§8.1 cells listed; executed in Phase 4),
  self-diff=pending (executed Phase 4 before commit)
  → OK to release to Engineer for Phase 1 start
```

### §X.3 Architecture.md Self-Diff Plan (executed in Phase 4)

Before Architect declares K-045 complete, the following Edit cells will be applied to `agent-context/architecture.md` and each verified with Self-Diff:

| Cell | Section | Edit action |
|---|---|---|
| C1 | Frontmatter `updated:` (line 5) | Replace text with 2026-04-24 summary referencing K-045 design (SectionContainer retirement + /about container 1248+96 alignment + 17–19 new Playwright test IDs) |
| C2 | Summary bullet list (around L18-L19) | Add new bullet: `K-045 — /about desktop layout consistency (2026-04-24)：Architect 設計完成；SectionContainer primitive retire (BQ-045-02 Option α)；AboutPage.tsx 6 <section> 直接位於 root <div className="min-h-screen">；`max-w-[1248px] px-6 sm:px-24` + per-section `mt-6 sm:mt-[72px]` 取代 SectionContainer `py-16`；Pencil Y80Iv `[72,96,96,96] gap:72` 對齊；K-031 #architecture→<footer> 鄰接保留` |
| C3 | Directory Structure, L175 | Remove line `SectionContainer.tsx               ← P1；/about 7 sections 外層 wrap` |
| C4 | Directory Structure, L176 | Update `CardShell.tsx` comment — no longer references SectionContainer neighbor (copy-edit only) |
| C5 | Directory Structure, L178 (block trailing comment) | Append `（SectionContainer.tsx K-045 retired 2026-04-24; AboutPage.tsx 直接 inline container classes at 6 <section> 元素）` |
| C6 | Directory Structure, about/ block | Add `│   │           │   ├── SectionLabelRow.tsx              ← K-045 新增 (2026-04-24)；{ label: string } 渲染 Geist Mono 13px label + data-section-hairline 橫線；從 AboutPage.tsx inline 抽出` |
| C7 | Frontend Routing table `/about` row | Append `；**K-045（2026-04-24）desktop layout consistency**：AboutPage.tsx 6 <section> 直接為 root <div> 子元素，每 section 內 inline `max-w-[1248px] mx-auto px-6 sm:px-24` + `mt-6 sm:mt-[72px]` 垂直節奏；hero 移除 SectionContainer.width=narrow (768) 限制，per BQ-045-05 PM Option A 改 1248；SectionContainer primitive 於本 ticket retire` |
| C8 | `## Changelog` (bottom) | Prepend `- **2026-04-24**（Architect, K-045 design）— /about desktop layout consistency architected. Option α ruled for BQ-045-02 (SectionContainer 1-consumer primitive retired)…（full entry, ~150 words）` |

**Self-Diff Verification block** (executed in Phase 4, included in architecture.md commit):
```
Self-Diff Verification (K-045 Architect arch doc sync):
  C1 frontmatter updated: line 5 → 1 line edit ✓
  C2 Summary bullet add   → 1 new line  ✓
  C3 L175 SectionContainer removal → 1 line delete ✓
  C4 L176 CardShell comment tweak → 1 line edit ✓
  C5 L178 block trailing comment → 1 line append ✓
  C6 about/ block SectionLabelRow add → 1 new line ✓
  C7 Frontend Routing /about cell append → edit 1 cell ✓
  C8 Changelog prepend → 1 new paragraph ✓
  Total: 8 cells / ≈10 edited lines.
  Source of truth cross-check: Directory Structure shows primitives/ = {CardShell.tsx, ExternalLink.tsx} after C3;
    about/ block shows SectionLabelRow.tsx new addition after C6; both consistent. ✓
```

---

## Retrospective (single-ticket)

**Where most time was spent:** §1 BQ-045-02 decision matrix and §2.2/§2.3 pattern-A vs pattern-B resolution. Discovered that the naïve "copy HomePage body-wrapper pattern" would break K-031 adjacency; needed a third tree design (Option C, per-section container, no outer wrapper, margin-based rhythm).

**Which decisions needed revision:** initial §2.1 tree used HomePage's body+inner wrapper shape; iterative reasoning against the K-031 Sacred spec surfaced the adjacency break; revised to per-section tree in §2.3.

**Next time improvement:** when a ticket's §4a explicitly lists a constraint keyword (`MUST use pattern where each section carries its own container classes … MUST NOT wrap all 6 body sections inside a single parent wrapper`), run the DOM-adjacency dry-run **before** drafting the component tree, not after. Add a pre-flight "read Sacred constraints, enumerate each DOM-selector assertion, then design against them" step to Architect checklist.
