import {expect, test} from '@playwright/test'
import {waitForComments} from '../../../fixtures/helpers'
import {PostPage} from '../../../page-objects/PostPage'

/**
 * Comment keyboard navigation tests (J/K/U shortcuts).
 *
 * Tests keyboard shortcuts for navigating comment threads:
 * - J: Navigate to next comment
 * - K: Navigate to previous comment
 * - U: Navigate to parent comment
 * - Wrap-around behavior
 * - Input field handling
 *
 * Note: These tests use data-driven patterns to handle dynamic comment states.
 */
/* eslint-disable playwright/no-conditional-in-test, playwright/no-skipped-test */
test.describe('Comment Keyboard Navigation (J/K/U)', () => {
  let postPage: PostPage

  test.beforeEach(async ({page}) => {
    postPage = new PostPage(page)
    await postPage.gotoTestPost()
    await waitForComments(page)
  })

  test('should navigate to next comment with J key', async () => {
    // Get first comment ID for verification
    const firstCommentId =
      (await postPage
        .getAllComments()
        .first()
        .getAttribute('data-comment-id')) ?? ''

    // Press J to focus first comment
    await postPage.pressNextCommentKey()

    // Verify first comment is focused
    const focusedComment = postPage.getFocusedComment()
    const focusedId = focusedComment

    await expect(focusedId).toHaveAttribute('data-comment-id', firstCommentId)
  })

  test('should navigate to previous comment with K key', async () => {
    // Navigate to second comment
    await postPage.pressNextCommentKey()
    await postPage.pressNextCommentKey()

    // Get current focused comment ID
    const secondCommentId =
      (await postPage.getFocusedComment().getAttribute('data-comment-id')) ?? ''

    // Press K to go back
    await postPage.pressPreviousCommentKey()

    // Verify we're on first comment now
    const focusedComment = postPage.getFocusedComment()
    const focusedId = focusedComment

    await expect(focusedId).not.toHaveAttribute(
      'data-comment-id',
      secondCommentId
    )
  })

  test('should navigate to parent comment with U key', async () => {
    // Navigate to a nested comment (depth > 0)
    const comments = postPage.getAllComments()
    const count = await comments.count()

    let nestedCommentIndex = -1
    for (let i = 0; i < count; i++) {
      const depth = await comments.nth(i).getAttribute('data-comment-depth')
      if (Number.parseInt(depth || '0', 10) > 0) {
        nestedCommentIndex = i
        break
      }
    }

    // Skip if no nested comments found
    test.skip(nestedCommentIndex === -1, 'No nested comments found')

    // Navigate to nested comment
    for (let i = 0; i <= nestedCommentIndex; i++) {
      await postPage.pressNextCommentKey()
    }

    const nestedDepth = await postPage
      .getFocusedComment()
      .getAttribute('data-comment-depth')

    // Press U to go to parent
    await postPage.pressParentCommentKey()

    const parentDepth = await postPage
      .getFocusedComment()
      .getAttribute('data-comment-depth')

    // Parent should have lower depth
    expect(Number.parseInt(parentDepth || '0', 10)).toBeLessThan(
      Number.parseInt(nestedDepth || '0', 10)
    )
  })

  test('should wrap around to first comment when navigating past last', async () => {
    const commentCount = await postPage.getAllComments().count()

    // Get first comment ID
    const firstCommentId =
      (await postPage
        .getAllComments()
        .first()
        .getAttribute('data-comment-id')) ?? ''

    // Navigate past all comments
    for (let i = 0; i <= commentCount; i++) {
      await postPage.pressNextCommentKey()
    }

    // Should wrap to first comment
    const focusedId = postPage.getFocusedComment()

    await expect(focusedId).toHaveAttribute('data-comment-id', firstCommentId)
  })

  test('should not trigger navigation when typing in input field', async ({
    page
  }) => {
    // Create a text input (simulating reply form)
    await page.evaluate(() => {
      const input = document.createElement('input')
      input.type = 'text'
      input.id = 'test-input'
      document.body.appendChild(input)
    })

    // Focus the input
    await page.focus('#test-input')

    // Type 'j' - should not navigate
    await page.keyboard.press('j')

    // Verify no comment is focused (navigation didn't happen)
    const focusedComments = await postPage.getFocusedComment().count()
    expect(focusedComments).toBe(0)
  })
})
