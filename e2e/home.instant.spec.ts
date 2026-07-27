import {expect, test} from '@playwright/test'
import {instant} from '@next/playwright'
import {injectTestUserSession, testUrl} from './helpers'

// Sync elements of the homepage's static shell, not data that streams in.
// Same for every user regardless of auth state.
const HEADER_MARKER = '[data-testid="logo-link"]'
const SIDEBAR_NAV_MARKER = '[data-testid="sidebar-home-link"]'

test.describe('instant initial load: home', () => {
  test.beforeEach(async ({page}) => {
    await injectTestUserSession(page) // storageState only; does NOT call page.goto
  })

  test('header shell is served', async ({page}) => {
    const url = testUrl('/')
    await instant(
      page,
      async () => {
        await page.goto(url)
        await expect(page.locator(HEADER_MARKER)).toBeVisible()
      },
      {baseURL: new URL(url).origin}
    )
  })

  test('sidebar nav shell is served', async ({page}) => {
    const url = testUrl('/')
    await instant(
      page,
      async () => {
        await page.goto(url)
        await expect(page.locator(SIDEBAR_NAV_MARKER)).toBeVisible()
      },
      {baseURL: new URL(url).origin}
    )
  })
})
