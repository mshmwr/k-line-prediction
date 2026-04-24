#!/usr/bin/env node
/**
 * K-049 Phase 2a — validate-env.mjs
 *
 * Prebuild guard: fail fast when VITE_GA_MEASUREMENT_ID is unset or malformed.
 * VITE_API_BASE_URL is intentionally NOT checked — post-K-049 Phase 2b all
 * /api/** calls are same-origin via Firebase Hosting rewrite.
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

console.log(`[validate-env] VITE_GA_MEASUREMENT_ID=${id} OK`);
