import {Page} from '@playwright/test'

/**
 * Wait for comments to load on page.
 */
export async function waitForComments(page: Page) {
  await page.locator('[data-comment-id]').first().waitFor({timeout: 10000})
}

/**
 * Count visible comments.
 */
export async function countVisibleComments(page: Page): Promise<number> {
  return await page.locator('[data-comment-id]:visible').count()
}

/**
 * Get all comment IDs.
 */
export async function getAllCommentIds(page: Page): Promise<string[]> {
  const comments = page.locator('[data-comment-id]')
  const count = await comments.count()
  const ids: string[] = []

  for (let i = 0; i < count; i++) {
    const id = await comments.nth(i).getAttribute('data-comment-id')
    if (id) ids.push(id)
  }

  return ids
}

/**
 * Scroll to element smoothly.
 */
export async function scrollToElement(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded()
}
