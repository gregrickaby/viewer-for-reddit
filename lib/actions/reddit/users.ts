'use server'

import {getRedditContext} from '@/lib/auth/reddit-context'
import {logger} from '@/lib/datadog/server'
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
  PAGINATION_MAX_LIMIT
} from '@/lib/utils/constants'
import {getErrorMessage} from '@/lib/utils/errors'
import {isValidFullname, isValidUsername} from '@/lib/utils/reddit-helpers'
import {updateTag} from 'next/cache'
import {
  GENERIC_ACTION_ERROR,
  GENERIC_SERVER_ERROR,
  assertRedditUrl,
  circuitProtectedFetch,
  logFailedResponse
} from './_helpers'
import {redditFetch} from './redditFetch'

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

    const data = await redditFetch<ApiUserProfileResponse>(
      `/user/${username}/about.json`,
      {
        cache: {revalidate: CACHE_USER_INFO, tags: ['user', username]},
        operation: 'fetchUserInfo',
        resource: username
      }
    )

    if (!data.data) {
      logger.error('Invalid user data response', {
        data,
        context: 'fetchUserInfo',
        username
      })
      throw new Error(GENERIC_SERVER_ERROR)
    }

    const userData = data.data as RedditUser

    return userData
  } catch (error) {
    logger.error('Error fetching user info', {
      error: getErrorMessage(error),
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
    const {username} = await getRedditContext()
    if (!username) {
      return null
    }

    const userInfo = await fetchUserInfo(username)
    return userInfo.icon_img || null
  } catch (error) {
    logger.error('Error fetching current user avatar', {
      error: getErrorMessage(error),
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

    const data = await redditFetch<RedditListing<RedditComment>>(
      `/user/${username}/comments.json`,
      {
        searchParams,
        cache: {revalidate: CACHE_USER_INFO, tags: ['user-comments', username]},
        operation: 'fetchUserComments',
        resource: username
      }
    )

    const comments = data.data?.children?.map((child) => child.data) ?? []
    const afterCursor = data.data?.after ?? null

    return {comments, after: afterCursor}
  } catch (error) {
    logger.error('Error fetching user comments', {
      error: getErrorMessage(error),
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

    const {headers, baseUrl} = await getRedditContext()

    const url = new URL(`${baseUrl}/user/${username}/saved.json`)
    assertRedditUrl(url.toString())

    url.searchParams.set('limit', PAGINATION_MAX_LIMIT.toString())
    url.searchParams.set('raw_json', '1')
    if (after) {
      url.searchParams.set('after', after)
    }

    const response = await circuitProtectedFetch(url.toString(), {
      headers,
      next: {
        revalidate: CACHE_USER_INFO,
        tags: ['saved', username]
      }
    })

    if (!response.ok) {
      await logFailedResponse(
        response,
        url.toString(),
        'GET',
        'fetchSavedItems',
        {
          username,
          after
        }
      )
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

    return {items, after: data.data?.after || null}
  } catch (error) {
    logger.error('Error fetching saved items', {
      error: getErrorMessage(error),
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
 * Results cached for 10 minutes. Returns empty array when not authenticated.
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
    const {headers, baseUrl} = await getRedditContext()

    const url = `${baseUrl}/api/v1/me/friends`
    assertRedditUrl(url)

    const response = await circuitProtectedFetch(url, {
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

    return following
  } catch (error) {
    logger.error('Error fetching followed users', {
      error: getErrorMessage(error),
      context: 'fetchFollowedUsers'
    })
    return []
  }
}

/**
 * Follow a Reddit user.
 * Server Action -- requires `subscribe` OAuth scope.
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

    const {headers, baseUrl} = await getRedditContext()

    const url = `${baseUrl}/api/v1/me/friends/${encodeURIComponent(username)}`
    assertRedditUrl(url)

    const response = await circuitProtectedFetch(url, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({name: username})
    })

    if (!response.ok) {
      await logFailedResponse(response, url, 'PUT', 'followUser', {username})
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    updateTag('following')
    return {success: true}
  } catch (error) {
    logger.error('Error following user', {
      error: getErrorMessage(error),
      context: 'followUser',
      username
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}

/**
 * Unfollow a Reddit user.
 * Server Action -- requires `subscribe` OAuth scope.
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

    const {headers, baseUrl} = await getRedditContext()

    const url = `${baseUrl}/api/v1/me/friends/${encodeURIComponent(username)}`
    assertRedditUrl(url)

    const response = await circuitProtectedFetch(url, {
      method: 'DELETE',
      headers
    })

    if (!response.ok) {
      await logFailedResponse(response, url, 'DELETE', 'unfollowUser', {
        username
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    updateTag('following')
    return {success: true}
  } catch (error) {
    logger.error('Error unfollowing user', {
      error: getErrorMessage(error),
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

    const {headers, baseUrl} = await getRedditContext()

    const endpoint = save ? 'save' : 'unsave'
    const url = `${baseUrl}/api/${endpoint}`
    assertRedditUrl(url)

    const res = await circuitProtectedFetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({id: postName})
    })

    if (!res.ok) {
      await logFailedResponse(res, url, 'POST', 'savePost', {
        postName,
        action: save ? 'save' : 'unsave'
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    updateTag('saved')

    return {success: true}
  } catch (error) {
    logger.error('Error saving', {
      error: getErrorMessage(error),
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

    const {headers, baseUrl} = await getRedditContext()

    const url = `${baseUrl}/api/vote`
    assertRedditUrl(url)

    const res = await circuitProtectedFetch(url, {
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
      await logFailedResponse(res, url, 'POST', 'votePost', {
        postName,
        direction
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    return {success: true}
  } catch (error) {
    logger.error('Error voting', {
      error: getErrorMessage(error),
      context: 'votePost'
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}
