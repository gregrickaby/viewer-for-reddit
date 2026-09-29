# Reddit Viewer: Implementation Plan

| | |
|---|---|
| **Status** | Draft for review |
| **Date** | 2026-09-29 |
| **Design** | [design.md](./design.md). Read it first. Section numbers (§) refer to it. |
| **Package manager** | npm (`package-lock.json` is committed) |

> **Before writing any Next.js code,** read the relevant guide in `node_modules/next/dist/docs/` (see `AGENTS.md`). The code sketches below were checked against the bundled 16.3.7 docs. Anything marked **VERIFY** is an assumption to confirm with a quick spike before building on it.

---

## 0. Prerequisites

### 0.1 Fix the environment

`.env.local` currently defines these variables:

`BASE_URL`, `GOOGLE_SITE_VERIFICATION`, `NEXT_SERVER_ACTION_ENCRYPTION_KEY`, `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_REDIRECT_URI`, `SESSION_SECRET`, `USER_AGENT`

1. **Rename `NEXT_SERVER_ACTION_ENCRYPTION_KEY` → `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`.** Next only reads the plural name. The current value is fine: it decodes to 32 bytes, a valid AES key length.
2. `SESSION_SECRET` is 43 characters. `iron-session` requires at least 32. ✅
3. `BASE_URL` and `REDDIT_REDIRECT_URI` use `https://localhost:3000`, so dev must run with `next dev --experimental-https`. Next generates a trusted local certificate with mkcert. `*.pem` is already git-ignored.
4. Add a committed `.env.example` with the variable **names** only. The current `.gitignore` ignores `.env*`, so add `!.env.example`.
5. Optional, for tests only: `REDDIT_API_BASE` and `REDDIT_WWW_BASE`, which point the app at the mock Reddit server.

### 0.2 Reddit app

At <https://www.reddit.com/prefs/apps>, confirm the app is type **web app**. Its redirect URI must be exactly `https://localhost:3000/api/auth/callback/reddit`, and a production redirect URI must be added later. `USER_AGENT` must follow `<platform>:<app id>:<version> (by <reddit username>)`. The current value already does.

### 0.3 Platform versions (§15)

**Decision: develop on canary.** Pin exact canary versions and bump them in a weekly PR.

| Package | Pin (at project start) | Notes |
|---|---|---|
| `next` | `16.4.0-canary.52` (exact) | The App Router vendors its own React canary |
| `eslint-config-next`, `@next/playwright` | the matching `16.4.0-canary.52` | Always bump together with `next` |
| `react`, `react-dom` | `19.3.0` (exact, **stable**) | `next@canary` declares a `^19.0.0` peer dependency, and semver excludes prereleases, so `react@canary` fails to resolve. The App Router uses Next's vendored React canary at runtime regardless (`19.3.0-canary-8b0da1c6-20260922` in 16.4.0-canary.52), so the top-level package only supplies types and the Pages Router runtime, which we don't use. |
| `@types/react` / `@types/react-dom` | `19.3.x` | Already type `ViewTransition`, `addTransitionType`, and `Activity` |

After `npm i`, re-read `node_modules/next/dist/docs/` for anything that differs from these sketches. They were checked against 16.3.7. Before production, switch to the latest stable release and pin it (design §15).

---

## 1. Dependencies

```bash
# runtime
npm i -E iron-session@9 zod@4 sanitize-html@2 hls.js@1 server-only

# styling: CSS Modules + tokens (design §10.4). Remove the scaffold's Tailwind first:
npm rm tailwindcss @tailwindcss/postcss && rm postcss.config.mjs

# dev
npm i -D -E @types/sanitize-html quicktype@26 tsx vitest@5 @vitest/coverage-v8 \
  @playwright/test @next/playwright@canary \
  happy-css-modules stylelint stylelint-config-standard stylelint-config-css-modules

# framework on canary, pinned exactly (bump weekly as one PR)
npm i -E next@canary eslint-config-next@canary react@19.3.0 react-dom@19.3.0
```

Registry versions checked on 2026-09-29: happy-css-modules 5.0.2, stylelint 17.15.0, stylelint-config-standard 40.0.0, stylelint-config-css-modules 4.6.0, iron-session 9.0.1, zod 4.6.5, sanitize-html 2.17.7, hls.js 1.7.3, quicktype 26.0.0, vitest 5.0.2, @playwright/test 1.63.0, @next/playwright 16.3.7.

Nothing else. In particular, **no** SWR, React Query, axios, animation libraries, or client markdown parsers (§4.1).

---

## 2. Configuration

### 2.1 `next.config.ts`

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  partialPrefetching: true,
  typedRoutes: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '100kb', // comments cap at 10k chars; nothing else is large
    },
  },
  // Reddit media is rendered with native <img srcset>, not next/image (§4.2)
  poweredByHeader: false,
}

export default nextConfig
```

### 2.2 `package.json` scripts

```json
{
  "scripts": {
    "dev": "next dev --experimental-https",
    "build": "next build",
    "start": "next start",
    "lint": "eslint && stylelint \"**/*.css\"",
    "css:types": "hcm \"{app,components}/**/*.module.css\"",
    "css:types:watch": "hcm --watch \"{app,components}/**/*.module.css\"",
    "typecheck": "next typegen && tsc --noEmit",
    "test": "vitest run --coverage",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "types:extract": "tsx scripts/reddit/extract-things.ts",
    "types:generate": "npm run types:extract && quicktype --lang typescript-zod --src fixtures/reddit/things --no-enums --no-date-times --no-integer-strings --no-boolean-strings --no-uuids -o lib/reddit/schemas/generated.ts && tsx scripts/reddit/postprocess-generated.ts",
    "check": "npm run css:types && npm run typecheck && npm run lint && npm run test"
  }
}
```

### 2.3 `tsconfig.json` additions

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "allowJs": false
  }
}
```

### 2.4 ESLint guardrails (`eslint.config.mjs`)

> **Build note (2026-09-29):** the `eslint-plugin-react` bundled with `eslint-config-next@16.4.0-canary.52` calls `context.getFilename()`, which ESLint 10 removed, but only while auto-detecting the React version. The config pins `settings.react.version: '19.3'` to skip detection. Remove the pin once the plugin supports ESLint 10.

These enforce the server-first rules (§4.1) and the HTML safety rule (§7). Add them after the Next presets:

```js
{
  files: ['**/*.{ts,tsx}'],
  ignores: ['components/reddit-html.tsx'],
  rules: {
    'react/no-danger': 'error',
    'no-restricted-imports': ['error', {
      paths: ['swr', '@tanstack/react-query', 'axios'].map((name) => ({ name, message: 'Server-first: no client data fetching (design §4.1).' })),
    }],
  },
},
{
  // Client islands: no network, no server modules (type imports OK)
  files: ['components/islands/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-globals': ['error', 'fetch', 'XMLHttpRequest', 'EventSource', 'WebSocket'],
    '@typescript-eslint/no-restricted-imports': ['error', {
      patterns: [{ group: ['@/lib/reddit/*', '@/lib/auth/*'], allowTypeImports: true, message: 'Islands may only import types from the DAL.' }],
    }],
  },
},
{
  // lib/reddit and lib/auth must be server-only
  files: ['lib/reddit/**/*.ts', 'lib/auth/**/*.ts'],
  rules: { 'no-restricted-syntax': ['error', { selector: "Program:not(:has(ImportDeclaration[source.value='server-only']))", message: "Add `import 'server-only'`." }] },
},
```

`lib/auth/cookies.ts` and `lib/auth/oauth.ts` are also imported by `proxy.ts`. They still import `server-only`. **VERIFY** that `server-only` resolves in the proxy bundle; it should, since the proxy runs in Node.

`hls.js` is the one allowed exception to the "no network" rule. It fetches media segments, not app data, and is loaded dynamically inside `RedditVideo`.

---

## 3. Directory layout

```
app/
  layout.tsx                         # <html>/<body>, Reddit Sans/Mono fonts, styles/*.css, theme script, metadata
  styles/                            # global CSS, all in cascade layers (design §10.4)
    layers.css  reset.css  tokens.css  base.css  utilities.css
  (public)/page.tsx                  # "/" landing + sign-in form
  (app)/layout.tsx                   # header, sidebar (Suspense), <main>
  (app)/error.tsx  not-found.tsx
  (app)/home/page.tsx
  (app)/r/[subreddit]/page.tsx
  (app)/r/[subreddit]/comments/[id]/[[...rest]]/page.tsx
  (app)/user/[username]/page.tsx
  (app)/user/[username]/m/[multi]/page.tsx
  (app)/m/[multi]/page.tsx
  (app)/saved/page.tsx
  (app)/subreddits/page.tsx
  (app)/multis/page.tsx
  (app)/multis/[multi]/page.tsx
  (app)/search/page.tsx
  (app)/settings/page.tsx            # theme + NSFW blur (design §8.8)
  api/auth/login/route.ts
  api/auth/callback/reddit/route.ts
  api/auth/signout/route.ts
  api/dev/capture/route.ts           # development-only fixture capture (Phase 2)
  actions/
    auth.ts  votes.ts  save.ts  comments.ts  subscriptions.ts  multis.ts  settings.ts
proxy.ts
lib/
  env.ts
  settings.ts                         # cookie names, parse/serialize, defaults (theme, blurNsfw)
  auth/  cookies.ts  oauth.ts  session.ts  next-param.ts
  reddit/
    client.ts  errors.ts  rate-limit.ts  listing.ts  sanitize.ts  comment-tree.ts  more.ts
    schemas/ generated.ts (GENERATED)  things.ts  link.ts  comment.ts  subreddit.ts
             account.ts  multi.ts  me.ts  responses.ts  index.ts
    api/     identity.ts  feeds.ts  comments.ts  subreddits.ts  users.ts  saved.ts
             multis.ts  mutations.ts  search.ts
    mappers/ post.ts  media.ts  comment.ts  subreddit.ts  user.ts  multi.ts
  media/     detect.ts  url.ts  images.ts  inline.ts  resolvers/*  providers/*   (design §8.7)
  actions/   result.ts  run-action.ts  inputs.ts
  url-state.ts                        # feed/comment query parsing, typed hrefs
  view-models.ts
  format.ts                           # relative time, compact numbers (server)
components/
  reddit-html.tsx  reddit-html.module.css   # the ONLY dangerouslySetInnerHTML (+ Reddit-HTML typography)
  ui/        button  icon-button  link-button  menu  tooltip  dialog  confirm-dialog  drawer  disclosure
             switch  segmented-control  tabs  badge  chip  avatar  flair  skeleton  text-area  text-field
             pagination  spinner   (each: name.tsx + name.module.css; design §10.4 primitives)
  motion/    page-transition.tsx  reveal.tsx
  shell/     header.tsx  sidebar.tsx  nav-drawer.tsx  user-menu.tsx  search-form.tsx
  feed/      post-card.tsx  post-content.tsx  feed-list.tsx  pagination.tsx  sort-tabs.tsx
  comments/  comment-tree.tsx  comment.tsx  more-link.tsx  thread-banner.tsx
  subreddit/ subreddit-header.tsx  add-to-multi-menu.tsx
  user/      profile-header.tsx
  multis/    multi-form.tsx  multi-subreddit-list.tsx  multi-suggestions.tsx
  skeletons/ feed.tsx  post.tsx  comments.tsx  sidebar.tsx  subreddit-header.tsx
             profile-header.tsx  multi-editor.tsx  list-rows.tsx
  media/     post-media.tsx  media-reveal.tsx  media-image.tsx  gallery.tsx  link-card.tsx
  islands/   theme-toggle.tsx  setting-switch.tsx  player-registry.ts  gallery-lightbox.tsx
             vote-buttons.tsx  save-button.tsx  subscribe-button.tsx  membership-toggle.tsx
             comment-composer.tsx  pending-button.tsx  link-pending-hint.tsx  section-error.tsx
             reddit-video.tsx  autoplay-video.tsx  embed-facade.tsx  use-enhanced-form.ts
scripts/reddit/ manifest.ts  things.ts  extract-things.ts  generated.ts  postprocess-generated.ts  scrub.ts
fixtures/reddit/ raw/  things/
tests/unit/**   tests/media/corpus/*.json   e2e/**   e2e/mock-reddit/**
docs/ design.md  implementation.md
```

---

## Phase 1: Foundation and authentication

**Goal:** a user can sign in with Reddit, see their username on `/home`, and sign out. Tokens refresh transparently.

### 1.1 `lib/env.ts`

```ts
import 'server-only'
import * as z from 'zod'

const Env = z.object({
  BASE_URL: z.url(),
  REDDIT_CLIENT_ID: z.string().min(1),
  REDDIT_CLIENT_SECRET: z.string().min(1),
  REDDIT_REDIRECT_URI: z.url(),
  SESSION_SECRET: z.string().min(32),
  USER_AGENT: z.string().min(10),
  GOOGLE_SITE_VERIFICATION: z.string().optional(),
  REDDIT_API_BASE: z.url().default('https://oauth.reddit.com'),
  REDDIT_WWW_BASE: z.url().default('https://www.reddit.com'),
})

export const env = Env.parse(process.env)
```

### 1.2 `lib/auth/cookies.ts` (shared by proxy and DAL; no `next/headers`)

```ts
import 'server-only'
import * as z from 'zod'
import { sealData, unsealData } from 'iron-session'
import { env } from '@/lib/env'

export const ACCESS_COOKIE = 'rv_at'
export const REFRESH_COOKIE = 'rv_rt'
export const OAUTH_COOKIE = 'rv_oauth'
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 30
export const REFRESH_SKEW_MS = 5 * 60 * 1000

const AccessToken = z.object({ accessToken: z.string().min(1), expiresAt: z.number() })
const RefreshToken = z.object({ v: z.literal(1), refreshToken: z.string().min(1), username: z.string(), scope: z.string() })
const OAuthState = z.object({ state: z.string().min(32), next: z.string() })
export type AccessToken = z.infer<typeof AccessToken>
export type RefreshToken = z.infer<typeof RefreshToken>

async function seal(data: object, ttl: number) {
  return sealData(data, { password: env.SESSION_SECRET, ttl })
}
async function unseal<T extends z.ZodType>(schema: T, value: string | undefined): Promise<z.infer<T> | null> {
  if (!value) return null
  try {
    const parsed = schema.safeParse(await unsealData(value, { password: env.SESSION_SECRET }))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export const sealAccess = (t: AccessToken) => seal(t, Math.max(60, Math.floor((t.expiresAt - Date.now()) / 1000)))
export const unsealAccess = (v?: string) => unseal(AccessToken, v)
export const sealRefresh = (t: RefreshToken) => seal(t, REFRESH_MAX_AGE)
export const unsealRefresh = (v?: string) => unseal(RefreshToken, v)
export const sealOAuthState = (s: z.infer<typeof OAuthState>) => seal(s, 600)
export const unsealOAuthState = (v?: string) => unseal(OAuthState, v)

export function cookieOptions(maxAge: number, path = '/') {
  return { httpOnly: true, secure: true, sameSite: 'lax', path, maxAge } as const
}

export function needsRefresh(at: AccessToken | null, now: number) {
  return !at || at.expiresAt - now < REFRESH_SKEW_MS
}
```

### 1.3 `lib/auth/oauth.ts`

- `SCOPES = ['identity','read','history','mysubreddits','subscribe','vote','submit','edit','save'] as const`
- `buildAuthorizeUrl(state)` returns `${REDDIT_WWW_BASE}/api/v1/authorize?client_id&response_type=code&state&redirect_uri&duration=permanent&scope=<space-joined>`
- `exchangeCode(code)`, `refreshAccessToken(refreshToken)`, and `revokeToken(refreshToken)`:
  - `POST ${REDDIT_WWW_BASE}/api/v1/access_token` or `/revoke_token`
  - `Authorization: Basic base64(id:secret)`, the `User-Agent` header, and a `application/x-www-form-urlencoded` body
- The token response is parsed with Zod:

  ```ts
  const TokenOk = z.object({ access_token: z.string(), token_type: z.literal('bearer'), expires_in: z.number(), scope: z.string(), refresh_token: z.string().optional() })
  const TokenErr = z.object({ error: z.string() })
  export type RefreshResult =
    | { kind: 'ok'; accessToken: string; expiresAt: number; refreshToken?: string; scope: string }
    | { kind: 'invalid_grant' }
    | { kind: 'transient'; status: number }
  ```

  Reddit can return `{"error":"invalid_grant"}` with **HTTP 200 or 400**, so check the body, not only the status.
- `fetchIdentity(accessToken)` calls `GET /api/v1/me`, parsed with `Me.pick({ name: true })`. It is used only by the callback, before any cookie exists.

### 1.4 `lib/auth/next-param.ts`

```ts
export function safeNext(value: string | null | undefined, fallback = '/home'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback
  return value
}
```

Unit-test it with an open-redirect corpus: `//evil.com`, `/\evil.com`, `https://evil.com`, `/%2F%2Fevil.com`, `javascript:`, and similar.

### 1.5 Route Handlers

- **`app/api/auth/login/route.ts` (GET):**
  1. Create the state with `crypto.randomBytes(32).toString('base64url')`.
  2. Set `rv_oauth` with `sealOAuthState({ state, next: safeNext(searchParams.get('next')) })` and `cookieOptions(600, '/api/auth')`.
  3. Return `NextResponse.redirect(buildAuthorizeUrl(state))`.
- **`app/api/auth/callback/reddit/route.ts` (GET):**
  1. `error=access_denied` → `/?error=denied`.
  2. Unseal `rv_oauth` and compare `state` with `crypto.timingSafeEqual`. On a mismatch → `/?error=state`.
  3. Call `exchangeCode(code)`. On failure → `/?error=exchange`.
  4. Call `fetchIdentity` to get the username.
  5. Set `rv_at` (maxAge `expires_in - 60`) and `rv_rt` (`REFRESH_MAX_AGE`), and delete `rv_oauth`.
  6. Redirect to `next`.
- **`app/api/auth/signout/route.ts` (GET):** used only for the expired or revoked case (§5.5). It deletes both cookies, then redirects to `/?error=session_expired&next=<safeNext>`. It does **not** call revoke, because the token is already dead.

### 1.6 `proxy.ts`

```ts
import { NextResponse, type NextRequest } from 'next/server'
import {
  ACCESS_COOKIE, REFRESH_COOKIE, REFRESH_MAX_AGE, cookieOptions, needsRefresh,
  sealAccess, sealRefresh, unsealAccess, unsealRefresh,
} from '@/lib/auth/cookies'
import { refreshAccessToken } from '@/lib/auth/oauth'

const isPublic = (p: string) => p === '/' || p.startsWith('/api/auth/')

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const rt = await unsealRefresh(request.cookies.get(REFRESH_COOKIE)?.value)
  const at = await unsealAccess(request.cookies.get(ACCESS_COOKIE)?.value)
  const outgoing: Array<{ name: string; value: string; maxAge: number }> = []

  if (rt && needsRefresh(at, Date.now())) {
    const result = await refreshAccessToken(rt.refreshToken)
    if (result.kind === 'invalid_grant') {
      const res = NextResponse.redirect(new URL('/?error=session_expired', request.url))
      res.cookies.delete(ACCESS_COOKIE)
      res.cookies.delete(REFRESH_COOKIE)
      return res
    }
    if (result.kind === 'ok') {
      const sealedAt = await sealAccess({ accessToken: result.accessToken, expiresAt: result.expiresAt })
      const sealedRt = await sealRefresh({ ...rt, refreshToken: result.refreshToken ?? rt.refreshToken })
      // Make the fresh token visible to cookies() later in THIS request…
      request.cookies.set(ACCESS_COOKIE, sealedAt)
      request.cookies.set(REFRESH_COOKIE, sealedRt)
      // …and persist it in the browser.
      outgoing.push(
        { name: ACCESS_COOKIE, value: sealedAt, maxAge: Math.floor((result.expiresAt - Date.now()) / 1000) },
        { name: REFRESH_COOKIE, value: sealedRt, maxAge: REFRESH_MAX_AGE },
      )
    }
    // 'transient': fall through; DAL/boundaries handle an expired token.
  }

  const signedIn = rt !== null
  let response: NextResponse
  if (!signedIn && !isPublic(pathname) && request.method === 'GET') {
    const url = new URL('/', request.url)
    url.searchParams.set('next', pathname + search)
    response = NextResponse.redirect(url)
  } else if (signedIn && pathname === '/') {
    response = NextResponse.redirect(new URL('/home', request.url))
  } else {
    response = NextResponse.next({ request: { headers: request.headers } })
  }
  for (const c of outgoing) response.cookies.set(c.name, c.value, cookieOptions(c.maxAge))
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|webp|ico)$).*)'],
}
```

**VERIFY (spike first):** that `request.cookies.set()` followed by `NextResponse.next({ request: { headers: request.headers } })` makes `cookies()` in a Server Component see the new value on the same request. If it doesn't, rebuild the `cookie` header manually into a new `Headers` object.

### 1.7 `lib/auth/session.ts` (DAL entry point)

```ts
import 'server-only'
import { io } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { ACCESS_COOKIE, REFRESH_COOKIE, unsealAccess, unsealRefresh } from './cookies'

export type Auth = { accessToken: string; username: string }

/** Signed in, but no usable access token reached this request (a transient refresh failure). Retryable. */
export class SessionUnavailableError extends Error {}

const readSession = cache(async () => {
  const jar = await cookies()
  await io() // see note below
  const [access, refresh] = await Promise.all([
    unsealAccess(jar.get(ACCESS_COOKIE)?.value),
    unsealRefresh(jar.get(REFRESH_COOKIE)?.value),
  ])
  const usable = access !== null && access.expiresAt > Date.now()
  return { access: usable ? access : null, refresh }
})

export async function getAuth(): Promise<Auth | null>       // null unless both cookies are usable
export async function getUsername(): Promise<string | null> // needs only rv_rt
export async function requireAuth(): Promise<Auth> {
  const { access, refresh } = await readSession()
  if (!refresh) redirect('/api/auth/signout?reason=expired')
  if (!access) throw new SessionUnavailableError()
  return { accessToken: access.accessToken, username: refresh.username }
}
```

**`await io()` is required.** With Partial Prefetching, reading `cookies()` alone does not exclude a component from the per-session App Shell, so the `Date.now()` expiry check (and iron-session's TTL check) would run during prerender and fail the build with a "current time" error. `io()` from `next/cache` marks the clock read explicitly (bundled docs: `04-functions/io.md`) and resolves immediately at request time.

### 1.8 `app/actions/auth.ts`

`signOut()`:

1. Read `rv_rt` and call `revokeToken`. This is best-effort: `try`/`catch`, then log.
2. `(await cookies()).delete(...)` both cookies.
3. `redirect('/')`.

### 1.9 Landing page `app/(public)/page.tsx`

- Static hero and copy (in the static shell).
- A `<Suspense>`-wrapped `<SignInPanel searchParams={searchParams} />`. It reads `error` and `next` and renders:

  ```tsx
  <form action="/api/auth/login" method="get">
    <input type="hidden" name="next" value={next} />
    <button>Sign in with Reddit</button>
  </form>
  ```

  plus an error banner mapped from `denied | state | exchange | session_expired`.
- Root `layout.tsx` sets `metadata.verification.google = env.GOOGLE_SITE_VERIFICATION`. It stays **static**, meaning no `cookies()`. It renders `<html lang="en" data-theme="system" suppressHydrationWarning>` and puts a theme script in `<head>`, per the bundled "Preventing flash before hydration" guide:

  ```tsx
  const THEME_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )rv_theme=(system|light|dark)(?:;|$)/);if(m)document.documentElement.setAttribute("data-theme",m[1])}catch(e){}})()`
  // <head><script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} /></head>
  ```

  The regex only accepts the three known values, so the cookie can't inject anything. This file is the second allowed `dangerouslySetInnerHTML` site, so add it to the ESLint `ignores` list. The CSP (Phase 8) allows this script by hash or by the proxy nonce.

### Phase 1 acceptance

- [ ] Signing in round-trips and lands on `next` (or `/home`). A declined consent shows the "denied" banner.
- [ ] Visiting `/saved` signed out redirects to `/?next=%2Fsaved`, and after sign-in lands on `/saved`.
- [ ] Deleting `rv_at` in devtools and reloading refreshes silently, with a new `rv_at` set.
- [ ] Revoking the app at reddit.com/prefs/apps and reloading shows the `session_expired` banner with cookies cleared.
- [ ] Sign-out revokes the token (confirmed via the Reddit app list) and clears cookies.
- [ ] Unit tests cover `safeNext`, `needsRefresh`, the `proxy()` branches (mocked `fetch`), and sealed cookie size under 3.8 KB with 1,200-char tokens.

---

## Phase 2: Reddit client and type pipeline

**Goal:** real fixtures are captured, schemas are generated, and the curated layer and mappers are unit-tested against fixtures.

### 2.1 `lib/reddit/errors.ts` and `lib/reddit/client.ts`

```ts
export class RedditError extends Error { constructor(message: string, readonly status: number) { super(message) } }
export class RedditAuthError extends RedditError {}
export class RedditForbiddenError extends RedditError { constructor(readonly reason: 'private' | 'quarantined' | 'banned' | 'unknown', status = 403) { super(`forbidden:${reason}`, status) } }
export class RedditNotFoundError extends RedditError {}
export class RedditRateLimitError extends RedditError { constructor(readonly resetSeconds: number) { super('rate_limited', 429) } }
export class RedditApiError extends RedditError { constructor(message: string, status: number, readonly code?: string, readonly field?: string) { super(message, status) } }
export class RedditSchemaError extends RedditError { constructor(readonly endpoint: string, readonly issues: unknown) { super(`schema:${endpoint}`, 502) } }
```

`redditFetch(path, { method, query, form, token })` does the following:

- Builds `${REDDIT_API_BASE}${path}` and always adds `raw_json=1`, dropping `undefined` query values.
- Sends the `Authorization: Bearer`, `User-Agent`, and `Accept: application/json` headers, plus a form body for writes.
- Records `x-ratelimit-remaining`, `x-ratelimit-used`, and `x-ratelimit-reset` in `rate-limit.ts` (a module-level singleton). Before each call, if `remaining < 5` and the reset time is in the future, it throws `RedditRateLimitError` without calling Reddit.
- Maps statuses: 401 → `RedditAuthError`. 403 → `RedditForbiddenError` (the reason comes from the body's `reason`: `private`, `quarantined`, or `banned`). 404 → `RedditNotFoundError`. 429 → `RedditRateLimitError`. Any other non-2xx → `RedditApiError`.
- Parses the body as JSON and returns `unknown`. Reddit sometimes returns an HTML redirect for a banned subreddit instead of a 404. Treat a non-JSON body as `RedditNotFoundError` for GETs.

There is **no** `fetch` caching configuration: with Cache Components, `fetch` is not cached unless it runs inside `use cache`.

### 2.2 Fixture capture (dev only)

**`scripts/reddit/manifest.ts`** is a typed list of captures:

```ts
export type Capture = { name: string; path: string; query?: Record<string, string | number> }
export const captures = (me: string): Capture[] => [
  { name: 'me', path: '/api/v1/me' },
  { name: 'best', path: '/best', query: { limit: 100 } },
  { name: 'all-top-day', path: '/r/all/top', query: { t: 'day', limit: 100 } },
  { name: 'popular-hot', path: '/r/popular/hot', query: { limit: 100 } },
  // media diversity
  ...['pics', 'videos', 'gifs', 'EarthPorn', 'mildlyinteresting', 'AskReddit', 'news', 'nextjs', 'polls', 'CrossStitch']
    .map((sr) => ({ name: `r-${sr}`, path: `/r/${sr}/hot`, query: { limit: 50 } })),
  { name: 'sub-about-pics', path: '/r/pics/about' },
  { name: 'subs-mine', path: '/subreddits/mine/subscriber', query: { limit: 100 } },
  { name: 'multis-mine', path: '/api/multi/mine', query: { expand_srs: 'true' } },
  { name: 'saved', path: `/user/${me}/saved`, query: { limit: 100 } },
  { name: 'user-about', path: '/user/spez/about' },
  { name: 'user-overview', path: '/user/spez/overview', query: { limit: 100 } },
  { name: 'search-subs', path: '/subreddits/search', query: { q: 'programming', limit: 50 } },
  // media corpus (design §8.7): each provider/resolver needs ≥ 2 real samples
  ...['videos', 'youtubehaiku', 'gifs', 'reactiongifs', 'HighQualityGifs', 'blackmagicfuckery', 'Unexpected',
      'LivestreamFail', 'spotify', 'imgur', 'interestingasfuck', 'oddlysatisfying']
    .map((sr) => ({ name: `media-${sr}`, path: `/r/${sr}/top`, query: { t: 'week', limit: 100 } })),
  // Provider-specific samples via Reddit search (no subreddit names, no config). Covers Redgifs, which is
  // mostly NSFW, like any other provider. Fixtures contain JSON metadata/URLs only, never media bytes.
  ...['redgifs.com', 'giphy.com', 'imgur.com', 'streamable.com', 'youtube.com', 'vimeo.com', 'clips.twitch.tv', 'tiktok.com']
    .map((site) => ({ name: `site-${site}`, path: '/search', query: { q: `site:${site}`, include_over_18: 'on', sort: 'top', t: 'month', limit: 100, type: 'link' } })),
  // comments: filled dynamically from the top 15 posts of all-top-day (deep threads → `more` nodes)
]
```

**`app/api/dev/capture/route.ts`** returns 404 unless `process.env.NODE_ENV === 'development'`. When allowed, it:

1. Calls `requireAuth()`.
2. Runs every capture through `redditFetch`, plus comment threads (`/comments/{id}?limit=500&depth=10` for 15 posts) and one `/api/morechildren` call built from a `more` node found in those threads.
3. Scrubs the results.
4. Writes `fixtures/reddit/raw/<name>.json` (pretty-printed).
5. Returns a summary.

The developer triggers it by visiting `https://localhost:3000/api/dev/capture` while signed in. This keeps the token server-side, with no copy-and-paste.

**`scripts/reddit/scrub.ts`** does the following:

- Replaces the signed-in username (case-insensitive) with `fixture_user`.
- Drops the `/api/v1/me` private fields: everything except `name`, `id`, `icon_img`, `snoovatar_img`, `total_karma`, `link_karma`, `comment_karma`, `created_utc`, `over_18`, `is_gold`, `is_mod`, `verified`, `has_verified_email`, and `subreddit`.
- Strips `modhash`.

The raw captures are **not committed**: they are about 61 MB, contain other people's public posts in bulk, and can be re-captured at any time. `/fixtures/reddit/raw/` is git-ignored. The selected samples in `fixtures/reddit/things/` (about 1.2 MB) **are committed**, together with `lib/reddit/schemas/generated.ts`, so type generation's inputs and outputs are reviewable and tests run on a fresh clone. Re-capture is manual.

### 2.3 Sample extraction (`scripts/reddit/things.ts`)

The logic lives in `scripts/reddit/things.ts` so it can be unit-tested. `scripts/reddit/extract-things.ts` is a thin CLI that calls `extractThings({ rawDir, outDir, schemaDir })` with the repo paths and exits with code 1 on error.

It walks every JSON value in `fixtures/reddit/raw/**` and buckets the `data` of each `{ kind, data }` node into a directory per type:

| kind | dir |
|---|---|
| `t1` | `Comment` |
| `t2` | `Account` |
| `t3` | `Link` |
| `t5` | `Subreddit` |
| `more` | `More` |
| `LabeledMulti` | `LabeledMulti` |
| each value of a `media_metadata` map | `MediaMetadataItem` |

The root of `me.json` goes to `Me`.

Rules (`prepare`):

- For `t1`, replace `replies` with `""`. The recursion is modeled by hand, and nested replies become samples of their own.
- For `t3`, extract every `crosspost_parent_list[]` item as its own `Link` sample, then replace the array with `[]`.
- `media_metadata` is keyed by random media ids, so quicktype would infer an object with random property names. Its values become `MediaMetadataItem` samples, and the parent's map is replaced with `{}`. The curated layer types it as `z.record(z.string(), MediaMetadataItemSchema)`.

**Sample selection is coverage-based** (`selectSamples`). The raw set has thousands of things per kind (2,637 Links, 6,711 Comments, 701 media items), and the first N are biased toward whichever file was captured first. Instead:

1. Each sample is reduced to a set of *shape features* (`shapeFeatures`): every `path:type` pair it contains, down to depth 6, plus an `absent` feature for each field that some other sample of the kind has and this one lacks. Absent features are what make quicktype emit `.optional()`. Map fields (`media_metadata`, `gildings`) are collapsed.
2. The first 15 samples are kept as a baseline.
3. Then samples are added greedily, each time taking the one that contributes the most unseen features, until every feature is covered or the kind reaches 250.

The result is small and complete: 36 Links, 24 Comments, 15 Mores, 23 Subreddits, 7 LabeledMultis, 20 MediaMetadataItems, and one each of Me and Account. Every field and value type seen anywhere in the capture is represented, including the optional-ness of each field. The script writes `fixtures/reddit/things/<Dir>/<id>.json`, clearing the directory first, and creates the schema output directory for quicktype.

**Checked on 2026-09-29:** quicktype 26 merges all files in `--src <dir>/<TypeName>/` into one schema named `<TypeName>Schema`. Absent-in-some fields become `.optional()`, and mixed types become `z.union` (for example `edited: z.union([z.boolean(), z.number()])`). Output uses `import * as z from "zod"`, which works with Zod 4.

`scripts/reddit/postprocess-generated.ts` is a thin CLI around `stampGenerated()` in `scripts/reddit/generated.ts`. It prepends a `// GENERATED by npm run types:generate. DO NOT EDIT.` banner and `import 'server-only'`, and runs a sanity check: the file must export `LinkSchema`, `CommentSchema`, `MoreSchema`, `SubredditSchema`, `AccountSchema`, `LabeledMultiSchema`, `MeSchema`, and `MediaMetadataItemSchema`. Re-stamping an already stamped file is a no-op.

### 2.4 Curated schemas (hand-written)

**`schemas/things.ts`** holds the generic envelopes:

```ts
import * as z from 'zod'
export const thing = <K extends string, T extends z.ZodType>(kind: K, data: T) =>
  z.object({ kind: z.literal(kind), data })
export const ListingEnvelope = z.object({
  kind: z.literal('Listing'),
  data: z.object({
    after: z.string().nullable(),
    before: z.string().nullable(),
    children: z.array(z.unknown()),   // parsed per item (N4)
  }),
})
export const Fullname = z.string().regex(/^t[1-6]_[a-z0-9]+$/)
```

**`schemas/link.ts`**: pick only the fields the mappers read, then loosen the volatile ones:

```ts
import * as z from 'zod'
import { LinkSchema } from './generated'

const ImageSource = z.object({ url: z.string(), width: z.number(), height: z.number() })
const Rendition = z.object({ source: ImageSource, resolutions: z.array(ImageSource) })
const PreviewImage = Rendition.extend({
  variants: z.object({ gif: Rendition, mp4: Rendition, obfuscated: Rendition, nsfw: Rendition }).partial().optional(),
})
const RedditVideo = z.object({
  hls_url: z.string(), fallback_url: z.string(), dash_url: z.string().optional(),
  width: z.number(), height: z.number(), duration: z.number().optional(), is_gif: z.boolean().optional(),
})
const MediaObject = z.object({
  reddit_video: RedditVideo.optional(),
  type: z.string().optional(),                                        // e.g. "youtube.com", "redgifs.com"
  oembed: z.object({ provider_name: z.string().optional(), title: z.string().optional(), thumbnail_url: z.string().optional(),
                     thumbnail_width: z.number().optional(), thumbnail_height: z.number().optional(),
                     width: z.number().nullable().optional(), height: z.number().nullable().optional() }).optional(),
})
// NOTE: oembed.html is deliberately NOT picked — it is never rendered (design §11).

export const Link = LinkSchema.pick({
  id: true, name: true, subreddit: true, author: true, title: true, permalink: true, url: true, domain: true,
  created_utc: true, score: true, hide_score: true, likes: true, num_comments: true, saved: true,
  over_18: true, spoiler: true, stickied: true, locked: true, archived: true, is_self: true, is_video: true,
  selftext_html: true, post_hint: true, thumbnail: true, link_flair_text: true, link_flair_background_color: true,
  link_flair_text_color: true, removed_by_category: true, url_overridden_by_dest: true,
}).extend({
  likes: z.boolean().nullable(),
  selftext_html: z.string().nullable().optional(),
  post_hint: z.string().optional(),
  url_overridden_by_dest: z.string().optional(),
  preview: z.object({
    images: z.array(PreviewImage),                                    // variants: gif, mp4, obfuscated, nsfw
    reddit_video_preview: RedditVideo.optional(),                     // Reddit's transcode of GIFs/external clips
    enabled: z.boolean().optional(),
  }).optional(),
  media: MediaObject.nullable().optional(),                           // { reddit_video?, type?, oembed? }
  secure_media: MediaObject.nullable().optional(),
  secure_media_embed: z.object({ media_domain_url: z.string().optional(), width: z.number().optional(), height: z.number().optional() }).optional(),
  is_gallery: z.boolean().optional(),
  gallery_data: z.object({ items: z.array(z.object({ media_id: z.string(), caption: z.string().optional() })) }).nullable().optional(),
  media_metadata: z.record(z.string(), z.unknown()).nullable().optional(),   // parsed per item in mappers/media.ts
  crosspost_parent_list: z.array(z.unknown()).optional(),
  link_flair_text: z.string().nullable().optional(),
})
export type RedditLink = z.infer<typeof Link>
export const LinkThing = thing('t3', Link)
```

If `pick` names a key the generated schema doesn't have, **typecheck fails**. That is intentional: it means the fixtures lack a sample for that field, so capture one.

The same approach applies to the other schemas:

- **`comment.ts`** (`Comment`, with `replies: z.unknown()`, parsed recursively in `comment-tree.ts`)
- **`more.ts`**
- **`subreddit.ts`**
- **`account.ts`** (includes `subreddit.user_is_subscriber`)
- **`multi.ts`** (`LabeledMulti`: `name`, `display_name`, `description_md`, `visibility`, `path`, `icon_url`, `subreddits: [{ name }]`, `can_edit`)
- **`me.ts`**
- **`responses.ts`**:
  - `CommentsResponse = z.tuple([ListingEnvelope, ListingEnvelope])`
  - `MoreChildrenResponse = z.object({ json: z.object({ errors: z.array(z.tuple([z.string(), z.string(), z.string().nullable()])), data: z.object({ things: z.array(z.unknown()) }).optional() }) })`
  - `FormResponse` (the same `json.errors` envelope) for `/api/comment` and `/api/editusertext`
  - `EmptyResponse = z.object({}).loose()`

**Schema docs (optional):** `scripts/reddit/export-json-schema.ts` runs `z.toJSONSchema()` over the curated schemas and writes `docs/reddit-schemas.json`. Hook it onto the end of `types:generate`.

### 2.5 `lib/reddit/listing.ts`: tolerant parsing

```ts
export function parseListing<T extends z.ZodType>(json: unknown, item: T, endpoint: string) {
  const env = ListingEnvelope.safeParse(json)
  if (!env.success) throw new RedditSchemaError(endpoint, env.error.issues)
  const items: z.infer<T>[] = []
  for (const child of env.data.data.children) {
    const r = item.safeParse(child)
    if (r.success) items.push(r.data)
    else console.warn('[reddit:schema]', endpoint, describeChild(child), z.prettifyError(r.error))
  }
  return { items, after: env.data.data.after, before: env.data.data.before }
}
```

### 2.6 View models and mappers

- **`lib/view-models.ts`** defines `Vote`, `SafeHtml`, `ImageSet`, `GalleryItem`, `VideoSources`, `PostContent`, `PostView`, `CommentView`, `CommentNode = { kind: 'comment'; comment: CommentView; replies: CommentNode[] } | { kind: 'more'; id: string; parentId: string; count: number; children: string[] }`, `SubredditView`, `UserView`, `MultiView`, and `Page<T> = { items: T[]; after: string | null; before: string | null }`. These match §7.
- **`lib/media/`** (the full design is in §8.7) is implemented in Phase 7. Phase 2 lands the schemas and the fixture corpus it needs. Comments pick `media_metadata` too, for inline media.
- **`mappers/media.ts`** builds `ImageSet` (`src`, `srcSet`, `width`, `height`, `alt`) from `preview.images[0]`. It builds gallery items from `gallery_data.items` joined to `media_metadata[id].s` and `.p` (each parsed with a small schema and dropped if invalid). Video comes from `media.reddit_video`.
- **`mappers/post.ts`** classifies `PostContent` in this order:
  1. `crosspost_parent_list[0]` parses as `Link` → `crosspost`
  2. gallery
  3. `is_video` → `video`
  4. `post_hint === 'image'` → `image`
  5. `is_self` → `self`
  6. `post_hint` is `rich:video` or there is an oembed → `embed`
  7. otherwise → `link`

  It also rewrites `permalink` to the app route and maps `likes: true/false/null` to `1/-1/0`.
- **`lib/reddit/sanitize.ts`** uses `sanitize-html` (design §8.9) with:
  - an allowlist of `p`, `a`, `em`, `strong`, `del`, `sup`, `sub`, `code`, `pre`, `blockquote`, `ul`, `ol`, `li`, `hr`, `br`, `h1`–`h6`, `table`, `thead`, `tbody`, `tr`, `th[align]`, `td[align]`, and `span` (class `md-spoiler-text` only)
  - `a[href]` only, with schemes `http`, `https`, and `mailto`
  - `transformTags.a`, which rewrites Reddit URLs to internal routes, adds `target="_blank" rel="noopener noreferrer nofollow"` to external links, and in Phase 7 hands bare media links to `lib/media/inline.ts`
  - `transformTags.span` for spoilers, which adds `tabindex="0" role="button" aria-label="Spoiler, activate to reveal"`
  - comments dropped (which removes `<!-- SC_OFF -->`), and the outer `div.md` unwrapped
  - `[deleted]` and `[removed]` bodies short-circuited to a muted system string

  It returns `html as SafeHtml`. It is the only place the brand is created.
- **`components/reddit-html.tsx`** is a Server Component. It renders `<div className={cx(styles.root, clamp && styles.clamp)} dangerouslySetInnerHTML={{ __html: html }} />` using `reddit-html.module.css` (§3.1), with a `clamp` variant for feed excerpts (a max height with a mask, lifted by `:has(details[open])`).

### Phase 2 acceptance

- [ ] Hitting `/api/dev/capture` writes at least 25 raw fixtures, and `npm run types:generate` produces `generated.ts` deterministically (running it twice gives no diff).
- [ ] `tests/unit/schemas.test.ts` shows every raw fixture parsing, and envelope failures equal 0. Per-item drops are logged and asserted to be below 1%.
- [ ] Mapper snapshot tests cover every `PostContent` variant, a deleted author, a removed post, and a crosspost.
- [ ] The sanitizer test runs an XSS corpus (`<script>`, `onerror`, `javascript:` hrefs, `<img>`, `style`, SVG) and all are stripped. Reddit links are rewritten.
- [ ] A rich-text snapshot corpus from real AskReddit and ELI5 fixtures (tables, nested lists, code blocks, spoilers, superscript, headings) renders faithfully.

---

## Phase 3: App shell, feeds, skeletons, and motion

**Goal:** `/home`, `/r/[subreddit]`, `/m/[multi]`, and `/user/[username]/m/[multi]` render with sorts, pagination, skeletons, and transitions, all instant on navigation.

### 3.1 CSS system (`app/styles/*`, design §10.4)

1. **Order and layers.** `app/layout.tsx` imports `./styles/layers.css` first (it contains only `@layer reset, tokens, base, components, utilities;`), then `reset.css`, `tokens.css`, `base.css`, and `utilities.css`. Every `*.module.css` wraps its rules in `@layer components { … }`, which Stylelint enforces.
2. **Tokens (`tokens.css`).** These hold the orangered scale, the semantic `light-dark()` tokens from design §10.4, and the type, space, radius, z-index, and motion tokens. Theme switching sets only `color-scheme`:

   ```css
   @layer tokens {
     :root {
       color-scheme: light dark;                         /* data-theme="system" */
       --orangered-6: #ff4500;  --orangered-8: #cb3400;   /* …full 0–9 scale… */
       --surface-page: light-dark(#ffffff, #0e0e10);
       --surface-card: light-dark(#ffffff, #1a1a1b);
       --surface-hover: light-dark(#f6f7f8, #272729);
       --border:       light-dark(#dadde1, #343536);
       --text-1:       light-dark(#1c1c1c, #d7dadc);
       --text-3:       light-dark(#7c7c7c, #818384);
       --accent:       light-dark(var(--orangered-8), var(--orangered-6));
       --upvote:       light-dark(#cb3400, #ff4500);
       --downvote:     light-dark(#4d62d6, #7193ff);
       --radius-2: 8px;  --radius-pill: 999px;
       --font-sans: var(--font-reddit-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
       --font-mono: var(--font-reddit-mono), ui-monospace, SFMono-Regular, Menlo, monospace;
       --duration-exit: 150ms;  --duration-enter: 210ms;  --duration-move: 400ms;
     }
     :root[data-theme='light'] { color-scheme: light; }
     :root[data-theme='dark']  { color-scheme: dark; }
   }
   ```

   `light-dark()` accepts colors only. Non-color tokens that differ by theme (for example shadow alpha) use `color-mix()` over color tokens.
3. **Contrast test.** `tests/unit/tokens.test.ts` parses `tokens.css`, resolves both sides of every `light-dark()` pair for the text/surface and accent/surface combinations, and asserts WCAG AA (4.5:1 for text, 3:1 for UI glyphs such as the vote arrows).
4. **Fonts.** `next/font/google` loads `Reddit_Sans` (variable, `display: 'swap'`, `variable: '--font-reddit-sans'`) and `Reddit_Mono` (`variable: '--font-reddit-mono'`), replacing the scaffold's Geist.
5. **Base (`base.css`).** Element defaults, the `:focus-visible` ring using `--focus-ring`, the view-transition recipes from the Next "View transitions" guide:
   - `slide-down` / `slide-up` for reveals
   - `nav-forward` / `nav-back` for directional slides with a 60px offset
   - `fade-in` / `fade-out` for list items
   - the header and sidebar anchored with `::view-transition-group(site-header) { animation: none; z-index: 100 }`
   - `::view-transition { pointer-events: none }`
   - the `prefers-reduced-motion` zeroing block

   It also holds the gallery carousel CSS (Phase 7).
6. **Utilities (`utilities.css`).** A closed set: `.visually-hidden`, `.stack` (vertical flow with `--stack-gap`), `.cluster` (wrapping inline group), and `.skeleton` (a `@keyframes shimmer` background, disabled under reduced motion). New utilities need a design-doc change.
7. **Reddit HTML (`components/reddit-html.module.css`).** Element-scoped typography under `.root`: `h1`–`h6`, `p`, `ul`/`ol`, `blockquote`, `pre`/`code` (Reddit Mono), tables (wrapped in horizontal scroll), `sup`, and `del`. Spoilers use `:global(.md-spoiler-text) { background: currentColor }`, cleared on `:hover`, `:focus`, and `:focus-within`. It also defines the `.clamp` variant (a max height with a mask, lifted by `:has(details[open])`).
8. **Tooling.**
   - `happy-css-modules` generates `.module.css.d.ts` files. Add `*.module.css.d.ts` to `.gitignore`, and run `npm run css:types:watch` alongside `next dev`. **VERIFY** that it parses `@layer` + native nesting. If it doesn't, fall back to `typed-css-modules`.
   - `.stylelintrc.json` extends `stylelint-config-standard` and `stylelint-config-css-modules`, and adds:
     - `color-no-hex` (disabled in `tokens.css`)
     - `declaration-property-unit-disallowed-list` for `px` in spacing properties (outside tokens)
     - `declaration-no-important` (except in the reduced-motion block)
     - a small custom rule (a local Stylelint plugin, about 20 lines) that fails any `*.module.css` whose top-level rules aren't inside `@layer components`

### 3.2 Motion primitives (`components/motion/*`, usable in Server Components)

```tsx
// page-transition.tsx
import { ViewTransition, type ReactNode } from 'react'
const DIRECTIONAL = { 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' } as const
export function PageTransition({ children }: { children: ReactNode }) {
  return <ViewTransition enter={DIRECTIONAL} exit={DIRECTIONAL} default="none">{children}</ViewTransition>
}

// reveal.tsx
export function SkeletonExit({ children }: { children: ReactNode }) {
  return <ViewTransition exit="slide-down" default="none">{children}</ViewTransition>
}
/** Content reveal on first load + crossfade when `contentKey` changes on the same route. */
export function ContentReveal({ contentKey, name, children }: { contentKey: string; name: string; children: ReactNode }) {
  return (
    <ViewTransition key={contentKey} name={name} share="auto" enter="slide-up" default="none">
      {children}
    </ViewTransition>
  )
}
```

**VERIFY:** that `name` is unique per page given `<Activity>`-hidden routes. Hidden routes are `display: none`, so they shouldn't participate in the transition, but confirm there are no duplicate-name warnings when going back and forth between two feeds.

### 3.3 URL state (`lib/url-state.ts`)

```ts
export const FEED_SORTS = ['best', 'hot', 'new', 'top', 'rising'] as const
export const TIME_RANGES = ['hour', 'day', 'week', 'month', 'year', 'all'] as const
const FeedQuery = z.object({
  sort: z.enum(FEED_SORTS).catch('best'),
  t: z.enum(TIME_RANGES).catch('day'),
  after: Fullname.optional().catch(undefined),
  before: Fullname.optional().catch(undefined),
  count: z.coerce.number().int().min(0).max(10_000).catch(0),
})
export type FeedQuery = z.infer<typeof FeedQuery>
export const parseFeedQuery = (sp: Record<string, string | string[] | undefined>) => FeedQuery.parse(flatten(sp))
export const feedKey = (q: FeedQuery) => `${q.sort}:${q.t}:${q.after ?? q.before ?? '0'}`
export function nextHref(base: string, q: FeedQuery, after: string) { /* keeps sort/t, sets after & count+25, drops before */ }
export function prevHref(base: string, q: FeedQuery, firstFullname: string) { /* before=first, count=count+1 */ }
```

The subreddit feed's default sort is `hot`; `best` is for home only. With `typedRoutes`, the href builders return `Route` types.

### 3.4 `(app)/layout.tsx`

```tsx
export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="app-grid">
      <Header />                                   {/* static; user menu inside its own Suspense */}
      <aside style={{ viewTransitionName: 'sidebar' }}>
        <Suspense fallback={<SidebarSkeleton />}><Sidebar /></Suspense>
      </aside>
      <main>{children}</main>
    </div>
  )
}
```

**VERIFY:** the correct `LayoutProps` route literal for a route-group layout. Check the generated types in `.next/types`.

- **`Header`** is static except for the `<Suspense fallback={<AvatarSkeleton/>}><UserMenu/></Suspense>`. `UserMenu` calls `getMe()` and renders a popover with Profile, Saved, Multis, Subscriptions, and a sign-out `<form action={signOut}>`. The search box is `<form action="/search">` with `<input name="q">`, which is plain GET navigation.
- **`Sidebar`** (async) calls `Promise.all([getMySubscriptions(), getMyMultis()])`. It renders links to Home, Saved, and Popular, then Multis, Communities (up to 50 plus "Manage →"), and People. Subscription paging (`limit=100`, up to 10 pages) runs **sequentially inside** `getMySubscriptions`, because each page depends on the previous cursor.
- **`NavDrawer`** (mobile) is `<button popovertarget="nav">☰</button>` plus `<div id="nav" popover>` holding the same `Sidebar` content. It needs no JS.

### 3.5 Feed page pattern (applies to all four feed routes)

```tsx
// app/(app)/r/[subreddit]/page.tsx
import { Suspense } from 'react'

export default function SubredditPage({ params, searchParams }: PageProps<'/r/[subreddit]'>) {
  return (
    <PageTransition>
      <Suspense fallback={<SkeletonExit><SubredditHeaderSkeleton /></SkeletonExit>}>
        <SubredditHeader params={params} />
      </Suspense>
      <Suspense fallback={<SkeletonExit><SortTabsSkeleton /><FeedSkeleton /></SkeletonExit>}>
        <SubredditFeed params={params} searchParams={searchParams} />
      </Suspense>
    </PageTransition>
  )
}

async function SubredditFeed({ params, searchParams }: Pick<PageProps<'/r/[subreddit]'>, 'params' | 'searchParams'>) {
  const [{ subreddit }, sp] = await Promise.all([params, searchParams])
  const q = parseFeedQuery(sp)
  const page = await getFeed({ type: 'subreddit', name: subreddit }, q)
  return (
    <section className="group">
      <SortTabs base={`/r/${subreddit}`} query={q} />
      <ContentReveal name="feed-content" contentKey={feedKey(q)}>
        <FeedList posts={page.items} showSubreddit={false} />
      </ContentReveal>
      <Pagination base={`/r/${subreddit}`} query={q} page={page} />
    </section>
  )
}
```

- **`SortTabs`** and **`Pagination`** are Server Components that render `<Link>`s. Each `<Link>` contains a `<LinkPendingHint />` island. `feed.module.css` has `.feed:has([data-pending]) .list { opacity: 0.6; transition: opacity var(--duration-exit) }`, so the list dims while the same-route navigation is pending and then crossfades.
- **Media in Phase 3.** `PostCard` renders `post.media` through `components/media/post-media.tsx`. In this phase the resolver chain ships with resolvers 1–3, 9, 11, and 12 (crosspost, removed, gallery images, image, self, link card). Everything else temporarily falls through to the link card, and Phase 7 completes it.
- **`PostCard`** is a Server Component. The title link and the comments link use `transitionTypes={['nav-forward']}`, and so do subreddit and author links.
- **Errors.** `SubredditHeader` and `SubredditFeed` are each wrapped in a `catchError` boundary (`components/section-error.tsx`, a client module). It shows a message and a `retry()` button for `RedditRateLimitError` and 5xx errors. `RedditNotFoundError` → `notFound()`. `RedditForbiddenError` → an inline "private / quarantined / banned" panel. `RedditAuthError` → `redirect('/api/auth/signout?reason=expired')`.
- **Multi routes:**
  - `/m/[multi]` resolves `/user/{me}/m/{multi}` using `getAuth().username`.
  - `/user/[username]/m/[multi]` uses the given user.
- `/r/popular` and `/r/all` need no special casing.

### 3.6 Islands for this phase

**`link-pending-hint.tsx`:**

```tsx
'use client'
import { useLinkStatus } from 'next/link'
export function LinkPendingHint() {
  const { pending } = useLinkStatus()
  return <span aria-hidden data-pending={pending ? '' : undefined} className="link-hint" />
}
```

**`vote-buttons.tsx`** and **`save-button.tsx`** implement the §8.6 pattern through **`use-enhanced-form.ts`**. This hook keeps forms progressively enhanced while adding optimistic transitions:

```ts
'use client'
import { startTransition, useState, useTransition, addTransitionType, type FormEvent } from 'react'
import type { ActionResult } from '@/lib/actions/result'

/**
 * Renders <form action={serverAction}> (works pre-hydration / no-JS) and, once hydrated,
 * intercepts submit to run the action inside a transition with optimistic updates.
 */
export function useEnhancedForm<T>(
  serverAction: (formData: FormData) => Promise<ActionResult<T>>,
  handlers: {
    optimistic: (formData: FormData) => void
    settled?: (result: ActionResult<T>, formData: FormData) => void
    transitionType?: string
  },
) {
  const [isPending, startPending] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const submitter = (event.nativeEvent as SubmitEvent).submitter
    const formData = new FormData(event.currentTarget, submitter)
    startPending(async () => {
      if (handlers.transitionType) addTransitionType(handlers.transitionType)
      handlers.optimistic(formData)
      setError(null)
      const result = await serverAction(formData)
      startTransition(() => {
        if (!result.ok) setError(result.error.message)
        handlers.settled?.(result, formData)
      })
    })
  }

  return { formProps: { action: serverAction, onSubmit }, isPending, error }
}
```

**VERIFY (spike before Phase 3 islands):**

1. `event.preventDefault()` in `onSubmit` stops React from also invoking a function `action`.
2. With JS disabled, `<form action={serverAction}>` posts and re-renders the page.
3. `FormData(form, submitter)` includes the clicked button's `name=dir value=1`.

If (1) fails, render `action={serverAction}` only until hydration. Use `useSyncExternalStore` for an "is hydrated" flag, then switch to `action={clientFn}`.

**`VoteButtons`:**

```tsx
'use client'
export function VoteButtons({ fullname, likes, score, hideScore, disabled }: VoteProps) {
  const [confirmed, setConfirmed] = useState({ likes, score })
  const [view, setView] = useOptimistic(confirmed)
  const next = (target: Vote) => { const dir = view.likes === target ? 0 : target; return { likes: dir, score: view.score - view.likes + dir } }
  const { formProps, error } = useEnhancedForm(vote, {
    optimistic: (fd) => setView(next(Number(fd.get('target')) as Vote)),
    settled: (r, fd) => { if (r.ok) setConfirmed(next(Number(fd.get('target')) as Vote)) },
  })
  // <form {...formProps}> with hidden id, hidden dir (computed server-side for no-JS), and two
  // <button name="target" value="1|-1" aria-pressed={view.likes === 1}> …
}
```

Without JS, the server action reads `target` together with the current `likes` (a hidden input) to compute `dir`. So `vote` accepts `{ id, target, current }` and computes `dir` on the server, and the same logic serves both paths.

### 3.7 Server Actions: shared plumbing

**`lib/actions/result.ts`:**

```ts
export type ActionErrorCode = 'INVALID' | 'RATE_LIMITED' | 'FORBIDDEN' | 'NOT_FOUND' | 'REDDIT' | 'UNKNOWN'
export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: { code: ActionErrorCode; message: string } }
```

**`lib/actions/run-action.ts`** maps errors to `ActionResult`:

- `RedditAuthError` → `redirect('/api/auth/signout?reason=expired')`
- `RedditRateLimitError` → `RATE_LIMITED` ("Rate limited, retry in Ns")
- `RedditApiError` with a Reddit code → a friendly message (`THREAD_LOCKED`, `TOO_OLD`, `RATELIMIT`, `TOO_LONG`, `DELETED_COMMENT`, …)
- anything else → `UNKNOWN`, and the error is logged

Framework control-flow errors (`redirect`, `notFound`) are re-thrown with `unstable_rethrow`. **VERIFY** its name and export in 16.3; see `04-functions/unstable_rethrow.md`.

**`app/actions/votes.ts`:**

```ts
'use server'
import * as z from 'zod'
const Input = z.object({ id: z.string().regex(/^t[13]_[a-z0-9]+$/), target: z.enum(['1', '-1']), current: z.enum(['1', '0', '-1']) })
export async function vote(formData: FormData): Promise<ActionResult> {
  const parsed = Input.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return invalid()
  const target = Number(parsed.data.target) as 1 | -1
  const dir = Number(parsed.data.current) === target ? 0 : target
  return runAction(() => castVote(parsed.data.id, dir))   // DAL: requireAuth() inside
}
```

### 3.8 Settings (theme and NSFW blur, design §8.8)

- **`lib/settings.ts`** defines `THEME_COOKIE = 'rv_theme'`, `BLUR_COOKIE = 'rv_blur_nsfw'`, `SETTINGS_MAX_AGE = 60 * 60 * 24 * 365`, and the `Theme = 'system' | 'light' | 'dark'` type. `getSettings()` reads cookies and validates with `z.enum(...).catch(default)`. It is called only inside Suspense-wrapped request components.
- **`app/actions/settings.ts`:**
  - `setTheme(formData)` validates, sets `rv_theme` (not httpOnly, `Secure`, `SameSite=Lax`, one year), and returns `{ ok: true }`. It **doesn't** call `refresh()`, because the client already applied the theme. This action is the no-JS path.
  - `setBlurNsfw(formData)` sets `rv_blur_nsfw` (httpOnly, one year) and calls `refresh()`.
- **`ThemeToggle`** (island): a three-way radio group with System, Light, and Dark. On change it runs:

  ```ts
  const apply = () => {
    document.documentElement.dataset.theme = next
    document.cookie = `rv_theme=${next}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`
  }
  if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(apply)
  else apply()
  ```

  Its initial checked state comes from a lazy `useState` initializer that reads `document.documentElement.dataset.theme` (the "Syncing with React state" pattern in the flash guide). It is wrapped in `<form action={setTheme}>` for no-JS use.
- **`SettingSwitch`** (island): `useOptimistic(checked)` plus `useEnhancedForm(setBlurNsfw)`, rendered as `role="switch" aria-checked`.
- **`/settings` page:** both controls with short descriptions. When the blur cookie is absent it defaults to `on`, and nothing is read from Reddit preferences.

### Phase 3 acceptance

- [ ] All feed routes render, with sorts and the time range working, and Next and Previous pagination correct against Reddit (no duplicate or skipped posts over 5 pages).
- [ ] The dev overlay shows **zero** instant-navigation insights for these routes.
- [ ] A client navigation from `/home` to `/r/x` paints the header and feed skeletons on the click frame, then reveals the content with slide-up. A forward link slides left, and a breadcrumb back slides right. The header and sidebar stay fixed.
- [ ] Changing the sort dims the list and then crossfades it, with no skeleton flash.
- [ ] Browser back from a post restores the feed scroll position instantly (Activity).
- [ ] Voting is instant, persists after reload, and an injected failure rolls back with an inline message. With JS disabled, voting works via a full POST.
- [ ] Lighthouse on `/home` passes accessibility and has zero CLS from skeleton → content.
- [ ] Styling: there are no Tailwind or PostCSS dependencies, all component CSS is in `@layer components` modules with generated `.d.ts` types, Stylelint is clean, and the token contrast test passes in both themes. The UI primitives in design §10.4 exist, and none of them is a client component unless listed as an island.
- [ ] Theme: switching crossfades, reloading shows **no flash** in the chosen theme, and the choice survives a full browser restart. The blur toggle survives a restart too (both are one-year cookies).

---

## Phase 4: Post page, comments, and composer

**Goal:** full threads, load more, continue thread, commenting, and editing and deleting your own comments.

### 4.1 Data

- **`api/comments.ts`:** `getThread({ id, sort, focusCommentId, more })`:
  1. `GET /comments/{id}` with `sort`, `limit=200`, and `depth=8`, plus `comment` and `context=3` when focusing.
  2. Parse `CommentsResponse`.
  3. Map the post.
  4. Build the tree with `comment-tree.ts`, parsing each child tolerantly and recursing into `replies`.
  5. If `more` is non-empty, call `resolveMore(tree, linkId, moreIds, sort)`.
- **`lib/reddit/more.ts`** is a pure function plus one I/O callback, and is unit-tested:
  1. Find `more` nodes whose `id` is in `moreIds` (at most 20).
  2. Collect their `children` ids, up to 100.
  3. Call `GET /api/morechildren` (with `link_id=t3_…`, `children=…`, `sort`, `limit_children=false`, and `api_type=json`), then parse `MoreChildrenResponse`.
  4. Assemble the flat things by `parent_id` into subtrees, and replace each resolved `more` node with its subtree (plus any leftover `more` that Reddit returns).
  5. Repeat for newly revealed `more` ids that are in `moreIds`, up to 3 rounds.

### 4.2 Rendering

- **The page** (`/r/[subreddit]/comments/[id]/[[...rest]]`):
  - `rest[0]` is the slug (ignored for data) and `rest[1]` is the focus comment id.
  - Wrap in `PageTransition`.
  - One `<Suspense fallback={<SkeletonExit><PostSkeleton/><CommentTreeSkeleton/></SkeletonExit>}>`, because a single Reddit call feeds both.
  - A "← r/{subreddit}" breadcrumb with `transitionTypes={['nav-back']}`.
- **`Comment`** (Server Component):

  ```tsx
  <article id={`c-${c.id}`} aria-labelledby={`c-${c.id}-h`}>
    <details open>
      <summary id={`c-${c.id}-h`}>{author} · {score} · <time dateTime>{rel}</time>{edited && ' · edited'}</summary>
      <RedditHtml html={c.bodyHtml} />
      <footer>
        <VoteButtons … />  <SaveButton … />
        <details className="reply"><summary>Reply</summary><CommentComposer parent={c.fullname} postPath={…} /></details>
        {c.isMine && <>{/* edit <details> with composer prefilled from c.bodyMarkdown; delete popover form */}</>}
      </footer>
      <ol role="list">{replies.map((node) => <li key={…}><ViewTransition key={id} enter="fade-in" exit="fade-out" default="none">…</ViewTransition></li>)}</ol>
    </details>
  </article>
  ```

  `CommentView.bodyMarkdown` (the raw `body`) is included **only** when `author === me`, so the edit textarea can be prefilled.
- **`MoreLink`** renders `<Link href={withMore(currentHref, id) + '#c-' + parentId} scroll={false}>Load {count} more replies</Link>`. When `count === 0` or the id cap is hit, it renders "Continue this thread →", linking to the permalink with `transitionTypes={['nav-forward']}`.
- **Single-thread view** shows a banner: "You're viewing a single comment thread. View all comments →".
- **Locked or archived** posts render voting and composers disabled, with a banner.

### 4.3 `CommentComposer` island

```tsx
'use client'
export function CommentComposer({ parent, me }: { parent: string; me: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, addPending] = useOptimistic<PendingComment[], PendingComment>([], (list, c) => [c, ...list])
  const [draft, setDraft] = useState<string | null>(null)
  const { formProps, isPending, error } = useEnhancedForm(postComment, {
    transitionType: 'list-change',
    optimistic: (fd) => {
      const text = String(fd.get('text') ?? '').trim()
      addPending({ id: crypto.randomUUID(), author: me, text })
      setDraft(text)
      formRef.current?.reset()
    },
    settled: (r) => { if (r.ok) setDraft(null) },   // on failure, draft is restored into the textarea
  })
  // <form ref={formRef} {...formProps}> <input type=hidden name=parent> <textarea name=text defaultValue={error ? draft ?? '' : ''}
  //   onKeyDown={⌘/Ctrl+Enter → formRef.current?.requestSubmit()} maxLength={10000} required/>
  //   <PendingButton pending={isPending}>Comment</PendingButton> {error && <p role="alert">{error}</p>}
  // {pending.map(c => <ViewTransition key={c.id} enter="fade-in" default="none"><PendingCommentCard …/></ViewTransition>)}
}
```

**`app/actions/comments.ts`:**

- **`postComment`**: validates `{ parent: /^t[13]_/, text: 1..10000 }`, then `POST /api/comment`. It parses the `FormResponse`, and any `json.errors` → `ActionResult` error. On success it calls `refresh()` and returns `{ ok: true, data: { id } }`.
- **`editComment`**: `POST /api/editusertext`, then `refresh()`.
- **`deleteComment`**: `POST /api/del`, then `refresh()`.

**R7 check:** confirm that the `refresh()` render includes the just-posted comment on a busy thread. If it doesn't, have `postComment` `redirect()` to the new comment's permalink instead.

### Phase 4 acceptance

- [ ] Threads with more than 500 comments render, with "Load N more" expanding in place without losing scroll, and "Continue this thread" navigating forward.
- [ ] Comment sort links crossfade.
- [ ] A comment or reply shows a pending card immediately, which is replaced by the real comment without flicker. On an error (a locked thread), the draft is restored and the reason is shown.
- [ ] Editing and deleting your own comments work, and the delete confirm is a popover.
- [ ] With JS disabled, you can post a comment, and the page re-renders with it.

---

## Phase 5: Saved, subscriptions, follow, search, and profile

- **`/saved`**: `getSaved({ type, after, before, count })` returns a mixed `t3`/`t1` listing. Parse each child as `z.discriminatedUnion('kind', [LinkThing, CommentThing])`. Comment cards include the post title and a "View context" link. Type filter links crossfade.
- **`SubscribeButton`** (subreddits and users): `useOptimistic(subscribed)` with `useEnhancedForm(setSubscription)`.
  - The action validates `{ name, kind: 'subreddit' | 'user', action: 'sub' | 'unsub' }`. `sr_name` is `name` for a subreddit or `u_${name}` for a user.
  - It calls `POST /api/subscribe` with `skip_initial_defaults=true`, then `refresh()`.
  - The sidebar row enters or exits with `fade-in`/`fade-out` (`list-change`).
- **`/subreddits`**: tabs (links) for Communities and People, and a `?q=` GET filter applied server-side to the fully paged subscription list. Rows use `SubscribeButton`, and unsubscribe confirms through a popover.
- **`/search`**: `GET /subreddits/search` with `q` and cursors. Results carry a `SubscribeButton` and the `AddToMultiMenu`.
- **`/user/[username]`**:
  - `ProfileHeader` calls `getUser(username)`, which returns karma, cake day, avatar, and `following = subreddit.user_is_subscriber`, and renders the Follow `SubscribeButton`.
  - Tabs (`overview`, `submitted`, `comments`) are links.
  - The listing is mixed and parsed like saved items.
  - A suspended or shadowbanned user (404 or `is_suspended`) gets a friendly state.

### Phase 5 acceptance

- [ ] Subscribe and unsubscribe, and follow and unfollow, are reflected immediately and in the sidebar after the refresh. Reloading confirms them.
- [ ] Searching "typescript" returns subreddits, and subscribing from the results works.
- [ ] Saved shows posts and comments, and unsave works.

---

## Phase 6: Multireddit management

- **Data (`api/multis.ts`):** `getMyMultis()`, `getMulti(name)` (`expand_srs=true`), `createMulti`, `updateMulti`, `deleteMulti`, `addSubredditToMulti`, and `removeSubredditFromMulti`, per §6.1. The `model` is JSON-stringified from a typed `MultiModel = { display_name; description_md; visibility: 'private' | 'public' | 'hidden'; subreddits: { name: string }[] }`.
- **Name slug:** `display_name` → lowercase, non-alphanumeric characters become `_`, then trim and truncate to 50. If Reddit rejects it, show Reddit's error. **VERIFY** Reddit's accepted multi name pattern against a real create call.
- **`app/actions/multis.ts`:** every action Zod-validates, derives the multipath from `requireAuth().username` (never from the client), and calls `refresh()`. `createMulti` then `redirect()`s to `/multis/{name}`, and `deleteMulti` `redirect()`s to `/multis`.
- **`addToMulti`** first calls `GET /r/{sr}/about` to validate that the subreddit exists and normalize its capitalization. On a 404 it returns `NOT_FOUND` ("r/{sr} doesn't exist").
- **UI:**
  - `/multis`: a list plus a create form (`PendingButton`).
  - `/multis/[multi]`:
    - A details form with display name, description, and visibility radios.
    - `MultiSubredditList`: rows with a Remove form, using `MembershipToggle` (an optimistic island) and exit animation.
    - An "Add a subreddit" form.
    - `MultiSuggestions`: subscribed communities not in the multi, each with an Add button, server-rendered.
    - A danger-zone delete popover.
  - **`AddToMultiMenu`** (subreddit header and search results): a `popover` listing multis, each a `MembershipToggle` form with an optimistic checkmark.
- **Skeleton:** `MultiEditorSkeleton`.

### Phase 6 acceptance

- [ ] The full CRUD cycle works: create, rename, change visibility, add 3 subreddits (via the form, a suggestion, and the subreddit header menu), remove 1, view the multi feed, and delete.
- [ ] An invalid subreddit name shows an inline error, and nothing is written.
- [ ] Every step works with JS disabled.

---

## Phase 7: Media detection and playback

**Goal:** implement design §8.7 end to end. After this phase, GIFs animate, Reddit video plays with audio, embeds work (including NSFW Redgifs), inline media renders in comments, and no post renders broken media.

### 7.0 Spikes (do these first, about half a day)

**Already settled by `~/Local/viewer-for-reddit`:**
- `hls.js` works directly against `v.redd.it`, so no proxy is needed.
- The inline media link shapes are confirmed.
- Redgifs' own player has audio, while Reddit's mirror is often silent.

**Fresh build, lessons only.** This is a new app, not a port. **Don't copy code, components, or tests** from `viewer-for-reddit`. Use it only as a record of real-world lessons, which are already folded into design §8.7 and §8.10:
- Giphy, Imgur, and Redgifs URL quirks.
- Thumbnail sentinel values.
- Silent Reddit mirrors.
- The iOS IntersectionObserver bug with playing `<video>`.
- Capping the number of concurrent players.
- The inline media link shapes.
- Skipping the carousel for single-item galleries.

Write every implementation and test here from the design, against our own captured fixtures.

**Remaining spike:** confirm the inline-media shapes also cover `media_metadata`-backed uploads that don't use bare-URL link text (captions).

### 7.1 Files

```
lib/media/
  url.ts                 safeUrl(input): URL | null  (https-only; http→https for known media hosts; rejects creds/ports)
                         hostMatches(url, host)       (exact, or ".suffix" boundary match)
  images.ts              toImageSet(rendition, alt), blurredOf(previewImage)
  detect.ts              resolveMedia(link, ctx) → PostMedia; runs RESOLVERS in order; logs media:unresolved
  resolvers/*.ts         one pure function each: (link, ctx) => PostMedia | null
  providers/registry.ts  PROVIDERS: readonly Provider[]; findProvider(url); cspSources()
  providers/{youtube,vimeo,streamable,twitch,redgifs,giphy,imgur,tiktok,spotify,soundcloud,social-link-only}.ts
  inline.ts              media_metadata → inline <figure>/<img>/<video> (called from sanitize.ts)
components/media/
  post-media.tsx         switch (media.type) → component; wraps in <MediaReveal> when nsfw/spoiler
  media-reveal.tsx       <details> with Reddit's pre-blurred poster as the summary (server)
  media-image.tsx        <img srcset> and the <picture> reduced-motion GIF (server)
  gallery.tsx            CSS-first carousel + server-rendered lightbox <dialog> (design §8.10)
  link-card.tsx          (server)
components/islands/
  autoplay-video.tsx     IntersectionObserver play/pause; reduced motion; Activity cleanup
  reddit-video.tsx       HLS (native or dynamic hls.js); fallback mp4 + "no audio" badge
  embed-facade.tsx       poster → iframe on click
```

### 7.2 Key implementations

**`detect.ts`:**

```ts
const RESOLVERS = [crosspost, removed, gallery, redditVideo, provider, videoPreview,
                   animatedVariants, directFile, imageHint, oembedFallback, self, linkCard] as const

export function resolveMedia(link: RedditLink, ctx: MediaCtx): PostMedia {
  for (const resolve of RESOLVERS) {
    const media = resolve(link, ctx)
    if (media) return media
  }
  return { type: 'none' } // unreachable: linkCard always resolves; kept for exhaustiveness
}
```

`linkCard` logs `media:unresolved` when `post_hint` is one of `rich:video`, `hosted:video`, or `image`, or when `secure_media` is set.

**Provider example (`providers/youtube.ts`):**

```ts
const ID = /^[\w-]{11}$/
export const youtube: Provider = {
  id: 'youtube',
  hosts: ['youtube.com', '.youtube.com', 'youtu.be', 'youtube-nocookie.com', '.youtube-nocookie.com'],
  parse(url) {
    const id = url.hostname === 'youtu.be'
      ? url.pathname.slice(1)
      : url.searchParams.get('v') ?? url.pathname.match(/^\/(?:shorts|live|embed)\/([^/?#]+)/)?.[1]
    if (!id || !ID.test(id)) return null
    return {
      id,
      start: String(parseStart(url.searchParams.get('t') ?? url.searchParams.get('start'))),
      shorts: String(url.pathname.startsWith('/shorts/')),
    }
  },
  resolve({ id, start, shorts }, link) {
    const src = new URL(`https://www.youtube-nocookie.com/embed/${id}`)
    src.searchParams.set('autoplay', '1')
    src.searchParams.set('playsinline', '1')
    if (Number(start) > 0) src.searchParams.set('start', start)
    return {
      type: 'embed',
      poster: previewImage(link) ?? ytThumb(id),
      embed: {
        provider: 'youtube', title: link.title, iframeSrc: src.toString(),
        aspectRatio: shorts === 'true' ? 9 / 16 : 16 / 9,
        allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
        sandbox: EMBED_SANDBOX, originalUrl: link.url,
      },
    }
  },
  csp: { frameSrc: ['https://www.youtube-nocookie.com'], imgSrc: ['https://i.ytimg.com'] },
}
```

**`providers/redgifs.ts`**: `resolve` returns `embed('https://www.redgifs.com/ifr/{id}')`, because the Redgifs player carries audio. When no id parses from `url` or from the allowlisted oEmbed `src`, it falls back to `videoPreview(link)` as an animated, silent loop. Its tests cover the watch, ifr, and v3 URLs, a URL with an extension, the oEmbed-only case, and the NSFW blurred-facade case.

**`AutoplayVideo` island:**

```tsx
'use client'
import { useEffect, useEffectEvent, useRef } from 'react'

export function AutoplayVideo({ mp4, poster, width, height, label }: LoopVideoProps) {
  const ref = useRef<HTMLVideoElement>(null)
  const onVisibility = useEffectEvent((visible: boolean) => {
    const v = ref.current
    if (!v) return
    if (visible && !matchMedia('(prefers-reduced-motion: reduce)').matches) void v.play().catch(() => {})
    else v.pause()
  })
  useEffect(() => {
    const v = ref.current
    if (!v) return
    const io = new IntersectionObserver(([e]) => onVisibility(!!e && e.intersectionRatio >= 0.5), { threshold: [0, 0.5] })
    io.observe(v)
    return () => { io.disconnect(); v.pause() } // also runs when <Activity> hides the route
  }, [])
  return (
    <video ref={ref} src={mp4} poster={poster} width={width} height={height}
      muted loop playsInline autoPlay preload="metadata" aria-label={label} />
  )
}
```

`useEffectEvent` is stable in React 19.3.

**`EmbedFacade` island:** it server-renders `<a href={originalUrl} className="facade">` containing the poster, a provider badge, and a ▶ icon. On click (after hydration), `preventDefault` and `setActive(true)` render:

```tsx
<iframe src={iframeSrc} allow={allow} sandbox={sandbox} referrerPolicy="strict-origin-when-cross-origin" allowFullScreen title={title} />
```

The `aspect-ratio` is kept, so there is no layout shift, and focus moves to the iframe.

**`player-registry.ts`** (a client module shared by `RedditVideo` and `AutoplayVideo`) is a fresh implementation of the lessons in design §8.7:
- One lazily created **attach** IntersectionObserver (`rootMargin: '600px 0px'`) and one **visibility** observer (`threshold: 0.25`), with callbacks kept in `Map<Element, fn>`. Observers are disconnected when their map empties.
- It **observes the wrapper `<div>`**, never the `<video>`, because of the iOS WebKit bug with layer-promoted playing videos.
- `MAX_ACTIVE_PLAYERS = 6`. Before attaching, it evicts the oldest offscreen entry back to its poster.
- On play of an audible player, it pauses other audible players. GIF-style loops are exempt both ways.

**`RedditVideo` island:**
1. Render a poster `<img>` in a sized wrapper, then register for lazy attach.
2. On attach, create `<video controls playsInline preload="none" poster>`. If `canPlayType('application/vnd.apple.mpegurl')` is true, set `src = hls`. Otherwise run `const { default: Hls } = await import('hls.js')`, then `new Hls({ capLevelToPlayerSize: true })`, `loadSource(hls)`, and `attachMedia(video)`.
3. On a fatal HLS error, run `hls.destroy()`, set `src = mp4Fallback`, and show the "no audio" badge. Log `media:video_error { src, code }`.
4. On detach, eviction, or unmount (which includes Activity hiding the route), run `hls?.destroy()`, pause, remove `src`, and call `load()` to release the decoder.

**`inline.ts` + `sanitize.ts`** (design §8.7, "Inline media"): `transformTags.a` receives the parsed `<a>`. The link text comes from the `textFilter`/`exclusiveFilter` pass. **VERIFY** how to access the link text in sanitize-html 2.17; if it isn't reachable, pre-parse with `htmlparser2`, which sanitize-html already depends on. Conversions:
- **Bare media links** (the text is empty or equals the href, and the host is allowlisted):
  - `.jpg`, `.jpeg`, `.png`, or `.webp` → `<figure><img loading="lazy" decoding="async" alt="">`
  - `.gif` or `.gifv` on Imgur → `<video src=…mp4 muted loop playsinline autoplay preload="metadata">`
  - other `.gif` → `<img>` inside the reduced-motion `<picture>`
- **Giphy** (`giphy.com/gifs/<slug>-<id>`, `media.giphy.com/media/<id>/…`, `i.giphy.com/<id>.gif`) → the MP4 loop `media.giphy.com/media/<id>/giphy.mp4`.
- **`media_metadata` matches:** `e: 'Image'` → `<figure><img src={s.u} width height>`. `e: 'AnimatedImage'` → the `s.mp4` loop, or `s.gif`. The caption comes from the metadata.

Links with meaningful text stay links. The allowlist adds `figure`, `figcaption`, `picture`, `source`, `img[src|srcset|width|height|alt|loading]`, and `video[src|poster|muted|loop|playsinline|autoplay|preload|width|height]`, with `src` hosts restricted to `i.redd.it`, `preview.redd.it`, `external-preview.redd.it`, `*.giphy.com`, and `i.imgur.com`.

**VERIFY:** that many inline autoplaying comment GIFs perform acceptably on long threads. If they don't, render them as a poster `<img>` that links to the media.

**Galleries (design §8.10):**

- **`resolvers/gallery.ts`**
  - Joins `gallery_data.items` to `media_metadata`, parsing each entry with a small schema:
    - `status`
    - `e: 'Image' | 'AnimatedImage' | 'RedditVideo'`
    - `s` (`u` / `gif` / `mp4` / `x` / `y`)
    - `p[]`
    - `o[]` (obfuscated)
    - `hlsUrl`
  - Skips entries whose `status` isn't `valid`.
  - Returns `null` if no items survive, and the single item's media if exactly one survives.
- **`components/media/gallery.tsx`** (Server Component) renders:

  ```tsx
  <section className="gallery" data-variant={variant}>
    <ul className="gallery-track" tabIndex={0} role="region" aria-roledescription="carousel"
        aria-label={`Gallery, ${items.length} items`} style={{ aspectRatio: clampRatio(items[0]) }}>
      {items.map((item, i) => (
        <li key={item.id} id={`g-${postId}-${i}`} aria-roledescription="slide" aria-label={`${i + 1} of ${items.length}`}>
          <a href={item.fullSizeUrl} target="_blank" rel="noopener" data-index={i} className="gallery-open">
            <SlideMedia item={item} eager={eager && i === 0} alt={altFor(item, title, i, items.length)} />
          </a>
          <span className="gallery-badge">{i + 1} / {items.length}</span>
          {(item.caption || item.outboundUrl) && <p className="gallery-caption">…</p>}
        </li>
      ))}
    </ul>
    <dialog id={`lb-${postId}`} closedby="any" className="lightbox" aria-label={`${title}, full screen`}>
      {/* full-viewport scroll-snap strip of full-size sources, loading="lazy", captions, "Open original ↗", close button */}
    </dialog>
    <GalleryLightbox postId={postId} count={items.length} />
  </section>
  ```

  **VERIFY** that React 19.3 and `@types/react` accept the `closedby` attribute on `<dialog>`. If they don't, spread it via a typed attribute helper.
- **`app/styles/base.css`, gallery section (inside `@layer base`):**

  ```css
  .gallery-track { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; overscroll-behavior-x: contain; scrollbar-width: none; }
  .gallery-track > li { flex: 0 0 100%; scroll-snap-align: center; }
  @supports selector(::scroll-button(*)) {
    .gallery-track { scroll-marker-group: after; }
    .gallery-track::scroll-button(left)  { content: '‹' / 'Previous image'; }
    .gallery-track::scroll-button(right) { content: '›' / 'Next image'; }
    .gallery-track > li::scroll-marker { content: '' / attr(aria-label); }
    .gallery-track > li::scroll-marker:target-current { background: var(--color-accent); }
  }
  @media (prefers-reduced-motion: no-preference) { .gallery-track { scroll-behavior: smooth; } }
  ```

  **VERIFY** the selector and property names against the current Chromium implementation during Phase 7. The CSS Carousel spec is still moving.
- **`GalleryLightbox`** (island) delegates clicks on `.gallery-open` inside its section. It then:
  1. Calls `preventDefault()`.
  2. Sets `viewTransitionName = 'gallery-hero'` on the clicked image and the target lightbox image.
  3. Runs `document.startViewTransition(() => { dialog.showModal(); target.scrollIntoView({ container: 'nearest', behavior: 'instant' }) })`, falling back to calling those directly when View Transitions aren't supported or motion is reduced.
  4. Clears the names in `transition.finished`.

  Keys: ←/→ call `scrollBy({ left: ±width })` on the lightbox strip, and a `scrollend` listener updates the live region "Image i of n". On `close`, it reverse-morphs and focuses the originating link. Cleanup (including when Activity hides the route) closes the dialog if it's open.

**NSFW rendering:**
- `MediaReveal` wraps media when `(post.flags.nsfw && settings.blurNsfw) || post.flags.spoiler`. `settings` comes from `getSettings()` (§3.8), read once per request with `cache()` and passed down as a prop.
- When blurring is off, NSFW media renders directly with an "NSFW" badge, and GIF loops autoplay as usual.

### 7.3 Other items in this phase

- **Relative time** is computed on the server (`format.ts`) in request-time components, with a `<time dateTime title>` element.
- **Popover hygiene:** a `usePopoverAutoClose` cleanup in the menu islands closes any open popover when the route is hidden by Activity. **VERIFY** whether a native `popover` inside a `display: none` Activity subtree is already hidden. If it is, skip this.

### Phase 7 acceptance

- [ ] **Corpus:** `tests/media/corpus/*.json` has at least 2 real samples per resolver and per provider, including NSFW Redgifs (both the transcode and iframe paths), a spoiler, a crossposted video, a gallery with a GIF item, a removed post, thumbnail sentinels, a `v.redd.it` GIF versus a video, an Imgur GIFV, and a Giphy comment. All pass, and `media:unresolved` fires for fewer than 2% of corpus posts.
- [ ] **URL safety:** spoofed hosts (`youtube.com.evil.com`, `evil.com/youtube.com/watch?v=…`, `https://youtube.com@evil.com`), `javascript:` and `data:` URLs, and over-long or odd ids are all rejected.
- [ ] **Playback (Playwright, Chromium and WebKit):**
  - A GIF loop's `currentTime` advances while it is visible and pauses offscreen.
  - Reddit video plays with an audio track.
  - An embed makes zero requests to the provider host before the click, and the iframe loads after it.
  - A blurred NSFW post makes zero requests for its real media before reveal.
  - Under `prefers-reduced-motion`, nothing autoplays.
- [ ] **Galleries:** a mixed gallery (images, a GIF, and a video) swipes and scrolls, the buttons and dots appear in Chromium, and Safari and Firefox fall back to swipe plus badges. The lightbox opens at the tapped slide with a morph, ←/→ and `Esc` work, focus returns on close, and no full-size image is requested before the lightbox opens. A gallery with one valid item renders as a plain image.
- [ ] Manual check with one of each: YouTube (including a Short and a `t=` start time), Vimeo, Streamable, a Twitch clip, Redgifs, Giphy, Imgur GIFV and album, TikTok, Spotify, SoundCloud, a mixed gallery, and inline images and GIFs in comments.

---

## Phase 8: Hardening, tests, and CI

1. **CSP.** Set it in `proxy.ts` with a nonce, per the bundled `content-security-policy.md` guide. It is **built from `providers/registry.ts` `cspSources()`** plus these base sources:
   - `img-src 'self' data: https://*.redd.it https://*.redditmedia.com https://*.redditstatic.com` plus the provider image hosts
   - `media-src 'self' blob: https://v.redd.it https://i.imgur.com https://*.giphy.com` plus the provider media hosts
   - `connect-src 'self' https://v.redd.it` (for `hls.js`, which fetches playlists and segments directly)
   - `script-src 'self' 'nonce-…'` covering the inline theme script (or its sha256 hash)
   - `frame-src` with the provider embed hosts only
   - `frame-ancestors 'none'`

   A unit test snapshots the generated policy.
2. **Error pages:** `(app)/error.tsx` (`catchError`-style retry), `not-found.tsx`, and a global error page.
3. **Vitest.**
   - `vitest.config.mts` uses the `node` environment, aliases `server-only` to an empty stub and `@/` to the root, and processes `*.module.css` with non-scoped class names so markup assertions are readable.
   - **Coverage is enforced at 90%** for branches, functions, lines, and statements (`coverage.thresholds`, v8 provider). `npm test` runs `vitest run --coverage`, so `npm test` and `npm run check` fail below the floor. Coverage includes `lib/`, `app/`, `components/`, `scripts/`, `stylelint/`, and `proxy.ts`. Only `lib/reddit/schemas/generated.ts` and `*.d.ts` are excluded. New code ships with its tests; the threshold is never lowered to land a change.
   - `tests/helpers/render-server.tsx` renders Server Component trees with `prerender` from `react-dom/static`, which awaits async components and settles every Suspense boundary, so tests assert final HTML. `tests/helpers/cookie-jar.ts` fakes `cookies()`.
   - Suites cover: auth cookies, session, routes, actions and proxy branches, `safeNext`, env validation, the fixture scripts, the Stylelint plugin, components and pages, url-state and cursor math, sanitizer XSS, schemas over all committed samples, mappers (snapshots), comment tree and `resolveMore`, `runAction` error mapping, and each action's validation.
4. **Mock Reddit** (`e2e/mock-reddit/server.ts`), a small Node HTTP server:
   - It serves `/api/v1/authorize` (auto-approves and redirects back with a code), `/api/v1/access_token`, and every GET in §6.1 from listings assembled out of the committed samples in `fixtures/reddit/things` (raw captures are local-only).
   - It records writes in memory so later GETs reflect them (votes, subscriptions, multis, comments).
   - Latency and failures can be injected via a `x-mock-delay` / `x-mock-fail` control endpoint.
   - The app points at it with `REDDIT_WWW_BASE` and `REDDIT_API_BASE`.
5. **Playwright** (`playwright.config.ts`):
   - It starts the mock server and `next build && next start` over HTTPS (`ignoreHTTPSErrors: true`).
   - Projects: `chromium`, `webkit`, and `chromium-nojs` (`javaScriptEnabled: false`) running the same specs, with optimistic assertions skipped under no-JS.
   - `instant.spec.ts` uses `instant()` from `@next/playwright` for every route: a direct `page.goto()` and a client navigation via a `<Link>` click both assert that skeletons and chrome are visible with Reddit data held back.
   - `network-guard.spec.ts` asserts that every browser-initiated request is a document or RSC navigation, a Server Action POST, a static asset, a Reddit media host, or (in the video test) an HLS segment. There must be no other `fetch`.
   - `optimistic.spec.ts` injects 1.5 seconds of latency and asserts that the vote, save, subscribe, and multi membership UI updates in under 100ms. An injected 500 rolls back.
6. **CI (GitHub Actions):**
   - On PR: `npm ci`, `npm run check`, `npm run build`, `npm run test:e2e`.
   - **Weekly canary bump:** a scheduled job opens a PR that runs `npm i -E next@canary eslint-config-next@canary @next/playwright@canary` (plus the latest stable `react`/`react-dom`) and the full suite. Merge it when green.
   - **After switching to stable (pre-production):** replace the bump with a nightly, non-blocking `next@canary` job.
7. **Manual smoke checklist** (per release, with a real Reddit account and Chrome plus Safari):
   - Sign in, sign out, and expired session.
   - Home sorts and pagination.
   - Vote on a post and on a comment.
   - Comment, reply, edit, and delete.
   - Load more and continue thread.
   - Save and unsave.
   - Subscribe and follow.
   - Search.
   - The multi CRUD cycle.
   - Video with sound, a GIF that animates, a mixed gallery, one embed per provider (YouTube, Redgifs, Giphy, …), inline comment GIFs, and an NSFW reveal.
   - Back-button restoration.
   - Reduced motion.
   - Mobile drawer.

---

## Definition of done (whole project)

- [ ] Every functional requirement F1–F24 is demonstrated in e2e, and N1–N8 are verified (typecheck strict and clean, no `any`, no-JS suite green, network guard green, instant suite green, axe checks clean).
- [ ] There are no Route Handlers besides `/api/auth/*` and the development-only `/api/dev/capture`.
- [ ] The island inventory matches design §4.1 exactly.
- [ ] `npm run types:generate` produces no diff on a clean checkout, and the schema tests pass over all fixtures.
- [ ] `.env.example` is committed. `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` is renamed, and the README documents setup (Reddit app, HTTPS dev, fixture capture).

## Suggested PR sequence

| PR | Contents |
|---|---|
| 1 | Phase 0 and 1: config, env, auth, proxy, landing, sign out, and unit tests |
| 2 | Phase 2: client, capture route, fixtures, generation, curated schemas, mappers, sanitizer, and tests |
| 3 | Phase 3a: CSS tokens and motion, shell, sidebar, skeletons, and home feed |
| 4 | Phase 3b: `useEnhancedForm` spike results, votes and save, subreddit and multi feeds |
| 5 | Phase 4: post page, comment tree, `?more=`, composer, and edit/delete |
| 6 | Phase 5: saved, subscriptions, follow, search, and profile |
| 7 | Phase 6: multireddit management |
| 8 | Phase 7: the media spikes, then the resolver chain, providers, playback islands, inline media, NSFW prefs, and the media corpus |
| 9 | Phase 8: CSP (registry-generated), e2e suites, and CI with the weekly canary bump |
