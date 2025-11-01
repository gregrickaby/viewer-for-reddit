import {
  useGetPostCommentsPagesInfiniteQuery,
  useGetPostCommentsPagesRawInfiniteQuery,
  useLazyGetPostCommentsQuery,
  useLazyGetPostCommentsRawQuery
} from '@/lib/store/services/commentsApi'

/**
 * Parameters for useCommentFetching hook.
 */
interface UseCommentFetchingParams {
  /** Post permalink to fetch comments for */
  permalink: string
  /** Whether comments should be fetched */
  shouldFetch: boolean
  /** Enable infinite scrolling */
  enableInfiniteLoading: boolean
  /** Enable nested comment structure */
  enableNestedComments: boolean
}

/**
 * Return type for useCommentFetching hook.
 */
interface UseCommentFetchingReturn {
  /** Fetched flat comments (lazy) */
  fetchedComments: any
  /** Fetched raw comments (lazy, nested) */
  fetchedCommentsRaw: any
  /** Infinite query data (flat) */
  infiniteData: any
  /** Infinite query data (raw, nested) */
  infiniteDataRaw: any
  /** Lazy fetch function for flat comments */
  fetchComments: (permalink: string) => void
  /** Lazy fetch function for raw comments */
  fetchCommentsRaw: (permalink: string) => void
  /** Loading states */
  loading: {
    isLoading: boolean
    isLoadingRaw: boolean
    isInfiniteLoading: boolean
    isInfiniteLoadingRaw: boolean
  }
  /** Error states */
  errors: {
    error: unknown
    errorRaw: unknown
    infiniteError: unknown
    infiniteErrorRaw: unknown
    isError: boolean
    isErrorRaw: boolean
    isInfiniteError: boolean
    isInfiniteErrorRaw: boolean
  }
  /** Pagination controls */
  pagination: {
    fetchNextPage: () => void
    fetchNextPageRaw: () => void
    hasNextPage: boolean
    hasNextPageRaw: boolean
    isFetchingNextPage: boolean
    isFetchingNextPageRaw: boolean
  }
}

/**
 * Hook for fetching comments with support for multiple modes.
 *
 * Fetching Modes:
 * - Flat + Lazy: `useLazyGetPostCommentsQuery`
 * - Flat + Infinite: `useGetPostCommentsPagesInfiniteQuery`
 * - Nested + Lazy: `useLazyGetPostCommentsRawQuery`
 * - Nested + Infinite: `useGetPostCommentsPagesRawInfiniteQuery`
 *
 * @param params - Fetching parameters
 * @returns Fetching results with data, loading states, errors, and pagination controls
 *
 * @example
 * ```ts
 * const {fetchedComments, loading, errors} = useCommentFetching({
 *   permalink: '/r/test/comments/abc123',
 *   shouldFetch: true,
 *   enableInfiniteLoading: false,
 *   enableNestedComments: false
 * })
 * ```
 */
export function useCommentFetching({
  permalink,
  shouldFetch,
  enableInfiniteLoading,
  enableNestedComments
}: UseCommentFetchingParams): UseCommentFetchingReturn {
  // Lazy queries for flat comments
  const [fetchComments, {data: fetchedComments, isLoading, error, isError}] =
    useLazyGetPostCommentsQuery()

  // Lazy queries for raw comments (nested)
  const [
    fetchCommentsRaw,
    {
      data: fetchedCommentsRaw,
      isLoading: isLoadingRaw,
      error: errorRaw,
      isError: isErrorRaw
    }
  ] = useLazyGetPostCommentsRawQuery()

  // Infinite query for flat comments
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isInfiniteLoading,
    error: infiniteError,
    isError: isInfiniteError
  } = useGetPostCommentsPagesInfiniteQuery(permalink, {
    skip: !enableInfiniteLoading || !shouldFetch || enableNestedComments
  })

  // Infinite query for raw comments (nested)
  const {
    data: infiniteDataRaw,
    fetchNextPage: fetchNextPageRaw,
    hasNextPage: hasNextPageRaw,
    isFetchingNextPage: isFetchingNextPageRaw,
    isLoading: isInfiniteLoadingRaw,
    error: infiniteErrorRaw,
    isError: isInfiniteErrorRaw
  } = useGetPostCommentsPagesRawInfiniteQuery(permalink, {
    skip: !enableInfiniteLoading || !shouldFetch || !enableNestedComments
  })

  return {
    fetchedComments,
    fetchedCommentsRaw,
    infiniteData,
    infiniteDataRaw,
    fetchComments,
    fetchCommentsRaw,
    loading: {
      isLoading,
      isLoadingRaw,
      isInfiniteLoading,
      isInfiniteLoadingRaw
    },
    errors: {
      error,
      errorRaw,
      infiniteError,
      infiniteErrorRaw,
      isError,
      isErrorRaw,
      isInfiniteError,
      isInfiniteErrorRaw
    },
    pagination: {
      fetchNextPage,
      fetchNextPageRaw,
      hasNextPage: hasNextPage ?? false,
      hasNextPageRaw: hasNextPageRaw ?? false,
      isFetchingNextPage,
      isFetchingNextPageRaw
    }
  }
}
