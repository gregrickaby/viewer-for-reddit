import {waitForComments} from '@/e2e/fixtures/helpers'
import {PostPage} from '@/e2e/page-objects/PostPage'
import {expect, test} from '@playwright/test'

/**
 * Comment keyboard navigation tests (J/K/U shortcuts).
 *
 * Tests keyboard shortcuts for navigating comment threads:
 * - J: Navigate to next comment
 * - K: Navigate to previous comment
 * - U: Navigate to parent comment
 * - Wrap-around behavior
 * - Input field handling
 */
test.describe('Comment Keyboard Navigation (J/K/U)', () => {
  test.describe.configure({mode: 'parallel'})

  let postPage: PostPage

  test.beforeEach(async ({page}) => {
    postPage = new PostPage(page)
    await postPage.gotoTestPost()
    await waitForComments(page)
  })

  test('should navigate to next comment with J key', async () => {
    const firstComment = postPage.getAllComments().first()
    const firstCommentId = (await firstComment.getAttribute('data-comment-id'))!

    await postPage.pressNextCommentKey()

    const focusedId = postPage.getFocusedComment()

    await expect(focusedId).toHaveAttribute('data-comment-id', firstCommentId)
  })

  test('should navigate to previous comment with K key', async () => {
    await postPage.pressNextCommentKey()
    await postPage.pressNextCommentKey()

    const secondCommentId = (await postPage
      .getFocusedComment()
      .getAttribute('data-comment-id'))!

    await postPage.pressPreviousCommentKey()

    const focusedId = postPage.getFocusedComment()

    await expect(focusedId).not.toHaveAttribute(
      'data-comment-id',
      secondCommentId
    )
  })

  test.fixme('should navigate to parent comment with U key', async () => {
    const nestedComment = postPage.page
      .locator('[data-comment-depth]:not([data-comment-depth="0"])')
      .first()

    await expect(nestedComment).toBeVisible()

    const nestedDepth = await nestedComment.getAttribute('data-comment-depth')

    await nestedComment.focus()

    await postPage.pressParentCommentKey()

    const parentDepth = await postPage
      .getFocusedComment()
      .getAttribute('data-comment-depth')

    expect(Number.parseInt(parentDepth || '0', 10)).toBeLessThan(
      Number.parseInt(nestedDepth || '0', 10)
    )
  })

  test('should wrap around to first comment when navigating past last', async () => {
    const firstComment = postPage.getAllComments().first()
    const firstCommentId = (await firstComment.getAttribute('data-comment-id'))!

    const lastComment = postPage.getAllComments().last()
    await lastComment.focus()

    await postPage.pressNextCommentKey()

    const focusedId = postPage.getFocusedComment()

    await expect(focusedId).toHaveAttribute('data-comment-id', firstCommentId)
  })

  test('should not trigger navigation when typing in input field', async ({
    page
  }) => {
    await page.evaluate(() => {
      const input = document.createElement('input')
      input.type = 'text'
      input.id = 'test-input'
      document.body.appendChild(input)
    })

    await page.focus('#test-input')

    await page.keyboard.press('j')

    const focusedComments = await postPage.getFocusedComment().count()
    expect(focusedComments).toBe(0)
  })
})
