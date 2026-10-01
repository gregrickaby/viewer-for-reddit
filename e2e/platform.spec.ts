import { instant } from '@next/playwright'
import { expect, signIn, test } from './fixtures'

/*
 * Platform guarantees (design N-requirements): sign-in without JavaScript,
 * the browser never talks to Reddit's API, the CSP holds, and navigation
 * paints the prefetched shell at once.
 */

/*
 * Without JavaScript (design N6, as amended): forms work before hydration, and
 * sign-in needs no scripts. Streamed Reddit data does: Partial Prerendering
 * sends it in hidden segments that an inline script moves into place, even
 * for crawlers, so script-less readers see the prerendered shell and skeletons.
 */
test.describe('without JavaScript @nojs', () => {
  test('signing in needs no scripts and lands on the server-rendered shell @nojs', async ({
    page,
    mock,
  }) => {
    void mock
    await signIn(page)
    await expect(page.getByRole('heading', { level: 1, name: 'Home' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Feeds' })).toBeVisible()
    await expect(page.getByRole('search')).toBeVisible()
  })
})

test.describe('network and security', () => {
  test('the browser only talks to the app; Reddit is reached by the server alone', async ({
    page,
    mock,
  }) => {
    void mock
    const requests: string[] = []
    page.on('request', (request) => requests.push(request.url()))
    await signIn(page)
    await page.locator('main article h2 a').first().click()
    await expect(page.locator('#comments article').first()).toBeVisible()

    const apiCalls = requests.filter(
      (url) => url.startsWith('http://localhost:4010') && !url.includes('/api/v1/authorize'),
    )
    expect(apiCalls).toEqual([])
    const appRequests = requests.filter((url) => url.startsWith('http://localhost:3100'))
    expect(appRequests.length).toBeGreaterThan(0)
  })

  test('pages load under the CSP without violations', async ({ page, mock }) => {
    void mock
    const violations: string[] = []
    page.on('console', (message) => {
      if (/Content Security Policy/i.test(message.text())) violations.push(message.text())
    })
    const response = await page.goto('/')
    expect(response?.headers()['content-security-policy']).toContain("frame-ancestors 'none'")
    expect(response?.headers()['x-content-type-options']).toBe('nosniff')
    await signIn(page)
    await page.locator('main article h2 a').first().click()
    await expect(page.locator('#comments article').first()).toBeVisible()
    await page.goto('/settings')
    await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible()
    expect(violations).toEqual([])
  })
})

test.describe('instant navigation', () => {
  test('a feed link paints the prefetched shell before Reddit data arrives', async ({
    signedIn: page,
  }) => {
    const link = page
      .getByRole('navigation', { name: 'Feeds' })
      .getByRole('link', { name: 'Popular' })
    // Sign-in returns while /home is still streaming and the router is still prefetching
    // /r/popular. Let both finish, or the click can be answered by a full payload instead
    // of the prefetched shell, and there is no skeleton left to see.
    await expect(page.locator('main article').first()).toBeVisible()
    await link.hover()
    await page.waitForLoadState('networkidle')
    await instant(page, async () => {
      await link.click()
      await expect(page).toHaveURL(/\/r\/popular$/)
      // Chrome and skeletons are visible while the feed itself is held back.
      await expect(page.getByRole('banner')).toBeVisible()
      await expect(page.locator('[aria-busy="true"]').first()).toBeVisible()
    })
    await expect(page.locator('main article').first()).toBeVisible()
  })
})

test.describe('header', () => {
  for (const { width, wordmark } of [
    { width: 390, wordmark: false },
    { width: 1280, wordmark: true },
  ]) {
    test(`at ${width}px the logo is centred and the name is ${wordmark ? 'shown' : 'hidden'}`, async ({
      signedIn: page,
    }) => {
      await page.setViewportSize({ width, height: 800 })
      await expect(page.getByRole('button', { name: /^Account menu/ })).toBeVisible()
      const header = page.locator('header').first()
      // The search box keeps a usable width, even on a phone.
      const search = await page.getByRole('searchbox', { name: 'Search Reddit' }).boundingBox()
      expect(search!.width).toBeGreaterThanOrEqual(150)
      const logo = page.getByRole('link', { name: 'Viewer for Reddit home' }).locator('img')
      const [bar, mark] = await Promise.all([header.boundingBox(), logo.boundingBox()])
      // The logo sits inside the search bar, at its left edge.
      expect(mark!.x).toBeGreaterThanOrEqual(search!.x)
      expect(mark!.x + mark!.width).toBeLessThan(search!.x + 60)
      const offset = mark!.y + mark!.height / 2 - (bar!.y + bar!.height / 2)
      expect(Math.abs(offset)).toBeLessThanOrEqual(1)
      const name = header.getByText('Viewer for Reddit', { exact: true })
      await (wordmark ? expect(name).toBeVisible() : expect(name).toBeHidden())
      if (process.env.HEADER_SHOTS)
        await header.screenshot({ path: `${process.env.HEADER_SHOTS}/header-${width}.png` })
    })
  }
})
