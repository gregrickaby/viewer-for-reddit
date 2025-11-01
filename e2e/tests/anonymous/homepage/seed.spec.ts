import {expect, test} from '@playwright/test'
import {HomePage} from '../../../page-objects/HomePage'

/**
 * Seed test demonstrating Page Object Model pattern.
 *
 * This test serves as a template for writing new Playwright tests
 * using the Page Object Model pattern.
 *
 * Note: These run only on chromium-anon (no authentication required).
 */
test.describe('Homepage Navigation (Seed)', () => {
  test('should load homepage and verify content', async ({page}) => {
    // Create page object instance
    const homePage = new HomePage(page)

    // Navigate to homepage
    await homePage.gotoHomepage()

    // Verify page loaded successfully
    await expect(page).toHaveTitle(/Viewer for Reddit/i)

    // Verify posts are visible (anonymous browsing)
    const postCount = await homePage.getPostCount()
    expect(postCount).toBeGreaterThan(0)
  })

  test('should find sign in button when not authenticated', async ({page}) => {
    const homePage = new HomePage(page)

    await homePage.gotoHomepage()

    // Verify sign in button is visible
    await expect(homePage.signInButton).toBeVisible()

    // Verify user is not authenticated
    const isAuth = await homePage.isAuthenticated()
    expect(isAuth).toBe(false)
  })
})
