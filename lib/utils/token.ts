import type {TokenResponse} from '@/lib/types'

let cachedToken: TokenResponse | null = null
let requestCount = 0

const MAX_REQUESTS = 950

/**
 * Determines if a new Reddit API token should be fetched.
 *
 * Checks if the current token is null/undefined or if the request count
 * has reached the maximum allowed requests per token. Reddit's API has
 * rate limits, so tokens should be refreshed before hitting the limit.
 *
 * @param token - The current token to check (defaults to cached token)
 * @param count - The current request count (defaults to global count)
 * @returns True if a new token should be fetched, false otherwise
 *
 * @example
 * ```typescript
 * if (shouldFetchNewToken()) {
 *   const newToken = await fetchRedditToken()
 *   setTokenState(newToken)
 * }
 * ```
 */
export function shouldFetchNewToken(
  token: TokenResponse | null = cachedToken,
  count: number = requestCount
): boolean {
  return !token || count >= MAX_REQUESTS
}

/**
 * Gets the current request count for the cached token.
 *
 * Returns the number of API requests made with the current token.
 * Used for monitoring token usage and determining when to refresh.
 *
 * @returns The current request count
 */
export function getRequestCount(): number {
  return requestCount
}

/**
 * Gets the currently cached Reddit API token.
 *
 * Returns the token that is currently being used for API requests.
 * May return null if no token has been cached yet.
 *
 * @returns The cached token or null if none exists
 */
export function getCachedToken(): TokenResponse | null {
  return cachedToken
}

/**
 * Resets the token state by clearing the cached token and resetting the request count.
 *
 * Used when invalidating the current token state, typically when an error
 * occurs or when explicitly wanting to start fresh with a new token.
 *
 * @example
 * ```typescript
 * // Reset state after authentication error
 * resetTokenState()
 * const newToken = await fetchRedditToken()
 * ```
 */
export function resetTokenState(): void {
  cachedToken = null
  requestCount = 0
}

/**
 * Sets the token state with a new token and optional request count.
 *
 * Updates the cached token and request count. Used when receiving a new
 * token from the Reddit API or when restoring state from storage.
 *
 * @param token - The new token to cache (or null to clear)
 * @param count - The request count to set (defaults to 0 for new tokens)
 *
 * @example
 * ```typescript
 * const newToken = await fetchRedditToken()
 * setTokenState(newToken) // count defaults to 0
 * ```
 */
export function setTokenState(
  token: TokenResponse | null,
  count: number = 0
): void {
  cachedToken = token
  requestCount = count
}

/**
 * Increments the request count for the current token.
 *
 * Should be called each time an API request is made with the current token
 * to track usage and determine when the token needs to be refreshed.
 *
 * @example
 * ```typescript
 * // Before making an API request
 * incrementRequestCount()
 * const response = await fetch(redditApiUrl, { headers: { Authorization: token } })
 * ```
 */
export function incrementRequestCount(): void {
  requestCount++
}
