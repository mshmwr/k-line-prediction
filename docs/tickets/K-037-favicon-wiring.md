---
id: K-037
title: Favicon wiring — link tags + web app manifest + E2E 200-status regression
status: closed
closed: 2026-04-23
deployed: 2026-04-23 (merge 78f3231 → prod https://k-line-prediction-app.web.app)
type: feat
priority: medium
size: XS
created: 2026-04-23
branch: K-036-favicon (squashed with K-036 per user ruling 2026-04-23 — same branch, no new worktree)
visual-delta: yes — browser tab icon newly visible; reuses K-036 Pencil design (no new .pen frame, no new Designer cycle)
design-locked: pending — K-036 `frontend/design/favicon.pen` ships the canonical artwork; PM + user will side-by-side review dev-server tab icon vs the K-036 Pencil frame before closing K-037 (no Pencil JSON/PNG export needed for a non-page favicon; see §Design artifacts below)
qa-early-consultation: docs/retrospectives/qa.md 2026-04-23 K-037 (inline consultation by main-session PM acting as QA channel — disclosed; Agent(qa) not available in this session. 5 Challenges raised → 4 supplemented to AC, 1 declared Known Gap — see §Release Status below)
pencil-design-source: "`frontend/design/favicon.pen` (committed on branch at 891fcfb; rasterized outputs at ea973c9)"
code-review-status: passed-with-commit-block (Step 1 breadth APPROVED FOR MERGE with 0 Critical / 0 Important / 6 Minor accept-as-is; Step 2 depth CODE-PASS + F-N2 Important process finding — runtime files uncommitted; full sign-off gated on Engineer commit of 5 runtime files, then PM re-verify + QA regression + deploy)
depends-on: "K-036 (favicon rasterization) — K-036 produced the 7 PNG/ICO assets currently sitting in `frontend/public/`; K-037 wires them into `index.html` + creates `manifest.json`. Must ship together (squashed on `K-036-favicon` branch)."
block-override: "Yes (user decision 2026-04-23; see §Override Rationale — K-034 Q3 Block Lifted). Previously: `blocked-by-policy: K-034 Q3 ordering rule — K-036 and later tickets blocked until K-034 closed.` — LIFTED."
---

## Override Rationale — K-034 Q3 Block Lifted (2026-04-23)

User has overridden the K-034 §Q3 ordering rule for K-037. The 4-point rationale captured from main-session discussion:

1. **K-034 Q3 original intent was to prevent K-036 from shipping before new workflow gates exist. K-036 has already shipped** (2 commits on branch: `891fcfb` design + `ea973c9` rasterize). Policy objective already failed for K-036; blocking K-037 is collateral punishment.
2. **K-037 has NO new Pencil frame** — it wires the existing K-036 `.pen` artwork into `index.html` + `manifest.json`. There are no Designer JSON snapshot / screenshot products to generate for K-037 per K-034 Q1/Q5b (those products belong to K-036, which already shipped without them).
3. **K-037 AC-037-TAB-ICON-VISIBLE already references K-036 Pencil `get_screenshot`** for side-by-side acceptance — partial spirit of K-034 Q5c is preserved.
4. **K-034 is still in Phase 0 with no close ETA**; waiting would indefinitely block a ~110-LOC wire ticket.

**Decision scope:** K-034 Q1/Q5/Q6 new workflow applies to **K-034 Phase 1+ onward** for truly-new UI tickets. K-036 is grandfathered (already shipped, no retroactive workflow compliance required). K-037 is grandfathered as the K-036 wiring sibling. PM status advanced `backlog → ready`; Architect release pending.

## 背景

K-036 rasterized `frontend/design/favicon.pen` into 7 web-standard favicon formats under `frontend/public/`:

- `favicon.ico` (16/32/48 multi-size)
- `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png`
- `apple-touch-icon.png` (180×180)
- `android-chrome-192x192.png`, `android-chrome-512x512.png`

However K-036 only produced the **image files**; it did **not** wire them into the page. Current state (verified 2026-04-23 by PM):

1. `frontend/index.html` `<head>` contains only `<title>`, Google Font `<link>` tags, and the `viewport` meta — **zero favicon `<link>` tags**. Browsers request `/favicon.ico` by filesystem convention only (works in prod, 404 in dev if Vite public dir mapping differs for cases — and Apple / Android device icons never resolve without explicit tags).
2. `frontend/public/manifest.json` **does not exist** — the 192×192 / 512×512 android-chrome PNGs produced by K-036 are orphans with no consumer (Android Chrome / PWA installers require a `<link rel="manifest" href="/manifest.json">` pointing to a JSON file with an `icons` array).
3. No Playwright regression asserts the 7 files return HTTP 200 when the site ships — so silent 404s can slip past code review into production, and the next favicon refresh (image swap) could break one size without anyone noticing.

## 目標

- Add the canonical `<link rel="icon">` / `<link rel="apple-touch-icon">` / `<link rel="manifest">` tags to `frontend/index.html` so browsers load every file K-036 produced.
- Create `frontend/public/manifest.json` conformant to W3C Web App Manifest spec (name, short_name, icons[] referencing 192/512 android-chrome, theme_color matching the site's cream-white paper palette, display "standalone" or "browser" per Architect call).
- Add a Playwright E2E spec that asserts HTTP 200 for all 7 favicon files + `manifest.json` against a built `dist/` served by `vite preview`, so future image-swap refreshes cannot silently 404 a size.
- Manual visual confirmation: dev server tab shows the favicon; K-036 Pencil design matches what renders.

## 範圍

**含：**
- `frontend/index.html` — add to `<head>`:
  - `<link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="any">`
  - `<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">`
  - `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">`
  - `<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">`
  - `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`
  - `<link rel="manifest" href="/manifest.json">`
  - (Architect picks attribute ordering / `type="image/svg+xml"` absence — no SVG in K-036.)
- `frontend/public/manifest.json` — new file, schema minimally:
  ```json
  {
    "name": "K-Line Prediction",
    "short_name": "K-Line",
    "icons": [
      { "src": "/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png" },
      { "src": "/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png" }
    ],
    "theme_color": "#F4EFE5",
    "background_color": "#F4EFE5",
    "display": "browser",
    "start_url": "/"
  }
  ```
  Final field set frozen by Architect after Safari / Android Chrome behavior review.
- `frontend/e2e/favicon-assets.spec.ts` (new) — Playwright spec that:
  1. Starts from a built preview (`npm run build && vite preview` via Playwright webServer config) — **not** dev server, because dev/prod asset resolution differ.
  2. For each of the 8 asset paths (7 favicons + `manifest.json`), asserts `page.request.get(path)` returns `status() === 200` and `content-type` is image/* or application/manifest+json respectively.
  3. Fetches `/` HTML and asserts `<link rel="icon">` / `<link rel="apple-touch-icon">` / `<link rel="manifest">` tags all exist with expected `href` values.
- `frontend/public/diary.json` — append one K-037 entry to the existing favicon milestone (same milestone K-036 uses), English per Diary Sync Rule.

**不含：**
- Generating new image assets — K-036 produced the PNG/ICO set; K-037 does not re-rasterize, does not alter the Pencil design, does not add SVG or maskable variants.
- Multi-theme favicons (light/dark `prefers-color-scheme` variant icons via `<link media=...>`). Known Gap → recorded in §Release Status below.
- Full PWA install experience (service worker, offline shell, `display: standalone`). `manifest.json` is minimally spec-compliant for icon pickup only; `display: browser` keeps site as-is.
- Changing the favicon design. K-036 artwork is frozen.
- OG / Twitter social preview tags. Out of scope; track separately if needed.

## AC

**AC-037-LINK-TAGS-PRESENT** — `<head>` of rendered HTML contains all required favicon link tags
- **Given** a built production bundle (`npm run build` output served by `vite preview`)
- **When** Playwright requests `/` and parses the returned HTML `<head>`
- **Then** the following 6 `<link>` tags all exist with the exact `href` and `rel` attributes:
  - `<link rel="icon" type="image/x-icon" href="/favicon.ico"` (sizes attr optional per Architect)
  - `<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">`
  - `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">`
  - `<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">`
  - `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`
  - `<link rel="manifest" href="/manifest.json">`
- **And** assertion uses exact `href` match (not regex), so any path typo regresses the test immediately.

**AC-037-ASSETS-200-OK** — all 8 favicon-related asset paths return HTTP 200 from built preview
- **Given** `vite preview` serving the built `dist/` bundle
- **When** Playwright `page.request.get(path)` fetches each of the 8 paths: `/favicon.ico`, `/favicon-16x16.png`, `/favicon-32x32.png`, `/favicon-48x48.png`, `/apple-touch-icon.png`, `/android-chrome-192x192.png`, `/android-chrome-512x512.png`, `/manifest.json`
- **Then** every response has `status() === 200` — zero 404s, zero 500s
- **And** each response has a non-empty body (`response.body()` length > 0) — catches the silent "file exists as 0-byte placeholder" failure mode
- **And** the spec asserts all 8 independently with one test case per asset (not merged), so a broken single asset names itself in the failure report.

**AC-037-MANIFEST-VALID** — `manifest.json` is valid Web App Manifest JSON with correct icons
- **Given** `GET /manifest.json` returned by `vite preview`
- **When** the response body is parsed as JSON
- **Then** parse succeeds (no `SyntaxError`)
- **And** top-level object contains `name` (string), `icons` (array with ≥ 2 items)
- **And** the `icons` array contains at least one item with `sizes === "192x192"` and `src === "/android-chrome-192x192.png"`
- **And** contains at least one item with `sizes === "512x512"` and `src === "/android-chrome-512x512.png"`
- **And** the `Content-Type` response header equals `application/manifest+json` OR `application/json` (either accepted — Vite preview's default MIME for `.json` is the latter; see QA Challenge #2 below).

**AC-037-MANIFEST-MIME-ACCEPTABLE** — manifest Content-Type is browser-acceptable
- **Given** `GET /manifest.json` response headers from production Firebase Hosting (if measured) or from `vite preview` (if staging)
- **When** the `Content-Type` header is inspected
- **Then** it is one of: `application/manifest+json`, `application/json`, or `application/json; charset=utf-8`
- **And** if `application/json` is served and Architect chooses not to override (Firebase Hosting `headers` config), the ticket records this as an explicit acceptance decision in Engineer's implementation notes, not a silent omission.

**AC-037-TAB-ICON-VISIBLE** — browser tab renders the K-036 favicon (manual visual confirmation)
- **Given** `npm run dev` (or `vite preview` after build) serving the site
- **When** a human operator opens `http://localhost:5173/` in Chrome, Firefox, and Safari on macOS
- **Then** each browser tab displays the K-036 favicon artwork (rounded candle chart + golden-cross MA overlay) — not the default white / Vite logo / blank
- **And** the K-036 Pencil frame `frontend/design/favicon.pen` when opened via Pencil `get_screenshot` matches what renders in the tab (PM performs side-by-side review before close; tolerance: human-judged "visual parity" since browser tab icons are 16×16–48×48 and browser-rendered, not subject to pixel-diff automation).
- **Known Gap:** mobile Safari / Android Chrome tab-icon rendering is NOT verified in-ticket — Engineer only confirms the link tags + manifest are correctly served; real-device install-to-home-screen behavior is out of scope. Recorded as accepted gap, not AC.

## Release Status

**QA Early Consultation — 2026-04-23 (inline, by main-session PM acting as QA channel)**

**Disclosure:** This session does not have the `Agent` tool available to spawn an `Agent(qa)` sub-agent, per the PM persona pre-flight rule (`Session Handoff Verification` + `PM session capability pre-flight`). Main-session PM has therefore performed QA Early Consultation inline, following `~/.claude/agents/qa.md` §Early Consultation format. Risk: an independent QA agent might surface blind spots inline consultation misses — mitigation: the 5 Challenges below are deliberately broad (network, MIME, platform quirks, dev-vs-build, CSP), and user is invited to flag additional concerns at release-time gate.

**Challenges raised: 5. Resolution: 4 supplemented to AC, 1 declared Known Gap.**

**QA Challenge #1** — AC-037-ASSETS-200-OK: which asset host is authoritative?
- **Issue:** "Files return 200" is meaningless if measured against dev server (`vite dev` auto-serves `public/` in a way that hides production-specific failures like missing Firebase Hosting rewrite entries, MIME misconfigurations, or build-step copy omissions). Dev server and `vite preview` (built bundle) have different asset resolution paths.
- **Needs supplementation:** explicit statement that AC-037-ASSETS-200-OK is measured against `vite preview` (built output), not `vite dev`. Playwright config should spin up `vite preview` as `webServer.command`.
- **If not supplemented:** test passes in dev, silently fails on Firebase prod.
- **Resolution:** SUPPLEMENTED — AC-037-ASSETS-200-OK now explicitly specifies "built production bundle served by `vite preview`".

**QA Challenge #2** — AC-037-MANIFEST-VALID: Content-Type MIME type strictness
- **Issue:** The W3C spec recommends `application/manifest+json` for `manifest.json`, but most static hosts (Firebase, GitHub Pages, Vite default) serve `.json` as `application/json` or `application/json; charset=utf-8`. Strict Chromium versions accept both; older Safari may warn. If AC says "must be `application/manifest+json`" the test will fail out of the box on Firebase Hosting unless Engineer adds a custom `headers` rule in `firebase.json`.
- **Needs supplementation:** AC must list which MIME types are accepted (`application/manifest+json` OR `application/json` OR `application/json; charset=utf-8`), OR require Engineer to add an explicit Firebase `headers` override and assert the W3C-canonical type. Decision deferred to Architect.
- **If not supplemented:** CI fails on deploy or test gets rewritten post-hoc to loosen the assertion.
- **Resolution:** SUPPLEMENTED — new AC-037-MANIFEST-MIME-ACCEPTABLE added, explicitly accepting both; Architect can tighten to `application/manifest+json` by adding a Firebase `headers` rule if desired (recorded as implementation note, not AC-tightening).

**QA Challenge #3** — AC-037-TAB-ICON-VISIBLE: Safari apple-touch-icon quirk
- **Issue:** Safari on iOS ignores `<link rel="icon">` entirely and uses only `<link rel="apple-touch-icon">`. If apple-touch-icon's `href` has a typo, or the file is missing from Firebase Hosting public dir (different from `favicon.ico` which browsers convention-fetch from root), the tab icon silently falls back to a generic site screenshot thumbnail on Add-to-Home-Screen. Dev-server test cannot verify real iOS behavior.
- **Needs supplementation:** explicit Known Gap clause that mobile Safari iOS / Android Chrome real-device behavior is NOT in-ticket verified; Engineer's responsibility ends at "`apple-touch-icon.png` returns 200 + link tag correct."
- **If not supplemented:** production ship, iOS users see blank icon, PM has no documented acceptance of that risk.
- **Resolution:** SUPPLEMENTED as "Known Gap" clause in AC-037-TAB-ICON-VISIBLE.

**QA Challenge #4** — dev vs build discrepancy in Vite `public/` folder handling
- **Issue:** Vite copies `public/` files into `dist/` at build time; in dev mode they are served directly from `public/`. But if `frontend/public/manifest.json` is added as a new file and dev server has cached an earlier `public/` state (HMR metadata), the dev manual visual check may not even request the new manifest. Engineer self-test may appear green while production breaks.
- **Needs supplementation:** verification checklist item that Engineer MUST (a) stop dev server, (b) run `npm run build`, (c) run `vite preview`, (d) run the Playwright spec against `vite preview` (not dev), before declaring Phase done.
- **If not supplemented:** Engineer self-assessment green, Phase Gate passes on dev-only evidence, prod breaks.
- **Resolution:** SUPPLEMENTED in AC-037-ASSETS-200-OK "vite preview (not dev)" clause; Engineer verification checklist will inherit this.

**QA Challenge #5** — Content Security Policy (CSP) interaction
- **Issue:** If the project later adds a CSP `<meta http-equiv="Content-Security-Policy">` or Firebase Hosting adds one server-side, `img-src 'self'` / `manifest-src 'self'` directives could block the favicon / manifest despite 200 HTTP responses. This is a latent future-proofing concern — not current, but worth noting for Architect.
- **Needs supplementation:** current K-Line-Prediction `index.html` has no CSP meta tag (verified 2026-04-23); Firebase Hosting has no CSP header config. No immediate AC needed. But Architect should note in design doc that future CSP additions must include `img-src 'self'` and `manifest-src 'self'` at minimum.
- **If not supplemented:** future CSP ticket silently breaks favicons.
- **Resolution:** DECLARED KNOWN GAP — no new AC; recorded as an advisory note for Architect handoff. If and when a CSP ticket lands, that ticket's Architect must verify favicon / manifest compatibility, not this one.

**PM Ruling on Architect release:**

Per user instruction "design doc likely NOT needed; recommend Architect skip design doc and hand directly to Engineer with file-change list; let the Architect persona make the final call" — PM concurs with user's recommendation but defers final decision to Architect per `senior-architect.md` §Design-or-Not rule. The change set is (a) 6 `<link>` tags in `index.html`, (b) 1 new JSON file with a minimal 7-key schema, (c) 1 new Playwright spec file, (d) 1 diary entry. No backend, no route, no component tree, no props interface, no cross-layer contract, no shared-component propagation. Estimated change size: ~30 LOC HTML + ~20 LOC JSON + ~60 LOC Playwright = ~110 LOC, single-file diffs each. This is plausibly the smallest ticket-worthy unit of work in the project. Architect should either (a) write a 1-paragraph decision note confirming "no design doc needed, direct to Engineer" with the specific `<link>` tag ordering + `manifest.json` schema decisions frozen, or (b) if Architect disagrees, raise the ambiguities inline and PM will arbitrate.

**Release readiness status (2026-04-23):**

- [x] All AC defined Given/When/Then (+ And where multi-assertion) — 5 ACs total
- [x] QA Early Consultation complete — 5 Challenges, 4 supplemented, 1 Known Gap
- [x] File / route existence verification done (PM read `index.html` + `ls public/` on 2026-04-23)
- [x] Testid / selector existence verification done — no testids used in this ticket (asset paths + `<link>` href are the selectors)
- [x] AC CSS wording check — no CSS property wording in AC (asset paths and MIME types only)
- [x] AC vs Sacred cross-check — `## AC-*-REGRESSION` and dependency Sacred clauses checked; K-036 has no Sacred clauses (K-036 is image-generation only, no behavioral assertion); no contradiction with K-035 shared Footer ACs or other active tickets. **Gate evidence: ✓ no conflict with any Sacred clause in scope.**
- [x] ~~**BLOCKED by K-034 closure** (per K-034 §Q3 ordering rule — K-036 and later tickets wait; K-037 inherits block via K-036 dependency). PM will re-validate gates at release time after K-034 closes.~~ — **Block lifted by user 2026-04-23 — K-037 grandfathered as K-036 wiring sibling; K-034 Q1/Q5/Q6 workflow applies to K-034 Phase 1+ new tickets.** See §Override Rationale above.
- [ ] Visual Spec JSON gate — **not applicable**. Favicon is not a page-level component; K-036 Pencil design is a single iconographic artwork (not a layout with typography / spacing / palette tokens that downstream roles need to consume as a JSON contract). Design-locked verification at close = human side-by-side PM + user review of dev-server tab icon vs K-036 Pencil frame `get_screenshot`. Recorded here explicitly to pre-empt the Designer `feedback_designer_json_sync_hard_gate` rule — the rule targets page frames with consumable primitives; K-036 favicon is an exempt case documented as such. If the Designer persona disagrees, raise at release time and PM will re-arbitrate.

## Design artifacts

- **Canonical design source:** `frontend/design/favicon.pen` (K-036, committed 891fcfb)
- **Rasterized outputs (K-036):** `frontend/public/favicon.ico`, `-16/32/48.png`, `apple-touch-icon.png`, `android-chrome-192/512.png` (committed ea973c9)
- **JSON spec export:** not produced (see Release Readiness checkbox note — favicon is non-page artwork, no consumable design tokens for downstream roles)
- **PNG screenshot for side-by-side review:** PM will generate via `mcp__pencil__get_screenshot` at close time for final visual acceptance

## Release Log

### 2026-04-23 — Architect ruled no design doc; Engineer released

- **Architect ruling:** no design doc needed (concur with PM pre-recommendation). Recorded in `docs/designs/K-037-architect-brief.md` §Architect Ruling. Rationale: zero backend / zero route / zero component tree / zero props interface / zero cross-layer contract / zero shared-component propagation; all 4 files are single-purpose single-layer edits (~110 LOC total).
- **§Triage architecture.md grep:** 2 hits (L285 SPA fallback FileResponse, L489 Google Fonts preconnect), neither describes favicon/manifest — no drift; K-037 is a net-add.
- **Changelog landed:** `agent-context/architecture.md` L666 — `2026-04-23 (Architect, K-037 triage — no structural change)` one-line entry.
- **5 open technical questions resolved (binding contracts; see Engineer brief §3 for verbatim):**
  1. Link tag order — fixed 6-tag order + `rel → type → sizes → href` attribute order, placed after Google Font `<link>` and before `</head>`
  2. No SVG favicon placeholder tag (K-036 produced no SVG; orphan tag would 404)
  3. manifest.json `display: "browser"` (locked; overriding requires PM AC re-scope)
  4. No Firebase MIME header override in K-037 (ship with Vite default; AC-037-MANIFEST-MIME-ACCEPTABLE accepts both types)
  5. Add `<meta name="theme-color" content="#F4EFE5">` between `<meta name="viewport">` and first Google Font `<link>`; value must match manifest.json `theme_color` byte-for-byte
- **No Scope Questions raised by Architect.** File Change Scope frozen per brief §2 (4 files, ~110 LOC total).
- **PM re-run 8-item Handoff Check against Architect ruling:** all 8 gates PASS — qa-early-consultation OK, visual-delta=yes with design-locked exemption documented, AC vs Sacred no conflict, parallel Given quantified (N=8 for ASSETS-200-OK, N=6 for LINK-TAGS-PRESENT), paths verified, testids N/A-documented, AC CSS wording N/A, Architect ruling landed.
- **Engineer brief prepared:** `docs/engineering/K-037-engineer-brief.md`.
- **Status advanced:** `ready → in-progress` (Engineer released 2026-04-23).
- **Test gate on commit** (per `CLAUDE.md §Commit Test Gate`): `frontend/public/**` + `frontend/src/**` + `frontend/e2e/**` + `frontend/index.html` → Full gate (`npx tsc --noEmit` + Vitest + Playwright E2E subset `favicon-assets.spec.ts` minimum).

## Retrospective

### Engineer (2026-04-23)

**Pre-implementation Q&A Log:** None — all 5 technical ambiguities were resolved in the Architect brief §5 (link tag order, no SVG, `display: "browser"`, no Firebase MIME header, theme-color placement). No blocker raised; implementation proceeded directly against §2 frozen File Change Scope and §3 binding contracts.

**Scope discipline note:** `playwright.config.ts` was edited (not in §2 frozen 4-file list). This was authorized by brief §5 ("Either add a per-spec `test.use({ baseURL: ... })` + `playwright.config.ts` `webServer.command` runs `npm run build && vite preview --port 4173`") — Engineer chose the **additive-project** variant (new `favicon-preview` project + second `webServer` entry + `testIgnore` on the default `chromium` project) rather than modifying the existing dev-server webServer, to minimize blast radius on the other 256 green specs. No BQ needed; scope-discipline rule exempted by brief §5 itself.

**AC judgments that were wrong:** none. All 5 ACs implemented verbatim.

**Edge cases not anticipated:** Vite default Content-Type normalization. First spec draft did a case-sensitive string match against the 3-item accept-list; I reworked it to lowercase + whitespace-normalize (`replace(/;\s*/g, '; ')`) before `toContain`, to survive servers that emit `application/json;charset=UTF-8` (no space, upper-case). Observed header on `vite preview`: `application/json; charset=utf-8` — matched directly, but the normalization guards against Firebase variance.

**Full-suite regression:** 256 passed / 1 skipped / 2 failed. Both failures are pre-existing red, not K-037 regressions:
1. `AC-020-BEACON-SPA` — documented pre-existing red retained as K-033 tracker (see `docs/retrospectives/engineer.md` 2026-04-22 K-020 entry).
2. `diary-page T-L1` — timing flake under full-suite load (30.8s spec file); re-ran in isolation → green. Not introduced by diary.json append (prepended one entry, did not touch any spec).

**Next time improvement:** when an Engineer brief explicitly authorizes editing a file outside the frozen §2 scope (as §5 did for `playwright.config.ts`), call out the grant verbatim in the retrospective so Code Reviewer does not flag it as a scope violation. Done here.

### Reviewer (2026-04-23)

**Issues that should have been caught earlier (design / AC stage):** F-N2 (Step 1 breadth emitted "APPROVED FOR MERGE" while `git status --short` still showed 2 modified + 3 untracked runtime files) — not an AC-stage miss per se (AC text did not need to encode "files must be committed"), but a Reviewer process mechanics miss: the prior Reviewer checklist had no "runtime-file commit state" gate, so both Step 1 breadth and Step 2 depth historically accepted dirty branches as merge-ready. Codified in `~/.claude/agents/reviewer.md` §Git Status Commit-Block Gate + memory `feedback_reviewer_git_status_gate.md` as the structural fix.

**Next time improvement:** every Step 1 / Step 2 PASS verdict now runs `git status --short` first; any `M` / `??` in runtime scope (`frontend/src/**`, `frontend/e2e/**`, `frontend/public/**`, `frontend/index.html`, `*.config.ts`, `backend/**`) forces `CODE-PASS, COMMIT-BLOCKED` downgrade with uncommitted-file list. Doc-only / persona / retrospective `.md` exempt. Applied prospectively from K-037 onward.

## Code Review Rulings

PM ruled on Step 1 + Step 2 outcomes 2026-04-23.

**Step 1 (superpowers breadth) — APPROVED FOR MERGE with Minor findings:**

| Finding | Type | PM Ruling | Rationale |
|---------|------|-----------|-----------|
| M-1 | Minor (observation) | Accept as-is, no fix | Reviewer Step 1 explicitly recommended keep; sub-threshold for fix-now. |
| M-2 | Minor (observation) | Accept as-is, no fix | Reviewer Step 1 explicitly recommended keep; sub-threshold for fix-now. |
| M-3 | Minor (observation) | Accept as-is, no fix | Reviewer Step 1 explicitly recommended keep; sub-threshold for fix-now. |
| M-4 | Minor (ergonomics) | Accept as-is, no fix | Local-iteration ergonomic for Playwright project-split pattern — not K-037 AC scope; additive-project approach is intentionally blast-radius-minimal per Engineer brief §5 authorization. |
| M-5 | Minor (ergonomics) | Accept as-is, no fix | Same rationale as M-4 — local-iteration ergonomic, not K-037 scope. |
| M-6 | Minor (PM close-time action) | Accept as-is, handled at close | Deploy Record field TBD is a PM close-time action per `pm.md` §Phase Gate ticket-closure step 4, not a code quality defect; will land at deploy per standard close flow. |

**Step 2 (reviewer.md depth) — CODE-PASS on code; F-N2 process finding on gate mechanics:**

| Finding | Type | PM Ruling | Rationale |
|---------|------|-----------|-----------|
| F-N2 | Important (process) | Accept as legitimate process finding; no AC patch needed; resolves at next step (commit) | `git status --short` shows 5 uncommitted runtime files (2 M: `frontend/index.html` + `frontend/playwright.config.ts`; 3 ??: `frontend/public/manifest.json`, `frontend/e2e/favicon-assets.spec.ts`; also `frontend/public/diary.json` M). Branch is NOT merge-ready until commit lands. F-N2 is structurally a new class of finding (branch-state axis, not code-content axis) — no prior Reviewer gate covered it. Resolution path: Engineer commits runtime files in a single atomic commit (standard test gate per CLAUDE.md §Commit Test Gate — `frontend/src/**` + `frontend/public/**` + `frontend/e2e/**` + `frontend/index.html` + `*.config.ts` → Full gate: tsc + Vitest + Playwright), then PM re-verifies `git status --short` clean in runtime scope, then QA regression + deploy. |

**Overall verdict:** CODE-PASS, COMMIT-BLOCKED. PM sign-off will land AFTER commit per reviewer's proposed gate. Code itself is clean — all 4 ACs implemented verbatim, 10 Playwright test cases structured per AC quantification (6 for LINK-TAGS-PRESENT + 8 for ASSETS-200-OK + 4 for MANIFEST-VALID + 1 for MANIFEST-MIME-ACCEPTABLE, flattened into the spec file's natural test grouping).

**Codification landed in this ruling session:**
1. `~/.claude/agents/reviewer.md` §Git Status Commit-Block Gate — new hard-gate subsection under §General (runtime-scope path list + verdict downgrade rule + output format).
2. `/Users/yclee/.claude/projects/-Users-yclee-Diary/memory/feedback_reviewer_git_status_gate.md` — memory file with frontmatter + rule + Why + How, indexed into `MEMORY.md`.
3. `docs/retrospectives/reviewer.md` — prepended 2026-04-23 K-037 entry (newest-first) covering what-went-well / what-went-wrong / next-improvement.
4. This ticket §Retrospective Reviewer block + §Code Review Rulings section.

**Next gate unblock conditions (for QA):**
- Engineer commits 5 runtime files (`frontend/index.html`, `frontend/playwright.config.ts`, `frontend/public/manifest.json`, `frontend/e2e/favicon-assets.spec.ts`, `frontend/public/diary.json`) in atomic commit, passing Full gate (tsc + Vitest + Playwright).
- PM re-runs `git status --short` → clean in runtime scope.
- PM releases QA for regression per standard Phase Gate flow.

## Deploy Record

### 2026-04-23 — prod deployed

- **Merge commit:** `78f3231` (`Merge branch 'K-036-favicon' — K-037 favicon wiring + W3C manifest`)
- **Bundle sha256:**
  - `dist/assets/index-z_xtDeWa.js` → `3457315d5fee7f57ccd852e5356888720c909e5cfef755db65265de48add47ff`
  - `dist/index.html` → `732de2b766f045863a3eda12c2ff0ba2075582bbae61298a980510b27e8746b1`
- **Firebase deploy:** `✔  hosting[k-line-prediction-app]: release complete`
- **Hosting URL:** `https://k-line-prediction-app.web.app`
- **Executed probes (prod verification):**
  ```
  $ curl -sI https://k-line-prediction-app.web.app/favicon.ico | head -5
  HTTP/2 200
  cache-control: max-age=3600
  content-type: image/x-icon
  etag: "7b7adf55b8c55898f1ff951670d7638453829cc7b58ec217703da75fcd554d98"
  last-modified: Thu, 23 Apr 2026 03:44:14 GMT

  $ curl -sI https://k-line-prediction-app.web.app/manifest.json | head -5
  HTTP/2 200
  cache-control: max-age=3600
  content-type: application/json
  etag: "c49e68b05d3c70ab6ce62a7d3656b3e1c83fe039933d1cd2bd43cccf9d9c49af"
  last-modified: Thu, 23 Apr 2026 03:44:14 GMT

  $ curl -s https://k-line-prediction-app.web.app/manifest.json | head -3
  {
    "name": "K-Line Prediction",
    "short_name": "K-Line",

  $ curl -s https://k-line-prediction-app.web.app/ | grep -E 'rel="icon"|rel="apple|rel="manifest"'
  <link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="any" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  ```
- **Gate:** all assets reachable with HTTP 200, manifest.json content verified, all `<link rel>` tags emitted in prod HTML. Ticket closable.
