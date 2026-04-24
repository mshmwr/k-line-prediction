import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

// K-049 Reviewer Step 2 I-1 — validate-env.mjs must:
//   (a) production mode + empty VITE_API_BASE_URL → exit 0
//   (b) production mode + non-empty VITE_API_BASE_URL → exit 1 + clear message
//   (c) dev mode + non-empty VITE_API_BASE_URL → exit 0 (no advisory)
//   (d) production mode + missing VITE_GA_MEASUREMENT_ID → exit 1 (preserved)
//
// Invoked via `node scripts/validate-env.mjs` with env vars per case so the
// test exercises the exact prebuild entry point.

const scriptPath = path.resolve(__dirname, '..', '..', 'scripts', 'validate-env.mjs')
const VALID_GA_ID = 'G-ABCDEFGHIJ' // matches /^G-[A-Z0-9]{10,}$/

function runValidateEnv(env: Record<string, string | undefined>) {
  // Start from a minimal base — do NOT inherit parent env, otherwise the
  // test runner's own NODE_ENV / VITE_* leak into the subprocess and flip
  // case semantics. Include PATH so `node` resolves.
  const cleanEnv: Record<string, string> = {
    PATH: process.env.PATH ?? '',
  }
  for (const [k, v] of Object.entries(env)) {
    if (v !== undefined) cleanEnv[k] = v
  }
  const result = spawnSync('node', [scriptPath], {
    env: cleanEnv,
    encoding: 'utf8',
  })
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  }
}

describe('validate-env.mjs — K-049 Phase 2b CORS-removal guard', () => {
  it('(a) production + empty VITE_API_BASE_URL → exit 0', () => {
    const { status, stdout } = runValidateEnv({
      NODE_ENV: 'production',
      VITE_GA_MEASUREMENT_ID: VALID_GA_ID,
      VITE_API_BASE_URL: '',
    })
    expect(status).toBe(0)
    expect(stdout).toContain('VITE_GA_MEASUREMENT_ID=' + VALID_GA_ID + ' OK')
    expect(stdout).toContain('same-origin')
  })

  it('(b) production + non-empty VITE_API_BASE_URL → exit 1 with explicit message', () => {
    const { status, stderr } = runValidateEnv({
      NODE_ENV: 'production',
      VITE_GA_MEASUREMENT_ID: VALID_GA_ID,
      VITE_API_BASE_URL: 'https://k-line-backend-841575332599.asia-east1.run.app',
    })
    expect(status).toBe(1)
    expect(stderr).toContain('VITE_API_BASE_URL must be empty')
    expect(stderr).toContain('CORSMiddleware removal')
    // Value is redacted — first 20 chars + ... + last 4 chars.
    // Source URL: "https://k-line-backend-841575332599.asia-east1.run.app" (length 54)
    //   first 20:  "https://k-line-backe"
    //   last 4:    ".app"
    expect(stderr).toContain('https://k-line-backe...')
    expect(stderr).toContain('....app')
    // Full URL MUST NOT leak in full
    expect(stderr).not.toContain('k-line-backend-841575332599.asia-east1.run.app')
  })

  it('(c) dev mode + non-empty VITE_API_BASE_URL → exit 0 (no advisory)', () => {
    const { status, stderr, stdout } = runValidateEnv({
      NODE_ENV: 'development',
      VITE_GA_MEASUREMENT_ID: VALID_GA_ID,
      VITE_API_BASE_URL: 'https://k-line-backend-841575332599.asia-east1.run.app',
    })
    expect(status).toBe(0)
    expect(stderr).toBe('')
    expect(stdout).toContain('VITE_GA_MEASUREMENT_ID=' + VALID_GA_ID + ' OK')
    // No production-only same-origin log line in dev
    expect(stdout).not.toContain('same-origin')
  })

  it('(d) production + missing VITE_GA_MEASUREMENT_ID → exit 1 (pre-existing behavior preserved)', () => {
    const { status, stderr } = runValidateEnv({
      NODE_ENV: 'production',
      VITE_GA_MEASUREMENT_ID: undefined,
      VITE_API_BASE_URL: '',
    })
    expect(status).toBe(1)
    expect(stderr).toContain('VITE_GA_MEASUREMENT_ID must match G-[A-Z0-9]{10,}')
  })
})
