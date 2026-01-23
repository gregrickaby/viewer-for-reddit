/**
 * Retry helper with exponential backoff for rate limiting
 */

import {logger} from '@/lib/utils/logger'

/**
 * Retry a function with exponential backoff
 * Useful for handling rate limits and transient network errors
 *
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 1000)
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
      return await fn()
    } catch (error) {
      lastError = error

      // Handle non-Error objects (like thrown strings)
      const errorMessage =
        error instanceof Error ? error.message : String(error)

      // Log each retry attempt with context
      logger.debug(
        'Retry attempt failed',
        {
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          errorMessage,
          isRateLimitError:
            errorMessage.includes('429') || errorMessage.includes('Rate limit')
        },
        {context: 'retryWithBackoff'}
      )

      // Don't retry if not a rate limit error
      if (
        !errorMessage.includes('429') &&
        !errorMessage.includes('Rate limit')
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

      // Calculate delay with exponential backoff
      const delay = baseDelay * 2 ** attempt
      logger.info(
        `Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`,
        {delay, attempt: attempt + 1, maxRetries},
        {
          context: 'retryWithBackoff'
        }
      )

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  // This line should never be reached due to throw in loop, but TypeScript needs it
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}
