'use server'

import {logger} from '@/lib/axiom/server'
import type {
  ApiSubredditPostsResponse,
  ApiUserProfileResponse,
  RedditComment,
  RedditFollowedUsersResponse,
  RedditListing,
  RedditPost,
  RedditUser,
  SavedItem,
  SortOption,
  TimeFilter
} from '@/lib/types/reddit'
import {
  CACHE_SUBSCRIPTIONS,
  CACHE_USER_INFO,
  DEFAULT_POST_LIMIT,
  REDDIT_API_URL
} from '@/lib/utils/constants'
import {RedditAPIError} from '@/lib/utils/errors'
import {isValidFullname, isValidUsername} from '@/lib/utils/reddit-helpers'
import {revalidatePath} from 'next/cache'
import {
  GENERIC_ACTION_ERROR,
  GENERIC_SERVER_ERROR,
  getHeaders,
  getRequestMetadata,
  validateRedditUrl
} from './_helpers'

/**
 * Fetch Reddit user profile information.
 * Server Action with Next.js fetch caching.
 * Results cached for 5 minutes.
 *
 * @param username - Reddit username (without 'u/' prefix)
 * @returns Promise resolving to user profile data
 */
export async function fetchUserInfo(username: string): Promise<RedditUser> {
  try {
    if (!isValidUsername(username)) {
      logger.error('Invalid username parameter', {
        context: 'fetchUserInfo',
        username
      })
      throw new Error(GENERIC_SERVER_ERROR)
    }

    const {headers, baseUrl, isAuthenticated} = await getHeaders()
    const url = `${baseUrl}/user/${username}/about.json?raw_json=1`
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

      logger.error('Failed to fetch user info', {
        url,
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated,
        errorBody,
        context: 'fetchUserInfo',
        username,
        ...requestMetadata
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
      logger.error('Invalid user data response', {
        data,
        context: 'fetchUserInfo',
        username
      })
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
    logger.error('Error fetching user info', {
      error: error instanceof Error ? error.message : String(error),
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
 */
export async function getCurrentUserAvatar(): Promise<string | null> {
  try {
    const {isAuthenticated, username} = await getHeaders()
    if (!isAuthenticated || !username) {
      return null
    }

    const userInfo = await fetchUserInfo(username)
    return userInfo.icon_img || null
  } catch (error) {
    logger.error('Error fetching current user avatar', {
      error: error instanceof Error ? error.message : String(error),
      context: 'getCurrentUserAvatar'
    })
    return null
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
 */
export async function fetchUserComments(
  username: string,
  sort: SortOption = 'new',
  after?: string,
  timeFilter?: TimeFilter
): Promise<{comments: RedditComment[]; after: string | null}> {
  try {
    if (!isValidUsername(username)) {
      logger.error('Invalid username parameter', {
        context: 'fetchUserComments',
        username
      })
      throw new Error(GENERIC_SERVER_ERROR)
    }

    const {headers, baseUrl, isAuthenticated} = await getHeaders()
    const url = new URL(`${baseUrl}/user/${username}/comments.json`)
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
        tags: ['user-comments', username]
      }
    })

    if (!response.ok) {
      const errorBody = await response.text()
      const requestMetadata = await getRequestMetadata()

      logger.error('Failed to fetch user comments', {
        url: url.toString(),
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated,
        errorBody,
        context: 'fetchUserComments',
        username,
        sort,
        ...requestMetadata
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

    const data = (await response.json()) as RedditListing<RedditComment>
    const comments = (data.data?.children?.map((child) => child.data) ??
      []) as RedditComment[]
    const afterCursor = data.data?.after ?? null

    logger.debug('Fetched user comments successfully', {
      username,
      sort,
      count: comments.length,
      hasMore: !!afterCursor
    })

    return {comments, after: afterCursor}
  } catch (error) {
    logger.error('Error fetching user comments', {
      error: error instanceof Error ? error.message : String(error),
      context: 'fetchUserComments'
    })
    throw error
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
 */
export async function fetchSavedItems(
  username: string,
  after?: string
): Promise<{items: SavedItem[]; after: string | null}> {
  try {
    if (!isValidUsername(username)) {
      logger.error('Invalid username parameter', {
        context: 'fetchSavedItems',
        username
      })
      throw new Error(GENERIC_SERVER_ERROR)
    }

    const {headers, isAuthenticated} = await getHeaders()
    if (!isAuthenticated) {
      throw new Error(GENERIC_SERVER_ERROR)
    }

    const url = new URL(`${REDDIT_API_URL}/user/${username}/saved.json`)
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
      logger.error('Failed to fetch saved items', {
        url: url.toString(),
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        errorBody,
        context: 'fetchSavedItems',
        username,
        after
      })

      throw new Error(GENERIC_SERVER_ERROR)
    }

    const data: ApiSubredditPostsResponse = await response.json()

    const allChildren = data.data?.children || []
    const items: SavedItem[] = allChildren
      .filter((child) => {
        if (child.kind === 't3') {
          return !(child.data as RedditPost).stickied
        }
        if (child.kind === 't1') {
          return !(child.data as RedditComment).stickied
        }
        return false
      })
      .map((child) => {
        if (child.kind === 't3') {
          return {type: 'post' as const, data: child.data as RedditPost}
        }
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

    return {items, after: data.data?.after || null}
  } catch (error) {
    logger.error('Error fetching saved items', {
      error: error instanceof Error ? error.message : String(error),
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
    const {headers, isAuthenticated} = await getHeaders()
    if (!isAuthenticated) {
      return []
    }

    const url = `${REDDIT_API_URL}/api/v1/me/friends`
    validateRedditUrl(url)

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
        {context: 'fetchFollowedUsers'}
      )
      return []
    }

    const data = (await response.json()) as RedditFollowedUsersResponse

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
    logger.error('Error fetching followed users', {
      error: error instanceof Error ? error.message : String(error),
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
 */
export async function followUser(
  username: string
): Promise<{success: boolean; error?: string}> {
  try {
    if (!isValidUsername(username)) {
      logger.error('Invalid username parameter', {
        context: 'followUser',
        username
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const {headers, isAuthenticated} = await getHeaders()
    if (!isAuthenticated) {
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const url = `${REDDIT_API_URL}/api/v1/me/friends/${encodeURIComponent(username)}`
    validateRedditUrl(url)

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
      logger.error('Follow user request failed', {
        url,
        method: 'PUT',
        status: response.status,
        statusText: response.statusText,
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
    logger.error('Error following user', {
      error: error instanceof Error ? error.message : String(error),
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
 */
export async function unfollowUser(
  username: string
): Promise<{success: boolean; error?: string}> {
  try {
    if (!isValidUsername(username)) {
      logger.error('Invalid username parameter', {
        context: 'unfollowUser',
        username
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const {headers, isAuthenticated} = await getHeaders()
    if (!isAuthenticated) {
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const url = `${REDDIT_API_URL}/api/v1/me/friends/${encodeURIComponent(username)}`
    validateRedditUrl(url)

    const response = await fetch(url, {
      method: 'DELETE',
      headers
    })

    if (!response.ok) {
      const errorBody = await response.text()
      logger.error('Unfollow user request failed', {
        url,
        method: 'DELETE',
        status: response.status,
        statusText: response.statusText,
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
    logger.error('Error unfollowing user', {
      error: error instanceof Error ? error.message : String(error),
      context: 'unfollowUser',
      username
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}

/**
 * Save or unsave a Reddit post.
 * Server Action. Requires authentication.
 *
 * @param postName - Full Reddit thing name (e.g., 't3_abc123')
 * @param save - True to save, false to unsave
 * @returns Promise resolving to success status and optional error message
 */
export async function savePost(
  postName: string,
  save: boolean
): Promise<{success: boolean; error?: string}> {
  try {
    if (!isValidFullname(postName)) {
      logger.error('Invalid post fullname', {context: 'savePost', postName})
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const {headers, isAuthenticated, username} = await getHeaders()
    if (!isAuthenticated) {
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const endpoint = save ? 'save' : 'unsave'
    const url = `${REDDIT_API_URL}/api/${endpoint}`
    validateRedditUrl(url)

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({id: postName})
    })

    if (!res.ok) {
      const errorBody = await res.text()
      logger.error('Save/unsave request failed', {
        url,
        method: 'POST',
        status: res.status,
        statusText: res.statusText,
        errorBody,
        context: 'savePost',
        postName,
        action: save ? 'save' : 'unsave'
      })

      throw new Error(GENERIC_ACTION_ERROR)
    }

    logger.debug('Save/unsave successful', {postName, save})

    if (username) {
      revalidatePath(`/user/${username}/saved`)
    }

    return {success: true}
  } catch (error) {
    logger.error('Error saving', {
      error: error instanceof Error ? error.message : String(error),
      context: 'savePost'
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}

/**
 * Cast a vote on a Reddit post or comment.
 * Server Action. Requires authentication.
 *
 * @param postName - Full Reddit thing name (e.g., 't3_abc123', 't1_xyz789')
 * @param direction - Vote direction: 1 (upvote), 0 (remove vote), -1 (downvote)
 * @returns Promise resolving to success status and optional error message
 */
export async function votePost(
  postName: string,
  direction: 1 | 0 | -1
): Promise<{success: boolean; error?: string}> {
  try {
    if (!isValidFullname(postName)) {
      logger.error('Invalid post fullname', {context: 'votePost', postName})
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const {headers, isAuthenticated} = await getHeaders()
    if (!isAuthenticated) {
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const url = `${REDDIT_API_URL}/api/vote`
    validateRedditUrl(url)

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
      logger.error('Vote request failed', {
        url,
        method: 'POST',
        status: res.status,
        statusText: res.statusText,
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
    logger.error('Error voting', {
      error: error instanceof Error ? error.message : String(error),
      context: 'votePost'
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}
