# Project Conventions

**Never:**

- Use barrel files (`lib/hooks/index.ts` is an exception, should migrate to direct imports)
- Use `"any"` type or `NEXT_PUBLIC_` env prefix
- Use `index` for array keys
- Re-exports should use "export...from" syntax
- Nest functions more than 4 levels deep
- String literals with escaped backslashes should use `String.raw` template literals - except Next.js special config exports (e.g. `proxy.ts`'s `matcher` array): Next's static analyzer rejects tagged templates there and the build fails with "Invalid segment configuration export detected," so use an escaped string literal in those specific spots
- Manually edit `lib/types/reddit-api.ts`
- Mock `global.fetch` in tests, use MSW v2
- Use `memo()`, `useCallback()`, or `useMemo()`: React Compiler handles this
- Use `useState` + `useTransition` for optimistic updates: use `useOptimistic` inside `startTransition`
- Import `lib/datadog/server.ts` in Client Components
- Start the dev server, user manages it
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

**Ask before**: modifying auth flow, changing API structure, adding dependencies, or committing.

**Definition of done**: `npm run validate` + `npm run build` all pass, SonarQube IDE analysis checked. No exceptions.

Arctic OAuth token handling (`tokens.accessToken()` as a method, not a property) lives in [reddit-api.md](./reddit-api.md), not here - see that file when touching `lib/actions/reddit/**`, `lib/auth/**`, or `app/api/**`.
