/**
 * Global rate limit state manager
 * Coordinates rate limit backoff across all Reddit API requests
 */

import {logger} from '@/lib/utils/logger'

interface RateLimitState {
  isLimited: boolean
  retryAfter: number | null // Unix timestamp when we can retry
  limitCount: number // Number of times we've hit the limit
}

// Global rate limit state (shared across requests in the same function instance)
// This is intentional - helps coordinate backoff when multiple requests hit rate limits
// State automatically resets when backoff period expires (see isRateLimited())
const state: RateLimitState = {
  isLimited: false,
  retryAfter: null,
  limitCount: 0
}

/**
 * Record a rate limit hit and calculate backoff time
 *
 * @param retryAfterSeconds - Retry-After header value in seconds (0 means not provided)
 */
export function recordRateLimit(retryAfterSeconds?: number): void {
  state.limitCount++
  state.isLimited = true

  // Use retry-after header if provided and > 0, otherwise use exponential backoff
  const backoffSeconds =
    retryAfterSeconds && retryAfterSeconds > 0
      ? retryAfterSeconds
      : calculateExponentialBackoff(state.limitCount)

  state.retryAfter = Date.now() + backoffSeconds * 1000

  logger.warn('Rate limit recorded', undefined, {
    context: 'rate-limit-state',
    retryAfter: state.retryAfter,
    retryAfterSeconds: backoffSeconds,
    limitCount: state.limitCount,
    retryAfterProvided: !!retryAfterSeconds
  })
}

/**
 * Calculate exponential backoff time based on number of consecutive rate limits.
 *
 * Backoff progression: 30s → 60s → 120s → 240s → 300s (max)
 * Formula: min(300, 30 * 2^(limitCount - 1)) seconds
 *
 * @param limitCount - Number of consecutive rate limit hits
 * @returns Backoff time in seconds
 *
 * @internal
 */
function calculateExponentialBackoff(limitCount: number): number {
  // Start at 30 seconds, max out at 300 seconds (5 minutes)
  const baseDelay = 30
  const maxDelay = 300
  const calculatedDelay = baseDelay * 2 ** (limitCount - 1)

  return Math.min(maxDelay, calculatedDelay)
}

/**
 * Check if we're currently rate limited and should wait
 *
 * @returns True if rate limited and should wait
 */
export function isRateLimited(): boolean {
  if (!state.isLimited || !state.retryAfter) {
    return false
  }

  const now = Date.now()

  // If retry time has passed, reset state
  if (now >= state.retryAfter) {
    resetRateLimit()
    return false
  }

  return true
}

/**
 * Get the time remaining until we can retry (in milliseconds)
 *
 * @returns Milliseconds until retry allowed, or 0 if not limited
 */
export function getRetryAfterMs(): number {
  if (!state.isLimited || !state.retryAfter) {
    return 0
  }

  const now = Date.now()
  const remaining = state.retryAfter - now

  return Math.max(0, remaining)
}

/**
 * Reset rate limit state (called when backoff period expires or request succeeds)
 */
export function resetRateLimit(): void {
  const wasLimited = state.isLimited

  state.isLimited = false
  state.retryAfter = null
  state.limitCount = 0

  if (wasLimited) {
    logger.info('Rate limit state reset', undefined, {
      context: 'rate-limit-state'
    })
  }
}

/**
 * Wait for rate limit backoff period to expire
 * Throws error with user-friendly message if wait time exceeds threshold
 *
 * @param maxWaitMs - Maximum time to wait (default: 10 seconds)
 * @throws Error if wait time exceeds maxWaitMs
 */
export async function waitForRateLimit(
  maxWaitMs: number = 10000
): Promise<void> {
  if (!isRateLimited()) {
    return
  }

  const waitMs = getRetryAfterMs()

  // If wait time exceeds threshold, fail fast with user message
  if (waitMs > maxWaitMs) {
    const waitSeconds = Math.ceil(waitMs / 1000)
    logger.warn('Rate limit wait time exceeds threshold', undefined, {
      context: 'rate-limit-state',
      waitMs,
      maxWaitMs,
      waitSeconds
    })

    throw new Error(
      `Reddit is experiencing high traffic. Please try again in ${waitSeconds} seconds.`
    )
  }

  logger.info(`Waiting ${waitMs}ms for rate limit backoff`, undefined, {
    context: 'rate-limit-state',
    waitMs
  })

  await new Promise((resolve) => setTimeout(resolve, waitMs))
}

/**
 * Get current rate limit state (for debugging)
 */
export function getRateLimitState(): Readonly<RateLimitState> {
  return {...state}
}
