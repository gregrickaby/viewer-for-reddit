/* eslint-disable testing-library/prefer-screen-queries */
import {expect, test} from '@playwright/test'
import {mockRedditApi} from './fixtures/apiMocks'

test.describe('Core Application Functionality', () => {
  test.beforeEach(async ({page}) => {
    await mockRedditApi(page)
  })

  test('Homepage loads with feed and essential navigation', async ({page}) => {
    await page.goto('/')

    // Verify main page structure
    await expect(
      page.getByRole('heading', {level: 1, name: 'Home'})
    ).toBeVisible()

    // Check that posts are loaded
    await expect(
      page.getByRole('heading', {level: 2, name: 'Hot post in r/all'})
    ).toBeVisible()

    // Verify essential navigation elements
    await expect(page.getByTestId('posts-container')).toBeVisible()
    await expect(
      page.getByRole('textbox', {name: 'Search subreddits'})
    ).toBeVisible()
    await expect(page.getByTestId('settings-button')).toBeVisible()
  })

  test('Search functionality with subreddit navigation and sorting', async ({
    page
  }) => {
    await page.goto('/')

    // Test search discovery
    const searchInput = page.getByRole('textbox', {name: 'Search subreddits'})
    await searchInput.click()

    // Verify popular subreddits appear
    await expect(page.getByText('Popular subreddits')).toBeVisible()
    await expect(page.getByRole('option', {name: /r\/aww/i})).toBeVisible()

    // Search for specific subreddit
    await searchInput.fill('cats')

    // Verify search results
    const catsOption = page.getByRole('option', {name: /r\/cats/i})
    await expect(catsOption).toBeVisible()
    await expect(catsOption).toContainText('654,321 members')
    await expect(
      page.getByRole('option', {name: /r\/CatsStandingUp/i})
    ).toBeVisible()

    // Navigate to subreddit
    await catsOption.click()
    await expect(page).toHaveURL(/\/r\/cats$/)
    await expect(
      page.getByRole('heading', {level: 1, name: 'Posts from r/cats'})
    ).toBeVisible()

    // Test sorting functionality
    await expect(
      page.getByRole('heading', {level: 2, name: 'Hot post in r/cats'})
    ).toBeVisible()

    const topRadio = page.getByRole('radio', {name: 'Top'})
    await topRadio.click()
    await expect(topRadio).toBeChecked()
    await expect(
      page.getByRole('heading', {level: 2, name: 'Top post in r/cats'})
    ).toBeVisible()
  })

  test('Settings modal interaction', async ({page}) => {
    await page.goto('/')

    await page.getByTestId('settings-button').click()

    // Test dark mode toggle
    const darkModeSwitch = page.getByRole('switch', {name: 'Toggle Dark Mode'})
    await expect(darkModeSwitch).toBeVisible()
    await expect(darkModeSwitch).not.toBeChecked()

    await darkModeSwitch.click()
    await expect(darkModeSwitch).toBeChecked()

    // Test mute toggle
    const muteSwitch = page.getByRole('switch', {name: 'Toggle Mute'})
    await expect(muteSwitch).toBeChecked()
    await muteSwitch.click()
    await expect(muteSwitch).not.toBeChecked()
  })

  test('Error handling: Search recovers from empty results', async ({page}) => {
    await page.goto('/')

    const searchInput = page.getByRole('textbox', {name: 'Search subreddits'})

    // Search for non-existent subreddit
    await searchInput.fill('nonexistentsubreddit12345')

    // Clear and search again
    await searchInput.clear()
    await searchInput.fill('cats')

    // Verify normal search results appear
    await expect(page.getByRole('option', {name: /r\/cats/i})).toBeVisible()
  })
})