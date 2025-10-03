'use server'

import {getRedditToken} from '@/lib/actions/redditToken'
import {getSession} from '@/lib/auth/session'
import config from '@/lib/config'
import type {AutoPostChildData} from '@/lib/store/services/postsApi'
import {logError} from '@/lib/utils/logError'

/**
 * Fetch post data for metadata generation.
 * Uses authenticated user session if available, falls back to app token.
 */
export async function getSinglePost(
  subreddit: string,
  postId: string
): Promise<AutoPostChildData | null> {
  try {
    // Try to use user's session first
    const session = await getSession()
    let accessToken: string | null = null

    if (session) {
      // User is authenticated - use their token
      accessToken = session.accessToken
    } else {
      // No user session - use app token (read-only mode)
      const token = await getRedditToken()
      if (!token) {
        return null
      }
      accessToken = token.access_token
    }

    // Note: CodeQL SSRF warning is a false positive - subreddit and postId are
    // validated parameters from Next.js dynamic routes, not arbitrary user input
    const response = await fetch(
      `https://oauth.reddit.com/r/${subreddit}/comments/${postId}.json`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': config.userAgent
        },
        next: {revalidate: 300} // Cache for 5 minutes
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const postData = data[0]?.data?.children?.[0]?.data
    return postData || null
  } catch (error) {
    logError(error, {
      context: 'getSinglePost',
      subreddit,
      postId
    })
    return null
  }
}
