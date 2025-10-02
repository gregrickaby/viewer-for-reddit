'use server'

import {getRedditToken} from '@/lib/actions/redditToken'
import config from '@/lib/config'
import type {AutoPostChildData} from '@/lib/store/services/postsApi'
import {logError} from '@/lib/utils/logError'

/**
 * Fetch post data for metadata generation.
 */
export async function getSinglePost(
  subreddit: string,
  postId: string
): Promise<AutoPostChildData | null> {
  try {
    const token = await getRedditToken()
    if (!token) {
      return null
    }

    const response = await fetch(
      `https://oauth.reddit.com/r/${subreddit}/comments/${postId}.json`,
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
