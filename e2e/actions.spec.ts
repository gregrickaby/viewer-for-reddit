import { expect, test } from './fixtures'

/*
 * Optimistic writes (design §8.6): the UI answers before Reddit does, keeps
 * the result when Reddit agrees, and rolls back with a reason when it doesn't.
 */

test.describe('voting and saving', () => {
  test('a vote shows at once, persists, and survives a reload', async ({
    signedIn: page,
    mock,
  }) => {
    await mock.control({ delayMs: 1500 })
    const card = page.locator('main article').first()
    const upvote = card.getByRole('button', { name: /^Upvote post/ })
    await upvote.click()
    // Well before the (1.5 s) server answer.
    await expect(upvote).toHaveAttribute('aria-pressed', 'true', { timeout: 300 })
    await expect.poll(async () => Object.values((await mock.state()).votes)).toContain(1)

    await mock.control({ delayMs: 0 })
    await page.reload()
    await expect(
      page
        .locator('main article')
        .first()
        .getByRole('button', { name: /^Upvote post/ }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  test('a refused vote rolls back and says why', async ({ signedIn: page, mock }) => {
    await mock.control({ failNext: 1 })
    const card = page.locator('main article').first()
    const downvote = card.getByRole('button', { name: /^Downvote post/ })
    await downvote.click()
    await expect(card.getByRole('alert')).toBeVisible()
    await expect(downvote).toHaveAttribute('aria-pressed', 'false')
  })

  test('saving toggles at once and shows up under Saved', async ({ signedIn: page, mock }) => {
    const card = page.locator('main article').nth(1)
    const title = (await card.locator('h2').textContent())!.trim()
    const save = card.getByRole('button', { name: /^Save/ })
    await save.click()
    await expect(save).toHaveAttribute('aria-pressed', 'true', { timeout: 300 })
    await expect.poll(async () => (await mock.state()).saved.length).toBeGreaterThan(0)

    await page.goto('/saved')
    await expect(page.getByRole('heading', { level: 2, name: title })).toBeVisible()
  })
})

test.describe('comments', () => {
  test('a new comment shows as pending, then as the real comment', async ({
    signedIn: page,
    mock,
  }) => {
    await page.locator('main article h2 a').first().click()
    await expect(page.locator('#comments article').first()).toBeVisible()

    await mock.control({ delayMs: 1000 })
    const text = `End-to-end comment ${Date.now()}`
    await page.getByLabel('Comment', { exact: true }).fill(text)
    await page.getByRole('button', { name: 'Comment', exact: true }).click()
    await expect(page.getByText('u/fixture_user · sending…')).toBeVisible({ timeout: 300 })
    await expect(page.locator('#comments article', { hasText: text })).toBeVisible()
    await expect(page.getByText('sending…')).toHaveCount(0)
  })

  test('deleting your comment takes one click on Delete in the dialog', async ({
    signedIn: page,
  }) => {
    await page.locator('main article h2 a').first().click()
    await expect(page.locator('#comments article').first()).toBeVisible()

    const text = `Delete me ${Date.now()}`
    await page.getByLabel('Comment', { exact: true }).fill(text)
    await page.getByRole('button', { name: 'Comment', exact: true }).click()
    const mine = page.locator('#comments article', { hasText: text })
    await expect(mine).toBeVisible()
    await expect(page.getByText('sending…')).toHaveCount(0)

    await mine.getByRole('button', { name: 'Delete' }).click()
    const dialog = page.getByRole('dialog', { name: 'Delete comment' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Delete' }).click()
    await expect(mine).toHaveCount(0)
  })

  test('a comment on a locked thread keeps the draft and explains', async ({
    signedIn: page,
    mock,
  }) => {
    await page.locator('main article h2 a').first().click()
    await mock.control({ failNext: 1 })
    await page.getByLabel('Comment', { exact: true }).fill('Kept draft')
    await page.getByRole('button', { name: 'Comment', exact: true }).click()
    await expect(page.locator('#comments').getByRole('alert')).toBeVisible()
    await expect(page.getByLabel('Comment', { exact: true })).toHaveValue('Kept draft')
  })
})

test.describe('communities', () => {
  test('joining a community updates the button and the sidebar', async ({
    signedIn: page,
    mock,
  }) => {
    await page.goto('/search?q=anything')
    const firstJoin = page
      .locator('main')
      .getByRole('button', { name: /^Join r\// })
      .first()
    const name = (await firstJoin.getAttribute('aria-label'))!.replace('Join ', '')
    // Pin the row by name: after joining it no longer has a Join button.
    const row = page.locator('main li', { has: page.getByRole('link', { name, exact: true }) })
    await row.getByRole('button', { name: `Join ${name}` }).click()
    await expect(row.getByRole('button', { name: `Joined ${name}` })).toBeVisible({ timeout: 300 })
    await expect
      .poll(async () => (await mock.state()).subscribed)
      .toContain(name.slice(2).toLowerCase())
    await expect(
      page.getByRole('navigation', { name: 'Communities' }).getByRole('link', { name }),
    ).toBeVisible()
  })
})
