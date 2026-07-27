import {defineConfig, devices} from '@playwright/test'

/**
 * Config for the instant-nav optimization loop (see instant-nav.rig.md).
 * Targets a local `next build && next start` -- never the real deployment.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3001',
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: {...devices['Desktop Chrome']}
    }
  ]
})
