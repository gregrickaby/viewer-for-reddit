/**
 * Application-wide constants
 */

// Cache revalidation times (in seconds)
// Cache revalidation times for Reddit API responses
export const ONE_MINUTE = 60
export const FIVE_MINUTES = 300
export const TEN_MINUTES = 600
export const FIFTEEN_MINUTES = 900
export const THIRTY_MINUTES = 1800
export const ONE_HOUR = 3600

// Default cache times by content type
// Posts change frequently but we can tolerate slightly stale data
export const CACHE_POSTS = FIFTEEN_MINUTES
export const CACHE_COMMENTS = TEN_MINUTES
export const CACHE_SUBREDDIT_INFO = ONE_HOUR
export const CACHE_USER_INFO = TEN_MINUTES
export const CACHE_SUBSCRIPTIONS = THIRTY_MINUTES
export const CACHE_SEARCH = TEN_MINUTES
export const CACHE_AUTOCOMPLETE = ONE_MINUTE

// Token refresh buffer time (in milliseconds)
export const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000 // 5 minutes before token expiry

// Reddit API configuration
export const REDDIT_API_URL = 'https://oauth.reddit.com' // Authenticated requests

// Pagination
export const DEFAULT_POST_LIMIT = 25
export const PAGINATION_MAX_LIMIT = 100 // Reddit's max items per page

// UI thresholds
export const SCROLL_THRESHOLD = 100 // pixels from bottom to trigger infinite scroll
export const BOSS_BUTTON_SCROLL_THRESHOLD = 200 // pixels scrolled before boss button appears

// Comment rendering
export const MAX_COMMENT_DEPTH = 10 // Maximum nesting depth before "Continue thread" link
