# Design Doc — K-082: PM Pipeline Visibility

**Ticket:** K-082  
**Architect:** 2026-05-02  
**Status:** design-locked

---

## 1. Scope

Surface PM autonomous arbitration in three places:
1. `content/roles.json` — PM `owns` field
2. `README.md` — pipeline paragraph + replace Mermaid with `<img>` pointing to static SVG
3. `content/site-content.json` — DISCIPLINE card gains ARBITRATION field (3rd field)
4. `frontend/public/pipeline.svg` — new file, single source for README + about page
5. `frontend/src/components/about/RolePipelineSection.tsx` — swap inline SVG for `<img>` + update paragraph
6. `frontend/e2e/about.spec.ts` — update AC-058-ROLE-PIPELINE to match new `<img>` contract

No new components. No backend changes. No new routes.

---

## 2. File Change List

| File | Change | Owner |
|---|---|---|
| `content/roles.json` | PM `owns` field — add 4-source stack + 5-position text | Engineer |
| `content/site-content.json` | `aboutContent.architecture[1].fields` — append ARBITRATION `labelValue` | Engineer |
| `frontend/public/pipeline.svg` | New file — updated inline SVG extracted + annotated | Engineer |
| `frontend/src/components/about/RolePipelineSection.tsx` | Swap inline `<svg>` for `<img src="/pipeline.svg">`, update paragraph | Engineer |
| `README.md` | Replace `flowchart LR` Mermaid block with `<img>`, update pipeline paragraph | Engineer |
| `frontend/e2e/about.spec.ts` | Update AC-058-ROLE-PIPELINE assertions | Engineer |
| ~~Pencil frame JFizO~~ | No update needed — DISCIPLINE field change is content-only, identical tokens | N/A |

---

## 3. Approved Copy (Content-Alignment Gate — all approved)

### roles.json PM owns
```
Requirements, AC, phase gating; self-arbitrates at 5 named pipeline positions via 4-source priority stack (Pencil → ticket AC → memory rules → codebase); escalates to operator only when all sources are ambiguous
```

### README pipeline paragraph (replaces current line 36)
```
Automatic handoffs between roles. PM self-arbitrates at five positions in the
pipeline — before releasing Architect, before releasing Engineer, after Design
Challenge Sheet, after Reviewer, and after QA — using a four-source priority
stack: Pencil SSOT → ticket AC → memory rules → codebase. The single operator
pause point is the Content-Alignment Gate: any ticket with user-visible copy
stops at Architect → Engineer until the operator approves the verbatim draft.
```

### site-content.json DISCIPLINE card ARBITRATION field
```json
{
  "label": "ARBITRATION",
  "type": "labelValue",
  "value": "PM self-arbitrates at five named pipeline positions using a four-source priority stack — Pencil SSOT, ticket AC, memory rules, codebase. The single operator pause is the Content-Alignment Gate on user-visible copy tickets.",
  "valueFont": "body"
}
```

### RolePipelineSection paragraph
```
Automatic handoffs between six AI agents. PM self-arbitrates at five pipeline
positions via a four-source priority stack — the only operator pause is the
Content-Alignment Gate on user-visible copy tickets.
```

---

## 4. SVG Design Spec

Base: extract current inline SVG from `RolePipelineSection.tsx` (viewBox="0 0 900 200").

**Additions to existing SVG:**
1. PM pill: add subtitle text `(arbitrates)` below "PM" label — same font, smaller, muted color `#8B7A6B`
2. Between Architect pill and Engineer pill: insert a small gate marker — vertical line + label "CAG" (Content-Alignment Gate) in `#8B7A6B`, font size 9, above the arrow
3. All existing role pills, arrows, Designer on-demand path unchanged

**Output:** `frontend/public/pipeline.svg`

**README reference:**
```html
<img src="./frontend/public/pipeline.svg" alt="Role pipeline: PM (arbitrates) → Architect → [Content-Alignment Gate] → Engineer → Reviewer → QA → PM; Designer on-demand" width="100%" />
```

**RolePipelineSection reference:**
```tsx
<img
  src="/pipeline.svg"
  data-testid="role-pipeline-svg"
  alt="Role pipeline: PM (arbitrates) → Architect → [Content-Alignment Gate] → Engineer → Reviewer → QA → PM; Designer on-demand"
  width="100%"
  height="auto"
/>
```

---

## 5. Playwright Test Contract Update (AC-058-ROLE-PIPELINE)

Current contract (breaks after SVG → img):
- `[data-testid="role-pipeline-svg"]` is an SVG element
- 6 role names are visible as text nodes within `[data-section="role-pipeline"]`

New contract:
- `[data-testid="role-pipeline-svg"]` is an `<img>` element, visible
- No role-name text assertions in pipeline section (role names covered by RoleCardsSection tests)
- Paragraph within `[data-section="role-pipeline"]` contains `"four-source priority stack"` (verifies approved copy landed)
- No `·` character check preserved

---

## 6. Constraints

- `#architecture.nextElementSibling === <footer>` (K-031 Sacred) — no new sections added; existing section order unchanged
- `data-section="role-pipeline"` on section wrapper must be preserved
- `data-testid="role-pipeline-svg"` moves from `<svg>` to `<img>` — no other testid changes
- `site-content.types.ts` — `ArchLayer.fields: ArchField[]` is already unbounded; no type change needed
- Run `node scripts/build-ticket-derived-ssot.mjs` after `content/roles.json` change to sync README ROLES marker block
- DISCIPLINE card change uses identical tokens as existing fields — no Pencil update, no design-exemptions.md entry needed

---

## 7. Implementation Order

1. Engineer — all changes in any order, following design doc §2 file list
2. Run generator: `node scripts/build-ticket-derived-ssot.mjs`
3. Run `npx tsc --noEmit` + `npx playwright test`
