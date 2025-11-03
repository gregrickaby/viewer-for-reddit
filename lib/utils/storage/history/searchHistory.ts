import type {SubredditItem} from '@/lib/types'

/**
 * Maximum number of search history items to keep
 */
const MAX_SEARCH_HISTORY = 10

/**
 * Adds a subreddit to the search history, ensuring no duplicates and maintaining the maximum limit.
 *
 * Manages search history by adding new entries to the beginning of the list,
 * removing any existing duplicates, and enforcing the maximum history size.
 * This creates a "most recently searched" ordering for better user experience.
 *
 * @param history - Current search history array
 * @param subreddit - Subreddit item to add to history
 * @returns Updated search history array with the new item at the beginning
 *
 * @example
 * ```typescript
 * const history = [{ value: 'programming', label: 'r/programming' }]
 * const updated = addToSearchHistory(history, { value: 'javascript', label: 'r/javascript' })
 * // Returns: [{ value: 'javascript', label: 'r/javascript' }, { value: 'programming', label: 'r/programming' }]
 * ```
 */
export function addToSearchHistory(
  history: SubredditItem[],
  subreddit: SubredditItem
): SubredditItem[] {
  // Remove any existing instance of this subreddit
  const filtered = history.filter((item) => item.value !== subreddit.value)

  // Add to the beginning and limit to MAX_SEARCH_HISTORY
  return [subreddit, ...filtered].slice(0, MAX_SEARCH_HISTORY)
}

/**
 * Removes a subreddit from the search history.
 *
 * Filters out a specific subreddit from the search history based on its value.
 * Used when users want to clean up their search history or remove unwanted entries.
 *
 * @param history - Current search history array
 * @param subredditValue - Value of the subreddit to remove (e.g., 'programming')
 * @returns Updated search history array with the specified item removed
 *
 * @example
 * ```typescript
 * const history = [
 *   { value: 'javascript', label: 'r/javascript' },
 *   { value: 'programming', label: 'r/programming' }
 * ]
 * const updated = removeFromSearchHistory(history, 'programming')
 * // Returns: [{ value: 'javascript', label: 'r/javascript' }]
 * ```
 */
export function removeFromSearchHistory(
  history: SubredditItem[],
  subredditValue: string
): SubredditItem[] {
  return history.filter((item) => item.value !== subredditValue)
}

/**
 * Clears all search history.
 *
 * Completely empties the search history, typically used when users
 * want to reset their search history or clear all data.
 *
 * @returns Empty search history array
 *
 * @example
 * ```typescript
 * const cleared = clearSearchHistory()
 * // Returns: []
 * ```
 */
export function clearSearchHistory(): SubredditItem[] {
  return []
}
