import {Locator, Page} from '@playwright/test'
import {BasePage} from './BasePage'

/**
 * Page object for the homepage.
 *
 * Features:
 * - Navigation to homepage
 * - Sign in/out actions
 * - Feed visibility checks
 */
export class HomePage extends BasePage {
  readonly signInButton: Locator
  readonly feedContainer: Locator

  constructor(page: Page) {
    super(page)
    this.signInButton = page.getByRole('button', {name: /sign in/i})
    this.feedContainer = page.locator('[data-feed-container]')
  }

  /**
   * Navigate to homepage.
   */
  async gotoHomepage() {
    await this.goto('/')
    await this.waitForHydration()
  }

  /**
   * Click sign in button.
   */
  async clickSignIn() {
    await this.signInButton.click()
  }

  /**
   * Check if feed is visible.
   */
  async isFeedVisible(): Promise<boolean> {
    return await this.feedContainer.isVisible().catch(() => false)
  }

  /**
   * Get all posts on the page.
   */
  getPosts(): Locator {
    return this.page.locator('article')
  }

  /**
   * Get post count.
   */
  async getPostCount(): Promise<number> {
    return await this.getPosts().count()
  }

  /**
   * Get subscribe/unsubscribe button.
   */
  getSubscribeButton(): Locator {
    return this.page.locator(
      'button:has-text("Subscribe"), button:has-text("Unsubscribe")'
    )
  }
}
