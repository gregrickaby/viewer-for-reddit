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
   * Waits for DOM content and main element to be visible.
   */
  async waitForHydration() {
    // Wait for DOM content to be loaded
    await this.page.waitForLoadState('domcontentloaded')

    // Wait for main content to be present (React hydration complete)
    await this.page.locator('main').waitFor({state: 'visible', timeout: 10000})

    // Wait for at least one article to be visible (data fetched)
    await this.page
      .locator('article')
      .first()
      .waitFor({state: 'visible', timeout: 5000})
      .catch(() => {
        // Homepage might not have articles, that's okay
      })
  }

  /**
   * Check if user is authenticated.
   */
  async isAuthenticated(): Promise<boolean> {
    const authIndicator = this.page.locator('[data-authenticated="true"]')
    return await authIndicator.isVisible().catch(() => false)
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
