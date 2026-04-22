# K-029 Design Doc — /about Architecture + Ticket Anatomy cards paper palette migration

**Ticket:** [K-029](../tickets/K-029-about-card-body-text-palette.md)
**Type:** fix (visual-token migration, no logic change)
**Author:** Architect
**Date:** 2026-04-22
**Upstream:** PM Architect放行 2026-04-22 (ticket §放行狀態)
**Downstream:** Engineer (pending PM覆核 of this doc)

---

## 0 Scope Questions (SQ)

None. Ticket §Architect Pre-check PM裁決 (2026-04-22) 已固定：
- C-body=`text-muted` (rgb(107,95,78))
- C-pyramid layer span=`text-ink` (rgb(26,24,20))
- C-pyramid `<li>` detail=`text-muted` (rgb(107,95,78), qa subagent verify tightening)
- C-badge=`text-charcoal` (rgb(42,37,32))
- C-scope=2 檔完整 (PM grep 已驗證，Architect §1 Pre-Design Audit 覆驗亦命中僅 7 sites)

---

## 1 Pre-Design Audit

### 1.1 Baseline vs worktree diff

`git -C <worktree> show main:frontend/src/components/about/ArchPillarBlock.tsx` ↔ worktree HEAD：
- **Identical.** Main baseline 與 worktree 狀態一致；K-029 修復以 main 為出發點即正確。

`git -C <worktree> show main:frontend/src/components/about/TicketAnatomyCard.tsx` ↔ worktree HEAD：
- **Identical.** 同上。

### 1.2 Site count verification

`grep -rn 'text-gray-\|text-purple-\|text-blue-\|text-slate-\|text-zinc-' frontend/src/components/about/` → 7 hits，分布：

| # | File | Line | Class hit | Semantic role |
|---|------|------|-----------|---------------|
| 1 | ArchPillarBlock.tsx | 19 | `text-gray-300` | body `<div>` |
| 2 | ArchPillarBlock.tsx | 23 | `text-gray-400` | pyramid `<li>` detail |
| 3 | ArchPillarBlock.tsx | 24 | `text-gray-300` | pyramid layer `<span>` |
| 4 | TicketAnatomyCard.tsx | 22 | `text-purple-400` | ticket ID badge `<span>` |
| 5 | TicketAnatomyCard.tsx | 33 | `text-gray-400` | body `<div>` (space-y-2) |
| 6 | TicketAnatomyCard.tsx | 35 | `text-gray-500` | Outcome label `<span>` |
| 7 | TicketAnatomyCard.tsx | 39 | `text-gray-500` | Learning label `<span>` |

Count matches PM/QA claim (3 + 4 = 7). **No other files in `components/about/` contain residual dark-theme gray/purple/blue/slate/zinc classes.**

### 1.3 Other `components/about/` files scanned clean

`MetricCard.tsx`, `MetricsStripSection.tsx`, `PageHeaderSection.tsx`, `PillarCard.tsx`, `ProjectArchitectureSection.tsx`, `RedactionBar.tsx`, `ReliabilityPillarsSection.tsx`, `RoleCard.tsx`, `RoleCardsSection.tsx`, `TicketAnatomySection.tsx`, `DossierHeader.tsx`, `FooterCtaSection.tsx` — 無命中。Scope confirmed as exhaustive.

---

## 2 Blast Radius Analysis

### 2.1 ArchPillarBlock consumers

`grep -rn 'ArchPillarBlock' frontend/src/` → `ProjectArchitectureSection.tsx` (3 instances: L18, L31, L43). `ProjectArchitectureSection.tsx` is consumed only in `AboutPage.tsx` (S5 Project Architecture section, Nº 05). No other page renders it.

### 2.2 TicketAnatomyCard consumers

`grep -rn 'TicketAnatomyCard' frontend/src/` → `TicketAnatomySection.tsx` (L1 import, L53 render). Rendered 3× via `.map(ticket => <TicketAnatomyCard key={ticket.id} {...ticket} />)`. `TicketAnatomySection.tsx` consumed only in `AboutPage.tsx` (S4 Anatomy of a Ticket, Nº 04).

### 2.3 Conclusion

Both leaf components are `/about`-exclusive. **No cross-page propagation risk.** Changes do not affect `/`, `/diary`, `/app`, `/business-logic`.

---

## 3 Route Impact Table

| Route | Affected by K-029 | Shares K-021 paper palette | Notes |
|-------|-------------------|----------------------------|-------|
| `/` (HomePage) | **No** | Yes | Does not render ArchPillarBlock / TicketAnatomyCard. |
| `/about` (AboutPage) | **Yes** | Yes | Only route consuming ProjectArchitectureSection + TicketAnatomySection. All 7 class changes visible only here. |
| `/diary` (DiaryPage) | **No** | Yes | Independent component tree (DiaryPage + timeline). |
| `/app` (AppPage) | **No** | **No** (K-030 isolation — `bg-gray-950` override, paper palette does not apply) | Tool page; even if it did render these components (it doesn't), paper tokens would not match its dark viewport. N/A. |
| `/business-logic` (BusinessLogicPage) | **No** | Yes | Independent component tree (password-gated). |
| `*` → `/` | **No** | Yes | Redirect wildcard, no component render. |

**Cross-route regression risk: zero.** Paper palette tokens already used elsewhere on `/about` (PillarCard, RoleCard, MetricCard); this ticket aligns the remaining 2 laggards with the same token set.

---

## 4 Target-Route Consumer Scan

**N/A — no route navigation behavior changed.** K-029 is pure Tailwind class replacement + `data-testid` attribute addition. No `<Link to=…>` / `href=` / redirect / auth gate change.

---

## 5 Shared Component Boundary

| Component | Classification | Rationale |
|-----------|----------------|-----------|
| `ArchPillarBlock.tsx` | **Page-specific leaf** | Consumed only by `ProjectArchitectureSection.tsx` on `/about`. Not exported to shared primitive layer. |
| `TicketAnatomyCard.tsx` | **Page-specific leaf** | Consumed only by `TicketAnatomySection.tsx` on `/about`. Not exported to shared primitive layer. |

**Neither component is a shared primitive.** No `components/primitives/` or `components/common/` file is edited. No props interface signature changes (adding `data-testid` attributes to JSX is an attribute-level addition, not a Props change).

---

## 6 Engineer Implementation Checklist (authoritative)

### 6.1 Class migration truth table (7 rows)

| # | File | Line | Before | After | Semantic role | AC ref |
|---|------|------|--------|-------|---------------|--------|
| 1 | `frontend/src/components/about/ArchPillarBlock.tsx` | 19 | `text-gray-300 text-xs leading-relaxed mb-3` | `text-muted text-xs leading-relaxed mb-3` | body `<div>` | AC-029-ARCH-BODY-TEXT |
| 2 | `frontend/src/components/about/ArchPillarBlock.tsx` | 23 | `text-xs text-gray-400` | `text-xs text-muted` | pyramid `<li>` detail (child must stay muted to preserve hierarchy under layer span) | AC-029-ARCH-BODY-TEXT |
| 3 | `frontend/src/components/about/ArchPillarBlock.tsx` | 24 | `text-gray-300 font-mono` | `text-ink font-mono` | pyramid layer span (Unit/Integration/E2E) | AC-029-ARCH-BODY-TEXT |
| 4 | `frontend/src/components/about/TicketAnatomyCard.tsx` | 22 | `font-mono text-xs text-purple-400 font-bold` | `font-mono text-xs text-charcoal font-bold` | ticket ID badge span | AC-029-TICKET-BODY-TEXT |
| 5 | `frontend/src/components/about/TicketAnatomyCard.tsx` | 33 | `space-y-2 text-xs text-gray-400 leading-relaxed` | `space-y-2 text-xs text-muted leading-relaxed` | body wrapper `<div>` (contains Outcome + Learning `<p>`) | AC-029-TICKET-BODY-TEXT |
| 6 | `frontend/src/components/about/TicketAnatomyCard.tsx` | 35 | `text-gray-500 uppercase tracking-wide font-mono` | `text-muted uppercase tracking-wide font-mono` | Outcome label span | AC-029-TICKET-BODY-TEXT |
| 7 | `frontend/src/components/about/TicketAnatomyCard.tsx` | 39 | `text-gray-500 uppercase tracking-wide font-mono` | `text-muted uppercase tracking-wide font-mono` | Learning label span | AC-029-TICKET-BODY-TEXT |

**Token rationale:**
- `text-muted` for body + pyramid `<li>` detail + Outcome/Learning labels → WCAG AA on paper (4.84:1), aligns with PillarCard precedent.
- `text-ink` for pyramid layer span → one step brighter than parent `<li>`, preserves visual hierarchy (label > detail).
- `text-charcoal` for ticket ID badge → identity/metadata accent, AAA contrast, distinct from body `text-muted` and title `text-ink`.

### 6.2 `data-testid` injection (4 rows — Architect mandate, NOT Engineer discretion)

| # | File | Target JSX | `data-testid` to add | Purpose |
|---|------|------------|----------------------|---------|
| 8 | `frontend/src/components/about/ArchPillarBlock.tsx` | L19 body `<div>` | `data-testid="arch-pillar-body"` | selector for AC-029-ARCH-BODY-TEXT body assertion (3 instances) |
| 9 | `frontend/src/components/about/ArchPillarBlock.tsx` | L24 pyramid layer `<span>` | `data-testid="arch-pillar-layer"` | selector for AC-029-ARCH-BODY-TEXT layer assertion (3 instances) |
| 10 | `frontend/src/components/about/TicketAnatomyCard.tsx` | L33 body wrapper `<div>` | `data-testid="ticket-anatomy-body"` | selector for AC-029-TICKET-BODY-TEXT body assertion (3 instances) |
| 11 | `frontend/src/components/about/TicketAnatomyCard.tsx` | L22 ticket ID badge `<span>` | `data-testid="ticket-anatomy-id-badge"` | selector for AC-029-TICKET-BODY-TEXT badge assertion (3 instances) |

**Convention source of truth:** `DossierHeader.tsx` L13 (`data-testid="dossier-header"`) + `FooterCtaSection.tsx` L20/L34/L48 (`cta-email` / `cta-github` / `cta-linkedin`) — kebab-case, component-scoped prefix. Four names above follow this convention.

**Note on pyramid `<li>` detail selector (row 2):** no `data-testid` mandated. Engineer selector path → `getByTestId('arch-pillar-layer').locator('xpath=..')` (parent `<li>` of the layer span) or equivalent structural traversal from the mandated `arch-pillar-layer` testid. Playwright spec author defines traversal in §7.

**Note on Outcome / Learning labels:** no `data-testid` mandated on the two `<span>` elements. Selector path → from `getByTestId('ticket-anatomy-body')`, use `.locator('span', { hasText: 'Outcome' })` / `{ hasText: 'Learning' }`; label copy is stable (PM ticket §範圍 locks `Outcome` / `Learning` literal text in Card).

### 6.3 Total row count

**7 class migrations + 4 testid injections = 11 implementation rows.**

---

## 7 Test Strategy (§Playwright selector strategy)

### 7.1 Spec file placement

**Extend `frontend/e2e/about-v2.spec.ts`.** Rationale:
- Existing file already contains canonical color-assertion pattern (L174–L198 AC-022-OWNS-ARTEFACT-LABEL: `getComputedStyle(el).color` → `expect(color).toBe('rgb(107, 95, 78)')`).
- K-029 AC are semantically a continuation of K-022 paper-palette migration; colocating related color assertions reduces cross-file coupling and makes future paper-palette scope changes a single-file edit.
- New spec file (e.g. `k029-about-palette.spec.ts`) would fragment AC-022 / AC-029 assertions across two files without semantic distinction.

Append two new `test.describe(...)` blocks after the existing AC-022-LINK-STYLE block (around L220 onwards). Naming: `AC-029-ARCH-BODY-TEXT` and `AC-029-TICKET-BODY-TEXT`.

### 7.2 Exact RGB allow-list (paper palette)

| Token | Hex | Computed `color` |
|-------|-----|------------------|
| `text-ink` | `#1A1814` | `rgb(26, 24, 20)` |
| `text-charcoal` | `#2A2520` | `rgb(42, 37, 32)` |
| `text-muted` | `#6B5F4E` | `rgb(107, 95, 78)` |

### 7.3 Exact RGB disallow-list (dark-theme residue)

| Token | Hex | Computed `color` |
|-------|-----|------------------|
| `gray-300` | `#D1D5DB` | `rgb(209, 213, 219)` |
| `gray-400` | `#9CA3AF` | `rgb(156, 163, 175)` |
| `gray-500` | `#6B7280` | `rgb(107, 114, 128)` |
| `purple-400` | `#C4B5FD` | `rgb(196, 181, 253)` |

### 7.4 Assertion count per AC (mandate)

**AC-029-ARCH-BODY-TEXT → 9 assertions:**
- 3× body: `getByTestId('arch-pillar-body')` → iterate 3 instances → `color` ∈ allow-list (ink/charcoal/muted) AND `color` ∉ disallow-list (gray-300/400/500)
- 3× pyramid `<li>` detail: traverse from `arch-pillar-layer` to parent `<li>` → iterate 3 → `color` === `rgb(107, 95, 78)` (strict text-muted, NOT allow-list wide)
- 3× pyramid layer span: `getByTestId('arch-pillar-layer')` → iterate 3 → `color` === `rgb(26, 24, 20)` (strict text-ink)

**AC-029-TICKET-BODY-TEXT → 12 assertions:**
- 3× body: `getByTestId('ticket-anatomy-body')` → iterate 3 → `color` ∈ allow-list AND `color` ∉ disallow-list (gray-400/500)
- 3× Outcome label: from each ticket-anatomy-body, `locator('span', { hasText: 'Outcome' })` → iterate 3 → `color` ∈ allow-list AND `color !== 'rgb(107, 114, 128)'` (gray-500)
- 3× Learning label: same pattern with `hasText: 'Learning'` → iterate 3 → same assertion
- 3× badge: `getByTestId('ticket-anatomy-id-badge')` → iterate 3 → `color` === `rgb(42, 37, 32)` (strict text-charcoal) AND `color !== 'rgb(196, 181, 253)'` (purple-400)

**AC-029-REGRESSION → no new assertions.** `npx playwright test about-v2.spec.ts` covers K-022 re-run; `npx tsc --noEmit` exit 0.

**Total new Playwright assertions: 9 + 12 = 21.** Total new test IDs in the spec: Engineer may group by AC (2 `test.describe` blocks, each containing multiple `test(...)` cases per sub-group — e.g. `test('body color', ...)`, `test('pyramid li detail', ...)`, `test('pyramid layer span', ...)` for AC-ARCH; similar 4-way split for AC-TICKET). Assertion count per-AC above is the hard gate; test case grouping within each AC is Engineer discretion as long as all 21 assertions exist.

### 7.5 Assertion scaffolding pattern

Modeled after about-v2.spec.ts L174–L198:

```
// pseudo-code, Engineer translates to real TS
const PAPER_ALLOW = ['rgb(26, 24, 20)', 'rgb(42, 37, 32)', 'rgb(107, 95, 78)']
const DISALLOW_ARCH = ['rgb(209, 213, 219)', 'rgb(156, 163, 175)', 'rgb(107, 114, 128)']

test('AC-029-ARCH-BODY-TEXT — body color on all 3 pillars', async ({ page }) => {
  await page.goto('/about')
  const bodies = page.getByTestId('arch-pillar-body')
  await expect(bodies).toHaveCount(3)
  for (let i = 0; i < 3; i++) {
    const color = await bodies.nth(i).evaluate(el => getComputedStyle(el).color)
    expect(PAPER_ALLOW).toContain(color)
    expect(DISALLOW_ARCH).not.toContain(color)
  }
})
```

---

## 8 API Invariance (§No backend / routing / props change)

- **No Python files touched.** `backend/**` unchanged.
- **No API contract change.** `frontend/src/api/*` unchanged. `git diff main -- backend/ frontend/src/api/` expected: 0 lines.
- **No route added / removed / re-gated.** `main.tsx` router unchanged.
- **No component Props interface signature change.** `ArchPillarBlockProps` (L9–L13) and `TicketAnatomyCardProps` (L4–L10) signatures identical pre/post. Adding `data-testid="..."` attributes to JSX elements is an attribute-level addition and does **not** modify the TypeScript interface.
- **No shared primitive touched.** `CardShell.tsx` / `ExternalLink.tsx` unchanged.

Wire-level diff expected on Engineer completion: only `ArchPillarBlock.tsx` + `TicketAnatomyCard.tsx` + `about-v2.spec.ts`. Three files, non-cross-layer, pure frontend visual + test.

---

## 9 Pencil Parity

**Pencil design file (`frontend/design/homepage-v2.pen`) does NOT need update.** Paper palette visual (paper bg + ink/charcoal/muted text) is already the locked design per K-021 / K-022 / K-028 retrospectives. K-029 is a code-to-Pencil alignment fix (implementation lagged the already-approved design), not a design-to-code direction. No `batch_design` operation required.

---

## 10 Implementation Order

1. Engineer Edits `ArchPillarBlock.tsx` (rows 1–3 class + rows 8–9 testid) → `npx tsc --noEmit` exit 0.
2. Engineer Edits `TicketAnatomyCard.tsx` (rows 4–7 class + rows 10–11 testid) → `npx tsc --noEmit` exit 0.
3. Engineer Edits `frontend/e2e/about-v2.spec.ts` — append AC-029-ARCH-BODY-TEXT and AC-029-TICKET-BODY-TEXT describe blocks (21 assertions total).
4. Engineer runs `/playwright` subset (`about-v2.spec.ts` only) → all new 21 assertions + all existing AC-022 assertions PASS.
5. Engineer runs full `/playwright` on host — AC-029-REGRESSION confirms no cross-spec regression.
6. Hand back to PM for Code Review invocation.

Step 1 and 2 are independent (both files are disjoint); step 3 depends on both. No parallelization benefit at 2-file scale.

---

## 11 Risks & Notes

- **Low risk.** Pure visual token replacement; no logic, no state, no API, no routing, no async.
- **Regression trap 1 (avoided by Architect mandate):** if pyramid `<li>` detail and layer span were both set to `text-ink`, hierarchy inversion would make label visually identical to detail. Explicit "child (`<li>` detail) stays `text-muted`" (row 2) preserves contrast step. AC-029-ARCH-BODY-TEXT §And clause ("fixed to rgb(107,95,78)") enforces this at assertion level.
- **Regression trap 2 (avoided):** if badge was set to `text-ink`, it would collide visually with title (`h3 text-ink text-sm`). `text-charcoal` keeps badge distinct.
- **Selector brittleness note:** `data-testid` attributes are the only stable selector path. Engineer must not fall back to class-name selectors (`.text-muted` etc.) — that couples test to implementation detail and the test would pass even if a wrong token were applied. Enforced by mandated testid inj in §6.2.
- **Tailwind JIT sanity check:** `text-muted` / `text-ink` / `text-charcoal` already extended in `tailwind.config.js` under K-021 `theme.extend.colors` (architecture.md L442–L453). No config edit needed; JIT will emit classes.

---

## 12 Refactorability Checklist

- [x] **Single responsibility** — both components already single-responsibility leaves; no change.
- [x] **Interface minimization** — props unchanged; no over-coupling introduced.
- [x] **Unidirectional dependency** — no new imports; existing `CardShell` / `ExternalLink` dependency preserved.
- [x] **Replacement cost** — replacing Tailwind would still only affect these 2 files' className strings; no new coupling.
- [x] **Clear test entry point** — `data-testid` injection makes test entry points explicit and documented.
- [x] **Change isolation** — class changes do not affect API contract; no crossover.

All 6 items pass.

---

## 13 Boundary Pre-emption

| Boundary scenario | Defined? | Resolution |
|-------------------|----------|------------|
| Empty input (body text empty) | ✅ | Body is ReactNode / string; Tailwind color applies to empty element with no rendered char — harmless. |
| Max/min value | ✅ | Colors are discrete tokens, no value-range issue. |
| API error (400/403/500/timeout) | N/A | No API. |
| Concurrency / race | N/A | No state mutation. |
| Empty list (testingPyramid missing on non-third pillar) | ✅ | `testingPyramid?:` optional; Pillar 1 & 2 render no `<ul>`. Assertion `toHaveCount(3)` on `arch-pillar-layer` must account for only Pillar 3 having the pyramid. **Correction:** layer span exists 3× total (Unit + Integration + E2E — three layers inside Pillar 3's single pyramid), not one per Pillar. Assertion `toHaveCount(3)` on `arch-pillar-layer` is correct. Pillar 1 / 2 render no `arch-pillar-layer` element. Engineer must assert `toHaveCount(3)` referring to the three pyramid layers, not to three pillar-level layer slots. |
| Large data | N/A | Static. |

**Clarification for Engineer (critical):** `arch-pillar-body` renders **3 instances** (one per ArchPillarBlock, 3 pillars). `arch-pillar-layer` renders **3 instances** (Unit / Integration / E2E layers in Pillar 3's testing pyramid only; Pillars 1 and 2 have no `testingPyramid` prop). Both `.toHaveCount(3)` — but for different reasons. Document in spec comments to prevent future confusion.

---

## 14 All-Phase Coverage Gate

Single-phase ticket (no multi-phase work). Coverage confirmed:

| Phase | Backend API | Frontend Routes | Component Tree | Props Interface |
|-------|-------------|-----------------|----------------|-----------------|
| 1 (K-029 sole) | N/A (no backend change) | ✅ (§3 Route Impact Table) | ✅ (§2 Blast Radius + §6 implementation checklist) | ✅ (§8 — no props change confirmed explicitly) |

---

## 15 AC ↔ Test Case Count Cross-Check

| AC | Test group | New Playwright assertions |
|----|------------|---------------------------|
| AC-029-ARCH-BODY-TEXT | AC-029-ARCH-BODY-TEXT describe | 3 body + 3 pyramid li + 3 layer span = **9** |
| AC-029-TICKET-BODY-TEXT | AC-029-TICKET-BODY-TEXT describe | 3 body + 3 Outcome + 3 Learning + 3 badge = **12** |
| AC-029-REGRESSION | (no new test; existing about-v2.spec + full suite re-run) | 0 new |

**Total new Playwright assertions: 9 + 12 = 21.** Matches ticket AC §And breakdown (AC-ARCH "3+3+3 = 9 獨立 Playwright 斷言" + AC-TICKET "3+3+6 = 12 獨立 Playwright 斷言"). Cross-check: 9 + 12 = 21 ✓.

---

## 16 Deliverable Summary (for PM review)

- [x] Route Impact Table — §3
- [x] Engineer implementation checklist with 11 rows (7 migrations + 4 testids) — §6
- [x] Playwright selector strategy with exact RGB values — §7
- [x] No backend / API / routing / props interface change statement — §8
- [x] Pencil parity statement — §9
- [x] Pre-Design Audit with `git show main:` truth tables — §1
- [x] Boundary pre-emption, refactorability, all-phase coverage, AC↔test cross-check — §12–§15

---

## Retrospective

**Where most time was spent:** §6 (merging the 7-migration table with the 4-testid injection table into an ordered 11-row Engineer checklist) + §13 boundary clarification on `arch-pillar-layer` toHaveCount (initially almost wrote "one per pillar" which would've been an incorrect mandate since only Pillar 3 has the pyramid).
**Which decisions needed revision:** Boundary §13 layer count clarification caught during Refactorability Checklist re-read — ArchPillarBlockProps allows optional `testingPyramid` but only Pillar 3 passes one; would have caused Engineer to assert `toHaveCount(3)` per pillar (9 total) instead of `toHaveCount(3)` flat. Clarified in §13 before delivery.
**Next time improvement:** When optional props affect DOM node count, explicitly include a "DOM enumeration walk" in §Boundary Pre-emption that states per-consumer instance counts → aggregate expected DOM count per selector. Would catch this class of "optional prop shapes selector count" issue without needing a second read.
