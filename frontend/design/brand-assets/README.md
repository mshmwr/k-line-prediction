# brand-assets/

Vendor brand SVG icons consumed via `vite-plugin-svgr` `?react` query in `frontend/src/components/icons/`.

## Folder purpose

Pencil SSOT frames (`homepage-v2.pen` footer frames) are flat-text layout placeholders. K-050 introduced this folder to hold the runtime brand-mark SVGs that icon wrappers import. Pencil + Footer.tsx divergence is exemption-backed via `docs/designs/design-exemptions.md §2 BRAND-ASSET` row.

## Designer workflow (Pencil)

When a brand asset visual needs change:
1. Update Pencil frame text or add a new frame revision (do NOT replace SVG here from inside Pencil).
2. If the brand mark itself is updated upstream (e.g. LinkedIn rebrand), re-fetch the SVG from the source listed in `SOURCES.md` and update the Fetch date column.
3. Update `_design-divergence` field in the affected `frontend/design/specs/homepage-v2.frame-*.json` files.

## Engineer workflow (React)

Icon wrapper modules in `frontend/src/components/icons/{Github,Linkedin,Mail}Icon.tsx` import these SVGs as React components:

```tsx
import GithubSvg from '../../design/brand-assets/github.svg?react'

export function GithubIcon({ className }: { className?: string }) {
  return <GithubSvg className={className} aria-hidden="true" focusable="false" />
}
```

The `?react` query is handled by `vite-plugin-svgr` (configured in `vite.config.ts`). `tsconfig.json` does not declare a `paths` alias — use **relative imports**, not `@/`.

## DO NOT

- Hand-edit these SVGs (upstream-managed; see `SOURCES.md` modification policy).
- Inline these SVGs into JSX as raw markup (defeats svgr; defeats `currentColor` fill inheritance).
- Add non-brand icons to this folder. Generic UI icons (chevron, close, etc.) belong in a separate `icons/` or `ui-icons/` folder if the project ever needs them.
