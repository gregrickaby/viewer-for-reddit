---
paths:
  - '**/*.test.ts'
  - '**/*.test.tsx'
---

# Test Writing Guidelines

Vitest 5 + Testing Library + MSW v2 + jest-axe.

Vitest 5 guide: https://vitest.dev/guide/migration.md

## Vitest 5 behavior (differs from v4 - don't assume v4 semantics)

- **`clearMocks` defaults to `true`** in v5 (this repo doesn't override it) - mock call history is auto-cleared before every test. A manual `vi.clearAllMocks()` in `beforeEach` is redundant but harmless; don't rely on a mock's call history surviving from one test into the next.
- **`vi.mock()` / `vi.hoisted()` not at true module top level is now a hard error**, not a warning - keep them above all imports (see the ordering gotcha below), never inside a function, conditional, or `describe`/`beforeEach` block.
- **Unawaited `.resolves`/`.rejects` now fail the test** instead of just warning - always `await expect(promise).resolves.toBe(...)` / `await expect(promise).rejects.toThrow(...)`.
- **`toThrow('')` now matches any error message** (substring match against everything), not just an error with an empty message - if you actually need to assert an empty message, use `toThrow(/^$/)`.

## Critical rules

- Coverage expectations 90%+ statements, branches, functions, and lines.
- **Never mock `global.fetch`, `axios`, or any HTTP client** - use MSW v2 handlers (`http`, `HttpResponse`, `server` from `@/test-utils`)
- **Never use `eslint-disable` or `@ts-ignore`** to bypass a failing test - fix the underlying issue
- **Never assert CSS values or CSS variables**
- **Import `act`, `render`, `screen`, `renderHook`, `waitFor`, `user`, `http`, `HttpResponse`, `server` from `@/test-utils`**, not from `vitest`/`@testing-library/*` directly - `@/test-utils` wraps them with project providers and preconfigured mocks
- **Mock server actions** (`vi.mock('@/lib/actions/...')`) when testing hooks that call them - actions read env vars at import time, before `vi.stubEnv()` in `beforeAll` runs, so unmocked imports throw
- **Race condition guard test**: for any hook with `if (isPending) return`, add a test that fires the action twice and asserts the underlying call happened once
- No tautological assertions (e.g. `expect(true).toBe(true)`) - assert the real observable outcome instead
- Parameterize 3+ near-identical `it()` blocks with `it.each()` instead of copy-pasting
- Use specific matchers over generic ones: `toHaveLength(n)` not `.length` checks, `toBeNull()` not `toBe(null)`

## Gotchas specific to this codebase

**`vi.mock()` must come before the imports that use it** (hoisting requires this at the top of the file):

```typescript
vi.mock('@/lib/utils/env', () => ({getEnvVar: vi.fn(() => 'test-value')}))
import {getEnvVar} from '@/lib/utils/env' // uses the mock above
```

**Datadog is already globally mocked** in `vitest.setup.ts` (`@datadog/browser-rum`, `-rum-nextjs`, `-browser-logs`) - don't add your own `vi.mock()` for those. For server code importing `lib/datadog/server.ts`, mock it locally:

```typescript
vi.mock('@/lib/datadog/server', () => ({
  logger: {debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn()}
}))
```

**`next/image` and `next/cache`** are also globally mocked (plain `<img>`, stubbed `revalidatePath`/`revalidateTag`) - don't re-mock. For `next/headers` and `next/navigation`, mock per-file as needed:

```typescript
vi.mock('next/headers', () => ({cookies: vi.fn()}))
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({push: vi.fn(), refresh: vi.fn()})),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams())
}))
```

**Mantine hooks needing reactive updates must use a mutable variable**, not an object property - the hook mock won't see writes to a property on an already-captured object:

```typescript
let mockScrollY = 0
vi.mock('@mantine/hooks', () => ({
  useWindowScroll: vi.fn(() => [{x: 0, y: mockScrollY}])
}))
// later: mockScrollY = 250; render again to see the new value
```

**Never mock `useDebouncedValue`** when testing debounce behavior - use real timers and `await new Promise((r) => setTimeout(r, 350))`.

**Browser APIs** (`IntersectionObserver`, `MutationObserver`, `ResizeObserver`) are globally mocked via `test-utils/mocks/browserMocks.ts` - only redefine locally if a test needs to manually invoke the captured callback.

**Accessibility**: `jest-axe`'s `toHaveNoViolations` is registered globally - use it on interactive components:

```typescript
const {container} = render(<Component />)
expect(await axe(container)).toHaveNoViolations()
```

**Collapsible/animated sections** (Mantine Collapse/Accordion, modals): click the trigger and use `findBy*`/`waitFor` before asserting on content that appears post-animation - asserting immediately after `user.click()` is a common source of flaky failures here.

## Test setup (vitest.setup.ts)

Already configured, don't duplicate: MSW server (`onUnhandledRequest: 'warn'`, resets after each test), DOM shims, browser API mocks, `next/image`/`next/cache` mocks, stubbed env vars (`APP_URL`, `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `SESSION_SECRET`, `USER_AGENT`), `URLSearchParams` polyfill, console suppression (`error`/`warn`/`info`), jest-axe matcher.

## Placement & commands

Test files live next to source with `.test.ts`/`.test.tsx`.

Run `npm test` before declaring any task complete.

## MSW vs `vi.mock()`

**MSW** for integration tests, components calling `fetch()`, error boundaries, loading states.
**`vi.mock()`** for hooks with server actions, optimistic updates, cases needing precise per-test control.
