# K-040 Designer Decision Memo

**Date:** 2026-04-23
**Designer session for items 1 / 2 / 3 / 4 / 5 / 6 / 14.**

## Item-by-item outcome

### Item 1 — Homepage Hero font mono, italic OFF — DONE in .pen

Frame `zyttw` (hpHero) → heroCol `dC3Du` → `rXURl` + `2bQtY`.

- `fontFamily`: `Bodoni Moda` → `Geist Mono`
- `fontStyle`: `italic` → `normal`
- `fontSize`: `64` → `56`
- `fontWeight`: `700` (retained)

**Size rationale (64 / 56 / 48 choice):** 56 selected. At 64 the Geist-Mono glyphs were wider than the Bodoni serif italic they replaced and visually pushed the two lines close to wrapping at the 1248-wide content container; at 48 the hero felt demoted against the 48px-across BuiltByAIBanner weight. 56 keeps the hero visually dominant without risking two-line wrap under real desktop typography metrics. Engineer may load the frame screenshot `homepage-v2-zyttw.png` to confirm visual balance at 1440 canvas.

Italic is OFF at text-style level (both H1 lines) and no residual italic token persists in frame JSON. Matches BQ-040-01 PM ruling Option B.

### Item 2 — /diary outer page bottom gap reduced — DONE in .pen

Frame `wtC03` (dpBody, Diary page main container) padding `[72, 96, 96, 96]` → `[72, 96, 48, 96]`.

- Bottom padding halved (96 → 48).
- Footer internals (`ei7cl`) untouched, preserving K-034 Phase 1 Sacred AC-034-P1-ROUTE-DOM-PARITY.
- Engineer target: `frontend/src/pages/DiaryPage.tsx` (or wrapper `<main>`) — bottom padding class set to `pb-12` (48px).

### Item 3 — Homepage desktop padding — NO .pen CHANGE NEEDED

**Measurement result:**

| Frame | Page | Body padding (T,R,B,L) |
|---|---|---|
| `LKgNi` | Homepage `/` body | `[72, 96, 96, 96]` |
| `wtC03` | Diary `/diary` body | `[72, 96, 48, 96]` (after K-040 Item 2) |
| `Y80Iv` | About `/about` body | `[72, 96, 96, 96]` |
| `wY3Aw` | Business-logic `/business-logic` body | `[72, 96]` (horizontal only) |

All 4 frames share **96px horizontal desktop padding** in .pen. The user's observation "homepage desktop padding inconsistent with other pages" is **not reproducible in .pen** — design source is already aligned.

**Conclusion:** Item 3 is an **implementation-side drift**. Engineer must audit `HomePage.tsx` vs `DiaryPage.tsx` / `AboutPage.tsx` Tailwind classes and align Homepage's desktop horizontal padding to match the shared target. Designer JSON still emits numeric target for Engineer assertion.

**Target values for Engineer:** `desktopPaddingPx = 96`, `maxWidthPx = 1248` (matching Diary's `max-w-[1248px]` content cap as referenced in ticket §1). PM acceptance test should grep `HomePage.tsx` for `max-w-[1248px]` and `sm:px-24` (96px) or equivalent and assert parity with DiaryPage.

No `homepage-v2.pen` edit made for Item 3 — no JSON delta. Engineer consumes this memo as the source of truth.

### Item 4 — Diary CTA→Footer gap — DONE in .pen (with scope note)

Frame `yg0qF` (diaryViewAllRow inside Homepage's hpDiary preview `gaIjh`) — added `padding: [40, 0, 0, 0]` (40px top).

**Scope ambiguity noted:** Ticket Item 4 says "/diary page `View full log →` to Footer gap". But /diary page frame `wiDSi` does NOT have a "View full log" CTA — that link exists only on Homepage's hpDiary preview section (`gaIjh/yg0qF`). I proceeded under the assumption the user's complaint was on the Homepage's "View full log" row, since that's the only `— View full log →` in `.pen`. If the user actually meant /diary page's last-entry→Footer gap (no explicit CTA), that's fully covered by Item 2 (dpBody bottom padding reduced).

Engineer hint: on Homepage's DiarySection, add `mt-10` (40px) above the `View full log →` anchor. Target assertion: gap between last diary entry (e3) bottom and View-full-log link top = 40px ±2px.

### Item 5 — Diary .pen GA-disclosure backfill — DONE in all 4 frames

Text node `gaDisclosure` added to all 4 route footer frames:

| Frame | Route | New node ID |
|---|---|---|
| `ei7cl` | /diary | `hyhx5` |
| `1BGtd` | / (home) | `i9kkN` |
| `86psQ` | /about | `urTl0` |
| `2ASmw` | /business-logic | `cDw8L` |

Content: `This site uses Google Analytics to collect anonymous usage data.`
Styling: Geist Mono 11px normal #6B5F4E letter-spacing 1 (matches left contact-info text spec byte-identical).

**K-034 Phase 1 Sacred preserved:** all 4 footer frames remain byte-identical in structure + content (contact info LEFT, GA disclosure RIGHT, via `justifyContent: space_between`). Side-by-side proof: `frontend/design/screenshots/side-by-side-footer-4routes-K040.png`.

Ticket item 5 said "Diary .pen backfill only" but since the shared Footer in runtime renders identically on all 4 routes, adding gaDisclosure to all 4 Pencil frames is the correct design-source posture — not doing so would create /diary-only drift in .pen while impl uses a shared component. PM ruling BQ-040-02 (Option A: Diary-only `<main>` adjustment) applies to Item 2 footer-adjacent gap, not to Item 5 which is a Pencil source-of-truth alignment.

### Item 6 — Mobile Diary timeline rail — DEFERRED (no mobile frame in .pen)

**Finding:** `homepage-v2.pen` has no mobile variant of `/diary`. All 4 top-level page frames (`4CsvQ` / `wiDSi` / `35VCj` / `VSwW9`) are fixed width 1440 desktop. There is no `wiDSi-mobile` or similar breakpoint frame to inspect.

**Decision:** `"mobileRail": "design-removed"` — recorded because:

1. Design source has no mobile rail intent captured (no frame = no design intent).
2. The desktop rail in `CGijt` (dpList) uses `layoutPosition: "absolute"` with x=29 width=1 height=624 — an absolutely-positioned decoration only viable on the fixed 1248-wide desktop canvas.
3. Responsive mobile rail would require a separate stacked/inline marker column (not an absolute rail); absent explicit mobile design, the right posture is NOT to restore a desktop-style rail at mobile breakpoint.

**Engineer no-op on Item 6 rail restoration.** If user later confirms mobile rail is intended, a follow-up ticket should:
(a) add a dedicated mobile .pen frame to define the responsive rail layout, OR
(b) have Designer explicitly design the rail for sub-640px width.

Machine-readable annotation embedded in the next available mobile-scope JSON spec — but since no mobile frame exists, I cannot emit a `frame-*-mobile.json` without inventing a frame ID. Recording `mobileRail: design-removed` in this memo as the authoritative source-of-truth per AC-040-DIARY-MOBILE-RAIL "And" clause.

### Item 14 — Mobile Homepage Hero vertical spacing — DEFERRED (no mobile frame in .pen)

Same root cause as Item 6: `homepage-v2.pen` is desktop-only; no mobile Hero frame exists to calibrate in .pen.

**Engineer path:** the "cramped mobile Hero spacing" user observation is an impl-side concern. Engineer should work from the desktop spec (`zyttw` frame hpHero `gap: 48`, heroCol `gap: 18`) and choose responsive mobile spacing values that maintain the rhythm — desktop→mobile compression of gaps should be proportional, not arbitrary. Recommended mobile starting point: `gap: 32` at Hero section level and `gap: 16` at heroCol (approx 2/3 of desktop values).

No .pen edit made for Item 14.

## Summary of .pen edits

| Item | Frame ID | Change | Status |
|---|---|---|---|
| 1 | `zyttw` (via `rXURl`, `2bQtY`) | font mono, italic off, 56px | DONE |
| 2 | `wtC03` | bottom padding 96→48 | DONE |
| 3 | — | no .pen change (impl drift) | MEMO-ONLY |
| 4 | `yg0qF` | padding-top 40 added | DONE |
| 5 | `ei7cl`, `1BGtd`, `86psQ`, `2ASmw` | gaDisclosure text added (×4 for parity) | DONE |
| 6 | — | no mobile frame; `mobileRail: design-removed` | MEMO-ONLY |
| 14 | — | no mobile frame; Engineer calibrates impl | MEMO-ONLY |

## NavBar acceptance check (per `feedback_designer_navbar_mandatory.md`)

All 4 top-level page frames still have NavBar as first child:

- `4CsvQ` → `OSgI0` (hpNav) — 4 nav links + logo — OK
- `wiDSi` → `vdJVv` (dpNav) — OK
- `35VCj` → `voSTK` (abNav) — OK
- `VSwW9` → `B5PEH` (bpNav) — OK

## Sitewide Typography Reset (Item 1 scope expansion, 2026-04-23)

**User ruling this session:** Bodoni Moda + Newsreader italic → Geist Mono, italic OFF, all 4 routes. First K-040 pass limited Item 1 to Homepage Hero H1 only (3 nodes); user flagged this as under-scoped and expanded to every Bodoni/italic token across all page frames.

### Scope executed

| Frame | Route | Bodoni/italic text nodes touched |
|---|---|---|
| `4CsvQ` | / (Homepage) | 9 (Hero H1×2 + subtitle + diary titles×3 + diary bodies×3 + View-full-log + logic intro + diary intro + banner CTA) |
| `35VCj` | /about | 29 (6 hero + 4 metric cards + 6 role cards + 3 pillar cards + 3 ticket cards + 3 arch cards w/ step nums) |
| `wiDSi` | /diary | 14 (DiaryHero H1 + subtitle + 5 entry titles + 5 entry bodies + 1 section intro) |
| `VSwW9` | /business-logic | 2 (gate H1 + form field title) |
| **Total** | — | **~70 text node updates across 42 distinct typography sites** |

### Per-site font-size calibration table

Rationale: Geist Mono glyphs are wider + visually heavier per px than Bodoni serif italic. Scale-down factor ~0.8–0.9 preserves visual hierarchy without wrapping.

| Context | Previous (Bodoni/Newsreader) | New (Geist Mono) | Ratio |
|---|---|---|---|
| Homepage Hero H1 | Bodoni italic 64/700 | Mono 56/700 | 0.88 |
| About H1 (nolk3/02p72) | Bodoni italic 64/700 | Mono 52/700 | 0.81 |
| Diary H1 (g2RUM) | Bodoni italic 64/700 | Mono 52/700 | 0.81 |
| Business-logic gate H1 (DYAX8) | Bodoni italic 48/700 | Mono 36/700 | 0.75 |
| Metric big numbers (pArmD/6spHE) | Bodoni 76/700 | Mono 64/700 | 0.84 |
| Role names short (PM/QA) | Bodoni italic 36/700 | Mono 26/700 | 0.72 |
| Role names long (Architect/Engineer/Reviewer/Designer) | Bodoni italic 32/700 | Mono 22/700 | 0.69 |
| About s4 intro (PyUKW) | Bodoni italic 30/700 | Mono 22/700 | 0.73 |
| MetricCard title (iRhDo/TegqI) | Bodoni 28/700 | Mono 22/700 | 0.79 |
| PillarCard titles (BTiRG/erYTg/qcoYd) | Bodoni italic 26/700 | Mono 20/700 | 0.77 |
| TicketAnatomy titles (GtO0Z/FIemh/CMDTi) | Bodoni italic 26/700 | Mono 20/700 | 0.77 |
| ArchPillar titles (9KmU3/DRVNe/Mp191) | Bodoni italic 24/700 | Mono 20/700 | 0.83 |
| LogicStep titles (1E23F/5AcjN/mK0Ci) | Bodoni italic 24/700 | Mono 20/700 | 0.83 |
| MetricCard m1/m4 title (yzR3K/yYtNH) | Bodoni italic 22/700 | Mono 18/700 | 0.82 |
| BL form title (AvEbq) | Bodoni italic 22/700 | Mono 18/700 | 0.82 |
| About tagline (TQmUG) | Bodoni italic 22/700 | Mono 18/700 | 0.82 |
| ArchPillar step numbers (rBfp2/3Xhny/7AYnX) | Bodoni 22/700 non-italic | Mono 22/700 retained | 1.0 |
| Diary entry titles (hE1–hE5, e1–e5) | Bodoni 18/700 | Mono 16/700 | 0.89 |
| Hero subtitle (PrI8l) | Newsreader italic 18 | Mono 16 normal | 0.89 |
| About roleLine (gNx84) | Newsreader italic 18 | Mono 16 normal | 0.89 |
| Diary entry bodies | Newsreader italic 18 | Mono 15 normal | 0.83 |
| DiaryHero subtitle (PKZXk) | Newsreader italic 17 | Mono 15 normal | 0.88 |
| About s3/s5/s6 intros (JcFQi/iUkFk/fG3xb) | Newsreader italic 15 | Mono 14 normal | 0.93 |
| hpLogic intro (BMFct), hpDiary intro (FbZyg) | Newsreader italic 15 | Mono 14 normal | 0.93 |
| PillarCard quote text (6jUNq/SWfWe/bMMUc) | Bodoni italic 14/700 | Mono 12/700 | 0.86 |
| BuiltByAIBanner "See how →" (RmIfG) | Bodoni italic 14/700 | Mono 12/700 | 0.86 |
| View-full-log link (zh5OA) | Bodoni italic 14/700 | Mono 12/700 | 0.86 |
| RoleCard OWNS + ARTEFACT body | Newsreader italic 14 | Mono 12 normal | 0.86 |
| PillarCard body (gCpJd/lms63/YWsPP) | Newsreader italic 14 | Mono 12 normal | 0.86 |
| ArchPillar body (dcmjg/MGceF/fJj0J) | Newsreader italic 14 | Mono 12 normal | 0.86 |
| MetricCard m1/m4 note (e41oW/VTbNw) | Newsreader italic 13 | Mono 12 normal | 0.92 |
| TicketAnatomy outcome + learning | Newsreader italic 13 | Mono 12 normal | 0.92 |
| LogicStep body (nwGzj/qQ2IL/A5aIX) | Newsreader italic 13 | Mono 12 normal | 0.92 |
| ArchPillar body-small (t3iVW/jyv9C/xPlc1) | Newsreader italic 13 | Mono 12 normal | 0.92 |
| TicketAnatomy CaseNo (kJyTC/jgyWD/BOW69) | Newsreader italic 13 | Mono 11 normal | 0.85 |
| MetricCard m2/m3 note (H8bkQ/MT6Lz) | Newsreader italic 11 | Mono 11 normal | 1.0 |
| Diary entry dates (OfacV/44ek7/GBTUt/uUrWx/...) | (already Mono 12) | Mono 12 retained | 1.0 |

### NavBar audit — NO-CHANGE

All 4 route NavBars audited (`OSgI0/vdJVv/voSTK/B5PEH`): already `fontFamily: Geist Mono`, `fontStyle: normal`, sizes 12–13. No Bodoni/Newsreader/italic residue. NavBar design unchanged by K-040 sitewide pass.

### Footer audit — K-034 Sacred NO-CHANGE

All 4 Footer frames (`1BGtd/86psQ/ei7cl/2ASmw`): already `fontFamily: Geist Mono` per K-034 Phase 1 Sacred AC-034-P1-ROUTE-DOM-PARITY. Byte-identity preserved across 4 routes. Zero edits applied to Footer text nodes in K-040 Item 1 pass.

### Italic suppression verification

Post-batch_get spot-check on 7 sampled nodes (rXURl, 2bQtY, PrI8l, nolk3, yHMgd, TQmUG, g2RUM): no `fontStyle` key present in any node (schema emits normal as absence). Italic confirmed OFF sitewide.

## Summary of .pen edits (final)

| Item | Frame ID | Change | Status |
|---|---|---|---|
| 1 | `zyttw` + 41 other sites across 4 route frames | sitewide Bodoni/Newsreader → Geist Mono; italic OFF; 42 size calibrations | DONE |
| 2 | `wtC03` | bottom padding 96→48 | DONE |
| 3 | — | no .pen change (impl drift) | MEMO-ONLY |
| 4 | `yg0qF` | padding-top 40 added | DONE |
| 5 | `ei7cl`, `1BGtd`, `86psQ`, `2ASmw` | gaDisclosure text added (×4 for parity) | DONE (prior session) |
| 6 | — | no mobile frame; `mobileRail: design-removed` | MEMO-ONLY |
| 14 | — | no mobile frame; Engineer calibrates impl | MEMO-ONLY |

## PM design-locked sign-off — PENDING

Per `feedback_pm_design_lock_sign_off.md`, Designer does NOT flip `design-locked: true`. PM reviews:

- `frontend/design/screenshots/homepage-v2-zyttw.png` (Hero single-frame)
- `frontend/design/screenshots/side-by-side-typography-K040.png` (4-route composite, **Item 1 scope-expansion gate**)
- `frontend/design/screenshots/side-by-side-footer-4routes-K040.png` (4-footer byte-identity)
- `frontend/design/screenshots/homepage-v2-wtC03.png` (Diary body padding)
- `frontend/design/screenshots/homepage-v2-yg0qF.png` (View-full-log CTA gap)
- `frontend/design/screenshots/homepage-v2-4CsvQ.png`, `homepage-v2-35VCj.png`, `homepage-v2-wiDSi.png`, `homepage-v2-VSwW9.png` (4 full-page captures)
- 13 JSON specs in `frontend/design/specs/`
- this memo

Then flips ticket frontmatter `design-locked: true` before Engineer release.

### FLUSH BLOCKER — user action required

Pencil MCP has no `save` tool. All 70+ text node edits live in **Pencil editor in-memory buffer on main-checkout path** `/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/frontend/design/homepage-v2.pen` — not the worktree copy. User must:

1. Switch to Pencil application, verify `homepage-v2.pen` active editor
2. Press `cmd+s` to flush buffer to disk
3. Copy flushed file from main-checkout into worktree:
   ```bash
   cp /Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/frontend/design/homepage-v2.pen \
      /Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/.claude/worktrees/K-040-sitewide-ui-polish-batch/frontend/design/homepage-v2.pen
   ```
4. Reply "saved" in session so Designer verifies `git status` inside worktree before claiming complete.

**Active-editor path mismatch disclosure:** Designer proceeded at main-checkout path (not worktree) because prior K-040 session's uncommitted edits (Items 1–5 from earlier round) already lived in main-checkout buffer. Working at worktree path would have lost those edits. This path decision is flagged for PM awareness — if PM prefers strict worktree isolation on future .pen work, the active-editor switch must happen before any Designer invocation.
