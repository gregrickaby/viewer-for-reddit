/**
 * Shared Reddit helper functions
 */

/**
 * Validates a subreddit name against Reddit's naming conventions.
 * Subreddit names must:
 * - Be 3-21 characters long
 * - Contain only alphanumeric characters and underscores
 * - Not start with an underscore
 *
 * @param name - Subreddit name to validate
 * @returns True if valid, false otherwise
 */
export function isValidSubredditName(name: string): boolean {
  if (!name || typeof name !== 'string') return false

  // Check length: 3-21 characters
  if (name.length < 3 || name.length > 21) return false

  // Check for path traversal patterns
  if (name.includes('..') || name.includes('/') || name.includes('\\')) {
    return false
  }

  // Check allowed characters: alphanumeric and underscores only
  // Cannot start with underscore
  const validPattern = /^[a-zA-Z0-9]\w{2,20}$/
  return validPattern.test(name)
}

/**
 * Validates a Reddit username.
 * Usernames must:
 * - Be 3-20 characters long
 * - Contain only alphanumeric characters, underscores, and hyphens
 *
 * @param username - Username to validate
 * @returns True if valid, false otherwise
 */
export function isValidUsername(username: string): boolean {
  if (!username || typeof username !== 'string') return false

  // Check length: 3-20 characters
  if (username.length < 3 || username.length > 20) return false

  // Check for path traversal patterns
  if (
    username.includes('..') ||
    username.includes('/') ||
    username.includes('\\')
  ) {
    return false
  }

  // Check allowed characters: alphanumeric, underscores, and hyphens
  const validPattern = /^[a-zA-Z0-9_-]{3,20}$/
  return validPattern.test(username)
}

/**
 * Validates a Reddit post ID.
 * Post IDs are typically 6-7 character base36 strings.
 *
 * @param postId - Post ID to validate
 * @returns True if valid, false otherwise
 */
export function isValidPostId(postId: string): boolean {
  if (!postId || typeof postId !== 'string') return false

  // Check for path traversal patterns
  if (postId.includes('..') || postId.includes('/') || postId.includes('\\')) {
    return false
  }

  // Post IDs are base36: 0-9, a-z (lowercase), typically 6-7 chars but can be longer
  const validPattern = /^[a-z0-9]{4,12}$/
  return validPattern.test(postId)
}

/**
 * Validates a Reddit fullname (thing ID with type prefix).
 * Format: t{type}_{id} where type is 1-6 and id is base36.
 * Examples: t3_abc123 (post), t1_xyz789 (comment)
 *
 * @param fullname - Fullname to validate
 * @returns True if valid, false otherwise
 */
export function isValidFullname(fullname: string): boolean {
  if (!fullname || typeof fullname !== 'string') return false

  // Check for path traversal patterns
  if (
    fullname.includes('..') ||
    fullname.includes('/') ||
    fullname.includes('\\')
  ) {
    return false
  }

  // Fullname format: t{type}_{id}
  // type: 1-6 (comment, account, link, message, subreddit, award)
  // id: base36 (0-9, a-z lowercase)
  const validPattern = /^t[1-6]_[a-z0-9]{4,12}$/
  return validPattern.test(fullname)
}

/**
 * Validates a multireddit path format.
 * Must match: user/{username}/m/{multiname}
 * Where username and multiname follow Reddit naming conventions.
 *
 * @param path - Multireddit path to validate
 * @returns True if valid, false otherwise
 */
export function isValidMultiredditPath(path: string): boolean {
  if (!path || typeof path !== 'string') return false

  // Check for path traversal patterns
  if (path.includes('..') || path.includes('\\')) {
    return false
  }

  // Multireddit format: user/{username}/m/{multiname}
  const parts = path.split('/')

  // Must have exactly 4 parts: ['user', username, 'm', multiname]
  if (parts.length !== 4) return false

  // First part must be 'user'
  if (parts[0] !== 'user') return false

  // Third part must be 'm'
  if (parts[2] !== 'm') return false

  // Validate username (parts[1]) and multiname (parts[3])
  // Reddit usernames: 3-20 chars, alphanumeric, underscores, hyphens
  const usernamePattern = /^[a-zA-Z0-9_-]{3,20}$/
  const multinamePattern = /^\w{3,50}$/

  return usernamePattern.test(parts[1]) && multinamePattern.test(parts[3])
}

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
 * Validates input to prevent SSRF and path traversal attacks.
 *
 * @param baseUrl - Base Reddit API URL
 * @param subreddit - Subreddit name, 'home', or multireddit path (e.g., 'user/username/m/multiname')
 * @param sort - Sort option
 * @returns URL path string
 * @throws {Error} If subreddit name or path is invalid
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
  // Handle home feed (empty or 'home')
  if (subreddit === '' || subreddit === 'home') {
    // Authenticated user's home feed (subscribed subreddits)
    return `${baseUrl}/${sort}.json`
  }

  // Handle multireddit paths
  if (subreddit.startsWith('user/')) {
    // Validate multireddit path to prevent SSRF
    if (!isValidMultiredditPath(subreddit)) {
      throw new Error('Invalid multireddit path format')
    }
    // Multireddit: /user/username/m/multiname/sort.json
    return `${baseUrl}/${subreddit}/${sort}.json`
  }

  // Regular subreddit - validate name to prevent SSRF
  if (!isValidSubredditName(subreddit)) {
    throw new Error('Invalid subreddit name')
  }

  // Regular subreddit: /r/subreddit/sort.json
  return `${baseUrl}/r/${subreddit}/${sort}.json`
}
