/**
 * Utility for making HTTP requests with timeout protection.
 * Prevents requests from hanging indefinitely.
 */

/**
 * Default timeout for fetch requests (10 seconds).
 */
export const DEFAULT_TIMEOUT_MS = 10000

/**
 * Fetch a URL with timeout protection using AbortController.
 *
 * @param url - URL to fetch
 * @param options - Standard fetch options
 * @param timeoutMs - Timeout in milliseconds (default: 10000ms)
 * @returns Fetch response
 * @throws {Error} If request times out or network error occurs
 *
 * @example
 * ```typescript
 * try {
 *   const response = await fetchWithTimeout('https://api.example.com/data')
 *   const data = await response.json()
 * } catch (error) {
 *   if (error.message.includes('timed out')) {
 *     console.log('Request timeout')
 *   }
 * }
 * ```
 *
 * @security
 * - Prevents hanging requests that could tie up resources
 * - Protects against slow loris attacks
 * - Configurable timeout for different use cases
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request to ${url} timed out after ${timeoutMs}ms`)
    }

    throw error
  }
}
