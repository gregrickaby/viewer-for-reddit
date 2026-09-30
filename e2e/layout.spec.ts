import { expect, test } from './fixtures'

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
