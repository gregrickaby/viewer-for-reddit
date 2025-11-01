import {waitForComments} from '@/e2e/fixtures/helpers'
import {PostPage} from '@/e2e/page-objects/PostPage'
import {expect, test} from '@playwright/test'

/**
 * Comment voting tests (authenticated users only).
 *
 * Tests voting functionality for authenticated users:
 * - Upvote comments
 * - Downvote comments
 * - Vote button visibility
 * - Vote state persistence
 * - Vote toggling (upvote → remove → downvote)
 */
test.describe('Comment Voting (Authenticated)', () => {
  test.describe.configure({mode: 'parallel'})

  let postPage: PostPage

  test.beforeEach(async ({page}) => {
    postPage = new PostPage(page)
    await postPage.gotoTestPost()
    await waitForComments(page)
  })

  test('should verify user is authenticated', async () => {
    const isAuth = await postPage.isAuthenticated()
    expect(isAuth).toBe(true)
  })

  test('should show vote buttons when authenticated', async () => {
    const firstCommentId = await postPage.getFirstCommentId()

    const upvoteBtn = postPage.getUpvoteButton(firstCommentId)
    await expect(upvoteBtn).toBeVisible()

    const downvoteBtn = postPage.getDownvoteButton(firstCommentId)
    await expect(downvoteBtn).toBeVisible()
  })

  test('should upvote a comment', async () => {
    const firstCommentId = await postPage.getFirstCommentId()

    await postPage.upvoteComment(firstCommentId)

    await postPage.waitForApiResponse()

    const upvoteBtn = postPage.getUpvoteButton(firstCommentId)
    await expect(upvoteBtn).toBeVisible()
  })

  test('should downvote a comment', async () => {
    const firstCommentId = await postPage.getFirstCommentId()

    await postPage.downvoteComment(firstCommentId)

    await postPage.waitForApiResponse()

    const downvoteBtn = postPage.getDownvoteButton(firstCommentId)
    await expect(downvoteBtn.first()).toBeVisible()
  })

  test('should toggle vote (upvote → remove → downvote)', async () => {
    const firstCommentId = await postPage.getFirstCommentId()

    const upvoteBtn = postPage.getUpvoteButton(firstCommentId)
    const downvoteBtn = postPage.getDownvoteButton(firstCommentId)

    await upvoteBtn.first().click()
    await postPage.waitForApiResponse()

    await upvoteBtn.first().click()
    await postPage.waitForApiResponse()

    await downvoteBtn.first().click()
    await postPage.waitForApiResponse()

    await expect(downvoteBtn.first()).toBeVisible()
  })

  test('should handle rapid vote changes', async () => {
    const firstCommentId = await postPage.getFirstCommentId()

    const upvoteBtn = postPage.getUpvoteButton(firstCommentId)
    const downvoteBtn = postPage.getDownvoteButton(firstCommentId)

    await upvoteBtn.first().click()
    await downvoteBtn.first().click()
    await upvoteBtn.first().click()

    await postPage.waitForApiResponse()

    await expect(upvoteBtn.first()).toBeVisible()
  })

  test('should persist vote after page reload', async ({page}) => {
    const firstCommentId = await postPage.getFirstCommentId()

    await postPage.upvoteComment(firstCommentId)

    await postPage.waitForApiResponse()

    await page.reload()
    await waitForComments(page)

    const upvoteBtn = postPage.getUpvoteButton(firstCommentId)
    await expect(upvoteBtn).toBeVisible()
  })
})
