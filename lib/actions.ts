'use server'

import config from '@/lib/config'
import { RedditOAuthResponse, RedditSearchResponse } from '@/types/reddit'

/**
 * Fetch a Reddit oAuth token.
 *
 * @see https://github.com/reddit-archive/reddit/wiki/OAuth2#application-only-oauth
 */
export async function fetchToken(): Promise<RedditOAuthResponse> {
  try {
    // Fetch the Reddit oAuth token.
    const response = await fetch(
      'https://www.reddit.com/api/v1/access_token?grant_type=client_credentials&device_id=DO_NOT_TRACK_THIS_DEVICE',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': config.userAgent,
          Authorization: `Basic ${btoa(
            `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
          )}`
        },
        next: {
          tags: ['token'],
          revalidate: config.cacheTtl
        }
      }
    )

    // Bad response? Bail.
    if (!response.ok) {
      throw new Error('Failed to fetch Reddit oAuth Token.')
    }

    // Parse the response.
    const data = (await response.json()) as RedditOAuthResponse

    // If the response is empty, bail.
    if (!data.access_token) {
      throw new Error(data.error)
    }

    // Return the token.
    return {
      access_token: data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      scope: data.scope
    }
  } catch (error) {
    console.error(`Exception thrown in fetchToken(): ${error}`)
    return {
      access_token: '',
      token_type: '',
      expires_in: 0,
      scope: '',
      error: `${error}`
    }
  }
}

/**
 * Fetch search results.
 */
export async function fetchSearchResults(
  query: string
): Promise<RedditSearchResponse> {
  try {
    // Get the access token.
    const { access_token } = await fetchToken()

    // Attempt to fetch subreddits.
    const response = await fetch(
      `https://oauth.reddit.com/api/subreddit_autocomplete_v2?query=${query}&limit=10&include_over_18=true&include_profiles=false&typeahead_active=true&search_query_id=DO_NOT_TRACK`,
      {
        headers: {
          authorization: `Bearer ${access_token}`
        },
        next: {
          revalidate: config.cacheTtl
        }
      }
    )
    // Bad response? Bail.
    if (!response.ok) {
      throw new Error(`Failed to fetch search results. ${response.statusText}`)
    }

    // Parse the response.
    const data = (await response.json()) as RedditSearchResponse

    // If the response is empty, bail.
    if (!data.data) {
      throw new Error('Failed to parse search results.')
    }

    // Return the search results.
    return data
  } catch (error) {
    console.error(`Exception thrown in fetchSearchResults(): ${error}`)
    return {
      data: {
        after: '',
        children: []
      }
    }
  }
}
