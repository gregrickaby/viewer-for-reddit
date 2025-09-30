import type {
  AutoCommentData,
  AutoCommentWithText
} from '@/lib/store/services/commentsApi'

/**
 * Reddit API comment child structure
 */
interface RedditCommentChild {
  data?: AutoCommentData
  [key: string]: any
}

/**
 * Comment data with potential replies structure
 */
interface CommentDataWithReplies {
  replies?: {
    data?: {
      children?: RedditCommentChild[]
    }
  }
  [key: string]: any
}

/**
 * Type guard to check if data is valid AutoCommentData
 */
function isAutoCommentData(data: any): data is AutoCommentData {
  return data && typeof data === 'object' && 'author' in data
}

/**
 * Extended comment data type that includes nesting information and reply structure.
 */
export interface NestedCommentData {
  // Include all properties from AutoCommentData that we commonly use
  id?: string
  name?: string
  author?: string
  body?: string
  body_html?: string
  created_utc?: number
  permalink?: string
  ups?: number
  score?: number
  depth: number
  hasReplies: boolean
  replies?: NestedCommentData[]
  // Allow for additional properties from the original AutoCommentData
  [key: string]: any
}

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
export function extractAndFilterComments(
  children: RedditCommentChild[]
): AutoCommentData[] {
  const commentData = children
    .map((c) => c.data)
    .filter((data): data is AutoCommentData => isAutoCommentData(data))

  return filterValidComments(commentData)
}

/**
 * Validates and extracts comment data from a Reddit comment child.
 *
 * @param child - Reddit comment child object
 * @returns Valid comment data or null if invalid
 */
function extractValidCommentData(
  child: RedditCommentChild
): AutoCommentData | null {
  if (!child?.data || !isAutoCommentData(child.data)) {
    return null
  }

  const commentData = child.data
  if (!isValidComment(commentData) || isAutoModeratorComment(commentData)) {
    return null
  }

  return commentData
}

/**
 * Extracts replies from comment data.
 *
 * @param commentData - Comment data with potential replies
 * @param depth - Current nesting depth
 * @returns Array of processed reply comments
 */
function extractCommentReplies(
  commentData: AutoCommentData,
  depth: number
): NestedCommentData[] {
  const commentWithReplies = commentData as CommentDataWithReplies

  if (
    !commentWithReplies.replies ||
    typeof commentWithReplies.replies !== 'object'
  ) {
    return []
  }

  const repliesData = commentWithReplies.replies?.data?.children
  return Array.isArray(repliesData)
    ? extractNestedComments(repliesData, depth + 1)
    : []
}

/**
 * Creates a nested comment object with metadata.
 *
 * @param commentData - Original comment data
 * @param replies - Processed reply comments
 * @param depth - Current nesting depth
 * @returns Nested comment with metadata
 */
function createNestedComment(
  commentData: AutoCommentData,
  replies: NestedCommentData[],
  depth: number
): NestedCommentData {
  return {
    ...commentData,
    depth,
    hasReplies: replies.length > 0,
    replies: replies.length > 0 ? replies : undefined
  }
}

/**
 * Recursively processes Reddit comment data to extract nested comment structure.
 *
 * Transforms raw Reddit API comment data into a hierarchical structure with depth
 * information and filtered replies. Handles the complex Reddit API format where
 * replies can be nested objects or continuation markers.
 *
 * @param children - Array of comment child objects from Reddit API response
 * @param depth - Current nesting depth (starts at 0 for top-level comments)
 * @returns Array of nested comment data with reply hierarchy preserved
 *
 * @example
 * ```typescript
 * const nestedComments = extractNestedComments(response.data.children)
 * // Returns comments with depth info and nested replies
 * ```
 */
export function extractNestedComments(
  children: RedditCommentChild[],
  depth: number = 0
): NestedCommentData[] {
  if (!children || !Array.isArray(children)) {
    return []
  }

  const processedComments: NestedCommentData[] = []

  for (const child of children) {
    const commentData = extractValidCommentData(child)
    if (!commentData) continue

    const replies = extractCommentReplies(commentData, depth)
    const nestedComment = createNestedComment(commentData, replies, depth)
    processedComments.push(nestedComment)
  }

  return processedComments
}

/**
 * Flattens nested comment structure into a single array while preserving hierarchy.
 *
 * Converts nested comment tree into a flat array where each comment includes
 * its depth level. This is useful for rendering comments with proper indentation
 * while maintaining a simple iteration structure.
 *
 * @param nestedComments - Array of nested comment data
 * @param maxDepth - Maximum depth to flatten (default: 10)
 * @returns Flattened array of comments with depth information preserved
 *
 * @example
 * ```typescript
 * const flatComments = flattenComments(nestedComments, 5)
 * // Returns flat array where each comment has depth property
 * ```
 */
export function flattenComments(
  nestedComments: NestedCommentData[],
  maxDepth: number = 10
): NestedCommentData[] {
  const flattened: NestedCommentData[] = []

  function processComment(comment: NestedCommentData) {
    // Add the current comment
    flattened.push(comment)

    // Process replies if within depth limit
    if (comment.replies && comment.depth < maxDepth) {
      for (const reply of comment.replies) {
        processComment(reply)
      }
    }
  }

  for (const comment of nestedComments) {
    processComment(comment)
  }

  return flattened
}
