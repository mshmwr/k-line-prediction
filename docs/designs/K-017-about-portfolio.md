---
title: K-017 — /about portfolio-oriented recruiter enhancement — Architecture
type: design
tags: [K-017, Architecture, Frontend, Scripts, Docs]
status: draft
authors: [senior-architect]
related_ticket: docs/tickets/K-017-about-portfolio-enhancement.md
updated: 2026-04-19
---

## Summary

K-017 rewrites `/about` as a portfolio-oriented recruiter page (8 sections), adds a thin banner on the homepage linking to `/about`, and delivers two supporting artifacts (`scripts/audit-ticket.sh` + `docs/ai-collab-protocols.md`). This design is pure UI + docs/script additions: no cross-layer API contract change, no backend change.

**Pass 2 (2026-04-19, cross-page component audit):** First round only split `/about` components, no cross-page duplicate audit. Pass 2 inventoried D1–D10 duplicate / inline patterns and extracted 7 primitives (P1–P7) + 1 hook (`useDiary`). MilestoneSection / DiaryPreviewEntry merged into `<MilestoneAccordion variant>`; CtaButton given `rel=noopener`; RoleCard interface reset to add `Reviewer` role. Primitives extracted only for K-017 new components (HomePage / existing about not migrated) to prevent scope creep.

**Pass 3 (2026-04-19, design update after Pencil reconciliation):** After Pencil batch_get, confirmed Homepage hpDiary and Diary dpList timeline DOM patterns are fundamentally different (former: `layout:none` + absolute rectangle rail + absolute marker; latter: flexbox two-column + left-border stroke, no separate rail / marker element). P5/P6 conditions invalidated, **formally deleted**. P4 MilestoneAccordion (variant="preview"|"full") also too divergent to share one primitive, **P4 deprecated**; each side implements separately: Homepage uses new `DiaryTimelineEntry.tsx` (layout:none absolute positioning); Diary keeps existing structure. P7 DiaryEntryRow deleted alongside P4. About S7 confirmed as `BuiltByAIBanner` mockup display card (not real banner component); `BuiltByAIBanner.tsx` stays in `HomePage.tsx`. `useDiary` hook retained (fetch logic still shareable; orthogonal to rendering pattern).

**Key decisions:**
1. `/about` component tree uses "one PRD section = one Section container component + multiple presentational sub-components" granularity. Of existing 14 about/ components, only 1 retained (`RoleCard` needs interface reset); other 13 deleted. Pass 2 wraps all new section outers with `<SectionContainer>` (P1); 5 cards share `<CardShell>` (P2).
2. `audit-ticket.sh` uses bash function modularisation + ANSI escape colour + early-skip-by-date; no jq / yq / node dependency.
3. `ai-collab-protocols.md` organised as mechanism three-section + curated retrospective appendix; each heading carries stable anchor ID for `/about` inline link jump.
4. Pass 2 blind-extracted P5 / P6 (`<VerticalRail>` / `<TimelineMarker>`) **formally deleted** after Pass 3 Pencil reconciliation (two pages do not share pattern); P4 / P7 also deprecated, each inlined.

---

## 1. Technical option selection

### Decision A: `/about` component-split granularity

| Option | Description | Trade-off |
|--------|-------------|-----------|
| A1. Single AboutPage.tsx with all JSX | One 600+ line file; all sections inline | Easy line reading, hard to unit test, violates existing components/about/ subdirectory convention |
| A2. Each PRD section = one container + sub-components as needed (recommended) | 8 `*Section.tsx` (7 new + 1 `PageHeaderSection` rewrite); MetricCard / RoleCard / PillarCard / TicketAnatomyCard / ArchPillarCard / FooterCtaLink etc. sub-components | Aligned with existing about/ subdirectory convention; Playwright can use `data-section` attr or section heading; each file < 120 lines |
| A3. One large config JSON + generic SectionRenderer | Centralised copy, fewer components | Playwright cannot use structural selector for precise assertion; AC-017-ROLES 18 assertions are field-ordering-sensitive; data-driven render drifts easily |

**Recommend: A2.** Playwright assertions (3–9 per section per AC) need recognisable semantic containers; existing `about/` directory has subcomponent convention; consistent style for codebase-reading recruiters.

### Decision B: `audit-ticket.sh` bash structure

| Option | Description | Trade-off |
|--------|-------------|-----------|
| B1. Single main + inline check | Quick | Hard to read, hard to extend, check-group boundaries blurry |
| B2. One bash function per check group (recommended) | `check_a_ticket_file` / `check_b_ac` / … / `check_g_qa` 7 functions + `main` dispatcher + `log_ok` / `log_warn` / `log_fail` / `log_skip` utilities | Clear modularity; future H/I groups need only +1 function; centralised echo logic eases test |
| B3. Use jq / yq for frontmatter parse | Precise parse | Non-stdlib dependency violates AC ("bash, no node / python runtime"); macOS lacks jq by default |

**Recommend: B2.** Frontmatter only reads `id` / `title` / `status` / `type` / `priority` / `created`; `grep -E` + `sed` suffices; jq dependency not worth it.

### Decision C: `ai-collab-protocols.md` doc structure

| Option | Description | Trade-off |
|--------|-------------|-----------|
| C1. Three flat sections (recommended) | `## Role Flow` / `## Bug Found Protocol` / `## Per-role Retrospective Log`; each contains intro + subsection + appendix citing retrospective excerpts | Simple; anchor IDs stable (markdown h2 auto-slug); recruiter linear-readable |
| C2. Group by "person / mechanism / evidence" theme | More narrative | Anchors do not match `/about` pillar names; need extra mapping table |
| C3. One section per retrospective | Most granular | Too long; breaks mechanism-focused principle (see K-017 PRD curation strategy) |

**Recommend: C1.** Aligns with existing PRD three-section naming + `/about` Section 4 pillar inline link target.

---

## 2.0 Shared Primitive & Reuse plan (2026-04-19 Pass 2 — cross-page component audit)

**Background:** First round (§2 onwards) only split `/about` components, no cross-page duplicate audit. Pass 2 full-scope scan identified 10 D1–D10 duplicate / inline patterns; user ruled per-item (see "Decision source" in each subsection).

**Scope principle:** Primitives extracted **only for K-017 new components** (HomePage / existing about / DiaryPage existing components NOT migrated) to prevent scope creep. Existing modifications limited to: `RoleCard` interface reset (D6 — old AiCollabSection deleted anyway); `CtaButton` adds `rel="noopener"` (D7); HomePage / DiaryPage diary fetch extracted as `useDiary` hook (D2).

### 2.0.1 Primitive component list

| # | Primitive | File | Used by | Decision source |
|---|-----------|------|---------|-----------------|
| P1 | `<SectionContainer>` | `frontend/src/components/primitives/SectionContainer.tsx` | K-017 /about 7 sections + HomePage new `BuiltByAIBanner` periphery does NOT use (it is thin banner with self-styling) | Q3-A (only K-017 new sections; HomePage existing not migrated) |
| P2 | `<CardShell>` | `frontend/src/components/primitives/CardShell.tsx` | `<MetricCard>` / `<RoleCard>` (rewrite) / `<PillarCard>` / `<TicketAnatomyCard>` / `<ArchPillarBlock>` | Q4-A + Q5-A (5 cards share shell, content components wrap) |
| P3 | `<ExternalLink>` | `frontend/src/components/primitives/ExternalLink.tsx` | `<FooterCtaLink>` (GitHub / LinkedIn) / `<TicketAnatomyCard>` GitHub link / `<PillarCard>` docs link (note: docs link is in-site relative path, **not external**; use `react-router-dom` `<Link>` or `<a href>`) | Q7-A + add `CtaButton` `rel="noopener"` alongside |
| P4 | ~~`<MilestoneAccordion>`~~ | **DELETED (Pass 3)** | Homepage hpDiary uses `layout:none` + absolute positioning (rectangle rail + marker); Diary dpList uses flexbox two-column (date + content with left-border stroke); DOM structures fundamentally different; cannot share variant prop. **P4 deprecated**: Homepage uses new `<DiaryTimelineEntry>` (`frontend/src/components/home/DiaryTimelineEntry.tsx`, layout:none absolute positioning matching design source); Diary keeps existing `MilestoneSection.tsx` / `DiaryEntry.tsx` (not deleted) | Pass 3 Pencil reconciliation |
| P5 | ~~`<VerticalRail>`~~ | **DELETED (Pass 3)** | Homepage uses `rectangle` id=`qNeCy` absolute inside frame; Diary dpList **has no separate rail rectangle**, uses flexbox right column `stroke:{align:"center", fill:"#1F1F1F", thickness:{left:1}}` for rail effect. Patterns differ; condition invalid; P5 deleted | Pass 3 Pencil reconciliation (batch_get confirmed) |
| P6 | ~~`<TimelineMarker>`~~ | **DELETED (Pass 3)** | Homepage hpDiary each entry has `cornerRadius:6, fill:"#9C4A3B", height:14, width:20` absolute marker; Diary dpList **has no marker element**. Not shared; P6 deleted | Pass 3 Pencil reconciliation (batch_get confirmed) |
| P7 | ~~`<DiaryEntryRow>`~~ | **DELETED (Pass 3)** | After P4 MilestoneAccordion deprecated, P7 design premise (Accordion-merge unified row) gone. Each page entry row keeps original implementation; no primitive | P4 deprecated |

**Convention:** all primitives in `frontend/src/components/primitives/` (new directory; not `common/`, because `common/` contains `LoadingSpinner` / `ErrorMessage` / `SectionLabel` / `SectionHeader` / `CtaButton` as domain-agnostic UI atoms; primitives are K-017 structural building blocks; semantically different; separate directory prevents `common/` bloat).

**Props interface (TypeScript pseudo-code):**

```ts
// P1 — SectionContainer
interface SectionContainerProps {
  width: 'narrow' | 'wide'      // narrow = max-w-3xl; wide = max-w-5xl
  divider?: boolean              // true → border-b border-white/10
  paddingY?: 'md' | 'lg'         // md = py-12; lg = py-16 (default)
  children: ReactNode
  id?: string                    // for anchor jump (e.g. AboutPage section anchor)
}

// P2 — CardShell
interface CardShellProps {
  padding?: 'sm' | 'md' | 'lg'  // sm = p-3; md = p-5 (default); lg = p-6
  borderColorClass?: string      // default 'border-white/10'
  children: ReactNode
  // No role-specific styling (color / icon passed via borderColorClass or wrap by content component)
}

// P3 — ExternalLink
interface ExternalLinkProps {
  href: string
  label: string
  className?: string             // external customisation for typography (ticket card vs footer differ)
  ariaLabel?: string
  // target="_blank" + rel="noopener noreferrer" hardcoded; no prop to prevent forgetting
}

// P4 — DELETED (Pass 3): MilestoneAccordion deprecated
// Homepage uses DiaryTimelineEntry (home/DiaryTimelineEntry.tsx, layout:none absolute positioning)
// Diary keeps existing MilestoneSection.tsx / DiaryEntry.tsx (not deleted)
interface DiaryTimelineEntryProps {
  milestone: DiaryMilestone     // for Homepage preview; layout:none absolute positioning matching design source
}

// P5 / P6 / P7 — DELETED (Pass 3)
// P5 VerticalRail: each page rail inlined (Homepage: absolute rectangle; Diary: flexbox left-border stroke)
// P6 TimelineMarker: Diary has no marker; Homepage marker inlined into DiaryTimelineEntry
// P7 DiaryEntryRow: deleted alongside P4
```

**Usage example (pseudo-JSX):**

```tsx
// /about S2 MetricsStrip
<SectionContainer width="wide" divider>
  <MetricCard title="Features Shipped" subtext="17 tickets, K-001 → K-017" />
  {/* MetricCard internally wraps CardShell */}
</SectionContainer>

// MetricCard.tsx internal
<CardShell padding="md">
  <h3>{title}</h3>
  <p>{subtext}</p>
</CardShell>

// /about Footer GitHub link
<ExternalLink href="https://github.com/..." label="GitHub" />

// DiaryPage
<MilestoneAccordion milestone={m} variant="full" defaultOpen={i===0} />

// HomePage DevDiarySection
<MilestoneAccordion milestone={m} variant="preview" />
```

### 2.0.2 Custom hook: `useDiary`

**Decision source:** Q2-A (extract in this ticket).

**File:** `frontend/src/hooks/useDiary.ts`

**Signature:**

```ts
interface DiaryState {
  entries: DiaryMilestone[]
  loading: boolean
  error: string | null
  refetch: () => void            // for ErrorMessage retry (DiaryPage existing behavior)
}

function useDiary(limit?: number): DiaryState
```

**Implementation outline (pseudo-code; matches HomePage / DiaryPage existing behavior):**

1. Internal `useAsyncState<DiaryMilestone[]>()` wraps status / data / error
2. `useEffect` on mount `fetch('/diary.json')` → fail `throw new Error('Failed to load diary: ${status}')`
3. On success, `limit` truthy → `data.slice(0, limit)`; else full
4. Returns `{ entries: state.data ?? [], loading: state.status === 'loading', error: state.error, refetch }`

**Edge cases:**
- `limit === 0` treated as truthy (returns empty array); does not fall back to full
- `fetch` network error `err.message` directly stored as error (matches existing)

**Migration plan (within K-017 scope):**
- `HomePage.tsx`: delete existing `useAsyncState` + `useEffect` + `.slice(0, 3)` block → `const { entries, loading, error } = useDiary(3)`; pass new structure to `<DevDiarySection>` (`milestones={entries} / loading={loading} / error={error}`)
- `DiaryPage.tsx`: delete existing fetch logic → `const { entries, loading, error, refetch } = useDiary()`; retry button connects `refetch`

### 2.0.3 Existing modification list (within K-017 scope)

| File | Modification | Why | Decision source |
|------|--------------|-----|-----------------|
| `frontend/src/components/about/RoleCard.tsx` | Interface from `{ role, responsibilities: string[], borderColorClass }` to `{ role, owns: string, artefact: string, borderColorClass? }`; `role` enum drops `'Senior Architect'`, adds `'Reviewer'` (keep `'Architect'` short version); old `responsibilities.map` JSX → two lines `Owns: ...` / `Artefact: ...` + wrap `<CardShell>` | K-017 S3 (AC-017-ROLES) requires Owns/Artefact fields; old AiCollabSection deleted anyway; old interface has no other caller | Q6-A (direct edit, no dual-export) |
| `frontend/src/components/common/CtaButton.tsx` | `external=true` branch `rel="noreferrer"` → `rel="noopener noreferrer"` | Currently missing `noopener` (see §7.3); Q7 alongside | Q7-A |
| `frontend/src/components/about/AiCollabSection.tsx` | **Delete entire file** | Old 5-role section replaced by K-017 S3 6-role RoleCardsSection | §2.2 prior decision |
| `frontend/src/components/about/PhaseGateBanner.tsx` | **Delete** | AiCollabSection was sole caller; deleted alongside | §2.2 prior decision |
| `frontend/src/pages/HomePage.tsx` | Use `useDiary(3)`; insert `<BuiltByAIBanner />` between `<UnifiedNavBar />` and `<HeroSection />`; add `<FooterCtaSection />` at page bottom (Q8 sitewide shared) | Q2-A + AC-017-BANNER + Q8 | Q2 + PRD |
| `frontend/src/pages/DiaryPage.tsx` | Use `useDiary()`; retry button connects `refetch`; add `<FooterCtaSection />` at page bottom (Q8 sitewide shared) | Q2-A + Q8 | Q2 |
| `frontend/src/components/diary/MilestoneSection.tsx` | **Keep unchanged** (Pass 3: P4 deprecated; Diary keeps existing flexbox two-column structure) | Pass 3 decision | Pass 3 |
| `frontend/src/components/diary/DiaryTimeline.tsx` | **Pass 3 fix: no change** (P4 deprecated; keep internal `<MilestoneSection>` reference as-is) | Pass 3 decision | Pass 3 |
| `frontend/src/components/diary/DiaryEntry.tsx` | **Keep unchanged** (Pass 3: P4/P7 deprecated; `DiaryEntry` still used internally by DiaryTimeline) | Pass 3 decision | Pass 3 |
| `frontend/src/components/home/DiaryPreviewEntry.tsx` | **Delete** | Replaced by Pass 3 new `<DiaryTimelineEntry>` (layout:none absolute positioning) | Pass 3 |
| `frontend/src/components/home/DevDiarySection.tsx` | Internal `<DiaryPreviewEntry>` → new `<DiaryTimelineEntry>` (layout:none absolute positioning); props `{ milestones, loading, error }` (matching `useDiary` return) | Pass 3 + Q2-A | Pass 3 + Q2 |

**Out of scope (explicit, prevent Engineer over-extension):**
- `StepCard.tsx` / `TechDecCard.tsx` (both planned to be deleted) NOT migrated to `<CardShell>`
- `HomePage.tsx` existing `<HeroSection>` / `<ProjectLogicSection>` / `<DevDiarySection>` outer NOT wrapped by `<SectionContainer>`
- Existing `common/` components (LoadingSpinner / ErrorMessage / SectionLabel / SectionHeader / CtaButton) NOT moved to `primitives/`

---

## 2. Component tree split (`/about` + homepage banner)

### 2.1 AboutPage new component tree (with primitive references)

**Legend:** `← P1` means node wraps `<SectionContainer>`; `← wraps P2` means node internal wraps `<CardShell>`; `← P3` means external link uses `<ExternalLink>`. Primitive list: §2.0.1.

```
AboutPage.tsx
  ├─ <UnifiedNavBar />                              (existing, unchanged)
  ├─ <SectionContainer width="narrow">              ← P1
  │     └─ <PageHeaderSection />                    (S1 — rewrite existing file; internal <SectionLabel>"PROJECT OVERVIEW" + <h1>)
  ├─ <SectionContainer width="wide" divider>        ← P1
  │     └─ <MetricsStripSection />                  (S2 — new)
  │           └─ <MetricCard title subtext /> × 4   ← wraps P2 <CardShell padding="md">
  ├─ <SectionContainer width="wide" divider>        ← P1
  │     └─ <RoleCardsSection />                     (S3 — new)
  │           └─ <RoleCard role owns artefact /> × 6 ← wraps P2 <CardShell padding="md">; interface reset (see §2.0.3)
  ├─ <SectionContainer width="wide" divider>        ← P1
  │     └─ <ReliabilityPillarsSection />            (S4 — new)
  │           └─ <PillarCard title body anchorQuote docsHref /> × 3
  │                 ├─ wraps P2 <CardShell padding="lg">
  │                 └─ docsHref = /docs/ai-collab-protocols.md#...  → use <a href> same-tab open (**not P3 ExternalLink**)
  ├─ <SectionContainer width="wide" divider>        ← P1
  │     └─ <TicketAnatomySection />                 (S5 — new)
  │           └─ <TicketAnatomyCard id title outcome learning githubHref /> × 3
  │                 ├─ wraps P2 <CardShell padding="md">
  │                 └─ githubHref → <ExternalLink>  ← P3
  ├─ <SectionContainer width="wide" divider>        ← P1
  │     └─ <ProjectArchitectureSection />           (S6 — new)
  │           └─ <ArchPillarBlock title body testingPyramid? /> × 3 ← wraps P2 <CardShell padding="md">
  └─ <SectionContainer width="wide">                ← P1 (no divider at bottom)
        └─ <FooterCtaSection />                     (S8 — new; **sitewide shared component**, also mounted on HomePage + DiaryPage; see Q8 decision)
              ├─ email → <a href="mailto:..."> (mailto not http; **not P3**)
              └─ GitHub / LinkedIn → <ExternalLink> × 2 ← P3
```

**Q8 decision (FooterCtaSection sitewide shared):** PM ruled (ticket design decision log 2026-04-19) Footer CTA is sitewide shared, not /about-only. React implementation: `FooterCtaSection.tsx` file stays in `about/` but HomePage, DiaryPage, AboutPage all import and render at page bottom. AC-017-FOOTER Playwright assertion on `/about` represents "sitewide shared component works correctly" (AC text: "Playwright assertion on `/about` page verifies three href complete match + `mailto:` prefix correct (representing sitewide Footer component)"); no need for separate E2E assertion per page; **Engineer must ensure HomePage + DiaryPage also include `<FooterCtaSection />`**.

**On S4 docs link vs ExternalLink:** `PillarCard.docsHref` is in-site relative path (`/docs/ai-collab-protocols.md#...`); must open same-tab (recruiter reads then back-button to `/about`). `<ExternalLink>` hardcodes `target="_blank"`; not applicable; use native `<a href={docsHref}>`.

**On S7 — `BuiltByAIBannerSection` (Pass 3 clarification):** AboutPage S7 in design source is a **mockup display card** (frame `35VCj` contains `bannerMock` + `annoRow`), showing homepage banner design screenshot, **not the real `<BuiltByAIBanner>` component**. AboutPage S7 React implementation is a static section showing banner design (image / screenshot / inline mockup); does not import or render `<BuiltByAIBanner />`. The real `<BuiltByAIBanner />` stays in `HomePage.tsx` (see §2.3). AboutPage S7 component renamed to `<BuiltByAIShowcaseSection />` (in `frontend/src/components/about/BuiltByAIShowcaseSection.tsx`) to distinguish "banner itself" from "display card".

### 2.2 Existing about/ file disposition

| Filename | Action | Reason |
|----------|--------|--------|
| `PageHeaderSection.tsx` | **Rewrite** (keep filename) | S1 new copy replaces old "What Is This Project?" |
| `RoleCard.tsx` | **Reset interface** (keep filename) | `responsibilities: string[]` → `owns: string; artefact: string`, matches AC-017-ROLES |
| `AiCollabSection.tsx` | **Delete** | Old 5-role cards replaced by S3 new 6-role cards |
| `HumanAiSection.tsx` / `ContributionColumn.tsx` | **Delete** | Old human-AI comparison; PRD no longer includes |
| `TechDecSection.tsx` / `TechDecCard.tsx` | **Delete** | Old tech decisions; replaced by S6 architecture snapshot |
| `TechStackSection.tsx` / `TechStackRow.tsx` | **Delete** | Old tech stack table; S6 contains key terms |
| `ScreenshotsSection.tsx` / `ScreenshotPlaceholder.tsx` | **Delete** | PRD has no screenshots section |
| `FeaturesSection.tsx` / `FeatureBlock.tsx` | **Delete** | PRD has no features list section |
| `PhaseGateBanner.tsx` | **Delete** | AiCollabSection adjunct; deleted alongside |

**New** (in `frontend/src/components/about/`):
`MetricsStripSection.tsx` / `MetricCard.tsx` / `RoleCardsSection.tsx` / `ReliabilityPillarsSection.tsx` / `PillarCard.tsx` / `TicketAnatomySection.tsx` / `TicketAnatomyCard.tsx` / `ProjectArchitectureSection.tsx` / `ArchPillarBlock.tsx` / `FooterCtaSection.tsx` / `FooterCtaLink.tsx`

### 2.3 Homepage BuiltByAIBanner + HeroSection v2 + ProjectLogicSection v2 + timeline component tree (with primitive references)

**Position:** in `HomePage.tsx`, below `<UnifiedNavBar />`, above `<HeroSection />` (thin banner between nav and hero, per PRD "thin banner at top").

**Component file:** `frontend/src/components/home/BuiltByAIBanner.tsx` (new, in home/ subdirectory; **does NOT wrap `<SectionContainer>`**; thin banner has full-width self-styling).

**Link mechanism:** uses `react-router-dom` `Link to="/about"` (SPA navigation; per AC "no full-page reload"). Entire banner wrapped in single `<Link>` so any click works.

```
HomePage.tsx
  ├─ <UnifiedNavBar />                              (existing)
  ├─ <BuiltByAIBanner />                            ← new (thin banner self-styled; not wrapping P1)
  ├─ <HeroSection />                                ← v2 design spec (see §2.3.1 below)
  ├─ <ProjectLogicSection />                        ← v2 design spec (see §2.3.2 below)
  ├─ <DevDiarySection milestones loading error />   (existing; Pass 3: use <DiaryTimelineEntry> replacing old DiaryPreviewEntry)
  │     └─ <DiaryTimelineEntry milestone={m}> × N  ← new (layout:none absolute positioning, replaces deprecated P4 MilestoneAccordion)
  └─ <HomeFooterBar />                              ← new (Pencil hpFooterBar spec: pure-text contact info; not wrapping P1; self-styled bottom)
```

#### §2.3.3 hpFooterBar spec (Pencil frame `4CsvQ` → child `1BGtd`)

**Pass 4 fix (Q8 Pencil reconciliation):** design source actually has pure-text `hpFooterBar`, not FooterCtaSection (which has email/GitHub/LinkedIn three independent external links). Two have different design intent; not interchangeable.

| Property | Value |
|----------|-------|
| Container ID | `1BGtd` (hpFooterBar) |
| Width | fill_container |
| padding | [20, 72] (top/bottom 20px, left/right 72px) |
| justifyContent | space_between |
| Top border | stroke inside, fill:#1A1814, thickness top:1 |
| Children | single text node (id: `W3zUd`) |
| Copy | `"yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn"` |
| Font | Geist Mono 11px, normal, letterSpacing:1 |
| Text colour | #6B5F4E (neutral grey-brown) |

**React implementation notes (HomeFooterBar.tsx):**
- New `frontend/src/components/home/HomeFooterBar.tsx` (in home/ subdirectory; Homepage-exclusive bottom bar)
- Pure text; one `<p>` or `<div>` wrapping entire copy; no separate `<a>` link (design source is display only, no P3 ExternalLink)
- Style: `font-mono text-[11px] tracking-[1px] text-[#6B5F4E]`; container `px-[72px] py-5 border-t border-[#1A1814] flex justify-between items-center w-full`
- No props; copy hardcoded

**Difference from FooterCtaSection:**
- `FooterCtaSection.tsx` (in about/): three independent links (email `<a mailto>`, GitHub/LinkedIn `<ExternalLink>`); for `/about` S8
- `HomeFooterBar.tsx` (in home/): pure text display; for `HomePage.tsx` bottom
- Not shared; each implemented separately

#### §2.3.1 hpHero v2 spec (Pencil frame `zyttw`)

**Layout structure:** single column `heroCol` (layout:vertical, gap:18, fill_container)

| Element | Copy | Style |
|---------|------|-------|
| Heading line 1 | `"K-line similarity"` *(updated K-057 2026-04-28)* | Geist Mono, 56px, bold, fill:#1A1814, lineHeight:1.1, textGrowth:fixed-width |
| Heading line 2 | `"lookup engine."` *(updated K-057 2026-04-28)* | same as above, fill:**#9C4A3B** (brick-dark; full-line colour change) |
| Divider | — | rectangle, width:fill_container, height:1, fill:#2A2520 |
| Subtitle | `"Pattern-matching engine for K-line candlestick charts. Upload historical data, find similar formations, and see what happened next."` | Newsreader, 18px, italic, fill:#1A1814, lineHeight:1.5, textGrowth:fixed-width |
| heroBtns container | — | layout:horizontal, gap:14, width:fill_container |
| CTA button `btnPrimary` | `"Run the ETH/USDT Demo →"` *(updated K-057 2026-04-28)* | fill:#2A2520, cornerRadius:6, padding:[12,26]; text Geist Mono 13px bold, letterSpacing:1, fill:#F4EFE5 |

**React implementation notes:**
- `<HeroSection />` no props; copy hardcoded matching Pencil source
- Heading two lines as **two independent `<h1>` elements** (or `<span>` with separate colour): line 1 `text-[#1A1814]`, line 2 `text-[#9C4A3B]`
- Divider: `<hr>` or `<div className="h-px bg-[#2A2520]">`
- CTA button `"Try the App →"`: wrap `<Link to="/app">` (SPA navigation); if external or reserved, `<a href="/app">`
- `heroBtns` contains single CTA only (Pencil source has one button)

#### §2.3.2 hpLogic v2 spec (Pencil frame `b8KQJ`)

**Layout structure:** layout:vertical, gap:28, width:fill_container

**logicHead subblock (`xqt6y`, layout:horizontal, gap:16, alignItems:center):**
| Element | Copy / property |
|---------|-----------------|
| `logicStamp` | `"§ PROJECT LOGIC"`, Geist Mono 16px bold, fill:#F4EFE5; bg fill:#9C4A3B; padding:[8,14]; rotation:**-3°** |
| Horizontal line | rectangle, width:fill_container, height:1, fill:#8B7A6B |
| Label | `"HOW IT WORKS"`, Geist Mono 11px, letterSpacing:2, fill:#1A1814 |

**Subtitle copy (`BMFct`):**
`"— The engine scans historical K-line data to find windows that resemble the current formation, then shows you the price action that followed."`
- Newsreader, 15px, italic, fill:#1A1814, lineHeight:1.6, textGrowth:fixed-width

**logicSteps container (`LTwuW`, layout:horizontal, gap:14, width:fill_container) — three equal-width step cards:**

| Step card | Header copy | Body title | Body description |
|-----------|-------------|------------|------------------|
| step1 | `"STEP 01 · INGEST"` | `"Upload"` | `"Drop in a CSV of 24 × 1H OHLC bars. The reference sample."` |
| step2 | `"STEP 02 · MATCH"` | `"Scan"` | `"Cosine similarity walks the history database to rank windows."` |
| step3 | `"STEP 03 · PROJECT"` | `"Project"` | `"Show the price action that followed each matched window."` |

Step card common style (`AP34H` / `4QeGF` / `BFjhU`):
- Container: layout:vertical, cornerRadius:6, border:1px solid #1A1814, fill:#F4EFE5, width:fill_container
- Header (`8mtkT`/`PBh8T`/`uT8HX`): fill:#2A2520, padding:[6,10], width:fill_container; text Geist Mono 10px, letterSpacing:2, fill:#F4EFE5
- Body (`yflh6`/`T9ULd`/`gxlZs`): layout:vertical, gap:12, padding:20
  - Title: Bodoni Moda 24px italic bold, fill:#1A1814
  - Divider: rectangle, width:40, height:1, fill:#2A2520
  - Description: Newsreader 13px italic, lineHeight:1.55, fill:#1A1814, textGrowth:fixed-width

**techRow (`MUEQA`, layout:horizontal, gap:10, alignItems:center):**
- Label: `"STACK —"` Geist Mono 11px, letterSpacing:2, fill:#6B5F4E
- Value: `"React · TypeScript · Vite · FastAPI · Python · Playwright"` Geist Mono 11px, letterSpacing:1, fill:#1A1814

**React implementation notes:**
- `logicStamp` rotation:-3° → use `className="rotate-[-3deg]"` (Tailwind)
- Three-column step cards use `<div className="grid grid-cols-3 gap-3.5">` or `flex gap-3.5`
- Step card header bg #2A2520 explicitly set `bg-[#2A2520]`; body bg #F4EFE5 inherits from parent
- `<ProjectLogicSection />` no props; copy hardcoded

**Homepage hpDiary implementation notes (Pass 3 Pencil reconciliation):**
- Rail: `position:absolute` `<div>` simulating rectangle (`fill:"#2A2520"`, `width:1`, `height:304`, `x:29, y:40`); inlined directly in `<DevDiarySection>` container
- Marker: each `<DiaryTimelineEntry>` internal absolute-positioned `<span>` (`cornerRadius:6, fill:"#9C4A3B", w-5 h-3.5, x:20, y:10`)
- Date / Title / Body all absolute-positioned (`x:92`), matching Pencil frame structure

**Homepage / Diary timeline pattern difference (Pass 3 confirmed):**
- Homepage hpDiary: `layout:none` frame + absolute rectangle rail + absolute marker per-entry
- Diary dpList: flexbox two-column (date left / content right); right column uses `stroke:{thickness:{left:1}}` for left-line rail; **no separate rail rectangle, no marker**
- Patterns fundamentally different → P5/P6/P4 deleted; each inlined (no more "conditional primitive" pending step)

**About S7 (Pass 3 clarification):** design source frame `35VCj` S7 `S7_BuiltByAIBannerSection` is mockup display card (`bannerMock` + `annoRow`), not real banner. React implementation is static `<BuiltByAIShowcaseSection />` showing banner design indication; real `<BuiltByAIBanner />` stays in `HomePage.tsx` here.

### 2.4 Props Interface (TypeScript pseudo-code)

```ts
// PageHeaderSection — no props; copy hardcoded matching AC-017-HEADER
interface PageHeaderSectionProps {}

// MetricsStripSection — no props; internal 4 MetricCard data
interface MetricCardProps {
  title: string
  subtext: string
}

// RoleCardsSection — no props; internal 6 role data
interface RoleCardProps {
  role: 'PM' | 'Architect' | 'Engineer' | 'Reviewer' | 'QA' | 'Designer'
  owns: string         // e.g. "Requirements, AC, Phase Gates"
  artefact: string     // e.g. "PRD.md, docs/tickets/K-XXX.md"
}

// ReliabilityPillarsSection — no props
interface PillarCardProps {
  title: 'Persistent Memory' | 'Structured Reflection' | 'Role Agents'
  body: ReactNode                    // may contain <code>; ReactNode for formatting flexibility
  anchorQuote: string                // blockquote italic quote
  docsHref: string                   // e.g. "/docs/ai-collab-protocols.md#per-role-retrospective-log"
}

// TicketAnatomySection — no props
interface TicketAnatomyCardProps {
  id: 'K-002' | 'K-008' | 'K-009'
  title: string                      // e.g. "UI optimization"
  outcome: string                    // one-line outcome
  learning: string                   // one-line learning
  githubHref: string                 // full GitHub blob URL
}

// ProjectArchitectureSection — no props
interface ArchPillarBlockProps {
  title: 'Monorepo, contract-first' | 'Docs-driven tickets' | 'Three-layer testing pyramid'
  body: ReactNode
  testingPyramid?: Array<{ layer: 'Unit' | 'Integration' | 'E2E'; detail: string }>
}

// FooterCtaSection
interface FooterCtaLinkProps {
  href: string
  label: string
  external: boolean                  // true → target=_blank + rel=noopener noreferrer
}

// Homepage banner
interface BuiltByAIBannerProps {}    // no props; copy hardcoded matching AC-017-BANNER
```

**Why no props for Section roots:** all copy is locked by PRD / AC; no external injection needed; hardcoded so grep for AC text lands one step. Sub-components (MetricCard / RoleCard / …) take props to reduce JSX duplication.

---

## 3. `scripts/audit-ticket.sh` architecture

### 3.1 File location

`/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/scripts/audit-ticket.sh`
(`scripts/` directory does not exist → create new; not `frontend/scripts/` or `backend/scripts/` because this script audits whole K-Line-Prediction subproject)

### 3.2 Modularisation (bash function split)

```bash
# Pseudo-code structure — not implementation

set -euo pipefail

# ── Utilities ─────────────────────────────────────
log_ok()    { printf '\033[0;32m[OK]\033[0m    %s\n' "$1"; }
log_warn()  { printf '\033[0;33m[WARN]\033[0m  %s\n' "$1"; warn_count=$((warn_count+1)); }
log_fail()  { printf '\033[0;31m[FAIL]\033[0m  %s\n' "$1"; fail_count=$((fail_count+1)); }
log_skip()  { printf '\033[0;90m[SKIP]\033[0m  %s\n' "$1"; }
header()    { printf '\n\033[1m=== %s ===\033[0m\n' "$1"; }

# Detect if stdout is TTY — when piped / CI, disable colour via NO_COLOR fallback
if [[ ! -t 1 ]] || [[ -n "${NO_COLOR:-}" ]]; then
  # redefine log_* to strip ANSI
fi

# Parse frontmatter field (grep + sed)
read_frontmatter_field() { … ; }     # $1=file, $2=field_name

# Date comparison helper — returns 0 if $1 < $2 (YYYY-MM-DD string compare works)
date_lt() { [[ "$1" < "$2" ]]; }

# ── Check Groups ──────────────────────────────────
check_a_ticket_file()      { … }    # frontmatter required + status=closed must have closed date
check_b_ac()               { … }    # ## Acceptance Criteria section exists + PRD.md grep "AC-XXX-"
check_c_architecture()     { … }    # docs/designs/K-XXX-*.md exists OR ticket declares "no Architecture needed"; design file needs ## Retrospective
check_d_commit_trail()     { … }    # git log --grep="K-XXX" ≥ 1 + exclude vague msg (wip/fix only)
check_e_code_review()      { … }    # ticket ## Retrospective has Reviewer reflection section
check_f_retrospectives()   { … }    # 5 roles reflection section + per-role log has ## YYYY-MM-DD — K-XXX entry
check_g_qa_playwright()    { … }    # grep spec + docs/reports/K-XXX-*.html exists

# ── Main Dispatcher ───────────────────────────────
main() {
  local ticket_id="$1"
  local ticket_file="docs/tickets/${ticket_id}-*.md"
  # glob expansion → take first match

  header "Ticket ${ticket_id}"

  # A is hard prerequisite — if fails, exit 2 immediately
  check_a_ticket_file "$ticket_id" || { log_fail "A failed; cannot continue"; exit 2; }

  check_b_ac "$ticket_id"
  check_c_architecture "$ticket_id"
  check_d_commit_trail "$ticket_id"
  check_e_code_review "$ticket_id"

  # F/G skip logic
  local created
  created=$(read_frontmatter_field "$actual_ticket_file" "created")
  if date_lt "$created" "2026-04-18"; then
    log_skip "F (created=$created < 2026-04-18 — before per-role retro mechanism enabled)"
    log_skip "G (same reason)"
  else
    check_f_retrospectives "$ticket_id"
    check_g_qa_playwright "$ticket_id"
  fi

  # Summary + exit code
  if (( fail_count > 0 )); then exit 2; fi
  if (( warn_count > 0 )); then exit 1; fi
  exit 0
}

main "$@"
```

### 3.3 Exit code rules

| Exit | Meaning | Trigger |
|------|---------|---------|
| 0 | All pass | No FAIL, no WARN |
| 1 | Warning | ≥1 WARN (e.g. D group vague commit msg) and no FAIL |
| 2 | Critical missing | ≥1 FAIL (e.g. ticket file missing, AC section missing) |

### 3.4 Date-based skip logic

- `created < 2026-04-18` → skip F / G (no WARN / FAIL count; informational)
- String comparison suffices: bash `[[ "$a" < "$b" ]]` lexicographic on `YYYY-MM-DD` is correct
- Boundary: `created = 2026-04-18` → **no skip** (mechanism enabled from inclusive day, matching PRD "K-008 onwards")

### 3.5 Output colouring strategy

- Use **ANSI escape codes** (`\033[...m`), not `tput`: `tput` depends on terminfo; some CI runners / `less -R` have compatibility issues
- TTY detect: `[[ -t 1 ]]`; non-TTY or `NO_COLOR` env → redefine `log_*` colourless
- Symbols unified: `[OK]` / `[WARN]` / `[FAIL]` / `[SKIP]`; no emoji (per CLAUDE.md spec + old-school CI log viewer compatibility)

### 3.6 File path assumptions

| Type | Path template | Check |
|------|---------------|-------|
| Ticket | `docs/tickets/K-XXX-*.md` (glob) | A, B, E, F |
| Design | `docs/designs/K-XXX-*.md` (glob, multiple) | C |
| PRD | `PRD.md` (project root) | B |
| Per-role retro | `docs/retrospectives/{pm,architect,engineer,reviewer,qa,designer}.md` | F |
| Visual report | `docs/reports/K-XXX-*.html` (glob) | G |
| Playwright specs | `frontend/e2e/*.spec.ts` (grep K-XXX) | G |
| Git log | `git log --all --grep="K-XXX" --oneline` | D |

**Working directory:** script must run from project root (K-Line-Prediction/). Script header adds:
```bash
cd "$(dirname "$0")/.." || exit 2    # auto-cd to project root
```

---

## 4. `docs/ai-collab-protocols.md` structure

### 4.1 File location

`/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/docs/ai-collab-protocols.md`

### 4.2 Section structure

```markdown
---
title: AI Collaboration Protocols — K-Line Prediction
type: reference
tags: [AI-Collab, Protocols, Public]
updated: YYYY-MM-DD
---

# AI Collaboration Protocols

[1 paragraph intro — One operator, 6 AI agents, every feature leaves a doc trail.]

## Role Flow  {#role-flow}
### The 6 Roles
[Table mirroring /about S3 — Role / Owns / Artefact]
### Handoff Sequence
[PM → Architect → Engineer → Reviewer → QA → PM diagram in ASCII or simple prose]
### What "No artifact = no handoff" means
[Verifiable via ./scripts/audit-ticket.sh K-XXX]

## Bug Found Protocol  {#bug-found-protocol}
### The Four Steps
1. Reflect (responsible role)
2. PM confirms reflection quality
3. Write memory entry
4. Fix released
### Example — K-008 W2/S3
[2-3 sentences pointing to actual ticket]
### Example — K-009 TDD bug fix
[2-3 sentences]

## Per-role Retrospective Log  {#per-role-retrospective-log}
### Mechanism
[docs/retrospectives/<role>.md; enabled from K-008; YYYY-MM-DD / Done well / Done poorly / Improvements format]
### Curated Retrospective Excerpts  {#curated-excerpts}
[2–3 curated English excerpts — see §4.4 selection criteria]

## Verification
[How a recruiter can verify — ./scripts/audit-ticket.sh K-002 / K-008 / K-009]
```

### 4.3 Anchor ID plan

GitHub-flavoured markdown auto-generates anchor from H2 slug, but for stability we **explicitly add `{#id}`** (redcarpet ignores; GFM keeps; markdown-it most renderers support).

| Pillar in `/about` S4 | Inline link target | Markdown anchor |
|-----------------------|---------------------|-----------------|
| Persistent Memory | `/docs/ai-collab-protocols.md#per-role-retrospective-log` | `## Per-role Retrospective Log  {#per-role-retrospective-log}` |
| Structured Reflection | `/docs/ai-collab-protocols.md#bug-found-protocol` | `## Bug Found Protocol  {#bug-found-protocol}` |
| Role Agents | `/docs/ai-collab-protocols.md#role-flow` | `## Role Flow  {#role-flow}` |

**Note:** PRD AC-017-PILLARS says "each pillar bottom has inline link to `/docs/ai-collab-protocols.md`" — does not enforce anchor. But without anchor, recruiter must scroll manually to find section. **Recommend Engineer add anchor and note "exceeding AC minimum requirement for UX gain" in PR description**, PM confirms.

**Deployment consideration:** Firebase Hosting rewrite already routes all non-asset requests to `/index.html` SPA. Static `.md` access requires:
- Option 1 (recommended): **copy `docs/ai-collab-protocols.md` to `frontend/public/docs/ai-collab-protocols.md`**; build outputs to `frontend/dist/docs/`; directly accessible
- Option 2: add exact-match `docs/*.md` rewrite to `firebase.json` (changes deploy config; high risk)

**Recommend Option 1**: new `frontend/public/docs/` directory sync. Engineer uses `cp docs/ai-collab-protocols.md frontend/public/docs/` or symlink. **This is Engineer task; explicitly listed in implementation list**.

### 4.4 Curated retrospective selection principles (2–3 items)

**Source:** `docs/retrospectives/architect.md` / `reviewer.md` / `qa.md` / `pm.md` (per-role log); not from per-ticket `## Retrospective` (per-ticket is internal record, not curated public).

**Selection criteria:**
1. **Must contain "root cause + improvement"**: empty "communicate better" not selected; verifiable behavior change required
2. **Cover different roles**: 3 picks cover ≥2 roles; avoid all Architect
3. **Recent ~30 days**: freshness; matches K-008 ~ K-017 retrospectives
4. **Avoid duplication of memory index existing entries**: if a reflection has been distilled into `MEMORY.md` rule, exclude (KB format principle)

**Suggested candidates (Engineer reference; final pick by user):**
- Architect 2026-04-18 K-008 W2/S3 — directory drift root cause + ticket-level backfill obligation
- Reviewer 2026-04-18 K-008 — why W2 review didn't catch (if logged)
- QA (pending K-017 completion; or K-008 QA reflection if suitable)

**Citation format:**

```markdown
### [Architect] 2026-04-18 — K-008 W2/S3 drift
> Source: [docs/retrospectives/architect.md](./retrospectives/architect.md)
>
> [Original 2-4 line excerpt]
>
> **Lesson codified:** [one-line summary]
```

---

## 5. File change list (Pass 2 — incl. primitive + hook)

### Add (26 files)

**Primitives (P1–P3, K-017 Pass 2 extracted; P4–P7 Pass 3 DELETED):**

| File | Purpose | See |
|------|---------|-----|
| `frontend/src/components/primitives/SectionContainer.tsx` | P1 — outer section wrapper (width/divider/paddingY) | §2.0.1 |
| `frontend/src/components/primitives/CardShell.tsx` | P2 — shared card container (padding/border) | §2.0.1 |
| `frontend/src/components/primitives/ExternalLink.tsx` | P3 — new-tab external link (hardcoded target=_blank + rel=noopener noreferrer) | §2.0.1 |
| ~~`frontend/src/components/primitives/MilestoneAccordion.tsx`~~ | **DELETED (Pass 3)** — P4 deprecated; each inlined | §2.0.1 |
| ~~`frontend/src/components/primitives/VerticalRail.tsx`~~ | **DELETED (Pass 3)** — P5 Pencil reconciliation; two pages don't share pattern | §2.0.1 |
| ~~`frontend/src/components/primitives/TimelineMarker.tsx`~~ | **DELETED (Pass 3)** — P6 same as P5; Diary has no marker | §2.0.1 |
| ~~`frontend/src/components/primitives/DiaryEntryRow.tsx`~~ | **DELETED (Pass 3)** — P7 deleted alongside P4 | §2.0.1 |

**Pass 3 new (replacing P4):**

| File | Purpose | See |
|------|---------|-----|
| `frontend/src/components/home/DiaryTimelineEntry.tsx` | Homepage hpDiary entry (layout:none absolute positioning; rail/marker inlined in DevDiarySection; replaces old DiaryPreviewEntry) | §2.3 |
| `frontend/src/components/about/BuiltByAIShowcaseSection.tsx` | S7 AboutPage mockup display card (static section; not real banner component) | §2.1 |

**Custom hook:**

| File | Purpose | See |
|------|---------|-----|
| `frontend/src/hooks/useDiary.ts` | `useDiary(limit?)` — encapsulates diary fetch + AsyncState; HomePage / DiaryPage shared | §2.0.2 |

**`/about` new section components:**

| File | Purpose |
|------|---------|
| `frontend/src/components/about/MetricsStripSection.tsx` | S2 container with 4 MetricCard; outer wraps P1 |
| `frontend/src/components/about/MetricCard.tsx` | Single metric (title + subtext); internal wraps P2 |
| `frontend/src/components/about/RoleCardsSection.tsx` | S3 container with 6 RoleCard; outer wraps P1 |
| `frontend/src/components/about/ReliabilityPillarsSection.tsx` | S4 container with 3 PillarCard; outer wraps P1 |
| `frontend/src/components/about/PillarCard.tsx` | Single pillar (title + body + italic quote + docs link via native `<a>`); internal wraps P2 |
| `frontend/src/components/about/TicketAnatomySection.tsx` | S5 container with 3 TicketAnatomyCard; outer wraps P1 |
| `frontend/src/components/about/TicketAnatomyCard.tsx` | Single ticket card; GitHub link uses P3; internal wraps P2 |
| `frontend/src/components/about/ProjectArchitectureSection.tsx` | S6 container with 3 ArchPillarBlock; outer wraps P1 |
| `frontend/src/components/about/ArchPillarBlock.tsx` | Single arch pillar (with optional testing pyramid list); internal wraps P2 |
| `frontend/src/components/about/FooterCtaSection.tsx` | S8 container; outer wraps P1; email via native `<a mailto:>`; GitHub / LinkedIn via P3 |
| `frontend/src/components/about/BuiltByAIShowcaseSection.tsx` | S7 container; static mockup display card (bannerMock indication + annoRow); **not real BuiltByAIBanner component** (Pass 3 clarification) |

**Homepage + script + docs + E2E:**

| File | Purpose |
|------|---------|
| `frontend/src/components/home/BuiltByAIBanner.tsx` | S7 HomePage thin banner → `/about` (does not wrap P1; full-width self-styled) |
| `frontend/src/components/home/DiaryTimelineEntry.tsx` | Homepage hpDiary entry (layout:none absolute positioning; replaces deprecated P4 MilestoneAccordion) (Pass 3 new) |
| `frontend/src/components/home/HomeFooterBar.tsx` | **Pass 4 new**: Pencil hpFooterBar pure-text contact info (`"yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn"`); Geist Mono 11px #6B5F4E; top border #1A1814; no link; for HomePage bottom (see §2.3.3) |
| `scripts/audit-ticket.sh` | Portfolio demo audit script |
| `docs/ai-collab-protocols.md` | Public protocol doc (English) |
| `frontend/public/docs/ai-collab-protocols.md` | Build-time copy (see AC-017-BUILD); **.gitignore not committed** |
| `frontend/e2e/about.spec.ts` | `/about` 8 sections Playwright assertions |
| `frontend/e2e/homepage-banner.spec.ts` | AC-017-BANNER assertion (or in existing pages.spec.ts; Engineer rules) |
| `backend/tests/test_audit_script.py` or bats test (**optional**) | audit-ticket.sh smoke test (AC-017-AUDIT 4 cases) |
| `docs/reports/K-017-visual-report.html` | QA stage output (not implementation deliverable) |

**~~FooterCtaLink.tsx~~ (Pass 2 deletion plan):** Pass 1-planned `FooterCtaLink.tsx` replaced by P3 `<ExternalLink>`; **not added**. Footer email uses native `<a href="mailto:">`; GitHub / LinkedIn directly use `<ExternalLink>`; no extra wrapper.

### Modify (11 files)

| File | Modification | Decision source |
|------|--------------|-----------------|
| `frontend/src/pages/AboutPage.tsx` | Replace JSX with new 8-section tree (with P1 wrap) | PRD |
| `frontend/src/pages/HomePage.tsx` | Insert `<BuiltByAIBanner />` between `<UnifiedNavBar />` and `<HeroSection />`; fetch diary uses `useDiary(3)`; **add `<HomeFooterBar />` at page bottom (Pencil hpFooterBar pure text; Pass 4 fix)** | PRD + Q2-A + Q8 (Pencil reconciliation) |
| `frontend/src/pages/DiaryPage.tsx` | Fetch diary uses `useDiary()`; retry button connects `refetch`; **add `<FooterCtaSection />` at page bottom (Q8 sitewide shared)** | Q2-A + Q8 |
| `frontend/src/components/about/PageHeaderSection.tsx` | Copy → S1 (One operator declaration); outer wraps P1 | PRD |
| `frontend/src/components/about/RoleCard.tsx` | Interface `{ role, responsibilities: string[], borderColorClass }` → `{ role, owns, artefact, borderColorClass? }`; `role` enum drops `'Senior Architect'`, adds `'Reviewer'` (composing 6 roles); internal wraps P2 | Q6-A + AC-017-ROLES |
| `frontend/src/components/common/CtaButton.tsx` | `external=true` branch `rel="noreferrer"` → `rel="noopener noreferrer"` | Q7-A |
| `frontend/src/components/diary/DiaryTimeline.tsx` | **Pass 3 fix: not migrating to P4** (P4 deleted); `<MilestoneSection>` keeps existing; Diary keeps existing flexbox two-column structure | Pass 3 |
| `frontend/src/components/home/DevDiarySection.tsx` | Internal `<DiaryPreviewEntry>` → new `<DiaryTimelineEntry>` (layout:none absolute positioning; replaces deprecated P4); props `{ milestones, loading, error }` (matching `useDiary`) | Pass 3 + Q2-A |
| `frontend/package.json` | `scripts.prebuild` adds `mkdir -p public/docs && cp ../docs/ai-collab-protocols.md public/docs/` (AC-017-BUILD) | AC-017-BUILD |
| `frontend/.gitignore` (or project root .gitignore) | Add `frontend/public/docs/` | AC-017-BUILD |
| `agent-context/architecture.md` | `updated:` → 2026-04-19; Directory Structure subtree update (about/ 13 files deleted + 10 added / 2 modified + home/ adds BuiltByAIBanner + DiaryTimelineEntry + new primitives/ subdirectory 3 files (P1-P3) + hooks/ adds useDiary.ts; **diary/ MilestoneSection.tsx / DiaryEntry.tsx kept (Pass 3)**); Frontend Routing table `/about` description update; new `## Scripts & Public Protocols Doc` section; new `## Primitives & Shared Hooks` section (K-017 Pass 2 extracted); `## Changelog` adds 2026-04-19 Pass 2+3 entry | this doc Step 7 |

### Delete (14 files)

**Under `frontend/src/components/about/` (12 files, Pass 1 existing):**
`AiCollabSection.tsx` / `HumanAiSection.tsx` / `ContributionColumn.tsx` / `TechDecSection.tsx` / `TechDecCard.tsx` / `TechStackSection.tsx` / `TechStackRow.tsx` / `ScreenshotsSection.tsx` / `ScreenshotPlaceholder.tsx` / `FeaturesSection.tsx` / `FeatureBlock.tsx` / `PhaseGateBanner.tsx`

**Under `frontend/src/components/diary/` (Pass 3 fix: not deleted):**
`MilestoneSection.tsx` and `DiaryEntry.tsx` **kept** (Pass 2 originally planned P4/P7 replacement; P4/P7 deprecated; Diary keeps existing components)

**Under `frontend/src/components/home/` (1 file):**
`DiaryPreviewEntry.tsx` (replaced by Pass 3 new `DiaryTimelineEntry.tsx`)

(13 deletions total; 2 fewer than Pass 2 because MilestoneSection / DiaryEntry kept)

**Additionally:** existing `frontend/e2e/pages.spec.ts` assertions on old AboutPage text ("What Is This Project?" / "AI COLLABORATION" / "HUMAN-AI SYNERGY" / "CONTRIBUTIONS" / "TECH DECISIONS" / "SCREENSHOTS" / "TECH STACK" / "FEATURES") must be **removed or rewritten**. See §7.4 E2E risk section.

---

## 6. Implementation order

**Phase A — parallelisable (no inter-dependencies):**
- **A0. Pre-implementation grep scan (Pass 2 new — mandatory)** — see §7.11 Engineer first step; output E2E modification list for PM review before sign-off
- ~~**A0.1. Pencil .pen reconciliation (Pass 2 — Q8)**~~ — **REMOVED (Pass 3)**: Pencil reconciliation done by Architect Pass 3; P5/P6 formally deleted; no Engineer reconciliation needed; step cancelled
- A1. `scripts/audit-ticket.sh` development + smoke test (bash, standalone)
- A2. `docs/ai-collab-protocols.md` write (pure doc)
- A3. `primitives/` 3 files scaffold (`SectionContainer` / `CardShell` / `ExternalLink`; **Pass 3: P4/P5/P6/P7 deleted; not scaffolded**)
- A3b. `home/DiaryTimelineEntry.tsx` scaffold (Pass 3 new; replaces deprecated P4)
- A4. `hooks/useDiary.ts` extract (matches §2.0.2 signature + migration plan)
- A5. `/about` new section component files (11 new files including Pass 3 new `BuiltByAIShowcaseSection.tsx`; wrap P1 / P2 / P3 per §2.1 tree)

**Phase B — depends on A3:**
- B1. `AboutPage.tsx` reorganise import + JSX
- B2. `PageHeaderSection.tsx` / `RoleCard.tsx` rewrite (interface first, then for new RoleCardsSection)
- B3. Old component delete (safe after B1/B2)

**Phase C — depends on B:**
- C1. `HomePage.tsx` insert `BuiltByAIBanner` + migrate to `useDiary(3)` + **new and add `<HomeFooterBar />`** (Pencil hpFooterBar pure-text spec; see §2.3.3; Pass 4 fix: not sitewide shared FooterCtaSection; Homepage-exclusive pure-text bottom bar)
  - First create `frontend/src/components/home/HomeFooterBar.tsx` (pure-text display, Geist Mono 11px #6B5F4E, no `<a>` link)
  - Then in `HomePage.tsx` bottom import + render `<HomeFooterBar />`
- C2. `DiaryPage.tsx` migrate to `useDiary()` + add `refetch` (**note: DiaryPage does not add HomeFooterBar; Q8 ruling fixed by Pencil reconciliation; hpFooterBar is Homepage-exclusive design**)
- C3. `frontend/public/docs/ai-collab-protocols.md` sync — **use `prebuild` hook auto copy** (AC-017-BUILD); not manual cp
- C4. Delete `DiaryPreviewEntry.tsx` (replaced by `DiaryTimelineEntry.tsx`)
  - **Note: `MilestoneSection.tsx` and `DiaryEntry.tsx` not deleted** — P4/P7 deprecated in Pass 3; Diary keeps existing components; both files retained (see §2.0.1 P4 deprecation note + §5 deletion list)
- C5. `HeroSection.tsx` rewrite to v2 design spec (§2.3.1):
  - Heading two lines two colours (#1A1814 / #9C4A3B)
  - Subtitle Newsreader 18px italic
  - Divider `<div className="h-px bg-[#2A2520]">`
  - `"Try the App →"` CTA button (#2A2520 bg, rounded, Geist Mono)
  - **Verify:** `npx tsc --noEmit` pass; Playwright AC-HOME-1 Hero heading assertion matches new copy
- C6. `ProjectLogicSection.tsx` rewrite to v2 design spec (§2.3.2):
  - `logicStamp` rotation:-3° (`className="rotate-[-3deg]"`) + #9C4A3B bg
  - Three-column step cards `grid grid-cols-3` (or flex); each header(#2A2520) + body(Bodoni Moda title + 40px divider + Newsreader description)
  - `techRow`: Geist Mono 11px, `"STACK — React · TypeScript · Vite · FastAPI · Python · Playwright"`
  - **Verify:** same as above; Playwright AC-HOME-1 ProjectLogic assertion matches new copy

**Phase D — depends on A + B + C:**
- D1. Playwright `about.spec.ts` write assertions + run
- D2. Playwright banner assertion (new or in pages.spec.ts)
- D3. Per §7.11 R1 / R2 / R3 / R4 / R6 rewrite E2E assertions (`pages.spec.ts` AC-ABOUT-1 fully rewritten / AC-HOME-1 check index-based selector / AC-DIARY-1 check P4 DOM compatibility)
- D4. `npx tsc --noEmit` pass
- D5. `/playwright` full run

**Phase E — final:**
- E1. Architecture doc update (Architect task; done in this doc Step mandatory step a)
- E2. Visual report output (QA)

**Parallel critical path:** A0 → A1 / A2 / A3 / A3b / A4 / A5 initial versions in parallel can compress Engineer time; ~~A0.1~~ (Pass 3 cancelled; Pencil reconciliation done by Architect).

---

## 7. Risks and notes

### 7.1 Naming / spelling mismatch (high)
AC-017-HEADER on "PM / architect / engineer / reviewer / QA / designer" is character-case-sensitive (Playwright `{ exact: true }`). AC-017-ROLES requires role names "PM / Architect / Engineer / Reviewer / QA / Designer" (S3 Title Case). **Engineer must strictly distinguish S1 copy (lowercase role names) vs S3 card title (Title Case)**; do not unify during refactor.

### 7.2 Playwright assertion fragility (high)
- AC-017-METRICS "Playwright asserts each of 4 metric titles and corresponding subtext, no index positioning" → each MetricCard adds `data-metric-title="Features Shipped"` or use `getByRole('heading', { name: 'Features Shipped', exact: true })` + sibling selector for subtext
- AC-017-ROLES "6 × 3 = 18 assertions" → recommend each card wrap in `<article data-role="PM">`; `page.locator('[data-role="PM"]').getByText(owns_text)` stable
- AC-017-PILLARS "anchor blockquote" → italic blockquote use real `<blockquote><em>...` or markdown syntax `> *...*` rendering? React component does not auto-render markdown; must hand-write JSX `<blockquote><em>...</em></blockquote>`

### 7.3 External link safety
AC-017-FOOTER specifies `rel="noopener noreferrer"` + `target="_blank"`. Existing `CtaButton` only has `rel="noreferrer"` (missing `noopener`) — **FooterCtaLink cannot reuse CtaButton; must write full rel itself**. Same for ticket anatomy card GitHub link.

### 7.4 SEO / accessibility
- `<h1>` only one on `/about` (current PageHeaderSection uses h1; new design S1 keeps h1). S2/S3/S4/S5/S6/S8 section titles use `<h2>`. `SectionHeader` component defaults to `<h2>`; reuse directly.
- `aria-label` for BuiltByAIBanner (entire Link) for screen reader friendliness: `aria-label="About the AI collaboration behind this project"`.
- Copy fully English → `<html lang="en">` already set (main.tsx `index.html` default); no change needed.

### 7.5 i18n
Project has no i18n framework. PRD S1 / S7 / S8 fully English; S1 PM confirmed recruiter-oriented. If future zh-TW version, S1 hero copy needs special handling (rewrite, not literal translate). **K-017 scope: English only**.

### 7.6 Bash portability (macOS vs Linux)
If `audit-ticket.sh` runs on Linux CI:
- `grep -E` consistent across platforms
- `sed -i` on macOS needs `sed -i ''`; **this script does no in-place edit; pure read-only**; non-issue
- `[[ "$a" < "$b" ]]` works on bash 3.2+ (macOS default) and bash 4+
- `date` command unused (only string-compare created); avoids macOS BSD vs GNU date difference
- Shebang `#!/usr/bin/env bash` (not `#!/bin/bash`; macOS `/bin/bash` is 3.2)

### 7.7 Curation choice (medium)
Picking 2–3 retrospective excerpts is **not Architect decision** — involves public-presentation judgement; PM / user confirms. Architect only specifies §4.4 selection criteria + citation format; Engineer lists candidates for user pick during implementation.

### 7.8 Firebase Hosting `.md` access
(See §4.3 Option 1) Engineer must copy `docs/ai-collab-protocols.md` to `frontend/public/docs/`; otherwise `/docs/ai-collab-protocols.md` in production gets eaten by SPA fallback redirecting to HomePage. **Playwright E2E should add assertion: navigate to `/docs/ai-collab-protocols.md` returns markdown text (or raw content), not HomePage.**

### 7.9 Drift prevention
Architect doc sync rule requires every ticket to write back architecture.md. If Engineer adds non-planned components during this ticket (e.g. decorative divider), PM verification must check §5 file change list against actual git diff; any deviation recalls Architect for sync.

### 7.10 K-017 PRD 17 tickets count
AC-017-METRICS "Features Shipped subtext is '17 tickets, K-001 → K-017'" is hardcoded snapshot. If K-018 / K-019 added during implementation, number outdated. **PM has locked K-017 as portfolio snapshot point**; Engineer no dynamic compute; future refresh = new ticket.

### 7.11 E2E assertion risk list (Pass 2 new, Q10)

This ticket fully rewrites `/about` + inserts homepage banner + heavy diary component replacement; broad E2E impact. Engineer mitigates per table; no skip.

| # | Risk | Affected files | Mitigation |
|---|------|----------------|------------|
| R1 | Old `/about` 7 section label assertions invalid — `pages.spec.ts` L32–38 `AC-ABOUT-1` asserts "PROJECT OVERVIEW" / "AI COLLABORATION" / "CONTRIBUTIONS" / "TECH DECISIONS" / "SCREENSHOTS" / "TECH STACK" / "FEATURES". After old sections deleted, these 7 `getByText(...{ exact: true })` all fail | `frontend/e2e/pages.spec.ts` (existing); will add `about.spec.ts` (new) | Engineer rewrites `pages.spec.ts` `AC-ABOUT-1` block; new assertions match PRD K-017 AC-017-HEADER / METRICS / ROLES / PILLARS / TICKETS / ARCH / FOOTER. Old section label assertions all deleted; new labels per PRD S1–S8 section names |
| R2 | `getByText` default case-insensitive trap (memory `feedback_playwright_getbytext_case`) — section labels are short strings (e.g. "ROLE CARDS"); without `{ exact: true }` may falsely match longer description text | All new `.spec.ts` files (`about.spec.ts` / `homepage-banner.spec.ts`) | All section label assertions add `{ exact: true }`. AC-017-HEADER / AC-017-BANNER explicitly required `{ exact: true }` in PRD AC; other section assertions Engineer applies proactively |
| R3 | Homepage DOM order shift — this ticket inserts `<BuiltByAIBanner />` between `<UnifiedNavBar />` and `<HeroSection />` in `HomePage.tsx`, making Hero the 2nd main section instead of 1st. Existing homepage spec using index-based selector (e.g. `.locator('section').nth(0)` / `page.getByRole('button').first()`) may be eaten by banner | `frontend/e2e/pages.spec.ts` (AC-HOME-1) + other homepage-related spec | Engineer pre-implementation: `grep -rnE "\.nth\(|\.first\(\)|\.last\(\)" frontend/e2e/` — evaluate any homepage-context index-based selector for banner-insertion correctness. Recommend `getByRole('heading', { name })` or `getByText` (semantic selector). **Current diary tests use `.nth(1)` for DiaryPage internal button index; not affected by Homepage banner; no change** |
| R4 | Footer 3 external link `rel` / `target` assertion — AC-017-FOOTER specifies "three links open in new tab (`target="_blank"` + `rel="noopener noreferrer"`)"; assertion needed | `frontend/e2e/about.spec.ts` (new) | Engineer adds: `await expect(link).toHaveAttribute('target', '_blank')` + `await expect(link).toHaveAttribute('rel', 'noopener noreferrer')`. Mailto link separately: `await expect(mailtoLink).toHaveAttribute('href', 'mailto:yichen.lee.20@gmail.com')`. Since P3 `<ExternalLink>` hardcodes `target=_blank + rel=noopener noreferrer`, using P3 auto-passes — assertion still required as regression guard |
| R5 (extension) | New 7 components label / anchor id alignment with PRD original — AC-017-ROLES requires 6 cards "PM / Architect / Engineer / Reviewer / QA / Designer", but AC-017-HEADER requires lowercase comma-separated "PM, architect, engineer, reviewer, QA, designer". If Engineer unifies case during refactor, AC breaks | All /about new components + `about.spec.ts` | Engineer strictly distinguishes S1 copy (lowercase) vs S3 card title (Title Case); assertions cite PRD original verbatim (no variable interpolation; hardcode strings) avoiding refactor unification |
| R6 (extension) | ~~P4 `<MilestoneAccordion>` replaces old `MilestoneSection` / `DiaryPreviewEntry`~~ **— CLOSED (Pass 3)**: P4 deprecated; `MilestoneSection.tsx` / `DiaryEntry.tsx` kept; Diary DOM structure unchanged; `AC-DIARY-1` assertions (`aria-expanded` / `.px-4.pb-4 p` selector) unaffected. `DiaryPreviewEntry.tsx` (Home page) → `DiaryTimelineEntry.tsx` (layout:none absolute positioning); affects AC-HOME-1 DevDiarySection, not AC-DIARY-1 | `frontend/e2e/pages.spec.ts` (AC-DIARY-1) | **No mitigation needed**: Diary page components preserved; `AC-DIARY-1` no change |
| R7 (Pass 4 new; **updated K-057 2026-04-28**) | **hpHero v2 heading copy assertion** — copy updated by K-057. Current live copy: heading 1 `"K-line similarity"`, heading 2 `"lookup engine."`, CTA `"Run the ETH/USDT Demo →"`; corresponding assertions synced into `pages.spec.ts` by K-057 | `frontend/e2e/pages.spec.ts` (AC-HOME-1 Hero block) | Assertion live: `await expect(page.getByText('K-line similarity', { exact: true })).toBeVisible()` + `await expect(page.getByText('lookup engine.', { exact: true })).toBeVisible()`; CTA: `await expect(page.getByRole('link', { name: /Run the ETH\/USDT Demo/i })).toBeVisible()` |
| R8 (Pass 4 new) | **hpLogic v2 copy assertion** — step card titles (STEP 01/02/03), body titles (Upload/Scan/Project), techRow copy all new or rewritten; old assertions if exist will fail | `frontend/e2e/pages.spec.ts` (AC-HOME-1 Logic block) | `grep -rn "HOW IT WORKS\|STEP 0\|logic\|Logic\|stack\|Stack" frontend/e2e/` confirm existing assertion scope. New assertions: `await expect(page.getByText('HOW IT WORKS', { exact: true })).toBeVisible()`; three step-card headers `getByText('STEP 01 · INGEST', { exact: true })`; body title `getByText('Upload', { exact: true })` (note exact:true to prevent body description false match); techRow `getByText('React · TypeScript · Vite · FastAPI · Python · Playwright', { exact: true })` |

**Engineer Phase A first step (added before §6 Phase A):**

```
A0 — Pre-implementation grep scan (mandatory):
  (1) grep -rnE "\.nth\(|\.first\(\)|\.last\(\)" frontend/e2e/ → evaluate R3 impact
  (2) grep -rn "What Is This Project\|AI COLLABORATION\|CONTRIBUTIONS\|TECH DECISIONS\|SCREENSHOTS\|TECH STACK\|FEATURES" frontend/e2e/ → list R1 old assertions to rewrite
  (3) grep -rn "MilestoneSection\|DiaryPreviewEntry\|DiaryEntry" frontend/src/ → confirm Q1-A migration no missing caller
  (4) grep -rn "aria-expanded\|px-4.pb-4" frontend/e2e/ → evaluate R6 impact
  Output: a diff-level E2E modification list for PM review before sign-off
```

---

## 8. Release recommendation

This doc (Pass 3) covers all Architect-layer requirements; **no blocking question**. PM may release Engineer for Phase A (A0 → A1 / A2 / A3 / A3b / A4 / A5 parallel).

**Pass 2 supplementary confirmation (non-blocking):**
1. §4.4 curated retrospective candidate list final pick by user (Engineer lists candidates again at Phase C) — **PM ruled and locked 3 entries on 2026-04-19** (Engineer K-008 W4 / Engineer K-002 / Architect K-008 W2/S3); item closed
2. §7.8 Firebase Hosting `.md` access option (prebuild hook copy, AC-017-BUILD) locked to Option 1 in ticket design decision log

**Pass 3 confirmation (resolved):**
3. §2.0.1 P5 / P6 (VerticalRail / TimelineMarker) Pencil reconciliation result: **two pages don't share pattern; P5/P6/P4/P7 all deleted**. A0.1 reconciliation step done by Architect; no Engineer reconciliation. Risk closed

**Pass 4 (2026-04-19, Homepage v2 Dossier hpHero / hpLogic design spec supplement):**
4. §2.3 changed from "hpHero / hpLogic existing, unchanged" to full v2 design spec (§2.3.1 + §2.3.2) including copy, visual structure, component boundary, React implementation notes
5. §6 Phase C adds C5 / C6 steps; Engineer must rewrite `HeroSection.tsx` and `ProjectLogicSection.tsx` to match v2
6. §7.11 adds R7 / R8; hpHero / hpLogic E2E assertion strategy defined; Engineer greps old assertions then rewrites
7. **Engineer note:** `HeroSection.tsx` and `ProjectLogicSection.tsx` are K-017 in-scope v2 rewrites; execute in Phase C (after Phase B); cannot skip

---

## Retrospective

### 2026-04-19 — K-017 /about portfolio enhancement design

**Done well:**
- Pre-design fully read PRD all 10 ACs + existing 14 about/ components + existing AboutPage / HomePage / main.tsx routes / architecture.md Directory Structure subtree; confirmed drift status (about/ old 13 files to delete; RoleCard interface to change; SPA fallback on `.md` access is trap)
- Explicitly deferred "pick 2–3 retrospective excerpts" to PM / user; did not overstep on portfolio external presentation content selection (per senior-architect.md "no requirement decision" principle)
- Section granularity aligned with existing about/ subdirectory convention; when deleting old 12 components, listed PRD AC section replacements to prevent Engineer from accidentally deleting still-referenced files

**Done poorly:**
- Firebase Hosting `.md` access trap (§7.8) almost missed in first round — only recalled SPA fallback eats `.md` when verifying §4 anchor plan inline link target; added to §7 risk. Root cause: AC-017-PROTOCOLS only said "doc exists", did not say "recruiter-clickable pillar link works"; design habit covers AC literal conditions; "recruiter actual usage path" mental simulation didn't enter early enough
- Did not pre-check whether `frontend/e2e/pages.spec.ts` already asserts old AboutPage text ("What Is This Project?" / "AI COLLABORATION") — if yes, B3 old component delete breaks E2E. §5 lists "Engineer must grep scan", but if I scanned first and gave list, more concrete

**Improvements:**
- At design stage before §7, run "end-to-end recruiter mental walkthrough" — from homepage click banner → /about → click pillar link → click GitHub link → email — each hop check production-reachable (SPA, CORS, external link, Firebase rewrite). Walkthrough into this log as next-time self-check checklist
- For tickets with heavy existing-page restructure (this ticket deletes 12 / modifies 4 / adds 19), before §5 file change list, proactively grep existing E2E spec for old-copy dependencies; list as Engineer mandatory pre-action rather than just "noted risk"

### 2026-04-19 — K-017 Pass 3: design update after Pencil reconciliation

**Done well:** (no concrete event — Pass 3 fixes Pass 2 blind-extract error, not proactive design highlight)

**Done poorly:** Pass 2 blind-extracted P5/P6 should have estimated Diary page actual DOM pattern more carefully; designer using different patterns on two pages could have been asked early; blind-extract reason "commit message strongly hints three-place sharing" too thin; actual two pages even rail implementation differs (rectangle vs stroke); not "shared primitive different style" but "fundamentally different design intent"

**Improvements:** before "conditional primitive" decision, request Designer provide DOM sketches for all relevant pages; do not wait for Pencil MCP connection; "commit message hints sharing" cannot be sole basis for primitive extraction; must have at least structural similarity (same layout pattern) before considering extraction

---

## K-057 New Components (K-060 backfill, 2026-04-28)

Components shipped in K-057 but missing from prior Pencil spec; backfilled by K-060.

| Component | Pages | Location | Background | Text | Pencil Node IDs |
|---|---|---|---|---|---|
| DisclaimerBanner | `/`, `/about`, `/diary` | top of page, index 0, above NavBar | `#2A2520` | `#F4EFE5` 12px Geist Mono center | Home: `yYnSS`, About: `qnQHQ`, Diary: `ZqmEW` |
| DisclaimerSection | `/`, `/about`, `/diary` | below footer (last element in frame) | `#F4EFE5` | `#2A2520` IBM Plex Mono heading 14px 700; Geist Mono body 13px lh-1.6 | Home: `qz7Po`, About: `QwyrN`, Diary: `Us4NB` |

### DisclaimerBanner spec

- Height: 36px, width: fill_container
- Copy: `"Lookup tool for K-line shape similarity — for learning and exploration. Outputs are not predictions and not financial advice."`
- Font: Geist Mono 12px normal, center-aligned

### DisclaimerSection spec

- Padding: 48px top/bottom, 96px left/right; gap: 12px; layout: vertical
- Heading: `"Disclaimer"`, IBM Plex Mono 14px 700, color `#2A2520`
- Body: Geist Mono 13px normal lh-1.6, color `#2A2520`, width fill_container
- Body copy: `"This tool is for educational exploration of K-line pattern similarity only. It does not constitute financial advice, investment recommendations, or predictions of future market movements. Past pattern similarity does not guarantee future performance. Always conduct your own research and consult a qualified financial advisor before making any investment decisions."`
