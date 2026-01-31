/**
 * Application-wide constants
 */

// Cache revalidation times (in seconds)
// Increased to reduce Reddit API rate limiting
export const FIVE_MINUTES = 300
export const TEN_MINUTES = 600
export const FIFTEEN_MINUTES = 900
export const THIRTY_MINUTES = 1800
export const ONE_HOUR = 3600

// Default cache times by content type
// Posts change frequently but we can tolerate slightly stale data during rate limits
export const CACHE_POSTS = FIFTEEN_MINUTES // Was FIVE_MINUTES
export const CACHE_COMMENTS = TEN_MINUTES // Was FIVE_MINUTES
export const CACHE_SUBREDDIT_INFO = ONE_HOUR // Unchanged
export const CACHE_USER_INFO = TEN_MINUTES // Was FIVE_MINUTES
export const CACHE_SUBSCRIPTIONS = THIRTY_MINUTES // Was TEN_MINUTES
export const CACHE_SEARCH = TEN_MINUTES // Was FIVE_MINUTES

// Token refresh buffer time (in milliseconds)
export const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000 // 5 minutes before token expiry

// Reddit API configuration
export const REDDIT_API_URL = 'https://oauth.reddit.com'

// Pagination
export const DEFAULT_POST_LIMIT = 25

// UI thresholds
export const SCROLL_THRESHOLD = 100 // pixels from bottom to trigger infinite scroll
export const BOSS_BUTTON_DELAY = 200 // milliseconds delay for boss button activation
