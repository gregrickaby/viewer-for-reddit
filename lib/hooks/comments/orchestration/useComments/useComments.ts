import {useCommentFetching} from '@/lib/hooks/comments/fetching/useCommentFetching/useCommentFetching'
import {useCommentPagination} from '@/lib/hooks/comments/fetching/useCommentPagination/useCommentPagination'
import {useCommentProcessing} from '@/lib/hooks/comments/processing/useCommentProcessing/useCommentProcessing'
import type {AutoCommentData} from '@/lib/store/services/commentsApi'
import type {NestedCommentData} from '@/lib/utils/formatting/comments/commentFilters'
import {useEffect} from 'react'

/**
 * Parameters for useComments hook.
 */
export interface UseCommentsParams {
  /** Post permalink for comment fetching */
  permalink: string
  /** Whether comments should be fetched (lazy loading trigger) */
  open: boolean
  /** Provided comments (SSR or parent component) */
  comments?: AutoCommentData[]
  /** Enable infinite scroll pagination */
  enableInfiniteLoading?: boolean
  /** Enable nested comment structure */
  enableNestedComments?: boolean
  /** Maximum comment depth for nesting */
  maxCommentDepth?: number
}

/**
 * Return type for useComments hook.
 */
export interface UseCommentsReturn {
  /** Comments to display (flat or nested based on mode) */
  displayComments: AutoCommentData[] | NestedCommentData[]
  /** Processed nested comments */
  nestedComments: NestedCommentData[]
  /** Show loading indicator */
  showLoading: boolean
  /** Has comments to show */
  hasCommentsToShow: boolean
  /** Fetch next page function (based on current mode) */
  currentFetchNextPage: () => void
  /** Has next page (based on current mode) */
  currentHasNextPage: boolean
  /** Is fetching next page (based on current mode) */
  currentIsFetchingNextPage: boolean
  /** Nested comments enabled */
  enableNestedComments: boolean
  /** Infinite loading enabled */
  enableInfiniteLoading: boolean
  /** Is error state */
  isError: boolean
  /** Error object */
  error: unknown
}

/**
 * Orchestrates comment data fetching, processing, and pagination.
 *
 * Composes three focused hooks:
 * - useCommentFetching: Data fetching with 4 RTK Query hooks
 * - useCommentProcessing: Data transformation and nesting
 * - useCommentPagination: Pagination control selection
 *
 * Features:
 * - Lazy fetch triggering via useEffect
 * - Aggregate loading states
 * - Aggregate error states
 * - Mode-based pagination
 */
export function useComments({
  permalink,
  open,
  comments: providedComments,
  enableInfiniteLoading = false,
  enableNestedComments = false,
  maxCommentDepth = 10
}: UseCommentsParams): UseCommentsReturn {
  // 1. Fetch comment data (4 RTK Query hooks)
  const fetching = useCommentFetching({
    permalink,
    shouldFetch: enableInfiniteLoading,
    enableInfiniteLoading,
    enableNestedComments
  })

  // 2. Process comment data (transform, nest, filter)
  const processing = useCommentProcessing({
    enableNestedComments,
    providedComments,
    infiniteData: fetching.infiniteData,
    infiniteDataRaw: fetching.infiniteDataRaw,
    fetchedComments: fetching.fetchedComments,
    fetchedCommentsRaw: fetching.fetchedCommentsRaw,
    maxCommentDepth
  })

  // 3. Select pagination controls based on mode
  const pagination = useCommentPagination({
    enableNestedComments,
    fetchNextPage: fetching.pagination.fetchNextPage,
    hasNextPage: fetching.pagination.hasNextPage,
    isFetchingNextPage: fetching.pagination.isFetchingNextPage,
    fetchNextPageRaw: fetching.pagination.fetchNextPageRaw,
    hasNextPageRaw: fetching.pagination.hasNextPageRaw,
    isFetchingNextPageRaw: fetching.pagination.isFetchingNextPageRaw
  })

  // Lazy fetch trigger (when drawer opens)
  useEffect(() => {
    if (!open || enableInfiniteLoading || providedComments) return

    if (enableNestedComments) {
      fetching.fetchCommentsRaw(permalink)
    } else {
      fetching.fetchComments(permalink)
    }
  }, [
    open,
    permalink,
    enableInfiniteLoading,
    enableNestedComments,
    providedComments,
    fetching.fetchComments,
    fetching.fetchCommentsRaw
  ])

  // Aggregate loading states
  const showLoading =
    fetching.loading.isLoading ||
    fetching.loading.isInfiniteLoading ||
    fetching.loading.isLoadingRaw ||
    fetching.loading.isInfiniteLoadingRaw

  // Aggregate error states
  const isError =
    fetching.errors.isError ||
    fetching.errors.isInfiniteError ||
    fetching.errors.isErrorRaw ||
    fetching.errors.isInfiniteErrorRaw

  const error =
    fetching.errors.error ||
    fetching.errors.infiniteError ||
    fetching.errors.errorRaw ||
    fetching.errors.infiniteErrorRaw

  return {
    displayComments: processing.displayComments,
    nestedComments: processing.nestedComments,
    showLoading,
    hasCommentsToShow: processing.hasCommentsToShow,
    currentFetchNextPage: pagination.currentFetchNextPage ?? (() => {}),
    currentHasNextPage: pagination.currentHasNextPage ?? false,
    currentIsFetchingNextPage: pagination.currentIsFetchingNextPage ?? false,
    enableNestedComments,
    enableInfiniteLoading,
    isError,
    error
  }
}
