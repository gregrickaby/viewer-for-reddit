/**
 * Retry Configuration for Reddit API
 *
 * This file contains configuration for implementing retry logic
 * for transient network failures in Reddit API calls.
 *
 * @future-improvement
 * Implementation of retry logic with RTK Query's retry utility
 * would provide better resilience for network failures.
 *
 * Example implementation would include:
 * - Exponential backoff (1s, 2s, 4s delays)
 * - Retry on FETCH_ERROR, TIMEOUT_ERROR, and 5xx status codes
 * - Maximum of 3 retries for critical endpoints
 * - Lighter retry (1 retry) for search/autocomplete endpoints
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
