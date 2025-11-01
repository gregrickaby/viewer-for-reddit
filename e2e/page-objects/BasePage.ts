import {Locator, Page} from '@playwright/test'

/**
 * Base page class with common methods shared across all page objects.
 */
export abstract class BasePage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Navigate to a specific path.
   */
  async goto(path: string = '') {
    await this.page.goto(path)
  }

  /**
   * Wait for React hydration to complete.
   */
  async waitForHydration() {
    await this.page.waitForLoadState('domcontentloaded')

    await this.page.locator('main').waitFor({state: 'visible', timeout: 10000})

    await this.page
      .locator('article')
      .first()
      .waitFor({state: 'visible', timeout: 5000})
      .catch(() => {})
  }

  /**
   * Check if user is authenticated by looking for user menu avatar.
   */
  async isAuthenticated(): Promise<boolean> {
    return await this.getUserMenu()
      .isVisible()
      .catch(() => false)
  }

  /**
   * Get user menu avatar locator.
   */
  getUserMenu(): Locator {
    return this.page.locator('[aria-label^="User menu for"]')
  }

  /**
   * Wait for API response (voting, subscription, etc).
   */
  async waitForApiResponse(): Promise<void> {
    await this.page
      .waitForResponse((response) => response.url().includes('/api/'))
      .catch(() => null)
  }

  /**
   * Get comment elements (shared across pages).
   */
  getCommentByIndex(index: number): Locator {
    return this.page.locator('[data-comment-id]').nth(index)
  }

  /**
   * Get all comment elements.
   */
  getAllComments(): Locator {
    return this.page.locator('[data-comment-id]')
  }
}
