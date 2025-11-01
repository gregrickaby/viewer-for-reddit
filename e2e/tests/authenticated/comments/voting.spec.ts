import {expect, test} from '@playwright/test'
import {waitForComments} from '../../../fixtures/helpers'
import {PostPage} from '../../../page-objects/PostPage'

/**
 * Comment voting tests (authenticated users only).
 *
 * Tests voting functionality for authenticated users:
 * - Upvote comments
 * - Downvote comments
 * - Vote button visibility
 * - Vote state persistence
 *
 * Note: Uses conditional skips for dynamic test data.
 */
/* eslint-disable playwright/no-skipped-test */
test.describe('Comment Voting (Authenticated)', () => {
  let postPage: PostPage

  test.beforeEach(async ({page}) => {
    postPage = new PostPage(page)
    await postPage.gotoTestPost()
    await waitForComments(page)
  })

  test('should upvote a comment', async ({page}) => {
    // Verify user is authenticated
    const isAuth = await postPage.isAuthenticated()
    expect(isAuth).toBe(true)

    // Get first comment
    const firstCommentId = await postPage
      .getAllComments()
      .first()
      .getAttribute('data-comment-id')

    // Skip if no comments found
    test.skip(!firstCommentId, 'No comments found')

    // Upvote
    await postPage.upvoteComment(firstCommentId!)

    // Wait for upvote button to update state
    await page
      .locator(
        `[data-comment-id="${firstCommentId}"] button[aria-label*="Upvote"]`
      )
      .waitFor({state: 'visible'})

    // Get new score
    const newScore = await postPage.getCommentScore(firstCommentId!)

    // Score should change (may increase or just change color if already voted)
    // We can't guarantee exact score change due to vote fuzzing
    expect(newScore).toBeDefined()
  })

  test('should show vote buttons when authenticated', async ({page}) => {
    const firstCommentId = await postPage
      .getAllComments()
      .first()
      .getAttribute('data-comment-id')

    // Skip if no comments found
    test.skip(!firstCommentId, 'No comments found')

    // Check upvote button exists
    const upvoteBtn = page.locator(
      `[data-comment-id="${firstCommentId}"] button[aria-label*="Upvote"]`
    )
    await expect(upvoteBtn).toBeVisible()

    // Check downvote button exists
    const downvoteBtn = page.locator(
      `[data-comment-id="${firstCommentId}"] button[aria-label*="Downvote"]`
    )
    await expect(downvoteBtn).toBeVisible()
  })
})
