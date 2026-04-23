# Design Exemptions — Pencil SSOT coverage gaps

Registry of (a) routes / surfaces without Pencil frames, and (b) structural / visual elements in code that intentionally deviate from Pencil SSOT. Architect persona Q7c rule forbids producing a design doc for a route without Pencil frames UNLESS that route is listed in §1. Reviewer persona Pencil-parity Step 2 treats any divergence not listed in §2 as a Critical finding.

Any new route or page added to the codebase without a Pencil frame must land in §1 with a linked ticket and explicit rationale. Any code element diverging from Pencil SSOT must land in §2 with PM sign-off citing the rationale category.

---

## §1 Route exemption table

Routes / surfaces without any corresponding Pencil frame by intentional design.

| Route | Ticket | Rationale | Exempt since |
|-------|--------|-----------|--------------|
| `/app` | [K-030](../tickets/K-030-app-page-isolation.md) | `/app` is a standalone prediction tool — isolated viewport, no NavBar, no Footer, non-paper bg. Marketing-site design system (Pencil `homepage-v2.pen`) does not apply; tool UX uses its own ad-hoc layout decided per-feature. No sitewide visual contract. | 2026-04-21 |

---

## §2 Structural exemption table

Code elements that intentionally render content / styling beyond what the Pencil SSOT frame encodes. These are **expected divergences** — Reviewer Pencil-parity gate must cross-reference this table before raising a Critical.

Exemption categories:

- **REGULATORY** — legal / privacy / accessibility chrome mandated by law or policy that Pencil SSOT does not encode (Pencil captures design intent, not regulatory text).
- **RESPONSIVE** — mobile / tablet / desktop breakpoint adaptations of a Pencil value that encodes only one canonical viewport. Pencil's single padding/margin/font-size value is taken as the desktop design target; smaller breakpoints may compress per standard Tailwind responsive idiom.
- **INHERITED** — pre-existing structural layer (ancestor container, wrapper) from earlier tickets that Pencil SSOT did not retroactively re-frame. Requires TD entry pointing to planned reconciliation.
- **INHERITED-editorial** — minimal editorial enhancement applied to a Pencil plain-text node to preserve semantic information that Pencil's flat text encoding cannot carry (e.g., `<code>` monospace spans on file paths within an otherwise-prose paragraph). Pencil text content is preserved verbatim; only inline typographic markup is added. Does NOT authorize adding sentences, reshaping schema, or changing copy — those remain SSOT-bound. PM sign-off cites `feedback_merge_content_authorship.md` reshape-scope boundary (editorial monospace signal is non-reshape; sentence addition is reshape and blocked).

| Component | Pencil frame(s) | Divergence | Category | Ticket | Rationale | Exempt since |
|-----------|----------------|-----------|----------|--------|-----------|--------------|
| `Footer.tsx` | `homepage-v2.pen` `86psQ` + `1BGtd` | Extra child: `<p>This site uses Google Analytics to collect anonymous usage data.</p>` (GA disclosure) appended after the single Pencil text node | REGULATORY | [K-018](../tickets/K-018-ga-tracking.md) AC-018-PRIVACY-POLICY + [K-034](../tickets/K-034-about-spec-audit-and-workflow-codification.md) | GA disclosure is a privacy-policy obligation (K-018 Sacred AC-018-PRIVACY-POLICY). Pencil frames encode visual design intent; regulatory/legal chrome is out of Pencil's scope. Rather than encode regulatory text per frame, declare an umbrella REGULATORY category so future legal chrome (cookie banner, WCAG skip-link, etc.) inherits the same exemption pattern. | 2026-04-23 |
| `Footer.tsx` | `homepage-v2.pen` `86psQ` + `1BGtd` | Horizontal padding: Pencil `padding: [20, 72]` (uniform 72px horizontal); impl `px-6 md:px-[72px]` (mobile 24px, desktop 72px) | RESPONSIVE | [K-034](../tickets/K-034-about-spec-audit-and-workflow-codification.md) Phase 1 | Pencil frames are rendered at fixed desktop width (1280px design target). The mobile 24px horizontal padding is a standard Tailwind responsive idiom inherited from K-021 sitewide design system and signed into K-034 Phase 1 design doc §2.1 NEW column. Pencil SSOT does not encode mobile breakpoints; treating the single Pencil padding value as the desktop target is the convention. | 2026-04-23 |
| `HomePage.tsx` Footer render context | n/a (layout ancestor) | `<Footer />` on `/` renders inside root div `<div className="... sm:pl-[96px] sm:pr-[96px]">`, yielding effective footer width `1280 − 192 = 1088px` at viewport 1280, whereas `/about` and `/business-logic` render `<Footer />` as full-bleed sibling (effective width 1280px) | INHERITED | [K-034](../tickets/K-034-about-spec-audit-and-workflow-codification.md) Phase 1 → TD-K034-08 (deferred to K-036 or later) | Pre-existing HomePage layout from K-017 / K-021. K-034 Phase 1's AC-034-P1-ROUTE-DOM-PARITY asserts byte-identical `<footer>` `outerHTML` across routes — satisfied (the `<footer>` element is identical; only its ancestor padding differs). Cross-route visual container width delta surfaced by new PNG snapshot baselines. Structural reconciliation requires editing HomePage root layout, which is out of K-034 Phase 1 scope (variant-prop retirement only). Tracked as TD-K034-08 for K-036 UI polish batch or a dedicated follow-up ticket. | 2026-04-23 |
| `ReliabilityPillarsSection.tsx` PillarCard body | `homepage-v2.pen` frame `UXy2o.pillar_{1,2,3}.p*BodyText` | `<code className="font-mono text-[13px] bg-ink/5 px-1 rounded not-italic">…</code>` spans wrap file-path tokens `MEMORY.md`, `docs/retrospectives/<role>.md`, `./scripts/audit-ticket.sh K-XXX` inside an otherwise-prose Pencil-verbatim italic body. Pencil encodes these tokens as plain text within `p*BodyText`; impl adds inline monospace signal without altering copy | INHERITED-editorial | [K-034](../tickets/K-034-about-spec-audit-and-workflow-codification.md) Phase 2 §4.8 C-1a | Pencil `p*BodyText` is a single flat italic text node; it has no typographic distinction between narrative prose and file-path tokens. The editorial `<code>` spans restore semantic information (reader recognizes `MEMORY.md` as a literal filename, not an emphasized noun) that Pencil's flat-text encoding cannot carry. Copy itself is Pencil-verbatim — only inline markup is added. Precedent: TicketAnatomyCard schema-reshape editorial authority per `feedback_merge_content_authorship.md`; this exemption narrows the authorization to monospace-signal-only (no sentence additions, no copy changes). Reviewer Pencil-parity gate grep-excludes `<code>` span presence inside `.font-italic` PillarCard body regions. | 2026-04-23 |
| `Footer.tsx` @ /diary | `homepage-v2.pen` `86psQ` + `1BGtd` | Viewport-padding seam at 640–768px: `<main>` ancestor uses `px-6 sm:px-24` (24→96 at sm breakpoint 640px), Footer uses `px-6 md:px-[72px]` (24→72 at md breakpoint 768px) — in the 640–768px window main is desktop-padded but Footer remains mobile-padded | RESPONSIVE | [K-034](../tickets/K-034-about-spec-audit-and-workflow-codification.md) Phase 3 | T1 byte-identity asserted at 1280×800 desktop only; seam not covered by E2E per K-034 Phase 3 Challenge #2 Option A ruling (cost-of-3-viewport-baselines > likelihood-of-visible-regression). Tracker: TD-K034-P3-02. | 2026-04-23 |

---

## Governance

- **Adding a §1 row:** PM approves via ticket linking here; Designer does not need to draw a frame for exempt routes.
- **Removing a §1 row** (route leaves exemption): PM requires Designer to produce a Pencil frame first, then the exempt row is deleted in the same commit.
- **Adding a §2 row:** Reviewer or Engineer surfaces a Pencil-vs-code divergence; PM rules on category (REGULATORY / RESPONSIVE / INHERITED) and approves the entry in the ticket Reviewer-feedback resolution block. Divergences without a category stay Critical until resolved.
- **Removing a §2 row** (divergence reconciled): the reconciliation ticket commits the code fix AND deletes the row in the same commit; Reviewer then verifies Pencil parity without needing the exemption.
- **Reviewer persona Pencil-parity Step 2:** exempt routes (§1) skip Pencil-parity check entirely (but full Playwright / DOM parity still applies). Exempt structural elements (§2) are grep-excluded from node-by-node diff; divergences NOT in §2 → Critical block merge.
