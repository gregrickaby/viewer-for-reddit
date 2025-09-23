import type {AutoCommentData} from '@/lib/store/services/redditApi'

/**
 * Content filtering constants for Reddit comments
 */
export const COMMENT_CONTENT_MARKERS = {
  DELETED: '[deleted]',
  REMOVED: '[removed]',
  AUTO_MODERATOR: 'AutoModerator'
} as const

/**
 * Type guard to check if a comment is from AutoModerator
 *
 * @param comment - The comment data to check
 * @returns True if the comment is from AutoModerator
 */
export function isAutoModeratorComment(comment: AutoCommentData): boolean {
  return (comment as any).author === COMMENT_CONTENT_MARKERS.AUTO_MODERATOR
}

/**
 * Type guard to check if a comment is valid and not deleted/removed
 *
 * Validates that the comment has:
 * - A valid author (not deleted/removed markers)
 * - Valid content (either plain text body OR HTML body)
 * - Content that isn't marked as deleted/removed
 *
 * @param comment - The comment data to validate
 * @returns True if the comment is valid for display
 */
export function isValidComment(comment: AutoCommentData): boolean {
  const c = comment as any // Reddit API types are complex, using any for practical access
  return (
    // Ensure the comment has an author and it's not deleted/removed
    c.author &&
    c.author !== COMMENT_CONTENT_MARKERS.DELETED &&
    c.author !== COMMENT_CONTENT_MARKERS.REMOVED &&
    // Ensure the comment has content (either plain text body OR HTML body with actual content)
    Boolean(c.body?.trim() || c.body_html?.trim()) &&
    // Ensure the comment content itself isn't marked as deleted/removed
    c.body !== COMMENT_CONTENT_MARKERS.DELETED &&
    c.body !== COMMENT_CONTENT_MARKERS.REMOVED
  )
}

/**
 * Filters an array of comments to remove unwanted content
 *
 * Automatically removes:
 * - AutoModerator comments (typically not useful for users)
 * - Deleted, removed, or empty comments
 * - Comments without valid content or author information
 *
 * @param comments - Array of comment data to filter
 * @returns Filtered array of valid comments ready for display
 *
 * @example
 * ```typescript
 * const filteredComments = filterValidComments(rawComments)
 * ```
 */
export function filterValidComments(
  comments: AutoCommentData[]
): AutoCommentData[] {
  return comments
    .filter((comment) => !isAutoModeratorComment(comment))
    .filter(isValidComment)
}

/**
 * Safely extracts and filters comment data from Reddit API response children
 *
 * @param children - Array of comment child objects from Reddit API
 * @returns Array of filtered, valid comment data objects
 */
export function extractAndFilterComments(children: any[]): AutoCommentData[] {
  const commentData = children
    .map((c) => c.data)
    .filter((data): data is AutoCommentData => Boolean(data))

  return filterValidComments(commentData)
}
