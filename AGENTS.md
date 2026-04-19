# Project Guidelines

## Tech Stack

- **Next.js 16** - App Router, React Compiler
- **React 19** - Server Components (default), Client Components ("use client")
- **TypeScript 5** - Strict mode
- **Mantine v9** - UI component library
- **Arctic 3.x** - OAuth2 with Reddit
- **iron-session 8.x** - Encrypted sessions
- **Axiom** - Structured logging (`@axiomhq/nextjs`, `@axiomhq/js`, `@axiomhq/react`)
- **Vitest v4** + **Testing Library** + **MSW v2** - Testing
- **ESLint** + **Prettier** - Linting and formatting
- **SonarQube for IDE** - Real-time static code analysis
- **SonarQube Community Edition** - Static code analysis

## Key Commands

```bash
npm run validate      # Format + typecheck + lint (REQUIRED before completion)
npm test              # Run tests
npm run test:coverage # Run tests with coverage report
npm run build         # Production build
npm run typegen       # Generate types from Reddit API
npm run sonar         # Run SonarQube analysis (takes ~6 mins)
```

## Documentation

For detailed guidelines on specific topics, refer to:

- [Reddit API Patterns](./.agents/instructions/reddit-api.instructions.md) - API endpoints, authentication, rate limiting
- [Testing Standards](./.agents/instructions/testing-standards.instructions.md) - Vitest, Testing Library, MSW patterns
- [Mantine](https://mantine.dev/llms.txt) - UI library patterns and best practices

These specialized instructions apply automatically when editing relevant files via `applyTo` patterns.

## Core Patterns

**Server Components by Default** - No `"use client"` needed. Only add for interactivity (hooks, events, browser APIs).

**All API Calls in Server Actions** - `/lib/actions/reddit.ts` and `/lib/actions/auth.ts` use Next.js `fetch()` with `next: {revalidate}` for caching and automatic request deduplication.

**React 19 Compiler** - Automatically handles memoization. Never use `memo()`, `useCallback()`, or `useMemo()`.

**Critical Conventions**:

- Arctic OAuth tokens are **methods**: `tokens.accessToken()` NOT `.accessToken` property
- Use `error.tsx` for route-level error boundaries (not manual `<ErrorBoundary>` in pages)
- Use `loading.tsx` for route-level loading states (not manual `<Suspense>` in pages)
- Prevent race conditions: `if (isPending) return` at start of all async handlers
- Sanitize user HTML with `sanitize-html` via `sanitizeText()` before rendering
- `dangerouslySetInnerHTML` is allowed only with sanitized input via `sanitizeText()`
- Wrap Next.js `<Link>` with Mantine `<Anchor component={Link}>`
- Props typed with `Readonly<>`, avoid `any`
- Never use `NEXT_PUBLIC_` env prefix (all server-side only)
- Never use ENV vars or functions in Client Components
- Axiom server logger (`lib/axiom/server.ts`) is server-only — never import it in Client Components; use `lib/axiom/client.ts` on the client
- Request logging and `X-Robots-Tag` headers are handled in `proxy.ts` (the Next.js middleware equivalent)
- Always run `npm run validate` before completion
- Always check SonarQube for IDE local analysis issues before completion

## Always do

- Run `npm run validate` before declaring task complete

## Never Do

- Access Arctic tokens as properties (use methods: `.accessToken()`, see [Reddit API Patterns](./.agents/instructions/reddit-api.instructions.md))
- Use `NEXT_PUBLIC_` env prefix
- Manually edit `/lib/types/reddit-api.ts`
- Skip `npm run validate` before completion
- Use 'any' type
- Add superfluous comments or tests
- Start dev server (user manages it)
- Mock `global.fetch` in tests (use MSW v2, see [Testing Standards](./.agents/instructions/testing-standards.instructions.md))
- Use `memo()`, `useCallback()`, or `useMemo()` (React Compiler handles optimization)
- Use `useState` + `useTransition` for optimistic updates — use `useOptimistic` inside `startTransition` instead

⚠️ **Ask before**: Modifying authentication flow, changing API structure, adding dependencies, or committing changes

Suggest updates to documentation if you find incomplete or conflicting information.
