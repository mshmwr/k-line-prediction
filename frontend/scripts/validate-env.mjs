#!/usr/bin/env node
/**
 * K-049 Phase 2a — validate-env.mjs
 *
 * Prebuild guard:
 *   (1) fail fast when VITE_GA_MEASUREMENT_ID is unset or malformed.
 *   (2) in production builds (NODE_ENV=production), ALSO fail fast when
 *       VITE_API_BASE_URL is non-empty — post-K-049 Phase 2b the Firebase
 *       Hosting `/api/**` → Cloud Run rewrite makes API calls same-origin,
 *       CORSMiddleware was removed from backend/main.py, so any absolute
 *       Cloud Run URL baked into the production bundle will trigger CORS
 *       preflight against a server that no longer advertises CORS headers.
 *       Non-production builds (dev / test) skip this advisory so local
 *       development against a direct Cloud Run URL still works.
 *
 * Pattern rationale: GA4 measurement IDs follow `G-[A-Z0-9]{10,}` — GA docs
 * say the suffix is 10 chars today but allow the class to grow, so we floor
 * at 10 without an upper bound.
 */

const id = process.env.VITE_GA_MEASUREMENT_ID;
const pattern = /^G-[A-Z0-9]{10,}$/;

if (!id || !pattern.test(id)) {
  const detail = !id ? '(unset or empty)' : `(got ${JSON.stringify(id)})`;
  console.error(
    `[validate-env] VITE_GA_MEASUREMENT_ID must match G-[A-Z0-9]{10,} ${detail}`
  );
  process.exit(1);
}

// K-049 Phase 2b CORS-removal guard — production-only.
// Dev / staging / test builds still allow VITE_API_BASE_URL to point at a
// direct Cloud Run URL (useful for local dev without Firebase emulator).
const isProd = process.env.NODE_ENV === 'production';
const apiBase = process.env.VITE_API_BASE_URL;

if (isProd && apiBase && apiBase.length > 0) {
  // Redact the logged value: first 20 chars + ... + last 4 chars so CI logs
  // don't leak the full internal URL if the output is pasted.
  let redacted;
  if (apiBase.length <= 24) {
    // Too short to meaningfully split — show head + last 4.
    redacted = `${apiBase.slice(0, Math.max(0, apiBase.length - 4))}...${apiBase.slice(-4)}`;
  } else {
    redacted = `${apiBase.slice(0, 20)}...${apiBase.slice(-4)}`;
  }
  console.error(
    `[validate-env] FAIL: VITE_API_BASE_URL must be empty or unset for production builds.
Post-K-049 Phase 2b CORSMiddleware removal + Firebase /api/** Cloud Run rewrite
requires same-origin API calls. Setting VITE_API_BASE_URL bakes an absolute Cloud
Run URL into the bundle which will break CORS preflight in production.

Current value: ${redacted}
Fix: comment out or delete the VITE_API_BASE_URL line in frontend/.env.production
before running npm run build.`
  );
  process.exit(1);
}

console.log(`[validate-env] VITE_GA_MEASUREMENT_ID=${id} OK`);
if (isProd) {
  console.log(`[validate-env] production build: VITE_API_BASE_URL empty/unset OK (same-origin)`);
}
