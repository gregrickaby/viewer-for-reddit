/* eslint-disable testing-library/prefer-screen-queries */
import {expect, test} from '@playwright/test'
import {mockRedditApi} from './fixtures/apiMocks'

test.describe('Accessibility Compliance', () => {
  test.beforeEach(async ({page}) => {
    await mockRedditApi(page)
  })

  test('Keyboard navigation through search workflow', async ({page}) => {
    await page.goto('/')

    // Navigate to search input using Tab
    let attempts = 0
    const maxAttempts = 10
    while (attempts < maxAttempts) {
      const ariaLabel = await page.evaluate(() =>
        document.activeElement?.getAttribute('aria-label')
      )

      if (ariaLabel === 'Search subreddits') {
        break
      }

      await page.keyboard.press('Tab')
      attempts++
    }

    // Search using keyboard
    await page.keyboard.type('cats')

    // Navigate search results with arrow keys
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('Enter')

    // Verify navigation completed
    await expect(page).toHaveURL(/\/r\/cats$/)
    await expect(
      page.getByRole('heading', {level: 1, name: 'Posts from r/cats'})
    ).toBeVisible()
  })

  test('ARIA labels and semantic structure', async ({page}) => {
    await page.goto('/')

    // Verify search input accessibility
    const searchInput = page.getByRole('textbox', {name: 'Search subreddits'})
    await expect(searchInput).toHaveAttribute('aria-label', 'Search subreddits')

    // Test search results structure
    await searchInput.fill('cats')
    const searchResults = page.locator('[role="listbox"], [role="list"]')
    await expect(searchResults).toBeVisible()

    // Verify options have proper roles
    await expect(page.getByRole('option').first()).toBeVisible()

    // Check settings button accessibility
    const settingsButton = page.getByTestId('settings-button')
    await expect(settingsButton).toHaveAttribute('aria-label')
  })

  test('Focus management and escape key handling', async ({page}) => {
    await page.goto('/')

    const searchInput = page.getByRole('textbox', {name: 'Search subreddits'})

    // Focus and interact with search
    await searchInput.focus()
    await expect(searchInput).toBeFocused()
    await searchInput.fill('cats')

    // Verify search results are announced
    await expect(page.getByRole('option').first()).toBeVisible()

    // Test Escape key behavior
    await page.keyboard.press('Escape')
    await expect(searchInput).toBeFocused()
  })

  test('Settings modal keyboard accessibility', async ({page}) => {
    await page.goto('/')

    // Open settings with keyboard
    const settingsButton = page.getByTestId('settings-button')
    await settingsButton.focus()
    await page.keyboard.press('Enter')

    // Test focus management within modal
    const darkModeSwitch = page.getByRole('switch', {name: 'Toggle Dark Mode'})
    await expect(darkModeSwitch).toBeVisible()

    // Test keyboard interaction with switch
    await darkModeSwitch.focus()
    await page.keyboard.press('Space')
    await expect(darkModeSwitch).toBeChecked()

    // Test Tab navigation
    await page.keyboard.press('Tab')
    const muteSwitch = page.getByRole('switch', {name: 'Toggle Mute'})
    await expect(muteSwitch).toBeFocused()

    // Test modal dismissal with Escape
    await page.keyboard.press('Escape')
    await expect(settingsButton).toBeFocused()
  })

  test('Page navigation announces correctly to screen readers', async ({
    page
  }) => {
    await page.goto('/')

    // Check initial page title
    await expect(page).toHaveTitle(/Home/)

    // Navigate to subreddit
    const searchInput = page.getByRole('textbox', {name: 'Search subreddits'})
    await searchInput.fill('cats')
    await page.getByRole('option', {name: /r\/cats/i}).click()

    // Verify title updates for screen readers
    await expect(page).toHaveTitle(/cats/)

    // Check heading structure for screen readers
    const mainHeading = page.getByRole('heading', {level: 1})
    await expect(mainHeading).toBeVisible()
  })

  test('Visual accessibility on mobile viewport', async ({page}) => {
    // Test mobile accessibility specifically (69% of your traffic)
    await page.setViewportSize({width: 375, height: 667})
    await page.goto('/r/cats')

    // Verify main content is accessible on mobile
    const mainContent = page.getByTestId('posts-container')
    await expect(mainContent).toBeVisible()

    // Check interactive elements are accessible
    const sortingRadios = page.getByRole('radio')
    await expect(sortingRadios.first()).toBeVisible()

    // Verify text is readable
    const postTitle = page.getByRole('heading', {level: 2})
    await expect(postTitle).toBeVisible()

    // Test focus indicators on mobile
    await sortingRadios.first().focus()
  })
})