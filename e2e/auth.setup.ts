import {test as setup} from '@playwright/test'
import {config} from 'dotenv'
import {existsSync} from 'node:fs'
import path from 'node:path'

// Load environment variables from .env.local (local development only)
// In CI, environment variables are set directly by GitHub Actions
const envPath = path.resolve(process.cwd(), '.env.local')
if (existsSync(envPath)) {
  config({path: envPath})
}

const authFile = path.resolve('e2e/.auth/user.json')

/**
 * Authentication setup for authenticated Playwright tests.
 *
 * Automates Reddit OAuth login using credentials from environment
 * variable. Session is saved and reused for 24 hours. Checks if existing
 * auth session is still valid before re-authenticating.
 */
setup('authenticate', async ({browser, baseURL}) => {
  const username = process.env.REDDIT_USER
  const password = process.env.REDDIT_PASSWORD

  if (!username || !password) {
    throw new Error(
      'REDDIT_USER and REDDIT_PASSWORD must be set in .env.local (local) or GitHub secrets (CI)'
    )
  }

  // Check if auth file exists
  if (existsSync(authFile)) {
    console.info('🔍 Found existing auth file, checking if still valid...')

    // Create a context with existing auth to test validity
    const context = await browser.newContext({
      storageState: authFile
    })
    const page = await context.newPage()

    try {
      await page.goto(baseURL as string)

      // Wait for main content to ensure React has hydrated
      await page.locator('main').waitFor({state: 'visible', timeout: 5000})

      // Check if user menu is visible (indicates valid auth)
      // The user menu avatar appears when authenticated
      const isAuthenticated = await page
        .locator('[aria-label^="User menu for"]')
        .isVisible({timeout: 3000})
        .catch(() => false)

      if (isAuthenticated) {
        console.info(
          '✅ Existing authentication is still valid - skipping login'
        )
        return
      }

      console.info('⚠️  Existing auth expired - re-authenticating...')
    } catch (error) {
      console.info(
        '⚠️  Error checking auth validity - re-authenticating...',
        error
      )
    } finally {
      await context.close()
    }
  }

  console.info('🔐 Starting Reddit OAuth authentication...')

  // Create fresh context for authentication
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // 1. Navigate to homepage
    await page.goto(baseURL as string)
    console.info('📍 Navigated to homepage')

    // 2. Click the Sign In button
    const signInButton = page.getByRole('button', {name: /sign in/i})
    await signInButton.click()
    console.info('🖱️  Clicked Sign In button')

    // 3. Wait for redirect to Reddit login page
    await page.waitForURL('**/login**', {timeout: 10000})
    console.info('📍 Redirected to Reddit login page')

    // 4. Enter username
    const usernameInput = page.locator(
      'input[name="username"][autocomplete="username"]'
    )
    await usernameInput.waitFor({state: 'visible', timeout: 5000})
    await usernameInput.fill(username)
    console.info('✍️  Entered username')

    // 5. Enter password
    const passwordInput = page.locator('input[name="password"]')
    await passwordInput.waitFor({state: 'visible', timeout: 5000})
    await passwordInput.fill(password)
    console.info('✍️  Entered password')

    // 6. Wait for and click Log In button
    const loginButton = page.locator('button[type="button"]', {
      hasText: 'Log In'
    })
    await loginButton.waitFor({state: 'visible', timeout: 5000})
    await loginButton.click()
    console.info('🖱️  Clicked Log In button')

    // 7. Wait for OAuth permission screen
    await page.waitForURL('**/authorize**', {timeout: 15000})
    console.info('📍 Reached OAuth permission screen')

    // 8. Click Allow button
    const allowButton = page.locator(
      'input[type="submit"][name="authorize"][value="Allow"]'
    )
    await allowButton.waitFor({state: 'visible', timeout: 5000})
    await allowButton.click()
    console.info('🖱️  Clicked Allow button')

    // 9. Wait for redirect back to homepage
    await page.waitForURL(`${baseURL}/`, {timeout: 30000})
    console.info('✅ Redirected back to homepage')

    // 10. Save session
    await context.storageState({path: authFile})
    console.info('💾 Authentication saved to', authFile)
  } finally {
    // Clean up context
    await context.close()
  }
})
