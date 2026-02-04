---
name: Code Standards & Architecture
description: Code standards, design patterns, and conventions for the Reddit Viewer Next.js 16 application. Essential reference for contributors and AI coding agents.
applyTo: '{app,components,lib}/**/*.{ts,tsx}'
---

# Code Standards & Architecture

## Project Structure

```
app/                    - Next.js pages (Server Components by default)
  api/                  - API routes (auth, logging)
  r/[subreddit]/        - Subreddit pages
  u/[username]/         - User profile pages
  search/[query]/       - Search results

components/
  layout/               - Structural components (each in own directory)
    AppLayout/
    Header/
    Logo/
    Sidebar/
    ThemeProvider/
    UserMenu/
  ui/                   - Feature components (each in own directory)
    Analytics/
    BackToTop/
    BossButton/
    Comment/
    CommentListWithTabs/
    ErrorBoundary/      - Legacy class-based (still used in global-error.tsx)
    ErrorDisplay/
    Gallery/
    PostActions/
    PostCard/
    PostHeader/
    PostList/
    PostListWithTabs/
    PostMedia/
    SavedItemsList/
    SearchBar/
    SubscribeButton/
    SwipeNavigation/
    UserCommentListWithTabs/
    UserProfileTabs/
    VideoPlayer/
  skeletons/            - Loading states (each in own directory)
    CommentSkeleton/
    PostSkeleton/
    SubredditInfoSkeleton/
    TabsSkeleton/

lib/
  actions/reddit.ts     - ALL Reddit API calls (Server Actions)
  auth/session.ts       - Session management (Arctic + iron-session)
  hooks/                - Custom React hooks
  types/
    reddit-api.ts       - Auto-generated (DO NOT EDIT, use npm run typegen)
    reddit.ts           - Manual application types
  utils/                - Helpers, constants, formatters
```

---

## Core Patterns

### 1. Server Components by Default

**No `'use client'` needed** - Server Components are the default in React 19.

```typescript
// ✅ CORRECT - Server Component (no directive)
export default async function SubredditPage({params}: PageProps) {
  const {subreddit} = await params // Next.js 16 requirement
  const {posts} = await fetchPosts(subreddit, 'hot')

  return <PostListWithTabs posts={posts} />
}
```

**Rules:**

- Server Components are async when fetching data
- Error boundaries handled by `error.tsx` files (Next.js convention)
- Loading states handled by `loading.tsx` files (Next.js convention)
- Direct server action calls allowed
- No React hooks (useState, useEffect, etc.)

### 2. Client Components for Interactivity

Add `'use client'` only when needed.

```typescript
// ✅ CORRECT - Client Component for hooks/events
'use client'

export function PostCard({post}: Readonly<PostCardProps>) {
  const {vote, isPending} = useVote({
    itemName: post.name,
    initialScore: post.score
  })

  return <PostActions onVote={vote} disabled={isPending} />
}
```

**When to use Client Components:**

- Need React hooks (useState, useEffect, useTransition)
- Handle user interactions (onClick, onSubmit)
- Access browser APIs (window, document)
- Use context providers/consumers

**When NOT to use Client Components:**

- Simple rendering of server data
- Static content
- SEO-critical content

### 3. All Reddit API Calls in Server Actions

**CRITICAL:** ALL Reddit API calls MUST be in `/lib/actions/reddit.ts`

```typescript
'use server'

import {REDDIT_API_URL, FIVE_MINUTES} from '@/lib/utils/constants'

export async function fetchPosts(
  subreddit: string,
  sort: SortOption,
  after?: string
) {
  const session = await getSession()
  const headers = await getHeaders(!!session.accessToken)

  const response = await fetch(url, {
    headers,
    next: {revalidate: FIVE_MINUTES}
  })

  if (!response.ok) {
    if (response.status === 401) throw new Error('Authentication expired')
    if (response.status === 404) throw new Error('Subreddit not found')
    if (response.status === 429) throw new Error('Rate limit exceeded')
    throw new Error(`Reddit API error: ${response.statusText}`)
  }

  const data: ApiSubredditPostsResponse = await response.json()
  const posts = data.data?.children?.map((c) => c.data) as RedditPost[]
  return {posts, after: data.data?.after}
}
```

**Required patterns:**

1. **Next.js fetch caching** - Use `next: {revalidate}` for automatic caching and request deduplication
2. **Specific error messages** - Different message per HTTP status
3. **Explicit caching** - Use constants: `FIVE_MINUTES`, `TEN_MINUTES`, `ONE_HOUR`
4. **Type transformation** - API types → simplified app types at boundary
5. **Graceful authentication** - Work for both authenticated/unauthenticated users

```typescript
// ❌ WRONG - Never fetch directly in components/hooks
export function useVote() {
  await fetch('https://oauth.reddit.com/api/vote') // ❌
}

// ✅ CORRECT - Call server action
export function useVote() {
  await votePost(itemName, direction) // ✅
}
```

### 4. Custom Hooks for Client State

**Location:** `lib/hooks/`

```typescript
export function useVote({itemName, initialScore}: UseVoteOptions) {
  const [isPending, startTransition] = useTransition()
  const [score, setScore] = useState(initialScore)

  const vote = (direction: 1 | -1) => {
    if (isPending) return // CRITICAL: Race condition prevention

    const currentScore = score
    setScore(score + direction) // Optimistic update

    startTransition(async () => {
      const result = await votePost(itemName, direction)
      if (!result.success) {
        setScore(currentScore) // Rollback on failure
      }
    })
  }

  return {score, isPending, vote}
}
```

**Hook patterns:**

- **Optimistic updates** - Immediate UI feedback, rollback on failure
- **Race condition prevention** - Always check `if (isPending) return`
- **Server action calls** - Hooks call actions, not direct fetch

**Available hooks:**

- `useVote` - Voting with optimistic updates
- `useSavePost` - Save/unsave with optimistic updates
- `useInfiniteScroll` - IntersectionObserver-based pagination
- `useSearch` - Debounced search with autocomplete
- `useBossButton` - Emergency navigation (Escape key)
- `useSubscribe` - Subreddit subscription management

### 5. Pure Utilities

**Location:** `lib/utils/`

```typescript
// ✅ CORRECT - Pure functions only
export function getInitialVoteState(
  likes: boolean | null | undefined
): 1 | 0 | -1 {
  if (likes === true) return 1
  if (likes === false) return -1
  return 0
}
```

**Rules:**

- Pure functions only (no side effects)
- 100% test coverage required
- Descriptive names
- No duplicate logic across codebase

**Available utilities:**

- `lib/utils/constants.ts` - All constants (no magic numbers/strings)
- `lib/utils/reddit-helpers.ts` - Reddit-specific helpers
- `lib/utils/formatters.ts` - Formatting (time, numbers, HTML)
- `lib/utils/media-helpers.ts` - Media extraction
- `lib/utils/env.ts` - Environment variable access
- `lib/utils/logger.ts` - Structured logging

### 6. Type System

**Two-tier types:**

1. **API types** (auto-generated) - `/lib/types/reddit-api.ts`
2. **App types** (manual) - `/lib/types/reddit.ts`

```typescript
// lib/types/reddit-api.ts - Generated (DO NOT EDIT)
export type ApiSubredditPostsResponse =
  components['schemas']['GetSubredditPostsResponse']

// lib/types/reddit.ts - Simplified for components
export interface RedditPost {
  id: string
  title: string
  author: string
  score: number
  // ... only fields actually used
}

// Server actions transform at boundary
const data: ApiSubredditPostsResponse = await response.json()
const posts = data.data?.children?.map((c) => c.data) as RedditPost[]
return {posts}
```

**Rules:**

- Never edit `reddit-api.ts` (regenerate with `npm run typegen`)
- Use simplified types in components
- Transform API → App types in server actions
- Always use `Readonly<>` for props

---

## Critical Conventions

### Next.js 16 Patterns

**Async params (required):**

```typescript
interface PageProps {
  params: Promise<{subreddit: string}>
}

export default async function Page({params}: PageProps) {
  const {subreddit} = await params // Must await
}
```

**Error boundaries via error.tsx:**

```typescript
// app/(main)/error.tsx
'use client'

export default function Error({error, reset}: {
  error: Error & {digest?: string}
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Route error', error, {digest: error.digest})
  }, [error])

  return <ErrorDisplay onReset={reset} />
}
```

**Loading states via loading.tsx:**

```typescript
// app/(main)/loading.tsx
export default function Loading() {
  return <TabsSkeleton />
}
```

**Benefits:**

- Automatic Suspense boundary wrapping by Next.js
- Automatic error boundary wrapping by Next.js
- Cleaner page components (no manual wrapping)
- Reset functionality via `reset()` callback
- Scoped to specific route segments

### Race Condition Prevention

**CRITICAL:** Always check `isPending` before async operations.

```typescript
const handleVote = (direction: 1 | -1) => {
  if (isPending) return // CRITICAL: Prevents double-clicks

  startTransition(async () => {
    await votePost(itemName, direction)
  })
}

return <Button disabled={isPending} onClick={handleVote} />
```

### Arctic OAuth Token Methods

**CRITICAL**: Tokens are methods, not properties. See [Reddit API Patterns](../instructions/reddit-api.instructions.md) for details.

```typescript
// ✅ CORRECT - Method call
const token = tokens.accessToken()
const refresh = tokens.refreshToken()
```

### HTML Sanitization (Security)

**ALWAYS sanitize user-generated HTML:**

```typescript
import {decodeHtmlEntities, sanitizeText} from '@/lib/utils/formatters'

// ✅ CORRECT
<div
  dangerouslySetInnerHTML={{
    __html: sanitizeText(decodeHtmlEntities(post.selftext_html))
  }}
/>

// ❌ WRONG - XSS vulnerability
<div dangerouslySetInnerHTML={{__html: post.selftext_html}} />
```

### Mantine UI Integration

**Next.js Link must be wrapped with Mantine Anchor:**

```typescript
import {Anchor} from '@mantine/core'
import Link from 'next/link'

// ✅ CORRECT
<Anchor component={Link} href="/path" c="blue" fw={500}>
  Link text
</Anchor>

// ❌ WRONG - Plain Link
<Link href="/path">Link text</Link>
```

**Use Mantine style props, not inline styles:**

```typescript
// ✅ CORRECT - Mantine props
<Text size="sm" c="dimmed" fw={500} mt="md">Content</Text>

// ❌ WRONG - Inline styles
<div style={{color: 'red', marginTop: '10px'}}>Content</div>
```

### React 19 Compiler (Automatic Optimization)

**React 19's compiler automatically handles memoization** - no need for manual `memo()`, `useCallback()`, or `useMemo()`.

```typescript
// ✅ CORRECT - No memo needed, React Compiler optimizes automatically
export function PostCard({post}: Readonly<PostCardProps>) {
  // React Compiler automatically memoizes this component
  return <div>{post.title}</div>
}

// ❌ WRONG - Don't use manual memoization
import {memo} from 'react'
export const PostCard = memo(({post}) => {...}) // Redundant!
```

**Key Points:**

- **Never use `memo()`** - React Compiler handles component memoization
- **Never use `useCallback()`** - React Compiler handles function memoization
- **Never use `useMemo()`** - React Compiler handles value memoization
- Learn more: [React Compiler Documentation](https://react.dev/learn/react-compiler)

**What React Compiler does:**

- Automatically memoizes components based on props changes
- Optimizes re-renders without manual intervention
- Eliminates need for performance hooks

---

## Design Principles

### 1. Server-First Architecture

Server Components by default, Client Components opt-in.

**Benefits:**

- Smaller JavaScript bundles
- Better SEO
- Faster initial page loads
- Direct backend access

### 2. Progressive Enhancement

Core functionality works without JavaScript.

```typescript
// Base: Server-rendered (works without JS)
export default async function SubredditPage() {
  const {posts} = await fetchPosts('popular')
  return posts.map((post) => <PostCard post={post} />)
}

// Enhanced: Infinite scroll (requires JS)
'use client'
export function PostListWithTabs({posts: initialPosts}) {
  const {posts} = useInfiniteScroll({initialPosts})
  // Falls back to initial posts if JS disabled
}
```

### 3. Optimistic UI Updates

Update UI immediately, rollback on failure.

**Applied to:** Voting, saving posts, subscribing

### 4. Single Source of Truth

| Concern          | Location                      |
| ---------------- | ----------------------------- |
| Reddit API calls | `lib/actions/reddit.ts`       |
| Authentication   | `lib/auth/session.ts`         |
| Types            | `lib/types/`                  |
| Constants        | `lib/utils/constants.ts`      |
| Helpers          | `lib/utils/reddit-helpers.ts` |
| Environment Vars | `lib/utils/env.ts`            |
| Logging          | `lib/utils/logger.ts`         |

### 5. Defensive Error Handling

Every external interaction has specific error handling.

```typescript
if (!response.ok) {
  if (response.status === 401) throw new Error('Authentication expired')
  if (response.status === 404) throw new Error('Subreddit not found')
  if (response.status === 429) throw new Error('Rate limit exceeded')
  throw new Error(`Reddit API error: ${response.statusText}`)
}
```

---

## Security Standards

### 1. Server-Side Only Environment Variables

**NO `NEXT_PUBLIC_` prefix** - All env vars are server-only.

```typescript
// ❌ WRONG - Client-exposed
NEXT_PUBLIC_REDDIT_CLIENT_ID = xxx

// ✅ CORRECT - Server-only
REDDIT_CLIENT_ID = xxx
```

Access via utility only:

```typescript
import {getEnvVar} from '@/lib/utils/env'
const clientId = getEnvVar('REDDIT_CLIENT_ID')
```

### 2. HTML Sanitization

Always use `sanitize-html` via `sanitizeText()` before rendering user HTML.

### 3. OAuth Security

- CSRF protection via state parameter
- Redirect URI validation
- Encrypted HTTP-only session cookies

```typescript
const sessionOptions: SessionOptions = {
  password: getEnvVar('SESSION_SECRET'),
  cookieName: 'reddit_viewer_session',
  cookieOptions: {
    secure: isProduction(),
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  }
}
```

---

## Performance Optimizations

### 1. Next.js Fetch Deduplication and Caching

```typescript
export async function fetchPosts(...) {
  const response = await fetch(url, {
    next: {revalidate: FIVE_MINUTES}
  })
  // Next.js automatically deduplicates identical GET requests in same render pass
  // AND caches responses across requests based on revalidate time
}
```

### 2. Next.js Route Cache

```typescript
const response = await fetch(url, {
  next: {revalidate: FIVE_MINUTES} // Explicit cache time
})
```

### 3. IntersectionObserver

Use IntersectionObserver, not scroll event listeners.

```typescript
const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    loadMore()
  }
})
```

### 4. React 19 Compiler Optimization

React 19's compiler automatically optimizes components - no manual memoization needed. See [React Compiler Documentation](https://react.dev/learn/react-compiler) for details.

---

## Testing Standards

**Coverage requirements:**

- Utilities: 100%
- Hooks: 100%
- Components: 80%+

**Key patterns:**

- Mock server actions with `vi.mock()` (avoid env var errors)
- Use MSW for ALL HTTP mocking (never mock `global.fetch`)
- Place `vi.mock()` before imports for load-time dependencies
- Test optimistic updates + rollbacks
- Test race conditions (`if (isPending) return`)
- Colocate tests (`.test.ts` next to source)

See [GitHub Copilot Instructions](../copilot-instructions.md) for testing patterns.

---

## Common Mistakes

### Common Mistakes

**❌ Wrong:**

- Missing `'use client'` with hooks
- Direct fetch in components/hooks (use server actions)
- Not checking `if (isPending) return`
- Not awaiting `params` (Next.js 16)
- Missing `Readonly<>` on props
- Manual `<ErrorBoundary>` in pages (use `error.tsx`)
- Manual `<Suspense>` in pages (use `loading.tsx`)
- Using `NEXT_PUBLIC_` env prefix
- Not sanitizing HTML with `sanitizeText()`
- Plain Next.js `<Link>` (wrap with Mantine `<Anchor>`)
- Magic numbers (use constants like `FIVE_MINUTES`)
- Arctic token property access (use methods: `.accessToken()`)
- Using `memo()`, `useCallback()`, or `useMemo()` (React Compiler handles this)

**✅ Correct:**

- Add `'use client'` only when needed
- Call server actions from hooks/components
- Always check `isPending` before async operations
- `const {id} = await params` in Next.js 16
- Use `Readonly<ComponentProps>`
- Use `error.tsx` and `loading.tsx` for boundaries
- Server-only env vars (no `NEXT_PUBLIC_`)
- Sanitize: `sanitizeText(userHtml)`
- Wrap: `<Anchor component={Link}>`
- Use constants from `lib/utils/constants.ts`
- Arctic methods: `tokens.accessToken()`

---

## Quick Reference Checklist

### Before Starting Work

- [ ] Understand if you need Server or Client Component
- [ ] Review related instruction files

### During Development

- [ ] Server Components by default (no `'use client'` unless needed)
- [ ] All Reddit API calls in `lib/actions/reddit.ts`
- [ ] Server Actions use Next.js fetch with `next: {revalidate}` for caching
- [ ] No ENV var access or functions in Client Components
- [ ] Specific error messages by HTTP status
- [ ] Check `if (isPending) return` in async handlers
- [ ] Use `error.tsx` for route-level error boundaries (not manual `<ErrorBoundary>`)
- [ ] Use `loading.tsx` for route-level loading states (not manual `<Suspense>`)
- [ ] Use `Readonly<>` on props
- [ ] Await params in Next.js 16 pages
- [ ] Use constants from `lib/utils/constants.ts`
- [ ] Wrap Next.js Link with Mantine Anchor
- [ ] Use Arctic token methods: `tokens.accessToken()`

### Before Completion

- [ ] Run `npm run validate` (format + typecheck + lint)
- [ ] Run `npm test:coverage` (verify coverage)
- [ ] Test authenticated state
- [ ] Test unauthenticated state
- [ ] Check browser console (no errors/warnings)
- [ ] Verify mobile responsiveness
- [ ] Test keyboard navigation

---

## Additional Resources

- [Reddit API Patterns](./reddit-api.instructions.md) - API interaction patterns
- [Mantine UI](https://mantine.dev/llms-full.txt) - UI library documentation
- [Code Review Checklist](./code-review.instructions.md) - Pre-merge validation
