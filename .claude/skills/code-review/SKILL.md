---
name: code-review
model: claude-opus-5-5
description: Review changed code in Viewer for Reddit against its architecture rules and conventions, and fix issues before committing.
---

# Code Review

**Triggers:** "review my code", "do a code review", `/code-review`

Goal: catch everything a careful human reviewer would flag before the change is committed.

## Steps

### 1. Collect changed files

```bash
git diff --name-only HEAD
```

Deduplicate. Keep `.ts`, `.tsx`, and `.css`. Skip `*.module.css.d.ts`, `coverage/`, `test-results/`, and `node_modules`. Treat `lib/reddit/schemas/generated.ts` as output: review the inputs and scripts that produced it, not the file.

### 2. Load standards

The standards are `AGENTS.md` (already in context) and `~/.claude/rules/writing-style.md`. Read the matching file only when a finding depends on it:

| Concern                        | File                                               |
| ------------------------------ | -------------------------------------------------- |
| Lint rules, allowed HTML       | `eslint.config.ts`                                 |
| CSS layers, tokens             | `stylelint.config.ts`, `app/styles/tokens.css`     |
| Coverage thresholds            | `vitest.config.ts`                                 |
| Reddit calls, errors           | `lib/reddit/client.ts`, `lib/reddit/errors.ts`     |
| Failed reads                   | `lib/reddit/read-errors.ts`                        |
| Names and ids from input       | `lib/reddit/names.ts`                              |
| Media and link URLs            | `lib/media/url.ts`                                 |
| Env vars                       | `lib/env.ts`, `.env.example`                       |
| Indexable pages, CSP, proxying | `lib/site.ts`, `proxy.ts`, `next.config.ts`        |
| E2E and the mock Reddit        | `e2e/`, `e2e/mock-reddit/`, `playwright.config.ts` |

### 3. Review files

Read the diff first (`git diff HEAD`), then the full file only where the diff lacks context. Read the tests for changed logic (`tests/unit/` mirrors the source tree). Grep for nearby conventions rather than reading sibling files in full.

For each file, evaluate:

- **Architecture rules:** does the change break any rule in `AGENTS.md`? Check these first:
  - Browser code that fetches, or any Reddit call outside `redditFetch()`
  - Reddit JSON used without a Zod schema from `lib/reddit/schemas/` and a view model from `lib/view-models.ts`
  - Reads or writes that don't call `requireAuth()` themselves, or take a token from the caller
  - Names or ids from the URL or a form reaching an API path without `lib/reddit/names.ts`
  - Failed reads not going through `handleReadError()`
  - Server Actions that skip input validation or `runAction()`, or return raw data instead of an `ActionResult`
  - Reddit HTML rendered without `sanitizeRedditHtml()` and `RedditHtml`; media or link URLs without `safeMediaUrl()` / `safeLinkUrl()`
  - `dangerouslySetInnerHTML` outside `RedditHtml` and the root layout's theme script
  - A client component or CSS module first rendered by a Server Action but not imported by the page (fails only in production)
  - New polling that doesn't use `usePolling`, or shares private or quarantined thread data through the `lib/reddit/thread-live.ts` cache
  - View state kept outside the URL (`lib/url-state.ts`)
  - A new page made indexable without `PUBLIC_PAGES` in `lib/site.ts`
  - Logging through `console` instead of `lib/datadog/server.ts` or `lib/datadog/client.ts`
  - `any`, `NEXT_PUBLIC_`, `memo()`, `useCallback()`, `useMemo()`, barrel files
  - Styles outside `@layer components`, or raw colors instead of tokens

  Cite the rule, explain, and give a fix with code.

- **Reddit budget:** every reader shares about 100 requests a minute. Flag new calls per render, per poll, or per list item, and calls that could reuse data the page already has.
- **Code coverage:** coverage must stay at or above 90% (enforced). Verify with `npm run test`, don't infer it from reading the test file. If coverage drops, fix it. Server components render through `tests/helpers/render-server.tsx`; fixtures come from `tests/helpers/fixtures.ts`; component tests start with `// @vitest-environment happy-dom`.
- **Correctness and edge cases:** trace what the code does under boundary inputs (deleted or removed posts and comments, suspended users, private, quarantined, and NSFW subreddits, empty listings, the last page of a cursor, null oembed fields, expired sessions, rate-limit responses), not just whether it compiles and the happy-path test passes. Before trusting a date, count, or formatting choice, grep for how `lib/format.ts` and sibling code handle the same value and flag any divergence. A green suite doesn't prove the fixtures hit the risky boundary: check what the test pins.
- **Without JavaScript:** links and forms that work without JavaScript today must keep working: `ActionForm` forms, Previous and Next links, the `<noscript>` Next link in infinite feeds.
- **Security:** auth and session handling, open redirects, CSP changes, secrets in client bundles, unsanitized HTML or URLs. Changes to the auth flow need the user's sign-off.
- **Project conventions:** does this follow the established patterns in the codebase? Comment density, naming, file placement. If not, fix it.
- **Prose:** UI copy and docs follow `~/.claude/rules/writing-style.md`.
- **Praise:** call out anything done well. Specific, brief, no padding.

Tag every finding **Blocker**, **Suggestion**, or **Nit**.

Fix all Blockers and rule violations before Step 4. Fix Suggestions and Nits too unless there's a good reason not to, and say so if one is left. Praise notes are informational only.

### 4. Present findings

| #   | File | Line | Severity | Finding | Fix |
| --- | ---- | ---- | -------- | ------- | --- |

One row per finding. Skip files with nothing to report rather than padding the table with "no issues" rows. In the Fix column, say what changed, or "flagged only" for Praise or anything deliberately left alone. Print this table before running validation.

Close with a one-line status: for example "All findings fixed; validation clean" or "1 suggestion left unfixed (see row 3), confirm before committing."

### 5. Validate

```bash
npm run format:check
npm run check
npm run build
```

Run `npm run test:e2e` when a change touches a user flow or a Server Action renders something new. For UX changes, check the page in Chrome against the user's running dev server (never start it).

Fix all errors and re-run until clean. Report the final output.
