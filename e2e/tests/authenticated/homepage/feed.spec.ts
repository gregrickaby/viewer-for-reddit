import {HomePage} from '@/e2e/page-objects/HomePage'
import {expect, test} from '@playwright/test'

/**
 * Authenticated homepage feed tests.
 *
 * Tests personalized feed features for logged-in users:
 * - Home feed visibility
 * - Authentication indicator
 * - Personalized content
 * - Feed navigation
 */
test.describe('Authenticated Home Feed', () => {
  test.describe.configure({mode: 'parallel'})

  let homePage: HomePage

  test.beforeEach(async ({page}) => {
    homePage = new HomePage(page)
    await homePage.goto('/')
    await homePage.waitForHydration()
  })

  test('should verify user is authenticated', async () => {
    const isAuth = await homePage.isAuthenticated()
    expect(isAuth).toBe(true)
  })

  test('should display personalized home feed', async ({page}) => {
    await page.locator('[data-post-id]').first().waitFor({timeout: 10000})

    const posts = page.locator('[data-post-id]')
    const postCount = await posts.count()

    expect(postCount).toBeGreaterThan(0)
  })

  test('should show user profile indicator when authenticated', async ({
    page
  }) => {
    const userProfile = page.locator('button[aria-label^="User menu for"]')
    await expect(userProfile).toBeVisible()
  })

  test('should refresh feed and maintain authentication', async ({page}) => {
    await page.locator('[data-post-id]').first().waitFor({timeout: 10000})

    await page.reload()
    await homePage.waitForHydration()

    const isAuth = await homePage.isAuthenticated()
    expect(isAuth).toBe(true)

    const posts = page.locator('[data-post-id]')
    const postCount = await posts.count()
    expect(postCount).toBeGreaterThan(0)
  })

  test('should access saved posts page', async ({page}) => {
    await page.goto('/user/saved')
    await homePage.waitForHydration()

    await expect(page).toHaveURL(/\/user\/saved/)

    const errorMessage = page.locator('[data-testid="error-message"]')
    const hasError = await errorMessage.isVisible().catch(() => false)
    expect(hasError).toBe(false)
  })
})
