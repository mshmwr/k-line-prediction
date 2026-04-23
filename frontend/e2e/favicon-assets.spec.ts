/**
 * K-037 favicon wiring regression spec.
 *
 * Runs against `vite preview` (port 4173) of a built bundle — NOT `vite dev` —
 * so Firebase-prod-equivalent asset resolution semantics are exercised.
 * See docs/engineering/K-037-engineer-brief.md §5 + §7 Known Gotchas.
 *
 * Asserts:
 *  - AC-037-ASSETS-200-OK      (8 independent asset HTTP 200 tests)
 *  - AC-037-LINK-TAGS-PRESENT  (6 independent <link> tag attribute-match tests)
 *  - AC-037-MANIFEST-VALID     (1 JSON schema test)
 *  - AC-037-MANIFEST-MIME-ACCEPTABLE (1 Content-Type accept-list test)
 *
 * AC-037-TAB-ICON-VISIBLE is manual (PM + user Pencil side-by-side at close).
 */
import { test, expect } from '@playwright/test'

// --- AC-037-ASSETS-200-OK: 8 independent asset cases ------------------------

const ASSET_PATHS = [
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/favicon-48x48.png',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/manifest.json',
] as const

for (const path of ASSET_PATHS) {
  test(`${path} returns 200 with non-empty body`, async ({ page }) => {
    const response = await page.request.get(path)
    expect(response.status()).toBe(200)
    const body = await response.body()
    expect(body.length).toBeGreaterThan(0)
  })
}

// --- AC-037-LINK-TAGS-PRESENT: 6 independent <link> tag cases ---------------

const LINK_TAG_SELECTORS: Array<{ name: string; selector: string }> = [
  {
    name: 'rel=icon type=image/x-icon sizes=any -> /favicon.ico',
    selector:
      'link[rel="icon"][type="image/x-icon"][sizes="any"][href="/favicon.ico"]',
  },
  {
    name: 'rel=icon type=image/png sizes=16x16 -> /favicon-16x16.png',
    selector:
      'link[rel="icon"][type="image/png"][sizes="16x16"][href="/favicon-16x16.png"]',
  },
  {
    name: 'rel=icon type=image/png sizes=32x32 -> /favicon-32x32.png',
    selector:
      'link[rel="icon"][type="image/png"][sizes="32x32"][href="/favicon-32x32.png"]',
  },
  {
    name: 'rel=icon type=image/png sizes=48x48 -> /favicon-48x48.png',
    selector:
      'link[rel="icon"][type="image/png"][sizes="48x48"][href="/favicon-48x48.png"]',
  },
  {
    name: 'rel=apple-touch-icon sizes=180x180 -> /apple-touch-icon.png',
    selector:
      'link[rel="apple-touch-icon"][sizes="180x180"][href="/apple-touch-icon.png"]',
  },
  {
    name: 'rel=manifest -> /manifest.json',
    selector: 'link[rel="manifest"][href="/manifest.json"]',
  },
]

for (const { name, selector } of LINK_TAG_SELECTORS) {
  test(`<link> ${name} present in <head>`, async ({ page }) => {
    await page.goto('/')
    const tag = page.locator(selector)
    await expect(tag).toHaveCount(1)
  })
}

// --- AC-037-MANIFEST-VALID: schema shape ------------------------------------

test('/manifest.json schema: name string + 192 + 512 icons', async ({ page }) => {
  const response = await page.request.get('/manifest.json')
  expect(response.status()).toBe(200)
  const manifest = await response.json()

  expect(typeof manifest.name).toBe('string')
  expect(manifest.name.length).toBeGreaterThan(0)

  expect(Array.isArray(manifest.icons)).toBe(true)
  expect(manifest.icons.length).toBeGreaterThanOrEqual(2)

  const icon192 = manifest.icons.find(
    (i: { sizes?: string }) => i.sizes === '192x192',
  )
  const icon512 = manifest.icons.find(
    (i: { sizes?: string }) => i.sizes === '512x512',
  )

  expect(icon192).toMatchObject({
    src: '/android-chrome-192x192.png',
    sizes: '192x192',
    type: 'image/png',
  })
  expect(icon512).toMatchObject({
    src: '/android-chrome-512x512.png',
    sizes: '512x512',
    type: 'image/png',
  })
})

// --- AC-037-MANIFEST-MIME-ACCEPTABLE: Content-Type accept-list --------------

test('/manifest.json Content-Type in accept-list', async ({ page }) => {
  const response = await page.request.get('/manifest.json')
  expect(response.status()).toBe(200)

  const contentType = response.headers()['content-type']
  expect(contentType).toBeDefined()

  const ACCEPT_LIST = [
    'application/manifest+json',
    'application/json',
    'application/json; charset=utf-8',
  ]

  // Normalize — some servers return `application/json;charset=UTF-8` without
  // the space or with upper-case charset; match case-insensitively and allow
  // any whitespace between `;` and `charset`.
  const normalized = contentType.toLowerCase().replace(/;\s*/g, '; ')
  expect(ACCEPT_LIST).toContain(normalized)
})
