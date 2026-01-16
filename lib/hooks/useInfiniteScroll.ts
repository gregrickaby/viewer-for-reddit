'use client'

import {fetchPosts} from '@/lib/actions/reddit'
import {RedditPost, SortOption} from '@/lib/types/reddit'
import {logger} from '@/lib/utils/logger'
import {useCallback, useEffect, useRef, useState} from 'react'

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
  /** Sort order for posts */
  sort?: SortOption
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
  /** Ref callback for sentinel element (attach to div at bottom of list) */
  sentinelRef: (node: HTMLDivElement | null) => void
}

/**
 * Hook for implementing infinite scroll with IntersectionObserver.
 * Automatically loads more posts when user scrolls near the bottom.
 * Uses Server Actions for data fetching (maintains SSR benefits).
 *
 * Features:
 * - IntersectionObserver-based triggering (no scroll event listeners)
 * - Automatic cleanup on unmount
 * - Resets state when initial data changes (e.g., tab changes)
 * - Error handling with logging
 *
 * @param options - Configuration for infinite scroll
 * @returns Posts array, loading state, and sentinel ref
 *
 * @example
 * ```typescript
 * const {posts, loading, hasMore, sentinelRef} = useInfiniteScroll({
 *   initialPosts: serverPosts,
 *   initialAfter: 't3_abc123',
 *   subreddit: 'popular',
 *   sort: 'hot'
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
  sort = 'hot'
}: Readonly<UseInfiniteScrollOptions>): UseInfiniteScrollReturn {
  const [posts, setPosts] = useState<RedditPost[]>(initialPosts)
  const [after, setAfter] = useState<string | null>(initialAfter || null)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(!!initialAfter)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Reset posts when initialPosts changes (e.g., tab change)
  useEffect(() => {
    setPosts(initialPosts)
    setAfter(initialAfter || null)
    setHasMore(!!initialAfter)
  }, [initialPosts, initialAfter])

  const loadMore = useCallback(async () => {
    if (loading || !after || !hasMore) return

    setLoading(true)

    try {
      // Call Server Action for server-side data fetching
      const result = await fetchPosts(subreddit, sort, after)

      if (result.posts && result.posts.length > 0) {
        setPosts((prev) => [...prev, ...result.posts])
        setAfter(result.after)
        setHasMore(!!result.after)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      logger.error('Failed to load more posts', error, {
        context: 'useInfiniteScroll',
        subreddit,
        sort
      })
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [loading, after, hasMore, subreddit, sort])

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return

      if (observerRef.current) {
        observerRef.current.disconnect()
      }

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      })

      if (node) {
        observerRef.current.observe(node)
      }
    },
    [loading, hasMore, loadMore]
  )

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return {
    posts,
    loading,
    hasMore,
    sentinelRef
  }
}
