---
ticket: K-037
role: architect
status: architect-ruled-no-design-doc
handoff-from: pm
handoff-date: 2026-04-23
prepared-by: main-session PM (Agent tool unavailable this session — see §Capability Disclosure)
---

# K-037 Architect Release Brief — Favicon Wiring

## §Capability Disclosure

This brief was prepared by the main-session PM because the session does not have the `Agent` tool available to spawn `Agent(architect)` directly. Per `~/.claude/agents/pm.md` §PM session capability pre-flight rule (2026-04-21), the capability gap is disclosed explicitly rather than silently simulated. The brief is written in a format a fresh Architect session (or user-approved inline ruling) can consume directly. Architect's final ruling should be recorded in §Architect Ruling below before Engineer is released.

## §1 Handoff Check (PM Gate)

- **Ticket:** `docs/tickets/K-037-favicon-wiring.md`
- **qa-early-consultation:** `docs/retrospectives/qa.md 2026-04-23 K-037` (inline, disclosed — 5 Challenges raised, 4 supplemented to AC, 1 Known Gap) → OK
- **visual-delta:** `yes` (browser tab icon newly visible; reuses K-036 Pencil design, no new frame)
- **design-locked:** `pending` — will be resolved at close via PM + user side-by-side review of dev-server tab icon vs K-036 Pencil `get_screenshot`. Explicitly exempt from the `feedback_designer_json_sync_hard_gate` JSON+PNG gate because the K-036 favicon is non-page iconographic artwork with no consumable layout primitives (justification in ticket §Release Readiness checkbox + §Design artifacts).
- **block-override:** `Yes (user decision 2026-04-23)` — K-034 Q3 block lifted; K-037 grandfathered as K-036 wiring sibling. Full 4-point rationale in ticket §Override Rationale.
- **AC vs Sacred cross-check:** ✓ no conflict — K-036 has no Sacred clauses (image-generation only, no behavioral assertion); K-037 AC touches only new surface area (`<link>` tags in `index.html`, new `manifest.json`, new Playwright spec, new diary entry) — does not contradict any active Sacred (K-028 diary/heading rails, K-035 shared Footer, K-021 NavBar tokens, K-024 /diary flat timeline).
- **Parallel Given quantification:** AC-037-ASSETS-200-OK requires 8 independent Playwright test cases (one per asset path: `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png`, `apple-touch-icon.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png`, `manifest.json`). AC wording already makes this explicit with "one test case per asset (not merged), so a broken single asset names itself in the failure report."
- **Route / component / file path existence:** verified 2026-04-23 — `frontend/index.html` exists (Read confirmed zero favicon `<link>` tags); `frontend/public/` contains all 7 K-036 favicon files (ls confirmed); `frontend/public/manifest.json` does NOT exist (correct, this ticket creates it); `frontend/e2e/favicon-assets.spec.ts` does NOT exist (correct, this ticket creates it).
- **Testid / selector existence:** N/A — this ticket uses asset paths + `<link>` `href` / `rel` attributes as selectors, not `data-testid` values. Playwright will use `page.request.get(path)` + `page.locator('link[rel="icon"][href="/favicon.ico"]')` patterns, both valid without pre-existence.

## §2 File Change Scope (frozen by PM, do not expand without BQ)

| File | Operation | Estimated LOC | Notes |
|------|-----------|---------------|-------|
| `frontend/index.html` | Edit — add 6 `<link>` tags into existing `<head>` (between existing Google Font `<link>` and closing `</head>`) | +6 lines HTML | Tags listed in ticket §範圍 — icon x4 (ico + 16/32/48 png) + apple-touch-icon x1 + manifest x1 |
| `frontend/public/manifest.json` | New file | ~15 lines JSON | Schema in ticket §範圍 — `name`, `short_name`, `icons[]`, `theme_color`, `background_color`, `display`, `start_url` |
| `frontend/e2e/favicon-assets.spec.ts` | New file | ~60 lines TS | Playwright spec — `vite preview` webServer, 8 independent `status() === 200` assertions, 6 independent `<link>` tag assertions, `manifest.json` JSON-parse + `icons[]` schema assertion |
| `frontend/public/diary.json` | Append — 1 new entry under existing favicon milestone (shared with K-036 entry) | +1 JSON item | English per Diary Sync Rule; text summarizes "favicon wiring + manifest + E2E regression" |

**Total estimated:** ~110 LOC across 4 files, zero backend changes, zero component tree, zero shared component propagation, zero cross-layer contract.

## §3 PM Pre-Recommendation

Design doc **likely NOT needed** for K-037. Rationale:

1. **No backend** — zero Python / FastAPI / API endpoint touch.
2. **No route** — `index.html` is the static page shell; no React Router change, no new page component.
3. **No component tree** — no new React component, no existing component modification. `<link>` tags in `<head>` are not React components.
4. **No cross-layer contract** — no snake_case ↔ camelCase mapping, no data flowing through backend → API → frontend.
5. **No shared-component propagation** — favicon `<link>` tags are site-global but live in a single file (`index.html`). There is no `shared/Favicon.tsx` consumer list to audit.
6. **No Pencil frame consumption** — the K-036 `.pen` file is the canonical artwork source, already rasterized into 7 image files in K-036; K-037 just references those image paths. No layout / typography / spacing / palette primitives to extract into `specs/*.json`.
7. **Scope is single-layer wire work** — HTML tags + JSON file + Playwright assertions. The Architect's `§Triage — Drift Check When No Architecture Needed` path applies: grep `agent-context/architecture.md` for `favicon` / `manifest.json` / `index.html` — any hit → fix drift; no hit → release with one-line Changelog entry.

## §4 Architect Task Checklist

Architect should:

1. Execute §Triage grep against `agent-context/architecture.md`:
   ```bash
   grep -n "favicon\|manifest.json\|index.html" agent-context/architecture.md
   ```
2. If no hit → rule "no design doc needed"; append one-line Changelog entry to architecture.md (e.g., `YYYY-MM-DD: no structural change — ticket K-037 wires K-036 favicon assets into index.html + adds manifest.json + E2E regression spec`).
3. If hit → fix drift first OR list drift fix as K-037 work item, then rule on design doc necessity.
4. Record final ruling in §Architect Ruling below.
5. If insisting on a minimal design doc despite PM pre-recommendation, raise explicit blockers / open questions back to PM (Scope Question Pause Rule) — do NOT self-rule PM decisions (e.g., do NOT unilaterally change `display: browser` to `display: standalone`; that's a PM / product decision if it arises).

## §5 Known Open Technical Questions (Architect's call, not PM's)

These are the only items PM flagged as Architect-decides (not PM-decides):

1. **`<link>` tag attribute ordering in `index.html`** — MDN recommends `rel → type → sizes → href` ordering; Architect may lock this to any valid order as long as all 6 tags parse correctly. PM does not care about ordering aesthetics.
2. **Whether to add `type="image/svg+xml"` tag for a future SVG favicon** — K-036 produced no SVG; Architect can decide to omit a placeholder tag (recommended: omit, no orphan `<link>` to a non-existent file) or add a `TODO` comment. PM pre-recommendation: omit.
3. **`manifest.json` `display` value** — PM pre-recommendation `"browser"` to avoid PWA install banner; Architect can override to `"standalone"` if full PWA install is desired, but that triggers an AC-037 re-scope (add install-banner acceptance) so PM recommends `"browser"` unless Architect has a strong reason.
4. **Firebase Hosting MIME header override for `manifest.json`** — AC-037-MANIFEST-MIME-ACCEPTABLE accepts both `application/manifest+json` and `application/json`. Architect may optionally add a Firebase `headers` rule in `firebase.json` to force the W3C-canonical type. Recorded as implementation note, not AC-tightening.
5. **Whether to add `theme-color` `<meta>` tag in `index.html`** (in addition to `theme_color` in manifest.json) — MDN notes the `<meta name="theme-color">` is still honored by Android Chrome / iOS Safari when manifest is absent. PM pre-recommendation: add it to be defensive (`<meta name="theme-color" content="#F4EFE5">`). Architect's call.

## §6 Engineer Release Preconditions (PM holds these gates)

PM will release Engineer **only after** Architect records ruling in §Architect Ruling below. Do NOT stage Engineer release until:

- [ ] Architect confirms "no design doc needed" (preferred path) OR delivers a minimal design doc with all 4 AC-coverage items per §All-Phase Coverage Gate
- [ ] §Triage architecture.md grep result recorded (hit/no-hit + action taken)
- [ ] Architect's one-line Changelog entry landed in `agent-context/architecture.md` (if no-doc path chosen) — PM will verify this file change before Engineer release
- [ ] Any Architect-raised Scope Questions (§Scope Question Pause Rule) responded to by PM and locked into ticket

## §Architect Ruling

**Ruling:** no design doc needed — concur with PM pre-recommendation.

**Rationale (one paragraph):** K-037 touches zero backend, zero React route, zero component tree, zero props interface, zero cross-layer contract, zero shared-component propagation. All 4 files are single-purpose single-layer edits (HTML `<head>` tags, a flat JSON file, a new Playwright spec, a diary entry). File Change Scope is PM-frozen at ~110 LOC. The Architect's `§Triage — Drift Check When No Architecture Needed` path applies cleanly. Per `senior-architect.md` §Scope Question Pause Rule there are no AC-vs-codebase / AC-vs-Pencil contradictions requiring pause. Per §All-Phase Coverage Gate there is a single Phase with N/A backend/routes/component-tree/props (pure static-asset wiring), and the brief's §5 open technical questions are the only design-surface items, answered below as the binding contract.

**§Triage architecture.md grep result:**
```
grep -n "favicon\|manifest.json\|index.html" agent-context/architecture.md
285:`GET /{full_path:path}` → `FileResponse("dist/index.html")`。…（backend SPA fallback — unrelated to favicon wiring，無 drift）
489:**字型載入：** Google Fonts CDN via `index.html` preconnect + stylesheet link（既有，無需改）。（既有字型備註 — 無 drift）
```
Two hits, both accurate as-of-HEAD, neither describes favicon/manifest. No drift to fix — K-037 is a net-add (new `<link>` tags + new `manifest.json`); a Changelog one-liner is the correct treatment.

**Changelog entry added to architecture.md (if no-doc):**
```
- **2026-04-23**（Architect, K-037 triage — no structural change）— K-037 接在 K-036 之後 wire 既有 7 個 favicon/ICO 檔案進 `frontend/index.html` `<head>`（新增 6 個 `<link>` tag：icon ico + icon 16/32/48 png + apple-touch-icon + manifest）+ 新增 `frontend/public/manifest.json`（W3C Web App Manifest，minimal：name/short_name/icons×2/theme_color/background_color/display=browser/start_url）+ 新增 `<meta name="theme-color" content="#F4EFE5">` 同步 paper token + 新增 `frontend/e2e/favicon-assets.spec.ts`（8 asset paths × status 200 + 6 link-tag href 斷言 + manifest schema 斷言；webServer 綁 `vite preview`）。Directory Structure / Frontend Routing / Design System / API Endpoints 未變動。無 SVG favicon（K-036 未出 SVG），無 Firebase MIME header override（AC-037-MANIFEST-MIME-ACCEPTABLE 接受 `application/json` 與 `application/manifest+json`）。ticket: K-037。
```

**§5 Known Open Technical Questions — Architect binding rulings:**

**Q1 — `<link>` tag ordering in `<head>`:**
- **Ruling:** place favicon block **after** Google Font `<link>` tags and **before** `</head>`, ordered by `rel` specificity (generic → platform-specific → external file), ascending `sizes` within the `rel="icon"` group. Fixed order Engineer must follow verbatim:
  1. `<link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="any" />`
  2. `<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />`
  3. `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />`
  4. `<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />`
  5. `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />`
  6. `<link rel="manifest" href="/manifest.json" />`
- **Attribute order within each tag:** `rel → type → sizes → href` (MDN recommendation; matches the schema above).
- **Rationale:** browsers walk the `rel="icon"` list front-to-back picking the first acceptable size; ascending sizes means `<48 px` tabs match the 16/32/48 line exactly instead of downscaling the ICO. `apple-touch-icon` and `manifest` are single-consumer and order-independent among each other but must be after the generic icon block so non-Apple browsers skip them cleanly. This ordering is AC-bound — Playwright asserts exact `href` per tag, so Engineer has no room to reorder silently.

**Q2 — SVG placeholder favicon:**
- **Ruling:** **omit.** Do not add a `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`. Do not add a `TODO` comment.
- **Rationale:** K-036 produced no SVG. An orphan tag pointing to a non-existent `/favicon.svg` would 404 on every page load (browsers probe icons proactively) and pollute Network tab noise. A `TODO` comment in HTML is invisible once parsed and belongs in a Tech Debt entry, not in shipped HTML. If a future ticket rasterizes an SVG source, it will add the tag then; K-037's job is strictly wiring what K-036 produced.

**Q3 — `manifest.json` `display` value:**
- **Ruling:** `"browser"` — verbatim matches PM pre-recommendation and the ticket §範圍 example.
- **Rationale:** `"standalone"` / `"minimal-ui"` / `"fullscreen"` all trigger the mobile-browser "Install this app" banner / Add-to-Home-Screen affordance, which expands K-037's AC surface to include (a) PWA install experience, (b) offline shell / service worker expectations from first-time installers, (c) `start_url` routing semantics once installed. None of that is in scope. `"browser"` declares "this is a website, not an installable app" and is the minimum-risk choice that still satisfies Android Chrome's icon-pickup path (192/512 pngs). This is locked; overriding requires PM AC re-scope per ticket §Override Rationale discipline.

**Q4 — Firebase Hosting MIME header override for `manifest.json`:**
- **Ruling:** **do not add** a `firebase.json` `headers` rule in K-037. Ship with Firebase/Vite default (`application/json` or `application/json; charset=utf-8`).
- **Rationale:** AC-037-MANIFEST-MIME-ACCEPTABLE already accepts both `application/manifest+json` and `application/json`; current Chromium / Firefox / Safari all accept either. Adding a `firebase.json` `headers` rule (a) touches a file outside PM's frozen File Change Scope (§2), (b) creates a second source-of-truth for MIME besides Vite's default and needs a sibling rule for dev-server parity, (c) introduces a Firebase-specific config that must be maintained if the host ever changes. Engineer must record "accepted default MIME, no `firebase.json` change" as an implementation note in the commit message — per the AC's explicit-acceptance clause.
- **Future trigger:** if a real W3C-strict Safari build (or future Chromium policy) rejects `application/json` for manifest, file a new ticket to add the Firebase `headers` block — do not retroactively tighten K-037.

**Q5 — `<meta name="theme-color">` in `index.html`:**
- **Ruling:** **add.** Insert `<meta name="theme-color" content="#F4EFE5" />` in `<head>`, placed **between** `<meta name="viewport" ...>` and the first Google Font `<link rel="preconnect" ...>`.
- **Color value:** `#F4EFE5` — the project's paper token (see `agent-context/architecture.md` §Design System / Tokens + K-021 Changelog). Must match `manifest.json`'s `theme_color` byte-for-byte.
- **Rationale:** `<meta name="theme-color">` is honored by Android Chrome / Samsung Internet / iOS Safari 15+ to tint the browser chrome before the manifest is parsed; manifest's `theme_color` only kicks in once the manifest request resolves. Both paths exist on purpose (defensive, per PM pre-recommendation). The paper palette is the only correct value — the site's sitewide body background is `bg-paper` since K-021 (see architecture.md L491 `### 全站 Body CSS 入口`), so any other color would create a visible chrome-vs-body seam on first paint. Engineer must NOT introduce a `media="(prefers-color-scheme: dark)"` variant — the site has no dark theme (K-021 closed the dark-mode question; `/app` isolation is background-level, not theme-color-level).

**Scope Questions raised back to PM (if any):** none. No AC contradictions, no Pencil-vs-AC drift, no codebase-vs-AC drift, no Sacred clause conflicts, no missing File Change Scope entries. The ticket + brief are internally consistent; Architect rules without pause.

**All-Phase Coverage Gate confirmation:** K-037 is a single-Phase ticket with these cells all explicitly N/A (documented reasons, not blanks):

| Phase | Backend API | Frontend Routes | Component Tree | Props Interface |
|-------|------------|----------------|----------------|----------------|
| 1 (sole) | N/A — zero backend | N/A — zero route change | N/A — HTML `<head>` tags are not React components | N/A — no new React component, no props |

**Boundary Pre-emption confirmation (mandatory gate):**

| Boundary scenario | Status | Notes |
|---|---|---|
| Empty / null input | N/A | No runtime input — static `<link>` tags + static JSON file |
| Max / min value boundary | N/A | No numeric range, no pagination |
| API error response (400/403/500/timeout) | Covered | AC-037-ASSETS-200-OK asserts status === 200 for all 8 paths; non-200 fails the spec deterministically |
| Concurrency / race condition | N/A | No client-initiated mutation, no double-submit surface |
| Empty list / single item / large data | N/A | `manifest.json` `icons[]` has fixed length 2 (192 + 512); no dynamic sizing |

**Refactorability Checklist:** all items N/A or trivially pass — no new function, no new module, no new dependency, no test-internal state. Static-asset wiring is the architectural floor.

**Architect signature date + session:** 2026-04-23 — senior-architect persona, main-session-invoked for K-037 ruling (capability disclosed: Architect tool invoked; no Engineer spawn from this session — PM holds that gate per brief §6).

---

## Handoff Status

- **Prepared:** 2026-04-23 by main-session PM (Agent tool unavailable — disclosed above)
- **Next gate:** Architect ruling (this file §Architect Ruling) → PM re-verify Engineer release preconditions → Engineer spawn
- **PM is holding:** Engineer release gate until Architect ruling lands
