/**
 * Comment Domain Layer
 *
 * Pure business logic for comment processing, validation, and transformation.
 * Framework-agnostic and fully tested.
 */

// Models
export type {
  CommentEntity,
  CommentSortingOption,
  CommentThread,
  CommentTree,
  CommentValidationResult,
  NestedCommentData
} from './CommentModels'

// Sorting
export {sortComments} from './CommentSorter'

// Nesting
export {
  MAX_COMMENT_DEPTH,
  extractNestedComments,
  flattenComments
} from './CommentNester'

// Validation
export {
  MAX_COMMENT_LENGTH,
  MIN_COMMENT_LENGTH,
  isValidCommentLength,
  sanitizeCommentInput,
  validateCommentText
} from './CommentValidator'
