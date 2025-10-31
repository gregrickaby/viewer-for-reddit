import {
  useGetPostCommentsPagesInfiniteQuery,
  useGetPostCommentsPagesRawInfiniteQuery,
  useLazyGetPostCommentsQuery,
  useLazyGetPostCommentsRawQuery,
  type AutoCommentData
} from '@/lib/store/services/commentsApi'
import type {NestedCommentData} from '@/lib/utils/formatting/commentFilters'
import {
  getDisplayComments,
  getLoadingState,
  getNextPageControls,
  processInfiniteComments,
  processNestedComments
} from '@/lib/utils/formatting/commentHelpers'
import {useEffect, useMemo} from 'react'

interface UseCommentDataParams {
  permalink: string
  open: boolean
  comments?: AutoCommentData[]
  enableInfiniteLoading?: boolean
  enableNestedComments?: boolean
  maxCommentDepth?: number
}

interface UseCommentDataReturn {
  displayComments: AutoCommentData[] | NestedCommentData[]
  nestedComments: NestedCommentData[]
  showLoading: boolean
  hasCommentsToShow: boolean
  currentFetchNextPage: () => void
  currentHasNextPage: boolean
  currentIsFetchingNextPage: boolean
  enableNestedComments: boolean
  enableInfiniteLoading: boolean
  isError: boolean
  error: unknown
}

export function useCommentData({
  permalink,
  open,
  comments: providedComments,
  enableInfiniteLoading = false,
  enableNestedComments = false,
  maxCommentDepth = 4
}: UseCommentDataParams): UseCommentDataReturn {
  // Hooks for flat comments (legacy)
  const [fetchComments, {data: fetchedComments, isLoading, error, isError}] =
    useLazyGetPostCommentsQuery()

  // Hooks for raw comments (nested)
  const [
    fetchCommentsRaw,
    {
      data: fetchedCommentsRaw,
      isLoading: isLoadingRaw,
      error: errorRaw,
      isError: isErrorRaw
    }
  ] = useLazyGetPostCommentsRawQuery()

  // Use infinite query for flat comments
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isInfiniteLoading,
    error: infiniteError,
    isError: isInfiniteError
  } = useGetPostCommentsPagesInfiniteQuery(permalink, {
    skip: !enableInfiniteLoading || !open || enableNestedComments
  })

  // Use infinite query for raw comments (nested)
  const {
    data: infiniteDataRaw,
    fetchNextPage: fetchNextPageRaw,
    hasNextPage: hasNextPageRaw,
    isFetchingNextPage: isFetchingNextPageRaw,
    isLoading: isInfiniteLoadingRaw,
    error: infiniteErrorRaw,
    isError: isInfiniteErrorRaw
  } = useGetPostCommentsPagesRawInfiniteQuery(permalink, {
    skip: !enableInfiniteLoading || !open || !enableNestedComments
  })

  // Combine all pages of infinite comments into a single array (flat)
  const infiniteComments = useMemo(
    () => processInfiniteComments(infiniteData),
    [infiniteData]
  )

  // Optimized recursive function for mapping comments to nested structure
  const mapToNested = (
    comment: AutoCommentData & {replies?: any[]; depth?: number},
    depth = 0
  ): NestedCommentData => {
    const hasReplies =
      Array.isArray(comment.replies) && comment.replies.length > 0

    // Performance: Early return for comments without replies
    if (!hasReplies) {
      return {
        ...comment,
        depth: comment.depth ?? depth,
        hasReplies: false,
        replies: undefined
      }
    }

    // Performance: Limit recursion depth to prevent stack overflow
    // Tie to the component's maxCommentDepth prop for UI consistency
    if (depth >= maxCommentDepth) {
      console.warn(
        `Comment nesting exceeded maximum depth of ${maxCommentDepth}`
      )
      return {
        ...comment,
        depth: comment.depth ?? depth,
        hasReplies: false,
        replies: undefined
      }
    }

    return {
      ...comment,
      depth: comment.depth ?? depth,
      hasReplies,
      replies: comment.replies?.map(
        (reply: AutoCommentData & {replies?: any[]; depth?: number}) =>
          mapToNested(reply, (comment.depth ?? depth) + 1)
      )
    }
  }

  // Process nested comments when enabled
  const nestedComments = useMemo(
    (): NestedCommentData[] =>
      processNestedComments(
        enableNestedComments,
        providedComments,
        infiniteDataRaw,
        fetchedCommentsRaw,
        mapToNested
      ),
    [
      providedComments,
      infiniteDataRaw,
      fetchedCommentsRaw,
      enableNestedComments,
      mapToNested
    ]
  )

  // Determine which comments to show using helper function
  const displayComments = useMemo(
    () =>
      getDisplayComments(
        enableNestedComments,
        nestedComments,
        infiniteComments,
        fetchedComments ?? [],
        providedComments
      ),
    [
      enableNestedComments,
      nestedComments,
      infiniteComments,
      fetchedComments,
      providedComments
    ]
  )

  // Determine loading state using helper function
  const showLoading = getLoadingState(
    enableNestedComments,
    enableInfiniteLoading,
    isInfiniteLoadingRaw,
    isLoadingRaw,
    isInfiniteLoading,
    isLoading
  )

  // Get next page controls using helper function
  const {currentFetchNextPage, currentHasNextPage, currentIsFetchingNextPage} =
    getNextPageControls(
      enableNestedComments,
      fetchNextPageRaw,
      fetchNextPage,
      hasNextPageRaw,
      hasNextPage,
      isFetchingNextPageRaw,
      isFetchingNextPage
    )

  // Handle comment fetching effect
  useEffect(() => {
    if (open && !providedComments && !enableInfiniteLoading) {
      if (enableNestedComments && !fetchedCommentsRaw && !isLoadingRaw) {
        // Fetch raw comments for nested rendering
        void fetchCommentsRaw(permalink)
      } else if (!enableNestedComments && !fetchedComments && !isLoading) {
        // Fetch processed flat comments
        void fetchComments(permalink)
      }
    }
  }, [
    open,
    providedComments,
    enableInfiniteLoading,
    enableNestedComments,
    fetchedComments,
    fetchedCommentsRaw,
    isLoading,
    isLoadingRaw,
    fetchComments,
    fetchCommentsRaw,
    permalink
  ])

  // Determine which comments to render based on nested vs flat mode
  const hasCommentsToShow = enableNestedComments
    ? nestedComments.length > 0
    : displayComments?.length > 0

  // Determine current error state based on mode
  let currentIsError = false
  let currentError: unknown = undefined

  if (enableInfiniteLoading) {
    currentIsError = enableNestedComments ? isInfiniteErrorRaw : isInfiniteError
    currentError = enableNestedComments ? infiniteErrorRaw : infiniteError
  } else {
    currentIsError = enableNestedComments ? isErrorRaw : isError
    currentError = enableNestedComments ? errorRaw : error
  }

  return {
    displayComments,
    nestedComments,
    showLoading,
    hasCommentsToShow,
    currentFetchNextPage,
    currentHasNextPage,
    currentIsFetchingNextPage,
    enableNestedComments,
    enableInfiniteLoading,
    isError: currentIsError,
    error: currentError
  }
}
