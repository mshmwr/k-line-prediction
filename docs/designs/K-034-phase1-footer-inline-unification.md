---
ticket: K-034 (Phase 1)
title: /about Footer inline one-liner unification — variant prop retirement
status: delivered (Architect) — awaiting PM BQ ruling (BQ-034-P1-01) before Engineer release
architect: 2026-04-23
design-locked: true (PM signed off Designer preflight 8d95c03)
pencil-frames-cited:
  - homepage-v2.pen frame 86psQ (/about consumer — abFooterBar)
  - homepage-v2.pen frame 1BGtd (/ + /business-logic consumer — hpFooterBar)
pencil-specs-json:
  - frontend/design/specs/homepage-v2.frame-86psQ.json
  - frontend/design/specs/homepage-v2.frame-1BGtd.json
pencil-screenshots:
  - frontend/design/screenshots/homepage-v2-86psQ.png
  - frontend/design/screenshots/homepage-v2-1BGtd.png
  - frontend/design/screenshots/homepage-v2-footer-86psQ-vs-1BGtd-side-by-side.png
designer-preflight-commit: 8d95c03
supersedes: docs/designs/K-035-shared-component-migration.md §Footer variant-prop contract (α-premise formally retired)
---

# K-034 Phase 1 — Footer inline one-liner unification

## 0. One-line goal

Retire `FooterProps.variant: 'home' | 'about'`. Collapse `Footer.tsx` to a **single inline one-liner** that mirrors Pencil frames `86psQ` + `1BGtd` (byte-identical one text node `yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn` in Geist Mono 11px). `/`, `/about`, `/business-logic` all render the same Footer DOM. `/diary` and `/app` remain no-Footer (Sacred).

---

## 0.1 Scope Questions (require PM ruling before Engineer release)

### BQ-034-P1-01 — /about GA click-event tracking contract under inline Footer

**Observation:** Current `variant='about'` branch wires **three GA click events** (`contact_email`, `github_link`, `linkedin_link`) via `<a onClick={() => trackCtaClick(...)}>` on the CTA anchors (`Footer.tsx` L46–82). These three events are Sacred per `frontend/e2e/ga-tracking.spec.ts` AC-018-CLICK (L118–159, 3 test cases, all asserting `/about` page_location).

**Conflict:** Pencil ground truth (frames `86psQ` + `1BGtd`, specs JSON at HEAD) shows the /about Footer frame contains **one `type: "text"` node only** — no `<a>` anchors, no CTA-block, no "Let's talk →". The tokens `yichen.lee.20@gmail.com`, `github.com/mshmwr`, `LinkedIn` appear as **plain text inside the single content string** `"yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn"`, separator U+00B7 MIDDLE DOT.

**Three options (PM must choose):**

| Option | Semantics | `ga-tracking.spec.ts` AC-018-CLICK | K-017 AC-017-FOOTER `email link has correct href with mailto prefix` etc. | Pencil fidelity |
|---|---|---|---|---|
| **A** | Plain text, no anchors, no GA click events on /about (Pencil-literal) | 3 tests FAIL → must be deleted or rewritten. K-034 Phase 1 retires those 3 GA events as K-018 Sacred loss. | `about.spec.ts` L311–346 `AC-017-FOOTER` tests FAIL (5 tests asserting `locator('a[href=...]')`) → must also be deleted/rewritten. `about-v2.spec.ts` L264–280 `AC-022-FOOTER-REGRESSION` 3 tests also FAIL. `pages.spec.ts` L71–75 `Footer CTA visible on /about` (`Let's talk →`) FAIL. | 10/10 (byte-identical to Pencil) |
| **B** | Inline one-liner, but the three tokens become `<a>` anchors so GA events keep firing; visual presentation identical to Pencil (Geist Mono 11px #6B5F4E, single line, middle-dot separators). A-7 italic+underline link style from K-022 is NOT applied (to stay visually Pencil-aligned); anchors are styled same as surrounding mono text. | 3 tests PASS (anchors still dispatch `trackCtaClick`). | K-017 / K-022 / pages.spec tests asserting `mailto:`, `https://github.com/mshmwr/k-line-prediction`, `https://linkedin.com/in/yichenlee-career` PASS (hrefs preserved); `Let's talk →` + `Or see the source:` tests FAIL (those strings deleted). | ~9/10 (anchors not shown in Pencil, but visually indistinguishable because we suppress default link styling) |
| **C** | /about renders two children: (i) the inline one-liner `<footer>` (Pencil-matching, plain text, no GA) + (ii) a **separate below-the-footer /about-only "Let's talk" CTA block** preserving K-017/K-018/K-022 Sacred assertions. Footer is single-variant; the CTA block is its own component on /about only. | 3 GA tests PASS (CTA block anchors fire). | K-017/K-022/pages.spec CTA tests PASS (strings preserved in new CTA block). | 7/10 (Footer itself is Pencil-clean; /about gets an extra section that Pencil doesn't show) |

**Sacred invariants at stake:**
- K-017 AC-017-FOOTER (about.spec.ts L311–346, 5 tests): mailto email, GitHub href+target+rel, LinkedIn href+target+rel, `Let's talk →`, `Or see the source:`.
- K-018 AC-018-CLICK (ga-tracking.spec.ts L118–159, 3 tests): contact_email/github_link/linkedin_link fire on /about.
- K-022 A-7 link style Sacred: Newsreader italic + underline on the 3 anchors (only reachable via Option B/C; Option A loses this outright).

**Why Architect cannot self-rule:** Three Sacred clauses (K-017, K-018, K-022) all depend on anchor elements existing on /about. Pencil SSOT shows no anchors. This is an AC-vs-Pencil conflict per `feedback_pm_ac_pen_conflict_escalate.md` — PM must pick a side (or escalate to user).

**Architect's technical note (per persona — recommendation allowed for technical trade-offs, but PM decides):**
- Option A is the cleanest Pencil-literal outcome but retires 3 Sacred clauses simultaneously (K-017 Footer links, K-018 GA CTA events, K-022 A-7 link style). That is a product-scope decision — not an architect call.
- Option B is the minimal-Sacred-loss path (GA tracking + K-017 href preservation kept; only K-017 string-literals `Let's talk →` / `Or see the source:` and K-022 A-7 styling are deleted). Visually indistinguishable from Pencil if anchors are styled-as-text.
- Option C is the safest Sacred-preservation path but **violates Pencil fidelity** by inventing an /about-only section Pencil does not show — which is exactly the class of drift K-034 is meant to end. Not recommended.

**Blocker:** Engineer release blocked until PM rules. Design doc §5+ below assumes Option B provisionally to give Engineer a concrete file-change picture for either A or B outcome; §5.1 calls out exactly which lines differ under each option.

### BQ-034-P1-02 — sitewide-footer.spec.ts `/business-logic` logged-in state — what happens post-variant-retirement?

**Observation:** `sitewide-footer.spec.ts` has 3 tests. After variant retirement, helper `expectFooterHomeVariantVisible` assertions still hold (text / fontSize / color / border-top are all identical between old variant='home' and the new single inline variant). No change required. Listed here for completeness, not as a BQ requiring PM decision — Architect ruling: spec remains unchanged, test-comments can be updated to remove `variant="home"` language in a follow-up sweep.

---

## 1. Pencil Ground Truth (source: `frontend/design/specs/*.json` at HEAD, Designer commit 8d95c03)

### Frame `86psQ` (/about consumer — abFooterBar) — `frontend/design/specs/homepage-v2.frame-86psQ.json`

| Property | Value |
|---|---|
| `frame.type` | `frame` |
| `frame.name` | `abFooterBar` |
| `frame.width` | `fill_container` |
| `frame.padding` | `[20, 72]` |
| `frame.alignItems` | `center` |
| `frame.justifyContent` | `space_between` |
| `frame.stroke` | `{ align: "inside", fill: "#1A1814", thickness: { top: 1 } }` |
| `frame.children.length` | 1 (single text node) |
| `children[0].type` | `text` |
| `children[0].content` | `"yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn"` (separator U+00B7 MIDDLE DOT, not em-dash) |
| `children[0].fontFamily` | `Geist Mono` |
| `children[0].fontSize` | `11` |
| `children[0].fontWeight` | `normal` |
| `children[0].fill` | `#6B5F4E` |
| `children[0].letterSpacing` | `1` |

### Frame `1BGtd` (/ + /business-logic consumer — hpFooterBar) — `frontend/design/specs/homepage-v2.frame-1BGtd.json`

Content-identical to `86psQ`. Only differences per Designer preflight commit message (8d95c03):
- `frame.name`: `hpFooterBar` (vs `abFooterBar`)
- `children[0].id`: `W3zUd` (vs `hpwtD`)
- `86psQ` has extra `children[0].name: "ftR"` (layout composition metadata; visually no effect)

**Parity verdict:** every visually-observable property matches byte-for-byte. Exported PNG SHA1 identical (per preflight commit). **One design, two frame IDs for layout composition only.**

---

## 2. Behavior-diff table (refactor-class ticket — Step 1 per persona)

This table is the **authoritative contract** for Phase 1. Engineer must render a DOM that matches the "NEW" column for each route. Reviewer Step 2 Pencil-parity gate verifies NEW against Pencil ground truth (§1).

### 2.1 /about — INTENTIONAL behavior change (diverges from OLD)

| Input | OLD behavior (variant='about', pre-Phase-1) | NEW behavior (single-variant, post-Phase-1) |
|---|---|---|
| GET `/about` | Renders `<SectionContainer id="footer-cta" width="wide">` wrapping `<Footer variant="about" />`. Inner `<div className="text-center py-8 border-t border-ink/10">` with:<br>• `<p>Let's talk →</p>` (font-mono, text-ink, text-lg bold)<br>• `<a data-testid="cta-email" href="mailto:...">yichen.lee.20@gmail.com</a>` (italic underline)<br>• `<p>Or see the source:</p>`<br>• `<a data-testid="cta-github" target="_blank" rel="noopener noreferrer">GitHub</a>` + `<span>·</span>` + `<a data-testid="cta-linkedin">LinkedIn</a>`<br>• `<p>This site uses Google Analytics...</p>` (font-mono) | Renders `<Footer />` producing `<footer className="font-mono text-[11px] tracking-[1px] text-muted px-6 md:px-[72px] py-5 border-t border-ink w-full">` containing `<div className="flex justify-between items-center"><span>yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn</span></div>` + `<p className="text-center mt-3">This site uses Google Analytics to collect anonymous usage data.</p>` |
| GA click event firing | 3 events defined: `contact_email` / `github_link` / `linkedin_link` fire on anchor click, all with `page_location: "/about"` | **Option A:** 0 GA click events on /about (tokens are plain text).<br>**Option B:** 3 GA click events preserved (tokens become styled-as-text anchors).<br>**Option C:** 3 GA click events preserved via separate CTA block below Footer.<br>*Awaiting BQ-034-P1-01 ruling.* |
| DOM nodes with `data-testid` starting with `cta-` | 3 (`cta-email`, `cta-github`, `cta-linkedin`) | **Option A:** 0. **Option B:** 3 (data-testid preserved on inline anchors). **Option C:** 3 (preserved in separate CTA block). |
| `<a href="mailto:...">`, `<a href="https://github.com/...">`, `<a href="https://linkedin.com/...">` | 3 anchors | **Option A:** 0 anchors, no hrefs. **Option B:** 3 anchors styled-as-text, hrefs preserved. **Option C:** 3 anchors in separate CTA block. |
| `.toBeVisible()` text `Let's talk →` | present | **Option A/B:** absent (deleted). **Option C:** present in separate block. |

### 2.2 / (HomePage) — API不變性 (control)

| Input | OLD behavior (variant='home') | NEW behavior (no variant) | Diff? |
|---|---|---|---|
| GET `/` | `<Footer variant="home" />` → `<footer className="font-mono text-[11px] tracking-[1px] text-muted px-6 md:px-[72px] py-5 border-t border-ink w-full"><div className="flex justify-between items-center"><span>yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn</span></div><p className="text-center mt-3">This site uses Google Analytics...</p></footer>` | `<Footer />` → identical DOM as OLD | **Byte-identical** |
| Footer `.outerHTML` | snapshot X | snapshot X | **0 diff** |
| Computed fontSize / color / border-top-width | 11px / rgb(107,95,78) / >0 | 11px / rgb(107,95,78) / >0 | 0 diff |

### 2.3 /business-logic (BusinessLogicPage) — API不變性 (control)

| Input | OLD behavior (variant='home') | NEW behavior (no variant) | Diff? |
|---|---|---|---|
| GET `/business-logic` (PasswordForm state, logged-in state) | `<Footer variant="home" />` → identical to / | `<Footer />` → identical to / | **Byte-identical, 0 diff** |

### 2.4 /diary, /app — Sacred (no-Footer) preservation

| Route | OLD | NEW | Sacred source |
|---|---|---|---|
| `/diary` | No Footer | No Footer | K-024 `pages.spec.ts` L158 `diary page has no Footer rendered` |
| `/app` | No Footer | No Footer | K-030 `app-bg-isolation.spec.ts` AC-030-NO-FOOTER |

**API不變性證明 — wire-level schema diff:** N/A (this is a frontend-only refactor; no backend schema changes). Frontend observable behavior diff: see §2.2 + §2.3 above — 4 observable axes (outerHTML / fontSize / color / border-top-width) × 2 control routes (/ + /business-logic) = 8 cells, all 0-diff.

---

## 3. Route Impact Table (per persona `feedback_global_style_route_impact_table`; this is a component-level change so the table scope is "all routes consuming Footer or relying on its absence")

| Route | Has Footer pre-Phase-1 | Has Footer post-Phase-1 | Footer DOM changes Y/N | Sacred assertions preserved Y/N | Visual delta Y/N |
|---|---|---|---|---|---|
| `/` | Y (`variant='home'`) | Y (no variant) | **N** (byte-identical — variant='home' branch was already the target DOM) | Y — `sitewide-footer.spec.ts AC-021-FOOTER` / `sitewide-fonts.spec.ts` / `shared-components.spec.ts` AC-035 home test all continue to pass | N |
| `/about` | Y (`variant='about'` CTA block) | Y (no variant — inline one-liner) | **Y — material change** (DOM replaced entirely) | **Pending BQ-034-P1-01:**<br>Option A: K-017/K-018/K-022 Sacred LOST (retired per §6)<br>Option B: K-018 + K-017 hrefs preserved; K-017 string-literals + K-022 A-7 style retired<br>Option C: all K-017/K-018/K-022 Sacred preserved | **Y — intentional (K-035 α-premise retirement; PRD §1.4 user verdict)** |
| `/business-logic` | Y (`variant='home'`) | Y (no variant) | N (byte-identical) | Y — `sitewide-footer.spec.ts` 2 tests pass | N |
| `/diary` | N | N | N (Sacred no-Footer) | Y — `pages.spec.ts` L158, `shared-components.spec.ts` L76 | N |
| `/app` | N | N | N (Sacred no-Footer + isolation) | Y — `app-bg-isolation.spec.ts` AC-030-NO-FOOTER | N |

**Isolation overrides required:** none. /app + /diary already render zero Footer; no additional override needed.

---

## 4. File change list

Assumes **Option B provisionally** (see §5.1 for Option-A diff). All file paths absolute to `frontend/`.

### 4.1 `frontend/src/components/shared/Footer.tsx` (MODIFY — central change)

- **L1 `import { trackCtaClick } from '../../utils/analytics'`**: **Option A** → delete. **Option B** → keep.
- **L3–22 JSDoc block**: rewrite to reflect single-variant contract; remove "K-021 /about separate-footer Sacred" narrative (already retired); remove variant-prop documentation; add `K-034 Phase 1 — variant prop retired; unified inline one-liner sitewide (Pencil frames 86psQ + 1BGtd byte-identical content parity, Designer commit 8d95c03); `/diary` and `/app` render NO Footer (K-024 / K-030 Sacred).`
- **L23–25 `export interface FooterProps { variant: 'home' | 'about' }`**: DELETE the interface entirely. Alternative: keep `export interface FooterProps {}` for future extensibility — Architect recommends **deletion** per Interface-minimization principle.
- **L27 `export default function Footer({ variant }: FooterProps) {`**: change to `export default function Footer() {`.
- **L28–39 `if (variant === 'home') { return (<footer...>) }` branch**: remove the `if` wrapper; keep the `<footer>` JSX as the sole return.
- **L40–88 `variant === 'about'` branch**:
  - **Option A**: delete entire branch (L40–88 including closing `)`).
  - **Option B**: delete entire branch, but: modify the now-sole `<footer>` JSX so the `<span>yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn</span>` is replaced with three inline anchors sharing the parent's `text-muted` color + `font-mono` + `text-[11px]` styling (no italic, no underline — **visually-indistinguishable-from-text** per §0.1 Option B semantics). Structure:
    ```
    <span>
      <a data-testid="cta-email" href="mailto:yichen.lee.20@gmail.com" onClick={() => trackCtaClick('contact_email')} className="[inherit parent mono/color/size; no underline no italic]">yichen.lee.20@gmail.com</a>
      {' · '}
      <a data-testid="cta-github" href="https://github.com/mshmwr/k-line-prediction" target="_blank" rel="noopener noreferrer" onClick={() => trackCtaClick('github_link')} className="[same]">github.com/mshmwr</a>
      {' · '}
      <a data-testid="cta-linkedin" href="https://linkedin.com/in/yichenlee-career" target="_blank" rel="noopener noreferrer" onClick={() => trackCtaClick('linkedin_link')} className="[same]">LinkedIn</a>
    </span>
    ```
    Exact Tailwind class string for anchors: `text-inherit no-underline hover:text-inherit hover:no-underline` (or equivalent to flatten default UA + Tailwind defaults). This is a JSX skeleton — Engineer may refine class tokens so long as computed text-decoration = `none` AND computed color matches parent `#6B5F4E` on all three anchors.
  - **Option C**: delete entire branch here; add new component `components/about/AboutCtaBlock.tsx` (see §4.6 below).

### 4.2 `frontend/src/pages/HomePage.tsx` (MODIFY)

- **L25 `<Footer variant="home" />`**: change to `<Footer />`. No other changes.

### 4.3 `frontend/src/pages/AboutPage.tsx` (MODIFY)

- **L70 comment `{/* S7 — Footer variant="about" (shared sitewide) */}`**: change to `{/* S7 — Footer (shared sitewide; K-034 Phase 1 unified) */}`.
- **L71 `<SectionContainer id="footer-cta" width="wide">`**: **Option A/B** → delete the `<SectionContainer>` wrapper. Render `<Footer />` directly at `AboutPage` root-div level (same level as DossierHeader + other top-level children) so it is a full-bleed sibling matching / + /business-logic layout. **Option C** → keep `<SectionContainer>` wrapping the new `<AboutCtaBlock />` (CTA block is the wide-container content); Footer itself goes outside the container.
- **L72 `<Footer variant="about" />`**: change to `<Footer />` (+ placement shift per above).
- **Option C only:** add `<AboutCtaBlock />` before Footer (inside its own SectionContainer).

### 4.4 `frontend/src/pages/BusinessLogicPage.tsx` (MODIFY)

- **L117 `<Footer variant="home" />`**: change to `<Footer />`. No other changes.

### 4.5 `frontend/e2e/shared-components.spec.ts` (REWRITE assertions — see §6)

### 4.6 `frontend/src/components/about/AboutCtaBlock.tsx` (NEW — Option C only)

- Extracted from current `variant='about'` branch body; renders "Let's talk →", email/GitHub/LinkedIn anchors, A-7 italic+underline styling, GA click tracking.
- One-sentence responsibility: /about-only CTA block preserving K-017/K-018/K-022 Sacred after Footer goes Pencil-inline.
- **Only created if PM chooses Option C.**

### 4.7 E2E spec cascade (depends on BQ-034-P1-01 ruling)

| Spec file | Option A | Option B | Option C |
|---|---|---|---|
| `about.spec.ts` L311–346 `AC-017-FOOTER` (5 tests) | **DELETE all 5** (add comment: K-017 Footer CTA retired in K-034 Phase 1 per PM ruling) | **MODIFY 4** (tests asserting mailto/github/linkedin href keep passing; **DELETE 1** `Let's talk` + **DELETE 1** `Or see the source:` — 2 string-literal assertions removed) | **KEEP as-is** (CTA block still renders) |
| `about-v2.spec.ts` L264–280 `AC-022-FOOTER-REGRESSION` (3 tests) | DELETE all 3 | DELETE `Let's talk →` + `Or see the source:` (2 of 3); KEEP email link test | KEEP as-is |
| `pages.spec.ts` L71–75 `Footer CTA visible on /about` (`Let's talk →`) | DELETE | DELETE | KEEP |
| `ga-tracking.spec.ts` L118–159 `AC-018-CLICK` (3 tests) | DELETE all 3 | KEEP as-is (anchors still fire) | KEEP as-is |
| `sitewide-footer.spec.ts` | comment-only sweep (remove `variant="home"` phrasing); 3 tests stay | same | same |
| `sitewide-fonts.spec.ts` L38–53 | comment-only sweep; tests stay | same | same |
| `shared-components.spec.ts` | REWRITE per §6 | REWRITE per §6 | REWRITE per §6 |
| `ga-tracking.spec.ts` L216–226 `AC-018-PRIVACY-POLICY` GA disclosure | KEEP (GA disclosure text `This site uses Google Analytics to collect anonymous usage data.` preserved in Pencil-matching Footer on all routes incl. /about) | KEEP | KEEP |

### 4.8 Footer JSDoc cross-link

`docs/designs/K-035-shared-component-migration.md` remains as historical record. Add single-line header annotation at top of that doc: `**Superseded 2026-04-23 by K-034 Phase 1 — variant prop retired; α-premise empirically refuted. See `docs/designs/K-034-phase1-footer-inline-unification.md`.**` (Not strictly Phase 1 AC, but prevents future readers from mistaking K-035 design as current.)

---

## 5. Implementation order (Engineer step plan)

1. **Step 1:** Read this design doc + `frontend/design/specs/homepage-v2.frame-86psQ.json` + `homepage-v2.frame-1BGtd.json` + side-by-side PNG (Engineer Step 0 persona gate).
2. **Step 2:** Edit `Footer.tsx` — retire `variant` prop, collapse to single return. Style-assert Option B anchors in dev server with DevTools `getComputedStyle` if applicable.
3. **Step 3:** Edit `HomePage.tsx` L25 (remove `variant="home"`).
4. **Step 4:** Edit `BusinessLogicPage.tsx` L117 (remove `variant="home"`).
5. **Step 5:** Edit `AboutPage.tsx` L70–72 (remove `variant="about"`, unwrap SectionContainer per Option A/B; add `<AboutCtaBlock />` per Option C).
6. **Step 6:** Rewrite `shared-components.spec.ts` per §6 OLD-vs-NEW assertion strategy.
7. **Step 7:** Cascade-update dependent specs per §4.7 matrix (conditional on PM's BQ ruling).
8. **Step 8:** Run `npx tsc --noEmit` → 0 errors.
9. **Step 9:** Run full Playwright suite. Expected outcomes by option:
   - **Option A:** `shared-components.spec.ts` PASS; `about.spec.ts AC-017-FOOTER` / `about-v2.spec.ts AC-022-FOOTER-REGRESSION` / `pages.spec.ts Footer CTA` / `ga-tracking.spec.ts AC-018-CLICK` all deleted → not in the run; overall suite green.
   - **Option B:** All of above + GA AC-018-CLICK + K-017 href assertions PASS; string-literal assertions deleted.
   - **Option C:** All OLD Sacred specs still PASS (CTA block preserved on /about) + new `shared-components.spec.ts` byte-diff PASS.
10. **Step 10:** Run fail-if-gate-removed dry-run (§7) — commit 1 revert commit to re-add variant branch, confirm spec FAILs, revert to green.
11. **Step 11:** Run deploy checklist (K-Line-Prediction CLAUDE.md §Deploy Checklist — API_BASE grep, `npm run build`, `firebase deploy`).
12. **Step 12:** Populate §Deploy Record block in K-034 ticket.

### Parallelizable steps

- Steps 3/4 independent of each other (both are 1-line Footer prop removes; same file class).
- Step 7 cascade can be partly parallelized per spec file (all 6 specs are independent test files).

### Dependency order

- Step 2 must precede 3/4/5 (Footer signature change is upstream of call-site changes — TS error otherwise).
- Step 6 must precede Step 9 (new spec must be in place before suite run).
- Step 10 must precede Step 11.

---

## 5.1 Option A vs Option B vs Option C — file-change delta

| File | Option A | Option B | Option C |
|---|---|---|---|
| `Footer.tsx` | 63 lines removed; `trackCtaClick` import removed | ~50 lines removed, ~6 lines added (inline anchors + onClick handlers) | 63 lines removed; `trackCtaClick` import removed |
| `AboutPage.tsx` | L70–72 replaced with `<Footer />` at root level | same | L71 keeps SectionContainer wrapping new `<AboutCtaBlock />`; Footer added outside |
| `components/about/AboutCtaBlock.tsx` | — | — | NEW file (content = current variant='about' body + GA click handlers + A-7 italic-underline style + K-017 strings) |
| E2E cascade | 12 tests deleted | 3 tests modified, 4 tests deleted | 0 tests deleted (all Sacred preserved) + shared-components.spec.ts rewrite |

---

## 6. `shared-components.spec.ts` OLD vs NEW assertion strategy

### 6.1 Strategy table

| Dimension | Current (pre-Phase-1) | New (post-Phase-1) |
|---|---|---|
| Assertion shape | Per-variant DOM structure assertion: "home" variant asserts `<span>yichen.lee.20...LinkedIn</span>` + GA text (1 route); "about" variant asserts `Let's talk →` + cta-email/github/linkedin anchors + A-7 italic style (1 route); "/diary no-Footer" assertion (1 route) | Cross-route **byte-identical `outerHTML`** assertion: /, /about, /business-logic all return the same Footer `outerHTML` string — this single assertion replaces the 3 structural sub-assertions |
| Route coverage | /, /about (variant-specific), /diary (negative) | /, /about, /business-logic (all three render-identical), /diary (negative — unchanged) |
| Test count | 3 `test(...)` blocks in 3 `describe` blocks | 4 `test(...)` blocks in 2 `describe` blocks (see §6.2) |
| Variant modulo | YES (variants allowed to differ; `a/b` divergence is Sacred) | NO (all must byte-match; any divergence = FAIL) |
| /business-logic coverage | NOT asserted (deferred to `sitewide-footer.spec.ts` per K-035) | **Explicitly asserted** (part of cross-route byte-diff set) |

### 6.2 New test case plan (4 test IDs)

| Test ID | Describe / Test name | AC | Shape |
|---|---|---|---|
| **T1** | `AC-034-P1-ROUTE-DOM-PARITY — / + /about + /business-logic Footer byte-identical outerHTML` | AC-034-P1-ROUTE-DOM-PARITY | Visit each of 3 routes, capture `await page.locator('footer').last().evaluate(el => el.outerHTML)`; assert all 3 strings are `===` each other (after normalization of React-generated dynamic id attrs if any). Single test, 3 page navigations. |
| **T2** | `AC-034-P1-FOOTER-UNIFIED — footer contains only Pencil-canonical text` | AC-034-P1-FOOTER-UNIFIED + ROUTE-DOM-PARITY text sub-assertion | Visit `/`, assert footer innerText includes exactly `yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn` (U+00B7) AND `This site uses Google Analytics to collect anonymous usage data.` |
| **T3** | `AC-034-P1-NO-ABOUT-CTA — /about has no "Let's talk" CTA block` | AC-034-P1-NO-ABOUT-CTA | Visit `/about`; assert `getByText("Let's talk →", { exact: true })` has count 0 (Option A/B); OR count 1 (Option C). **This test's expected value is BQ-dependent.** |
| **T4** | `AC-034-P1-NO-FOOTER-ROUTES — /diary has no Footer rendered` | AC-034-P1-NO-FOOTER-ROUTES | Visit `/diary`; assert `locator('footer')` count 0 AND `getByText(...footer-content-string...)` count 0 (preserves existing K-024 Sacred). (`/app` absent-Footer covered by existing `app-bg-isolation.spec.ts AC-030-NO-FOOTER` — not duplicated here per §feedback_shared_component_inventory_check.) |

### 6.3 AC ↔ Test case count cross-check (per persona hard gate)

Ticket AC block (K-034.md §Phase 1) declares 6 Phase 1 AC total: FOOTER-UNIFIED, ROUTE-DOM-PARITY, NO-ABOUT-CTA, NO-FOOTER-ROUTES, FAIL-IF-GATE-REMOVED, DEPLOY. Of these:
- **FOOTER-UNIFIED + ROUTE-DOM-PARITY + NO-ABOUT-CTA + NO-FOOTER-ROUTES** → `shared-components.spec.ts` new tests T1/T2/T3/T4 = **4 tests**.
- **FAIL-IF-GATE-REMOVED** → dry-run procedure (§7), no steady-state test (self-describing: "if gate removed, spec must FAIL"; dry-run enacted once during Phase 1 close).
- **DEPLOY** → verified by executing `curl <live-URL>/assets/index-<hash>.js | grep -v "Let's talk"` = 0 matches; no Playwright test.

**Minimum new Playwright test count for shared-components.spec.ts: 4.** Table §6.2 has 4 rows. **Match ✓.**

### 6.4 `outerHTML` normalization note

React may emit `data-reactroot` or React 18 hydration-marker attrs that differ across routes only by internal ordering; if so, test helper normalizes via regex strip before `===` compare. If `outerHTML` still differs by a trivial class ordering (Tailwind JIT typically stable), we may fall back to comparing a structured snapshot (`{ tag, attrs sorted, children: [...] }` tree) — Engineer picks the minimal-normalization approach that still catches "CTA block re-introduced" as FAIL. Contract is preserved: dry-run §7 must cause at least one route's normalized snapshot to diverge.

---

## 7. AC-034-P1-FAIL-IF-GATE-REMOVED dry-run procedure

Engineer Step 10 (before Phase 1 close):

1. On feature branch with all Phase 1 commits landed + tests green, create local temporary edit on `Footer.tsx`:
   - Re-add `interface FooterProps { variant: 'home' | 'about' }` and the `variant='about'` branch (copy from `git show 8d95c03~1:frontend/src/components/shared/Footer.tsx` pre-Phase-1 state).
   - Re-add `variant="about"` to `AboutPage.tsx` L72.
2. Run `npx playwright test frontend/e2e/shared-components.spec.ts`.
3. Expected: `AC-034-P1-ROUTE-DOM-PARITY` T1 **FAILs** (`/about outerHTML !== / outerHTML`); **AND** `AC-034-P1-NO-ABOUT-CTA` T3 **FAILs** (Option A/B context: `"Let's talk →"` count is now 1, not 0).
4. Revert temporary edit (`git checkout -- Footer.tsx AboutPage.tsx`).
5. Re-run `npx playwright test`; expected: all green.
6. Record dry-run result in K-034 ticket Engineer Step 10 block (actual FAIL messages pasted in).

**Gate strength:** FAIL must come from assertion mechanics, not from cosmetic order instability. If normalization in §6.4 is too aggressive (over-strips), dry-run might still pass with variant branch re-added → Engineer Step 10 catches this before Phase 1 close; Architect is notified if such over-normalization is discovered and this design doc is re-Edited.

---

## 8. Sacred invariants cross-check (per `feedback_pm_ac_sacred_cross_check`)

| Sacred source | Assertion | Phase 1 impact | Result |
|---|---|---|---|
| K-017 AC-017-FOOTER | `about.spec.ts` L311–346: `Let's talk →`, email mailto, `Or see the source:`, GitHub+LinkedIn href+target+rel | **Option A: RETIRED** (conflicts with Pencil). **Option B: partial retirement** (string literals go; hrefs preserved). **Option C: preserved** in AboutCtaBlock. | **BQ-034-P1-01** |
| K-018 AC-018-CLICK | `ga-tracking.spec.ts` L118–159: `contact_email`/`github_link`/`linkedin_link` fire on /about anchor click | **Option A: RETIRED**. **Option B: preserved** (anchors still fire). **Option C: preserved**. | **BQ-034-P1-01** |
| K-022 A-7 link style | italic + underline on 3 anchors on /about | **Option A: RETIRED**. **Option B: RETIRED** (styling removed to stay Pencil-visually-clean). **Option C: preserved** in AboutCtaBlock. | **BQ-034-P1-01** |
| K-024 /diary no-Footer | `pages.spec.ts` L158, `shared-components.spec.ts` T4 | Unchanged | **PRESERVED ✓** |
| K-030 /app isolation | `app-bg-isolation.spec.ts AC-030-NO-FOOTER` | Unchanged | **PRESERVED ✓** |
| K-035 variant-prop contract | `shared-components.spec.ts` AC-035-CROSS-PAGE-SPEC DOM-equivalence-modulo-variant | **Explicitly retired** per K-034 PRD §1.4 user verdict (α-premise empirically refuted) | **INTENTIONAL RETIREMENT** |
| `sitewide-footer.spec.ts AC-021-FOOTER` | `/` + `/business-logic` Footer 11px/muted/border-top | Passes as-is post-Phase-1 (computed styles unchanged) | **PRESERVED ✓** |
| `sitewide-fonts.spec.ts` | `/` Footer Geist Mono | Passes as-is | **PRESERVED ✓** |
| `ga-tracking.spec.ts AC-018-PRIVACY-POLICY` | GA disclosure text visible on / and /about | Passes as-is (disclosure text preserved in all 3 route Footers) | **PRESERVED ✓** |

**Verdict:** Phase 1 has **no Sacred conflict** for any route except /about. /about conflict is already PM-visible via BQ-034-P1-01. No other blockers.

---

## 9. Shared-component inventory cross-check (per `feedback_shared_component_inventory_check`)

`docs/designs/shared-components-inventory.md` Footer row already declares:

> Footer · allowed variants: **0 (Phase 1 retires `variant` prop per AC-034-P1-FOOTER-UNIFIED)**

→ allowed-variants count goes **0 → 0** (was already 0 in Phase 0 MVP reflecting post-Phase-1 target state). **No inventory Edit required in Phase 1.**

Consuming routes cell: `/`, `/about`, `/business-logic` — unchanged post-Phase-1. **No inventory Edit required.**

Pencil frame IDs cell: currently lists `4CsvQ`, `86psQ`, `1BGtd`, `35VCj footer subtree`. Post-Phase-1 the only frames carrying current design are `86psQ` + `1BGtd`. **Recommended (not required) housekeeping Edit:** remove `4CsvQ` and `35VCj` from the cell (they are historical — `4CsvQ` was K-021 pre-K-035 `HomeFooterBar`, `35VCj` was K-035 `variant='about'` basis). Architect ruling: defer to TD (low-value housekeeping); Phase 1 close does not need this.

---

## 10. TSC / downstream grep (Phase 1 complete)

`grep -rn "variant" frontend/src/components/shared/Footer.tsx` → 0 matches post-Phase-1 (confirms AC-034-P1-FOOTER-UNIFIED).

`grep -rn "Footer" frontend/src/ frontend/e2e/` → Expected matches post-Phase-1:
- `frontend/src/components/shared/Footer.tsx` (self-references in JSDoc)
- `frontend/src/pages/HomePage.tsx` (import + `<Footer />`)
- `frontend/src/pages/AboutPage.tsx` (import + `<Footer />`)
- `frontend/src/pages/BusinessLogicPage.tsx` (import + `<Footer />`)
- `frontend/src/components/StatsPanel.tsx` L24/L53 (`buildFooterLabels` — unrelated K-Line chart code; false-positive)
- E2E spec references across ~8 specs (all comment-level or `locator('footer')` assertions).

No TS errors expected post-Phase-1 (prop removal from interface + removal from all 3 call-sites is complete; no orphan usages).

---

## 11. Refactorability Checklist

- [x] **Single responsibility:** Footer renders sitewide footer only. ✓
- [x] **Interface minimization:** `FooterProps` deleted (no props). ✓
- [x] **Unidirectional dependency:** /pages → shared/Footer. ✓
- [x] **Replacement cost:** Footer is a single JSX block; swap to a layout-slot model later would require 3 page Edits (same as today). ✓
- [x] **Clear test entry point:** `shared-components.spec.ts` byte-diff + `sitewide-footer.spec.ts` computed-style = clear contract. ✓
- [x] **Change isolation:** removing `variant` prop doesn't affect API contract (frontend-only); only affects 3 call-sites + Footer internals. ✓

---

## 12. All-Phase Coverage Gate

| Phase | Backend API | Frontend Routes | Component Tree | Props Interface |
|---|---|---|---|---|
| Phase 1 (this doc) | ✅ N/A (frontend-only refactor) | ✅ /, /about, /business-logic, /diary, /app all covered in §3 | ✅ Footer single-variant + 3 call sites + optional AboutCtaBlock (Option C) in §4 | ✅ `FooterProps` deleted; no new props |
| Phase 2 (deferred) | — | — | — | — (design at Phase 1 close) |

---

## 13. Self-Diff Verification (architecture.md sync, per persona rule)

- **Section edited (pending):** `agent-context/architecture.md` L510–516 Footer placement table + L520–523 Shared Components table + L179–180 Directory Structure comment on `components/shared/Footer.tsx` + bottom Changelog entry.
- **Source of truth:** this design doc §3 Route Impact Table + §4 File change list + Footer actual post-Phase-1 signature.
- **Pre-Write name-reference sweep (architecture.md):** `grep -n 'variant' agent-context/architecture.md` run by Architect during this doc's writing — hits: L180 `props \`variant: 'home' | 'about'\``, L512–513 `<Footer variant="home" />` / `<Footer variant="about" />`, L516 `<Footer variant="home" />`, L523 `/ 透過 variant="home" ...`. Four current-state locations need Edit to drop `variant`; zero Changelog locations (preserved as K-035 history).
- **Row count comparison (Footer placement table):** 5 rows vs 5 rows (`/`, `/about`, `/diary`, `/app`, `/business-logic`) — **will remain 5 rows** post-Phase-1; cells L512/L513/L516 updated to `<Footer />` (no variant); L514/L515 unchanged.
- **Row count comparison (Shared Components table):** 2 rows vs 2 rows — L523 Footer row "used for" cell updated to drop `variant="home"` / `variant="about"` language.
- **Same-file cross-table sweep:** grep `Footer` hit ~12 locations in architecture.md; 4 current-state locations Edited, 8 Changelog locations preserved (historical).
- **Discrepancy:** none expected; Engineer Step (post-implementation) runs this Edit as part of PR — Architect has NOT landed the architecture.md Edit yet in this session per `feedback_architect_must_update_arch_doc.md` requirement to sync per-ticket; Architect will Edit architecture.md in the SAME session AFTER this design doc is written, before declaring Phase 1 Architect task complete.

→ **Architect will now Edit architecture.md** immediately after this file is written, with a §13 drift-fix block that matches the Edit plan above. See §Changelog below.

---

## Retrospective

### Architect

**Where most time was spent:** cross-checking Sacred invariants (K-017 / K-018 / K-022) against Pencil ground-truth; discovered all three depend on `<a>` anchors that Pencil does not show. This surfaced BQ-034-P1-01 as a non-trivial product-decision blocker. Without the cross-check, Phase 1 would have shipped Option A by default and silently retired 3 Sacred clauses — the exact class of α-premise failure K-034 is meant to prevent.

**Which decisions needed revision:** Initial draft of this doc proposed Option B as the architect recommendation (minimal Sacred loss). Second pass reclassified it to **BQ escalated to PM** per `feedback_ticket_ac_pm_only.md` + `feedback_pm_ac_pen_conflict_escalate.md` — retiring K-017/K-018/K-022 Sacred is a PRODUCT decision, not a technical one. Architect may propose trade-offs but must not decide.

**Next time improvement:** When a refactor-class ticket aims to retire a design drift, the Architect's first pass should enumerate **every Sacred spec touching the refactor's visual surface** before scoring implementation options. The `ga-tracking.spec.ts` cross-dependency (3 GA events bound to 3 anchors on /about) is non-obvious from Footer.tsx alone — it only surfaces when grepping `data-testid="cta-"` sitewide and tracing anchor behavior. Codify: for any component refactor touching `<a>` elements, grep `trackCtaClick` + `data-testid="cta-"` + `target="_blank"` across spec suite and include the cross-dependency matrix in §8 Sacred cross-check.

---

## Changelog (architect-authored, this doc)

- 2026-04-23 — Architect (K-034 Phase 1 design doc landed). Pencil JSON specs 86psQ + 1BGtd read verbatim as ground truth (content-identical). Design doc BQ-034-P1-01 escalated to PM for /about GA click-event tracking contract under inline Footer (3 Sacred clauses affected: K-017/K-018/K-022). architecture.md Edit to follow in same session.
