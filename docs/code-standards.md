# Code standards

How code in this repo is written. `AGENTS.md` covers the architecture: the single Reddit client, the session, Server Actions, and URL state. This file covers the code itself. ESLint, Stylelint, and Prettier enforce the rules marked (lint). Review catches the rest.

## TypeScript

- Strict mode, with `noUncheckedIndexedAccess`. No `any` (lint): narrow `unknown` with a Zod schema or a type guard.
- Object shapes are `interface` (lint). Use `type` for unions, tuples, function types, `z.infer`, and mapped or derived types (`Pick<...>`).
- Import types with `import type` or an inline `type` specifier (lint).
- Import React types by name (`import type { ReactNode } from 'react'`), not through the `React` namespace (lint).

## Modules

- Named exports only (lint). Default exports are for files Next.js or a tool loads by default: route files (`page`, `layout`, `error`, `not-found`, `sitemap`, and the rest) and `*.config.ts`.
- No barrel files. Import from the module that defines the thing.
- Imports sort into three groups, separated by a blank line: packages (Node built-ins, then `next` and `react`, then the rest), `@/` paths, and `./` siblings. Prettier sorts them on format (lint). Side-effect imports (`import 'server-only'`, global CSS) stay where they are, so put them first.
- Import from another folder with `@/`, and from the same folder with `./` (lint bans `../`).
- Modules in `lib/reddit/`, `lib/media/`, `lib/auth/`, and `lib/env.ts` start with `import 'server-only'` (lint). Islands may import only types from them (lint).
- A module that islands share with the server (`lib/view-models.ts`, `lib/url-state.ts`, `lib/format.ts`) holds types or pure functions only.

## Functions and components

- Top-level functions are function declarations (lint). Arrow functions are for callbacks, inline handlers, and consts with a type annotation (`const spoiler: sanitizeHtml.Transformer = ...`).
- Server Components by default. Client code lives in `components/islands/` and never fetches (lint).
- Type props inline in the signature. Name them with an `interface` (`PostCardProps`) only when another module uses the type.
- A component file may also export its skeleton (`PostCardSkeleton`) and the small pure helpers its tests need.
- No `memo()`, `useCallback()`, or `useMemo()`: the React Compiler handles it.
- JSX props are sorted alphabetically (lint).

## Naming

- Files are kebab-case (`post-card.tsx`). A component's CSS Module sits beside it with the same name (`post-card.module.css`).
- Components are PascalCase, functions and variables camelCase, and module-level constants SCREAMING_SNAKE_CASE (`PAGE_SIZE`, `MAX_LIVE_COMMENTS`).
- Zod schemas are PascalCase like the shape they parse (`LinkThing`, `Fullname`). View models for what a page shows end in `View` (`PostView`, `SubredditView`).
- CSS Module classes are camelCase (lint).
- Getters start with `get`, predicates with `is` or `has`, mappers with `map`, and validators of names and ids live in `lib/reddit/names.ts` as `isX`.

## Comments

- Comments say why, not what. Match the density of the code around them.
- Exports get a `/** */` summary when the name and types don't already say what they do. Add `@param` and `@returns` only when they say something the signature doesn't.
- No comments that point to tickets, plans, phases, or documents outside the repo.
- Comments follow the writing rules below, like the rest of the prose.

## Styles

- CSS Modules, with every rule inside `@layer components` (lint).
- Colors come from the tokens in `app/styles/tokens.css` (lint). `light-dark()` handles the themes.
- Inline `style` only for values computed from data, such as an aspect ratio or a flair color.

## Errors

- Reddit failures are the typed errors in `lib/reddit/errors.ts`. Reads hand them to `handleReadError()`; Server Actions wrap their work in `runAction()` and return an `ActionResult`.
- Server Actions validate every input before doing anything, and return `invalid()` with a message a reader can act on.
- Client code that awaits a Server Action also handles a rejected promise (a dropped connection, a 5xx from the proxy), so nothing stays stuck in a loading state.
- App code logs through `lib/datadog/server.ts` on the server and `lib/datadog/client.ts` in the browser, never `console`. Scripts in `scripts/` may print to the console.

## Tests

- Unit tests live in `tests/unit/`, grouped like the source. Component tests start with `// @vitest-environment happy-dom`.
- Name tests by behavior: `it('offers a retry when the connection drops, instead of loading forever')`.
- Assert on output (rendered HTML, returned results), not on which internal functions ran. When matching rendered HTML, match the attribute you care about (`toMatch(/<h1 [^>]*id="post-abc-title"/)`) instead of a whole tag, so prop order doesn't break the test.
- Rendered HTML escapes quotes: expect `can&#x27;t` and `&quot;zzz&quot;` in server output, and plain text in DOM `textContent`.
- A test that changes shared fixtures or mocks resets them in `afterEach`, so a failed assertion can't leak into the next test.
- Coverage stays at or above the thresholds in `vitest.config.ts` (95%).

## Writing

UI copy, comments, docs, and commit messages follow these rules:

- Straight quotes and apostrophes (`'` and `"`), never curly ones. In JSX text, use `&apos;` and `&quot;`.
- No em dashes. Use a comma, colon, or parentheses.
- Sentence case for headings, buttons, and labels.
- Plain verbs: "is", "has", "use". Skip filler words such as "delve", "robust", "seamless", "leverage", and "ensure".
- Say the specific thing. "Couldn't load your saved items" beats "Something went wrong".
- No emoji.
