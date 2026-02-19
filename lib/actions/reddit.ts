'use server'

import {getValidAccessToken} from '@/lib/actions/auth'
import {getSession} from '@/lib/auth/session'
import type {
  ApiSubredditAboutResponse,
  ApiSubredditPostsResponse,
  ApiUserProfileResponse,
  CommentSortOption,
  RedditComment,
  RedditPost,
  RedditSubreddit,
  RedditUser,
  SavedItem,
  SearchAutocompleteItem,
  SortOption,
  SubredditItem,
  TimeFilter
} from '@/lib/types/reddit'
import {
  CACHE_COMMENTS,
  CACHE_POSTS,
  CACHE_SEARCH,
  CACHE_SUBREDDIT_INFO,
  CACHE_SUBSCRIPTIONS,
  CACHE_USER_INFO,
  DEFAULT_POST_LIMIT,
  ONE_MINUTE,
  REDDIT_API_URL,
  REDDIT_PUBLIC_API_URL
} from '@/lib/utils/constants'
import {getEnvVar} from '@/lib/utils/env'
import {
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  RedditAPIError
} from '@/lib/utils/errors'
import {logger} from '@/lib/utils/logger'
import {
  buildFeedUrlPath,
  isValidFullname,
  isValidMultiredditPath,
  isValidPostId,
  isValidSubredditName,
  isValidUsername
} from '@/lib/utils/reddit-helpers'
import {revalidatePath} from 'next/cache'
import {headers} from 'next/headers'

const GENERIC_SERVER_ERROR = 'Something went wrong.'
const GENERIC_ACTION_ERROR = 'Something went wrong. Please try again.'

// Internal error messages for logging (more specific)
const RATE_LIMIT_ERROR = 'Rate limit exceeded'
const AUTH_ERROR = 'Authentication failed'
const NOT_FOUND_ERROR = 'Resource not found'

// Allowed domains for SSRF prevention
const ALLOWED_REDDIT_DOMAINS = new Set([
  'oauth.reddit.com',
  'www.reddit.com',
  'reddit.com'
])

/**
 * Validates that a URL is pointing to an allowed Reddit domain.
 * Prevents SSRF attacks by ensuring we only make requests to Reddit's API.
 *
 * @param url - URL to validate
 * @throws {Error} If URL is not a Reddit domain
 */
function validateRedditUrl(url: string): void {
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    throw new Error('Invalid URL format')
  }

  // Ensure the hostname is one of the allowed Reddit domains
  if (!ALLOWED_REDDIT_DOMAINS.has(parsedUrl.hostname)) {
    logger.error('SSRF attempt detected', new Error('Invalid domain'), {
      attemptedUrl: url,
      hostname: parsedUrl.hostname,
      context: 'validateRedditUrl'
    })
    throw new Error('Invalid request destination')
  }

  // Ensure HTTPS protocol
  if (parsedUrl.protocol !== 'https:') {
    throw new Error('Invalid protocol - HTTPS required')
  }
}

/**
 * Capture incoming request metadata for debugging.
 * Helps identify which clients (e.g., Googlebot) are hitting rate limits.
 */
async function getRequestMetadata() {
  const headersList = await headers()
  return {
    clientUserAgent: headersList.get('user-agent') || 'unknown',
    clientIp:
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      'unknown',
    referer: headersList.get('referer') || 'none'
  }
}

/**
 * Handles Reddit API error responses with enhanced error context.
 *
 * @param response - Fetch response
 * @param url - Request URL
 * @param operation - Operation being performed (e.g., 'fetchPosts', 'fetchPost')
 * @param resource - Resource being accessed (e.g., subreddit name, post ID)
 * @throws AppError with operation context
 */
async function handleFetchPostsError(
  response: Response,
  url: URL,
  operation: string,
  resource: string
): Promise<never> {
  const errorBody = await response.text()

  // Extract rate limit headers
  const rateLimitHeaders = {
    remaining: response.headers.get('x-ratelimit-remaining'),
    used: response.headers.get('x-ratelimit-used'),
    reset: response.headers.get('x-ratelimit-reset'),
    retryAfter: response.headers.get('retry-after')
  }

  // Capture incoming request metadata to identify crawlers
  const requestMetadata = await getRequestMetadata()

  const errorContext = {
    url: url.toString(),
    method: 'GET',
    status: response.status,
    statusText: response.statusText,
    errorBody,
    rateLimitHeaders,
    redditUserAgent: getEnvVar('USER_AGENT'),
    clientUserAgent: requestMetadata.clientUserAgent,
    clientIp: requestMetadata.clientIp,
    referer: requestMetadata.referer,
    context: operation,
    resource,
    forceProduction: true
  }

  logger.httpError(`Reddit API ${operation} failed`, errorContext)

  // Throw specific error types based on status code
  const retryAfter = response.headers.get('retry-after')
  const retryAfterSeconds = retryAfter
    ? Number.parseInt(retryAfter, 10)
    : undefined

  switch (response.status) {
    case 401:
    case 403:
      throw new AuthenticationError(AUTH_ERROR, operation, {
        resource,
        statusCode: response.status,
        userMessage: GENERIC_SERVER_ERROR
      })
    case 404:
      throw new NotFoundError(NOT_FOUND_ERROR, operation, resource, {
        statusCode: response.status,
        userMessage: GENERIC_SERVER_ERROR
      })
    case 429:
      throw new RateLimitError(RATE_LIMIT_ERROR, operation, retryAfterSeconds, {
        resource,
        statusCode: response.status,
        userMessage: GENERIC_SERVER_ERROR
      })
    default:
      throw new RedditAPIError(
        GENERIC_SERVER_ERROR,
        operation,
        url.toString(),
        'GET',
        {resource},
        response.status
      )
  }
}

/**
 * Create HTTP headers for Reddit API requests.
 * Attempts to use OAuth token if available (better rate limits).
 * Falls back to unauthenticated requests if no token available.
 *
 * @returns Promise resolving to headers object and base URL
 */
async function getHeaders(): Promise<{
  headers: HeadersInit
  baseUrl: string
}> {
  const headers: HeadersInit = {
    'User-Agent': getEnvVar('USER_AGENT')
  }

  // Always try to get access token if available (better rate limits)
  const accessToken = await getValidAccessToken()
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
    return {headers, baseUrl: REDDIT_API_URL} // OAuth endpoint
  }

  // No token - use public API
  return {headers, baseUrl: REDDIT_PUBLIC_API_URL}
}

/**
 * Fetch posts from a subreddit, user home feed, or multireddit.
 * Server Action with Next.js fetch caching.
 *
 * Supports:
 * - Regular subreddits: 'popular', 'pics', etc.
 * - Home feed: '' or 'home' (requires auth)
 * - Multireddits: 'user/username/m/multiname'
 *
 * @param subreddit - Subreddit name, 'home', or multireddit path
 * @param sort - Sort order (hot, new, rising, top, controversial)
 * @param after - Pagination cursor for next page
 * @param timeFilter - Time filter for top/controversial (hour, day, week, month, year, all)
 * @returns Promise resolving to posts array and next page cursor
 *
 * @throws {Error} Generic Reddit API error
 *
 * @example
 * ```typescript
 * const {posts, after} = await fetchPosts('popular', 'hot')
 * // Fetch next page
 * const {posts: morePosts} = await fetchPosts('popular', 'hot', after)
 * // Fetch top posts from this week
 * const {posts: topWeek} = await fetchPosts('popular', 'top', undefined, 'week')
 * ```
 */
export async function fetchPosts(
  subreddit: string = 'popular',
  sort: SortOption = 'hot',
  after?: string,
  timeFilter?: TimeFilter
): Promise<{posts: RedditPost[]; after: string | null}> {
  try {
    // Get headers and appropriate base URL (OAuth or public)
    const {headers, baseUrl} = await getHeaders()

    // Handle different feed types - buildFeedUrlPath validates input
    let urlPath: string
    try {
      urlPath = buildFeedUrlPath(baseUrl, subreddit, sort)
    } catch (error) {
      logger.error('Invalid subreddit parameter', error, {
        context: 'fetchPosts',
        subreddit
      })
      throw new Error(GENERIC_SERVER_ERROR)
    }

    const url = new URL(urlPath)

    // Validate URL is pointing to Reddit
    validateRedditUrl(url.toString())

    if (after) {
      url.searchParams.set('after', after)
    }
    // Add time filter for top/controversial sorts
    if (timeFilter && (sort === 'top' || sort === 'controversial')) {
      url.searchParams.set('t', timeFilter)
    }
    url.searchParams.set('limit', DEFAULT_POST_LIMIT.toString())
    url.searchParams.set('raw_json', '1')

    const response = await fetch(url.toString(), {
      headers,
      next: {
        revalidate: CACHE_POSTS,
        tags: ['posts', subreddit]
      }
    })

    if (!response.ok) {
      await handleFetchPostsError(response, url, 'fetchPosts', subreddit)
    }

    // Use codegen type for API response, then transform to simplified type
    const data: ApiSubredditPostsResponse = await response.json()
    const posts = (data.data?.children?.map((child) => child.data) ??
      []) as RedditPost[]
    const afterCursor = data.data?.after ?? null

    logger.debug('Fetched posts successfully', {
      subreddit,
      sort,
      count: posts.length,
      hasMore: !!afterCursor
    })

    return {
      posts,
      after: afterCursor
    }
  } catch (error) {
    logger.error('Error fetching posts', error, {context: 'fetchPosts'})
    throw error
  }
}

/**
 * Fetch a single Reddit post with its comments.
 * Server Action with Next.js fetch caching.
 *
 * @param subreddit - Subreddit name
 * @param postId - Reddit post ID (without 't3_' prefix)
 * @param sort - Comment sort option (best, top, new, controversial, old, qa)
 * @returns Promise resolving to post and comments array
 *
 * @throws {Error} Generic Reddit API error
 *
 * @example
 * ```typescript
 * const {post, comments} = await fetchPost('AskReddit', 'abc123', 'best')
 * ```
 */
export async function fetchPost(
  subreddit: string,
  postId: string,
  sort: CommentSortOption = 'best'
): Promise<{post: RedditPost; comments: RedditComment[]}> {
  try {
    // Validate inputs to prevent SSRF
    if (
      !isValidSubredditName(subreddit) &&
      subreddit !== 'home' &&
      !subreddit.startsWith('user/')
    ) {
      logger.error(
        'Invalid subreddit parameter',
        new Error('Validation failed'),
        {
          context: 'fetchPost',
          subreddit
        }
      )
      throw new Error(GENERIC_SERVER_ERROR)
    }

    if (!isValidPostId(postId)) {
      logger.error(
        'Invalid post ID parameter',
        new Error('Validation failed'),
        {
          context: 'fetchPost',
          postId
        }
      )
      throw new Error(GENERIC_SERVER_ERROR)
    }

    const session = await getSession()
    const isAuthenticated = !!session.accessToken

    // Get headers and appropriate base URL (OAuth or public)
    const {headers, baseUrl} = await getHeaders()
    const url = `${baseUrl}/r/${subreddit}/comments/${postId}.json?raw_json=1&sort=${sort}`

    // Validate URL is pointing to Reddit
    validateRedditUrl(url)

    const response = await fetch(url, {
      headers,
      next: {
        revalidate: CACHE_COMMENTS,
        tags: ['post', postId]
      }
    })

    if (!response.ok) {
      const errorBody = await response.text()
      const requestMetadata = await getRequestMetadata()

      logger.httpError('Failed to fetch post', {
        url,
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated,
        errorBody,
        context: 'fetchPost',
        postId,
        subreddit,
        ...requestMetadata,
        forceProduction: true
      })

      throw new RedditAPIError(
        GENERIC_SERVER_ERROR,
        'fetchPost',
        url,
        'GET',
        {subreddit, postId},
        response.status
      )
    }

    const [postData, commentsData] = await response.json()
    const post = postData.data.children[0]?.data as RedditPost
    const comments = commentsData.data.children
      .filter(
        (child: {
          kind: string
          data: unknown
        }): child is {kind: 't1'; data: RedditComment} => child.kind === 't1'
      )
      .map((child: {kind: 't1'; data: RedditComment}) => child.data)

    logger.debug('Fetched post successfully', {
      postId,
      subreddit,
      commentCount: comments.length
    })

    return {
      post,
      comments
    }
  } catch (error) {
    logger.error('Error fetching post', error, {context: 'fetchPost'})
    throw error
  }
}

/**
 * Fetch information about a subreddit.
 * Server Action with Next.js fetch caching.
 * Results cached for 1 hour.
 *
 * @param subreddit - Subreddit name
 * @returns Promise resolving to subreddit metadata
 *
 * @throws {Error} Generic Reddit API error
 *
 * @example
 * ```typescript
 * const info = await fetchSubredditInfo('technology')
 * console.log(info.subscribers) // 12345678
 * ```
 */
export async function fetchSubredditInfo(
  subreddit: string
): Promise<RedditSubreddit> {
  try {
    // Validate input to prevent SSRF
    if (!isValidSubredditName(subreddit)) {
      logger.error(
        'Invalid subreddit parameter',
        new Error('Validation failed'),
        {
          context: 'fetchSubredditInfo',
          subreddit
        }
      )
      throw new Error(GENERIC_SERVER_ERROR)
    }

    const session = await getSession()
    const isAuthenticated = !!session.accessToken

    // Get headers and appropriate base URL (OAuth or public)
    const {headers, baseUrl} = await getHeaders()
    const url = new URL(`${baseUrl}/r/${subreddit}/about.json`)
    url.searchParams.set('raw_json', '1')

    // Validate URL is pointing to Reddit
    validateRedditUrl(url.toString())

    const response = await fetch(url.toString(), {
      headers,
      next: {
        revalidate: CACHE_SUBREDDIT_INFO,
        tags: ['subreddit', subreddit]
      }
    })

    if (!response.ok) {
      const errorBody = await response.text()
      const requestMetadata = await getRequestMetadata()

      logger.httpError('Failed to fetch subreddit info', {
        url: url.toString(),
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated,
        errorBody,
        context: 'fetchSubredditInfo',
        subreddit,
        ...requestMetadata,
        forceProduction: true
      })

      throw new RedditAPIError(
        GENERIC_SERVER_ERROR,
        'fetchSubredditInfo',
        url.toString(),
        'GET',
        {subreddit},
        response.status
      )
    }

    const data: ApiSubredditAboutResponse = await response.json()
    const subredditData = data.data as RedditSubreddit

    logger.debug('Fetched subreddit info successfully', {
      subreddit,
      subscribers: subredditData.subscribers
    })

    return subredditData
  } catch (error) {
    logger.error('Error fetching subreddit info', error, {
      context: 'fetchSubredditInfo'
    })
    throw error
  }
}

/**
 * Fetch ALL authenticated user's subreddit subscriptions.
 * Server Action with Next.js fetch caching.
 * Results cached for 10 minutes. Returns empty array for unauthenticated users.
 * Automatically fetches all pages to return complete subscription list.
 *
 * @returns Promise resolving to complete subscriptions array
 *
 * @example
 * ```typescript
 * const subscriptions = await fetchUserSubscriptions()
 * ```
 */
export async function fetchUserSubscriptions(): Promise<
  Array<{
    name: string
    displayName: string
    icon: string
    subscribers: number
  }>
> {
  try {
    const session = await getSession()
    if (!session.accessToken) {
      return []
    }

    const allSubscriptions: Array<{
      name: string
      displayName: string
      icon: string
      subscribers: number
    }> = []
    let after: string | null = null

    // Loop through all pages to get complete subscription list
    do {
      const url = new URL(`${REDDIT_API_URL}/subreddits/mine/subscriber.json`)
      url.searchParams.set('limit', '100')
      url.searchParams.set('raw_json', '1')
      if (after) {
        url.searchParams.set('after', after)
      }

      // This endpoint requires OAuth - get headers with token
      const {headers} = await getHeaders()

      const response = await fetch(url.toString(), {
        headers,
        next: {
          revalidate: CACHE_SUBSCRIPTIONS,
          tags: ['subscriptions']
        }
      })

      if (!response.ok) {
        logger.warn(
          `Failed to fetch subscriptions: ${response.status} ${response.statusText}`,
          undefined,
          {context: 'fetchUserSubscriptions'}
        )
        break
      }

      const data = await response.json()
      const subscriptions = data.data.children.map(
        (child: {data: Record<string, unknown>}) => ({
          name: child.data.display_name as string,
          displayName: child.data.display_name_prefixed as string,
          icon:
            (child.data.icon_img as string) ||
            (child.data.community_icon as string) ||
            '',
          subscribers: (child.data.subscribers as number) || 0
        })
      )

      allSubscriptions.push(...subscriptions)
      after = data.data?.after || null
    } while (after)

    logger.debug('Fetched all subscriptions successfully', {
      count: allSubscriptions.length
    })

    return allSubscriptions
  } catch (error) {
    logger.error('Error fetching subscriptions', error, {
      context: 'fetchUserSubscriptions'
    })
    return []
  }
}

/**
 * Cast a vote on a Reddit post or comment.
 * Server Action with retry logic for rate limiting.
 * Requires authentication.
 *
 * @param postName - Full Reddit thing name (e.g., 't3_abc123', 't1_xyz789')
 * @param direction - Vote direction: 1 (upvote), 0 (remove vote), -1 (downvote)
 * @returns Promise resolving to success status and optional error message
 *
 * @throws {Error} Generic Reddit API error
 *
 * @example
 * ```typescript
 * // Upvote a post
 * const result = await votePost('t3_abc123', 1)
 * if (!result.success) {
 *   console.error(result.error)
 * }
 * ```
 */
export async function votePost(
  postName: string,
  direction: 1 | 0 | -1
): Promise<{success: boolean; error?: string}> {
  'use server'

  try {
    // Validate input to prevent SSRF
    if (!isValidFullname(postName)) {
      logger.error('Invalid post fullname', new Error('Validation failed'), {
        context: 'votePost',
        postName
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const session = await getSession()
    if (!session.accessToken) {
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const url = `${REDDIT_API_URL}/api/vote`

    // Validate URL is pointing to Reddit
    validateRedditUrl(url)
    // This endpoint requires OAuth - get headers with token
    const {headers} = await getHeaders()
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        id: postName,
        dir: direction.toString()
      })
    })

    if (!res.ok) {
      const errorBody = await res.text()
      logger.httpError('Vote request failed', {
        url,
        method: 'POST',
        status: res.status,
        statusText: res.statusText,
        isAuthenticated: true,
        errorBody,
        context: 'votePost',
        postName,
        direction
      })

      throw new Error(GENERIC_ACTION_ERROR)
    }

    logger.debug('Vote successful', {postName, direction})

    return {success: true}
  } catch (error) {
    logger.error('Error voting', error, {context: 'votePost'})
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}

/**
 * Save or unsave a Reddit post.
 * Server Action with retry logic for rate limiting.
 * Requires authentication.
 *
 * @param postName - Full Reddit thing name (e.g., 't3_abc123')
 * @param save - True to save, false to unsave
 * @returns Promise resolving to success status and optional error message
 *
 * @throws {Error} Generic Reddit API error
 *
 * @example
 * ```typescript
 * // Save a post
 * const result = await savePost('t3_abc123', true)
 * ```
 */
export async function savePost(
  postName: string,
  save: boolean
): Promise<{success: boolean; error?: string}> {
  'use server'
  try {
    // Validate input to prevent SSRF
    if (!isValidFullname(postName)) {
      logger.error('Invalid post fullname', new Error('Validation failed'), {
        context: 'savePost',
        postName
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const session = await getSession()
    if (!session.accessToken) {
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const endpoint = save ? 'save' : 'unsave'
    const url = `${REDDIT_API_URL}/api/${endpoint}`

    // Validate URL is pointing to Reddit
    validateRedditUrl(url)
    // This endpoint requires OAuth - get headers with token
    const {headers} = await getHeaders()
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        id: postName
      })
    })

    if (!res.ok) {
      const errorBody = await res.text()
      logger.httpError('Save/unsave request failed', {
        url,
        method: 'POST',
        status: res.status,
        statusText: res.statusText,
        isAuthenticated: true,
        errorBody,
        context: 'savePost',
        postName,
        action: save ? 'save' : 'unsave'
      })

      throw new Error(GENERIC_ACTION_ERROR)
    }

    logger.debug('Save/unsave successful', {postName, save})

    // Revalidate saved items page to update the list
    if (session.username) {
      revalidatePath(`/user/${session.username}/saved`)
    }

    return {success: true}
  } catch (error) {
    logger.error('Error saving', error, {context: 'savePost'})
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}

/**
 * Fetch authenticated user's custom multireddits.
 * Server Action with Next.js fetch caching.
 * Results cached for 10 minutes. Returns empty array for unauthenticated users.
 *
 * @returns Promise resolving to array of multireddit objects
 *
 * @example
 * ```typescript
 * const multis = await fetchMultireddits()
 * multis.forEach(multi => {
 *   console.log(`${multi.displayName}: ${multi.subreddits.join(', ')}`)
 * })
 * ```
 */
export async function fetchMultireddits(): Promise<
  Array<{
    name: string
    displayName: string
    path: string
    subreddits: string[]
    icon?: string
  }>
> {
  try {
    const session = await getSession()
    if (!session.accessToken) {
      return []
    }

    const url = `${REDDIT_API_URL}/api/multi/mine`

    // This endpoint requires OAuth - get headers with token
    const {headers} = await getHeaders()

    const response = await fetch(url, {
      headers,
      next: {
        revalidate: CACHE_SUBSCRIPTIONS,
        tags: ['multireddits']
      }
    })

    if (!response.ok) {
      logger.warn(
        `Failed to fetch multireddits: ${response.status} ${response.statusText}`,
        undefined,
        {context: 'fetchMultireddits'}
      )
      return []
    }

    const data: Array<{
      data: {
        name: string
        display_name: string
        path: string
        icon_url?: string
        subreddits?: Array<{name: string}>
      }
    }> = await response.json()

    const multireddits = data.map((multi) => ({
      name: multi.data.name,
      displayName: multi.data.display_name,
      path: multi.data.path,
      subreddits: multi.data.subreddits?.map((sub) => sub.name) || [],
      icon: multi.data.icon_url || ''
    }))

    logger.debug('Fetched multireddits successfully', {
      count: multireddits.length
    })

    return multireddits
  } catch (error) {
    logger.error('Error fetching multireddits', error, {
      context: 'fetchMultireddits'
    })
    return []
  }
}

/**
 * Fetch Reddit user profile information.
 * Server Action with Next.js fetch caching.
 * Results cached for 5 minutes.
 *
 * @param username - Reddit username (without 'u/' prefix)
 * @returns Promise resolving to user profile data
 *
 * @throws {Error} Generic Reddit API error
 *
 * @example
 * ```typescript
 * const user = await fetchUserInfo('spez')
 * console.log(`Total karma: ${user.total_karma}`)
 * ```
 */
export async function fetchUserInfo(username: string): Promise<RedditUser> {
  try {
    // Validate input to prevent SSRF
    if (!isValidUsername(username)) {
      logger.error(
        'Invalid username parameter',
        new Error('Validation failed'),
        {
          context: 'fetchUserInfo',
          username
        }
      )
      throw new Error(GENERIC_SERVER_ERROR)
    }

    const session = await getSession()
    const isAuthenticated = !!session.accessToken

    // Get headers and appropriate base URL (OAuth or public)
    const {headers, baseUrl} = await getHeaders()
    const url = `${baseUrl}/user/${username}/about.json?raw_json=1`

    // Validate URL is pointing to Reddit
    validateRedditUrl(url)

    const response = await fetch(url, {
      headers,
      next: {
        revalidate: CACHE_USER_INFO,
        tags: ['user', username]
      }
    })

    if (!response.ok) {
      const errorBody = await response.text()
      const requestMetadata = await getRequestMetadata()

      logger.httpError('Failed to fetch user info', {
        url,
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated,
        errorBody,
        context: 'fetchUserInfo',
        username,
        ...requestMetadata,
        forceProduction: true
      })

      throw new RedditAPIError(
        GENERIC_SERVER_ERROR,
        'fetchUserInfo',
        url,
        'GET',
        {username},
        response.status
      )
    }

    const data: ApiUserProfileResponse = await response.json()
    if (!data.data) {
      logger.error(
        'Invalid user data response',
        {data},
        {
          context: 'fetchUserInfo',
          username
        }
      )
      throw new RedditAPIError(
        GENERIC_SERVER_ERROR,
        'fetchUserInfo',
        url,
        'GET',
        {username, reason: 'invalid_response'}
      )
    }
    const userData = data.data as RedditUser

    logger.debug('Fetched user info successfully', {
      username,
      karma: userData.total_karma
    })

    return userData
  } catch (error) {
    logger.error('Error fetching user info', error, {
      context: 'fetchUserInfo'
    })
    throw error
  }
}

/**
 * Get the current authenticated user's avatar URL.
 * Server Action with Next.js fetch caching.
 * Returns null if not authenticated or if avatar is not available.
 * Results cached for 10 minutes.
 *
 * @returns Promise resolving to avatar URL or null
 *
 * @example
 * ```typescript
 * const avatarUrl = await getCurrentUserAvatar()
 * ```
 */
export async function getCurrentUserAvatar(): Promise<string | null> {
  try {
    const session = await getSession()
    if (!session.accessToken || !session.username) {
      return null
    }

    const userInfo = await fetchUserInfo(session.username)
    return userInfo.icon_img || null
  } catch (error) {
    logger.error('Error fetching current user avatar', error, {
      context: 'getCurrentUserAvatar'
    })
    return null
  }
}

/**
 * Fetch posts submitted by a Reddit user.
 * Server Action with Next.js fetch caching.
 * Results cached for 5 minutes.
 *
 * @param username - Reddit username (without 'u/' prefix)
 * @param sort - Sort order (hot, new, top, controversial)
 * @param after - Pagination cursor for next page
 * @param timeFilter - Time filter for top/controversial (hour, day, week, month, year, all)
 * @returns Promise resolving to posts array and next page cursor
 *
 * @throws {Error} Generic Reddit API error
 *
 * @example
 * ```typescript
 * const {posts, after} = await fetchUserPosts('spez', 'new')
 * // Fetch next page
 * const {posts: morePosts} = await fetchUserPosts('spez', 'new', after)
 * // Fetch top posts from this week
 * const {posts: topWeek} = await fetchUserPosts('spez', 'top', undefined, 'week')
 * ```
 */
export async function fetchUserPosts(
  username: string,
  sort: SortOption = 'new',
  after?: string,
  timeFilter?: TimeFilter
): Promise<{posts: RedditPost[]; after: string | null}> {
  try {
    // Validate input to prevent SSRF
    if (!isValidUsername(username)) {
      logger.error(
        'Invalid username parameter',
        new Error('Validation failed'),
        {
          context: 'fetchUserPosts',
          username
        }
      )
      throw new Error(GENERIC_SERVER_ERROR)
    }

    const session = await getSession()
    const isAuthenticated = !!session.accessToken

    // Get headers and appropriate base URL (OAuth or public)
    const {headers, baseUrl} = await getHeaders()
    const url = new URL(`${baseUrl}/user/${username}/submitted.json`)

    // Validate URL is pointing to Reddit
    validateRedditUrl(url.toString())

    url.searchParams.set('limit', DEFAULT_POST_LIMIT.toString())
    url.searchParams.set('raw_json', '1')
    url.searchParams.set('sort', sort)

    if (after) {
      url.searchParams.set('after', after)
    }

    // Add time filter for top/controversial sorts
    if (timeFilter && (sort === 'top' || sort === 'controversial')) {
      url.searchParams.set('t', timeFilter)
    }

    const response = await fetch(url.toString(), {
      headers,
      next: {
        revalidate: CACHE_USER_INFO,
        tags: ['user-posts', username]
      }
    })

    if (!response.ok) {
      const errorBody = await response.text()
      const requestMetadata = await getRequestMetadata()

      logger.httpError('Failed to fetch user posts', {
        url: url.toString(),
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated,
        errorBody,
        context: 'fetchUserPosts',
        username,
        sort,
        ...requestMetadata,
        forceProduction: true
      })

      throw new RedditAPIError(
        GENERIC_SERVER_ERROR,
        'fetchUserPosts',
        url.toString(),
        'GET',
        {username, sort},
        response.status
      )
    }

    const data: ApiSubredditPostsResponse = await response.json()
    const posts = (data.data?.children?.map((child) => child.data) ??
      []) as RedditPost[]
    const afterCursor = data.data?.after ?? null

    logger.debug('Fetched user posts successfully', {
      username,
      sort,
      count: posts.length,
      hasMore: !!afterCursor
    })

    return {
      posts,
      after: afterCursor
    }
  } catch (error) {
    logger.error('Error fetching user posts', error, {
      context: 'fetchUserPosts'
    })
    throw error
  }
}

/**
 * Fetch a user's comments.
 * Server Action with Next.js fetch caching.
 * Results cached for 5 minutes.
 *
 * @param username - Reddit username (without u/ prefix)
 * @param sort - Sort option (new, top, hot, controversial)
 * @param after - Pagination cursor for next page
 * @param timeFilter - Time filter for top/controversial (hour, day, week, month, year, all)
 * @returns Promise resolving to comments array and next page cursor
 *
 * @throws {Error} Generic Reddit API error
 *
 * @example
 * ```typescript
 * const {comments, after} = await fetchUserComments('spez', 'new')
 * console.log(`Found ${comments.length} comments`)
 * ```
 */
export async function fetchUserComments(
  username: string,
  sort: SortOption = 'new',
  after?: string,
  timeFilter?: TimeFilter
): Promise<{comments: RedditComment[]; after: string | null}> {
  try {
    // Validate input to prevent SSRF
    if (!isValidUsername(username)) {
      logger.error(
        'Invalid username parameter',
        new Error('Validation failed'),
        {
          context: 'fetchUserComments',
          username
        }
      )
      throw new Error(GENERIC_SERVER_ERROR)
    }

    const session = await getSession()
    const isAuthenticated = !!session.accessToken

    // Get headers and appropriate base URL (OAuth or public)
    const {headers, baseUrl} = await getHeaders()
    const url = new URL(`${baseUrl}/user/${username}/comments.json`)

    // Validate URL is pointing to Reddit
    validateRedditUrl(url.toString())

    url.searchParams.set('limit', DEFAULT_POST_LIMIT.toString())
    url.searchParams.set('raw_json', '1')
    url.searchParams.set('sort', sort)

    if (after) {
      url.searchParams.set('after', after)
    }

    // Add time filter for top/controversial sorts
    if (timeFilter && (sort === 'top' || sort === 'controversial')) {
      url.searchParams.set('t', timeFilter)
    }

    const response = await fetch(url.toString(), {
      headers,
      next: {
        revalidate: CACHE_USER_INFO,
        tags: ['user-comments', username]
      }
    })

    if (!response.ok) {
      const errorBody = await response.text()
      const requestMetadata = await getRequestMetadata()

      logger.httpError('Failed to fetch user comments', {
        url: url.toString(),
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated,
        errorBody,
        context: 'fetchUserComments',
        username,
        sort,
        ...requestMetadata,
        forceProduction: true
      })

      throw new RedditAPIError(
        GENERIC_SERVER_ERROR,
        'fetchUserComments',
        url.toString(),
        'GET',
        {username, sort},
        response.status
      )
    }

    const data: ApiSubredditPostsResponse = await response.json()
    const comments = (data.data?.children?.map((child) => child.data) ??
      []) as RedditComment[]
    const afterCursor = data.data?.after ?? null

    logger.debug('Fetched user comments successfully', {
      username,
      sort,
      count: comments.length,
      hasMore: !!afterCursor
    })

    return {
      comments,
      after: afterCursor
    }
  } catch (error) {
    logger.error('Error fetching user comments', error, {
      context: 'fetchUserComments'
    })
    throw error
  }
}

/**
 * Search Reddit for posts matching a query.
 * Server Action with Next.js fetch caching.
 * Results cached for 5 minutes. Includes NSFW content.
 *
 * @param query - Search query string
 * @param after - Pagination cursor for next page
 * @returns Promise resolving to posts array and next page cursor
 *
 * @throws {Error} Generic Reddit API error
 *
 * @example
 * ```typescript
 * const {posts, after} = await searchReddit('nextjs')
 * console.log(`Found ${posts.length} posts`)
 * ```
 */
export async function searchReddit(
  query: string,
  after?: string
): Promise<{posts: RedditPost[]; after: string | null}> {
  try {
    // Validate query to prevent SSRF
    if (!query || typeof query !== 'string' || query.length > 512) {
      logger.error('Invalid search query', new Error('Validation failed'), {
        context: 'searchReddit',
        queryLength: query?.length
      })
      throw new Error(GENERIC_SERVER_ERROR)
    }

    const session = await getSession()
    const isAuthenticated = !!session.accessToken

    // Get headers and appropriate base URL (OAuth or public)
    const {headers, baseUrl} = await getHeaders()
    const url = new URL(`${baseUrl}/search.json`)

    // Validate URL is pointing to Reddit
    validateRedditUrl(url.toString())

    url.searchParams.set('q', query)
    url.searchParams.set('limit', DEFAULT_POST_LIMIT.toString())
    url.searchParams.set('raw_json', '1')
    url.searchParams.set('include_over_18', 'on')
    if (after) {
      url.searchParams.set('after', after)
    }

    const response = await fetch(url.toString(), {
      headers,
      next: {
        revalidate: CACHE_SEARCH,
        tags: ['search', query]
      }
    })

    if (!response.ok) {
      const errorBody = await response.text()
      const requestMetadata = await getRequestMetadata()

      logger.httpError('Search request failed', {
        url: url.toString(),
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated,
        errorBody,
        context: 'searchReddit',
        query,
        ...requestMetadata,
        forceProduction: true
      })

      throw new RedditAPIError(
        GENERIC_SERVER_ERROR,
        'searchReddit',
        url.toString(),
        'GET',
        {query},
        response.status
      )
    }

    const data: ApiSubredditPostsResponse = await response.json()
    const posts = (data.data?.children?.map((child) => child.data) ??
      []) as RedditPost[]
    const afterCursor = data.data?.after ?? null

    logger.debug('Search successful', {
      query,
      count: posts.length,
      hasMore: !!afterCursor
    })

    return {
      posts,
      after: afterCursor
    }
  } catch (error) {
    logger.error('Error searching Reddit', error, {context: 'searchReddit'})
    throw error
  }
}

/**
 * Search within a specific subreddit using Reddit's search API.
 * Server Action for searching posts within a subreddit.
 * Returns posts matching the query within the specified subreddit.
 * Supports pagination via 'after' cursor.
 *
 * @param subreddit - Subreddit to search within
 * @param query - Search query (max 512 characters)
 * @param after - Optional pagination cursor
 * @param sort - Sort option (relevance, hot, top, new, comments). Default: relevance
 * @param time - Time filter for top sort (hour, day, week, month, year, all)
 * @returns Promise resolving to posts array and pagination cursor
 *
 * @throws {Error} Validation errors for invalid inputs
 * @throws {RedditAPIError} API errors with status codes
 *
 * @example
 * ```typescript
 * const {posts, after} = await searchSubreddit('programming', 'nextjs')
 * console.log(`Found ${posts.length} posts`)
 * ```
 */
export async function searchSubreddit(
  subreddit: string,
  query: string,
  after?: string,
  sort: 'relevance' | 'hot' | 'top' | 'new' | 'comments' = 'relevance',
  time?: TimeFilter
): Promise<{posts: RedditPost[]; after: string | null}> {
  try {
    // Validate subreddit name
    if (!isValidSubredditName(subreddit)) {
      logger.error('Invalid subreddit name', new Error('Validation failed'), {
        context: 'searchSubreddit',
        subreddit
      })
      throw new Error(GENERIC_SERVER_ERROR)
    }

    // Validate query to prevent SSRF
    if (!query || typeof query !== 'string' || query.length > 512) {
      logger.error('Invalid search query', new Error('Validation failed'), {
        context: 'searchSubreddit',
        queryLength: query?.length
      })
      throw new Error(GENERIC_SERVER_ERROR)
    }

    const session = await getSession()
    const isAuthenticated = !!session.accessToken

    // Get headers and appropriate base URL (OAuth or public)
    const {headers, baseUrl} = await getHeaders()
    const url = new URL(`${baseUrl}/r/${subreddit}/search.json`)

    // Validate URL is pointing to Reddit
    validateRedditUrl(url.toString())

    url.searchParams.set('q', query)
    url.searchParams.set('restrict_sr', 'true') // Restrict to this subreddit
    url.searchParams.set('limit', DEFAULT_POST_LIMIT.toString())
    url.searchParams.set('raw_json', '1')
    url.searchParams.set('include_over_18', 'on')
    url.searchParams.set('sort', sort)
    if (after) {
      url.searchParams.set('after', after)
    }
    if (time && (sort === 'top' || sort === 'relevance')) {
      url.searchParams.set('t', time)
    }

    const response = await fetch(url.toString(), {
      headers,
      next: {
        revalidate: CACHE_SEARCH,
        tags: ['search', subreddit, query]
      }
    })

    if (!response.ok) {
      const errorBody = await response.text()
      const requestMetadata = await getRequestMetadata()

      logger.httpError('Subreddit search request failed', {
        url: url.toString(),
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated,
        errorBody,
        context: 'searchSubreddit',
        subreddit,
        query,
        ...requestMetadata,
        forceProduction: true
      })

      throw new RedditAPIError(
        GENERIC_SERVER_ERROR,
        'searchSubreddit',
        url.toString(),
        'GET',
        {subreddit, query},
        response.status
      )
    }

    const data: ApiSubredditPostsResponse = await response.json()
    const posts = (data.data?.children?.map((child) => child.data) ??
      []) as RedditPost[]
    const afterCursor = data.data?.after ?? null

    logger.debug('Subreddit search successful', {
      subreddit,
      query,
      count: posts.length,
      hasMore: !!afterCursor
    })

    return {
      posts,
      after: afterCursor
    }
  } catch (error) {
    logger.error('Error searching subreddit', error, {
      context: 'searchSubreddit',
      subreddit
    })
    throw error
  }
}

/**
 * Search for subreddits using Reddit's autocomplete API.
 * Server Action for typeahead search suggestions.
 * Returns empty array for queries < 2 characters.
 * Results cached for 60 seconds.
 *
 * @param query - Search query (minimum 2 characters)
 * @returns Promise resolving to success status, results array, and optional error
 *
 * @example
 * ```typescript
 * const {success, data} = await searchSubreddits('tech')
 * if (success) {
 *   data.forEach(sub => console.log(sub.displayName))
 * }
 * ```
 */
export async function searchSubreddits(query: string): Promise<{
  success: boolean
  data: SubredditItem[]
  error?: string
}> {
  'use server'

  if (!query || query.length < 2) {
    return {success: true, data: []}
  }

  // Validate query to prevent SSRF
  if (typeof query !== 'string' || query.length > 100) {
    logger.error(
      'Invalid subreddit search query',
      new Error('Validation failed'),
      {
        context: 'searchSubreddits',
        queryLength: query?.length
      }
    )
    return {success: false, data: [], error: GENERIC_ACTION_ERROR}
  }

  try {
    const session = await getSession()
    const isAuthenticated = !!session.accessToken

    // Get headers and appropriate base URL (OAuth or public)
    const {headers, baseUrl} = await getHeaders()

    const params = new URLSearchParams({
      query,
      limit: '10',
      include_over_18: 'true',
      include_profiles: 'false',
      typeahead_active: 'true'
    })

    const url = `${baseUrl}/api/subreddit_autocomplete_v2.json?${params}`

    // Validate URL is pointing to Reddit
    validateRedditUrl(url)
    const response = await fetch(url, {
      headers,
      next: {
        revalidate: ONE_MINUTE,
        tags: ['search-subreddits']
      }
    })

    if (!response.ok) {
      const errorBody = await response.text()
      logger.httpError('Subreddit search request failed', {
        url,
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated,
        errorBody,
        context: 'searchSubreddits',
        query
      })

      if (response.status === 429) {
        const rateLimitMessage = isAuthenticated
          ? 'Reddit rate limit exceeded. Try again later.'
          : 'Reddit rate limit exceeded. Log in to continue.'
        return {success: false, data: [], error: rateLimitMessage}
      }

      throw new Error(GENERIC_SERVER_ERROR)
    }

    const data: {
      data?: {
        children?: Array<{
          data?: {
            display_name?: string
            display_name_prefixed?: string
            icon_img?: string
            community_icon?: string
            subscribers?: number
            over18?: boolean
          }
        }>
      }
    } = await response.json()

    const children = data?.data?.children || []

    const results: SubredditItem[] = children
      .map((child) => {
        const item: SubredditItem = {
          name: child.data?.display_name || '',
          displayName: child.data?.display_name_prefixed || '',
          icon: child.data?.icon_img || child.data?.community_icon || '',
          subscribers: child.data?.subscribers || 0,
          over18: child.data?.over18 === true
        }
        return item
      })
      .filter((item) => item.name)

    logger.debug('Subreddit search results', {
      query,
      count: results.length,
      nsfwCount: results.filter((r) => r.over18).length
    })
    return {success: true, data: results}
  } catch (error) {
    logger.error('Error searching subreddits', error, {
      context: 'searchSubreddits'
    })
    return {success: false, data: [], error: GENERIC_ACTION_ERROR}
  }
}

/**
 * Search for subreddits and user profiles using Reddit's autocomplete API.
 * Returns both communities and user profiles, tagged with a `type` field.
 * Results cached for 60 seconds.
 *
 * @param query - Search query (minimum 2 characters)
 * @returns Promise resolving to success status, results array, and optional error
 *
 * @example
 * ```typescript
 * const {success, data} = await searchSubredditsAndUsers('greg')
 * if (success) {
 *   data.forEach(item => console.log(item.type, item.displayName))
 * }
 * ```
 */
export async function searchSubredditsAndUsers(query: string): Promise<{
  success: boolean
  data: SearchAutocompleteItem[]
  error?: string
}> {
  'use server'

  if (!query || query.length < 2) {
    return {success: true, data: []}
  }

  if (typeof query !== 'string' || query.length > 100) {
    logger.error(
      'Invalid autocomplete search query',
      new Error('Validation failed'),
      {
        context: 'searchSubredditsAndUsers',
        queryLength: query?.length
      }
    )
    return {success: false, data: [], error: GENERIC_ACTION_ERROR}
  }

  try {
    const session = await getSession()
    const isAuthenticated = !!session.accessToken

    const {headers, baseUrl} = await getHeaders()

    const params = new URLSearchParams({
      query,
      limit: '10',
      include_over_18: 'true',
      include_profiles: 'true',
      typeahead_active: 'true'
    })

    const url = `${baseUrl}/api/subreddit_autocomplete_v2.json?${params}`

    validateRedditUrl(url)
    const response = await fetch(url, {
      headers,
      next: {
        revalidate: ONE_MINUTE,
        tags: ['search-autocomplete']
      }
    })

    if (!response.ok) {
      const errorBody = await response.text()
      logger.httpError('Subreddit/user autocomplete request failed', {
        url,
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated,
        errorBody,
        context: 'searchSubredditsAndUsers',
        query
      })

      if (response.status === 429) {
        const rateLimitMessage = isAuthenticated
          ? 'Reddit rate limit exceeded. Try again later.'
          : 'Reddit rate limit exceeded. Log in to continue.'
        return {success: false, data: [], error: rateLimitMessage}
      }

      throw new Error(GENERIC_SERVER_ERROR)
    }

    const data: {
      data?: {
        children?: Array<{
          data?: {
            display_name?: string
            display_name_prefixed?: string
            icon_img?: string
            community_icon?: string
            subscribers?: number
            over18?: boolean
          }
        }>
      }
    } = await response.json()

    const children = data?.data?.children || []

    const results: SearchAutocompleteItem[] = children
      .map((child) => {
        const prefixed = child.data?.display_name_prefixed || ''
        const type: 'subreddit' | 'user' = prefixed.startsWith('u/')
          ? 'user'
          : 'subreddit'
        const item: SearchAutocompleteItem = {
          name: child.data?.display_name || '',
          displayName: prefixed,
          icon: child.data?.icon_img || child.data?.community_icon || '',
          subscribers: child.data?.subscribers || 0,
          over18: child.data?.over18 === true,
          type
        }
        return item
      })
      .filter((item) => item.name)

    return {success: true, data: results}
  } catch (error) {
    logger.error('Error searching subreddits and users', error, {
      context: 'searchSubredditsAndUsers'
    })
    return {success: false, data: [], error: GENERIC_ACTION_ERROR}
  }
}

/**
 * Subscribe or unsubscribe from a subreddit.
 * Server Action for toggling subreddit subscriptions.
 *
 * @param subredditName - Subreddit name (without 'r/' prefix)
 * @param action - 'sub' to subscribe, 'unsub' to unsubscribe
 * @returns Promise resolving to success status and optional error message
 *
 * @throws {Error} Generic Reddit API error
 *
 * @example
 * ```typescript
 * const result = await toggleSubscription('ProgrammerHumor', 'sub')
 * if (result.success) {
 *   console.log('Subscribed successfully!')
 * }
 * ```
 */
export async function toggleSubscription(
  subredditName: string,
  action: 'sub' | 'unsub'
): Promise<{success: boolean; error?: string}> {
  'use server'

  try {
    // Validate input to prevent SSRF
    if (!isValidSubredditName(subredditName)) {
      logger.error('Invalid subreddit name', new Error('Validation failed'), {
        context: 'toggleSubscription',
        subredditName
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const session = await getSession()

    if (!session.accessToken) {
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    logger.debug('Toggling subscription', {
      subreddit: subredditName,
      action
    })

    const formData = new URLSearchParams({
      action,
      sr_name: subredditName
    })

    const url = `${REDDIT_API_URL}/api/subscribe`

    // Validate URL is pointing to Reddit
    validateRedditUrl(url)
    // This endpoint requires OAuth - get headers with token
    const {headers} = await getHeaders()
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    })

    if (!response.ok) {
      const errorBody = await response.text()
      logger.httpError('Subscription toggle request failed', {
        url,
        method: 'POST',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated: true,
        errorBody,
        context: 'toggleSubscription',
        subreddit: subredditName,
        action
      })

      throw new Error(GENERIC_ACTION_ERROR)
    }

    logger.debug('Subscription toggled successfully', {
      subreddit: subredditName,
      action
    })

    return {success: true}
  } catch (error) {
    logger.error('Error toggling subscription', error, {
      context: 'toggleSubscription',
      subreddit: subredditName,
      action
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}

/**
 * Fetch saved items (posts and comments) for a user.
 * Server Action with Next.js fetch caching.
 *
 * Returns both posts and comments that are not stickied.
 *
 * @param username - Reddit username
 * @param after - Pagination cursor for next page
 * @returns Promise resolving to items array and next page cursor
 *
 * @throws {Error} Generic Reddit API error
 *
 * @example
 * ```typescript
 * const {items, after} = await fetchSavedItems('johndoe')
 * // Fetch next page
 * const {items: moreItems} = await fetchSavedItems('johndoe', after)
 * ```
 */
export async function fetchSavedItems(
  username: string,
  after?: string
): Promise<{items: SavedItem[]; after: string | null}> {
  try {
    // Validate input to prevent SSRF
    if (!isValidUsername(username)) {
      logger.error(
        'Invalid username parameter',
        new Error('Validation failed'),
        {
          context: 'fetchSavedItems',
          username
        }
      )
      throw new Error(GENERIC_SERVER_ERROR)
    }

    const session = await getSession()
    if (!session.accessToken) {
      throw new Error(GENERIC_SERVER_ERROR)
    }

    // This endpoint requires OAuth - get headers with token
    const {headers} = await getHeaders()

    const url = new URL(`${REDDIT_API_URL}/user/${username}/saved.json`)

    // Validate URL is pointing to Reddit
    validateRedditUrl(url.toString())
    url.searchParams.set('limit', '100')
    url.searchParams.set('raw_json', '1')
    if (after) {
      url.searchParams.set('after', after)
    }

    logger.debug('Fetching saved items', {
      username,
      after,
      url: url.toString()
    })

    const response = await fetch(url.toString(), {
      headers,
      next: {
        revalidate: CACHE_USER_INFO,
        tags: ['saved', username]
      }
    })

    if (!response.ok) {
      const errorBody = await response.text()
      logger.httpError('Failed to fetch saved items', {
        url: url.toString(),
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated: true,
        errorBody,
        context: 'fetchSavedItems',
        username,
        after
      })

      throw new Error(GENERIC_SERVER_ERROR)
    }

    const data: ApiSubredditPostsResponse = await response.json()

    // Process both posts (t3) and comments (t1), exclude stickied items
    const allChildren = data.data?.children || []
    const items: SavedItem[] = allChildren
      .filter((child) => {
        if (child.kind === 't3') {
          // Filter out stickied posts
          return !(child.data as RedditPost).stickied
        }
        if (child.kind === 't1') {
          // Filter out stickied comments
          return !(child.data as RedditComment).stickied
        }
        return false
      })
      .map((child) => {
        if (child.kind === 't3') {
          return {type: 'post' as const, data: child.data as RedditPost}
        }
        // For comments, add additional context fields
        const commentData = child.data as RedditComment & {
          link_title?: string
          link_url?: string
          subreddit?: string
        }
        return {type: 'comment' as const, data: commentData}
      })

    logger.debug('Fetched saved items', {
      username,
      count: items.length,
      posts: items.filter((i) => i.type === 'post').length,
      comments: items.filter((i) => i.type === 'comment').length,
      after: data.data?.after
    })

    return {
      items,
      after: data.data?.after || null
    }
  } catch (error) {
    logger.error('Error fetching saved items', error, {
      context: 'fetchSavedItems',
      username,
      after
    })
    throw error
  }
}

/**
 * Fetch authenticated user's followed users (friends).
 * Server Action with Next.js fetch caching.
 * Results cached for 10 minutes. Returns empty array for unauthenticated users.
 *
 * @returns Promise resolving to array of followed user objects
 *
 * @example
 * ```typescript
 * const following = await fetchFollowedUsers()
 * following.forEach(user => {
 *   console.log(`${user.name} - added on ${new Date(user.date * 1000)}`)
 * })
 * ```
 */
export async function fetchFollowedUsers(): Promise<
  Array<{
    name: string
    id: string
    date: number
    note?: string
  }>
> {
  try {
    const session = await getSession()
    if (!session.accessToken) {
      return []
    }

    const url = `${REDDIT_API_URL}/api/v1/me/friends`

    // This endpoint requires OAuth - get headers with token
    const {headers} = await getHeaders()

    const response = await fetch(url, {
      headers,
      next: {
        revalidate: CACHE_SUBSCRIPTIONS,
        tags: ['following']
      }
    })

    if (!response.ok) {
      logger.warn(
        `Failed to fetch followed users: ${response.status} ${response.statusText}`,
        undefined,
        {context: 'fetchFollowedUsers'}
      )
      return []
    }

    const data: {
      data?: {
        children?: Array<{
          name: string
          id: string
          date: number
          note?: string
        }>
      }
    } = await response.json()

    const following =
      data.data?.children?.map((user) => ({
        name: user.name,
        id: user.id,
        date: user.date,
        note: user.note
      })) || []

    logger.debug('Fetched followed users successfully', {
      count: following.length
    })

    return following
  } catch (error) {
    logger.error('Error fetching followed users', error, {
      context: 'fetchFollowedUsers'
    })
    return []
  }
}

/**
 * Follow a Reddit user.
 * Server Action — requires `subscribe` OAuth scope.
 *
 * @param username - Reddit username to follow
 * @returns Promise resolving to success/error result
 *
 * @example
 * ```typescript
 * const result = await followUser('spez')
 * if (!result.success) console.error(result.error)
 * ```
 */
export async function followUser(
  username: string
): Promise<{success: boolean; error?: string}> {
  'use server'

  try {
    if (!isValidUsername(username)) {
      logger.error(
        'Invalid username parameter',
        new Error('Validation failed'),
        {
          context: 'followUser',
          username
        }
      )
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const session = await getSession()
    if (!session.accessToken) {
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const url = `${REDDIT_API_URL}/api/v1/me/friends/${encodeURIComponent(username)}`
    validateRedditUrl(url)

    const {headers} = await getHeaders()
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({name: username})
    })

    if (!response.ok) {
      const errorBody = await response.text()
      logger.httpError('Follow user request failed', {
        url,
        method: 'PUT',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated: true,
        errorBody,
        context: 'followUser',
        username
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    revalidatePath('/', 'layout')
    logger.debug('Followed user successfully', {username})
    return {success: true}
  } catch (error) {
    logger.error('Error following user', error, {
      context: 'followUser',
      username
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}

/**
 * Unfollow a Reddit user.
 * Server Action — requires `subscribe` OAuth scope.
 *
 * @param username - Reddit username to unfollow
 * @returns Promise resolving to success/error result
 *
 * @example
 * ```typescript
 * const result = await unfollowUser('spez')
 * if (!result.success) console.error(result.error)
 * ```
 */
export async function unfollowUser(
  username: string
): Promise<{success: boolean; error?: string}> {
  'use server'

  try {
    if (!isValidUsername(username)) {
      logger.error(
        'Invalid username parameter',
        new Error('Validation failed'),
        {
          context: 'unfollowUser',
          username
        }
      )
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const session = await getSession()
    if (!session.accessToken) {
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const url = `${REDDIT_API_URL}/api/v1/me/friends/${encodeURIComponent(username)}`
    validateRedditUrl(url)

    const {headers} = await getHeaders()
    const response = await fetch(url, {
      method: 'DELETE',
      headers
    })

    if (!response.ok) {
      const errorBody = await response.text()
      logger.httpError('Unfollow user request failed', {
        url,
        method: 'DELETE',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated: true,
        errorBody,
        context: 'unfollowUser',
        username
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    revalidatePath('/', 'layout')
    logger.debug('Unfollowed user successfully', {username})
    return {success: true}
  } catch (error) {
    logger.error('Error unfollowing user', error, {
      context: 'unfollowUser',
      username
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}

// Validation regex for multireddit URL slugs (3-50 word chars)
const MULTI_NAME_PATTERN = /^\w{3,50}$/

/**
 * Create a new multireddit for the authenticated user.
 * Server Action — requires `mysubreddits` OAuth scope.
 *
 * @param name - URL slug for the multireddit (3-50 word characters)
 * @param displayName - Human-readable display name (1-50 characters)
 * @returns Promise resolving to success status, new path, and optional error
 *
 * @example
 * ```typescript
 * const result = await createMultireddit('tech_news', 'Tech News')
 * if (result.success) console.log('Created at:', result.path)
 * ```
 */
export async function createMultireddit(
  name: string,
  displayName: string
): Promise<{success: boolean; path?: string; error?: string}> {
  'use server'

  try {
    const cleanName = name.trim()
    const cleanDisplayName = displayName.trim()

    if (!MULTI_NAME_PATTERN.test(cleanName)) {
      logger.error('Invalid multireddit name', new Error('Validation failed'), {
        context: 'createMultireddit',
        name: cleanName
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    if (!cleanDisplayName || cleanDisplayName.length > 50) {
      logger.error(
        'Invalid multireddit display name',
        new Error('Validation failed'),
        {context: 'createMultireddit'}
      )
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const session = await getSession()
    if (!session.accessToken) {
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const url = `${REDDIT_API_URL}/api/multi`
    validateRedditUrl(url)

    const {headers} = await getHeaders()
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        model: JSON.stringify({
          display_name: cleanDisplayName,
          name: cleanName,
          subreddits: [],
          visibility: 'private'
        })
      })
    })

    if (!response.ok) {
      const errorBody = await response.text()
      logger.httpError('Create multireddit request failed', {
        url,
        method: 'POST',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated: true,
        errorBody,
        context: 'createMultireddit',
        name: cleanName
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const data: {data?: {path?: string}} = await response.json()
    const path = data.data?.path

    revalidatePath('/', 'layout')
    logger.debug('Created multireddit successfully', {name: cleanName, path})
    return {success: true, path}
  } catch (error) {
    logger.error('Error creating multireddit', error, {
      context: 'createMultireddit'
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}

/**
 * Delete a multireddit owned by the authenticated user.
 * Server Action — requires `mysubreddits` OAuth scope.
 *
 * @param multiPath - Multireddit path (e.g., '/user/username/m/multiname')
 * @returns Promise resolving to success status and optional error
 *
 * @example
 * ```typescript
 * const result = await deleteMultireddit('/user/johndoe/m/tech_news')
 * ```
 */
export async function deleteMultireddit(
  multiPath: string
): Promise<{success: boolean; error?: string}> {
  'use server'

  try {
    const normalizedPath = multiPath.replace(/^\/|\/$/g, '')
    if (!isValidMultiredditPath(normalizedPath)) {
      logger.error('Invalid multireddit path', new Error('Validation failed'), {
        context: 'deleteMultireddit',
        multiPath
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const session = await getSession()
    if (!session.accessToken) {
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const url = `${REDDIT_API_URL}/api/multi/${normalizedPath}`
    validateRedditUrl(url)

    const {headers} = await getHeaders()
    const response = await fetch(url, {method: 'DELETE', headers})

    if (!response.ok) {
      const errorBody = await response.text()
      logger.httpError('Delete multireddit request failed', {
        url,
        method: 'DELETE',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated: true,
        errorBody,
        context: 'deleteMultireddit',
        multiPath
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    revalidatePath('/', 'layout')
    logger.debug('Deleted multireddit successfully', {multiPath})
    return {success: true}
  } catch (error) {
    logger.error('Error deleting multireddit', error, {
      context: 'deleteMultireddit',
      multiPath
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}

/**
 * Update a multireddit's display name.
 * Server Action — requires `mysubreddits` OAuth scope.
 *
 * @param multiPath - Multireddit path (e.g., '/user/username/m/multiname')
 * @param displayName - New human-readable display name (1-50 characters)
 * @returns Promise resolving to success status and optional error
 *
 * @example
 * ```typescript
 * const result = await updateMultiredditName('/user/johndoe/m/tech', 'Tech & Science')
 * ```
 */
export async function updateMultiredditName(
  multiPath: string,
  displayName: string
): Promise<{success: boolean; error?: string}> {
  'use server'

  try {
    const cleanDisplayName = displayName.trim()
    if (!cleanDisplayName || cleanDisplayName.length > 50) {
      logger.error(
        'Invalid multireddit display name',
        new Error('Validation failed'),
        {context: 'updateMultiredditName'}
      )
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const normalizedPath = multiPath.replace(/^\/|\/$/g, '')
    if (!isValidMultiredditPath(normalizedPath)) {
      logger.error('Invalid multireddit path', new Error('Validation failed'), {
        context: 'updateMultiredditName',
        multiPath
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const session = await getSession()
    if (!session.accessToken) {
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const url = `${REDDIT_API_URL}/api/multi/${normalizedPath}`
    validateRedditUrl(url)

    const {headers} = await getHeaders()
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        model: JSON.stringify({display_name: cleanDisplayName})
      })
    })

    if (!response.ok) {
      const errorBody = await response.text()
      logger.httpError('Update multireddit name request failed', {
        url,
        method: 'PUT',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated: true,
        errorBody,
        context: 'updateMultiredditName',
        multiPath
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    revalidatePath('/', 'layout')
    logger.debug('Updated multireddit name successfully', {
      multiPath,
      displayName: cleanDisplayName
    })
    return {success: true}
  } catch (error) {
    logger.error('Error updating multireddit name', error, {
      context: 'updateMultiredditName',
      multiPath
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}

/**
 * Add a subreddit to a multireddit.
 * Server Action — requires `mysubreddits` OAuth scope.
 *
 * @param multiPath - Multireddit path (e.g., '/user/username/m/multiname')
 * @param subredditName - Subreddit name to add (without 'r/' prefix)
 * @returns Promise resolving to success status and optional error
 *
 * @example
 * ```typescript
 * const result = await addSubredditToMultireddit('/user/johndoe/m/tech', 'programming')
 * ```
 */
export async function addSubredditToMultireddit(
  multiPath: string,
  subredditName: string
): Promise<{success: boolean; error?: string}> {
  'use server'

  try {
    const normalizedPath = multiPath.replace(/^\/|\/$/g, '')
    if (!isValidMultiredditPath(normalizedPath)) {
      logger.error('Invalid multireddit path', new Error('Validation failed'), {
        context: 'addSubredditToMultireddit',
        multiPath
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const cleanSubreddit = subredditName.trim().replace(/^r\//, '')
    if (!isValidSubredditName(cleanSubreddit)) {
      logger.error('Invalid subreddit name', new Error('Validation failed'), {
        context: 'addSubredditToMultireddit',
        subredditName: cleanSubreddit
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const session = await getSession()
    if (!session.accessToken) {
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const url = `${REDDIT_API_URL}/api/multi/${normalizedPath}/r/${encodeURIComponent(cleanSubreddit)}`
    validateRedditUrl(url)

    const {headers} = await getHeaders()
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        model: JSON.stringify({name: cleanSubreddit})
      })
    })

    if (!response.ok) {
      const errorBody = await response.text()
      logger.httpError('Add subreddit to multireddit request failed', {
        url,
        method: 'PUT',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated: true,
        errorBody,
        context: 'addSubredditToMultireddit',
        multiPath,
        subredditName: cleanSubreddit
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    revalidatePath('/', 'layout')
    logger.debug('Added subreddit to multireddit successfully', {
      multiPath,
      subredditName: cleanSubreddit
    })
    return {success: true}
  } catch (error) {
    logger.error('Error adding subreddit to multireddit', error, {
      context: 'addSubredditToMultireddit',
      multiPath
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}

/**
 * Remove a subreddit from a multireddit.
 * Server Action — requires `mysubreddits` OAuth scope.
 *
 * @param multiPath - Multireddit path (e.g., '/user/username/m/multiname')
 * @param subredditName - Subreddit name to remove (without 'r/' prefix)
 * @returns Promise resolving to success status and optional error
 *
 * @example
 * ```typescript
 * const result = await removeSubredditFromMultireddit('/user/johndoe/m/tech', 'programming')
 * ```
 */
export async function removeSubredditFromMultireddit(
  multiPath: string,
  subredditName: string
): Promise<{success: boolean; error?: string}> {
  'use server'

  try {
    const normalizedPath = multiPath.replace(/^\/|\/$/g, '')
    if (!isValidMultiredditPath(normalizedPath)) {
      logger.error('Invalid multireddit path', new Error('Validation failed'), {
        context: 'removeSubredditFromMultireddit',
        multiPath
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const cleanSubreddit = subredditName.trim().replace(/^r\//, '')
    if (!isValidSubredditName(cleanSubreddit)) {
      logger.error('Invalid subreddit name', new Error('Validation failed'), {
        context: 'removeSubredditFromMultireddit',
        subredditName: cleanSubreddit
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const session = await getSession()
    if (!session.accessToken) {
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const url = `${REDDIT_API_URL}/api/multi/${normalizedPath}/r/${encodeURIComponent(cleanSubreddit)}`
    validateRedditUrl(url)

    const {headers} = await getHeaders()
    const response = await fetch(url, {method: 'DELETE', headers})

    if (!response.ok) {
      const errorBody = await response.text()
      logger.httpError('Remove subreddit from multireddit request failed', {
        url,
        method: 'DELETE',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated: true,
        errorBody,
        context: 'removeSubredditFromMultireddit',
        multiPath,
        subredditName: cleanSubreddit
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    revalidatePath('/', 'layout')
    logger.debug('Removed subreddit from multireddit successfully', {
      multiPath,
      subredditName: cleanSubreddit
    })
    return {success: true}
  } catch (error) {
    logger.error('Error removing subreddit from multireddit', error, {
      context: 'removeSubredditFromMultireddit',
      multiPath
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}
