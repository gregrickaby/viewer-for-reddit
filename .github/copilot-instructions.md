# Copilot Instructions for Viewer for Reddit

## Architecture Overview

This is a **Next.js 15 + React 19** Reddit viewer app using the **App Router** with:

- **Mantine v8** for UI components and hooks
- **Redux Toolkit Query (RTK)** for Reddit API state management and data fetching
- **TypeScript** with strict settings
- **Next.js Server Actions** for server-side logic (Reddit OAuth token management)
- **Reddit REST-API v2** for fetching posts, comments, subreddits
- **Reddit OAuth 2.0** application-only authentication (read-only)
- **CSS Modules** for styling
- **Vitest + React Testing Library + MSW v2** for testing

Key data flow: Reddit API ← RTK Query ← Components ← Redux Store (settings/UI state)

## Project Structure Patterns

- `app/(default)/` - App Router pages with grouped layout
- `components/` - One component per folder with Component.tsx, Component.module.css, Component.test.tsx
- `lib/actions/` - Server actions (Reddit OAuth token management)
- `lib/hooks/` - Custom React hooks (intersection observers, infinite scroll)
- `lib/store/` - Redux store with RTK Query services and slices
- `lib/utils/` - Pure utility functions
- `test-utils/` - Custom render functions with Redux/MSW setup

## Critical Workflows

**Development**: `npm run dev` (uses Turbo mode, clears .next)
**Testing**: `npm test` (Vitest watch mode), `npm run coverage` (with HTML reports)
**Dependencies**: Use `ncu -u && npm i` to update packages

## Component Conventions (from AGENTS.md)

- **Named exports only** - no default exports for components
- **Function components** with explicit Props interfaces
- **CSS Modules** (`Component.module.css`)
- **One component per file** - split large components into separate files
- **Hooks for logic** - components should be presentational

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
- `settingsSlice` for user preferences (NSFW, layout)
- `transientSlice` for ephemeral UI state

**Key endpoints**:

- `getSubredditPostsInfinite` - paginated posts with NSFW filtering
- `searchSubreddits` - autocomplete search
- `getPopularSubreddits` - trending subreddits

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
