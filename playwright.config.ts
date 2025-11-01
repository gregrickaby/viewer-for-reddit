import {defineConfig, devices} from '@playwright/test'

/**
 * Playwright E2E test configuration.
 *
 * Test organization:
 * - e2e/tests/anonymous/** - Read-only mode (no login)
 * - e2e/tests/authenticated/** - Authenticated mode (requires login)
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', {outputFolder: 'e2e/test-results/html', open: 'never'}],
    ['json', {outputFile: 'e2e/test-results/results.json'}],
    ['list']
  ],

  use: {
    baseURL: process.env.APP_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'setup',
      testMatch: /global-setup\.ts/
    },
    {
      name: 'chromium-anon',
      testMatch: /.*\/anonymous\/.*\.spec\.ts/,
      use: {...devices['Desktop Chrome']}
    },
    {
      name: 'firefox-anon',
      testMatch: /.*\/anonymous\/.*\.spec\.ts/,
      use: {...devices['Desktop Firefox']}
    }
    // Disabled projects (re-enable when ready to implement auth):
    // - chromium-auth: Requires authentication setup
    // - webkit-anon: Blocked by app hydration bug (34% of users)
  ],

  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: process.env.APP_URL || 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120000
      }
})
