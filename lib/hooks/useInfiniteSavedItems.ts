'use client'

import {fetchSavedItems} from '@/lib/actions/reddit'
import {SavedItem} from '@/lib/types/reddit'
import {logger} from '@/lib/utils/logger'
import {useEffect, useRef, useState} from 'react'

/**
 * Options for configuring the useInfiniteSavedItems hook.
 */
interface UseInfiniteSavedItemsOptions {
  /** Initial items to display (from Server Component) */
  initialItems: SavedItem[]
  /** Initial pagination cursor from Reddit API */
  initialAfter: string | null
  /** Username whose saved items to fetch */
  username: string
}

/**
 * Return type for useInfiniteSavedItems hook.
 */
interface UseInfiniteSavedItemsReturn {
  /** Combined array of all loaded saved items */
  items: SavedItem[]
  /** Whether currently loading more items */
  loading: boolean
  /** Whether more items are available */
  hasMore: boolean
  /** Error message if loading failed */
  error: string | null
  /** Ref callback for sentinel element (attach to div at bottom of list) */
  sentinelRef: (node: HTMLDivElement | null) => void
  /** Remove an item from the list (for unsave callback) */
  removeItem: (itemId: string) => void
}

/**
 * Hook for implementing infinite scroll for saved items with IntersectionObserver.
 * Automatically loads more saved items when user scrolls near the bottom.
 * Uses Server Actions for data fetching (maintains SSR benefits).
 *
 * Features:
 * - IntersectionObserver-based triggering (no scroll event listeners)
 * - Automatic cleanup on unmount
 * - Error handling with logging
 * - Item removal for unsave operations
 *
 * @param options - Configuration for infinite scroll
 * @returns Items array, loading state, error, sentinel ref, and removeItem function
 *
 * @example
 * ```typescript
 * const {items, loading, hasMore, error, sentinelRef, removeItem} = useInfiniteSavedItems({
 *   initialItems: serverItems,
 *   initialAfter: 't3_abc123',
 *   username: 'johndoe'
 * })
 *
 * return (
 *   <>
 *     {items.map(item => (
 *       item.type === 'post'
 *         ? <PostCard key={item.data.id} post={item.data} onUnsave={() => removeItem(item.data.id)} />
 *         : <Comment key={item.data.id} comment={item.data} onUnsave={() => removeItem(item.data.id)} />
 *     ))}
 *     {hasMore && <div ref={sentinelRef}>{loading && <Loader />}</div>}
 *   </>
 * )
 * ```
 */
export function useInfiniteSavedItems({
  initialItems,
  initialAfter,
  username
}: Readonly<UseInfiniteSavedItemsOptions>): UseInfiniteSavedItemsReturn {
  const [items, setItems] = useState<SavedItem[]>(initialItems)
  const [after, setAfter] = useState<string | null>(initialAfter)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(!!initialAfter)
  const [error, setError] = useState<string | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Use refs to avoid closure issues in IntersectionObserver callback
  const loadingRef = useRef(loading)
  const hasMoreRef = useRef(hasMore)
  const afterRef = useRef(after)

  useEffect(() => {
    loadingRef.current = loading
  }, [loading])

  useEffect(() => {
    hasMoreRef.current = hasMore
  }, [hasMore])

  useEffect(() => {
    afterRef.current = after
  }, [after])

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.data.id !== itemId))
  }

  const loadMore = async () => {
    const currentAfter = afterRef.current
    if (loading || !currentAfter || !hasMore) return

    setLoading(true)
    setError(null)

    try {
      const result = await fetchSavedItems(username, currentAfter)

      if (result.items && result.items.length > 0) {
        setItems((prev) => [...prev, ...result.items])
        setAfter(result.after)
        setHasMore(!!result.after)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      logger.error('Failed to load more saved items', err, {
        context: 'useInfiniteSavedItems',
        username
      })
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load more items'
      setError(errorMessage)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  const sentinelRef = (node: HTMLDivElement | null) => {
    if (loading) return

    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver((entries) => {
      if (
        entries[0].isIntersecting &&
        hasMoreRef.current &&
        !loadingRef.current
      ) {
        loadMore()
      }
    })

    if (node) {
      observerRef.current.observe(node)
    }
  }

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return {
    items,
    loading,
    hasMore,
    error,
    sentinelRef,
    removeItem
  }
}
