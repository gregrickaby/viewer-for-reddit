---
name: code-review
model: claude-opus-5-5
context: fork
description: Review changed code in Viewer for Reddit against its architecture rules and conventions, and fix issues before committing. Use when the user says "review my code", "do a code review", or "/code-review".
---

# Code review

Catch everything a careful human reviewer would flag, fix it, and report. Never commit.

You run in a fresh context: you can't see the conversation, and nobody answers questions. Make each call yourself and explain it in the report.

## 1. Scope

Review the uncommitted work: `git status --short`, `git diff --stat HEAD`, and `git ls-files --others --exclude-standard` for new files. If this skill's arguments name a commit range, review that instead (`git diff --stat <range>`). If there's nothing to review, say so and stop.

Keep `.ts`, `.tsx`, and `.css`. Skip `*.module.css.d.ts`, `coverage/`, `test-results/`, and `node_modules`. Treat `lib/reddit/schemas/generated.ts` as output: review the inputs and scripts that produced it, not the file.

## 2. Standards

Read `AGENTS.md` and `docs/code-standards.md`. Read another file only when a finding depends on it:

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

## 3. Review

Read the diff one file or group at a time (`git diff HEAD -- <paths>`), and new files in full. Open the rest of a file only where the diff lacks context. Read the tests for changed logic (`tests/unit/` mirrors the source tree). Grep for nearby conventions instead of reading sibling files.

Check each file for:

- **Architecture rules** in `AGENTS.md`, first:
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
- **Reddit budget:** every reader shares about 100 requests a minute. Flag new calls per render, per poll, or per list item, and calls that could reuse data the page already has.
- **Correctness:** trace boundary inputs (deleted or removed posts and comments, suspended users, private, quarantined, and NSFW subreddits, empty listings, the last page of a cursor, null oembed fields, expired sessions, rate-limit responses), not just the happy path. Before trusting a date, count, or format, grep how `lib/format.ts` and sibling code handle the same value. A green suite doesn't prove the fixtures hit the risky boundary: check what each test pins.
- **Without JavaScript:** links and forms that work without JavaScript today keep working: `ActionForm` forms, Previous and Next links, the `<noscript>` Next link in infinite feeds.
- **Security:** auth and session handling, open redirects, CSP changes, secrets in client bundles, unsanitized HTML or URLs. Don't change the auth flow yourself: report a needed change as a Blocker for the user to sign off on.
- **Code standards** that lint can't check: naming, comments, props typing, error handling (including rejected Server Action promises in islands), test structure.
- **Prose:** UI copy and docs follow the writing rules in `docs/code-standards.md`.
- **Praise:** anything done well. Specific and brief.

Tag each finding **Blocker**, **Suggestion**, **Nit**, or **Praise**. Fix every Blocker, Suggestion, and Nit unless there's a good reason not to; give the reason in the report.

## 4. Validate

```bash
npm run format:check
npm run check
npm run build
```

`npm run check` includes coverage, enforced at 95%. Run `npm run test:e2e` when a change touches a user flow or a Server Action renders something new. For UI changes, check the page in Chrome against the user's running dev server when the Chrome tools are available (never start a server); otherwise say live checking wasn't possible.

Fix what fails and re-run. If something still fails after two attempts, stop and report it.

## 5. Report

The report is relayed to the user, so it's the only output that matters.

| #   | File | Line | Severity | Finding | Fix |
| --- | ---- | ---- | -------- | ------- | --- |

One row per finding, none for files without one. The Fix column says what changed, or "flagged only" with the reason. Then one line each for validation results and anything left for the user to decide.
