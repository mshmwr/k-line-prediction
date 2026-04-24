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
      // do not produce visual reports. Also excludes favicon-assets.spec.ts
      // because that spec must run against `vite preview` of a built bundle
      // (per K-037 AC-037-ASSETS-200-OK / QA Challenge #4), not `vite dev`.
      name: 'chromium',
      testMatch: /.*\.spec\.ts$/,
      testIgnore: /favicon-assets\.spec\.ts$/,
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
    {
      // K-037 favicon/manifest asset regression. Runs against `vite preview`
      // of a built bundle (port 4173) so that Firebase-prod-equivalent asset
      // resolution semantics are exercised — `vite dev` can hide production
      // MIME / public-copy / rewrite misconfigurations (QA Challenge #1 + #4).
      name: 'favicon-preview',
      testMatch: /favicon-assets\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:4173' },
    },
  ],
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      env: {
        VITE_GA_MEASUREMENT_ID: 'G-TESTID0000',
      },
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      // K-037: build + preview for favicon asset spec. Must rebuild before
      // preview so `public/manifest.json` + favicon PNG/ICO assets are copied
      // into `dist/`. See docs/engineering/K-037-engineer-brief.md §5.
      // K-049 Phase 2a: `npm run build` now calls prebuild → validate-env.mjs
      // which requires VITE_GA_MEASUREMENT_ID matching G-[A-Z0-9]{10,};
      // supply a fixture ID to satisfy the guard under test builds.
      command: 'npm run build && npx vite preview --port 4173 --strictPort',
      url: 'http://localhost:4173',
      env: {
        VITE_GA_MEASUREMENT_ID: 'G-TESTID0000',
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
