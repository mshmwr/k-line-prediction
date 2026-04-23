# Retrospective-Meta — When BFP Itself Fails

## Purpose

Anchor file for "Round-N BFP" — i.e. cases where an earlier Bug Found Protocol (`~/.claude/agents/<role>.md` BFP steps 1–4) ran and codified rules, but the mechanism itself proved insufficient because the underlying verification gap was not addressed.

The regular per-role retrospectives at `docs/retrospectives/<role>.md` are **per-case** learning. This meta file is **per-mechanism** learning. When an existing BFP codification fails to prevent the same class of bug, this file records the structural insufficiency + the Round-(N+1) fix.

---

## 2026-04-23 — K-034 BFP Round 2 (K-035 α-premise failure)

### Round 1 record

K-035 ticket "/about footer shared-component regression" (closed 2026-04-22) was itself a Bug Found Protocol exercise: it traced a ~5-role × 3-ticket drift where `/about` rendered an inline `FooterCtaSection` while `/` and `/business-logic` used `HomeFooterBar`. Round-1 BFP landed:

- Ticket K-035 with Phase 0 audit + Phase 2 scoring matrix + Phase 3 design doc + Phase 4 retrospective + 4 memory edits.
- `feedback_shared_component_inventory_check.md` memory + PM persona "Shared-component inventory per route" gate.
- Architect Option α (variant prop on shared Footer.tsx) — deliberately scored against options β (two siblings) and γ (unify content sitewide) with a weighted matrix (declared Pencil fidelity: α=10, β=10, γ=0).

### What Round 1 missed

**Round 1 had no requirement to verify that Pencil frame content actually supported the "fidelity" score.** The scoring matrix rationale for α=10 "preserves both frames 4CsvQ + 35VCj — both render their own designs" was accepted by Architect self-recommendation + Reviewer + PM without anyone running `batch_get` on both frames and diffing their content.

Post-deploy Pencil verification (2026-04-23) revealed:
- Frame `86psQ` (/about footer in v2.pen): single text node `yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn`, Geist Mono 11px.
- Frame `1BGtd` (/home footer in v2.pen): single text node `yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn`, Geist Mono 11px.
- The two frames are **content-identical inline one-liners**. Pencil SSOT has ONE footer design, not two.

The premise "both frames render their own designs" (justifying α's Pencil fidelity score) is empirically false. α was chosen on wrong information; γ was rejected on wrong information. Correct choice was γ: unify content sitewide, delete the "Let's talk →" CTA.

### Why the mechanism was insufficient

Round-1 BFP produced 4 persona rules + 4 memory files focused on **shared-component inventory and drift detection at the code / ticket level**. None of them required **Pencil content-parity verification before Architect option scoring**. Specifically:

| Round-1 gate | Intent | What it caught | What it missed |
|--------------|--------|----------------|----------------|
| PM Shared-components-inventory per route | Force AC to enumerate shared components per route | Inline vs shared file location | Whether the shared file's variants match Pencil |
| Architect Target-route consumer scan | Force `grep to="/<route>"` to find all call sites | Consumer site completeness | Whether the component's internal variant axis corresponds to Pencil divergence |
| Designer Pencil cross-frame scan | Scan for same-theme patterns across frames | Visual theme consistency | Content-identity diff when two frames hold the same-named sub-tree |
| `feedback_shared_component_inventory_check.md` | Enumerate shared components before page work | Missing shared canonical path | Whether "shared but 2 variants" reflects actual Pencil design |

**Structural gap:** Round-1 treated Pencil as background context that Designer "handles"; it did not make Pencil content a first-class verification target for Architect/Engineer/Reviewer/QA. Every gate was one-step-removed from the actual source-of-truth.

Worse: the Architect scoring matrix had `Pencil fidelity` as a weighted dimension (0.25) without any requirement to produce Pencil evidence (screenshots, batch_get output, frame content diff) to justify the number assigned. Scoring on unverified premise is systemically equivalent to guessing.

### Round-2 structural change (K-034 Phase 0)

Round-2 BFP lands five structural changes that were absent in Round-1:

1. **`.pen` SSOT via JSON snapshot** (Q1 decision, 17-decision table): Designer must export `frontend/design/specs/<pen>.frame-<id>.json` every time `.pen` is edited. Reviewer/Engineer/Architect/PM read JSON, not Pencil MCP. JSON existence + freshness is a PM Phase Gate check.

2. **Pencil content-parity verification required at Architect option scoring** (`senior-architect.md` Q7c + Pre-Design Pencil audit update): any scoring-matrix dimension citing "Pencil fidelity" must include a per-option `batch_get` dump excerpt + content diff. Scoring without evidence = return to Architect.

3. **Ticket frontmatter `visual-delta: none|yes` field** (Q7b): tickets with `visual-delta: yes` cannot skip Designer; `visual-delta: none` tickets skip Designer entirely. Removes the "implicit no-Pencil" ambiguity that let K-035 skip explicit Pencil content audit.

4. **Design-locked trigger = PM sign-off on Designer delivery bundle** (Q6a): PM cannot release Architect until Designer has delivered (a) `.pen` edit, (b) JSON snapshot, (c) PNG screenshot, (d) side-by-side PNG vs current impl. Architect designing on in-flux or unverified Pencil is structurally prevented.

5. **Routes without Pencil frames documented in `docs/designs/design-exemptions.md`** (Q7a): `/app` and any future tool/util surface listed here; Architect forbidden from producing a design doc for non-exempt non-Pencil routes. Removes the "Architect and Designer worked in parallel, design caught up later" failure mode.

### When to escalate to Round-3

If a K-034 post-deploy audit reveals a new class of design-source bug (e.g. "JSON snapshot was regenerated but contained stale property values because Designer ran `batch_get` before saving `.pen`"), append a new entry to this meta file naming the Round-2 gap + Round-3 structural change. Do NOT reopen the per-role retrospectives in isolation — the mechanism itself requires a meta-level fix.

---

## Governance

- This file is written by PM (or Architect on behalf of PM) when a BFP ticket itself produces a drift.
- Per-role retrospective files remain the primary learning anchor for single-case bugs; this meta file is for mechanism failures.
- Entries are prepended newest-first.
- Linked memory: `/Users/yclee/.claude/projects/-Users-yclee-Diary/memory/feedback_bfp_round2_meta_lesson.md`.
