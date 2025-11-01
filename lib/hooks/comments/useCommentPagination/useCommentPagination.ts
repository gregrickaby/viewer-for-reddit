import {useMemo} from 'react'

/**
 * Parameters for useCommentPagination hook.
 */
interface UseCommentPaginationParams {
  /** Enable nested comment structure */
  enableNestedComments: boolean
  /** Flat infinite query - fetch next page function */
  fetchNextPage?: () => void
  /** Flat infinite query - has more pages */
  hasNextPage?: boolean
  /** Flat infinite query - is fetching next page */
  isFetchingNextPage?: boolean
  /** Raw infinite query - fetch next page function */
  fetchNextPageRaw?: () => void
  /** Raw infinite query - has more pages */
  hasNextPageRaw?: boolean
  /** Raw infinite query - is fetching next page */
  isFetchingNextPageRaw?: boolean
}

/**
 * Return type for useCommentPagination hook.
 */
interface UseCommentPaginationReturn {
  /** Current fetch next page function based on mode */
  currentFetchNextPage?: () => void
  /** Current has next page based on mode */
  currentHasNextPage?: boolean
  /** Current is fetching next page based on mode */
  currentIsFetchingNextPage?: boolean
}

/**
 * Manages pagination controls for comment data.
 *
 * Determines which pagination functions to use based on current mode
 * (flat vs nested). Provides unified interface for pagination controls.
 *
 * Features:
 * - Mode-based pagination selection
 * - Unified pagination interface
 * - Memoized for performance
 */
export function useCommentPagination(
  params: UseCommentPaginationParams
): UseCommentPaginationReturn {
  const {
    enableNestedComments,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPageRaw,
    hasNextPageRaw,
    isFetchingNextPageRaw
  } = params

  // Select pagination controls based on mode
  const currentFetchNextPage = useMemo(
    () => (enableNestedComments ? fetchNextPageRaw : fetchNextPage),
    [enableNestedComments, fetchNextPageRaw, fetchNextPage]
  )

  const currentHasNextPage = useMemo(
    () => (enableNestedComments ? hasNextPageRaw : hasNextPage),
    [enableNestedComments, hasNextPageRaw, hasNextPage]
  )

  const currentIsFetchingNextPage = useMemo(
    () => (enableNestedComments ? isFetchingNextPageRaw : isFetchingNextPage),
    [enableNestedComments, isFetchingNextPageRaw, isFetchingNextPage]
  )

  return {
    currentFetchNextPage,
    currentHasNextPage,
    currentIsFetchingNextPage
  }
}
