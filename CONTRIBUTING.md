# Contributing Guide <!-- omit in toc -->

Welcome! 👋 This guide will help you contribute to Viewer for Reddit, whether you're fixing a bug, adding a feature, or generating types from the Reddit API.

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Quick Start](#quick-start)
- [Development Workflow](#development-workflow)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Development](#development)
  - [Quality Gates](#quality-gates)
  - [Pre-commit Hooks](#pre-commit-hooks)
- [Project Architecture](#project-architecture)
  - [Tech Stack](#tech-stack)
  - [API Architecture](#api-architecture)
    - [Anonymous Mode (Read-Only)](#anonymous-mode-read-only)
    - [Authenticated Mode (Interactive)](#authenticated-mode-interactive)
    - [Key Design Principles](#key-design-principles)
    - [Request Flow](#request-flow)
    - [Security Features](#security-features)
  - [File Structure](#file-structure)
  - [NPM Scripts Reference](#npm-scripts-reference)
- [Testing](#testing)
  - [Test-Driven Development](#test-driven-development)
  - [Running Tests](#running-tests)
  - [MSW v2 HTTP Mocking](#msw-v2-http-mocking)
  - [Writing Tests](#writing-tests)
- [Reddit API Integration](#reddit-api-integration)
  - [Authentication Setup](#authentication-setup)
  - [Type Generation System](#type-generation-system)
- [Advanced Topics](#advanced-topics)
  - [Error Logging System](#error-logging-system)
    - [Critical Rules](#critical-rules)
    - [Server-Side Logging](#server-side-logging)
    - [Client-Side Logging](#client-side-logging)
    - [Context Object Guidelines](#context-object-guidelines)
    - [Allowed Console Usage](#allowed-console-usage)
    - [Mocking in Tests](#mocking-in-tests)
    - [Best Practices](#best-practices)
  - [Codegen Architecture Deep Dive](#codegen-architecture-deep-dive)
- [Getting Help](#getting-help)
  - [Resources](#resources)
  - [Before You Ask](#before-you-ask)
  - [Reporting Issues](#reporting-issues)
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

- **Node.js v22.19+** (see `.nvmrc` and `package.json` engines)
- **npm v10+**
- **Git**
- **Reddit API credentials**

### Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/viewer-for-reddit.git
cd viewer-for-reddit

# Install dependencies
nvm use && npm install

# Copy environment template
cp .env.example .env
```

**Reddit API Setup**:

1. Visit <https://www.reddit.com/prefs/apps>
2. Create a new app (type: `web app`)
3. Set the callback URL to `http://localhost:3000/api/auth/callback/reddit`
4. Add your credentials to `.env`:

```bash
REDDIT_CLIENT_ID="your_client_id_here"
REDDIT_CLIENT_SECRET="your_client_secret_here"
USER_AGENT="your-user-agent-here"
```

> **Note**: The app will not work without Reddit credentials!

### Development

```bash
# Start development server
npm run dev

# View at http://localhost:3000
# Features: Hot reload, Turbo mode, automatic .next cache clearing
```

### Quality Gates

**Required for all code changes** (run in sequence):

```bash
npm run format      # Prettier formatting - auto-fixes code style
npm run lint        # ESLint with Mantine config - must pass
npm run typecheck   # TypeScript strict checking - must pass
npm run test        # Vitest unit tests - must pass
```

**For production builds:**

```bash
npm run build       # Production build
npm run start       # Test production build locally
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

- **Framework**: Next.js 15+ (App Router)
- **UI**: Mantine v8 component library
- **Styling**: CSS Modules with Mantine CSS variables
- **State**: Redux Toolkit with RTK Query
- **Types**: TypeScript (strict mode enabled, never use `any`)
- **Testing**: Vitest + React Testing Library + MSW v2
- **API**: Reddit REST API v2 + OAuth 2.0
- **Deployment**: Self-hosted with Coolify (Nixpacks)
- **CI/CD**: GitHub Actions

### API Architecture

The app uses a **dual-mode API architecture** to separate anonymous and authenticated Reddit requests:

#### Anonymous Mode (Read-Only)

For public Reddit content that doesn't require user authentication:

- **Route**: `/api/reddit`
- **Authentication**: App-level tokens (`client_credentials` flow)
- **Token Source**: `getRedditToken()` server action
- **Use Cases**:
  - Subreddit posts (`/r/{subreddit}`)
  - Post comments
  - User profiles
  - Search results
  - Trending/popular content

**Example:**

```typescript
// In RTK Query service
const postsApi = createApi({
  baseQuery: createRedditBaseQuery('/api/reddit'), // Anonymous
  endpoints: (builder) => ({
    getSubredditPosts: builder.query({
      query: (subreddit) => `/r/${subreddit}/hot.json`
    })
  })
})
```

#### Authenticated Mode (Interactive)

For user-specific content requiring authentication:

- **Route**: `/api/reddit/me` (follows REST `/me` convention)
- **Authentication**: User session tokens (`authorization_code` flow)
- **Token Source**: `getSession()` from encrypted cookie
- **Use Cases**:
  - User custom feeds
  - User subscriptions
  - Home feed
  - Voting on posts/comments
  - Commenting

**Example:**

```typescript
// In RTK Query service
const authenticatedApi = createApi({
  baseQuery: createRedditBaseQuery('/api/reddit/me'), // Authenticated
  endpoints: (builder) => ({
    getUserCustomFeeds: builder.query({
      query: () => '/api/multi/user/{username}'
    })
  })
})
```

#### Key Design Principles

1. **Clean Separation**: No query overlap between anonymous and authenticated APIs
2. **Credential Security**: App tokens never mixed with user tokens
3. **Type Safety**: All services use auto-generated types from OpenAPI spec
4. **Graceful Degradation**: Authenticated endpoints return empty data when not logged in
5. **Factory Pattern**: Base queries created via `createRedditBaseQuery()` factory

#### Request Flow

```text
Component
    ↓
RTK Query Hook (useGetSubredditPostsQuery)
    ↓
Base Query (createRedditBaseQuery)
    ↓
API Route (/api/reddit or /api/reddit/me)
    ↓
Token Acquisition (getRedditToken or getSession)
    ↓
Reddit OAuth API (oauth.reddit.com)
    ↓
Response (transformed via RTK Query)
    ↓
Component (auto-cached, auto-refetched)
```

#### Security Features

- **Origin Validation**: All routes validate request origin (CSRF protection)
- **Path Validation**: `isSafeRedditPath()` prevents SSRF attacks
- **Token Encryption**: User sessions stored in encrypted cookies (iron-session)
- **Automatic Rotation**: App tokens rotate proactively before expiration
- **Rate Limiting**: Built into Reddit API proxy with header tracking

### File Structure

```text
app/
├── (default)/              # Default layout routes
│   ├── r/                  # Subreddit pages (/r/subreddit)
│   ├── u/                  # User profile pages (/u/username)
│   ├── user/               # User-specific pages
│   └── about/              # About page
└── api/
    ├── auth/               # Authentication endpoints
    ├── log/                # Logging endpoint
    └── reddit/             # Reddit API proxy

components/
├── Feeds/                  # Feed views (Custom, Favorites, Single, User)
├── Layout/                 # Page structure (Header, Homepage, Sidebar)
└── UI/                     # Reusable components (Post, Auth, Search, etc.)

lib/
├── actions/                # Server Actions (redditToken.ts)
├── auth/                   # Auth utilities
├── hooks/                  # Custom React hooks
├── store/                  # Redux + RTK Query
├── types/                  # Auto-generated TypeScript types
└── utils/
    ├── api/                # API utilities, base queries
    ├── formatting/         # Data formatting helpers
    ├── logging/            # Error logging (clientLogger, logError)
    ├── routing/            # Navigation helpers
    ├── storage/            # Client storage (cache, history, tokens)
    └── validation/         # Input validation, sanitization

scripts/                    # Build and codegen scripts
test-utils/                 # Test setup and MSW handlers
```

**Organizational Principles:**

- **Components**: Organized by purpose (Feeds, Layout, UI) for clear separation of concerns
- **Utils**: Categorized by function (api, formatting, logging, routing, storage, validation)
- **One Component Per Folder**: Each component has its own folder with `.tsx`, `.module.css`, and `.test.tsx`
- **Import Paths**: Use `@/` alias for clean imports (e.g., `@/components/UI/Post/PostCard/PostCard`)

### NPM Scripts Reference

| Command                    | Purpose                                  |
| -------------------------- | ---------------------------------------- |
| `npm run dev`              | Start development server (Turbo mode)    |
| `npm run build`            | Production build                         |
| `npm run start`            | Start production server                  |
| `npm run test`             | Run test suite                           |
| `npm run coverage`         | Run tests with coverage report           |
| `npm run lint`             | Check code quality (ESLint)              |
| `npm run format`           | Format all files (Prettier)              |
| `npm run typecheck`        | TypeScript type checking                 |
| `npm run typegen`          | Full type generation workflow            |
| `npm run typegen:fetch`    | Fetch samples from Reddit API            |
| `npm run typegen:types`    | Generate TypeScript types from OpenAPI   |
| `npm run typegen:validate` | Validate OpenAPI specification (Redocly) |

---

## Testing

### Test-Driven Development

This is a **test-driven codebase**. Tests must be written/updated alongside code changes.

**Coverage Expectations:**

- Aim for **90%+ test coverage** (not 100%)
- Focus on control flow coverage
- Some unreachable edge cases are acceptable

**Testing Strategy:**

- **Unit Tests**: Everything has a `.test.ts` or `.test.tsx` file
  - Use `it.each()` loops to minimize code duplication
  - Do not create superfluous tests that don't add value
- **Integration Tests**: RTK Query + MSW mocking for API calls
- **Never mock** `global.fetch` or RTK Query directly - always use MSW v2

### Running Tests

```bash
# Run all unit tests
npm run test

# Run specific test file
npx vitest path/to/file.test.ts --run

# Run tests with coverage
npm run test:coverage

# Watch mode (for development)
npx vitest

# E2E tests with Playwright
npm run test:e2e         # Run all E2E tests
npm run test:e2e:ui      # Interactive UI mode
npm run test:e2e:headed  # Run with visible browser
npm run test:e2e:debug   # Debug mode
```

### MSW v2 HTTP Mocking

**CRITICAL: Always use MSW v2 for HTTP interception. NEVER mock `global.fetch`.**

**Global Setup** (handled in `vitest.setup.ts`):

- `beforeAll`: `server.listen()` - starts MSW server
- `afterEach`: `server.resetHandlers()` - resets to default handlers
- `afterAll`: `server.close()` - shuts down server

**Pre-configured Handlers** (in `test-utils/msw/handlers/`):

- `commentHandlers.ts` - Post comments endpoints
- `subredditHandlers.ts` - Subreddit and popular endpoints
- `userHandlers.ts` - User profile and content endpoints
- `authHandlers.ts` - Authentication endpoints
- `voteHandlers.ts` - Vote endpoints
- `proxyHandlers.ts` - Proxy endpoints

### Writing Tests

**Test File Pattern:**

```typescript
import {server} from '@/test-utils/msw/server'
import {http, HttpResponse} from 'msw'

// ✅ CORRECT - Use global handlers for happy path
it('should fetch data successfully', async () => {
  const result = await fetchFunction()
  expect(result).toBeDefined()
})

// ✅ CORRECT - Override only for edge cases
it('should handle 404 error', async () => {
  server.use(
    http.get('https://oauth.reddit.com/endpoint', () => {
      return new HttpResponse(null, {status: 404})
    })
  )
  const result = await fetchFunction()
  expect(result).toBeNull()
})

// ❌ WRONG - Never mock global.fetch
it('should fetch data', async () => {
  global.fetch = vi.fn().mockResolvedValue({...})  // NEVER DO THIS
})
```

**When to Override Handlers:**

- Edge cases: 404, 500, network errors
- Empty responses
- Malformed data
- Rate limiting scenarios

**Handler Order**: Handlers are matched in order, first match wins. Place specific patterns before catch-all patterns.

### E2E Testing

E2E tests use Playwright with Page Object Model pattern. Tests focus on detecting broken features rather than visual regressions.

**Running E2E Tests:**

```bash
# Run all tests
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui

# Generate tests by recording
npm run test:e2e:codegen
```

**Authentication:**

Add credentials to `.env.local`:

```bash
REDDIT_USER="test_username"
REDDIT_PASSWORD="test_password"
APP_URL="http://localhost:3000"  # Optional for local dev
```

Tests log in once globally and reuse cookies for all authenticated tests.

**Writing Tests:**

1. Use Page Object Model (see `e2e/page-objects/`)
2. Keep tests focused on single feature
3. Prefer functional assertions over screenshots
4. Use fixed test URLs (`/r/test/comments/1olhfw8/surprise_test`)
5. Run locally before committing

**Example:**

```typescript
import {test, expect} from '@playwright/test'
import {PostPage} from '../page-objects/PostPage'

test('should navigate with J key', async ({page}) => {
  const postPage = new PostPage(page)
  await postPage.gotoTestPost()

  await postPage.pressNextCommentKey()

  const focused = await postPage.getFocusedComment()
  await expect(focused).toBeFocused()
})
```

---

## Reddit API Integration

### Authentication Setup

The app uses **Reddit OAuth 2.0** for API access with multi-environment support.

**Creating Reddit App:**

1. **Visit**: <https://www.reddit.com/prefs/apps>
2. **Create new app**:
   - **Name**: `reddit-viewer` (or your app name)
   - **Type**: `web app`
   - **Description**: `A Reddit viewing web app`
   - **About URL**: `https://reddit-viewer.com` (your domain)
   - **Redirect URI**: `https://reddit-viewer.com/api/auth/callback/reddit`
3. **Copy credentials** to your `.env` file

**Multi-Environment OAuth:**

The app uses a **shared domain cookie strategy** that enables OAuth to work seamlessly across:

- **Production**: `https://reddit-viewer.com`
- **Preview Deployments**: `https://[pr-id].reddit-viewer.com`
- **Local Development**: `http://localhost:3000` (read-only mode recommended)

**How it works:**

1. All environments redirect to Reddit OAuth
2. Reddit redirects back to production callback (`reddit-viewer.com/api/auth/callback/reddit`)
3. Production callback:
   - Validates OAuth code and exchanges for tokens
   - Creates encrypted session with domain `.reddit-viewer.com`
   - Redirects back to original environment
4. Session cookie is readable by all `reddit-viewer.com` subdomains

**Local Development Options:**

- **Option A (Recommended)**: Use read-only mode locally, test OAuth on preview deployments
- **Option B**: Configure Reddit app with localhost callback (requires manual toggling in Reddit settings)

**Server-Side Token Management:**

- **Read-only Mode**: `lib/actions/redditToken.ts` - Application-only OAuth
- **Authenticated Mode**: `lib/auth/arctic.ts` + `lib/auth/session.ts` - User OAuth with Arctic
- **Features**: Automatic token rotation, caching, error handling, multi-environment support
- **Flow**: Server Action → OAuth token → RTK Query → Components

### Type Generation System

**Why?** Automatically generates TypeScript types from live Reddit API responses instead of manually maintaining types.

**Quick Usage:**

```bash
# Generate everything (fetch + validate)
npm run typegen

# Or step by step:
npm run typegen:fetch     # Fetch samples from Reddit
npm run typegen:types     # Generate TypeScript types from OpenAPI
npm run typegen:validate  # Validate OpenAPI spec with Redocly
```

**What It Does:**

1. **Discovers endpoints** - Finds real post IDs and usernames from Reddit
2. **Fetches samples** - Gets live data from 6 Reddit endpoints
3. **Infers schemas** - Analyzes JSON to create accurate type definitions
4. **Generates OpenAPI 3.1.1** - Creates complete API specification
5. **Creates TypeScript** - Generates `lib/types/reddit-api.ts` (2,376+ lines)
6. **Validates spec** - Ensures quality with Redocly CLI

**Generated Files:**

- `lib/types/reddit-api.ts` - **Main types file** (imported by app)
- `scripts/reddit-openapi-complete.json` - OpenAPI 3.1.1 spec
- `scripts/generation-summary.json` - Generation metadata

**Endpoints Covered:**

| Endpoint     | Purpose              | Sample URL                             |
| ------------ | -------------------- | -------------------------------------- |
| **Posts**    | Community posts      | `/r/typescript/hot.json`               |
| **About**    | Community info       | `/r/typescript/about.json`             |
| **Search**   | Find communities     | `/subreddits/search.json?q=typescript` |
| **Popular**  | Trending communities | `/subreddits/popular.json`             |
| **Comments** | Post comments        | `/r/typescript/comments/abc123.json`   |
| **Users**    | User profiles        | `/user/username/about.json`            |

---

## Advanced Topics

### Error Logging System

The app uses a centralized logging system to capture and handle errors consistently across client and server environments.

#### Critical Rules

**NEVER use `console.log` or `console.error` directly** in the codebase (except in specific exempted cases below). Always use the centralized logging utilities to ensure consistent log formatting, proper log levels, and easier management of log outputs across different environments.

#### Server-Side Logging

Use `logError` from `lib/utils/logging/logError.ts` for all server-side logging (API routes, server actions, middleware).

**Import:**

```typescript
import {logError} from '@/lib/utils/logging/logError'
```

**Usage:**

```typescript
// Log an error with context
try {
  const data = await fetchData()
} catch (error) {
  logError(error, {
    component: 'ApiRoute',
    action: 'fetchData',
    userId: '12345'
    // Any additional context
  })
}

// Log validation errors
logError('Invalid vote request: missing id', {
  component: 'voteApiRoute',
  action: 'validateRequest',
  body: requestBody
})
```

**Features:**

- Automatically handles different error types (Error objects, RTK Query errors, plain objects, strings)
- Structured JSON output with timestamp, error details, and context
- Extracts stack traces from Error objects
- Handles RTK Query error format (`{status, data}`)

#### Client-Side Logging

Use `logClientError` or `logClientInfo` from `lib/utils/logging/clientLogger.ts` for all client-side logging (React components, hooks, client-side utilities).

**Import:**

```typescript
import {logClientError, logClientInfo} from '@/lib/utils/logging/clientLogger'
```

**Usage:**

```typescript
// Log client-side errors
try {
  const userData = await fetchUserData(userId)
} catch (error) {
  logClientError('Failed to load user data', {
    component: 'UserProfile',
    action: 'fetchUserData',
    userId: '12345',
    errorMessage: error instanceof Error ? error.message : String(error)
  })
}

// Log informational events
logClientInfo('User navigated to 404 page', {
  component: 'NotFoundClient',
  action: '404',
  path: window.location.pathname,
  referrer: document.referrer
})
```

**Features:**

- Sends logs to server via `/api/log` endpoint
- Server enriches logs with IP address, user agent, and server timestamp
- Fallback to console if API call fails
- Structured context object for rich debugging information

#### Context Object Guidelines

Always provide a context object with relevant information:

**Required fields:**

- `component`: Component/route/file name where the error occurred
- `action`: Specific operation that failed

**Optional but recommended:**

- `userId`: User identifier (if applicable)
- `requestId`: Request tracking ID
- Error-specific details (validation errors, API responses, etc.)
- Environmental context (URL, referrer, state, etc.)

**Example:**

```typescript
logError(error, {
  component: 'VoteButtons',
  action: 'handleUpvote',
  postId: 't3_abc123',
  userId: 'user_123',
  voteDirection: 1,
  errorType: error instanceof Error ? error.name : typeof error
})
```

#### Allowed Console Usage

Direct `console.*` usage is **only** permitted in these specific cases:

1. **Build scripts** (`scripts/**/*.ts`) - for CLI output during builds
2. **Development-only debugging** - Must be removed before commit
3. **Test files** (`**/*.test.ts`, `**/*.test.tsx`) - for test debugging only
4. **Code examples in JSDoc comments** - documentation purposes

#### Mocking in Tests

When testing code that uses logging utilities, mock them properly:

**Server-side logging:**

```typescript
import {logError} from '@/lib/utils/logging/logError'

vi.mock('@/lib/utils/logging/logError')
const mockLogError = vi.mocked(logError)

// In tests
expect(mockLogError).toHaveBeenCalledWith(
  expect.any(Error),
  expect.objectContaining({
    component: 'MyComponent',
    action: 'myAction'
  })
)
```

**Client-side logging:**

```typescript
const mockLogClientError = vi.hoisted(() => vi.fn())

vi.mock('@/lib/utils/logging/clientLogger', () => ({
  logClientError: mockLogClientError,
  logClientInfo: vi.fn()
}))

// In tests
expect(mockLogClientError).toHaveBeenCalledWith(
  'Error message',
  expect.objectContaining({
    component: 'MyComponent',
    action: 'myAction'
  })
)
```

#### Best Practices

1. **Always include context** - The more context, the easier debugging becomes
2. **Use descriptive messages** - Clear, actionable error messages
3. **Log before returning errors** - Log the error, then return appropriate response
4. **Don't log sensitive data** - Avoid logging passwords, tokens, or PII
5. **Log at appropriate level** - Use error for failures, info for events
6. **Include error details** - For caught errors, include error message and type in context

---

### Codegen Architecture Deep Dive

**Core Classes:**

- **`OpenAPIGenerator`** - Base class for schema inference and spec generation
- **`DynamicRedditScraper`** - Extends base with Reddit-specific discovery logic

**Schema Inference Algorithm:**

```typescript
// Simplified inference logic
if (value === null) return {type: ['string', 'null']}        // OpenAPI 3.1.1 format
if (Array.isArray(value)) return {type: 'array', items: ...} // Handle arrays
if (typeof value === 'object') return {type: 'object', properties: ...} // Objects
return {type: typeof value} // Primitives
```

**Rate Limiting Strategy:**

- **Delay**: 1-1.5 seconds between requests
- **Error handling**: Automatic retries with exponential backoff
- **Respect**: Reddit API guidelines and quotas

**Validation Pipeline:**

```bash
redocly lint scripts/reddit-openapi-complete.json
```

**Rules enforced:**

- ✅ Valid OpenAPI 3.1.1 structure
- ✅ All operation tags defined
- ✅ License information included
- ⚠️ Path naming (Reddit uses non-kebab-case URLs)

**Extending the System:**

1. Add endpoint config to `redditEndpoints` in `generate-openapi.ts`
2. Implement dynamic discovery in `dynamic-scraper.ts` if needed
3. Run `npm run typegen` to regenerate types

**Configuration**: `redocly.yaml` for validation rules

---

## Getting Help

### Resources

- **Issues**: [GitHub Issues](https://github.com/gregrickaby/viewer-for-reddit/issues) - Bug reports and feature requests
- **Discussions**: [GitHub Discussions](https://github.com/gregrickaby/viewer-for-reddit/discussions) - Questions and community
- **Reddit API**: [Official Documentation](https://www.reddit.com/dev/api/) - API reference
- **Mantine**: [Documentation](https://mantine.dev/) - UI component library
- **Next.js**: [Documentation](https://nextjs.org/docs) - Framework documentation
- **RTK Query**: [Documentation](https://redux-toolkit.js.org/rtk-query/overview) - Data fetching

### Before You Ask

1. **Search existing issues** and discussions
2. **Check the documentation** in this file
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

_Viewer for Reddit is an independent side project and is not affiliated with, endorsed by, or sponsored by Reddit, Inc. "Reddit" and the Snoo logo are trademarks of Reddit, Inc., used in accordance with their [brand guidelines](https://redditinc.com/brand). The app developer and contributors endeavor to comply with Reddit's [API terms](https://redditinc.com/policies/data-api-terms) and [Developer Platform](https://support.reddithelp.com/hc/en-us/articles/14945211791892-Developer-Platform-Accessing-Reddit-Data) policies._
