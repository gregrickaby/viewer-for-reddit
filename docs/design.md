# Reddit Viewer: Design

| | |
|---|---|
| **Status** | Draft for review |
| **Date** | 2026-09-29 |
| **Stack** | `next@canary` during development (16.4.0-canary.52 at start). It has App Router, Cache Components, Partial Prefetching, React Compiler, and typed routes, and runs Next's vendored React 19.3 canary. Also TypeScript (strict), **CSS Modules with design tokens and cascade layers (no Tailwind, no component library)**, and Zod 4. See §10.4 and §15. |
| **Companion doc** | [implementation.md](./implementation.md) |

## 1. Summary

Reddit Viewer is a **server-first** web client for Reddit. It works only for signed-in users. A signed-out visitor sees a landing page with one action, **Sign in with Reddit**. Once signed in, the user lands on their home feed. From there they can browse subreddits, multireddits, saved items, and user profiles. They can vote on posts and comments, read and write comments, follow users, subscribe to subreddits, and create and edit their multireddits.

Everything is rendered on the server. The browser never fetches data. It navigates (`<Link>` or GET `<form>`) or submits mutations (Server Actions through `<form action>`). The server holds the Reddit OAuth tokens in encrypted, httpOnly cookies and makes every Reddit call. Client JavaScript is limited to a few small leaf "islands" that add optimistic feedback or need browser-only APIs. Every core flow also works before hydration, or with JavaScript disabled.

Every Reddit response is **validated at runtime against Zod schemas generated from real Reddit JSON**. Static types come from `z.infer`. Validated data is mapped to view models, then rendered by Server Components.

## 2. Goals and non-goals

### Goals

1. Sign in with Reddit's official OAuth2 authorization-code flow (`duration=permanent`). Only the landing page and the auth endpoints are reachable without a session.
2. Home feed, saved items, multireddits, and subscribed subreddits, all loaded from the signed-in user's account.
3. Vote on posts and comments (up, down, clear).
4. Read full comment threads, including "load more comments" and "continue this thread".
5. Write top-level comments and replies. Edit and delete your own comments.
6. Subscribe to and unsubscribe from subreddits. Follow and unfollow users.
7. Multireddit management: create, rename, edit description and visibility, add and remove subreddits, delete.
8. End-to-end type safety: types generated from captured Reddit JSON, validated at the network boundary, with no `any` in app code.
9. **Server-first.** No client-side data fetching, and the smallest possible client JS (§4.1).
10. **Feels instant.** Navigations render a prefetched App Shell with skeletons immediately. Mutations are optimistic through transitions. Content changes animate with React `<ViewTransition>` (§8.4 to §8.6).

### Non-goals (v1)

- Creating new posts. The `submit` scope is already requested, so adding posts later needs no re-consent.
- Private messages, chat, notifications, and mod tools.
- Anonymous browsing.
- Awards, poll voting, and live threads.
- Infinite scroll and as-you-type autocomplete. Both need client-side fetching. Explicit pagination and search forms replace them.
- Native apps and offline mode.

## 3. Requirements

### Functional

| ID | Requirement | Priority |
|---|---|---|
| F1 | The landing page (`/`) explains the app and offers "Sign in with Reddit". Signed-in visitors are redirected to `/home`. | P0 |
| F2 | Any protected URL visited while signed out redirects to `/?next=<path>`. After sign-in the user returns to `<path>`. | P0 |
| F3 | Home feed with sorts best, hot, new, top (with time range), and rising, plus Next and Previous pagination. | P0 |
| F4 | Subreddit feed with the same sorts, a subreddit header, and a Subscribe/Unsubscribe button. | P0 |
| F5 | Post detail page: the post, its comment tree, a comment sort control, load more replies, and continue thread. | P0 |
| F6 | Vote on posts and comments, with optimistic feedback and rollback on failure. | P0 |
| F7 | Comment on posts and reply to comments. The new comment appears in the thread after a server re-render. | P0 |
| F8 | Saved items (posts and comments), with a type filter and unsave. | P0 |
| F9 | Sidebar listing subscribed communities, followed people, and multireddits. | P0 |
| F10 | Multireddit feed page. | P0 |
| F11 | Multireddit management: create, edit (name, description, visibility), add and remove subreddits, delete. | P0 |
| F12 | User profile page (overview, posts, comments) with a Follow/Unfollow button. | P0 |
| F13 | Subreddit discovery: search subreddits by name and subscribe from the results. | P0 |
| F14 | Manage subscriptions: a full list with unsubscribe and a server-side name filter. | P1 |
| F15 | Edit and delete your own comments. | P1 |
| F16 | Save and unsave from any post or comment. | P1 |
| F17 | Sign out, which revokes the refresh token at Reddit and clears cookies. | P0 |
| F18 | **NSFW is content like any other.** The app does no filtering, gating, interstitials, age prompts, or environment configuration. Whatever Reddit returns is rendered. The only NSFW-specific behavior is the user's own "Blur NSFW media" display toggle (F23). Spoiler media is always behind a reveal. | P0 |
| F19 | Rich media in posts: images, **animated GIFs that animate**, Reddit-hosted video **with audio** (HLS), and mixed galleries of images, GIFs, and video. | P0 |
| F20 | Third-party embeds: YouTube, Vimeo, Streamable, Twitch clips, **Redgifs (including NSFW)**, Giphy, Imgur (GIFV and albums), TikTok, Spotify, and SoundCloud. Any other provider Reddit supplies an oEmbed for falls back to Reddit's sandboxed embed wrapper or a link card. | P0 |
| F21 | Inline media inside self text and comments (uploaded images, GIFs, Giphy-picker GIFs) renders inline. | P0 |
| F23 | **Settings, toggleable and retained between browser sessions:** a theme choice (System, Light, or Dark) and "Blur NSFW media" (on or off). They are reachable from the user menu and `/settings`, apply instantly, and cause no theme flash on load (§8.8). | P0 |
| F24 | **Self-text and rich HTML.** Self posts (for example r/AskReddit) and comments render Reddit's full markdown-generated HTML: headings, lists, tables, code blocks, quotes, spoilers, superscript, strikethrough, links, and inline media. Link posts that also carry body text show both (§8.9). | P0 |
| F25 | **Image galleries.** Reddit gallery posts (up to 20 items, mixing images, GIFs, and video) render as a swipeable carousel with per-item captions and outbound links, an "i / n" position, and a full-screen lightbox with keyboard navigation (§8.10). Single-item galleries render as a plain image. | P0 |
| F22 | Media detection is robust. A post never renders broken or empty media. Every post resolves to the richest renderable form, down to a link card. | P0 |

### Non-functional

| ID | Requirement |
|---|---|
| N1 | **Type safety.** Strict TS with no `any` and no unchecked casts of Reddit data. Every Reddit response passes a Zod schema before use. |
| N2 | **Security.** Tokens exist only in encrypted httpOnly cookies. Every Server Action re-checks the session. OAuth `state` is verified. All user-generated HTML is sanitized on the server. |
| N3 | **Rate-limit aware.** Reddit allows about 100 requests per minute per OAuth client. We read the `X-Ratelimit-*` headers, avoid redundant calls, and degrade gracefully on 429. |
| N4 | **Resilience.** One malformed item in a listing is dropped and logged. It does not fail the page. |
| N5 | **Server-first performance.** The static shell prerenders, and data sections stream behind `<Suspense>`. Everything that renders Reddit data is a Server Component. Client JS stays within the island budget (§4.1). |
| N6 | **Progressive enhancement.** Reading, paginating, sorting, voting, commenting, subscribing, and multi management all work with JavaScript disabled. JS only adds optimistic feedback. |
| N7 | **Accessibility.** WCAG 2.2 AA. Everything works by keyboard, and toggle buttons expose state (`aria-pressed`). |
| N8 | **Responsive.** 360px phones through wide desktops. Light and dark mode follow the system setting. |

## 4. Architecture

```
┌──────────────────────────── Browser ─────────────────────────────┐
│  Server-rendered HTML/RSC  +  tiny client islands (§4.1)         │
│  Only two ways to talk to the server:                            │
│   ① navigate: <Link> / GET <form>   (all reads; state in the URL)│
│   ② submit:   <form action={serverAction}>   (all mutations)     │
└──────────┬───────────────────────────────────┬───────────────────┘
           │ ①                                 │ ②
┌──────────▼───────────────────────────────────▼───────────────────┐
│ proxy.ts  (Node runtime, every matched request)                   │
│   • optimistic auth gate   • proactive access-token refresh       │
├───────────────────────────────────────────────────────────────────┤
│ App Router: Server Components render every Reddit-derived UI      │
│   app/(public)/page.tsx      landing                              │
│   app/(app)/**               authenticated pages                  │
│   app/actions/*.ts           Server Actions (mutations only)      │
│   app/api/auth/**            the ONLY Route Handlers: OAuth       │
├───────────────────────────────────────────────────────────────────┤
│ lib/auth    session cookies, OAuth helpers        (server-only)   │
│ lib/reddit  client → endpoints → schemas → mappers (server-only)  │
└──────────┬────────────────────────────────────────────────────────┘
           │ HTTPS · Bearer token · custom User-Agent
┌──────────▼────────────┐   ┌──────────────────────────────┐
│ oauth.reddit.com      │   │ www.reddit.com/api/v1/*      │
│ (all data + actions)  │   │ (authorize, token, revoke)   │
└───────────────────────┘   └──────────────────────────────┘
```

### 4.1 Server-first rules

These rules are binding. Code review rejects violations.

1. **Server Components by default.** Every component that renders Reddit data is a Server Component: post cards, comment trees, sidebars, headers, and HTML bodies.
2. **No client-side data fetching.** The browser never calls `fetch`, SWR, or React Query, and there are no JSON API routes for app data. The only Route Handlers are the OAuth endpoints.
3. **State lives in the URL.** Sort, time range, pagination cursor, saved filter, profile tab, search query, subscription filter, and expanded comment branches are all URL state. Changing any of them is a `<Link>` or a GET `<form>`, followed by a server render.
4. **Mutations are Server Actions bound to `<form action>`.** They work before hydration and without JS (Next.js progressive enhancement). JS only layers optimistic UI on top.
5. **Client Components are leaf islands.** They take small, serializable, primitive props, and are allowed only for:
   - optimistic or pending feedback on a form, or
   - browser-only APIs.

   They never receive raw Reddit objects or HTML.
6. **Prefer native HTML to JS.**
   - `<details>`/`<summary>` for comment collapse, reply and edit composers, and "read more".
   - The Popover API (`popover` and `popovertarget`) for menus, the mobile nav drawer, and confirm prompts.
   - CSS scroll-snap for galleries.
   - `<details>` for NSFW and spoiler reveal. Closed content isn't rendered, so the real media never downloads before reveal (§8.7).

**Client island budget.** This is the complete list. Adding to it requires a design-doc change.

| Island | Why it must be a Client Component | Server fallback without JS |
|---|---|---|
| `VoteButtons` | `useOptimistic` score and arrow state | Form POST re-renders the page with the new vote |
| `SaveButton` | `useOptimistic` toggle | Same |
| `SubscribeButton` (subreddits and users) | `useOptimistic` toggle and pending state | Same |
| `CommentComposer` | `useOptimistic` pending comment, form reset, ⌘/Ctrl+Enter | Plain form POST |
| `PendingButton` | `useFormStatus` spinner and disabled state for any submit button | Plain submit button |
| `MembershipToggle` | `useOptimistic` checkmark and row state for adding or removing a subreddit in a multi | Same |
| `SectionError` | The `catchError` fallback must be a Client Component, to offer `retry()` | Route-level `error.tsx` |
| `LinkPendingHint` | `useLinkStatus` inside a `<Link>`. Sets `data-pending` so ancestors can dim stale content via CSS `:has()`. | Normal navigation |
| `RedditVideo` | HLS playback with audio: native where supported, otherwise a lazily imported `hls.js`. Pauses when its route is hidden by `<Activity>`. | `<video>` with the MP4 fallback (no audio) and an "Open on Reddit" note |
| `AutoplayVideo` | Plays GIF-style muted loops only while ≥50% visible (IntersectionObserver). Honors `prefers-reduced-motion` and pauses when hidden by Activity. | Native `autoplay muted loop` |
| `EmbedFacade` | Shows a poster plus a ▶ button. The third-party `<iframe>` is injected only on click. | An `<a>` link to the original URL |
| `ThemeToggle` | Applies `data-theme` instantly inside `document.startViewTransition()` for a crossfade, and writes the `rv_theme` cookie | A `<form action={setTheme}>` POST. The server sets the cookie, and the next full load applies it. |
| `SettingSwitch` | `useOptimistic` switch for "Blur NSFW media" (the `setBlurNsfw` Server Action, then `refresh()`) | Form POST |
| `GalleryLightbox` | Opens the server-rendered `<dialog>` at the tapped slide, adds ←/→ keys and a live counter, and morphs the slide into the lightbox with `document.startViewTransition` | Each slide is an `<a>` to the full-size image, which opens in a new tab |

`<ViewTransition>`, `<Suspense>`, and `<Link transitionTypes>` are used directly in Server Components, so they are not islands. No island fetches app data; they call Server Actions only. Media elements (`<img>`, `<video>`, `hls.js` segments, and embed iframes) load media, not app data, and are governed by §8.7 and the CSP.

### 4.2 Key decisions

| Decision | Choice | Why |
|---|---|---|
| Where Reddit is called | Server only | Tokens and the client secret stay off the client. It gives one place for validation, rate limits, and sanitization, and avoids CORS limits on `oauth.reddit.com`. |
| Reads | Server Components on navigation, with URL-encoded state | This is server-first. It keeps pages bookmarkable and shareable and keeps the back button correct. |
| Mutations | Server Actions via `<form action>` | Built-in Origin (CSRF) checks, progressive enhancement, and `useOptimistic` integration. |
| Pagination | `?after=` and `?before=` cursors with Next and Previous `<Link>`s | Infinite scroll needs client-side fetching (rule 2). Explicit pages also match Reddit's own cursor model. |
| Loading more comments | `?more=<id>,<id>` in the URL, resolved on the server with `/api/morechildren`, and a `<Link scroll={false}>` | The expanded tree is rendered on the server without losing scroll position (§8.3). |
| Session storage | Two sealed cookies via `iron-session` (`sealData`/`unsealData`), with no database | Stateless and simple to deploy. The access and refresh tokens are in separate cookies because Reddit's long JWT-style tokens would otherwise risk the ~4 KB cookie limit. |
| Token refresh | Proactive, in `proxy.ts` | Server Components cannot set cookies. The proxy runs before every page and action, so it refreshes early and passes the new token to both the request and the response. |
| Rendering model | `cacheComponents: true` + `partialPrefetching: true` | The static shell (header, nav chrome, skeletons) prerenders, and per-user data streams in. Each route's App Shell, including its skeletons, is prefetched **once per route** instead of once per link, so navigation paints instantly without extra Reddit calls. Layout segments persist across navigations, so the sidebar is not re-fetched on every click. |
| Back/forward state | Cache Components' built-in `<Activity>` route preservation | The last 3 routes stay mounted but hidden. Going from a post back to the feed restores scroll position, expanded `<details>`, and composer drafts with no refetch. |
| Styling | **CSS Modules** plus global design tokens (custom properties), `@layer` ordering, and native nesting. No Tailwind. | Most of our CSS is platform CSS that utilities express badly: view-transition pseudo-elements, `::scroll-button`, `:has()`, `[open]` and `:popover-open` states, `@starting-style`, and anchor positioning. Sanitized Reddit HTML can only be styled with element selectors anyway. Tokens provide the constraint system, and layers make import order irrelevant (§10.4). |
| Component library | **None.** A small in-house set of primitives built on native elements (§10.4). | Mantine and most libraries ship client components that need a React context provider, so post cards and comments would all hydrate, which breaks the island budget (§4.1). The native platform (`dialog`, `popover`, anchor positioning, `details`, CSS Carousel) covers our interactive needs, and the genuinely hard widgets (combobox, date picker, data grid) are out of scope. A custom look also avoids the "every Mantine site looks the same" problem. |
| Motion | React `<ViewTransition>` + `<Link transitionTypes>` + `addTransitionType` | Declarative, browser-native (View Transitions API) animation for navigations, Suspense reveals, and optimistic list changes. Unsupported browsers simply don't animate. |
| Optimistic UI | `useOptimistic` + `useTransition` / form actions, `useActionState`, `useFormStatus` | React 19 primitives that are transition-aware and roll back automatically when the transition settles. |
| Server caching of Reddit data | None, except per-request dedupe and `use cache: private` for identity and prefs | The data is per-user and changes constantly (votes, scores). Caching it on the server would risk leaks between users and stale scores. |
| Types | quicktype → Zod (generated), plus a curated `pick`/`extend` layer and hand-written envelopes | The generated schemas reflect real payloads. The curated layer validates only the fields we render and fixes fields the samples got wrong (§7). |
| HTML | Reddit's `*_html` fields (`raw_json=1`), sanitized on the server with `sanitize-html` | Reddit's markdown dialect renders exactly, with no client markdown parser. The browser receives only safe HTML. |
| Media | A server-side resolver chain plus a provider registry (§8.7). Native `<img srcset>` from Reddit's previews. MP4 loops for GIFs. HLS for Reddit video. Click-to-load facades for third-party embeds. | Reddit already serves resized images and MP4 transcodes of GIFs. Detection is pure and fixture-tested on the server. Facades keep third-party JS, cookies, and NSFW iframes out of the page until the user asks. |

## 5. Authentication and sessions

### 5.1 OAuth app configuration

- Reddit app type: **web app** (confidential client). Credentials come from `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET`.
- Redirect URI: `REDDIT_REDIRECT_URI`, which is `https://localhost:3000/api/auth/callback/reddit` in development. It must match the Reddit app settings exactly.
- Every request to Reddit sends `USER_AGENT` (format `web-app:viewer-for-reddit:<version> (by <reddit-username>)`).

### 5.2 Scopes

Request all scopes at first login so later features never force a re-consent:

| Scope | Used for |
|---|---|
| `identity` | `/api/v1/me` (username, avatar, karma) |
| `read` | Feeds, post and comments, `morechildren`, subreddit and user about, `/api/multi/mine`, subreddit search |
| `history` | `/user/{me}/saved`, user overview, submitted, and comments |
| `mysubreddits` | `/subreddits/mine/subscriber` |
| `subscribe` | `/api/subscribe` (subreddits and users), all multireddit writes |
| `vote` | `/api/vote` |
| `submit` | `/api/comment` |
| `edit` | `/api/editusertext`, `/api/del` (own comments) |
| `save` | `/api/save`, `/api/unsave` |

### 5.3 Sign-in flow

```
User            Browser                    Next.js                          Reddit
 │ submit "Sign in"│                          │                               │
 │────────────────▶│ GET /api/auth/login?next=/r/x                            │
 │                 │─────────────────────────▶│ state = random 32B            │
 │                 │                          │ Set-Cookie rv_oauth (sealed   │
 │                 │                          │   {state, next}, 10 min)      │
 │                 │◀──── 302 reddit.com/api/v1/authorize?client_id&state&    │
 │                 │        redirect_uri&duration=permanent&scope=…           │
 │                 │─────────────────────────────────────────────────────────▶│
 │   approve       │◀──── 302 /api/auth/callback/reddit?code&state ───────────│
 │                 │─────────────────────────▶│ verify state == rv_oauth.state│
 │                 │                          │ POST /api/v1/access_token     │
 │                 │                          │   (Basic auth, code) ────────▶│
 │                 │                          │◀─── {access, refresh, exp} ───│
 │                 │                          │ GET /api/v1/me ──────────────▶│
 │                 │                          │ Set-Cookie rv_at, rv_rt       │
 │                 │                          │ Delete rv_oauth               │
 │                 │◀──── 302 next (validated relative path) or /home         │
```

The landing page's button is a plain GET form (`<form action="/api/auth/login">` with a hidden `next` input), so it works without JS.

Error branches:

- `error=access_denied`: the user declined. Redirect to `/?error=denied`.
- State mismatch or missing: `/?error=state`.
- Token exchange failure: `/?error=exchange`.

The landing page maps each `error` code to friendly copy.

The `next` value is accepted only if it is a same-origin relative path. It must start with `/`, must not start with `//`, and must not contain `\`. This prevents an open redirect.

### 5.4 Cookies

| Cookie | Contents (sealed) | Lifetime | Flags |
|---|---|---|---|
| `rv_at` | `{ accessToken, expiresAt }` | `expires_in - 60s` | httpOnly, Secure, SameSite=Lax, Path=/ |
| `rv_rt` | `{ refreshToken, username, scope, v: 1 }` | 30 days, extended on each refresh | httpOnly, Secure, SameSite=Lax, Path=/ |
| `rv_oauth` | `{ state, next }` | 10 minutes | httpOnly, Secure, SameSite=Lax, Path=/api/auth |

All cookies are sealed with `SESSION_SECRET` (32+ chars). The `v` field allows future format migrations.

**What counts as "signed in":** a valid `rv_rt` exists. `rv_at` may be missing because it expired; that is handled by refresh.

### 5.5 Token refresh (proxy)

On every matched request, `proxy.ts` does the following:

1. Unseals `rv_rt` and `rv_at`.
2. If `rv_rt` exists and `rv_at` is missing or expires within 5 minutes, it calls `POST /api/v1/access_token` with `grant_type=refresh_token`.
   - **Success:** it seals the new `rv_at` and sets it on the incoming request's cookies, so `cookies()` in Server Components and Server Actions sees the fresh token on the same request. It also sets it on the response. It re-issues `rv_rt` to extend the 30-day window.
   - **`invalid_grant`** (revoked or expired): it clears both cookies and redirects to `/?error=session_expired`.
   - **Network or 5xx error:** if the current access token is still valid, it continues. Otherwise it passes the request through, and the page's error boundary shows a retry state.
3. **Auth gating** (optimistic, as the Next docs recommend for proxy):
   - Public paths are `/` and `/api/auth/*`.
   - A signed-out **GET** of a protected path redirects to `/?next=…`.
   - Non-GET requests (Server Action POSTs) pass through. The action's own `requireAuth()` handles them.
   - A signed-in visit to `/` redirects to `/home`.

The proxy is not the security boundary. The Data Access Layer (`requireAuth()`) re-reads and validates the session in every data call and every Server Action.

**Concurrency:** parallel requests arriving right at expiry may each refresh. Reddit allows reusing a refresh token, so this is harmless, and the 5-minute skew makes it rare.

**Late 401s:** Reddit can still return 401 for a token revoked after it was issued. The DAL throws `RedditAuthError`. Pages and actions respond with `redirect('/api/auth/signout?reason=expired&next=…')`, which clears cookies (Server Components cannot) and redirects to the landing page.

### 5.6 Sign out

A `signOut()` Server Action, bound to a form in the user menu, does three things:

1. Calls `POST /api/v1/revoke_token` with the refresh token (`token_type_hint=refresh_token`), which also invalidates its access tokens.
2. Deletes `rv_at` and `rv_rt`.
3. Calls `redirect('/')`.

Revocation is best-effort. A failure is logged, and the cookies are cleared regardless.

## 6. Data Access Layer (`lib/reddit`)

All Reddit I/O goes through four layers:

```
endpoints (typed functions, one per Reddit call)
   └─ client  (fetch wrapper: base URL, auth, UA, raw_json=1, errors, rate-limit)
   └─ schemas (generated Zod + curated layer)
   └─ mappers (validated Reddit data → view models; HTML sanitization; URL rewriting)
```

- **Server-only.** Every module imports `server-only`.
- **Auth derived, never passed in.** Endpoint functions call `requireAuth()` themselves, so callers cannot run them with another user's token. This follows the Next "Data Access Layer" pattern.
- **Base URLs.** `https://oauth.reddit.com` for API calls and `https://www.reddit.com` for OAuth. Both can be overridden by env in tests so they point at a mock Reddit server.
- **Always `raw_json=1`.** This stops Reddit from HTML-escaping `&`, `<`, and `>` in JSON strings.
- **Typed errors.**
  - `RedditAuthError` for 401.
  - `RedditForbiddenError` for 403: private, quarantined, or banned subreddits, and suspended users.
  - `RedditNotFoundError` for 404.
  - `RedditRateLimitError` for 429, carrying `resetSeconds`.
  - `RedditApiError` for anything else.
  - `RedditSchemaError` when an envelope fails validation.

  Reddit's `{ json: { errors: [[code, message, field]] } }` form responses become `RedditApiError` with `code` set (for example `RATELIMIT`, `TOO_LONG`, `THREAD_LOCKED`).
- **Rate limits.** The client records `X-Ratelimit-Remaining` and `X-Ratelimit-Reset`. When remaining falls below 5, calls fail fast with `RedditRateLimitError`, and the UI shows "Reddit is rate-limiting us, try again in N seconds."
- **Per-request dedupe.** Identity reads are wrapped in React `cache()`, and `use cache: private` is used for `getMe()` and prefs.
- **Listing validation per item.** Envelopes (`Listing`) are parsed strictly. Each child is parsed on its own; failures are dropped and logged with the endpoint, `kind`, `id`, and the Zod issue path (N4).

### 6.1 Endpoint catalogue

| Feature | Method and path (oauth.reddit.com) | Scope | Used by |
|---|---|---|---|
| Me | `GET /api/v1/me` | identity | DAL `getMe()` |
| Home feed | `GET /{best\|hot\|new\|top\|rising}?t&after&before&count&limit=25` | read | `/home` |
| Subreddit feed | `GET /r/{sr}/{sort}?…` | read | `/r/[subreddit]` |
| Multi feed | `GET /user/{user}/m/{name}/{sort}?…` | read | `/m/[multi]`, `/user/[u]/m/[multi]` |
| Subreddit about | `GET /r/{sr}/about` | read | subreddit header, `addToMulti` validation |
| Post and comments | `GET /comments/{id}?sort&limit=200&depth=8` (`&comment={cid}&context=3` for single-thread view) | read | post page |
| More comments | `GET /api/morechildren?api_type=json&link_id&children(≤100)&sort&limit_children=false` | read | post page when `?more=` is set |
| Vote | `POST /api/vote` `id, dir∈{-1,0,1}` | vote | action `vote` |
| Comment | `POST /api/comment` `api_type=json, thing_id, text` | submit | action `postComment` |
| Edit comment | `POST /api/editusertext` `api_type=json, thing_id, text` | edit | action `editComment` |
| Delete comment | `POST /api/del` `id` | edit | action `deleteComment` |
| Save / unsave | `POST /api/save`, `POST /api/unsave` `id` | save | action `setSaved` |
| Saved | `GET /user/{me}/saved?type=links\|comments&after&before&count` | history | `/saved` |
| Subscriptions | `GET /subreddits/mine/subscriber?limit=100&after` (paged, capped at 10 pages) | mysubreddits | sidebar, `/subreddits` |
| Subscribe | `POST /api/subscribe` `action=sub\|unsub, sr_name, skip_initial_defaults=true` | subscribe | action `setSubscription` |
| Follow user | the same `POST /api/subscribe` with `sr_name=u_{username}` | subscribe | action `setSubscription` |
| User about | `GET /user/{u}/about` (`data.subreddit.user_is_subscriber` = following) | read | profile header |
| User listings | `GET /user/{u}/{overview\|submitted\|comments}?sort&after&before&count` | history | `/user/[u]` |
| Subreddit search | `GET /subreddits/search?q&limit=25&after` | read | `/search` |
| My multis | `GET /api/multi/mine` | read | sidebar, `/multis`, "Add to multi" menus |
| Multi detail | `GET /api/multi/user/{me}/m/{name}?expand_srs=true` | read | `/multis/[multi]` |
| Create multi | `POST /api/multi/user/{me}/m/{name}` `model=<json>` | subscribe | action `createMulti` |
| Update multi | `PUT /api/multi/user/{me}/m/{name}` `model=<json>` | subscribe | action `updateMulti` |
| Delete multi | `DELETE /api/multi/user/{me}/m/{name}` | subscribe | action `deleteMulti` |
| Add sub to multi | `PUT /api/multi/user/{me}/m/{name}/r/{sr}` `model={"name":sr}` | subscribe | action `addToMulti` |
| Remove sub from multi | `DELETE /api/multi/user/{me}/m/{name}/r/{sr}` | subscribe | action `removeFromMulti` |

Followed users show up in `/subreddits/mine/subscriber` as `t5` things with `subreddit_type: "user"` and `display_name: "u_<name>"`. The sidebar splits these into **Communities** and **People**.

## 7. Type system

Types have three layers, and only the first is generated:

```
fixtures/reddit/raw/*.json          ← captured real responses (scrubbed)
        │  scripts/reddit/extract-things.ts
        ▼
fixtures/reddit/things/{Link,Comment,More,Subreddit,Account,LabeledMulti}/*.json
        │  quicktype --lang typescript-zod --src fixtures/reddit/things
        ▼
lib/reddit/schemas/generated.ts     ← GENERATED. Never hand-edited. One merged schema per kind.
        │
        ▼
lib/reddit/schemas/*.ts             ← HAND-WRITTEN, curated:
   • Link = LinkSchema.pick({...fields we use}).extend({...overrides})
   • Thing<K,T>, Listing<T> generic envelopes, discriminated on `kind`
   • recursive Comment.replies via z.lazy
   • response envelopes: CommentsResponse = [Listing<Link>, Listing<Comment|More>],
     MoreChildrenResponse, CommentPostResponse, etc.
        │  z.infer
        ▼
lib/reddit/types.ts                 ← exported TS types (RedditLink, RedditComment, …)
        │  mappers
        ▼
lib/view-models.ts                  ← plain types rendered by Server Components
                                      (PostView, CommentView, SubredditView, MultiView, …)
```

### Lessons from `viewer-for-reddit`'s type generator

That project fetched samples with an interactive CLI OAuth login, inferred JSON Schema with custom code, emitted an OpenAPI document, and ran `openapi-typescript`. We keep the idea (types derived from real responses) but fix its limits:

| Old approach | Limitation | This design |
|---|---|---|
| Custom inference that merged samples by spreading `properties` | The last sample wins, so fields are never optional or nullable, and unions are lost | quicktype merges every sample per kind: `.optional()` for absent fields, `z.union` for mixed types |
| One schema per endpoint response | The same `Link` shape is duplicated per endpoint and drifts | One schema per Reddit **kind** (`t1`, `t3`, `t5`, …), shared by every endpoint, with generic `Listing`/`Thing` envelopes |
| Types only (`openapi-typescript`) | No runtime check. Bad data surfaces as UI bugs. | Zod schemas validate at the boundary, and per-item parsing drops only the bad item |
| 6 endpoints, 3 scopes | Mutations, multis, saved items, and media shapes were untyped | Every endpoint in §6.1 is covered, including media-diverse and NSFW samples |
| Types used directly by components | Raw Reddit shapes leak into the UI | A curated `pick`/`extend` layer, then view models |

As a bonus, Zod 4's `z.toJSONSchema()` exports the curated schemas to `docs/reddit-schemas.json` for reference, which gives the same documentation value the OpenAPI file had.

### Why this shape

- **quicktype merges samples.** This was verified with quicktype 26. Given one directory per kind with many samples, it produces a single schema that marks fields as optional when some samples omit them, and emits unions such as `edited: boolean | number`. Diverse samples are therefore required: text, link, image, gallery, video, crosspost, NSFW, spoiler, removed, deleted, and stickied posts, plus deep threads with `more` nodes.
- **Samples cannot prove absence.** A field never `null` in our samples might be `null` in production. The curated layer (`pick` + `extend`) validates **only fields we render**, and `extend` loosens the few that are known to vary (`media`, `preview`, `thumbnail_*`, `*_flair_*`, `gallery_data`, `media_metadata`). Zod strips unknown fields.
- **Recursion and envelopes are hand-written.** `Listing`, `Thing<K>`, and comment `replies` (`"" | Listing<Comment | More>`) are recursive or generic, and quicktype handles those poorly. The extractor replaces `replies` with `""` in samples so the generated `Comment` stays flat.
- **Drift detection.** A test validates every committed fixture against the curated schemas. Re-capturing and regenerating shows drift as a readable diff of `generated.ts`.
- **Small responses are hand-written on purpose.** Vote, subscribe, save, and multi-sub-add return `{}`. Form-style responses (`/api/comment`) wrap a `t1` whose inner schema is the generated `Comment`. So every response type is still anchored to generated schemas.

### View models

Server Components render view models, never raw Reddit objects. Islands receive only primitives taken from them (ids, counts, booleans).

```ts
type PostView = {
  id: string                 // "abc123"
  fullname: `t3_${string}`
  subreddit: string          // "nextjs"
  author: string | null      // null when [deleted]
  title: string
  permalink: string          // app-internal path: /r/nextjs/comments/abc123/slug
  createdUtc: number
  score: number
  hideScore: boolean
  likes: Vote                // -1 | 0 | 1
  numComments: number
  saved: boolean
  flags: { nsfw: boolean; spoiler: boolean; stickied: boolean; locked: boolean; archived: boolean }
  flair: FlairView | null
  body: SafeHtml | null      // self text, with inline media already resolved (§8.7)
  media: PostMedia           // see §8.7
  crosspostFrom: { subreddit: string; author: string | null; permalink: string } | null
}
```

`SafeHtml` is a branded string type (`string & { readonly __brand: 'SafeHtml' }`). Only the sanitizer can produce one. `dangerouslySetInnerHTML` is used only inside the Server Component `<RedditHtml html={SafeHtml} />`, and an ESLint rule forbids it elsewhere.

## 8. Rendering, caching, and data flow

### 8.1 Rendering

- **`cacheComponents: true`.** Anything that reads `cookies()`, `searchParams`, or Reddit data sits inside `<Suspense>`. Layouts never `await` the session at their top level. Session-dependent pieces are pushed into child components inside boundaries.
- **App shell.** The `(app)/layout.tsx` header, nav frame, and skeletons prerender. The sidebar (subscriptions and multis) streams in behind its own boundary. It is fetched on the first load and after mutations that call `refresh()`. It persists across client navigations because it lives in the layout.
- **Caching.**
  - `getMe()` uses `'use cache: private'` with `cacheLife({ stale: 300 })`.
  - Feeds, comments, and saved items are not cached, because vote state and scores must be fresh.
  - No plain `use cache` or `use cache: remote` is used on anything derived from a token.
- **Prefetching.** With `partialPrefetching`, every `<Link>` uses the default (`auto`) prefetch of the destination route's App Shell. That covers the chrome and skeletons, is cached per session on the client, and makes no Reddit call. We **never** set `prefetch={true}` on Reddit-backed links. Per-link prefetch resolves `params` and `searchParams` data, which means a Reddit call per visible link, and the rate-limit budget can't afford it.

### 8.2 Mutations and re-render policy

| Action | Re-render | Rationale |
|---|---|---|
| `vote`, `setSaved` | **None**. After success, the island commits a confirmed local state inside the same transition (§8.6). | Re-rendering would re-fetch the whole listing on every click. That burns rate limit and can reorder "hot" feeds under the user's cursor. The next navigation shows Reddit's truth. |
| `postComment`, `editComment`, `deleteComment` | `refresh()` | The thread is re-rendered on the server and includes the new or edited comment. `useOptimistic` shows a pending comment until the render arrives, following the Next "interactive apps" guide, step 4. |
| `setSubscription` (subreddit or user), all multi actions | `refresh()` | The sidebar, headers, and "Add to multi" checkmarks all re-render on the server in the same round trip. |
| `signOut` | `redirect('/')` | |

Without JS, every form does a full POST, and Next responds with the re-rendered page. Behavior is the same, minus the optimistic feedback.

**Action contract.** Every action:

1. accepts `FormData` (so it works with `<form action>` and `.bind`),
2. validates it with Zod,
3. calls `requireAuth()`, and
4. returns `ActionResult` (`{ ok: true } | { ok: false; error: { code; message } }`) for `useActionState`.

It never throws raw errors to the client. AUTH failures `redirect()` from inside the action.

### 8.3 Pagination and comment expansion (URL state)

**Feeds.**

- The page reads `after`, `before`, and `count` from `searchParams`.
- "Next →" links to `?…&after=<listing.after>&count=<count+25>`. "← Previous" links to `?…&before=<first item fullname>&count=<count+1>`, which follows Reddit's cursor semantics.
- Changing the sort drops the cursor.
- Navigation scrolls to the top.

**Comments (`?more=`).**

1. The post page fetches `/comments/{id}`.
2. The `more` query param holds the ids of `more` nodes the user has expanded (comma-separated, capped at 20).
3. The server collects the `children` ids of every listed `more` node, up to 100 per call. It calls `/api/morechildren` once, assembles the flat result into subtrees by `parent_id`, and splices them in.
4. Newly revealed `more` nodes that are also in the param are resolved in another round, up to 3 rounds.

A `more` node renders as `<Link href="?more=…,<thisId>#<parentAnchor>" scroll={false}>Load N more replies</Link>`, and the server renders the expanded tree in place. Past the cap, or when `count === 0` (Reddit's "continue this thread"), the link goes to the single-thread permalink view `/r/…/comments/<post>/<slug>/<parentCommentId>` instead.

The cost is two Reddit calls per expansion. That is acceptable, and it avoids any client-side fetch and tree state.

### 8.4 Loading skeletons (instant navigation)

On a client navigation, only the tree **below the shared layout** re-renders. A `<Suspense>` boundary in a layout does not cover it (per the Next "Instant navigation" guide). So:

- **Every `page.tsx` owns its boundaries.** The page body is synchronous. Anything that awaits `params`, `searchParams`, `cookies()`, or Reddit sits in a `<Suspense>` inside the page, with a skeleton fallback. The skeletons are part of the route's App Shell, which Partial Prefetching preloads, so they paint on the same frame as the click.
- **Skeletons mirror the final layout exactly**, which avoids layout shift:

  | Skeleton | Used by |
  |---|---|
  | `FeedSkeleton` | Three `PostCardSkeleton`s with the vote column, meta line, a title with two text bars, and a 16:9 media block |
  | `SubredditHeaderSkeleton` | Banner, icon, name bar, and a Subscribe button placeholder |
  | `PostSkeleton` + `CommentTreeSkeleton` | Post detail. The comment tree skeleton shows 4 comments at depths 0/1/2/0. |
  | `SidebarSkeleton` | Sidebar |
  | `ProfileHeaderSkeleton` | Profile header |
  | `MultiEditorSkeleton` | Multi editor |
  | `ListRowSkeleton` | Subscriptions and search results |
- **Static text stays outside the boundaries.** Sort tabs, page titles derived from `params` via `generateMetadata`, and "Back" links render outside boundaries when they don't need request data. This maximizes what is in the shell.
- **Streaming order.** On a subreddit page, the header and the feed are **sibling** boundaries, so each reveals as soon as its own Reddit call resolves. On the post page, the post and comments come from a single Reddit call, so they share one boundary.
- **Validation.** Cache Components' dev-time instant-navigation validation stays at its default (`warning`) level, and every insight is fixed rather than silenced. `export const instant = false` is not allowed, except temporarily behind a TODO that links to an issue. Instant behavior is locked in CI with `@next/playwright`'s `instant()` helper (§13).
- **Pending state without skeletons.** Changing a sort, cursor, or filter on the **same** route keeps the old content visible (it is a transition) instead of flashing a skeleton. `LinkPendingHint` sets `data-pending` on the link, and the feed section dims itself with `.feed:has([data-pending]) .list { opacity: 0.6 }` (a CSS Module rule) until the new content commits. This is the "filter with pending feedback" pattern from the Next "interactive apps" guide, done with links instead of `router.push`.

### 8.5 Page transitions and motion

All motion uses React `<ViewTransition>`, which runs on the browser View Transitions API. Navigations are transitions, so they activate it automatically. Browsers without support skip the animation and render normally.

| Pattern | Where | How |
|---|---|---|
| **Directional slide** ("going deeper" / "coming back") | Feed → post, feed → subreddit or user, and "← Back to r/x" breadcrumbs | Forward links carry `transitionTypes={['nav-forward']}`; back and breadcrumb links carry `['nav-back']`. Each `page.tsx` wraps its content in `<ViewTransition enter={{'nav-forward':'nav-forward','nav-back':'nav-back',default:'none'}} exit={…same} default="none">`. The wrapper is placed in pages, not layouts, because layouts persist and never enter or exit. Browser back/forward carries no type, so there is no slide, and Activity restores the previous page instantly. |
| **Suspense reveal** ("data arrived") | Every data boundary | The fallback is wrapped in `<ViewTransition exit="slide-down" default="none">` and the content in `<ViewTransition enter="slide-up" default="none">`. Timing is asymmetric: the exit takes 150ms, and the enter takes 210ms after a 150ms delay. |
| **Same-route crossfade** ("same place, different content") | Sort tabs, pagination, saved type filter, profile tabs, subscriptions tabs | The content is wrapped in `<ViewTransition key={sort + cursor + filter} name="feed-content" share="auto" enter="auto" default="none">`. |
| **List enter/exit** (optimistic changes) | A new pending comment appears, a deleted comment collapses, a subreddit is removed from a multi, an unsubscribed row fades | Each item is wrapped in `<ViewTransition key={id} enter="fade-in" exit="fade-out" default="none">`. Actions tag their transition with `addTransitionType('list-change')` so these animations don't fire during navigations. |
| **Anchored chrome** | Sticky header and sidebar | `viewTransitionName: 'site-header'` / `'sidebar'`, with their group animations set to `none`, so only the content moves. |

**Shared-element morph** (for example, a feed thumbnail morphing into the post hero) is **deliberately not used in v1**. A morph only pairs when the destination renders in the same commit as the click. Our post pages are uncached, per-user Reddit data, so they suspend into a skeleton first. Making them commit-ready would need `prefetch={true}` per link, which costs one Reddit call per visible post (§8.1). Revisit this if Reddit rate limits allow it.

**Global motion rules** (in `app/styles/base.css`, `@layer base`):

- `::view-transition { pointer-events: none }`, so clicks during an animation reach the page.
- A `prefers-reduced-motion: reduce` block sets all `::view-transition-*` animation durations and delays to `0s`.
- Durations are tokens: `--duration-exit: 150ms`, `--duration-enter: 210ms`, and `--duration-move: 400ms`. The slide offset is 60px for navigation and 10px for reveals.

### 8.6 Optimistic updates and transitions

Every mutation runs inside a transition (a form `action` or `startTransition`). That gives four things:

1. `useOptimistic` values show at once and revert automatically when the transition settles.
2. `<ViewTransition>` animations fire.
3. `isPending` and `useFormStatus` are available for feedback.
4. Server Action responses that re-render (`refresh()`) commit together with the settled state, with no flicker.

| Island | Pattern |
|---|---|
| `VoteButtons` | `const [confirmed, setConfirmed] = useState({ likes, score })`, then `const [view, setOptimistic] = useOptimistic(confirmed, applyVote)`. On click: `startTransition(async () => { setOptimistic(dir); const r = await vote(formData); if (r.ok) startTransition(() => setConfirmed(next)) else setError(r.error) })`. The inner `startTransition` is required because state updates after an `await` are not automatically part of the transition. Because the confirmed state commits in the same transition, the optimistic value hands off to it without flicker. On failure, the optimistic value simply reverts, and the error shows in an `aria-live` region. Rapid clicks read `view`, not the prop, so toggling up → clear → down works. Server Actions are dispatched one at a time per client, so the votes reach Reddit in order. |
| `SaveButton` | The same pattern with a boolean. |
| `SubscribeButton` | `useOptimistic(subscribed)` inside a form action. The action calls `refresh()`, so the server re-render delivers the new `subscribed` prop, and the sidebar list change animates via list enter/exit. |
| `CommentComposer` | Follows the Next "interactive apps" step 4: `useOptimistic<PendingComment[]>([])`. The form `action` resets the form through its ref, pushes a pending comment (rendered faded, with `enter="fade-in"`), and awaits `postComment`. That action calls `refresh()`. When the new server tree commits, the pending list empties and the real comment appears in the same frame. `useActionState` keeps the last error, and on failure the draft text is restored from the returned state. |
| Multi editor rows, subscription rows, and "Add to multi" checkmarks | `useOptimistic` over the membership set. Removed rows animate out, and `refresh()` settles the result. |
| Every submit button | `PendingButton` uses `useFormStatus()` for `aria-busy` and `disabled`, with a spinner that appears after a 150ms delay so fast actions don't flash. |

**Activity-aware islands.** Cache Components keeps the last 3 routes mounted inside `<Activity mode="hidden">`, so effects are cleaned up when a route is hidden:

- `RedditVideo` pauses playback in a `useLayoutEffect` cleanup.
- Open popovers (menus and confirms) are closed in a cleanup, following the Next "Preserving UI state" guide's advice for transient UI.
- Comment drafts are **kept** on purpose, so a user who navigates away mid-reply finds the draft on return.

### 8.7 Media detection and playback

Every post must render the richest media Reddit gives us, including NSFW content:

- images
- GIFs that actually animate
- Reddit video with audio
- mixed galleries
- third-party embeds
- inline media in self text and comments

A post must never render a broken or empty media box. Detection runs **entirely on the server** as pure functions over validated Reddit data, and is tested against a corpus of real captured posts.

#### Module layout (`lib/media/`, server-only)

```
lib/media/
  detect.ts        resolveMedia(link, ctx): PostMedia   ← ordered resolver chain
  resolvers/       crosspost, gallery, reddit-video, provider, video-preview,
                   animated-variants, direct-file, image, oembed-fallback, link-card
  providers/       registry.ts + one module per provider (youtube.ts, redgifs.ts, …)
  images.ts        ImageSet builders (srcset from resolutions; blurred variants)
  inline.ts        media_metadata → inline <img>/<video> for self text and comments
  url.ts           safeUrl(): new URL(), https-only, exact/suffix host matching
```

#### Media view model

```ts
type PostMedia =
  | { type: 'none' }
  | { type: 'image'; image: ImageSet }
  | { type: 'animated'; loop: LoopVideo | null; gif: ImageSet | null; poster: ImageSet | null } // GIF-like: muted autoplay loop
  | { type: 'video'; video: StreamVideo; poster: ImageSet | null }                              // may have audio: HLS
  | { type: 'gallery'; items: GalleryItem[] }                                                  // item = image | animated | video
  | { type: 'embed'; embed: EmbedView; poster: ImageSet | null }
  | { type: 'link'; url: string; domain: string; thumbnail: ImageSet | null }

type ImageSet    = { src: string; srcSet: string; width: number; height: number; blurred: { src: string; srcSet: string } | null }
type LoopVideo   = { mp4: string; width: number; height: number }
type StreamVideo = { hls: string; mp4Fallback: string; width: number; height: number; durationSec: number | null }
type EmbedView   = { provider: ProviderId; title: string; iframeSrc: string; aspectRatio: number;
                     allow: string; sandbox: string; originalUrl: string }
type GalleryItem = { media: Extract<PostMedia, { type: 'image' | 'animated' | 'video' }>; caption: string | null; outboundUrl: string | null }
```

`ImageSet.blurred` comes from Reddit's pre-blurred `preview.images[0].variants.obfuscated` (or `variants.nsfw`) renditions. Crossposts are resolved into their parent's media and carry a "Crossposted from r/x" attribution; there is no nested `PostView`.

#### Resolver chain (first match wins)

| # | Resolver | Signal in Reddit JSON | Result |
|---|---|---|---|
| 1 | Crosspost | `crosspost_parent_list[0]` parses as a Link | Run the chain on the parent (depth 1) and set `crosspostFrom` |
| 2 | Removed | `removed_by_category` set, or the URL points at a removed-media placeholder | `none`, plus a "removed" notice |
| 3 | Gallery | `is_gallery` + `gallery_data.items[]` + `media_metadata[media_id]` with `status: 'valid'` | Per item `e`: `Image` → image (`s.u`, `p[]`). `AnimatedImage` → animated (`s.mp4` preferred, `s.gif` fallback). `RedditVideo` → video (`hlsUrl`). Invalid items are skipped, and an empty gallery falls through. |
| 4 | Reddit video | `secure_media.reddit_video ?? media.reddit_video` | If `is_gif`, animated (loop = `fallback_url`, silent). Otherwise video (`hls_url`, with `fallback_url` as the no-audio fallback). |
| 5 | Known provider | `url_overridden_by_dest ?? url` matches the provider registry | Provider-specific result (table below) |
| 6 | Reddit video preview | `preview.reddit_video_preview` (Reddit's own transcode of GIFs and external clips) | If `is_gif`, animated. Otherwise video. |
| 7 | Animated variants | `preview.images[0].variants.mp4` or `.gif` | animated (MP4 loop preferred) |
| 8 | Direct file | URL path extension on an allowlisted media host: `.gif`/`.gifv` → animated; `.mp4`/`.webm` → animated loop, with controls if longer than 60s; `.jpg`/`.jpeg`/`.png`/`.webp`/`.avif` → image | as noted |
| 9 | Image hint | `post_hint === 'image'`, or `preview.images[0]` on `i.redd.it` | image |
| 10 | oEmbed fallback | `media.oembed.html` or `secure_media.oembed.html` exists, but the post URL matched no provider | Extract **only** the iframe `src` attribute from the (entity-decoded) oEmbed HTML, and accept it only if its host belongs to a registry provider. Then treat it as that provider's embed. The HTML itself is never injected. Otherwise, a link card with the oEmbed thumbnail. |
| 11 | Self | `is_self` | `none` (the body renders, with inline media) |
| 12 | Link card | anything else | Preview image if present. Otherwise `thumbnail`, **only if it is an https URL**, because Reddit uses sentinels `self`, `default`, `nsfw`, `spoiler`, `image`, and `""`. |

`post_hint` (`image`, `hosted:video`, `rich:video`, `link`, `self`) is treated as a **hint, never as truth**. It is often missing or wrong on older and crossposted items.

#### Provider registry

Each provider is one module:

```ts
type Provider = {
  id: ProviderId
  hosts: readonly string[]                         // exact host or ".suffix" match via safeUrl()
  parse(url: URL): Record<string, string> | null   // extracts ids with STRICT regexes; null = not ours
  resolve(ids: Record<string, string>, link: RedditLink, ctx: MediaCtx): PostMedia
  csp: { frameSrc?: string[]; mediaSrc?: string[]; imgSrc?: string[] }
}
```

The CSP is **generated from the registry**, so adding a provider is one module, its tests, and zero manual CSP edits.

| Provider | Recognized URLs | Renders as |
|---|---|---|
| YouTube | `youtube.com/watch?v=`, `youtu.be/`, `/shorts/`, `/live/`, `/embed/`, and the `m.`/`music.` hosts. The id must match `^[\w-]{11}$`, and `t`/`start` become seconds. | Embed `https://www.youtube-nocookie.com/embed/{id}?autoplay=1&playsinline=1&start={s}`. Shorts use 9:16. The poster is the Reddit preview or `i.ytimg.com/vi/{id}/hqdefault.jpg`. |
| Vimeo | `vimeo.com/{id}`, `player.vimeo.com/video/{id}` | Embed `player.vimeo.com/video/{id}?autoplay=1` |
| Streamable | `streamable.com/{id}` | Embed `streamable.com/e/{id}?autoplay=1` |
| Twitch clips | `clips.twitch.tv/{slug}`, `twitch.tv/{user}/clip/{slug}` | Embed `clips.twitch.tv/embed?clip={slug}&parent={BASE_URL host}&autoplay=true`. Twitch requires `parent`. |
| **Redgifs** (NSFW) | `redgifs.com/watch/{id}`, `/ifr/{id}`, `v3.redgifs.com/watch/{id}`, or the last path segment without its extension. The id must match `^[a-zA-Z0-9]+$`. | **Preferred:** embed Redgifs' own player at `https://www.redgifs.com/ifr/{id}`, **because it carries audio**. Reddit's `reddit_video_preview` mirror is often silent (learned in `viewer-for-reddit`). **Fallback,** when no id can be parsed: the Reddit mirror, rendered as animated. This provider runs **before** resolver 6, so the silent mirror never wins. |
| Giphy | `giphy.com/gifs/{slug-}{id}`, `media*.giphy.com/media/{id}/giphy.{gif,mp4,webp}`, `i.giphy.com/{id}.gif` | animated: loop `https://media.giphy.com/media/{id}/giphy.mp4`, with `giphy.gif` as the fallback |
| Imgur | `i.imgur.com/{id}.{gifv,gif,mp4}` → animated (`https://i.imgur.com/{id}.mp4`). `i.imgur.com/{id}.{jpg,png,webp}` → image. `imgur.com/a/{id}`, `/gallery/{id}` → embed `imgur.com/a/{id}/embed?pub=true`. | as noted |
| TikTok | `tiktok.com/@{user}/video/{digits}` | Embed `www.tiktok.com/embed/v2/{id}`, 9:16 |
| Spotify | `open.spotify.com/{track,album,playlist,episode,show}/{id}` | Embed `open.spotify.com/embed/{type}/{id}` at a fixed height of 152 or 352 |
| SoundCloud | `soundcloud.com/{user}/{track}` | Embed `w.soundcloud.com/player/?url={encoded}` at a fixed height of 166 |
| X/Twitter, Instagram, Facebook, Threads | Recognized so they don't hit the oEmbed fallback | Link card. Their embeds require injecting third-party scripts, which is not allowed. |

#### Playback components

| Media | Component | Behavior |
|---|---|---|
| image | `MediaImage` (server) | `<img srcset sizes loading="lazy" decoding="async" width height>` with the aspect ratio reserved. Very tall images are capped at 80vh with a "Show full image" `<details>`. |
| animated with an MP4 (the common case) | `AutoplayVideo` island | `<video muted loop playsinline autoplay preload="metadata" poster>` with no controls, so it looks like a GIF. It plays only while visible, pauses offscreen and when hidden by Activity, and under `prefers-reduced-motion` shows a ▶ button instead of autoplaying. MP4 loops are 5–20× smaller than GIFs. `reddit_video_preview` mirrors are always rendered this way, because they are silent. |
| animated as a GIF only | `MediaImage` with `<picture>` | `<source media="(prefers-reduced-motion: reduce)" srcset={static preview}>` plus `<img src={gif}>`. Native GIF animation with zero JS. |
| video | `RedditVideo` island | HLS with audio, loaded **directly from `v.redd.it`** (proven in `viewer-for-reddit`; no proxy). Native HLS when `canPlayType('application/vnd.apple.mpegurl')` is true, otherwise `await import('hls.js')`. Uses `controls`, `preload="none"`, and a poster. On a fatal error, falls back to the silent MP4 with a "no audio" badge. |
| *all players* | shared `player-registry.ts` (client module) | These lessons come from `viewer-for-reddit`:<br>• **One shared IntersectionObserver** for attaching players (`rootMargin: 600px 0px`) and **one** for visibility (`threshold: 0.25`), rather than one per video.<br>• **Observe the wrapper `<div>`, not the `<video>`.** iOS WebKit stops firing IntersectionObserver callbacks for a playing, layer-promoted `<video>`.<br>• **Lazy attach.** Poster only until the video nears the viewport, and `hls.js` attaches only on play.<br>• **At most 6 attached players.** The oldest offscreen player is evicted back to its poster.<br>• **Starting an audible video pauses other audible videos.** GIF-style loops are exempt on both sides. |
| embed | `EmbedFacade` island | Poster, provider badge, and ▶. **No third-party request until click.** Then it injects `<iframe src={iframeSrc} allow={allow} sandbox={sandbox} referrerPolicy="strict-origin-when-cross-origin" title>` with autoplay. YouTube rejects embeds without a referrer, hence the policy. |
| gallery | `Gallery` (server) + `GalleryLightbox` island | See §8.10. Each slide uses the component for its media type. |

#### Inline media (self text and comments)

Reddit attaches `media_metadata` to self posts and comments that contain uploaded images, GIFs, Giphy-picker GIFs (ids like `giphy|<id>`), or videos. The `*_html` references each one as a **plain link**. `viewer-for-reddit` confirmed the shapes:

- Uploaded images appear as `<a href="https://preview.redd.it/<id>.<ext>?…">https://preview.redd.it/…</a>`, where the link text is the URL itself.
- Giphy GIFs appear as `<a href="https://giphy.com/gifs/<id>">…</a>`, or as `media.giphy.com` / `i.giphy.com` links.

`lib/media/inline.ts` runs **inside the sanitizer's parsed tree** (`transformTags`), not as a regex over HTML. It converts a link into inline media only when all of these hold:

1. The href's host is on the media allowlist.
2. Either the link text is empty or equals the URL (a "bare" media link), or the href matches a `media_metadata` entry with `status: 'valid'`.
3. The media type can be determined: `media_metadata.e`, or the file extension `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, or `.gifv` (→ `.mp4`).

The result is a `<figure>` holding an `<img>` for images, or a `<video muted loop playsinline autoplay>` for GIFs (Giphy → `media.giphy.com/media/<id>/giphy.mp4`, `.gifv` → `.mp4`), plus the caption. A link with meaningful text stays a link. The sanitizer allows `figure`, `figcaption`, `picture`, `source`, `img`, and `video` **only** with `src` on the allowlist (`*.redd.it`, `*.redditmedia.com`, `*.redditstatic.com`, `media.giphy.com`, `i.giphy.com`, `i.imgur.com`). Inline media inside NSFW or spoiler content follows the same reveal rules.

#### NSFW and spoilers

- **No filtering or gating.** The app never filters, hides, age-gates, or interstitials NSFW content, and no configuration or env var controls it. Every listing and search request passes `include_over_18=on` where Reddit accepts it, and NSFW posts render like any other post. If Reddit itself refuses something (for example a 403 on a subreddit), that is handled by the generic error states in §12, not by NSFW-specific UI.
- **Blur is a user setting** ("Blur NSFW media", §8.8). It is **on** by default and retained between browser sessions. When it is on, NSFW media sits behind a reveal. When it is off, NSFW media renders directly like any other post, including autoplaying GIF loops, with only a small "NSFW" badge. Spoiler media is always behind a reveal, because a spoiler is the author's intent, not a content preference.
- **No download before reveal** (when blurred). The reveal is a native `<details>`:
  - The `<summary>` shows Reddit's pre-blurred `variants.obfuscated` image with "NSFW · Show" or "Spoiler · Show".
  - The content holds the real media. Closed `<details>` content isn't rendered, so lazy images don't load, and `AutoplayVideo` never plays because it isn't intersecting. Embeds are facades regardless.
  - The real image, video, or iframe is not requested until the user reveals it, with or without JS.
- **Redgifs** follows the same rules. When blurred, the facade poster is the obfuscated preview, and the Redgifs iframe loads only after reveal and click.

#### Robustness measures

- **Safe URL parsing.** Every URL goes through `new URL()`, must be https (http upgraded only for known media hosts), and hosts are matched exactly or by `.suffix` (`youtube.com.evil.com` is rejected). IDs are validated with strict regexes before being interpolated into iframe URLs. Reddit's oEmbed `html` is **never** rendered.
- **Graceful degradation.** Each resolver returns `null` on any missing or invalid field, and the chain continues. The terminal `link` resolver always succeeds. Media fields are parsed per item with small schemas, and a malformed `media_metadata` entry drops only that item.
- **Telemetry for gaps.** When a post falls through to `link` but has `post_hint` of `rich:video`, `hosted:video`, or `image`, or a `secure_media` object, we log `media:unresolved { domain, post_hint, media_type }`. That tells us which provider to add next.
- **Corpus-driven tests** (§13). Every resolver and every provider needs at least two real captured samples, including NSFW Redgifs, spoilers, crossposted video, galleries with GIF items, removed posts, thumbnail sentinels, `v.redd.it` GIF versus video, Imgur GIFV, and Giphy in comments.

### 8.8 User settings: theme and NSFW blur

| Setting | Values | Default | Stored in | Applied by |
|---|---|---|---|---|
| Theme | `system`, `light`, `dark` | `system` | Cookie `rv_theme` (1 year, `SameSite=Lax`, `Secure`, **not** httpOnly so the head script can read it) | An inline `<head>` script before first paint |
| Blur NSFW media | `on`, `off` | `on` | Cookie `rv_blur_nsfw` (1 year, httpOnly) | The server, when rendering media |

**Retained between browser sessions.** Both are persistent cookies with `Max-Age` of one year (not session cookies), re-issued on every change. They are device preferences, so they survive sign-out and are not tied to the Reddit account.

**Theme without flash, and without losing the static shell.** This follows the bundled Next guide "Preventing flash before hydration":

- Reading a cookie in the root layout would make every route dynamic and block the shell under Cache Components, so the root layout stays static. It renders `<html data-theme="system" suppressHydrationWarning>`.
- A tiny inline `<head>` script reads `rv_theme` from `document.cookie` and sets `data-theme` synchronously, before paint.
- CSS tokens use `light-dark()`, so each color is defined **once**. `data-theme` only sets `color-scheme`: `:root { color-scheme: light dark }` for `system`, `[data-theme='light'] { color-scheme: light }`, and `[data-theme='dark'] { color-scheme: dark }`. Native form controls and scrollbars follow automatically, and no `dark:` variants or duplicate token blocks exist (§10.4).
- **Switching** uses the `ThemeToggle` island (System, Light, or Dark). It sets `data-theme` inside `document.startViewTransition()`, which gives a crossfade and is skipped under reduced motion, and writes the cookie. There is no server round trip and nothing re-renders.
- **Without JS,** the toggle is a `<form action={setTheme}>` that sets the cookie server-side, but the head script can't run, so no-JS users get the system theme. This is an accepted limitation.

**Blur NSFW media.**

- `SettingSwitch` calls the `setBlurNsfw` Server Action, which sets the cookie and calls `refresh()`. The feed re-renders on the server with or without reveal wrappers, and `useOptimistic` flips the switch instantly.
- The cookie is read inside the Suspense-wrapped data components that already read request data, so nothing new blocks the shell.
- When `rv_blur_nsfw` is absent, it defaults to `on`. Nothing is read from Reddit preferences.

**Where the settings appear.**

- The user menu has a compact theme segmented control and the blur switch.
- `/settings` has the same controls with short explanations.

### 8.9 Rich text: self-text and comment HTML

Self posts (r/AskReddit, r/explainlikeimfive, long-form subreddits) and comments render Reddit's **own markdown-to-HTML output** (`selftext_html` and `body_html`, with `raw_json=1`). That gives exact parity with Reddit's markdown dialect, with no client parser.

- **Sanitizer allowlist** (`lib/reddit/sanitize.ts`):
  - `p`, `br`, `hr`, `h1`–`h6`, `em`, `strong`, `del`, `sup`, `sub`, `code`, `pre`, `blockquote`, `ul`, `ol`, `li`, and `a`
  - `table`, `thead`, `tbody`, `tr`, `th[align]`, `td[align]`
  - `span.md-spoiler-text`, plus the inline-media tags from §8.7

  Comments (`<!-- SC_OFF -->`) and the outer `div.md` wrapper are stripped.
- **Links.** Reddit URLs (`reddit.com/r/…/comments/…`, `/r/x`, `/u/x`, `redd.it/{id}`) are rewritten to internal routes. External links get `target="_blank" rel="noopener noreferrer nofollow"`. `r/x` and `u/x` mentions are already links in Reddit's HTML.
- **Spoilers.** `>!text!<` becomes `<span class="md-spoiler-text">`. The sanitizer adds `tabindex="0"` and `role="button"` with `aria-label="Spoiler, activate to reveal"`, and CSS reveals the text on `:focus`, `:hover`, or after a click (a `:focus-within` latch). No JS is needed.
- **Typography.** `components/reddit-html.module.css` styles the sanitized HTML with element selectors scoped under the module's root class: headings, lists, tables with horizontal scroll, code blocks (Reddit Mono) with wrapping and scroll, quotes, and spoilers. It is built entirely on tokens and uses a ~70ch measure. There is no typography plugin, and colors follow the theme through `light-dark()` tokens.
- **Feed excerpts.** In feeds, self text renders inside a clamped container (max ~12 lines, with a fade-out mask). A `<details>` "Read more" beneath it lifts the clamp through CSS `:has(details[open])`, so it needs no JS, and the full text is already in the HTML. Very long bodies (over 40k characters) are truncated server-side in feeds, with "Continue reading →" linking to the post.
- **Post page.** The full body is shown, with an "edited" marker. Link posts that also carry body text render the body below the media.
- **Deleted and removed.** `[deleted]` and `[removed]` bodies render as muted system text, not as markdown.

### 8.10 Image galleries

Reddit gallery posts (`is_gallery`, up to 20 items) are first-class. The detection (resolver 3, §8.7) produces `{ type: 'gallery', items: GalleryItem[] }`, and each item carries its own `image`, `animated`, or `video` media, plus `caption` and `outboundUrl`.

**Data rules**

- The order follows `gallery_data.items`, and each item is joined to `media_metadata[media_id]`.
- Items with `status` other than `'valid'` (for example `failed` or `unprocessed`) are skipped. If every item is skipped, detection falls through to the next resolver. If exactly one item survives, the post renders as a plain image, animated loop, or video, with no carousel.
- Per item:
  - `e: 'Image'` builds a `srcset` from `p[]` (the preview resolutions), with `s.u` as the full-size source for the lightbox.
  - `e: 'AnimatedImage'` prefers `s.mp4` (a silent loop) over `s.gif`.
  - `e: 'RedditVideo'` uses `hlsUrl` and the item's dimensions.
- NSFW galleries: each item's blurred poster comes from `media_metadata[id].o` (Reddit's obfuscated renditions) when present. The whole gallery sits behind one `MediaReveal` when blurring is on.
- Crossposted galleries resolve through the crosspost resolver like any other media.

**Carousel (server-rendered, CSS-first)**

```
┌──────────────────────────────────────────────┐
│ ‹                  [ image 2 ]             › │   ← ::scroll-button(left/right)
│                                        2 / 7 │   ← per-slide badge (static, no JS)
└──────────────────────────────────────────────┘
   ● ● ○ ○ ○ ○ ○                                 ← ::scroll-marker dots (CSS)
   Caption for image 2 · ↗ outbound link
```

- **Markup.** An `<ul>` scroll container with `scroll-snap-type: x mandatory` and `overscroll-behavior-x: contain`. Each slide is `<li>` with `scroll-snap-align: center`.
- **Frame.** The frame's aspect ratio comes from the **first** item, clamped between 4:5 and 16:9, so there is no layout shift. Every item uses `object-fit: contain` on a neutral backdrop.
- **Loading.** The first slide is eager when it is the LCP candidate. The rest use `loading="lazy"`, and browsers lazy-load horizontally offscreen images inside scroll containers. Video and GIF slides attach through the shared player registry, which pauses and evicts them as they scroll out.
- **Controls use the new CSS Carousel primitives.**
  - `::scroll-button(left)` and `::scroll-button(right)` provide prev and next buttons.
  - `scroll-marker-group: after` with `::scroll-marker` provides the dots, with the active dot styled via `:target-current`.
  - All of this is inside `@supports selector(::scroll-button(*))`. Browsers without it still get swipe, trackpad, and keyboard scrolling of the focusable container, plus the static "i / n" badge on every slide. Nothing is lost except the buttons.
- **Captions and links.** The caption and `outbound_url` sit under each slide, inside the slide, so they scroll with it.
- **Accessibility.**
  - The container is `role="region" aria-roledescription="carousel" aria-label="Gallery, 7 items"` and is focusable, so ←/→ scroll it natively.
  - Each slide has `aria-roledescription="slide" aria-label="2 of 7"`.
  - Alt text is the caption if present, else "{post title}, image i of n".

**Lightbox (full screen)**

- **Markup.** A `<dialog closedby="any">` server-rendered next to the carousel, holding a full-viewport scroll-snap strip of the **full-size** sources (`s.u`) with captions and an "Open original ↗" link. Its images are `loading="lazy"`, so nothing downloads until it opens.
- **The `GalleryLightbox` island** does the following:
  1. Clicking a slide calls `showModal()`. It then scrolls the lightbox strip to the same index with `scrollIntoView({ container: 'nearest', behavior: 'instant' })`, which scrolls only the strip, not the page.
  2. It wraps the open in `document.startViewTransition()`, with a temporary `view-transition-name` on the tapped slide and the target lightbox slide, so the image **morphs** into full screen. It skips the morph under reduced motion.
  3. ←/→ move between slides, `Esc` closes (native), and a polite live region announces "Image 3 of 7".
  4. On close, it morphs back and returns focus to the originating slide.
- **Other interactions.** Pinch-zoom uses the browser's native zoom. Tapping the backdrop closes the lightbox (`closedby="any"`).
- **Without JS,** every slide is an `<a href={fullSizeUrl} target="_blank">`, so tapping opens the original image.

**Feed versus post page.** It is the same component. `variant="feed"` caps the frame height at 70vh. `variant="detail"` allows up to 85vh and shows captions expanded.

## 9. Information architecture and routes

| Route | Page | URL state |
|---|---|---|
| `/` | Landing and sign-in | `error`, `next`. Signed-in visitors are redirected to `/home`. |
| `/home` | Home feed | `sort=best\|hot\|new\|top\|rising`, `t=hour\|day\|week\|month\|year\|all`, `after`, `before`, `count` |
| `/r/[subreddit]` | Subreddit feed | Same as home. `/r/popular` and `/r/all` work here too. |
| `/r/[subreddit]/comments/[id]/[[...rest]]` | Post and comments | `rest = [slug?, commentId?]`. `sort=confidence\|top\|new\|controversial\|old\|qa`, `more` |
| `/user/[username]` | Profile | `tab=overview\|submitted\|comments`, `sort=new\|hot\|top`, cursors |
| `/user/[username]/m/[multi]` | Someone else's multi feed | Feed params |
| `/m/[multi]` | Own multi feed | Feed params |
| `/saved` | Saved items | `type=all\|links\|comments`, cursors |
| `/subreddits` | Manage subscriptions | `tab=communities\|people`, `q` (name filter) |
| `/multis` | Manage multireddits | |
| `/multis/[multi]` | Edit a multi | |
| `/search` | Find subreddits | `q`, cursors |
| `/settings` | Theme and NSFW-blur settings (§8.8) | |
| `/api/auth/login` · `/api/auth/callback/reddit` · `/api/auth/signout` | OAuth Route Handlers | The only Route Handlers in the app |

Links inside Reddit content that point at `reddit.com/r/…`, `/u/…`, `/user/…`, or `redd.it/{id}` are rewritten to internal routes by the sanitizer. Other links open in a new tab with `rel="noopener noreferrer nofollow"`.

## 10. UX design

### 10.1 Layout

```
Desktop ≥1024px
┌──────────────────────────────────────────────────────────────────────┐
│ ☰ Reddit Viewer        [ Search subreddits…   ⏎ ]          (avatar ▾)│  sticky header
├────────────┬─────────────────────────────────────────┬───────────────┤
│ Home       │  Best · Hot · New · Top ▾ · Rising       │ About r/x     │
│ Saved      │ ┌─────────────────────────────────────┐ │ (subreddit    │
│ Popular    │ │ ▲  r/nextjs · u/foo · 3h            │ │  pages only)  │
│ ─────────  │ │ 1.2k Title of the post              │ │               │
│ MULTIS  +  │ │ ▼  [media / preview / excerpt]      │ │ Members       │
│  dev       │ │    💬 214   ☆ Save   ↗ Reddit       │ │ [Subscribe]   │
│  news      │ └─────────────────────────────────────┘ │ [+ Multi ▾]   │
│ ─────────  │ ┌─────────────────────────────────────┐ │               │
│ COMMUNITIES│ │ …                                   │ │               │
│  r/nextjs  │ └─────────────────────────────────────┘ │               │
│  r/reactjs │                                         │               │
│  Manage →  │      ← Previous            Next →       │               │
│ PEOPLE     │                                         │               │
│  u/spez    │                                         │               │
└────────────┴─────────────────────────────────────────┴───────────────┘

Mobile <768px: header + single column. The sidebar is a `popover` drawer opened by ☰
(no JS). Right-rail content becomes a header card above the feed.
```

### 10.2 Screens

**Landing (`/`)**
- A centered card with the app name, a one-line value proposition, and the "Sign in with Reddit" form button.
- A note: "We never see your password. You'll approve access on reddit.com."
- An error banner when `?error=` is present.

**Feed (home, subreddit, multi, user)**
- Sort tabs are `<Link>`s. "Top" opens a `popover` menu of time ranges, also links.
- Post cards (Server Components) show:
  - The `VoteButtons` island: ▲, score, ▼.
  - Metadata: subreddit (omitted on its own page), author, relative time as a `<time>` element, and flair.
  - The title.
  - Media rendered according to `PostMedia` (§8.7):
    - Image: a responsive srcset.
    - Animated: an autoplaying muted loop, played only while visible.
    - Video: HLS with audio.
    - Gallery: a scroll-snap strip.
    - Embed: a click-to-load facade with a provider badge.
    - Link: a card with a thumbnail and domain chip.

    Self posts show an excerpt in `<details>` with a "Read more" summary. Crossposts show a "Crossposted from r/x" line.
  - An action row: comment count (link), the `SaveButton` island, and "Open on Reddit".
- NSFW and spoiler media show Reddit's pre-blurred preview inside a native `<details>` reveal, and the real media isn't requested until it is revealed (§8.7).
- Next and Previous pagination sits at the bottom.
- Empty, error, and end-of-feed states each have their own copy.

**Post detail**
- The full post and its vote column.
- A `CommentComposer` island for top-level comments.
- A sort menu (links) and the comment count.
- The comment tree (Server Components):
  - Each comment is a `<details open>`. Its `<summary>` is the header line (author, OP and mod badges, score, time, "edited"), and clicking it collapses the subtree natively.
  - Actions: vote (island); reply (a `<details>` revealing a `CommentComposer`); save (island); and, on your own comments, edit (a `<details>` with a prefilled composer) and delete (a `popover` confirm containing a form).
  - "Load N more replies" and "Continue this thread →" links (§8.3).
  - Deleted and removed comments render muted, with their replies intact.
- A "Viewing a single thread. View all comments →" banner in the single-thread view.
- Locked and archived threads have voting and composers disabled, with a banner.

**Saved:** type filter links (All, Posts, Comments). Comments render as compact cards with the post title and a "View context" link. Unsave calls `setSaved`, and the item stays visible (marked unsaved) until the next navigation, so the list doesn't shift under the cursor.

**Subscriptions (`/subreddits`):** Communities and People tabs, a GET filter form (`?q=`), and rows with icon, name, and a `SubscribeButton` island.

**Multis (`/multis`, `/multis/[name]`):**
- The list page shows each multi's subreddit count and visibility. A "New multi" form (display name and optional description) creates it and redirects to its edit page.
- The edit page has:
  - A details form: display name, description (textarea), and visibility (private, public, or hidden radios), with one Save button.
  - The subreddit list, where each row has a Remove form button.
  - An "Add a subreddit" form (text input + Add). The server validates the name through `/r/{sr}/about` and shows an inline error if it doesn't exist.
  - "Suggestions": the user's subscribed communities not already in the multi, each with an Add form button. This is server-rendered and replaces autocomplete.
  - A danger zone with delete, behind a `popover` confirm.
- The subreddit header and search results offer an "Add to multi" `popover` menu listing the user's multis, each a small form with a checkmark. Toggling it calls `addToMulti` or `removeFromMulti`, then `refresh()`.

**Profile (`/user/[u]`):** a header with avatar, karma, cake day, and a Follow/Unfollow `SubscribeButton`. Tabs (Overview, Posts, Comments) are links.

**Search (`/search`):** the header search is a GET form to `/search?q=`. Results show member counts, descriptions, a `SubscribeButton`, and "Add to multi".

### 10.3 Interaction rules

- **Optimistic, with rollback.** The islands (vote, save, subscribe) update at once with `useOptimistic`. On failure they roll back and show the reason inline in an `aria-live` region (for example "Thread is archived" or "Rate limited, retry in 8s").
- **Vote semantics.** Clicking the active arrow clears the vote (`dir=0`). The displayed score is `baseScore - initialLikes + currentLikes`.
- **Composer.** Submit is disabled while pending, and ⌘/Ctrl+Enter submits. On submit, the textarea clears and a faded pending comment appears. When the `refresh()` render arrives, it is replaced by the real comment. On failure, the text is restored and the Reddit error code is shown.
- **Destructive actions** (delete comment, delete multi, unsubscribe from the manage page) confirm through a `popover`. Unsubscribing from a header does not, because it is trivially reversible.
- **Pending navigation.** Sort, pagination, and "more" links show pending state through `LinkPendingHint` (§8.4), and the stale content dims until the new content crossfades in (§8.5).

### 10.4 Visual direction and styling system

**Look: Reddit-native.** We reuse the Reddit color scheme from `viewer-for-reddit`, which is built on Reddit's official brand orange and reddit.com's near-black dark chrome. We re-express it as our own tokens, with no Mantine. The layout, components, and motion are new, so the app feels like Reddit, not like a Mantine template.

#### Palette (tokens in `app/styles/tokens.css`)

**Orangered scale** (Reddit brand `#ff4500` at step 6):

| Token | Value | Token | Value |
|---|---|---|---|
| `--orangered-0` | `#ffeee4` | `--orangered-5` | `#fe5719` |
| `--orangered-1` | `#ffdbcd` | `--orangered-6` | `#ff4500` (brand) |
| `--orangered-2` | `#ffb69b` | `--orangered-7` | `#e43c00` |
| `--orangered-3` | `#ff8e64` | `--orangered-8` | `#cb3400` |
| `--orangered-4` | `#fe6d37` | `--orangered-9` | `#b22900` |

**Semantic tokens.** These are the only ones components use. Each is defined once with `light-dark(light, dark)`:

| Token | Light | Dark | Notes |
|---|---|---|---|
| `--surface-page` | `#ffffff` | `#0e0e10` | reddit.com page background (dark) |
| `--surface-card` | `#ffffff` | `#1a1a1b` | cards, panels, pills |
| `--surface-hover` | `#f6f7f8` | `#272729` | |
| `--border` | `#dadde1` | `#343536` | |
| `--text-1` | `#1c1c1c` | `#d7dadc` | body text |
| `--text-2` | `#576f76` | `#a6a7ab` | secondary |
| `--text-3` | `#7c7c7c` | `#818384` | dimmed and meta |
| `--accent` | `var(--orangered-8)` `#cb3400` | `var(--orangered-6)` `#ff4500` | Links and primary buttons. `#ff4500` on white is about 3.6:1, which fails AA for text, so light mode uses step 8. This is the same fix as the old app's `primaryShade: 8`. |
| `--accent-contrast` | `#ffffff` | `#ffffff` | text on accent fills |
| `--upvote` | `#cb3400` | `#ff4500` | Reddit orangered, darkened in light mode for AA text contrast |
| `--downvote` | `#4d62d6` | `#7193ff` | Reddit periwinkle, darkened in light mode (**VERIFY** ≥4.5:1 in Phase 3) |
| `--focus-ring` | `#0079d3` | `#4fbcff` | |
| `--nsfw` / `--spoiler` | `#d9254a` / `#6a6a6a` | `#ff585b` / `#a6a7ab` | badges |

The light-mode neutrals are new values chosen to match reddit.com's light chrome, because the old app used Mantine's light defaults. The dark values come straight from the old app. All pairs are checked against AA contrast by a unit test over the token file (Phase 3).

**Shape and type.**
- **Radius:** `--radius-1: 4px`, `--radius-2: 8px` (default), and `--radius-pill: 999px` for buttons, vote pills, and chips.
- **Type:**
  - **Reddit Sans** for UI and body, and **Reddit Mono** for code. Both are Reddit's open-source typefaces, available in `next/font/google` (checked).
  - They replace Geist from the scaffold.
  - Fallback is the system stack `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
- **Type scale:** fluid `clamp()` steps `--step--1` to `--step-4`. The reading measure is ~70ch for self text and comments.
- **Space:** a 4px-based scale, `--space-1` to `--space-8`. Motion tokens are listed in §8.5.
- **Density:** "Card" in v1. "Compact" is a P2 toggle stored in a cookie.

#### CSS architecture

```
app/styles/
  layers.css     @layer reset, tokens, base, components, utilities;   ← imported FIRST in app/layout.tsx
  reset.css      @layer reset      – modern reset (box-sizing, margins, media defaults, text-wrap: pretty)
  tokens.css     @layer tokens     – palette, semantic light-dark() tokens, type/space/radius/motion/z-index
  base.css       @layer base       – element defaults, :focus-visible ring, ::selection, links,
                                     view-transition rules (§8.5), reduced-motion block, gallery carousel primitives
  utilities.css  @layer utilities  – .visually-hidden, .stack, .cluster, .skeleton (tiny, closed set)
components/**/name.module.css      @layer components { … }  – colocated with name.tsx
```

- **Layers make order irrelevant.** Every module wraps its rules in `@layer components { … }`, so Next's import-order-dependent CSS chunking (see the bundled CSS guide) can't cause specificity bugs. Utilities beat components, and components beat base, no matter the load order.
- **Modern CSS by default:** native nesting, `:has()`, container queries (post cards adapt to column width, not viewport), `light-dark()`, `@starting-style` for popover and dialog entry animations, anchor positioning for menus and tooltips, and `text-wrap: balance` for titles. Turbopack always compiles CSS with Lightning CSS, which lowers syntax where needed for the browser targets.
- **Typed class names.** `happy-css-modules` generates a `.module.css.d.ts` next to each module, so `styles.arow` is a type error. It runs in `npm run check` and in watch mode during development. The generated `.d.ts` files are git-ignored and regenerated in CI.
- **Stylelint** (`stylelint-config-standard` + `stylelint-config-css-modules`) enforces:
  - no raw hex colors or pixel values outside `tokens.css` (component CSS must use tokens)
  - no `!important` outside the reduced-motion block
  - every module rule inside `@layer components`

#### Primitives (`components/ui/`, no library)

| Primitive | Built on | Client? |
|---|---|---|
| `Button`, `IconButton`, `LinkButton` | `<button>` / `<a>`, pill radius, accent and ghost variants, `aria-busy` | No |
| `Menu` | `popover` + a `popovertarget` button, positioned with CSS anchor positioning (`position-anchor`, `position-try-fallbacks`). Uses the disclosure pattern (a list of links and buttons), not ARIA `menu`. | No |
| `Tooltip` | `popover="hint"` + `interestfor`, where supported. Otherwise the `title` attribute. | No |
| `Dialog`, `ConfirmDialog` | `<dialog closedby="any">`, opened via invoker commands (`commandfor` / `command="show-modal"`) | No. `GalleryLightbox` is the only dialog island. |
| `Drawer` (mobile nav) | `popover` sliding in from the edge with `@starting-style` | No |
| `Disclosure` | `<details>` / `<summary>` | No |
| `Switch` | `<input type="checkbox" role="switch" switch>` (Safari's native switch, styled checkbox elsewhere) | Wrapped by `SettingSwitch` |
| `SegmentedControl` | a radio group in a `<fieldset>` | Wrapped by `ThemeToggle` |
| `Tabs` | `<nav>` of `<Link>`s with `aria-current="page"` (URL state) | No |
| `Badge`, `Chip`, `Avatar`, `Flair` | `<span>` / `<img>` | No |
| `Skeleton` | `.skeleton` utility plus shape components | No |
| `TextArea`, `TextField` | native inputs, with `field-sizing: content` for auto-growing textareas | No |
| `Pagination` | `<nav>` of `<Link>`s | No |
| `Spinner` | CSS only, shown after a delay | No |
| `VisuallyHidden` | utility class | No |

Primitives are Server Components unless noted, so their CSS ships but no JS does. The islands in §4.1 compose them.

**Browser support.** Anchor positioning, `popover="hint"` / `interestfor`, invoker commands, `closedby`, and `field-sizing` are newer. Each primitive feature-detects with `@supports` or a fallback attribute and degrades gracefully: menus fall back to normal flow below the trigger, and dialogs fall back to an explicit close button. This is covered by R11.

### 10.5 Accessibility

- Vote buttons are `<button aria-pressed>` with labels like "Upvote, current score 1,204". Score changes are announced through a polite live region.
- Comments are nested `<article>`s inside `<details>`, which gives native, keyboard-operable expand and collapse.
- Focus stays visible everywhere. Popovers use native light-dismiss and focus handling.
- `prefers-reduced-motion` zeroes all view-transition durations and disables gallery smooth scrolling.
- Skeletons carry `aria-busy="true"` on their container and a visually hidden "Loading…" label. Revealed content does not steal focus.
- Images get alt text from the post title, or from the gallery caption when present.

## 11. Security

| Threat | Mitigation |
|---|---|
| Token theft via XSS | Tokens are only in httpOnly cookies. All Reddit HTML goes through a strict `sanitize-html` allowlist (no `style`, no `on*`, and only `http(s)` and `mailto` schemes). The branded `SafeHtml` type plus a lint rule guard `dangerouslySetInnerHTML`. Minimal client JS shrinks the attack surface. A CSP ships in the hardening phase. |
| OAuth CSRF / login fixation | A random `state` in a sealed, short-lived cookie is compared on callback. |
| Open redirect via `next` | Only same-origin relative paths are allowed (§5.3). |
| Malicious or tracking embeds | Iframes are built **only** from provider-registry URLs, with strictly validated ids, and Reddit's oEmbed `html` is never injected. Every iframe carries `sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"` and a minimal `allow` list. Iframes load only after a click (facade). The CSP `frame-src`, `media-src`, `img-src`, and `connect-src` lists are generated from the registry. |
| CSRF on mutations | Server Actions check `Origin` against `Host`. Cookies are `SameSite=Lax`. There are no other mutation endpoints. `/api/auth/signout` via GET only clears cookies, which is low impact. |
| IDOR / acting as another user | The DAL derives the token from the session. Actions accept only ids and names, validated with Zod (fullname `^t[13]_[a-z0-9]+$`, subreddit `^[A-Za-z0-9_]{2,21}$`, username `^[A-Za-z0-9_-]{3,20}$`). Reddit enforces ownership. |
| Leaking data to the client | Server Components render view models. Islands get primitives only. Actions return `ActionResult` only. `server-only` guards `lib/auth` and `lib/reddit`. |
| Leaking PII in fixtures | The capture step scrubs the user's username, ids, and `/api/v1/me` private fields before writing to `fixtures/`. |
| Secrets | All env vars are server-only, with no `NEXT_PUBLIC_*`. `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` stays stable across deploys. |

## 12. Error handling

| Situation | UX |
|---|---|
| 401 from Reddit after refresh | `redirect('/api/auth/signout?reason=expired&next=…')` lands on `/?error=session_expired` |
| 403 subreddit (private, quarantined, banned) | An inline "This community is private/quarantined/banned" page state |
| 404 subreddit, user, or post | `notFound()` with a friendly not-found page |
| 429 | A section-level error with a countdown and retry (`catchError` boundary with `retry()`) |
| 5xx or network error | A section-level error with retry, while the rest of the page stays interactive |
| Schema failure on an envelope | Section error ("Reddit returned something unexpected"), logged with details |
| Schema failure on one item | The item is dropped and logged |
| Server Action failure | `ActionResult` error: the island rolls back and shows an inline message. Without JS, the re-rendered page shows the message via `useActionState` state. |

Section-level boundaries use `catchError` from `next/error`, so a failure in the sidebar does not blank the feed and vice versa. Route-level `error.tsx` and `not-found.tsx` are the fallbacks.

## 13. Testing strategy

| Layer | Tool | What |
|---|---|---|
| Schemas | Vitest | Every fixture in `fixtures/reddit/raw` parses with the curated schemas. Snapshot tests of mapper output for each `PostContent` type, deleted and removed comments, and crossposts. |
| Pure logic | Vitest | Score math, `next` sanitization, cursor math, `?more=` resolution and tree splicing, sanitizer allowlist (XSS corpus), link rewriting, token-expiry decisions. |
| Auth and proxy | Vitest | `proxy()` against mocked `fetch`: refresh on expiry, `invalid_grant` clears cookies, gating redirects, non-GET pass-through. |
| Server Actions | Vitest | Called directly with a mocked session and a mocked Reddit. Asserts input validation, error mapping, and `refresh()` versus no-refresh behavior. |
| End to end | Playwright + a mock Reddit server (base URLs from env) | Sign-in round trip, feed pagination, vote with rollback, comment and reply, load more comments, subscribe and follow, the full multi CRUD cycle, sign out. **The same suite runs a second time with `javaScriptEnabled: false`** to enforce N6. |
| Media detection | Vitest | Table-driven corpus in `tests/media/corpus/*.json`: a real captured post plus the expected `PostMedia` type and provider. Coverage gates require every resolver and provider to have at least 2 samples. There are also URL-parser tests with spoofed hosts and malformed ids. |
| Media playback | Playwright (Chromium + WebKit) | GIF loops animate (`currentTime` advances). Reddit video plays with an audio track (via `hls.js` on Chromium, native on WebKit). An embed makes no request to its provider before the click. NSFW media makes **no** network request before reveal. Reduced motion stops autoplay. |
| Network guard | Playwright | Asserts that no browser-initiated `fetch` or XHR goes to anything other than RSC navigations and Server Action POSTs (enforces rule 2). |
| Instant navigation | Playwright + `@next/playwright` `instant()` | For each route, asserts that the skeleton and static chrome are visible immediately on client navigation, before any Reddit data. This catches Suspense or App Shell regressions. |
| Settings | Playwright | The theme and blur choices survive closing and reopening the browser (the context's persisted `storageState`). There is no theme flash: `data-theme` is correct in the **first** paint, asserted by checking the attribute from a `DOMContentLoaded` listener injected via `addInitScript`. Toggling blur re-renders the feed without a reload. |
| Galleries | Vitest + Playwright | Mapper tests for mixed image, GIF, and video galleries, with failed and unprocessed items skipped, a single surviving item collapsing to plain media, and NSFW obfuscated posters. In the browser: swipe and keys advance, scroll buttons work where supported, only the first slide's image is requested initially, the lightbox opens at the tapped index with no full-size request before it opens, and focus returns to the slide on close. |
| Rich text | Vitest + Playwright | Sanitizer snapshots for a Reddit markdown corpus (tables, nested lists, code, spoilers, superscript, and headings from real AskReddit and ELI5 fixtures). Spoilers reveal via keyboard. |
| Optimistic UX | Playwright with a delayed mock Reddit | Vote, save, and subscribe update before the action resolves. An injected 500 rolls back and shows the inline error. A pending comment appears and is then replaced by the real one. |
| Manual | Real Reddit account | A smoke checklist per release (in the implementation doc). |

## 14. Risks and open questions

| # | Item | Mitigation / decision needed |
|---|---|---|
| R1 | **Env var name bug.** `.env.local` defines `NEXT_SERVER_ACTION_ENCRYPTION_KEY`, but Next reads `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` (plural). As written, the key is ignored. | Rename the variable (implementation step 0). |
| R2 | Reddit rate limits (~100 QPM per client id) are shared by **all** users of the app. Server-first means one Reddit call per navigation, and `refresh()` after some mutations re-fetches the page. | This is fine for personal or small use. Votes and saves deliberately skip `refresh()`. Revisit if usage grows. |
| R3 | Reddit's API terms and app-approval policy may change and may restrict third-party clients. | Keep usage non-commercial and within the documented API. Revisit before any public launch. |
| R4 | Generated schemas can be too strict for rare payload shapes. | Per-item parsing drops only the bad item. The curated `extend` overrides cover it, drift tests catch it, and fixtures are recaptured periodically. |
| R5 | Reddit-hosted video audio needs HLS from `v.redd.it`. | **Resolved.** `hls.js` against `v.redd.it` works from a third-party origin (proven in `viewer-for-reddit`), so no proxy is needed. The CSP needs `connect-src https://v.redd.it` and `media-src blob:`. |
| R9 | Third-party embed requirements change (YouTube's referrer requirement, Twitch's `parent`, Redgifs iframe policy). | Each provider is isolated in its own registry module with its own tests, facades limit the blast radius, and the release smoke test covers one embed per provider. |
| R11 | The newest platform features aren't supported by every browser: CSS Carousel (`::scroll-button`, `::scroll-marker`), anchor positioning, `popover="hint"` / `interestfor`, invoker commands, `closedby`, `field-sizing`, `scrollIntoView({ container })`, and same-document View Transitions. | Each is wrapped in `@supports` or a feature check and degrades to plain scroll, a close button, or an instant open. Test Safari and Firefox in the smoke run. |
| R6 | Cookie size. Reddit access tokens are long JWTs. | Split cookies (§5.4), with a unit test that each sealed cookie stays under 3.8 KB. |
| R7 | A new comment may lag in Reddit's listing right after `/api/comment`, so the `refresh()` render could miss it. | Reddit is normally read-your-writes for the author. If lag shows up in testing, `postComment` redirects to the new comment's permalink (single-thread view, fetched with `comment=<id>`), which Reddit resolves directly. Verify in Phase 4. |
| Q1 | Signed-in visitors to `/` | **Decided:** `proxy.ts` redirects to `/home`. |
| R8 | View Transitions support differs by browser. React's integration needs transition types and `view-transition-class` (Chromium 125+ and recent Safari and Firefox), and Safari may animate differently. | Motion is purely progressive. Without support, content swaps instantly. Check Safari in the manual smoke test. |
| Q2 | Canary or stable? | **Decided:** `next@canary` during development, and a switch to the latest stable before production (§15). |

## 15. Platform and version policy ("bleeding edge")

We checked this against the installed packages and the npm registry on 2026-09-29.

| Package | Installed | Latest stable | Canary |
|---|---|---|---|
| `next` | 16.3.7 (switching to canary) | 16.3.7 | 16.4.0-canary.52 |
| `react` / `react-dom` (top level) | 19.3.0 | 19.3.0 | 19.3.0-canary-d083ec1d-20260922 |
| React used by the App Router (vendored in `next/dist/compiled`) | 19.3.0-canary-cbb046ab-20260731 | n/a | n/a |
| `@types/react` | 19.3.0, which already types `ViewTransition`, `addTransitionType`, `useOptimistic`, and `Activity` | | |

**Decision: develop on `next@canary`.** Every feature this design relies on already exists in stable 16.3.7, because the App Router ships a React canary build. Canary adds the newest fixes and features as they land, at the cost of occasional churn. That covers `<ViewTransition>`, `addTransitionType`, `<Activity>` route preservation, `useOptimistic`, `useActionState`, `useEffectEvent`, and `cacheSignal` from React. From Next it covers Cache Components, Partial Prefetching, `<Link transitionTypes>`, `useLinkStatus`, `catchError`, `io()`, `refresh()`, `updateTag()`, and the React Compiler. No experimental flag is required for any of them.

Policy:

1. **During development, run `next@canary`**, pinned to an exact version (`16.4.0-canary.52` at project start) together with the matching `eslint-config-next` and `@next/playwright` canaries. The top-level `react` and `react-dom` track `react@canary`, so the types and the vendored runtime stay aligned.
2. Bump the canary deliberately with a weekly PR (`npm i -E next@canary eslint-config-next@canary @next/playwright@canary react@canary react-dom@canary`), gated by the full CI suite. Read the bundled docs' diff for anything that changed.
3. Enable `cacheComponents`, `partialPrefetching`, `typedRoutes`, and `reactCompiler`, and keep instant-navigation validation at its default level.
4. **Before production,** switch to the latest stable release at or above the last green canary and pin it exactly. After that, a nightly job tests `next@canary` without blocking.
5. Before writing code against any Next API, read the bundled docs in `node_modules/next/dist/docs/` (per `AGENTS.md`). That is the source of truth for this version.
