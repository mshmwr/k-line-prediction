---
ticket: K-049
role: architect
status: design-complete
handoff-from: pm
handoff-date: 2026-04-24
base-commit: 1090e63
---

# K-049 Architect Brief — Public-surface plumbing

## §0 Scope Questions / BQs raised back to PM

1 BQ raised (non-blocker; design continues — Engineer follows the ticket AC list, not the PM-brief paraphrase):

- **BQ-049-ARCH-01** (route-list drift in PM handoff brief) — PM handoff brief §BQ-049-05 paraphrases the sitemap route set as `/, /about, /diary, /app, /examples`. Ticket §AC-049-SITEMAP-1 + §Scope lock the set as `/, /app, /about, /diary, /business-logic`. `/examples` does not exist (`git ls-tree 1090e63 frontend/src/pages/ → HomePage / AppPage / AboutPage / DiaryPage / BusinessLogicPage`); `/business-logic` does. I am binding the design to the ticket wording. PM: confirm `/business-logic` is the intended 5th route OR edit ticket AC if `/examples` was the correct intent. Per `feedback_ticket_ac_pm_only.md` I cannot edit the AC. Brief assumes ticket wording stands until PM confirms.

No Scope-Question-Pause-Rule halt triggered: the 4 Pre-Design Audit `git show 1090e63:...` runs match all other pre-existing claims; AC-vs-codebase contradictions absent elsewhere.

---

## §1 Pre-Design Audit (K-013 dry-run proof, 4 files verified at `1090e63`)

### §1.1 Files inspected truth table

| # | File path | `git show` verified | Critical observation |
|---|-----------|--------------------|----------------------|
| 1 | `firebase.json` | ✓ (17 lines, `site=k-line-prediction-app`, `public=frontend/dist`, one `**` rewrite to `/index.html`, no `headers[]`, no `redirects[]`, no `i18n`) | No rewrite exclusions today → any new `robots.txt` / `sitemap.xml` will be caught by the SPA `**` catch-all unless ordered BEFORE it. |
| 2 | `frontend/index.html` | ✓ (21 lines, `<meta name="theme-color" content="#F4EFE5">`, combined Google Fonts URL L10 importing 4 families `IBM+Plex+Mono / Bodoni+Moda / Newsreader / Geist+Mono`, 6 favicon `<link>` tags at L11-16, K-037 already shipped, body class `bg-[#F4EFE5]`) | Line-10 combined URL requires query-param surgery (drop `&family=Bodoni+Moda:...`), NOT line-removal. All K-037 favicon `<link>` tags are byte-identical to K-037 Architect Ruling — must remain unchanged (Sacred). |
| 3 | `frontend/src/main.tsx` | ✓ (34 lines — 5 static route-component imports at L5-9, `initGA()` called at L13 OUTSIDE component tree, `<GATracker />` renders `useGAPageview` hook inside `<BrowserRouter>`, catch-all `<Route path="*" element={<Navigate to="/" replace />} />`) | GA init is synchronous + one-shot; pageview hook fires on location.pathname change (effect dep list). Under React.lazy, `useGAPageview` will still fire on `location.pathname` change but the `document.title` at that moment may race (Suspense fallback shown → chunk resolves → page mounts → title updated by page component). AC-049-GA-LAZY-1 mandates using a static `PAGE_TITLES` map, which already exists at `frontend/src/hooks/useGAPageview.ts:5-11` — **this is a key reuse point**: the map is the binding fix for the race. |
| 4 | `backend/main.py` (NOT `backend/app/main.py`; PM brief typo) | ✓ (L7 `from fastapi.middleware.cors import CORSMiddleware`; L35-40 `app.add_middleware(CORSMiddleware, allow_origins=_cors_origins, allow_methods=["*"], allow_headers=["*"])`; L34 `_cors_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]`) | `_cors_origins` is local var; env var `CORS_ORIGINS` will dangle in Cloud Run secrets post-removal. Same-origin rewrite makes `CORS_ORIGINS` unread → flagged in deploy checklist as a post-close cleanup. |

### §1.2 Supporting files verified

| File | Finding |
|------|---------|
| `frontend/public/manifest.json` at `1090e63` | Contents: `display: browser`, `name: "K-Line Prediction"`, `short_name: "K-Line"`, `icons: [192, 512]`, `theme_color / background_color: #F4EFE5`, `start_url: /` — K-037 baseline. AC-049-PWA-1 flips `display: browser → standalone`. |
| `frontend/src/utils/analytics.ts` at `1090e63` | `initGA` one-shot, `send_page_view: false` (manual firing), `trackPageview(path, title)` — no idempotency guard (TD-013 known), but AC-049-GA-LAZY-1 scope is fire-timing, not idempotency. |
| `frontend/src/hooks/useGAPageview.ts` at `1090e63` | `PAGE_TITLES` map already keyed by 5 routes incl. `/business-logic`; uses `document.title` only as `??` fallback. **This is the pre-existing anti-race design** — confirms AC-049-GA-LAZY-1 "match a static PAGE_TITLES map" is already the implementation, not a new abstraction. K-049 merely needs the map to stay authoritative under lazy chunks. |
| `frontend/vite.config.ts` at `1090e63` | `server.proxy['/api'] = http://localhost:8000` (dev-server proxy to FastAPI); `manualChunks` splits `vendor-react / vendor-charts / vendor-markdown`. Route-level chunking is NOT currently configured (all 5 pages land in the main chunk today). AC-049-SUSPENSE-1 is the first ticket to introduce route-level code split. |
| `frontend/playwright.config.ts` at `1090e63` | 3 projects: `chromium` (e2e suite, ignores favicon-assets.spec.ts); `visual-report`; `favicon-preview` (runs against `vite preview` port 4173). `webServer` ONLY starts `npm run dev` on 5173 today — no `vite preview` in webServer array. AC-049-PROBE-1 / AC-049-ROBOTS-1 / AC-049-CSP-REPORT-1 probe **production** (`https://k-line-prediction-app.web.app`) directly via `curl`, not local dev — aligns with QA retrospective's "deployed-bundle probe" pattern; no new Playwright webServer entry required. |
| `frontend/public/` tree at `1090e63` | 10 files: 4 favicon pngs, favicon.ico, apple-touch-icon, 2 android-chrome, diary.json, manifest.json, examples/ETHUSDT_1h_test.csv. **No `robots.txt`, no `sitemap.xml`** — K-049 net-adds. |
| `frontend/scripts/` | 1 file: `patch-vitest-node16.mjs`. **No `generate-sitemap.mjs`, no `validate-env.mjs`** — K-049 net-adds. |

### §1.3 Pre-existing claims cited (each with git-show citation)

- **Claim A:** "K-037 favicon `<link>` tags are Sacred byte-identical." → `git show 1090e63:frontend/index.html` L11-16 = 6 `<link>` tags matching K-037 Architect Ruling Q1 verbatim. Design doc §6 File Change List forbids Engineer touching these lines during the Bodoni URL edit.
- **Claim B:** "Current Firebase Hosting has zero `headers[]` / `redirects[]` blocks, zero rewrite exclusions." → `git show 1090e63:firebase.json` = 17 lines, only `hosting.rewrites[0]` with `source=**` → `destination=/index.html`. All 4 header-block ACs (cache + 4 sec-headers + CSP-Report-Only) land in an entirely new `headers[]` array.
- **Claim C:** "`initGA()` is called ONCE at module top-level, before React root render." → `git show 1090e63:frontend/src/main.tsx` L13 shows `initGA()` bare call outside any component. AC-049-GA-LAZY-1 does not require moving this — only assert PAGE_TITLES drives the `page_title` field, not `document.title`.
- **Claim D:** "`backend/main.py` L35-40 `app.add_middleware(CORSMiddleware, ...)`; `_cors_origins` at L34." → verified. AC-049-DEPLOY-ORDER-1 step 4 removes L34-40 verbatim.
- **Claim E:** "`frontend/src/hooks/useGAPageview.ts` already maps 5 routes to static titles via `PAGE_TITLES`." → verified L5-11. This is a **pre-existing** anti-race design; K-049 design doc does not invent it, merely leans on it.
- **Claim F:** "Bodoni Moda is imported via the combined Google Fonts URL on `frontend/index.html` L10 but zero frontend source consumes it." → `git show 1090e63:frontend/index.html` L10 = combined URL; `grep -rn "Bodoni" frontend/src frontend/tailwind.config.js → 0 hits`. Removal is safe.

---

## §2 Phase order with commit boundaries

Each Phase is **one commit to the K-049 branch, one Firebase deploy, one probe verification** before the next starts. Do NOT batch Phases 1-2-3 into a single deploy — deploy-order guard AC-049-DEPLOY-ORDER-1 explicitly requires Phase 2's `/api/**` rewrite to be edge-cached ≥24h BEFORE Phase 2's backend CORSMiddleware removal.

```
Phase 1 (static head block)
  → 1 commit (message: feat(K-049 P1): head-block meta + manifest standalone + Bodoni cleanup)
  → firebase deploy --only hosting
  → curl-probe: 3 ACs from Phase 1 pass
  → gate to Phase 2

Phase 2a (Firebase config — pre-rewrite sub-phase)
  → 1 commit (message: feat(K-049 P2a): firebase rewrites + robots/sitemap + headers + CSP-Report-Only)
  → firebase deploy --only hosting
  → curl-probe: 6 ACs from Phase 2 excl. ENVGUARD+CORS-removal pass
  → ≥24h soak wait (explicit in commit message; Engineer records timestamp)
  → gate to Phase 2b

Phase 2b (backend CORS removal — post-rewrite sub-phase)
  → 1 commit (message: feat(K-049 P2b): remove CORSMiddleware — Firebase /api/** rewrite is now the edge)
  → deploy backend to Cloud Run
  → curl-probe: AC-049-DEPLOY-ORDER-1 step 4 passes
  → gate to Phase 3

Phase 3 (runtime perf — React.lazy + Suspense)
  → 1 commit (message: feat(K-049 P3): React.lazy route-splitting + GA pageview lazy-boundary hardening)
  → firebase deploy --only hosting
  → Playwright E2E: 2 ACs from Phase 3 pass
  → final full-suite regression (Engineer deliverable)
```

**Commit-boundary rationale:**
- Phase 1 is pure `index.html` + `manifest.json` file edits — zero Firebase config risk, smallest-possible blast radius, deploy first to flush CDN cache early.
- Phase 2 is split into 2a + 2b because the ≥24h soak between rewrite deploy and CORS removal is non-negotiable (Firebase edge cache propagation); merging them into one commit would invalidate the AC's deploy-order guarantee.
- Phase 3 is last because React.lazy introduces user-facing loading skeleton UX — must be shipped when CSP-Report-Only is already soaking so any CSP violation from the chunk loader shows up in probe data.

---

## §3 Route Impact Table (all 5 routes × all 10 ACs)

Per `feedback_global_style_route_impact_table.md` + persona §Global Style Route Impact Table — required whenever `firebase.json` / sitewide HTML / React.lazy touches blast radius ≥ 2 routes.

| Route | AC-PROBE-1 (meta) | AC-PWA-1 (manifest) | AC-BODONI-1 (font URL) | AC-ROBOTS-1 (robots/sitemap) | AC-SITEMAP-1 (per-URL lastmod) | AC-CSP-REPORT-1 (headers) | AC-DEPLOY-ORDER-1 (rewrite+CORS) | AC-DEPLOY-ENVGUARD-1 (GA ID) | AC-CACHE-1 (assets cache) | AC-SUSPENSE-1 (lazy routes) | AC-GA-LAZY-1 (pageview timing) |
|-------|-------|--------|--------|---------|---------|---------|--------|--------|--------|--------|--------|
| `/` | affected | affected | affected | N/A (static file adjacent) | affected (listed) | affected (headers on all paths) | affected (`/api/**` used via HomePage?) | affected | affected (assets hash) | affected (lazy) | affected |
| `/app` | affected | affected | affected | N/A | affected (listed) | affected | affected (primary `/api/predict` caller) | affected | affected | affected (lazy) | affected |
| `/about` | affected | affected | affected | N/A | affected (listed) | affected | N/A (no API call) | affected | affected | affected (lazy) | affected |
| `/diary` | affected | affected | affected | N/A | affected (listed) | affected | N/A (fetches `/diary.json` static asset, not `/api/**`) | affected | affected | affected (lazy) | affected |
| `/business-logic` | affected | affected | affected | N/A | affected (listed per ticket AC, pending BQ-049-ARCH-01 clarification) | affected | affected (`/api/business-logic` + `/api/auth`) | affected | affected | affected (lazy) | affected |

**Must-be-isolated rows:** none. All 5 routes are uniformly affected by the head-block + Firebase config changes; no route needs explicit override.

**Target-Route Consumer Scan** (per `feedback_engineer_visual_change_pm_designer_followup.md` + persona §Target-Route Consumer Scan): NOT applicable — this ticket does not change navigation behavior of any route (same-origin rewrite changes request origin, not user-visible navigation semantics). No `to="/api/..."` / `href="/api/..."` patterns exist in frontend/src.

**Sitemap inclusion entries verified** (AC-049-SITEMAP-1):

| Route | Backing page file | `git log -1 --format=%cs` | Sitemap lastmod |
|-------|-------------------|---------------------------|-----------------|
| `/` | `frontend/src/pages/HomePage.tsx` | 2026-04-23 | 2026-04-23 |
| `/app` | `frontend/src/AppPage.tsx` | 2026-04-24 | 2026-04-24 |
| `/about` | `frontend/src/pages/AboutPage.tsx` | 2026-04-24 | 2026-04-24 |
| `/diary` | `frontend/src/pages/DiaryPage.tsx` | 2026-04-23 | 2026-04-23 |
| `/business-logic` | `frontend/src/pages/BusinessLogicPage.tsx` | 2026-04-23 | 2026-04-23 |

---

## §4 File Change List (repo-relative for Engineer, sorted by Phase)

### Phase 1 (static head block)

| File | Op | Estimated LOC | Responsibility |
|------|----|---------------|----------------|
| `frontend/index.html` | Edit | -1 / +12 net +11 | (a) Replace L10 combined Google Fonts URL: drop `&family=Bodoni+Moda:ital,opsz,wght@1,6..96,700` query param (keep IBM+Plex+Mono / Newsreader / Geist+Mono); (b) insert 5 `<meta>` tags (og:title, og:description, og:url, og:type, twitter:card) + 1 `<meta name="author" content="mshmwr">` + 1 `<link rel="canonical">` after existing theme-color meta and before Google Fonts preconnect; (c) insert 1 `<script type="application/ld+json">` block with `@type: SoftwareApplication` (+ `@type: WebSite` as a second block OR a `@graph` wrapper — Engineer picks) near end of `<head>`. Do NOT touch L11-16 K-037 favicon `<link>` tags. |
| `frontend/public/manifest.json` | Edit | -1 / +1 | Flip `"display": "browser"` → `"display": "standalone"`. All other fields unchanged (K-037 Sacred byte-identity for the icon array + theme_color). |

### Phase 2a (Firebase config — pre-rewrite)

| File | Op | Estimated LOC | Responsibility |
|------|----|---------------|----------------|
| `firebase.json` | Edit | -16 / +~80 | Full rewrite of `hosting` block. Order-sensitive entries: (1) `rewrites[]` — `/api/**` → Cloud Run function OR service rewrite BEFORE the SPA `**` catch-all; **no explicit exclusion needed** for `robots.txt` / `sitemap.xml` because Firebase Hosting serves any existing file in `public` BEFORE applying rewrites — confirmed via Firebase Hosting priority order docs, but Engineer validates with a `curl -sI /robots.txt` probe post-deploy (if response is the SPA HTML shell, add explicit `rewrites[]` exclusion entries with `source=/robots.txt` → `destination=/robots.txt` ahead of catch-all). (2) `headers[]` — 4 entries: (i) `source: "**"` → 5 security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, Content-Security-Policy-Report-Only); (ii) `source: "/assets/**"` → `Cache-Control: public, max-age=31536000, immutable`; (iii) `source: "/manifest.json"` → `Content-Type: application/manifest+json` (defensive, per K-037 Architect Ruling Q4 deferred opt-in); (iv) `source: "/sitemap.xml"` → `Content-Type: application/xml`. |
| `frontend/public/robots.txt` | New | ~6 lines | `User-agent: *` / `Allow: /` / `Sitemap: https://k-line-prediction-app.web.app/sitemap.xml`. No route-specific disallows (portfolio demo, public by design). |
| `frontend/public/sitemap.xml` | New (generated) | ~30 lines | NOT hand-written — produced by `scripts/generate-sitemap.mjs` (below) as a prebuild step; gitignored-or-committed Engineer decision, but **committed** recommended so Engineer/QA can manually read it at HEAD. |
| `frontend/scripts/generate-sitemap.mjs` | New | ~60 lines | Iterates 5 routes → 5 hardcoded page-component paths → `execSync('git log -1 --format=%cs <path>')` per path → emits `<url><loc><lastmod></url>` rows → writes `frontend/public/sitemap.xml`. Fails build (exit non-zero) if any `git log` returns empty string. |
| `frontend/scripts/validate-env.mjs` | New | ~25 lines | Checks `VITE_GA_MEASUREMENT_ID` env at prebuild: unset → exit with message `"VITE_GA_MEASUREMENT_ID must match G-[A-Z0-9]{10,}"`; present but regex-miss → exit same; present + valid → log and exit 0. `VITE_API_BASE_URL` is **NOT** checked (retired in Phase 2b). |
| `frontend/package.json` | Edit | -1 / +1 | `prebuild` script chained: existing `docs/ai-collab-protocols.md` copy → `node scripts/validate-env.mjs` → `node scripts/generate-sitemap.mjs`. Three-step chain via `&&`. |

### Phase 2b (backend CORS removal — post-rewrite soak)

| File | Op | Estimated LOC | Responsibility |
|------|----|---------------|----------------|
| `backend/main.py` | Edit | -7 | Remove L7 `from fastapi.middleware.cors import CORSMiddleware` + L34 `_cors_origins = ...` + L35-40 `app.add_middleware(CORSMiddleware, ...)`. Leave L41+ `app.include_router(auth_router, prefix="/api")` untouched. |
| `frontend/.env.production.example` (if exists at HEAD; check) | Edit OR delete `VITE_API_BASE_URL` line | -1 | Retire `VITE_API_BASE_URL` — post-rewrite all `/api/**` calls are relative; `API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''` at `frontend/src/utils/api.ts:1` becomes always `''`, Engineer can leave the fallback as-is (safer — zero-diff semantic). |

### Phase 3 (runtime perf — React.lazy)

| File | Op | Estimated LOC | Responsibility |
|------|----|---------------|----------------|
| `frontend/src/main.tsx` | Edit | -5 / +10 net +5 | Replace 5 static `import HomePage from ...` with `const HomePage = React.lazy(() => import('./pages/HomePage'))` (5x). Wrap `<Routes>` children in `<Suspense fallback={<RouteSuspense />}>`. Keep `initGA()` + `<GATracker />` positions unchanged. |
| `frontend/src/components/RouteSuspense.tsx` | New | ~15 lines | Minimal loading skeleton, `data-testid="route-suspense"`, `bg-[#F4EFE5]` body background for flash-of-unstyled-content avoidance, no animation (avoid K-030 `/app` isolation bleed). |
| `frontend/vite.config.ts` | Edit | +5 | Extend `manualChunks` to accept route chunks naturally (Vite auto-splits lazy imports, but add explicit `if (id.includes('frontend/src/pages/'))` branch to guarantee one chunk per page). Actual verification via `ls frontend/dist/assets/*.js | wc -l` ≥ 6 per AC-049-SUSPENSE-1. |

**Total estimated:** Phase 1 ~12 LOC / Phase 2a ~200 LOC (new scripts dominate) / Phase 2b ~7 LOC / Phase 3 ~25 LOC — total across 4 phases ≈ 245 LOC.

---

## §5 Shared-component Inventory (Cross-Page Duplicate Audit)

Per persona §Cross-Page Duplicate Audit + `feedback_shared_component_inventory_check.md`.

**Grepped (HEAD of worktree):**
```bash
grep -rn "React.lazy\|Suspense" frontend/src/ → 0 hits
grep -rn "route-suspense\|RouteSuspense" frontend/src/ → 0 hits
grep -rn "data-testid=\"route-" frontend/src/ → 0 hits
grep -rn "PAGE_TITLES" frontend/src/ → 1 hit (frontend/src/hooks/useGAPageview.ts:5)
```

No duplicate route-suspense / skeleton pattern exists. `<RouteSuspense>` is a net-new shared primitive.

### §5.1 New shared primitives

| Component | Path | Consumer(s) | Props interface |
|-----------|------|-------------|-----------------|
| `RouteSuspense` | `frontend/src/components/RouteSuspense.tsx` | `frontend/src/main.tsx` (1 consumer — single `<Suspense fallback>` wrap) | No props. Renders fixed-background loading state. `data-testid="route-suspense"` hardcoded. |

### §5.2 Pre-existing reuse anchors (leaned on, not changed)

| Module | Path | Behavior |
|--------|------|----------|
| `PAGE_TITLES` map | `frontend/src/hooks/useGAPageview.ts:5-11` | 5-route static map. Already the authoritative GA `page_title` source; AC-049-GA-LAZY-1's "match static PAGE_TITLES map" requirement is met by pre-existing code. Engineer MUST NOT duplicate this map in `main.tsx` — single-source discipline. |
| `API_BASE` | `frontend/src/utils/api.ts:1` | `import.meta.env.VITE_API_BASE_URL ?? ''`. Post-Phase-2b `VITE_API_BASE_URL` is unset → `API_BASE === ''` → all `fetch(${API_BASE}/api/foo)` = `fetch('/api/foo')` → same-origin rewrite. Zero-diff migration. |

### §5.3 Not-shared (per-Phase-local, inlined)

| Item | Why not shared |
|------|----------------|
| `SITEMAP_ROUTES` list in `scripts/generate-sitemap.mjs` | Build-time Node script, runs outside React. Duplicating the 5-route list (runtime: `PAGE_TITLES` in hook; build-time: `SITEMAP_ROUTES` in script) is acceptable because Node scripts can't import TS files cleanly without tsx/esbuild overhead. Accept the TWO-source route list but add a comment in both files pointing at the other. |
| JSON-LD object in `index.html` | Static HTML string; duplicating into a component would require React to render `<script>` tags via `dangerouslySetInnerHTML` — worse maintenance for zero reuse benefit. |

---

## §6 API Contract Diff (pre-rewrite vs post-rewrite)

Per persona §API / interface contracts + `feedback_architect_pre_design_audit_dry_run.md` dual-axis.

### §6.1 Wire-level schema diff (Axis A)

```
git diff 1090e63 -- frontend/src/types/ backend/models.py
→ 0 lines
```

No endpoint added/removed/renamed. No request/response schema field change. Endpoints:
- `/api/predict` — `POST` JSON — unchanged.
- `/api/merge-and-compute-ma99` — `POST` JSON — unchanged.
- `/api/history-info` — `GET` JSON — unchanged.
- `/api/upload-history` — `POST` multipart — unchanged.
- `/api/business-logic` — `POST` JSON — unchanged.
- `/api/auth` — `POST` JSON — unchanged.

### §6.2 Frontend observable diff (Axis B, 4+ rows)

| Scenario | Pre (base 1090e63) | Post (K-049 P2b) | Impact |
|----------|--------------------|--------------------|--------|
| Full-set: `/app` predict button → `fetch('https://k-line-backend-....run.app/api/predict')` with `VITE_API_BASE_URL` baked at build-time | Direct Cloud Run URL, CORS preflight OPTIONS sent, `Access-Control-Allow-Origin` header returned by backend | `fetch('/api/predict')` (relative), same-origin, no preflight, no CORS header required. Same body, same status code. | Observable: network panel shows `k-line-prediction-app.web.app/api/predict` instead of `*.run.app`. No behavior change. |
| Subset: `/app` history upload (multipart POST) | Same direct-Cloud-Run flow with preflight | Same-origin, no preflight | Zero functional change; possibly faster first-request (no preflight RTT). |
| Empty: no GA ID set in `.env.production` at build time | `npm run build` succeeds; ships bundle with no GA; runtime no-op via `if (!measurementId) return` | `npm run build` FAILS at prebuild `validate-env.mjs` with `VITE_GA_MEASUREMENT_ID must match G-[A-Z0-9]{10,}` | **Intentional behavior change** — captured as AC-049-DEPLOY-ENVGUARD-1 |
| Boundary: malformed GA ID (`G-` with 9 chars, below the 10-char regex floor) | Ships broken GA silently (gtag.js rejects) | Build fails with regex message | **Intentional** — captured as AC-049-DEPLOY-ENVGUARD-1 |
| Boundary: browser reading a hashed asset URL `/assets/index-abc123.js` post-deploy | Default Firebase cache-control (short TTL) | `Cache-Control: public, max-age=31536000, immutable` | Intentional — AC-049-CACHE-1 |
| Boundary: browser reading `/index.html` post-deploy | Default Firebase cache-control | Unchanged (no `/index.html` entry in `headers[]`; Firebase default `no-cache` persists) | AC-049-CACHE-1 "MUST NOT have immutable" negative assertion |

### §6.3 Request-flow side-by-side

```
PRE-K-049:
  Browser → fetch('https://k-line-backend-xxx.run.app/api/predict')
       ↓ CORS preflight OPTIONS
       ↓ backend/main.py CORSMiddleware → Access-Control-Allow-Origin: https://k-line-prediction-app.web.app
       ↓ POST with JSON
       ↓ backend returns 200

POST-K-049 (Phase 2b complete):
  Browser → fetch('/api/predict') (same-origin)
       ↓ Firebase Hosting matches rewrite rule  /api/** → Cloud Run service
       ↓ Firebase edge forwards to Cloud Run (no CORS involved — server-to-server)
       ↓ backend (CORSMiddleware removed) returns 200 JSON
       ↓ Firebase edge returns JSON to browser as same-origin response
```

**CORS middleware removal rationale:** once Firebase Hosting acts as the edge proxy, the browser sees `k-line-prediction-app.web.app/api/predict` (same-origin); the server-to-server hop from Firebase edge to Cloud Run does NOT require browser-level CORS headers. Leaving `CORSMiddleware` in place would be dead code — harmless but violates the ticket's "remove CORS middleware" scope commitment. Phase 2b is the cleanup, gated by ≥24h soak to ensure the rewrite is fully edge-cached across regions.

---

## §7 Firebase Hosting config schema (annotated)

### §7.1 Before (1090e63)

```jsonc
{
  "hosting": {
    "site": "k-line-prediction-app",
    "public": "frontend/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }   // catches EVERY path
    ]
  }
}
```

### §7.2 After (Phase 2a end)

```jsonc
{
  "hosting": {
    "site": "k-line-prediction-app",
    "public": "frontend/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],

    "headers": [
      // Security headers — apply to every path
      {
        "source": "**",
        "headers": [
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
          { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
          { "key": "Content-Security-Policy-Report-Only", "value": "<CSP policy — see §7.3>" }
        ]
      },
      // Immutable long-cache for hashed assets ONLY (NOT index.html)
      {
        "source": "/assets/**",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
        ]
      },
      // Defensive manifest MIME
      {
        "source": "/manifest.json",
        "headers": [
          { "key": "Content-Type", "value": "application/manifest+json" }
        ]
      },
      // Explicit sitemap MIME (AC-049-ROBOTS-1 accepts application/xml OR text/xml;
      // Firebase default from .xml extension gives one of these — explicit keeps drift out)
      {
        "source": "/sitemap.xml",
        "headers": [
          { "key": "Content-Type", "value": "application/xml" }
        ]
      }
    ],

    "rewrites": [
      // ORDER MATTERS — /api/** must match BEFORE the SPA catch-all
      {
        "source": "/api/**",
        "run": { "serviceId": "<cloud-run-service-id>", "region": "<region>" }
      },
      // SPA catch-all — matches everything else
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

### §7.3 CSP policy string (draft — Engineer implements verbatim)

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https://www.google-analytics.com https://www.googletagmanager.com;
connect-src 'self' https://www.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com;
manifest-src 'self';
frame-ancestors 'none';
base-uri 'self';
form-action 'self'
```

**Per persona §AC Sync Gate** if this draft conflicts with any AC text I haven't seen, Engineer flags BQ back to PM before implementing.

### §7.4 rewrite vs file-serving priority (pinned assumption)

Firebase Hosting priority order (documented in Firebase docs, and confirmed empirically in K-034 deploy testing):

```
1. Reserved namespace: /__/*
2. Configured redirects
3. Exact-match static content from `public` dir  ← robots.txt / sitemap.xml match here
4. Configured rewrites (in `rewrites[]` array order)  ← /api/** then ** catch-all
5. 404
```

`robots.txt` and `sitemap.xml` live in `frontend/public/` → copied to `frontend/dist/` by Vite → served as static assets at step 3, BEFORE the rewrites array is consulted. **No explicit rewrite exclusion required.** Engineer validates via `curl -sI /robots.txt` post-deploy; if response body is HTML (regression), adds two explicit `rewrites[]` entries `{ "source": "/robots.txt", "destination": "/robots.txt" }` + `{ "source": "/sitemap.xml", "destination": "/sitemap.xml" }` before the catch-all (Firebase rewrite with `destination` = same path = serve-as-file).

---

## §8 Sacred-regression compliance table

Per ticket frontmatter `sacred-regression: [K-037, K-034-P1, K-030, K-024]` + persona §Sacred AC + DOM-Restructure Cross-Check.

### §8.1 Token / selector grep sweep (verbatim from persona)

```bash
grep -rn 'data-testid="cta-' frontend/e2e/ frontend/src/
  → 10 hits — all in existing specs (about-v2, home, etc.); K-049 touches none.
grep -rn 'trackCtaClick(' frontend/e2e/ frontend/src/
  → 8 hits — analytics.ts + consumers; K-049 touches none.
grep -rn 'target="_blank"' frontend/e2e/ frontend/src/
  → 6 hits — external link anchors; K-049 touches none.
grep -rn 'href="mailto:' frontend/e2e/ frontend/src/
  → 4 hits — Footer + About; K-049 touches none.
grep -rn 'nextElementSibling.id' frontend/e2e/
  → 1 hit — about-v2.spec.ts #architecture K-031 adjacency; K-049 NOT in scope (no JSX restructure).
grep -rn 'previousElementSibling.id' frontend/e2e/
  → 0 hits.
grep -rn "querySelector('#" frontend/e2e/
  → 3 hits — favicon-assets.spec.ts + diary specs; K-049 NOT restructuring DOM, zero collision.
```

All token/selector greps show K-049 touches ZERO DOM/JSX structure, only `<head>` static content + `firebase.json` + `main.tsx` imports. Sacred cross-check passes cleanly.

### §8.2 Sacred table

| Sacred | This ticket's impact | Resolution |
|--------|----------------------|------------|
| K-037 favicon `<link>` tags (6 tags on `index.html` L11-16, K-037 Architect Ruling Q1 lock) | Bodoni URL edit on L10 is adjacent. Engineer MUST NOT touch L11-16. `<meta>` inserts MUST be BEFORE L10 (in the `<meta>` block, after `theme-color`) or AFTER L16 (but still inside `<head>`). | Unchanged because `index.html` diff is strictly net-add `<meta>` tags + JSON-LD + surgical URL query-param drop; favicon `<link>` block is outside the edit window. `favicon-assets.spec.ts` suite provides automated regression — re-runs green under Phase 3's lazy-route changes (no asset path change). |
| K-037 `manifest.json` byte-identity (K-037 Architect Ruling Q3 locked `display: browser`) | AC-049-PWA-1 explicitly overrides Q3 by flipping to `"standalone"` — this is the ticket's legitimate override per PM ruling (see BQ already closed in ticket §PM AC authoring — Phase 1 AC body). Other fields (`icons`, `theme_color`, `start_url`) preserved byte-identical. | Unchanged except for `display` — intentional per AC-049-PWA-1. Engineer verifies `manifest.json` diff == single-line change (`"browser"` → `"standalone"`). |
| K-034-P1 Footer byte-identity (shared Footer component, 5-route pairwise `getBBox().width` diff ≤32px) | K-049 does not import/modify Footer. React.lazy wraps page components; Footer is rendered INSIDE each page, so lazy loading defers Footer render by the same amount as page render — cross-route parity preserved. | Unchanged because `shared-components.spec.ts` runs against the BUILT bundle; lazy chunks resolve before Playwright assertion time (use `waitForLoadState('networkidle')` if Suspense fallback flashes are measurable, per AC-049-SUSPENSE-1 tolerance). |
| K-030 `/app` isolation (standalone dark-themed background, no sitewide token leak) | RouteSuspense fallback uses `bg-[#F4EFE5]` paper — **this could flash paper on `/app` route during Suspense fallback before AppPage mounts its dark bg.** | **Mitigation:** RouteSuspense accepts no route prop (persona §Shared primitives), so it cannot route-switch its bg. Engineer must keep RouteSuspense background `bg-[#F4EFE5]` because: (a) 4 of 5 routes use paper, (b) `/app`'s dark bg is set by AppPage root element after mount, so the flash is ~100ms at most and visually identical to a first-paint reflow (already exists today pre-lazy). Acceptance: manual visual probe on `/app` cold-load — if flash is perceptible & jarring, Engineer escalates a BQ before Phase 3 commit. **Trigger:** only if user reports visible flash; otherwise accept as cold-load artifact. |
| K-024 `/diary` flat schema (diary.json path: GET /diary.json as static asset) | `/api/**` rewrite does NOT match `/diary.json` (the path is literal `.json`, not `/api/...`); Firebase step-3 file serving catches `/diary.json` first. | Unchanged. `curl -sI /diary.json` post-Phase-2a probe confirms `Content-Type: application/json` (Firebase default) and body is the diary JSON, not SPA shell. |

---

## §9 Phase 3 lazy-route risk register (per-route)

Per persona §Target-Route Consumer Scan — route navigation timing changes slightly under React.lazy. Enumerate:

| Route | Entry path | Risk under lazy | Mitigation |
|-------|-----------|-----------------|------------|
| `/` → `/app` | `<Link to="/app">` in HeroSection + NavBar | lazy chunk fetch adds ~50-300ms to first navigation; Suspense fallback visible | Use `waitForLoadState('networkidle')` in Playwright; add `data-testid="route-suspense"` so specs can optionally wait on fallback exit |
| `/` → `/about` | NavBar `<Link>` | Same | Same |
| `/` → `/diary` | NavBar `<Link>` + HomePage DevDiarySection "View all" CTA | Same | Same |
| `/` → `/business-logic` | NavBar `<Link>` | Same | Same |
| `/app` → `/` | NavBar `<Link>` (brand) | / chunk may be preloaded from initial visit | Same |

**No `needs-sync` entries** — every entry point uses React Router `<Link>` (SPA nav); none use `<a href>` that would bypass the router. Lazy chunking is Router-aware and transparent to all entry-points.

**GA pageview timing under lazy** (AC-049-GA-LAZY-1): `useGAPageview` fires inside `<GATracker />`, which is mounted ONCE at the `<BrowserRouter>` level and reads `useLocation()` — the effect fires on `location.pathname` change regardless of whether the route component has resolved. So `page_view` event fires BEFORE the page component mounts; using `document.title` as the `page_title` source would capture the PREVIOUS page's title (race). The pre-existing `PAGE_TITLES` map short-circuits this race because it is keyed by `location.pathname` (synchronous string match), not by `document.title`. **Design binding for Engineer:** do NOT add `document.title` reads in `useGAPageview` during Phase 3; leave the `?? document.title` fallback as a vestigial safety net for unknown routes (catch-all `*` → `/` Navigate → `/` title).

---

## §10 Boundary Pre-emption table (persona §Boundary Pre-emption)

| Scenario | Status | Notes |
|---|---|---|
| Empty / null input (e.g. sitemap with zero git-log result for a page) | Covered | `generate-sitemap.mjs` exit non-zero if `git log` returns empty — AC-049-SITEMAP-1 implicitly enforces via `xmllint` well-formedness |
| Max value boundary (GA ID length) | Covered | AC-049-DEPLOY-ENVGUARD-1 regex `G-[A-Z0-9]{10,}` floors at 10 chars; ceiling not enforced (GA4 IDs are typically 10 chars but docs allow more) — accept anything ≥10 |
| API error response (4xx/5xx/timeout on `/api/**` post-rewrite) | Covered | Firebase rewrite to Cloud Run passes through backend HTTP status verbatim; CSP `connect-src` includes `'self'` so API errors display normally; no new error-handling path |
| Concurrency (double deploy, race between firebase deploy and cloud run deploy) | Covered by Phase ordering | Phase 2a deploy (rewrite) ≥24h before Phase 2b deploy (CORS removal); Engineer logs timestamps in commit messages |
| Empty list / single item (sitemap with 0 or 1 URLs) | N/A | 5 routes hardcoded in script; fails if any route's `git log` returns empty |
| CSP `Content-Security-Policy-Report-Only` with no report endpoint | Known-Gap (captured) | AC-049-CSP-REPORT-1 final clause: "if no report endpoint is configured, `## Known Gaps` of ticket documents this." K-050 will resolve. Phase 2a records as Known Gap in commit message. |

---

## §11 Refactorability Checklist

| Item | Status | Rationale |
|------|--------|-----------|
| Single responsibility | ✓ | `generate-sitemap.mjs` does exactly sitemap gen; `validate-env.mjs` does exactly env validation; `RouteSuspense.tsx` does exactly loading state; no multi-purpose modules introduced. |
| Interface minimization | ✓ | `RouteSuspense` props = zero (no over-coupling). `PAGE_TITLES` stays at 5 entries (no dynamic loader). |
| Unidirectional dependency | ✓ | main.tsx → hooks → utils (existing shape); no new circular dependency. Firebase config is static, no circular. |
| Replacement cost | ✓ | Swap Firebase Hosting for alternative host → edit `firebase.json` only, `package.json` build output unchanged. Swap GA4 for alt analytics → `utils/analytics.ts` edit only (pre-existing abstraction already handles this). |
| Clear test entry point | ✓ | Every AC has a `curl` or `Playwright` probe wired to a deterministic HTTP response or DOM attribute; no "inspect and decide" clauses. |
| Change isolation | ✓ | Head-block edit (Phase 1) doesn't affect API contract. Firebase config edit (Phase 2a) doesn't affect React component tree. Lazy-chunking (Phase 3) doesn't affect backend. Each Phase commit is behaviorally independent. |

---

## §12 All-Phase Coverage Gate

| Phase | Backend API | Frontend Routes | Component Tree | Props Interface |
|-------|-------------|-----------------|----------------|-----------------|
| 1 (head block) | N/A (no backend touch) | N/A (no route change) | N/A (`<head>` tags aren't React components) | N/A |
| 2a (firebase config) | N/A (config change, not API logic) | N/A | N/A | N/A |
| 2b (backend CORS removal) | ✓ CORSMiddleware removed — schema unchanged, §6.1 wire-diff 0 lines | N/A | N/A | N/A |
| 3 (React.lazy) | N/A | ✓ (5 routes, Route Impact Table §3) | ✓ (new RouteSuspense; main.tsx Suspense wrap) | ✓ (RouteSuspense: no props) |

All cells ✓ or explicitly N/A with documented reason.

---

## §13 AC ↔ Test Case Count Cross-Check

| AC | Test count |
|----|------------|
| AC-049-PROBE-1 | 5 curl assertions (1 per meta tag probe + 1 author + 1 JSON-LD parse + 1 real-name grep) |
| AC-049-PWA-1 | 1 Lighthouse PWA audit + 1 manifest schema check |
| AC-049-BODONI-1 | 1 grep-count assertion + 1 Lighthouse LCP baseline compare |
| AC-049-ROBOTS-1 | 2 curl Content-Type assertions + 1 curl body-no-HTML + 1 xmllint |
| AC-049-SITEMAP-1 | 5 `<url>` entries × (exists + lastmod present) + 1 xmllint |
| AC-049-CSP-REPORT-1 | 5 curl header-presence assertions × 5 routes + 3-browser probe × 5 routes = 5 + 15 = 20; Known Gap doc check +1 |
| AC-049-DEPLOY-ORDER-1 | 4 sequential probes (rewrite → cors-no-longer-gates → api-base-url-retired) |
| AC-049-DEPLOY-ENVGUARD-1 | 3 build outcomes (unset-fails / invalid-fails / valid-succeeds) + 1 deploy grep |
| AC-049-CACHE-1 | 1 curl immutable + 1 curl no-immutable on index.html + 1 public/assets/ existence guard |
| AC-049-SUSPENSE-1 | Playwright × 5 routes (existing E2E re-run) + 1 chunk-count check |
| AC-049-GA-LAZY-1 | 1 test × 3 navigations + page_title match check + TD-001 unblock (separate) |

Engineer owns final Playwright spec count; brief doesn't add new tests (persona §Non-goals — "No new tests in brief").

---

## §14 Architecture Doc Sync Plan

After Phase 3 close, Engineer Edit `agent-context/architecture.md`:

1. **Update `Deployment Architecture` section** (create if missing — K-044 retro flagged this as the one remaining gap): document Firebase rewrite `/api/**` → Cloud Run + same-origin + CORSMiddleware retired.
2. **Update `Frontend Routing` section** — annotate 5 routes as "lazy-loaded via React.lazy + Suspense".
3. **Append Changelog entry:** `YYYY-MM-DD (K-049)`: head-block meta + manifest standalone + Bodoni cleanup + robots/sitemap + security headers + CSP-Report-Only + Firebase /api/** rewrite + backend CORSMiddleware retired + route-level lazy loading. Structural changes: Deployment Architecture section added; Frontend Routing annotated lazy.
4. **Bump `updated:` frontmatter** to the Phase 3 commit date.

Pre-Write Name-Reference Sweep (per persona §Architecture Doc Self-Diff): `grep -n "CORSMiddleware\|/api/\|React.lazy\|robots\|sitemap\|CSP" agent-context/architecture.md` — any pre-existing mentions get classified (current-state edit vs historical Changelog preserve) before Edit.

Engineer performs the actual Edit and attaches a Self-Diff Verification block to the Phase 3 commit message.

---

## §15 Delivery Gate Summary

```
Architect delivery gate:
  all-phase-coverage=✓,
  pencil-frame-completeness=N/A (ticket visual-delta: none; no Pencil frames consumed),
  visual-spec-json-consumption=N/A (visual-delta: none per ticket frontmatter + Content-Alignment Gate closed),
  sacred-ac-cross-check=✓ (4 Sacred items table §8.2 populated),
  route-impact-table=complete (§3 5 routes × 10 ACs),
  cross-page-duplicate-audit=✓ (§5 grep outputs recorded),
  target-route-consumer-scan=complete (§9 5-route enumeration),
  architecture-doc-sync=✓ (plan in §14; Engineer executes at Phase 3 commit),
  self-diff=✓ (this brief is new file; no cross-table consistency check needed for a new doc)
  → OK (with BQ-049-ARCH-01 open non-blocker)
```

---

## §16 Risks and Engineer Notes

1. **Firebase `<cloud-run-service-id>` + `<region>` placeholders** in §7.2 rewrite block — Engineer must fill from Firebase project console OR existing deploy scripts; if unknown, raise BQ. This is NOT a design decision, it's a deploy-environment fact-lookup.
2. **CSP policy draft (§7.3) is a best-guess baseline** — Engineer runs Phase 2a deploy with it, then immediately runs 5-route probe + checks browser console for `securitypolicyviolation` events. Any violation → tighten the policy + redeploy ONE more time within Phase 2a before soak starts. Do not let violations accumulate into soak window.
3. **`RouteSuspense` has zero Pencil spec** — persona §Visual Spec JSON Consumption Gate exempts this because ticket is `visual-delta: none`; RouteSuspense is a functional loading state (transient, ≤300ms visible). Engineer picks minimal visual (centered spinner or blank paper bg) — final call goes to Engineer, not a Pencil handoff.
4. **Firebase Hosting file-priority assumption (§7.4)** is empirical; if Phase 2a `curl -sI /robots.txt` returns the SPA HTML shell, Engineer adds explicit `rewrites[]` exclusions before proceeding. Do NOT ship Phase 2a if the probe reports SPA HTML.
5. **Phase 2b commit + deploy blocked on Phase 2a ≥24h soak** — Engineer logs the Phase 2a deploy timestamp in commit message; Phase 2b commit message must reference the timestamp and include `24h+ soak confirmed` phrase.
6. **Post-deploy, `CORS_ORIGINS` env var remains set in Cloud Run** after Phase 2b code removal — dead env var, harmless. PM-ruled out of scope (cleanup via separate Cloud Run console session). Engineer does not Edit Cloud Run env in this ticket.
7. **`VITE_GA_MEASUREMENT_ID` regex floor at 10 chars** — GA4 documentation says measurement IDs are fixed format `G-XXXXXXXXXX` (10 chars after `G-`); brief-level floor at `{10,}` accommodates future rate limit / longer ID classes. Tighten to `{10,12}` if PM prefers stricter bound.

---

## §17 Retrospective

**Where most time was spent:** §6.3 request-flow side-by-side — needed to verify that removing `CORSMiddleware` while Firebase Hosting rewrites `/api/**` to Cloud Run is safe (server-to-server hop doesn't need browser CORS). Required cross-referencing Firebase Hosting docs' edge-proxy behavior vs the existing CORS middleware's purpose.

**Which decisions needed revision:** initial §7.2 draft included explicit `rewrites[]` exclusions for `/robots.txt` + `/sitemap.xml`; backed out to rely on Firebase's file-serving priority (§7.4) after confirming the documented priority order. Kept Engineer-visible Known Gap in §16 risk 4 so the empirical verification step is hard-coded.

**Next time improvement:** when a PM brief cites paraphrased route lists or BQs against the ticket, run `git show HEAD:docs/tickets/K-XXX.md` + diff against the brief paragraph FIRST before starting design — this session's BQ-049-ARCH-01 (`/examples` vs `/business-logic`) surfaced at §0 only because I crossed the ticket AC and PM brief side-by-side; had I accepted PM brief verbatim, the sitemap script would have referenced a nonexistent route.
