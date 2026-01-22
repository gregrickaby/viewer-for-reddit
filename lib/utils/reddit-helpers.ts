/**
 * Shared Reddit helper functions
 */

/**
 * Converts Reddit's likes boolean to vote state
 * @param likes - Reddit's likes value (true = upvoted, false = downvoted, null = not voted)
 * @returns Vote state as 1 (upvote), 0 (no vote), or -1 (downvote)
 */
export function getInitialVoteState(
  likes: boolean | null | undefined
): 1 | 0 | -1 {
  if (likes === true) return 1
  if (likes === false) return -1
  return 0
}

/**
 * Gets the color for a vote state
 * @param voteState - Current vote state
 * @returns Color string for Mantine components
 */
export function getVoteColor(voteState: 1 | 0 | -1 | null): string {
  if (voteState === 1) return 'orange'
  if (voteState === -1) return 'blue'
  return 'inherit'
}

/**
 * Extracts the slug from a Reddit permalink
 * @param permalink - Reddit post permalink
 * @param postId - Reddit post ID
 * @returns Slug string or 'post' as fallback
 */
export function extractSlug(permalink: string, postId: string): string {
  // Reddit permalink format: /r/subreddit/comments/postId/slug/
  const parts = permalink.split('/')
  const idIndex = parts.indexOf(postId)
  if (idIndex !== -1 && parts[idIndex + 1]) {
    return parts[idIndex + 1]
  }
  // Fallback
  return 'post'
}

/**
 * Determines if media dimensions indicate vertical orientation
 * @param width - Media width
 * @param height - Media height
 * @returns True if height > width, false otherwise
 */
export function getIsVertical(width?: number, height?: number): boolean {
  return !!(width && height && height > width)
}

/**
 * Builds the appropriate URL path based on feed type.
 * Handles regular subreddits, home feed, and multireddits.
 *
 * @param baseUrl - Base Reddit API URL
 * @param subreddit - Subreddit name, 'home', or multireddit path (e.g., 'user/username/m/multiname')
 * @param sort - Sort option
 * @returns URL path string
 *
 * @example
 * ```typescript
 * buildFeedUrlPath('https://oauth.reddit.com', 'popular', 'hot')
 * // Returns: 'https://oauth.reddit.com/r/popular/hot.json'
 *
 * buildFeedUrlPath('https://oauth.reddit.com', 'home', 'hot')
 * // Returns: 'https://oauth.reddit.com/hot.json'
 *
 * buildFeedUrlPath('https://oauth.reddit.com', 'user/johndoe/m/tech', 'top')
 * // Returns: 'https://oauth.reddit.com/user/johndoe/m/tech/top.json'
 * ```
 */
export function buildFeedUrlPath(
  baseUrl: string,
  subreddit: string,
  sort: string
): string {
  if (subreddit === '' || subreddit === 'home') {
    // Authenticated user's home feed (subscribed subreddits)
    return `${baseUrl}/${sort}.json`
  }
  if (subreddit.startsWith('user/')) {
    // Multireddit: /user/username/m/multiname/sort.json
    return `${baseUrl}/${subreddit}/${sort}.json`
  }
  // Regular subreddit: /r/subreddit/sort.json
  return `${baseUrl}/r/${subreddit}/${sort}.json`
}
