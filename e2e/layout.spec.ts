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
