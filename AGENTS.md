# AI Agent Instructions

**Audience**: All AI agents (GitHub Copilot, Claude Code, Cursor, etc.)
**Purpose**: Machine-readable operational runbook for viewer-for-reddit
**Human Docs**: See [CONTRIBUTING.md](../CONTRIBUTING.md) for comprehensive developer guide

## Architecture Overview

- **Framework**: Next.js 15+ (App Router)
- **UI**: Mantine v8 component library. Please fetch official documentation from <https://mantine.dev/llms.txt>
- **API**: Reddit API v2 with OpenAPI spec and auto-generated types
- **Authentication**: Reddit OAuth 2.0 (Server Actions)
- **CI/CD**: GitHub Actions with validation gates
- **CSS**: CSS Modules with Mantine theming
- **Formatting**: Prettier
- **Linting**: ESLint with Mantine config
- **State Management**: Redux Toolkit + RTK Query
- **Testing**: Vitest + React Testing Library + MSW v2
- **TypeScript**: Strict mode enabled

## Core Development Commands

### Quality Gates (Required for all code changes)

```bash
npm run format      # Prettier formatting - auto-fixes formatting issues
npm run lint        # ESLint with Mantine config - must pass
npm run typecheck   # TypeScript strict checking - must pass
npm run test        # Vitest unit tests - must pass
npm run dev         # Start dev server. Review changes using Playwright MCP
```

**Critical**: Run these commands in sequence for any code changes. Stop if any step fails.

### Testing Commands

```bash
npm run test              # Run all unit tests
npm run coverage          # Run tests with coverage report (aim for 90%+)
npx vitest <component>    # Run specific component tests
npx vitest <path> --run   # Run failing tests locally for debugging
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
   npm run test
   ```

3. **For feature completion:**

   ```bash
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

- **Unit Tests**: Every component has `.test.tsx`
- **Integration Tests**: RTK Query + MSW mocking
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

## Architecture Patterns

### Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **UI**: Mantine v8 component library
- **State Management**: Redux Toolkit + RTK Query
- **Authentication**: Reddit OAuth 2.0 (Server Actions)
- **Testing**: Vitest + React Testing Library + MSW v2
- **TypeScript**: Strict mode enabled

### Component Structure (One per folder)

```text
components/ComponentName/
├── ComponentName.tsx           # Main component
├── ComponentName.module.css    # Styles
└── ComponentName.test.tsx      # Tests
```

### Server Actions Pattern

- `lib/actions/redditToken.ts` - OAuth token management
- Automatic token rotation and caching
- Error handling with retry logic

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

# Optional analytics (production only):
ENABLE_ANALYTICS="true"
ANALYTICS_SCRIPT_URL="https://your-analytics-provider.com/script.js"
ANALYTICS_ID="your-analytics-site-id"
```

Create Reddit app at: <https://www.reddit.com/prefs/apps> (type: "personal use script")

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

## GitHub Workflow (Feature Development)

**Required Process:**

1. **Create GitHub Issue**

   ```bash
   gh issue create --title "Feature: description" --body "Requirements..."
   ```

2. **Create Feature Branch**

   ```bash
   git checkout -b {ticket-number}-{feature-name}
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
   git commit -m "feat: descriptive commit message"

   # If pre-commit hooks modify files, amend the commit
   git add . && git commit --amend --no-edit

   git push -u origin {branch-name}
   ```

5. **Create Pull Request**

   ```bash
   gh pr create --title "feat: description" --body "Summary and test plan"
   ```

## Code Quality Standards

### Comment Guidelines

- Do NOT insert superfluous comments or explanatory comments
- Do NOT leave comments explaining why you changed something from a previous edit
- Only add comments when documenting complex business logic or non-obvious patterns
- Let code be self-documenting through clear naming and structure

### Important Instruction Reminders

- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (\*.md) or README files unless explicitly requested

## Operational Timeouts

Reference timeouts for automated agents:

- **Build**: 20s
- **Format**: 5s
- **Install**: 60s
- **Lint**: 30s
- **Test suite**: 120s
- **Type generation**: 60s
- **Typecheck**: 5s

Stop after 3 failed attempts on any task.
