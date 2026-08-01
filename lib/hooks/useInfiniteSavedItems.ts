'use client'

import {fetchSavedItems} from '@/lib/actions/reddit/users'
import {SavedItem} from '@/lib/types/reddit'
import type {RefObject} from 'react'
import {useCursorPagination} from './primitives/useCursorPagination'

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
  /** Ref to attach to the sentinel element at the bottom of the list */
  sentinelRef: RefObject<HTMLDivElement | null>
  /** Remove an item from the list (for unsave callback) */
  removeItem: (itemId: string) => void
}

/**
 * Hook for implementing infinite scroll for saved items with IntersectionObserver.
 * Automatically loads more saved items when the user scrolls near the bottom.
 * Uses Server Actions for data fetching (maintains SSR benefits).
 *
 * Cursor pagination, dedup, and IntersectionObserver triggering are owned by
 * {@link useCursorPagination}.
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
  return useCursorPagination({
    initialItems,
    initialAfter,
    getId: (item) => item.data.id,
    fetchPage: (after) => fetchSavedItems(username, after),
    context: 'useInfiniteSavedItems',
    logFields: {username}
  })
}
