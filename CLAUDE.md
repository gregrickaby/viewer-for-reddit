# Project Guidelines

## Tech Stack

| Package                              | Purpose                                                                                                     |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Next.js 16                           | App Router, React Compiler                                                                                  |
| React 19                             | Server Components (default), Client Components (`"use client"`)                                             |
| TypeScript 5                         | Strict mode                                                                                                 |
| Mantine 9                            | UI components                                                                                               |
| Arctic 3.x                           | OAuth2 with Reddit                                                                                          |
| iron-session 8.x                     | Encrypted sessions                                                                                          |
| Datadog                              | Logs, RUM, APM (`@datadog/browser-rum`, `@datadog/browser-rum-nextjs`, `@datadog/browser-logs`, `dd-trace`) |
| Vitest v4 + Testing Library + MSW v2 | Testing                                                                                                     |
| ESLint + Prettier                    | Linting and formatting                                                                                      |
| SonarQube                            | Static analysis (IDE plugin + Community Edition)                                                            |

## This is NOT the reddit API you know

In June 2026, Reddit disabled all public/unauthenticated access to their REST APIs. This is different than your training data.

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## External Docs

- **Reddit for Developers** https://developers.reddit.com/docs/llms.txt
- **Mantine:** https://mantine.dev/llms.txt
- **Datadog:** https://docs.datadoghq.com/

## Commands

```bash
npm run validate      # Format + typecheck + lint — REQUIRED before completion
npm test              # Run tests
npm run test:coverage # Coverage report
npm run test:watch    # Run tests in watch mode
npm run test:ui       # Run tests with Vitest UI
npm run build         # Production build
npm run codegen       # Generate types from Reddit API (requires script app auth)
npm run sonar         # SonarQube analysis (~6 min)
```

**Secrets** — copy `.env.example` to `.env.local`: `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `SESSION_SECRET`, `DD_API_KEY`, `DD_SITE`, `DD_APPLICATION_ID`, `DD_CLIENT_TOKEN`, `DD_SERVICE`.

## Always Active

- **Caveman skill, `full` mode** — invoke the `caveman` skill at the start of every conversation and keep it active all session (it persists per its own instructions). Drop only for security warnings, irreversible-action confirmations, or if the user asks for normal mode.
- **Writing style** — `.claude/rules/writing-style.md` is auto-loaded every session; follow it for all prose.
- **Skill gap** — no known skill covers task, or unsure how to do something: invoke `find-skills` to search/install one before improvising.

## Instructions

`.claude/rules/*.md` files are auto-loaded every session as mandatory project instructions (not lazy-loaded, unlike Skills below):

| File                                                         | Covers                                   |
| ------------------------------------------------------------ | ---------------------------------------- |
| [reddit-api.md](./.claude/rules/reddit-api.md)               | Reddit API, auth, pagination             |
| [testing-standards.md](./.claude/rules/testing-standards.md) | Vitest, Testing Library, MSW v2 patterns |
| [writing-style.md](./.claude/rules/writing-style.md)         | Prose style, AI vocabulary to avoid      |

## Skills

Load with the `skill` tool when the task matches (lazy-loaded on demand):

| Skill                               | When to load                                                           |
| ----------------------------------- | ---------------------------------------------------------------------- |
| `next-cache-components-adoption`    | Turn on Cache Components in a Next.js app and resolve blocking routes  |
| `next-cache-components-optimizer`   | Drive a Next.js route to instant navigation via agentic loop           |
| `next-dev-loop`                     | Verify Next.js runtime behavior after editing app code                 |
| `next-partial-prefetching-adoption` | Turn on Partial Prefetching in a Next.js app and work through insights |
| `update-instructions`               | After major feature additions or when instructions feel stale          |
| `vercel-react-best-practices`       | React/Next.js performance, bundle optimization                         |

`caveman` and `find-skills` always active (see Always Active above) — not loaded on demand.

**Datadog** — observability (logs, RUM, APM traces, dashboards, monitors) lives on the `plugin:datadog:mcp` MCP server. Use the `datadog:ddsetup`/`datadog:ddconfig`/`datadog:ddtoolsets` skills to manage the server itself.

## Core Conventions

**Server Components by default** — only add `"use client"` for interactivity (hooks, events, browser APIs).

**API calls in Server Actions** — `lib/actions/reddit/` (posts, users, subreddits, multireddits, search) and `lib/actions/auth/auth.ts` use `redditFetch<T>()` with `next: {revalidate}`.

**React 19 Compiler** — handles memoization automatically.

**Datadog logging** — `lib/datadog/server.ts` (fetch-based Logs Intake client) is server-only; use `lib/datadog/client.ts` (`@datadog/browser-logs`) in Client Components. Both expose the same `logger.info/warn/error/debug(message, fields)` shape.

**Error tracking** — `instrumentation.ts` exports `onRequestError` (logs to Datadog). `dd-trace` APM is initialized via `NODE_OPTIONS='--require dd-trace/init'` in the `dev`/`start` scripts, not in `instrumentation.ts` (dd-trace must patch Node's module loader before Next.js is first required). `instrumentation-client.ts` initializes Datadog RUM + Browser Logs; error boundaries call `addNextjsError()` from `@datadog/browser-rum-nextjs` for RUM correlation.

**Route group** — `(shell)` wraps all browsable pages with a shared layout (sidebar, header). Pages outside `(shell)` (about, donate) are standalone. Nested `(shell)/(protected)` gates `/r/*`, `/u/*`, `/search/*`, `/user/*` with a layout-level `isAuthenticated()` redirect to `/` — second line of defense alongside `proxy.ts` middleware, which already blocks these paths for anonymous requests.

**Hooks architecture** — `lib/hooks/` contains feature hooks and reusable primitives (`useOptimisticToggle`, `useOptimisticMutation`). All hooks are client-only.

**Custom errors** — `lib/utils/errors.ts` defines `AppError`, `RedditAPIError`, `AuthenticationError`, `RateLimitError`, `NotFoundError`. Use these, not raw `Error`.

**Test utilities** — `test-utils/` provides custom `render`, `renderHook`, pre-configured `user`, MSW `server`, and handler mocks. Import from `@/test-utils`, not directly from Testing Library.

**Middleware** — `proxy.ts` (with `proxy.test.ts`) handles request logging and `X-Robots-Tag` headers.

## Rules

**Never:**

- Use barrel files (`lib/hooks/index.ts` is an exception that should be migrated to direct imports)
- Use `"any"` type or `NEXT_PUBLIC_` env prefix
- Access Arctic tokens as properties — use methods: `tokens.accessToken()`
- Manually edit `lib/types/reddit-api.ts`
- Mock `global.fetch` in tests — use MSW v2
- Use `memo()`, `useCallback()`, or `useMemo()` — React Compiler handles this
- Use `useState` + `useTransition` for optimistic updates — use `useOptimistic` inside `startTransition`
- Import `lib/datadog/server.ts` in Client Components
- Start the dev server — user manages it
- Skip `npm run validate` before declaring complete

**Always:**

- `"use server"` only on files that exclusively export async server action functions
- Race condition guard: `if (isPending) return` at the start of async handlers
- Sanitize user HTML: `sanitizeText()` before any `dangerouslySetInnerHTML`
- Wrap Next.js `<Link>` with `<Anchor component={Link}>`
- Type props with `Readonly<>`
- Use `error.tsx` / `loading.tsx` for route-level boundaries, not manual wrappers
- Run `npm run validate` and `npm run build` before declaring complete
- Check SonarQube IDE analysis before declaring complete

⚠️ **Ask before:** modifying auth flow, changing API structure, adding dependencies, or committing.

**Definition of done:** `npm run validate` + `npm run test` + `npm run build` all pass, SonarQube IDE analysis checked. No exceptions.
