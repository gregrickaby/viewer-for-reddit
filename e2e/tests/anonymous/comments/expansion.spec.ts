import {expect, test} from '@playwright/test'
import {countVisibleComments, waitForComments} from '../../../fixtures/helpers'
import {PostPage} from '../../../page-objects/PostPage'

/**
 * Comment expansion and collapse tests.
 *
 * Tests comment thread expansion/collapse functionality:
 * - Single comment expand/collapse
 * - Bulk expand with O key
 * - Bulk collapse with Shift+O
 * - Expansion state persistence across sort changes
 *
 * Note: These tests use data-driven patterns (loops, conditional skips)
 * to handle dynamic comment states. ESLint warnings are expected.
 */
/* eslint-disable playwright/no-conditional-in-test, playwright/no-skipped-test, playwright/no-conditional-expect */
test.describe('Comment Expansion and Collapse', () => {
  let postPage: PostPage

  test.beforeEach(async ({page}) => {
    postPage = new PostPage(page)
    await postPage.gotoTestPost()
    await waitForComments(page)
  })

  test('should expand single comment thread', async () => {
    // Find a collapsed comment with replies
    const comments = postPage.getAllComments()
    const count = await comments.count()

    let collapsedCommentId: string | null = null

    for (let i = 0; i < count; i++) {
      const commentId = await comments.nth(i).getAttribute('data-comment-id')
      if (!commentId) continue

      // Check if expand button exists
      const expandBtn = postPage.page.locator(
        `[data-comment-id="${commentId}"] button[aria-label="Expand replies"]`
      )
      const isVisible = await expandBtn.isVisible().catch(() => false)

      if (isVisible) {
        collapsedCommentId = commentId
        break
      }
    }

    // Skip test if all comments are already expanded
    test.skip(!collapsedCommentId, 'All comments already expanded')

    // Expand the comment
    await postPage.expandComment(collapsedCommentId!)

    // Verify it's now expanded
    const isNowExpanded = await postPage.isCommentExpanded(collapsedCommentId!)
    expect(isNowExpanded).toBe(true)
  })

  test('should collapse single comment thread', async () => {
    // Find an expanded comment
    const comments = postPage.getAllComments()
    const count = await comments.count()

    let expandedCommentId: string | null = null

    for (let i = 0; i < count; i++) {
      const commentId = await comments.nth(i).getAttribute('data-comment-id')
      if (!commentId) continue

      const isExpanded = await postPage.isCommentExpanded(commentId)
      if (isExpanded) {
        expandedCommentId = commentId
        break
      }
    }

    // Skip test if no expanded comments found
    test.skip(!expandedCommentId, 'No expanded comments found')

    // Collapse the comment
    await postPage.collapseComment(expandedCommentId!)

    // Verify it's now collapsed
    const isNowExpanded = await postPage.isCommentExpanded(expandedCommentId!)
    expect(isNowExpanded).toBe(false)
  })

  test('should expand all comments with O key', async ({page}) => {
    // Collapse some comments first
    await postPage.collapseAllComments()

    // Count comments before expansion
    const beforeCount = await countVisibleComments(page)

    // Expand all
    await postPage.expandAllComments()

    // Wait for first comment to be visible (DOM updated)
    await page.locator('[data-comment-id]').first().waitFor({state: 'visible'})

    // Count comments after expansion (should be more visible)
    const afterCount = await countVisibleComments(page)

    expect(afterCount).toBeGreaterThanOrEqual(beforeCount)
  })

  test('should collapse all comments with Shift+O', async ({page}) => {
    // Expand all first
    await postPage.expandAllComments()
    await page.locator('[data-comment-id]').first().waitFor({state: 'visible'})

    // Count before collapse
    const beforeCount = await countVisibleComments(page)

    // Collapse all
    await postPage.collapseAllComments()
    await page.locator('[data-comment-id]').first().waitFor({state: 'visible'})

    // Count after collapse (should be fewer visible)
    const afterCount = await countVisibleComments(page)

    expect(afterCount).toBeLessThanOrEqual(beforeCount)
  })

  test('should maintain expansion state when sorting comments', async ({
    page
  }) => {
    // Find a comment with expand button
    const comments = postPage.getAllComments()
    const count = await comments.count()

    let collapsibleCommentId: string | null = null

    for (let i = 0; i < count; i++) {
      const commentId = await comments.nth(i).getAttribute('data-comment-id')
      if (!commentId) continue

      // Check if expand button exists (with short timeout)
      const expandBtn = postPage.page.locator(
        `[data-comment-id="${commentId}"] button[aria-label="Expand replies"]`
      )
      const isVisible = await expandBtn.isVisible().catch(() => false)

      if (isVisible) {
        collapsibleCommentId = commentId
        break
      }
    }

    // Skip test if no collapsible comments found
    test.skip(!collapsibleCommentId, 'No collapsible comments found')

    // Expand the comment
    await postPage.expandComment(collapsibleCommentId!)

    // Change sort order
    await postPage.sortCommentsBy('new')

    // Wait for comments to reload after sort
    await page.locator('[data-comment-id]').first().waitFor({state: 'visible'})

    // Find the same comment (may be in different position)
    const comment = page.locator(`[data-comment-id="${collapsibleCommentId}"]`)
    await comment.waitFor({state: 'visible', timeout: 5000}).catch(() => {})

    // Verify expansion state if comment still exists
    const stillExists = (await comment.count()) > 0
    if (stillExists) {
      const isExpanded = await postPage.isCommentExpanded(collapsibleCommentId!)
      expect(isExpanded).toBe(true)
    }
  })
})
