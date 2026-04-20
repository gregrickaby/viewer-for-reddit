'use server'

import {logger} from '@/lib/axiom/server'
import type {RedditMultiredditResponse} from '@/lib/types/reddit'
import {CACHE_SUBSCRIPTIONS, REDDIT_API_URL} from '@/lib/utils/constants'
import {
  isValidMultiredditPath,
  isValidSubredditName,
  isValidUsername
} from '@/lib/utils/reddit-helpers'
import {revalidatePath} from 'next/cache'
import {GENERIC_ACTION_ERROR, getHeaders, validateRedditUrl} from './_helpers'

// Validation regex for multireddit URL slugs (3-50 word chars)
const MULTI_NAME_PATTERN = /^\w{3,50}$/

/**
 * Fetch authenticated user's custom multireddits.
 * Server Action with Next.js fetch caching.
 * Results cached for 10 minutes. Returns empty array for unauthenticated users.
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
    const {headers, isAuthenticated} = await getHeaders()
    if (!isAuthenticated) {
      return []
    }

    const url = `${REDDIT_API_URL}/api/multi/mine`
    validateRedditUrl(url)

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
      error: error instanceof Error ? error.message : String(error),
      context: 'fetchMultireddits'
    })
    return []
  }
}

/**
 * Create a new multireddit for the authenticated user.
 * Server Action — requires `mysubreddits` OAuth scope.
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

    const {headers, isAuthenticated} = await getHeaders()
    if (!isAuthenticated) {
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const url = `${REDDIT_API_URL}/api/multi`
    validateRedditUrl(url)

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
      logger.error('Create multireddit request failed', {
        url,
        method: 'POST',
        status: response.status,
        statusText: response.statusText,
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
    logger.error('Error creating multireddit', {
      error: error instanceof Error ? error.message : String(error),
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
 */
export async function deleteMultireddit(
  multiPath: string
): Promise<{success: boolean; error?: string}> {
  try {
    const normalizedPath = multiPath.replaceAll(/(?:^\/)|(\/$)/g, '')
    if (!isValidMultiredditPath(normalizedPath)) {
      logger.error('Invalid multireddit path', {
        context: 'deleteMultireddit',
        multiPath
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const {headers, isAuthenticated} = await getHeaders()
    if (!isAuthenticated) {
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const url = `${REDDIT_API_URL}/api/multi/${normalizedPath}`
    validateRedditUrl(url)

    const response = await fetch(url, {method: 'DELETE', headers})

    if (!response.ok) {
      const errorBody = await response.text()
      logger.error('Delete multireddit request failed', {
        url,
        method: 'DELETE',
        status: response.status,
        statusText: response.statusText,
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
    logger.error('Error deleting multireddit', {
      error: error instanceof Error ? error.message : String(error),
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

    const normalizedPath = multiPath.replaceAll(/(?:^\/)|(\/$)/g, '')
    if (!isValidMultiredditPath(normalizedPath)) {
      logger.error('Invalid multireddit path', {
        context: 'updateMultiredditName',
        multiPath
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const {headers, isAuthenticated} = await getHeaders()
    if (!isAuthenticated) {
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const url = `${REDDIT_API_URL}/api/multi/${normalizedPath}`
    validateRedditUrl(url)

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
      logger.error('Update multireddit name request failed', {
        url,
        method: 'PUT',
        status: response.status,
        statusText: response.statusText,
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
    logger.error('Error updating multireddit name', {
      error: error instanceof Error ? error.message : String(error),
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
 */
export async function addSubredditToMultireddit(
  multiPath: string,
  subredditName: string
): Promise<{success: boolean; error?: string}> {
  try {
    const normalizedPath = multiPath.replaceAll(/(?:^\/)|(\/$)/g, '')
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

    const {headers, isAuthenticated} = await getHeaders()
    if (!isAuthenticated) {
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const url = `${REDDIT_API_URL}/api/multi/${normalizedPath}/r/${encodeURIComponent(cleanSubreddit)}`
    validateRedditUrl(url)

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
      logger.error('Add subreddit to multireddit request failed', {
        url,
        method: 'PUT',
        status: response.status,
        statusText: response.statusText,
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
    logger.error('Error adding subreddit to multireddit', {
      error: error instanceof Error ? error.message : String(error),
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
 */
export async function removeSubredditFromMultireddit(
  multiPath: string,
  subredditName: string
): Promise<{success: boolean; error?: string}> {
  try {
    const normalizedPath = multiPath.replaceAll(/(?:^\/)|(\/$)/g, '')
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

    const {headers, isAuthenticated} = await getHeaders()
    if (!isAuthenticated) {
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const url = `${REDDIT_API_URL}/api/multi/${normalizedPath}/r/${encodeURIComponent(cleanSubreddit)}`
    validateRedditUrl(url)

    const response = await fetch(url, {method: 'DELETE', headers})

    if (!response.ok) {
      const errorBody = await response.text()
      logger.error('Remove subreddit from multireddit request failed', {
        url,
        method: 'DELETE',
        status: response.status,
        statusText: response.statusText,
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
    logger.error('Error removing subreddit from multireddit', {
      error: error instanceof Error ? error.message : String(error),
      context: 'removeSubredditFromMultireddit',
      multiPath
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}

/**
 * Add a user to a multireddit via their user profile subreddit (u_username).
 * Server Action — requires `mysubreddits` OAuth scope.
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
    const normalizedPath = multiPath.replaceAll(/(?:^\/)|(\/$)/g, '')
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

    const {headers, isAuthenticated} = await getHeaders()
    if (!isAuthenticated) {
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const userSubreddit = `u_${cleanUsername}`
    const url = `${REDDIT_API_URL}/api/multi/${normalizedPath}/r/${encodeURIComponent(userSubreddit)}`
    validateRedditUrl(url)

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
      const errorBody = await response.text()
      logger.error('Add user to multireddit request failed', {
        url,
        method: 'PUT',
        status: response.status,
        statusText: response.statusText,
        errorBody,
        context: 'addUserToMultireddit',
        multiPath,
        username: cleanUsername
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    revalidatePath('/', 'layout')
    logger.debug('Added user to multireddit successfully', {
      multiPath,
      username: cleanUsername
    })
    return {success: true}
  } catch (error) {
    logger.error('Error adding user to multireddit', {
      error: error instanceof Error ? error.message : String(error),
      context: 'addUserToMultireddit',
      multiPath
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}

/**
 * Remove a user from a multireddit via their user profile subreddit (u_username).
 * Server Action — requires `mysubreddits` OAuth scope.
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
    const normalizedPath = multiPath.replaceAll(/(?:^\/)|(\/$)/g, '')
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

    const {headers, isAuthenticated} = await getHeaders()
    if (!isAuthenticated) {
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const userSubreddit = `u_${cleanUsername}`
    const url = `${REDDIT_API_URL}/api/multi/${normalizedPath}/r/${encodeURIComponent(userSubreddit)}`
    validateRedditUrl(url)

    const response = await fetch(url, {method: 'DELETE', headers})

    if (!response.ok) {
      const errorBody = await response.text()
      logger.error('Remove user from multireddit request failed', {
        url,
        method: 'DELETE',
        status: response.status,
        statusText: response.statusText,
        errorBody,
        context: 'removeUserFromMultireddit',
        multiPath,
        username: cleanUsername
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    revalidatePath('/', 'layout')
    logger.debug('Removed user from multireddit successfully', {
      multiPath,
      username: cleanUsername
    })
    return {success: true}
  } catch (error) {
    logger.error('Error removing user from multireddit', {
      error: error instanceof Error ? error.message : String(error),
      context: 'removeUserFromMultireddit',
      multiPath
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}
