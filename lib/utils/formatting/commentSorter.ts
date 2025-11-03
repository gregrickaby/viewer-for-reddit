import type {AutoCommentData} from '@/lib/store/services/commentsApi'
import type {NestedCommentData} from './commentFilters'

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
 * Sorts comments based on the specified sorting option.
 *
 * Sorting algorithms:
 * - **best**: Returns comments in original order (Reddit's "best" algorithm pre-sorted by API)
 * - **top**: Sorts by upvote count (highest first)
 * - **new**: Sorts by creation time (newest first)
 * - **controversial**: Sorts by upvote count (lowest first, indicating contentious comments)
 * - **old**: Sorts by creation time (oldest first)
 * - **qa**: Returns comments in original order (Q&A mode pre-sorted by API)
 *
 * @param comments - Array of comments to sort
 * @param sortOption - Sorting algorithm to apply
 * @returns Sorted array of comments (original array remains unmodified)
 */
export function sortComments<T extends AutoCommentData | NestedCommentData>(
  comments: T[],
  sortOption: CommentSortingOption
): T[] {
  // 'best' and 'qa' use API's pre-sorted order
  if (sortOption === 'best' || sortOption === 'qa') {
    return comments
  }

  // Create shallow copy to avoid mutating original array
  const sorted = [...comments]

  switch (sortOption) {
    case 'top':
      // Sort by upvotes descending (highest score first)
      return sorted.sort((a, b) => {
        const aUps = 'ups' in a ? (a.ups ?? 0) : 0
        const bUps = 'ups' in b ? (b.ups ?? 0) : 0
        return bUps - aUps
      })

    case 'new':
      // Sort by creation time descending (newest first)
      return sorted.sort((a, b) => {
        const aTime = 'created_utc' in a ? (a.created_utc ?? 0) : 0
        const bTime = 'created_utc' in b ? (b.created_utc ?? 0) : 0
        return bTime - aTime
      })

    case 'old':
      // Sort by creation time ascending (oldest first)
      return sorted.sort((a, b) => {
        const aTime = 'created_utc' in a ? (a.created_utc ?? 0) : 0
        const bTime = 'created_utc' in b ? (b.created_utc ?? 0) : 0
        return aTime - bTime
      })

    case 'controversial':
      // Sort by upvotes ascending (lowest/most downvoted first)
      return sorted.sort((a, b) => {
        const aUps = 'ups' in a ? (a.ups ?? 0) : 0
        const bUps = 'ups' in b ? (b.ups ?? 0) : 0
        return aUps - bUps
      })

    default:
      // Unknown sort option - return original order
      return comments
  }
}
