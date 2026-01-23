---
name: Reddit API Patterns
description: Comprehensive guide for interacting with the Reddit API. Covers authentication, pagination, endpoints, error handling, rate limiting, and data transformation patterns.
applyTo: lib/actions/**/*.ts, app/api/**, lib/types/reddit-api.ts, lib/types/reddit.ts
---

# Reddit API Patterns & Conventions

## Core Concepts

### Fullnames (Thing IDs)

Reddit uses fullnames with type prefixes:

- `t1_` - Comment
- `t2_` - Account (User)
- `t3_` - Link (Post)
- `t4_` - Message
- `t5_` - Subreddit
- `t6_` - Award

**Example:** `t3_abc123` is a post, `t1_xyz789` is a comment

### Response Encoding

**Always use `raw_json=1` parameter** to get unescaped JSON responses. Without it, Reddit escapes `<`, `>`, and `&` as HTML entities (`&lt;`, `&gt;`, `&amp;`).

```typescript
const url = `${REDDIT_API_URL}/r/${subreddit}/hot.json?raw_json=1&limit=${limit}`
```

### Listings Protocol

Reddit uses cursor-based pagination, NOT page numbers:

```typescript
// Listings return { data: { children: [...], after: string, before: string } }
interface ListingResponse {
  data: {
    children: Array<{kind: string; data: T}>
    after: string | null // Cursor for next page
    before: string | null // Cursor for previous page
    dist: number // Number of items in this response
  }
}
```

**Common listing parameters:**

- `after` / `before` - Pagination cursors (only use one at a time)
- `limit` - Max items (default: 25, max: 100)
- `count` - Number of items already seen (optional, helps Reddit generate accurate before/after)
- `show` - Set to "all" to disable filters like "hide voted posts"

**Pagination example:**

```typescript
// First page
const firstPage = await fetch(`/r/popular/hot.json?limit=25`)
const after = firstPage.data.after

// Second page
const secondPage = await fetch(
  `/r/popular/hot.json?limit=25&after=${after}&count=25`
)
```

### OAuth & Authentication

**Token Methods (Arctic Library):**

```typescript
// ✅ CORRECT - tokens are methods
const accessToken = tokens.accessToken()
const refreshToken = tokens.refreshToken()

// ❌ WRONG - Don't use property access
const accessToken = tokens.accessToken // This will fail!
```

**OAuth Scopes by Endpoint Type:**

- `read` - Basic read access (subreddit posts, comments, user profiles)
- `identity` - User identity (/api/v1/me)
- `mysubreddits` - User's subscribed subreddits
- `submit` - Submit posts and comments
- `edit` - Edit posts and comments
- `vote` - Cast votes
- `save` - Save/unsave posts and comments
- `report` - Report content
- `privatemessages` - Read/send private messages
- `modposts` - Moderate posts (approve, remove, distinguish, sticky, etc.)
- `modconfig` - Modify subreddit settings
- `modflair` - Manage flair
- `modlog` - Access moderation log
- `modwiki` - Moderate wiki pages

### Rate Limiting

Reddit has aggressive rate limits:

**Best Practices:**

1. **Use conditional requests:** Pass `If-Modified-Since` or `If-None-Match` headers
2. **Cache responses:** Use Next.js `next: {revalidate: seconds}` option
3. **Retry with exponential backoff:** Use `retryWithBackoff()` helper for 429 responses
4. **Respect `X-Ratelimit-*` headers:**
   - `X-Ratelimit-Used` - Requests used in current window
   - `X-Ratelimit-Remaining` - Requests remaining
   - `X-Ratelimit-Reset` - Unix timestamp when limit resets

**Error Response Example:**

```typescript
if (response.status === 429) {
  throw new Error('Rate limit exceeded. Try again later.')
}
```

## Common Endpoints

### Subreddit Posts

```typescript
// Get posts from a subreddit
GET / r / {subreddit} / {sort}.json
```

**Sorts:** `hot`, `new`, `rising`, `top`, `controversial`

**Parameters:**

- `t` - Time filter for top/controversial: `hour`, `day`, `week`, `month`, `year`, `all`
- `limit` - Max posts (default: 25, max: 100)
- `after` / `before` - Pagination cursors
- `g` - Geolocation for hot (US, GLOBAL, etc.)
- `raw_json=1` - Get unescaped JSON

**Example:**

```typescript
const response = await fetch(
  `${REDDIT_API_URL}/r/popular/hot.json?limit=25&raw_json=1`,
  {headers: getHeaders(), next: {revalidate: FIVE_MINUTES}}
)
```

### Post Comments

```typescript
// Get post with comments
GET / r / {subreddit} / comments / {post_id} / {slug}.json
```

**Parameters:**

- `limit` - Max comments to return
- `depth` - Maximum depth of comment trees
- `context` - Number of parent comments to include (when linking to specific comment)
- `sort` - Comment sort: `confidence` (best), `top`, `new`, `controversial`, `old`, `qa`
- `comment` - ID36 of specific comment to focus on
- `truncate` - Truncate long comment threads (0-50)

**Response structure:**

```typescript
// Returns array with 2 elements: [post_listing, comments_listing]
const [postData, commentsData] = await response.json()
const post = postData.data.children[0].data
const comments = commentsData.data.children.map((child) => child.data)
```

### User Profile

```typescript
// Get user overview
GET / user / {username} / about.json
GET / user / {username} / {where}.json // where: overview, submitted, comments, upvoted, etc.
```

**User data sections:**

- `about` - User profile info (karma, created date, etc.)
- `overview` - Mix of posts and comments
- `submitted` - User's posts
- `comments` - User's comments
- `upvoted` - Upvoted content (requires auth, only shows own)
- `downvoted` - Downvoted content (requires auth, only shows own)
- `saved` - Saved content (requires auth, only shows own)
- `gilded` - Gilded content

### Subreddit Info

```typescript
// Get subreddit details
GET / r / {subreddit} / about.json
```

**Returns:**

- `display_name` - Subreddit name
- `subscribers` - Subscriber count
- `public_description` - Short description
- `description` - Full sidebar (markdown)
- `over18` - NSFW flag
- `icon_img` - Subreddit icon URL
- `banner_img` - Banner image URL

### Search

```typescript
// Search within subreddit
GET /r/{subreddit}/search.json?q={query}&restrict_sr=true

// Search all of Reddit
GET /search.json?q={query}
```

**Parameters:**

- `q` - Search query (max 512 chars)
- `sort` - `relevance`, `hot`, `top`, `new`, `comments`
- `t` - Time filter: `hour`, `day`, `week`, `month`, `year`, `all`
- `restrict_sr` - Boolean: restrict to subreddit (default: false)
- `limit` - Max results (default: 25, max: 100)
- `type` - Result types: `link`, `sr` (subreddit), `user`

### Voting

```typescript
// Cast a vote
POST / api / vote
```

**Parameters:**

- `id` - Fullname of post (t3*) or comment (t1*)
- `dir` - Vote direction:
  - `1` - Upvote
  - `0` - Remove vote
  - `-1` - Downvote

**Important:** Votes must be cast by humans. Bots that auto-vote or amplify votes violate Reddit rules.

### Save/Unsave

```typescript
// Save content
POST /api/save?id={fullname}&category={optional_category}

// Unsave content
POST /api/unsave?id={fullname}
```

### Hide/Unhide

```typescript
// Hide posts from listings
POST /api/hide?id={comma_separated_fullnames}

// Unhide posts
POST /api/unhide?id={comma_separated_fullnames}
```

## Multireddits

**Path format differs from regular subreddits:**

```typescript
// Regular subreddit
/r/{subreddit}/hot.json

// Multireddit
/user/{username}/m/{multiname}/hot.json
```

**Fetch user's multireddits:**

```typescript
GET / api / multi / mine
```

**Returns:**

```typescript
interface Multireddit {
  name: string
  display_name: string
  path: string // e.g., "/user/username/m/multiname"
  subreddits: Array<{name: string}>
  visibility: 'private' | 'public' | 'hidden'
}
```

## Error Handling

### HTTP Status Codes

```typescript
// 200 - Success
// 201 - Created (new post/comment)
// 202 - Accepted (async operation queued)
// 204 - No Content (success, no data)
// 400 - Bad Request (invalid parameters)
// 401 - Unauthorized (auth required or token expired)
// 403 - Forbidden (no permission)
// 404 - Not Found (subreddit/post/user doesn't exist)
// 429 - Too Many Requests (rate limited)
// 500 - Internal Server Error
// 503 - Service Unavailable (Reddit is down)
```

### Error Response Structure

```typescript
interface RedditError {
  error: number // HTTP status code
  message: string // Error description
  reason?: string // Additional context
}
```

### Graceful Degradation

**Always support unauthenticated users:**

```typescript
const session = await getSession()
const headers = await getHeaders(!!session.accessToken)

// Use public API for unauthenticated requests
const baseUrl = session.accessToken
  ? REDDIT_API_URL // OAuth: https://oauth.reddit.com
  : REDDIT_PUBLIC_API_URL // Public: https://www.reddit.com

const response = await fetch(`${baseUrl}/r/${subreddit}/hot.json`, {headers})
```

## Data Transformation

### API Response → Application Types

Reddit API responses are verbose. Transform them into simplified types:

```typescript
// Reddit API returns nested structure
interface ApiPost {
  kind: 't3'
  data: {
    id: string
    title: string
    author: string
    subreddit: string
    score: number
    num_comments: number
    // ... 100+ more fields
  }
}

// Transform to simplified type
interface RedditPost {
  id: string
  title: string
  author: string
  subreddit: string
  score: number
  numComments: number
  // ... only fields you need
}

// Transformation
const post: RedditPost = {
  id: apiPost.data.id,
  title: apiPost.data.title,
  author: apiPost.data.author,
  subreddit: apiPost.data.subreddit,
  score: apiPost.data.score,
  numComments: apiPost.data.num_comments
}
```

## Best Practices

1. **Always use `raw_json=1`** - Avoid HTML entity escaping
2. **Implement retry with exponential backoff** - Handle 429 rate limits gracefully
3. **Cache aggressively** - Use Next.js `revalidate` option (300s = 5 min)
4. **Use cursor pagination** - `after`/`before`, never page numbers
5. **Check fullname prefixes** - Validate `t1_`, `t3_` etc. before operations
6. **Graceful auth failure** - Always work for unauthenticated users when possible
7. **Respect rate limits** - Monitor `X-Ratelimit-*` headers
8. **Transform API responses** - Map to simplified application types
9. **Use Arctic token methods** - `tokens.accessToken()` NOT `tokens.accessToken`
10. **Sanitize HTML** - Use `sanitize-html` via `sanitizeText()` for `body_html`, `selftext_html`, etc.

## Common Gotchas

1. **Multireddit paths are different** - Use `/user/{username}/m/{multiname}` not `/r/`
2. **Comments are listings too** - Comments have `children`, `after`, `before` like posts
3. **Escaped HTML by default** - Must use `raw_json=1` or decode entities
4. **Token methods not properties** - Arctic returns functions: `tokens.accessToken()`
5. **Vote direction is numeric** - `1` (up), `0` (remove), `-1` (down), NOT strings
6. **Media in multiple places** - Check `preview.reddit_video_preview` first, then `media.reddit_video`
7. **Some endpoints return arrays** - Comments endpoint returns `[post, comments]`
8. **Rate limits are aggressive** - Implement exponential backoff, respect headers
