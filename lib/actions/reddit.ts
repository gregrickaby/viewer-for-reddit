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
  SortOption,
  SubredditItem,
  TimeFilter
} from '@/lib/types/reddit'
import {
  DEFAULT_POST_LIMIT,
  FIVE_MINUTES,
  ONE_HOUR,
  REDDIT_API_URL,
  TEN_MINUTES
} from '@/lib/utils/constants'
import {getEnvVar} from '@/lib/utils/env'
import {logger} from '@/lib/utils/logger'
import {buildFeedUrlPath} from '@/lib/utils/reddit-helpers'
import {retryWithBackoff} from '@/lib/utils/retry'
import {revalidatePath} from 'next/cache'
import {headers} from 'next/headers'

const GENERIC_SERVER_ERROR = 'Something went wrong.'
const GENERIC_ACTION_ERROR = 'Something went wrong. Please try again.'

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
 * Handles Reddit API error responses with generic errors.
 *
 * @param response - Fetch response
 * @param url - Request URL
 * @throws Error with a generic message
 */
async function handleFetchPostsError(
  response: Response,
  url: URL
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

  logger.httpError('Reddit API request failed', {
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
    context: 'fetchPosts',
    forceProduction: true // Force this error to be logged even in environments where logging might otherwise be suppressed
  })

  throw new Error(GENERIC_SERVER_ERROR)
}

/**
 * Get application-only access token for anonymous Reddit API access.
 * Uses client credentials grant type. Token is cached for 1 hour.
 */
let appToken: {token: string; expiresAt: number} | null = null

async function getAppAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (appToken && appToken.expiresAt > Date.now()) {
    return appToken.token
  }

  // Get new token using client credentials
  const credentials = Buffer.from(
    `${getEnvVar('REDDIT_CLIENT_ID')}:${getEnvVar('REDDIT_CLIENT_SECRET')}`
  ).toString('base64')

  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': getEnvVar('USER_AGENT')
    },
    body: 'grant_type=client_credentials'
  })

  if (!response.ok) {
    throw new Error(`Failed to get app token: ${response.statusText}`)
  }

  const data = await response.json()
  appToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - 60000 // Refresh 1 min early
  }

  return appToken.token
}

/**
 * Create HTTP headers for Reddit API requests.
 * For authenticated users: uses user's OAuth token
 * For anonymous users: uses application-only token
 *
 * @param useAuth - Whether user is authenticated
 * @returns Promise resolving to headers object
 */
async function getHeaders(useAuth: boolean = false) {
  const headers: HeadersInit = {
    'User-Agent': getEnvVar('USER_AGENT')
  }

  if (useAuth) {
    // Automatically refresh token if needed
    const accessToken = await getValidAccessToken()
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
    }
  } else {
    // Use application-only token for anonymous access
    const token = await getAppAccessToken()
    headers.Authorization = `Bearer ${token}`
  }

  return headers
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
    const session = await getSession()
    const isAuthenticated = !!session.accessToken

    // Always use OAuth endpoint (works with both user and app tokens)
    const baseUrl = REDDIT_API_URL

    // Handle different feed types
    const urlPath = buildFeedUrlPath(baseUrl, subreddit, sort)
    const url = new URL(urlPath)

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
      headers: await getHeaders(isAuthenticated),
      next: {revalidate: FIVE_MINUTES}
    })

    if (!response.ok) {
      await handleFetchPostsError(response, url)
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
    const session = await getSession()
    const isAuthenticated = !!session.accessToken

    // Always use OAuth endpoint (works with both user and app tokens)
    const baseUrl = REDDIT_API_URL
    const url = `${baseUrl}/r/${subreddit}/comments/${postId}.json?raw_json=1&sort=${sort}`

    const response = await fetch(url, {
      headers: await getHeaders(isAuthenticated),
      next: {revalidate: FIVE_MINUTES}
    })

    if (!response.ok) {
      const errorBody = await response.text()
      logger.httpError('Failed to fetch post', {
        url,
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated,
        errorBody,
        context: 'fetchPost',
        postId,
        subreddit
      })

      throw new Error(GENERIC_SERVER_ERROR)
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
    const session = await getSession()
    const isAuthenticated = !!session.accessToken

    // Always use OAuth endpoint (works with both user and app tokens)
    const baseUrl = REDDIT_API_URL
    const url = new URL(`${baseUrl}/r/${subreddit}/about.json`)
    url.searchParams.set('raw_json', '1')

    const response = await fetch(url.toString(), {
      headers: await getHeaders(isAuthenticated),
      next: {revalidate: ONE_HOUR}
    })

    if (!response.ok) {
      const errorBody = await response.text()
      logger.httpError('Failed to fetch subreddit info', {
        url: url.toString(),
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated,
        errorBody,
        context: 'fetchSubredditInfo',
        subreddit
      })

      throw new Error(GENERIC_SERVER_ERROR)
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

      const response = await fetch(url.toString(), {
        headers: await getHeaders(true),
        next: {revalidate: TEN_MINUTES}
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
    const session = await getSession()
    if (!session.accessToken) {
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    await retryWithBackoff(async () => {
      const url = `${REDDIT_API_URL}/api/vote`
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          ...(await getHeaders(true)),
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

      return res
    })

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
    const session = await getSession()
    if (!session.accessToken) {
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const endpoint = save ? 'save' : 'unsave'
    await retryWithBackoff(async () => {
      const url = `${REDDIT_API_URL}/api/${endpoint}`
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          ...(await getHeaders(true)),
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

      return res
    })

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

    const response = await fetch(url, {
      headers: await getHeaders(true),
      next: {revalidate: TEN_MINUTES}
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
    const session = await getSession()
    const isAuthenticated = !!session.accessToken

    // Always use OAuth endpoint (works with both user and app tokens)
    const baseUrl = REDDIT_API_URL
    const url = `${baseUrl}/user/${username}/about.json?raw_json=1`

    const response = await fetch(url, {
      headers: await getHeaders(isAuthenticated),
      next: {revalidate: FIVE_MINUTES}
    })

    if (!response.ok) {
      const errorBody = await response.text()
      logger.httpError('Failed to fetch user info', {
        url,
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated,
        errorBody,
        context: 'fetchUserInfo',
        username
      })

      throw new Error(GENERIC_SERVER_ERROR)
    }

    const data: ApiUserProfileResponse = await response.json()
    if (!data.data) {
      throw new Error(GENERIC_SERVER_ERROR)
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
    const session = await getSession()
    const isAuthenticated = !!session.accessToken

    // Always use OAuth endpoint (works with both user and app tokens)
    const baseUrl = REDDIT_API_URL
    const url = new URL(`${baseUrl}/user/${username}/submitted.json`)

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
      headers: await getHeaders(isAuthenticated),
      next: {revalidate: FIVE_MINUTES}
    })

    if (!response.ok) {
      const errorBody = await response.text()
      logger.httpError('Failed to fetch user posts', {
        url: url.toString(),
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated,
        errorBody,
        context: 'fetchUserPosts',
        username,
        sort
      })

      throw new Error(GENERIC_SERVER_ERROR)
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
    const session = await getSession()
    const isAuthenticated = !!session.accessToken

    // Always use OAuth endpoint (works with both user and app tokens)
    const baseUrl = REDDIT_API_URL
    const url = new URL(`${baseUrl}/user/${username}/comments.json`)

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
      headers: await getHeaders(isAuthenticated),
      next: {revalidate: FIVE_MINUTES}
    })

    if (!response.ok) {
      const errorBody = await response.text()
      logger.httpError('Failed to fetch user comments', {
        url: url.toString(),
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated,
        errorBody,
        context: 'fetchUserComments',
        username,
        sort
      })

      throw new Error(GENERIC_SERVER_ERROR)
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
    const session = await getSession()
    const isAuthenticated = !!session.accessToken

    // Always use OAuth endpoint (works with both user and app tokens)
    const baseUrl = REDDIT_API_URL
    const url = new URL(`${baseUrl}/search.json`)

    url.searchParams.set('q', query)
    url.searchParams.set('limit', DEFAULT_POST_LIMIT.toString())
    url.searchParams.set('raw_json', '1')
    url.searchParams.set('include_over_18', 'on')
    if (after) {
      url.searchParams.set('after', after)
    }

    const response = await fetch(url.toString(), {
      headers: await getHeaders(isAuthenticated),
      next: {revalidate: FIVE_MINUTES}
    })

    if (!response.ok) {
      const errorBody = await response.text()
      logger.httpError('Search request failed', {
        url: url.toString(),
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated,
        errorBody,
        context: 'searchReddit',
        query
      })

      throw new Error(GENERIC_SERVER_ERROR)
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

  try {
    const session = await getSession()
    const isAuthenticated = !!session.accessToken

    const params = new URLSearchParams({
      query,
      limit: '10',
      include_over_18: 'true',
      include_profiles: 'false',
      typeahead_active: 'true'
    })

    const url = `${REDDIT_API_URL}/api/subreddit_autocomplete_v2.json?${params}`
    const response = await fetch(url, {
      headers: await getHeaders(isAuthenticated),
      next: {revalidate: 60}
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
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(await getHeaders(true)),
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
    const session = await getSession()
    if (!session.accessToken) {
      throw new Error(GENERIC_SERVER_ERROR)
    }

    const headers = await getHeaders(true)

    const url = new URL(`${REDDIT_API_URL}/user/${username}/saved.json`)
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

    const response = await retryWithBackoff(
      () =>
        fetch(url.toString(), {
          headers,
          next: {revalidate: FIVE_MINUTES}
        }),
      3
    )

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

    const response = await fetch(url, {
      headers: await getHeaders(true),
      next: {revalidate: TEN_MINUTES}
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
