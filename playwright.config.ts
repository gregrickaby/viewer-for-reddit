import { defineConfig, devices } from '@playwright/test'

/*
 * End-to-end tests (implementation §8): a production build of the app talking
 * to the mock Reddit server (e2e/mock-reddit/server.ts). Runs over plain HTTP
 * on localhost, which browsers treat as a secure context, so the app's Secure
 * cookies still work.
 */

const APP_PORT = 3100
const MOCK_PORT = 4010
export const APP_URL = `http://localhost:${APP_PORT}`
export const MOCK_URL = `http://localhost:${MOCK_PORT}`

const appEnv = {
  BASE_URL: APP_URL,
  REDDIT_REDIRECT_URI: `${APP_URL}/api/auth/callback/reddit`,
  REDDIT_API_BASE: MOCK_URL,
  REDDIT_WWW_BASE: MOCK_URL,
  REDDIT_CLIENT_ID: 'e2e-client',
  REDDIT_CLIENT_SECRET: 'e2e-secret',
  SESSION_SECRET: 'e2e-session-secret-that-is-long-enough-000',
  USER_AGENT: 'web-app:viewer-for-reddit:e2e (by u/fixture_user)',
}

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false, // one mock Reddit, shared state
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: APP_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, grepInvert: /@nojs/ },
    {
      name: 'chromium-nojs',
      use: { ...devices['Desktop Chrome'], javaScriptEnabled: false },
      grep: /@nojs/,
    },
  ],
  webServer: [
    {
      command: `npx tsx e2e/mock-reddit/server.ts`,
      url: `${MOCK_URL}/__mock/state`,
      env: { MOCK_REDDIT_PORT: String(MOCK_PORT) },
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
    },
    {
      command: `npx next build && npx next start -p ${APP_PORT}`,
      url: APP_URL,
      env: appEnv,
      timeout: 300_000,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
    },
  ],
})
