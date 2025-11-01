import {
  countVisibleComments,
  getCommentIdFromButton,
  waitForComments
} from '@/e2e/fixtures/helpers'
import {PostPage} from '@/e2e/page-objects/PostPage'
import {expect, test} from '@playwright/test'

/**
 * Comment expansion and collapse tests.
 *
 * Tests comment thread expansion/collapse functionality:
 * - Single comment expand/collapse
 * - Bulk expand with O key
 * - Bulk collapse with Shift+O
 * - Expansion state persistence across sort changes
 */
test.describe('Comment Expansion and Collapse', () => {
  test.describe.configure({mode: 'parallel'})

  let postPage: PostPage

  test.beforeEach(async ({page}) => {
    postPage = new PostPage(page)
    await postPage.gotoTestPost()
    await waitForComments(page)
  })

  test('should expand single comment thread', async ({page}) => {
    const expandBtn = page
      .locator('button[aria-label="Expand replies"]')
      .first()

    await expect(expandBtn).toBeVisible()

    const commentId = await getCommentIdFromButton(expandBtn)

    await postPage.expandComment(commentId)

    const isNowExpanded = await postPage.isCommentExpanded(commentId)
    expect(isNowExpanded).toBe(true)
  })

  test('should collapse single comment thread', async ({page}) => {
    const collapseBtn = page
      .locator('button[aria-label="Collapse replies"]')
      .first()

    await expect(collapseBtn).toBeVisible()

    const commentId = await getCommentIdFromButton(collapseBtn)

    await postPage.collapseComment(commentId)

    const isNowExpanded = await postPage.isCommentExpanded(commentId)
    expect(isNowExpanded).toBe(false)
  })

  test('should expand all comments with O key', async ({page}) => {
    await postPage.collapseAllComments()

    const beforeCount = await countVisibleComments(page)

    await postPage.expandAllComments()

    await page.locator('[data-comment-id]').first().waitFor({state: 'visible'})

    const afterCount = await countVisibleComments(page)

    expect(afterCount).toBeGreaterThanOrEqual(beforeCount)
  })

  test('should collapse all comments with Shift+O', async ({page}) => {
    await postPage.expandAllComments()
    await page.locator('[data-comment-id]').first().waitFor({state: 'visible'})

    const beforeCount = await countVisibleComments(page)

    await postPage.collapseAllComments()
    await page.locator('[data-comment-id]').first().waitFor({state: 'visible'})

    const afterCount = await countVisibleComments(page)

    expect(afterCount).toBeLessThanOrEqual(beforeCount)
  })

  test('should maintain expansion state when sorting comments', async ({
    page
  }) => {
    const expandBtn = page
      .locator('button[aria-label="Expand replies"]')
      .first()

    await expect(expandBtn).toBeVisible()

    const commentId = await getCommentIdFromButton(expandBtn)

    await postPage.expandComment(commentId)

    await postPage.sortCommentsBy('new')

    await page.locator('[data-comment-id]').first().waitFor({state: 'visible'})

    const comment = page.locator(`[data-comment-id="${commentId}"]`)
    await expect(comment).toBeVisible()

    const isExpanded = await postPage.isCommentExpanded(commentId)
    expect(isExpanded).toBe(true)
  })
})
