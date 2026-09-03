# Project Conventions

**Never:**

- Add superfluous comments or mention decisions
- Import `lib/datadog/server.ts` in Client Components
- Manually edit `lib/types/reddit-api.ts`
- Mock `global.fetch` in tests, use MSW v2
- Nest functions more than 4 levels deep
- Re-exports should use "export...from" syntax
- Skip `npm run validate` before declaring complete
- Start the dev server, user manages it
- String literals with escaped backslashes should use `String.raw` template literals - except Next.js special config exports (e.g. `proxy.ts`'s `matcher` array): Next's static analyzer rejects tagged templates there and the build fails with "Invalid segment configuration export detected," so use an escaped string literal in those specific spots
- Use `"any"` type or `NEXT_PUBLIC_` env prefix
- Use `index` for array keys
- Use `memo()`, `useCallback()`, or `useMemo()`: React Compiler handles this
- Use `useState` + `useTransition` for optimistic updates: use `useOptimistic` inside `startTransition`
- Use barrel files

**Always:**

- Add proper JSDocs to functions
- Race condition guard: `if (isPending) return` at the start of async handlers
- Sanitize user HTML: `sanitizeText()` before any `dangerouslySetInnerHTML`
- Type props with `Readonly<>`
- Use `error.tsx` / `loading.tsx` for route-level boundaries, not manual wrappers
- Wrap Next.js `<Link>` with `<Anchor component={Link}>`
- `"use server"` only on files that exclusively export async server action functions

**Ask before**: modifying auth flow, changing API structure, adding dependencies, or committing.

**Definition of done**: `npm run validate` + `npm run test` + `npm run build` all pass, SonarQube IDE analysis checked. Test coverage 90%+. No exceptions.
