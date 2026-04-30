---
id: K-068
title: Designer JSON SSOT — responsive + tailwindHint schema enforcement
status: open
phase-1-status: in-progress
created: 2026-04-30
type: tooling
priority: medium
size: small
visual-delta: no
content-delta: no
design-locked: n/a
qa-early-consultation: ✓ docs/retrospectives/qa.md 2026-04-30 K-068
dependencies: [K-067]
worktree: .claude/worktrees/K-068-designer-json-responsive-schema
branch: K-068-designer-json-responsive-schema
base-commit: db65cd1
---

## Summary

Close the spec gap that caused K-067 to ship a desktop-vertical card layout despite the Pencil design showing horizontal cards.

Pencil exports 1440px-only absolute coordinates. The previous bridge to Tailwind responsive classes was a hand-written `mobileConstraint` field that was lost when Designer re-exported `about-v2.frame-GMEdT.json` in PR #66. Engineer had no signal that "horizontal frame at 1440" meant `md:grid-cols-3` in code, so the React component shipped `flex-col` (vertical at all breakpoints).

Land four artefacts so the gap cannot recur:

1. **Schema** — `frontend/design/specs/_schema.json` defines the shape of `responsive` + `tailwindHint` fields (so they're typed when present).
2. **Validator** — `frontend/design/specs/validate-specs.mjs` walks each frame JSON, finds every object with `layout: "horizontal"` that has ≥2 visual children, and errors if `responsive` or `tailwindHint` is missing. Custom walker required because JSON shape is ad-hoc (children appear under varying key names: `children`, `wsCards`, `fields`, etc.).
3. **Persona hard rule** — `~/.claude/agents/designer.md` G-x: Designer must populate both fields before export and run validator before declaring export complete.
4. **Audit + patch** — every existing `about-v2.frame-*.json` and `homepage-v2.frame-*.json` validated; missing fields backfilled to match shipped React component classes.

## Motivation

K-067 root cause (post-mortem 2026-04-30):

- AC-067-CARD-ALL specified "3 cards at 320 / 768 / 1280" but did not specify directional layout (stacked vs side-by-side). Engineer satisfied AC with `flex-col gap-3` (3 cards always visible, just stacked).
- Pencil showed horizontal cards on the 1440 frame, but the JSON export had:
  - `layout: "horizontal"` (Pencil-internal, no Tailwind mapping)
  - No `responsive` field (dropped during re-export)
  - No `tailwindHint` field (never existed)
- Engineer treated JSON as 1440-only spec, no responsive intent visible.

Codifying the bridge field as a schema-required field eliminates the human-memory dependency.

## Acceptance Criteria

### Schema + validator

- **AC-068-SCHEMA-FILE:** `frontend/design/specs/_schema.json` exists and is valid JSON Schema draft-07; defines `responsive` (object with `mobile` + `desktop` string fields) and `tailwindHint` (string) shape.
- **AC-068-VALIDATOR-FILE:** `frontend/design/specs/validate-specs.mjs` exists; node-runnable; exits 0 on pass, non-zero on missing fields.
- **AC-068-VALIDATOR-RULE:** Validator detects every object with `layout === "horizontal"` and ≥ 2 visual children (heuristic: any nested object with `id` + `type`/`layout`, or any array of such); errors if `responsive` or `tailwindHint` missing.
- **AC-068-VALIDATOR-PASS:** All current spec JSONs pass validator after audit patch.

### Persona

- **AC-068-PERSONA-RULE:** `~/.claude/agents/designer.md` includes a G-numbered hard step requiring Designer to populate `responsive` + `tailwindHint` for every horizontal+multi-child frame and run schema validation before declaring export complete.
- **AC-068-PERSONA-EXAMPLE:** Persona includes a worked example showing the `responsive: { mobile: "grid-cols-1", desktop: "md:grid-cols-3" }` + `tailwindHint: "grid grid-cols-1 md:grid-cols-3 gap-[14px]"` pattern.

### Audit

- **AC-068-AUDIT-LIST:** Every existing `frontend/design/specs/about-v2.frame-*.json` and `frontend/design/specs/homepage-v2.frame-*.json` enumerated.
- **AC-068-AUDIT-PATCH:** Every horizontal+multi-child frame in those files has `responsive` + `tailwindHint` populated to match shipped React component classes.
- **AC-068-AUDIT-VERIFY:** Patched JSONs pass schema validation (`ajv` or `node` script).

### Gates

- **AC-068-DOCS-ONLY:** Changes are docs/spec/persona only — no `frontend/src/**` or `backend/**` edits, no test impact, no Playwright run required.

## PRD

### Scope

| File | Change |
|------|--------|
| `frontend/design/specs/_schema.json` | Create — JSON Schema for frame JSONs with responsive enforcement |
| `frontend/design/specs/about-v2.frame-*.json` | Add `responsive` + `tailwindHint` to qualifying frames |
| `frontend/design/specs/homepage-v2.frame-*.json` | Add `responsive` + `tailwindHint` to qualifying frames |
| `~/.claude/agents/designer.md` | Add G-x hard step + worked example |
| `docs/retrospectives/designer.md` | Append K-068 entry |
| `frontend/public/diary.json` | Append K-068 entry (after close) |

### Schema sketch

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "definitions": {
    "horizontalMultiChild": {
      "type": "object",
      "properties": {
        "type": { "const": "frame" },
        "layout": { "const": "horizontal" }
      },
      "required": ["responsive", "tailwindHint"],
      "properties": {
        "responsive": {
          "type": "object",
          "properties": {
            "mobile": { "type": "string" },
            "desktop": { "type": "string" }
          },
          "required": ["mobile", "desktop"]
        },
        "tailwindHint": { "type": "string" }
      }
    }
  }
}
```

### Persona G-x text (draft)

```
G-x. Responsive + Tailwind hint mandatory on horizontal+multi-child frames

When exporting a frame JSON where layout=horizontal and the frame has 2+
children, you MUST add both fields before export:

  "responsive": {
    "mobile":  "grid-cols-1",
    "desktop": "md:grid-cols-3"
  },
  "tailwindHint": "grid grid-cols-1 md:grid-cols-3 gap-[14px]"

These translate Pencil's 1440-only absolute layout into the responsive
Tailwind classes the React component must render. Without these fields,
Engineer cannot distinguish "horizontal at desktop only" from "horizontal
at all breakpoints".

Self-check before declaring export complete:
  node scripts/validate-design-specs.mjs (or equivalent ajv check)
```

## Out of Scope

- Pencil MCP changes (export tool stays unchanged; we add a post-export validator instead).
- Auto-generation of Tailwind hint from Pencil layout (manual for now; can revisit if pattern stabilises).
- React component changes (K-067 horizontal fix tracked separately on `K-067-fix-card-horizontal` branch).

## PM Notes

K-067 follow-up commitment. Schema lives next to specs, not in `frontend/src` — it is design SSOT tooling, not runtime code.
