# Project Guidelines

## Stack

Next.js 16 (App Router, React Compiler) · React 19 · TypeScript 6 (strict) · Mantine 9 · Arctic 3.x (Reddit OAuth2) · iron-session 8.x (encrypted sessions) · Datadog (`@datadog/browser-rum`, `-rum-nextjs`, `-browser-logs`, `dd-trace`) · Vitest v4 + Testing Library + MSW v2 + jest-axe · ESLint + Prettier · SonarQube (IDE plugin + Community Edition)

## Not what you know

- **Reddit API**: Reddit disabled public, unauthenticated REST API access in June 2026. Differs from your training data.
- **Next.js**: this version has breaking changes. APIs, conventions, and file structure may differ from your training data. Read `node_modules/next/dist/docs/` before writing code; heed deprecation notices.

## External Docs

- **Reddit API** https://www.reddit.com/dev/api
- **Mantine:** https://mantine.dev/llms.txt

## Commands

```bash
npm run validate      # Format + typecheck + lint, REQUIRED before completion
npm test              # Run tests
npm run test:coverage # Coverage report
npm run test:watch    # Run tests in watch mode
npm run test:ui       # Run tests with Vitest UI
npm run test:e2e      # Playwright end-to-end tests
npm run build         # Production build
npm run codegen       # Generate types from Reddit API (requires script app auth)
npm run sonar         # SonarQube analysis (~6 min)
```

**Secrets**: copy `.env.example` to `.env.local`: `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_REDIRECT_URI`, `SESSION_SECRET`, `BASE_URL`, `USER_AGENT`, `DD_API_KEY`, `DD_SITE`, `DD_APPLICATION_ID`, `DD_CLIENT_TOKEN`, `DD_SERVICE`.

## Always Active

- **Caveman skill, `full` mode**: active every session (persists per its own instructions). Drop for security warnings, irreversible-action confirmations, or on request for normal mode.
- **Writing style**: `.claude/rules/writing-style.md` has no `paths:` frontmatter, so it loads every session. Follow it for all prose.
- **Conventions**: `.claude/rules/conventions.md` has no `paths:` frontmatter, so it loads every session. Never/Always rules, ask-before list, definition of done.
- **Skill gap**: no skill covers the task, or unsure how: invoke `find-skills` before improvising.
- **Minimize subagent spawning**: each Agent/Task call is a separate billed request. Use Read/Grep/Bash directly for single-file lookups or known symbols. Reserve Explore for broad searches (3+ queries, unfamiliar territory); spawn other agents only when asked or when the task needs parallel, isolated work. If possible, choose a lower cost model to save on costs.

## Instructions

`.claude/rules/*.md` files. `reddit-api.md` and `testing-standards.md` use `paths:` frontmatter: load only when Claude reads a matching file. `conventions.md` and `writing-style.md` have no `paths:` field (unconditional, see Always Active):

| File                                                         | Covers                                             | Loads for                                                             |
| ------------------------------------------------------------ | -------------------------------------------------- | --------------------------------------------------------------------- |
| [reddit-api.md](./.claude/rules/reddit-api.md)               | Reddit API, auth, pagination                       | `lib/actions/**`, `lib/auth/**`, `app/api/**`, `lib/types/reddit*.ts` |
| [testing-standards.md](./.claude/rules/testing-standards.md) | Vitest, Testing Library, MSW v2                    | `**/*.test.ts`, `**/*.test.tsx`                                       |
| [conventions.md](./.claude/rules/conventions.md)             | Never/Always rules, ask-before, definition of done | every session (unconditional)                                         |
| [writing-style.md](./.claude/rules/writing-style.md)         | Prose style, AI vocabulary to avoid                | every session (unconditional)                                         |

## Core Conventions

**CLI tools**: CLI tools are the most context-efficient way to interact with external services. Reach for these before MCP servers.

- `gh`: Github CLI
- `pup`: Datadog CLI

**API calls in Server Actions**: `lib/actions/reddit/` (posts, users, subreddits, multireddits, search) and `lib/actions/auth/auth.ts` use `redditFetch<T>()` with `next: {revalidate}`.

**Datadog logging**: `lib/datadog/server.ts` (fetch-based Logs Intake client) is server-only; `lib/datadog/client.ts` (`@datadog/browser-logs`) is for Client Components. Same `logger.info/warn/error/debug(message, fields)` shape.

**Error tracking**: `instrumentation.ts` exports `onRequestError` (logs to Datadog). `dd-trace` APM initializes via `NODE_OPTIONS='--require dd-trace/init'` in `dev`/`start` scripts, not `instrumentation.ts` (must patch Node's module loader before Next.js loads). `instrumentation-client.ts` initializes Datadog RUM + Browser Logs; error boundaries call `addNextjsError()` from `@datadog/browser-rum-nextjs` for RUM correlation.

**Route group**: `(shell)` wraps browsable pages with a shared layout (sidebar, header); `about` and `donate` are standalone outside it. Nested `(shell)/(protected)` gates `/r/*`, `/u/*`, `/search/*`, `/user/*` with a layout-level `isAuthenticated()` redirect to `/`, a second line of defense alongside `proxy.ts` middleware, which already blocks these paths for anonymous requests.

**Hooks architecture**: `lib/hooks/` holds feature hooks and reusable primitives (`useOptimisticToggle`, `useOptimisticMutation`); all client-only.

**Custom errors**: `lib/utils/errors.ts` defines `AppError`, `RedditAPIError`, `AuthenticationError`, `RateLimitError`, `NotFoundError`. Use these, not raw `Error`.

**Test utilities**: `test-utils/` provides custom `render`, `renderHook`, pre-configured `user`, MSW `server`, and handler mocks. Import from `@/test-utils`, not Testing Library directly.

**Middleware**: `proxy.ts` (with `proxy.test.ts`) handles auth enforcement and `X-Robots-Tag` headers. No per-request logging: fires on every navigation, was pure noise in Datadog.

## Rules

See [conventions.md](./.claude/rules/conventions.md) (loads every session, unconditional) for the Never/Always rules, ask-before list, and definition of done.
