import type {AutoCommentData} from '@/lib/store/services/commentsApi'

/**
 * Nested comment data with reply structure.
 */
export type NestedCommentData = AutoCommentData & {
  replies?: NestedCommentData[]
  depth?: number
}

/**
 * Maximum nesting depth for comment threads.
 * Prevents performance issues and stack overflow with deeply nested comments.
 */
export const MAX_COMMENT_DEPTH = 10

/**
 * Reddit API comment child structure.
 */
interface RedditCommentChild {
  data?: AutoCommentData
  [key: string]: unknown
}

/**
 * Comment data with potential replies structure.
 */
type CommentDataWithReplies = AutoCommentData & {
  replies?: {
    data?: {
      children?: RedditCommentChild[]
    }
  }
}

/**
 * Type guard to check if data is valid AutoCommentData.
 */
function isAutoCommentData(data: unknown): data is AutoCommentData {
  return !!data && typeof data === 'object' && 'author' in data
}

/**
 * Validates if comment data is valid (not deleted/removed).
 */
function isValidCommentData(data: AutoCommentData): boolean {
  const body = 'body' in data ? data.body?.trim() : undefined
  const author = 'author' in data ? data.author : undefined
  return (
    !!body &&
    body !== '[deleted]' &&
    body !== '[removed]' &&
    author !== 'AutoModerator'
  )
}

/**
 * Extracts valid comment data from Reddit API child object.
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
  if (!isValidCommentData(commentData)) {
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
    replies: replies.length > 0 ? replies : undefined
  }
}

/**
 * Recursively extracts nested comment structure from Reddit API response.
 *
 * Transforms raw Reddit API comment data into a hierarchical structure with depth
 * information and filtered replies. Handles the complex Reddit API format where
 * replies can be nested objects or continuation markers.
 *
 * Features:
 * - Validates and filters comments (removes deleted/removed/AutoModerator)
 * - Builds recursive reply hierarchy
 * - Tracks nesting depth for each comment
 * - Respects maximum depth limit to prevent stack overflow
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

  // Prevent excessive nesting that could cause performance issues
  if (depth >= MAX_COMMENT_DEPTH) {
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
 * @param maxDepth - Maximum depth to flatten (default: MAX_COMMENT_DEPTH)
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
  maxDepth: number = MAX_COMMENT_DEPTH
): NestedCommentData[] {
  const flattened: NestedCommentData[] = []

  function processComment(comment: NestedCommentData) {
    // Add the current comment
    flattened.push(comment)

    // Process replies if within depth limit
    if (
      comment.replies &&
      comment.depth !== undefined &&
      comment.depth < maxDepth
    ) {
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
