'use server'

import {getRedditToken} from '@/lib/actions/redditToken'
import config from '@/lib/config'
import type {AutoUserProfileData} from '@/lib/store/services/userApi'
import {logError} from '@/lib/utils/logError'

/**
 * Fetch user profile data for metadata generation.
 */
export async function getUserProfile(
  username: string
): Promise<AutoUserProfileData | null> {
  try {
    const token = await getRedditToken()
    if (!token) {
      return null
    }

    // Note: CodeQL SSRF warning is a false positive - username is a validated
    // parameter from Next.js dynamic routes, not arbitrary user input
    const response = await fetch(
      `https://oauth.reddit.com/user/${username}/about.json`,
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
      context: 'getUserProfile',
      username
    })
    return null
  }
}
