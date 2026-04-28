---
id: K-057
title: Landing-page product positioning + legal/conversion polish — 5-finding batch from 2026-04-28 interviewer-reviewer audit (product-frame re-eval after K-049 portfolio-frame audit)
status: open
created: 2026-04-28
type: feat + refactor + ops
priority: high
size: large
visual-delta: yes
content-delta: yes
design-locked: true
qa-early-consultation: done-2026-04-28-K-057-phase5
dependencies: [K-049]
sacred-regression: [K-037 favicon, K-034-P1 Footer byte-identity, K-030 /app isolation, K-024 diary.json flat schema, K-049 OG/canonical/JSON-LD plumbing]
worktree: .claude/worktrees/K-057-landing-product-polish
branch: K-057-landing-product-polish
base-commit: 5af9578
audit-source: 2026-04-28 interviewer-reviewer red team (product-landing-page framing) + improve-mode delivery for P0-2 specifics
lighthouse-baseline-mobile-throttled:
  - home: perf=70 a11y=93 bp=96 seo=100 lcp=5.2s fcp=4.3s
  - about: perf=69 a11y=94 bp=96 seo=92 lcp=5.4s fcp=4.4s
  - app: perf=72 a11y=86 bp=96 seo=92 lcp=5.5s fcp=2.8s cls=0.006
---

## Summary

Second-pass interviewer-reviewer audit of production `https://k-line-prediction-app.web.app`, this time framed as **product landing page** (not portfolio — user override of framing 2026-04-28). 5 actionable findings from the new framing, none of which K-049's portfolio-frame audit caught:

1. **Hero copy + CTA legal exposure** — `Predict the next move before it happens` is a financial-advice red-line phrase, especially when paired with `applicationCategory: FinanceApplication` JSON-LD (set in K-049). Zero financial disclaimer anywhere on public surface.
2. **Zero zero-friction product preview path** — Hero CTA `Try the App →` jumps to `/app` (new tab) which requires user to upload 24 × 1H OHLC CSV. `examples/ETHUSDT_1h_test.csv` (3926 bytes) exists but landing page never advertises it; user has no `?sample=ethusdt` shortcut to auto-load.
3. **Zero product visual evidence on landing** — `<img>` count on home + about = 0. Product landing with no hero shot / app screenshot / match-result example. LCP element is text (Hero h1), so LCP is gated by 3 mono fonts blocking + JS parse — confirmed by Lighthouse 5.2-5.5s LCP across 3 routes.
4. **OG image meta + Twitter Card image** — K-049 added `og:title/description/url/type` but **`og:image` tag was never written** to `index.html`. Confirmed live: `<head>` lines 11-15 lack `og:image` + `twitter:image`. `/og-image.png` returns HTTP 200 but `content-type: text/html` (SPA fallback). LinkedIn / Twitter / Slack share previews are pure-text cards.
5. **Zero GDPR consent banner + zero activation funnel events** — `analytics.ts:19-41` `initGA()` fires before any consent gate. Footer disclosure (`This site uses Google Analytics`) is notification, not opt-in. GA4 only tracks `page_view` + `cta_click(label)`; no `app_demo_started` / `app_csv_uploaded` / `app_match_run` / `app_result_viewed` funnel events — current state cannot answer "what is our activation rate."

**User constraints (re-affirmed from K-049):**
- ❌ NO real name / Person / Organization schema on public surface
- ✅ `<title>` stays literal `K-Line Prediction`
- ⚠️ `<meta name="author" content="mshmwr">` (handle-only) was K-049 user-pick; keep unless user re-rules

**Why batched:** all 5 items share landing-page product-narrative motivation. Splitting compounds 5× build/deploy cycles without isolating any behavior — same logic as K-049's 10-item batch.

## Lighthouse baseline (mobile, throttled, 2026-04-28)

Captured `/tmp/kline-audit/lighthouse-{home,about,app}.json` before any K-057 work. Three-route Web Vitals all in **POOR** zone (LCP > 4s threshold).

| Route | Perf | A11y | BP | SEO | LCP | FCP | CLS | TBT |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` | 70 | 93 | 96 | 100 | 5.2s | 4.3s | 0 | 30ms |
| `/about` | 69 | 94 | 96 | 92 | 5.4s | 4.4s | — | — |
| `/app` | 72 | 86 | 96 | 92 | 5.5s | 2.8s | 0.006 | 50ms |

**Note:** post-fix Lighthouse re-run is gated AC. Adding hero shot may push LCP to image (could improve via preload, or worsen if image > text). QA must Lighthouse re-measure on each Phase deploy.

## Phases (preliminary — Architect owns final structure)

### Phase 1 — Hero + JSON-LD Educational pivot (zero-runtime-risk static edits)

**Items:** finding 1 (Hero copy + disclaimer banner + JSON-LD `EducationalApplication`).

Source code targets:
- `frontend/src/components/home/HeroSection.tsx` lines 9-17 (Hero `lines[]` + sub-line `<p>`)
- `frontend/src/components/home/HeroSection.tsx` line 26 (CTA copy)
- `frontend/index.html` lines 25-50 (JSON-LD `<script>` block)
- New: `frontend/src/components/shared/DisclaimerBanner.tsx` (top banner)
- New: `frontend/src/components/shared/FooterDisclaimer.tsx` or extend `Footer.tsx`

**Approved copy + code from improve-mode delivery 2026-04-28:**

#### 1a. Hero rewrite — recommended **Variant B (tool framing)**

```tsx
<PageHero
  desktopSize={56}
  lines={[
    { text: 'K-line similarity', color: 'ink' },
    { text: 'lookup engine.', color: 'brick-dark' },
  ]}
/>
```

Sub-line replacing `Pattern-matching engine for K-line ...`:
```
Search past ETH/USDT formations that resemble any candlestick window. Inspect what came after — for learning, not for trading signals.
```

#### 1b. CTA — recommended **Variant B copy** + `?sample=ethusdt` query

```tsx
<a
  href="/app?sample=ethusdt"
  target="_blank"
  rel="noopener noreferrer"
  className="..."
>
  Run the ETH/USDT Demo →
</a>
```

`/app` page must read `searchParams.get('sample')` and auto-fetch `/examples/ETHUSDT_1h_test.csv` into Official Input state when `=== 'ethusdt'`. (See Phase 2.)

#### 1c. Top disclaimer banner — recommended **placement (β) above Hero**

```tsx
<div className="bg-[#2A2520] text-[#F4EFE5] text-xs px-4 py-2 text-center">
  Lookup tool for K-line shape similarity — for learning and exploration.
  Outputs are not predictions and not financial advice.
</div>
```

#### 1d. Footer disclaimer block

```markdown
**Disclaimer.** K-Line Prediction is an educational tool that surfaces
historically similar candlestick formations from past ETH/USDT data.
It does not constitute financial advice, investment recommendation, or
a forecast of future market behavior. Past patterns and historical
similarity scores do not predict future returns — markets are
non-stationary and prior outcomes carry no guarantee of recurrence.
Use this tool at your own discretion and conduct independent due
diligence before making any trading or investment decision.
```

Render as `<section>` with `<h2>Disclaimer</h2>` heading (a11y + legal prominence), full-width footer-area placement, `text-[13px] leading-[1.6]`.

#### 1e. JSON-LD replacement (`index.html` lines 25-50)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalApplication",
      "name": "K-Line Prediction",
      "url": "https://k-line-prediction-app.web.app/",
      "applicationCategory": "EducationalApplication",
      "applicationSubCategory": "Reference",
      "operatingSystem": "Web",
      "description": "Educational pattern-similarity tool for ETH/USDT candlestick charts. Surfaces historically similar formations for study purposes. Not financial advice and not a market forecast.",
      "educationalUse": ["study", "exploration", "reference"],
      "learningResourceType": ["interactive resource", "reference work"],
      "audience": {
        "@type": "EducationalAudience",
        "educationalRole": "self-learner"
      },
      "isAccessibleForFree": true,
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "usageInfo": "https://k-line-prediction-app.web.app/#disclaimer"
    },
    {
      "@type": "WebSite",
      "name": "K-Line Prediction",
      "url": "https://k-line-prediction-app.web.app/",
      "inLanguage": "en"
    }
  ]
}
</script>
```

**Lock:** zero `Person` / `Organization` / `author` / `creator` fields per user constraint.

### Phase 2 — `/app` sample auto-load (router + AppPage state hydration)

**Items:** finding 2 (zero-friction preview).

- `AppPage` reads `?sample=ethusdt` query → fetches `/examples/ETHUSDT_1h_test.csv` → parses via existing `parseOfficialCsvFile` (K-046 export) → populates Official Input 24 rows + sets `Loaded rows: 24` indicator
- Sacred: K-046 `parseOfficialCsvFile` contract preserved
- Sacred: K-009 `_history_1d` object identity preserved
- Sacred: K-013 stats contract preserved
- New Playwright: visit `/app?sample=ethusdt` → assert 24 rows filled + `Start Prediction` enabled

### Phase 3 — Product hero shot + Web Vitals re-measure

**Items:** finding 3 (visual evidence).

- Designer captures `/app?sample=ethusdt` post-prediction screenshot → exports 1200×750 JPG/WebP
- Hero section gets new `<img>` placement BELOW Hero text + ABOVE CTA (or to-be-decided BQ-057-01 — hero-shot left/right vs full-bleed below)
- Add `<link rel="preload" as="image" href="/hero-shot.webp" fetchpriority="high">` to `index.html`
- Lighthouse re-measure on deploy: LCP must not regress past 5.5s baseline; target < 3.5s

### Phase 4 — OG image generation + share-card preview

**Items:** finding 4 (`og:image` + `twitter:image`).

- Designer creates `og-image.png` (1200×630, brand palette + product hero shot composite + tagline)
- Place at `frontend/public/og-image.png`
- Add to `index.html` `<head>`:
  ```html
  <meta property="og:image" content="https://k-line-prediction-app.web.app/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="https://k-line-prediction-app.web.app/og-image.png" />
  ```
- Verify with `curl -sI /og-image.png` returns `content-type: image/png` (NOT `text/html` SPA fallback)
- Test rendering via opengraph.xyz / Twitter Card Validator

### Phase 5 — GDPR consent + activation funnel events

**Items:** finding 5 (consent + funnel events).

- `react-cookie-consent` lib (~5KB) or hand-rolled 90-line equivalent
- Default state: GA4 NOT initialized until consent granted
- Consent persisted in `localStorage` (`kline-consent: granted | declined | unset`)
- Decline → no GA4 init, banner stays dismissed for session
- Add 4 GA4 events:
  - `app_demo_started` — fired on `/app?sample=*` mount
  - `app_csv_uploaded` — Official Input CSV file fully parsed
  - `app_match_run` — `Start Prediction` button clicked + backend response received
  - `app_result_viewed` — Match List rendered with ≥1 match
- Backend GA4 setup: mark these 4 events as `conversion` in GA4 admin (PM AC)

## Acceptance Criteria (preliminary — Architect owns final wording)

- AC-057-HERO-COPY-NO-PREDICT: production `/` HTML body contains zero of: `Predict the next move`, `before it happens`, `Pattern-matching engine` (post-deploy curl + grep)
- AC-057-DISCLAIMER-BANNER-VISIBLE: production `/` first-paint shows top banner with `not financial advice` text (Playwright `page.locator(...).isVisible()` at viewport top)
- AC-057-FOOTER-DISCLAIMER-EXISTS: production all-route footer contains `<h2>Disclaimer</h2>` + 4-sentence body (Playwright assertion)
- AC-057-JSONLD-EDUCATIONAL: `<script type="application/ld+json">` parsed contains `"@type": "EducationalApplication"` and zero of `Person|Organization|author|creator|FinanceApplication`
- AC-057-CTA-SAMPLE-QUERY: Hero CTA href `=== '/app?sample=ethusdt'` (Playwright)
- AC-057-APP-AUTOLOAD: visiting `/app?sample=ethusdt` populates 24-row Official Input within 3s + `Start Prediction` enabled (Playwright)
- AC-057-OG-IMAGE-REAL: `curl -sI https://k-line-prediction-app.web.app/og-image.png` returns `content-type: image/png` (NOT `text/html`); HTML head contains `og:image` + `twitter:image` meta tags
- AC-057-CONSENT-GATE: visiting `/` from incognito DOES NOT fire GA4 `collect?` request until consent banner CTA clicked (Playwright + Network intercept)
- AC-057-FUNNEL-EVENTS: GA4 DebugView shows 4 distinct events fired during scripted user journey `/?sample=ethusdt → upload → start prediction → view match` (PM Playwright probe with `gtag.debug=true`)
- AC-057-LIGHTHOUSE-NO-REGRESS: post-deploy Lighthouse mobile LCP ≤ 5.5s on all 3 routes; target ≤ 3.5s on `/`
- AC-057-K-049-NO-REGRESS: K-049 `Sacred` 10 items still pass (robots / sitemap / 5 security headers / canonical / cache-control)

## Open BQs for PM

- **BQ-057-01** — Hero shot placement: (A) below Hero text + above CTA, (B) right side of Hero text 2-col, (C) full-bleed below Hero entire `<section>`. Visual designer call. **Default if unblocked: A.**
- **BQ-057-02** — Top banner persist on scroll vs first-paint-only: (A) sticky top, (B) non-sticky, scrolls away with content. Legal vs UX trade-off. **Default if unblocked: B (non-sticky).** Banner appears in initial paint = legal minimum; persistent banner is UX-noisy.
- **BQ-057-03** — Consent banner default position: (A) bottom-left compact, (B) bottom full-width, (C) center modal blocking. **Default: A.** Modal blocking is high-friction; bottom is industry standard.
- **BQ-057-04** — `<meta name="author" content="mshmwr">` keep or remove? K-049 chose keep (handle-only OK). **Default: keep** unless user re-rules.
- **BQ-057-05** — Phase deploy strategy: 1 atomic deploy of all 5 Phases vs incremental (Phase 1+4 first, Phase 2-3-5 separate). **Default: Architect proposes; user signs off.**

## Sacred Cross-Check (K-049)

K-049 closed 2026-04-25 with these public-surface invariants:
- robots.txt + sitemap.xml served as text (not SPA HTML)
- 5 security headers + CSP report-only
- Cache-Control immutable for `/assets/**`
- Bodoni Moda removed
- React.lazy 5-route split
- `<meta name="author" content="mshmwr">` (handle-only)
- JSON-LD `SoftwareApplication` with `applicationCategory: FinanceApplication`
- manifest display=standalone

K-057 INTENTIONALLY MODIFIES JSON-LD (`SoftwareApplication` → `EducationalApplication`, `FinanceApplication` → `EducationalApplication` category). All other K-049 outputs preserved. Document SSOT change in `docs/sacred-registry.md` per K-052 Sacred Reconcile Workflow if K-049 declared `sacred-clauses`.

## Tech Debt Spawned (preliminary)

- TD-K057-01 (medium) — Lighthouse re-measure as deploy-time CI probe (currently manual). Aligns with K-049 TD-K049-02 (deploy-smoke probes manual cookbook → CI).
- TD-K057-02 (low) — Per-route `<title>` + `<description>` + `<canonical>` swap (was P0-3 in audit, NOT in K-057 scope). Requires `react-helmet-async` or hand-rolled `useEffect` doc.title swap. Defer to standalone refactor ticket.
- TD-K057-03 (low) — `/about` add visual evidence (Pencil designer screenshot + ticket markdown screenshot + retro doc sample). Was P1-5 in audit. Defer until Designer bandwidth.

## Audit Provenance

- Source: `claude-code-audit` session 2026-04-28 (interviewer-reviewer agent, 2-pass review: portfolio-frame initial → product-frame reframe per user override)
- Improve-mode P0-2 deliverable: agent ID `a37e9219aface5f02` 2026-04-28
- Lighthouse JSON snapshots: `/tmp/kline-audit/lighthouse-{home,about,app}.json`
- Production screenshot snapshots: `/tmp/kline-audit/screenshots/page-{home,about,diary,app}.png`

## Next Gate

PM (next session) must:
1. Run **Pre-Worktree Sync Gate** for `K-057-landing-product-polish` worktree (already created from base `5af9578`)
2. Resolve **BQ-057-01..05** (5 BQs) — get user input on visual + deploy strategy
3. Run **Content-Alignment Gate** on Hero copy + disclaimer banner + Footer block (per `feedback_pm_content_alignment_before_engineer.md`) — user-voice content cannot ship without explicit user sign-off
4. Run **QA Early Consultation** (real-qa tier per runtime + content + GA event touch)
5. Release Architect for Phase structure ratification + AC patching
