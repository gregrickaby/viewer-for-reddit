/**
 * Retry helper with exponential backoff for rate limiting
 * Now uses global rate limit state for coordination across requests
 */

import {logger} from '@/lib/utils/logger'
import {
  recordRateLimit,
  resetRateLimit,
  waitForRateLimit
} from '@/lib/utils/rate-limit-state'

/**
 * Retry a function with exponential backoff and global rate limit coordination
 * Useful for handling rate limits and transient network errors
 *
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 1000) - only used for non-rate-limit errors
 * @returns Result of the function
 * @throws Last error if all retries fail
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Wait for any global rate limit backoff before attempting request
      // This may throw if wait time exceeds threshold - propagate immediately
      await waitForRateLimit()

      const result = await fn()

      // Success! Reset rate limit state
      resetRateLimit()

      return result
    } catch (error) {
      lastError = error

      // If error is from waitForRateLimit, don't retry - propagate immediately
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('Reddit is experiencing high traffic')) {
        throw error
      }

      // Check if this is a rate limit error
      const isRateLimitError =
        errorMessage.includes('429') || errorMessage.includes('Rate limit')

      // Log each retry attempt with context
      logger.debug(
        'Retry attempt failed',
        {
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          errorMessage,
          isRateLimitError
        },
        {context: 'retryWithBackoff'}
      )

      // For rate limit errors, record in global state
      if (isRateLimitError) {
        // Try to extract retry-after from error message or set default
        let retryAfter: number | undefined

        // Check if error has retryAfter property (from RateLimitError)
        if (
          typeof error === 'object' &&
          error !== null &&
          'retryAfter' in error
        ) {
          retryAfter = (error as {retryAfter?: number}).retryAfter
        }

        recordRateLimit(retryAfter)
      }

      // Don't retry if not a rate limit error or network error
      if (
        !isRateLimitError &&
        !errorMessage.includes('fetch') &&
        !errorMessage.includes('network')
      ) {
        logger.debug(
          'Non-retryable error, aborting retry',
          {errorMessage},
          {context: 'retryWithBackoff'}
        )
        throw lastError
      }

      // Don't retry if this was the last attempt
      if (attempt === maxRetries) {
        logger.error(
          'Max retries reached',
          {
            errorMessage,
            totalAttempts: attempt + 1,
            totalDelay: baseDelay * (2 ** maxRetries - 1)
          },
          {
            context: 'retryWithBackoff'
          }
        )
        throw error
      }

      // For non-rate-limit errors, use exponential backoff
      if (!isRateLimitError) {
        const delay = baseDelay * 2 ** attempt
        logger.info(
          `Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`,
          {delay, attempt: attempt + 1, maxRetries, errorType: 'network'},
          {
            context: 'retryWithBackoff'
          }
        )

        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      // For rate limit errors, the global state will handle the backoff in next iteration
    }
  }

  // This line should never be reached due to throw in loop, but TypeScript needs it
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}
