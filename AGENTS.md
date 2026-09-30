<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Viewer for Reddit

Version 10 of [Viewer for Reddit](https://github.com/gregrickaby/viewer-for-reddit), live at <https://reddit-viewer.com>: a ground-up, server-first rewrite. Version 9 (Mantine) is preserved in the `9.1.0` tag; don't port code from it.

## Stack

Next.js canary (App Router, Cache Components, Partial Prerendering, typed routes, React Compiler) · React 19.3 · TypeScript (strict) · CSS Modules with cascade layers · Zod 4 · iron-session (sealed cookies) · sanitize-html · hls.js · Vitest 5 + Testing Library + happy-dom · Playwright against a mock Reddit · ESLint + Stylelint + Prettier.

## Not what you know

- **Reddit API**: Reddit disabled public, unauthenticated REST access in June 2026. Every request here is authenticated through `oauth.reddit.com`. Differs from your training data. Docs: <https://www.reddit.com/dev/api>.
- **Next.js**: see the block above. Read `node_modules/next/dist/docs/` before using an API, and heed deprecations (for example, `next/image` `priority` is now `preload`).

## Commands

```bash
npm run check         # CSS module types + typecheck + lint + unit tests with coverage. REQUIRED before done
npm run format        # Prettier (CI runs format:check)
npm run test:watch    # Vitest in watch mode
npm run test:e2e      # Playwright: builds the app and runs it against e2e/mock-reddit (no credentials)
npm run build         # Production build
```

**Secrets**: copy `.env.example` to `.env.local`: `BASE_URL`, `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_REDIRECT_URI`, `SESSION_SECRET`, `USER_AGENT`, `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`, optional `GOOGLE_SITE_VERIFICATION`, optional Datadog (`DD_API_KEY`, `DD_APPLICATION_ID`, `DD_CLIENT_TOKEN`, `DD_SITE`, `DD_SERVICE`, `DD_ENV`). Server code logs through `lib/datadog/server.ts` (never `console`); browser code through `lib/datadog/client.ts`. `lib/env.ts` validates them at startup, except the encryption key, which Next reads itself.

## Architecture rules

- **Server-first.** The browser never fetches Reddit or JSON: reads happen in Server Components, writes in Server Actions (`app/actions/`). Client components are small islands (`components/islands/`) for optimistic UI and media playback. No client-side data fetching.
- **One Reddit client.** `lib/reddit/client.ts` `redditFetch()` is the only place that calls Reddit. It adds auth, the User-Agent, and `raw_json=1`, tracks the rate-limit budget, and throws typed errors (`lib/reddit/errors.ts`). Callers validate the JSON with a Zod schema (`lib/reddit/schemas/`) and map it to view models (`lib/view-models.ts`).
- **The session derives the token.** Reads and writes call `requireAuth()` themselves, so no caller can act as someone else. Validate every name or id from the URL or a form with `lib/reddit/names.ts` before it reaches an API path.
- **Failed reads** go through `handleReadError()` (`lib/reddit/read-errors.ts`): 401 signs out, 404 is `notFound()`, 403 returns a reason for `ForbiddenPanel`, anything else reaches the section's `SectionError` boundary.
- **Server Actions** validate input, run their work in `runAction()`, and return an `ActionResult`. Nothing raw reaches the client. Forms that must show errors without JavaScript use a `…Form` action with `ActionForm` (`useActionState`); optimistic islands use `useEnhancedForm`.
- **Reddit HTML** reaches the page only as `SafeHtml` from `sanitizeRedditHtml()`, rendered by `RedditHtml`. Every media URL passes `safeMediaUrl()` / `safeLinkUrl()` (`lib/media/url.ts`).
- **URL state.** Sorts, cursors, tabs, and expanded comments live in the URL (`lib/url-state.ts`), so every view is a link.
- **SEO.** Only `/`, `/about`, and `/donate` are indexable (`PUBLIC_PAGES` in `lib/site.ts`, shared by `proxy.ts`, `app/robots.ts`, and `app/sitemap.ts`). The signed-in shell is `noindex`. Site name, copy, and links live in `lib/site.ts`.

## Conventions

**Never:**

- Start the dev server; the user manages it.
- Fetch from the client, or call Reddit anywhere but `redditFetch()`.
- Use `any`, or the `NEXT_PUBLIC_` env prefix.
- Use `memo()`, `useCallback()`, or `useMemo()`: the React Compiler handles it.
- Use barrel files.
- Render HTML with `dangerouslySetInnerHTML` outside `RedditHtml` and the root layout's theme script.
- Add superfluous comments. Match the surrounding comment density and cite the reason, not the change.
- Commit plans. Plans are internal: keep them in a temp directory, not in the repo.
- Skip `npm run check` before declaring work complete.

**Always:**

- Put styles in CSS Modules inside `@layer components`, using the design tokens in `app/styles/tokens.css`.
- Keep links and forms working without JavaScript where they do today.
- Write prose (UI copy, docs, commit messages) following [writing-style.md](./.claude/rules/writing-style.md): no emoji, no em dashes, plain verbs.
- Minimize subagent spawning. Each one is a separate billed request; use Read/Grep/Bash for known files and symbols.

**Ask before**: changing the auth flow, adding dependencies, committing, or pushing.

**Definition of done**: `npm run format:check`, `npm run check`, and `npm run build` pass, with 90%+ coverage (enforced). Run `npm run test:e2e` when a change touches a user flow.
