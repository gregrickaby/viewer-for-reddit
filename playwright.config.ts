import {defineConfig, devices} from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined, // Limit CI workers for stability
  reporter: process.env.CI ? [['github'], ['html']] : [['html', {open: 'on-failure'}]],
  timeout: 30000, // Reasonable timeout for E2E tests
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10000 // Shorter action timeout
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    // Priority order based on analytics: iOS Safari (33%) + Mobile Chrome (Android traffic)
    {
      name: 'Mobile Safari',
      use: {...devices['iPhone 15']} // Highest individual browser usage
    },
    {
      name: 'Mobile Chrome',
      use: {...devices['Pixel 7']} // Android mobile traffic
    },
    {
      name: 'chromium',
      use: {...devices['Desktop Chrome']} // 32% desktop Chrome
    },
    {
      name: 'webkit',
      use: {...devices['Desktop Safari']} // Desktop Safari (macOS 8%)
    },
    {
      name: 'firefox',
      use: {...devices['Desktop Firefox']} // 13% still significant
    }
  ]
})
