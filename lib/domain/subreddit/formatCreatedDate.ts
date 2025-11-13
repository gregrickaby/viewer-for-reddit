import {formatTimeAgo} from '@/lib/utils/formatting/posts/formatTimeAgo'

/**
 * Formats subreddit creation date as relative time.
 *
 * Converts a Unix timestamp into a human-readable "Created X ago" format
 * using the existing formatTimeAgo utility.
 *
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted creation date string
 *
 * @example
 * formatCreatedDate(1201234022) // "Created 17 years ago"
 * formatCreatedDate(Date.now() / 1000 - 86400) // "Created a day ago"
 */
export function formatCreatedDate(timestamp: number): string {
  const relativeTime = formatTimeAgo(timestamp)
  return `Created ${relativeTime}`
}
