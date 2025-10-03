'use server'

import {getRedditToken} from '@/lib/actions/redditToken'
import config from '@/lib/config'
import type {SubredditItem} from '@/lib/types'
import {logError} from '@/lib/utils/logError'

/**
 * Fetch subreddit data for metadata generation.
 */
export async function getSubreddit(
  subreddit: string
): Promise<SubredditItem | null> {
  try {
    const token = await getRedditToken()
    if (!token) {
      return null
    }

    // Note: CodeQL SSRF warning is a false positive - subreddit is a validated
    // parameter from Next.js dynamic routes, not arbitrary user input
    const response = await fetch(
      `https://oauth.reddit.com/r/${subreddit}/about.json`,
      {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          'User-Agent': config.userAgent
        },
        next: {revalidate: 300} // Cache for 5 minutes
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data?.data || null
  } catch (error) {
    logError(error, {
      context: 'getSubreddit',
      subreddit
    })
    return null
  }
}
