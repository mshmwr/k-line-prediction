## 2026-05-07 — ops-web-perf full session (coordinator)

**What went well:** Three-optimization plan shipped in one session — WebP, font self-hosting, analytics chunk extraction — each through spec-compliance + code-quality two-stage review. Bundle visualizer stats-before/after screenshots provided concrete proof for the report.
**What went wrong:** (1) Lighthouse baseline taken with Chrome extensions active (score 74 / TBT 460ms) before discovering contamination — required remeasurement in incognito/CLI. (2) Font @fontsource imports copied Google Fonts URL verbatim without grepping for runtime consumers — retired fonts (IBM Plex Mono, Newsreader) slipped in, caught only at code-quality review round. (3) Technical report drafted in Chinese, violating English rule for `raw/articles/`.
**Next time improvement:** (1) Always run Lighthouse via CLI with `--chrome-flags="--disable-extensions"` for baseline; never trust browser measurement with extensions loaded. (2) Before any @fontsource import list, grep component src + tailwind.config per family — zero hits = not a runtime consumer. (3) Check language rule before Write on any `raw/articles/*.md` (fetched/ exempt).
**Slowest step:** Diagnosing the Chrome extension contamination — required user to notice the warning, then switching to CLI added another measurement round.

## 2026-05-07 — ops-web-perf Task 3 (analytics chunk extraction)

**What went well:** Dependency chain (ConsentBanner → analytics → page-apppage → vendor-charts) correctly traced via rollup-plugin-visualizer before writing any code; manualChunks extraction broke the chain cleanly; stats.html before/after confirmed 251KB raw removed from homepage eager preload.
**What went wrong:** Nothing — targeted vite.config.ts change with no scope creep.
**Next time improvement:** NA.
**Slowest step:** Generating stats-before screenshot required a full build run before the patch; acceptable overhead for the visual proof requirement.

## 2026-05-07 — ops-web-perf (WebP hero-shot)

**What went well:** `<picture>` semantics, fetchPriority placement, and attribute preservation all verified clean in one diff pass.
**What went wrong:** Nothing — minimal surgical change with no scope creep.
**Next time improvement:** NA — no structural miss; Safari/preload interaction flagged as Minor, accepted by PM.
**Slowest step:** git status K-037 gate; pre-creating the `pending/` directory was the only delay.

## 2026-05-07 — ops-web-perf Task 2 (font self-hosting migration)

**What went well:** crossorigin attribute correct; preload filename verified against dist build; main.tsx import order confirmed first-line.
**What went wrong:** IBM Plex Mono and Newsreader 400-italic imported with no runtime consumer — retired in K-040 — caught only at Step 2 depth review, not earlier.
**Next time improvement:** before declaring fonts.css imports complete, grep tailwind.config + component src for every family name; zero hits = unused import = Warning.
**Slowest step:** tracing K-040 retire history to confirm Newsreader and IBM Plex Mono were intentionally dropped from runtime use.
