# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **See also**: [.github/copilot-instructions.md](.github/copilot-instructions.md) for terse operational rules

## Development Commands

### Core Quality Gates (Required for all code changes)

```bash
npm run lint        # ESLint with Mantine config - must pass
npm run typecheck   # TypeScript strict checking - must pass
npm run test        # Vitest unit tests - must pass
npm run dev         # Start dev server. Review changes using Playwright MCP
```

**Critical**: Run these commands in sequence for any code changes. Stop if any step fails.

### Testing Commands

```bash
npm run test               # Run all unit tests
npm run test:e2e          # Run Playwright E2E tests
npm run coverage          # Run tests with coverage report (aim for 90%+)
npx vitest <component>    # Run specific component tests
npx vitest <path> --run   # Run failing tests locally for debugging
```

### Development Workflow

```bash
npm run dev               # Start development server (http://localhost:3000)
npm run build             # Production build
npm run format            # Format all files with Prettier
```

### Reddit API Type Generation

```bash
npm run typegen           # Full type generation workflow
npm run typegen:fetch     # Fetch samples from Reddit API
npm run typegen:types     # Generate TypeScript types from OpenAPI spec
npm run typegen:validate  # Validate OpenAPI specification
```

## Project Architecture

### Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **UI**: Mantine v8 component library. Documentation URL: <https://mantine.dev/llms.txt>
- **State Management**: Redux Toolkit + RTK Query
- **Authentication**: Reddit OAuth 2.0 (Server Actions)
- **Testing**: Vitest + React Testing Library + MSW v2
- **E2E Testing**: Playwright
- **Styling**: CSS Modules
- **TypeScript**: Strict mode enabled

### Key Architecture Patterns

**Next.js App Router Structure:**

```
app/(default)/              # Route group for main pages
├── page.tsx               # Homepage (/)
├── r/[slug]/page.tsx      # Subreddit pages (/r/pics)
├── u/[username]/page.tsx  # User profiles (/u/username)
└── layout.tsx             # Default layout
```

**Component Structure (One per folder):**

```
components/ComponentName/
├── ComponentName.tsx           # Main component
├── ComponentName.module.css    # Styles
└── ComponentName.test.tsx      # Tests
```

**Redux Store Architecture:**

- `lib/store/services/redditApi.ts` - RTK Query API definitions
- `lib/store/features/` - Redux slices (settings, transient state)
- Auto-generated types from `lib/types/reddit-api.ts` (2,376 lines)

**Server Actions Pattern:**

- `lib/actions/redditToken.ts` - OAuth token management
- Automatic token rotation and caching
- Error handling with retry logic

### Reddit API Integration

**Authentication Flow:**

1. Server Action fetches OAuth token
2. Token cached with request counting
3. RTK Query uses token for API calls
4. Automatic rotation before expiry

**Type Generation System:**

- Dynamically scrapes live Reddit API responses
- Generates OpenAPI 3.1.1 specification
- Creates TypeScript types with optimized flags
- Covers 6 main endpoints (posts, comments, search, etc.)

## Test-Driven Development

### Testing Philosophy

This is a **test-driven codebase**. Tests should be written/updated alongside code changes.

**Coverage Expectations:**

- Aim for **90%+ test coverage** (not 100%)
- Some unreachable edge cases are acceptable
- Focus on control flow coverage

**Testing Strategy:**

- **Unit Tests**: Every component has `.test.tsx`
- **Integration Tests**: RTK Query + MSW mocking
- **E2E Tests**: Playwright for user flows
- **API Mocking**: MSW v2 handlers in `test-utils/msw/handlers.ts`

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

## Development Workflow

### Validation Gate (Required for Code Changes)

```bash
# 1. If API spec or types changed:
npm run typegen:types

# 2. Always run in sequence (stop if any fail):
npm run lint
npm run typecheck
npm run test

# 3. For UI changes, also run:
npm run test:e2e

# 4. For feature completion, run dev server and validate with Playwright:
npm run dev               # Start development server
# Use Playwright MCP to validate feature works as expected
```

> **Note**: This matches the validation gate in copilot-instructions.md for consistency across all AI agents.

### Failure Handling

- **Stop after 3 failed attempts** on any task
- Check `test-utils/msw/handlers.ts` for network-related test failures
- Run failing tests locally: `npx vitest <path> --run`
- Avoid repeating failed tool calls

### Component Development Pattern

1. Create component folder structure
2. Write failing test first
3. Implement component following existing patterns
4. Ensure TypeScript strict compliance
5. Run validation gate
6. Use Playwright MCP for visual verification

### GitHub Workflow (Required for Feature Development)

**Step-by-Step Process:**

1. **Create GitHub Issue**
   ```bash
   gh issue create --title "Feature: description" --body "Detailed requirements..."
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b {ticket-number}-{feature-name}
   # Example: git checkout -b 621-display-single-posts
   ```

3. **Development Process**
   ```bash
   # Always format before committing to avoid pre-commit hook amendments
   npm run format

   # Run validation gate
   npm run lint
   npm run typecheck
   npm run test

   # Validate with Playwright if UI changes
   npm run dev  # Use Playwright MCP to test functionality
   ```

4. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: descriptive commit message

   Fixes #{issue-number}

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>"

   # If pre-commit hooks modify files, amend the commit
   git add . && git commit --amend --no-edit

   git push -u origin {branch-name}
   ```

5. **Create Pull Request**
   ```bash
   gh pr create --title "feat: description" --body "Summary and test plan"
   ```

6. **Request Code Review**
   - Claude Code will automatically review the PR on GitHub
   - Coolify will generate ephemeral environment for testing
   - Address any review feedback and push updates

**Important Notes:**
- Always run `npm run format` before committing to avoid amendment cycles
- Use conventional commit format: `feat:`, `fix:`, `refactor:`, etc.
- Include issue number: `Fixes #123`
- Test in ephemeral environment before merging

## Environment Setup

### Prerequisites

- **Node.js**: v22 (see `.nvmrc`)
- **npm**: v11+
- **Reddit API credentials**: Required for development

### Environment Configuration

```bash
cp .env.example .env
# Add Reddit credentials:
REDDIT_CLIENT_ID="your_client_id_here"
REDDIT_CLIENT_SECRET="your_client_secret_here"
```

Create Reddit app at: <https://www.reddit.com/prefs/apps> (type: "personal use script")

## Common Issues & Debugging

### Test Failures

- **Network-related**: Check `test-utils/msw/handlers.ts` first
- **Flaky tests**: Ensure `userEvent.setup()` per test and reset mocks between tests
- **TypeScript errors**: Run `npm run typecheck` and inspect top-level failing files

### Build Issues

- **Google Fonts in CI**: Prefer `npm run dev` locally or self-host fonts in CI
- **Missing types**: Run `npm run typegen` to regenerate Reddit API types
- **Long-running commands**: Abort if exceeding 2x expected timeout

### Reporting Requirements

- Include exact commands run and their exit codes
- Attach full `npm run typecheck` and `npm run test` outputs for failing CI gates
- Include Playwright MCP snapshots for UI issues
- Report concise delta: files changed, tests run (PASS/FAIL), next steps

## Operational Timeouts

Reference timeouts from copilot-instructions.md:

- **Install**: 60s
- **Type generation**: 60s
- **Test suite**: 120s
- **Lint**: 30s

## Code Quality Standards

### Comment Guidelines

- Do NOT insert superfluous comments or explanatory comments
- Do NOT leave comments explaining why you changed something from a previous edit
- Only add comments when documenting complex business logic or non-obvious Next.js patterns
- Let code be self-documenting through clear naming and structure
- Focus on code clarity over comment density
