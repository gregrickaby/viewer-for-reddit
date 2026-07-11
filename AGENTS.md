# Project Guidelines

## Tech Stack

| Package                              | Purpose                                                                      |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| Next.js 16                           | App Router, React Compiler                                                   |
| React 19                             | Server Components (default), Client Components (`"use client"`)              |
| TypeScript 5                         | Strict mode                                                                  |
| Mantine 9                            | UI components                                                                |
| Arctic 3.x                           | OAuth2 with Reddit                                                           |
| iron-session 8.x                     | Encrypted sessions                                                           |
| Axiom                                | Structured logging (`@axiomhq/logging`, `@axiomhq/nextjs`, `@axiomhq/react`) |
| Vitest v4 + Testing Library + MSW v2 | Testing                                                                      |
| ESLint + Prettier                    | Linting and formatting                                                       |
| SonarQube                            | Static analysis (IDE plugin + Community Edition)                             |

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## External Docs

- **Reddit for Developers** https://developers.reddit.com/docs/llms.txt
- **Mantine:** https://mantine.dev/llms.txt
- **Axiom:** https://axiom.co/docs/llms.txt

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

## Instructions

Instructions:

- Do NOT preemptively load all references - use lazy loading based on actual need
- When loaded, treat content as mandatory instructions that override defaults
- Follow references recursively when needed

| File                                                                                          | Covers                                      |
| --------------------------------------------------------------------------------------------- | ------------------------------------------- |
| [reddit-api.instructions.md](./.agents/instructions/reddit-api.instructions.md)               | Reddit API, auth, pagination, rate limiting |
| [testing-standards.instructions.md](./.agents/instructions/testing-standards.instructions.md) | Vitest, Testing Library, MSW v2 patterns    |
| [writing-style.instructions.md](./.agents/instructions/writing-style.instructions.md)         | Prose style, AI vocabulary to avoid         |

## Skills

Load with the `skill` tool when the task matches:

| Skill                           | When to load                                                              |
| ------------------------------- | ------------------------------------------------------------------------- |
| `implement-github-issue`        | User pastes a GitHub issue URL or says "implement issue #N"               |
| `improve-codebase-architecture` | Refactoring, testability, module consolidation                            |
| `next-best-practices`           | File conventions, RSC boundaries, data patterns, metadata, error handling |
| `next-cache-components`         | PPR, `use cache`, `cacheLife`, `cacheTag`                                 |
| `update-instructions`           | After major feature additions or when instructions feel stale             |
| `vercel-react-best-practices`   | React/Next.js performance, bundle optimization                            |

## Core Conventions

**Server Components by default** — only add `"use client"` for interactivity (hooks, events, browser APIs).

**API calls in Server Actions** — `lib/actions/reddit/` (posts, users, subreddits, multireddits, search) and `lib/actions/auth/auth.ts` use `redditFetch<T>()` with `next: {revalidate}`.

**React 19 Compiler** — handles memoization automatically.

**Axiom logging** — `lib/axiom/server.ts` is server-only; use `lib/axiom/client.ts` in Client Components.

**Error tracking** — `instrumentation.ts` wires Axiom's `createOnRequestError` for server-side error logging.

**Route group** — `(shell)` wraps all browsable pages with a shared layout (sidebar, header). Pages outside `(shell)` (about, donate) are standalone.

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
- Import `lib/axiom/server.ts` in Client Components
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
