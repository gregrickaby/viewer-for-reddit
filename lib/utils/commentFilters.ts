import type {
  AutoCommentData,
  AutoCommentWithText
} from '@/lib/store/services/commentsApi'

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
  return (
    'author' in comment &&
    comment.author === COMMENT_CONTENT_MARKERS.AUTO_MODERATOR
  )
}

/**
 * Type guard to check if a comment has text content properties.
 *
 * Validates that the comment object contains both 'body' and 'body_html'
 * properties required for text rendering.
 *
 * @param comment - The comment data to check for text properties
 * @returns True if the comment has both body and body_html properties
 *
 * @internal This is a private helper function for internal validation
 */
function hasCommentText(
  comment: AutoCommentData
): comment is AutoCommentWithText {
  return 'body' in comment && 'body_html' in comment
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
  // Check if author exists and is valid
  const hasValidAuthor = Boolean(
    'author' in comment &&
      comment.author &&
      comment.author !== COMMENT_CONTENT_MARKERS.DELETED &&
      comment.author !== COMMENT_CONTENT_MARKERS.REMOVED
  )

  // Check if comment has text properties - must have author AND content properties
  if (!hasValidAuthor || !hasCommentText(comment)) {
    return false
  }

  // Check if comment has valid content
  const hasContent = Boolean(comment.body?.trim() || comment.body_html?.trim())

  // Check if content is not marked as deleted/removed
  const isNotDeleted = Boolean(
    comment.body !== COMMENT_CONTENT_MARKERS.DELETED &&
      comment.body !== COMMENT_CONTENT_MARKERS.REMOVED
  )

  return hasContent && isNotDeleted
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
 * Safely extracts and filters comment data from Reddit API response children.
 *
 * Processes raw Reddit API comment children by extracting the data property
 * from each child object, filtering out any null/undefined entries, and then
 * applying comment validation and filtering rules.
 *
 * @param children - Array of comment child objects from Reddit API response
 * @returns Array of filtered, valid comment data objects ready for display
 *
 * @example
 * ```typescript
 * const comments = extractAndFilterComments(response.data.children)
 * // Returns only valid, non-deleted, non-AutoModerator comments
 * ```
 */
export function extractAndFilterComments(children: any[]): AutoCommentData[] {
  const commentData = children
    .map((c) => c.data)
    .filter((data): data is AutoCommentData => Boolean(data))

  return filterValidComments(commentData)
}
