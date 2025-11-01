import {chromium, FullConfig} from '@playwright/test'
import path from 'node:path'

/**
 * Global setup for Playwright tests.
 *
 * Authenticates with Reddit OAuth 2.0 and saves cookies for reuse.
 * This runs once before all tests, ensuring authentication is shared
 * across all test files.
 *
 * Environment variables required:
 * - REDDIT_USER: Reddit test account username
 * - REDDIT_PASSWORD: Reddit test account password
 * - APP_URL: Application URL (defaults to http://localhost:3000)
 */
async function globalSetup(config: FullConfig) {
  const {baseURL} = config.projects[0].use
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    console.info('🔐 Starting Reddit OAuth authentication...')

    // Navigate to login
    await page.goto(`${baseURL}/api/auth/login`)

    // Reddit OAuth redirects to Reddit login page
    // Wait for Reddit's login form
    await page.waitForURL('**/reddit.com/login*', {timeout: 10000})

    // Fill Reddit credentials from environment
    const username = process.env.REDDIT_USER
    const password = process.env.REDDIT_PASSWORD

    if (!username || !password) {
      throw new Error(
        'REDDIT_USER and REDDIT_PASSWORD must be set in environment'
      )
    }

    await page.fill('input[name="username"]', username)
    await page.fill('input[name="password"]', password)
    await page.click('button[type="submit"]')

    // Wait for OAuth callback redirect back to app
    await page.waitForURL(`${baseURL}/**`, {timeout: 15000})

    // Verify authentication succeeded
    await page.locator('[data-authenticated="true"]').waitFor({timeout: 5000})

    // Save authentication state
    const authFile = path.join(__dirname, '.auth', 'user.json')
    await page.context().storageState({path: authFile})

    console.info(
      '✅ Authentication setup complete - cookies saved to .auth/user.json'
    )
  } catch (error) {
    console.error('❌ Authentication failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup
