'use server'

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
import {
  isValidMultiredditPath,
  isValidPostId,
  isValidSubredditName,
  isValidUsername
} from '@/lib/utils/reddit-helpers'
import {GENERIC_SERVER_ERROR} from './_helpers'
import {redditFetch} from './redditFetch'

/**
 * Build the relative URL path for a subreddit feed, home feed, or multireddit.
 * Validates the subreddit input to prevent SSRF and path traversal.
 *
 * @param subreddit - Subreddit name, 'home', empty string, or multireddit path
 * @param sort - Feed sort order
 * @returns Relative URL path starting with '/'
 * @throws {Error} If subreddit name or multireddit path is invalid
 */
function buildFeedRelativePath(subreddit: string, sort: string): string {
  if (subreddit === '' || subreddit === 'home') {
    return `/${sort}.json`
  }

  if (subreddit.startsWith('user/')) {
    if (!isValidMultiredditPath(subreddit)) {
      throw new Error('Invalid multireddit path format')
    }
    return `/${subreddit}/${sort}.json`
  }

  if (!isValidSubredditName(subreddit)) {
    throw new Error('Invalid subreddit name')
  }

  return `/r/${subreddit}/${sort}.json`
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
 */
export async function fetchPosts(
  subreddit: string = 'popular',
  sort: SortOption = 'hot',
  after?: string,
  timeFilter?: TimeFilter
): Promise<{posts: RedditPost[]; after: string | null}> {
  try {
    let path: string
    try {
      path = buildFeedRelativePath(subreddit, sort)
    } catch (error) {
      logger.error('Invalid subreddit parameter', {
        error: error instanceof Error ? error.message : String(error),
        context: 'fetchPosts',
        subreddit
      })
      throw new Error(GENERIC_SERVER_ERROR)
    }

    const searchParams: Record<string, string> = {
      limit: DEFAULT_POST_LIMIT.toString()
    }
    if (after) {
      searchParams.after = after
    }
    if (timeFilter && (sort === 'top' || sort === 'controversial')) {
      searchParams.t = timeFilter
    }

    const data = await redditFetch<ApiSubredditPostsResponse>(path, {
      searchParams,
      cache: {revalidate: CACHE_POSTS, tags: ['posts', subreddit]},
      operation: 'fetchPosts',
      resource: subreddit
    })

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

    const [postData, commentsData] = await redditFetch<
      [ApiSubredditPostsResponse, ApiSubredditPostsResponse]
    >(`/r/${subreddit}/comments/${postId}.json`, {
      searchParams: {sort},
      cache: {revalidate: CACHE_COMMENTS, tags: ['post', postId]},
      operation: 'fetchPost',
      resource: `${subreddit}/${postId}`
    })

    const post = postData.data?.children?.[0]?.data as RedditPost
    const rawComments = commentsData.data?.children ?? []
    const comments = rawComments
      .filter((child) => child.kind === 't1' && child.data !== undefined)
      .map((child) => child.data as RedditComment)

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

    const searchParams: Record<string, string> = {
      limit: DEFAULT_POST_LIMIT.toString(),
      sort
    }
    if (after) {
      searchParams.after = after
    }
    if (timeFilter && (sort === 'top' || sort === 'controversial')) {
      searchParams.t = timeFilter
    }

    const data = await redditFetch<ApiSubredditPostsResponse>(
      `/user/${username}/submitted.json`,
      {
        searchParams,
        cache: {revalidate: CACHE_USER_INFO, tags: ['user-posts', username]},
        operation: 'fetchUserPosts',
        resource: username
      }
    )

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
