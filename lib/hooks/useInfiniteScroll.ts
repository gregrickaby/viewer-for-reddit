'use client'

import {fetchPosts, fetchUserPosts} from '@/lib/actions/reddit/posts'
import {RedditPost, SortOption, TimeFilter} from '@/lib/types/reddit'
import type {RefObject} from 'react'
import {useCursorPagination} from './primitives/useCursorPagination'

/**
 * Options for configuring the useInfiniteScroll hook.
 */
interface UseInfiniteScrollOptions {
  /** Initial posts to display (from Server Component) */
  initialPosts: RedditPost[]
  /** Initial pagination cursor from Reddit API */
  initialAfter?: string | null
  /** Subreddit name or multireddit path */
  subreddit?: string
  /** Username (for user profile posts) */
  username?: string
  /** Sort order for posts */
  sort?: SortOption
  /** Time filter for top/controversial sorts */
  timeFilter?: TimeFilter
}

/**
 * Return type for useInfiniteScroll hook.
 */
interface UseInfiniteScrollReturn {
  /** Combined array of all loaded posts */
  posts: RedditPost[]
  /** Whether currently loading more posts */
  loading: boolean
  /** Whether more posts are available */
  hasMore: boolean
  /** Ref to attach to the sentinel element at the bottom of the list */
  sentinelRef: RefObject<HTMLDivElement | null>
}

/**
 * Hook for implementing infinite scroll with IntersectionObserver.
 * Automatically loads more posts when the user scrolls near the bottom.
 * Uses Server Actions for data fetching (maintains SSR benefits).
 *
 * Cursor pagination, dedup, and IntersectionObserver triggering are owned by
 * {@link useCursorPagination}.
 *
 * @param options - Configuration for infinite scroll
 * @returns Posts array, loading state, hasMore flag, and sentinel ref
 *
 * @example
 * ```typescript
 * const {posts, loading, hasMore, sentinelRef} = useInfiniteScroll({
 *   initialPosts: serverPosts,
 *   initialAfter: 't3_abc123',
 *   subreddit: 'popular',
 *   sort: 'top',
 *   timeFilter: 'week'
 * })
 *
 * return (
 *   <>
 *     {posts.map(post => <PostCard key={post.id} post={post} />)}
 *     {hasMore && <div ref={sentinelRef}>{loading && <Loader />}</div>}
 *   </>
 * )
 * ```
 */
export function useInfiniteScroll({
  initialPosts,
  initialAfter,
  subreddit = 'popular',
  username,
  sort = 'hot',
  timeFilter
}: Readonly<UseInfiniteScrollOptions>): UseInfiniteScrollReturn {
  const {items, loading, hasMore, sentinelRef} = useCursorPagination({
    initialItems: initialPosts,
    initialAfter,
    getId: (post) => post.id,
    fetchPage: async (after) => {
      const result = username
        ? await fetchUserPosts(username, sort, after, timeFilter)
        : await fetchPosts(subreddit, sort, after, timeFilter)
      return {items: result.posts, after: result.after}
    },
    context: 'useInfiniteScroll',
    logFields: {subreddit, username, sort, timeFilter}
  })

  return {posts: items, loading, hasMore, sentinelRef}
}
