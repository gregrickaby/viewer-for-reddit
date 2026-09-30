import { expect, signIn, test } from './fixtures'

test.describe('sign in and out', () => {
  test('a signed-out visit asks to sign in, then returns where it started', async ({
    page,
    mock,
  }) => {
    void mock
    await page.goto('/r/pics')
    await expect(page).toHaveURL(/\/\?next=%2Fr%2Fpics$/)
    await page.getByRole('button', { name: 'Sign in with Reddit' }).first().click()
    await page.waitForURL('**/r/pics')
    await expect(page.getByRole('heading', { level: 1, name: /r\/pics/i })).toBeVisible()
  })

  test('a signed-out visit to an address the site does not have shows the 404 page', async ({
    page,
    mock,
  }) => {
    void mock
    const response = await page.goto('/no-such-page')
    expect(response?.status()).toBe(404)
    await expect(page).toHaveURL(/\/no-such-page$/)
    await expect(page.getByRole('heading', { level: 1, name: /doesn.t exist/ })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Back to Home' })).toHaveAttribute('href', '/')
  })

  test('signing out ends the session', async ({ signedIn: page }) => {
    await page.getByRole('button', { name: /Account menu/ }).click()
    await page.getByRole('button', { name: 'Sign out' }).click()
    await page.waitForURL((url) => url.pathname === '/')
    await page.goto('/home')
    await expect(page).toHaveURL(/\/\?next=%2Fhome$/)
  })
})

test.describe('feeds', () => {
  test('home lists posts, loads more as you scroll, and sorts', async ({ signedIn: page }) => {
    const titles = () => page.locator('main article h2').allTextContents()
    await expect(page.locator('main article').first()).toBeVisible()
    const first = await titles()
    expect(first).toHaveLength(25)

    // The next page is appended without a navigation, and the pager links are hidden.
    await expect(page.getByRole('link', { name: 'Next →' })).toBeHidden()
    const end = page.getByText('You’ve reached the end.')
    await expect(async () => {
      await page.mouse.wheel(0, 4000)
      await expect(end).toBeVisible({ timeout: 500 })
    }).toPass()
    const all = await titles()
    expect(all.length).toBeGreaterThan(first.length)
    expect(new Set(all).size).toBe(all.length)
    expect(page.url()).not.toContain('after=')

    await page.getByRole('link', { name: 'Top', exact: true }).click()
    await page.waitForURL(/sort=top&t=week$/)
    await expect(page.getByRole('link', { name: 'Top', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  test('a post opens with its comments, and the breadcrumb goes back', async ({
    signedIn: page,
  }) => {
    const title = await page.locator('main article h2 a').first().textContent()
    await page.locator('main article h2 a').first().click()
    await expect(page.getByRole('heading', { level: 1, name: title!.trim() })).toBeVisible()
    await expect(page.locator('#comments article').first()).toBeVisible()
    await page.getByRole('link', { name: /^← r\// }).click()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('r/')
  })

  test('sign-in keeps working across a reload', async ({ page, mock }) => {
    void mock
    await signIn(page)
    await page.reload()
    await expect(page.locator('main article').first()).toBeVisible()
  })
})
