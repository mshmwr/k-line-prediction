---
title: K-095 — Fix Pipeline Diagram Font Truncation (inline SVG via SVGR + CAG label reposition)
ticket: K-095
phase: 1
status: design
visual-spec: N/A — reason: no .pen file; SVG content owned in frontend/public/pipeline.svg
qa-early-consultation: N/A — pure SVG render fix, no new AC surface, no route addition
design-locked: false
---

## 0 Scope Questions

None. All facts verified by codebase grep + file inspection.

---

## 1 Technical Solution Selection

### Problem decomposition

**Problem A — Font loading failure**: `<img src="/pipeline.svg">` renders SVG in an isolated image context. The browser does not apply the page's loaded web fonts (Geist Mono from Google Fonts CDN) to SVG `<text>` elements when the SVG is fetched as an image resource. System monospace fallback (Courier New on macOS, wider than Geist Mono) causes "Architect", "Engineer", "Reviewer" labels to overflow their `<rect>` boxes.

**Problem B — CAG label overlap**: The dashed vertical gate line sits at `x1=312 y1=43 x2=312 y2=77` (between Architect rect at x=185 and Engineer rect at x=340). The CAG `<text>` is at `y=50` — inside the pill row band (y=43 to y=77), overlapping on the line itself. No background rect behind the text; the label visually floats into the pill band.

### Option A — Conservative: Embed font as base64 data-URI in pipeline.svg (keep `<img>`)

Move the font-face declaration inline into `pipeline.svg` using a `<style>` block with a base64-encoded subset of Geist Mono woff2. SVG rendered as `<img>` can execute its own embedded `<style>`, including `@font-face` referencing data-URIs.

- **When to pick**: no React component change needed; pipeline.svg stays in `public/` as a pure SVG asset; safer for README embed (which uses the same file).
- **Trade-off**: base64 woff2 subset adds ~15-25 KB to the SVG; font subsetting toolchain required during authoring; README file size increases; two layout concerns (font + CAG) need separate SVG edits; no TypeScript type safety on the component.

### Option B — Progressive: Full SVG-as-JSX migration (copy all path data directly into RolePipelineSection.tsx)

Remove pipeline.svg entirely. Paste all SVG markup directly into `RolePipelineSection.tsx` as JSX. No separate asset file, no SVGR step.

- **When to pick**: maximum control, no build-plugin dependency; zero network request for the diagram.
- **Trade-off**: README can no longer embed the same file; pipeline.svg in `public/` must stay for README use or README embed breaks; two divergent sources emerge immediately; violates single-source principle.

### Option C — Middle ground: Move pipeline.svg to `frontend/src/assets/`, import via SVGR `?react` (recommended)

Move `pipeline.svg` from `frontend/public/pipeline.svg` to `frontend/src/assets/pipeline.svg`. Import in `RolePipelineSection.tsx` as `import PipelineSvg from '../../assets/pipeline.svg?react'`. Replace `<img>` with `<PipelineSvg width="100%" height="auto" aria-label="..." />`.

SVGR v5 + `vite-plugin-svgr` v5.2.0 are already installed. `vite-env.d.ts` already includes `/// <reference types="vite-plugin-svgr/client" />` which provides the `*.svg?react` type declaration. No new packages needed.

Inline SVG becomes part of the DOM; the page's Google Fonts Geist Mono (already loaded for body text) applies immediately.

README `<img src="./frontend/public/pipeline.svg">` embed will break unless the public/ copy is preserved. Because the inline SVG is the runtime display, the README copy becomes presentation-only; it can tolerate system-font fallback in GitHub rendering (GitHub SVG rendering also uses system fonts). Fix: keep a copy of `pipeline.svg` in `frontend/public/` with the CAG coordinate patch applied, for README use only.

- **When to pick**: already-installed toolchain; proven pattern in codebase (MailIcon/GithubIcon/LinkedinIcon use identical `?react` pattern from `frontend/design/brand-assets/`); TypeScript-safe; no extra dependencies.
- **Trade-off**: pipeline.svg lives in two locations (src/assets/ = runtime authority, public/ = README docs-only); `icon: true` in `svgrOptions` sets `width="1em" height="1em"` on the root SVG element by default — must be overridden via props.

**Recommendation: Option C.** Rationale: zero new dependencies, proven `?react` pattern already in this repo, inline DOM inherits page fonts automatically.

---

## 2 Confirmed Facts from Codebase Inspection

| Fact | Source |
|------|--------|
| `vite-plugin-svgr` v5.2.0 installed, `svgr({ svgrOptions: { icon: true } })` active | `frontend/vite.config.ts` L3, L7 |
| `/// <reference types="vite-plugin-svgr/client" />` present in vite-env.d.ts | `frontend/src/vite-env.d.ts` L2 |
| `*.svg?react` type declaration: **already present** via the vite-plugin-svgr/client reference | `frontend/src/vite-env.d.ts` L2 |
| SVGR `icon: true` effect: sets `width="1em" height="1em"` on root SVG; overridden by passing `width` and `height` props to the component | vite-plugin-svgr v5 docs + existing icon usage pattern |
| Existing `?react` import pattern in repo: `import MailSvg from '../../../design/brand-assets/mail.svg?react'` | `frontend/src/components/icons/MailIcon.tsx` L1 |
| `frontend/src/assets/` directory: **does not exist** — must be created | `ls frontend/src/` confirmed no assets/ entry |
| `/pipeline.svg` URL referenced only in: `RolePipelineSection.tsx` (L11, runtime) + `README.md` (docs embed) | grep across all .ts/.tsx/.js/.json/.md |
| CAG label current position: `<text x="312" y="50">CAG</text>` | `frontend/public/pipeline.svg` L41 |
| CAG dashed line: `<line x1="312" y1="43" x2="312" y2="77">` | `frontend/public/pipeline.svg` L40 |
| Pill row bounds: top `y=43`, bottom `y=43+34=77` | `frontend/public/pipeline.svg` L16-20 |

---

## 3 CAG Label Reposition

### Current state

```
y=36  (empty space)
y=43  ─── pill top edge
y=50  ← CAG text HERE (inside pill band, overlapping the dashed line midpoint)
y=60  ← main text center (PM, Architect, Engineer, etc.)
y=77  ─── pill bottom edge
```

### Proposed reposition: text above pill band

Move the CAG text to `y=36` — 7px above the pill top edge (`y=43`). At `fontSize=9`, the text cap-height is approximately 6.5px; the baseline at `y=36` places the top of glyphs at approximately `y=29`, which clears the pill top by a 14px visual gap (legible float above the pipeline bar).

The dashed line `y1=43 y2=77` stays unchanged (spans only the pill height, not extended into the label zone). This creates a clean visual separation: label floats above, gate post spans the pill.

```
y=36  ← CAG text (above pill band, 7px clearance)
y=43  ─── pill top edge  (dashed line begins here)
y=60  ← main text center
y=77  ─── pill bottom edge  (dashed line ends here)
```

**SVG edits required** (both copies — src/assets/ and public/):

| Element | Attribute | Old | New |
|---------|-----------|-----|-----|
| `<text>` (CAG label) | `y` | `50` | `36` |
| `<line>` (CAG dashed gate) | `y1` | `43` | `43` (unchanged) |
| `<line>` (CAG dashed gate) | `y2` | `77` | `77` (unchanged) |

Only the `<text y>` attribute changes. The dashed line coordinates are already correct.

---

## 4 File Change List

| File | Action | What changes |
|------|--------|--------------|
| `frontend/src/assets/pipeline.svg` | **Create** (copy from public/ + patch) | New directory + new file; CAG text `y="50"` → `y="36"`; this is the runtime-authoritative copy consumed by SVGR |
| `frontend/public/pipeline.svg` | **Modify** (patch only) | CAG text `y="50"` → `y="36"`; keep file for README embed; no SVGR processing, purely static |
| `frontend/src/components/about/RolePipelineSection.tsx` | **Modify** | Add `import PipelineSvg from '../../assets/pipeline.svg?react'`; replace `<img src="/pipeline.svg" ...>` with `<PipelineSvg width="100%" height="auto" data-testid="role-pipeline-svg" aria-label="..." className="block" />`; remove the `alt` prop (SVGR SVG uses `aria-label`, not `alt`) |

No backend files. No route files. No other frontend files.

---

## 5 Component Interface (RolePipelineSection after change)

```typescript
// import at top of RolePipelineSection.tsx
import PipelineSvg from '../../assets/pipeline.svg?react'

// JSX usage — props passed to generated SVG root element:
<PipelineSvg
  width="100%"
  height="auto"
  data-testid="role-pipeline-svg"
  aria-label="Role pipeline: PM (arbitrates) → Architect → [Content-Alignment Gate] → Engineer → Reviewer → QA → PM; Designer on-demand"
  className="block"
/>
```

- `width="100%"` overrides the `icon: true` default of `"1em"`.
- `height="auto"` overrides the `icon: true` default of `"1em"`; combined with `viewBox="0 0 900 200"`, this preserves the correct 900:200 aspect ratio at any container width.
- `className="block"` prevents the inline `<svg>` default `display:inline` from adding a bottom gap (same bottom-gap issue that affects `<img>` in inline contexts).
- `data-testid="role-pipeline-svg"` preserves the existing E2E testid — SVGR passes data attributes through to the root SVG element.
- `aria-label` replaces the `<img alt>` attribute; provides the same screen-reader description.

---

## 6 Implementation Order

1. Create `frontend/src/assets/pipeline.svg` — copy public/pipeline.svg, change `<text x="312" y="50"` to `<text x="312" y="36"`.
2. Patch `frontend/public/pipeline.svg` — same `y="50"` → `y="36"` change only.
3. Edit `frontend/src/components/about/RolePipelineSection.tsx` — add import, replace `<img>` with `<PipelineSvg>` with props listed in §5.
4. Run `npx tsc --noEmit` from `frontend/` — confirm `?react` import resolves (no new type errors expected; type already declared).
5. Run Playwright screenshot on `/about` — visually confirm label text un-truncated, CAG label above pill band.

No parallelization needed; steps 1 and 2 are independent of step 3, so steps 1+2 can be done before or after step 3.

---

## 7 Shared Component Audit

`grep -rn "RolePipelineSection\|pipeline\.svg\|role-pipeline-svg" frontend/src/` output confirms:

- `RolePipelineSection.tsx` is used only in `AboutPage.tsx` (page-specific, not shared).
- `data-testid="role-pipeline-svg"` appears only in `RolePipelineSection.tsx` (no E2E spec currently asserts this testid — grep of `e2e/` for `role-pipeline-svg` returns zero hits; testid is preserved as a future test anchor).

No shared primitive changes. No cross-page blast radius.

---

## 8 Boundary Pre-emption

| Boundary scenario | Behavior defined? |
|------------------|--------------------|
| Empty / null input | N/A — component takes no props; SVG is static |
| Max / min value boundary | N/A — static SVG content, no data binding |
| API error response | N/A — no API call |
| Concurrency / race condition | N/A — static render |
| Empty list / large data | N/A — static SVG |

---

## 9 Risks and Notes

| Risk | Severity | Mitigation |
|------|----------|-----------|
| `icon: true` sets `width="1em" height="1em"` on root SVG | Medium | Pass `width="100%" height="auto"` props explicitly; SVGR merges caller props onto root SVG |
| `viewBox="0 0 900 200"` must be preserved for correct aspect ratio | Medium | SVGR v5 preserves `viewBox` by default; verify via `tsc --noEmit` |
| README `<img src="./frontend/public/pipeline.svg">` is now a separate copy | Low | public/ copy receives the same CAG patch; the font rendering difference (system vs Geist Mono) is a known GitHub SVG limitation, not a regression introduced by this ticket |
| CAG label `y=36` clearance check | Low | At fontSize=9 + baseline at y=36: cap-height ends near y=29; 14px gap to pill top y=43; verified acceptable in pixel math |
| Two copies of pipeline.svg may drift | Low | src/assets/ is runtime-authoritative; public/ is docs-only; engineer must add a JSDoc comment in RolePipelineSection.tsx noting this |

---

## 10 Refactorability Checklist

- [x] **Single responsibility**: `RolePipelineSection` renders one diagram; SVG markup lives in its asset file.
- [x] **Interface minimization**: Component takes no props; SVG renders with fixed layout.
- [x] **Unidirectional dependency**: `pipeline.svg` (asset) → `RolePipelineSection` (component) → `AboutPage` (page). No cycles.
- [x] **Replacement cost**: Swapping the SVG asset touches 1 file (`RolePipelineSection.tsx`); swapping SVGR for another loader also touches 1 file.
- [x] **Clear test entry point**: `data-testid="role-pipeline-svg"` on SVG root; Playwright can assert presence + screenshot diff for font rendering.
- [x] **Change isolation**: SVG visual change affects zero API contracts; zero shared components.

---

## 11 All-Phase Coverage Gate

Single-phase ticket. No backend. No new routes. No new shared components.

| Item | Status |
|------|--------|
| Backend API | N/A |
| Frontend Routes | N/A — `/about` route unchanged |
| Component Tree | Covered in §7 (page-specific only) |
| Props Interface | Covered in §5 |

---

## 12 Architecture Doc Sync

`ssot/system-overview.md` entry for `RolePipelineSection.tsx` currently reads:

> `RolePipelineSection.tsx` — K-058; Nº 03 inline SVG pipeline diagram; viewBox 0 0 900 200; data-testid="role-pipeline-svg"

After this ticket closes, the entry should add: `; SVGR ?react import from src/assets/pipeline.svg (K-095)`.

`frontend/public/pipeline.svg` listed in `frontend/public/` directory structure should note: `(docs-only copy; runtime SVG at src/assets/pipeline.svg from K-095)`.

Architect will update `ssot/system-overview.md` after Engineer delivery.

---

Architect delivery gate:
  all-phase-coverage=N/A (single-phase, no cross-layer),
  pencil-frame-completeness=N/A (no .pen file for this ticket),
  visual-spec-json-consumption=N/A (no .pen file; SVG is the design artifact),
  sacred-ac-cross-check=N/A (no JSX node deletion; `<img>` → `<svg>` is a same-testid swap, no sacred DOM selectors affected),
  route-impact-table=N/A (no global CSS change; no sitewide token change),
  cross-page-duplicate-audit=confirmed no duplicate (RolePipelineSection is about/-only; grep confirmed),
  target-route-consumer-scan=N/A (no navigation behavior change),
  architecture-doc-sync=deferred to ticket close (§12 above),
  self-diff=N/A (new file, no prior state to diff),
  output-language=checked (no CJK in this document)
  → OK

---

## Retrospective

**Where most time was spent:** Confirming `icon: true` override semantics and verifying the CAG coordinate math against the SVG viewBox.
**Which decisions needed revision:** None.
**Next time improvement:** For SVGR migration tickets, immediately check `vite-env.d.ts` for the `vite-plugin-svgr/client` reference before considering any package additions — eliminates the type-declaration research step.
