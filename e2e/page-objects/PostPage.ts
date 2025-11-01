import {Locator, Page} from '@playwright/test'
import {BasePage} from './BasePage'

/**
 * Page object for Reddit post detail page (comments view).
 *
 * Handles:
 * - Comment navigation (J/K/U keyboard shortcuts)
 * - Comment expansion/collapse
 * - Voting (authenticated)
 * - Sorting comments
 */
export class PostPage extends BasePage {
  // Locators
  readonly postTitle: Locator
  readonly commentSortDropdown: Locator
  readonly firstComment: Locator

  constructor(page: Page) {
    super(page)
    this.postTitle = page.locator('h1')
    this.commentSortDropdown = page.locator('[data-testid="comment-sort"]')
    this.firstComment = page.locator('[data-comment-id]').first()
  }

  /**
   * Navigate to specific test post.
   */
  async gotoTestPost() {
    await this.goto('/r/test/comments/1olhfw8/surprise_test')
    await this.waitForHydration()
  }

  /**
   * Press J key to navigate to next comment.
   */
  async pressNextCommentKey() {
    await this.page.keyboard.press('j')
  }

  /**
   * Press K key to navigate to previous comment.
   */
  async pressPreviousCommentKey() {
    await this.page.keyboard.press('k')
  }

  /**
   * Press U key to navigate to parent comment.
   */
  async pressParentCommentKey() {
    await this.page.keyboard.press('u')
  }

  /**
   * Press O to expand all comments.
   */
  async expandAllComments() {
    await this.page.keyboard.press('o')
  }

  /**
   * Press Shift+O to collapse all comments.
   */
  async collapseAllComments() {
    await this.page.keyboard.press('Shift+O')
  }

  /**
   * Get currently focused comment.
   */
  getFocusedComment(): Locator {
    return this.page.locator('[data-comment-id]:focus')
  }

  /**
   * Click expand button on a comment
   */
  async expandComment(commentId: string) {
    const expandBtn = this.page.locator(
      `[data-comment-id="${commentId}"] button[aria-label="Expand replies"]`
    )
    await expandBtn.click()
  }

  /**
   * Click collapse button on a comment
   */
  async collapseComment(commentId: string) {
    const collapseBtn = this.page.locator(
      `[data-comment-id="${commentId}"] button[aria-label="Collapse replies"]`
    )
    await collapseBtn.click()
  }

  /**
   * Upvote a comment (requires authentication).
   */
  async upvoteComment(commentId: string) {
    const upvoteBtn = this.page.locator(
      `[data-comment-id="${commentId}"] [data-action="upvote"]`
    )
    await upvoteBtn.click()
  }

  /**
   * Get comment score.
   */
  async getCommentScore(commentId: string): Promise<string> {
    const scoreElement = this.page.locator(
      `[data-comment-id="${commentId}"] [data-score]`
    )
    return (await scoreElement.textContent()) || '0'
  }

  /**
   * Check if comment is expanded
   */
  async isCommentExpanded(commentId: string): Promise<boolean> {
    const collapseBtn = this.page.locator(
      `[data-comment-id="${commentId}"] button[aria-label="Collapse replies"]`
    )
    return await collapseBtn.isVisible()
  }

  /**
   * Get comment depth attribute.
   */
  async getCommentDepth(commentId: string): Promise<number> {
    const comment = this.page.locator(`[data-comment-id="${commentId}"]`)
    const depth = await comment.getAttribute('data-depth')
    return Number.parseInt(depth || '0', 10)
  }

  /**
   * Sort comments by specific method.
   */
  async sortCommentsBy(
    method: 'best' | 'top' | 'new' | 'controversial' | 'old'
  ) {
    await this.commentSortDropdown.click()
    await this.page.click(`text="${method}"`)
    await this.waitForHydration()
  }
}
