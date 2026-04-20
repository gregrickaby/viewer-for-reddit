'use client'

import {fetchPosts, fetchUserPosts} from '@/lib/actions/reddit/posts'
import {logger} from '@/lib/axiom/client'
import {RedditPost, SortOption, TimeFilter} from '@/lib/types/reddit'
import {useEffect, useState, type RefObject} from 'react'
import {useLoadMoreOnIntersect} from './useLoadMoreOnIntersect'

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
 * Features:
 * - IntersectionObserver-based triggering (no scroll event listeners)
 * - Automatic cleanup on unmount
 * - Resets state when initial data changes (e.g., tab changes)
 * - Error handling with logging
 * - Supports both subreddit and user profile posts
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
  const [posts, setPosts] = useState<RedditPost[]>(initialPosts)
  const [after, setAfter] = useState<string | null>(initialAfter || null)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(!!initialAfter)

  // Reset posts when initialPosts changes (e.g., tab change)
  useEffect(() => {
    setPosts(initialPosts)
    setAfter(initialAfter || null)
    setHasMore(!!initialAfter)
  }, [initialPosts, initialAfter])

  const loadMore = async () => {
    if (loading || !after || !hasMore) return

    setLoading(true)

    try {
      const result = username
        ? await fetchUserPosts(username, sort, after, timeFilter)
        : await fetchPosts(subreddit, sort, after, timeFilter)

      if (result.posts && result.posts.length > 0) {
        setPosts((prev) => [...prev, ...result.posts])
        setAfter(result.after)
        setHasMore(!!result.after)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      logger.error('Failed to load more posts', {
        error: error instanceof Error ? error.message : String(error),
        context: 'useInfiniteScroll',
        subreddit,
        username,
        sort,
        timeFilter
      })
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  const sentinelRef = useLoadMoreOnIntersect({
    hasMore,
    isPending: loading,
    loadMore
  })

  return {
    posts,
    loading,
    hasMore,
    sentinelRef
  }
}
