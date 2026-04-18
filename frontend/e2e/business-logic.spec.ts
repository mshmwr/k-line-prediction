import { test, expect } from '@playwright/test'

const TOKEN_KEY = 'bl_token'

function makeExpiredToken(): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '')
  const payload = btoa(
    JSON.stringify({
      sub: 'business-logic-access',
      iat: Math.floor(Date.now() / 1000) - 7200,
      exp: Math.floor(Date.now() / 1000) - 3600,
    })
  ).replace(/=/g, '')
  return `${header}.${payload}.fakesig`
}

// ── AC-AUTH-3 ────────────────────────────────────────────────────────────────
// Given: no token in localStorage
// When:  user visits /business-logic
// Then:  password input form is visible

test('AC-AUTH-3: visiting /business-logic shows password form when unauthenticated', async ({ page }) => {
  await page.goto('/business-logic')
  await expect(page.getByPlaceholder('Enter access password')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible()
})

// ── AC-AUTH-2 ────────────────────────────────────────────────────────────────
// Given: user is on password form
// When:  submits wrong password (API returns 401)
// Then:  error banner with "Try again" button visible; page is in SHOW_ERROR state (password form hidden)

test('AC-AUTH-2: wrong password shows error message', async ({ page }) => {
  await page.route('/api/auth', route =>
    route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ detail: 'Unauthorized' }) })
  )

  await page.goto('/business-logic')
  await page.getByPlaceholder('Enter access password').fill('wrongpass')
  await page.getByRole('button', { name: 'Submit' }).click()

  await expect(page.getByText('Incorrect password.')).toBeVisible({ timeout: 5000 })
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
})

// ── AC-AUTH-1 ────────────────────────────────────────────────────────────────
// Given: user submits correct password
// When:  /api/auth returns token, /api/business-logic returns markdown
// Then:  markdown content rendered

test('AC-AUTH-1: correct password shows markdown content', async ({ page }) => {
  // Build a valid-looking token (exp 24h from now)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '')
  const payload = btoa(JSON.stringify({
    sub: 'business-logic-access',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400,
  })).replace(/=/g, '')
  const fakeToken = `${header}.${payload}.fakesig`

  await page.route('/api/auth', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: fakeToken }) })
  )
  await page.route('/api/business-logic', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: '## Trading Strategy\n\nThis is the secret content.' }),
    })
  )

  await page.goto('/business-logic')
  await page.getByPlaceholder('Enter access password').fill('correctpass')
  await page.getByRole('button', { name: 'Submit' }).click()

  await expect(page.getByText('Trading Strategy')).toBeVisible({ timeout: 5000 })
  await expect(page.getByText('This is the secret content.')).toBeVisible()
})

// ── AC-NAV-LOGIN: NavBar Logic 🔒 disappears after successful login ──────────
// Given: user is on /business-logic, not logged in (no token)
// When:  user fills in correct password and submits
// Then:  NavBar Logic link no longer shows 🔒

test('AC-NAV-LOGIN: NavBar Logic lock icon disappears after login', async ({ page }) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '')
  const payload = btoa(JSON.stringify({
    sub: 'business-logic-access',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400,
  })).replace(/=/g, '')
  const fakeToken = `${header}.${payload}.fakesig`

  await page.route('/api/auth', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: fakeToken }) })
  )
  await page.route('/api/business-logic', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: '## Secret' }),
    })
  )

  await page.goto('/business-logic')

  // Before login: Logic link with LockIcon (SVG) should be visible
  const nav = page.locator('[data-testid="navbar-desktop"]')
  await expect(nav.getByRole('link', { name: /Logic/ })).toBeVisible()

  // Submit correct password
  await page.getByPlaceholder('Enter access password').fill('correctpass')
  await page.getByRole('button', { name: 'Submit' }).click()

  // After login: Logic link still visible (LockIcon always shown per AC-NAV-6)
  await expect(nav.getByRole('link', { name: /Logic/ })).toBeVisible()
  // And: markdown content is rendered
  await expect(page.getByText('Secret')).toBeVisible({ timeout: 5000 })
})

// ── AC-AUTH-4 ────────────────────────────────────────────────────────────────
// Given: an expired token in localStorage
// When:  user visits /business-logic
// Then:  password form shown with expired session message

test('AC-AUTH-4: expired token shows password form with expiry message', async ({ page }) => {
  const expiredToken = makeExpiredToken()

  // Inject token before navigating
  await page.addInitScript(([key, token]) => {
    localStorage.setItem(key, token)
  }, [TOKEN_KEY, expiredToken])

  await page.goto('/business-logic')

  await expect(page.getByPlaceholder('Enter access password')).toBeVisible()
  await expect(page.getByText(/session has expired/i)).toBeVisible({ timeout: 5000 })
})
