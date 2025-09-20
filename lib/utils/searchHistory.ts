import type {SubredditItem} from '@/lib/types'

/**
 * Maximum number of search history items to keep
 */
const MAX_SEARCH_HISTORY = 10

/**
 * Adds a subreddit to the search history, ensuring no duplicates
 * and maintaining the maximum limit.
 *
 * @param history - Current search history array
 * @param subreddit - Subreddit to add to history
 * @returns Updated search history array
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
 * @param history - Current search history array
 * @param subredditValue - Value of the subreddit to remove
 * @returns Updated search history array
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
 * @returns Empty search history array
 */
export function clearSearchHistory(): SubredditItem[] {
  return []
}
