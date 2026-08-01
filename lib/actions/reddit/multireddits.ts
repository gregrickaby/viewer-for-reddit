'use server'

import {getRedditContext} from '@/lib/auth/reddit-context'
import {logger} from '@/lib/datadog/server'
import type {RedditMultiredditResponse} from '@/lib/types/reddit'
import {CACHE_SUBSCRIPTIONS} from '@/lib/utils/constants'
import {getErrorMessage} from '@/lib/utils/errors'
import {
  MULTI_NAME_PATTERN,
  isValidMultiredditPath,
  isValidSubredditName,
  isValidUsername
} from '@/lib/utils/reddit-helpers'
import {updateTag} from 'next/cache'
import {
  GENERIC_ACTION_ERROR,
  assertRedditUrl,
  logFailedResponse
} from './_helpers'

/**
 * Strip leading and trailing slashes from a multireddit path so it can be
 * validated and appended to the API base URL consistently.
 *
 * @param multiPath - Raw multireddit path (may have surrounding slashes)
 * @returns Normalized path without leading/trailing slashes
 */
function normalizeMultiPath(multiPath: string): string {
  return multiPath.replaceAll(/(?:^\/)|(\/$)/g, '')
}

/**
 * Builds a `/api/multi/{path}` URL, optionally scoped to a member subreddit
 * (`/r/{subredditName}`) for add/remove-subreddit and add/remove-user calls.
 *
 * @param baseUrl - Reddit API base URL
 * @param normalizedPath - Multireddit path without surrounding slashes
 * @param subredditName - Optional member subreddit name (already encode-safe)
 * @returns Fully qualified multireddit API URL
 */
function buildMultiUrl(
  baseUrl: string,
  normalizedPath: string,
  subredditName?: string
): string {
  const base = `${baseUrl}/api/multi/${normalizedPath}`
  return subredditName ? `${base}/r/${encodeURIComponent(subredditName)}` : base
}

/**
 * Converts a Reddit username into its profile subreddit name (`u_username`),
 * used to add/remove a user from a multireddit via the subreddit-member API.
 *
 * @param username - Reddit username without the 'u/' prefix
 * @returns The `u_{username}` synthetic subreddit name
 */
function toUserSubredditName(username: string): string {
  return `u_${username}`
}

/**
 * Fetch authenticated user's custom multireddits.
 * Server Action with Next.js fetch caching.
 * Results cached for 10 minutes. Returns empty array when not authenticated.
 *
 * @returns Promise resolving to array of multireddit objects
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
    const {headers, baseUrl} = await getRedditContext()

    const url = `${baseUrl}/api/multi/mine`
    assertRedditUrl(url)

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
        {context: 'fetchMultireddits'}
      )
      return []
    }

    const data = (await response.json()) as RedditMultiredditResponse

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
    logger.error('Error fetching multireddits', {
      error: getErrorMessage(error),
      context: 'fetchMultireddits'
    })
    return []
  }
}

/**
 * Create a new multireddit for the authenticated user.
 * Server Action -- requires `mysubreddits` OAuth scope.
 *
 * @param name - URL slug for the multireddit (3-50 word characters)
 * @param displayName - Human-readable display name (1-50 characters)
 * @returns Promise resolving to success status, new path, and optional error
 */
export async function createMultireddit(
  name: string,
  displayName: string
): Promise<{success: boolean; path?: string; error?: string}> {
  try {
    const cleanName = name.trim()
    const cleanDisplayName = displayName.trim()

    if (!MULTI_NAME_PATTERN.test(cleanName)) {
      logger.error('Invalid multireddit name', {
        context: 'createMultireddit',
        name: cleanName
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    if (!cleanDisplayName || cleanDisplayName.length > 50) {
      logger.error('Invalid multireddit display name', {
        context: 'createMultireddit'
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const {headers, baseUrl} = await getRedditContext()

    const url = `${baseUrl}/api/multi`
    assertRedditUrl(url)

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
      await logFailedResponse(response, url, 'POST', 'createMultireddit', {
        name: cleanName
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const data: {data?: {path?: string}} = await response.json()
    const path = data.data?.path

    updateTag('multireddits')
    logger.debug('Created multireddit successfully', {name: cleanName, path})
    return {success: true, path}
  } catch (error) {
    logger.error('Error creating multireddit', {
      error: getErrorMessage(error),
      context: 'createMultireddit'
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}

/**
 * Delete a multireddit owned by the authenticated user.
 * Server Action -- requires `mysubreddits` OAuth scope.
 *
 * @param multiPath - Multireddit path (e.g., '/user/username/m/multiname')
 * @returns Promise resolving to success status and optional error
 */
export async function deleteMultireddit(
  multiPath: string
): Promise<{success: boolean; error?: string}> {
  try {
    const normalizedPath = normalizeMultiPath(multiPath)
    if (!isValidMultiredditPath(normalizedPath)) {
      logger.error('Invalid multireddit path', {
        context: 'deleteMultireddit',
        multiPath
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const {headers, baseUrl} = await getRedditContext()

    const url = buildMultiUrl(baseUrl, normalizedPath)
    assertRedditUrl(url)

    const response = await fetch(url, {method: 'DELETE', headers})

    if (!response.ok) {
      await logFailedResponse(response, url, 'DELETE', 'deleteMultireddit', {
        multiPath
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    updateTag('multireddits')
    logger.debug('Deleted multireddit successfully', {multiPath})
    return {success: true}
  } catch (error) {
    logger.error('Error deleting multireddit', {
      error: getErrorMessage(error),
      context: 'deleteMultireddit',
      multiPath
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}

/**
 * Update a multireddit's display name.
 * Server Action -- requires `mysubreddits` OAuth scope.
 *
 * @param multiPath - Multireddit path (e.g., '/user/username/m/multiname')
 * @param displayName - New human-readable display name (1-50 characters)
 * @returns Promise resolving to success status and optional error
 */
export async function updateMultiredditName(
  multiPath: string,
  displayName: string
): Promise<{success: boolean; error?: string}> {
  try {
    const cleanDisplayName = displayName.trim()
    if (!cleanDisplayName || cleanDisplayName.length > 50) {
      logger.error('Invalid multireddit display name', {
        context: 'updateMultiredditName'
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const normalizedPath = normalizeMultiPath(multiPath)
    if (!isValidMultiredditPath(normalizedPath)) {
      logger.error('Invalid multireddit path', {
        context: 'updateMultiredditName',
        multiPath
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const {headers, baseUrl} = await getRedditContext()

    const url = buildMultiUrl(baseUrl, normalizedPath)
    assertRedditUrl(url)

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
      await logFailedResponse(response, url, 'PUT', 'updateMultiredditName', {
        multiPath
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    updateTag('multireddits')
    logger.debug('Updated multireddit name successfully', {
      multiPath,
      displayName: cleanDisplayName
    })
    return {success: true}
  } catch (error) {
    logger.error('Error updating multireddit name', {
      error: getErrorMessage(error),
      context: 'updateMultiredditName',
      multiPath
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}

/**
 * Add a subreddit to a multireddit.
 * Server Action -- requires `mysubreddits` OAuth scope.
 *
 * @param multiPath - Multireddit path (e.g., '/user/username/m/multiname')
 * @param subredditName - Subreddit name to add (without 'r/' prefix)
 * @returns Promise resolving to success status and optional error
 */
export async function addSubredditToMultireddit(
  multiPath: string,
  subredditName: string
): Promise<{success: boolean; error?: string}> {
  try {
    const normalizedPath = normalizeMultiPath(multiPath)
    if (!isValidMultiredditPath(normalizedPath)) {
      logger.error('Invalid multireddit path', {
        context: 'addSubredditToMultireddit',
        multiPath
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const cleanSubreddit = subredditName.trim().replace(/^r\//, '')
    if (!isValidSubredditName(cleanSubreddit)) {
      logger.error('Invalid subreddit name', {
        context: 'addSubredditToMultireddit',
        subredditName: cleanSubreddit
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const {headers, baseUrl} = await getRedditContext()

    const url = buildMultiUrl(baseUrl, normalizedPath, cleanSubreddit)
    assertRedditUrl(url)

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
      await logFailedResponse(
        response,
        url,
        'PUT',
        'addSubredditToMultireddit',
        {multiPath, subredditName: cleanSubreddit}
      )
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    updateTag('multireddits')
    logger.debug('Added subreddit to multireddit successfully', {
      multiPath,
      subredditName: cleanSubreddit
    })
    return {success: true}
  } catch (error) {
    logger.error('Error adding subreddit to multireddit', {
      error: getErrorMessage(error),
      context: 'addSubredditToMultireddit',
      multiPath
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}

/**
 * Remove a subreddit from a multireddit.
 * Server Action -- requires `mysubreddits` OAuth scope.
 *
 * @param multiPath - Multireddit path (e.g., '/user/username/m/multiname')
 * @param subredditName - Subreddit name to remove (without 'r/' prefix)
 * @returns Promise resolving to success status and optional error
 */
export async function removeSubredditFromMultireddit(
  multiPath: string,
  subredditName: string
): Promise<{success: boolean; error?: string}> {
  try {
    const normalizedPath = normalizeMultiPath(multiPath)
    if (!isValidMultiredditPath(normalizedPath)) {
      logger.error('Invalid multireddit path', {
        context: 'removeSubredditFromMultireddit',
        multiPath
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const cleanSubreddit = subredditName.trim().replace(/^r\//, '')
    if (!isValidSubredditName(cleanSubreddit)) {
      logger.error('Invalid subreddit name', {
        context: 'removeSubredditFromMultireddit',
        subredditName: cleanSubreddit
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const {headers, baseUrl} = await getRedditContext()

    const url = buildMultiUrl(baseUrl, normalizedPath, cleanSubreddit)
    assertRedditUrl(url)

    const response = await fetch(url, {method: 'DELETE', headers})

    if (!response.ok) {
      await logFailedResponse(
        response,
        url,
        'DELETE',
        'removeSubredditFromMultireddit',
        {multiPath, subredditName: cleanSubreddit}
      )
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    updateTag('multireddits')
    logger.debug('Removed subreddit from multireddit successfully', {
      multiPath,
      subredditName: cleanSubreddit
    })
    return {success: true}
  } catch (error) {
    logger.error('Error removing subreddit from multireddit', {
      error: getErrorMessage(error),
      context: 'removeSubredditFromMultireddit',
      multiPath
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}

/**
 * Add a user to a multireddit via their user profile subreddit (u_username).
 * Server Action -- requires `mysubreddits` OAuth scope.
 *
 * @param multiPath - Multireddit path (e.g., '/user/username/m/multiname')
 * @param username - Reddit username to add (without 'u/' prefix)
 * @returns Promise resolving to success status and optional error
 */
export async function addUserToMultireddit(
  multiPath: string,
  username: string
): Promise<{success: boolean; error?: string}> {
  try {
    const normalizedPath = normalizeMultiPath(multiPath)
    if (!isValidMultiredditPath(normalizedPath)) {
      logger.error('Invalid multireddit path', {
        context: 'addUserToMultireddit',
        multiPath
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const cleanUsername = username.trim().replace(/^u\//, '')
    if (!isValidUsername(cleanUsername)) {
      logger.error('Invalid username', {
        context: 'addUserToMultireddit',
        username: cleanUsername
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const {headers, baseUrl} = await getRedditContext()

    const userSubreddit = toUserSubredditName(cleanUsername)
    const url = buildMultiUrl(baseUrl, normalizedPath, userSubreddit)
    assertRedditUrl(url)

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        model: JSON.stringify({name: userSubreddit})
      })
    })

    if (!response.ok) {
      await logFailedResponse(response, url, 'PUT', 'addUserToMultireddit', {
        multiPath,
        username: cleanUsername
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    updateTag('multireddits')
    logger.debug('Added user to multireddit successfully', {
      multiPath,
      username: cleanUsername
    })
    return {success: true}
  } catch (error) {
    logger.error('Error adding user to multireddit', {
      error: getErrorMessage(error),
      context: 'addUserToMultireddit',
      multiPath
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}

/**
 * Remove a user from a multireddit via their user profile subreddit (u_username).
 * Server Action -- requires `mysubreddits` OAuth scope.
 *
 * @param multiPath - Multireddit path (e.g., '/user/username/m/multiname')
 * @param username - Reddit username to remove (without 'u/' prefix)
 * @returns Promise resolving to success status and optional error
 */
export async function removeUserFromMultireddit(
  multiPath: string,
  username: string
): Promise<{success: boolean; error?: string}> {
  try {
    const normalizedPath = normalizeMultiPath(multiPath)
    if (!isValidMultiredditPath(normalizedPath)) {
      logger.error('Invalid multireddit path', {
        context: 'removeUserFromMultireddit',
        multiPath
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const cleanUsername = username.trim().replace(/^u\//, '')
    if (!isValidUsername(cleanUsername)) {
      logger.error('Invalid username', {
        context: 'removeUserFromMultireddit',
        username: cleanUsername
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const {headers, baseUrl} = await getRedditContext()

    const userSubreddit = toUserSubredditName(cleanUsername)
    const url = buildMultiUrl(baseUrl, normalizedPath, userSubreddit)
    assertRedditUrl(url)

    const response = await fetch(url, {method: 'DELETE', headers})

    if (!response.ok) {
      await logFailedResponse(
        response,
        url,
        'DELETE',
        'removeUserFromMultireddit',
        {multiPath, username: cleanUsername}
      )
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    updateTag('multireddits')
    logger.debug('Removed user from multireddit successfully', {
      multiPath,
      username: cleanUsername
    })
    return {success: true}
  } catch (error) {
    logger.error('Error removing user from multireddit', {
      error: getErrorMessage(error),
      context: 'removeUserFromMultireddit',
      multiPath
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}
