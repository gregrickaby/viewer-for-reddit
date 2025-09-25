# Copilot Instructions for Viewer for Reddit

**ALWAYS follow these instructions first and fallback to additional search and context gathering ONLY if the information in these instructions is incomplete or found to be in error.**

## Working Effectively

**CRITICAL: NEVER CANCEL any build or test commands. Set explicit timeouts and wait for completion.**

### Agent Loop Prevention

**STOP CONDITIONS - Bail out early if:**

- You've made 3+ attempts at the same fix without success
- You're repeating the same tool calls or getting identical error messages
- A command has been running for longer than expected timeout (see timing reference below)
- You cannot find the information needed after 2-3 targeted searches
- The user's request requires information not available in the current workspace

**When to ask for help:**

- If you're unsure about project-specific patterns after reading the instructions
- If you need clarification on requirements rather than continuing to guess
- If you encounter errors that aren't covered in the troubleshooting section below

### Error Recovery and Debugging

- **If commands fail unexpectedly**:
  - Check Node version with `node --version` (should be v22)
  - Clear caches: `rm -rf .next node_modules package-lock.json && npm install`
  - For test failures, check MSW handlers in `test-utils/msw/` before debugging components

- **Common error patterns**:
  - TypeScript errors: Run `npx tsc --noEmit` for detailed diagnostics
  - Test flakiness: Usually caused by shared state - ensure `userEvent.setup()` per test
  - Build failures: Switch to development mode if in restricted network environment

### Bootstrap and Development Setup

1. **Environment Requirements**: Use Node v22 and npm v11 (see `.nvmrc`)
2. **Install dependencies**:

   ```bash
   npm install
   ```

   - Takes ~31 seconds. Set timeout to 60+ seconds.

3. **Setup environment**:

   ```bash
   cp .env.example .env
   ```

   - For Reddit API functionality, configure `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` from https://www.reddit.com/prefs/apps

### Development Workflow

- **Start development server**:

  ```bash
  npm run dev
  ```

  - Uses Turbo mode, clears `.next/` cache
  - Ready in ~1 second at http://localhost:3000
  - NEVER CANCEL: Let server start completely

### Testing and Quality Assurance

- **Run tests**:

  ```bash
  npx vitest ComponentName # Single component, watch mode
  npm test        # Single run of full suite
  npm run coverage # Coverage report
  ```

  - Takes ~38 seconds for full test suite. NEVER CANCEL - set timeout to 60+ seconds.
  - Achieves 90%+ coverage across control flow (skip hard-to-cover edge cases)
  - Uses MSW v2 for API mocking in handlers.ts. Never mock fetch or RTK queries directly.

- **Run linting**:

  ```bash
  npm run lint
  ```

  - Takes ~3 seconds. Includes ESLint + Prettier
  - ALWAYS run before committing changes

- **Format code**:

  ```bash
  npm run format
  ```

  - Formats all JS/TS/CSS/MD files with Prettier

### Build Process

- **Production build**:

  ```bash
  npm run build
  ```

  - **KNOWN LIMITATION**: Build fails in restricted network environments due to Google Fonts (fonts.googleapis.com) access requirement
  - **WORKAROUND**: Build works in environments with internet access
  - **VALIDATION**: Application runs correctly in development mode without build

## Validation Scenarios

**ALWAYS perform these validation steps after making changes:**

1. **Lint validation**:
   - Run `npm run lint` - must complete with no errors
   - CI will fail if linting errors exist

2. **TypeScript validation**:
   - Run `npx tsc --noEmit` - must complete with no errors

3. **Test validation**:
   - Run `npm run test` and ensure 90%+ coverage maintained
   - All tests must pass - no exceptions
   - Skip edge cases that are difficult to cover or test

4. **Development server validation**:
   - Start `npm run dev` and verify app loads at http://localhost:3000
   - Test core functionality: search, subreddit navigation, post viewing

## Architecture Overview

This is a **Next.js 15 + React 19** Reddit viewer app using the **App Router** with:

- **Mantine v8** for UI components and hooks (see documentation url https://mantine.dev/llms.txt)
- **Redux Toolkit Query (RTK)** for Reddit API state management and data fetching
- **TypeScript** with strict settings. Never use `any` and non-null assertions
- **Auto-generated types** from Reddit API using OpenAPI schema and `openapi-typescript`. To generate, run `npm run codegen:types`. Never write types manually for API data.
- **Next.js Server Actions** for server-side logic (Reddit OAuth token management)
- **Reddit REST-API v2** for fetching posts, comments, subreddits (see documentation url https://www.reddit.com/dev/api/)
- **Reddit OAuth 2.0** application-only authentication (read-only)
- **CSS Modules** for styling
- **Vitest v3 + React Testing Library + MSW v2** for testing

Key data flow: Reddit API ← RTK Query ← Components ← Redux Store (settings/UI state)

## Project Structure Patterns

- `app/(default)/` - App Router pages with grouped layout
- `app/api/reddit` - Route handler for Reddit OAuth to avoid CORS issues
- `components/` - One component per folder with Component.tsx, Component.module.css, Component.test.tsx
- `lib/actions/` - Server actions (Reddit OAuth token management)
- `lib/hooks/` - Custom React hooks (business logic, intersection observers, infinite scroll)
- `lib/store/` - Redux store with RTK Query services and slices
- `lib/types/index.ts` - Global types
- `lib/types/reddit-api.ts` - Auto-generated Reddit API types (do not edit manually. Run `npm run codegen:types`)
- `lib/utils/` - Pure utility functions
- `test-utils/` - Custom render functions with custom renderers and MSW handlers and mocks

## Component Conventions

- **Named exports only** - no default exports for components
- **Function components** with explicit Props interfaces. Components should be presentational and business logic should be in hooks.
- **CSS Modules** (`Component.module.css`)
- **One component per file** - split large components into separate files
- **Hooks for logic** - Businesss logic, data fetching, and state management should be in custom hooks

Example component structure:

```tsx
interface ComponentProps {
  // Required props first, then optional
  src: string
  alt?: string
}

export function Component({src, alt = ''}: Readonly<ComponentProps>) {
  const {data, isLoading} = useCustomHook()
  return <div className={classes.wrapper}>...</div>
}
```

## Testing Patterns

- Never mock Redux, always use preloaded state in tests
- Use `render()` and `renderHook()` from `@/test-utils` (includes Redux store)
- Use MSW v2 for API mocking - verify the global server setup exists, if not, add it. Use local handlers for specific test cases.
- Name tests: `it('should behavior when condition')`
- Use `userEvent.setup()` per test to avoid shared state
- Target **90%+ coverage** of control flow, not edge cases. Skip hard-to-cover edge cases.
- Never assert the `logError()` structured data, only verify it was called like `expect(logError).toHaveBeenCalled()`
- Never assert toast notification content. Instead, just verify that a toast was shown like `expect(showNotification).toHaveBeenCalled()`

### Example Test

```tsx
import BackToTop from '@/components/BackToTop/BackToTop'
import {render, screen} from '@/test-utils'
import userEvent from '@testing-library/user-event'

const {scrollRef, scrollToMock} = vi.hoisted(() => ({
  scrollRef: {y: 0},
  scrollToMock: vi.fn()
}))

vi.mock('@mantine/hooks', () => ({
  useWindowScroll: () => [scrollRef, scrollToMock]
}))

describe('BackToTop', () => {
  beforeEach(() => {
    scrollRef.y = 0
    scrollToMock.mockClear()
  })

  it('should not render when scrolled less than or equal to 200', () => {
    scrollRef.y = 100
    render(<BackToTop />)
    expect(
      screen.queryByRole('button', {name: 'Go back to the top of the page'})
    ).not.toBeInTheDocument()
  })

  it('should render button and scrolls to top when clicked', async () => {
    scrollRef.y = 250
    render(<BackToTop />)
    const button = screen.getByRole('button', {
      name: 'Go back to the top of the page'
    })
    await userEvent.click(button)
    expect(scrollToMock).toHaveBeenCalledWith({y: 0})
  })
})
```

## Redux/API Architecture

**Store setup**:

- `redditApi` service handles all Reddit endpoints with OAuth
- `settingsSlice` for user preferences (NSFW, search history, favorites, mute audio)
- `transientSlice` for ephemeral UI state

**Key endpoints**:

- `searchSubreddits` - autocomplete search
- `getSubredditPosts` - subreddit posts
- `getSubredditAbout` - subreddit details
- `getPopularSubreddits` - trending subreddits
- `getPostComments` - fetch comments for a post

**Authentication**: Server-side token caching in `lib/actions/redditToken.ts` with automatic rotation

## App Router Specifics

- Use `generateMetadata()` for SEO on static pages
- Server actions in `lib/actions/` for Reddit API calls
- Client components marked with `'use client'`
- Grouped layouts: `app/(default)/layout.tsx` contains AppShell

## Media Handling

- `ResponsiveImage` with lazy loading and viewport detection
- `YouTubePlayer` with intersection observer for performance
- `HlsPlayer` for video streaming skinned with Media Chrome
- All media cached via `lib/utils/mediaCache.ts`

## Environment Variables

Required for Reddit API:

- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`

## Common Gotchas

- Import paths use `@/` alias for project root
- Mantine components require proper setup in app layout
- Reddit API requires User-Agent header (set in config)
- CSS Modules classes imported as `classes.className`
- Test files must use MSW for network calls, not fetch mocks
- Build requires internet access for Google Fonts - use development mode in restricted environments
- Always use `userEvent.setup()` per test to avoid flaky tests
- Never edit `lib/types/reddit-api.ts` manually - it's auto-generated
- RTK Query hooks automatically handle loading states and caching

## NPM Commands and Timing Reference

**List of available NPM commands and measured timings with appropriate timeout recommendations:**

- `npm install`: ~31 seconds → timeout: 60+ seconds
- `npm run lint`: ~3 seconds → timeout: 30+ seconds
- `npm run test`: ~38 seconds → timeout: 60+ seconds
- `npm run coverage`: ~40 seconds → timeout: 60+ seconds
- `npm run dev`: ~1 second startup → timeout: 30+ seconds
- `npm run build`: Fails in restricted networks → use development mode instead
- `npm run codegen`: ~30 seconds → timeout: 60+ seconds

**NEVER CANCEL these commands - always wait for completion with adequate timeouts.**

## Branching and Commit Guidelines

**Branch naming convention**: Use format `ticket-number-issue-title` (e.g., `614-view-user-profiles`)

**Commit message format**: Use imperative mood, e.g., "Add user profile component"
