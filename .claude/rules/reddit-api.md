---
paths:
  - 'lib/actions/**/*.ts'
  - 'lib/auth/**/*.ts'
  - 'app/api/**'
  - 'lib/types/reddit-api.ts'
  - 'lib/types/reddit.ts'
---

# Reddit API Patterns & Conventions

Reddit disabled public unauthenticated REST access in June 2026 - every request in this app is authenticated. `REDDIT_API_URL` (`lib/utils/constants.ts`) is always `oauth.reddit.com`; there is no anonymous fallback base URL.

## Two calling patterns - know which one you're in

**`redditFetch<T>()`** (`lib/actions/reddit/redditFetch.ts`) - for straightforward authenticated GET reads: `fetchPosts`, `fetchPost`, `fetchUserPosts`, `fetchUserInfo`, `fetchUserComments`, `fetchSubredditInfo`, `searchReddit`, `searchSubreddit`. Auto-adds `raw_json=1` and `Authorization` header, validates the URL against the Reddit-domain allowlist, and **throws** a typed error on failure (`AuthenticationError` 401/403, `NotFoundError` 404, `RateLimitError` 429, `RedditAPIError` otherwise - all from `lib/utils/errors.ts`).

```typescript
import {redditFetch} from '@/lib/actions/reddit/redditFetch'

const data = await redditFetch<ApiSubredditPostsResponse>(
  '/r/popular/hot.json',
  {
    searchParams: {limit: '25'},
    cache: {revalidate: CACHE_POSTS, tags: ['posts', 'popular']},
    operation: 'fetchPosts',
    resource: 'popular'
  }
)
```

**Manual `fetch()` + `getRedditContext()`** - for everything else: mutations (`votePost`, `savePost`, `toggleSubscription`, `followUser`/`unfollowUser`, multireddit create/update/delete), "fetch all pages" loops (`fetchUserSubscriptions`), typeahead endpoints (`searchSubreddits`, `searchSubredditsAndUsers`), and endpoints that don't return a listing (`fetchMultireddits`, `fetchFollowedUsers`). These build the URL/body by hand, call `assertRedditUrl()` themselves, and **do not throw** - they catch and return `{success: false, error: GENERIC_ACTION_ERROR}` (mutations) or an empty array/`null` (reads), so a missing session degrades to an empty state instead of an error boundary. Mutations POST form-urlencoded bodies (`Content-Type: application/x-www-form-urlencoded`, `URLSearchParams` body), not `redditFetch`'s `searchParams` (which is query-string only).

```typescript
const {headers, baseUrl} = await getRedditContext()
const url = `${baseUrl}/api/vote`
assertRedditUrl(url)
await fetch(url, {
  method: 'POST',
  headers: {...headers, 'Content-Type': 'application/x-www-form-urlencoded'},
  body: new URLSearchParams({id: postName, dir: direction.toString()})
})
```

When adding a new endpoint, match whichever pattern the neighboring functions in that file use.

## `getRedditContext()`

Resolves session → refreshes the token if within `TOKEN_REFRESH_BUFFER` of expiry (coalesces concurrent refreshes) → returns `{headers, baseUrl, username}`. **Throws** `Error('Not authenticated')` or `Error('Token refresh failed')` - it does not return a degraded/anonymous context. Callers decide whether to let that propagate (protected routes) or catch it locally (e.g. sidebar widgets like followed-users/subscriptions/avatar catch and return an empty state).

## Fullnames (thing IDs)

`t1_` comment · `t2_` account · `t3_` link/post · `t4_` message · `t5_` subreddit · `t6_` award. Validate with the `isValid*` helpers in `lib/utils/reddit-helpers.ts` before building any URL from user input.

## Listings & pagination

Cursor-based, never page numbers. Shape is `RedditListing<T>` (`lib/types/reddit.ts`): `{data: {children, after, before, dist}}`. Pass the previous response's `after` as the next request's `after` param; never both `after` and `before`.

**`raw_json=1`**: required to avoid HTML-entity-escaped `<`/`>`/`&` in text fields. `redditFetch` adds it automatically for GET; manual-`fetch()` call sites must add it themselves (they all currently do - keep that pattern for new ones).

## OAuth scopes

Requested scopes live in one place, `lib/utils/reddit-auth.ts`'s `SCOPES` array - check there before assuming a scope is available. Currently: `identity`, `read`, `vote`, `subscribe`, `mysubreddits`, `save`, `submit`, `edit`, `history`. No moderation, private-message, or report scopes are requested - those Reddit API surfaces aren't reachable from this app.

## Rate limiting

`redditFetch`'s error path already captures `X-Ratelimit-*` and `Retry-After` headers into `RateLimitError.retryAfter` on 429. For manual-fetch call sites, check `response.status === 429` yourself (see `searchSubreddits` for the pattern - it returns a friendly error string instead of throwing).

## Caching

Revalidate seconds live in `lib/utils/constants.ts` (`CACHE_POSTS`, `CACHE_COMMENTS`, `CACHE_USER_INFO`, `CACHE_SUBREDDIT_INFO`, `CACHE_SUBSCRIPTIONS`, `CACHE_SEARCH`) - read that file for current values rather than assuming; they've drifted before and the JSDoc comments on individual actions can lag behind.

## Endpoints actually implemented

| Action                                                   | Endpoint                                                                                                | Notes                                                                                                                                                                                                             |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetchPosts`                                             | `GET /r/{sub}/{sort}.json` (or `/{sort}.json` for home, `/user/{u}/m/{m}/{sort}.json` for multireddits) | `sort`: hot/new/rising/top/controversial; `t` time filter only for top/controversial                                                                                                                              |
| `fetchPost`                                              | `GET /r/{sub}/comments/{postId}.json`                                                                   | **No slug segment** - Reddit resolves without it. Returns `[postListing, commentsListing]`; filter `commentsListing` children to `kind === 't1'` before mapping (listings also include `kind: 'more'` stub nodes) |
| `fetchUserInfo` / `fetchUserPosts` / `fetchUserComments` | `GET /user/{username}/about.json` / `submitted.json` / `comments.json`                                  | Only these three `where` values are implemented - no `upvoted`/`downvoted`/`gilded`                                                                                                                               |
| `fetchSavedItems`                                        | `GET /user/{username}/saved.json`                                                                       | Manual fetch; filters out `stickied` items client-side                                                                                                                                                            |
| `fetchSubredditInfo`                                     | `GET /r/{sub}/about.json`                                                                               |                                                                                                                                                                                                                   |
| `searchReddit` / `searchSubreddit`                       | `GET /search.json` / `/r/{sub}/search.json`                                                             | Always sends `include_over_18: 'on'`                                                                                                                                                                              |
| `searchSubreddits` / `searchSubredditsAndUsers`          | `GET /api/subreddit_autocomplete_v2.json`                                                               | Separate typeahead endpoint, not `/search.json`; manual fetch, min 2-char query, returns `{success, data, error?}`                                                                                                |
| `votePost`                                               | `POST /api/vote`                                                                                        | body `{id, dir}`, `dir`: `1`/`0`/`-1`                                                                                                                                                                             |
| `savePost`                                               | `POST /api/save` or `/api/unsave`                                                                       | body `{id}` - no `category` param implemented                                                                                                                                                                     |
| `toggleSubscription`                                     | `POST /api/subscribe`                                                                                   | body `{action: 'sub'\|'unsub', sr_name}`                                                                                                                                                                          |
| `followUser` / `unfollowUser`                            | `PUT`/`DELETE /api/v1/me/friends/{username}`                                                            |                                                                                                                                                                                                                   |
| `fetchFollowedUsers`                                     | `GET /api/v1/me/friends`                                                                                |                                                                                                                                                                                                                   |
| `fetchUserSubscriptions`                                 | `GET /subreddits/mine/subscriber.json`                                                                  | Manual fetch, loops all pages in a `do/while` until `after` is null                                                                                                                                               |
| `fetchMultireddits`                                      | `GET /api/multi/mine`                                                                                   | **Returns a raw array**, not a `{data: {...}}` listing                                                                                                                                                            |
| create/update/delete multireddit, add/remove subreddit   | `POST`/`PUT`/`DELETE /api/multi/...`                                                                    |                                                                                                                                                                                                                   |

Hide/unhide (`/api/hide`, `/api/unhide`) are not implemented anywhere in this codebase - don't assume they exist.

## Security

`assertRedditUrl()` (`lib/actions/reddit/_helpers.ts`) allowlists only `oauth.reddit.com`/`reddit.com` over HTTPS - call it on any URL you build by hand (every manual-fetch call site already does). `redditFetch` calls it internally. Sanitize `body_html`/`selftext_html` with `sanitizeText()` before rendering.

Votes must be cast by a human action - no auto-voting or vote amplification (Reddit API rules).
