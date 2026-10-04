import { expect, test } from './fixtures'

test.describe('feed', () => {
  // Off-screen posts skip layout; their placeholder size must not widen the page.
  for (const path of ['/home', '/r/pics']) {
    test(`${path} fits a phone without scrolling sideways`, async ({ signedIn: page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(path)
      await expect(page.locator('main article').first()).toBeVisible()
      const { scroll, client } = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }))
      expect(scroll).toBeLessThanOrEqual(client)
    })
  }
})

test.describe('community header', () => {
  test('keeps the name below the banner and wide enough to read on a phone', async ({
    signedIn: page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await page.goto('/r/pics')
    const header = page.locator('main header').first()
    const title = header.getByRole('heading', { level: 1 })
    await expect(title).toBeVisible()

    const [root, banner, name] = await Promise.all([
      header.boundingBox(),
      header.locator('> div').first().boundingBox(),
      title.boundingBox(),
    ])
    // The name gets a row to itself: under the banner, and most of the card wide.
    expect(name!.y).toBeGreaterThanOrEqual(banner!.y + banner!.height)
    expect(name!.width).toBeGreaterThan(root!.width * 0.4)
    await expect(header.getByRole('button', { name: /Join|Joined/ })).toBeVisible()
  })

  test('puts the icon, name, and buttons in one row on a wide screen', async ({
    signedIn: page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/r/pics')
    const header = page.locator('main header').first()
    const title = await header.getByRole('heading', { level: 1 }).boundingBox()
    const button = await header.getByRole('button', { name: /Join|Joined/ }).boundingBox()
    // Side by side: the button starts to the right of where the name ends.
    expect(button!.x).toBeGreaterThan(title!.x + title!.width * 0.5)
    expect(Math.abs(button!.y - title!.y)).toBeLessThan(80)
  })
})

test.describe('gallery', () => {
  for (const width of [390, 1280]) {
    test(`at ${width}px the frame fills the card and the slides have no indent`, async ({
      signedIn: page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      // A gallery post from the mock's samples (the 18th link, id "e2eh").
      await page.goto('/r/Damnthatsinteresting/comments/e2eh/post_17')
      const gallery = page.locator('section[data-gallery]').first()
      await gallery.scrollIntoViewIfNeeded()
      const track = gallery.locator('ul[aria-roledescription="carousel"]')
      const slide = track.locator('li').first()
      const image = track.locator('img').first()
      await expect(image).toBeVisible()

      const [outer, frame, first, picture] = await Promise.all([
        gallery.boundingBox(),
        track.boundingBox(),
        slide.boundingBox(),
        image.boundingBox(),
      ])
      // The frame spans the whole card, and a slide spans the frame: a list's default
      // indent would shift the slides right and leave the frame wider than its content.
      expect(Math.abs(frame!.width - outer!.width)).toBeLessThanOrEqual(1)
      expect(Math.abs(first!.x - frame!.x)).toBeLessThanOrEqual(1)
      expect(Math.abs(first!.width - frame!.width)).toBeLessThanOrEqual(1)
      // The photo stays inside the frame, whatever its shape.
      expect(picture!.x).toBeGreaterThanOrEqual(frame!.x - 1)
      expect(picture!.x + picture!.width).toBeLessThanOrEqual(frame!.x + frame!.width + 1)
      expect(picture!.y).toBeGreaterThanOrEqual(frame!.y - 1)
      expect(picture!.y + picture!.height).toBeLessThanOrEqual(frame!.y + frame!.height + 1)
    })
  }
})

test.describe('comments', () => {
  test('a long unbroken link wraps inside the column on a phone', async ({
    signedIn: page,
    mock,
  }) => {
    await mock.control({ addLiveComment: `https://example.com/${'a'.repeat(120)}` })
    await page.setViewportSize({ width: 390, height: 800 })
    await page.goto('/r/pics/comments/e2elive/game_thread')
    await expect(page.getByText('https://example.com/aaaa', { exact: false })).toBeVisible()
    const width = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(width).toBeLessThanOrEqual(390)
  })
})

test.describe('search results', () => {
  test('fit a phone without scrolling sideways', async ({ signedIn: page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await page.goto('/search?q=pics')
    await expect(page.getByRole('list').first()).toBeVisible()
    const { scroll, client } = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }))
    expect(scroll).toBeLessThanOrEqual(client)
  })

  for (const width of [1024, 1727]) {
    test(`at ${width}px the results start where the search bar does`, async ({
      signedIn: page,
    }) => {
      await page.setViewportSize({ width, height: 800 })
      await page.goto('/search?q=pics')
      const bar = await page.locator('form[role="search"]').first().locator('> div').boundingBox()
      const title = await page.getByRole('main').getByRole('heading', { level: 1 }).boundingBox()
      expect(Math.abs(bar!.x - title!.x)).toBeLessThan(2)
    })
  }

  test('switches between communities, people, and posts', async ({ signedIn: page }) => {
    await page.goto('/search?q=pics')
    const header = page.getByRole('searchbox', { name: 'Search Reddit' })
    await expect(header).toHaveValue('pics')
    await expect(page.getByRole('main').getByRole('searchbox')).toHaveCount(0)
    const tabs = page.getByRole('navigation', { name: 'Search types' })
    await expect(tabs.getByRole('link', { name: 'Communities' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await tabs.getByRole('link', { name: 'People' }).click()
    await expect(page).toHaveURL(/tab=people/)
    await expect(header).toHaveValue('pics')
    await header.fill('spez')
    await header.press('Enter')
    await expect(page).toHaveURL(/q=spez.*tab=people|tab=people.*q=spez/)
    await expect(page.getByRole('link', { name: 'u/spez' })).toBeVisible()
    await tabs.getByRole('link', { name: 'Posts' }).click()
    await expect(page).toHaveURL(/tab=posts/)
    await expect(page.getByRole('article').first()).toBeVisible()
  })
})

test.describe('navigation helpers', () => {
  for (const path of [
    '/active',
    '/multis',
    '/saved',
    '/settings',
    '/subreddits',
    '/search?q=pics',
    '/r/pics',
    '/r/popular',
    '/user/spez',
    '/m/one',
    '/live/e2elivethread1',
  ]) {
    test(`${path} has a way back home`, async ({ signedIn: page }) => {
      await page.goto(path)
      await expect(page.getByRole('main').getByRole('link', { name: '← Home' })).toBeVisible()
    })
  }

  test('a multi and a profile link back home', async ({ signedIn: page }) => {
    await page.goto('/user/spez')
    await page.getByRole('link', { name: '← Home' }).click()
    await expect(page).toHaveURL(/\/home$/)
  })

  test('the scroll-to-top button appears past 200px and returns to the top', async ({
    signedIn: page,
  }) => {
    await page.setViewportSize({ width: 390, height: 700 })
    await page.goto('/home')
    const button = page.getByRole('button', { name: 'Scroll to top', includeHidden: true })
    await expect(button).toHaveAttribute('data-visible', 'false')
    await page.evaluate(() => window.scrollTo(0, 600))
    await expect(button).toHaveAttribute('data-visible', 'true')
    await button.click()
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5)
    await expect(button).toHaveAttribute('data-visible', 'false')
  })
})
