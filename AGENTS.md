# AI Agent Instructions

**Audience**: All AI agents (GitHub Copilot, Claude Code, Cursor, etc.)
**Purpose**: Quick reference and operational guide for AI agents
**Deep Dives**: See [CONTRIBUTING.md](./CONTRIBUTING.md) for comprehensive documentation

---

## Table of Contents

- [About reddit-viewer.com](#about-reddit-viewercom)
- [Quick Reference](#quick-reference)
- [Available Sub-agents](#available-sub-agents)
- [Architecture Overview](#architecture-overview)
- [Core Development Workflow](#core-development-workflow)
- [Key Patterns & Rules](#key-patterns--rules)
- [Testing Strategy](#testing-strategy)
- [Git Workflow](#git-workflow)
- [Detailed References](#detailed-references)

---

## About reddit-viewer.com

A Reddit viewing web app enabling users to browse Reddit content without ads or distractions.

It has two modes:

- **Read-only Mode**: Browse public communities, posts, users, and comments without logging in. This mode uses a developer API key to authenticate calls to <https://oauth.reddit.com> with limited rate and scope via Reddit's personal use script.

- **Authenticated Mode**: User logs in with via OAuth2 with their Reddit account to access personalized features like viewing home feed, custom feeds, voting, commenting, and subscribing. This mode uses OAuth 2.0 to obtain user-specific access tokens with broader scopes.

---

## Quick Reference

### Essential Commands

```bash
# Development
npm run dev              # Start dev server (check port 3000 first)
npm run build            # Production build

# Quality Gates (run in sequence)
npm run format           # Prettier - auto-fixes formatting
npm run lint             # ESLint - must pass
npm run typecheck        # TypeScript strict - must pass
npm run test             # All unit tests and produce coverage report - must pass
sonar-scanner            # SonarQube analysis - must pass quality gate

# Testing
npx vitest <path> --run  # Run specific test file

# Type Generation
npm run typegen          # Full workflow (fetch + validate)
npm run typegen:types    # Generate types from OpenAPI spec
```

### Environment Requirements

- **Node.js**: v22.19+ (see `.nvmrc` and `package.json` engines)
- **npm**: v10+
- **Reddit API credentials**: Required (see `.env.example`)

### Validation Protocol

**For all code changes:**

1. If API spec/types changed: `npm run typegen:types`
2. Always run in sequence (stop if any fail):

   ```bash
   npm run format
   npm run lint
   npm run typecheck
   npx vitest <path> --run
   ```

3. For feature completion: `npm run test` + SonarQube analysis
4. Optional: Playwright MCP validation for UI changes

**SonarQube Integration:**

- **VS Code Extension**: Real-time code quality feedback during development
- **Self-hosted Platform**: <http://localhost:9000> - Full analysis and quality gate enforcement
- **SonarQube MCP**: `mcp_sonarqube_*` tools for programmatic analysis and issue management
- **Quality Standards**: Maintain <1.5% duplication, zero critical/blocker issues

**Skip validation** for documentation-only changes (\*.md, comments).

---

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

---

## Architecture Overview

### Tech Stack

- **Framework**: Next.js 16+ (App Router) with Cache Components and React Compiler enabled
- **UI**: Mantine v8 component library. Use Mantine primitives. Fetch official docs: <https://mantine.dev/llms.txt>
- **API**: Reddit API v2 with OpenAPI spec and auto-generated types. Fetch official docs: <https://developers.reddit.com/docs/llms-full.txt>
- **Analytics**: Umami (production only) <https://umami.is/docs>
- **Authentication**: Reddit OAuth 2.0 with server actions (Read-only mode) and Arctic (Authenticated Mode). <https://arcticjs.dev/providers/reddit>
- **CI/CD**: GitHub Actions with validation gates
- **Code Quality**: SonarQube Community Edition (self-hosted) + VS Code extension. SonarQube MCP for analysis
- **CSS**: CSS Modules with Mantine CSS variables
- **Coolify**: Self-hosted deployment using Nixpacks. Preview deployments: <https://[pull-request-id].reddit-viewer.com>
- **Data Fetching**: RTK Query
- **Error Logging**: Custom logging solution
- **Formatting**: Prettier
- **Github MCP**: Interacting with Github issues and pull requests
- **Linting**: ESLint with Mantine config
- **Playwright MCP**: Visual debugging and manual QA
- **State Management**: Redux Toolkit
- **Testing**: Vitest 4 + React Testing Library + MSW 2
- **TypeScript**: Strict mode enabled. Never use `any` type

### Next.js 16 Critical Requirements

**Cache Components** - Dynamic data (headers, cookies, params, searchParams) MUST be wrapped in `<Suspense>` boundaries

**React Compiler** - Do NOT add manual `useMemo`, `useCallback`, or `React.memo` (automatic optimization enabled)

**react-icons** - Always import from sub-packages: `import {FaGithub} from 'react-icons/fa'` (NOT `'react-icons'`)

### High-Level Architecture

**Dual-Mode API Design:**

```text
┌─────────────────────────────────────────────────────────┐
│                     Components                          │
│                         ↓                               │
│                  RTK Query Hooks                        │
└─────────────────────────────────────────────────────────┘
                          ↓
         ┌────────────────┴────────────────┐
         ↓                                 ↓
┌─────────────────┐              ┌─────────────────┐
│  /api/reddit    │              │ /api/reddit/me  │
│  (Read-only)    │              │ (Authenticated) │
│                 │              │                 │
│  App tokens     │              │  User tokens    │
│  getRedditToken │              │  getSession     │
└─────────────────┘              └─────────────────┘
         ↓                                 ↓
         └────────────────┬────────────────┘
                          ↓
                 oauth.reddit.com
```

**Key Principles:**

- Clean separation between anonymous and authenticated APIs
- App tokens never mixed with user tokens
- All services use auto-generated types from OpenAPI spec
- Graceful degradation when not logged in

**Authentication Flow:**

1. User clicks "Sign in"
2. Login route generates state parameter, redirects to Reddit OAuth
3. Reddit redirects to `/api/auth/callback/reddit` with authorization code
4. Callback handler validates state (CSRF), exchanges code for tokens, creates encrypted session
5. User authenticated with personalized features

### Project Structure

```text
app/
├── (default)/              # Default layout routes
│   ├── r/                  # Subreddit pages
│   ├── u/                  # User profiles
│   └── user/               # User-specific pages
└── api/
    ├── auth/               # Auth endpoints
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

**Component Structure (One per folder):**

```text
components/ComponentName/
├── ComponentName.tsx           # Main component
├── ComponentName.module.css    # Styles
└── ComponentName.test.ts       # Tests
```

---

## Core Development Workflow

### Validation Gate Protocol

**Critical**: Run commands in sequence. Stop if any step fails.

```bash
# 1. Format first (avoid pre-commit hook amendments)
npm run format

# 2. Run quality gates
npm run lint
npm run typecheck
npm run test

# 3. Validate with Playwright MCP if UI changes
npm run dev  # Check port 3000 first, then use Playwright MCP
```

### Code Quality Standards

**Comment Guidelines:**

- NEVER insert superfluous or explanatory comments
- NEVER explain why you changed something from a previous edit
- NEVER insert emojis
- Only add comments for complex business logic or non-obvious patterns
- Let code be self-documenting through clear naming

**JSDoc Requirements:**

- ALL components and functions must have a simple docblock
- Describe what it does in 1-2 sentences
- Add @param and @returns for non-obvious parameters/returns
- Complex components should include a feature list

**Code Organization:**

- Props in JSX will be sorted alphabetically by ESLint auto-fix
- No orphaned files, dead code, or commented-out code
- One component per file (extract sub-components to separate files)
- Clean up unused imports and variables

**Development Rules:\*\***

- ALWAYS do what has been asked; nothing more, nothing less (unless debugging)
- ALWAYS prefer editing existing files over creating new ones
- NEVER create files unless absolutely necessary
- NEVER proactively create documentation files (\*.md, README) unless requested

### Operational Timeouts

Reference timeouts for automated agents:

- **Build**: 30s
- **Format**: 5s
- **Lint**: 5s
- **Test suite**: 45s
- **Type generation**: 60s
- **Typecheck**: 5s

**Stop after 3 failed attempts** on any task.

---

## Key Patterns & Rules

### Error Logging

**NEVER use `console.log` or `console.error` directly.** Always use centralized logging:

```typescript
// Server-side
import {logError} from '@/lib/utils/logging/logError'
logError(error, {component: 'ComponentName', action: 'actionName'})

// Client-side
import {logClientError} from '@/lib/utils/logging/clientLogger'
logClientError('message', {component: 'ComponentName', action: 'actionName'})
```

Required context: `component`, `action`. Never log passwords, tokens, or PII.

### Authentication Patterns

**OAuth Strategy**: Reddit OAuth 2.0 with Arctic library

- **Arctic library**: <https://arcticjs.dev/providers/reddit>
- **CSRF protection**: State parameter validation with httpOnly cookies
- **Session encryption**: iron-session with encrypted cookies
- **Rate limiting**: Per-IP request limiting with audit logging
- **Token refresh**: Automatic token rotation before expiration
- **Security**: httpOnly cookies, secure flag in production, sameSite: 'lax'

**Server Actions Pattern:**

- `lib/actions/redditToken.ts` - OAuth token management
- Automatic token rotation and caching
- Error handling with retry logic

---

## Testing Strategy

### Test-Driven Development

This is a **test-driven codebase**. Tests must be written/updated alongside code changes.

**Coverage Expectations:**

- Aim for **90%+ test coverage** (not 100%)
- Focus on control flow coverage
- Some unreachable edge cases are acceptable

**Testing Strategy:**

- **Unit Tests**: Everything has `.test.ts`
  - Use `it.each()` loops to minimize code duplication
  - NEVER create superfluous tests that don't add value
- **Integration Tests**: RTK Query + MSW mocking
- **Code Quality**: SonarQube analysis for duplication, complexity, and security issues

### Test Utilities (@/test-utils)

**Critical**: ALWAYS import test utilities from `@/test-utils`, never directly from libraries.

**Pre-configured Exports:**

```typescript
// ✅ CORRECT
import {render, screen, user, waitFor, server} from '@/test-utils'

// ❌ WRONG
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
```

**Key Exports:**

- `user` - **Pre-configured userEvent.setup()** - Use this for all interactions
- `userEvent` - Raw default export (rarely needed)
- `render` - Custom render with Redux StoreProvider
- `renderHook` - Hook testing with Redux provider
- `server` - MSW server instance
- `http`, `HttpResponse` - MSW utilities
- All @testing-library/react exports

**Test Pattern:**

```typescript
import {render, screen, user} from '@/test-utils'

it('should handle interaction', async () => {
  render(<MyComponent />)
  await user.click(screen.getByRole('button'))
  // No userEvent.setup() needed - already configured!
})
```

**Why Use Pre-configured `user`?**

- ✅ Consistent setup across all tests
- ✅ Eliminates duplicate `userEvent.setup()` calls
- ✅ Single source of truth for test configuration
- ✅ Easier to update user-event options globally

**Critical**: NEVER call `userEvent.setup()` directly - always use the pre-configured `user` export.

### MSW v2 HTTP Mocking (CRITICAL)

**NEVER mock `global.fetch`** - Always use MSW v2 for HTTP interception.

**Global Setup** (handled in `vitest.setup.ts`):

- `beforeAll`: `server.listen()` - starts MSW server
- `afterEach`: `server.resetHandlers()` - resets to default handlers
- `afterAll`: `server.close()` - shuts down server

**Global Handlers** (pre-configured in `test-utils/msw/handlers/`):

- `commentHandlers.ts` - Post comments endpoints
- `subredditHandlers.ts` - Subreddit and popular endpoints
- `userHandlers.ts` - User profile and content endpoints
- `authHandlers.ts` - Authentication endpoints
- `voteHandlers.ts` - Vote endpoints
- `proxyHandlers.ts` - Proxy endpoints

**Test File Pattern:**

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

**When to Override Handlers:**

- Edge cases: 404, 500, network errors
- Empty responses
- Malformed data
- Rate limiting scenarios

**Handler Order Matters**: First match wins

- Place specific patterns before catch-all patterns
- `commentHandlers` uses `/:permalink*` which catches all post comment URLs

### Debugging with Playwright MCP

**Visual Debugging Workflow:**

1. Navigate to `http://localhost:3000`
2. Capture accessibility snapshots before UI changes
3. Use MCP actions (click/type) to reproduce failing flows
4. Generate screenshots and network logs for bug reports
5. Create minimal failing tests with visual evidence

**When to Use:**

- Before changing UI components
- When reproducing user-reported issues
- For complex interaction flows
- To validate responsive design changes

### SonarQube Code Quality Analysis

**Three-Tier Integration:**

1. **VS Code Extension** (Real-time):
   - Install: SonarQube for IDE extension
   - Provides instant feedback on code quality issues
   - Highlights duplications, code smells, bugs, and vulnerabilities
   - Connected mode syncs with self-hosted SonarQube server

2. **Self-hosted Platform** (Comprehensive):
   - URL: <http://localhost:9000>
   - Run: `sonar-scanner` in project root
   - Quality gate enforcement before merge
   - Project key: `viewer-for-reddit`
   - Configuration: `sonar-project.properties`

3. **SonarQube MCP** (Programmatic):
   - Tools: `mcp_sonarqube_*` functions for AI agents
   - Capabilities:
     - `search_sonar_issues_in_projects`: Find code quality issues
     - `get_component_measures`: Get metrics (duplication, complexity, coverage)
     - `get_project_quality_gate_status`: Check if quality gate passes
     - `change_sonar_issue_status`: Mark issues as false positives or accept
   - Use for: Automated quality analysis, issue investigation, metrics tracking

**Quality Standards:**

- **Duplication**: < 1.5% (target: < 1.0%)
- **Critical/Blocker Issues**: Zero tolerance
- **Code Smells**: Address high/critical severity
- **Security Hotspots**: Review and resolve all
- **Test Coverage**: Maintain 90%+

**When to Run:**

- After completing a feature (before PR)
- When investigating code quality issues
- During refactoring work
- Before major releases

### Mocking in Tests

Mock logging utilities in tests using standard Vitest mocking patterns. See test files for examples.

---

## Git Workflow

### Feature Development Process

**Critical: Always ask before committing or pushing code!**

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

   # Run SonarQube analysis (for features, not minor fixes)
   sonar-scanner

   # Validate with Playwright if UI changes
   npm run dev  # Use Playwright MCP to test feature
   ```

4. **Commit and Push**

   ```bash
   git add .
   git commit -m "feat: descriptive commit message"

   # If pre-commit hooks modify files, amend the commit
   git add . && git commit --amend --no-edit

   git push -u origin {branch-name}
   ```

5. **Create Pull Request**

   ```bash
   gh pr create --title "feat: description" --body "Summary and test plan"
   ```

6. **Review Process**
   - GitHub Copilot automatically reviews PR
   - Wait for feedback, address comments
   - Request re-review after addressing comments
   - Use Coolify preview deployment to validate: `https://[pr-id].reddit-viewer.com`

7. **Merge PR**
   - Ensure all checks pass
   - Use "Squash and merge" strategy

---

## Detailed References

### Common Issues & Debugging

**Test Failures:**

- **Network-related**: Check `test-utils/msw/handlers/` first
- **Flaky tests**: Use pre-configured `user` from @/test-utils and reset mocks properly
- **TypeScript errors**: Run `npm run typecheck` and inspect top-level failures

**Build Issues:**

- **Missing types**: Run `npm run typegen` to regenerate Reddit API types
- **Long-running commands**: Abort if exceeding 2x expected timeout

### Failure Reporting Requirements

Include in failure reports:

- Exact commands run and their exit codes
- Full `npm run typecheck` and `npm run test` outputs for failing CI gates
- Playwright MCP snapshots for UI issues
- Concise delta: files changed, tests run (PASS/FAIL), next steps
