/**
 * @deprecated This file is a backward compatibility re-export.
 * Use `useComments` from `@/lib/hooks/comments/useComments/useComments` directly.
 *
 * This hook was refactored into focused sub-hooks:
 * - useCommentFetching: Data fetching (4 RTK Query hooks)
 * - useCommentProcessing: Data transformation and nesting
 * - useCommentPagination: Pagination control selection
 * - useComments: Orchestrator composing all sub-hooks
 *
 * The new architecture follows Single Responsibility Principle,
 * improving testability and maintainability.
 */
export {
  useComments as useCommentData,
  type UseCommentsParams as UseCommentDataParams,
  type UseCommentsReturn as UseCommentDataReturn
} from './comments/useComments/useComments'
