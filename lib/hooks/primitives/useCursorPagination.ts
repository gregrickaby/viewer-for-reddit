'use client'

import {logger} from '@/lib/datadog/client'
import {getErrorMessage} from '@/lib/utils/errors'
import {useEffect, useState, type RefObject} from 'react'
import {useLoadMoreOnIntersect} from '../useLoadMoreOnIntersect'

interface UseCursorPaginationOptions<T> {
  /** Initial items to display (from Server Component). */
  initialItems: T[]
  /** Initial pagination cursor from Reddit API. */
  initialAfter?: string | null
  /** Extracts a stable id from an item, used to dedupe items across pages. */
  getId: (item: T) => string
  /** Fetches the next page for the given cursor. */
  fetchPage: (after: string) => Promise<{items: T[]; after: string | null}>
  /** Logging context for the calling hook. */
  context: string
  /** Extra fields merged into the failure log entry. */
  logFields?: Record<string, unknown>
}

interface UseCursorPaginationReturn<T> {
  /** Combined array of all loaded items. */
  items: T[]
  /** Whether currently loading more items. */
  loading: boolean
  /** Whether more items are available. */
  hasMore: boolean
  /** Error message if the last load failed. */
  error: string | null
  /** Ref to attach to the sentinel element at the bottom of the list. */
  sentinelRef: RefObject<HTMLDivElement | null>
  /** Remove an item from the list (e.g. after an unsave action). */
  removeItem: (id: string) => void
}

/**
 * Primitive for cursor-paginated infinite scroll.
 *
 * Owns the items/cursor/loading/hasMore/error state, ID-based dedup across
 * pages, and resets when the initial data changes (e.g. switching tabs).
 * Triggering is delegated to {@link useLoadMoreOnIntersect}.
 *
 * @param options - Configuration for cursor pagination.
 * @returns Items array, loading/error state, sentinel ref, and removeItem.
 */
export function useCursorPagination<T>({
  initialItems,
  initialAfter,
  getId,
  fetchPage,
  context,
  logFields
}: UseCursorPaginationOptions<T>): UseCursorPaginationReturn<T> {
  const [items, setItems] = useState<T[]>(initialItems)
  const [after, setAfter] = useState<string | null>(initialAfter || null)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(!!initialAfter)
  const [error, setError] = useState<string | null>(null)

  // Reset items when initial data changes (e.g., tab change)
  useEffect(() => {
    setItems(initialItems)
    setAfter(initialAfter || null)
    setHasMore(!!initialAfter)
  }, [initialItems, initialAfter])

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => getId(item) !== id))
  }

  const loadMore = async () => {
    if (loading || !after || !hasMore) return

    setLoading(true)
    setError(null)

    try {
      const result = await fetchPage(after)

      if (result.items.length > 0) {
        setItems((prev) => {
          const existingIds = new Set(prev.map(getId))
          const newItems = result.items.filter(
            (item) => !existingIds.has(getId(item))
          )
          return [...prev, ...newItems]
        })
        setAfter(result.after)
        setHasMore(!!result.after)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      logger.error('Failed to load more items', {
        error: getErrorMessage(err),
        context,
        ...logFields
      })
      setError(getErrorMessage(err))
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

  return {items, loading, hasMore, error, sentinelRef, removeItem}
}
