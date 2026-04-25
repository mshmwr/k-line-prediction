# Brand asset sources

| Asset | Source | License | Fetch date | Notes |
|---|---|---|---|---|
| `github.svg` | https://raw.githubusercontent.com/simple-icons/simple-icons/master/icons/github.svg | CC0 1.0 (Simple Icons project) | 2026-04-25 | viewBox 0 0 24 24, single `<path>`, monochrome |
| `linkedin.svg` | https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/linkedin.svg (raw simple-icons npm package mirror; GitHub `master/icons/linkedin.svg` returns 404 due to upstream rename — npm package preserves canonical name) | CC0 1.0 (Simple Icons project) | 2026-04-25 | viewBox 0 0 24 24, single `<path>`, monochrome |
| `mail.svg` | https://raw.githubusercontent.com/tailwindlabs/heroicons/master/src/24/solid/envelope.svg | MIT (Tailwind Labs Heroicons) | 2026-04-25 | viewBox 0 0 24 24, solid envelope, monochrome. Upstream emits `fill="#0F172A"` (slate-900) on each path; **normalized to `fill="currentColor"` in repo** so it inherits parent CSS color (see Modification policy). |

## License compliance

- **Simple Icons (CC0 1.0)** — public domain dedication; no attribution required but trademark logos remain property of respective owners. K-050 uses GitHub + LinkedIn brand marks for linking purposes only (nominative fair use).
- **Heroicons (MIT)** — copyright (c) Tailwind Labs; bundled `LICENSE` not duplicated in this repo because Heroicons is a peer dependency-equivalent by attribution.

## Modification policy

These SVGs are upstream raw files. **Do not hand-edit** for visual change. If a brand asset needs visual change, update Pencil SSOT frame instead and re-fetch from upstream when icon set version bumps.

**Documented exception — `currentColor` normalization:** when an upstream SVG emits a hardcoded path-level `fill="#XXXXXX"` (presentation attribute), it overrides CSS color inheritance from any parent (`fill: currentColor` / Tailwind `fill-current`). To make the icon honor the project color contract (`text-muted` → `:hover` `text-ink`), path-level `fill="#XXXXXX"` MUST be rewritten to `fill="currentColor"`. This is contract-compliance, not visual change. Applied to `mail.svg` 2026-04-25 (K-050 C-1).
