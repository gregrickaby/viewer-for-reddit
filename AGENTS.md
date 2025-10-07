# AI Agent Instructions

**Audience**: All AI agents (GitHub Copilot, Claude Code, Cursor, etc.)
**Purpose**: Machine-readable operational runbook for reddit-viewer.com
**Human Docs**: See [CONTRIBUTING.md](./CONTRIBUTING.md) for comprehensive developer guide

## About reddit-viewer.com

A Reddit viewing web app enabling users to browse Reddit content without ads or distractions.

It has two modes:

- **Read-only Mode**: Browse public communities, posts, users, and comments without logging in. This mode uses a developer API key to authenticate calls to <https://oauth.reddit.com> with limited rate and scope via Reddit's personal use script.

- **Authenticated Mode**: User logs in with via OAuth2 with their Reddit account to access personalized features like viewing home feed, custom feeds, voting, commenting, and subscribing. This mode uses OAuth 2.0 to obtain user-specific access tokens with broader scopes.

## Available Sub-agents

- **Accessibility Tester**: [accessibility-tester](./.claude/agents/accessibility-tester.md)
- **Architect Reviewer**: [architect-reviewer](./.claude/agents/architect-reviewer.md)
- **Code Reviewer**: [code-reviewer](./.claude/agents/code-reviewer.md)
- **Full-stack Developer**: [fullstack-developer](./.claude/agents/fullstack-developer.md)
- **Next.js Developer**: [nextjs-developer](./.claude/agents/nextjs-developer.md)
- **Performance Engineer**: [performance-engineer](./.claude/agents/performance-engineer.md)
- **QA Expert**: [qa-expert](./.claude/agents/qa-expert.md)
- **Security Engineer**: [security-engineer](./.claude/agents/security-engineer.md)
- **TypeScript Professional**: [typescript-professional](./.claude/agents/typescript-pro.md)

## Architecture Overview

- **Framework**: Next.js 15+ (App Router)
- **UI**: Mantine v8 component library. Use Mantine primitives. Fetch official docs: <https://mantine.dev/llms.txt>
- **API**: Reddit API v2 with OpenAPI spec and auto-generated types. Fetch official docs: <https://developers.reddit.com/docs/llms-full.txt>
- **Analytics**: Umami (production only) <https://umami.is/docs>
- **Authentication**: Reddit OAuth 2.0 with server actions (Read-only mode) and Arctic (Authenticated Mode). <https://arcticjs.dev/providers/reddit>
- **CI/CD**: GitHub Actions with validation gates
- **CSS**: CSS Modules with Mantine CSS variables
- **Coolify**: This app is self-hosted and deployed with Coolify using Nixpacks. Preview deployments for each pull request: <https://[pull-request-id].reddit-viewer.com>
- **Data Fetching**: RTK Query
- **Error Logging**: Custom logging solution.
- **Formatting**: Prettier
- **Github MCP**: Interacting with Github issues and pull requests
- **Linting**: ESLint with Mantine config
- **Playwright MCP**: Used for visual debugging and manual QA
- **State Management**: Redux Toolkit
- **Testing**: Vitest + React Testing Library + MSW v2
- **TypeScript**: Strict mode enabled. Never use `any` type

## Error Logging

A custom error logging solution is implemented to capture and log errors occurring in the application. This includes both client-side and server-side errors.

### Critical Rules

**NEVER use `console.log` or `console.error` directly in the codebase** (except in specific exempted files - see below). Always use the centralized logging utilities to ensure consistent log formatting, proper log levels, and easier management of log outputs across different environments.

### Server-Side Logging

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

### Client-Side Logging

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

### Context Object Guidelines

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

### Allowed Console Usage

Direct `console.*` usage is **only** permitted in these specific cases:

1. **Build scripts** (`scripts/**/*.ts`) - for CLI output during builds
2. **Development-only debugging** - Must be removed before commit
3. **Test files** (`**/*.test.ts`, `**/*.test.tsx`) - for test debugging only
4. **Code examples in JSDoc comments** - documentation purposes

### Mocking in Tests

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

### Best Practices

1. **Always include context** - The more context, the easier debugging becomes
2. **Use descriptive messages** - Clear, actionable error messages
3. **Log before returning errors** - Log the error, then return appropriate response
4. **Don't log sensitive data** - Avoid logging passwords, tokens, or PII
5. **Log at appropriate level** - Use error for failures, info for events
6. **Include error details** - For caught errors, include error message and type in context

## Authentication

**OAuth Strategy**: Reddit OAuth 2.0 with Arctic library

- **Arctic library**: Reddit OAuth 2.0 provider (<https://arcticjs.dev/providers/reddit>)
- **CSRF protection**: State parameter validation with httpOnly cookies
- **Session encryption**: iron-session with encrypted cookies
- **Rate limiting**: Per-IP request limiting with audit logging
- **Token refresh**: Automatic token rotation before expiration
- **Security**: httpOnly cookies, secure flag in production, sameSite: 'lax'

**Authentication Flow**:

1. User clicks "Sign in"
2. Login route generates state parameter and redirects to Reddit OAuth
3. Reddit redirects back to `/api/auth/callback/reddit` with authorization code
4. Callback handler:
   - Validates state parameter (CSRF protection)
   - Exchanges code for access/refresh tokens
   - Creates encrypted session cookie
   - Redirects to homepage
5. User is authenticated and can access personalized features

## Core Development Commands

### Quality Gates (Required for all code changes)

```bash
npm run format      # Prettier formatting - auto-fixes formatting issues
npm run lint        # ESLint with Mantine config - must pass
npm run typecheck   # TypeScript strict checking - must pass
npm run test        # Run all tests (components, lib, API routes) - must pass
npm run dev         # Start dev server. Check if dev server is already running on port 3000. Then verify changes using Playwright MCP
```

**Critical**: Run these commands in sequence for any code changes. Stop if any step fails.

### Testing Commands

```bash
npx vitest <path> --run   # Run specific test file
npm run test              # Run all unit tests and produce coverage report
```

### Reddit API Type Generation

```bash
npm run typegen           # Full type generation workflow
npm run typegen:fetch     # Fetch samples from Reddit API
npm run typegen:types     # Generate TypeScript types from OpenAPI spec
npm run typegen:validate  # Validate OpenAPI specification
```

## Validation Gate Protocol

### For Code Changes (.ts, .tsx, .js, .jsx, .css, .json)

1. **If API spec or types changed:**

   ```bash
   npm run typegen:types
   ```

2. **Always run in sequence (stop if any fail):**

   ```bash
   npm run format
   npm run lint
   npm run typecheck
   npx vitest <path> --run # Specific tests related to changes
   ```

3. **For feature completion:**

   ```bash
   npm run test  # Full test suite
   npm run dev  # Use Playwright MCP to validate functionality
   ```

### Skip Validation

Skip full validation gate for documentation-only changes (\*.md, comments, README updates).

## Test-Driven Development Requirements

This is a **test-driven codebase**. Tests must be written/updated alongside code changes.

**Coverage Expectations:**

- Aim for **90%+ test coverage** (not 100%)
- Focus on control flow coverage
- Some unreachable edge cases are acceptable

**Testing Strategy:**

- **Unit Tests**: Everything has `.test.ts`.
  - If possible, create loops using it.each() for tests to minimize code duplication.
  - Do not create superfluous tests that do not add value or directly contribute to coverage.
- **Integration Tests**: RTK Query + MSW mocking. Never mock `global.fetch` or RTK Query directly.

**MSW v2 HTTP Mocking (CRITICAL):**

**NEVER mock `global.fetch`** - Always use MSW v2 for HTTP interception

- **Global Setup**: MSW server lifecycle is handled in `vitest.setup.ts`
  - `beforeAll`: `server.listen()` - starts MSW server
  - `afterEach`: `server.resetHandlers()` - resets to default handlers
  - `afterAll`: `server.close()` - shuts down server
- **Global Handlers**: Pre-configured in `test-utils/msw/handlers/`
  - `commentHandlers.ts` - Post comments endpoints (includes single post data)
  - `subredditHandlers.ts` - Subreddit and popular endpoints
  - `userHandlers.ts` - User profile and content endpoints
  - `authHandlers.ts` - Authentication endpoints
  - `voteHandlers.ts` - Vote endpoints
  - `proxyHandlers.ts` - Proxy endpoints
- **Test File Pattern**:

  ```typescript
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

- **When to Override Handlers**:
  - Edge cases: 404, 500, network errors
  - Empty responses
  - Malformed data
  - Rate limiting scenarios
- **Handler Order Matters**: Handlers are matched in order, first match wins
  - Place specific patterns before catch-all patterns
  - `commentHandlers` uses `/:permalink*` which catches all post comment URLs

### Debugging with Playwright MCP

**Visual Debugging Workflow:**

1. Use Playwright MCP to navigate to `http://localhost:3000`
2. Capture accessibility snapshots before making UI changes
3. Use MCP actions (click/type) to reproduce failing flows
4. Generate screenshots and network logs for bug reports
5. Create minimal failing tests with visual evidence

**When to Use Playwright MCP:**

- Before changing UI components
- When reproducing user-reported issues
- For complex interaction flows
- To validate responsive design changes

## Architecture Patterns

### Project Structure

```text
app/
├── (default)/              # Default layout routes
│   ├── r/                  # Subreddit pages (/r/subreddit)
│   ├── u/                  # User profile pages (/u/username)
│   ├── user/               # User-specific pages
│   └── about/              # About page
├── api/                    # API routes
│   ├── auth/               # Authentication endpoints
│   ├── log/                # Logging endpoint
│   └── reddit/             # Reddit API proxy routes

components/
├── Feeds/                  # Feed-specific views
│   ├── Custom/             # Custom feed display (CustomFeedPosts)
│   ├── Favorites/          # Favorites feed (FavoritesPosts)
│   ├── Single/             # Single post view (SinglePost)
│   └── User/               # User profile feed (UserProfile)
├── Layout/                 # Structural & page-level components
│   ├── Header/             # Site header
│   ├── Homepage/           # Homepage component
│   ├── NotFoundClient/     # 404 page client component
│   └── Sidebar/            # Sidebar navigation
└── UI/                     # Reusable UI components
    ├── Analytics/          # Analytics tracking
    ├── Auth/               # Login/logout buttons, user menu
    ├── BackToTop/          # Back to top button
    ├── BossButton/         # Quick exit button
    ├── Breadcrumb/         # Breadcrumb navigation
    ├── ErrorMessage/       # Error display
    ├── Favorite/           # Favorite button
    ├── Post/               # Post system (Card, List, Media, Comments, VoteButtons)
    ├── Search/             # Search functionality
    ├── Settings/           # Settings panel
    └── SubredditName/      # Subreddit name display

lib/
├── actions/                # Server Actions
│   └── redditToken.ts      # OAuth token management
├── auth/                   # Authentication utilities
├── hooks/                  # Custom React hooks
├── store/                  # Redux store + RTK Query
├── types/                  # TypeScript definitions (auto-generated)
└── utils/                  # Pure utility functions
    ├── api/                # API-related utilities
    │   ├── apiConstants.ts         # API constants and endpoints
    │   ├── authenticatedFetch.ts   # Authenticated HTTP requests
    │   ├── fetchWithTimeout.ts     # Timeout-enabled fetch
    │   ├── oauthHelpers.ts         # OAuth helper functions
    │   ├── redditProxyHelpers.ts   # Reddit proxy utilities
    │   ├── retryConfig.ts          # Retry configuration
    │   └── baseQuery/              # RTK Query base queries
    ├── formatting/         # Text and data formatting
    │   ├── commentFilters.ts       # Comment filtering utilities
    │   ├── commentHelpers.ts       # Comment manipulation
    │   ├── extractChildren.ts      # Extract nested children
    │   ├── formatTimeAgo.ts        # Relative time formatting
    │   ├── generatePostSlug.ts     # URL slug generation
    │   ├── getIsVertical.ts        # Media orientation detection
    │   ├── getMediumImage.ts       # Image size selection
    │   ├── parsePostLink.ts        # Post URL parsing
    │   └── subredditMapper.ts      # Subreddit name mapping
    ├── logging/            # Error and event logging
    │   ├── clientLogger.ts         # Client-side logging
    │   └── logError.ts             # Server-side error logging
    ├── routing/            # Navigation utilities
    │   └── redirectHelpers.ts      # Redirect utilities
    ├── storage/            # Client-side storage
    │   ├── mediaCache.ts           # Media caching
    │   ├── searchHistory.ts        # Search history
    │   ├── storage.ts              # Generic storage wrapper
    │   └── token.ts                # Token storage
    └── validation/         # Input validation and sanitization
        ├── errorSanitizer.ts       # Error message sanitization
        ├── redditUserValidator.ts  # Reddit username validation
        ├── sanitizeText.ts         # Text sanitization
        ├── urlSanitizer.ts         # URL sanitization
        ├── validateOrigin.ts       # Origin validation (CSRF)
        └── validateRedditPath.ts   # Reddit path validation (SSRF)

scripts/                    # Build and codegen scripts
test-utils/                 # Test setup and utilities
```

### Component Structure (One per folder)

```text
components/ComponentName/
├── ComponentName.tsx           # Main component
├── ComponentName.module.css    # Styles
└── ComponentName.test.ts       # Tests
```

### Server Actions Pattern

- `lib/actions/redditToken.ts` - OAuth token management
- Automatic token rotation and caching
- Error handling with retry logic

## Environment Setup

### Prerequisites

- **Node.js**: v22 (see `.nvmrc`)
- **npm**: v10+
- **Reddit API credentials**: Required for development

### Environment Configuration

See `.env.example` for required variables.

## Failure Handling

### Common Issues & Debugging

**Test Failures:**

- **Network-related**: Check `test-utils/msw/handlers.ts` first
- **Flaky tests**: Ensure `userEvent.setup()` per test and reset mocks
- **TypeScript errors**: Run `npm run typecheck` and inspect top-level failures

**Build Issues:**

- **Missing types**: Run `npm run typegen` to regenerate Reddit API types
- **Long-running commands**: Abort if exceeding 2x expected timeout

### Reporting Requirements

Include in failure reports:

- Exact commands run and their exit codes
- Full `npm run typecheck` and `npm run test` outputs for failing CI gates
- Playwright MCP snapshots for UI issues
- Concise delta: files changed, tests run (PASS/FAIL), next steps

## Git Workflow (Feature Development)

**Required Process:**

1. **Create GitHub Issue**

   ```bash
   gh issue create --title "Feature: description" --body "Requirements..."
   ```

2. **Create Feature Branch**

   ```bash
   git checkout -b {ticket-number}-{feature-name}
   ```

3. **Validation Process**

   ```bash
   # Always format before committing to avoid pre-commit hook amendments
   npm run format

   # Run validation gate
   npm run lint
   npm run typecheck
   npm run test

   # Validate with Playwright if UI changes
   npm run dev  # Check if dev server is already running on port 3000. Use Playwright MCP to test feature functionality
   ```

4. **Commit and Push**

   Critical: Always ask before committing or pushing code!

   ```bash
   git add .
   git commit -m "feat: descriptive commit message"

   # If pre-commit hooks modify files, amend the commit
   git add . && git commit --amend --no-edit

   git push -u origin {branch-name}
   ```

5. **Create Pull Request**
6. Critical: Always ask before committing or pushing code!

   ```bash
   gh pr create --title "feat: description" --body "Summary and test plan"
   ```

7. **Review**
   - Github CoPilot will automatically do a first review of the PR
   - Wait for feedback and then address comments
   - After addressing comments, request another review
   - Use the preview deployment link generated by Coolify to validate changes in a live environment

8. **Merge PR**
   - Ensure all checks pass
   - Use "Squash and merge" strategy

## Code Quality Standards

### Comment Guidelines

- Do NOT insert superfluous comments or explanatory comments
- Do NOT insert comments explaining why you changed something from a previous edit
- Only add comments when documenting complex business logic or non-obvious patterns
- Let code be self-documenting through clear naming and structure

### Important Instruction Reminders

- Do what has been asked; nothing more, nothing less (unless debugging a failure)
- NEVER create files unless absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (\*.md) or README files unless explicitly requested

## Operational Timeouts

Reference timeouts for automated agents:

- **Build**: 30s
- **Format**: 5s
- **Install**: 30s
- **Lint**: 5s
- **Test suite**: 45s
- **Type generation**: 60s
- **Typecheck**: 5s

Stop after 3 failed attempts on any task.
