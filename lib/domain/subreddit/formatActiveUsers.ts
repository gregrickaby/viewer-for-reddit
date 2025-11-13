/**
 * Formats active user count with fallback for missing data.
 *
 * Displays the number of currently active users in a subreddit.
 * Returns a fallback message if the count is undefined (some subreddits
 * don't expose this information).
 *
 * @param count - The number of active users, or undefined if unavailable
 * @returns Formatted active users string
 *
 * @example
 * formatActiveUsers(565) // "565 online"
 * formatActiveUsers(0) // "0 online"
 * formatActiveUsers(undefined) // "Data unavailable"
 */
export function formatActiveUsers(count: number | undefined): string {
  if (count === undefined) {
    return 'Data unavailable'
  }

  return `${count.toLocaleString()} online`
}
