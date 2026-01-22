# Contributing Guide

Welcome! 👋 This guide will help you contribute to Viewer for Reddit, whether you're fixing a bug, adding a feature, or improving documentation.

## Table of Contents

- [Quick Start](#quick-start)
- [Development Workflow](#development-workflow)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Development](#development)
  - [Quality Gates](#quality-gates)
  - [Pre-commit Hooks](#pre-commit-hooks)
- [Project Architecture](#project-architecture)
  - [Tech Stack](#tech-stack)
  - [Architecture Overview](#architecture-overview)
  - [File Structure](#file-structure)
  - [Core Patterns](#core-patterns)
- [Testing](#testing)
  - [Test-Driven Development](#test-driven-development)
  - [Running Tests](#running-tests)
  - [MSW v2 HTTP Mocking](#msw-v2-http-mocking)
  - [Writing Tests](#writing-tests)
- [Reddit API Integration](#reddit-api-integration)
  - [Authentication Setup](#authentication-setup)
  - [Type Generation System](#type-generation-system)
- [Code Review Process](#code-review-process)
- [Getting Help](#getting-help)
- [Legal](#legal)

---

## Quick Start

**New to the project?** Start here! ⚡

1. **Fork and clone** the repository
2. **Install dependencies**: `npm install`
3. **Set up environment**: `cp .env.example .env` and add your Reddit API credentials
4. **Start development**: `npm run dev`
5. **Open**: <http://localhost:3000>

That's it! You're ready to start contributing. 🎉

---

## Development Workflow

### Prerequisites

- **Node.js v24.11+** (see `.nvmrc`)
- **npm v10+**
- **Git**
- **Reddit API credentials** (see [Authentication Setup](#authentication-setup))

### Setup

```bash
# Clone your fork
git clone https://github.com/gregrickaby/viewer-for-reddit.git
cd viewer-for-reddit

# Install dependencies
nvm use && npm install

# Copy environment template
cp .env.example .env
```

**Environment Variables:**

Add your Reddit API credentials to `.env`:

```bash
REDDIT_CLIENT_ID="your_client_id_here"
REDDIT_CLIENT_SECRET="your_client_secret_here"
USER_AGENT="your-user-agent-here"
SESSION_SECRET="generate_random_32_char_string"
```

> **Note**: The app will not work without Reddit credentials!

### Development

```bash
# Start development server
npm run dev

# View at http://localhost:3000
# Features: Hot reload, Turbopack, automatic .next cache clearing
```

### Quality Gates

**Required for all code changes** (run in sequence):

```bash
npm run validate      # Format + typecheck + lint (one command)
npm run test          # Vitest unit tests - must pass
```

**Or run individually:**

```bash
npm run format        # Prettier formatting - auto-fixes code style
npm run typecheck     # TypeScript strict checking - must pass
npm run lint          # ESLint - must pass
npm run test:coverage # Run tests with coverage report
```

**For production builds:**

```bash
npm run build         # Production build
npm run start         # Test production build locally
```

### Pre-commit Hooks

This project uses [Lefthook](https://github.com/evilmartians/lefthook) to run quality checks before commits.

**What runs automatically:**

- `npm run format` - Auto-formats your code
- `npm run lint` - Checks for linting errors
- `npm run typecheck` - Validates TypeScript

If any check fails, the commit will be blocked. Fix the issues and try again.

**Skip hooks** (not recommended):

```bash
git commit --no-verify -m "message"
```

---

## Project Architecture

### Tech Stack

- **Framework**: Next.js 16 (App Router, React Compiler, Turbopack)
- **React**: React 19 (Server Components by default)
- **UI**: Mantine v8 component library
- **Styling**: CSS Modules with Mantine design tokens
- **Auth**: Arctic 3.x (OAuth2) + iron-session 8.x (encrypted sessions)
- **Types**: TypeScript 5 (strict mode, never use `any`)
- **Testing**: Vitest v4 + Testing Library + MSW v2
- **API**: Reddit REST API + OAuth 2.0
- **Deployment**: Self-hosted (Coolify/Nixpacks)

### Architecture Overview

Viewer for Reddit uses **modern Next.js 16 patterns** with Server Components as the default rendering strategy.

**Key Principles:**

1. **Server-First** - Server Components by default, Client Components opt-in for interactivity
2. **Server Actions** - All Reddit API calls in `/lib/actions/reddit.ts`
3. **Progressive Enhancement** - Core functionality works without JavaScript
4. **Optimistic Updates** - Immediate UI feedback with rollback on failure
5. **Type Safety** - Auto-generated types from Reddit API

**NOT a layered architecture** - This is a straightforward Next.js app with clear conventions, not a complex architectural pattern.

### File Structure

```text
app/                    # Next.js pages (Server Components by default)
├── api/                # API routes (auth, logging)
├── r/[subreddit]/      # Subreddit pages
├── u/[username]/       # User profile pages
├── search/[query]/     # Search results
└── about/              # About page

components/
├── layout/             # Structural components (Header, Sidebar, AppLayout)
├── ui/                 # Feature components (PostCard, Comment, Gallery)
└── skeletons/          # Loading states (PostSkeleton, TabsSkeleton)

lib/
├── actions/
│   └── reddit.ts       # ALL Reddit API calls (Server Actions)
├── auth/
│   └── session.ts      # Session management (Arctic + iron-session)
├── hooks/              # Custom React hooks (useVote, useInfiniteScroll)
├── types/
│   ├── reddit-api.ts   # Auto-generated (DO NOT EDIT, use npm run typegen)
│   └── reddit.ts       # Manual application types
└── utils/              # Helpers, constants, formatters

scripts/                # Build and codegen scripts
test-utils/             # Test setup and MSW handlers
```

### Core Patterns

#### 1. Server Components by Default

**No `'use client'` needed** - Server Components are the default in React 19.

```typescript
// ✅ CORRECT - Server Component (no directive)
export default async function SubredditPage({params}: PageProps) {
  const {subreddit} = await params // Next.js 16 requirement
  const {posts} = await fetchPosts(subreddit, 'hot')

  return (
    <ErrorBoundary>
      <Suspense fallback={<PostSkeleton />}>
        <PostListWithTabs posts={posts} />
      </Suspense>
    </ErrorBoundary>
  )
}
```

#### 2. Client Components for Interactivity

Add `'use client'` only when needed:

```typescript
// ✅ CORRECT - Client Component for hooks/events
'use client'

export function PostCard({post}: Readonly<PostCardProps>) {
  const {vote, isPending} = useVote({
    itemName: post.name,
    initialScore: post.score
  })

  return <PostActions onVote={vote} disabled={isPending} />
}
```

**When to use Client Components:**

- Need React hooks (useState, useEffect, useTransition)
- Handle user interactions (onClick, onSubmit)
- Access browser APIs (window, document)
- Use context providers/consumers

#### 3. All Reddit API Calls in Server Actions

**CRITICAL:** ALL Reddit API calls MUST be in `/lib/actions/reddit.ts`

```typescript
'use server'

import {REDDIT_API_URL, FIVE_MINUTES} from '@/lib/utils/constants'

export async function fetchPosts(subreddit: string, sort: SortOption) {
  const session = await getSession()
  const headers = await getHeaders(!!session.accessToken)

  const response = await fetch(url, {
    headers,
    next: {revalidate: FIVE_MINUTES}
  })

  if (!response.ok) {
    if (response.status === 401) throw new Error('Authentication expired')
    if (response.status === 404) throw new Error('Subreddit not found')
    if (response.status === 429) throw new Error('Rate limit exceeded')
    throw new Error(`Reddit API error: ${response.statusText}`)
  }

  const data: ApiSubredditPostsResponse = await response.json()
  const posts = data.data?.children?.map((c) => c.data) as RedditPost[]
  return {posts, after: data.data?.after}
}
```

**Why?**

- ✅ Single source of truth
- ✅ Consistent error handling
- ✅ Centralized caching strategy
- ✅ Easy security auditing
- ✅ Testable boundaries

#### 4. Custom Hooks for Client State

**Location:** `lib/hooks/`

```typescript
export function useVote({itemName, initialScore}: UseVoteOptions) {
  const [isPending, startTransition] = useTransition()
  const [score, setScore] = useState(initialScore)

  const vote = (direction: 1 | -1) => {
    if (isPending) return // CRITICAL: Race condition prevention

    const currentScore = score
    setScore(score + direction) // Optimistic update

    startTransition(async () => {
      const result = await votePost(itemName, direction)
      if (!result.success) {
        setScore(currentScore) // Rollback on failure
      }
    })
  }

  return {score, isPending, vote}
}
```

**Patterns:**

- **Optimistic updates** - Immediate UI feedback, rollback on failure
- **Race condition prevention** - Always check `if (isPending) return`
- **Server action calls** - Hooks call actions, not direct fetch

#### 5. Critical Conventions

**Arctic OAuth Tokens (Methods, Not Properties):**

```typescript
// ❌ WRONG - Property access
const token = tokens.accessToken

// ✅ CORRECT - Method call
const token = tokens.accessToken()
```

**HTML Sanitization (Security):**

```typescript
import DOMPurify from 'isomorphic-dompurify'
import {decodeHtmlEntities} from '@/lib/utils/formatters'

// ✅ CORRECT
<div
  dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(decodeHtmlEntities(post.selftext_html))
  }}
/>
```

**Mantine UI Integration:**

```typescript
import {Anchor} from '@mantine/core'
import Link from 'next/link'

// ✅ CORRECT - Wrap Next.js Link with Mantine Anchor
<Anchor component={Link} href="/path" c="blue" fw={500}>
  Link text
</Anchor>
```

---

## Testing

### Test-Driven Development

This is a **test-driven codebase**. Tests must be written/updated alongside code changes.

**Coverage Requirements:**

- **Utilities**: 100% coverage required
- **Hooks**: 100% coverage required
- **Components**: 80%+ coverage required

**Testing Philosophy:**

- Write tests for control flow, not implementation details
- Use `it.each()` loops to minimize duplication
- Don't create superfluous tests that don't add value
- Focus on user behavior and edge cases

### Running Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode (for development)
npm run test:watch

# UI mode (interactive)
npm run test:ui

# Run specific test file
npx vitest path/to/file.test.ts --run
```

### MSW v2 HTTP Mocking

**🚨 CRITICAL: Always use MSW v2 for HTTP mocking. NEVER mock `global.fetch`.**

**Global Setup** (handled in `vitest.setup.ts`):

- `beforeAll`: `server.listen()` - starts MSW server
- `afterEach`: `server.resetHandlers()` - resets to default handlers
- `afterAll`: `server.close()` - shuts down server

**Pre-configured Handlers** (in `test-utils/msw/handlers/`):

- `postsHandlers.ts` - Subreddit posts endpoints
- `commentHandlers.ts` - Post comments endpoints
- `userHandlers.ts` - User profile and content endpoints
- `voteHandlers.ts` - Vote endpoints
- `authHandlers.ts` - Authentication endpoints
- `searchHandlers.ts` - Search endpoints
- `subredditHandlers.ts` - Subreddit info endpoints

### Writing Tests

**Test File Pattern:**

```typescript
import {describe, expect, it, vi, beforeEach} from 'vitest'
import {renderHook, waitFor, act} from '@/test-utils'
import {useVote} from './useVote'
import {votePost} from '@/lib/actions/reddit'

// Mock server actions to avoid env var errors
vi.mock('@/lib/actions/reddit', () => ({
  votePost: vi.fn(async () => ({success: true}))
}))

const mockVotePost = vi.mocked(votePost)

describe('useVote', () => {
  beforeEach(() => {
    mockVotePost.mockClear()
  })

  it('initializes with correct values', () => {
    const {result} = renderHook(() =>
      useVote({
        itemName: 't3_test123',
        initialScore: 100
      })
    )

    expect(result.current.score).toBe(100)
    expect(result.current.isPending).toBe(false)
  })

  it('performs optimistic update', async () => {
    const {result} = renderHook(() =>
      useVote({
        itemName: 't3_test123',
        initialScore: 100
      })
    )

    act(() => {
      result.current.vote(1)
    })

    // Optimistic update happens immediately
    expect(result.current.score).toBe(101)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockVotePost).toHaveBeenCalledWith('t3_test123', 1)
  })
})
```

**Key Patterns:**

- Mock server actions with `vi.mock()` to avoid env var errors
- Use `act()` for state updates
- Use `waitFor()` for async operations
- Test optimistic updates + rollbacks
- Test race conditions (`if (isPending) return`)

**For integration tests with MSW:**

```typescript
import {server} from '@/test-utils/msw/server'
import {http, HttpResponse} from 'msw'

it('handles 404 error', async () => {
  server.use(
    http.get('https://oauth.reddit.com/r/:subreddit/hot.json', () => {
      return new HttpResponse(null, {status: 404})
    })
  )

  const result = await fetchPosts('nonexistent', 'hot')
  expect(result.error).toBe('Subreddit not found')
})
```

---

## Reddit API Integration

### Authentication Setup

The app uses **Reddit OAuth 2.0** for API access.

**Creating Reddit App:**

1. **Visit**: <https://www.reddit.com/prefs/apps>
2. **Create new app**:
   - **Name**: `reddit-viewer` (or your app name)
   - **Type**: `web app`
   - **Description**: `A Reddit viewing web app`
   - **About URL**: `https://your-domain.com`
   - **Redirect URI**: `https://your-domain.com/api/auth/callback/reddit`
3. **Copy credentials** to your `.env` file

**Local Development:**

For localhost, use:

- **Redirect URI**: `http://localhost:3000/api/auth/callback/reddit`

**Multi-Environment Setup:**

The app supports OAuth across:

- **Production**: `https://reddit-viewer.com`
- **Preview Deployments**: `https://[pr-id].reddit-viewer.com`
- **Local Development**: `http://localhost:3000`

### Type Generation System

**Why?** Automatically generates TypeScript types from live Reddit API responses instead of manually maintaining types.

**Quick Usage:**

```bash
# Generate everything (fetch + validate)
npm run typegen

# Or step by step:
npm run typegen:fetch     # Fetch samples from Reddit API
npm run typegen:types     # Generate TypeScript types from OpenAPI
npm run typegen:validate  # Validate OpenAPI spec with Redocly
```

**What It Does:**

1. **Discovers endpoints** - Finds real post IDs and usernames from Reddit
2. **Fetches samples** - Gets live data from 6+ Reddit endpoints
3. **Infers schemas** - Analyzes JSON to create accurate type definitions
4. **Generates OpenAPI 3.1.1** - Creates complete API specification
5. **Creates TypeScript** - Generates `lib/types/reddit-api.ts` (2,376+ lines)
6. **Validates spec** - Ensures quality with Redocly CLI

**Generated Files:**

- `lib/types/reddit-api.ts` - **Main types file** (DO NOT EDIT manually)
- `scripts/reddit-openapi.json` - OpenAPI 3.1.1 spec

**Endpoints Covered:**

- Subreddit posts (`/r/{subreddit}/hot.json`)
- Post comments (`/r/{subreddit}/comments/{id}.json`)
- User profiles (`/user/{username}/about.json`)
- Subreddit info (`/r/{subreddit}/about.json`)
- Search (`/subreddits/search.json`)
- Popular (`/subreddits/popular.json`)

---

## Code Review Process

Before submitting a pull request:

1. **Run quality gates**: `npm run validate`
2. **Run tests**: `npm run test:coverage`
3. **Test authenticated state**: Log in and test features
4. **Test unauthenticated state**: Log out and verify graceful degradation
5. **Check browser console**: No errors or warnings
6. **Test mobile**: Verify responsive layout

**Review Checklist:**

- [ ] All tests pass
- [ ] Test coverage meets requirements (utilities/hooks 100%, components 80%+)
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Code follows project conventions (see `.github/instructions/code-standards.instructions.md`)
- [ ] Server Actions use Next.js fetch with `next: {revalidate}` for caching
- [ ] Error messages are specific by HTTP status
- [ ] HTML sanitized with `DOMPurify.sanitize()`
- [ ] Race conditions prevented (`if (isPending) return`)
- [ ] Props use `Readonly<>` wrapper

---

## Getting Help

### Resources

- **Issues**: [GitHub Issues](https://github.com/gregrickaby/viewer-for-reddit/issues) - Bug reports and feature requests
- **Discussions**: [GitHub Discussions](https://github.com/gregrickaby/viewer-for-reddit/discussions) - Questions and community
- **Reddit API**: [Official Documentation](https://www.reddit.com/dev/api/) - API reference
- **Mantine**: [Documentation](https://mantine.dev/) - UI component library
- **Next.js**: [Documentation](https://nextjs.org/docs) - Framework documentation

### Before You Ask

1. **Search existing issues** and discussions
2. **Check the documentation** in this file and `.github/instructions/`
3. **Try reproducing** the issue locally
4. **Review recent changes** in the Git history

### Reporting Issues

**Good issue reports include:**

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, npm version)
- Screenshots/logs if applicable
- Relevant code snippets

---

## Legal

This repository is maintained by [Greg Rickaby](https://gregrickaby.com/). By contributing code, you agree to license your contributions under the [MIT License](https://github.com/gregrickaby/viewer-for-reddit/blob/main/LICENSE).

_Viewer for Reddit is an independent side project and is not affiliated with, endorsed by, or sponsored by Reddit, Inc. "Reddit" and the Snoo logo are trademarks of Reddit, Inc., used in accordance with their [brand guidelines](https://redditinc.com/brand). The app developer and contributors endeavor to comply with Reddit's [API terms](https://redditinc.com/policies/data-api-terms), [Developer Platform policies](https://support.reddithelp.com/hc/en-us/articles/14945211791892-Developer-Platform-Accessing-Reddit-Data) and [API documentation](https://www.reddit.com/dev/api/)._
