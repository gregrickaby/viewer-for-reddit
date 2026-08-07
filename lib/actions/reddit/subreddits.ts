'use server'

import {getRedditContext} from '@/lib/auth/reddit-context'
import {logger} from '@/lib/datadog/server'
import type {
  ApiSubredditAboutResponse,
  RedditSubreddit,
  RedditSubscriptionsResponse
} from '@/lib/types/reddit'
import {
  CACHE_SUBREDDIT_INFO,
  CACHE_SUBSCRIPTIONS,
  PAGINATION_MAX_LIMIT
} from '@/lib/utils/constants'
import {getErrorMessage} from '@/lib/utils/errors'
import {
  isValidProfileSubredditName,
  isValidSubredditName
} from '@/lib/utils/reddit-helpers'
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
    if (
      !isValidSubredditName(subreddit) &&
      !isValidProfileSubredditName(subreddit)
    ) {
      logger.error('Invalid subreddit parameter', {
        context: 'fetchSubredditInfo',
        subreddit
      })
      throw new Error(GENERIC_SERVER_ERROR)
    }

    const data = await redditFetch<ApiSubredditAboutResponse>(
      `/r/${subreddit}/about.json`,
      {
        cache: {
          revalidate: CACHE_SUBREDDIT_INFO,
          tags: ['subreddit', subreddit]
        },
        operation: 'fetchSubredditInfo',
        resource: subreddit
      }
    )

    const subredditData = data.data as RedditSubreddit

    return subredditData
  } catch (error) {
    logger.error('Error fetching subreddit info', {
      error: getErrorMessage(error),
      context: 'fetchSubredditInfo'
    })
    throw error
  }
}

/**
 * Fetch ALL authenticated user's subreddit subscriptions.
 * Server Action with Next.js fetch caching.
 * Results cached for 10 minutes. Returns empty array when not authenticated.
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
    const {headers, baseUrl} = await getRedditContext()

    const allSubscriptions: Array<{
      name: string
      displayName: string
      icon: string
      subscribers: number
    }> = []
    let after: string | null = null

    do {
      const url = new URL(`${baseUrl}/subreddits/mine/subscriber.json`)
      url.searchParams.set('limit', PAGINATION_MAX_LIMIT.toString())
      url.searchParams.set('raw_json', '1')
      if (after) {
        url.searchParams.set('after', after)
      }

      const response = await circuitProtectedFetch(url.toString(), {
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

    return allSubscriptions
  } catch (error) {
    logger.error('Error fetching subscriptions', {
      error: getErrorMessage(error),
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

    const {headers, baseUrl} = await getRedditContext()

    const formData = new URLSearchParams({
      action,
      sr_name: subredditName
    })

    const url = `${baseUrl}/api/subscribe`
    assertRedditUrl(url)

    const response = await circuitProtectedFetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    })

    if (!response.ok) {
      await logFailedResponse(response, url, 'POST', 'toggleSubscription', {
        subreddit: subredditName,
        action
      })
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    updateTag('subscriptions')

    return {success: true}
  } catch (error) {
    logger.error('Error toggling subscription', {
      error: getErrorMessage(error),
      context: 'toggleSubscription',
      subreddit: subredditName,
      action
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}
