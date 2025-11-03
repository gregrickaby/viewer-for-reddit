import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime)

/**
 * Helper function to get the time in "___ ago" format.
 * Uses Day.js for consistent cross-environment date handling.
 *
 * @param timestampInSeconds - Unix timestamp in seconds
 * @returns Formatted relative time string (e.g., "2h ago", "just now")
 */
export function formatTimeAgo(timestampInSeconds: number): string {
  const timestamp = dayjs.unix(timestampInSeconds)
  return timestamp.fromNow()
}
