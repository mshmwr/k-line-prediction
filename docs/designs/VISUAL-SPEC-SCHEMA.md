# Visual Spec Schema — K-Line Prediction

**Purpose:** Single source of truth for `docs/designs/K-XXX-visual-spec.json` structure, role enum, and consumption protocols.

**Owner:** Designer (`~/.claude/agents/designer.md`)

**Consumers (hard gate — must Read before task execution):** Architect, Engineer, QA

**Established:** 2026-04-22, as part of K-024 Designer handoff contract. Applies to every ticket with a `.pen` file from K-024 onward.

---

## JSON Schema (fixed)

```json
{
  "ticketId": "K-XXX",
  "sourceFile": "frontend/design/<file>.pen",
  "generatedAt": "YYYY-MM-DD",
  "generatorNote": "optional: one-liner on how this was produced (e.g. MCP path, fallback, one-off proxy)",
  "frames": [
    {
      "id": "<Pencil node id>",
      "name": "<human label>",
      "route": "/xxx  |  shared",
      "tokens": {
        "background": "#RRGGBB",
        "frameWidth": 1440,
        "contentWidth": 1248,
        "bodyPadding": [top, right, bottom, left],
        "bodyGap": 56,
        "heroGap": 16
      },
      "components": [
        {
          "role": "<enum value — see Role Enum below>",
          "nodeId": "<Pencil node id>",
          "text": "<literal string, verbatim from .pen (if text component)>",
          "textPattern": "<template if text is dynamic, e.g. 'K-XXX — <title>'>",
          "textDelimiter": "<literal char description if pattern uses one, e.g. 'em-dash (U+2014, single-space each side)'>",
          "font": {
            "family": "<verbatim from Pencil>",
            "style": "italic | normal",
            "size": 17,
            "weight": 700,
            "lineHeight": 1.05,
            "letterSpacing": 1
          },
          "color": "#RRGGBB",
          "layout": {
            "width": 900,
            "height": 140,
            "x": 92,
            "y": 0,
            "gap": 20,
            "padding": [0, 0, 0, 0]
          },
          "shape": {
            "cornerRadius": 6,
            "size": [20, 14],
            "position": [20, 10]
          },
          "textGrowth": "fixed-width | auto",
          "examples": ["optional literal samples from .pen"],
          "note": "optional clarifier"
        }
      ],
      "entryLayoutContract": {
        "entryFrameHeight": 140,
        "entryFrameWidth": 1248,
        "entryVerticalStepY": 160,
        "entryCount": 5,
        "note": "for list-of-entries frames only"
      }
    }
  ],
  "crossFrameConsistency": {
    "sharedPrimitives": ["list of roles shared across frames"],
    "rule": "when any shared primitive value changes in one frame, the other frame must be updated in the same batch_design call. Single-side drift = Bug Found Protocol trigger."
  }
}
```

### Field rules (strict)

- Only fields present in the Pencil frame — never fabricate values or infer from "usual defaults"
- Text fields must be **literal copy** from `.pen`, not paraphrased (em-dash U+2014 vs hyphen vs middle-dot matters; a description misquote caused K-024 root cause)
- `color` in `#RRGGBB` hex; `font.family` verbatim from Pencil string; sizes in px (no unit suffix)
- `role` must be in enum below — if a component doesn't fit, follow Enum Extension Protocol (no self-extension)
- One JSON per ticket (not per frame); bundle all frames in `frames[]`
- `.pen` updates → must re-run export and overwrite JSON; drift between `.pen` and JSON = Bug Found Protocol trigger

---

## Role Enum

Visual-semantic categories (not implementation terms). Each role maps to a typical HTML element but the mapping is a guideline, not a contract — Engineer may render `hero-title` as `<h1>` or `<h2>` depending on page hierarchy.

| Role | Semantics | Typical HTML | Example |
|------|-----------|--------------|---------|
| `hero-title` | Page-level headline, top of frame | `<h1>` | `"Dev Diary"` |
| `hero-divider` | Horizontal rule separating title and body | `<hr>` or `border-bottom` | 1px line below hero-title |
| `hero-subtitle` | Page description below title | `<p class="hero-subtitle">` | tagline paragraph |
| `rail` | Vertical timeline axis | `<div class="rail">` | 1px vertical line |
| `marker` | Per-entry timeline dot or accent | `::before` or `<span>` | 20×14 rounded rect |
| `entry-title` | Per-entry headline (e.g. `"K-017 — Title"`) | `<h3>` or `<h2>` | diary entry header |
| `entry-date` | Per-entry timestamp metadata | `<time>` | `YYYY-MM-DD` |
| `entry-body` | Per-entry body text | `<p>` | entry description |
| `navbar` | Site-level top navigation | `<nav>` | top bar across all pages |
| `footer` | Site-level bottom footer | `<footer>` | contact / copyright |

Unknown role encountered at consumption (Architect/Engineer/QA read visual-spec.json and see `role: "xxx"` not in table) → **blocker back to PM**. Do not guess. Designer must update enum first (see Extension Protocol).

---

## How to Read per Role

### Architect

1. **Before writing design doc:** Read `docs/designs/K-<ticket>-visual-spec.json` AND this SCHEMA.md
2. Treat visual-spec values as source of truth for component props (font family/size/color/layout width/height)
3. If visual-spec contradicts PRD AC text → raise BQ to PM; do NOT self-arbitrate
4. New component type not covered by role enum → SQ to Designer: `"request new role 'xxx' for <use case>; semantics: <...>"` — wait for Designer enum update, do NOT self-add
5. Ticket without visual changes → verify ticket frontmatter declares `visual-spec: N/A — reason: <backend-only|docs-only|zero-visual-change>`; missing declaration = blocker to PM
6. Cross-frame sharedPrimitives: design doc must call out that changes propagate to all listed frames

### Engineer

1. **Before UI implementation:** Read visual-spec.json
2. Role → HTML mapping: consult Role Enum table above (guideline, not contract)
3. CSS values extracted **verbatim** from visual-spec:
   - `color` → Tailwind arbitrary or CSS custom property (no "close enough" hex)
   - `font.size` + `font.weight` + `font.style` → exact Tailwind/CSS values
   - `layout.width`/`height` → exact px or Tailwind arbitrary (not "w-full" unless visual-spec says `fill_container`)
4. Text strings → copy **literal** `text` field (em-dash vs hyphen matters); for `textPattern`, follow `textDelimiter` description exactly
5. Unknown role in visual-spec → **blocker to PM**, do NOT guess HTML element
6. Mismatch between visual-spec.json and Pencil screenshot → trust **visual-spec.json** (it is the SSOT); report Bug Found Protocol to Designer

### QA

1. **Before writing visual assertions:** Read visual-spec.json
2. Playwright assertions on colors/fonts/sizes use visual-spec values:
   ```ts
   const spec = JSON.parse(fs.readFileSync('docs/designs/K-024-visual-spec.json', 'utf8'));
   const heroTitle = spec.frames[0].components.find(c => c.role === 'hero-title');
   await expect(page.locator('h1').first()).toHaveCSS('color', hexToRgb(heroTitle.color));
   ```
3. Pencil screenshot = visual reference only; test expectations come from JSON
4. Text assertions use `text` or `textPattern` field verbatim — no paraphrasing, no case changes
5. Cross-frame consistency: if visual-spec `crossFrameConsistency.sharedPrimitives` lists a role, QA writes the same-value assertion on all listed frames' pages

### Designer (Owner)

1. Produce visual-spec.json at design-freeze (see designer.md §Visual Spec Output)
2. Extend enum when new component type needed — follow Enum Extension Protocol below
3. Maintain Changelog at bottom of this file
4. Enforce em-dash / literal text rule at extraction time (no paraphrasing)

---

## Enum Extension Protocol

When Architect (or another role) needs a new role not in the enum:

1. Requester opens SQ/BQ to Designer: `"request new role 'xxx' for <use case>; semantics: <what it represents>; typical HTML: <guess>"`
2. Designer reviews:
   - Prefer visual-semantic names (`entry-cta`, `aside-callout`, `breadcrumb`) over implementation terms (`card-wrapper`, `flex-container`)
   - Check if existing role suffices with a variant — if yes, reject new role, use variant prop
3. If approved, Designer makes **one single commit** with three edits:
   - `~/.claude/agents/designer.md` §Visual Spec Output role enum list — add new role
   - This SCHEMA.md Role Enum table — add row (Role / Semantics / Typical HTML / Example)
   - This SCHEMA.md Changelog — prepend one line (newest first)
4. Requester resumes design/impl using new role

Partial updates (enum list updated but SCHEMA.md not) = Bug Found Protocol trigger.

---

## Fallback: Pencil MCP Unavailable

Per designer.md §Pencil MCP Health Check: if MCP disconnected, Designer reads `.pen` as JSON and emits visual-spec.json with `generatorNote: "Pencil MCP unavailable, extracted via JSON read"`. Schema and consumer protocols remain unchanged — consumer roles do not need to know whether MCP was available.

---

## Changelog

Newest first. One line per change. Format: `YYYY-MM-DD — <added|renamed|removed|deprecated> role 'xxx': <one-line reason>`.

- 2026-04-22 — initial schema + enum (10 roles: `hero-title`, `hero-divider`, `hero-subtitle`, `rail`, `marker`, `entry-title`, `entry-date`, `entry-body`, `navbar`, `footer`); established as part of K-024 Designer handoff contract (see `docs/retrospectives/designer.md`)

---

## Related

- `~/.claude/agents/designer.md` §Visual Spec Output — authoring rules + completion gate
- `~/.claude/agents/pm.md` — Visual Spec JSON gate + staleness check before Architect handoff
- `~/.claude/agents/senior-architect.md`, `engineer.md`, `qa.md` — consumer hard gates (must Read before task execution)
- `docs/designs/K-XXX-visual-spec.json` — per-ticket instance
