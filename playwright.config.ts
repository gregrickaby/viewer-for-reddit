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
  timeout: 30000,

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
      name: 'chromium-anon',
      testMatch: /.*\/anonymous\/.*\.spec\.ts/,
      use: {...devices['Desktop Chrome']}
    },
    {
      name: 'firefox-anon',
      testMatch: /.*\/anonymous\/.*\.spec\.ts/,
      use: {...devices['Desktop Firefox']}
    },
    {
      name: 'auth-setup',
      testDir: './e2e',
      testMatch: /auth\.setup\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        // Launch args to allow CORS and mimic real Chrome
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-blink-features=AutomationControlled'
          ]
        }
      }
    },
    {
      name: 'chromium-auth',
      testMatch: /.*\/authenticated\/.*\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json'
      }
    }
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
