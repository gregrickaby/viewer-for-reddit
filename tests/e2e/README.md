# E2E Tests for Viewer for Reddit

This directory contains Playwright end-to-end tests that verify the complete user experience from a browser perspective.

## Test Structure

### Files

- `happy-path.spec.ts` - Main user flows (homepage, search, navigation)
- `accessibility.spec.ts` - Accessibility and keyboard navigation tests
- `app.spec.ts` - Existing application tests
- `fixtures/apiMocks.ts` - Mock Reddit API responses for consistent testing

### Test Categories

#### Happy Path Tests (`happy-path.spec.ts`)

Tests the three core user flows:

1. **Homepage Feed Loading** - Verifies homepage loads with posts
2. **Search Functionality** - Tests search bar, popular subreddits, and search results
3. **Subreddit Navigation** - Tests clicking search results to navigate to subreddit pages
4. **Complete User Journey** - End-to-end flow combining all steps
5. **Mobile Compatibility** - Same flows on mobile viewports
6. **Error Recovery** - Handling of edge cases like empty search results

#### Accessibility Tests (`accessibility.spec.ts`)

Tests for inclusive user experience:

1. **Keyboard Navigation** - Tab order, arrow keys, Enter/Space interactions
2. **ARIA Labels** - Screen reader compatibility
3. **Focus Management** - Proper focus during interactions
4. **Settings Modal** - Keyboard accessibility in modal dialogs

## Running Tests

### All E2E Tests

```bash
npm run test:e2e
```

### Specific Test Files

```bash
npx playwright test tests/e2e/happy-path.spec.ts
npx playwright test tests/e2e/accessibility.spec.ts
```

### Debug Mode

```bash
npx playwright test --debug
```

### UI Mode (Interactive)

```bash
npx playwright test --ui
```

## API Mocking

Tests use mocked Reddit API responses via `fixtures/apiMocks.ts`:

- **Popular Subreddits**: Returns r/aww and r/cats
- **Search Results**: Returns cat-related subreddits for "cats" query
- **Posts**: Returns mock posts for any subreddit
- **Edge Cases**: Handles empty results for specific test queries

### Mock Data Structure

```typescript
// Example post response
{
  kind: 'Listing',
  data: {
    children: [{
      kind: 't3',
      data: {
        title: 'Hot post in r/cats',
        author: 'playwright-bot',
        subreddit: 'cats',
        // ... full Reddit post structure
      }
    }]
  }
}
```

## Test Data IDs

Components should include `data-testid` attributes for reliable test selectors:

```tsx
// Preferred selectors (in order of preference)
page.getByRole('button', {name: 'Settings'}) // Most robust
page.getByTestId('settings-button') // Backup option
page.getByText('exact text') // Fragile
page.locator('.css-class') // Avoid
```

## Browser Coverage

Tests run on multiple browsers automatically:

- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: Chrome (Pixel 7), Safari (iPhone 15)

## Common Issues & Solutions

### Timing Issues

```typescript
// Wait for elements before interacting
await expect(element).toBeVisible()
await element.click()

// Use proper waits, not fixed delays
await page.waitForLoadState('networkidle')
```

### Flaky Selectors

```typescript
// Prefer role-based selectors
page.getByRole('textbox', {name: 'Search subreddits'})

// Over fragile text-based ones
page.getByText('Search subreddits')
```

### Mobile Testing

```typescript
// Set viewport for mobile tests
await page.setViewportSize({width: 375, height: 667})
```

## Debugging

### Screenshots & Videos

Failed tests automatically capture:

- Screenshots at failure point
- Video recordings of entire test
- Traces for detailed debugging

### View Traces

```bash
npx playwright show-trace test-results/path/to/trace.zip
```

### Live Debugging

```bash
# Run specific test in headed mode
npx playwright test tests/e2e/happy-path.spec.ts --headed --debug
```

## Contributing

When adding new tests:

1. **Use the existing patterns** from happy-path.spec.ts
2. **Add proper descriptions** that explain the user action being tested
3. **Include accessibility considerations** for new UI elements
4. **Update API mocks** if testing new endpoints
5. **Test on mobile** if the feature affects mobile UX

### Test Naming Convention

```typescript
test('User action: expected outcome', async ({page}) => {
  // Given: Initial state
  // When: User action
  // Then: Expected result
})
```

Example:

```typescript
test('User searches for cats: sees relevant subreddit results', async ({
  page
}) => {
  // Given: User is on homepage
  await page.goto('/')

  // When: User searches for "cats"
  const searchInput = page.getByRole('textbox', {name: 'Search subreddits'})
  await searchInput.fill('cats')

  // Then: Relevant results appear
  await expect(page.getByRole('option', {name: /r\/cats/i})).toBeVisible()
})
```
