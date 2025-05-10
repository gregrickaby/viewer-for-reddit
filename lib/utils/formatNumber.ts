/**
 * Helper function to format a number with commas.
 */
export function formatNumber(number: number): string {
  return new Intl.NumberFormat('en-US').format(number)
}
