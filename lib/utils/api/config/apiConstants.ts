/**
 * Reddit API request limits and configuration constants.
 *
 * These constants define the pagination and request limits used across
 * various Reddit API endpoints to ensure optimal performance and avoid
 * rate limiting while providing good user experience.
 *
 * @see {@link https://www.reddit.com/dev/api/} Reddit API Documentation
 */

/**
 * Minimum limit for API requests requiring pagination.
 * Used for search endpoints where smaller result sets are preferred
 * for performance and user experience (e.g., typeahead search).
 *
 * @example
 * // Used in search API for fast typeahead responses
 * const params = new URLSearchParams({
 *   query: 'javascript',
 *   limit: String(MIN_LIMIT)
 * })
 */
export const MIN_LIMIT = 10

/**
 * Maximum limit for most Reddit API requests.
 * This is the sweet spot for balancing performance, memory usage,
 * and user experience across posts, subreddits, and user data.
 *
 * @example
 * // Used in posts API for infinite scrolling
 * const params = new URLSearchParams({
 *   limit: String(MAX_LIMIT),
 *   after: pageParam
 * })
 */
export const MAX_LIMIT = 25

/**
 * Specific limit for comment thread requests.
 * Comments can be deeply nested and numerous, so this limit
 * ensures reasonable load times while still providing sufficient
 * context for discussions.
 *
 * @example
 * // Used in comments API for thread loading
 * const params = new URLSearchParams({
 *   limit: String(COMMENTS_LIMIT),
 *   depth: '8'
 * })
 */
export const COMMENTS_LIMIT = 25
