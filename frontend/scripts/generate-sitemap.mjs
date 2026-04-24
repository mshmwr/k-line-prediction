#!/usr/bin/env node
/**
 * K-049 Phase 2a — generate-sitemap.mjs
 *
 * Emits `frontend/public/sitemap.xml` with one <url> per public route.
 * Each <url> carries a <lastmod> sourced from `git log -1 --format=%cs <path>`
 * for the backing page component — so deploys automatically refresh lastmod
 * when the page file changes.
 *
 * NOTE: The 5-route list is also defined (at runtime) in
 * `frontend/src/hooks/useGAPageview.ts` as PAGE_TITLES. Duplicated here
 * because Node scripts can't cleanly import TS without tsx/esbuild overhead.
 * Keep the lists in sync manually — violations caught at deploy probe time.
 */

import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const outPath = resolve(__dirname, '..', 'public', 'sitemap.xml');

const SITE_ORIGIN = 'https://k-line-prediction-app.web.app';

const ROUTES = [
  { path: '/', backing: 'frontend/src/pages/HomePage.tsx' },
  { path: '/app', backing: 'frontend/src/AppPage.tsx' },
  { path: '/about', backing: 'frontend/src/pages/AboutPage.tsx' },
  { path: '/diary', backing: 'frontend/src/pages/DiaryPage.tsx' },
  { path: '/business-logic', backing: 'frontend/src/pages/BusinessLogicPage.tsx' },
];

function lastmodFor(relPath) {
  const out = execSync(`git log -1 --format=%cs -- ${relPath}`, {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
  if (!out) {
    throw new Error(
      `[generate-sitemap] git log returned empty for ${relPath} — file missing or never committed`
    );
  }
  return out;
}

const urls = ROUTES.map((r) => {
  const lastmod = lastmodFor(r.backing);
  const loc = `${SITE_ORIGIN}${r.path}`;
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
}).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, xml, 'utf8');
console.log(`[generate-sitemap] wrote ${outPath} (${ROUTES.length} urls)`);
