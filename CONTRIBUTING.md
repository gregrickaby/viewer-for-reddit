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

- **Node.js v24.13+** (see `.nvmrc`)
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

> **📚 For detailed technical patterns, see [`.github/instructions/`](.github/instructions/)**
>
> - **Code Standards**: [code-standards.instructions.md](.github/instructions/code-standards.instructions.md)
> - **Testing Patterns**: [testing-standards.instructions.md](.github/instructions/testing-standards.instructions.md)
> - **Reddit API Guide**: [reddit-api.instructions.md](.github/instructions/reddit-api.instructions.md)
> - **Code Review Checklist**: [code-review.instructions.md](.github/instructions/code-review.instructions.md)

### Tech Stack

- **Framework**: Next.js 16 (App Router, React Compiler, Turbopack)
- **React**: React 19 (Server Components by default)
- **UI**: Mantine v8 component library
- **Auth**: Arctic 3.x (OAuth2) + iron-session 8.x (encrypted sessions)
- **Types**: TypeScript 5 (strict mode, auto-generated from Reddit API)
- **Testing**: Vitest v4 + Testing Library + MSW v2
- **API**: Reddit REST API + OAuth 2.0

### Key Principles

1. **Server-First** - Server Components by default, Client Components opt-in
2. **All API Calls in Server Actions** - Single source in `/lib/actions/reddit.ts`
3. **Optimistic Updates** - Immediate UI feedback with rollback on failure
4. **Type Safety** - Auto-generated types from Reddit API
5. **Test-Driven** - Tests required (utilities/hooks 100%, components 80%+)

### Quick File Organization

```text
app/                    # Next.js pages (Server Components)
components/             # UI components (layout/, ui/, skeletons/)
lib/
├── actions/reddit.ts   # ALL Reddit API calls here
├── auth/session.ts     # Session management
├── hooks/              # Custom React hooks
├── types/              # TypeScript types
└── utils/              # Helpers, constants, formatters
test-utils/             # Test setup and MSW handlers
```

**📖 See [code-standards.instructions.md](.github/instructions/code-standards.instructions.md) for complete architecture details.**

### Critical Conventions

**🚨 Before writing code, review these:**

1. **Arctic OAuth**: Use `tokens.accessToken()` (method, not property)
2. **Server Actions**: All Reddit API calls in `/lib/actions/reddit.ts`
3. **HTML Sanitization**: Always use `sanitizeText()` for user-generated HTML
4. **Race Conditions**: Always check `if (isPending) return` before async operations
5. **Mantine Links**: Wrap Next.js `<Link>` with Mantine `<Anchor component={Link}>`
6. **Props**: Use `Readonly<>` wrapper on all component props
7. **No `NEXT_PUBLIC_`**: All environment variables are server-only

**📖 See [code-standards.instructions.md](.github/instructions/code-standards.instructions.md) for code examples.**

---

## Testing

> **📚 For comprehensive test patterns, see [testing-standards.instructions.md](.github/instructions/testing-standards.instructions.md)**

### Test-Driven Development

This is a **test-driven codebase**. Tests must be written/updated alongside code changes.

**Coverage Requirements:**

- **Utilities**: 100% coverage required
- **Hooks**: 100% coverage required
- **Components**: 80%+ coverage required

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

### Testing Quick Reference

**🚨 CRITICAL Rules:**

- **Always use MSW v2** for HTTP mocking (NEVER mock `global.fetch`)
- **Mock server actions** with `vi.mock()` to avoid env var errors
- **Place `vi.mock()` BEFORE imports** for load-time dependencies
- **Never test CSS** values or CSS variables
- **Test files colocated** with source files (`.test.ts` or `.test.tsx`)

**Key Patterns:**

- Use `act()` for state updates
- Use `waitFor()` for async operations
- Test optimistic updates + rollbacks
- Test race conditions (`if (isPending) return`)

**Example Test Structure:**

```typescript
import {describe, expect, it, vi} from 'vitest'
import {renderHook, waitFor, act} from '@/test-utils'
import {useVote} from './useVote'
import {votePost} from '@/lib/actions/reddit'

// Mock server actions to avoid env var errors
vi.mock('@/lib/actions/reddit', () => ({
  votePost: vi.fn(async () => ({success: true}))
}))

describe('useVote', () => {
  it('performs optimistic update', async () => {
    const {result} = renderHook(() =>
      useVote({itemName: 't3_123', initialScore: 100})
    )

    act(() => result.current.vote(1))
    expect(result.current.score).toBe(101) // Optimistic

    await waitFor(() => expect(result.current.isPending).toBe(false))
  })
})
```

**📖 For complete testing patterns, MSW handlers, and examples, see [testing-standards.instructions.md](.github/instructions/testing-standards.instructions.md)**

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

> **📚 For complete review checklist, see [code-review.instructions.md](.github/instructions/code-review.instructions.md)**

### Before Submitting a Pull Request

**Required Steps:**

1. ✅ **Run quality gates**: `npm run validate` (format + typecheck + lint)
2. ✅ **Run tests with coverage**: `npm run test:coverage`
3. ✅ **Test authenticated state**: Log in and test your changes
4. ✅ **Test unauthenticated state**: Log out and verify graceful degradation
5. ✅ **Check browser console**: No errors or warnings
6. ✅ **Test mobile**: Verify responsive layout

### Quick Review Checklist

**Critical Items:**

- [ ] All tests pass with required coverage (utilities/hooks 100%, components 80%+)
- [ ] `npm run validate` passes (format, typecheck, lint)
- [ ] No TypeScript errors or ESLint warnings
- [ ] Arctic OAuth uses methods: `tokens.accessToken()` not `.accessToken`
- [ ] HTML sanitized with `sanitizeText()` before rendering
- [ ] Race conditions prevented with `if (isPending) return`
- [ ] Server Actions in `/lib/actions/reddit.ts` use `next: {revalidate}`
- [ ] Error messages specific by HTTP status (401, 404, 429, etc.)
- [ ] Props use `Readonly<>` wrapper
- [ ] Mantine `<Anchor component={Link}>` wraps Next.js `<Link>`

**📖 For complete P1/P2/P3 review criteria, see [code-review.instructions.md](.github/instructions/code-review.instructions.md)**

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
