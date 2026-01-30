# GitHub Copilot Instructions for Reddit Viewer

You are an expert full-stack developer working on a Next.js Reddit browsing application that uses test-driven development (TDD).

## Tech Stack

- **Next.js 16** - App Router, Turbopack, React Compiler
- **React 19** - Server Components (default), Client Components ("use client")
- **TypeScript 5** - Strict mode
- **Mantine v8** - UI component library
- **Arctic 3.x** - OAuth2 with Reddit
- **iron-session 8.x** - Encrypted sessions
- **Vitest v4** + **Testing Library** + **MSW v2** - Testing

## Key Commands

```bash
npm run validate      # Format + typecheck + lint + test (REQUIRED before completion)
npm test              # Run tests with coverage report
npm run build         # Production build
npm run typegen       # Generate types from Reddit API
npm run sonar         # Run SonarQube analysis (takes ~6 mins)
```

## Documentation

For detailed guidelines on specific topics, refer to:

- [Code Standards & Architecture](./instructions/code-standards.instructions.md) - Design patterns, conventions
- [Reddit API Patterns](./instructions/reddit-api.instructions.md) - API endpoints, authentication, rate limiting
- [Testing Standards](./instructions/testing-standards.instructions.md) - Vitest, Testing Library, MSW patterns
- [Mantine](https://mantine.dev/llms-full.txt) - UI library patterns and best practices

These specialized instructions apply automatically when editing relevant files via `applyTo` patterns.

## Core Patterns

**Server Components by Default** - No `"use client"` needed. Only add for interactivity (hooks, events, browser APIs).

**All API Calls in Server Actions** - `/lib/actions/reddit.ts` uses Next.js `fetch()` with `next: {revalidate}` for caching and automatic request deduplication.

**Critical Conventions**:

- Arctic OAuth tokens are **methods**: `tokens.accessToken()` NOT `.accessToken` property
- Use `error.tsx` for route-level error boundaries (not manual `<ErrorBoundary>` in pages)
- Use `loading.tsx` for route-level loading states (not manual `<Suspense>` in pages)
- Prevent race conditions: `if (isPending) return` at start of all async handlers
- Sanitize user HTML with `sanitize-html` via `sanitizeText()` before rendering
- Wrap Next.js `<Link>` with Mantine `<Anchor component={Link}>`
- Props typed with `Readonly<>`, avoid `any`
- Never use `NEXT_PUBLIC_` env prefix (all server-side only)
- Never use ENV vars or functions in Client Components
- Always run `npm run validate` before completion

## Project Structure

```
app/                    - Next.js pages (Server Components by default)
lib/actions/reddit.ts   - ALL Reddit API calls (Server Actions)
lib/auth/session.ts     - Session management
lib/types/reddit-api.ts - Auto-generated (DO NOT EDIT, use `npm run typegen`)
lib/types/reddit.ts     - Manual application types
lib/utils/              - Helpers, constants, formatters
components/
  layout/               - Structural components (each in own directory)
    AppLayout/
    Header/
    SearchBar/
    Sidebar/
    UserMenu/
    Logo/
    ThemeProvider/
  ui/                   - Feature components (each in own directory)
    Analytics/
    BackToTop/
    BossButton/
    Comment/
    CommentListWithTabs/
    ErrorBoundary/      - Legacy class-based (only used in global-error.tsx)
    ErrorDisplay/
    Gallery/
    PostActions/
    PostCard/
    PostHeader/
    PostList/
    PostListWithTabs/
    PostMedia/
    SubscribeButton/
    VideoPlayer/
  skeletons/            - Loading states (each in own directory)
    CommentSkeleton/
    PostSkeleton/
    SubredditInfoSkeleton/
    TabsSkeleton/

Note: Pages use Next.js 16 file conventions (error.tsx, loading.tsx) instead of manual wrapping.
```

## Always do

- Run `npm run validate` before declaring task complete

## Never Do

- Access Arctic tokens as properties (use methods: `.accessToken()`)
- Use `NEXT_PUBLIC_` env prefix
- Manually edit `/lib/types/reddit-api.ts`
- Skip `npm run validate` before completion
- Use 'any' type
- Add superfluous comments or tests
- Start dev server (user manages it)

⚠️ **Ask before**: Modifying authentication flow, changing API structure, adding dependencies

Suggest updates to documentation if you find incomplete or conflicting information.
