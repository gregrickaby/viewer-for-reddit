/**
 * Formats subscriber count with abbreviations for large numbers.
 *
 * Uses locale-aware number formatting with abbreviated suffixes:
 * - < 1,000: Shows full number (e.g., "999")
 * - 1K - 999K: Shows thousands with 1 decimal (e.g., "1.2K")
 * - 1M+: Shows millions with 1 decimal (e.g., "37.7M")
 *
 * @param count - The number of subscribers
 * @returns Formatted subscriber count string
 *
 * @example
 * formatSubscriberCount(0) // "0"
 * formatSubscriberCount(999) // "999"
 * formatSubscriberCount(1234) // "1.2K"
 * formatSubscriberCount(1500000) // "1.5M"
 */
export function formatSubscriberCount(count: number): string {
  if (count < 0) {
    return '0'
  }

  if (count < 1000) {
    return count.toString()
  }

  if (count < 1000000) {
    const thousands = count / 1000
    return `${thousands.toFixed(1)}K`
  }

  const millions = count / 1000000
  return `${millions.toFixed(1)}M`
}
