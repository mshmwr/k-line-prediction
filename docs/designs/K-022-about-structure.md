---
title: K-022 /about page structural detail alignment to design v2
type: design
ticket: K-022
owner: senior-architect
created: 2026-04-21
pencil-frame: 35VCj (About /about K-017 v2)
depends-on: K-021
---

## 0. Design preconditions

- K-021 delivered: `bg-paper` / `text-ink` / `text-muted` / `font-display` / `font-italic` / `font-mono` Tailwind tokens available
- `AboutPage.tsx` outer `<div>` already removed dark wrapper (K-021 Stage 2)
- This doc treats **Pencil frame `35VCj`** (`homepage-v2.pen`) as the visual source of truth
- Today's date: 2026-04-21

---

## 1. Component Tree Diff (A-1 ~ A-12, C-4)

The table lists each of the 12 structural alignment items: change type, affected components, and proposed paths.

| # | Item | Change type | Affected existing component (file path) | New component name (proposed path) |
|---|------|----------|--------------------------|----------------------|
| A-1 | Section label + hairline | **Modify existing** | `SectionContainer.tsx` (`primitives/`); insert label row at top of each section | — |
| A-2 | Dossier header bar + FILE Nº | **Add component** | `AboutPage.tsx` (insert below `<UnifiedNavBar />`) | `DossierHeader.tsx` (`components/about/`) |
| A-3 | Hero split into two lines | **Modify existing** | `PageHeaderSection.tsx` (`components/about/`) | — |
| A-4 | Subtitle structure (italic subtitle) | **Modify existing** | `MetricsStripSection.tsx` / `RoleCardsSection.tsx` / `ReliabilityPillarsSection.tsx` / `TicketAnatomySection.tsx` / `ProjectArchitectureSection.tsx`, each adds a subtitle line | — |
| A-5 | Redaction bar | **Add component** | `MetricCard.tsx` (`components/about/`) + `RoleCard.tsx` (`components/about/`) | `RedactionBar.tsx` (`components/about/`) |
| A-6 | OWNS / ARTEFACT label font | **Modify existing** | `RoleCard.tsx` (`components/about/`) | — |
| A-7 | Link style (Newsreader italic + underline) | **Modify existing** | `PillarCard.tsx` (`components/about/`) / `TicketAnatomyCard.tsx` (`components/about/`) / `FooterCtaSection.tsx` (`components/about/`) — each `<a>` class migrated | — |
| A-8 | CASE FILE header (TicketAnatomy) | **Modify existing** | `TicketAnatomySection.tsx` (`components/about/`) — section label text changed to `CASE FILE` | — |
| A-9 | LAYER 1/2/3 prefix label | **Modify existing** | `ReliabilityPillarsSection.tsx` (`components/about/`) + `PillarCard.tsx` (`components/about/`) — each pillar Top bar label changed to `LAYER 1/2/3` | — |
| A-10 | Footer regression | **Pure regression assertion** (no component change) | `FooterCtaSection.tsx` (`components/about/`) — K-017 AC-017-FOOTER regression validation | — |
| A-11 | BEHAVIOUR / POSITION annotation | **Modify existing** | `RoleCard.tsx` (`components/about/`) — add marginalia `<span>` | — |
| C-4 | Role Card grid height | **Modify existing** | `RoleCardsSection.tsx` (`components/about/`) + `RoleCard.tsx` (`components/about/`) — grid gap + card `min-h` settings | — |
| A-12 | Shared primitives paper palette migration | **Modify existing** | `CardShell.tsx` (`primitives/`) / `SectionContainer.tsx` (`primitives/`) / `SectionHeader.tsx` (`common/`) / `SectionLabel.tsx` (`common/`) / `CtaButton.tsx` (`common/`) | — |

**Notes:**
- A-1's section label exists in design as a standalone `s_N_Head` frame with `Geist Mono 13px 700` label text + 1px hairline (`fill: #8B7A6B`). Recommended approach: add a `SectionLabel` row at the top of each `SectionContainer` wrapper or each SectionN component, rather than modifying the `SectionContainer` primitive (avoids affecting other consumers).
- A-2 `DossierHeader` is the only newly-added standalone component in this ticket (see §1.1).
- A-12 modifies 5 shared primitives, corresponding to the full dark-pattern mapping table in §4.

### 1.1 New component spec: DossierHeader.tsx

```tsx
// components/about/DossierHeader.tsx
interface DossierHeaderProps {
  fileNo?: string  // default: "K-017 / ABOUT"
}

export default function DossierHeader({ fileNo = 'K-017 / ABOUT' }: DossierHeaderProps) {
  return (
    <div
      data-testid="dossier-header"
      className="bg-charcoal text-paper font-mono text-xs tracking-[2px] px-[72px] py-[6px] flex items-center gap-2"
    >
      <span>FILE Nº</span>
      <span className="opacity-50 mx-1">·</span>
      <span>{fileNo}</span>
    </div>
  )
}
```

**Pencil source:** frame `35VCj` child nodes have no standalone Dossier Header Bar (the design's `/about` page top is `abNav`); but each Card's `xTop` frame (e.g. `r1Top`, `m1Top`, `p1Top`) uses `fill: #2A2520` (`bg-charcoal`) + white text label (e.g. `FILE Nº 01 · PERSONNEL`), padding `[6, 10]`. AC-022-DOSSIER-HEADER describes "the topmost dark bar (below NavBar)"; Architect interprets this as the **per-Card header-bar language** lifted to the page level, not a separate page-level header bar in `35VCj`. Engineer should report to PM if uncertain.

### 1.2 Shared component boundary (this ticket)

| Component | Path | Consumer (/about) | Change in this ticket | K-026 AppPage impact |
|------|------|-------------------|----------|-------------------|
| `CardShell` | `primitives/CardShell.tsx` | `MetricCard` / `RoleCard` / `PillarCard` / `TicketAnatomyCard` | dark class removed (A-12) | **Affects AppPage** (see §4 note) |
| `SectionContainer` | `primitives/SectionContainer.tsx` | `AboutPage` (8 × SectionContainer) | `border-white/10` → `border-ink/20` (A-12) | **Affects other pages** (K-026 regression) |
| `SectionHeader` | `common/SectionHeader.tsx` | /about currently **not used** (sections have own h2) | `text-white` + `text-gray-400` migrated (A-12) | **Not directly used by /about; change is preventative** |
| `SectionLabel` | `common/SectionLabel.tsx` | /about currently **not used** (A-1 builds a custom label row) | color token migration (A-12) | Affects other pages using SectionLabel |
| `CtaButton` | `common/CtaButton.tsx` | /about currently **not used** | full color migration (A-12) | Affects other pages using CtaButton |

---

## 2. Pencil v2 precise spec

The values below are taken directly from `35VCj` batch_get results, with source node IDs noted.

### 2.1 A-2 Dossier header bar (per-Card header bar language)

- **Height (padding):** padding `[6, 10]` (6px top/bottom, 10px left/right)
- **Background:** `#2A2520` (`bg-charcoal`)
- **Text color:** `#F4EFE5` (`text-paper` = white-family)
- **Font:** Geist Mono 10px, letterSpacing 2, fontWeight normal
- **Format:** `FILE Nº 01 · PERSONNEL` (Pencil node `w6UOK`)
- **Page-level Header (AC-022-DOSSIER-HEADER)** recommended `FILE Nº · K-017 / ABOUT`, `bg-charcoal` full-width

### 2.2 A-5 Redaction bar height

- **Pencil node:** `m1Redact` (`AxyBl`): `height: 10, width: 100`
- **Spec:** `height: 10px`, `width` variable (100px is m1's value, m2 is 140px)
- **Color:** `fill: #2A2520` (`bg-charcoal`) — same as card header in design, not pure black `#000000`
- **DOM semantic:** text remains in DOM, visually covered (`aria-hidden` or `data-redaction` attribute)

### 2.3 A-6 OWNS / ARTEFACT label font size

- **Pencil node:** `r1OwnsL` (`SdhGZ`): `fontSize: 10, letterSpacing: 2, fill: #6B5F4E, fontFamily: Geist Mono`
- **Spec:** **10px**, Geist Mono, letterSpacing 2, `text-muted` (`#6B5F4E`)
- **Conclusion:** AC asks "10px or 11px"; Pencil measures **10px**

### 2.4 C-4 Role Card grid gap and min-height

- **Pencil nodes:** `s3Row1` / `s3Row2`: `gap: 14` (i.e. `gap-[14px]` or `gap-3.5`)
- **Card height:** `height: 320` (Pencil nodes `szZ7h` / `p3NWv` / `HGPky` / `3O32j` / `msFox` / `vtpKx` all `height: 320`)
- **Grid layout:** design splits into two rows (`s3Row1` has PM/Architect/Engineer, `s3Row2` has Reviewer/QA/Designer), 3 columns each
- **Spec:** `min-h-[320px]` (or `h-[320px]`), grid gap `gap-[14px]` (`gap-3.5`)

### 2.5 A-9 LAYER label font size

- **Pencil node:** `p1Lbl` (`Y3VDv`): `content: "FILE Nº 01 · PROTOCOL", fontSize: 10, letterSpacing: 2, fill: #F4EFE5, fontFamily: Geist Mono`
- **Spec:** **10px**, Geist Mono, `text-paper` (white text on card header)

### 2.6 Section label common spec (A-1)

- **Pencil node:** `s2label` (`kvHMP`): `content: "Nº 01 — DELIVERY METRICS", fontSize: 13, fontWeight: 700, letterSpacing: 2, fill: #1A1814, fontFamily: Geist Mono`
- **Hairline:** `height: 1, fill: #8B7A6B` (`text-muted`, lighter than `text-ink`)
- **Spec:** Geist Mono 13px bold, `text-ink`, letterSpacing 2; hairline `h-px bg-[#8B7A6B]`

### 2.7 Hero font spec (A-3)

Values pulled directly from Pencil node `wwa0m` children:

| Node | Text | fontFamily | fontSize | fontStyle | fontWeight | fill |
|------|------|-----------|---------|-----------|-----------|------|
| `nolk3` | "One operator, orchestrating AI" | Bodoni Moda | 64 | italic | 700 | `#1A1814` |
| `02p72` | "agents end-to-end —" | Bodoni Moda | 64 | italic | 700 | `#B43A2C` (brick accent) |
| `gNx84` | "PM, architect... designer." | Newsreader | 18 | italic | normal | `#1A1814` |
| `TQmUG` | "Every feature ships with a doc trail." | Bodoni Moda | 22 | italic | 700 | `#1A1814` |
| `qFnDN` | (divider) | — | — | — | — | `#2A2520`, height 1 |

**Implementation note:** Main sentence's second line "agents end-to-end —" uses `text-brick` (`#B43A2C`), **confirmed** (BQ-022-03 PM 2026-04-21 ruling). Reason: Pencil node `02p72` is explicitly set; the accent color emphasizes "orchestrating AI agents" as the page's core thesis, echoes the `text-brick` color of Role card role names, and provides page-wide language consistency; for recruiters scanning the page, the immediate pickup is meaningful. Engineer implements directly per design, no further confirmation needed.

### 2.8 Role Card title font (A-3 extension)

- **Pencil node:** `r1Role` (`yHMgd`): `content: "PM", fontFamily: Bodoni Moda, fontSize: 36, fontStyle: italic, fontWeight: 700, fill: #B43A2C`
- **Spec:** Role name is rendered with Bodoni Moda 36px italic 700 `text-brick` (current `font-mono font-bold text-ink text-base` must be fully replaced)

### 2.9 Subtitle (italic) spec (A-4)

- **Pencil node:** `s3Intro` (`JcFQi`): Newsreader 15px italic normal, `fill: #1A1814`
- **Spec:** `font-italic text-[15px] italic text-ink leading-relaxed`
- **Each of 5 sections has one subtitle** (copy is set by Engineer per K-017 spirit; Architect doesn't fix the wording)

---

## 3. Playwright assertion strategy

### 3.1 AC-022-SECTION-LABEL

```ts
// 6 sections' label text (in design Nº 00 — XXX format)
const sectionLabels = [
  'Nº 01 — DELIVERY METRICS',
  'Nº 02 — THE ROLES',
  'Nº 03 — RELIABILITY',
  'Nº 04 — ANATOMY OF A TICKET',  // or CASE FILE (see A-8)
  'Nº 05 — PROJECT ARCHITECTURE',
]

for (const label of sectionLabels) {
  await expect(page.getByText(label, { exact: true })).toBeVisible()
}

// fontFamily verification (any label)
const labelEl = page.getByText('Nº 01 — DELIVERY METRICS', { exact: true })
const ff = await labelEl.evaluate(el => getComputedStyle(el).fontFamily)
expect(ff).toContain('Geist Mono')

// hairline exists (hr or div h-px below section label)
const hairline = page.locator('[data-section-hairline]').first()
await expect(hairline).toBeVisible()
```

**Notes:**
- `{ exact: true }` mandatory (memory `feedback_playwright_getbytext_case.md`)
- Hairline: recommend Engineer add `data-section-hairline` attribute for testing

#### Mobile viewport addendum (375px / 390px / 414px)

```ts
for (const width of [375, 390, 414]) {
  test(`AC-022-SECTION-LABEL — ${width}px — label not truncated`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 812 } })
    const page = await ctx.newPage()
    await page.goto('/about')
    const label = page.getByText('Nº 01 — DELIVERY METRICS', { exact: true })
    await expect(label).toBeVisible()
    // confirm not truncated (overflow)
    const overflow = await label.evaluate(el => getComputedStyle(el).overflow)
    expect(overflow).not.toBe('hidden')
    await ctx.close()
  })
}
```

---

### 3.2 AC-022-DOSSIER-HEADER

```ts
const header = page.locator('[data-testid="dossier-header"]')
await expect(header).toBeVisible()
await expect(header).toContainText('FILE Nº')
// background bg-charcoal
const bg = await header.evaluate(el => getComputedStyle(el).backgroundColor)
expect(bg).toBe('rgb(42, 37, 32)')  // #2A2520
```

---

### 3.3 AC-022-HERO-TWO-LINE

```ts
// main sentence font (Bodoni Moda)
const h1 = page.getByRole('heading', { level: 1 })
const mainFF = await h1.evaluate(el => getComputedStyle(el).fontFamily)
expect(mainFF).toContain('Bodoni Moda')

// closing sentence font (Newsreader italic)
const tagline = page.getByText('Every feature ships with a doc trail.', { exact: true })
const tagFF = await tagline.evaluate(el => getComputedStyle(el).fontFamily)
expect(tagFF).toContain('Bodoni Moda')  // per Pencil TQmUG spec: Bodoni Moda 22px italic
const tagStyle = await tagline.evaluate(el => getComputedStyle(el).fontStyle)
expect(tagStyle).toBe('italic')
```

#### Mobile viewport addendum

```ts
// at 375px main sentence and tagline don't overlap or truncate
// assertion: the two getBoundingClientRect() rects don't overlap
const h1Rect = await h1.evaluate(el => el.getBoundingClientRect())
const tagRect = await tagline.evaluate(el => el.getBoundingClientRect())
expect(tagRect.top).toBeGreaterThanOrEqual(h1Rect.bottom)
```

---

### 3.4 AC-022-SUBTITLE

```ts
// 5 section subtitles (Newsreader italic)
const subtitles = page.locator('[data-section-subtitle]')
await expect(subtitles).toHaveCount(5)
const firstSubtitle = subtitles.first()
const ff = await firstSubtitle.evaluate(el => getComputedStyle(el).fontFamily)
expect(ff).toContain('Newsreader')
const style = await firstSubtitle.evaluate(el => getComputedStyle(el).fontStyle)
expect(style).toBe('italic')
```

**Recommend Engineer add `data-section-subtitle` to each subtitle `<p>`.**

---

### 3.5 AC-022-REDACTION-BAR

```ts
// at least one redaction bar exists
const bars = page.locator('[data-redaction]')
await expect(bars).toHaveCount({ min: 1 })

// background color is charcoal
const bg = await bars.first().evaluate(el => getComputedStyle(el).backgroundColor)
expect(bg).toBe('rgb(42, 37, 32)')  // #2A2520

// height matches design (10px)
const h = await bars.first().evaluate(el => getComputedStyle(el).height)
expect(h).toBe('10px')
```

---

### 3.6 AC-022-OWNS-ARTEFACT-LABEL

```ts
// 6 cards × 2 labels = 12 assertions
const roles = ['PM', 'Architect', 'Engineer', 'Reviewer', 'QA', 'Designer']
for (const role of roles) {
  const card = page.locator(`[data-role="${role}"]`)
  
  const ownsLabel = card.getByText('OWNS', { exact: true })
  const artLabel = card.getByText('ARTEFACT', { exact: true })
  
  await expect(ownsLabel).toBeVisible()
  await expect(artLabel).toBeVisible()
  
  // font Geist Mono 10px text-muted
  const ff = await ownsLabel.evaluate(el => getComputedStyle(el).fontFamily)
  expect(ff).toContain('Geist Mono')
  const fs = await ownsLabel.evaluate(el => getComputedStyle(el).fontSize)
  expect(fs).toBe('10px')
  const color = await ownsLabel.evaluate(el => getComputedStyle(el).color)
  expect(color).toBe('rgb(107, 95, 78)')  // text-muted #6B5F4E
}
```

---

### 3.7 AC-022-LINK-STYLE

```ts
// at least one link uses Newsreader italic + underline
const links = page.locator('a')
let found = false
for (const link of await links.all()) {
  const ff = await link.evaluate(el => getComputedStyle(el).fontFamily)
  const style = await link.evaluate(el => getComputedStyle(el).fontStyle)
  const deco = await link.evaluate(el => getComputedStyle(el).textDecoration)
  if (ff.includes('Newsreader') && style === 'italic' && deco.includes('underline')) {
    found = true
    break
  }
}
expect(found).toBe(true)
```

---

### 3.8 AC-022-CASE-FILE-HEADER

```ts
// TicketAnatomySection label: use design format (BQ-022-01 PM ruled)
await expect(page.getByText('Nº 04 — ANATOMY OF A TICKET', { exact: true })).toBeVisible()
```

**BQ-022-01 RESOLVED (PM 2026-04-21):** use design format `Nº 04 — ANATOMY OF A TICKET`. Reason: design is the ticket's visual source of truth; the Nº XX — numbering system spans the page's 5 section labels — consistent structure first; "CASE FILE" as a semantic descriptor doesn't replace the numbering format. AC-022-CASE-FILE-HEADER assertion changed to `Nº 04 — ANATOMY OF A TICKET`.

---

### 3.9 AC-022-LAYER-LABEL

```ts
// Pillar card top label: use AC format LAYER 1/2/3 (BQ-022-02 PM ruled)
const layerLabels = ['LAYER 1', 'LAYER 2', 'LAYER 3']
for (const label of layerLabels) {
  await expect(page.getByText(label, { exact: true })).toBeVisible()
}
// font 10px Geist Mono text-paper (white text on charcoal background)
const layerEl = page.getByText('LAYER 1', { exact: true })
const ff = await layerEl.evaluate(el => getComputedStyle(el).fontFamily)
expect(ff).toContain('Geist Mono')
const fs = await layerEl.evaluate(el => getComputedStyle(el).fontSize)
expect(fs).toBe('10px')
```

**BQ-022-02 RESOLVED (PM 2026-04-21):** use AC format `LAYER 1` / `LAYER 2` / `LAYER 3`. Reason: the section's semantic is "AI reliability layer architecture" (memory / reflection / role); LAYER numbers map directly to the cognitive model and concretely help recruiters understand the system design; `FILE Nº · PROTOCOL` is semantically vague in pillar context (PROTOCOL referent unclear). Visual format (Geist Mono 10px charcoal bar) unchanged, only text replaced.

---

### 3.10 AC-022-FOOTER-REGRESSION

```ts
// K-017 AC-017-FOOTER all assertions still PASS
await expect(page.getByText("Let's talk →", { exact: true })).toBeVisible()
const emailLink = page.locator('a[href="mailto:yichen.lee.20@gmail.com"]')
await expect(emailLink).toBeVisible()
await expect(page.getByText('Or see the source:', { exact: true })).toBeVisible()
```

---

### 3.11 AC-022-ANNOTATION

```ts
// at least one BEHAVIOUR or POSITION annotation exists
const annotations = page.locator('[data-annotation]')
await expect(annotations).toHaveCount({ min: 1 })

// or by text string ({ exact: true })
const behav = page.getByText('BEHAVIOUR', { exact: true })
const pos = page.getByText('POSITION', { exact: true })
const found = (await behav.count()) + (await pos.count())
expect(found).toBeGreaterThanOrEqual(1)

// font size 9-10px Geist Mono text-muted
const el = annotations.first()
const fs = await el.evaluate(e => getComputedStyle(e).fontSize)
expect(['9px', '10px']).toContain(fs)
```

---

### 3.12 AC-022-ROLE-GRID-HEIGHT

```ts
// 6 Role Card heights tolerance ≤ 2px
const cards = page.locator('[data-role]')
await expect(cards).toHaveCount(6)
const heights = await cards.evaluateAll(els =>
  els.map(el => el.getBoundingClientRect().height)
)
const maxH = Math.max(...heights)
const minH = Math.min(...heights)
expect(maxH - minH).toBeLessThanOrEqual(2)
```

#### Mobile viewport addendum

```ts
// at 375px grid may collapse to single column; each card still meets min-h spec
for (const width of [375, 390, 414]) {
  test(`AC-022-ROLE-GRID-HEIGHT — ${width}px — cards visible`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 812 } })
    const page = await ctx.newPage()
    await page.goto('/about')
    const cards = page.locator('[data-role]')
    await expect(cards).toHaveCount(6)
    // each card's min-h ≥ 200px (mobile may be shorter but not truncated)
    const heights = await cards.evaluateAll(els =>
      els.map(el => el.getBoundingClientRect().height)
    )
    for (const h of heights) {
      expect(h).toBeGreaterThanOrEqual(200)
    }
    await ctx.close()
  })
}
```

---

## 4. A-12 Shared primitives paper palette migration spec

### 4.1 Dark pattern grep results (hard step 1 executed)

```
grep targets: text-white / bg-gray- / border-white / bg-slate / bg-purple / text-cyan / text-gray-
Run time: 2026-04-21
```

| Component | Path | Found dark patterns | Line |
|------|------|-------------------|------|
| `CardShell` | `primitives/CardShell.tsx` | `border-white/10` (default prop), `bg-slate-800/60` | L13, L21 |
| `SectionContainer` | `primitives/SectionContainer.tsx` | `border-white/10` (divider) | L23 |
| `SectionHeader` | `common/SectionHeader.tsx` | `text-white` (h2), `text-gray-400` (description) | L16, L20 |
| `SectionLabel` | `common/SectionLabel.tsx` | `text-purple-400 border-purple-400`, `text-cyan-400 border-cyan-400`, `text-pink-400 border-pink-400`, `text-white border-white` | L7-10 |
| `CtaButton` | `common/CtaButton.tsx` | `bg-purple-600 text-white border-purple-600` (primary), `text-cyan-400 border-cyan-400` (secondary) | L11-12 |

### 4.2 Dark pattern → paper palette token mapping

| Component | Old class | New class (K-021 token) | Note |
|------|----------|------------------------|------|
| **CardShell** | `bg-slate-800/60` | `bg-paper` | /about card bg matches design `fill: #F4EFE5` |
| **CardShell** | `border-white/10` (default borderColorClass) | `border-ink/20` (proposed new default) | /about card border in design is `stroke: #1A1814 thickness:1` |
| **SectionContainer** | `border-white/10` (divider) | `border-ink/20` | Section dividers in design use `#8B7A6B` (muted); could use `border-muted/40` |
| **SectionHeader** | `text-white` (h2) | `text-ink` | Dark heading on paper |
| **SectionHeader** | `text-gray-400` (description) | `text-muted` | `#6B5F4E` |
| **SectionLabel** | `text-purple-400 border-purple-400` | `text-ink border-ink` (or `text-muted border-muted`) | /about design label uses `text-ink` + no border (changed to hairline separator) |
| **SectionLabel** | `text-cyan-400 border-cyan-400` | as above | old color prop needs to add `'ink'` option |
| **SectionLabel** | `text-pink-400 border-pink-400` | as above | |
| **SectionLabel** | `text-white border-white` | as above | |
| **CtaButton** | `bg-purple-600 text-white border-purple-600` | `bg-ink text-paper border-ink` | primary CTA on paper |
| **CtaButton** | `text-cyan-400 border-cyan-400` | `text-muted border-muted` | secondary variant |

### 4.3 /about-only vs AppPage impact analysis

| Component | /about usage | AppPage usage | K-026 impact after this ticket |
|------|----------------|-----------------|----------------------|
| `CardShell` | MetricCard / RoleCard / PillarCard / TicketAnatomyCard | K-026 AppPage may use | **High impact**: switching to `bg-paper` will change AppPage's original dark-panel visuals; K-026 must cover regression |
| `SectionContainer` | AboutPage 8 × SectionContainer | DiaryPage / other pages | **Medium impact**: divider color changes; K-026 covers AppPage regression |
| `SectionHeader` | /about currently **doesn't use** | Possibly used by other pages | **Medium impact**: change is preventative; Engineer should grep consumer |
| `SectionLabel` | /about currently **doesn't use** (A-1's section label is a new custom row) | Possibly used by HomePage/DiaryPage | **Medium impact** |
| `CtaButton` | /about currently **doesn't use** | Possibly used by AppPage | **Medium impact**: K-026 covers AppPage regression |

**Important reminder:** `CardShell`'s `borderColorClass` is **passed via prop**; this ticket recommends changing the **default value** (`border-white/10` → `border-ink/20`), not the prop interface (backward-compatible). Existing consumers passing custom borderColorClass are unaffected.

---

## 5. Implementation order (Engineer reference)

Suggested 6 stages, each a stable delivery unit:

### Stage 1 — A-12 Shared primitives migration (first)

**Reason:** all other visual changes depend on CardShell / SectionContainer paper bg; modify primitives first so subsequent stages' dev server visuals are intuitive.

**Deliverable:**
- `CardShell.tsx`: `bg-slate-800/60` → `bg-paper`, default `borderColorClass` → `'border-ink/20'`
- `SectionContainer.tsx`: divider `border-white/10` → `border-muted/40`
- `SectionHeader.tsx`: `text-white` → `text-ink`, `text-gray-400` → `text-muted`
- `SectionLabel.tsx`: add `'ink'` color option, retain existing purple/cyan/pink/white (backward-compatible)
- `CtaButton.tsx`: primary → `bg-ink text-paper`, secondary → `text-muted border-muted`

**Verification:** `npx tsc --noEmit` exit 0 + dev server visual /about each section bg = paper

**AC mapping:** AC-022-REGRESSION (primitive changes don't break K-017 text assertions)

---

### Stage 2 — A-1 Section label + hairline

**Deliverable:** in `AboutPage.tsx`, prepend `SectionLabelRow` component (or inline JSX) before each `<SectionContainer>`:

```tsx
// Recommend inline (not worth a new component; design clearly /about-specific)
<div className="flex items-center gap-4 mb-4">
  <span
    className="font-mono text-[13px] font-bold tracking-[2px] text-ink"
    data-testid="section-label"
  >
    Nº 01 — DELIVERY METRICS
  </span>
  <div className="flex-1 h-px bg-[#8B7A6B]" data-section-hairline />
</div>
```

**Verification:** Playwright `AC-022-SECTION-LABEL` test group all PASS

---

### Stage 3 — A-2 DossierHeader + A-3 Hero refactor

**Deliverable:**
- New `DossierHeader.tsx`, inserted in `AboutPage.tsx` below `<UnifiedNavBar />`
- Refactor `PageHeaderSection.tsx`: main sentence Bodoni Moda 64px italic, role line Newsreader 18px italic, tagline Bodoni Moda 22px italic (per §2.7 spec)

**Note:** A-3 needs BQ-022-01 "CASE FILE vs Nº 04" confirmed before touching `TicketAnatomySection.tsx`; this stage modifies Hero and DossierHeader only.

**Verification:** AC-022-DOSSIER-HEADER + AC-022-HERO-TWO-LINE assertions

---

### Stage 4 — A-4 subtitle + A-5 Redaction bar + A-6 OWNS/ARTEFACT label

**Deliverable:**
- 5 section components each add a subtitle `<p>` with `data-section-subtitle`
- New `RedactionBar.tsx` (`components/about/`), imported by `MetricCard.tsx` and `RoleCard.tsx`
- `RoleCard.tsx` updates OWNS/ARTEFACT label: font Geist Mono 10px `text-muted`, format uppercase tracking-[2px] (current `tracking-wide` needs verification of equivalence to letterSpacing 2)

**Verification:** AC-022-SUBTITLE + AC-022-REDACTION-BAR + AC-022-OWNS-ARTEFACT-LABEL

---

### Stage 5 — A-8/A-9 label format + A-11 annotation + A-7 Link style + C-4 grid

**Deliverable:**
- `TicketAnatomySection.tsx` section label per BQ-022-01 PM ruling
- `ReliabilityPillarsSection.tsx` / `PillarCard.tsx` top label changed to LAYER format (per BQ-022-02 ruling)
- `RoleCard.tsx` adds `data-annotation` BEHAVIOUR/POSITION marginalia
- `PillarCard.tsx` / `TicketAnatomyCard.tsx` / `FooterCtaSection.tsx` link class changed to Newsreader italic + underline
- `RoleCardsSection.tsx` grid gap → `gap-[14px]`, card `min-h-[320px]`

**Verification:** AC-022-CASE-FILE-HEADER + AC-022-LAYER-LABEL + AC-022-ANNOTATION + AC-022-LINK-STYLE + AC-022-ROLE-GRID-HEIGHT

---

### Stage 6 — Full regression

**Deliverable:** run full Playwright suite + `npx tsc --noEmit` + visual /about across 5 viewports (desktop 1280 + mobile 375/390/414)

**Verification:** AC-022-REGRESSION + AC-022-FOOTER-REGRESSION (K-017 AC-017-FOOTER all PASS)

---

## 6. Exclusion confirmation

| Excluded | Reason (set by ticket) |
|--------|-------------------|
| B-1 Pillar `<code>` tag | User decided 2026-04-20: design has it but MVP excludes |
| B-2 Ticket sub-description | Same |
| B-3 Privacy footnote | AC-018-PRIVACY-POLICY compliance requires the GA4 declaration in Footer; do not remove |
| Copy changes | K-017 copy frozen; this ticket only changes structure/visuals |
| Adding/removing sections | Scope is fine-tuning existing structure only |

---

## 7. Blocking Questions ✅ all RESOLVED (PM 2026-04-21)

| # | Question | Ruling | Affected Stage |
|---|------|------|----------|
| ~~BQ-022-01~~ | ~~TicketAnatomy section label format~~ | **RESOLVED: use design format `Nº 04 — ANATOMY OF A TICKET`** (preserve page-wide Nº XX — numbering consistency) | Stage 5 (A-8) |
| ~~BQ-022-02~~ | ~~Pillar card top label format~~ | **RESOLVED: use AC format `LAYER 1` / `LAYER 2` / `LAYER 3`** (semantic directly maps to AI reliability layer architecture) | Stage 5 (A-9) |
| ~~BQ-022-03~~ | ~~Hero main sentence second line accent color~~ | **RESOLVED: use `text-brick` (`#B43A2C`)** (explicit Pencil node value; accent emphasizes core thesis; matches Role card palette) | Stage 3 (A-3) |

---

## 8. Shared component boundary confirmation (this ticket vs K-026)

This ticket only covers **/about main consumer visual assertions**, not the AppPage consumer regression. K-026 will cover AppPage child regression tests. Specific boundary:

- **This ticket covers:** `/about` all sections, DossierHeader, MetricCard, RoleCard, PillarCard, TicketAnatomyCard
- **This ticket does NOT cover:** `/app` (AppPage) CardShell / SectionContainer consumer visual correctness (deferred to K-026)
- **Two-ticket shared primitives:** after CardShell / SectionContainer changes, Engineer must visually check `/app` doesn't crash on dev server (i.e. K-021 §8.2 visual checklist step), but no Playwright assertion is needed for AppPage

---

## 9. Self-Diff result (hard step 2)

Validate §1 Component Tree Diff table row by row across "change type / affected component / new component name" three columns:

| Row | Item | Change type ✓ | Affected existing path ✓ | New component/path ✓ |
|----|------|-----------|---------------------|--------------|
| 1 | A-1 Section label | Modify existing ✓ | SectionContainer.tsx (primitives/) ✓ | — ✓ |
| 2 | A-2 Dossier header | Add component ✓ | AboutPage.tsx ✓ | DossierHeader.tsx (components/about/) ✓ |
| 3 | A-3 Hero two-line | Modify existing ✓ | PageHeaderSection.tsx (components/about/) ✓ | — ✓ |
| 4 | A-4 Subtitle structure | Modify existing ✓ | 5 section components ✓ | — ✓ |
| 5 | A-5 Redaction bar | Add component ✓ | MetricCard.tsx + RoleCard.tsx ✓ | RedactionBar.tsx (components/about/) ✓ |
| 6 | A-6 OWNS/ARTEFACT label | Modify existing ✓ | RoleCard.tsx (components/about/) ✓ | — ✓ |
| 7 | A-7 Link style | Modify existing ✓ | PillarCard / TicketAnatomyCard / FooterCtaSection ✓ | — ✓ |
| 8 | A-8 CASE FILE header | Modify existing ✓ | TicketAnatomySection.tsx (components/about/) ✓ | — ✓ |
| 9 | A-9 LAYER label | Modify existing ✓ | ReliabilityPillarsSection + PillarCard ✓ | — ✓ |
| 10 | A-10 Footer regression | Pure regression ✓ | FooterCtaSection.tsx ✓ | — ✓ |
| 11 | A-11 BEHAVIOUR/POSITION | Modify existing ✓ | RoleCard.tsx (components/about/) ✓ | — ✓ |
| 12 | C-4 Role grid height | Modify existing ✓ | RoleCardsSection + RoleCard ✓ | — ✓ |
| 13 | A-12 Shared primitives | Modify existing ✓ | CardShell / SectionContainer / SectionHeader / SectionLabel / CtaButton ✓ | — ✓ |

**Self-Diff result: 13 rows vs 13 rows ✓** (12 items A-1~A-12 + C-4 = 13 rows)

---

## 10. File change list (Engineer delivery)

### New

- `frontend/src/components/about/DossierHeader.tsx` (A-2)
- `frontend/src/components/about/RedactionBar.tsx` (A-5)
- `frontend/e2e/about-v2.spec.ts` (K-022 AC-022-* all assertions; new file does not overwrite about.spec.ts)

### Modified

- `frontend/src/components/primitives/CardShell.tsx` (A-12)
- `frontend/src/components/primitives/SectionContainer.tsx` (A-12)
- `frontend/src/components/common/SectionHeader.tsx` (A-12)
- `frontend/src/components/common/SectionLabel.tsx` (A-12)
- `frontend/src/components/common/CtaButton.tsx` (A-12)
- `frontend/src/pages/AboutPage.tsx` (A-1 section label rows + A-2 DossierHeader insertion)
- `frontend/src/components/about/PageHeaderSection.tsx` (A-3)
- `frontend/src/components/about/MetricsStripSection.tsx` (A-4 subtitle)
- `frontend/src/components/about/RoleCardsSection.tsx` (A-4 subtitle + C-4 grid)
- `frontend/src/components/about/RoleCard.tsx` (A-5 RedactionBar + A-6 label + A-11 annotation)
- `frontend/src/components/about/ReliabilityPillarsSection.tsx` (A-4 subtitle + A-9 LAYER label)
- `frontend/src/components/about/PillarCard.tsx` (A-7 link style + A-9 LAYER label)
- `frontend/src/components/about/TicketAnatomySection.tsx` (A-4 subtitle + A-8 CASE FILE)
- `frontend/src/components/about/TicketAnatomyCard.tsx` (A-7 link style)
- `frontend/src/components/about/FooterCtaSection.tsx` (A-7 link style)
- `frontend/src/components/about/MetricCard.tsx` (A-5 RedactionBar)

### Doc sync

- `agent-context/architecture.md` (Changelog + shared primitives table updates)
- `docs/retrospectives/architect.md` (this task's reflection entry)

---

## Retrospective

### 2026-04-21 — K-022 /about structural detail design

**What went well:**
- Hard step 1 (grep dark pattern) was run immediately after reading the 5 primitive files, not by memory estimation; grep results showed SectionHeader `text-white` / SectionLabel `text-purple-400` and other batch dark patterns, revealing that `SectionLabel` and `SectionHeader` are not currently used directly by /about (section labels are each component's own h2 + Geist Mono span), avoiding sending Engineer to modify a /about-unused component.
- Pencil frame `35VCj` batch_get pulled exact values (Redaction bar `height: 10px`, Role Card `height: 320px`, grid `gap: 14px`, OWNS label `fontSize: 10px`), letting the design doc record exact numbers rather than estimated ranges.
- Found two AC-vs-design inconsistencies (BQ-022-01 CASE FILE vs Nº 04, BQ-022-02 LAYER vs FILE Nº); listed in §7 Blocking Questions rather than self-deciding.
- Self-Diff explicit run: 13 rows vs 13 rows ✓, with cell-by-cell comparison across component name / path / change-type columns.

**What didn't go well:**
- K-022 ticket specified `components/shared/` path, but the actual codebase has no `shared/` directory (primitives are in `primitives/`, SectionHeader/SectionLabel in `common/`, CtaButton also in `common/`). If the design doc kept the ticket path, Engineer would get wrong guidance. Although `ls` was run before designing to confirm actual paths, the ticket path error wasn't prominently flagged in §0 of the design doc as "ticket §A-12 path is wrong; the design uses the actual paths below"; if Engineer reads ticket first then design, they could still be confused. Root cause: when Architect found ticket-codebase path mismatch, only the design doc was corrected; the ticket typo was not prominently warned in the design doc.

**Next-time improvement:**
- If the ticket's specific path or component name doesn't match the codebase, clearly list one "Ticket path errata" item in **§0 Design preconditions** of the design doc, listing ticket's path vs actual path, to prevent Engineer confusion. This rule is added to senior-architect.md hard step "Pre-Design Path Audit".
