'use server'

import config from '@/lib/config'
import {TokenResponse} from '@/lib/types/token'
import {logError} from '@/lib/utils/logError'
import {
  getCachedToken,
  incrementRequestCount,
  setTokenState,
  shouldFetchNewToken
} from '@/lib/utils/token'

/**
 * Fetches a new application-only Reddit OAuth token.
 *
 * Used to authenticate read-only requests to Reddit. Token expires in 24 hours,
 * but we proactively rotate based on request count to avoid hitting the limit.
 *
 * @returns {Promise<TokenResponse>} The OAuth token response.
 * @throws {Error} If the token request fails or if the response is invalid.
 *
 * @see https://github.com/reddit-archive/reddit/wiki/OAuth2#application-only-oauth
 */
export async function fetchToken(): Promise<TokenResponse | null> {
  try {
    const clientId = process.env.REDDIT_CLIENT_ID
    const clientSecret = process.env.REDDIT_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error('Missing Reddit ENV variables')
    }

    const encodedCredentials = btoa(`${clientId}:${clientSecret}`)

    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': config.userAgent,
        Authorization: `Basic ${encodedCredentials}`
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        device_id: 'DO_NOT_TRACK_THIS_DEVICE'
      })
    })

    if (!response.ok) {
      throw new Error(
        `Failed to fetch Reddit OAuth token: ${response.statusText}`
      )
    }

    const data = (await response.json()) as TokenResponse

    if (!data.access_token || !data.expires_in) {
      throw new Error(data.error ?? 'Invalid token response')
    }

    return data
  } catch (error) {
    logError(error)
    return null
  }
}

/**
 * Returns a cached Reddit OAuth token or fetches a new one if needed.
 *
 * Tracks token usage and rotates proactively before reaching Reddit's request cap.
 * If a new token cannot be fetched, returns null and logs the error.
 *
 * @returns A valid Reddit OAuth token, or null if unable to obtain one.
 */
export async function getRedditToken(): Promise<TokenResponse | null> {
  if (!shouldFetchNewToken()) {
    incrementRequestCount()
    return getCachedToken()
  }

  const token = await fetchToken()

  if (!token?.access_token) {
    logError('Failed to fetch Reddit OAuth token')
    return null
  }

  setTokenState(token)
  return token
}
