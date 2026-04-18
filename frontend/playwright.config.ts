import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  projects: [
    {
      // Default E2E suite. Excludes visual-report.ts so regular test runs
      // do not produce visual reports.
      name: 'chromium',
      testMatch: /.*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // K-008 visual report runner — only runs when explicitly targeted:
      //   TICKET_ID=K-008 npx playwright test --project=visual-report
      // or by file path: `npx playwright test visual-report.ts`.
      name: 'visual-report',
      testMatch: /visual-report\.ts$/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
