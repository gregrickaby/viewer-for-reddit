import type {
  AutoCommentData,
  AutoCommentWithText
} from '@/lib/store/services/commentsApi'
import {extractAndFilterComments} from '@/lib/utils/formatting/comments/commentFilters'
import {extractNestedComments, type NestedCommentData} from './commentNester'

// Re-export for backward compatibility
export type {NestedCommentData} from './commentNester'
export {sortComments} from './commentSorter'

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
