import type {AutoCommentData} from '@/lib/store/services/commentsApi'

/**
 * Comment sorting options supported by Reddit.
 */
export type CommentSortingOption =
  | 'best'
  | 'top'
  | 'new'
  | 'controversial'
  | 'old'
  | 'qa'

/**
 * Core domain entity representing a comment in the system.
 * Extends Reddit API data with domain-specific properties.
 */
export type CommentEntity = AutoCommentData & {
  /** Child comments nested under this comment */
  replies?: CommentEntity[]
  /** Nesting depth level (0 = top-level) */
  depth?: number
}

/**
 * Thread of comments with parent-child relationships.
 */
export interface CommentThread {
  /** Root comment of the thread */
  root: CommentEntity
  /** All descendants in the thread */
  descendants: CommentEntity[]
  /** Total comment count in thread */
  count: number
}

/**
 * Complete comment tree structure for a post.
 */
export interface CommentTree {
  /** Top-level comments */
  roots: CommentEntity[]
  /** Flat list of all comments */
  flatList: AutoCommentData[]
  /** Total comment count */
  totalCount: number
  /** Maximum nesting depth in tree */
  maxDepth: number
}

/**
 * Nested comment data with reply structure.
 */
export type NestedCommentData = AutoCommentData & {
  replies?: NestedCommentData[]
  depth?: number
}

/**
 * Result of comment validation.
 */
export interface CommentValidationResult {
  /** Whether validation passed */
  isValid: boolean
  /** Error message if validation failed */
  error?: string
}
