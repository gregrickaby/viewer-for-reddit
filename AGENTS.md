# Project Guidelines

## Tech Stack

| Package                              | Purpose                                                                 |
| ------------------------------------ | ----------------------------------------------------------------------- |
| Next.js 16                           | App Router, React Compiler                                              |
| React 19                             | Server Components (default), Client Components (`"use client"`)         |
| TypeScript 5                         | Strict mode                                                             |
| Mantine 9                            | UI components                                                           |
| Arctic 3.x                           | OAuth2 with Reddit                                                      |
| iron-session 8.x                     | Encrypted sessions                                                      |
| Axiom                                | Structured logging (`@axiomhq/nextjs`, `@axiomhq/js`, `@axiomhq/react`) |
| Vitest v4 + Testing Library + MSW v2 | Testing                                                                 |
| ESLint + Prettier                    | Linting and formatting                                                  |
| SonarQube                            | Static analysis (IDE plugin + Community Edition)                        |

<!-- BEGIN:nextjs-agent-rules -->

## Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

## External Docs

- **Mantine:** https://mantine.dev/llms.txt
- **Axiom:** https://axiom.co/docs/llms.txt

## Commands

```bash
npm run validate      # Format + typecheck + lint — REQUIRED before completion
npm test              # Run tests
npm run test:coverage # Coverage report
npm run build         # Production build
npm run typegen       # Generate types from Reddit API
npm run sonar         # SonarQube analysis (~6 min)
```

## Instructions

Auto-applied by `applyTo` glob patterns:

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

**API calls in Server Actions** — `lib/actions/reddit/` (posts, users, subreddits, multireddits, search) and `lib/actions/auth.ts` use Next.js `fetch()` with `next: {revalidate}`.

**React 19 Compiler** — handles memoization automatically.

**Axiom logging** — `lib/axiom/server.ts` is server-only; use `lib/axiom/client.ts` in Client Components.

**Middleware** — request logging and `X-Robots-Tag` headers live in `proxy.ts`.

## Rules

**Never:**

- Use barrel files
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
