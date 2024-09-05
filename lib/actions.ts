'use server'

import config from '@/lib/config'
import {
  FetchSubredditProps,
  RedditAboutResponse,
  RedditPostResponse,
  RedditSearchResponse,
  RedditTokenResponse
} from '@/lib/types'

/**
 * Validate environment variables.
 */
function validateEnvVars() {
  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Missing Reddit environment variables!')
  }

  return {clientId, clientSecret}
}

/**
 * Fetch a Reddit oAuth token.
 *
 * @see https://github.com/reddit-archive/reddit/wiki/OAuth2#application-only-oauth
 */
export async function fetchToken(): Promise<RedditTokenResponse> {
  try {
    // Get the client ID and secret.
    const {clientId, clientSecret} = validateEnvVars()

    // Build the URL.
    const url = new URL('https://www.reddit.com/api/v1/access_token')

    // Build the query parameters.
    url.searchParams.append('grant_type', 'client_credentials')
    url.searchParams.append('scope', 'read')
    url.searchParams.append('device_id', 'DO_NOT_TRACK_THIS_DEVICE')

    // Fetch the Reddit oAuth token.
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': config.userAgent,
        Authorization: `Basic ${Buffer.from(
          `${clientId}:${clientSecret}`
        ).toString('base64')}`
      },
      next: {
        tags: ['token'],
        revalidate: 86400 // 24 hours.
      }
    })

    // Bad response? Bail.
    if (!response.ok) {
      throw new Error('Failed to fetch Reddit oAuth Token.')
    }

    // Parse the response.
    const data: RedditTokenResponse = await response.json()

    // If the response is empty, bail.
    if (!data.access_token) {
      throw new Error(data.error || 'No access token in response')
    }

    return data
  } catch (error) {
    console.error(`Exception thrown in fetchToken(): ${error}`)
    return {error: `${error}`}
  }
}

/**
 * Fetch search results.
 *
 * @see https://www.reddit.com/dev/api/oauth#GET_api_subreddit_autocomplete_v2
 */
export async function fetchSearchResults(
  query: string
): Promise<RedditSearchResponse> {
  try {
    // Get the access token result.
    const {access_token} = await fetchToken()

    // No token? Bail.
    if (!access_token) {
      throw new Error('Failed to fetch Reddit oAuth Token.')
    }

    // Build the search URL.
    const url = new URL(
      'https://oauth.reddit.com/api/subreddit_autocomplete_v2'
    )

    // Append query parameters.
    url.searchParams.append('query', encodeURIComponent(query.trim()))
    url.searchParams.append('limit', '10')
    url.searchParams.append('include_over_18', 'true')
    url.searchParams.append('include_profiles', 'false')
    url.searchParams.append('typeahead_active', 'true')
    url.searchParams.append('search_query_id', 'DO_NOT_TRACK')

    // Attempt to fetch subreddits.
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': config.userAgent,
        Authorization: `Bearer ${access_token}`
      },
      next: {
        tags: [`search-${query}`],
        revalidate: 86400 // 24 hours.
      }
    })

    // Bad response? Bail.
    if (!response.ok) {
      throw new Error(`Failed to fetch search results. ${response.statusText}`)
    }

    // Parse the response.
    const data: RedditSearchResponse = await response.json()

    // If the response is empty, bail.
    if (!data.data) {
      throw new Error('Failed to parse search results.')
    }

    // Return the search results.
    return data
  } catch (error) {
    console.error(`Exception thrown in fetchSearchResults(): ${error}`)
    return {error: `${error}`}
  }
}

/**
 * Fetch subreddit posts.
 */
export async function fetchSubredditPosts(
  props: FetchSubredditProps
): Promise<RedditPostResponse> {
  try {
    // Fetch the Reddit oAuth token.
    const {access_token} = await fetchToken()

    // No token? Bail.
    if (!access_token) {
      throw new Error('Failed to fetch Reddit oAuth Token.')
    }

    // Destructure and validate props.
    let {slug, sort, limit = 10, after = ''} = props

    // Validate sort.
    const validSorts = ['hot', 'new', 'top', 'rising']
    if (!validSorts.includes(sort)) {
      throw new Error(
        `Invalid sort parameter. Allowed values: ${validSorts.join(', ')}.`
      )
    }

    // Validate limit.
    if (limit < 1 || limit > 100) {
      throw new Error(
        `Invalid limit parameter. Allowed values: 1-100. ${limit}`
      )
    }

    // Validate after param (ensure it's alphanumeric or empty).
    if (after && !/^[a-zA-Z0-9_]+$/.test(after)) {
      throw new Error(`Invalid after parameter. Must be alphanumeric. ${after}`)
    }

    // Build the URL.
    const url = new URL(`https://oauth.reddit.com/r/${slug}/${sort}/.json`)

    // Append query parameters.
    const searchParams = new URLSearchParams({
      limit: limit.toString(),
      after,
      raw_json: '1'
    })
    url.search = searchParams.toString()

    // Fetch subreddit posts.
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': config.userAgent,
        Authorization: `Bearer ${access_token}`
      },
      next: {
        tags: [`posts-${slug}-${sort}-${limit}-${after}`],
        revalidate: config.cacheTtl
      }
    })

    // Extract and log rate limit headers.
    const rateLimitUsed = response.headers.get('X-Ratelimit-Used')
    const rateLimitRemaining = response.headers.get('X-Ratelimit-Remaining')
    const rateLimitReset = response.headers.get('X-Ratelimit-Reset')

    // Bad response? Bail.
    if (!response.ok) {
      throw new Error(
        `Failed to fetch subreddit posts. ${response.statusText} | Rate Limit Used: ${rateLimitUsed}, Remaining: ${rateLimitRemaining}, Resets in: ${rateLimitReset} seconds`
      )
    }
    // Parse the response.
    const data: RedditPostResponse = await response.json()

    // If the response is empty, bail.
    if (!data.data) {
      throw new Error('Failed to parse subreddit response.')
    }

    // Filter out unwanted posts (exclude self/stickied posts).
    const filteredChildren = data.data.children.filter(
      ({data}) =>
        data.post_hint && data.post_hint !== 'self' && !data.poststickied
    )

    // Return the posts.
    return {
      kind: data.kind,
      data: {
        modhash: data.data.modhash,
        dist: data.data.dist,
        children: filteredChildren,
        after: data.data.after,
        before: data.data.before
      }
    }
  } catch (error) {
    console.error(`Exception thrown in fetchSubredditPosts(): ${error}`)
    return {error: `${error}`}
  }
}

/**
 * Fetch subreddit about information.
 *
 * @see https://www.reddit.com/dev/api/oauth#GET_r_{subreddit}_about
 */
export async function fetchSubredditAbout(
  slug: string
): Promise<RedditAboutResponse> {
  try {
    // Fetch the Reddit oAuth token.
    const {access_token} = await fetchToken()

    // No token? Bail.
    if (!access_token) {
      throw new Error('Failed to fetch Reddit oAuth Token.')
    }

    // Validate and sanitize the slug prop.
    slug = encodeURIComponent(slug.trim())

    // Build the URL.
    const url = new URL(`https://oauth.reddit.com/r/${slug}/about/.json`)

    // Fetch the subreddit about information.
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': config.userAgent,
        Authorization: `Bearer ${access_token}`
      },
      next: {
        tags: [`about-${slug}`],
        revalidate: 86400 // 24 hours.
      }
    })

    // Bad response? Bail.
    if (!response.ok) {
      throw new Error(` ${response.statusText}: /r/${slug}`)
    }

    // Parse the response.
    const data: RedditAboutResponse = await response.json()

    // If the response is empty, bail.
    if (!data.data) {
      throw new Error('Failed to parse subreddit about response.')
    }

    // Return the about information.
    return data
  } catch (error) {
    console.error(`Exception thrown in fetchSubredditAbout(): ${error}`)
    return {error: `${error}`}
  }
}
