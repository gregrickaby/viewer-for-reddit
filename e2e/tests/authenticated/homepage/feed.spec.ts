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

  test('should display personalized home feed', async () => {
    const postCount = await homePage.getPostCount()
    expect(postCount).toBeGreaterThan(0)
  })

  test('should show user profile indicator when authenticated', async () => {
    const userMenu = homePage.getUserMenu()
    await expect(userMenu).toBeVisible()
  })

  test('should refresh feed and maintain authentication', async ({page}) => {
    const initialCount = await homePage.getPostCount()
    expect(initialCount).toBeGreaterThan(0)

    await page.reload()
    await homePage.waitForHydration()

    const isAuth = await homePage.isAuthenticated()
    expect(isAuth).toBe(true)

    const postCount = await homePage.getPostCount()
    expect(postCount).toBeGreaterThan(0)
  })

  test.fixme('should access saved posts page', async ({page}) => {
    await page.goto('/user/saved')
    await homePage.waitForHydration()

    await expect(page).toHaveURL(/\/user\/saved/)

    const errorMessage = page.locator('[data-testid="error-message"]')
    const hasError = await errorMessage.isVisible().catch(() => false)
    expect(hasError).toBe(false)
  })
})
