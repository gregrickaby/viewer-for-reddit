'use client'

import {useEffect, useRef, type RefObject} from 'react'

/**
 * Options for the useLoadMoreOnIntersect hook.
 */
export interface UseLoadMoreOnIntersectOptions {
  /** Whether more items are available to load. */
  hasMore: boolean
  /** Whether a load is currently in progress. */
  isPending: boolean
  /** Callback to invoke when the sentinel element intersects the viewport. */
  loadMore: () => void
  /** IntersectionObserver threshold. Defaults to 0.1. */
  threshold?: number
}

/**
 * Encapsulates the IntersectionObserver lifecycle for infinite-scroll patterns.
 *
 * Calls `loadMore` when the sentinel element enters the viewport, provided
 * `hasMore` is true and `isPending` is false. Cleans up the observer on
 * unmount and re-subscribes when `hasMore` or `threshold` changes.
 *
 * @param options - Hook configuration.
 * @returns Ref to attach to the sentinel `<div>` at the bottom of the list.
 *
 * @example
 * ```typescript
 * const sentinelRef = useLoadMoreOnIntersect({hasMore, isPending: loading, loadMore})
 * return hasMore ? <div ref={sentinelRef} /> : null
 * ```
 */
export function useLoadMoreOnIntersect({
  hasMore,
  isPending,
  loadMore,
  threshold = 0.1
}: Readonly<UseLoadMoreOnIntersectOptions>): RefObject<HTMLDivElement | null> {
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Keep refs current on every render so the observer callback always reads
  // the latest values without needing them as effect dependencies.
  const hasMoreRef = useRef(hasMore)
  const isPendingRef = useRef(isPending)
  const loadMoreRef = useRef(loadMore)
  hasMoreRef.current = hasMore
  isPendingRef.current = isPending
  loadMoreRef.current = loadMore

  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreRef.current &&
          !isPendingRef.current
        ) {
          loadMoreRef.current()
        }
      },
      {threshold}
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, threshold])

  return sentinelRef
}
