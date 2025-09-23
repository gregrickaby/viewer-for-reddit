/**
 * Retry configuration constants and utility functions for Reddit API.
 *
 * This file exports configuration values for retry logic, and utility functions
 * to determine if an error is retryable and to calculate exponential backoff delays.
 *
 * @see https://redux-toolkit.js.org/rtk-query/api/retry
 */

/**
 * Configuration constants for retry logic
 */
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  LIGHT_MAX_RETRIES: 1,
  BASE_DELAY: 1000,
  MAX_DELAY: 10000
} as const

/**
 * Determines if an error is retryable based on status
 */
export function isRetryableError(status: unknown): boolean {
  return (
    status === 'FETCH_ERROR' ||
    status === 'TIMEOUT_ERROR' ||
    (typeof status === 'number' && status >= 500)
  )
}

/**
 * Calculates exponential backoff delay
 */
export function calculateBackoffDelay(attempt: number): number {
  return Math.min(
    RETRY_CONFIG.BASE_DELAY * 2 ** attempt,
    RETRY_CONFIG.MAX_DELAY
  )
}
