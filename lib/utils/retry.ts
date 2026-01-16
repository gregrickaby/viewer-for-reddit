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

      // Don't retry if not a rate limit error
      if (
        !errorMessage.includes('429') &&
        !errorMessage.includes('Rate limit')
      ) {
        throw lastError
      }

      // Don't retry if this was the last attempt
      if (attempt === maxRetries) {
        logger.error('Max retries reached', error, {
          context: 'retryWithBackoff',
          attempts: attempt + 1
        })
        throw error
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * 2 ** attempt
      logger.info(
        `Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`,
        undefined,
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
