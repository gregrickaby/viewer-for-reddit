import {
  extractNestedComments,
  type NestedCommentData
} from '@/lib/domain/comments'
import type {
  AutoCommentData,
  AutoCommentWithText
} from '@/lib/store/services/commentsApi'
import {extractAndFilterComments} from '@/lib/utils/formatting/commentFilters'

// Re-export domain functions for backward compatibility
export {sortComments, type NestedCommentData} from '@/lib/domain/comments'

/**
 * Type guard to validate comment has required display properties
 */
export function hasRequiredCommentFields(
  comment: AutoCommentData
): comment is AutoCommentWithText & {
  id?: string
  permalink?: string
  author?: string
  created_utc?: number
  ups?: number
} {
  return Boolean(
    comment &&
      ('id' in comment || 'permalink' in comment) &&
      'author' in comment &&
      ('body' in comment || 'body_html' in comment)
  )
}

/**
 * Helper function to determine loading state
 */
export function getLoadingState(
  enableNestedComments: boolean,
  enableInfiniteLoading: boolean,
  isInfiniteLoadingRaw: boolean,
  isLoadingRaw: boolean,
  isInfiniteLoading: boolean,
  isLoading: boolean
): boolean {
  if (enableNestedComments) {
    return enableInfiniteLoading ? isInfiniteLoadingRaw : isLoadingRaw
  }
  return enableInfiniteLoading ? isInfiniteLoading : isLoading
}

/**
 * Helper function to get next page controls
 */
export function getNextPageControls(
  enableNestedComments: boolean,
  fetchNextPageRaw: () => void,
  fetchNextPage: () => void,
  hasNextPageRaw: boolean,
  hasNextPage: boolean,
  isFetchingNextPageRaw: boolean,
  isFetchingNextPage: boolean
) {
  return {
    currentFetchNextPage: enableNestedComments
      ? fetchNextPageRaw
      : fetchNextPage,
    currentHasNextPage: enableNestedComments ? hasNextPageRaw : hasNextPage,
    currentIsFetchingNextPage: enableNestedComments
      ? isFetchingNextPageRaw
      : isFetchingNextPage
  }
}

/**
 * Helper function to determine which comments to display based on configuration
 */
export function getDisplayComments(
  enableNestedComments: boolean,
  nestedComments: NestedCommentData[],
  infiniteComments: AutoCommentData[],
  flatComments: AutoCommentData[],
  providedComments?: AutoCommentData[]
): AutoCommentData[] | NestedCommentData[] {
  if (enableNestedComments) {
    return nestedComments
  }

  if (infiniteComments.length > 0) {
    return infiniteComments
  }

  if (flatComments.length > 0) {
    return flatComments
  }

  return providedComments ?? []
}

/**
 * Helper function to process infinite comments data
 */
export function processInfiniteComments(infiniteData: any): AutoCommentData[] {
  if (!infiniteData?.pages?.length) return []

  const allComments: AutoCommentData[] = []

  // Process each page of comments
  for (const page of infiniteData.pages) {
    // Extract comments from the response (Reddit returns [post, comments])
    const commentsListing = Array.isArray(page) ? page[1] : page
    const children = commentsListing?.data?.children ?? []
    const pageComments = extractAndFilterComments(children)
    allComments.push(...pageComments)
  }

  return allComments
}

/**
 * Helper function to process nested comments data
 */
export function processNestedComments(
  enableNestedComments: boolean,
  providedComments: AutoCommentData[] | undefined,
  infiniteDataRaw: any,
  fetchedCommentsRaw: any,
  mapToNested: (comment: any, depth?: number) => NestedCommentData
): NestedCommentData[] {
  if (!enableNestedComments) return []

  // Determine which raw response to use
  if (providedComments) {
    // Recursively preserve any existing hierarchy in providedComments
    return providedComments.map((comment) => mapToNested(comment))
  }

  // Use infinite data if available
  if (infiniteDataRaw?.pages?.length) {
    const allNestedComments: NestedCommentData[] = []

    for (const page of infiniteDataRaw.pages) {
      const commentsListing = Array.isArray(page) ? page[1] : page
      const children = commentsListing?.data?.children ?? []
      const pageNestedComments = extractNestedComments(children)
      allNestedComments.push(...pageNestedComments)
    }

    return allNestedComments
  }

  // Fall back to normal fetch data
  if (fetchedCommentsRaw) {
    const commentsListing = Array.isArray(fetchedCommentsRaw)
      ? fetchedCommentsRaw[1]
      : fetchedCommentsRaw
    const children = commentsListing?.data?.children ?? []
    return extractNestedComments(children)
  }

  return []
}

/**
 * Recursively collect all descendant comment IDs from a comment.
 * Optimized to use in-place mutation for O(n) performance.
 *
 * @param comment - The comment to collect descendants from
 * @param ids - Accumulator array for descendant IDs
 * @returns Array of all descendant comment IDs
 */
export function collectDescendantIds(
  comment: NestedCommentData,
  ids: string[] = []
): string[] {
  if (!comment.replies?.length) return ids

  for (const reply of comment.replies) {
    if (reply.id) {
      ids.push(reply.id)
      collectDescendantIds(reply, ids)
    }
  }

  return ids
}

/**
 * Collect all comment IDs from a list of nested comments.
 * Used for expand/collapse all functionality.
 *
 * @param comments - Array of nested comments
 * @returns Array of all comment IDs
 */
export function collectAllCommentIds(comments: NestedCommentData[]): string[] {
  const ids: string[] = []

  for (const comment of comments) {
    if (comment.id) {
      ids.push(comment.id)
      if (comment.replies?.length) {
        ids.push(...collectAllCommentIds(comment.replies))
      }
    }
  }

  return ids
}
