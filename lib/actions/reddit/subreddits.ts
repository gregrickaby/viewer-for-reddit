'use server'

import {logger} from '@/lib/axiom/server'
import type {
  ApiSubredditAboutResponse,
  RedditSubreddit,
  RedditSubscriptionsResponse
} from '@/lib/types/reddit'
import {
  CACHE_SUBREDDIT_INFO,
  CACHE_SUBSCRIPTIONS,
  REDDIT_API_URL
} from '@/lib/utils/constants'
import {RedditAPIError} from '@/lib/utils/errors'
import {isValidSubredditName} from '@/lib/utils/reddit-helpers'
import {
  GENERIC_ACTION_ERROR,
  GENERIC_SERVER_ERROR,
  getHeaders,
  getRequestMetadata,
  validateRedditUrl
} from './_helpers'

/**
 * Fetch information about a subreddit.
 * Server Action with Next.js fetch caching.
 * Results cached for 1 hour.
 *
 * @param subreddit - Subreddit name
 * @returns Promise resolving to subreddit metadata
 */
export async function fetchSubredditInfo(
  subreddit: string
): Promise<RedditSubreddit> {
  try {
    if (!isValidSubredditName(subreddit)) {
      logger.error('Invalid subreddit parameter', {
        context: 'fetchSubredditInfo',
        subreddit
      })
      throw new Error(GENERIC_SERVER_ERROR)
    }

    const {headers, baseUrl, isAuthenticated} = await getHeaders()
    const url = new URL(`${baseUrl}/r/${subreddit}/about.json`)
    url.searchParams.set('raw_json', '1')
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

      logger.error('Failed to fetch subreddit info', {
        url: url.toString(),
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated,
        errorBody,
        context: 'fetchSubredditInfo',
        subreddit,
        ...requestMetadata
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
    logger.error('Error fetching subreddit info', {
      error: error instanceof Error ? error.message : String(error),
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
    const {headers, isAuthenticated} = await getHeaders()
    if (!isAuthenticated) {
      return []
    }

    const allSubscriptions: Array<{
      name: string
      displayName: string
      icon: string
      subscribers: number
    }> = []
    let after: string | null = null

    do {
      const url = new URL(`${REDDIT_API_URL}/subreddits/mine/subscriber.json`)
      url.searchParams.set('limit', '100')
      url.searchParams.set('raw_json', '1')
      if (after) {
        url.searchParams.set('after', after)
      }

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
          {context: 'fetchUserSubscriptions'}
        )
        break
      }

      const data = (await response.json()) as RedditSubscriptionsResponse
      const subscriptions = data.data.children.map((child) => ({
        name: child.data.display_name,
        displayName: child.data.display_name_prefixed,
        icon: child.data.icon_img || child.data.community_icon || '',
        subscribers: child.data.subscribers || 0
      }))

      allSubscriptions.push(...subscriptions)
      after = data.data?.after || null
    } while (after)

    logger.debug('Fetched all subscriptions successfully', {
      count: allSubscriptions.length
    })

    return allSubscriptions
  } catch (error) {
    logger.error('Error fetching subscriptions', {
      error: error instanceof Error ? error.message : String(error),
      context: 'fetchUserSubscriptions'
    })
    return []
  }
}

/**
 * Subscribe or unsubscribe from a subreddit.
 * Server Action for toggling subreddit subscriptions.
 *
 * @param subredditName - Subreddit name (without 'r/' prefix)
 * @param action - 'sub' to subscribe, 'unsub' to unsubscribe
 * @returns Promise resolving to success status and optional error message
 */
export async function toggleSubscription(
  subredditName: string,
  action: 'sub' | 'unsub'
): Promise<{success: boolean; error?: string}> {
  try {
    if (!isValidSubredditName(subredditName)) {
      logger.error('Invalid subreddit name', {
        context: 'toggleSubscription',
        subredditName
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const {headers, isAuthenticated} = await getHeaders()
    if (!isAuthenticated) {
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    logger.debug('Toggling subscription', {subreddit: subredditName, action})

    const formData = new URLSearchParams({
      action,
      sr_name: subredditName
    })

    const url = `${REDDIT_API_URL}/api/subscribe`
    validateRedditUrl(url)

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
      logger.error('Subscription toggle request failed', {
        url,
        method: 'POST',
        status: response.status,
        statusText: response.statusText,
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
    logger.error('Error toggling subscription', {
      error: error instanceof Error ? error.message : String(error),
      context: 'toggleSubscription',
      subreddit: subredditName,
      action
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}
