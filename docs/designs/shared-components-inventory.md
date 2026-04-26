---
title: Shared Chrome Components Inventory
source-of-truth-for: AC-034-P0-SHARED-CHROME-INVENTORY
created: 2026-04-23
owner: PM (Edits require PM ruling)
status: Phase 0 MVP — covers Footer + UnifiedNavBar + BuiltByAIBanner
---

# Shared Chrome Components Inventory

Source-of-truth for sitewide shared chrome components (Footer, NavBar, Banner, etc.).
Any PR introducing a **new variant prop** to any component here MUST first Edit this file,
obtain PM ruling, and cite the Pencil frame ID that proves divergence.

This inventory is MVP for K-034 Phase 0 (per AC-034-P0-SHARED-CHROME-INVENTORY).
Phase 2 (or TD-K034-03 trigger) expands this to: auto-generated
`shared-components.spec.ts` pairwise byte-diff matrix across the full inventory.

---

## Current inventory (2026-04-23)

| Component | Source file | Consuming routes | Allowed variants | Pencil frame IDs | Notes |
|-----------|-------------|------------------|------------------|------------------|-------|
| **Footer** | `frontend/src/components/shared/Footer.tsx` | `/`, `/about`, `/business-logic`, `/diary` [^diary-adoption] | **0 (Phase 1 retires `variant` prop per AC-034-P1-FOOTER-UNIFIED)** | `4CsvQ` (homepage-v2.pen), `86psQ` (homepage-v2.pen), `1BGtd` (homepage-v2.pen), `35VCj` footer subtree (homepage-v2.pen) | K-035 α-premise: frames 86psQ + 1BGtd + 4CsvQ + 35VCj footer subtree all byte-identical inline one-liner (`yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn` Geist Mono 11px). `/app` intentionally renders NO Footer (K-030 isolation, PRESERVED). `/diary` no-footer Sacred RETIRED 2026-04-23 by K-034 Phase 3 — see [^diary-adoption]. |

[^diary-adoption]: `/diary` added 2026-04-23 via K-034 Phase 3 (absorbed ex-K-038 per user directive), retires K-017 AC-017-FOOTER `/diary` negative clause + K-024 `/diary` no-footer Sacred invariant + K-034 Phase 1 T4 AC-034-P1-NO-FOOTER-ROUTES `/diary` row. No dedicated Pencil frame for `/diary` — Pencil provenance inherited from `homepage-v2.pen` frames `86psQ` + `1BGtd` sitewide one-liner per BQ-034-P3-01 ruling ("shared Footer already Pencil-backed; adding route to consumer list ≠ new visual element"). Designer may optionally add `diary-v2.pen` frame (BQ-034-P3-02 optional) but Phase 3 release is not gated on it.
| **UnifiedNavBar** | `frontend/src/components/UnifiedNavBar.tsx` | `/`, `/about`, `/diary`, `/business-logic` | **0 (no variant prop; per-route `active` state derived from `useLocation`)** | TBD — NavBar not yet explicitly framed in `.pen` (covered in homepage-v2.pen top strip area); Designer to assign frame ID during Phase 2 or first NavBar-scoped ticket | `/app` renders NO NavBar (K-030 `/app` isolation). Route list for `active` states derived from `TEXT_LINKS` const — changes there require inventory Edit. |
| **BuiltByAIBanner** | `frontend/src/components/home/BuiltByAIBanner.tsx` | `/` **only** | 0 (single-route consumer; not technically "chrome" but listed to prevent future spillage without PM gate) | TBD — visible inside homepage-v2.pen hero strip; Designer to assign frame ID if Phase 2 reshuffle | If a future ticket adds this to `/about` or `/business-logic`, PR MUST first Edit this inventory + PM ruling + Pencil frame evidence. |

---

## Routes with NO shared chrome (intentional isolation)

- `/app` — K-030 isolation: no Footer, no UnifiedNavBar, no BuiltByAIBanner (Sacred per AC-030-NO-FOOTER + AC-030-NO-NAVBAR). Listed in `docs/designs/design-exemptions.md` under "intentionally no design".
- ~~`/diary` — K-024 no-Footer (Sacred per `pages.spec.ts` L158 `/diary has no Footer`); UnifiedNavBar present.~~ **RETIRED 2026-04-23 by K-034 Phase 3** (absorbs ex-K-038) — `/diary` now renders shared Footer per AC-034-P3-DIARY-FOOTER-RENDERS; see Footer row above + footnote `[^diary-adoption]`. UnifiedNavBar remains present (unchanged).

---

## Edit procedure (when to Edit this file)

1. **Adding a new variant prop to an existing component** — blocked until (a) PM ruling recorded here, (b) Pencil frame ID proving divergence cited, (c) the table's "Allowed variants" cell for that component changes from `0` to `1` with divergence semantics documented.
2. **Adding a new shared chrome component** — append a new row; also expand `shared-components.spec.ts` cross-route byte-diff coverage (TD-K034-03 if full matrix, or inline if small).
3. **Adding a new consuming route** — update the "Consuming routes" cell; verify `shared-components.spec.ts` asserts byte-identical DOM on the new route.
4. **Removing a route from a component's consumption** — update the cell; verify no Sacred spec contradicts the removal.

All Edits require PM approval per `feedback_ticket_ac_pm_only` generalized to shared-component SSOT.

---

## Cross-references

- `frontend/e2e/shared-components.spec.ts` — current Footer byte-diff assertions; Phase 1 retires `variant` modulo; Phase 2 expansion per TD-K034-03.
- `docs/designs/design-exemptions.md` — `/app` isolation declaration.
- `~/.claude/agents/reviewer.md` §Structural Chrome Duplication Scan (K-035 2026-04-22) — Reviewer uses this inventory as reverse-scan target for page-level `.tsx` additions.
- K-034 ticket §4 AC-034-P0-SHARED-CHROME-INVENTORY — origin AC.
