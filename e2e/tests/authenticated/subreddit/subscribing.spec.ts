import {HomePage} from '@/e2e/page-objects/HomePage'
import {expect, test} from '@playwright/test'

/**
 * Subreddit subscription tests (authenticated users only).
 *
 * Tests subscription functionality:
 * - Subscribe to subreddit
 * - Unsubscribe from subreddit
 * - Subscribe button visibility
 * - Subscription state persistence
 */
test.describe('Subreddit Subscription (Authenticated)', () => {
  test.describe.configure({mode: 'parallel'})

  let homePage: HomePage

  test.beforeEach(async ({page}) => {
    homePage = new HomePage(page)
    // Navigate to a test subreddit
    await homePage.goto('/r/test')
    await homePage.waitForHydration()
  })

  test('should verify user is authenticated', async () => {
    const isAuth = await homePage.isAuthenticated()
    expect(isAuth).toBe(true)
  })

  test.fixme('should show subscribe button when authenticated', async () => {
    const subscribeBtn = homePage.getSubscribeButton()

    await expect(subscribeBtn.first()).toBeVisible()
  })

  test.fixme('should toggle subscription state', async () => {
    const subscribeBtn = homePage.getSubscribeButton()

    await subscribeBtn.first().click()

    await homePage.waitForApiResponse()

    await expect(subscribeBtn.first()).toBeVisible()
  })

  test.fixme(
    'should persist subscription after page reload',
    async ({page}) => {
      const subscribeBtn = homePage.getSubscribeButton()

      await subscribeBtn.first().click()

      await homePage.waitForApiResponse()

      await page.reload()
      await homePage.waitForHydration()

      await subscribeBtn.first().waitFor({state: 'visible', timeout: 5000})

      await expect(subscribeBtn.first()).toBeVisible()
    }
  )
})
