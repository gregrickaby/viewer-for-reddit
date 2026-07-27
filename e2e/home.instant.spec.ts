import {expect, test} from '@playwright/test'
import {instant} from '@next/playwright'
import {injectTestUserSession, testUrl} from './helpers'

// A sync element of the homepage's static shell (the header logo), not data
// that streams in. Same for every user regardless of auth state.
const SHELL_MARKER = '[data-testid="logo-link"]'

test.describe('instant initial load: home', () => {
  test.beforeEach(async ({page}) => {
    await injectTestUserSession(page) // storageState only; does NOT call page.goto
  })

  test('home shell is served', async ({page}) => {
    const url = testUrl('/')
    await instant(
      page,
      async () => {
        await page.goto(url)
        await expect(page.locator(SHELL_MARKER)).toBeVisible()
      },
      {baseURL: new URL(url).origin}
    )
  })
})
