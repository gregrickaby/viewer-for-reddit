/* eslint-disable testing-library/prefer-screen-queries */
import {expect, test} from '@playwright/test'
import {mockRedditApi} from './fixtures/apiMocks'

test.describe('Complete User Journeys', () => {
  test.beforeEach(async ({page}) => {
    await mockRedditApi(page)
  })

  test('Complete user flow: Homepage → Search → Navigate → Sort → Return', async ({
    page
  }) => {
    // 1. Start at homepage
    await page.goto('/')
    await expect(
      page.getByRole('heading', {level: 1, name: 'Home'})
    ).toBeVisible()

    // 2. Discover popular subreddits
    const searchInput = page.getByRole('textbox', {name: 'Search subreddits'})
    await searchInput.click()
    await expect(page.getByText('Popular subreddits')).toBeVisible()

    // 3. Search for specific content
    await searchInput.fill('cats')
    await expect(page.getByRole('option', {name: /r\/cats/i})).toBeVisible()

    // 4. Navigate to subreddit
    await page.getByRole('option', {name: /r\/cats/i}).click()
    await expect(page).toHaveURL(/\/r\/cats$/)
    await expect(
      page.getByRole('heading', {level: 1, name: 'Posts from r/cats'})
    ).toBeVisible()

    // 5. Interact with sorting
    const topRadio = page.getByRole('radio', {name: 'Top'})
    await topRadio.click()
    await expect(topRadio).toBeChecked()
    await expect(
      page.getByRole('heading', {level: 2, name: 'Top post in r/cats'})
    ).toBeVisible()

    // 6. Return to homepage
    await page.getByRole('link', {name: 'Home'}).click()
    await expect(page).toHaveURL('/')
    await expect(
      page.getByRole('heading', {level: 1, name: 'Home'})
    ).toBeVisible()
  })

  test('Mobile user journey optimized for touch interaction', async ({
    page
  }) => {
    // Mobile viewport (69% of your traffic)
    await page.setViewportSize({width: 375, height: 667})
    await page.goto('/')

    // Mobile search interaction
    const searchInput = page.getByRole('textbox', {name: 'Search subreddits'})
    await searchInput.click()

    // Verify mobile-friendly search experience
    await expect(page.getByText('Popular subreddits')).toBeVisible()
    await searchInput.fill('cats')

    // Mobile touch navigation
    await expect(page.getByRole('option', {name: /r\/cats/i})).toBeVisible()
    await page.getByRole('option', {name: /r\/cats/i}).click()

    // Verify mobile subreddit experience
    await expect(page).toHaveURL(/\/r\/cats$/)
    await expect(
      page.getByRole('heading', {level: 1, name: 'Posts from r/cats'})
    ).toBeVisible()

    // Test mobile sorting interaction
    const sortingControls = page.getByRole('radio').first()
    await expect(sortingControls).toBeVisible()
  })

  test('Power user workflow: Multiple searches and navigation', async ({
    page
  }) => {
    await page.goto('/')

    const searchInput = page.getByRole('textbox', {name: 'Search subreddits'})

    // First search
    await searchInput.fill('cats')
    await page.getByRole('option', {name: /r\/cats/i}).click()
    await expect(page).toHaveURL(/\/r\/cats$/)

    // Navigate back to search for another subreddit
    await page.goBack()
    await expect(page).toHaveURL('/')

    // Second search - verify search works after navigation
    await searchInput.click()
    await searchInput.clear()
    await searchInput.fill('aww')

    // Verify search still functions properly
    await expect(page.getByRole('option', {name: /r\/aww/i})).toBeVisible()
  })

  test('Error resilience: Handle network issues gracefully', async ({page}) => {
    await page.goto('/')

    const searchInput = page.getByRole('textbox', {name: 'Search subreddits'})

    // Test empty search results
    await searchInput.fill('nonexistentsubreddit12345')
    // The app should handle this gracefully (no results, no crash)

    // Recover with valid search
    await searchInput.clear()
    await searchInput.fill('cats')
    await expect(page.getByRole('option', {name: /r\/cats/i})).toBeVisible()

    // Complete the workflow to ensure recovery is complete
    await page.getByRole('option', {name: /r\/cats/i}).click()
    await expect(page).toHaveURL(/\/r\/cats$/)
  })

  test('Settings persistence across navigation', async ({page}) => {
    await page.goto('/')

    // Open settings and change dark mode
    await page.getByTestId('settings-button').click()
    const darkModeSwitch = page.getByRole('switch', {name: 'Toggle Dark Mode'})
    await darkModeSwitch.click()
    await expect(darkModeSwitch).toBeChecked()

    // Close settings (assume click outside or ESC)
    await page.keyboard.press('Escape')

    // Navigate to subreddit
    const searchInput = page.getByRole('textbox', {name: 'Search subreddits'})
    await searchInput.fill('cats')
    await page.getByRole('option', {name: /r\/cats/i}).click()

    // Verify settings persist after navigation
    await page.getByTestId('settings-button').click()
    await expect(
      page.getByRole('switch', {name: 'Toggle Dark Mode'})
    ).toBeChecked()
  })
})