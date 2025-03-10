/**
 * Format a number to a human-readable string with k/m suffix
 *
 * Example: 1000 -> 1k, 1000000 -> 1m
 *
 * @param number The number to format.
 */
export function formatNumber(number: number): string {
  // If there is no number, return an empty string.
  if (!number) {
    return ''
  }

  // If it's a string, convert it to a number.
  if (typeof number === 'string') {
    number = parseInt(number, 10)
  }

  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}m`
  }
  if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}k`
  }
  return number.toString()
}

/**
 * Format the time in "___ ago" format.
 *
 * Example: 1610000000 -> 1d ago
 *
 * @param timestampInSeconds The timestamp to format.
 */
export function formatTimeAgo(timestampInSeconds: number): string {
  // If there is no timestamp, return an empty string.
  if (!timestampInSeconds) {
    return ''
  }

  // If it's a string, convert it to a number.
  if (typeof timestampInSeconds === 'string') {
    timestampInSeconds = parseInt(timestampInSeconds, 10)
  }

  // Constants for time conversions.
  const SECOND = 1
  const MINUTE = 60 * SECOND
  const HOUR = 60 * MINUTE
  const DAY = 24 * HOUR
  const MONTH = 30 * DAY
  const YEAR = 12 * MONTH

  // Calculate elapsed time.
  const elapsedSeconds = Math.floor(Date.now() / 1000 - timestampInSeconds)

  // Return the appropriate string.
  if (elapsedSeconds < MINUTE) {
    return 'just now'
  } else if (elapsedSeconds < HOUR) {
    return `${Math.floor(elapsedSeconds / MINUTE)}m ago`
  } else if (elapsedSeconds < DAY) {
    return `${Math.floor(elapsedSeconds / HOUR)}h ago`
  } else if (elapsedSeconds < MONTH) {
    return `${Math.floor(elapsedSeconds / DAY)}d ago`
  } else if (elapsedSeconds < YEAR) {
    return `${Math.floor(elapsedSeconds / MONTH)}mo ago`
  } else {
    return `${Math.floor(elapsedSeconds / YEAR)}y ago`
  }
}
