# BQ-040-03 — /diary Mobile Rail Decision Memo

**Date:** 2026-04-23
**Author:** Designer (persona)
**BQ:** K-040 Item 6 AC-040-DIARY-MOBILE-RAIL — is `/diary` mobile rail removal design intent or impl drift?

## Verdict: (b) Design intent = rail + marker removed on mobile. `hidden sm:block` is correct impl. K-040 Item 6 = no-op (already correct).

## Evidence

### 1. Pencil .pen file reality
- `frontend/design/homepage-v2.pen` contains 4 top-level frames: `35VCj` (/about), `4CsvQ` (/), `wiDSi` (/diary), `VSwW9` (/business-logic). All are **desktop 1440px wide**.
- No `Mobile` / `<640` / `390` named frame for /diary (or any route). Search patterns `mobile`, `Mobile`, `rail`, `Rail` returned zero mobile-scoped frames.
- Rail node `wiDSi/CGijt/Tdzcs` exists only in desktop Diary frame (fill `#2A2520`, width 1, height 624, x=29, y=40).
- **Pencil absence of mobile frame ≠ design intent to hide.** Intent is recorded in K-024 design doc (below), not in .pen.

### 2. K-024 design doc §6.8 L784–786 (mobile layout specs, viewport < 640px)

| Element | Mobile spec | Rationale |
|---------|------------|-----------|
| Rail | **hidden on mobile (`<sm:`)** — `hidden sm:block` | 1px rail in 24px left padding clashes with marker visually; marker alone conveys timeline visually. |
| Marker | **hidden on mobile** — `hidden sm:block` | rail's visual anchor gone → marker becomes orphan dot; cleaner to drop both on mobile |
| Entry wrapper paddingLeft | `pl-0` (mobile) vs `pl-[92px]` (desktop) | no rail/marker on mobile → no indent needed |

### 3. K-024 E2E locking the intent
- `docs/designs/K-024-diary-structure.md:895` — T-C6: "390 mobile DiaryMarker + DiaryRail computed `display:none`" — R2 2026-04-22 added per I-1/I-2.
- File: `frontend/e2e/diary-page.spec.ts` (per design doc `AC-024-CONTENT-WIDTH` block). Suite actively enforces hide.

### 4. Runtime code matches intent
- `frontend/src/components/diary/DiaryRail.tsx:5` comment: `// Hidden on mobile (<sm, 640px) per design §6.8; consumers control visibility`
- `DiaryRail.tsx:15`: `className="hidden sm:block absolute"` — direct implementation of §6.8.
- Same pattern on `DiaryMarker` (per K-024 design doc L838 reference HTML).

## Conclusion

Design intent, design doc, E2E spec, and runtime code all agree: rail + marker hidden below 640px is **correct**, not drift. User's mobile observation (rail invisible) is a feature, not a bug.

## Actions taken (this session)

1. `docs/designs/K-024-visual-spec.json` — added `mobileRail: "design-removed"` + rationale to `rail` role; added `mobileMarker: "design-removed"` + rationale to `marker` role. This annotates the SSOT so future audits don't mis-classify as drift.
2. This memo created.
3. Designer retro appended.

## No actions required of Engineer / PM

- **No code change** — `DiaryRail.tsx` and `DiaryMarker` remain as-is.
- **No Pencil mutation** — homepage-v2.pen untouched; touched frames this session = ∅.
- **No JSON/PNG re-export** — per Designer §Frame Artifact Export scope rule (touched-frames only; global re-export forbidden).
- **K-040 Item 6 retro-classification:** AC-040-DIARY-MOBILE-RAIL satisfied; Item 6 was a false-positive drift report. Decision fits category (b) in BQ prompt.

## If user disagrees with design intent (future ticket)

If stakeholders later decide mobile rail SHOULD be visible:
- New ticket K-XXX required (this is a design reversal, not a bug fix).
- Designer would need to add a mobile frame to `homepage-v2.pen` with explicit rail spec (left inset, width, color, top/bottom inset at 390px viewport).
- K-024 design doc §6.8 L784–786 + T-C6 E2E test would need rewrite.
- `visual-spec.json` `mobileRail` annotation would flip to a concrete layout object.

## References

- `docs/designs/K-024-diary-structure.md` §6.8 L771–800 (mobile specs)
- `docs/designs/K-024-visual-spec.json` (rail/marker roles, now with mobileRail/mobileMarker annotations)
- `frontend/src/components/diary/DiaryRail.tsx:5,15`
- `frontend/e2e/diary-page.spec.ts` T-C6 (computed display:none at 390px)
