import { expect, test } from './fixtures'

const GAME = '/r/pics/comments/e2elive/game_thread'
/** One poll is 15 seconds, and a shared read can be up to 10 seconds old. */
const POLL = { timeout: 45_000 }

test.describe('a game thread', () => {
  test.setTimeout(120_000)

  test('opens on the thread’s suggested sort and watches for new comments', async ({
    signedIn: page,
    mock,
  }) => {
    await page.goto(GAME)
    const tab = (name: string) => page.getByRole('link', { name, exact: true })
    await expect(tab('New')).toHaveAttribute('aria-current', 'page')
    await expect(tab('Best')).toHaveAttribute('href', `${GAME}?sort=confidence`)
    await expect(page.getByText('Watching for new comments')).toBeVisible()
    await expect(page.getByText('Score: 0-0')).toBeVisible()

    await mock.control({ addLiveComment: 'Goal for the home side', liveBody: 'Score: 1-0' })

    // The new comment and the edited scoreboard arrive without a reload or navigation.
    const stream = page.locator('#comments ol[class*=updates]')
    await expect(stream.getByText('Goal for the home side')).toBeVisible(POLL)
    await expect(page.getByText('Score: 1-0')).toBeVisible()
    await expect(page.getByText('Score: 0-0')).toBeHidden()
    await expect(stream.getByRole('link', { name: 'u/fan' })).toBeVisible()
  })

  test('pauses and resumes, and says what is paused', async ({ signedIn: page, mock }) => {
    await page.goto(GAME)
    await page.getByRole('button', { name: 'Pause' }).click()
    await expect(page.getByText('Not watching for new comments')).toBeVisible()

    await mock.control({ addLiveComment: 'While paused' })
    await page.waitForTimeout(17_000)
    await expect(page.getByText('While paused')).toBeHidden()

    await page.getByRole('button', { name: 'Resume' }).click()
    await expect(page.getByText('Watching for new comments')).toBeVisible()
    await expect(page.locator('#comments').getByText('While paused')).toBeVisible(POLL)
  })

  test('does not watch when sorted by best', async ({ signedIn: page }) => {
    await page.goto(GAME)
    await page.getByRole('link', { name: 'Best', exact: true }).click()
    await page.waitForURL(/sort=confidence$/)
    await expect(page.getByRole('link', { name: 'Best', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(page.getByText('Watching for new comments')).toBeHidden()
  })
})

test.describe('a live thread', () => {
  test.setTimeout(120_000)

  test('shows updates and adds new ones as they are posted', async ({ signedIn: page, mock }) => {
    await mock.control({ addLiveUpdate: 'Polls have closed' })
    await page.goto('/live/e2elivethread1')
    await expect(page.getByRole('heading', { level: 1, name: 'Election Night' })).toBeVisible()
    await expect(page.getByText('Results as they come in')).toBeVisible()
    await expect(page.getByText(/Live · 12 viewers/)).toBeVisible()
    await expect(page.getByText('Polls have closed')).toBeVisible()

    await mock.control({ addLiveUpdate: 'First results are in' })
    const updates = page.locator('ol[class*=updates] li')
    await expect(updates.first()).toContainText('First results are in', POLL)
    await expect(updates.nth(1)).toContainText('Polls have closed')
  })
})

test.describe('active threads', () => {
  test('lists busy recent threads from the sidebar, and leaves out old ones', async ({
    signedIn: page,
  }) => {
    await page
      .getByRole('navigation', { name: 'Feeds' })
      .getByRole('link', { name: 'Active' })
      .click()
    await page.waitForURL('**/active')
    await expect(page.getByRole('heading', { level: 1, name: 'Active threads' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Game Thread: Pics @ Memes' })).toBeVisible()
    await expect(page.getByText('Game Thread: Old')).toBeHidden()

    await page.getByRole('link', { name: 'Game Thread: Pics @ Memes' }).click()
    await page.waitForURL(`**${GAME}`)
    await expect(page.getByText('Watching for new comments')).toBeVisible()
  })
})
