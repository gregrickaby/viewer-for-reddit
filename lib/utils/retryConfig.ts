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
 * Determines if an error is retryable based on status code or error type.
 *
 * Classifies errors into retryable and non-retryable categories. Network errors,
 * timeouts, and server errors (5xx) are considered retryable, while client
 * errors (4xx) are not retryable as they typically indicate invalid requests.
 *
 * @param status - The error status (HTTP status code, error type, or unknown)
 * @returns True if the error should be retried, false otherwise
 *
 * @example
 * ```typescript
 * isRetryableError(500) // true - server error
 * isRetryableError(404) // false - client error
 * isRetryableError('FETCH_ERROR') // true - network error
 * ```
 */
export function isRetryableError(status: unknown): boolean {
  return (
    status === 'FETCH_ERROR' ||
    status === 'TIMEOUT_ERROR' ||
    (typeof status === 'number' && status >= 500)
  )
}

/**
 * Calculates exponential backoff delay for retry attempts.
 *
 * Implements exponential backoff with a maximum delay cap to prevent
 * excessively long waits. Each retry attempt doubles the delay time
 * until the maximum delay is reached.
 *
 * @param attempt - The current attempt number (0-based)
 * @returns Delay in milliseconds before the next retry attempt
 *
 * @example
 * ```typescript
 * calculateBackoffDelay(0) // 1000ms (1 second)
 * calculateBackoffDelay(1) // 2000ms (2 seconds)
 * calculateBackoffDelay(2) // 4000ms (4 seconds)
 * calculateBackoffDelay(10) // 10000ms (max delay cap)
 * ```
 */
export function calculateBackoffDelay(attempt: number): number {
  return Math.min(
    RETRY_CONFIG.BASE_DELAY * 2 ** attempt,
    RETRY_CONFIG.MAX_DELAY
  )
}
