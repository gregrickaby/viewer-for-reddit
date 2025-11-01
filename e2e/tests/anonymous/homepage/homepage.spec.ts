import {HomePage} from '@/e2e/page-objects/HomePage'
import {expect, test} from '@playwright/test'

/**
 * Anonymous homepage tests.
 *
 * Tests homepage functionality for unauthenticated users:
 * - Page load and content visibility
 * - Sign in button availability
 * - Authentication state verification
 */
test.describe('Homepage (Anonymous)', () => {
  test.describe.configure({mode: 'parallel'})

  test('should load homepage and display posts', async ({page}) => {
    const homePage = new HomePage(page)

    await homePage.gotoHomepage()

    await expect(page).toHaveTitle(/Viewer for Reddit/i)

    const postCount = await homePage.getPostCount()
    expect(postCount).toBeGreaterThan(0)
  })

  test('should show sign in button when not authenticated', async ({page}) => {
    const homePage = new HomePage(page)

    await homePage.gotoHomepage()

    await expect(homePage.signInButton).toBeVisible()

    const isAuth = await homePage.isAuthenticated()
    expect(isAuth).toBe(false)
  })
})
