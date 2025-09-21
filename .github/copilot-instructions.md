# Copilot Instructions for Viewer for Reddit

**ALWAYS follow these instructions first and fallback to additional search and context gathering ONLY if the information in these instructions is incomplete or found to be in error.**

## Working Effectively

**CRITICAL: NEVER CANCEL any build or test commands. Set explicit timeouts and wait for completion.**

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
  - Achieves 100% coverage across all control flow
  - Uses MSW v2 for API mocking

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

1. **Development server validation**:
   - Run `npm run dev`
   - Navigate to http://localhost:3000
   - Verify application loads with header, search box, and Reddit logo
   - Search functionality should show "Unable to load posts from Reddit" if API credentials not configured (this is expected behavior)

2. **Test validation**:
   - Run `npm test` and ensure 100% coverage maintained
   - All tests must pass - no exceptions

3. **Lint validation**:
   - Run `npm run lint` - must complete with no errors
   - CI will fail if linting errors exist

## Architecture Overview

This is a **Next.js 15 + React 19** Reddit viewer app using the **App Router** with:

- **Mantine v8** for UI components and hooks (see documentation url https://mantine.dev/llms.txt)
- **Redux Toolkit Query (RTK)** for Reddit API state management and data fetching
- **TypeScript** with strict settings
- **Next.js Server Actions** for server-side logic (Reddit OAuth token management)
- **Reddit REST-API v2** for fetching posts, comments, subreddits (see documentation url https://www.reddit.com/dev/api/)
- **Reddit OAuth 2.0** application-only authentication (read-only)
- **CSS Modules** for styling
- **Vitest v3 + React Testing Library + MSW v2** for testing

Key data flow: Reddit API ← RTK Query ← Components ← Redux Store (settings/UI state)

## Project Structure Patterns

- `app/(default)/` - App Router pages with grouped layout
- `components/` - One component per folder with Component.tsx, Component.module.css, Component.test.tsx
- `lib/actions/` - Server actions (Reddit OAuth token management)
- `lib/hooks/` - Custom React hooks (business logic, intersection observers, infinite scroll)
- `lib/store/` - Redux store with RTK Query services and slices
- `lib/utils/` - Pure utility functions
- `test-utils/` - Custom render functions with Redux/MSW setup

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

- Use `render()` and `renderHook()` from `@/test-utils` (includes Redux store)
- **MSW v2** for API mocking - assume global server setup exists
- Name tests: `it('should behavior when condition')`
- Use `userEvent.setup()` per test to avoid shared state
- Target **100% coverage** of control flow, not edge cases
- Never mock Redux, always use preloaded state in tests

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

## Command Timing Reference

**Measured timings with appropriate timeout recommendations:**

- `npm install`: ~31 seconds → timeout: 60+ seconds
- `npm run lint`: ~3 seconds → timeout: 30+ seconds
- `npm test`: ~38 seconds → timeout: 60+ seconds
- `npm run dev`: ~1 second startup → timeout: 30+ seconds
- `npm run build`: Fails in restricted networks → use development mode instead

**NEVER CANCEL these commands - always wait for completion with adequate timeouts.**
