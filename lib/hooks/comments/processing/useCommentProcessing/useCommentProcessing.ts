import type {AutoCommentData} from '@/lib/store/services/commentsApi'
import type {NestedCommentData} from '@/lib/utils/formatting/comments/commentFilters'
import {
  processInfiniteComments,
  processNestedComments
} from '@/lib/utils/formatting/comments/commentHelpers'

/**
 * Parameters for useCommentProcessing hook.
 */
interface UseCommentProcessingParams {
  /** Enable nested comment structure */
  enableNestedComments: boolean
  /** Provided comments (SSR or parent component) */
  providedComments?: AutoCommentData[]
  /** Infinite query data (flat) */
  infiniteData: any
  /** Infinite query data (raw, nested) */
  infiniteDataRaw: any
  /** Fetched flat comments */
  fetchedComments?: AutoCommentData[]
  /** Fetched raw comments */
  fetchedCommentsRaw: any
  /** Maximum comment depth for nesting */
  maxCommentDepth: number
}

/**
 * Return type for useCommentProcessing hook.
 */
interface UseCommentProcessingReturn {
  /** Processed flat comments */
  infiniteComments: AutoCommentData[]
  /** Processed nested comments */
  nestedComments: NestedCommentData[]
  /** Comments to display (flat or nested based on mode) */
  displayComments: AutoCommentData[] | NestedCommentData[]
  /** Whether there are comments to show */
  hasCommentsToShow: boolean
}

/**
 * Hook for processing and transforming comment data.
 *
 * Processing Steps:
 * - Combines infinite query pages into single array
 * - Maps raw comments to nested structure with depth tracking
 * - Determines which comments to display based on mode
 *
 * @param params - Processing parameters
 * @returns Processed comments ready for display
 *
 * @example
 * ```ts
 * const {displayComments, hasCommentsToShow} = useCommentProcessing({
 *   enableNestedComments: true,
 *   infiniteDataRaw,
 *   maxCommentDepth: 10
 * })
 * ```
 */
export function useCommentProcessing({
  enableNestedComments,
  providedComments,
  infiniteData,
  infiniteDataRaw,
  fetchedComments,
  fetchedCommentsRaw,
  maxCommentDepth
}: UseCommentProcessingParams): UseCommentProcessingReturn {
  // Combine all pages of infinite comments into a single array (flat)
  const infiniteComments = processInfiniteComments(infiniteData)

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
        replies: undefined
      }
    }

    // Performance: Limit recursion depth to prevent stack overflow
    if (depth >= maxCommentDepth) {
      console.warn(
        `Comment nesting exceeded maximum depth of ${maxCommentDepth}`
      )
      return {
        ...comment,
        depth: comment.depth ?? depth,
        replies: undefined
      }
    }

    return {
      ...comment,
      depth: comment.depth ?? depth,
      replies: comment.replies?.map(
        (reply: AutoCommentData & {replies?: any[]; depth?: number}) =>
          mapToNested(reply, (comment.depth ?? depth) + 1)
      )
    }
  }

  // Process nested comments when enabled
  const nestedComments = processNestedComments(
    enableNestedComments,
    providedComments,
    infiniteDataRaw,
    fetchedCommentsRaw,
    mapToNested
  )

  // Determine which comments to display
  const displayComments = (() => {
    if (enableNestedComments) {
      return nestedComments
    }

    if (infiniteComments.length > 0) {
      return infiniteComments
    }

    if (fetchedComments && fetchedComments.length > 0) {
      return fetchedComments
    }

    return providedComments ?? []
  })()

  // Determine if there are comments to show
  const hasCommentsToShow = enableNestedComments
    ? nestedComments.length > 0
    : displayComments.length > 0

  return {
    infiniteComments,
    nestedComments,
    displayComments,
    hasCommentsToShow
  }
}
