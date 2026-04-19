'use server'

import {getSession} from '@/lib/auth/session'
import {logger} from '@/lib/axiom/server'
import type {
  ApiSubredditPostsResponse,
  CommentSortOption,
  RedditComment,
  RedditPost,
  SortOption,
  TimeFilter
} from '@/lib/types/reddit'
import {
  CACHE_COMMENTS,
  CACHE_POSTS,
  CACHE_USER_INFO,
  DEFAULT_POST_LIMIT
} from '@/lib/utils/constants'
import {RedditAPIError} from '@/lib/utils/errors'
import {
  buildFeedUrlPath,
  isValidPostId,
  isValidSubredditName,
  isValidUsername
} from '@/lib/utils/reddit-helpers'
import {
  GENERIC_SERVER_ERROR,
  getHeaders,
  getRequestMetadata,
  handleFetchError,
  validateRedditUrl
} from './_helpers'

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
 */
export async function fetchPosts(
  subreddit: string = 'popular',
  sort: SortOption = 'hot',
  after?: string,
  timeFilter?: TimeFilter
): Promise<{posts: RedditPost[]; after: string | null}> {
  try {
    const {headers, baseUrl} = await getHeaders()

    let urlPath: string
    try {
      urlPath = buildFeedUrlPath(baseUrl, subreddit, sort)
    } catch (error) {
      logger.error('Invalid subreddit parameter', {
        error: error instanceof Error ? error.message : String(error),
        context: 'fetchPosts',
        subreddit
      })
      throw new Error(GENERIC_SERVER_ERROR)
    }

    const url = new URL(urlPath)
    validateRedditUrl(url.toString())

    if (after) {
      url.searchParams.set('after', after)
    }
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
      await handleFetchError(response, url, 'fetchPosts', subreddit)
    }

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

    return {posts, after: afterCursor}
  } catch (error) {
    logger.error('Error fetching posts', {
      error: error instanceof Error ? error.message : String(error),
      context: 'fetchPosts'
    })
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
 */
export async function fetchPost(
  subreddit: string,
  postId: string,
  sort: CommentSortOption = 'best'
): Promise<{post: RedditPost; comments: RedditComment[]}> {
  try {
    if (
      !isValidSubredditName(subreddit) &&
      subreddit !== 'home' &&
      !subreddit.startsWith('user/')
    ) {
      logger.error('Invalid subreddit parameter', {
        context: 'fetchPost',
        subreddit
      })
      throw new Error(GENERIC_SERVER_ERROR)
    }

    if (!isValidPostId(postId)) {
      logger.error('Invalid post ID parameter', {context: 'fetchPost', postId})
      throw new Error(GENERIC_SERVER_ERROR)
    }

    const [session, {headers, baseUrl}] = await Promise.all([
      getSession(),
      getHeaders()
    ])
    const isAuthenticated = !!session.accessToken
    const url = `${baseUrl}/r/${subreddit}/comments/${postId}.json?raw_json=1&sort=${sort}`
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

      logger.error('Failed to fetch post', {
        url,
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated,
        errorBody,
        context: 'fetchPost',
        postId,
        subreddit,
        ...requestMetadata
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

    return {post, comments}
  } catch (error) {
    logger.error('Error fetching post', {
      error: error instanceof Error ? error.message : String(error),
      context: 'fetchPost'
    })
    throw error
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
 */
export async function fetchUserPosts(
  username: string,
  sort: SortOption = 'new',
  after?: string,
  timeFilter?: TimeFilter
): Promise<{posts: RedditPost[]; after: string | null}> {
  try {
    if (!isValidUsername(username)) {
      logger.error('Invalid username parameter', {
        context: 'fetchUserPosts',
        username
      })
      throw new Error(GENERIC_SERVER_ERROR)
    }

    const [session, {headers, baseUrl}] = await Promise.all([
      getSession(),
      getHeaders()
    ])
    const isAuthenticated = !!session.accessToken
    const url = new URL(`${baseUrl}/user/${username}/submitted.json`)
    validateRedditUrl(url.toString())

    url.searchParams.set('limit', DEFAULT_POST_LIMIT.toString())
    url.searchParams.set('raw_json', '1')
    url.searchParams.set('sort', sort)

    if (after) {
      url.searchParams.set('after', after)
    }
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

      logger.error('Failed to fetch user posts', {
        url: url.toString(),
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated,
        errorBody,
        context: 'fetchUserPosts',
        username,
        sort,
        ...requestMetadata
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

    return {posts, after: afterCursor}
  } catch (error) {
    logger.error('Error fetching user posts', {
      error: error instanceof Error ? error.message : String(error),
      context: 'fetchUserPosts'
    })
    throw error
  }
}
