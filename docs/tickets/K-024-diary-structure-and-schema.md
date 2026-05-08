---
id: K-024
title: /diary structure rebuild + diary.json schema flattening
status: closed
type: feat
priority: medium
created: 2026-04-20
closed: 2026-04-22
visual-spec: docs/designs/K-024-visual-spec.json
qa-early-consultation: docs/retrospectives/qa.md#2026-04-22-k-024-early-consultation-round-1
---

## Background

After K-017 delivered the basic `/diary` rendering, on 2026-04-20 PM walked through Pencil design v2 (frame `wiDSi`) line-by-line against the Playwright visual report and found **24 differences** on the `/diary` page (22 of them substantive). The core conflicts were:
1. **Color system inverted** (dark mode vs cream-paper look) → handled by K-021
2. **Information structure entirely different**: design used a "flat timeline" (vertical line + rectangular markers + 3-layer typography) vs implementation used a "milestone accordion" (collapsible sections) → handled by this ticket
3. **diary.json schema overcomplicated** (milestone + items two-layer structure) and contained Chinese content → flattened and standardized to English by this ticket

This ticket also defines the **PM daily diary.json maintenance flow**, which after launch is executed automatically by the PM persona (`~/.claude/agents/pm.md`, written 2026-04-20).

**Full ruling record:** memory `project_k017_design_vs_visual_comparison.md` (2026-04-20)

## Dependencies

- **Depends on K-021** (sitewide design system foundation): every UI assertion in this ticket references the Tailwind tokens / three-font system / NavBar / Footer delivered by K-021
- This ticket cannot start Engineer implementation until K-021 is released

## K-027 design inheritance (added 2026-04-21)

K-027 (mobile diary hotfix) produced five interim decisions; K-024's Architect **must explicitly evaluate each one for inherit-or-redesign**, not silently inherit. K-027 design doc §6 is the canonical source:

| Item | K-027 interim decision | K-024 decision required |
|------|-----------------------|-------------------------|
| Mobile breakpoint | `sm:` = 640px (Tailwind default) | Whether the new structure inherits sm: or switches to a 480px custom breakpoint |
| DiaryEntry mobile layout | `flex-col`, date on top, text below | Order and font sizes of the flat timeline's three-layer (date + title + text) typography at mobile widths |
| Milestone spacing | `mb-4 sm:mb-3` | Entry spacing spec for the new timeline rail + marker structure |
| `overflow-hidden` strategy | Add `overflow-hidden` on the expanded region (prevent horizontal overflow) | Accordion removed in the new structure; design overflow strategy from scratch |
| `break-words` | `DiaryEntry` text column carries `break-words` | Whether the flat text element inherits this |

**K-027 design doc §2.1 Before/After comparison is K-024's "Before" baseline.**

Before K-024 Architect picks up, must read `docs/designs/K-027-mobile-diary-layout.md §6` and confirm inheritance decisions are explicitly recorded in the K-024 design doc.

## Scope

In scope:

### Phase 1 — diary.json schema flattening (data layer)

**New schema:**
```json
[
  {
    "ticketId": "K-017",
    "title": "/about portfolio-oriented recruiter enhancement",
    "date": "2026-04-19",
    "text": "Completed portfolio-oriented rewrite of /about with 8 sections covering ..."
  },
  {
    "ticketId": "K-008",
    "title": "Automated visual report script",
    "date": "2026-04-18",
    "text": "Built Playwright screenshot pipeline ..."
  }
]
```

- **Type:** `Array<{ ticketId?: string, title: string, date: string (YYYY-MM-DD), text: string }>`
- `ticketId` may be omitted (matches legacy entries with no K-XXX, e.g. Phase 1/2/3, Deployment, Codex Review Follow-up)
- Legacy entries without K-XXX are merged into **a single entry** (`ticketId` absent, title for example `"Phase 1-3 + Deployment + Early Setup"`, text is the summary of that period)
- Old schema `{ milestone, items[] }` fully converted to flat array
- **Standardize on English** (Yahoo US Commerce and similar international job-search context): translate existing Chinese entries one by one

### Phase 2 — Curation strategy (frontend rendering)

- **Homepage `<DevDiarySection>`**: show the latest **3 entries** (by `date` desc)
- **Diary page `<DiaryPage>`**:
  - Load all entries
  - Render the latest **5 entries** by default
  - Scroll or click "Load more" to load more (5 more per click; Architect picks infinite-scroll vs button-click pattern)

### Phase 3 — Diary page structural rebuild (13 items)

In scope:

1. **Dev Diary page heading**: Bodoni italic 64px + horizontal divider above + italic subtitle
2. **Left vertical rail**: 1px dark line (`charcoal` `#2A2520`) running through every entry
3. **Brick-red rectangular marker**: a marker placed where each entry's left edge meets the rail; rectangle `#9C4A3B` (`brick-dark`), dimensions per design
4. **Three-layer entry typography**:
   - Ticket title: Bodoni Moda italic 18px bold
   - Date: Geist Mono 12px
   - Text: Newsreader italic 18px
5. **Ticket ID prefix**: each entry's ticket title is in `K-XXX — <title>` format (em-dash U+2014, single half-width space on each side; only when `ticketId` exists)
6. **Remove milestone accordion**: no more collapsible sections
7. **Remove defaultOpen**: removed alongside the accordion
8. **Remove `divide-y`**: visual separation handled by rail + markers
9. **font-mono h1 changed to Bodoni**: page heading font switched from mono to Bodoni Moda
10. **Content width 1248px**: content container max-width
11. **letterSpacing**: page heading and subtitle use letterSpacing per design (Architect to fill in exact values)
12. **Page title and subtitle copy**: align with design (Architect to extract from frame `wiDSi`)
13. **Hero divider + subtitle**: horizontal divider + italic subtitle below the page-top Hero region

**Preserved (untouched):**
- B2 Loading / Error state display mechanism (existing UX kept)

### Phase 4 — PM daily diary.json maintenance flow (persona layer, already written)

- Written into the `## K-Line diary.json daily maintenance (effective after K-023 ships)` section of `~/.claude/agents/pm.md` on 2026-04-20
  - Note: the persona doc currently uses the wording "effective after K-023 ships", but the actual ticket number is **K-024** (because K-020 was already taken for GA4 SPA Pageview E2E). When this ticket closes, PM will sync the persona text to "effective after K-024 ships"
- Daily flow: read the previous day's K-Line section in `~/Diary/daily-diary.md` → filter K-Line-relevant sub-items → append to diary.json (flat schema)
- **Append-only with limited exceptions**: rewriting existing entries forbidden; typo / factual-error fixes (wrong ticket number, wrong date) allowed
- Standardize on English

**Out of scope:**
- New feature logic (this ticket is UI structure + data schema only; no change to backend prediction logic)
- Large-scale rewriting of diary content (only Chinese-to-English translation + legacy-entry merge; no rewrite of personal narrative)
- Other page changes (Homepage Diary bullet markers handled by K-023 A-2, not in this ticket)

## Design decision record

| Decision | Content | Source |
|----------|---------|--------|
| Schema flattening | `{ ticketId?, title, date, text }` flat array, not `{ milestone, items[] }` two-layer | PM ruling 2026-04-20 |
| Curation strategy | Homepage 3 entries / Diary page default 5 + scroll load more | PM ruling 2026-04-20 |
| Standardize English | Yahoo US Commerce and similar international job-search context; translate existing Chinese entries | PM ruling 2026-04-20 |
| Append-only with limited exceptions | Rewriting narrative forbidden; typo / factual-error fixes allowed | PM ruling 2026-04-20 |
| Merge legacy non-K-XXX entries | Combined into one (Phase 1/2/3 + Deployment + Codex Review Follow-up etc.), `ticketId` absent | PM ruling 2026-04-20 |
| PM persona maintenance flow enabled | Effective after this ticket closes; persona text already written, ticket number to be corrected to K-024 at close | PM ruling 2026-04-20 |
| Milestone accordion removed | Replaced by flat timeline; Loading / Error mechanism preserved | PM ruling 2026-04-20 |

## Acceptance Criteria

### AC-024-SCHEMA: diary.json adopts flat array schema `[K-024]`

**Given** a developer reads `frontend/public/diary.json`
**When** the contents are parsed
**Then** the content is a JSON array (top-level is not an object)
**And** each element is an object with schema `{ ticketId?: string, title: string, date: string, text: string }`
**And** `title` and `text` are required non-empty strings (`.length > 0`; pure-whitespace strings count as empty)
**And** the `date` field is in `YYYY-MM-DD` format (regex `^\d{4}-\d{2}-\d{2}$` matches)
**And** `date` must be a valid calendar date (`new Date(date).toISOString().slice(0, 10) === date`; rejects syntactically valid but semantically invalid values like `9999-13-45`)
**And** if `ticketId` is present it is in `K-XXX` format (regex `^K-\d{3}$`); empty string is not accepted (an empty string `""` is invalid; only an absent key is valid)
**And** entries must not contain extra keys beyond those declared (any key other than `ticketId` / `title` / `date` / `text` causes the schema guard to FAIL; leftover `milestone` / `items` counts as a violation)
**And** the old schema (`{ milestone, items[] }`) is fully converted; the file no longer contains a `milestone` key
**And** Vitest unit test: use **zod** (not a hand-written type guard; zod is declarative, easier to verify, and produces readable error messages) + `.strict()` to forbid extra keys; load diary.json and validate the schema, all entries pass

---

### AC-024-ENGLISH: diary.json entries unified to English `[K-024]`

**Given** a developer reads `frontend/public/diary.json`
**When** scanning **every string field** of every entry (`ticketId` + `title` + `date` + `text`, not just title + text)
**Then** all field contents are English (extended regex `[　-〿぀-ゟ゠-ヿ㐀-䶿一-鿿＀-￯]` matches zero times; covers CJK punctuation + hiragana + katakana + CJK Extension A + BMP CJK + fullwidth symbols and Latin)
**And** every existing Chinese entry has been translated, preserving original meaning
**And** Vitest unit test: for each entry run `Object.values(entry).filter(v => typeof v === 'string')` and apply the regex above; no matches anywhere

---

### AC-024-LEGACY-MERGE: Phase-0 legacy-merge entry pinned by title literal `[K-024]`

**Given** a developer reads `frontend/public/diary.json`
**When** scanning all entries
**Then** there is **exactly one** "PM-locked Phase-0 legacy-merge entry" (uniquely identified by its title literal)
**And** the legacy-merge entry's `ticketId` key is absent (key does not exist; not represented as an empty string)
**And** the entry's `title` literal is exactly `"Early project phases and deployment setup"` (covers Phase 1/2/3 + Deployment + Codex Review Follow-up + UnifiedNavBar)
**And** the entry's `text` is a summary of that period: **50–100 English word count** (split on whitespace, `text.trim().split(/\s+/).length` between 50 and 100 inclusive)
**And** the entry's `date` is `"2026-04-16"` (PM ruling 2026-04-22: last activity day of that period; Phase 1-3 + Deployment + Codex Review Follow-up activity wrapped up on 2026-04-16, K-017 starts on 2026-04-19)
**And** other entries with absent `ticketId` (non-legacy-merge) **are permitted**, used to express PM-level non-ticket milestones (such as README roadmap updates, cross-ticket decision announcements); such entries are not bound by the legacy-merge title/date/text constraints
**And** `ticketId: ""` (empty string) is **not valid** (enforced by AC-024-SCHEMA's `^K-\d{3}$` regex; absent `ticketId` may only be expressed as "key not present", not as an empty string)
**And** Vitest assertion (legacy uniqueness): `entries.filter(e => e.title === 'Early project phases and deployment setup').length === 1`
**And** Vitest assertion (legacy entry `ticketId` key absent): for that legacy entry at the raw JSON layer `!('ticketId' in e)` is true
**And** Vitest assertion (word count): for that legacy entry, `text.trim().split(/\s+/).length` is between 50 and 100 inclusive
**And** Vitest assertion (empty string forbidden): `entries.filter(e => e.ticketId === '').length === 0`

---

### AC-024-HOMEPAGE-CURATION: Homepage shows the latest 3 entries `[K-024]`

**Scope**: this AC applies only to desktop viewport ≥ 1248px; mobile behavior is covered uniformly by AC-024-CONTENT-WIDTH's Architect hand-off.

**Given** a user visits `/` with viewport width ≥ 1248px and `diary.json` entry count ≥ 3
**When** the page scrolls to the Diary section (`hpDiary`)
**Then** **3 entries** are shown (no more, no fewer), corresponding to visual-spec `N0WWY`'s `entryCount=3`
**And** the 3 entries are sorted by `date` descending (newest at top)
**And** the 3 entries are the 3 with the latest `date` in diary.json
**And** **Tie-break rule**: when two entries share the same `date`, the one appearing **later in the `diary.json` array is newer** (larger array index wins; consistent with the K-Line daily-append flow)
**And** the Homepage diary section contains 3 marker elements (one per entry), per visual-spec `N0WWY`'s marker role
**And** Playwright assertion: select 3 elements via `data-testid="diary-entry-wrapper"` (reusing K-028 Sacred testid to avoid two `data-testid` attributes colliding on the same DOM node); `expect(page.locator('[data-testid="diary-entry-wrapper"]')).toHaveCount(3)`; and `expect(homepageMarkers).toHaveCount(3)`

**Given** `diary.json` entry count is 0 (empty array)
**When** the user visits `/`
**Then** the Homepage Diary section heading (`DEV DIARY` label) **remains rendered** (per K-028 Sacred `AC-028-DIARY-EMPTY-BOUNDARY`); rail and markers are not rendered; no empty-state message
**And** Playwright assertion: `expect(page.getByText('DEV DIARY', { exact: true })).toBeVisible()` + `expect(page.locator('[data-testid="diary-entry-wrapper"]')).toHaveCount(0)` + `expect(page.locator('[data-testid="diary-rail"]')).toHaveCount(0)` + `expect(page.locator('[data-testid="diary-marker"]')).toHaveCount(0)`
**Note**: this clause was revised on 2026-04-22 per K-028 Sacred (discovered in Code Review R1 depth pass D-1). The original "section entirely hidden" wording directly conflicted with AC-028-DIARY-EMPTY-BOUNDARY; K-028 Sacred is immutable, so the AC was rewritten to align.

**Given** `diary.json` entry count is 1 or 2 (`< 3`)
**When** the user visits `/`
**Then** **all available entries are shown** (no padding, no placeholder, no section hiding; Homepage shows N entries, where N = total entry count)
**And** marker count = displayed entry count (not fixed at 3)
**And** Playwright assertion (one fixture each for 1 entry and 2 entries): `diary-entry-wrapper` count equals fixture size

---

### AC-024-DIARY-PAGE-CURATION: Diary page renders 5 entries by default + Load more button to fetch more `[K-024]`

**Scope**: this AC applies only to desktop viewport ≥ 1248px; mobile behavior is covered uniformly by AC-024-CONTENT-WIDTH's Architect hand-off.

**Pagination pattern**: PM ruling 2026-04-22 chose **Load more button** (not infinite scroll) — buttons are testable and avoid scroll-timing flakiness; Architect picks the button literal text, position, and disabled style.

**Data fetch**: load the entire `diary.json` once; all pagination is **pure client-side slicing** (no mid-load API failure scenario; AC-024-LOADING-ERROR-PRESERVED only covers the initial fetch).

**Tie-break**: when `date` is equal, larger array index wins (consistent with AC-024-HOMEPAGE-CURATION).

**Given** a user visits `/diary` with viewport ≥ 1248px and `diary.json` entry count ≥ 5
**When** page load completes (Load more not yet clicked)
**Then** **5 entries** of diary are shown
**And** the 5 entries are sorted by `date` descending (with array-index-descending tie-break)
**And** the 5 entries are the 5 with the latest `date` in diary.json

**Given** the user is on `/diary` and diary.json entry count > 5
**When** the user clicks the Load more button
**Then** 5 more entries are rendered (10 total displayed)
**And** if the remaining diary.json entries ≤ 0, the Load more button is **removed from the DOM or disabled**
**And** Playwright assertion: 5 initial; 10 after click; remaining 0 → button `expect(button).toBeHidden()` or `toBeDisabled()`

**Boundary** (PM mandate; one spec per fixture):
- **entry = 0**: Diary page shows a "no entries yet" empty-state message (literal defined by Architect); Load more button does not exist; rail/marker not rendered
- **entry = 1**: 1 shown; Load more does not exist; rail height fits the single entry container
- **entry = 3** (< initial 5): 3 shown; Load more does not exist
- **entry = 5** (= initial): 5 shown; Load more **does not exist** (nothing to load)
- **entry = 10** (= exactly full after one Load more): initial 5 → click → 10; Load more does not exist after click
- **entry = 11** (> 2 rounds): initial 5 → first click 10 → second click 11; Load more does not exist after second click

**Concurrency / idempotency**:
**Given** the user rapidly clicks the Load more button twice (< 100ms apart)
**When** the second click occurs within the first click's render cycle
**Then** only **5 more entries** are loaded (not 10); Load more is disabled during loading or guarded by a React state flag to ensure idempotency
**And** Playwright assertion (rapid double-click): after `await Promise.all([button.click(), button.click()])`, 10 entries are shown (not 15)

**Fixture strategy**:
- Boundary specs use `page.route('**/diary.json', ...)` to fulfill test fixtures (one fixture each for array size 0/1/3/5/10/11)
- Do not modify production `frontend/public/diary.json` for tests
- Existing DiaryPage.spec.ts main flow continues to use production diary.json

---

### AC-024-TIMELINE-STRUCTURE: Diary page uses flat timeline structure `[K-024]`

**Scope**: this AC applies only to desktop viewport ≥ 1248px; mobile rail/marker behavior is covered uniformly by AC-024-CONTENT-WIDTH's Architect hand-off.

**Given** a user visits `/diary` with viewport ≥ 1248px
**When** page load completes
**Then** the page is structured as a flat vertical timeline, **with no milestone accordion** (no collapsible sections)
**And** all entries are arranged vertically at the same level (not grouped/nested)
**And** there is a vertical rail on the left running through all entries
  - Color, width, and x coordinate per visual-spec `wiDSi`'s rail role
  - rail height is **not asserted directly against the visual-spec 624px literal** (the design's 624px is coupled to a fixed entry height, but real DOM entry height varies with text length)
  - assert instead "rail height ≥ rendered entries container height − tolerance" (robust to text wrapping)
**And** each entry has a rectangular marker where its left edge meets the rail; size, cornerRadius, position, and color per visual-spec `wiDSi`'s marker role
**And** **marker count = current rendered entry count** (dynamic semantic; not the fixed visual-spec entryCount literal)
  - `/diary` initial load: marker count = initial entry count (5, or total count if total < 5)
  - After Load more click: marker count = new total displayed entry count
  - Homepage: marker count = displayed entry count from AC-024-HOMEPAGE-CURATION (0 → marker count = 0, section heading retained per K-028 Sacred; 1/2 → equals total entry count; ≥3 → equals 3)
**And** Playwright **negative assertions** (regression prevention):
  - `expect(page.locator('details, summary')).toHaveCount(0)` — no accordion
  - `expect(page.locator('[class*="divide-y"]')).toHaveCount(0)` — old divider removed
  - `expect(page.locator('[class*="milestone"]')).toHaveCount(0)` — old milestone wrapper removed
**And** Playwright **positive assertions** (rail): `import spec from '../docs/designs/K-024-visual-spec.json';` → rail `toHaveCSS('backgroundColor', hexToRgb(railRole.color))`; rail `width` asserted against the JSON value; rail `height` computed dynamically (entries bounding box bottom − top) and compared against rail bounding box via `toBeGreaterThanOrEqual`
**And** Playwright **positive assertions** (marker): marker count dynamic = `page.locator('[data-testid="diary-entry"]').count()`; each marker's computed `backgroundColor` / `width` / `height` / `borderRadius` asserted via `toHaveCSS` using JSON import + `hexToRgb`

---

### AC-024-ENTRY-LAYOUT: each entry uses three-layer typography `[K-024]`

**Scope**: this AC applies only to desktop viewport ≥ 1248px; mobile three-layer text order and font sizes are covered uniformly by AC-024-CONTENT-WIDTH's Architect hand-off.

**Given** a user visits `/diary` with viewport ≥ 1248px
**When** the page scrolls to any entry
**Then** the entry contains three text layers: entry-title / entry-date / entry-body
**And** **DOM order**: title precedes date precedes body (`titleEl.compareDocumentPosition(dateEl) & Node.DOCUMENT_POSITION_FOLLOWING` truthy; `dateEl.compareDocumentPosition(bodyEl) & Node.DOCUMENT_POSITION_FOLLOWING` truthy)
**And** font-family, size, weight, line-height, letterSpacing, and color of each layer are defined by the matching role (entry-title / entry-date / entry-body) on `wiDSi` frame in `docs/designs/K-024-visual-spec.json`
**And** if `ticketId` is present, the entry-title text is in `K-XXX — <title>` format
  - Separator is em-dash (U+2014) **explicit codepoint**, with a **single** half-width space on each side (no double space)
  - Example: `K-017 — Portfolio /about Rewrite`
  - **Must not** use middle-dot (·, U+00B7) or hyphen-minus (-, U+002D) as the ticketId/title separator
  - Negative-assertion scope: only checks the separator position between ticketId and title; hyphens within the title body (e.g. `AI-powered prediction`) are legal
**And** if `ticketId` is absent, entry-title is the title text directly; textContent **does not** start with `K-\d{3}`, and **does not** contain ` — ` as a leading separator
**And** Playwright **positive assertion** (ticketId present case): entry-title textContent matches regex `/^K-\d{3} — .+$/` (codepoint `—` explicit; single space enforced; prevents double space)
**And** Playwright **negative assertions** (ticketId present case, prefix-scoped):
  - `expect(text).not.toMatch(/^K-\d{3} · /)` — prefix must not use middle-dot separator
  - `expect(text).not.toMatch(/^K-\d{3} - /)` — prefix must not use hyphen-minus separator (hyphens in the title body unaffected)
**And** Playwright assertion (no-ticketId case): `expect(text).not.toMatch(/^K-\d{3}/)`
**And** Playwright assertion (font catchall): entry-title / entry-date / entry-body computed `fontFamily` / `fontSize` / `fontStyle` / `fontWeight` / `lineHeight` / `letterSpacing` / `color` all asserted via `toHaveCSS` using imported visual-spec role values + `hexToRgb(role.color)`; literal numbers must not be hand-written

---

### AC-024-PAGE-HERO: /diary page Hero region heading + divider + italic subtitle `[K-024]`

**Scope**: this AC applies only to desktop viewport ≥ 1248px; mobile Hero font sizes and divider dimensions are covered uniformly by AC-024-CONTENT-WIDTH's Architect hand-off.

**Given** a user visits `/diary` with viewport ≥ 1248px
**When** page load completes
**Then** a Hero region appears at the top of the page (below the NavBar)
**And** the heading text is `Dev Diary` (per visual-spec `wiDSi`'s hero-title role)
**And** the heading font spec follows visual-spec `wiDSi`'s hero-title role (Bodoni Moda italic 64px)
**And** below the heading is a horizontal divider, dimensions and color per visual-spec `wiDSi`'s hero-divider role
**And** below the divider is an italic subtitle, literal text: `Each entry records a milestone, a decision, or a lesson that shaped the system. Filed chronologically, latest first.`
**And** the subtitle font spec follows visual-spec `wiDSi`'s hero-subtitle role (Newsreader italic 17px)
**And** Playwright assertion: `import spec from '../docs/designs/K-024-visual-spec.json';` → hero-title `toHaveText(heroTitle.text)`; computed `fontFamily` / `fontSize` / `fontStyle` / `color` asserted via `toHaveCSS` using JSON import
**And** Playwright assertion: hero-subtitle `toHaveText(heroSubtitle.text)`; computed style asserted via `toHaveCSS` using JSON import
**And** Playwright assertion: hero-divider computed `backgroundColor` = `hexToRgb(spec.frames[0].components.find(c => c.role === 'hero-divider').color)`

---

### AC-024-CONTENT-WIDTH: Diary page content width 1248px + breakpoints + no overflow `[K-024]`

**Given** a user visits `/diary` with viewport width ≥ 1248px
**When** page load completes
**Then** the content container's computed `maxWidth` is `1248px` (per visual-spec `wiDSi.contentWidth`)
**And** the content container is horizontally centered (`margin: 0 auto` or equivalent)
**And** Playwright assertion (desktop viewports 1920/1440): `/diary` content container computed `maxWidth` = `1248px`

**Given** a user visits `/diary` with viewport width **exactly 1248px** (boundary)
**When** page load completes
**Then** the content container's computed `maxWidth` is `1248px` (closed-interval threshold inclusive)
**And** Playwright assertion: after `setViewportSize({ width: 1248, height: 800 })`, the maxWidth assertion passes

**Given** a user visits `/diary` with viewport width between **481px and 1247px** (tablet / laptop portrait mid-range)
**When** page load completes
**Then** the page has no horizontal scrollbar overflow (`document.documentElement.scrollWidth <= window.innerWidth`)
**And** the content container width ≤ viewport width (does not exceed the window)
**And** Playwright assertion (three viewports 800 / 1024 / 1200): `scrollWidth <= innerWidth` (no-overflow); content container bounding-box width ≤ viewport width

**Given** a user visits `/diary` with viewport width **≤ 480px** (mobile only)
**When** page load completes
**Then** the mobile layout spec is defined by the Architect design doc at `docs/designs/K-024-diary-structure.md` (breakpoint decision; entry three-layer text order and font sizes at narrow widths; whether rail / marker are hidden or scaled)
**And** this AC does not test mobile (≤ 480px) layout details; mobile assertions are added either in a new AC after the Architect design doc is finalized or in the design doc's Playwright list
**And** but the **no-overflow guard** still applies (mobile viewports also require `scrollWidth <= innerWidth`)

---

### AC-024-LOADING-ERROR-PRESERVED: Loading / Error / Empty state mechanism preserved `[K-024]`

**Scope**: only the `/diary` page; the Homepage DevDiarySection loading/error path is logged as a Known Gap (see KG-024-HOMEPAGE-ERROR).

**Source of Truth**: this AC's Given/When/Then is the contract; selector / literal / behavior detail cross-references `docs/designs/K-024-diary-structure.md` §6.3 DiaryLoading / DiaryError / DiaryEmptyState component spec (Architect deliverable 2026-04-22).

---

**Given** a user visits `/diary` and `useDiary()` returns `loading === true`
**When** the page renders
**Then** `[data-testid="diary-loading"]` is visible, with `role="status"` and `aria-label="Loading diary entries"` (per design doc §6.3 DiaryLoading spec)
**And** the inner text is `"Loading diary…"`
**And** Playwright slow-network simulation: `page.route('**/diary.json', r => setTimeout(() => r.continue(), 500))` → `diary-loading` visible for at least 100ms; only after fetch resolves is `diary-entry` shown
**And** `diary-error` / `diary-empty` / `diary-entry` are not visible during loading

**Given** `/diary` fetch returns non-2xx (e.g. `page.route('**/diary.json', r => r.fulfill({ status: 404 }))`, or 5xx `{ status: 500 }`)
**When** the page renders
**Then** `[data-testid="diary-error"]` is visible, with `role="alert"`
**And** the message text is `"Failed to load diary: <status>"` (`<status>` is the actual HTTP status code; e.g. `"Failed to load diary: 404"`, `"Failed to load diary: 500"`)
**And** the same container contains a clickable `<button>Retry</button>`
**And** `diary-loading` / `diary-entry` / `diary-empty` are not visible

**Given** the user clicks the Retry button once in the error state
**When** the click fires
**Then** `diary-loading` reappears immediately (refetch triggered)
**And** the Retry button is `disabled` while `loading === true` (prevents concurrent double-click)
**And** after refetch resolves, the result determines what shows: 2xx → `diary-entry` (`diary-error` disappears); non-2xx → `diary-error` persists (Retry clickable again)

**Given** the user double-clicks Retry during loading (twice within 50ms)
**When** the double-click fires
**Then** the second click is suppressed because the button is `disabled`; only the first click's fetch is in flight
**And** Playwright assertions: `expect(retryButton).toBeDisabled()` (during loading=true); `expect(retryButton).toBeEnabled()` (when error and !loading)

**Given** `/diary` fetch returns an empty array `[]` (fixture `_fixtures/diary/diary-empty.json`)
**When** loading completes
**Then** `[data-testid="diary-empty"]` is visible, displaying text `"No entries yet. Check back soon."` (per design doc §6.3 DiaryEmptyState spec)
**And** `diary-loading` / `diary-error` / `diary-entry` are not visible (count=0)

**Given** the error message is > 200 characters long (e.g. multi-line zod schema validation error output, or a long `err.message` passed through fetch)
**When** `diary-error` renders at mobile viewport (375px wide)
**Then** the message container applies `word-break: break-word` and the long message wraps without horizontal overflow
**And** Playwright assertion: `expect(body.scrollWidth).toBeLessThanOrEqual(viewport.width)` (no horizontal scrollbar)
**And** the Retry button is not pushed off-screen by the message length (`retryButton.isVisible()` is true)

---

**Error classification coverage:**
- **Required (Playwright spec coverage)**: 404 (4xx representative), 500 (5xx representative), empty `[]`, long error message (>200 chars)
- **Known Gap KG-024-LOADING-TIMEOUT**: timeout, offline, CORS not separately asserted. Per design doc §6.3 L574-576, all three are surfaced as browser-thrown TypeError, the UI shows `"Failed to load diary: <err.message>"`, equivalent to 4xx/5xx; standalone tests have low ROI; relies on useDiary unified error handling.
- **Known Gap KG-024-HOMEPAGE-ERROR**: the Homepage `DevDiarySection` loading/error path reuses main's existing `<ErrorMessage>` pattern (existing conditional render in `frontend/src/components/home/DevDiarySection.tsx`); not in this AC's test scope. When Engineer reshapes Phase 2 the existing conditional rendering must be preserved; regression test (pages.spec.ts) covers happy path; error path accepted with no E2E assertion.

**Known Gap KG-024-LOADING-RETRY-SPAM**: this AC already guarantees button-level concurrency gating via `disabled={loading}`; "two simultaneous fetches" race condition is not tested. If useDiary adds an AbortController in future, the assertion gets a separate AC.

---

### ~~AC-024-PM-PERSONA-SYNC~~ → moved to DoD Checklist (not an AC) — **Closed 2026-04-22**

**Reclassify 2026-04-22** (QA Challenge #10): this item is a one-off manual Edit to a file external to the repo (`~/.claude/agents/pm.md`); **no test harness** can verify it, making it unsuitable as a Playwright/Vitest-testable AC. QA ruled untestable.

**Reclassified as a DoD Checklist item under `## Release Status`** (see that section) — executed by PM via Edit tool call when this ticket closes, recorded in the ticket `## Retrospective`; not counted as a Phase Gate AC.

**Close note (2026-04-22):** the DoD was effectively achieved when this ticket entered the close phase (grep `"K-023 上線後生效"` under `~/.claude/agents/` returns 0 lines; `pm.md` line 262 under `### Example: K-Line Prediction project` already reads `**Diary update automation:** After K-024 goes live, ...`). No further Edit needed in this session; all three DoD Checklist items are `[x]`.

---

### AC-024-REGRESSION: existing functionality has no regression `[K-024]`

**Sacred assertions** (immutable; assertion FAIL = this ticket has violated):
- K-017 `NavBar` order + Footer visibility (no Footer on `/diary`, see AC-017-FOOTER negative assertion)
> **Retired 2026-04-23 by K-034 Phase 3 (absorbs ex-K-038 §3 BQ-034-P3-03)** — user intent change: /diary now renders shared Footer per AC-034-P3-DIARY-FOOTER-RENDERS. AC text body preserved as historical record.
- K-017 `AC-017-HOME-V2` Homepage sections DOM order + bullet marker visibility
- K-023 `<DevDiarySection>` Homepage renders 3 diary markers (20×14 / `rgb(156, 74, 59)` / `borderRadius 0`)
- K-021 `/about` readability tokens (`ink` / `paper` / `brick-dark`) assertions
- K-027 mobile DiaryEntry `flex-col` + `break-words` + `overflow-hidden` interim decisions (preserved unless K-024 Architect design doc explicitly redesigns and §K-027 design inheritance rules override)
- All existing `npm run test` (Vitest) passing cases must not regress

**Allowed-to-change assertions** (reasonable updates required by flat schema / new timeline structure):
- Old `<details>` / `<summary>` accordion assertions (removable)
- Old `.divide-y` visual-separator assertion (removable)
- Old `milestone` wrapper / `items[]` nested-schema assertions (removable)
- Existing `AC-DIARY-1` Diary page render assertion may be rewritten to the flat schema; but the **core behavior** "load entries from diary.json and display" must be preserved
- Old K-017 "`/diary` shows milestone accordion expanded" assertions may be rewritten as new timeline assertions

**K-027 regression policy**: if the Architect design doc chooses not to inherit a K-027 interim decision, it must **report back to PM** to escalate as blocker + log Tech Debt; only after PM rules can the matching K-027 AC be removed. Architect / Engineer must not silently drop it.

**Given** all K-017 / K-021 / K-023 / K-027 Sacred assertions are PASS at baseline
**When** this ticket's implementation is complete
**Then** the full Playwright E2E suite runs: Sacred assertions all PASS; Allowed-to-change items rewritten and PASS
**And** Homepage `<DevDiarySection>` continues to render 3 entries after this ticket lands (AC-024-HOMEPAGE-CURATION ✓)
**And** `npx tsc --noEmit` exit 0
**And** `npm test` (Vitest) exit 0 (including this ticket's new zod schema spec + AC-024-SCHEMA / AC-024-ENGLISH / AC-024-LEGACY-MERGE three Vitest specs)
**And** changes to `frontend/public/diary.json` trigger the `DiaryPage.spec.ts` Playwright subset to pass (per the file-class table)
**And** if any Sacred assertion FAILs, QA does not sign off; Engineer fixes and re-runs

---

## Release Status

**Awaiting K-021 first + Architect design:** Architect picks up K-024 after K-021 ships and produces design doc `docs/designs/K-024-diary-structure.md`, covering:
- diary.json schema migration strategy (one-shot conversion vs dual-schema transition)
- Chinese-entry translation plan (translation principles preserving original meaning)
- Actual `text` of the merged-legacy non-K-XXX paragraph (50–100 words; date already fixed at `2026-04-16`, title fixed at `"Early project phases and deployment setup"`)
- Homepage / Diary page component `data-testid` contract (at minimum: `diary-entry-wrapper` (Homepage, reuse K-028 Sacred) / `diary-entry` (/diary) / `diary-loading` / `diary-error` / `diary-load-more`)
- **Mobile breakpoint decision** (PM tentative: inherit K-027 `sm:` 640px unless Architect proposes a specific design reason for a 480px custom; not inheriting requires escalation to blocker + TD log)
- Mobile layout: entry three-layer text order, font sizes, whether rail / marker are hidden or scaled (≤ 480px range; 481-1247px no-overflow is sufficient)
- ~~Loading / Error component actual structure~~ → Architect delivered design doc §6.3 (DiaryLoading / DiaryError / DiaryEmptyState) on 2026-04-22; AC-024-LOADING-ERROR-PRESERVED back-filled after QA R2 on 2026-04-22, DEFERRED status removed
- Load more button literal text, disabled style, position (pattern fixed: button click + client-side slicing, see AC-024-DIARY-PAGE-CURATION)

**DoD Checklist (PM executes at ticket close, not an AC):**
- [x] `~/.claude/agents/pm.md` diary automation entry text uses `K-024` as canonical (line 262 under `### Example: K-Line Prediction project`: `**Diary update automation:** After K-024 goes live, update frontend/public/diary.json following the flow in docs/tickets/K-024-diary-structure-and-schema.md ...`) — **2026-04-22 close-session verification: persona file was already synced to K-024 wording before this ticket entered the close phase** (the old "K-Line diary.json daily maintenance (effective after K-023 ships)" section had been compressed during audit-personas consolidation into a concise paragraph under `### Example`, not added in this session); DoD is effectively achieved, no further Edit needed.
- [x] Verified: `grep -rn "K-023 上線後生效" ~/.claude/agents/` returns 0 lines; `grep -n "K-024 goes live" ~/.claude/agents/pm.md` hits line 262. No before/after diff to record (effective before this session).
- [x] AC-024-PM-PERSONA-SYNC retired section marked **Closed 2026-04-22**.

**Already locked by visual-spec.json (Architect reads `docs/designs/K-024-visual-spec.json` directly; no further decision needed):**
- ~~Brick-red rectangular marker exact dimensions~~ → `wiDSi` marker role (20×14px, cornerRadius 6)
- ~~Hero subtitle copy~~ → `wiDSi` hero-subtitle.text
- ~~Hero heading exact text~~ → `wiDSi` hero-title.text = `"Dev Diary"`
- ~~entry-title separator~~ → em-dash (U+2014, single space each side), see AC-024-ENTRY-LAYOUT + `wiDSi` entry-title role textDelimiter

**QA Early Consultation status:**
- **Round 1 (2026-04-22) complete**: per-AC testability review across 12 ACs + 7-category boundary sweep + visual-spec drift scan; produced 11 Challenges; PM ruled on 2026-04-22 with back-fills (see each AC + `docs/retrospectives/qa.md`).
- **Round 2 (2026-04-22) complete**: AC-024-LOADING-ERROR-PRESERVED review reopened (Architect design doc §6.3 as input); produced 1 Challenge (AC body needed back-fill) + 3 Interceptions (retry flow / Homepage error gate / long message overflow); PM ruling 2026-04-22: Challenge back-filled with Given/When/Then per design doc §6.3; Interception #1 / #3 Option A (back-fill AC), #2 Option B Known Gap KG-024-HOMEPAGE-ERROR. AC released from DEFERRED.
- Frontmatter `qa-early-consultation` field points to the 2026-04-22 K-024 Early Consultation entry in `docs/retrospectives/qa.md` (Round 1 + Round 2 same-day entries).

**PM prerequisites for releasing Architect** (per global CLAUDE.md PM Handoff Verification):
1. Frontmatter `qa-early-consultation` field already points to Round 1 retrospective entry (commit `e2b6fe5` landed ✓)
2. K-021 closed + deployed (closed 2026-04-20, CDN verified ✓)
3. The current AC version is the post-Round-1 revision (PM ruling 2026-04-22 ✓)
4. Architect delivered the design doc on 2026-04-22 (`docs/designs/K-024-diary-structure.md`) + 1 BQ; after design-doc delivery, run QA Early Consultation Round 2 covering LOADING-ERROR, then release Engineer.

**PM BQ / Interception ruling record:**

**BQ-024-01 (Architect raised 2026-04-22)**: AC-024-HOMEPAGE-CURATION's original `data-testid="homepage-diary-entry"` literal collided with K-028 Sacred `data-testid="diary-entry-wrapper"` on the same DOM element (HTML forbids duplicate data-testid).
- **PM ruling 2026-04-22**: Option (b) — rename the K-024 AC literal `homepage-diary-entry` → `diary-entry-wrapper` (reuse K-028 Sacred).
- **Reason**: K-028 closed + deployed + CDN live bundle grep verified `diary-entry-wrapper` exists; Sacred immutable → Option (a) violates; Option (c) adds dead DOM → Option (b) cheapest; AC is PM-owned so the operation is permitted.
- **Impact**: 3 literals in K-024 ticket (AC-024-HOMEPAGE-CURATION line 184 / 195, §Release Status data-testid contract list); all updated in this same ruling commit.
- **Phase 2 unblocked**: Architect may proceed with Phase 2 curation design.

**QA-R2 Challenge #12 (raised 2026-04-22)**: AC-024-LOADING-ERROR-PRESERVED body was still in the DEFERRED block, not back-filled per Unblock Protocol step 2 with Given/When/Then sourced from Architect design doc §6.3. Engineer writes AC, not design doc.
- **PM ruling 2026-04-22**: Challenge accepted; AC body back-filled (see AC-024-LOADING-ERROR-PRESERVED line 337+). Covers loading / 404 error / 500 error / empty / retry-disabled / long-message-overflow with 6 Given/When/Then groups.
- **Impact**: AC-024-LOADING-ERROR-PRESERVED released from DEFERRED state; test count estimate 6 Playwright specs (T-L1 loading / T-L2a 404 / T-L2b 500 / T-L3 empty / T-L4 retry-disabled / T-L5 long-message).

**QA-R2 Interception #1 (raised 2026-04-22)**: AC did not cover Retry button behavior (re-fetch + concurrency protection).
- **PM ruling 2026-04-22**: Option (a), back-fill the AC. Retry click → `diary-loading` reappears → refetch; Retry button uses `disabled={loading}` during loading to prevent spam (button-level gate; no AbortController needed). Known Gap KG-024-LOADING-RETRY-SPAM explicitly states: "two simultaneous fetches" race condition is not tested (disabled already covers the rapid-double-click scenario).
- **Reason**: Retry UX is user-visible behavior, requires AC contract; `disabled={loading}` is the cheapest concurrency protection (button-level prevention > introducing AbortController).

**QA-R2 Interception #2 (raised 2026-04-22)**: Homepage `DevDiarySection` fetch-failure UX has no AC coverage; K-028 Sacred only tests happy path.
- **PM ruling 2026-04-22**: Option (b), Known Gap KG-024-HOMEPAGE-ERROR. Homepage DevDiarySection reuses main's existing `<ErrorMessage>` conditional render (not a K-024 scope change); during Engineer Phase 2 reshape, the existing error path behavior must be preserved; regression accepted with no E2E assertion.
- **Reason**: Homepage error path is a K-028 scope leftover; K-024's focus is /diary flat timeline + diary.json flat schema; should not expand AC; existing conditional render works; Engineer hand-off must preserve.

**QA-R2 Interception #3 (raised 2026-04-22)**: error messages > 200 chars may overflow horizontally on mobile 375px.
- **PM ruling 2026-04-22**: Option (a), back-fill the AC. `diary-error` container applies `word-break: break-word`; Playwright assertion at mobile 375px: `body.scrollWidth <= viewport.width`; Retry button not pushed off-screen.
- **Reason**: zod strict schema + raw `err.message` may emit long messages, violating AC-024-CONTENT-WIDTH no-overflow spirit; `word-break` is a cheap one-line CSS; defensive design beats letting users encounter a broken UI.

## Related Links

- [PRD.md — K-024 section](../../PRD.md) (sync pending)
- [memory: project_k017_design_vs_visual_comparison.md](~/.claude/projects/-Users-yclee-Diary/memory/project_k017_design_vs_visual_comparison.md)
- [K-017 ticket (Homepage v2 prerequisite)](./K-017-about-portfolio-enhancement.md)
- [K-021 ticket (foundation prerequisite)](./K-021-sitewide-design-system.md)
- [Design: homepage-v2.pen frame wiDSi](../../frontend/design/homepage-v2.pen)
- [pm.md persona (~/.claude/agents/pm.md)](~/.claude/agents/pm.md)

---

## Retrospective

(Architect / Engineer / Reviewer / QA / Designer each fill in upon completing their phase; PM consolidates after QA PASS)

### Engineer (Phase 1+2)

**Implementation steps that were smooth:** The TDD sequence worked — writing the `useDiaryPagination` Vitest spec first caught a React stale-closure bug in the `if (inFlight) return` concurrency gate (synchronous double-call bypassed the gate because the `useCallback` captured `inFlight=false` in both calls). Fixed with a `useRef` mirror while keeping the `inFlight` state for `canLoadMore` derivation — same public interface, correct semantics. Minimum-touch reshape of Phase-3-scoped files (`MilestoneSection.tsx` / `DiaryEntry.tsx` / `DiaryTimeline.tsx`) via inlined local private types kept tsc green with zero behavior drift; `DiaryPage.tsx` synthetic-milestone adapter (1 flat entry → 1 synthetic milestone) preserved AC-DIARY-1 accordion tests during the Phase 1+2 PR window (design §13 step 12 accepted failure, but adapter let them pass — no `test.skip` required). All 190 Playwright pass, 1 pre-existing skip, 0 fail. All 80 Vitest pass (27 K-024 new + existing).

**Scope boundary issues found:**

1. **BQ-ENG-K024-PHASE1 scoping conflict (previously ruled):** PM invocation initially said "Phase 1 ONLY" while Architect design §3.6 + §13 pre-ruled Phase 1+2 combined PR. Correctly stopped + filed BQ + PM ruled Option (A) per Architect design. Resumed Phase 1+2 scope.

2. **Legacy-merge content boundary (not blocking, resolved as mechanical call but should have been BQ):** `"PM — README Future Enhancements"` milestone (2026-04-21) has no `K-XXX` ticket ID and was not enumerated in design §3.4 "Covered milestones" list. AC-024-LEGACY-MERGE caps legacy-shape entries at exactly 1, and the single legacy entry's title/date/text are PM-locked to Phase-0-through-Deployment content. With no syntactic home, I dropped the README milestone via "mechanical grouping discretion" per design §3.4. Content-bearing scope calls should have been BQ to PM, not Engineer call.

3. **Invocation-vs-design placement of `timelinePrimitives.ts`:** PM invocation listed it under Phase 1+2 NEW while Architect §10 + §13 place it in Phase 3. Resolved by adding now as a purely additive constants file (zero consumers in Phase 1+2, pre-placed for Phase 3). Should have flagged the delta explicitly as BQ rather than silent Engineer resolution.

4. **Design-vs-implementation pattern gap in `useDiaryPagination` concurrency gate:** design §4.2 snippet relied on `useState`-captured `inFlight` to guard double-calls, which fails under synchronous double-call (stale closure). Fix was self-decidable (ref mirror, identical interface + semantics) but the pattern should be codified in Engineer persona to avoid future occurrences.

**Next time improvement:**

- (a) When translating historical content and a source item isn't enumerated in the design's explicit legacy-merge coverage list, BQ to PM before dropping. "Mechanical discretion" only applies to formatting/ordering, never to content presence/absence.
- (b) Invocation-vs-Architect-design deltas on file placement must surface as a 1-line BQ with "Architect design §X says Phase Y; invocation adds to Phase Z; my read: <Architect wins/invocation wins + reason>". Do not silently resolve.
- (c) React concurrency-gate patterns for synchronous double-call idempotency need a `useRef` mirror, not `useState` closure. Codify in `~/.claude/agents/engineer.md` §Implementation Standards § React / TypeScript as a reusable snippet (`inFlightRef.current + setInFlight(true)` pattern).

### Code Review R1 Remediation (2026-04-22)

Code Reviewer R1 findings resolved (4 flags + 1 BQ-ruled AC amendment):

- **C-1 (diary.json legacy-merge K-005 coverage):** `frontend/public/diary.json` legacy entry `text` extended with `" Later, a shared UnifiedNavBar unified headers across all five routes."` — K-005 (UnifiedNavBar) now represented in the Phase-0 summary; word count 95/100 (within 50–100 bound); title/date unchanged. Also updated AC-024-LEGACY-MERGE header per design: "covers Phase 1/2/3 + Deployment + Codex Review Follow-up + UnifiedNavBar".
- **C-2 (PM-README recruiter-facing content):** Inserted flat entry at `diary.json` array index 1 (post-K-031, pre-K-023) — `title: "README Future Enhancements roadmap"`, `date: "2026-04-21"`, no `ticketId` key (PM-level non-ticket milestone). Legitimizes the previously-dropped milestone under the amended AC.
- **W-1 (useDiary.ts non-Error catch safety):** `.catch((err: Error) =>` widened to `.catch((err: unknown) =>` with `instanceof ZodError` first (generic `"Invalid diary data format"` message to avoid leaking validation internals), then `instanceof Error` (passes `err.message`), else `"Unknown error loading diary"`. Imported `ZodError` from `zod`.
- **W-2 (useDiary.ts validation error generic message):** Addressed as part of W-1 — ZodError path maps to generic `"Invalid diary data format"`, no schema path / field name leaked to UI.
- **AC-024-LEGACY-MERGE amendment (Option B, per PM ruling on BQ-ENG-K024-R1-03):** Amended AC to pin legacy entry by `title` literal (not by "exactly 1 key-absent"). Other `ticketId`-key-absent entries now explicitly permitted for PM-level non-ticket milestones. Schema still enforces `ticketId: ""` illegal via `^K-\d{3}$` regex. Test suite `diary.legacy-merge.test.ts` rewrote 5 finders (`e.ticketId === undefined` → `e.title === LEGACY_TITLE`) and added a 6th test asserting non-legacy key-absent entries are permitted. AC header updated L159: "Phase-0 legacy-merge entry pinned by title literal".

**Deferred (per invocation):**
- W-3 breadth (Phase 3 `timelinePrimitives` consumer wiring) — Phase 3 scope, not this PR.
- W-4 breadth — Tech Debt log.
- W-2 depth (zod 4.x namespace migration) — no-op accepted, zod 3.x API stable.
- W-3 depth (Engineer persona authority for AC self-edit) — filed as separate BQ to PM (Engineer persona currently forbids AC edits without PM rule; remediation required explicit BQ + PM ruling, which worked correctly).

**Gate results:** `tsc --noEmit` exit 0; `vitest run` 81/81 pass (legacy-merge = 6); `playwright test` 190 pass / 1 skipped / 0 fail.

### Engineer (Phase 3)

**Pre-implementation Q&A Log:**

1. **K-023 Sacred (Homepage marker `borderRadius: 0px`) vs design §6.3 `<DiaryMarker>` reuse vs visual-spec `cornerRadius: 6` — contradictory.** Design §0.2 lists Homepage marker radius 0 as a **locked invariant** (Sacred > dedup recommendation). §9.1 dedup is soft; Sacred is bright-line. Self-decided as implementation detail: `DiaryMarker.tsx` = /diary-only primitive with `cornerRadius: 6`; `DevDiarySection.tsx` keeps inline marker (preserves radius 0 + `topInset: 8` K-023 Sacred). `timelinePrimitives.ts` still feeds color/size/leftInset to both — partial sharing, different render. Same treatment for rail (K-028 always-visible on Homepage; `DiaryRail` is `hidden sm:block` on /diary only; DevDiarySection keeps inline rail). Documented in both `DiaryMarker.tsx` / `DiaryRail.tsx` / `DevDiarySection.tsx` comment blocks.

2. **T-T4 rail-height assertion (design §6.5 vs initial impl):** My first assertion (`rail.height >= (first entry top → last entry bottom)`) contradicted the spec: visual-spec encodes `top:40 / bottom:40` insets so rail is intentionally inset past first/last marker centers. Corrected assertion asserts only "rail exists + right bg + width + non-zero height + rail vertically inside timeline bounds" — matches design intent.

**Migration Content-Preservation Gate (per design §9.2 + Engineer mandatory):**

| Deleted behavior | Old file / test | Covered by (new file / test) |
|------------------|-----------------|------------------------------|
| Accordion open/close toggle | `MilestoneSection.tsx` | Design §0.2 Sacred says "accordion removed" — NOT preserved. T-T1/T-T2/T-T3 negative assertions (no `details/summary` / `divide-y` / `milestone` class). |
| 2-layer entry (date + text) | `DiaryEntry.tsx` | Replaced by 3-layer (title+date+body) `DiaryEntryV2.tsx` — AC-024-ENTRY-LAYOUT T-E1..T-E6. |
| `flex-col sm:flex-row` responsive wrap | `DiaryEntry.tsx` | `DiaryEntryV2.tsx` is flex-column on all viewports by design; mobile safety via `break-words` on body — asserted by T-E* (body font catch-all) + T-L5 (long-message no overflow). |
| `border border-ink/10` wrapper | `MilestoneSection.tsx` | No wrapper per flat timeline design (§6.1). T-T3 negative asserts wrapper class absent. |
| `divide-y divide-ink/5` between entries | `MilestoneSection.tsx` | No dividers per flat design. T-T2 negative asserts class absent. |
| Mobile 375/390/414 no-overlap (TC-001..003 `diary-mobile.spec.ts`) | `diary-mobile.spec.ts` AC-027-NO-OVERLAP | T-C5 (mobile 390 no horizontal overflow) + T-L5 (long-message break-words no overflow) + `pages.spec.ts` AC-028-DIARY-ENTRY-NO-OVERLAP (mobile 375, preserved Sacred). |
| Mobile text readability (TC-004..006) | `diary-mobile.spec.ts` AC-027-TEXT-READABLE | T-E1 (DOM order title/date/body) + T-E6 (body font catchall for readability) + T-L5 (long error message readable + Retry visible). |
| Desktop accordion aria-expanded (TC-007) | `diary-mobile.spec.ts` AC-027-DESKTOP-NO-REGRESSION | N/A — accordion DOM gone by design §0.2 Sacred. T-T1 negative assertion covers. |
| Old AC-DIARY-1 three accordion tests | `pages.spec.ts` L78–121 | Rewritten in-place: (1) hero title + entry visible, (2) negative on `details/summary`/`divide-y`/`milestone`, (3) Load more visible when entries>5. |
| K-028 Sacred `data-testid="diary-entry-wrapper"` + 3-marker + 20×14 | `pages.spec.ts` AC-023-DIARY-BULLET + AC-028-* | **Preserved unchanged** — `DevDiarySection.tsx` kept inline marker+rail; all 5 Sacred specs pass. |

**Design Doc Checklist verification (§10 Phase 3 files row-by-row):**

| # | Design doc row | Status |
|---|----------------|--------|
| 1 | `DiaryPage.tsx` REWRITE → Hero + Timeline + LoadMore + pagination | ✓ done (uses `useDiary` + `useDiaryPagination`) |
| 2 | `DiaryTimeline.tsx` REWRITE → `<ol role="list">` + `<DiaryRail>` + `<li><DiaryEntryV2>` | ✓ done |
| 3 | `DiaryEntry.tsx` DELETE | ✓ done |
| 4 | `MilestoneSection.tsx` DELETE | ✓ done |
| 5 | `DiaryHero.tsx` ADD | ✓ done |
| 6 | `DiaryEntryV2.tsx` ADD | ✓ done |
| 7 | `DiaryRail.tsx` ADD | ✓ done |
| 8 | `DiaryMarker.tsx` ADD | ✓ done (with K-023 Sacred deviation documented; DevDiarySection keeps inline marker) |
| 9 | `DiaryLoading.tsx` ADD | ✓ done |
| 10 | `DiaryError.tsx` ADD | ✓ done |
| 11 | `DiaryEmptyState.tsx` ADD | ✓ done |
| 12 | `LoadMoreButton.tsx` ADD | ✓ done |
| 13 | `timelinePrimitives.ts` ADD | (already present from Phase 1+2 as additive constants — §10 row honored) |
| 14 | `DevDiarySection.tsx` MOD (import shared primitives) | ✓ done — imports `RAIL`/`MARKER` constants from `timelinePrimitives.ts`; keeps inline render to preserve K-023 Sacred + K-028 Sacred |
| 15 | `diary-mobile.spec.ts` DELETE | ✓ done |
| 16 | `pages.spec.ts` MOD (AC-DIARY-1 3-test rewrite) | ✓ done |
| 17 | `diary-page.spec.ts` ADD (35 tests per ticket L478 supplementation) | ✓ done — all 35 pass |
| 18 | `diary-homepage.spec.ts` ADD (5 tests per ticket AC-024-HOMEPAGE-CURATION) | ✓ done — all 5 pass |
| 19–26 | 8 fixtures under `_fixtures/diary/` | ✓ all 8 present |

**Verification Checklist:**

- [x] `npx tsc --noEmit` — exit 0
- [x] `npx vitest run` — 81/81 pass
- [x] `npx playwright test` — 223 pass / 1 skipped / 0 fail (full suite)
- [x] Sitewide dark-class scan: all hits limited to `/app` isolated route; no body-layer CSS change made in K-024
- [x] Route Impact Table cross-check: design §8 says only `/` + `/diary` affected (schema change, not CSS); confirmed
- [x] K-028 + K-023 Sacred preserved: `pages.spec.ts` AC-023-DIARY-BULLET + AC-028-MARKER-COORD-INTEGRITY + AC-028-MARKER-COUNT-INTEGRITY + AC-028-DIARY-RAIL-VISIBLE + AC-028-DIARY-EMPTY-BOUNDARY all green
- [x] E2E Spec Logic Self-check: target scope uses `container.getByRole()` not `page.getByRole()` where needed; assertions FAIL in before state (T-T1..T-T3 negative assertions require accordion removed to pass); no `waitForTimeout` — uses `toHaveCount` / `toBeVisible` / `toHaveCSS` only
- [x] Computed Style Assertion Rule: all `toHaveCSS` assertions use computed values; no hardcoded px/hex — all pulled from `K-024-visual-spec.json` via `hexToRgb` helper
- [x] Migration Content-Preservation Gate: table above maps every deleted behavior to new coverage or documents "NOT preserved per design"
- [x] Worktree init check: worktree `node_modules/` already present from Phase 1+2 run; no reinstall needed
- [x] Vite cache cleared before Playwright re-run: `pkill -f vite && rm -rf frontend/node_modules/.vite` applied twice (once post-T-T4 failure, once final)

**Scope boundary issues found:**

1. **Playwright ESM loader + JSON import attribute incompatibility:** `import spec from '../../docs/designs/K-024-visual-spec.json'` works in Vite + tsc bundler mode but fails under Playwright's Node-ESM loader (`TypeError: Module "...json" needs an import attribute of type "json"` on Node ≥20). Switched both spec files to `readFileSync` + `JSON.parse` sync pattern at module top level — semantically identical (the file is static). Documented inline in both specs; no scope creep.

2. **T-T4 initial assertion contradicted design §6.5 geometry.** First pass: `rail.height >= (first entry top → last entry bottom)`. Actual: rail has 40px top + 40px bottom insets per visual-spec → rail height = `<ol>` height − 80, so assertion false by design. Rewrote to assert "rail exists + non-zero height + rail bounds inside timeline bounds". Should have dry-run the computed values via `page.evaluate` per Engineer Computed Style Assertion Rule before writing `toBeGreaterThanOrEqual` — logged as next-time.

**Next time improvement:**

- (a) Before writing any geometric `toBeGreaterThan*` / `toBeLessThan*` assertion against computed `boundingBox()` values, dry-run both LHS and RHS in the spec's browser context via `page.evaluate` and log actual numbers — never write the assertion from design-prose imagination. This is already in Engineer persona §"Computed Style Assertion Rule"; I skipped it for T-T4 and learned again.
- (b) Playwright-specific ESM loader constraints (JSON `with { type: 'json' }` attribute) differ from Vite/tsc bundler mode — when introducing a new `*.json` import under `frontend/e2e/`, prefer `readFileSync` + `JSON.parse` from day one, especially for Node 20+ toolchains.
- (c) When a design spec has a K-XXX Sacred row AND a "shared primitive" recommendation that visually differ (like K-023 borderRadius 0 vs visual-spec cornerRadius 6), resolve via **partial primitive sharing** (const tokens via `timelinePrimitives.ts`, separate render components) instead of forcing a single component. Document the deviation in-code AND in ticket retrospective — done here for K-023 + K-028 + §9.1 deviation.

### Code Review R1 Phase 3 — Two-Layer (2026-04-22)

**Layer 1 breadth (`superpowers:code-reviewer`):** 0 Critical, 4 Important, 5 Minor. Findings:
- I-1: `DiaryMarker` has `hidden sm:block` but no Playwright assertion that marker is actually `display:none` at mobile viewport (< 640px); `toHaveCount` passes even when elements are hidden.
- I-2: Rail visibility asymmetry — `/diary` `DiaryRail` carries `hidden sm:block`, Homepage rail does not; no `/diary` mobile rail-hidden assertion in spec suite.
- I-3: T-D9 rapid-double-click uses `diary-double-click.json` with 10 entries; first click goes 5→10 → `hasMore=false` → Load-More button unmounts → second click hits no element → count = 10 regardless of `useRef` gate. Test is tautological; gate is not actually verified (elevated to **Important**).
- I-5: AC-024-ENTRY-LAYOUT catchall claims all entry-title / entry-date / entry-body font properties covered, but T-E6 omits `entry-date letterSpacing` and `entry-body fontWeight / lineHeight` — catchall language promises more than the test verifies.

**Layer 2 depth (`reviewer.md` Agent):** 1 Critical, 2 Important, 7 Minor. Findings:
- **D-1 Critical (PM AC self-contradiction):** `AC-024-HOMEPAGE-CURATION` 0-entry clause said "Homepage Diary section entirely hidden (do not render section heading, rail, marker)" while **K-028 Sacred `AC-028-DIARY-EMPTY-BOUNDARY` locks** "0 entries → `DEV DIARY` heading remains rendered". Engineer implemented per Sacred (correct); a Playwright assertion derived from AC-024 would fail `#hpDiary toHaveCount(0)`. K-028 Sacred is cross-ticket binding (`feedback_ticket_ac_pm_only.md` + AC-024-REGRESSION lists K-028 as Sacred). AC is PM-owned; Engineer cannot edit — only BQ back. Found only at depth review, after ~1500 LOC Phase 3 landed.
- **D-2 Important:** T-L4 missing `toBeDisabled()` assertion during refetch race — `AC-024-LOADING-ERROR-PRESERVED` L372 clause explicitly specified "Retry button must be disabled while refetch in-flight"; existing spec only asserts Retry visible, not disabled.
- **D-4 Minor:** `data-testid="diary-main"` emitted by `DiaryPage.tsx` not in design §6.4 testid contract table (Architect deliverable gap).
- §7.3 test count says 33; actual shipped = 40 (7 delta from D-9 double-click + D-10/D-11 fixture variants + homepage-5-test-suite spec shifts). Needs Architect doc update.

**PM Ruling (2026-04-22):**
- **D-1 Option (a) — rewrite AC to align with K-028 Sacred**: AC-024-HOMEPAGE-CURATION 0-entry clause rewritten above (L247–252 in this file) to "heading retained per K-028 Sacred; rail and marker not rendered; no empty-state message". Playwright pattern: `getByText('DEV DIARY', { exact: true }).toBeVisible() + diary-entry-wrapper/rail/marker toHaveCount(0)`. K-028 Sacred immutable (cross-ticket binding); PM owns AC → PM amends AC text.
- **Bug Found Protocol step 3 (PM persona hardening)**: new hard gate added to `~/.claude/agents/pm.md` §"Prerequisites for releasing Engineer" → **AC ↔ Sacred cross-check (mandatory)**: PM must grep own ticket `AC-*-REGRESSION` + every dependency ticket's Sacred before committing new/revised AC; output 1-line gate evidence (`AC vs Sacred cross-check: ✓ no conflict` or `⚠️ resolved via Option (a/b/c)`) in release document. Memory file `feedback_pm_ac_sacred_cross_check.md` written + MEMORY.md index updated.
- **I-3 Option (a) — fixture enlargement**: change `diary-double-click.json` from 10 to 11 entries (or reuse existing `diary-eleven.json`); T-D9 asserts count=10 (gated) vs ungated count=11; dry-run verified that removing gate from `useDiaryPagination.ts` flips the test to red.
- **Bug Found Protocol step 3 (Engineer persona hardening)**: new hard gate added to `~/.claude/agents/engineer.md` adjacent to E2E spec logic self-check → **Concurrency-Gate Test Dry-Run (added K-024 2026-04-22)**: any test asserting `useRef`/debounce/throttle/in-flight gate must run a `comment-out gate → re-run → still-pass` dry-run; still-pass = tautological = rewrite fixture until `gate removed → test red`. Memory file `feedback_engineer_concurrency_gate_fail_dry_run.md` written + MEMORY.md index updated.
- **R2 fix batch bundled**: Engineer R2 agent to execute (a) I-3 fixture change + assertion rewrite; (b) D-2 T-L4 `toBeDisabled()` add; (c) I-1 DiaryMarker mobile `display:none` assertion; (d) I-2 `/diary` mobile rail `hidden` assertion; (e) I-5 ENTRY-LAYOUT catchall additions — entry-date letterSpacing + entry-body fontWeight/lineHeight via `toHaveCSS`; (f) D-4 / M-5 — Architect append `diary-main` testid to design §6.4 + §7.3 count 33→40 sync.
- All 7 Minor findings + remaining 2 Important batched into R2 Engineer pass; no second-review-round required for Minors.

### Engineer R2 (Code Review R1 fix batch, 2026-04-22)

**Scope executed** (six items per PM R2 ruling):
- **(a) I-3 fixture enlargement + T-D9 assertion rewrite.** `diary-double-click.json` 10 → 11 entries; T-D9 uses `page.evaluate` + `btn.dispatchEvent(new MouseEvent('click'))` twice in one JS tick to dispatch both clicks inside a single microtask window (Playwright's default `loadMore.click()` actionability wait hides the race by serializing clicks around the React `disabled` prop flip). Inline comment records the dry-run.
- **(b) D-2 T-L4 `toBeDisabled()` during in-flight refetch.** Required a production-code change in `useDiary.ts`: removed eager `setError(null)` from `fetchDiary`; error now clears only on successful resolve. Without this, `{error && <DiaryError…/>}` unmounted the Retry button when Retry was clicked (because `error=null + loading=true`), making `toBeDisabled()` trivially unobservable. New T-L4 uses a hold-open fetch promise to guarantee the in-flight window is observable, asserts `retry.toBeVisible() + toBeDisabled()` during the window, then releases and asserts error-gone post-resolve.
- **(c) I-1 + (d) I-2 combined into T-C6.** New test at 390px viewport asserts `DiaryMarker` + `DiaryRail` both computed `display: none` on `/diary`. Dry-run verified: removing `hidden sm:block` from `DiaryMarker.tsx` → T-C6 fails; restoring → passes.
- **(e) I-5 ENTRY-LAYOUT catchall extension.** Added three `toHaveCSS` assertions to T-E6: entry-date `letter-spacing: 1px`, entry-body `font-weight: 400`, entry-body `line-height: 27.9px` (1.55 × 18, `.toFixed(1)` to drop JS IEEE-754 residue `27.900000000000002`). Surfaced a production mismatch on entry-date: `tracking-wide` (0.025em = 0.3px at 12px font) was off-spec vs visual-spec `letterSpacing: 1`. Fixed `DiaryEntryV2.tsx` to `tracking-[1px]`.
- **(f) D-4 + M-5 design doc sync.** Appended `diary-main` row to §6.4 testid contract table (maps to `<main role="main">` landmark in `DiaryPage.tsx`). §7.3 shipped test count updated 33 → **41** (PM's estimate of 40 was off by one — actual homepage shipped 5 tests, not 4, due to the Phase 3 0-entry K-028 Sacred split; design §7.3 self-check now reflects `5 + 9 + 6 + 6 + 3 + 6 + 6 = 41`).

**Concurrency-Gate Dry-Run observation table** (new persona hard gate, K-024 2026-04-22):

| Scenario | Click mechanism | `useRef` gate state | Wrapper count | Test result |
|---|---|---|---|---|
| Original (R1 baseline, 10 entries, `Promise.all([click, click.catch…])`) | Playwright `click()` with actionability wait | Present | 10 (tautological — also 10 without gate) | green, tautological |
| After fixture 10→11 only | Playwright `click()` with actionability wait | Present | 10 | green |
| After fixture 10→11 only | Playwright `click()` with actionability wait | **Commented out** | 10 (`disabled` prop still absorbed second click) | green — STILL tautological |
| After fixture 10→11 + `dispatchEvent × 2` | Raw `MouseEvent` in single microtask | Present | 10 | green |
| After fixture 10→11 + `dispatchEvent × 2` | Raw `MouseEvent` in single microtask | **Commented out** | **11** | **red** ✓ |

Discovery: fixture enlargement alone (per PM R2 (a)) was NOT sufficient to discriminate the gate, because the React state `inFlight` + `disabled` prop also blocked the second Playwright click (Playwright waits for `enabled` between the two `click()` calls, giving the microtask time to flush). The dispatchEvent-in-single-tick pattern is required to actually race both handlers in the same microtask before React re-renders. Both defenses (`useRef` and `disabled` prop) are present, but only the `useRef` is load-bearing under true synchronous double-dispatch; the `disabled` prop is the softer, Playwright-visible defense.

**Production code changes made** (minimal, per design doc contracts):
- `frontend/src/hooks/useDiary.ts` — removed eager `setError(null)` from `fetchDiary`; added `setError(null)` inside the success `.then()` only. Required for D-2 to be observable. Does not alter happy-path behavior; only affects the Retry → refetch state machine.
- `frontend/src/components/diary/DiaryEntryV2.tsx` — `tracking-wide` → `tracking-[1px]` on the `<time>` element. Aligns with visual-spec `entry-date.font.letterSpacing: 1`.

**Final gate:** `tsc --noEmit` exit 0; `vitest run` 81/81 pass; `playwright test` **224 pass / 1 skipped / 0 failed** (225 total, +1 from T-C6 addition).

**Next-time improvements:**
- (i) When the PM ruling states a test count ("33 → 40"), re-derive the count from `grep -c test(` at ticket-close before committing the design-doc number — don't trust the written figure blindly. I caught and corrected PM's 40 → 41 through direct enumeration, but this pattern could easily slip.
- (ii) Concurrency-gate test suites that rely on `disabled` + `useRef` should explicitly document which defense is load-bearing and which is soft, with dry-run evidence for each — otherwise future refactors may delete the redundant-looking gate and break the test guarantee in a way the suite can't catch.

### PM Summary

**Cross-role recurring issues:**
- (Placeholder — fill after Phase 4 + QA sign-off + close session)

**Process improvement decisions:**
| Issue | Responsible Role | Action | Update Location |
|---|---|---|---|
| PM AC can self-contradict dependency Sacred (D-1 Critical) | PM | AC ↔ Sacred cross-check hard gate (grep `AC-*-REGRESSION` + dependency Sacred before AC commit; 1-line gate evidence required) | `~/.claude/agents/pm.md` §Prerequisites for releasing Engineer; memory `feedback_pm_ac_sacred_cross_check.md` |
| Concurrency-gate test can pass with gate removed (I-3 Important) | Engineer | Dry-run "remove gate → test still pass?" before commit; fixture must make `gate removed → red` | `~/.claude/agents/engineer.md` §Concurrency-Gate Test Dry-Run; memory `feedback_engineer_concurrency_gate_fail_dry_run.md` |

### QA Phase 3 (Final Regression + Sign-off, 2026-04-22)

**Gate results (all green):**

| Gate | Command | Result |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | exit 0 (no errors) |
| Vitest | `npx vitest run` | **81 / 81 pass** across 12 spec files |
| Playwright E2E | `npx playwright test` (fresh Vite cache) | **224 passed / 1 skipped / 0 failed** (225 total) |
| Visual Report | `TICKET_ID=K-024 npx playwright test e2e/visual-report.ts` | 5 routes captured → `docs/reports/K-024-visual-report.html` |

Pre-Playwright hygiene: `pkill -f vite && rm -rf node_modules/.vite` applied before the E2E run — confirmed no stale module graph bias.

**Sacred regression verification (cross-ticket):**

| Sacred | Spec / Test | Present | Status |
|---|---|---|---|
| K-017 NavBar order (GitHub · Logs · Playground · Diary · About) | `navbar.spec.ts` AC-017-NAVBAR + Prediction-hidden asserts, `about.spec.ts` AC-017-NAVBAR, `pages.spec.ts` AC-017-HOME-V2 | ✓ | PASS |
| K-021 body `bg-paper` (#F4EFE5) across 4 marketing routes | `sitewide-body-paper.spec.ts` AC-021-BODY-PAPER × 5 | ✓ | PASS |
| K-021 Bodoni Moda / Newsreader / Geist Mono font-family | `sitewide-fonts.spec.ts` AC-021-FONTS (font-display + font-mono) | ✓ | PASS |
| K-023 Homepage DevDiarySection marker borderRadius 0px + top 8px + 3-marker count + 20×14 + brick-dark color | `pages.spec.ts` AC-023-DIARY-BULLET × 3 + AC-023-STEP-HEADER-BAR × 3 + AC-023-BODY-PADDING × 2 | ✓ | PASS |
| K-028 `diary-entry-wrapper` 3-marker + `DEV DIARY` heading visible at 0 / 1 / N entries + 20×14 marker coord integrity + entry no-overlap | `pages.spec.ts` AC-023-REGRESSION (coord + count integrity), AC-028-SECTION-SPACING × 5, AC-028-DIARY-ENTRY-NO-OVERLAP × 2, AC-028-DIARY-RAIL-VISIBLE, AC-028-DIARY-EMPTY-BOUNDARY × 2 (0-entry heading preserved + 1-entry marker 20×14) | ✓ | PASS |

All 21 Sacred-bearing test descriptions enumerated via `npx playwright test --list` filter; each ran within the 224-pass batch.

**Pencil Visual Match Report (MCP fallback — see below):**

| Route | Pencil Frame | Visual Match | Notes |
|---|---|---|---|
| `/diary` (desktop 1440) | `wiDSi` | ✅ | Hero title "Dev Diary" Bodoni italic + hero divider 1px charcoal + italic Newsreader subtitle; 1px charcoal rail with 40px top/bottom insets; 20×14 brick-dark (#9C4A3B) markers with cornerRadius 6; entry 3-layer order title (Bodoni italic 18px bold #1A1814) / date (mono 12px #6B5F4E letterSpacing 1px) / body (Newsreader italic 18px #2A2520 lineHeight 27.9px = 1.55×18); em-dash U+2014 delimiter confirmed in every ticket title ("K-022 — About page…"); content maxWidth 1248px; all 8 wiDSi roles (hero-title / hero-divider / hero-subtitle / rail / marker / entry-title / entry-date / entry-body) accounted for in DOM + spec |
| `/diary` (mobile 390) | `wiDSi` (mobile breakpoint) | ✅ | Rail hidden (computed `display: none`), markers hidden, no horizontal overflow (`scrollWidth ≤ innerWidth`), entry body wraps via `break-words`; mobile title 16px / body 16px scale applied per design |
| `/` Homepage DevDiarySection (desktop 1440) | `N0WWY` | ✅ | DEV DIARY heading visible; 3-marker count; marker `borderRadius: 0px` preserved (K-023 Sacred, inline render override of shared `<DiaryMarker>` per design §9.1 deviation); marker 20×14 brick-dark; rail renders because entries.length ≥ 2 (§4.3.1); "READ FULL LOG →" link visible; NavBar K-017 order + HomeFooterBar present; Hero ↔ ProjectLogic ↔ DevDiary section gaps per AC-028-SECTION-SPACING |

Screenshots captured: `/tmp/k024-diary-desktop-1440.png`, `/tmp/k024-diary-mobile-390.png`, `/tmp/k024-home-desktop-1440.png`. Visually inspected against visual-spec.json values + Pencil .pen frame IDs listed in frontmatter.

**Pencil MCP offline fallback declaration (mandatory, per QA persona 2026-04-21 rule):**

The Pencil MCP server instructions block was attached to this session but the `mcp__pencil__get_screenshot` / `mcp__pencil__batch_get` tools were not callable — tool registration reported as unavailable. Per the three-step offline fallback:

1. **Positive delta grep / schema parity:** `docs/designs/K-024-visual-spec.json` top-level `frames[]` enumerates 2 frames × (8 + 5) = 13 role entries; grepped implementation (`frontend/src/components/diary/Diary*.tsx` + `frontend/src/pages/DiaryPage.tsx` + `frontend/src/components/home/DevDiarySection.tsx`) confirms every role has a corresponding DOM node with canonical `data-testid` (diary-rail / diary-marker / diary-entry / diary-entry-wrapper / diary-main) AND canonical CSS (Bodoni_Moda italic 18px 700 / Newsreader italic 18px lh 1.55 / Geist_Mono 12px letterSpacing 1px / #9C4A3B bg / #2A2520 rail / 20×14 cornerRadius 6 on /diary, cornerRadius 0 on Homepage per Sacred deviation). Raw-count parity: 8 wiDSi roles ↔ 8 Playwright-observable selectors; 5 N0WWY roles ↔ 5 DevDiarySection inline render sites.
2. **Structural count cross-check:** visual-spec frame count matches ticket frontmatter `visual-spec: docs/designs/K-024-visual-spec.json` + design doc §0.2 preamble (2 frames: `wiDSi` /diary + `N0WWY` Homepage DevDiarySection); no missing or extra frame. em-dash U+2014 present in both `entry-title.textPattern` (`K-XXX — <title>`) AND in production `DiaryEntryV2.tsx` L21 + `DevDiarySection.tsx` L122.
3. **Explicit gap registration:** **Visual layer not verified via Pencil MCP screenshot comparison in this session (MCP tool calls unavailable; grep + dev-server screenshot substitute applied).** This is a Known Gap registered by QA. The dev-server screenshots confirm the rendered output matches the expected visual-spec values role-by-role; direct pixel-level Pencil frame comparison was not performed. PM ruling on whether this Known Gap blocks sign-off → **not blocking per available evidence** (all grep + spec-value cross-checks positive; visual report HTML also shows implementation matches the intent; previous K-024 Phase 1+2 sign-off gates accepted the same substitute without regression).

**R2 fix batch verification (six items):**

| R2 item | Location | Verified |
|---|---|---|
| (a) T-D9 count=10 on 11-entry fixture via `dispatchEvent × 2` in single tick + inline dry-run comment | `diary-page.spec.ts` L194-232, cites "Dry-run verified 2026-04-22 (K-024 R2 I-3)" | ✓ |
| (b) T-L4 `toBeDisabled()` on Retry during in-flight refetch | `diary-page.spec.ts` L668 "T-L4: Retry is enabled while error + !loading; disabled during in-flight refetch" | ✓ |
| (c) T-C6 DiaryMarker `display: none` at 390px on /diary | `diary-page.spec.ts` L572 + L589 `expect(markers.first()).toHaveCSS('display', 'none')` | ✓ |
| (d) T-C6 DiaryRail `display: none` at 390px on /diary | `diary-page.spec.ts` L592 `expect(railEl).toHaveCSS('display', 'none')` | ✓ |
| (e) T-E6 entry-date letterSpacing 1px + entry-body fontWeight 400 + lineHeight 27.9px via `toHaveCSS` sourced from visual-spec | `diary-page.spec.ts` L426-464, all three assertions present, computed from `entryDate.font.letterSpacing` / `entryBody.font.weight|lineHeight|size` | ✓ |
| (f) Design doc §6.4 `diary-main` row + §7.3 count 33 → 41 | `K-024-diary-structure.md` L625 (diary-main testid row) + L881–910 (7.3 "Playwright new test total: 5 + 9 + 6 + 6 + 3 + 6 + 6 = 41"; "actual: 36 + 5 = 41 ✓ as of R2 2026-04-22") | ✓ |

**visual-spec.json consumption verification:**

- `frontend/e2e/diary-page.spec.ts` L1–12: imports spec via `readFileSync + JSON.parse` (Playwright Node-ESM-safe pattern per Engineer note on ESM loader constraint), then destructures `entryTitle`, `entryDate`, `entryBody`, `rail`, `marker`, `heroTitle`, `heroSubtitle`, `heroDivider` role objects. All `toHaveCSS` assertions (font-family / size / style / weight / color / letterSpacing / lineHeight / cornerRadius) compute expected values from spec — no hardcoded px / hex in the spec file.
- `frontend/src/components/diary/timelinePrimitives.ts` exports `RAIL`, `MARKER`, `ENTRY_TYPE` const objects whose values equal `K-024-visual-spec.json` `wiDSi` + `N0WWY` `sharedPrimitives`; consumers `DiaryRail.tsx`, `DiaryMarker.tsx`, `DiaryEntryV2.tsx`, and `DevDiarySection.tsx` all import from this file (verified via `grep -l "timelinePrimitives"`).

**Dev-server regression screenshots (mobile + desktop):**

- `/tmp/k024-diary-desktop-1440.png` — /diary desktop 1440: hero + rail + 20×14 rounded markers + 3-layer entries all aligned; em-dash in titles; content within 1248px maxWidth.
- `/tmp/k024-diary-mobile-390.png` — /diary mobile 390: no rail, no markers, no horizontal overflow, entry body wraps cleanly.
- `/tmp/k024-home-desktop-1440.png` — Homepage: NavBar + Hero + ProjectLogic + DevDiarySection (3 square markers + rail + "READ FULL LOG →") + HomeFooterBar all present.

**Visual report:** `docs/reports/K-024-visual-report.html` generated with `TICKET_ID=K-024` (all 5 routes captured, 5/5 pass).

**Sign-off verdict: PASS**

All six gate conditions green:
- [x] Full gate (tsc 0 / Vitest 81/81 / Playwright 224 pass / 1 skipped / 0 fail)
- [x] Sacred regression (K-017 + K-021 + K-023 + K-028, all 21 Sacred-bearing tests green)
- [x] Pencil visual match report (2 frames, both routes ✅ via grep-parity + dev-server screenshot; MCP offline Known Gap explicitly declared, non-blocking)
- [x] visual-spec.json consumption verified in spec + components (`readFileSync + JSON.parse` pattern; `timelinePrimitives.ts` const re-export)
- [x] R2 fix items (a)-(f) all present
- [x] Mobile + desktop regression screenshots visually correct

Ticket ready for PM step 47 (deploy + Deploy Record + close). QA does **not** modify any production code, AC text, diary.json, or ticket status; hands off to PM.

**Next-time improvements (codified into per-role log):**

1. When Pencil MCP tool calls are unavailable mid-session, execute the three-step offline fallback immediately and declare the Known Gap in the sign-off table — do not silently omit visual verification. The persona rule from 2026-04-21 held up in practice this session; no persona edit needed.
2. The visual-report.ts `TICKET_ID` env var is easy to forget; the existing persona rule already catches this. Confirmed this session ran `TICKET_ID=K-024` explicitly → generated `K-024-visual-report.html` (not `K-UNKNOWN`). Full-suite runs without explicit env write `K-UNKNOWN-visual-report.html`; harmless but noisy — consider a Playwright config default in future ticket.
3. For Phase-3 sign-offs that include a production-code change from the R2 fix batch (here: `useDiary.ts` setError ordering + `DiaryEntryV2.tsx` tracking fix), QA should explicitly spot-check that those production changes are covered by the new test assertions (in this session: T-L4 covers the setError change, T-E6 covers the letterSpacing change). Both covered. Add to QA checklist as formal row.

---

## Deploy Record

**Deploy date/time:** 2026-04-22 (Asia/Taipei)
**Git SHA (worktree HEAD at deploy):** `e66aa6c`
**Hosting URL:** https://k-line-prediction-app.web.app
**Bundle:** `dist/assets/index-Dp0-Msfc.js` — md5 `47cdc1e66fdc7f51c356ddc62de827b4` (dist ↔ live parity ✓)
**Deploy command:** `firebase deploy --only hosting` (from worktree root `.worktrees/k024`)
**Firebase output:** `✔ hosting[k-line-prediction-app]: release complete` — 4 new files uploaded / 8 total.

**Executed-probe verification (live bundle + live diary.json):**

```
$ JS_URL=$(curl -sL https://k-line-prediction-app.web.app/ | grep -oE 'assets/index-[^"]+\.js' | head -1)
Bundle: assets/index-Dp0-Msfc.js

$ curl -sL "https://k-line-prediction-app.web.app/$JS_URL" | grep -oE "diary-main|diary-entry-wrapper|diary-hero|diary-entry" | sort | uniq -c
   1 diary-entry
   1 diary-entry-wrapper
   1 diary-main

$ curl -sL https://k-line-prediction-app.web.app/diary.json | python3 -c "..."
count: 7
has em-dash in title (ticketId present): 5
first: {'ticketId': 'K-031', ...}
```

**K-024-specific identifiers confirmed live:**
- `diary-main` testid (K-024 new page wrapper, `/diary` V2 layout) ✓
- `diary-entry` testid (K-024 `DiaryEntryV2` component) ✓
- `diary-entry-wrapper` testid (K-024 / K-028 Sacred — Homepage 0-entry placeholder guard) ✓
- Flat schema live: 7 entries, 5 with `ticketId` (K-024 AC-024-SCHEMA shape on live CDN) ✓
- First entry is latest (K-031 2026-04-21), Homepage-curation ordering correct ✓

**Status:** Live — K-024 end-to-end landed on production.
