---
id: K-022
title: /about page structural detail alignment with design v2 (12 items)
status: closed
type: feat
priority: medium
created: 2026-04-20
---

## Background

After K-017 completed the `/about` copy structure (8 sections + 2 scope + 1 artifacts), PM compared the Pencil design v2 (frame `35VCj`) row-by-row against the Playwright visual report on 2026-04-20 and found 12 **structural detail** differences (section label, dossier header, hairline, redaction bar, annotation label, etc.) — these are detail-level visual fidelity items and require a dedicated ticket.

**Full ruling record:** memory `project_k017_design_vs_visual_comparison.md` (2026-04-20)

## Dependencies

- **Depends on K-021** (sitewide design system foundation): all UI assertions in this ticket reference Tailwind tokens / the three-font system / NavBar / Footer delivered by K-021
- Engineer implementation must not begin until K-021 is released

## Scope (12 structural alignment items)

Included:

### A-1 Section label + hairline
Each section displays a small-caps English label above (e.g., `SECTION · ROLES`), with a 1px hairline divider below

### A-2 Dossier header bar + FILE Nº
A dossier header bar (dark horizontal bar) at the very top of the `/about` page, containing the `FILE Nº` numbering

### A-3 Hero split into two lines
The PageHeaderSection's "One operator..." text is split into two visual layers:
- Main sentence (sans-serif display, large)
- Tail sentence "Every feature ships with a doc trail." (italic, small, separate line)

### A-4 Subtitle structure
Each section has an italic subtitle line (Newsreader italic) below the heading, as an independent visual layer separate from the title

### A-5 Redaction bar
Some metric / role card backend information is rendered as a black redaction bar (a rectangular black-out bar), simulating the "edited document" visual

### A-6 OWNS / ARTEFACT label
The two columns of the 6 Role Cards use small-caps Geist Mono labels `OWNS` / `ARTEFACT` (not the regular font)

### A-7 Link style
All links on the page use Newsreader italic + underline (not the standard `text-blue-600 hover:underline`)

### A-8 CASE FILE header
The `Anatomy of a Ticket` section is presented with a `CASE FILE` header (Geist Mono small-caps)

### A-9 LAYER label
Each of the three pillars in `How AI Stays Reliable` uses a `LAYER 1/2/3` prefix label

### A-10 Footer single line
The `FooterCtaSection` style at the bottom of `/about` keeps the K-017 AC-017-FOOTER spec (unchanged), but confirms that visuals are not broken after K-021 NavBar/font/palette changes (regression assertion)

### A-11 BEHAVIOUR / POSITION annotation
Annotations like `BEHAVIOUR` / `POSITION` in small Geist Mono are placed below Role Cards (marginalia in the design)

### C-4 Role grid height
The grid height of the 6 Role Cards aligns with the design (3×2 layout, each card has a fixed height)

### A-12 Shared primitives paper palette migration (K-021 Round 3 S-NEW-2 merged in)
The shared primitives components used by the `/about` main consumer still carry residual K-017 dark classes; this ticket migrates them to the paper palette:
- `components/shared/CardShell.tsx`
- `components/shared/SectionContainer.tsx`
- `components/shared/SectionHeader.tsx`
- `components/shared/SectionLabel.tsx`
- `components/shared/CtaButton.tsx`

**Inventory:** before implementation, Engineer greps the listed files for dark patterns such as `text-white` / `bg-gray-` / `border-white` / `#0[0-9A-F]{5}` and produces a full mapping table.
**Migration principle:** K-021 tokens are primary (`bg-paper` / `text-ink` / `border-ink`); if the /about design v2 includes dark blocks like the dossier header `bg-charcoal`, retain that semantic color.
**Regression consideration:** shared primitives are also used by AppPage (see K-026), but K-026 re-verifies AppPage child components; this ticket is responsible only for the /about main consumer visual assertions, while K-026 covers AppPage consumer regression.

**Not included (explicitly excluded):**
- B-1 Pillar `<code>` tags (in the design but not implemented)
- B-2 Ticket sub-descriptions (in the design but not implemented)
- B-3 Privacy footnote (note: AC-018-PRIVACY-POLICY compliance requires the Footer to keep the GA4 disclosure; do not remove)
- Copy changes (K-017 finalized the copy; this ticket only changes structural visuals)
- Adding / removing sections (scope is only minor adjustments to existing structure)

## Design Decisions Record

| Decision Item | Content | Source |
|---------------|---------|--------|
| 12-item scope split | Per PM row-by-row comparison result (memory A-1 ~ A-11 + C-4) | PM ruling 2026-04-20 |
| B-1/B-2/B-3 not done | User decided on 2026-04-20 to skip (not MVP-necessary) | User decision |
| AC-018-PRIVACY-POLICY retained | The GA4 disclosure is a K-018 compliance requirement; this ticket must not remove it | PM ruling |

## Acceptance Criteria

### AC-022-SECTION-LABEL: each section has a small-caps label + hairline above it `[K-022]`

**Given** the user visits `/about`
**When** the page scrolls to any section (Header / Metrics / Roles / Pillars / Tickets / Architecture / Footer)
**Then** a small-caps English label is displayed above the section (e.g., `SECTION · ROLES`), in Geist Mono small-caps (computed `fontFamily` includes "Geist Mono"; `textTransform` is `uppercase` or the original uppercase string)
**And** below the label is a 1px hairline divider (`borderBottom: 1px solid` or `<hr>` element), color `text-muted` / `border-muted`
**And** Playwright assertion: 5 section labels (Nº 01~05; Hero section has no label per the design, totaling 5) each contain the corresponding label string (with `{ exact: true }`)

---

### ~~AC-022-DOSSIER-HEADER: dossier header bar + FILE Nº at the top of the page `[K-022]`~~ **RETIRED 2026-04-23 K-034-Phase-2**

> **Retired 2026-04-23 by K-034 Phase 2 §5 drift audit (BQ-034-P2-ENG-02)** — DossierHeader component has no Pencil frame backing per §Phase 2 Drift Audit D-1 (Designer manifest DRIFT-P2-MISSING-FRAME confirmed `frame 35VCj` contains no dossier bar subtree). Pencil SSOT supersedes pre-Phase-0 AC Sacred clauses per Q6c + `feedback_pm_ac_pen_conflict_escalate.md`. Superseded by **AC-034-P2-DRIFT-D1** (DossierHeader component retired) + **AC-034-P2-SACRED-RETIRE**. AC text body preserved below as historical record.


**Given** the user visits `/about`
**When** the page finishes loading
**Then** a dark dossier header bar is displayed at the top of the page (below the NavBar)
**And** the bar background color is `bg-charcoal` (`#2A2520`), text color white
**And** the bar contains the `FILE Nº` text followed by a number (e.g., `FILE Nº · K-017 / ABOUT`)
**And** Playwright assertion: dossier header bar exists, contains the `FILE Nº` string (with `{ exact: true }`)

---

### ~~AC-022-HERO-TWO-LINE: Hero split into two visual lines `[K-022]`~~ **RETIRED 2026-04-23 by K-040 sitewide font reset**

> **Retired 2026-04-23 by K-040 (AC-040-SITEWIDE-FONT-MONO).** The Bodoni-Moda-display + Bodoni-Moda-italic typographic voice is retired sitewide; About PageHeader Hero renders in Geist Mono at Designer-calibrated 52px, italic OFF (per `docs/designs/K-040-designer-decision-memo.md` `about-v2.frame-wwa0m` sub-nodes `nolk3` (line 1) / `02p72` (line 2)). The two-line visual break + main/tail spacing contract is preserved (structural layout unchanged); only the font family + italic axis inverts. Engineer rewrites the corresponding `about-v2.spec.ts:66-83` assertion block (Bodoni Moda + italic → Geist Mono + style=normal) as part of AC-040-SITEWIDE-FONT-MONO implementation, NOT as regression. AC text body preserved below as historical record.

**Given** the user visits `/about`
**When** the page finishes loading
**Then** the PageHeaderSection's "One operator, orchestrating AI agents end-to-end — PM, architect, engineer, reviewer, QA, designer." renders as the main visual large text in display font (Bodoni Moda / serif display)
**And** "Every feature ships with a doc trail." is on a separate line, font is Bodoni Moda italic, font size visibly smaller than the main sentence
**And** there is visual spacing between the main and tail sentences (`margin-top` or `gap`), not crammed onto the same line
**And** Playwright assertion: main sentence computed `fontFamily` includes "Bodoni Moda"; tail sentence computed `fontFamily` includes "Bodoni Moda" and `fontStyle` is `italic` (Pencil node TQmUG: Bodoni Moda 22px italic, §2.7)

---

### ~~AC-022-SUBTITLE: each section has an italic subtitle `[K-022]`~~ **RETIRED 2026-04-23 by K-040 sitewide font reset**

> **Retired 2026-04-23 by K-040 (AC-040-SITEWIDE-FONT-MONO).** The Newsreader italic subtitle voice is retired sitewide; 5 About section subtitles render in Geist Mono with `font-style: normal` per Designer decision memo. The structural contract ("each section has a subtitle line under its main title") is preserved; only the font family + italic axis inverts. Engineer rewrites the corresponding `about-v2.spec.ts:114-131` assertion block (3× Newsreader italic computed-style assertions → Geist Mono + style=normal) as part of AC-040-SITEWIDE-FONT-MONO implementation, NOT as regression. Note: K-034 Phase 2 `AC-034-P2-DRIFT-D26-SUBTITLE-VERBATIM` text-content assertions (verbatim subtitle strings) remain in force — K-040 inverts only the font axis, not the text content. AC text body preserved below as historical record.

**Given** the user visits `/about`
**When** the page scrolls to any of Metrics / Roles / Pillars / Tickets / Architecture sections
**Then** an italic subtitle line (Newsreader italic) is displayed below the section main heading
**And** the subtitle text is a one-sentence description for that section (content finalized by Architect and Designer; preserves K-017 copy spirit)
**And** Playwright assertion: each of the 5 sections contains an italic-font subtitle (computed `fontStyle` = `italic` and `fontFamily` includes "Newsreader")

---

### AC-022-REDACTION-BAR: some information rendered as redaction bar `[K-022]`

**Given** the user visits `/about`
**When** the page scrolls to the Metrics or Roles section
**Then** at least one metric subtext or role artefact field is rendered with a redaction bar (black rectangular blackout bar) visual style
**And** the redaction bar's `backgroundColor` is `bg-ink` or `bg-charcoal`, `height` matches the design (Architect supplies the value)
**And** the redaction bar does not affect actual text content (text remains in DOM, only visually covered)
**And** Playwright assertion: at least one `[data-redaction]` or class `.redaction-bar` element exists

---

### AC-022-OWNS-ARTEFACT-LABEL: Role Cards field labels use Geist Mono small-caps `[K-022]`

**Given** the user visits `/about`
**When** the page scrolls to the Role Cards section
**Then** the field labels `OWNS` and `ARTEFACT` on the 6 cards are rendered in Geist Mono small-caps (computed `fontFamily` includes "Geist Mono"; `textTransform` is `uppercase` or the original uppercase string)
**And** label font size is 10-11px (Architect supplies the precise value)
**And** label color is `text-muted` (`#6B5F4E`)
**And** Playwright assertion: 6 Role Cards each contain two labels (`OWNS` + `ARTEFACT`), totaling 12 assertions

---

### ~~AC-022-LINK-STYLE: in-page links use Newsreader italic + underline `[K-022]`~~ **RETIRED 2026-04-23 K-034-Phase-2**

> **Retired 2026-04-23 by K-034 Phase 2 §5 drift audit (BQ-034-P2-ENG-02)** — K-034 Phase 2 Pencil SSOT (frame `35VCj` + sub-frames) establishes link styling from JSON source-of-truth; pre-Phase-0 assumptions (Newsreader italic + underline across all `/about` links) superseded by per-drift-row Pencil-exact assertions. Pencil SSOT supersedes pre-Phase-0 AC Sacred clauses per Q6c + `feedback_pm_ac_pen_conflict_escalate.md`. Superseded by Phase 2 drift rulings (see §5 Phase 2 Drift Audit) + **AC-034-P2-SACRED-RETIRE**. AC text body preserved below as historical record.


**Given** the user visits `/about`
**When** any in-page link (Ticket cards' GitHub link / Pillar inline link / Footer CTA's email/GitHub/LinkedIn link)
**Then** link font is Newsreader italic (computed `fontFamily` includes "Newsreader"; `fontStyle` = `italic`)
**And** link style includes underline (computed `textDecoration` includes `underline`)
**And** Playwright assertion: at least one `<a>` element with computed `fontStyle` = `italic` and `textDecoration` containing `underline`

---

### AC-022-CASE-FILE-HEADER: Anatomy of a Ticket section presented with CASE FILE header `[K-022]`

**Given** the user visits `/about`
**When** the page scrolls to the `Anatomy of a Ticket` section
**Then** the section label is `CASE FILE` (replacing the standard label)
**And** the font is Geist Mono small-caps
**And** Playwright assertion: the `CASE FILE` string exists above the section (with `{ exact: true }`)

---

### ~~AC-022-LAYER-LABEL: How AI Stays Reliable three pillars include LAYER prefix label `[K-022]`~~ **RETIRED 2026-04-23 K-034-Phase-2**

> **Retired 2026-04-23 by K-034 Phase 2 §5 drift audit (BQ-034-P2-ENG-02)** — K-034 Phase 2 Pencil SSOT (frame `35VCj` Reliability sub-frame) shows pillar label copy is `FILE Nº 0N · PROTOCOL` (not `LAYER 1/2/3` as K-022 AC asserted). Pencil SSOT supersedes pre-Phase-0 AC Sacred clauses per Q6c + `feedback_pm_ac_pen_conflict_escalate.md`. Superseded by Phase 2 drift rulings (pillar label copy normalized to Pencil-exact `FILE Nº 0N · PROTOCOL`) + **AC-034-P2-SACRED-RETIRE**. AC text body preserved below as historical record.


**Given** the user visits `/about`
**When** the page scrolls to the `How AI Stays Reliable` section
**Then** the three pillars (Persistent Memory / Structured Reflection / Role Agents) each have a `LAYER 1` / `LAYER 2` / `LAYER 3` prefix label
**And** label font is Geist Mono small-caps, font size 10-11px
**And** Playwright assertion: each pillar contains the corresponding `LAYER 1` / `LAYER 2` / `LAYER 3` string (with `{ exact: true }`)

---

### AC-022-FOOTER-REGRESSION: Footer CTA visuals not broken after K-021 changes `[K-022]`

**Given** K-017 AC-017-FOOTER was PASS at K-017 close (`/about` bottom shows `<FooterCtaSection />`)
**When** K-021 + K-022 implementation is complete
**Then** `<FooterCtaSection />` still exists at the bottom of `/about`
**And** content keeps the K-017 spec (Let's talk → / email / GitHub / LinkedIn)
**And** visuals are not broken by K-021 palette changes (Reviewer / QA visually confirm `<FooterCtaSection />` joins naturally with the page's beige body palette)
**And** Playwright assertion: all K-017 AC-017-FOOTER `/about` assertions still PASS

---

### ~~AC-022-ANNOTATION: marginalia annotations below Role Cards `[K-022]`~~ **RETIRED 2026-04-23 K-034-Phase-2**

> **Retired 2026-04-23 by K-034 Phase 2 §5 drift audit (BQ-034-P2-ENG-02)** — K-034 Phase 2 Pencil SSOT (frame `35VCj` RoleCardsSection) shows RoleCard subtree contains OWNS/ARTEFACT labels only; POSITION/BEHAVIOUR marginalia is absent from Pencil. Pre-Phase-0 AC assumption (annotation marginalia required) superseded. Pencil SSOT supersedes pre-Phase-0 AC Sacred clauses per Q6c + `feedback_pm_ac_pen_conflict_escalate.md`. Superseded by Phase 2 drift rulings (RoleCard POSITION/BEHAVIOUR annotation removed) + **AC-034-P2-SACRED-RETIRE**. AC text body preserved below as historical record.


**Given** the user visits `/about`
**When** the page scrolls to the Role Cards section
**Then** at least one card has an annotation (marginalia style) labeled `BEHAVIOUR` or `POSITION` in small Geist Mono below or alongside the card
**And** annotation font size 9-10px, color `text-muted`
**And** Playwright assertion: at least one `BEHAVIOUR` or `POSITION` string exists in the Role Cards section (with `{ exact: true }`)

---

### AC-022-ROLE-GRID-HEIGHT: Role Cards grid height aligns with the design `[K-022]`

**Given** the user visits `/about`
**When** the page scrolls to the Role Cards section
**Then** 6 role cards arranged in a 3-column × 2-row grid
**And** each card's computed `height` is identical (tolerance ≤ 2px)
**And** the grid container's gap aligns with the design (Architect supplies the value)
**And** Playwright assertion: max-min difference of `getBoundingClientRect().height` across the 6 cards ≤ 2px

---

### AC-022-REGRESSION: K-017 existing assertions do not regress `[K-022]`

**Given** all K-017 AC (AC-017-*) were PASS at K-017 close
**When** this ticket's implementation is complete
**Then** all K-017 Playwright assertions still PASS
**And** in particular, the copy assertions in each section AC-017-HEADER / AC-017-METRICS / AC-017-ROLES / AC-017-PILLARS / AC-017-TICKETS / AC-017-ARCH / AC-017-FOOTER do not regress
**And** `npx tsc --noEmit` exit 0

---

## Release Status

**Pending K-021 completion + Architect design:** after K-021 is released, Architect picks up K-022 and produces the design doc `docs/designs/K-022-about-structure.md`, covering:
- Component tree diff for the 12 structural detail items (which are new components, which are existing components with new props)
- Precise dimensions / padding / font size extraction from Pencil v2 frame `35VCj`
- data-testid and Playwright selector strategy for redaction bar / annotation
- Implementation approach for Role Card grid height alignment (CSS grid vs flex + fixed height)

## Related Links

- [PRD.md — K-022 section](../../PRD.md) (pending sync backfill)
- [memory: project_k017_design_vs_visual_comparison.md](~/.claude/projects/-Users-yclee-Diary/memory/project_k017_design_vs_visual_comparison.md)
- [K-017 ticket (preceding copy)](./K-017-about-portfolio-enhancement.md)
- [K-021 ticket (preceding foundation)](./K-021-sitewide-design-system.md)
- [Design: homepage-v2.pen frame 35VCj](../../frontend/design/homepage-v2.pen)

---

## Retrospective

(Architect / Engineer / Reviewer / QA / Designer each add their reflection at completion stage; PM consolidates after QA PASS)

### 2026-04-21 — Engineer — K-022 /about structural detail alignment v2

**Done well:**
- After reading design doc §2.7, discovered the old `AC-017-HEADER` assertion assumed "PM, architect..." was inside `<h1>`, but the A-3 design explicitly required moving the role list into a Newsreader italic `<p>`. During Stage 6 full run, only 1 fail surfaced; localization was fast (assertion logic problem, not a code error), and acted only after confirming design intent before updating the old assertion.
- Stage 1 → Stage 6 strictly executed in design doc order; ran `npx tsc --noEmit` after each Stage; tsc exit 0 throughout, no stacking of unverified changes.
- RedactionBar and DossierHeader were the only two new components in this ticket; test attributes such as `data-redaction` / `data-testid="dossier-header"` / `data-section-hairline` / `data-section-subtitle` / `data-annotation` were added during implementation, so E2E assertions could map directly without extra grep.

**Done poorly:**
- The AC-017-HEADER regression test fail was predictable: design doc §2.7 explicitly split the role list "PM, architect..." from `<h1>` into a Newsreader italic `<p>`, which means the old K-017 `about.spec.ts` assertion `await expect(h1).toContainText('PM, architect...')` necessarily required updating. But before implementing I did not pre-read the old E2E spec to confirm this; only discovered it during Stage 6 full run. Root cause: the pre-implementation checklist did not include "read the old E2E spec, compare against the design doc, and list old assertions that will inevitably break due to A-3 structural rework".

**Next time improvement:**
- Before implementation, for each structural rework in the design doc (h1 / p hierarchy change, component split, etc.), first grep the corresponding old E2E spec assertions, list which will break due to structural changes, pre-confirm the update strategy, and only then begin Stage 1. This way Stage 6 full run will not surface "unexpected" old-assertion fails.

### 2026-04-21 — Reviewer — K-022 Project Depth Review

**Done well:**
- Walked the design doc §10 doc-sync checklist row-by-row against the diff, discovered `agent-context/architecture.md` was not updated within the K-022 commit range (the design doc explicitly listed Changelog + shared primitives table updates as deliverables).
- A-12 shared primitives dark pattern grep was run file by file, confirming `SectionLabel.tsx` retains old colors (purple/cyan/pink/white) per the design doc's backward-compatibility principle, and that /about does not use SectionLabel (uses SectionLabelRow), so it does not affect this ticket's AC.
- Discovered AC-022-HERO-TWO-LINE's AC text description (Newsreader italic) was inconsistent with Pencil empirical data (Bodoni Moda TQmUG); Architect already annotated it in design doc §2.7 and verified per design in E2E, but the ticket AC itself was not synced.

**Done poorly:**
- AC-022-SECTION-LABEL ticket AC says "6 sections", design doc §3.1 lists 5 labels (Nº 01~05), and the implementation has 5; the number discrepancy should have been flagged at the start of review for PM to confirm AC number correctness, not discovered at the tail end of review.
- AC-022-HERO-TWO-LINE ticket AC was inconsistent with the design (tagline font Newsreader vs Bodoni Moda); Architect adjusted the design doc but did not write back to ticket AC; Reviewer flags this as a Warning this round and should explicitly require Architect to add the writeback flow as a hard step.

**Next time improvement:**
- At review start, fixed-format grep numbers in ticket AC ("N sections" / "N cards"), compare against design doc list and E2E spec count assertions; flag a Warning immediately if the three sources disagree, not at the tail end.
- When the Architect overrides AC descriptions in design doc §2.x via Pencil empirical data, must synchronously Edit the corresponding ticket AC paragraph (codified as a hard step); Reviewer should verify in Step 2 whether design doc vs ticket AC are bidirectionally consistent.

### QA

**Regression tests that were insufficient:** AC-017-BUILD (depends on production build) is a known design skip, not a regression miss; all other assertions PASS; this ticket has no regression coverage gap.

**Edge cases not covered:** the I-1 fix (PillarCard overflow-hidden removed) only confirms no breakage via Playwright structural assertions; no extra "long text overflow boundary" visual edge-case spec was added — if PillarCard encounters extremely long text in the future, current tests cannot intercept it.

**Next time improvement:** when an Engineer fix involves removing layout guards such as overflow-hidden, QA must add an additional boundary spec (long-text or overflowing-content scenario) to confirm layout does not break after removal.

---

### PM Summary (2026-04-21)

**Process observation:** role collaboration on this ticket was overall smooth, with no cross-role rework rounds. Architect raised two Blocking Questions (BQ-022-01 / BQ-022-02), both clearly ruled before Phase Gate; Engineer was not blocked at start. Engineer strictly executed the Stage 1→6 verification chain, only one Code Review round was needed, and QA passed in one go (164 passed / 1 skipped / 0 failed); the entire flow had no rework cycle.

**Main problem root cause:** issues clustered in three-way information sync: "AC text vs design doc vs implementation". AC-022-HERO-TWO-LINE's tagline font (Newsreader vs Bodoni Moda) was corrected in the Architect design doc but not written back to ticket AC; AC-022-SECTION-LABEL's section count (ticket says 6, design doc / implementation both 5) is the same kind of issue. Underlying structure: after Architect Pencil empirical data overrides AC descriptions, "sync back to ticket AC" was not codified as a hard step, leaving ticket AC as stale information.

**Next ticket improvement:** (1) when any Architect design doc §2.x section overrides ticket AC description due to Pencil empirical data, must Edit the corresponding ticket AC paragraph in the same design-doc Edit (codified as a senior-architect.md hard step; proposed by Reviewer this round); (2) Reviewer Step 2 fixed-format grep numbers in ticket AC ("N sections" / "N cards"), compare three-way against design doc + E2E spec, flag a Warning immediately if inconsistent — these two, if codified into personas before the next ticket (K-023/K-024), can prevent the same kind of AC vs implementation number drift.
